/**
 * A 07. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/07-dieta.md`:
 *
 *   „Egy bariátriai műtét utáni, GDM-es várandós esetén a generált tájékoztató
 *    mind a hat kötelező pótlást tartalmazza (vas, B12, folsav, D, kalcium + a
 *    GDM szénhidrát-elosztást), és jelzi a módosított GDM-szűrési protokollt."
 *
 * A modul kevés változóból sok kimenetet termel: a bemenetek nagy része máshol
 * már megvan, a feladat a JAVASLAT és a TÁJÉKOZTATÓ előállítása.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadDietProtocols, supplementOverlap } from "../core/diet/registry.ts";
import { loadDrugs } from "../core/rx/registry.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { runCalc } from "../core/calc/run.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const DIET = loadDietProtocols(join(HERE, "..", "registry", "dieta"));
const RX = loadDrugs(join(HERE, "..", "registry", "gyogyszerek"));

const NOW = "2026-09-02T09:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
function pregnantAt(weeks: number, st: CaseState = blank()): CaseState {
  const lmp = new Date(Date.parse(NOW) - weeks * 7 * 86_400_000).toISOString().slice(0, 10);
  let s = setValue(REG, st, "ctx.pregnant", "pos");
  return recompute(REG, setValue(REG, s, "ctx.lmp", lmp));
}
/** Szintetikus eset: bariátriai műtét után, terhességi cukorbetegséggel. */
function bariatricGdm(): CaseState {
  let st = pregnantAt(26);
  st = setValue(REG, st, "hx.sys.bariatric", "pos");
  st = setValue(REG, st, "hx.repro.gdm", "pos");
  st = setValue(REG, st, "anthro.height", 165);
  st = setValue(REG, st, "anthro.weight.prepregnancy", 78);
  return recompute(REG, st);
}
const flat = (sections: ReturnType<typeof DIET.leaflet>) =>
  sections.flatMap((s) => s.items.map((i) => `${s.title}: ${i.text}`)).join(" | ");

/* ── 1. Integritás ───────────────────────────────────────────────────── */

test("a diétás protokollok hiba nélkül validálnak a regiszter ellen", () => {
  assert.deepEqual(DIET.validate(REG).filter((i) => i.severity === "error"), []);
});

test("minden tiltás megindokolja magát", () => {
  for (const p of DIET.all()) {
    for (const a of p.avoid ?? []) {
      assert.ok(a.why?.hu, `${p.id}: indoklás nélküli tiltás — ezt a beteg nem tartja be`);
    }
  }
});

test("minden protokoll megnevezi a forrását", () => {
  for (const p of DIET.all()) assert.ok(p.source.cite.length > 15, p.id);
});

/* ── 2. AZ ELFOGADÁSI KRITÉRIUM ──────────────────────────────────────── */

test("bariátriai műtét + GDM: mind a hat kötelező pótlás megjelenik", () => {
  const sections = DIET.leaflet(REG, bariatricGdm());
  const supp = sections.find((s) => s.kind === "supplement");
  assert.ok(supp, "van pótlási szakasz");
  const texts = supp!.items.map((i) => i.text.toLowerCase()).join(" | ");
  for (const kell of ["vas", "b12", "folsav", "d-vitamin", "kalcium", "jód"]) {
    assert.match(texts, new RegExp(kell.replace(".", "\\.")), `hiányzik: ${kell}`);
  }
});

test("a szénhidrát-elosztás megjelenik a célértékek között", () => {
  const all = flat(DIET.leaflet(REG, bariatricGdm()));
  assert.match(all, /Szénhidrát reggelire/);
  assert.match(all, /Szénhidrát főétkezésenként/);
});

test("a MÓDOSÍTOTT cukorterhelés jelzése megjelenik", () => {
  const all = flat(DIET.leaflet(REG, bariatricGdm()));
  assert.match(all, /MÓDOSÍTOTT terhességi cukorbetegség-szűrés/);
  assert.match(all, /dömpinget válthat ki/);
});

test("minden tájékoztató-tétel megmondja, melyik protokollból jön", () => {
  for (const s of DIET.leaflet(REG, bariatricGdm())) {
    for (const i of s.items) {
      assert.ok(i.from, `${s.title} / ${i.text}: nincs forrás-protokoll`);
    }
  }
});

/* ── 3. A meg nem születő szám helyén ok áll, nem üres hely ──────────── */

test("az energiacél kapu mögött van, és a tájékoztató konzíliumot ír helyette", () => {
  const st = bariatricGdm();
  assert.equal(runCalc(REG, st, "calc.energy.pregnancy").status, "insufficient");
  const targets = DIET.leaflet(REG, st).find((s) => s.kind === "target")!;
  const energia = targets.items.find((i) => i.from === "calc.energy.pregnancy")!;
  assert.match(energia.text, /dietetikai konzílium/i);
  assert.ok(energia.why && energia.why.length > 20, "az ok is ott van");
});

test("a fehérjecél viszont konkrét szám — konszenzusos együttható, nem regresszió", () => {
  const r = runCalc(REG, bariatricGdm(), "calc.protein.pregnancy");
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" && r.value, 86);      // 1,1 × 78 kg
  assert.match(flat(DIET.leaflet(REG, bariatricGdm())), /Napi fehérje: kb\. 86 g/);
});

/* ── 4. A hiányzó adat NEM „nem vonatkozik rá" ───────────────────────── */

test("hiányzó bariátriai anamnézisnél a protokoll `unknown`, és a tájékoztató kimondja", () => {
  const st = pregnantAt(26);               // semmilyen anamnézis
  const s = DIET.evaluate(REG, st, "diet.protocol.bariatric");
  assert.equal(s.status, "unknown");
  assert.deepEqual(s.missing, ["hx.sys.bariatric"]);

  const open = DIET.leaflet(REG, st).find((x) => x.kind === "openQuestion");
  assert.ok(open, "a tájékoztatóban van „amit még tisztázni kell” szakasz");
  assert.match(open!.items.map((i) => i.text).join(" | "), /Bariátriai/);
});

test("kizárt bariátriai előzménynél a protokoll nem szerepel sehol", () => {
  let st = pregnantAt(26);
  st = setValue(REG, st, "hx.sys.bariatric", "neg");
  assert.equal(DIET.evaluate(REG, st, "diet.protocol.bariatric").status, "notApplicable");
  assert.doesNotMatch(flat(DIET.leaflet(REG, st)), /dömping/i);
});

/* ── 5. IOM: a célsáv a KIINDULÁSI BMI-től függ ──────────────────────── */

test("a súlygyarapodási célsáv a terhesség előtti testtömegindexből jön", () => {
  const gain = (heightCm: number, kg: number): string => {
    let st = pregnantAt(20);
    st = setValue(REG, st, "anthro.height", heightCm);
    st = setValue(REG, st, "anthro.weight.prepregnancy", kg);
    st = recompute(REG, st);
    return flat(DIET.leaflet(REG, st));
  };
  assert.match(gain(170, 50), /súlygyarapodás: 12\.5–18 kg/);     // BMI 17,3
  assert.match(gain(170, 65), /súlygyarapodás: 11\.5–16 kg/);     // BMI 22,5
  assert.match(gain(170, 80), /súlygyarapodás: 7–11\.5 kg/);      // BMI 27,7
  assert.match(gain(170, 95), /súlygyarapodás: 5–9 kg/);          // BMI 32,9
});

test("egyszerre csak EGY súlygyarapodási sáv aktív", () => {
  let st = pregnantAt(20);
  st = setValue(REG, st, "anthro.height", 170);
  st = setValue(REG, st, "anthro.weight.prepregnancy", 65);
  st = recompute(REG, st);
  const iom = DIET.states(REG, st)
    .filter((s) => s.id.startsWith("diet.protocol.iom.") && s.status === "applies");
  assert.equal(iom.length, 1);
});

/* ── 6. Szupplementációs átfedés — ne kapjon kétszer vasat ───────────── */

test("a rendelt vaskészítmény és a javasolt vaspótlás átfedése kiderül", () => {
  let st = bariatricGdm();
  st = setValue(REG, st, "rx.active", ["rx.ironSulfate"]);
  const over = supplementOverlap(REG, DIET, RX, st);
  const iron = over.find((o) => o.supplement === "diet.supp.iron")!;
  assert.equal(iron.status, "duplicate");
  assert.deepEqual(iron.coveredBy, ["rx.ironSulfate"]);
  assert.match(iron.note, /halmozódnak/);
});

test("a rendelés nélküli kötelező pótlás teendőként jelenik meg, nem hibaként", () => {
  const over = supplementOverlap(REG, DIET, RX, bariatricGdm());
  const b12 = over.find((o) => o.supplement === "diet.supp.b12")!;
  assert.equal(b12.status, "missing");
  assert.ok(b12.requiredBy.includes("diet.protocol.bariatric"));
  assert.match(b12.note, /vény nélkül szedi/);
});

/* ── 7. Amit a protokollok külön kimondanak ──────────────────────────── */

test("a terhességi hypertoniánál NEM sómegvonás szerepel", () => {
  let st = pregnantAt(30);
  st = setValue(REG, st, "hx.sys.htn", "pos");
  const all = flat(DIET.leaflet(REG, st));
  assert.match(all, /Mérsékelt sóbevitel — de NEM sómegvonás/);
  const advice = DIET.leaflet(REG, st).find((s) => s.kind === "advice")!;
  const so = advice.items.find((i) => /sóbevitel/.test(i.text))!;
  assert.match(so.why!, /plazmatérfogatot/);
});

test("a vegán étrend a B12-t kötelezővé teszi", () => {
  let st = pregnantAt(12);
  st = setValue(REG, st, "diet.pattern", "vegan", { provenance: "patient" });
  const over = supplementOverlap(REG, DIET, RX, st);
  assert.ok(over.some((o) => o.supplement === "diet.supp.b12"));
});

test("a szoptatási protokoll a terhességitől függetlenül aktiválódik", () => {
  const st = setValue(REG, blank(), "ctx.breastfeeding", "pos");
  assert.equal(DIET.evaluate(REG, st, "diet.protocol.lactation").status, "applies");
  assert.match(flat(DIET.leaflet(REG, st)), /500 kcal többlet/);
});
