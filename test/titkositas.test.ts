/**
 * TITKOSÍTÁS ÉS KULCSKEZELÉS.
 *
 * A tesztek öt állítást védenek:
 *
 *   1. a kötés miatt egy rekord NEM helyezhető át másik esetbe;
 *   2. a sérült rejtjelezett szöveg NEM ad vissza adatot — a bukás megnevezett;
 *   3. a lánc a REJTJELEZETT alakon fut, tehát az épség KULCS NÉLKÜL ellenőrizhető;
 *   4. a kriptográfiai törlés nem mond igent, amíg egy kulcsmásolat is él;
 *   5. az egy letétkezelő nem letét, és a tartalék nélküli küszöb adatvesztés.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import {
  cryptoErase, newDek, open, seal, unwrapDek, wrapDek,
} from "../core/crypto/envelope.ts";
import {
  checkKeyPolicy, checkMigration,
  type KeyPolicy, type KeyRef, type MigrationRecord, type SealBinding,
} from "../core/crypto/types.ts";
import { append, verifyChain } from "../core/journal/journal.ts";
import type { JournalEntry } from "../core/journal/types.ts";
import type { Value } from "../core/types.ts";

const NOW = "2026-09-03T10:00:00.000Z";
const DEK = newDek();
const KEY: KeyRef = { keyId: "dek-eset-1", kekId: "kek-2026", state: "active", createdAt: NOW };
const bind = (p: Partial<SealBinding> = {}): SealBinding =>
  ({ caseId: "eset-1", seq: 1, prevHash: "genesis", formatVersion: 1, ...p });

/* ── 1. A KÖTÉS ─────────────────────────────────────────────────────── */

test("a lezárt rekord felnyílik a helyes kötéssel", () => {
  const s = seal({ vitals: 118 }, DEK, KEY.keyId, bind());
  const r = open<{ vitals: number }>(s, DEK, KEY, bind());
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.value.vitals, 118);
});

test("ÁTHELYEZETT rekord: a másik eset kötésével nem nyílik ki", () => {
  // Enélkül az „A" eset 7. bejegyzését be lehetne illeszteni a „B" esetbe,
  // és hibátlanul visszafejtődne.
  const s = seal({ vitals: 118 }, DEK, KEY.keyId, bind({ caseId: "eset-1" }));
  const r = open(s, DEK, KEY, bind({ caseId: "eset-2" }));
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.kind, "relocated");
  assert.match(r.ok === false ? r.why : "", /ÁTHELYEZETT rekord/);
});

test("a SORSZÁM is a kötés része — az újrarendezés kimutatható", () => {
  const s = seal({ v: 1 }, DEK, KEY.keyId, bind({ seq: 3 }));
  const r = open(s, DEK, KEY, bind({ seq: 4 }));
  assert.equal(r.ok === false && r.kind, "relocated");
});

test("a kötés MÓDOSÍTÁSA is bukik — a címke rá is kiterjed", () => {
  const s = seal({ v: 1 }, DEK, KEY.keyId, bind());
  // A támadó átírja a kötést a rekordban IS, hogy egyezzen az elvárttal.
  const moved = { ...s, aad: bind({ caseId: "eset-2" }) };
  const r = open(moved, DEK, KEY, bind({ caseId: "eset-2" }));
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.kind, "tampered");
});

/* ── 2. A BUKÁS MEGNEVEZETT ─────────────────────────────────────────── */

test("MEGVÁLTOZTATOTT rejtjelezett szöveg: nincs visszaadott adat", () => {
  const s = seal({ v: 118 }, DEK, KEY.keyId, bind());
  const ct = Buffer.from(s.ct, "base64");
  ct[0] ^= 0xff;
  const r = open({ ...s, ct: ct.toString("base64") }, DEK, KEY, bind());
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.kind, "tampered");
  assert.match(r.ok === false ? r.why : "",
    /a csendben visszafejtett, sérült rekord rosszabb, mint a hiányzó/);
});

test("ROSSZ KULCS: kulcskezelési hiba, nem adatromlás — a kettő teendője más", () => {
  const s = seal({ v: 1 }, DEK, KEY.keyId, bind());
  const other: KeyRef = { ...KEY, keyId: "dek-eset-2" };
  const r = open(s, newDek(), other, bind());
  assert.equal(r.ok === false && r.kind, "wrongKey");
  assert.match(r.ok === false ? r.why : "", /Kulcskezelési hiba, nem adatromlás/);
});

test("MEGSEMMISÍTETT kulcs: a bukás nem hiba, hanem a törlés működése", () => {
  const s = seal({ v: 1 }, DEK, KEY.keyId, bind());
  const dead: KeyRef = { ...KEY, state: "destroyed",
    destroyedAt: NOW, destroyReason: "a beteg törlési kérelme" };
  const r = open(s, null, dead, bind());
  assert.equal(r.ok === false && r.kind, "destroyed");
  assert.match(r.ok === false ? r.why : "", /a kriptográfiai törlés működése/);
  assert.match(r.ok === false ? r.why : "", /A bejegyzés LÉTE és a törlés TÉNYE/);
});

/* ── 3. AZ ÉPSÉG KULCS NÉLKÜL ELLENŐRIZHETŐ ─────────────────────────── */

test("a napló lánca a REJTJELEZETT bejegyzéseken is fut — kulcs nélkül", () => {
  // Ez a hidegtár kulcskérdése: egy titkosított másolat épségét ÉVENTE
  // ellenőrizni kell, de minden kulcshasználat kockázat.
  const val = (v: number): Value => ({ value: v, t: NOW, provenance: "clinician" });
  let log: JournalEntry[] = [];
  for (let i = 1; i <= 4; i++) {
    const prev = log[log.length - 1];
    const sealed = seal(val(110 + i), DEK, KEY.keyId,
      bind({ seq: i, prevHash: prev ? prev.hash : "genesis" }));
    log = append(log, {
      caseId: "eset-1", actor: "dr. Teszt", op: "write", at: NOW,
      variableId: "vitals.bp.systolic",
      // A naplóban a REJTJELEZETT alak utazik.
      value: { value: sealed, t: NOW, provenance: "clinician" },
      entryId: "e" + i,
    });
  }
  // Kulcs SEHOL nem szerepel az ellenőrzésben.
  assert.equal(verifyChain(log).ok, true);

  // Egy rejtjelezett bejegyzés megbolygatása a láncon bukik el — visszafejtés nélkül.
  const broken = [...log];
  const s = broken[2].value!.value as ReturnType<typeof seal>;
  broken[2] = { ...broken[2], value: { ...broken[2].value!, value: { ...s, ct: "AAAA" } } };
  const c = verifyChain(broken);
  assert.equal(c.ok, false);
  assert.equal(c.kind, "tampered");
});

/* ── 4. A DEK BURKOLÁSA ─────────────────────────────────────────────── */

test("a burkolt adatkulcs a KEK-kel nyílik, mással nem", () => {
  const kek = randomBytes(32);
  const w = wrapDek(DEK, kek, KEY.keyId, "kek-2026");
  const kekRef: KeyRef = { keyId: "kek-2026", kekId: "root", state: "active", createdAt: NOW };
  assert.deepEqual(unwrapDek(w, kek, kekRef), DEK);
  assert.equal(unwrapDek(w, randomBytes(32), kekRef), null);
});

/* ── 5. KRIPTOGRÁFIAI TÖRLÉS ────────────────────────────────────────── */

const order = (copies: Array<{ where: string; destroyed: boolean }>) =>
  ({ keyId: KEY.keyId, at: NOW, actor: "adatvédelmi tisztviselő",
     reason: "a beteg törlési kérelme (GDPR 17. cikk)", copies });

test("a törlés nem mond igent, amíg EGY kulcsmásolat is él", () => {
  const r = cryptoErase(KEY, order([
    { where: "elsődleges KMS", destroyed: true },
    { where: "letétkezelő #2", destroyed: false },
  ]));
  assert.equal(r.ok, false);
  assert.deepEqual(r.remaining, ["letétkezelő #2"]);
  assert.match(r.why, /éppen a megmaradt példány fogja megcáfolni/);
  assert.equal(r.key.state, "active", "a kulcs állapota nem változott");
});

test("minden másolat megsemmisítése után a kulcs állapota `destroyed`", () => {
  const r = cryptoErase(KEY, order([
    { where: "elsődleges KMS", destroyed: true },
    { where: "földrajzi másolat", destroyed: true },
    { where: "letétkezelő #1", destroyed: true },
  ]));
  assert.equal(r.ok, true);
  assert.equal(r.key.state, "destroyed");
  assert.equal(r.key.destroyedAt, NOW);
  assert.match(r.why, /az adat hiánya önmagában nem bizonyítana semmit/);
});

test("elrendelő vagy indoklás nélkül nincs megsemmisítés", () => {
  const bad = cryptoErase(KEY, { ...order([]), actor: " " });
  assert.equal(bad.ok, false);
  assert.match(bad.why, /visszafordíthatatlan lépés, és a kapunak előtte kell zárnia/);
});

/* ── 6. A LETÉT ─────────────────────────────────────────────────────── */

const policy = (p: Partial<KeyPolicy> = {}): KeyPolicy => ({
  kekRotationDays: 365, dekImmutable: true,
  escrowThreshold: { need: 3, of: 5 }, escrowExcluded: [], ...p });

test("a jó házirend átmegy", () => {
  assert.deepEqual(checkKeyPolicy(policy()), []);
});

test("EGY letétkezelő nem letét", () => {
  const i = checkKeyPolicy(policy({ escrowThreshold: { need: 1, of: 3 } }));
  assert.ok(i.some((x) => /nincs, aki tanú legyen rá/.test(x.message)));
});

test("tartalék nélküli küszöb: a munkaviszony rövidebb, mint a rendszer élettartama", () => {
  const i = checkKeyPolicy(policy({ escrowThreshold: { need: 3, of: 3 } }));
  assert.ok(i.some((x) => /NINCS TARTALÉK/.test(x.message)));
});

test("teljesíthetetlen küszöb: a kulcs nem védett, hanem elveszett", () => {
  const i = checkKeyPolicy(policy({ escrowThreshold: { need: 5, of: 3 } }));
  assert.ok(i.some((x) => /nem védett, hanem elveszett/.test(x.message)));
});

test("a ritka KEK-csere figyelmeztetés, nem hiba — a csere olcsó", () => {
  const i = checkKeyPolicy(policy({ kekRotationDays: 1095 }));
  assert.equal(i.length, 1);
  assert.equal(i[0].severity, "warning");
});

/* ── 7. MIGRÁCIÓ ────────────────────────────────────────────────────── */

const mig = (p: Partial<MigrationRecord> = {}): MigrationRecord => ({
  at: NOW, actor: "üzemeltetési vezető", reason: "keyCompromise",
  why: "a KEK kompromittálódott", fromHash: "aaa", toHash: "bbb",
  fromCipher: "AES-256-GCM", toCipher: "AES-256-GCM",
  fromKeyId: "dek-1", toKeyId: "dek-2", ...p });

test("a migrációs rekord köti össze a régi lánc végét az újjal", () => {
  assert.deepEqual(checkMigration(mig()), []);
});

test("azonos lánc-lenyomat: ez nem migráció", () => {
  assert.ok(checkMigration(mig({ toHash: "aaa" })).some((b) => /nem migráció/.test(b)));
});

test("ugyanaz a kulcs és algoritmus: a lánc elszakadt, cserébe semmiért", () => {
  const bad = checkMigration(mig({ toKeyId: "dek-1" }));
  assert.ok(bad.some((b) => /viszont a lánc elszakadt/.test(b)));
});

test("a migráció nem történik magától", () => {
  assert.ok(checkMigration(mig({ actor: "" })).some((b) => /nem történik magától/.test(b)));
});
