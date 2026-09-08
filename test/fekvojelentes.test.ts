/**
 * FEKVŐBETEG-JELENTÉS — a rekordkép és a kódolási szabályok, mint kapu.
 *
 * A réteg egyetlen mondata, amit minden teszt más szögből néz:
 *
 *   MEGMONDJA, HOGY A JELENTÉS KITÖLTHETŐ-E. NEM MONDJA MEG, MENNYIT ÉR.
 *
 * A besorolási táblázat nincs gépi alakban, ezért csoportot a rendszer nem
 * állapít meg — de a visszapattanás okát előre megnevezi.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadCodeTables } from "../core/coding/tables.ts";
import {
  checkRecord, layoutBytes, loadDiagnosisTypes, loadLayout,
} from "../core/fekvo/record.ts";
import { checkDelivery, loadDeliveryRules } from "../core/fekvo/szules.ts";
import type { InpatientCase } from "../core/fekvo/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
loadCodeTables(join(HERE, "..", "registry", "kodok", "tablak"));
const FEKVO = join(HERE, "..", "registry", "kodok", "fekvo");
const LAYOUT = loadLayout(join(FEKVO, "rekordkep.json"));
const TYPES = loadDiagnosisTypes(join(FEKVO, "diagnozis-tipusok.json"));
const RULES = loadDeliveryRules(join(FEKVO, "szules-kodolas.json"));

/** Egy hibátlanul kódolt, szövődménymentes hüvelyi szülés. */
function normalDelivery(): InpatientCase {
  return {
    diagnoses: [
      { type: "1", code: "O8090" },
      { type: "3", code: "O8090" },
      { type: "V", code: "Z3700" },
    ],
    procedures: [{ code: "92600", on: "2026-06-10" }],
    referred: false, transferred: false,
    admittedOn: "2026-06-09", dischargedOn: "2026-06-12",
    sex: "female", age: 31,
  };
}
const rule = (fs: Array<{ rule: string }>, id: string) => fs.filter((f) => f.rule === id);

/* ── 1. A REKORDKÉP HELYESSÉGE SAJÁT MAGÁN MÉRHETŐ ──────────────────── */

test("a rekordkép mezőhosszainak összege PONTOSAN a rekord hossza", () => {
  // Ez az egyetlen olyan tulajdonság, ami a másolás helyességét bizonyítja:
  // egy elgépelt mezőhossz az egész ellenőrzést hibássá tenné.
  assert.equal(layoutBytes(LAYOUT), 746);
  assert.equal(layoutBytes(LAYOUT), LAYOUT.recordBytes);
});

test("a rekordkép DÖNTI EL a kódalakot, amit korábban feltételeztünk", () => {
  const bno = LAYOUT.mezok.find((m) => m.nev === "BETEGSEG")!
    .almezok!.find((a) => a.nev === "BNO_KOD")!;
  const proc = LAYOUT.mezok.find((m) => m.nev === "BEAVATKOZ")!
    .almezok!.find((a) => a.nev === "B_KOD")!;
  assert.equal(bno.hossz, 5);        // O1410, nem O141
  assert.equal(proc.hossz, 5);       // 57410, nem 74.10
});

/* ── 2. AMI BELEFÉR, ÉS AMI NEM ─────────────────────────────────────── */

test("a hiba nélkül kódolt szülés jelenthető", () => {
  const r = checkRecord(LAYOUT, TYPES, normalDelivery());
  assert.deepEqual(r.findings.filter((f) => f.level === "blocking"), []);
  assert.equal(r.canReport, true);
});

test("a rövidített BNO-alak elcsúsztatná a fix rekordot — ezért blokkol", () => {
  const c = normalDelivery();
  c.diagnoses[1] = { type: "3", code: "O809" };
  const r = checkRecord(LAYOUT, TYPES, c);
  assert.equal(r.canReport, false);
  assert.match(rule(r.findings, "rekord.bnoHossz")[0].message, /ötkarakteres/);
});

test("az ICD-9-CM alakú beavatkozáskód nem jelenthető", () => {
  const c = normalDelivery();
  c.procedures = [{ code: "74.10" }];
  const r = checkRecord(LAYOUT, TYPES, c);
  assert.equal(r.canReport, false);
  // A „74.10" ÉPPEN öt karakter: a hosszellenőrzés nem fogja meg. Az alak igen.
  assert.deepEqual(rule(r.findings, "rekord.beavatkozasHossz"), []);
  assert.match(rule(r.findings, "rekord.beavatkozasAlak")[0].message, /amerikai/);
});

test("16 diagnózisnál több nem fér a rekordba — és ez ELMARADT BEVÉTEL is", () => {
  const c = normalDelivery();
  for (let i = 0; i < 20; i++) c.diagnoses.push({ type: "5", code: "O9900" });
  const r = checkRecord(LAYOUT, TYPES, c);
  assert.equal(r.canReport, false);
  assert.match(rule(r.findings, "rekord.diagnozisTulsok")[0].message, /ELMARADT BEVÉTEL/);
});

/* ── 3. A TÍPUSJEL MEGSZÁMLÁLHATÓ KÖTELEZETTSÉG ─────────────────────── */

test("fődiagnózis nélkül nincs jelentés — és a rendszer nem találja ki", () => {
  const c = normalDelivery();
  c.diagnoses = c.diagnoses.filter((d) => d.type !== "3");
  const r = checkRecord(LAYOUT, TYPES, c);
  assert.equal(r.canReport, false);
  assert.match(rule(r.findings, "diag.hianyzik")[0].message, /NEM találja ki/);
});

test("két fődiagnózis is hiba: ebből a típusjelből egy lehet", () => {
  const c = normalDelivery();
  c.diagnoses.push({ type: "3", code: "O8000" });
  assert.ok(rule(checkRecord(LAYOUT, TYPES, c).findings, "diag.tulSok").length);
});

test("beutalóval érkezett betegnél a beutaló iránydiagnózis kötelező", () => {
  const c = normalDelivery();
  c.referred = true;
  assert.ok(rule(checkRecord(LAYOUT, TYPES, c).findings, "diag.beutaloHianyzik").length);
});

test("ha nem tudjuk, beutalóval jött-e, az NEM „rendben van”", () => {
  const c = normalDelivery();
  c.referred = null;
  const f = rule(checkRecord(LAYOUT, TYPES, c).findings, "diag.beutaloEldonthetetlen");
  assert.equal(f[0].level, "undetermined");
  assert.match(f[0].message, /NEM azt jelenti, hogy rendben van/);
  // eldönthetetlen ≠ blokkoló: a jelentés beadható, csak nem tudjuk, teljes-e
  assert.equal(checkRecord(LAYOUT, TYPES, c).canReport, true);
});

test("sérülés kódja mellé kötelező a külső ok", () => {
  const c = normalDelivery();
  c.diagnoses.push({ type: "5", code: "S0000" });
  assert.ok(rule(checkRecord(LAYOUT, TYPES, c).findings, "diag.kulsoOkHianyzik").length);
});

/* ── 4. A TÖRZS ELLENŐRZI, NEM MI ───────────────────────────────────── */

test("a nem létező kód a törzsből bukik ki, nem szabályból", () => {
  const c = normalDelivery();
  c.diagnoses[1] = { type: "3", code: "O8099" };
  assert.ok(rule(checkRecord(LAYOUT, TYPES, c).findings, "diag.ismeretlenKod").length);
});

test("a férfi betegre kódolt szülés elakad", () => {
  const c = normalDelivery();
  c.sex = "male";
  const r = checkRecord(LAYOUT, TYPES, c);
  assert.equal(r.canReport, false);
  assert.ok(r.findings.some((f) => f.rule === "diag.wrongSex"));
});

/* ── 5. A SZÜLÉS KÓDOLÁSA — 11. MELLÉKLET ───────────────────────────── */

test("a hibátlan szülés kódolása teljes", () => {
  const d = checkDelivery(RULES, normalDelivery());
  assert.equal(d.complete, true);
  assert.deepEqual(d.findings.filter((f) => f.level === "blocking"), []);
});

test("a szülés EREDMÉNYE külön kötelező tétel — és rendszerint ez hiányzik", () => {
  // A Z37-es kód nem klinikai állítás: az élve/halva születést és a
  // magzatszámot rögzíti, ezért a zárójelentésből hiányozhat.
  const c = normalDelivery();
  c.diagnoses = c.diagnoses.filter((d) => d.type !== "V");
  const d = checkDelivery(RULES, c);
  assert.equal(d.complete, false);
  assert.match(rule(d.findings, "szules.kimenetelHianyzik")[0].message,
    /ELSŐ ápoló osztályon/);
});

test("szülésvezetési beavatkozáskód nélkül a jelentés hiányos", () => {
  const c = normalDelivery();
  c.procedures = [];
  assert.ok(rule(checkDelivery(RULES, c).findings, "szules.beavatkozasHianyzik").length);
});

test("a diagnózis és a beavatkozás ellentmondását a rendszer NEM javítja ki", () => {
  // Császármetszés kódja hüvelyi szülés fődiagnózisával: az ellentmondás
  // maga a lelet — vagy a kódolás rossz, vagy a szülésleírás.
  const c = normalDelivery();
  c.procedures = [{ code: "57410" }];
  const f = rule(checkDelivery(RULES, c).findings, "szules.ellentmondas");
  assert.equal(f[0].level, "blocking");
  assert.match(f[0].message, /NEM javítja ki egyiket sem/);
});

test("császármetszés fődiagnózisa mellé császármetszés kódja kell", () => {
  const c = normalDelivery();
  c.diagnoses[1] = { type: "3", code: "O8210" };
  assert.ok(rule(checkDelivery(RULES, c).findings, "szules.ellentmondas").length);
  // ugyanez a helyes kódolással már rendben
  c.procedures = [{ code: "57410" }];
  c.diagnoses[0] = { type: "1", code: "O8210" };
  assert.equal(checkDelivery(RULES, c).complete, true);
});

test("a patológiás terhesség 12 napos feltétele eldönthetetlen, ha nincs adat", () => {
  const c = normalDelivery();
  c.diagnoses[0] = { type: "1", code: "O1410" };     // súlyos praeeclampsia
  const f = rule(checkDelivery(RULES, c).findings, "szules.patologiasEldonthetetlen");
  assert.equal(f[0].level, "undetermined");
  assert.match(f[0].message, /NEM azt jelenti, hogy nem patológiás/);
});

test("rövid szülés előtti bennfekvésnél a patológiás minősítés nem áll meg", () => {
  const c = normalDelivery();
  c.diagnoses[0] = { type: "1", code: "O1410" };
  c.preDeliveryDays = 3;
  const f = rule(checkDelivery(RULES, c).findings, "szules.patologiasRovid");
  assert.equal(f[0].level, "warning");
  assert.match(f[0].message, /nagy rizikójú szülés/);
});

/* ── 6. A RÉTEG HATÁRA — KIMONDVA ───────────────────────────────────── */

test("sem a rekordellenőrzés, sem a szülés-ellenőrzés NEM sorol be", () => {
  const r = checkRecord(LAYOUT, TYPES, normalDelivery());
  const d = checkDelivery(RULES, normalDelivery());
  assert.equal(r.assignsHbcs, false);
  assert.equal(d.assignsHbcs, false);
  assert.match(r.hbcsNote, /nincs gépi alakban/);
  assert.match(d.hbcsNote, /csoportot NEM állapít meg/);
  // a besorolás öt tényezőjét FELSOROLJA, de nem értékeli ki
  assert.equal(d.classifiers.length, 5);
  assert.ok(d.classifiers.includes("nagy rizikójú szülés"));
});
