/**
 * SZÜLÉSZET ÉS SZÜLŐSZOBA — futtatható minta a valódi mezőkkel.
 *
 *   npm run demo:szuleszet
 *   npm run demo:szuleszet -- --lang en
 *
 * Egy szintetikus eset végigvitele a `03` anamnézistől a szülőszobáig, azzal
 * a mezőkészlettel, ami a regiszterben VAN — nem képernyőterv, hanem a motor
 * tényleges viselkedése.
 *
 * A demó azt mutatja meg, ami a képernyőterven nem látszik:
 *
 *   · mi tölt fel mit magától (keresztfeltöltés),
 *   · mi NEM számol, és pontosan mi hiányzik hozzá,
 *   · melyik kapu zár, és miért,
 *   · mit mond a rendszer a BETEGNEK és mit a KLINIKUSNAK ugyanabból,
 *   · és mi történik, ha a nyelvet átváltjuk.
 *
 * MINDEN ADAT SZINTETIKUS. A demó betegazonosításra alkalmas mezőt nem tölt ki.
 */
import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import { runCalc } from "../core/calc/run.ts";
import { CALC_BY_ID } from "../core/calc/defs.ts";
import { patientSummary, recommendations } from "../core/ui/output.ts";
import { pick, t } from "../core/i18n.ts";
import { assess, loadProtocol } from "../core/szepszis/screen.ts";
import { alertStatus, bundleStatus } from "../core/szepszis/bundle.ts";
import { append, replay, verifyChain } from "../core/journal/journal.ts";
import type { JournalEntry } from "../core/journal/types.ts";
import type { CaseState, Lang, Provenance } from "../core/types.ts";

const argv = process.argv.slice(2);
const LANG = (argv.includes("--lang") ? argv[argv.indexOf("--lang") + 1] : "hu") as Lang;

const reg = loadRegistry("registry/variables");
const SEP = loadProtocol("registry/szepszis/cmqcc-ob-szepszis.json");

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const OK = (s: string) => `\x1b[32m${s}\x1b[0m`;
const WARN = (s: string) => `\x1b[33m${s}\x1b[0m`;
const BAD = (s: string) => `\x1b[31m${s}\x1b[0m`;

/**
 * OSZLOPRA IGAZÍTÁS ANSI-KÓDOK MELLETT.
 *
 * A `padEnd` a nem látható escape-szekvenciákat is megszámolja, ezért a
 * forrásnyelvi jelöléssel ellátott címkék elcsúsztatnák a táblát. A LÁTHATÓ
 * hosszal töltünk.
 */
function pad(s: string, n: number): string {
  const visible = s.replace(/\x1b\[[0-9;]*m/g, "").length;
  return s + " ".repeat(Math.max(0, n - visible));
}

/** Tördelés — a csonkolt mondat a felén elveszíti az indoklást. */
function wrap(text: string, indent = "  ", width = 78): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur.length + w.length + 1) > width) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines.map((l) => indent + l).join("\n");
}

function h(n: string, title: string): void {
  console.log(`\n${B(n + "  " + title)}\n${"─".repeat(title.length + n.length + 2)}`);
}

/** A címke a kért nyelven — és MEGJELÖLVE, ha nem az. */
function label(id: string): string {
  const d = reg.get(id);
  const p = pick(d?.label, LANG);
  return p.text + (p.fallback ? DIM(` ⟨${p.lang}⟩`) : "");
}

/**
 * AZ ÉRTÉK EMBERI ALAKJA.
 *
 * A motor a dátumot epoch-ezredmásodpercként adja vissza (a kalkulátorok így
 * számolnak vele). A felületnek — és ennek a demónak — a mező DEKLARÁLT
 * típusából kell visszaformáznia. Nem kozmetika: egy „1773619200000” dátumot
 * senki nem tud ellenőrizni, márpedig a levezetett terminus ellenőrizhető
 * kell legyen.
 */
function fmt(id: string, value: unknown): string {
  const d = reg.get(reg.resolvePrimary(id));
  if (d?.datatype === "date" || d?.datatype === "datetime") {
    const ms = typeof value === "number" ? value : Date.parse(String(value));
    if (Number.isFinite(ms)) {
      const iso = new Date(ms).toISOString();
      return d.datatype === "date" ? iso.slice(0, 10) : iso.slice(0, 16).replace("T", " ");
    }
  }
  // kódolt mezőnél a KÓD helyett az emberi címke — a kód a gépé, nem a klinikusé
  const item = d?.valueSet?.find((v) => String(v.code) === String(value));
  if (item) {
    const lbl = LANG === "en" ? item.label_en : item.label_hu;
    return lbl ? lbl : `${String(value)}${DIM(" ⟨kód⟩")}`;
  }
  const u = d?.unit && d.unit !== "1" ? ` ${d.unit}` : "";
  return `${String(value)}${u}`;
}

const T0 = Date.parse("2026-03-14T08:00:00.000Z");
const at = (min: number) => new Date(T0 + min * 60000).toISOString();

let log: JournalEntry[] = [];
let st: CaseState = {
  ctx: { encounter: "labour", now: at(0) }, values: {}, errors: [],
};

/**
 * MINDEN ÍRÁS A NAPLÓN KERESZTÜL.
 *
 * Nem demó-fogás: ez a valódi út. Az eseménysor a rekord, az állapot a
 * vetülete — és a napló minden bejegyzésében ott a cselekvő.
 */
function put(id: string, value: unknown, min: number,
             actor = "dr. Minta Anna", prov: Provenance = "clinician"): void {
  if (!reg.get(id)) throw new Error(`ismeretlen változó: ${id}`);
  const v = { value, t: at(min), provenance: prov, confidence: "measured" as const };
  log = append(log, { caseId: "demo-1", actor, op: "write", at: at(min),
    variableId: id, value: v, entryId: `e${log.length + 1}` });
  st = setValue(reg, st, id, value, { t: at(min), provenance: prov });
}

/* ══ 1. A TERHESSÉG KONTEXTUSA ═════════════════════════════════════ */

h("1.", LANG === "en" ? "Pregnancy context" : "A terhesség kontextusa");

put("ctx.lmp", "2025-06-09", 0);
put("ctx.parity.gravida", 3, 0);
put("ctx.parity.para", 1, 0);
st = recompute(reg, st);

for (const id of ["ctx.lmp", "ctx.edd", "ctx.ga"]) {
  const r = resolve(reg, st, id);
  console.log(`  ${pad(label(id), 46)} ${
    r.state === "ok" ? OK(fmt(id, r.value)) : WARN("—")}  ${
    r.provenance ? DIM(r.provenance) : ""}`);
}
console.log(DIM(`\n  A terminus és a terhességi kor LEVEZETETT: az utolsó menstruációból`));
console.log(DIM(`  számítódott, nem beírtuk. Egy levezetett mezőt a motor nem enged`));
console.log(DIM(`  kézzel írni — a bemenetét kell javítani.`));

/* ══ 2. ANAMNÉZIS → A SZÜLÉSZETI SCORE-OK BEMENETE ═════════════════ */

h("2.", LANG === "en" ? "History feeds the scores" : "Az anamnézis feltölti a score-okat");

put("anthro.height", 166, 0);
put("anthro.weight.prepregnancy", 61, 0);
put("hx.repro.prevBirth.cs", 1, 0);
st = recompute(reg, st);

const bmi = runCalc(reg, st, "calc.bmi", LANG);
console.log(`  ${label("anthro.bmi").padEnd(46)} ${
  bmi.status === "ok" ? OK(bmi.value.toFixed(1) + " kg/m²") : WARN(bmi.reason)}`);
console.log(DIM(`  → a korábbi császármetszés innen megy tovább a VBAC- és a`));
console.log(DIM(`    vérzési kockázatba: egy adat, több felhasználás.`));

/* ══ 3. A SZÜLŐSZOBAI FELVÉTELI VIZSGÁLAT ═════════════════════════ */

h("3.", LANG === "en" ? "Admission examination" : "A szülőszobai felvételi vizsgálat");

/**
 * A burokrepedés IDŐPONTJÁT rögzítjük, nem az azóta eltelt órákat: az óra
 * megy tovább, a beírt szám nem. A `status.obs.membranes.hours` levezetett.
 */
put("status.obs.membranes", "srom", 0);
put("status.obs.membranes.rupturedAt", at(-20 * 60), 0);
put("status.obs.presentation", "cephalic", 0);
put("status.obs.lie", "long", 0);
put("status.obs.position", "loa", 0);
put("status.obs.engagement", 3, 0);
put("status.obs.fhr", 152, 0);
put("status.obs.fhr.method", "ctg", 0);
put("status.obs.fundalHeight", "norm", 0);
put("status.obs.fundalHeight.cm", 36, 0);
put("status.obs.contractions.freq", 3, 0);
put("status.obs.contractions.duration", 45, 0);
put("status.obs.contractions.intensity", "moderate", 0);
st = recompute(reg, { ...st, ctx: { ...st.ctx, now: at(0) } });

for (const id of ["status.obs.presentation", "status.obs.position",
                  "status.obs.engagement", "status.obs.fhr",
                  "status.obs.membranes", "status.obs.membranes.hours"]) {
  const r = resolve(reg, st, id);
  console.log(`  ${pad(label(id), 46)} ${
    r.state === "ok" ? OK(fmt(id, r.value)) : WARN("—")}  ${
    r.sourceRef ? DIM("← " + r.sourceRef) : ""}`);
}
console.log(DIM(`\n  A burokrepedés óta eltelt idő SZÁMÍTOTT — a repedés időpontjából és`));
console.log(DIM(`  a vizsgálat idejéből. Nem avul el, mert nem szám, hanem különbség.`));

/* ══ 3/b. A SZÜLŐSZOBAI IDŐSOR ════════════════════════════════════ */

h("3/b.", LANG === "en" ? "The labour time series" : "A szülőszobai idősor");

const series: Array<[number, string, unknown]> = [
  [0,   "labour.stage", "latent"],
  [0,   "labour.cervix", 3],
  [0,   "vitals.bp.systolic", 118], [0, "vitals.bp.diastolic", 74],
  [0,   "vitals.pulse", 84], [0, "vitals.temp", 36.8], [0, "vitals.rr", 16],
  [0,   "vitals.spo2", 98],
  [120, "labour.cervix", 5],
  [120, "vitals.bp.systolic", 126], [120, "vitals.bp.diastolic", 80],
  [120, "vitals.pulse", 96], [120, "vitals.temp", 37.6], [120, "vitals.rr", 20],
  [120, "vitals.spo2", 97],
  [240, "labour.cervix", 7],
  [240, "vitals.bp.systolic", 132], [240, "vitals.bp.diastolic", 86],
  [240, "vitals.pulse", 118], [240, "vitals.temp", 38.4], [240, "vitals.rr", 26],
  [240, "vitals.spo2", 94],
  [240, "labour.amniotic", "meconiumThick"],
  [240, "labour.stage", "active"],
];
for (const [min, id, v] of series) put(id, v, min);
st = recompute(reg, { ...st, ctx: { ...st.ctx, now: at(240) } });

console.log(`  ${DIM("idő".padEnd(8) + "tágulat   RR        pulzus  hő      légzés  SpO₂")}`);
for (const min of [0, 120, 240]) {
  const pickAt = (id: string) =>
    series.filter(([m, i]) => m === min && i === id).map(([, , v]) => v)[0];
  console.log(`  ${(at(min).slice(11, 16)).padEnd(8)}${
    String(pickAt("labour.cervix") ?? "").padEnd(10)}${
    `${pickAt("vitals.bp.systolic")}/${pickAt("vitals.bp.diastolic")}`.padEnd(10)}${
    String(pickAt("vitals.pulse")).padEnd(8)}${
    String(pickAt("vitals.temp")).padEnd(8)}${
    String(pickAt("vitals.rr")).padEnd(8)}${String(pickAt("vitals.spo2"))}`);
}
console.log(DIM("\n  A napló HOZZÁFŰZŐ: a 3 cm-es tágulat nem tűnt el, amikor 5 lett."));

/* ══ 4. A SCORE-OK — ÉS AMI NEM SZÁMOL ════════════════════════════ */

h("4.", LANG === "en" ? "Scores — and what does not compute"
                      : "A score-ok — és ami NEM számol");

for (const id of ["calc.meows", "calc.omqsofa", "calc.cmqcc.ob.sepsis.screen",
                  "calc.cmqcc.stage", "calc.isth.dic.pregnancy"]) {
  const c = runCalc(reg, st, id, LANG);
  const name = pick(CALC_BY_ID.get(id)?.label, LANG).text || id;
  if (c.status === "ok") {
    console.log(`  ${OK("●")} ${pad(name, 44)} ${B(String(c.value))} ${
      c.interpretation ? DIM(c.interpretation) : ""}`);
  } else {
    console.log(`  ${WARN("○")} ${pad(name, 44)} ${WARN(t("calc.insufficient", LANG))}`);
    console.log(`      ${DIM(c.reason.slice(0, 150))}`);
  }
}
console.log(DIM("\n  A hiányzó bemenet nem nulla, és nem is „normális”: a score NEM SZÁMOL,"));
console.log(DIM("  és megmondja, MELYIK mezőre vár. Ez a rendszer legtöbbet ismételt szabálya."));

/* ══ 5. A SZEPSZIS-ÚT — HÁROM LÉPÉS, EMBERI DÖNTÉSSEL ═════════════ */

h("5.", LANG === "en" ? "The sepsis pathway" : "A szepszis-út");

const circ = { pregnancy: "pos" as const, inLabour: true };
const a1 = assess(reg, st, SEP, circ);
console.log(`  állapot: ${B(a1.state)}`);
console.log(wrap(a1.why));
console.log(DIM(`\n  Figyeld meg: VAJÚDÁS alatt a fehérvérsejtszám kiesik a szűrésből —`));
console.log(DIM(`  nem „normális”, hanem NEM ÉRTÉKELHETŐ. A kettő nem ugyanaz.`));

const a2 = assess(reg, st, SEP, circ,
  { suspected: true, by: "dr. Minta Anna", at: at(245) });
console.log(`\n  a góc kérdésére adott válasz után: ${B(a2.state)}`);
console.log(wrap(a2.why));
for (const g of a2.gaps) console.log(`  ${WARN("⚠")}\n${DIM(wrap(g, "    "))}`);

/* ══ 6. AZ ÓRÁHOZ KÖTÖTT CSOMAG ÉS A SORRENDI KAPU ════════════════ */

h("6.", LANG === "en" ? "The timed bundle" : "Az órához kötött csomag");

const bs = bundleStatus(SEP, at(245), [
  { step: "sep.b.antibiotic", at: at(270), by: "dr. Minta Anna" },
  { step: "sep.b.culture", at: at(295) },
  { step: "sep.b.lactate", at: at(260) },
], at(320));
for (const s of bs.steps.filter((x) => x.state !== "notApplicable")) {
  const mark = s.state === "onTime" ? OK("●") : s.state === "late" ? WARN("◐") :
               s.state === "overdue" ? BAD("○") : DIM("·");
  console.log(`  ${mark} ${pad(s.label, 52)} ${DIM(s.why.slice(0, 60))}`);
}
for (const o of bs.orderIssues) {
  console.log(`\n  ${BAD("SORREND")}\n${wrap(o.why, "    ")}`);
}

const al = alertStatus(SEP, at(245), null, at(320));
console.log(`\n  riasztás: ${BAD(al.state)}\n${wrap(al.why, "    ")}`);

/* ══ 7. UGYANABBÓL KÉT KIMENET ════════════════════════════════════ */

h("7.", LANG === "en" ? "Two outputs from the same data"
                      : "Ugyanabból két kimenet");

console.log(B(`  ${t("out.patient", LANG)}`));
for (const p of patientSummary(reg, st, LANG).slice(0, 4)) {
  console.log(`    ${p.text}`);
}
console.log(B(`\n  ${t("out.clinician", LANG)}`));
for (const r of recommendations(reg, st, LANG).slice(0, 5)) {
  console.log(`    [${r.kind}] ${r.text}  ${DIM("← " + r.fromLabel)}`);
}

console.log(DIM(`\n  A meconium-javaslat NEM a szülőszobai lapon van megírva: a „Magzatvíz”`));
console.log(DIM(`  mező TÜKÖR, az érték a felvételi státusz mezőjében él, és a javaslat`));
console.log(DIM(`  ott van egyszer. Amíg két külön mező volt rá, a szülőszobán rögzített`));
console.log(DIM(`  sűrű meconium NEM váltotta ki az újszülött-ellátási készenlétet.`));

/* ══ 8. A NAPLÓ ÉS A NYELV ════════════════════════════════════════ */

h("8.", LANG === "en" ? "The journal and the language"
                      : "A napló és a nyelv");

const chain = verifyChain(log);
const back = replay(log);
console.log(`  bejegyzés: ${B(String(log.length))}   lánc: ${
  chain.ok ? OK("ép") : BAD(chain.kind)}   visszajátszva: ${B(String(
  Object.values(back.state.values).reduce((n, v) => n + v.length, 0)))} érték`);
console.log(DIM(`  Minden bejegyzésben ott a cselekvő: az írási napló az auditnapló írási fele.`));

const fallbacks = ["ctx.ga", "labour.cervix", "vitals.temp", "score.meows"]
  .filter((id) => pick(reg.get(id)?.label, LANG).fallback).length;
console.log(`\n  nyelv: ${B(LANG)}   forrásnyelvi címke a mintában: ${
  fallbacks ? WARN(`${fallbacks}/4`) : OK("0/4")}`);
if (fallbacks) {
  console.log(DIM(`  A ⟨hu⟩ jelölés azt mondja: ez a szöveg NINCS lefordítva. A rendszer`));
  console.log(DIM(`  nem fordít gépileg klinikai szöveget — a rögtönzött fordítás nem`));
  console.log(DIM(`  ugyanaz a fogalom.`));
}

console.log(`\n${DIM("Minden adat szintetikus. Valódi betegadattal ez a demó nem futtatható.")}`);
