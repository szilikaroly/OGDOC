/**
 * INTEROPERABILITÁS — a határ, ahol az idegen üzenetből adat lesz.
 *
 * Négy kapu, és mind a négy visszafordíthatatlan hibát véd: kihez tartozik ·
 * miről szól · milyen egységben · működött-e a műszer. Plusz egy szabály, ami
 * nem kapu: a megállított lelet nem tűnhet el.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { admitResult, queueReport, type HeldMessage } from "../core/interop/inbound.ts";
import { matchPatient, type IdentityClaim, type InboundResult } from "../core/interop/types.ts";
import { outboxHealth, planRetry, type OutboxEntry } from "../core/interop/outbox.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const NOW = "2026-09-03T10:00:00.000Z";
const T = (m: number) => new Date(Date.parse(NOW) + m * 60000).toISOString();

const KNOWN: IdentityClaim = {
  mrn: "MRN-100", taj: "123456789", birthDate: "1994-05-02",
  familyName: "Példa", givenName: "Éva",
};

/* ── 1. AZONOSSÁG ───────────────────────────────────────────────────── */

test("két független azonosító egyezése párosít", () => {
  const r = matchPatient({ mrn: "MRN-100", taj: "123456789" }, KNOWN);
  assert.equal(r.outcome, "match");
  assert.equal(r.agreeing.length, 2);
});

test("A NÉV NEM FÜGGETLEN AZONOSÍTÓ — egy azonosító + név csak átnézés", () => {
  const r = matchPatient({ mrn: "MRN-100", familyName: "Példa", givenName: "Éva" }, KNOWN);
  assert.equal(r.outcome, "review");
  assert.match(r.why, /testvéreknél és az azonos nevű anya-lányánál téved/);
});

test("ELLENTMONDÁS ESETÉN NINCS PÁROSÍTÁS, akkor sem, ha több egyezik", () => {
  // Két egyezés, egy ellentmondás. Ez NEM „2:1 a párosítás javára”.
  const r = matchPatient(
    { mrn: "MRN-100", taj: "123456789", birthDate: "1988-01-01" }, KNOWN);
  assert.equal(r.outcome, "noMatch");
  assert.match(r.why, /valamelyik rendszerben rossz adat van/);
  assert.match(r.why, /MÁSIK BETEG leletét tenné ide/);
});

test("eltérő név egyező azonosítók mellett: emberi döntés, nem automatizmus", () => {
  const r = matchPatient(
    { mrn: "MRN-100", taj: "123456789", familyName: "Másnevű" }, KNOWN);
  assert.equal(r.outcome, "review");
  assert.match(r.why, /névváltozás \(házasság\), elgépelés vagy TÉVES AZONOSÍTÓ/);
});

test("egyetlen azonosító önmagában kevés", () => {
  assert.equal(matchPatient({ mrn: "MRN-100" }, KNOWN).outcome, "noMatch");
});

/* ── 2-4. A BEFOGADÁSI KAPUK ────────────────────────────────────────── */

const lab = (p: Partial<InboundResult> = {}): InboundResult => ({
  channel: "lis", sender: "Központi Labor", messageId: "m1", receivedAt: NOW,
  identity: { mrn: "MRN-100", taj: "123456789" },
  variableId: "lab.plt", value: 240, unit: "10*9/L", observedAt: NOW, ...p,
});

test("a négy kapun átment eredmény `device` provenienciával kerül be", () => {
  const d = admitResult(REG, lab(), { known: KNOWN });
  assert.equal(d.outcome, "admit");
  // NEM `imported`: az akkreditált labor műszere MÉRT, nem valaki átgépelte.
  assert.equal(d.provenance, "device");
  assert.equal(d.confidence, "measured");
  assert.match(d.why, /A klinikus javítása ezt felülírja/);
});

test("azonosítási kapu: ellentmondásnál ELUTASÍTÁS, bizonytalanságnál VÁRAKOZTATÁS", () => {
  const bad = admitResult(REG, lab({ identity: { mrn: "MRN-100", taj: "999" } }),
    { known: KNOWN });
  assert.equal(bad.outcome, "reject");
  assert.equal(bad.gate, "identity");

  const soft = admitResult(REG, lab({ identity: { mrn: "MRN-100", familyName: "Példa" } }),
    { known: KNOWN });
  assert.equal(soft.outcome, "hold");
});

test("EGYSÉG NÉLKÜLI SZÁM nem kerül be — nem feltételezzük a küldő egységét", () => {
  const d = admitResult(REG, lab({ unit: null }), { known: KNOWN });
  assert.equal(d.outcome, "hold");
  assert.equal(d.gate, "unit");
  assert.match(d.why, /a néma átváltás a klasszikus gyilkos hiba/);
});

test("EGYSÉGELTÉRÉS: az átváltás lehet helyes, de nem a határon, találgatásból", () => {
  const d = admitResult(REG, lab({ unit: "g/L" }), { known: KNOWN });
  assert.equal(d.gate, "unit");
  assert.match(d.why, /nevesített, tesztelt átváltással/);
});

test("ISMERETLEN CÉLVÁLTOZÓ: az üzenet NEM dobható el, mert a lelet létezik", () => {
  const d = admitResult(REG, lab({ variableId: "lab.nincs.ilyen" }), { known: KNOWN });
  assert.equal(d.outcome, "hold");
  assert.equal(d.gate, "concept");
  assert.match(d.why, /várakozó sorba kerül, amíg a leképezés el nem készül/);
});

test("a BUKOTT QC-jű POCT-mérés nem „bizonytalan eredmény”, hanem NEM EREDMÉNY", () => {
  const d = admitResult(REG,
    lab({ channel: "poct", sender: "Osztályos vércukormérő", qc: { state: "fail" } }),
    { known: KNOWN });
  assert.equal(d.outcome, "reject");
  assert.equal(d.gate, "qc");
  assert.match(d.why, /NEM EREDMÉNY/);
});

test("ISMERETLEN QC-állapot: várakoztatás, nem elutasítás", () => {
  const d = admitResult(REG, lab({ channel: "poct", qc: null }), { known: KNOWN });
  assert.equal(d.outcome, "hold");
  assert.equal(d.gate, "qc");
});

test("a QC csak a POCT-csatornán kapu — a labor a saját akkreditációjával felel", () => {
  const d = admitResult(REG, lab({ channel: "lis", qc: null }), { known: KNOWN });
  assert.equal(d.outcome, "admit");
});

/* ── 5. A MEGÁLLÍTOTT LELET NEM TŰNHET EL ───────────────────────────── */

const held = (p: Partial<HeldMessage> = {}): HeldMessage => ({
  messageId: "m1", receivedAt: NOW, channel: "lis", sender: "Labor",
  variableId: "lab.plt", gate: "unit", why: "egységeltérés", ...p,
});

test("az átnézetlen várakozó sor csendes adatvesztés — csak lassabb", () => {
  const r = queueReport([held({ receivedAt: T(-500) })], T(0), 240);
  assert.equal(r.total, 1);
  assert.equal(r.overdue.length, 1);
  assert.match(r.why, /nem biztonsági intézkedés, hanem csendes adatvesztés/);
});

test("az átnézett üzenet kikerül a sorból", () => {
  const r = queueReport(
    [held({ reviewedBy: "dr. Teszt", reviewedAt: T(10) })], T(60));
  assert.equal(r.total, 0);
  assert.match(r.why, /minden beérkezett lelet elintézett/);
});

test("a sor kapunként bontva mutatja, hol akad el a forgalom", () => {
  const r = queueReport(
    [held({ gate: "unit" }), held({ messageId: "m2", gate: "identity" }),
     held({ messageId: "m3", gate: "unit" })], T(10));
  assert.equal(r.byGate.unit, 2);
  assert.equal(r.byGate.identity, 1);
});

/* ── 6. A KIMENŐ SOR ────────────────────────────────────────────────── */

const out = (p: Partial<OutboxEntry> = {}): OutboxEntry => ({
  id: "o1", channel: "his", idempotencyKey: "k1", createdAt: NOW,
  status: "pending", attempts: 0, clinical: false, ...p,
});

test("az első kísérlet azonnal megy", () => {
  assert.equal(planRetry(out(), NOW).action, "send");
});

test("exponenciális várakozás, felső korláttal", () => {
  const p = planRetry(out({ attempts: 3, lastAttemptAt: NOW }), T(1));
  assert.equal(p.action, "wait");
  assert.match(p.why, /120 mp várakozás/);
  const later = planRetry(out({ attempts: 3, lastAttemptAt: NOW }), T(5));
  assert.equal(later.action, "send");
});

test("KLINIKAI üzenetnél szigorúbb a küszöb, és a vége EMBER", () => {
  // A hatodik sikertelen próbálkozás nem üzemeltetési esemény.
  const p = planRetry(out({ clinical: true, attempts: 5, lastError: "504" }), T(60));
  assert.equal(p.action, "escalate");
  assert.match(p.why, /valakinek fel kell hívnia a telefont/);
  assert.match(p.why, /504/);

  // Nem klinikai üzenet ugyanennyi kísérletnél még próbálkozik.
  assert.notEqual(planRetry(out({ attempts: 5, lastAttemptAt: NOW }), T(60)).action, "escalate");
});

test("a végtelen újrapróbálkozás rosszabb, mint a feladás", () => {
  const p = planRetry(out({ attempts: 12 }), T(60));
  assert.equal(p.action, "escalate");
  assert.match(p.why, /közben senki nem tudja, hogy baj van/);
});

test("a feladott üzenet NEM tűnhet el magától", () => {
  const p = planRetry(out({ status: "abandoned" }), NOW);
  assert.equal(p.action, "escalate");
  assert.match(p.why, /amíg valaki nem zárja le, a sor mutatja/);
});

test("a beragadt KLINIKAI üzenet külön kiemelve — a címzett nem tudja, amit tudnia kellene", () => {
  const h = outboxHealth([out({ clinical: true, createdAt: T(-90) })], T(0), 30);
  assert.equal(h.clinicalStuck.length, 1);
  assert.match(h.why, /a címzett nem tudja, amit tudnia kellene/);
});

test("üres sor: üres", () => {
  assert.match(outboxHealth([], NOW).why, /A kimenő sor üres/);
});
