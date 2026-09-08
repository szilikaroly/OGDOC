/**
 * KÉPVÁLASZTÁS A PACS-BÓL A LELETRE.
 *
 * A funkció ártatlanul hangzik: a vizsgálatnál a felhasználó kikeres egy képet
 * a PACS-ból, és ráteszi a leletre. Három módon tud csendben elromlani, és
 * mind a három olyan hibát ad, ami HELYESNEK LÁTSZIK.
 *
 * 1. MÁSIK BETEG KÉPE.
 *
 * Egy szabad PACS-keresés a teljes archívumot látja. Egy elgépelt név, egy
 * hasonló születési dátum, egy rossz sorra kattintás — és a leleten másik
 * beteg képe van, a helyes szöveg mellett. Ez nem elméleti: pontosan ezért
 * létezik a Modality Worklist, és pontosan ezért az `accession number` a
 * lánc kulcsa.
 *
 * A modul ezért NEM enged szabad keresést a lelethez. A választék a KÉRÉSHEZ
 * tartozó accession numberre szűkül, és a betegazonosság ellenőrzése ugyanazon
 * a kapun megy át, mint a beérkező leleteké (`matchPatient`): legalább KÉT
 * független azonosító, és egyetlen ellentmondás mindent megállít. A név nem
 * azonosító.
 *
 * 2. A KÉP MEGVÁLTOZIK A LELET ALATT.
 *
 * A PACS-ban egy vizsgálat javítható, pótolható, cserélhető. Ha a lelet csak
 * annyit rögzít, hogy „a vizsgálat harmadik képe”, akkor egy javítás után a
 * lelet más képre mutat, mint amiről készült — és semmi nem jelzi. Ezért a
 * csatolás a SOP Instance UID-ot rögzíti, és ha van, a képadat lenyomatát:
 * a lelet ahhoz a képhez köt, amit a leletíró látott.
 *
 * 3. ÉS A HARMADIK, AMI A 31. MODUL SZŰRÉSÉT IS ÁTVERI: A KÉPBE ÉGETETT NÉV.
 *
 * Az ultrahangképek túlnyomó része a beteg nevét, azonosítóját és a vizsgálat
 * dátumát A PIXELEKBE ÉGETVE hordozza. A DICOM-fejléc anonimizálása ezen nem
 * változtat, és a szöveges PHI-szűrés (31. modul) sem látja: a névnek ott nincs
 * karakterkódja, csak világos pixelei.
 *
 * A DICOM erre való mezője a `BurnedInAnnotation` (0028,0301). Három állapota
 * van, és a HARMADIK a lényeg:
 *
 *   nincs           "NO"  — a küldő kimondta, hogy nincs beleégetve
 *   van             "YES" — van; a kép így nem hagyhatja el az ellátást
 *   nemNyilatkozik  a mező HIÁNYZIK — és ez NEM „nincs”
 *
 * A hiányzó mező a leggyakoribb eset, és pont ezért veszélyes: a rendszer nem
 * mondhatja rá, hogy tiszta. A leleten belül a kép így is használható — a
 * kifelé menő úton (oktatás, közlemény, nyilvános oldal, kutatási export)
 * viszont nem, amíg valaki rá nem néz és ki nem mondja.
 */
import type { IdentityClaim } from "../interop/types.ts";
import { matchPatient } from "../interop/types.ts";

/* ── AMIT A PACS AD ──────────────────────────────────────────────────── */

export interface PacsKep {
  /** SOP Instance UID — ez azonosítja A KÉPET, nem a sorrendje. */
  sopInstanceUid: string;
  seriesInstanceUid: string;
  studyInstanceUid: string;
  /** A kérés azonosítója; ez köti a képet a rendeléshez. */
  accession?: string | null;
  modality?: string | null;
  /** Mikor készült. */
  keszult?: string | null;
  /** A PACS által közölt betegazonosítók. */
  beteg: IdentityClaim;
  /** DICOM (0028,0301). A HIÁNYA nem „NO”. */
  burnedInAnnotation?: "YES" | "NO" | null;
  /** A képadat lenyomata, ha a PACS adja. */
  sha256?: string | null;
  leiras?: string | null;
}

/* ── A VÁLASZTHATÓSÁG ────────────────────────────────────────────────── */

export type ValasztasAllapot =
  | "valaszthato"
  /** A betegazonosság nem áll — MÁSIK BETEG képe lehet. */
  | "masikBeteg"
  /** Az azonosítók nem mondanak ellent, de kevesen vannak: emberi döntés. */
  | "emberiDontes"
  /** A kép nem ehhez a kéréshez tartozik. */
  | "masKeres"
  /** Nincs SOP Instance UID — a kép nem azonosítható vissza. */
  | "azonosithatatlan";

export interface ValasztasItelet {
  allapot: ValasztasAllapot;
  valaszthato: boolean;
  /** Hány FÜGGETLEN azonosító egyezett. A név nem az. */
  egyezoAzonositok: string[];
  miert: string;
}

export interface Kontextus {
  /** Az eset betege — amivel a PACS adatait össze kell vetni. */
  beteg: IdentityClaim;
  /**
   * A kéréshez tartozó accession numberek. ÜRES LISTA = nincs kérés, és akkor
   * a lelethez nem választható kép: a szabad keresés az a mód, ahogy másik
   * beteg képe a leletre kerül.
   */
  accessionok: string[];
}

export function valaszthato(k: PacsKep, ctx: Kontextus): ValasztasItelet {
  if (!k.sopInstanceUid?.trim()) {
    return { allapot: "azonosithatatlan", valaszthato: false, egyezoAzonositok: [],
      miert:
        `A képnek nincs SOP Instance UID-ja, tehát nem azonosítható vissza. A ` +
        `„vizsgálat harmadik képe” hivatkozás egy PACS-javítás után MÁS képre ` +
        `mutat, és semmi nem jelzi.` };
  }
  const m = matchPatient(k.beteg, ctx.beteg);
  if (m.outcome === "noMatch") {
    return { allapot: "masikBeteg", valaszthato: false, egyezoAzonositok: m.agreeing,
      miert:
        `A kép betegazonosítói nem állítják, hogy ez a beteg képe. ${m.why} A ` +
        `leleten másik beteg képe a helyes szöveg mellett tökéletesen helyesnek ` +
        `látszik — ezt csak itt lehet megállítani.` };
  }
  if (m.outcome === "review") {
    return { allapot: "emberiDontes", valaszthato: false, egyezoAzonositok: m.agreeing,
      miert: `${m.why} A kép csak megnevezett ember jóváhagyásával csatolható.` };
  }
  if (!ctx.accessionok.length) {
    return { allapot: "masKeres", valaszthato: false, egyezoAzonositok: m.agreeing,
      miert:
        `Ehhez az esethez nincs vizsgálatkérés (accession number), amihez a kép ` +
        `köthető volna. A LELETHEZ NEM SZABAD KERESÉS TARTOZIK: a kérés köti ` +
        `össze a képet, a leletet és a beteget, és a szabad archívumkeresés ` +
        `pontosan az a mód, ahogy másik beteg képe a leletre kerül.` };
  }
  if (!k.accession || !ctx.accessionok.includes(k.accession)) {
    return { allapot: "masKeres", valaszthato: false, egyezoAzonositok: m.agreeing,
      miert:
        `A kép accession numbere (${k.accession ?? "nincs"}) nem szerepel az ` +
        `esethez tartozó kérések között (${ctx.accessionok.join(", ")}). A ` +
        `betegazonosság egyezik, de a kép MÁSIK vizsgálatból való — az ` +
        `összekötés az accession numberen át történik.` };
  }
  return { allapot: "valaszthato", valaszthato: true, egyezoAzonositok: m.agreeing,
    miert:
      `A kép ehhez a beteghez és ehhez a kéréshez tartozik ` +
      `(${m.agreeing.join(", ")}; accession ${k.accession}).` };
}

/* ── A BELEÉGETETT ANNOTÁCIÓ ─────────────────────────────────────────── */

export type BeegetesAllapot = "nincs" | "van" | "nemNyilatkozik";

export interface BeegetesItelet {
  allapot: BeegetesAllapot;
  /** Kimehet-e az ellátáson KÍVÜLRE (oktatás, közlemény, kutatás, weboldal). */
  kifeleAdhato: boolean;
  miert: string;
}

export function beegetes(k: PacsKep): BeegetesItelet {
  if (k.burnedInAnnotation === "NO") {
    return { allapot: "nincs", kifeleAdhato: true,
      miert:
        `A küldő kimondta, hogy nincs beleégetett annotáció (BurnedInAnnotation ` +
        `= NO). Ez KIMONDÁS, nem mérés — a felelősség a küldőé.` };
  }
  if (k.burnedInAnnotation === "YES") {
    return { allapot: "van", kifeleAdhato: false,
      miert:
        `A képbe BELE VAN ÉGETVE azonosító adat (BurnedInAnnotation = YES). A ` +
        `DICOM-fejléc anonimizálása ezen nem változtat, és a szöveges ` +
        `PHI-szűrés sem látja: a névnek a pixelekben nincs karakterkódja. A kép ` +
        `az ellátáson belül használható, kifelé nem.` };
  }
  return { allapot: "nemNyilatkozik", kifeleAdhato: false,
    miert:
      `A BurnedInAnnotation mező HIÁNYZIK — és ez NEM „nincs”. Ez a leggyakoribb ` +
      `eset, és pont ezért veszélyes: az ultrahangképek túlnyomó része a nevet és ` +
      `a dátumot a pixelekbe égetve hordozza. A rendszer nem mondhatja rá, hogy ` +
      `tiszta; a leleten belül használható, kifelé csak akkor, ha valaki ránéz és ` +
      `kimondja.` };
}

/* ── A CSATOLÁS ──────────────────────────────────────────────────────── */

export interface Csatolas {
  sopInstanceUid: string;
  studyInstanceUid: string;
  accession: string;
  /** A lelet ehhez a lenyomathoz köt, ha a PACS adta. */
  sha256: string | null;
  /** Ki választotta ki. Nem a rendszer választ. */
  valasztotta: string;
  mikor: string;
  beegetes: BeegetesAllapot;
  /** Csak akkor igaz, ha megnevezett ember kimondta a `nemNyilatkozik` esetben. */
  kifeleAdhato: boolean;
}

export type CsatolasAllapot = "csatolva" | "elutasitva";

export interface CsatolasItelet {
  allapot: CsatolasAllapot;
  csatolas: Csatolas | null;
  miert: string;
}

export function csatol(
  k: PacsKep, ctx: Kontextus, valasztotta: string, mikor: string,
  /** A `nemNyilatkozik` esetet feloldó, MEGNEVEZETT kimondás. */
  beegetestKimondta?: { ki: string; nincsBeegetve: boolean },
): CsatolasItelet {
  const v = valaszthato(k, ctx);
  if (!v.valaszthato) {
    return { allapot: "elutasitva", csatolas: null, miert: v.miert };
  }
  if (!valasztotta?.trim()) {
    return { allapot: "elutasitva", csatolas: null,
      miert:
        `Nincs megnevezve, KI választotta a képet. A képválasztás klinikai ` +
        `döntés — a rendszer felkínál, de nem választ.` };
  }
  const b = beegetes(k);
  let kifele = b.kifeleAdhato;
  if (b.allapot === "nemNyilatkozik" && beegetestKimondta?.ki?.trim()) {
    kifele = beegetestKimondta.nincsBeegetve;
  }
  return { allapot: "csatolva",
    csatolas: {
      sopInstanceUid: k.sopInstanceUid, studyInstanceUid: k.studyInstanceUid,
      accession: k.accession!, sha256: k.sha256 ?? null,
      valasztotta, mikor, beegetes: b.allapot, kifeleAdhato: kifele,
    },
    miert: `${v.miert} ${b.miert}` };
}

/**
 * A LELETRE CSATOLT KÉP MÉG UGYANAZ-E.
 *
 * A PACS-ban a vizsgálat javítható. Ha a lenyomat megvan és megváltozott, a
 * lelet MÁS képre mutat, mint amiről készült.
 */
export type EpsegAllapot = "valtozatlan" | "megvaltozott" | "nemEllenorizheto" | "eltunt";

export function epseg(cs: Csatolas, mostani: PacsKep | null): { allapot: EpsegAllapot; miert: string } {
  if (!mostani) {
    return { allapot: "eltunt",
      miert:
        `A csatolt kép (${cs.sopInstanceUid}) ma nincs meg a PACS-ban. A lelet ` +
        `olyan képre hivatkozik, ami nem hívható le — ez nem megjelenítési hiba, ` +
        `hanem a lelet fedezetének elvesztése.` };
  }
  if (!cs.sha256 || !mostani.sha256) {
    return { allapot: "nemEllenorizheto",
      miert:
        `A képadat lenyomata hiányzik (csatoláskor: ` +
        `${cs.sha256 ? "megvolt" : "nem volt"}, most: ` +
        `${mostani.sha256 ? "van" : "nincs"}), ezért nem tudjuk megmondani, ` +
        `ugyanaz a kép-e. A SOP Instance UID egyezik — de a PACS a UID ` +
        `megtartásával is cserélhet képadatot.` };
  }
  return cs.sha256 === mostani.sha256
    ? { allapot: "valtozatlan", miert: `A kép lenyomata változatlan.` }
    : { allapot: "megvaltozott",
        miert:
          `A KÉP MEGVÁLTOZOTT a csatolás óta (lenyomat: ${cs.sha256.slice(0, 12)}… → ` +
          `${mostani.sha256.slice(0, 12)}…). A lelet arról a képről készült, ami ` +
          `már nincs ott.` };
}
