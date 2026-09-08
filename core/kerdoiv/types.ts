/**
 * Validált mérőeszközök — típusok.
 *
 * Két dolog különbözteti meg ezt a réteget minden mástól a rendszerben:
 *
 * 1. **A TÉTELSZÖVEGET ÉS A PONTOZÁST NEM MÓDOSÍTJUK.** Egy validált kérdőív
 *    attól validált, hogy pontosan úgy kérdez, ahogy a validációs vizsgálatban
 *    kérdezett. Az „egyszerűsített" vagy „modernizált" változat már nem az az
 *    eszköz, és a hozzá tartozó vágóértékek sem érvényesek rá.
 *
 * 2. **A SZÖVEG JOGILAG VÉDETT LEHET.** A validált magyar fordítás licencköteles.
 *    Ezért a definíció KÉTFÉLE szöveget ismer: a saját, leíró megnevezésünket
 *    (`label` — ez a miénk, szabadon használható) és a validált tételszöveget
 *    (`text` — ez licenc kérdése, és hiányozhat). Amíg a `text` nincs betöltve,
 *    a kérdőív NEM VEHETŐ FEL. Nem azért, mert a rendszer merev, hanem mert egy
 *    saját szavakkal feltett „EPDS" nem EPDS, és a vágóértéke nem érvényes rá.
 */
import type { I18n } from "../types.ts";

export interface QuestionOption {
  /** A tétel pontértéke. A pontozást nem alakítjuk át. */
  score: number;
  /** A mi leíró megnevezésünk — szabadon használható. */
  label: I18n;
  /** A VALIDÁLT válaszszöveg. Licenc kérdése; hiányozhat. */
  text?: I18n | null;
}

export interface Question {
  /** Sorszám a hivatalos eszközben. A sorrend a pontozás része. */
  index: number;
  id: string;
  /** A mi leíró megnevezésünk arról, mit mér a tétel. */
  label: I18n;
  /** A VALIDÁLT tételszöveg. Licenc kérdése; hiányozhat. */
  text?: I18n | null;
  options: QuestionOption[];
  /** A regiszterbeli változó, ahová a válasz kerül. */
  variable: string;
}

/** Egy pontsáv és a hozzá tartozó klinikai olvasat, kontextusonként. */
export interface ScoreBand {
  min?: number | null;
  max?: number | null;
  label: I18n;
  severity: "normal" | "watch" | "redflag";
}

export interface Instrument {
  id: string;
  label: I18n;
  /** Rövid, hivatalos rövidítés (EPDS, PHQ-9, MSPSS…). */
  abbrev: string;
  items: Question[];
  /** A kalkulátor, ami az összpontszámot adja. */
  calc: string;
  /**
   * Vágóértékek KONTEXTUSONKÉNT. Az EPDS antepartum és postnatalis
   * vágóértéke eltér — a kontextusból (`ctx.pathway`) dől el, melyik érvényes.
   */
  bands: Record<string, ScoreBand[]>;
  /**
   * KRITIKUS TÉTEL: az összpontszámtól FÜGGETLENÜL vörös zászlót ad.
   *
   * Ez nem küszöb, hanem kapu. Egy alacsony összpontszámú EPDS pozitív
   * 10. tétellel azonnali teendőt jelent — a rendszer ezt nem engedi
   * elnyomni az „összpontszám a normál tartományban" üzenettel.
   */
  criticalItem?: { id: string; minScore: number; message: I18n } | null;
  /** A validációs közlemény. Enélkül az eszköz nem eszköz, csak kérdéssor. */
  source: { cite: string; pmid?: string | null; doi?: string | null };
  /**
   * A MAGYAR FORDÍTÁS állapota:
   *   `validated`   — hivatalos, validált fordítás, saját közleménnyel
   *   `unvalidated` — létezik fordítás, de nem validált
   *   `none`        — nincs magyar változat betöltve
   */
  translation: {
    status: "validated" | "unvalidated" | "none";
    source?: { cite: string; pmid?: string | null } | null;
    note?: I18n;
  };
  /**
   * A TÉTELSZÖVEG jogi állapota:
   *   `loaded`      — a licencelt szöveg be van töltve, az eszköz felvehető
   *   `notLicensed` — a szöveg nincs meg; az eszköz NEM vehető fel
   *   `public`      — szabadon használható szöveg
   */
  itemText: { status: "loaded" | "notLicensed" | "public"; note?: I18n };
  documentation?: { whyItMatters?: I18n; pitfalls?: I18n };
}
