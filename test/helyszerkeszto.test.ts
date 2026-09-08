/**
 * ÉPÜLET-MANAGEMENT — a szerkesztés, ami átírná a múltat.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadHelyek } from "../core/fekvo/hely.ts";
import { lanc } from "../core/fekvo/hely.ts";
import {
  alkalmaz, ervenyes, keszletAkkor, validateHivatkozasok, validateIdozites, vegrehajthato,
} from "../core/admin/helyszerkeszto.ts";
import type { Muvelet, SzerkesztettKeszlet } from "../core/admin/helyszerkeszto.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const K = (): SzerkesztettKeszlet =>
  loadHelyek(join(HERE, "..", "registry", "fekvo", "helyek.json")) as SzerkesztettKeszlet;
const MOST = "2026-09-08T12:00:00Z";
const CTX = (foglalt: string[] = []) =>
  ({ foglaltHelyek: new Set(foglalt), most: MOST });

const M = (x: Partial<Muvelet> = {}): Muvelet => ({
  fajta: "atnevez", hely: "hely.osztaly.gyermekagyas", hatalyos: "2026-10-01",
  ki: "Demó Adminisztrátor", nev: "Gyermekágyas osztály (új név)", ...x,
});

/* ── AZ ALAPKAPUK ────────────────────────────────────────────────────── */

test("szerkesztő megnevezése nélkül nincs művelet", () => {
  const r = vegrehajthato(K(), M({ ki: "  " }), CTX());
  assert.equal(r.allapot, "nincsSzerkeszto");
  assert.match(r.miert, /ki látja majd az ott fekvő beteget/);
});

test("HATÁLYBALÉPÉSI DÁTUM NÉLKÜL a változás „mindig is így volt” alakot ölt", () => {
  const r = vegrehajthato(K(), M({ hatalyos: "" }), CTX());
  assert.equal(r.allapot, "nincsHatalyDatum");
  assert.match(r.miert, /a tavalyi\s+osztályos statisztika megváltozik/);
});

test("A SZERKESZTÉS NEM VISSZAMENŐLEGES", () => {
  const r = vegrehajthato(K(), M({ hatalyos: "2025-01-01" }), CTX());
  assert.equal(r.allapot, "visszamenoleges");
  assert.match(r.miert, /utólag megváltoznának/);
});

/* ── AMIBEN BETEG FEKSZIK, AZ NEM SZERKESZTHETŐ ──────────────────────── */

test("foglalt hely nem helyezhető át és nem zárható le", () => {
  const foglalt = CTX(["hely.agy.gya.1"]);
  const at = vegrehajthato(K(), M({ fajta: "athelyez",
    hely: "hely.osztaly.gyermekagyas", szulo: "hely.reszleg.nogyogyaszat" }), foglalt);
  assert.equal(at.allapot, "foglalt");
  assert.match(at.miert, /eldönthetetlenné válna/);

  const le = vegrehajthato(K(), M({ fajta: "lezar", ok: "felújítás" }), foglalt);
  assert.equal(le.allapot, "foglalt");
});

test("az ÁTNEVEZÉS foglalt hely mellett is mehet — a beteg helye nem változik", () => {
  const r = vegrehajthato(K(), M(), CTX(["hely.agy.gya.1"]));
  assert.equal(r.vegrehajthato, true);
});

/* ── A FA ÉPSÉGE ─────────────────────────────────────────────────────── */

test("a hely nem tehető a SAJÁT LESZÁRMAZOTTJA alá", () => {
  const r = vegrehajthato(K(), M({ fajta: "athelyez",
    hely: "hely.osztaly.gyermekagyas", szulo: "hely.szoba.G1" }), CTX());
  assert.equal(r.allapot, "ertelmetlenFa");
  assert.match(r.miert, /kétszer számolna|TÁGABB fajtának/);
});

test("a fajtasorrend megfordítása nem megy", () => {
  const r = vegrehajthato(K(), M({ fajta: "athelyez",
    hely: "hely.szoba.G1", szulo: "hely.agy.gya.5" }), CTX());
  assert.equal(r.allapot, "ertelmetlenFa");
  assert.match(r.miert, /a szülőnek TÁGABB fajtának kell lennie/);
});

test("új hely felvétele a lánc szabályai szerint", () => {
  const jo = vegrehajthato(K(), M({ fajta: "letrehoz", hely: "hely.szoba.G4",
    nev: "Gyermekágyas G4", fajta_uj: "szoba", szulo: "hely.alosztaly.gya.1em" }), CTX());
  assert.equal(jo.vegrehajthato, true);

  const rossz = vegrehajthato(K(), M({ fajta: "letrehoz", hely: "hely.reszleg.uj",
    nev: "Új részleg", fajta_uj: "reszleg", szulo: "hely.szoba.G1" }), CTX());
  assert.equal(rossz.allapot, "ertelmetlenFa");
});

/* ── A LEZÁRÁS ───────────────────────────────────────────────────────── */

test("LEZÁRÁS OK NÉLKÜL nem lezárás, csak eltűnés", () => {
  const r = vegrehajthato(K(), M({ fajta: "lezar", hely: "hely.szoba.G3", ok: "" }), CTX());
  assert.equal(r.allapot, "nincsOk");
  assert.match(r.miert, /felújítás, összevonás vagy\s+bezárás történt-e/);
});

test("lezárt szülő alatt élő gyerek: MEGSZAKADT LÁNC", () => {
  const r = vegrehajthato(K(), M({ fajta: "lezar", hely: "hely.szoba.G3",
    ok: "felújítás" }), CTX());
  assert.equal(r.allapot, "vanAlatta");
  assert.match(r.miert, /csendben kiesne/);
});

test("lentről felfelé viszont mehet", () => {
  let k = K();
  k = alkalmaz(k, M({ fajta: "lezar", hely: "hely.agy.gya.5", ok: "ágy kivonva" }));
  const r = vegrehajthato(k, M({ fajta: "lezar", hely: "hely.szoba.G3",
    ok: "felújítás" }), CTX());
  assert.equal(r.vegrehajthato, true);
  assert.match(r.miert, /A hely NEM\s+törlődik/);
});

/* ── A VÁLTOZÁS ÚJ SZAKASZT NYIT ─────────────────────────────────────── */

test("AZ ÁTHELYEZÉS NEM ÍRJA ÁT A MÚLTAT", () => {
  const k0 = K();
  const regiUt = lanc(k0, "hely.agy.gya.1").utvonal;
  assert.match(regiUt, /Szülészeti részleg/);

  const k1 = alkalmaz(k0, M({ fajta: "athelyez", hely: "hely.osztaly.gyermekagyas",
    szulo: "hely.reszleg.nogyogyaszat", hatalyos: "2026-10-01" }));

  // A MOSTANI (2026-09) szerkezet szerint még a szülészeti részleg alatt van…
  const most = keszletAkkor(k1, MOST);
  assert.match(lanc(most, "hely.agy.gya.1").utvonal, /Szülészeti részleg/);

  // …2026 novemberében viszont már a nőgyógyászati alatt.
  const kesobb = keszletAkkor(k1, "2026-11-01T00:00:00Z");
  assert.match(lanc(kesobb, "hely.agy.gya.1").utvonal, /Nőgyógyászati részleg/);
});

test("az átnevezés is szakaszt nyit — a régi név megmarad a múltra", () => {
  const k = alkalmaz(K(), M({ nev: "Perinatális osztály", hatalyos: "2026-10-01" }));
  const szakaszok = k.helyek.filter((h) => h.id === "hely.osztaly.gyermekagyas");
  assert.equal(szakaszok.length, 2);
  assert.equal(keszletAkkor(k, MOST).helyek
    .find((h) => h.id === "hely.osztaly.gyermekagyas")!.nev, "Gyermekágyas osztály");
  assert.equal(keszletAkkor(k, "2026-11-01T00:00:00Z").helyek
    .find((h) => h.id === "hely.osztaly.gyermekagyas")!.nev, "Perinatális osztály");
});

test("az érvényesség három állapota", () => {
  const h = { id: "x", fajta: "szoba" as const, nev: "x", resze: null,
    ervenyesTol: "2026-05-01", ervenyesIg: "2026-08-01" };
  assert.equal(ervenyes(h, "2026-04-01"), "megNem");
  assert.equal(ervenyes(h, "2026-06-01"), "ervenyes");
  assert.equal(ervenyes(h, "2026-09-01"), "lezart");
});

/* ── A MÚLTBELI HIVATKOZÁS ───────────────────────────────────────────── */

test("a tavalyi fekvés nem hivatkozhat olyan helyre, ami akkor nem létezett", () => {
  let k = K();
  k = alkalmaz(k, M({ fajta: "letrehoz", hely: "hely.szoba.uj", nev: "Új szoba",
    fajta_uj: "szoba", szulo: "hely.alosztaly.gya.1em", hatalyos: "2026-10-01" }));
  const e = validateHivatkozasok(k, [
    { esemeny: "adt-1", hely: "hely.szoba.uj", mikor: "2025-03-01" }]);
  assert.equal(e.length, 1);
  assert.match(e[0].message, /ahol az nem történhetett/);
});

test("törölt helyre hivatkozó esemény: HIBA — ezért nincs törlés", () => {
  const k = K();
  const e = validateHivatkozasok(k, [
    { esemeny: "adt-2", hely: "hely.szoba.torolt", mikor: "2025-03-01" }]);
  assert.equal(e.length, 1);
  assert.match(e[0].message, /ezért ` *\n? *`?nincs törlés, csak lezárás|nincs törlés, csak lezárás/);
});

test("a párhuzamosan nyitott szakasz HIBA", () => {
  const k = K();
  const h = k.helyek.find((x) => x.id === "hely.szoba.G1")!;
  k.helyek.push({ ...h, resze: "hely.osztaly.terhespat", ervenyesTol: "2026-10-01" });
  const e = validateIdozites(k).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /az összegzés kétszer veszi/);
});

test("ok nélküli lezárás figyelmeztet", () => {
  const k = K();
  k.helyek.find((x) => x.id === "hely.agy.folyoso.1")!.ervenyesIg = "2026-06-01";
  const w = validateIdozites(k).filter((i) => i.severity === "warning");
  assert.equal(w.length, 1);
  assert.match(w[0].message, /felújítás,\s+összevonás vagy bezárás/);
});
