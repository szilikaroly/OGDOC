/**
 * ÍRÁSI NAPLÓ — a rekord maga, nem a mentése.
 *
 * A rendszerben már ma minden érték hozzáfűző naplóban él
 * (`CaseState.values[id]` tömb, nem felülíró mező). Ez a modul ezt viszi
 * végig: az ESEMÉNYSOR a rekord, az állapot pedig ANNAK A VETÜLETE.
 *
 *     napló  ──replay()──▶  CaseState
 *
 * Ha a kettő eltér, a NAPLÓ nyer. Ez nem ízlés kérdése: egy állapotot
 * felülíró mentésnél a hiba pillanata elveszik, és utólag nem
 * rekonstruálható, ki mikor mit írt — pedig egy szülészeti rekordnál éppen ez
 * a kérdés évekkel később.
 *
 * NÉGY SZERKEZETI DÖNTÉS, MINDEGYIK EGY-EGY HIBÁT VÉD:
 *
 *  1. A SORRENDET A `seq` DÖNTI EL, NEM AZ ÓRA. A faliórai idő visszaugorhat
 *     (időzóna, NTP-korrekció, virtuális gép migrációja). Egy naplóban, ahol
 *     az `at` dönt, egy óraállítás átrendezi a múltat.
 *
 *  2. MINDEN BEJEGYZÉS HORDOZZA AZ ELŐZŐ LENYOMATÁT. A módosított érték és a
 *     kihagyott bejegyzés így KIMUTATHATÓ: a csendben sérült mentés a
 *     legveszélyesebb, mert visszaáll — csak nem azt, ami volt.
 *
 *     AMIT A LÁNC ÖNMAGÁBAN NEM MUTAT KI: A LEVÁGOTT VÉGET. Egy 1..40
 *     bejegyzésből álló naplóból az utolsó ötöt letörölve az 1..35 lánc
 *     HIÁNYTALANUL ILLESZKEDIK — minden lenyomat helyes, hézag nincs, a
 *     `verifyChain()` „ép”-et mond. A lánc a MÚLTAT köti meg, a VÉGÉT nem:
 *     ahhoz tudni kell, hol ért véget, és azt a naplón KÍVÜL kell tudni.
 *     Ez a `Horgony` — l. `core/pilot/horgony.ts`.
 *
 *  3. AZ ÍRÁSI NAPLÓ AZ AUDITNAPLÓ ÍRÁSI FELE. Nem két rendszert építünk:
 *     minden bejegyzésben ott a cselekvő. Ami külön marad, az az OLVASÁS
 *     naplózása — abból ugyanis nem keletkezik bejegyzés.
 *
 *  4. A TÖRLÉS IS BEJEGYZÉS. Egy törölt érték nem eltűnik a naplóból, hanem
 *     sírkövet kap. Enélkül a visszajátszás feltámasztaná — és a
 *     GDPR-törlés a mentésben tovább élne.
 */
import type { CaseState, Value } from "../types.ts";

export const JOURNAL_FORMAT = 1;

export type JournalOp =
  /** Egy érték hozzáfűzése egy változó naplójához. */
  | "write"
  /** Sírkő: egy változó értékei érvénytelenek, indoklással. */
  | "erase"
  /** Az eset kontextusa változott (ellátási forma, útvonal). */
  | "context";

export interface JournalEntry {
  /** MONOTON, HÉZAGMENTES. A sorrend ezen áll. */
  seq: number;
  /**
   * Egyedi azonosító. Az újraküldött szállítmány NEM duplázhat: a fogadó
   * ebből ismeri fel, hogy ezt a bejegyzést már látta.
   */
  entryId: string;
  /**
   * Faliórai idő. TÁJÉKOZTATÓ ADAT — visszaugorhat, és sorrendet nem dönt el.
   */
  at: string;
  caseId: string;
  /** KI. „A rendszer" itt sem cselekvő. */
  actor: string;
  op: JournalOp;
  variableId?: string;
  value?: Value;
  /** Kontextusváltásnál az új kontextus. */
  ctx?: CaseState["ctx"];
  /**
   * Törlésnél KÖTELEZŐ: GDPR-kérés, téves felvitel, próbaadat. A sírkő
   * indoklás nélkül nem különböztethető meg az adatvesztéstől.
   */
  reason?: string;
  /** Az ELŐZŐ bejegyzés lenyomata — az első bejegyzésnél a kezdőlánc. */
  prevHash: string;
  /** ENNEK a bejegyzésnek a lenyomata, a `hash` mezőt kihagyva. */
  hash: string;
}

/** A lánc kezdete. Nem üres string: az üres érték elgépelésből is előáll. */
export const GENESIS = "genesis";

/**
 * HORGONY — A NAPLÓ VÉGE, A NAPLÓN KÍVÜL RÖGZÍTVE.
 *
 * A lánc minden bejegyzést az előzőhöz köt, de az UTOLSÓ bejegyzést semmihez:
 * a levágott napló épnek látszik. A horgony ezt a hiányzó láncszemet pótolja
 * — egy külön tárolt, esetenkénti csúcsjelzés arról, meddig tartott a napló,
 * amikor utoljára írtunk bele.
 *
 * Miért nem a naplóban áll: ami a naplófájlban van, azt ugyanaz a csonkolás
 * viszi el, ami a bejegyzéseket. A horgony csak akkor bizonyít, ha MÁSHOL van
 * — más fájlban, jobb esetben más gépen.
 */
export interface Horgony {
  caseId: string;
  /** Az utolsó bejegyzés sorszáma az írás pillanatában. */
  seq: number;
  /** Az utolsó bejegyzés lenyomata. */
  hash: string;
  /** Mikor rögzítettük a horgonyt. */
  at: string;
}

/* ── TARTÓSSÁG ──────────────────────────────────────────────────────── */

/**
 * A „mentve" szó azt jelenti, hogy TARTÓS TÁROLÓN VAN.
 *
 * A klinikus a képernyőn látott visszajelzésre alapoz: ha ott az áll, hogy
 * mentve, akkor elmegy a szobából. Egy pufferben álló bejegyzésre ezt kiírni
 * nem optimalizálás, hanem hazugság — és éppen az áramszünet pillanatában
 * derül ki.
 */
export type Durability =
  /** Memóriában van, lemezen még nincs. */
  | "buffered"
  /** A helyi tartós tárolón van (fsync megtörtént). */
  | "local"
  /** Legalább egy TÁVOLI másolat is nyugtázta. */
  | "replicated";

/** Kiírható-e a felhasználónak, hogy „mentve"? */
export function canReportSaved(d: Durability): boolean {
  return d === "local" || d === "replicated";
}

/* ── REPLIKÁCIÓS ÁLLAPOT ────────────────────────────────────────────── */

export interface ReplicationState {
  /** A helyi napló utolsó bejegyzésének sorszáma. */
  localSeq: number;
  /** Amit a távoli másolat NYUGTÁZOTT. */
  remoteSeq: number;
  /** A helyi utolsó bejegyzés ideje. */
  localAt: string;
  /** A nyugtázott utolsó bejegyzés ideje. */
  remoteAt: string | null;
}

export interface LagReport {
  /** Hány bejegyzés nincs még a távoli másolaton. */
  entriesBehind: number;
  /** Hány másodpercnyi munka veszne el most. Ez a VALÓDI RPO. */
  secondsBehind: number;
  /** Teljesül-e a vállalt helyreállítási pont. */
  withinRpo: boolean;
  why: string;
}

/**
 * A LEMARADÁS NEM ÜZEMELTETÉSI RÉSZLET, HANEM KLINIKAI ADAT.
 *
 * Ha a földrajzi másolat negyven perccel van lemaradva, a „mentve" szó mást
 * jelent, mint amit a klinikus ért alatta. Ezért ez a szám látható kell
 * legyen — nem egy műszerfalon, hanem ott, ahol a mentés visszajelzése van.
 */
export function replicationLag(
  st: ReplicationState, rpoSeconds: number, now: string,
): LagReport {
  const entriesBehind = st.localSeq - st.remoteSeq;
  if (entriesBehind <= 0) {
    return {
      entriesBehind: 0, secondsBehind: 0, withinRpo: true,
      why: "A távoli másolat naprakész: minden bejegyzést nyugtázott.",
    };
  }
  // A LEMARADÁS AZ ELSŐ NEM NYUGTÁZOTT BEJEGYZÉSTŐL MÉRENDŐ, nem az
  // utolsótól: ami elveszne, az a legrégebbi nyugtázatlan munkával kezdődik.
  const from = st.remoteAt ?? st.localAt;
  const secondsBehind = Math.max(0, Math.round((Date.parse(now) - Date.parse(from)) / 1000));
  const withinRpo = secondsBehind <= rpoSeconds;
  return {
    entriesBehind, secondsBehind, withinRpo,
    why: withinRpo
      ? `${entriesBehind} bejegyzés (${secondsBehind} mp) nincs még a távoli ` +
        `másolaton, de a vállalt ${rpoSeconds} mp-en belül van.`
      : `A TÁVOLI MÁSOLAT ${secondsBehind} MP-CEL VAN LEMARADVA (${entriesBehind} ` +
        `bejegyzés), a vállalt ${rpoSeconds} mp helyett. Egy géptermi kiesés ` +
        `ennyi munkát vinne el — és a szülőszobai idősor nem áll össze újra ` +
        `emlékezetből. Amíg ez fennáll, a „mentve” szó nem azt jelenti, amit ` +
        `a klinikus ért alatta.`,
  };
}
