/**
 * A 33. modul — ahol ugyanaz a labor mást jelent.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { ertekelMeres } from "../core/ui/meres.ts";
import { loadAnalitok, merleg as analitMerleg, validateAnalitok } from "../core/lab/analit.ts";
import {
  endoMerleg, kockazatiAblak, szulesUtaniUjraertekeles, validateEndo,
} from "../core/endo/diabetes.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const AN = () => loadAnalitok(join(HERE, "..", "registry", "labor", "analit-csoportok.json"));
const NOW = "2026-09-08T10:00:00Z";

function allapot(preg: string, gaHet: number | null, id: string, ertek: number): CaseState {
  let st: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  st = setValue(REG, st, "ctx.pregnant", preg);
  if (gaHet != null) {
    const lmp = new Date(Date.parse(NOW) - Math.round(gaHet * 7) * 86_400_000);
    st = setValue(REG, st, "ctx.lmp", lmp.toISOString().slice(0, 10));
  }
  st = setValue(REG, st, id, ertek);
  return recompute(REG, st);
}

/* ── A KRITIKUS KÜSZÖB IS KONTEXTUSFÜGGŐ ─────────────────────────────── */

test("UGYANAZ AZ ÉRTÉK, MÁS KONTEXTUS, MÁS ÍTÉLET", () => {
  const nem = ertekelMeres(REG, allapot("neg", null, "lab.glucose.fasting", 5.8),
    "lab.glucose.fasting");
  assert.notEqual(nem.allapot, "kritikus",
    "terhességen kívül 5,8 nem éri el a 7,0-s kritikus határt");

  const terhes = ertekelMeres(REG, allapot("pos", 26, "lab.glucose.fasting", 5.8),
    "lab.glucose.fasting");
  assert.equal(terhes.allapot, "kritikus",
    "terhesen 5,8 a GDM diagnosztikus küszöbe fölött van");
  assert.equal(terhes.kontextus, "pregnancy.t2");
});

test("ISMERETLEN TERHESSÉGI ÁLLAPOTNÁL A SZIGORÚBB KÜSZÖB ÉRVÉNYES", () => {
  const r = ertekelMeres(REG, allapot("unk", null, "lab.glucose.fasting", 5.8),
    "lab.glucose.fasting");
  assert.equal(r.allapot, "kritikus");
  assert.match(String(r.kontextus), /nem dönthető el/);
  assert.match(r.miert, /kontextus küszöbe szerint/);
});

test("a kontextusfüggő küszöb nem rontja el a normális esetet", () => {
  const r = ertekelMeres(REG, allapot("pos", 26, "lab.glucose.fasting", 4.5),
    "lab.glucose.fasting");
  assert.notEqual(r.allapot, "kritikus");
});

/* ── AZ ANALIT-CSOPORT ───────────────────────────────────────────────── */

test("ugyanaz az analit, két mező — és a különbségnek oka van", () => {
  const i = validateAnalitok(AN(), REG);
  assert.equal(i.filter((x) => x.severity === "error").length, 0,
    "terhességben a két mező küszöbe már egyezik");
  const w = i.filter((x) => x.severity === "warning");
  assert.equal(w.length, 1, "terhességen kívül SZÁNDÉKOSAN eltérnek");
  assert.match(w[0].message, /Kimondott ok:/);
});

test("OK NÉLKÜLI ELTÉRÉS: HIBA", () => {
  const k = AN();
  delete k.csoportok[0].eltéresOka;
  const e = validateAnalitok(k, REG).filter((x) => x.severity === "error");
  assert.ok(e.length >= 1);
  assert.match(e[0].message, /semmi nem\s+vetette össze őket/);
});

test("eltérő mértékegységű tagok: HIBA", () => {
  const k = AN();
  k.csoportok[0].egyseg = "mg/dL";
  const e = validateAnalitok(k, REG).filter((x) => x.severity === "error");
  assert.ok(e.some((x) => /a különbség számnak látszik/.test(x.message)));
});

test("a csoport mérlege a sorokból jön", () => {
  const m = analitMerleg(AN(), REG);
  assert.equal(m.csoport, 1);
  assert.equal(m.tag, 2);
  assert.equal(m.kontextusfuggo, 2, "mindkét tag kontextusfüggő küszöböt kapott");
});

/* ── A KÉT DIABÉTESZ ─────────────────────────────────────────────────── */

test("A SZERVFEJLŐDÉS IDEJÉN CSAK A PRAEGESTATIÓS AD KOCKÁZATOT", () => {
  const prae = kockazatiAblak({ fajta: "praeT2" }, 8);
  assert.equal(prae.allapot, "szervfejlodes");
  assert.equal(prae.magzatiKockazat, true);
  assert.match(prae.miert, /A ndash|A magzati kockázat MOST áll fenn/);

  const gdm = kockazatiAblak({ fajta: "gdm" }, 8);
  assert.equal(gdm.magzatiKockazat, false,
    "GDM a 8. héten még nem derült ki — a szervfejlődés a diagnózis előtt lezajlik");
});

test("a fogamzás előtti HbA1c hiánya MEGNEVEZVE jelenik meg", () => {
  const a = kockazatiAblak({ fajta: "praeT1" }, 7);
  assert.match(a.miert, /NEM ISMERT — és ez a legfontosabb szám/);
  const b = kockazatiAblak({ fajta: "praeT1", fogamzasElottiHba1c: 6.4 }, 7);
  assert.match(b.miert, /6\.4%/);
});

test("AZ ISMERETLEN CUKORBETEGSÉG NEM „NINCS”", () => {
  const a = kockazatiAblak({ fajta: "ismeretlen" }, 8);
  assert.equal(a.allapot, "nemErtelmezheto");
  assert.match(a.miert, /EZ NEM „NINCS”/);
  assert.match(a.miert, /ha a kérdés fel sem merül/);
});

/* ── A SZÜLÉS UTÁNI ÚJRAÉRTÉKELÉS ────────────────────────────────────── */

test("A GDM NEM SZŰNIK MEG A SZÜLÉSSEL — csak nem mérik többé", () => {
  const u = szulesUtaniUjraertekeles({ fajta: "gdm" }, 8);
  assert.equal(u.allapot, "hianyzik");
  assert.match(u.miert, /JEL, nem hiány/);
});

test("a megnevezett ok elmaradás, nem hiány", () => {
  const u = szulesUtaniUjraertekeles({ fajta: "gdm" }, 8,
    { elmaradasOka: "a beteg külföldre költözött" });
  assert.equal(u.allapot, "elmaradt");
});

test("praegestatiósnál nincs mit újraértékelni — FOLYTATÓDIK", () => {
  const u = szulesUtaniUjraertekeles({ fajta: "praeT1" }, 8);
  assert.equal(u.allapot, "folytatodik");
});

test("az ablak előtt még nem esedékes", () => {
  assert.equal(szulesUtaniUjraertekeles({ fajta: "gdm" }, 2).allapot, "nemEsedekes");
});

/* ── AZ ENDOKRIN NÉMASÁG, MEGSZÁMOLVA ────────────────────────────────── */

test("az endokrin mérések nagy része NÉMA — és ez számmal áll", () => {
  const endo = REG.all().filter((v) =>
    /^lab\.(17ohp|amh|antitpo|cortisol|dheas|fsh|ft3|ft4|glucose|hba1c|lh|ogtt|prl|testosterone|tsh)/
      .test(v.id));
  const m = endoMerleg(endo);
  assert.ok(m.meres >= 15, `${m.meres} endokrin mérés`);
  assert.ok(m.nema > 0, `${m.nema} néma — sem küszöb, sem referencia`);
  const w = validateEndo(m);
  assert.equal(w.length, 1);
  assert.match(w[0].message, /a rendszer nem mond róluk semmit/);
});
