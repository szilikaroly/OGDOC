/**
 * A 14. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/14-zarojelentes.md`:
 *
 *   „Egy teljes eset zárójelentése egy gombnyomásra elkészül, nyomtatható, és
 *    NEM TARTALMAZ KITÖLTETLEN SABLONHELYET. Ahol adat hiányzik, ott az
 *    hiányként jelenik meg, nem üres mezőként."
 *
 * És a nyitott kérdés: a JOGI STÁTUSZ. A generálás minősége és a hitelesség
 * két külön dolog.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadDocuments } from "../core/docs/registry.ts";
import { loadDrugs } from "../core/rx/registry.ts";
import { loadProcedures } from "../core/op/registry.ts";
import { buildDischarge, authenticity } from "../core/zaro/build.ts";
import { render, slots } from "../core/zaro/render.ts";
import { toComposition } from "../core/zaro/fhir.ts";
import { displayUnit } from "../core/ui/units.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const DOCS = loadDocuments(join(HERE, "..", "registry", "documents", "core.json"));
const RX = loadDrugs(join(HERE, "..", "registry", "gyogyszerek"));
const PROC = loadProcedures(join(HERE, "..", "registry", "beavatkozasok"));

const NOW = "2026-09-02T16:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "inpatient", now: NOW }, values: {}, errors: [] };
}
function put(st: CaseState, pairs: Array<[string, unknown]>): CaseState {
  let s = st;
  for (const [id, v] of pairs) s = setValue(REG, s, id, v);
  return recompute(REG, s);
}
const OPTS = { drugs: RX, procedures: PROC };

/** Egy „teljes" eset — az összes hitelességi feltétellel, az azonosítás kivételével. */
function complete(): CaseState {
  return put(blank(), [
    ["patient.taj", "000000000"], ["patient.birthDate", "1993-04-11"],
    ["disch.institution.name", "Szintetikus Klinika"],
    ["disch.admittedAt", "2026-08-30T09:00:00Z"],
    ["disch.at", NOW], ["disch.type", "home"], ["disch.condition", "improved"],
    ["disch.dxAdmission", "Terhességi hypertonia gyanúja"],
    ["disch.dxFinal", "Terhességi hypertonia"],
    ["disch.institution.approved", "pos"],
    ["disch.summaryReviewedBy", "Dr. Szintetikus"],
    ["disch.signedBy", "Dr. Szintetikus"], ["disch.signedAt", NOW],
    ["disch.countersignedBy", "Dr. Ellenjegyző"], ["disch.countersignedAt", NOW],
    ["disch.patientCopyGiven", true], ["disch.language", "hu"],
    ["disch.medication.reconciled", true], ["disch.gpNotified", "pos"],
    ["hx.sys.htn", "pos"], ["vitals.bp.systolic", 148], ["vitals.bp.diastolic", 94],
    ["lab.plt", 210], ["plan.nextVisit.at", "2026-09-16"],
  ]);
}

/* ── 1. NINCS KITÖLTETLEN SABLONHELY ────────────────────────────────── */

test("a teljes eset zárójelentése hiánytalan: minden blokk indokolt", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  assert.deepEqual(slots(d).problems, []);
});

test("az ÜRES eseté is hiánytalan — mert a hiány KIMONDVA jelenik meg", () => {
  const d = buildDischarge(REG, DOCS, blank(), OPTS);
  assert.deepEqual(slots(d).problems, []);
  assert.ok(d.blocks.every((b) => b.state !== "missing" || (b.note && b.note.length > 20)));
});

test("a megjelenített dokumentum egyetlen üres szakaszt sem tartalmaz", () => {
  const text = render(buildDischarge(REG, DOCS, blank(), OPTS));
  // Minden „## Cím" után vagy tétel, vagy dőlt indoklás áll.
  const parts = text.split(/^## /m).slice(1);
  assert.ok(parts.length >= 10);
  for (const p of parts) {
    const body = p.split("\n").slice(1).join("\n").trim();
    assert.ok(body.length > 0, `üres szakasz: ${p.split("\n")[0]}`);
  }
});

test("a hiányzó fizikális status NEM negatív lelet, és ezt ki is mondja", () => {
  const d = buildDischarge(REG, DOCS, blank(), OPTS);
  const b = d.blocks.find((x) => x.id === "status")!;
  assert.equal(b.state, "missing");
  assert.match(b.note!, /NEM negatív lelet/);
});

test("a hiányzó végdiagnózist a dokumentum HANGSÚLYOSAN jelzi", () => {
  const d = buildDischarge(REG, DOCS, blank(), OPTS);
  const b = d.blocks.find((x) => x.id === "dxFinal")!;
  assert.equal(b.state, "missing");
  assert.match(b.note!, /VÉGDIAGNÓZIS NINCS RÖGZÍTVE/);
});

/* ── 2. A „NEM VONATKOZIK RÁ" CSAK RÖGZÍTETT TÉNYBŐL ────────────────── */

test("járóbeteg-ellátásnál a lefolyás nem vonatkozik rá — ez rögzített tény", () => {
  const st: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  const d = buildDischarge(REG, DOCS, put(st, [["ctx.encounter", "ambulatory"]]), OPTS);
  const b = d.blocks.find((x) => x.id === "course")!;
  assert.equal(b.state, "notApplicable");
});

test("ismeretlen ellátási forma mellett a lefolyás HIÁNY, nem „nem vonatkozik rá”", () => {
  const st: CaseState = { ctx: { encounter: "inpatient", now: NOW }, values: {}, errors: [] };
  const d = buildDischarge(REG, DOCS, st, OPTS);
  const b = d.blocks.find((x) => x.id === "course")!;
  assert.equal(b.state, "missing");
});

/* ── 3. A MODUL NEM GYŰJT ADATOT ────────────────────────────────────── */

test("minden állítás visszavezethető: nincs forrás nélküli sor", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  for (const b of d.blocks) {
    for (const s of b.segments) assert.ok(s.from.length > 0, `${b.id}: ${s.text}`);
  }
});

test("az anamnézis-kivonat csak a POZITÍV tételeket viszi", () => {
  const st = put(blank(), [["hx.sys.htn", "pos"], ["hx.sys.dm1", "neg"], ["hx.sys.asthma", "unk"]]);
  const d = buildDischarge(REG, DOCS, st, OPTS);
  const b = d.blocks.find((x) => x.id === "anamnesis")!;
  const text = b.segments.map((s) => s.text).join(" | ");
  assert.match(text, /Magas vérnyomás|hypertonia|Hypertonia/i);
  assert.ok(!/1-es típusú|diabetes mellitus 1/i.test(text), text);
});

test("a negatívok elhagyása NEM elhallgatás: a hiány külön szakaszban van", () => {
  const d = buildDischarge(REG, DOCS, blank(), OPTS);
  const b = d.blocks.find((x) => x.id === "anamnesis")!;
  assert.match(b.note!, /Amit nem tudunk/);
  assert.ok(d.blocks.some((x) => x.id === "gap"));
});

test("a kapu-megkerülés indoklása bekerül a zárójelentésbe", () => {
  let st = put(blank(), [["hx.sys.asthma", "pos"]]);
  st = setValue(REG, st, "rx.active", ["rx.carboprost"]);
  st = setValue(REG, st, "rx.override.gate", "asthma", { scope: "rx.carboprost" });
  st = setValue(REG, st, "rx.override.reason",
    "Életveszélyes atóniás vérzés, más uterotonicum hatástalan volt.",
    { scope: "rx.carboprost" });
  const d = buildDischarge(REG, DOCS, recompute(REG, st), OPTS);
  const b = d.blocks.find((x) => x.id === "gateOverrides")!;
  assert.equal(b.state, "filled");
  assert.match(b.segments[0].text, /kapu megkerülve/);
});

/* ── 4. A JOGI STÁTUSZ — A NYITOTT KÉRDÉS ───────────────────────────── */

test("hitelesítés nélkül a dokumentum MÉG TELJESEN KITÖLTVE SEM hiteles", () => {
  const a = authenticity(REG, DOCS, complete());
  assert.equal(a.status, "draft");
  assert.equal(a.canIssue, false);
  assert.ok(a.missing.some((m) => m.includes("25. modul")));
  assert.match(a.notice, /az aláírás mezőbe beírt név semmit nem bizonyít/);
});

test("egy kapu, amit egy név begépelése nyit, nem kapu", () => {
  const def = REG.get("disch.signedBy")!;
  assert.match(def.documentation!.pitfalls!.hu!, /NEM BIZONYÍT SEMMIT/);
});

test("azonosítással és minden feltétellel viszont hiteles lesz", () => {
  const a = authenticity(REG, DOCS, complete(), { identityVerified: true });
  assert.deepEqual(a.missing, []);
  assert.equal(a.status, "authentic");
  assert.equal(a.canIssue, true);
});

test("az intézményi befogadás hiánya önmagában blokkol", () => {
  const st = put(complete(), [["disch.institution.approved", "unk"]]);
  const a = authenticity(REG, DOCS, st, { identityVerified: true });
  assert.deepEqual(a.missing, ["disch.institution.approved"]);
});

test("az ÁTNÉZÉS külön feltétel az aláírástól", () => {
  const st = blank();
  const a = authenticity(REG, DOCS, st, { identityVerified: true });
  assert.ok(a.missing.includes("disch.summaryReviewedBy"));
  assert.ok(a.missing.includes("disch.signedBy"));
});

test("az ellenjegyzés a DOKUMENTUMTÖRZSBŐL jön, nem innen", () => {
  assert.equal(DOCS.get("doc.zarojelentes")!.signature.countersign, true);
  const a = authenticity(REG, DOCS, blank(), { identityVerified: true });
  assert.ok(a.missing.includes("disch.countersignedBy"));
});

test("a figyelmeztetés a NYOMTATOTT dokumentum elején áll, nem a láblécben", () => {
  const text = render(buildDischarge(REG, DOCS, complete(), OPTS));
  const head = text.split("\n").slice(0, 4).join("\n");
  assert.match(head, /NEM HITELES EGÉSZSÉGÜGYI DOKUMENTUM/);
});

/* ── 5. KUTATÁSI PÉLDÁNY ────────────────────────────────────────────── */

test("a kutatási példány nem tartalmaz beteg-azonosítót", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  const text = render(d, { kind: "research" });
  assert.ok(!text.includes("000000000"), "TAJ a kutatási példányban");
  assert.ok(!text.includes("1993-04-11"), "születési dátum a kutatási példányban");
});

test("a kihagyást KIMONDJA, nem csendben ejti", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  const text = render(d, { kind: "research" });
  assert.match(text, /kutatási példányból kihagyva/);
  assert.match(text, /csendben eltűnt blokk/);
});

test("az ellátási példányban viszont ott van", () => {
  const text = render(buildDischarge(REG, DOCS, complete(), OPTS));
  assert.ok(text.includes("000000000"));
});

test("a beteg-azonosító blokk `phi` jelölésű, a regiszter jelöléséből", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  assert.equal(d.blocks.find((b) => b.id === "patient")!.phi, true);
  assert.equal(REG.get("patient.taj")!.phi, true);
});

/* ── 6. FHIR: A KAPU AZ EXPORTRA IS VONATKOZIK ──────────────────────── */

test("hitelesítés nélkül a Composition státusza `preliminary`", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  const c = toComposition(d);
  assert.equal(c.status, "preliminary");
  assert.ok(c.meta.tag.some((t) => t.code === "not-authenticated"));
});

test("hitelesítéssel `final` — és ezen kívül nincs más kapcsoló", () => {
  const d = buildDischarge(REG, DOCS, complete(), { ...OPTS, identityVerified: true });
  assert.equal(toComposition(d).status, "final");
});

test("a kimenet MAGÁBAN mondja ki, hogy nem konformancia-ellenőrzött", () => {
  const c = toComposition(buildDischarge(REG, DOCS, complete(), OPTS));
  const tag = c.meta.tag.find((t) => t.code === "not-conformance-validated")!;
  assert.match(tag.display, /FHIR-validátorral nincs szembefuttatva/);
});

test("a HIÁNY is szakasz a FHIR-kimenetben", () => {
  const c = toComposition(buildDischarge(REG, DOCS, blank(), OPTS));
  const s = c.section.find((x) => x.title === "Fizikális status")!;
  assert.match(s.text.div, /Nincs adat/);
});

test("a kutatási FHIR-példányban nincs sem subject, sem azonosító szakasz", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  const c = toComposition(d, { kind: "research", subjectReference: "Patient/1" });
  assert.equal(c.subject, undefined);
  assert.ok(!c.section.some((s) => s.title === "Betegazonosítás"));
  assert.ok(c.meta.tag.some((t) => t.code === "de-identified"));
});

/* ── 7. AMIT A NYOMTATÁS HOZOTT ELŐ ─────────────────────────────────── */

test("a fejléc az ellátás IDŐSZAKÁT adja, nem csak a végét", () => {
  const d = buildDischarge(REG, DOCS, complete(), OPTS);
  const from = d.blocks.find((b) => b.id === "header")!.segments
    .map((s) => s.from[0]);
  assert.ok(from.includes("disch.admittedAt"));
  assert.ok(from.includes("disch.at"));
});

test("a nyomtatott dokumentumon EMBERI mértékegység áll, nem UCUM-kód", () => {
  const st = put(complete(), [["vitals.bp.systolic", 148], ["lab.plt", 210]]);
  const text = render(buildDischarge(REG, DOCS, st, OPTS));
  assert.match(text, /148 Hgmm/);
  assert.match(text, /210 G\/l/);
  assert.ok(!text.includes("mm[Hg]"), "UCUM-kód a nyomtatott dokumentumon");
  assert.ok(!text.includes("10*9/L"), "UCUM-kód a nyomtatott dokumentumon");
});

test("a tárolt érték attól még UCUM marad — ez csak megjelenítés", () => {
  assert.equal(REG.get("vitals.bp.systolic")!.unit, "mm[Hg]");
});

test("ismeretlen egységet VÁLTOZATLANUL írunk ki — nem találunk ki magyar alakot", () => {
  assert.equal(displayUnit("furlong/fortnight"), "furlong/fortnight");
});
