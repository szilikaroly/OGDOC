import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { Registry } from "../core/registry.ts";
import { DerivationGraph } from "../core/derive/graph.ts";
import { recompute, resolve, setValue, suggestPrefills, usable } from "../core/derive/engine.ts";
import { buildFormSpec, fieldDoc } from "../core/ui/formspec.ts";
import { effectiveFinding, findingState, interactionCount, visibleFields } from "../core/ui/disclosure.ts";
import { needsConfirmation, patientSummary, recommendations } from "../core/ui/output.ts";
import { displayUnit, needsDisplayForm } from "../core/ui/units.ts";
import { deletable, loadDocuments, readiness, survivesRevocation } from "../core/docs/registry.ts";
import { fullPiers, COEFFICIENTS_VERIFIED } from "../core/scores/fullpiers.ts";
import { registerCalc, CALCULATORS } from "../core/calc/defs.ts";
import { runCalc, validateCalculators } from "../core/calc/run.ts";
import type { CaseState, Value, VariableDef } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));

const NOW = "2026-09-01T12:00:00Z";
function v(value: unknown, opts: Partial<Value> = {}): Value {
  return { value, t: NOW, provenance: "clinician", confidence: "measured", ...opts };
}
function blank(encounter = "ambulatory"): CaseState {
  return { ctx: { encounter, now: NOW }, values: {}, errors: [] };
}

/* ── 1. A regiszter integritása ──────────────────────────────────────── */

test("a regiszter hiba nélkül validál", () => {
  const errors = REG.validate().filter((i) => i.severity === "error");
  assert.deepEqual(errors, [], "a regiszternek hibamentesnek kell lennie");
});

test("a levezetési gráfban nincs kör, és van topologikus sorrend", () => {
  const g = new DerivationGraph(REG);
  const order = g.topologicalOrder();
  assert.equal(order.length, REG.all().length);
  // a bemenetnek meg kell előznie a számított értéket
  assert.ok(order.indexOf("anthro.height") < order.indexOf("anthro.bmi"));
  assert.ok(order.indexOf("vitals.bp.systolic") < order.indexOf("vitals.map"));
});

test("a kör a buildben elszáll, nem futásidőben", () => {
  // Egy modul saját kalkulátort regisztrálhat; itt két olyat, amik egymásra mutatnak.
  registerCalc({
    id: "calc.test.a", label: { hu: "A" }, kind: "formula", module: "m",
    inputs: [{ id: "a.y", required: true }], output: {}, formula: "a = y",
    source: { cite: "teszt" }, verified: true, verifiedNote: "teszt", fn: (y) => y,
  });
  registerCalc({
    id: "calc.test.b", label: { hu: "B" }, kind: "formula", module: "m",
    inputs: [{ id: "a.x", required: true }], output: {}, formula: "b = x",
    source: { cite: "teszt" }, verified: true, verifiedNote: "teszt", fn: (x) => x,
  });
  const cyc: VariableDef[] = [
    { id: "a.x", version: 1, status: "active", label: { hu: "X" }, module: "m",
      datatype: "quantity", unit: "1", documentation: { definition: { hu: "x" } },
      derivation: { kind: "computed", calc: "calc.test.a" } },
    { id: "a.y", version: 1, status: "active", label: { hu: "Y" }, module: "m",
      datatype: "quantity", unit: "1", documentation: { definition: { hu: "y" } },
      derivation: { kind: "computed", calc: "calc.test.b" } },
  ];
  const g = new DerivationGraph(new Registry(cyc));
  assert.throws(() => g.topologicalOrder(), /Kör a levezetési gráfban/);
});

test("ugyanarra az azonosítóra nem regisztrálható két képlet", () => {
  assert.throws(
    () => registerCalc({
      id: "calc.bmi", label: { hu: "másik BMI" }, kind: "formula", module: "m",
      inputs: [], output: {}, formula: "x", source: { cite: "teszt" },
      verified: true, verifiedNote: "teszt", fn: () => 1,
    }),
    /már regisztrálva/,
    "két modul nem adhat csendben eltérő eredményt ugyanarra a fogalomra",
  );
});

test("a consumers lista generált, nem kézzel írt", () => {
  const g = new DerivationGraph(REG);
  // A testmagasság fogyasztói MODULOKON ÁTNYÚLNAK: a testtömegindexen és a
  // testfelszínen túl a 07. modul energiacélja is belőle számol. A lista nem
  // kézzel karbantartott — a gráf olvassa ki a kalkulátorok bemeneteiből,
  // ezért egy új modul felvétele magától bővíti.
  assert.deepEqual(g.consumersOf("anthro.height").sort(),
    ["anthro.bmi", "anthro.bsa", "diet.energyTarget"]);
  // A TÜKRÖK is fogyasztók: a méhszáj-tágulatot a Bishop-score olvassa, és a
  // szülőszobai partogram is ugyanezt az egy adatot mutatja — ez az IPRACS
  // háromszorosan tárolt Bishopjának a javítása.
  assert.deepEqual(g.consumersOf("exam.cervix.dilation").sort(),
    ["labour.cervix", "score.bishop.dilation", "score.bishop.total"]);
  // a forrásban egyetlen consumers mező sincs kitöltve
  assert.ok(REG.all().every((d) => !d.consumers?.length));
});

test("a hatásvizsgálat a közvetett érintetteket is megadja", () => {
  const g = new DerivationGraph(REG);
  assert.deepEqual(g.impactOf("hx.sys.asthma"), ["rule.carboprost.blocked"]);
  assert.ok(g.impactOf("vitals.bp.systolic").includes("vitals.map"));
});

/* ── 2. Számított értékek — kézzel ellenőrzött értékekkel ────────────── */

test("BMI: 175 cm / 128 kg → 41,8", () => {
  const s = blank();
  s.values["anthro.height"] = [v(175)];
  s.values["anthro.weight.prepregnancy"] = [v(128, { provenance: "patient", confidence: "reported" })];
  const out = recompute(REG, s);
  assert.equal(usable(REG, out, "anthro.bmi"), 41.8);
});

test("MAP: 152/96 → 115", () => {
  const s = blank();
  s.values["vitals.bp.systolic"] = [v(152)];
  s.values["vitals.bp.diastolic"] = [v(96)];
  const out = recompute(REG, s);
  assert.equal(usable(REG, out, "vitals.map"), 115);
});

test("Bishop: 3 cm · 60% · station 1 · puha (2) · elülső (1) → 8", () => {
  const s = blank("labour");
  s.values["exam.cervix.dilation"] = [v(3)];
  s.values["exam.cervix.effacement"] = [v(60)];
  s.values["exam.cervix.station"] = [v(1)];
  s.values["exam.cervix.consistency"] = [v(2)];
  s.values["exam.cervix.position"] = [v(1)];
  const out = recompute(REG, s);
  // 3 cm → 2 pont · 60% → 2 pont · +1 +2 +1 = 8
  assert.equal(usable(REG, out, "score.bishop.total"), 8);
});

/* ── 3. „Nincs néma helyettesítés” ───────────────────────────────────── */

test("hiányzó bemenetnél a számított érték NEM 0, hanem nincs", () => {
  const s = blank();
  s.values["anthro.height"] = [v(175)];        // súly hiányzik
  const out = recompute(REG, s);
  assert.equal(usable(REG, out, "anthro.bmi"), null);
  assert.equal(out.values["anthro.bmi"], undefined, "nem születhet 0 értékű BMI");
});

/* ── 4. Mirror: egy adat, két azonosító ──────────────────────────────── */

test("a mirror ugyanazt az értéket adja, mint a primer — nincs második bemeneti pont", () => {
  const s = blank("labour");
  s.values["exam.cervix.dilation"] = [v(4)];
  assert.equal(REG.resolvePrimary("score.bishop.dilation"), "exam.cervix.dilation");
  assert.equal(usable(REG, s, "score.bishop.dilation"), 4);
  assert.equal(usable(REG, s, "exam.cervix.dilation"), 4);
  // a mirror nem jelenik meg önálló űrlapmezőként
  const fields = buildFormSpec(REG).flatMap((sec) => sec.fields).map((f) => f.id);
  assert.ok(!fields.includes("score.bishop.dilation"));
  assert.ok(fields.includes("exam.cervix.dilation"));
});

/* ── 5. Prefill: javaslat, nem írás ──────────────────────────────────── */

test("prefill: a 90 napon belüli korábbi vizit értékét javasolja", () => {
  const s = blank();
  s.previousVisit = { "hx.sys.asthma": [v("pos", { t: "2026-07-15T09:00:00Z" })] };
  const sug = suggestPrefills(REG, s);
  const a = sug.find((x) => x.id === "hx.sys.asthma");
  assert.ok(a, "kell javaslat");
  assert.equal(a.value, "pos");
  assert.match(a.note, /korábbi vizit/);
  // javaslat ≠ érték: a state érintetlen marad
  assert.equal(usable(REG, s, "hx.sys.asthma"), null);
});

test("prefill: a maxAge-en túli érték már NEM javasolható", () => {
  const s = blank();
  s.previousVisit = { "hx.sys.asthma": [v("pos", { t: "2025-01-01T09:00:00Z" })] };
  const sug = suggestPrefills(REG, s).filter((x) => x.id === "hx.sys.asthma");
  assert.equal(sug.length, 0);
});

test("prefill `implies`: az anamnézisben bejelölt asztma a carboprost-kaput állítja", () => {
  const s = blank("labour");
  s.values["hx.sys.asthma"] = [v("pos")];
  const sug = suggestPrefills(REG, s);
  const gate = sug.find((x) => x.id === "rule.carboprost.blocked");
  assert.ok(gate, "a kapunak aktiválódnia kell");
  assert.equal(gate.value, true);
  assert.match(gate.note, /hx\.sys\.asthma/);
});

test("prefill `implies`: „nem tudom” válasz NEM aktiválja a kaput", () => {
  const s = blank("labour");
  s.values["hx.sys.asthma"] = [v("unk")];
  const sug = suggestPrefills(REG, s).filter((x) => x.id === "rule.carboprost.blocked");
  assert.equal(sug.length, 0, "az ismerethiány nem egyenlő a nemleges válasszal");
});

/* ── 6. Precedencia és frissesség ────────────────────────────────────── */

test("precedencia: a klinikus által rögzített érték veri az importáltat", () => {
  const s = blank();
  s.values["lab.plt"] = [
    v(210, { provenance: "imported", t: "2026-09-01T11:00:00Z" }),
    v(78, { provenance: "clinician", t: "2026-09-01T10:00:00Z" }),
  ];
  const r = resolve(REG, s, "lab.plt");
  assert.equal(r.value, 78);
  assert.equal(r.provenance, "clinician");
});

test("frissesség: vajúdás alatt a 6 óránál régebbi thrombocyta lejárt", () => {
  const s = blank("labour");
  s.values["lab.plt"] = [v(95, { t: "2026-09-01T04:00:00Z" })];   // 8 órája
  const r = resolve(REG, s, "lab.plt");
  assert.equal(r.state, "stale");
  assert.equal(usable(REG, s, "lab.plt"), null, "lejárt érték nem használható számításhoz");
});

test("ugyanaz az érték ambuláns kontextusban még érvényes", () => {
  const s = blank("ambulatory");                                    // ott 30 nap az ablak
  s.values["lab.plt"] = [v(95, { t: "2026-09-01T04:00:00Z" })];
  assert.equal(resolve(REG, s, "lab.plt").state, "ok");
});

/* ── 7. fullPIERS ────────────────────────────────────────────────────── */

function piersState(overrides: Record<string, unknown> = {}): CaseState {
  const s = blank("labour");
  const base: Record<string, unknown> = {
    "ctx.lmp": "2026-01-25", "vitals.spo2": 96, "lab.plt": 95,
    "lab.cr": 88, "lab.ast": 110, "sym.chestPainDyspnea": false,
  };
  for (const [k, val] of Object.entries({ ...base, ...overrides })) {
    if (val === undefined) continue;
    s.values[k] = [v(val)];
  }
  return recompute(REG, s);
}

test("fullPIERS: hiányzó AST → insufficient, és MEGNEVEZI, mi hiányzik", () => {
  const s = piersState({ "lab.ast": undefined });
  const r = fullPiers(REG, s);
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("lab.ast"));
  assert.match((r as any).reason, /lab\.ast/);
});

test("fullPIERS: lejárt SpO₂ ugyanúgy hiányzónak számít", () => {
  const s = piersState();
  s.values["vitals.spo2"] = [v(96, { t: "2026-09-01T09:00:00Z" })];  // 3 órája, ablak 1 óra
  const r = fullPiers(REG, s);
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("vitals.spo2"));
  assert.match((r as any).reason, /lejárt/);
});

test("fullPIERS: teljes bemenettel sem ad számot, amíg az együtthatók nincsenek ellenőrizve", () => {
  assert.equal(COEFFICIENTS_VERIFIED, false);
  const r = fullPiers(REG, piersState());
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("score.fullpiers.coefficients"));
  assert.match((r as any).reason, /von Dadelszen/);
});

test("a dokumentált fullPIERS-együtthatók klinikailag fordítva viselkednek", () => {
  // Ez a teszt a HIBÁT rögzíti, nem a helyes működést: bizonyíték a kapuhoz.
  const mild = fullPiers(REG, piersState({ "lab.ast": 25, "lab.plt": 250 })) as any;
  const severe = fullPiers(REG, piersState({ "lab.ast": 320, "lab.plt": 45 })) as any;
  const pMild = mild.inputs._debug.p, pSevere = severe.inputs._debug.p;
  assert.ok(
    pSevere < pMild,
    "a dokumentált együtthatókkal a súlyosabb eset ALACSONYABB kockázatot kap — " +
    `enyhe ${(pMild * 100).toFixed(4)}% vs súlyos ${(pSevere * 100).toFixed(6)}%. ` +
    "Amíg ez nincs tisztázva, a score nem adhat eredményt.",
  );
});

/* ── 8. Felület és dokumentáció generálása ───────────────────────────── */

test("az űrlap a regiszterből generálódik, típushelyes vezérlőkkel", () => {
  const spec = buildFormSpec(REG);
  const all = spec.flatMap((s) => s.fields);
  const bmi = all.find((f) => f.id === "anthro.bmi")!;
  assert.equal(bmi.control, "readonly", "számított mező nem szerkeszthető");
  assert.deepEqual(bmi.computed?.inputs, ["anthro.height", "anthro.weight.prepregnancy"]);

  const asthma = all.find((f) => f.id === "hx.sys.asthma")!;
  assert.equal(asthma.control, "tristate");
  assert.ok(asthma.options?.some((o) => o.unknown), "a „nem tudom” önálló, jelölt érték");
  assert.equal(asthma.prefillable, true);

  const taj = all.find((f) => f.id === "patient.taj")!;
  assert.equal(taj.phi, true);
});

test("a meződokumentáció generált feltölti/tölti listát tartalmaz", () => {
  const doc = fieldDoc(REG, "vitals.bp.systolic");
  assert.match(doc, /MI EZ/);
  assert.match(doc, /CSAPDÁK/);
  assert.match(doc, /LOINC 8480-6/);
  // A fogyasztók listája MAGÁTÓL BŐVÜL: a szisztolés vérnyomást a MEOWS is
  // olvassa, amióta a 10. modul létezik. A doksi nem kézzel karbantartott.
  assert.match(doc, /⇨ EZT TÖLTI\s+score\.meows · vitals\.map/);
  assert.match(doc, /ÉRVÉNYESSÉG\s+ambulatory P7D/);
});

/* ── 9. Az írási út ──────────────────────────────────────────────────────
   Minden bevitel ezen megy át, ezért itt kell eldőlnie annak, amit egyetlen
   felületnek sem szabad újra megtennie: alias-feloldás, tartomány, kódkészlet
   és a levezetett mezők védelme.                                            */

test("a tükrözött azonosítóra írt érték a primer változóhoz kerül", () => {
  const st = setValue(REG, blank(), "score.bishop.dilation", 3);
  assert.equal(
    st.values["score.bishop.dilation"], undefined,
    "a tükör alatt nem keletkezik önálló tároló — különben két igazság lenne",
  );
  assert.equal(resolve(REG, st, "exam.cervix.dilation").value, 3);
  assert.equal(resolve(REG, st, "score.bishop.dilation").value, 3);
  assert.equal(
    st.values["exam.cervix.dilation"][0].sourceRef, "score.bishop.dilation",
    "a felületi hely, ahol beírták, megmarad az eredetben",
  );
});

test("levezetett mezőre kézzel nem lehet írni", () => {
  assert.throws(
    () => setValue(REG, blank(), "anthro.bmi", 24),
    /levezetett mező.*anthro\.height, anthro\.weight\.prepregnancy/s,
    "a hibaüzenetnek meg kell mondania, mit kell helyette írni",
  );
});

test("a tartományon kívüli érték nem rögzíthető", () => {
  assert.throws(() => setValue(REG, blank(), "exam.cervix.effacement", 140), /maximum/);
  assert.throws(() => setValue(REG, blank(), "anthro.height", -5), /minimum/);
  // a határérték még belefér
  assert.equal(resolve(REG, setValue(REG, blank(), "exam.cervix.effacement", 100),
    "exam.cervix.effacement").value, 100);
});

test("a kódkészleten kívüli kód nem rögzíthető, és a kódok a regiszterből jönnek", () => {
  assert.throws(
    () => setValue(REG, blank(), "hx.sys.asthma", true),
    /kódszótár/,
    "a háromállapotú mező kódjait a regiszter mondja meg, nem a motor",
  );
  assert.throws(() => setValue(REG, blank(), "exam.cervix.consistency", 7), /kódszótár/);
  for (const code of ["pos", "neg", "unk"]) {
    assert.doesNotThrow(() => setValue(REG, blank(), "hx.sys.asthma", code));
  }
});

test("üres érték nem rögzíthető — a hiányzó adat nem érték", () => {
  assert.throws(() => setValue(REG, blank(), "anthro.height", null), /üres/);
  assert.throws(() => setValue(REG, blank(), "anthro.height", undefined), /üres/);
});

test("az írás nem mutálja a korábbi állapotot", () => {
  const a = blank();
  const b = setValue(REG, a, "anthro.height", 168);
  assert.equal(Object.keys(a.values).length, 0, "az eredeti állapot érintetlen marad");
  assert.equal(resolve(REG, b, "anthro.height").value, 168);
});

/* ── 10. Végponttól végpontig ────────────────────────────────────────── */

test("egy szintetikus eset végigfut: bevitel → levezetés → score-kapu", () => {
  let st = blank();
  for (const [id, val] of [
    ["anthro.height", 168], ["anthro.weight.prepregnancy", 92],
    ["vitals.bp.systolic", 152], ["vitals.bp.diastolic", 96],
    ["score.bishop.dilation", 3],          // tükrön keresztül
    ["exam.cervix.effacement", 60], ["exam.cervix.station", 2],
    ["exam.cervix.consistency", 2], ["exam.cervix.position", 1],
  ] as Array<[string, number]>) {
    st = setValue(REG, st, id, val);
  }
  st = recompute(REG, st);

  assert.equal(resolve(REG, st, "anthro.bmi").value, 32.6);
  assert.equal(resolve(REG, st, "vitals.map").value, 115);
  assert.equal(resolve(REG, st, "score.bishop.total").value, 9);
  assert.equal(
    resolve(REG, st, "anthro.bmi").provenance, "derived",
    "a számított érték eredete soha nem `clinician`",
  );

  const score = fullPiers(REG, st);
  assert.equal(score.status, "insufficient", "hiányos bemenetre nincs szám");
});

/* ── 11. A kalkulátor-réteg ──────────────────────────────────────────────
   Itt dől el, hogy egy fogalomhoz EGY képlet tartozik, és hogy egyik
   kalkulátor sem tud kicsúszni a két kapu alól.                            */

test("a kalkulátorok bemenetei és egységei egyeznek a regiszterrel", () => {
  const errors = validateCalculators(REG).filter((i) => i.severity === "error");
  assert.deepEqual(errors, [],
    "az egység-eltérés némán rossz eredményt adna, ezért build-hiba");
});

test("minden mag-kalkulátorra hivatkozik regiszterbeli változó", () => {
  const orphans = validateCalculators(REG)
    .filter((i) => i.severity === "warning" && !i.id.startsWith("calc.test."))
    .map((i) => i.id);
  assert.deepEqual(orphans, [],
    "a be nem kötött kalkulátor holt kód, ami észrevétlenül elavul");
});

test("minden kalkulátornak van elsődleges forrása, a kapuzottnak indoklása", () => {
  for (const c of CALCULATORS) {
    assert.ok(c.source.cite, `${c.id}: hiányzik a forrás`);
    assert.ok(c.formula, `${c.id}: hiányzik az emberi olvasatú képlet`);
    if (!c.verified) assert.ok(c.verifiedNote, `${c.id}: kapuzott, de nincs indokolva`);
  }
});

test("kézzel ellenőrzött értékek", () => {
  const st0 = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] } as CaseState;
  const put = (st: CaseState, id: string, val: unknown) => setValue(REG, st, id, val);

  let st = put(put(st0, "anthro.height", 175), "anthro.weight.prepregnancy", 128);
  const bmi = runCalc(REG, st, "calc.bmi");
  assert.equal(bmi.status === "ok" && bmi.value, 41.8);          // 128 / 1,75² = 41,79…
  assert.equal(bmi.status === "ok" && bmi.band?.severity, "redflag");

  st = put(put(st0, "anthro.height", 170), "anthro.weight.current", 70);
  const bsa = runCalc(REG, st, "calc.bsa.mosteller");
  assert.equal(bsa.status === "ok" && bsa.value, 1.82);          // √(170·70/3600) = 1,8180…

  st = put(put(st0, "vitals.bp.systolic", 152), "vitals.bp.diastolic", 96);
  assert.equal(runCalc(REG, st, "calc.map").status === "ok"
    && (runCalc(REG, st, "calc.map") as { value: number }).value, 115);   // (152+192)/3
  const pp = runCalc(REG, st, "calc.pulsePressure");
  assert.equal(pp.status === "ok" && pp.value, 56);

  st = put(put(st0, "vitals.pulse", 120), "vitals.bp.systolic", 90);
  const si = runCalc(REG, st, "calc.shockIndex");
  assert.equal(si.status === "ok" && si.value, 1.33);
  assert.equal(si.status === "ok" && si.band?.severity, "watch");
});

test("a QT-korrekció két képlete eltér, és a különbség tachycardiában nő", () => {
  const st0 = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] } as CaseState;
  // 60/min-nél RR = 1 s, ezért mindkét korrekció változatlanul hagyja a QT-t
  let st = setValue(REG, setValue(REG, st0, "ekg.qt", 400), "vitals.pulse", 60);
  const b60 = runCalc(REG, st, "calc.qtc.bazett");
  const f60 = runCalc(REG, st, "calc.qtc.fridericia");
  assert.equal(b60.status === "ok" && b60.value, 400);
  assert.equal(f60.status === "ok" && f60.value, 400);

  // 120/min-nél a Bazett érdemben többet ad — ez a terhességi hamis pozitív forrása
  st = setValue(REG, setValue(REG, st0, "ekg.qt", 400), "vitals.pulse", 120);
  const b120 = runCalc(REG, st, "calc.qtc.bazett") as { status: string; value: number };
  const f120 = runCalc(REG, st, "calc.qtc.fridericia") as { status: string; value: number };
  assert.equal(b120.value, 566);                       // 400 / √0,5
  assert.equal(f120.value, 504);                       // 400 / ∛0,5
  assert.ok(b120.value - f120.value > 50,
    "a különbség tachycardiában több mint 50 ms — a Bazett túlkorrigál");
});

test("kapuzott kalkulátor teljes bemenettel sem ad számot", () => {
  let st = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] } as CaseState;
  for (const [id, v] of [["us.bpd", 90], ["us.hc", 330], ["us.ac", 340], ["us.fl", 70]] as Array<[string, number]>) {
    st = setValue(REG, st, id, v);
  }
  const r = runCalc(REG, st, "calc.efw.hadlock");
  assert.equal(r.status, "insufficient");
  assert.deepEqual(r.status === "insufficient" && r.missing, ["calc.efw.hadlock.constants"]);
  assert.match(r.status === "insufficient" ? r.reason : "", /Hadlock/,
    "az indoklásnak meg kell neveznie a forrást, amivel össze kell vetni");
});

test("a levezetett mező is a kapu mögött marad — a rendszer nem kerüli meg", () => {
  let st = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] } as CaseState;
  for (const [id, v] of [["us.bpd", 90], ["us.hc", 330], ["us.ac", 340], ["us.fl", 70]] as Array<[string, number]>) {
    st = setValue(REG, st, id, v);
  }
  st = recompute(REG, st);
  assert.equal(resolve(REG, st, "us.efw").state, "missing",
    "kapuzott kalkulátorból nem születhet levezetett érték a rekordban");
});

test("a levezetés a kalkulátor-rétegen megy át, és a sourceRef a képletet nevezi meg", () => {
  let st = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] } as CaseState;
  st = setValue(REG, st, "anthro.height", 168);
  st = setValue(REG, st, "anthro.weight.prepregnancy", 92);
  st = recompute(REG, st);
  const r = resolve(REG, st, "anthro.bmi");
  assert.equal(r.value, 32.6);
  assert.equal(r.sourceRef, "calc.bmi", "a rekordból vissza kell keresni, melyik képlet adta");
});

test("az életkor levezetett, nem tárolt", () => {
  let st = { ctx: { encounter: "ambulatory", now: "2026-09-01T12:00:00Z" }, values: {}, errors: [] } as CaseState;
  st = recompute(REG, setValue(REG, st, "patient.birthDate", "1990-03-15"));
  assert.equal(resolve(REG, st, "patient.age").value, 36);
  assert.throws(() => setValue(REG, st, "patient.age", 40), /levezetett mező/,
    "tárolt korral a rekord egy év múlva hazudik");
});

/* ── 12. Osztályozási verziók (K14) ──────────────────────────────────────
   Az osztályozási készletek frissülnek: a FIGO cervix-rendszere 2018-ban,
   az endometriumé 2023-ban változott, a BNO és az OENO évente. Egy rögzített
   érték a RÖGZÍTÉSKORI verzió szerint értelmezendő — különben egy retrospektív
   adat csendben mást jelent.                                                */

test("a rögzítéskori osztályozási verzió az értékre bélyegződik", () => {
  const st = setValue(REG, blank(), "onc.gyn.figo.cervix", "IB2");
  const v = st.values["onc.gyn.figo.cervix"][0];
  assert.equal(v.codeSystemVersion, "2018");
});

test("a verziót a hívó nem adhatja meg — az importja nem írhatja felül", () => {
  const st = setValue(REG, blank(), "onc.gyn.figo.cervix", "IB2",
    { codeSystemVersion: "2009" } as never);
  assert.equal(st.values["onc.gyn.figo.cervix"][0].codeSystemVersion, "2018",
    "a bélyeg a regiszterből jön, nem a bemenetből");
});

test("verzió nélküli mezőre nem kerül bélyeg", () => {
  const st = setValue(REG, blank(), "exam.cervix.consistency", 2);
  assert.equal(st.values["exam.cervix.consistency"][0].codeSystemVersion, null,
    "a helyi, nem külső kódlistának nincs verziója");
});

test("a korábbi verzió szerint rögzült érték jelölést kap, de érvényes marad", () => {
  // egy 2015-ben rögzült stádium, amikor még a FIGO 2009-es rendszere élt
  const st: CaseState = {
    ...blank(),
    values: {
      "onc.gyn.figo.cervix": [{
        value: "IB1", t: "2015-06-01T10:00:00Z", provenance: "clinician",
        codeSystemVersion: "2009",
      }],
    },
  };
  const r = resolve(REG, st, "onc.gyn.figo.cervix");
  assert.equal(r.state, "ok", "a történeti érték a saját verziója szerint helyes");
  assert.equal(r.value, "IB1");
  assert.equal(r.codeSystemVersion, "2009");
  assert.equal(r.codeSystemCurrent, "2018");
  assert.equal(r.codeSystemOutdated, true,
    "aki összehasonlít vagy exportál, annak tudnia kell az eltérésről");
});

test("az aktuális verzió szerint rögzült érték nincs elavultnak jelölve", () => {
  const st = setValue(REG, blank(), "onc.gyn.figo.cervix", "IB1");
  assert.equal(resolve(REG, st, "onc.gyn.figo.cervix").codeSystemOutdated, false);
});

test("a kódrendszer verzió nélkül build-hiba", () => {
  const bad: VariableDef[] = [{
    id: "x.y", version: 1, status: "active", label: { hu: "X" }, module: "m",
    datatype: "coded", valueSet: [{ code: "a", label_hu: "A" }],
    codeSystem: { id: "teszt", version: "" },
    documentation: { definition: { hu: "x" } },
  }];
  const issues = new Registry(bad).validate();
  assert.ok(issues.some((i) => i.severity === "error" && /verziót/.test(i.message)));
});

/* ── 13. Click-open: öt állapot és a részletező LÁNC ─────────────────────
   eltérés nélkül · korlátozott · nem vizsgálható · eltérés · kimaradt.
   A részletezés lánc: lokalizáció → jelleg → (a jellegtől függően) mérték
   és típus.                                                                */

test("a részletező mezők alapból rejtve vannak", () => {
  const v = visibleFields(REG, blank());
  assert.equal(v.has("status.cardio.auscultation"), true, "a lelet maga látszik");
  for (const d of ["status.cardio.site", "status.cardio.character",
                   "status.cardio.murmur.grade", "status.cardio.murmur.timing"]) {
    assert.equal(v.has(d), false, d + " csukva");
  }
});

test("a nem rögzített lelet állapota KIMARADT, nem normális", () => {
  assert.equal(findingState(REG, blank(), "status.cardio.auscultation"), "omitted");
  const eff = effectiveFinding(REG, blank(), "status.cardio.auscultation");
  assert.equal(eff.state, "omitted");
  assert.equal(eff.explicit, false,
    "a kimaradt mezőről a rendszer semmit nem állít");
});

test("normális és nem vizsgálható lelet nem nyit láncot", () => {
  for (const [code, expected] of [["norm", "normal"], ["imp", "impossible"]] as Array<[string, string]>) {
    const st = setValue(REG, blank(), "status.cardio.auscultation", code);
    assert.equal(findingState(REG, st, "status.cardio.auscultation"), expected);
    assert.equal(visibleFields(REG, st).has("status.cardio.site"), false);
  }
});

test("a KORLÁTOZOTT vizsgálat megnyitja a láncot — láttunk valamit", () => {
  const st = setValue(REG, blank(), "status.cardio.auscultation", "lim");
  assert.equal(findingState(REG, st, "status.cardio.auscultation"), "limited");
  assert.equal(visibleFields(REG, st).has("status.cardio.site"), true,
    "korlátozott ≠ lehetetlen: amit láttunk, azt rögzíteni lehet");
});

test("a lánc LÉPÉSENKÉNT nyílik, nem egyszerre", () => {
  let st = setValue(REG, blank(), "status.cardio.auscultation", "abn");
  let v = visibleFields(REG, st);
  assert.equal(v.has("status.cardio.site"), true, "az első lépés megjelenik");
  assert.equal(v.has("status.cardio.character"), false, "a második még nem");

  st = setValue(REG, st, "status.cardio.site", "ao");
  v = visibleFields(REG, st);
  assert.equal(v.has("status.cardio.character"), true, "a lokalizáció után jön a jelleg");
});

test("a megadott klinikai példa végigfut: ao felett → zörej → 4/6 → szisztolés", () => {
  let st = setValue(REG, blank(), "status.cardio.auscultation", "abn");
  st = setValue(REG, st, "status.cardio.site", "ao");
  st = setValue(REG, st, "status.cardio.character", "murmur");
  const v = visibleFields(REG, st);
  assert.equal(v.has("status.cardio.murmur.grade"), true, "a zörej mértéket kér");
  assert.equal(v.has("status.cardio.murmur.timing"), true, "és típust");

  st = setValue(REG, st, "status.cardio.murmur.grade", 4);
  st = setValue(REG, st, "status.cardio.murmur.timing", "sys");
  assert.equal(resolve(REG, st, "status.cardio.murmur.grade").value, 4);
  assert.equal(resolve(REG, st, "status.cardio.murmur.timing").value, "sys");
});

test("más jelleg más mezőket kér — az „extra hang” nem kér zörej-mértéket", () => {
  let st = setValue(REG, blank(), "status.cardio.auscultation", "abn");
  st = setValue(REG, st, "status.cardio.site", "diff");
  st = setValue(REG, st, "status.cardio.character", "extra");
  const v = visibleFields(REG, st);
  assert.equal(v.has("status.cardio.murmur.grade"), false,
    "a kódlista dönti el, mit kérdez tovább — nem a felület");
});

test("a rejtett mezők aránya méri, mennyit spórol a minta", () => {
  const zero = interactionCount(REG, blank());
  assert.ok(zero.hiddenByDefault >= 8, "üres űrlapon a részletezők rejtve vannak");
  const st = setValue(REG, blank(), "status.cardio.auscultation", "abn");
  const one = interactionCount(REG, st);
  assert.equal(one.touched, 1, "egy kattintás egy megérintett mező");
  assert.ok(one.hiddenByDefault < zero.hiddenByDefault, "a kóros lelet kinyitott egyet");
});

/* ── 14. Generált kimenetek: a betegnek és a klinikusnak ────────────────── */

test("a beteg a NORMÁLIS leletről is kap szöveget", () => {
  const st = setValue(REG, blank(), "status.cardio.auscultation", "norm");
  const lines = patientSummary(REG, st);
  assert.equal(lines.length, 1);
  assert.match(lines[0].text, /eltérést nem mutatott/);
  assert.equal(lines[0].tone, "normal");
});

test("a KIMARADT mezőről nem állítunk semmit a betegnek", () => {
  assert.deepEqual(patientSummary(REG, blank()), [],
    "üres űrlapból nem születhet betegtájékoztató");
});

test("a korlátozott és a lehetetlen KÜLÖN beteg-szöveget kap", () => {
  const lim = patientSummary(REG, setValue(REG, blank(), "status.cardio.auscultation", "lim"));
  const imp = patientSummary(REG, setValue(REG, blank(), "status.cardio.auscultation", "imp"));
  assert.match(lim[0].text, /korlátozottan/);
  assert.match(imp[0].text, /nem volt elvégezhető/);
  assert.notEqual(lim[0].text, imp[0].text);
});

test("a kóros lelet javaslatokat ad, kiváltó mezővel", () => {
  const st = setValue(REG, blank(), "status.internal.edema", "abn");
  const recs = recommendations(REG, st);
  assert.deepEqual(recs.map((r) => r.kind).sort(), ["diet", "followup", "lab"]);
  assert.equal(recs[0].urgency, "soon", "a sürgősebb elöl");
  assert.equal(recs[0].from, "status.internal.edema");
});

test("a korlátozott és a lehetetlen MÁS javaslatot ad", () => {
  const lim = recommendations(REG, setValue(REG, blank(), "status.cardio.auscultation", "lim"));
  const imp = recommendations(REG, setValue(REG, blank(), "status.cardio.auscultation", "imp"));
  assert.match(lim[0].text, /kiegészítése/);
  assert.match(imp[0].text, /megismétlése/);
});

test("normális leletre nem születik kóros javaslat", () => {
  assert.deepEqual(recommendations(REG, setValue(REG, blank(), "status.internal.edema", "norm")), []);
});

test("kimaradt mezőből nem következtetünk", () => {
  assert.deepEqual(recommendations(REG, blank()), []);
});

/* ── 15. Beteg-oldali betegfelvétel ─────────────────────────────────────
   Az anamnézist a beteg tölti ki a felvételkor. Az így rögzült érték a
   precedencia legalján van, és megerősítés nélkül döntés nem épülhet rá.  */

test("a beteg által megadott érték a precedencia legalján van", () => {
  let st = setValue(REG, blank(), "hx.sys.asthma", "pos", { provenance: "patient" });
  assert.equal(resolve(REG, st, "hx.sys.asthma").provenance, "patient");
  // a klinikus mást mond → az övé nyer, akkor is, ha korábbi
  st = setValue(REG, st, "hx.sys.asthma", "neg",
    { provenance: "clinician", t: "2026-08-01T08:00:00Z" });
  const r = resolve(REG, st, "hx.sys.asthma");
  assert.equal(r.value, "neg");
  assert.equal(r.provenance, "clinician", "a klinikusi korrekció felülírja a beteg bejelölését");
});

test("a meg nem erősített beteg-bejegyzés megjelenik a megerősítési sorban", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "pos", { provenance: "patient" });
  const q = needsConfirmation(REG, st);
  assert.equal(q.length, 1);
  assert.equal(q[0].id, "hx.sys.asthma");
  assert.deepEqual(q[0].wouldAffect, ["rule.carboprost.blocked"],
    "a sor megmutatja, mire hatna a megerősítés — ez indokolja a sürgősséget");
});

test("a klinikusi megerősítés kiveszi a sorból", () => {
  let st = setValue(REG, blank(), "hx.sys.asthma", "pos", { provenance: "patient" });
  st = setValue(REG, st, "hx.sys.asthma", "pos", { provenance: "clinician" });
  assert.deepEqual(needsConfirmation(REG, st), []);
});

test("a beteg-oldali mező jelölést kap az űrlapleírásban", () => {
  const spec = buildFormSpec(REG);
  const f = spec.flatMap((s) => s.fields).find((x) => x.id === "hx.sys.asthma")!;
  assert.equal(f.patientEntry, true);
});

test("az űrlapleírás hordozza a click-open szerkezetet", () => {
  const spec = buildFormSpec(REG);
  const all = spec.flatMap((s) => s.fields);
  const lelet = all.find((f) => f.id === "status.cardio.auscultation")!;
  assert.equal(lelet.finding?.normal, "norm");
  assert.equal(lelet.finding?.limited, "lim");
  assert.equal(lelet.finding?.impossible, "imp");
  assert.deepEqual(lelet.finding?.cascade,
    ["status.cardio.site", "status.cardio.character"]);
  const reszlet = all.find((f) => f.id === "status.cardio.murmur.grade")!;
  assert.ok(reszlet.openedBy?.includes("status.cardio.character"),
    "a részletező tudja, melyik válasz nyitja — a felület nem találgat");
});

test("a részletező mező a leletje UTÁN jelenik meg az űrlapon", () => {
  const status = buildFormSpec(REG).find((s) => s.module === "status")!;
  const ids = status.fields.map((f) => f.id);
  assert.ok(ids.indexOf("status.cardio.auscultation") < ids.indexOf("status.cardio.site"),
    "a lelet előbb, a lánca utána — a felületen fordítva érthetetlen");
  assert.equal(ids[ids.indexOf("status.cardio.auscultation") + 1], "status.cardio.site");
});

test("a levezetett érték nem számít megérintett mezőnek", () => {
  const st = recompute(REG, setValue(REG, blank(), "anthro.height", 168));
  assert.equal(interactionCount(REG, st).touched, 1,
    "a motor által írt ctx.now és a számított mezők nem emberi erőfeszítés");
});

/* ── 16. Dokumentumtípusok (K20) ─────────────────────────────────────────
   Nyolc ellátási dokumentumtípus. A kötelező tartalom REGISZTERBELI mezőkre
   hivatkozik, ezért a hiány nem a betegágynál derül ki, hanem a buildben.  */

const DOCS = loadDocuments(join(HERE, "..", "registry", "documents", "core.json"));

test("a dokumentum-regiszter hiba nélkül validál a változóregiszterrel szemben", () => {
  const errors = DOCS.validate(REG).filter((i) => i.severity === "error");
  assert.deepEqual(errors, [],
    "egy dokumentum nem hivatkozhat nem létező mezőre");
});

test("mind a tizennégy dokumentumtípus ellátási dokumentáció (K20, K26)", () => {
  assert.equal(DOCS.all().length, 14);
  assert.equal(DOCS.careRecords().length, 14);
  const ids = DOCS.all().map((d) => d.id).sort();
  assert.deepEqual(ids, [
    "doc.ambulans-lap", "doc.aneszt-terv", "doc.beutalo", "doc.epikrizis",
    "doc.gyogyszerfelires", "doc.javaslat", "doc.kepalkoto-felvetel",
    "doc.muteti-terv", "doc.muteti-zaro", "doc.partogram",
    "doc.terhesgondozasi-lap", "doc.terhessegi-kockazat",
    "doc.vizsgalati-lap", "doc.zarojelentes",
  ]);
});

test("az epikrízis és a partogram ellátási dokumentáció, nem belső munkaanyag (K26)", () => {
  for (const id of ["doc.epikrizis", "doc.partogram"]) {
    const d = DOCS.get(id)!;
    assert.equal(d.careRecord, true, `${id}: a K26 döntéssel ellátási dokumentáció`);
    assert.ok(d.eeszt, `${id}: beküldendő`);
    assert.ok(d.retention.period, `${id}: megőrzendő`);
  }
});

test("a partogram idősor: a beküldés a LEZÁRÁSKOR történik, nem bejegyzésenként", () => {
  assert.equal(DOCS.get("doc.partogram")!.eeszt!.when, "onClose");
});

test("a hiányzó kapcsolódó dokumentum JELZÉS, nem blokkoló", () => {
  // sürgős császármetszés: nincs előzetes műtéti és aneszteziológiai terv
  let st = setValue(REG, blank(), "patient.taj", "000000000");
  st = setValue(REG, st, "ctx.now", NOW);
  const r = readiness(DOCS, REG, st, "doc.muteti-zaro", new Set());
  assert.equal(r.closable, true,
    "a dokumentálás megtagadása sürgős ellátásban ártalmas — a leírás rögzíthető");
  assert.deepEqual(r.missingRelated.sort(), ["doc.aneszt-terv", "doc.muteti-terv"],
    "de a hiány LÁTSZIK");
});

test("meglévő kapcsolódó dokumentummal nincs jelzés", () => {
  let st = setValue(REG, blank(), "patient.taj", "000000000");
  st = setValue(REG, st, "ctx.now", NOW);
  const r = readiness(DOCS, REG, st, "doc.muteti-zaro",
    new Set(["doc.muteti-terv", "doc.aneszt-terv"]));
  assert.deepEqual(r.missingRelated, []);
});

test("a kapcsolódó dokumentum-hivatkozás létező típusra mutat", () => {
  for (const d of DOCS.all()) {
    for (const e of d.expects ?? []) {
      assert.ok(DOCS.get(e), `${d.id} → ${e}: ismeretlen dokumentumtípus`);
    }
  }
});

test("minden ellátási dokumentumnak van megőrzési ideje, forrással", () => {
  for (const d of DOCS.careRecords()) {
    assert.ok(d.retention.period, `${d.id}: hiányzik a megőrzési idő`);
    assert.match(d.retention.source, /Eüak/, `${d.id}: hiányzik a jogszabályi hivatkozás`);
    assert.ok(d.retention.patientRequest, `${d.id}: nincs rögzítve a beteg kérésének kezelése`);
  }
  // a képalkotó FELVÉTEL az egyetlen, ami nem megy az EESZT-be — a lelete igen
  const noEeszt = DOCS.careRecords().filter((d) => !d.eeszt).map((d) => d.id);
  assert.deepEqual(noEeszt, ["doc.kepalkoto-felvetel"]);
});

test("a megőrzési idők a kikutatott jogszabályi értékek (K27)", () => {
  assert.equal(DOCS.get("doc.zarojelentes")!.retention.period, "P50Y",
    "zárójelentés: legalább 50 év");
  assert.equal(DOCS.get("doc.kepalkoto-felvetel")!.retention.period, "P10Y",
    "képalkotó FELVÉTEL: 10 év");
  assert.equal(DOCS.get("doc.vizsgalati-lap")!.retention.period, "P30Y",
    "a felvételről készült LELET: 30 év — ez a leggyakrabban összemosott pár");
  for (const d of DOCS.all()) {
    if (["doc.zarojelentes", "doc.kepalkoto-felvetel"].includes(d.id)) continue;
    assert.equal(d.retention.period, "P30Y", `${d.id}: egészségügyi dokumentáció, 30 év`);
  }
});

test("a kötelező idő után gyógykezelés és kutatás céljából tartható meg", () => {
  for (const d of DOCS.all()) {
    assert.deepEqual(d.retention.extendableFor, ["gyógykezelés", "tudományos kutatás"]);
  }
});

test("a hiányzó kötelező mező blokkolja a lezárást, és megnevezi magát", () => {
  const r = readiness(DOCS, REG, blank(), "doc.zarojelentes");
  assert.equal(r.closable, false);
  assert.deepEqual(r.missing, ["patient.taj", "patient.birthDate", "ctx.now"]);
});

test("a kitöltött kötelező mezőkkel lezárható — a hiányok külön látszanak", () => {
  let st = setValue(REG, blank(), "patient.taj", "000000000");
  st = setValue(REG, st, "patient.birthDate", "1990-03-15");
  st = setValue(REG, st, "ctx.now", NOW);
  const r = readiness(DOCS, REG, st, "doc.zarojelentes");
  assert.equal(r.closable, true);
  assert.ok(r.gaps.length > 0,
    "a nem kötelező üres mezők HIÁNYKÉNT jelennek meg, nem üres sablonhelyként");
});

test("másodlagos ellenőrzöttség mellett a rendszer NEM töröl", () => {
  for (const d of DOCS.all()) {
    assert.equal(d.retention.verification, "secondary",
      `${d.id}: egybehangzó másodlagos forrásokból megvan, elsődleges összevetés hátravan`);
    const r = deletable(DOCS, d.id);
    assert.equal(r.ok, false, `${d.id}: a törlés visszafordíthatatlan`);
    assert.match((r as { reason: string }).reason, /elsődleges/);
  }
});

test("függőben lévő betegkérés akkor is blokkol, ha az idő elsődlegesen ellenőrzött", () => {
  // szimuláljuk az elsődleges ellenőrzést egyetlen típuson
  const d = DOCS.get("doc.ambulans-lap")!;
  const orig = d.retention.verification;
  d.retention.verification = "primary";
  try {
    assert.equal(deletable(DOCS, d.id).ok, true, "elsődleges ellenőrzés után törölhető");
    const blocked = deletable(DOCS, d.id, { patientRequestPending: true });
    assert.equal(blocked.ok, false);
    assert.match((blocked as { reason: string }).reason, /betegkérés/,
      "a megsemmisítés előtt a beteg kikérheti a dokumentációt");
  } finally {
    d.retention.verification = orig;
  }
});

test("a kutatási visszavonás nem törli az ellátási dokumentációt (K11)", () => {
  const survive = survivesRevocation(DOCS).map((d) => d.id);
  assert.equal(survive.length, 14,
    "mind a tizennégy ellátási dokumentum megmarad a jogszabályi megőrzési idő végéig");
  assert.ok(survive.includes("doc.zarojelentes"));
});

test("a gyógyszerfelírás a hard-stop kapukat opcionális bemenetként ismeri", () => {
  const rx = DOCS.get("doc.gyogyszerfelires")!;
  assert.ok(rx.optional?.includes("rule.carboprost.blocked"));
  assert.equal(rx.eeszt?.kind, "erecept");
});

test("a zárójelentés ellenjegyzést kíván, az ambuláns lap nem", () => {
  assert.equal(DOCS.get("doc.zarojelentes")!.signature.countersign, true);
  assert.equal(DOCS.get("doc.ambulans-lap")!.signature.countersign, undefined);
});

test("azonos eredet és azonos időpont esetén a később RÖGZÍTETT érték nyer", () => {
  // ugyanarra a vizsgálati időpontra a klinikus javít: norm → abn
  let st = setValue(REG, blank(), "status.cardio.auscultation", "norm");
  st = setValue(REG, st, "status.cardio.auscultation", "abn");
  assert.equal(findingState(REG, st, "status.cardio.auscultation"), "abnormal",
    "a javítás enélkül nem érvényesülne — mindkét érték `t`-je a vizsgálat ideje");
  assert.equal(visibleFields(REG, st).has("status.cardio.site"), true);
});

test("a lánc nem ágazik el kétszer ugyanarra", () => {
  let st = setValue(REG, blank(), "status.cardio.auscultation", "abn");
  st = setValue(REG, st, "status.cardio.site", "ao");
  const v = visibleFields(REG, st);
  assert.equal(v.has("status.cardio.character"), true, "a lokalizáció után a jelleg jön");
  assert.equal(v.has("status.cardio.murmur.grade"), false,
    "a mértéket a JELLEG kéri, nem a lokalizáció");
});

/* ── 17. A katalógus feltöltésének szabályai ─────────────────────────────
   A tesztek a KATALÓGUS SZABÁLYAIRA irányulnak, nem az egyes mezőkre: egy új
   változó felvétele ne igényeljen új tesztet, egy szabály megsértése igen.  */

test("minden anamnesztikus kérdés háromállású — soha nem bool", () => {
  const bad = REG.all()
    .filter((d) => d.module.startsWith("hx") && d.datatype === "bool")
    .map((d) => d.id);
  assert.deepEqual(bad, [],
    "a „nem tudom” önálló információ: megkérdeztük és nem derült ki");
});

test("minden gépi jelölésű mértékegységnek van EMBERI megjelenítési alakja", () => {
  // A regiszter UCUM-ot tárol (`mm[Hg]`, `10*9/L`, `a`), és ez helyes. A
  // NYOMTATOTT zárójelentésen viszont ember olvassa. Ha egy új, kapcsos vagy
  // szögletes jelölésű egység megjelenési alak nélkül kerül be, ez a teszt
  // állítja meg — nem a beteg kezében lévő papír.
  const bad = REG.all()
    .filter((d) => d.unit && needsDisplayForm(d.unit))
    .filter((d) => displayUnit(d.unit!) === d.unit)
    .map((d) => `${d.id} (${d.unit})`);
  assert.deepEqual(bad, [], "hiányzó megjelenítési alak");
});

test("minden háromállású mezőn ott a „nem tudom” jelölt értékként", () => {
  for (const d of REG.all().filter((x) => x.datatype === "tristate")) {
    const unk = d.valueSet?.find((o) => o.flags?.includes("unknown"));
    assert.ok(unk, `${d.id}: hiányzik a jelölt „nem tudom” érték`);
    assert.equal(unk!.code, "unk", `${d.id}: a kód legyen egységesen "unk"`);
  }
});

test("az anamnézist a beteg tölti ki, klinikusi felülírással", () => {
  const hx = REG.all().filter((d) => d.module.startsWith("hx.") && !d.derivation);
  assert.ok(hx.length > 50, "az anamnézis érdemi méretű");
  for (const d of hx) {
    assert.equal(d.patientEntry, true, `${d.id}: a betegfelvétel része`);
    assert.ok(d.provenanceAllowed?.includes("clinician"),
      `${d.id}: a klinikusi korrekciónak mindig lehetségesnek kell lennie`);
  }
});

test("a családfa rokononkénti rekord, nem lapos jelölőnégyzet-lista", () => {
  for (const d of REG.all().filter((x) => x.module === "hx.family")) {
    assert.equal(d.cardinality, "event",
      `${d.id}: rokononként külön rekord — enélkül a családfa anekdota marad`);
  }
  const rel = REG.get("hx.family.diagnosisReliability")!;
  assert.deepEqual(rel.valueSet?.map((o) => o.code), ["documented", "reported", "suspected"],
    "a megbízhatóság teszi a családfát genetikai bemenetté");
});

test("a gesztációs kor forrása rögzített, precedencia-sorrendben", () => {
  const src = REG.get("ctx.gaSource")!;
  assert.deepEqual(src.valueSet?.map((o) => o.code),
    ["ivf.transfer", "crl", "lmp", "late.biometry", "unknown"],
    "IVF-transzfer → korai CRL → utolsó menstruáció → késői biometria");
  assert.match(src.documentation.whyItMatters?.hu ?? "", /két hét/i,
    "a doksinak ki kell mondania, mekkora a tét");
});

test("minden változónak van definíciója és stabil azonosítója", () => {
  for (const d of REG.all()) {
    assert.ok(d.documentation?.definition?.hu || d.documentation?.definition?.en,
      `${d.id}: hiányzik a definíció`);
    assert.match(d.id, /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/,
      `${d.id}: az azonosító pontokkal tagolt, kisbetűs kezdetű`);
  }
});

test("a szabad szöveges mezők aránya a cél alatt marad", () => {
  const free = REG.all().filter((d) => d.datatype === "text");
  const ratio = free.length / REG.all().length;
  assert.ok(ratio <= 0.10,
    `${(ratio * 100).toFixed(1)}% szabad szöveg — a cél legfeljebb 10%. `
    + `Érintett: ${free.map((d) => d.id).join(", ")}`);
});

test("a modulonkénti bontás nem enged duplikált azonosítót", () => {
  // a loadRegistry több fájlt fűz össze; a Registry konstruktora dob duplikátumra
  const ids = REG.all().map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length,
    "két modul nem definiálhatja ugyanazt a mezőt — ha mindkettőnek kell, aliasOf");
});

/* ══ A TÜKÖR KÓDLISTÁJA ═══════════════════════════════════════════════
 *
 * A tükör (`aliasOf`) az EGY FOGALOM — EGY ADAT szabály eszköze. Két hibája
 * lehet, és mindkettő csendes:
 *
 *   · ha a tükörnek KÖTELEZŐ lenne saját kódlistát írni, akkor a másolat
 *     idővel elszakad az eredetitől;
 *   · ha viszont írhat ELTÉRŐT, akkor a két felületen két igazság áll —
 *     az egyiken felvehető a „bűzös”, a másikon nem, és a hozzá kötött
 *     javaslat az egyik oldalon némán elmarad.
 *
 * A regiszter ezért: örökölhet, de ha ismétel, EGYEZNIE kell.
 */
test("a kódolt tükör elhagyhatja a kódlistát — a primeré érvényes rá", () => {
  const reg = new Registry([
    { id: "a.x", version: 1, status: "active", label: { hu: "A" }, module: "a", documentation: { definition: { hu: "A." } },
      datatype: "coded", valueSet: [{ code: "p" }, { code: "n" }] },
    { id: "b.x", version: 1, status: "active", label: { hu: "B" }, module: "b", documentation: { definition: { hu: "B." } },
      datatype: "coded", aliasOf: "a.x" },
  ] as never);
  assert.deepEqual(reg.validate().filter((i) => i.severity === "error"), []);
});

test("az ELTÉRŐ kódlistájú tükör build-hiba — két igazság egy leletről", () => {
  const reg = new Registry([
    { id: "a.x", version: 1, status: "active", label: { hu: "A" }, module: "a", documentation: { definition: { hu: "A." } },
      datatype: "coded", valueSet: [{ code: "p" }, { code: "n" }, { code: "foul" }] },
    { id: "b.x", version: 1, status: "active", label: { hu: "B" }, module: "b", documentation: { definition: { hu: "B." } },
      datatype: "coded", aliasOf: "a.x", valueSet: [{ code: "p" }, { code: "n" }] },
  ] as never);
  const err = reg.validate().filter((i) => i.severity === "error");
  assert.equal(err.length, 1);
  assert.equal(err[0].id, "b.x");
  assert.match(err[0].message, /hiányzik innen: foul/);
});

test("a PRIMER változó kódlistája továbbra is kötelező", () => {
  const reg = new Registry([
    { id: "a.x", version: 1, status: "active", label: { hu: "A" }, module: "a", documentation: { definition: { hu: "A." } },
      datatype: "coded" },
  ] as never);
  assert.ok(reg.validate().some((i) =>
    i.severity === "error" && /kötelező a valueSet/.test(i.message)));
});
