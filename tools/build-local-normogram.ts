/**
 * ÖNGENERÁLÓ NORMOGRAM: helyi referencia a saját mérésekből.
 *
 *   node tools/build-local-normogram.ts --parameter us.ac --by ctx.ga \
 *        --cases demo/esetek.json --site "PTE Szülészeti Klinika" \
 *        --min-per-bin 50
 *
 * Miért kell egyáltalán: a publikált táblák más populáción készültek, és a
 * saját betegkörünk átlaga rendszeresen eltér tőlük. A helyi tábla arra
 * válaszol, hogy „mihez képest mérünk MI, ITT" — ez más kérdés, mint hogy
 * „mihez képest szokás mérni".
 *
 * Négy szabály, ami nélkül a helyi tábla ártalmas:
 *
 *   1. KIZÁRÁSOK NÉLKÜL a tábla a BETEGEK populációját írja le, nem a
 *      normálisat. A növekedési elmaradással gondozott eseteket kihagyva a
 *      referencia a normálishoz közelít; benne hagyva a kóros lesz a norma.
 *   2. RITKA SÁVBÓL NINCS PERCENTILIS. Nyolc esetből számolt szórással a
 *      százalék pontosnak látszik, és nem az. A `--min-per-bin` alatti
 *      sávok a futásidőben sem adnak eredményt.
 *   3. A HELYI TÁBLA SOSEM LESZ `primary`. Nem publikált referencia, hanem a
 *      saját adataink leírása — más fajta, nem rosszabb minőség.
 *   4. AZ ADATOK MÁSODLAGOS FELHASZNÁLÁSA. A referencia előállítása
 *      statisztikai célú feldolgozás: a bemenet ESETSZINTEN azonosíthatatlan,
 *      és a kimenet csak összesített értékeket tartalmaz (átlag, szórás,
 *      elemszám). Egyedi mérés a táblából nem rekonstruálható.
 *
 * A bemenet ebben a tárolóban KIZÁRÓLAG szintetikus eset lehet — valódi
 * betegadat a tárolóba nem kerülhet (ld. `.gitignore`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Normogram, NormogramRow } from "../core/us/normogram.ts";

const argv = process.argv.slice(2);
const arg = (n: string, d?: string): string | undefined => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};

const parameter = arg("parameter");
const by = arg("by", "ctx.ga")!;
const casesFile = arg("cases");
const minPerBin = Number(arg("min-per-bin", "50"));
const site = arg("site");
const binWidth = Number(arg("bin-width", "1"));

if (!parameter || !casesFile) {
  console.error("Kötelező: --parameter --cases [--by ctx.ga] [--min-per-bin 50] [--site …]");
  process.exit(1);
}

/**
 * A bemeneti alak szándékosan a lehető legszűkebb: mérésenként EGY pár.
 * Se azonosító, se dátum, se bármi, amiből a beteg visszakereshető lenne.
 */
interface Point { x: number; value: number; excluded?: string | null }
const points: Point[] = JSON.parse(readFileSync(casesFile, "utf8"));

const kept = points.filter((p) => !p.excluded &&
  Number.isFinite(p.x) && Number.isFinite(p.value));
const dropped = points.length - kept.length;

const bins = new Map<number, number[]>();
for (const p of kept) {
  const b = Math.round(p.x / binWidth) * binWidth;
  bins.set(b, [...(bins.get(b) ?? []), p.value]);
}

const rows: NormogramRow[] = [];
const countByX: Record<string, number> = {};
for (const [x, vals] of [...bins].sort((a, b) => a[0] - b[0])) {
  countByX[String(x)] = vals.length;
  if (vals.length < 2) continue;                      // szórás nem számolható
  const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / (vals.length - 1));
  if (!(sd > 0)) continue;
  rows.push({
    x,
    mean: Math.round(mean * 100) / 100,
    sd: Math.round(sd * 100) / 100,
  });
}

if (rows.length < 2) {
  console.error(
    `Kevés adat: ${rows.length} használható sáv. Helyi referencia ebből nem készül — ` +
    `és ez a helyes viselkedés, nem hiba.`,
  );
  process.exit(1);
}

const out: Normogram = {
  id: `ng.local.${parameter.replace(/\./g, "-")}`,
  parameter, by, unit: arg("unit") ?? "",
  kind: "local",
  verification: "local",
  population: site ? `helyi referencia — ${site}` : "helyi referencia",
  source: {
    cite:
      `Helyben generált referencia a saját mérésekből` +
      (site ? `, ${site}` : "") +
      `. Nem publikált standard.`,
  },
  derivedFrom: {
    n: kept.length,
    from: arg("from") ?? "",
    to: arg("to") ?? "",
    site,
    inclusion: ["egyes terhesség", "élő magzat", "ismert gesztációs kor"],
    exclusion: (arg("exclusion") ??
      "növekedési elmaradás gondozás alatt,ismert magzati fejlődési rendellenesség," +
      "cukorbetegség,hypertensiv kórkép").split(","),
    minPerBin,
    countByX,
  },
  rows,
};

const target = join("registry/normogramok", `helyi-${parameter.replace(/\./g, "-")}.json`);
writeFileSync(target, JSON.stringify([out], null, 2) + "\n", "utf8");

const thin = Object.entries(countByX).filter(([, c]) => c < minPerBin);
console.log(`✓ ${target}`);
console.log(`  ${kept.length} mérés, ${rows.length} sáv (${dropped} kizárva a bemenetből)`);
if (thin.length) {
  console.log(
    `  ${thin.length} sáv a ${minPerBin}-es minimum alatt van — ezek futásidőben ` +
    `NEM adnak percentilist: ${thin.map(([x, c]) => `${x}:${c}`).join(" ")}`,
  );
}
console.log(
  "  A tábla `local` szintű, és az is marad: nem publikált standard, hanem a " +
  "saját adataink leírása.",
);
