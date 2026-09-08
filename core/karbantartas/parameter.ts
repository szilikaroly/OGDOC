/**
 * 37. MODUL — KARBANTARTÁS ÉS SZERKESZTÉS. A RENDSZERPARAMÉTEREK.
 *
 * EZ A MODUL MINDEN MODUL FÖLÖTT ÁLL, ÉS EZÉRT A LEGVESZÉLYESEBB.
 *
 * Ami itt állítható, az minden más modul viselkedését megváltoztatja — és
 * visszamenőleg is: egy küszöb átállítása nem csak a jövőt érinti, hanem azt
 * is, hogy a MÚLTBELI eseteket ma hogyan látjuk. Ezért a paraméter itt nem
 * egyszerű beállítás, hanem négy dolgot hordoz:
 *
 *   HATÁROK      ameddig egyáltalán állítható. Korlátlan paraméter nem
 *                paraméter, hanem nyitva hagyott ajtó.
 *   KI ÁLLÍTHATJA a rendszergazda nem mindenható: klinikai küszöböt nem ő
 *                dönt el. A megjelenítési paraméter más kérdés, mint egy
 *                riasztási határ.
 *   ÉRVÉNYESSÉG  mikortól. Egy azonnal ható változtatás a futó műszak közben
 *                írja át a szabályt.
 *   INDOK        indoklás nélkül fél év múlva senki nem tudja, miért nem az
 *                alapérték áll.
 *
 * ÉS AMI A LEGFONTOSABB: A KLINIKAI PARAMÉTER ÁTÁLLÍTÁSA ELAVULTTÁ TESZI AZ
 * ALÁÍRÁST.
 *
 * A rendszer több helyen aláíráshoz köti a megszólalást (szepszisküszöb,
 * normogram, CTG-besorolás). Ha ezek paramétere itt átállítható lenne az
 * aláírás érintése nélkül, az aláírás semmit nem érne: az aláíró egy olyan
 * értéket hitelesített, ami már nincs ott. A `hatasAlairasra` mező ezért nem
 * dokumentáció, hanem működés.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { Role } from "../store/hozzaferes.ts";

export type ParameterTipus = "szam" | "logikai" | "szoveg" | "valasztas";

/** Mit érint a paraméter — és ebből következik, ki állíthatja. */
export type ParameterKor =
  /** Megjelenítés: mennyit mutat a felület. Klinikai tartalmat nem érint. */
  | "megjelenites"
  /** Üzemeltetés: lejáratok, méretkorlátok, naplózás. */
  | "uzemeltetes"
  /** KLINIKAI: küszöb, határérték, besorolás. Ez teszi elavulttá az aláírást. */
  | "klinikai";

export interface Parameter {
  id: string;
  megnevezes: string;
  kor: ParameterKor;
  tipus: ParameterTipus;
  alapertek: unknown;
  /** Számnál: a megengedett tartomány. Korlát nélkül a paraméter nyitott ajtó. */
  min?: number;
  max?: number;
  /** Választásnál: a lehetséges értékek. */
  valaszthato?: Array<{ ertek: string; megnevezes: string }>;
  egyseg?: string;
  /** MELY SZEREPKÖRÖK állíthatják. Üres lista = senki, és ez érvényes válasz. */
  allithatja: Role[];
  /** Melyik aláírásokat teszi elavulttá az átállítás. */
  hatasAlairasra: string[];
  /** Mire hat — hogy a hatás ne legyen kitalálás kérdése. */
  hatas: string;
  leiras: string;
}

export interface ParameterErtek {
  parameter: string;
  ertek: unknown;
  /** MIKORTÓL. Az azonnali hatály a futó műszak közben ír át szabályt. */
  ervenyesTol: string;
  allitotta: string;
  miert: string;
}

export interface ParameterKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  parameterek: Parameter[];
}

export function loadParameterek(path: string): ParameterKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as ParameterKeszlet;
}

/* ── AZ ÉRVÉNYES ÉRTÉK ───────────────────────────────────────────────── */

export interface ErtekItelet {
  ertek: unknown;
  /** Az alapértékről van-e szó, vagy állították. */
  allitott: boolean;
  /** Ha állították: ki, mikor, miért. */
  honnan: ParameterErtek | null;
  miert: string;
}

/**
 * MI AZ ÉRVÉNYES ÉRTÉK MOST.
 *
 * A jövőbeli érvényességű állítás NEM hat vissza: aki holnaptól állít át
 * valamit, az ma még a régit kapja. Ez nem finomság — enélkül egy előre
 * beütemezett változtatás azonnal hatna, és senki nem értené, miért.
 */
export function ervenyes(
  k: ParameterKeszlet, ertekek: ParameterErtek[], id: string, most: string,
): ErtekItelet {
  const p = k.parameterek.find((x) => x.id === id);
  if (!p) {
    return { ertek: undefined, allitott: false, honnan: null,
      miert: `Ismeretlen paraméter: „${id}”.` };
  }
  const t = Date.parse(most);
  const elo = ertekek
    .filter((e) => e.parameter === id && Date.parse(e.ervenyesTol) <= t)
    .sort((a, b) => Date.parse(b.ervenyesTol) - Date.parse(a.ervenyesTol));
  if (!elo.length) {
    return { ertek: p.alapertek, allitott: false, honnan: null,
      miert: `Az alapérték áll (${JSON.stringify(p.alapertek)}) — senki nem állította át.` };
  }
  return { ertek: elo[0].ertek, allitott: true, honnan: elo[0],
    miert:
      `${elo[0].allitotta} állította át ${elo[0].ervenyesTol}-tól: ` +
      `${elo[0].miert}. Alapérték: ${JSON.stringify(p.alapertek)}.` };
}

/* ── AZ ÁTÁLLÍTÁS ────────────────────────────────────────────────────── */

export type AllitasAllapot =
  | "elfogadva"
  | "ismeretlenParameter"
  /** A szerepkör nem elég ehhez a paraméterhez. */
  | "nincsJog"
  /** Az érték a határokon kívül van, vagy rossz típusú. */
  | "ervenytelenErtek"
  /** Indok nélkül nem fogadható el. */
  | "nincsIndok"
  /** Visszamenőleges hatályú állítás — nem engedjük. */
  | "visszamenoleges";

export interface AllitasItelet {
  allapot: AllitasAllapot;
  ertek: ParameterErtek | null;
  /** Mely aláírások válnak elavulttá. ÜRES nem azt jelenti, hogy nincs hatás. */
  elavuloAlairasok: string[];
  miert: string;
}

export function allit(
  k: ParameterKeszlet, id: string, ertek: unknown, ki: string, szerepek: Role[],
  miert: string, ervenyesTol: string, most: string,
): AllitasItelet {
  const ures = { ertek: null, elavuloAlairasok: [] as string[] };
  const p = k.parameterek.find((x) => x.id === id);
  if (!p) {
    return { ...ures, allapot: "ismeretlenParameter", miert: `Ismeretlen paraméter: „${id}”.` };
  }
  if (!p.allithatja.some((r) => szerepek.includes(r))) {
    return { ...ures, allapot: "nincsJog",
      miert:
        `A(z) „${p.megnevezes}” paramétert a(z) ${p.allithatja.join(", ") || "(senki)"} ` +
        `szerepkör állíthatja; a tiéd: ${szerepek.join(", ") || "(nincs)"}. ` +
        (p.kor === "klinikai"
          ? `Ez KLINIKAI paraméter: a rendszergazda nem dönt küszöbértéket. Aki a ` +
            `rendszert üzemelteti, és aki a klinikai határt megállapítja, nem ` +
            `ugyanaz a felelősség.`
          : ``) };
  }
  if (!miert?.trim()) {
    return { ...ures, allapot: "nincsIndok",
      miert:
        `Indoklás nélkül nem állítható át. Fél év múlva senki nem fogja tudni, ` +
        `miért nem az alapérték (${JSON.stringify(p.alapertek)}) áll — és egy ` +
        `megmagyarázhatatlan beállítást senki nem mer visszaállítani.` };
  }
  if (Date.parse(ervenyesTol) < Date.parse(most)) {
    return { ...ures, allapot: "visszamenoleges",
      miert:
        `Visszamenőleges hatályú átállítás nem fogadható el (${ervenyesTol} < ${most}). ` +
        `Egy visszadátumozott paraméter átírja, hogyan látjuk a MÁR MEGHOZOTT ` +
        `döntéseket — az auditnapló és a lelet ettől ellentmondásba kerülne.` };
  }
  const hiba = ertekHiba(p, ertek);
  if (hiba) return { ...ures, allapot: "ervenytelenErtek", miert: hiba };

  return {
    allapot: "elfogadva",
    ertek: { parameter: id, ertek, ervenyesTol, allitotta: ki, miert },
    elavuloAlairasok: p.hatasAlairasra,
    miert:
      `Elfogadva: ${p.megnevezes} = ${JSON.stringify(ertek)} ${ervenyesTol}-tól.` +
      (p.hatasAlairasra.length
        ? ` FIGYELEM: ${p.hatasAlairasra.length} aláírás ELAVUL ` +
          `(${p.hatasAlairasra.join(", ")}). Az aláíró egy olyan értéket ` +
          `hitelesített, ami már nincs ott — az aláírást újra kell kérni.`
        : ``),
  };
}

function ertekHiba(p: Parameter, v: unknown): string | null {
  switch (p.tipus) {
    case "szam": {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return `A(z) „${p.megnevezes}” szám típusú, a kapott érték: ${JSON.stringify(v)}.`;
      }
      if (p.min !== undefined && v < p.min) {
        return `${v} kisebb a megengedett minimumnál (${p.min}${p.egyseg ? " " + p.egyseg : ""}).`;
      }
      if (p.max !== undefined && v > p.max) {
        return `${v} nagyobb a megengedett maximumnál (${p.max}${p.egyseg ? " " + p.egyseg : ""}).`;
      }
      return null;
    }
    case "logikai":
      return typeof v === "boolean" ? null
        : `A(z) „${p.megnevezes}” logikai típusú.`;
    case "szoveg":
      return typeof v === "string" ? null : `A(z) „${p.megnevezes}” szöveg típusú.`;
    case "valasztas":
      return (p.valaszthato ?? []).some((o) => o.ertek === v) ? null
        : `Nem választható érték: ${JSON.stringify(v)}. Lehetséges: ` +
          `${(p.valaszthato ?? []).map((o) => o.ertek).join(", ")}.`;
  }
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validateParameterek(k: ParameterKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const p of k.parameterek) {
    if (latott.has(p.id)) {
      out.push({ severity: "error", id: p.id, message: `Ismétlődő paraméterazonosító.` });
    }
    latott.add(p.id);
    if (ertekHiba(p, p.alapertek)) {
      out.push({ severity: "error", id: p.id,
        message: `Az ALAPÉRTÉK maga érvénytelen: ${ertekHiba(p, p.alapertek)}` });
    }
    if (p.tipus === "szam" && (p.min === undefined || p.max === undefined)) {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” szám típusú paraméternek nincs alsó vagy felső ` +
          `határa. A korlátlan paraméter nem paraméter, hanem nyitva hagyott ajtó: ` +
          `egy elgépelt nagyságrend némán elronthatja az egész modult.` });
    }
    if (p.tipus === "valasztas" && !p.valaszthato?.length) {
      out.push({ severity: "error", id: p.id,
        message: `Választás típusú paraméter lehetséges értékek nélkül.` });
    }
    if (!p.hatas?.trim()) {
      out.push({ severity: "error", id: p.id,
        message:
          `Nincs megnevezve, MIRE HAT. Egy paraméter, aminek a hatása ` +
          `kitalálás kérdése, használhatatlan: aki átállítja, nem tudja, mit tör el.` });
    }
    // A KLINIKAI PARAMÉTER NEM ÁLLÍTHATÓ RENDSZERGAZDAI JOGGAL.
    if (p.kor === "klinikai" && p.allithatja.includes("admin")) {
      out.push({ severity: "error", id: p.id,
        message:
          `A(z) „${p.megnevezes}” KLINIKAI paraméter, mégis rendszergazdai ` +
          `szerepkörrel állítható. Aki a rendszert üzemelteti, és aki a klinikai ` +
          `határt megállapítja, nem ugyanaz a felelősség — a kettő összevonása ` +
          `pontosan azt a döntést adja a legkevésbé illetékesnek, ami a ` +
          `legtöbbet számít.` });
    }
    if (p.kor === "klinikai" && !p.hatasAlairasra.length) {
      out.push({ severity: "warning", id: p.id,
        message:
          `KLINIKAI paraméter, amely egyetlen aláírást sem tesz elavulttá. Ha ` +
          `tényleg nincs rá aláírás, ezt jó tudni; ha van, az aláírás a ` +
          `paraméter átállítása után hamis állítást hitelesítene.` });
    }
  }
  return out;
}

export interface ParameterMerleg {
  osszes: number;
  klinikai: number;
  allitott: number;
  /** Hány paraméter átállítása tenne elavulttá aláírást. */
  alairastErinto: number;
}

export function merleg(
  k: ParameterKeszlet, ertekek: ParameterErtek[], most: string,
): ParameterMerleg {
  const allitott = new Set(
    ertekek.filter((e) => Date.parse(e.ervenyesTol) <= Date.parse(most))
      .map((e) => e.parameter));
  return {
    osszes: k.parameterek.length,
    klinikai: k.parameterek.filter((p) => p.kor === "klinikai").length,
    allitott: allitott.size,
    alairastErinto: k.parameterek.filter((p) => p.hatasAlairasra.length).length,
  };
}
