/**
 * CMS ÉS BETEGTÁJÉKOZTATÓ — a rendszer első kimenete, amit nem klinikus olvas.
 *
 * KÉT DOLGOT VÉD EZ A MODUL, ÉS EGYIK SEM A SZÖVEGSZERKESZTÉS.
 *
 * 1. A TÁJÉKOZTATÓ IS LEJÁR, CSAK NEM A NAPTÁRTÓL, HANEM A TUDÁSTÓL.
 *
 * A rendszerben minden igazolás lejár: a megőrzési idők, a mérőeszköz-licencek,
 * a MIR-dokumentumok. A weboldalra kitett tájékoztató az EGYETLEN tartalom, ami
 * elévül anélkül, hogy bárki észrevenné — nincs se lejárati dátuma, se
 * felelőse, és senki nem panaszkodik rá. Egy öt éve kitett szoptatási
 * tájékoztató nem hibaüzenettel jelez, hanem azzal, hogy elavult ajánlást ad,
 * és a beteg aszerint jár el.
 *
 * Ezért egy tájékoztató NEM MENTHETŐ megnevezett szerző, szakmai jóváhagyó,
 * felülvizsgálati dátum és változat (laikus/szakmai) nélkül — és a lejárt
 * tartalom nem marad kint jelöletlenül.
 *
 * 2. ÉS A NYILVÁNOS KIMENET UGYANABBÓL A RENDSZERBŐL MEGY KI, AHOL A BETEGADAT
 *    VAN.
 *
 * Itt egy valódi rés volt. Az exportcsomag PHI-ellenőrzése FÁJLNEVET vizsgál
 * (`_PHI`, `beteg_adat`) — ez egy tárolt fájlkészletre értelmes szabály. Egy
 * weboldalnál viszont értéktelen: a kockázat nem a fájlnév, hanem a
 * SZÖVEGTÖRZS. Egy „hónap esete” hír, ami tartalmazza a beteg nevét, születési
 * idejét vagy a TAJ-át, minden fájlnév-ellenőrzésen átmegy.
 *
 * A modul ezért a TARTALMAT nézi. DE — és ez a fontosabb fele — EGY MINTAILLESZTŐ
 * NEM DETEKTOR. Ami átmegy rajta, arról NEM azt mondjuk, hogy tiszta, hanem
 * hogy „nem találtunk”. A két állítás nem ugyanaz, és a különbség itt jogi:
 *
 *   talalat        — konkrét minta illeszkedett, meg is nevezzük, MELYIK
 *   nincsTalalat   — nem találtunk. EZ NEM FELMENTÉS.
 *   nemVizsgalhato — a tartalom olyan formájú, hogy nem tudtuk átnézni
 *
 * A publikálás ezért NEM a szűrésből nyílik, hanem egy MEGNEVEZETT EMBER
 * kimondásából, akinek a szűrés eredménye csak segédeszköz. Egy „a rendszer
 * ellenőrizte” pecsét pontosan azt a felelősséget venné le, aminek maradnia
 * kell.
 *
 * ÉS A FORDÍTÁS ÖNÁLLÓ TARTALOM. A magyar változat jóváhagyása nem terjed ki
 * az angolra: ha az angolt senki nem hagyta jóvá, akkor a magyar jóváhagyása
 * alatt egy jóvá nem hagyott szöveg menne ki. Ugyanaz a szabály, mint a
 * validált kérdőívfordításoknál (12. lépés).
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A NÉGY TARTALOMTÍPUS ────────────────────────────────────────────── */

/**
 * Négy típus, és semmi más. A megszorítás MAGA A FUNKCIÓ: egy szabadon
 * bővíthető típusrendszerben a tájékoztató és a hír egy hét alatt
 * összekeveredik, és a lejárati szabály elveszik.
 */
export type TartalomTipus = "oldal" | "hir" | "munkatars" | "tajekoztato";

export type Valtozat = "laikus" | "szakmai";

export interface Jovahagyas {
  /** MEGNEVEZETT személy. „A klinika” nem személy. */
  ki: string;
  mikor: string;
  /** Szakmai jóváhagyónál: mire jogosít (szakvizsga, beosztás). */
  minosegben?: string;
}

export interface Forditas {
  nyelv: string;
  szoveg: string;
  /** A fordítás SAJÁT jóváhagyása. Az eredetié nem terjed ki rá. */
  jovahagyta?: Jovahagyas;
}

export interface Tartalom {
  id: string;
  tipus: TartalomTipus;
  cim: I18n;
  /** A törzsszöveg — ezt nézi át a PHI-szűrés. */
  szoveg: string;
  szerzo?: string;
  jovahagyta?: Jovahagyas;
  /** ISO dátum: mikor kell újra megnézni. */
  felulvizsgalat?: string;
  valtozat?: Valtozat;
  forditasok?: Forditas[];
  /**
   * A publikálás kimondása: KI vállalta, hogy a tartalom nyilvánosságra
   * adható. A PHI-szűrés ehhez segédeszköz, nem helyettesítő.
   */
  publikalast_vallalta?: Jovahagyas;
  /** Hírnél: mikor jelent meg. A hír nem lejár, hanem archiválódik. */
  megjelent?: string;
}

export interface CmsKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  /** A weboldal szakaszai — a szerkezet nyilvántartásból jön, nem kódból. */
  szerkezet: Array<{ id: string; cim: I18n; tartalmak: string[] }>;
  tartalmak: Tartalom[];
}

export function loadCms(path: string): CmsKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as CmsKeszlet;
}

/* ── A MENTÉSI KAPU ──────────────────────────────────────────────────── */

export interface MentesItelet {
  mentheto: boolean;
  hianyzik: string[];
  miert: string;
}

/** A négy kötelező elem. Tájékoztatónál mind; a többi típusnál kevesebb. */
export function menthetoE(t: Tartalom): MentesItelet {
  const hianyzik: string[] = [];
  if (!t.cim?.hu?.trim() && !t.cim?.en?.trim()) hianyzik.push("cim");
  if (!t.szoveg?.trim()) hianyzik.push("szoveg");
  if (t.tipus === "tajekoztato") {
    if (!t.szerzo?.trim()) hianyzik.push("szerzo");
    if (!t.jovahagyta?.ki?.trim()) hianyzik.push("jovahagyta");
    if (!t.felulvizsgalat?.trim()) hianyzik.push("felulvizsgalat");
    if (t.valtozat !== "laikus" && t.valtozat !== "szakmai") hianyzik.push("valtozat");
  }
  if (t.tipus === "hir" && !t.megjelent?.trim()) hianyzik.push("megjelent");
  if (!hianyzik.length) {
    return { mentheto: true, hianyzik: [], miert: "A kötelező elemek megvannak." };
  }
  return { mentheto: false, hianyzik,
    miert: t.tipus === "tajekoztato"
      ? `A betegtájékoztató NEM MENTHETŐ ezek nélkül: ${hianyzik.join(", ")}. ` +
        `A tájékoztató lejár — nem a naptártól, hanem a tudástól —, és felelős ` +
        `meg felülvizsgálati dátum nélkül nincs, ami lejárjon: csak kint marad.`
      : `Hiányzó kötelező elem: ${hianyzik.join(", ")}.` };
}

/* ── A LEJÁRAT ───────────────────────────────────────────────────────── */

export type LejaratAllapot =
  | "ervenyes"
  /** 90 napon belül lejár — ugyanaz az előjelzés, mint a licencpanelen. */
  | "hamarosanLejar"
  | "lejart"
  /** Nincs felülvizsgálati dátum: nem „nem jár le”, hanem NEM TUDJUK. */
  | "nincsDatum"
  /** Hír: nem lejár, archiválódik. */
  | "archivalhato";

export interface LejaratItelet {
  allapot: LejaratAllapot;
  napokMulva: number | null;
  miert: string;
}

export const ELOJELZES_NAP = 90;

export function lejarat(t: Tartalom, most: string, archivNap = 730): LejaratItelet {
  if (t.tipus === "hir") {
    if (!t.megjelent) {
      return { allapot: "nincsDatum", napokMulva: null,
        miert: `A hírnek nincs megjelenési dátuma, így az archiválása sem esedékesíthető.` };
    }
    const kor = Math.floor((Date.parse(most) - Date.parse(t.megjelent)) / 86_400_000);
    return kor >= archivNap
      ? { allapot: "archivalhato", napokMulva: null,
          miert: `${kor} napos hír — a hír nem lejár, hanem ARCHIVÁLÓDIK.` }
      : { allapot: "ervenyes", napokMulva: archivNap - kor,
          miert: `${kor} napos hír.` };
  }
  if (!t.felulvizsgalat) {
    return { allapot: "nincsDatum", napokMulva: null,
      miert:
        `Nincs felülvizsgálati dátum. Ez NEM azt jelenti, hogy a tartalom nem ` +
        `jár le — azt, hogy nem tudjuk, mikor. A dátum nélküli tartalom az, ami ` +
        `csendben elévül.` };
  }
  const nap = Math.floor((Date.parse(t.felulvizsgalat) - Date.parse(most)) / 86_400_000);
  if (nap < 0) {
    return { allapot: "lejart", napokMulva: nap,
      miert:
        `A felülvizsgálat ${-nap} napja esedékes lett volna. A lejárt tartalom ` +
        `KINT MARAD a nyilvános weben, amíg valaki le nem veszi — a rendszer ` +
        `ezért nem mutathatja jelöletlenül.` };
  }
  if (nap <= ELOJELZES_NAP) {
    return { allapot: "hamarosanLejar", napokMulva: nap,
      miert: `${nap} nap múlva felülvizsgálandó (előjelzés: ${ELOJELZES_NAP} nap).` };
  }
  return { allapot: "ervenyes", napokMulva: nap,
    miert: `${nap} nap múlva felülvizsgálandó.` };
}

/* ── A TARTALMI PHI-SZŰRÉS ───────────────────────────────────────────── */

export type PhiAllapot = "talalat" | "nincsTalalat" | "nemVizsgalhato";

export interface PhiTalalat {
  minta: string;
  /** Mit illesztett — RÖVIDÍTVE, hogy a jelentés maga ne szivárogtasson. */
  reszlet: string;
  hol: string;
}

export interface PhiItelet {
  allapot: PhiAllapot;
  talalatok: PhiTalalat[];
  miert: string;
}

/**
 * A MINTÁK. Nem teljes körű, és nem is lehet az — épp ezért nem mondunk
 * „tiszta” ítéletet.
 */
const MINTAK: Array<{ nev: string; re: RegExp }> = [
  { nev: "TAJ-szám", re: /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g },
  { nev: "születési dátum", re: /\b(19|20)\d{2}[.\-/]\s?(0?[1-9]|1[0-2])[.\-/]\s?(0?[1-9]|[12]\d|3[01])\b/g },
  { nev: "anyja neve fordulat", re: /\banyja\s+neve\b[^\n.]{0,60}/gi },
  /* A `\b` HORGONY ITT NEM MŰKÖDIK: a „+” nem szóalkotó karakter, tehát egy
     szóköz és egy „+” között nincs szóhatár, és a `\b(?:\+36…)` ág SOHA nem
     illeszkedett volna. A teszt fogta meg. Negatív visszatekintés kell. */
  { nev: "telefonszám", re: /(?<![\w+])(?:\+36|06)[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{3,4}(?!\d)/g },
  { nev: "e-mail cím", re: /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi },
  { nev: "beazonosítható lakcím", re: /\b\d{4}\s+[A-ZÁÉÍÓÖŐÚÜŰ][\wáéíóöőúüű]+,?\s+[\wáéíóöőúüű\s.]{2,30}\s+(utca|út|tér|körút|krt\.?)\s+\d+/gi },
  { nev: "betegazonosító fordulat", re: /\b(?:beteg|páciens)\s*(?:azonosító|sorszám|id)\s*[:=]?\s*\S+/gi },
];

function rovidit(s: string): string {
  const t = s.trim();
  return t.length <= 6 ? `${t[0] ?? ""}…` : `${t.slice(0, 3)}…${t.slice(-1)}`;
}

/**
 * A TARTALOM ÁTNÉZÉSE. A visszatérés SOHA nem „tiszta”: a `nincsTalalat`
 * pontosan annyit jelent, hogy ezek a minták nem illeszkedtek.
 */
export function phiSzures(t: Tartalom): PhiItelet {
  const reszek: Array<{ hol: string; szoveg: string }> = [
    { hol: "cim", szoveg: `${t.cim?.hu ?? ""} ${t.cim?.en ?? ""}` },
    { hol: "szoveg", szoveg: t.szoveg ?? "" },
    ...(t.forditasok ?? []).map((f) => ({ hol: `forditas:${f.nyelv}`, szoveg: f.szoveg })),
  ];
  if (!reszek.some((r) => r.szoveg.trim())) {
    return { allapot: "nemVizsgalhato", talalatok: [],
      miert:
        `A tartalomnak nincs átnézhető szövege. Ez nem „nincs benne betegadat”, ` +
        `hanem az, hogy nem tudtuk megnézni.` };
  }
  const talalatok: PhiTalalat[] = [];
  for (const r of reszek) {
    for (const m of MINTAK) {
      for (const hit of r.szoveg.matchAll(m.re)) {
        talalatok.push({ minta: m.nev, reszlet: rovidit(hit[0]), hol: r.hol });
      }
    }
  }
  if (talalatok.length) {
    return { allapot: "talalat", talalatok,
      miert:
        `${talalatok.length} betegadat-gyanús minta a szövegben: ` +
        `${[...new Set(talalatok.map((x) => x.minta))].join(", ")}. A nyilvános ` +
        `kimenet ugyanabból a rendszerből megy ki, ahol a betegadat van — a ` +
        `fájlnév-ellenőrzés itt semmit nem ér, mert a kockázat a SZÖVEGTÖRZS.` };
  }
  return { allapot: "nincsTalalat", talalatok: [],
    miert:
      `A minták nem illeszkedtek. EZ NEM FELMENTÉS: egy mintaillesztő nem ` +
      `detektor, és amit nem talált meg, arról nem állítja, hogy nincs ott. A ` +
      `publikálás ezért megnevezett ember kimondásából nyílik, nem ebből.` };
}

/* ── A PUBLIKÁLÁSI KAPU ──────────────────────────────────────────────── */

export type PublikalasAllapot =
  | "publikalhato"
  /** Lejárt, de KIÍRVA megjeleníthető. A csendes megtartás a rossz válasz. */
  | "csakJelolve"
  | "nemMentheto"
  | "phiTalalat"
  /** Nincs megnevezett ember, aki a nyilvánosságra adást vállalta. */
  | "nincsVallalas"
  /** Van jóvá nem hagyott fordítás — az eredeti jóváhagyása nem terjed ki rá. */
  | "jovaNemHagyottForditas";

export interface PublikalasItelet {
  allapot: PublikalasAllapot;
  publikalhato: boolean;
  /** Mely nyelvek mehetnek ki. Az eredeti nyelv csak akkor, ha minden rendben. */
  nyelvek: string[];
  miert: string;
}

export function publikalhato(t: Tartalom, most: string): PublikalasItelet {
  const m = menthetoE(t);
  if (!m.mentheto) {
    return { allapot: "nemMentheto", publikalhato: false, nyelvek: [], miert: m.miert };
  }
  const phi = phiSzures(t);
  if (phi.allapot === "talalat") {
    return { allapot: "phiTalalat", publikalhato: false, nyelvek: [], miert: phi.miert };
  }
  if (!t.publikalast_vallalta?.ki?.trim()) {
    return { allapot: "nincsVallalas", publikalhato: false, nyelvek: [],
      miert:
        `Nincs megnevezett személy, aki a nyilvánosságra adást vállalta. A ` +
        `PHI-szűrés ehhez SEGÉDESZKÖZ, nem helyettesítő: egy „a rendszer ` +
        `ellenőrizte” pecsét pontosan azt a felelősséget venné le, aminek ` +
        `maradnia kell. (A szűrés eredménye: ${phi.allapot}.)` };
  }
  const jovaNem = (t.forditasok ?? []).filter((f) => !f.jovahagyta?.ki?.trim());
  if (jovaNem.length) {
    return { allapot: "jovaNemHagyottForditas", publikalhato: false, nyelvek: ["hu"],
      miert:
        `Jóvá nem hagyott fordítás: ${jovaNem.map((f) => f.nyelv).join(", ")}. A ` +
        `FORDÍTÁS ÖNÁLLÓ TARTALOM — az eredeti jóváhagyása nem terjed ki rá, ` +
        `különben egy jóvá nem hagyott szöveg menne ki a jóváhagyott ` +
        `tekintélye alatt.` };
  }
  const nyelvek = ["hu", ...(t.forditasok ?? []).map((f) => f.nyelv)];
  const l = lejarat(t, most);
  if (l.allapot === "lejart") {
    return { allapot: "csakJelolve", publikalhato: false, nyelvek,
      miert:
        `${l.miert} Megjeleníthető, de KIZÁRÓLAG lejártként jelölve — vagy le ` +
        `kell venni. A csendes megtartás a rossz válasz.` };
  }
  return { allapot: "publikalhato", publikalhato: true, nyelvek,
    miert: `Publikálható (${t.publikalast_vallalta.ki}, ${t.publikalast_vallalta.mikor}). ${l.miert}` };
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface CmsMerleg {
  tartalom: number;
  tajekoztato: number;
  publikalhato: number;
  lejart: number;
  hamarosanLejar: number;
  datumNelkul: number;
  phiTalalat: number;
  vallalasNelkul: number;
}

export function merleg(k: CmsKeszlet, most: string): CmsMerleg {
  const it = k.tartalmak.map((t) => publikalhato(t, most));
  const lj = k.tartalmak.map((t) => lejarat(t, most));
  return {
    tartalom: k.tartalmak.length,
    tajekoztato: k.tartalmak.filter((t) => t.tipus === "tajekoztato").length,
    publikalhato: it.filter((x) => x.publikalhato).length,
    lejart: lj.filter((x) => x.allapot === "lejart").length,
    hamarosanLejar: lj.filter((x) => x.allapot === "hamarosanLejar").length,
    datumNelkul: lj.filter((x) => x.allapot === "nincsDatum").length,
    phiTalalat: it.filter((x) => x.allapot === "phiTalalat").length,
    vallalasNelkul: it.filter((x) => x.allapot === "nincsVallalas").length,
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateCms(k: CmsKeszlet, most: string): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = k.tartalmak.map((t) => t.id);
  for (const d of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) {
    out.push({ severity: "error", id: d, message: `Ismétlődő tartalomazonosító: ${d}.` });
  }
  const halmaz = new Set(ids);
  for (const sz of k.szerkezet) {
    for (const t of sz.tartalmak) {
      if (!halmaz.has(t)) {
        out.push({ severity: "error", id: `cms.szerkezet.${sz.id}`,
          message:
            `A(z) „${sz.id}” szakasz nem létező tartalomra mutat: „${t}”. Egy ` +
            `üres szakasz a nyilvános oldalon nem hibaüzenet, hanem üres oldal.` });
      }
    }
  }
  for (const t of k.tartalmak) {
    const m = menthetoE(t);
    if (!m.mentheto) {
      out.push({ severity: "error", id: t.id, message: m.miert });
    }
    const phi = phiSzures(t);
    if (phi.allapot === "talalat") {
      out.push({ severity: "error", id: `${t.id}.phi`, message: phi.miert });
    }
    const l = lejarat(t, most);
    if (l.allapot === "lejart") {
      out.push({ severity: "warning", id: `${t.id}.lejarat`, message: l.miert });
    }
    if (l.allapot === "nincsDatum" && t.tipus !== "hir") {
      out.push({ severity: "warning", id: `${t.id}.lejarat`, message: l.miert });
    }
  }
  return out;
}
