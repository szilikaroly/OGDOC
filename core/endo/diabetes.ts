/**
 * DIABETOLÓGIA A TERHESSÉGBEN — két különböző betegség egy néven.
 *
 * A rendszer eddig egyetlen dolgot tudott: hogy van-e cukorbetegség. Ez a mező
 * a legrosszabb helyen mos össze két kórképet:
 *
 *                       GDM (terhességi)        PRAEGESTATIÓS (1-es/2-es)
 *   Mikor derül ki      24–28. hét szűréssel    a terhesség ELŐTT ismert
 *   Magzati kockázat    II–III. trimeszter      A SZERVFEJLŐDÉS IDEJÉN IS
 *   HbA1c szerepe       korlátozott             a fogamzás előtti a legfontosabb
 *   Kezelés             diéta → metformin/inzulin   meglévő kezelés ÁTÁLLÍTÁSA
 *   Szülés után         ÚJRAÉRTÉKELÉS           folytatódik
 *
 * A KÜLÖNBSÉG IDŐBELI, ÉS EZÉRT NEM SÚLYOSSÁGI. Egy praegestatiós diabéteszes
 * első trimeszterében a magzati szervfejlődés zajlik a rossz anyagcsere
 * mellett — a GDM-nél ez a szakasz már elmúlt, mire a diagnózis megszületik.
 * Egy „diabetes: igen” mező mindkettőre ugyanazt a teendőt adná, és a
 * praegestatiós esetben a legfontosabb ablak — a fogamzás előtti gondozás —
 * már be sem kerülne a képbe.
 *
 * ÉS A SZÜLÉS UTÁNI ÚJRAÉRTÉKELÉS AZ, AMI A LEGGYAKRABBAN ELMARAD.
 *
 * A terhességi cukorbetegség nem szűnik meg a szüléssel — csak nem mérik
 * többé. A rendszer ezt az elmaradást a 15. modul mintájára JELKÉNT kezeli,
 * nem hiányként: az esedékes, be nem jegyzett újraértékelés ugyanúgy sor a
 * listán, mint az elmaradt védőnői látogatás.
 */
import type { RegistryIssue } from "../registry.ts";

/* ── A KÉT (HÁROM) ENTITÁS ───────────────────────────────────────────── */

export type DiabetesFajta =
  /** A terhesség alatt derült ki, korábban nem volt ismert. */
  | "gdm"
  /** A terhesség előtt ismert 1-es típus. */
  | "praeT1"
  /** A terhesség előtt ismert 2-es típus. */
  | "praeT2"
  /** Nincs. */
  | "nincs"
  /** Nem tudjuk. NEM „nincs”. */
  | "ismeretlen";

export interface DiabetesAllas {
  fajta: DiabetesFajta;
  /** A GDM diagnózisának gesztációs hete. */
  diagnozisGaHet?: number | null;
  /** Ismert-e a fogamzás előtti HbA1c — praegestatiósnál ez a legfontosabb szám. */
  fogamzasElottiHba1c?: number | null;
}

export type AblakAllapot =
  /** A szervfejlődés ideje — praegestatiósnál ez már kockázat alatt áll. */
  | "szervfejlodes"
  /** A GDM szűrésének ablaka. */
  | "szuresiAblak"
  /** Növekedési és szülés körüli kockázat. */
  | "kesoiKockazat"
  /** Nem értelmezhető: nem terhes vagy ismeretlen. */
  | "nemErtelmezheto";

export interface KockazatiAblak {
  allapot: AblakAllapot;
  /** Fennáll-e MOST magzati kockázat ebből a kórképből. */
  magzatiKockazat: boolean;
  miert: string;
}

/**
 * MELYIK ABLAKBAN VAGYUNK — és ez a két kórképnél MÁS.
 *
 * A praegestatiós diabétesznél a 4–10. hét (szervfejlődés) már kockázat alatt
 * áll; a GDM-nél ez a szakasz a diagnózis előtt elmúlt, és ott a kockázat a
 * növekedésé és a szülés körüli szakaszé.
 */
export function kockazatiAblak(d: DiabetesAllas, gaHet: number | null): KockazatiAblak {
  if (d.fajta === "ismeretlen") {
    return { allapot: "nemErtelmezheto", magzatiKockazat: false,
      miert:
        `A cukorbetegség fennállása ismeretlen. EZ NEM „NINCS”: a praegestatiós ` +
        `diabétesz legfontosabb ablaka — a fogamzás előtti gondozás — pontosan ` +
        `akkor marad ki, ha a kérdés fel sem merül.` };
  }
  if (d.fajta === "nincs" || gaHet == null) {
    return { allapot: "nemErtelmezheto", magzatiKockazat: false,
      miert: d.fajta === "nincs"
        ? `Nincs cukorbetegség.`
        : `A gesztációs kor ismeretlen, az ablak nem határozható meg.` };
  }
  const prae = d.fajta === "praeT1" || d.fajta === "praeT2";
  if (gaHet < 11) {
    return prae
      ? { allapot: "szervfejlodes", magzatiKockazat: true,
          miert:
            `SZERVFEJLŐDÉS (${gaHet}. hét) PRAEGESTATIÓS DIABÉTESZ MELLETT. A ` +
            `magzati kockázat MOST áll fenn, nem később: a fejlődési ` +
            `rendellenességek kockázata a fogamzás körüli anyagcserétől függ. ` +
            `A fogamzás előtti HbA1c ${d.fogamzasElottiHba1c != null
              ? `${d.fogamzasElottiHba1c}%` : `NEM ISMERT — és ez a legfontosabb szám`}.` }
      : { allapot: "szervfejlodes", magzatiKockazat: false,
          miert:
            `Szervfejlődés (${gaHet}. hét). Terhességi cukorbetegség ilyenkor még ` +
            `nem derül ki, és a szervfejlődés a diagnózis előtt lezajlik — ezért ` +
            `nem ugyanaz a kórkép, mint a praegestatiós.` };
  }
  if (gaHet < 24) {
    return { allapot: "szuresiAblak", magzatiKockazat: prae,
      miert: prae
        ? `${gaHet}. hét, praegestatiós diabétesz — a kockázat folyamatos.`
        : `${gaHet}. hét: a GDM szűrése a 24–28. hétre esik.` };
  }
  return { allapot: "kesoiKockazat", magzatiKockazat: d.fajta !== "nincs",
    miert:
      `${gaHet}. hét — a növekedési és szülés körüli kockázat szakasza ` +
      `(${d.fajta}).` };
}

/* ── A SZÜLÉS UTÁNI ÚJRAÉRTÉKELÉS ────────────────────────────────────── */

export type UjraertekelesAllapot =
  | "nemEsedekes"
  /** Esedékes, és nincs bejegyzés. EZ A JEL. */
  | "hianyzik"
  | "megtortent"
  /** Elmaradt, MEGNEVEZETT okkal. */
  | "elmaradt"
  /** Nem GDM volt — a cukorbetegség folytatódik, nincs mit újraértékelni. */
  | "folytatodik";

export interface Ujraertekeles {
  allapot: UjraertekelesAllapot;
  /** Az ablak: a szülés utáni 4–12. hét. */
  esedekesHetTol: number;
  esedekesHetIg: number;
  miert: string;
}

export const OGTT_PP_HET_TOL = 4;
export const OGTT_PP_HET_IG = 12;

/**
 * A GDM NEM SZŰNIK MEG A SZÜLÉSSEL — CSAK NEM MÉRIK TÖBBÉ.
 *
 * A szülés utáni 4–12. héten esedékes OGTT az, ami eldönti, hogy a
 * szénhidrát-anyagcsere rendeződött-e. Az elmaradása nem hiányzó adat, hanem
 * JEL: a GDM-en átesett nők jelentős részénél évek múlva 2-es típusú
 * cukorbetegség alakul ki, és ez az egyetlen pont, ahol ez időben kiderülne.
 */
export function szulesUtaniUjraertekeles(
  d: DiabetesAllas, szulesUtaniHet: number | null,
  bejegyzes?: { megtortent?: boolean; elmaradasOka?: string },
): Ujraertekeles {
  const ablak = { esedekesHetTol: OGTT_PP_HET_TOL, esedekesHetIg: OGTT_PP_HET_IG };
  if (d.fajta === "praeT1" || d.fajta === "praeT2") {
    return { ...ablak, allapot: "folytatodik",
      miert:
        `Praegestatiós diabétesz: a kezelés a szülés után FOLYTATÓDIK, nincs mit ` +
        `újraértékelni — az újraértékelés a GDM kérdése.` };
  }
  if (d.fajta !== "gdm") {
    return { ...ablak, allapot: "nemEsedekes",
      miert: `Nem volt terhességi cukorbetegség.` };
  }
  if (bejegyzes?.megtortent) {
    return { ...ablak, allapot: "megtortent", miert: `Az újraértékelés megtörtént.` };
  }
  if (bejegyzes?.elmaradasOka?.trim()) {
    return { ...ablak, allapot: "elmaradt",
      miert: `Elmaradt, megnevezett okkal: ${bejegyzes.elmaradasOka}.` };
  }
  if (szulesUtaniHet == null || szulesUtaniHet < OGTT_PP_HET_TOL) {
    return { ...ablak, allapot: "nemEsedekes",
      miert:
        `Az újraértékelés a szülés utáni ${OGTT_PP_HET_TOL}–${OGTT_PP_HET_IG}. ` +
        `héten esedékes` + (szulesUtaniHet == null ? ` (a szülés óta eltelt idő nem ismert).` : `.`) };
  }
  return { ...ablak, allapot: "hianyzik",
    miert:
      `A szülés utáni OGTT ESEDÉKES VOLT (${OGTT_PP_HET_TOL}–${OGTT_PP_HET_IG}. ` +
      `hét, most ${szulesUtaniHet}.), és nincs bejegyzés. A terhességi ` +
      `cukorbetegség nem szűnik meg a szüléssel — CSAK NEM MÉRIK TÖBBÉ. Ez az ` +
      `egyetlen pont, ahol a később kialakuló 2-es típusú cukorbetegség időben ` +
      `kiderülne, és az elmaradása JEL, nem hiány.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

/**
 * Az endokrin mérések NÉMASÁGA — megszámolva, nem érzésre.
 */
export interface EndoMerleg {
  meres: number;
  kuszobbel: number;
  referenciaval: number;
  nema: number;
}

export function endoMerleg(
  valtozok: Array<{ id: string; domain?: { critical?: unknown; criticalByContext?: unknown } | null;
                    reference?: unknown }>,
): EndoMerleg {
  const van = (v: (typeof valtozok)[number]) =>
    !!(v.domain?.critical || v.domain?.criticalByContext);
  return {
    meres: valtozok.length,
    kuszobbel: valtozok.filter(van).length,
    referenciaval: valtozok.filter((v) => v.reference).length,
    nema: valtozok.filter((v) => !van(v) && !v.reference).length,
  };
}

export function validateEndo(m: EndoMerleg): RegistryIssue[] {
  if (!m.nema) return [];
  return [{ severity: "warning", id: "endo.nema",
    message:
      `${m.nema}/${m.meres} endokrin mérésnek SEM küszöbe, SEM referenciatartománya ` +
      `nincs — ezek a leletek megjelennek, de a rendszer nem mond róluk semmit. A ` +
      `PCOS, a pajzsmirigy és a prolaktin kérdésköre jórészt ezekre épül, és a 33. ` +
      `modul első kézzelfogható haszna éppen ezek feltöltése volna.` }];
}
