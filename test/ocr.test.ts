/**
 * OCR-BEOLVASÁS — ahol a néma hiba nem a karakter, hanem a mértékegység.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import {
  BIZONYOSSAG_HATAR, beolvas, kanonikus, loadEgysegek, merleg, validateEgysegek,
} from "../core/ocr/beolvasas.ts";
import type { MezoSpec, OcrMezo } from "../core/ocr/beolvasas.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const K = () => loadEgysegek(join(HERE, "..", "registry", "ocr", "egysegek.json"));
const SPEC = new Map<string, MezoSpec>(
  REG.all().map((v) => [v.id, { id: v.id, unit: v.unit, domain: v.domain }]));
const CR = SPEC.get("lab.cr")!;
const M = (x: Partial<OcrMezo> = {}): OcrMezo =>
  ({ valtozo: "lab.cr", nyersErtek: "5,0", nyersEgyseg: "mg/dL", ...x });

test("az egységtábla hiba nélkül validál", () => {
  assert.equal(validateEgysegek(K(), SPEC).filter((i) => i.severity === "error").length, 0);
});

/* ── A KREATININ-PÉLDA: AMIT A TARTOMÁNY NEM VÉD ─────────────────────── */

test("A MÉRTÉKEGYSÉG NAGYSÁGRENDEKET MOZGAT — és a tartomány nem véd", () => {
  const helyes = beolvas(K(), CR, M({ nyersEgyseg: "mg/dl" }));
  assert.equal(helyes.allapot, "javasolhato");
  assert.equal(Math.round(helyes.ertek!), 442, "5,0 mg/dL = 442 µmol/L — veseelégtelenség");

  // Ugyanaz a szám µmol/L-ként: életszerű, a tartományon BELÜL, és hamis.
  const rossz = beolvas(K(), CR, M({ nyersEgyseg: "umol/l" }));
  assert.equal(rossz.allapot, "javasolhato");
  assert.equal(rossz.ertek, 5, "5 µmol/L a tartományon belül van — ezért nem véd a tartomány");
});

test("EGYSÉG NÉLKÜL NINCS BEÍRÁS — a nagyságrendből nem következtetünk", () => {
  const r = beolvas(K(), CR, M({ nyersEgyseg: "" }));
  assert.equal(r.allapot, "egysegNelkul");
  assert.equal(r.ertek, null);
  assert.match(r.miert, /a tartomány-ellenőrzés itt nem véd/);
});

test("az ismeretlen írásváltozatot felvenni kell, nem kitalálni", () => {
  const r = beolvas(K(), CR, M({ nyersEgyseg: "mg%%" }));
  assert.equal(r.allapot, "egysegIsmeretlen");
  assert.match(r.miert, /találgatni nem szabad/);
});

test("átváltás nélkül nem írunk be semmit", () => {
  const r = beolvas(K(), CR, M({ nyersEgyseg: "mmol/L" }));
  assert.equal(r.allapot, "egysegNemValthato");
  assert.match(r.miert, /NÉMA ÉS NAGYSÁGRENDEKET MOZGAT/);
});

/* ── AZ ÍRÁSVÁLTOZATOK ───────────────────────────────────────────────── */

test("a magyar leleteken szokásos alakok is felismerhetők", () => {
  const k = K();
  assert.equal(kanonikus(k, "Hgmm"), "mm[Hg]");
  assert.equal(kanonikus(k, "µmol/l"), "umol/L");
  assert.equal(kanonikus(k, "mcg"), "ug");
  assert.equal(kanonikus(k, "MG/DL"), "mg/dL");
  assert.equal(kanonikus(k, "  mmol / l "), "mmol/L");
  assert.equal(kanonikus(k, "kacsa"), null);
  assert.equal(kanonikus(k, ""), null);
});

test("a tizedesvessző és a tizedespont egyaránt olvasható", () => {
  assert.equal(beolvas(K(), CR, M({ nyersErtek: "5.0" })).ertek,
               beolvas(K(), CR, M({ nyersErtek: "5,0" })).ertek);
});

test("ami nem szám, az nem szám", () => {
  assert.equal(beolvas(K(), CR, M({ nyersErtek: "n. é." })).allapot, "szamNemOlvashato");
});

/* ── A BIZONYOSSÁG ───────────────────────────────────────────────────── */

test("a bizonytalan olvasat NEM „közelítő adat”", () => {
  const r = beolvas(K(), CR, M({ bizonyossag: BIZONYOSSAG_HATAR - 0.01 }));
  assert.equal(r.allapot, "bizonytalanOlvasat");
  assert.match(r.miert, /hanem másik érték/);
  assert.equal(beolvas(K(), CR, M({ bizonyossag: BIZONYOSSAG_HATAR })).allapot, "javasolhato");
});

test("a HIÁNYZÓ bizonyosság nem 1 — de nem is blokkol önmagában", () => {
  assert.equal(beolvas(K(), CR, M({ bizonyossag: null })).allapot, "javasolhato",
    "a hiányzó bizonyosság az egységkapun nem bukik el; a klinikusi megerősítés a védelem");
});

/* ── A TARTOMÁNY ─────────────────────────────────────────────────────── */

test("a tartományon kívüli érték OCR-hiba ÉS rossz egység is lehet", () => {
  const r = beolvas(K(), CR, M({ nyersErtek: "500", nyersEgyseg: "mg/dl" }));
  assert.equal(r.allapot, "tartomanyonKivul");
  assert.match(r.miert, /mindkettő ellenőrzést kíván, beírást egyik sem/);
});

/* ── A JAVASLAT NEM BEÍRÁS ───────────────────────────────────────────── */

test("a beolvasás JAVASLAT, klinikusi megerősítésre", () => {
  const r = beolvas(K(), CR, M());
  assert.match(r.miert, /klinikusi megerősítés nélkül nem ` *\n? *`?lesz|klinikusi megerősítés nélkül nem/);
  assert.ok(r.atvaltas, "az átváltás megjelenik, hogy visszakereshető legyen");
  assert.equal(r.eredeti.ertek, 5);
  assert.equal(r.eredeti.egyseg, "mg/dL");
});

test("a mérleg külön mutatja az egység miatt elakadtakat", () => {
  const m = merleg([
    beolvas(K(), CR, M()),
    beolvas(K(), CR, M({ nyersEgyseg: "" })),
    beolvas(K(), CR, M({ bizonyossag: 0.3 })),
  ]);
  assert.equal(m.mezo, 3);
  assert.equal(m.javasolhato, 1);
  assert.equal(m.egysegNelkul, 1);
  assert.equal(m.bizonytalan, 1);
});

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

test("az átváltásnak FORRÁSA kell legyen", () => {
  const k = K();
  k.atvaltasok["lab.cr"][0].forras = "";
  const e = validateEgysegek(k, SPEC).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /ugyanolyan találgatás, mint a\s+nagyságrendből következtetni/);
});

test("olyan átváltás, ami nem a mező egységére visz: HIBA", () => {
  const k = K();
  k.atvaltasok["lab.cr"][0].ra = "mmol/L";
  const e = validateEgysegek(k, SPEC).filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /vagy ami rosszabb, félrevisz/.test(x.message)));
});

test("a mg/dL → mmol/L NEM egyetlen szorzó — analitonként más", () => {
  const k = K();
  const glu = k.atvaltasok["lab.glucose.fasting"][0];
  const cr = k.atvaltasok["lab.cr"][0];
  assert.notEqual(glu.szorzo, cr.szorzo);
  assert.ok(glu.analitFuggo && cr.analitFuggo);
  assert.match(k.note, /a legrosszabb fajta egyszerűsítés/);
});
