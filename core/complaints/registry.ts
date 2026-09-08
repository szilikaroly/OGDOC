/**
 * Panaszszótár — betöltés, keresés, vörös zászlók.
 *
 * A keresés az, amiért ez a modul létezik: ha a beteg szavaiból nem találunk
 * el a tételre, a klinikus visszaesik a szabad szövegre, és onnantól semmi
 * nem kereshető. A találati sorrend ezért nem részletkérdés.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, ValueSetItem } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import type { ComplaintTerm, Condition } from "./types.ts";

/** Ékezet- és kisbetű-független alak — „Fájdalom" és „fajdalom" ugyanaz. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export interface Hit {
  term: ComplaintTerm;
  /** Mi talált: a hivatalos címke vagy egy szinonima — a felület ezt mutatja. */
  matched: string;
  /** 3 = címke eleje · 2 = szinonima eleje · 1 = bárhol előfordul. */
  rank: number;
}

export class ComplaintDict {
  private byId = new Map<string, ComplaintTerm>();

  constructor(terms: ComplaintTerm[]) {
    for (const t of terms) {
      if (this.byId.has(t.id)) {
        throw new Error(`Duplikált panaszkód: ${t.id}`);
      }
      this.byId.set(t.id, t);
    }
  }

  get(id: string): ComplaintTerm | undefined { return this.byId.get(id); }
  all(): ComplaintTerm[] { return [...this.byId.values()]; }

  /**
   * Gépelés közbeni keresés. A szinonimákra is illeszt, mert a beteg nem
   * szakkifejezéssel érkezik.
   */
  search(query: string, limit = 10, pathway?: string | null): Hit[] {
    const q = fold(query);
    if (!q) return [];
    const hits: Hit[] = [];
    for (const term of this.all()) {
      // Az ELLÁTÁSI ÚTVONAL szűkíti a találatokat. Ugyanaz a mondat („lázas
      // vagyok") más tételre mutat a várandósgondozásban és a gyermekágyban,
      // mert a teendő is más — a kontextus dönti el, nem a szó.
      if (pathway && term.pathways?.length && !term.pathways.includes(pathway)) continue;
      let best: Hit | null = null;
      const consider = (text: string, startRank: number) => {
        const f = fold(text);
        const rank = f.startsWith(q) ? startRank : f.includes(q) ? 1 : 0;
        if (rank && (!best || rank > best.rank)) best = { term, matched: text, rank };
      };
      for (const l of Object.values(term.label)) if (l) consider(l, 3);
      for (const syn of term.synonyms) consider(syn, 2);
      if (best) hits.push(best);
    }
    // Azonos rangnál a rövidebb címke előre: a szűkebb tétel a pontosabb.
    return hits
      .sort((a, b) => b.rank - a.rank
        || (a.term.label.hu ?? "").length - (b.term.label.hu ?? "").length)
      .slice(0, limit);
  }

  /** A névsor (`compl.active`) értékkészlete — a szótár a forrás, nem fordítva. */
  valueSet(): ValueSetItem[] {
    return this.all()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((t) => ({
        code: t.id,
        label_hu: t.label.hu,
        label_en: t.label.en,
        ...(t.redflag ? { flags: ["redflag"] as ValueSetItem["flags"] } : {}),
        ...(t.opens?.length ? { opens: t.opens } : {}),
      }));
  }

  /**
   * Vörös zászló-e ez a panasz EBBEN a helyzetben.
   *
   * A feltétel nem kifejezés, hanem szerkezet — kiértékelés (`eval`) nincs.
   * Ha a feltételhez szükséges adat hiányzik, a válasz `unknown`: NEM „nem
   * vörös zászló". A hiányzó gesztációs kor nem zárja ki a méhen kívüli
   * terhességet, csak azt jelenti, hogy nem tudjuk eldönteni.
   */
  redflagState(
    reg: Registry, state: CaseState, id: string,
  ): { flag: boolean | "unknown"; why: string[] } {
    const t = this.get(id);
    if (!t) return { flag: false, why: [] };
    if (t.redflag) return { flag: true, why: ["mindig vörös zászló"] };
    const conds = t.redflagWhen ?? [];
    if (!conds.length) return { flag: false, why: [] };

    const why: string[] = [];
    let unknown = false;
    for (const c of conds) {
      const r = resolve(reg, state, c.var);
      if (r.state !== "ok") { unknown = true; why.push(`${c.var}: nincs adat`); continue; }
      if (!test(r.value, c)) return { flag: false, why: [`${c.var} nem teljesül`] };
      why.push(`${c.var} ${c.op} ${JSON.stringify(c.value)}`);
    }
    return { flag: unknown ? "unknown" : true, why };
  }

  /** Integritás: minden hivatkozott mező létezik-e a változóregiszterben. */
  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const t of this.all()) {
      if (!t.id.startsWith("compl.")) {
        push("error", t.id, "a panaszkód `compl.` előtaggal kezdődik");
      }
      if (!t.label.hu) push("error", t.id, "hiányzik a magyar címke");
      if (!t.synonyms.length) {
        push("warning", t.id,
          "nincs szinonimája — a beteg saját szavaival nem fog rátalálni");
      }
      for (const o of t.opens ?? []) {
        const d = reg.get(o);
        if (!d) { push("error", t.id, `az opens ismeretlen mezőre mutat: ${o}`); continue; }
        if (d.scopedBy) {
          push("error", t.id,
            `az opens példányosított mezőre mutat: ${o} — az a panasz JELLEMZŐJE, ` +
            `tehát az asks listába való`);
        }
      }
      for (const a of t.asks ?? []) {
        if (!reg.get(a)) push("error", t.id, `az asks ismeretlen mezőre mutat: ${a}`);
      }
      for (const c of t.redflagWhen ?? []) {
        if (!reg.get(c.var)) {
          push("error", t.id, `a redflagWhen ismeretlen változóra hivatkozik: ${c.var}`);
        }
      }
      if (t.redflag && t.redflagWhen?.length) {
        push("warning", t.id,
          "egyszerre feltétlen és feltételes vörös zászló — a feltétel sosem érvényesül");
      }
    }

    // Ütköző szinonimák: ugyanaz a kifejezés két tételre — a keresés ilyenkor
    // önkényesen választ, és a klinikus nem érti, miért.
    const bySyn = new Map<string, string[]>();
    for (const t of this.all()) {
      for (const s of t.synonyms) {
        const k = fold(s);
        bySyn.set(k, [...(bySyn.get(k) ?? []), t.id]);
      }
    }
    // Az ÜTKÖZŐ szinonima csak akkor baj, ha a két tétel EGYSZERRE is
    // megjelenhet: azonos ellátási útvonalon a keresés önkényesen választana,
    // és a klinikus nem értené, miért. Ha az útvonalaik elválnak (várandós-
    // gondozás vs. gyermekágy), ugyanaz a mondat helyesen mutat máshova.
    for (const [syn, ids] of bySyn) {
      if (ids.length < 2) continue;
      if (!overlaps(ids.map((i) => this.get(i)!.pathways))) continue;
      push("warning", ids.join(", "), `ugyanaz a szinonima („${syn}") több tételen`);
    }
    return issues;
  }
}

/** Van-e két tételnek közös ellátási útvonala. Az üres lista = mindegyiken. */
function overlaps(sets: Array<string[] | undefined>): boolean {
  if (sets.some((s) => !s?.length)) return true;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      if (sets[i]!.some((p) => sets[j]!.includes(p))) return true;
    }
  }
  return false;
}

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

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => join(dir, f));
}

export function loadComplaints(...paths: string[]): ComplaintDict {
  const terms: ComplaintTerm[] = [];
  const files = paths.flatMap((p) => statSync(p).isDirectory() ? filesIn(p) : [p]);
  for (const f of files) {
    const parsed = JSON.parse(readFileSync(f, "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${f}: a panaszszótár tömböt vár`);
    terms.push(...parsed);
  }
  return new ComplaintDict(terms);
}
