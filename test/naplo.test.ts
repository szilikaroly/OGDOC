/**
 * ÍRÁSI NAPLÓ ÉS ÉLŐ MENTÉS.
 *
 * A tesztek nem azt védik, hogy a mentés „működik" — azt, hogy a HIBÁS
 * mentés kimutatható. Négy romlás, négy külön teendő; és a legfontosabb
 * állítás: a csendben sérült mentés visszaáll, csak nem azt, ami volt.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  append, checkContinuation, hashEntry, replay, restoreDrill, snapshot, verifyChain,
} from "../core/journal/journal.ts";
import {
  canReportSaved, GENESIS, replicationLag,
  type JournalEntry, type ReplicationState,
} from "../core/journal/types.ts";
import type { Value } from "../core/types.ts";

const T = (m: number) =>
  new Date(Date.parse("2026-09-03T10:00:00.000Z") + m * 60000).toISOString();
const val = (v: unknown, t: string): Value =>
  ({ value: v, t, provenance: "clinician", confidence: "measured" });

/** Determinisztikus napló: azonosítót adunk, hogy a lenyomat is az legyen. */
function build(): JournalEntry[] {
  let log: JournalEntry[] = [];
  log = append(log, { caseId: "e1", actor: "dr. Teszt", op: "context", at: T(0),
    ctx: { encounter: "labour", now: T(0) }, entryId: "id-0" });
  log = append(log, { caseId: "e1", actor: "dr. Teszt", op: "write", at: T(1),
    variableId: "vitals.bp.systolic", value: val(118, T(1)), entryId: "id-1" });
  log = append(log, { caseId: "e1", actor: "Kovács nővér", op: "write", at: T(2),
    variableId: "vitals.bp.systolic", value: val(124, T(1)), entryId: "id-2" });
  log = append(log, { caseId: "e1", actor: "dr. Teszt", op: "write", at: T(3),
    variableId: "vitals.pulse", value: val(88, T(3)), entryId: "id-3" });
  return log;
}

/* ── 1. A NAPLÓ A REKORD ────────────────────────────────────────────── */

test("a naplóból visszaáll az állapot, és a JAVÍTÁS is megmarad", () => {
  const r = replay(build());
  // Két érték ugyanarra a mérésre: az eredeti és a javítás. A napló egyiket
  // sem dobja el — a precedenciát a `resolve()` dönti el, nem a tárolás.
  assert.equal(r.state.values["vitals.bp.systolic"].length, 2);
  assert.equal(r.state.values["vitals.bp.systolic"][0].value, 118);
  assert.equal(r.state.values["vitals.bp.systolic"][1].value, 124);
  assert.equal(r.state.ctx.encounter, "labour");
  assert.equal(r.seq, 4);
});

test("a visszajátszás IDEMPOTENS — a kétszeri futtatás nem duplázik", () => {
  const log = build();
  const a = replay(log), b = replay(log);
  assert.deepEqual(a.state, b.state);
  assert.equal(b.state.values["vitals.bp.systolic"].length, 2);
});

test("részleges visszajátszás: az eset állapota bármelyik ponton", () => {
  const r = replay(build(), 2);
  assert.equal(r.state.values["vitals.bp.systolic"].length, 1);
  assert.equal(r.state.values["vitals.pulse"], undefined);
});

/* ── 2. A CSELEKVŐ ÉS AZ INDOKLÁS ───────────────────────────────────── */

test("cselekvő nélkül nincs bejegyzés — az írási napló az auditnapló írási fele", () => {
  assert.throws(() => append([], { caseId: "e1", actor: " ", op: "write", at: T(0),
    variableId: "x", value: val(1, T(0)) }), /„A rendszer” nem cselekvő/);
});

test("a törlés INDOKLÁS nélkül nem rögzíthető", () => {
  assert.throws(
    () => append(build(), { caseId: "e1", actor: "dr. Teszt", op: "erase", at: T(9),
      variableId: "vitals.pulse" }),
    /nem különböztethető meg az adatvesztéstől/);
});

test("a sírkő töröl, de a törlés TÉNYE megmarad", () => {
  const log = append(build(), { caseId: "e1", actor: "dr. Teszt", op: "erase", at: T(9),
    variableId: "vitals.pulse", reason: "téves felvitel, másik beteg lapjáról",
    entryId: "id-4" });
  const r = replay(log);
  assert.equal(r.state.values["vitals.pulse"], undefined);
  assert.equal(r.erased.length, 1);
  assert.match(r.erased[0].reason, /téves felvitel/);
  assert.equal(r.erased[0].actor, "dr. Teszt");
});

/* ── 3. A LÁNC — NÉGY ROMLÁS, NÉGY TEENDŐ ───────────────────────────── */

test("az ép napló ép", () => {
  const c = verifyChain(build());
  assert.equal(c.ok, true);
  assert.equal(c.kind, "ok");
});

test("MEGVÁLTOZTATOTT TARTALOM: a másolat nem hiteles", () => {
  const log = build();
  // Valaki átírja a vérnyomást a mentésben. A lenyomat marad a régi.
  log[1] = { ...log[1], value: val(90, T(1)) };
  const c = verifyChain(log);
  assert.equal(c.ok, false);
  assert.equal(c.kind, "tampered");
  assert.equal(c.brokenAt, 2);
  assert.match(c.why, /visszaáll, csak nem azt, ami volt/);
});

test("HÉZAG: részleges szállítmány, a visszajátszás nem folytatható", () => {
  const log = build();
  const c = verifyChain([log[0], log[2], log[3]]);
  assert.equal(c.kind, "gap");
  assert.match(c.why, /újra kell kérni/);
});

test("FELCSERÉLT SORREND: a szállítás keverte össze", () => {
  const log = build();
  const c = verifyChain([log[0], log[2], log[1], log[3]]);
  assert.equal(c.kind, "reordered");
  assert.match(c.why, /ÚJRARENDEZHETŐ, nem kell újrakérni/);
});

test("ÖSSZEOLLÓZOTT NAPLÓ: minden bejegyzés ép, a napló mégsem hiteles", () => {
  const a = build();
  let b: JournalEntry[] = [];
  b = append(b, { caseId: "e2", actor: "más orvos", op: "write", at: T(0),
    variableId: "vitals.pulse", value: val(70, T(0)), entryId: "id-x" });
  b = append(b, { caseId: "e2", actor: "más orvos", op: "write", at: T(1),
    variableId: "vitals.pulse", value: val(72, T(1)), entryId: "id-y" });
  // A második napló 2. bejegyzését az elsőhöz fűzzük: sorszám stimmel,
  // lenyomat ép — a LÁNC nem illeszkedik.
  const c = verifyChain([a[0], { ...b[1], seq: 2 }]);
  assert.equal(c.kind, "brokenLink");
  assert.match(c.why, /önmagában ép, a napló mégsem hiteles/);
});

test("az üres napló ÉRVÉNYES, de a hiánya kimondva", () => {
  const c = verifyChain([]);
  assert.equal(c.ok, true);
  assert.match(c.why, /a szállítmány veszett el, nem az eset volt üres/);
});

test("a lenyomat a KULCSSORREND-től független", () => {
  // Két gépen más sorrendben épülhet fel ugyanaz az objektum. Ha a lenyomat
  // ettől függne, a lánc ott törne el, ahol semmi baj nincs.
  const e = build()[1];
  const { hash, ...rest } = e;
  const shuffled = Object.fromEntries(Object.entries(rest).reverse());
  assert.equal(hashEntry(shuffled as typeof rest), hash);
});

/* ── 4. PILLANATKÉP ÉS FOLYTATÁS ────────────────────────────────────── */

test("a pillanatkép + maradék napló ugyanaz, mint a teljes visszajátszás", () => {
  const log = build();
  const snap = snapshot(log, T(5), 2);
  const tail = log.filter((e) => e.seq > 2);
  assert.equal(checkContinuation(snap, tail).ok, true);

  const merged = replay(tail);
  const full = replay(log);
  // A pillanatkép állapota + a folytatás értékei = a teljes állapot.
  const bp = [...snap.state.values["vitals.bp.systolic"],
              ...(merged.state.values["vitals.bp.systolic"] ?? [])];
  assert.deepEqual(bp, full.state.values["vitals.bp.systolic"]);
});

test("a NEM ILLESZKEDŐ folytatás kimutatható — különben csendben veszne adat", () => {
  const log = build();
  const snap = snapshot(log, T(5), 2);
  const c = checkContinuation(snap, log.filter((e) => e.seq > 3));
  assert.equal(c.ok, false);
  assert.match(c.why, /CSENDBEN veszítene adatot/);
});

test("az ÁTFEDŐ folytatás duplázna — ezt is elkapjuk", () => {
  const log = build();
  const snap = snapshot(log, T(5), 3);
  const c = checkContinuation(snap, log.filter((e) => e.seq > 2));
  assert.equal(c.ok, false);
  assert.match(c.why, /duplázna/);
});

test("a SÍRKÖVEK TÚLÉLIK a tömörítést — a törölt adat nem támad fel", () => {
  const log = append(build(), { caseId: "e1", actor: "dr. Teszt", op: "erase", at: T(9),
    variableId: "vitals.pulse", reason: "a beteg törlési kérelme", entryId: "id-4" });
  const snap = snapshot(log, T(10));
  assert.equal(snap.state.values["vitals.pulse"], undefined);
  assert.equal(snap.erased.length, 1);
  assert.match(snap.erased[0].reason, /törlési kérelme/);
});

/* ── 5. HELYREÁLLÍTÁSI PRÓBA ────────────────────────────────────────── */

test("a próba a lánc ellenőrzésével KEZDŐDIK, nem az összehasonlítással", () => {
  const log = build();
  log[2] = { ...log[2], value: val(999, T(2)) };
  const d = restoreDrill(log, replay(build()).state);
  assert.equal(d.ok, false);
  assert.match(d.why, /a lánc ellenőrzésén/);
});

test("a próba MÉRI az időt — ebből ígérhető meg a helyreállítási idő", () => {
  const log = build();
  const d = restoreDrill(log, replay(log).state);
  assert.equal(d.ok, true);
  assert.equal(d.entries, 4);
  assert.equal(d.valuesRestored, 3);
  assert.ok(typeof d.elapsedMs === "number");
  assert.match(d.why, /a lánc ép/);
});

test("a próba MEGNEVEZI, mi tér el — „visszaáll, de nem azt adja vissza”", () => {
  const log = build();
  const wrong = replay(log).state;
  wrong.values["vitals.pulse"] = [val(999, T(3))];
  const d = restoreDrill(log, wrong);
  assert.equal(d.ok, false);
  assert.ok(d.mismatches.some((m) => /vitals\.pulse/.test(m)));
  assert.match(d.why, /a legveszélyesebb hibaosztály/);
});

/* ── 6. A „MENTVE" SZÓ ÉS A LEMARADÁS ───────────────────────────────── */

test("a pufferben álló bejegyzésre nem írható ki, hogy „mentve”", () => {
  assert.equal(canReportSaved("buffered"), false);
  assert.equal(canReportSaved("local"), true);
  assert.equal(canReportSaved("replicated"), true);
});

test("a naprakész másolatnál nincs mit veszíteni", () => {
  const st: ReplicationState = { localSeq: 12, remoteSeq: 12, localAt: T(10), remoteAt: T(10) };
  const r = replicationLag(st, 900, T(11));
  assert.equal(r.entriesBehind, 0);
  assert.equal(r.withinRpo, true);
});

test("a lemaradás az ELSŐ nyugtázatlan bejegyzéstől mérendő", () => {
  // Ami elveszne, az a LEGRÉGEBBI nyugtázatlan munkával kezdődik — nem a
  // legutolsóval. A rossz irányból mérve a kiesés kisebbnek látszik.
  const st: ReplicationState = { localSeq: 20, remoteSeq: 12, localAt: T(40), remoteAt: T(5) };
  const r = replicationLag(st, 900, T(45));
  assert.equal(r.entriesBehind, 8);
  assert.equal(r.secondsBehind, 40 * 60);
  assert.equal(r.withinRpo, false);
  assert.match(r.why, /nem áll össze újra emlékezetből/);
  assert.match(r.why, /a „mentve” szó nem azt jelenti/);
});

test("a vállalt RPO-n belüli lemaradás nem riaszt, de látszik", () => {
  const st: ReplicationState = { localSeq: 20, remoteSeq: 18, localAt: T(10), remoteAt: T(8) };
  const r = replicationLag(st, 900, T(10));
  assert.equal(r.withinRpo, true);
  assert.equal(r.entriesBehind, 2);
  assert.match(r.why, /vállalt 900 mp-en belül/);
});

/* ── 7. A SORRENDET A `seq` DÖNTI, NEM AZ ÓRA ───────────────────────── */

test("visszaugró faliórai idő nem rendezi át a múltat", () => {
  // NTP-korrekció, időzónaváltás, virtuális gép migrációja: az `at`
  // visszaugorhat. A napló sorrendje ettől nem változik.
  let log: JournalEntry[] = [];
  log = append(log, { caseId: "e1", actor: "a", op: "write", at: T(10),
    variableId: "vitals.pulse", value: val(80, T(10)), entryId: "i1" });
  log = append(log, { caseId: "e1", actor: "a", op: "write", at: T(2),   // visszaugrás
    variableId: "vitals.pulse", value: val(90, T(2)), entryId: "i2" });
  assert.equal(verifyChain(log).ok, true);
  const r = replay(log);
  assert.deepEqual(r.state.values["vitals.pulse"].map((v) => v.value), [80, 90]);
});

test("az első bejegyzés a kezdőlánchoz kapcsolódik", () => {
  assert.equal(build()[0].prevHash, GENESIS);
});
