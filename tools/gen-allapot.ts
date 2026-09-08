/**
 * ÁLLAPOTJELENTÉS — a repóból, nem kézből.
 *
 * Egy kézzel írt „hol tartunk" fél éven belül hazudik. Ez a szkript minden
 * számot a forrásból olvas ki, és ha valami elromlik, itt derül ki.
 *
 * Futtatás: `npm run docs` (a többi generált doksival együtt)
 *
 * MIÉRT NEM ELLENŐRZI A `docs:check`. A tesztek száma minden új teszttel
 * változik, és a szám előállításához MAGUKAT A TESZTEKET kell lefuttatni —
 * egy build-hiba abból, hogy „a doksi elavult", itt csak zajt adna. A
 * generált kalkulátor- és mezőkatalógusnál más a helyzet: azok a
 * regiszterből jönnek, és az elavulásuk valódi hiba.
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { loadUiMap, auditFields } from "../core/ui/felulet.ts";
import { CALCULATORS } from "../core/calc/defs.ts";
import {
  dontesAllapot, loadDontesek, loadSzabalyok, merleg,
} from "../core/ui/dontes.ts";
import {
  atveheto, forrasAllapot, kotesek, loadKulsoForrasok, projektLicenc,
} from "../core/kulso/protokoll.ts";

const reg = loadRegistry("registry/variables");

function walk(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (f.endsWith(ext)) out.push(p);
  }
  return out;
}
const lines = (files: string[]) =>
  files.reduce((n, f) => n + readFileSync(f, "utf8").split("\n").length, 0);

const coreFiles = walk("core", ".ts");
const testFiles = walk("test", ".ts");
const docFiles = walk("docs", ".md");

/** Hány teszt fut — a `node --test` kimenetéből, nem becslésből. */
function testCount(): number {
  try {
    const out = execSync("node --experimental-strip-types --test test/*.test.ts 2>&1 | tail -20",
      { encoding: "utf8", shell: "/bin/bash" });
    return Number(/^# pass (\d+)/m.exec(out)?.[1] ?? 0);
  } catch { return 0; }
}

const maps = readdirSync("registry/felulet")
  .filter((f) => f.endsWith("-felulet.json"))
  .map((f) => loadUiMap(join("registry/felulet", f)));

const audits = maps.map((m) => ({ m, a: auditFields(m, reg) }));
const allFields = audits.flatMap((x) => x.a);
const cnt = (s: string) => allFields.filter((f) => f.status === s).length;

const szabalyok = loadSzabalyok("registry/felulet/dontes-szabalyok.json");
const dontesek = loadDontesek("registry/felulet/dontesek.json");
const dm = merleg(dontesAllapot(allFields, szabalyok, dontesek), szabalyok);

const gated = CALCULATORS.filter((c) => !c.verified);
const P = (...s: string[]) => console.log(s.join(""));

P("# 14 — Hol tartunk");
P("");
P("*Generált dokumentum: `npm run docs`. Minden szám a forrásból jön — ",
  "egy kézzel írt „hol tartunk” fél éven belül hazudik.*");
P("");
P("---");
P("");
P("## A számok");
P("");
P("| | |");
P("|---|---:|");
P(`| Regiszterbeli változó | **${reg.all().length}** |`);
P(`| Kalkulátor | ${CALCULATORS.length} |`);
P(`| ebből kapu mögött (\`verified: false\`) | **${gated.length}** |`);
P(`| Teszt | **${testCount()}** |`);
P(`| Mag: fájl / sor | ${coreFiles.length} / ${lines(coreFiles)} |`);
P(`| Teszt: fájl / sor | ${testFiles.length} / ${lines(testFiles)} |`);
P(`| Dokumentum | ${docFiles.length} |`);
P(`| Regiszterfájl | ${walk("registry", ".json").length} |`);
P("");
P("## A forrásrendszerek felülettérképe");
P("");
P("| Térkép | Szakasz | Adatlap | Mező |");
P("|---|---:|---:|---:|");
for (const { m, a } of audits) {
  P(`| ${m.label.hu} | ${m.menu.length} | ${m.forms.length} | ${a.length} |`);
}
P(`| **Együtt** | **${maps.reduce((n, m) => n + m.menu.length, 0)}** | `,
  `**${maps.reduce((n, m) => n + m.forms.length, 0)}** | **${allFields.length}** |`);
P("");
P("Mezőnkénti mérleg:");
P("");
P("| Állapot | Mennyi | Mit jelent |");
P("|---|---:|---|");
P(`| megvan | ${cnt("mapped")} | van regiszterbeli változó, és a térkép ide köti |`);
P(`| levezetett | ${cnt("derived")} | nálunk számított, a régi felületen kézzel töltendő |`);
P(`| kapu | ${cnt("gate")} | nem mező, hanem **szabály** — döntést vár |`);
P(`| mérési körülmény | ${cnt("context")} | a mért értékkel EGYÜTT tárolandó |`);
P(`| interfészből | ${cnt("interface")} | HL7 ADT/ORM, nem kézi bevitel |`);
P(`| nem vehető át | ${cnt("refused")} | a mi szabályainkba ütközik |`);
P(`| hiányzik | ${cnt("gap")} | valódi fejlesztési tétel |`);
P("");
P("A kapu és a nem vehető át együtt ", `**${dm.dontendo}** mező — mögöttük `,
  `**${dm.szabalyok}** szabály. Ez a [3. lépés](13-18-lepes.md#3-a-326-szabály-döntéssé-tétele) `,
  "munkája, és a döntés nem fejlesztői kérdés:");
P("");
P("| Döntési állapot | Mennyi | Átkerül? |");
P("|---|---:|---|");
P(`| eldöntve | ${dm.dontve} | a döntés szerint |`);
P(`| eldöntetlen | ${dm.eldontetlen} | **nem** |`);
P(`| elavult aláírás | ${dm.elavult} | **nem** |`);
P(`| hiányos aláírás | ${dm.hianyos} | **nem** |`);
P("");
P(`Eldöntetlenül egy mező sem kerül át; ma **${dm.atkerul}** mező kerülne át. `,
  `A ${dm.szabalyok} szabályból **${dm.dontottSzabalyok}** van aláírva. `,
  "Munkalap: `npm run dontes`.");
P("");
P("## Ami kapu mögött áll");
P("");
P("*Ezek a kalkulátorok teljes bemenettel sem adnak eredményt, amíg a ",
  "konstansaikat nem vetették össze az elsődleges forrással.*");
P("");
P("| Kalkulátor | Modul |");
P("|---|---|");
for (const c of gated) P(`| \`${c.id}\` — ${c.label.hu} | ${c.module} |`);
P("");
/* ── KÜLSŐ FORRÁSOK ──────────────────────────────────────────────────────
 *
 * Egy külső protokoll KATALOGIZÁLÁSA és ÁTVÉTELE két különböző dolog, és a
 * kettő összemosása abból áll elő, hogy a különbség sehol nincs kiírva.
 * Ezért van itt: a katalógus mérete mellett ott áll, hogy ebből mennyi
 * befolyásolja ténylegesen a rendszer viselkedését.
 */
const kulsoForrasok = loadKulsoForrasok("registry/kulso");
if (kulsoForrasok.length) {
  P("## Külső források: katalogizálva és átvéve");
  P("");
  const lic = projektLicenc();
  P(`A projekt licence: **${lic ?? "nincs kimondva"}**. Ez nem formaság — a `,
    "copyleft forrásokat ez dönti el.");
  P("");
  P("| Forrás | Tétel | Megvan | Hivatkozható | Helyben telepíthető | Ebből ÁTVÉVE | Érintett változó |");
  P("|---|---:|---:|---:|---:|---:|---:|");
  for (const f of kulsoForrasok) {
    const a = forrasAllapot(f, reg);
    P(`| ${a.label} | ${a.tetelekSzama} | ${a.beszerzettSzama} | ` +
      `${a.hivatkozhatoSzama} | ${a.telepithetoSzama} | **${a.atvettSzama}** | ` +
      `${a.erintettValtozok} |`);
  }
  P("");
  P("Ami az átvételt megállítja, tételenként:");
  P("");
  P("| Tétel | Mi akadályozza | Következő lépés |");
  P("|---|---|---|");
  for (const f of kulsoForrasok) {
    const okok = new Map<string, string | null>();
    for (const t of f.tetelek) {
      const a = atveheto(f, t, { projektLicenc: lic });
      if (a.atveheto || !a.miert) continue;
      if (!okok.has(a.miert)) okok.set(a.miert, a.kovetkezoLepes);
    }
    for (const [ok, lepes] of okok) P(`| ${f.id} | ${ok} | ${lepes ?? "—"} |`);
  }
  P("");
  const osszTetel = kulsoForrasok.reduce((n, f) => n + f.tetelek.length, 0);
  const osszValtozo = new Set(
    kulsoForrasok.flatMap((f) => kotesek(f, reg).map((k) => k.variable)),
  ).size;
  P(`**${osszTetel} katalogizált tétel ${osszValtozo} változónkhoz szólna hozzá — `,
    "és ma egyik sem szól hozzá.** A katalógus a HASZNOT mutatja meg a ",
    "beszerzés előtt; a viselkedéshez csak hitelesített, ismert licencű tétel ",
    "járul hozzá. Részletek: ",
    "[`fejlesztes/42-kulso-protokollok.md`](fejlesztes/42-kulso-protokollok.md) · ",
    "[`fejlesztes/43-kalkulator-katalogus.md`](fejlesztes/43-kalkulator-katalogus.md).");
  P("");
}

P("## A mag egységei");
P("");
P("| Egység | Fájl | Sor |");
P("|---|---:|---:|");
const units = readdirSync("core").filter((f) => statSync(join("core", f)).isDirectory());
for (const u of units.map((u) => ({ u, f: walk(join("core", u), ".ts") }))
  .sort((a, b) => lines(b.f) - lines(a.f))) {
  P(`| \`core/${units.find((x) => x === u.u)}/\` | ${u.f.length} | ${lines(u.f)} |`);
}
P("");

/* ── A TIZENNYOLC LÉPÉS ÁLLÁSA ──────────────────────────────────────────
 *
 * A `13-18-lepes.md` állapotjelöléseit OLVASSUK KI, nem másoljuk. Egy kézzel
 * karbantartott „hol tartunk” két hét alatt elszakad attól, ami a lépéslistán
 * áll — és akkor két különböző igazság lesz a repóban.
 */
const lepesSzoveg = readFileSync("docs/13-18-lepes.md", "utf8");
const lepesek = [...lepesSzoveg.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => {
  const szam = Number(m[1]);
  const cim = m[2];
  // A cím utáni idézetblokk a lépés állapota; az első félkövér mondat a jelölés.
  const utan = lepesSzoveg.slice(m.index! + m[0].length, m.index! + m[0].length + 900);
  const jelzes = /^\s*>\s+\*\*([^*]+)\*\*/m.exec(utan)?.[1]?.replace(/[.:]\s*$/, "");
  return { szam, cim, jelzes: jelzes ?? null };
});

P("## A tizennyolc lépés állása");
P("");
P("*A [`13-18-lepes.md`](13-18-lepes.md) jelöléseiből kiolvasva — nem kézzel ",
  "másolva, mert két kézzel karbantartott lista két hét alatt szétválik.*");
P("");
P("| # | Lépés | Állapot |");
P("|---:|---|---|");
for (const l of lepesek) {
  P(`| ${l.szam} | ${l.cim} | ${l.jelzes ? `**${l.jelzes}**` : "—"} |`);
}
P("");
// A „MEGVAN” és a „gépi fele megvan” KÉT KÜLÖNBÖZŐ ÁLLAPOT. Egybeszámolva a
// jelentés többet állítana, mint amennyi igaz: a 3. és az 5. lépés emberi
// felére a gép egyetlen sort sem tud hozzátenni.
const teljes = lepesek.filter((l) => /^MEGVAN/.test(l.jelzes ?? "")).length;
const reszben = lepesek.filter(
  (l) => l.jelzes && /MEGVAN/.test(l.jelzes) && !/^MEGVAN/.test(l.jelzes)).length;
P(`A tizennyolcból **${teljes} lépés kész**, **${reszben}-nél a gépi fele áll, `,
  `az emberi nem** — aláírás, illetve klinikai olvasat. A jelölés sehol nem `,
  "„kész projekt”: mindegyiknél ott áll, mi maradt nyitva.");
P("");

/* ── A RÉTEGEK ÁLLAPOTA ──────────────────────────────────────────────── */

P("## Mi futhat valódi betegadaton — és mi nem");
P("");
P("*Ez a rendszer legfontosabb állapotjelzője, és szándékosan nem egyetlen ",
  "igen/nem: a rétegek külön-külön érnek meg.*");
P("");
P("| Réteg | Állapot | Mi hiányzik |");
P("|---|---|---|");
P("| tárolás — titkosított, láncolt, perzisztens | **éles** | — |");
P("| jogosultság — szerepkör → ellátási kapcsolat → időablak | **éles** | — |");
P("| auditnapló — az adat előtt írva, elutasítással együtt | **éles** | — |");
P("| törlés — kapuk, kétágú visszavonás, tanúsítvány | **éles** | a megőrzési idők hitelesítése (10. lépés) |");
P("| kulcsőrzés | fejlesztői | HSM vagy KMS |");
P("| **hitelesítés** | **NINCS** | SSO vagy kártyás azonosítás |");
P("");
P("A webes kiszolgáló `OGDOC_SYNTHETIC=1` nélkül **el sem indul**. A rendszer ",
  "tehát valódi betegadaton nem futhat — de már nem a tároló, a jogosultság ",
  "vagy a napló miatt, hanem azért, mert a „ki vagy te” kérdésre nincs válasz.");
P("");
P("---");
P("");
P("*A következő lépések sorrendje: [`13-18-lepes.md`](13-18-lepes.md).*");
P("*Teljes exportcsomag: `npm run csomag`.*");
