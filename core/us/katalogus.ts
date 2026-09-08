/**
 * NORMOGRAM-KATALÓGUS — mely görbék LÉTEZNEK, mérésenként.
 *
 * A rendszerben eddig két szint volt, és a köztük lévő különbség a
 * `07-normogram` fejezet lényege:
 *
 *   TELEPÍTVE     a tábla be van töltve — adminisztratív lépés
 *   HITELESÍTVE   szakmai felelősség névvel és dátummal — EZ nyitja a kaput
 *
 * A katalógus egy HARMADIK, a kettő ELŐTTI szintet ír le:
 *
 *   KATALOGIZÁLVA   tudjuk, hogy létezik ilyen publikált görbe, és tudjuk,
 *                   melyik közleményben — de a TÁBLA NINCS MEG
 *
 * Miért kell ez külön szint. Egy hasi körfogathoz 15 publikált görbe létezik;
 * a rendszerben ebből egy van betöltve, és az sem hitelesített. E nélkül a
 * katalógus nélkül ez a hiány LÁTHATATLAN: úgy tűnne, hogy „van AC-görbe”, és
 * nem derülne ki, hogy egy tucatnyi másik létezik, amelyik ugyanarra a
 * magzatra más percentilist adna.
 *
 * A KATALÓGUS TEHÁT NEM KÉNYELMI LISTA, HANEM A HIÁNY MÉRTÉKE.
 *
 * És egy második dolgot is láthatóvá tesz, ami a görbék puszta felsorolásából
 * nem tűnik fel: hogy ugyanahhoz a méréshez tartozó két görbe MÁS MÉRÉSI
 * KONVENCIÓRA épül. A BPD-t mérni lehet külső-belső és külső-külső él között,
 * és a Chitty 1994 mindkettőre ad görbét. A kettő közt több milliméter a
 * különbség — a felcserélésük nem elírás, hanem néma percentilis-eltolódás.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import { adPercentilist, hitelesitett, NORMOGRAM_VERIFICATION } from "./normogram.ts";
import type { Normogram } from "./normogram.ts";

/** Mérési konvenció. A BPD-nél nem részlet: a két él közt milliméterek vannak. */
export type Convention = "outerInner" | "outerOuter";

/** Melyik populációra készült a görbe. Egyes magzatra készült görbe ikerre nem áll. */
export type ChartPopulation = "singleton" | "twin" | "twinDCDA" | "twinMCDA";

export type ChartDomain =
  | "biometry" | "cardiac" | "doppler" | "ctg"
  | "fetalBlood" | "biochemistry" | "birth" | "other";

export interface CataloguedChart {
  id: string;
  /** A mérés neve úgy, ahogy a forráskatalógusban áll (pl. `BPD twins DCDA`). */
  measure: string;
  /** A mérés neve a minősítők nélkül (pl. `BPD`). */
  base: string;
  domain: ChartDomain;
  population: ChartPopulation;
  cite: string;
  author: string;
  year: number | null;
  /** Használatban van-e abban a rendszerben, ahonnan a katalógus származik. */
  inUseInSource: boolean;
  note?: string;
  convention?: Convention;
  /** `1`, ha kifejezetten első trimeszteri görbe. */
  trimester?: number;
  sex?: "male" | "female";
  markedUnused?: boolean;
}

export interface ChartCatalogue {
  id: string;
  label: I18n;
  source: { cite: string };
  coverage: "full" | "partial";
  coverageNote?: I18n;
  /** A katalógus NEVESÍTETT lyukai. */
  gaps: string[];
  charts: CataloguedChart[];
}

export function loadChartCatalogue(path: string): ChartCatalogue {
  return JSON.parse(readFileSync(path, "utf8")) as ChartCatalogue;
}

/** Az adott méréshez tartozó összes publikált görbe. */
export function chartsFor(cat: ChartCatalogue, base: string): CataloguedChart[] {
  return cat.charts.filter((c) => c.base === base);
}

/** Mely mérésekhez ismerünk görbét — ábécésorrendben. */
export function measures(cat: ChartCatalogue): string[] {
  return [...new Set(cat.charts.map((c) => c.base))].sort();
}

/* ── A HÁROM SZINT MÉRLEGE ──────────────────────────────────────────── */

export interface MeasureCoverage {
  base: string;
  domain: ChartDomain;
  /** Hány publikált görbét ismerünk. */
  catalogued: number;
  /** Hány táblát töltöttünk be ténylegesen. */
  installed: number;
  /** Ebből hány hitelesített (`primary`). */
  verified: number;
  /**
   * Ahány ténylegesen PERCENTILIST AD — a hitelesítettek és a helyiek együtt.
   * A kettő szándékosan külön szám: a `local` nem gyengébb hitelesítés, hanem
   * más fajta, és a összeadásuk épp ezt a különbséget tüntetné el.
   */
  percentilist: number;
  why: string;
}

/**
 * A katalógus és a betöltött normogramok összevetése.
 *
 * A `parameterOf` mondja meg, melyik regiszterbeli változó melyik katalógusbeli
 * méréshez tartozik. Ez a leképezés SZÁNDÉKOSAN kívülről jön: a katalógus
 * idegen rendszerből származik, és a nevek egyeztetése emberi döntés, nem
 * karakterlánc-hasonlóság. Egy „HC" és egy „HC/AC" közti automatikus párosítás
 * pont az a fajta csendes hiba, amit a réteg egyébként kizár.
 */
export function coverage(
  cat: ChartCatalogue, normograms: Normogram[], parameterOf: Record<string, string>,
): MeasureCoverage[] {
  const out: MeasureCoverage[] = [];
  for (const base of measures(cat)) {
    const charts = chartsFor(cat, base);
    const param = parameterOf[base];
    const mine = param ? normograms.filter((n) => n.parameter === param) : [];
    // NEVESÍTETT PREDIKÁTUM, nem karakterlánc-hasonlítás: itt állt korábban a
    // `=== "verified"`, ami sosem igaz, mert ilyen szint nincs.
    const verified = mine.filter(hitelesitett);
    const percentilist = mine.filter(adPercentilist);
    out.push({
      base, domain: charts[0].domain,
      catalogued: charts.length, installed: mine.length, verified: verified.length,
      percentilist: percentilist.length,
      why:
        `${charts.length} publikált görbét ismerünk erre a mérésre; ` +
        (!param
          ? "a mérés NINCS a regiszter változójához kötve, ezért betöltött tábla sem tartozhat hozzá."
          : mine.length === 0
            ? "egy sincs betöltve — a rendszer erre a mérésre percentilist NEM ad."
            : percentilist.length === 0
              ? `${mine.length} be van töltve, de EGYIK SEM ad percentilist: a tábla látszik, a kapu zárva.`
              : `${mine.length} betöltve, ebből ${verified.length} hitelesített` +
                (percentilist.length > verified.length
                  ? ` és ${percentilist.length - verified.length} helyi (más fajta, nem gyengébb).`
                  : ".")),
    });
  }
  return out;
}

/* ── A GÖRBEVÁLASZTÁS KAPUJA ────────────────────────────────────────── */

/** Amit a mérésről tudni kell ahhoz, hogy görbét lehessen hozzá választani. */
export interface MeasurementContext {
  /** Egyes magzat vagy iker, és ha iker: milyen. Hiánya NEM „egyes”. */
  population?: ChartPopulation | null;
  /** Melyik konvencióval mérték. A BPD-nél ennek hiánya kapu. */
  convention?: Convention | null;
  /** Terhességi hét — az első trimeszteri görbék elhatárolásához. */
  ga?: number | null;
  sex?: "male" | "female" | null;
}

export type PickStatus = "ok" | "mismatch" | "undetermined";

export interface PickResult {
  chart: string;
  status: PickStatus;
  why: string;
}

/**
 * Alkalmazható-e EZ a görbe EZRE a mérésre.
 *
 * Négy dolgot néz, és mindegyiknél ugyanaz a szabály: ha a mérésről nem tudjuk
 * az adott jellemzőt, a válasz `undetermined` — NEM „megfelel”. Egy ikret egyes
 * magzat görbéjéhez mérni nem hibaüzenetet ad, hanem rossz percentilist, és a
 * rossz percentilisből rossz döntés lesz.
 */
export function pick(
  chart: CataloguedChart, ctx: MeasurementContext,
  opts: { conventionSensitive?: boolean } = {},
): PickResult {
  const r = (status: PickStatus, why: string): PickResult =>
    ({ chart: chart.id, status, why });

  if (chart.markedUnused) {
    return r("mismatch",
      `A(z) ${chart.measure} görbe a forráskatalógusban „unused” jelöléssel áll: ` +
      `a származási rendszerben sem használják.`);
  }

  /* 1. POPULÁCIÓ. Az iker növekedése MÁS — nem rosszabb, más. */
  if (ctx.population == null) {
    return r("undetermined",
      `Nincs rögzítve, hogy egyes magzatról vagy ikerről van-e szó. Az ikrek ` +
      `növekedési pályája MÁS, ezért egyes magzat görbéje ikerre nem áll. Ez ` +
      `NEM azt jelenti, hogy a görbe megfelel.`);
  }
  if (chart.population !== ctx.population) {
    return r("mismatch",
      `A görbe ${popHu(chart.population)} populációra készült, a mérés ` +
      `${popHu(ctx.population)} magzaté.`);
  }

  /* 2. MÉRÉSI KONVENCIÓ. A BPD-nél ez milliméterekben mérhető különbség.
        A mérés konvenció-érzékenységét MAGA A KATALÓGUS árulja el: ha
        ugyanarra a mérésre van kétféle konvencióval publikált görbe, akkor a
        konvenció számít — és akkor az a görbe is bizonytalan, amelyik NEM
        mondja meg, melyikkel készült. */
  if (opts.conventionSensitive && !chart.convention) {
    return r("undetermined",
      `Erre a mérésre kétféle mérési konvencióval is publikáltak görbét, ez a ` +
      `közlemény viszont a katalógusban nem jelöli, melyikkel készült. Amíg ez ` +
      `nem tisztázott a közleményből, a görbe nem választható biztonsággal.`);
  }
  if (chart.convention) {
    if (ctx.convention == null) {
      return r("undetermined",
        `A görbe ${convHu(chart.convention)} mérésre készült, de nincs ` +
        `rögzítve, milyen konvencióval mértek. A két konvenció közt több ` +
        `milliméter a különbség — a felcserélésük néma percentilis-eltolódás.`);
    }
    if (chart.convention !== ctx.convention) {
      return r("mismatch",
        `A görbe ${convHu(chart.convention)}, a mérés ${convHu(ctx.convention)} ` +
        `konvencióval készült.`);
    }
  }

  /* 3. TERHESSÉGI KOR. Az első trimeszteri görbék külön listán vannak. */
  if (chart.trimester === 1) {
    if (ctx.ga == null) {
      return r("undetermined",
        `Első trimeszteri görbe, de a terhességi kor nincs rögzítve.`);
    }
    if (ctx.ga >= 14) {
      return r("mismatch",
        `Első trimeszteri görbe, a mérés a ${Math.floor(ctx.ga)}. héten készült.`);
    }
  }

  /* 4. NEM. Csak ott kapu, ahol a görbe nemhez kötött (születési súly, HC). */
  if (chart.sex) {
    if (ctx.sex == null) {
      return r("undetermined",
        `A görbe ${chart.sex === "male" ? "fiú" : "lány"} újszülöttre készült, ` +
        `de a nem nincs rögzítve.`);
    }
    if (chart.sex !== ctx.sex) {
      return r("mismatch",
        `A görbe ${chart.sex === "male" ? "fiú" : "lány"} újszülöttre készült.`);
    }
  }

  return r("ok", `A(z) ${chart.cite} görbe erre a mérésre alkalmazható.`);
}

/** Az alkalmazható görbék — és külön, amikről nem dönthető el. */
export function applicable(
  cat: ChartCatalogue, base: string, ctx: MeasurementContext,
): { ok: PickResult[]; undetermined: PickResult[]; mismatch: PickResult[] } {
  const charts = chartsFor(cat, base);
  // Konvenció-érzékeny a mérés, ha a katalógusban KÉTFÉLE konvencióval is
  // szerepel görbe rá. Ezt nem beleégetett lista dönti el, hanem az adat.
  const conventionSensitive =
    new Set(charts.map((c) => c.convention).filter(Boolean)).size > 1;
  const rs = charts.map((c) => pick(c, ctx, { conventionSensitive }));
  return {
    ok: rs.filter((r) => r.status === "ok"),
    undetermined: rs.filter((r) => r.status === "undetermined"),
    mismatch: rs.filter((r) => r.status === "mismatch"),
  };
}

const popHu = (p: ChartPopulation): string =>
  p === "singleton" ? "egyes magzat" :
  p === "twinDCDA" ? "dichorionicus iker (DCDA)" :
  p === "twinMCDA" ? "monochorionicus iker (MCDA)" : "iker";

const convHu = (c: Convention): string =>
  c === "outerInner" ? "külső-belső él" : "külső-külső él";


/* ── INTEGRITÁS ─────────────────────────────────────────────────────── */

export interface CatalogueIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

export function validateCatalogue(cat: ChartCatalogue): CatalogueIssue[] {
  const out: CatalogueIssue[] = [];
  const seen = new Set<string>();
  for (const c of cat.charts) {
    if (seen.has(c.id)) {
      out.push({ severity: "error", id: c.id, message: "duplikált görbeazonosító" });
    }
    seen.add(c.id);
    if (!c.cite?.trim()) {
      out.push({
        severity: "error", id: c.id,
        message:
          "hivatkozás nélküli görbe — a katalógus egyetlen értéke a közlemény " +
          "megnevezése; enélkül a tétel nem beszerezhető",
      });
    }
    if (!c.base?.trim() || !c.domain) {
      out.push({ severity: "error", id: c.id, message: "hiányzó mérés vagy terület" });
    }
  }
  if (cat.coverage === "partial" && !cat.gaps?.length) {
    out.push({
      severity: "error", id: cat.id,
      message:
        "RÉSZLEGES katalógus a lyukak megnevezése nélkül — egy katalógus, ami " +
        "hallgat a hiányairól, teljesnek látszik",
    });
  }
  // Konvenció-érzékeny mérésnél a jelöletlen görbe nem hiba, de figyelmeztetés:
  // ez az, amit a közleményből utólag tisztázni kell.
  for (const base of measures(cat)) {
    const charts = chartsFor(cat, base);
    const kinds = new Set(charts.map((c) => c.convention).filter(Boolean));
    if (kinds.size > 1) {
      const unmarked = charts.filter((c) => !c.convention).length;
      if (unmarked) {
        out.push({
          severity: "warning", id: base,
          message:
            `${unmarked} görbe nem jelöli a mérési konvenciót, pedig erre a ` +
            `mérésre kétféle konvencióval is publikáltak — ezek a közleményből ` +
            `tisztázandók, addig nem választhatók biztonsággal`,
        });
      }
    }
  }
  return out;
}

/** Emberi olvasatra: hol tart a katalógus, és hol tart a betöltés. */
export function catalogueStamp(
  cat: ChartCatalogue, normograms: Normogram[],
): string {
  const verified = normograms.filter(hitelesitett).length;
  const percentilist = normograms.filter(adPercentilist).length;
  return (
    `${cat.charts.length} katalogizált görbe ${measures(cat).length} mérésre · ` +
    `${normograms.length} betöltve · ${verified} hitelesített` +
    (percentilist > verified ? ` · ${percentilist - verified} helyi` : "") +
    (cat.coverage === "partial" ? " · a katalógus RÉSZLEGES" : "")
  );
}
