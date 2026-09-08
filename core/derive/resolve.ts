/**
 * Értékfeloldás: melyik a legjobb érvényes érték egy változóra.
 *
 * Ez a legalsó réteg a regiszter fölött — a kalkulátorok és a levezetési motor
 * egyaránt erre épül. Nem tud a kalkulátorokról, ezért nincs körkörös függés.
 */
import type { CaseState, Provenance } from "../types.ts";
import { PROVENANCE_RANK } from "../types.ts";
import type { Registry } from "../registry.ts";

export interface Resolved<T = unknown> {
  id: string;
  value: T | null;
  /** `missing` = nincs érték · `stale` = van, de lejárt · `ok` = használható */
  state: "ok" | "missing" | "stale";
  provenance?: Provenance;
  confidence?: string;
  sourceRef?: string | null;
  t?: string;
  /** Ha lejárt: mennyivel. */
  ageMs?: number;
  /**
   * Az érték egy KORÁBBI osztályozási verzió szerint rögzült. Nem hiba:
   * a történeti adat a saját verziója szerint helyes. De aki összehasonlít
   * vagy exportál, annak tudnia kell róla.
   */
  codeSystemVersion?: string | null;
  codeSystemCurrent?: string | null;
  codeSystemOutdated?: boolean;
  /** Példányosított mezőnél: melyik példányra vonatkozik ez a feloldás. */
  scope?: string | null;
}

/** ISO 8601 időtartam → ezredmásodperc. Csak a P#D / PT#H / PT#M alakokat kezeli. */
export function durationMs(iso: string): number | null {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(iso);
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  return (+(m[1] ?? 0)) * 86_400_000 + (+(m[2] ?? 0)) * 3_600_000 + (+(m[3] ?? 0)) * 60_000;
}

/**
 * A legjobb érvényes érték: előbb a származás rangja, azonos rangnál a frissebb.
 * Ha a kontextushoz tartozik érvényességi ablak és az érték kilóg belőle,
 * az eredmény `stale` — amit a fogyasztók hiányzóként kezelnek.
 */
export function resolve(
  reg: Registry, state: CaseState, id: string, scope?: string | null,
): Resolved {
  const primary = reg.resolvePrimary(id);         // mirror feloldása
  const def = reg.get(primary)!;
  const all = state.values[primary] ?? [];

  // PÉLDÁNYSZŰRÉS. Egy panasz jellemzői nem szólhatnak bele egy másik panasz
  // jellemzőibe, pedig ugyanabban a naplóban élnek: a `scope` választja szét
  // őket. Példányosított mező scope NÉLKÜL feloldva mindig hiányzó — nincs
  // olyan, hogy „a fájdalom jellege" panasz megnevezése nélkül.
  const want = scope ?? null;
  const vals = def.scopedBy
    ? all.filter((v) => (v.scope ?? null) === want && want !== null)
    : all.filter((v) => (v.scope ?? null) === null);

  if (vals.length === 0) return { id: primary, value: null, state: "missing" };

  // Precedencia: eredet rangja → az érték IDEJE → a rögzítés SORRENDJE.
  //
  // A harmadik lépcső nem formalitás: ha a klinikus ugyanarra a vizsgálati
  // időpontra javít egy értéket, `t` és `recordedAt` is azonos, és a javítás
  // enélkül nem érvényesülne. A `values[id]` append-only napló, tehát a
  // KÉSŐBB BEKERÜLT elem a frissebb — ezt a megfordítás és a stabil rendezés
  // adja, óra nélkül, determinisztikusan.
  const best = [...vals].reverse().sort((a, b) => {
    const rank = PROVENANCE_RANK[b.provenance] - PROVENANCE_RANK[a.provenance];
    if (rank !== 0) return rank;
    return Date.parse(b.t) - Date.parse(a.t);
  })[0];

  const out: Resolved = {
    id: primary, value: best.value as unknown, state: "ok",
    provenance: best.provenance, confidence: best.confidence,
    sourceRef: best.sourceRef, t: best.t,
  };
  if (def.scopedBy) out.scope = want;

  // Osztályozási verzió: a történeti érték a SAJÁT verziója szerint helyes,
  // de az eltérést jelezni kell — különben egy 2018-as FIGO-stádium csendben
  // a 2023-as rendszer szerint értelmeződik.
  const cs = def.codeSystem;
  if (cs) {
    out.codeSystemVersion = best.codeSystemVersion ?? null;
    out.codeSystemCurrent = cs.version;
    out.codeSystemOutdated = best.codeSystemVersion != null
      && best.codeSystemVersion !== cs.version;
  }

  const window = def.validity?.[state.ctx.encounter];
  if (window) {
    const ms = durationMs(window);
    const age = Date.parse(state.ctx.now) - Date.parse(best.t);
    if (ms != null && Number.isFinite(age) && age > ms) {
      out.state = "stale";
      out.ageMs = age;
    }
  }
  return out;
}

/** Csak a ténylegesen használható érték — lejárt és hiányzó egyaránt null. */
export function usable(
  reg: Registry, state: CaseState, id: string, scope?: string | null,
): unknown | null {
  const r = resolve(reg, state, id, scope);
  return r.state === "ok" ? r.value : null;
}

/**
 * Mely PÉLDÁNYOKRA van rögzített érték egy példányosított mezőn.
 *
 * A névsor (`scopedBy.roster`) mondja meg, mely példányok LÉTEZNEK; ez a
 * függvény azt, melyikre van már adat. A kettő különbsége a kitöltetlen
 * panaszkártya — a felület ezt jeleníti meg teendőként.
 */
export function scopesOf(reg: Registry, state: CaseState, id: string): string[] {
  const primary = reg.resolvePrimary(id);
  const out: string[] = [];
  for (const v of state.values[primary] ?? []) {
    const s = v.scope ?? null;
    if (s !== null && !out.includes(s)) out.push(s);
  }
  return out;
}

/**
 * A névsor aktuális tartalma: mely példányok léteznek egyáltalán.
 * A névsor `coded-multi`, tehát az értéke tömb.
 */
export function rosterOf(reg: Registry, state: CaseState, rosterId: string): string[] {
  const r = resolve(reg, state, rosterId);
  if (r.state !== "ok") return [];
  return Array.isArray(r.value) ? (r.value as string[]) : [];
}

/**
 * RÖGZÍTETT „NEM TUDOM” — a válasz, ami nem állítás.
 *
 * A kódlisták `flags: ["unknown"]` jelöléssel megnevezik azt a kódot, ami nem
 * tényállítás, hanem a tudás hiánya („Nem tudom”, „Nem emlékszik”). A
 * különbség klinikai, nem formai:
 *
 *   · nincs érték          → MÉG NEM KÉRDEZTÜK MEG. Kérdezni kell.
 *   · `unk`                → MEGKÉRDEZTÜK, ÉS NEM TUDJA. Újrakérdezni nem
 *                            segít; a bizonytalanságot vinni kell tovább.
 *   · `neg`                → NEM. Ez állítás, amiért valaki felel.
 *
 * A második összemosása a harmadikkal a rendszer legsúlyosabb csendes hibája:
 * egy „nem emlékszem, volt-e thrombosisom” válaszból „nem volt thrombosisa”
 * lesz, és a profilaxis elmarad. A hiányzó adat sehol nem „nem” — és a
 * rögzített „nem tudom” SEM az.
 */
export function nemTudja(reg: Registry, id: string, value: unknown): boolean {
  const d = reg.get(reg.resolvePrimary(id));
  const opt = d?.valueSet?.find((o) => String(o.code) === String(value));
  return !!opt?.flags?.includes("unknown");
}
