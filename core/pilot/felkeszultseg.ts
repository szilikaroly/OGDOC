/**
 * A PILOT FELKÉSZÜLTSÉGE — a 16. lépés gépi fele.
 *
 * A lépés az első, ami BETEG-AZONOSÍTÁSRA ALKALMAS ADATOT érint, és a terv
 * ehhez öt előfeltételt szab: tároló (1.), adatvédelmi döntések (3.),
 * számítási hitelesítések (6–8.), megőrzés (10.) és riasztási rend (15.).
 * A gép ebből pontosan két dolgot tud elvégezni, és egyet sem többet:
 *
 *   1. MEGMONDANI, MELYIK ELŐFELTÉTEL ÁLL — a rendszer saját, élő
 *      bizonyítékbázisából, nem egy jelölőnégyzetből.
 *   2. MEGAKADÁLYOZNI, HOGY A PILOT ELINDULJON, amíg bármelyik hiányzik.
 *
 * Amit NEM tud: osztályt választani, vezetőt találni, és megítélni, hogy a
 * klinikusok bíznak-e benne. Ezek a mezők a nyilvántartásban ÜRESEN állnak.
 *
 * A KÉT DOLOG, AMI EBBŐL A LÉPÉSBŐL KIDERÜLT
 *
 * ELŐSZÖR: AZ ÖT ELŐFELTÉTEL NEM ELÉG. Mind az öt teljesülhet úgy, hogy a
 * rendszer valódi adaton mégsem futhat — mert a HITELESÍTÉS nincs köztük. A
 * cselekvő kilétét ma egyetlen ellenőrizetlen kérésfejléc állítja, és a
 * kiszolgáló épp ezért `OGDOC_SYNTHETIC=1` nélkül el sem indul. A felsorolás
 * nem téved, csak hiányos — és ez a hiány pont ott van, ahol a lépés
 * definíció szerint valódi adathoz nyúlna. Ezért ez a modul a tervben
 * felsorolt öt mellett külön tartja a KIMONDATLAN előfeltételeket, és a kapu
 * mindkét halmazt megköveteli.
 *
 * MÁSODSZOR: A HÁROM ZÁRÁSI KRITÉRIUMBÓL EGY SEM MÉRHETŐ MAGÁTÓL.
 *
 *   „nem veszített adatot”     — horgony nélkül a levágott vég ÉP láncnak
 *                                látszik; l. `horgony.ts`
 *   „nem kerülték ki”          — a rendszer csak a SZÁMLÁLÓT ismeri; a
 *                                nevező (hány esetet láttak el valójában)
 *                                kívülről jön, és nélküle a hányados nem
 *                                pontatlan, hanem értelmetlen
 *   „mondott valamit, amit a   — ez a 15. lépéstől FÜGG: amíg egyetlen
 *    klinikus nem vett észre”    riasztástípus sem kiadható, a rendszer meg
 *                                sem szólal, tehát a kritérium nem
 *                                teljesítetlen, hanem ELÉRHETETLEN
 *
 * A hiányzó mérés sehol nem „teljesült”. A pilot végén a „nem veszítettünk
 * adatot” és a „nem mértük, veszítettünk-e” két különböző mondat, és éppen a
 * pilot az, aminek ezt a kettőt szét kell választania.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { Bizonyitek } from "../ett/dosszie.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface Elofeltetel {
  id: string;
  /** Melyik tervlépés hozza. A kimondatlanoknál nincs. */
  lepes?: number | string;
  megnevezes: string;
  /** Élő bizonyítékkulcsok — MIND kell hozzá. */
  bizonyitek: string[];
  miert: string;
}

/** Ki tudja megválaszolni a zárási kritériumot. */
export type ZarasForras = "rendszer" | "szervezet" | "vegyes";

export interface ZarasiKriterium {
  id: string;
  kriterium: string;
  forras: ZarasForras;
  meres: string;
  /** Amit a rendszeren KÍVÜLRŐL kell megadni, különben a mérés értelmetlen. */
  nevezo?: string;
  /** Egy előfeltétel azonosítója, ami nélkül a kritérium ELÉRHETETLEN. */
  fugg?: string;
  /**
   * Egy előfeltétel azonosítója, ami nélkül a kritérium teljesülhet, de nem
   * MÉRHETŐ. A kettő nem ugyanaz, és a különbség itt a lényeg: az elérhetetlen
   * kritériumot nem lehet teljesíteni, a mérhetetlent viszont lehet — csak
   * nem lehet TUDNI róla, és a végén magától „teljesült”-nek fog látszani.
   */
  meresFugg?: string;
  megjegyzes?: string;
}

export interface Pilot {
  megnevezes: string;
  lepes: number;
  /** Az osztály. Gép nem tölti ki. */
  osztaly: string | null;
  /** A vezető, aki vállalja. Gép nem tölti ki. */
  vezeto: string | null;
  kezdet: string | null;
  hetek: number;
  elofeltetelek: Elofeltetel[];
  kimondatlan: Elofeltetel[];
  zarasi: ZarasiKriterium[];
}

export function loadPilot(path: string): Pilot {
  return JSON.parse(readFileSync(path, "utf8")) as Pilot;
}

/* ── AZ ELŐFELTÉTELEK ÁLLÁSA ─────────────────────────────────────────── */

export type ElofeltetelAllapot =
  /** Minden hozzá tartozó bizonyíték megvan. */
  | "teljesult"
  /** Van bizonyíték, de nem mind. */
  | "hianyos"
  /** Egyetlen bizonyítéka sincs meg. */
  | "nemTeljesult"
  /** A hivatkozott bizonyítékkulcs nem létezik — nyilvántartási hiba. */
  | "ismeretlenBizonyitek";

export interface ElofeltetelAllas {
  id: string;
  megnevezes: string;
  lepes?: number | string;
  /** A tervben felsorolt öt, vagy a rendszer által kikényszerített többlet. */
  kimondatlan: boolean;
  allapot: ElofeltetelAllapot;
  all: boolean;
  megvan: string[];
  hianyzik: string[];
  /** MINDEN hivatkozott bizonyíték mért értéke — a teljes kép. */
  ertekek: string[];
  /**
   * Csak a HIÁNYZÓK mért értéke. Külön mező, mert egy „ami hiányzik” feliratú
   * oszlopba a meglévőket is beírni pontosan az a fajta összemosás, amit ez a
   * réteg végig el akar kerülni.
   */
  hianyErtekek: string[];
  miert: string;
}

function allas(e: Elofeltetel, biz: Bizonyitek[], kimondatlan: boolean): ElofeltetelAllas {
  const map = new Map(biz.map((b) => [b.kulcs, b]));
  const ismeretlen = e.bizonyitek.filter((k) => !map.has(k));
  const megvan = e.bizonyitek.filter((k) => map.get(k)?.megvan);
  const hianyzik = e.bizonyitek.filter((k) => map.has(k) && !map.get(k)!.megvan);
  const ertekek = e.bizonyitek.map((k) =>
    map.has(k) ? `${k}: ${map.get(k)!.ertek}` : `${k}: ISMERETLEN KULCS`);

  const allapot: ElofeltetelAllapot = ismeretlen.length
    ? "ismeretlenBizonyitek"
    : hianyzik.length === 0 ? "teljesult"
      : megvan.length ? "hianyos" : "nemTeljesult";

  const hiany = [...hianyzik, ...ismeretlen];
  return {
    id: e.id, megnevezes: e.megnevezes, lepes: e.lepes, kimondatlan,
    allapot, all: allapot === "teljesult",
    megvan, hianyzik: hiany, ertekek,
    hianyErtekek: ertekek.filter((x) => hiany.some((k) => x.startsWith(k + ":"))),
    miert: e.miert,
  };
}

export function elofeltetelek(p: Pilot, biz: Bizonyitek[]): ElofeltetelAllas[] {
  return [
    ...p.elofeltetelek.map((e) => allas(e, biz, false)),
    ...p.kimondatlan.map((e) => allas(e, biz, true)),
  ];
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export interface Indithatosag {
  indithato: boolean;
  /** Megnevezett akadályok — sorrendben, a tervbeliek elöl. */
  akadalyok: string[];
  /** Amit ember dönt el, és a nyilvántartásban üresen áll. */
  szervezeti: string[];
  miert: string;
}

/**
 * ELINDULHAT-E A PILOT.
 *
 * A kapu KIZÁRÓLAG a bizonyítékbázisból nyílik — nincs olyan mező a
 * nyilvántartásban, amit átbillentve „kész”-re lehetne állítani. Ez ugyanaz a
 * szerkezet, mint a labor-referenciáknál, a normogramoknál, a
 * kalkulátoroknál, a szepszisküszöböknél, a megőrzésnél és a
 * mérőeszköz-licenceknél: a kapu adatból nyílik, nem szóból.
 *
 * ÉS AMIÉRT ITT MÁS A TÉT. Máshol a kapu azt akadályozza meg, hogy a rendszer
 * ROSSZ SZÁMOT mondjon. Itt azt, hogy VALÓDI BETEGADAT kerüljön egy olyan
 * rendszerbe, amiből utólag nem szedhető ki. A hibás számítás javítható; a
 * jogalap nélkül felvett adat nem lesz visszamenőleg jogszerű.
 */
export function indithato(p: Pilot, allasok: ElofeltetelAllas[]): Indithatosag {
  const akadalyok = allasok
    .filter((a) => !a.all)
    .sort((a, b) => Number(a.kimondatlan) - Number(b.kimondatlan))
    .map((a) =>
      `${a.kimondatlan ? "[kimondatlan] " : `[${a.lepes}. lépés] `}` +
      `${a.megnevezes} — hiányzik: ${a.hianyzik.join(", ")}`);

  const szervezeti: string[] = [];
  if (!p.osztaly) szervezeti.push("Nincs kijelölt osztály.");
  if (!p.vezeto) szervezeti.push("Nincs vezető, aki vállalja.");
  if (!p.kezdet) szervezeti.push("Nincs kezdődátum.");

  const indithato = akadalyok.length === 0 && szervezeti.length === 0;
  return {
    indithato, akadalyok, szervezeti,
    miert: indithato
      ? `A pilot elindulhat: mind a(z) ${allasok.length} előfeltétel áll, és ` +
        `az osztály, a vezető és a kezdés is ki van jelölve.`
      : akadalyok.length
        ? `A PILOT NEM INDULHAT: ${akadalyok.length} előfeltétel hiányzik a(z) ` +
          `${allasok.length}-ból` +
          (szervezeti.length ? `, és ${szervezeti.length} szervezeti döntés is hiányzik` : "") +
          `. Ez az első lépés, ami valódi betegadatot érint — amit itt ` +
          `elrontunk, azt utólag nem lehet visszacsinálni.`
        : `A pilot műszaki előfeltételei állnak, de ${szervezeti.length} ` +
          `szervezeti döntés hiányzik. Ezeket gép nem hozhatja meg.`,
  };
}

/* ── A ZÁRÁSI KRITÉRIUMOK MÉRHETŐSÉGE ────────────────────────────────── */

export type MeresAllapot =
  /** A rendszer önmagából meg tudja mérni. */
  | "merheto"
  /** Mérhető, de a nevező kívülről kell — enélkül a szám értelmetlen. */
  | "nevezoHianyzik"
  /** Egy előfeltétel hiánya miatt a kritérium nem is teljesíthető. */
  | "elerhetetlen"
  /** Teljesülhet, de nincs mivel megmérni — a hiánya csendes marad. */
  | "meroeszkozNelkul"
  /** Csak ember tudja megítélni; a rendszer legfeljebb alátámasztja. */
  | "csakEmberi";

export interface ZarasAllas {
  id: string;
  kriterium: string;
  allapot: MeresAllapot;
  /** Mérhető-e MA, ahogy a rendszer most áll. */
  merheto: boolean;
  meres: string;
  miert: string;
}

/**
 * MIVEL MÉRNÉNK — a pilot ELŐTT tisztázva, nem a végén.
 *
 * A záráskor kimondott „minden rendben ment” pontosan annyit ér, amennyit a
 * mérése. Ha a mérési mód a pilot végén dől el, akkor azt választjuk, ami épp
 * kijön — és a kritérium elveszti az értelmét.
 */
export function zarasAllas(p: Pilot, allasok: ElofeltetelAllas[]): ZarasAllas[] {
  return p.zarasi.map((z) => {
    const fugg = z.fugg ? allasok.find((a) => a.id === z.fugg) : undefined;
    if (fugg && !fugg.all) {
      return {
        id: z.id, kriterium: z.kriterium, allapot: "elerhetetlen" as MeresAllapot,
        merheto: false, meres: z.meres,
        miert:
          `ELÉRHETETLEN, nem csak teljesítetlen: a(z) „${fugg.megnevezes}” ` +
          `előfeltétel nem áll (${fugg.ertekek.join("; ")}). A rendszer meg sem ` +
          `szólal, tehát nem lehet olyan eset, amit ez a kritérium kér.`,
      };
    }
    const meresFugg = z.meresFugg ? allasok.find((a) => a.id === z.meresFugg) : undefined;
    if (meresFugg && !meresFugg.all) {
      return {
        id: z.id, kriterium: z.kriterium, allapot: "meroeszkozNelkul" as MeresAllapot,
        merheto: false, meres: z.meres,
        miert:
          `TELJESÜLHET, DE NEM MÉRHETŐ: a(z) „${meresFugg.megnevezes}” ` +
          `hiányzik (${meresFugg.ertekek.join("; ")}). A kritérium a pilot ` +
          `végén magától „teljesült”-nek fog látszani — és épp ez az a hiba, ` +
          `amit ennek a kritériumnak ki kellene zárnia.`,
      };
    }
    if (z.forras === "szervezet") {
      return {
        id: z.id, kriterium: z.kriterium, allapot: "csakEmberi" as MeresAllapot,
        merheto: false, meres: z.meres,
        miert: z.megjegyzes ?? "Ezt a kritériumot ember ítéli meg, nem gép.",
      };
    }
    if (z.nevezo) {
      return {
        id: z.id, kriterium: z.kriterium, allapot: "nevezoHianyzik" as MeresAllapot,
        merheto: false, meres: z.meres,
        miert:
          `A nevező a rendszeren KÍVÜLRŐL jön: ${z.nevezo} ` +
          (z.megjegyzes ? z.megjegyzes : ""),
      };
    }
    return {
      id: z.id, kriterium: z.kriterium, allapot: "merheto" as MeresAllapot,
      merheto: true, meres: z.meres,
      miert: z.megjegyzes ?? "A rendszer önmagából meg tudja mérni.",
    };
  });
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validatePilot(
  p: Pilot, biz: Bizonyitek[], allasok: ElofeltetelAllas[], zarasok: ZarasAllas[],
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const kulcsok = new Set(biz.map((b) => b.kulcs));

  // 1. ISMERETLEN BIZONYÍTÉKKULCS — nyilvántartási hiba, nem hiányzó bizonyíték.
  //    A kettő megkülönböztetése azért kell, mert az elgépelt kulcs CSENDBEN
  //    úgy néz ki, mint egy még nem teljesült előfeltétel.
  for (const e of [...p.elofeltetelek, ...p.kimondatlan]) {
    for (const k of e.bizonyitek) {
      if (!kulcsok.has(k)) {
        out.push({
          severity: "error", id: `pilot.${e.id}.${k}`,
          message:
            `A(z) „${e.megnevezes}” előfeltétel a(z) „${k}” bizonyítékra ` +
            `hivatkozik, ilyen kulcs viszont nincs. Ez nem hiányzó előfeltétel, ` +
            `hanem elgépelt hivatkozás — és épp úgy néz ki, mint egy még nem ` +
            `teljesült feltétel, ezért kell külön kimondani.`,
        });
      }
    }
  }

  // 2. A KAPU ÁLLÁSA. Amíg akadály van, ez FIGYELMEZTETÉS, nem hiba: a rendszer
  //    állapota nem hibás attól, hogy a pilot még nem indulhat.
  const ind = indithato(p, allasok);
  if (!ind.indithato) {
    out.push({
      severity: "warning", id: "pilot.kapu",
      message: ind.miert + (ind.akadalyok.length ? " — " + ind.akadalyok.join(" · ") : ""),
    });
  }

  // 3. A MÉRHETETLEN ZÁRÁSI KRITÉRIUM. Ez a lépés legfontosabb figyelmeztetése:
  //    egy kritérium, aminek nincs mérése, a pilot végén AUTOMATIKUSAN
  //    „teljesült”-nek fog látszani.
  for (const z of zarasok.filter((x) => !x.merheto)) {
    out.push({
      severity: "warning", id: `pilot.zaras.${z.id}`,
      message:
        `A(z) „${z.kriterium}” zárási kritérium ma NEM MÉRHETŐ (${z.allapot}): ` +
        z.miert + " A hiányzó mérés nem „teljesült” — a pilot végén ezt a " +
        "különbséget kell kimondani.",
    });
  }

  // 4. AMI EMBERRE VÁR.
  for (const sz of ind.szervezeti) {
    out.push({ severity: "warning", id: "pilot.szervezeti", message: sz });
  }
  return out;
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface PilotMerleg {
  elofeltetel: number;
  allo: number;
  tervbeli: number;
  tervbeliAllo: number;
  kimondatlan: number;
  kimondatlanAllo: number;
  zarasi: number;
  merheto: number;
  indithato: boolean;
}

export function merleg(
  allasok: ElofeltetelAllas[], zarasok: ZarasAllas[], ind: Indithatosag,
): PilotMerleg {
  const terv = allasok.filter((a) => !a.kimondatlan);
  const kim = allasok.filter((a) => a.kimondatlan);
  return {
    elofeltetel: allasok.length,
    allo: allasok.filter((a) => a.all).length,
    tervbeli: terv.length, tervbeliAllo: terv.filter((a) => a.all).length,
    kimondatlan: kim.length, kimondatlanAllo: kim.filter((a) => a.all).length,
    zarasi: zarasok.length, merheto: zarasok.filter((z) => z.merheto).length,
    indithato: ind.indithato,
  };
}
