/**
 * A MINŐSÉGIRÁNYÍTÁSI DOKUMENTUMFA ÉS AZ ISO-KONTROLLMÁTRIX —
 * a 13. lépés gépi fele.
 *
 * A tesztek öt szabályt védenek:
 *
 *   1. az összegzés a SOROKBÓL jön, és a megfelelési fejezet vele egyezik;
 *   2. a dokumentum LEJÁR — a lejárt SOP nem hatályos, akkor sem, ha ott van;
 *   3. a kontroll állapota a bizonyítékdokumentumok sorsát KÖVETI;
 *   4. a jelölés nem állíthat többet, mint amit a bizonyíték fed;
 *   5. SOP feljegyzés nélkül nem bizonyít semmit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  dokumentumAllas, ELOJELZES_NAP, kerelemAllas, kontrollAllas, loadAllapot,
  loadFa, loadMatrix, merleg, osszegzes, validateMir,
} from "../core/mir/fa.ts";
import type { FaAllapot, HatalyosDokumentum } from "../core/mir/fa.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (...p: string[]) => join(HERE, "..", ...p);
const FA = loadFa(R("registry", "mir", "dokumentumfa.json"));
const MX = loadMatrix(R("registry", "mir", "iso20387.json"));
const A = loadAllapot(R("registry", "mir", "allapot.json"));
const MA = "2026-09-07";

const hatalyos = (
  doc: string, felulvizsgalat: string, bizonyitek: string[] = ["FORM-01"],
): HatalyosDokumentum => ({
  doc, verzio: "1.0", hatalyos: "2026-01-01", keszitette: "Teszt Anna",
  jovahagyta: "Teszt Béla", kovetkezoFelulvizsgalat: felulvizsgalat, bizonyitek,
});
const allapottal = (...h: HatalyosDokumentum[]): FaAllapot => ({ szerepek: {}, hatalyos: h });

/* ── 1. AZ ÖSSZEGZÉS A SOROKBÓL JÖN ─────────────────────────────────── */

test("a mátrix 45 kontrollsort tartalmaz", () => {
  assert.equal(MX.kontrollok.length, 45);
  const o = osszegzes(MX);
  assert.equal(o.reduce((n, s) => n + s.osszes, 0), 45);
});

test("AZ ÖSSZEGZÉS ÉS A MEGFELELÉSI FEJEZET TÁBLÁJA EGYEZIK", () => {
  // Ez a teszt a 13. lépés tényleges leletét őrzi: a kézzel gépelt összegzés
  // 45 sorból 39-et mondott, és MIND A NÉGY kategória számai eltértek.
  const md = readFileSync(R("docs", "megfeleles", "01-iso20387.md"), "utf8");
  const tabla = md.slice(md.indexOf("## Összegzés"));
  for (const s of osszegzes(MX)) {
    const sor = tabla.split("\n").find((l) => l.startsWith(`| ${s.cim} |`));
    assert.ok(sor, `hiányzó sor: ${s.cim}`);
    const c = sor!.split("|").map((x) => x.trim()).filter(Boolean);
    assert.deepEqual(c.slice(1, 5), [s.megvan, s.reszben, s.nincs, s.osszes].map(String),
      `${s.cim}: a fejezet táblája eltér a soroktól`);
  }
});

/* ── 2. A DOKUMENTUM LEJÁR ──────────────────────────────────────────── */

test("A LEJÁRT FELÜLVIZSGÁLATÚ DOKUMENTUM NEM HATÁLYOS", () => {
  const a = allapottal(hatalyos("SOP-01", "2026-06-01"));
  const d = dokumentumAllas(FA, a, MA).find((x) => x.doc === "SOP-01")!;
  assert.equal(d.allapot, "lejart");
  assert.equal(d.eros, false, "a polcon lévő, lejárt SOP nem bizonyít");
  assert.match(d.miert, /az audit pontosan ezt találja meg/);
  assert.equal(validateMir(FA, MX, a, MA).filter((i) => i.severity === "error" && i.id === "SOP-01").length, 1);
});

test("a felülvizsgálat 90 nappal előre szól, de a dokumentum még hatályos", () => {
  const a = allapottal(hatalyos("SOP-01", "2026-10-07"));
  const d = dokumentumAllas(FA, a, MA).find((x) => x.doc === "SOP-01")!;
  assert.equal(d.allapot, "felulvizsgalatEsedekes");
  assert.equal(d.eros, true);
  assert.equal(d.napMulva, 30);
  assert.equal(ELOJELZES_NAP, 90);
  const w = validateMir(FA, MX, a, MA).filter((i) => i.id === "SOP-01");
  assert.equal(w.length, 1);
  assert.equal(w[0].severity, "warning");
});

test("az előjelzési ablakon kívül nincs figyelmeztetés", () => {
  const a = allapottal(hatalyos("SOP-01", "2028-01-01"));
  assert.equal(dokumentumAllas(FA, a, MA).find((x) => x.doc === "SOP-01")!.allapot, "hatalyos");
  assert.equal(validateMir(FA, MX, a, MA).filter((i) => i.id === "SOP-01").length, 0);
});

/* ── 3. A KONTROLL KÖVETI A DOKUMENTUM SORSÁT ───────────────────────── */

test("A KONTROLL ÁLLAPOTA A BIZONYÍTÉKDOKUMENTUM SORSÁT KÖVETI", () => {
  const mx = JSON.parse(JSON.stringify(MX)) as typeof MX;
  const k = mx.kontrollok[0];
  k.bizonyitekDokumentumok = ["SOP-01", "SOP-02"];
  k.rogzitettAllapot = "nincs";

  // Egyik sincs meg.
  assert.equal(kontrollAllas(mx, FA, A, MA)[0].allapot, "bizonyitatlan");

  // Az egyik hatályba lép.
  const fel = allapottal(hatalyos("SOP-01", "2028-01-01"));
  assert.equal(kontrollAllas(mx, FA, fel, MA)[0].allapot, "reszben");

  // Mindkettő.
  const mind = allapottal(hatalyos("SOP-01", "2028-01-01"), hatalyos("SOP-02", "2028-01-01"));
  assert.equal(kontrollAllas(mx, FA, mind, MA)[0].allapot, "bizonyitott");

  // …és ha az egyik felülvizsgálata LEJÁR, a kontroll VELE ESIK KI.
  const lejart = allapottal(hatalyos("SOP-01", "2028-01-01"), hatalyos("SOP-02", "2026-06-01"));
  assert.equal(kontrollAllas(mx, FA, lejart, MA)[0].allapot, "reszben");
});

test("a NINCS BIZONYÍTÉK nem ugyanaz, mint a hiányzik", () => {
  const k = kontrollAllas(MX, FA, A, MA);
  assert.equal(k.filter((x) => x.allapot === "nincsBizonyitek").length, 45);
  assert.match(k[0].miert, /azt sem írtuk le, MIVEL bizonyítanánk/);
});

test("az ismeretlen bizonyítékdokumentum építési hiba", () => {
  const mx = JSON.parse(JSON.stringify(MX)) as typeof MX;
  mx.kontrollok[0].bizonyitekDokumentumok = ["SOP-99"];
  const hibak = validateMir(FA, mx, A, MA).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 2, "az ismeretlen hivatkozás ÉS a túlállító jelölés is hiba");
  assert.ok(hibak.some((h) => /ismeretlen bizonyítékdokumentum/.test(h.message)));
  // …és a második azért, mert a sor jelölése „részben”, a bizonyíték viszont semmi.
  assert.ok(hibak.some((h) => /a jelölés/.test(h.message)));
});

/* ── 4. A JELÖLÉS NEM ÁLLÍTHAT TÖBBET ───────────────────────────────── */

test("A KÉZZEL ÍRT JELÖLÉS NEM ÁLLÍTHAT TÖBBET, MINT AMIT A BIZONYÍTÉK FED", () => {
  const mx = JSON.parse(JSON.stringify(MX)) as typeof MX;
  mx.kontrollok[0].bizonyitekDokumentumok = ["SOP-01"];
  mx.kontrollok[0].rogzitettAllapot = "megvan";
  // SOP-01 nincs hatályban → a jelölés túlállít.
  const k = kontrollAllas(mx, FA, A, MA)[0];
  assert.equal(k.tulallit, true);
  const hibak = validateMir(FA, mx, A, MA).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /a jelölés/);
});

test("a bizonyíték nélküli jelölés EGY figyelmeztetés, nem negyvenöt", () => {
  const w = validateMir(FA, MX, A, MA)
    .filter((i) => /többet állít, mint amit bizonyíték fed/.test(i.message));
  assert.equal(w.length, 1);
  assert.match(w[0].message, /11\/45/);
});

/* ── 5. SOP FELJEGYZÉS NÉLKÜL ───────────────────────────────────────── */

test("A HATÁLYOS SOP ŰRLAP NÉLKÜL ÉPÍTÉSI HIBA", () => {
  // A fa saját szabálya, amit eddig semmi nem kényszerített ki.
  const a = allapottal(hatalyos("SOP-01", "2028-01-01", []));
  const hibak = validateMir(FA, MX, a, MA).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /nincs mit megmutatni/);
});

test("az eljárás (QP) nem kíván űrlapot, a SOP igen", () => {
  const a = allapottal(hatalyos("QP-01", "2028-01-01", []));
  assert.equal(validateMir(FA, MX, a, MA).filter((i) => i.severity === "error").length, 0);
});

test("a verzió és a jóváhagyó nélküli bejegyzés hiba", () => {
  const h = hatalyos("SOP-01", "2028-01-01");
  h.verzio = "";
  const hibak = validateMir(FA, MX, allapottal(h), MA).filter((i) => i.severity === "error");
  assert.ok(hibak.some((x) => /verziózás nem formalitás/.test(x.message)));
});

/* ── 6. AZ ELSŐ KÉRELEM KAPUJA ──────────────────────────────────────── */

test("az első kérelem az ELSŐ KÖRRE vár, nem mind a 37 dokumentumra", () => {
  const k = kerelemAllas(FA, A, MA);
  assert.equal(k.kerelmezheto, false);
  assert.equal(k.hianyzoElsoKor.length, 16);
  assert.match(k.miert, /nincs mit akkreditálni/);

  // Az első kör = politika + kézikönyv + a 14 minta-életciklus SOP.
  const elso = FA.dokumentumok.filter((d) => d.elsoKor);
  assert.equal(elso.length, 16);
  assert.equal(elso.filter((d) => d.csoport === "minta-eletciklus").length, 14);
});

test("a teljes első kör hatályban kinyitja a kaput", () => {
  const a = allapottal(...FA.dokumentumok.filter((d) => d.elsoKor)
    .map((d) => hatalyos(d.id, "2028-01-01")));
  const k = kerelemAllas(FA, a, MA);
  assert.equal(k.kerelmezheto, true);
  assert.match(k.miert, /nem a kérelem feltétele/);
});

test("EGYETLEN LEJÁRT FELÜLVIZSGÁLAT BEZÁRJA A KAPUT", () => {
  const lista = FA.dokumentumok.filter((d) => d.elsoKor)
    .map((d) => hatalyos(d.id, d.id === "SOP-07" ? "2026-06-01" : "2028-01-01"));
  const k = kerelemAllas(FA, allapottal(...lista), MA);
  assert.equal(k.kerelmezheto, false);
  assert.deepEqual(k.lejart, ["SOP-07"]);
  assert.match(k.miert, /az audit klasszikus lelete/);
});

/* ── 7. A KIINDULÓ ÁLLAPOT ──────────────────────────────────────────── */

test("a valódi regiszter az elvárt állapotban indul", () => {
  assert.equal(A.hatalyos.length, 0, "egyetlen dokumentum sincs hatályban");
  assert.equal(FA.dokumentumok.length, 37);
  const m = merleg(FA, MX, A, MA);
  assert.equal(m.hatalyos, 0);
  assert.equal(m.kontroll, 45);
  assert.equal(m.nincsBizonyitek, 45);
  assert.equal(m.kerelmezheto, false);
  assert.equal(validateMir(FA, MX, A, MA).filter((i) => i.severity === "error").length, 0);
});

test("a fa a megfelelési fejezet szerkezetét követi", () => {
  const csop = (c: string) => FA.dokumentumok.filter((d) => d.csoport === c).length;
  assert.equal(csop("iranyitasi"), 8);
  assert.equal(csop("eroforras"), 6);
  assert.equal(csop("minta-eletciklus"), 14);
  assert.equal(csop("adat-hozzaferes"), 7);
  assert.equal(FA.dokumentumok.filter((d) => d.szint === "politika").length, 1);
  assert.equal(FA.dokumentumok.filter((d) => d.szint === "kezikonyv").length, 1);
});
