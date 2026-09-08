/**
 * A KUTATÁSETIKAI BEADVÁNY ÁLLAPOTLAPJA — a 11. lépés kimenete.
 *
 * A kutatásvezető ül le vele, mielőtt beadja a kérelmet. Egyetlen kérdésre
 * felel: MELYIK ÁLLÍTÁS IGAZ MA, és melyik nem.
 *
 * A lap nem a beadványt írja meg. Azt megmondja, hogy a beadvány melyik
 * mondata állna meg, ha a bizottság rákérdezne — és melyik nem.
 *
 * Futtatás: `npm run ett`
 */
import { rendszerAllapot } from "../core/ett/allapot.ts";
import {
  beadhato, bizonyitekok, ertekel, loadDosszie, merleg,
} from "../core/ett/dosszie.ts";

const a = rendszerAllapot(".");
const d = loadDosszie("registry/ett/dosszie.json");
const biz = bizonyitekok(a);
const ert = ertekel(d, biz);
const m = merleg(ert);
const b = beadhato(ert);

const P = (...s: string[]) => console.log(s.join(""));
const JEL: Record<string, string> = {
  fedett: "☑ fedett", reszben: "◐ részben", megalapozatlan: "☐ MEGALAPOZATLAN",
  szervezeti: "— szervezeti",
};

P("# A kutatásetikai (ETT) beadvány állapotlapja");
P("");
P(`*Generált: \`npm run ett\`. ${m.osszes} tétel: ${m.fedett} fedett, `,
  `${m.reszben} részben, ${m.megalapozatlan} megalapozatlan, `,
  `${m.szervezeti} szervezeti.*`);
P("");
P(`## ${b.beadhato ? "A kérelem beadható" : "A kérelem így NEM adható be"}`);
P("");
P(b.miert);
P("");

P("## Miért nem melléklet-ellenőrzés ez");
P("");
P("A beadvány minden tétele **állítás egy bizottságnak**. Az „adatbiztonsági");
P("leírás” nem egy melléklet neve, hanem az a mondat, hogy az adathoz csak");
P("jogosult fér hozzá. Ha ezt kimondjuk, miközben a cselekvő kilétét egyetlen");
P("ellenőrizetlen kérésfejléc állítja, akkor a kérelem **valótlan állítást**");
P("tartalmaz — és ez nem hiányos beadvány, hanem más műfaj.");
P("");
P("Egy hiányzó melléklet pótolható. Egy valótlan állítás a bizottság előtt");
P("nem az.");
P("");

P("## 1. A tételek");
P("");
P("| # | Tétel | Amit a kérelem kimondana | Állapot |");
P("|---|---|---|---|");
for (const t of ert) {
  P(`| \`${t.id}\` | ${t.cim} | ${t.allitas} | ${JEL[t.allapot]}`,
    t.blokkolo ? " · **blokkoló**" : "", " |");
}
P("");

const gond = ert.filter((t) => t.allapot === "megalapozatlan" || t.allapot === "reszben");
if (gond.length) {
  P("## 2. Ami ma nem mondható ki");
  P("");
  for (const t of gond) {
    P(`### \`${t.id}\` — ${t.cim}`);
    P("");
    P(`**Az állítás:** „${t.allitas}”`);
    P("");
    P(t.miert);
    P("");
    if (t.hianyzo.length) {
      P("| Ami hiányzik | A tényleges állapot |");
      P("|---|---|");
      for (const h of t.hianyzo) P(`| ${h.mit} | ${h.ertek} — ${h.miert} |`);
      P("");
    }
  }
}

P("## 3. A bizonyítékok — a rendszer mostani állapota");
P("");
P("Nem fájlnevek, hanem lekérdezések. Ha egy aláírás megszületik, ez a tábla");
P("magától változik; ha egy kapu eltűnik a kódból, az is látszik.");
P("");
P("| | Bizonyíték | Mit állít | A mért érték |");
P("|---|---|---|---|");
for (const x of biz) {
  P(`| ${x.megvan ? "☑" : "☐"} | \`${x.kulcs}\` | ${x.mit} | ${x.ertek} |`);
}
P("");

const szerv = ert.filter((t) => t.allapot === "szervezeti");
if (szerv.length) {
  P("## 4. Amiről a gép nem nyilatkozik");
  P("");
  P("Ezekről a rendszer nem tud és nem is akar nyilatkozni — a kutatásvezetőé.");
  P("A „szervezeti” nem felmentés, hanem **címzés**: a beadvány nélkülük sem");
  P("teljes.");
  P("");
  for (const t of szerv) P(`- \`${t.id}\` — ${t.cim}${t.blokkolo ? " **(blokkoló)**" : ""}`);
  P("");
}

P("## 5. A sorrend, ami ebből következik");
P("");
P("A beadvány nem attól lesz beadható, hogy megírjuk. Attól, hogy az");
P("állításai igazzá válnak — és a legtöbbjük **nem fejlesztési feladat**:");
P("");
P("| Ami hiányzik | Kié | Melyik lépés |");
P("|---|---|---|");
P("| A 38 adatkezelési döntés aláírása | klinikai vezető + DPO + fejlesztés | 3. |");
P("| A 14 megőrzési idő aláírása | jogász | 10. |");
P("| A mérőeszközök licencelése | kutatásvezető | 12. |");
P("| A hitelesítés (ki vagy te?) | fejlesztés | 1. — a rendszer egyetlen igazi blokkolója |");
P("| A kulcstár HSM/KMS mögé | üzemeltetés | 1. |");
P("");
P("**Az utolsó kettő a legfontosabb, és ezeket a bizottság is meg fogja");
P("kérdezni.** Amíg a cselekvő kilétét egy kérésfejléc állítja, a rendszer");
P("valódi betegadaton nem futhat — és ezt a kérelemnek is így kell");
P("tartalmaznia, nem másképp.");
