/**
 * GYERMEKNŐGYÓGYÁSZAT — a nőgyógyászat almodulja, más szabályokkal.
 *
 * Ez nem „ugyanaz kisebb betegen”. Három dolog KÜLÖNBÖZIK, és mindhárom
 * olyan, amit a felnőttellátásból átvett minta csendben elront:
 *
 *   1. A VIZSGÁLAT MÓDJA. Pubertás előtt a tükrös feltárás nem szűkebb
 *      indikációjú, hanem NEM ELFOGADHATÓ rutin. Ha vaginális látótér kell,
 *      az vaginoszkópia, altatásban. Ez nem óvatoskodás: a felnőttmintát
 *      követő vizsgálat fájdalmas, sérülést okoz, és elveszi a gyermek
 *      bizalmát attól az ellátástól, amit később önként kellene keresnie.
 *
 *   2. A BELEEGYEZÉS ÉS A TITOKTARTÁS. Nem egy aláírás, hanem viszony:
 *      ki egyezett bele, megkérdezték-e a kiskorút magát, és tudja-e a
 *      serdülő, MI AZ, amit nem tarthatunk titokban. Az utolsó a lényeg —
 *      a bántalmazás jelzési kötelezettséggel jár, és ezt ELŐRE kell
 *      elmondani, nem utólag.
 *
 *   3. A BÁNTALMAZÁS MÉRLEGELÉSE. Itt a rendszer a szokásos szabályát
 *      megfordítja. Máshol a meg nem kérdezett kérdés „hiány”. Itt a
 *      MÉRLEGELÉS ELMARADÁSA maga a piros zászló — mert a gyermekvédelmi
 *      mulasztások túlnyomó része nem téves ítélet, hanem elmaradt kérdés,
 *      és ezt visszamenőleg senki nem pótolja.
 *
 * AMIT A RENDSZER ITT NEM TESZ, ÉS SOHA NEM IS FOG:
 *
 *   · nem állapít meg bántalmazást, és nem is zárja ki;
 *   · nem ad DSD-besorolást és nemi hovatartozásra vonatkozó javaslatot;
 *   · nem mond „időben zajló pubertást” arról, akiről nincs adata.
 *
 * Az első kettő azért, mert ezek nem egy szoftver döntései. A harmadik
 * azért, mert a hiányzó adat sehol nem „nem” — és itt sem az.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { nemTudja, resolve } from "../derive/resolve.ts";

/* ── ÉLETKORI SZAKASZ ────────────────────────────────────────────────── */

export type Szakasz = "prepubertas" | "pubertas" | "serdulo" | "ismeretlen";

/**
 * Melyik szakaszban van — és `ismeretlen`, ha nem tudjuk.
 *
 * A szakaszt NEM az életkor egyedül dönti el: egy 9 éves lehet már
 * pubertásban, egy 13 éves még nem. Ezért a Tanner-stádium erősebb jel, és
 * az életkor csak akkor dönt, ha stádium nincs.
 */
export function szakasz(reg: Registry, state: CaseState): Szakasz {
  const b = resolve(reg, state, "status.fert.tanner.breast");
  const kor = resolve(reg, state, "patient.age");

  if (b.state === "ok" && typeof b.value === "number") {
    if (b.value <= 1) return "prepubertas";
    if (b.value >= 4) return "serdulo";
    return "pubertas";
  }
  if (kor.state === "ok" && typeof kor.value === "number") {
    if (kor.value < 8) return "prepubertas";
    if (kor.value < 14) return "pubertas";
    if (kor.value < 18) return "serdulo";
  }
  return "ismeretlen";
}

/* ── A VIZSGÁLAT MÓDJA ───────────────────────────────────────────────── */

export interface VizsgalatiItelet {
  /** Elfogadható-e a választott vizsgálati mód ebben a szakaszban. */
  elfogadhato: boolean;
  /** Ha nem: MI helyette. Nem tiltás önmagában — irány is. */
  helyette: string | null;
  miert: string | null;
}

/**
 * Megengedhető-e a választott vizsgálati mód. FAIL-CLOSED az ismeretlen
 * szakaszra is: ha nem tudjuk, hol tart a gyermek, a tükrös feltárás nem
 * kap zöld jelzést.
 */
export function vizsgalatiUt(
  szak: Szakasz, mod: string | null | undefined,
): VizsgalatiItelet {
  const ok = { elfogadhato: true, helyette: null, miert: null };
  if (!mod || mod === "notNeeded" || mod === "declined") return ok;

  if (mod === "speculum" && (szak === "prepubertas" || szak === "ismeretlen")) {
    return {
      elfogadhato: false,
      helyette: "vaginoscopy",
      miert:
        szak === "prepubertas"
          ? "pubertás előtt a tükrös feltárás nem elfogadható rutin: fájdalmas, " +
            "sérülést okozhat, és a hymen sérülhet. Ha vaginális látótér kell, " +
            "az vaginoszkópia — altatásban vagy szedálásban"
          : "a pubertás állapota nem ismert, tükrös feltáráshoz pedig tudni kell, " +
            "hol tart a gyermek. A hiányzó adat itt nem „felnőtt”",
    };
  }
  return ok;
}

/* ── AMIRE A VIZIT VÉGÉN VÁLASZ KELL ─────────────────────────────────── */

export type ZaszloSuly = "piros" | "hianyzoMerlegeles" | "tisztazando";

export interface Zaszlo {
  suly: ZaszloSuly;
  mezo: string;
  mit: string;
  /** A következő lépés — megnevezve, nem „konzultáljon”. */
  teendo: string;
}

const SZOVEG = (lang: Lang) => lang; // egyelőre magyar; a szótár később bővül

/**
 * A gyermeknőgyógyászati vizit zászlói.
 *
 * A három súly nem fokozat, hanem HÁROM KÜLÖNBÖZŐ TEENDŐ:
 *
 *   piros              — most kell tenni valamit;
 *   hianyzoMerlegeles  — egy kérdés nem hangzott el, és ez maga a hiba;
 *   tisztazando        — a beteg elengedése előtt tisztázandó.
 */
export function zaszlok(reg: Registry, state: CaseState, lang: Lang = "hu"): Zaszlo[] {
  SZOVEG(lang);
  const ki: Zaszlo[] = [];
  const ertek = (id: string): unknown => {
    const r = resolve(reg, state, id);
    return r.state === "ok" ? r.value : undefined;
  };

  // 1. A MÉRLEGELÉS ELMARADÁSA. Ez az egyetlen hely a rendszerben, ahol a
  //    meg nem kérdezett kérdés önmagában zászló.
  const merlegelt = ertek("pedgyn.safeguarding.asked");
  if (merlegelt === undefined || merlegelt === "notAsked") {
    ki.push({
      suly: "hianyzoMerlegeles", mezo: "pedgyn.safeguarding.asked",
      mit:
        merlegelt === undefined
          ? "a bántalmazás lehetőségének mérlegelése nincs rögzítve"
          : "a bántalmazás lehetőségét NEM mérlegelték",
      teendo:
        "a kérdés feltevése és a válasz rögzítése — nem a bántalmazás " +
        "feltételezése, hanem a mérlegelés dokumentálása",
    });
  }

  const gyanu = ertek("pedgyn.safeguarding.concern");
  if (gyanu === "yes" || gyanu === "uncertain") {
    const jelzes = ertek("pedgyn.report.made");
    ki.push({
      suly: gyanu === "yes" ? "piros" : "tisztazando",
      mezo: "pedgyn.safeguarding.concern",
      mit: gyanu === "yes" ? "bántalmazás gyanúja áll fenn" : "a gyanú bizonytalan",
      teendo:
        jelzes === "pos"
          ? "a jelzés megtörtént — a dokumentáció szó szerinti idézeteit ellenőrizni kell"
          : "gyermekvédelmi konzultáció a beteg elengedése ELŐTT; a jelzési " +
            "kötelezettség a gyanútól függ, nem a bizonyosságtól",
    });
  }

  // 2. A lelet és a történet viszonya — a felismerés legerősebb egyetlen jelzője.
  if (ertek("pedgyn.trauma.consistent") === "no") {
    ki.push({
      suly: "piros", mezo: "pedgyn.trauma.consistent",
      mit: "a sérülés nem magyarázható az elmondott mechanizmussal",
      teendo: "gyermekvédelmi konzultáció, és az elbeszélés SZÓ SZERINTI rögzítése",
    });
  }

  // 3. Pubertás előtti vérzés — mindig kivizsgálandó, és a „nem kérdeztük”
  //    nem ugyanaz, mint a „nem volt”.
  const szak = szakasz(reg, state);
  const verzes = ertek("pedgyn.bleeding.prepubertal");
  if (verzes === "yes") {
    ki.push({
      suly: "piros", mezo: "pedgyn.bleeding.prepubertal",
      mit: "pubertás előtti genitális vérzés",
      teendo:
        "kivizsgálás: idegentest, trauma, lichen sclerosus, korai pubertás, " +
        "ritkán hormontermelő daganat — és a bántalmazás mérlegelése",
    });
  } else if (szak === "prepubertas" && (verzes === undefined || verzes === "notAsked")) {
    ki.push({
      suly: "hianyzoMerlegeles", mezo: "pedgyn.bleeding.prepubertal",
      mit: "pubertás előtti korban a vérzés kérdése nem hangzott el",
      teendo: "megkérdezni — a meg nem kérdezett kérdés nem „nem volt vérzés”",
    });
  }

  // 4. Bűzös vagy véres váladék: idegentest, nem újabb antibiotikum.
  const valadek = ertek("pedgyn.discharge");
  if (valadek === "foul" || valadek === "bloody") {
    if (ertek("pedgyn.foreignBody") === undefined) {
      ki.push({
        suly: "tisztazando", mezo: "pedgyn.foreignBody",
        mit: `${valadek === "foul" ? "bűzös" : "véres"} váladék, idegentest kizárása nélkül`,
        teendo: "vaginoszkópia mérlegelése — ismételt antibiotikum helyett",
      });
    }
  }

  // 5. A jogi keret. Nem adminisztráció: enélkül a vizsgálat maga válik
  //    utólag megkérdőjelezhetővé.
  if (ertek("pedgyn.consent.who") === "none") {
    ki.push({
      suly: "piros", mezo: "pedgyn.consent.who",
      mit: "a vizsgálat beleegyezés dokumentálása nélkül történt",
      teendo: "a beleegyezés körülményeinek utólagos rögzítése és tisztázása",
    });
  }
  if (szak === "serdulo" && ertek("pedgyn.confidentiality.discussed") !== "pos") {
    ki.push({
      suly: "tisztazando", mezo: "pedgyn.confidentiality.discussed",
      mit: "a titoktartás kerete nem volt megbeszélve a serdülővel",
      teendo:
        "elmondani, mit tartunk bizalmasan — és mit NEM tarthatunk annak. " +
        "Ez a válaszok őszinteségét dönti el",
    });
  }

  return ki;
}

/* ── PUBERTÁS IDŐZÍTÉSE ──────────────────────────────────────────────── */

export interface PubertasItelet {
  itelet: "korai" | "kesoi" | "idoben" | "nemMegitelheto";
  miert: string;
  /** Amit meg kellene kérdezni ahhoz, hogy megítélhető legyen. */
  hianyzik: string[];
}

/**
 * A pubertás időzítése — vagy a kimondott „nem megítélhető”.
 *
 * A rendszer NEM sorol be „időben”-nek olyat, akiről nincs adat. Egy
 * megnyugtató besorolás hiányzó adatból rosszabb a besorolás hiányánál:
 * a hiány látszik, a téves megnyugtatás nem.
 */
export function pubertasIdozites(reg: Registry, state: CaseState): PubertasItelet {
  const hianyzik: string[] = [];
  const num = (id: string): number | undefined => {
    const r = resolve(reg, state, id);
    if (r.state !== "ok" || typeof r.value !== "number") { hianyzik.push(id); return undefined; }
    if (nemTudja(reg, id, r.value)) { hianyzik.push(id); return undefined; }
    return r.value;
  };

  const kor = num("patient.age");
  const thelarche = num("pedgyn.thelarche.age");
  const menarche = num("hx.repro.menarche");

  if (thelarche !== undefined && thelarche < 8) {
    return {
      itelet: "korai", hianyzik: [],
      miert: `a mellfejlődés ${thelarche} évesen indult (< 8 év) — korai pubertás gyanúja`,
    };
  }
  if (thelarche !== undefined && thelarche >= 13) {
    return {
      itelet: "kesoi", hianyzik: [],
      miert: `a mellfejlődés ${thelarche} évesen indult (≥ 13 év) — késői pubertás`,
    };
  }
  // 13 év felett HIÁNYZÓ mellfejlődés — de ezt csak MEGFIGYELÉSBŐL mondjuk ki,
  // nem adathiányból. A B1 stádium állítás; a ki nem töltött thelarche-életkor
  // nem az. A kettő összemosása pontosan az a hiba, ami ellen az egész modul
  // épül: egy 14 évesre azért mondani „késői pubertás”, mert nem kérdeztük meg.
  const b = resolve(reg, state, "status.fert.tanner.breast");
  if (kor !== undefined && kor >= 13 && b.state === "ok" && b.value === 1) {
    return {
      itelet: "kesoi", hianyzik: [],
      miert: "13 éves kor felett a mell Tanner-stádiuma B1 — nincs mellfejlődés",
    };
  }
  if (kor !== undefined && menarche === undefined && kor >= 15
      && hianyzik.includes("hx.repro.menarche")) {
    // Nem tudjuk, volt-e menarche — ez NEM „nem volt”.
    return {
      itelet: "nemMegitelheto", hianyzik,
      miert: "15 éves kor felett a menarche ténye nincs rögzítve — ez nem ugyanaz, mint hogy nem volt",
    };
  }
  if (menarche !== undefined && menarche >= 15) {
    return { itelet: "kesoi", hianyzik: [], miert: `a menarche ${menarche} évesen volt (≥ 15 év)` };
  }
  if (thelarche !== undefined && menarche !== undefined) {
    return { itelet: "idoben", hianyzik: [], miert: "a thelarche és a menarche is a szokásos időben" };
  }
  return {
    itelet: "nemMegitelheto", hianyzik,
    miert: "a pubertás időzítéséhez szükséges adatok hiányoznak — besorolás nem születik",
  };
}
