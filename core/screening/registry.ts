/**
 * Szűrési esedékesség — a motor.
 *
 * Hat állapot, és a hatodik a fontos:
 *
 *   notApplicable · upcoming · due · overdue · done · **unknown**
 *
 * Az `unknown` azt jelenti, hogy a szabály feltételéhez SZÜKSÉGES ADAT
 * HIÁNYZIK — például nem tudjuk, volt-e korábban terhességi cukorbetegsége.
 * Ez NEM ugyanaz, mint hogy a szűrés nem vonatkozik rá. Ha a kettőt
 * összemossuk, a hiányzó anamnézis csendben szűrés-kihagyássá válik, és soha
 * senki nem tudja meg.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import type { ScreeningRule } from "./types.ts";
import { nemTudja, resolve, durationMs } from "../derive/resolve.ts";

export type ScreeningStatus =
  | "notApplicable" | "upcoming" | "due" | "overdue" | "done" | "unknown"
  /** Az életkori ablak lezárult, ÉS a kilépési feltételek bizonyítottan állnak. */
  | "exited"
  /**
   * Az életkori ablak lezárult, de a kilépési feltételek NEM állapíthatók meg.
   * Nem `exited` és nem is `overdue`: a szűrést folytatni kell, amíg valaki meg
   * nem nézi az előzményt. A hiányzó előzmény nem megfelelő előzmény.
   */
  | "exitUnknown";

export interface ScreeningState {
  id: string;
  label: string;
  status: ScreeningStatus;
  /** Miért ez az állapot — a felületen ez indokolja a teendőt. */
  why: string;
  /** Mi HIÁNYZIK, ha `unknown` — még nem kérdeztük meg. */
  missing?: string[];
  /**
   * Mire a beteg azt válaszolta, hogy nem tudja. Az állapot ugyanúgy
   * `unknown`, a TEENDŐ viszont más: újrakérdezni nem segít. A kettő egy
   * mezőben tartva a rendszer újra és újra ugyanazt kérdezné meg.
   */
  nemTudja?: string[];
  window?: { by: string; from: number; to: number; at?: number | null };
  source: ScreeningRule["source"];
}

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

export class ScreeningSet {
  private byId = new Map<string, ScreeningRule>();

  constructor(rules: ScreeningRule[]) {
    for (const r of rules) {
      if (this.byId.has(r.id)) throw new Error(`Duplikált szűrési szabály: ${r.id}`);
      this.byId.set(r.id, r);
    }
  }

  get(id: string): ScreeningRule | undefined { return this.byId.get(id); }
  all(): ScreeningRule[] { return [...this.byId.values()]; }

  /** Egy szabály állapota ennél a betegnél, most. */
  evaluate(
    reg: Registry, state: CaseState, id: string, lang: Lang = "hu",
  ): ScreeningState {
    const rule = this.byId.get(id)!;
    const out = (status: ScreeningStatus, why: string, extra: Partial<ScreeningState> = {}):
      ScreeningState => ({
        id: rule.id, label: L(rule.label, lang), status, why,
        source: rule.source, ...extra,
      });

    // 1. Vonatkozik-e rá egyáltalán — és tudjuk-e egyáltalán?
    //
    // A RÖGZÍTETT „NEM TUDOM” ITT A LEGVESZÉLYESEBB. Ha egy `unk` választ a
    // feltétel egyszerűen „nem teljesül”-ként olvasna, a szűrés
    // `notApplicable` lenne: a rendszer azt állítaná, hogy a beteget ez NEM
    // ÉRINTI. Aki nem emlékszik, volt-e terhességi cukorbetegsége, épp azért
    // kapna korai OGTT-t, mert nem tudjuk — nem azért maradna ki, mert nem
    // tudjuk.
    const missing: string[] = [];
    const bizonytalan: string[] = [];
    for (const c of rule.appliesWhen ?? []) {
      const r = resolve(reg, state, c.var);
      if (r.state !== "ok") { missing.push(c.var); continue; }
      if (nemTudja(reg, c.var, r.value)) {
        if (rule.unknownAnswer === "notApplicable") {
          return out("notApplicable",
            `${c.var}: a beteg nem tudja — és ennél a szűrésnél ez a szabály ` +
            `szerint azt jelenti, hogy nem vonatkozik rá.`);
        }
        bizonytalan.push(c.var);
        continue;
      }
      if (!test(r.value, c)) {
        return out("notApplicable", `${c.var} nem teljesül`);
      }
    }
    if (missing.length) {
      return out("unknown",
        `A feltételhez szükséges adat hiányzik: ${missing.join(", ")}. ` +
        `Ez NEM azt jelenti, hogy a szűrés nem vonatkozik rá.`,
        { missing });
    }
    if (bizonytalan.length) {
      return out("unknown",
        `A feltételre a beteg azt válaszolta, hogy nem tudja ` +
        `(${bizonytalan.join(", ")}). Megkérdeztük — újrakérdezni nem segít —, ` +
        `de ettől a szűrés MÉG VONATKOZHAT rá: a „nem tudom” nem „nem”.`,
        { nemTudja: bizonytalan });
    }

    // 2. Elvégezték-e már — és elég frissen?
    const doneAt = this.lastDone(reg, state, rule);
    if (doneAt != null) {
      if (!rule.repeatEvery) return out("done", "az eredmény rögzítve van");
      const ms = durationMs(rule.repeatEvery);
      const age = Date.parse(state.ctx.now) - doneAt;
      if (ms == null || age <= ms) {
        return out("done", `az eredmény rögzítve van (${new Date(doneAt).toISOString().slice(0, 10)})`);
      }
    }

    // 3. Hol tart az ablakhoz képest?
    const at = resolve(reg, state, rule.window.by);
    if (at.state !== "ok" || typeof at.value !== "number") {
      return out("unknown",
        `Az ablak alapja (${rule.window.by}) nem ismert, ezért az esedékesség ` +
        `nem dönthető el.`,
        { missing: [rule.window.by] });
    }
    // BETÖLTÖTT HETEK: a gesztációs kor törtszám (28,5 = 28+3 nap), az ablak
    // viszont hetekben van megadva — a „24–28. hét" a 28+6-ot is magában
    // foglalja. Egyenes összehasonlítással a 28+3 hetes beteg OGTT-je már
    // elmulasztottnak látszana, három nappal az ablak vége előtt.
    const nowAt = Math.floor(at.value);
    const w = { by: rule.window.by, from: rule.window.from, to: rule.window.to, at: at.value };
    if (nowAt < rule.window.from) {
      return out("upcoming", `még nem esedékes (${rule.window.from} előtt)`, { window: w });
    }
    if (nowAt > rule.window.to) {
      if (!rule.exit) {
        return out("overdue", `az ablak (${rule.window.from}–${rule.window.to}) lezárult`, { window: w });
      }
      return this.kilepes(reg, state, rule, lang, w);
    }
    return out("due", `az ablakban van (${rule.window.from}–${rule.window.to})`, { window: w });
  }

  /**
   * A KILÉPÉS KIÉRTÉKELÉSE. A feltételeknek POZITÍVAN kell teljesülniük:
   * hiányzó vagy „nem tudom" válasz mellett a szűrés NEM zárható le.
   */
  private kilepes(
    reg: Registry, state: CaseState, rule: ScreeningRule, lang: Lang,
    w: { by: string; from: number; to: number; at?: number | null },
  ): ScreeningState {
    const ex = rule.exit!;
    const miert = L(ex.why, lang);
    const hianyzo: string[] = [];
    const nemTudom: string[] = [];
    const nemTeljesul: string[] = [];
    /** Teljesül, DE csak a beteg emlékezetéből. Nem dokumentált előzmény. */
    const csakEmlekezet: string[] = [];
    for (const c of ex.requires) {
      const r = resolve(reg, state, c.var);
      if (r.state !== "ok") { hianyzo.push(c.var); continue; }
      if (nemTudja(reg, c.var, r.value)) { nemTudom.push(c.var); continue; }
      if (!test(r.value, c)) { nemTeljesul.push(c.var); continue; }
      if (!this.dokumentaltErtek(reg, state, c.var)) csakEmlekezet.push(c.var);
    }
    const base = { id: rule.id, label: L(rule.label, lang), source: rule.source, window: w };
    if (nemTeljesul.length) {
      return { ...base, status: "overdue",
        why:
          `Az életkori ablak (${w.from}–${w.to}) lezárult, DE a kilépési feltétel ` +
          `nem teljesül (${nemTeljesul.join(", ")}), ezért a szűrés TOVÁBB ` +
          `esedékes. ${miert}` };
    }
    if (csakEmlekezet.length && !hianyzo.length && !nemTudom.length) {
      return { ...base, status: "exitUnknown",
        why:
          `Az életkori ablak (${w.from}–${w.to}) lezárult, és a kilépési feltétel ` +
          `formailag teljesül — DE CSAK A BETEG EMLÉKEZETÉBŐL ` +
          `(${csakEmlekezet.join(", ")}). A lezárás DOKUMENTÁLT előzményt kíván: ` +
          `a „volt már kenetem" nem megfelelő szűrési előzmény. ${miert}`,
        missing: csakEmlekezet };
    }
    if (hianyzo.length || nemTudom.length) {
      return { ...base, status: "exitUnknown",
        why:
          `Az életkori ablak (${w.from}–${w.to}) lezárult, de a lezárás ` +
          `feltételei nem állapíthatók meg` +
          (hianyzo.length ? ` (hiányzik: ${hianyzo.join(", ")})` : "") +
          (nemTudom.length ? ` (nem tudja: ${nemTudom.join(", ")})` : "") +
          `. A HIÁNYZÓ ELŐZMÉNY NEM MEGFELELŐ ELŐZMÉNY: a szűrés nem zárható ` +
          `le, amíg valaki meg nem nézi. ${miert}`,
        ...(hianyzo.length ? { missing: hianyzo } : {}),
        ...(nemTudom.length ? { nemTudja: nemTudom } : {}) };
    }
    return { ...base, status: "exited",
      why:
        `A szűrés LEZÁRHATÓ: az életkori ablak (${w.from}–${w.to}) lezárult, és ` +
        `a kilépési feltételek bizonyítottan állnak. ${miert}` };
  }

  /**
   * A LEGUTÓBBI ÉRTÉK SZÁRMAZÁSA dokumentált-e. A beteg elmondása anamnézisnek
   * teljes értékű, a szűrés LEZÁRÁSÁHOZ viszont nem elég: a kilépés arról szól,
   * hogy a korábbi leletek MEGVANNAK, nem arról, hogy emlékszik rájuk.
   */
  private dokumentaltErtek(reg: Registry, state: CaseState, id: string): boolean {
    const vals = state.values[reg.resolvePrimary(id)] ?? [];
    if (!vals.length) return false;
    const last = vals.reduce((a, b) => (Date.parse(b.t) >= Date.parse(a.t) ? b : a));
    return last.provenance === "clinician" || last.provenance === "imported";
  }

  /** Mikor rögzült utoljára a szűrés eredménye. `null`, ha nem történt meg. */
  private lastDone(reg: Registry, state: CaseState, rule: ScreeningRule): number | null {
    const times: number[] = [];
    let allPresent = true;
    for (const id of rule.what) {
      const vals = state.values[reg.resolvePrimary(id)] ?? [];
      if (!vals.length) { allPresent = false; continue; }
      times.push(Math.max(...vals.map((v) => Date.parse(v.t))));
    }
    if (!times.length) return null;
    // `anyOf`: bármelyik elég. Egyébként MINDEGYIK kell — egy háromértékes
    // terheléses vizsgálat nem „elvégzett", ha csak az éhomi érték van meg.
    if (!rule.anyOf && !allPresent) return null;
    return Math.min(...times);
  }

  /** Minden szabály állapota, a teendőlista sorrendjében. */
  dueList(reg: Registry, state: CaseState, lang: Lang = "hu"): ScreeningState[] {
    const rank: Record<ScreeningStatus, number> = {
      overdue: 0, due: 1, exitUnknown: 2, unknown: 3, upcoming: 4, done: 5,
      exited: 6, notApplicable: 7,
    };
    return this.all()
      .map((r) => this.evaluate(reg, state, r.id, lang))
      .sort((a, b) => rank[a.status] - rank[b.status] || a.id.localeCompare(b.id));
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const r of this.all()) {
      if (!r.what.length) push("error", r.id, "nincs megadva, mi számít elvégzésnek");
      for (const w of r.what) {
        if (!reg.get(w)) push("error", r.id, `a what lista ismeretlen mezőre mutat: ${w}`);
      }
      for (const c of r.appliesWhen ?? []) {
        if (!reg.get(c.var)) push("error", r.id, `az appliesWhen ismeretlen változóra hivatkozik: ${c.var}`);
      }
      if (!reg.get(r.window.by)) {
        push("error", r.id, `az ablak alapja ismeretlen változó: ${r.window.by}`);
      }
      if (r.window.from > r.window.to) {
        push("error", r.id, `fordított ablak: ${r.window.from} > ${r.window.to}`);
      }
      if (!r.source?.cite) push("error", r.id, "a szűrési szabálynak meg kell neveznie a forrását");
      if (r.window.by === "patient.age" && !r.exit) {
        push("error", r.id,
          `életkori ablak (${r.window.from}–${r.window.to} év) kilépési feltétel ` +
          `nélkül. AZ ÉLETKOR ÖNMAGÁBAN NEM KILÉPÉSI FELTÉTEL: enélkül a ` +
          `megfelelően szűrt és a soha nem szűrt idős beteg ugyanúgy jelenik ` +
          `meg, és mivel az előbbi van többségben, a jelzést mindenki megtanulja ` +
          `lenyomni — vele együtt az utóbbit is.`);
      }
      for (const c of r.exit?.requires ?? []) {
        if (!reg.get(c.var)) {
          push("error", r.id, `a kilépési feltétel ismeretlen változóra hivatkozik: ${c.var}`);
        }
      }
      if (r.exit && !r.exit.requires.length) {
        push("error", r.id, "üres kilépési feltétel: ez ugyanaz, mintha nem lenne");
      }
      if (r.repeatEvery && durationMs(r.repeatEvery) == null) {
        push("error", r.id, `értelmezhetetlen ismétlési időköz: ${r.repeatEvery}`);
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadScreenings(...paths: string[]): ScreeningSet {
  const rules: ScreeningRule[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a szűrési fájl tömböt vár`);
      rules.push(...parsed);
    }
  }
  return new ScreeningSet(rules);
}
