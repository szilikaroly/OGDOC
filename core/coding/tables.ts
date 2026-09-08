/**
 * KÓDTÁBLÁK — a táblakeresés törzse, verzióval és forrással.
 *
 * A tábla nem konfiguráció: ADAT, ami avul. Az EESZT-törzsek havonta
 * frissülnek, a BNO évente. Ezért minden táblán ott a verzió, az érvényesség
 * kezdete és a forrás — és ezek a FELÜLETEN is megjelennek, hogy látszódjon,
 * mennyire friss az, amiből a rendszer dolgozik.
 *
 * A táblák NINCSENEK beleégetve a kódba: a `registry/kodok/tablak/`
 * könyvtárból töltődnek, és a betöltés EXPLICIT. Amíg egy tábla nincs
 * betöltve, a rá épülő levezetés NEM ad értéket — és ezt a
 * `CaseState.errors[]`-be írja, hogy az okosleleten is látszódjon. Nem
 * találgat, és nem hallgat.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";

export interface CodeTable {
  id: string;
  label: I18n;
  /** A törzs saját verziója — ez jelenik meg a felületen. */
  version: string;
  validFrom: string;
  /**
   * Meddig volt érvényes ez a KIADÁS. Hiánya = ez a hatályos kiadás.
   *
   * Az archív kiadás nem múzeum: a HBCS 671A „Császármetszés" súlyszáma
   * 2025 májusában 1,53177 volt, 2026 áprilisában 1,74947 — ugyanazzal a
   * csoportkóddal. Egy 2025-ös eset visszamenőleges elszámolása a mai
   * táblával CSENDBEN rossz összeget ad.
   */
  validUntil?: string;
  source: { cite: string; standard?: string | null };
  /**
   * Mennyire teljes a betöltött tábla.
   *
   *   full   — a teljes törzs
   *   subset — SZÁNDÉKOSAN részhalmaz; a hiányzó kulcs nem hiba, csak nincs benne
   */
  coverage: "full" | "subset";
  coverageNote?: I18n;
  /** Kulcs → oszlopnév → érték. */
  rows: Record<string, Record<string, string>>;
}

const TABLE_BY_ID = new Map<string, CodeTable>();

export function registerTable(t: CodeTable): void {
  if (TABLE_BY_ID.has(t.id)) {
    throw new Error(
      `A(z) ${t.id} kódtábla már be van töltve. Egy azonosítóhoz egy tábla ` +
      `tartozik — két verzió egyidejű betöltése esetén nem lenne eldönthető, ` +
      `melyikből olvastunk.`,
    );
  }
  TABLE_BY_ID.set(t.id, t);
}

export function getTable(id: string): CodeTable | undefined { return TABLE_BY_ID.get(id); }

export interface TableAsOf {
  table: CodeTable | null;
  why: string;
}

/**
 * MELYIK KIADÁSBÓL kell dolgozni egy adott ellátási napon.
 *
 * A kiadások `tbl.hbcs` (a hatályos) és `tbl.hbcs@2025-05-01` (archív) alakban
 * töltődnek be. A választás nem kényelmi kérdés: a mai táblával elszámolt
 * tavalyi eset rossz összeget ad, és ez a hiba nem látszik, mert a csoportkód
 * ugyanaz maradt.
 *
 * Ha az adott napra egyik betöltött kiadás sem érvényes, a válasz NEM a
 * legközelebbi kiadás, hanem a hiány kimondása.
 */
export function tableAsOf(baseId: string, on: string): TableAsOf {
  const family = allTables().filter((t) => t.id === baseId || t.id.startsWith(baseId + "@"));
  if (!family.length) {
    return { table: null, why: `A(z) ${baseId} törzs egyetlen kiadása sincs betöltve.` };
  }
  const hit = family.find((t) => on >= t.validFrom && (!t.validUntil || on <= t.validUntil));
  if (hit) {
    return {
      table: hit,
      why:
        `A(z) ${on} napra a(z) ${hit.version} kiadás érvényes ` +
        `(${hit.validFrom}${hit.validUntil ? `–${hit.validUntil}` : "-től"}).`,
    };
  }
  const known = family
    .map((t) => `${t.version} (${t.validFrom}${t.validUntil ? `–${t.validUntil}` : "-től"})`)
    .sort().join(", ");
  return {
    table: null,
    why:
      `A(z) ${on} napra a(z) ${baseId} törzs EGYIK betöltött kiadása sem ` +
      `érvényes. Betöltve: ${known}. A rendszer NEM a legközelebbi kiadással ` +
      `számol helyette: az elszámolás csendben lenne rossz.`,
  };
}
export function allTables(): CodeTable[] { return [...TABLE_BY_ID.values()]; }
export function clearTables(): void { TABLE_BY_ID.clear(); }

export interface LookupResult {
  value: string | null;
  table: string;
  version: string;
  /** Miért nincs érték, ha nincs. */
  why?: string;
}

export function lookupCode(tableId: string, key: unknown, column = "label"): LookupResult {
  const t = TABLE_BY_ID.get(tableId);
  if (!t) {
    return {
      value: null, table: tableId, version: "—",
      why:
        `A(z) ${tableId} kódtábla NINCS BETÖLTVE. A levezetés ezért nem ad ` +
        `értéket — a rendszer nem találgat, és nem hallgat: ez a hiba a ` +
        `dokumentumon is megjelenik.`,
    };
  }
  const row = t.rows[String(key)];
  if (!row) {
    return {
      value: null, table: tableId, version: t.version,
      why: t.coverage === "subset"
        ? `A(z) „${String(key)}" kulcs nincs a betöltött RÉSZHALMAZBAN ` +
          `(${tableId} ${t.version}). Ez nem hibás adat: a teljes törzs nincs ` +
          `betöltve.`
        : `A(z) „${String(key)}" kulcs nem szerepel a(z) ${tableId} ` +
          `${t.version} törzsben.`,
    };
  }
  const v = row[column];
  if (v == null) {
    return {
      value: null, table: tableId, version: t.version,
      why: `A(z) ${tableId} táblában nincs „${column}" oszlop ehhez a kulcshoz.`,
    };
  }
  return { value: v, table: tableId, version: t.version };
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadCodeTables(...paths: string[]): CodeTable[] {
  const out: CodeTable[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8")) as CodeTable | CodeTable[];
      for (const t of Array.isArray(parsed) ? parsed : [parsed]) {
        // A könyvtárban kísérő fájlok is lehetnek (pl. betöltési manifest);
        // tábla csak az, aminek azonosítója ÉS sorai vannak.
        if (!t?.id || !t?.rows) continue;
        if (!TABLE_BY_ID.has(t.id)) registerTable(t);
        out.push(t);
      }
    }
  }
  return out;
}

const L = (x: I18n | undefined, lang: Lang = "hu"): string => x?.[lang] ?? x?.hu ?? "";

/** Emberi olvasatra: melyik törzsből, milyen verzióból dolgozunk. */
export function tableStamp(lang: Lang = "hu"): string {
  if (!TABLE_BY_ID.size) return "Nincs betöltött kódtábla.";
  return allTables()
    .map((t) =>
      `${L(t.label, lang)} ${t.version} (${t.validFrom}` +
      (t.coverage === "subset" ? ", RÉSZHALMAZ" : "") + ")")
    .join(" · ");
}

/**
 * AMI HIÁNYZIK — nevesítve, nem elhallgatva.
 *
 * A kódajánlás annyit tud, amennyi törzs be van töltve. Ami nincs, azt a
 * rendszer nem pótolja becsléssel; de a hiányt sem hallgatja el, mert akkor a
 * felhasználó azt hinné, hogy a lista teljes.
 *
 * KÉT KÜLÖNBÖZŐ BEAVATKOZÁSI LISTA VAN, és ez a leggyakoribb félreértés: a
 * JÁRÓBETEG-OENO (`tbl.oeno`, 13590 = Amnioscopia) és a FEKVŐBETEG beavatkozási
 * törzs (`tbl.mut`, 57410 = Császármetszés - cervicalis, transversalis). MINDKETTŐ
 * ötjegyű hazai kód — a formájukról tehát NEM lehet megkülönböztetni őket, csak
 * a törzsről, amelyikből valók. Ami viszont biztosan egyikbe sem tartozik: az
 * ICD-9-CM „74.10" alak. Az amerikai lista, és a magyar finanszírozásban
 * értelmezhetetlen.
 */
export interface MissingStem {
  /** Ha megvan, de NEM kódtáblaként: hol él. */
  providedBy?: string;
  id: string;
  label: string;
  needed: string;
  reason: string;
}

export const EXPECTED_STEMS: MissingStem[] = [
  {
    id: "tbl.hbcs.besorolas",
    label: "HBCS besorolási táblázat (10/2012. NEFMI 2. melléklet)",
    needed: "a besorolási táblázat gépi alakban",
    /**
     * MEGVAN — de NEM kódtáblaként.
     *
     * A besorolás nem lapos kulcs-érték tábla, hanem szabálykészlet:
     * csoportonként kódlista-blokkok és egy logikai kifejezés, ami megmondja,
     * a blokkok milyen kombinációja esetén esik oda az eset. Ezért a
     * `registry/finanszirozas/` alá került, saját betöltővel és
     * kiértékelővel (`core/finanszirozas/besorolas.ts`).
     *
     * A bejegyzés azért marad itt, hogy fél év múlva ne kezdje el valaki
     * újra kódtáblaként keresni.
     */
    providedBy: "registry/finanszirozas/hbcs-besorolas.json",
    reason:
      "A súlyszámtábla teljes, és a rendelet KÓDOLÁSI szabályai is megvannak " +
      "(mit kötelező rögzíteni egy szüléshez — ezt a `core/coding/fekvo.ts` " +
      "ellenőrzi). Az viszont nincs gépi alakban, hogy egy adott " +
      "diagnózis-beavatkozás kombináció MELYIK csoportba esik. A rendszer " +
      "ezért csoportot NEM állapít meg, csak egy ismert csoport súlyszámát, " +
      "határnapjait és minősítését adja.",
  },
  {
    id: "tbl.snomed.hu",
    label: "SNOMED CT magyar megnevezések",
    needed: "validált magyar fordítás (SNOMED International fordítási eljárás)",
    reason:
      "A Global Patient Set HELYBEN TELEPÍTHETŐ (CC BY-ND 4.0), és a rendszer " +
      "SNOMED-azonosítót ajánl is — de a megnevezések ANGOLUL vannak. Magyar " +
      "SNOMED-megnevezést a rendszer NEM ad: a fordítás validált eljárást " +
      "kíván (SNOMED International: Guidelines for Translation of SNOMED CT), " +
      "és egy rögtönzött magyar alak nem SNOMED. Ugyanaz a kapu, mint a " +
      "validált kérdőívek fordításánál.",
  },
];

/**
 * MELY ELVÁRT TÖRZSEK NINCSENEK BETÖLTVE.
 *
 * A `providedBy` jelölésű tétel nem hiányzik: megvan, csak nem kódtáblaként.
 * Ha hiányzónak jelentenénk, a lefedettségi jelentés évekig azt írná, hogy
 * várunk valamire, ami már megvan.
 */
export function missingStems(): MissingStem[] {
  return EXPECTED_STEMS.filter((s) => !s.providedBy && !TABLE_BY_ID.has(s.id));
}

export function validateTables(reg: Registry): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  for (const t of allTables()) {
    if (!t.version) issues.push({ severity: "error", id: t.id, message: "a kódtáblának verziója kell legyen" });
    if (!t.source?.cite) issues.push({ severity: "error", id: t.id, message: "a kódtáblának forrást kell megneveznie" });
    if (!Object.keys(t.rows).length) issues.push({ severity: "error", id: t.id, message: "üres kódtábla" });
    if (t.coverage === "subset" && !t.coverageNote) {
      issues.push({
        severity: "warning", id: t.id,
        message: "RÉSZHALMAZ-tábla indoklás nélkül — ki kell mondani, mi maradt ki és miért",
      });
    }
  }
  // A levezetések hivatkozásai
  for (const d of reg.all()) {
    const dv = d.derivation;
    if (dv?.kind !== "lookup") continue;
    if (!getTable(dv.table)) {
      issues.push({ severity: "error", id: d.id, message: `ismeretlen kódtábla: ${dv.table}` });
    }
    if (!reg.get(dv.from)) {
      issues.push({ severity: "error", id: d.id, message: `a keresési kulcs ismeretlen változó: ${dv.from}` });
    }
    if (d.datatype !== "text") {
      issues.push({
        severity: "error", id: d.id,
        message: "a táblakeresés kimenete szöveg — a mező típusa nem `text`",
      });
    }
  }
  return issues;
}
