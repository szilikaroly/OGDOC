/**
 * FEDÉSEK — mely mezők fedik ugyanazt, és mi lett velük.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import {
  QBL_KUSZOB_ML, loadFedesek, merleg, onkarositas, validateFedesek, verzesOsszeg,
} from "../core/fedes/feloldas.ts";
import {
  kezelesTeljesseg, visszavonas, LISTA_FRISSESSEG_NAP,
} from "../core/profil/profil.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const F = () => loadFedesek(join(HERE, "..", "registry", "fedes", "dontesek.json"));

/* ── A DÖNTÉSEK ──────────────────────────────────────────────────────── */

test("a döntéslista hiba nélkül validál", () => {
  assert.equal(validateFedesek(F(), REG).filter((i) => i.severity === "error").length, 0);
});

test("a `kulon` ítélet is INDOKLÁST kíván", () => {
  const k = F();
  k.dontesek[4].miert = "";
  const e = validateFedesek(k, REG).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /a következő olvasó ugyanúgy duplikátumnak látja/);
});

test("ELISMERT FEDÉS FELOLDÁS NÉLKÜL: hiba — rosszabb a fel nem ismertnél", () => {
  const k = F();
  const f = k.dontesek.find((d) => d.itelet === "fedes")!;
  delete f.feloldas;
  const e = validateFedesek(k, REG).filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /a tudás megvan, és mégsem történik semmi/.test(x.message)));
});

test("a NYITOTT fedés megnevezett feladat, nem elfelejtett kérdés", () => {
  const w = validateFedesek(F(), REG).filter((i) => i.severity === "warning");
  assert.equal(w.length, merleg(F()).nyitott);
  assert.ok(w.length >= 2);
  for (const x of w) assert.match(x.message, /NYITOTT fedés/);
});

test("a mérleg a sorokból jön", () => {
  const k = F(); const m = merleg(k);
  assert.equal(m.dontes, k.dontesek.length);
  assert.equal(m.kulon + m.fedes, m.dontes);
  assert.ok(m.fedes >= 4);
});

/* ── A VÉRVESZTÉS FELOLDÁSA ──────────────────────────────────────────── */

test("A BETEG EGY, ÉS A VÉR, AMIT ELVESZÍTETT, UGYANAZ", () => {
  const o = verzesOsszeg({ labourMl: 400, opMl: 700, vajudott: true });
  assert.equal(o.osszesenMl, 1100);
  assert.equal(o.reszlegesE, false);
  // Külön egyik szakasz sem érte volna el a maga küszöbét (300 / 1000).
  assert.ok(400 > QBL_KUSZOB_ML, "a szülészeti rész önmagában is átlépné a 300-at");
  assert.ok(700 < 1000, "a műtéti rész önmagában NEM érte volna el az 1000-et");
});

test("A HIÁNYZÓ SZAKASZ NEM NULLA — az összeg alsó becslés", () => {
  const o = verzesOsszeg({ opMl: 700, vajudott: true });
  assert.equal(o.osszesenMl, 700);
  assert.equal(o.reszlegesE, true);
  assert.deepEqual(o.hianyzo, ["labour.qbl"]);
  assert.match(o.miert, /LEGALÁBB 700 mL/);
});

test("aki nem vajúdott, ott a szülészeti érték nem hiányzik", () => {
  const o = verzesOsszeg({ opMl: 700, vajudott: false });
  assert.equal(o.reszlegesE, false);
  assert.deepEqual(o.hianyzo, []);
});

test("semmiből nem lesz nulla", () => {
  const o = verzesOsszeg({ vajudott: true });
  assert.equal(o.osszesenMl, null);
});

/* ── AZ ÖNKÁROSÍTÁS FELOLDÁSA ────────────────────────────────────────── */

test("BÁRMELY ESZKÖZBEN POZITÍV — az összpontszámtól függetlenül teendő", () => {
  const a = onkarositas([
    { eszkoz: "EPDS Q10", ertek: 2 }, { eszkoz: "PHQ-9 Q9", ertek: null }]);
  assert.equal(a.allapot, "pozitiv");
  assert.equal(a.teendo, true);
  assert.deepEqual(a.pozitivEszkozok, ["EPDS Q10"]);
  assert.match(a.miert, /egy újabb kérdőív nem írja felül a korábbit/);
});

test("A FEL NEM TETT KÉRDÉS NEM NEMLEGES", () => {
  const a = onkarositas([
    { eszkoz: "EPDS Q10", ertek: null }, { eszkoz: "PHQ-9 Q9", ertek: null }]);
  assert.equal(a.allapot, "nemKerdeztek");
  assert.equal(a.teendo, false);
  assert.match(a.miert, /EZ NEM NEMLEGES/);
  assert.match(a.miert, /nullaként viselkedne/);
});

test("minden feltett tétel nemleges — de a kimaradt látszik", () => {
  const a = onkarositas([
    { eszkoz: "EPDS Q10", ertek: 0 }, { eszkoz: "PHQ-9 Q9", ertek: null }]);
  assert.equal(a.allapot, "nemleges");
  assert.deepEqual(a.kimaradt, ["PHQ-9 Q9"]);
});

/* ── A 35. MODUL KÉT MARADÉK KRITÉRIUMA ──────────────────────────────── */

test("A VISSZAVONÁS NEM TÖRLI A TÖRTÉNELMET", () => {
  const v = visszavonas({ masolatok: 3, osszefoglaloKeszult: true,
    klinikusOlvasta: true, atvettAllitasok: 2, auditNaplo: true });
  assert.equal(v.gepilegElvegezheto, false);
  const sors = Object.fromEntries(v.tetelek.map((t) => [t.sors, true]));
  assert.ok(sors.torlendo && sors.visszavonando && sors.megtartando);
  const audit = v.tetelek.find((t) => /auditnapló/.test(t.mi))!;
  assert.equal(audit.sors, "megtartando");
  assert.match(audit.miert, /Az auditnapló törlése a visszavonás ellentéte/);
});

test("olvasatlan összefoglaló a forrásával együtt megy", () => {
  const v = visszavonas({ masolatok: 1, osszefoglaloKeszult: true,
    klinikusOlvasta: false, atvettAllitasok: 0, auditNaplo: true });
  assert.equal(v.gepilegElvegezheto, true);
  assert.equal(v.tetelek.find((t) => /összefoglaló/.test(t.mi))!.sors, "torlendo");
});

test("auditnapló nélkül maga a visszavonás sem bizonyítható", () => {
  const v = visszavonas({ masolatok: 1, osszefoglaloKeszult: false,
    klinikusOlvasta: false, atvettAllitasok: 0, auditNaplo: false });
  assert.equal(v.gepilegElvegezheto, false);
  assert.match(v.miert, /a\s+visszavonás sem bizonyítható/);
});

test("A LEJÁRT TELJESSÉG NEM „MAJDNEM TELJES”", () => {
  const most = "2026-09-08T12:00:00Z";
  const friss = kezelesTeljesseg(
    { forras: "eeszt", beleegyezes: true, mikor: "2026-09-01" }, most);
  assert.equal(friss.allapot, "teljesListaval");

  const regi = kezelesTeljesseg(
    { forras: "eeszt", beleegyezes: true, mikor: "2026-05-01" }, most);
  assert.equal(regi.allapot, "nemTudjuk");
  assert.match(regi.miert, /TELJES VOLT — AKKOR/);
  assert.match(regi.miert, /a friss hiány\s+pontosan ott van, ahol a kockázat/);
  assert.ok(regi.naposKor! > LISTA_FRISSESSEG_NAP);
});

test("beleegyezés nélkül nincs EESZT-lista, a jelölés nem pótolja", () => {
  const r = kezelesTeljesseg(
    { forras: "eeszt", beleegyezes: false, mikor: "2026-09-01" },
    "2026-09-08T12:00:00Z");
  assert.equal(r.allapot, "nemTudjuk");
  assert.match(r.miert, /a jelölés önmagában nem\s+pótolja/);
});

test("a beteg elmondása ÉRTÉKES, de a hiánya nem bizonyíték", () => {
  const r = kezelesTeljesseg({ forras: "beteg" }, "2026-09-08T12:00:00Z");
  assert.equal(r.allapot, "csakElmondasAlapjan");
  assert.match(r.miert, /ami nem\s+hangzott el, arról nem következik, hogy nincs/);
});
