/**
 * A 17. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/17-kodolas.md`:
 *
 *   „Egy súlyos praeeclampsiás eset esetén a rendszer O141-et ajánl (nem
 *    O149-et), és az ajánlás mellett látszik, MELYIK VÁLTOZÓ MELYIK ÉRTÉKE
 *    miatt minősül súlyosnak. Ha a labor változik, az ajánlás követi."
 *
 * És a modul saját szabálya: a hiányzó súlyossági adat NEM „nem súlyos".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadCodeTables, lookupCode, tableStamp, getTable } from "../core/coding/tables.ts";
import { loadCodeRules } from "../core/coding/rules.ts";
import { suggestHbcs } from "../core/coding/hbcs.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
loadCodeTables(join(HERE, "..", "registry", "kodok", "tablak"));
const RULES = loadCodeRules(join(HERE, "..", "registry", "kodok"));

const NOW = "2026-09-02T16:00:00Z";
/** 32+0 hét a NOW időpontban. */
const GA32 = "2026-01-21";
function blank(): CaseState {
  return { ctx: { encounter: "inpatient", now: NOW }, values: {}, errors: [] };
}
function put(st: CaseState, pairs: Array<[string, unknown]>): CaseState {
  let s = st;
  for (const [id, v] of pairs) s = setValue(REG, s, id, v);
  return recompute(REG, s);
}
/** Praeeclampsia alapeset: hypertonia + proteinuria a 20. hét után. */
const PE: Array<[string, unknown]> = [
  ["ctx.pregnant", "pos"], ["ctx.lmp", GA32],
  ["vitals.bp.systolic", 148], ["vitals.bp.diastolic", 96],
  ["lab.urine.protein", "plus2"],
];
/** …és a súlyossági ismérvek megnézve, mind negatív. */
const MILD_LABS: Array<[string, unknown]> = [
  ["lab.plt", 210], ["lab.ast", 22], ["lab.alt", 19],
];

/* ── 1. AZ ELFOGADÁSI KRITÉRIUM ─────────────────────────────────────── */

test("súlyos praeeclampsiánál O14.1 az ajánlás, NEM O14.9", () => {
  const st = put(blank(), [...PE, ["lab.plt", 78], ["lab.ast", 92], ["lab.alt", 60]]);
  const r = RULES.suggest(REG, st);
  assert.ok(r.codes.includes("O1410"), `nem ajánlotta: ${r.codes.join(", ")}`);
  assert.ok(!r.codes.includes("O1490"), "a k.m.n. kód nem maradhat bent");
});

test("az elnyomott kód LÁTSZIK, azzal együtt, mi nyomta el", () => {
  const st = put(blank(), [...PE, ["lab.plt", 78], ["lab.ast", 92], ["lab.alt", 60]]);
  const r = RULES.suggest(REG, st);
  const mild = r.suggestions.find((s) => s.code === "O1490")!;
  assert.equal(mild.status, "superseded");
  assert.equal(mild.supersededBy, "O1410");
});

test("látszik, MELYIK VÁLTOZÓ MELYIK ÉRTÉKE miatt súlyos", () => {
  const st = put(blank(), [...PE, ["lab.plt", 78], ["lab.ast", 92], ["lab.alt", 60]]);
  const sev = RULES.suggest(REG, st).suggestions.find((s) => s.code === "O1410")!;
  const vars = sev.because.map((b) => b.variable);
  assert.ok(vars.includes("lab.plt"), "a thrombocytaszám nincs az indoklásban");
  assert.ok(vars.includes("lab.ast"));
  const plt = sev.because.find((b) => b.variable === "lab.plt")!;
  assert.equal(plt.value, 78);
  assert.match(plt.text, /78 G\/l \(< 100\)/);
});

test("ha a labor változik, az ajánlás követi", () => {
  const severe = put(blank(), [...PE, ["lab.plt", 78], ["lab.ast", 92], ["lab.alt", 60]]);
  assert.ok(RULES.suggest(REG, severe).codes.includes("O1410"));

  // ugyanaz az eset, de a kontrollvérkép rendben — az ajánlás visszavált
  const better = put(blank(), [...PE, ...MILD_LABS]);
  const r = RULES.suggest(REG, better);
  assert.ok(r.codes.includes("O1490"));
  assert.ok(!r.codes.includes("O1410"));
});

test("a megnevezés a TÖRZSBŐL jön, nem a szabályból", () => {
  const st = put(blank(), [...PE, ["lab.plt", 78], ["lab.ast", 92], ["lab.alt", 60]]);
  const sev = RULES.suggest(REG, st).suggestions.find((s) => s.code === "O1410")!;
  assert.equal(sev.label, "Súlyos praeeclampsia");
  assert.equal(lookupCode("tbl.bno", "O1410").value, "Súlyos praeeclampsia");
  assert.equal(getTable("tbl.bno")!.coverage, "full");
});

/* ── 2. A HIÁNYZÓ SÚLYOSSÁGI ADAT NEM „NEM SÚLYOS" ─────────────────── */

test("thrombocytaszám nélkül az ajánlás ELŐZETES", () => {
  const st = put(blank(), PE);                    // súlyossági labor nincs
  const r = RULES.suggest(REG, st);
  assert.equal(r.provisional, true);
  assert.match(r.caveat, /NEM azt jelenti, hogy az eset nem súlyos/);
  assert.match(r.caveat, /lab\.plt/);
});

test("a súlyossági szabály ilyenkor eldönthetetlen, nem „nem teljesül”", () => {
  const st = put(blank(), PE);
  const sev = RULES.suggest(REG, st).suggestions.find((s) => s.code === "O1410")!;
  assert.equal(sev.status, "undetermined");
  assert.ok(sev.missing!.includes("lab.plt"));
});

test("a súlyossági ismérvek MEGNÉZVE és negatívan viszont nem előzetes", () => {
  const r = RULES.suggest(REG, put(blank(), [...PE, ...MILD_LABS]));
  assert.equal(r.provisional, false);
});

test("a súlyossági lista ismerten HIÁNYOS — és ezt kimondja", () => {
  const st = put(blank(), [...PE, ...MILD_LABS]);
  const sev = RULES.suggest(REG, st).suggestions.find((s) => s.code === "O1410")!;
  assert.match(sev.incompleteNote!, /szérumkreatinin/);
  assert.match(sev.incompleteNote!, /a szabály hiánya nem jelenti a súlyosság hiányát/);
});

/* ── 3. AZ ELNYOMÁSI LÁNC ───────────────────────────────────────────── */

test("a HIVATALOS BNO-ban NINCS önálló HELLP-kód — és ez ki van mondva", () => {
  // Ezt a hivatalos törzs betöltése hozta elő: a HELLP-szindróma a súlyos
  // praeeclampsia (O141) kódjára esik, tehát a KÓDBÓL nem derül ki.
  const st = put(blank(), [
    ...PE, ["lab.plt", 62], ["lab.ast", 140], ["lab.alt", 120], ["lab.ldh", 780],
  ]);
  const r = RULES.suggest(REG, st);
  assert.ok(r.codes.includes("O1410"));
  const hellp = r.suggestions.find((s) => s.rule === "rule.hellp")!;
  assert.equal(hellp.code, "O1410");
  assert.match(hellp.incompleteNote!, /NINCS ÖNÁLLÓ HELLP-KÓD/);
  assert.match(hellp.incompleteNote!, /a diagnózis szövegében kell rögzíteni/);
});

test("a hivatalos törzs KIJAVÍTOTTA a gátrepedés kódjait", () => {
  // A kézzel felvett részhalmazban O70.3 volt a harmadfokú; a hivatalos
  // magyar BNO-ban az O702 a harmadfokú és az O703 a negyedfokú.
  const st = put(blank(), [["labour.perinealTrauma", "thirdB"]]);
  assert.ok(RULES.suggest(REG, st).codes.includes("O7020"));
  assert.equal(lookupCode("tbl.bno", "O7020").value, "Harmadfokú gátrepedés a szülés alatt");
  assert.equal(lookupCode("tbl.bno", "O7030").value, "Negyedfokú gátrepedés a szülés alatt");
});

test("az „egyszerű szülés” kódot BÁRMELY másik kód elnyomja", () => {
  const plain = put(blank(), [["labour.deliveryMode", "spontaneous"]]);
  assert.ok(RULES.suggest(REG, plain).codes.includes("O8090"));

  const complicated = put(blank(), [
    ["labour.deliveryMode", "spontaneous"], ["labour.qbl", 900],
  ]);
  const r = RULES.suggest(REG, complicated);
  assert.ok(r.codes.includes("O7210"));
  assert.equal(r.suggestions.find((s) => s.code === "O8090")!.status, "superseded");
});

test("a negyedfokú gátrepedés elnyomja a harmadfokút", () => {
  const st = put(blank(), [["labour.perinealTrauma", "fourthDegree"]]);
  const r = RULES.suggest(REG, st);
  assert.ok(r.codes.includes("O7030"));
  assert.ok(!r.codes.includes("O7020"));
});

/* ── 4. AZ AJÁNLÁS NEM DÖNTÉS ───────────────────────────────────────── */

test("az ajánlás NEM tárolódik: a rögzített adatból számol újra", () => {
  const st = put(blank(), [...PE, ...MILD_LABS]);
  assert.ok(!Object.keys(st.values).some((k) => k.startsWith("code.")));
  assert.match(RULES.suggest(REG, st).caveat, /nem tárolódik/);
});

test("a kódoló döntése külön mező, és eltérhet az ajánlástól", () => {
  const st = put(blank(), [...PE, ...MILD_LABS, ["code.dx.primary", "O13H0"]]);
  assert.equal(resolve(REG, st, "code.dx.primary").value, "O13H0");
  assert.ok(RULES.suggest(REG, st).codes.includes("O1490"));
  assert.match(REG.get("code.dx.primary")!.documentation.pitfalls!.hu!, /ELTÉRÉSE önmagában adat/);
});

test("a gyanú nem diagnózis — a bizonyosság önálló mező", () => {
  assert.match(REG.get("code.dx.certainty")!.documentation.pitfalls!.hu!, /A GYANÚ NEM DIAGNÓZIS/);
});

/* ── 5. A TÁBLAKERESÉSES LEVEZETÉS ──────────────────────────────────── */

test("az irányítószámból levezetődik a település és a megye", () => {
  const st = put(blank(), [["addr.postcode", "6720"]]);
  assert.equal(resolve(REG, st, "addr.settlement").value, "Szeged");
  assert.equal(resolve(REG, st, "addr.county").value, "Csongrád-Csanád");
});

test("egy tábla két oszlopa két levezetést szolgál ki, ugyanabból a verzióból", () => {
  const st = put(blank(), [["addr.postcode", "9021"]]);
  const a = st.values["addr.settlement"][0];
  const b = st.values["addr.county"][0];
  assert.equal(a.sourceRef, b.sourceRef);
  assert.match(String(a.sourceRef), /^tbl\.irszmap@/);
});

test("ismeretlen irányítószámnál NINCS érték, és a hiány a hibalistába kerül", () => {
  const st = put(blank(), [["addr.postcode", "9999"]]);
  assert.equal(resolve(REG, st, "addr.settlement").state, "missing");
  const err = st.errors.find((e) => e.where === "addr.settlement")!;
  assert.match(err.message, /RÉSZHALMAZBAN/);
});

test("a részhalmaz-tábla kimondja, hogy nem hibás adat, csak nincs benne", () => {
  const r = lookupCode("tbl.irszmap", "9999");
  assert.equal(r.value, null);
  assert.match(r.why!, /Ez nem hibás adat/);
});

test("a törzs verziója és dátuma megjeleníthető", () => {
  assert.match(tableStamp(), /RÉSZHALMAZ/);          // az irányítószám-minta
  assert.equal(getTable("tbl.bno")!.coverage, "full");
  assert.equal(getTable("tbl.bno")!.version, "BNOTORZS 2025-01");
});

test("a táblakeresés kimenete szöveg — nem a kalkulátor-rétegen megy", () => {
  const def = REG.get("addr.settlement")!;
  assert.equal(def.datatype, "text");
  assert.equal(def.derivation!.kind, "lookup");
  assert.match(def.documentation.pitfalls!.hu!, /számot vesz és számot ad/);
});

/* ── 6. HBCS: A BESOROLÁS, AMIT NEM VÉGZÜNK EL ──────────────────────── */

test("HBCS-besorolás NEM készül — és ez állítás, nem hiányosság", () => {
  const st = put(blank(), [...PE, ...MILD_LABS]);
  const h = suggestHbcs(REG, RULES, st);
  assert.equal(h.status, "blocked");
  assert.equal(h.group, null);
  assert.match(h.reason, /a HBCS pénz/i);
});

test("a rendszer viszont ÖSSZESZEDI, mi kell a besoroláshoz", () => {
  const st = put(blank(), [...PE, ...MILD_LABS]);
  const h = suggestHbcs(REG, RULES, st);
  assert.deepEqual(h.missing.sort(), [
    "code.dx.primary", "code.dx.secondary", "code.proc.performed",
    "disch.type", "out.mlos",
  ].sort());
  const sec = h.inputs.find((i) => i.id === "code.dx.secondary")!;
  assert.match(sec.why, /LEGGYAKORIBB hibaforrása/);
});

test("a besorolás INTÉZMÉNYI felelősség — a rendszer előkészít", () => {
  const h = suggestHbcs(REG, RULES, blank());
  assert.match(h.responsibility, /INTÉZMÉNYI FELELŐSSÉG/);
});

test("a szabálykönyvet ellenőrzöttnek jelölve SEM sorol be", () => {
  const st = put(blank(), [...PE, ...MILD_LABS]);
  const h = suggestHbcs(REG, RULES, st, { rulebookVerified: true });
  assert.equal(h.status, "blocked");
  assert.match(h.reason, /nincs megvalósítva/);
});

/* ── 7. A SZABÁLYTÖRZS INTEGRITÁSA ──────────────────────────────────── */

test("minden kódszabály létező változóra és létező kódra hivatkozik", () => {
  assert.deepEqual(RULES.validate(REG).filter((i) => i.severity === "error"), []);
});

test("minden kódszabály megnevezi a forrását", () => {
  for (const r of RULES.all()) assert.ok(r.source.cite.length > 10, r.id);
});

test("a KÜSZÖBÖT tartalmazó szabály klinikai forrást kíván, nem csak a BNO-t", () => {
  // A küszöb klinikai állítás: hogy a 160/110 Hgmm súlyosnak számít, azt egy
  // ajánlás mondja ki. Az, hogy az ikerterhesség kódja O30.0, magából az
  // osztályozásból következik.
  for (const r of RULES.all()) {
    const hasThreshold = [...(r.when ?? []), ...(r.whenAny ?? [])].some(
      (c) => ["lt", "lte", "gt", "gte"].includes(c.op) && typeof c.value === "number",
    );
    if (hasThreshold) {
      assert.ok(!/^BNO-10/.test(r.source.cite),
        `${r.id}: küszöb pusztán osztályozásra hivatkozva`);
    }
  }
});

test("a szülés utáni vérzés küszöbe ismerten szülésmód-független — kimondva", () => {
  const st = put(blank(), [["labour.qbl", 700]]);
  const s = RULES.suggest(REG, st).suggestions.find((x) => x.code === "O7210")!;
  assert.match(s.incompleteNote!, /császármetszésnél TÚLJELEZ/);
});
