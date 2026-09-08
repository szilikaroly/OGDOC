/**
 * TITKOSÍTÁS ÉS KULCSKEZELÉS — típusok és szabályok.
 *
 * A modul BORÍTÉKOS titkosítást ír le: az adatot esetenkénti adatkulcs (DEK)
 * védi, a DEK-et pedig egy kulcstitkosító kulcs (KEK) burkolja, ami soha nem
 * hagyja el a kulcskezelőt.
 *
 *     rekord ──AES-256-GCM(DEK)──▶ titkosított bejegyzés
 *     DEK    ──burkolva(KEK)─────▶ burkolt kulcs a bejegyzés mellett
 *     KEK    ──────────────────────▶ HSM/KMS, nem másolható ki
 *
 * MIÉRT ESETENKÉNTI KULCS, ÉS NEM EGY KÖZÖS. Nem a teljesítmény miatt: a
 * KRIPTOGRÁFIAI TÖRLÉS miatt. Egy hidegtári szalagot nem lehet átírni; a
 * beteg törlési kérelmét viszont teljesíteni kell. Ha az esethez saját kulcs
 * tartozik, a KULCS megsemmisítése teszi visszafejthetetlenné az adatot —
 * ez az egyetlen működő válasz arra, hogyan törlünk módosíthatatlan
 * másolatból.
 *
 * ÉS ITT VAN A MODUL LEGFONTOSABB FESZÜLTSÉGE: a kriptográfiai törlés
 * pontosan annyit ér, amennyire biztosak vagyunk benne, hogy a kulcsnak NEM
 * maradt másolata — a kulcsmentésben sem. A kulcs mentése és a törlés
 * követelménye tehát EGYMÁSNAK FESZÜL, és ezt a feszültséget ki kell mondani,
 * nem véletlenül feloldani. A `KeyPolicy.escrowExcluded` ezért kötelező mező.
 */

/**
 * Az algoritmus AZONOSÍTÓJA MINDEN REKORDBAN ott van.
 *
 * Húszéves horizonton biztos, hogy amit ma választunk, az legacy lesz. Egy
 * rekord, ami nem mondja meg, mivel titkosították, tíz év múlva
 * megfejthetetlen — nem a titkosítás, hanem a régészet miatt.
 */
export type CipherId = "AES-256-GCM" | "CHACHA20-POLY1305";

/** A KULCS ÁLLAPOTA. A megsemmisített kulcs nem eltűnik: nyoma marad. */
export type KeyState =
  /** Használható titkosításra és visszafejtésre. */
  | "active"
  /** Csak VISSZAFEJTÉSRE. Új rekord nem készül vele — rotáció után ez a régi. */
  | "retired"
  /** MEGSEMMISÍTVE: a vele védett adat végleg visszafejthetetlen. */
  | "destroyed";

export interface KeyRef {
  /** Kulcsazonosító. NEM titok — a rekord mellett utazik. */
  keyId: string;
  /** Melyik KEK burkolja. */
  kekId: string;
  state: KeyState;
  createdAt: string;
  /** Megsemmisítésnél: mikor és MIÉRT. */
  destroyedAt?: string;
  destroyReason?: string;
}

/** Egy titkosított rekord. Minden mezője nyílt, kivéve a `ct`-t. */
export interface Sealed {
  cipher: CipherId;
  keyId: string;
  /** Egyszer használatos szám, base64. */
  nonce: string;
  /** A rejtjelezett tartalom, base64. */
  ct: string;
  /** A hitelesítő címke, base64. */
  tag: string;
  /**
   * A KÖTÉS: mihez tartozik ez a rekord. NEM titkosított, de HITELESÍTETT —
   * a címke rá is kiterjed, tehát megváltoztatni nem lehet.
   */
  aad: SealBinding;
}

/**
 * AMIHEZ A REJTJELEZETT SZÖVEG HOZZÁ VAN KÖTVE.
 *
 * Enélkül egy titkosított bejegyzés ÁTHELYEZHETŐ: az „A" eset 7. bejegyzését
 * be lehetne illeszteni a „B" esetbe, és hibátlanul visszafejtődne. A kötés
 * ezt lehetetlenné teszi — a címke ellenőrzése megbukik, ha bármelyik mező
 * más.
 */
export interface SealBinding {
  caseId: string;
  seq: number;
  /** A napló láncának előző szeme. */
  prevHash: string;
  formatVersion: number;
}

/* ── KULCSHÁZIREND ──────────────────────────────────────────────────── */

export interface KeyPolicy {
  /** Ennyi naponta cserélünk KEK-et. A csere OLCSÓ: csak újraburkolás. */
  kekRotationDays: number;
  /**
   * Az adatkulcs a napló élettartamára SZÓL, és nem cserélhető. Ez nem
   * lustaság: a lenyomatlánc a REJTJELEZETT alakon fut, tehát az
   * újratitkosítás elszakítaná a láncot. Kulcskompromittálódásnál a válasz
   * nem újratitkosítás, hanem migrációs rekord (ld. `MigrationRecord`).
   */
  dekImmutable: true;
  /** Hány letétkezelő közül hány kell a helyreállításhoz (M-ből N). */
  escrowThreshold: { need: number; of: number };
  /**
   * MELY KULCSOK MARADNAK KI A LETÉTBŐL, és miért.
   *
   * KÖTELEZŐ MEZŐ, akkor is, ha üres — mert ez az a pont, ahol a
   * kulcsmentés és a kriptográfiai törlés egymásnak feszül. Aki minden
   * kulcsot letétbe helyez, az nem tud törölni; aki egyet sem, az nem tud
   * helyreállítani. A döntést ki kell mondani.
   */
  escrowExcluded: Array<{ keyId: string; why: string }>;
}

export interface PolicyIssue { severity: "error" | "warning"; message: string }

export function checkKeyPolicy(p: KeyPolicy): PolicyIssue[] {
  const out: PolicyIssue[] = [];
  const { need, of } = p.escrowThreshold;

  if (need < 2) {
    out.push({ severity: "error",
      message: "EGYETLEN LETÉTKEZELŐ NEM LETÉT. Ha egy ember egyedül vissza " +
               "tudja állítani a kulcsot, akkor egy ember egyedül el is tudja " +
               "vinni az egész adatbázist — és nincs, aki tanú legyen rá." });
  }
  if (need > of) {
    out.push({ severity: "error",
      message: `Teljesíthetetlen küszöb: ${need} letétrész kell ${of}-ból. ` +
               "A kulcs ezzel nem védett, hanem elveszett." });
  }
  if (of - need < 1) {
    out.push({ severity: "error",
      message: `NINCS TARTALÉK: mind a(z) ${of} letétrész kell. Egy ember ` +
               "betegsége, felmondása vagy halála véglegesen elveszíti az " +
               "adatot — a klinikai rendszer élettartama hosszabb, mint a " +
               "munkaviszonyoké." });
  }
  if (p.kekRotationDays > 730) {
    out.push({ severity: "warning",
      message: `A KEK cseréje ${p.kekRotationDays} naponta ritka. A csere ` +
               "OLCSÓ (csak a burkolt adatkulcsokat írjuk újra), a mulasztás " +
               "viszont drága: egy régóta használt kulcs kompromittálódása " +
               "évek adatát érinti." });
  }
  return out;
}

/* ── MIGRÁCIÓ: AMIKOR ÚJRA KELL TITKOSÍTANI ─────────────────────────── */

/**
 * A LÁNC A REJTJELEZETT ALAKON FUT — ez adja azt, hogy a másolat épsége
 * KULCS NÉLKÜL ellenőrizhető. Cserébe az újratitkosítás elszakítja a láncot.
 *
 * Amikor mégis muszáj (kulcskompromittálódás, elavuló algoritmus), nem
 * „csendben átírunk", hanem ÚJ naplót nyitunk, és egy aláírt migrációs
 * rekord köti össze a régi lánc végét az új elejével. Így a folytonosság
 * bizonyítható marad — ez a különbség a migráció és a hamisítás között.
 */
export interface MigrationRecord {
  at: string;
  /** KI rendelte el. „A rendszer" itt sem cselekvő. */
  actor: string;
  reason: "keyCompromise" | "algorithmRetirement" | "policyChange";
  why: string;
  /** A RÉGI lánc utolsó lenyomata. */
  fromHash: string;
  fromCipher: CipherId;
  fromKeyId: string;
  /** Az ÚJ lánc első lenyomata. */
  toHash: string;
  toCipher: CipherId;
  toKeyId: string;
}

export function checkMigration(m: MigrationRecord): string[] {
  const bad: string[] = [];
  if (!m.actor?.trim()) bad.push("hiányzik az elrendelő — a migráció nem történik magától");
  if (!m.why?.trim()) bad.push("hiányzik az indoklás");
  if (m.fromHash === m.toHash) {
    bad.push("a régi és az új lánc lenyomata azonos — ez nem migráció");
  }
  if (m.fromKeyId === m.toKeyId && m.fromCipher === m.toCipher) {
    bad.push("ugyanaz a kulcs és ugyanaz az algoritmus: az újratitkosítás " +
             "értelmetlen, viszont a lánc elszakadt");
  }
  return bad;
}
