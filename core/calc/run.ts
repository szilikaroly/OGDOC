/**
 * A kalkulátor-futtató. EGY belépési pont minden számításhoz.
 *
 * Amit itt kényszerítünk ki — hogy egyetlen kalkulátornak se kelljen külön
 * megtennie, és hogy ne lehessen kifelejteni:
 *
 *   · hiányzó vagy LEJÁRT bemenet  → `insufficient`, a hiányzók felsorolásával
 *   · ellenőrizetlen konstans      → `insufficient`, teljes bemenettel is
 *   · dátum bemenet                → epoch-ezredmásodpercre konvertálva
 *   · az eredmény mellé            → a sáv és annak súlyossága
 */
import type { Registry } from "../registry.ts";
import type { CaseState, ScoreResult } from "../types.ts";
import { resolve } from "../derive/resolve.ts";
import { CALC_BY_ID } from "./defs.ts";
import type { CalcBand, CalcDef } from "./types.ts";
import { withUnit } from "../ui/units.ts";

export interface CalcOk {
  status: "ok";
  value: number;
  /**
   * A MEGJELENÍTÉSI ALAK — egy helyen, mert két helyen volt.
   *
   * A dátum-kimenetű kalkulátor (Naegele) epoch-ezredmásodpercet ad, és ezt
   * a zárójelentés (`epikrizis/build.ts`) tudta: ISO-dátumot írt belőle. A
   * webes nézet és a levezetett mező NEM tudta: a várható szülési időpont a
   * képernyőn „1795132800000” volt — a mezőben ÉS a kalkulátorpanelen is. Ha a
   * megjelenítés a hívóé, minden hívó külön rontja el; itt van, egyszer.
   */
  display: string;
  /** Amit a levezetett VÁLTOZÓBA kell írni: dátum-változóba ISO-dátum, nem szám. */
  stored: number | string;
  unit?: string | null;
  /** Az eredményhez tartozó sáv, ha van definiálva. */
  band?: { label: string; severity: CalcBand["severity"] };
  interpretation?: string;
  inputs: Record<string, unknown>;
}
export type CalcResult = CalcOk | Extract<ScoreResult, { status: "insufficient" }>;

/** Egy bemenet szám-alakja. Dátumból epoch-ezredmásodperc lesz. */
function toNumber(reg: Registry, id: string, raw: unknown): number | null {
  const def = reg.get(reg.resolvePrimary(id));
  if (def?.datatype === "date" || def?.datatype === "datetime") {
    const ms = Date.parse(String(raw));
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "boolean") return raw ? 1 : 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function bandFor(def: CalcDef, value: number, lang: "hu" | "en"): CalcOk["band"] {
  for (const b of def.output.bands ?? []) {
    const okMin = b.min == null || value >= b.min;
    const okMax = b.max == null || value < b.max;
    if (okMin && okMax) {
      return { label: b.label[lang] ?? b.label.hu ?? "", severity: b.severity };
    }
  }
  return undefined;
}

export function runCalc(
  reg: Registry, state: CaseState, calcId: string, lang: "hu" | "en" = "hu",
): CalcResult {
  const def = CALC_BY_ID.get(calcId);
  if (!def) throw new Error(`Ismeretlen kalkulátor: ${calcId}`);

  // 1. bemenetek begyűjtése — a lejárt érték ugyanúgy hiányzik, mint a nem létező
  const missing: string[] = [];
  const snapshot: Record<string, unknown> = {};
  const args: number[] = [];

  for (const inp of def.inputs) {
    const r = resolve(reg, state, inp.id);
    snapshot[inp.id] = r.state === "ok" ? r.value : `<${r.state}>`;
    if (r.state !== "ok") {
      if (inp.required !== false) missing.push(inp.id);
      args.push(NaN);
      continue;
    }
    const n = toNumber(reg, inp.id, r.value);
    if (n == null) {
      missing.push(inp.id);
      args.push(NaN);
      continue;
    }
    args.push(n);
  }

  if (missing.length) {
    /*
     * A HIÁNYZÓ BEMENET NEM MINDIG HIÁNYZÓ MÉRÉS.
     *
     * Ha a bemenet maga LEVEZETETT, és a levezetését végző kalkulátor a
     * hitelesítési kapu mögött áll, akkor az érték nem azért nincs meg, mert
     * senki nem mérte, hanem mert senki nem írta alá. A kettő teendője
     * ellentétes: az egyikre menni kell és megmérni, a másikra aláírni.
     *
     * A puszta „Hiányzó vagy lejárt bemenet” üzenet a keresőt a rossz irányba
     * küldi — egy mérés után, ami már megvan.
     */
    const zartLanc = missing
      .map((id) => {
        const d = reg.get(reg.resolvePrimary(id));
        const c = d?.derivation?.calc ? CALC_BY_ID.get(d.derivation.calc) : undefined;
        return c && !c.verified ? { id, calc: c.id } : null;
      })
      .filter((x): x is { id: string; calc: string } => x !== null);
    return {
      status: "insufficient",
      missing,
      reason: zartLanc.length
        ? `Hiányzó vagy lejárt bemenet: ${missing.join(", ")}. ` +
          `EBBŐL ${zartLanc.length} NEM MÉRÉSHIÁNY: a(z) ` +
          `${zartLanc.map((x) => `${x.id} (${x.calc})`).join(", ")} levezetett ` +
          `érték, és a levezetését végző kalkulátor konstansai nincsenek ` +
          `visszaellenőrizve az elsődleges forrással. A teendő nem mérés, hanem ` +
          `ALÁÍRÁS.`
        : `Hiányzó vagy lejárt bemenet: ${missing.join(", ")}`,
      inputs: snapshot,
    };
  }

  // 2. a konstansok ellenőrzöttségének kapuja — a számolás előtt
  if (!def.verified) {
    return {
      status: "insufficient",
      missing: [`${def.id}.constants`],
      reason:
        `A(z) ${def.id} konstansai nincsenek visszaellenőrizve az elsődleges forrással ` +
        `(${def.source.cite}). ${def.verifiedNote ?? ""}`.trim(),
      inputs: snapshot,
    };
  }

  // 3. a számítás
  const raw = def.fn(...args);
  if (raw == null || !Number.isFinite(raw)) {
    return {
      status: "insufficient",
      missing: [],
      reason: "A bemenetek érvényesek, de az eredmény nem értelmezhető.",
      inputs: snapshot,
    };
  }

  const digits = def.output.digits ?? 2;
  const value = Math.round(raw * 10 ** digits) / 10 ** digits;

  const isoDatum = def.output.isDate ? new Date(value).toISOString().slice(0, 10) : null;
  return {
    status: "ok",
    value,
    display: isoDatum ?? withUnit(value, def.output.unit, lang),
    stored: isoDatum ?? value,
    unit: def.output.unit,
    band: bandFor(def, value, lang),
    interpretation: def.interpret?.(value, args)?.[lang],
    inputs: snapshot,
  };
}

/**
 * Build-idejű ellenőrzés a regiszterrel szemben.
 *
 * Két külön kérdés, két külön szigorúság:
 *
 *   · A regiszter által HASZNÁLT kalkulátorok bemeneteinek és egységeinek
 *     pontosan egyezniük kell — az egység-eltérés némán rossz eredményt ad,
 *     ezért hiba, nem figyelmeztetés.
 *   · A regisztrált, de egyetlen változó által sem hivatkozott kalkulátor
 *     figyelmeztetés: nem ennek a regiszternek a bemeneteit használja
 *     (más modul is regisztrálhatott), de a rothadását jelezni kell.
 *
 * A forrás- és kapu-követelmény regisztertől független, ezért MINDEN
 * kalkulátorra fut.
 */
export function validateCalculators(
  reg: Registry,
): Array<{ severity: "error" | "warning"; id: string; message: string }> {
  const issues: Array<{ severity: "error" | "warning"; id: string; message: string }> = [];

  const referenced = new Set<string>();
  for (const d of reg.all()) {
    if (d.derivation?.kind === "computed") referenced.add(d.derivation.calc);
  }

  for (const c of CALC_BY_ID.values()) {
    // regisztertől független követelmények
    if (!c.source.cite) issues.push({ severity: "error", id: c.id, message: "hiányzik az elsődleges forrás" });
    if (!c.verified && !c.verifiedNote) {
      issues.push({ severity: "error", id: c.id, message: "kapuzott kalkulátor indoklás nélkül" });
    }
    if (!c.formula) issues.push({ severity: "error", id: c.id, message: "hiányzik az emberi olvasatú képlet" });

    if (!referenced.has(c.id)) {
      issues.push({
        severity: "warning", id: c.id,
        message: "egyetlen regiszterbeli változó sem hivatkozik rá — vagy kösd be, vagy töröld",
      });
      continue;
    }

    for (const inp of c.inputs) {
      const def = reg.get(inp.id);
      if (!def) {
        issues.push({ severity: "error", id: c.id, message: `ismeretlen bemenet: ${inp.id}` });
        continue;
      }
      if (inp.unit && def.unit && inp.unit !== def.unit) {
        issues.push({
          severity: "error", id: c.id,
          message: `${inp.id} egysége a regiszterben ${def.unit}, a képlet ${inp.unit}-t vár`,
        });
      }
    }
  }
  return issues;
}
