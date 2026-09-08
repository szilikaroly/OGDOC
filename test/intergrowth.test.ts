/**
 * INTERGROWTH-21st: normáltartomány ÉS becslőmódszer.
 *
 * A becslések a kalkulátor-kapu mögött állnak (`verified: false`), ezért a
 * `fn`-t itt közvetlenül hívjuk: a kapu azt védi, hogy a rendszer NE adjon
 * számot aláírás nélkül — a képlet helyességét viszont akkor is meg kell
 * tudni mérni, amikor a kapu zárva van.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CALC_BY_ID } from "../core/calc/defs.ts";

const F = (id: string) => CALC_BY_ID.get(id)!;

test("a négy INTERGROWTH-becslés MIND kapu mögött áll", () => {
  for (const id of ["calc.ga.crl.ig21", "calc.ga.hcfl.ig21", "calc.ga.hc.ig21",
                    "calc.efw.ig21"]) {
    assert.equal(F(id).verified, false, `${id}: aláírás nélkül nem ad számot`);
    assert.ok(F(id).source.cite.includes("University of Oxford"));
  }
});

test("CRL-datálás: 45 mm ≈ 11+2 hét", () => {
  const w = F("calc.ga.crl.ig21").fn(45)!;
  assert.ok(w > 11.0 && w < 11.5, `${w.toFixed(2)} hét`);
});

test("A TARTOMÁNY A SZÁMÍTÁS RÉSZE — 15 mm alatt és 95 mm fölött nincs becslés", () => {
  const f = F("calc.ga.crl.ig21").fn;
  assert.equal(f(14), null, "15 mm alatt a képlet nem érvényes");
  assert.equal(f(96), null, "95 mm fölött a HC–FL módszer való");
  assert.ok(f(15) !== null && f(95) !== null, "a határok BENNE vannak");
});

test("késői datálás fejkörfogatból és combcsonthosszból", () => {
  const w = F("calc.ga.hcfl.ig21").fn(200, 35)!;
  assert.ok(w > 21 && w < 23, `${w.toFixed(2)} hét`);
});

test("A FEJKÖRFOGAT-ALAPÚ DATÁLÁS HALLGAT, HA VAN COMBCSONTHOSSZ", () => {
  const f = F("calc.ga.hc.ig21").fn;
  assert.equal(f(200, 35), null,
    "a forrás szerint ez a módszer CSAK combcsonthossz hiányában használható");
  const w = f(200, NaN)!;                        // a futtató hiányzó bemenetre NaN-t ad
  assert.ok(w > 21 && w < 24, `combcsonthossz nélkül számol: ${w?.toFixed(2)} hét`);
});

test("a kizáró feltétel a BEMENETEK között áll, nem csak a leírásban", () => {
  const fl = F("calc.ga.hc.ig21").inputs.find((i) => i.id === "us.fl");
  assert.ok(fl, "a combcsonthossz szerepel a bemenetek között");
  assert.equal(fl!.required, false, "…de nem kötelező: nem számítási bemenet, hanem kizáró feltétel");
});

test("EFW: 40. hét körüli méretekre életszerű súly", () => {
  const g = F("calc.efw.ig21").fn(340, 350)!;     // HC 34 cm, AC 35 cm
  assert.ok(g > 3200 && g < 3700, `${Math.round(g)} g`);
});

test("A KÉT EFW-MODELL ELTÉR, és ez nem zaj", () => {
  const ig = F("calc.efw.ig21").fn(340, 350)!;
  const hadlock = F("calc.efw.hadlock").fn(93, 340, 350, 73)!;
  assert.ok(Math.abs(ig - hadlock) > 20,
    `ugyanarra a magzatra ${Math.round(ig)} g és ${Math.round(hadlock)} g — ` +
    `a különbség szakmai döntést kíván, nem átlagolást`);
});

test("értelmetlen bemenetre nincs szám", () => {
  assert.equal(F("calc.efw.ig21").fn(0, 350), null);
  assert.equal(F("calc.ga.hcfl.ig21").fn(200, 0), null);
});
