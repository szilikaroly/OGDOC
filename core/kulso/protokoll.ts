/**
 * KÜLSŐ PROTOKOLLOK ÉS KALKULÁTOROK — a beszerzéstől az átvételig.
 *
 * Van egy visszatérő kérés: „integráljuk a rendszerbe ezt a szakmai oldalt”.
 * A kérés jogos, a szó viszont kétértelmű, és a kétértelműség itt drága.
 * „Integrálni” jelenthet HIVATKOZÁST — tudjuk, hogy létezik, tudjuk, mihez
 * szólna hozzá — és jelenthet ÁTVÉTELT: a képlet, a küszöb, a görbe bekerül,
 * és onnantól a rendszer AZT MONDJA a klinikusnak.
 *
 * A kettő között négy állapot van, és csak a negyedik ad hozzá bármit:
 *
 *   nem-beszerzett  — tudjuk a CÍMÉT. Nem olvastuk. Ez a mai állapot.
 *   beszerzett      — a szöveg megvan, változatlan alakban, lenyomattal.
 *   feldolgozott    — kiolvastuk belőle a képletet/küszöböt a mi formánkra.
 *   hitelesitett    — valaki NÉVVEL igazolta, hogy amit kiolvastunk, az van ott.
 *
 * A rendszer viselkedéséhez csak a `hitelesitett` járul hozzá. Ez nem
 * óvatoskodás: pontosan ugyanaz a kapu, mint a `calc.verified` a
 * kalkulátoroknál, a `verification: "assumed"` a CMQCC vérzési táblánál és a
 * normogramoknál a `verification: "verified"`. Egy percentilis, ami egy nem
 * olvasott oldal címéből származik, ROSSZABB a percentilis hiányánál — mert a
 * hiány látszik, a rossz szám nem.
 *
 * ÉS VAN EGY MÉG ELŐBBI KAPU: a licenc. Amíg `licenc.ismert === false`, az
 * átvétel akkor sem indulhat el, ha a szöveg egyébként a kezünkben van. Ez a
 * SNOMED CT GPS (CC BY-ND 4.0) és az ICHOM tanulsága: a „szakmai
 * iránymutatás” nem azonos a „szabadon felhasználható” minősítéssel.
 *
 * AMI EZZEL EGYÜTT MÉGIS ÉRTÉK: a katalógus megnevezi, MELYIK VÁLTOZÓNKHOZ
 * kötődne a tétel. Így a haszon a beszerzés ELŐTT látszik, és eldönthető,
 * megéri-e a licencbeszerzés — ahelyett, hogy a kérdés örökre nyitva maradna.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { I18n, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";

/* ── ADAT ────────────────────────────────────────────────────────────── */

/** A négy állapot. Csak a negyedik járul hozzá a rendszer viselkedéséhez. */
export type AtvetelAllapot =
  | "nem-beszerzett"
  | "beszerzett"
  | "feldolgozott"
  | "hitelesitett";

export const ATVETEL_SORREND: AtvetelAllapot[] = [
  "nem-beszerzett", "beszerzett", "feldolgozott", "hitelesitett",
];

/**
 * A harmadik fajta nem eszköz, hanem ÁLLÍTÁS egy eszközről: külső validálás,
 * ami nem ad hozzá képletet, hanem ELVESZ egyet. Külön fajta, mert a
 * hitelesítési kapunak semmi dolga vele — egy hivatkozott közlemény nem
 * „átveendő”, és nem is „hitelesítendő”: idézhető.
 */
export type TetelTipus = "protokoll" | "kalkulator" | "bizonyitek";

export interface KulsoTetel {
  id: string;
  tipus: TetelTipus;
  cim: string;
  /**
   * HONNAN TUDJUK A CÍMET. `"kereses"` = keresőtalálatból, nem a forrásból.
   * Nem formaság: egy keresőtalálat címe elavulhat vagy félrevezethet, és ha
   * ezt nem jelöljük, később úgy néz ki, mintha olvastuk volna az oldalt.
   */
  cimForrasa: "forras" | "kereses";
  terulet: string;
  /** A MI változóink, amelyekhez a tétel hozzászólna. A validálás ellenőrzi. */
  mihezKotodik: string[];
  mitAdnaHozza: I18n;
  /** Tételszintű állapot; ha hiányzik, a forrás beszerzési állapota az irányadó. */
  allapot?: AtvetelAllapot;
  /**
   * Tételszintű beszerzés. Egy VEGYES katalógusban a forrásszintű állapot
   * hazudik: ugyanabban a fájlban lehet egy kézben lévő R-csomag és hat
   * megnyithatatlan weboldal. Ha ez megvan, ez az irányadó.
   */
  beszerzes?: Beszerzes;
  /**
   * Tételszintű licenc, ami felülírja a forrásét. Csak SZŰKÍTHET vagy
   * PONTOSÍTHAT: attól, hogy egy tétel licence ismert, az átvétel még nem
   * szabad — a GPLv2 ismert licenc, és mégis feltételt szab.
   */
  licenc?: Licenc;
  /** Ami ténylegesen a kezünkben van: megnevezés, lenyomat, szerzők. */
  forras?: {
    megnevezes: string;
    sha256?: string;
    doi?: string;
    szerzok?: string;
    kiadva?: string;
    helyiTabla?: string;
  };
  /** Ki igazolta, és mikor — CSAK `hitelesitett` állapothoz. */
  hitelesitette?: { ki: string; mikor: string; lenyomat?: string };
}

export interface Licenc {
  ismert: boolean;
  azonosito?: string;
  url?: string;
  megjegyzes?: I18n;
}

export interface Beszerzes {
  allapot: AtvetelAllapot;
  megkiserelve?: string;
  akadaly?: string;
  amitTudunk?: string;
  amitNemTudunk?: string;
}

export interface KulsoForras {
  id: string;
  label: I18n;
  kiado: { nev: string; url: string; [k: string]: string };
  miertSzamit: I18n;
  beszerzes: Beszerzes;
  licenc: Licenc;
  note?: I18n;
  tetelek: KulsoTetel[];
}

export function loadKulsoForrasok(dir: string): KulsoForras[] {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    // Nincs könyvtár: nincs külső forrás. Ez érvényes állapot, nem hiba.
    return [];
  }
  /*
   * MINDEN FÁJL EGY FORRÁSKATALÓGUS — ÉS AMI NEM AZ, ARRÓL EZT KI KELL MONDANI.
   *
   * A betöltő eddig vakon KulsoForras-ként olvasott mindent, ami a könyvtárban
   * volt. Egy más alakú fájl — például egy adatkészlet-térkép — így nem
   * hibaüzenetet adott, hanem NYERS TypeError-t a validálás közepén
   * („Cannot read properties of undefined”), és a hibaüzenetből nem derült ki,
   * MELYIK fájl a hibás. Ebben a rendszerben a hiányzó szerkezet megnevezett
   * hiba, nem kivétel.
   */
  return files.map((f) => {
    const parsed = JSON.parse(readFileSync(join(dir, f), "utf8")) as Partial<KulsoForras>;
    for (const mezo of ["id", "label", "beszerzes", "licenc", "tetelek"] as const) {
      if (parsed[mezo] === undefined) {
        throw new Error(
          `${join(dir, f)}: nem külső forráskatalógus — hiányzik a(z) „${mezo}” ` +
          `mező. Ha ez más fajta nyilvántartás, ne ebbe a könyvtárba kerüljön.`,
        );
      }
    }
    return parsed as KulsoForras;
  });
}

/* ── ÁTVEHETŐSÉG ─────────────────────────────────────────────────────── */

export interface Atvehetoseg {
  forras: string;
  tetel: string;
  cim: string;
  tipus: TetelTipus;
  allapot: AtvetelAllapot;
  /** Átvehető-e MOST. Ma minden tételre `false`, és a `miert` megmondja, miért. */
  atveheto: boolean;
  /**
   * HIVATKOZHATÓ-e. Egy külső validálás közleménye nem átvétel tárgya: nem
   * képletet ad, hanem állítást a képletekről. Ha megvan, idézhető — és a két
   * dolog összemosása azért rossz, mert az egyik engedélyt kíván, a másik
   * csak forrásmegjelölést.
   */
  hivatkozhato: boolean;
  /**
   * HELYBEN TELEPÍTHETŐ-e. A harmadik út a „bekerül” és a „nem lesz belőle
   * semmi” között: a licencütközés a TERJESZTÉST tiltja, a HASZNÁLATOT nem.
   * Ha a származék a .gitignore-olt helyi könyvtárban áll, a felhasználó a
   * saját gépén telepítheti, és a mag ADATKÉNT olvassa — a terjesztett mű
   * pedig nem tartalmaz belőle semmit.
   */
  helybenTelepitheto: boolean;
  /** Az elutasítás oka — megnevezve, nem hibakóddal. */
  miert: string | null;
  /** A következő tényleges lépés, ha valaki tovább akarja vinni. */
  kovetkezoLepes: string | null;
}

const ALLAPOT_HU: Record<AtvetelAllapot, string> = {
  "nem-beszerzett": "a forrást nem olvastuk",
  "beszerzett": "a szöveg megvan, de nem dolgoztuk fel",
  "feldolgozott": "feldolgoztuk, de senki nem igazolta",
  "hitelesitett": "hitelesítve",
};

const KOVETKEZO: Record<AtvetelAllapot, string | null> = {
  "nem-beszerzett": "a forrás beszerzése (a hozzáférés akadályának feloldása)",
  "beszerzett": "a képlet/küszöb kiolvasása a mi formánkra",
  "feldolgozott": "hitelesítés: névvel igazolt összevetés a forrással",
  "hitelesitett": null,
};

/**
 * COPYLEFT licencek — az ISMERT licenc harmadik esete.
 *
 * A licenckérdést sokáig két állapotnak néztük: ismeretlen (tilos) vagy
 * ismert (szabad). A PRBPERIsk (GPLv2) mutatta meg, hogy van harmadik: a
 * licenc ismert, a HASZNÁLAT szabad, és mégsem eldönthető — mert a copyleft
 * a TERJESZTÉSRE szab feltételt, és az OGDOC saját licence nincs kimondva.
 *
 * Ez nem elméleti: az exportcsomag terjesztés, a repó terjesztés, és a
 * kórháznak átadott rendszer is az. Egy „belefér” döntés nem a fejlesztésé.
 */
export const COPYLEFT = [
  "GPL-2.0", "GPL-3.0", "GPLv2", "GPLv3", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0",
];

export function copyleftE(azonosito: string | undefined): boolean {
  if (!azonosito) return false;
  const a = azonosito.trim().toUpperCase();
  return COPYLEFT.some((c) => a.startsWith(c.toUpperCase()));
}

export interface AtvetelKontextus {
  /**
   * Az OGDOC SAJÁT licence. `null` = nincs kimondva. 2026-09-05 óta **MIT**,
   * és a `projektLicenc()` olvassa ki a `package.json`-ból — nem konstans,
   * mert egy második helyre írt licenc az a hely, ami elavul.
   */
  projektLicenc?: string | null;
}

/** Megengedő (permissive) licencek: a terjesztésre nem szabnak feltételt. */
export const MEGENGEDO = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD"];

export function megengedoE(azonosito: string | undefined | null): boolean {
  if (!azonosito) return false;
  const a = azonosito.trim().toUpperCase();
  return MEGENGEDO.some((m) => a.startsWith(m.toUpperCase()));
}

/**
 * A PROJEKT licence a `package.json`-ból. Egyetlen igazság: a `LICENSE` fájl
 * a jogi szöveg, a `package.json` az azonosító, és a kód innen olvassa.
 */
export function projektLicenc(pkgPath = "package.json"): string | null {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { license?: string };
    return pkg.license?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * ÖSSZEEGYEZTETHETŐ-E a forrás licence a projektével — a TERJESZTÉS irányában.
 *
 * Ez az irány a kérdés lényege, és pontosan ez az, amit a hétköznapi
 * szóhasználat elmos. A GPLv2 és az MIT „kompatibilis” abban az irányban,
 * hogy MIT-kódot BE lehet vinni egy GPL-műbe. VISSZAFELÉ NEM: egy GPLv2 műből
 * származtatott művet nem lehet MIT alatt továbbadni, mert a GPL épp azt
 * követeli meg, hogy a származék is GPL maradjon.
 *
 * Aki tehát MIT-et mond ÉS a GPL-modell átvételét kéri, két olyan dolgot kér,
 * amelyek együtt nem teljesíthetők — nem szigorúságból, hanem mert a második
 * feltétele az elsőnek az ellentéte.
 */
export type Osszeegyeztethetoseg = "igen" | "nem" | "eldontetlen";

export function osszeegyeztetheto(
  forrasLicenc: string | undefined, projekt: string | null,
): { allapot: Osszeegyeztethetoseg; miert: string } {
  if (!projekt) {
    return {
      allapot: "eldontetlen",
      miert: "a projekt licence nincs kimondva",
    };
  }
  if (!copyleftE(forrasLicenc)) {
    return { allapot: "igen", miert: "a forrás licence nem copyleft" };
  }
  if (megengedoE(projekt)) {
    return {
      allapot: "nem",
      miert:
        `a projekt licence ${projekt} (megengedő), a forrásé ${forrasLicenc} ` +
        `(copyleft): a TERJESZTÉS irányában ez a kettő nem egyeztethető össze. ` +
        `MIT-kódot be lehet vinni egy GPL-műbe, visszafelé nem: a GPL-származék ` +
        `csak GPL alatt adható tovább`,
    };
  }
  if (copyleftE(projekt)) {
    return { allapot: "igen", miert: `a projekt licence maga is copyleft (${projekt})` };
  }
  return {
    allapot: "eldontetlen",
    miert: `a projekt licence (${projekt}) és a forrásé (${forrasLicenc}) viszonya nem ismert`,
  };
}

/**
 * Átvehető-e a tétel. FAIL-CLOSED, három kapuval, ebben a sorrendben:
 *
 *   1. LICENC ISMERETLEN     → nem indul el semmi.
 *   2. LICENC COPYLEFT, és a projekt licence nincs kimondva → nyitott döntés.
 *   3. NINCS HITELESÍTVE     → a szöveg megléte még nem átvétel.
 *
 * A sorrend nem ízlés: egy hitelesítetlen átvételt ki lehet javítani, egy
 * jogosulatlant nem.
 */
export function atveheto(
  forras: KulsoForras, tetel: KulsoTetel, ctx: AtvetelKontextus = {},
): Atvehetoseg {
  const licenc = tetel.licenc ?? forras.licenc;
  const besz = tetel.beszerzes ?? forras.beszerzes;
  const allapot = tetel.allapot ?? besz.allapot;
  const kozos = {
    forras: forras.id, tetel: tetel.id, cim: tetel.cim,
    tipus: tetel.tipus, allapot,
  };
  // Egy hivatkozott közlemény akkor idézhető, ha megvan. Ez FÜGGETLEN attól,
  // hogy átvehető-e: átvenni nincs is mit belőle.
  const hivatkozhato = tetel.tipus === "bizonyitek" && allapot !== "nem-beszerzett";
  const helybenTelepitheto =
    tetel.tipus !== "bizonyitek" && licenc.ismert
    && allapot !== "nem-beszerzett" && !!tetel.forras?.helyiTabla;

  if (tetel.tipus === "bizonyitek") {
    return {
      ...kozos, atveheto: false, hivatkozhato, helybenTelepitheto,
      miert: hivatkozhato
        ? "hivatkozott bizonyíték — nem képletet ad, hanem állítást a képletekről; idézhető, átvenni nincs mit"
        : "hivatkozott bizonyíték, amit nem szereztünk be — így még idézni sem tudjuk",
      kovetkezoLepes: hivatkozhato ? null : KOVETKEZO["nem-beszerzett"],
    };
  }

  if (!licenc.ismert) {
    return {
      ...kozos, atveheto: false, hivatkozhato, helybenTelepitheto,
      miert:
        `a forrás licence ISMERETLEN — amíg nem tudjuk, mit szabad vele, ` +
        `az átvétel nem indulhat el (ugyanaz a szabály, mint a SNOMED CT GPS-nél)`,
      kovetkezoLepes: "a felhasználási feltételek beszerzése és rögzítése",
    };
  }
  if (copyleftE(licenc.azonosito)) {
    const ossz = osszeegyeztetheto(licenc.azonosito, ctx.projektLicenc ?? null);
    if (ossz.allapot === "eldontetlen") {
      return {
        ...kozos, atveheto: false, hivatkozhato, helybenTelepitheto,
        miert:
          `a licenc ISMERT (${licenc.azonosito}), de COPYLEFT, és ${ossz.miert} — ` +
          `a származtatott mű terjesztése csak kompatibilis feltételekkel jogszerű`,
        kovetkezoLepes: "az OGDOC licencének kimondása (egy mondat, ami feloldja)",
      };
    }
    if (ossz.allapot === "nem") {
      return {
        ...kozos, atveheto: false, hivatkozhato, helybenTelepitheto,
        miert: `LICENCÜTKÖZÉS — ${ossz.miert}`,
        kovetkezoLepes:
          "vagy a szerzők írásos engedélye / megengedő újralicencelése, vagy a " +
          "modell újraépítése a KÖZLEMÉNYBŐL, vagy helyi telepítés (a származék " +
          "nem kerül a terjesztett műbe)",
      };
    }
  }
  if (allapot !== "hitelesitett") {
    return {
      ...kozos, atveheto: false, hivatkozhato, helybenTelepitheto,
      miert:
        `${ALLAPOT_HU[allapot] ?? `ISMERETLEN ÁLLAPOT: „${allapot}”`} — a rendszer ` +
        `viselkedéséhez csak hitelesített tétel járul hozzá`,
      kovetkezoLepes: KOVETKEZO[allapot],
    };
  }
  if (!tetel.hitelesitette?.ki?.trim()) {
    return {
      ...kozos, atveheto: false, hivatkozhato, helybenTelepitheto,
      miert: "„hitelesített”-nek jelölve, de nincs megnevezve, KI igazolta — névtelen hitelesítés nem hitelesítés",
      kovetkezoLepes: "a hitelesítő megnevezése",
    };
  }
  return {
    ...kozos, atveheto: true, hivatkozhato, helybenTelepitheto,
    miert: null, kovetkezoLepes: null,
  };
}

/** Amit a forrás MA hozzáad a rendszer viselkedéséhez. Ma: üres lista. */
export function atvettTetelek(
  forrasok: KulsoForras[], ctx: AtvetelKontextus = {},
): Atvehetoseg[] {
  return forrasok
    .flatMap((f) => f.tetelek.map((t) => atveheto(f, t, ctx)))
    .filter((a) => a.atveheto);
}

/** Amit idézni SZABAD, mert megvan és nincs mit átvenni belőle. */
export function hivatkozhatoTetelek(forrasok: KulsoForras[]): Atvehetoseg[] {
  return forrasok
    .flatMap((f) => f.tetelek.map((t) => atveheto(f, t)))
    .filter((a) => a.hivatkozhato);
}

/* ── MIRE VOLNA JÓ ───────────────────────────────────────────────────── */

export interface Kotes {
  variable: string;
  /** Létezik-e nálunk ez a változó. A validálás hibává emeli, ha nem. */
  ismert: boolean;
  /** Mely tételek kötődnek hozzá — ez mutatja, hol torlódik a hiány. */
  tetelek: string[];
}

/**
 * MELY VÁLTOZÓINKAT ÉRINTENÉ a forrás átvétele — a beszerzés ELŐTT.
 * Ez a katalógus egyetlen mai haszna, és nem kevés: enélkül a „szerezzük be”
 * kérdés eldönthetetlen, mert nem látszik, mit nyernénk vele.
 */
export function kotesek(forras: KulsoForras, reg: Registry): Kotes[] {
  const map = new Map<string, string[]>();
  for (const t of forras.tetelek) {
    for (const v of t.mihezKotodik) {
      map.set(v, [...(map.get(v) ?? []), t.id]);
    }
  }
  return [...map.entries()]
    .map(([variable, tetelek]) => {
      let ismert = false;
      try {
        ismert = !!reg.get(reg.resolvePrimary(variable));
      } catch {
        ismert = false;
      }
      return { variable, ismert, tetelek };
    })
    .sort((a, b) => b.tetelek.length - a.tetelek.length || a.variable.localeCompare(b.variable));
}

export interface ForrasAllapot {
  id: string;
  label: string;
  kiado: string;
  allapot: AtvetelAllapot;
  licencIsmert: boolean;
  tetelekSzama: number;
  atvettSzama: number;
  /** Ahány tétel MEGVAN — a beszerzés a katalógus első valódi mérőszáma. */
  beszerzettSzama: number;
  /** Ahány hivatkozható bizonyíték. */
  hivatkozhatoSzama: number;
  /** Ahány tétel HELYBEN telepíthető, noha nem terjeszthető. */
  telepithetoSzama: number;
  /** Ahány változónkat érintené — a be nem szerzett haszon mértéke. */
  erintettValtozok: number;
  akadaly: string | null;
  /** Egyetlen mondat arról, hol tart. Emberi olvasatra, nem gépnek. */
  osszefoglalo: string;
}

export function forrasAllapot(
  forras: KulsoForras, reg: Registry, lang: Lang = "hu",
): ForrasAllapot {
  const ertekelt = forras.tetelek.map((t) => atveheto(forras, t));
  const atvett = ertekelt.filter((a) => a.atveheto);
  const beszerzett = forras.tetelek.filter(
    (t) => (t.beszerzes ?? forras.beszerzes).allapot !== "nem-beszerzett");
  const k = kotesek(forras, reg);
  const label = forras.label[lang] ?? forras.label.hu;
  const osszefoglalo = atvett.length
    ? `${atvett.length}/${forras.tetelek.length} tétel átvéve, ${k.length} változót érint`
    : `NULLA tétel átvéve ${forras.tetelek.length}-ből ` +
      `(${beszerzett.length} megvan, ${ertekelt.filter((a) => a.hivatkozhato).length} hivatkozható) — ` +
      (!forras.licenc.ismert
        ? "a licenc ismeretlen"
        : ALLAPOT_HU[forras.beszerzes.allapot]) +
      `; az átvétel ${k.length} változónkhoz szólna hozzá`;
  return {
    id: forras.id, label, kiado: forras.kiado.nev,
    allapot: forras.beszerzes.allapot,
    licencIsmert: forras.licenc.ismert,
    tetelekSzama: forras.tetelek.length,
    atvettSzama: atvett.length,
    beszerzettSzama: beszerzett.length,
    hivatkozhatoSzama: ertekelt.filter((a) => a.hivatkozhato).length,
    telepithetoSzama: ertekelt.filter((a) => a.helybenTelepitheto).length,
    erintettValtozok: k.length,
    akadaly: forras.beszerzes.akadaly ?? null,
    osszefoglalo,
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export interface KulsoIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

export function validateKulsoForrasok(
  forrasok: KulsoForras[], reg: Registry,
): KulsoIssue[] {
  const out: KulsoIssue[] = [];
  const latottForras = new Set<string>();
  const latottTetel = new Set<string>();

  for (const f of forrasok) {
    if (latottForras.has(f.id)) {
      out.push({ severity: "error", id: f.id, message: "duplikált forrásazonosító" });
    }
    latottForras.add(f.id);

    if (!ATVETEL_SORREND.includes(f.beszerzes.allapot)) {
      out.push({
        severity: "error", id: f.id,
        message: `ismeretlen beszerzési állapot: „${f.beszerzes.allapot}”`,
      });
    }
    // Egy be nem szerzett forrásnál a KUDARC OKA a lényeg: enélkül úgy néz ki,
    // mintha senki nem próbálta volna, és a feladat némán elévül.
    if (f.beszerzes.allapot === "nem-beszerzett" && !f.beszerzes.akadaly?.trim()) {
      out.push({
        severity: "error", id: f.id,
        message:
          "be nem szerzett forrás az akadály megnevezése nélkül — így nem " +
          "derül ki, hogy meg lehet-e egyáltalán szerezni",
      });
    }
    if (!f.licenc.ismert && f.tetelek.some(
      (t) => !t.licenc?.ismert
        && (t.allapot ?? (t.beszerzes ?? f.beszerzes).allapot) === "hitelesitett")) {
      out.push({
        severity: "error", id: f.id,
        message:
          "hitelesítettnek jelölt tétel ISMERETLEN LICENCŰ forrásban — a " +
          "licenckapu megelőzi a hitelesítést, nem fordítva",
      });
    }

    for (const t of f.tetelek) {
      const tid = `${f.id}/${t.id}`;
      if (latottTetel.has(tid)) {
        out.push({ severity: "error", id: tid, message: "duplikált tételazonosító" });
      }
      latottTetel.add(tid);

      if (!t.cim?.trim()) {
        out.push({ severity: "error", id: tid, message: "cím nélküli tétel — így nem beszerezhető" });
      }
      if (t.cimForrasa !== "forras" && t.cimForrasa !== "kereses") {
        out.push({
          severity: "error", id: tid,
          message: "hiányzó `cimForrasa` — enélkül nem derül ki, olvastuk-e a forrást",
        });
      }
      const besz = t.beszerzes ?? f.beszerzes;
      /*
       * AZ ÁLLAPOT NEVE IS ADAT, ÉS AZ ELÍRÁSA EDDIG ÁTCSÚSZOTT.
       *
       * A forrásszintű állapotot a validáló már ellenőrizte; a TÉTELSZINTŰT
       * nem. A futásidőben nincs típusellenőrzés, tehát egy kitalált vagy
       * elgépelt állapot (például „hivatkozhato”, ami nem az `AtvetelAllapot`
       * eleme) végigment a rendszeren, és az indoklásban `undefined`-ként
       * jelent meg: „undefined — a rendszer viselkedéséhez csak hitelesített
       * tétel járul hozzá”. A tétel így NEM hitelesítettnek látszott, de a
       * MIÉRT elveszett — és ez a katalógus egyetlen valódi terméke.
       */
      for (const [mezo, ertek] of [["allapot", t.allapot],
                                   ["beszerzes.allapot", t.beszerzes?.allapot]] as const) {
        if (ertek !== undefined && !ATVETEL_SORREND.includes(ertek)) {
          out.push({
            severity: "error", id: tid,
            message:
              `ismeretlen ${mezo}: „${ertek}”. Az érvényes értékek: ` +
              `${ATVETEL_SORREND.join(", ")}. Elgépelve az állapot némán ` +
              `„undefined”-ként jelenne meg az indoklásban.`,
          });
        }
      }
      // A cím keresőtalálatból: nem hiba, de nem is felejthető el.
      if (t.cimForrasa === "kereses" && besz.allapot !== "nem-beszerzett") {
        out.push({
          severity: "warning", id: tid,
          message:
            "a forrás beszerzettnek van jelölve, a tétel címe mégis keresőtalálatból " +
            "származik — a címet a forrásból kell megerősíteni",
        });
      }
      if (!t.mihezKotodik.length) {
        out.push({
          severity: "warning", id: tid,
          message:
            "a tétel egyetlen változónkhoz sem kötődik — vagy hiányzik a kötés, " +
            "vagy a rendszerben nincs meg az a terület (mindkettő nyitott feladat)",
        });
      }
      for (const v of t.mihezKotodik) {
        let ok = false;
        try {
          ok = !!reg.get(reg.resolvePrimary(v));
        } catch {
          ok = false;
        }
        if (!ok) {
          out.push({
            severity: "error", id: tid,
            message:
              `a hivatkozott változó nem létezik: „${v}” — egy átnevezés némán ` +
              `elszakítaná a katalógust attól, amihez köti magát`,
          });
        }
      }
      const all = t.allapot ?? besz.allapot;
      if (all === "hitelesitett" && !t.hitelesitette?.ki?.trim()) {
        out.push({
          severity: "error", id: tid,
          message: "hitelesített tétel a hitelesítő megnevezése nélkül",
        });
      }
      // Ha be nem szerzett, az AKADÁLY tételszinten is kötelező — különben egy
      // vegyes katalógusban a forrás egyetlen akadálya takarja el kilencét.
      if (besz.allapot === "nem-beszerzett" && besz !== f.beszerzes && !besz.akadaly?.trim()) {
        out.push({
          severity: "error", id: tid,
          message:
            "tételszintű beszerzés akadály nélkül — a saját `beszerzes` blokk " +
            "épp azért van, hogy ne a forrás általános indoka feleljen helyette",
        });
      }
      // Ha azt állítjuk, hogy MEGVAN, meg kell nevezni, MI van meg. Enélkül a
      // „beszerzett” jelölés ellenőrizhetetlen — és pont ez a jelölés az,
      // amire a hitelesítés majd hivatkozni fog.
      if (besz.allapot !== "nem-beszerzett" && !t.forras?.megnevezes?.trim()) {
        out.push({
          severity: "error", id: tid,
          message:
            "beszerzettnek jelölt tétel a `forras.megnevezes` nélkül — egy " +
            "megnevezetlen példány nem forrás, hanem emlék",
        });
      }
      // Copyleft származék, aminek nincs megnevezve a HELYE: ilyenkor nem
      // derül ki, hogy a repón kívül áll-e.
      if (copyleftE((t.licenc ?? f.licenc).azonosito)
          && besz.allapot !== "nem-beszerzett" && !t.forras?.helyiTabla) {
        out.push({
          severity: "warning", id: tid,
          message:
            "copyleft forrás beszerzett tétele a `forras.helyiTabla` megjelölése " +
            "nélkül — a származék helye a .gitignore-olt helyi könyvtár, és ezt ki kell írni",
        });
      }
    }
  }
  return out;
}


/**
 * COPYLEFT SZÁRMAZÉK A TERJESZTETT KÖNYVTÁRBAN — build-hiba.
 *
 * Ugyanaz a védelem, mint a `validateSnomedDistribution()`, más okból: ott a
 * licenc TILTJA az átalakított mű továbbadását, itt FELTÉTELHEZ köti. A
 * következmény azonos — a származék nem kerülhet a repóba, amíg a feltétel
 * nincs teljesítve —, és a védelem sem lehet emlékezet dolga: egy
 * `git add .` bármikor bevinné.
 */
export function validateKulsoTerjesztes(forrasok: KulsoForras[]): KulsoIssue[] {
  const out: KulsoIssue[] = [];
  for (const f of forrasok) {
    for (const t of f.tetelek) {
      const lic = t.licenc ?? f.licenc;
      if (!copyleftE(lic.azonosito)) continue;
      const hely = t.forras?.helyiTabla;
      if (!hely) continue;
      // A helyi tábla helye nem lehet a terjesztett könyvtár GYÖKERE.
      const normalt = hely.replace(/\/+$/, "");
      if (!/(^|\/)helyi(\/|$)/.test(normalt)) {
        out.push({
          severity: "error", id: `${f.id}/${t.id}`,
          message:
            `copyleft (${lic.azonosito}) származék a(z) „${hely}” útvonalon: a ` +
            "helye a .gitignore-olt \`helyi/\` könyvtár. A GPL a használatot nem " +
            `korlátozza, a TERJESZTÉST igen — a repó pedig terjesztés.`,
        });
      }
      if (existsSync(normalt) && !normalt.includes("helyi")) {
        out.push({
          severity: "error", id: normalt,
          message: "copyleft származék a terjesztett fába települt",
        });
      }
    }
  }
  return out;
}
