/**
 * A MINŐSÉGIRÁNYÍTÁSI DOKUMENTUMFA MUNKALAPJA — a 13. lépés kimenete.
 *
 * A minőségirányítási vezető ül le vele. Két kérdésre felel: MI HIÁNYZIK az
 * első kérelemhez, és MELYIK DOKUMENTUM FELÜLVIZSGÁLATA JÁR LE.
 *
 * A lap végén az ISO-összegzés SZÁMOLVA áll, nem gépelve — ez a tábla csúszott
 * el a megfelelési fejezetben, és ez az a szám, amit egy auditor először néz.
 *
 * Futtatás: `npm run mir`
 */
import {
  dokumentumAllas, kerelemAllas, kontrollAllas, loadAllapot, loadFa, loadMatrix,
  merleg, osszegzes, ELOJELZES_NAP,
} from "../core/mir/fa.ts";
import {
  keret, loadKeretek, meesNaptar, merleg as keretMerleg,
} from "../core/mir/keretek.ts";

const MA = new Date().toISOString().slice(0, 10);
const fa = loadFa("registry/mir/dokumentumfa.json");
const mx = loadMatrix("registry/mir/iso20387.json");
const allapot = loadAllapot("registry/mir/allapot.json");
const dok = dokumentumAllas(fa, allapot, MA);
const kon = kontrollAllas(mx, fa, allapot, MA);
const m = merleg(fa, mx, allapot, MA);
const ker = kerelemAllas(fa, allapot, MA);
const keretek = loadKeretek("registry/mir/keretek.json");
const km = keretMerleg(keretek, MA);

const P = (...s: string[]) => console.log(s.join(""));
const JEL: Record<string, string> = {
  hatalyos: "☑ hatályos", felulvizsgalatEsedekes: "◐ felülvizsgálat esedékes",
  lejart: "⚠ LEJÁRT", nincs: "☐ nincs",
};
const CSOPORT: Record<string, string> = {
  iranyitasi: "Irányítási eljárások", eroforras: "Erőforrás-eljárások",
  "minta-eletciklus": "Minta-életciklus SOP-ok", "adat-hozzaferes": "Adat- és hozzáférési SOP-ok",
};

P("# Munkalap — a minőségirányítási dokumentumfa és az első kérelem");
P("");
P(`*Generált: \`npm run mir\`. ${m.hatalyos}/${m.dokumentum} dokumentum hatályban, `,
  `ebből az első körből ${m.elsoKorHatalyos}/${m.elsoKor}. `,
  `${m.lejart} lejárt felülvizsgálat. `,
  `ISO-kontroll: ${m.bizonyitott}/${m.kontroll} bizonyított.*`);
P("");
P(`## ${ker.kerelmezheto ? "Az első kérelem beadható" : "Az első kérelem NEM adható be"}`);
P("");
P(ker.miert);
P("");
P("**Reális átfutás: 12–18 hónap.** Ez a leghosszabb tétel az egész projektben,");
P("és nem fejlesztési feladat — a gép annyit tesz, hogy számon tartja, mi van");
P("meg, mi jár le, és mit kérne az auditor.");
P("");

P("## 1. Az első kör — ami nélkül nincs mit akkreditálni");
P("");
P("A fa saját tanácsa: *„ne írjuk meg mind a 35-öt előre.”* Az első kör a");
P("politika, a kézikönyv és a minta-életciklus SOP-jai — azok nélkül nem lehet");
P("mintát gyűjteni.");
P("");
P("| Dokumentum | Szint | Tárgy | Állapot |");
P("|---|---|---|---|");
for (const d of dok.filter((x) => x.elsoKor)) {
  P(`| \`${d.doc}\` | ${d.szint} | ${d.targy} | ${JEL[d.allapot]} |`);
}
P("");

P("## 2. A teljes fa");
P("");
for (const cs of ["iranyitasi", "eroforras", "minta-eletciklus", "adat-hozzaferes"]) {
  const lista = dok.filter((d) => d.csoport === cs);
  if (!lista.length) continue;
  P(`### ${CSOPORT[cs]} (${lista.length})`);
  P("");
  P("| Dokumentum | Tárgy | Verzió | Felülvizsgálat | Állapot |");
  P("|---|---|---|---|---|");
  for (const d of lista) {
    P(`| \`${d.doc}\` | ${d.targy} | ${d.verzio ?? "—"} `,
      `| ${d.kovetkezoFelulvizsgalat ?? "—"} | ${JEL[d.allapot]} |`);
  }
  P("");
}

const esedekes = dok.filter((d) => d.allapot === "felulvizsgalatEsedekes" || d.allapot === "lejart");
if (esedekes.length) {
  P("## 3. Ami felülvizsgálatra vár");
  P("");
  for (const d of esedekes) P(`- \`${d.doc}\` — ${d.miert}`);
  P("");
} else {
  P("## 3. Ami felülvizsgálatra vár");
  P("");
  P("*Egyetlen dokumentum sincs hatályban, tehát felülvizsgálni sincs mit — de");
  P("amint az első hatályba lép, ez a szakasz megtelik. A fa saját szövege mondja");
  P(`ki: a legtöbb minőségirányítási rendszer azon bukik el, hogy a dokumentumokat`);
  P("senki nem vizsgálja felül, és az audit két éve lejárt SOP-okat talál. A kapu");
  P(`ezért **${ELOJELZES_NAP} nappal előre szól**, és a lejárt dokumentum NEM`);
  P("hatályos, akkor sem, ha ott van a polcon.*");
  P("");
}

P("## 4. Az ISO 20387 kontrollmátrix — összegzés");
P("");
P("**Ez a tábla számolva van, nem gépelve.** A megfelelési fejezetben kézzel írt");
P("változata elcsúszott: 45 kontrollsort 39-nek mondott, és mind a négy kategória");
P("számai eltértek a felettük álló soroktól. Egy összegzés, ami nem a sorokból");
P("jön, előbb-utóbb mindig elcsúszik — és épp ezt nézi meg egy auditor először.");
P("");
P("| Kategória | ✅ megvan | 🔶 részben | ⬜ nincs | összesen |");
P("|---|---:|---:|---:|---:|");
let t = { m: 0, r: 0, n: 0, o: 0 };
for (const s of osszegzes(mx)) {
  P(`| ${s.cim} | ${s.megvan} | ${s.reszben} | ${s.nincs} | ${s.osszes} |`);
  t = { m: t.m + s.megvan, r: t.r + s.reszben, n: t.n + s.nincs, o: t.o + s.osszes };
}
P(`| **Összesen** | **${t.m}** | **${t.r}** | **${t.n}** | **${t.o}** |`);
P("");

P("## 5. Amit az auditor kérni fog");
P("");
P("A fenti jelölések **kézzel írt állapotjelek**. Az auditor nem ezeket kéri,");
P("hanem a **bizonyítékot**: melyik dokumentum, melyik verzió, mikor hagyták jóvá.");
P("");
P(`Ma **${m.nincsBizonyitek}/${m.kontroll} kontroll mellett nincs megnevezett`);
P("bizonyítékdokumentum.** Ez nem ugyanaz, mint hogy „hiányzik valami” — az azt");
P("jelentené, hogy tudjuk, mi kell. Ez azt jelenti, hogy **azt sem írtuk le,");
P("mivel bizonyítanánk.**");
P("");
const tul = kon.filter((k) => k.tulallit && k.allapot !== "nincsBizonyitek");
if (tul.length) {
  P("És ahol a jelölés többet állít, mint amit a bizonyíték fed:");
  P("");
  for (const k of tul) P(`- \`${k.id}\` (${k.szakasz}) — jelölés „${k.rogzitett}”, bizonyíték „${k.allapot}”`);
  P("");
}
P("A `bizonyitekDokumentumok` mező kitöltése a minőségirányítási vezető munkája,");
P("és nem formaság: attól a pillanattól a kontroll állapota **magától követi** a");
P("dokumentum sorsát — ha egy SOP felülvizsgálata lejár, a rá épülő kontrollok");
P("vele együtt esnek ki.");
P("");

/* ── A HÁROM KERET ─────────────────────────────────────────────────── */

P("## 6. A három keret — és amiért nem három külön projekt");
P("");
P("Az intézmény nem egy keretrendszerben él. A biobanki működésre az **ISO");
P("20387**, a magyar ellátásra a **BELLA** akkreditációs és a **MEES 2.1**");
P("tanúsítási standardjai vonatkoznak — és mindhárom **ugyanarra a működésre**");
P("kérdez rá, más szavakkal, más pontozással, más határidőkkel.");
P("");
P("Egy megírt SOP, egy működő auditnapló, egy hitelesített megőrzési idő");
P("**mindhárom keretben bizonyíték**. Aki keretenként külön gyűjti, háromszor");
P("csinálja meg ugyanazt — és a három nyilvántartás előbb-utóbb szétcsúszik.");
P("");
P("| Keret | Fajta | Hatókör |");
P("|---|---|---|");
for (const k of keretek.keretek) P(`| ${k.megnevezes} | ${k.fajta} | ${k.hatokor} |`);
P("");

const mees = keret(keretek, "mees21")!;
P("### A MEES 2.1 átmenet — ez naptár, nem terv");
P("");
P(`A MEES 2.1 **${mees.kozzetetel}**-én jelent meg, és a korábbi változat`);
P(`szerinti tanúsítványok **${mees.tanusitvanyErvenyessegEv} évig** érvényesek.`);
P("A határidők nem a mi terveinkhez igazodnak:");
P("");
P("| Mérföldkő | Határidő | Kit érint | Állapot |");
P("|---|---|---|---|");
for (const m of meesNaptar(mees, MA)) {
  P(`| ${m.megnevezes} | ${m.hatarido} | ${m.minket ? "**minket**" : "hatóság"} `,
    `| ${m.miert} |`);
}
P("");
if (km.meesKovetkezo) {
  P(`**A következő minket érintő határidő ${km.meesKovetkezo.napMulva} nap múlva van.**`);
  P("");
}

const bella = keret(keretek, "bella")!;
const e = bella.ertekeles!;
P("### A BELLA döntési szabálya");
P("");
P(`${bella.standardok!.length} standard (fekvő ${bella.standardSzam!.fekvo} · `,
  `járó ${bella.standardSzam!.jaro} · közös ${bella.standardSzam!.kozos}), `,
  `${km.bellaKotelezo} megnevezett kötelező standarddal.`);
P("");
P(`- minden értékelt tartalmi elemre **${e.pontertekek.join(" · ")}** pont adható,`);
P("  a pontot a tartalmi elem **súlyszámával** kell szorozni;");
P(`- a **kötelező** elemeket **${e.kotelezoSzazalek}%**-ban teljesíteni kell — ez az`);
P("  elért pontszámtól **független**, a jó átlag nem váltja ki;");
P(`- **alapszint**: a kötelező elemeken túl az alapszintű elemek ${e.alapSzazalek}%-a;`);
P(`- **emelt szint**: az alapszint mellett az emelt elemek ${e.emeltSzazalek}%-a;`);
P(`- az igazolás kétszintű és **${e.ervenyessegEv} évre** szól.`);
P("");
P("**A legkönnyebben elrontható pont a nevező.** Egy adott intézményben nem");
P("értelmezhető tartalmi elem **nem nulla pont**, hanem **kisebb elérhető");
P("maximum** — a százalék tehát elmozdul tőle. A pontozó motor ezért a kizárt");
P("elemet a nevezőből is kiveszi, a **nem értékelt** elemet viszont nem: az");
P("utóbbinál a szint nem „még nem elég”, hanem **nem ítélhető meg**.");
P("");
P(`**Amiből ma nem lehet pontozni:** a ${bella.standardok!.length} standard`);
P("**tartalmi elemei és súlyszámai** nincsenek betöltve — azok a hivatalos");
P("kiadványból származnak. A motor fut, de nincs mit pontoznia, és ezt kimondja.");
P("");
P("### Az ellátási forma, amit nem szabad tippelni");
P("");
P(`${km.bellaEllatasNelkul}/${bella.standardok!.length} standardnál nincs kitöltve,`);
P("hogy fekvő- vagy járóbeteg-ellátásra vonatkozik-e. A hivatalos táblázat ezt");
P("oszloponkénti jelöléssel mondja meg; a szöveges kivonatból nem vezethető le,");
P("és **tippelni nem szabad** — ezért áll ott `null`, nem egy valószínű érték.");
