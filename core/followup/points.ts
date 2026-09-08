/**
 * ICHOM MÉRÉSI PONTOK — mikor esedékes a kimenetel felvétele.
 *
 * Négy pont, két horgonnyal: a terhesség alattiak a gesztációs korhoz, a
 * szülés utániak a SZÜLÉS IDŐPONTJÁHOZ képest esedékesek.
 *
 * A modul egyetlen kemény szabálya:
 *
 *   AZ ELMULASZTOTT MÉRÉSI PONT NEM TŰNIK EL.
 *
 * Ha a 42. napos ablak lezárult és nem történt mérés, a pont `overdue`
 * marad — nem lesz belőle sem „kész", sem „nem esedékes". Ez azért nem
 * kozmetikai kérdés, mert a kimeneteli mutatók NEVEZŐJE ebből áll össze: ha
 * a nem mért esetek csendben eltűnnek, a mutató az intézményt hízelgi.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

const L = (x: I18n | undefined, lang: Lang): string => x?.[lang] ?? x?.hu ?? x?.en ?? "";

export interface MeasurementPoint {
  id: string;
  label: I18n;
  /** Az ICHOM saját időpont-megnevezése — az export ez alapján válogat. */
  ichomTiming: string;
  anchor: { kind: "gaWeeks" | "daysSince"; var: string };
  from: number;
  to: number;
  note?: I18n;
}

export type PointStatus =
  | "upcoming" | "due" | "overdue" | "done"
  /** A horgony hiányzik — nem tudjuk, esedékes-e. NEM azonos a „nem esedékes"-sel. */
  | "unknown";

export interface PointState {
  id: string;
  label: string;
  ichomTiming: string;
  status: PointStatus;
  why: string;
  /** Hol tartunk a horgonyhoz képest, ha tudjuk. */
  at: number | null;
  window: { from: number; to: number; unit: "wk" | "d" };
  /** A ponthoz tartozó, még üres kötelező tételek. */
  missing?: string[];
}

export class FollowUpPoints {
  private points: MeasurementPoint[];

  constructor(points: MeasurementPoint[]) {
    this.points = points;
    const seen = new Set<string>();
    for (const p of points) {
      if (seen.has(p.id)) throw new Error(`Duplikált mérési pont: ${p.id}`);
      seen.add(p.id);
    }
  }

  all(): MeasurementPoint[] { return [...this.points]; }
  get(id: string): MeasurementPoint | undefined { return this.points.find((p) => p.id === id); }

  /**
   * Hol tartunk a ponthoz képest.
   *
   * `doneWhen` — a ponthoz tartozó tételek állapota. Az ICHOM-export adja;
   * enélkül a pont csak az időablak szerint minősül.
   */
  state(
    reg: Registry, state: CaseState, id: string,
    doneWhen?: { complete: boolean; missing: string[] },
    lang: Lang = "hu",
  ): PointState {
    const p = this.get(id);
    if (!p) throw new Error(`Ismeretlen mérési pont: ${id}`);
    const unit = p.anchor.kind === "gaWeeks" ? "wk" as const : "d" as const;
    const base = {
      id: p.id, label: L(p.label, lang), ichomTiming: p.ichomTiming,
      window: { from: p.from, to: p.to, unit },
    };

    const r = resolve(reg, state, p.anchor.var);
    let at: number | null = null;
    if (r.state === "ok") {
      if (p.anchor.kind === "gaWeeks" && typeof r.value === "number") {
        at = Math.floor(r.value);
      } else if (p.anchor.kind === "daysSince") {
        const t = Date.parse(String(r.value));
        const now = Date.parse(state.ctx.now);
        if (Number.isFinite(t) && Number.isFinite(now)) {
          at = Math.floor((now - t) / 86_400_000);
        }
      }
    }

    if (at == null) {
      return {
        ...base, at: null, status: "unknown",
        why:
          `A horgony (${p.anchor.var}) nem ismert, ezért nem dönthető el, ` +
          `esedékes-e a mérés. Ez NEM azt jelenti, hogy nem esedékes.`,
        missing: [p.anchor.var],
      };
    }

    // A KÉSZ állapot az ADATTÓL függ, nem az időtől: egy lezárult ablak
    // önmagában nem teszi késszé a pontot.
    if (doneWhen?.complete) {
      return { ...base, at, status: "done", why: "a ponthoz tartozó tételek rögzültek" };
    }

    if (at < p.from) {
      return { ...base, at, status: "upcoming", why: `még nem esedékes (${p.from} ${unit} előtt)` };
    }
    if (at > p.to) {
      return {
        ...base, at, status: "overdue",
        why:
          `Az ablak (${p.from}–${p.to} ${unit}) LEZÁRULT, és a mérés nem történt meg. ` +
          `Ez a pont ELMULASZTOTT marad — nem lesz belőle sem „kész", sem „nem ` +
          `esedékes", mert a kimeneteli mutatók nevezője ebből áll össze.`,
        missing: doneWhen?.missing,
      };
    }
    return {
      ...base, at, status: "due",
      why: `az ablakban van (${p.from}–${p.to} ${unit})`,
      missing: doneWhen?.missing,
    };
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    for (const p of this.points) {
      if (!reg.get(p.anchor.var)) {
        issues.push({ severity: "error", id: p.id, message: `ismeretlen horgony-változó: ${p.anchor.var}` });
      }
      if (p.from > p.to) {
        issues.push({ severity: "error", id: p.id, message: `fordított ablak: ${p.from} > ${p.to}` });
      }
      if (!p.ichomTiming) {
        issues.push({ severity: "error", id: p.id, message: "nincs ICHOM-időpont megnevezve" });
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadPoints(...paths: string[]): FollowUpPoints {
  const out: MeasurementPoint[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a mérési pont fájl tömböt vár`);
      out.push(...parsed);
    }
  }
  return new FollowUpPoints(out);
}
