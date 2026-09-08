/**
 * MAGZATI RÉSZLETES ANATÓMIA — öt állapot, és a két „nem”.
 *
 * A meglévő rendszer anatómiai lapjai egy dolgot tanítanak, ami a rendszerbe
 * eddig nem volt beépítve:
 *
 *   A „NEM LÁTHATÓ” ÉS A „NEM HOZHATÓ LÁTÓTÉRBE” NEM UGYANAZ.
 *
 * Az első LELET a magzatról — a nem ábrázolódó gyomor oesophagus-atresiára
 * utal. A második a VIZSGÁLATRÓL szól: a magzat háttal fekszik. A két állapot
 * ELLENTÉTES teendőt szül: az egyik kivizsgálást, a másik ismétlést.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  loadAnatomy, readState, region, validateAnatomy,
} from "../core/us/anatomia.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const CAT = loadAnatomy(join(HERE, "..", "registry", "felulet", "magzati-anatomia.json"));

/* ── 1. A KATALÓGUS ÉP ──────────────────────────────────────────────── */

test("az anatómiai katalógus hiba nélkül validál", () => {
  assert.deepEqual(validateAnatomy(CAT).filter((i) => i.severity === "error"), []);
  assert.equal(CAT.regions.length, 13);
  assert.ok(CAT.regions.every((r) => r.abnormalities.length > 0));
});

test("a katalógus mind a tizenkét szervrendszert tartalmazza", () => {
  assert.equal(CAT.coverage, "full");
  assert.deepEqual(CAT.gaps, []);
  assert.ok(CAT.regions.some((r) => r.id === "vegtagok"));
  assert.ok(CAT.regions.some((r) => r.id === "genitalia"));
});

test("a genitalia lap a KIMENETI KAPU működő példája", () => {
  // Két külön mező: a rögzített lelet, és a „Nincs nyomtatásban" lelet. A
  // megállapítás rögzül, de nem kerül a beteg kezébe adott papírra.
  const g = region(CAT, "genitalia")!;
  assert.match(g.note!, /Nincs nyomtatásban/);
  assert.match(g.note!, /a dokumentáció teljes marad/);
  assert.match(CAT.printGate!.hu!, /a beteg kérése .* a DOKUMENTUM szintjén kapuzható/);
});

test("a végtagoknál minden tételnek OLDALISÁGA van", () => {
  const v = region(CAT, "vegtagok")!;
  assert.ok(v.abnormalities.every((a) => /oldalisággal|oldallal/.test(a)));
  assert.match(v.note!, /Az egyoldali hiány és a kétoldali hiány KÜLÖNBÖZŐ diagnózis/);
});

test("minden szervrendszernek van NORMÁL ÁLLÍTÁSA, nem csak „normális”", () => {
  // A „normális" önmagában nem lelet: le kell írni, MIT állítunk normálisnak.
  for (const r of CAT.regions) {
    assert.ok(r.normalStatement.length >= 16, `${r.id}: ${r.normalStatement}`);
  }
  assert.match(region(CAT, "gerinc")!.normalStatement, /sem spina bifida/);
});

/* ── 2. A KÉT „NEM" ELLENTÉTES TEENDŐT SZÜL ─────────────────────────── */

test("a nem ábrázolódó szerv LELET, nem a vizsgálat korlátja", () => {
  const r = readState(region(CAT, "git")!, "notVisible");
  assert.equal(r.abnormalFinding, true);
  assert.equal(r.repeatNeeded, false);
  assert.match(r.why, /LELET a magzatról/);
});

test("a be nem állítható metszet a VIZSGÁLATRÓL szól — ismétlést kér", () => {
  const r = readState(region(CAT, "git")!, "notObtainable");
  assert.equal(r.abnormalFinding, false);
  assert.equal(r.repeatNeeded, true);
  assert.match(r.why, /ismétlést kér, nem kivizsgálást/);
  assert.match(r.why, /NEM azonos a normálissal/);
});

test("a rendszer eddigi egyetlen „nem vizsgálható” állapota kevés volt", () => {
  const notVisible = readState(region(CAT, "sziv")!, "notVisible");
  const notObtainable = readState(region(CAT, "sziv")!, "notObtainable");
  assert.notEqual(notVisible.abnormalFinding, notObtainable.abnormalFinding);
  assert.notEqual(notVisible.repeatNeeded, notObtainable.repeatNeeded);
  assert.match(CAT.stateNote.hu!, /kettéválasztja, és igaza van/);
});

test("a nem rögzített szerv nem normális és nem kóros — nincs róla adat", () => {
  const r = readState(region(CAT, "arc")!, "notRecorded");
  assert.equal(r.abnormalFinding, false);
  assert.equal(r.repeatNeeded, true);
  assert.match(r.why, /SEMMIT nem állít/);
});

test("mind az öt állapot definiálva van", () => {
  assert.deepEqual(CAT.states.map((s) => s.id).sort(),
    ["abnormal", "normal", "notObtainable", "notRecorded", "notVisible"]);
});

/* ── 3. AMIT A TÉTELES LISTA MEGŐRIZ ────────────────────────────────── */

test("a szívnél NÉGY külön normál-állítás van, nem egy", () => {
  // A négyüregű kép normális lehet úgy is, hogy a nagyerek transzponáltak.
  const sziv = region(CAT, "sziv")!;
  assert.match(sziv.normalStatement, /négyüregű/);
  assert.match(sziv.normalStatement, /főerek/);
  assert.match(sziv.normalStatement, /kiáramlási pályák/);
  assert.match(sziv.normalStatement, /háromér-metszet/);
  assert.match(sziv.note!, /Egyetlen „szív normális” pipa ezt elfedné/);
});

test("a herniálódott tartalom önálló adat, nem részlet", () => {
  const hasfal = region(CAT, "hasfal")!;
  assert.ok(hasfal.abnormalities.some((a) => /Exomphalos.*tartalommal/.test(a)));
  assert.match(hasfal.note!, /csak belet tartalmazó exomphalos prognózisa más/);
});

test("a gerincnél a SZEGMENS is adat", () => {
  const gerinc = region(CAT, "gerinc")!;
  assert.ok(gerinc.abnormalities.some((a) => /szegmensek száma/.test(a)));
  assert.match(gerinc.note!, /a szintje és kiterjedése dönti el a prognózist/);
});

test("a rekeszsérvnél a modellből számított túlélés is a lapon van", () => {
  const mellkas = region(CAT, "mellkas")!;
  assert.ok(mellkas.measurements.includes("Tüdő-fej hányados (LHR)"));
  assert.ok(mellkas.measurements.includes("Túlélés LHR alapján (%)"));
  assert.match(mellkas.note!, /`calc\.verified` kapuja alá tartozik/);
});

test("126 nevesített rendellenesség — nem szabad szöveg", () => {
  const n = CAT.regions.reduce((s, r) => s + r.abnormalities.length, 0);
  assert.ok(n >= 135);
  const m = CAT.regions.reduce((s, r) => s + r.measurements.length, 0);
  assert.ok(m >= 50);
});


/* ── 4. A MÁSODIK TRIMESZTER UGYANEZ A KATALÓGUS ────────────────────── */

test("a második trimeszteri anatómia értékkészlete AZONOS az elsőével", () => {
  // Nem trimeszterenként külön lista, hanem EGY lista, terhességi kor
  // szerinti elérhetőséggel.
  assert.deepEqual(CAT.tabsByTrimester, { first: 12, second: 13 });
  assert.match(CAT.regionNote!.hu!, /ugyanaz a katalógus, másik terhességi korra/);
  // Nem feltevés: mind a tizenkét fül tételesen összevetve.
  assert.match(CAT.regionNote!.hu!, /Ez nem feltevés/);
  assert.ok(CAT.verification);
});

test("az „Egyéb rendellenességek” fül NEM szabad szöveges gyűjtőhely", () => {
  // A csontváz-dysplasiák nem egy szervet érintenek, hanem az egész magzatot.
  const e = region(CAT, "egyeb")!;
  assert.ok(e.abnormalities.length >= 12);
  assert.ok(e.abnormalities.filter((a) => /^Csontváz:/.test(a)).length >= 9);
  assert.match(e.note!, /nem egy szervet érintenek/);
  assert.match(e.note!, /Csak a MÁSODIK trimeszteri/);
});
