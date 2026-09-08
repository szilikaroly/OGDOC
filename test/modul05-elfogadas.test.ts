/**
 * A 05. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/05-vizsgalatok.md`:
 *
 *   „Egy preeclampsia-eset végigvihető úgy, hogy a fullPIERS a laborból és a
 *    vitálisokból magától feltöltődik, és ha az AST hiányzik, `insufficient`-et
 *    ír ki a hiányzó mező megnevezésével — nem nullát. Az ultrahang-normogram
 *    publikációból betölthető, és a betöltött referencia forrása a leleten
 *    megjelenik."
 *
 * Az elfogadási kritérium ígéretként semmit nem ér. Tesztként azt jelenti,
 * hogy a modul nem tud úgy változni, hogy ez elromoljon.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadNormograms } from "../core/us/normogram.ts";
import { loadScreenings } from "../core/screening/registry.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { fullPiers, FULLPIERS_INPUTS } from "../core/scores/fullpiers.ts";
import { interpret } from "../core/lab/reference.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const NG = loadNormograms(join(HERE, "..", "registry", "normogramok"));
const SCR = loadScreenings(join(HERE, "..", "registry", "szuresek"));

const NOW = "2026-09-01T12:00:00Z";

/**
 * Szintetikus eset: 32. héten súlyos praeeclampsia gyanúja.
 * MINDEN adat kitalált — a tárolóban beteg-azonosítható adat nem lehet.
 */
function severePreeclampsia(opts: { withAst?: boolean } = {}): CaseState {
  const lmp = new Date(Date.parse(NOW) - 32 * 7 * 86_400_000).toISOString().slice(0, 10);
  let st: CaseState = { ctx: { encounter: "emergency", now: NOW }, values: {}, errors: [] };
  st = setValue(REG, st, "ctx.pregnant", "pos");
  st = setValue(REG, st, "ctx.lmp", lmp);
  st = setValue(REG, st, "vitals.bp.systolic", 168);
  st = setValue(REG, st, "vitals.bp.diastolic", 112);
  st = setValue(REG, st, "vitals.spo2", 94);
  st = setValue(REG, st, "sym.chestPainDyspnea", true);
  st = setValue(REG, st, "lab.plt", 84);
  st = setValue(REG, st, "lab.cr", 96);
  st = setValue(REG, st, "lab.urine.protein", "plus3");
  if (opts.withAst !== false) st = setValue(REG, st, "lab.ast", 142);
  return recompute(REG, st);
}

/* ── 1. A score a rögzített adatokból áll össze, nem külön bevitelből ── */

test("a fullPIERS minden bemenete a laborból és a vitálisokból jön", () => {
  const st = severePreeclampsia();
  for (const id of Object.values(FULLPIERS_INPUTS)) {
    assert.ok(REG.get(id), `${id} nincs a regiszterben`);
    const vals = st.values[REG.resolvePrimary(id)] ?? [];
    assert.ok(vals.length, `${id} nem töltődött fel magától`);
  }
});

/* ── 2. Hiányzó AST → insufficient, MEGNEVEZVE — nem nulla ───────────── */

test("hiányzó AST mellett a score nem számol, és megmondja, mi hiányzik", () => {
  const r = fullPiers(REG, severePreeclampsia({ withAst: false }));
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("lab.ast"));
  assert.equal((r as { value?: number }).value, undefined, "nincs szám, és nincs nulla sem");
});

test("teljes bemenettel is kapu mögött van, amíg az együtthatók nincsenek ellenőrizve", () => {
  const r = fullPiers(REG, severePreeclampsia());
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /együttható|visszaellenőriz/i);
});

/* ── 3. A labor olvasata a TERHESSÉGI sávból jön ─────────────────────── */

test("a 84-es thrombocyta a 3. trimeszteri sáv szerint is alacsony", () => {
  const r = interpret(REG, severePreeclampsia(), "lab.plt");
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" && r.reading, "low");
  assert.equal(r.status === "ok" && r.context, "pregnancy.t3");
});

test("az olvasat mellett ott a forrás — enélkül a szám összehasonlíthatatlan", () => {
  const r = interpret(REG, severePreeclampsia(), "lab.ast");
  assert.equal(r.status, "ok");
  assert.ok(r.status === "ok" && r.source.cite.length > 20);
});

/* ── 4. A normogram publikációból töltődik, a forrás a leleten van ───── */

test("a betöltött normogram megnevezi a közleményt és a populációt", () => {
  assert.ok(NG.all().length >= 1, "van betöltött normogram");
  for (const n of NG.all()) {
    assert.ok(n.source.cite.length > 20, `${n.id}: nincs érdemi forrás`);
    assert.ok(n.population, `${n.id}: nincs megadva, mely populációra vonatkozik`);
    // A személyre szabott normogramnak nincs saját táblája: alapot igazít.
    if (n.kind !== "customised") {
      assert.ok((n.rows ?? []).length >= 2, `${n.id}: nem interpolálható`);
    }
  }
});

test("a percentilis EREDMÉNYE is hordozza a forrást", () => {
  // A regiszterbeli tábla szándékosan `assumed` — ezért itt a kapu válaszol.
  const st = setValue(REG, severePreeclampsia(), "us.ac", 250);
  const r = NG.evaluate(REG, st, "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "insufficient",
    "ellenőrizetlen táblából nem születik percentilis");
  assert.match(r.status === "insufficient" ? r.reason : "", /Chitty/,
    "de a forrás akkor is megjelenik, amikor a kapu zár");
});

/* ── 5. A gondozási oldal: mi esedékes ebben az esetben ──────────────── */

test("a 32. héten a GBS még nem, a morfológiai vizsgálat már elmulasztott", () => {
  const st = severePreeclampsia();
  assert.equal(SCR.evaluate(REG, st, "scr.gbs").status, "upcoming");
  assert.equal(SCR.evaluate(REG, st, "scr.anatomy.secondTrimester").status, "overdue");
});

test("a teendőlista minden sora megindokolja magát", () => {
  for (const s of SCR.dueList(REG, severePreeclampsia())) {
    assert.ok(s.why.length > 0, `${s.id}: nincs indoklás`);
    assert.ok(s.source.cite.length > 10, `${s.id}: nincs forrás`);
  }
});
