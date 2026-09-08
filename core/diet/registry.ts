/**
 * Diétás protokollok — kiértékelés és betegtájékoztató.
 *
 * Két dolgot csinál, és a második a modul valódi kimenete:
 *
 *   1. eldönti, mely protokollok VONATKOZNAK a betegre;
 *   2. összeállítja belőlük a NYOMTATHATÓ BETEGTÁJÉKOZTATÓT — a beteg konkrét
 *      adataival, nem általános szórólapként.
 *
 * A hiányzó adat itt sem „nem": ha egy protokoll feltételéhez nincs adat, a
 * protokoll `unknown` állapotba kerül, és a tájékoztató kimondja, hogy egy
 * kérdés nyitva maradt. Egy bariátriai műtét, amiről nem kérdeztünk, nem
 * ugyanaz, mint egy bariátriai műtét, ami nem történt — az első esetben hat
 * kötelező pótlás marad ki.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import type { DietProtocol, DietTarget } from "./types.ts";
import { resolve } from "../derive/resolve.ts";
import { runCalc } from "../calc/run.ts";

const L = (x: I18n | undefined, lang: Lang): string =>
  x?.[lang] ?? x?.hu ?? x?.en ?? "";

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

export interface ProtocolState {
  id: string;
  label: string;
  status: "applies" | "notApplicable" | "unknown";
  why: string;
  missing: string[];
  source: DietProtocol["source"];
}

/** A betegtájékoztató egy szakasza. A felület ebből nyomtat. */
export interface LeafletSection {
  kind: "target" | "supplement" | "avoid" | "advice" | "referral" | "openQuestion";
  title: string;
  items: Array<{ text: string; why?: string; from?: string }>;
}

export class DietProtocols {
  private byId = new Map<string, DietProtocol>();

  constructor(list: DietProtocol[]) {
    for (const p of list) {
      if (this.byId.has(p.id)) throw new Error(`Duplikált diétás protokoll: ${p.id}`);
      this.byId.set(p.id, p);
    }
  }

  get(id: string): DietProtocol | undefined { return this.byId.get(id); }
  all(): DietProtocol[] { return [...this.byId.values()]; }

  evaluate(reg: Registry, state: CaseState, id: string, lang: Lang = "hu"): ProtocolState {
    const p = this.byId.get(id)!;
    const missing: string[] = [];
    for (const c of p.appliesWhen ?? []) {
      const r = resolve(reg, state, c.var);
      if (r.state !== "ok") { missing.push(c.var); continue; }
      if (!test(r.value, c)) {
        return {
          id: p.id, label: L(p.label, lang), status: "notApplicable",
          why: `${c.var} nem teljesül`, missing: [], source: p.source,
        };
      }
    }
    if (missing.length) {
      return {
        id: p.id, label: L(p.label, lang), status: "unknown",
        why:
          `A feltételhez szükséges adat hiányzik: ${missing.join(", ")}. ` +
          `Ez NEM azt jelenti, hogy a protokoll nem vonatkozik rá.`,
        missing, source: p.source,
      };
    }
    return {
      id: p.id, label: L(p.label, lang), status: "applies",
      why: (p.appliesWhen ?? []).length ? "minden feltétel teljesül" : "mindenkire vonatkozik",
      missing: [], source: p.source,
    };
  }

  /** Minden protokoll állapota, az érvényesek elöl. */
  states(reg: Registry, state: CaseState, lang: Lang = "hu"): ProtocolState[] {
    const rank = { applies: 0, unknown: 1, notApplicable: 2 } as const;
    return this.all()
      .map((p) => this.evaluate(reg, state, p.id, lang))
      .sort((a, b) => rank[a.status] - rank[b.status] || a.id.localeCompare(b.id));
  }

  /**
   * A NYOMTATHATÓ BETEGTÁJÉKOZTATÓ.
   *
   * Nem általános szórólap: a beteg konkrét adataiból áll össze. Ahol a szám
   * nem születik meg (kapu vagy hiányzó bemenet), ott nem üres hely marad,
   * hanem a konzíliumi javallat és az ok.
   */
  leaflet(reg: Registry, state: CaseState, lang: Lang = "hu"): LeafletSection[] {
    const active = this.states(reg, state, lang).filter((s) => s.status === "applies");
    const unknown = this.states(reg, state, lang).filter((s) => s.status === "unknown");
    const out: LeafletSection[] = [];

    /* Célértékek — a számított és a protokollból jövő tartományok együtt. */
    const targets: LeafletSection["items"] = [];
    const protein = runCalc(reg, state, "calc.protein.pregnancy", lang);
    if (protein.status === "ok") {
      targets.push({
        text: `Napi fehérje: kb. ${protein.value} g`,
        why: "A terhesség előtti testsúlyra számolva (IOM DRI 2005).",
        from: "calc.protein.pregnancy",
      });
    }
    const energy = runCalc(reg, state, "calc.energy.pregnancy", lang);
    if (energy.status === "ok") {
      targets.push({
        text: `Napi energia: kb. ${energy.value} kcal`,
        from: "calc.energy.pregnancy",
      });
    } else {
      // NEM üres hely: a szám hiányának oka és a helyette járó teendő.
      targets.push({
        text: "Napi energiaszükséglet: dietetikai konzílium állapítja meg",
        why: energy.reason,
        from: "calc.energy.pregnancy",
      });
    }
    for (const s of active) {
      for (const t of this.byId.get(s.id)!.targets ?? []) {
        targets.push({ text: targetText(t, lang), why: L(t.note, lang), from: s.id });
      }
    }
    if (targets.length) out.push({ kind: "target", title: "Célértékek", items: targets });

    /* Szupplementáció — protokollonként, forrással. */
    const supps = new Map<string, { text: string; why?: string; from: string }>();
    for (const s of active) {
      for (const suppId of this.byId.get(s.id)!.supplements ?? []) {
        const def = reg.get(suppId);
        if (!def) continue;
        // Ha több protokoll is kéri ugyanazt, EGYSZER jelenik meg — de a
        // kiváltó protokollok mind ott vannak, mert az adag rajtuk múlhat.
        const prev = supps.get(suppId);
        supps.set(suppId, {
          text: L(def.label, lang).replace(/ — javasolt$/, ""),
          why: L(def.documentation?.whyItMatters, lang),
          from: prev ? `${prev.from}, ${s.id}` : s.id,
        });
      }
    }
    if (supps.size) {
      out.push({
        kind: "supplement", title: "Pótlás", items: [...supps.values()],
      });
    }

    /* Kerülendők, tanácsok, javallatok. */
    const collect = (
      kind: LeafletSection["kind"], title: string,
      pick: (p: DietProtocol) => Array<{ what: I18n; why?: I18n }> | undefined,
    ) => {
      const items: LeafletSection["items"] = [];
      for (const s of active) {
        for (const it of pick(this.byId.get(s.id)!) ?? []) {
          items.push({ text: L(it.what, lang), why: L(it.why, lang), from: s.id });
        }
      }
      if (items.length) out.push({ kind, title, items });
    };
    collect("avoid", "Amit kerülni kell", (p) => p.avoid);
    collect("advice", "Tanácsok", (p) => p.advice);
    collect("referral", "Javasolt konzílium, vizsgálat", (p) => p.referral);

    /* A nyitott kérdések — ez a szakasz a tájékoztató őszinteségét adja. */
    if (unknown.length) {
      out.push({
        kind: "openQuestion",
        title: "Amit még tisztázni kell",
        items: unknown.map((s) => ({
          text: s.label,
          why: `Hiányzik: ${s.missing.join(", ")}. Amíg nincs meg, ez a javaslat nem teljes.`,
          from: s.id,
        })),
      });
    }
    return out;
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const p of this.all()) {
      if (!p.label.hu) push("error", p.id, "hiányzik a magyar megnevezés");
      if (!p.source?.cite) push("error", p.id, "a protokollnak meg kell neveznie a forrását");
      for (const c of p.appliesWhen ?? []) {
        if (!reg.get(c.var)) {
          push("error", p.id, `az appliesWhen ismeretlen változóra hivatkozik: ${c.var}`);
        }
      }
      for (const s of p.supplements ?? []) {
        if (!reg.get(s)) push("error", p.id, `ismeretlen szupplementációs mező: ${s}`);
      }
      for (const a of p.avoid ?? []) {
        if (!a.why?.hu && !a.why?.en) {
          // Az indoklás nélküli tiltást a beteg nem tartja be, és joggal.
          push("warning", p.id, `indoklás nélküli tiltás: ${a.what.hu ?? ""}`);
        }
      }
      if (!(p.supplements?.length || p.targets?.length || p.avoid?.length
            || p.advice?.length || p.referral?.length)) {
        push("warning", p.id, "a protokollnak nincs semmilyen kimenete");
      }
    }
    return issues;
  }
}

function targetText(t: DietTarget, lang: Lang): string {
  const label = L(t.label, lang);
  if (t.min != null && t.max != null) return `${label}: ${t.min}–${t.max} ${t.unit}`;
  if (t.min != null) return `${label}: legalább ${t.min} ${t.unit}`;
  if (t.max != null) return `${label}: legfeljebb ${t.max} ${t.unit}`;
  return label;
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadDietProtocols(...paths: string[]): DietProtocols {
  const list: DietProtocol[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a diétás protokollfájl tömböt vár`);
      list.push(...parsed);
    }
  }
  return new DietProtocols(list);
}

/**
 * SZUPPLEMENTÁCIÓS ÁTFEDÉS: ne kapjon kétszer vasat.
 *
 * A diétás tájékoztató javasol, a `06` modul rendel — a kettő összevetése
 * enélkül csak emberi figyelmen múlna. Két irányban jelez:
 *
 *   `duplicate` — a javasolt pótlást már rendelt készítmény is fedezi
 *                 (a terhes-multivitamin és a célzott készítmény együtt
 *                 halmozódik);
 *   `missing`   — a protokoll kötelezővé teszi, de rendelés nincs rá.
 *
 * A `missing` nem hiba, hanem teendő: a betegek egy része a pótlást vény
 * nélkül szerzi be, és a rendszer erről nem tud. Ezért jelzés, nem kapu.
 */
export interface SupplementOverlap {
  supplement: string;
  label: string;
  status: "duplicate" | "missing";
  /** Mely protokollok kérik. */
  requiredBy: string[];
  /** Mely rendelt készítmények fedezik. */
  coveredBy: string[];
  note: string;
}

export function supplementOverlap(
  reg: Registry, diets: DietProtocols, drugs: {
    all(): Array<{ id: string; label: I18n; dietSupplement?: string | null }>;
  }, state: CaseState, lang: Lang = "hu",
): SupplementOverlap[] {
  const active = diets.states(reg, state, lang).filter((s) => s.status === "applies");
  const required = new Map<string, string[]>();
  for (const s of active) {
    for (const supp of diets.get(s.id)!.supplements ?? []) {
      required.set(supp, [...(required.get(supp) ?? []), s.id]);
    }
  }

  const rx = resolve(reg, state, "rx.active");
  const prescribed = Array.isArray(rx.value) ? (rx.value as string[]) : [];
  const covers = new Map<string, string[]>();
  for (const d of drugs.all()) {
    if (!d.dietSupplement || !prescribed.includes(d.id)) continue;
    covers.set(d.dietSupplement, [...(covers.get(d.dietSupplement) ?? []), d.id]);
  }

  const out: SupplementOverlap[] = [];
  for (const [supp, requiredBy] of required) {
    const coveredBy = covers.get(supp) ?? [];
    const label = L(reg.get(supp)?.label, lang).replace(/ — javasolt$/, "");
    if (coveredBy.length) {
      out.push({
        supplement: supp, label, status: "duplicate", requiredBy, coveredBy,
        note:
          `A(z) ${label.toLowerCase()} pótlását a diétás javaslat és a ` +
          `gyógyszerelés is tartalmazza (${coveredBy.join(", ")}) — ` +
          `az adagok halmozódnak, ellenőrizendő.`,
      });
    } else {
      out.push({
        supplement: supp, label, status: "missing", requiredBy, coveredBy,
        note:
          `A(z) ${label.toLowerCase()} pótlását protokoll teszi kötelezővé ` +
          `(${requiredBy.join(", ")}), de rendelés nincs rá. Ha a beteg vény ` +
          `nélkül szedi, azt rögzíteni kell.`,
      });
    }
  }
  return out.sort((a, b) => a.status.localeCompare(b.status) || a.supplement.localeCompare(b.supplement));
}
