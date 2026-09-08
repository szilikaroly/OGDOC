/**
 * MUNKALAP AZ AUDIT-HUROKHOZ — a 17. lépés kimenete.
 *
 * A klinikai vezető és a biostatisztikus ül le vele. Két kérdésre felel: MIT
 * MÉRÜNK VISSZA MIVEL, és MIKORTÓL SZABAD SZÁMOT MONDANI.
 *
 * Futtatás: `npm run audit`
 */
import {
  auditMezok, loadHurok, merleg, parAllas, wilson,
} from "../core/audit/hurok.ts";
import { loadUiMap } from "../core/ui/felulet.ts";

const h = loadHurok("registry/audit/hurok.json");
const mezok = ["szuleszeti-felulet", "nogyogyaszati-felulet"]
  .flatMap((n) => auditMezok(loadUiMap(`registry/felulet/${n}.json`)));
const allasok = parAllas(h, {});
const m = merleg(h, allasok, mezok);

const P = (...s: string[]) => console.log(s.join(""));
const pc = (x: number) => `${(x * 100).toFixed(0)}%`;

P("# Munkalap — az audit-hurok");
P("");
P(`*Generált: \`npm run audit\`. ${m.par} pár, ${m.bekotott}/${mezok.length} `,
  `audit-mező bekötve · ${m.vizsgaltEset} vizsgált eset · `,
  `${m.kozolheto}/${m.par} pár közölhető · ${m.kuszobHianyzik} küszöb hiányzik.*`);
P("");

P("## Amiért ez a lépés a rendszer legfontosabb köre");
P("");
P("Minden normogram, minden kockázati szám és minden modell **csak addig ér");
P("valamit, amíg valaki elhiszi** — hacsak vissza nem mérjük ebben az");
P("intézményben, ezen a populáción. Ez a hurok az a szerkezet, amitől a rendszer");
P("meg tudja tudni magáról, hogy jó-e.");
P("");

P("## 1. Amit ez a lépés talált");
P("");
P("**A három audit-mezőnek nem volt hova írnia.** Mind ott állt a");
P("felülettérképen, `outcomeAudit` jelöléssel, saját kapuval, saját döntési");
P("szabállyal és hosszú indoklással — és mind a háromban `variable: null`.");
P("A rendszer legfontosabb köre olyan mezőkből állt, amelyeknek nem volt");
P("változójuk: a válasz, amit a klinikus beleír, sehol nem maradt volna meg.");
P("A 17. lépés „Kész, ha”-ja **számot** kér, és számot nem lehet olyan mezőből");
P("számolni, ami nem létezik.");
P("");
P("| Mező | Űrlap | Változó |");
P("|---|---|---|");
for (const x of mezok) {
  P(`| ${x.label} | \`${x.form}\` | ${x.variable ? `\`${x.variable}\`` : "**NINCS**"} |`);
}
P("");

P("## 2. Négy válasz, nem kettő");
P("");
P("A *„megerősítve? igen/nem”* kérdés a **cáfolatot** és az");
P("**eldönthetetlenséget** ugyanabba a rekeszbe teszi. Az egyik azt jelenti, hogy");
P("a rendszer tévedett; a másik azt, hogy a **referencia** nem tudott");
P("válaszolni.");
P("");
P("A felülettérkép saját jegyzete mondja ki, hogy a felületes endometriosis");
P("szövettani igazolása megbízhatatlan — vagyis minden ilyen eset „tévedés”-ként");
P("állna be, és az ultrahang **rendszeresen rosszabbnak látszana**, mint amilyen.");
P("");
P("| Kód | Mit jelent | A nevezőben? |");
P("|---|---|---|");
P("| `confirmed` | a referencia ugyanazt mondta | igen |");
P("| `refuted` | a referencia mást mondott — a rendszer tévedett | igen |");
P("| `indeterminate` | a referencia **nem tudott dönteni** | nem |");
P("| `noReference` | nem történt referenciavizsgálat | nem |");
P("| *(hiányzik)* | senki nem töltötte ki | nem |");
P("");
P("Az utolsónak nincs kódja, és ez szándékos: **a hiányzó adat sehol nem „nem”.**");
P("");
P("Egy példa a különbségre. 6 egyezés, 2 eltérés, 4 eldönthetetlen:");
P("");
P("- helyesen: **6/8 = 75%**");
P("- az eldönthetetleneket cáfolatnak véve: **6/12 = 50%**");
P("");
P("Ugyanaz az adat, ugyanaz a rendszer, huszonöt százalékpont különbség.");
P("");

P("## 3. A három pár");
P("");
P("| Pár | Az állítás | Az igazság | Mit mér vissza |");
P("|---|---|---|---|");
for (const p of h.parok) {
  P(`| **${p.megnevezes}** | ${p.allitas} | ${p.igazsag} | `,
    p.mit.length ? p.mit.map((x) => `\`${x}\``).join(", ") : "—", " |");
}
P("");
for (const p of h.parok.filter((x) => x.megjegyzes)) {
  P(`**${p.megnevezes}.** ${p.megjegyzes}`);
  P("");
}

P("## 4. Mikortól szabad számot mondani");
P("");
P("Egy háromesetes mintából számolt 67%-os találati arány **rosszabb, mint");
P("semmi**: úgy néz ki, mint egy mérés, és nem az. A hurok ezért soha nem ad ki");
P("puszta arányt — mindig konfidenciaintervallummal, és csak akkor, ha mindhárom");
P("küszöb engedi.");
P("");
P("| Küszöb | Mit dönt el | Ma |");
P("|---|---|---|");
P(`| \`minimumEset\` | hány értékelhető eset alatt nem közlünk arányt | `,
  h.minimumEset === null ? "**nincs megnevezve**" : String(h.minimumEset), " |");
P(`| \`maxBizonytalanSav\` | milyen széles sáv fogadható el | `,
  h.maxBizonytalanSav === null ? "**nincs megnevezve**" : pc(h.maxBizonytalanSav), " |");
P(`| \`maxEldonthetetlenArany\` | mennyi eldönthetetlen fér bele | `,
  h.maxEldonthetetlenArany === null ? "**nincs megnevezve**" : pc(h.maxEldonthetetlenArany), " |");
P("");
P("**A hiányzó küszöb nem engedékenység: a kapu zárva marad.** Ma a hurok 100/100");
P("egyezés mellett sem adna ki számot — ugyanaz a szerkezet, mint a rendszer");
P("többi kapujánál.");
P("");
P("A sáv **Wilson-féle pontszám-intervallum**, nem a tankönyvi normál közelítés.");
P("Az utóbbi éppen ott omlik össze, ahol egy induló audit-hurok dolgozni fog:");
P("");
P("| Adat | Normál közelítés | Wilson |");
P("|---|---|---|");
const w33 = wilson(3, 3)!, w05 = wilson(0, 5)!;
P(`| 3/3 | 100% ± 0 — „biztos” | ${pc(w33.also)}–${pc(w33.felso)} |`);
P(`| 0/5 | 0% ± … — **negatív** alsó határ | ${pc(w05.also)}–${pc(w05.felso)} |`);
P("");

P("## 5. Ahol ma tartunk");
P("");
P("| Pár | Vizsgált eset | Értékelhető | Állapot |");
P("|---|---|---|---|");
for (const a of allasok) {
  P(`| ${a.par.megnevezes} | ${a.osszevetes.eset} | ${a.osszevetes.ertekelheto} | `,
    a.kozles.allapot, " |");
}
P("");
P("**Nincs egyetlen eset sem**, és ez nem ennek a lépésnek a hiánya: az esetek a");
P("**16. lépésből** jönnének, a pilot pedig nem indulhat el. A hurok szerkezete");
P("készen áll és be van kötve; ami hiányzik hozzá, az egy osztály, egy vezető,");
P("aki vállalja, és a három küszöb megnevezése.");
