/**
 * A NORMOGRAMOK HITELESÍTÉSE — a 7. lépés aláírási rétege.
 *
 * Ugyanaz a szerkezet, mint a laborreferenciáknál (6. lépés), két
 * többlettel, és mindkettő ebből a területből jön:
 *
 *   1. A HITELESÍTŐ KÉPESÍTÉSE. A magzati biometria görbéit nem „egy orvos”
 *      hitelesíti: az FMF-engedélyszám az, ami a mérési technikát is fedezi.
 *      Egy hibátlan görbe rossz technikával mért adaton ugyanúgy téved.
 *
 *   2. A MÉRÉSI KONVENCIÓ. Ahol kétféle konvencióval publikáltak (a BPD-nél
 *      külső-belső és külső-külső él), ott a görbe kiválasztása ÖNMAGÁBAN NEM
 *      ELÉG: tudni kell, hogyan mér az a gép, amelyik a mi adatunkat adja. Ez
 *      a különbség néhány milliméter — ami a 3. trimeszterben egy percentilis
 *      sávot jelent, és mindig UGYANABBA az irányba téved.
 *
 * A lenyomat a görbe NORMATÍV MAGJÁT fedi: a mérést, a független változót, az
 * egységet és a SOROKAT. A `population`, a `source.cite` és a megjegyzés
 * kimarad — azok javíthatók az aláírás elvesztése nélkül. Egyetlen sor
 * megváltoztatása viszont elavulttá teszi: az aláíró AZOKRA a számokra
 * mondta ki, hogy helyesek.
 */
import { readFileSync } from "node:fs";
import { lenyomat } from "../lab/hitelesites.ts";
import type { CataloguedChart, ChartCatalogue } from "./katalogus.ts";
import { chartsFor } from "./katalogus.ts";
import { hitelesitett } from "./normogram.ts";
import type { Normogram } from "./normogram.ts";

export { lenyomat };

/** A görbe normatív magja — ez az, amit aláírnak. */
export function lenyeg(n: Normogram): string {
  const sorok = (n.rows ?? [])
    .map((r) => `${r.x}:${r.mean ?? ""}/${r.sd ?? ""}/${JSON.stringify(r.p ?? null)}`)
    .join(";");
  return `${n.id}|${n.parameter}|${n.by}|${n.unit ?? ""}|${sorok}`;
}

export interface NormogramHitelesites {
  normogram: string;
  ki: string;
  /**
   * FMF-engedélyszám vagy azzal egyenértékű képesítés. Nem formaság: a
   * magzati biometria görbéinél a MÉRÉSI TECHNIKA is a hitelesítés tárgya.
   */
  kepesites: string;
  mikor: string;
  lenyomat: string;
  /** Melyik közleménnyel, melyik táblázatával vetették össze. */
  forrasTabla: string;
  /**
   * Melyik mérési konvencióra érvényes. Konvenciófüggő mérésnél KÖTELEZŐ —
   * enélkül a görbe helyes, a rá mért adat viszont nem hozzá tartozik.
   */
  konvencio?: "outerInner" | "outerOuter";
  megjegyzes?: string;
}

export interface NormogramHitelesitesKatalogus {
  szerepek: Record<string, string>;
  hitelesitesek: NormogramHitelesites[];
}

export function loadNormogramHitelesitesek(path: string): NormogramHitelesitesKatalogus {
  return JSON.parse(readFileSync(path, "utf8")) as NormogramHitelesitesKatalogus;
}

export type NgAllapot = "hitelesitve" | "alairatlan" | "elavult" | "helyi";

export interface NgTetelAllapot {
  normogram: string;
  parameter: string;
  allapot: NgAllapot;
  lenyomat: string;
  alairo: string | null;
  kepesites: string | null;
  sorok: number;
  miert: string | null;
}

export function ngAllapot(
  normograms: Normogram[], kat: NormogramHitelesitesKatalogus,
): NgTetelAllapot[] {
  const byId = new Map(kat.hitelesitesek.map((h) => [h.normogram, h]));
  return normograms.map((n) => {
    const mag = lenyomat(lenyeg(n));
    const h = byId.get(n.id);
    const kozos = {
      normogram: n.id, parameter: n.parameter, lenyomat: mag,
      sorok: n.rows?.length ?? 0,
    };
    // A HELYI tábla nem aláírás tárgya: nem publikált görbe, hanem a saját
    // populációnkból generált referencia. A `derivedFrom` felel érte.
    if (n.verification === "local") {
      return { ...kozos, allapot: "helyi" as const, alairo: null, kepesites: null,
               miert: "helyi tábla — nem publikált görbe, a `derivedFrom` a fedezete" };
    }
    if (!h) {
      return { ...kozos, allapot: "alairatlan" as const, alairo: null,
               kepesites: null, miert: null };
    }
    if (h.lenyomat !== mag) {
      return {
        ...kozos, allapot: "elavult" as const, alairo: h.ki, kepesites: h.kepesites,
        miert:
          `a görbe sorai megváltoztak az aláírás óta (aláírt: ${h.lenyomat}, ` +
          `mostani: ${mag}) — az aláírás nem fedezi a mostani számokat`,
      };
    }
    return { ...kozos, allapot: "hitelesitve" as const, alairo: h.ki,
             kepesites: h.kepesites, miert: null };
  });
}

/** A hitelesített görbéket emeli `primary`-re — futásidőben, aláírásból. */
export function alkalmazNg(
  normograms: Normogram[], kat: NormogramHitelesitesKatalogus,
): number {
  let n = 0;
  for (const a of ngAllapot(normograms, kat)) {
    if (a.allapot !== "hitelesitve") continue;
    const ng = normograms.find((x) => x.id === a.normogram);
    if (!ng) continue;
    ng.verification = "primary";
    n++;
  }
  return n;
}

export interface NgIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

export function validateNgHitelesitesek(
  normograms: Normogram[], kat: NormogramHitelesitesKatalogus,
  cat: ChartCatalogue, lekepezes: Record<string, string>,
): NgIssue[] {
  const out: NgIssue[] = [];
  const latott = new Set<string>();
  // Melyik VÁLTOZÓ konvenciófüggő — a katalógusból, nem feltevésből.
  const konvenciofuggoValtozok = new Set<string>();
  for (const [base, variable] of Object.entries(lekepezes)) {
    const k = new Set(chartsFor(cat, base)
      .map((c: CataloguedChart) => c.convention).filter(Boolean));
    if (k.size > 1) konvenciofuggoValtozok.add(variable);
  }

  for (const h of kat.hitelesitesek) {
    if (latott.has(h.normogram)) {
      out.push({ severity: "error", id: h.normogram,
                 message: "két hitelesítés ugyanarra a görbére" });
    }
    latott.add(h.normogram);

    const n = normograms.find((x) => x.id === h.normogram);
    if (!n) {
      out.push({ severity: "error", id: h.normogram,
                 message: "hitelesítés nem betöltött görbére" });
      continue;
    }
    if (n.verification === "local") {
      out.push({
        severity: "error", id: h.normogram,
        message:
          "HELYI tábla hitelesítése: a `local` sosem válik `primary`-vé — más " +
          "a fajtája, nem a minősége. A fedezete a `derivedFrom`, nem aláírás",
      });
    }
    if (!h.ki?.trim()) {
      out.push({ severity: "error", id: h.normogram,
                 message: "névtelen hitelesítés — nincs felelős" });
    }
    if (!h.kepesites?.trim()) {
      out.push({
        severity: "error", id: h.normogram,
        message:
          "hiányzó `kepesites` (FMF-engedélyszám vagy egyenértékű) — a magzati " +
          "biometriánál a MÉRÉSI TECHNIKA is a hitelesítés tárgya",
      });
    }
    if (!h.forrasTabla?.trim()) {
      out.push({ severity: "error", id: h.normogram,
                 message: "hiányzó `forrasTabla` — nem derül ki, MELYIK táblázattal vetették össze" });
    }
    if (konvenciofuggoValtozok.has(n.parameter) && !h.konvencio) {
      out.push({
        severity: "error", id: h.normogram,
        message:
          `a(z) ${n.parameter} KONVENCIÓFÜGGŐ mérés, az aláírás mégsem mondja ` +
          `meg, melyik konvencióra érvényes. A görbe így helyes lehet, a rá ` +
          `mért adat viszont nem hozzá tartozik — és a tévedés mindig ` +
          `ugyanabba az irányba mutat`,
      });
    }
  }

  // `primary` CSAK aláírásból.
  for (const n of normograms) {
    if (!hitelesitett(n)) continue;
    const h = kat.hitelesitesek.find((x) => x.normogram === n.id);
    if (!h) {
      out.push({
        severity: "error", id: n.id,
        message:
          "`verification: \"primary\"` a görbén, HITELESÍTÉS NÉLKÜL — a kaput " +
          "aláírás nyitja, nem jelölés",
      });
    } else if (h.lenyomat !== lenyomat(lenyeg(n))) {
      out.push({ severity: "error", id: n.id,
                 message: "`primary` jelölés ELAVULT aláírással" });
    }
  }

  for (const a of ngAllapot(normograms, kat)) {
    if (a.allapot === "elavult") {
      out.push({ severity: "error", id: a.normogram, message: a.miert! });
    }
  }
  return out;
}
