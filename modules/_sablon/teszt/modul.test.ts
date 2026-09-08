/**
 * A modul golden tesztjei.
 *
 * A tesztek a modul SZABÁLYAIRA irányuljanak, ne a mezőire: egy új változó
 * felvétele ne igényeljen új tesztet, egy új szabály igen.
 *
 * Minden adat SZINTETIKUS.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../../../core/load.ts";
import { recompute, resolve, setValue } from "../../../core/derive/engine.ts";
import { validateCalculators } from "../../../core/calc/run.ts";
import type { CaseState } from "../../../core/types.ts";
import "../kalkulatorok/index.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(
  join(HERE, "..", "..", "..", "registry", "variables"),
  join(HERE, "..", "regiszter", "valtozok.json"),
);
const NOW = "2026-01-01T09:00:00Z";
const blank = (encounter = "ambulatory"): CaseState =>
  ({ ctx: { encounter, now: NOW }, values: {}, errors: [] });

test("a modul regisztere hiba nélkül validál", () => {
  assert.deepEqual(REG.validate().filter((i) => i.severity === "error"), []);
});

test("a modul kalkulátorai egyeznek a regiszterrel", () => {
  assert.deepEqual(validateCalculators(REG).filter((i) => i.severity === "error"), []);
});

test("a tartományon kívüli érték nem rögzíthető", () => {
  assert.throws(() => setValue(REG, blank(), "modul.pelda.mennyiseg", 999), /maximum/);
});

test("az anamnesztikus kérdés „nem tudom\" válasza önálló érték", () => {
  const st = recompute(REG, setValue(REG, blank(), "modul.pelda.kerdes", "unk"));
  assert.equal(resolve(REG, st, "modul.pelda.kerdes").value, "unk",
    "a „nem tudom\" rögzül — nem ugyanaz, mint a meg nem kérdezett mező");
});
