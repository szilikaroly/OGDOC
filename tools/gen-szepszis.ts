/**
 * MUNKALAP A SZEPSZISKÜSZÖBÖK HITELESÍTÉSÉHEZ — a 9. lépés kimenete.
 *
 * Két ember ül le vele: a szülészeti osztályvezető és egy intenzíves. Nem a
 * repót fogják olvasni. Azt kell látniuk, hogy MELYIK SZÁM áll a rendszerben,
 * HONNAN jött, és hol mond MÁST a másik forrás — küszöbönként, egy sorban.
 *
 * A munkalap nem javasol. A két számot egymás mellé teszi, megmondja, melyik a
 * szigorúbb és mi az ára, és üresen hagyja a helyet a döntésnek.
 *
 * Futtatás: `npm run szepszis`
 */
import { CALCULATORS } from "../core/calc/defs.ts";
import { loadProtocol } from "../core/szepszis/screen.ts";
import {
  cimkeElcsuszasok, dontesAllapot, elteresLenyomat, eltereseK, idobeliJelzok,
  kuszobAllapot, kuszobJel, lenyeg, lenyomat, loadKuszobDontes,
  loadKuszobHitelesitesek, protokollKuszobei, riasztasEngedve,
} from "../core/szepszis/kuszob.ts";

const p = loadProtocol("registry/szepszis/cmqcc-ob-szepszis.json");
const kat = loadKuszobHitelesitesek("registry/szepszis/kuszob-hitelesitesek.json");
const dontes = loadKuszobDontes("registry/szepszis/kuszob-dontes.json");

const allapot = kuszobAllapot(p, kat);
const elteresek = eltereseK(p, CALCULATORS);
const nyitott = elteresek.filter((e) => e.fajta === "elter");
const kapu = riasztasEngedve(p, kat);
const dont = dontesAllapot(p, CALCULATORS, dontes);

const P_ = (...s: string[]) => console.log(s.join(""));
const JEL: Record<string, string> = { lt: "<", lte: "≤", gt: ">", gte: "≥" };

P_("# Munkalap — a szepszisküszöbök hitelesítése és az intézményi választás");
P_("");
P_(`*Generált: \`npm run szepszis\`. ${allapot.kuszobok.length} küszöb, `,
   `ebből ${allapot.kuszobok.length - allapot.osszevetetlen.length} aláírva. `,
   `Eltérő küszöb másik forrással: ${nyitott.length}. `,
   `Riasztás: ${kapu.engedve ? "ENGEDVE" : "NEM INDUL"}.*`);
P_("");

P_("## Mit írnak alá, és mit nem");
P_("");
P_("**Nem azt, hogy a protokoll jó.** Azt, hogy a rendszerben álló számok");
P_("ugyanazok, mint a forrásban — tételesen, küszöbönként. Az aláírás felsorolja,");
P_("melyik küszöböt vetették össze (`sep.crit.rr>24` alakban): **ami kimarad,**");
P_("**arra nem terjed ki.**");
P_("");
P_("A lenyomat a küszöbök **magját** fedi: minden kritérium változóját, irányát,");
P_("határát és **egységét**, a két készlet küszöbszámát, a gyermekágyi ablakot, a");
P_("csomag határidőit és a riasztás átvételi határidejét. Az egység azért van");
P_("benne, mert a laktát 2 mmol/l-es küszöbe mg/dL-ben olvasva **18-szor téves**");
P_("lenne, és a kód egyetlen sora sem változna.");
P_("");
P_(`**A protokoll mostani lenyomata:** \`${lenyomat(lenyeg(p))}\``);
P_("");
P_(`**A riasztási kapu állapota:** ${kapu.miert}`);
P_("");

P_("## 1. A két szám — amiről dönteni kell");
P_("");
if (!nyitott.length) {
  P_("*Nincs olyan mérés, amire két forrás két számot adna.*");
} else {
  P_("Ugyanaz a beteg, ugyanaz a mérés, két forrás, két szám. Ez **nem elírás**:");
  P_("két munkacsoport két határértéket közölt. A rendszer egyiket sem csendesíti");
  P_("el a másikkal — de az intézménynek el kell döntenie, melyik az övé.");
  P_("");
  P_("| Mérés | Protokoll (CMQCC) | Másik forrás | Melyik szigorúbb | Az intézményi küszöb |");
  P_("|---|---|---|---|---|");
  for (const e of nyitott) {
    const jel = JEL[e.irany];
    const szig = Math.min(e.protokoll!, e.kalkulator!);
    P_(`| \`${e.var}\` | ${jel} ${e.protokoll} | ${jel} ${e.kalkulator} `,
       `(\`${e.calc}\`) | ${jel} ${szig} — korábban riaszt, többet téved | ☐ … |`);
  }
  P_("");
  P_("**A választás ára mindkét irányban valódi.** A szigorúbb küszöb korábban");
  P_("riaszt és többet téved; a téves riasztást két hét alatt megtanulják");
  P_("elkattintani, és akkor az igazit is. A megengedőbb ritkábban riaszt, és");
  P_("amikor téved, későn.");
}
P_("");

const felo = elteresek.filter((e) => e.fajta === "csakProtokollban" || e.fajta === "csakKalkulatorban");
if (felo.length) {
  P_("## 2. Amit csak az egyik forrás néz");
  P_("");
  P_("Ez **nem ellentmondás, hanem hatóköri különbség** — de a döntés kihat rá:");
  P_("ha az intézmény a gyorsszűrőt választja, a csak a protokollban szereplő");
  P_("jelek kiesnek.");
  P_("");
  P_("| Mérés | Küszöb | Melyik forrás nézi | Melyik nem |");
  P_("|---|---|---|---|");
  for (const e of felo) {
    const jel = JEL[e.irany];
    const ertek = e.protokoll ?? e.kalkulator;
    const nezi = e.fajta === "csakProtokollban" ? "szepszisprotokoll" : `\`${e.calc}\``;
    const nem = e.fajta === "csakProtokollban" ? `\`${e.calc}\`` : "szepszisprotokoll";
    P_(`| \`${e.var}\` | ${jel} ${ertek} | ${nezi} | ${nem} |`);
  }
  P_("");
}

const egyezo = elteresek.filter((e) => e.fajta === "egyezik");
if (egyezo.length) {
  P_("## 3. Amiben a két forrás egyetért");
  P_("");
  P_("*Nincs miről dönteni — de látnia kell, hogy megnéztük.*");
  P_("");
  for (const e of egyezo) P_(`- \`${e.var}\` ${JEL[e.irany]} ${e.protokoll}`);
  P_("");
}

P_("## 4. Minden küszöb, amit az aláírásnak fednie kell");
P_("");
P_("| Küszöb | Változó | Egység | Összevetve |");
P_("|---|---|---|---|");
for (const k of protokollKuszobei(p)) {
  const c = [...p.screen.criteria, ...p.organDysfunction.criteria].find((x) => x.id === k.honnan)!;
  const jel = kuszobJel(k);
  const kesz = allapot.osszevetetlen.includes(jel) ? "☐" : "☑";
  P_(`| \`${jel}\` | \`${k.var}\` | ${c.unit ?? "—"} | ${kesz} |`);
}
P_("");
P_("Az órához kötött csomag határidői és a gyermekágyi ablak szintén a lenyomat");
P_("részei, tehát az aláírás rájuk is vonatkozik:");
P_("");
for (const s of p.bundle.steps) P_(`- ${s.label.hu} — **${s.withinMinutes} perc**`);
P_(`- a riasztás átvétele — **${p.escalation.acknowledgeWithinMinutes} perc**`);
P_(`- a gyermekágyi ablak — **${p.postpartumWindowDays} nap**`);
P_("");

const elcs = cimkeElcsuszasok(p);
const ido = idobeliJelzok(p);
if (elcs.length || ido.length) {
  P_("## 5. Amit a gép előre megnézett — és nem tud eldönteni");
  P_("");
  for (const c of elcs) {
    P_(`**\`${c.crit}\`** — „${c.cimke}”  `);
    P_(c.miert);
    P_("");
  }
  for (const j of ido) {
    P_(`**\`${j.crit}\`** — időbeli feltétel gépi alak nélkül  `);
    P_(j.miert);
    P_("");
  }
}

P_("## 6. Az intézményi döntés");
P_("");
P_(`**Állapot:** ${dont.allapot} — ${dont.miert}`);
P_("");
P_("A döntés akkor döntés, ha **dokumentumban is megtalálható**. A");
P_("`registry/szepszis/kuszob-dontes.json` ezt tárolja, és lenyomatot vesz");
P_("azokra az eltérésekre, amelyek ismeretében megszületett — ha a küszöbök");
P_("azóta elmozdultak, a döntés **elavulttá válik**, és a rendszer kimondja.");
P_("");
P_(`**Az eltérések mostani lenyomata:** \`${elteresLenyomat(elteresek)}\``);
P_("");
P_("És amit a döntés **nem** tesz: nem tünteti el a másik forrást. A választott");
P_("küszöb lesz a normatív, de az eltérés továbbra is látszik a forrásával");
P_("együtt. Attól, hogy választottunk, a két szám nem lesz egy szám.");
