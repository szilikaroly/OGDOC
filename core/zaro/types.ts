/**
 * ZÁRÓJELENTÉS — típusok.
 *
 * A modul NEM GYŰJT ADATOT. Ha itt bármit be kell írni, az hiba a korábbi
 * modulokban — az egyetlen kivétel maga a DOKUMENTUM (aláírás, ellenjegyzés,
 * az elbocsátás módja), ami sehol máshol nem keletkezik.
 *
 * Ebből következik a két szabály, ami a szerkezetben él:
 *
 *   1. NINCS KITÖLTETLEN SABLONHELY. Egy blokk vagy tartalmat hordoz, vagy
 *      KIMONDJA, hogy nincs benne semmi és miért. Üresen nem maradhat, mert az
 *      üres rubrikát az olvasó negatív leletnek olvassa.
 *
 *   2. A „NEM VONATKOZIK RÁ" CSAK RÖGZÍTETT TÉNYBŐL JÖHET. Az adat hiánya
 *      soha nem elég hozzá — ugyanaz a szabály, mint a szűrési
 *      esedékességnél.
 */
import type { I18n } from "../types.ts";
import type { Segment } from "../epikrizis/types.ts";

export type BlockState =
  /** Van benne tartalom. */
  | "filled"
  /** Nincs, és ez HIÁNY — a dokumentumon kimondva jelenik meg. */
  | "missing"
  /** Nincs, és ez rendben van — de csak RÖGZÍTETT TÉNY alapján. */
  | "notApplicable";

export interface DischargeBlock {
  id: string;
  title: string;
  state: BlockState;
  segments: Segment[];
  /** Miért üres — `missing` és `notApplicable` esetén kötelező. */
  note?: string;
  /** Beteg-azonosító tartalom: a kutatási exportból kimarad. */
  phi?: boolean;
}

/**
 * A dokumentum JOGI státusza — a modul nyitott kérdésének a helye.
 *
 * A generálás minősége és a jogi státusz KÉT KÜLÖN DOLOG. Egy hibátlan
 * tartalmú dokumentum is lehet nem hiteles, és ezt nem elég a felületen
 * kimondani: a papír kimegy a rendszerből, a képernyőn megjelenő
 * figyelmeztetés viszont ott marad.
 */
export interface Authenticity {
  status: "draft" | "authentic";
  /** Kinyomtatható-e HITELES egészségügyi dokumentumként. */
  canIssue: boolean;
  /** Mi hiányzik hozzá. */
  missing: string[];
  /**
   * Ami a NYOMTATOTT dokumentumon is megjelenik. Nem opcionális, és nem a
   * felület dolga.
   */
  notice: string;
}

export interface DischargeSummary {
  documentId: string;
  title: string;
  blocks: DischargeBlock[];
  authenticity: Authenticity;
  generation: { method: "rule-based"; note: I18n; at: string };
}
