/**
 * SNOMED CT — a licenc, ami nem tiltás, hanem FELTÉTEL.
 *
 * A Global Patient Set (GPS) a CREATIVE COMMONS BY-ND 4.0 alatt jelenik meg.
 * Ez két dolgot jelent, és a második a kevésbé nyilvánvaló:
 *
 *   · ATTRIBUTION — a forrásmegjelölés KÖTELEZŐ mindenhol, ahol
 *     SNOMED-megnevezés megjelenik. Nem a dokumentációban: a KIMENETEN.
 *   · NoDerivatives — másolni és VÁLTOZATLANUL továbbadni szabad, az
 *     ÁTALAKÍTOTT változat terjesztése viszont NEM engedélyezett.
 *
 * A mi JSON-táblánk átalakítás. Ezért a SNOMED-törzs a `registry/kodok/helyi/`
 * könyvtárba települ, ami a `.gitignore`-ban van: HELYBEN áll elő, és soha nem
 * kerül a repóba. A repó legfeljebb SNOMED-AZONOSÍTÓKAT tartalmaz
 * kereszthivatkozásként — ahogy a LOINC-kódokat is —, a fogalomkészletet nem.
 *
 * A HARMADIK KORLÁT NEM JOGI, HANEM NYELVI. A GPS megnevezései ANGOLUL
 * vannak. A magyar megnevezés nem fordítás kérdése, hanem FOLYAMATÉ: a
 * SNOMED International fordítási irányelve (IHTSDO: Guidelines for
 * Translation of SNOMED CT, v2.02) szerint a fordítás validált eljárást
 * kíván. Ezért a rendszer magyar SNOMED-megnevezést NEM ad — az angolt adja,
 * megjelölve, hogy az angol.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

export const SNOMED_NOTICE =
  "© International Health Terminology Standards Development Organisation " +
  "(SNOMED International). SNOMED CT® was originally created by the College " +
  "of American Pathologists. A SNOMED CT Global Patient Set a Creative " +
  "Commons Attribution-NoDerivatives 4.0 International licenc alatt érhető el " +
  "(https://creativecommons.org/licenses/by-nd/4.0/). " +
  "Forrás: https://www.snomed.org/gps";

interface SnomedTable {
  version: string;
  validFrom?: string;
  rows: Record<string, { label: string; fsn: string }>;
}

let TABLE: SnomedTable | null = null;

/**
 * A helyi SNOMED-törzs betöltése, HA települt.
 *
 * Hiánya nem hiba: a repó szándékosan nem tartalmazza. A rendszer ilyenkor
 * SNOMED-azonosítót továbbra is rögzít és továbbad, csak megnevezést nem old
 * fel — és ezt kimondja.
 */
export function loadSnomed(dir = "registry/kodok/helyi"): boolean {
  if (!existsSync(dir)) return false;
  const f = readdirSync(dir).find((x) => x.startsWith("tbl-snomed") && x.endsWith(".json"));
  if (!f) return false;
  TABLE = JSON.parse(readFileSync(join(dir, f), "utf8")) as SnomedTable;
  return true;
}

export function clearSnomed(): void { TABLE = null; }

/** Teszthez és beágyazott futtatáshoz: kis, saját táblával. */
export function useSnomedTable(t: SnomedTable): void { TABLE = t; }

export interface SnomedStatus {
  installed: boolean;
  version: string | null;
  concepts: number;
  /** A magyar megnevezések állapota. */
  translation: "none" | "validated";
  notice: string;
  why: string;
}

export function snomedStatus(): SnomedStatus {
  if (!TABLE) {
    return {
      installed: false, version: null, concepts: 0, translation: "none",
      notice: SNOMED_NOTICE,
      why:
        "A SNOMED-törzs NINCS TELEPÍTVE. Ez nem hiba: a Global Patient Set " +
        "CC BY-ND licence miatt az átalakított tábla nem terjeszthető, ezért a " +
        "repó nem tartalmazza — helyben kell telepíteni " +
        "(tools/ingest/torzs_ingest.py). Addig a rendszer SNOMED-azonosítót " +
        "rögzít és továbbad, de megnevezést nem old fel.",
    };
  }
  return {
    installed: true, version: TABLE.version,
    concepts: Object.keys(TABLE.rows).length,
    translation: "none", notice: SNOMED_NOTICE,
    why:
      `Telepítve: ${Object.keys(TABLE.rows).length} aktív fogalom, ` +
      `${TABLE.version} kiadás. A megnevezések ANGOLUL vannak: magyar ` +
      `SNOMED-megnevezést a rendszer NEM ad, mert a fordítás validált ` +
      `eljárást kíván (SNOMED International: Guidelines for Translation of ` +
      `SNOMED CT).`,
  };
}

export interface SnomedTerm {
  id: string;
  /** A megnevezés, ha feloldható. */
  term: string | null;
  fsn: string | null;
  /** Milyen nyelven — SOHA nem `hu`. */
  language: "en" | null;
  /** A kötelező forrásmegjelölés. A kimeneten meg kell jelennie. */
  notice: string;
  why?: string;
}

/**
 * Egy SNOMED-fogalom megnevezése.
 *
 * `hu` kérésre is ANGOL megnevezést ad — megjelölve. Ez szándékos: egy
 * rögtönzött magyar fordítás nem SNOMED, és a vele gyűjtött adat nem
 * összehasonlítható. Ugyanaz a szabály, mint a validált kérdőíveknél.
 */
export function snomedTerm(id: string, lang: Lang = "hu"): SnomedTerm {
  const base = { id, notice: SNOMED_NOTICE };
  if (!TABLE) {
    return {
      ...base, term: null, fsn: null, language: null,
      why:
        "A SNOMED-törzs nincs telepítve, ezért a megnevezés nem oldható fel. " +
        "AZ AZONOSÍTÓ ATTÓL MÉG ÉRVÉNYES: rögzíthető, exportálható, és a " +
        "fogadó rendszer feloldja.",
    };
  }
  const row = TABLE.rows[id];
  if (!row) {
    return {
      ...base, term: null, fsn: null, language: null,
      why:
        `A(z) ${id} fogalom nincs a betöltött GPS-kiadásban (${TABLE.version}). ` +
        `A GPS a teljes SNOMED CT RÉSZHALMAZA — a hiány nem jelenti azt, hogy a ` +
        `fogalom nem létezik, csak azt, hogy ebben a kiadásban nincs benne.`,
    };
  }
  return {
    ...base, term: row.label, fsn: row.fsn, language: "en",
    why: lang === "en" ? undefined :
      "A megnevezés ANGOL. Magyar SNOMED-megnevezést a rendszer nem ad: a " +
      "fordítás validált eljárást kíván, és egy rögtönzött magyar alak nem " +
      "SNOMED — a vele gyűjtött adat nem összehasonlítható.",
  };
}

/**
 * A LICENC MINT BUILD-SZABÁLY.
 *
 * Ha a SNOMED-tábla valaha a terjesztett (`tablak/`) könyvtárba kerülne, az
 * licencsértés lenne — nem stílushiba. A validátor ezért HIBÁT ad rá.
 */
export function validateSnomedDistribution(
  distributedDir = "registry/kodok/tablak",
): RegistryIssue[] {
  if (!existsSync(distributedDir)) return [];
  const bad = readdirSync(distributedDir).filter((f) => /snomed/i.test(f));
  return bad.map((f) => ({
    severity: "error" as const,
    id: `registry/kodok/tablak/${f}`,
    message:
      "SNOMED-tábla a TERJESZTETT könyvtárban: a Global Patient Set CC BY-ND " +
      "licence az átalakított változat továbbadását nem engedi. A törzs helye " +
      "a `registry/kodok/helyi/`, ami a .gitignore-ban van.",
  }));
}

/* ── SZEMANTIKAI CÍMKE — a hierarchia, ami a FSN végén áll ───────────── */

/**
 * A teljesen meghatározott név (FSN) zárójeles vége a fogalom
 * FŐHIERARCHIÁJA: `Severe pre-eclampsia (disorder)`,
 * `Cesarean section (procedure)`, `Intraocular pressure (observable entity)`.
 *
 * Ez nem díszítés: pontosan azt a hibaosztályt fogja meg, amelyik a
 * rendszerben egyszer már megtörtént. A HELLP-hez emlékezetből beírt
 * 41633001 azonosító Verhoeff-helyes, létező fogalom — csak épp egy
 * MÉRHETŐ MENNYISÉG (`observable entity`), nem betegség. A szám alakja ezt
 * nem árulja el; a címke igen.
 */
export function semanticTag(id: string): string | null {
  const fsn = TABLE?.rows[id]?.fsn;
  if (!fsn) return null;
  const m = /\(([^()]+)\)\s*$/.exec(fsn);
  return m ? m[1] : null;
}

/**
 * Olyan főhierarchiák, amelyekben egy KLINIKAI ÁLLÍTÁS soha nem lakik.
 *
 * A lista szándékosan tiltó, nem megengedő: a SNOMED hierarchiái bővülnek, és
 * egy megengedő lista minden kiadásnál elavulna — ráadásul úgy, hogy a
 * helyes azonosítót utasítaná el. Amit itt felsorolunk, az viszont
 * biztosan nem diagnózis és nem beavatkozás.
 */
export const NON_CLINICAL_TAGS = [
  "observable entity", "substance", "organism", "body structure",
  "qualifier value", "physical object", "medicinal product",
  "medicinal product form", "clinical drug", "specimen", "occupation",
  "environment", "record artifact", "person", "namespace concept",
  "attribute", "link assertion", "metadata", "cell", "cell structure",
  "geographic location", "social concept", "ethnic group", "religion/philosophy",
  "product", "assessment scale", "staging scale", "tumor staging",
] as const;

export interface TagCheck {
  id: string;
  tag: string | null;
  /** `ok` · `nonClinical` · `unknown` (a készlet nincs betöltve vagy nincs benne). */
  status: "ok" | "nonClinical" | "unknown";
  why: string;
}

/**
 * Klinikai állításhoz való-e ez a fogalom.
 *
 * Ha a készlet nincs telepítve, a válasz `unknown` — NEM „rendben". A
 * licencből következő helyi telepítés hiánya nem tehet egy ellenőrzést
 * hallgatólagosan elfogadóvá.
 */
export function checkClinicalTag(id: string): TagCheck {
  const tag = semanticTag(id);
  if (!TABLE) {
    return { id, tag: null, status: "unknown",
      why:
        "A SNOMED-készlet nincs telepítve, ezért a fogalom főhierarchiája nem " +
        "ellenőrizhető. Ez NEM azt jelenti, hogy a fogalom megfelelő." };
  }
  if (!tag) {
    return { id, tag: null, status: "unknown",
      why: `A(z) ${id} nincs a betöltött GPS-kiadásban (${TABLE.version}).` };
  }
  if ((NON_CLINICAL_TAGS as readonly string[]).includes(tag)) {
    return { id, tag, status: "nonClinical",
      why:
        `A(z) ${id} a „${tag}” főhierarchiába tartozik, ami nem klinikai ` +
        `állítás. Egy diagnózis- vagy beavatkozásszabály nem mutathat ide — ` +
        `a szám alakja ezt nem árulja el, a főhierarchia igen.` };
  }
  return { id, tag, status: "ok",
    why: `A(z) ${id} a „${tag}” főhierarchiába tartozik.` };
}
