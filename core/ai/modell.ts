/**
 * AI-MODELLEK — a kapu, ami a licencnél kezdődik.
 *
 * Az AI-kimenet JAVASLAT, nem lelet. Ez nem óvatoskodás, hanem két külön okból
 * kötelező, és a kettő nem helyettesíti egymást.
 *
 * MDR. Egy algoritmus, ami CTG-t értelmez klinikai döntés céljából,
 * orvostechnikai eszköz. Ez engedélyezési kérdés, nem fejlesztési.
 *
 * KLINIKAI. A számítógépes CTG-értelmezés az a terület, ahol a döntéstámogatás
 * nagy, jól tervezett vizsgálatokban NEM javította a kimeneteleket. Egy
 * magabiztos gépi „normális” CTG-olvasat a legrosszabb dolog, amit ez a
 * rendszer tehet.
 *
 * A NYOLC KÉRDÉS, ÉS AMIÉRT A SORREND KÖTÖTT
 *
 * A licenc az ELSŐ, és ez a rendszerben már háromszor eldőlt (SNOMED CT GPS,
 * BCNatal, PRBPERIsk): a licenckapu MEGELŐZI a hitelesítést. Egy hitelesítetlen
 * átvételt ki lehet javítani, egy jogosulatlant nem.
 *
 * A második és a harmadik a modell természetéről szól, és ezeket a legkönnyebb
 * elnézni:
 *
 *   BEMENET — ha a modell már KINYERT JELLEMZŐKET kap, akkor a nehéz felét egy
 *   másik rendszer végzi. „CTG-t olvasó AI”, ami valójában huszonegy számot
 *   kap, nem CTG-t olvas; és az a másik rendszer, ami a számokat előállítja,
 *   maga is orvostechnikai eszköz.
 *
 *   CÍMKE — ha a tanító címke SZAKÉRTŐI OSZTÁLYOZÁS és nem KIMENETEL, akkor a
 *   modell azt tanulja meg, hogy egyetértsen a szakértővel. Nem tudja
 *   túlszárnyalni azokat, akiket utánoz, és örökli a tévedéseiket. Ez ugyanaz a
 *   körkörösség, amit a 18. lépésnél a helyi normogramnál kimondtunk: a
 *   rendszer önmagához mérve tökéletes egyezést talál, és éppen ezt hívja
 *   bizonyítéknak.
 *
 * ÉS A KAPU FAIL-CLOSED. Hiányzó válasz nem „igen”: egy meg nem válaszolt
 * blokkoló követelmény ugyanúgy zár, mint egy nemleges válasz. A rendszerben ez
 * mindenütt így van, és itt a tét a legnagyobb.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface Kovetelmeny {
  id: string;
  kerdes: string;
  /** Blokkoló: nélküle a modell nem használható. */
  blokkolo: boolean;
  miert: string;
}

export interface Valasz { van: boolean; mit: string; }

export type JeloltAllapot =
  /** Licenc vagy blokkoló követelmény hiányzik — nem vehető át. */
  | "nem-atveheto"
  /** Minden blokkoló megvan, hitelesítésre vár. */
  | "hitelesitesre-var"
  /** Használható, klinikusi megerősítés mellett. */
  | "hasznalhato";

export interface Jelolt {
  id: string;
  megnevezes: string;
  forras: string;
  cel: string;
  allapot: JeloltAllapot;
  valaszok: Record<string, Valasz>;
  megjegyzes?: string;
}

export interface ModellKeszlet {
  megnevezes: string;
  modul: number;
  elv: string;
  kovetelmenyek: Kovetelmeny[];
  jeloltek: Jelolt[];
}

export function loadModellek(path: string): ModellKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as ModellKeszlet;
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export type KapuAllapot =
  | "hasznalhato"
  /** A licenc hiányzik vagy ismeretlen. Ez mindent megelőz. */
  | "licencKapu"
  /** Blokkoló követelmény nemleges. */
  | "blokkoloHianyzik"
  /** Blokkoló követelmény MEG SEM VÁLASZOLT. Nem „igen”. */
  | "megvalaszolatlan";

export interface Kapu {
  hasznalhato: boolean;
  allapot: KapuAllapot;
  /** A nemleges blokkolók. */
  hianyzik: string[];
  /** A meg sem válaszolt blokkolók. */
  megvalaszolatlan: string[];
  miert: string;
}

/**
 * HASZNÁLHATÓ-E A MODELL.
 *
 * A licencet KÜLÖN nézzük, és elsőként — nem azért, mert fontosabb, hanem mert
 * MÁS a teendő: egy hiányzó validálást el lehet végezni, egy hiányzó licencet
 * nem lehet megszerezni a szerző nélkül.
 */
export function kapu(k: ModellKeszlet, j: Jelolt): Kapu {
  const blokkolok = k.kovetelmenyek.filter((x) => x.blokkolo);
  const licenc = j.valaszok["licenc"];

  if (!licenc || !licenc.van) {
    return {
      hasznalhato: false, allapot: "licencKapu",
      hianyzik: ["licenc"], megvalaszolatlan: licenc ? [] : ["licenc"],
      miert:
        `LICENCKAPU: ${licenc?.mit ?? "a licenckérdés meg sincs válaszolva"}. ` +
        `Az átvétel el sem indul — és ez akkor is így van, ha a modell egyébként ` +
        `jó volna. Egy hitelesítetlen átvételt ki lehet javítani, egy ` +
        `jogosulatlant nem.`,
    };
  }

  const megvalaszolatlan = blokkolok.filter((x) => !(x.id in j.valaszok)).map((x) => x.id);
  const hianyzik = blokkolok
    .filter((x) => x.id in j.valaszok && !j.valaszok[x.id].van).map((x) => x.id);

  if (megvalaszolatlan.length) {
    return {
      hasznalhato: false, allapot: "megvalaszolatlan", hianyzik, megvalaszolatlan,
      miert:
        `${megvalaszolatlan.length} blokkoló követelmény MEG SEM VÁLASZOLT ` +
        `(${megvalaszolatlan.join(", ")}). A hiányzó válasz nem „igen” — és itt ` +
        `a tét nagyobb, mint bárhol máshol a rendszerben.`,
    };
  }
  if (hianyzik.length) {
    return {
      hasznalhato: false, allapot: "blokkoloHianyzik", hianyzik, megvalaszolatlan: [],
      miert:
        `${hianyzik.length} blokkoló követelmény nem teljesül ` +
        `(${hianyzik.join(", ")}). A modell nem ad kimenetet.`,
    };
  }
  return {
    hasznalhato: true, allapot: "hasznalhato", hianyzik: [], megvalaszolatlan: [],
    miert:
      `Minden blokkoló követelmény teljesül. A kimenet ettől még JAVASLAT: ` +
      `klinikusi megerősítés nélkül nem lesz belőle lelet.`,
  };
}

/* ── AZ AI-KIMENET ALAKJA ────────────────────────────────────────────── */

export type KimenetAllapot =
  /** Javaslat, klinikusi megerősítésre vár. */
  | "javaslat"
  /** A klinikus megerősítette — ettől lett lelet. */
  | "megerositett"
  /** A klinikus elvetette. Ez is rögzül. */
  | "elvetett"
  /** A modell nem tudta megítélni. ÉRVÉNYES kimenet. */
  | "nemItelhetoMeg"
  /** A modell kapu mögött van — nem futott le. */
  | "kapuMogott";

export interface AiKimenet {
  modell: string;
  /** A modell verziója. Enélkül a kimenet visszamenőleg nem magyarázható. */
  verzio?: string;
  /** A bemenet pillanatképe — ugyanezért. */
  bemenet?: Record<string, number>;
  allapot: KimenetAllapot;
  ertek?: string;
  megerositette?: string;
  miert: string;
}

/**
 * AZ AI-KIMENET FELVÉTELE — mindig `derived`, sosem `clinician`.
 *
 * A `provenance` itt nem adminisztratív mező: ez különbözteti meg a gép
 * állítását a klinikusétól, és ez az, amit egy fél évvel későbbi visszakeresés
 * nem tud helyreállítani, ha most összemossuk.
 */
export function kimenet(
  k: ModellKeszlet, j: Jelolt, ertek: string | null,
  verzio?: string, bemenet?: Record<string, number>,
): AiKimenet {
  const g = kapu(k, j);
  if (!g.hasznalhato) {
    return { modell: j.id, allapot: "kapuMogott",
      miert: `A modell kapu mögött van: ${g.miert}` };
  }
  if (!verzio) {
    return { modell: j.id, allapot: "kapuMogott",
      miert:
        `Nincs modellverzió. Verzió és bemenet-pillanatkép nélkül a kimenet ` +
        `visszamenőleg nem magyarázható, és a 17. lépés audit-hurka nem tudja ` +
        `visszamérni — vagyis sosem derülne ki, jó volt-e.` };
  }
  if (ertek === null) {
    return { modell: j.id, verzio, bemenet, allapot: "nemItelhetoMeg",
      miert:
        `A modell nem tudta megítélni. Ez ÉRVÉNYES kimenet, nem hiba — ` +
        `ugyanolyan érvényes, mint a klinikustól.` };
  }
  return {
    modell: j.id, verzio, bemenet, allapot: "javaslat", ertek,
    miert:
      `JAVASLAT: „${ertek}” (${j.megnevezes} ${verzio}). Klinikusi megerősítés ` +
      `nélkül NEM lelet.`,
  };
}

export function megerosit(ki: AiKimenet, klinikus: string, elfogadja: boolean): AiKimenet {
  if (ki.allapot !== "javaslat") return ki;
  return {
    ...ki,
    allapot: elfogadja ? "megerositett" : "elvetett",
    megerositette: klinikus,
    miert: elfogadja
      ? `A javaslatot ${klinikus} megerősítette — ettől lett lelet.`
      : `A javaslatot ${klinikus} elvetette. Ez is rögzül: a 17. lépés ` +
        `audit-hurka ebből tudja megmérni, mennyire jó a modell.`,
  };
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validateModellek(k: ModellKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ismert = new Set(k.kovetelmenyek.map((x) => x.id));
  if (!k.kovetelmenyek.some((x) => x.id === "licenc" && x.blokkolo)) {
    out.push({ severity: "error", id: "ai.licenc",
      message:
        `A licenc nem szerepel BLOKKOLÓ követelményként. A rendszerben ez ` +
        `háromszor eldőlt: a licenckapu megelőzi a hitelesítést.` });
  }
  for (const j of k.jeloltek) {
    for (const kulcs of Object.keys(j.valaszok)) {
      if (!ismert.has(kulcs)) {
        out.push({ severity: "error", id: `ai.${j.id}.${kulcs}`,
          message:
            `A(z) „${j.megnevezes}” a(z) „${kulcs}” követelményre válaszol, ` +
            `ilyen viszont nincs. Elgépelt hivatkozás — és úgy néz ki, mint egy ` +
            `megválaszolt követelmény.` });
      }
    }
    const g = kapu(k, j);
    const vart: JeloltAllapot = g.hasznalhato ? "hitelesitesre-var" : "nem-atveheto";
    if (j.allapot !== vart && !(j.allapot === "hasznalhato" && g.hasznalhato)) {
      out.push({ severity: "error", id: `ai.${j.id}.allapot`,
        message:
          `A(z) „${j.megnevezes}” állapota „${j.allapot}”, a követelményekből ` +
          `viszont „${vart}” következik. Az állapot NEM beírt szó: a válaszokból ` +
          `derivált.` });
    }
    if (!g.hasznalhato) {
      out.push({ severity: "warning", id: `ai.${j.id}`,
        message: `„${j.megnevezes}” NEM vehető át: ${g.miert}` });
    }
  }
  return out;
}

export interface AiMerleg {
  jelolt: number;
  hasznalhato: number;
  licencMiatt: number;
  blokkolo: number;
}

export function merleg(k: ModellKeszlet): AiMerleg {
  const kapuk = k.jeloltek.map((j) => kapu(k, j));
  return {
    jelolt: k.jeloltek.length,
    hasznalhato: kapuk.filter((g) => g.hasznalhato).length,
    licencMiatt: kapuk.filter((g) => g.allapot === "licencKapu").length,
    blokkolo: k.kovetelmenyek.filter((x) => x.blokkolo).length,
  };
}
