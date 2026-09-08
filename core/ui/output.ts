/**
 * Két generált kimenet minden rögzített leletből:
 *
 *   1. a BETEGNEK szóló szöveg — értéktől függetlenül, a normálisról is;
 *   2. a KLINIKUSNAK szóló javaslatok — beutalás, labor, képalkotás,
 *      kontroll, diéta.
 *
 * Egyik sem gépelt. Mindkettő a regiszterből és a rögzített értékből
 * generálódik, ezért nem tud eltérni attól, ami a rekordban van.
 */
import type { Registry } from "../registry.ts";
import type { CaseState, I18n, Lang, Recommendation } from "../types.ts";
import { resolve } from "../derive/resolve.ts";
import { findingState, effectiveFinding } from "./disclosure.ts";
import { DerivationGraph } from "../derive/graph.ts";

const L = (x: I18n | undefined, lang: Lang): string | null =>
  x?.[lang] ?? x?.hu ?? x?.en ?? null;

export interface PatientLine {
  id: string;
  text: string;
  /** `false`, ha a mezőt nem rögzítették és az alapértelmezésből következik. */
  explicit: boolean;
  tone: "normal" | "abnormal" | "limited" | "impossible";
}

/**
 * A betegnek szóló összefoglaló.
 *
 * A normális lelet IS megjelenik: „a szívhangok vizsgálata eltérést nem
 * mutatott" többet mond a betegnek, mint a csend. De a nem rögzített mezőből
 * NEM állítunk semmit — az `explicit: false` sorok kimaradnak a beteg
 * példányából, mert azokat nem vizsgálták meg.
 */
export function patientSummary(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): PatientLine[] {
  const out: PatientLine[] = [];
  for (const d of reg.all()) {
    if (d.aliasOf || !d.patientText) continue;
    const eff = effectiveFinding(reg, state, d.id);
    // A KIMARADT mezőről nem állítunk semmit — nem vizsgáltuk meg.
    if (!eff.explicit || eff.state === "omitted") continue;

    const text = L(d.patientText[eff.state as keyof typeof d.patientText] as I18n, lang);
    if (!text) continue;
    out.push({ id: d.id, text, explicit: true, tone: eff.state as PatientLine["tone"] });
  }
  return out;
}

export interface ActiveRecommendation extends Recommendation {
  /** Melyik változó váltotta ki — a felületen ez indokolja a javaslatot. */
  from: string;
  fromLabel: string;
  text: string;
}

/**
 * A klinikusnak szóló javaslatok a rögzített leletekből.
 *
 * A javaslat mellett MINDIG ott van, melyik mező váltotta ki. Egy indoklás
 * nélküli javaslatot a klinikus vagy vakon elfogad, vagy vakon elutasít —
 * mindkettő rossz.
 */
export function recommendations(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): ActiveRecommendation[] {
  const out: ActiveRecommendation[] = [];
  for (const d of reg.all()) {
    if (d.aliasOf || !d.recommends?.length) continue;
    const st = findingState(reg, state, d.id);
    const val = resolve(reg, state, d.id);

    for (const r of d.recommends) {
      if (r.code !== undefined) {
        if (val.state !== "ok" || val.value !== r.code) continue;
      } else if (r.when !== "always") {
        if (st === "omitted") continue;          // kimaradtból nem következtetünk
        if (st !== r.when) continue;
      }
      const text = L(r.what, lang);
      if (!text) continue;
      out.push({
        ...r, text, from: d.id,
        fromLabel: L(d.label, lang) ?? d.id,
      });
    }
  }
  const rank = { urgent: 0, soon: 1, routine: 2 } as const;
  return out.sort((a, b) =>
    (rank[a.urgency ?? "routine"] - rank[b.urgency ?? "routine"])
    || a.kind.localeCompare(b.kind));
}

export interface NeedsConfirmation {
  id: string;
  label: string;
  value: unknown;
  t: string;
  /** Amire ez a mező hatna, ha megerősítenék — ez indokolja a sürgősséget. */
  wouldAffect: string[];
}

/**
 * A beteg által megadott, de klinikus által még meg nem erősített értékek.
 *
 * A betegfelvétel beteg oldalán rögzült anamnézis `patient` eredetet kap — ez a
 * precedencia legalja, tehát bármely klinikusi bejegyzés felülírja. De amíg
 * senki nem erősítette meg, **döntés nem épülhet rá**: egy hard-stop kaput a
 * beteg saját bejelölése önmagában nem húzhat meg.
 */
export function needsConfirmation(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): NeedsConfirmation[] {
  const out: NeedsConfirmation[] = [];
  for (const d of reg.all()) {
    if (d.aliasOf) continue;
    const vals = state.values[d.id] ?? [];
    if (!vals.length) continue;
    const hasClinician = vals.some((v) => v.provenance === "clinician");
    const fromPatient = vals.filter((v) => v.provenance === "patient");
    if (!fromPatient.length || hasClinician) continue;
    const latest = [...fromPatient].sort((a, b) => Date.parse(b.t) - Date.parse(a.t))[0];
    out.push({
      id: d.id,
      label: L(d.label, lang) ?? d.id,
      value: latest.value,
      t: latest.t,
      wouldAffect: new DerivationGraph(reg).impactOf(d.id),
    });
  }
  return out.sort((a, b) => b.wouldAffect.length - a.wouldAffect.length);
}
