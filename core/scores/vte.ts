/**
 * VTE-kockázat — a tényezők felsorolása, összesített szám nélkül.
 *
 * Ugyanaz a döntés, mint a postpartum pszichózisnál, más okból:
 *
 *   · ott azért nincs kombinált szám, mert a külön kohorszokból származó
 *     esélyhányadosok nem szorozhatók össze;
 *   · **itt a pontok ELVILEG összeadhatók** — a GTG 37a épp így készült —,
 *     csak a táblánk HIÁNYOS: húsznál több tételből hat van bekötve, és a
 *     pontértékek nincsenek visszaellenőrizve az ajánlással.
 *
 * A különbség számít. A postpartum pszichózisnál a szám elvi okból nem
 * születhet meg; itt csak addig, amíg a tábla nincs kész. Ezt ki kell mondani,
 * különben a két hiány ugyanolyannak látszik — pedig az egyik lezárt döntés,
 * a másik nyitott feladat.
 *
 * És a tét itt a legnagyobb: **a hiányzó thrombosis-profilaxis a megelőzhető
 * anyai halálozás vezető oka.** Egy hiányzó tétel — ikerterhesség, hosszú
 * utazás, dehidráció, infekció — a küszöb alatt tartja a beteget, aki fölötte
 * lenne.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { nemTudja, resolve } from "../derive/resolve.ts";

export interface VteFactor {
  id: string;
  variable: string;
  label: string;
  /** `true` · `false` · `"unknown"` — a hiányzó adat nem „nincs kockázat”. */
  present: boolean | "unknown";
  /** Az ajánlás szerinti súly, EMBERI OLVASATRA. Nem számolunk vele. */
  publishedWeight: string;
  positiveWhen: unknown;
}

export interface VteAssessment {
  factors: VteFactor[];
  /** Amit MÉG NEM KÉRDEZTÜNK MEG. Kérdezni kell. */
  missing: string[];
  /**
   * Amit MEGKÉRDEZTÜNK, ÉS NEM TUDJA. Újrakérdezni nem segít — de „nem”-mé
   * sem válhat: egy „nem emlékszem, volt-e thrombosisom” válaszból nem lehet
   * „nem volt thrombosisa”, mert akkor a profilaxis marad el.
   */
  nemTudja: string[];
  /** Amit a felsorolásból biztosan állítani lehet. */
  present: VteFactor[];
  /**
   * SZÁNDÉKOSAN NINCS összesített pontszám — de más okból, mint a postpartum
   * pszichózisnál. Ez a mező mondja meg, melyik ok érvényes.
   */
  noTotal: string;
  source: string;
}

const FACTORS: Array<Omit<VteFactor, "present" | "label"> & { label: string }> = [
  { id: "prevVte", variable: "hx.sys.vte", label: "Korábbi thromboembolia",
    publishedWeight: "4 pont — a legerősebb egyedi tényező", positiveWhen: "pos" },
  { id: "thrombophilia", variable: "hx.sys.thrombophilia", label: "Ismert thrombophilia",
    publishedWeight: "3 pont (nagy kockázatú típusnál több)", positiveWhen: "pos" },
  { id: "aps", variable: "hx.sys.aps", label: "Antifoszfolipid szindróma",
    publishedWeight: "3 pont", positiveWhen: "pos" },
  { id: "smoking", variable: "hx.life.smoking", label: "Dohányzás",
    publishedWeight: "1 pont", positiveWhen: "current" },
  { id: "cardiac", variable: "hx.sys.cardiac.congenital", label: "Szívbetegség",
    publishedWeight: "1 pont", positiveWhen: "pos" },
  { id: "multiple", variable: "ctx.multiple", label: "Ikerterhesség",
    publishedWeight: "1 pont", positiveWhen: "dcda" },
];

export function assessVte(
  reg: Registry, state: CaseState, _lang: Lang = "hu",
): VteAssessment {
  const factors: VteFactor[] = [];
  const missing: string[] = [];
  const nemTudjaList: string[] = [];

  for (const f of FACTORS) {
    const r = resolve(reg, state, f.variable);
    let present: boolean | "unknown";
    if (r.state !== "ok") { present = "unknown"; missing.push(f.variable); }
    else if (nemTudja(reg, f.variable, r.value)) {
      present = "unknown"; nemTudjaList.push(f.variable);
    } else present = r.value === f.positiveWhen;
    factors.push({ ...f, present });
  }

  // A testtömegindex és az életkor folytonos — külön kezelve.
  const bmi = resolve(reg, state, "anthro.bmi");
  if (bmi.state === "ok") {
    const v = Number(bmi.value);
    if (v >= 30) {
      factors.push({
        id: "bmi", variable: "anthro.bmi",
        label: v >= 40 ? "Testtömegindex ≥ 40" : "Testtömegindex ≥ 30",
        present: true,
        publishedWeight: v >= 40 ? "2 pont" : "1 pont",
        positiveWhen: true,
      });
    }
  } else missing.push("anthro.bmi");

  const age = resolve(reg, state, "patient.age");
  if (age.state === "ok") {
    if (Number(age.value) > 35) {
      factors.push({
        id: "age", variable: "patient.age", label: "Életkor > 35 év",
        present: true, publishedWeight: "1 pont", positiveWhen: true,
      });
    }
  } else missing.push("patient.age");

  return {
    factors, missing, nemTudja: nemTudjaList,
    present: factors.filter((f) => f.present === true),
    noTotal:
      "Összesített pontszám EGYELŐRE nem készül — de nem elvi okból, hanem " +
      "mert a tábla hiányos: az RCOG GTG 37a húsznál több tételt sorol, " +
      "ebből hat van bekötve, és a pontértékek nincsenek visszaellenőrizve " +
      "az ajánlással. Ez NYITOTT FELADAT, nem lezárt döntés — szemben a " +
      "postpartum pszichózis kockázatával, ahol a kombinált szám elvi okból " +
      "nem születhet meg. " +
      (missing.length
        ? `Ezen felül ${missing.length} tényezőhöz nincs adat ` +
          `(${missing.join(", ")}) — a hiányzó adat nem „nincs kockázat”. `
        : "") +
      (nemTudjaList.length
        ? `${nemTudjaList.length} tételre a beteg azt válaszolta, hogy nem tudja ` +
          `(${nemTudjaList.join(", ")}) — ez MEGKÉRDEZETT bizonytalanság, nem ` +
          `hiányzó kérdés, és nem „nem”.`
        : ""),
    source:
      "RCOG Green-top Guideline No. 37a: Reducing the Risk of Venous " +
      "Thromboembolism during Pregnancy and the Puerperium (2015)",
  };
}
