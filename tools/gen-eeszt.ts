/**
 * MUNKALAP AZ EESZT-CSATLAKOZÁSHOZ — a 14. lépés kimenete.
 *
 * Az üzemeltetés és az intézményi informatika ül le vele. Két kérdésre felel:
 * MELYIK MEZŐT KI TUDJA KITÖLTENI, és MI ÁLL MÉG A CSATLAKOZÁS ÚTJÁBAN.
 *
 * Futtatás: `npm run eeszt`
 */
import { rendszerAllapot } from "../core/ett/allapot.ts";
import { bizonyitekok } from "../core/ett/dosszie.ts";
import {
  csatlakozhato, kapuAllas, loadCsatlakozas, merleg, mezoAllas,
} from "../core/eeszt/csatlakozas.ts";

const biz = bizonyitekok(rendszerAllapot("."));
const cs = loadCsatlakozas("registry/eeszt/csatlakozas.json");
const mezok = mezoAllas(cs, biz);
const kapuk = kapuAllas(cs, biz);
const c = csatlakozhato(kapuk);
const m = merleg(cs, biz);

const P = (...s: string[]) => console.log(s.join(""));
const KI: Record<string, string> = {
  rendszerbol: "**rendszer**", szervezeti: "szervezet", uzemeltetesi: "üzemeltetés",
  hianyzoBizonyitek: "⚠ hiányzó bizonyíték",
};

P("# Munkalap — az EESZT-csatlakozás dossziéja");
P("");
P(`*Generált: \`npm run eeszt\`. ${m.urlap} űrlap, ${m.mezo} mező `,
  `(${m.rendszerbol} rendszerből, ${m.szervezeti} szervezeti, `,
  `${m.uzemeltetesi} üzemeltetési). Kapu: ${m.alloKapu}/${m.kapu}.*`);
P("");
P(`## ${c.csatlakozhato ? "A csatlakozás megnyitható" : "Éles csatlakozás NEM lehetséges"}`);
P("");
P(c.miert);
P("");

P("## 1. Amiért ez a lépés más súlyú a többinél");
P("");
P("**A csatlakozás kifelé ír.** Minden eddigi kapu azt védte, hogy a rendszer ne");
P("mondjon rosszat *saját magának*. Az EESZT-be küldött üzenet **elhagyja a");
P("rendszert**, és attól kezdve nem a miénk: a hibás belső bejegyzés javítható,");
P("az országos térbe küldött üzenet nem.");
P("");
P("Ezért a hitelesítés hiánya itt **más súlyú**. Ma a cselekvő kilétét egyetlen");
P("ellenőrizetlen kérésfejléc állítja; csatlakozás után a rendszer az **országos");
P("nyilvántartásba** írna egy olyan azonosító nevében, amit senki nem");
P("ellenőrzött. **Ez nem fokozati különbség.**");
P("");

P("## 2. A négy kapu");
P("");
P("| | Kapu | Állapot | Miért |");
P("|---|---|---|---|");
for (const k of kapuk) {
  P(`| ${k.all ? "☑" : "☐"} | ${k.megnevezes} | ${k.ertek} | ${k.miert} |`);
}
P("");
P("**A szintetikus kapu fordítva olvasandó:** akkor „áll”, amikor a rendszer");
P("**nem futhat valódi adaton**. A megléte nem képesség, hanem **beismerés** —");
P("és amíg ott áll, országos nyilvántartásba nem küldhetünk. Ez a helyes irány.");
P("");

P("## 3. Az öt űrlap — mezőnként, ki tölti ki");
P("");
for (const u of cs.urlapok) {
  P(`### ${u.megnevezes}`);
  P("");
  P(`**Beadja:** ${u.kiAdjaBe} · **Aláírja:** ${u.alairo.join(", ")}`,
    u.szabalyzat ? ` · **Szabályzat:** ${u.szabalyzat}` : "",
    u.visszavonasig ? " · *visszavonásig érvényes*" : "");
  if (u.melleklet?.length) P(`  · **Melléklet:** ${u.melleklet.join(", ")}`);
  P("");
  P("| Mező | Ki tölti ki | A rendszer válasza |");
  P("|---|---|---|");
  for (const f of mezok.filter((x) => x.urlap === u.id)) {
    P(`| ${f.megnevezes} | ${KI[f.allapot]} | ${f.ertek ?? "—"} |`);
  }
  P("");
  if (u.mitAllit?.length) {
    P("**Amit az űrlap kimond:**");
    P("");
    for (const a of u.mitAllit) {
      P(`- *„${a.allitas}”*`);
      if (a.megjegyzes) P(`  → **${a.megjegyzes}**`);
    }
    P("");
  }
}

P("## 4. Amit a beadás előtt látni kell");
P("");
P("A titoktartási nyilatkozat két állítása **megnevezett kockázat**, nem");
P("formanyomtatvány-szöveg:");
P("");
P("**A titoktartás lejárati határidő nélkül terhel.** A rendszerben ez az");
P("**egyetlen** olyan kötelezettség, aminek nincs lejárata — a megőrzési idők, a");
P("mérőeszköz-licencek, a MEES-tanúsítványok és a dokumentumfelülvizsgálatok");
P("mind lejárnak.");
P("");
P("**A Gyártó mentesíti a Működtetőt** minden adatvédelmi követeléssel szemben,");
P("és a titoktartás megszegésekor teljes körű kártérítés terheli. Ez a teljes");
P("adatvédelmi kockázatot a fejlesztő oldalára telepíti — **aláírás előtt kell");
P("látni, nem utána.**");
P("");
P("És egy sorrendi következmény: a **referenciaigazolás élő használatot állít**");
P("(*„jelenleg is használjuk”*). Egy még nem használt rendszerre nem adható ki —");
P("tehát a **16. lépés (pilot) előbb van, mint ez az űrlap.**");
