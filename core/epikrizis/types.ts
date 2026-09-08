/**
 * Epikrízis — típusok.
 *
 * EZ A MODUL NEM GYŰJT ADATOT. Kizárólag a már rögzítettből dolgozik: ha itt
 * új mezőt kellene kitölteni, az azt jelenti, hogy valamelyik korábbi modul
 * hiányos.
 *
 * Ebből következik a réteg egyetlen kemény szabálya: **minden állítás
 * visszavezethető.** Egy szegmens, aminek nincs `from` mezője, nem kerülhet a
 * szövegbe — nem stilisztikai elvárás, hanem az elfogadási kritérium:
 * a generált narratíva nem tartalmazhat olyan állítást, ami nincs a rögzített
 * adatban.
 */
import type { I18n } from "../types.ts";

export type SegmentKind =
  /** Rögzített érték. */
  | "fact"
  /** Számított pontszám vagy index. */
  | "score"
  /** Vörös zászló, kontraindikáció, kockázati besorolás. */
  | "risk"
  /** Teendő, javaslat. */
  | "recommendation"
  /** Kimeneteli adat. */
  | "outcome"
  /** Kódolás (BNO, OENO, HBCS). */
  | "coding"
  /**
   * INFORMÁCIÓHIÁNY. A modul legfontosabb tervezési döntése: a klinikus a meg
   * nem jelent kockázati blokkot könnyen negatív leletnek olvassa, ezért az
   * epikrízisben a hiány EXPLICIT, nem üresség.
   */
  | "gap";

export interface Segment {
  kind: SegmentKind;
  text: string;
  /**
   * MIBŐL KÖVETKEZIK: változóazonosítók, kalkulátorok, szabályok.
   * Üresen nem maradhat — a validátor és a teszt is ezt ellenőrzi.
   */
  from: string[];
  /** A bemeneti pillanatkép, ahol értelmes: mit látott az algoritmus. */
  inputs?: Record<string, unknown>;
  /** Bizonyíték, ahol van: közlemény, ajánlás. */
  evidence?: string | null;
  severity?: "normal" | "watch" | "redflag";
}

export interface EpicrisisSection {
  id: string;
  title: string;
  segments: Segment[];
}

export type EpicrisisStyle =
  | "clinical"    // klinikai narratíva — teljes dokumentáció
  | "sbar"        // átadás: Situation – Background – Assessment – Recommendation
  | "discharge"   // zárójelentés — a 14. modul bemenete
  | "nursing"     // ápolói összefoglaló
  | "consult";    // konzulensi kérés

export interface Epicrisis {
  style: EpicrisisStyle;
  /**
   * A dokumentum saját neve a felületen: **okoslelet**.
   *
   * Az örökölt „AI lelet" elnevezés félrevezető lett volna — nincs nyelvi
   * modell a folyamatban. Az „okoslelet" azt mondja meg, ami igaz: a lelet
   * magától áll össze a rögzített adatból, és tudja, mit nem tud. Nem
   * intelligenciát ígér, hanem összeszedettséget.
   */
  name: string;
  title: string;
  sections: EpicrisisSection[];
  /**
   * HOGYAN KÉSZÜLT. A modul nyitott kérdése ezzel dől el: nincs nyelvi modell
   * a folyamatban, a szöveg determinisztikus, szabályalapú generálás. Ezt a
   * felületen ki kell mondani — különben a felhasználó nagyobb (vagy kisebb)
   * megbízhatóságot tulajdonít neki, mint amennyi jár.
   */
  generation: {
    method: "rule-based";
    note: I18n;
    /** Mikor készült, és milyen állapotból. */
    at: string;
  };
}
