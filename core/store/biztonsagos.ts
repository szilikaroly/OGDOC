/**
 * A BIZTONSÁGOS ESETTÁROLÓ — a `13-18-lepes.md` 1. lépése.
 *
 * A `core/store.ts` szándékosan a lehető legkisebb: betölt és ment, védelem
 * nélkül. Ez a réteg az, ami VALÓDI BETEGADAT mellett kötelező, és ami eddig
 * hiányzott. Nem újraírja a meglévőt, hanem összeköti:
 *
 *   `core/journal/`   az eseménysor és a lenyomatlánc
 *   `core/crypto/`    borítéktitkosítás, esetenkénti adatkulccsal
 *   `core/log/`       a kétféle napló, és az auditsor teljessége
 *   `hozzaferes.ts`   ki mihez férhet hozzá, és miért
 *
 * NÉGY SZABÁLY, AMI ITT KÉNYSZERÜL KI
 *
 *   1. JOGOSULTSÁG NÉLKÜL NINCS ADAT. Az elutasítás nem üres eredmény,
 *      hanem megnevezett hiba — és maga is auditsor.
 *   2. AZ AUDITÁLHATATLAN OLVASÁS MEG NEM TÖRTÉNT OLVASÁS. Ha az auditnapló
 *      írása elbukik, a MŰVELET bukik el, és adat nem megy ki.
 *   3. SÉRÜLT LÁNCRA NEM ÍRUNK. A hibás naplóhoz fűzött új bejegyzés a
 *      sérülést teszi hitelessé — a lánc ellenőrzése az írás ELŐFELTÉTELE.
 *   4. A LÁNC VISSZAFEJTÉS NÉLKÜL IS ELLENŐRIZHETŐ. A sorszám és a lenyomat
 *      nyíltan utazik, a tartalom lezárva: az üzemeltető bizonyítani tudja,
 *      hogy az archívum ép, anélkül hogy elolvashatná.
 *
 * AMI ITT SINCS BENNE, MERT NEM IDE VALÓ
 *
 * Hitelesítés. A „ki vagy te” kérdést a gazda válaszolja meg (kártya, SSO,
 * EESZT); ez a réteg a MÁR AZONOSÍTOTT cselekvőről dönt. A kettő
 * összekeverésétől lesz egy hitelesítési hibából csendben jogosultsági hiba.
 */
import { createHash } from "node:crypto";
import type { CaseState } from "../types.ts";
import type { AuditEvent, Sink } from "../log/types.ts";
import { checkAudit } from "../log/types.ts";
import type { JournalEntry } from "../journal/types.ts";
import { GENESIS, JOURNAL_FORMAT, type Durability } from "../journal/types.ts";
import { append, replay, verifyChain, type AppendInput } from "../journal/journal.ts";
import { open, seal } from "../crypto/envelope.ts";
import type { KeyRef, Sealed } from "../crypto/types.ts";
import { decide, type AccessRequest, type CareRelation, type Role } from "./hozzaferes.ts";
import { horgonyBol, type HorgonyTar } from "../pilot/horgony.ts";

/* ── A TÁROLT ALAK ──────────────────────────────────────────────────── */

/**
 * EGY BEJEGYZÉS, AHOGY A LEMEZEN ÁLL.
 *
 * A lánc-metaadat NYÍLT, a tartalom LEZÁRT. A kettéválasztás nem
 * kényelmi: így az archívum épsége ellenőrizhető anélkül, hogy bárki
 * elolvashatná a leletet — az üzemeltetőnek, a mentésellenőrzőnek és a
 * felügyeletnek éppen erre van szüksége.
 *
 * A két ellenőrzés MÁST bizonyít, és ezért kell mindkettő:
 *
 *   a nyílt lánc   → nem töröltek, nem rendeztek át, nem vágták el
 *   az AEAD-címke  → a tartalom nem változott, és nem más esetből való
 */
export interface StoredEntry {
  seq: number;
  entryId: string;
  /** A NYÍLT tartalom lánca — felnyitás után ellenőrizhető. */
  prevHash: string;
  hash: string;
  sealed: Sealed;
  /**
   * A REJTJELEZETT ALAK LÁNCA — kulcs NÉLKÜL ellenőrizhető.
   *
   * Ez a `31-elo-mentes.md` és a `32-titkositas.md` ígérete, és külön lánc
   * kell hozzá: a `core/journal/` lenyomata a NYÍLT bejegyzésre készül (és
   * jól teszi — az bizonyítja a tartalmat), de azt kulcs nélkül senki nem
   * tudja újraszámolni. A kettő MÁST bizonyít, ezért van mindkettő:
   *
   *   nyílt lánc        a tartalom nem változott — felnyitás után
   *   rejtjelezett lánc az archívum nem változott — felnyitás NÉLKÜL
   *
   * A második az, amire az üzemeltetőnek, a mentésellenőrzőnek és az éves
   * épség-ellenőrzésnek szüksége van, és amihez nem szabad kulcsot adni.
   */
  prevSealedHash: string;
  sealedHash: string;
}

/** Determinisztikus sorosítás — a kulcssorrend nem törheti el a láncot. */
function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).filter((k) => o[k] !== undefined).sort()
    .map((k) => JSON.stringify(k) + ":" + stable(o[k])).join(",") + "}";
}

export const ARCHIVE_FORMAT = 1;

/** A rejtjelezett alak láncszeme. A `sealed` MINDEN mezőjére kiterjed. */
export function sealedHash(prev: string, seq: number, sealed: Sealed): string {
  return createHash("sha256")
    .update(`ogdoc-archive-v${ARCHIVE_FORMAT}\n${prev}\n${seq}\n` + stable(sealed))
    .digest("hex");
}

/**
 * A TARTÓS TÁROLÓ SZERZŐDÉSE. Két művelet, és egyik sem felülír.
 *
 * A `save(caseId, state)` alakú tárolót itt szándékosan NEM használjuk: az
 * egész állapot felülírása az eseménysort semmisítené meg, márpedig az
 * eseménysor a rekord, az állapot csak a vetülete.
 */
export interface CaseArchive {
  read(caseId: string): Promise<StoredEntry[]>;
  /** HOZZÁFŰZ. A tartósságot ő tudja megmondani, senki más. */
  append(caseId: string, entries: StoredEntry[]): Promise<Durability>;
}

/** Memóriabeli archívum — teszthez. Újraindítást NEM él túl, és ezt vállalja. */
export class MemoryArchive implements CaseArchive {
  private data = new Map<string, StoredEntry[]>();

  async read(caseId: string): Promise<StoredEntry[]> {
    return [...(this.data.get(caseId) ?? [])];
  }

  async append(caseId: string, entries: StoredEntry[]): Promise<Durability> {
    const cur = this.data.get(caseId) ?? [];
    this.data.set(caseId, [...cur, ...entries]);
    return "buffered";        // memória: a „mentve” szót nem mondhatja ki
  }
}

/**
 * A KULCSTÁR. Esetenkénti adatkulcs — ez teszi lehetővé a kriptográfiai
 * törlést: egy eset kulcsának megsemmisítése pontosan azt az egy esetet
 * teszi visszafejthetetlenné, a láncot és a többi esetet nem bántja.
 */
export interface KeyStore {
  /** `dek: null` = a kulcs megsemmisült. Nem hiba: a törlés így néz ki. */
  dek(caseId: string): { dek: Buffer | null; key: KeyRef };
  /**
   * KRIPTOGRÁFIAI TÖRLÉS. Opcionális — és a hiánya nem apróság: egy kulcstár,
   * ami nem tud megsemmisíteni, nem tud törölni sem. A törlési réteg ezért
   * megnézi, hogy van-e, és blokkoló akadálynak veszi, ha nincs.
   */
  destroy?(caseId: string, why: string): void;
}

/* ── AZ EREDMÉNYEK ──────────────────────────────────────────────────── */

/**
 * A KUDARC MEGNEVEZETT, mert a teendő mind a háromnál más:
 *
 *   denied      jogosultsági kérdés — emberi döntés kell hozzá
 *   corrupt     a lánc sérült — a másolat nem hiteles, mentésből kell
 *   unreadable  a titkosítás nem nyílt fel — kulcskezelési vagy törlési ügy
 */
export type ReadResult =
  | { ok: true; state: CaseState; entries: number; breakGlass: boolean; basis: string }
  | { ok: false; kind: "denied" | "corrupt" | "unreadable"; why: string };

export type WriteResult =
  | { ok: true; seq: number; durability: Durability; basis: string }
  | { ok: false; kind: "denied" | "corrupt" | "unreadable"; why: string };

/** KI végzi a műveletet — a hívó minden hívásnál megadja, alapértelmezés nincs. */
export interface Who {
  actor: string;
  roles: Role[];
  ownCaseIds?: string[];
  breakGlass?: AccessRequest["breakGlass"];
  /** Egy kérés minden naplósorát összefűző azonosító. */
  traceId?: string;
}

export interface StoreOptions {
  archive: CaseArchive;
  keys: KeyStore;
  sink: Sink;
  /**
   * A cselekvők ellátási kapcsolatai. A gazda tartja karban.
   *
   * FÜGGVÉNY IS LEHET, ÉS ÉLES ÜZEMBEN AZ IS KELL. A kapcsolatok túlnyomó
   * része a BEOSZTÁSBÓL származik (`core/auth/csoport.ts`), és a beosztás
   * lejár: aki délelőtt volt beosztva, délután már nem az. Egy induláskor
   * befagyasztott tömb ezt nem tudná követni — a lejárt műszak kapcsolata
   * élne tovább, és pontosan ez a jogosultsági rendszerek leggyakoribb
   * csendes hibája: nem téves engedély, hanem vissza nem vont engedély.
   */
  relations: CareRelation[] | (() => CareRelation[]);
  /** Az idő forrása — teszthez cserélhető, találgatásra nem. */
  now?: () => string;
  /**
   * A NAPLÓ VÉGÉNEK HORGONYA — az archívumon KÍVÜL.
   *
   * Enélkül a levágott vég csendes marad: a rejtjelezett lánc és a nyílt lánc
   * is HIÁNYTALANNAK látja az 1..N-ből megmaradt 1..M-et. Nem kötelező, mert a
   * meglévő telepítéseknek nincs horgonytáruk — de valódi betegadat mellett
   * hiánya azt jelenti, hogy az adatvesztés hiánya nem bizonyítható.
   * L. `core/pilot/horgony.ts`.
   */
  horgony?: HorgonyTar;
}

/* ── A TÁROLÓ ───────────────────────────────────────────────────────── */

export class SecureCaseStore {
  private o: StoreOptions;
  private now: () => string;

  constructor(options: StoreOptions) {
    this.o = options;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  /**
   * AZ AUDITSOR KIÍRÁSA — és ami akkor történik, ha nem sikerül.
   *
   * A `checkAudit` a művelet ELŐTT fut: a hiányos auditsor programozói hiba,
   * nem futásidejű körülmény, ezért dob. A nyelő hibája viszont üzemeltetési
   * körülmény — ott a MŰVELET bukik el, csendben elnyelni nem szabad.
   */
  private emit(e: AuditEvent): void {
    const bad = checkAudit(e);
    if (bad.length) {
      throw new Error(
        `Hiányos auditsor, a művelet nem folytatható: ${bad.join("; ")}. ` +
        `Egy auditnapló, amiből hiányzik a „ki” vagy a „miért”, nem auditnapló.`,
      );
    }
    this.o.sink.audit(e);
  }

  private deny(who: Who, action: AuditEvent["action"], caseId: string, why: string) {
    // AZ ELUTASÍTÁS IS AUDITSOR. Aki hiába próbálkozott, ugyanúgy nyomot hagy —
    // a sikertelen hozzáférési kísérletek mintázata gyakran többet mond,
    // mint a sikeresek.
    this.emit({
      kind: "audit", at: this.now(), actor: who.actor || "(azonosítatlan)",
      action: "denied", caseId, basis: "elutasított hozzáférési kísérlet",
      denyReason: why, traceId: who.traceId,
    });
    this.o.sink.op({
      kind: "op", level: "warn", at: this.now(), where: "store.access",
      message: `elutasított ${action}`, caseId, traceId: who.traceId,
    });
    return { ok: false as const, kind: "denied" as const, why };
  }

  private ask(who: Who, action: AuditEvent["action"], caseId: string) {
    return decide({
      actor: who.actor, roles: who.roles, action, caseId, now: this.now(),
      relations: typeof this.o.relations === "function"
        ? this.o.relations() : this.o.relations,
      ownCaseIds: who.ownCaseIds,
      breakGlass: who.breakGlass,
    });
  }

  /**
   * A LÁNC BETÖLTÉSE ÉS FELNYITÁSA.
   *
   * Sorrend: előbb a NYÍLT lánc (törlés, átrendezés, elvágás), aztán a
   * felnyitás (tartalom, áthelyezés). Fordítva egy törölt bejegyzés
   * észrevétlen maradna, mert a megmaradtak hibátlanul nyílnának fel.
   */
  private async chain(caseId: string):
    Promise<{ ok: true; log: JournalEntry[] } | { ok: false; kind: "corrupt" | "unreadable"; why: string }> {
    const stored = (await this.o.archive.read(caseId)).sort((a, b) => a.seq - b.seq);
    if (!stored.length) return { ok: true, log: [] };

    // 1. A REJTJELEZETT lánc — kulcs nélkül. Ez fogja meg a törlést, az
    //    átrendezést, az elvágást ÉS a tartalom megváltoztatását is, anélkül
    //    hogy bármit felnyitnánk.
    const arc = verifySealedChain(stored, caseId);
    if (!arc.ok) return { ok: false, kind: "corrupt", why: arc.why };

    // 1/b. A HORGONY — ez az EGYETLEN ellenőrzés, ami a levágott véget fogja
    //      meg. A fenti lánc az 1..N-ből megmaradt 1..M-et hiánytalannak
    //      látja, mert a naplóban nincs adat arról, hol ért véget.
    const horgony = this.o.horgony?.read(caseId) ?? null;
    if (horgony && stored[stored.length - 1].seq < horgony.seq) {
      const utolso = stored[stored.length - 1].seq;
      return { ok: false, kind: "corrupt", why:
        `A(z) ${caseId} archívum a(z) ${utolso}. bejegyzésnél ér véget, a ` +
        `horgony viszont a(z) ${horgony.seq}.-at rögzítette: ` +
        `${horgony.seq - utolso} bejegyzés HIÁNYZIK a végéről. A lánc maga ` +
        `hiánytalan — ezt egyedül a horgony mutatja meg. Ez adatvesztés, ` +
        `mentésből kell visszaállítani.` };
    }

    // 2. A nyílt lánc metaadata — a felnyitáshoz ez adja a kötést
    let prevHash = GENESIS;
    let prevSeq = 0;
    for (const s of stored) {
      // AZ ARCHÍVUMBÓL JÖVŐ ADAT KÜLSŐ ADAT. Lehet régi formátumú, lehet
      // félig megírt, lehet rosszindulatú — a hiányzó mező itt megnevezett
      // hiba kell legyen, nem összeomlás a titkosítási rétegben.
      if (!s.sealed?.ct || !s.sealed.aad || typeof s.hash !== "string") {
        return { ok: false, kind: "corrupt", why:
          `A(z) ${caseId} eset ${s.seq}. bejegyzése hiányos: nincs meg a ` +
          `lezárt tartalom vagy a lenyomat. A fájl nem hiteles — mentésből ` +
          `kell visszaállítani.` };
      }
      if (s.seq !== prevSeq + 1) {
        return { ok: false, kind: "corrupt", why:
          `A(z) ${caseId} eset naplójában a sorszám ${prevSeq} után ${s.seq} ` +
          `következik. Hiányzik vagy átrendeződött egy bejegyzés — a másolat ` +
          `nem hiteles, mentésből kell visszaállítani.` };
      }
      if (s.prevHash !== prevHash) {
        return { ok: false, kind: "corrupt", why:
          `A(z) ${caseId} eset naplója a ${s.seq}. bejegyzésnél nem illeszkedik ` +
          `az előzőhöz. Ez két napló összefésülésének nyoma: a bejegyzések ` +
          `egyenként épek lehetnek, a sorozat mégsem hiteles.` };
      }
      prevHash = s.hash;
      prevSeq = s.seq;
    }

    // 3. A felnyitás — a tartalom és a KÖTÉS ellenőrzése
    const { dek, key } = this.o.keys.dek(caseId);
    const log: JournalEntry[] = [];
    for (const s of stored) {
      const r = open<Omit<JournalEntry, "hash">>(s.sealed, dek, key, {
        caseId, seq: s.seq, prevHash: s.prevHash, formatVersion: JOURNAL_FORMAT,
      });
      if (!r.ok) return { ok: false, kind: "unreadable", why: r.why };
      log.push({ ...r.value, hash: s.hash });
    }

    // 4. A nyílt lenyomatok — most már a tartalommal
    const chk = verifyChain(log);
    if (!chk.ok) return { ok: false, kind: "corrupt", why: chk.why };
    return { ok: true, log };
  }

  /**
   * OLVASÁS. Jogosultság nélkül NEM üres eredményt ad, hanem hibát.
   *
   * Az üres eredmény és az elutasítás összekeverése a legdrágább hiba ebben
   * a rétegben: a hívó azt hinné, hogy az esetben nincs adat, és ráépítene
   * egy döntést.
   */
  async read(caseId: string, who: Who): Promise<ReadResult> {
    const d = this.ask(who, "read", caseId);
    if (!d.ok) return this.deny(who, "read", caseId, d.why);

    // AUDIT ELŐBB, ADAT UTÁNA. Ha a naplózás elbukik, adat nem megy ki.
    this.emit({
      kind: "audit", at: this.now(), actor: who.actor, action: "read",
      caseId, basis: d.basis, traceId: who.traceId,
    });

    const c = await this.chain(caseId);
    if (!c.ok) return { ok: false, kind: c.kind, why: c.why };

    const r = replay(c.log);
    return {
      ok: true, state: r.state, entries: c.log.length,
      breakGlass: Boolean(d.breakGlass), basis: d.basis,
    };
  }

  /**
   * ÍRÁS. A meglévő lánc ellenőrzése ELŐFELTÉTEL.
   *
   * Sérült naplóhoz fűzni annyi, mint a sérülést hitelesíteni: az új
   * bejegyzés lenyomata a hibás előzményre épül, és onnantól a romlás
   * ugyanolyan „ép” láncnak látszik, mint a valódi.
   */
  async write(
    caseId: string, who: Who, inputs: Array<Omit<AppendInput, "caseId" | "actor">>,
  ): Promise<WriteResult> {
    const d = this.ask(who, "write", caseId);
    if (!d.ok) return this.deny(who, "write", caseId, d.why);

    const c = await this.chain(caseId);
    if (!c.ok) return { ok: false, kind: c.kind, why: c.why };

    let log = c.log;
    const before = log.length;
    for (const i of inputs) {
      log = append(log, { ...i, caseId, actor: who.actor });
    }
    const fresh = log.slice(before);

    this.emit({
      kind: "audit", at: this.now(), actor: who.actor, action: "write",
      caseId, basis: d.basis, traceId: who.traceId,
      variableIds: fresh.map((e) => e.variableId).filter((v): v is string => Boolean(v)),
    });

    const { dek, key } = this.o.keys.dek(caseId);
    if (dek === null) {
      return { ok: false, kind: "unreadable", why:
        `A(z) ${caseId} eset kulcsa megsemmisült` +
        (key.destroyReason ? ` (${key.destroyReason})` : "") +
        `. Egy kriptográfiailag törölt esethez nem lehet hozzáírni: az új ` +
        `bejegyzés olvashatatlan volna, a törlés ténye pedig kétségessé válna.` };
    }

    const existing = (await this.o.archive.read(caseId)).sort((a, b) => a.seq - b.seq);
    let prevSealed = existing.length ? existing[existing.length - 1].sealedHash : GENESIS;
    const stored: StoredEntry[] = fresh.map((e) => {
      const { hash, ...plain } = e;
      const sealedRec = seal(plain, dek, key.keyId, {
        caseId, seq: e.seq, prevHash: e.prevHash, formatVersion: JOURNAL_FORMAT,
      });
      const sh = sealedHash(prevSealed, e.seq, sealedRec);
      const out: StoredEntry = {
        seq: e.seq, entryId: e.entryId, prevHash: e.prevHash, hash,
        sealed: sealedRec, prevSealedHash: prevSealed, sealedHash: sh,
      };
      prevSealed = sh;
      return out;
    });

    const durability = await this.o.archive.append(caseId, stored);
    this.o.sink.op({
      kind: "op", level: "info", at: this.now(), where: "store.write",
      message: "bejegyzés hozzáfűzve", caseId, traceId: who.traceId,
      data: { entries: stored.length, durability },
    });

    // A HORGONY A TARTÓS ÍRÁS UTÁN, SOHA ELŐTTE. Egy előre felvett horgony
    // olyan véget állítana, ami sosem lett tartós — és a következő
    // ellenőrzés adatvesztést kiáltana ott, ahol nem történt.
    //
    // ÉS AMIÉRT A SIKERTELEN HORGONY NEM BUKTATJA EL AZ ÍRÁST: az adat ekkor
    // MÁR tartós. Visszamondani azt, ami megtörtént, hazugság volna. Ami
    // elveszett, az a BIZONYÍTHATÓSÁG — és ezt hangosan kell megmondani,
    // nem elnyelni.
    if (this.o.horgony) {
      const h = horgonyBol(log, this.now());
      try {
        if (h) this.o.horgony.write(h);
      } catch (err) {
        this.o.sink.op({
          kind: "op", level: "error", at: this.now(), where: "store.horgony",
          message:
            "A HORGONY NEM ÍRÓDOTT KI. A bejegyzés tartós, de az eset " +
            "épsége ettől a ponttól nem bizonyítható: egy levágott vég " +
            "ellenőrzésre ép láncnak látszana.",
          caseId, traceId: who.traceId,
          data: { seq: h ? h.seq : null, hiba: String(err) },
        });
      }
    }
    return { ok: true, seq: log[log.length - 1].seq, durability, basis: d.basis };
  }

  /**
   * KRIPTOGRÁFIAI TÖRLÉS — a kulcs semmisül meg, a napló marad.
   *
   * A SORREND ITT IS SZÁMÍT, és ugyanaz, mint az olvasásnál: előbb a
   * jogosultság, aztán az AUDIT, és csak utána a művelet. Egy naplózatlan
   * törlés utólag megkülönböztethetetlen az adatvesztéstől — és épp a törlés
   * az a művelet, aminél ez a különbség a legtöbbet számít.
   *
   * A NAPLÓ NEM TÖRLŐDIK. A bejegyzések szerkezete — hány, mikor, kitől — és a
   * hasítólánc ellenőrizhető marad; a TARTALOM nem nyílik fel többé. Enélkül a
   * törlés maga sem volna bizonyítható.
   *
   * Ez a réteg NEM dönti el, hogy szabad-e törölni: azt a `core/store/torles.ts`
   * kapui döntik el, a megőrzési kötelezettséggel és a második aláíróval együtt.
   * Itt a `basis` a jogosultsági rétegé, a `why` a rendelkezésé.
   */
  async destroyKey(
    caseId: string, who: Who, why: string,
  ): Promise<{ ok: true; entries: number; basis: string }
           | { ok: false; kind: "denied" | "corrupt" | "unreadable"; why: string }> {
    const d = this.ask(who, "delete", caseId);
    if (!d.ok) return this.deny(who, "delete", caseId, d.why);

    if (!this.o.keys.destroy) {
      return { ok: false, kind: "unreadable", why:
        "A kulcstár nem támogatja a megsemmisítést. Kriptográfiai törlés " +
        "kulcsmegsemmisítés nélkül nem törlés, hanem annak látszata." };
    }

    // A lánc épsége ELŐFELTÉTEL: sérült archívumon a törlés ténye sem lenne
    // bizonyítható utólag.
    const c = await this.chain(caseId);
    if (!c.ok) return { ok: false, kind: c.kind, why: c.why };

    // AUDIT ELŐBB, TÖRLÉS UTÁNA.
    this.emit({
      kind: "audit", at: this.now(), actor: who.actor, action: "delete",
      caseId, basis: d.basis, traceId: who.traceId,
    });

    this.o.keys.destroy(caseId, why);
    this.o.sink.op({
      kind: "op", level: "warn", at: this.now(), where: "store.destroyKey",
      message: "kriptográfiai törlés: a kulcs megsemmisült", caseId,
      traceId: who.traceId, data: { entries: c.log.length, why },
    });
    return { ok: true, entries: c.log.length, basis: d.basis };
  }

  /**
   * A LÁNC ÉPSÉGE VISSZAFEJTÉS NÉLKÜL.
   *
   * Az üzemeltetőnek és a mentésellenőrzőnek nincs joga a lelethez, de KELL
   * tudnia, hogy az archívum ép. Ez a művelet ezért nem kér olvasási jogot —
   * és nem is ad vissza semmit a tartalomból.
   */
  async verifyArchive(caseId: string): Promise<{ ok: boolean; entries: number; why: string }> {
    const stored = (await this.o.archive.read(caseId)).sort((a, b) => a.seq - b.seq);
    const r = verifySealedChain(stored, caseId);
    return { ok: r.ok, entries: stored.length, why: r.why };
  }
}


/**
 * AZ ARCHÍVUM ÉPSÉGE KULCS NÉLKÜL.
 *
 * Ez az a művelet, amihez az üzemeltetőnek joga van, és amihez a lelethez
 * NINCS. Négy romlást fog meg, mind a négyet visszafejtés nélkül:
 *
 *   hézag            töröltek egy bejegyzést
 *   átrendezés       a szállítás összekeverte
 *   elvágott lánc    két napló összefésülése
 *   megváltoztatás   a rejtjelezett tartalom egyetlen bitje is más
 *
 * A negyedik az, amit a puszta sorszám-ellenőrzés NEM ad meg — és amiért a
 * rejtjelezett alaknak külön lánca van a nyílt mellett.
 *
 * AMIT VISZONT NEM AD MEG, ÉS AMIT KÖNNYŰ TÚLÍGÉRNI: ez a lánc NEM kulccsal
 * hitelesített. Aki írni tud az archívumba, újra is tudja számolni — a
 * ROMLÁST és a naiv hamisítást fogja meg, a felkészült támadót nem. Ellene
 * az AEAD-címke véd, amihez viszont kulcs kell. A kettő ezért nem egymás
 * helyettesítője: lánc nélkül a törölt bejegyzés maradna észrevétlen,
 * címke nélkül a meghamisított tartalom.
 */
export function verifySealedChain(
  stored: StoredEntry[], caseId = "(ismeretlen)",
): { ok: boolean; why: string } {
  if (!stored.length) {
    return { ok: true, why:
      "Üres archívum. Ez ÉRVÉNYES állapot — de ha adatot vártunk, akkor a " +
      "szállítmány veszett el, nem az eset volt üres." };
  }
  let prev = GENESIS;
  for (const [i, s] of stored.entries()) {
    if (s.seq !== i + 1) {
      return { ok: false, why:
        `A(z) ${caseId} archívumban a ${i + 1}. helyen a ${s.seq}. sorszám áll. ` +
        `Hiányzik vagy átrendeződött egy bejegyzés.` };
    }
    if (s.prevSealedHash !== prev) {
      return { ok: false, why:
        `A(z) ${caseId} archívum lánca a ${s.seq}. bejegyzésnél nem illeszkedik ` +
        `az előzőhöz. Ez két napló összefésülésének nyoma: a bejegyzések ` +
        `egyenként épek lehetnek, a sorozat mégsem hiteles.` };
    }
    if (!s.sealed || sealedHash(prev, s.seq, s.sealed) !== s.sealedHash) {
      return { ok: false, why:
        `A(z) ${caseId} archívum ${s.seq}. bejegyzésének tartalma MEGVÁLTOZOTT. ` +
        `Ez az ellenőrzés a rejtjelezett alakon fut, tehát kulcs nélkül is ` +
        `kimondható: a másolat nem hiteles.` };
    }
    prev = s.sealedHash;
  }
  return { ok: true, why:
    `${stored.length} bejegyzés, a lánc hézagmentes, illeszkedik, és a ` +
    `tartalom változatlan. Mindez A REJTJELEZETT ALAKON ellenőrizve — kulcs ` +
    `nem kellett hozzá, és a lelet nem lett visszafejtve.` };
}
