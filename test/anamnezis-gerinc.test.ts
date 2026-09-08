/**
 * AZ ANAMNÉZIS-GERINC — a 4. lépés elfogadási kritériuma.
 *
 * *„Egy szintetikus eseten az anamnézis kitöltése után a CMQCC-, a VBAC-, a
 * Caprini- és a szűrési modul EGYETLEN TOVÁBBI KÉRDÉS NÉLKÜL megkapja a
 * bemeneteit, és ezt teszt bizonyítja."*
 *
 * A tét: ha a kódolt bevitel lassabb a gépelésnél, a klinikus kikerüli. Minden
 * modul, ami újra megkérdez valamit, amit a rendszer már tudhatna, ezt a
 * bukást hozza közelebb.
 *
 * AZ ESET SZINTETIKUS. Nincs benne valódi betegadat, és nem is lehet: a
 * repóban ilyen nem szerepelhet.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import { loadScreenings } from "../core/screening/registry.ts";
import {
  assessVerzes, loadVerzesTabla, validateVerzesTabla,
} from "../core/scores/verzes.ts";
import { assessVbac } from "../core/scores/vbac.ts";
import { assessVte } from "../core/scores/vte.ts";
import { forrasa, gerincAllapot } from "../core/anamnezis/gerinc.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (...p: string[]) => join(HERE, "..", ...p);

const REG = loadRegistry(R("registry", "variables"));
const TABLA = loadVerzesTabla(R("registry", "kockazat", "cmqcc-verzes.json"));
const SZUR = loadScreenings(R("registry", "szuresek"));
const NOW = "2026-09-05T09:00:00.000Z";

/**
 * A FELVÉTELI ADATOK: amit a felvételkor és az első viziten rögzítenek.
 *
 * Ez nem „további kérdés”: a születési dátum, a testmagasság, a terhesség
 * előtti testsúly, az utolsó menstruáció és az ikerterhesség ténye a
 * jelentkezéskor rögzül. Az életkor és a BMI ezekből LEVEZETETT — tárolt korral
 * a rekord egy év múlva hazudik.
 */
const FELVETEL: Array<[string, unknown]> = [
  ["patient.birthDate", "1990-04-12"],
  ["anthro.height", 166],
  ["anthro.weight.prepregnancy", 62],
  ["ctx.pregnant", "pos"],
  ["ctx.lmp", "2026-03-01"],
  ["ctx.multiple", "no"],
  ["ctx.parity.para", 1],
];

/** Egy szintetikus anamnézis — végigkérdezve, minden tételre válasszal. */
const ANAMNEZIS: Array<[string, unknown]> = [
  // Reprodukciós előzmény
  ["hx.repro.prevBirth.cs", 1],
  ["hx.repro.prevBirth.vaginal", 0],
  ["hx.repro.prevBirth.vbac", "neg"],
  ["hx.repro.prevBirth.recurringIndication", "neg"],
  ["hx.repro.prevBirth.pph", "pos"],
  ["hx.repro.gdm", "neg"],
  ["hx.repro.currentPregnancy.previa", "neg"],
  ["hx.repro.currentPregnancy.accreta", "neg"],
  // Belgyógyászati előzmény
  ["hx.sys.vte", "neg"],
  ["hx.sys.thrombophilia", "neg"],
  ["hx.sys.aps", "neg"],
  ["hx.sys.cardiac.congenital", "neg"],
  ["hx.sys.bleedingDisorder", "neg"],
  ["hx.sys.anemia", "pos"],
  ["hx.sys.myoma", "neg"],
  ["hx.sys.thyroid.hypo", "neg"],
  // Életmód
  ["hx.life.smoking", "never"],
];

function ures(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}

function tolt(tetelek: Array<[string, unknown]>, st = ures()): CaseState {
  let s = st;
  for (const [id, v] of tetelek) s = setValue(REG, s, id, v as never);
  return recompute(REG, s);
}

const FELVETT = tolt(FELVETEL);
const TELJES = tolt(ANAMNEZIS, FELVETT);

const GERINC = { verzesTabla: TABLA, szuresek: SZUR };

/* ── 1. AZ ELFOGADÁSI KRITÉRIUM ─────────────────────────────────────── */

test("kitöltött anamnézis után EGYIK modul sem kér további adatot", () => {
  const g = gerincAllapot(REG, TELJES, GERINC);
  for (const f of g.fogyasztok) {
    assert.deepEqual(f.hianyzo, [], `${f.label}: még kérne adatot`);
  }
  assert.deepEqual(g.kerdesek, [], "egyetlen kérdés sem maradt");
  assert.ok(g.keszen);
});

test("a négy nevesített modul mindegyike szerepel a mérlegben", () => {
  const g = gerincAllapot(REG, TELJES, GERINC);
  assert.deepEqual(g.fogyasztok.map((f) => f.id).sort(),
    ["szures", "vbac", "verzes", "vte"]);
});

test("a modulok nem csak hallgatnak — tényleg értékelnek", () => {
  // Egy „nincs hiányzó bemenet” állítás önmagában úgy is igaz lehetne, hogy a
  // modul nem csinál semmit. Ez a teszt azt méri, hogy a bemenetek MEG IS
  // JELENNEK a kimeneten.
  const v = assessVerzes(REG, TELJES, TABLA);
  assert.deepEqual(v.fennallo.map((t) => t.id).sort(), ["anemia", "priorCs", "priorPph"]);

  const vbac = assessVbac(REG, TELJES);
  assert.equal(vbac.factors.length, 3);
  assert.equal(vbac.contraindicated.yes, false);

  const vte = assessVte(REG, TELJES);
  // A 36 éves szintetikus eset életkora ÖNMAGÁBAN tényező (>35) — és ez a
  // felvételi dátumból vezetődik le, nem kérdésből.
  assert.deepEqual(vte.present.map((f) => f.id), ["age"]);
  assert.equal(vte.factors.some((f) => f.present === "unknown"), false);

  const due = SZUR.dueList(REG, TELJES);
  assert.equal(due.some((s) => s.status === "unknown"), false);
});

/* ── 2. AZ ANAMNÉZIS NÉLKÜL A GERINC HIÁNYOS ────────────────────────── */

test("anamnézis nélkül a hiányzó kérdések MIND az anamnézisből valók", () => {
  const g = gerincAllapot(REG, FELVETT, GERINC);
  assert.ok(!g.keszen);
  assert.ok(g.anamnezisHiany.length > 0);
  assert.match(g.osszefoglalo, /GERINC HIÁNYOS/);
  for (const k of g.anamnezisHiany) assert.ok(k.variable.startsWith("hx."));
});

test("egyetlen kihagyott anamnézis-tétel is megjelenik kérdésként", () => {
  // Hibabevitel: kiveszünk EGY választ, és megnézzük, hogy a gerinc elbukik-e.
  // Ha nem bukik el, a mérték nem mér semmit.
  for (const [id] of ANAMNEZIS) {
    const nelkule = tolt(ANAMNEZIS.filter(([x]) => x !== id), FELVETT);
    const g = gerincAllapot(REG, nelkule, GERINC);
    const erinti = g.kerdesek.some((k) => k.variable === id);
    // Nem minden anamnézis-tétel bemenete a négy modulnak — de amelyik igen,
    // annak hiánya kérdésként KELL megjelenjen.
    const bemenet = gerincAllapot(REG, FELVETT, GERINC)
      .kerdesek.some((k) => k.variable === id);
    if (bemenet) {
      assert.ok(erinti, `${id} kimaradt, mégsem lett belőle kérdés`);
      assert.ok(!g.keszen, `${id} nélkül a gerinc mégis késznek látszik`);
    }
  }
});

/* ── 3. A KÉRDÉS AZ, AMIT MEG KELL KÉRDEZNI ─────────────────────────── */

test("a számított mező helyett a BEMENETE a kérdés", () => {
  // Az `anthro.bmi` hiánya nem azt jelenti, hogy a BMI-t kérdezni kell —
  // hanem hogy a testmagasság vagy a testsúly hiányzik.
  const csakAnamnezis = tolt(ANAMNEZIS);
  const g = gerincAllapot(REG, csakAnamnezis, GERINC);
  const nevek = g.kerdesek.map((k) => k.variable);
  assert.ok(!nevek.includes("anthro.bmi"), "a BMI nem kérdés, a bemenete az");
  assert.ok(nevek.includes("anthro.height"));
  assert.ok(nevek.includes("anthro.weight.prepregnancy"));
  assert.ok(!nevek.includes("patient.age"), "a kor nem kérdés, a születési dátum az");
  assert.ok(nevek.includes("patient.birthDate"));
  const h = g.kerdesek.find((k) => k.variable === "anthro.height")!;
  assert.equal(h.szamitott, "anthro.bmi");
});

test("egy kérdés több modulhoz is tartozhat, és mindet megnevezi", () => {
  const csakAnamnezis = tolt(ANAMNEZIS);
  const g = gerincAllapot(REG, csakAnamnezis, GERINC);
  const iker = g.kerdesek.find((k) => k.variable === "ctx.multiple")!;
  assert.ok(iker.kinek.length >= 2, "az ikerterhesség két modulnak is kell");
});

test("a mérés nem kérdés — a hiánya nem az anamnézis hibája", () => {
  const g = gerincAllapot(REG, TELJES, GERINC);
  assert.ok(g.keszen);
  // Forrásbesorolás: minden előtag ismert, nincs besorolatlan.
  assert.deepEqual(g.besorolatlan, []);
  assert.equal(forrasa("lab.hgb"), "meres");
  assert.equal(forrasa("hx.sys.vte"), "anamnezis");
  assert.equal(forrasa("patient.birthDate"), "felvetel");
  assert.equal(forrasa("valami.uj"), "ismeretlen");
});

/* ── 4. A RÖGZÍTETT „NEM TUDOM” NEM „NEM” ───────────────────────────── */

test("a megkérdezett „nem tudom” nem lesz kockázathiány — VTE", () => {
  // A legsúlyosabb csendes hiba, amit ez a réteg megfoghat: „nem emlékszem,
  // volt-e thrombosisom” válaszból „nem volt thrombosisa” lesz, és a
  // profilaxis elmarad. A hiányzó thrombosis-profilaxis a megelőzhető anyai
  // halálozás vezető oka.
  const st = tolt([["hx.sys.vte", "unk"]], TELJES);
  const v = assessVte(REG, st);
  const f = v.factors.find((x) => x.id === "prevVte")!;
  assert.equal(f.present, "unknown", "a „nem tudom” nem válhat „nem”-mé");
  assert.deepEqual(v.nemTudja, ["hx.sys.vte"]);
  assert.deepEqual(v.missing, [], "megkérdeztük — ez nem hiányzó kérdés");
  assert.match(v.noTotal, /nem tudja/);
});

test("a megkérdezett „nem tudom” nem lesz kockázathiány — vérzés és VBAC", () => {
  const st = tolt([
    ["hx.repro.prevBirth.pph", "unk"],
    ["hx.repro.prevBirth.vbac", "unk"],
  ], TELJES);

  const v = assessVerzes(REG, st, TABLA);
  assert.equal(v.tenyezok.find((t) => t.id === "priorPph")!.fennall, "unknown");
  assert.deepEqual(v.nemTudja, ["hx.repro.prevBirth.pph"]);
  assert.deepEqual(v.hianyzo, []);

  const b = assessVbac(REG, st);
  assert.equal(b.factors.find((f) => f.id === "priorVbac")!.present, "unknown");
  assert.deepEqual(b.nemTudja, ["hx.repro.prevBirth.vbac"]);
  assert.deepEqual(b.missing, []);
});

test("a „nem tudom” a szűrésnél sem zárja ki a szűrést", () => {
  const st = tolt([["hx.repro.gdm", "unk"]], TELJES);
  const s = SZUR.evaluate(REG, st, "scr.gdm.ogtt.early");
  assert.equal(s.status, "unknown");
  assert.notEqual(s.status, "notApplicable");
});

test("a „nem tudom” MEGKÉRDEZETT — a gerincet nem teszi hiányossá", () => {
  // A különbség a lényeg: az újrakérdezés nem segít, tehát ez nem „további
  // kérdés”. De „nem”-mé sem válhat — ezt a fenti tesztek őrzik.
  const st = tolt([["hx.sys.vte", "unk"]], TELJES);
  const g = gerincAllapot(REG, st, GERINC);
  assert.deepEqual(g.anamnezisHiany, []);
  assert.ok(g.keszen);
});

/* ── 5. A VÉRZÉSI TÁBLA ─────────────────────────────────────────────── */

test("a vérzési kockázati tábla hiba nélkül validál", () => {
  const hibak = validateVerzesTabla(REG, TABLA).filter((i) => i.severity === "error");
  assert.deepEqual(hibak, []);
});

test("hitelesítetlen táblából SZINT NEM SZÜLETIK", () => {
  const v = assessVerzes(REG, TELJES, TABLA);
  assert.equal(v.szint, null);
  assert.match(v.nincsSzint!, /SZINT NEM SZÜLETIK/);
  // …de a tényezők attól még megvannak: ez kapu, nem hallgatás.
  assert.ok(v.fennallo.length > 0);
  assert.ok(v.tenyezok.every((t) => t.miert.length > 10));
});

test("a hitelesítetlen tábla figyelmeztetést ad, a hitelesítetlenség okát megnevezve", () => {
  const w = validateVerzesTabla(REG, TABLA).filter((i) => i.severity === "warning");
  assert.equal(w.length, 1);
  assert.match(w[0].message, /SZINTET NEM ÁLLAPÍT MEG/);
  assert.ok(TABLA.verificationNote?.hu?.includes("elsődleges forrás")
    || TABLA.verificationNote?.hu?.includes("ELSŐDLEGES FORRÁS"));
});

test("a tábla hibái HIBAKÉNT buknak el — nem futásidőben, némán", () => {
  const rossz = [
    { mit: "nem létező változó", t: { variable: "nincs.ilyen.valtozo" } },
    { mit: "ismeretlen szint", t: { szint: "kritikus" } },
    { mit: "kódlistán kívüli érték", t: { mikor: { eq: "talan" } } },
    { mit: "kétféle feltétel egyszerre", t: { mikor: { eq: "pos", gte: 1 } } },
    { mit: "indoklás nélkül", t: { miert: { hu: "  " } } },
  ];
  for (const { mit, t } of rossz) {
    const tabla = {
      ...TABLA,
      tenyezok: TABLA.tenyezok.map((x, i) => i === 0 ? { ...x, ...t } as never : x),
    };
    const hibak = validateVerzesTabla(REG, tabla).filter((i) => i.severity === "error");
    assert.ok(hibak.length > 0, `${mit}: nem lett hiba`);
  }
});

test("a számos feltétel nem számos változón hiba", () => {
  const tabla = {
    ...TABLA,
    tenyezok: TABLA.tenyezok.map((x) =>
      x.id === "priorPph" ? { ...x, mikor: { gte: 1 } } : x),
  };
  const hibak = validateVerzesTabla(REG, tabla).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /Számos feltétel/.test(h.message)));
});

/* ── 6. AMI LEVEZETETT, AZ LEVEZETETT MARAD ─────────────────────────── */

test("a kor és a BMI a felvételi adatokból áll elő, nem kérdésből", () => {
  assert.equal(resolve(REG, TELJES, "patient.age").value, 36);
  const bmi = resolve(REG, TELJES, "anthro.bmi");
  assert.equal(bmi.state, "ok");
  assert.ok(Number(bmi.value) > 20 && Number(bmi.value) < 25);
});
