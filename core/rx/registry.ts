/**
 * Gyógyszertörzs — betöltés, keresés, KAPUK.
 *
 * A kapu három választ adhat, és a harmadik a lényeg:
 *
 *   clear  — a feltétel bizonyítottan nem áll fenn
 *   blocked — a feltétel fennáll: hard-stop vagy figyelmeztetés
 *   ask    — A FELTÉTELHEZ SZÜKSÉGES ADAT HIÁNYZIK
 *
 * Az `ask` nem elméleti finomkodás. Ha a hiányzó asztma-anamnézis csendben
 * „nincs asztmája"-ként viselkedne, a kapu pont annál a betegnél nyílna ki,
 * akinél a felvétel kapkodó volt. A helyes válasz nem a tiltás és nem az
 * engedés, hanem a KÉRDÉS — ott, akkor, egy mezőre mutatva.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang, ValueSetItem } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import type { Drug, Gate } from "./types.ts";
import { resolve } from "../derive/resolve.ts";
import { fold } from "../complaints/registry.ts";

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

export interface GateResult {
  drug: string;
  gate: string;
  verdict: "clear" | "blocked" | "ask";
  severity: Gate["severity"];
  message: string;
  /** Mely változók hiányoznak — ezeket kell megkérdezni, mielőtt döntünk. */
  missing: string[];
  alternatives: string[];
  source: Gate["source"];
}

export interface PrescribeCheck {
  drug: string;
  label: string;
  /** `stop` = van nyitott abszolút kapu · `ask` = van megválaszolatlan feltétel. */
  outcome: "ok" | "warn" | "ask" | "stop";
  gates: GateResult[];
}

export class DrugRegistry {
  private byId = new Map<string, Drug>();

  constructor(list: Drug[]) {
    for (const d of list) {
      if (this.byId.has(d.id)) throw new Error(`Duplikált gyógyszerkód: ${d.id}`);
      this.byId.set(d.id, d);
    }
  }

  get(id: string): Drug | undefined { return this.byId.get(id); }
  all(): Drug[] { return [...this.byId.values()]; }

  /** Névre és szinonimára keres — a beírt kereskedelmi név is találjon. */
  search(query: string, limit = 10): Drug[] {
    const q = fold(query);
    if (!q) return [];
    const score = (d: Drug): number => {
      const texts = [...Object.values(d.label), ...(d.synonyms ?? [])];
      let best = 0;
      for (const t of texts) {
        const f = fold(String(t));
        if (f.startsWith(q)) best = Math.max(best, 3);
        else if (f.includes(q)) best = Math.max(best, 1);
      }
      return best;
    };
    return this.all()
      .map((d) => [d, score(d)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1] || L(a[0].label, "hu").length - L(b[0].label, "hu").length)
      .slice(0, limit)
      .map(([d]) => d);
  }

  /** Mely szerek jönnek szóba egy indikációra. */
  forIndication(indication: string): Drug[] {
    return this.all().filter((d) => d.indications?.includes(indication));
  }

  /** A névsor (`rx.active`) értékkészlete — a törzs a forrás. */
  valueSet(): ValueSetItem[] {
    return this.all()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((d) => ({ code: d.id, label_hu: d.label.hu, label_en: d.label.en }));
  }

  /** Egy szer összes kapuja ennél a betegnél, most. */
  gates(reg: Registry, state: CaseState, drugId: string, lang: Lang = "hu"): GateResult[] {
    const drug = this.byId.get(drugId);
    if (!drug) throw new Error(`Ismeretlen gyógyszer: ${drugId}`);

    const out: GateResult[] = [];
    for (const g of drug.gates ?? []) {
      const missing: string[] = [];
      let allHold = true;
      for (const c of g.when) {
        const r = resolve(reg, state, c.var);
        if (r.state !== "ok") { missing.push(c.var); continue; }
        if (!test(r.value, c)) { allHold = false; break; }
      }
      const base = {
        drug: drugId, gate: g.id, severity: g.severity,
        message: L(g.message, lang), missing,
        alternatives: g.alternatives ?? [], source: g.source,
      };
      if (!allHold) { out.push({ ...base, verdict: "clear", missing: [] }); continue; }
      // A feltétel többi tagja teljesül, de valamelyikhez nincs adat →
      // NEM engedünk és nem tiltunk: kérdezünk.
      out.push({ ...base, verdict: missing.length ? "ask" : "blocked" });
    }
    return out;
  }

  /** A rendelés összesített megítélése. */
  check(reg: Registry, state: CaseState, drugId: string, lang: Lang = "hu"): PrescribeCheck {
    const gates = this.gates(reg, state, drugId, lang);
    const drug = this.byId.get(drugId)!;
    const blockedAbs = gates.some((g) => g.verdict === "blocked" && g.severity === "absolute");
    const asked = gates.some((g) => g.verdict === "ask");
    const warn = gates.some((g) => g.verdict === "blocked" && g.severity === "relative");
    const outcome: PrescribeCheck["outcome"] =
      blockedAbs ? "stop" : asked ? "ask" : warn ? "warn" : "ok";
    return { drug: drugId, label: L(drug.label, lang), outcome, gates };
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const d of this.all()) {
      if (!d.id.startsWith("rx.")) push("error", d.id, "a gyógyszerkód `rx.` előtaggal kezdődik");
      if (!d.label.hu) push("error", d.id, "hiányzik a magyar név");
      const gateIds = new Set<string>();
      for (const g of d.gates ?? []) {
        if (gateIds.has(g.id)) push("error", d.id, `két kapu ugyanazzal az azonosítóval: ${g.id}`);
        gateIds.add(g.id);
        if (!g.when.length) push("error", d.id, `a(z) ${g.id} kapunak nincs feltétele`);
        for (const c of g.when) {
          if (!reg.get(c.var)) {
            push("error", d.id, `a(z) ${g.id} kapu ismeretlen változóra hivatkozik: ${c.var}`);
          }
        }
        if (!g.source?.cite) push("error", d.id, `a(z) ${g.id} kapunak nincs forrása`);
        for (const a of g.alternatives ?? []) {
          if (!this.byId.has(a)) {
            push("error", d.id, `a(z) ${g.id} kapu ismeretlen alternatívát ajánl: ${a}`);
          }
        }
      }
      for (const t of d.transformInPregnancy?.to ?? []) {
        if (!this.byId.has(t)) push("error", d.id, `ismeretlen átalakítási cél: ${t}`);
      }
      if (!d.lactation) {
        push("warning", d.id,
          "nincs szoptatási besorolás — a gyermekágyban ez a leggyakrabban feltett kérdés");
      }
      if (!d.atc) push("warning", d.id, "nincs ATC-kód — a 17. modul kódolása erre épül");
      if (d.dietSupplement && !reg.get(d.dietSupplement)) {
        push("error", d.id, `ismeretlen diétás pótlás-mező: ${d.dietSupplement}`);
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadDrugs(...paths: string[]): DrugRegistry {
  const list: Drug[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a gyógyszertörzs tömböt vár`);
      list.push(...parsed);
    }
  }
  return new DrugRegistry(list);
}
