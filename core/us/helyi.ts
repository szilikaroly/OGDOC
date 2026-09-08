/**
 * A HELYI NORMOGRAM — a 18. lépés gépi fele, és a rendszer önmagára záródása.
 *
 * *Mihez képest mérünk MI, ITT?* Idegen populáción tanított görbe idegen
 * választ ad; a saját adatokból generált a sajátot. A hibrid nézet mind a
 * hármat egyszerre mutatja, és a klinikai döntés az ELTÉRÉSÜKBŐL is
 * születhet.
 *
 * DE A RENDSZER ÖNMAGÁRA ZÁRÓDÁSA NEM CSAK A CÉL — A KOCKÁZAT IS.
 *
 * Egy helyi görbe azt írja le, amit MI mértünk. Ha az osztály ultrahangja
 * vagy mérési technikája rendszeresen néhány százalékkal nagyobbat mér, a
 * helyi görbe ezt a torzítást „normális”-ként rögzíti — és onnantól minden
 * mérés hozzá képest szép. A 17. lépés audit-hurka pedig, ha a helyi görbéhez
 * mérnénk, TÖKÉLETES EGYEZÉST találna: a rendszer önmagával egyezne, és éppen
 * ezt hívná bizonyítéknak.
 *
 * Ezért a helyi görbe önmagában nem elég: a publikálthoz képesti RENDSZERES
 * ELTOLÁST ki kell mondani, és meg kell nevezni, hogy valódi populációs
 * különbség-e vagy mérési torzítás. A gép a különbséget megméri; hogy melyik,
 * azt a biostatisztikus és a klinikai vezető dönti el.
 *
 * ÉS AMIT EZ A LÉPÉS TALÁLT: A SÁVKAPU EGY SÁVVAL ELCSÚSZOTT.
 *
 * A `minPerBin` kapuja megvolt és működött — csak nem ott, ahol kellett. A
 * kiértékelés a LEGKÖZELEBBI sáv elemszámát nézte, az érték viszont a két
 * SZOMSZÉDOS sor KÖZÖTT interpolálódik. A demótáblában a 23. sáv nyolcvan
 * esetes, a 24. húsz, a deklarált minimum ötven: egy 23,5 hetes mérés
 * fele-fele arányban épült a kettőből, mégis átment, mert a legközelebbi sáv
 * a 23. lett. A visszaadott `n: 80` ráadásul azt állította, hogy nyolcvan eset
 * áll mögötte.
 *
 * A ritka sáv nem a közepén kezd rontani, hanem ott, ahol súlyt kap. A javítás
 * ezért MINDKÉT befogó sávot nézi, és a kisebbik esetszámot adja vissza.
 */
import type { Normogram, NormogramRow } from "./normogram.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A SÁV MÖGÖTTI ESETSZÁM ─────────────────────────────────────────── */

export type SavAllapot =
  /** Mindkét befogó sáv eléri a minimumot. */
  | "eleg"
  /** Legalább az egyik befogó sáv a minimum alatt van. */
  | "vekony"
  /** Nincs kiírt sávonkénti elemszám — nem tudjuk, mi van mögötte. */
  | "szamlalasNelkul"
  /** Az x a tábla tartományán kívül esik. */
  | "tartomanyonKivul";

export interface SavAllas {
  allapot: SavAllapot;
  eleg: boolean;
  /** A két befogó sáv x-értéke és elemszáma. */
  savok: Array<{ x: number; n: number | null }>;
  minPerBin: number | null;
  miert: string;
}

/**
 * HÁNY ESET ÁLL EGY ADOTT x MÖGÖTT.
 *
 * A kiértékelés a két szomszédos sor között INTERPOLÁL, tehát egy 23,5 hetes
 * mérés a 23. és a 24. sávból is táplálkozik. Ha az egyik vékony, az eredmény
 * is az — ezért MINDKÉT befogó sávot nézzük, nem a közelebbit. A közelebbi
 * sáv vizsgálata pontosan a felénél tévedne, és éppen ott, ahol a legnagyobb
 * súlyt kapja a másik.
 */
export function savAllas(n: Normogram, x: number): SavAllas {
  const d = n.derivedFrom;
  const rows = [...(n.rows ?? [])].sort((a, b) => a.x - b.x);
  const min = d?.minPerBin ?? null;

  if (!rows.length || x < rows[0].x || x > rows[rows.length - 1].x) {
    return { allapot: "tartomanyonKivul", eleg: false, savok: [], minPerBin: min,
      miert: rows.length
        ? `A(z) ${x} a tábla tartományán (${rows[0].x}–${rows[rows.length - 1].x}) kívül esik.`
        : "A táblának nincs sora." };
  }

  const also = [...rows].reverse().find((r) => r.x <= x)!;
  const felso = rows.find((r) => r.x >= x)!;
  const befogok = also.x === felso.x ? [also] : [also, felso];
  const cnt = d?.countByX;
  const savok = befogok.map((r) => ({
    x: r.x,
    n: cnt && cnt[String(r.x)] !== undefined ? cnt[String(r.x)] : null,
  }));

  if (min === null || savok.some((s) => s.n === null)) {
    return { allapot: "szamlalasNelkul", eleg: false, savok, minPerBin: min,
      miert:
        `Nincs kiírva, hány eset áll a(z) ${savok.map((s) => s.x).join(" és ")} ` +
        `sáv mögött (vagy nincs megnevezett sávminimum). Egy helyi görbe ` +
        `esetszám nélkül nem görbe, hanem vélemény.` };
  }

  const vekony = savok.filter((s) => (s.n as number) < min);
  if (vekony.length) {
    return { allapot: "vekony", eleg: false, savok, minPerBin: min,
      miert:
        `VÉKONY SÁV: ${vekony.map((s) => `x=${s.x}: ${s.n} eset`).join(", ")} — ` +
        `a saját nyilvántartás szerinti minimum ${min}. A tábla ezt a küszöböt ` +
        `maga deklarálta; ez a sáv nem ad percentilist.` };
  }

  return { allapot: "eleg", eleg: true, savok, minPerBin: min,
    miert:
      `${savok.map((s) => `x=${s.x}: ${s.n}`).join(", ")} eset áll mögötte, ` +
      `a minimum ${min}.` };
}

/** Melyik sávok maradnak a minimum alatt. */
export function vekonySavok(n: Normogram): Array<{ x: number; n: number }> {
  const d = n.derivedFrom;
  if (!d?.countByX || !d.minPerBin) return [];
  return Object.entries(d.countByX)
    .map(([x, c]) => ({ x: Number(x), n: c }))
    .filter((s) => s.n < d.minPerBin)
    .sort((a, b) => a.x - b.x);
}

/* ── A PUBLIKÁLTHOZ KÉPESTI ELTOLÁS ─────────────────────────────────── */

export type ElteresFajta =
  /** Az eltérés kicsi és nem egyirányú. */
  | "egyezik"
  /** RENDSZERES eltolás: majdnem minden sáv ugyanabba az irányba tér el. */
  | "rendszeresEltolas"
  /** Nagy, de nem egyirányú eltérés. */
  | "szort"
  /** Nincs közös x-tartomány vagy hiányzik a szórás — nem vethető össze. */
  | "nemOsszevetheto";

export interface Elteres {
  fajta: ElteresFajta;
  /** Hány sávban vetettük össze. */
  savok: number;
  /** Átlagos eltolás, a PUBLIKÁLT tábla szórásában mérve. */
  atlagZ: number;
  /** A legnagyobb abszolút eltolás. */
  maxZ: number;
  /** Hány sáv tér el ugyanabba az irányba. */
  egyIranyba: number;
  miert: string;
}

/**
 * A HELYI ÉS A PUBLIKÁLT GÖRBE ÖSSZEVETÉSE.
 *
 * Az eltolást a PUBLIKÁLT tábla szórásában mérjük, nem milliméterben: egy
 * 3 mm-es eltérés a 20. héten sokkal többet jelent, mint a 40.-en, és a
 * milliméter mind a kettőt ugyanannak mutatná.
 *
 * A RENDSZERESSÉG a lényeg, nem a nagyság. Egy nagy, de szórt eltérés
 * populációs különbség lehet; egy kicsi, de MINDEN SÁVBAN azonos irányú
 * eltolás mérési torzításra utal — és éppen az utóbbi az, ami a helyi görbébe
 * beépülve láthatatlanná válik.
 */
export function elteres(
  helyi: Normogram, publikalt: Normogram, tolerancia = 0.25,
): Elteres {
  const p = new Map((publikalt.rows ?? []).map((r) => [r.x, r]));
  const parok: Array<{ x: number; z: number }> = [];
  for (const r of helyi.rows ?? []) {
    const q = p.get(r.x);
    if (!q || !(q.sd > 0)) continue;
    parok.push({ x: r.x, z: (r.mean - q.mean) / q.sd });
  }

  if (parok.length < 2) {
    return { fajta: "nemOsszevetheto", savok: parok.length, atlagZ: 0, maxZ: 0,
      egyIranyba: 0,
      miert:
        `Csak ${parok.length} közös sáv van a helyi és a publikált tábla között — ` +
        `ennyiből rendszeres eltolás nem állapítható meg. Ez NEM „nincs eltérés”: ` +
        `az összevetés maradt el.` };
  }

  const atlagZ = parok.reduce((s, x) => s + x.z, 0) / parok.length;
  const maxZ = Math.max(...parok.map((x) => Math.abs(x.z)));
  const pozitiv = parok.filter((x) => x.z > 0).length;
  const egyIranyba = Math.max(pozitiv, parok.length - pozitiv);
  const rendszeres = egyIranyba >= Math.ceil(parok.length * 0.9) &&
                     Math.abs(atlagZ) > tolerancia;

  if (rendszeres) {
    return { fajta: "rendszeresEltolas", savok: parok.length, atlagZ, maxZ, egyIranyba,
      miert:
        `RENDSZERES ELTOLÁS: ${egyIranyba}/${parok.length} sáv ugyanabba az ` +
        `irányba tér el, átlagosan ${atlagZ.toFixed(2)} szórásnyit a publikálthoz ` +
        `képest. Ez lehet valódi populációs különbség — és lehet MÉRÉSI ` +
        `TORZÍTÁS, ami a helyi görbébe beépülve „normális”-sá válik. A kettő ` +
        `megkülönböztetése nem gépi feladat, de a kimondása kötelező: enélkül a ` +
        `rendszer a saját torzításához mérné magát, és tökéletes egyezést találna.` };
  }
  if (maxZ > tolerancia * 3) {
    return { fajta: "szort", savok: parok.length, atlagZ, maxZ, egyIranyba,
      miert:
        `Nagy, de nem egyirányú eltérés: a legnagyobb ${maxZ.toFixed(2)} szórásnyi, ` +
        `az átlag viszont csak ${atlagZ.toFixed(2)}. Ez inkább zaj vagy szűk sáv, ` +
        `mint torzítás — de a vékony sávokat érdemes külön megnézni.` };
  }
  return { fajta: "egyezik", savok: parok.length, atlagZ, maxZ, egyIranyba,
    miert:
      `A helyi és a publikált görbe ${parok.length} közös sávban együtt fut ` +
      `(átlagos eltolás ${atlagZ.toFixed(2)}, legnagyobb ${maxZ.toFixed(2)} ` +
      `szórásnyi).` };
}

/* ── A HELYI GÖRBE GENERÁLÁSA ───────────────────────────────────────── */

export interface Meres {
  /** A független változó — jellemzően gesztációs kor hétben. */
  x: number;
  ertek: number;
}

export interface GeneralasOpciok {
  minPerBin: number;
  /** A sáv szélessége az x tengelyen. Egész hét: 1. */
  savSzelesseg?: number;
  /** Hány elfogadott sáv kell legalább, hogy a tábla használható legyen. */
  minSav?: number;
}

export interface Generalas {
  rows: NormogramRow[];
  countByX: Record<string, number>;
  /** Sávok, amik a minimum alatt maradtak — NEM kerülnek a táblába. */
  eldobott: Array<{ x: number; n: number }>;
  osszesMeres: number;
  felhasznaltMeres: number;
  hasznalhato: boolean;
  miert: string;
}

/**
 * SAJÁT MÉRÉSEKBŐL TÁBLA.
 *
 * A vékony sáv NEM kerül bele — nem azért, mert kevés adat rossz adat, hanem
 * mert egy két esetből számolt szórás bármit mond, és az abból született
 * percentilis szám formájában közli a semmit.
 *
 * A szórás MINTASZÓRÁS (n−1 nevezővel). Egy sávra a populációs képlet (n
 * nevezővel) rendszeresen kisebb szórást adna, a percentilisek pedig
 * szélsőségesebbek lennének — pont abba az irányba, ami riasztáshoz vezet.
 */
export function generalHelyi(meresek: Meres[], o: GeneralasOpciok): Generalas {
  const szel = o.savSzelesseg ?? 1;
  const minSav = o.minSav ?? 2;
  const binek = new Map<number, number[]>();
  for (const m of meresek) {
    if (!Number.isFinite(m.x) || !Number.isFinite(m.ertek)) continue;
    const b = Math.round(m.x / szel) * szel;
    (binek.get(b) ?? binek.set(b, []).get(b)!).push(m.ertek);
  }

  const rows: NormogramRow[] = [];
  const countByX: Record<string, number> = {};
  const eldobott: Array<{ x: number; n: number }> = [];
  let felhasznalt = 0;

  for (const x of [...binek.keys()].sort((a, b) => a - b)) {
    const v = binek.get(x)!;
    if (v.length < o.minPerBin || v.length < 2) {
      eldobott.push({ x, n: v.length });
      continue;
    }
    const mean = v.reduce((s, y) => s + y, 0) / v.length;
    const sd = Math.sqrt(v.reduce((s, y) => s + (y - mean) ** 2, 0) / (v.length - 1));
    if (!(sd > 0)) { eldobott.push({ x, n: v.length }); continue; }
    rows.push({ x, mean, sd });
    countByX[String(x)] = v.length;
    felhasznalt += v.length;
  }

  const hasznalhato = rows.length >= minSav;
  return {
    rows, countByX, eldobott,
    osszesMeres: meresek.length, felhasznaltMeres: felhasznalt, hasznalhato,
    miert: hasznalhato
      ? `${rows.length} sáv állt össze ${felhasznalt} mérésből` +
        (eldobott.length
          ? `; ${eldobott.length} sáv a ${o.minPerBin}-es minimum alatt maradt és ` +
            `KIMARADT (${eldobott.map((e) => `x=${e.x}: ${e.n}`).join(", ")})`
          : "") + "."
      : `NEM HASZNÁLHATÓ: mindössze ${rows.length} sáv érte el a ${o.minPerBin}-es ` +
        `minimumot (kell legalább ${minSav}). ${meresek.length} mérésből ` +
        `${felhasznalt} volt felhasználható.`,
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

/**
 * A HELYI TÁBLÁK ELLENŐRZÉSE.
 *
 * Két dolgot mond ki, amit eddig senki: melyik sáv marad a saját maga
 * deklarált minimuma alatt, és mekkora a publikálthoz képesti rendszeres
 * eltolás.
 */
export function validateHelyi(normograms: Normogram[]): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const helyiek = normograms.filter((n) => (n.kind ?? "published") === "local");

  for (const h of helyiek) {
    const vekony = vekonySavok(h);
    if (vekony.length) {
      out.push({
        severity: "warning", id: h.id,
        message:
          `${vekony.length} sáv a saját maga deklarált ${h.derivedFrom!.minPerBin}-es ` +
          `minimum alatt van (${vekony.map((s) => `x=${s.x}: ${s.n}`).join(", ")}). ` +
          `Ezek a sávok NEM adnak percentilist, és a szomszédjukba nyúló ` +
          `interpolált értékek sem.`,
      });
    }
    if (h.derivedFrom && !h.derivedFrom.countByX) {
      out.push({
        severity: "error", id: h.id,
        message:
          `A helyi tábla nem írja ki a SÁVONKÉNTI elemszámot (\`countByX\`). Az ` +
          `összesített \`n\` elrejti, hogy a tartomány szélein két eset áll, ` +
          `középen kétszáz — és a percentilis épp a széleken számít.`,
      });
    }

    // AZ ÖSSZEVETÉS A PUBLIKÁLTTAL. Ha nincs mihez, azt is ki kell mondani:
    // egy össze nem vetett helyi görbe nem „egyezik”, hanem ellenőrizetlen.
    const publikalt = normograms.filter((n) =>
      n.parameter === h.parameter && (n.kind ?? "published") === "published" &&
      (n.rows ?? []).length > 0);
    if (!publikalt.length) {
      out.push({
        severity: "warning", id: h.id,
        message:
          `Nincs publikált tábla ugyanerre a paraméterre (${h.parameter}), amihez ` +
          `a helyi görbét mérni lehetne. Enélkül egy mérési torzítás beépül a ` +
          `görbébe „normális”-ként, és a rendszer a saját torzításához mérné ` +
          `magát — tökéletes egyezést találva.`,
      });
      continue;
    }
    for (const p of publikalt) {
      const e = elteres(h, p);
      if (e.fajta === "rendszeresEltolas") {
        out.push({ severity: "warning", id: h.id,
          message: `A(z) ${p.id} publikált táblához képest: ` + e.miert });
      }
      if (e.fajta === "nemOsszevetheto") {
        out.push({ severity: "warning", id: h.id,
          message: `A(z) ${p.id} publikált táblával: ` + e.miert });
      }
    }
  }
  return out;
}

export interface HelyiMerleg {
  helyiTabla: number;
  savOsszes: number;
  savVekony: number;
  osszevetve: number;
  eltolt: number;
}

export function merleg(normograms: Normogram[]): HelyiMerleg {
  const helyiek = normograms.filter((n) => (n.kind ?? "published") === "local");
  let savOsszes = 0, savVekony = 0, osszevetve = 0, eltolt = 0;
  for (const h of helyiek) {
    savOsszes += (h.rows ?? []).length;
    savVekony += vekonySavok(h).length;
    for (const p of normograms.filter((n) =>
      n.parameter === h.parameter && (n.kind ?? "published") === "published" &&
      (n.rows ?? []).length > 0)) {
      const e = elteres(h, p);
      if (e.fajta !== "nemOsszevetheto") osszevetve++;
      if (e.fajta === "rendszeresEltolas") eltolt++;
    }
  }
  return { helyiTabla: helyiek.length, savOsszes, savVekony, osszevetve, eltolt };
}
