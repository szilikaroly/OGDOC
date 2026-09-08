/**
 * OGDOC mag — típusok.
 *
 * Ez a réteg DOM-mentes és adatbázis-mentes: tiszta függvények, amelyek
 * paraméterként kapnak mindent. Node-ban tesztelhető, a felület és a tárolás
 * cserélhető alatta.  (ld. docs/01-architektura.md)
 */

export type Lang = "hu" | "en";
export type I18n = Partial<Record<Lang, string>>;

export type DataType =
  | "quantity" | "coded" | "coded-multi" | "bool" | "tristate"
  | "date" | "datetime" | "text" | "structured";

/** Honnan származik az érték. A precedencia ebben a sorrendben csökken. */
export type Provenance =
  | "clinician" | "device" | "imported" | "derived" | "prefilled" | "patient";

/** Mennyire megbízható. Nem azonos a provenance-szal. */
export type Confidence = "measured" | "reported" | "estimated" | "uncertain";

export const PROVENANCE_RANK: Record<Provenance, number> = {
  clinician: 6, device: 5, imported: 4, derived: 3, prefilled: 2, patient: 1,
};

export type Cardinality = "one" | "series" | "event";

/**
 * Külső osztályozási vagy referenciakészlet, amiből egy kódolt változó
 * értékkészlete származik — BNO, OENO, ATC, FIGO, ACMG/AMP, SPREC, FEOR.
 *
 * MINDEGYIK FRISSÜL. A FIGO cervix-stádiumrendszere 2018-ban, az endometriumé
 * 2023-ban változott; a BNO és az OENO évente. Ezért egy rögzített érték
 * mindig a RÖGZÍTÉSKORI verzió szerint értelmezendő — a jelenlegi szerint
 * értelmezve egy retrospektív adat csendben mást jelent.
 */
export interface CodeSystem {
  /** Stabil azonosító, pl. `bno-10-hu`, `figo-cervix`, `acmg-amp`. */
  id: string;
  /** A jelenleg érvényes verzió. Ez kerül az új értékekre. */
  version: string;
  /** Ki adja ki és honnan szerezhető be. */
  source?: string;
  /** Mikortól érvényes ez a verzió. */
  validFrom?: string;
}

/**
 * EGY KÓDRENDSZER EGY VERZIÓJA, a saját értékkészletével.
 *
 * A verziószám az értékre bélyegzése kevés, ha maga a KÓDLISTA is változott.
 * A FIGO endometrium-stádiumrendszere 2023-ban átalakult: vannak kódok,
 * amelyek megszűntek, és vannak, amelyek ugyanazzal a jelöléssel MÁST
 * jelentenek. Egy 2019-ben rögzített „IA" a mai lista szerint visszaolvasva
 * csendben más betegséget ír le.
 *
 * Ezért a változó nem egy értékkészletet tart, hanem verziónként egyet — és a
 * megjelenítés a RÖGZÍTÉSKORI verzió listájából olvassa ki a címkét.
 */
export interface ValueSetVersion {
  version: string;
  /** Mikortól érvényes. ISO dátum. */
  validFrom?: string;
  /** Meddig volt érvényes. Ha hiányzik: ez a jelenleg érvényes verzió. */
  validTo?: string | null;
  items: ValueSetItem[];
  /** Mi változott az előzőhöz képest — a visszaolvasáshoz ez a legfontosabb. */
  note?: I18n;
}

export interface Domain {
  min?: number | null;
  max?: number | null;
  step?: number | null;
  /** Ezen kívül: visszakérdezés, de elfogadható. */
  plausible?: [number | null, number | null] | null;
  /** Ezen túl: azonnali klinikai jelzés. */
  critical?: [number | null, number | null] | null;
  /**
   * KONTEXTUSFÜGGŐ KRITIKUS KÜSZÖB — mert a riasztás küszöbe is elmozdul.
   *
   * A referenciatartomány már tudta, hogy a terhesség megváltoztatja a
   * normálértéket. A KRITIKUS küszöb nem tudta: egyetlen számpár volt, és a
   * megítélés SORRENDBEN ELSŐKÉNT, kontextus nélkül nézte.
   *
   * Az éhomi vércukornál ez éles: terhességen kívül a kritikus határ 7,0
   * mmol/L, terhességben viszont a terhességi cukorbetegség diagnosztikus
   * küszöbe 5,1 (WHO 2013 / IADPSG). Egy 5,8-as érték terhesen DIAGNOSZTIKUS —
   * de a nem terhes 7,0-s küszöb alatt maradva nem lett belőle riasztás.
   *
   * A kulcsok ugyanazok, mint a referenciáé: `nonpregnant`, `pregnancy.t1`,
   * `pregnancy.t2`, `pregnancy.t3`. Ha egy kontextushoz nincs bejegyzés, a
   * `critical` marad az irányadó — de a MEGLÉTE nélkül a kontextusfüggés nem
   * feltételezhető.
   */
  criticalByContext?: Record<string, [number | null, number | null]> | null;
}

/**
 * REFERENCIATARTOMÁNY — kontextusonként külön.
 *
 * Ez a modul legkomolyabb klinikai hiánya volt: a terhesség megváltoztatja a
 * laborértékek normáltartományát, és a nem terhes tartomány szerint olvasva egy
 * terhes beteg lelete csendben mást jelent.
 *
 * Egy 110 × 10⁹/L thrombocytaszám a 3. trimeszterben a tartomány alsó széle
 * körül van; nem terhesen már kórosan alacsony. A kreatinin, a fT4 és a
 * fibrinogén ugyanígy viselkedik. Aki a nem terhes tartományt olvassa rá egy
 * terhes leletre, hol fölöslegesen riaszt, hol elenged egy valódi eltérést.
 */
export interface ReferenceRange {
  /**
   * Melyik helyzetben érvényes: `nonpregnant` · `pregnancy.t1` · `pregnancy.t2`
   * · `pregnancy.t3` · `postpartum`.
   */
  context: string;
  /** Alsó határ, beleértve. `null` = nyitott. */
  low?: number | null;
  /** Felső határ, beleértve. `null` = nyitott. */
  high?: number | null;
  note?: I18n;
}

/**
 * Egy változó teljes referenciakészlete a FORRÁSÁVAL együtt.
 *
 * A forrás megnevezése nem formalitás: több, egymástól kissé eltérő publikált
 * terhességi referenciakészlet létezik, és a rendszernek EGYET kell választania,
 * megnevezve — különben két lelet két különböző készlet szerint „normális".
 */
export interface ReferenceSet {
  source: { cite: string; doi?: string | null; pmid?: string | null };
  /**
   * Mennyire ellenőrzött. Ugyanaz a három szint, mint a megőrzési időknél:
   * `primary` = elsődleges forrásból visszaellenőrizve · `secondary` =
   * másodlagos összefoglalóból · `assumed` = feltételezett, ellenőrzésre vár.
   */
  verification: "primary" | "secondary" | "assumed";
  ranges: ReferenceRange[];
}

export interface ValueSetItem {
  code: string | number;
  label_hu?: string;
  label_en?: string;
  /** `unknown` = a „nem tudom" önálló érték, nem hiányzó adat. */
  flags?: Array<"redflag" | "unknown" | "notApplicable">;
  /**
   * ENNEK a konkrét válasznak a következménye: ezek a mezők nyílnak meg.
   *
   * Így ágazik szét a lánc: a „zörej" mértéket és típust kér, a „dörzszörej"
   * mást. A felület nem tudja, mit jelentenek — a kódlista mondja meg.
   */
  opens?: string[];
}

export interface ComputedDerivation {
  kind: "computed";
  /**
   * A kalkulátor azonosítója (`core/calc/defs.ts`), pl. `calc.bmi`.
   * A BEMENETEKET A KALKULÁTOR DEKLARÁLJA — itt nincsenek megismételve, hogy
   * egy fogalomhoz egy képlet és egy bemenetlista tartozzon.
   */
  calc: string;
  explain?: I18n;
}

export interface PrefillSource {
  /** `self.previousVisit` | egy másik variableId | `import.fhir` */
  source: string;
  policy: "carryForward" | "latest" | "implies" | "mostReliable";
  value?: unknown;
  /** ISO 8601 időtartam, pl. `P90D`. */
  maxAge?: string | null;
}

export interface PrefillDerivation {
  kind: "prefill";
  from: PrefillSource[];
  notify?: boolean;
}

/**
 * TÁBLAKERESÉS — a kalkulátor-réteg kiegészítése, nem megkerülése.
 *
 * A `computed` levezetés a kalkulátor-rétegen megy át, ami SZÁMOT vesz és
 * számot ad. Ez a szigorúság szándékos: egységesen kezelhető vele a hiányzó
 * bemenet és az ellenőrizetlen konstans kapuja.
 *
 * Van viszont egy levezetés-fajta, ami ebbe nem fér bele, és a 17. modul
 * hozta elő: az irányítószámból a település, a BNO-kódból a megnevezés, a
 * foglalkozásból a FEOR. Ezek KÓDBÓL SZÖVEGET adnak, és nincs bennük képlet
 * — a „számítás" egyetlen táblakeresés.
 *
 * Ezért külön fajta, nem kalkulátor: így a kalkulátor-réteg megmarad
 * számokra (és a kapui értelmesek maradnak), a táblakeresés pedig a SAJÁT
 * kapuját kapja meg — a tábla verzióját, dátumát és forrását.
 */
export interface LookupDerivation {
  kind: "lookup";
  /** A kódtábla azonosítója (`registry/kodok/tablak/`). */
  table: string;
  /** Melyik változó értéke a keresési kulcs. */
  from: string;
  /** A tábla melyik oszlopa a kimenet. Alapértelmezés: `label`. */
  column?: string;
  explain?: I18n;
}

export type Derivation = ComputedDerivation | PrefillDerivation | LookupDerivation;

/**
 * PÉLDÁNY-DIMENZIÓ: ugyanaz a mező több alanyra, egyszer definiálva.
 *
 * A panasz OPQRST-attribútumai (mikor kezdődött, milyen jellegű, hova sugárzik)
 * MINDEN panaszra ugyanazok. Ha panaszonként külön változót vennénk fel, egy
 * új panasz felvétele nyolc új változót kérne — vagyis kódot kellene írni egy
 * adat felvételéhez, ami ennek a rendszernek a legfőbb tiltása.
 *
 * Ehelyett a mező EGYSZER van definiálva, és minden értéke megmondja, melyik
 * PÉLDÁNYHOZ tartozik (`Value.scope`). Ugyanez a szerkezet szolgálja ki a
 * családfát (rokononként), a gyógyszerelést (készítményenként), a
 * daganatleírást (gócogként) és a biobank-mintákat (mintánként).
 */
export interface ScopeSpec {
  /** A dimenzió neve — a felület ez alapján csoportosít, pl. `complaint`. */
  dimension: string;
  /**
   * A NÉVSOR: az a változó, aminek az értéke felsorolja a létező példányokat
   * (`coded-multi`). Amíg egy példány nincs a névsorban, hozzá nem rögzíthető
   * részlet — különben a rekordban olyan panasz részletei állnának, amit
   * senki nem állított.
   */
  roster: string;
}

/**
 * A „click-open" minta: a lelet alapból CSUKVA van.
 *
 * Ez a válasz arra, hogy a strukturált bevitel gyorsabb legyen a gépelésnél.
 * A klinikus a normális leletet nem írja le — az az alapértelmezés. Csak azt
 * nyitja ki és tölti ki, ami KÓROS. Egy húsz tételes fizikális státusz így
 * két kattintás, nem húsz mező.
 *
 * A „nem vizsgálható" harmadik, ÖNÁLLÓ állapot: azt jelenti, hogy megpróbáltuk
 * és nem ment — ez más, mint a normális, és más, mint a kihagyott.
 */
export interface Finding {
  /** Eltérés nélkül. Ez az alapértelmezés; a mező csukva marad. */
  normal: string | number;
  /**
   * KORLÁTOZOTT vizsgálat — megvizsgáltuk, de nem teljes értékűen (pl. obesitas,
   * beteg együttműködése, körülmények). Ez NEM ugyanaz, mint a lehetetlen:
   * amit láttunk, azt rögzíteni lehet, ezért a részletező lánc megnyílik.
   */
  limited?: string | number;
  /** LEHETETLEN — meg sem lehetett vizsgálni. Részlet nincs, a lánc csukva marad. */
  impossible?: string | number;
  /**
   * A részletező LÁNC, sorrendben. Kóros vagy korlátozott leletnél lépésenként
   * nyílik: minden mező akkor jelenik meg, ha az előtte lévő ki van töltve.
   *
   * Példa: lokalizáció → jelleg → (a jelleg értékétől függően) mérték és típus.
   */
  cascade?: string[];
}
/**
 * A betegnek szóló, generált szöveg — ÉRTÉKTŐL FÜGGETLENÜL megjelenik.
 *
 * A normális lelet is információ a beteg számára: „a szívhangok vizsgálata
 * eltérést nem mutatott" többet mond, mint a csend. A szöveg a rögzített
 * adatból generálódik, nem a klinikus gépeli.
 */
export interface PatientText {
  normal?: I18n;
  abnormal?: I18n;
  limited?: I18n;
  impossible?: I18n;
}

/** Mikor esedékes egy javaslat. */
export type RecommendWhen =
  | "always" | "normal" | "abnormal" | "limited" | "impossible";

/**
 * Klinikusnak szóló javaslat, ami a leletből következik: beutalás, labor,
 * képalkotás, kontroll, diéta. Nem parancs — javaslat, ami a teendőlistába
 * kerül, és elutasítható.
 */
export interface Recommendation {
  when: RecommendWhen;
  /**
   * Ha megadott: csak erre a konkrét ÉRTÉKRE érvényes — nem az egész leletre.
   *
   * Enélkül minden hasi tapintás sebészt hívna, mert a javaslat a „kóros hasi
   * lelethez" tapadna, nem a défense-hoz. Logikai (`bool`) mezőnél a `true`
   * a szokásos kötés: a jel MEGLÉTE váltja ki a javaslatot, a hiánya nem.
   */
  code?: string | number | boolean;
  kind: "lab" | "imaging" | "referral" | "followup" | "diet" | "procedure" | "advice";
  what: I18n;
  /** Ahol értelmes: a javasolt vizsgálat vagy beavatkozás kódja. */
  targetCode?: string | null;
  urgency?: "routine" | "soon" | "urgent";
}

export interface VariableDef {
  id: string;
  version: number;
  status: "draft" | "seed-imported" | "active" | "deprecated" | "superseded";
  /** Ha kitöltött: ez a változó csak nézet (mirror). Az érték a primerben él. */
  aliasOf?: string | null;
  label: I18n;
  module: string;
  shownIn?: string[];
  datatype: DataType;
  unit?: string | null;
  /**
   * Ha az egység MÁSIK MEZŐBŐL jön: annak a kódolt mezőnek az azonosítója.
   *
   * A gyógyszeradag ilyen: „500" önmagában semmi, „500 mg" és „500 ml" két
   * különböző dolog, és hogy melyik, azt a készítmény dönti el, nem a
   * változódefiníció. A motor íráskor ebből a mezőből bélyegzi az egységet az
   * értékre — ugyanabban a példányban (`scope`), ha a mező példányosított.
   *
   * EGYSÉG NÉLKÜLI ADAG NEM RÖGZÍTHETŐ. Ez nem szigor: az egység nélküli
   * adagolási bejegyzés a gyógyszerelési hibák egyik klasszikus forrása.
   */
  unitFrom?: string | null;
  domain?: Domain | null;
  /**
   * Kontextusfüggő referenciatartomány. NEM azonos a `domain`-nel: a `domain` a
   * rögzíthetőség határa (mi az, ami egyáltalán beírható), a `reference` a
   * klinikai olvasat (mi az, ami normális ENNÉL a betegnél, MOST).
   */
  reference?: ReferenceSet | null;
  valueSet?: ValueSetItem[] | null;
  /**
   * Ha az értékkészlet KÜLSŐ osztályozásból származik, itt kell megnevezni.
   * A motor a rögzítéskori verziót az értékre bélyegzi, és jelzi, ha egy
   * korábbi érték már nem az aktuális verzió szerint készült.
   */
  codeSystem?: CodeSystem | null;
  /**
   * A kódlista KORÁBBI verziói, ha a lista maga is változott.
   *
   * A `valueSet` mindig a JELENLEG érvényes lista (új érték csak abból
   * vehető fel); ez a mező őrzi a régieket, hogy egy retrospektív érték a
   * saját verziója szerint legyen olvasható.
   */
  valueSetVersions?: ValueSetVersion[] | null;
  /**
   * Ha kitöltött: a mező PÉLDÁNYONKÉNT él, nem esetenként. Minden értéke
   * kötelezően hordoz `scope`-ot, és a scope-nak a névsorban kell szerepelnie.
   */
  scopedBy?: ScopeSpec | null;
  /** Click-open: alapból csukott lelet, ami csak kóros értéknél nyílik ki. */
  finding?: Finding | null;
  /** A betegnek szóló generált szöveg — értéktől függetlenül. */
  patientText?: PatientText | null;
  /** A leletből következő klinikai javaslatok. */
  recommends?: Recommendation[] | null;
  /**
   * A beteg tölti ki a betegfelvételkor, a beteg oldalán.
   *
   * Az így rögzült érték eredete `patient` — a precedencia-rangsor legalja —,
   * ezért egy klinikusi korrekció mindig felülírja. A klinikusnak MEG KELL
   * ERŐSÍTENIE, mielőtt döntés épül rá.
   */
  patientEntry?: boolean;
  cardinality?: Cardinality;
  /** Kontextusonkénti érvényességi ablak, ISO 8601 időtartam. */
  validity?: Record<string, string> | null;
  requiredWhen?: string | null;
  provenanceAllowed?: Provenance[];
  derivation?: Derivation | null;
  /** GENERÁLT — a build tölti a levezetési gráfból. Kézzel írni tilos. */
  consumers?: string[];
  documentation: {
    definition: I18n;
    howToMeasure?: I18n;
    pitfalls?: I18n;
    whyItMatters?: I18n;
  };
  standards?: {
    loinc?: string | null; snomed?: string | null;
    ichom?: string | null; eeszt?: string | null;
    fhir?: { resource: string; code?: string | null; path?: string | null } | null;
  };
  evidence?: Array<{ cite: string; doi?: string | null; pmid?: string | null }>;
  /** Beteg-azonosításra alkalmas. Az exportból és a lekérdezőből kimarad. */
  phi?: boolean;
  audit?: boolean;
}

/** Egy rögzített érték a burkával együtt. */
export interface Value<T = unknown> {
  value: T;
  unit?: string | null;
  /** Mikor VONATKOZIK rá — nem mikor írták be. ISO datetime. */
  t: string;
  recordedAt?: string;
  provenance: Provenance;
  confidence?: Confidence;
  /** prefilled/derived esetén: honnan. */
  sourceRef?: string | null;
  overridden?: boolean;
  /**
   * MELYIK PÉLDÁNYHOZ tartozik — csak `scopedBy` változónál. A dimenzió a
   * definícióban van megnevezve; itt a példány azonosítója áll (pl. annak a
   * panasznak a szótári kódja, amelyikre ez a jellemző vonatkozik).
   */
  scope?: string | null;
  /**
   * MELYIK osztályozási verzió szerint rögzült. A motor bélyegzi rá; kézzel
   * nem adható meg. Enélkül egy retrospektív kód évekkel később mást jelent.
   */
  codeSystemVersion?: string | null;
}

export interface CaseContext {
  /** `ambulatory` | `labour` | … — a validity ablakot választja ki. */
  encounter: string;
  pathway?: string;
  /** A „most" a számításokhoz, hogy a tesztek determinisztikusak legyenek. */
  now: string;
}

export interface CaseState {
  ctx: CaseContext;
  /** variableId → értékek (series esetén több). */
  values: Record<string, Value[]>;
  /** Korábbi vizit értékei — a prefill forrása. */
  previousVisit?: Record<string, Value[]>;
  errors: Array<{ where: string; message: string }>;
}

/* ─── Score-eredmény ─────────────────────────────────────────────────────
   A rendszer legfontosabb betegbiztonsági szabálya: ha egy bemenet hiányzik,
   a score NEM számol. Nem tesz be nullát, nem tesz be alapértelmezést.      */

export interface ScoreOk {
  status: "ok";
  value: number;
  unit?: string;
  interpretation?: string;
  /** A bemeneti pillanatkép, amiből számolt. */
  inputs: Record<string, unknown>;
}

export interface ScoreInsufficient {
  status: "insufficient";
  /** Mely változók hiányoznak vagy lejártak. */
  missing: string[];
  reason: string;
  inputs: Record<string, unknown>;
}

export type ScoreResult = ScoreOk | ScoreInsufficient;
