/**
 * SZŰRÉSI ESEDÉKESSÉG — típusok.
 *
 * A modul nem csak rögzít, hanem MEGMONDJA, MI ESEDÉKES: a beteg életkorából,
 * rizikófaktoraiból és a korábbi szűrések dátumából. Ez az a rész, ami a
 * dokumentációs rendszert gondozási rendszerré teszi.
 *
 * A szabály ADAT, nem kód — ugyanaz az elv, mint a panaszszótár feltételes
 * vörös zászlóinál: egy új szűrés felvételéhez nem szabad kódot írni.
 */
import type { I18n } from "../types.ts";
import type { Condition } from "../complaints/types.ts";

export interface ScreeningWindow {
  /** Mi szerint mérjük az ablakot: `ctx.ga` (hét) vagy `patient.age` (év). */
  by: string;
  /** Ettől esedékes, beleértve. */
  from: number;
  /** Eddig esedékes, beleértve. Ezen túl elmulasztott. */
  to: number;
}

/**
 * KILÉPÉSI FELTÉTEL — mert az ÉLETKOR ÖNMAGÁBAN NEM AZ.
 *
 * Egy életkorhoz kötött népegészségügyi szűrés felső határa nem azt jelenti,
 * hogy azon túl senkit nem kell szűrni. A méhnyakszűrés 65 éves korban akkor
 * és csak akkor fejezhető be, ha a megelőző évtizedben dokumentáltan megfelelő
 * negatív szűrési előzmény van, és nem volt CIN2+ az előzményben. Enélkül a
 * szűrés folytatandó — és éppen a soha nem szűrt idős nő a méhnyakrák-halálozás
 * legnagyobb kockázatú csoportja.
 *
 * Ha a szabály csak egy felső korhatárt ismer, akkor a megfelelően szűrt és a
 * soha nem szűrt 66 évest UGYANÚGY mutatja. Mivel az előbbi van többségben, a
 * jelzést mindenki megtanulja lenyomni — és vele az utóbbit is.
 *
 * A feltételeknek POZITÍVAN teljesülniük kell. A hiányzó előzmény nem
 * megfelelő előzmény: ilyenkor az állapot `exitUnknown`, nem `exited`.
 */
export interface ScreeningExit {
  /** Ezeknek mind teljesülniük kell a lezáráshoz. */
  requires: Condition[];
  /** Miért nem elég az életkor — ez jelenik meg a felületen. */
  why: I18n;
}

export interface ScreeningRule {
  id: string;
  label: I18n;
  /** Mely változók rögzítése számít elvégzésnek. Bármelyik elég, ha `anyOf`. */
  what: string[];
  anyOf?: boolean;
  /** Kire vonatkozik. Üres = mindenkire. A feltételek ÉS kapcsolatban állnak. */
  appliesWhen?: Condition[];
  /**
   * MIT JELENT A RÖGZÍTETT „NEM TUDOM” EBBEN A FELTÉTELBEN.
   *
   * Ha a beteg azt válaszolta, hogy nem emlékszik — volt-e terhességi
   * cukorbetegsége, kezelték-e pajzsmirigye miatt —, két olvasat lehetséges,
   * és a különbség klinikai:
   *
   *   `unknown`        — nem tudjuk eldönteni, hogy vonatkozik-e rá; a szűrés
   *                      nyitva marad. FAIL-SAFE, ez az alapértelmezés.
   *   `notApplicable`  — a feltétel nem teljesül, tehát nem vonatkozik rá.
   *
   * A választás SZŰRÉSENKÉNT más lehet, ezért a szabály mondja meg, nem a kód.
   * Alapértelmezésben a rendszer nem állítja, hogy egy szűrés nem érint
   * valakit, olyan válasz alapján, ami épp a tudás hiányát mondja ki.
   */
  unknownAnswer?: "unknown" | "notApplicable";
  window: ScreeningWindow;
  /**
   * Mikor zárható LE a szűrés az ablak felső határán túl. Életkori ablaknál
   * kötelező: az életkor önmagában nem kilépési feltétel.
   */
  exit?: ScreeningExit;
  /** Ismétlődő szűrésnél: ennyi idő után újra esedékes. ISO 8601 időtartam. */
  repeatEvery?: string | null;
  source: { cite: string; standard?: string | null; pmid?: string | null };
  documentation?: { definition?: I18n; pitfalls?: I18n; whyItMatters?: I18n };
}
