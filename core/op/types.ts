/**
 * Beavatkozási törzs — típusok.
 *
 * A `11` modul elfogadási kritériumának második fele: *„az elvégzett
 * beavatkozásból automatikusan képződik OENO-kódajánlás."*
 *
 * A kódajánlás JAVASLAT, nem kódolás. A kódoló szakember dönt, és a rendszer
 * feladata annyi, hogy ne kelljen a műtéti leírásból visszakeresni, mi
 * történt. Ez a különbség az „automatikus kódolás" és a „kódajánlás" között
 * nem szóhasználat: az elsőért a rendszer felel, a másodikért az ember.
 */
import type { I18n } from "../types.ts";

export interface Procedure {
  /** `proc.` előtaggal, pl. `proc.cs.lowTransverse`. */
  id: string;
  label: I18n;
  synonyms?: string[];
  /**
   * BEAVATKOZÁSKÓD JAVASLAT — és MELYIK TÖRZSBŐL.
   *
   * KÉT LISTA VAN, azonos alakú ötjegyű kódokkal: a fekvőbeteg beavatkozási
   * (műtéti) törzs (`mut`, 57410 = Császármetszés) és a járóbeteg-OENO
   * (`oeno`, 16600 = Hysteroscopia). A kód FORMÁJÁBÓL nem derül ki,
   * melyikbe tartozik — ezért a törzset meg kell nevezni, különben a
   * validáció a rossz listában keres, és némán nem talál semmit.
   *
   * A kódrendszer verziózott: a törzs évente változik, és egy retrospektív
   * beavatkozás a mai kódtábla szerint mást jelenthet. A verzió az értékre
   * bélyegződik.
   */
  oeno?: {
    /** `mut` = fekvőbeteg beavatkozási törzs · `oeno` = járóbeteg-OENO. */
    system: "mut" | "oeno";
    code: string;
    version: string;
    label?: I18n;
    /**
     * Ugyanennek a beavatkozásnak MÁS kódja, ha a körülmény más. A `when`
     * mondja meg, mikor — emberi olvasatra, mert a döntés emberé.
     */
    alternatives?: Array<{ code: string; label: string; when: I18n }>;
    /** Kódok, amelyek a fő kód MELLÉ kerülnek, nem helyette. */
    also?: Array<{ code: string; label: string; why: I18n }>;
  } | null;
  /**
   * AMIKOR A TÖRZSBEN NINCS GYŰJTŐKÓD.
   *
   * A fogóműtétnek és a műtéti hiszteroszkópiának nincs egyetlen kódja: a
   * törzs aszerint kódol, mi történt pontosan. Ilyenkor a rendszer NEM
   * választ helyettünk egy „elég jó" kódot — felsorolja, ami szóba jön, és
   * megmondja, miért nem dönt. Ez ugyanaz a kapu, mint a többértelmű
   * BNO-alaknál.
   */
  codeFamily?: {
    system: "mut" | "oeno";
    version: string;
    candidates: Array<{ code: string; label: string }>;
    why: I18n;
  };
  /** A műtéti leírás váza: mely lépéseket kérdezzük ehhez a beavatkozáshoz. */
  steps?: string[];
  /** Mely mezők válnak esedékessé (pl. császármetszésnél az uterotomia). */
  opens?: string[];
  /** Melyik sablonhoz tartozik: `cs` · `gyn` · `obs` · `other`. */
  template?: string;
  documentation?: { definition?: I18n; pitfalls?: I18n; whyItMatters?: I18n };
}
