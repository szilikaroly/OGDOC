/**
 * Dokumentumtípusok — gépi olvasható definíció.
 *
 * A K20 döntés nyolc dokumentumtípust nevezett meg ellátási dokumentációként.
 * Ezek nem prózában élnek, hanem regiszterként — ugyanazon az elven, mint a
 * változók és a kalkulátorok:
 *
 *   · a kötelező tartalom REGISZTERBELI VÁLTOZÓKRA hivatkozik, ezért a build
 *     elszáll, ha egy dokumentum nem létező mezőt vár;
 *   · a lezárás előtt kiszámolható, mi hiányzik — nincs kitöltetlen sablonhely;
 *   · a megőrzési idő és az EESZT-beküldés a definícióból következik, nem
 *     kézzel írt eljárásból.
 */
import type { I18n } from "../types.ts";

/**
 * Megőrzési idő — a kalkulátorok mintájára KAPUZVA.
 *
 * A megőrzési idő jogszabályból jön, és a lejárta után törölni lehet. Egy
 * rosszul megadott idő **visszafordíthatatlan adatvesztést** okoz — ezért amíg
 * a `verified` nem igaz, a rendszer nem hajt végre automatikus törlést.
 */
/**
 * Az ellenőrzöttség HÁROM fokozata.
 *
 * A kétállapotú „ellenőrizve / nincs ellenőrizve" itt elveszítene egy valós
 * köztes állapotot: azt, amikor az időtartam több, egymástól független
 * másodlagos forrásból egybehangzóan megvan, de az elsődleges jogszabályszöveg
 * nem lett a kezünkben. Törölni CSAK elsődleges ellenőrzés után szabad.
 */
export type VerificationLevel =
  /** Senki nem nézett utána. */
  | "unverified"
  /** Egybehangzó másodlagos források (hatósági és intézményi dokumentumok). */
  | "secondary"
  /** Valaki a hatályos jogszabályszöveggel vetette össze. */
  | "primary";

/**
 * Megőrzési idő — a kalkulátorok mintájára KAPUZVA.
 *
 * A megőrzési idő jogszabályból jön, és a lejárta után törölni lehet. Egy
 * rosszul megadott idő **visszafordíthatatlan adatvesztést** okoz — ezért
 * automatikus törlés csak `primary` ellenőrzöttség mellett indul.
 */
export interface Retention {
  /** ISO 8601 időtartam, pl. `P30Y`. */
  period: string;
  /**
   * Mihez képest számoljuk.
   *
   * A `dataEntry` és a `creation` azért van itt, mert a jogszabályhely
   * IDÉZETE ezeket nevezi meg („30 év az adatfelvételtől”, „10 év a
   * készítéstől”), a beállítás viszont mind a tizennégynél `recordClose`. Az
   * eltérés a biztonságos irányba téved — a lezárás sosem korábbi —, de
   * kimondatlan, és a 10. lépés ellenőrzése megnevezi. Hogy elfogadható-e a
   * lezárás mint óvatos közelítés, jogi kérdés, nem kódé.
   */
  from: "recordClose" | "patientDeath" | "lastAccess" | "dataEntry" | "creation";
  /** A jogszabályhely, amiből ered. */
  source: string;
  verification: VerificationLevel;
  verifiedNote?: string;
  /**
   * A kötelező idő UTÁN mely célból tartható meg tovább az adat.
   * Az Eüak. a gyógykezelést és a tudományos kutatást nevesíti.
   */
  extendableFor?: string[];
  /**
   * A beteg kérése.
   *
   * A megsemmisítés előtt a betegnek módot kell adni arra, hogy a
   * dokumentációt kikérje. Amíg ilyen kérés függőben van, **nem törlünk**.
   */
  patientRequest?: {
    /** Törlés előtt értesítjük a beteget. */
    noticeBeforeDeletion: boolean;
    /** A beteg kérésére a megőrzés meghosszabbítható. */
    extendable: boolean;
  };
}

export interface EesztSubmission {
  /** Az EESZT dokumentumtípus megnevezése. */
  kind: string;
  /** Mikor megy ki. */
  when: "onSign" | "onClose" | "onIssue";
}

export interface DocumentDef {
  /** `doc.` előtaggal, pl. `doc.zarojelentes`. */
  id: string;
  label: I18n;
  /** Melyik modul állítja elő. */
  module: string;
  /**
   * Ellátási dokumentáció-e.
   *
   * `true` esetén: EESZT-beküldési kötelezettség, jogszabályi megőrzési idő,
   * és a kutatási hozzájárulás visszavonása NEM törli.
   */
  careRecord: boolean;
  /** Kötelező tartalom — regiszterbeli változó-azonosítók. */
  requires: string[];
  /** Ami kell, ha releváns, de hiánya nem blokkolja a lezárást. */
  optional?: string[];
  /**
   * Kapcsolódó dokumentumok, amiknek együtt kellene lenniük ezzel.
   *
   * SOHA NEM BLOKKOL, csak hiányként jelenik meg. A dokumentálás blokkolása
   * sürgős ellátásban ártalmas: egy sürgős császármetszésnél nincs előzetes
   * műtéti terv, és ettől a műtéti leírást nem szabad megtagadni. A hiány
   * látszik, a rögzítés megy tovább.
   */
  expects?: string[];
  signature: {
    /** A szerző aláírása mindig kell. */
    author: true;
    /** Ellenjegyzés is kell-e (pl. rezidens mellett szakorvos). */
    countersign?: boolean;
  };
  retention: Retention;
  eeszt?: EesztSubmission | null;
  /** A beteg is megkapja a példányát. */
  patientCopy?: boolean;
  documentation: { definition: I18n; pitfalls?: I18n };
}
