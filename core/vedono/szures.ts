/**
 * TERÜLETI VÉDŐNŐI SZŰRÉS — a naptár, az egyezés és az értesítés.
 *
 * A modul három kaput hoz, és mindhárom ugyanabból a felismerésből:
 * **a védőnő nem az esethez tartozik, hanem a lakcímhez.**
 *
 * 1. AZ ÉRTESÍTÉS. A rendszer ellátási kapcsolat fogalma esetalapú: cselekvő +
 *    eset + időablak. A területi védőnő ettől ELTÉR — a körzet a lakcímből
 *    következik, és a gyerek akkor is az övé, ha még sosem találkoztak. A
 *    hazaadás után határidőn belül fel kell keresnie az újszülöttet; ha nem
 *    tudja, hogy hazaengedték, NEM TUD JÖNNI. A kimaradt első látogatás a
 *    gyermekvédelem legkorábbi jelzője — és ezt a rendszer nem ronthatja el
 *    azzal, hogy nem szólt.
 *
 * 2. AZ ESEDÉKES, BE NEM JEGYZETT LÁTOGATÁS MAGA A JEL. A rendszer eddigi
 *    „elmulasztott vizit” fogalma adminisztratív tény; itt KLINIKAI. Ugyanaz a
 *    szerkezet, mint az ExAssistnál: `megtortent` · `elmaradt` megnevezett
 *    okkal · és a HIÁNYZÓ bejegyzés, ami az egyetlen, ami jelet ad.
 *
 * 3. AZ EGYEZÉS-ELLENŐRZÉS, AMI MÁR A JOGSZABÁLYI ŰRLAPON OTT VAN.
 *
 *    A szülői kérdőív minden kérdésénél két oszlop van: a szülő válasza
 *    (háromértékű), és külön a **„Védőnői tapasztalat: ugyanaz?”**. A védőnő
 *    tehát nem elfogadja a szülő válaszát, hanem a sajátját is rögzíti — és az
 *    ELTÉRÉS maga a lelet.
 *
 *    Ez a 17. lépés audit-hurka kicsiben, és nem mi találtuk ki: 1997 óta ott
 *    van a jogszabály mellékletén. A rendszernek annyi a dolga, hogy ne mossa
 *    össze a két oszlopot — mert egy „a szülő szerint igen, a védőnő szerint
 *    nem” sor többet mond, mint bármelyik válasz külön.
 *
 * ÉS A HÁROMÉRTÉKŰ VÁLASZ. „Igen, rendszeresen” · „Néha” · „Még nem” — a
 * harmadik nem „nem”: fejlődési kérdésnél az ÉLETKOR dönti el, baj-e. A
 * kétértékűvé lapítás pontosan azt a különbséget tüntetné el, amiért a
 * kérdőívet életkoronként külön megírták.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A KÉRDŐÍVEK ─────────────────────────────────────────────────────── */

export interface Kerdes { sorszam: number; kerdes: string; }

export interface Iv {
  id: string;
  honap: number;
  megnevezes: string;
  jogszabaly: string | null;
  vanKerdoiv: boolean;
  kerdesek: Kerdes[];
  szakaszok: string[];
}

export interface KerdoivKeszlet {
  megnevezes: string;
  modul: number;
  forras: string;
  note: string;
  skala: Array<{ kod: string; label_hu: string }>;
  vedonoiEgyezes: { kerdes: string; ertekek: string[] };
  ivek: Iv[];
}

export function loadKerdoivek(path: string): KerdoivKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as KerdoivKeszlet;
}

/* ── A SZŰRÉSI NAPTÁR ────────────────────────────────────────────────── */

export type LatogatasAllapot =
  /** Megvolt, dokumentálva. */
  | "megtortent"
  /** Nem történt meg, MEGNEVEZETT okkal. */
  | "elmaradt"
  /** Esedékes, és nincs bejegyzés. EZ A JEL. */
  | "hianyzik"
  /** Még nem esedékes. */
  | "meg nem esedekes";

export interface Bejegyzes {
  iv: string;
  allapot: "megtortent" | "elmaradt";
  indok?: string;
}

export interface NaptarSor {
  iv: Iv;
  esedekesHonap: number;
  allapot: LatogatasAllapot;
  indok: string | null;
  miert: string;
}

/**
 * A SZŰRÉSI NAPTÁR ÁLLÁSA egy adott életkorban.
 *
 * A `turelmiHonap` nem lazítás: egy 6 hónapos szűrés nem a 180. napon jár le.
 * De a türelmi idő UTÁN a hiány jel — nem statisztika.
 */
export function naptar(
  k: KerdoivKeszlet, korHonap: number, bejegyzesek: Bejegyzes[], turelmiHonap = 1,
): NaptarSor[] {
  const map = new Map(bejegyzesek.map((b) => [b.iv, b]));
  return k.ivek.map((iv) => {
    const b = map.get(iv.id);
    if (b) {
      return {
        iv, esedekesHonap: iv.honap, allapot: b.allapot, indok: b.indok ?? null,
        miert: b.allapot === "megtortent"
          ? `${iv.honap} hónapos szűrés megtörtént.`
          : `${iv.honap} hónapos szűrés ELMARADT${b.indok ? `: ${b.indok}` : ""}.`,
      };
    }
    if (korHonap < iv.honap + turelmiHonap) {
      return { iv, esedekesHonap: iv.honap, allapot: "meg nem esedekes", indok: null,
        miert: `${iv.honap} hónapos szűrés még nem esedékes.` };
    }
    return {
      iv, esedekesHonap: iv.honap, allapot: "hianyzik", indok: null,
      miert:
        `${iv.honap} HÓNAPOS SZŰRÉS ESEDÉKES VOLT, ÉS NINCS BEJEGYZÉS. Ez nem ` +
        `adminisztratív hiány: a meg nem jelenő család a gyermekvédelem legkorábbi ` +
        `jelzője. Ha elmaradt, azt meg kell nevezni — a hallgatás nem válasz.`,
    };
  });
}

export interface NaptarMerleg {
  osszes: number;
  megtortent: number;
  elmaradt: number;
  /** ESEDÉKES ÉS HIÁNYZÓ — ez a szám a jel. */
  hianyzik: number;
  jel: boolean;
}

export function naptarMerleg(sorok: NaptarSor[]): NaptarMerleg {
  const n = (a: LatogatasAllapot) => sorok.filter((s) => s.allapot === a).length;
  const hianyzik = n("hianyzik");
  return {
    osszes: sorok.length, megtortent: n("megtortent"), elmaradt: n("elmaradt"),
    hianyzik, jel: hianyzik > 0,
  };
}

/* ── AZ EGYEZÉS-ELLENŐRZÉS ───────────────────────────────────────────── */

export type SzuloValasz = "rendszeresen" | "neha" | "megNem";

export interface Valasz {
  sorszam: number;
  /** Amit a SZÜLŐ mond. */
  szulo?: SzuloValasz;
  /** A védőnő SAJÁT észlelése ugyanaz-e. */
  vedonoiEgyezes?: boolean;
}

export type EgyezesAllapot =
  | "egyezik"
  /** A szülő és a védőnő mást lát. EZ A LELET. */
  | "elter"
  /** A védőnő nem rögzítette a saját észlelését. */
  | "vedonoiEszlelesNelkul"
  /** A szülő nem válaszolt. */
  | "szuloNemValaszolt";

export interface EgyezesSor {
  sorszam: number;
  kerdes: string;
  szulo: SzuloValasz | null;
  allapot: EgyezesAllapot;
  miert: string;
}

/**
 * A SZÜLŐ VÁLASZA ÉS A VÉDŐNŐ ÉSZLELÉSE EGYMÁS MELLETT.
 *
 * A kettőt NEM vonjuk össze, és nem is döntünk köztük. Az eltérés maga az
 * információ: „a szülő szerint igen, a védőnő szerint nem” többet mond, mint
 * bármelyik válasz külön — és lehet, hogy a szülő látja jobban a gyereket, meg
 * az is, hogy nem meri kimondani.
 */
export function egyezes(iv: Iv, valaszok: Valasz[]): EgyezesSor[] {
  const map = new Map(valaszok.map((v) => [v.sorszam, v]));
  return iv.kerdesek.map((k) => {
    const v = map.get(k.sorszam);
    const rovid = k.kerdes.length > 70 ? k.kerdes.slice(0, 70) + "…" : k.kerdes;
    if (!v || v.szulo === undefined) {
      return { sorszam: k.sorszam, kerdes: k.kerdes, szulo: null,
        allapot: "szuloNemValaszolt" as EgyezesAllapot,
        miert: `${k.sorszam}. „${rovid}” — a szülő nem válaszolt.` };
    }
    if (v.vedonoiEgyezes === undefined) {
      return { sorszam: k.sorszam, kerdes: k.kerdes, szulo: v.szulo,
        allapot: "vedonoiEszlelesNelkul" as EgyezesAllapot,
        miert:
          `${k.sorszam}. „${rovid}” — a szülő válaszolt, a védőnő SAJÁT észlelése ` +
          `viszont nincs rögzítve. Az űrlapon ez külön oszlop, és nem véletlenül: ` +
          `az egyezés-ellenőrzés e nélkül elmarad.` };
    }
    if (!v.vedonoiEgyezes) {
      return { sorszam: k.sorszam, kerdes: k.kerdes, szulo: v.szulo,
        allapot: "elter" as EgyezesAllapot,
        miert:
          `${k.sorszam}. „${rovid}” — ELTÉRÉS: a szülő „${v.szulo}”, a védőnő ` +
          `észlelése MÁS. Ez maga a lelet — nem kell eldönteni, melyik igaz.` };
    }
    return { sorszam: k.sorszam, kerdes: k.kerdes, szulo: v.szulo,
      allapot: "egyezik" as EgyezesAllapot,
      miert: `${k.sorszam}. egyezik („${v.szulo}”).` };
  });
}

export interface EgyezesMerleg {
  kerdes: number;
  egyezik: number;
  elter: number;
  eszlelesNelkul: number;
  nemValaszolt: number;
  /** Kiadható-e a lelet: minden kérdésnél van szülői válasz ÉS védőnői észlelés. */
  teljes: boolean;
}

export function egyezesMerleg(sorok: EgyezesSor[]): EgyezesMerleg {
  const n = (a: EgyezesAllapot) => sorok.filter((s) => s.allapot === a).length;
  const eszlelesNelkul = n("vedonoiEszlelesNelkul");
  const nemValaszolt = n("szuloNemValaszolt");
  return {
    kerdes: sorok.length, egyezik: n("egyezik"), elter: n("elter"),
    eszlelesNelkul, nemValaszolt,
    teljes: sorok.length > 0 && eszlelesNelkul === 0 && nemValaszolt === 0,
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateKerdoivek(k: KerdoivKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const korok = k.ivek.map((i) => i.honap);
  const dup = korok.filter((x, i) => korok.indexOf(x) !== i);
  if (dup.length) {
    out.push({ severity: "error", id: "vedono.naptar.dup",
      message:
        `Két szűrési időpont ugyanarra az életkorra (${[...new Set(dup)].join(", ")} ` +
        `hónap). A naptárban ez elrontja a kimaradt látogatás megállapítását: nem ` +
        `tudni, melyik maradt ki.` });
  }
  for (const iv of k.ivek) {
    if (iv.vanKerdoiv && !iv.kerdesek.length) {
      out.push({ severity: "error", id: `vedono.${iv.id}`,
        message:
          `A(z) ${iv.honap} hónapos űrlap kérdőívet ígér, de egy kérdés sincs ` +
          `beolvasva. A szűrés így megtörténhet anélkül, hogy a szülőt bármiről ` +
          `megkérdeznék.` });
    }
    if (!iv.jogszabaly) {
      out.push({ severity: "warning", id: `vedono.${iv.id}.jogszabaly`,
        message: `A(z) ${iv.honap} hónapos űrlapnál nincs jogszabályi hivatkozás.` });
    }
  }
  return out;
}
