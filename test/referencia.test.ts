/**
 * A kontextusfüggő referenciatartomány tesztjei.
 *
 * Az itt bizonyított állítás egyetlen mondat: **a nem terhes tartomány nem
 * alapértelmezés.** Egy terhes beteg leletét a nem terhes sáv szerint olvasva
 * hol fölöslegesen riasztunk, hol elengedünk egy valódi eltérést — és
 * egyikről sem derül ki, hogy megtörtént.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { contextOf, interpret, referenceFor, trimester } from "../core/lab/reference.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));

const NOW = "2026-09-01T12:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
/** Terhes eset adott gesztációs korral — a GA levezetett, az LMP-t írjuk. */
function pregnantAt(weeks: number): CaseState {
  const lmpMs = Date.parse(NOW) - weeks * 7 * 86_400_000;
  let st = setValue(REG, blank(), "ctx.pregnant", "pos");
  st = setValue(REG, st, "ctx.lmp", new Date(lmpMs).toISOString().slice(0, 10));
  return recompute(REG, st);
}
function notPregnant(): CaseState {
  return setValue(REG, blank(), "ctx.pregnant", "neg");
}

/* ── 1. A trimeszterhatárok ──────────────────────────────────────────── */

test("a trimeszterhatárok a 14. és a 28. héten vannak", () => {
  assert.equal(trimester(13.9), "pregnancy.t1");
  assert.equal(trimester(14), "pregnancy.t2");
  assert.equal(trimester(27.9), "pregnancy.t2");
  assert.equal(trimester(28), "pregnancy.t3");
});

/* ── 2. A hiányzó terhességi állapot NEM „nem terhes” ────────────────── */

test("ismeretlen terhességi állapotnál nincs referenciatartomány", () => {
  const r = referenceFor(REG, blank(), "lab.plt");
  assert.equal(r.status, "unavailable");
  assert.deepEqual(r.status === "unavailable" ? r.missing : [], ["ctx.pregnant"]);
  assert.match(r.status === "unavailable" ? r.reason : "", /NEM alapértelmezés/);
});

test("a „nem tudom” válasz sem alapértelmez", () => {
  const st = setValue(REG, blank(), "ctx.pregnant", "unk");
  assert.equal(referenceFor(REG, st, "lab.plt").status, "unavailable");
});

test("a kontextus kiválasztása a terhességi állapotból és a hétből jön", () => {
  assert.equal(contextOf(REG, notPregnant()), "nonpregnant");
  assert.equal(contextOf(REG, pregnantAt(10)), "pregnancy.t1");
  assert.equal(contextOf(REG, pregnantAt(20)), "pregnancy.t2");
  assert.equal(contextOf(REG, pregnantAt(34)), "pregnancy.t3");
});

/* ── 3. Ugyanaz a szám, más olvasat ──────────────────────────────────── */

test("egy alkalikus foszfatáz a 3. trimeszterben normális, nem terhesen kóros", () => {
  const VALUE = 180;   // U/L
  const preg = setValue(REG, pregnantAt(34), "lab.alp", VALUE);
  const non = setValue(REG, notPregnant(), "lab.alp", VALUE);

  const a = interpret(REG, preg, "lab.alp");
  const b = interpret(REG, non, "lab.alp");
  assert.equal(a.status === "ok" && a.reading, "normal");
  assert.equal(b.status === "ok" && b.reading, "high");
});

test("a fibrinogén a terhesség végén más sávban van — ezért magasabb a MTP-küszöb", () => {
  const VALUE = 2.5;   // g/L
  const preg = setValue(REG, pregnantAt(36), "lab.fibrinogen", VALUE);
  const non = setValue(REG, notPregnant(), "lab.fibrinogen", VALUE);
  assert.equal((interpret(REG, preg, "lab.fibrinogen") as { reading: string }).reading, "low");
  assert.equal((interpret(REG, non, "lab.fibrinogen") as { reading: string }).reading, "normal");
});

/* ── 4. Ismeretlen trimeszter: akkor válaszolunk, ha mindegy ─────────── */

test("ha minden trimeszter szerint ugyanaz az olvasat, a hét ismerete nem kell", () => {
  // 30 × 10⁹/L thrombocyta MINDEN terhességi sávban alacsony.
  let st = setValue(REG, blank(), "ctx.pregnant", "pos");   // GA nincs
  st = setValue(REG, st, "lab.plt", 30);
  const r = interpret(REG, st, "lab.plt");
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" && r.reading, "low");
  assert.equal(r.status === "ok" && r.agreedAcrossTrimesters, true);
});

test("ha a trimeszterek szerint ELTÉRNE, nem találgatunk", () => {
  // 150 × 10⁹/L: az egyik sávban alacsony, a másikban normális.
  let st = setValue(REG, blank(), "ctx.pregnant", "pos");
  st = setValue(REG, st, "lab.plt", 150);
  const r = interpret(REG, st, "lab.plt");
  assert.equal(r.status, "unknown");
  assert.deepEqual(r.status === "unknown" ? r.missing : [], ["ctx.ga"]);
  assert.match(r.status === "unknown" ? r.reason : "", /eltérne/);
});

/* ── 5. A forrás mindig ott van az olvasat mellett ───────────────────── */

test("az olvasat megnevezi a forrást és annak ellenőrzöttségét", () => {
  const st = setValue(REG, pregnantAt(30), "lab.plt", 200);
  const r = interpret(REG, st, "lab.plt");
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.match(r.source.cite, /Abbassi-Ghanavati/);
  assert.ok(["primary", "secondary", "assumed"].includes(r.verification));
});

/* ── 6. Hiányzó és lejárt érték ──────────────────────────────────────── */

test("nem rögzített értékből nincs olvasat", () => {
  const r = interpret(REG, pregnantAt(20), "lab.plt");
  assert.equal(r.status, "unknown");
  assert.deepEqual(r.status === "unknown" ? r.missing : [], ["lab.plt"]);
});

test("lejárt érték nem kap olvasatot — a régi labor nem a mai állapot", () => {
  let st = setValue(REG, pregnantAt(20), "lab.plt", 200, { t: "2026-01-01T08:00:00Z" });
  const r = interpret(REG, st, "lab.plt");
  assert.equal(r.status, "unknown");
  assert.match(r.status === "unknown" ? r.reason : "", /lejárt/);
});

/* ── 7. Regiszter-szintű állítások ───────────────────────────────────── */

test("minden referenciakészlet megnevezi a forrását", () => {
  for (const d of REG.all()) {
    if (!d.reference) continue;
    assert.ok(d.reference.source.cite, `${d.id}: nincs forrás`);
  }
});

test("ahol van terhességi referencia, mind a három trimeszter szerepel", () => {
  const PREG = ["pregnancy.t1", "pregnancy.t2", "pregnancy.t3"];
  for (const d of REG.all()) {
    const ctxs = (d.reference?.ranges ?? []).map((r) => r.context);
    const some = PREG.filter((c) => ctxs.includes(c));
    if (!some.length) continue;
    assert.equal(some.length, 3,
      `${d.id}: részleges terhességi referencia (${some.join(", ")})`);
  }
});
