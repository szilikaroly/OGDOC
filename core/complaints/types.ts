/**
 * Panaszszótár — típusok.
 *
 * A panasz nem változó, hanem SZÓTÁRI TÉTEL: a beteg saját szavaiból ide
 * találunk el, és innen indul minden következmény. Ezért nem a
 * `VariableDef`-ek közé kerül, hanem külön törzsbe — de ugyanazzal az
 * ösztönnel: minden tétel mellett ott van, mit nyit meg, mit kérdez tovább,
 * és mikor vörös zászló.
 *
 * A SZABAD SZÖVEG NEM TŰNIK EL. A kódolt tétel a gépnek szól (kereshető,
 * exportálható, szabályt indít), a beteg szó szerinti megfogalmazása
 * (`compl.verbatim`) az orvosnak. Egyik sem helyettesíti a másikat.
 */
import type { I18n } from "../types.ts";

/**
 * Kontextusfeltétel — SZERKEZET, nem kifejezés.
 *
 * A terv eredetileg `"ctx.pregnant && ga < 12"` alakú kifejezést írt le. Egy
 * ilyen sztringet csak kiértékeléssel (`eval`) lehetne futtatni: az a
 * regiszterfájlba tett tetszőleges kódot jelentene, egy olyan rendszerben,
 * ami betegadatot kezel. Ezért a feltétel adatszerkezet, amit a motor
 * értelmez — és amiben a hivatkozott változó LÉTEZÉSE fordításkor ellenőrizhető.
 */
export interface Condition {
  /** A hivatkozott változó azonosítója — a regiszterben léteznie kell. */
  var: string;
  op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in";
  value: unknown;
}

export interface ComplaintTerm {
  /** `compl.` előtaggal, pl. `compl.pain.abdomen.rlq`. */
  id: string;
  label: I18n;
  /**
   * LAIKUS megfogalmazások és szakmai szinonimák. Ez dönti el, hogy a beteg
   * szavaiból („szúr a hasam alul jobb oldalt") megtaláljuk-e a tételt —
   * vagyis ez a modul tényleges értéke, nem a kódlista.
   */
  synonyms: string[];
  /** Testtájék, a felület térképes szűréséhez. */
  bodySite?: string | null;
  /** MINDIG vörös zászló, kontextustól függetlenül. */
  redflag?: boolean;
  /**
   * FELTÉTELES vörös zászló: a felsorolt feltételek EGYÜTTES teljesülésekor.
   * A jobb alhasi fájdalom önmagában nem vörös zászló; 12. hét előtti
   * terhességben viszont méhen kívüli terhesség gyanúja.
   */
  redflagWhen?: Condition[] | null;
  /** Mely mezők válnak esedékessé, ha a panasz aktív. */
  opens?: string[];
  /** Mely további kérdéseket kell feltenni ehhez a panaszhoz. */
  asks?: string[];
  snomed?: string | null;
  /** Amire gondolni kell — nem diagnózis, hanem emlékeztető. */
  differential?: string[];
  /** Melyik ellátási útvonalon jelenjen meg. Üres = mindegyiken. */
  pathways?: string[];
  documentation?: { definition?: I18n; pitfalls?: I18n };
}
