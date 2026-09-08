/**
 * A TERÜLETI VÉDŐNŐ ÉRTESÍTÉSE — a kapu, ami kifelé szól, mielőtt késő lenne.
 *
 * A rendszer ellátási kapcsolat fogalma ESETALAPÚ: cselekvő + eset + időablak.
 * A területi védőnő ettől eltér, és ez a modul egyetlen szerkezeti kérdése:
 *
 *   A KÖRZETI VÉDŐNŐ NEM AZ ESETHEZ TARTOZIK, HANEM A LAKCÍMHEZ.
 *
 * A gyerek akkor is az övé, ha még sosem találkoztak — a körzet a lakcímből
 * következik, nem abból, hogy ki vette fel a beteget. Ezért az értesítés nem
 * udvariassági kérdés: a hazaadás után a védőnőnek MEGADOTT HATÁRIDŐN BELÜL
 * fel kell keresnie az újszülöttet, és HA NEM TUDJA, HOGY HAZAENGEDTÉK, NEM
 * TUD JÖNNI.
 *
 * A kimaradt első látogatás a gyermekvédelem legkorábbi jelzője. A rendszernek
 * ezt nem szabad azzal elrontania, hogy nem szólt — és ez az a hiba, amit egy
 * dokumentációs rendszer a legkönnyebben elkövet: mindent rögzít, és senkinek
 * nem szól.
 *
 * A HÁROM ÉRTESÍTÉSI PONT, ÉS AMELYIK KÖTELEZŐ
 *
 *   várandósgondozás kezdete   előre szólni a legjobb — a kapcsolat a szülés
 *                              ELŐTT épül ki
 *   születés                   ha az intézmény és a körzet ismert
 *   HAZAADÁS                   KÖTELEZŐ ÉS AZONNALI
 *
 * ÉS AMI NÉLKÜL EGYIK SEM MEGY: a körzet. Lakcím nélkül nincs körzet, körzet
 * nélkül nincs kinek szólni — és ilyenkor a rendszer nem hallgat, hanem
 * MEGNEVEZI, hogy nem tudja, kit értesítsen.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface ErtesitesiPont {
  id: string;
  mikor: string;
  kotelezo: boolean;
  oraKeslekedes?: number;
  miert: string;
}

export interface Korzet {
  /** Körzetazonosító — a jogszabályi űrlap fejlécében is ez áll. */
  azonosito: string;
  vedonoNeve: string;
  szolgalat: string;
  telefon?: string;
  email?: string;
}

export interface KorzetKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  kereso: { megnevezes: string; url: string; hasznalat: string | null; megjegyzes: string };
  ertesitesek: ErtesitesiPont[];
  korzetek: Korzet[];
}

export function loadKorzet(path: string): KorzetKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as KorzetKeszlet;
}

/* ── A KÖRZET MEGÁLLAPÍTÁSA ──────────────────────────────────────────── */

export type KorzetAllapot =
  | "megvan"
  /** Nincs lakcím — körzetet sem lehet megállapítani. */
  | "lakcimNelkul"
  /** Van lakcím, de a körzet nincs a nyilvántartásban. */
  | "ismeretlenKorzet";

export interface KorzetItelet {
  allapot: KorzetAllapot;
  korzet: Korzet | null;
  miert: string;
}

export function korzethez(
  k: KorzetKeszlet, lakcim: string | null, korzetAzonosito: string | null,
): KorzetItelet {
  if (!lakcim?.trim()) {
    return { allapot: "lakcimNelkul", korzet: null,
      miert:
        "NINCS LAKCÍM, ezért körzetet sem lehet megállapítani. A területi védőnő " +
        "a lakcímhez tartozik, nem az esethez — enélkül nincs kinek szólni." };
  }
  const c = korzetAzonosito
    ? k.korzetek.find((x) => x.azonosito === korzetAzonosito)
    : undefined;
  if (!c) {
    return { allapot: "ismeretlenKorzet", korzet: null,
      miert:
        `Van lakcím, de a körzet nincs a nyilvántartásban` +
        `${korzetAzonosito ? ` („${korzetAzonosito}”)` : ""}. A kereső ` +
        `(${k.kereso.megnevezes}) nyilvános, de hogy a rendszer GÉPI úton ` +
        `kérdezi-e le, az szervezeti és adatvédelmi döntés: a lekérdezés a beteg ` +
        `LAKCÍMÉT viszi ki egy külső szolgáltatáshoz. Amíg ez nincs kimondva, a ` +
        `körzetet kézzel kell rögzíteni.` };
  }
  return { allapot: "megvan", korzet: c,
    miert: `${c.vedonoNeve} (${c.szolgalat}, körzet ${c.azonosito}).` };
}

/* ── AZ ÉRTESÍTÉS ────────────────────────────────────────────────────── */

export type EsemenyFajta = "varandosGondozasKezdete" | "szuletes" | "hazaadas";

export interface Ertesites {
  esemeny: EsemenyFajta;
  /** Mikor küldtük el. `null` = nem küldtük. */
  elkuldve: string | null;
}

export type ErtesitesAllapot =
  | "elkuldve"
  /** Kötelező értesítés, és nem ment el. */
  | "elmaradt"
  /** Nem kötelező, és nem ment el. */
  | "kihagyva"
  /** Nincs kinek szólni. */
  | "cimzettNelkul"
  /** Az esemény még nem történt meg. */
  | "meg nem esedekes";

export interface ErtesitesAllas {
  pont: ErtesitesiPont;
  allapot: ErtesitesAllapot;
  miert: string;
}

/**
 * AZ ÉRTESÍTÉSEK ÁLLÁSA.
 *
 * A hazaadási értesítés elmaradása HIBA, nem figyelmeztetés — ez az egyetlen
 * pont ebben a modulban, ahol a rendszer mulasztása közvetlenül azt okozza,
 * hogy egy újszülöttet nem keres fel senki.
 */
export function ertesitesAllas(
  k: KorzetKeszlet, megtortent: EsemenyFajta[], kuldott: Ertesites[],
  korzet: KorzetItelet,
): ErtesitesAllas[] {
  const map = new Map(kuldott.map((e) => [e.esemeny, e]));
  return k.ertesitesek.map((p) => {
    const fajta = p.mikor as EsemenyFajta;
    if (!megtortent.includes(fajta)) {
      return { pont: p, allapot: "meg nem esedekes" as ErtesitesAllapot,
        miert: `A(z) „${p.mikor}” esemény még nem történt meg.` };
    }
    const e = map.get(fajta);
    if (e?.elkuldve) {
      return { pont: p, allapot: "elkuldve" as ErtesitesAllapot,
        miert: `Elküldve: ${e.elkuldve}.` };
    }
    if (korzet.allapot !== "megvan") {
      return { pont: p, allapot: "cimzettNelkul" as ErtesitesAllapot,
        miert:
          `NINCS KINEK SZÓLNI: ${korzet.miert} Ez nem menti fel a rendszert — ` +
          `a körzet megállapítása is feladat, nem adottság.` };
    }
    if (p.kotelezo) {
      return { pont: p, allapot: "elmaradt" as ErtesitesAllapot,
        miert:
          `A KÖTELEZŐ ÉRTESÍTÉS ELMARADT (${p.mikor}). ${p.miert} Ez az a pont, ` +
          `ahol a rendszer mulasztása közvetlenül azt okozza, hogy egy ` +
          `újszülöttet nem keres fel senki.` };
    }
    return { pont: p, allapot: "kihagyva" as ErtesitesAllapot,
      miert: `Nem kötelező értesítés, nem ment el. ${p.miert}` };
  });
}

export interface ErtesitesMerleg {
  pont: number;
  elkuldve: number;
  kotelezoElmaradt: number;
  cimzettNelkul: number;
  rendben: boolean;
}

export function ertesitesMerleg(allasok: ErtesitesAllas[]): ErtesitesMerleg {
  const n = (a: ErtesitesAllapot) => allasok.filter((x) => x.allapot === a).length;
  const kotelezoElmaradt = n("elmaradt");
  const cimzettNelkul = n("cimzettNelkul");
  return {
    pont: allasok.length, elkuldve: n("elkuldve"), kotelezoElmaradt, cimzettNelkul,
    rendben: kotelezoElmaradt === 0 && cimzettNelkul === 0,
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateKorzet(k: KorzetKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  if (!k.ertesitesek.some((e) => e.mikor === "hazaadas" && e.kotelezo)) {
    out.push({ severity: "error", id: "vedono.ertesites.hazaadas",
      message:
        `A hazaadási értesítés nincs KÖTELEZŐKÉNT felvéve. A védőnőnek határidőn ` +
        `belül fel kell keresnie az újszülöttet — ha nem tudja, hogy ` +
        `hazaengedték, nem tud jönni.` });
  }
  if (!k.korzetek.length) {
    out.push({ severity: "warning", id: "vedono.korzetek",
      message:
        `Egyetlen körzet sincs nyilvántartva, ezért egyetlen értesítésnek sincs ` +
        `címzettje. Ugyanaz a szerkezet, mint a 15. lépés riasztási rendjénél: a ` +
        `címzett nélküli értesítés nem féltájékoztatás, hanem elmaradt tájékoztatás.` });
  }
  if (k.kereso.hasznalat === null) {
    out.push({ severity: "warning", id: "vedono.kereso",
      message:
        `Nincs kimondva, hogy a rendszer gépi úton lekérdezheti-e a védőnő-keresőt. ` +
        `A lekérdezés a beteg LAKCÍMÉT viszi ki egy külső szolgáltatáshoz — ez ` +
        `adatvédelmi döntés, nem fejlesztési.` });
  }
  const dup = k.korzetek.map((c) => c.azonosito)
    .filter((x, i, a) => a.indexOf(x) !== i);
  if (dup.length) {
    out.push({ severity: "error", id: "vedono.korzet.dup",
      message: `Ismétlődő körzetazonosító: ${[...new Set(dup)].join(", ")}.` });
  }
  return out;
}

/* ── AZ ORSZÁGOS SZOLGÁLATJEGYZÉK ───────────────────────────────────── */

/**
 * A KERESÉS IRÁNYÍTÓSZÁMRA — ÉS AMIT AZ IRÁNYÍTÓSZÁM NEM DÖNT EL.
 *
 * A jegyzék mérése egyértelmű: 7699 újszülötthöz illetékes szolgálat 1802
 * irányítószámban, átlagosan 4,3 szolgálat kódonként, a legnagyobbnál 52. A
 * szolgálatok mindössze 4%-a van olyan irányítószámban, ahol egyedül működik.
 *
 * VAGYIS AZ IRÁNYÍTÓSZÁM HALMAZT JELÖL, NEM SZEMÉLYT. A körzetet az UTCA dönti
 * el, és azt ez a jegyzék nem tartalmazza. Ez nem a keresés hibája — ennyit
 * tud a rendelkezésre álló adat, és ezt jobb kimondani, mint egy találomra
 * kiválasztott védőnőt megnevezni.
 *
 * Amit a réteg ezért ad: a szóba jövő szolgálatok LISTÁJA, és a megnevezett
 * bizonytalanság. Egy címzett akkor lesz belőle, ha valaki — a szülészet vagy
 * a védőnői szolgálat — kiválasztja.
 *
 * HÁROM DOLOG, AMI KÜLÖN ÁLLAPOT
 *
 *   pontos       az irányítószámban van betöltött, illetékes szolgálat
 *   betoltetlen  van szolgálat, de MIND betöltetlen (137 ilyen irányítószám
 *                van) — ez nem ismeretlen kód, hanem üres körzet
 *   kozeli       az irányítószám nincs a jegyzékben → a két számszerűen
 *                legközelebbi kód, MEGNEVEZETT bizonytalansággal
 *
 * ÉS AMIT A „KÉT LEGKÖZELEBBI IRÁNYÍTÓSZÁM” SZABÁLYRÓL KI KELL MONDANI: a
 * számszerűen legközelebbi kód nem feltétlenül a földrajzilag legközelebbi. A
 * magyar irányítószámok régiónként csoportosulnak (az első jegy a régió), így
 * a szabály többnyire közeli helyet talál — de megyehatáron, és nagyvárosok
 * körül a szomszédos szám más településre eshet. Ezért a találat NEM „a
 * körzeti védőnő”, hanem „a legközelebbi elérhető szolgálat”, és a rendszer
 * ezt a különbséget kiírja.
 */
export interface Szolgalat {
  irsz: string;
  telepules: string;
  cim: string;
  /** `null` = BETÖLTETLEN álláshely. Az NEM címzett. */
  vedono: string | null;
  betoltetlen: boolean;
  tipus: string;
  szolgaltato: string;
  finanszirozasiKod: string;
  varmegye: string;
}

export interface Jegyzek {
  megnevezes: string;
  forras: string;
  szolgalat: number;
  betoltetlen: number;
  iranyitoszam: number;
  csakBetoltetlenIrsz: string[];
  szolgalatok: Szolgalat[];
}

export function loadJegyzek(path: string): Jegyzek {
  return JSON.parse(readFileSync(path, "utf8")) as Jegyzek;
}

export type KeresesAllapot =
  /** Az irányítószámban van betöltött, illetékes szolgálat. */
  | "pontos"
  /** Van szolgálat, de MIND betöltetlen. */
  | "betoltetlen"
  /** Az irányítószám nincs a jegyzékben — a két legközelebbi kód szolgálatai. */
  | "kozeli"
  /** Nincs irányítószám. */
  | "irszNelkul"
  /** A jegyzék üres. */
  | "jegyzekNelkul";

export interface Kereses {
  allapot: KeresesAllapot;
  /** A szóba jövő szolgálatok. Egy elem sem jelent kiválasztott címzettet. */
  talalatok: Szolgalat[];
  /** Ha `kozeli`: mely irányítószámokból. */
  kozeliIrsz: string[];
  /** Egyértelmű-e a címzett (pontosan egy betöltött szolgálat). */
  egyertelmu: boolean;
  miert: string;
}

/** A NEM BETÖLTETLEN, illetékes szolgálatok egy irányítószámban. */
function betoltottek(j: Jegyzek, irsz: string): Szolgalat[] {
  return j.szolgalatok.filter((s) => s.irsz === irsz && !s.betoltetlen);
}

export function keresIrsz(j: Jegyzek, irsz: string | null, kozelDb = 2): Kereses {
  if (!j.szolgalatok.length) {
    return { allapot: "jegyzekNelkul", talalatok: [], kozeliIrsz: [], egyertelmu: false,
      miert: "A szolgálatjegyzék üres — telepíteni kell (`npm run ingest:vedono-lista`)." };
  }
  const kod = (irsz ?? "").trim().match(/^\d{4}$/)?.[0];
  if (!kod) {
    return { allapot: "irszNelkul", talalatok: [], kozeliIrsz: [], egyertelmu: false,
      miert:
        `Nincs érvényes négyjegyű irányítószám${irsz ? ` („${irsz}”)` : ""}. A ` +
        `területi védőnő a lakcímhez tartozik — enélkül nincs kit keresni.` };
  }

  const helyben = j.szolgalatok.filter((s) => s.irsz === kod);
  if (helyben.length) {
    const bet = betoltottek(j, kod);
    if (!bet.length) {
      // NEM ISMERETLEN KÓD, HANEM ÜRES KÖRZET. A kettő teendője más: az
      // egyiknél keresni kell, a másiknál BEJELENTENI, hogy nincs ellátó.
      const k = kozeliKodok(j, kod, kozelDb);
      return {
        allapot: "betoltetlen",
        talalatok: k.flatMap((z) => betoltottek(j, z)),
        kozeliIrsz: k, egyertelmu: false,
        miert:
          `A(z) ${kod} irányítószámban ${helyben.length} illetékes szolgálat van, ` +
          `de MIND BETÖLTETLEN. Ez nem ismeretlen körzet, hanem üres körzet: a ` +
          `betöltetlen álláshoz küldött értesítés ugyanaz, mint az elmaradt. ` +
          `A legközelebbi kódok (${k.join(", ")}) szolgálatai ideiglenes ` +
          `megoldást adhatnak, de a hiányt be kell jelenteni.`,
      };
    }
    return {
      allapot: "pontos", talalatok: bet, kozeliIrsz: [], egyertelmu: bet.length === 1,
      miert: bet.length === 1
        ? `${bet[0].vedono} (${bet[0].telepules}, ${bet[0].cim}).`
        : `${bet.length} betöltött szolgálat a(z) ${kod} irányítószámban. AZ ` +
          `IRÁNYÍTÓSZÁM HALMAZT JELÖL, NEM SZEMÉLYT: a körzetet az utca dönti el, ` +
          `és azt a jegyzék nem tartalmazza. A címzettet ki kell választani.`,
    };
  }

  const k = kozeliKodok(j, kod, kozelDb);
  const t = k.flatMap((z) => betoltottek(j, z));
  return {
    allapot: "kozeli", talalatok: t, kozeliIrsz: k, egyertelmu: false,
    miert:
      `A(z) ${kod} irányítószám nincs a jegyzékben. A két számszerűen legközelebbi ` +
      `kód: ${k.join(", ")} (${t.length} betöltött szolgálat). FIGYELEM: a ` +
      `számszerűen legközelebbi kód nem feltétlenül a FÖLDRAJZILAG legközelebbi — ` +
      `megyehatáron és nagyvárosok körül a szomszédos szám más településre eshet. ` +
      `Ez tehát nem „a körzeti védőnő”, hanem „a legközelebbi elérhető szolgálat”.`,
  };
}

/** A `db` darab számszerűen legközelebbi, BETÖLTÖTT szolgálatot tartalmazó kód. */
export function kozeliKodok(j: Jegyzek, kod: string, db: number): string[] {
  const cel = Number(kod);
  const jelolt = [...new Set(j.szolgalatok.filter((s) => !s.betoltetlen).map((s) => s.irsz))]
    .filter((z) => z !== kod)
    .map((z) => ({ z, tav: Math.abs(Number(z) - cel) }))
    .sort((a, b) => a.tav - b.tav || a.z.localeCompare(b.z));
  return jelolt.slice(0, db).map((x) => x.z);
}

