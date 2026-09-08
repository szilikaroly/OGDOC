/**
 * NORMOGRAM TELEPÍTÉSE publikációból.
 *
 *   node tools/install-normogram.ts --file tabla.csv --id ng.intergrowth.efw \
 *        --parameter us.efw --by ctx.ga --unit g \
 *        --source "INTERGROWTH-21st…" --population "egyes magzat, nemzetközi"
 *
 *   node tools/install-normogram.ts --verify ng.chitty.ac \
 *        --by "Kovács A. (szülész-nőgyógyász)" --against "Br J Obstet Gynaecol 1994;101:125-131"
 *
 * Két külön művelet, szándékosan:
 *
 *   TELEPÍTÉS  — bárki megteheti, és a tábla `assumed` szinten kerül be.
 *                Onnantól LÁTSZIK a rendszerben, de percentilist NEM ad.
 *   HITELESÍTÉS — külön lépés, névvel és dátummal. Ez emeli `primary` szintre.
 *
 * A kettő szétválasztása a lényeg: a telepítés adminisztratív, a hitelesítés
 * szakmai felelősség. Ha ugyanaz a gomb csinálná mindkettőt, a kapu az első
 * sietős telepítéssel elveszne.
 *
 * BEMENETI FORMÁTUM (CSV): `x,mean,sd` fejléccel, vagy `x,p50,p10,p90`
 * (utóbbiból a szórás a percentilisekből becsülhető: sd ≈ (p90 − p10) / 2,563).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Normogram, NormogramRow } from "../core/us/normogram.ts";

const DIR = "registry/normogramok";
const argv = process.argv.slice(2);
const arg = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

function fileOf(id: string): string | null {
  for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
    const list = JSON.parse(readFileSync(join(DIR, f), "utf8")) as Normogram[];
    if (list.some((n) => n.id === id)) return join(DIR, f);
  }
  return null;
}

/* ── HITELESÍTÉS ─────────────────────────────────────────────────────── */
const toVerify = arg("verify");
if (toVerify) {
  const who = arg("by");
  const against = arg("against");
  if (!who || !against) {
    console.error(
      "A hitelesítéshez kell: --by <ki ellenőrizte> és --against <mivel vetette össze>.\n" +
      "Név nélküli hitelesítés nem hitelesítés.",
    );
    process.exit(1);
  }
  const file = fileOf(toVerify);
  if (!file) { console.error(`Nincs ilyen normogram: ${toVerify}`); process.exit(1); }
  const list = JSON.parse(readFileSync(file!, "utf8")) as Array<Normogram & {
    verifiedBy?: string; verifiedAt?: string; verifiedAgainst?: string;
  }>;
  const n = list.find((x) => x.id === toVerify)!;
  if (n.kind === "local") {
    console.error(
      "Öngenerált tábla NEM hitelesíthető `primary` szintre: nem publikált " +
      "referencia, hanem a saját adataink leírása. Ez fajta, nem minőség.",
    );
    process.exit(1);
  }
  n.verification = "primary";
  n.verifiedBy = who;
  n.verifiedAt = new Date().toISOString();
  n.verifiedAgainst = against;
  writeFileSync(file!, JSON.stringify(list, null, 2) + "\n", "utf8");
  console.log(`✓ ${toVerify} hitelesítve — ${who}, ${n.verifiedAt}`);
  console.log("  A kapu ezzel kinyílt: a tábla mostantól percentilist ad.");
  process.exit(0);
}

/* ── TELEPÍTÉS ───────────────────────────────────────────────────────── */
const file = arg("file"), id = arg("id"), parameter = arg("parameter");
const by = arg("by-var") ?? "ctx.ga", unit = arg("unit"), source = arg("source");
if (!file || !id || !parameter || !unit || !source) {
  console.error(
    "Kötelező: --file --id --parameter --unit --source [--by-var ctx.ga] [--population …]",
  );
  process.exit(1);
}
if (!existsSync(file)) { console.error(`Nincs ilyen fájl: ${file}`); process.exit(1); }

const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
const idx = (name: string) => head.indexOf(name);
const rows: NormogramRow[] = [];
for (const line of lines.slice(1)) {
  const c = line.split(",").map((x) => Number(x.trim()));
  const x = c[idx("x")];
  let mean: number, sd: number;
  if (idx("mean") >= 0 && idx("sd") >= 0) {
    mean = c[idx("mean")]; sd = c[idx("sd")];
  } else if (idx("p50") >= 0 && idx("p10") >= 0 && idx("p90") >= 0) {
    // A 10. és a 90. percentilis 2,563 szórásnyira van egymástól.
    mean = c[idx("p50")];
    sd = (c[idx("p90")] - c[idx("p10")]) / 2.563;
  } else {
    console.error("A fejléc vagy `x,mean,sd`, vagy `x,p50,p10,p90` kell legyen.");
    process.exit(1);
  }
  if (!Number.isFinite(x) || !Number.isFinite(mean) || !(sd > 0)) {
    console.error(`Értelmezhetetlen sor: ${line}`);
    process.exit(1);
  }
  rows.push({ x, mean, sd });
}

const out: Normogram = {
  id, parameter, by, unit, kind: "published",
  source: { cite: source },
  verification: "assumed",              // TELEPÍTÉS ≠ HITELESÍTÉS
  population: arg("population"),
  rows: rows.sort((a, b) => a.x - b.x),
};

const target = join(DIR, `telepitett-${id.replace(/[^a-z0-9.]/gi, "_")}.json`);
writeFileSync(target, JSON.stringify([out], null, 2) + "\n", "utf8");
console.log(`✓ ${target} — ${rows.length} sor, ${rows[0].x}–${rows[rows.length - 1].x}`);
console.log(
  `  A tábla \`assumed\` szinten van: LÁTSZIK, de percentilist NEM ad.\n` +
  `  Hitelesítés: node tools/install-normogram.ts --verify ${id} --by "…" --against "…"`,
);
