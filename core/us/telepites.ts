/**
 * MELYIK TÍZ GÖRBÉT TELEPÍTSÜK — a 7. lépés gépi fele.
 *
 * 265 katalogizált görbe, 3 betöltve, és a publikáltak közül 0 hitelesítve.
 * A lépés elfogadási kritériuma „a leggyakrabban használt tíz görbe”, és a
 * kérdés épp az, hogy MELYIK TÍZ. Erre a válasz nem lehet érzés: egy sorrend,
 * amit senki nem tud levezetni, az ülésen újratárgyalódik.
 *
 * A rangsor négy MÉRHETŐ tényezőből áll össze, és mindegyik a rendszer saját
 * adatából jön — nem a katalógusból, mert a katalógus idegen rendszer szokását
 * írja le, nem a mi szükségletünket:
 *
 *   1. KERESLET — hivatkozik-e rá a regiszter, egy kalkulátor vagy egy másik
 *      normogram. Egy görbe, amire nálunk semmi nem mutat, ráér.
 *   2. HIÁNY — van-e már betöltve valami erre a mérésre. Ami hiányzik,
 *      előbbre való, mint ami megvan és „csak” hitelesítetlen.
 *   3. VÁLASZTÁSI TEHER — hány publikált görbe verseng ugyanarra a mérésre.
 *      Tizenkilenc AC-görbéből választani ÜLÉSNAP; egyetlenből öt perc. Ez a
 *      tényező NEM emeli a rangsort: megmondja, mennyibe kerül a tétel.
 *   4. KONVENCIÓKOCKÁZAT — publikáltak-e rá kétféle mérési konvencióval. Ha
 *      igen, a görbe kiválasztása önmagában nem elég: tudni kell, HOGYAN mér
 *      az a gép, ami a mi adatunkat adja. Enélkül a percentilis rendszeresen
 *      téved, és nem véletlenszerűen — egy irányba.
 *
 * A NEGYEDIK A LÉNYEG, és ezt a rangsor külön kiemeli. A többi tényező azt
 * mondja meg, mit érdemes előbb csinálni; ez azt, hogy mit nem szabad
 * elsietni.
 */
import type { Registry } from "../registry.ts";
import type { CataloguedChart, ChartCatalogue } from "./katalogus.ts";
import { chartsFor, measures } from "./katalogus.ts";
import { adPercentilist, hitelesitett } from "./normogram.ts";
import type { Normogram } from "./normogram.ts";

export interface TelepitesiTetel {
  base: string;
  domain: string;
  /** A mi változónk, ha a leképezés megnevezi. `null` = nincs hova tenni. */
  variable: string | null;
  /** Hány publikált görbe verseng erre a mérésre — a választás terhe. */
  katalogizalt: number;
  betoltve: number;
  hitelesitve: number;
  /** Ténylegesen ad-e ma percentilist (hitelesített vagy helyi). */
  adPercentilist: boolean;
  /** Kétféle konvencióval publikáltak rá — a görbeválasztás önmagában kevés. */
  konvenciofuggo: boolean;
  /** Hány katalógustétel NEM jelöli a konvenciót, pedig számít. */
  jeloletlenKonvencio: number;
  /** Van-e ikergörbe a katalógusban. Ha nincs, az ikerméréshez nincs mit adni. */
  vanIker: boolean;
  /** Mire hivatkozik nálunk — ez a KERESLET bizonyítéka, nem feltevés. */
  hivatkozik: string[];
  pont: number;
  /** Miért ennyi. Egy levezethetetlen rangsor újratárgyalódik. */
  indoklas: string;
}

/** Hol hivatkoznak a rendszerben erre a változóra. */
function hivatkozok(
  reg: Registry, normograms: Normogram[], variable: string | null,
): string[] {
  if (!variable) return [];
  const ki: string[] = [];
  let d;
  try { d = reg.get(reg.resolvePrimary(variable)); } catch { d = undefined; }
  if (d) ki.push("regiszter");
  // Levezetett mező bemenete: a görbe hiánya ott továbbgyűrűzik.
  for (const x of reg.all()) {
    if (x.derivation?.inputs?.some((i: { id: string }) => i.id === variable)) {
      ki.push(`levezetés: ${x.id}`);
    }
  }
  // Egy másik normogram alapja (személyre szabott görbe alapgörbéje).
  for (const n of normograms) {
    if (n.parameter === variable && n.adjust?.base) ki.push(`igazított: ${n.id}`);
  }
  return [...new Set(ki)];
}

export function telepitesiSorrend(
  cat: ChartCatalogue, normograms: Normogram[],
  parameterOf: Record<string, string>, reg: Registry,
): TelepitesiTetel[] {
  const out: TelepitesiTetel[] = [];

  for (const base of measures(cat)) {
    const charts: CataloguedChart[] = chartsFor(cat, base);
    const variable = parameterOf[base] ?? null;
    const mine = variable ? normograms.filter((n) => n.parameter === variable) : [];
    const hiv = hivatkozok(reg, normograms, variable);

    const konvenciok = new Set(charts.map((c) => c.convention).filter(Boolean));
    const konvenciofuggo = konvenciok.size > 1;
    const jeloletlen = konvenciofuggo
      ? charts.filter((c) => !c.convention).length : 0;
    const vanIker = charts.some((c) => c.population !== "singleton");

    let pont = 0;
    const okok: string[] = [];

    if (hiv.length) {
      pont += 40 + Math.min(hiv.length - 1, 5) * 4;
      okok.push(`${hiv.length} hivatkozás nálunk (${hiv.join(", ")})`);
    } else {
      okok.push("nálunk SEMMI nem hivatkozik rá — ez a legerősebb halasztási ok");
    }

    if (!mine.some(adPercentilist)) {
      pont += 25;
      okok.push(mine.length
        ? `${mine.length} tábla be van töltve, de percentilist egyik sem ad`
        : "nincs betöltve semmi");
    } else {
      okok.push("már ad percentilist — a hitelesítés itt minőségi, nem hiánypótló lépés");
    }

    // A használat a FORRÁSRENDSZERBEN gyenge jel, de nem semmi: azt mutatja,
    // mit vesznek elő naponta. Szándékosan kis súly — szokás, nem bizonyíték.
    const hasznaltForrasban = charts.filter((c) => c.inUseInSource).length;
    if (hasznaltForrasban) {
      pont += Math.min(hasznaltForrasban, 8);
      okok.push(`${hasznaltForrasban} görbe használatban a forrásrendszerben`);
    }

    if (konvenciofuggo) {
      okok.push(
        `KONVENCIÓFÜGGŐ mérés (${[...konvenciok].join(" / ")}), ` +
        `${jeloletlen} jelöletlen görbével — a választás önmagában nem elég`);
    }
    if (!vanIker) {
      okok.push("ikergörbe NINCS a katalógusban — ikermérésre ez a mérés nem lesz olvasható");
    }

    out.push({
      base, domain: charts[0].domain, variable,
      katalogizalt: charts.length,
      betoltve: mine.length,
      hitelesitve: mine.filter(hitelesitett).length,
      adPercentilist: mine.some(adPercentilist),
      konvenciofuggo, jeloletlenKonvencio: jeloletlen, vanIker,
      hivatkozik: hiv, pont,
      indoklas: okok.join(" · "),
    });
  }

  return out.sort((a, b) =>
    b.pont - a.pont
    || b.katalogizalt - a.katalogizalt
    || a.base.localeCompare(b.base));
}

/** A javasolt első kör. NEM döntés — sorrend, amit az ülés felülírhat. */
export function elsoKor(sorrend: TelepitesiTetel[], n = 10): TelepitesiTetel[] {
  return sorrend.filter((t) => t.hivatkozik.length > 0).slice(0, n);
}

export interface TelepitesMerleg {
  meresek: number;
  gorbek: number;
  kotott: number;
  percentilistAd: number;
  konvenciofuggo: number;
  ikerNelkul: number;
}

export function telepitesMerleg(sorrend: TelepitesiTetel[]): TelepitesMerleg {
  return {
    meresek: sorrend.length,
    gorbek: sorrend.reduce((n, t) => n + t.katalogizalt, 0),
    kotott: sorrend.filter((t) => t.variable).length,
    percentilistAd: sorrend.filter((t) => t.adPercentilist).length,
    konvenciofuggo: sorrend.filter((t) => t.konvenciofuggo).length,
    ikerNelkul: sorrend.filter((t) => !t.vanIker).length,
  };
}
