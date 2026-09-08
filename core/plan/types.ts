/**
 * ELLÁTÁS TERVEZÉS — típusok.
 *
 * A vizitrend és a konzílium-javallat ADAT, nem kód. Ugyanaz az elv, mint a
 * szűrési szabályoknál: egy új rizikófaktor felvételéhez nem szabad
 * fejleszteni.
 *
 * Két dolog viszont a TÍPUSBAN dől el, nem a szabályban:
 *
 *   1. A JOGSZABÁLYI ALAP PADLÓ. A módosítónak csak `adds` mezője van —
 *      vizitet ELVENNI nem lehet, mert nincs hová írni. Nem ellenőrzés
 *      kérdése: a szerkezet nem engedi.
 *
 *   2. A PROTOKOLLNAK VERZIÓJA VAN. A gondozási rend maga változik, nem csak
 *      a beteg adata. Verzió nélkül egy retrospektív vizitrendről nem dönthető
 *      el, hogy egy hiányzó vizit MULASZTÁS volt-e, vagy akkor még nem is
 *      létezett.
 */
import type { I18n } from "../types.ts";
import type { Condition } from "../complaints/types.ts";

/**
 * Mennyire ellenőrzött a tábla — ugyanaz a három szint, mint a laboratóriumi
 * referenciatartományoknál.
 *
 *   primary   — elsődleges forrásból (a jogszabály szövegéből) átvezetve
 *   secondary — másodlagos közlésből (szakmai összefoglaló, tankönyv)
 *   assumed   — a szokásos gyakorlat alapján felvéve, NEM ellenőrizve
 */
export type Verification = "primary" | "secondary" | "assumed";

export interface PlannedVisitDef {
  id: string;
  label: I18n;
  /** Ablak a `by` változó szerint, beleértve. */
  from: number;
  to: number;
  /** Mi történjen ezen a viziten — emberi olvasatra, nem kódolt teendő. */
  content?: string[];
}

export interface ScheduleModifier {
  id: string;
  label: I18n;
  /** MINDEN feltételnek teljesülnie kell. */
  when?: Condition[];
  /** BÁRMELYIK feltétel elég. `when`-nel együtt: (mind ÉS) ÉS (bármelyik). */
  whenAny?: Condition[];
  /**
   * Amit hozzáad. Nincs `removes` — és nem is lesz: a jogszabályi alap padló,
   * a rizikó csak sűríthet.
   */
  adds: PlannedVisitDef[];
  source: { cite: string; standard?: string | null };
  why: I18n;
}

export interface CareProtocol {
  id: string;
  label: I18n;
  /** A protokoll saját verziója — ez kerül a `plan.protocolVersion` mezőbe. */
  version: string;
  validFrom: string;
  validTo?: string | null;
  verification: Verification;
  /** Mi szerint mérjük az ablakokat (`ctx.ga`). */
  by: string;
  appliesWhen?: Condition[];
  source: { cite: string; standard?: string | null };
  base: PlannedVisitDef[];
  modifiers: ScheduleModifier[];
  documentation?: { definition?: I18n; pitfalls?: I18n; whyItMatters?: I18n };
}

export interface ConsultRule {
  id: string;
  /** A `plan.consult.requested` értékkészletének kódja — a validátor ellenőrzi. */
  specialty: string;
  label: I18n;
  urgency: "routine" | "urgent";
  when?: Condition[];
  whenAny?: Condition[];
  source: { cite: string; standard?: string | null };
  why: I18n;
}
