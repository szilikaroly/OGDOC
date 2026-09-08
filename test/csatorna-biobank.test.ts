/**
 * CSATORNÁK, BIOBANK ÉS A HIÁNYJEGYZÉK.
 *
 * Három modul, egy közös elv: AMI HIÁNYZIK, AZT MEG KELL NEVEZNI, ÉS
 * MEGNEVEZNI KELL, KINÉL ÁLL. A hiány elhallgatása mindhárom helyen konkrét
 * kárt okoz — rossz laphoz kerülő mérést, rossz emberhez kötött mintát, vagy
 * egy beszerzést, amiről senki nem tudja, hogy rá vár.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bizalom, loadCsatornak, merleg as csMerleg, validateCsatornak,
} from "../core/interop/csatorna.ts";
import {
  ABC, TILTOTT_PAROK, azonositoEllenoriz, azonositoKepzes, betegadatGyanu, ellenorzoJegy,
  isberMerleg, loadIsber, mintaEllenoriz, validateIsber, vonalkodTartalom,
} from "../core/biobank/minta.ts";
import type { Minta } from "../core/biobank/minta.ts";
import {
  gyujt, loadHianyok, merleg as hMerleg, validateHianyok,
} from "../core/hianyzo/jegyzek.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CS = loadCsatornak(join(ROOT, "registry", "interop", "csatornak.json"));
const ISBER = loadIsber(join(ROOT, "registry", "biobank", "isber.json"));
const H = loadHianyok(join(ROOT, "registry", "hianyzo", "tetelek.json"));

/* ── CSATORNÁK ───────────────────────────────────────────────────────── */

test("a csatornakészlet hibátlan", () => {
  assert.deepEqual(validateCsatornak(CS).filter((i) => i.severity === "error"), []);
});

test("A SOROS VONAL NEM HORDOZ BETEGAZONOSÍTÓT — és ez tulajdonság, nem hiba", () => {
  const s = CS.csatornak.find((c) => c.id === "serial")!;
  assert.equal(s.betegazonosito, false);
  assert.equal(s.nyugtazas, false);
  assert.equal(s.idobelyeg, false);
  assert.equal(s.mertekegyseg, false);
  const b = bizalom(s);
  assert.equal(b.szint, "potlassal", "négy hiány, de mind a négyhez van pótlás");
  assert.equal(b.hianyzo.length, 4);
  assert.equal(b.potlas.length, 4);
  assert.match(b.miert, /nem a csatorna hibája, hanem a tulajdonsága/);
});

test("a szöveges bemenet ugyanezt a mintát követi", () => {
  const t = CS.csatornak.find((c) => c.id === "text")!;
  assert.equal(bizalom(t).szint, "potlassal");
  assert.ok(t.potlas.some((p) => /OCR/.test(p)),
    "a mértékegység pótlása az OCR-egységegyeztetőre mutat");
});

test("a HL7-csatorna önmagában elég", () => {
  assert.equal(bizalom(CS.csatornak.find((c) => c.id === "his")!).szint, "onmagabanEleg");
});

test("MŰKÖDŐ csatorna pótlás nélküli hiánnyal: BUILD-HIBA", () => {
  const rossz = { ...CS, csatornak: [{
    ...CS.csatornak.find((c) => c.id === "serial")!,
    allapot: "mukodik" as const, potlas: [],
  }] };
  const e = validateCsatornak(rossz).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /némán a rossz laphoz kerülhet/);
});

test("a kutatási export hiányzó betegazonosítója SZÁNDÉKOS", () => {
  const r = CS.csatornak.find((c) => c.id === "research")!;
  assert.equal(r.betegazonosito, false);
  assert.match(r.potlas[0], /SZÁNDÉKOSAN HIÁNYZIK/);
  assert.equal(csMerleg(CS).hianyos, 0, "egyetlen csatorna sincs pótlás nélkül");
});

/* ── MINTAAZONOSÍTÓ ──────────────────────────────────────────────────── */

test("egy összetéveszthető párból LEGFELJEBB EGY tag van bent", () => {
  // A pár akkor veszélyes, ha MINDKÉT tagja érvényes karakter: ilyenkor a
  // téves leolvasás egy MÁSIK LÉTEZŐ azonosítót ad. Ha csak az egyik érvényes,
  // a téves leolvasás alakhibára fut, és a rendszer azonnal elutasítja.
  for (const [a, b] of [["0", "O"], ["1", "I"], ["2", "Z"], ["5", "S"]] as const) {
    assert.ok(!(ABC.includes(a) && ABC.includes(b)),
      `${a} és ${b} EGYÜTT van bent — a téves leolvasás másik érvényes azonosítót adna`);
  }
  // A mindkét oldalon kétértelmű párokból egyik sem marad.
  for (const [a, b] of TILTOTT_PAROK) {
    assert.ok(!ABC.includes(a) && !ABC.includes(b), `${a}/${b}`);
  }
});

test("AZ ELLENŐRZŐ JEGY EGY KARAKTERES HIBÁT MINDIG megfog", () => {
  // Enélkül egy leolvasási hiba egy MÁSIK LÉTEZŐ minta azonosítóját adná.
  const torzs = "4K7QP9WX";
  const jo = azonositoKepzes(torzs);
  assert.equal(azonositoEllenoriz(jo).allapot, "ervenyes");
  let fogott = 0, osszes = 0;
  for (let i = 0; i < torzs.length; i++) {
    for (const c of ABC) {
      if (c === torzs[i]) continue;
      osszes++;
      const rossz = torzs.slice(0, i) + c + torzs.slice(i + 1);
      if (ellenorzoJegy(rossz) !== ellenorzoJegy(torzs)) fogott++;
    }
  }
  assert.equal(fogott, osszes, `${osszes - fogott} egy karakteres hiba átcsúszott`);
});

test("a SZOMSZÉDOS CSERÉT is megfogja — a súlyozás miatt", () => {
  // Súlyozás nélkül az `AB` és a `BA` ugyanazt a jegyet adná.
  const torzs = "4K7QP9WX";
  let fogott = 0, osszes = 0;
  for (let i = 0; i < torzs.length - 1; i++) {
    if (torzs[i] === torzs[i + 1]) continue;
    osszes++;
    const cs = torzs.slice(0, i) + torzs[i + 1] + torzs[i] + torzs.slice(i + 2);
    if (ellenorzoJegy(cs) !== ellenorzoJegy(torzs)) fogott++;
  }
  assert.equal(fogott, osszes);
});

test("a rossz alak és a rossz ellenőrző jegy KÜLÖN állapot", () => {
  assert.equal(azonositoEllenoriz("OG-4K7QP9W0-X").allapot, "alakHibas");
  assert.equal(azonositoEllenoriz("OG-4K7QP9WX-9").allapot, "ellenorzoJegyHibas");
});

test("AZ AZONOSÍTÓ NEM TARTALMAZHAT BETEGADATOT", () => {
  assert.match(betegadatGyanu("123456789")!, /TAJ-szám lehet/);
  assert.match(betegadatGyanu("MINTA-1985-03-12")!, /születési dátum/);
  assert.equal(betegadatGyanu(azonositoKepzes("4K7QP9WX")), null);
});

const m = (a: string, sz: string | null): Minta => ({
  azonosito: a, szuloje: sz, fajta: "szerum", vetel: "2026-09-01T08:00:00Z",
  taroloHomerseklet: -80, donorKod: "D-001",
});

test("AZ ALIKVOT VISSZAVEZETHETŐ a szülőmintára", () => {
  const gyoker = azonositoKepzes("4K7QP9WX");
  const a1 = azonositoKepzes("4K7QP9WW");
  const a2 = azonositoKepzes("4K7QP9WV");
  const mind = [m(gyoker, null), m(a1, gyoker), m(a2, a1)];
  const r = mintaEllenoriz(mind, a2);
  assert.equal(r.allapot, "rendben");
  assert.deepEqual(r.lanc, [a2, a1, gyoker]);
});

test("AZ ÁRVA ALIKVOT nem minta", () => {
  const a = azonositoKepzes("4K7QP9WW");
  const r = mintaEllenoriz([m(a, "OG-NINCSILY-X")], a);
  assert.equal(r.allapot, "arvaAlikvot");
  assert.match(r.miert, /nem köthető donorhoz/);
});

test("a vonalkód tartalma CSAK az azonosító", () => {
  const a = azonositoKepzes("4K7QP9WX");
  assert.equal(vonalkodTartalom(m(a, null)), `(90)${a}`);
  assert.throws(() => vonalkodTartalom(m("123456789", null)), /TAJ-szám/);
});

/* ── ISBER ───────────────────────────────────────────────────────────── */

test("az ISBER-térkép hibátlan, és a FEDETT tételekhez bizonyíték áll", () => {
  assert.deepEqual(validateIsber(ISBER).filter((i) => i.severity === "error"), []);
  for (const t of ISBER.tetelek.filter((x) => x.allapot === "fedett")) {
    assert.ok(t.bizonyitek.length, `${t.id}: fedett, de nincs bizonyíték`);
  }
});

test("a nem fedett tételek MEGNEVEZIK, mi hiányzik", () => {
  for (const t of ISBER.tetelek.filter((x) => x.allapot !== "fedett")) {
    assert.ok(t.hianyzik.length, `${t.id}: nem fedett, de nincs hiánylista`);
  }
});

test("az ISBER SZÖVEGE nincs átmásolva — a hivatkozás szakaszszám", () => {
  assert.match(ISBER.licencNote, /szerzői jogvédett/i);
  for (const t of ISBER.tetelek) {
    assert.ok(t.szakasz.trim(), `${t.id}: nincs szakaszhivatkozás`);
    assert.ok(t.kovetelmeny.length <= 400,
      `${t.id}: a leírás ${t.kovetelmeny.length} karakter — átvételnek látszik`);
  }
});

test("a mérleg a tételekből számol", () => {
  const x = isberMerleg(ISBER);
  assert.equal(x.osszes, ISBER.tetelek.length);
  assert.equal(x.fedett + x.reszben + x.nincs, x.osszes);
});

/* ── HIÁNYJEGYZÉK ────────────────────────────────────────────────────── */

test("MINDEN hiánytételnek van HIVATKOZÁSA és CÍMZETTJE", () => {
  assert.deepEqual(validateHianyok(H).filter((i) => i.severity === "error"), []);
  for (const t of H.tetelek) {
    assert.ok(t.hivatkozas.trim(), `${t.id}: nincs hivatkozás — nem lehet megkeresni`);
    assert.ok(t.kinel.trim(), `${t.id}: nincs címzett — senkinél áll`);
    assert.ok(t.mitNyit.length, `${t.id}: nem látszik, mit nyerünk vele`);
  }
});

test("a hivatkozás nélküli tétel BUILD-HIBA", () => {
  const rossz = { ...H, tetelek: [{ ...H.tetelek[0], hivatkozas: "" }] };
  const e = validateHianyok(rossz).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /nem feladat, hanem érzés/);
});

test("A JEGYZÉK GYŰJT: a modul saját hiánya bekerül, de nem másolódik", () => {
  const modul = ISBER.tetelek.filter((t) => t.hianyzik.length).map((t) => ({
    forras: "registry/biobank/isber.json", modul: 22, id: t.id, cim: t.cim,
    hianyzik: t.hianyzik, kinel: "biobank-vezető",
  }));
  const mind = gyujt(H, modul);
  const varhato = H.tetelek.length + modul.reduce((n, x) => n + x.hianyzik.length, 0);
  assert.equal(mind.length, varhato);
  // …és a derivált tételek megőrzik, MELYIK regiszter mondta ki őket.
  for (const t of mind.slice(H.tetelek.length)) {
    assert.match(t.forras, /registry\//);
  }
});

test("A TÖBBSÉG NEM FEJLESZTŐI FELADAT — és ez a jegyzék legfontosabb száma", () => {
  const x = hMerleg(H.tetelek);
  assert.ok(x.szervezeti > x.fejlesztoi * 5,
    "ha a többség fejlesztői volna, a rendszer állapotát rosszul értenénk");
  assert.equal(x.cimzettNelkul, 0);
  assert.ok(x.blokkolo > 0, "a blokkoló tételeket külön kell látni");
});
