/**
 * Validált mérőeszközök — felvétel, pontozás, kritikus tétel.
 *
 * Három kapu, mindegyik ugyanabból a családból, mint a rendszer többi kapuja:
 *
 *   1. LICENCELETLEN TÉTELSZÖVEG → az eszköz nem vehető fel. Egy saját
 *      szavakkal feltett „EPDS" nem EPDS, és a vágóértéke nem érvényes rá.
 *   2. HIÁNYZÓ TÉTEL → nincs összpontszám. A tízből kilenc kitöltött tétel
 *      nem „majdnem teljes EPDS": a validált vágóérték a teljes skálára
 *      vonatkozik, és a részleges kitöltés arányosítása nem validált eljárás.
 *   3. KRITIKUS TÉTEL → vörös zászló az összpontszámtól FÜGGETLENÜL, és ezt
 *      a sávbesorolás nem nyomhatja el.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Instrument, ScoreBand } from "./types.ts";
import { resolve } from "../derive/resolve.ts";
import { runCalc } from "../calc/run.ts";
import { felvehetoseg } from "./licenc.ts";
import type { LicencAllapot, LicencKatalogus } from "./licenc.ts";

/** Nyilvántartás nélkül a válasz fail-safe: a meg nem mutatott licenc nem licenc. */
const URES_LICENC: LicencKatalogus = { szerepek: {}, licencek: [], dontesek: [] };

const L = (x: I18n | undefined | null, lang: Lang): string =>
  x?.[lang] ?? x?.hu ?? x?.en ?? "";

export interface ScoreOk {
  status: "ok";
  instrument: string;
  total: number;
  /** Melyik kontextus vágóértéke szerint. */
  context: string;
  band: { label: string; severity: ScoreBand["severity"] };
  /** A KRITIKUS TÉTEL külön, a sávtól függetlenül. */
  critical: { triggered: boolean; item?: string; message?: string };
  /** Fordítási állapot — a kutatási felhasználhatóság feltétele. */
  translation: Instrument["translation"]["status"];
  source: Instrument["source"];
}
export interface ScoreBlocked {
  status: "insufficient";
  instrument: string;
  missing: string[];
  reason: string;
  /** A kritikus tétel akkor is szól, ha az összpontszám nem születik meg. */
  critical: { triggered: boolean; item?: string; message?: string };
}
export type InstrumentResult = ScoreOk | ScoreBlocked;

export class Instruments {
  private byId = new Map<string, Instrument>();

  constructor(list: Instrument[]) {
    for (const i of list) {
      if (this.byId.has(i.id)) throw new Error(`Duplikált mérőeszköz: ${i.id}`);
      this.byId.set(i.id, i);
    }
  }

  get(id: string): Instrument | undefined { return this.byId.get(id); }
  all(): Instrument[] { return [...this.byId.values()]; }

  /**
   * FELVEHETŐ-E az eszköz. A licenceletlen tételszöveg nem formai hiányosság:
   * a validált vágóérték a validált szövegre vonatkozik.
   *
   * A DÖNTÉST A NYILVÁNTARTÁS HOZZA, NEM A JELÖLÉS. A 12. lépés óta az
   * `itemText: "loaded"` szó önmagában nem nyit kaput: nyilvántartott licenc
   * kell mögé, jogosulttal, hatókörrel és lejárattal. Ha a hívó nem ad
   * nyilvántartást, a válasz fail-safe — csak a szabadon használható szövegű
   * eszköz vehető fel —, mert a meg nem mutatott licenc nem licenc.
   *
   * AZ OK MEGNEVEZVE JÖN VISSZA. Enélkül az „ismeretlen eszköz” és a „nincs
   * licenc” ugyanúgy néz ki, és egy elrontott hívás olyan tesztet tud
   * átvinni, ami épp a kaput hivatott bizonyítani.
   */
  administrable(
    id: string, lang: Lang = "hu", kat?: LicencKatalogus, ma?: string,
  ): { ok: boolean; allapot: LicencAllapot | "ismeretlen"; reason?: string } {
    const i = this.byId.get(id);
    if (!i) {
      return { ok: false, allapot: "ismeretlen",
        reason: `Ismeretlen mérőeszköz: ${id} — ez hívási hiba, nem licenckérdés.` };
    }
    const f = felvehetoseg(i, kat ?? URES_LICENC, ma ?? new Date().toISOString().slice(0, 10));
    if (f.ok) return { ok: true, allapot: f.allapot };
    return {
      ok: false, allapot: f.allapot,
      reason:
        (f.allapot === "rendezetlen"
          ? `A(z) ${i.abbrev} validált tételszövege nincs betöltve (licenc). ` +
            `Saját megfogalmazású kérdésekkel felvéve az eszköz nem az eszköz, ` +
            `és a vágóértékei sem érvényesek rá. ` + (L(i.itemText.note, lang) || "")
          : `A(z) ${i.abbrev} nem vehető fel. `) + f.miert,
    };
  }

  /** Melyik vágóérték-készlet érvényes ebben a helyzetben. */
  contextOf(reg: Registry, state: CaseState, id: string): string {
    const i = this.byId.get(id)!;
    const pathway = resolve(reg, state, "ctx.pathway");
    const key = pathway.state === "ok" ? String(pathway.value) : "";
    if (key && i.bands[key]) return key;
    return "default";
  }

  score(reg: Registry, state: CaseState, id: string, lang: Lang = "hu"): InstrumentResult {
    const i = this.byId.get(id)!;

    // A KRITIKUS TÉTEL kiértékelése ELŐBB: akkor is szólnia kell, ha az
    // összpontszám hiányos tételek miatt nem születik meg.
    const critical = this.criticalOf(reg, state, id, lang);

    const calc = runCalc(reg, state, i.calc, lang);
    if (calc.status !== "ok") {
      return {
        status: "insufficient", instrument: id,
        missing: calc.missing,
        reason:
          `${i.abbrev}: ${calc.reason} A részlegesen kitöltött skála nem ` +
          `arányosítható — a validált vágóérték a teljes eszközre vonatkozik.`,
        critical,
      };
    }

    const ctx = this.contextOf(reg, state, id);
    const bands = i.bands[ctx] ?? i.bands.default ?? [];
    const band = bands.find((b) =>
      (b.min == null || calc.value >= b.min) && (b.max == null || calc.value <= b.max));

    return {
      status: "ok", instrument: id, total: calc.value, context: ctx,
      band: {
        label: band ? L(band.label, lang) : "nincs besorolás",
        severity: band?.severity ?? "normal",
      },
      critical,
      translation: i.translation.status,
      source: i.source,
    };
  }

  private criticalOf(
    reg: Registry, state: CaseState, id: string, lang: Lang,
  ): ScoreOk["critical"] {
    const i = this.byId.get(id)!;
    const c = i.criticalItem;
    if (!c) return { triggered: false };
    const item = i.items.find((q) => q.id === c.id);
    if (!item) return { triggered: false };
    const v = resolve(reg, state, item.variable);
    if (v.state !== "ok") return { triggered: false, item: c.id };
    const triggered = Number(v.value) >= c.minScore;
    return triggered
      ? { triggered: true, item: c.id, message: L(c.message, lang) }
      : { triggered: false, item: c.id };
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const i of this.all()) {
      if (!i.source?.cite) push("error", i.id, "a mérőeszköznek meg kell neveznie a validációs közleményt");
      if (!i.items.length) push("error", i.id, "nincs egyetlen tétele sem");

      const seen = new Set<number>();
      for (const q of i.items) {
        if (seen.has(q.index)) push("error", i.id, `ismétlődő tételsorszám: ${q.index}`);
        seen.add(q.index);
        if (!reg.get(q.variable)) {
          push("error", i.id, `a(z) ${q.id} tétel ismeretlen változóra mutat: ${q.variable}`);
        }
        if (!q.options.length) push("error", i.id, `${q.id}: nincs válaszlehetőség`);
        // A pontozást nem alakítjuk át — de az legalább legyen egyértelmű.
        const scores = q.options.map((o) => o.score);
        if (new Set(scores).size !== scores.length) {
          push("error", i.id, `${q.id}: két válasz azonos pontértékkel`);
        }
        // A regiszterbeli kódkészletnek EGYEZNIE kell a tétel pontértékeivel,
        // különben a kérdőív mást pontoz, mint amit a felület felvesz.
        const def = reg.get(q.variable);
        const codes = (def?.valueSet ?? []).map((o) => Number(o.code)).filter(Number.isFinite);
        if (codes.length && codes.sort().join(",") !== [...scores].sort().join(",")) {
          push("error", i.id,
            `${q.id}: a változó kódkészlete (${codes.join(",")}) eltér a tétel ` +
            `pontértékeitől (${scores.join(",")})`);
        }
      }

      if (i.criticalItem && !i.items.some((q) => q.id === i.criticalItem!.id)) {
        push("error", i.id, `a kritikus tétel nem szerepel a tételek közt: ${i.criticalItem.id}`);
      }
      if (!Object.keys(i.bands).length) push("error", i.id, "nincs egyetlen vágóérték-készlet sem");

      if (i.translation.status === "unvalidated") {
        push("warning", i.id,
          "NEM VALIDÁLT magyar fordítás — a vele gyűjtött adat publikálhatósága korlátozott");
      }
      if (i.translation.status === "validated" && !i.translation.source?.cite) {
        push("error", i.id, "validáltnak jelölt fordítás a validációs közlemény megnevezése nélkül");
      }
      if (i.itemText.status === "notLicensed") {
        push("warning", i.id,
          `a validált tételszöveg nincs betöltve (licenc) — az eszköz NEM vehető fel`);
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

/**
 * KÍSÉRŐFÁJLOK — a mérőeszközök mellett élő, de nem mérőeszköz-listák.
 *
 * NÉVVEL ismerjük fel őket, nem alak szerint. Ha a felismerés arra épülne,
 * hogy „ami nem tömb, azt kihagyjuk”, akkor egy elgépelt mérőeszközfájl
 * CSENDBEN kiesne a betöltésből — a hiba pedig ott jelenne meg, hogy egy
 * kérdőív egyszer csak nincs sehol. Ugyanaz a szabály, mint a normogramoknál.
 */
const KISERO_FAJLOK = ["licencek.json"];

export function loadInstruments(...paths: string[]): Instruments {
  const list: Instrument[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      if (KISERO_FAJLOK.some((k) => f.endsWith(k))) continue;
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a kérdőívfájl tömböt vár`);
      list.push(...parsed);
    }
  }
  return new Instruments(list);
}
