/**
 * Gyógyszertörzs — típusok.
 *
 * Nem `VariableDef`: a készítmény nem adat, hanem FOGALOM, amiről tudni kell
 * dolgokat. Ugyanaz a szerkezet, mint a panaszszótárnál — kereshető törzs,
 * amihez következmények tartoznak.
 *
 * Ami itt a következmény: a KAPU. Az anamnézisben bejelölt asztma a
 * szülőszobán megállítja a carboprost rendelését — az adat a felvételkor
 * kerül be, a döntés hetekkel később, más modulban, más felhasználótól
 * születik, és a rendszer mégis összeköti a kettőt.
 */
import type { I18n } from "../types.ts";
import type { Condition } from "../complaints/types.ts";

/**
 * Hale szoptatási kockázati kategória (Lactation Risk Category).
 * L1 a legbiztonságosabb, L5 az ellenjavallt.
 */
export type HaleLRC = "L1" | "L2" | "L3" | "L4" | "L5";

export interface Gate {
  /** Stabil azonosító — az indoklás ehhez a szabályhoz kötve rögzül. */
  id: string;
  /**
   * `absolute` = hard-stop: modális párbeszéd állítja meg a folyamatot.
   * `relative` = figyelmeztetés, ami nem állít meg, de látszik.
   */
  severity: "absolute" | "relative";
  /** A feltételek EGYÜTTES teljesülése zárja a kaput. */
  when: Condition[];
  /** Mit mondunk a klinikusnak — ez jelenik meg a párbeszédben. */
  message: I18n;
  /** Mi jöhet helyette. */
  alternatives?: string[];
  source: { cite: string; standard?: string | null; pmid?: string | null };
}

/**
 * Terhességi átalakítási javaslat: a szer terhességben nem folytatható,
 * de van, amire cserélhető.
 */
export interface Transform {
  to: string[];
  reason: I18n;
  source: { cite: string; standard?: string | null };
}

export interface Drug {
  /** `rx.` előtaggal, a hatóanyag nemzetközi neve alapján, pl. `rx.carboprost`. */
  id: string;
  label: I18n;
  /** Forgalmazott nevek és köznyelvi alakok — a keresés ezekre is illeszt. */
  synonyms?: string[];
  /** ATC-kód. A `17` modul kódolása erre épül. */
  atc?: string | null;
  /** Gyógyszertani csoport, emberi olvasatra. */
  class?: I18n;
  /** Mire használjuk — az antibiotikum-szelektáló ezekre keres. */
  indications?: string[];
  gates?: Gate[];
  /** Terhességben javasolt csere. */
  transformInPregnancy?: Transform | null;
  lactation?: {
    hale: HaleLRC;
    /** Relatív csecsemődózis (%). A 10% alatti általánosan elfogadott. */
    rid?: number | null;
    note?: I18n;
    source: { cite: string };
  } | null;
  /** Az adagolás egysége, ha a készítmény meghatározza. */
  doseUnit?: string | null;
  /**
   * Ha a készítmény egy DIÉTÁS PÓTLÁST fedez le: annak a mezőnek az
   * azonosítója (`diet.supp.*`).
   *
   * Ez a kapcsolat teszi ellenőrizhetővé, hogy a beteg ne kapjon kétszer
   * vasat: a diétás tájékoztató javasol, a gyógyszerelés rendel, és a kettő
   * összevetése enélkül csak emberi figyelmen múlna.
   */
  dietSupplement?: string | null;
  documentation?: { definition?: I18n; pitfalls?: I18n; whyItMatters?: I18n };
}
