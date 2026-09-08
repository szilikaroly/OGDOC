/**
 * KÜLSŐ MODELL — a kiértékelő, ami egyetlen modellt sem ismer.
 *
 * Ezek a tesztek egy KITALÁLT modellt használnak, nem a PRB-t. Nem
 * kényelemből: ha a tesztek egy helyben telepített, licenckötött modellre
 * épülnének, akkor egy friss klónon el sem futnának — és a „nincs telepítve”
 * ág épp az, aminek MINDIG működnie kell, mert a terjesztett műben az az
 * alapértelmezés.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  betoltModell, ertekelModell, linearisPrediktor, olvasEgyutthatok,
  retegHatarok, telepitve,
} from "../core/kulso/modell.ts";

/** Kitalált kétrétegű modell, két bemenettel és egy kölcsönhatással. */
const MATRIX =
  `"","S1","S2"\n` +
  `"(Intercept)",1,2\n` +
  `"a",0.5,0\n` +
  `"b",-1,3\n` +
  `"a:b",2,0\n`;

function fixture(verification = "primary"): string {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-modell-"));
  writeFileSync(join(dir, "coef.csv"), MATRIX);
  writeFileSync(join(dir, "MODELL.json"), JSON.stringify({
    id: "teszt", label: { hu: "teszt" }, licenc: "CC0-1.0",
    verification, verificationNote: "kitalált modell",
    retegek: ["S1", "S2"], retegHatarok: [0, 10, 20], retegValtozo: "x",
    tablak: { fo: "coef.csv" }, lekepezes: {},
  }));
  return dir;
}

test("a NEM TELEPÍTETT modell nem ad számot, és megmondja, miért", () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-ures-"));
  assert.equal(telepitve(dir), false);
  assert.equal(betoltModell(dir), null);
  const r = ertekelModell(dir, "fo", 5, { a: 1, b: 1 });
  assert.equal(r.allapot, "nincsTelepitve");
  assert.equal(r.ertek, null);
  assert.match(r.miert!, /nem része a terjesztett műnek/);
  rmSync(dir, { recursive: true, force: true });
});

test("az együtthatómátrix idézőjeles fejléccel is beolvasható", () => {
  const dir = fixture();
  const c = olvasEgyutthatok(join(dir, "coef.csv"));
  assert.deepEqual(c.retegek, ["S1", "S2"]);
  assert.deepEqual(c.tagok, ["(Intercept)", "a", "b", "a:b"]);
  assert.equal(c.ertek("a:b", "S1"), 2);
  assert.equal(c.ertek("a", "S2"), 0);
  rmSync(dir, { recursive: true, force: true });
});

test("a lineáris prediktor a kölcsönhatást SZORZATKÉNT számolja", () => {
  const dir = fixture();
  const c = olvasEgyutthatok(join(dir, "coef.csv"));
  // 1 + 0.5*2 + (−1)*3 + 2*(2*3) = 1 + 1 − 3 + 12 = 11
  const p = linearisPrediktor(c, "S1", { a: 2, b: 3 });
  assert.deepEqual(p.hianyzo, []);
  assert.equal(p.ertek, 11);
  rmSync(dir, { recursive: true, force: true });
});

test("a HIÁNYZÓ bemenet nem nulla — a modell megáll, és megnevezi", () => {
  const dir = fixture();
  const c = olvasEgyutthatok(join(dir, "coef.csv"));
  const p = linearisPrediktor(c, "S1", { a: 2 });
  assert.equal(p.ertek, null, "hiányos bemenetre nincs szám");
  assert.ok(p.hianyzo.includes("b"));
  assert.ok(p.hianyzo.includes("a:b"), "a szorzat is hiányzik, ha egyik fele hiányzik");
  rmSync(dir, { recursive: true, force: true });
});

test("a NULLA együtthatójú tag nincs benne a modellben — hiánya nem akadály", () => {
  const dir = fixture();
  const c = olvasEgyutthatok(join(dir, "coef.csv"));
  // S2-ben `a` és `a:b` együtthatója 0, tehát `a` nélkül is számol.
  const p = linearisPrediktor(c, "S2", { b: 4 });
  assert.deepEqual(p.hianyzo, []);
  assert.equal(p.ertek, 2 + 3 * 4);
  assert.ok(p.kihagyott.includes("a"), "de a kihagyást ki is írja — nem hallgatja el");
  rmSync(dir, { recursive: true, force: true });
});

test("a rétegen KÍVÜLI érték nem extrapolál", () => {
  const dir = fixture();
  assert.equal(retegHatarok(betoltModell(dir)!, 25), null);
  const r = ertekelModell(dir, "fo", 25, { a: 1, b: 1 });
  assert.equal(r.allapot, "ismeretlenReteg");
  assert.equal(r.ertek, null);
  assert.match(r.miert!, /ott nem tanult semmit/);
  rmSync(dir, { recursive: true, force: true });
});

test("a HITELESÍTETLEN modell teljes bemenettel sem ad számot", () => {
  const dir = fixture("assumed");
  const r = ertekelModell(dir, "fo", 5, { a: 2, b: 3 });
  assert.equal(r.allapot, "hitelesitetlen");
  assert.equal(r.ertek, null, "a szám megvan, a rendszer mégsem adja ki");
  assert.match(r.miert!, /elsődleges forrással/);
  rmSync(dir, { recursive: true, force: true });
});

test("hitelesített modell + teljes bemenet = szám, a licenccel együtt", () => {
  const dir = fixture("primary");
  const r = ertekelModell(dir, "fo", 5, { a: 2, b: 3 });
  assert.equal(r.allapot, "ok");
  assert.equal(r.ertek, 11);
  assert.equal(r.licenc, "CC0-1.0", "a modell licence a kimeneten is ott van");
  rmSync(dir, { recursive: true, force: true });
});

test("a mag egyetlen külső modell nevét sem ismeri", async () => {
  const forras = await import("node:fs")
    .then((fs) => fs.readFileSync("core/kulso/modell.ts", "utf8"));
  for (const szo of ["PLGF", "sVEGFR1", "sEng", "MAPMOM", "prcoef", "Interval1"]) {
    assert.ok(!forras.includes(szo),
      `„${szo}” megjelenik a magban — a modell adat, nem kód, és a licenc ezen múlik`);
  }
});
