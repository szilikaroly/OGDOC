/**
 * MUNKALAP A RIASZTÁSI REND KIALAKÍTÁSÁHOZ — a 15. lépés kimenete.
 *
 * A szülészeti osztályvezető ül le vele. Egyetlen kérdésre felel
 * riasztástípusonként: KI a címzett, MENNYI IDŐN belül kell átvennie, és KI
 * A KÖVETKEZŐ SZINT, ha nem veszi át.
 *
 * A lap nem javasol címzettet. Azt megmutatja, mekkora a felület, mi az ára a
 * rossz válasznak, és üresen hagyja a helyet a döntésnek.
 *
 * Futtatás: `npm run riasztas`
 */
import { loadRegistry } from "../core/load.ts";
import { CALCULATORS } from "../core/calc/defs.ts";
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import { loadComplaints } from "../core/complaints/registry.ts";
import { felulet } from "../core/riasztas/leltar.ts";
import { loadRend, merleg, tipusAllas } from "../core/riasztas/eszkalacio.ts";

const reg = loadRegistry("registry/variables");
const inst = loadInstruments("registry/kerdoivek").all();
const panasz = loadComplaints("registry/complaints").all()
  .filter((c) => (c as { redflag?: boolean }).redflag).length;
const f = felulet(reg, CALCULATORS, inst, panasz);
const rend = loadRend("registry/riasztas/eszkalacio.json");
const m = merleg(rend);

const P = (...s: string[]) => console.log(s.join(""));
const JEL: Record<string, string> = {
  kiadhato: "☑ kiadható", cimzettNelkul: "☐ NINCS CÍMZETT", lezaratlanLanc: "⚠ lezáratlan lánc",
};

P("# Munkalap — a riasztások címzettje és az eszkalációs rend");
P("");
P(`*Generált: \`npm run riasztas\`. ${m.kiadhato}/${m.tipus} riasztástípus adható ki, `,
  `${m.cimzettNelkul} címzett nélkül. Azonnali: ${m.azonnaliKiadhato}/${m.azonnali}.*`);
P("");

P("## Miért ez a lépés fontosabb a küszöbök pontosságánál");
P("");
P("> A válaszút nélküli riasztás **rosszabb a semminél**. Aki naponta");
P("> háromszor kap figyelmeztetést, amire nincs kihez fordulnia, két hét alatt");
P("> megtanulja elkattintani — és akkor **az igazit is elkattintja**.");
P("");
P("A kapu itt ezért **megfordul** a rendszer többi kapujához képest. Máshol a");
P("hiányzó aláírás azt akadályozza meg, hogy rossz **szám** jelenjen meg. Itt a");
P("hiányzó címzett azt akadályozza meg, hogy a rendszer **egyáltalán");
P("megszólaljon** — mert a címzett nélküli riasztás nem féltájékoztatás, hanem");
P("kiképzés az elkattintásra.");
P("");

P("## 1. Mekkora a felület");
P("");
P("Nem attól nehéz ez a lépés, hogy kevés a riasztás, hanem attól, hogy **sok**:");
P("");
P("| Honnan | Darab | Mi |");
P("|---|---:|---|");
for (const t of f.tetelek) P(`| ${t.honnan} | ${t.darab} | ${t.mit} |`);
P(`| **Összesen** | **${f.osszes}** | riasztási pont |`);
P("");
P(`**Ha mind a ${f.osszes} külön címzettet kapna, a rend használhatatlan lenne;`);
P("ha egy sem kap, a rendszer néma marad.** A címzett ezért a **típushoz**");
P(`tartozik — abból ${m.tipus} van, nem ${f.osszes}.`);
P("");

P("## 2. A nyolc riasztástípus — és a kitöltendő lánc");
P("");
for (const t of rend.tipusok) {
  const a = tipusAllas(t);
  P(`### \`${t.id}\` — ${t.megnevezes}`);
  P("");
  P(`**Súlyosság:** ${t.sulyossag} · **Forrás:** \`${t.forras}\` · ${JEL[a.allapot]}`);
  P("");
  P(`**Mit jelent:** ${t.mitJelent}`);
  P("");
  if (a.kiadhato) {
    P("| Szint | Címzett | Elérhetőség | Válaszhatáridő |");
    P("|---|---|---|---|");
    for (const sz of t.lanc) {
      P(`| ${sz.szint}${sz.utolso ? " (utolsó)" : ""} | ${sz.cimzett} `,
        `| ${sz.elerhetoseg} | ${sz.valaszHatarideoPerc} perc |`);
    }
  } else {
    P("| Szint | Címzett | Elérhetőség | Válaszhatáridő | Utolsó? |");
    P("|---|---|---|---|---|");
    P("| 1 | ☐ … | ☐ … | ☐ … perc | |");
    P("| 2 | ☐ … | ☐ … | ☐ … perc | |");
    P("| 3 | ☐ … | ☐ … | ☐ … perc | ☐ igen |");
  }
  P("");
}

P("## 3. A három szabály, amit a lánc kitöltésekor be kell tartani");
P("");
P("**1. A címzett megnevezett szerepkör, nem „az ügyelet”.** A rendszer");
P("felismert szerepköreit a rend `szerepek` mezője sorolja; ami nincs benne,");
P("az építési hiba. Egy „majd valaki” nem címzett.");
P("");
P("**2. A címzettnek elérhetősége van.** Akit nem lehet elérni, az csak papíron");
P("létezik — és az ilyen lánc pontosan úgy viselkedik, mintha nem is lenne.");
P("");
P("**3. A lánc VÉGET ÉR.** Pontosan egy szint van utolsónak jelölve, és az a");
P("legmagasabb. Ha nincs, a ki nem vett riasztás örökké vándorol, és senki nem");
P("felelős érte. A végponton a riasztás **kimerül**, és ezt a rendszer");
P("kimondja — nem tesz úgy, mintha szólt volna.");
P("");

P("## 4. Mit nyit ki ez a lépés");
P("");
P("A **9. lépés** (szepsziskü­szöbök) kapuja **addig nem nyílik ki, amíg ez");
P("nincs meg** — a lépéslista ezt kimondja. A szepszisprotokoll");
P("`escalation.tipus` mezője mostantól a `riaszt.szepszis` láncra mutat: ha a");
P("lánc kitöltődik, az `alertStatus()` megnevezi, **ki a felelős most**, a");
P("hányadik szinten, és mennyi ideje.");
P("");
P("Enélkül a függvény tudta, hogy a ki nem vett riasztásnak „egy szinttel");
P("feljebb” kell mennie — de azt nem, hogy **mi van feljebb**. A próza");
P("megígérte az eszkalációt, a szerkezet nem tudta hordozni.");
