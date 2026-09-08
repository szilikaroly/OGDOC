/**
 * A HARMINC LABORREFERENCIA HITELESÍTÉSE — a 6. lépés gépi fele.
 *
 * Harminckét változónak van referenciatartománya, és MIND A HARMINCKETTŐ
 * `assumed`: a számok egy táblából származnak, de senki nem vetette össze
 * őket az elsődleges közleménnyel. A rendszer ezért ma minden mérés mellé
 * kiírja, hogy a referencia feltételezett — ami helyes, de nem cél.
 *
 * MIÉRT SZÁMÍT. Egy 180 U/L alkalikus foszfatáz a 3. trimeszterben normális,
 * nem terhesen emelkedett. Rossz referenciával a rendszer vagy riogat, vagy
 * megnyugtat, és a kettő közül a második a veszélyesebb.
 *
 * EZ A RÉTEG NEM HITELESÍT. Egyetlen számot sem tud ellenőrizni: ahhoz az
 * elsődleges tábla kell és egy laboratóriumi szakorvos. Amit tesz:
 *
 *   1. AZ ALÁÍRÁS A SZÁMOKHOZ KÖTŐDIK, nem a változóhoz. A lenyomat a
 *      referencia NORMATÍV MAGJÁT fedi: az egységet és a sávok határait. Ha
 *      valaki egy határértéket megváltoztat, az aláírás `elavult` lesz — nem
 *      tűnik el, de nem is fedezi tovább a megváltozott számot. A megjegyzés
 *      vagy a forrás idézetének javítása viszont NEM rontja el: azt nem
 *      aláírták.
 *
 *   2. A HITELESÍTÉS NYIT KAPUT, NEM A JELÖLÉS. Az `alkalmaz()` a hitelesített
 *      tételek `verification` mezőjét emeli `primary`-re — futásidőben, az
 *      aláírásokból. A regiszter JSON-jában a `verification` nem írható át
 *      kézzel „primary”-re: az aláírás nélküli emelés pontosan az a lépés,
 *      amit meg kell akadályozni.
 *
 *   3. A HIÁNYZÓ ALÁÍRÁS SEHOL NEM „RENDBEN VAN”. Aláírás nélkül a tétel
 *      `assumed` marad, és a mérés mellett ott áll, hogy miért.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { VariableDef } from "../types.ts";
import type { Registry } from "../registry.ts";

/* ── A LENYOMAT ──────────────────────────────────────────────────────── */

/**
 * A referencia NORMATÍV MAGJA — ez az, amit aláírnak.
 *
 * Szándékosan csak az egység és a határok. A `note`, a `source.cite` és a
 * címke kimarad: egy elírás javítása vagy egy hivatkozás pontosítása nem
 * teheti érvénytelenné a szakorvos aláírását. Egy HATÁRÉRTÉK viszont igen.
 */
export function lenyeg(d: VariableDef): string {
  const sorok = (d.reference?.ranges ?? [])
    .map((r) => `${r.context}=${r.low ?? "-inf"}..${r.high ?? "+inf"}`)
    .sort();
  return `${d.id}|${d.unit ?? ""}|${sorok.join(";")}`;
}

export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);
}

/* ── AZ ALÁÍRÁS ──────────────────────────────────────────────────────── */

export interface Hitelesites {
  variable: string;
  /** Ki írta alá. Névtelen aláírás nem aláírás. */
  ki: string;
  szerep: string;
  mikor: string;
  /** A `lenyeg()` lenyomata az aláírás pillanatában. */
  lenyomat: string;
  /**
   * MELYIK TÁBLÁVAL vetették össze — kiadással és oldalszámmal, ha van.
   * Nem formaság: a „Abbassi-Ghanavati 2009” önmagában nem mondja meg, melyik
   * sorral. Egy későbbi vitát ez a mező dönt el.
   */
  forrasTabla: string;
  megjegyzes?: string;
}

export interface HitelesitesKatalogus {
  szerepek: Record<string, string>;
  hitelesitesek: Hitelesites[];
}

export function loadHitelesitesek(path: string): HitelesitesKatalogus {
  return JSON.parse(readFileSync(path, "utf8")) as HitelesitesKatalogus;
}

/* ── ÁLLAPOT ─────────────────────────────────────────────────────────── */

export type HitelesitesAllapot = "hitelesitve" | "alairatlan" | "elavult";

export interface TetelAllapot {
  variable: string;
  label: string;
  unit: string | null;
  allapot: HitelesitesAllapot;
  /** Hány sávot fed — ennyi számot kell összevetni. */
  savok: number;
  forras: string;
  lenyomat: string;
  alairo: string | null;
  mikor: string | null;
  /** Ha `elavult`: mi változott az aláírás óta. */
  miert: string | null;
}

export function referenciasValtozok(reg: Registry): VariableDef[] {
  return reg.all()
    .filter((d) => d.reference?.ranges?.length)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function hitelesitesAllapot(
  reg: Registry, kat: HitelesitesKatalogus,
): TetelAllapot[] {
  const byVar = new Map(kat.hitelesitesek.map((h) => [h.variable, h]));
  return referenciasValtozok(reg).map((d) => {
    const mag = lenyomat(lenyeg(d));
    const h = byVar.get(d.id);
    const kozos = {
      variable: d.id,
      label: d.label?.hu ?? d.id,
      unit: d.unit ?? null,
      savok: d.reference!.ranges.length,
      forras: d.reference!.source.cite,
      lenyomat: mag,
    };
    if (!h) {
      return { ...kozos, allapot: "alairatlan" as const,
               alairo: null, mikor: null, miert: null };
    }
    if (h.lenyomat !== mag) {
      return {
        ...kozos, allapot: "elavult" as const, alairo: h.ki, mikor: h.mikor,
        miert:
          `a referencia számai megváltoztak az aláírás óta ` +
          `(aláírt: ${h.lenyomat}, mostani: ${mag}) — az aláírás nem fedezi ` +
          `a mostani határértékeket`,
      };
    }
    return { ...kozos, allapot: "hitelesitve" as const,
             alairo: h.ki, mikor: h.mikor, miert: null };
  });
}

export interface Merleg {
  osszes: number;
  hitelesitve: number;
  alairatlan: number;
  elavult: number;
  /** Ahány SÁV (szám) még összevetésre vár. */
  savokHatra: number;
}

export function merleg(allapotok: TetelAllapot[]): Merleg {
  const sz = (a: HitelesitesAllapot) => allapotok.filter((x) => x.allapot === a).length;
  return {
    osszes: allapotok.length,
    hitelesitve: sz("hitelesitve"),
    alairatlan: sz("alairatlan"),
    elavult: sz("elavult"),
    savokHatra: allapotok
      .filter((x) => x.allapot !== "hitelesitve")
      .reduce((n, x) => n + x.savok, 0),
  };
}

/* ── AMI TÉNYLEG KAPUT NYIT ──────────────────────────────────────────── */

/**
 * A hitelesített tételek `verification` mezőjét emeli `primary`-re.
 *
 * EZ AZ EGYETLEN ÚT `primary`-re. A regiszter JSON-jában kézzel átírt
 * „primary” nem elég — a `validateHitelesitesek()` hibaként fogja meg —, mert
 * az aláírás nélküli emelés pontosan az a mozdulat, ami a kaput kinyitná
 * anélkül, hogy bárki felelne érte.
 *
 * A művelet nem mutál: új definíciókat ad vissza.
 */
export function alkalmaz(reg: Registry, kat: HitelesitesKatalogus): number {
  const allapotok = hitelesitesAllapot(reg, kat);
  let n = 0;
  for (const a of allapotok) {
    if (a.allapot !== "hitelesitve") continue;
    const d = reg.get(a.variable);
    if (!d?.reference) continue;
    d.reference.verification = "primary";
    n++;
  }
  return n;
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export interface HitelesitesIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

export function validateHitelesitesek(
  reg: Registry, kat: HitelesitesKatalogus,
): HitelesitesIssue[] {
  const out: HitelesitesIssue[] = [];
  const latott = new Set<string>();

  for (const h of kat.hitelesitesek) {
    if (latott.has(h.variable)) {
      out.push({ severity: "error", id: h.variable,
                 message: "két hitelesítés ugyanarra a változóra" });
    }
    latott.add(h.variable);

    const d = reg.get(h.variable);
    if (!d) {
      out.push({ severity: "error", id: h.variable,
                 message: "hitelesítés nem létező változóra" });
      continue;
    }
    if (!d.reference?.ranges?.length) {
      out.push({ severity: "error", id: h.variable,
                 message: "hitelesítés olyan változóra, aminek nincs referenciatartománya" });
    }
    if (!h.ki?.trim()) {
      out.push({ severity: "error", id: h.variable,
                 message: "névtelen hitelesítés — az aláíró megnevezése nélkül nincs felelős" });
    }
    if (!h.forrasTabla?.trim()) {
      out.push({
        severity: "error", id: h.variable,
        message:
          "a `forrasTabla` hiányzik — enélkül nem derül ki, MELYIK sorral " +
          "vetették össze, és egy későbbi vitát semmi nem dönt el",
      });
    }
    if (!kat.szerepek[h.szerep]) {
      out.push({ severity: "warning", id: h.variable,
                 message: `ismeretlen szerepkör: „${h.szerep}”` });
    }
  }

  // A LEGFONTOSABB SZABÁLY: `primary` csak aláírásból lehet.
  for (const d of referenciasValtozok(reg)) {
    if (d.reference!.verification !== "primary") continue;
    const h = kat.hitelesitesek.find((x) => x.variable === d.id);
    if (!h) {
      out.push({
        severity: "error", id: d.id,
        message:
          "`verification: \"primary\"` a regiszterben, HITELESÍTÉS NÉLKÜL. " +
          "A kaput aláírás nyitja, nem jelölés — a hitelesítés a " +
          "`registry/labor/referencia-hitelesitesek.json`-ba kerül",
      });
    } else if (h.lenyomat !== lenyomat(lenyeg(d))) {
      out.push({
        severity: "error", id: d.id,
        message:
          "`primary` jelölés ELAVULT aláírással: a számok az aláírás óta " +
          "megváltoztak, tehát a kapu aláírás nélkül áll nyitva",
      });
    }
  }

  for (const a of hitelesitesAllapot(reg, kat)) {
    if (a.allapot === "elavult") {
      out.push({ severity: "error", id: a.variable, message: a.miert! });
    }
  }
  return out;
}
