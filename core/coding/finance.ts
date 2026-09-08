/**
 * FINANSZÍROZÁSI KÓDAJÁNLÁS — teljes és helyes kódolás, nem felülkódolás.
 *
 * A KÜLÖNBSÉG, AMIN AZ EGÉSZ RÉTEG ÁLL:
 *
 *   · TELJES KÓDOLÁS — ami megtörtént és dokumentálva van, az kerüljön be. A
 *     bevétel java nem attól vész el, hogy valaki keveset kér, hanem attól,
 *     hogy egy elvégzett beavatkozás vagy egy fennálló kísérő betegség nem
 *     kerül a jelentésbe, vagy jelentés közben elakad egy formai szabályon.
 *
 *   · FELÜLKÓDOLÁS — olyan kód jelentése, aminek nincs alapja a rögzített
 *     adatban. Ezt a réteg NEM TÁMOGATJA, és nem óvatosságból: a rangsorolás
 *     kizárólag SORRENDET ad azoknak a kódoknak, amelyek MÁR átmentek a
 *     bizonyíték-kapun. Ami nem következik a rögzített adatból, az a listára
 *     nem kerül fel — akármennyit érne.
 *
 * A rangsor tehát nem választ, hanem elrendez. És ahol a jogszabály maga
 * mondja meg a választást — 9/2012. NEFMI 5. § (7): „az egyidejűleg nem
 * elszámolható önálló egészségügyi eljárások esetén a kizárásos kapcsolatban
 * álló egészségügyi eljárások közül a MAGASABB PONTSZÁMÚ számolható el" —,
 * ott a rendszer a jogszabályt követi, nem az érdeket.
 *
 * AMI NINCS MEG, ÉS EZÉRT NEM IS ADJUK:
 *
 *   · az OENO PONTÉRTÉKEK (9/1993. NM rendelet 2. melléklet). Enélkül a
 *     kizárásos ütközést KIMUTATJUK, de nem választunk helyette.
 *   · a HBCS BESOROLÓ ALGORITMUS. A súlyszámtábla teljes; az, hogy melyik
 *     diagnózis-beavatkozás kombináció melyik csoportba esik, nincs meg.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import { getTable, lookupCode, tableAsOf } from "./tables.ts";
import type { CodeRules, CodeSuggestion } from "./rules.ts";

/* ── OENO: elszámolható-e egyáltalán ─────────────────────────────────── */

export type Billability =
  /** A formai feltételek teljesülnek. */
  | "billable"
  /** A jelentő szakma nem jogosult rá. */
  | "wrongSpecialty"
  /** Kötelező diagnózis-feltétel, ami nincs rögzítve. */
  | "missingDiagnosis"
  /** Ismeretlen kód. */
  | "unknown";

export interface OenoCheck {
  code: string;
  label: string;
  status: Billability;
  why: string;
  /** Mely szakmakódok jogosultak rá. */
  szakma: string[];
  /** Mely BNO-k mellett számolható el (4. melléklet), ha kötött. */
  requiresBno: string[];
  /** Ismétlési korlát, ahogy a jogszabály írja — SZÖVEG, nem gépi szabály. */
  limit?: string;
  /** Kizárásban álló eljárások. */
  excludes: string[];
}

/**
 * Egy eljárás PONTÉRTÉKE a betöltött törzslistából.
 *
 * Ez teszi elvégezhetővé, amit a jogszabály előír: kizárásos ütközésnél a
 * magasabb pontszámú eljárás számolható el. A hívó felülírhatja (teszthez,
 * vagy másik érvényességi időszak táblájához), de alapértelmezésben a
 * betöltött törzs dönt — nem egy kézzel átadott lista.
 */
export function oenoPoints(code: string): number | null {
  const row = getTable("tbl.oeno")?.rows[code] as Record<string, string> | undefined;
  const n = Number(row?.pont);
  return Number.isFinite(n) ? n : null;
}

const split = (s: string | undefined): string[] =>
  (s ?? "").split(";").map((x) => x.trim()).filter(Boolean);

function oenoRow(code: string): Record<string, string> | null {
  const t = getTable("tbl.oeno");
  return (t?.rows[code] as Record<string, string>) ?? null;
}

/**
 * Elszámolható-e ez az eljárás EBBEN az esetben.
 *
 * A két gyakori elutasítási ok itt derül ki előre, nem a jelentés után: a
 * szakma nem jogosult rá, vagy a jogszabály által megkövetelt diagnózis
 * nincs rögzítve. Mindkettő ELMARADT BEVÉTEL — és mindkettő a
 * dokumentáció hiánya, nem a kódolásé.
 */
export function checkOeno(
  reg: Registry, state: CaseState, code: string, specialty?: string,
): OenoCheck {
  const row = oenoRow(code);
  const base = {
    code, szakma: split(row?.szakma), excludes: split(row?.kizarva),
    requiresBno: [] as string[], limit: row?.maxElszamolas,
  };
  if (!row) {
    return {
      ...base, label: code, status: "unknown",
      why: `A(z) ${code} kód nincs a betöltött OENO-törzsben.`,
    };
  }
  const label = row.label ?? code;

  const bnoRow = getTable("tbl.oeno.bno")?.rows[code] as Record<string, string> | undefined;
  const requiresBno = split(bnoRow?.bno);
  base.requiresBno = requiresBno;

  if (specialty && base.szakma.length && !base.szakma.includes(specialty)) {
    return {
      ...base, label, status: "wrongSpecialty",
      why:
        `A(z) ${specialty} szakmakód NINCS a(z) ${code} eljárás elszámolási ` +
        `kompetenciái közt (${base.szakma.join(", ")}). A jelentés ezen a ` +
        `szakmán elakadna — ez ELMARADT BEVÉTEL, nem kódolási hiba.`,
    };
  }

  if (requiresBno.length) {
    // A rögzített BNO-k: a kódoló döntése és a rendszer ajánlása is számít,
    // mert a jelentésbe bármelyik bekerülhet.
    const dx = resolve(reg, state, "code.dx.primary");
    const sec = resolve(reg, state, "code.dx.secondary");
    const have = new Set<string>();
    if (dx.state === "ok") have.add(String(dx.value).replace(".", ""));
    if (sec.state === "ok") {
      for (const v of Array.isArray(sec.value) ? sec.value : [sec.value]) {
        have.add(String(v).replace(".", ""));
      }
    }
    const ok = requiresBno.some((b) => have.has(b));
    if (!ok) {
      return {
        ...base, label, status: "missingDiagnosis",
        why:
          `A(z) ${code} eljárás a 9/2012. NEFMI rendelet 4. melléklete szerint ` +
          `KIZÁRÓLAG a következő BNO-kódok mellett számolható el: ` +
          `${requiresBno.join(", ")}. Ezek egyike sincs rögzítve. Ha a ` +
          `diagnózis fennáll, RÖGZÍTENI KELL — enélkül az elvégzett vizsgálat ` +
          `elszámolása elakad.`,
      };
    }
  }

  return {
    ...base, label, status: "billable",
    why: "A formai elszámolhatósági feltételek teljesülnek.",
  };
}

/* ── Kizárásos ütközés ───────────────────────────────────────────────── */

export interface Conflict {
  a: string;
  b: string;
  labelA: string;
  labelB: string;
  /** Melyiket lehet elszámolni. `null`, ha nem dönthető el. */
  keep: string | null;
  why: string;
}

export interface OenoPlan {
  reported: string[];
  checks: OenoCheck[];
  conflicts: Conflict[];
  /** Amit ténylegesen jelenteni lehet, a mai adatokból. */
  billable: string[];
  /** Igaz, ha ütközést pontérték híján nem tudtunk feloldani. */
  undecidedConflicts: boolean;
  caveat: string;
}

/**
 * Az egy megjelenéshez jelentett eljárások átnézése.
 *
 * A kizárásokat a jogszabály 3. melléklete adja (758 eljárásnál van
 * `Kizárva:` lista). A feloldást is a jogszabály adja — 5. § (7): a magasabb
 * PONTSZÁMÚ számolható el. Pontérték nélkül a rendszer az ütközést kimutatja,
 * és a döntést a kódolóra hagyja: nem választ érdek szerint.
 */
export function planOeno(
  reg: Registry, state: CaseState, codes: string[],
  opts: { specialty?: string; points?: Record<string, number> } = {},
): OenoPlan {
  const checks = codes.map((c) => checkOeno(reg, state, c, opts.specialty));
  const conflicts: Conflict[] = [];
  const dropped = new Set<string>();

  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      const a = codes[i], b = codes[j];
      const ra = oenoRow(a), rb = oenoRow(b);
      const excl = split(ra?.kizarva).includes(b) || split(rb?.kizarva).includes(a);
      if (!excl) continue;
      const pa = opts.points?.[a] ?? oenoPoints(a);
      const pb = opts.points?.[b] ?? oenoPoints(b);
      let keep: string | null = null;
      let why: string;
      if (pa != null && pb != null) {
        keep = pa >= pb ? a : b;
        why =
          `Kizárásos kapcsolat. A 9/2012. NEFMI rendelet 5. § (7) szerint a ` +
          `MAGASABB PONTSZÁMÚ eljárás számolható el: ${keep} ` +
          `(${Math.max(pa, pb)} pont) a ${keep === a ? b : a} ` +
          `(${Math.min(pa, pb)} pont) helyett.`;
        dropped.add(keep === a ? b : a);
      } else {
        why =
          `Kizárásos kapcsolat: a(z) ${a} és a(z) ${b} egyidejűleg NEM ` +
          `számolható el. A jogszabály szerint a magasabb pontszámú marad — de ` +
          `az OENO PONTÉRTÉKEK nincsenek betöltve (9/1993. NM rendelet 2. ` +
          `melléklet), ezért a rendszer NEM választ helyetted. Mindkettő ` +
          `elvégzett beavatkozás maradhat a dokumentációban; a JELENTÉSBE ` +
          `csak az egyik kerülhet.`;
      }
      conflicts.push({
        a, b, labelA: oenoRow(a)?.label ?? a, labelB: oenoRow(b)?.label ?? b, keep, why,
      });
    }
  }

  const billable = checks
    .filter((c) => c.status === "billable" && !dropped.has(c.code))
    .map((c) => c.code);
  const undecided = conflicts.some((c) => c.keep === null);
  const blocked = checks.filter((c) => c.status !== "billable");

  const parts: string[] = [];
  if (blocked.length) {
    parts.push(
      `${blocked.length} eljárás formai okból nem számolható el: ` +
      blocked.map((c) => `${c.code} (${c.status})`).join(", ") +
      ". Ez ELMARADT BEVÉTEL, és a dokumentáció kiegészítésével orvosolható — " +
      "nem másik kód választásával.",
    );
  }
  if (undecided) {
    parts.push(
      "Feloldatlan kizárásos ütközés: pontérték nélkül a rendszer nem választ. " +
      "A döntés a kódolóé.",
    );
  }
  parts.push(
    "A rangsorolás SORRENDET ad, nem kódot: csak olyan kód szerepel benne, " +
    "ami a rögzített adatból következik.",
  );
  return {
    reported: codes, checks, conflicts, billable,
    undecidedConflicts: undecided, caveat: parts.join(" "),
  };
}

/* ── HBCS: súlyszám és határnapok ────────────────────────────────────── */

export interface HbcsValue {
  group: string;
  label: string;
  sulyszam: number | null;
  mutetiSulyszam: number | null;
  alsoHatarnap: number | null;
  felsoHatarnap: number | null;
  normativNap: number | null;
  /** Az ápolási idő elszámolási következménye. */
  losEffect: "belowLower" | "inRange" | "aboveUpper" | "unknown";
  /** Melyik KIADÁSBÓL való az érték — retrospektív esetnél ez dönti el az összeget. */
  edition: string;
  /** Meghatározott intézeti körben végezhető csoport (a törzs `*` jele). */
  institutionRestricted: boolean;
  why: string;
}

export function hbcsValue(group: string, losDays?: number | null): HbcsValue | null {
  return hbcsValueOn(group, losDays, null).value;
}

export interface HbcsValueOn {
  value: HbcsValue | null;
  /** Melyik kiadásból dolgoztunk, és miért az. */
  editionWhy: string;
}

/**
 * Egy csoport értéke AZ ELLÁTÁS NAPJÁN érvényes kiadás szerint.
 *
 * A mai táblával elszámolt tavalyi eset rossz összeget ad, és a hiba nem
 * látszik: a csoportkód ugyanaz maradt, csak a súlyszám más. Ha az adott
 * napra egyik betöltött kiadás sem érvényes, a válasz a hiány kimondása —
 * NEM a legközelebbi kiadás.
 */
export function hbcsValueOn(
  group: string, losDays: number | null | undefined, on: string | null,
): HbcsValueOn {
  const picked = on ? tableAsOf("tbl.hbcs", on) : null;
  const table = on ? picked!.table : (getTable("tbl.hbcs") ?? null);
  const editionWhy = on
    ? picked!.why
    : (table
        ? `Az ellátás napja nincs megadva, ezért a HATÁLYOS kiadás ` +
          `(${table.version}) szerint. Retrospektív esetnél ez rossz összeget adhat.`
        : "A HBCS-törzs nincs betöltve.");
  const row = table?.rows[group] as Record<string, string> | undefined;
  if (!row || !table) return { value: null, editionWhy };
  const num = (s: string | undefined) => {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  const lo = num(row.alsoHatarnap), hi = num(row.felsoHatarnap);
  let eff: HbcsValue["losEffect"] = "unknown";
  let why =
    "Az ápolási idő nem ismert, ezért az elszámolási következmény nem " +
    "állapítható meg.";
  if (losDays != null && lo != null && hi != null) {
    if (losDays < lo) {
      eff = "belowLower";
      why =
        `Az ápolási idő (${losDays} nap) az ALSÓ HATÁRNAP (${lo}) alatt van: ` +
        `a csoport teljes súlyszáma ilyenkor nem számolható el. Ha az ellátás ` +
        `valóban rövidebb volt, ez nem hiba — a jelentés akkor is így helyes.`;
    } else if (losDays > hi) {
      eff = "aboveUpper";
      why =
        `Az ápolási idő (${losDays} nap) a FELSŐ HATÁRNAP (${hi}) felett van: ` +
        `a határnapon túli napokra külön, napidíjas elszámolás vonatkozik.`;
    } else {
      eff = "inRange";
      why = `Az ápolási idő (${losDays} nap) a határnapok közt van (${lo}–${hi}).`;
    }
  }
  if (row.intezetiKorhozKotott === "igen") {
    why +=
      ` A csoport MEGHATÁROZOTT INTÉZETI KÖRBEN végezhető (a törzs „*” jele): ` +
      `ha az intézet nem jogosult rá, a 10/2012. NEFMI 20. § (3) szerint a ` +
      `következő elszámolható legmagasabb súlyszámú csoportba kerül. Azt, hogy ` +
      `az intézet jogosult-e, a rendszer NEM tudja — a kompetencialista nincs betöltve.`;
  }
  return {
    value: {
      group, label: row.label ?? group,
      sulyszam: num(row.sulyszam), mutetiSulyszam: num(row.mutetiSulyszam),
      alsoHatarnap: lo, felsoHatarnap: hi, normativNap: num(row.normativNap),
      losEffect: eff, edition: table.version,
      institutionRestricted: row.intezetiKorhozKotott === "igen",
      why,
    },
    editionWhy,
  };
}

/**
 * Csoportok súlyszám szerint, csökkenő sorrendben.
 *
 * FIGYELEM: ez NEM választás. A besorolást a grouper végzi a diagnózis és a
 * beavatkozás alapján; a rendszerben az nincs meg. A rangsor arra jó, hogy a
 * kódoló lássa, mekkora a tétje annak a kérdésnek, amit neki kell eldöntenie
 * — nem arra, hogy a nagyobb súlyszámút válassza.
 */
export function rankHbcs(groups: string[], losDays?: number | null): HbcsValue[] {
  return groups
    .map((g) => hbcsValue(g, losDays))
    .filter((x): x is HbcsValue => !!x)
    .sort((a, b) => (b.sulyszam ?? -1) - (a.sulyszam ?? -1));
}

/* ── A rangsor, ami csak elrendez ────────────────────────────────────── */

export interface RankedCode {
  code: string;
  label: string;
  value: number | null;
  valueKind: "sulyszam" | "pont" | null;
  evidence: number;
  why: string;
}

/**
 * A bizonyítékkal alátámasztott kódajánlások sorrendje.
 *
 * A rendezés kulcsa a finanszírozási érték, ahol ISMERT; ahol nem, a
 * bizonyítékok száma. De a LISTÁRA KERÜLÉS feltétele változatlanul a
 * bizonyíték — a rangsor nem vesz fel semmit, csak elrendez.
 */
export function rankByValue(
  reg: Registry, rules: CodeRules, state: CaseState,
  opts: { points?: Record<string, number> } = {}, lang: Lang = "hu",
): { ranked: RankedCode[]; caveat: string } {
  const s = rules.suggest(reg, state, lang);
  const ranked: RankedCode[] = s.suggestions
    .filter((x: CodeSuggestion) => x.status === "suggested")
    .map((x) => {
      const pt = opts.points?.[x.code] ?? oenoPoints(x.code);
      return {
        code: x.code,
        label: x.label || lookupCode("tbl.bno", x.code).value || x.code,
        value: pt, valueKind: pt == null ? null : "pont" as const,
        evidence: x.because.length,
        why: x.why,
      };
    })
    .sort((a, b) =>
      (b.value ?? -1) - (a.value ?? -1) || b.evidence - a.evidence ||
      a.code.localeCompare(b.code));

  return {
    ranked,
    caveat:
      "A LISTÁRA KERÜLÉS FELTÉTELE A BIZONYÍTÉK, nem az érték: minden itt " +
      "szereplő kód a rögzített adatból következik, és a rangsor csak " +
      "elrendezi őket. Kód, aminek nincs alapja a dokumentációban, akkor sem " +
      "kerül fel, ha többet érne. " +
      (getTable("tbl.oeno")
        ? "A BNO-kódnak nincs önálló pontértéke — a finanszírozási súly a " +
          "HBCS-csoportból jön, a besorolást pedig a grouper végzi. A " +
          "diagnózis-kódok sorrendjét ezért a bizonyítékok száma adja."
        : "Az OENO-törzs nincs betöltve, ezért a sorrendet a bizonyítékok " +
          "száma adja, nem a pontszám."),
  };
}
