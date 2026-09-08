/**
 * ÉVES JELENTÉSI ADATKÖRÖK — az aggregátum, ami elrejti, miből készült.
 *
 * Egy begépelt évi szám olyan állítás, amit senki nem tud visszaellenőrizni —
 * és a jelentések éppen azért veszélyesek, mert évekig hivatkoznak rájuk. Egy
 * elgépelt „kissúlyú újszülöttek száma” bekerül a vármegyei összesítésbe, onnan
 * az országosba, és onnan egy szakcikkbe.
 *
 * EZÉRT MINDEN TÉTEL MEGMONDJA, SZÁMOLHATÓ-E A REKORDBÓL. Ami számolható, azt a
 * rendszer számolja; ami nem, azt megnevezetten kézzel adják meg — és a kettő
 * NEM NÉZ KI EGYFORMÁN.
 *
 * ÉS A NULLA KÉT DOLGOT JELENT: nem történt, vagy nem számolták. A „0 intézeten
 * kívüli szülés” ugyanúgy néz ki akkor is, ha senki nem nézte meg — ez a
 * hiányzó-adat-szabály jelentési alakja.
 *
 * A KIVONAT, AMI TELJESNEK LÁTSZIK. A vármegyei adatkör tételszámozása 62-ről
 * 132-re ugrik: a kapott dokumentum a teljes űrlap RÉSZE. Egy hiányos jelentés,
 * ami teljesnek látszik, rosszabb, mint a hiánya — ezért a nyilvántartás ezt
 * mezőben mondja ki, nem lábjegyzetben.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

export interface Tetel {
  id: string;
  jel: string;
  szoveg: string;
  /** Kiszámolható-e a rekordból. */
  szamolhato: boolean;
  forras?: string;
  megjegyzes?: string;
}

export interface Adatkor {
  id: string;
  megnevezes: string;
  ev: number;
  kitolti: string;
  /** Teljes űrlap-e, vagy kivonat. */
  teljes: boolean;
  teljesMegjegyzes?: string;
  tetelek: Tetel[];
}

export interface JelentesKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  adatkorok: Adatkor[];
}

export function loadJelentes(path: string): JelentesKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as JelentesKeszlet;
}

/* ── A KITÖLTÖTT ÉRTÉK ───────────────────────────────────────────────── */

export type ErtekAllapot =
  /** A rendszer számolta ki. */
  | "szamolt"
  /** Kézzel megadva, és a tétel nem is számolható — ez rendben van. */
  | "kezi"
  /** Kézzel megadva, PEDIG számolható volna. */
  | "kezzelFelulirt"
  /** Nem gyűjtötték. NEM nulla. */
  | "nemGyujtott"
  /** Nincs érték. */
  | "hianyzik";

export interface Ertek {
  tetel: string;
  szam?: number;
  /** Honnan: `"szamolt"` vagy a kitöltő neve. */
  honnan?: string;
  nemGyujtott?: boolean;
}

export interface ErtekAllas {
  tetel: Tetel;
  allapot: ErtekAllapot;
  szam: number | null;
  miert: string;
}

export function ertekAllas(a: Adatkor, ertekek: Ertek[]): ErtekAllas[] {
  const map = new Map(ertekek.map((e) => [e.tetel, e]));
  return a.tetelek.map((t) => {
    const e = map.get(t.id);
    if (!e) {
      return { tetel: t, allapot: "hianyzik", szam: null,
        miert: `${t.jel} „${t.szoveg}” — nincs érték.` };
    }
    if (e.nemGyujtott) {
      // A NEM GYŰJTÖTT NEM NULLA. Ez a jelentés legfontosabb megkülönböztetése.
      return { tetel: t, allapot: "nemGyujtott", szam: null,
        miert:
          `${t.jel} NEM GYŰJTÖTTÉK. Ez nem nulla: a „0” azt állítja, hogy ` +
          `megnéztük és nem volt ilyen eset — ez pedig azt, hogy nem néztük meg.` };
    }
    if (e.szam === undefined) {
      return { tetel: t, allapot: "hianyzik", szam: null,
        miert: `${t.jel} „${t.szoveg}” — nincs érték.` };
    }
    if (e.honnan === "szamolt") {
      return { tetel: t, allapot: "szamolt", szam: e.szam,
        miert: `${t.jel} ${e.szam} — a rekordból számolva${t.forras ? ` (${t.forras})` : ""}.` };
    }
    if (t.szamolhato) {
      return { tetel: t, allapot: "kezzelFelulirt", szam: e.szam,
        miert:
          `${t.jel} ${e.szam} — KÉZZEL megadva, pedig a rekordból SZÁMOLHATÓ ` +
          `volna${t.forras ? ` (${t.forras})` : ""}. A begépelt szám olyan állítás, ` +
          `amit senki nem tud visszaellenőrizni — a jelentésekre pedig évekig ` +
          `hivatkoznak.` };
    }
    return { tetel: t, allapot: "kezi", szam: e.szam,
      miert: `${t.jel} ${e.szam} — kézzel, és ez rendben: ${t.megjegyzes ?? "nem számolható a rekordból"}` };
  });
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validateJelentes(k: JelentesKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const a of k.adatkorok) {
    const ids = a.tetelek.map((t) => t.id);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) {
      out.push({ severity: "error", id: `jelentes.${a.id}.dup`,
        message: `Ismétlődő tételazonosító: ${[...new Set(dup)].join(", ")}.` });
    }
    if (!a.teljes) {
      out.push({ severity: "warning", id: `jelentes.${a.id}`,
        message:
          `A(z) „${a.megnevezes}” KIVONAT, nem teljes űrlap. ` +
          `${a.teljesMegjegyzes ?? ""} Egy hiányos jelentés, ami teljesnek ` +
          `látszik, rosszabb, mint a hiánya.` });
    }
    for (const t of a.tetelek.filter((x) => x.szamolhato && !x.forras)) {
      out.push({ severity: "error", id: `jelentes.${a.id}.${t.id}`,
        message:
          `A(z) ${t.jel} tétel számolhatónak van jelölve, de nincs megnevezve, ` +
          `MIBŐL. Forrás nélkül a „számolható” jelölés nem ellenőrizhető.` });
    }
  }
  return out;
}

export interface JelMerleg {
  adatkor: number;
  tetel: number;
  szamolhato: number;
  hianyosAdatkor: number;
  hianyos: boolean;
}

export function merleg(k: JelentesKeszlet): JelMerleg {
  const tetel = k.adatkorok.reduce((n, a) => n + a.tetelek.length, 0);
  const hianyosAdatkor = k.adatkorok.filter((a) => !a.teljes).length;
  return {
    adatkor: k.adatkorok.length, tetel,
    szamolhato: k.adatkorok.reduce((n, a) => n + a.tetelek.filter((t) => t.szamolhato).length, 0),
    hianyosAdatkor, hianyos: hianyosAdatkor > 0,
  };
}
