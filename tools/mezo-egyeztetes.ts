/**
 * MEZŐEGYEZTETÉS — a forrásrendszer 1502 mezője és a saját regiszter között.
 *
 * Két kérdésre válaszol, és mindkettő a katalógus feltöltésének előfeltétele:
 *
 *   1. MELYIK forrásmezőnek VAN MÁR megfelelője a regiszterben — akár úgy is,
 *      hogy a felülettérkép még nem hivatkozik rá. Ezek a mezők nem
 *      fejlesztendők, hanem BEKÖTENDŐK; a különbség több száz tétel.
 *
 *   2. HOL VAN A REGISZTEREN BELÜL KÉT VÁLTOZÓ UGYANARRA. A rendszer huszonhat
 *      modulja külön-külön épült, és ahol két modul ugyanazt a fogalmat vette
 *      fel, ott ma két igazság van egy mérésről.
 *
 * A JAVASLAT NEM DÖNTÉS. Ez a szkript SORREND-et ad az emberi átnézéshez, nem
 * automatikus összevonást: egy gépi névhasonlóság alapján összevont két
 * klinikai fogalom pontosan az a néma hiba, ami ellen az egész rendszer épül.
 * A kimenet ezért JAVASLAT, megnevezett bizonyossággal és indoklással.
 *
 * Futtatás:  npm run egyeztet          (emberi olvasat)
 *            npm run egyeztet -- --json
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { loadUiMap } from "../core/ui/felulet.ts";
import type { VariableDef } from "../core/types.ts";

const JSON_OUT = process.argv.includes("--json");

/* ── NORMALIZÁLÁS ───────────────────────────────────────────────────── */

/** Ékezet le, kisbetű, zárójeles rész és mértékegység el. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[·•]/g, " ")
    .replace(/\b(mm|cm|mmol\/l|mg\/l|g\/dl|hgmm|iu\/l|ml|kg|db|%|hét|nap|perc|cel|°c)\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ragok nélküli tő — a magyar toldalékolás miatt a szóvég nem megbízható. */
function stem(w: string): string {
  return w.replace(/(nak|nek|ban|ben|ba|be|ra|re|on|en|ön|nal|nel|val|vel|ja|je|a|e|ok|ek|ak)$/, "");
}

const STOP = new Set(["a", "az", "es", "vagy", "of", "the", "van", "nincs", "sz",
  "adatok", "adat", "erteke", "ertek", "mezo", "vizsgalat", "eredmeny", "jeloloegyzet"]);

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ")
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem)
    .filter((w) => w.length >= 3));
}

/** Jaccard-hasonlóság a tokenkészleteken. */
function sim(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/* ── BETÖLTÉS ───────────────────────────────────────────────────────── */

const reg = loadRegistry("registry/variables");
const maps = readdirSync("registry/felulet")
  .filter((f) => f.endsWith("-felulet.json"))
  .map((f) => loadUiMap(join("registry/felulet", f)));

interface RegEntry { def: VariableDef; tok: Set<string>; label: string }
const regEntries: RegEntry[] = reg.all().map((d) => ({
  def: d,
  label: d.label?.hu ?? d.id,
  tok: tokens((d.label?.hu ?? "") + " " + d.id.replace(/\./g, " ")),
}));

/* ── 1. FORRÁSMEZŐ → REGISZTER ──────────────────────────────────────── */

type Confidence = "kotott" | "eros" | "gyenge" | "nincs";

interface FieldMatch {
  map: string;
  form: string;
  field: string;
  /** Amit a felülettérkép már kimond. */
  bound: string | null;
  best: { id: string; label: string; score: number } | null;
  confidence: Confidence;
  why: string;
}

const fieldMatches: FieldMatch[] = [];

for (const m of maps) {
  for (const form of m.forms) {
    for (const f of form.fields) {
      if (f.bound === undefined) { /* típusbővítés nélkül */ }
      const bound = f.variable ?? null;
      if (bound) {
        fieldMatches.push({
          map: m.id, form: form.id, field: f.label, bound,
          best: null, confidence: "kotott",
          why: `A térkép már ide köti: ${bound}.`,
        });
        continue;
      }
      const t = tokens(f.label);
      let best: FieldMatch["best"] = null;
      for (const r of regEntries) {
        const s = sim(t, r.tok);
        if (!best || s > best.score) best = { id: r.def.id, label: r.label, score: s };
      }
      const score = best?.score ?? 0;
      const confidence: Confidence =
        score >= 0.55 ? "eros" : score >= 0.34 ? "gyenge" : "nincs";
      fieldMatches.push({
        map: m.id, form: form.id, field: f.label, bound: null, best,
        confidence,
        why: confidence === "eros"
          ? `ERŐS JELÖLT: „${best!.label}” (${best!.id}), egyezés ${(score * 100) | 0}%. ` +
            `Valószínűleg NEM fejlesztendő, hanem BEKÖTENDŐ.`
          : confidence === "gyenge"
            ? `Gyenge jelölt: „${best!.label}” (${best!.id}), ${(score * 100) | 0}%. ` +
              `Emberi döntés kell — a névhasonlóság önmagában nem fogalmi azonosság.`
            : `Nincs érdemi jelölt a regiszterben. Ez valódi hiány.`,
      });
    }
  }
}

/* ── 2. A REGISZTEREN BELÜLI ISMÉTLŐDÉS ─────────────────────────────── */

interface DupePair {
  a: string; aLabel: string; aModule: string;
  b: string; bLabel: string; bModule: string;
  score: number;
  sameUnit: boolean | null;
  kind: "azonos-cimke" | "kozel-azonos";
  why: string;
}

const dupes: DupePair[] = [];
for (let i = 0; i < regEntries.length; i++) {
  for (let j = i + 1; j < regEntries.length; j++) {
    const A = regEntries[i], B = regEntries[j];
    const s = sim(A.tok, B.tok);
    if (s < 0.62) continue;
    const same = norm(A.label) === norm(B.label);
    const uA = A.def.unit ?? null, uB = B.def.unit ?? null;
    const sameUnit = uA && uB ? uA === uB : null;
    dupes.push({
      a: A.def.id, aLabel: A.label, aModule: A.def.module,
      b: B.def.id, bLabel: B.label, bModule: B.def.module,
      score: s, sameUnit, kind: same ? "azonos-cimke" : "kozel-azonos",
      why: same
        ? `BETŰRE AZONOS CÍMKE két változón (${A.def.module} és ${B.def.module}). ` +
          (sameUnit === false
            ? `A MÉRTÉKEGYSÉG VISZONT ELTÉR (${uA} vs ${uB}) — vagy a címke rossz, ` +
              `vagy az egység. Összevonás előtt ezt kell eldönteni.`
            : `Ha ugyanaz a fogalom, az egyiknek TÜKÖRNEK kell lennie, nem ` +
              `második definíciónak: két igazság egy mérésről.`)
        : `Közel azonos megnevezés (${(s * 100) | 0}%) két modulban ` +
          `(${A.def.module}, ${B.def.module}). Átnézendő: fogalmi azonosság vagy ` +
          `csak névrokonság?`,
    });
  }
}
dupes.sort((x, y) => y.score - x.score);

/* ── KIMENET ────────────────────────────────────────────────────────── */

const n = (c: Confidence) => fieldMatches.filter((f) => f.confidence === c).length;
const summary = {
  mezo: fieldMatches.length,
  kotott: n("kotott"),
  erosJelolt: n("eros"),
  gyengeJelolt: n("gyenge"),
  nincsJelolt: n("nincs"),
  valtozo: regEntries.length,
  ismetlodesPar: dupes.length,
  azonosCimke: dupes.filter((d) => d.kind === "azonos-cimke").length,
};

if (JSON_OUT) {
  console.log(JSON.stringify({ summary, fieldMatches, dupes }, null, 2));
} else {
  console.log("MEZŐEGYEZTETÉS\n");
  console.log(`Forrásmező összesen        ${summary.mezo}`);
  console.log(`  már bekötve              ${summary.kotott}`);
  console.log(`  ERŐS jelölt a regiszterben ${summary.erosJelolt}  ← bekötendő, nem fejlesztendő`);
  console.log(`  gyenge jelölt            ${summary.gyengeJelolt}  ← emberi döntés`);
  console.log(`  nincs jelölt             ${summary.nincsJelolt}  ← valódi hiány`);
  console.log(`\nRegiszterbeli változó      ${summary.valtozo}`);
  console.log(`  ismétlődés-gyanús pár    ${summary.ismetlodesPar}`);
  console.log(`  ebből BETŰRE AZONOS címke ${summary.azonosCimke}\n`);

  console.log("── AZONOS CÍMKÉJŰ VÁLTOZÓPÁROK (a legsürgősebb) ──");
  for (const d of dupes.filter((x) => x.kind === "azonos-cimke").slice(0, 30)) {
    console.log(`\n  „${d.aLabel}”`);
    console.log(`    ${d.a}  [${d.aModule}]`);
    console.log(`    ${d.b}  [${d.bModule}]`);
    console.log(`    ${d.why}`);
  }
  console.log("\n\n── ERŐS JELÖLTEK (bekötendő) — az első 25 ──");
  for (const f of fieldMatches.filter((x) => x.confidence === "eros").slice(0, 25)) {
    console.log(`  ${f.field.slice(0, 58).padEnd(58)} → ${f.best!.id}`);
  }
}
