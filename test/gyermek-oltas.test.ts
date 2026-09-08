/**
 * A GYERMEKORVOSI OLTÁSI OLDAL — a KÉT REKORD, nem a második naptár.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { loadOltasok } from "../core/vedono/oltas.ts";
import {
  egyesit, merleg, oltasiAllas, validateGyermekOltas,
} from "../core/gyermek/oltas.ts";

const K = () => loadOltasok("registry/vedono/oltasok.json");
const CSECSEMO = { korHonap: 20 };

test("A NAPTÁR EGY — a gyermekorvosi modul a 30. modul naptárát használja", () => {
  assert.equal(validateGyermekOltas(K()).length, 0);
  const h = validateGyermekOltas(K(), K()).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /A naptár EGY/);
});

test("AMIT A GYERMEKORVOS BEADOTT, a védőnői oldalon ma hiányzónak látszik", () => {
  const e = egyesit([], [{ oltas: "MMR (1.)", allapot: "beadva",
    mikor: "2027-03-01", tetelszam: "A1" }]);
  assert.equal(e[0].allapot, "csakGyermekorvos");
  assert.match(e[0].miert, /ami megtörtént/);
});

test("A DOKUMENTÁLT ELLENJAVALLAT ÁTVITELE a súlyosabb irány", () => {
  const e = egyesit([], [{ oltas: "Varicella (1.)", allapot: "ellenjavallt",
    indok: "immunszuppresszió" }]);
  assert.equal(e[0].allapot, "csakGyermekorvos");
  assert.match(e[0].miert, /jogkövetkezménnyel jár/,
    "a védőnői oldalon mulasztásnak látszik az, ami éppen kizárja a mulasztást");
});

test("AZ EGYESÍTÉS NEM DEDUPLIKÁL — az ütközés mindkét bejegyzést megtartja", () => {
  const e = egyesit(
    [{ oltas: "MMR (1.)", allapot: "beadva", mikor: "2027-03-01", tetelszam: "A1" }],
    [{ oltas: "MMR (1.)", allapot: "beadva", mikor: "2027-05-02", tetelszam: "B7" }]);
  assert.equal(e.length, 1);
  assert.equal(e[0].allapot, "utkozes");
  assert.equal(e[0].bejegyzesek.length, 2, "egyik sem esett el");
  assert.equal(e[0].gepilegFeloldhato, false);
  assert.match(e[0].miert, /KÉTSZERI BEADÁS, vagy elgépelés/);
});

test("az EGYEZŐ bejegyzés nem ütközés", () => {
  const b = { allapot: "beadva" as const, mikor: "2027-03-01", tetelszam: "A1" };
  const e = egyesit([{ oltas: "MMR (1.)", ...b }], [{ oltas: "MMR (1.)", ...b }]);
  assert.equal(e[0].allapot, "egyezik");
  assert.equal(e[0].gepilegFeloldhato, true);
});

test("ÜTKÖZÉSNÉL a sor NEM kap esedékességi ítéletet", () => {
  const s = oltasiAllas(K(), CSECSEMO,
    [{ oltas: "MMR (1.)", allapot: "beadva", mikor: "2027-03-01", tetelszam: "A1" }],
    [{ oltas: "MMR (1.)", allapot: "beadva", mikor: "2027-05-02", tetelszam: "B7" }]);
  const mmr = s.find((x) => x.oltas === "MMR (1.)")!;
  assert.equal(mmr.allapot, "utkozes");
  assert.equal(mmr.jelentendo, false);
  assert.deepEqual(mmr.forrasok, ["vedono", "gyermekorvos"]);
  assert.match(mmr.miert, /valakinek meg kell néznie az oltási könyvet/);
});

test("a feloldott bejegyzés VISZONT beszámít — bármelyik oldalról", () => {
  const s = oltasiAllas(K(), CSECSEMO, [],
    [{ oltas: "MMR (1.)", allapot: "beadva", mikor: "2027-03-01", tetelszam: "A1" }]);
  assert.equal(s.find((x) => x.oltas === "MMR (1.)")!.allapot, "beadva",
    "a gyermekorvosnál beadott oltás nem marad „hiányzik”");
});

test("a mérleg megkülönbözteti az ütközést az egyoldalú bejegyzéstől", () => {
  const v = [{ oltas: "MMR (1.)", allapot: "beadva" as const,
    mikor: "2027-03-01", tetelszam: "A1" }];
  const o = [{ oltas: "MMR (1.)", allapot: "beadva" as const,
    mikor: "2027-05-02", tetelszam: "B7" },
    { oltas: "Varicella (1.)", allapot: "ellenjavallt" as const, indok: "immunszuppresszió" }];
  const m = merleg(oltasiAllas(K(), CSECSEMO, v, o), egyesit(v, o));
  assert.equal(m.utkozes, 1);
  assert.equal(m.csakEgyikRekordban, 1);
  assert.equal(m.evfolyamNelkul, 4,
    "és a négy kampányoltás iskolai évfolyam nélkül továbbra is eldönthetetlen");
});
