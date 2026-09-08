/**
 * HBCS BESOROLÁS — futtatható minta.
 *
 *   npm run demo:besorolas
 *
 * A 18 lépés 2. lépése működés közben. Amit megmutat:
 *
 *   · hogy egy szülés melyik csoportokba eshet, és MIÉRT;
 *   · hogy a besorolás JELÖLTEKET ad, nem végszót;
 *   · és hogy hol mondja azt, hogy NEM TUDOM — a szabály szó szerinti
 *     idézésével, mert a félreértett szabály rossz elszámolást ad.
 *
 * MINDEN ADAT SZINTETIKUS.
 */
import {
  besorol, elemzesiLefedettseg, ertekelCsoport, loadBesorolas, type Eset,
} from "../core/finanszirozas/besorolas.ts";
import { hbcsValue } from "../core/coding/finance.ts";
import { loadCodeTables } from "../core/coding/tables.ts";

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const DIM = (s: string) => `\x1b[2m${s}\x1b[0m`;
const OK = (s: string) => `\x1b[32m${s}\x1b[0m`;
const WARN = (s: string) => `\x1b[33m${s}\x1b[0m`;

function h(n: string, t: string): void {
  console.log(`\n${B(n + "  " + t)}\n${"─".repeat(t.length + n.length + 2)}`);
}
function wrap(text: string, indent = "    ", width = 76): string {
  const w = text.replace(/\s+/g, " ").trim().split(" ");
  const out: string[] = [];
  let cur = "";
  for (const x of w) {
    if (cur && cur.length + x.length + 1 > width) { out.push(cur); cur = x; }
    else cur = cur ? `${cur} ${x}` : x;
  }
  if (cur) out.push(cur);
  return out.map((l) => indent + l).join("\n");
}

loadCodeTables("registry/kodok/tablak");     // a súlyszámtáblához
const T = loadBesorolas("registry/finanszirozas/hbcs-besorolas.json");

/* ══ 1. A TÁBLA ═══════════════════════════════════════════════════════ */

h("1.", "A besorolási táblázat");
console.log(`  forrás:  ${T.source.cite.slice(0, 68)}`);
console.log(`  fájl:    ${T.source.file}`);
console.log(`  lenyomat: ${DIM(T.source.sha256.slice(0, 32) + "…")}`);
console.log(`  hatály:  ${T.validFrom}`);
const kodok = Object.values(T.csoportok)
  .reduce((n, c) => n + c.blokkok.reduce((m, b) => m + b.kodok.length, 0), 0)
  + Object.values(T.focsoportok)
    .reduce((n, f) => n + Object.values(f.kozosBlokkok)
      .reduce((m, b) => m + b.kodok.length, 0), 0);
console.log(`\n  ${B(String(Object.keys(T.focsoportok).length))} főcsoport · ${
  B(String(Object.keys(T.csoportok).length))} HBCS-csoport · ${
  B(String(kodok))} kódhivatkozás`);
console.log(DIM(`\n  A kódok NEVE nincs itt: az a tbl.bno és a tbl.mut táblákban él,`));
console.log(DIM(`  amelyek már a repóban vannak. Egy fogalom, egy lista.`));

/* ══ 2. EGY SZÜLÉS ════════════════════════════════════════════════════ */

h("2.", "Egy szülés besorolása");

const esetek: Array<[string, Eset]> = [
  ["spontán hüvelyi szülés", { diagnozisok: ["O8000"], beavatkozasok: [] }],
  ["…epidurális érzéstelenítéssel", { diagnozisok: ["O8000"], beavatkozasok: ["8888F"] }],
  ["…vákuumextrakcióval", { diagnozisok: ["O8000"], beavatkozasok: ["57010"] }],
  ["császármetszés", { diagnozisok: ["O8200"], beavatkozasok: ["57400"] }],
  ["nagy rizikójú szülés (praeeclampsia)", { diagnozisok: ["O8000", "O1400"], beavatkozasok: [] }],
];

for (const [nev, e] of esetek) {
  const r = besorol(T, e, "14");
  console.log(`\n  ${B(nev)}  ${DIM(`[${e.diagnozisok.join(" ")}${
    e.beavatkozasok.length ? " · " + e.beavatkozasok.join(" ") : ""}]`)}`);
  const rangsor = r.talalatok
    .map((x) => ({ ...x, s: hbcsValue(x.kod, 3)?.sulyszam ?? 0 }))
    .sort((a, b) => b.s - a.s);
  for (const x of rangsor) {
    console.log(`    ${OK("✓")} ${x.kod}  ${x.label.padEnd(46)}${
      x.s ? DIM(`súlyszám ${x.s.toFixed(3)}`) : ""}`);
    console.log(`       ${DIM("mert: " + x.miert.slice(0, 62))}`);
  }
  if (!rangsor.length) console.log(`    ${WARN("—")} nincs találat`);
}

console.log(DIM(`\n  TÖBB TALÁLAT A HELYES VÁLASZ. A besorolás JELÖLTEKET ad; a`));
console.log(DIM(`  választás elszámolási szabályokat kíván (legmagasabb súlyszám,`));
console.log(DIM(`  csillagos csoport intézeti jogosultsága, összevonás) — részben`));
console.log(DIM(`  intézményi adattal. A rangsor elrendez, nem dönt.`));

/* ══ 3. AHOL AZT MONDJA: NEM TUDOM ════════════════════════════════════ */

h("3.", "Ahol azt mondja: nem tudom");

const üres: Eset = { diagnozisok: [], beavatkozasok: [] };
const nem = Object.keys(T.csoportok)
  .map((k) => ertekelCsoport(T, k, üres))
  .filter((x) => x.allapot === "nem értékelhető");

for (const x of nem.slice(0, 3)) {
  console.log(`  ${WARN("○")} ${x.kod}  ${x.label.slice(0, 56)}`);
  console.log(DIM(wrap(x.miert, "      ")));
  if (x.akadaly) console.log(DIM(wrap("a szabály szó szerint: " + x.akadaly, "      ")));
  console.log();
}

const lf = elemzesiLefedettseg(T);
console.log(`  ${B(`${lf.elemzett}/${lf.osszes}`)} csoport szabálya értékelhető ki géppel (${lf.szazalek}%).`);
console.log(DIM(`\n  A maradék a rendelet olyan feltételeit használja, amikhez a mai`));
console.log(DIM(`  adatmodell nem ad adatot: „a szülést közvetlenül megelőzően 12`));
console.log(DIM(`  napnál hosszabb ápolás”, „a felvételtől számított 4,5 órán belül”,`));
console.log(DIM(`  „3 különböző beavatkozás körből legalább egy-egy vizsgálat”.`));
console.log(DIM(`\n  Ezekre a rendszer NEM ad besorolást — mert a félreértett szabály`));
console.log(DIM(`  rossz finanszírozási tételt ad, és azt évekkel később kell`));
console.log(DIM(`  megvédeni. A harmadik állapot nélkül mindegyik csendben`));
console.log(DIM(`  „nem teljesül” lenne.`));

console.log(`\n${DIM("Minden adat szintetikus.")}`);
