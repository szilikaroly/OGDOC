/**
 * A DÁTUM-KIMENETŰ KALKULÁTOR DÁTUMOT AD — mindenhol ugyanazt.
 *
 * A várható szülési időpont (Naegele) a képernyőn „1795132800000” volt: a
 * kalkulátor epoch-ezredmásodpercet adott, a zárójelentés ezt ISO-dátummá
 * formázta, a webes nézet és a levezetett mező nem. Ugyanaz a tény három
 * helyen, kétféle alakban. Most a kalkulátor-réteg adja a megjelenítési és a
 * tárolási alakot is, és minden fogyasztó azt használja.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { runCalc } from "../core/calc/run.ts";
import { caseView } from "../web/api.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const NOW = "2026-09-11T10:00:00.000Z";

function eset(): CaseState {
  let s: CaseState = { ctx: { encounter: "ambulatory", pathway: "prenatal", now: NOW }, values: {}, errors: [] };
  s = setValue(REG, s, "ctx.pregnant", "pos" as never);
  s = setValue(REG, s, "ctx.lmp", "2026-02-13" as never);
  return recompute(REG, s);
}

test("a Naegele-kalkulátor megjelenítési alakja ISO-dátum, nem epoch-szám", () => {
  const r = runCalc(REG, eset(), "calc.edd.naegele");
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.equal(r.display, "2026-11-20");
  assert.equal(r.stored, "2026-11-20");
});

test("a levezetett ctx.edd a tárolóban dátum — a saját datatype-ja szerint", () => {
  const s = eset();
  const v = s.values["ctx.edd"]?.[0]?.value;
  assert.equal(v, "2026-11-20", "a dátum-változóban epoch-szám volt");
});

test("a webes nézet a mezőben és a kalkulátorpanelen is a dátumot mutatja", () => {
  const v = caseView(REG, eset(), "hu");
  assert.equal(v.values.find((x) => x.id === "ctx.edd")?.value, "2026-11-20");
  const c = v.calc.find((x) => x.id === "calc.edd.naegele");
  assert.equal(c?.status, "ok");
  assert.equal(c?.display, "2026-11-20");
});

test("a dátum-kimenet dátum-bemenetként újra olvasható (nem NaN)", () => {
  // A ctx.edd-re épülő kalkulátor bemenete: a Date.parse a számból NaN-t adott
  // volna. Itt a resolve-olt értéket olvassuk vissza úgy, ahogy a runner tenné.
  const s = eset();
  const ms = Date.parse(String(s.values["ctx.edd"]?.[0]?.value));
  assert.ok(Number.isFinite(ms));
});
