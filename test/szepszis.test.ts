/**
 * SZÜLÉSZETI SZEPSZIS — a felismerés és az órához kötött csomag.
 *
 * A modul a CMQCC Obstetric Sepsis Toolkit szerkezetét követi. A tesztek nem a
 * küszöbszámokat védik — azok hitelesítésre várnak —, hanem azt a hat
 * szerkezeti szabályt, amitől a riasztás nem lesz ártalmas:
 *
 *   1. ismeretlen terhességi állapotnál nem fut;
 *   2. a gyermekágyban is fut;
 *   3. a vajúdás nem teszi normálissá a fehérvérsejtszámot — kiveszi;
 *   4. a hiányzó tétel nem negatív tétel;
 *   5. a góc kérdésére a rendszer nem felel a klinikus helyett;
 *   6. hitelesítetlen protokoll nem ad riasztást.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";
import {
  assess, evaluateSet, loadProtocol, validateProtocol,
} from "../core/szepszis/screen.ts";
import { alertStatus, bundleStatus } from "../core/szepszis/bundle.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const P = loadProtocol(join(HERE, "..", "registry", "szepszis", "cmqcc-ob-szepszis.json"));

const NOW = "2026-09-03T10:00:00.000Z";
const blank = (): CaseState =>
  ({ ctx: { encounter: "inpatient", now: NOW }, values: {}, errors: [] } as CaseState);

/** Szintetikus eset: lázas, tachycard, tachypnoés gyermekágyas. */
function feverish(): CaseState {
  let st = blank();
  st = setValue(REG, st, "vitals.temp", 38.9, { t: NOW, provenance: "clinician" });
  st = setValue(REG, st, "vitals.pulse", 124, { t: NOW, provenance: "clinician" });
  st = setValue(REG, st, "vitals.rr", 28, { t: NOW, provenance: "clinician" });
  return st;
}

/* ── 1. INTEGRITÁS ──────────────────────────────────────────────────── */

test("a protokoll minden hivatkozása feloldható, és az egységek egyeznek", () => {
  const errors = validateProtocol(P, REG).filter((i) => i.severity === "error");
  assert.deepEqual(errors, []);
});

test("hitelesítetlen protokoll RIASZTÁST NEM AD — a kapu előbb van, mint az adat", () => {
  assert.notEqual(P.verification, "primary");
  assert.equal(P.blocksAlerting, true);
  const a = assess(REG, feverish(), P, { pregnancy: "pos" });
  assert.equal(a.alerts, false);
  assert.ok(a.gaps.some((g) => /HITELESÍTETLEN/.test(g)));
  assert.ok(a.gaps.some((g) => /RIASZTÁS NEM INDUL/.test(g)));
});

test("a hitelesítetlen protokoll figyelmeztetést ad, de nem hibát", () => {
  const iss = validateProtocol(P, REG);
  assert.ok(iss.some((i) => i.severity === "warning" && /riasztást nem ad/.test(i.message)));
});

/* ── 2. HATÁLY ──────────────────────────────────────────────────────── */

test("ismeretlen terhességi állapotnál a szűrés NEM FUT, és nem esik vissza a nem terhes sávra", () => {
  const a = assess(REG, feverish(), P, { pregnancy: "unknown" });
  assert.equal(a.state, "notRun");
  assert.equal(a.screen, null);
  assert.match(a.why, /a terhességi állapot ismeretlen/i);
  assert.match(a.why, /fals riasztást|elcsúszik|nem esik vissza/);
});

test("a gyermekágyban is fut — ott jelentkezik a szülészeti szepszis java", () => {
  const a = assess(REG, feverish(), P, { pregnancy: "neg", daysPostpartum: 12 });
  assert.notEqual(a.state, "notRun");
  assert.ok(a.screen);
});

test("a gyermekágy ablakán túl a szülészeti szűrő kimondja, hogy nem ő az illetékes", () => {
  const a = assess(REG, feverish(), P, { pregnancy: "neg", daysPostpartum: 90 });
  assert.equal(a.state, "notRun");
  assert.match(a.why, /nem azt jelenti, hogy a beteg nem szeptikus/i);
});

/* ── 3. A VAJÚDÁS NEM TESZ NORMÁLISSÁ ───────────────────────────────── */

test("vajúdás alatt a fehérvérsejtszám NEM ÉRTÉKELHETŐ — nem normális", () => {
  let st = feverish();
  st = setValue(REG, st, "lab.wbc", 22, { t: NOW, provenance: "clinician" });
  const inLabour = evaluateSet(REG, st, P.screen, { inLabour: true });
  const wbc = inLabour.results.find((r) => r.var === "lab.wbc")!;
  assert.equal(wbc.state, "notAssessable");
  assert.match(wbc.why, /NEM ÉRTÉKELHETŐ VAJÚDÁS ALATT/);
  assert.match(wbc.why, /nem „normálisnak” minősíti/);

  // Vajúdáson kívül ugyanaz az érték pozitív tétel.
  const outside = evaluateSet(REG, st, P.screen, { inLabour: false });
  assert.equal(outside.results.find((r) => r.var === "lab.wbc")!.state, "positive");
});

test("a laktát is kiesik vajúdás alatt — az izommunka emeli, nem a szepszis", () => {
  let st = blank();
  st = setValue(REG, st, "lab.lactate", 3.4, { t: NOW, provenance: "clinician" });
  const r = evaluateSet(REG, st, P.organDysfunction, { inLabour: true });
  assert.equal(r.results.find((x) => x.var === "lab.lactate")!.state, "notAssessable");
});

/* ── 4. A HIÁNYZÓ TÉTEL NEM NEGATÍV TÉTEL ───────────────────────────── */

test("egyetlen eltérő érték nem szűrőpozitív, de nem is negatív lelet", () => {
  let st = blank();
  st = setValue(REG, st, "vitals.temp", 38.9, { t: NOW, provenance: "clinician" });
  const a = assess(REG, st, P, { pregnancy: "pos" });
  assert.equal(a.state, "screenIndeterminate");
  assert.equal(a.screen!.indeterminate, true);
  assert.match(a.screen!.why, /NEM negatív, hanem eldöntetlen/);
});

test("ha a hiányzó tételekkel sem érhető el a küszöb, a szűrés negatív", () => {
  let st = blank();
  for (const [id, v] of [["vitals.temp", 36.8], ["vitals.pulse", 82],
                         ["vitals.rr", 16], ["lab.wbc", 9]] as const) {
    st = setValue(REG, st, id, v, { t: NOW, provenance: "clinician" });
  }
  const a = assess(REG, st, P, { pregnancy: "pos" });
  assert.equal(a.state, "screenNegative");
  assert.equal(a.screen!.indeterminate, false);
});

test("a hiányzó légzésszám kimondva hiányzik — a leggyakrabban kihagyott érték", () => {
  const r = evaluateSet(REG, blank(), P.screen, {});
  const rr = r.results.find((x) => x.var === "vitals.rr")!;
  assert.equal(rr.state, "missing");
  assert.match(rr.why, /HIÁNYZIK/);
});

/* ── 5. A GÓC KÉRDÉSE EMBERI DÖNTÉS ─────────────────────────────────── */

test("szűrőpozitívnál a rendszer MEGÁLL és megkérdezi, van-e góc", () => {
  const a = assess(REG, feverish(), P, { pregnancy: "pos" });
  assert.equal(a.state, "awaitingSource");
  assert.match(a.why, /NEM SZÁMÍTÁS/);
  assert.match(a.why, /A válasz hiánya nem „nincs góc”/);
});

test("a „nincs góc” DÖNTÉS a rekordban marad, névvel és időponttal", () => {
  const a = assess(REG, feverish(), P, { pregnancy: "pos" },
    { suspected: false, by: "Dr. Teszt Elek", at: NOW });
  assert.equal(a.state, "screenNegative");
  assert.match(a.why, /Dr\. Teszt Elek/);
  assert.match(a.why, /nem a hiánya, hanem maga a döntés/);
});

test("góc + szervi elégtelenség = szepszis; az óra a FELISMERÉSTŐL ketyeg", () => {
  let st = feverish();
  st = setValue(REG, st, "vitals.bp.systolic", 78, { t: NOW, provenance: "clinician" });
  const a = assess(REG, st, P, { pregnancy: "pos" },
    { suspected: true, by: "Dr. Teszt Elek", at: NOW });
  assert.equal(a.state, "sepsis");
  assert.match(a.why, /ettől a pillanattól ketyeg/);
});

test("fertőzésgyanú szervi elégtelenség nélkül NEM megnyugtató végállapot", () => {
  let st = feverish();
  for (const [id, v] of [["vitals.bp.systolic", 118], ["vitals.bp.diastolic", 74],
                         ["lab.lactate", 1.1], ["lab.cr", 52], ["lab.plt", 240],
                         ["lab.bili.total", 9]] as const) {
    st = setValue(REG, st, id, v, { t: NOW, provenance: "clinician" });
  }
  st = setValue(REG, st, "vitals.consciousness", "a", { t: NOW, provenance: "clinician" });
  const a = assess(REG, st, P, { pregnancy: "pos" },
    { suspected: true, by: "Dr. Teszt Elek", at: NOW });
  assert.equal(a.state, "infectionNoOrganDysfunction");
  assert.match(a.why, /ismételni kell/);
});

test("hiányzó szervi vizsgálatoknál a szepszis NEM ZÁRHATÓ KI", () => {
  const a = assess(REG, feverish(), P, { pregnancy: "pos" },
    { suspected: true, by: "Dr. Teszt Elek", at: NOW });
  assert.equal(a.state, "sepsisIndeterminate");
  assert.match(a.why, /NEM ZÁRHATÓ KI/);
});

/* ── 6. A SORRENDI KAPU ─────────────────────────────────────────────── */

const T = (m: number) => new Date(Date.parse(NOW) + m * 60000).toISOString();

test("hemokultúra az antibiotikum ELŐTT — a rendszer első sorrendi kapuja", () => {
  const ok = bundleStatus(P, NOW, [
    { step: "sep.b.culture", at: T(10) },
    { step: "sep.b.antibiotic", at: T(25) },
  ], T(30));
  assert.deepEqual(ok.orderIssues, []);

  const bad = bundleStatus(P, NOW, [
    { step: "sep.b.antibiotic", at: T(10) },
    { step: "sep.b.culture", at: T(40) },
  ], T(45));
  assert.equal(bad.orderIssues.length, 1);
  assert.match(bad.orderIssues[0].why, /MEGFORDULT SORREND/);
  assert.match(bad.orderIssues[0].why, /30 perccel/);
});

test("a sorrendi kapu NEM hard-stop: az antibiotikum a hemokultúra nélkül is megy", () => {
  const b = bundleStatus(P, NOW, [{ step: "sep.b.antibiotic", at: T(20) }], T(25));
  const ab = b.steps.find((s) => s.id === "sep.b.antibiotic")!;
  assert.equal(ab.state, "onTime");            // nem blokkolta semmi
  assert.deepEqual(b.orderIssues, []);          // és nincs mihez képest megfordulnia
});

test("a csomag időbélyeggel mérhető, jelölőnégyzettel nem", () => {
  const b = bundleStatus(P, NOW, [
    { step: "sep.b.culture", at: T(20) },
    { step: "sep.b.antibiotic", at: T(95), by: "Dr. Teszt Elek" },
  ], T(100));
  const ab = b.steps.find((s) => s.id === "sep.b.antibiotic")!;
  assert.equal(ab.state, "late");
  assert.equal(ab.minutes, 95);
  assert.match(ab.why, /Dr\. Teszt Elek/);
  assert.equal(b.complete, false);
});

test("a lejárt és a rögzítetlen lépés különbsége kimondva", () => {
  const b = bundleStatus(P, NOW, [], T(120));
  const ab = b.steps.find((s) => s.id === "sep.b.antibiotic")!;
  assert.equal(ab.state, "overdue");
  assert.match(ab.why, /nem azt jelenti, hogy nem történt meg/);
});

test("a feltételes lépés nem esedékes, amíg a feltétele nem történt meg", () => {
  const b = bundleStatus(P, NOW, [], T(400));
  assert.equal(b.steps.find((s) => s.id === "sep.b.lactate2")!.state, "notApplicable");
});

test("a szándékos elmaradás indoklással dokumentált döntés, nem hiány", () => {
  const b = bundleStatus(P, NOW, [
    { step: "sep.b.fluid", at: T(30), omittedBecause: "tüdőödéma, praeeclampsia mellett" },
  ], T(200));
  const f = b.steps.find((s) => s.id === "sep.b.fluid")!;
  assert.equal(f.state, "omitted");
  assert.match(f.why, /tüdőödéma/);
  assert.match(f.why, /nem is teljesítés/);
});

/* ── 7. „KIADVA" ≠ „ÁTVÉVE" ─────────────────────────────────────────── */

test("a ki nem vett riasztás önálló állapot, és magának is riasztania kell", () => {
  assert.equal(alertStatus(P, NOW, null, T(5)).state, "issued");
  assert.equal(alertStatus(P, NOW, T(12), T(20)).state, "acknowledged");
  const un = alertStatus(P, NOW, null, T(45));
  assert.equal(un.state, "unacknowledged");
  assert.match(un.why, /egy szinttel feljebb/);
  assert.match(un.why, /azt hiszi, hogy szólt/);
});

/* ── 8. KÉT KÜSZÖB UGYANARRA A MÉRÉSRE ──────────────────────────────── */

test("a rendszerben már futó omqSOFA-val való küszöbeltérés KIMONDVA áll", () => {
  const rel = P.relatedCalculators!.find((r) => r.id === "calc.omqsofa")!;
  assert.ok(rel.conflict, "az eltérés nincs megnevezve");
  assert.match(rel.conflict!, /légzésszám itt > 24, az omqSOFA-ban > 20/);
  assert.match(rel.conflict!, /egyiket sem csendesíti el a másikkal/);

  // A FIGYELMEZTETÉS MÁR NEM EBBŐL A MONDATBÓL JÖN. A `validateProtocol`
  // korábban visszhangozta a `conflict` prózáját; az a mondat akkor is
  // változatlan maradt volna, ha közben valaki a küszöböt átírja. Az eltérést
  // most a két ÉLŐ definícióból vezetjük le — a bizonyítéka a
  // `test/szepszis-kuszob.test.ts`-ben áll, ahol egy megmozdított küszöb
  // magától mozdítja a levezetett listát is.
  const w = validateProtocol(P, REG).filter((i) => /küszöbeltérés/.test(i.message));
  assert.equal(w.length, 0, "a próza visszhangja nem hitelesítés");
});

test("a CMQCC vérzési eszköztár már benne van — ez a szepszis párja", () => {
  const rel = P.relatedCalculators!.find((r) => r.id === "calc.cmqcc.stage")!;
  assert.match(rel.relation, /UGYANANNAK A MŰHELYNEK/);
});
