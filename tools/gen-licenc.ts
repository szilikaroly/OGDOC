/**
 * MUNKALAP A MÉRŐESZKÖZÖK LICENCELÉSÉHEZ — a 12. lépés kimenete.
 *
 * A kutatásvezető és egy jogász ül le vele. Egyetlen kérdésre felel
 * eszközönként: MELYIK A KÉT KIMENET, és melyiket választjuk.
 *
 *   · megszerezzük a licencet és a validált magyar tételszöveget, VAGY
 *   · leírjuk, hogy nem használjuk — indoklással, és azzal, mi lép helyette.
 *
 * A harmadik lehetőség — hogy nyitva marad — nem válasz.
 *
 * Futtatás: `npm run licenc`
 */
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import {
  ELOJELZES_NAP, eszkozAllapot, lenyeg, lenyomat, loadLicencek, merleg,
} from "../core/kerdoiv/licenc.ts";

const MA = new Date().toISOString().slice(0, 10);
const inst = loadInstruments("registry/kerdoivek").all();
const kat = loadLicencek("registry/kerdoivek/licencek.json");
const allapotok = inst.map((i) => eszkozAllapot(i, kat, MA));
const m = merleg(inst, kat, MA);

const P = (...s: string[]) => console.log(s.join(""));
const JEL: Record<string, string> = {
  licencelt: "☑ licencelt", kozkincs: "☑ közkincs", "nem-hasznaljuk": "☑ nem használjuk",
  rendezetlen: "☐ RENDEZETLEN", igazolatlan: "⚠ IGAZOLATLAN", lejart: "⚠ LEJÁRT",
  elavult: "⚠ ELAVULT",
};
const FORD: Record<string, string> = {
  validated: "validált", unvalidated: "NEM validált", none: "nincs",
};

P("# Munkalap — a mérőeszközök licencelése");
P("");
P(`*Generált: \`npm run licenc\`. ${m.rendezett}/${m.osszes} eszköz rendezett `,
  `(${m.licencelt} licencelt, ${m.kozkincs} közkincs, ${m.nemHasznaljuk} „nem használjuk”). `,
  `${m.rendezetlen} rendezetlen. Felvehető: ${m.felveheto}. `,
  `Validált magyar fordítás: ${m.validaltForditas}/${m.osszes}.*`);
P("");

P("## A lépés kétkimenetű — és ez szándékos");
P("");
P("> *„Kész, ha minden eszközre vagy licenc + validált tételszöveg van, vagy");
P("> egy leírt döntés, hogy **nem használjuk**.”*");
P("");
P("A második nem kudarc, hanem **érvényes válasz**. Enélkül a licenceletlen");
P("eszköz örökre nyitott tétel maradna: senki nem szerzi meg a licencet, és");
P("senki nem mondja ki, hogy nem is kell. A megnevezetlen adósság előbb-utóbb");
P("zaj lesz, a zajt pedig senki nem olvassa.");
P("");
P("**Ez ugyanaz a szabály, mint a SNOMED-nél:** a rögtönzött fordítás nem a");
P("mérőeszköz. Egy kérdőív, amit lefordítottunk, egy másik kérdőív — és a");
P("validációs vágóértékek nem érvényesek rá.");
P("");

P("## 1. A tíz eszköz");
P("");
P("| Eszköz | Tétel | Tételszöveg | Magyar fordítás | Állapot |");
P("|---|---|---|---|---|");
for (const a of allapotok) {
  const i = inst.find((x) => x.id === a.inst)!;
  P(`| **${a.abbrev}** (\`${a.inst}\`) | ${i.items.length} | ${i.itemText.status} `,
    `| ${FORD[a.forditas]} | ${JEL[a.allapot] ?? a.allapot} |`);
}
P("");

const nyitott = allapotok.filter((a) => !a.rendezett);
if (nyitott.length) {
  P("## 2. Ami rendezetlen — és a két kiút");
  P("");
  for (const a of nyitott) {
    const i = inst.find((x) => x.id === a.inst)!;
    P(`### ${a.abbrev} — ${i.label.hu ?? a.inst}`);
    P("");
    P(`**Forrás:** ${i.source.cite}`);
    if (i.source.pmid) P(`  · PMID ${i.source.pmid}`);
    P("");
    P(a.miert);
    P("");
    P(`**Magyar fordítás:** ${FORD[a.forditas]}`,
      i.translation.source?.cite ? ` — ${i.translation.source.cite}` : "");
    P("");
    P("| A két kiút | Mit kell hozzá |");
    P("|---|---|");
    P("| **Licencet szerzünk** | jogosult · licencazonosító · hatókör (intézmény, ",
      "kutatás, betegszám, nyelv) · kelt · lejárat |");
    P("| **Leírjuk, hogy nem használjuk** | indoklás · mi lép helyette · aláíró · dátum |");
    P("");
    P(`**Az eszköz mostani lenyomata:** \`${lenyomat(lenyeg(i))}\``);
    P("");
  }
}

P("## 3. Amit a licencnél tudni kell, és a többi aláírásnál nem");
P("");
P("**A licenc lejár.** A rendszer öt korábbi aláírási rétege időtlen: egy szám");
P("mögötti aláírás nem avul el magától, csak ha a szám megváltozik. Egy licenc");
P("viszont **dátumhoz kötött**, és a lejárta nem a mi hibánk — mégis attól a");
P("naptól a felvétel jogosulatlan.");
P("");
P(`A kapu ezért **naptárt néz**, és ${ELOJELZES_NAP} nappal előre szól. Nem`);
P("udvariasságból: a megújítás hónapokat vihet, tehát a lejárat hetében");
P("elkezdeni már késő.");
P("");
P("**A lejárt licenc nem törli a múltat.** A már felvett adat érvényes marad;");
P("csak új felvétel nem indul. A kettő különbsége lényegi — a `score()` ezért");
P("egy máshol felvett eszköz eredményét akkor is kiértékeli, ha a felvételi");
P("kapu zárva van.");
P("");

P("## 4. Ami ebből az ETT-beadványba megy");
P("");
P("A `ett.j2` tétel azt állítja: *„A kutatásban használt kérdőívek magyar");
P("tételszövege licencelt, a fordítás validált.”* Ez ma **megalapozatlan**, és");
P("a beadvány emiatt sem adható be. Ha egy eszközre a döntés az, hogy nem");
P("használjuk, az **ugyanúgy rendezi** a tételt — a bizottságnak nem azt kell");
P("állítanunk, hogy mindent használunk, hanem azt, hogy amit használunk, arra");
P("van jogunk.");
