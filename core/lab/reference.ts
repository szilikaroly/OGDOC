/**
 * A referenciatartomány KIVÁLASZTÁSA a beteg aktuális helyzetéhez.
 *
 * Két szabály vezeti, és mindkettő ugyanabból a családból való, mint a
 * kalkulátorok „nincs néma helyettesítés" szabálya:
 *
 *   1. HA NEM TUDJUK, TERHES-E, nem választunk tartományt. A nem terhes
 *      tartomány NEM alapértelmezés — a hiányzó terhességi állapot nem
 *      jelenti azt, hogy nem terhes.
 *   2. HA TERHES, DE A TRIMESZTER ISMERETLEN, minden terhességi tartományt
 *      megvizsgálunk. Ha mindegyik szerint ugyanaz az olvasat (mind
 *      „alacsony", vagy mind „normális"), az az olvasat érvényes — a
 *      trimeszter ismerete ott nem változtatna semmin. Ha eltérnek, az
 *      eredmény `ambiguous`, és megmondja, mi hiányzik.
 *
 * A 2. szabály nem elméleti kényelem: a sürgősségi felvételen a gesztációs kor
 * gyakran csak órákkal később derül ki, a leletet viszont akkor kell olvasni.
 */
import type { CaseState, ReferenceRange, ReferenceSet } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export const PREGNANCY_CONTEXTS = ["pregnancy.t1", "pregnancy.t2", "pregnancy.t3"];

/** A trimeszterhatárok. A 14. hét előtt I., a 28. hét előtt II., utána III. */
export function trimester(gaWeeks: number): string {
  if (gaWeeks < 14) return "pregnancy.t1";
  if (gaWeeks < 28) return "pregnancy.t2";
  return "pregnancy.t3";
}

export type Reading = "low" | "normal" | "high";

export interface RefOk {
  status: "ok";
  /** Melyik kontextus tartománya érvényes. */
  context: string;
  range: ReferenceRange;
  source: ReferenceSet["source"];
  verification: ReferenceSet["verification"];
}
export interface RefAmbiguous {
  status: "ambiguous";
  /** Mely tartományok jöhetnek szóba, mert a trimeszter nem ismert. */
  candidates: ReferenceRange[];
  missing: string[];
  reason: string;
  source: ReferenceSet["source"];
  verification: ReferenceSet["verification"];
}
export interface RefUnavailable {
  status: "unavailable";
  missing: string[];
  reason: string;
}
export type RefResult = RefOk | RefAmbiguous | RefUnavailable;

/** Melyik referencia-kontextusban van a beteg MOST. */
export function contextOf(reg: Registry, state: CaseState): RefResult | string {
  const preg = resolve(reg, state, "ctx.pregnant");
  if (preg.state !== "ok" || preg.value === "unk") {
    return {
      status: "unavailable",
      missing: ["ctx.pregnant"],
      reason:
        "A terhességi állapot ismeretlen, ezért nem választható referenciatartomány. " +
        "A nem terhes tartomány NEM alapértelmezés.",
    };
  }
  if (preg.value !== "pos") return "nonpregnant";

  const ga = resolve(reg, state, "ctx.ga");
  if (ga.state !== "ok" || typeof ga.value !== "number") return "pregnancy.unknown";
  return trimester(ga.value);
}

export function referenceFor(reg: Registry, state: CaseState, id: string): RefResult {
  const def = reg.get(reg.resolvePrimary(id));
  const set = def?.reference;
  if (!set) {
    return {
      status: "unavailable", missing: [],
      reason: `${id}: nincs definiált referenciatartomány`,
    };
  }

  const ctx = contextOf(reg, state);
  if (typeof ctx !== "string") return ctx;      // hiányzó terhességi állapot

  if (ctx === "pregnancy.unknown") {
    const candidates = set.ranges.filter((r) => PREGNANCY_CONTEXTS.includes(r.context));
    if (!candidates.length) {
      return {
        status: "unavailable", missing: [],
        reason: `${id}: nincs terhességi referenciatartomány definiálva`,
      };
    }
    return {
      status: "ambiguous", candidates, missing: ["ctx.ga"],
      reason: "Terhes, de a gesztációs kor ismeretlen — a trimeszter nem választható.",
      source: set.source, verification: set.verification,
    };
  }

  const range = set.ranges.find((r) => r.context === ctx);
  if (!range) {
    return {
      status: "unavailable", missing: [],
      reason: `${id}: nincs referenciatartomány ehhez: ${ctx}`,
    };
  }
  return {
    status: "ok", context: ctx, range,
    source: set.source, verification: set.verification,
  };
}

function read(value: number, r: ReferenceRange): Reading {
  if (r.low != null && value < r.low) return "low";
  if (r.high != null && value > r.high) return "high";
  return "normal";
}

export interface InterpretOk {
  status: "ok";
  reading: Reading;
  value: number;
  context: string;
  range: ReferenceRange;
  source: ReferenceSet["source"];
  verification: ReferenceSet["verification"];
  /** Igaz, ha a trimeszter ismeretlen volt, de minden szóba jövő tartomány egyetért. */
  agreedAcrossTrimesters?: boolean;
}
export interface InterpretUnknown {
  status: "unknown";
  missing: string[];
  reason: string;
}
export type Interpretation = InterpretOk | InterpretUnknown;

/**
 * A lelet olvasata: alacsony · normális · magas — a beteg helyzetéhez tartozó
 * tartomány szerint, a forrás megnevezésével.
 */
export function interpret(
  reg: Registry, state: CaseState, id: string,
): Interpretation {
  const v = resolve(reg, state, id);
  if (v.state !== "ok" || typeof v.value !== "number") {
    return {
      status: "unknown", missing: [id],
      reason: v.state === "stale" ? `${id}: az érték lejárt` : `${id}: nincs érték`,
    };
  }
  const value = v.value;
  const ref = referenceFor(reg, state, id);

  if (ref.status === "unavailable") {
    return { status: "unknown", missing: ref.missing, reason: ref.reason };
  }

  if (ref.status === "ambiguous") {
    // Ha MINDEN szóba jövő trimeszter szerint ugyanaz az olvasat, a trimeszter
    // ismerete nem változtatna rajta — akkor válaszolhatunk.
    const readings = new Set(ref.candidates.map((r) => read(value, r)));
    if (readings.size === 1) {
      return {
        status: "ok", reading: [...readings][0], value,
        context: "pregnancy.unknown", range: ref.candidates[0],
        source: ref.source, verification: ref.verification,
        agreedAcrossTrimesters: true,
      };
    }
    return {
      status: "unknown", missing: ref.missing,
      reason:
        `${ref.reason} A trimeszterek szerint az olvasat eltérne ` +
        `(${[...readings].join(" / ")}), ezért nem értelmezzük.`,
    };
  }

  return {
    status: "ok", reading: read(value, ref.range), value,
    context: ref.context, range: ref.range,
    source: ref.source, verification: ref.verification,
  };
}
