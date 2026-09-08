/**
 * PERINATÁLIS ÉS GYERMEKGYÓGYÁSZAT — a 29. modul gépi fele.
 *
 * ITT JELENIK MEG A MÁSODIK BETEG.
 *
 * Ma az újszülött adatai (`nb.*`, `neo.*`) az ANYA esetében élnek. A szülés
 * dokumentálásához ez helyes — a szülés az anya ellátási eseménye —, és minden
 * más célra hibás:
 *
 *   - A gyereknek SAJÁT megőrzési ideje van, a saját születésétől. Az anyai
 *     rekord törlése nem viheti magával a gyerek dokumentációját.
 *   - A gyereknek SAJÁT beleegyezése lesz, amikor nagykorú.
 *   - A gyerek később SAJÁT betegként jelenik meg, és a perinatális előzménye a
 *     legfontosabb anamnézise. Ha az az anya rekordjában rekedt, nem érhető el.
 *   - ÉS A KAPCSOLAT MAGA ADAT. Az összerendelés a gyerek rekordjából
 *     azonosítja az anyát, és fordítva — örökbeadásnál, névtelen szülésnél,
 *     jogi vitában ez a legérzékenyebb mező az egész rendszerben.
 *
 * A HÁROM KAPU
 *
 * 1. ÖSSZERENDELÉS. Kimondott jogalap nélkül nem hozható létre. Nem azért, mert
 *    nehéz, hanem mert a láthatóság esetenként MÁS — és amit egyszer
 *    összekötöttünk, azt utólag nem lehet „nem tudottá” tenni.
 *
 * 2. KÜSZÖB. Az `nb.*` küszöbök javaslatként állnak, aláírásra várva. Amíg
 *    nincs aláírás, a küszöb NEM ad ítéletet: a mérés `nincsKuszob` állapotot
 *    kap. Rossz küszöbön a rendszer ROSSZAT mond; küszöb nélkül hallgat — de a
 *    hallgatását megnevezi. A két hiba nem egyforma.
 *
 * 3. DOZÍROZÁS. A gyermekgyógyászati gyógyszerelés a rendszer legkockázatosabb
 *    számítása, mert a hiba nem érzékelhető a végén: egy 10 kg-osnak szánt adag
 *    kiszámítása 100 kg-mal ugyanúgy „szám”. Aktuális súly nélkül nincs
 *    dozírozás, a maximum KEMÉNY korlát, a levezetés látszik, és a kerekítés
 *    csak lefelé mehet.
 *
 * ÉS A SZABÁLY, AMI ITT KIÉLESEDIK: a felnőtt referencia gyereken nem „kevésbé
 * pontos”, hanem ROSSZ. A rendszer inkább nem mond semmit, mint rosszat — és
 * most már meg tudja mondani, hogy nem mond semmit.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { RegistryIssue } from "../registry.ts";

/* ── ÉLETSZAKASZ ─────────────────────────────────────────────────────── */

export type Eletszakasz =
  /** 22. hét – 7. nap: a magzati és az újszülött-élettan átmenete. */
  | "perinatalis"
  /** 0–28. nap. */
  | "ujszulott"
  /** 29. nap – 1 év. */
  | "csecsemo"
  /** 1–18 év. */
  | "gyermek"
  /** 18 év fölött. */
  | "felnott"
  /** Nem tudjuk. NEM „felnőtt”. */
  | "ismeretlen";

export interface SzakaszItelet {
  szakasz: Eletszakasz;
  napok: number | null;
  /** Használható-e felnőtt referencia. */
  felnottReferencia: boolean;
  miert: string;
}

/**
 * MELYIK ÉLETSZAKASZ — és a hiányzó életkor nem „felnőtt”.
 *
 * Ugyanaz a megfordítás, mint a gyermeknőgyógyászatnál: ott a hiányzó
 * Tanner-stádium nem „felnőtt”, itt a hiányzó életkor nem az. A visszaesés a
 * felnőtt sávra pont a legkisebb betegnél a legveszélyesebb.
 */
export function eletszakasz(napok: number | null): SzakaszItelet {
  if (napok === null || !Number.isFinite(napok) || napok < 0) {
    return { szakasz: "ismeretlen", napok: null, felnottReferencia: false,
      miert:
        "Nem ismert az életkor. A rendszer NEM esik vissza a felnőtt sávra: a " +
        "hiányzó életkor nem „felnőtt”, és a felnőtt referencia gyereken nem " +
        "kevésbé pontos, hanem rossz." };
  }
  const [sz, mi]: [Eletszakasz, string] =
    napok <= 7 ? ["perinatalis", "a magzati és az újszülött-élettan átmenete"]
    : napok <= 28 ? ["ujszulott", "a felnőtt referencia semmire nem használható"]
    : napok <= 365 ? ["csecsemo", "súlyalapú dozírozás, gyors változás"]
    : napok < 365 * 18 ? ["gyermek", "a Tanner-stádium többet mond, mint az életkor"]
    : ["felnott", "felnőtt sávok érvényesek"];
  return { szakasz: sz, napok, felnottReferencia: sz === "felnott",
    miert: `${napok} napos — ${sz}: ${mi}.` };
}

/* ── AZ ÖSSZERENDELÉS ────────────────────────────────────────────────── */

export interface Jogalap {
  id: string;
  megnevezes: string;
  /** Ki láthatja a kapcsolatot. */
  lathatja: string[];
  /** Mikor NEM hozható létre az összerendelés e jogalap alatt. */
  kizaro?: string[];
}

export interface OsszerendelesKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  jogalapok: Jogalap[];
  megtekintesAuditalt: boolean;
}

export function loadOsszerendeles(path: string): OsszerendelesKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as OsszerendelesKeszlet;
}

export interface OsszerendelesKeres {
  anyaEset: string;
  gyerekEset: string;
  jogalap?: string;
  cselekvo?: string;
}

export type OsszerendelesAllapot =
  | "letrehozhato"
  /** Nincs egyetlen kimondott jogalap sem — a modul első kapuja. */
  | "jogalapNelkul"
  /** A hivatkozott jogalap nem létezik. */
  | "ismeretlenJogalap"
  /** Nincs megnevezett cselekvő. */
  | "cselekvoNelkul";

export interface OsszerendelesItelet {
  letrehozhato: boolean;
  allapot: OsszerendelesAllapot;
  miert: string;
}

/**
 * LÉTREHOZHATÓ-E AZ ANYA–GYEREK KAPCSOLAT.
 *
 * Fail-closed, és itt ez nem óvatosság: amit egyszer összekötöttünk, azt
 * utólag nem lehet „nem tudottá” tenni. A névtelen szülés, az örökbeadás és az
 * apasági vita MÁS láthatóságot kíván, és ezt előre kell kimondani.
 */
export function osszerendelheto(
  k: OsszerendelesKeszlet, kr: OsszerendelesKeres,
): OsszerendelesItelet {
  if (!k.jogalapok.length) {
    return { letrehozhato: false, allapot: "jogalapNelkul",
      miert:
        "NINCS EGYETLEN KIMONDOTT JOGALAP SEM. Az összerendelés a rendszer " +
        "legérzékenyebb adata: a gyerek rekordjából azonosítja az anyát, és " +
        "fordítva. Amíg nincs kimondva, ki láthatja a kapcsolatot és milyen " +
        "jogalapon, a kapcsolat nem jön létre — és amit egyszer összekötöttünk, " +
        "azt utólag nem lehet „nem tudottá” tenni." };
  }
  if (!kr.jogalap || !k.jogalapok.some((j) => j.id === kr.jogalap)) {
    return { letrehozhato: false, allapot: "ismeretlenJogalap",
      miert: `Ismeretlen vagy meg nem adott jogalap: „${kr.jogalap ?? "—"}”.` };
  }
  if (!kr.cselekvo?.trim()) {
    return { letrehozhato: false, allapot: "cselekvoNelkul",
      miert: "Nincs megnevezett cselekvő. „A rendszer” itt sem cselekvő." };
  }
  const j = k.jogalapok.find((x) => x.id === kr.jogalap)!;
  return { letrehozhato: true, allapot: "letrehozhato",
    miert:
      `Létrehozható a(z) „${j.megnevezes}” jogalapon (${kr.cselekvo}). ` +
      `Láthatja: ${j.lathatja.join(", ")}. A megtekintés auditsor.` };
}

/* ── A KÜSZÖBÖK ──────────────────────────────────────────────────────── */

export type Irany = "lt" | "lte" | "gt" | "gte";

export interface Kuszob {
  id: string;
  irany: Irany;
  ertek: number;
  forras: string;
  miert: string;
}

export interface KuszobHitelesites {
  ki: string;
  mikor: string;
  lenyomat: string;
  osszevetett: string[];
}

export interface KuszobKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  szerepek: Record<string, string>;
  kuszobok: Kuszob[];
  hitelesitesek: KuszobHitelesites[];
}

export function loadKuszobok(path: string): KuszobKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as KuszobKeszlet;
}

/** A NORMATÍV MAG — ebből képződik a lenyomat, amihez az aláírás köt. */
export function lenyeg(k: KuszobKeszlet): string {
  return k.kuszobok.map((x) => `${x.id}${x.irany}${x.ertek}`).sort().join("|");
}

export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag).digest("hex").slice(0, 16);
}

export type KuszobAllapot = "alairt" | "alairatlan" | "elavult" | "reszben";

export interface KapuAllas {
  allapot: KuszobAllapot;
  /** Ad-e egyáltalán ítéletet a réteg. */
  adItel: boolean;
  lenyomat: string;
  alairo: string | null;
  /** Amit az aláírás nem fed. */
  osszevetetlen: string[];
  miert: string;
}

/**
 * AD-E ÍTÉLETET A KÜSZÖBRÉTEG.
 *
 * Ugyanaz a szerkezet, mint a szepszisküszöböknél: lenyomat a normatív magról,
 * és a kapu KIZÁRÓLAG aláírásból nyílik. Ha a küszöbök megváltoztak az aláírás
 * óta, az aláírás ELAVUL — nem marad érvényben csak azért, mert egyszer
 * megvolt.
 */
export function kuszobKapu(k: KuszobKeszlet): KapuAllas {
  const mag = lenyomat(lenyeg(k));
  const h = k.hitelesitesek[k.hitelesitesek.length - 1];
  if (!h) {
    return { allapot: "alairatlan", adItel: false, lenyomat: mag, alairo: null,
      osszevetetlen: k.kuszobok.map((x) => x.id),
      miert:
        `A(z) ${k.kuszobok.length} perinatális küszöb közül egy sincs aláírva. ` +
        `A réteg NEM ad ítéletet: a mérések „nincs mihez mérni” állapotot kapnak. ` +
        `Rossz küszöbön a rendszer ROSSZAT mond, küszöb nélkül csak hallgat — és ` +
        `a hallgatását megnevezi.` };
  }
  if (h.lenyomat !== mag) {
    return { allapot: "elavult", adItel: false, lenyomat: mag, alairo: h.ki,
      osszevetetlen: k.kuszobok.map((x) => x.id),
      miert:
        `A küszöbök magja MEGVÁLTOZOTT az aláírás óta (aláírt: ${h.lenyomat}, ` +
        `mostani: ${mag}). Az aláírás a SZÁMOKHOZ köt, nem a dokumentumhoz — ` +
        `újra kell vetni.` };
  }
  const osszevetetlen = k.kuszobok.filter((x) => !h.osszevetett.includes(x.id)).map((x) => x.id);
  if (osszevetetlen.length) {
    return { allapot: "reszben", adItel: true, lenyomat: mag, alairo: h.ki, osszevetetlen,
      miert:
        `Aláírva (${h.ki}, ${h.mikor}), de ${osszevetetlen.length} küszöbre az ` +
        `aláírás NEM terjed ki (${osszevetetlen.join(", ")}) — ezek nem adnak ítéletet.` };
  }
  return { allapot: "alairt", adItel: true, lenyomat: mag, alairo: h.ki, osszevetetlen: [],
    miert: `Mind a(z) ${k.kuszobok.length} küszöb aláírva (${h.ki}, ${h.mikor}).` };
}

/** Egy adott küszöb ad-e ítéletet — a kapu és az összevetettség együtt. */
export function kuszobAktiv(k: KuszobKeszlet, id: string): boolean {
  const g = kuszobKapu(k);
  return g.adItel && !g.osszevetetlen.includes(id);
}

/* ── SÚLYALAPÚ DOZÍROZÁS ─────────────────────────────────────────────── */

export interface DozisKeres {
  hatoanyag: string;
  /** mg/kg. */
  mgPerKg: number;
  /** AKTUÁLIS testsúly, kg. */
  sulyKg?: number;
  /** Hány napja mérték. */
  sulyKora?: number;
  /** Kemény felső korlát egyszeri adagra, mg. Rendszerint a felnőttdózis. */
  maxEgyszeri: number;
  /** Hány napnál régebbi súly nem használható. */
  sulyErvenyesseg?: number;
}

export type DozisAllapot =
  | "szamolt"
  /** Nincs aktuális súly. NEM becsül életkorból. */
  | "sulyNelkul"
  /** A súly régebbi, mint az érvényessége. */
  | "sulyElavult"
  /** A szorzás felnőttdózis fölé menne. */
  | "maximumraVagva";

export interface Dozis {
  allapot: DozisAllapot;
  /** A kiadható adag, mg — `null`, ha nem számolható. */
  mg: number | null;
  /** A LEVEZETÉS, emberi olvasatra. Egy szám indoklás nélkül nem ellenőrizhető. */
  levezetes: string | null;
  miert: string;
}

/**
 * SÚLYALAPÚ ADAG — négy szabállyal, amik szigorúbbak, mint bárhol máshol.
 *
 * 1. AKTUÁLIS SÚLY NÉLKÜL NINCS DOZÍROZÁS. Nem becsül életkorból, és nem
 *    használ régi súlyt: csecsemőnél a súly hetek alatt megduplázódhat.
 * 2. A MAXIMUM KEMÉNY KORLÁT, nem figyelmeztetés. A szorzás felnőttdózis fölé
 *    nem mehet, akkor sem, ha az eredmény azt adja.
 * 3. A LEVEZETÉS LÁTSZIK: hány kg, hány mg/kg, mennyi jött ki, mire vágtuk.
 * 4. KEREKÍTÉS CSAK LEFELÉ, és a kerekítés ténye is látszik.
 */
export function dozis(d: DozisKeres): Dozis {
  const ervenyes = d.sulyErvenyesseg ?? 7;
  if (d.sulyKg === undefined || !(d.sulyKg > 0)) {
    return { allapot: "sulyNelkul", mg: null, levezetes: null,
      miert:
        `Nincs aktuális testsúly. A rendszer NEM becsül életkorból: egy 10 kg-osnak ` +
        `szánt adag kiszámítása 100 kg-mal ugyanúgy „szám”, és a hiba a végén nem ` +
        `érzékelhető.` };
  }
  if (d.sulyKora !== undefined && d.sulyKora > ervenyes) {
    return { allapot: "sulyElavult", mg: null, levezetes: null,
      miert:
        `A testsúly ${d.sulyKora} napos, a megengedett ${ervenyes} nap helyett. ` +
        `Csecsemőnél a súly hetek alatt megduplázódhat — a régi súly itt nem ` +
        `közelítés, hanem téves bemenet.` };
  }
  const nyers = d.sulyKg * d.mgPerKg;
  const vagott = Math.min(nyers, d.maxEgyszeri);
  // KEREKÍTÉS CSAK LEFELÉ, két tizedesre.
  const mg = Math.floor(vagott * 100) / 100;
  const levezetes =
    `${d.sulyKg} kg × ${d.mgPerKg} mg/kg = ${nyers.toFixed(2)} mg` +
    (nyers > d.maxEgyszeri ? ` → a ${d.maxEgyszeri} mg-os maximumra vágva` : "") +
    (mg !== vagott ? ` → lefelé kerekítve ${mg} mg` : "");

  if (nyers > d.maxEgyszeri) {
    return { allapot: "maximumraVagva", mg, levezetes,
      miert:
        `A számított adag (${nyers.toFixed(2)} mg) meghaladja a ${d.maxEgyszeri} mg-os ` +
        `kemény korlátot. A kiadható adag ${mg} mg. Ez nem figyelmeztetés: a ` +
        `súlyalapú számítás felnőttdózis fölé nem mehet.` };
  }
  return { allapot: "szamolt", mg, levezetes,
    miert: `${d.hatoanyag}: ${mg} mg. ${levezetes}` };
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validatePerinatalis(
  k: KuszobKeszlet, o: OsszerendelesKeszlet, ismertValtozok: Set<string>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const x of k.kuszobok) {
    if (!ismertValtozok.has(x.id)) {
      out.push({ severity: "error", id: `gyermek.${x.id}`,
        message: `A(z) „${x.id}” küszöb ismeretlen változóra hivatkozik.` });
    }
  }
  const g = kuszobKapu(k);
  if (!g.adItel) {
    out.push({ severity: "warning", id: "gyermek.kuszobok",
      message: g.miert });
  }
  if (!o.jogalapok.length) {
    out.push({ severity: "warning", id: "gyermek.osszerendeles",
      message:
        `Nincs kimondott jogalap az anya–gyermek összerendelésre, ezért a ` +
        `kapcsolat nem hozható létre. Névtelen szülés, örökbeadás és apasági vita ` +
        `MÁS láthatóságot kíván — ez jogi döntés, nem fejlesztési.` });
  }
  if (!o.megtekintesAuditalt) {
    out.push({ severity: "error", id: "gyermek.osszerendeles.audit",
      message:
        `Az összerendelés megtekintése nincs auditálva. Ez a rendszer ` +
        `legérzékenyebb adata: a megtekintés ténye maga is nyomot kell hagyjon.` });
  }
  return out;
}

export interface GyermekMerleg {
  kuszob: number;
  alairt: number;
  jogalap: number;
  osszerendelheto: boolean;
}

export function merleg(k: KuszobKeszlet, o: OsszerendelesKeszlet): GyermekMerleg {
  const g = kuszobKapu(k);
  return {
    kuszob: k.kuszobok.length,
    alairt: g.adItel ? k.kuszobok.length - g.osszevetetlen.length : 0,
    jogalap: o.jogalapok.length,
    osszerendelheto: o.jogalapok.length > 0,
  };
}
