/**
 * KÓDÉRVÉNYESSÉG — nem, életkor, dátum.
 *
 * Egy kód akkor sem jelenthető, ha szakmailag stimmel, de a törzs szerint más
 * nemre, más életkorra vagy más időszakra vonatkozik. Ez nem formaiság: a
 * férfira kódolt O-diagnózis vagy a 2003 előtti jelentésű beavatkozáskód
 * NÉMÁN romlik el — a jelentés visszapattan, vagy ami rosszabb, átmegy, és
 * évekkel később derül ki, hogy mást állítottunk, mint ami történt.
 *
 * A hivatalos törzsek (BNOTORZS.DBF, MUTET_AP.DBF) ezt a három megszorítást
 * SORONKÉNT tartalmazzák. Amíg nem olvastuk ki, csak kereshető listánk volt;
 * ezzel ellenőrizhető.
 *
 * A KAPU, AMI ITT IS UGYANAZ: a hiányzó adat sehol nem „nem”. Ha a beteg neme
 * vagy életkora nincs rögzítve, a válasz `undetermined` — nem „megfelel”. Egy
 * ellenőrzés, ami hiányzó adatra zöldet mutat, rosszabb, mint a semmilyen
 * ellenőrzés: hamis biztonságot ad.
 */
import { getTable } from "./tables.ts";

export type ValidityStatus =
  /** A kód a megadott nemre, életkorra és napra érvényes. */
  | "ok"
  /** A törzs szerint a másik nemre vonatkozik. */
  | "wrongSex"
  /** A törzs életkori tartományán kívül. */
  | "outOfAgeRange"
  /** Az ellátás napján még nem volt érvényes. */
  | "notYetValid"
  /** Az ellátás napján már nem volt érvényes. */
  | "expired"
  /** A kód nincs a betöltött törzsben (vagy a törzs nincs betöltve). */
  | "unknown"
  /** Hiányzik az adat, amiből eldőlne. Ez NEM „megfelel”. */
  | "undetermined";

export interface ValidityContext {
  /** `female` · `male` — a rögzített nem. Hiánya `undetermined`-et ad. */
  sex?: "female" | "male" | null;
  /** Betöltött életkor ÉVBEN az ellátás napján. */
  age?: number | null;
  /** Az ellátás napja `YYYY-MM-DD` alakban. */
  on?: string | null;
}

export interface ValidityResult {
  code: string;
  table: string;
  label: string;
  status: ValidityStatus;
  why: string;
  /** Ha a kód jelentése korábban MÁS volt, itt a korábbi megnevezés. */
  formerLabel?: string;
  formerUntil?: string;
}

/** `YYYYMMDD` → `YYYY-MM-DD`; ami nem az, az üresen jön vissza. */
function isoDate(raw: string): string {
  return /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}` : "";
}

/** A törzs `nem` oszlopa: 0 = mindkettő · 1 = férfi · 2 = nő. */
const SEX_OF: Record<string, "female" | "male"> = { "1": "male", "2": "female" };
const SEX_HU: Record<string, string> = { female: "nő", male: "férfi" };

/**
 * Egy kód érvényessége a betöltött törzs szerint.
 *
 * A `tableId` az a törzs, amiből a kód való: `tbl.bno` a diagnózisé,
 * `tbl.mut` a fekvőbeteg-beavatkozásé. Kereszthasználat nincs — a két lista
 * külön kódrendszer.
 */
export function checkValidity(
  tableId: string,
  code: string,
  ctx: ValidityContext = {},
): ValidityResult {
  const t = getTable(tableId);
  const base = { code, table: tableId, label: "" };
  if (!t) {
    return {
      ...base, status: "unknown",
      why:
        `A(z) ${tableId} törzs NINCS BETÖLTVE, ezért a(z) ${code} kód ` +
        `érvényessége nem ellenőrizhető. Ez nem azt jelenti, hogy érvényes.`,
    };
  }
  const row = t.rows[code];
  if (!row) {
    return {
      ...base, status: "unknown",
      why: `A(z) ${code} kód nem szerepel a(z) ${tableId} ${t.version} törzsben.`,
    };
  }
  const label = row.label ?? "";
  const former = row.korabbiLabel
    ? { formerLabel: row.korabbiLabel, formerUntil: isoDate(row.korabbiErvVege ?? "") }
    : {};
  const out = (status: ValidityStatus, why: string): ValidityResult =>
    ({ ...base, label, status, why, ...former });

  /* 1. NEM — a legkeményebb megszorítás, mert a leggyakoribb hiba. */
  const needs = SEX_OF[row.nem ?? "0"];
  if (needs) {
    if (ctx.sex == null) {
      return out("undetermined",
        `A(z) ${code} („${label}”) csak ${SEX_HU[needs]} betegre jelenthető, ` +
        `de a beteg neme nincs rögzítve. Ez NEM azt jelenti, hogy megfelel.`);
    }
    if (ctx.sex !== needs) {
      return out("wrongSex",
        `A(z) ${code} („${label}”) a törzs szerint ${SEX_HU[needs]} betegre ` +
        `vonatkozik, a rögzített nem viszont ${SEX_HU[ctx.sex]}. Így nem jelenthető.`);
    }
  }

  /* 2. ÉLETKOR — csak akkor kapu, ha a törzs szűkít. */
  const lo = Number(row.korAlso ?? "");
  const hi = Number(row.korFelso ?? "");
  const bounded = Number.isFinite(lo) && Number.isFinite(hi) && !(lo === 0 && hi >= 99);
  if (bounded) {
    if (ctx.age == null) {
      return out("undetermined",
        `A(z) ${code} („${label}”) ${lo}–${hi} éves korra jelenthető, de a ` +
        `beteg életkora nincs rögzítve. Ez NEM azt jelenti, hogy megfelel.`);
    }
    if (ctx.age < lo || ctx.age > hi) {
      return out("outOfAgeRange",
        `A(z) ${code} („${label}”) a törzs szerint ${lo}–${hi} éves korra ` +
        `jelenthető, a rögzített életkor ${ctx.age} év.`);
    }
  }

  /* 3. ÉRVÉNYESSÉG — az ELLÁTÁS napjára, nem a mai napra. */
  const from = isoDate(row.ervKezd ?? "");
  const until = isoDate(row.ervVege ?? "");
  const open = !until || until >= "2999-01-01";
  if (from || !open) {
    if (!ctx.on) {
      return out("undetermined",
        `A(z) ${code} érvényessége időhöz kötött (${from || "?"}–` +
        `${open ? "" : until}), de az ellátás napja nincs megadva. A MAI nap ` +
        `nem helyettesíti: egy retrospektív eset a mai törzs szerint mást jelenthet.`);
    }
    if (from && ctx.on < from) {
      return out("notYetValid",
        `A(z) ${code} („${label}”) csak ${from} óta érvényes, az ellátás ` +
        `napja ${ctx.on}.` +
        (row.korabbiLabel
          ? ` Akkor a kód jelentése „${row.korabbiLabel}” volt.`
          : ""));
    }
    if (!open && ctx.on > until) {
      return out("expired",
        `A(z) ${code} („${label}”) ${until}-ig volt érvényes, az ellátás ` +
        `napja ${ctx.on}.`);
    }
  }

  return out("ok",
    `A(z) ${code} („${label}”) a megadott nemre, életkorra és napra a(z) ` +
    `${tableId} ${t.version} törzs szerint érvényes.`);
}

/** Csak azok a státuszok, amelyek MEGAKADÁLYOZZÁK a jelentést. */
export function blocksReporting(s: ValidityStatus): boolean {
  return s === "wrongSex" || s === "outOfAgeRange" || s === "notYetValid" || s === "expired";
}
