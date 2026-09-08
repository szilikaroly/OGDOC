/**
 * GYERMEKNŐGYÓGYÁSZAT — a nőgyógyászat almodulja, más szabályokkal.
 *
 * Amit ezek a tesztek bizonyítanak, az nem az, hogy a modul rögzít.
 * Azt bizonyítják, hogy **megfordítja a rendszer egyik alapszabályát ott,
 * ahol kell**: máshol a meg nem kérdezett kérdés hiány, itt — a bántalmazás
 * mérlegelésénél — maga a hiba.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";
import {
  pubertasIdozites, szakasz, vizsgalatiUt, zaszlok,
} from "../core/gyermek/pedgyn.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const reg = loadRegistry(join(HERE, "..", "registry", "variables"));

const NOW = "2026-09-05T12:00:00Z";

/**
 * A `patient.age` LEVEZETETT mező — kézzel nem írható, és ez nem
 * kellemetlenség: pontosan ez akadályozza meg, hogy egy eset életkora és
 * születési dátuma elcsússzon egymástól. A teszt ezért születési dátumot ír.
 */
function eset(ertekek: Record<string, unknown>): CaseState {
  let s: CaseState = {
    ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [],
  };
  const { "patient.age": kor, ...tobbi } = ertekek;
  if (typeof kor === "number") {
    const sz = new Date(Date.parse(NOW) - Math.round(kor * 365.25) * 86_400_000);
    s = setValue(reg, s, "patient.birthDate", sz.toISOString().slice(0, 10));
  }
  for (const [id, v] of Object.entries(tobbi)) s = setValue(reg, s, id, v);
  return recompute(reg, s);
}

/* ── SZAKASZ ─────────────────────────────────────────────────────────── */

test("a Tanner-stádium erősebb jel az életkornál", () => {
  // 9 éves, de már B4: serdülő, nem prepubertás.
  assert.equal(szakasz(reg, eset({ "patient.age": 9, "status.fert.tanner.breast": 4 })), "serdulo");
  // 13 éves, de még B1: prepubertás.
  assert.equal(szakasz(reg, eset({ "patient.age": 13, "status.fert.tanner.breast": 1 })), "prepubertas");
});

test("adat nélkül a szakasz ISMERETLEN, nem „felnőtt”", () => {
  assert.equal(szakasz(reg, eset({})), "ismeretlen");
});

/* ── A VIZSGÁLAT MÓDJA ───────────────────────────────────────────────── */

test("pubertás előtt a tükrös feltárás nem elfogadható, és a rendszer megmondja, mi helyette", () => {
  const i = vizsgalatiUt("prepubertas", "speculum");
  assert.equal(i.elfogadhato, false);
  assert.equal(i.helyette, "vaginoscopy");
  assert.match(i.miert!, /altatásban|szedálásban/);
});

test("ISMERETLEN szakaszra is fail-closed — a hiányzó adat itt nem „felnőtt”", () => {
  assert.equal(vizsgalatiUt("ismeretlen", "speculum").elfogadhato, false);
  assert.equal(vizsgalatiUt("serdulo", "speculum").elfogadhato, true);
});

test("a megtekintés és a gyermek elutasítása minden szakaszban elfogadható", () => {
  for (const m of ["inspection", "vulvoscopy", "declined", "notNeeded"]) {
    assert.equal(vizsgalatiUt("prepubertas", m).elfogadhato, true, m);
  }
});

/* ── A MEGFORDÍTOTT SZABÁLY ──────────────────────────────────────────── */

test("a bántalmazás mérlegelésének ELMARADÁSA önmagában zászló", () => {
  const z = zaszlok(reg, eset({ "patient.age": 6 }));
  const m = z.find((x) => x.mezo === "pedgyn.safeguarding.asked");
  assert.ok(m, "az üres eset is zászlót kap ezen a mezőn");
  assert.equal(m!.suly, "hianyzoMerlegeles");
  assert.match(m!.teendo, /nem a bántalmazás feltételezése/);
});

test("a mérlegelés rögzítése elveszi a zászlót — a gyanú hiánya nem gyanú", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 6, "pedgyn.safeguarding.asked": "yes",
    "pedgyn.safeguarding.concern": "no", "pedgyn.bleeding.prepubertal": "no",
  }));
  assert.deepEqual(z.filter((x) => x.mezo.startsWith("pedgyn.safeguarding")), []);
});

test("a BIZONYTALAN gyanú nem gyengébb „nem” — saját utat kap", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 6, "pedgyn.safeguarding.asked": "yes",
    "pedgyn.safeguarding.concern": "uncertain",
  }));
  const g = z.find((x) => x.mezo === "pedgyn.safeguarding.concern")!;
  assert.equal(g.suly, "tisztazando");
  assert.match(g.teendo, /elengedése ELŐTT/);
  assert.match(g.teendo, /a gyanútól függ, nem a bizonyosságtól/);
});

test("az össze nem illő sérülés PIROS, és szó szerinti rögzítést kér", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 5, "pedgyn.safeguarding.asked": "yes",
    "pedgyn.trauma.consistent": "no",
  }));
  const g = z.find((x) => x.mezo === "pedgyn.trauma.consistent")!;
  assert.equal(g.suly, "piros");
  assert.match(g.teendo, /SZÓ SZERINTI/);
});

/* ── PUBERTÁS ELŐTTI VÉRZÉS ──────────────────────────────────────────── */

test("a pubertás előtti vérzés PIROS, és a differenciáldiagnózist is kimondja", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 5, "status.fert.tanner.breast": 1,
    "pedgyn.safeguarding.asked": "yes", "pedgyn.bleeding.prepubertal": "yes",
  }));
  const g = z.find((x) => x.mezo === "pedgyn.bleeding.prepubertal")!;
  assert.equal(g.suly, "piros");
  assert.match(g.teendo, /idegentest/);
});

test("prepubertás korban a MEG NEM KÉRDEZETT vérzés is zászló", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 5, "status.fert.tanner.breast": 1, "pedgyn.safeguarding.asked": "yes",
  }));
  const g = z.find((x) => x.mezo === "pedgyn.bleeding.prepubertal")!;
  assert.equal(g.suly, "hianyzoMerlegeles");
  // Serdülőnél viszont nem kérdés.
  const z2 = zaszlok(reg, eset({
    "patient.age": 16, "status.fert.tanner.breast": 5, "pedgyn.safeguarding.asked": "yes",
    "pedgyn.confidentiality.discussed": "pos",
  }));
  assert.equal(z2.find((x) => x.mezo === "pedgyn.bleeding.prepubertal"), undefined);
});

test("a bűzös váladék idegentestet vet fel, nem újabb antibiotikumot", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 5, "pedgyn.safeguarding.asked": "yes", "pedgyn.discharge": "foul",
  }));
  const g = z.find((x) => x.mezo === "pedgyn.foreignBody")!;
  assert.match(g.teendo, /ismételt antibiotikum helyett/);
});

/* ── A JOGI KERET ────────────────────────────────────────────────────── */

test("beleegyezés dokumentálása nélküli vizsgálat PIROS", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 10, "pedgyn.safeguarding.asked": "yes", "pedgyn.consent.who": "none",
  }));
  assert.equal(z.find((x) => x.mezo === "pedgyn.consent.who")!.suly, "piros");
});

test("serdülőnél a titoktartás kerete külön tétel", () => {
  const z = zaszlok(reg, eset({
    "patient.age": 16, "status.fert.tanner.breast": 5, "pedgyn.safeguarding.asked": "yes",
  }));
  const g = z.find((x) => x.mezo === "pedgyn.confidentiality.discussed")!;
  assert.match(g.teendo, /mit NEM tarthatunk annak/);
});

/* ── PUBERTÁS IDŐZÍTÉSE ──────────────────────────────────────────────── */

test("adat nélkül NEM születik „időben” besorolás", () => {
  const p = pubertasIdozites(reg, eset({ "patient.age": 11 }));
  assert.equal(p.itelet, "nemMegitelheto");
  assert.ok(p.hianyzik.length > 0, "és megmondja, mi hiányzik hozzá");
});

test("a 8 év alatti thelarche korai pubertás", () => {
  const p = pubertasIdozites(reg, eset({ "patient.age": 7, "pedgyn.thelarche.age": 6.5 }));
  assert.equal(p.itelet, "korai");
});

test("13 év felett a MEGFIGYELT B1 késői pubertás — a ki nem kérdezett adat nem az", () => {
  // Megfigyelés: 14 évesen B1 stádium. Ez állítás.
  assert.equal(
    pubertasIdozites(reg, eset({ "patient.age": 14, "status.fert.tanner.breast": 1 })).itelet,
    "kesoi");
  // Adathiány: ugyanaz a kor, de senki nem vizsgálta. Ez NEM állítás.
  const p = pubertasIdozites(reg, eset({ "patient.age": 14 }));
  assert.equal(p.itelet, "nemMegitelheto",
    "a meg nem kérdezett thelarche nem bizonyíték késői pubertásra");
});

test("a szokásos időben zajló pubertás akkor mondható ki, ha MINDKÉT adat megvan", () => {
  const p = pubertasIdozites(reg, eset({
    "patient.age": 15, "pedgyn.thelarche.age": 10.5, "hx.repro.menarche": 12,
  }));
  assert.equal(p.itelet, "idoben");
});
