/**
 * A RENDELÉS ÍRÁSI ÚTJA — itt válik a kapu ténylegessé.
 *
 * A `DrugRegistry.check()` megmondja, mi a helyzet. Ez a réteg azt kényszeríti
 * ki, hogy a helyzetnek KÖVETKEZMÉNYE legyen: abszolút kapu mellett a
 * készítmény nem kerül a névsorba, hacsak nincs mellette rögzített indoklás.
 *
 * Miért nem elég a felületre bízni: mert a felület cserélhető, és mert a
 * betöltött, importált vagy programozott rendelés ugyanúgy ír. A szabály a
 * motorban van, tehát nem lehet megkerülni azzal, hogy valaki más képernyőt
 * használ.
 *
 * A kapu NEM megkerülhetetlen — van klinikai helyzet, ahol a kockázat
 * vállalható. De a megkerülésnek nyoma van: melyik kapu, ki, mikor, miért.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { setValue } from "../derive/engine.ts";
import { resolve } from "../derive/resolve.ts";
import type { DrugRegistry, PrescribeCheck } from "./registry.ts";

export interface PrescribeOpts {
  /** Melyik kaput kerüli meg — az azonosítója a `check()` eredményéből. */
  overrideGate?: string;
  /** Miért vállalható a kockázat. ENÉLKÜL a megkerülés nem lehetséges. */
  overrideReason?: string;
  /** Ki rendeli. A megkerülés rögzítéséhez kell. */
  by?: string;
  t?: string;
}

export class GateError extends Error {
  readonly check: PrescribeCheck;
  constructor(message: string, check: PrescribeCheck) {
    super(message);
    this.name = "GateError";
    this.check = check;
  }
}

/**
 * Készítmény felvétele a rendelési névsorba, a kapuk kikényszerítésével.
 *
 * Négy kimenet:
 *   · nincs kapu             → felkerül
 *   · relatív kapu (figyelm.) → felkerül, a figyelmeztetés a `check`-ben marad
 *   · megválaszolatlan feltétel → `GateError`, megnevezve, MIT kell megkérdezni
 *   · abszolút kapu          → `GateError`, hacsak nincs indoklás
 */
export function prescribe(
  reg: Registry, drugs: DrugRegistry, state: CaseState,
  drugId: string, opts: PrescribeOpts = {}, lang: Lang = "hu",
): { state: CaseState; check: PrescribeCheck } {
  const check = drugs.check(reg, state, drugId, lang);

  if (check.outcome === "ask") {
    const asked = check.gates.filter((g) => g.verdict === "ask");
    throw new GateError(
      `${check.label}: a kontraindikáció nem dönthető el, mert hiányzik ` +
      `${asked.flatMap((g) => g.missing).join(", ")}. ` +
      `A hiányzó adat NEM jelenti azt, hogy a kontraindikáció nem áll fenn — ` +
      `kérdezze meg, mielőtt rendel.`,
      check,
    );
  }

  if (check.outcome === "stop") {
    const blocked = check.gates.filter(
      (g) => g.verdict === "blocked" && g.severity === "absolute");
    const gate = blocked[0];
    if (!opts.overrideGate || !opts.overrideReason?.trim()) {
      throw new GateError(
        `${check.label}: ${gate.message}` +
        (gate.alternatives.length
          ? ` Helyette szóba jön: ${gate.alternatives.join(", ")}.`
          : "") +
        ` A rendelés indoklás nélkül nem folytatható.`,
        check,
      );
    }
    if (!blocked.some((g) => g.gate === opts.overrideGate)) {
      throw new GateError(
        `A megadott indoklás nem ehhez a kapuhoz szól ` +
        `(${opts.overrideGate}); a nyitott kapu: ` +
        `${blocked.map((g) => g.gate).join(", ")}.`,
        check,
      );
    }
  }

  // 1. A készítmény felkerül a névsorra — ez nyitja meg a példány mezőit.
  const active = resolve(reg, state, "rx.active");
  const list = Array.isArray(active.value) ? [...(active.value as string[])] : [];
  let next = state;
  if (!list.includes(drugId)) {
    next = setValue(reg, state, "rx.active", [...list, drugId],
      { t: opts.t, sourceRef: opts.by ?? null });
  }

  // 2. A megkerülés a RENDELÉS PÉLDÁNYÁHOZ kötve rögzül, nem külön naplóba:
  //    így a zárójelentésbe és az auditba is ugyanaz kerül, mint a rekordba.
  if (check.outcome === "stop" && opts.overrideGate && opts.overrideReason) {
    next = setValue(reg, next, "rx.override.gate", opts.overrideGate,
      { scope: drugId, t: opts.t, sourceRef: opts.by ?? null });
    next = setValue(reg, next, "rx.override.reason", opts.overrideReason.trim(),
      { scope: drugId, t: opts.t, sourceRef: opts.by ?? null });
  }

  return { state: next, check };
}

/**
 * A rendelt készítmények, amelyeknél kapu-megkerülés történt.
 *
 * Ez a lista megy a zárójelentésbe és az auditba. A modul elfogadási
 * kritériumának második fele: „az indoklás megjelenik a zárójelentésben".
 */
export function overrides(
  reg: Registry, drugs: DrugRegistry, state: CaseState,
): Array<{ drug: string; label: string; gate: string; reason: string; t?: string }> {
  const active = resolve(reg, state, "rx.active");
  const list = Array.isArray(active.value) ? (active.value as string[]) : [];
  const out = [];
  for (const drugId of list) {
    const g = resolve(reg, state, "rx.override.gate", drugId);
    const r = resolve(reg, state, "rx.override.reason", drugId);
    if (g.state !== "ok" || r.state !== "ok") continue;
    out.push({
      drug: drugId,
      label: drugs.get(drugId)?.label.hu ?? drugId,
      gate: String(g.value), reason: String(r.value), t: r.t,
    });
  }
  return out;
}
