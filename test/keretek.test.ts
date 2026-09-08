/**
 * AKKREDITÁCIÓS ÉS TANÚSÍTÁSI KERETEK — ISO 20387 · BELLA · MEES 2.1.
 *
 * A tesztek öt szabályt védenek:
 *
 *   1. a közölt darabszámok ÖSSZEFÜGGENEK, és a lista velük egyezik;
 *   2. a MEES 2.1 érvényességvég LEVEZETHETŐ, nem beírt szám;
 *   3. a KIZÁRT tartalmi elem a NEVEZŐBŐL is kiesik — a százalék elmozdul;
 *   4. a NEM ÉRTÉKELT elem nem nulla: a szint ilyenkor NEM ítélhető meg;
 *   5. a kötelező kapu a pontszámtól FÜGGETLEN.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  bellaSzint, ELOJELZES_NAP, keret, loadKeretek, meesNaptar, merleg, pontszam,
  validateKeretek,
} from "../core/mir/keretek.ts";
import type { BellaErtekeles, TartalmiElem } from "../core/mir/keretek.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const K = loadKeretek(join(HERE, "..", "registry", "mir", "keretek.json"));
const BELLA = keret(K, "bella")!;
const MEES = keret(K, "mees21")!;
const E: BellaErtekeles = BELLA.ertekeles!;
const MA = "2026-09-07";

let n = 0;
const elem = (
  kategoria: TartalmiElem["kategoria"], ertekeles: TartalmiElem["ertekeles"], sulyszam = 1,
): TartalmiElem => ({ id: `e${++n}`, standard: "bella.01", kategoria, sulyszam, ertekeles });

/* ── 1. A HÁROM KERET ───────────────────────────────────────────────── */

test("három keret áll a regiszterben, mindegyik megnevezett forrással", () => {
  assert.equal(K.keretek.length, 3);
  assert.deepEqual(K.keretek.map((x) => x.id), ["iso20387", "bella", "mees21"]);
  for (const x of K.keretek) assert.ok(x.forras.length > 20, `${x.id}: nincs forrás`);
  assert.equal(BELLA.fajta, "akkreditalas");
  assert.equal(MEES.fajta, "tanusitas");
});

test("A KÖZÖLT DARABSZÁMOK ÖSSZEFÜGGENEK, és a lista velük egyezik", () => {
  const sz = BELLA.standardSzam!;
  assert.equal(sz.fekvo, 39);
  assert.equal(sz.jaro, 30);
  assert.equal(sz.kozos, 26);
  // |fekvő ∪ járó| = fekvő + járó − közös
  assert.equal(sz.fekvo + sz.jaro - sz.kozos, BELLA.standardok!.length);
  assert.equal(BELLA.standardok!.length, 43);
});

test("az ellátási forma csak ott van kitöltve, ahol a NÉV eldönti", () => {
  const std = BELLA.standardok!;
  // A hivatalos táblázat oszlopjelöléseit a szöveges kivonat nem tartalmazza,
  // és tippelni nem szabad: ami nem dönthető el, az `null`.
  assert.equal(std.filter((s) => s.ellatas === null).length, 33);
  assert.ok(std.filter((s) => s.ellatas?.includes("fekvo")).length > 0);
  const w = validateKeretek(K, MA).filter((i) => /nincs kitöltve az ellátási forma/.test(i.message));
  assert.equal(w.length, 1);
  assert.equal(w[0].severity, "warning");
  assert.match(w[0].message, /tippelni nem szabad/);
});

test("a megnevezett kötelező standardok jelölve vannak", () => {
  const kot = BELLA.standardok!.filter((s) => s.kotelezoStandard).map((s) => s.megnevezes);
  assert.equal(kot.length, 3);
  assert.ok(kot.includes("Minőségbiztosítás és minőségfejlesztés"));
  assert.ok(kot.includes("Újraélesztés egészségügyi ellátó intézményben"));
});

/* ── 2. A MEES 2.1 NAPTÁRA ──────────────────────────────────────────── */

test("A MEES 2.1 ÉRVÉNYESSÉGVÉG LEVEZETHETŐ, nem beírt szám", () => {
  // 2024-09-25 közzététel + 3 év = 2027-09-25, és ez a közölt mérföldkő.
  assert.equal(MEES.kozzetetel, "2024-09-25");
  assert.equal(MEES.tanusitvanyErvenyessegEv, 3);
  const m5 = MEES.merfoldkovek!.find((x) => x.id === "mees.m5")!;
  assert.equal(m5.hatarido, "2027-09-25");
  assert.equal(validateKeretek(K, MA).filter((i) => /levezetett érvényességvég/.test(i.message)).length, 0);
});

test("az elrontott érvényességvég építési hiba", () => {
  const k = JSON.parse(JSON.stringify(K)) as typeof K;
  keret(k, "mees21")!.merfoldkovek!.find((x) => x.id === "mees.m5")!.hatarido = "2028-01-01";
  const hibak = validateKeretek(k, MA).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /eltér a közölt mérföldkő dátumától/);
});

test("a naptár megkülönbözteti a HATÓSÁG teendőjét a miénktől", () => {
  const naptar = meesNaptar(MEES, MA);
  assert.equal(naptar.length, 5);
  const miénk = naptar.filter((x) => x.minket);
  assert.equal(miénk.length, 2, "az átmeneti időszak és a tanúsítói átmenet vége");
  // A hatóság lejárt mérföldköve NEM hiba a mi rendszerünkben.
  const hatosag = naptar.filter((x) => !x.minket && x.allapot === "lejart");
  assert.equal(hatosag.length, 3);
  assert.match(hatosag[0].miert, /nem a miénk/);
  assert.equal(validateKeretek(K, MA).filter((i) => i.severity === "error").length, 0);
});

test("a küszöbön álló mérföldkő figyelmeztetés — 90 nappal előre", () => {
  const m4 = meesNaptar(MEES, MA).find((x) => x.id === "mees.m4")!;
  assert.equal(m4.allapot, "kuszobon");
  assert.equal(m4.napMulva, 18);
  assert.ok(m4.napMulva <= ELOJELZES_NAP);
  assert.match(m4.miert, /ránk vonatkozik/);
  assert.equal(merleg(K, MA).meesKovetkezo!.id, "mees.m4");
});

test("A LEJÁRT SAJÁT MÉRFÖLDKŐ ÉPÍTÉSI HIBA", () => {
  // 2026-10-01-jén az átmeneti időszak már lejárt.
  const hibak = validateKeretek(K, "2026-10-01").filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /LEJÁRT/);
  assert.match(hibak[0].message, /nem érvényes/);
});

/* ── 3. A KIZÁRT ELEM A NEVEZŐBŐL IS KIESIK ─────────────────────────── */

test("A NEM ÉRTELMEZHETŐ ELEM NEM NULLA PONT, HANEM KISEBB NEVEZŐ", () => {
  // Négy alapszintű elem, mind súlyszám 1. Kettő teljesül (4-4 pont).
  const negy = [elem("alap", 4), elem("alap", 4), elem("alap", 0), elem("alap", 0)];
  const p1 = pontszam(negy, "alap");
  assert.equal(p1.elerheto, 16);
  assert.equal(p1.elert, 8);
  assert.equal(p1.szazalek, 50);

  // Ugyanaz, de a két nullás elem NEM ÉRTELMEZHETŐ ebben az intézményben.
  const kizarva = [elem("alap", 4), elem("alap", 4),
                   elem("alap", "nemErtelmezheto"), elem("alap", "nemErtelmezheto")];
  const p2 = pontszam(kizarva, "alap");
  assert.equal(p2.kizart, 2);
  assert.equal(p2.elerheto, 8, "a nevező is csökken");
  assert.equal(p2.szazalek, 100, "és ettől a százalék 50-ről 100-ra ugrik");
});

test("a súlyszám arányosan viszi a pontot", () => {
  const p = pontszam([elem("alap", 4, 3), elem("alap", 0, 1)], "alap");
  assert.equal(p.elerheto, 4 * 3 + 4 * 1);
  assert.equal(p.elert, 12);
  assert.equal(p.szazalek, 75);
});

/* ── 4. A NEM ÉRTÉKELT ELEM NEM NULLA ───────────────────────────────── */

test("A SZINT NEM ÍTÉLHETŐ MEG, amíg van nem értékelt elem", () => {
  const r = bellaSzint([elem("kotelezo", 4), elem("alap", 4), elem("alap", "nemErtekelt")], E);
  assert.equal(r.szint, "nemMegitelheto");
  assert.match(r.miert, /a hiányzó adat itt sem „nem”/);
});

/* ── 5. A KÖTELEZŐ KAPU A PONTSZÁMTÓL FÜGGETLEN ─────────────────────── */

test("EGYETLEN BUKÓ KÖTELEZŐ ELEM MELLETT NINCS IGAZOLÁS — akármilyen jó az átlag", () => {
  const elemek = [
    elem("kotelezo", 4), elem("kotelezo", 2),          // ez az egy nem teljesül maradéktalanul
    ...Array.from({ length: 10 }, () => elem("alap", 4)),
    ...Array.from({ length: 10 }, () => elem("emelt", 4)),
  ];
  const r = bellaSzint(elemek, E);
  assert.equal(r.szint, "nincs");
  assert.equal(r.bukoKotelezo.length, 1);
  assert.equal(r.alap.szazalek, 100, "az alapszint hibátlan");
  assert.equal(r.emelt.szazalek, 100, "az emelt szint is");
  assert.match(r.miert, /a jó átlag nem váltja ki/);
});

test("alapszint: kötelező 100% + alapszintű 75%", () => {
  const elemek = [
    elem("kotelezo", 4),
    elem("alap", 4), elem("alap", 4), elem("alap", 4), elem("alap", 0),  // 12/16 = 75%
    elem("emelt", 0), elem("emelt", 0),
  ];
  const r = bellaSzint(elemek, E);
  assert.equal(r.szint, "alap");
  assert.equal(r.alap.szazalek, 75);
  assert.match(r.miert, /3 évre szól/);
});

test("a küszöb alatti alapszint nem ad igazolást", () => {
  const elemek = [elem("kotelezo", 4), elem("alap", 4), elem("alap", 2)];  // 6/8 = 75%…
  assert.equal(bellaSzint(elemek, E).szint, "alap");
  const gyengebb = [elem("kotelezo", 4), elem("alap", 4), elem("alap", 0)];  // 4/8 = 50%
  const r = bellaSzint(gyengebb, E);
  assert.equal(r.szint, "nincs");
  assert.match(r.miert, /küszöb: 75%/);
});

test("emelt szint: az alapszint MELLETT az emelt elemek 75%-a", () => {
  const elemek = [
    elem("kotelezo", 4),
    elem("alap", 4), elem("alap", 4), elem("alap", 4), elem("alap", 4),
    elem("emelt", 4), elem("emelt", 4), elem("emelt", 4), elem("emelt", 2),  // 14/16 = 87.5%
  ];
  const r = bellaSzint(elemek, E);
  assert.equal(r.szint, "emelt");
  assert.equal(r.emelt.szazalek, 87.5);
});

test("az emelt szint NEM ugorható át: alapszint nélkül nincs emelt", () => {
  const elemek = [
    elem("kotelezo", 4),
    elem("alap", 0), elem("alap", 0),
    elem("emelt", 4), elem("emelt", 4),
  ];
  const r = bellaSzint(elemek, E);
  assert.equal(r.szint, "nincs");
  assert.equal(r.emelt.szazalek, 100, "az emelt elemek hibátlanok — mégsem elég");
});

/* ── 6. A TARTALMI ELEMEK HIÁNYA KIMONDVA ───────────────────────────── */

test("a pontozó motor fut, de NINCS MIT PONTOZNIA — és ezt kimondja", () => {
  const w = validateKeretek(K, MA).filter((i) => /nincs mit\s+pontoznia/.test(i.message));
  assert.equal(w.length, 1);
  assert.equal(w[0].severity, "warning");
  // A tartalmi elemek (súlyszám, kategória) a hivatalos kiadványból jönnek —
  // a regiszterben szándékosan NINCSENEK benne.
  assert.equal(BELLA.standardok!.some((s) => "tartalmiElemek" in s), false);
});

test("a valódi regiszter építési hiba nélkül validál", () => {
  assert.equal(validateKeretek(K, MA).filter((i) => i.severity === "error").length, 0);
});
