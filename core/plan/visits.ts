/**
 * VIZITREND — a jogszabályi alap és a rizikó szerinti sűrítés.
 *
 * A modul elfogadási kritériuma:
 *
 *   „Egy ikerterhes, krónikus hypertoniás beteg vizitrendje sűrűbb, mint egy
 *    alacsony kockázatúé, és a különbség INDOKOLVA jelenik meg — nem csak a
 *    dátumok mások, hanem az is látszik, melyik rizikófaktor sűrítette."
 *
 * A második fél mondat a nehezebb. Egy vizitrendet generálni könnyű; azt
 * megmondani, hogy a huszonnyolcadik héten MIÉRT van két vizit, nem az. Ezért
 * minden hozzáadott vizit magával hozza a módosítót, ami hozzáadta, és annak
 * a forrását.
 *
 * A modul legfontosabb szabálya viszont nem ez, hanem a szokásos:
 *
 *   A HIÁNYZÓ RIZIKÓADAT NEM ALACSONY KOCKÁZAT.
 *
 * Ha nem tudjuk, ikerterhesség-e, a rendszer NEM adhatja vissza csendben az
 * alacsony kockázatú vizitrendet. Az eredmény ilyenkor ELŐZETES, és megnevezi,
 * melyik rizikót nem lehetett kizárni. Ez a különbség egy tervezőeszköz és egy
 * hamis megnyugtatás között.
 */
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import { resolve } from "../derive/resolve.ts";
import type { CareProtocol, PlannedVisitDef, ScheduleModifier } from "./types.ts";

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

export type ModifierState = "applies" | "doesNotApply" | "undetermined";

export interface Because {
  modifier: string;
  label: string;
  why: string;
  source: string;
}

export interface PlannedVisit {
  id: string;
  label: string;
  from: number;
  to: number;
  by: string;
  origin: "protocol" | "modifier";
  content: string[];
  /** Üres az alapviziteknél; a sűrítetteknél MINDIG van legalább egy. */
  because: Because[];
  status: "upcoming" | "due" | "past" | "unknown";
}

export interface UndeterminedModifier {
  modifier: string;
  label: string;
  missing: string[];
  /** Hány vizittel sűrítene, ha teljesülne — hogy a bizonytalanság súlya látszódjon. */
  wouldAdd: number;
}

export interface VisitPlan {
  protocol: { id: string; version: string; verification: string; source: string };
  applicable: boolean;
  visits: PlannedVisit[];
  baseCount: number;
  addedCount: number;
  applied: Because[];
  undetermined: UndeterminedModifier[];
  /** Igaz, ha valamelyik rizikófaktor eldönthetetlen maradt. */
  provisional: boolean;
  /**
   * Szabad-e ELMULASZTOTTNAK nyilvánítani egy vizitet a terv alapján.
   *
   * Ellenőrizetlen alaptáblával a terv TERVEZÉSRE használható, VÁDOLÁSRA nem.
   * Ugyanaz a szétválasztás, mint a normogramnál a telepítés és az ellenőrzés
   * között: a tábla megléte nem ugyanaz, mint a helyessége.
   */
  canAssertMissed: boolean;
  caveat: string;
}

export class CarePlanner {
  private protocols: CareProtocol[];

  constructor(protocols: CareProtocol[]) {
    this.protocols = protocols;
    const seen = new Set<string>();
    for (const p of protocols) {
      if (seen.has(p.id)) throw new Error(`Duplikált gondozási protokoll: ${p.id}`);
      seen.add(p.id);
    }
  }

  all(): CareProtocol[] { return [...this.protocols]; }
  get(id: string): CareProtocol | undefined { return this.protocols.find((p) => p.id === id); }

  /** Egy módosító állapota ennél a betegnél. */
  private modifierState(
    reg: Registry, state: CaseState, m: ScheduleModifier,
  ): { state: ModifierState; missing: string[] } {
    const missing: string[] = [];
    for (const c of m.when ?? []) {
      const r = resolve(reg, state, c.var);
      if (r.state !== "ok") { missing.push(c.var); continue; }
      if (!test(r.value, c)) return { state: "doesNotApply", missing: [] };
    }
    if (m.whenAny?.length) {
      let any = false;
      const anyMissing: string[] = [];
      for (const c of m.whenAny) {
        const r = resolve(reg, state, c.var);
        if (r.state !== "ok") { anyMissing.push(c.var); continue; }
        if (test(r.value, c)) { any = true; break; }
      }
      // Ha egyik VAGY-ág sem teljesül, de van közte ismeretlen, a kérdés NYITOTT.
      if (!any && anyMissing.length) missing.push(...anyMissing);
      if (!any && !anyMissing.length) return { state: "doesNotApply", missing: [] };
      if (any) return { state: missing.length ? "undetermined" : "applies", missing };
    }
    if (missing.length) return { state: "undetermined", missing };
    return { state: "applies", missing: [] };
  }

  plan(
    reg: Registry, state: CaseState, protocolId: string, lang: Lang = "hu",
  ): VisitPlan {
    const p = this.get(protocolId);
    if (!p) throw new Error(`Ismeretlen gondozási protokoll: ${protocolId}`);

    const head = {
      protocol: {
        id: p.id, version: p.version, verification: p.verification, source: p.source.cite,
      },
      baseCount: p.base.length,
    };

    // 1. Vonatkozik-e rá a protokoll.
    for (const c of p.appliesWhen ?? []) {
      const r = resolve(reg, state, c.var);
      if (r.state !== "ok") {
        return {
          ...head, applicable: false, visits: [], addedCount: 0, applied: [],
          undetermined: [], provisional: true, canAssertMissed: false,
          caveat:
            `Nem dönthető el, hogy a protokoll vonatkozik-e a betegre: a ` +
            `${c.var} nem ismert. Ez NEM azt jelenti, hogy nem vonatkozik.`,
        };
      }
      if (!test(r.value, c)) {
        return {
          ...head, applicable: false, visits: [], addedCount: 0, applied: [],
          undetermined: [], provisional: false, canAssertMissed: false,
          caveat: `A protokoll nem vonatkozik a betegre (${c.var}).`,
        };
      }
    }

    // 2. Az alap — ez a PADLÓ, ez mindig benne van.
    const visits: PlannedVisit[] = p.base.map((v) => ({
      id: v.id, label: L(v.label, lang), from: v.from, to: v.to, by: p.by,
      origin: "protocol" as const, content: [...(v.content ?? [])],
      because: [] as Because[], status: "unknown" as const,
    }));

    // 3. A módosítók — CSAK hozzáadni tudnak.
    const applied: Because[] = [];
    const undetermined: UndeterminedModifier[] = [];
    let added = 0;

    for (const m of p.modifiers) {
      const st = this.modifierState(reg, state, m);
      if (st.state === "doesNotApply") continue;
      const because: Because = {
        modifier: m.id, label: L(m.label, lang), why: L(m.why, lang), source: m.source.cite,
      };
      if (st.state === "undetermined") {
        undetermined.push({
          modifier: m.id, label: L(m.label, lang), missing: [...new Set(st.missing)],
          wouldAdd: m.adds.length,
        });
        continue;
      }
      applied.push(because);
      for (const v of m.adds) {
        // Azonos ablakú vizit nem KETTŐZŐDIK: a rizikó ilyenkor TARTALMAT ad,
        // nem új alkalmat. A krónikus hypertonia nem tesz külön vizitet a 28.
        // hétre, ha ott már van egy — hanem megmondja, mit kell ott mérni.
        const same = visits.find((x) => x.from === v.from && x.to === v.to);
        if (same) {
          same.because.push(because);
          for (const c of v.content ?? []) if (!same.content.includes(c)) same.content.push(c);
          continue;
        }
        visits.push({
          id: v.id, label: L(v.label, lang), from: v.from, to: v.to, by: p.by,
          origin: "modifier", content: [...(v.content ?? [])],
          because: [because], status: "unknown",
        });
        added++;
      }
    }

    visits.sort((a, b) => a.from - b.from || a.to - b.to || a.id.localeCompare(b.id));

    // 4. Hol tart most — ha egyáltalán tudjuk.
    //
    // A gesztációs kor TÖRTSZÁM (24,1 = 24+1 nap), az ablak viszont BETÖLTÖTT
    // HETEKBEN van megadva: a „21–24. hét" a 24+6-ot is magában foglalja.
    // Egyenes összehasonlítással a 24+1 hetes beteg vizitje már „elmúlt"
    // volna — hat nappal az ablak vége előtt.
    const at = resolve(reg, state, p.by);
    const now = at.state === "ok" && typeof at.value === "number"
      ? Math.floor(at.value) : null;
    for (const v of visits) {
      v.status = now == null ? "unknown"
        : now < v.from ? "upcoming"
        : now > v.to ? "past"
        : "due";
    }

    const provisional = undetermined.length > 0;
    const verified = p.verification === "primary";
    const parts: string[] = [];
    if (provisional) {
      parts.push(
        "ELŐZETES TERV: " + undetermined.length + " rizikófaktor eldönthetetlen maradt (" +
        undetermined.map((u) => u.label).join(", ") + "), mert hiányzik: " +
        [...new Set(undetermined.flatMap((u) => u.missing))].join(", ") + ". " +
        "A hiányzó adat NEM alacsony kockázat — ez a vizitrend addig nem tekinthető véglegesnek.",
      );
    }
    if (!verified) {
      parts.push(
        `Az alaptábla ellenőrzöttségi szintje: ${p.verification}. A terv ` +
        `TERVEZÉSRE használható, de elmulasztott vizit megállapítására NEM: ` +
        `ahhoz az alaptáblát elsődleges forrásból (a jogszabály szövegéből) ` +
        `kell átvezetni.`,
      );
    }
    parts.push(
      "A vizitrend a protokoll szerint ESEDÉKES időpontokat adja meg, nem a " +
      "megbeszélteket. A tényleges időpont a `plan.nextVisit.at` mezőbe kerül, " +
      "és az eltérés indoklása külön mezőbe — a kettő különbsége önmagában adat.",
    );

    return {
      ...head, applicable: true, visits, addedCount: added, applied, undetermined,
      provisional, canAssertMissed: verified && !provisional,
      caveat: parts.join(" "),
    };
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const p of this.protocols) {
      if (!p.source?.cite) push("error", p.id, "a gondozási protokollnak meg kell neveznie a forrását");
      if (!p.version) push("error", p.id, "a gondozási protokollnak verziója kell legyen");
      if (!reg.get(p.by)) push("error", p.id, `az ablak alapja ismeretlen változó: ${p.by}`);
      if (!p.base.length) push("error", p.id, "üres alap-vizitrend");

      const ids = new Set<string>();
      const checkVisit = (v: PlannedVisitDef, where: string) => {
        if (ids.has(v.id)) push("error", p.id, `duplikált vizit-azonosító: ${v.id} (${where})`);
        ids.add(v.id);
        if (v.from > v.to) push("error", p.id, `fordított ablak: ${v.id} (${v.from} > ${v.to})`);
      };
      for (const v of p.base) checkVisit(v, "alap");

      for (const c of p.appliesWhen ?? []) {
        if (!reg.get(c.var)) push("error", p.id, `az appliesWhen ismeretlen változóra hivatkozik: ${c.var}`);
      }
      for (const m of p.modifiers) {
        if (!m.adds.length) {
          push("error", p.id, `a(z) ${m.id} módosító nem ad hozzá semmit — a módosító CSAK sűríthet`);
        }
        if (!m.source?.cite) push("error", p.id, `a(z) ${m.id} módosítónak forrást kell megneveznie`);
        if (!(m.when?.length || m.whenAny?.length)) {
          push("error", p.id, `a(z) ${m.id} módosítónak nincs feltétele — mindenkire vonatkozna`);
        }
        for (const c of [...(m.when ?? []), ...(m.whenAny ?? [])]) {
          if (!reg.get(c.var)) push("error", p.id, `a(z) ${m.id} ismeretlen változóra hivatkozik: ${c.var}`);
        }
        for (const v of m.adds) checkVisit(v, m.id);
      }

      if (p.verification !== "primary") {
        push("warning", p.id,
          `a gondozási alaptábla ${p.verification} szintű — a terv elmulasztott ` +
          `vizit megállapítására NEM használható`);
      }
    }
    return issues;
  }
}
