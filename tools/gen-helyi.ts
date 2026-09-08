/**
 * MUNKALAP A HELYI NORMOGRAMOKHOZ — a 18. lépés kimenete.
 *
 * A biostatisztikus és a klinikai vezető ül le vele. Két kérdésre felel: MELYIK
 * SÁV MÖGÖTT ÁLL ELÉG ADAT, és MIT JELENT A PUBLIKÁLTHOZ KÉPESTI ELTOLÁS.
 *
 * Futtatás: `npm run helyi`
 */
import { elteres, merleg, vekonySavok } from "../core/us/helyi.ts";
import { loadNormograms } from "../core/us/normogram.ts";

const all = loadNormograms("registry/normogramok").all();
const helyiek = all.filter((n) => (n.kind ?? "published") === "local");
const m = merleg(all);

const P = (...s: string[]) => console.log(s.join(""));

P("# Munkalap — a helyi normogramok");
P("");
P(`*Generált: \`npm run helyi\`. ${m.helyiTabla} helyi tábla, ${m.savOsszes} sáv `,
  `(${m.savVekony} a saját minimuma alatt) · ${m.eltolt}/${m.osszevetve} `,
  `rendszeresen eltolt a publikálthoz képest.*`);
P("");

P("## A projekt értelme egyetlen mondatban — és a kockázata a másodikban");
P("");
P("*Mihez képest mérünk **mi, itt**?* Idegen populáción tanított görbe idegen");
P("választ ad; a saját adatokból generált a sajátot. A hibrid nézet mind a hármat");
P("egyszerre mutatja, és a klinikai döntés az **eltérésükből** is születhet.");
P("");
P("De a rendszer önmagára záródása nem csak a cél — a **kockázat** is. Egy helyi");
P("görbe azt írja le, amit **mi** mértünk. Ha az osztály ultrahangja vagy mérési");
P("technikája rendszeresen nagyobbat mér, a helyi görbe ezt a torzítást");
P("**„normális”-ként** rögzíti — és onnantól minden mérés hozzá képest szép. A");
P("17. lépés audit-hurka pedig, ha a helyi görbéhez mérnénk, **tökéletes");
P("egyezést** találna: a rendszer önmagával egyezne, és éppen ezt hívná");
P("bizonyítéknak.");
P("");

P("## 1. Amit ez a lépés talált");
P("");
P("**A sávkapu egy sávval elcsúszott.**");
P("");
P("A `minPerBin` kapuja megvolt és működött — csak nem ott, ahol kellett. A");
P("kiértékelés a **legközelebbi** sáv elemszámát nézte, az érték viszont a két");
P("**szomszédos** sor **között** interpolálódik:");
P("");
P("| Gesztációs kor | 23. sáv súlya | 24. sáv súlya | Régi kapu | Új kapu |");
P("|---|---|---|---|---|");
P("| 23,0 | 100% | 0% | átengedi | átengedi |");
P("| 23,4 | 60% | 40% | **átengedi** | blokkol |");
P("| 23,5 | 50% | 50% | **átengedi** | blokkol |");
P("| 23,6 | 40% | 60% | blokkol | blokkol |");
P("");
P("A demótáblában a 23. sáv nyolcvan esetes, a 24. húsz, a deklarált minimum");
P("ötven. Egy 23,5 hetes mérés fele-fele arányban épült a kettőből, mégis");
P("átment — és a visszaadott `n: 80` azt állította, hogy nyolcvan eset áll");
P("mögötte.");
P("");
P("**A ritka sáv nem a közepén kezd rontani, hanem ott, ahol súlyt kap.** A");
P("javítás mindkét befogó sávot nézi, és a **kisebbik** esetszámot adja vissza.");
P("");

P("## 2. A sávok");
P("");
for (const h of helyiek) {
  const v = vekonySavok(h);
  P(`### \`${h.id}\` — ${h.parameter}`);
  P("");
  P(`${(h.rows ?? []).length} sáv, deklarált sávminimum: **${h.derivedFrom?.minPerBin ?? "—"}**`,
    `, összesen ${h.derivedFrom?.n ?? "—"} eset.`);
  P("");
  if (v.length) {
    P(`**${v.length} sáv a minimum alatt:** `,
      v.map((s) => `x=${s.x} (${s.n})`).join(", "), ".");
    P("");
    P("Ezek a sávok nem adnak percentilist — és a **szomszédjukba nyúló**");
    P("interpolált értékek sem.");
  } else {
    P("Minden sáv eléri a minimumot.");
  }
  P("");
  P("**Kizárási szabályok:** ",
    (h.derivedFrom?.exclusion ?? []).join(" · ") || "**nincsenek megadva**");
  P("");
  P("Kizárás nélkül a helyi tábla a **betegek** populációját írja le, nem a");
  P("normálisat — és onnantól a növekedési elmaradás lesz a mérce.");
  P("");
}

P("## 3. A publikálthoz képest");
P("");
P("Az eltolást a **publikált tábla szórásában** mérjük, nem milliméterben: egy");
P("3 mm-es eltérés a 20. héten sokkal többet jelent, mint a 40.-en.");
P("");
P("És a **rendszeresség** a lényeg, nem a nagyság. Egy nagy, de szórt eltérés");
P("populációs különbség lehet; egy kicsi, de **minden sávban azonos irányú**");
P("eltolás mérési torzításra utal — és éppen az utóbbi az, ami a helyi görbébe");
P("beépülve láthatatlanná válik.");
P("");
P("| Helyi tábla | Publikált | Közös sáv | Egy irányba | Átlagos eltolás | Ítélet |");
P("|---|---|---|---|---|---|");
for (const h of helyiek) {
  for (const p of all.filter((n) =>
    n.parameter === h.parameter && (n.kind ?? "published") === "published" &&
    (n.rows ?? []).length > 0)) {
    const e = elteres(h, p);
    P(`| \`${h.id}\` | \`${p.id}\` | ${e.savok} | ${e.egyIranyba} | `,
      `${e.atlagZ.toFixed(2)} SD | **${e.fajta}** |`);
  }
}
P("");
P("**Amit ez NEM dönt el.** Hogy a rendszeres eltolás valódi populációs");
P("különbség-e vagy mérési torzítás, azt gép nem tudja megmondani. A");
P("különbséget megméri; **hogy melyik, azt a biostatisztikus és a klinikai");
P("vezető dönti el** — és a kimondása kötelező, mert enélkül a rendszer a saját");
P("torzításához mérné magát.");
P("");

P("## 4. Ami emberre vár");
P("");
P("- **A helyi görbe alapadata valódi betegadat.** A generált táblák helye a");
P("  `registry/normogramok/helyi/` könyvtár, ami **nem kerül a repóba** — ugyanaz");
P("  a szerkezet, mint a SNOMED-származéknál és a GPLv2-derivált kalkulátornál.");
P("  A repóban álló demótábla **szintetikus**, és a forrása ezt ki is mondja.");
P("- **A rendszeres eltolás megítélése** minden helyi görbénél, aláírva.");
P("- **A sávminimum megválasztása.** A demó 50-et deklarál; hogy mennyi az");
P("  elég, populációfüggő döntés.");
P("- **És maguk a mérések:** azok a 16. lépésből jönnének, ami nem indulhat el.");
