/**
 * VBAC — a hüvelyi szülés esélye korábbi császármetszés után.
 *
 * SZABÁLYALAPÚ ÉRTÉKELÉS, nem kalkulátor. Két okból, és mindkettő fontos:
 *
 * 1. **A bemenetek kódoltak.** A korábbi hüvelyi szülés, a korábbi sikeres
 *    VBAC és az ismétlődő javallat háromállású mezők (`pos`/`neg`/`unk`) — a
 *    kalkulátor-réteg viszont csak SZÁMOT fogad. Egy ilyen bemenetű
 *    kalkulátor örökre „hiányzó bemenet"-et mondana, és ez a kapu mögötti
 *    állapottól megkülönböztethetetlen: a rendszer úgy tűnne, mintha adatra
 *    várna, miközben soha nem is tudna számolni. A regiszter validátora ezt
 *    ma build-hibaként fogja meg.
 *
 * 2. **Az együtthatók nincsenek meg.** A 2021-es, ETNIKUM NÉLKÜLI változat
 *    regressziós együtthatói nélkül a képlet nem implementálható — és
 *    közelítéssel implementálni rosszabb lenne, mint nem adni számot: egy
 *    60%-ra becsült VBAC-esély más beszélgetés, mint egy 40%-ra becsült, és a
 *    beteg ez alapján dönt.
 *
 * Ami MEGVAN, és amit a tanácsadás használni tud: mely tényezők állnak fenn,
 * és melyik irányba mutatnak. Ez kevesebb, mint egy százalék — és több, mint
 * egy rossz százalék.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { nemTudja, resolve } from "../derive/resolve.ts";

export interface VbacFactor {
  id: string;
  variable: string;
  label: string;
  present: boolean | "unknown";
  /** Melyik irányba mozdítja az esélyt — SZÖVEGESEN, mert nem számolunk vele. */
  direction: "javítja" | "rontja";
  note: string;
}

export interface VbacAssessment {
  factors: VbacFactor[];
  /** Amit MÉG NEM KÉRDEZTÜNK MEG. */
  missing: string[];
  /** Amit megkérdeztünk, és a beteg nem tudja. Ez nem „nem”. */
  nemTudja: string[];
  /** Ellenjavallt-e a hüvelyi szülés kísérlete — ez KÓDOLT adatból dől el. */
  contraindicated: { yes: boolean; why: string | null };
  noProbability: string;
  source: string;
}

const FACTORS: Array<Omit<VbacFactor, "present">> = [
  // SZÁMLÁLÓ, nem háromállású: hány korábbi hüvelyi szülés volt.
  { id: "priorVaginal", variable: "hx.repro.prevBirth.vaginal",
    label: "Korábbi hüvelyi szülés", direction: "javítja",
    note: "A legerősebb kedvező tényező: aki már szült hüvelyi úton, annál a "
        + "kísérlet lényegesen nagyobb eséllyel sikeres." },
  { id: "priorVbac", variable: "hx.repro.prevBirth.vbac",
    label: "Korábbi sikeres VBAC", direction: "javítja",
    note: "A korábbi sikeres hüvelyi szülés császármetszés után a legjobb "
        + "előrejelző." },
  { id: "recurringIndication", variable: "hx.repro.prevBirth.recurringIndication",
    label: "Ismétlődő javallat (pl. medenceszűkület)", direction: "rontja",
    note: "Ha az előző császármetszés oka most is fennáll, a kísérlet esélye "
        + "kisebb." },
];

export function assessVbac(
  reg: Registry, state: CaseState, _lang: Lang = "hu",
): VbacAssessment {
  const factors: VbacFactor[] = [];
  const missing: string[] = [];
  const nemTudjaList: string[] = [];

  for (const f of FACTORS) {
    const def = reg.get(reg.resolvePrimary(f.variable));
    const r = resolve(reg, state, f.variable);
    if (r.state !== "ok") {
      missing.push(f.variable);
      factors.push({ ...f, present: "unknown" });
      continue;
    }
    // A RÖGZÍTETT „NEM TUDOM” nem tényező-hiány: megkérdeztük. De „nem”-mé
    // sem válhat — a korábbi sikeres VBAC-ról szóló bizonytalanság a
    // tanácsadás része, nem elhallgatható.
    if (nemTudja(reg, f.variable, r.value)) {
      nemTudjaList.push(f.variable);
      factors.push({ ...f, present: "unknown" });
      continue;
    }
    // A korábbi hüvelyi szülések SZÁMLÁLÓ mező, a többi háromállású — a
    // jelenlét megállapítása ezért típusfüggő, nem egységes `=== "pos"`.
    const present = def?.datatype === "quantity"
      ? Number(r.value) > 0
      : r.value === "pos";
    factors.push({ ...f, present });
  }

  // ELLENJAVALLAT: ez nem esélybecslés, hanem tény — és kódolt mezőből jön.
  const uterotomy = resolve(reg, state, "op.cs.uterotomy");
  const bad = ["classical", "inverted-T", "J"];
  const contraindicated = uterotomy.state === "ok" && bad.includes(String(uterotomy.value))
    ? {
        yes: true,
        why:
          "A korábbi uterotomia klasszikus, T- vagy J-metszés volt: a " +
          "méhrepedés kockázata lényegesen nagyobb, és a hüvelyi szülés " +
          "kísérlete ellenjavallt. Ez NEM esélykérdés.",
      }
    : { yes: false, why: null };

  return {
    factors, missing, nemTudja: nemTudjaList, contraindicated,
    noProbability:
      "Százalékos esély NEM készül: a 2021-es, etnikum nélküli Grobman-modell " +
      "regressziós együtthatói nincsenek meg. Közelítéssel implementálni " +
      "rosszabb lenne, mint nem adni számot — a beteg ez alapján dönt. A régi, " +
      "etnikai tagot tartalmazó képlet visszaállítása nem opció: az fekete és " +
      "spanyolajkú nőknél rendszeresen alacsonyabb esélyt jósolt, és ezzel " +
      "több császármetszéshez vezetett." +
      (missing.length
        ? ` Ezen felül ${missing.length} tényezőhöz nincs adat (${missing.join(", ")}).`
        : "") +
      (nemTudjaList.length
        ? ` ${nemTudjaList.length} tételre a beteg azt válaszolta, hogy nem tudja ` +
          `(${nemTudjaList.join(", ")}) — ez megkérdezett bizonytalanság, nem „nem”.`
        : ""),
    source:
      "Grobman WA et al. Prediction of vaginal birth after cesarean delivery " +
      "in term gestations: a calculator without race and ethnicity. " +
      "Am J Obstet Gynecol 2021;225(6):664.e1-664.e7",
  };
}
