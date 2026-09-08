/**
 * ELŐÉLETI ADATIMPORT — típusok.
 *
 * A modul feladata: régi, strukturálatlan beteganyagot (recept, zárójelentés,
 * leletmásolat, kézírásos feljegyzés, képalkotó lelet) a regiszter változóira
 * képezni. A gépi kinyerés ma már jól működik — és épp ezért veszélyes.
 *
 * A RÉTEG EGYETLEN ÁLLÍTÁSA:
 *
 *   A GÉPI KINYERÉS ÁLLÍTÁST AD, NEM ADATOT.
 *
 * Ezért a kinyert érték NEM kerül be a `CaseState.values`-ba. Nem alacsony
 * precedenciával kerül be — SEHOGY nem kerül be. Külön tárban, JAVASLATKÉNT
 * áll, amíg egy ember meg nem erősíti; a megerősítés az, ami adattá teszi, és
 * a megerősítő nevével együtt.
 *
 * Miért nem elég egy alacsony precedenciájú `extracted` eredet: mert attól még
 * a `resolve` visszaadná, ha nincs jobb — és akkor egy OCR-tévesztés csendben
 * belemenne egy score-ba, egy zárójelentésbe vagy egy jelentésbe. A precedencia
 * ARRÓL szól, melyik adat nyer, ha több van. Itt viszont az a kérdés, hogy
 * adat-e egyáltalán. Ezt szerkezettel kell eldönteni, nem rangsorral.
 */
import type { Confidence } from "../types.ts";

/** Milyen dokumentumból nyertük ki. */
export type DocumentKind =
  | "prescription" | "labReport" | "imaging" | "discharge" | "referral"
  | "note" | "other";

export interface SourceDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  /** Mikor keletkezett a DOKUMENTUM — nem mikor importáltuk. */
  issuedAt?: string | null;
  receivedAt: string;
  /** A fájl SHA-256 lenyomata: enélkül nem bizonyítható, mit olvastunk. */
  sha256: string;
  /**
   * Karakterfelismeréssel készült-e a szöveg. Ha igen, MINDEN belőle
   * származó javaslat gyanúsabb — de nem azért, mert kevésbé valószínű,
   * hanem mert MÁS a hibázás módja: az OCR nem „bizonytalan", hanem
   * magabiztosan mást olvas (0/O, 1/l, 5/S, tizedesvessző elvesztése).
   */
  ocr: boolean;
  pages?: number | null;
}

/**
 * HOL MONDJA A DOKUMENTUM. Kötelező minden javaslathoz.
 *
 * A rendszerben nincs eredet nélküli érték; szövegre ez azt jelenti, hogy egy
 * állítás mellé oda kell mutatni a forrás pontos helyére. Enélkül a
 * megerősítés vak: az ember azt hagyná jóvá, amit a gép mond, nem azt, amit a
 * dokumentum.
 */
export interface Span {
  page?: number | null;
  /** Karakterpozíció a dokumentum kinyert szövegében. */
  from: number;
  to: number;
  /** A hivatkozott szövegrészlet szó szerint. */
  text: string;
}

export type ProposalStatus =
  /** Ember még nem döntött róla. */
  | "pending"
  /** Ember megerősítette — ettől lesz adat. */
  | "confirmed"
  /** Ember elutasította. MEGMARAD: az „megnéztük és nem" is információ. */
  | "rejected"
  /** Újabb import pontosabb javaslatot adott ugyanarra. */
  | "superseded";

export interface Extractor {
  /** Melyik kinyerő adta. */
  name: string;
  version: string;
  /** Ha nyelvi modell: melyik, milyen kiadásban. */
  model?: string | null;
}

/**
 * Egy javaslat: „a dokumentum szerint ennek a változónak ez az értéke".
 */
export interface Proposal {
  id: string;
  /** A regiszterbeli változó azonosítója. */
  variable: string;
  value: unknown;
  unit?: string | null;
  /** Mikor VONATKOZIK rá az érték. */
  t?: string | null;
  /** Példány-dimenzió (`scopedBy` változóknál). */
  scope?: string | null;
  document: string;
  span: Span;
  extractor: Extractor;
  /**
   * A KINYERŐ magabiztossága, 0-1. NEM klinikai megbízhatóság, és NEM
   * kapu: nincs olyan küszöb, ami fölött a javaslat ember nélkül adattá
   * válna. Rendezésre való, nem döntésre.
   */
  machineConfidence?: number | null;
  /**
   * A DATUM klinikai jellege — mérték, mondták, becsülték. Ez a
   * dokumentum tulajdonsága, nem a kinyerésé: egy laborleletből olvasott
   * érték klinikailag `measured`, akkor is, ha a beolvasás hibázhatott.
   */
  confidence?: Confidence;
  status: ProposalStatus;
  decidedBy?: string | null;
  decidedAt?: string | null;
  /** Az elutasítás vagy a korrekció indoka. */
  note?: string | null;
  /** Megerősítéskor javított érték, ha az ember mást írt be. */
  correctedValue?: unknown;
}
