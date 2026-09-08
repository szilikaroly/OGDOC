/**
 * Regiszter → űrlapleírás. DOM-mentes: a felület ezt rendereli, de nem tud
 * semmit, amit a regiszter ne mondana meg. Ugyanez a leírás megy a webes
 * React-komponensbe és bármely más rendererbe.
 */
import type { Registry } from "../registry.ts";
import { pick } from "../i18n.ts";
import type { VariableDef } from "../types.ts";
import { DerivationGraph } from "../derive/graph.ts";

export interface FieldSpec {
  id: string;
  label: string;
  control: "number" | "text" | "date" | "datetime" | "select" | "tristate" | "checkbox" | "readonly";
  unit?: string | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
  options?: Array<{ code: string | number; label: string; unknown?: boolean }>;
  /** Számított mező: nem szerkeszthető, a képlet magyarázata megjelenik. */
  computed?: { explain?: string; inputs: string[] };
  /** Ez a mező javaslatot kaphat — a felület forrásjelzést és visszaállítást ad. */
  prefillable?: boolean;
  /** Beteg-azonosító: külön jelölés, exportból kimarad. */
  phi?: boolean;
  /**
   * A CÍMKE NEM A KÉRT NYELVEN VAN — forrásnyelvi alak.
   *
   * A felület ezt JELÖLI. Egy csendes visszaesés a forrásnyelvre azt adná,
   * hogy a felhasználó „angol” felületet lát magyar tartalommal, és nem
   * tudja, melyik szó melyik.
   */
  labelFallback?: boolean;
  /** Mely opciók címkéje forrásnyelvi. */
  optionsFallback?: boolean;
  hint?: string;
  /** Click-open lelet: alapból csukva; kóros vagy korlátozott értéknél nyílik a lánc. */
  finding?: {
    normal: string | number;
    limited?: string | number;
    impossible?: string | number;
    cascade: string[];
  };
  /** Ez a mező részletező — csak akkor látszik, ha valamelyik kapuja nyitva van. */
  openedBy?: string[];
  /** A beteg tölti ki a betegfelvételkor. */
  patientEntry?: boolean;
}

export interface SectionSpec { module: string; fields: FieldSpec[]; }

const CONTROL: Record<string, FieldSpec["control"]> = {
  quantity: "number", text: "text", date: "date", datetime: "datetime",
  coded: "select", "coded-multi": "select", tristate: "tristate", bool: "checkbox",
  structured: "text",
};

export function buildFormSpec(reg: Registry, lang: "hu" | "en" = "hu"): SectionSpec[] {
  // melyik mezőt melyik lelet nyitja meg — a gráf megfordítva
  const openedBy = new Map<string, string[]>();
  const gate = (t: string, by: string) =>
    openedBy.set(t, [...(openedBy.get(t) ?? []), by]);
  for (const d of reg.all()) {
    for (const t of d.finding?.cascade ?? []) gate(t, d.id);
    for (const o of d.valueSet ?? []) for (const t of o.opens ?? []) gate(t, d.id);
  }
  const byModule = new Map<string, FieldSpec[]>();
  for (const d of reg.all()) {
    if (d.aliasOf) continue;                       // a mirror nem önálló mező
    const f = fieldOf(d, lang, reg);
    if (d.finding) {
      f.finding = {
        normal: d.finding.normal,
        limited: d.finding.limited,
        impossible: d.finding.impossible,
        cascade: d.finding.cascade ?? [],
      };
    }
    const gates = openedBy.get(d.id);
    if (gates) f.openedBy = gates;
    if (d.patientEntry) f.patientEntry = true;
    byModule.set(d.module, [...(byModule.get(d.module) ?? []), f]);
  }
  return [...byModule.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, fields]) => ({ module, fields: orderByFinding(fields) }));
}

/**
 * A részletező mező a LELETJE UTÁN jöjjön.
 *
 * A regiszter sorrendje ábécés, ezért a „Zörej fokozata” a „Szívhallgatózás”
 * elé kerülne — a felületen ez érthetetlen. A lelet nyitja meg a részletet,
 * tehát alatta a helye.
 */
function orderByFinding(fields: FieldSpec[]): FieldSpec[] {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const placed = new Set<string>();
  const out: FieldSpec[] = [];
  for (const f of fields) {
    if (f.openedBy && f.openedBy.some((g) => byId.has(g))) continue;  // majd a leletje után
    if (placed.has(f.id)) continue;
    out.push(f); placed.add(f.id);
    for (const t of f.finding?.cascade ?? []) {
      const d = byId.get(t);
      if (d && !placed.has(t)) { out.push(d); placed.add(t); }
    }
  }
  // az opció-nyitott mezők a kérdésük után; ami marad, a végére
  for (const f of fields) if (!placed.has(f.id)) out.push(f);
  return out;
}

function fieldOf(d: VariableDef, lang: "hu" | "en", reg: Registry): FieldSpec {
  const computed = d.derivation?.kind === "computed";
  const f: FieldSpec = {
    id: d.id,
    label: pick(d.label, lang).text || d.id,
    ...(pick(d.label, lang).fallback ? { labelFallback: true } : {}),
    control: computed ? "readonly" : CONTROL[d.datatype] ?? "text",
    unit: d.unit ?? null,
    phi: d.phi === true,
  };
  if (d.domain) {
    f.min = d.domain.min ?? null;
    f.max = d.domain.max ?? null;
    f.step = d.domain.step ?? null;
  }
  if (d.valueSet?.length) {
    // AZ OPCIÓCÍMKE UGYANÚGY. Egy legördülő, aminek fele angol, fele magyar,
    // rosszabb, mint a következetesen forrásnyelvi — mert az elsőnél a
    // felhasználó azt hiszi, érti.
    if (d.valueSet.some((o) => !(lang === "hu" ? o.label_hu : o.label_en))) {
      f.optionsFallback = true;
    }
    f.options = d.valueSet.map((o) => ({
      code: o.code,
      label: (lang === "hu" ? o.label_hu : o.label_en) ?? o.label_hu ?? String(o.code),
      unknown: o.flags?.includes("unknown") || undefined,
    }));
  }
  if (d.derivation?.kind === "computed") {
    f.computed = { explain: d.derivation.explain?.[lang], inputs: reg.computedInputs(d.id) };
  }
  if (d.derivation?.kind === "prefill") f.prefillable = true;
  const hint = d.documentation.howToMeasure?.[lang] ?? d.documentation.pitfalls?.[lang];
  if (hint) f.hint = hint;
  return f;
}

/** Mezőnkénti dokumentáció — a ⇦ FELTÖLTI és ⇨ EZT TÖLTI lista GENERÁLT. */
export function fieldDoc(reg: Registry, id: string, lang: "hu" | "en" = "hu"): string {
  const d = reg.get(id);
  if (!d) throw new Error(`Ismeretlen változó: ${id}`);
  const g = new DerivationGraph(reg);
  const L = (x?: Record<string, string | undefined> | null) => x?.[lang] ?? "";
  const lines: string[] = [];

  lines.push(`${d.id} — ${d.label[lang] ?? d.id}    [v${d.version}, ${d.status}]`);
  lines.push("");
  const doc = d.documentation;
  if (L(doc.definition)) lines.push(pad("MI EZ", L(doc.definition)));
  if (L(doc.howToMeasure)) lines.push(pad("HOGYAN MÉRD", L(doc.howToMeasure)));
  if (L(doc.pitfalls)) lines.push(pad("CSAPDÁK", L(doc.pitfalls)));
  if (L(doc.whyItMatters)) lines.push(pad("MIÉRT SZÁMÍT", L(doc.whyItMatters)));
  lines.push("");

  if (d.domain) {
    const r = [d.domain.min, d.domain.max].filter((x) => x != null).join("–");
    const parts = [r ? `${r}${d.unit ? " " + d.unit : ""}` : ""];
    if (d.domain.plausible) parts.push(`szokásos ${d.domain.plausible.join("–")}`);
    if (d.domain.critical) {
      const [lo, hi] = d.domain.critical;
      parts.push(`kritikus ${lo != null ? "≤" + lo : ""}${lo != null && hi != null ? " / " : ""}${hi != null ? "≥" + hi : ""}`);
    }
    lines.push(pad("TARTOMÁNY", parts.filter(Boolean).join(" │ ")));
  }
  if (d.validity) {
    lines.push(pad("ÉRVÉNYESSÉG", Object.entries(d.validity).map(([k, v]) => `${k} ${v}`).join(" │ ")));
  }
  const codes = [
    d.standards?.loinc && `LOINC ${d.standards.loinc}`,
    d.standards?.snomed && `SNOMED ${d.standards.snomed}`,
    d.standards?.fhir && `FHIR ${d.standards.fhir.resource}`,
  ].filter(Boolean);
  if (codes.length) lines.push(pad("KÓDOK", codes.join(" │ ")));
  if (d.phi) lines.push(pad("JELÖLÉS", "phi — beteg-azonosító, az exportból és a lekérdezőből kimarad"));
  lines.push("");

  const src = g.sourcesOf(id);
  const con = g.consumersOf(id);
  lines.push(pad("⇦ FELTÖLTI", src.length ? src.join(" · ") : "—"));
  lines.push(pad("⇨ EZT TÖLTI", con.length ? con.join(" · ") : "—"));
  if (con.length) {
    const impact = g.impactOf(id);
    lines.push(pad("", `(${con.length} közvetlen, ${impact.length} összesen érintett — módosításkor mind újraszámol)`));
  }
  if (d.evidence?.length) {
    lines.push("");
    lines.push(pad("BIZONYÍTÉK", d.evidence.map((e) => e.cite + (e.doi ? ` · doi:${e.doi}` : "")).join("\n" + " ".repeat(15))));
  }
  return lines.join("\n");
}

function pad(key: string, val: string): string {
  return key.padEnd(14) + " " + val;
}
