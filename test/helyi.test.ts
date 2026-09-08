/**
 * A HELYI NORMOGRAM — a 18. lépés.
 *
 * A rendszer önmagára záródása a projekt értelme ÉS a legnagyobb kockázata.
 * Ezek a tesztek a kockázat oldalát védik: a vékony sáv, a publikálthoz
 * képesti rendszeres eltolás, és a generálás, ami inkább kihagy egy sávot,
 * mint hogy két esetből számoljon szórást.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  elteres, generalHelyi, merleg, savAllas, validateHelyi, vekonySavok,
} from "../core/us/helyi.ts";
import { loadNormograms, type Normogram } from "../core/us/normogram.ts";

const SET = loadNormograms("registry/normogramok");
const ALL = SET.all();
const HELYI = ALL.find((n) => n.id === "ng.local.us-ac")!;
const PUB = ALL.find((n) => n.id === "ng.chitty.ac")!;

/* ══ 1. A SÁV MÖGÖTTI ESETSZÁM ═════════════════════════════════════════ */

test("a demótáblában hat sáv marad a SAJÁT MAGA deklarált minimuma alatt", () => {
  const v = vekonySavok(HELYI);
  assert.deepEqual(v.map((s) => s.x), [20, 24, 28, 32, 36, 40]);
  assert.ok(v.every((s) => s.n === 20));
  assert.equal(HELYI.derivedFrom!.minPerBin, 50);
});

test("MINDKÉT befogó sávot nézzük, nem a közelebbit", () => {
  // A 23-as sáv vastag (80), a 24-es vékony (20). Bármi, ami a kettő KÖZÖTT
  // van, részben a vékonyból épül — akkor is, ha a 23-hoz van közelebb.
  assert.equal(savAllas(HELYI, 23).allapot, "eleg");
  for (const x of [23.1, 23.5, 23.9, 24]) {
    assert.equal(savAllas(HELYI, x).allapot, "vekony", `x=${x}`);
  }
  assert.equal(savAllas(HELYI, 25).allapot, "eleg");
  assert.equal(savAllas(HELYI, 25.5).allapot, "eleg");
});

test("a tartományon kívüli x nem „vékony”, hanem tartományon kívüli", () => {
  assert.equal(savAllas(HELYI, 19).allapot, "tartomanyonKivul");
  assert.equal(savAllas(HELYI, 41).allapot, "tartomanyonKivul");
});

test("sávonkénti elemszám nélkül a válasz NEM „elég”", () => {
  const nincs: Normogram = {
    ...HELYI, id: "ng.local.nincsSzam",
    derivedFrom: { ...HELYI.derivedFrom!, countByX: undefined },
  };
  const a = savAllas(nincs, 26);
  assert.equal(a.allapot, "szamlalasNelkul");
  assert.equal(a.eleg, false, "a hiányzó számlálás sehol nem „elég”");
  assert.match(a.miert, /nem görbe, hanem vélemény/);
});

/* ══ 2. A PUBLIKÁLTHOZ KÉPESTI ELTOLÁS ═════════════════════════════════ */

test("a demó helyi görbéje RENDSZERESEN eltolt a publikálthoz képest", () => {
  const e = elteres(HELYI, PUB);
  assert.equal(e.fajta, "rendszeresEltolas");
  assert.equal(e.egyIranyba, e.savok, "minden közös sáv ugyanabba az irányba");
  assert.ok(e.atlagZ < -0.25);
  assert.match(e.miert, /a saját torzításához mérné magát/);
});

test("az össze nem vethető görbe NEM „egyezik” — az összevetés maradt el", () => {
  const egysoros: Normogram = { ...PUB, id: "ng.pub.egysoros", rows: [PUB.rows![0]] };
  const e = elteres(HELYI, egysoros);
  assert.equal(e.fajta, "nemOsszevetheto");
  assert.match(e.miert, /NEM „nincs eltérés”/);
});

test("együtt futó görbék: egyezik", () => {
  const masolat: Normogram = {
    ...PUB, id: "ng.local.masolat", kind: "local", verification: "local",
    rows: PUB.rows!.map((r) => ({ ...r, mean: r.mean + r.sd * 0.05 })),
  };
  const e = elteres(masolat, PUB);
  assert.equal(e.fajta, "egyezik");
  assert.ok(Math.abs(e.atlagZ - 0.05) < 1e-9);
});

test("az eltolást a PUBLIKÁLT szórásában mérjük, nem milliméterben", () => {
  // Ugyanaz a 3 egységnyi eltérés két külön szórás mellett: az egyik érdemi,
  // a másik elhanyagolható. Milliméterben mindkettő ugyanaz lenne.
  const alap: Normogram = { ...PUB, id: "p", rows: [
    { x: 20, mean: 100, sd: 4 }, { x: 30, mean: 200, sd: 4 },
    { x: 40, mean: 300, sd: 4 }] };
  const szuk: Normogram = { ...alap, id: "h", kind: "local",
    rows: alap.rows!.map((r) => ({ ...r, mean: r.mean + 3 })) };
  assert.equal(elteres(szuk, alap).fajta, "rendszeresEltolas");

  const tag: Normogram = { ...alap, id: "p2",
    rows: alap.rows!.map((r) => ({ ...r, sd: 40 })) };
  const szuk2: Normogram = { ...tag, id: "h2", kind: "local",
    rows: tag.rows!.map((r) => ({ ...r, mean: r.mean + 3 })) };
  assert.equal(elteres(szuk2, tag).fajta, "egyezik");
});

/* ══ 3. A GENERÁLÁS ════════════════════════════════════════════════════ */

const mer = (x: number, n: number, alap: number, szor = 5) =>
  Array.from({ length: n }, (_, i) => ({ x, ertek: alap + (i % 5 - 2) * szor }));

test("a vékony sáv KIMARAD a generált táblából, és meg is van nevezve", () => {
  const g = generalHelyi([
    ...mer(20, 60, 150), ...mer(21, 8, 160), ...mer(22, 70, 170),
  ], { minPerBin: 50 });
  assert.deepEqual(g.rows.map((r) => r.x), [20, 22]);
  assert.deepEqual(g.eldobott, [{ x: 21, n: 8 }]);
  assert.equal(g.felhasznaltMeres, 130);
  assert.equal(g.osszesMeres, 138);
  assert.equal(g.hasznalhato, true);
  assert.match(g.miert, /x=21: 8/);
});

test("két sáv alatt a tábla NEM használható — nincs mit interpolálni", () => {
  const g = generalHelyi(mer(20, 60, 150), { minPerBin: 50 });
  assert.equal(g.rows.length, 1);
  assert.equal(g.hasznalhato, false);
  assert.match(g.miert, /NEM HASZNÁLHATÓ/);
});

test("MINTASZÓRÁS (n−1), nem populációs — különben a percentilis szélsőségesebb", () => {
  const ertekek = [10, 12, 14, 16, 18];
  const g = generalHelyi(ertekek.map((e) => ({ x: 30, ertek: e })), { minPerBin: 2, minSav: 1 });
  const sd = g.rows[0].sd;
  // átlag 14, eltérések: -4,-2,0,2,4 → SS = 40
  assert.ok(Math.abs(sd - Math.sqrt(40 / 4)) < 1e-12, "n−1 nevező");
  assert.ok(sd > Math.sqrt(40 / 5), "a populációs képlet kisebbet adna");
});

test("nulla szórású sáv kiesik — abból minden érték végtelen z-t kapna", () => {
  const g = generalHelyi([
    ...Array.from({ length: 60 }, () => ({ x: 30, ertek: 200 })),
    ...mer(31, 60, 210),
  ], { minPerBin: 50 });
  assert.deepEqual(g.rows.map((r) => r.x), [31]);
  assert.deepEqual(g.eldobott, [{ x: 30, n: 60 }]);
});

test("a nem véges mérés nem kerül be, és nem is dobja el a sávot", () => {
  const g = generalHelyi([
    ...mer(30, 60, 200),
    { x: NaN, ertek: 200 }, { x: 30, ertek: Infinity },
  ], { minPerBin: 50, minSav: 1 });
  assert.equal(g.rows.length, 1);
  assert.equal(g.countByX["30"], 60);
});

/* ══ 4. VALIDÁLÁS ÉS MÉRLEG ════════════════════════════════════════════ */

test("a validálás kimondja a vékony sávokat ÉS a rendszeres eltolást", () => {
  const w = validateHelyi(ALL).filter((i) => i.id === "ng.local.us-ac");
  assert.ok(w.some((i) => /minimum alatt van/.test(i.message)));
  assert.ok(w.some((i) => /RENDSZERES ELTOLÁS/.test(i.message)));
});

test("sávonkénti elemszám nélküli helyi tábla HIBA", () => {
  const nincs: Normogram = {
    ...HELYI, id: "ng.local.nincsSzam",
    derivedFrom: { ...HELYI.derivedFrom!, countByX: undefined },
  };
  const h = validateHelyi([nincs, PUB]).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /a percentilis épp a széleken számít/);
});

test("publikált párja nélkül a helyi görbe ELLENŐRIZETLEN, nem „egyező”", () => {
  const arva: Normogram = { ...HELYI, id: "ng.local.arva", parameter: "us.hc" };
  const w = validateHelyi([arva]);
  assert.ok(w.some((i) => /Nincs publikált tábla/.test(i.message)));
  assert.ok(w.some((i) => /tökéletes egyezést találva/.test(i.message)));
});

test("a mérleg minden száma a sorokból derivált", () => {
  const m = merleg(ALL);
  assert.equal(m.helyiTabla, ALL.filter((n) => n.kind === "local").length);
  assert.equal(m.savOsszes, HELYI.rows!.length);
  assert.equal(m.savVekony, vekonySavok(HELYI).length);
  assert.equal(m.eltolt, 1);
});

/* ══ 5. A HIBRID NÉZET ═════════════════════════════════════════════════ */

test("a hibrid nézet MIND A HÁROM olvasatot adja, a hiányzókat OKKAL", () => {
  const sorok = SET.forParameter("us.ac");
  const fajtak = new Set(sorok.map((n) => n.kind ?? "published"));
  assert.deepEqual([...fajtak].sort(), ["customised", "local", "published"],
    "mind a három kérdés képviselve van");
});
