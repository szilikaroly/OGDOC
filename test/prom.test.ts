/**
 * A 16. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/16-betegelegedettseg.md`:
 *
 *   „A 42. napos mérési ponton a beteg által kitöltött készletek pontszáma az
 *    ICHOM pontozási szabálya szerint számolódik… A `08` modul EPDS-e és ez a
 *    modul EPDS-e UGYANAZ A VÁLTOZÓ, nem két külön kitöltés."
 *
 * És a modul legfontosabb szabálya:
 *
 *   „A klinikus NEM ÍRHATJA FELÜL a beteg válaszát."
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import { loadPromSets } from "../core/prom/sets.ts";
import { runCalc } from "../core/calc/run.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const INST = loadInstruments(join(HERE, "..", "registry", "kerdoivek"));
const SETS = loadPromSets(join(HERE, "..", "registry", "prom"));

const NOW = "2026-09-02T16:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
/** A PROM-mezőkre CSAK beteg-eredettel lehet írni. */
function patient(st: CaseState, pairs: Array<[string, unknown]>): CaseState {
  let s = st;
  for (const [id, v] of pairs) s = setValue(REG, s, id, v, { provenance: "patient" });
  return recompute(REG, s);
}

/* ── 1. A KLINIKUS NEM ÍRHATJA FELÜL ────────────────────────────────── */

test("a PROM-mező klinikusi eredettel NEM írható", () => {
  let err: Error | null = null;
  try {
    setValue(REG, blank(), "prom.eq5d.mobility", 2);   // alapértelmezés: clinician
  } catch (e) { err = e as Error; }
  assert.ok(err, "a klinikusi írásnak hibát kellett volna dobnia");
  assert.match(err!.message, /A klinikus nem írhatja felül/);
});

test("beteg-eredettel viszont igen", () => {
  const st = patient(blank(), [["prom.eq5d.mobility", 2]]);
  assert.equal(resolve(REG, st, "prom.eq5d.mobility").value, 2);
  assert.equal(st.values["prom.eq5d.mobility"][0].provenance, "patient");
});

test("a `provenanceAllowed` eddig díszítés volt — most kapu", () => {
  const def = REG.get("prom.eq5d.mobility")!;
  assert.deepEqual(def.provenanceAllowed, ["patient"]);
  // a szabályt a regiszter-validátor is őrzi: minden PROM-változóra kötelező
  const bad = REG.all().filter(
    (d) => d.module === "prom" && !d.aliasOf && !d.derivation && !d.scopedBy &&
      d.id !== "prom.instruments" && !(d.provenanceAllowed ?? []).includes("patient"),
  );
  assert.deepEqual(bad.map((d) => d.id), []);
});

test("az ellentmondást a klinikus KÜLÖN mezőben rögzíti, példányonként", () => {
  let st = setValue(REG, blank(), "prom.instruments", ["inst.epds", "inst.bssr"]);
  st = setValue(REG, st, "prom.clinicianNote",
    "A kitöltés a látogatás alatt, zajos kórteremben történt.",
    { scope: "inst.epds" });
  assert.match(
    String(resolve(REG, st, "prom.clinicianNote", "inst.epds").value), /zajos/,
  );
  // és a másik eszközhöz tartozó megjegyzés ettől független
  assert.equal(resolve(REG, st, "prom.clinicianNote", "inst.bssr").state, "missing");
});

test("nem felvett eszközhöz nem rögzíthető megjegyzés", () => {
  let err: Error | null = null;
  try {
    setValue(REG, blank(), "prom.clinicianNote", "x", { scope: "inst.bssr" });
  } catch (e) { err = e as Error; }
  assert.ok(err);
  assert.match(err!.message, /nincs a névsorban/);
});

/* ── 2. EGY VÁLTOZÓ, KÉT NÉVEN — A TÜKÖR ────────────────────────────── */

test("a 08. modul EPDS-e és a 16. modul EPDS-e UGYANAZ a változó", () => {
  assert.equal(REG.get("prom.mh.epds.total")!.aliasOf, "psy.epds.total");
  assert.equal(REG.resolvePrimary("prom.mh.epds.total"), "psy.epds.total");
});

test("a tükrön keresztül olvasva ugyanaz az érték jön", () => {
  let st = blank();
  for (let i = 1; i <= 10; i++) st = setValue(REG, st, `psy.epds.q${i}`, i <= 3 ? 2 : 0);
  st = recompute(REG, st);
  const a = resolve(REG, st, "psy.epds.total");
  const b = resolve(REG, st, "prom.mh.epds.total");
  assert.equal(a.state, "ok");
  assert.equal(b.value, a.value);
  assert.equal(Object.keys(st.values).filter((k) => k.includes("epds.total")).length, 1);
});

/* ── 3. A LICENC-KAPU A KÉSZLETEKEN ─────────────────────────────────── */

test("a 42. napos készlet minden eszköze licenc-kapu mögött van", () => {
  const s = SETS.state(REG, INST, blank(), "pp42");
  assert.equal(s.instruments.length, 6);
  assert.equal(s.blocked, 6);
  for (const i of s.instruments) {
    assert.equal(i.readiness, "blocked", i.instrument);
    assert.equal(i.publishable, false);
    assert.match(i.why, /nem hasonlítható semmihez/);
  }
});

test("a kapu oka BESZERZÉS, nem fejlesztés és nem adatgyűjtés", () => {
  const s = SETS.state(REG, INST, blank(), "pp42");
  assert.match(s.caveat, /beszerzés/i);
  assert.match(s.caveat, /nem fejlesztői feladat és nem adatgyűjtési mulasztás/);
});

test("a készlet emlékeztet arra, hogy a PROM-ot a BETEG tölti ki", () => {
  assert.match(SETS.state(REG, INST, blank(), "entry").caveat, /a klinikus a válaszát nem írhatja felül/);
});

test("minden mérési ponthoz tartozik készlet", () => {
  for (const p of ["entry", "t3", "pp42", "pp6m"]) assert.ok(SETS.forPoint(p), p);
});

/* ── 4. PONTOZÁS ────────────────────────────────────────────────────── */

test("a WHODAS egyszerű összegzés — és ezt ki is mondja", () => {
  const st = patient(blank(), Array.from({ length: 12 }, (_, i) =>
    [`prom.whodas.q${i + 1}`, 2] as [string, unknown]));
  const r = runCalc(REG, st, "calc.whodas.total");
  assert.equal(r.status, "ok");
  assert.equal((r as { value: number }).value, 12);      // 12 × (2−1)
  assert.match(REG.get("prom.whodas.total")!.documentation.pitfalls!.hu!, /IRT/);
});

test("a BSES-SF 14 tételből 14–70 közötti összeget ad", () => {
  const st = patient(blank(), Array.from({ length: 14 }, (_, i) =>
    [`prom.bses.q${i + 1}`, 4] as [string, unknown]));
  assert.equal((runCalc(REG, st, "calc.bses.total") as { value: number }).value, 56);
});

test("hiányos kitöltésből NINCS pontszám", () => {
  const st = patient(blank(), Array.from({ length: 13 }, (_, i) =>
    [`prom.bses.q${i + 1}`, 4] as [string, unknown]));
  assert.notEqual(runCalc(REG, st, "calc.bses.total").status, "ok");
});

/* ── 5. AZ EQ-5D: PROFIL IGEN, INDEX NEM ────────────────────────────── */

test("az EQ-5D profil ötjegyű kód, a dimenziók sorrendjében", () => {
  const st = patient(blank(), [
    ["prom.eq5d.mobility", 2], ["prom.eq5d.selfCare", 1], ["prom.eq5d.activities", 1],
    ["prom.eq5d.pain", 2], ["prom.eq5d.anxiety", 3],
  ]);
  assert.equal(resolve(REG, st, "prom.eq5d.profile").value, 21123);
});

test("a profil KÓD, nem mennyiség — és ezt a mező kimondja", () => {
  const d = REG.get("prom.eq5d.profile")!;
  assert.match(d.documentation.pitfalls!.hu!, /KÓD, NEM MENNYISÉG/);
  assert.match(d.documentation.pitfalls!.hu!, /HASZNOSSÁGI INDEXET a rendszer NEM ad/);
});

test("hasznossági INDEX nem létezik a rendszerben", () => {
  const ids = REG.all().map((d) => d.id);
  assert.ok(!ids.some((i) => /eq5d.*(index|utility)/i.test(i)),
    "az index országspecifikus, licencelt értékkészletet kíván");
});

test("a VAS az egyetlen EQ-5D-tétel, ami licenc nélkül is értelmezhető", () => {
  const st = patient(blank(), [["prom.eq5d.vas", 75]]);
  assert.equal(resolve(REG, st, "prom.eq5d.vas").value, 75);
  assert.match(REG.get("prom.eq5d.vas")!.documentation.whyItMatters!.hu!, /saját skálája/);
});

/* ── 6. AZ ELÉGEDETTSÉG NEM MINŐSÉG ─────────────────────────────────── */

test("az elégedettségi tétel kimondja, hogy nem a szakmai színvonalat méri", () => {
  assert.match(REG.get("prom.sat.overall")!.documentation.pitfalls!.hu!, /NEM MINŐSÉG/);
});

test("a bevonás kérdése nem „sokat”, hanem „amennyire szerette volna”", () => {
  assert.match(REG.get("prom.resp.role")!.documentation.pitfalls!.hu!, /ANNYIRA-e, amennyire szerette volna/);
});

test("a tiszteletteljes bánásmód ÖNÁLLÓ kimenetel", () => {
  assert.match(REG.get("prom.resp.respect")!.documentation.whyItMatters!.hu!, /önálló kimenetel/);
});

/* ── 7. A KÉT FÜGGETLEN TENGELY ─────────────────────────────────────── */

test("a licenc és a fordítás KÉT KÜLÖN kérdés, két külön következménnyel", () => {
  const s = SETS.state(REG, INST, blank(), "entry");
  const whooley = s.instruments.find((i) => i.instrument === "inst.whooley")!;
  const eq5d = s.instruments.find((i) => i.instrument === "inst.eq5d5l")!;
  // A Whooley tételszövege közkincs → FELVEHETŐ, de a fordítás nem validált.
  assert.equal(whooley.readiness, "pending");
  // Az EQ-5D-5L tételszövege licencköteles → NEM vehető fel.
  assert.equal(eq5d.readiness, "blocked");
});

test("tíz eszközből ma EGY vehető fel", () => {
  const ok = INST.all().filter((i) => INST.administrable(i.id).ok);
  assert.equal(INST.all().length, 10);
  assert.deepEqual(ok.map((i) => i.id), ["inst.whooley"]);
});

test("a felvehető eszköz sem publikálható, ha a fordítás nem validált", () => {
  const s = SETS.state(REG, INST, blank(), "entry");
  const whooley = s.instruments.find((i) => i.instrument === "inst.whooley")!;
  assert.equal(whooley.publishable, false);
});
