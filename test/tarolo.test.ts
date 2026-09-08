/**
 * A 18 LÉPÉS 1. LÉPÉSÉNEK ELFOGADÁSI KRITÉRIUMA, TESZTKÉNT.
 *
 * `docs/13-18-lepes.md`:
 *
 *   „Egy eset mentése és visszatöltése túléli az újraindítást; minden olvasás
 *    és írás naplózódik ki-mit-mikor bontásban; a napló maga nem módosítható;
 *    és van egy teszt, ami bizonyítja, hogy jogosultság nélküli olvasás nem
 *    ad adatot, hanem hibát.”
 *
 * Négy állítás, négy tesztcsoport. Az utolsó a legfontosabb, és a legkönnyebb
 * elrontani: az elutasításnak HIBÁT kell adnia, nem üres eredményt — az üres
 * eredményre a hívó ráépít egy döntést, a hibára nem.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

import { memorySink, type AuditEvent, type Sink } from "../core/log/types.ts";
import {
  MemoryArchive, SecureCaseStore, sealedHash, verifySealedChain,
  type KeyStore, type StoredEntry, type Who,
} from "../core/store/biztonsagos.ts";
import { FileArchive } from "../core/store/fajl.ts";
import {
  checkBreakGlass, decide, pendingReviews, relationActive,
  type CareRelation,
} from "../core/store/hozzaferes.ts";
import type { KeyRef } from "../core/crypto/types.ts";

const NOW = "2026-09-04T10:00:00.000Z";
const now = () => NOW;

/** Kulcstár teszthez: esetenkénti kulcs, megsemmisíthető. */
function keyStore(): KeyStore & { destroy(caseId: string, why: string): void } {
  const keys = new Map<string, { dek: Buffer | null; key: KeyRef }>();
  return {
    dek(caseId) {
      if (!keys.has(caseId)) {
        keys.set(caseId, {
          dek: randomBytes(32),
          key: { keyId: `dek.${caseId}`, kekId: "kek.teszt", state: "active",
                 createdAt: NOW },
        });
      }
      return keys.get(caseId)!;
    },
    destroy(caseId, why) {
      const e = keys.get(caseId)!;
      keys.set(caseId, { dek: null, key: {
        ...e.key, state: "destroyed", destroyedAt: NOW, destroyReason: why } });
    },
  };
}

const REL: CareRelation[] = [
  { actor: "dr. Minta Anna", caseId: "eset-1", from: "2026-09-01T00:00:00.000Z",
    until: null, why: "szülőszobai felvétel" },
  { actor: "dr. Minta Anna", caseId: "eset-2", from: "2026-09-01T00:00:00.000Z",
    until: null, why: "szülőszobai felvétel" },
  { actor: "dr. Régi Rezső", caseId: "eset-1", from: "2024-01-01T00:00:00.000Z",
    until: "2024-03-01T00:00:00.000Z", why: "korábbi terhesgondozás" },
];

const ANNA: Who = { actor: "dr. Minta Anna", roles: ["clinician"] };

function val(v: unknown, t = NOW) {
  return { value: v, t, provenance: "clinician" as const, confidence: "measured" as const };
}

function store(over: Partial<Parameters<typeof mk>[0]> = {}) { return mk(over); }
function mk(o: {
  archive?: MemoryArchive | FileArchive; sink?: Sink; keys?: KeyStore;
  relations?: CareRelation[];
} = {}) {
  const sink = o.sink ?? memorySink();
  const keys = o.keys ?? keyStore();
  const archive = o.archive ?? new MemoryArchive();
  return {
    s: new SecureCaseStore({
      archive, keys, sink, relations: o.relations ?? REL, now,
    }),
    sink, keys, archive,
  };
}

/* ══ 1. AZ ESET TÚLÉLI AZ ÚJRAINDÍTÁST ═════════════════════════════════ */

test("az eset túléli az újraindítást — új tárolópéldány ugyanazt olvassa", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-tarolo-"));
  const keys = keyStore();
  const sink = memorySink();

  const első = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink, relations: REL, now });
  const w = await első.write("eset-1", ANNA, [
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(3) },
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(5) },
  ]);
  assert.equal(w.ok, true);
  assert.equal(w.ok && w.durability, "local",
    "a „mentve” szó csak tartós tárolón mondható ki");

  // ÚJRAINDÍTÁS: teljesen új tárolópéldány, új nyelő, semmi közös memória.
  //
  // A KULCSTÁR SZÁNDÉKOSAN UGYANAZ. Ez nem a teszt gyengesége, hanem a
  // rétegek helyes elválasztása: az adat tartósságát ez a réteg oldja meg,
  // a KULCS tartósságát a HSM/KMS. Ha a kulcstárat is ez tartaná, a
  // titkosítás az adat mellett feküdne — vagyis nem védene semmit.
  const második = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL, now });
  const r = await második.read("eset-1", ANNA);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.entries, 2);
  assert.deepEqual(r.state.values["labour.cervix"].map((v) => v.value), [3, 5],
    "a 3 cm-es tágulat nem tűnt el, amikor 5 lett");
});

test("a memóriabeli archívum NEM mondja azt, hogy mentve", async () => {
  const { s } = mk();
  const w = await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(88) }]);
  assert.equal(w.ok && w.durability, "buffered",
    "pufferben álló bejegyzésre „mentve”-t írni nem optimalizálás, hanem hazugság");
});

/* ══ 2. MINDEN OLVASÁS ÉS ÍRÁS NAPLÓZÓDIK ══════════════════════════════ */

test("az írás és az olvasás is auditsort hagy, ki-mit-mikor bontásban", async () => {
  const sink = memorySink();
  const { s } = mk({ sink });
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "labour.cervix", value: val(4) }]);
  await s.read("eset-1", ANNA);

  const audit = sink.events.filter((e): e is AuditEvent => e.kind === "audit");
  assert.deepEqual(audit.map((e) => e.action), ["write", "read"]);
  for (const e of audit) {
    assert.equal(e.actor, "dr. Minta Anna", "KI");
    assert.equal(e.caseId, "eset-1", "MIN");
    assert.equal(e.at, NOW, "MIKOR");
    assert.ok(e.basis.length > 0, "MIÉRT — jogalap nélkül nem auditsor");
  }
  assert.deepEqual(audit[0].variableIds, ["labour.cervix"]);
});

test("a jogalapot a DÖNTÉS adja, nem a hívó gépeli be", async () => {
  const sink = memorySink();
  const { s } = mk({ sink });
  await s.read("eset-1", ANNA);
  const a = sink.events.find((e): e is AuditEvent => e.kind === "audit")!;
  assert.match(a.basis, /ellátási kapcsolat: szülőszobai felvétel/,
    "a jogalap megnevezi, MELYIK szabály engedte");
});

test("az AUDITÁLHATATLAN olvasás meg nem történt olvasás", async () => {
  const rossz: Sink = {
    op() {},
    audit() { throw new Error("az auditnapló nem elérhető"); },
  };
  const { s } = mk({ sink: rossz });
  await assert.rejects(() => s.read("eset-1", ANNA), /auditnapló nem elérhető/,
    "ha a naplózás elbukik, a MŰVELET bukik el — adat nem mehet ki");
});

test("a működési napló nem tartalmaz betegadatot, csak azonosítót és számot", async () => {
  const sink = memorySink();
  const { s } = mk({ sink });
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "patient.taj", value: val("123456789") }]);
  const op = sink.events.filter((e) => e.kind === "op");
  const dump = JSON.stringify(op);
  assert.ok(!dump.includes("123456789"),
    "a TAJ-szám értéke a MŰKÖDÉSI naplóba nem kerülhet");
});

/* ══ 3. A NAPLÓ MAGA NEM MÓDOSÍTHATÓ ═══════════════════════════════════ */

test("egyetlen megbolygatott bit KULCS NÉLKÜL is kiderül", async () => {
  const { s, archive } = mk();
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(88) }]);

  const stored = await (archive as MemoryArchive).read("eset-1");
  const ct = Buffer.from(stored[0].sealed.ct, "base64");
  ct[0] ^= 0xff;                                  // egyetlen bit
  stored[0].sealed.ct = ct.toString("base64");
  (archive as MemoryArchive)["data"].set("eset-1", stored);

  const v = await s.verifyArchive("eset-1");
  assert.equal(v.ok, false, "az épség-ellenőrzéshez nem kell kulcs");
  assert.match(v.why, /MEGVÁLTOZOTT/);

  const r = await s.read("eset-1", ANNA);
  assert.equal(!r.ok && r.kind, "corrupt");
});

/**
 * AMIT A REJTJELEZETT LÁNC NEM AD MEG — és amit könnyű túlígérni.
 *
 * A `sealedHash` NEM kulccsal hitelesített: aki írni tud az archívumba, újra
 * is tudja számolni. A rejtjelezett lánc tehát a ROMLÁST és a naiv
 * hamisítást fogja meg, nem a felkészült támadót — az utóbbi ellen az AEAD
 * címke véd, amihez viszont kulcs kell.
 *
 * A kettő ezért NEM egymás helyettesítője. Ha csak a láncot néznénk, egy
 * újraszámolt archívum épnek látszana; ha csak a címkét, a törölt bejegyzés
 * maradna észrevétlen.
 */
test("az újraszámolt lánc épnek látszik — de a tartalom NEM nyílik fel", async () => {
  const { s, archive } = mk();
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(88) }]);

  const stored = await (archive as MemoryArchive).read("eset-1");
  const ct = Buffer.from(stored[0].sealed.ct, "base64");
  ct[0] ^= 0xff;
  stored[0].sealed.ct = ct.toString("base64");
  // a támadó ÚJRASZÁMOLJA a láncot — kulcs nélkül is meg tudja tenni
  stored[0].sealedHash = sealedHash(stored[0].prevSealedHash, stored[0].seq, stored[0].sealed);
  (archive as MemoryArchive)["data"].set("eset-1", stored);

  const v = await s.verifyArchive("eset-1");
  assert.equal(v.ok, true, "a lánc épnek látszik — ennyit tud kulcs nélkül");

  const r = await s.read("eset-1", ANNA);
  assert.equal(!r.ok && r.kind, "unreadable",
    "a hamisítást az AEAD-címke fogja meg, és ahhoz KULCS kell");
});

test("a kitörölt bejegyzés hézagként derül ki — visszafejtés nélkül is", async () => {
  const { s, archive } = mk();
  await s.write("eset-1", ANNA, [
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(3) },
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(5) },
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(7) },
  ]);
  const stored = await (archive as MemoryArchive).read("eset-1");
  (archive as MemoryArchive)["data"].set("eset-1", [stored[0], stored[2]]);

  const v = await s.verifyArchive("eset-1");
  assert.equal(v.ok, false, "az épségellenőrzés visszafejtés NÉLKÜL fogja meg");
  const r = await s.read("eset-1", ANNA);
  assert.equal(!r.ok && r.kind, "corrupt");
  assert.match(!r.ok ? r.why : "", /Hiányzik vagy átrendeződött/);
});

test("két napló összefésülése nem lesz hiteles lánc", async () => {
  const { s, archive, keys } = mk();
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(80) }]);
  await s.write("eset-2", { ...ANNA }, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(90) }]);

  const a = await (archive as MemoryArchive).read("eset-1");
  const b = await (archive as MemoryArchive).read("eset-2");
  // a MÁSIK eset bejegyzését illesztjük ide, 2. sorszámmal
  (archive as MemoryArchive)["data"].set("eset-1",
    [a[0], { ...b[0], seq: 2, prevHash: a[0].hash }]);

  const r = await s.read("eset-1", ANNA);
  assert.equal(r.ok, false, "az áthelyezett bejegyzés nem nyílhat fel");
  void keys;
});

test("SÉRÜLT LÁNCRA NEM ÍRUNK — a hibás előzmény hitelesítése a legrosszabb", async () => {
  const { s, archive } = mk();
  await s.write("eset-1", ANNA, [
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(3) },
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(5) },
  ]);
  const stored = await (archive as MemoryArchive).read("eset-1");
  (archive as MemoryArchive)["data"].set("eset-1", [stored[1]]);   // az elsőt elvágtuk

  const w = await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "labour.cervix", value: val(7) }]);
  assert.equal(w.ok, false);
  assert.equal(!w.ok && w.kind, "corrupt");
});

test("a kriptográfiai törlés után a LÉTE megmarad, a tartalma nem", async () => {
  const keys = keyStore();
  const { s } = mk({ keys });
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(88) }]);

  keys.destroy("eset-1", "GDPR törlési kérelem");

  const v = await s.verifyArchive("eset-1");
  assert.equal(v.ok, true, "a lánc ÉP marad — a törlés ténye maga is rekord");
  assert.equal(v.entries, 1);

  const r = await s.read("eset-1", ANNA);
  assert.equal(!r.ok && r.kind, "unreadable");
  assert.match(!r.ok ? r.why : "", /MEGSEMMISÍTETT/);

  const w = await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(90) }]);
  assert.equal(w.ok, false, "törölt esethez hozzáírni nem lehet");
});

/* ══ 4. JOGOSULTSÁG NÉLKÜL NINCS ADAT — HIBA VAN ═══════════════════════ */

test("a jogosultság nélküli olvasás HIBÁT ad, nem üres eredményt", async () => {
  const { s } = mk();
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "labour.cervix", value: val(4) }]);

  const idegen: Who = { actor: "dr. Kíváncsi Károly", roles: ["clinician"] };
  const r = await s.read("eset-1", idegen);

  assert.equal(r.ok, false, "NEM üres eredmény");
  assert.equal(!r.ok && r.kind, "denied");
  assert.ok(!("state" in r), "az elutasított olvasás NEM ad vissza állapotot");
  assert.match(!r.ok ? r.why : "", /nincs ellátási kapcsolat/);
});

test("az elutasítás maga is auditsor, indoklással", async () => {
  const sink = memorySink();
  const { s } = mk({ sink });
  await s.read("eset-1", { actor: "dr. Kíváncsi Károly", roles: ["clinician"] });
  const a = sink.events.find((e): e is AuditEvent => e.kind === "audit")!;
  assert.equal(a.action, "denied");
  assert.ok(a.denyReason && a.denyReason.length > 0,
    "az elutasítás oka legalább annyira lelet, mint a hozzáférés ténye");
});

test("szerepkör nélkül nincs hozzáférés — a hiány nem „még nem osztották ki”", () => {
  const d = decide({ actor: "X", roles: [], action: "read", caseId: "eset-1",
    now: NOW, relations: REL });
  assert.equal(d.ok, false);
  assert.match(!d.ok ? d.why : "", /egyetlen szerepkörrel sem/);
});

test("a LEZÁRT ellátás után a jog megszűnik — és más a teendő, mint ha sosem lett volna", async () => {
  const { s } = mk();
  const r = await s.read("eset-1", { actor: "dr. Régi Rezső", roles: ["clinician"] });
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.why : "", /MÁR NEM ÉL/);
  assert.match(!r.ok ? r.why : "", /2024-03-01/, "megmondja, mikor zárult le");
});

test("az auditor auditnaplót olvas, LELETET NEM", () => {
  const d = decide({ actor: "Ellenőr E.", roles: ["auditor"], action: "read",
    caseId: "eset-1", now: NOW, relations: [] });
  assert.equal(d.ok, false);
  assert.match(!d.ok ? d.why : "", /egyik szerepkör sem elég/);
});

test("a beteg a SAJÁT esetét olvashatja, a másét nem", () => {
  const enyém = decide({ actor: "Beteg B.", roles: ["patient"], action: "read",
    caseId: "eset-1", now: NOW, relations: [], ownCaseIds: ["eset-1"] });
  assert.equal(enyém.ok, true);

  const másé = decide({ actor: "Beteg B.", roles: ["patient"], action: "read",
    caseId: "eset-2", now: NOW, relations: [], ownCaseIds: ["eset-1"] });
  assert.equal(másé.ok, false);
});

test("az asszisztens rögzíthet, de nem exportálhat", () => {
  const ír = decide({ actor: "Asszisztens A.", roles: ["assistant"], action: "write",
    caseId: "eset-1", now: NOW, relations: [
      { actor: "Asszisztens A.", caseId: "eset-1", from: "2026-09-01T00:00:00.000Z",
        until: null, why: "osztályos munka" }] });
  assert.equal(ír.ok, true);

  const exportál = decide({ actor: "Asszisztens A.", roles: ["assistant"],
    action: "export", caseId: "eset-1", now: NOW, relations: [] });
  assert.equal(exportál.ok, false);
});

/* ══ SÜRGŐSSÉGI HOZZÁFÉRÉS — mert a tiltás is öl ═══════════════════════ */

test("a sürgősségi hozzáférés INDOKLÁS és FELÜLVIZSGÁLÓ nélkül érvénytelen", () => {
  assert.equal(checkBreakGlass({
    declaredBy: "dr. Ügyeletes Ü.", at: NOW, reason: "", reviewBy: "",
    reviewDeadline: "" }).length, 3);
});

test("a teljes bejelentéssel átmegy — MEGJELÖLVE, és tartozást hagy maga után", async () => {
  const sink = memorySink();
  const { s } = mk({ sink });
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(120) }]);

  const ügyeletes: Who = {
    actor: "dr. Ügyeletes Ü.", roles: ["clinician"],
    breakGlass: {
      declaredBy: "dr. Ügyeletes Ü.", at: NOW,
      reason: "eszméletlen beteg, előzmény ismeretlen",
      reviewBy: "dr. Osztályvezető O.",
      reviewDeadline: "2026-09-11T10:00:00.000Z",
    },
  };
  const r = await s.read("eset-1", ügyeletes);
  assert.equal(r.ok, true, "a tiltás is öl — a sürgősségi út nyitva van");
  assert.equal(r.ok && r.breakGlass, true, "de MEGJELÖLVE");

  const audit = sink.events.filter((e): e is AuditEvent => e.kind === "audit");
  const p = pendingReviews(audit, NOW);
  assert.equal(p.length, 1, "a sürgősségi hozzáférés TARTOZÁST hagy maga után");
  assert.equal(p[0].reviewBy, "dr. Osztályvezető O.");
  assert.equal(p[0].overdue, false);

  const késve = pendingReviews(audit, "2026-10-01T00:00:00.000Z");
  assert.equal(késve[0].overdue, true,
    "a határidőn túli felülvizsgálat nem elévült, hanem ELMARADT");
});

test("a rendes hozzáférés NEM kerül a felülvizsgálati listára", async () => {
  const sink = memorySink();
  const { s } = mk({ sink });
  await s.read("eset-1", ANNA);
  const audit = sink.events.filter((e): e is AuditEvent => e.kind === "audit");
  assert.equal(pendingReviews(audit, NOW).length, 0);
});

/* ══ AZ ARCHÍVUM ELLENŐRZÉSE OLVASÁSI JOG NÉLKÜL ═══════════════════════ */

test("az üzemeltető bizonyíthatja, hogy ép — anélkül hogy elolvashatná", async () => {
  const { s } = mk();
  await s.write("eset-1", ANNA, [
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(3) },
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(5) },
  ]);
  const v = await s.verifyArchive("eset-1");
  assert.equal(v.ok, true);
  assert.equal(v.entries, 2);
  assert.match(v.why, /nem lett visszafejtve/);
});

/* ══ A FÁJLARCHÍVUM ════════════════════════════════════════════════════ */

test("az esetazonosító nem vezethet ki a tárolókönyvtárból", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-tarolo-"));
  const a = new FileArchive(dir);
  await assert.rejects(() => a.read("../../etc/passwd"), /Érvénytelen esetazonosító/);
  await assert.rejects(() => a.read(".rejtett"), /Érvénytelen esetazonosító/);
});

test("a csonka UTOLSÓ sor félbeszakadt írás — bárhol máshol sérülés", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ogdoc-tarolo-"));
  const keys = keyStore();
  const s = new SecureCaseStore({
    archive: new FileArchive(dir), keys, sink: memorySink(), relations: REL, now });
  await s.write("eset-1", ANNA, [
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(3) },
    { op: "write", at: NOW, variableId: "labour.cervix", value: val(5) },
  ]);
  const file = join(dir, "eset-1.jsonl");

  // félbeszakadt írás a VÉGÉN: az utolsó bejegyzés nem lett tartós
  writeFileSync(file, readFileSync(file, "utf8") + '{"seq":3,"ent');
  const r = await s.read("eset-1", ANNA);
  assert.equal(r.ok, true, "a nem tartós bejegyzés nem is történt meg");
  assert.equal(r.ok && r.entries, 2);

  // csonka sor KÖZÉPEN: az már sérülés
  const jó = readFileSync(file, "utf8").split("\n").filter(Boolean).slice(0, 2);
  writeFileSync(file, `{"seq":1,"cson\n${jó[1]}\n`);
  await assert.rejects(() => s.read("eset-1", ANNA), /nem az.*utolsó|sérülés/s);
});

test("a lejárt kapcsolat idővonala pontosan számol", () => {
  const r: CareRelation = { actor: "a", caseId: "c",
    from: "2026-01-01T00:00:00.000Z", until: "2026-02-01T00:00:00.000Z", why: "x" };
  assert.equal(relationActive(r, "2026-01-15T00:00:00.000Z"), true);
  assert.equal(relationActive(r, "2025-12-31T00:00:00.000Z"), false);
  assert.equal(relationActive(r, "2026-03-01T00:00:00.000Z"), false);
  assert.equal(relationActive({ ...r, until: null }, "2030-01-01T00:00:00.000Z"), true);
});

test("a rosszul formált tárolt bejegyzés MEGNEVEZETT hiba, nem összeomlás", async () => {
  const { s, archive } = mk();
  await s.write("eset-1", ANNA, [{ op: "write", at: NOW,
    variableId: "vitals.pulse", value: val(88) }]);
  const stored = await (archive as MemoryArchive).read("eset-1");
  delete (stored[0] as Partial<StoredEntry>).sealed;
  (archive as MemoryArchive)["data"].set("eset-1", stored);

  const r = await s.read("eset-1", ANNA);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.kind, "corrupt",
    "az archívumból jövő adat KÜLSŐ adat — a hiánya megnevezett hiba, nem TypeError");
});

test("az üres archívum ÉRVÉNYES állapot, de a hiányt kimondja", () => {
  const r = verifySealedChain([]);
  assert.equal(r.ok, true);
  assert.match(r.why, /a szállítmány veszett el, nem az eset volt üres/);
});
