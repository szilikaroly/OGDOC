/**
 * A 06. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/06-gyogyszereles.md`:
 *
 *   „Bejelölt asztma mellett a carboprost rendelése hard-stop modálist vált ki,
 *    indoklás nélkül nem folytatható, és az indoklás megjelenik a
 *    zárójelentésben."
 *
 * És a mondat, ami miatt ez az egész rendszer így épül:
 *
 *   „Az anamnézisben bejelölt asztma a szülőszobán megállítja a carboprost
 *    rendelését."
 *
 * Az adat a FELVÉTELKOR kerül be, a döntés hetekkel később, MÁS MODULBAN, MÁS
 * FELHASZNÁLÓTÓL születik — és a rendszer mégis összeköti a kettőt.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadDrugs } from "../core/rx/registry.ts";
import { prescribe, overrides, GateError } from "../core/rx/prescribe.ts";
import { recompute, resolve, setValue } from "../core/derive/engine.ts";
import { runCalc } from "../core/calc/run.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const RX = loadDrugs(join(HERE, "..", "registry", "gyogyszerek"));

const NOW = "2026-09-01T12:00:00Z";
function blank(encounter = "labour"): CaseState {
  return { ctx: { encounter, now: NOW }, values: {}, errors: [] };
}

/* ── 1. A törzs integritása ──────────────────────────────────────────── */

test("a gyógyszertörzs hiba nélkül validál a regiszter ellen", () => {
  assert.deepEqual(RX.validate(REG).filter((i) => i.severity === "error"), []);
});

test("minden kapu megnevezi a forrását és a hivatkozott változót", () => {
  for (const d of RX.all()) {
    for (const g of d.gates ?? []) {
      assert.ok(g.source.cite.length > 10, `${d.id}/${g.id}: nincs forrás`);
      for (const c of g.when) assert.ok(REG.get(c.var), `${d.id}/${g.id}: ${c.var}`);
    }
  }
});

/* ── 2. AZ ELFOGADÁSI KRITÉRIUM ──────────────────────────────────────── */

test("bejelölt asztma mellett a carboprost rendelése MEGÁLL", () => {
  // A felvételkor, az anamnézis-modulban rögzített adat…
  const felvetel = setValue(REG, blank("ambulatory"), "hx.sys.asthma", "pos");

  // …hetekkel később, a szülőszobán állítja meg a rendelést.
  const szuloszoba: CaseState = { ...felvetel, ctx: { ...felvetel.ctx, encounter: "labour" } };
  let err: GateError | null = null;
  try { prescribe(REG, RX, szuloszoba, "rx.carboprost"); } catch (e) { err = e as GateError; }
  assert.ok(err instanceof GateError, "a rendelés megállt");

  assert.match(err.message, /ASZTMA/);
  assert.match(err.message, /indoklás nélkül nem folytatható/);
  assert.equal(err.check.outcome, "stop");
  assert.ok(err.check.gates.some((g) => g.gate === "gate.carboprost.asthma"));
});

test("a kapu megnevezi, mi jöhet helyette", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "pos");
  const check = RX.check(REG, st, "rx.carboprost");
  const gate = check.gates.find((g) => g.verdict === "blocked")!;
  assert.ok(gate.alternatives.includes("rx.oxytocin"));
  for (const a of gate.alternatives) assert.ok(RX.get(a), `${a} nem létező szer`);
});

test("indoklással a rendelés folytatható, és az indoklás a rekordba kerül", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "pos");
  const { state, check } = prescribe(REG, RX, st, "rx.carboprost", {
    overrideGate: "gate.carboprost.asthma",
    overrideReason:
      "Életveszélyes atóniás vérzés, minden más uterotonikum kimerítve; " +
      "aneszteziológus jelen, bronchospasmus kezelésére felkészülve.",
    by: "dr. Szintetikus",
  });
  assert.equal(check.outcome, "stop", "a kapu attól még nyitott volt");

  const list = resolve(REG, state, "rx.active").value as string[];
  assert.ok(list.includes("rx.carboprost"), "a készítmény felkerült a névsorra");

  const o = overrides(REG, RX, state);
  assert.equal(o.length, 1);
  assert.equal(o[0].gate, "gate.carboprost.asthma");
  assert.match(o[0].reason, /Életveszélyes/);
  assert.equal(o[0].label, "Carboprost");
});

test("üres vagy csak szóközből álló indoklás nem indoklás", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "pos");
  assert.throws(() => prescribe(REG, RX, st, "rx.carboprost", {
    overrideGate: "gate.carboprost.asthma", overrideReason: "   ",
  }), GateError);
});

test("másik kapura szóló indoklás nem nyitja ki ezt a kaput", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "pos");
  assert.throws(() => prescribe(REG, RX, st, "rx.carboprost", {
    overrideGate: "gate.methylergometrine.htn", overrideReason: "más helyzet",
  }), /nem ehhez a kapuhoz szól/);
});

/* ── 3. A HIÁNYZÓ ADAT NEM „nincs kontraindikáció” ───────────────────── */

test("ismeretlen asztma-anamnézisnél nem engedünk és nem tiltunk: KÉRDEZÜNK", () => {
  let err: GateError | null = null;
  try { prescribe(REG, RX, blank(), "rx.carboprost"); } catch (e) { err = e as GateError; }
  assert.ok(err instanceof GateError);
  assert.equal(err.check.outcome, "ask");
  assert.match(err.message, /hiányzik hx.sys.asthma/);
  assert.match(err.message, /NEM jelenti azt, hogy a kontraindikáció nem áll fenn/);
});

test("kizárt asztma mellett a rendelés akadálytalan", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "neg");
  const { check, state } = prescribe(REG, RX, st, "rx.carboprost");
  assert.equal(check.outcome, "ok");
  assert.deepEqual(overrides(REG, RX, state), []);
});

test("a „nem tudom” válasz rögzített adat: a kapu eldől, nem marad nyitva", () => {
  const st = setValue(REG, blank(), "hx.sys.asthma", "unk");
  assert.equal(RX.check(REG, st, "rx.carboprost").outcome, "ok",
    "az `unk` nem `pos`, tehát a feltétel nem teljesül — de a klinikus látja, hogy nem tudjuk");
});

/* ── 4. További kapuk ────────────────────────────────────────────────── */

test("a methylergometrin KÉT külön adatra néz: korábbi hypertonia és jelen praeeclampsia", () => {
  const htn = setValue(REG, blank(), "hx.sys.htn", "pos");
  assert.equal(RX.check(REG, htn, "rx.methylergometrine").outcome, "stop");

  let pe = setValue(REG, blank(), "hx.sys.htn", "neg");
  pe = setValue(REG, pe, "hx.repro.currentPregnancy.preeclampsia", "pos");
  assert.equal(RX.check(REG, pe, "rx.methylergometrine").outcome, "stop",
    "a normotenzív előzmény nem zárja ki a mostani praeeclampsiát");
});

test("az NSAID kapuja a harmadik trimeszterben zár, korábban nem", () => {
  const at = (weeks: number): CaseState => {
    const lmp = new Date(Date.parse(NOW) - weeks * 7 * 86_400_000).toISOString().slice(0, 10);
    let s = setValue(REG, blank("ambulatory"), "ctx.pregnant", "pos");
    return recompute(REG, setValue(REG, s, "ctx.lmp", lmp));
  };
  assert.equal(RX.check(REG, at(20), "rx.ibuprofen").outcome, "ok");
  assert.equal(RX.check(REG, at(34), "rx.ibuprofen").outcome, "stop");
});

test("a súlyos thrombocytopenia megállítja a thrombosisprofilaxist", () => {
  const st = setValue(REG, blank(), "lab.plt", 40);
  assert.equal(RX.check(REG, st, "rx.enoxaparin").outcome, "stop");
});

test("EGY megválaszolt kapu nem elég: a másik megválaszolatlanul kérdés marad", () => {
  // A thrombocytaszám rendben, de a véralvadási zavarról nincs adat.
  let st = setValue(REG, blank(), "lab.plt", 140);
  assert.equal(RX.check(REG, st, "rx.enoxaparin").outcome, "ask",
    "a rendszer nem az ELSŐ kapun áll meg, hanem az összesen");

  st = setValue(REG, st, "hx.sys.bleedingDisorder", "neg");
  assert.equal(RX.check(REG, st, "rx.enoxaparin").outcome, "ok");
});

/* ── 5. Terhességi átalakítás ────────────────────────────────────────── */

test("ACE-gátló terhességben: kapu ÉS megnevezett csere", () => {
  const st = setValue(REG, blank("ambulatory"), "ctx.pregnant", "pos");
  assert.equal(RX.check(REG, st, "rx.ramipril").outcome, "stop");
  const t = RX.get("rx.ramipril")!.transformInPregnancy!;
  assert.ok(t.to.includes("rx.methyldopa"));
  for (const to of t.to) assert.ok(RX.get(to), `${to} nem létező szer`);
  assert.match(t.reason.hu!, /magzati vesefejlődést/);
});

/* ── 6. Kereskedelmi névre is találjon ───────────────────────────────── */

test("a beírt kereskedelmi név megtalálja a hatóanyagot", () => {
  assert.equal(RX.search("Clexane")[0].id, "rx.enoxaparin");
  assert.equal(RX.search("methergin")[0].id, "rx.methylergometrine");
  assert.equal(RX.search("Dopegyt")[0].id, "rx.methyldopa");
});

test("indikációra a szóba jövő szerek listázhatók", () => {
  const pph = RX.forIndication("pph").map((d) => d.id);
  assert.ok(pph.includes("rx.oxytocin") && pph.includes("rx.tranexamic"));
});

/* ── 7. Adagolás: egység nélküli adag nem rögzíthető ─────────────────── */

test("az adag egysége önálló mezőből jön, és nélküle az adag sem írható", () => {
  const st = setValue(REG, blank(), "rx.active", ["rx.oxytocin"]);
  assert.throws(
    () => setValue(REG, st, "rx.dose.amount", 10, { scope: "rx.oxytocin" }),
    /az egység a\(z\) rx.dose.unit mezőből jön/,
  );
  const withUnit = setValue(REG, st, "rx.dose.unit", "[IU]", { scope: "rx.oxytocin" });
  const dosed = setValue(REG, withUnit, "rx.dose.amount", 10, { scope: "rx.oxytocin" });
  assert.equal(dosed.values["rx.dose.amount"][0].unit, "[IU]",
    "a motor az egységet az értékre bélyegzi");
});

test("két készítmény adagja nem folyik egymásba", () => {
  let st = setValue(REG, blank(), "rx.active", ["rx.oxytocin", "rx.tranexamic"]);
  st = setValue(REG, st, "rx.dose.unit", "[IU]", { scope: "rx.oxytocin" });
  st = setValue(REG, st, "rx.dose.amount", 10, { scope: "rx.oxytocin" });
  st = setValue(REG, st, "rx.dose.unit", "g", { scope: "rx.tranexamic" });
  st = setValue(REG, st, "rx.dose.amount", 1, { scope: "rx.tranexamic" });

  assert.equal(resolve(REG, st, "rx.dose.amount", "rx.oxytocin").value, 10);
  assert.equal(resolve(REG, st, "rx.dose.amount", "rx.tranexamic").value, 1);
});

/* ── 8. Dózisszámítás ────────────────────────────────────────────────── */

test("a testsúlysáv szerinti enoxaparin-adag a 40 mg felett is helyes", () => {
  const dose = (kg: number) => {
    const st = setValue(REG, blank(), "anthro.weight.current", kg);
    const r = runCalc(REG, st, "calc.lmwh.prophylaxis");
    return r.status === "ok" ? r.value : null;
  };
  assert.equal(dose(45), 20);
  assert.equal(dose(70), 40);
  assert.equal(dose(110), 60, "90 kg felett a standard 40 mg aluldozíroz");
  assert.equal(dose(150), 80);
  assert.equal(dose(200), 120);
});

test("a kreatinin-clearance kapu mögött van, mint a CKD-EPI", () => {
  let st = setValue(REG, blank(), "patient.birthDate", "1994-03-02");
  st = setValue(REG, st, "anthro.weight.current", 70);
  st = setValue(REG, st, "lab.cr", 62);
  st = recompute(REG, st);
  const r = runCalc(REG, st, "calc.crcl");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /nincsenek visszaellenőrizve/);
});

/* ── 9. Szoptatás ────────────────────────────────────────────────────── */

test("minden szer szoptatási besorolása forrással együtt áll", () => {
  for (const d of RX.all()) {
    if (!d.lactation) continue;
    assert.match(d.lactation.hale, /^L[1-5]$/, `${d.id}: érvénytelen Hale-kategória`);
    assert.ok(d.lactation.source.cite.length > 10, `${d.id}: nincs forrás`);
  }
});
