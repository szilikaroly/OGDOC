/**
 * A 10. modul ELFOGADÁSI KRITÉRIUMA, tesztként.
 *
 * `docs/modulok/10-szuloszoba.md`:
 *
 *   „A vajúdás-idősor TÚLÉLI az oldalbetöltést (ez az IPRACS legfőbb hibája).
 *    A Bishop egyetlen helyen szerkeszthető. A fullPIERS hiányzó AST mellett
 *    `insufficient`-et ad. Minden score-hoz van referencia-fixture."
 *
 * És a nyitott kérdés, amit a modul kifejezetten NEM automatizál:
 *
 *   „A CTG-variabilitás, az accelerációk és a sinusoidalis mintázat klinikusi
 *    megítélést igényelnek… Ez így helyes, és nem szabad automatizálni."
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, resolve, setValue } from "../core/derive/engine.ts";
import { runCalc } from "../core/calc/run.ts";
import { nichd } from "../core/scores/nichd.ts";
import { cori } from "../core/scores/cori.ts";
import { fullPiers } from "../core/scores/fullpiers.ts";
import { assessVbac } from "../core/scores/vbac.ts";
import { CALC_BY_ID } from "../core/calc/defs.ts";
import { recommendations } from "../core/ui/output.ts";
import { MemoryStore, serialize, deserialize, valueCount } from "../core/store.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));

const NOW = "2026-09-02T12:00:00Z";
function labour(): CaseState {
  return { ctx: { encounter: "labour", now: NOW }, values: {}, errors: [] };
}
function vitals(st: CaseState, o: Partial<Record<string, number>> = {}): CaseState {
  let s = st;
  s = setValue(REG, s, "vitals.bp.systolic", o.sys ?? 118);
  s = setValue(REG, s, "vitals.bp.diastolic", o.dia ?? 74);
  s = setValue(REG, s, "vitals.pulse", o.pulse ?? 84);
  s = setValue(REG, s, "vitals.rr", o.rr ?? 16);
  s = setValue(REG, s, "vitals.temp", o.temp ?? 36.8);
  s = setValue(REG, s, "vitals.spo2", o.spo2 ?? 98);
  return recompute(REG, s);
}

/* ── 1. AZ IDŐSOR TÚLÉLI AZ OLDALBETÖLTÉST ──────────────────────────── */

test("a vajúdás-idősor mentés és betöltés után hiánytalan", async () => {
  let st = labour();
  st = setValue(REG, st, "labour.startedAt", "2026-09-02T04:00:00Z");
  // Négy órányi óránkénti rögzítés — ez az, ami az IPRACS-ban elveszett.
  for (let h = 0; h < 4; h++) {
    const t = new Date(Date.parse("2026-09-02T08:00:00Z") + h * 3_600_000).toISOString();
    st = setValue(REG, st, "exam.cervix.dilation", 4 + h, { t });
    st = setValue(REG, st, "labour.qbl", 50 * h, { t });
    st = setValue(REG, st, "status.obs.fhr", 140 + h, { t });
  }
  const before = valueCount(st);

  const store = new MemoryStore();
  await store.save("eset-1", st);
  const back = await store.load("eset-1");

  assert.ok(back);
  assert.equal(valueCount(back!), before, "egyetlen érték sem veszett el");
  assert.equal(back!.values["exam.cervix.dilation"].length, 4, "mind a négy mérés megvan");
  assert.deepEqual(
    back!.values["exam.cervix.dilation"].map((v) => v.value), [4, 5, 6, 7],
    "és a SORRENDJÜK is — az append-only napló sorrendje jelentést hordoz",
  );
});

test("ismeretlen mentési formátumnál nem találgatunk", () => {
  assert.throws(() => deserialize('{"formatVersion":99,"state":{}}'),
    /Ismeretlen mentési formátum/);
  assert.throws(() => deserialize('{"formatVersion":1,"state":{}}'), /Hiányos mentés/);
});

test("a mentés a feloldás precedenciáját is túléli", () => {
  // Azonos időpontra tett javítás: a KÉSŐBB bekerült nyer. Ha a sorosítás
  // átrendezné a naplót, a javítás visszafordulna.
  let st = labour();
  st = setValue(REG, st, "labour.qbl", 300, { t: NOW });
  st = setValue(REG, st, "labour.qbl", 800, { t: NOW });
  const back = deserialize(serialize(st));
  assert.equal(resolve(REG, back, "labour.qbl").value, 800);
});

/* ── 2. A BISHOP EGYETLEN HELYEN SZERKESZTHETŐ ──────────────────────── */

test("a méhszáj-tágulat a szülőszobán és a státuszban UGYANAZ az adat", () => {
  // Az IPRACS ismert hibája: a Bishop egyszerre három helyen szerepelt.
  assert.equal(REG.resolvePrimary("labour.cervix"), "exam.cervix.dilation");
  assert.equal(REG.resolvePrimary("score.bishop.dilation"), "exam.cervix.dilation");

  let st = setValue(REG, labour(), "labour.cervix", 6);
  assert.equal(resolve(REG, st, "exam.cervix.dilation").value, 6,
    "a szülőszobán írt érték a státuszban is látszik");
  assert.equal(resolve(REG, st, "score.bishop.dilation").value, 6);
});

test("minden szülőszobai tükör létező primer változóra mutat", () => {
  for (const d of REG.all()) {
    if (d.module !== "labour" || !d.aliasOf) continue;
    assert.ok(REG.get(d.aliasOf), `${d.id} → ${d.aliasOf}`);
    assert.ok(!REG.get(d.aliasOf)!.aliasOf, `${d.id}: tükör tükörre mutat`);
  }
});

/* ── 3. A fullPIERS hiányzó AST mellett insufficient ────────────────── */

test("a fullPIERS hiányzó AST mellett nem számol", () => {
  let st = vitals(labour());
  st = setValue(REG, st, "ctx.pregnant", "pos");
  st = setValue(REG, st, "ctx.lmp", "2026-01-20");
  st = setValue(REG, st, "sym.chestPainDyspnea", true);
  st = setValue(REG, st, "lab.plt", 90);
  st = setValue(REG, st, "lab.cr", 88);
  st = recompute(REG, st);
  const r = fullPiers(REG, st);
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("lab.ast"));
});

/* ── 4. REFERENCIA-FIXTURE minden score-hoz ─────────────────────────── */

test("MEOWS: a kiváltó paramétereket számolja, nem súlyoz", () => {
  const nyugodt = runCalc(REG, vitals(labour()), "calc.meows");
  assert.equal(nyugodt.status === "ok" && nyugodt.value, 0);

  // Vérző beteg: alacsony vérnyomás + tachycardia = két kiváltó.
  const kritikus = runCalc(REG, vitals(labour(), { sys: 84, pulse: 132 }), "calc.meows");
  assert.equal(kritikus.status === "ok" && kritikus.value, 2);
  assert.equal(kritikus.status === "ok" && kritikus.band?.severity, "redflag");
});

test("omqSOFA: két kritérium felett szepszisgyanú", () => {
  const r = runCalc(REG, vitals(labour(), { pulse: 112, rr: 26, temp: 38.6 }), "calc.omqsofa");
  assert.equal(r.status === "ok" && r.value, 3);
  assert.equal(r.status === "ok" && r.band?.severity, "redflag");
});

test("a sokk-index a vérzés korai jelzője, a vérnyomás előtt", () => {
  // 128/95 = 1,35 — a vérnyomás még „csak" 95 systolés.
  const st = vitals(labour(), { sys: 95, pulse: 128 });
  const si = resolve(REG, st, "vitals.shockIndex");
  assert.ok(Number(si.value) > 1.3);
});

test("a CMQCC KAPU mögött van — és megmondja, miért", () => {
  let st = vitals(labour(), { sys: 95, pulse: 128 });
  st = recompute(REG, setValue(REG, st, "labour.qbl", 1200));
  const r = runCalc(REG, st, "calc.cmqcc.stage");
  assert.equal(r.status, "insufficient");
  // A bemenete a TELJES vérvesztés, ami maga is levezetett és kapu mögött van.
  // Az üzenet ezért megkülönbözteti a mérés- és az aláíráshiányt: a kettő
  // teendője ellentétes.
  const reason = r.status === "insufficient" ? r.reason : "";
  assert.match(reason, /NEM MÉRÉSHIÁNY/);
  assert.match(reason, /A teendő nem mérés, hanem ALÁÍRÁS/);
  assert.match(reason, /calc\.qbl\.total/);
});

test("A CMQCC A TELJES VÉRVESZTÉST NÉZI, nem csak a szülés alattit", () => {
  const cmqcc = CALC_BY_ID.get("calc.cmqcc.stage")!;
  assert.ok(cmqcc.inputs.some((i) => i.id === "labour.qbl.total"),
    "a stádium bemenete az összeg");
  assert.ok(!cmqcc.inputs.some((i) => i.id === "labour.qbl"),
    "a szülés alatti érték önmagában már nem vezérli a stádiumot");

  // 400 mL vajúdás + 700 mL műtét: külön egyik sem éri el a maga küszöbét,
  // az összeg viszont 1100 — a 2. stádium határa.
  const total = CALC_BY_ID.get("calc.qbl.total")!;
  assert.equal(total.fn(400, 700), 1100);
  assert.equal(total.fn(400, NaN), 400, "műtét nélkül a szülészeti érték áll");
  assert.equal(total.fn(NaN, NaN), null, "semmiből nem lesz nulla");
});

test("a VBAC NEM kalkulátor: kódolt bemenetekkel az soha nem tudott volna számolni", () => {
  // A korábbi sikeres VBAC és az ismétlődő javallat háromállású mezők; a
  // kalkulátor-réteg csak számot fogad. Az értékelés ezért szabályalapú lett.
  assert.equal(CALC_BY_ID.has("calc.vbac.grobman"), false);
  const a = assessVbac(REG, labour());
  assert.match(a.noProbability, /együtthatói nincsenek meg/);
});

/* ── 5. NICHD — amit NEM automatizálunk ─────────────────────────────── */

function ctg(o: { baseline?: number; variability?: string; decel?: string; accel?: boolean }) {
  let st = setValue(REG, labour(), "labour.fhr.method", "continuous");
  if (o.baseline != null) st = setValue(REG, st, "status.obs.fhr", o.baseline);
  if (o.variability) st = setValue(REG, st, "labour.fhr.variability", o.variability);
  if (o.decel) st = setValue(REG, st, "labour.fhr.decel", o.decel);
  if (o.accel != null) st = setValue(REG, st, "labour.fhr.accel", o.accel);
  return st;
}

test("I. kategória: normális alapvonal, mérsékelt variabilitás, nincs rossz deceleráció", () => {
  const r = nichd(REG, ctg({ baseline: 140, variability: "moderate", decel: "none" }));
  assert.equal(r.status === "ok" && r.category, 1);
  assert.equal(r.status === "ok" && r.severity, "normal");
  assert.match((r as { action: string }).action, /kizárja az aktuális magzati acidózist/);
});

test("III. kategória: sinusoidalis mintázat önmagában elég", () => {
  const r = nichd(REG, ctg({ baseline: 140, variability: "sinusoidal", decel: "none" }));
  assert.equal(r.status === "ok" && r.category, 3);
});

test("III. kategória: HIÁNYZÓ variabilitás + ismétlődő késői deceleráció", () => {
  const r = nichd(REG, ctg({ baseline: 145, variability: "absent", decel: "recurrentLate" }));
  assert.equal(r.status === "ok" && r.category, 3);
  assert.match((r as { action: string }).action, /AZONNALI/);
});

test("minimális variabilitás ismétlődő decelerációval még II. kategória", () => {
  // A III. kategória HIÁNYZÓ variabilitást kíván, nem minimálisat — ez a
  // különbség a besorolás egyik leggyakoribb félreértése.
  const r = nichd(REG, ctg({ baseline: 150, variability: "minimal", decel: "recurrentLate" }));
  assert.equal(r.status === "ok" && r.category, 2);
});

test("a besorolás megindokolja magát, nem csak eredményt ad", () => {
  const r = nichd(REG, ctg({ baseline: 175, variability: "moderate", decel: "variable" }));
  assert.equal(r.status === "ok" && r.category, 2);
  assert.ok((r as { why: string[] }).why.length >= 2);
});

test("IDŐSZAKOS hallgatózásból nincs NICHD-besorolás — és ez nem hiányosság", () => {
  const st = setValue(REG, labour(), "labour.fhr.method", "intermittent");
  const r = nichd(REG, st);
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /nem hiányosság/);
});

test("a variabilitás KLINIKUSI MEGÍTÉLÉS — nélküle nincs besorolás", () => {
  const r = nichd(REG, ctg({ baseline: 140, decel: "none" }));
  assert.equal(r.status, "insufficient");
  assert.ok(r.status === "insufficient" && r.missing.includes("labour.fhr.variability"));
  assert.match(r.status === "insufficient" ? r.reason : "", /KLINIKUSI MEGÍTÉLÉS/);
});

/* ── 6. CORI — a szám, ami nem valószínűség ─────────────────────────── */

test("üres esetből NINCS CORI — a 0-s szint „nincs adat”, nem „rendben”", () => {
  const r = cori(REG, labour());
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /NEM 0 és NEM zöld/);
});

test("a CORI a legrosszabb MÉRT domén szintjét veszi", () => {
  let st = vitals(labour(), { pulse: 112, rr: 26, temp: 38.6 });   // omqSOFA 3 → 4. szint
  const r = cori(REG, st);
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.equal(r.overall, 4);
  assert.match(r.action, /Protokoll szerinti beavatkozás/);
});

test("a NEM MÉRT domének száma az eredmény MELLETT jelenik meg", () => {
  const st = vitals(labour());
  const r = cori(REG, st);
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.ok(r.unmeasured > 0);
  assert.match(r.caveat, /nem „rendben van”, hanem ismeretlen/);
});

test("a CORI kimondja magáról, hogy nem validált score", () => {
  const r = cori(REG, vitals(labour()));
  assert.match((r as { caveat: string }).caveat, /nem publikált, validált score/);
  assert.match((r as { caveat: string }).caveat, /eszkalációs szabály/);
});

test("minden domén megnevezi, mi hiányzik — vagy mi a kapu", () => {
  const r = cori(REG, vitals(labour()));
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  for (const d of r.domains) {
    if (d.level == null) {
      assert.ok(d.why.length > 10, `${d.id}: nincs indoklás`);
    }
  }
  // A hipertenzív domén a KAPU miatt hiányzik, nem adathiány miatt.
  const htn = r.domains.find((d) => d.id === "hypertensive")!;
  assert.equal(htn.level, null);
});

/* ── 7. A partogram-vonal, és amit feltételez ───────────────────────── */

test("a figyelmeztető vonal csak az AKTÍV szakban értelmes", () => {
  let st = setValue(REG, labour(), "labour.startedAt", "2026-09-02T02:00:00Z");
  st = recompute(REG, setValue(REG, st, "exam.cervix.dilation", 3));
  const r = cori(REG, st);
  const p = (r as { domains: Array<{ id: string; why: string }> })
    .domains.find((d) => d.id === "labourProgress")!;
  assert.match(p.why, /látens szak/);
});

test("a vonalon túl lévő vajúdás megnevezi, milyen ütemhez képest", () => {
  // 10 órája tart, 6 cm — a klasszikus 1 cm/óra szerint 14 cm-nél kellene tartani.
  let st = setValue(REG, labour(), "labour.startedAt", "2026-09-02T02:00:00Z");
  st = recompute(REG, setValue(REG, st, "exam.cervix.dilation", 6));
  const r = cori(REG, st);
  const p = (r as { domains: Array<{ id: string; why: string; level: number | null }> })
    .domains.find((d) => d.id === "labourProgress")!;
  assert.equal(p.level, 4);
  assert.match(p.why, /klasszikus 1 cm\/óra ütemhez képest/,
    "a vonal FELTÉTELEZ egy ütemet, és ezt ki kell mondani");
});

/* ══ A MAGZATVÍZ-MEZŐ ÖSSZEFÉSÜLÉSE ═══════════════════════════════════
 *
 * A `demo/szuleszet.ts` írása közben derült ki, hogy UGYANARRA A LELETRE két
 * primer változó állt: `labour.amniotic` (szülőszobai lap) és
 * `status.obs.amnioticFluid` (felvételi státusz). A címkéjük nem volt betűre
 * azonos („Magzatvíz" / „Magzatvíz jellege"), ezért a mezőegyeztető nem
 * jelezte — a KÖVETKEZMÉNYE viszont klinikai volt: a szülőszobán rögzített
 * sűrű meconium NEM váltotta ki az újszülött-ellátási készenlétet, mert a
 * javaslat a MÁSIK mezőn ült.
 *
 * A tükör ezt zárja rövidre. Ez a teszt azt őrzi, hogy vissza ne váljon szét.
 */
test("a szülőszobai magzatvíz-mező TÜKÖR, nem második definíció", () => {
  const d = REG.get("labour.amniotic")!;
  assert.equal(d.aliasOf, "status.obs.amnioticFluid");
  assert.equal(REG.resolvePrimary("labour.amniotic"), "status.obs.amnioticFluid");
  // a tükörnek NINCS saját kódlistája — a primeré érvényes rá
  assert.ok(!d.valueSet?.length, "a tükör kódlistája két igazság lenne");
});

test("a szülőszobán rögzített sűrű meconium kiváltja a készenléti javaslatot", () => {
  let s = labour();
  s = setValue(REG, s, "labour.amniotic", "meconiumThick", { provenance: "clinician" });
  s = recompute(REG, s);
  const recs = recommendations(REG, s, "hu");
  assert.ok(
    recs.some((r) => r.from === "status.obs.amnioticFluid" && r.urgency === "urgent"),
    "a tükrön át rögzített érték ugyanazt a javaslatot adja, mint a primeren",
  );
});

test("az ép burok a szülőszobán is válasz — a kód a primeren van", () => {
  const prim = REG.get("status.obs.amnioticFluid")!;
  assert.ok(prim.valueSet!.some((v) => v.code === "intact"),
    "a szülőszobai „Burok ép” nem veszhetett el az összefésüléskor");
  // és tükrön keresztül írható is
  let s = setValue(REG, labour(), "labour.amniotic", "intact", { provenance: "clinician" });
  s = recompute(REG, s);
  assert.equal(resolve(REG, s, "status.obs.amnioticFluid").value, "intact");
});
