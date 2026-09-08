/**
 * MUNKALAP A PILOTHOZ — a 16. lépés kimenete.
 *
 * Az osztályvezető ül le vele, aki vállalja. Három kérdésre felel: MI HIÁNYZIK
 * MÉG, MIT KELL AZ OSZTÁLYNAK ADNIA, és MIVEL MÉRJÜK A VÉGÉN, hogy sikerült-e.
 *
 * Futtatás: `npm run pilot`
 */
import { rendszerAllapot } from "../core/ett/allapot.ts";
import { bizonyitekok } from "../core/ett/dosszie.ts";
import {
  elofeltetelek, indithato, loadPilot, merleg, zarasAllas,
} from "../core/pilot/felkeszultseg.ts";

const biz = bizonyitekok(rendszerAllapot("."));
const p = loadPilot("registry/pilot/pilot.json");
const a = elofeltetelek(p, biz);
const i = indithato(p, a);
const z = zarasAllas(p, a);
const m = merleg(a, z, i);

const P = (...s: string[]) => console.log(s.join(""));

P("# Munkalap — a pilot előfeltételei");
P("");
P(`*Generált: \`npm run pilot\`. ${m.allo}/${m.elofeltetel} előfeltétel áll `,
  `(tervbeli ${m.tervbeliAllo}/${m.tervbeli}, kimondatlan ${m.kimondatlanAllo}/`,
  `${m.kimondatlan}) · ${m.merheto}/${m.zarasi} zárási kritérium mérhető.*`);
P("");
P(`## ${i.indithato ? "A pilot elindulhat" : "A pilot NEM indulhat el"}`);
P("");
P(i.miert);
P("");

P("## 1. Amiért ez a lépés más súlyú a többinél");
P("");
P("**Ez az első lépés, ami beteg-azonosításra alkalmas adatot érint.** Minden");
P("eddigi kapu azt akadályozta meg, hogy a rendszer rossz *számot* mondjon; egy");
P("rossz szám javítható. Amit itt rontunk el, az nem: a jogalap nélkül felvett");
P("adat nem lesz visszamenőleg jogszerű, az elveszett vajúdási idősor nem áll");
P("össze emlékezetből, és a klinikus, aki egyszer elveszítette, többé nem bízik");
P("benne.");
P("");

P("## 2. Az öt előfeltétel, amit a terv felsorol");
P("");
P("| | Lépés | Előfeltétel | Ami hiányzik |");
P("|---|---|---|---|");
for (const x of a.filter((y) => !y.kimondatlan)) {
  P(`| ${x.all ? "☑" : "☐"} | ${x.lepes}. | ${x.megnevezes} | `,
    x.all ? "—" : x.hianyErtekek.join("; "), " |");
}
P("");

P("## 3. A kettő, amit a terv NEM sorol fel — és a rendszer mégis megkövetel");
P("");
P("Az öt felsorolt előfeltétel **mind teljesülhet úgy, hogy a rendszer valódi");
P("adaton mégsem futhat.** Ez nem a terv pontatlansága: a felsorolás a");
P("*dokumentációs* előfeltételeket nevezi meg, a rendszer saját kapui viszont");
P("kettővel többet kényszerítenek ki.");
P("");
P("| | Előfeltétel | Állapot | Miért nem hagyható ki |");
P("|---|---|---|---|");
for (const x of a.filter((y) => y.kimondatlan)) {
  P(`| ${x.all ? "☑" : "☐"} | ${x.megnevezes} | ${x.ertekek.join("; ")} | `,
    x.miert, " |");
}
P("");

P("## 4. Amit gép nem tölthet ki");
P("");
if (i.szervezeti.length) {
  for (const s of i.szervezeti) P(`- **${s}**`);
} else {
  P(`- Osztály: **${p.osztaly}** · vezető: **${p.vezeto}** · kezdés: **${p.kezdet}**`);
}
P("");
P("Az osztály és a vezető nem adminisztratív mező. A lépés kimondja: *„egy");
P("osztály, egy vezetővel, aki **vállalja**”* — és a vállalás az, amit gép nem");
P("tud pótolni. A rendszer legfeljebb annyit tehet, hogy nem indul el nélküle.");
P("");

P("## 5. Mivel mérjük a végén — a pilot ELŐTT eldöntve");
P("");
P("A záráskor kimondott *„minden rendben ment”* pontosan annyit ér, amennyit a");
P("mérése. Ha a mérési mód a pilot végén dől el, azt választjuk, ami épp kijön.");
P("");
P("| Kritérium | Ma mérhető? | Mivel | Mi hiányzik hozzá |");
P("|---|---|---|---|");
const CIM: Record<string, string> = {
  merheto: "**igen**", nevezoHianyzik: "nem — nincs nevező",
  elerhetetlen: "**elérhetetlen**", meroeszkozNelkul: "nem — nincs mérőeszköz",
  csakEmberi: "nem — emberi ítélet",
};
for (const x of z) {
  P(`| ${x.kriterium} | ${CIM[x.allapot]} | ${x.meres} | ${x.miert} |`);
}
P("");
P("**A hiányzó mérés sehol nem „teljesült”.** A pilot végén a *„nem");
P("veszítettünk adatot”* és a *„nem mértük, veszítettünk-e”* két különböző");
P("mondat — és éppen a pilot az, aminek ezt a kettőt szét kell választania.");
P("");

P("## 6. Amit ez a lépés a rendszerben talált");
P("");
P("**A lenyomatlánc a múltat köti meg, a végét nem.** Egy negyven bejegyzéses");
P("naplóból az utolsó ötöt letörölve a maradék 1–35 lánc *hiánytalan*: nincs");
P("hézag, minden lenyomat illeszkedik, a `verifyChain()` „ép”-et mond, a");
P("rejtjelezett `verifySealedChain()` szintén, és a tároló a csonkát");
P("megnyugtatóan felolvassa. Öt vajúdási bejegyzés hiányzik, és nem szól semmi.");
P("");
P("Nem hibás megvalósítás: a naplóban **nincs olyan adat**, amiből ez");
P("kiderülhetne. Ezért a **horgony** — a napló vége, a naplón *kívül* rögzítve,");
P("külön köteten. A pilot első elfogadási kritériuma enélkül nem mérhető, hanem");
P("csak *remélhető*.");
P("");
P("És egy sorrendi következmény a 15. lépésből: amíg **egyetlen riasztástípus");
P("sem kiadható**, a harmadik elfogadási kritérium — *„a rendszer mondott");
P("olyat, amit a klinikus nem vett volna észre”* — nem teljesítetlen, hanem");
P("**elérhetetlen**. A rendszer meg sem szólal.");
