/**
 * SZÜLÉSZETI SZEPSZIS — típusok.
 *
 * A modul a `10` SZÜLŐSZOBA-modulhoz tartozik, a többi szülészeti score
 * mellé. A SZÁMOT adó élettani szűrő a kalkulátor-rétegben van
 * (`calc.cmqcc.ob.sepsis.screen` → `score.cmqcc.ob.sepsis`), az omqSOFA
 * mellett, ugyanazokkal a kapukkal; ami itt él, az a szám helyett a FOLYAMAT:
 * a háromlépéses út és az órához kötött ellátási csomag.
 *
 * A modul a CMQCC Obstetric Sepsis Toolkit SZERKEZETÉT követi: háromlépéses
 * felismerés (élettani szűrés → gyanított góc → szervi elégtelenség), majd
 * órához kötött ellátási csomag.
 *
 * Három dolgot csinál másként, mint egy általános szepszisriasztó, és
 * mindhárom a rendszer meglévő szabályaiból következik:
 *
 *  1. NEM FUT ISMERETLEN TERHESSÉGI ÁLLAPOTNÁL. A terhesség eltolja mindazt,
 *     amit a szűrő mér. Nem terhes küszöbbel a terhes fals riasztást kap;
 *     terhes küszöbbel a nem terhes szepszise csúszik el. A rendszer nem esik
 *     vissza csendben egyik sávra sem.
 *
 *  2. A KÖZÉPSŐ LÉPÉS EMBERI DÖNTÉS. Azt, hogy van-e gyanított fertőzéses góc,
 *     nem lehet mérésből kikövetkeztetni. A modell itt megáll, és megkérdezi —
 *     ugyanaz a szerkezet, mint a PUL-modell melletti „szubjektív benyomás".
 *
 *  3. A RIASZTÁSNAK CÍMZETTJE ÉS HATÁRIDEJE VAN. A válaszút nélküli riasztást
 *     két hét alatt megtanulják elkattintani, és akkor az igazit is
 *     elkattintják. A „kiadva" és az „átvéve" két külön állapot.
 */
import type { I18n } from "../types.ts";

export type CritOp = "gt" | "gte" | "lt" | "lte" | "eq" | "notEq" | "outside";

export interface Criterion {
  id: string;
  var: string;
  label: I18n;
  op: CritOp;
  value?: number | string;
  low?: number;
  high?: number;
  unit?: string;
  /** Ez alatt az élettani állapot alatt a tétel NEM értékelhető (pl. vajúdás). */
  suspendDuring?: "labour";
  /**
   * IDŐBELI FELTÉTEL — ha a kritérium szövege „tartósan”-t mond, itt a gépi
   * alakja. Amíg üres, a kiértékelő egyetlen mérést néz, és a 9. lépés
   * ellenőrzése ezt megnevezi. Hogy hány mérés vagy hány perc a „tartós”, a
   * protokoll kérdése, nem a kódé.
   */
  sustained?: { count?: number; withinMinutes?: number };
  note?: I18n;
}

export interface CriterionSet {
  id: string;
  label: I18n;
  needed: number;
  neededNote?: I18n;
  criteria: Criterion[];
}

export interface BundleStep {
  id: string;
  label: I18n;
  withinMinutes: number;
  /** Ennek a lépésnek MEG KELL ELŐZNIE a megnevezettet. */
  before?: string;
  /** Csak akkor esedékes, ha a megnevezett lépés megtörtént. */
  conditionalOn?: string;
  note?: I18n;
}

export interface SepsisProtocol {
  id: string;
  label: I18n;
  source: { cite: string; standard?: string | null; retrieved?: string | null };
  verification: "primary" | "secondary" | "assumed";
  verificationNote?: I18n;
  /** Amíg igaz, a modul EGYETLEN riasztást sem ad ki. */
  blocksAlerting: boolean;
  requiresPregnancyState: boolean;
  requiresPregnancyStateNote?: I18n;
  postpartumWindowDays: number;
  postpartumNote?: I18n;
  screen: CriterionSet;
  organDysfunction: CriterionSet;
  bundle: { id: string; label: I18n; steps: BundleStep[] };
  /**
   * A RIASZTÁS ÁTVÉTELE — és a lánc, ahová eszkalál.
   *
   * A `tipus` a 15. lépés eszkalációs rendjére mutat
   * (`registry/riasztas/eszkalacio.json`). Enélkül a réteg tudta, hogy a ki
   * nem vett riasztásnak „egy szinttel feljebb” kell mennie, de azt nem, hogy
   * MI van feljebb: a próza megígérte az eszkalációt, a szerkezet nem tudta
   * hordozni.
   */
  escalation: {
    label: I18n; note?: I18n; acknowledgeWithinMinutes: number;
    /** A riasztástípus azonosítója az eszkalációs rendben. */
    tipus?: string;
  };
  /** Rokon kalkulátorok — és ahol ELTÉRNEK, ott az eltérés kimondva. */
  relatedCalculators?: Array<{ id: string; relation: string; conflict?: string }>;
}

/** Egy tétel megítélése. A `notAssessable` NEM azonos a `negative`-val. */
export type CritState = "positive" | "negative" | "missing" | "notAssessable";

export interface CritResult {
  id: string;
  var: string;
  label: string;
  state: CritState;
  value: unknown;
  why: string;
}

export interface SetResult {
  met: number;
  needed: number;
  /** Igaz, ha a küszöböt a MEGLÉVŐ adatokból elérte. */
  positive: boolean;
  /**
   * Igaz, ha a hiányzó tételek miatt a NEGATÍV eredmény sem mondható ki.
   * A rendszer legtöbbet ismételt szabálya: a hiányzó adat nem „nem".
   */
  indeterminate: boolean;
  results: CritResult[];
  why: string;
}
