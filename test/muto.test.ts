/**
 * A 11. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/11-muto.md`:
 *
 *   „A WHO checklist mindhárom fázisa kitöltetlen állapotban BLOKKOLJA a
 *    műtéti leírás lezárását, és az elvégzett beavatkozásból automatikusan
 *    képződik OENO-kódajánlás."
 *
 * Ez a rendszer EGYETLEN olyan kapuja, ami dokumentációs hiányra zár — és
 * szándékosan az. A `09` modul óta érvényes szabály, hogy a dokumentálás
 * soha nem blokkolhat sürgős ellátást; a WHO-lista azért kivétel, mert a
 * MŰTÉT ALATT kitölthető: ami blokkolódik, az nem az ellátás, hanem az
 * adminisztratív lezárás.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadProcedures, whoChecklist, WHO_PHASES } from "../core/op/registry.ts";
import { assessVte } from "../core/scores/vte.ts";
import { assessVbac } from "../core/scores/vbac.ts";
import { CALC_BY_ID } from "../core/calc/defs.ts";
import { recompute, resolve, setValue } from "../core/derive/engine.ts";
import { runCalc } from "../core/calc/run.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const PROC = loadProcedures(join(HERE, "..", "registry", "beavatkozasok"));

const NOW = "2026-09-02T14:00:00Z";
function op(): CaseState {
  return { ctx: { encounter: "elective.admission", now: NOW }, values: {}, errors: [] };
}
/** A WHO-lista egy fázisának kipipálása. */
function tick(st: CaseState, phase: string, skip: string[] = []): CaseState {
  let s = st;
  for (const d of REG.all()) {
    if (!d.id.startsWith(`op.who.${phase}.`) || d.datatype !== "bool") continue;
    if (skip.includes(d.id)) continue;
    s = setValue(REG, s, d.id, true);
  }
  return setValue(REG, s, `op.who.${phase}.completedAt`, NOW);
}
const tickAll = (st: CaseState) =>
  WHO_PHASES.reduce((s, p) => tick(s, p), st);

/* ── 1. Integritás ───────────────────────────────────────────────────── */

test("a beavatkozási törzs hiba nélkül validál", () => {
  assert.deepEqual(PROC.validate(REG).filter((i) => i.severity === "error"), []);
});

test("minden OENO-kódnak van verziója", () => {
  // A kódtábla évente változik: verzió nélkül egy retrospektív beavatkozás a
  // mai tábla szerint mást jelenthet.
  for (const p of PROC.all()) {
    if (!p.oeno) continue;
    assert.ok(p.oeno.version, `${p.id}: verzió nélküli OENO-kód`);
  }
});

/* ── 2. AZ ELFOGADÁSI KRITÉRIUM — a WHO-kapu ────────────────────────── */

test("kitöltetlen WHO-listával a műtéti leírás NEM zárható le", () => {
  const c = whoChecklist(REG, op());
  assert.equal(c.canClose, false);
  assert.match(c.reason, /nem zárható le/);
  assert.equal(c.phases.length, 3);
  assert.ok(c.phases.every((p) => p.missing.length > 0));
});

test("a kapu megnevezi, MELYIK fázisból hány tétel hiányzik", () => {
  const st = tick(tick(op(), "signIn"), "timeOut");
  const c = whoChecklist(REG, st);
  assert.equal(c.canClose, false);
  assert.match(c.reason, /Kijelentkezés/);
  assert.equal(c.phases.find((p) => p.phase === "signIn")!.missing.length, 0);
  assert.ok(c.phases.find((p) => p.phase === "signOut")!.missing.length > 0);
});

test("mindhárom fázis teljes → a leírás lezárható", () => {
  const c = whoChecklist(REG, tickAll(op()));
  assert.equal(c.canClose, true);
  assert.match(c.reason, /mindhárom fázisa teljes/);
});

test("EGYETLEN hiányzó tétel is blokkol — az eszköz- és törlőszám", () => {
  // Ez az a tétel, amiért az egész lista létezik.
  const st = tickAll(op());
  const nyitva = { ...st, values: { ...st.values } };
  delete nyitva.values["op.who.signOut.counts"];
  const c = whoChecklist(REG, nyitva);
  assert.equal(c.canClose, false);
  assert.deepEqual(
    c.phases.find((p) => p.phase === "signOut")!.missing,
    ["op.who.signOut.counts"],
  );
});

test("a kapu kimondja, hogy nem az ELLÁTÁST blokkolja", () => {
  const c = whoChecklist(REG, op());
  assert.match(c.reason, /MŰTÉT ALATT kitölthető/);
  assert.match(c.reason, /nem késlelteti/);
});

test("a fázis lezárásának időbélyege külön adat", () => {
  const st = tick(op(), "signIn");
  const c = whoChecklist(REG, st);
  assert.equal(c.phases.find((p) => p.phase === "signIn")!.completedAt, NOW,
    "enélkül nem tudni, a lista a megfelelő pillanatban készült-e, vagy utólag");
});

test("a lista tételei a REGISZTERBŐL jönnek, nem kódból", () => {
  // Egy új tétel felvétele a listához nem kíván fejlesztést.
  const c = whoChecklist(REG, op());
  const total = c.phases.reduce((n, p) => n + p.items.length, 0);
  const inRegistry = REG.all()
    .filter((d) => d.id.startsWith("op.who.") && d.datatype === "bool").length;
  assert.equal(total, inRegistry);
  assert.ok(total >= 15);
});

/* ── 3. AZ ELFOGADÁSI KRITÉRIUM — OENO-kódajánlás ───────────────────── */

test("az elvégzett beavatkozásból beavatkozáskód-ajánlás képződik", () => {
  const st = setValue(REG, op(), "op.procedure", "proc.cs.elective");
  const s = PROC.oenoFor(REG, st);
  assert.equal(s.length, 1);
  // A HIVATALOS fekvőbeteg-törzs kódja, nem az ICD-9-CM „74.10".
  assert.equal(s[0].code, "57410");
  assert.equal(s[0].system, "mut");
  assert.ok(s[0].version);
});

test("a kód a MEGNEVEZETT törzsben van, és csak abban", () => {
  const st = setValue(REG, op(), "op.procedure", "proc.hysteroscopy.diagnostic");
  const s = PROC.oenoFor(REG, st)[0];
  assert.equal(s.system, "oeno");           // járóbeteg-eljárás
  assert.equal(s.code, "16600");
});

test("ha a körülmény más, a kód is más — és ez OTT ÁLL a javaslat mellett", () => {
  const st = setValue(REG, op(), "op.procedure", "proc.cs.elective");
  const s = PROC.oenoFor(REG, st)[0];
  const corp = s.alternatives.find((a) => a.code === "57400")!;
  assert.match(corp.when, /testi, hosszanti/);
});

test("a méheltávolítás a császármetszés MELLÉ kerül, nem helyette", () => {
  const st = setValue(REG, op(), "op.procedure", "proc.cs.hysterectomy");
  const s = PROC.oenoFor(REG, st)[0];
  assert.equal(s.code, "57410");
  assert.equal(s.also[0].code, "56830");
  assert.match(s.also[0].why, /nem helyette/);
});

test("ahol a törzsben NINCS gyűjtőkód, a rendszer nem választ", () => {
  // A fogóműtét kódja a fej állásától és az episiotomiától függ; a törzs
  // gyűjtőkódot nem ismer. Egy „elég jó" kód itt néma alul- vagy
  // felülkódolás lenne.
  const st = setValue(REG, op(), "op.procedure", "proc.forceps");
  const s = PROC.oenoFor(REG, st)[0];
  assert.equal(s.code, null);
  assert.ok(s.candidates.length >= 4);
  assert.ok(s.candidates.some((c) => c.code === "57200"));
  assert.match(s.note, /NINCS gyűjtőkód/);
});

test("a kódajánlás kimondja, hogy JAVASLAT, nem kódolás", () => {
  const st = setValue(REG, op(), "op.procedure", "proc.hysterectomy.vaginal");
  assert.match(PROC.oenoFor(REG, st)[0].note, /a kódoló szakember dönt/);
});

test("beavatkozás nélkül nincs kódajánlás", () => {
  assert.deepEqual(PROC.oenoFor(REG, op()), []);
});

test("az „egyéb” beavatkozásnak SZÁNDÉKOSAN nincs kódja", () => {
  const st = setValue(REG, op(), "op.procedure", "proc.other");
  assert.deepEqual(PROC.oenoFor(REG, st), [],
    "az egyéb beavatkozás kódját a kódoló állapítja meg");
});

test("a császármetszés megnyitja a következő terhesség szempontjából döntő mezőket", () => {
  const cs = PROC.get("proc.cs.elective")!;
  assert.ok(cs.opens?.includes("op.cs.uterotomy"));
  assert.ok(cs.opens?.includes("op.cs.prevScar"));
  for (const o of cs.opens ?? []) assert.ok(REG.get(o), o);
});

/* ── 4. Az uterotomia: amit a következő terhességnél keresnek ───────── */

test("az uterotomia típusa kódolt mező, nem a leírás szövegében rejtőzik", () => {
  const d = REG.get("op.cs.uterotomy")!;
  assert.equal(d.datatype, "coded");
  const codes = (d.valueSet ?? []).map((o) => o.code);
  assert.ok(codes.includes("lowTransverse") && codes.includes("classical"));
  // A klasszikus és a T-metszés vörös zászló: utánuk a hüvelyi szülés ellenjavallt.
  const classical = d.valueSet!.find((o) => o.code === "classical")!;
  assert.ok(classical.flags?.includes("redflag"));
});

/* ── 5. VTE: a felsorolás, és MIÉRT nincs összeg ────────────────────── */

test("a VTE-tényezők felsorolása megnevezi a publikált súlyt", () => {
  let st = setValue(REG, op(), "hx.sys.vte", "pos");
  st = setValue(REG, st, "hx.sys.thrombophilia", "neg");
  const a = assessVte(REG, st);
  const prev = a.factors.find((f) => f.id === "prevVte")!;
  assert.equal(prev.present, true);
  assert.match(prev.publishedWeight, /4 pont/);
  assert.equal(a.present.length, 1);
});

test("a hiányzó adat NEM „nincs kockázat”", () => {
  const a = assessVte(REG, op());
  assert.ok(a.factors.every((f) => f.present === "unknown"));
  assert.match(a.noTotal, /nem „nincs kockázat”/);
});

test("a VTE-nél a szám hiánya NYITOTT FELADAT, nem lezárt döntés", () => {
  // Ez a különbség a postpartum pszichózis kockázatához képest, ahol a
  // kombinált szám ELVI okból nem születhet meg.
  const a = assessVte(REG, op());
  assert.match(a.noTotal, /NYITOTT FELADAT, nem lezárt döntés/);
  assert.match(a.noTotal, /a tábla hiányos/);
});

test("a kalkulátor-réteg CSAK SZÁMOT fogad — a kódolt bemenet build-hiba", () => {
  // Ez a szabály fogta meg, hogy a VTE- és a VBAC-pontszám kalkulátorként
  // ÖRÖKRE „hiányzó bemenet"-et mondott volna: a `pos`/`neg` kód a futtatóban
  // csendben NaN lesz, és ez a kapu mögötti állapottól
  // megkülönböztethetetlen. Mindkettő szabályalapú értékelés lett.
  for (const d of REG.all()) {
    if (d.derivation?.kind !== "computed") continue;
    const calc = CALC_BY_ID.get(d.derivation.calc);
    if (!calc) continue;
    for (const i of calc.inputs) {
      const input = REG.get(REG.resolvePrimary(i.id))!;
      if (input.datatype !== "coded" && input.datatype !== "tristate") continue;
      for (const o of input.valueSet ?? []) {
        assert.ok(Number.isFinite(Number(o.code)),
          `${calc.id} bemenete (${i.id}) nem numerikus kódot használ: ${o.code}`);
      }
    }
  }
});

test("a dohányzás KÓDOLT mező, nem háromállású — a felsorolás ezt tudja", () => {
  let st = setValue(REG, op(), "hx.life.smoking", "current");
  const a = assessVte(REG, st);
  assert.equal(a.factors.find((f) => f.id === "smoking")!.present, true);

  st = setValue(REG, op(), "hx.life.smoking", "never");
  assert.equal(assessVte(REG, st).factors.find((f) => f.id === "smoking")!.present, false);
});

/* ── 5b. VBAC: a tényezők iránya, százalék nélkül ───────────────────── */

test("a VBAC-értékelés megnevezi, melyik tényező melyik irányba mutat", () => {
  let st = setValue(REG, op(), "hx.repro.prevBirth.vaginal", 1);
  st = setValue(REG, st, "hx.repro.prevBirth.vbac", "neg");
  st = setValue(REG, st, "hx.repro.prevBirth.recurringIndication", "neg");
  const a = assessVbac(REG, st);
  assert.equal(a.factors.find((f) => f.id === "priorVaginal")!.present, true);
  assert.equal(a.factors.find((f) => f.id === "priorVaginal")!.direction, "javítja");
  assert.equal(a.factors.find((f) => f.id === "recurringIndication")!.direction, "rontja");
});

test("a klasszikus uterotomia után a hüvelyi szülés ELLENJAVALLT — nem esélykérdés", () => {
  const st = setValue(REG, op(), "op.cs.uterotomy", "classical");
  const a = assessVbac(REG, st);
  assert.equal(a.contraindicated.yes, true);
  assert.match(a.contraindicated.why!, /NEM esélykérdés/);
});

test("alsó harántmetszés után nincs ellenjavallat", () => {
  const st = setValue(REG, op(), "op.cs.uterotomy", "lowTransverse");
  assert.equal(assessVbac(REG, st).contraindicated.yes, false);
});

test("százalékos esély NEM készül, és a hiány meg van indokolva", () => {
  const a = assessVbac(REG, op());
  assert.ok(!("probability" in a));
  assert.match(a.noProbability, /rosszabb lenne, mint nem adni számot/);
  assert.match(a.noProbability, /etnikai tagot tartalmazó képlet visszaállítása nem opció/);
});

/* ── 6. A sürgősségi kategória ──────────────────────────────────────── */

test("a császármetszés sürgősségi kategóriája verziózott kódrendszerből jön", () => {
  const d = REG.get("op.pre.urgency")!;
  assert.ok(d.codeSystem?.version, "a kategóriarendszer verziózott");
  assert.equal((d.valueSet ?? []).length, 4);
});

test("a sürgősségi kategória és a beavatkozás kódja KÜLÖN adat", () => {
  // Az OENO nem különbözteti meg a sürgősséget: a tervezett és a sürgős
  // császármetszés kódja azonos.
  assert.equal(PROC.get("proc.cs.elective")!.oeno!.code,
               PROC.get("proc.cs.emergency")!.oeno!.code);
  assert.match(PROC.get("proc.cs.emergency")!.documentation!.pitfalls!.hu!,
    /a minőségi mutatók onnan számolnak — nem a kódból/);
});

/* ── 7. Idők ────────────────────────────────────────────────────────── */

test("a bemetszés, a kiemelés és a zárás külön időbélyeg", () => {
  let st = setValue(REG, op(), "op.intra.incisionAt", "2026-09-02T14:10:00Z");
  st = setValue(REG, st, "op.intra.deliveryAt", "2026-09-02T14:13:00Z");
  st = setValue(REG, st, "op.intra.closureAt", "2026-09-02T14:48:00Z");
  for (const id of ["op.intra.incisionAt", "op.intra.deliveryAt", "op.intra.closureAt"]) {
    assert.equal(resolve(REG, st, id).state, "ok");
  }
});
