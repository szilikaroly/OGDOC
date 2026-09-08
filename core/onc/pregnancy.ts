/**
 * TERHESSÉG ALATTI DAGANAT — mi adható, és ki dönti el.
 *
 * A modul elfogadási kritériuma:
 *
 *   „Egy terhesség alatt diagnosztizált emlődaganat esetén a modul a
 *    gesztációs kor alapján jelzi, mely kezelési modalitások adhatók, és
 *    KÖTELEZŐVÉ TESZI a megosztott döntéshozatal dokumentálását."
 *
 * A két fél mondat két különböző dolgot ígér, és a különbség a modul lényege:
 *
 *   · az első TÁJÉKOZTAT — mi lehetséges, mi nem, és miért;
 *   · a második KIKÉNYSZERÍT — de nem a döntést, hanem a beszélgetést.
 *
 * A terhesség folytatásának vagy befejezésének kérdése nem orvosi döntés. A
 * rendszer nem tudja meghozni, és nem is szabad úgy tennie, mintha tudná. Amit
 * megtehet: nem engedi, hogy a döntés a beszélgetés nélkül szülessen meg.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";

export type Feasibility = "yes" | "conditional" | "no" | "unknown";

export interface ModalityAdvice {
  modality: string;
  label: string;
  feasibility: Feasibility;
  why: string;
  source: string;
}

export interface PregnancyOncAdvice {
  /** A gesztációs kor a diagnóziskor — minden más ebből következik. */
  gaWeeks: number | null;
  trimester: 1 | 2 | 3 | null;
  modalities: ModalityAdvice[];
  /** A megosztott döntéshozatal állapota — ez a KAPU. */
  sharedDecision: {
    documented: boolean;
    /** Lezárható-e a kezelési terv. */
    canProceed: boolean;
    reason: string;
    missing: string[];
  };
  caveat: string;
}

const SRC_ESMO =
  "Peccatori FA et al. Cancer, pregnancy and fertility: ESMO Clinical Practice " +
  "Guidelines. Ann Oncol 2013;24(Suppl 6):vi160-vi170; Amant F et al. " +
  "Gynecologic cancers in pregnancy: guidelines of the second international " +
  "consensus meeting. Int J Gynecol Cancer 2014;24(3):394-403";

export function pregnancyOncAdvice(
  reg: Registry, state: CaseState, _lang: Lang = "hu",
): PregnancyOncAdvice {
  const ga = resolve(reg, state, "onc.preg.gaAtDiagnosis");
  const weeks = ga.state === "ok" && typeof ga.value === "number" ? ga.value : null;
  const trimester = weeks == null ? null : weeks < 14 ? 1 : weeks < 28 ? 2 : 3;

  const modalities: ModalityAdvice[] = [];
  const add = (
    modality: string, label: string, feasibility: Feasibility, why: string,
    source = SRC_ESMO,
  ) => modalities.push({ modality, label, feasibility, why, source });

  if (weeks == null) {
    // NINCS TALÁLGATÁS: a gesztációs kor nélkül egyetlen modalitásról sem
    // mondható meg, hogy adható-e. Ez nem óvatosság — a válasz trimeszterenként
    // az ellenkezőjére fordul.
    for (const [m, l] of [["surgery", "Műtét"], ["chemo", "Kemoterápia"],
                          ["radio", "Sugárterápia"], ["targeted", "Célzott terápia"],
                          ["immuno", "Immunterápia"]] as const) {
      add(m, l, "unknown",
        "A gesztációs kor a diagnóziskor nem ismert. Enélkül a modalitás " +
        "megítélhetetlen: a válasz trimeszterenként az ellenkezőjére fordul.");
    }
  } else {
    add("surgery", "Műtét", "yes",
      "A műtét a terhesség bármely szakában elvégezhető. A II. trimeszter a " +
      "legkedvezőbb: a szervfejlődés lezárult, és a méh még nem korlátozza a " +
      "hozzáférést. Az altatás önmagában nem növeli a fejlődési rendellenesség " +
      "kockázatát.");

    if (trimester === 1) {
      add("chemo", "Kemoterápia", "no",
        "AZ I. TRIMESZTERBEN KONTRAINDIKÁLT: a szervfejlődés ideje, és a " +
        "fejlődési rendellenesség kockázata jelentős. A kezelés halasztása a " +
        "14. hétig vagy a terhesség megszakítása közötti választás a beteg " +
        "döntése — és ez az a pont, ahol a megosztott döntéshozatal nem " +
        "formaság.");
    } else {
      add("chemo", "Kemoterápia", "conditional",
        "A II–III. trimeszterben több szer adható, és a magzati kimenetel a " +
        "közlemények szerint nem rosszabb. FELTÉTELEK: a 35. hét után már nem " +
        "kezdendő új ciklus, és a SZÜLÉS ELŐTT legalább három hét kell a " +
        "csontvelő-mélypont miatt — különben az anya és az újszülött is " +
        "cytopeniásan érkezik a szülésbe.");
    }

    add("radio", "Sugárterápia", trimester === 1 ? "no" : "conditional",
      trimester === 1
        ? "Az I. trimeszterben kerülendő. A magzati dózis a célterülettől és a " +
          "hasi távolságtól függ; fej-nyaki vagy mellkasi besugárzásnál a " +
          "szórt dózis árnyékolással alacsonyan tartható, hasi-kismedencei " +
          "besugárzásnál nem."
        : "Egyedi mérlegelés: a magzati dózis becslése és árnyékolás mellett " +
          "egyes lokalizációknál adható. A 100 mGy alatti magzati dózis nem " +
          "indokol terhességmegszakítást — a döntés a becsült dózison múlik, " +
          "nem a modalitás nevén.");

    add("targeted", "Célzott terápia", "no",
      "A legtöbb célzott szer terhességben ellenjavallt vagy nincs róla adat. " +
      "A trastuzumab a magzatvíz csökkenését okozza; a bevacizumab a " +
      "méhlepény érképződését érinti. A halasztás vagy a szülés utáni kezdés a " +
      "szokásos út.");

    add("immuno", "Immunterápia", "no",
      "Terhességben nincs elegendő adat, és a placentán átjutó IgG-alapú " +
      "szerek magzati hatása ismeretlen. Az adathiány NEM biztonságosságot " +
      "jelent.");
  }

  const sd = resolve(reg, state, "onc.preg.sharedDecision");
  const options = resolve(reg, state, "onc.preg.decision.options");
  const documented = sd.state === "ok" && sd.value === true;
  const hasOptions = options.state === "ok" && String(options.value).trim().length > 0;

  const missing: string[] = [];
  if (!documented) missing.push("onc.preg.sharedDecision");
  if (!hasOptions) missing.push("onc.preg.decision.options");

  return {
    gaWeeks: weeks, trimester, modalities,
    sharedDecision: {
      documented,
      canProceed: documented && hasOptions,
      missing,
      reason: documented && hasOptions
        ? "A megosztott döntéshozatal dokumentálva, a megbeszélt lehetőségekkel együtt."
        : "A KEZELÉSI TERV NEM ZÁRHATÓ LE a megosztott döntéshozatal " +
          "dokumentálása nélkül. Hiányzik: " + missing.join(", ") + ". " +
          "A terhesség folytatásának vagy befejezésének kérdése nem orvosi " +
          "döntés — a rendszer nem hozza meg helyette, de nem is engedi, hogy " +
          "a beszélgetés nélkül szülessen meg. A megbeszélt LEHETŐSÉGEK " +
          "felsorolása azért kell külön, mert az egyetlen felkínált út " +
          "melletti beleegyezés nem döntés.",
    },
    caveat:
      "A modalitások megítélése ÁLTALÁNOS keret, nem kezelési terv: a konkrét " +
      "szer, a stádium, a szövettan és a beteg értékrendje mind módosítja. Az " +
      "esetet multidiszciplináris csapat elé kell vinni, amelyben a szülész és " +
      "a neonatológus is részt vesz — enélkül a döntés a magzatra vonatkozó " +
      "részt nem fedi le.",
  };
}
