/**
 * AZ AUDIT-HUROK — a 17. lépés gépi fele.
 *
 * A terv szerint ez a lépés „bezárja a rendszer legfontosabb körét”: a méhen
 * belül mondott állítást szembesíti a megszületett igazsággal. Enélkül minden
 * normogram, minden kockázati szám és minden modell csak addig ér valamit,
 * amíg valaki elhiszi — ebben az intézményben, ezen a populáción soha nem
 * mérhető vissza.
 *
 * AMI A LÉPÉS ELEJÉN KIDERÜLT: A HUROKNAK NEM VOLT HOVA ÍRNIA.
 *
 * A három mező — „A prenatális diagnózis megerősítve?”, „UH diagnózis
 * megerősítve”, „Műtét utáni diagnózis megerősítve” — mind ott állt a
 * felülettérképen, `outcomeAudit: true` jelöléssel, saját kapuval, saját
 * döntési szabállyal és hosszú indoklással. És mind a háromban `variable:
 * null` — vagyis a rendszer legfontosabb köre olyan mezőkből állt, amelyeknek
 * NEM VOLT VÁLTOZÓJUK. A próza megígért egy visszamérést, amit a szerkezet nem
 * tudott hordozni; a 17. lépés „Kész, ha”-ja pedig SZÁMOT kér, és számot nem
 * lehet olyan mezőből számolni, ami nem létezik.
 *
 * A MÁSODIK, AMI EBBŐL KÖVETKEZIK: A KÉTÉRTÉKŰ VÁLASZ HAMIS.
 *
 * A „megerősítve? igen/nem” kérdés a CÁFOLATOT és az ELDÖNTHETETLENSÉGET
 * ugyanabba a rekeszbe teszi. Az egyik azt jelenti, hogy a rendszer tévedett; a
 * másik azt, hogy a referencia nem tudott válaszolni. A felületes endometriosis
 * szövettani igazolása közismerten megbízhatatlan — a felülettérkép saját
 * jegyzete mondja ki —, tehát minden ilyen eset „tévedés”-ként állna be, és az
 * ultrahang RENDSZERESEN rosszabbnak látszana, mint amilyen. A változók ezért
 * négyértékűek, és az ötödik állapot a HIÁNYZÓ válasz, aminek nincs kódja: a
 * hiányzó adat sehol nem „nem”.
 *
 * ÉS A HARMADIK, AMI NÉLKÜL AZ EGÉSZ ÁRTALMAS: A KÖZÖLHETŐSÉG KAPUJA.
 *
 * Egy háromesetes mintából számolt 67%-os találati arány rosszabb, mint semmi:
 * úgy néz ki, mint egy mérés, és nem az. Ez a modul ezért soha nem ad ki puszta
 * arányt — mindig konfidenciaintervallummal, és csak akkor, ha az esetszám, a
 * bizonytalansági sáv szélessége és az eldönthetetlenek aránya mind engedi. A
 * küszöböket nem a gép választja: a nyilvántartásban `null`-ként állnak, amíg a
 * klinikai vezető és a biostatisztikus meg nem nevezi őket.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface Par {
  id: string;
  megnevezes: string;
  /** Amit a rendszer MONDOTT. */
  allitas: string;
  /** Amivel szembesítjük. */
  igazsag: string;
  /** A megerősítést hordozó változó azonosítója. */
  valtozo: string;
  referencia: string;
  /** Melyik modellek teljesítményét méri vissza ez a pár. */
  mit: string[];
  megjegyzes?: string;
}

export interface Hurok {
  megnevezes: string;
  lepes: number;
  /** Hány eset alatt nem közlünk arányt. Emberi döntés — `null`, amíg nincs. */
  minimumEset: number | null;
  /** Ennél szélesebb konfidenciaintervallumot nem közlünk. */
  maxBizonytalanSav: number | null;
  /** Ennél nagyobb eldönthetetlen-arány fölött a szám félrevezető. */
  maxEldonthetetlenArany: number | null;
  parok: Par[];
}

export function loadHurok(path: string): Hurok {
  return JSON.parse(readFileSync(path, "utf8")) as Hurok;
}

/* ── A NÉGY (ÖT) VÁLASZ ──────────────────────────────────────────────── */

export type Egyezes =
  /** A referencia ugyanazt mondta. */
  | "egyezik"
  /** A referencia mást mondott — a rendszer tévedett. */
  | "elter"
  /** A referencia NEM tudott dönteni. Se nem találat, se nem tévedés. */
  | "eldonthetetlen"
  /** Nem történt referenciavizsgálat. */
  | "nincsReferencia"
  /** Senki nem töltötte ki. NEM „nem”. */
  | "hianyzo";

export const KODOK: Record<string, Egyezes> = {
  confirmed: "egyezik",
  refuted: "elter",
  indeterminate: "eldonthetetlen",
  noReference: "nincsReferencia",
};

/**
 * EGY VÁLASZ BESOROLÁSA.
 *
 * A `null`, az üres és az ISMERETLEN kód mind `hianyzo` — és külön ismeretlen
 * kódnál ez rejt egy hibát, amit a validálás fog meg. Ami itt tilos: az
 * ismeretlent bármelyik érdemi rekeszbe tenni.
 */
export function besorol(kod: string | null | undefined): Egyezes {
  if (!kod) return "hianyzo";
  return KODOK[kod] ?? "hianyzo";
}

export interface Eset { caseId: string; kod: string | null | undefined; }

export interface Osszevetes {
  /** Minden vizsgált eset. */
  eset: number;
  egyezik: number;
  elter: number;
  eldonthetetlen: number;
  nincsReferencia: number;
  hianyzo: number;
  /**
   * A NEVEZŐ: csak az, amiről a referencia dönteni tudott. Az
   * eldönthetetlen, a referencia nélküli és a hiányzó NEM kerül bele — sem a
   * számlálóba, sem a nevezőbe.
   */
  ertekelheto: number;
}

export function osszevet(esetek: Eset[]): Osszevetes {
  const b = esetek.map((e) => besorol(e.kod));
  const n = (x: Egyezes) => b.filter((y) => y === x).length;
  const egyezik = n("egyezik");
  const elter = n("elter");
  return {
    eset: esetek.length, egyezik, elter,
    eldonthetetlen: n("eldonthetetlen"),
    nincsReferencia: n("nincsReferencia"),
    hianyzo: n("hianyzo"),
    ertekelheto: egyezik + elter,
  };
}

/* ── A BIZONYTALANSÁG ────────────────────────────────────────────────── */

export interface Sav { also: number; felso: number; szelesseg: number; }

/**
 * WILSON-FÉLE PONTSZÁM-INTERVALLUM.
 *
 * NEM a tankönyvi „normál közelítés” (p ± z·√(p(1−p)/n)) — az kis mintán és a
 * széleken értelmetlen sávot ad: 3/3-ra ±0 szélességű, 100%-os „biztonságot”,
 * 0/5-re pedig negatív alsó határt. Éppen ezek azok az esetek, amikkel egy
 * induló audit-hurok dolgozni fog.
 *
 * A Wilson-sáv mindkettőt megoldja: 3/3-ra (0,44–1,00), 0/5-re (0,00–0,43).
 */
export function wilson(k: number, n: number, z = 1.96): Sav | null {
  if (n <= 0 || k < 0 || k > n) return null;
  const z2 = z * z;
  const kozep = (k + z2 / 2) / (n + z2);
  const fel = (z / (n + z2)) * Math.sqrt((k * (n - k)) / n + z2 / 4);
  const also = Math.max(0, kozep - fel);
  const felso = Math.min(1, kozep + fel);
  return { also, felso, szelesseg: felso - also };
}

/* ── A KÖZÖLHETŐSÉG KAPUJA ──────────────────────────────────────────── */

export type KozlesAllapot =
  | "kozolheto"
  /** Nincs megnevezett küszöb — nem tudjuk, mi számít elégnek. */
  | "kuszobNelkul"
  | "keveseset"
  | "tulSzelesSav"
  /** Az eldönthetetlenek aránya akkora, hogy a szám félrevezetne. */
  | "tulSokEldonthetetlen"
  /** Egyetlen értékelhető eset sincs. */
  | "nincsAdat";

export interface Kozles {
  allapot: KozlesAllapot;
  kozolheto: boolean;
  /** Az arány — CSAK ha közölhető. Egyébként `null`, nem 0. */
  arany: number | null;
  sav: Sav | null;
  miert: string;
}

/**
 * KIADHATÓ-E EGY SZÁM.
 *
 * A hiányzó küszöb NEM engedékenység: küszöb nélkül a kapu ZÁRVA marad. Ez
 * ugyanaz a szerkezet, mint a rendszer többi kapujánál — a hiányzó döntés
 * sehol nem „igen”.
 *
 * És a `null` arány nem 0. Egy nulla találati arány azt állítja, hogy mértünk
 * és rossz lett; a `null` azt, hogy nem mértünk. A kettő összekeverése az
 * egyetlen olyan hiba, ami ezt a lépést egészében értelmetlenné tenné.
 */
export function kozles(o: Osszevetes, h: Hurok): Kozles {
  const zar = (allapot: KozlesAllapot, miert: string): Kozles =>
    ({ allapot, kozolheto: false, arany: null, sav: null, miert });

  if (h.minimumEset === null || h.maxBizonytalanSav === null ||
      h.maxEldonthetetlenArany === null) {
    return zar("kuszobNelkul",
      "NINCS MEGNEVEZETT KÜSZÖB: nem tudjuk, hány eset elég, milyen széles sáv " +
      "fogadható el, és mennyi eldönthetetlen fér bele. Amíg ezt a klinikai " +
      "vezető és a biostatisztikus nem mondja ki, a rendszer nem közöl arányt — " +
      "a hiányzó döntés itt sem „igen”.");
  }
  if (o.ertekelheto === 0) {
    return zar("nincsAdat",
      `Egyetlen értékelhető eset sincs (${o.eset} vizsgált eset: ` +
      `${o.eldonthetetlen} eldönthetetlen, ${o.nincsReferencia} referencia ` +
      `nélkül, ${o.hianyzo} kitöltetlen). Ez NEM nulla találati arány, hanem ` +
      `mérés hiánya.`);
  }
  if (o.ertekelheto < h.minimumEset) {
    return zar("keveseset",
      `${o.ertekelheto} értékelhető eset a megkövetelt ${h.minimumEset} helyett. ` +
      `Egy ekkora mintából számolt arány úgy NÉZ KI, mint egy mérés, és nem az — ` +
      `és ez rosszabb, mint ha nem mondanánk semmit.`);
  }

  const eldontheto = o.eset - o.hianyzo;
  const eldonthetetlenArany = eldontheto > 0 ? o.eldonthetetlen / eldontheto : 0;
  if (eldonthetetlenArany > h.maxEldonthetetlenArany) {
    return zar("tulSokEldonthetetlen",
      `A referencia az esetek ${(eldonthetetlenArany * 100).toFixed(0)}%-ában nem ` +
      `tudott dönteni (megengedett: ${(h.maxEldonthetetlenArany * 100).toFixed(0)}%). ` +
      `Az arány ilyenkor nem a rendszer teljesítményéről szól, hanem a ` +
      `referenciáéról — és a kettő összekeverése pont az ellenkezőjét mérné annak, ` +
      `amit mérni akarunk.`);
  }

  const sav = wilson(o.egyezik, o.ertekelheto)!;
  if (sav.szelesseg > h.maxBizonytalanSav) {
    return { allapot: "tulSzelesSav", kozolheto: false, arany: null, sav,
      miert:
        `A bizonytalansági sáv ${(sav.szelesseg * 100).toFixed(0)} százalékpont ` +
        `széles (megengedett: ${(h.maxBizonytalanSav * 100).toFixed(0)}). A ` +
        `pontbecslés ${(o.egyezik / o.ertekelheto * 100).toFixed(0)}%, de a valódi ` +
        `érték ${(sav.also * 100).toFixed(0)}% és ${(sav.felso * 100).toFixed(0)}% ` +
        `között bárhol lehet — ez nem szám, hanem sejtés.` };
  }

  const arany = o.egyezik / o.ertekelheto;
  return {
    allapot: "kozolheto", kozolheto: true, arany, sav,
    miert:
      `${o.egyezik}/${o.ertekelheto} egyezés = ${(arany * 100).toFixed(0)}% ` +
      `(95% CI: ${(sav.also * 100).toFixed(0)}–${(sav.felso * 100).toFixed(0)}%). ` +
      `A nevezőből kimaradt ${o.eldonthetetlen} eldönthetetlen, ` +
      `${o.nincsReferencia} referencia nélküli és ${o.hianyzo} kitöltetlen eset — ` +
      `ezek nem tévedések, és nem is találatok.`,
  };
}

/* ── AZ EGÉSZ HUROK ÁLLÁSA ──────────────────────────────────────────── */

export interface ParAllas {
  par: Par;
  osszevetes: Osszevetes;
  kozles: Kozles;
}

export function parAllas(h: Hurok, esetek: Record<string, Eset[]>): ParAllas[] {
  return h.parok.map((par) => {
    const o = osszevet(esetek[par.id] ?? []);
    return { par, osszevetes: o, kozles: kozles(o, h) };
  });
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export interface AuditMezo {
  /** A felülettérképen látott felirat. */
  label: string;
  /** A hozzá kötött változó — `null`, ha nincs. */
  variable: string | null;
  form: string;
}

/**
 * A HUROK BEKÖTÖTTSÉGE.
 *
 * Ez a validálás azt a hibát fogja meg, amivel ez a lépés kezdődött: egy
 * `outcomeAudit` mező, aminek nincs változója. Az ilyen mező a felületen
 * megjelenik, kapuja van, döntési szabálya van — és a válasz, amit a klinikus
 * beleír, SEHOL nem marad meg. Ez nem hiányzó adat, hanem hiányzó hely.
 */
export function validateHurok(
  h: Hurok, mezok: AuditMezo[], ismertValtozok: Set<string>,
  ismertKodok: (valtozo: string) => string[] | null,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];

  for (const m of mezok.filter((x) => x.variable === null)) {
    out.push({
      severity: "error", id: `audit.mezo.${m.form}`,
      message:
        `A(z) „${m.label}” audit-mezőnek NINCS VÁLTOZÓJA (${m.form}). A mező a ` +
        `felületen megjelenik, kapuja és döntési szabálya van — a válasz mégsem ` +
        `marad meg sehol. A 17. lépés SZÁMOT kér, és számot nem lehet olyan ` +
        `mezőből számolni, ami nem létezik.`,
    });
  }

  for (const p of h.parok) {
    if (!ismertValtozok.has(p.valtozo)) {
      out.push({
        severity: "error", id: `audit.${p.id}`,
        message:
          `A(z) „${p.megnevezes}” pár a(z) „${p.valtozo}” változóra hivatkozik, ` +
          `ilyen viszont nincs a regiszterben.`,
      });
      continue;
    }
    // A NÉGY VÁLASZ MEGLÉTE. Ha a változó kétértékűvé csúszik vissza, a
    // cáfolat és az eldönthetetlenség újra egy rekeszbe kerül — és az arány
    // rendszeresen rosszabbat mutat a valóságnál.
    const kodok = ismertKodok(p.valtozo);
    const kell = Object.keys(KODOK);
    const hianyzo = kodok ? kell.filter((k) => !kodok.includes(k)) : kell;
    if (hianyzo.length) {
      out.push({
        severity: "error", id: `audit.${p.id}.valaszok`,
        message:
          `A(z) „${p.valtozo}” válaszkészletéből hiányzik: ${hianyzo.join(", ")}. ` +
          `A kétértékű „megerősítve? igen/nem” a CÁFOLATOT és az ` +
          `ELDÖNTHETETLENSÉGET ugyanabba a rekeszbe teszi — az egyik azt jelenti, ` +
          `hogy a rendszer tévedett, a másik azt, hogy a referencia nem tudott ` +
          `válaszolni. Az összemosás rendszeresen ROSSZABBNAK mutatja a rendszert.`,
      });
    }
  }

  // A KÜSZÖBÖK. Emberre várnak, ezért figyelmeztetés — de amíg nincsenek, egy
  // szám sem adható ki, és ezt ki kell mondani.
  const kuszob: Array<[string, number | null, string]> = [
    ["minimumEset", h.minimumEset, "hány értékelhető eset alatt nem közlünk arányt"],
    ["maxBizonytalanSav", h.maxBizonytalanSav, "milyen széles bizonytalansági sáv fogadható el"],
    ["maxEldonthetetlenArany", h.maxEldonthetetlenArany,
     "mennyi eldönthetetlen fér bele, mielőtt a szám a referenciáról szólna"],
  ];
  for (const [nev, ertek, mit] of kuszob) {
    if (ertek === null) {
      out.push({
        severity: "warning", id: `audit.kuszob.${nev}`,
        message:
          `Nincs megnevezve: ${mit} (\`${nev}\`). Ez klinikai és statisztikai ` +
          `döntés, nem fejlesztési. Amíg hiányzik, a hurok EGYETLEN arányt sem ` +
          `ad ki — a hiányzó küszöb itt sem „igen”.`,
      });
    }
  }
  return out;
}

/**
 * AZ AUDIT-MEZŐK ÖSSZESZEDÉSE A FELÜLETTÉRKÉPEKBŐL.
 *
 * A hurok bemenete nem egy külön lista: a felülettérkép `outcomeAudit`
 * jelölése az egyetlen forrás. Így egy új audit-mező FELVÉTELE önmagában
 * bekapcsolja a bekötöttség ellenőrzését — nem kell hozzá senkinek eszébe
 * jutnia, hogy egy második helyre is beírja.
 */
export function auditMezok(
  map: { forms: Array<{ id: string; fields: Array<{
    label: string; variable?: string | null; outcomeAudit?: boolean }> }> },
): AuditMezo[] {
  return map.forms.flatMap((form) =>
    form.fields.filter((f) => f.outcomeAudit).map((f) => ({
      label: f.label, variable: f.variable ?? null, form: form.id,
    })));
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface HurokMerleg {
  par: number;
  bekotott: number;
  kozolheto: number;
  ertekelhetoEset: number;
  vizsgaltEset: number;
  kuszobHianyzik: number;
}

export function merleg(h: Hurok, allasok: ParAllas[], mezok: AuditMezo[]): HurokMerleg {
  return {
    par: h.parok.length,
    bekotott: mezok.filter((m) => m.variable !== null).length,
    kozolheto: allasok.filter((a) => a.kozles.kozolheto).length,
    ertekelhetoEset: allasok.reduce((n, a) => n + a.osszevetes.ertekelheto, 0),
    vizsgaltEset: allasok.reduce((n, a) => n + a.osszevetes.eset, 0),
    kuszobHianyzik: [h.minimumEset, h.maxBizonytalanSav, h.maxEldonthetetlenArany]
      .filter((x) => x === null).length,
  };
}
