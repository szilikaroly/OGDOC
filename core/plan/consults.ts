/**
 * KONZÍLIUM-JAVALLATOK — a rendszer javallatot állít fel, konzíliumot NEM kér.
 *
 * A különbség nem szóhasználat. A javallat automatikus és a rögzített adatból
 * következik; a megkérés emberi döntés, felelősséggel. A kettő szétválasztása
 * teszi mérhetővé azt, ami egyébként láthatatlan: hány javallat nem valósult
 * meg, és miért.
 *
 * Ezért a javallat NEM tűnik el attól, hogy nem kérték meg. Az elutasításnak
 * indoklása van (`plan.consult.declined`), és indoklás nélkül a javallat
 * NYITOTT marad — mert az elutasított javallat és az elsikkadt javallat
 * másképp néz ki a dokumentációban, de ugyanúgy néz ki a betegen.
 */
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import { resolve } from "../derive/resolve.ts";
import type { ConsultRule } from "./types.ts";

const L = (x: I18n | undefined, lang: Lang): string => x?.[lang] ?? x?.hu ?? x?.en ?? "";

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

export type ConsultStatus =
  /** A javallat fennáll, és a konzílium kérése MÉG NEM történt meg. */
  | "indicated"
  /** Fennáll, sürgős, és még nem kérték meg. */
  | "urgent"
  /** Fennáll, és a kérése rögzült. */
  | "requested"
  /** A feltétel nem teljesül. */
  | "notIndicated"
  /** A feltételhez szükséges adat hiányzik — ez NEM ugyanaz. */
  | "unknown";

export interface ConsultState {
  id: string;
  specialty: string;
  label: string;
  status: ConsultStatus;
  urgency: "routine" | "urgent";
  why: string;
  source: string;
  missing?: string[];
}

export class ConsultSet {
  private rules: ConsultRule[];

  constructor(rules: ConsultRule[]) {
    this.rules = rules;
    const seen = new Set<string>();
    for (const r of rules) {
      if (seen.has(r.id)) throw new Error(`Duplikált konzílium-szabály: ${r.id}`);
      seen.add(r.id);
    }
  }

  all(): ConsultRule[] { return [...this.rules]; }

  evaluate(reg: Registry, state: CaseState, id: string, lang: Lang = "hu"): ConsultState {
    const r = this.rules.find((x) => x.id === id)!;
    const base = {
      id: r.id, specialty: r.specialty, label: L(r.label, lang),
      urgency: r.urgency, source: r.source.cite,
    };

    const missing: string[] = [];
    for (const c of r.when ?? []) {
      const v = resolve(reg, state, c.var);
      if (v.state !== "ok") { missing.push(c.var); continue; }
      if (!test(v.value, c)) {
        return { ...base, status: "notIndicated", why: `${c.var} nem teljesül` };
      }
    }
    let anyOk = !r.whenAny?.length;
    if (r.whenAny?.length) {
      const anyMissing: string[] = [];
      for (const c of r.whenAny) {
        const v = resolve(reg, state, c.var);
        if (v.state !== "ok") { anyMissing.push(c.var); continue; }
        if (test(v.value, c)) { anyOk = true; break; }
      }
      if (!anyOk && !anyMissing.length) {
        return { ...base, status: "notIndicated", why: "egyik kiváltó feltétel sem teljesül" };
      }
      if (!anyOk) missing.push(...anyMissing);
    }

    if (missing.length) {
      return {
        ...base, status: "unknown",
        missing: [...new Set(missing)],
        why:
          `A javallathoz szükséges adat hiányzik: ${[...new Set(missing)].join(", ")}. ` +
          `Ez NEM azt jelenti, hogy a konzílium nem javallt — csak azt, hogy nem tudjuk.`,
      };
    }

    const requested = this.requestedSpecialties(reg, state).has(r.specialty);
    if (requested) {
      return { ...base, status: "requested", why: L(r.why, lang) };
    }
    return {
      ...base, status: r.urgency === "urgent" ? "urgent" : "indicated", why: L(r.why, lang),
    };
  }

  private requestedSpecialties(reg: Registry, state: CaseState): Set<string> {
    const r = resolve(reg, state, "plan.consult.requested");
    if (r.state !== "ok") return new Set();
    const v = r.value;
    return new Set(Array.isArray(v) ? v.map(String) : [String(v)]);
  }

  /** Minden javallat, a teendőlista sorrendjében. */
  list(reg: Registry, state: CaseState, lang: Lang = "hu"): ConsultState[] {
    const rank: Record<ConsultStatus, number> = {
      urgent: 0, indicated: 1, unknown: 2, requested: 3, notIndicated: 4,
    };
    return this.rules
      .map((r) => this.evaluate(reg, state, r.id, lang))
      .sort((a, b) => rank[a.status] - rank[b.status] || a.id.localeCompare(b.id));
  }

  /**
   * A NYITOTT javallatok: fennállnak, nincs megkérve, és nincs indokolt
   * elutasítás sem. Ez az, ami a tervben teendőként megjelenik.
   */
  open(reg: Registry, state: CaseState, lang: Lang = "hu"): ConsultState[] {
    const declined = resolve(reg, state, "plan.consult.declined");
    const hasReason = declined.state === "ok" && String(declined.value).trim().length > 0;
    return this.list(reg, state, lang).filter(
      (c) => (c.status === "urgent" || c.status === "indicated") && !hasReason,
    );
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    const def = reg.get("plan.consult.requested");
    const codes = new Set((def?.valueSet ?? []).map((o) => String(o.code)));

    for (const r of this.rules) {
      if (!r.source?.cite) push("error", r.id, "a konzílium-javallatnak forrást kell megneveznie");
      if (!(r.when?.length || r.whenAny?.length)) {
        push("error", r.id, "a konzílium-javallatnak nincs feltétele — mindenkire vonatkozna");
      }
      if (!codes.has(r.specialty)) {
        push("error", r.id,
          `a szakterület (${r.specialty}) nem szerepel a plan.consult.requested ` +
          `értékkészletében — a javallat nem lenne rögzíthető`);
      }
      for (const c of [...(r.when ?? []), ...(r.whenAny ?? [])]) {
        if (!reg.get(c.var)) push("error", r.id, `ismeretlen változóra hivatkozik: ${c.var}`);
      }
    }
    return issues;
  }
}
