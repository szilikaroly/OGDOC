/**
 * EGY TELJES ESET VÉGIGVITELE — a két kimenettel.
 *
 *   npm run demo            (magyarul)
 *   npm run demo -- --lang en
 *
 * Ez az 5. lépés: egy szintetikus AMBULÁNS eset a felvételtől a generált
 * dokumentumig — panasz → státusz → lelet → levezetés → **betegnek szóló
 * szöveg** és **klinikusnak szóló teendőlista**.
 *
 * MIÉRT EZ AZ ÖTÖDIK. Ez az első pont, ahol a rendszer nem részenként, hanem
 * EGÉSZBEN mutatja meg magát. A részek külön-külön szépek lehetnek; az számít,
 * hogy egy vizit végén a klinikus azt mondja-e: ezt aláírnám.
 *
 * AZ ESET SZINTETIKUS. Valódi betegadat sem itt, sem a repóban nem szerepelhet.
 * A beteg neve nem hangzik el: a rendszer a `patient.taj`-t és a születési
 * dátumot `phi` jelöléssel kezeli, és a demó egyiket sem írja ki.
 */
import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { resolve } from "../core/derive/resolve.ts";
import { loadComplaints } from "../core/complaints/registry.ts";
import { loadScreenings } from "../core/screening/registry.ts";
import { patientSummary, recommendations, needsConfirmation } from "../core/ui/output.ts";
import { ertekelMeres, meresek, meresTeendok } from "../core/ui/meres.ts";
import { assessVerzes, loadVerzesTabla } from "../core/scores/verzes.ts";
import { assessVbac } from "../core/scores/vbac.ts";
import { assessVte } from "../core/scores/vte.ts";
import { gerincAllapot } from "../core/anamnezis/gerinc.ts";
import { append, verifyChain } from "../core/journal/journal.ts";
import type { JournalEntry } from "../core/journal/types.ts";
import type { CaseState, Lang } from "../core/types.ts";

const argv = process.argv.slice(2);
const LANG = (argv.includes("--lang") ? argv[argv.indexOf("--lang") + 1] : "hu") as Lang;

const reg = loadRegistry("registry/variables");
const dict = loadComplaints("registry/complaints");
const szuresek = loadScreenings("registry/szuresek");
const verzesTabla = loadVerzesTabla("registry/kockazat/cmqcc-verzes.json");

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const OK = (s: string) => `\x1b[32m${s}\x1b[0m`;
const WARN = (s: string) => `\x1b[33m${s}\x1b[0m`;
const BAD = (s: string) => `\x1b[31m${s}\x1b[0m`;
const P = (...s: string[]) => console.log(s.join(""));

function wrap(text: string, indent = "  ", width = 78): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width - indent.length) {
      lines.push(indent + line.trim()); line = w;
    } else line += " " + w;
  }
  if (line.trim()) lines.push(indent + line.trim());
  return lines.join("\n");
}

function fejezet(n: number, cim: string): void {
  P("");
  P(B(`${n} · ${cim}`));
  P("─".repeat(Math.min(78, cim.length + 4)));
}

const T0 = Date.parse("2026-09-05T09:00:00Z");
const at = (min: number) => new Date(T0 + min * 60000).toISOString();

let st: CaseState = {
  ctx: { encounter: "ambulatory", pathway: "prenatal", now: at(0) },
  values: {}, errors: [],
};
let naplo: JournalEntry[] = [];

/** Minden írás naplózódik — eredettel és időbélyeggel, kivétel nélkül. */
function ir(id: string, value: unknown, perc: number, prov = "clinician"): void {
  st = recompute(reg, { ...st, ctx: { ...st.ctx, now: at(perc) } });
  st = setValue(reg, st, id, value as never, { provenance: prov as never });
  naplo = append(naplo, {
    kind: "set", id, value, t: at(perc), provenance: prov as never, actor: "dr-teszt",
  } as never);
}

P("");
P(B("EGY TELJES ESET VÉGIGVITELE — ambuláns szülészeti vizit"));
P(DIM("Szintetikus eset. Név és azonosító nem hangzik el."));

/* ── 1. FELVÉTEL ────────────────────────────────────────────────────── */

fejezet(1, "Felvétel — amit a rendszer már tud");

for (const [id, v] of [
  ["patient.birthDate", "1990-04-12"],
  ["anthro.height", 166],
  ["anthro.weight.prepregnancy", 62],
  ["anthro.weight.current", 74],
  ["ctx.pregnant", "pos"],
  ["ctx.lmp", "2026-02-02"],
  ["ctx.multiple", "no"],
  ["ctx.parity.gravida", 2],
  ["ctx.parity.para", 1],
] as Array<[string, unknown]>) ir(id, v, 0);

for (const [id, v] of [
  ["hx.repro.prevBirth.cs", 1],
  ["hx.repro.prevBirth.vaginal", 0],
  ["hx.repro.prevBirth.vbac", "neg"],
  ["hx.repro.prevBirth.recurringIndication", "neg"],
  ["hx.repro.prevBirth.pph", "pos"],
  ["hx.repro.gdm", "neg"],
  ["hx.repro.currentPregnancy.previa", "neg"],
  ["hx.repro.currentPregnancy.accreta", "neg"],
  ["hx.repro.preeclampsia", "pos"],
  ["hx.sys.vte", "neg"],
  ["hx.sys.thrombophilia", "neg"],
  ["hx.sys.aps", "neg"],
  ["hx.sys.cardiac.congenital", "neg"],
  ["hx.sys.bleedingDisorder", "neg"],
  ["hx.sys.anemia", "neg"],
  ["hx.sys.myoma", "neg"],
  ["hx.sys.htn", "neg"],
  ["hx.sys.thyroid.hypo", "unk"],
  ["hx.life.smoking", "never"],
] as Array<[string, unknown]>) ir(id, v, 1);

st = recompute(reg, st);

const kor = resolve(reg, st, "patient.age");
const ga = resolve(reg, st, "ctx.ga");
const bmi = resolve(reg, st, "anthro.bmi");
P("");
P(`  ${kor.value} éves · 2. terhesség, 1 korábbi császármetszés`);
P(`  Gesztációs kor: ${B(String(ga.value))} hét ${DIM("(levezetett: ctx.lmp)")}`);
P(`  Testtömegindex: ${bmi.value} kg/m² ${DIM("(levezetett: magasság + terhesség előtti súly)")}`);
P("");
P(wrap(DIM(
  "Ezt a klinikus NEM gépelte be: az életkor a születési dátumból, a " +
  "gesztációs kor az utolsó menstruációból, a BMI a magasságból és a " +
  "terhesség előtti súlyból áll elő. Tárolt korral a rekord egy év múlva " +
  "hazudik.")));

/* ── 2. PANASZ ──────────────────────────────────────────────────────── */

fejezet(2, "A panasz — a beteg szavaival");

const mondat = "fáj a fejem és villog a szemem";
P("");
P(`  A beteg így mondja: ${B("„" + mondat + "”")}`);
P("");
const talalatok = dict.search(mondat, 3, st.ctx.pathway);
for (const h of talalatok) {
  P(`  → ${h.term.label.hu} ${DIM(`(${h.term.id}, találat: „${h.matched}”)`)}`);
}
const panasz = talalatok[0]?.term;
if (!panasz) throw new Error("A panaszszótár nem találta meg a mondatot.");

ir("compl.chief", panasz.id, 5);
ir("compl.verbatim", mondat, 5);
st = recompute(reg, st);

const vorosZaszlo = panasz.redflag
  || (panasz.redflagWhen ?? []).every((c) => {
    const r = resolve(reg, st, c.var);
    return r.state === "ok" && r.value === c.value;
  });

P("");
if (vorosZaszlo) {
  P(`  ${BAD("VÖRÖS ZÁSZLÓ")} — a feltétel teljesül: ` +
    (panasz.redflagWhen ?? []).map((c) => `${c.var} = ${String(c.value)}`).join(", "));
  P("");
  P(wrap(WARN(panasz.documentation?.pitfalls?.hu ?? "")));
}
P("");
P(`  ${DIM("Amire gondolni kell:")} ${(panasz.differential ?? []).join(" · ")}`);
P("");
P(`  ${B("Ez a panasz megnyitja:")}`);
for (const id of panasz.opens ?? []) {
  const d = reg.get(id);
  P(`    · ${d?.label?.hu ?? id} ${DIM(id)}`);
}

/* ── 3. STÁTUSZ ÉS LELET ────────────────────────────────────────────── */

fejezet(3, "Státusz és lelet — csak amit megvizsgáltunk");

ir("vitals.bp.systolic", 158, 12);
ir("vitals.bp.diastolic", 98, 12);
ir("vitals.pulse", 88, 12);
ir("status.internal.edema", "abn", 14);
ir("status.internal.edema.site", "leg", 14);
ir("status.internal.lungs", "norm", 14);
ir("status.obs.fhr", 142, 16);
ir("lab.urine.protein", "plus2", 20);
ir("lab.plt", 168, 45);
ir("lab.ast", 41, 45);
ir("lab.cr", 68, 45);
st = recompute(reg, st);

P("");
P(`  Vérnyomás  ${B("158/98")} Hgmm ${DIM("(9:12)")}`);
P(`  Oedema     alsó végtag ${DIM("(9:14)")}`);
P(`  Tüdő       eltérés nélkül ${DIM("(9:14)")}`);
P(`  Magzati szívhang  142/min ${DIM("(9:16)")}`);
P(`  Vizeletfehérje    ++ ${DIM("(9:20, gyorsteszt)")}`);
P(`  Labor      Thr 168 · AST 41 · Kreatinin 68 ${DIM("(9:45)")}`);
P("");
P(wrap(DIM(
  "Ami nincs felsorolva, azt nem vizsgáltuk meg — és a rendszer nem is " +
  "állít róla semmit. A kimaradt mező nem „eltérés nélkül”.")));

/* ── 4. AMIT A MÉRÉSEKRŐL MOND ──────────────────────────────────────── */

fejezet(4, "A mért értékek megítélése — és amit nem ítél meg");

P("");
for (const m of meresek(reg, st, LANG)) {
  const jel = m.allapot === "kritikus" ? BAD("KRITIKUS")
    : m.allapot === "referencianKivul" ? WARN("tartományon kívül")
    : m.allapot === "nemErtekelheto" ? DIM("nem értékelhető")
    : OK("sávban");
  P(`  ${jel}  ${m.label}: ${m.value ?? "—"}${m.unit ? " " + m.unit : ""}`);
  if (m.allapot !== "savban") P(wrap(DIM(m.miert), "        "));
}

/* ── 5. KOCKÁZATOK AZ ANAMNÉZISBŐL ──────────────────────────────────── */

fejezet(5, "Kockázatok — az anamnézisből, újrakérdezés nélkül");

const g = gerincAllapot(reg, st, { verzesTabla, szuresek }, LANG);
P("");
P(wrap(g.keszen ? OK(g.osszefoglalo) : WARN(g.osszefoglalo)));
P("");

const verzes = assessVerzes(reg, st, verzesTabla, LANG);
P(`  ${B("Vérzési kockázat")} — fennáll: ` +
  (verzes.fennallo.length ? verzes.fennallo.map((t) => t.label).join(", ") : DIM("egy sem")));
if (verzes.nincsSzint) P(wrap(WARN("Szint nem születik — a tábla nincs hitelesítve."), "    "));

const vbac = assessVbac(reg, st, LANG);
P(`  ${B("VBAC")} — ellenjavallat: ${vbac.contraindicated.yes ? BAD("igen") : OK("nincs")}` +
  DIM(`; kedvező tényező: ${vbac.factors.filter((f) => f.present === true).length}/3`));

const vte = assessVte(reg, st, LANG);
P(`  ${B("VTE")} — fennáll: ` +
  (vte.present.length ? vte.present.map((f) => f.label).join(", ") : DIM("egy sem")));
if (vte.nemTudja.length) P(`    ${WARN("?")} nem tudja: ${vte.nemTudja.join(", ")}`);

/* ── 6. A BETEGNEK SZÓLÓ SZÖVEG ─────────────────────────────────────── */

fejezet(6, "A BETEGNEK szóló szöveg");

const beteg = patientSummary(reg, st, LANG);
P("");
if (!beteg.length) P(DIM("  (üres)"));
for (const l of beteg) {
  const jel = l.tone === "abnormal" ? WARN("•") : l.tone === "normal" ? OK("•") : DIM("•");
  P(`  ${jel} ${l.text}`);
}
P("");
P(wrap(DIM(
  "A NORMÁLIS lelet is szerepel: „a tüdő vizsgálata eltérést nem mutatott” " +
  "többet mond a betegnek, mint a csend. De a NEM VIZSGÁLT mezőről egy " +
  "mondat sem áll itt — arról a rendszer nem állít semmit.")));

/* ── 7. A KLINIKUSNAK SZÓLÓ TEENDŐLISTA ─────────────────────────────── */

fejezet(7, "A KLINIKUSNAK szóló teendőlista");

const SURG = { urgent: BAD("sürgős"), soon: WARN("hamarosan"), routine: DIM("rutin") };
P("");

const meresTeendo = meresTeendok(reg, st,
  ["vitals.bp.systolic", "vitals.bp.diastolic", "lab.plt", "lab.ast", "status.obs.fhr"], LANG);
for (const t of meresTeendo) {
  P(`  [${SURG.urgent}] ${t.text}`);
  P(wrap(DIM(`← ${t.miert}`), "      "));
}

const jav = recommendations(reg, st, LANG);
for (const r of jav) {
  P(`  [${SURG[r.urgency ?? "routine"]}] ${r.text}  ${DIM(`(${r.kind})`)}`);
  P(`      ${DIM(`← ${r.fromLabel} (${r.from})`)}`);
}
if (!jav.length && !meresTeendo.length) P(DIM("  (üres)"));
P("");
P(wrap(DIM(
  "Minden javaslat mellett ott áll, MELYIK MEZŐ váltotta ki. Egy indoklás " +
  "nélküli javaslatot a klinikus vagy vakon elfogad, vagy vakon elutasít — " +
  "mindkettő rossz.")));

/* ── 8. AMIT A RENDSZER NEM MOND KI ─────────────────────────────────── */

fejezet(8, "Amit a rendszer NEM mond ki — és megnevezi, miért");

P("");
const nemErt = meresek(reg, st, LANG).filter((m) => m.allapot === "nemErtekelheto");
for (const m of nemErt) P(`  · ${m.label} — ${m.miert.split("—").slice(1).join("—").trim() || m.miert}`);
if (verzes.nincsSzint) {
  P(`  · Vérzési kockázati SZINT — a tábla hitelesítetlen (${verzesTabla.verification}).`);
}
P(`  · Praeeclampsia-DIAGNÓZIS — a rendszer leletet és küszöböt mutat, ` +
  `diagnózist nem mond ki.`);
const megerositendo = needsConfirmation(reg, st, LANG);
if (megerositendo.length) {
  P(`  · ${megerositendo.length} beteg által megadott érték klinikusi megerősítésre vár.`);
}

/* ── 9. A NAPLÓ ─────────────────────────────────────────────────────── */

fejezet(9, "A napló — minden érték eredettel és időbélyeggel");

const lanc = verifyChain(naplo);
P("");
P(`  ${naplo.length} bejegyzés · a hasítólánc ${lanc.ok ? OK("ép") : BAD("SÉRÜLT")}`);
P("");
P(wrap(DIM(
  "Egyetlen érték sem került a rendszerbe eredet és időbélyeg nélkül, és a " +
  "napló utólag nem módosítható a lánc megtörése nélkül.")));
P("");
