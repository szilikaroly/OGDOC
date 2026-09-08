/**
 * LICENCPANEL — ami engedéllyel aktiválható, és ami nem.
 *
 * EGY HELYEN minden, aminek a használatához engedély kell: mérőeszköz-licenc,
 * AI-modell, adatkészlet, kódrendszer. A rendszerben ma ezek négy külön
 * nyilvántartásban élnek, és emiatt a kérdés — „mit kell még megszereznünk?” —
 * nem volt egyben megválaszolható.
 *
 * AZ AKTIVÁLÁS NEM JELÖLŐNÉGYZET.
 *
 * Megnevezett jogosultat, hatókört, lejáratot és bizonyítékot kíván. Ez ugyanaz
 * a szerkezet, mint a rendszer többi kapujánál — a kapu ADATBÓL nyílik, nem
 * szóból —, csak itt az adat maga a licenc. Egy „aktív: igen” mező pontosan azt
 * a hibát csinálná, amit a 12. lépésnél kimondtunk: a kapu egy jelölésből
 * nyílna, és senki nem tudná, mire terjed ki.
 *
 * ÉS KÉTFÉLE TÉTEL VAN, AMIT NEM SZABAD ÖSSZEMOSNI
 *
 *   AKTIVÁLHATÓ    a korlát engedéllyel feloldható — az intézmény megszerzi,
 *                  beírja, és a kapu kinyílik (EQ-5D-5L, WHODAS, AnnoCerv)
 *   NEM AKTIVÁLHATÓ a korlát NEM engedély kérdése (SNOMED CT GPS: a ND-klauzula
 *                  az átalakított mű terjesztését tiltja; PRBPERIsk: a GPLv2 az
 *                  MIT-műben nem terjeszthető)
 *
 * A második csoportot a panelen nem lehet „megszerezni” — és ha a felület ezt
 * nem mondja ki, valaki előbb-utóbb megpróbálja bejelölni.
 *
 * A LEJÁRAT TEHERHORDÓ. A licenc az EGYETLEN olyan igazolás a rendszerben, ami
 * MAGÁTÓL elévül — a megőrzési idők, a MEES-tanúsítványok és a
 * dokumentumfelülvizsgálatok is lejárnak, de azok naptárból, ez pedig
 * szerződésből. A lejárt licenc ugyanúgy zár, mint a hiányzó.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export type Fajta = "meroeszkoz" | "modell" | "adatkeszlet" | "kodrendszer";

export interface Tetel {
  id: string;
  megnevezes: string;
  fajta: Fajta;
  /** A ismert licenc, ha van. `null`: még nincs megszerezve. */
  licenc: string | null;
  mihezKell: string;
  megjegyzes: string;
}

export interface Aktivalas {
  tetel: string;
  /** KI a jogosult — intézmény vagy személy. Nem „a rendszer”. */
  jogosult: string;
  /** MIRE terjed ki: mely felhasználás, hány felhasználó, mely nyelv. */
  hatokor: string;
  /** Mikortól. */
  ervenyesTol: string;
  /** Meddig. `null` = határozatlan — de akkor a `bizonyitek` KÖTELEZŐ. */
  ervenyesIg: string | null;
  /** A szerződés vagy visszaigazolás azonosítója. */
  bizonyitek: string;
  /** Ki rögzítette. */
  rogzitette: string;
}

export interface Panel {
  megnevezes: string;
  note: string;
  elojelzesNap: number;
  tetelek: Tetel[];
  aktivalasok: Aktivalas[];
}

export function loadPanel(path: string): Panel {
  return JSON.parse(readFileSync(path, "utf8")) as Panel;
}

/** A megjegyzésből derül ki, aktiválható-e — de a DÖNTÉS a licenc természete. */
export function aktivalhato(t: Tetel): boolean {
  return !/NEM aktiválható/i.test(t.megjegyzes);
}

/* ── AZ ÁLLAPOT ──────────────────────────────────────────────────────── */

export type TetelAllapot =
  /** Érvényes aktiválás van. */
  | "aktiv"
  /** Aktiválható, de nincs aktiválva. */
  | "aktivalhato"
  /** A korlát nem engedély kérdése — a panelen nem szerezhető meg. */
  | "nemAktivalhato"
  /** Volt aktiválás, de lejárt. */
  | "lejart"
  /** Lejár az előjelzési ablakon belül. */
  | "hamarosanLejar"
  /** Aktiválás van, de hiányos — nem nyit kaput. */
  | "hianyosAktivalas";

export interface TetelAllas {
  tetel: Tetel;
  allapot: TetelAllapot;
  /** Nyitva van-e a kapu ehhez a tételhez. */
  nyitva: boolean;
  napMulva: number | null;
  hianyzik: string[];
  miert: string;
}

const nap = (a: string, b: string): number =>
  Math.round((Date.parse(a) - Date.parse(b)) / 86400000);

/**
 * EGY TÉTEL ÁLLAPOTA.
 *
 * A hiányos aktiválás NEM nyit kaput — és ez a panel legfontosabb szabálya.
 * Egy jogosult nélküli, hatókör nélküli bejegyzés pontosan olyan, mint egy
 * bejelölt négyzet: úgy néz ki, mint engedély, és nem az.
 */
export function tetelAllas(p: Panel, t: Tetel, ma: string): TetelAllas {
  if (!aktivalhato(t)) {
    return { tetel: t, allapot: "nemAktivalhato", nyitva: false, napMulva: null,
      hianyzik: [],
      miert:
        `NEM AKTIVÁLHATÓ: ${t.megjegyzes} A korlát nem engedély kérdése — a ` +
        `panelen nem szerezhető meg, és a bejelölése sem oldaná fel.` };
  }
  const a = p.aktivalasok.filter((x) => x.tetel === t.id)
    .sort((x, y) => x.ervenyesTol.localeCompare(y.ervenyesTol)).pop();
  if (!a) {
    return { tetel: t, allapot: "aktivalhato", nyitva: false, napMulva: null,
      hianyzik: ["aktivalas"],
      miert:
        `Aktiválható, de nincs aktiválva. Kell hozzá: ${t.mihezKell} — ` +
        `megnevezett jogosulttal, hatókörrel, lejárattal és bizonyítékkal.` };
  }

  const kell: Array<keyof Aktivalas> = ["jogosult", "hatokor", "ervenyesTol", "bizonyitek", "rogzitette"];
  const hianyzik = kell.filter((k) => !String(a[k] ?? "").trim());
  if (hianyzik.length) {
    return { tetel: t, allapot: "hianyosAktivalas", nyitva: false, napMulva: null,
      hianyzik: hianyzik.map(String),
      miert:
        `HIÁNYOS AKTIVÁLÁS (${hianyzik.join(", ")}) — NEM nyit kaput. Egy jogosult ` +
        `és hatókör nélküli bejegyzés pontosan olyan, mint egy bejelölt négyzet: ` +
        `úgy néz ki, mint engedély, és nem az.` };
  }

  if (a.ervenyesIg) {
    const d = nap(a.ervenyesIg, ma);
    if (d < 0) {
      return { tetel: t, allapot: "lejart", nyitva: false, napMulva: d, hianyzik: [],
        miert:
          `A licenc ${-d} napja LEJÁRT (${a.ervenyesIg}, ${a.jogosult}). A lejárt ` +
          `licenc ugyanúgy zár, mint a hiányzó — és a licenc az egyetlen igazolás a ` +
          `rendszerben, ami magától elévül.` };
    }
    if (d <= p.elojelzesNap) {
      return { tetel: t, allapot: "hamarosanLejar", nyitva: true, napMulva: d, hianyzik: [],
        miert:
          `Aktív, de ${d} nap múlva lejár (${a.ervenyesIg}). A megújítás átfutása ` +
          `hónapokban mérhető — ezért szól ${p.elojelzesNap} nappal előbb.` };
    }
    return { tetel: t, allapot: "aktiv", nyitva: true, napMulva: d, hianyzik: [],
      miert: `Aktív ${a.ervenyesIg}-ig (${a.jogosult}, ${a.hatokor}).` };
  }
  return { tetel: t, allapot: "aktiv", nyitva: true, napMulva: null, hianyzik: [],
    miert:
      `Aktív, határozatlan időre (${a.jogosult}, ${a.hatokor}; bizonyíték: ` +
      `${a.bizonyitek}).` };
}

export function allasok(p: Panel, ma: string): TetelAllas[] {
  return p.tetelek.map((t) => tetelAllas(p, t, ma));
}

/** Nyitva van-e a kapu egy tételhez — ezt hívja a többi réteg. */
export function nyitva(p: Panel, tetelId: string, ma: string): boolean {
  const t = p.tetelek.find((x) => x.id === tetelId);
  return t ? tetelAllas(p, t, ma).nyitva : false;
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validatePanel(p: Panel, ma: string): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ismert = new Set(p.tetelek.map((t) => t.id));
  for (const a of p.aktivalasok) {
    if (!ismert.has(a.tetel)) {
      out.push({ severity: "error", id: `licenc.${a.tetel}`,
        message:
          `Aktiválás ismeretlen tételre: „${a.tetel}”. Ez úgy néz ki, mint egy ` +
          `megszerzett engedély, és semmit nem nyit ki.` });
      continue;
    }
    const t = p.tetelek.find((x) => x.id === a.tetel)!;
    if (!aktivalhato(t)) {
      out.push({ severity: "error", id: `licenc.${a.tetel}.tiltott`,
        message:
          `A(z) „${t.megnevezes}” tételre aktiválás van rögzítve, pedig a korlát ` +
          `NEM engedély kérdése: ${t.megjegyzes} Az aktiválás itt nem feloldás, ` +
          `hanem tévedés — és a legveszélyesebb fajta, mert engedélynek látszik.` });
    }
  }
  for (const x of allasok(p, ma)) {
    if (x.allapot === "lejart" || x.allapot === "hianyosAktivalas") {
      out.push({ severity: "error", id: `licenc.${x.tetel.id}`, message: x.miert });
    } else if (x.allapot === "hamarosanLejar") {
      out.push({ severity: "warning", id: `licenc.${x.tetel.id}`, message: x.miert });
    }
  }
  return out;
}

export interface PanelMerleg {
  tetel: number;
  aktiv: number;
  aktivalhato: number;
  nemAktivalhato: number;
  lejaroban: number;
}

export function merleg(p: Panel, ma: string): PanelMerleg {
  const a = allasok(p, ma);
  return {
    tetel: p.tetelek.length,
    aktiv: a.filter((x) => x.nyitva).length,
    aktivalhato: a.filter((x) => x.allapot === "aktivalhato").length,
    nemAktivalhato: a.filter((x) => x.allapot === "nemAktivalhato").length,
    lejaroban: a.filter((x) => x.allapot === "hamarosanLejar").length,
  };
}
