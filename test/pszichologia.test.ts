/**
 * A 08. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/08-pszichologia.md`:
 *
 *   „Egy 6 pontos EPDS pozitív 10. tétellel vörös zászlót és azonnali teendőt
 *    generál, nem »normál tartomány« üzenetet. Bipoláris anamnézis mellett a
 *    PPP-rizikó automatikusan magas, és a hospitalizációs javaslat megjelenik —
 *    anélkül, hogy külön be kellene írni."
 *
 * A modul egyetlen dolgot csinál jól, ha mást nem: nem hagyja, hogy a
 * postpartum pszichózis kockázata észrevétlen maradjon.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import { assessPpp, PPP_FACTORS } from "../core/kerdoiv/ppp.ts";
import { setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const INST = loadInstruments(join(HERE, "..", "registry", "kerdoivek"));

const NOW = "2026-09-02T09:00:00Z";
function blank(pathway?: string): CaseState {
  const st: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  return pathway ? setValue(REG, st, "ctx.pathway", pathway) : st;
}
/** EPDS kitöltése tételenként; a tizedik tétel külön adható meg. */
function epds(scores: number[], pathway?: string): CaseState {
  let st = blank(pathway);
  scores.forEach((v, i) => { st = setValue(REG, st, `psy.epds.q${i + 1}`, v); });
  return st;
}

/* ── 1. Integritás ───────────────────────────────────────────────────── */

test("a mérőeszközök hiba nélkül validálnak a regiszter ellen", () => {
  assert.deepEqual(INST.validate(REG).filter((i) => i.severity === "error"), []);
});

test("minden eszköz megnevezi a validációs közleményt", () => {
  for (const i of INST.all()) assert.ok(i.source.cite.length > 20, i.id);
});

test("a tétel pontértékei és a változó kódkészlete egyeznek", () => {
  // Ha eltérnének, a kérdőív mást pontozna, mint amit a felület felvesz.
  for (const i of INST.all()) {
    for (const q of i.items) {
      const codes = (REG.get(q.variable)!.valueSet ?? []).map((o) => Number(o.code));
      assert.deepEqual(codes.sort(), q.options.map((o) => o.score).sort(), `${i.id}/${q.id}`);
    }
  }
});

/* ── 2. AZ ELFOGADÁSI KRITÉRIUM — a Q10 kapu ─────────────────────────── */

test("6 pontos EPDS pozitív 10. tétellel VÖRÖS ZÁSZLÓ, nem „normál tartomány”", () => {
  //  öt darab 1 pont + a tizedik tétel 1 pont = 6 pont, a küszöb alatt
  const st = epds([1, 1, 1, 1, 1, 0, 0, 0, 0, 1], "postpartum");
  const r = INST.score(REG, st, "inst.epds");
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;

  assert.equal(r.total, 6);
  assert.equal(r.band.severity, "normal", "az ÖSSZPONTSZÁM szerint a normál sávban van");
  assert.equal(r.critical.triggered, true, "a kritikus tétel mégis szól");
  assert.match(r.critical.message!, /összpontszámtól FÜGGETLENÜL/);
  assert.match(r.critical.message!, /pszichiátriai konzultációt/);
});

test("ugyanaz a 6 pont a 10. tétel nélkül NEM ad vörös zászlót", () => {
  const st = epds([1, 1, 1, 1, 1, 1, 0, 0, 0, 0], "postpartum");
  const r = INST.score(REG, st, "inst.epds");
  assert.equal(r.status === "ok" && r.total, 6);
  assert.equal(r.critical.triggered, false);
});

test("a kritikus tétel akkor is szól, ha az összpontszám nem születik meg", () => {
  // Csak a 10. tétel van kitöltve — összpontszám nincs, kapu mégis nyílik.
  const st = setValue(REG, blank("postpartum"), "psy.epds.q10", 2);
  const r = INST.score(REG, st, "inst.epds");
  assert.equal(r.status, "insufficient");
  assert.equal(r.critical.triggered, true,
    "a hiányos kitöltés nem némíthatja el a kritikus tételt");
});

/* ── 3. Részleges kitöltésből nincs összpontszám ─────────────────────── */

test("kilenc tételből nincs EPDS-pontszám — az arányosítás nem validált", () => {
  const st = epds([1, 1, 1, 1, 1, 1, 1, 1, 1]);   // a 10. hiányzik
  const r = INST.score(REG, st, "inst.epds");
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("psy.epds.q10"));
  assert.match(r.status === "insufficient" ? r.reason : "", /nem arányosítható/);
});

/* ── 4. A vágóérték IDŐSZAKFÜGGŐ ─────────────────────────────────────── */

test("ugyanaz a 12 pont antepartum kóros, postpartum határérték", () => {
  const scores = [2, 2, 2, 2, 2, 2, 0, 0, 0, 0];    // 12 pont
  const ante = INST.score(REG, epds(scores, "prenatal"), "inst.epds");
  const post = INST.score(REG, epds(scores, "postpartum"), "inst.epds");
  assert.equal(ante.status === "ok" && ante.total, 12);
  assert.equal(ante.status === "ok" && ante.band.severity, "redflag");
  assert.equal(post.status === "ok" && post.band.severity, "watch");
});

test("ismeretlen ellátási útvonalnál az alapértelmezett vágóérték érvényes", () => {
  const r = INST.score(REG, epds([2, 2, 2, 2, 2, 2, 0, 0, 0, 0]), "inst.epds");
  assert.equal(r.status === "ok" && r.context, "default");
});

/* ── 5. A LICENC-KAPU ────────────────────────────────────────────────── */

test("licenceletlen tételszöveggel az eszköz NEM vehető fel", () => {
  const a = INST.administrable("inst.epds");
  assert.equal(a.ok, false);
  assert.match(a.reason!, /nem az eszköz/);
  assert.match(a.reason!, /vágóértékei sem érvényesek/);
});

test("a szabadon használható szövegű eszköz felvehető", () => {
  assert.equal(INST.administrable("inst.whooley").ok, true);
});

test("a pontozás akkor is működik, ha a szöveg nincs betöltve", () => {
  // A kapu a FELVÉTELRE vonatkozik, nem a már rögzített adat feldolgozására:
  // egy máshol felvett EPDS eredménye értékelhető marad.
  assert.equal(INST.score(REG, epds(new Array(10).fill(1)), "inst.epds").status, "ok");
});

test("a fordítás állapota megjelenik az eredményben", () => {
  const r = INST.score(REG, epds(new Array(10).fill(0)), "inst.epds");
  assert.equal(r.status === "ok" && r.translation, "validated",
    "az EPDS-nek van magyar validációja — ez ritka és értékes");
  const w = INST.score(REG, setValue(REG, setValue(REG, blank(),
    "psy.whooley.q1", 0), "psy.whooley.q2", 0), "inst.whooley");
  assert.equal(w.status === "ok" && w.translation, "unvalidated");
});

/* ── 6. AZ ELFOGADÁSI KRITÉRIUM — PPP-rizikó ─────────────────────────── */

test("bipoláris anamnézis mellett a PPP-kockázat MAGAS, külön bevitel nélkül", () => {
  const st = setValue(REG, blank(), "hx.psy.bipolar", "pos");
  const a = assessPpp(REG, st);
  assert.equal(a.level, "high");
  assert.ok(a.actions.some((x) => /felvétel \(hospitalizáció\) mérlegelése/i.test(x)),
    "a hospitalizációs javaslat megjelenik");
  assert.ok(a.actions.some((x) => /alvásmegvonás/i.test(x)));
});

test("minden felsorolt tényező hozza a saját forrását és publikált hatását", () => {
  const a = assessPpp(REG, setValue(REG, blank(), "hx.psy.bipolar", "pos"));
  for (const f of a.factors) {
    assert.ok(f.source.cite.length > 20, `${f.id}: nincs forrás`);
    assert.ok(f.publishedEffect.length > 10, `${f.id}: nincs publikált hatás`);
  }
});

test("ÖSSZESÍTETT KOCKÁZATI SZÁM SZÁNDÉKOSAN NINCS — és a hiánya meg van indokolva", () => {
  const a = assessPpp(REG, setValue(REG, blank(), "hx.psy.bipolar", "pos"));
  assert.ok(!("combinedOdds" in a), "nincs kombinált esélyhányados");
  assert.match(a.noCombinedEstimate, /nem függetlenek/);
  assert.match(a.noCombinedEstimate, /pontosnak látszana/);
});

test("hiányzó pszichiátriai anamnézisnél `unknown`, és NEM alacsony kockázat", () => {
  const a = assessPpp(REG, blank());
  assert.equal(a.level, "unknown");
  assert.ok(a.missing.includes("hx.psy.bipolar"));
  assert.ok(a.actions.some((x) => /NEM tekintendő alacsony kockázatúnak/.test(x)));
});

test("kizárt major tényezők mellett az elsőszülőség emelt, nem magas kockázat", () => {
  let st = blank();
  st = setValue(REG, st, "hx.psy.bipolar", "neg");
  st = setValue(REG, st, "hx.psy.prevPPP", "neg");
  st = setValue(REG, st, "hx.psy.prevPPD", "neg");
  st = setValue(REG, st, "ctx.parity.para", 0);
  assert.equal(assessPpp(REG, st).level, "elevated");
});

test("minden rizikófaktor létező változóra hivatkozik", () => {
  for (const f of PPP_FACTORS) assert.ok(REG.get(f.variable), f.variable);
});
