/**
 * INTEROPERABILITÁS — a határ, ahol az idegen üzenetből adat lesz.
 *
 * A rendszer eddig minden szabálya arról szólt, hogy a SAJÁT adat ne romoljon
 * el. Itt más a helyzet: az üzenet KÍVÜLRŐL jön, és a küldő rendszerről sem
 * a mértékegység-fegyelmét, sem a betegazonosítási pontosságát nem
 * feltételezhetjük.
 *
 * NÉGY KAPU A HATÁRON, ÉS MIND A NÉGY VISSZAFORDÍTHATATLAN HIBÁT VÉD:
 *
 *  1. AZONOSSÁG — kihez tartozik az üzenet. Ez a legveszélyesebb pont
 *     bármelyik interfészben: egy téves párosítás MÁSIK BETEG leletét teszi
 *     ebbe a rekordba, és onnan a döntés is másik betegről szól.
 *
 *  2. FOGALOM — ugyanarról a mérésről szól-e, mint a mi változónk. A LOINC-
 *     vagy helyi kód eltérése nem formaság.
 *
 *  3. MÉRTÉKEGYSÉG — a néma átváltás a klasszikus gyilkos hiba. Nem
 *     váltunk át találgatásból, és nem fogadunk el egység nélküli számot.
 *
 *  4. A MŰSZER ÁLLAPOTA — egy minőségellenőrzésen bukott POCT-készülék
 *     eredménye NEM eredmény. A készülék ezt tudja; a kérdés az, hogy
 *     elhozzuk-e az üzenettel együtt.
 *
 * ÉS EGY ÖTÖDIK SZABÁLY, AMI NEM KAPU: a beérkező lelet nem tűnhet el. Ha
 * bármelyik kapu megállítja, az üzenet VÁRAKOZÓ SORBA kerül, névvel és
 * indoklással — mert az elveszett lelet ugyanolyan kár, mint a rossz helyre
 * tett.
 */
import type { Confidence, Provenance } from "../types.ts";

export type Channel =
  | "his" | "lis" | "poct" | "pacs" | "eeszt" | "research"
  /**
   * SOROS VONAL (RS-232 / RS-485) — a legrégebbi és a legcsupaszabb csatorna.
   *
   * Egy mérleg, egy magzati monitor, egy vérgázanalizátor gyakran nem beszél
   * hálózati protokollt: karaktereket küld egy soros vonalon, és kész. Ezt a
   * csatornát mégis kezelni kell, mert a valóságban ott van — és ha a rendszer
   * nem ismeri el, a mérés kézzel kerül be, gépelési hibával együtt.
   *
   * AMIT A SOROS VONAL NEM TUD, ÉS EZÉRT KÜLÖN SZABÁLY VONATKOZIK RÁ:
   *
   *   · NINCS BENNE BETEGAZONOSÍTÓ. Az eszköz nem tudja, kit mér. A „két
   *     független azonosító” szabály így ELVBEN nem teljesíthető — a
   *     hozzárendelést egy külön, dokumentált lépés végzi (a mérés
   *     ELINDÍTÁSAKOR rögzített betegazonosítóhoz kötve).
   *   · NINCS NYUGTÁZÁS. Ami elveszett, arról a küldő nem tud. Az adatvesztés
   *     csendes, ezért a fogadó oldalnak kell folytonosságot ellenőriznie.
   *   · NINCS IDŐBÉLYEG-SZINKRON. Az eszköz órája elcsúszik, és senki nem
   *     állítja vissza.
   */
  | "serial"
  /**
   * EGYSZERŰ SZÖVEGES BEMENET — fájl, vágólap, beillesztett lelet.
   *
   * Ugyanaz a helyzet, mint a sorosnál: az adat szerkezet nélkül érkezik. A
   * különbség, hogy itt EMBER illeszti be, tehát a betegazonosító
   * hozzárendelése tudatos művelet — de a formátum ismeretlen, és a
   * mértékegység gyakran hiányzik. Az OCR-réteg (`core/ocr/`) ugyanezt a
   * problémát kezeli képnél.
   */
  | "text";

/* ── AZONOSSÁG ──────────────────────────────────────────────────────── */

/** Amit az üzenet állít a betegről. Egyik mező sem kötelező. */
export interface IdentityClaim {
  /** Intézményi betegazonosító. */
  mrn?: string | null;
  taj?: string | null;
  /** A KÜLDŐ rendszer saját azonosítója (HL7 PID-3). */
  externalId?: string | null;
  birthDate?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  /** Kérésazonosító: a mintavétel/rendelés száma. */
  accession?: string | null;
}

export type MatchOutcome = "match" | "review" | "noMatch";

export interface MatchResult {
  outcome: MatchOutcome;
  /** Hány FÜGGETLEN azonosító egyezett. */
  agreeing: string[];
  conflicting: string[];
  why: string;
}

/**
 * BETEGPÁROSÍTÁS — legalább KÉT független azonosító.
 *
 * A név SOHA nem elég, és önmagában nem is számít bele: névazonosság
 * mindennapos, és éppen a testvérek, az azonos nevű anya-lánya és a
 * gyakori nevek esetén téved. A születési dátum egymagában szintén nem
 * elég — de a névvel EGYÜTT már egy azonosítónak számít.
 *
 * ELLENTMONDÁS ESETÉN NINCS PÁROSÍTÁS. Ha két azonosító egyezik és egy
 * ellentmond, az nem „két az egy ellen": az ellentmondás azt jelenti, hogy
 * valamelyik rendszerben rossz adat van, és amíg ez nem tisztázódik, a lelet
 * nem kerül rekordba.
 */
export function matchPatient(claim: IdentityClaim, known: IdentityClaim): MatchResult {
  const agreeing: string[] = [];
  const conflicting: string[] = [];

  const cmp = (name: string, a?: string | null, b?: string | null) => {
    if (!a || !b) return;
    if (a.trim().toLowerCase() === b.trim().toLowerCase()) agreeing.push(name);
    else conflicting.push(name);
  };
  cmp("MRN", claim.mrn, known.mrn);
  cmp("TAJ", claim.taj, known.taj);
  cmp("külső azonosító", claim.externalId, known.externalId);
  cmp("születési dátum", claim.birthDate, known.birthDate);

  // A NÉV NEM ÖNÁLLÓ AZONOSÍTÓ. Csak a születési dátummal EGYÜTT ér egyet —
  // és akkor is csak akkor, ha a dátum már egyezett.
  const nameSame =
    !!claim.familyName && !!known.familyName &&
    claim.familyName.trim().toLowerCase() === known.familyName.trim().toLowerCase() &&
    (!claim.givenName || !known.givenName ||
      claim.givenName.trim().toLowerCase() === known.givenName.trim().toLowerCase());
  const nameDiffers =
    !!claim.familyName && !!known.familyName && !nameSame;

  if (conflicting.length) {
    return {
      outcome: "noMatch", agreeing, conflicting,
      why:
        `ELLENTMONDÓ AZONOSÍTÓ (${conflicting.join(", ")}), ${agreeing.length} egyezés ` +
        `mellett. Ez NEM „több egyezés, mint eltérés” kérdése: az ellentmondás azt ` +
        `jelenti, hogy valamelyik rendszerben rossz adat van. Amíg ez nem tisztázódik, ` +
        `a lelet nem kerül rekordba — a téves párosítás MÁSIK BETEG leletét tenné ide.`,
    };
  }
  if (nameDiffers) {
    return {
      outcome: "review", agreeing, conflicting: ["név"],
      why:
        `Az azonosítók egyeznek (${agreeing.join(", ") || "—"}), a NÉV viszont eltér. ` +
        `Ez lehet névváltozás (házasság), elgépelés vagy TÉVES AZONOSÍTÓ — emberi ` +
        `döntés kell hozzá, automatikus párosítás nem.`,
    };
  }
  if (agreeing.length >= 2) {
    return { outcome: "match", agreeing, conflicting: [],
      why: `${agreeing.length} független azonosító egyezik (${agreeing.join(", ")}), ` +
           `ellentmondás nincs.` };
  }
  if (agreeing.length === 1 && nameSame) {
    return { outcome: "review", agreeing: [...agreeing, "név (kiegészítő)"], conflicting: [],
      why: `Egyetlen azonosító egyezik (${agreeing[0]}), a név megerősíti. A NÉV ` +
           `azonban nem független azonosító: névazonosság mindennapos, és éppen a ` +
           `testvéreknél és az azonos nevű anya-lányánál téved. Emberi jóváhagyás kell.` };
  }
  return {
    outcome: "noMatch", agreeing, conflicting: [],
    why: `Kevés az egyezés (${agreeing.length} azonosító). A párosításhoz legalább ` +
         `KÉT független azonosító kell — a név nem az.`,
  };
}

/* ── A BEÉRKEZŐ EREDMÉNY ────────────────────────────────────────────── */

export interface InboundResult {
  channel: Channel;
  /** A küldő rendszer megnevezése — a proveniencia része. */
  sender: string;
  /** Üzenetazonosító: az ismételt kézbesítés ne duplázzon. */
  messageId: string;
  receivedAt: string;
  identity: IdentityClaim;
  /** Melyik saját változónkra képezzük le. */
  variableId: string;
  value: unknown;
  unit?: string | null;
  /** A küldő kódrendszere és kódja (LOINC, helyi). */
  code?: { system: string; code: string } | null;
  /** Mikor VONATKOZIK rá — a mintavétel ideje, nem az üzeneté. */
  observedAt?: string | null;
  /** POCT: a készülék minőségellenőrzésének állapota. */
  qc?: { state: "pass" | "fail" | "expired" | "unknown"; at?: string | null } | null;
  /** Az akkreditált labor jelzése, hogy az eredmény javított. */
  corrects?: string | null;
}

export type AdmitOutcome = "admit" | "hold" | "reject";

export interface AdmitDecision {
  outcome: AdmitOutcome;
  /** Milyen provenienciával kerülhet be, ha bekerülhet. */
  provenance: Provenance | null;
  confidence: Confidence | null;
  /** Miért állt meg, ha megállt — a várakozó sor indoklása. */
  why: string;
  /** Mely kapun bukott el. */
  gate: "identity" | "concept" | "unit" | "qc" | null;
}
