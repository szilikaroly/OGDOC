/**
 * MUNKALAP A KAPU MÖGÖTTI KALKULÁTOROK HITELESÍTÉSÉHEZ — a 8. lépés kimenete.
 *
 * Egy klinikai szakértő nem a repót fogja olvasni. Azt kell látnia, hogy a
 * KÓDBAN MILYEN SZÁMOK állnak, melyik közlemény melyik egyenletéhez tartoznak,
 * és mit kell tételesen kipipálnia.
 *
 * A munkalap KÖZLEMÉNYENKÉNT sorol, mert a hitelesítés így megy — és mert a
 * lépés kimondja: „nem egy ember mind a hétre”.
 *
 * Futtatás: `npm run kalkulator`
 */
import { CALCULATORS } from "../core/calc/defs.ts";
import {
  kalkAllapot, loadKalkHitelesitesek, loadOrokolt, orokoltAllas,
} from "../core/calc/hitelesites.ts";

const kat = loadKalkHitelesitesek("registry/kalkulatorok/hitelesitesek.json");
const orokolt = loadOrokolt("registry/kalkulatorok/orokolt.json");
const kapuMogott = CALCULATORS.filter((c) => !c.verified);
const allapotok = kalkAllapot(kapuMogott, kat);
const o = orokoltAllas(CALCULATORS, kat, orokolt);

const P = (...s: string[]) => console.log(s.join(""));

P("# Munkalap — a kapu mögötti kalkulátorok hitelesítése");
P("");
P(`*Generált: \`npm run kalkulator\`. ${o.kapuMogott} kalkulátor áll kapu mögött, `,
  `${o.alairt} aláírva. Öröklött (aláírás nélküli `,
  `\`verified\`) tétel: ${o.orokolt}.*`);
P("");

P("## Mit jelent itt a hitelesítés");
P("");
P("Nem azt, hogy a képlet szép. Azt, hogy a **kódban álló számok** ugyanazok,");
P("mint a közleményben — tételesen, számonként. Az aláírás ezért felsorolja,");
P("melyik konstanst vetették össze: **ami kimarad, arra nem terjed ki.**");
P("");
P("A lenyomat a képlet **magját** fedi: a függvény forrását, a bemeneteket");
P("**egységgel**, a kimenet egységét és a sávhatárokat. Az egység azért van");
P("benne, mert az eGFR függvénye µmol/L-t vár és 88,4-gyel oszt: ha a deklarált");
P("egység mg/dL-re változna a kód érintése nélkül, az eredmény **csendben");
P("88-szor téves** lenne.");
P("");

for (const a of allapotok) {
  const c = kapuMogott.find((x) => x.id === a.calc)!;
  P(`## \`${a.calc}\` — ${a.label}`);
  P("");
  P(`**Forrás:** ${c.source.cite}`);
  if (c.source.pmid) P(`  · PMID ${c.source.pmid}`);
  P("");
  P(`**Dokumentált képlet:** ${c.formula ?? "—"}`);
  P("");
  P("| Bemenet | Egység |");
  P("|---|---|");
  for (const i of c.inputs) P(`| \`${i.id}\` | ${i.unit ?? "—"} |`);
  P("");
  P(`**Összevetendő konstansok (${a.konstansok.length}):** `,
    a.konstansok.map((k) => `\`${k}\``).join(" · "));
  P("");

  if (a.elcsuszas.csakKodban.length || a.elcsuszas.csakProzaban.length) {
    P("**Elcsúszás-figyelő.** Nem minden eltérés hiba — az egységváltó tényező");
    P("és a sávhatár jogosan áll csak az egyik oldalon —, de itt a legolcsóbb");
    P("kideríteni egy elgépelt együtthatót:");
    P("");
    if (a.elcsuszas.csakKodban.length) {
      P(`- csak a **kódban**: ${a.elcsuszas.csakKodban.map((x) => `\`${x}\``).join(" · ")}`);
    }
    if (a.elcsuszas.csakProzaban.length) {
      P(`- csak a **leírásban**: ${a.elcsuszas.csakProzaban.map((x) => `\`${x}\``).join(" · ")}`);
    }
    P("");
  }

  for (const m of a.monoton) {
    P(`> ⚠ **NEM NÖVEKVŐ PONTSOR** (\`${m.komponens}\`): ${m.pontok.join(" → ")}`);
    P(">");
    P(`> ${m.miert}. Ha a közlemény tényleg így adja, az aláírás \`megjegyzes\``);
    P("> mezőjében ki kell mondani — enélkül nem derül ki, hogy észrevették-e.");
    P("");
  }

  if (c.verifiedNote) {
    P(`**Amit a definíció maga mond:** ${c.verifiedNote}`);
    P("");
  }
  P(`**Lenyomat:** \`${a.lenyomat}\``);
  P("");
}

P("## Hogyan kerül be az aláírás");
P("");
P("```json");
P("{");
P('  "calc": "calc.egfr.ckdepi2021",');
P('  "ki": "dr. Példa Pál",');
P('  "szerep": "nefrologus",');
P('  "mikor": "2026-09-25",');
P('  "lenyomat": "<a fenti Lenyomat>",');
P('  "forrasTabla": "Inker 2021, Table 1 — CKD-EPI 2021 creatinine equation",');
P('  "osszevetettKonstansok": ["142", "0.7", "0.241", "1.2", "0.9938", "1.012", "88.4", "1"]');
P("}");
P("```");
P("");
P("Az `osszevetettKonstansok` **minden** kódbeli számot fel kell soroljon —");
P("a validálás hiányzó tételnél **build-hibát** ad. Ez nem bürokrácia: egy");
P("„megnéztem\" önmagában nem ellenőrizhető állítás.");
P("");

P("## Az öröklött lista");
P("");
P(`${o.orokolt} kalkulátor **az aláírási réteg előtt** kapott \`verified\``);
P("jelölést. Nem állítjuk róluk, hogy alá vannak írva; azt sem, hogy");
P("hitelesítetlenek. Azt állítjuk, ami igaz: **a jelölésük mögött nincs");
P("megnevezett aláíró és nincs lenyomat.**");
P("");
P("Miért maradnak `verified`-ként: a visszavonásuk nem javítana semmit — 36");
P("működő számítás állna le anélkül, hogy egyetlen konstans is biztonságosabb");
P("lenne. **A kockázatot nem az elhallgatás csökkenti, hanem a megnevezés.**");
P("");
P("**A lista csak rövidülhet.** Új tétel nem kerülhet rá: aki mostantól ír egy");
P("kalkulátort, aláírással hitelesíti — a validálás ezt kikényszeríti.");
