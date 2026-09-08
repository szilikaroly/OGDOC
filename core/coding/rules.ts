/**
 * KÓDAJÁNLÁS — a kód az ADAT KÖVETKEZMÉNYE, nem külön munka.
 *
 * A modul elfogadási kritériuma:
 *
 *   „Egy súlyos praeeclampsiás eset esetén a rendszer O14.1-et ajánl (nem
 *    O14.9-et), és az ajánlás mellett látszik, MELYIK VÁLTOZÓ MELYIK ÉRTÉKE
 *    miatt minősül súlyosnak. Ha a labor változik, az ajánlás követi."
 *
 * Három dolog dől el ebben a rétegben, és a harmadik a legfontosabb.
 *
 * 1. A SÚLYOSABB KÓD ELNYOMJA AZ ENYHÉBBET (`supersedes`) — de nem csendben:
 *    az elnyomott kód látszik, azzal együtt, mi nyomta el.
 *
 * 2. AZ AJÁNLÁS NEM TÁROLÓDIK. Minden hívás újraszámol a rögzített adatból;
 *    ha a labor változik, a kód követi. Ami tárolódik, az a KÓDOLÓ DÖNTÉSE
 *    (`code.dx.primary`) — és a kettő eltérése önmagában adat.
 *
 * 3. A HIÁNYZÓ SÚLYOSSÁGI ADAT NEM „NEM SÚLYOS". Ha a thrombocytaszám nincs
 *    levéve, a rendszer NEM ajánlhat nyugodt szívvel O14.9-et: az eset lehet
 *    súlyos, csak nem néztük meg. Ilyenkor az ajánlás ELŐZETES, és megnevezi,
 *    mit kell megnézni hozzá.
 *
 * A harmadik nem elméleti. „Praeeclampsia, k.m.n." kódolás azért, mert a
 * vérkép nem készült el, pontosan úgy néz ki a statisztikában, mintha az eset
 * enyhe lett volna.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry, RegistryIssue } from "../registry.ts";
import type { Condition } from "../complaints/types.ts";
import { resolve } from "../derive/resolve.ts";
import { getTable, lookupCode } from "./tables.ts";
import { checkClinicalTag, snomedTerm } from "./snomed.ts";
import { checkSctId } from "./sctid.ts";
import { withUnit } from "../ui/units.ts";

const L = (x: I18n | undefined, lang: Lang): string => x?.[lang] ?? x?.hu ?? x?.en ?? "";

export interface CodeRule {
  id: string;
  code: string;
  system: string;
  /** MINDEN feltételnek teljesülnie kell. */
  when?: Condition[];
  /** BÁRMELYIK elég — a súlyossági ismérvek tipikusan ilyenek. */
  whenAny?: Condition[];
  /** Mely kódokat nyomja el, ha fennáll. */
  supersedes?: string[];
  /** Igaz, ha BÁRMELY másik fennálló kód elnyomja (pl. O80 „egyszerű szülés"). */
  supersededByAny?: boolean;
  source: { cite: string; standard?: string | null };
  why: I18n;
  /** Ha a szabály ismerten hiányos — ez az ajánlás mellett megjelenik. */
  incompleteNote?: I18n;
  /**
   * A megfelelő SNOMED CT fogalom AZONOSÍTÓJA.
   *
   * Csak az azonosító, a megnevezés nem: a Global Patient Set CC BY-ND
   * licence az átalakított fogalomkészlet terjesztését nem engedi. Az
   * azonosító kereszthivatkozás — ugyanúgy, ahogy a LOINC-kódok.
   */
  snomed?: string;
  /** Melyik GPS-kiadásban ELLENŐRIZTÜK. Azonosítót emlékezetből nem írunk be. */
  snomedVerified?: string;
  /** Ha a fogalom nincs a GPS-ben — kimondva, nem elhallgatva. */
  snomedNote?: I18n;
}

export interface Evidence {
  variable: string;
  value: unknown;
  op: string;
  threshold: unknown;
  text: string;
}

export type CodeStatus =
  /** Fennáll, és nincs elnyomva. */
  | "suggested"
  /** Fennáll, de súlyosabb kód elnyomta. */
  | "superseded"
  /** A feltétel nem teljesül. */
  | "notApplicable"
  /** A feltételhez szükséges adat HIÁNYZIK — ez nem „nem teljesül". */
  | "undetermined";

export interface CodeSuggestion {
  rule: string;
  code: string;
  label: string;
  status: CodeStatus;
  /** MELYIK VÁLTOZÓ MELYIK ÉRTÉKE miatt — az elfogadási kritérium magja. */
  because: Evidence[];
  /** Mi hiányzik, ha `undetermined`. */
  missing?: string[];
  /** Melyik kód nyomta el, ha `superseded`. */
  supersededBy?: string;
  why: string;
  source: string;
  incompleteNote?: string;
  /** SNOMED CT fogalomazonosító és — ha a törzs telepítve van — megnevezése. */
  snomed?: {
    id: string;
    verifiedIn?: string;
    term: string | null;
    language: "en" | null;
    /** A CC BY-ND forrásmegjelölés. A kimeneten meg KELL jelennie. */
    notice: string;
    why?: string;
  };
  snomedNote?: string;
}

export interface CodingResult {
  suggestions: CodeSuggestion[];
  /** Amit ténylegesen ajánlunk. */
  codes: string[];
  /**
   * Igaz, ha egy SÚLYOSABB kód eldönthetetlen maradt. Ilyenkor a lista
   * előzetes: lehet, hogy egy súlyosabb kód nyomná el, csak nem tudjuk.
   */
  provisional: boolean;
  tableVersion: string;
  caveat: string;
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

const OP_TEXT: Record<Condition["op"], string> = {
  eq: "=", ne: "≠", lt: "<", lte: "≤", gt: ">", gte: "≥", in: "∈",
};

export class CodeRules {
  private rules: CodeRule[];

  constructor(rules: CodeRule[]) {
    this.rules = rules;
    const seen = new Set<string>();
    for (const r of rules) {
      if (seen.has(r.id)) throw new Error(`Duplikált kódszabály: ${r.id}`);
      seen.add(r.id);
    }
  }

  all(): CodeRule[] { return [...this.rules]; }

  private evaluate(
    reg: Registry, state: CaseState, r: CodeRule, lang: Lang,
  ): { status: "applies" | "notApplicable" | "undetermined"; because: Evidence[]; missing: string[] } {
    const because: Evidence[] = [];
    const missing: string[] = [];

    const evidence = (c: Condition, value: unknown): Evidence => {
      const def = reg.get(c.var);
      const label = L(def?.label, lang) || c.var;
      const shown = Array.isArray(c.value) ? c.value.join(" / ") : String(c.value);
      return {
        variable: c.var, value, op: c.op, threshold: c.value,
        // EMBERI mértékegység: a UCUM-kód („10*9/L") a kódolónak és a
        // dokumentumon is olvashatatlan. Ugyanaz a réteg, mint a
        // zárójelentésnél — minden emberi kimeneten át kell rajta menni.
        text: `${label} = ${withUnit(String(value), def?.unit, lang)} ` +
              `(${OP_TEXT[c.op]} ${shown})`,
      };
    };

    for (const c of r.when ?? []) {
      const v = resolve(reg, state, c.var);
      if (v.state !== "ok") { missing.push(c.var); continue; }
      if (!test(v.value, c)) return { status: "notApplicable", because: [], missing: [] };
      because.push(evidence(c, v.value));
    }

    if (r.whenAny?.length) {
      let any = false;
      const anyMissing: string[] = [];
      for (const c of r.whenAny) {
        const v = resolve(reg, state, c.var);
        if (v.state !== "ok") { anyMissing.push(c.var); continue; }
        if (test(v.value, c)) { any = true; because.push(evidence(c, v.value)); }
      }
      // Ha egyik ág sem teljesült, de van ismeretlen köztük, a kérdés NYITOTT.
      if (!any && anyMissing.length) missing.push(...anyMissing);
      if (!any && !anyMissing.length) return { status: "notApplicable", because: [], missing: [] };
    }

    if (missing.length) return { status: "undetermined", because, missing: [...new Set(missing)] };
    return { status: "applies", because, missing: [] };
  }

  suggest(reg: Registry, state: CaseState, lang: Lang = "hu"): CodingResult {
    const evaluated = this.rules.map((r) => ({ rule: r, ...this.evaluate(reg, state, r, lang) }));
    const applying = evaluated.filter((e) => e.status === "applies");
    const applyingCodes = new Set(applying.map((e) => e.rule.code));

    // Mit nyom el mi.
    const supersededBy = new Map<string, string>();
    for (const e of applying) {
      for (const c of e.rule.supersedes ?? []) supersededBy.set(c, e.rule.code);
    }
    for (const e of applying) {
      if (!e.rule.supersededByAny) continue;
      const other = applying.find((x) => x.rule.code !== e.rule.code);
      if (other) supersededBy.set(e.rule.code, other.rule.code);
    }

    const suggestions: CodeSuggestion[] = evaluated.map((e) => {
      const label = lookupCode("tbl.bno", e.rule.code).value ?? e.rule.code;
      const sn = e.rule.snomed ? snomedTerm(e.rule.snomed, lang) : null;
      const base = {
        rule: e.rule.id, code: e.rule.code, label,
        because: e.because, why: L(e.rule.why, lang), source: e.rule.source.cite,
        incompleteNote: e.rule.incompleteNote ? L(e.rule.incompleteNote, lang) : undefined,
        snomed: sn
          ? {
              id: sn.id, verifiedIn: e.rule.snomedVerified, term: sn.term,
              language: sn.language, notice: sn.notice, why: sn.why,
            }
          : undefined,
        snomedNote: e.rule.snomedNote ? L(e.rule.snomedNote, lang) : undefined,
      };
      if (e.status === "undetermined") {
        return { ...base, status: "undetermined" as const, missing: e.missing };
      }
      if (e.status === "notApplicable") return { ...base, status: "notApplicable" as const };
      const by = supersededBy.get(e.rule.code);
      return by
        ? { ...base, status: "superseded" as const, supersededBy: by }
        : { ...base, status: "suggested" as const };
    });

    const codes = suggestions.filter((s) => s.status === "suggested").map((s) => s.code);

    // ELŐZETES, ha egy olyan szabály maradt eldönthetetlen, ami ELNYOMNA egy
    // most ajánlott kódot. A hiányzó thrombocytaszám nem „nem súlyos".
    const undetermined = suggestions.filter((s) => s.status === "undetermined");
    const wouldSupersede = undetermined.filter((s) => {
      const r = this.rules.find((x) => x.id === s.rule)!;
      return (r.supersedes ?? []).some((c) => codes.includes(c));
    });
    const provisional = wouldSupersede.length > 0;

    const parts: string[] = [];
    if (provisional) {
      parts.push(
        "ELŐZETES AJÁNLÁS: " +
        wouldSupersede.map((s) => `${s.code} (${s.label})`).join(", ") +
        " eldönthetetlen maradt, pedig SÚLYOSABB besorolást jelentene. Hiányzik: " +
        [...new Set(wouldSupersede.flatMap((s) => s.missing ?? []))].join(", ") +
        ". A hiányzó súlyossági adat NEM azt jelenti, hogy az eset nem súlyos — " +
        "csak azt, hogy nem néztük meg.",
      );
    }
    parts.push(
      "A kódajánlás a RÖGZÍTETT ADAT következménye, és nem tárolódik: ha az " +
      "adat változik, az ajánlás követi. A kódolás emberi döntés — a kódoló " +
      "választása a `code.dx.primary` mezőbe kerül, és az ajánlástól való " +
      "eltérés önmagában adat.",
    );
    const t = getTable("tbl.bno");
    if (t?.coverage === "subset") {
      parts.push(
        `A BNO-törzs betöltött RÉSZHALMAZ (${t.version}): a megnevezések ` +
        `ebből oldódnak fel, és a részhalmaz nem korlátozza a kódolót.`,
      );
    }

    return {
      suggestions, codes, provisional,
      tableVersion: t?.version ?? "—",
      caveat: parts.join(" "),
    };
  }

  validate(reg: Registry): RegistryIssue[] {
    const issues: RegistryIssue[] = [];
    const codes = new Set(this.rules.map((r) => r.code));
    for (const r of this.rules) {
      if (!r.source?.cite) issues.push({ severity: "error", id: r.id, message: "a kódszabálynak forrást kell megneveznie" });

      // A KÜSZÖB KLINIKAI ÁLLÍTÁS, nem kódolási tény. Hogy a 160/110 Hgmm
      // súlyosnak számít, azt egy ajánlás mondja ki — az, hogy az
      // ikerterhesség kódja O30.0, magából az osztályozásból következik.
      // Ezért küszöböt tartalmazó szabálynál a BNO-ra hivatkozás NEM elég.
      const hasThreshold = [...(r.when ?? []), ...(r.whenAny ?? [])].some(
        (c) => ["lt", "lte", "gt", "gte"].includes(c.op) && typeof c.value === "number",
      );
      if (hasThreshold && /^BNO-10/.test(r.source.cite)) {
        issues.push({
          severity: "error", id: r.id,
          message:
            "küszöbértéket tartalmazó szabály nem hivatkozhat pusztán az " +
            "osztályozásra: a küszöb klinikai állítás, és ajánlást vagy " +
            "közleményt kíván",
        });
      }
      if (!(r.when?.length || r.whenAny?.length)) {
        issues.push({ severity: "error", id: r.id, message: "a kódszabálynak nincs feltétele — mindenkire vonatkozna" });
      }
      for (const c of [...(r.when ?? []), ...(r.whenAny ?? [])]) {
        if (!reg.get(c.var)) issues.push({ severity: "error", id: r.id, message: `ismeretlen változóra hivatkozik: ${c.var}` });
      }

      // AZONOSÍTÓT EMLÉKEZETBŐL NEM ÍRUNK BE. Ha van SNOMED-hivatkozás, meg
      // kell mondani, MELYIK kiadásban ellenőriztük — a törzs maga nem
      // terjeszthető, tehát a CI nem tudja utánanézni.
      if (r.snomed && !r.snomedVerified) {
        issues.push({
          severity: "error", id: r.id,
          message:
            "SNOMED-azonosító a kiadás megjelölése nélkül: a `snomedVerified` " +
            "mondja meg, melyik GPS-kiadásban ellenőriztük. A törzs nem " +
            "terjeszthető, ezért a build nem tudja utánanézni.",
        });
      }
      if (r.snomed) {
        // SZERKEZETI ellenőrzés, kiadás nélkül is: a SNOMED-azonosítónak
        // Verhoeff-ellenőrzőjegye van, és a végén hordozza, hogy fogalmat
        // azonosít-e. Egy elgépelt vagy emlékezetből beírt szám itt bukik ki
        // — még akkor is, ha a készlet nincs betöltve.
        const c = checkSctId(r.snomed);
        if (!c.valid) {
          issues.push({ severity: "error", id: r.id, message: c.why });
        } else if (c.kind === "concept") {
          // A FŐHIERARCHIA a második, független ellenőrzés: a szám alakja nem
          // árulja el, hogy egy létező azonosító MÉRHETŐ MENNYISÉGET vagy
          // ANYAGOT jelöl-e betegség helyett. Ha a készlet nincs telepítve,
          // ez `unknown` marad — és az nem „rendben".
          const tag = checkClinicalTag(r.snomed);
          if (tag.status === "nonClinical") {
            issues.push({ severity: "error", id: r.id, message: tag.why });
          }
        } else if (c.kind !== "concept") {
          issues.push({
            severity: "error", id: r.id,
            message:
              `a szabály FOGALMAT jelöl, de a(z) ${r.snomed} egy ` +
              `${c.kind === "description" ? "leírás" : "kapcsolat"} azonosítója`,
          });
        }
      }
      for (const s of r.supersedes ?? []) {
        if (!codes.has(s)) {
          issues.push({
            severity: "warning", id: r.id,
            message: `a(z) ${s} kódot nyomná el, de arra nincs szabály — az elnyomás így hatástalan`,
          });
        }
      }
      // A KÓD LÉTEZÉSE: a megnevezés a törzsből jön, nem a szabályból.
      if (getTable("tbl.bno") && !lookupCode("tbl.bno", r.code).value) {
        issues.push({
          severity: "error", id: r.id,
          message: `a(z) ${r.code} kód nincs a betöltött BNO-törzsben — a megnevezése nem oldható fel`,
        });
      }
    }
    return issues;
  }
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function loadCodeRules(...paths: string[]): CodeRules {
  const out: CodeRule[] = [];
  for (const p of paths) {
    const files = statSync(p).isDirectory() ? filesIn(p) : [p];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, "utf8"));
      if (Array.isArray(parsed)) out.push(...parsed);
    }
  }
  return new CodeRules(out);
}
