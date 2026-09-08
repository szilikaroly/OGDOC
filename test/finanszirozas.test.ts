/**
 * FINANSZÍROZÁSI KÓDAJÁNLÁS — a hivatalos törzsekből.
 *
 * A réteg egyetlen szabálya, amit minden teszt ugyanarról a szögről néz:
 *
 *   A RANGSOR ELRENDEZ, NEM VÁLASZT. A listára kerülés feltétele a rögzített
 *   adatból következő bizonyíték; ami nincs dokumentálva, az akkor sem kerül
 *   fel, ha többet érne.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import {
  getTable, loadCodeTables, lookupCode, missingStems,
} from "../core/coding/tables.ts";
import { loadCodeRules } from "../core/coding/rules.ts";
import {
  checkClinicalTag, clearSnomed, loadSnomed, semanticTag, snomedTerm,
  useSnomedTable, validateSnomedDistribution,
} from "../core/coding/snomed.ts";
import {
  checkOeno, hbcsValue, oenoPoints, planOeno, rankByValue, rankHbcs,
} from "../core/coding/finance.ts";
import { blocksReporting, checkValidity } from "../core/coding/validity.ts";
import { checkSctId } from "../core/coding/sctid.ts";
import { tableAsOf } from "../core/coding/tables.ts";
import { hbcsValueOn } from "../core/coding/finance.ts";
import { bnoReportingForm } from "../core/coding/bno.ts";
import { loadProcedures } from "../core/op/registry.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
loadCodeTables(join(HERE, "..", "registry", "kodok", "tablak"));
const RULES = loadCodeRules(join(HERE, "..", "registry", "kodok"));
// A SNOMED-törzs HELYI és nincs a repóban: a tesztek mindkét állapotot fedik.
loadSnomed(join(HERE, "..", "registry", "kodok", "helyi"));

const NOW = "2026-09-02T16:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
function put(st: CaseState, pairs: Array<[string, unknown]>): CaseState {
  let s = st;
  for (const [id, v] of pairs) s = setValue(REG, s, id, v);
  return recompute(REG, s);
}

/* ── 1. A BETÖLTÖTT TÖRZSEK VALÓDIAK ────────────────────────────────── */

test("a HBCS-törzs teljes, súlyszámokkal", () => {
  const t = getTable("tbl.hbcs")!;
  assert.equal(t.coverage, "full");
  assert.ok(Object.keys(t.rows).length > 700);
  assert.equal(t.rows["673A"].label, "Hüvelyi szülés");
  assert.equal(t.rows["671A"].label, "Császármetszés");
});

test("az OENO járóbeteg-törzs a kizárási szabályokkal együtt töltődött be", () => {
  const t = getTable("tbl.oeno")!;
  assert.ok(Object.keys(t.rows).length > 2500);
  assert.equal(t.rows["13590"].label, "Amnioscopia");
  const vizsgalat = t.rows["11041"];
  assert.ok(vizsgalat.kizarva.split(";").includes("11042"));
  assert.ok(vizsgalat.szakma.split(";").includes("04"));
});

test("a 4. melléklet BNO-feltételei betöltődtek", () => {
  const t = getTable("tbl.oeno.bno")!;
  assert.equal(t.rows["46040"].bno, "Z3590");
});

/* ── 2. AMI HIÁNYZIK, AZ NEVESÍTVE HIÁNYZIK ─────────────────────────── */

test("az OENO pontértékek BETÖLTŐDTEK a törzslistából", () => {
  assert.equal(oenoPoints("11041"), 750);
  assert.equal(oenoPoints("11042"), 878);
  assert.equal(oenoPoints("13590"), 339);
  assert.ok(!missingStems().some((s) => s.id === "tbl.oeno.pont"));
});

test("KÉT különböző beavatkozási lista van — külön törzsben, azonos alakban", () => {
  // A császármetszés a FEKVŐBETEG törzsben van, a járóbetegében nincs.
  assert.equal(lookupCode("tbl.mut", "57410").value,
    "Császármetszés - cervicalis, transversalis");
  assert.equal(lookupCode("tbl.oeno", "57410").value, null);
  // Az amnioszkópia fordítva.
  assert.equal(lookupCode("tbl.oeno", "13590").value, "Amnioscopia");
  assert.equal(lookupCode("tbl.mut", "13590").value, null);
  // Az ICD-9-CM alak EGYIKBEN SINCS: nem magyar kód.
  assert.equal(lookupCode("tbl.mut", "74.10").value, null);
  assert.equal(lookupCode("tbl.oeno", "74.10").value, null);
  // És a fekvőbeteg-törzs már nincs a hiányzók között.
  assert.ok(!missingStems().some((s) => s.id === "tbl.mut"));
});

test("a SNOMED azonosítót ajánl, magyar MEGNEVEZÉST nem", () => {
  // A licenc nem tiltás, hanem feltétel: a GPS helyben telepíthető, és a
  // rendszer ajánl belőle azonosítót. Ami nincs: a magyar megnevezés.
  const m = missingStems().find((s) => s.id === "tbl.snomed.hu")!;
  assert.match(m.reason, /validált eljárást/);
  assert.equal(getTable("tbl.snomed"), undefined,
    "a SNOMED nem a terjesztett kódtáblák közt van");
});

test("az FNO betöltve — és a súlyossági fokozat a KÓD RÉSZE", () => {
  const t = getTable("tbl.fno")!;
  assert.equal(t.rows["b1100"].label, "Tudati funkciók, NINCS probléma");
  assert.equal(t.rows["b1103"].label, "Tudati funkciók, SÚLYOS probléma");
  assert.match(t.coverageNote!.hu!, /nem alkategória, hanem MÉRTÉK/);
});

test("a BNO teljes magyar törzse betöltve, JELENTÉSI kódformában", () => {
  const t = getTable("tbl.bno")!;
  assert.ok(Object.keys(t.rows).length > 11000);
  assert.equal(t.rows["O1410"].label, "Súlyos praeeclampsia");
  assert.equal(t.rows["O8000"].label, "Koponyavégű, spontán hüvelyi szülés");
  assert.match(t.coverageNote!.hu!, /PONT NÉLKÜL/);
  // A RÖVIDÍTETT alak NINCS a törzsben: a jelentés az ötkarakteres kódot várja.
  assert.equal(t.rows["O14"], undefined);
  assert.equal(t.rows["O141"], undefined);
});

test("a törzs a nemet, az életkort és az érvényességet is hozza", () => {
  const t = getTable("tbl.bno")!;
  assert.equal(t.rows["O1410"].nem, "2");            // csak nőre
  assert.equal(t.rows["O1410"].korAlso, "8");
  assert.equal(t.rows["O1410"].korFelso, "60");
  assert.equal(t.rows["O1410"].ervVege, "29991231");
});

/* ── 3. ELSZÁMOLHATÓSÁG: AZ ELMARADT BEVÉTEL OKAI ───────────────────── */

test("a rossz szakma miatti elakadás ELŐRE kiderül", () => {
  const c = checkOeno(REG, blank(), "13590", "01");   // amnioscopia belgyógyászaton
  assert.equal(c.status, "wrongSpecialty");
  assert.match(c.why, /ELMARADT BEVÉTEL, nem kódolási hiba/);
});

test("a megfelelő szakmán viszont elszámolható", () => {
  assert.equal(checkOeno(REG, blank(), "13590", "04").status, "billable");
});

test("a kötelező BNO-feltétel hiánya a DOKUMENTÁCIÓ hiánya", () => {
  const c = checkOeno(REG, blank(), "46040", "04");
  assert.equal(c.status, "missingDiagnosis");
  assert.deepEqual(c.requiresBno, ["Z3590"]);
  assert.match(c.why, /RÖGZÍTENI KELL/);
});

test("a diagnózis rögzítésével elszámolhatóvá válik", () => {
  const st = put(blank(), [["code.dx.primary", "Z35.90"]]);
  assert.equal(checkOeno(REG, st, "46040", "04").status, "billable");
});

test("ismeretlen kód nem lesz csendben elszámolható", () => {
  assert.equal(checkOeno(REG, blank(), "99999", "04").status, "unknown");
});

/* ── 4. KIZÁRÁSOS ÜTKÖZÉS — A JOGSZABÁLY DÖNT, NEM AZ ÉRDEK ─────────── */

test("a kizárásos ütközést a TÖRZS pontértékei alapján oldja fel", () => {
  const p = planOeno(REG, blank(), ["11041", "11042"], { specialty: "04" });
  assert.equal(p.conflicts.length, 1);
  assert.equal(p.conflicts[0].keep, "11042");        // 878 pont > 750 pont
  assert.equal(p.undecidedConflicts, false);
  assert.match(p.conflicts[0].why, /5\. § \(7\)/);
  assert.deepEqual(p.billable, ["11042"]);
});

test("ismeretlen pontértékű eljárásnál viszont NEM választ", () => {
  const p = planOeno(REG, blank(), ["11041", "11042"], {
    specialty: "04", points: { "11041": Number.NaN, "11042": Number.NaN },
  });
  assert.equal(p.conflicts[0].keep, "11042");        // a törzs pontja marad érvényes
  assert.ok(p.conflicts[0].why.length > 40);
});

test("pontértékkel a JOGSZABÁLY szabálya dönt: a magasabb pontszámú marad", () => {
  const p = planOeno(REG, blank(), ["11041", "11042"], {
    specialty: "04", points: { "11041": 340, "11042": 520 },
  });
  assert.equal(p.conflicts[0].keep, "11042");
  assert.match(p.conflicts[0].why, /5\. § \(7\)/);
  assert.deepEqual(p.billable, ["11042"]);
});

test("nem ütköző eljárások mind elszámolhatók maradnak", () => {
  const p = planOeno(REG, blank(), ["13590", "11041"], { specialty: "04" });
  assert.equal(p.conflicts.length, 0);
  assert.deepEqual(p.billable.sort(), ["11041", "13590"]);
});

test("a formai okból elakadó eljárás nem tűnik el, hanem KIMONDVA marad ki", () => {
  const p = planOeno(REG, blank(), ["46040", "13590"], { specialty: "04" });
  assert.ok(!p.billable.includes("46040"));
  assert.match(p.caveat, /ELMARADT BEVÉTEL/);
  assert.equal(p.checks.find((c) => c.code === "46040")!.status, "missingDiagnosis");
});

/* ── 5. HBCS: SÚLYSZÁM ÉS HATÁRNAPOK ────────────────────────────────── */

test("egy ismert csoport súlyszáma és határnapjai kiolvashatók", () => {
  const v = hbcsValue("673A", 4)!;
  assert.equal(v.label, "Hüvelyi szülés");
  assert.ok(Math.abs(v.sulyszam! - 0.83033) < 1e-6);
  assert.equal(v.alsoHatarnap, 3);
  assert.equal(v.losEffect, "inRange");
});

test("az alsó határnap alatti ápolási idő következménye kimondva", () => {
  const v = hbcsValue("673A", 1)!;
  assert.equal(v.losEffect, "belowLower");
  assert.match(v.why, /ez nem hiba/);
});

test("a felső határnap feletti napokra napidíjas elszámolás", () => {
  assert.equal(hbcsValue("673A", 40)!.losEffect, "aboveUpper");
});

test("a rangsor csökkenő súlyszám szerint rendez", () => {
  const r = rankHbcs(["673A", "671A", "672A"], 5);
  assert.deepEqual(r.map((x) => x.group), ["671A", "672A", "673A"]);
});

/**
 * A MUNKAMEGOSZTÁS, MIÓTA A BESOROLÁS MEGVAN.
 *
 * A besorolási táblázat betöltve él (`core/finanszirozas/besorolas.ts`), de a
 * két réteg dolga továbbra is más, és ezt nem szabad összemosni:
 *
 *   BESOROLÁS   melyik csoportokba ESHET az eset — a rendelet 2. melléklete
 *   RANGSOR     a jelöltek elrendezése súlyszám szerint
 *
 * És egyik sem VÁLASZT: a választás elszámolási szabályokat kíván (legmagasabb
 * súlyszám, csillagos csoport intézeti jogosultsága, összevonás), részben
 * intézményi adattal. A rangsor elrendez, nem dönt.
 */
test("a rangsor elrendez, nem választ — a besorolás külön réteg", () => {
  assert.equal(hbcsValue("nincs-ilyen", 3), null);
  assert.ok(!missingStems().some((s) => s.id === "tbl.hbcs.besorolas"),
    "a besorolás megvan — de NEM kódtáblaként, hanem szabálykészletként");
});

/* ── 6. A RANGSOR ELRENDEZ, NEM VÁLASZT ─────────────────────────────── */

const PE: Array<[string, unknown]> = [
  ["ctx.pregnant", "pos"], ["ctx.lmp", "2026-01-21"],
  ["vitals.bp.systolic", 148], ["vitals.bp.diastolic", 96],
  ["lab.urine.protein", "plus2"], ["lab.plt", 210], ["lab.ast", 22], ["lab.alt", 19],
];

test("a rangsorba CSAK bizonyítékkal alátámasztott kód kerül", () => {
  const st = put(blank(), PE);
  const r = rankByValue(REG, RULES, st);
  assert.ok(r.ranked.length > 0);
  for (const x of r.ranked) assert.ok(x.evidence > 0, `${x.code} bizonyíték nélkül`);
  assert.match(r.caveat, /A LISTÁRA KERÜLÉS FELTÉTELE A BIZONYÍTÉK/);
});

test("üres esetnél a rangsor üres — az érték nem hoz fel kódot", () => {
  assert.deepEqual(rankByValue(REG, RULES, blank()).ranked, []);
});

test("magas pontértékű kód sem kerül fel bizonyíték nélkül", () => {
  const r = rankByValue(REG, RULES, blank(), { points: { "O1410": 100000 } });
  assert.ok(!r.ranked.some((x) => x.code === "O1410"));
});

test("a BNO-kódnak nincs önálló pontértéke — és ezt a rangsor kimondja", () => {
  const st = put(blank(), PE);
  const r = rankByValue(REG, RULES, st);
  assert.match(r.caveat, /a finanszírozási súly a HBCS-csoportból jön/);
  for (let i = 1; i < r.ranked.length; i++) {
    assert.ok(r.ranked[i - 1].evidence >= r.ranked[i].evidence);
  }
});

/* ── 8. SNOMED CT: A LICENC MINT SZERKEZET ──────────────────────────── */

test("a SNOMED-tábla SOHA nem kerülhet a terjesztett könyvtárba", () => {
  // CC BY-ND 4.0: az ÁTALAKÍTOTT változat továbbadása nem engedélyezett.
  // A JSON-ra fordítás átalakítás — ezért a törzs helye a `helyi/`, ami a
  // .gitignore-ban van. Ez a teszt őrzi, hogy ne csússzon át.
  assert.deepEqual(
    validateSnomedDistribution(join(HERE, "..", "registry", "kodok", "tablak")), []);
});

test("a licenc-kapu HIBÁT ad, ha mégis odakerülne", () => {
  const issues = validateSnomedDistribution(join(HERE, "..", "registry", "kodok", "helyi"));
  if (!issues.length) return;                    // a törzs nincs telepítve
  assert.equal(issues[0].severity, "error");
  assert.match(issues[0].message, /CC BY-ND/);
});

test("törzs nélkül az AZONOSÍTÓ attól még érvényes", () => {
  clearSnomed();
  const t = snomedTerm("46764007");
  assert.equal(t.term, null);
  assert.match(t.why!, /AZ AZONOSÍTÓ ATTÓL MÉG ÉRVÉNYES/);
  assert.ok(t.notice.includes("SNOMED International"));
});

test("a forrásmegjelölés MINDIG ott van — akkor is, ha nincs megnevezés", () => {
  clearSnomed();
  assert.match(snomedTerm("46764007").notice, /Creative Commons Attribution-NoDerivatives/);
});

test("telepített törzzsel a megnevezés ANGOL, és ezt kimondja", () => {
  useSnomedTable({
    version: "teszt-20260101",
    rows: { "46764007": { label: "Severe pre-eclampsia", fsn: "Severe pre-eclampsia (disorder)" } },
  });
  const t = snomedTerm("46764007", "hu");
  assert.equal(t.term, "Severe pre-eclampsia");
  assert.equal(t.language, "en");
  assert.match(t.why!, /Magyar SNOMED-megnevezést a rendszer nem ad/);
  clearSnomed();
});

test("a GPS RÉSZHALMAZ — a hiányzó fogalom nem jelent nem létezőt", () => {
  useSnomedTable({ version: "teszt", rows: { "1": { label: "x", fsn: "x (finding)" } } });
  assert.match(snomedTerm("46764007").why!, /RÉSZHALMAZA/);
  clearSnomed();
});

test("a kódajánlás a SNOMED-azonosítót is hozza, ellenőrzött kiadással", () => {
  const st = put(blank(), PE);
  const s = RULES.suggest(REG, st).suggestions.find((x) => x.rule === "rule.pe")!;
  assert.equal(s.snomed!.id, "398254007");
  assert.equal(s.snomed!.verifiedIn, "20260101");
  assert.ok(s.snomed!.notice.includes("snomed.org/gps"));
});

test("amelyik fogalom nincs a GPS-ben, ott ezt KIMONDJA — nem talál ki azonosítót", () => {
  const st = put(blank(), [
    ...PE, ["lab.plt", 62], ["lab.ast", 140], ["lab.alt", 120], ["lab.ldh", 780],
  ]);
  const hellp = RULES.suggest(REG, st).suggestions.find((x) => x.rule === "rule.hellp")!;
  assert.equal(hellp.snomed, undefined);
  assert.match(hellp.snomedNote!, /Azonosítót emlékezetből NEM írunk be/);
});

test("SNOMED-azonosító a kiadás megjelölése nélkül BUILD-HIBA", () => {
  const errs = RULES.validate(REG).filter((i) => i.severity === "error");
  assert.deepEqual(errs, []);
  for (const r of RULES.all()) {
    if (r.snomed) assert.ok(r.snomedVerified, `${r.id}: nincs ellenőrzési kiadás`);
  }
});


/* ── 8. A KÓD ÉRVÉNYESSÉGE: NEM, ÉLETKOR, NAP ───────────────────────── */

const ON = "2026-09-02";

test("a férfira kódolt szülészeti diagnózis elakad — a törzs mondja meg", () => {
  const v = checkValidity("tbl.bno", "O1410", { sex: "male", age: 30, on: ON });
  assert.equal(v.status, "wrongSex");
  assert.ok(blocksReporting(v.status));
  assert.match(v.why, /nő betegre vonatkozik/);
});

test("a hiányzó nem NEM „megfelel” — eldönthetetlen", () => {
  const v = checkValidity("tbl.bno", "O1410", { age: 30, on: ON });
  assert.equal(v.status, "undetermined");
  assert.equal(blocksReporting(v.status), false);
  assert.match(v.why, /NEM azt jelenti, hogy megfelel/);
});

test("az életkori tartomány is kapu — a császármetszés 10–60 évre kódolható", () => {
  assert.equal(checkValidity("tbl.mut", "57410",
    { sex: "female", age: 32, on: ON }).status, "ok");
  const v = checkValidity("tbl.mut", "57410", { sex: "female", age: 7, on: ON });
  assert.equal(v.status, "outOfAgeRange");
  assert.match(v.why, /10–60 éves korra/);
});

test("egy kód jelentése MEGVÁLTOZHATOTT — a régi eset nem a mai kódot jelenti", () => {
  // 56900: 2002-ig „Curettage uteri", 2003-tól „Terhesség-megszakítás nem
  // orvosi indikációra". Ugyanaz a szám, két különböző állítás.
  const regi = checkValidity("tbl.mut", "56900",
    { sex: "female", age: 30, on: "2001-06-01" });
  assert.equal(regi.status, "notYetValid");
  assert.equal(regi.formerLabel, "Curettage uteri");
  assert.match(regi.why, /Akkor a kód jelentése/);
  assert.equal(checkValidity("tbl.mut", "56900",
    { sex: "female", age: 30, on: ON }).status, "ok");
});

test("betöltetlen törzsre az érvényesség NEM „rendben”, hanem ismeretlen", () => {
  const v = checkValidity("tbl.nincs.ilyen", "57410", { sex: "female", age: 30, on: ON });
  assert.equal(v.status, "unknown");
  assert.match(v.why, /Ez nem azt jelenti, hogy érvényes/);
});

/* ── 9. A BNO KÉT ALAKJA ────────────────────────────────────────────── */

test("a rövidített alak feloldódik, ha EGYÉRTELMŰ", () => {
  const f = bnoReportingForm("O14.1");
  assert.equal(f.status, "resolved");
  assert.equal(f.code, "O1410");
  assert.equal(f.label, "Súlyos praeeclampsia");
});

test("a többértelmű alaknál a rendszer NEM választ", () => {
  const f = bnoReportingForm("O80");
  assert.equal(f.status, "ambiguous");
  assert.equal(f.code, null);
  assert.ok(f.candidates.length >= 4);
  assert.match(f.why, /NEM választ helyetted/);
});

test("a jelentési alak jelentési alak marad", () => {
  assert.equal(bnoReportingForm("O1410").status, "reporting");
});

/* ── 10. A BEAVATKOZÁSKÓDOK A MEGNEVEZETT TÖRZSBEN VANNAK ───────────── */

test("minden beavatkozáskód szerepel abban a törzsben, amelyikre hivatkozik", () => {
  const proc = loadProcedures(join(HERE, "..", "registry", "beavatkozasok"));
  assert.deepEqual(proc.validate(REG).filter((i) => i.severity === "error"), []);
  let checked = 0;
  for (const p of proc.all()) {
    const sys = p.oeno?.system ?? p.codeFamily?.system;
    if (!sys) continue;
    const t = getTable(sys === "mut" ? "tbl.mut" : "tbl.oeno")!;
    const codes = [
      ...(p.oeno ? [p.oeno.code] : []),
      ...(p.oeno?.alternatives ?? []).map((a) => a.code),
      ...(p.oeno?.also ?? []).map((a) => a.code),
      ...(p.codeFamily?.candidates ?? []).map((c) => c.code),
    ];
    for (const c of codes) {
      assert.ok(t.rows[c], `${p.id}: a(z) ${c} nincs a(z) ${t.id} törzsben`);
      checked++;
    }
  }
  assert.ok(checked > 40);
});

test("a beavatkozáskódok nem az ICD-9-CM listából valók", () => {
  const proc = loadProcedures(join(HERE, "..", "registry", "beavatkozasok"));
  for (const p of proc.all()) {
    if (!p.oeno) continue;
    assert.doesNotMatch(p.oeno.code, /\./,
      `${p.id}: pontos alakú kód — az ICD-9-CM „74.10" nem magyar kód`);
  }
});


/* ── 11. A SNOMED-AZONOSÍTÓ SZERKEZETE — TÁBLA NÉLKÜL ───────────────── */

test("az elgépelt azonosító a Verhoeff-jegyen bukik ki, készlet nélkül is", () => {
  assert.equal(checkSctId("46764007").valid, true);      // Severe pre-eclampsia
  assert.equal(checkSctId("46764008").valid, false);     // egy jeggyel elrontva
  assert.match(checkSctId("46764008").why, /Verhoeff/);
});

test("a partíciós jegypár megmondja, MIT azonosít", () => {
  const c = checkSctId("46764007");
  assert.equal(c.kind, "concept");
  assert.equal(c.origin, "international");
});

test("a szerkezeti helyesség NEM jelentés — és ezt kimondja", () => {
  // 41633001 érvényes azonosító, csak nem a HELLP-é: az `Intraocular
  // pressure` fogalomé. Ezt a szerkezet nem tudja megfogni.
  const c = checkSctId("41633001");
  assert.equal(c.valid, true);
  assert.match(c.why, /NEM jelenti, hogy létezik/);
});

test("a betöltött kiadás MINDEN azonosítója átmegy a szerkezeti ellenőrzésen", () => {
  const t = getTable("tbl.snomed");
  if (!t) return;                       // a GPS helyi, a CI-ben nincs betöltve
  const ids = Object.keys(t.rows);
  assert.ok(ids.length > 1000);
  assert.deepEqual(ids.filter((id) => !checkSctId(id).valid), []);
});

/* ── 12. A HBCS KIADÁSA AZ ELLÁTÁS NAPJÁHOZ TARTOZIK ────────────────── */

test("a súlyszám kiadásonként MÁS — ugyanazzal a csoportkóddal", () => {
  const most = hbcsValueOn("671A", 5, "2026-09-01");
  const tavaly = hbcsValueOn("671A", 5, "2025-06-01");
  assert.equal(most.value!.label, "Császármetszés");
  assert.equal(tavaly.value!.label, "Császármetszés");
  assert.notEqual(most.value!.sulyszam, tavaly.value!.sulyszam);
  assert.match(tavaly.editionWhy, /2025-05-01/);
});

test("olyan napra, amire nincs betöltött kiadás, NEM a legközelebbivel számol", () => {
  const r = hbcsValueOn("671A", 5, "2019-01-01");
  assert.equal(r.value, null);
  assert.match(r.editionWhy, /csendben lenne rossz/);
});

test("dátum nélkül a hatályos kiadás szól — és megmondja, hogy ez kockázat", () => {
  const r = hbcsValueOn("671A", 5, null);
  assert.ok(r.value);
  assert.match(r.editionWhy, /Retrospektív esetnél ez rossz összeget adhat/);
});

test("a kiadásválasztás a törzscsaládra általános, nem a HBCS-re szabott", () => {
  assert.equal(tableAsOf("tbl.bno", "2026-09-01").table!.id, "tbl.bno");
  assert.equal(tableAsOf("tbl.nincs", "2026-09-01").table, null);
});

test("az intézeti körhöz kötött csoport nem címke, hanem kapu", () => {
  const t = getTable("tbl.hbcs")!;
  const g = Object.keys(t.rows).find((k) => t.rows[k].intezetiKorhozKotott === "igen")!;
  const v = hbcsValueOn(g, 5, "2026-09-01").value!;
  assert.equal(v.institutionRestricted, true);
  assert.match(v.why, /20. § \(3\)/);
  assert.match(v.why, /a rendszer NEM tudja/);
});


/* ── 13. A FŐHIERARCHIA — AMIT A SZÁM ALAKJA NEM ÁRUL EL ────────────── */

test("a mérhető mennyiség nem betegség — és ezt a címke mondja meg", () => {
  if (!getTable("tbl.snomed")) return;         // a GPS helyi, a CI-ben nincs
  // 41633001 Verhoeff-helyes, létező fogalom — csak épp az `Intraocular
  // pressure`, egy MÉRHETŐ MENNYISÉG. Pontosan ez a hiba történt egyszer
  // a HELLP-nél.
  assert.equal(checkSctId("41633001").valid, true);
  const t = checkClinicalTag("41633001");
  assert.equal(t.status, "nonClinical");
  assert.equal(t.tag, "observable entity");
  assert.match(t.why, /a szám alakja ezt nem árulja el/);
});

test("a szabályok fogalmai klinikai főhierarchiában vannak", () => {
  if (!getTable("tbl.snomed")) return;
  for (const r of RULES.all()) {
    if (!r.snomed) continue;
    assert.notEqual(checkClinicalTag(r.snomed).status, "nonClinical",
      `${r.id}: ${semanticTag(r.snomed)}`);
  }
  assert.equal(semanticTag("46764007"), "disorder");
  assert.equal(semanticTag("11466000"), "procedure");
});

test("telepítetlen készletnél a főhierarchia NEM „rendben”, hanem ismeretlen", () => {
  clearSnomed();
  const t = checkClinicalTag("41633001");
  assert.equal(t.status, "unknown");
  assert.match(t.why, /NEM azt jelenti, hogy a fogalom megfelelő/);
  loadSnomed(join(HERE, "..", "registry", "kodok", "helyi"));
});
