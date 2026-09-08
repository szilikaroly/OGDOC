/**
 * A 12. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/12-onkologia.md`:
 *
 *   „Egy terhesség alatt diagnosztizált emlődaganat esetén a modul a
 *    gesztációs kor alapján jelzi, mely kezelési modalitások adhatók, és
 *    kötelezővé teszi a megosztott döntéshozatal dokumentálását."
 *
 * És a nyitott kérdés, ami egy magbeli hiányra mutatott:
 *
 *   „A FIGO-stádiumrendszerek lokalizációnként eltérnek és rendszeresen
 *    frissülnek… verziózott kódlistaként kerülnek a regiszterbe — enélkül egy
 *    retrospektív adat évekkel később félreértelmezhető."
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { readCode, validateVersionedCodes } from "../core/codes.ts";
import { pregnancyOncAdvice } from "../core/onc/pregnancy.ts";
import { resolve, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));

const NOW = "2026-09-02T16:00:00Z";
function onc(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}

/* ── 1. VERZIÓZOTT KÓDLISTÁK ────────────────────────────────────────── */

test("a verziózott kódlisták hiba nélkül validálnak", () => {
  assert.deepEqual(validateVersionedCodes(REG).filter((i) => i.severity === "error"), []);
});

test("a régi kód a SAJÁT verziója szerint olvasható", () => {
  const r = readCode(REG, "onc.gyn.figo.endometrium", "IA", "2009")!;
  assert.match(r.label, /2009/);
  assert.equal(r.version, "2009");
  assert.equal(r.currentVersion, "2023");
});

test("a MEGSZŰNT kód megszűntként jelenik meg, nem ismeretlenként", () => {
  // A 2009-es „II" a 2023-as listán nem szerepel.
  const r = readCode(REG, "onc.gyn.figo.endometrium", "II", "2009")!;
  assert.equal(r.retired, true);
  assert.match(r.caveat!, /a MAI listán már nem szerepel/);
  assert.match(r.caveat!, /a saját verziója szerint helyes/);
});

test("a MEGMARADT, de MÁST JELENTŐ kód a legveszélyesebb — és ki van mondva", () => {
  // A cervix „IB1" 2009-ben ≤ 4 cm volt, 2018-ban ≤ 2 cm. Ugyanaz a jelölés.
  const r = readCode(REG, "onc.gyn.figo.cervix", "IB1", "2009")!;
  assert.equal(r.retired, false);
  assert.equal(r.meaningChanged, true);
  assert.match(r.caveat!, /MÁST jelent/);
  assert.match(r.caveat!, /csendes/);
  assert.match(r.label, /4 cm/);
  assert.match(r.currentLabel!, /2 cm/);
});

test("az aktuális verzió szerinti kód nem kap figyelmeztetést", () => {
  const r = readCode(REG, "onc.gyn.figo.cervix", "IIIC1", "2018")!;
  assert.equal(r.retired, false);
  assert.equal(r.meaningChanged, false);
  assert.equal(r.caveat, undefined);
});

test("a verzióváltás oka is olvasható, nem csak a ténye", () => {
  const r = readCode(REG, "onc.gyn.figo.cervix", "IB1", "2009")!;
  assert.match(r.versionNote!, /UGYANAZ A JELÖLÉS, MÁS TARTALOM/);
});

test("a motor a RÖGZÍTÉSKORI verziót bélyegzi az értékre", () => {
  const st = setValue(REG, onc(), "onc.gyn.figo.cervix", "IB2");
  const r = resolve(REG, st, "onc.gyn.figo.cervix");
  assert.equal(r.codeSystemVersion, "2018");
  assert.equal(r.codeSystemOutdated, false);
});

test("új érték csak a JELENLEGI listából vehető fel", () => {
  // A 2009-es „II" endometrium-kód ma már nem rögzíthető.
  assert.throws(() => setValue(REG, onc(), "onc.gyn.figo.endometrium", "II"),
    /nem szerepel a kódszótárban/);
});

/* ── 2. AZ ELFOGADÁSI KRITÉRIUM — a modalitások ─────────────────────── */

function atWeek(w: number): CaseState {
  return setValue(REG, onc(), "onc.preg.gaAtDiagnosis", w);
}
const mod = (a: ReturnType<typeof pregnancyOncAdvice>, id: string) =>
  a.modalities.find((m) => m.modality === id)!;

test("az I. trimeszterben a kemoterápia KONTRAINDIKÁLT", () => {
  const a = pregnancyOncAdvice(REG, atWeek(9));
  assert.equal(a.trimester, 1);
  assert.equal(mod(a, "chemo").feasibility, "no");
  assert.match(mod(a, "chemo").why, /szervfejlődés/);
});

test("a II–III. trimeszterben feltételesen adható — és a feltétel ki van mondva", () => {
  const a = pregnancyOncAdvice(REG, atWeek(22));
  assert.equal(a.trimester, 2);
  assert.equal(mod(a, "chemo").feasibility, "conditional");
  assert.match(mod(a, "chemo").why, /legalább három hét/,
    "a csontvelő-mélypont miatti időablak a feltétel lényege");
  assert.match(mod(a, "chemo").why, /35\. hét után már nem kezdendő/);
});

test("a műtét a terhesség bármely szakában elvégezhető", () => {
  for (const w of [8, 20, 34]) {
    assert.equal(mod(pregnancyOncAdvice(REG, atWeek(w)), "surgery").feasibility, "yes");
  }
});

test("az immunterápiánál az ADATHIÁNY nem biztonságosság", () => {
  const a = pregnancyOncAdvice(REG, atWeek(20));
  assert.equal(mod(a, "immuno").feasibility, "no");
  assert.match(mod(a, "immuno").why, /adathiány NEM biztonságosságot jelent/i);
});

test("gesztációs kor nélkül EGYIK modalitásról sem mondunk semmit", () => {
  const a = pregnancyOncAdvice(REG, onc());
  assert.equal(a.gaWeeks, null);
  assert.ok(a.modalities.every((m) => m.feasibility === "unknown"));
  assert.match(a.modalities[0].why, /trimeszterenként az ellenkezőjére fordul/);
});

test("minden modalitás megnevezi a forrását", () => {
  for (const m of pregnancyOncAdvice(REG, atWeek(20)).modalities) {
    assert.ok(m.source.length > 30, m.modality);
  }
});

/* ── 3. AZ ELFOGADÁSI KRITÉRIUM — a megosztott döntéshozatal KAPUJA ── */

test("dokumentált megosztott döntéshozatal nélkül a kezelési terv NEM zárható le", () => {
  const a = pregnancyOncAdvice(REG, atWeek(20));
  assert.equal(a.sharedDecision.canProceed, false);
  assert.match(a.sharedDecision.reason, /NEM ZÁRHATÓ LE/);
  assert.ok(a.sharedDecision.missing.includes("onc.preg.sharedDecision"));
});

test("a pipa önmagában NEM elég: a megbeszélt lehetőségek is kellenek", () => {
  const st = setValue(REG, atWeek(20), "onc.preg.sharedDecision", true);
  const a = pregnancyOncAdvice(REG, st);
  assert.equal(a.sharedDecision.documented, true);
  assert.equal(a.sharedDecision.canProceed, false,
    "az egyetlen felkínált út melletti beleegyezés nem döntés");
  assert.deepEqual(a.sharedDecision.missing, ["onc.preg.decision.options"]);
});

test("mindkettővel a terv lezárható", () => {
  let st = setValue(REG, atWeek(20), "onc.preg.sharedDecision", true);
  st = setValue(REG, st, "onc.preg.decision.options",
    "Kezelés a terhesség folytatása mellett a II. trimesztertől; korai " +
    "szülésbefejezés a 34. héten; a terhesség megszakítása. Mindhárom mellett " +
    "és ellen szóló érvek megbeszélve.");
  const a = pregnancyOncAdvice(REG, st);
  assert.equal(a.sharedDecision.canProceed, true);
});

test("a rendszer NEM dönt a beteg helyett — és ezt ki is mondja", () => {
  const a = pregnancyOncAdvice(REG, atWeek(9));
  assert.match(a.sharedDecision.reason, /nem orvosi döntés/);
  assert.match(a.sharedDecision.reason, /nem hozza meg helyette/);
});

test("a keret nem kezelési terv — a caveat ezt kimondja", () => {
  const a = pregnancyOncAdvice(REG, atWeek(20));
  assert.match(a.caveat, /ÁLTALÁNOS keret, nem kezelési terv/);
  assert.match(a.caveat, /szülész és.*neonatológus/);
});

/* ── 4. Amit a modul külön kiemel ───────────────────────────────────── */

test("a „nem került szóba” fertilitásmegőrzés VÖRÖS ZÁSZLÓ", () => {
  const d = REG.get("onc.fertility.discussed")!;
  const no = d.valueSet!.find((o) => o.code === "no")!;
  assert.ok(no.flags?.includes("redflag"),
    "az időablak nem nyílik újra — a semleges „nem” itt mulasztás");
});

test("a bizonytalan jelentőségű variáns NEM pozitív lelet", () => {
  const d = REG.get("onc.gyn.germline")!;
  const vus = d.valueSet!.find((o) => o.code === "vus")!;
  assert.ok(vus.flags?.includes("unknown"));
  assert.match(d.documentation.pitfalls!.hu!, /nem alapozhat meg kockázatcsökkentő műtétet/);
});

test("a molekuláris besorolás hiánya a 2023-as stádium KORLÁTJA", () => {
  const d = REG.get("onc.gyn.molecular")!;
  assert.match(d.documentation.whyItMatters!.hu!, /a stádium korlátja/);
  assert.ok(d.valueSet!.some((o) => o.code === "notDone"));
});
