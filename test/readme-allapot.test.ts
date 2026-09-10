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
  assert.ok(uj.includes("## Futtatás"), "a fájl végi szakasz is megmaradt");
  assert.ok(uj.includes("> **Jelenlegi állapot.** Fut a klinikai mag."),
    "a blokk előtti próza megmaradt");
  assert.ok(uj.includes(NYIT) && uj.includes(ZAR), "a jelölők bent maradtak");
});

test("a blokkcsere IDEMPOTENS — kétszer futtatva ugyanaz jön ki", () => {
  const egyszer = blokkCsere(README_MINTA, "> ÚJ SZÖVEG");
  assert.equal(blokkCsere(egyszer, "> ÚJ SZÖVEG"), egyszer);
});

test("hiányzó nyitójelölő HIBA — a záró MEGVAN, csak a nyitó nincs", () => {
  // A feltétel IZOLÁLVA: ha mindkét jelölő hiányozna, egy olyan hibás
  // implementáció is átmenne, ami csak a záró hiányát veszi észre.
  const csakZar = `# OGDOC\n> ${ZAR}\nvége\n`;
  assert.throws(() => blokkCsere(csakZar, "> ÚJ"), /nyitó/i);
});

test("hiányzó zárójelölő HIBA", () => {
  assert.throws(() => blokkCsere(`# OGDOC\n> ${NYIT}\n> valami\n`, "> ÚJ"), /jelölő/i);
});

test("kétszer álló NYITÓ jelölő HIBA — nem tippelünk, melyiket cseréljük", () => {
  const sorok = README_MINTA.split("\n");
  sorok.splice(2, 0, `> ${NYIT}`);          // csak a nyitó duplázva
  assert.throws(() => blokkCsere(sorok.join("\n"), "> ÚJ"), /nyitó.*egyszer|egyszer/is);
});

test("kétszer álló ZÁRÓ jelölő HIBA", () => {
  const sorok = README_MINTA.split("\n");
  sorok.push(`> ${ZAR}`);                    // csak a záró duplázva
  assert.throws(() => blokkCsere(sorok.join("\n"), "> ÚJ"), /záró.*egyszer|egyszer/is);
});

/* ── AMIT A KERESZTELLENŐRZÉS TALÁLT ───────────────────────────────────── */

test("a jelölő EGÉSZ SORKÉNT illeszkedik, részszövegként nem", () => {
  // Ha részszövegként illeszkedne, ezen a soron elavult kézi szám maradhatna,
  // és a `--check` zölden átmenne fölötte — épp az a hiba, ami miatt ez a
  // fájl megszületett.
  const sorok = README_MINTA.split("\n").map((sor) =>
    sor.includes(NYIT) ? `${sor} KÉZI SZÁM: 1875 teszt` : sor);
  assert.throws(() => blokkCsere(sorok.join("\n"), "> ÚJ"), /nyitó/i);
});

test("a jelölő megtalálása CRLF-es fájlban is működik, és a sorvég megmarad", () => {
  const crlf = README_MINTA.replace(/\n/g, "\r\n");
  const uj = blokkCsere(crlf, "> ÚJ SZÖVEG");
  assert.ok(uj.includes("> ÚJ SZÖVEG"), "a csere megtörtént");
  assert.ok(!/[^\r]\n/.test(uj), "nem keletkezett vegyes sorvég");
  assert.equal(blokkCsere(uj, "> ÚJ SZÖVEG"), uj, "CRLF mellett is idempotens");
});

test("a beírandó blokk NEM tartalmazhat jelölőt", () => {
  assert.throws(() => blokkCsere(README_MINTA, `> valami\n> ${NYIT}`), /jelölőt/i);
});

test("az üres blokk nulla sor, nem egy üres sor", () => {
  const uj = blokkCsere(README_MINTA, "");
  const sorok = uj.split("\n");
  const nyit = sorok.findIndex((s) => s.includes(NYIT));
  const zar = sorok.findIndex((s) => s.includes(ZAR));
  assert.equal(zar - nyit, 1, "a két jelölő közvetlenül egymás után áll");
});

test("a blokk kiírja mind a három számot", () => {
  const b = allapotBlokk({ valtozo: 905, tesztek: 1939, bukott: 0, teljes: 3, reszben: 15 });
  // Konkrét szöveget várunk, nem puszta számjegy-előfordulást: a mezők
  // felcserélése így nem tud átcsúszni az ellenőrzésen.
  assert.ok(b.includes("**905 változó**"), "a változószám a helyén");
  assert.ok(b.includes("**1939 teszt**"), "a tesztszám a helyén");
  assert.ok(b.includes("**3 kész**"), "a kész lépések száma a helyén");
  assert.ok(b.includes("**15-nél a gépi fele áll"), "a félkész lépések száma a helyén");
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
