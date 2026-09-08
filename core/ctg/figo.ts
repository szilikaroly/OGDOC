/**
 * CTG-BESOROLÁS — ÉS AMIT A MODUL SZÁNDÉKOSAN NEM TESZ.
 *
 * A rendszer eddig a CTG BESOROLÁST tárolta (`ctg.category`, FIGO 2015:
 * normál / gyanús / kóros / preterminális) — a HÁROM JELLEMZŐ NÉLKÜL, amiken a
 * besorolás nyugszik. Az alapvonal, a variabilitás és a lassulások típusa
 * sehol nem volt mező.
 *
 * Ennek három következménye volt, és mind a három csendes:
 *
 * 1. A BESOROLÁS NEM VOLT VISSZAKÖVETHETŐ. Utólag nem lehetett megnézni, mi
 *    alapján született — sem oktatásban, sem esetelemzésben, sem perben.
 * 2. A KIMENETELI HUROKNAK NEM VOLT MIT MÉRNIE. A 17. lépés `outcomeAudit`
 *    hurka a besorolás és az újszülött állapota közötti kapcsolatot nézné; a
 *    besorolás viszont egyetlen kód, aminek nincs bemenete.
 * 3. ÉS SEMMILYEN MODELLNEK NEM VOLT MIT ENNIE. A CTG-osztályozó tárak — a
 *    licenckapun túljutók is — pontosan ezeket a jellemzőket várják.
 *
 * AMIT VISZONT NEM CSINÁLUNK: nem osztályozunk a klinikus helyett.
 *
 * A modul a jellemzőkből MÁSODIK olvasatot képez, és a két olvasat
 * ÖSSZEVETÉSE a termék. Egyezésnél nem történik semmi. Eltérésnél az egyet nem
 * értés LÁTSZIK — nem felülbírálás, hanem kérdés. Ez ugyanaz a szerkezet, mint
 * a védőnői űrlap beépített egyezés-ellenőrzése (szülő válasza vs. a védőnő
 * saját észlelése) és az audithurok „Egyezes” típusa.
 *
 * Miért nem osztályozunk: a CTG-értékelés értékelők közötti egyezése gyenge,
 * és a leggyakoribb hiba nem a rossz besorolás, hanem az, hogy a besorolás
 * mögötti jellemzőket senki nem írja le. Egy automatikus besorolás ezt nem
 * javítja — csak áthelyezi a felelősséget. A jellemzők rögzítése igen.
 *
 * ÉS A HIÁNYZÓ JELLEMZŐ ITT SEM „NORMÁLIS”. Ha egy jellemző hiányzik, a
 * származtatott olvasat nem születik meg: `nemSzarmaztathato`. Egy hiányzó
 * variabilitás-érték mellett a „normál” besorolás nem megerősítés, hanem
 * megalapozatlan — és a különbséget látni kell.
 */
import { readFileSync } from "node:fs";
import type { CaseState } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import { resolve } from "../derive/resolve.ts";

export interface FigoSzabaly extends Condition {
  miert: string;
}

export interface FigoBesorolas {
  kod: string;
  label_hu: string;
  /** Súlyossági rang; a magasabb nyer. */
  rang: number;
  /** Bármelyik teljesülése elég. */
  barmelyik?: FigoSzabaly[];
  /** Mindegyiknek teljesülnie kell. */
  mind?: FigoSzabaly[];
  megjegyzes?: string;
}

export interface FigoKeszlet {
  id: string;
  megnevezes: string;
  forras: string;
  note: string;
  jellemzok: string[];
  besorolasok: FigoBesorolas[];
  hitelesitesek: Array<{ ki: string; mikor: string }>;
}

export function loadFigo(path: string): FigoKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as FigoKeszlet;
}

function test(value: unknown, c: Condition): boolean {
  switch (c.op) {
    case "eq": return value === c.value;
    case "ne": return value !== c.value;
    case "in": return Array.isArray(c.value) && c.value.includes(value);
    case "lt": return Number(value) < Number(c.value);
    case "lte": return Number(value) <= Number(c.value);
    case "gt": return Number(value) > Number(c.value);
    case "gte": return Number(value) >= Number(c.value);
  }
}

export type SzarmaztatasAllapot = "szarmaztatva" | "nemSzarmaztathato";

export interface Szarmaztatas {
  allapot: SzarmaztatasAllapot;
  /** A származtatott besorolás kódja — „nemSzarmaztathato” esetén null. */
  kod: string | null;
  /** Mely jellemző hiányzik. */
  hianyzo: string[];
  /** Mely szabályok teljesültek, névvel. */
  indokok: string[];
}

/** A jellemzőkből származtatott besorolás. Nem ítélet, hanem MÁSODIK olvasat. */
export function szarmaztat(
  k: FigoKeszlet, reg: Registry, state: CaseState,
): Szarmaztatas {
  const ertek = new Map<string, unknown>();
  const hianyzo: string[] = [];
  for (const j of k.jellemzok) {
    const r = resolve(reg, state, j);
    if (r.state !== "ok" || r.value === null || r.value === undefined) hianyzo.push(j);
    else ertek.set(j, r.value);
  }
  if (hianyzo.length) {
    return { allapot: "nemSzarmaztathato", kod: null, hianyzo, indokok: [] };
  }
  const rendezett = [...k.besorolasok].sort((a, b) => b.rang - a.rang);
  for (const b of rendezett) {
    if (b.barmelyik?.length) {
      const indokok = b.barmelyik.filter((sz) => test(ertek.get(sz.var), sz))
        .map((sz) => sz.miert);
      if (indokok.length) {
        return { allapot: "szarmaztatva", kod: b.kod, hianyzo: [], indokok };
      }
    }
    if (b.mind?.length && b.mind.every((sz) => test(ertek.get(sz.var), sz))) {
      return { allapot: "szarmaztatva", kod: b.kod, hianyzo: [],
        indokok: [...new Set(b.mind.map((sz) => sz.miert))] };
    }
  }
  /* Egyik besorolás sem illeszkedik. A készlet ezt NEM találgatja ki: ha nincs
     rá szabály, azt mondjuk meg, hogy nincs. */
  return { allapot: "nemSzarmaztathato", kod: null, hianyzo: [],
    indokok: ["Egyetlen besorolási szabály sem illeszkedik a rögzített jellemzőkre."] };
}

export type EgyezesAllapot =
  | "egyezik"
  /** A klinikus és a jellemzők MÁST mondanak. EZ A JEL. */
  | "elter"
  /** A jellemzők hiányoznak — a besorolás nem visszakövethető. */
  | "nemSzarmaztathato"
  /** Nincs klinikusi besorolás, amihez mérni lehetne. */
  | "nincsBesorolas";

export interface Egyezes {
  allapot: EgyezesAllapot;
  klinikusi: string | null;
  szarmaztatott: string | null;
  hianyzo: string[];
  miert: string;
}

/**
 * A KÉT OLVASAT ÖSSZEVETÉSE. Nem felülbírál: megmutatja az eltérést.
 *
 * A preterminális kategóriának SZÁNDÉKOSAN nincs származtatási szabálya: azt a
 * görbét nem jellemzőkből ismerik fel, hanem ránézésre, és a teendő azonnali.
 * Ilyenkor a modul nem mond eltérést — hallgat.
 */
export function egyezes(
  k: FigoKeszlet, reg: Registry, state: CaseState,
): Egyezes {
  const kl = resolve(reg, state, "ctg.category");
  const klinikusi = kl.state === "ok" && typeof kl.value === "string" ? kl.value : null;
  const sz = szarmaztat(k, reg, state);

  if (!klinikusi) {
    return { allapot: "nincsBesorolas", klinikusi: null, szarmaztatott: sz.kod,
      hianyzo: sz.hianyzo,
      miert:
        `Nincs rögzített klinikusi CTG-besorolás. A jellemzőkből származtatott ` +
        `olvasat önmagában NEM besorolás — a rendszer nem osztályoz a klinikus ` +
        `helyett.` };
  }
  if (klinikusi === "preterminal") {
    return { allapot: "egyezik", klinikusi, szarmaztatott: sz.kod, hianyzo: sz.hianyzo,
      miert:
        `Preterminális görbe: erre a modul nem képez második olvasatot. Azt a ` +
        `görbét nem jellemzőkből ismerik fel, és a teendő azonnali.` };
  }
  if (sz.allapot === "nemSzarmaztathato") {
    return { allapot: "nemSzarmaztathato", klinikusi, szarmaztatott: null,
      hianyzo: sz.hianyzo,
      miert: sz.hianyzo.length
        ? `A besorolás („${klinikusi}”) rögzítve van, de a jellemzők hiányoznak ` +
          `(${sz.hianyzo.join(", ")}). A besorolás így NEM VISSZAKÖVETHETŐ: utólag ` +
          `nem lehet megnézni, mi alapján született. A hiányzó jellemző nem ` +
          `„normális” — a megerősítés marad el, nem az eltérés.`
        : `A rögzített jellemzőkre egyetlen besorolási szabály sem illeszkedik, ` +
          `ezért második olvasat nem születik.` };
  }
  if (sz.kod === klinikusi) {
    return { allapot: "egyezik", klinikusi, szarmaztatott: sz.kod, hianyzo: [],
      miert: `A klinikusi besorolás és a jellemzők egyeznek (${sz.indokok.join(" ")}).` };
  }
  return { allapot: "elter", klinikusi, szarmaztatott: sz.kod, hianyzo: [],
    miert:
      `EGYET NEM ÉRTÉS: a klinikus „${klinikusi}”-t rögzített, a jellemzőkből ` +
      `viszont „${sz.kod}” következik (${sz.indokok.join(" ")}). Ez NEM ` +
      `felülbírálás, hanem kérdés — vagy a jellemző rögzítése pontatlan, vagy a ` +
      `besorolás, és a kettő közötti különbség pontosan az, ami a CTG-értékelés ` +
      `értékelők közötti egyezését gyengévé teszi.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateFigo(k: FigoKeszlet, reg: Registry): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const v of [...k.jellemzok, "ctg.category"]) {
    let ok = false;
    try { ok = !!reg.get(reg.resolvePrimary(v)); } catch { ok = false; }
    if (!ok) {
      out.push({ severity: "error", id: `figo.${v}`,
        message: `A FIGO-készlet nem létező változóra hivatkozik: „${v}”.` });
    }
  }
  const kodok = new Set(reg.get("ctg.category")?.valueSet?.map((o) => String(o.code)) ?? []);
  for (const b of k.besorolasok) {
    if (kodok.size && !kodok.has(b.kod)) {
      out.push({ severity: "error", id: `figo.${b.kod}`,
        message:
          `A(z) „${b.kod}” besorolás nincs a ctg.category kódlistájában. Egy ` +
          `származtatott besorolás, ami nem is rögzíthető, sosem egyezhet.` });
    }
    for (const sz of [...(b.barmelyik ?? []), ...(b.mind ?? [])]) {
      if (!k.jellemzok.includes(sz.var)) {
        out.push({ severity: "error", id: `figo.${b.kod}`,
          message:
            `A(z) „${b.kod}” szabálya a(z) „${sz.var}” változóra hivatkozik, ` +
            `ami nincs a jellemzők között — a származtatás így nem venné észre, ` +
            `ha hiányzik, és a hiányt „nem teljesül”-ként olvasná.` });
      }
      if (!sz.miert?.trim()) {
        out.push({ severity: "error", id: `figo.${b.kod}`,
          message:
            `Indoklás nélküli szabály: egy eltérés, aminek nincs oka, nem ` +
            `kérdés, csak zaj.` });
      }
    }
    if (!b.barmelyik?.length && !b.mind?.length) {
      out.push({ severity: "error", id: `figo.${b.kod}`,
        message: `A(z) „${b.kod}” besoroláshoz nincs egyetlen szabály sem.` });
    }
  }
  const rangok = k.besorolasok.map((b) => b.rang);
  if (new Set(rangok).size !== rangok.length) {
    out.push({ severity: "error", id: "figo.rang",
      message:
        `Két besorolásnak azonos a rangja. A sorrend dönti el, melyik nyer, és ` +
        `holtversenynél a betöltési sorrend döntene — az pedig nem szabály.` });
  }
  if (!k.hitelesitesek.length) {
    out.push({ severity: "warning", id: "figo.hitelesites",
      message:
        `A FIGO-besorolási készlet aláíratlan. A második olvasat így ` +
        `TÁJÉKOZTATÓ: eltérést jelez, de a jelzés súlyát senki nem vállalta.` });
  }
  return out;
}
