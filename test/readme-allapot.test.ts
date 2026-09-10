/**
 * A README GENERÁLT ÁLLAPOTBLOKKJA.
 *
 * A README-ben három szám csúszott el egyszerre (894 helyett 905 változó, 1875
 * helyett 1939 teszt, és „kettőnél áll a gépi fele” a tizenöt helyett). Egyik
 * sem azért, mert valaki hanyag volt: azért, mert KÉZZEL VOLT ODAÍRVA, és a
 * kézzel írt szám a projekt saját szabálya szerint fél éven belül hazudik.
 *
 * Ezek a tesztek a gépiesítés két veszélyes pontját fedik le:
 *
 *   1. a BLOKKCSERE némán ne csináljon semmit, ha a jelölő hiányzik — egy néma
 *      no-op pontosan azt a hamis biztonságot adná, ami ellen az egész épül;
 *   2. a LÉPÉSKIOLVASÁS különböztesse meg a „MEGVAN”-t a „gépi fele MEGVAN”-tól.
 *      Egybeszámolva a README többet állítana, mint amennyi igaz.
 *
 * A tesztszám-kiolvasás (`tesztMerleg`) itt SZÁNDÉKOSAN NINCS TESZTELVE: egy
 * teljes tesztfuttatást indítana a tesztfuttatáson belül.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { lepesAllas } from "../tools/allapot-forras.ts";
import { allapotBlokk, blokkCsere, NYIT, ZAR } from "../tools/gen-readme-allapot.ts";

const README_MINTA = [
  "# OGDOC",
  "",
  "> **Jelenlegi állapot.** Fut a klinikai mag.",
  ">",
  `> ${NYIT}`,
  "> RÉGI SZÖVEG, RÉGI SZÁMOKKAL",
  `> ${ZAR}`,
  ">",
  "> **A rendszer valódi betegadaton nem futhat.**",
  "",
  "## Futtatás",
].join("\n");

test("a blokkcsere a jelölők közét cseréli, a többit érintetlenül hagyja", () => {
  const uj = blokkCsere(README_MINTA, "> ÚJ SZÖVEG");
  assert.ok(uj.includes("> ÚJ SZÖVEG"), "az új szöveg bekerült");
  assert.ok(!uj.includes("RÉGI SZÖVEG"), "a régi kikerült");
  assert.ok(uj.startsWith("# OGDOC"), "a fejléc megmaradt");
  assert.ok(uj.includes("> **A rendszer valódi betegadaton nem futhat.**"),
    "a blokk utáni szöveg megmaradt");
  assert.ok(uj.includes(NYIT) && uj.includes(ZAR), "a jelölők bent maradtak");
});

test("a blokkcsere IDEMPOTENS — kétszer futtatva ugyanaz jön ki", () => {
  const egyszer = blokkCsere(README_MINTA, "> ÚJ SZÖVEG");
  assert.equal(blokkCsere(egyszer, "> ÚJ SZÖVEG"), egyszer);
});

test("hiányzó nyitójelölő HIBA, nem néma átengedés", () => {
  assert.throws(() => blokkCsere("# OGDOC\n\ncsak szöveg\n", "> ÚJ"), /jelölő/i);
});

test("hiányzó zárójelölő HIBA", () => {
  assert.throws(() => blokkCsere(`# OGDOC\n> ${NYIT}\n> valami\n`, "> ÚJ"), /jelölő/i);
});

test("kétszer álló jelölő HIBA — nem tippelünk, melyiket cseréljük", () => {
  const ketszer = README_MINTA + "\n" + README_MINTA;
  assert.throws(() => blokkCsere(ketszer, "> ÚJ"), /egyszer/i);
});

test("a blokk kiírja mind a három számot", () => {
  const b = allapotBlokk({ valtozo: 905, tesztek: 1939, bukott: 0, teljes: 3, reszben: 15 });
  assert.match(b, /905/);
  assert.match(b, /1939/);
  assert.match(b, /\b3\b/);
  assert.match(b, /\b15\b/);
  for (const sor of b.split("\n")) {
    assert.match(sor, /^> /, `a blokk minden sora idézetben áll: ${JSON.stringify(sor)}`);
  }
});

test("bukott teszt esetén a blokk NEM ír „0 hibát”", () => {
  const b = allapotBlokk({ valtozo: 905, tesztek: 1939, bukott: 2, teljes: 3, reszben: 15 });
  assert.ok(!/0 hiba/i.test(b), "két bukott teszt mellett nem állíthatjuk, hogy nincs hiba");
  assert.match(b, /2 hiba/i, "a valódi hibaszámot kiírja — hangosan, de kiírja");
});

/* ── A LÉPÉSKIOLVASÁS ──────────────────────────────────────────────────── */

const LEPES_MINTA = [
  "# 13 — A tizennyolc lépés",
  "",
  "## 1. Az első lépés",
  "",
  "> **MEGVAN.** Ez kész, nincs több teendő.",
  "",
  "## 2. A második lépés",
  "",
  "> **A gépi fele MEGVAN, az emberi nem.** Aláírásra vár.",
  "",
  "## 3. A harmadik lépés",
  "",
  "> **NINCS.** Ehhez még hozzá sem kezdtünk.",
  "",
].join("\n");

test("a lépéskiolvasás elkülöníti a KÉSZ-t a „gépi fele kész”-től", () => {
  const a = lepesAllas(LEPES_MINTA);
  assert.equal(a.lepesek.length, 3);
  assert.equal(a.teljes, 1, "egy lépés van készen");
  assert.equal(a.reszben, 1, "egynél áll a gépi fele");
});

test("a jelzés nélküli lépés nem számít késznek", () => {
  const a = lepesAllas("## 1. Cím nélküli állapot\n\nSemmi idézetblokk.\n");
  assert.equal(a.teljes, 0);
  assert.equal(a.reszben, 0);
  assert.equal(a.lepesek[0].jelzes, null);
});
