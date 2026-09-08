/**
 * KÜLSŐ MODELL — együtthatókból, ADATBÓL, nem kódból.
 *
 * Ez a modul EGYETLEN külső modellt sem ismer. Nincs benne PRB, nincs benne
 * preeclampsia, nincs benne egyetlen együttható sem. Amit tud: beolvas egy
 * együtthatómátrixot, felépíti belőle a lineáris prediktort, és megmondja,
 * mi hiányzik hozzá.
 *
 * MIÉRT ÍGY. Az OGDOC licence MIT, a PRB preeclampsia-modellé GPLv2. A kettő
 * a TERJESZTÉS irányában nem egyeztethető össze: egy GPL-műből származtatott
 * művet nem lehet MIT alatt továbbadni. Ha tehát a modell a mi KÓDUNKBAN
 * lenne — akár képletként, akár beégetett számokként —, a terjesztett mű
 * GPL-származék volna.
 *
 * A megoldás nem trükk, hanem a rendszer alapszabálya, ugyanaz, mint a
 * szabályoknál és a normogramoknál:
 *
 *     A MODELL ADAT, NEM KÓD.
 *
 * A mag generikus kiértékelő; a modell a felhasználó gépén, a
 * `registry/kulso/helyi/` alatt települ, és soha nem része a terjesztett
 * műnek. Ugyanaz a szerkezet, mint a SNOMED-nél — ott a licenc TILTJA a
 * származék terjesztését, itt FELTÉTELHEZ köti; a következmény ugyanaz.
 *
 * HÁROM KAPU, ÉS MINDHÁROM MEGNEVEZI MAGÁT:
 *
 *   1. NINCS TELEPÍTVE  — a mag nem tesz úgy, mintha lenne modell.
 *   2. HIÁNYZÓ BEMENET  — a hiányzó érték SOHA nem nulla. Egy kihagyott tag
 *      nem „semleges”: pontosan úgy visel, mintha a beteg értéke épp a
 *      referenciaátlag volna, és ez állítás, nem hiány.
 *   3. HITELESÍTETLEN   — a `verification` nem `primary`: szám nem születik.
 *      Ugyanaz a kapu, mint a `calc.verified` és a CMQCC vérzési tábla.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { I18n } from "../types.ts";

/* ── A MODELL LEÍRÁSA — a helyi könyvtárból ──────────────────────────── */

export interface ModellLekepezes {
  /** A mi változónk, vagy `null`, ha nincs ilyen — és akkor a modell nem fut. */
  variable?: string | null;
  tipus: string;
  szabaly?: string;
  hianyzik?: string;
}

export interface KulsoModell {
  id: string;
  label: I18n;
  licenc: string;
  figyelmeztetes?: string;
  /** `primary` = hitelesített. Minden más: szám nem születik. */
  verification: "primary" | "secondary" | "assumed";
  verificationNote?: string;
  retegek: string[];
  retegHatarok: number[];
  retegValtozo: string;
  tablak: Record<string, string>;
  prior?: string;
  lekepezes: Record<string, ModellLekepezes>;
}

export function betoltModell(dir: string): KulsoModell | null {
  const p = join(dir, "MODELL.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as KulsoModell;
}

/** Telepítve van-e a modell. Nem hiba, ha nincs — a terjesztett műben SOHA nincs. */
export function telepitve(dir: string): boolean {
  return existsSync(join(dir, "MODELL.json"));
}

/* ── EGYÜTTHATÓMÁTRIX ────────────────────────────────────────────────── */

export interface Egyutthatok {
  /** A tagok neve — a mátrix SORAI. Az `a:b` alak szorzatot jelent. */
  tagok: string[];
  /** A rétegek — a mátrix OSZLOPAI. */
  retegek: string[];
  ertek(tag: string, reteg: string): number | undefined;
}

/** Idézőjel-tudatos CSV-bontás: a fejlécekben zárójel és vessző is lehet. */
function bontSor(sor: string): string[] {
  const ki: string[] = [];
  let cella = "";
  let idezojelben = false;
  for (let i = 0; i < sor.length; i++) {
    const c = sor[i];
    if (c === '"') {
      if (idezojelben && sor[i + 1] === '"') { cella += '"'; i++; }
      else idezojelben = !idezojelben;
    } else if (c === "," && !idezojelben) { ki.push(cella); cella = ""; }
    else cella += c;
  }
  ki.push(cella);
  return ki.map((x) => x.trim());
}

export function olvasEgyutthatok(path: string): Egyutthatok {
  const sorok = readFileSync(path, "utf8").split(/\r?\n/).filter((s) => s.trim());
  if (sorok.length < 2) throw new Error(`üres együtthatótábla: ${path}`);
  const fejlec = bontSor(sorok[0]);
  // Az első oszlop a sornév — a fejlécben lehet üres vagy „rownames”.
  const retegek = fejlec.slice(1);
  const map = new Map<string, Map<string, number>>();
  const tagok: string[] = [];
  for (const sor of sorok.slice(1)) {
    const cellak = bontSor(sor);
    const tag = cellak[0];
    tagok.push(tag);
    const soronkent = new Map<string, number>();
    retegek.forEach((r, i) => {
      const n = Number(cellak[i + 1]);
      if (Number.isFinite(n)) soronkent.set(r, n);
    });
    map.set(tag, soronkent);
  }
  return {
    tagok, retegek,
    ertek: (tag, reteg) => map.get(tag)?.get(reteg),
  };
}

/* ── A LINEÁRIS PREDIKTOR ────────────────────────────────────────────── */

export interface PrediktorEredmeny {
  /** Az összeg — csak akkor van, ha MINDEN szükséges tag megvolt. */
  ertek: number | null;
  /** Amelyik taghoz nem volt érték. A hiányzó tag nem nulla. */
  hianyzo: string[];
  /** Amelyik tag együtthatója 0 — ezek nem is vesznek részt a modellben. */
  kihagyott: string[];
}

/**
 * Kiszámolja a lineáris prediktort egy réteg együtthatóiból.
 *
 * A `(Intercept)` tag értéke definíció szerint 1. Az `a:b` alakú tag a két
 * változó SZORZATA — ha bármelyik hiányzik, a szorzat is hiányzik.
 *
 * A NULLA EGYÜTTHATÓJÚ TAGOT kihagyjuk, és ez nem kényelmi döntés: a
 * mátrixban a nulla azt jelenti, hogy a tag ebben a rétegben NINCS BENNE a
 * modellben. Ilyenkor a hozzá tartozó bemenet hiánya sem akadály — de ezt
 * külön ki is írjuk, hogy ne látszódjon elhallgatásnak.
 */
export function linearisPrediktor(
  coef: Egyutthatok, reteg: string, ertekek: Record<string, number | null | undefined>,
): PrediktorEredmeny {
  const hianyzo: string[] = [];
  const kihagyott: string[] = [];
  let osszeg = 0;

  for (const tag of coef.tagok) {
    const c = coef.ertek(tag, reteg);
    if (c === undefined) { hianyzo.push(`${tag}@${reteg}`); continue; }
    if (c === 0) { kihagyott.push(tag); continue; }

    if (tag === "(Intercept)") { osszeg += c; continue; }

    const reszek = tag.split(":");
    let szorzat = 1;
    let hianyos = false;
    for (const r of reszek) {
      const v = ertekek[r];
      if (v == null || !Number.isFinite(v)) { hianyos = true; break; }
      szorzat *= v;
    }
    if (hianyos) { hianyzo.push(tag); continue; }
    osszeg += c * szorzat;
  }

  return {
    ertek: hianyzo.length ? null : osszeg,
    hianyzo, kihagyott,
  };
}

/* ── A TELJES KIÉRTÉKELÉS ────────────────────────────────────────────── */

export type ModellAllapot =
  | "nincsTelepitve"
  | "ismeretlenReteg"
  | "hianyzoBemenet"
  | "hitelesitetlen"
  | "ok";

export interface ModellEredmeny {
  allapot: ModellAllapot;
  /** A szám — CSAK `ok` állapotban. Minden más esetben `null`. */
  ertek: number | null;
  /** Emberi olvasatra: miért nincs szám. `ok` esetén `null`. */
  miert: string | null;
  hianyzo: string[];
  reteg: string | null;
  /** A modell licence — a kimeneten is meg kell jelennie, ha egyszer lesz. */
  licenc: string | null;
}

/** Melyik rétegbe esik az érték a határok szerint. */
export function retegHatarok(modell: KulsoModell, ertek: number): string | null {
  const h = modell.retegHatarok;
  for (let i = 0; i < modell.retegek.length && i + 1 < h.length; i++) {
    if (ertek >= h[i] && ertek < h[i + 1]) return modell.retegek[i];
  }
  return null;
}

export function ertekelModell(
  dir: string, tabla: string, retegErtek: number,
  ertekek: Record<string, number | null | undefined>,
): ModellEredmeny {
  const ures = { ertek: null, hianyzo: [] as string[], reteg: null, licenc: null };

  const modell = betoltModell(dir);
  if (!modell) {
    return {
      ...ures, allapot: "nincsTelepitve",
      miert:
        "a modell nincs telepítve. Ez az ALAPÉRTELMEZETT állapot: a modell " +
        "licence miatt nem része a terjesztett műnek, a felhasználónak kell " +
        "helyben telepítenie",
    };
  }
  const licenc = modell.licenc;

  const fajl = modell.tablak[tabla];
  if (!fajl || !existsSync(join(dir, fajl))) {
    return {
      ...ures, licenc, allapot: "nincsTelepitve",
      miert: `a(z) „${tabla}” tábla nincs telepítve`,
    };
  }

  const reteg = retegHatarok(modell, retegErtek);
  if (!reteg) {
    return {
      ...ures, licenc, allapot: "ismeretlenReteg",
      miert:
        `a(z) ${modell.retegValtozo} = ${retegErtek} érték a modell ` +
        `érvényességi tartományán (${modell.retegHatarok[0]}–` +
        `${modell.retegHatarok[modell.retegHatarok.length - 1]}) KÍVÜL esik. ` +
        `A tartományon kívüli extrapoláció nem óvatlanság kérdése: a modell ` +
        `ott nem tanult semmit`,
    };
  }

  const coef = olvasEgyutthatok(join(dir, fajl));
  const p = linearisPrediktor(coef, reteg, ertekek);
  if (p.hianyzo.length) {
    return {
      ...ures, licenc, reteg, allapot: "hianyzoBemenet",
      hianyzo: p.hianyzo,
      miert:
        `hiányzó bemenet: ${p.hianyzo.join(", ")}. A hiányzó érték nem nulla — ` +
        `a nullával számolt tag azt állítaná, hogy a beteg értéke épp a ` +
        `referenciaátlag`,
    };
  }

  // A SZÁMÍTÁS MEGVAN — és a rendszer mégsem adja ki, ha hitelesítetlen.
  if (modell.verification !== "primary") {
    return {
      ...ures, licenc, reteg, allapot: "hitelesitetlen",
      miert:
        `a modell együtthatói nincsenek visszaellenőrizve az elsődleges ` +
        `forrással (verification: ${modell.verification}). ` +
        `${modell.verificationNote ?? ""}`.trim(),
    };
  }

  return {
    allapot: "ok", ertek: p.ertek, miert: null,
    hianyzo: [], reteg, licenc,
  };
}
