/**
 * AZ ANAMNÉZIS-GERINC — futtatható bemutató.
 *
 *   npm run demo:gerinc
 *
 * Két állapotot mutat egymás mellett: felvételi adatokkal, anamnézis NÉLKÜL,
 * majd a kitöltött anamnézissel. A különbség az, amit a 4. lépés mér — hány
 * kérdést kell újra feltenni.
 *
 * AZ ESET SZINTETIKUS. Valódi betegadat sem itt, sem a repóban nem szerepelhet.
 */
import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { loadScreenings } from "../core/screening/registry.ts";
import { assessVerzes, loadVerzesTabla } from "../core/scores/verzes.ts";
import { assessVbac } from "../core/scores/vbac.ts";
import { assessVte } from "../core/scores/vte.ts";
import { gerincAllapot } from "../core/anamnezis/gerinc.ts";
import type { CaseState } from "../core/types.ts";

const reg = loadRegistry("registry/variables");
const tabla = loadVerzesTabla("registry/kockazat/cmqcc-verzes.json");
const szuresek = loadScreenings("registry/szuresek");
const NOW = "2026-09-05T09:00:00.000Z";

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const OK = (s: string) => `\x1b[32m${s}\x1b[0m`;
const WARN = (s: string) => `\x1b[33m${s}\x1b[0m`;
const P = (...s: string[]) => console.log(s.join(""));

function wrap(text: string, indent = "  ", width = 78): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width - indent.length) {
      lines.push(indent + line.trim());
      line = w;
    } else line += " " + w;
  }
  if (line.trim()) lines.push(indent + line.trim());
  return lines.join("\n");
}

const FELVETEL: Array<[string, unknown]> = [
  ["patient.birthDate", "1990-04-12"],
  ["anthro.height", 166],
  ["anthro.weight.prepregnancy", 62],
  ["ctx.pregnant", "pos"],
  ["ctx.lmp", "2026-03-01"],
  ["ctx.multiple", "no"],
  ["ctx.parity.para", 1],
];

const ANAMNEZIS: Array<[string, unknown]> = [
  ["hx.repro.prevBirth.cs", 1],
  ["hx.repro.prevBirth.vaginal", 0],
  ["hx.repro.prevBirth.vbac", "neg"],
  ["hx.repro.prevBirth.recurringIndication", "neg"],
  ["hx.repro.prevBirth.pph", "pos"],
  ["hx.repro.gdm", "neg"],
  ["hx.repro.currentPregnancy.previa", "neg"],
  ["hx.repro.currentPregnancy.accreta", "neg"],
  ["hx.sys.vte", "unk"],
  ["hx.sys.thrombophilia", "neg"],
  ["hx.sys.aps", "neg"],
  ["hx.sys.cardiac.congenital", "neg"],
  ["hx.sys.bleedingDisorder", "neg"],
  ["hx.sys.anemia", "pos"],
  ["hx.sys.myoma", "neg"],
  ["hx.sys.thyroid.hypo", "neg"],
  ["hx.life.smoking", "never"],
];

function tolt(tetelek: Array<[string, unknown]>, st?: CaseState): CaseState {
  let s: CaseState = st ?? { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  for (const [id, v] of tetelek) s = setValue(reg, s, id, v as never);
  return recompute(reg, s);
}

const felvett = tolt(FELVETEL);
const teljes = tolt(ANAMNEZIS, felvett);
const be = { verzesTabla: tabla, szuresek };

P("");
P(B("AZ ANAMNÉZIS-GERINC — 4. lépés"));
P(DIM("Szintetikus eset. 36 éves, egy korábbi császármetszés, 26+6 hét."));
P("");

/* ── 1. Anamnézis nélkül ────────────────────────────────────────────── */

P(B("1. FELVÉTELI ADATOKKAL, ANAMNÉZIS NÉLKÜL"));
P("");
const g0 = gerincAllapot(reg, felvett, be);
P(wrap(g0.osszefoglalo));
P("");
for (const k of g0.kerdesek) {
  P(`  ${WARN("?")} ${k.label}`);
  P(DIM(`      ${k.variable} · ${k.kinek.join(" · ")}`));
}
P("");

/* ── 2. Kitöltött anamnézissel ──────────────────────────────────────── */

P(B("2. A KITÖLTÖTT ANAMNÉZISSEL"));
P("");
const g1 = gerincAllapot(reg, teljes, be);
P(wrap(g1.keszen ? OK(g1.osszefoglalo) : WARN(g1.osszefoglalo)));
P("");
for (const f of g1.fogyasztok) {
  P(`  ${f.hianyzo.length === 0 ? OK("✓") : WARN("?")} ${f.label}` +
    (f.hianyzo.length ? DIM(`  — hiányzik: ${f.hianyzo.join(", ")}`) : ""));
}
P("");

/* ── 3. Amit a modulok ebből mondanak ───────────────────────────────── */

P(B("3. AMIT A MODULOK EBBŐL MONDANAK"));
P("");

const v = assessVerzes(reg, teljes, tabla);
P(`  ${B("Vérzési kockázat")} — fennálló tényezők:`);
for (const t of v.fennallo) P(`    · ${t.label} ${DIM(`(${t.szint})`)}`);
for (const t of v.tenyezok.filter((x) => x.fennall === "unknown")) {
  P(`    ${WARN("?")} ${t.label} ${DIM("— nem tudja")}`);
}
P("");
P(wrap(WARN(v.nincsSzint ?? ""), "    "));
P("");

const b = assessVbac(reg, teljes);
P(`  ${B("VBAC")} — ellenjavallat: ${b.contraindicated.yes ? WARN("igen") : OK("nincs")}`);
for (const f of b.factors) {
  const jel = f.present === true ? OK("igen") : f.present === false ? "nem" : WARN("nem tudja");
  P(`    · ${f.label}: ${jel} ${DIM(`(${f.direction})`)}`);
}
P("");

const vte = assessVte(reg, teljes);
P(`  ${B("VTE (Caprini/RCOG)")} — fennálló tényezők: ` +
  (vte.present.length ? vte.present.map((f) => f.label).join(", ") : DIM("egy sem")));
if (vte.nemTudja.length) {
  P(`    ${WARN("?")} nem tudja: ${vte.nemTudja.join(", ")}`);
  P(wrap(DIM("A rögzített „nem tudom” NEM „nem”: a kockázat nem zárható ki, " +
    "csak nem ismerjük. A modul ezért „unknown” állapotban tartja."), "    "));
}
P("");

const due = szuresek.dueList(reg, teljes);
P(`  ${B("Szűrési esedékesség")}`);
for (const s of due.filter((x) => x.status !== "notApplicable")) {
  const jel = s.status === "due" || s.status === "overdue" ? WARN(s.status) : DIM(s.status);
  P(`    · ${s.label}: ${jel} ${DIM(s.why)}`);
}
P("");
