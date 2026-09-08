/**
 * Dokumentum-regiszter: betöltés, ellenőrzés, lezárhatóság.
 */
import { readFileSync } from "node:fs";
import type { Registry } from "../registry.ts";
import type { CaseState } from "../types.ts";
import { resolve } from "../derive/resolve.ts";
import type { DocumentDef } from "./types.ts";

export class DocumentRegistry {
  readonly byId: Map<string, DocumentDef>;

  constructor(defs: DocumentDef[]) {
    this.byId = new Map();
    for (const d of defs) {
      if (this.byId.has(d.id)) throw new Error(`Duplikált dokumentumtípus: ${d.id}`);
      this.byId.set(d.id, d);
    }
  }

  get(id: string): DocumentDef | undefined { return this.byId.get(id); }
  all(): DocumentDef[] { return [...this.byId.values()]; }

  /** Az ellátási dokumentumok — ezekre vonatkozik a beküldés és a megőrzés. */
  careRecords(): DocumentDef[] { return this.all().filter((d) => d.careRecord); }

  /**
   * Build-ellenőrzés a VÁLTOZÓ-regiszterrel szemben.
   *
   * A legfontosabb: egy dokumentum nem hivatkozhat nem létező mezőre. Ha
   * megteheti, a hiány csak a lezárás pillanatában derül ki — a betegágynál.
   */
  validate(reg: Registry): Array<{ severity: "error" | "warning"; id: string; message: string }> {
    const out: Array<{ severity: "error" | "warning"; id: string; message: string }> = [];
    const push = (severity: "error" | "warning", id: string, message: string) =>
      out.push({ severity, id, message });

    for (const d of this.all()) {
      for (const v of [...d.requires, ...(d.optional ?? [])]) {
        if (!reg.get(v)) push("error", d.id, `ismeretlen változóra hivatkozik: ${v}`);
      }
      for (const e of d.expects ?? []) {
        if (!this.byId.has(e)) {
          push("error", d.id, `ismeretlen dokumentumtípusra hivatkozik: ${e}`);
        }
      }
      if (d.careRecord) {
        if (!d.retention) push("error", d.id, "ellátási dokumentum megőrzési idő nélkül");
        if (!d.eeszt) {
          push("warning", d.id,
            "ellátási dokumentum EESZT-beküldés nélkül — ez szándékos-e?");
        }
      }
      if (d.retention && d.retention.verification !== "primary" && !d.retention.verifiedNote) {
        push("error", d.id, "nem elsődlegesen ellenőrzött megőrzési idő indoklás nélkül");
      }
      if (d.careRecord && !d.retention?.patientRequest) {
        push("warning", d.id,
          "nincs rögzítve a beteg kérésének kezelése a megsemmisítés előtt");
      }
      if (!d.documentation?.definition?.hu && !d.documentation?.definition?.en) {
        push("error", d.id, "hiányzik a definíció");
      }
    }
    return out;
  }
}

export function loadDocuments(...paths: string[]): DocumentRegistry {
  const defs: DocumentDef[] = [];
  for (const p of paths) {
    const parsed = JSON.parse(readFileSync(p, "utf8"));
    if (!Array.isArray(parsed)) throw new Error(`${p}: a dokumentumfájl tömböt vár`);
    defs.push(...parsed);
  }
  return new DocumentRegistry(defs);
}

export interface Readiness {
  id: string;
  closable: boolean;
  /** Kötelező, de hiányzó mezők — ezek blokkolják a lezárást. */
  missing: string[];
  /** Nem kötelező, de üres mezők — a dokumentumon HIÁNYKÉNT jelennek meg. */
  gaps: string[];
  /** Kapcsolódó, de hiányzó dokumentumok. Jelzés, NEM blokkoló. */
  missingRelated: string[];
}

/**
 * Lezárható-e a dokumentum, és mi hiányzik.
 *
 * Ez valósítja meg a `14` modul elfogadási kritériumát: **nem tartalmaz
 * kitöltetlen sablonhelyet.** Ahol adat hiányzik, ott az hiányként jelenik
 * meg — nem üres mezőként, és nem elhallgatva.
 */
export function readiness(
  docs: DocumentRegistry, reg: Registry, state: CaseState, docId: string,
  closed: ReadonlySet<string> = new Set(),
): Readiness {
  const d = docs.get(docId);
  if (!d) throw new Error(`Ismeretlen dokumentumtípus: ${docId}`);
  const has = (v: string) => resolve(reg, state, v).state === "ok";
  const missing = d.requires.filter((v) => !has(v));
  const gaps = (d.optional ?? []).filter((v) => !has(v));
  const missingRelated = (d.expects ?? []).filter((e) => !closed.has(e));
  // A kapcsolódó dokumentum hiánya SZÁNDÉKOSAN nem számít bele a `closable`-be.
  return { id: d.id, closable: missing.length === 0, missing, gaps, missingRelated };
}

/**
 * Törölhető-e a dokumentum a megőrzési idő lejárta után.
 *
 * KAPU: ellenőrizetlen megőrzési idő mellett a rendszer **nem töröl**. A
 * törlés visszafordíthatatlan; egy rosszul megadott időtartam adatvesztést
 * okoz, amit semmi nem hoz vissza.
 */
export function deletable(
  docs: DocumentRegistry, docId: string,
  ctx: { patientRequestPending?: boolean } = {},
): { ok: false; reason: string } | { ok: true; after: string } {
  const d = docs.get(docId);
  if (!d) throw new Error(`Ismeretlen dokumentumtípus: ${docId}`);
  const r = d.retention;

  // 1. kapu: az időtartamot valaki összevetette-e a hatályos jogszabállyal
  if (r.verification !== "primary") {
    return {
      ok: false,
      reason: `A(z) ${d.id} megőrzési ideje (${r.period}, ${r.source}) `
        + `ellenőrzöttsége: ${r.verification}. Automatikus törlés csak elsődleges `
        + `— a hatályos jogszabályszöveggel való — összevetés után indul. `
        + (r.verifiedNote ?? ""),
    };
  }

  // 2. kapu: a beteg kérése. A megsemmisítés előtt a betegnek módot kell adni
  //    a dokumentáció kikérésére; amíg ilyen kérés függőben van, nem törlünk.
  if (ctx.patientRequestPending) {
    return {
      ok: false,
      reason: `A(z) ${d.id} törlése függőben lévő betegkérés miatt nem indul. `
        + `A megsemmisítés előtt a beteg kikérheti a dokumentációt.`,
    };
  }

  return { ok: true, after: r.period };
}

/**
 * A kutatási hozzájárulás visszavonása után is megmaradó dokumentumok.
 *
 * A K11 döntés kétágú visszavonást ír elő: a kutatási felhasználás megszűnik,
 * az ELLÁTÁSI DOKUMENTÁCIÓ marad, a jogszabályi megőrzési idő végéig. Ezt a
 * beteg a beleegyező nyilatkozatban látja, nem utólag.
 */
export function survivesRevocation(docs: DocumentRegistry): DocumentDef[] {
  return docs.careRecords();
}
