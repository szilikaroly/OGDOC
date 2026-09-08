/**
 * POSTPARTUM PSZICHÓZIS — kockázatbecslés, szándékosan KVALITATÍVAN.
 *
 * A modul nyitott kérdése ezzel dől el: **nem gyártunk egyetlen számot.**
 *
 * A kísértés érthető: minden rizikófaktorhoz tartozik egy publikált
 * esélyhányados, és ezek összeszorzása kényelmes lenne. De az eredmény nem
 * lenne érvényes:
 *
 *   · az esélyhányadosok KÜLÖN kohorszokból származnak, eltérő
 *     alappopulációval és eltérő kimeneti definícióval;
 *   · a faktorok NEM FÜGGETLENEK — a bipoláris zavar és a korábbi postpartum
 *     pszichózis nagyrészt ugyanazt a beteget jelöli ki;
 *   · a szorzat pontosnak LÁTSZANA, és épp ez a baj: egy „14,7-szeres
 *     kockázat" mögé odaképzelt bizonyosság nincs meg.
 *
 * Ezért a rendszer FELSOROLJA a tényezőket a saját forrásukkal és a saját
 * publikált hatásukkal, és a besorolás háromfokozatú, szabályalapú. Ez
 * kevesebbnek látszik, mint egy szám — és többet ér, mert igaz.
 *
 * A kimenet klinikai tétje nagy: magas kockázatnál a felvétel mérlegelése nem
 * opció, hanem alapértelmezés. A postpartum pszichózis mintegy 5% szuicid és
 * 4% infanticid kockázattal jár, és tipikusan az első két hétben jelentkezik.
 */
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export interface RiskFactor {
  id: string;
  variable: string;
  label: I18n;
  /** A PUBLIKÁLT hatás — szövegként, mert nem számolunk vele. */
  publishedEffect: I18n;
  weight: "major" | "moderate";
  source: { cite: string; pmid?: string | null };
  /** Melyik érték számít jelenlétnek. */
  positiveWhen: unknown;
}

export const PPP_FACTORS: RiskFactor[] = [
  {
    id: "bipolar", variable: "hx.psy.bipolar",
    label: { hu: "Bipoláris zavar" },
    publishedEffect: { hu: "a legerősebb egyedi tényező; a bipoláris zavarral élő nők mintegy ötödénél alakul ki postpartum pszichózis" },
    weight: "major",
    source: {
      cite: "Jones I, Chandra PS, Dazzan P, Howard LM. Bipolar disorder, affective " +
            "psychosis, and schizophrenia in pregnancy and the post-partum period. " +
            "Lancet 2014;384(9956):1789-1799",
      pmid: "25455249",
    },
    positiveWhen: "pos",
  },
  {
    id: "prevPPP", variable: "hx.psy.prevPPP",
    label: { hu: "Korábbi postpartum pszichózis" },
    publishedEffect: { hu: "a következő szülés után kb. minden második esetben kiújul" },
    weight: "major",
    source: {
      cite: "Di Florio A et al. Perinatal episodes across the mood disorder spectrum. " +
            "JAMA Psychiatry 2013;70(2):168-175",
      pmid: "23247604",
    },
    positiveWhen: "pos",
  },
  {
    id: "prevPPD", variable: "hx.psy.prevPPD",
    label: { hu: "Korábbi szülés utáni depresszió" },
    publishedEffect: { hu: "emeli a perinatális hangulatzavar kiújulásának esélyét" },
    weight: "moderate",
    source: {
      cite: "NICE CG192: Antenatal and postnatal mental health (2014, updated 2020)",
    },
    positiveWhen: "pos",
  },
  {
    id: "primipara", variable: "ctx.parity.para",
    label: { hu: "Elsőszülő" },
    publishedEffect: { hu: "mérsékelt emelés; a postpartum pszichózis gyakoribb az első szülés után" },
    weight: "moderate",
    source: {
      cite: "Valdimarsdóttir U et al. Psychotic illness in first-time mothers. " +
            "PLoS Med 2009;6(2):e13",
      pmid: "19209952",
    },
    positiveWhen: 0,
  },
];

export interface PppFactorState {
  id: string;
  label: string;
  present: boolean | "unknown";
  weight: RiskFactor["weight"];
  publishedEffect: string;
  source: RiskFactor["source"];
  variable: string;
}

export interface PppAssessment {
  /** `high` · `elevated` · `baseline` · `unknown` */
  level: "high" | "elevated" | "baseline" | "unknown";
  factors: PppFactorState[];
  /** Amit a klinikusnak tenni kell. Magas kockázatnál nem javaslat, hanem alapértelmezés. */
  actions: string[];
  /** Mely anamnézis-tételek hiányoznak. */
  missing: string[];
  /**
   * SZÁNDÉKOSAN NINCS összesített kockázati szám. Ez a mező mondja meg, miért —
   * hogy a hiánya ne látsszon hiányosságnak.
   */
  noCombinedEstimate: string;
}

const L = (x: I18n | undefined, lang: Lang): string =>
  x?.[lang] ?? x?.hu ?? x?.en ?? "";

export function assessPpp(
  reg: Registry, state: CaseState, lang: Lang = "hu",
): PppAssessment {
  const factors: PppFactorState[] = [];
  const missing: string[] = [];

  for (const f of PPP_FACTORS) {
    const r = resolve(reg, state, f.variable);
    let present: boolean | "unknown";
    if (r.state !== "ok") { present = "unknown"; missing.push(f.variable); }
    else present = r.value === f.positiveWhen;
    factors.push({
      id: f.id, label: L(f.label, lang), present, weight: f.weight,
      publishedEffect: L(f.publishedEffect, lang), source: f.source,
      variable: f.variable,
    });
  }

  const majorPresent = factors.some((f) => f.weight === "major" && f.present === true);
  const majorUnknown = factors.some((f) => f.weight === "major" && f.present === "unknown");
  const moderateCount = factors.filter((f) => f.weight === "moderate" && f.present === true).length;

  // A BESOROLÁS SZABÁLYALAPÚ, nem számolt: egyetlen major tényező elég a magas
  // besoroláshoz, mert a klinikai teendő ugyanaz.
  let level: PppAssessment["level"];
  if (majorPresent) level = "high";
  else if (majorUnknown) level = "unknown";
  else if (moderateCount >= 1) level = "elevated";
  else level = "baseline";

  const actions: string[] = [];
  if (level === "high") {
    actions.push(
      "Perinatális pszichiátriai konzílium MÉG A SZÜLÉS ELŐTT — nem a tünetek megjelenésekor.",
      "A felvétel (hospitalizáció) mérlegelése és a mérlegelés DOKUMENTÁLÁSA a szülés utáni első két hétre.",
      "Írásos ellátási terv a betegnek és a hozzátartozónak, konkrét elérhetőségekkel.",
      "Az alvásmegvonás aktív megelőzése a gyermekágyban — ez a legjobban dokumentált kiváltó tényező.",
    );
  } else if (level === "unknown") {
    actions.push(
      "A hiányzó pszichiátriai anamnézis PÓTLANDÓ, mielőtt a kockázat megítélhető volna: " +
      missing.join(", ") + ".",
      "Amíg nincs meg, a beteg NEM tekintendő alacsony kockázatúnak.",
    );
  } else if (level === "elevated") {
    actions.push(
      "Fokozott figyelem a szülés utáni első két hétben; a hangulat és az alvás célzott kérdezése.",
      "A beteg és a hozzátartozó tájékoztatása a figyelmeztető jelekről.",
    );
  }

  return {
    level, factors, actions, missing,
    noCombinedEstimate:
      "Összesített kockázati szám SZÁNDÉKOSAN nem készül. A tényezők publikált " +
      "esélyhányadosai külön kohorszokból származnak, eltérő alappopulációval és " +
      "kimeneti definícióval, és a faktorok nem függetlenek egymástól — a " +
      "bipoláris zavar és a korábbi postpartum pszichózis nagyrészt ugyanazt a " +
      "beteget jelöli ki. A szorzatuk pontosnak látszana, és épp ez a baj.",
  };
}
