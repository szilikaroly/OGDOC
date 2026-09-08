/**
 * DÖNTÉSI MUNKALAP — a 3. lépéshez, konzolon.
 *
 * Futtatás:
 *   npm run dontes             — mérleg és a nyitott szabályok, javaslattal
 *   npm run dontes -- --sablon <rule>   — kitöltendő döntés-sablon, lenyomattal
 *   npm run dontes -- --mezok <rule>    — melyik 29 mezőt érinti a szabály
 *   npm run dontes -- --szerep <szerep> — mi van rajtam: előkészítés és aláírás
 *
 * MIÉRT KELL A SABLON. Az aláírás a szabály normatív magjának LENYOMATÁHOZ
 * kötődik. Ezt kézzel kiszámolni nem lehet, és épp ezért nem is szabad kézzel
 * beírni: a sablon a mai szöveg lenyomatát adja, és ha a szöveg közben
 * megváltozik, a döntés elavulttá válik ahelyett, hogy csendben tovább élne.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { loadUiMap, auditFields } from "../core/ui/felulet.ts";
import {
  dontesAllapot, dontesStamp, dontendo, lenyomat, loadDontesek, loadSzabalyok,
  merleg, validateDontesek,
} from "../core/ui/dontes.ts";

const KAT = "registry/felulet/dontes-szabalyok.json";
const DONT = "registry/felulet/dontesek.json";

const reg = loadRegistry("registry/variables");
const audits = readdirSync("registry/felulet")
  .filter((f) => f.endsWith("-felulet.json"))
  .flatMap((f) => auditFields(loadUiMap(join("registry/felulet", f)), reg));

const kat = loadSzabalyok(KAT);
const dontesek = loadDontesek(DONT);
const allapot = dontesAllapot(audits, kat, dontesek);

const args = process.argv.slice(2);
const opt = (name: string): string | null => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? "") : null;
};

const P = (...s: string[]) => console.log(s.join(""));

const sablon = opt("--sablon");
if (sablon !== null) {
  const s = kat.szabalyok.find((x) => x.rule === sablon);
  if (!s) {
    console.error(`Nincs ilyen szabály: ${sablon}`);
    process.exit(1);
  }
  const n = allapot.filter((a) => a.rule === s.rule).length;
  P(`// ${s.cim} — ${n} mezőt érint`);
  P(`// Amit aláírnak: ${s.lenyeg}`);
  P(`// Gépi javaslat (NEM döntés): ${s.javaslat} — ${s.mit}`);
  P(JSON.stringify({
    rule: s.rule,
    fajta: s.javaslat,
    indoklas: "<egy mondat: miért ez a döntés>",
    ...(s.javaslat === "atalakitva" ? { atalakitas: s.mit } : {}),
    alairok: s.kell.map((r) => ({
      nev: `<${kat.szerepek[r] ?? r} neve>`, szerep: r, datum: "<YYYY-MM-DD>",
    })),
    lenyomat: lenyomat(s.lenyeg),
  }, null, 2));
  process.exit(0);
}

const mezok = opt("--mezok");
if (mezok !== null) {
  const rows = allapot.filter((a) => a.rule === mezok);
  if (!rows.length) {
    console.error(`Egy mező sem tartozik ide: ${mezok}`);
    process.exit(1);
  }
  for (const r of rows) P(`${r.status.padEnd(8)} ${r.form}\n         ${r.field}`);
  P("", `— ${rows.length} mező`);
  process.exit(0);
}

const szerep = opt("--szerep");
if (szerep !== null) {
  if (!kat.szerepek[szerep]) {
    console.error(`Nincs ilyen szerep: ${szerep}`);
    console.error(`Van: ${Object.keys(kat.szerepek).join(", ")}`);
    process.exit(1);
  }
  const nyitottE = (r: string) =>
    allapot.some((a) => a.rule === r && a.allapot !== "dontve");
  const db = (r: string) => allapot.filter((a) => a.rule === r).length;
  const sajat = kat.szabalyok.filter((s) => s.felelos === szerep);
  const alair = kat.szabalyok.filter((s) => s.kell.includes(szerep) && s.felelos !== szerep);

  P(`${kat.szerepek[szerep].toUpperCase()} — ami rajta van`);
  P("");
  P(`ELŐKÉSZÍTÉS (${sajat.filter((s) => nyitottE(s.rule)).length} nyitva ` +
    `${sajat.length}-ból)`);
  P("");
  for (const s of [...sajat].sort((a, b) => db(b.rule) - db(a.rule))) {
    P(`  ${nyitottE(s.rule) ? "☐" : "☑"} ${String(db(s.rule)).padStart(3)} mező  ` +
      `${s.rule} — ${s.cim}`);
    P(`             kell hozzá: ${s.kell.map((r) => kat.szerepek[r] ?? r).join(" + ")}`);
  }
  P("");
  P(`ALÁÍRÁS, MÁS ELŐKÉSZÍTÉSÉBEN (${alair.filter((s) => nyitottE(s.rule)).length} ` +
    `nyitva ${alair.length}-ból)`);
  P("");
  for (const s of [...alair].sort((a, b) => db(b.rule) - db(a.rule))) {
    P(`  ${nyitottE(s.rule) ? "☐" : "☑"} ${String(db(s.rule)).padStart(3)} mező  ` +
      `${s.rule} — ${s.cim}   (előkészíti: ${kat.szerepek[s.felelos] ?? s.felelos})`);
  }
  process.exit(0);
}

const m = merleg(allapot, kat);
P("A 326 SZABÁLY DÖNTÉSSÉ TÉTELE — 3. lépés");
P("");
P(dontesStamp(m));
P("");

const issues = validateDontesek(audits, kat, dontesek);
const hiba = issues.filter((i) => i.severity === "error");
if (issues.length) {
  P(`Ellenőrzés: ${hiba.length} hiba, ${issues.length - hiba.length} figyelmeztetés`);
  for (const i of issues) P(`  ${i.severity === "error" ? "HIBA" : "figy"}  ${i.id}: ${i.message}`);
  P("");
}

const perRule = new Map<string, number>();
for (const a of audits.filter(dontendo)) {
  perRule.set(a.rule, (perRule.get(a.rule) ?? 0) + 1);
}
const nyitott = kat.szabalyok
  .map((s) => ({
    s,
    n: perRule.get(s.rule) ?? 0,
    allapot: allapot.find((a) => a.rule === s.rule)?.allapot ?? "eldontetlen",
  }))
  .filter((x) => x.allapot !== "dontve")
  .sort((a, b) => b.n - a.n);

P(`NYITOTT SZABÁLYOK (${nyitott.length}) — a legtöbb mezőt érintő elöl`);
P("");
for (const { s, n, allapot: st } of nyitott) {
  P(`${String(n).padStart(4)} mező  ${s.rule}${st === "dontve" ? "" : `  [${st}]`}`);
  P(`           ${s.cim} · kell: ${s.kell.map((r) => kat.szerepek[r] ?? r).join(" + ")}`);
  P(`           javaslat: ${s.javaslat} — ${s.mit}`);
  P("");
}
P("Sablon egy szabályhoz:  npm run dontes -- --sablon <rule>");
P("Érintett mezők:         npm run dontes -- --mezok <rule>");
P("Mi van rajtam:          npm run dontes -- --szerep " +
  Object.keys(kat.szerepek).join(" | "));
P("Teljes allokáció:       docs/fejlesztes/37-dontes-allokacio.md");

process.exit(hiba.length ? 1 : 0);
