/**
 * Diétás protokoll — típusok.
 *
 * Ez a modul kevés változóból sok kimenetet termel: a bemenetek nagy része
 * máshol már megvan (BMI, gesztációs kor, cukorbetegség, bariátriai előzmény),
 * a modul feladata a JAVASLAT összeállítása és a betegtájékoztató legenerálása.
 *
 * A szabály itt is ADAT, nem kód: egy új állapotspecifikus protokoll felvétele
 * nem kíván fejlesztést.
 *
 * A modul saját nyitott kérdése eldőlt: a rendszer NEM ad konkrét étrendet — az
 * dietetikus feladata, és licencelt tápanyagadatbázist kívánna. Célértéket,
 * kerülendőket és konzíliumi javallatot ad.
 */
import type { I18n } from "../types.ts";
import type { Condition } from "../complaints/types.ts";

/** Egy célérték-tartomány. A tartomány szándékos: a diéta nem egy szám. */
export interface DietTarget {
  id: string;
  label: I18n;
  min?: number | null;
  max?: number | null;
  unit: string;
  note?: I18n;
}

export interface DietProtocol {
  id: string;
  label: I18n;
  /** A feltételek EGYÜTTES teljesülése aktiválja. Üres = mindig. */
  appliesWhen?: Condition[];
  /**
   * Mely szupplementációs mezők válnak KÖTELEZŐVÉ. A tájékoztató ezekből
   * állítja össze a pótlási listát, és a `06` modul rendelései ellen ellenőrzi
   * az átfedést — ne kapjon kétszer vasat.
   */
  supplements?: string[];
  targets?: DietTarget[];
  /** Amit kerülni kell, és miért. Indoklás nélküli tiltást nem tartunk be. */
  avoid?: Array<{ what: I18n; why: I18n }>;
  advice?: Array<{ what: I18n; why?: I18n }>;
  /** Konzíliumi vagy vizsgálati javallat, ami a teendőlistába kerül. */
  referral?: Array<{ what: I18n; urgency?: "routine" | "soon" | "urgent" }>;
  source: { cite: string; standard?: string | null; pmid?: string | null };
  documentation?: { whyItMatters?: I18n; pitfalls?: I18n };
}
