/**
 * Beavatkozási törzs és a WHO-ellenőrzőlista KAPUJA.
 *
 * A modul elfogadási kritériuma: *„a WHO checklist mindhárom fázisa
 * kitöltetlen állapotban BLOKKOLJA a műtéti leírás lezárását."*
 *
 * Ez a rendszer egyetlen olyan kapuja, ami DOKUMENTÁCIÓS hiányra zár — és
 * szándékosan az. A `09` modul óta érvényes szabály, hogy a dokumentálás
 * soha nem blokkolhat sürgős ellátást: a hiányzó műtéti terv ezért jelzés,
 * nem kapu. A WHO-lista más: **a műtét ALATT tölthető ki**, tehát a
 * kitöltése nem késlelteti a beavatkozást, csak a lezárását. Ami itt
 * blokkolódik, az nem az ellátás, hanem az adminisztratív lezárás.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang, ValueSetItem } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Procedure } from "./types.ts";
import { resolve } from "../derive/resolve.ts";
import { getTable } from "../coding/tables.ts";

const L = (x: I18n | undefined | null, lang: Lang): string =>
  x?.[lang] ?? x?.hu ?? x?.en ?? "";

/** A WHO-lista három fázisa és tételeik — a regiszterből olvasva. */
export const WHO_PHASES = ["signIn", "timeOut", "signOut"] as const;
export type WhoPhase = typeof WHO_PHASES[number];

export interface PhaseState {
  phase: WhoPhase;
  label: string;
  items: Array<{ id: string; label: string; checked: boolean }>;
  /** Hány tétel hiányzik. */
  missing: string[];
  completedAt: string | null;
}

export interface ClosureCheck {
  /** Lezárható-e a műtéti leírás. */
  canClose: boolean;
  phases: PhaseState[];
  reason: string;
}

const PHASE_LABEL: Record<WhoPhase, string> = {
  signIn: "Bejelentkezés (érzéstelenítés előtt)",
  timeOut: "Időkérés (bemetszés előtt)",
  signOut: "Kijelentkezés (a beteg elhagyása előtt)",
};

/**
 * A WHO-lista állapota és a lezárás kapuja.
 *
 * A tételek a REGISZTERBŐL jönnek (`op.who.<fázis>.*`), nem kódból: egy új
 * tétel felvétele a listához nem kíván fejlesztést.
 */
export function whoChecklist(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): ClosureCheck {
  const phases: PhaseState[] = [];

  for (const phase of WHO_PHASES) {
    const prefix = `op.who.${phase}.`;
    const items = reg.all()
      .filter((d) => d.id.startsWith(prefix) && d.datatype === "bool")
      .map((d) => {
        const r = resolve(reg, state, d.id);
        return {
          id: d.id,
          label: L(d.label, lang).replace(/^WHO — /, ""),
          checked: r.state === "ok" && r.value === true,
        };
      });
    const at = resolve(reg, state, `${prefix}completedAt`);
    phases.push({
      phase, label: PHASE_LABEL[phase], items,
      missing: items.filter((i) => !i.checked).map((i) => i.id),
      completedAt: at.state === "ok" ? String(at.value) : null,
    });
  }

  const incomplete = phases.filter((p) => p.missing.length > 0);
  if (!incomplete.length) {
    return {
      canClose: true, phases,
      reason: "A WHO-ellenőrzőlista mindhárom fázisa teljes.",
    };
  }

  return {
    canClose: false, phases,
    reason:
      `A műtéti leírás nem zárható le: a WHO-ellenőrzőlista hiányos — ` +
      incomplete.map((p) => `${p.label} (${p.missing.length} tétel)`).join(", ") +
      `. A lista a MŰTÉT ALATT kitölthető, ezért a kitöltése nem késlelteti ` +
      `az ellátást, csak a lezárást.`,
  };
}

export interface OenoSuggestion {
  procedure: string;
  label: string;
  /** Melyik törzsből: `mut` fekvőbeteg-beavatkozás · `oeno` járóbeteg. */
  system: "mut" | "oeno";
  /** A javasolt kód — `null`, ha a törzsben nincs gyűjtőkód a családra. */
  code: string | null;
  version: string;
  /** Ha a körülmény más, ez a kód kerül helyette. */
  alternatives: Array<{ code: string; label: string; when: string }>;
  /** Ami a fő kód MELLÉ jár, nem helyette. */
  also: Array<{ code: string; label: string; why: string }>;
  /** Ha nincs gyűjtőkód: a szóba jövő kódok, döntés nélkül. */
  candidates: Array<{ code: string; label: string }>;
  /** JAVASLAT: a kódoló szakember dönt. */
  note: string;
}

export class Procedures {
  private byId = new Map<string, Procedure>();

  constructor(list: Procedure[]) {
    for (const p of list) {
      if (this.byId.has(p.id)) throw new Error(`Duplikált beavatkozás: ${p.id}`);
      this.byId.set(p.id, p);
    }
  }

  get(id: string): Procedure | undefined { return this.byId.get(id); }
  all(): Procedure[] { return [...this.byId.values()]; }

  /** A névsor (`op.procedure`) értékkészlete — a törzs a forrás. */
  valueSet(): ValueSetItem[] {
    return this.all()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((p) => ({
        code: p.id, label_hu: p.label.hu, label_en: p.label.en,
        ...(p.opens?.length ? { opens: p.opens } : {}),
      }));
  }

  /** OENO-kódajánlás a rögzített beavatkozásból. */
  oenoFor(reg: Registry, state: CaseState, lang: Lang = "hu"): OenoSuggestion[] {
    const r = resolve(reg, state, "op.procedure");
    if (r.state !== "ok") return [];
    const p = this.byId.get(String(r.value));
    if (!p) return [];
    const base = {
      procedure: p.id, label: L(p.label, lang),
      note:
        "JAVASLAT, nem kódolás: a kódoló szakember dönt. A rendszer feladata " +
        "annyi, hogy ne kelljen a műtéti leírásból visszakeresni, mi történt.",
    };
    if (p.oeno) {
      return [{
        ...base, system: p.oeno.system, code: p.oeno.code, version: p.oeno.version,
        alternatives: (p.oeno.alternatives ?? []).map((a) =>
          ({ code: a.code, label: a.label, when: L(a.when, lang) })),
        also: (p.oeno.also ?? []).map((a) =>
          ({ code: a.code, label: a.label, why: L(a.why, lang) })),
        candidates: [],
      }];
    }
    if (p.codeFamily) {
      // NINCS GYŰJTŐKÓD — és ilyenkor a rendszer nem választ egy „elég jó"
      // kódot, mert az felülkódolás vagy alulkódolás lenne, csak nem
      // látszana. Felsorol, és megmondja, miért nem dönt.
      return [{
        ...base, system: p.codeFamily.system, code: null,
        version: p.codeFamily.version, alternatives: [], also: [],
        candidates: p.codeFamily.candidates,
        note: L(p.codeFamily.why, lang) + " " + base.note,
      }];
    }
    return [];
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      issues.push({ severity, id, message });

    for (const p of this.all()) {
      if (!p.id.startsWith("proc.")) push("error", p.id, "a kód `proc.` előtaggal kezdődik");
      if (!p.label.hu) push("error", p.id, "hiányzik a magyar megnevezés");
      for (const o of p.opens ?? []) {
        if (!reg.get(o)) push("error", p.id, `az opens ismeretlen mezőre mutat: ${o}`);
      }
      // A kód a MEGNEVEZETT törzsben kell szerepeljen. Amíg a törzs nincs
      // betöltve, nem ellenőrzünk — de nem is állítjuk, hogy rendben van.
      const stem = (sys: "mut" | "oeno") => (sys === "mut" ? "tbl.mut" : "tbl.oeno");
      const checkCode = (sys: "mut" | "oeno", code: string) => {
        const t = getTable(stem(sys));
        if (!t) return;
        if (!t.rows[code]) {
          push("error", p.id,
            `a(z) ${code} kód nem szerepel a(z) ${stem(sys)} törzsben ` +
            `(${t.version}) — a két beavatkozási lista azonos alakú, ezért a ` +
            `rossz törzsre hivatkozó kód némán nem található meg`);
        }
      };
      if (!p.oeno && !p.codeFamily) {
        push("warning", p.id,
          "nincs beavatkozáskód — az elfogadási kritérium szerint a " +
          "kódajánlásnak a beavatkozásból kell képződnie");
      } else if (p.oeno) {
        if (!p.oeno.version) {
          push("error", p.id,
            "a beavatkozáskódhoz verzió kell: a kódtábla évente változik, és " +
            "egy retrospektív beavatkozás a mai tábla szerint mást jelenthet");
        }
        if (!p.oeno.system) {
          push("error", p.id,
            "a beavatkozáskódhoz meg kell nevezni a TÖRZSET is: a fekvőbeteg " +
            "és a járóbeteg lista kódjai azonos alakúak");
        } else {
          checkCode(p.oeno.system, p.oeno.code);
          for (const a of p.oeno.alternatives ?? []) checkCode(p.oeno.system, a.code);
          for (const a of p.oeno.also ?? []) checkCode(p.oeno.system, a.code);
        }
      } else if (p.codeFamily) {
        if (p.codeFamily.candidates.length < 2) {
          push("error", p.id,
            "a kódcsalád legalább két jelöltet kell felsoroljon — egyetlen " +
            "jelölt esetén nem család, hanem kód");
        }
        if (!p.codeFamily.why?.hu) {
          push("error", p.id,
            "ki kell mondani, MIÉRT nincs gyűjtőkód — enélkül a felsorolás " +
            "határozatlanságnak látszik, nem a törzs tulajdonságának");
        }
        for (const c of p.codeFamily.candidates) checkCode(p.codeFamily.system, c.code);
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadProcedures(...paths: string[]): Procedures {
  const list: Procedure[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (!Array.isArray(parsed)) throw new Error(`${f}: a beavatkozási fájl tömböt vár`);
      list.push(...parsed);
    }
  }
  return new Procedures(list);
}
