/**
 * MUNKALAP A NORMOGRAMOK TELEPÍTÉSÉHEZ ÉS HITELESÍTÉSÉHEZ — a 7. lépés kimenete.
 *
 * Két különböző munka, két különböző emberrel, és a munkalap ezért két
 * részből áll:
 *
 *   TELEPÍTÉS — 265 katalogizált görbéből melyiket töltsük be, milyen
 *   sorrendben. Ez levezethető, és itt le is van vezetve.
 *
 *   HITELESÍTÉS — a betöltött görbe számainak összevetése a közleménnyel,
 *   FMF-engedélyszámmal aláírva. Ez nem vezethető le; ez aláírás.
 *
 * Futtatás: `npm run normogram`
 */
import { readFileSync } from "node:fs";
import { loadRegistry } from "../core/load.ts";
import { loadChartCatalogue, chartsFor } from "../core/us/katalogus.ts";
import { loadNormograms } from "../core/us/normogram.ts";
import { loadNormogramHitelesitesek, ngAllapot } from "../core/us/hitelesites.ts";
import { elsoKor, telepitesiSorrend, telepitesMerleg } from "../core/us/telepites.ts";

const reg = loadRegistry("registry/variables");
const cat = loadChartCatalogue("registry/normogramok/katalogus.json");
const norm = loadNormograms("registry/normogramok");
const hit = loadNormogramHitelesitesek("registry/normogramok/hitelesitesek.json");
const lekepezes = (JSON.parse(
  readFileSync("registry/normogramok/lekepezes.json", "utf8"),
) as { kotesek: Record<string, string>; nemKotott: { okok: Record<string, string> } });

const sorrend = telepitesiSorrend(cat, norm.all(), lekepezes.kotesek, reg);
const m = telepitesMerleg(sorrend);
const allapotok = ngAllapot(norm.all(), hit);

const P = (...s: string[]) => console.log(s.join(""));

P("# Munkalap — normogramok telepítése és hitelesítése");
P("");
P(`*Generált: \`npm run normogram\`. ${m.gorbek} katalogizált görbe `,
  `${m.meresek} mérésre · ${m.kotott} mérés van a regiszter változójához kötve · `,
  `${norm.all().length} tábla betöltve · `,
  `${allapotok.filter((a) => a.allapot === "hitelesitve").length} hitelesítve.*`);
P("");

P("## Miért nem a katalógus sorrendje a sorrend");
P("");
P("A katalógus egy MÁSIK rendszer szokását írja le: azt, hogy ott mit vesznek");
P("elő naponta. Ez gyenge jel — szokás, nem bizonyíték —, ezért kis súllyal");
P("szerepel. A rangsort az dönti el, hogy **nálunk mire mutat hivatkozás**:");
P("regiszterbeli változó, arra épülő levezetés, vagy egy másik görbe alapja.");
P("");
P("Egy görbe, amire nálunk semmi nem mutat, nem sürgős — akármilyen gyakori.");
P("");

P("## Első kör — a javasolt tíz");
P("");
P("| # | Mérés | Változó | Görbék | Konvenciófüggő | Van ikergörbe | Pont |");
P("|---:|---|---|---:|---|---|---:|");
elsoKor(sorrend).forEach((t, i) => {
  P(`| ${i + 1} | ${t.base} | \`${t.variable}\` | ${t.katalogizalt} | `,
    `${t.konvenciofuggo ? `**IGEN** (${t.jeloletlenKonvencio} jelöletlen)` : "nem"} | `,
    `${t.vanIker ? "igen" : "**NINCS**"} | ${t.pont} |`);
});
P("");

const konv = sorrend.filter((t) => t.konvenciofuggo && t.variable);
if (konv.length) {
  P("### A konvenciófüggő mérés külön eljárás");
  P("");
  for (const t of konv) {
    const k = new Set(chartsFor(cat, t.base).map((c) => c.convention).filter(Boolean));
    P(`**${t.base}** — ${[...k].join(" és ")} konvencióval is publikáltak, `,
      `és ${t.jeloletlenKonvencio} katalógustétel nem jelöli, melyikkel.`);
  }
  P("");
  P("Itt a görbe kiválasztása **önmagában nem elég**: tudni kell, hogyan mér az");
  P("a készülék, amelyik a mi adatunkat adja. A különbség néhány milliméter —");
  P("a 3. trimeszterben egy percentilis sáv —, és **mindig ugyanabba az irányba**");
  P("téved. Ezért az aláírásnak a konvenciót is meg kell neveznie; enélkül a");
  P("validálás **build-hibát** ad.");
  P("");
}

const ikerNelkul = elsoKor(sorrend).filter((t) => !t.vanIker);
if (ikerNelkul.length) {
  P("### Amire nincs ikergörbe");
  P("");
  P(`Az első körből ${ikerNelkul.length} mérésre a katalógus **egyetlen ikergörbét `,
    `sem ismer**: ${ikerNelkul.map((t) => t.base).join(", ")}.`);
  P("");
  P("Ez nem a telepítés hibája, hanem a katalógusé — de a következménye a mi");
  P("oldalunkon jelentkezik: ikerterhességben ezekre a mérésekre **nem lesz**");
  P("olvasható percentilis. A `pick()` ilyenkor `undetermined`-et ad, nem");
  P("egyes magzat görbéjét — és ez a helyes viselkedés, nem hiányosság.");
  P("");
}

P("## Ami leképezetlen — és miért");
P("");
P(`${m.meresek - m.kotott} mérés nincs a regiszter változójához kötve. Ezek `,
  "nem tévedésből maradtak ki:");
P("");
P("| Csoport | Miért |");
P("|---|---|");
for (const [csoport, ok] of Object.entries(lekepezes.nemKotott.okok)) {
  P(`| \`${csoport}\` | ${ok} |`);
}
P("");

P("## Hitelesítés — a betöltött táblák");
P("");
P("| Görbe | Mérés | Sorok | Állapot | Lenyomat |");
P("|---|---|---:|---|---|");
for (const a of allapotok) {
  const all = a.allapot === "hitelesitve" ? `✓ ${a.alairo}`
    : a.allapot === "helyi" ? "helyi (nem aláírás tárgya)"
    : a.allapot === "elavult" ? "**ELAVULT**" : "aláíratlan";
  P(`| \`${a.normogram}\` | \`${a.parameter}\` | ${a.sorok} | ${all} | \`${a.lenyomat}\` |`);
}
P("");
P("Az aláírás a `registry/normogramok/hitelesitesek.json`-ba kerül:");
P("");
P("```json");
P("{");
P('  "normogram": "ng.chitty.ac",');
P('  "ki": "dr. Példa Péter",');
P('  "kepesites": "FMF 123456",');
P('  "mikor": "2026-09-20",');
P('  "lenyomat": "<a fenti Lenyomat oszlopból>",');
P('  "forrasTabla": "Chitty 1994, Table 2",');
P('  "konvencio": "outerInner"');
P("}");
P("```");
P("");
P("A `kepesites` nem formaság: a magzati biometriánál a **mérési technika** is");
P("a hitelesítés tárgya. Egy hibátlan görbe rossz technikával mért adaton");
P("ugyanúgy téved — csak épp úgy néz ki, mintha nem.");
