/**
 * DICOM — CSAK AZ INTERFÉSZ. A mag SOHA nem elemez DICOM-ot.
 *
 * MIÉRT NEM ITT VAN A DICOM-VEREM
 *
 * A DICOM hálózati réteg (DIMSE, PDU, presentation context, transfer syntax
 * egyeztetés) és a képadat-dekódolás (JPEG, JPEG-LS, JPEG 2000, RLE) együtt
 * nagyobb és kockázatosabb, mint az egész klinikai mag. Egy hibás
 * pixeladat-dekódoló ugyanúgy összeomlaszthatja a kiszolgálót, mint egy
 * rosszul kezelt PDU — és a mag épp attól tesztelhető, hogy tiszta
 * függvényekből áll, futásidejű függőség nélkül.
 *
 * A DICOM-csomópont ezért KÜLÖN FOLYAMAT (oldalkocsi), és a mag ezt a
 * szerződést látja belőle. Az OGDOC nem tud DICOM-ul; azt tudja, MIT KÉR
 * ÉS MIT FOGAD EL.
 *
 * AZ OLDALKOCSI JAVASOLT ALAPJA — ÉS AMIÉRT A LICENC AZ ELSŐ KÉRDÉS
 *
 *   github.com/amrshadid/go-dicom  —  MIT licenc
 *
 * A licenckapu megelőzi a technikai megfelelést: egy kiváló könyvtár rossz
 * licenccel nem jöhet szóba, és ezt előbb kell megnézni, mint az API-t. Itt a
 * kapu NYÍLIK: az MIT és az OGDOC MIT-licence összeférnek, mindkét irányban.
 * (Ellenpélda ugyanebben a rendszerben: a PRBPERIsk GPLv2 — a modell ezért
 * HELYBEN települ, és a build hibát ad, ha a terjesztett fába kerülne.)
 *
 * Amit a csomag ad, és ami ehhez a szerződéshez kell: SCU és SCP, C-ECHO,
 * C-FIND, C-MOVE, C-GET, C-STORE, modality worklist, MPPS, storage
 * commitment, TLS, valamint a PS3.15 Annex E szerinti de-identifikáció.
 *
 * AMIT AZ OLDALKOCSI NEM DÖNTHET EL, ÉS EZÉRT ITT VAN
 *
 *   · KI a beteg (a DICOM PatientID egy MÁSIK rendszer azonosítója);
 *   · szabad-e a képet felhasználni (ráégetett azonosító);
 *   · elég-e a de-identifikáció (a címkék törlése NEM tisztítja a pixeleket).
 *
 * Ez a három klinikai és jogi döntés, nem protokollkérdés — és pont ezért nem
 * bízható arra a rétegre, amelyik a bájtokat mozgatja.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { IdentityClaim } from "./types.ts";
import type { PacsKep } from "../pacs/valasztas.ts";

/* ── A CSOMÓPONT AZONOSSÁGA ──────────────────────────────────────────── */

export interface DicomCsomopont {
  /** Application Entity Title — legfeljebb 16 karakter, a DICOM így azonosít. */
  aeTitle: string;
  host: string;
  port: number;
  /**
   * TLS. A DICOM alapból NYÍLT: a képadat és a betegazonosító titkosítatlanul
   * megy a hálózaton. Intézményen belül is kockázat, intézmények között
   * elfogadhatatlan.
   */
  tls: boolean;
  megnevezes: string;
}

/* ── A SZERZŐDÉS ─────────────────────────────────────────────────────── */

export type DimseSzolgaltatas =
  /** Kapcsolatpróba. Az EGYETLEN művelet, ami betegadat nélkül fut. */
  | "C-ECHO"
  /** Lekérdezés (Query). */
  | "C-FIND"
  /** Lehívás a MI csomópontunkra (a küldő indítja a küldést). */
  | "C-MOVE"
  /** Lehívás ugyanazon a kapcsolaton. */
  | "C-GET"
  /** Küldés. */
  | "C-STORE"
  /** Vizsgálati munkalista — mit kell ma megcsinálni. */
  | "MWL"
  /** Modality Performed Procedure Step — mi történt valójában. */
  | "MPPS"
  /**
   * Storage Commitment (N-ACTION / N-EVENT-REPORT).
   *
   * AZ EGYETLEN SZOLGÁLTATÁS, AMI AZT ÁLLÍTJA, HOGY A KÉP MEGMARADT.
   * A C-STORE sikeres státusza annyit jelent: „megkaptam”. Nem azt, hogy
   * archiváltam, nem azt, hogy tartósan megőrzöm. A kettő között van az a
   * pillanat, amikor a helyi másolat törlése VÉGLEGES képvesztés.
   */
  | "STORAGE-COMMIT"
  /**
   * Structured Reporting — a modalitás MÉRÉSEI kódolt formában.
   * Nem kép: számok, saját kódrendszerrel és saját megfigyelővel.
   */
  | "SR"
  /**
   * Secondary Capture — képernyőmentés, szkennelt papír, gépi kiírás.
   * A RÁÉGETETT AZONOSÍTÓ itt nem kivétel, hanem a szabály.
   */
  | "SC";

export type LekerdezesiSzint = "PATIENT" | "STUDY" | "SERIES" | "IMAGE";

export interface DicomLekerdezes {
  szint: LekerdezesiSzint;
  /** DICOM-címkék `gggg,eeee` alakban, értékkel. Üres érték = kérjük vissza. */
  felteteleK: Record<string, string>;
  /** Legfeljebb ennyi találat. Korlát nélkül egy tág lekérdezés az egész PACS-ot húzza. */
  maxTalalat: number;
}

export type DicomHibaFajta =
  | "nemErhetoEl"
  | "elutasitottTarsitas"
  | "nincsKozosTransferSyntax"
  | "idotullepes"
  | "protokollHiba";

export interface DicomHiba {
  fajta: DicomHibaFajta;
  /** A DIMSE státuszkód, ha volt. */
  statusz?: number | null;
  miert: string;
}

export type DicomValasz<T> =
  | { ok: true; ertek: T; tartott: number }
  | { ok: false; hiba: DicomHiba };

/**
 * A DICOM-OLDALKOCSI SZERZŐDÉSE.
 *
 * Minden művelet MEGNEVEZI a hívót és az indokot. Nem formaság: a PACS
 * naplózza, ki kérdezett rá kire, és ha a mi oldalunkon nincs meg ugyanaz, a
 * két napló nem vethető össze.
 */
export interface DicomKapu {
  /** Kapcsolatpróba. Betegadat nélkül fut — ezért indításkor is hívható. */
  echo(cel: DicomCsomopont): Promise<DicomValasz<{ aeTitle: string }>>;

  /** C-FIND. A találat NYERS DICOM-mező-térkép, nem a mi modellünk. */
  keres(
    cel: DicomCsomopont, q: DicomLekerdezes,
    ki: string, miert: string,
  ): Promise<DicomValasz<Array<Record<string, string>>>>;

  /**
   * C-MOVE vagy C-GET. NEM ad vissza képadatot: azt mondja meg, hova került.
   * A képadat a magon SOHA nem megy át.
   */
  lehiv(
    cel: DicomCsomopont, sopInstanceUid: string, ki: string, miert: string,
  ): Promise<DicomValasz<{ helyiUt: string; bajt: number; sha256: string }>>;

  /** C-STORE — kifelé küldés. */
  kuld(
    cel: DicomCsomopont, helyiUt: string, ki: string, miert: string,
  ): Promise<DicomValasz<{ sopInstanceUid: string }>>;

  /** Modality Worklist — mit kell ma megcsinálni. */
  munkalista(
    cel: DicomCsomopont, nap: string, aeTitle: string,
  ): Promise<DicomValasz<Array<Record<string, string>>>>;

  /**
   * STORAGE COMMITMENT (N-ACTION). MEGKÉRDEZI, hogy megőrzi-e az archívum.
   *
   * NEM ad választ: a válasz (N-EVENT-REPORT) KÜLÖN TÁRSÍTÁSON érkezik, akár
   * percekkel később. Ezért a visszatérési érték csak a kérés azonosítója —
   * ha itt `boolean` állna, az azt sugallná, hogy a küldés pillanatában
   * megtudható, amit csak később lehet megtudni.
   */
  veglegesitestKer?(
    cel: DicomCsomopont, sopInstanceUidk: string[], ki: string,
  ): Promise<DicomValasz<{ tranzakcioUid: string }>>;

  /** A KÉSŐBB beérkezett véglegesítési válaszok lekérdezése. */
  veglegesitesek?(
    tranzakcioUid: string,
  ): Promise<DicomValasz<Array<{ sopInstanceUid: string; elfogadva: boolean; mikor: string }>>>;

  /**
   * MPPS — a modalitás jelzi, mi INDULT EL és mi FEJEZŐDÖTT BE.
   * Enélkül a munkalistatétel örökre „ütemezett” marad, és nem derül ki,
   * hogy a vizsgálat elmaradt-e vagy csak nem zárta le senki.
   */
  mpps?(
    cel: DicomCsomopont, esemeny: "IN PROGRESS" | "COMPLETED" | "DISCONTINUED",
    mezok: Record<string, string>,
  ): Promise<DicomValasz<{ mppsUid: string }>>;

  /** SR — a modalitás kódolt mérései. NYERS mérések, nem a mi változóink. */
  strukturaltLelet?(
    cel: DicomCsomopont, sopInstanceUid: string, ki: string, miert: string,
  ): Promise<DicomValasz<SrMeres[]>>;

  /** DICOMweb: QIDO-RS lekérdezés. */
  webKeres?(
    v: DicomWebVegpont, szint: LekerdezesiSzint,
    feltetelek: Record<string, string>, ki: string, miert: string,
  ): Promise<DicomValasz<Array<Record<string, string>>>>;

  /**
   * DICOMweb: WADO-RS lehívás. A C-MOVE-val ellentétben NEM kell hozzá
   * fogadó SCP — a válasz ugyanazon a HTTP-kapcsolaton jön vissza.
   */
  webLehiv?(
    v: DicomWebVegpont, sopInstanceUid: string, ki: string, miert: string,
  ): Promise<DicomValasz<{ helyiUt: string; bajt: number; sha256: string }>>;

  /** DICOMweb: STOW-RS küldés. A 200-as válasz ÁTVÉTEL, nem megőrzés. */
  webKuld?(
    v: DicomWebVegpont, helyiUt: string, ki: string, miert: string,
  ): Promise<DicomValasz<{ sopInstanceUid: string }>>;

  /**
   * DE-IDENTIFIKÁCIÓ (PS3.15 Annex E). A CÍMKÉKET tisztítja.
   * A pixeleket NEM — lásd `deidentifikalhato()`.
   */
  deidentifikal?(
    helyiUt: string, profil: DeidProfil,
  ): Promise<DicomValasz<{ helyiUt: string; torolt: string[] }>>;
}

export type DeidProfil =
  /** PS3.15 Annex E alapprofil. */
  | "alap"
  /** Alapprofil + eszközazonosítók megtartása (minőségellenőrzéshez). */
  | "eszkozMegtartva"
  /** Alapprofil + időpontok eltolása (a sorrend megmarad, a dátum nem). */
  | "datumEltolas";

/* ── AZ AZONOSSÁG: A DICOM PatientID EGY MÁSIK RENDSZER AZONOSÍTÓJA ──── */

/** A C-FIND találatból a mi azonosságállításunk. */
export function azonossag(talalat: Record<string, string>): IdentityClaim {
  return {
    externalId: talalat["0010,0020"] ?? null,       // PatientID
    familyName: (talalat["0010,0010"] ?? "").split("^")[0] || null,
    givenName: (talalat["0010,0010"] ?? "").split("^")[1] || null,
    birthDate: iso(talalat["0010,0030"]),           // PatientBirthDate
    accession: talalat["0008,0050"] ?? null,        // AccessionNumber
  };
}

/** DICOM `YYYYMMDD` → ISO `YYYY-MM-DD`. Ami nem ilyen, az `null`. */
function iso(d: string | undefined): string | null {
  if (!d || !/^\d{8}$/.test(d)) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

/** A C-FIND találatból a mi képmodellünk. */
export function kepbol(talalat: Record<string, string>): PacsKep {
  return {
    sopInstanceUid: talalat["0008,0018"] ?? "",
    seriesInstanceUid: talalat["0020,000E"] ?? "",
    studyInstanceUid: talalat["0020,000D"] ?? "",
    accession: talalat["0008,0050"] ?? null,
    modality: talalat["0008,0060"] ?? null,
    keszult: iso(talalat["0008,0020"]),
    beteg: azonossag(talalat),
    // (0028,0301). A HIÁNYA nem „NO” — a `core/pacs/beegetes()` ezt kezeli.
    burnedInAnnotation: (talalat["0028,0301"] as "YES" | "NO") ?? null,
    leiras: talalat["0008,1030"] ?? null,
  };
}

/* ── DICOMweb: UGYANAZ AZ ADAT, MÁS BIZALMI MODELL ───────────────────── */

/**
 * A DICOMweb NEM „a DIMSE HTTP-n”. A kettő MÁSHOGY MONDJA MEG, KI VAGY.
 *
 *   DIMSE      az AE title azonosít, és a PACS oldalán fel van véve. Egy
 *              ismeretlen AE title ELUTASÍTOTT TÁRSÍTÁST kap.
 *   DICOMweb   az URL nyilvános, az azonosság a HTTP-hitelesítésből jön.
 *              Ha nincs hitelesítés, a végpont NYITVA VAN — társításelutasítás
 *              nincs, ami megfogná.
 *
 * Ezért egy hitelesítés nélküli DICOMweb-végpont nem „lazább beállítás”,
 * hanem másik kategória: a DIMSE-nél az alapállapot a tiltás, itt az engedés.
 */
export type DicomWebSzolgaltatas =
  /** Lekérdezés (a C-FIND megfelelője). */
  | "QIDO-RS"
  /** Lehívás — és a C-MOVE-val ellentétben NEM kell hozzá fogadó SCP. */
  | "WADO-RS"
  /** Küldés (a C-STORE megfelelője). */
  | "STOW-RS"
  /** Munkalista-szolgáltatás (a MWL/MPPS megfelelője). */
  | "UPS-RS";

export type WebHitelesites = "nincs" | "alap" | "oauth2" | "kolcsonosTls";

export interface DicomWebVegpont {
  id: string;
  megnevezes: string;
  /** Teljes alap-URL. A séma DÖNTŐ: `http://` esetén minden nyíltan megy. */
  alapUrl: string;
  hitelesites: WebHitelesites;
  szolgaltatasok: DicomWebSzolgaltatas[];
  /**
   * Van-e nyugtázás arról, hogy a beküldött kép TARTÓSAN megmaradt.
   * A STOW-RS 200-as válasza — akárcsak a C-STORE sikere — csak átvételt
   * jelent. `null`: nem tudjuk. A „null” itt sem „igen”.
   */
  megorzesiNyugta: boolean | null;
  leiras: string;
}

/* ── A TÁROLÁS VÉGLEGESSÉGE: MIKOR TÖRÖLHETŐ A HELYI MÁSOLAT ─────────── */

export type TorlesAllapot =
  /** Megjött a storage commitment: az archívum felelősséget vállalt. */
  | "torolheto"
  /** Az átvétel megvolt, a véglegesítés nem. A helyi másolat KELL. */
  | "csakAtvetel"
  /** A célcsomópont nem is ismeri a storage commitmentet. */
  | "nincsVeglegesitesiSzolgaltatas"
  /** A véglegesítés MEGTAGADVA — az archívum kimondta, hogy nem őrzi meg. */
  | "elutasitva";

export interface TorlesItelet {
  allapot: TorlesAllapot;
  torolheto: boolean;
  miert: string;
}

/**
 * TÖRÖLHETŐ-E A HELYI MÁSOLAT.
 *
 * A C-STORE (és a STOW-RS) sikeres válasza azt jelenti: MEGKAPTAM. Nem azt,
 * hogy archiváltam, és nem azt, hogy megőrzöm. A kettő között van az a
 * pillanat, amikor a helyi másolat törlése VÉGLEGES képvesztés — és semmi nem
 * jelez, mert formailag minden sikerült.
 *
 * A storage commitment (N-ACTION → N-EVENT-REPORT) az egyetlen olyan válasz,
 * amiben az archívum FELELŐSSÉGET VÁLLAL. Külön társításon érkezik, akár
 * percekkel később — ezért NEM lehet a küldés visszatérési értéke.
 */
export function torolhetoHelyi(
  cel: { megnevezes: string; szolgaltatasok: DimseSzolgaltatas[] },
  veglegesites: { megjott: boolean; elfogadva: boolean } | null,
): TorlesItelet {
  if (!cel.szolgaltatasok.includes("STORAGE-COMMIT")) {
    return { allapot: "nincsVeglegesitesiSzolgaltatas", torolheto: false,
      miert:
        `A(z) „${cel.megnevezes}” csomópont nem nyújt storage commitmentet, ` +
        `tehát SOHA nem fogja kimondani, hogy megőrizte a képet. A C-STORE ` +
        `sikere csak átvételt jelent. A helyi másolat itt nem törölhető — nem ` +
        `azért, mert baj van, hanem mert nincs mire hivatkozni.` };
  }
  if (!veglegesites || !veglegesites.megjott) {
    return { allapot: "csakAtvetel", torolheto: false,
      miert:
        `A kép átvételét nyugtázták, a MEGŐRZÉSÉT nem. A véglegesítés külön ` +
        `társításon érkezik, akár percekkel később — addig a helyi másolat ` +
        `törlése végleges képvesztés lenne, miközben formailag minden sikerült.` };
  }
  if (!veglegesites.elfogadva) {
    return { allapot: "elutasitva", torolheto: false,
      miert:
        `Az archívum MEGTAGADTA a megőrzést (N-EVENT-REPORT: failed). Ez a ` +
        `legveszélyesebb eset: a küldés sikeresnek látszott, és az egyetlen ` +
        `jelzés az, amit most kaptunk. A képet újra kell küldeni, a helyi ` +
        `másolat pedig nem törölhető.` };
  }
  return { allapot: "torolheto", torolheto: true,
    miert:
      `Az archívum kimondta, hogy megőrzi (storage commitment elfogadva). Ez az ` +
      `egyetlen alap, amire a helyi törlés építhető.` };
}

/* ── STRUCTURED REPORTING: A MODALITÁS MÉRÉSEI ───────────────────────── */

export interface SrKod {
  /** Kódrendszer: `DCM`, `SCT` (SNOMED), `LN` (LOINC), vagy gyártói. */
  rendszer: string;
  kod: string;
  megnevezes: string;
}

export interface SrMeres {
  kod: SrKod | null;
  ertek: number;
  /** UCUM-egység, ahogy az SR küldi. Az SR-ben VAN egység — de nem mindig. */
  egyseg: string | null;
  /** KI vagy MI mérte (Observer Context). „A gép” nem elég: melyik. */
  megfigyelo: string | null;
  /** Mikor. */
  mikor: string | null;
}

export type SrAllapot =
  | "atveheto"
  /** Nincs kód: a szám nem tudja, mit mér. */
  | "kodolatlan"
  /** Van kód, de nincs leképezve a mi változóinkra. */
  | "ismeretlenKod"
  /** Nincs mértékegység — ugyanaz a hiba, mint a soros vonalon. */
  | "egysegNelkul"
  /** Nincs megfigyelő — a mérés eredete nem állapítható meg. */
  | "megfigyeloNelkul"
  /** UGYANEZT A MÉRÉST EGY EMBER MÁR RÖGZÍTETTE. */
  | "utkozik";

export interface SrItelet {
  allapot: SrAllapot;
  valtozo: string | null;
  miert: string;
}

/**
 * ÁTVEHETŐ-E EGY SR-MÉRÉS.
 *
 * Az SR nem kép: a modalitás SAJÁT MÉRÉSEI, saját kódrendszerben, saját
 * megfigyelővel. Három dolog dönt, és mind a három hiányozhat.
 *
 * A LEGCSENDESEBB HIBA AZ ÜTKÖZÉS. Egy ultrahangos biometria kétszer kerül be:
 * egyszer a gép küldi SR-ben, egyszer az asszisztens beírja. A két szám
 * kicsit eltér (más kurzorállás), és onnantól ugyanaz a klinikai tény KÉT
 * mezőben él — a görbe pedig attól függ, melyiket olvassa a következő
 * számítás. Ez ugyanaz a hibacsalád, amit a rendszer másutt is tilt.
 */
export function srAtveheto(
  m: SrMeres,
  terkep: (k: SrKod) => string | null,
  meglevo: Array<{ valtozo: string; forras: string; mikor: string }>,
  ablakPerc = 120,
): SrItelet {
  if (!m.kod) {
    return { allapot: "kodolatlan", valtozo: null,
      miert:
        `A mérésnek nincs kódja, tehát a szám nem tudja, MIT mér. Egy ` +
        `kódolatlan 34,2 lehet fejátmérő milliméterben és lehet tarkóredő ` +
        `is — a kettőt nem a nagyságrend különbözteti meg.` };
  }
  if (!m.egyseg?.trim()) {
    return { allapot: "egysegNelkul", valtozo: null,
      miert:
        `A(z) „${m.kod.megnevezes}” méréshez nincs mértékegység. Az SR általában ` +
        `küld egységet — ha épp nem, a szám ugyanúgy nem adat, mint a soros ` +
        `vonalon: a 3,2 cm és a 3,2 mm nem ugyanaz a lelet.` };
  }
  if (!m.megfigyelo?.trim()) {
    return { allapot: "megfigyeloNelkul", valtozo: null,
      miert:
        `Nincs megfigyelő (Observer Context). „A gép mérte” nem elég: MELYIK ` +
        `gép, melyik szoftververzió. Az eltérő gyártói algoritmusok eltérő ` +
        `számot adnak ugyanarra a képre, és a görbe ezt fogja mutatni.` };
  }
  const valtozo = terkep(m.kod);
  if (!valtozo) {
    return { allapot: "ismeretlenKod", valtozo: null,
      miert:
        `A(z) ${m.kod.rendszer}:${m.kod.kod} („${m.kod.megnevezes}”) kód nincs ` +
        `leképezve. A mérés NEM VÉSZ EL — várakozó sorba kerül —, de puszta ` +
        `számként nem kerül be: a leképezetlen kód beírása azt jelentené, hogy ` +
        `a jelentését később senki nem tudja visszakeresni.` };
  }
  const hatar = m.mikor ? Date.parse(m.mikor) : NaN;
  const utkozo = Number.isNaN(hatar) ? undefined : meglevo.find((e) =>
    e.valtozo === valtozo && e.forras !== "device"
    && Math.abs(Date.parse(e.mikor) - hatar) <= ablakPerc * 60_000);
  if (utkozo) {
    return { allapot: "utkozik", valtozo,
      miert:
        `A(z) „${valtozo}” értéket ${ablakPerc} percen belül már rögzítette egy ` +
        `ember (${utkozo.forras}, ${utkozo.mikor}). A gépi mérés NEM írja felül ` +
        `és nem is kerül mellé külön mezőbe: a döntést egy embernek kell ` +
        `meghoznia. Két, kicsit eltérő szám ugyanarra a tényre azt jelenti, hogy ` +
        `a következő számítás eredménye attól függ, melyiket olvassa.` };
  }
  return { allapot: "atveheto", valtozo,
    miert:
      `${m.kod.rendszer}:${m.kod.kod} → „${valtozo}”, ${m.ertek} ${m.egyseg}, ` +
      `mérte: ${m.megfigyelo}. Az eredet „device”, a bizonyosság „measured”.` };
}

/* ── A DE-IDENTIFIKÁCIÓ HATÁRA ───────────────────────────────────────── */

export type DeidAllapot =
  | "deidentifikalhato"
  /** A képen RÁÉGETETT azonosító van — a címketörlés nem segít. */
  | "raegetettAzonosito"
  /** Nem tudjuk, van-e ráégetett azonosító. NEM „nincs”. */
  | "beegetesIsmeretlen"
  /** Az ultrahang- és a szkennelt kép jellemzően ráégetett — külön óvatosság. */
  | "gyanusModalitas";

export interface DeidItelet {
  allapot: DeidAllapot;
  /** Elég-e önmagában a címkealapú tisztítás. */
  cimkeElegendo: boolean;
  miert: string;
}

/**
 * A CÍMKÉK TÖRLÉSE NEM TISZTÍTJA A PIXELEKET — és ez a leggyakoribb tévedés.
 *
 * A PS3.15 Annex E profil a DICOM-CÍMKÉKET távolítja el vagy cseréli. A
 * betegnevet, a TAJ-t és a dátumot viszont sok modalitás RÁÉGETI a képbe:
 * ultrahang, szkennelt papír, képernyőmentés, régi CR. Egy „de-identifikált”
 * DICOM-fájl így a metaadatában tiszta, a pixelein pedig ott a név — és épp
 * ezt küldi el valaki konferenciára vagy közleménybe.
 *
 * A rendszer ezért NEM mondja tisztának azt, amiről nem tudja. A `null`
 * `BurnedInAnnotation` nem „nincs”: a küldő nem nyilatkozott róla.
 */
const RAEGETESRE_GYANUS = new Set(["US", "OT", "SC", "XC", "DOC", "ECG", "IVUS"]);

export function deidentifikalhato(k: PacsKep): DeidItelet {
  if (k.burnedInAnnotation === "YES") {
    return { allapot: "raegetettAzonosito", cimkeElegendo: false,
      miert:
        `A küldő kimondta: RÁÉGETETT azonosító van a képen (0028,0301 = YES). A ` +
        `címkealapú de-identifikáció ezen nem segít — a név a PIXELEKBEN van. Ez ` +
        `a kép álnevesítve sem hagyhatja el az ellátást, amíg valaki a képet ` +
        `magát meg nem tisztítja.` };
  }
  if (k.burnedInAnnotation === null || k.burnedInAnnotation === undefined) {
    const gyanus = k.modality && RAEGETESRE_GYANUS.has(k.modality);
    return {
      allapot: gyanus ? "gyanusModalitas" : "beegetesIsmeretlen",
      cimkeElegendo: false,
      miert:
        `A (0028,0301) mező HIÁNYZIK, tehát nem tudjuk, van-e ráégetett ` +
        `azonosító. Ez NEM „nincs”: a küldő nem nyilatkozott róla.` +
        (gyanus
          ? ` És a modalitás (${k.modality}) azok közé tartozik, ahol a ráégetés ` +
            `a SZOKÁSOS: az ultrahangképre a gép írja rá a nevet, a szkennelt ` +
            `papíron pedig eleve rajta van.`
          : ``) +
        ` A leleten belül a kép így is használható; kifelé (oktatás, közlemény, ` +
        `kutatási export) csak azután, hogy valaki RÁNÉZETT és kimondta.`,
    };
  }
  return { allapot: "deidentifikalhato", cimkeElegendo: true,
    miert:
      `A küldő kimondta, hogy nincs ráégetett azonosító (0028,0301 = NO), tehát ` +
      `a PS3.15 Annex E szerinti címketisztítás elegendő.` };
}

/* ── A CSOMÓPONTKÉSZLET ──────────────────────────────────────────────── */

export interface DicomKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  /** A MI AE title-ünk — ezen a néven ismer minket a PACS. */
  sajatAeTitle: string;
  /** Az oldalkocsi, ami a DICOM-ot beszéli. */
  oldalkocsi: {
    csomag: string;
    licenc: string;
    /** MIT-kompatibilis-e az OGDOC MIT-licencével. */
    osszefer: boolean;
    allapot: "mukodik" | "feltetelreVar" | "tervezett";
    hianyzik: string[];
  };
  csomopontok: Array<DicomCsomopont & {
    szolgaltatasok: DimseSzolgaltatas[];
    /**
     * EZ A CSOMÓPONT AZ ARCHÍVUM-E — vagyis a mi helyi másolatunk törölhető-e,
     * ha ide beküldtük. Ha igen, storage commitment nélkül nem lehet az.
     */
    archivum?: boolean;
    leiras: string;
  }>;
  /** DICOMweb-végpontok. Más bizalmi modell, ezért külön lista. */
  webVegpontok?: DicomWebVegpont[];
}

export function loadDicom(path: string): DicomKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as DicomKeszlet;
}

export interface DicomMerleg {
  csomopont: number;
  tlsNelkul: number;
  szolgaltatas: number;
  oldalkocsiKesz: boolean;
  webVegpont: number;
  /** Hány DICOMweb-végpont megy titkosítatlanul vagy hitelesítés nélkül. */
  webVedtelen: number;
  /** Hány archívumhoz van megőrzési nyugta. A helyi törlés CSAK ezekre épülhet. */
  veglegesithetoArchivum: number;
}

export function merleg(k: DicomKeszlet): DicomMerleg {
  return {
    csomopont: k.csomopontok.length,
    tlsNelkul: k.csomopontok.filter((c) => !c.tls).length,
    szolgaltatas: new Set(k.csomopontok.flatMap((c) => c.szolgaltatasok)).size,
    oldalkocsiKesz: k.oldalkocsi.allapot === "mukodik",
    webVegpont: (k.webVegpontok ?? []).length,
    webVedtelen: (k.webVegpontok ?? []).filter(
      (v) => v.hitelesites === "nincs" || !/^https:\/\//i.test(v.alapUrl)).length,
    veglegesithetoArchivum: k.csomopontok.filter(
      (c) => c.archivum && c.szolgaltatasok.includes("STORAGE-COMMIT")).length,
  };
}

export function validateDicom(k: DicomKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];

  // A LICENC AZ ELSŐ KÉRDÉS, nem az utolsó.
  if (!k.oldalkocsi.osszefer) {
    out.push({ severity: "error", id: "dicom.oldalkocsi",
      message:
        `A DICOM-oldalkocsi licence (${k.oldalkocsi.licenc}) NEM fér össze az ` +
        `OGDOC licencével. A licenckapu megelőzi a technikai megfelelést: egy ` +
        `kiváló könyvtár rossz licenccel nem jöhet szóba, és ezt előbb kell ` +
        `megnézni, mint az API-t.` });
  }
  if (k.oldalkocsi.allapot === "mukodik" && k.oldalkocsi.hianyzik.length) {
    out.push({ severity: "error", id: "dicom.oldalkocsi",
      message:
        `Az oldalkocsi „működik” állapotban van, de ${k.oldalkocsi.hianyzik.length} ` +
        `feltétele hiányzik. A „működik” állítás — hiányzó feltétellel hamis állítás.` });
  }
  if (!/^[A-Za-z0-9_\-]{1,16}$/.test(k.sajatAeTitle)) {
    out.push({ severity: "error", id: "dicom.aeTitle",
      message:
        `A saját AE title („${k.sajatAeTitle}”) érvénytelen: legfeljebb 16 ` +
        `karakter, és a DICOM így azonosít minket. Egy elgépelt AE title nem ` +
        `hibaüzenetet ad, hanem ELUTASÍTOTT TÁRSÍTÁST — és a PACS naplójában ` +
        `sem lesz nyoma, ki próbálkozott.` });
  }
  const latott = new Set<string>();
  for (const c of k.csomopontok) {
    if (latott.has(c.aeTitle)) {
      out.push({ severity: "error", id: c.aeTitle,
        message:
          `Ismétlődő AE title. Két csomópont azonos néven: a válasz ahhoz megy ` +
          `vissza, amelyiket a rendszer előbb talál meg — és ez nem determinisztikus.` });
    }
    latott.add(c.aeTitle);
    if (!/^[A-Za-z0-9_\-]{1,16}$/.test(c.aeTitle)) {
      out.push({ severity: "error", id: c.aeTitle,
        message: `Érvénytelen AE title: legfeljebb 16 karakter.` });
    }
    if (!c.szolgaltatasok.length) {
      out.push({ severity: "error", id: c.aeTitle,
        message: `A(z) „${c.megnevezes}” csomóponthoz nincs szolgáltatás rendelve.` });
    }
    // A C-MOVE ÖNMAGÁBAN NEM ELÉG: a küldő a MI csomópontunkra küld, tehát
    // nekünk C-STORE SCP-nek kell lennünk. Enélkül a lehívás elindul, és a
    // kép SEHOVA nem érkezik meg — a leggyakoribb PACS-integrációs hiba.
    if (c.szolgaltatasok.includes("C-MOVE")
      && !k.csomopontok.some((x) => x.szolgaltatasok.includes("C-STORE"))) {
      out.push({ severity: "error", id: c.aeTitle,
        message:
          `A(z) „${c.megnevezes}” C-MOVE-ot használ, de a készletben egyetlen ` +
          `csomópont sem fogad C-STORE-t. A C-MOVE-nál a KÜLDŐ indítja a ` +
          `küldést a mi csomópontunk felé — ha nincs, aki fogadja, a lehívás ` +
          `elindul, és a kép SEHOVA nem érkezik meg. Ez a leggyakoribb ` +
          `PACS-integrációs hiba, és nem ad hibaüzenetet: csak nem történik semmi.` });
    }
    // AZ ARCHÍVUM STORAGE COMMITMENT NÉLKÜL NEM ARCHÍVUM.
    // A C-STORE sikere annyit jelent: „megkaptam”. Ha erre a csomópontra
    // hivatkozva töröljük a helyi másolatot, a törlés egy olyan állításra
    // épül, amit soha senki nem tett meg.
    if (c.archivum && !c.szolgaltatasok.includes("STORAGE-COMMIT")) {
      out.push({ severity: "error", id: c.aeTitle,
        message:
          `A(z) „${c.megnevezes}” ARCHÍVUMKÉNT van megjelölve, de nem nyújt ` +
          `storage commitmentet. A C-STORE sikeres státusza csak ÁTVÉTELT ` +
          `jelent, nem megőrzést — véglegesítés nélkül a helyi másolat törlése ` +
          `végleges képvesztés lenne, miközben formailag minden sikerült. Vagy ` +
          `a szolgáltatás kell, vagy az „archívum” jelölés hamis.` });
    }
    // A MUNKALISTA VISSZAJELZÉS NÉLKÜL NEM ZÁRÓDIK LE.
    if (c.szolgaltatasok.includes("MWL") && !c.szolgaltatasok.includes("MPPS")) {
      out.push({ severity: "warning", id: c.aeTitle,
        message:
          `A(z) „${c.megnevezes}” ad munkalistát (MWL), de nem fogad MPPS-t. A ` +
          `tétel így örökre „ütemezett” marad: nem derül ki, hogy a vizsgálat ` +
          `ELMARADT-e, félbeszakadt, vagy csak nem zárta le senki. A három nem ` +
          `ugyanaz, és a beteg szempontjából a legelső a fontos.` });
    }
    if (!c.tls) {
      out.push({ severity: "warning", id: c.aeTitle,
        message:
          `A(z) „${c.megnevezes}” kapcsolat NEM titkosított. A DICOM alapból ` +
          `nyílt: a képadat és a betegazonosító titkosítatlanul megy a ` +
          `hálózaton. Intézményen belül is kockázat, intézmények között ` +
          `elfogadhatatlan.` });
    }
  }

  /* ── DICOMweb: MÁS BIZALMI MODELL, MÁS SZABÁLYOK ───────────────────── */
  const webLatott = new Set<string>();
  for (const v of k.webVegpontok ?? []) {
    if (webLatott.has(v.id)) {
      out.push({ severity: "error", id: v.id, message: `Ismétlődő végpontazonosító.` });
    }
    webLatott.add(v.id);
    // A DIMSE-NÉL AZ ALAPÁLLAPOT A TILTÁS, ITT AZ ENGEDÉS.
    if (v.hitelesites === "nincs") {
      out.push({ severity: "error", id: v.id,
        message:
          `A(z) „${v.megnevezes}” DICOMweb-végpont HITELESÍTÉS NÉLKÜL van ` +
          `beállítva. Ez nem lazább beállítás, hanem másik kategória: a ` +
          `DIMSE-nél egy ismeretlen AE title elutasított társítást kap, itt ` +
          `viszont nincs, ami megfogja — az URL-t ismerő bárki lekérdezhet.` });
    }
    if (!/^https:\/\//i.test(v.alapUrl)) {
      out.push({ severity: "error", id: v.id,
        message:
          `A(z) „${v.megnevezes}” végpont URL-je nem „https://”. HTTP-n nemcsak ` +
          `a képadat megy nyíltan, hanem a HITELESÍTŐ ADAT is — és a ` +
          `study-azonosítók megjelennek a köztes gyorsítótárak és a ` +
          `proxynaplók soraiban.` });
    }
    if (v.szolgaltatasok.includes("STOW-RS") && v.megorzesiNyugta !== true) {
      out.push({ severity: v.megorzesiNyugta === null ? "error" : "warning", id: v.id,
        message:
          `A(z) „${v.megnevezes}” fogad STOW-RS-t, de a megőrzési nyugta ` +
          (v.megorzesiNyugta === null
            ? `ISMERETLEN. A „null” itt sem „igen”: amíg nem tudjuk, a beküldött ` +
              `kép helyi másolata nem törölhető, és ezt ki kell mondani, nem ` +
              `elhagyni.`
            : `hiányzik. A STOW-RS 200-as válasza — akárcsak a C-STORE sikere — ` +
              `ÁTVÉTELT jelent, nem megőrzést.`) });
    }
    if (!v.szolgaltatasok.length) {
      out.push({ severity: "error", id: v.id,
        message: `A(z) „${v.megnevezes}” végponthoz nincs szolgáltatás rendelve.` });
    }
  }
  return out;
}
