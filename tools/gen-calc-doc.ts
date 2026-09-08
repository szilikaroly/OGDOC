/**
 * A kalkulátor-fejezet generálása a definíciókból.
 *
 *   node tools/gen-calc-doc.ts > docs/fejlesztes/07-kalkulatorok.md
 *
 * Kézzel írt kalkulátor-doksi NINCS: ha a képlet változik, a doksi vele változik.
 * A CI ellenőrzi, hogy a lementett fájl egyezik-e a generálttal.
 */
import { loadRegistry } from "../core/load.ts";
import { CALCULATORS } from "../core/calc/defs.ts";
import { validateCalculators } from "../core/calc/run.ts";
import type { CalcDef } from "../core/calc/types.ts";

const reg = loadRegistry("registry/variables");
const consumersOf = new Map<string, string[]>();
for (const d of reg.all()) {
  if (d.derivation?.kind === "computed") {
    consumersOf.set(d.derivation.calc, [...(consumersOf.get(d.derivation.calc) ?? []), d.id]);
  }
}

const L = (x: Record<string, string | undefined> | undefined) => x?.hu ?? x?.en ?? "";
const out: string[] = [];
const p = (s = "") => out.push(s);

p("# 07 — Kalkulátorok, tételesen");
p();
p("> **Ez a fájl generált.** Forrása a `core/calc/defs.ts`; a `node tools/gen-calc-doc.ts`");
p("> állítja elő, és a CI ellenőrzi, hogy egyezik-e. Kézzel ne szerkeszd — a képletet");
p("> a definícióban javítsd, és generáltasd újra.");
p();

const verified = CALCULATORS.filter((c) => c.verified);
const gated = CALCULATORS.filter((c) => !c.verified);

p("## Áttekintés");
p();
p(`**${CALCULATORS.length} kalkulátor**, ebből **${verified.length} használható** és `
  + `**${gated.length} kapu mögött** áll.`);
p();
p("| Azonosító | Név | Típus | Modul | Eredmény | Állapot |");
p("|---|---|---|---|---|---|");
for (const c of [...CALCULATORS].sort((a, b) => a.id.localeCompare(b.id))) {
  p(`| \`${c.id}\` | ${L(c.label)} | ${c.kind} | ${c.module} | ${c.output.unit ?? "—"} `
    + `| ${c.verified ? "használható" : "**kapu mögött**"} |`);
}
p();

p("## A két kapu");
p();
p("Minden kalkulátor ugyanazon a futtatón (`runCalc`) megy át, és ott két szabály érvényes,");
p("amit egyik képlet sem tud megkerülni:");
p();
p("1. **Hiányzó vagy lejárt bemenet** → nincs eredmény, hanem a hiányzók felsorolása.");
p("   A lejárt érték ugyanúgy hiányzik, mint a nem létező: egy tegnapi SpO₂ ma nem bemenet.");
p("2. **Ellenőrizetlen konstans** → nincs eredmény, teljes bemenettel sem.");
p();
p("A második szabály nem elméleti. A fullPIERS dokumentált együtthatóival a modell");
p("klinikailag fordítva viselkedik: a súlyosabb beteg kap alacsonyabb kockázatot.");
p("Ha akkor nem lett volna kapu, a rendszer megnyugtató számot mutatott volna");
p("egy súlyos HELLP-esetre.");
p();

function section(c: CalcDef): void {
  p(`### \`${c.id}\` — ${L(c.label)}`);
  p();
  p("| | |");
  p("|---|---|");
  p(`| **Típus** | ${c.kind} |`);
  p(`| **Modul** | ${c.module} |`);
  p(`| **Eredmény** | ${c.output.unit ?? "—"}${c.output.digits != null ? `, ${c.output.digits} tizedes` : ""} |`);
  p(`| **Állapot** | ${c.verified ? "✅ használható" : "⛔ **kapu mögött — nem ad eredményt**"} |`);
  const cons = consumersOf.get(c.id) ?? [];
  p(`| **Melyik változót tölti** | ${cons.length ? cons.map((x) => `\`${x}\``).join(" · ") : "—"} |`);
  p();
  p("**Képlet**");
  p();
  p("```");
  p(c.formula);
  p("```");
  p();
  p("**Bemenetek**");
  p();
  p("| Változó | Egység | Kötelező | Megjegyzés |");
  p("|---|---|---|---|");
  for (const i of c.inputs) {
    const d = reg.get(i.id);
    p(`| \`${i.id}\` | ${i.unit ?? d?.unit ?? "—"} | ${i.required === false ? "nem" : "igen"} `
      + `| ${L(i.note) || (d ? L(d.documentation.definition) : "**nincs a regiszterben**")} |`);
  }
  p();
  if (c.output.bands?.length) {
    p("**Eredménysávok**");
    p();
    p("| Sáv | Olvasat | Súlyosság |");
    p("|---|---|---|");
    for (const b of c.output.bands) {
      const lo = b.min == null ? "" : `${b.min} ≤ `;
      const hi = b.max == null ? "" : ` < ${b.max}`;
      p(`| ${lo}x${hi} | ${L(b.label)} | ${b.severity ?? "—"} |`);
    }
    p();
  }
  p(`**Forrás** — ${c.source.cite}`
    + (c.source.pmid ? ` · PMID ${c.source.pmid}` : "")
    + (c.source.doi ? ` · doi:${c.source.doi}` : ""));
  p();
  if (c.verifiedNote) {
    p(`**${c.verified ? "Ellenőrzés" : "Miért áll kapu mögött"}** — ${c.verifiedNote}`);
    p();
  }
  if (c.caveats) {
    p(`> **Amit tudni kell** — ${L(c.caveats)}`);
    p();
  }
  p("---");
  p();
}

p("## Használható kalkulátorok");
p();
for (const c of verified.sort((a, b) => a.id.localeCompare(b.id))) section(c);

p("## Kapu mögött álló kalkulátorok");
p();
p("Ezek **teljes bemenettel sem adnak eredményt**. A kapu feloldásához valakinek össze");
p("kell vetnie a konstansokat az elsődleges forrással, és a `verified` jelölést a");
p("`verifiedNote`-tal együtt át kell állítania.");
p();
for (const c of gated.sort((a, b) => a.id.localeCompare(b.id))) section(c);

const issues = validateCalculators(reg).filter((i) => !i.id.startsWith("calc.test."));
p("## Build-ellenőrzés");
p();
p("A `validateCalculators(reg)` a következőt kényszeríti ki minden buildnél:");
p();
p("- a használt kalkulátorok minden bemenete létezik a regiszterben;");
p("- az egységek **pontosan** egyeznek — az eltérés némán rossz eredményt adna, ezért hiba;");
p("- minden kalkulátornak van elsődleges forrása és emberi olvasatú képlete;");
p("- a kapuzott kalkulátornak van indoklása;");
p("- a be nem kötött kalkulátor figyelmeztetést kap (holt kód, ami észrevétlenül elavul).");
p();
p(issues.length
  ? `Jelenlegi állapot: **${issues.length} nyitott tétel**.`
  : "Jelenlegi állapot: **0 hiba, 0 figyelmeztetés**.");
p();

console.log(out.join("\n"));
