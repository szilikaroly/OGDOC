/**
 * NAPLÓZÁS — a mag hallgat, a gazda dönt.
 *
 * A tesztek három állítást védenek:
 *
 *   1. a `core/` egyetlen `console.*` hívást sem tartalmaz;
 *   2. a MŰKÖDÉSI naplóba nem szivároghat betegadat;
 *   3. az auditsor „ki · mit · min · miért" nélkül nem auditsor.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import {
  auditRedaction, checkAudit, memorySink,
  type AuditEvent, type OpEvent,
} from "../core/log/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const NOW = "2026-09-03T10:00:00.000Z";

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (f.endsWith(".ts")) out.push(p);
  }
  return out;
}

/* ── 1. A MAG HALLGAT ───────────────────────────────────────────────── */

test("a `core/` egyetlen console.* hívást sem tartalmaz", () => {
  // Egy könyvtár, ami ír valahova, eldönti a gazdája helyett, mi fontos — és
  // beleír egy csatornába, amit nem ő tart karban. A magban emiatt sem
  // hibakeresési kiírás, sem „csak ideiglenesen" bennfelejtett log nincs.
  const guilty: string[] = [];
  for (const f of tsFiles(join(HERE, "..", "core"))) {
    const src = readFileSync(f, "utf8");
    // Sorokra bontva, hogy a dokumentációs blokkokban szereplő szöveg ne
    // számítson találatnak.
    src.split("\n").forEach((line, i) => {
      const code = line.replace(/^\s*(\*|\/\/).*/, "");
      if (/\bconsole\s*\.\s*(log|info|warn|error|debug|trace)\s*\(/.test(code)) {
        guilty.push(`${f.split("/core/")[1]}:${i + 1}`);
      }
    });
  }
  assert.deepEqual(guilty, [],
    "a mag nem naplóz — a `why` mezőt adja vissza, és a gazda dönt");
});

/* ── 2. A MŰKÖDÉSI NAPLÓ NEM SZIVÁROG ───────────────────────────────── */

const op = (data: OpEvent["data"]): OpEvent =>
  ({ kind: "op", level: "info", at: NOW, where: "teszt", message: "próba", data });

test("a `phi: true` változó azonosítója nem lehet működési naplókulcs", () => {
  const phi = REG.all().find((d) => d.phi)!;
  assert.ok(phi, "a regiszterben van legalább egy `phi` jelölésű változó");
  const issues = auditRedaction(REG, op({ [phi.id]: "bármi" }));
  assert.equal(issues.length, 1);
  assert.match(issues[0].why, /`phi: true`/);
  assert.match(issues[0].why, /csak az auditnapló hivatkozhat rá azonosítóként/);
});

test("a kulcs NEVE is árulkodik — nem csak a regiszterbeli jelölés", () => {
  // A naplósorba kézzel írt kulcs is kerül, és éppen az a veszélyes: azt
  // semmilyen regiszterbeli jelölés nem védi.
  for (const k of ["tajSzam", "anyjaNeve", "lakcim", "beteg_email"]) {
    const issues = auditRedaction(REG, op({ [k]: "x" }));
    assert.equal(issues.length, 1, `${k} átcsúszott`);
    assert.match(issues[0].why, /nevezd át/);
  }
});

test("a hosszú szabad szöveg magától gyanús", () => {
  const issues = auditRedaction(REG, op({ reszlet: "a".repeat(201) }));
  assert.equal(issues.length, 1);
  assert.match(issues[0].why, /senki nem olvassa el/);
});

test("a tiszta esemény tiszta marad — nincs fals riasztás", () => {
  const issues = auditRedaction(REG, op({ elapsedMs: 12, fieldCount: 40, ok: true }));
  assert.deepEqual(issues, []);
});

test("a vizsgálat MEGNEVEZ, nem javít", () => {
  // A csendben megtisztított napló arról hazudik, hogy a hívó rendben írt.
  const e = op({ szemelyiSzam: "titok" });
  auditRedaction(REG, e);
  assert.equal(e.data!.szemelyiSzam, "titok", "az esemény változatlan maradt");
});

/* ── 3. AZ AUDITSOR TELJESSÉGE ──────────────────────────────────────── */

const audit = (p: Partial<AuditEvent>): AuditEvent => ({
  kind: "audit", at: NOW, actor: "dr. Teszt Elek", action: "read",
  caseId: "eset-1", basis: "kezelési jogviszony", ...p,
});

test("a teljes auditsor átmegy", () => {
  assert.deepEqual(checkAudit(audit({})), []);
});

test("„a rendszer” nem cselekvő", () => {
  const bad = checkAudit(audit({ actor: "  " }));
  assert.ok(bad.some((b) => /megnevezett személy vagy megnevezett folyamat/.test(b)));
});

test("jogalap nélkül az auditsor nem auditsor", () => {
  const bad = checkAudit(audit({ basis: "" }));
  assert.ok(bad.some((b) => /azt nem, hogy joga volt hozzá/.test(b)));
});

test("az ELUTASÍTOTT hozzáférés oka legalább annyira lelet, mint a hozzáférés", () => {
  assert.ok(checkAudit(audit({ action: "denied" })).some((b) => /indoklás nélkül/.test(b)));
  assert.deepEqual(
    checkAudit(audit({ action: "denied", denyReason: "nincs kezelési jogviszony" })), []);
});

/* ── 4. A NYELŐ ─────────────────────────────────────────────────────── */

test("a memórianyelő sehova nem ír, csak gyűjt", () => {
  const sink = memorySink();
  sink.op(op({ n: 1 }));
  sink.audit(audit({}));
  assert.equal(sink.events.length, 2);
  assert.equal(sink.events[0].kind, "op");
  assert.equal(sink.events[1].kind, "audit");
});
