/**
 * A ZÁRÓJELENTÉS ÖSSZEÁLLÍTÁSA.
 *
 * A modul elfogadási kritériuma:
 *
 *   „Egy teljes eset zárójelentése egy gombnyomásra elkészül, nyomtatható, és
 *    NEM TARTALMAZ KITÖLTETLEN SABLONHELYET. Ahol adat hiányzik, ott az
 *    hiányként jelenik meg, nem üres mezőként."
 *
 * A második mondat a nehezebb, és nem stilisztikai kérdés. Az üres rubrika
 * NÉMA ÁLLÍTÁS: a következő ellátó negatív leletnek olvassa. „Fizikális
 * status: ———" nem azt jelenti, hogy semmi kóros nem volt, hanem azt, hogy
 * nem tudjuk, megvizsgálták-e.
 *
 * Ezért minden blokknak három állapota van, és a harmadik szigorúan őrzött:
 *
 *   filled · missing · notApplicable
 *
 * A „nem vonatkozik rá" CSAK RÖGZÍTETT TÉNYBŐL jöhet (járóbeteg-ellátásnál
 * nincs kórházi lefolyás). Az adat hiánya soha nem elég hozzá — ugyanaz a
 * szabály, mint a szűrési esedékességnél.
 */
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import type { Segment } from "../epikrizis/types.ts";
import type { Authenticity, BlockState, DischargeBlock, DischargeSummary } from "./types.ts";
import { resolve } from "../derive/resolve.ts";
import { withUnit } from "../ui/units.ts";
import { epicrisis } from "../epikrizis/build.ts";
import { readiness, type DocumentRegistry } from "../docs/registry.ts";
import { overrides } from "../rx/prescribe.ts";
import type { DrugRegistry } from "../rx/registry.ts";
import type { Procedures } from "../op/registry.ts";

const L = (x: I18n | undefined, lang: Lang): string => x?.[lang] ?? x?.hu ?? x?.en ?? "";

interface BlockSpec {
  id: string;
  title: string;
  phi?: boolean;
  /** Nevesített változók, ebben a sorrendben. */
  vars?: string[];
  /** Minden rögzített változó, aminek a modulja ezekkel az előtagokkal kezdődik. */
  modules?: string[];
  /** Csak a POZITÍV (`pos`) háromállású válaszok — az anamnézis-kivonathoz. */
  positivesOnly?: boolean;
  /** Az okoslelet melyik szakaszát veszi át. */
  section?: string;
  /** Motorból származó tartalom. */
  engine?: "oeno" | "rxOverrides";
  /** Mit jelent, ha üres. */
  whenEmpty: string;
  /**
   * Mikor NEM vonatkozik a betegre — rögzített tényből. Ha a feltétel
   * változója nincs rögzítve, a blokk `missing` lesz, NEM `notApplicable`.
   */
  notApplicableWhen?: { var: string; in: string[]; note: string };
}

const BLOCKS: BlockSpec[] = [
  {
    id: "header", title: "Fejléc",
    vars: ["disch.institution.name", "ctx.encounter", "ctx.pathway",
           "disch.admittedAt", "disch.at"],
    whenEmpty: "Az ellátás azonosító adatai nincsenek rögzítve.",
    // Az ELLÁTÁS IDŐSZAKA kell, nem csak a vége: enélkül az ápolási idő nem
    // állapítható meg, és az olvasó nem tudja, mennyi ideig tartott, amit olvas.
  },
  {
    id: "patient", title: "Betegazonosítás", phi: true,
    vars: ["patient.taj", "patient.birthDate", "patient.age"],
    whenEmpty: "A beteg azonosító adatai nincsenek rögzítve — a dokumentum enélkül nem adható ki.",
  },
  {
    id: "dxAdmission", title: "Felvételi diagnózis",
    vars: ["disch.dxAdmission", "ctx.referralDx", "ctx.purpose"],
    whenEmpty: "Felvételi diagnózis nincs rögzítve. A felvételi és a végdiagnózis ELTÉRÉSE önmagában klinikai információ — enélkül ez nem állapítható meg.",
  },
  {
    id: "anamnesis", title: "Anamnézis kivonat",
    modules: ["hx"], positivesOnly: true,
    whenEmpty: "Nincs POZITÍV anamnesztikus tétel. Ez NEM azt jelenti, hogy az anamnézis negatív: lehet, hogy nem vették fel. A hiányzó tételek a „Amit nem tudunk” szakaszban szerepelnek.",
  },
  {
    id: "status", title: "Fizikális status",
    modules: ["status", "vitals", "anthro", "exam"],
    whenEmpty: "Fizikális státusz nincs rögzítve. Az üres rubrika NEM negatív lelet: nem tudjuk, megvizsgálták-e.",
  },
  {
    id: "investigations", title: "Elvégzett vizsgálatok és leletek",
    modules: ["lab", "imaging", "ekg"],
    whenEmpty: "Vizsgálati eredmény nincs rögzítve.",
  },
  {
    id: "course", title: "Lefolyás",
    modules: ["labour", "op", "szuloszoba"],
    notApplicableWhen: {
      var: "ctx.encounter", in: ["ambulatory", "telemedicine"],
      note: "Járóbeteg-ellátás: kórházi lefolyás nem értelmezhető.",
    },
    whenEmpty: "A lefolyásról nincs rögzített adat.",
  },
  {
    id: "treatment", title: "Kezelés",
    modules: ["rx", "diet"],
    whenEmpty: "Kezelés nincs rögzítve.",
  },
  {
    id: "gateOverrides", title: "Kapu-megkerülések indoklása",
    engine: "rxOverrides",
    whenEmpty: "Nem történt kapu-megkerülés.",
  },
  {
    id: "dxFinal", title: "Végdiagnózis",
    // A KÓDOLÓ DÖNTÉSE kerül a dokumentumra, NEM a rendszer ajánlása. Egy
    // dokumentum nem mutathat javaslatot tényként: az ajánlás a rögzített
    // adatból bármikor újraszámolható, a kiadott zárójelentés nem.
    vars: ["disch.dxFinal", "code.dx.primary", "code.dx.certainty", "disch.condition"],
    whenEmpty: "VÉGDIAGNÓZIS NINCS RÖGZÍTVE. A zárójelentés enélkül nem tölti be a szerepét: a következő ellátó ebből indul ki.",
  },
  {
    id: "procedures", title: "Elvégzett beavatkozások",
    engine: "oeno",
    vars: ["code.proc.performed"],
    whenEmpty: "Beavatkozás nincs rögzítve. Ez NEM azt jelenti, hogy nem történt.",
  },
  {
    id: "outcome", title: "Kimenetel",
    section: "outcome",
    vars: ["disch.type"],
    whenEmpty: "Kimeneteli adat nincs rögzítve (a 15. modul még nincs feltöltve).",
  },
  {
    id: "recommendation", title: "Javaslat",
    section: "recommendation",
    vars: ["disch.restrictions", "disch.sickLeave.until", "disch.medication.reconciled"],
    whenEmpty: "Javaslat nem képződött. Ez akkor fordul elő, ha nincs olyan rögzített érték, amiből teendő következne — nem akkor, ha a klinikus nem írt semmit.",
  },
  {
    id: "followUp", title: "Ellenőrző vizsgálat",
    vars: ["plan.nextVisit.at", "plan.nextVisit.rationale", "disch.gpNotified"],
    whenEmpty: "Ellenőrző vizsgálat időpontja nincs megbeszélve.",
  },
  {
    id: "gap", title: "Amit nem tudunk",
    section: "gap",
    whenEmpty: "Nincs jelzett információhiány.",
  },
  {
    id: "handover", title: "Átadás és aláírás",
    vars: [
      "disch.patientCopyGiven", "disch.language", "disch.summaryReviewedBy",
      "disch.signedBy", "disch.signedAt", "disch.countersignedBy", "disch.countersignedAt",
    ],
    whenEmpty: "A dokumentum nincs átnézve és aláírva.",
  },
];

/** Egy változó emberi olvasatú alakja, a kódlista címkéjével. */
function line(reg: Registry, state: CaseState, id: string, lang: Lang): Segment | null {
  const def = reg.get(id);
  const r = resolve(reg, state, id);
  if (!def || r.state !== "ok") return null;
  let value = String(r.value);
  if (Array.isArray(r.value)) {
    value = r.value.map((v) => {
      const o = def.valueSet?.find((x) => String(x.code) === String(v));
      return o ? (lang === "en" ? o.label_en : o.label_hu) ?? String(v) : String(v);
    }).join(", ");
  } else if (def.valueSet) {
    const o = def.valueSet.find((x) => String(x.code) === String(r.value));
    if (o) value = (lang === "en" ? o.label_en : o.label_hu) ?? value;
  } else if (typeof r.value === "boolean") {
    value = r.value ? "igen" : "nem";
  }
  return {
    kind: "fact",
    text: `${L(def.label, lang)}: ${withUnit(value, def.unit, lang)}`,
    from: [id],
    severity: def.valueSet?.find((x) => String(x.code) === String(r.value))
      ?.flags?.includes("redflag") ? "redflag" : "normal",
  };
}

export interface DischargeOpts {
  lang?: Lang;
  drugs?: DrugRegistry;
  procedures?: Procedures;
  /**
   * Van-e hitelesített felhasználói azonosítás a rendszerben.
   *
   * ALAPÉRTELMEZÉSBEN NINCS, és ez nem óvatosság: a 25. modul (jogosultság,
   * audit) nem létezik, tehát az aláírás mezőbe bárki bármit beírhat. Egy
   * kapu, amit egy név BEGÉPELÉSE nyit, nem kapu.
   */
  identityVerified?: boolean;
}

export function buildDischarge(
  reg: Registry, docs: DocumentRegistry, state: CaseState, opts: DischargeOpts = {},
): DischargeSummary {
  const lang = opts.lang ?? "hu";
  const epi = epicrisis(reg, state, "discharge", { lang });
  const blocks: DischargeBlock[] = [];

  for (const spec of BLOCKS) {
    const segments: Segment[] = [];

    for (const id of spec.vars ?? []) {
      const s = line(reg, state, id, lang);
      if (s) segments.push(s);
    }

    if (spec.modules) {
      for (const def of reg.all()) {
        if (!spec.modules.some((m) => def.module === m || def.module.startsWith(m + "."))) continue;
        if (def.aliasOf) continue;
        const r = resolve(reg, state, def.id);
        if (r.state !== "ok") continue;
        // Az anamnézis-kivonat CSAK a pozitívokat viszi: a negatívok
        // felsorolása kitakarná azt a néhány tételt, ami számít.
        if (spec.positivesOnly && r.value !== "pos" && r.value !== true) continue;
        const s = line(reg, state, def.id, lang);
        if (s) segments.push(s);
      }
    }

    if (spec.section) {
      const sec = epi.sections.find((s) => s.id === spec.section);
      if (sec) segments.push(...sec.segments);
    }

    if (spec.engine === "oeno" && opts.procedures) {
      for (const o of opts.procedures.oenoFor(reg, state, lang)) {
        segments.push({
          kind: "coding",
          text: `${o.label} — OENO ${o.code} (${o.version})`,
          from: ["op.procedure"], evidence: o.note,
        });
      }
    }
    if (spec.engine === "rxOverrides" && opts.drugs) {
      for (const o of overrides(reg, opts.drugs, state)) {
        segments.push({
          kind: "risk", severity: "watch",
          text: `${o.label} — a(z) ${o.gate} kapu megkerülve. Indoklás: ${o.reason}`,
          from: ["rx.override.gate", "rx.override.reason"],
        });
      }
    }

    let stateOf: BlockState = segments.length ? "filled" : "missing";
    let note: string | undefined = segments.length ? undefined : spec.whenEmpty;

    // A „nem vonatkozik rá" CSAK rögzített tényből. Ha a feltétel változója
    // nincs rögzítve, a blokk HIÁNY marad — a nem tudás nem mentesít.
    if (!segments.length && spec.notApplicableWhen) {
      const r = resolve(reg, state, spec.notApplicableWhen.var);
      if (r.state === "ok" && spec.notApplicableWhen.in.includes(String(r.value))) {
        stateOf = "notApplicable";
        note = spec.notApplicableWhen.note;
      }
    }

    blocks.push({
      id: spec.id, title: spec.title, state: stateOf, segments, note, phi: spec.phi,
    });
  }

  return {
    documentId: "doc.zarojelentes",
    title: "Zárójelentés",
    blocks,
    authenticity: authenticity(reg, docs, state, opts),
    generation: {
      method: "rule-based",
      note: {
        hu:
          "A dokumentum tartalma SZABÁLYALAPÚ GENERÁLÁSSAL állt össze a rögzített " +
          "adatokból; nincs nyelvi modell a folyamatban. Minden állítás mögött ott " +
          "a forrásváltozó, és amit a rendszer nem tud, azt kimondja.",
        en:
          "Rule-based generation from recorded data — no language model involved.",
      },
      at: state.ctx.now,
    },
  };
}

/**
 * HITELESSÉG — a modul nyitott kérdése.
 *
 * Négy feltétel, és a negyedik ma MINDENKINÉL zárva van.
 */
export function authenticity(
  reg: Registry, docs: DocumentRegistry, state: CaseState, opts: DischargeOpts = {},
): Authenticity {
  const missing: string[] = [];
  const has = (id: string) => resolve(reg, state, id).state === "ok";
  const isPos = (id: string) => {
    const r = resolve(reg, state, id);
    return r.state === "ok" && r.value === "pos";
  };

  // 1. A kötelező mezők — a dokumentumtörzsből, nem innen.
  const rd = readiness(docs, reg, state, "doc.zarojelentes");
  for (const m of rd.missing) missing.push(m);

  // 2. Az intézmény befogadta-e a generált dokumentumot.
  if (!isPos("disch.institution.approved")) missing.push("disch.institution.approved");

  // 3. Aláírás és ellenjegyzés — a `doc.zarojelentes` mindkettőt előírja.
  const sig = docs.get("doc.zarojelentes")?.signature;
  if (!has("disch.signedBy") || !has("disch.signedAt")) missing.push("disch.signedBy");
  if (sig?.countersign && (!has("disch.countersignedBy") || !has("disch.countersignedAt"))) {
    missing.push("disch.countersignedBy");
  }
  // Az ÁTNÉZÉS külön esemény az aláírástól: az automatikusan összeálló
  // dokumentum legnagyobb kockázata, hogy senki nem olvassa el.
  if (!has("disch.summaryReviewedBy")) missing.push("disch.summaryReviewedBy");

  // 4. A KAPU, ami ma mindenkinél zárva van.
  const identity = opts.identityVerified === true;
  if (!identity) missing.push("hitelesített felhasználói azonosítás (25. modul)");

  const canIssue = missing.length === 0;
  return {
    status: canIssue ? "authentic" : "draft",
    canIssue,
    missing,
    notice: canIssue
      ? "Hiteles egészségügyi dokumentum. Aláírta és ellenjegyezte a fent " +
        "megnevezett személy; az intézmény a generált zárójelentést a " +
        "dokumentációs rendjébe illesztette."
      : "MUNKAANYAG — NEM HITELES EGÉSZSÉGÜGYI DOKUMENTUM. " +
        (identity
          ? "Hiányzik: " + missing.join(", ") + ". "
          : "A rendszerben NINCS hitelesített felhasználói azonosítás (25. modul), " +
            "ezért az aláírás mezőbe beírt név semmit nem bizonyít — a dokumentum " +
            "a tartalmától függetlenül nem nyilvánítható hitelessé. " +
            (missing.length > 1 ? "Ezen felül hiányzik: " +
              missing.filter((m) => !m.startsWith("hitelesített")).join(", ") + ". " : "")) +
        "A tartalom tájékoztatásra és belső felhasználásra alkalmas.",
  };
}
