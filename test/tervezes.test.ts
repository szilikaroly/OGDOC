/**
 * A 13. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/13-ellatas-tervezes.md`:
 *
 *   „Egy ikerterhes, krónikus hypertoniás beteg vizitrendje sűrűbb, mint egy
 *    alacsony kockázatúé, és a különbség INDOKOLVA jelenik meg — nem csak a
 *    dátumok mások, hanem az is látszik, melyik rizikófaktor sűrítette."
 *
 * És a modul saját szabálya, ami minden másnál fontosabb:
 *
 *   A HIÁNYZÓ RIZIKÓADAT NEM ALACSONY KOCKÁZAT.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadCareProtocols, loadConsultRules } from "../core/plan/registry.ts";
import { deliveryPlan } from "../core/plan/delivery.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const CARE = loadCareProtocols(join(HERE, "..", "registry", "gondozas"));
const CONSULTS = loadConsultRules(join(HERE, "..", "registry", "gondozas"));
const P = "care.pregnancy.hu";

const NOW = "2026-09-02T16:00:00Z";
/** 24+0 hét a NOW időpontban — a `ctx.ga` levezetett, az utolsó menzeszből számol. */
const GA24 = "2026-03-18";
/** A `patient.age` is levezetett: a születési dátumból és a `ctx.now`-ból. */
const BORN30 = "1996-05-01";
const BORN42 = "1984-05-01";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
function put(st: CaseState, pairs: Array<[string, unknown]>): CaseState {
  let s = st;
  for (const [id, v] of pairs) s = setValue(REG, s, id, v);
  return recompute(REG, s);
}

/** Minden rizikófaktor NEGATÍV — csak így lehet valaki „alacsony kockázatú”. */
const LOW: Array<[string, unknown]> = [
  ["ctx.pregnant", "pos"], ["ctx.lmp", GA24], ["ctx.multiple", "no"],
  ["hx.sys.htn", "neg"], ["hx.sys.dm1", "neg"], ["hx.sys.dm2", "neg"],
  ["hx.repro.preeclampsia", "neg"], ["hx.repro.prevBirth.preterm", "neg"],
  ["hx.repro.gdm", "neg"], ["hx.repro.prevBirth.cs", 0], ["patient.birthDate", BORN30],
];

const lowRisk = () => put(blank(), LOW);
const twinHtn = () => put(blank(), [
  ...LOW.filter(([k]) => k !== "ctx.multiple" && k !== "hx.sys.htn"),
  ["ctx.multiple", "mcda"], ["hx.sys.htn", "pos"],
]);

/* ── 1. AZ ELFOGADÁSI KRITÉRIUM ─────────────────────────────────────── */

test("az ikerterhes, hypertoniás vizitrend SŰRŰBB, mint az alacsony kockázatúé", () => {
  const a = CARE.plan(REG, lowRisk(), P);
  const b = CARE.plan(REG, twinHtn(), P);
  assert.ok(b.visits.length > a.visits.length,
    `${b.visits.length} nem több, mint ${a.visits.length}`);
  assert.equal(a.addedCount, 0);
  assert.ok(b.addedCount > 0);
});

test("a különbség INDOKOLVA jelenik meg: minden sűrítés megnevezi a rizikófaktort", () => {
  const b = CARE.plan(REG, twinHtn(), P);
  const extra = b.visits.filter((v) => v.origin === "modifier");
  assert.ok(extra.length > 0);
  for (const v of extra) {
    assert.ok(v.because.length > 0, `${v.id} indoklás nélkül került be`);
    for (const w of v.because) {
      assert.ok(w.why.length > 20, `${w.modifier}: üres indoklás`);
      assert.ok(w.source.length > 10, `${w.modifier}: forrás nélküli sűrítés`);
    }
  }
});

test("nem csak a vizit, a TARTALMA is indokolt — az alapvizit is kaphat okot", () => {
  // A 40 év feletti életkor NEM tesz új vizitet a 38. hétre: ott már van egy.
  // Tartalmat ad hozzá — és az indoklás a MEGLÉVŐ viziten jelenik meg.
  const st = put(blank(), [...LOW.filter(([k]) => k !== "patient.birthDate"),
    ["patient.birthDate", BORN42]]);
  const p = CARE.plan(REG, st, P);
  const v38 = p.visits.find((x) => x.from === 38 && x.to === 38)!;
  assert.equal(v38.origin, "protocol");
  assert.equal(p.addedCount, 0, "nem kellett volna új vizit");
  assert.equal(v38.because.length, 1);
  assert.match(v38.content.join(" | "), /szülésindítás/);
});

test("két rizikófaktor UGYANARRA a vizitre: mindkét ok megjelenik", () => {
  const st = put(blank(), [
    ...LOW.filter(([k]) => k !== "hx.sys.htn" && k !== "hx.repro.preeclampsia"),
    ["hx.sys.htn", "pos"], ["hx.repro.preeclampsia", "pos"],
  ]);
  const p = CARE.plan(REG, st, P);
  const v26 = p.visits.find((x) => x.from === 26 && x.to === 26)!;
  assert.equal(v26.because.length, 2);
  assert.deepEqual(
    v26.because.map((b) => b.modifier).sort(),
    ["mod.htn.chronic", "mod.preeclampsia.prev"],
  );
});

/* ── 2. A HIÁNYZÓ ADAT NEM ALACSONY KOCKÁZAT ────────────────────────── */

test("hiányzó rizikóadatnál a terv ELŐZETES, nem alacsony kockázatú", () => {
  const st = put(blank(), [["ctx.pregnant", "pos"], ["ctx.lmp", GA24]]);
  const p = CARE.plan(REG, st, P);
  assert.equal(p.provisional, true);
  assert.ok(p.undetermined.length > 0);
  assert.match(p.caveat, /NEM alacsony kockázat/);
});

test("az eldönthetetlen rizikó MEGNEVEZI, mi hiányzik és mekkora a tét", () => {
  const st = put(blank(), [["ctx.pregnant", "pos"], ["ctx.lmp", GA24]]);
  const p = CARE.plan(REG, st, P);
  const mc = p.undetermined.find((u) => u.modifier === "mod.multiple.mc")!;
  assert.deepEqual(mc.missing, ["ctx.multiple"]);
  assert.equal(mc.wouldAdd, 10);
});

test("a teljesen kitöltött alacsony kockázatú eset NEM előzetes", () => {
  const p = CARE.plan(REG, lowRisk(), P);
  assert.equal(p.provisional, false);
  assert.deepEqual(p.undetermined, []);
});

test("az eldönthetetlen VAGY-feltétel is nyitva marad", () => {
  // dm1 negatív, dm2 nincs rögzítve: a cukorbetegség kérdése NEM eldöntött.
  const st = put(blank(), [
    ...LOW.filter(([k]) => k !== "hx.sys.dm2"), ["hx.sys.dm1", "neg"],
  ]);
  const p = CARE.plan(REG, st, P);
  assert.ok(p.undetermined.some((u) => u.modifier === "mod.dm.pregestational"));
});

test("ha a terhesség ténye sem ismert, a protokoll alkalmazhatósága nyitott", () => {
  const p = CARE.plan(REG, blank(), P);
  assert.equal(p.applicable, false);
  assert.equal(p.provisional, true);
  assert.match(p.caveat, /NEM azt jelenti, hogy nem vonatkozik/);
});

/* ── 3. A JOGSZABÁLYI ALAP PADLÓ ────────────────────────────────────── */

test("a rizikó SŰRÍT, de soha nem ritkít: minden alapvizit megmarad", () => {
  const base = CARE.get(P)!.base.map((v) => v.id).sort();
  for (const st of [lowRisk(), twinHtn(), blank()]) {
    const p = CARE.plan(REG, st, P);
    if (!p.applicable) continue;
    const got = p.visits.filter((v) => v.origin === "protocol").map((v) => v.id).sort();
    assert.deepEqual(got, base);
  }
});

test("a módosítónak nincs módja vizitet elvenni — a szerkezet nem engedi", () => {
  for (const m of CARE.get(P)!.modifiers) {
    assert.ok(m.adds.length > 0);
    assert.ok(!("removes" in m), `${m.id}: a szerkezet nem ismerhet elvételt`);
  }
});

/* ── 4. TERVEZÉSRE IGEN, VÁDOLÁSRA NEM ──────────────────────────────── */

test("ellenőrizetlen alaptáblával nem állapítható meg elmulasztott vizit", () => {
  const p = CARE.plan(REG, lowRisk(), P);
  assert.equal(p.protocol.verification, "assumed");
  assert.equal(p.canAssertMissed, false);
  assert.match(p.caveat, /elmulasztott vizit megállapítására NEM/);
});

test("a protokollnak VERZIÓJA van — enélkül a retrospektív adat értelmezhetetlen", () => {
  const p = CARE.plan(REG, lowRisk(), P);
  assert.ok(p.protocol.version.length > 0);
  assert.ok(p.protocol.source.includes("26/2014"));
});

test("a vizitek állapota a gesztációs korhoz képest — és ismeretlen, ha nincs GA", () => {
  const p = CARE.plan(REG, lowRisk(), P);   // ctx.ga = 24
  assert.equal(p.visits.find((v) => v.id === "v.01")!.status, "past");
  assert.equal(p.visits.find((v) => v.id === "v.04")!.status, "due");
  assert.equal(p.visits.find((v) => v.id === "v.09")!.status, "upcoming");
});

/* ── 5. KONZÍLIUM-JAVALLATOK ────────────────────────────────────────── */

test("a javallat a rögzített adatból következik, forrással és indoklással", () => {
  const st = put(blank(), [["hx.sys.dm1", "pos"]]);
  const c = CONSULTS.evaluate(REG, st, "cons.diabetology");
  assert.equal(c.status, "indicated");
  assert.ok(c.source.includes("NICE NG3"));
  assert.ok(c.why.length > 30);
});

test("a hiányzó adat NEM „nem javallt”", () => {
  const c = CONSULTS.evaluate(REG, blank(), "cons.diabetology");
  assert.equal(c.status, "unknown");
  assert.deepEqual(c.missing, ["hx.sys.dm1", "hx.sys.dm2"]);
  assert.match(c.why, /nem tudjuk/);
});

test("a negatív anamnézis viszont eldönti: nem javallt", () => {
  const st = put(blank(), [["hx.sys.dm1", "neg"], ["hx.sys.dm2", "neg"]]);
  assert.equal(CONSULTS.evaluate(REG, st, "cons.diabetology").status, "notIndicated");
});

test("a SÜRGŐS javallat a lista élén áll", () => {
  const st = put(blank(), [["psy.ppp.risk", "high"], ["hx.sys.dm1", "pos"]]);
  const list = CONSULTS.list(REG, st).filter((c) => c.status !== "notIndicated");
  assert.equal(list[0].id, "cons.psychiatry.ppp");
  assert.equal(list[0].status, "urgent");
});

test("a rendszer JAVALLATOT állít fel, konzíliumot nem KÉR — a kettő külön esemény", () => {
  const st = put(blank(), [["hx.sys.dm1", "pos"]]);
  assert.equal(CONSULTS.evaluate(REG, st, "cons.diabetology").status, "indicated");
  const st2 = setValue(REG, st, "plan.consult.requested", ["diabetology"]);
  assert.equal(CONSULTS.evaluate(REG, st2, "cons.diabetology").status, "requested");
});

test("az elutasított javallat INDOKLÁSSAL zárul le, anélkül nyitva marad", () => {
  const st = put(blank(), [["hx.sys.dm1", "pos"]]);
  assert.equal(CONSULTS.open(REG, st).length, 1);
  const st2 = setValue(REG, st, "plan.consult.declined",
    "A beteg a saját diabetológusánál gondozott, a lelet csatolva.");
  assert.equal(CONSULTS.open(REG, st2).length, 0);
});

/* ── 6. SZÜLÉSMÓD: A RENDSZER NEM DÖNT ──────────────────────────────── */

test("javaslat SOHA nem születik — ez állítás, nem hiányosság", () => {
  const st = put(blank(), [["hx.repro.prevBirth.cs", 1]]);
  const d = deliveryPlan(REG, st);
  assert.equal(d.recommendation, null);
  assert.match(d.caveat, /nem szakmai fölény van, hanem kockázatcsere/);
});

test("mindkét út megjelenik, az elektív császármetszés kockázataival együtt", () => {
  const st = put(blank(), [["hx.repro.prevBirth.cs", 1], ["plan.institution.tolacCapable", "pos"]]);
  const d = deliveryPlan(REG, st);
  assert.deepEqual(d.options.map((o) => o.mode), ["tolac", "electiveCs"]);
  assert.equal(d.options[0].offerability, "conditional");
  assert.match(d.options[1].why, /KÖVETKEZŐ terhességet/);
});

test("intézményi feltételek nélkül a TOLAC nem ajánlható fel", () => {
  const st = put(blank(), [["hx.repro.prevBirth.cs", 1], ["plan.institution.tolacCapable", "neg"]]);
  const d = deliveryPlan(REG, st);
  assert.equal(d.options[0].offerability, "contraindicated");
  assert.match(d.options[0].why, /megfelelő intézménybe irányítást jelent/);
});

test("a „nem tudjuk” NEM jelenti azt, hogy a feltételek adottak", () => {
  const st = put(blank(), [["hx.repro.prevBirth.cs", 1]]);
  const d = deliveryPlan(REG, st);
  assert.equal(d.options[0].offerability, "unknown");
  assert.match(d.options[0].why, /kockázat áthárítása/);
});

test("a klasszikus uterotomia ELLENJAVALLAT — ez tény, nem esélykérdés", () => {
  const st = put(blank(), [
    ["hx.repro.prevBirth.cs", 1], ["plan.institution.tolacCapable", "pos"],
    ["op.cs.uterotomy", "classical"],
  ]);
  const d = deliveryPlan(REG, st);
  assert.equal(d.options[0].offerability, "contraindicated");
  assert.match(d.options[0].why, /NEM esélykérdés/);
});

test("százalékos VBAC-esély nem készül, és az ok ki van mondva", () => {
  const d = deliveryPlan(REG, put(blank(), [["hx.repro.prevBirth.cs", 1]]));
  assert.match(d.vbac.noProbability, /Százalékos esély NEM készül/);
});

/* ── 7. A KAPU: A BESZÉLGETÉS, NEM A DÖNTÉS ─────────────────────────── */

test("a szülésmód-terv nem zárható le a megosztott döntéshozatal nélkül", () => {
  const d = deliveryPlan(REG, put(blank(), [["hx.repro.prevBirth.cs", 1]]));
  assert.equal(d.decision.canRecord, false);
  assert.deepEqual(d.decision.missing, [
    "plan.delivery.sharedDecision", "plan.delivery.optionsDiscussed",
    "plan.delivery.patientPreference",
  ]);
});

test("a pipa önmagában NEM elég: a lehetőségek és a preferencia is kell", () => {
  const st = put(blank(), [
    ["hx.repro.prevBirth.cs", 1], ["plan.delivery.sharedDecision", true],
  ]);
  const d = deliveryPlan(REG, st);
  assert.equal(d.decision.documented, true);
  assert.equal(d.decision.canRecord, false);
  assert.match(d.decision.reason, /nem döntés/);
});

test("mindhárommal a terv lezárható", () => {
  const st = put(blank(), [
    ["hx.repro.prevBirth.cs", 1], ["plan.delivery.sharedDecision", true],
    ["plan.delivery.optionsDiscussed",
      "TOLAC és elektív ismételt császármetszés, a méhrepedés és a műtéti szövődmények kockázatával."],
    ["plan.delivery.patientPreference", "vaginal"],
  ]);
  const d = deliveryPlan(REG, st);
  assert.equal(d.decision.canRecord, true);
  assert.equal(d.preference.value, "vaginal");
});

test("a beteg preferenciája ÖNÁLLÓ mező, nem a javaslat másolata", () => {
  const def = REG.get("plan.delivery.patientPreference")!;
  assert.match(def.documentation!.pitfalls!.hu!, /NEM szabad a szakmai javaslattal kitölteni/);
});

/* ── 8. A TERV ÉS A VALÓSÁG ─────────────────────────────────────────── */

test("a megbeszélt időpont külön mező, és az eltérés indoklást kíván", () => {
  assert.ok(REG.get("plan.nextVisit.at"));
  assert.ok(REG.get("plan.nextVisit.rationale"));
  assert.match(REG.get("plan.nextVisit.at")!.documentation!.pitfalls!.hu!,
    /nem a protokoll szerint esedékes/);
});

test("a korábbi császármetszés szülésmód-tervező vizitet nyit a 36. hétre", () => {
  const st = put(blank(), [...LOW.filter(([k]) => k !== "hx.repro.prevBirth.cs"),
    ["hx.repro.prevBirth.cs", 1]]);
  const p = CARE.plan(REG, st, P);
  const v = p.visits.find((x) => x.id === "v.cs.36")!;
  assert.equal(v.origin, "modifier");
  assert.match(v.content.join(" | "), /megosztott döntéshozatal/);
});
