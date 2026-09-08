/**
 * A mezőkatalógus generálása a regiszterből.
 *
 *   node tools/gen-field-catalog.ts > docs/fejlesztes/05-mezokatalogus.md
 *
 * A bevezető konvenciók kézzel írtak (itt, a generátorban); a KATALÓGUS maga
 * a regiszterből jön. 47 mezőnél a kézi lista is menne — 4000-nél nem, és a
 * kettőnek ugyanaz az eljárása kell legyen.
 */
import { loadRegistry } from "../core/load.ts";
import { DerivationGraph } from "../core/derive/graph.ts";
import { CALC_BY_ID } from "../core/calc/defs.ts";

const reg = loadRegistry("registry/variables");
const g = new DerivationGraph(reg);
const out: string[] = [];
const p = (s = "") => out.push(s);
const esc = (s: string) => s.replace(/\|/g, "\\|");

p(`# 05 — Mezőkatalógus

> **A katalógus-rész generált.** Forrása a \`registry/variables/\`; a
> \`node tools/gen-field-catalog.ts\` állítja elő. A konvenciók kézzel írtak.

## 1. Névadás

\`\`\`
   domén . alcsoport . mező [. minősítő]
   ─────   ─────────   ────   ─────────
   vitals .  bp      . systolic
   exam   .  cervix  . dilation
   anthro .  weight  . prepregnancy
   hx     .  sys     . asthma
\`\`\`

| Előtag | Mit tartalmaz |
|---|---|
| \`patient.\` | a beteg azonosító és demográfiai adatai — **jellemzően \`phi\`** |
| \`ctx.\` | az eset kontextusa: terhességi kor, dátumok, ellátási helyzet |
| \`anthro.\` | antropometria |
| \`vitals.\` | vitális paraméterek |
| \`hx.\` | anamnézis (\`hx.sys\` szervrendszeri, \`hx.surg\` műtéti, \`hx.obs\` szülészeti) |
| \`sym.\` | panaszok, tünetek |
| \`exam.\` | fizikális vizsgálati leletek |
| \`lab.\` | laboratóriumi eredmények |
| \`us.\` | ultrahangos mérések |
| \`ekg.\` | EKG-paraméterek |
| \`nb.\` | újszülött |
| \`score.\` | score-ok és megjelenítő tükreik |
| \`rule.\` | levezetett szabályértékek, kapuk |

**Az azonosító soha nem változik.** Ha a jelentés változik, a \`version\` nő; ha a
mező megszűnik, \`status: "deprecated"\` lesz, de az azonosító marad — a történeti
adat rá hivatkozik.

## 2. Kötelező tulajdonságok típusonként

| \`datatype\` | Kötelező még | Build elszáll, ha hiányzik |
|---|---|:--:|
| \`quantity\` | \`unit\` (UCUM), \`domain\` | figyelmeztetés |
| \`coded\`, \`coded-multi\` | \`valueSet\` | **igen** |
| \`tristate\` | \`valueSet\` \`unknown\` jelöléssel | — |
| \`bool\` | — | — |
| \`date\`, \`datetime\` | — | — |
| \`text\` | feloldás vagy indoklás (ld. 06) | — |
| mind | \`documentation.definition\` | **igen** |

## 3. Négy döntés minden új mezőnél

1. **\`bool\` vagy \`tristate\`?** Ha a „nem tudom" információ — és anamnesztikus
   kérdésnél mindig az —, akkor \`tristate\`.
2. **Van már ilyen mező?** Ha igen, \`aliasOf\`. Két primer változó azonos
   LOINC-kóddal **build-hiba**.
3. **\`series\` vagy \`one\`?** Ha időben ismétlődik (vitálisok, laborok), \`series\`,
   és kell hozzá \`validity\` ablak kontextusonként.
4. **\`phi\`?** Kétség esetén igen. A fölösleges jelölés kényelmetlen, a hiányzó jogsértő.

## 4. A tartományok három szintje

| Szint | Mit jelent | Mit tesz a rendszer |
|---|---|---|
| \`domain.min\`/\`max\` | fizikailag lehetetlen | **elutasítja az írást** |
| \`domain.plausible\` | szokatlan, de lehetséges | visszakérdez, elfogadja |
| \`domain.critical\` | azonnali klinikai jelzés | jelöli, riaszt |

A három összemosása gyakori hiba. A \`min\`/\`max\` **nem** a normáltartomány: ha
kizárja a valós beteget, adatvesztést okoz, mert a klinikus máshova írja be.

---

## 5. A katalógus
`);

const modules = [...new Set(reg.all().map((d) => d.module))].sort();
const total = reg.all().length;
const phi = reg.all().filter((d) => d.phi).length;
const derived = reg.all().filter((d) => d.derivation?.kind === "computed").length;
const prefill = reg.all().filter((d) => d.derivation?.kind === "prefill").length;
const mirror = reg.all().filter((d) => d.aliasOf).length;
const free = reg.all().filter((d) => d.datatype === "text").length;

p();
p(`**${total} változó**, ${modules.length} modulban.`);
p();
p("| Jellemző | Darab | Arány |");
p("|---|---:|---:|");
for (const [name, n] of [
  ["levezetett (`computed`)", derived], ["előtöltött (`prefill`)", prefill],
  ["tükör (`aliasOf`)", mirror], ["beteg-azonosító (`phi`)", phi],
  ["szabad szöveg (`text`)", free],
] as Array<[string, number]>) {
  p(`| ${name} | ${n} | ${((n / total) * 100).toFixed(0)}% |`);
}
p();
p(`A szabad szöveges mezők aránya **${((free / total) * 100).toFixed(0)}%** — a `
  + "`docs/11-strukturalt-adat.md` célja legfeljebb 10%.");
p();

for (const m of modules) {
  const defs = reg.all().filter((d) => d.module === m).sort((a, b) => a.id.localeCompare(b.id));
  p(`### \`${m}\` — ${defs.length} mező`);
  p();
  p("| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |");
  p("|---|---|---|---|---|---|---|---|");
  for (const d of defs) {
    const dom = d.domain
      ? [d.domain.min, d.domain.max].filter((x) => x != null).join("–") || "—"
      : d.valueSet?.length ? `${d.valueSet.length} kód` : "—";
    let der = "—";
    if (d.aliasOf) der = `tükör: \`${d.aliasOf}\``;
    else if (d.derivation?.kind === "computed") {
      const c = CALC_BY_ID.get(d.derivation.calc);
      der = `\`${d.derivation.calc}\`${c && !c.verified ? " ⛔" : ""}`;
    } else if (d.derivation?.kind === "prefill") {
      der = `előtöltés: ${d.derivation.from.map((f) => f.policy).join("/")}`;
    }
    const cons = g.consumersOf(d.id);
    const flags = [d.phi ? "`phi`" : "", d.audit ? "`audit`" : "",
      d.cardinality === "series" ? "sorozat" : ""].filter(Boolean).join(" ");
    p(`| \`${d.id}\` | ${esc(d.label.hu ?? "")} | ${d.datatype} | ${d.unit ?? "—"} `
      + `| ${dom} | ${der} | ${cons.length ? cons.map((x) => `\`${x}\``).join(" ") : "—"} `
      + `| ${flags || "—"} |`);
  }
  p();
}

p("---");
p();
p("## 6. Lefedettség");
p();
p(`A tervezett **~4035** változóból **${total}** van meg (${((total / 4035) * 100).toFixed(1)}%).`);
p("Ez szándékos: a mag **helyességét** bizonyítja, nem a lefedettséget. A hiányzó");
p("mezők felvétele mechanikus munka, amihez a `04-modul-csontvaz.md` adja az eljárást.");
p();
p("A legutóbbi 14 mező felvételét **nem terv, hanem a kalkulátor-validátor kényszerítette ki**:");
p("a `validateCalculators` kimutatta, hogy a definiált képletek olyan változókra hivatkoznak,");
p("amik nincsenek a regiszterben. Ez a helyes irány — a képlet mondja meg, milyen mező kell,");
p("nem fordítva.");

console.log(out.join("\n"));
