/**
 * HELYHIERARCHIA — és a döntés, ami miatt nem szintek vannak, hanem lánc.
 *
 * A kérés így szólt: klinika » intézmény » intézet » telephely » részleg »
 * osztály » alosztály/szint » szoba » ágy. Kilenc szint.
 *
 * ÉS PONTOSAN EZ AZ, AMIT NEM SZABAD RÖGZÍTETT MÉLYSÉGKÉNT MEGÉPÍTENI.
 *
 * Egy kilenc oszlopos táblában minden helynek ki kell töltenie mind a kilencet.
 * A valóság viszont nem ilyen: van klinika külön intézet nélkül, van telephely,
 * ahol az osztály közvetlenül a részleg alatt van, van elkülönítő szoba, ami
 * maga viselkedik részlegként, és van olyan ágy, ami nem szobában áll, hanem a
 * folyosón — ideiglenesen, de a nyilvántartásban akkor is helye van.
 *
 * Ha a mélység rögzített, a hiányzó szintekre FANTOMSOROK kerülnek („nincs
 * intézet”, „nincs alosztály”), és ezek a fantomok utána megjelennek a
 * statisztikában, a jogosultsági szabályokban és a jelentésben. Egy fantom
 * részleg, aminek ágyai vannak, pontosan úgy néz ki, mint egy valódi.
 *
 * A HELYES SZERKEZET EGY LÁNC: minden hely megnevezi a SAJÁT FAJTÁJÁT és azt,
 * hogy minek a része (`resze`). A mélység abból adódik, ami tényleg ott van.
 * Ez egyben a HL7 FHIR `Location.partOf` szerkezete is, tehát a kifelé
 * illesztés nem külön munka: a `Location` erőforrás `physicalType` és `partOf`
 * mezője pontosan ez.
 *
 * AMIT A LÁNC MEGKÖVETEL, ÉS A TÁBLA NEM: hogy ne legyen KÖR benne. Egy
 * ciklikus lánc (A része B-nek, B része A-nak) minden felfelé összegzést
 * végtelen ciklusba visz — vagy ami rosszabb, kétszer számol. A validáló ezért
 * elsőként a kört keresi.
 *
 * ÉS AMIT KÉTSZER SZÁMOLNI A LEGKÖNNYEBB: a megosztott ágyat. Ha egy ágy két
 * osztályhoz is tartozhatna, a klinika szintű összesítés kétszer veszi. A lánc
 * ezért EGY szülőt enged — a közös ágykészletet külön hely fajtaként kell
 * kimondani, nem két szülővel.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A FAJTÁK ────────────────────────────────────────────────────────── */

/**
 * A hely fajtája. A SORREND jelentéssel bír: egy hely csak nála TÁGABB fajta
 * része lehet — a szoba nem lehet az ágy része. A közbenső fajták viszont
 * KIHAGYHATÓK, és ez a lényeg.
 */
export const FAJTA_SORREND = [
  "klinika", "intezmeny", "intezet", "telephely", "reszleg",
  "osztaly", "alosztaly", "szoba", "agy",
] as const;

export type HelyFajta = (typeof FAJTA_SORREND)[number];

/** FHIR Location.physicalType leképezés — a kifelé illesztés nem külön munka. */
export const FHIR_PHYSICAL_TYPE: Record<HelyFajta, string> = {
  klinika: "si", intezmeny: "si", intezet: "si", telephely: "bu",
  reszleg: "wa", osztaly: "wa", alosztaly: "lvl", szoba: "ro", agy: "bd",
};

export interface Hely {
  id: string;
  fajta: HelyFajta;
  nev: string;
  /** Minek a része. `null` csak a gyökérnél. EGY szülő — a megosztott ágy kétszer számolna. */
  resze: string | null;
  label?: I18n;
  /** Nemi kijelölés (szoba szinten): a férőhely nem cserélhető szabadon. */
  nem?: "no" | "ferfi" | "vegyes";
  /** Elkülönítés: járványügyi vagy immunszuppresszió miatt. */
  elkulonites?: "nincs" | "cseppfertozes" | "levego" | "kontakt" | "vedo";
  /** Felszereltség — ez dönti el, mire alkalmas a hely. */
  felszereles?: string[];
  /** Ágy: rooming-in (anya + újszülött). */
  roomingIn?: boolean;
}

export interface HelyKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  helyek: Hely[];
}

export function loadHelyek(path: string): HelyKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as HelyKeszlet;
}

/* ── A LÁNC ──────────────────────────────────────────────────────────── */

export interface Lanc {
  /** A gyökértől a helyig, beleértve. */
  ut: Hely[];
  /** Emberi olvasatra: „Klinika › Telephely › Osztály › 12. szoba › 3. ágy”. */
  utvonal: string;
  /** Igaz, ha a lánc megszakadt (nem létező szülő) vagy kört tartalmaz. */
  torott: boolean;
  miert: string;
}

export function lanc(k: HelyKeszlet, id: string): Lanc {
  const map = new Map(k.helyek.map((h) => [h.id, h]));
  const ut: Hely[] = [];
  const latott = new Set<string>();
  let cur = map.get(id);
  while (cur) {
    if (latott.has(cur.id)) {
      return { ut: ut.reverse(), utvonal: ut.map((h) => h.nev).join(" › "), torott: true,
        miert:
          `KÖR a helyláncban a(z) „${cur.id}” elemnél. Minden felfelé összegzés ` +
          `végtelen ciklusba futna — vagy ami rosszabb, kétszer számolna.` };
    }
    latott.add(cur.id);
    ut.push(cur);
    if (cur.resze === null) break;
    const szulo = map.get(cur.resze);
    if (!szulo) {
      return { ut: ut.reverse(), utvonal: ut.map((h) => h.nev).join(" › "), torott: true,
        miert:
          `MEGSZAKADT LÁNC: a(z) „${cur.id}” a(z) „${cur.resze}” része volna, de ` +
          `ilyen hely nincs. A hely így nem rendelhető egyetlen szervezeti ` +
          `egységhez sem, és a felfelé összesítésből kiesik — csendben.` };
    }
    cur = szulo;
  }
  if (!ut.length) {
    return { ut: [], utvonal: "", torott: true, miert: `Nincs ilyen hely: „${id}”.` };
  }
  ut.reverse();
  return { ut, utvonal: ut.map((h) => h.nev).join(" › "), torott: false,
    miert: `${ut.length} elemű lánc.` };
}

/** Egy hely alatt lévő MINDEN hely, tetszőleges mélységben. */
export function alatta(k: HelyKeszlet, id: string, fajta?: HelyFajta): Hely[] {
  const gyerekek = new Map<string, Hely[]>();
  for (const h of k.helyek) {
    if (h.resze) gyerekek.set(h.resze, [...(gyerekek.get(h.resze) ?? []), h]);
  }
  const ki: Hely[] = [];
  const latott = new Set<string>([id]);
  const sor = [...(gyerekek.get(id) ?? [])];
  while (sor.length) {
    const h = sor.shift()!;
    if (latott.has(h.id)) continue;      // kör elleni védelem
    latott.add(h.id);
    if (!fajta || h.fajta === fajta) ki.push(h);
    sor.push(...(gyerekek.get(h.id) ?? []));
  }
  return ki;
}

/** Hány ágy van egy szervezeti egység alatt — tetszőleges mélységben. */
export function agyszam(k: HelyKeszlet, id: string): number {
  return alatta(k, id, "agy").length;
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateHelyek(k: HelyKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = k.helyek.map((h) => h.id);
  for (const d of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) {
    out.push({ severity: "error", id: d, message: `Ismétlődő helyazonosító: ${d}.` });
  }
  const map = new Map(k.helyek.map((h) => [h.id, h]));
  const rang = (f: HelyFajta) => FAJTA_SORREND.indexOf(f);

  const gyokerek = k.helyek.filter((h) => h.resze === null);
  if (!gyokerek.length) {
    out.push({ severity: "error", id: "hely.gyoker",
      message:
        `Nincs gyökér (egyetlen helynek sincs üres „resze” mezője). Minden lánc ` +
        `kört tartalmaz vagy megszakad.` });
  }
  for (const h of k.helyek) {
    if (!FAJTA_SORREND.includes(h.fajta)) {
      out.push({ severity: "error", id: h.id, message: `Ismeretlen helyfajta: „${h.fajta}”.` });
      continue;
    }
    if (h.resze !== null) {
      const sz = map.get(h.resze);
      if (!sz) {
        out.push({ severity: "error", id: h.id,
          message:
            `A(z) „${h.nev}” a(z) „${h.resze}” része volna, de ilyen hely nincs. ` +
            `A hely a felfelé összesítésből CSENDBEN kiesik.` });
      } else if (rang(sz.fajta) >= rang(h.fajta)) {
        out.push({ severity: "error", id: h.id,
          message:
            `A(z) „${h.nev}” (${h.fajta}) egy nála NEM TÁGABB hely része ` +
            `(${sz.nev}, ${sz.fajta}). A közbenső fajták kihagyhatók, a sorrend ` +
            `megfordítása viszont nem: egy szoba nem lehet egy ágy része.` });
      }
    }
    const l = lanc(k, h.id);
    if (l.torott && map.has(h.id) && h.resze !== null) {
      if (/KÖR/.test(l.miert)) {
        out.push({ severity: "error", id: h.id, message: l.miert });
      }
    }
    if (h.fajta === "agy" && h.roomingIn === undefined) {
      out.push({ severity: "warning", id: h.id,
        message:
          `A(z) „${h.nev}” ágynál nincs kimondva, rooming-in-e. Szülészeti ` +
          `osztályon ez dönti el, hogy egy vagy KÉT beteg fér rá — az újszülött ` +
          `külön beteg (29. modul).` });
    }
  }
  /* AZ ÜRES SZERVEZETI EGYSÉG. Egy részleg vagy osztály, ami alatt egyetlen ágy
     sincs, vagy fantom (rögzített mélységből maradt sor), vagy valódi és
     üres — a kettőt meg kell tudni különböztetni, ezért nevezzük meg. */
  for (const h of k.helyek) {
    if (["reszleg", "osztaly", "alosztaly"].includes(h.fajta) && agyszam(k, h.id) === 0) {
      out.push({ severity: "warning", id: h.id,
        message:
          `A(z) „${h.nev}” (${h.fajta}) alatt EGYETLEN ÁGY SINCS. Ez lehet valódi ` +
          `(járóbeteg-részleg), vagy FANTOM: egy rögzített mélységű táblából ` +
          `maradt kitöltő sor. A kettő a statisztikában egyformán néz ki.` });
    }
  }
  return out;
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface HelyMerleg {
  hely: number;
  fajtankent: Record<string, number>;
  /** A leghosszabb lánc — ez a TÉNYLEGES mélység, nem a fajták száma. */
  maxMelyseg: number;
  gyoker: number;
  torott: number;
}

export function merleg(k: HelyKeszlet): HelyMerleg {
  const fajtankent: Record<string, number> = {};
  for (const h of k.helyek) fajtankent[h.fajta] = (fajtankent[h.fajta] ?? 0) + 1;
  const lancok = k.helyek.map((h) => lanc(k, h.id));
  return {
    hely: k.helyek.length, fajtankent,
    maxMelyseg: Math.max(0, ...lancok.map((l) => (l.torott ? 0 : l.ut.length))),
    gyoker: k.helyek.filter((h) => h.resze === null).length,
    torott: lancok.filter((l) => l.torott).length,
  };
}
