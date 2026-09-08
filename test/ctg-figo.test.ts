/**
 * A CTG MÁSODIK OLVASATA — nem osztályozás, hanem egyet nem értés.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { setValue } from "../core/derive/engine.ts";
import { egyezes, loadFigo, szarmaztat, validateFigo } from "../core/ctg/figo.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const K = () => loadFigo(join(HERE, "..", "registry", "ctg", "figo2015.json"));

const NOW = "2026-09-08T10:00:00Z";
const blank = (): CaseState =>
  ({ ctx: { encounter: "inpatient", now: NOW }, values: {}, errors: [] });

function gorbe(v: Record<string, unknown>): CaseState {
  let st = blank();
  for (const [k, x] of Object.entries(v)) st = setValue(REG, st, k, x);
  return st;
}
const NORMAL = { "ctg.baseline": 140, "ctg.variability": "normal", "ctg.decel": "none" };

test("a készlet hiba nélkül validál, de ALÁÍRATLAN", () => {
  const i = validateFigo(K(), REG);
  assert.equal(i.filter((x) => x.severity === "error").length, 0);
  assert.equal(i.filter((x) => x.id === "figo.hitelesites").length, 1);
});

test("a három jellemző mostantól LÉTEZIK — enélkül a besorolás visszakövethetetlen", () => {
  for (const id of ["ctg.baseline", "ctg.variability", "ctg.decel"]) {
    assert.ok(REG.get(id), `${id}: a besorolás alapja nem lehet hiányzó mező`);
  }
});

test("normál görbe: a két olvasat egyezik", () => {
  const st = gorbe({ ...NORMAL, "ctg.category": "normal" });
  const e = egyezes(K(), REG, st);
  assert.equal(e.allapot, "egyezik");
});

test("A CSÖKKENT VARIABILITÁS ÖNMAGÁBAN KÓROS — lassulás nélkül is", () => {
  const st = gorbe({ ...NORMAL, "ctg.variability": "reduced" });
  const sz = szarmaztat(K(), REG, st);
  assert.equal(sz.kod, "pathological");
  assert.match(sz.indokok.join(" "), /ÖNMAGÁBAN kóros/);
});

test("AZ ELTÉRÉS A JEL — de nem felülbírálás", () => {
  // Kóros jellemzők, a klinikus mégis normálnak minősítette.
  const st = gorbe({ "ctg.baseline": 95, "ctg.variability": "normal",
    "ctg.decel": "none", "ctg.category": "normal" });
  const e = egyezes(K(), REG, st);
  assert.equal(e.allapot, "elter");
  assert.equal(e.klinikusi, "normal");
  assert.equal(e.szarmaztatott, "pathological");
  assert.match(e.miert, /NEM\s+felülbírálás, hanem kérdés/);
});

test("A HIÁNYZÓ JELLEMZŐ NEM „NORMÁLIS”", () => {
  const st = gorbe({ "ctg.baseline": 140, "ctg.decel": "none", "ctg.category": "normal" });
  const e = egyezes(K(), REG, st);
  assert.equal(e.allapot, "nemSzarmaztathato");
  assert.deepEqual(e.hianyzo, ["ctg.variability"]);
  assert.match(e.miert, /NEM VISSZAKÖVETHETŐ/);
  assert.match(e.miert, /a megerősítés marad el, nem az eltérés/);
});

test("a súlyosabb besorolás nyer: kóros jellemző mellett a gyanús nem elég", () => {
  const st = gorbe({ "ctg.baseline": 170, "ctg.variability": "absent", "ctg.decel": "none" });
  assert.equal(szarmaztat(K(), REG, st).kod, "pathological",
    "a 170-es alapvonal gyanús, a hiányzó variabilitás viszont kóros");
});

test("az ISMÉTLŐDŐSÉG dönt, nem a lassulás jelenléte", () => {
  const nem = gorbe({ ...NORMAL, "ctg.decel": "variable" });
  const igen = gorbe({ ...NORMAL, "ctg.decel": "variableRepetitive" });
  assert.equal(szarmaztat(K(), REG, nem).kod, "normal");
  assert.equal(szarmaztat(K(), REG, igen).kod, "suspicious");
});

test("PRETERMINÁLIS görbére a modul HALLGAT", () => {
  const st = gorbe({ ...NORMAL, "ctg.category": "preterminal" });
  const e = egyezes(K(), REG, st);
  assert.equal(e.allapot, "egyezik");
  assert.match(e.miert, /nem képez második olvasatot/);
});

test("klinikusi besorolás nélkül a származtatás NEM besorolás", () => {
  const e = egyezes(K(), REG, gorbe(NORMAL));
  assert.equal(e.allapot, "nincsBesorolas");
  assert.match(e.miert, /nem osztályoz a klinikus\s+helyett/);
});

test("olyan szabály, ami nem jellemzőre hivatkozik: HIBA", () => {
  const k = K();
  k.besorolasok[0].barmelyik![0].var = "ctg.accel";
  const h = validateFigo(k, REG).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /a hiányt „nem teljesül”-ként olvasná/);
});

test("azonos rangú besorolás: HIBA — a betöltési sorrend nem szabály", () => {
  const k = K();
  k.besorolasok[1].rang = k.besorolasok[0].rang;
  const h = validateFigo(k, REG).filter((i) => i.id === "figo.rang");
  assert.equal(h.length, 1);
});
