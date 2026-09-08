/**
 * U.S. MEC — a fogamzásgátlás orvosi alkalmassági mátrixa.
 *
 * A MÁTRIX NEM SZABÁLYTÁBLA, HANEM KERESŐ. A szabálymotor (`core/szabaly/`)
 * sorrendezett táblákat értékel, ahol az első illeszkedő sor nyer. Itt nincs
 * sorrend: a FELTÉTEL és a MÓDSZER metszete adja a kategóriát. Egy „első
 * találat” egy mátrixon értelmetlen.
 *
 * A NÉGY KATEGÓRIA NEM SÚLYOSSÁGI SKÁLA, HANEM DÖNTÉS:
 *
 *   1  nincs korlátozás
 *   2  az előnyök általában felülmúlják a kockázatot
 *   3  a kockázat rendszerint felülmúlja az előnyöket — csak akkor, ha nincs
 *      elfogadhatóbb alternatíva, SZAKORVOSI megítéléssel
 *   4  elfogadhatatlan egészségi kockázat — NEM használható
 *
 * A 3 NEM „MAJDNEM 4”. Egy közös „nem ajánlott” címke alá vonva pontosan az a
 * sáv veszne el, ahol a döntés valóban orvosi: ahol a terhesség kockázata
 * nagyobb lehet, mint a módszeré.
 *
 * A FÁZIST MEG KELL ADNI — ezért kötelező paraméter.
 *
 * A tábla minden módszernél KÉT oszlopot tart: kezdés (I) és folytatás (C).
 * Húsz soron a kettő ELTÉR. A `fazis` nem alapértelmezhető, mert nincs
 * biztonságos alapértelmezés:
 *
 *   – a szigorúbbra állítva a rendszer egy MŰKÖDŐ fogamzásgátlás elhagyását
 *     javasolná (HIV-fertőzés, nem beállított beteg, réz-IUD: kezdés 2,
 *     folytatás 1), miközben az elhagyás kockázata — nem tervezett terhesség —
 *     éppen ilyenkor a legnagyobb;
 *   – az engedékenyebbre állítva viszont elindítana egy módszert, amit
 *     folytatni már nem szabadna (heves vagy elhúzódó vérzés + LNG-IUD:
 *     kezdés 1, FOLYTATÁS 2 — a szigorúbb itt a folytatás).
 *
 * A két irány mindkét esetben előfordul a táblában, tehát a „vegyük a
 * szigorúbbat” sem megoldás: az is hamis lenne, csak a másik irányba.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/** 1–4, „2/4” alakú vagylagos, vagy NA. A forrás alakja, nem szám. */
export type MecErtek = string;

export interface MecCella { k: MecErtek; f: MecErtek }

/**
 * Honnan van az érték — a `chc` és az `orokolt` NEM ugyanolyan erős, mint a `sajat`.
 * LISTA, mert a kettő egyszerre is igaz lehet: a HIV alsorok kombinált
 * tablettájának értéke a szülősor összevont cellájából ÉS a közös CHC-oszlopból
 * származik. Egyetlen címkére szűkítve az egyik eltűnne.
 */
export type MecForras = "sajat" | "chc" | "orokolt";

export interface MecSor {
  feltetel: string;
  alfeltetel: string | null;
  kat: Record<string, MecCella>;
  honnan: Record<string, MecForras[]>;
  jelek: Record<string, string>;
  jegyzet: string | null;
  oldal: number;
}

export interface MecKorsav { kor: string; kat: number }

export interface MecKeszlet {
  id: string;
  megnevezes: string;
  verzio: string;
  forras: string;
  hivatkozas?: string;
  note: string;
  modszerek: Record<string, string>;
  chcTagok: string[];
  kategoriak: Record<string, string>;
  korfuggo: { feltetel: string; modszerenkent: Record<string, MecKorsav[]> };
  szovegesSorok: { feltetel: string; szoveg: string; oldal: number }[];
  sorok: MecSor[];
}

export function loadMec(path: string): MecKeszlet {
  const k = JSON.parse(readFileSync(path, "utf8")) as MecKeszlet;
  for (const mezo of ["modszerek", "kategoriak", "sorok", "korfuggo"] as const) {
    if (!k[mezo]) {
      throw new Error(
        `A MEC-készletből hiányzik a(z) „${mezo}” mező (${path}). ` +
        `Régi, kezdés/folytatás bontás nélküli fájl? Futtasd újra: ` +
        `tools/ingest/usmec.py`);
    }
  }
  return k;
}

/* ── A KERESÉS ───────────────────────────────────────────────────────── */

export type MecFazis = "kezdes" | "folytatas";

export type MecAllapot =
  | "besorolva"
  /** A forrás kimondja: NEM ÉRTELMEZHETŐ. Nem hiány, és nem „1”. */
  | "nemErtelmezheto"
  /** A besorolás vagylagos („2/4”) — a forrás lábjegyzete dönt. */
  | "vagylagos"
  /** A feltétel megvan, de EHHEZ A MÓDSZERHEZ nincs besorolás. */
  | "modszerreNincs"
  /** A feltétel nincs a táblában. NEM azt jelenti, hogy szabad. */
  | "feltetelNincs"
  /** Ismeretlen módszernév. */
  | "modszerIsmeretlen"
  /** A keresőkifejezés több KÜLÖNBÖZŐ sorra illeszkedik — nem dönthető el, melyikre gondoltak. */
  | "tobbTalalat";

export interface MecValasz {
  allapot: MecAllapot;
  fazis: MecFazis;
  /** A kategória, ha egyértelmű szám. Vagylagos és NA esetén null. */
  kat: number | null;
  /** A forrás nyers értéke („1”, „2/4”, „NA”). */
  ertek: MecErtek | null;
  hasznalhato: boolean | null;
  /** A másik fázis értéke, ha eltér — mindig látszik, ha van. */
  masikFazis: { fazis: MecFazis; ertek: MecErtek } | null;
  sorok: string[];
  forras: MecForras[] | null;
  miert: string;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** A sor egyedi kulcsa. A validálás garantálja, hogy nincs két azonos. */
export const cimke = (s: MecSor) =>
  s.alfeltetel ? `${s.feltetel} — ${s.alfeltetel}` : s.feltetel;

/**
 * SZABAD SZÖVEGES KERESÉS — a válogatást a hívóra bízza, nem dönt helyette.
 *
 * Ez a függvény listát ad, `besorol()` pedig EGYÉRTELMŰ kulcsokat vár. A
 * szétválasztás azért kell, mert a részszavas illesztés csendben félrevisz:
 * a „Pregnancy” szó hat soron szerepel („History of cholestasis — a. Pregnancy
 * related”, „Postpartum…”, és így tovább). Ha `besorol()` maga illesztene
 * részszóval, a „legszigorúbb dönt” szabály ezekből gyúrna össze egy
 * tekintélyesnek látszó választ — a terhesség + kombinált tabletta kérdésre
 * „MEC 2, használható” jönne ki, holott a Pregnancy sorban NA áll.
 */
export function keres(k: MecKeszlet, q: string): MecSor[] {
  const n = norm(q);
  const pontos = k.sorok.filter((s) => norm(cimke(s)) === n);
  return pontos.length ? pontos : k.sorok.filter((s) => norm(cimke(s)).includes(n));
}

/** A szigorúság rendezése. NA nem rendezhető: nem a skálán van. */
function suly(e: MecErtek): number {
  if (e === "NA") return -1;
  const reszek = e.split("/").map(Number).filter((n) => !Number.isNaN(n));
  return reszek.length ? Math.max(...reszek) : -1;
}

/**
 * BESOROLÁS EGY FELTÉTELRE, EGY MÓDSZERRE ÉS EGY FÁZISRA.
 *
 * TÖBB FELTÉTEL ESETÉN A LEGSZIGORÚBB DÖNT — de mindegyik látszik. A MEC
 * kimondja, hogy a több egyidejű állapot együttes kockázata nagyobb lehet,
 * mint bármelyiké külön; a rendszer ezért nem választ egyet, hanem a legmagasabb
 * kategóriát adja, és felsorolja, mi mindenből jött.
 */
export function besorol(
  k: MecKeszlet, feltetelek: string[], modszer: string, fazis: MecFazis,
): MecValasz {
  const alap = { fazis, kat: null, ertek: null, hasznalhato: null,
    masikFazis: null, sorok: [] as string[], forras: null };
  if (!k.modszerek[modszer]) {
    return { ...alap, allapot: "modszerIsmeretlen",
      miert:
        `Ismeretlen módszer: „${modszer}”. A táblában: ` +
        `${Object.keys(k.modszerek).join(", ")}.` };
  }
  // MINDEN KULCSNAK PONTOSAN EGY SORT KELL AZONOSÍTANIA. Ami többre illeszkedik,
  // az nem „majdnem jó”: a `feltetelek` tömb a beteg EGYIDEJŰ állapotait sorolja
  // fel, és a legszigorúbb dönt — egy félreillesztett sor így a végeredményt
  // rontja el, nem csak a találati listát.
  const talalt: MecSor[] = [];
  for (const f of feltetelek) {
    const jeloltek = keres(k, f);
    if (!jeloltek.length) {
      return { ...alap, allapot: "feltetelNincs",
        miert:
          `Nincs a MEC-táblában: „${f}”. EZ NEM AZT JELENTI, HOGY SZABAD: az ` +
          `összefoglaló tábla a teljes ajánlás részhalmaza, és ami itt nincs, arról ` +
          `nem következik, hogy nincs korlátozás.` };
    }
    if (jeloltek.length > 1) {
      return { ...alap, allapot: "tobbTalalat",
        sorok: jeloltek.map(cimke),
        miert:
          `A „${f}” kifejezés ${jeloltek.length} különböző sorra illeszkedik, ezért ` +
          `nem dönthető el, melyikre gondoltál. A rendszer NEM választ helyetted és ` +
          `nem is vonja őket össze: a „legszigorúbb dönt” szabály egy félreillesztett ` +
          `sorból tekintélyesnek látszó, de hamis választ adna. Válassz egyet: ` +
          `${jeloltek.map(cimke).join(" · ")}` };
    }
    if (!talalt.includes(jeloltek[0])) talalt.push(jeloltek[0]);
  }
  const ertekelheto = talalt.filter((s) => s.kat[modszer]);
  if (!ertekelheto.length) {
    return { ...alap, allapot: "modszerreNincs", sorok: talalt.map(cimke),
      miert:
        `A feltétel megvan a táblában, de a(z) „${k.modszerek[modszer]}” ` +
        `módszerhez NINCS besorolás. A hiány itt nem „1-es kategória”: a méhüreg ` +
        `torzulása például csak az IUD-kre értelmezhető.` };
  }
  const mezo = fazis === "kezdes" ? "k" : "f";
  const masikMezo = fazis === "kezdes" ? "f" : "k";
  const legrosszabb = ertekelheto.reduce((a, b) =>
    suly(b.kat[modszer][mezo]) > suly(a.kat[modszer][mezo]) ? b : a);
  const cella = legrosszabb.kat[modszer];
  const ertek = cella[mezo];
  const forras = legrosszabb.honnan[modszer] ?? ["sajat"];
  const masik = cella[masikMezo] !== ertek
    ? { fazis: (fazis === "kezdes" ? "folytatas" : "kezdes") as MecFazis,
        ertek: cella[masikMezo] }
    : null;
  const sorok = ertekelheto.map((s) => `${cimke(s)} (${s.kat[modszer][mezo]})`);
  const fazisNev = fazis === "kezdes" ? "kezdés" : "folytatás";
  const tobb = ertekelheto.length > 1
    ? ` A LEGSZIGORÚBB döntött ${ertekelheto.length} illeszkedő feltétel közül — a több ` +
      `egyidejű állapot együttes kockázata nagyobb lehet, mint bármelyiké külön.`
    : ` Forrás: „${cimke(legrosszabb)}” (${k.forras}, ${legrosszabb.oldal}. oldal).`;
  const masikSzoveg = masik
    ? ` A MÁSIK FÁZIS ELTÉR: ${masik.fazis === "kezdes" ? "kezdés" : "folytatás"} = ` +
      `${masik.ertek}. Ez a válasz a(z) ${fazisNev}re vonatkozik, és NEM vihető át.`
    : "";
  const forrasSzoveg =
    (forras.includes("orokolt")
      ? ` AZ ÉRTÉK A SZÜLŐSOR összevont cellájából jön, nem ennek az alsornak a ` +
        `saját cellájából.`
      : "") +
    (forras.includes("chc")
      ? ` AZ ÉRTÉK A KÖZÖS CHC-OSZLOPBÓL VAN: a forrás a tablettát, a tapaszt és a ` +
        `gyűrűt egyetlen cellában kezeli. A három közti különbség ebből a forrásból ` +
        `NEM LEVEZETHETŐ — nem az következik belőle, hogy nincs különbség.`
      : "");

  if (ertek === "NA") {
    return { ...alap, allapot: "nemErtelmezheto", ertek, sorok, forras,
      masikFazis: masik,
      miert:
        `${k.modszerek[modszer]} — ${fazisNev}: NA. ${k.kategoriak["NA"]}` +
        tobb + masikSzoveg + forrasSzoveg };
  }
  if (ertek.includes("/")) {
    return { ...alap, allapot: "vagylagos", ertek, sorok, forras,
      masikFazis: masik,
      miert:
        `${k.modszerek[modszer]} — ${fazisNev}: ${ertek}. A besorolás VAGYLAGOS: a ` +
        `forrás lábjegyzete dönti el, melyik érvényes. Egyetlen számra kerekíteni ` +
        `találgatás lenne, ezért a rendszer nem dönt helyetted.` +
        tobb + masikSzoveg + forrasSzoveg };
  }
  const kat = Number(ertek);
  return {
    allapot: "besorolva", fazis, kat, ertek, hasznalhato: kat <= 2,
    masikFazis: masik, sorok, forras,
    miert:
      `${k.modszerek[modszer]} — ${fazisNev}, MEC ${kat}: ${k.kategoriak[String(kat)]}` +
      tobb + masikSzoveg + forrasSzoveg,
  };
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface MecMerleg {
  sor: number;
  modszer: number;
  cella: number;
  /** Sorok, ahol legalább egy módszernél a kezdés és a folytatás ELTÉR. */
  fazisElter: number;
  vagylagos: number;
  nemErtelmezheto: number;
  chcbol: number;
  orokolt: number;
  kategoriankent: Record<string, number>;
}

/** A mérleg minden száma a `sorok` tömbből számolódik — egyik sincs beírva. */
export function merleg(k: MecKeszlet): MecMerleg {
  const kategoriankent: Record<string, number> = {};
  let cella = 0, fazisElter = 0, vagylagos = 0, nemErt = 0, chcbol = 0, orokolt = 0;
  for (const s of k.sorok) {
    let e = false, v = false, n = false, c = false, o = false;
    for (const [m, cl] of Object.entries(s.kat)) {
      cella++;
      for (const val of [cl.k, cl.f]) {
        kategoriankent[val] = (kategoriankent[val] ?? 0) + 1;
      }
      if (cl.k !== cl.f) e = true;
      if (cl.k.includes("/") || cl.f.includes("/")) v = true;
      if (cl.k === "NA" || cl.f === "NA") n = true;
      if (s.honnan[m]?.includes("chc")) c = true;
      if (s.honnan[m]?.includes("orokolt")) o = true;
    }
    if (e) fazisElter++;
    if (v) vagylagos++;
    if (n) nemErt++;
    if (c) chcbol++;
    if (o) orokolt++;
  }
  return { sor: k.sorok.length, modszer: Object.keys(k.modszerek).length,
    cella, fazisElter, vagylagos, nemErtelmezheto: nemErt, chcbol, orokolt,
    kategoriankent };
}

const ERVENYES = /^(?:NA|[1-4](?:\/[1-4])?)$/;

export function validateMec(k: MecKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const modszerek = new Set(Object.keys(k.modszerek));
  if (!k.sorok.length) {
    out.push({ severity: "error", id: k.id, message: `Üres MEC-tábla.` });
  }
  for (const kod of ["1", "2", "3", "4", "NA"]) {
    if (!k.kategoriak[kod]) {
      out.push({ severity: "error", id: k.id,
        message:
          `Hiányzik a(z) „${kod}” kategória leírása. A NÉGY KATEGÓRIA NEM ` +
          `SÚLYOSSÁGI SKÁLA, HANEM DÖNTÉS — leírás nélkül a 3-as és a 4-es egy ` +
          `„nem ajánlott” címke alá csúszna, és épp az a sáv veszne el, ahol a ` +
          `döntés orvosi. Az NA pedig nem is a skálán van.` });
    }
  }
  for (const t of k.chcTagok ?? []) {
    if (!modszerek.has(t)) {
      out.push({ severity: "error", id: k.id,
        message: `A chcTagok „${t}” eleme nincs a módszerek között.` });
    }
  }
  const latott = new Set<string>();
  for (const s of k.sorok) {
    const nev = cimke(s);
    if (!s.feltetel?.trim()) {
      out.push({ severity: "error", id: k.id, message: `Feltétel nélküli sor.` });
      continue;
    }
    if (latott.has(nev)) {
      out.push({ severity: "error", id: nev,
        message:
          `Ismétlődő feltétel: „${nev}”. Mátrixban a duplikátum azt jelenti, hogy ` +
          `két különböző besorolás versenyez ugyanarra a kérdésre.` });
    }
    latott.add(nev);
    if (!Object.keys(s.kat).length) {
      out.push({ severity: "error", id: nev,
        message: `A(z) „${nev}” sorhoz egyetlen módszer sincs besorolva.` });
    }
    for (const [m, cl] of Object.entries(s.kat)) {
      if (!modszerek.has(m)) {
        out.push({ severity: "error", id: nev,
          message: `Ismeretlen módszer a besorolásban: „${m}”.` });
      }
      for (const [mezo, val] of [["kezdés", cl.k], ["folytatás", cl.f]] as const) {
        if (typeof val !== "string" || !ERVENYES.test(val)) {
          out.push({ severity: "error", id: nev,
            message:
              `Érvénytelen MEC-érték a(z) „${m}” ${mezo} oszlopában: ${JSON.stringify(val)}. ` +
              `Csak 1–4, „n/m” alakú vagylagos, vagy NA lehet.` });
        }
      }
      if (!Array.isArray(s.honnan[m]) || !s.honnan[m].length) {
        out.push({ severity: "error", id: nev,
          message:
            `A(z) „${m}” besorolásnál nincs „honnan” jelölés. Ez nem formaság: a ` +
            `közös CHC-oszlopból és a szülősorból örökölt érték NEM ugyanolyan erős, ` +
            `mint a módszer saját cellája, és a felhasználónak látnia kell a különbséget.` });
      }
    }
    for (const [m, h] of Object.entries(s.honnan)) {
      if (!(m in s.kat)) {
        out.push({ severity: "warning", id: nev,
          message: `A(z) „${m}” módszerhez „honnan” jelölés tartozik (${h}), besorolás nem.` });
      }
    }
  }
  // A CHC-tagok ugyanabban a sorban csak akkor térhetnek el, ha SAJÁT cellájuk van.
  for (const s of k.sorok) {
    const tagok = (k.chcTagok ?? []).filter((t) => s.kat[t]);
    const kozos = tagok.filter((t) => s.honnan[t]?.includes("chc"));
    const ertekek = new Set(kozos.map((t) => `${s.kat[t].k}|${s.kat[t].f}`));
    if (ertekek.size > 1) {
      out.push({ severity: "error", id: cimke(s),
        message:
          `A(z) „${cimke(s)}” sorban a közös CHC-cellából származó módszerek ` +
          `ELTÉRŐ értéket kaptak (${[...ertekek].join(" · ")}). Egy cellából nem jöhet ` +
          `több érték — az oszlopolvasás csúszott el.` });
    }
  }
  for (const [m, savok] of Object.entries(k.korfuggo?.modszerenkent ?? {})) {
    if (!savok.length) {
      out.push({ severity: "error", id: `${k.id}/korfuggo/${m}`,
        message: `A korfüggő sorban a(z) „${m}” módszerhez nincs korsáv.` });
    }
  }
  return out;
}
