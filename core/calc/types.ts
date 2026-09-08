/**
 * Kalkulátor-réteg — típusok.
 *
 * Minden képlet, score és besorolás EGY helyen, gépi olvasható definícióként.
 * A fejlesztői dokumentáció ebből generálódik (`npm run docs:calc`), így nem
 * tud elcsúszni a kódtól.
 *
 * A réteg két betegbiztonsági szabályt kényszerít ki, egységesen, minden
 * kalkulátorra:
 *
 *   1. NINCS NÉMA HELYETTESÍTÉS — hiányzó vagy lejárt bemenetre a kalkulátor
 *      nem ad számot, hanem megmondja, mi hiányzik.
 *   2. NINCS ELLENŐRIZETLEN EGYÜTTHATÓ — amíg egy képlet konstansai nincsenek
 *      visszaellenőrizve az elsődleges közleménnyel, a kalkulátor kapu mögött
 *      áll és teljes bemenettel sem ad eredményt.
 *
 * A 2. szabály nem elméleti: a fullPIERS dokumentált együtthatóival a modell
 * klinikailag fordítva viselkedik (ld. `core/scores/fullpiers.ts`).
 */
import type { I18n } from "../types.ts";

/** Egy bemenet a kalkulátor szempontjából. */
export interface CalcInput {
  /** A regiszterbeli változó azonosítója. */
  id: string;
  /** Amit a képlet vár. Ha eltér a változó egységétől, a `convert` hidalja át. */
  unit?: string | null;
  /** Ha false: hiánya nem blokkol, a képlet kezeli. */
  required?: boolean;
  note?: I18n;
}

/** Egy eredménysáv — a szám mellé tartozó klinikai olvasat. */
export interface CalcBand {
  /** Alsó határ, beleértve. `null` = nyitott. */
  min?: number | null;
  /** Felső határ, NEM beleértve. `null` = nyitott. */
  max?: number | null;
  label: I18n;
  /** `redflag` = azonnali klinikai jelzés. */
  severity?: "normal" | "watch" | "redflag";
}

export type CalcKind =
  /** Zárt képlet, folytonos eredménnyel. */
  | "formula"
  /** Pontokból összeadott score. */
  | "score"
  /** Bemenetekből kategóriát ad, nem számot. */
  | "classification"
  /** Célsávot ad, nem egy értéket. */
  | "target";

/** Az elsődleges forrás, amivel a konstansokat össze kell vetni. */
export interface CalcSource {
  cite: string;
  doi?: string | null;
  pmid?: string | null;
  /** Ha a képlet szabvány vagy ajánlás, nem közlemény. */
  standard?: string | null;
}

export interface CalcDef {
  /** `calc.` előtaggal, pl. `calc.bmi`. */
  id: string;
  label: I18n;
  kind: CalcKind;
  /** Melyik modul tulajdonolja. */
  module: string;
  inputs: CalcInput[];
  output: {
    unit?: string | null;
    /** Ábrázolt tizedesjegyek. */
    digits?: number;
    bands?: CalcBand[];
    /**
     * A kimenet DÁTUM, epoch-ezredmásodpercben.
     *
     * A futtató minden bemenetet és kimenetet számként kezel — ez teszi
     * egységessé a kapukat és a hiánykezelést. Egy dátumot adó kalkulátor
     * eredménye viszont nyers számként ÉRTELMEZHETETLEN a leleten
     * („1793145600000 d"), ezért a megjelenítésnek tudnia kell, hogy dátumot
     * kapott.
     */
    isDate?: boolean;
  };
  /** Emberi olvasatra szánt képlet — a doksiba ez kerül. */
  formula: string;
  source: CalcSource;
  /**
   * TRUE csak akkor, ha a konstansokat valaki ténylegesen összevetette az
   * elsődleges forrással, és ezt a `verifiedNote` dokumentálja.
   */
  verified: boolean;
  verifiedNote?: string;
  /** Amit a felhasználónak tudnia kell az eredmény értelmezéséhez. */
  caveats?: I18n;
  /**
   * A tiszta számítás. Csak számokat kap, a sorrend az `inputs` sorrendje.
   * Hiányzó bemenetet NEM lát: a futtató már kiszűrte.
   * `null` = a bemenetek érvényesek, de az eredmény nem értelmezhető.
   */
  fn: (...args: number[]) => number | null;
  /** `classification` és `target` típusnál a szöveges eredmény. */
  interpret?: (value: number, args: number[]) => I18n | null;
}
