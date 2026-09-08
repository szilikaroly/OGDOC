/**
 * DÖNTÉSI ALLOKÁCIÓ — ki mit visz, és kikkel kell egy asztalhoz ülnie.
 *
 * Generált dokumentum: `npm run docs`. Minden szám és minden név a
 * `registry/felulet/dontes-szabalyok.json`-ból jön — egy kézzel karbantartott
 * feladatlista két hét alatt elszakad a katalógustól.
 *
 * A LISTA HÁROM METSZETE, mert három kérdésre kell válaszolnia:
 *   1. „Mi van rajtam?"        — szerepenként, a felelős szerint
 *   2. „Kikkel kell leülnöm?"  — az aláírók halmaza szerint: hány ülés kell
 *   3. „Mi a sorrend?"         — mezőszám szerint, mert a nagy tételek húznak
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { auditFields, loadUiMap } from "../core/ui/felulet.ts";
import {
  dontendo, dontesAllapot, loadDontesek, loadSzabalyok,
} from "../core/ui/dontes.ts";
import type { SzabalyDef } from "../core/ui/dontes.ts";

const reg = loadRegistry("registry/variables");
const audits = readdirSync("registry/felulet")
  .filter((f) => f.endsWith("-felulet.json"))
  .flatMap((f) => auditFields(loadUiMap(join("registry/felulet", f)), reg));

const kat = loadSzabalyok("registry/felulet/dontes-szabalyok.json");
const dontesek = loadDontesek("registry/felulet/dontesek.json");
const allapot = dontesAllapot(audits, kat, dontesek);

const ALLAPOT_HU: Record<string, string> = {
  dontve: "eldöntve", eldontetlen: "nyitva",
  elavult: "elavult aláírás", hianyos: "hiányos aláírás",
};
const FAJTA_HU: Record<string, string> = {
  atvesszuk: "átvesszük", atalakitva: "átalakítva", nem: "nem vesszük át",
};

const mezoszam = new Map<string, number>();
for (const a of audits.filter(dontendo)) {
  mezoszam.set(a.rule, (mezoszam.get(a.rule) ?? 0) + 1);
}
const N = (s: SzabalyDef) => mezoszam.get(s.rule) ?? 0;
const ALL = (s: SzabalyDef) =>
  ALLAPOT_HU[allapot.find((x) => x.rule === s.rule)?.allapot ?? "eldontetlen"];
const SZ = (r: string) => kat.szerepek[r] ?? r;
const nagyElol = (a: SzabalyDef, b: SzabalyDef) => N(b) - N(a) || a.rule.localeCompare(b.rule);

const P = (...s: string[]) => console.log(s.join(""));
const osszes = kat.szabalyok.reduce((n, s) => n + N(s), 0);
const nyitva = kat.szabalyok.filter((s) => ALL(s) !== "eldöntve");
const nyitottMezo = nyitva.reduce((n, s) => n + N(s), 0);

P("# 37 — Döntési allokáció: ki mit visz");
P("");
P("*Generált dokumentum: `npm run docs`. A [3. lépés](../13-18-lepes.md) ",
  "feladatlistája szerepekre bontva — egy kézzel karbantartott lista két hét ",
  "alatt elszakad a katalógustól.*");
P("");
P("---");
P("");
P("## A mérleg");
P("");
P("| | |");
P("|---|---:|");
P(`| döntendő mező | **${osszes}** |`);
P(`| mögöttük szabály | **${kat.szabalyok.length}** |`);
P(`| ebből nyitva | **${nyitva.length}** szabály · ${nyitottMezo} mező |`);
P(`| aláírt szabály | **${kat.szabalyok.length - nyitva.length}** |`);
P("");
P("A döntés **szabályszintű**: egy aláírás a szabály minden mezőjére szól. ",
  "Ahol egy mező eltér a szabályától, ott mezőszintű eltérést írnak alá — ",
  "az nem ennek a listának a tétele, hanem az ülés jegyzőkönyvéé.");
P("");

/* ── 1. SZEREPENKÉNT ────────────────────────────────────────────────── */

P("---");
P("");
P("## 1. Mi van rajtam — szerepenként");
P("");
P("A **felelős** viszi a javaslatot az ülésre. Nem ő dönt egyedül: a „kell ",
  "hozzá” oszlop minden szerepének aláírása kell. Egy felelős nélküli tétel ",
  "az, ami fél évig senkié.");
P("");

for (const [r, nev] of Object.entries(kat.szerepek)) {
  const sajat = kat.szabalyok.filter((s) => s.felelos === r).sort(nagyElol);
  const alair = kat.szabalyok.filter((s) => s.kell.includes(r) && s.felelos !== r);
  const sajatMezo = sajat.reduce((n, s) => n + N(s), 0);
  const alairMezo = alair.reduce((n, s) => n + N(s), 0);

  P(`### ${nev}`);
  P("");
  P(`**Előkészítés: ${sajat.length} szabály · ${sajatMezo} mező.** `,
    `Aláírás ezen felül még ${alair.length} szabályon (${alairMezo} mező), `,
    `ahol más az előkészítő.`);
  P("");
  if (!sajat.length) {
    P("*Nincs saját előkészítendő tétele.*");
    P("");
    continue;
  }
  P("| ☐ | Mező | Szabály | Amit el kell dönteni | Kell hozzá | Ma |");
  P("|---|---:|---|---|---|---|");
  for (const s of sajat) {
    P(`| ☐ | ${N(s)} | \`${s.rule}\`<br>${s.cim} | ${s.lenyeg}<br>`,
      `*Javaslat: **${FAJTA_HU[s.javaslat]}** — ${s.mit}* | `,
      `${s.kell.map(SZ).join("<br>")} | ${ALL(s)} |`);
  }
  P("");
}

/* ── 2. ÜLÉSEK ─────────────────────────────────────────────────────── */

P("---");
P("");
P("## 2. Kikkel kell leülni — ülésenként");
P("");
P("Az azonos aláírói kört kívánó szabályok **egy ülésen** eldönthetők. Ez a ",
  "bontás azt mondja meg, hány külön asztal kell, és melyiknél ki ül.");
P("");

const ulesek = new Map<string, SzabalyDef[]>();
for (const s of kat.szabalyok) {
  const k = [...s.kell].sort().join("+");
  (ulesek.get(k) ?? ulesek.set(k, []).get(k)!).push(s);
}
const sorrend = [...ulesek.entries()]
  .map(([k, ss]) => ({ k, ss: ss.sort(nagyElol), n: ss.reduce((n, s) => n + N(s), 0) }))
  .sort((a, b) => b.n - a.n);

P("| Ülés | Kik | Szabály | Mező | Miről |");
P("|---:|---|---:|---:|---|");
sorrend.forEach((u, i) => {
  P(`| ${i + 1}. | ${u.k.split("+").map(SZ).join(" + ")} | ${u.ss.length} | ${u.n} | `,
    u.ss.map((s) => s.cim).join(" · "), " |");
});
P("");
P(`Összesen **${sorrend.length} ülés**. A legnagyobb (${sorrend[0].n} mező) `,
  "önmagában több, mint a többi együtt — érdemes elsőnek venni, és nem az ",
  "utolsó napirendi pontnak.");
P("");

/* ── 3. SORREND ────────────────────────────────────────────────────── */

P("---");
P("");
P("## 3. Mi a sorrend — mezőszám szerint");
P("");
P("A nagy tételek húznak: a felső hat szabály a 326 mező több mint felét ",
  "fedi. Ha csak ennyi születik meg, az már a munka fele.");
P("");
P("| # | Mező | Szabály | Felelős | Kell hozzá | Javaslat | Ma |");
P("|---:|---:|---|---|---|---|---|");
[...kat.szabalyok].sort(nagyElol).forEach((s, i) => {
  P(`| ${i + 1} | ${N(s)} | \`${s.rule}\` — ${s.cim} | ${SZ(s.felelos)} | `,
    `${s.kell.map(SZ).join(", ")} | ${FAJTA_HU[s.javaslat]} | ${ALL(s)} |`);
});
P("");

const felso = [...kat.szabalyok].sort(nagyElol).slice(0, 6);
P(`A felső hat: **${felso.reduce((n, s) => n + N(s), 0)} mező** a ${osszes}-ból.`);
P("");
P("---");
P("");
P("## Ahogy egy tétel lezárul");
P("");
P("```");
P("npm run dontes -- --mezok <szabály>     # melyik mezőkről van szó");
P("npm run dontes -- --sablon <szabály>    # kitöltendő sablon, mai lenyomattal");
P("#   … a kitöltött tétel a registry/felulet/dontesek.json-ba kerül …");
P("npm run validate                        # hibát ad, ha a döntés hiányos");
P("npm run dontes                          # a lista eggyel rövidebb");
P("```");
P("");
P("A lenyomatot kézzel kiszámolni nem lehet, és épp ezért nem is szabad kézzel ",
  "beírni: a sablon a mai szöveg lenyomatát adja. Ha a szabály mondata később ",
  "megváltozik, a döntés **elavul** — nem tűnik el, de nem is fedezi tovább.");
P("");
P("A részletes leírás: [`36-dontesek.md`](36-dontesek.md).");
