/**
 * FELÜLETTÉRKÉP — a meglévő rendszer felülete, lefedettségként.
 *
 * Ez nem képernyőkép-katalógus. Egy működő szülészeti rendszer menüfája és
 * adatlapjai azt mondják meg, MIT KELL TUDNI — a szakma által kitaposott
 * szerkezetben, tizenöt év használat után. A térkép ebből két dolgot csinál:
 *
 *   1. LEFEDETTSÉGET. Melyik szakaszhoz van már változónk, és melyikhez nincs.
 *      Egy „~4035 tervezett változó" szám nem terv; egy szakaszonkénti hiánylista
 *      az.
 *   2. FIGYELMEZTETÉST. Ami a régi felületen egy mező, az nálunk nem feltétlenül
 *      lehet az. Az etnikai csoport GDPR 9. cikk szerinti KÜLÖNLEGES adat; a
 *      „Partner nem érintett" jelölőnégyzet elnyeli a harmadik állapotot; a
 *      foglalkozás szabad szövegként használhatatlan.
 *
 * A LEKÉPEZÉS EMBERI DÖNTÉS. A mezőnév és a változóazonosító párosítását nem
 * karakterlánc-hasonlóság dönti el: a „Település" a mi rendszerünkben LEVEZETETT
 * mező, nem beírandó, és ezt csak az tudja, aki mindkettőt érti.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { Registry } from "../registry.ts";

export interface MenuNode {
  label: string;
  /** A szülő menüpontok címkéi, gyökértől lefelé. */
  path: string[];
  /** Melyik OGDOC-modulhoz tartozik. `null`, ha nincs modul rá. */
  module: number | null;
}

export interface FormField {
  label: string;
  /** A megfelelő regiszterbeli változó, vagy `null`, ha még nincs. */
  variable: string | null;
  phi?: boolean;
  required?: boolean;
  /** A mi rendszerünkben LEVEZETETT — a felületen nem beírandó. */
  derived?: boolean;
  /** GDPR 9. cikk szerinti különleges adat (`ethnicity`, `health`, …). */
  special?: string;
  billing?: boolean;
  freeText?: boolean;
  /** Eseménysorozat vagy példányonkénti adat — nem egyetlen mező. */
  scoped?: boolean;
  /** Ugyanaz az adat, más mértékegységben, PÁRHUZAMOS mezőként. */
  unitDuplicate?: boolean;
  /** Egyetlen jelölőnégyzet több állítás helyett („eseménytelen anamnézis"). */
  allNegative?: boolean;
  /** Interfészből (HL7 ADT/ORM) érkezik, nem kézzel töltendő. */
  interfaceFilled?: boolean;
  /** A beteg biztonságát veszélyeztetheti, ha megjelenik egy dokumentumon. */
  safetySensitive?: boolean;
  /** A generált kimenetet KAPUZZA (pl. a magzat nemének közlése). */
  gatesOutput?: boolean;
  /** A számítás helyessége a reagens tételszámán múlik (MoM-mediánsor). */
  lotCritical?: boolean;
  /** Az eredményt érvénytelenítő vagy átértelmező jelölés. */
  invalidates?: boolean;
  /** A MÉRÉS körülménye (készülék, fej, behatolás útja) — nem leltári adat. */
  measurementContext?: boolean;
  /** Publikált modell futtatásához kötött mező. */
  modelBacked?: boolean;
  /** Kontraindikáció-kapu: a kezelés feltétele, nem adminisztratív pipa. */
  contraindication?: boolean;
  /** Megnevezi, MELYIK mért érték megy be a számításba. */
  inputSelector?: boolean;
  /** A kockázatszámításhoz tartozó ÉLETKOR, ami nem a várandós mai kora. */
  ageForRisk?: boolean;
  /** „Csak második próbálkozásra volt megítélhető" — tételenkénti korlátozottság. */
  secondAttempt?: boolean;
  /** Kutatási célú adatgyűjtés — beleegyezéshez kötött. */
  research?: boolean;
  /** A SZÁMÍTÁS futtatója akkreditációhoz kötött (FMF engedélyszám). */
  operatorGate?: boolean;
  /** A SZÁMÍTÁS futtatása beleegyezéshez kötött, nem csak az adat rögzítése. */
  consentGate?: boolean;
  /** Melyik kockázati csatorna: `uh` · `bc` · `combined`. */
  riskChannel?: "uh" | "bc" | "combined";
  /** Kinek a mérése — ugyanaz a vizsgálat két alanyra. */
  subject?: "maternal" | "fetal";
  /** Kategória, nem szám — és a kategória súlyos (hiányzó/reverz áramlás). */
  criticalCategory?: boolean;
  /** Ugyanaz az adat máshol is szerepel — nálunk egy változó, több felületi hely. */
  crossFilled?: boolean;
  /** A legördülő értékkészlete gyaníthatóan hibás (más mezőből származik). */
  valueSetSuspect?: boolean;
  /** A mező CÍMKÉJE gyaníthatóan más lapról származik. */
  labelSuspect?: boolean;
  /** A beteg ELUTASÍTOTTA a vizsgálatot — dokumentált döntés, nem hiány. */
  refusalState?: boolean;
  /** A modell határértékének (0% / 100%) értelmezése a mező mellett. */
  boundaryNote?: boolean;
  /** A szerv MŰTÉTI ELŐZMÉNY miatt hiányzik — hatodik szervállapot. */
  surgicallyAbsent?: boolean;
  /** A referencia a KONTEXTUSTÓL függ (menopausa, terhesség). */
  contextualThreshold?: boolean;
  /** Publikált, VERZIÓZOTT osztályozás (FIGO, IOTA, IETA). */
  versionedClassification?: boolean;
  /** Példányok KÖZÖTTI levezetés (bal + jobb petefészek). */
  crossInstance?: boolean;
  /** Melyik publikáció markerkészletéhez tartozik. */
  markerSet?: string;
  /** Tételszám szerint nyomon követendő (vérkészítmény). */
  traceable?: boolean;
  /** Visszafordíthatatlan beavatkozás — kapu ELŐTTE, nem utólag. */
  irreversible?: boolean;
  /** Epizódok KÖZÖTTI hivatkozás (a terhesség előtti beavatkozás). */
  crossEpisode?: boolean;
  /** Háromállapotú BIZTONSÁGI előellenőrzés: igen · nem · nem ellenőrizve. */
  safetyPrecheck?: boolean;
  /** „Megrendelve” és „Eredmény”: a kintlévő lelet nem üres mező. */
  orderTracking?: boolean;
  /** Bizonytalan klinikai jelentőségű eredmény (VUS) — harmadik kategória. */
  uncertainSignificance?: boolean;
  /** EGY SORBAN két alany értéke (magzati és anyai glükóz). */
  pairedSubjects?: boolean;
  /** Ugyanaz a mérés egy beavatkozás ELŐTT és UTÁN. */
  prePost?: boolean;
  /** SZŰRŐVIZSGÁLAT: az „alacsony kockázat” nem negatív lelet. */
  screeningOnly?: boolean;
  /** A „nincs eredmény” önálló állapot, nem üres és nem negatív. */
  noResultState?: boolean;
  /** Magzati címke alatt megjelenő ANYAI lelet (mellékelet). */
  incidentalMaternal?: boolean;
  /** Az érték a megnevezett VIZSGÁLATHOZ/platformhoz tartozik. */
  assayBound?: boolean;
  /** Az analit referenciája a MINTÁHOZ tartozik, nem az analithoz. */
  specimenBound?: boolean;
  /** Ugyanaz az analit két néven, két mezőben (AST és GOT). */
  synonymDuplicate?: boolean;
  /** A mező ALANYA eldönthetetlen (anyai lapon magzati panel). */
  subjectAmbiguous?: boolean;
  /** Különleges adat védtelen csatornán (e-mail PDF-ben). */
  insecureChannel?: boolean;
  /** Az egység nem az, amiben a döntési határ ki van mondva. */
  unitMismatch?: boolean;
  /** A prenatális állítás szembesítése a megszületett igazsággal. */
  outcomeAudit?: boolean;
  /** MEGKÍSÉRELVE ÉS NEM SIKERÜLT, indoklással — harmadik állapot. */
  attemptFailed?: boolean;
  /** A MINTA ALKALMASSÁGA: elégtelen mintán a „negatív” nem negatív. */
  sampleAdequacy?: boolean;
  /** Az érték természete szerint TARTOMÁNY, nem egyetlen szám. */
  rangeValued?: boolean;
  /** Kézzel beírt VÉGÖSSZEG a bejelölt összetevők mellett. */
  handTotal?: boolean;
  note?: string;
}

export interface FormMap {
  id: string;
  label: I18n;
  menuPath: string[];
  note?: I18n;
  fields: FormField[];
}

export interface UiMap {
  id: string;
  label: I18n;
  source: { cite: string };
  coverage: "full" | "partial";
  coverageNote?: I18n;
  menu: MenuNode[];
  forms: FormMap[];
  /** Modulszám → a regiszterbeli `module` mező értékei. */
  modulePrefixes: Record<string, string[]>;
  modulePrefixNote?: I18n;
}

export function loadUiMap(path: string): UiMap {
  return JSON.parse(readFileSync(path, "utf8")) as UiMap;
}

/* ── LEFEDETTSÉG ────────────────────────────────────────────────────── */

export interface ModuleCoverage {
  module: number | null;
  sections: string[];
  /** Van-e a modulhoz kidolgozott változókészlet a regiszterben. */
  variables: number;
  why: string;
}

/**
 * Menüszakaszok modulonként, a hozzájuk tartozó változószámmal.
 *
 * A modulszám → `module` mező leképezés a térképben van, és MAGÁBÓL A
 * REGISZTERBŐL készült: a változófájlok neve hordozza a modulszámot. Egy
 * kézzel karbantartott lista fél éven belül hazudna — ugyanaz a szabály, mint
 * a levezetési gráfnál.
 */
export function moduleCoverage(map: UiMap, reg: Registry): ModuleCoverage[] {
  const byModule = new Map<number | null, string[]>();
  for (const m of map.menu) {
    const key = m.module ?? null;
    const label = m.path.length ? `${m.path.join(" › ")} › ${m.label}` : m.label;
    byModule.set(key, [...(byModule.get(key) ?? []), label]);
  }
  const all = reg.all();
  const out: ModuleCoverage[] = [];
  for (const [module, sections] of [...byModule.entries()]
      .sort((a, b) => (a[0] ?? 999) - (b[0] ?? 999))) {
    const prefixes = module != null ? map.modulePrefixes[String(module)] ?? [] : [];
    const n = prefixes.length
      ? all.filter((d) => prefixes.includes(d.module)).length
      : 0;
    out.push({
      module, sections, variables: n,
      why: module == null
        ? "Ez a szakasz egyik OGDOC-modulhoz sincs hozzárendelve."
        : !prefixes.length
          ? `A ${module}. modulnak MÉG EGYETLEN változófájlja sincs, ezért a ` +
            `felületi szakaszaihoz nem tartozik adat.`
          : n === 0
            ? `A ${module}. modulhoz ${sections.length} felületi szakasz tartozik, ` +
              `és EGYETLEN változó sincs felvéve.`
            : `A ${module}. modulhoz ${sections.length} felületi szakasz és ` +
              `${n} változó tartozik.`,
    });
  }
  return out;
}

export interface FieldAudit {
  form: string;
  field: string;
  /**
   * MELYIK SZABÁLY szólalt meg — a `FormField` zászlajának neve.
   *
   * Nem dísz: a 3. lépés döntéseit ehhez kötjük. Ha a szabályt a `why`
   * szövegéből próbálnánk visszafejteni, egy átfogalmazás némán elszakítaná
   * az aláírt döntést attól, amit aláírtak.
   */
  rule: string;
  status:
    | "mapped" | "gap" | "derived" | "refused" | "interface" | "gate" | "context";
  why: string;
}

/**
 * Mezőnkénti mérleg — és ami fontosabb: ami NEM kerülhet át változatlanul.
 *
 * A `refused` nem hiba és nem hiány: DÖNTÉS. Egy régi felület mezője akkor sem
 * másolható át, ha praktikus, amikor a mi szabályainkba ütközik.
 */
export function auditFields(map: UiMap, reg: Registry): FieldAudit[] {
  const out: FieldAudit[] = [];
  for (const form of map.forms) {
    for (const f of form.fields) {
      if (f.special) {
        out.push({
          form: form.id, rule: "special", field: f.label, status: "refused",
          why:
            `KÜLÖNLEGES ADAT (${f.special}): GDPR 9. cikk. Csak kifejezett, ` +
            `célhoz kötött hozzájárulással rögzíthető, és SOHA nem folyhat be ` +
            `csendben egy számításba. A rendszer az etnikumot a személyre ` +
            `szabott növekedési görbéből szándékosan kihagyta.`,
        });
        continue;
      }
      if (f.safetySensitive) {
        out.push({
          form: form.id, rule: "safetySensitive", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "BIZTONSÁGI KOCKÁZAT: ez az adat nem vehető át a régi felület " +
            "szabályaival. Nem elég `phi`-nek jelölni — külön láthatósági " +
            "szabály kell rá, mert egy nyomtatott dokumentumon megjelenve " +
            "veszélyeztetheti a beteget.",
        });
        continue;
      }
      if (f.unitDuplicate) {
        out.push({
          form: form.id, rule: "unitDuplicate", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "PÁRHUZAMOS MÉRTÉKEGYSÉG: a rendszerben az egység az ÉRTÉKHEZ " +
            "tartozik, és a megjelenítés váltja át. Több párhuzamos mező " +
            "többféle igazságot tud tárolni ugyanarról.",
        });
        continue;
      }
      if (f.allNegative) {
        out.push({
          form: form.id, rule: "allNegative", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "AZ „ÖSSZES NEGATÍV” NEM ÍRJA FELÜL A „NEM TUDOM”-OT. Egy " +
            "jelölőnégyzet nem állíthat negatívumot olyan tételekről, " +
            "amelyekről külön-külön nem nyilatkoztak.",
        });
        continue;
      }
      if (f.interfaceFilled) {
        out.push({
          form: form.id, rule: "interfaceFilled", field: f.label, status: "interface",
          why:
            (f.note ? f.note + " " : "") +
            "INTERFÉSZBŐL érkezik (HL7 v2 ADT/ORM), nem kézzel töltendő. Egy " +
            "interfészmezőt kézzel felülírni némán szétcsúsztatja a két rendszert.",
        });
        continue;
      }
      if (f.lotCritical) {
        out.push({
          form: form.id, rule: "lotCritical", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "KAPU A SZÁMÍTÁSON: a MoM a reagenskészlet mediánsorához tartozik. " +
            "A gyártó és a tételszám nélkül a MoM nem ellenőrizhető " +
            "visszamenőleg — ez ugyanaz a szerkezet, mint a `calc.verified`.",
        });
        continue;
      }
      if (f.invalidates) {
        out.push({
          form: form.id, rule: "invalidates", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "KAPU AZ EREDMÉNYEN: ez a jelölés megváltoztatja vagy " +
            "érvényteleníti az eredmény jelentését. Címkeként rögzítve " +
            "látszik, de nem véd — kapuként kell viselkednie.",
        });
        continue;
      }
      if (f.operatorGate) {
        out.push({
          form: form.id, rule: "operatorGate", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "KOMPETENCIA-KAPU: a számítást csak akkreditált vizsgáló " +
            "futtathatja. A `calc.verified` a KÉPLETRŐL szól, ez a VIZSGÁLÓRÓL " +
            "— és egy helyes képlet rossz méréssel ugyanúgy rossz számot ad.",
        });
        continue;
      }
      if (f.consentGate) {
        out.push({
          form: form.id, rule: "consentGate", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "BELEEGYEZÉS-KAPU A SZÁMÍTÁSON: a rendszer kapui eddig ADAT " +
            "rögzítését kapuzták; ez magát a SZÁMÍTÁST kapuzza. Tanácsadás és " +
            "beleegyezés nélkül a szűrési kockázat nem számolható ki és nem " +
            "közölhető.",
        });
        continue;
      }
      if (f.surgicallyAbsent) {
        out.push({
          form: form.id, rule: "surgicallyAbsent", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "MŰTÉTI ELŐZMÉNY MINT SZERVÁLLAPOT: nem lelet és nem technikai " +
            "korlát. A rendszerben nem ezen a lapon keletkezik — a " +
            "beavatkozási adatból vezetendő le, különben a lelet és az " +
            "előzmény ellentmondhat egymásnak.",
        });
        continue;
      }
      if (f.versionedClassification) {
        out.push({
          form: form.id, rule: "versionedClassification", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "VERZIÓZOTT OSZTÁLYOZÁS: a `codeSystem.version` kapu alá tartozik. " +
            "Verzió nélkül egy retrospektív stádium csendben mást jelent.",
        });
        continue;
      }
      if (f.contextualThreshold) {
        out.push({
          form: form.id, rule: "contextualThreshold", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "KONTEXTUSFÜGGŐ REFERENCIA: a küszöb nem a változóhoz tartozik, " +
            "hanem a változó ÉS a kontextus párjához. Kontextus nélkül nincs " +
            "referenciatartomány — nem az általános sáv az alapértelmezés.",
        });
        continue;
      }
      if (f.refusalState) {
        out.push({
          form: form.id, rule: "refusalState", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "ELUTASÍTÁS MINT ÖNÁLLÓ ÁLLAPOT: a rendszer öt lelet-állapota " +
            "közül egyik sem fedi. Üresen hagyott mezőként mulasztásnak " +
            "látszik, holott az ellátás teljességét igazolja.",
        });
        continue;
      }
      if (f.boundaryNote) {
        out.push({
          form: form.id, rule: "boundaryNote", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "HATÁRÉRTÉK-FIGYELMEZTETÉS: a szám korlátja ott áll, ahol a szám. " +
            "Egy telítődött modell 0%-a nem lehetetlenség.",
        });
        continue;
      }
      if (f.labelSuspect) {
        out.push({
          form: form.id, rule: "labelSuspect", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "GYANÚS MEZŐCÍMKE: a felirat más lapról származhat, és ezen a " +
            "lapon értelmezhetetlen. Átvenni nem szabad — a helyes " +
            "megnevezést a szakmai forrásból kell venni.",
        });
        continue;
      }
      if (f.valueSetSuspect) {
        out.push({
          form: form.id, rule: "valueSetSuspect", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "HIBÁS ÉRTÉKKÉSZLET GYANÚJA: a mező legördülője más mező " +
            "készletét mutatja. Átvenni nem szabad — a helyes készletet a " +
            "szakmai forrásból kell felvenni.",
        });
        continue;
      }
      if (f.crossFilled) {
        out.push({
          form: form.id, rule: "crossFilled", field: f.label,
          status: f.variable && reg.get(f.variable) ? "mapped" : "gap",
          why:
            (f.note ? f.note + " " : "") +
            "KERESZTFELTÖLTÉS: ugyanaz az adat több felületi helyen jelenik " +
            "meg. A rendszerben EGY változó, több nézet (`aliasOf`) — nem két " +
            "mező, ami eltérhet egymástól.",
        });
        continue;
      }
      if (f.criticalCategory) {
        out.push({
          form: form.id, rule: "criticalCategory", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "KATEGÓRIA, NEM SZÁM: az érték fokozatai súlyosbodó klinikai " +
            "állapotot jelölnek, és a legsúlyosabb fokozat sürgős döntést " +
            "kívánhat. Numerikus mező mellé rejtve elveszne.",
        });
        continue;
      }
      if (f.inputSelector) {
        out.push({
          form: form.id, rule: "inputSelector", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "BEMENETVÁLASZTÓ: megnevezi, melyik mért érték megy be a " +
            "számításba. Enélkül a számítás bemenete implicit — és egy " +
            "implicit bemenet visszamenőleg nem rekonstruálható.",
        });
        continue;
      }
      if (f.ageForRisk) {
        out.push({
          form: form.id, rule: "ageForRisk", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "ÉLETKOR-KAPU: a kockázatszámításhoz nem a várandós mai életkora " +
            "tartozik. Ha a rendszer a rosszat használja, a kockázat némán " +
            "téved — és épp a megnyugtató irányba.",
        });
        continue;
      }
      if (f.research) {
        out.push({
          form: form.id, rule: "research", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "BELEEGYEZÉS-KAPU: kutatási célú adat a klinikai lapon. Érvényes, " +
            "visszavonható beleegyezés nélkül nem rögzíthető (`ctx.consentState`).",
        });
        continue;
      }
      if (f.secondAttempt) {
        out.push({
          form: form.id, rule: "secondAttempt", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "TÉTELENKÉNTI KORLÁTOZOTTSÁG: a lelet állapota nem csak " +
            "látszik/nem látszik.",
        });
        continue;
      }
      if (f.safetyPrecheck) {
        out.push({
          form: form.id, rule: "safetyPrecheck", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "BIZTONSÁGI ELŐELLENŐRZÉS HÁROM ÁLLAPOTTAL: a „nem ellenőrizve” " +
            "külön érték, és nem hagyható el — elhallgatva a hiányzó " +
            "ellenőrzés megtörténtnek látszana.",
        });
        continue;
      }
      if (f.crossEpisode) {
        out.push({
          form: form.id, rule: "crossEpisode", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "EPIZÓDOK KÖZÖTTI HIVATKOZÁS: a beavatkozás megelőzi azt az " +
            "epizódot, amelyben a hatása jelentkezik. Az összekapcsolás nem " +
            "kényelmi kérdés — enélkül a beavatkozás láthatatlan ott, ahol számít.",
        });
        continue;
      }
      if (f.irreversible) {
        out.push({
          form: form.id, rule: "irreversible", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "VISSZAFORDÍTHATATLAN LÉPÉS: a rendszerben minden ilyen kapu " +
            "mögött van, és a kapunak a lépés ELŐTT kell zárnia. Utólagos " +
            "dokumentálás itt nem pótolja a hiányzó feltételt.",
        });
        continue;
      }
      if (f.traceable) {
        out.push({
          form: form.id, rule: "traceable", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "NYOMONKÖVETÉSI KÖVETELMÉNY: gyártási tétel szintjén vissza kell " +
            "lennie kereshetőnek, ki melyik készítményt kapta. A megőrzési " +
            "ideje eltér a leletétől.",
        });
        continue;
      }
      if (f.contraindication) {
        out.push({
          form: form.id, rule: "contraindication", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "KONTRAINDIKÁCIÓ-KAPU: a kezelés feltétele. Bejelöletlenül a " +
            "kezelés nem indítható — ugyanaz a szerkezet, mint az " +
            "asztma-carboprost hard-stop.",
        });
        continue;
      }
      if (f.modelBacked) {
        out.push({
          form: form.id, rule: "modelBacked", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "MODELLHEZ KÖTÖTT: a mező értéke publikált modellből származik. " +
            "Hivatkozás nélkül a modell nem futhat — ez a `calc.verified` kapu.",
        });
        continue;
      }
      if (f.subjectAmbiguous) {
        out.push({
          form: form.id, rule: "subjectAmbiguous", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "KINEK AZ ADATA? A mező alanya eldönthetetlen. Egy leletnél az alany " +
            "a lelet fele: ugyanaz a 45,X az anyánál más kérdés, mint a " +
            "magzatnál. A rendszerben minden mérésnek van alanya " +
            "(`scopedBy`), és ez nem a képernyő elrendezéséből derül ki.",
        });
        continue;
      }
      if (f.pairedSubjects) {
        out.push({
          form: form.id, rule: "pairedSubjects", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "EGY SOR, KÉT ALANY: a felületen kényelmes, az adatmodellben nem " +
            "átvehető. Nálunk két változó, alany szerinti példánnyal — " +
            "különben egy lekérdezés soha nem tudja megmondani, kinek az " +
            "értékét nézi.",
        });
        continue;
      }
      if (f.synonymDuplicate) {
        out.push({
          form: form.id, rule: "synonymDuplicate", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "UGYANAZ AZ ADAT KÉT NÉVEN, KÉT MEZŐBEN: két különböző szám állhat " +
            "ugyanarról a mérésről, és nem lesz eldönthető, melyik a mért. " +
            "Nálunk egy fogalom, több megnevezés — szinonimaként, nem " +
            "külön mezőként.",
        });
        continue;
      }
      if (f.insecureChannel) {
        out.push({
          form: form.id, rule: "insecureChannel", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "KÜLÖNLEGES ADAT VÉDTELEN CSATORNÁN. A GDPR 9. cikk szerinti adat " +
            "továbbítási módja nem a felület legördülőjének kérdése. A " +
            "választás lehet a betegé, a csatorna biztonsága nem az.",
        });
        continue;
      }
      if (f.unitMismatch) {
        out.push({
          form: form.id, rule: "unitMismatch", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "AZ EGYSÉG NEM AZ, AMIBEN A DÖNTÉSI HATÁR KI VAN MONDVA. A szám " +
            "önmagában helyes, a rá alkalmazott küszöb mégis téves lesz — " +
            "és ez a tévedés csendes, mert a mező neve stimmel.",
        });
        continue;
      }
      if (f.orderTracking) {
        out.push({
          form: form.id, rule: "orderTracking", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "MEGRENDELVE ≠ EREDMÉNY: a kintlévő lelet nem üres mező, hanem " +
            "TARTOZÁS, amit valakinek utána kell járnia. Az üres mező azt " +
            "üzeni, nincs mit tudni; a „megrendelve, eredmény nincs” azt, " +
            "hogy van, csak még nem tudjuk. A kettő összemosása az, amiből " +
            "az elveszett lelet lesz.",
        });
        continue;
      }
      if (f.uncertainSignificance) {
        out.push({
          form: form.id, rule: "uncertainSignificance", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "HARMADIK EREDMÉNYKATEGÓRIA: a bizonytalan klinikai jelentőségű " +
            "eltérés (VUS) nem enyhébb kóros és nem majdnem normális — MÁS. " +
            "Kórosként továbbadva döntést alapoznak rá, ami nem áll meg; " +
            "normálisként elhallgatva a későbbi újraértékelés lehetősége " +
            "vész el.",
        });
        continue;
      }
      if (f.screeningOnly) {
        out.push({
          form: form.id, rule: "screeningOnly", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "SZŰRÉS, NEM DIAGNÓZIS: az „alacsony kockázat” nem negatív lelet, és " +
            "a pozitív találatot invazív vizsgálat erősíti meg. A leleten " +
            "ennek OTT KELL LENNIE — enélkül a szűrés eredménye " +
            "diagnózisnak látszik.",
        });
        continue;
      }
      if (f.noResultState) {
        out.push({
          form: form.id, rule: "noResultState", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "A „NINCS EREDMÉNY” ÖNÁLLÓ ÁLLAPOT: nem üres mező és nem negatív " +
            "lelet. Külön oka van, és az ok maga is információ.",
        });
        continue;
      }
      if (f.incidentalMaternal) {
        out.push({
          form: form.id, rule: "incidentalMaternal", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "MAGZATI CÍMKE ALATT ANYAI LELET: a vizsgálat olyat talál, amit nem " +
            "kerestek, és nem is arról, akiről a lap szól. A mellékleletek " +
            "közlésére a beleegyezésnek KÜLÖN ki kell terjednie.",
        });
        continue;
      }
      if (f.assayBound) {
        out.push({
          form: form.id, rule: "assayBound", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "VIZSGÁLATHOZ KÖTÖTT ÉRTÉK: a teljesítmény és a referencia a " +
            "megnevezett gyártóhoz, platformhoz vagy reagenshez tartozik. A " +
            "megnevezés nélkül az érték nem hasonlítható össze és nem " +
            "ellenőrizhető vissza — ugyanaz a szerkezet, mint a " +
            "`calc.verified` kapu.",
        });
        continue;
      }
      if (f.outcomeAudit) {
        out.push({
          form: form.id, rule: "outcomeAudit", field: f.label, status: "gate",
          why:
            (f.note ? f.note + " " : "") +
            "AUDIT-HUROK: a méhen belül mondott állítás szembesítése a " +
            "megszületett igazsággal. Enélkül a rendszer soha nem tudja " +
            "meg, mennyire volt jó; ezzel viszont minden lelet, kockázati " +
            "szám és modell visszamérhetővé válik. Ez a mező köti össze a " +
            "prenatális dokumentációt a kimenetellel.",
        });
        continue;
      }
      if (f.prePost) {
        out.push({
          form: form.id, rule: "prePost", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "UGYANAZ A MÉRÉS EGY ESEMÉNY ELŐTT ÉS UTÁN: az időpont nem címke, " +
            "hanem az esemény, amit közrefog. Egyetlen értékként tárolva a " +
            "beavatkozás hatása tűnik el.",
        });
        continue;
      }
      if (f.specimenBound) {
        out.push({
          form: form.id, rule: "specimenBound", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "AZ ANALIT REFERENCIÁJA A MINTÁHOZ TARTOZIK, nem az analithoz: " +
            "ugyanaz a kreatinin a szérumban, a vizeletben és a " +
            "magzatvízben mást jelent. Egy közös analit-lista mintától " +
            "független referenciákkal többször téved, mint amennyiszer " +
            "eltalálja.",
        });
        continue;
      }
      if (f.handTotal) {
        out.push({
          form: form.id, rule: "handTotal", field: f.label, status: "refused",
          why:
            (f.note ? f.note + " " : "") +
            "KÉZZEL BEÍRT VÉGÖSSZEG A BEJELÖLT ÖSSZETEVŐK MELLETT: a kettő " +
            "ellentmondhat egymásnak, és a pontszám alapján születik a döntés. " +
            "Nálunk az összeg LEVEZETETT — beírni nem lehet, csak az " +
            "összetevőket megadni.",
        });
        continue;
      }
      if (f.attemptFailed) {
        out.push({
          form: form.id, rule: "attemptFailed", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "MEGKÍSÉRELVE ÉS NEM SIKERÜLT — HARMADIK ÁLLAPOT: nem az, hogy " +
            "megtörtént, és nem az, hogy elmaradt. Az indoklás (miért nem " +
            "sikerült) a lelet része, mert a következő kísérlet ezen múlik. " +
            "Ugyanaz a szerkezet, mint a „nem látható” (lelet) és a „nem " +
            "megítélhető” (technikai korlát) megkülönböztetése.",
        });
        continue;
      }
      if (f.sampleAdequacy) {
        out.push({
          form: form.id, rule: "sampleAdequacy", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "A MINTA ALKALMASSÁGA KAPUZZA AZ EREDMÉNYT: elégtelen mintán a " +
            "„negatív” nem negatív lelet, csak annyi, hogy nem volt mit " +
            "megnézni. Az alkalmasság az eredménnyel EGYÜTT tárolandó.",
        });
        continue;
      }
      if (f.rangeValued) {
        out.push({
          form: form.id, rule: "rangeValued", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "AZ ÉRTÉK TERMÉSZETE SZERINT TARTOMÁNY: a ciklushossz nem egy szám, " +
            "hanem alsó és felső határ. Egyetlen értékké lapítva éppen a " +
            "szabálytalanság vész el, ami a klinikai kérdés.",
        });
        continue;
      }
      if (f.measurementContext) {
        out.push({
          form: form.id, rule: "measurementContext", field: f.label, status: "context",
          why:
            (f.note ? f.note + " " : "") +
            "A MÉRÉS KÖRÜLMÉNYE: a mért értékkel EGYÜTT tárolandó, mert a " +
            "körülmény megváltoztatja az érték jelentését.",
        });
        continue;
      }
      if (f.derived) {
        out.push({
          form: form.id, rule: "derived", field: f.label, status: "derived",
          why:
            `Nálunk LEVEZETETT mező (${f.variable}), a felületen nem beírandó — ` +
            `a régi felületen viszont kézzel töltendő.`,
        });
        continue;
      }
      if (f.variable) {
        const d = reg.get(f.variable);
        out.push({
          form: form.id, rule: "variable", field: f.label,
          status: d ? "mapped" : "gap",
          why: d
            ? `Megvan: ${f.variable}.`
            : `A leképezés a(z) ${f.variable} változóra mutat, ami NINCS a ` +
              `regiszterben — a leképezés elavult vagy elgépelt.`,
        });
        continue;
      }
      out.push({
        form: form.id, rule: "unmapped", field: f.label, status: "gap",
        why: (f.note ? f.note + " " : "") +
          `Nincs hozzá regiszterbeli változó.` +
          (f.phi ? " Beteg-azonosításra alkalmas: `phi: true` jelöléssel veendő fel." : ""),
      });
    }
  }
  return out;
}

/** Emberi olvasatra. */
export function uiStamp(map: UiMap, reg: Registry): string {
  const a = auditFields(map, reg);
  const n = (s: FieldAudit["status"]) => a.filter((x) => x.status === s).length;
  return (
    `${map.menu.length} felületi szakasz · ${map.forms.length} adatlap · ` +
    `${a.length} mező (${n("mapped")} megvan, ${n("derived")} levezetett, ` +
    `${n("refused")} nem vehető át változatlanul, ${n("interface")} ` +
    `interfészből, ${n("gate")} kapu, ${n("context")} mérési körülmény, ` +
    `${n("gap")} hiányzik)` +
    (map.coverage === "partial" ? " · a térkép RÉSZLEGES" : "")
  );
}


/* ── INTEGRITÁS ─────────────────────────────────────────────────────── */

export interface UiIssue { severity: "error" | "warning"; id: string; message: string }

export function validateUiMap(map: UiMap, reg: Registry): UiIssue[] {
  const out: UiIssue[] = [];
  const labels = new Set(map.menu.map((m) => [...m.path, m.label].join(" › ")));
  for (const m of map.menu) {
    // Minden szülő menüpontnak léteznie kell — egy lógó ág azt jelenti, hogy
    // a fa átvétele hiányos, és a lefedettség mérése ezért téves.
    for (let i = 1; i <= m.path.length; i++) {
      const parent = m.path.slice(0, i).join(" › ");
      if (!labels.has(parent)) {
        out.push({
          severity: "error", id: m.label,
          message: `hiányzó szülő menüpont: ${parent}`,
        });
      }
    }
  }
  for (const form of map.forms) {
    for (const f of form.fields) {
      if (f.variable && !reg.get(f.variable)) {
        out.push({
          severity: "error", id: `${form.id}/${f.label}`,
          message:
            `a leképezés nem létező változóra mutat: ${f.variable} — az elavult ` +
            `leképezés rosszabb a hiányzónál, mert megvalósítottnak látszik`,
        });
      }
      if (f.special && f.variable) {
        out.push({
          severity: "error", id: `${form.id}/${f.label}`,
          message:
            `KÜLÖNLEGES adat (${f.special}) regiszterbeli változóhoz kötve — ` +
            `ez a mező csak kifejezett, célhoz kötött hozzájárulással vehető fel`,
        });
      }
      if (f.freeText) {
        out.push({
          severity: "warning", id: `${form.id}/${f.label}`,
          message:
            "szabad szöveges mező — a 11. fejezet szerint a klinikai adatmezők " +
            "90%-a kódolt vagy mért érték kell legyen",
        });
      }
    }
  }
  if (map.coverage === "partial" && !map.coverageNote?.hu) {
    out.push({
      severity: "error", id: map.id,
      message: "RÉSZLEGES térkép indoklás nélkül — ki kell mondani, mi maradt ki",
    });
  }
  return out;
}
