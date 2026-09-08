/**
 * MUNKALAP A MEGŐRZÉSI IDŐK HITELESÍTÉSÉHEZ, ÉS A TÖRLÉS PRÓBAFUTTATÁSA —
 * a 10. lépés kimenete.
 *
 * Egy jogász ül le vele. Azt kell látnia, hogy MELYIK IDŐTARTAM áll a
 * rendszerben, MELYIK jogszabályhelyből, MIHEZ KÉPEST számoljuk — és hol
 * mond mást az idézet, mint a beállítás.
 *
 * A második fele a lépés elfogadási kritériuma: az első automatikus törlés
 * PRÓBAFUTTATÁSA szintetikus eseten. A terv soha nem töröl, és nem is tud:
 * nincs olyan ága, ami írna.
 *
 * Futtatás: `npm run megorzes`
 */
import { loadDocuments } from "../core/docs/registry.ts";
import {
  horgonyElteresek, lejarat, lenyeg, lenyomat, loadMegorzesHitelesitesek,
  megorzesAllapot, merleg, terv,
} from "../core/docs/megorzes.ts";

const docs = loadDocuments("registry/documents/core.json").all();
const kat = loadMegorzesHitelesitesek("registry/documents/megorzes-hitelesitesek.json");
const m = merleg(docs, kat);
const allapotok = new Map(megorzesAllapot(docs, kat).map((a) => [a.doc, a]));

const P = (...s: string[]) => console.log(s.join(""));
const HORGONY: Record<string, string> = {
  recordClose: "az eset lezárása", patientDeath: "a beteg halála",
  lastAccess: "az utolsó hozzáférés", dataEntry: "az adatfelvétel",
  creation: "a felvétel készítése",
};

P("# Munkalap — a megőrzési idők hitelesítése és a törlés próbafuttatása");
P("");
P(`*Generált: \`npm run megorzes\`. ${m.osszes} dokumentumtípus, `,
  `ebből ${m.alairt} aláírva. Horgonyeltérés: ${m.horgonyElteres}.*`);
P("");

P("## Miért ez a legsúlyosabb a rendszer öt hitelesítési rétege közül");
P("");
P("A laborreferencia, a normogram, a kalkulátor és a szepszisküszöb hibája");
P("**téves számot** ad — észrevehető, javítható, visszamérhető. A hibás");
P("megőrzési idő **visszahozhatatlanul megsemmisít** dokumentációt. Nincs");
P("második esély, és nincs mihez visszanyúlni.");
P("");
P("Ezért a `verification: \"primary\"` itt is **csak aláírásból** állhat elő, és");
P("az aláírás megnevezi a jogszabályt **és a hatályosság napját** is: egy");
P("törvény tavalyi szövege nem a hatályos szöveg, és a különbség épp a");
P("megőrzési időkben szokott lenni.");
P("");

P("## 1. Amit alá kell írni");
P("");
P("| Dokumentumtípus | Idő | Mihez képest | Jogszabályhely | Lenyomat | Aláírva |");
P("|---|---|---|---|---|---|");
for (const d of docs) {
  const a = allapotok.get(d.id)!;
  const jel = a.allapot === "hitelesitve" ? "☑" : a.allapot === "elavult" ? "⚠ elavult" : "☐";
  P(`| ${d.label.hu} | \`${d.retention.period}\` | ${HORGONY[d.retention.from]} `,
    `| ${d.retention.source.split("—")[0].trim()} | \`${lenyomat(lenyeg(d))}\` | ${jel} |`);
}
P("");

const elt = horgonyElteresek(docs);
if (elt.length) {
  P("## 2. Ahol az idézet mást mond, mint a beállítás");
  P("");
  P("A rendszer mind a tizennégy időt **az eset lezárásától** számolja. Az");
  P("idézett jogszabályhely viszont a legtöbbnél mást nevez meg.");
  P("");
  P("| Dokumentumtípus | A rendszer számol | Az idézet szerint | Az eltérés iránya |");
  P("|---|---|---|---|");
  for (const e of elt) {
    P(`| \`${e.doc}\` | ${HORGONY[e.from]} | ${HORGONY[e.idezett]} | `,
      e.hosszabb ? "**hosszabb** őrzés — biztonságos |" : "**rövidebb** őrzés — NEM biztonságos |");
  }
  P("");
  P("**Ez a jogász első kérdése.** Az eset lezárása sosem korábbi az");
  P("adatfelvételnél, tehát a rendszer ma hosszabb ideig őriz, mint amennyit a");
  P("törvény kíván — ami a biztonságos irány. De **kimondatlan**, és abban a");
  P("pillanatban, hogy a rendszer valóban számolni kezd, a jogi és a gépi");
  P("lejárat két különböző dátum lesz. Két válasz lehetséges, és mindkettőt le");
  P("kell írni: vagy elfogadjuk a lezárást óvatos közelítésként, vagy a");
  P("horgonyt állítjuk át (`dataEntry`, `creation`).");
  P("");
}

P("## 3. Próbafuttatás — mi történne, ha a törlés élesben menne");
P("");
P("Az elfogadási kritérium második fele. **A terv soha nem töröl**: nincs olyan");
P("ága, ami írna. Az első automatikus törlés próbája nem lehet maga az első");
P("automatikus törlés.");
P("");

const MOST = new Date().toISOString();
const ESETEK: Array<{ id: string; leiras: string; h: Parameters<typeof terv>[3] }> = [
  { id: "SZINT-1960", leiras: "Régi, lezárt eset — minden idő letelt",
    h: { recordClose: "1960-01-01T00:00:00.000Z" } },
  { id: "SZINT-2010", leiras: "2010-ben lezárt eset — a 10 év letelt, a 30 nem",
    h: { recordClose: "2010-06-15T00:00:00.000Z" } },
  { id: "SZINT-NYITOTT", leiras: "LEZÁRATLAN eset — nincs horgony",
    h: {} },
];

for (const e of ESETEK) {
  const t = terv(docs, kat, e.id, e.h, MOST);
  P(`### \`${e.id}\` — ${e.leiras}`);
  P("");
  P(t.osszefoglalo);
  P("");
  P("| Dokumentumtípus | Lejárat | Menne | Miért nem |");
  P("|---|---|---|---|");
  for (const x of t.tetelek) {
    P(`| ${x.label} | ${x.lejarat ? x.lejarat.slice(0, 10) : "—"} `,
      `| ${x.torolheto ? "IGEN" : "nem"} | ${x.torolheto ? "—" : x.miert} |`);
  }
  P("");
}

P("**Amit a három eset együtt mutat.** A lezáratlan esetnél a rendszer nem esik");
P("vissza a mai dátumra: horgony nélkül nem tudja, mikortól számoljon, tehát azt");
P("sem tudja, meddig — és a hiányzó horgony nem „most”. Ez ugyanaz a szabály,");
P("mint mindenütt: **a hiányzó adat sehol nem „nem”.**");
P("");
P("És a másik oldal: a régi esetnél mind a tizennégy idő letelt, mégsem menne");
P("egyetlen tétel sem — mert egyik megőrzési szabály sincs aláírva. **Ez a");
P("helyes sorrend**: előbb az aláírás, aztán a törlés.");
