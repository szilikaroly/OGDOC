/**
 * OGDOC — első platformminta, futtatható demó.
 *
 *   node --experimental-strip-types demo/run.ts     (Node 22)
 *   node demo/run.ts                                (Node 23+)
 *
 * Ez a Sprint 1 elfogadási kritériuma élőben: „egy változó a regiszterből →
 * űrlap + dokumentáció".  A demó nem tartalmaz beteg-azonosításra alkalmas
 * adatot; minden érték szintetikus.
 */
import { loadRegistry } from "../core/load.ts";
import { DerivationGraph } from "../core/derive/graph.ts";
import { recompute, resolve, setValue, suggestPrefills } from "../core/derive/engine.ts";
import { buildFormSpec, fieldDoc } from "../core/ui/formspec.ts";
import { fullPiers } from "../core/scores/fullpiers.ts";
import type { CaseState, Provenance } from "../core/types.ts";

const NOW = "2026-03-14T09:00:00Z";

function h(title: string): void {
  console.log("\n\x1b[1m" + title + "\x1b[0m");
  console.log("─".repeat(title.length));
}

/** Minden bevitel a motor írási útján megy át — az oldja fel a tükröket. */
function put(
  st: CaseState, id: string, value: unknown,
  provenance: Provenance = "clinician",
): CaseState {
  return setValue(reg, st, id, value, { provenance });
}

/* ── 0. regiszter ────────────────────────────────────────────────────── */
const reg = loadRegistry("registry/variables");
const issues = reg.validate();

h("0 · Regiszter");
console.log(`${reg.all().length} változó betöltve.`);
const errs = issues.filter((i) => i.severity === "error");
const warns = issues.filter((i) => i.severity === "warning");
console.log(`Ellenőrzés: ${errs.length} hiba, ${warns.length} figyelmeztetés.`);
for (const i of issues) console.log(`  [${i.severity}] ${i.id}: ${i.message}`);
if (errs.length) process.exit(1);

/* ── 1. az űrlap a regiszterből ──────────────────────────────────────── */
h("1 · Az űrlap generálva — nincs kézzel írt mező");
const spec = buildFormSpec(reg);
for (const sec of spec) {
  console.log(`\n  ${sec.module}`);
  for (const f of sec.fields) {
    const flags = [
      f.readonly ? "csak olvasható" : null,
      f.phi ? "PHI" : null,
      f.options ? `${f.options.length} opció` : null,
    ].filter(Boolean).join(", ");
    console.log(
      `    ${f.control.padEnd(9)} ${f.id.padEnd(30)} ${f.label}` +
      (flags ? `  (${flags})` : ""),
    );
  }
}

/* ── 2. keresztfeltöltési gráf ───────────────────────────────────────── */
h("2 · Keresztfeltöltés: mi mit tölt fel");
const g = new DerivationGraph(reg);
console.log("Topologikus sorrend:", g.topologicalOrder().join(" → "));
console.log("\nHatásvizsgálat — ha az `anthro.height` változik, ez érintett:");
console.log("  " + (g.impactOf("anthro.height").join(", ") || "(semmi)"));

/* ── 3. egy változó teljes dokumentációja ────────────────────────────── */
h("3 · Egy változó dokumentációja (generált, nem kézzel írt)");
console.log(fieldDoc(reg, "anthro.bmi"));

/* ── 4. egy szintetikus eset végigvitele ─────────────────────────────── */
h("4 · Szintetikus eset — a levezetés lépésről lépésre");

let st: CaseState = {
  ctx: { encounter: "ambulatory", now: NOW },
  values: {},
  errors: [],
};

console.log("\n  a) Csak testmagasság van rögzítve.");
st = put(st, "anthro.height", 168);
st = recompute(reg, st);
console.log("     anthro.bmi →", resolve(reg, st, "anthro.bmi").state,
  "— hiányzó bemenet mellett NEM lesz nulla, a mező egyszerűen nincs.");

console.log("\n  b) A testsúly is megjön.");
st = put(st, "anthro.weight.prepregnancy", 92);
st = recompute(reg, st);
const bmi = resolve(reg, st, "anthro.bmi");
console.log(`     anthro.bmi → ${bmi.value} (${bmi.provenance}, forrás: ${bmi.sourceRef})`);

console.log("\n  c) Vérnyomás → MAP; utolsó menstruáció → gesztációs kor.");
st = put(st, "vitals.bp.systolic", 152);
st = put(st, "vitals.bp.diastolic", 96);
st = put(st, "ctx.lmp", "2025-08-04");
st = recompute(reg, st);
console.log("     vitals.map →", resolve(reg, st, "vitals.map").value, "Hgmm");
console.log("     ctx.ga     →", resolve(reg, st, "ctx.ga").value, "hét");

console.log("\n  d) Méhszáj-lelet → Bishop-összeg, a tükrözött mezőn keresztül.");
st = put(st, "score.bishop.dilation", 3);     // mirror → exam.cervix.dilation
st = put(st, "exam.cervix.effacement", 60);
st = put(st, "exam.cervix.station", 2);      // −1 vagy 0: a spinákban
st = put(st, "exam.cervix.consistency", 2);
st = put(st, "exam.cervix.position", 1);
st = recompute(reg, st);
console.log("     exam.cervix.dilation  →", resolve(reg, st, "exam.cervix.dilation").value,
  "(ugyanaz az adat, két helyen a felületen)");
console.log("     score.bishop.total    →", resolve(reg, st, "score.bishop.total").value, "pont");

/* ── 5. prefill: javaslat, nem tény ──────────────────────────────────── */
h("5 · Előtöltés — javaslat, felülírható, indoklással");
st.previousVisit = {
  "hx.sys.asthma": [{ value: "pos", t: "2026-01-10T10:00:00Z", provenance: "clinician" }],
};
for (const s of suggestPrefills(reg, st)) {
  console.log(`  ${s.id} = ${JSON.stringify(s.value)}`);
  console.log(`    forrás: ${s.sourceRef} · szabály: ${s.policy}`);
  console.log(`    indok:  ${s.note}`);
}

console.log("\n  A javaslat elfogadása után a szabálykapu is meghúzódik:");
st = put(st, "hx.sys.asthma", "pos", "prefilled");
st = recompute(reg, st);
for (const s of suggestPrefills(reg, st)) {
  if (s.id === "rule.carboprost.blocked") console.log(`  ⚠ ${s.note}`);
}

/* ── 6. score: nincs néma helyettesítés ──────────────────────────────── */
h("6 · Score — hiányos bemenetre nem ad számot");
st = put(st, "vitals.spo2", 96, "device");
st = put(st, "lab.plt", 84);
st = put(st, "lab.cr", 96);
st = put(st, "sym.chestPainDyspnea", true);
st = recompute(reg, st);

const r1 = fullPiers(reg, st);
console.log(`  AST nélkül → ${r1.status}`);
if (r1.status === "insufficient") {
  console.log(`    hiányzik: ${r1.missing.join(", ")}`);
  console.log(`    indok:    ${r1.reason.split("\n")[0]}`);
}

st = put(st, "lab.ast", 320);
st = recompute(reg, st);
const r2 = fullPiers(reg, st);
console.log(`\n  Teljes bemenettel → ${r2.status}`);
if (r2.status === "insufficient") {
  console.log(`    hiányzik: ${r2.missing.join(", ")}`);
  console.log("    " + r2.reason.trim().split("\n").map((l) => l.trim()).join("\n    "));
}

h("Kész");
console.log("Egyetlen érték sem került a rendszerbe eredet és időbélyeg nélkül.\n");
