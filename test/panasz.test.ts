/**
 * A panaszmodul és a példány-dimenzió tesztjei.
 *
 * Két dolgot bizonyítanak, amiért ez a réteg egyáltalán létezik:
 *   1. a beteg SAJÁT SZAVAIVAL rá lehet találni a kódolt tételre;
 *   2. egy panasz jellemzői nem folynak át egy másik panaszba, pedig a
 *      mezők egyetlen példányban vannak definiálva.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadComplaints } from "../core/complaints/registry.ts";
import { recompute, resolve, scopesOf, setValue, usable } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const DICT = loadComplaints(join(HERE, "..", "registry", "complaints"));

const NOW = "2026-09-01T12:00:00Z";
function blank(encounter = "ambulatory"): CaseState {
  return { ctx: { encounter, now: NOW }, values: {}, errors: [] };
}
/** Két panasszal induló eset — a névsor nélkül semmilyen jellemző nem rögzíthető. */
function withComplaints(...ids: string[]): CaseState {
  return setValue(REG, blank(), "compl.active", ids, { provenance: "patient" });
}

/* ── 1. A szótár integritása ─────────────────────────────────────────── */

test("a panaszszótár hiba nélkül validál a regiszter ellen", () => {
  const errors = DICT.validate(REG).filter((i) => i.severity === "error");
  assert.deepEqual(errors, []);
});

test("minden panasztétel `asks` listája létező mezőkre mutat", () => {
  for (const t of DICT.all()) {
    for (const a of t.asks ?? []) {
      assert.ok(REG.get(a), `${t.id} → ${a}`);
    }
  }
});

/* ── 2. A keresés: a beteg szavaiból a kódolt tételre ────────────────── */

test("a beteg saját megfogalmazása megtalálja a tételt", () => {
  const hits = DICT.search("szúr a hasam alul jobb oldalt");
  assert.equal(hits[0].term.id, "compl.pain.abdomen.rlq");
});

test("a keresés ékezet nélkül és kisbetűvel is talál", () => {
  const a = DICT.search("KEVESEBBET MOZOG A BABA")[0];
  const b = DICT.search("kevesebbet mozog a baba")[0];
  assert.equal(a.term.id, "compl.fetal.reducedMovement");
  assert.equal(b.term.id, a.term.id);
});

test("a részleges gépelés is talál, és a találat megmondja, MI talált", () => {
  const hits = DICT.search("elfolyt");
  assert.equal(hits[0].term.id, "compl.obs.fluidLeak");
  assert.match(hits[0].matched, /elfolyt a magzatvizem/);
});

test("az ellátási útvonal szűkíti a találatot — ugyanaz a mondat máshova mutat", () => {
  const preg = DICT.search("lázas vagyok", 10, "prenatal");
  const gyn = DICT.search("lázas vagyok", 10, "gynecology");
  assert.equal(preg[0].term.id, "compl.obs.fever");
  assert.equal(gyn[0].term.id, "compl.gen.fever");
});

test("tíz életszerű megfogalmazásból legalább nyolc az első három találat között van", () => {
  // A modul elfogadási kritériuma (docs/modulok/01-panaszok.md, 6. pont).
  const CASES: Array<[string, string]> = [
    ["szúr a hasam alul jobb oldalt", "compl.pain.abdomen.rlq"],
    ["kevesebbet mozog a baba", "compl.fetal.reducedMovement"],
    ["elfolyt a magzatvizem", "compl.obs.fluidLeak"],
    ["fáj a fejem és villog a szemem", "compl.neuro.headache.visual"],
    ["óránként cserélek betétet", "compl.bleeding.heavy"],
    ["szex után vérzek", "compl.bleeding.postcoital"],
    ["csomót tapintok a mellemben", "compl.breast.lump"],
    ["nem érek ki a WC-re", "compl.uro.incontinence.urge"],
    ["viszket a tenyerem", "compl.obs.itching"],
    ["nem esem teherbe", "compl.fert.infertility"],
  ];
  const found = CASES.filter(([q, want]) =>
    DICT.search(q, 3).some((h) => h.term.id === want));
  assert.ok(found.length >= 8,
    `${found.length}/10 talált — hiányzik: ` +
    CASES.filter(([q, w]) => !DICT.search(q, 3).some((h) => h.term.id === w))
      .map(([q]) => q).join(" | "));
});

/* ── 3. A vörös zászló kontextusfüggő — és a hiányzó adat nem „nem" ──── */

test("a feltétlen vörös zászló kontextus nélkül is szól", () => {
  const r = DICT.redflagState(REG, blank(), "compl.resp.dyspnea");
  assert.equal(r.flag, true);
});

test("a jobb alhasi fájdalom önmagában NEM vörös zászló", () => {
  let st = setValue(REG, blank(), "ctx.pregnant", "neg");
  assert.equal(DICT.redflagState(REG, st, "compl.pain.abdomen.rlq").flag, false);
});

test("ugyanaz a panasz korai terhességben IGEN", () => {
  // A gesztációs kor LEVEZETETT: az utolsó menstruációt írjuk, nem a hetet.
  let st = setValue(REG, blank(), "ctx.pregnant", "pos");
  st = recompute(REG, setValue(REG, st, "ctx.lmp", "2026-07-08"));
  assert.ok((usable(REG, st, "ctx.ga") as number) < 12, "nyolc hét körül járunk");
  assert.equal(DICT.redflagState(REG, st, "compl.pain.abdomen.rlq").flag, true);
});

test("hiányzó kontextusnál a válasz `unknown`, NEM „nem vörös zászló”", () => {
  const st = setValue(REG, blank(), "ctx.pregnant", "pos");   // a GA hiányzik
  const r = DICT.redflagState(REG, st, "compl.pain.abdomen.rlq");
  assert.equal(r.flag, "unknown");
  assert.ok(r.why.some((w) => w.includes("nincs adat")));
});

/* ── 4. A példány-dimenzió: egy mező, sok panasz ─────────────────────── */

test("panasz-jellemző csak a névsorban szereplő panaszra rögzíthető", () => {
  assert.throws(
    () => setValue(REG, blank(), "compl.q.severity", 7,
      { scope: "compl.pain.abdomen.rlq", provenance: "patient" }),
    /nincs a névsorban/,
  );
});

test("példányosított mező scope nélkül nem írható", () => {
  const st = withComplaints("compl.pain.abdomen.rlq");
  assert.throws(() => setValue(REG, st, "compl.q.severity", 7), /scope nélkül nem írható/);
});

test("nem példányosított mezőre scope nem adható meg", () => {
  assert.throws(
    () => setValue(REG, blank(), "ctx.pregnant", "pos", { scope: "compl.pain.abdomen.rlq" }),
    /nem példányosított mező/,
  );
});

test("két panasz jellemzői nem folynak egymásba", () => {
  let st = withComplaints("compl.pain.abdomen.rlq", "compl.gen.headache");
  st = setValue(REG, st, "compl.q.severity", 8,
    { scope: "compl.pain.abdomen.rlq", provenance: "patient" });
  st = setValue(REG, st, "compl.q.severity", 3,
    { scope: "compl.gen.headache", provenance: "patient" });

  assert.equal(resolve(REG, st, "compl.q.severity", "compl.pain.abdomen.rlq").value, 8);
  assert.equal(resolve(REG, st, "compl.q.severity", "compl.gen.headache").value, 3);
  // scope nélkül nincs értelmes válasz — nincs olyan, hogy „az erősség"
  assert.equal(resolve(REG, st, "compl.q.severity").state, "missing");
  assert.deepEqual(scopesOf(REG, st, "compl.q.severity"),
    ["compl.pain.abdomen.rlq", "compl.gen.headache"]);
});

test("a példányon belül is érvényes a precedencia és a javítás", () => {
  let st = withComplaints("compl.pain.abdomen.rlq");
  const S = { scope: "compl.pain.abdomen.rlq" };
  st = setValue(REG, st, "compl.q.severity", 8, { ...S, provenance: "patient" });
  st = setValue(REG, st, "compl.q.severity", 5, { ...S, provenance: "clinician" });
  const r = resolve(REG, st, "compl.q.severity", "compl.pain.abdomen.rlq");
  assert.equal(r.value, 5);
  assert.equal(r.provenance, "clinician");
});

test("a névsor csak a szótárból vett kódot fogad el", () => {
  assert.throws(
    () => setValue(REG, blank(), "compl.active", ["compl.nem.letezik"]),
    /ismeretlen kód a listában/,
  );
});

/* ── 5. A szabad szöveg nem vész el ──────────────────────────────────── */

test("a beteg szó szerinti megfogalmazása a kódolt tétel MELLETT él", () => {
  let st = withComplaints("compl.pain.abdomen.rlq");
  st = setValue(REG, st, "compl.verbatim", "szúr a hasam alul jobb oldalt",
    { provenance: "patient" });
  assert.equal(resolve(REG, st, "compl.active").value.toString(), "compl.pain.abdomen.rlq");
  assert.equal(resolve(REG, st, "compl.verbatim").value, "szúr a hasam alul jobb oldalt");
});
