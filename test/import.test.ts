/**
 * ELŐÉLETI ADATIMPORT — a javaslattár és a vörös zászlók sora.
 *
 * A réteg egyetlen mondata, amit minden teszt más szögből néz:
 *
 *   A GÉPI KINYERÉS ÁLLÍTÁST AD, NEM ADATOT.
 *
 * A kinyert érték nem alacsony precedenciával kerül be a dokumentációba —
 * SEHOGY nem kerül be, amíg egy ember meg nem erősíti. A vörös zászló viszont
 * a döntés előtt is LÁTSZIK: pontosan azért importálunk, hogy a régi anyagban
 * lévő jel ne maradjon észrevétlen.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadComplaints } from "../core/complaints/registry.ts";
import { recompute, resolve, setValue } from "../core/derive/engine.ts";
import { ProposalStore } from "../core/import/proposals.ts";
import { triageFlags } from "../core/import/flags.ts";
import type { Proposal, SourceDocument } from "../core/import/types.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const DICT = loadComplaints(join(HERE, "..", "registry", "complaints"));

const NOW = "2026-09-03T10:00:00Z";
const blank = (): CaseState =>
  ({ ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] });

const DOC: SourceDocument = {
  id: "doc.1", kind: "discharge", title: "Zárójelentés, 2019",
  issuedAt: "2019-04-02", receivedAt: NOW,
  sha256: "0".repeat(64), ocr: true, pages: 3,
};

function proposal(over: Partial<Proposal> = {}): Proposal {
  return {
    id: "prop.1", variable: "vitals.bp.systolic", value: 168,
    document: "doc.1",
    span: { page: 2, from: 1204, to: 1216, text: "RR 168/104 Hgmm" },
    extractor: { name: "teszt", version: "1" },
    machineConfidence: 0.97, confidence: "measured",
    status: "pending",
    ...over,
  };
}

function store(): ProposalStore {
  const s = new ProposalStore();
  s.addDocument(DOC);
  return s;
}

/* ── 1. HIVATKOZÁS NÉLKÜL NINCS JAVASLAT ────────────────────────────── */

test("hivatkozás nélküli javaslat fel sem vehető", () => {
  const s = store();
  assert.throws(
    () => s.add(proposal({ span: { from: 0, to: 0, text: "" } })),
    /a megerősítés vak/);
});

test("ismeretlen dokumentumra hivatkozó javaslat sem", () => {
  const s = store();
  assert.throws(() => s.add(proposal({ document: "doc.nincs" })),
    /nem tudni, mit olvastunk/);
});

/* ── 2. A JAVASLAT NEM ADAT ─────────────────────────────────────────── */

test("a sorban álló javaslat SEMMILYEN értéket nem ír az esetbe", () => {
  const s = store();
  s.add(proposal());
  const st = s.toValues(REG, blank());
  assert.equal(resolve(REG, st, "vitals.bp.systolic").state, "missing");
});

test("a 0,99-es gépi magabiztosság sem erősít meg", () => {
  const s = store();
  s.add(proposal({ machineConfidence: 0.999 }));
  assert.equal(s.summary().pending, 1);
  assert.equal(resolve(REG, s.toValues(REG, blank()), "vitals.bp.systolic").state,
    "missing");
});

test("a megerősítés teszi adattá — a megerősítő nevével", () => {
  const s = store();
  s.add(proposal());
  assert.equal(s.confirm("prop.1", "", NOW).ok, false);      // névtelenül nem
  assert.equal(s.confirm("prop.1", "dr. Teszt", NOW).ok, true);
  const st = s.toValues(REG, blank());
  const r = resolve(REG, st, "vitals.bp.systolic");
  assert.equal(r.state, "ok");
  assert.equal(r.value, 168);
});

test("a megerősített érték a MEGERŐSÍTŐ állítása, a láncot megőrizve", () => {
  const s = store();
  s.add(proposal());
  s.confirm("prop.1", "dr. Teszt", NOW);
  const st = s.toValues(REG, blank());
  const v = st.values["vitals.bp.systolic"][0];
  // nem `imported` és nem valamiféle `extracted`: onnantól ember állítja
  assert.equal(v.provenance, "clinician");
  // de a lánc visszavezet a javaslatra, azon át a dokumentum pontos helyére
  assert.equal(v.sourceRef, "import:prop.1");
  assert.equal(s.get("prop.1")!.span.text, "RR 168/104 Hgmm");
});

test("a javított érték kerül be, nem amit a gép olvasott", () => {
  const s = store();
  s.add(proposal());
  s.confirm("prop.1", "dr. Teszt", NOW, { correctedValue: 148, note: "OCR: 168 → 148" });
  const st = s.toValues(REG, blank());
  assert.equal(resolve(REG, st, "vitals.bp.systolic").value, 148);
});

/* ── 3. AZ ELUTASÍTÁS INFORMÁCIÓ ────────────────────────────────────── */

test("az elutasításhoz indok kell", () => {
  const s = store();
  s.add(proposal());
  assert.equal(s.reject("prop.1", "dr. Teszt", NOW, "").ok, false);
  assert.equal(s.reject("prop.1", "dr. Teszt", NOW, "más beteg lelete").ok, true);
});

test("az elutasított javaslat MEGMARAD — az újraimport nem támasztja fel", () => {
  const s = store();
  s.add(proposal());
  s.reject("prop.1", "dr. Teszt", NOW, "a lelet más betegé");
  assert.equal(s.summary().rejected, 1);
  assert.equal(s.summary().pending, 0);
  assert.equal(s.get("prop.1")!.note, "a lelet más betegé");
  // és nem lehet utólag megerősíteni
  assert.equal(s.confirm("prop.1", "dr. Teszt", NOW).ok, false);
});

test("az újabb olvasat leváltja a régit, de nem törli", () => {
  const s = store();
  s.add(proposal());
  s.add(proposal({ id: "prop.2", value: 148, machineConfidence: 0.6 }));
  assert.equal(s.get("prop.1")!.status, "superseded");
  assert.equal(s.queue().length, 1);
  assert.equal(s.queue()[0].id, "prop.2");
});

/* ── 4. AZ ÜTKÖZÉST LÁTNI KELL ──────────────────────────────────────── */

test("a rögzített adatnak ellentmondó javaslat nem tűnik el csendben", () => {
  const s = store();
  s.add(proposal());
  const st = recompute(REG, setValue(REG, blank(), "vitals.bp.systolic", 120));
  const c = s.conflicts(REG, st);
  assert.equal(c.length, 1);
  assert.equal(c[0].existing, 120);
  assert.equal(c[0].proposed, 168);
  assert.match(c[0].why, /A rendszer egyiket sem választja/);
});

/* ── 5. A VÖRÖS ZÁSZLÓ A DÖNTÉS ELŐTT IS LÁTSZIK ────────────────────── */

test("meg nem erősített javaslatból fakadó zászló FÜGGŐ, nem elrejtett", () => {
  const s = store();
  s.add(proposal({
    id: "prop.preg", variable: "ctx.pregnant", value: "pos",
    span: { page: 1, from: 10, to: 30, text: "10. hetes graviditas" },
    confidence: "reported", machineConfidence: 0.9,
  }));
  const t = triageFlags(REG, DICT, blank(), s);
  const hit = t.find((x) => x.complaint === "compl.neuro.headache.visual")!;
  assert.equal(hit.state, "pending");
  assert.deepEqual(hit.awaiting, ["prop.preg"]);
});

test("a függő zászló a jóváhagyás után VALÓDI zászló lesz", () => {
  const s = store();
  s.add(proposal({
    id: "prop.preg", variable: "ctx.pregnant", value: "pos",
    span: { page: 1, from: 10, to: 30, text: "10. hetes graviditas" },
  }));
  s.confirm("prop.preg", "dr. Teszt", NOW);
  const st = recompute(REG, s.toValues(REG, blank()));
  const hit = triageFlags(REG, DICT, st, s)
    .find((x) => x.complaint === "compl.neuro.headache.visual")!;
  assert.equal(hit.state, "raised");
  assert.deepEqual(hit.awaiting, []);
});

test("adat nélkül a zászló ELDÖNTHETETLEN, nem „nincs zászló”", () => {
  const t = triageFlags(REG, DICT, blank(), store());
  const hit = t.find((x) => x.complaint === "compl.neuro.headache.visual")!;
  assert.equal(hit.state, "undeterminable");
  assert.ok(hit.why.some((w) => w.includes("nincs adat")));
});

test("a hipotetikus állapot SEHOL nem szivárog ki", () => {
  // A triage kiszámol egy „mi lenne, ha elfogadnánk" állapotot. Ha ez a
  // valódi esetbe kerülne, a kapu értelmét vesztené.
  const s = store();
  s.add(proposal({
    id: "prop.preg", variable: "ctx.pregnant", value: "pos",
    span: { page: 1, from: 10, to: 30, text: "10. hetes graviditas" },
  }));
  const st = blank();
  triageFlags(REG, DICT, st, s);
  assert.deepEqual(st.values, {});
  assert.equal(resolve(REG, st, "ctx.pregnant").state, "missing");
});

/* ── 6. A SOR NEM SZŰRÉS ────────────────────────────────────────────── */

test("a rendezés kényelem: a lista alja is döntést vár", () => {
  const s = store();
  s.add(proposal({ id: "a", machineConfidence: 0.2 }));
  s.add(proposal({ id: "b", variable: "vitals.bp.diastolic", value: 104,
    machineConfidence: 0.99 }));
  assert.deepEqual(s.queue().map((p) => p.id), ["b", "a"]);
  assert.equal(s.summary().pending, 2);
  // és amíg egyikről sem döntöttünk, egyik érték sincs az esetben
  assert.deepEqual(s.toValues(REG, blank()).values, {});
});
