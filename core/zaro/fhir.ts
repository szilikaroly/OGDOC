/**
 * FHIR R4 `Composition` — és a kapu, ami az interoperabilitásra is vonatkozik.
 *
 * A csábítás itt a legnagyobb: egy `status: "final"` bélyegű Composition
 * ugyanúgy néz ki a fogadó rendszerben, mint egy valódi, aláírt zárójelentés,
 * és a fogadó oldalon SENKI nem fogja végigolvasni, honnan jött. Az export
 * ezért ugyanazt a kaput hordozza, mint a nyomtatás:
 *
 *   HITELESÍTÉS NÉLKÜL A STÁTUSZ `preliminary`, ÉS EZEN NINCS KAPCSOLÓ.
 *
 * Amit a modul NEM állít: hogy ez a kimenet konformancia-ellenőrzött. Nincs
 * validátorral szembefuttatva, a kódrendszerek pedig részben hiányoznak (a
 * BNO és a HBCS a 17. modulé). A `meta.tag` ezt ki is mondja — nem a
 * dokumentációban, hanem MAGÁBAN A KIMENETBEN, mert a fogadó rendszer a
 * dokumentációt nem olvassa.
 */
import type { DischargeSummary } from "./types.ts";

export interface CompositionSection {
  title: string;
  text: { status: "generated"; div: string };
}

export interface Composition {
  resourceType: "Composition";
  status: "preliminary" | "final";
  type: { coding: Array<{ system: string; code: string; display: string }> };
  date: string;
  title: string;
  meta: { tag: Array<{ system: string; code: string; display: string }> };
  section: CompositionSection[];
  /** Beteg-azonosító hivatkozás — a kutatási változatban nincs. */
  subject?: { reference: string };
}

export interface FhirOpts {
  kind?: "care" | "research";
  /** A beteg erőforrás-hivatkozása. Kutatási változatban figyelmen kívül marad. */
  subjectReference?: string;
}

const TAGS = {
  notValidated: {
    system: "urn:ogdoc:tag",
    code: "not-conformance-validated",
    display:
      "NEM konformancia-ellenőrzött kimenet: FHIR-validátorral nincs szembefuttatva, " +
      "és a diagnózis- és beavatkozás-kódrendszerek részben hiányoznak (17. modul).",
  },
  draft: {
    system: "urn:ogdoc:tag",
    code: "not-authenticated",
    display:
      "MUNKAANYAG: a forrásdokumentum nem hiteles egészségügyi dokumentum, ezért a " +
      "Composition státusza `preliminary`. Ezen nincs kapcsoló.",
  },
  research: {
    system: "urn:ogdoc:tag",
    code: "de-identified",
    display: "Kutatási példány: beteg-azonosító hivatkozás és blokk nélkül.",
  },
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function toComposition(d: DischargeSummary, opts: FhirOpts = {}): Composition {
  const kind = opts.kind ?? "care";
  const tags = [TAGS.notValidated];
  if (d.authenticity.status !== "authentic") tags.push(TAGS.draft);
  if (kind === "research") tags.push(TAGS.research);

  const section: CompositionSection[] = [];
  for (const b of d.blocks) {
    if (kind === "research" && b.phi) continue;
    // A HIÁNY IS SZAKASZ. Ha az üres blokkokat kihagynánk, a fogadó rendszer
    // ugyanoda jutna, mint az olvasó az üres rubrikánál: nem tudná, hogy nem
    // vizsgálták, vagy nem volt kóros.
    const body = b.state === "filled"
      ? "<ul>" + b.segments.map((s) => `<li>${esc(s.text)}</li>`).join("") + "</ul>"
      : `<p><em>${b.state === "notApplicable" ? "Nem vonatkozik rá" : "Nincs adat"} — ` +
        `${esc(b.note ?? "")}</em></p>`;
    section.push({
      title: b.title,
      text: { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml">${body}</div>` },
    });
  }

  const c: Composition = {
    resourceType: "Composition",
    // A KAPU: hitelesítés nélkül soha nem `final`.
    status: d.authenticity.status === "authentic" ? "final" : "preliminary",
    type: {
      coding: [{
        system: "http://loinc.org", code: "18842-5", display: "Discharge summary",
      }],
    },
    date: d.generation.at,
    title: d.title,
    meta: { tag: tags },
    section,
  };
  if (kind === "care" && opts.subjectReference) {
    c.subject = { reference: opts.subjectReference };
  }
  return c;
}
