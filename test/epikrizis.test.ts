/**
 * A 09. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/09-epikrizis.md`:
 *
 *   „Egy teljes esetből az öt stílus mindegyike generálható, és a klinikai
 *    narratíva nem tartalmaz olyan állítást, ami nincs a rögzített adatban.
 *    Ez géppel részben ellenőrizhető: minden generált számnak és kódnak
 *    visszavezethetőnek kell lennie egy `variableId`-ra."
 *
 * És a modul legfontosabb tervezési döntése:
 *
 *   „A klinikus a meg nem jelent kockázati blokkot könnyen negatív leletnek
 *    olvassa. Az epikrízisben ezért az információhiány EXPLICIT, nem üresség."
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { epicrisis, buildEpicrisis, render, traceability } from "../core/epikrizis/build.ts";
import type { EpicrisisStyle } from "../core/epikrizis/types.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));

const NOW = "2026-09-02T10:00:00Z";
const STYLES: EpicrisisStyle[] = ["clinical", "sbar", "discharge", "nursing", "consult"];

/** Szintetikus eset: 32. hét, súlyos praeeclampsia gyanúja, hiányos anamnézissel. */
function teljesEset(): CaseState {
  const lmp = new Date(Date.parse(NOW) - 32 * 7 * 86_400_000).toISOString().slice(0, 10);
  let st: CaseState = { ctx: { encounter: "emergency", now: NOW }, values: {}, errors: [] };
  st = setValue(REG, st, "ctx.pregnant", "pos");
  st = setValue(REG, st, "ctx.lmp", lmp);
  st = setValue(REG, st, "ctx.pathway", "pregnancy.pathology");
  st = setValue(REG, st, "anthro.height", 166);
  st = setValue(REG, st, "anthro.weight.prepregnancy", 72);
  st = setValue(REG, st, "anthro.weight.current", 86);
  st = setValue(REG, st, "vitals.bp.systolic", 172);
  st = setValue(REG, st, "vitals.bp.diastolic", 114);
  st = setValue(REG, st, "vitals.pulse", 96);
  st = setValue(REG, st, "lab.plt", 78);
  st = setValue(REG, st, "lab.ast", 148);
  st = setValue(REG, st, "lab.alp", 190);
  st = setValue(REG, st, "status.internal.edema", "abn");
  // Lepényelégtelenség: a végdiasztolés áramlás hiánya vörös zászlós kód.
  st = setValue(REG, st, "us.ua.enddiastolic", "absent");
  // …és egy „nem tudom": az anamnézis egy tétele nyitva maradt.
  st = setValue(REG, st, "hx.sys.asthma", "unk", { provenance: "patient" });
  return recompute(REG, st);
}

const allText = (e: ReturnType<typeof epicrisis>) =>
  e.sections.flatMap((s) => s.segments.map((g) => g.text)).join(" | ");

/* ── 1. Mind az öt stílus generálható ────────────────────────────────── */

test("mind az öt stílus generálható ugyanabból az esetből", () => {
  const st = teljesEset();
  for (const style of STYLES) {
    const e = epicrisis(REG, st, style);
    assert.ok(e.sections.length > 0, `${style}: üres`);
    assert.ok(render(e).length > 100, `${style}: túl rövid`);
  }
});

test("a dátumot adó kalkulátor dátumként jelenik meg, nem epoch-számként", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const edd = e.sections.flatMap((s) => s.segments)
    .find((g) => g.from.includes("calc.edd.naegele"))!;
  assert.match(edd.text, /\d{4}-\d{2}-\d{2}/, edd.text);
  assert.doesNotMatch(edd.text, /\d{12}/, "nem nyers epoch-ezredmásodperc");
});

test("a sáv a KIMENETET írja le, nem a bemenetet", () => {
  // Az enoxaparin-adag sávjai korábban a testsúly-tartományt írták le, és a
  // 40 mg-os adag mellé az „alacsony testsúly" felirat került.
  const e = epicrisis(REG, teljesEset(), "clinical");
  const lmwh = e.sections.flatMap((s) => s.segments)
    .find((g) => g.from.includes("calc.lmwh.prophylaxis"))!;
  assert.doesNotMatch(lmwh.text, /testsúly/, lmwh.text);
});

test("a stílus a szakaszok sorrendjét dönti el, nem azt, mi igaz", () => {
  const st = teljesEset();
  const clinical = epicrisis(REG, st, "clinical");
  const sbar = epicrisis(REG, st, "sbar");
  // Ugyanaz a kockázati szakasz, ugyanazokkal a szegmensekkel.
  const c = clinical.sections.find((s) => s.id === "risk")!;
  const b = sbar.sections.find((s) => s.id === "risk")!;
  assert.deepEqual(c.segments.map((x) => x.text), b.segments.map((x) => x.text));
});

/* ── 2. AZ ELFOGADÁSI KRITÉRIUM: minden állítás visszavezethető ──────── */

test("minden szegmensnek van forrása, és minden forrás létező", () => {
  const st = teljesEset();
  for (const style of STYLES) {
    const t = traceability(REG, epicrisis(REG, st, style));
    assert.ok(t.ok, `${style}: ${JSON.stringify(t.problems)}`);
  }
});

test("a score-ok mellett ott a BEMENETI PILLANATKÉP is", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const scores = e.sections.flatMap((s) => s.segments).filter((g) => g.kind === "score");
  assert.ok(scores.length > 0);
  for (const s of scores) {
    assert.ok(s.inputs, `${s.text}: nincs bemeneti pillanatkép`);
    assert.ok(s.evidence, `${s.text}: nincs bizonyíték`);
  }
});

test("a forrásváltozó a szegmensen van, nem csak a szövegben", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const seg = e.sections.flatMap((s) => s.segments)
    .find((g) => g.text.startsWith("Testtömegindex"))!;
  assert.ok(seg.from.includes("calc.bmi"));
  assert.ok(seg.from.includes("anthro.height"));
});

/* ── 3. AMIT NEM TUDUNK — a modul legfontosabb döntése ───────────────── */

test("van „amit nem tudunk” szakasz, és nem üres", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const gap = e.sections.find((s) => s.id === "gap");
  assert.ok(gap, "a hiány-szakasz megjelenik");
  assert.ok(gap!.segments.length > 0);
});

test("a „nem tudom” válasz megjelenik, nem hallgatjuk el", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const gap = e.sections.find((s) => s.id === "gap")!;
  const texts = gap.segments.map((s) => s.text).join(" | ");
  assert.match(texts, /nem tudta megmondani/);
  assert.ok(gap.segments.some((s) => s.from.includes("hx.sys.asthma")));
});

test("az ELKEZDETT, de be nem fejezett számítás megjelenik a hiányzó bemenetekkel", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const gap = e.sections.find((s) => s.id === "gap")!;
  // Az energiaszükséglethez négy bemenet kell; három megvan, az életkor nem.
  const energia = gap.segments.find((s) => s.from.includes("calc.energy.pregnancy"));
  assert.ok(energia, "a félbemaradt számítás megjelenik");
  assert.match(energia!.text, /nem számolható/);
  assert.ok(energia!.from.includes("patient.age"), "a hiányzó bemenet néven nevezve");
});

test("amihez hozzá SEM KEZDTÜNK, az nem hiány — különben elveszne a valódi", () => {
  // Egy praeeclampsiás sürgősségi felvételen senki nem várt Apgar-pontszámot
  // vagy hirsutismus-score-t. Ha minden nem alkalmazható kalkulátor megjelenne
  // „nem számolható" felirattal, a szakasz használhatatlanná válna — épp az
  // veszne el benne, ami valóban hiányzik.
  const e = epicrisis(REG, teljesEset(), "clinical");
  const gap = e.sections.find((s) => s.id === "gap")!;
  const froms = gap.segments.flatMap((s) => s.from);
  assert.ok(!froms.includes("calc.apgar"), "az Apgar nem hiány ezen a felvételen");
  assert.ok(!froms.includes("calc.ferrimanGallwey"));
  assert.ok(!froms.includes("calc.epds.total"));
});

test("a motor által beírt `ctx.now` önmagában nem tesz egy számítást „elkezdetté”", () => {
  // A `ctx.now`-t minden esetre a motor írja be. Ha az „elkezdett"-nek
  // számítana, minden időt használó kalkulátor hiányként jelenne meg —
  // ugyanaz a csapda, mint amikor a click-open mérőszám magát mérte.
  let st: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  st = recompute(REG, setValue(REG, st, "vitals.pulse", 88));
  const gap = epicrisis(REG, st, "clinical").sections.find((s) => s.id === "gap");
  const froms = (gap?.segments ?? []).flatMap((s) => s.from);
  assert.ok(!froms.includes("calc.age"), "az életkor nem hiány pusztán attól, hogy „most” van");
  assert.ok(!froms.includes("calc.rom.hours"));
});

test("a kifejezetten KÉRT score hiánya akkor is megjelenik, ha hozzá sem kezdtünk", () => {
  // Ha a hívó megnevezi, hogy erre a score-ra számít, a hiánya információ.
  const e = epicrisis(REG, teljesEset(), "clinical", { scores: ["calc.apgar"] });
  const gap = e.sections.find((s) => s.id === "gap")!;
  assert.ok(gap.segments.some((s) => s.from.includes("calc.apgar")));
});

test("a LEJÁRT érték külön megjelenik — a régi labor nem a mai állapot", () => {
  // Az érvényességi ablak kontextusfüggő: ambuláns ellátásban a thrombocyta
  // 30 napig érvényes. Egy nyolc hónapos érték ezen kívül esik — és NEM
  // hiányzóként, hanem LEJÁRTKÉNT kell megjelennie, hogy látsszon: volt adat,
  // csak nem a maié.
  let st: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  st = setValue(REG, st, "ctx.pregnant", "pos");
  st = setValue(REG, st, "lab.plt", 210, { t: "2026-01-01T08:00:00Z" });
  const e = epicrisis(REG, st, "clinical");
  const gap = e.sections.find((s) => s.id === "gap")!;
  assert.ok(gap.segments.some((s) => /LEJÁRT/.test(s.text) && s.from.includes("lab.plt")),
    gap.segments.map((s) => s.text).join(" | "));
});

test("a feldolgozási hiba is az epikrízisben látszik", () => {
  const st = teljesEset();
  st.errors = [{ where: "modul.10", message: "a partogram-modul nem futott le" }];
  const e = epicrisis(REG, st, "clinical");
  const gap = e.sections.find((s) => s.id === "gap")!;
  assert.ok(gap.segments.some((s) => /nem futott le/.test(s.text)));
});

test("az ÁTADÁSI stílus is viszi a hiány-szakaszt", () => {
  // Átadáskor a legtöbb kár abból származik, amit az átadó tudott, de nem mondott.
  const e = epicrisis(REG, teljesEset(), "sbar");
  assert.ok(e.sections.some((s) => s.id === "gap"));
});

/* ── 4. A kockázati szakasz összegyűjt, nem újraszámol ───────────────── */

test("a vörös zászlós rögzített érték megjelenik a kockázatok között", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const risk = e.sections.find((s) => s.id === "risk")!;
  assert.ok(risk.segments.some((s) => s.severity === "redflag"));
});

test("a laboreltérés a KONTEXTUSHOZ tartozó referencia szerint jelenik meg", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const t = allText(e);
  // 78 ×10⁹/L thrombocyta a 3. trimeszteri sáv alatt
  assert.match(t, /Thrombocytaszám: 78.*a referencia alatt.*pregnancy\.t3/);
  // 190 U/L alkalikus foszfatáz viszont a 3. trimeszterben NORMÁLIS —
  // ezért nem jelenik meg eltérésként.
  assert.doesNotMatch(t, /Alkalikus foszfatáz.*referencia felett/);
});

test("a javaslat megnevezi, mi váltotta ki", () => {
  const e = epicrisis(REG, teljesEset(), "clinical");
  const rec = e.sections.find((s) => s.id === "recommendation");
  assert.ok(rec);
  for (const s of rec!.segments) {
    assert.ok(s.from.length === 1 && REG.get(s.from[0]), `${s.text}: nincs kiváltó mező`);
  }
});

/* ── 5. A NYITOTT KÉRDÉS: hogyan készült ─────────────────────────────── */

test("a dokumentum neve OKOSLELET, és kimondja, hogy nem nyelvi modell írta", () => {
  // Az „AI lelet" azt ígérné, ami nincs. Az „okos" azt mondja, ami igaz: a
  // lelet magától áll össze, és kimondja, mit nem tud.
  const e = epicrisis(REG, teljesEset(), "clinical");
  assert.equal(e.name, "Okoslelet");
  assert.equal(e.generation.method, "rule-based");
  assert.match(e.generation.note.hu!, /nincs nyelvi modell/);
  assert.match(render(e), /^# Okoslelet — /);
  assert.match(render(e), /OKOSLELET — SZABÁLYALAPÚ GENERÁLÁS/);
});

/* ── 6. Üres esetből sem hazudunk ────────────────────────────────────── */

test("üres esetből egyetlen állítás sem születik — sem tény, sem hiány", () => {
  // Az üres esetben nincs mit hiányolni: nem kezdtünk el semmit. A hiány
  // akkor információ, ha valamit MEGKEZDTÜNK és nem fejeztünk be.
  const blank: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  const e = epicrisis(REG, blank, "clinical");
  assert.deepEqual(e.sections, [], "üres esetből nem generálunk dokumentumot");
  assert.ok(traceability(REG, e).ok);
});

test("a szakaszok mindig a tartalomból jönnek — üres szakasz nem kerül be", () => {
  const blank: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  for (const s of buildEpicrisis(REG, blank)) {
    assert.ok(s.segments.length > 0, `${s.id}: üres szakasz került a dokumentumba`);
  }
});
