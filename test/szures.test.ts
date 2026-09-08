/**
 * A szűrési esedékesség tesztjei.
 *
 * Ez az a réteg, ami a dokumentációs rendszert GONDOZÁSI rendszerré teszi: nem
 * csak rögzíti, mi történt, hanem megmondja, mi esedékes. A hat állapot közül
 * a hatodik a legfontosabb — az `unknown`. Ha a hiányzó anamnézis csendben
 * „nem vonatkozik rá"-vá válna, a szűrés kimaradna, és soha senki nem tudná meg.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadScreenings, ScreeningSet } from "../core/screening/registry.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const SCR = loadScreenings(join(HERE, "..", "registry", "szuresek"));

const NOW = "2026-09-01T12:00:00Z";
function blank(): CaseState {
  return { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
}
function pregnantAt(weeks: number): CaseState {
  const lmpMs = Date.parse(NOW) - Math.round(weeks * 7) * 86_400_000;
  let st = setValue(REG, blank(), "ctx.pregnant", "pos");
  st = setValue(REG, st, "ctx.lmp", new Date(lmpMs).toISOString().slice(0, 10));
  return recompute(REG, st);
}
const at = (st: CaseState, id: string) => SCR.evaluate(REG, st, id).status;

/* ── 1. Az ablak ─────────────────────────────────────────────────────── */

test("az OGTT a 24. hét előtt még nem, az ablakban igen, utána elmulasztott", () => {
  assert.equal(at(pregnantAt(20), "scr.gdm.ogtt.standard"), "upcoming");
  assert.equal(at(pregnantAt(26), "scr.gdm.ogtt.standard"), "due");
  assert.equal(at(pregnantAt(32), "scr.gdm.ogtt.standard"), "overdue");
});

test("az elmulasztott ablak nem tűnik el — a kombinált szűrés vissza nem hozható", () => {
  const s = SCR.evaluate(REG, pregnantAt(20), "scr.aneuploidy.combined");
  assert.equal(s.status, "overdue");
  assert.match(s.why, /lezárult/);
});

/* ── 2. Feltétel: kire vonatkozik ────────────────────────────────────── */

test("nem terhesre a terhesgondozási szűrés nem vonatkozik", () => {
  const st = setValue(REG, blank(), "ctx.pregnant", "neg");
  assert.equal(at(st, "scr.gdm.ogtt.standard"), "notApplicable");
});

test("a korai OGTT csak korábbi terhességi cukorbetegség után esedékes", () => {
  let st = pregnantAt(17);
  st = setValue(REG, st, "hx.repro.gdm", "neg");
  assert.equal(at(st, "scr.gdm.ogtt.early"), "notApplicable");

  let st2 = setValue(REG, pregnantAt(17), "hx.repro.gdm", "pos");
  assert.equal(at(st2, "scr.gdm.ogtt.early"), "due");
});

/* ── 3. A hiányzó adat NEM „nem vonatkozik rá" ───────────────────────── */

test("hiányzó anamnézisnél az állapot `unknown`, és megmondja, mi hiányzik", () => {
  const s = SCR.evaluate(REG, pregnantAt(17), "scr.gdm.ogtt.early");
  assert.equal(s.status, "unknown");
  assert.deepEqual(s.missing, ["hx.repro.gdm"]);
  assert.match(s.why, /NEM azt jelenti/);
});

test("a rögzített „nem tudom” nem zárja ki a szűrést — a szabály dönt", () => {
  // KORÁBBAN ez `notApplicable` volt, formai érvvel: az `eq pos` feltétel az
  // `unk` értékre sem teljesül. Az érv formailag igaz, klinikailag rossz: aki
  // nem emlékszik, volt-e terhességi cukorbetegsége, épp AZÉRT tartozik a
  // korai OGTT elé, mert nem tudjuk — nem azért marad ki, mert nem tudjuk.
  //
  // Az olvasat mostantól a SZABÁLY adata (`unknownAnswer`), nem a kódé, és az
  // alapértelmezés fail-safe: a rendszer nem állítja egy szűrésről, hogy nem
  // érint valakit, olyan válasz alapján, ami épp a tudás hiányát mondja ki.
  const st = setValue(REG, pregnantAt(17), "hx.repro.gdm", "unk");
  const s = SCR.evaluate(REG, st, "scr.gdm.ogtt.early");
  assert.equal(s.status, "unknown");
  // MEGKÉRDEZTÜK — tehát nem `missing`. A kettő teendője más: a hiányzót
  // kérdezni kell, a „nem tudom”-ot nem érdemes újra.
  assert.deepEqual(s.nemTudja, ["hx.repro.gdm"]);
  assert.equal(s.missing, undefined);
  assert.match(s.why, /nem „nem”/);
});

test("a szabály KIMONDHATJA, hogy a „nem tudom” nála nem vonatkozik rá", () => {
  // A fail-safe alapértelmezés felülírható — de csak kimondva, szabályonként.
  const rule = SCR.get("scr.gdm.ogtt.early")!;
  const sajat = new ScreeningSet([{ ...rule, unknownAnswer: "notApplicable" }]);
  const st = setValue(REG, pregnantAt(17), "hx.repro.gdm", "unk");
  assert.equal(sajat.evaluate(REG, st, "scr.gdm.ogtt.early").status, "notApplicable");
});

test("ismeretlen gesztációs kornál nem találgatunk esedékességet", () => {
  const st = setValue(REG, blank(), "ctx.pregnant", "pos");   // LMP nincs
  const s = SCR.evaluate(REG, st, "scr.gbs");
  assert.equal(s.status, "unknown");
  assert.deepEqual(s.missing, ["ctx.ga"]);
});

/* ── 4. Elvégzettség: a részleges vizsgálat nem elvégzett ────────────── */

test("a háromértékes OGTT nem elvégzett, ha csak az éhomi érték van meg", () => {
  let st = setValue(REG, pregnantAt(26), "lab.ogtt.0", 4.6);
  assert.equal(at(st, "scr.gdm.ogtt.standard"), "due",
    "a hiányos vizsgálat továbbra is esedékes");

  st = setValue(REG, st, "lab.ogtt.60", 8.1);
  st = setValue(REG, st, "lab.ogtt.120", 6.9);
  assert.equal(at(st, "scr.gdm.ogtt.standard"), "done");
});

test("egyetlen mezős szűrés a mező rögzítésével elvégzett", () => {
  const st = setValue(REG, pregnantAt(36), "lab.gbs", "neg");
  assert.equal(at(st, "scr.gbs"), "done");
});

/* ── 5. Ismétlődő szűrés ─────────────────────────────────────────────── */

test("a friss méhnyakszűrés elvégzett, a réginél újra esedékes", () => {
  let st = setValue(REG, blank(), "patient.birthDate", "1990-05-10");
  st = recompute(REG, st);

  const fresh = setValue(REG, st, "status.gyn.cytology", "nilm",
    { t: "2025-06-01T09:00:00Z" });
  assert.equal(at(fresh, "scr.cervical.cytology"), "done");

  const old = setValue(REG, st, "status.gyn.cytology", "nilm",
    { t: "2018-06-01T09:00:00Z" });
  assert.equal(at(old, "scr.cervical.cytology"), "due");
});

test("életkor alatt a méhnyakszűrés nem vonatkozik rá", () => {
  let st = setValue(REG, blank(), "patient.birthDate", "2010-05-10");
  st = recompute(REG, st);
  assert.equal(at(st, "scr.cervical.cytology"), "notApplicable");
});

/* ── 6. A teendőlista sorrendje ──────────────────────────────────────── */

test("a lista az elmulasztottat teszi előre, a nem vonatkozót hátra", () => {
  const list = SCR.dueList(REG, pregnantAt(26));
  const order = ["overdue", "due", "unknown", "upcoming", "done", "notApplicable"];
  const idx = list.map((s) => order.indexOf(s.status));
  assert.deepEqual(idx, [...idx].sort((a, b) => a - b), "az állapotok sorrendben állnak");
  assert.ok(list.every((s) => s.source.cite), "minden sor megnevezi a forrását");
});

/* ── 7. Integritás ───────────────────────────────────────────────────── */

test("minden szűrési szabály létező mezőkre és változókra hivatkozik", () => {
  assert.deepEqual(SCR.validate(REG).filter((i) => i.severity === "error"), []);
});

/* ── 6. A KILÉPÉS — mert az ÉLETKOR ÖNMAGÁBAN NEM KILÉPÉSI FELTÉTEL ──── */

/** Beteg megadott életkorral, nem terhes. */
function korban(ev: number): CaseState {
  const szul = new Date(Date.parse(NOW) - Math.round(ev * 365.25) * 86_400_000);
  let st = setValue(REG, blank(), "patient.birthDate", szul.toISOString().slice(0, 10));
  return recompute(REG, st);
}
const KL = "clinician" as const;

test("a méhnyakszűrés az ablakban esedékes", () => {
  assert.equal(at(korban(40), "scr.cervical.cytology"), "due");
  // 25 alatt az `appliesWhen` miatt nem vonatkozik rá — nem „még nem esedékes”.
  assert.equal(at(korban(20), "scr.cervical.cytology"), "notApplicable");
});

test("65 FÖLÖTT ELŐZMÉNY NÉLKÜL a szűrés NEM zárható le", () => {
  const s = SCR.evaluate(REG, korban(70), "scr.cervical.cytology");
  assert.equal(s.status, "exitUnknown");
  assert.match(s.why, /A HIÁNYZÓ ELŐZMÉNY NEM MEGFELELŐ ELŐZMÉNY/);
  assert.deepEqual(s.missing,
    ["hx.gyn.cervix.adequateScreening", "hx.gyn.cervix.cin2plus"]);
});

test("DOKUMENTÁLT megfelelő előzménnyel lezárható", () => {
  let st = korban(70);
  st = setValue(REG, st, "hx.gyn.cervix.adequateScreening", "pos", { provenance: KL });
  st = setValue(REG, st, "hx.gyn.cervix.cin2plus", "neg", { provenance: KL });
  const s = SCR.evaluate(REG, st, "scr.cervical.cytology");
  assert.equal(s.status, "exited");
  assert.match(s.why, /LEZÁRHATÓ/);
});

test("CIN2+ UTÁN a szűrés az életkori határon TÚL is esedékes", () => {
  let st = korban(70);
  st = setValue(REG, st, "hx.gyn.cervix.adequateScreening", "pos", { provenance: KL });
  st = setValue(REG, st, "hx.gyn.cervix.cin2plus", "pos", { provenance: KL });
  const s = SCR.evaluate(REG, st, "scr.cervical.cytology");
  assert.equal(s.status, "overdue");
  assert.match(s.why, /TOVÁBB\s+esedékes/);
});

test("A BETEG EMLÉKEZETE nem dokumentált előzmény", () => {
  let st = korban(70);
  st = setValue(REG, st, "hx.gyn.cervix.adequateScreening", "pos", { provenance: "patient" });
  st = setValue(REG, st, "hx.gyn.cervix.cin2plus", "neg", { provenance: "patient" });
  const s = SCR.evaluate(REG, st, "scr.cervical.cytology");
  assert.equal(s.status, "exitUnknown", "formailag teljesül, de nincs mögötte lelet");
  assert.match(s.why, /CSAK A BETEG EMLÉKEZETÉBŐL/);
});

test("a „nem tudom” válasz sem zárja le a szűrést", () => {
  let st = korban(70);
  st = setValue(REG, st, "hx.gyn.cervix.adequateScreening", "unk", { provenance: KL });
  st = setValue(REG, st, "hx.gyn.cervix.cin2plus", "neg", { provenance: KL });
  const s = SCR.evaluate(REG, st, "scr.cervical.cytology");
  assert.equal(s.status, "exitUnknown");
  assert.deepEqual(s.nemTudja, ["hx.gyn.cervix.adequateScreening"]);
});

test("A LEZÁRT ÉS A LEZÁRATLAN SZŰRÉS SORRENDJE KÜLÖNBÖZIK", () => {
  // Ez a hiba lényege: ha a kettő ugyanoda kerülne a listán, a jelzést
  // mindenki megtanulná lenyomni — a megfelelően szűrtekkel EGYÜTT a soha
  // nem szűrteket is.
  let lezart = korban(70);
  lezart = setValue(REG, lezart, "hx.gyn.cervix.adequateScreening", "pos", { provenance: KL });
  lezart = setValue(REG, lezart, "hx.gyn.cervix.cin2plus", "neg", { provenance: KL });
  const a = SCR.dueList(REG, lezart).findIndex((s) => s.id === "scr.cervical.cytology");
  const b = SCR.dueList(REG, korban(70)).findIndex((s) => s.id === "scr.cervical.cytology");
  assert.ok(b < a, "az eldöntetlen ELŐBBRE kerül a lezártnál");
});

test("ÉLETKORI ABLAK KILÉPÉSI FELTÉTEL NÉLKÜL: hiba", () => {
  const rules = JSON.parse(JSON.stringify(SCR.all()));
  const cerv = rules.find((r: { id: string }) => r.id === "scr.cervical.cytology");
  delete cerv.exit;
  const h = new ScreeningSet(rules).validate(REG).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /AZ ÉLETKOR ÖNMAGÁBAN NEM KILÉPÉSI FELTÉTEL/);
});

test("az ÜRES kilépési feltétel ugyanaz, mintha nem lenne", () => {
  const rules = JSON.parse(JSON.stringify(SCR.all()));
  rules.find((r: { id: string }) => r.id === "scr.cervical.cytology").exit.requires = [];
  const h = new ScreeningSet(rules).validate(REG).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /üres kilépési feltétel/);
});
