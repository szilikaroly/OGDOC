/**
 * A BIZTONSÁGOS TÁROLÓ — futtatható minta.
 *
 *   npm run demo:tarolo
 *
 * A 18 lépés 1. lépése működés közben. Amit megmutat, és amit egy
 * képernyőterven nem lehet:
 *
 *   · mi történik, ha valakinek NINCS joga — és miért nem üres eredmény;
 *   · mit lát az auditnapló, és mit NEM lát a működési napló;
 *   · hogy a lezárt ellátás után a jog megszűnik;
 *   · hogy a sürgősségi hozzáférés nyitva van, de tartozást hagy;
 *   · hogy a megbolygatott archívum kiderül — visszafejtés nélkül is;
 *   · és hogy a törölt eset LÉTE megmarad, a tartalma nem.
 *
 * MINDEN ADAT SZINTETIKUS.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

import { memorySink, type AuditEvent } from "../core/log/types.ts";
import { SecureCaseStore, type KeyStore, type Who } from "../core/store/biztonsagos.ts";
import { FileArchive } from "../core/store/fajl.ts";
import { pendingReviews, type CareRelation } from "../core/store/hozzaferes.ts";
import type { KeyRef } from "../core/crypto/types.ts";

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const OK = (s: string) => `\x1b[32m${s}\x1b[0m`;
const WARN = (s: string) => `\x1b[33m${s}\x1b[0m`;
const BAD = (s: string) => `\x1b[31m${s}\x1b[0m`;

function h(n: string, t: string): void {
  console.log(`\n${B(n + "  " + t)}\n${"─".repeat(t.length + n.length + 2)}`);
}
function wrap(text: string, indent = "    ", width = 78): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + w.length + 1 > width) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines.map((l) => indent + l).join("\n");
}

const NOW = "2026-09-04T10:00:00.000Z";
const now = () => NOW;
const v = (x: unknown) => ({ value: x, t: NOW,
  provenance: "clinician" as const, confidence: "measured" as const });

const keys = new Map<string, { dek: Buffer | null; key: KeyRef }>();
const keyStore: KeyStore = {
  dek(caseId) {
    if (!keys.has(caseId)) {
      keys.set(caseId, { dek: randomBytes(32),
        key: { keyId: `dek.${caseId}`, kekId: "kek.demo", state: "active", createdAt: NOW } });
    }
    return keys.get(caseId)!;
  },
};

const relations: CareRelation[] = [
  { actor: "dr. Minta Anna", caseId: "eset-1", from: "2026-09-01T00:00:00.000Z",
    until: null, why: "szülőszobai felvétel" },
  { actor: "dr. Régi Rezső", caseId: "eset-1", from: "2024-01-01T00:00:00.000Z",
    until: "2024-03-01T00:00:00.000Z", why: "korábbi terhesgondozás" },
];

const dir = mkdtempSync(join(tmpdir(), "ogdoc-demo-"));
const sink = memorySink();
const archive = new FileArchive(dir);
const store = new SecureCaseStore({ archive, keys: keyStore, sink, relations, now });

const ANNA: Who = { actor: "dr. Minta Anna", roles: ["clinician"] };

/* ══ 1. ÍRÁS, ÉS A „MENTVE” SZÓ ═══════════════════════════════════════ */

h("1.", "Írás — és mikor mondhatjuk azt, hogy mentve");

const w = await store.write("eset-1", ANNA, [
  { op: "write", at: NOW, variableId: "labour.cervix", value: v(3) },
  { op: "write", at: NOW, variableId: "labour.cervix", value: v(5) },
  { op: "write", at: NOW, variableId: "vitals.pulse", value: v(96) },
]);
console.log(`  ${w.ok ? OK("✓") : BAD("✗")} 3 bejegyzés · tartósság: ${
  B(w.ok ? w.durability : "—")} · fájl: ${DIM(archive.path("eset-1"))}`);
console.log(DIM(`\n  A „local” azt jelenti, hogy az fsync megtörtént — a fájlra ÉS a`));
console.log(DIM(`  könyvtárra. Új fájlnál a második nélkül a tartalom megvan az`));
console.log(DIM(`  áramszünet után, csak épp nincs neve.`));

/* ══ 2. ÚJRAINDÍTÁS ═══════════════════════════════════════════════════ */

h("2.", "Újraindítás — az eset túléli");

const újra = new SecureCaseStore({
  archive: new FileArchive(dir), keys: keyStore, sink: memorySink(), relations, now });
const r1 = await újra.read("eset-1", ANNA);
if (r1.ok) {
  console.log(`  ${OK("✓")} ${r1.entries} bejegyzés visszaolvasva, teljesen új példányból`);
  console.log(`    tágulat: ${B(r1.state.values["labour.cervix"].map((x) => x.value).join(" → "))} cm`);
  console.log(DIM(`\n  A 3 cm nem tűnt el, amikor 5 lett: az eseménysor a rekord,`));
  console.log(DIM(`  az állapot csak a vetülete. Ez az IPRACS legfőbb hibájának javítása.`));
}

/* ══ 3. AKINEK NINCS JOGA ═════════════════════════════════════════════ */

h("3.", "Akinek nincs joga — és miért nem üres eredményt kap");

for (const [ki, who] of [
  ["idegen klinikus", { actor: "dr. Kíváncsi Károly", roles: ["clinician"] }],
  ["lezárt ellátás", { actor: "dr. Régi Rezső", roles: ["clinician"] }],
  ["auditor", { actor: "Ellenőr E.", roles: ["auditor"] }],
  ["szerepkör nélkül", { actor: "Senki S.", roles: [] }],
] as Array<[string, Who]>) {
  const r = await store.read("eset-1", who);
  console.log(`  ${BAD("✗")} ${ki.padEnd(20)} ${r.ok ? "" : BAD(r.kind)}`);
  if (!r.ok) console.log(DIM(wrap(r.why)));
}
console.log(DIM(`\n  Egyik sem üres eredmény: az üresre a hívó ráépítene egy döntést`));
console.log(DIM(`  („nincs adat, tehát nem volt”), a megnevezett hibára nem.`));

/* ══ 4. SÜRGŐSSÉGI HOZZÁFÉRÉS ═════════════════════════════════════════ */

h("4.", "Sürgősségi hozzáférés — mert a tiltás is öl");

const ügyeletes: Who = {
  actor: "dr. Ügyeletes Ü.", roles: ["clinician"],
  breakGlass: { declaredBy: "dr. Ügyeletes Ü.", at: NOW,
    reason: "eszméletlen beteg, előzmény ismeretlen",
    reviewBy: "dr. Osztályvezető O.", reviewDeadline: "2026-09-11T10:00:00.000Z" },
};
const r2 = await store.read("eset-1", ügyeletes);
console.log(`  ${r2.ok ? OK("✓ átment") : BAD("✗")}${
  r2.ok && r2.breakGlass ? WARN("  — MEGJELÖLVE") : ""}`);

const audit = sink.events.filter((e): e is AuditEvent => e.kind === "audit");
for (const p of pendingReviews(audit, "2026-10-01T00:00:00.000Z")) {
  console.log(`  ${WARN("⚠")} felülvizsgálatra vár: ${B(p.reviewBy)} · határidő ${
    p.reviewDeadline.slice(0, 10)} ${p.overdue ? BAD("— LEJÁRT") : ""}`);
  console.log(DIM(`      indok: ${p.reason}`));
}
console.log(DIM(`\n  A harmadik feltétel az, amit a legtöbb rendszer kihagy: valakinek`));
console.log(DIM(`  UTÓLAG meg kell néznie, névvel és határidővel. Enélkül a sürgősségi`));
console.log(DIM(`  hozzáférés nem kapu, hanem nyitva hagyott ajtó.`));

/* ══ 5. A KÉT NAPLÓ ═══════════════════════════════════════════════════ */

h("5.", "A két napló — és ami az egyikbe nem kerülhet bele");

console.log(B("  Auditnapló (ki · mit · mikor · miért)"));
for (const e of audit) {
  console.log(`    ${e.at.slice(11, 16)}  ${e.action.padEnd(7)} ${
    e.actor.padEnd(20)} ${DIM(e.basis.slice(0, 46))}`);
}
const op = sink.events.filter((e) => e.kind === "op");
console.log(B(`\n  Működési napló (${op.length} sor)`));
console.log(DIM(`    Betegadat nincs benne — sem érték, sem TAJ. Ez a napló kikerül`));
console.log(DIM(`    fejlesztői gépre, jegyre, képernyőképre; az auditnapló soha.`));

/* ══ 6. A MEGBOLYGATOTT ARCHÍVUM ══════════════════════════════════════ */

h("6.", "A megbolygatott archívum — visszafejtés nélkül is kiderül");

const v1 = await store.verifyArchive("eset-1");
console.log(`  ${v1.ok ? OK("✓ ép") : BAD("✗")}`);
console.log(DIM(wrap(v1.why)));

const entries = await archive.read("eset-1");
const csonka = new FileArchive(dir);
csonka.read = async () => [entries[0], entries[2]];      // a középsőt kivettük
const sérült = new SecureCaseStore({
  archive: csonka, keys: keyStore, sink: memorySink(), relations, now });
const v2 = await sérült.verifyArchive("eset-1");
console.log(`\n  ${BAD("✗ hiányzik egy bejegyzés")}`);
console.log(DIM(wrap(v2.why)));

const r3 = await sérült.write("eset-1", ANNA, [
  { op: "write", at: NOW, variableId: "vitals.pulse", value: v(110) }]);
console.log(`\n  írás a sérült láncra: ${BAD(r3.ok ? "átment (!)" : r3.kind)}`);
console.log(DIM(`  A hibás előzményre fűzött bejegyzés a SÉRÜLÉST hitelesítené —`));
console.log(DIM(`  onnantól a romlás ugyanolyan „ép” láncnak látszana, mint a valódi.`));

/* ══ 7. A KRIPTOGRÁFIAI TÖRLÉS ════════════════════════════════════════ */

h("7.", "Törlés — a léte megmarad, a tartalma nem");

const e = keys.get("eset-1")!;
keys.set("eset-1", { dek: null, key: { ...e.key, state: "destroyed",
  destroyedAt: NOW, destroyReason: "GDPR törlési kérelem" } });

const v3 = await store.verifyArchive("eset-1");
console.log(`  lánc:      ${v3.ok ? OK("ÉP") : BAD("sérült")} (${v3.entries} bejegyzés)`);
const r4 = await store.read("eset-1", ANNA);
console.log(`  tartalom:  ${BAD(r4.ok ? "olvasható (!)" : r4.kind)}`);
if (!r4.ok) console.log(DIM(wrap(r4.why)));
console.log(DIM(`\n  Ez a válasz arra, hogy „hogyan törölsz egy megmásíthatatlan`));
console.log(DIM(`  mentésből”: a kulcs semmisül meg, nem a bejegyzés. A törlés TÉNYE`));
console.log(DIM(`  ezért bizonyítható marad — és éppen ezt kell évekkel később bizonyítani.`));

console.log(`\n${DIM("Minden adat szintetikus. Valódi betegadattal ez a demó nem futtatható.")}`);
