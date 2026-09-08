/**
 * A 15. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/15-utankovetes.md`:
 *
 *   „A 42. napos mérési pont kitöltése után az eset ICHOM PCB v5.0-kompatibilis
 *    exportot ad, AZONOSÍTÓ NÉLKÜL, és az export mellé kiíródik, MELY KÖTELEZŐ
 *    VÁLTOZÓK MARADTAK ÜRESEN."
 *
 * És a modul saját szabálya: az elmulasztott mérési pont NEM TŰNIK EL.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadPoints } from "../core/followup/points.ts";
import {
  cohortCompleteness, ichomExport, loadIchomSpec, mapping, validateIchomMapping,
} from "../core/followup/ichom.ts";
import { assessEsc, assessFinnegan, observationWindow } from "../core/neo/esc.ts";
import { runCalc } from "../core/calc/run.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const POINTS = loadPoints(join(HERE, "..", "registry", "utankovetes"));
const SPEC = loadIchomSpec(join(HERE, "..", "registry", "ichom-pcb-v5.seed.json"));
const PP42 = "42 days postpartum";

const NOW = "2026-09-02T16:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
function put(st: CaseState, pairs: Array<[string, unknown]>): CaseState {
  let s = st;
  for (const [id, v] of pairs) s = setValue(REG, s, id, v);
  return recompute(REG, s);
}
/** 50 nappal a NOW előtt született — a 42. napos ablakban vagyunk. */
const BIRTH_50D = "2026-07-14T08:00:00Z";

/* ── 1. AZ EXPORT — AZONOSÍTÓ NÉLKÜL ────────────────────────────────── */

test("az export SOHA nem tartalmaz beteg-azonosítót", () => {
  const st = put(blank(), [["patient.taj", "000000000"], ["patient.birthDate", "1993-04-11"]]);
  const e = ichomExport(REG, SPEC, st, PP42);
  assert.equal(e.containsIdentifiers, false);
  const phi = e.rows.filter((r) => r.status === "excludedPhi");
  assert.ok(phi.length > 0);
  for (const r of phi) assert.equal(r.value, undefined);
  assert.ok(!JSON.stringify(e.rows).includes("000000000"));
});

test("a DURVÁBB értéket számoljuk ki: a születési ÉV exportálható, a dátum nem", () => {
  const st = put(blank(), [["patient.birthDate", "1993-04-11"]]);
  assert.equal(resolve(REG, st, "demog.birthYear").value, 1993);
  assert.equal(REG.get("demog.birthYear")!.phi, undefined);
  assert.equal(REG.get("patient.birthDate")!.phi, true);
  const e = ichomExport(REG, SPEC, st, PP42);
  const row = e.rows.find((r) => r.code === "PCB001");
  assert.equal(row?.status, "present");
  assert.equal(row?.value, 1993);
});

/* ── 2. A HAT KATEGÓRIA, AMIT NEM SZABAD ÖSSZEMOSNI ─────────────────── */

test("a hiányzó ADAT és a hiányzó MEZŐ két külön kategória", () => {
  const e = ichomExport(REG, SPEC, blank(), PP42);
  assert.ok(e.counts.missing > 0, "van olyan mezőnk, ami üres");
  assert.ok(e.counts.unmapped > 0, "van olyan ICHOM-tétel, amihez nincs mezőnk");
  const miss = e.rows.find((r) => r.status === "missing")!;
  const unmap = e.rows.find((r) => r.status === "unmapped")!;
  assert.ok(miss.variable, "a hiányzó adatnál VAN mezőnk");
  assert.equal(unmap.variable, undefined, "a leképezetlennél NINCS");
  assert.match(miss.note!, /ADATGYŰJTÉSI hiány/);
  assert.match(unmap.note!, /FEJLESZTŐI feladat/);
});

test("a szándékosan nem gyűjtött adat nem hiány — és az ok ki van mondva", () => {
  const e = ichomExport(REG, SPEC, blank(), "Entry to prenatal care");
  const eth = e.rows.find((r) => r.code === "PCB005")!;
  assert.equal(eth.status, "notCollected");
  assert.match(eth.note!, /GDPR/);
  assert.match(eth.note!, /növekedési görbéből is kimaradt/);
});

test("a szabad szövegű feltételt géppel NEM értékeljük ki, és nem is teszünk úgy", () => {
  const e = ichomExport(REG, SPEC, blank(), PP42);
  const cond = e.rows.filter((r) => r.status === "conditional");
  assert.ok(cond.length > 0);
  assert.match(cond[0].note!, /SZABAD SZÖVEG/);
  assert.match(cond[0].note!, /se nem hiány, se nem kész/);
});

test("a caveat kimondja, hogy a kategóriák NEM adhatók össze", () => {
  const e = ichomExport(REG, SPEC, blank(), PP42);
  assert.match(e.caveat, /EZEK NEM ADHATÓK ÖSSZE/);
  assert.match(e.caveat, /teljességi/);
});

test("a rögzített érték `present` lesz, a mezőnk nevével együtt", () => {
  const st = put(blank(), [["out.mlos", 3]]);
  const e = ichomExport(REG, SPEC, st, PP42);
  const row = e.rows.find((r) => r.code === "PCB030")!;
  assert.equal(row.status, "present");
  assert.equal(row.variable, "out.mlos");
  assert.equal(row.value, 3);
});

/* ── 3. A LEKÉPEZÉS INTEGRITÁSA ─────────────────────────────────────── */

test("minden ICHOM-hivatkozás létező tételre mutat", () => {
  assert.deepEqual(validateIchomMapping(REG, SPEC).filter((i) => i.severity === "error"), []);
});

test("egy ICHOM-kódra csak EGY változónk hivatkozhat", () => {
  const codes = [...mapping(REG).keys()];
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.length >= 15, `csak ${codes.length} tétel van leképezve`);
});

/* ── 4. AZ ELMULASZTOTT MÉRÉSI PONT NEM TŰNIK EL ────────────────────── */

test("a lezárult ablak ELMULASZTOTT marad, nem lesz belőle „kész”", () => {
  const st = put(blank(), [["nb.birth.at", "2026-01-10T08:00:00Z"]]);   // ~235 nap
  const p = POINTS.state(REG, st, "pp42");
  assert.equal(p.status, "overdue");
  assert.match(p.why, /nem lesz belőle sem/);
});

test("az ablakban lévő pont esedékes", () => {
  const st = put(blank(), [["nb.birth.at", BIRTH_50D]]);
  assert.equal(POINTS.state(REG, st, "pp42").status, "due");
  assert.equal(POINTS.state(REG, st, "pp6m").status, "upcoming");
});

test("horgony nélkül a pont ISMERETLEN, nem „nem esedékes”", () => {
  const p = POINTS.state(REG, blank(), "pp42");
  assert.equal(p.status, "unknown");
  assert.deepEqual(p.missing, ["nb.birth.at"]);
  assert.match(p.why, /NEM azt jelenti, hogy nem esedékes/);
});

test("a KÉSZ állapot az adattól függ, nem az időtől", () => {
  const st = put(blank(), [["nb.birth.at", "2026-01-10T08:00:00Z"]]);
  const done = POINTS.state(REG, st, "pp42", { complete: true, missing: [] });
  assert.equal(done.status, "done");
});

/* ── 5. A NEVEZŐ: A VÁLASZARÁNY ─────────────────────────────────────── */

test("alacsony válaszarány mellett a mutató NEM közölhető összehasonlításra", () => {
  const e = ichomExport(REG, SPEC, blank(), PP42);
  const cohort = cohortCompleteness([
    { export: e, returned: true }, { export: e, returned: true },
    { export: e, returned: false }, { export: e, returned: false },
  ]);
  assert.equal(cohort.responseRate, 0.5);
  assert.equal(cohort.comparable, false);
  assert.match(cohort.caveat, /nem véletlenszerűen hiányzik/);
});

test("magas válaszarány mellett igen", () => {
  const e = ichomExport(REG, SPEC, blank(), PP42);
  const cohort = cohortCompleteness(
    Array.from({ length: 10 }, (_, i) => ({ export: e, returned: i < 9 })),
  );
  assert.equal(cohort.comparable, true);
});

/* ── 6. ESC-NOW: A FUNKCIÓ ELŐBB, A PONTSZÁM UTÁNA ──────────────────── */

test("mind a három funkció megfelelő → farmakoterápia NEM szükséges", () => {
  const st = put(blank(), [
    ["neo.nows.esc.feeding", "pos"], ["neo.nows.esc.sleeping", "pos"],
    ["neo.nows.esc.consoling", "pos"],
  ]);
  const a = assessEsc(REG, st);
  assert.equal(a.allFunctional, true);
  assert.match(a.recommendation, /farmakoterápia NEM szükséges/);
  assert.match(a.recommendation, /egy magas pontszám sem írja felül/i);
});

test("hiányzó válasz NEM jelenti azt, hogy a csecsemő jól van", () => {
  const st = put(blank(), [["neo.nows.esc.feeding", "pos"], ["neo.nows.esc.sleeping", "pos"]]);
  const a = assessEsc(REG, st);
  assert.equal(a.undetermined, true);
  assert.equal(a.allFunctional, false);
  assert.match(a.recommendation, /NEM jelenti azt, hogy a csecsemő jól van/);
});

test("a Finnegan-küszöb két mérés alatt NEM „nem teljesül”", () => {
  const st = put(blank(), [["neo.nows.finnegan", 12]]);
  const f = assessFinnegan(REG, st);
  assert.equal(f.threshold, "insufficient");
  assert.match(f.why, /NEM azt jelenti, hogy a küszöb nem teljesül/);
});

test("három egymást követő ≥ 8 teljesíti a küszöböt", () => {
  let st = blank();
  for (const v of [9, 8, 10]) st = setValue(REG, st, "neo.nows.finnegan", v);
  assert.equal(assessFinnegan(REG, recompute(REG, st)).threshold, "met");
});

test("két egymást követő ≥ 11 átlag is teljesíti", () => {
  let st = blank();
  for (const v of [7, 12, 11]) st = setValue(REG, st, "neo.nows.finnegan", v);
  const f = assessFinnegan(REG, recompute(REG, st));
  assert.equal(f.threshold, "met");
  assert.match(f.why, /átlaga/);
});

test("alacsony értékeknél nem teljesül", () => {
  let st = blank();
  for (const v of [3, 4, 5]) st = setValue(REG, st, "neo.nows.finnegan", v);
  assert.equal(assessFinnegan(REG, recompute(REG, st)).threshold, "notMet");
});

/* ── 7. A MEGFIGYELÉSI IDŐ ──────────────────────────────────────────── */

test("metadon-expozíciónál a megfigyelés HÉT nap, nem kettő", () => {
  const st = put(blank(), [
    ["neo.nows.substance", "methadone"], ["nb.birth.at", "2026-08-31T08:00:00Z"],
  ]);
  const w = observationWindow(REG, st);
  assert.equal(w.minHours, 168);
  assert.equal(w.canDischarge, false);
  assert.match(w.why, /MÉG NEM TELT EL/);
  assert.match(w.why, /az otthonba tolja/);
});

test("eltelt idő után elbocsátható", () => {
  const st = put(blank(), [
    ["neo.nows.substance", "heroin"], ["nb.birth.at", "2026-08-28T08:00:00Z"],
  ]);
  assert.equal(observationWindow(REG, st).canDischarge, true);
});

test("ismeretlen expozíció NEM jelent expozíciómentességet", () => {
  const st = put(blank(), [["nb.birth.at", BIRTH_50D]]);
  const w = observationWindow(REG, st);
  assert.equal(w.canDischarge, false);
  assert.match(w.why, /nem jelent expozíciómentességet/);
});

/* ── 8. SÚLYALAPÚ ÚJSZÜLÖTT-ADAGOK ──────────────────────────────────── */

test("súly nélkül NINCS adag — ez a helyes viselkedés", () => {
  const r = runCalc(REG, blank(), "calc.nrp.epi.iv");
  assert.notEqual(r.status, "ok");
});

test("3200 g-os újszülöttnél az epinephrin-adag 0,064 mg", () => {
  const st = put(blank(), [["nb.birthWeight", 3200]]);
  const r = runCalc(REG, st, "calc.nrp.epi.iv");
  assert.equal(r.status, "ok");
  assert.ok(Math.abs((r as { value: number }).value - 0.064) < 1e-9);
});

test("a volumenbolus 32 mL, a dextróz gél 1,6 mL", () => {
  const st = put(blank(), [["nb.birthWeight", 3200]]);
  assert.equal((runCalc(REG, st, "calc.nrp.volume") as { value: number }).value, 32);
  assert.ok(Math.abs((runCalc(REG, st, "calc.neo.dextroseGel") as { value: number }).value - 1.6) < 1e-9);
});

test("az adag mellett a TÉRFOGAT is ki van mondva — a hígítás nagyságrendi hiba", () => {
  assert.match(REG.get("neo.nrp.epi.dose")!.documentation!.pitfalls!.hu!, /0,2 mL\/ttkg/);
});

/* ── 9. A LATCH A LICENC-KAPU MÖGÖTT ────────────────────────────────── */

test("a LATCH nem vehető fel, amíg a tételszöveg licence hiányzik", async () => {
  const { loadInstruments } = await import("../core/kerdoiv/registry.ts");
  const inst = loadInstruments(join(HERE, "..", "registry", "kerdoivek"));
  const latch = inst.get("inst.latch")!;
  assert.equal(latch.itemText.status, "notLicensed");

  // EZ A TESZT KORÁBBAN ROSSZ OKBÓL VOLT ZÖLD. Az `administrable(id, lang)`
  // hívást `(REG, blank(), id)` alakban kapta, tehát a REGISZTERT adta át
  // azonosítóként — a válasz „ismeretlen mérőeszköz: [object Object]” volt,
  // és a teszt UGYANÍGY zöld lett volna akkor is, ha a licenckapu egyáltalán
  // nincs ott. Ezért néz most az állapotra, nem csak az `ok` hamis voltára.
  const a = inst.administrable("inst.latch");
  assert.equal(a.ok, false);
  assert.equal(a.allapot, "rendezetlen", "a kapu a licenc miatt zár, nem elgépelés miatt");
  assert.match(a.reason!, /nem az eszköz/);

  // …és az elrontott hívás mostantól MEGKÜLÖNBÖZTETHETŐ.
  const hibas = (inst.administrable as unknown as (...x: unknown[]) => typeof a)(
    REG, blank(), "inst.latch");
  assert.equal(hibas.allapot, "ismeretlen");
});

test("az „≤ 5 → IBCLC” vágóérték a törzsben van, nem kódban", () => {
  const raw = JSON.parse(
    readFileSync(join(HERE, "..", "registry", "kerdoivek", "perinatalis.json"), "utf8"),
  ) as Array<{ id: string; bands: Record<string, Array<{ max?: number; severity: string }>> }>;
  const latch = raw.find((x) => x.id === "inst.latch")!;
  const band = latch.bands.default.find((b) => b.severity === "redflag")!;
  assert.equal(band.max, 5);
});

/* ── 10. EGY DÁTUMMEZŐ NEM TUD NEMET MONDANI ────────────────────────── */

test("az üres haláleset-dátum HIÁNY, amíg valaki nem mondja ki a nemleges tényt", () => {
  const e = ichomExport(REG, SPEC, blank(), PP42);
  const row = e.rows.find((r) => r.code === "PCB026")!;
  assert.equal(row.status, "missing");
  assert.match(row.note!, /egy dátummező nem tud nemet mondani/);
  assert.match(row.note!, /out\.maternal\.alive/);
});

test("ellenőrzött nemleges tény után az üres dátum JOGOS", () => {
  const st = put(blank(), [
    ["out.maternal.alive", "pos"], ["out.neonate.alive", "pos"],
    ["out.birth.outcome", "liveBirth"],
  ]);
  const e = ichomExport(REG, SPEC, st, PP42);
  for (const code of ["PCB026", "PCB027", "PCB028"]) {
    const row = e.rows.find((r) => r.code === code)!;
    assert.equal(row.status, "notOccurred", code);
  }
  assert.equal(e.counts.notOccurred, 3);
});

test("a „nem tudom” válasz NEM zárja le a kérdést", () => {
  const st = put(blank(), [["out.maternal.alive", "unk"]]);
  const e = ichomExport(REG, SPEC, st, PP42);
  assert.equal(e.rows.find((r) => r.code === "PCB026")!.status, "missing");
});
