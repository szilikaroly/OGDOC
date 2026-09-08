/**
 * 37. MODUL — MEZŐ- ÉS ÉRTÉKSZERKESZTÉS.
 *
 * A REGISZTER AZ IGAZSÁGFORRÁS, ÉS A BUILD ELLENŐRZI. Egy futásidejű
 * szerkesztő, ami közvetlenül a regiszterbe ír, ezt a garanciát megszünteti:
 * a mező bekerül, a `npm run check` viszont csak a következő fejlesztői körben
 * fut le rá — ha egyáltalán.
 *
 * EZÉRT A SZERKESZTETT MEZŐ RÉTEGBE (OVERLAY) KERÜL, NEM A REGISZTERBE.
 *
 *   registry/    átnézett, verziókövetett, buildben ellenőrzött
 *   overlay      itt és most létrehozott, ELLENŐRZÖTT, de át nem nézett
 *
 * A kettő KÜLÖNBSÉGE látszik: a rendszer minden helyen, ahol számol vagy
 * megjelenít, meg tudja mondani, hogy egy mező honnan való. Ez nem
 * bizalmatlanság a felhasználóval szemben — ez az a különbség, amitől egy
 * fél év múlva végzett auditban meg lehet mondani, mit nézett át valaki és
 * mit nem.
 *
 * NÉGY DOLGOT NEM ENGED A SZERKESZTŐ, ÉS MIND A NÉGY VISSZAFORDÍTHATATLAN
 * KÁRT ELŐZ MEG:
 *
 *   1. NEM ÍRJA FELÜL A REGISZTERBELI MEZŐT. Az átnézett definíció átírása
 *      futásidőben azt jelentené, hogy a kód és a valóság elválik. Az
 *      átnézett mező FELÜLBÍRÁLHATÓ, de a felülbírálás külön tétel marad,
 *      és látszik.
 *
 *   2. NEM TÖRÖL OLYAN MEZŐT, AMIRE ÉRTÉK VAN RÖGZÍTVE. A törölt mező
 *      értéke nem tűnik el, csak értelmezhetetlenné válik — és egy
 *      értelmezhetetlen érték rosszabb, mint a hiányzó.
 *
 *   3. NEM VESZ EL KÓDOT A KÓDLISTÁBÓL. Ha egy kódot már használtak, a
 *      kivétele a MÚLTBELI rögzítést teszi érvénytelenné. A kód
 *      KIVEZETHETŐ (`kivezetett`), de akkor az új rögzítésnél nem
 *      választható, a régi pedig továbbra is olvasható.
 *
 *   4. NEM MÓDOSÍT ALÁÍRT MEZŐT AZ ALÁÍRÁS ÉRINTÉSE NÉLKÜL. Ha egy mező egy
 *      aláírt tábla vagy kalkulátor bemenete, a módosítása az aláírást
 *      ELAVULTTÁ teszi — különben az aláíró egy olyan definíciót
 *      hitelesített, ami már nincs ott.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { RegistryIssue } from "../registry.ts";
import type { Role } from "../store/hozzaferes.ts";

/* ── A RÉTEG ─────────────────────────────────────────────────────────── */

export type SzerkesztesFajta =
  /** Teljesen új mező, ami a regiszterben nem szerepel. */
  | "ujMezo"
  /** Meglévő mező kódlistájának BŐVÍTÉSE. Elvenni nem lehet. */
  | "kodBovites"
  /** Kód kivezetése: új rögzítésnél nem választható, a régi olvasható marad. */
  | "kodKivezetes"
  /** Címke vagy leírás pontosítása — a jelentés nem változhat. */
  | "cimkePontositas";

export interface Szerkesztes {
  id: string;
  fajta: SzerkesztesFajta;
  /** A mező azonosítója. Új mezőnél az újé. */
  mezo: string;
  /** Új mezőnél a teljes definíció; bővítésnél csak a hozzáadott rész. */
  tartalom: Record<string, unknown>;
  letrehozta: string;
  mikor: string;
  miert: string;
  /** Mely aláírások váltak elavulttá emiatt. */
  elavultAlairasok: string[];
}

export interface SzerkesztesReteg {
  verzio: 1;
  szerkesztesek: Szerkesztes[];
}

export function loadReteg(path: string): SzerkesztesReteg {
  if (!existsSync(path)) return { verzio: 1, szerkesztesek: [] };
  return JSON.parse(readFileSync(path, "utf8")) as SzerkesztesReteg;
}

export function saveReteg(path: string, r: SzerkesztesReteg): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(r, null, 1) + "\n");
}

/* ── AMIT A SZERKESZTŐNEK TUDNIA KELL A RENDSZERRŐL ──────────────────── */

export interface Kornyezet {
  /** A regiszterben MÁR meglévő mezők azonosítói. */
  regiszterMezok: Set<string>;
  /** Egy mező kódlistája, ha van. */
  kodlista: (mezo: string) => Array<string | number> | null;
  /** Van-e rögzített érték erre a mezőre (bármely esetben). */
  vanErteke: (mezo: string) => boolean;
  /** Használták-e már ezt a kódot. */
  kodotHasznaltak: (mezo: string, kod: string | number) => boolean;
  /** Mely aláírások függenek ettől a mezőtől. */
  fuggoAlairasok: (mezo: string) => string[];
}

/* ── AZ ÍTÉLET ───────────────────────────────────────────────────────── */

export type SzerkesztesAllapot =
  | "elfogadva"
  | "nincsJog"
  | "nincsIndok"
  /** Az azonosító ütközik vagy nem szabályos. */
  | "azonositoHiba"
  /** A művelet visszafordíthatatlan kárt okozna. */
  | "tiltottMuvelet"
  /** A tartalom hiányos vagy értelmezhetetlen. */
  | "tartalomHiba";

export interface SzerkesztesItelet {
  allapot: SzerkesztesAllapot;
  szerkesztes: Szerkesztes | null;
  elavultAlairasok: string[];
  miert: string;
}

/** A mezőazonosító alakja: pontokkal tagolt, kisbetűs, ékezet nélküli. */
const AZONOSITO = /^[a-z][a-z0-9]*(\.[a-z0-9][a-zA-Z0-9]*)+$/;

/** Ki szerkeszthet mezőt. A KLINIKAI TARTALOM nem rendszergazdai kérdés. */
export const SZERKESZTHETI: Role[] = ["admin", "clinician"];

export function szerkeszt(
  reteg: SzerkesztesReteg, k: Kornyezet, be: {
    fajta: SzerkesztesFajta; mezo: string; tartalom: Record<string, unknown>;
    ki: string; szerepek: Role[]; miert: string; mikor: string;
  },
): SzerkesztesItelet {
  const ures = { szerkesztes: null, elavultAlairasok: [] as string[] };

  if (!be.szerepek.some((r) => SZERKESZTHETI.includes(r))) {
    return { ...ures, allapot: "nincsJog",
      miert:
        `Mezőt a(z) ${SZERKESZTHETI.join(", ")} szerepkör szerkeszthet. Egy új ` +
        `klinikai mező felvétele nem adminisztratív művelet: az fog megjelenni ` +
        `a leleten, és az alapján fog dönteni valaki.` };
  }
  if (!be.miert?.trim()) {
    return { ...ures, allapot: "nincsIndok",
      miert:
        `Indoklás nélkül nem szerkeszthető. Egy megmagyarázatlan mező fél év ` +
        `múlva senkinek nem mond semmit, és senki nem meri kivenni.` };
  }
  if (!AZONOSITO.test(be.mezo)) {
    return { ...ures, allapot: "azonositoHiba",
      miert:
        `A(z) „${be.mezo}” nem szabályos mezőazonosító. Alak: modul.mezo vagy ` +
        `modul.csoport.mezo — kisbetűvel kezdődő, pontokkal tagolt, ékezet nélküli.` };
  }

  const regiszterben = k.regiszterMezok.has(be.mezo);
  const retegben = reteg.szerkesztesek.some(
    (s) => s.fajta === "ujMezo" && s.mezo === be.mezo);
  const alairasok = k.fuggoAlairasok(be.mezo);

  switch (be.fajta) {
    case "ujMezo": {
      // 1. NEM ÍRJA FELÜL A REGISZTERBELI MEZŐT.
      if (regiszterben) {
        return { ...ures, allapot: "tiltottMuvelet",
          miert:
            `A(z) „${be.mezo}” MÁR SZEREPEL a regiszterben. Az átnézett ` +
            `definíció futásidejű átírása azt jelentené, hogy a kód és a ` +
            `valóság elválik: a build ugyanazt a mezőt máshogy látná, mint a ` +
            `futó rendszer. Ha bővíteni kell, használj kódbővítést; ha a ` +
            `definíció rossz, az fejlesztői változtatás.` };
      }
      if (retegben) {
        return { ...ures, allapot: "azonositoHiba",
          miert: `A(z) „${be.mezo}” mezőt már létrehozták a rétegben.` };
      }
      const hiba = ujMezoHiba(be.tartalom);
      if (hiba) return { ...ures, allapot: "tartalomHiba", miert: hiba };
      break;
    }
    case "kodBovites": {
      if (!regiszterben && !retegben) {
        return { ...ures, allapot: "azonositoHiba",
          miert: `Nincs ilyen mező: „${be.mezo}”.` };
      }
      const kodok = be.tartalom.kodok;
      if (!Array.isArray(kodok) || !kodok.length) {
        return { ...ures, allapot: "tartalomHiba",
          miert: `A kódbővítéshez legalább egy kód kell („tartalom.kodok”).` };
      }
      const meglevo = new Set(k.kodlista(be.mezo) ?? []);
      for (const kk of kodok as Array<{ code?: unknown }>) {
        if (!kk || typeof kk !== "object" || kk.code === undefined) {
          return { ...ures, allapot: "tartalomHiba",
            miert: `Minden kódnak kell „code” mező.` };
        }
        if (meglevo.has(kk.code as string | number)) {
          return { ...ures, allapot: "tartalomHiba",
            miert: `A(z) „${String(kk.code)}” kód már szerepel a listában.` };
        }
      }
      break;
    }
    case "kodKivezetes": {
      const kod = be.tartalom.kod as string | number | undefined;
      if (kod === undefined) {
        return { ...ures, allapot: "tartalomHiba", miert: `Nincs megadva a kivezetendő kód.` };
      }
      if (!(k.kodlista(be.mezo) ?? []).includes(kod)) {
        return { ...ures, allapot: "azonositoHiba",
          miert: `A(z) „${String(kod)}” kód nincs a(z) „${be.mezo}” listájában.` };
      }
      // 3. A KIVEZETÉS NEM TÖRLÉS — és ezt ki is mondjuk.
      break;
    }
    case "cimkePontositas": {
      if (!be.tartalom.label && !be.tartalom.documentation) {
        return { ...ures, allapot: "tartalomHiba",
          miert: `A pontosításhoz „label” vagy „documentation” kell.` };
      }
      break;
    }
  }

  // AZ AZONOSÍTÓBA A FAJTA IS BELETARTOZIK, ÉS EGY SORSZÁM IS. Enélkül két
  // különböző szerkesztés ugyanarra a mezőre ugyanabban az ezredmásodpercben
  // (kódbővítés és kivezetés egy képernyőről) azonos azonosítót kapna — és a
  // második csendben felülírná az elsőt a naplóban.
  const alap = `szerk.${Date.parse(be.mikor).toString(36)}.${be.fajta}.${be.mezo}`;
  let ujId = alap, n = 1;
  while (reteg.szerkesztesek.some((x) => x.id === ujId)) ujId = `${alap}.${++n}`;
  const sz: Szerkesztes = {
    id: ujId,
    fajta: be.fajta, mezo: be.mezo, tartalom: be.tartalom,
    letrehozta: be.ki, mikor: be.mikor, miert: be.miert,
    elavultAlairasok: alairasok,
  };
  return {
    allapot: "elfogadva", szerkesztes: sz, elavultAlairasok: alairasok,
    miert:
      magyarazat(be.fajta, be.mezo) +
      (alairasok.length
        ? ` FIGYELEM: ${alairasok.length} aláírás ELAVUL (${alairasok.join(", ")}). ` +
          `Az aláíró egy olyan definíciót hitelesített, ami már nincs ott.`
        : ``) +
      ` A mező a SZERKESZTÉSI RÉTEGBE került, nem a regiszterbe: ellenőrzött, ` +
      `de át nem nézett. A különbség minden megjelenítésnél látszik.`,
  };
}

function magyarazat(f: SzerkesztesFajta, mezo: string): string {
  switch (f) {
    case "ujMezo": return `Új mező: ${mezo}.`;
    case "kodBovites": return `A(z) ${mezo} kódlistája bővült.`;
    case "kodKivezetes":
      return `A(z) ${mezo} egyik kódja KIVEZETVE: új rögzítésnél nem ` +
             `választható, a korábbi rögzítések olvashatók maradnak. A kód ` +
             `törlése a MÚLTBELI adatot tenné értelmezhetetlenné.`;
    case "cimkePontositas": return `A(z) ${mezo} címkéje pontosítva.`;
  }
}

function ujMezoHiba(t: Record<string, unknown>): string | null {
  if (!t.label || typeof t.label !== "object") {
    return `Az új mezőhöz kell magyar címke („label.hu”).`;
  }
  if (!(t.label as Record<string, unknown>).hu) {
    return `Az új mezőhöz kell MAGYAR címke („label.hu”) — a forrásnyelv magyar.`;
  }
  const dt = t.datatype;
  const ENGEDETT = ["number", "coded", "text", "boolean", "tristate", "date", "quantity"];
  if (typeof dt !== "string" || !ENGEDETT.includes(dt)) {
    return `Ismeretlen adattípus: ${JSON.stringify(dt)}. Lehetséges: ${ENGEDETT.join(", ")}.`;
  }
  if (dt === "coded" && !Array.isArray(t.valueSet)) {
    return `Kódolt mezőhöz kell kódlista („valueSet”).`;
  }
  // A SZÁM TÍPUSÚ MEZŐNEK KELL TARTOMÁNY. Enélkül egy elgépelt nagyságrend
  // (7 helyett 70) némán bekerül, és a számítások onnantól hamisak.
  if ((dt === "number" || dt === "quantity")
    && (!t.domain || typeof (t.domain as { min?: unknown }).min !== "number"
      || typeof (t.domain as { max?: unknown }).max !== "number")) {
    return `Szám típusú mezőhöz kell értelmezési tartomány („domain.min” és ` +
           `„domain.max”). Tartomány nélkül egy elgépelt nagyságrend némán ` +
           `bekerül, és onnantól minden rá épülő számítás hamis.`;
  }
  if ((dt === "quantity") && !t.unit) {
    return `Mennyiség típusú mezőhöz kell mértékegység („unit”). A mértékegység ` +
           `nélküli szám nem adat: az 5.0 mg/dL kreatinin és az 5.0 µmol/L nem ` +
           `ugyanaz a beteg.`;
  }
  return null;
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface SzerkesztoMerleg {
  szerkesztes: number;
  ujMezo: number;
  kodBovites: number;
  kodKivezetes: number;
  cimkePontositas: number;
  /** Hány szerkesztés tett elavulttá aláírást. */
  alairastErintett: number;
}

export function merleg(r: SzerkesztesReteg): SzerkesztoMerleg {
  const db = (f: SzerkesztesFajta) => r.szerkesztesek.filter((s) => s.fajta === f).length;
  return {
    szerkesztes: r.szerkesztesek.length,
    ujMezo: db("ujMezo"), kodBovites: db("kodBovites"),
    kodKivezetes: db("kodKivezetes"), cimkePontositas: db("cimkePontositas"),
    alairastErintett: r.szerkesztesek.filter((s) => s.elavultAlairasok.length).length,
  };
}

export function validateReteg(r: SzerkesztesReteg, k: Kornyezet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const s of r.szerkesztesek) {
    if (latott.has(s.id)) {
      out.push({ severity: "error", id: s.id, message: `Ismétlődő szerkesztésazonosító.` });
    }
    latott.add(s.id);
    if (!s.miert?.trim()) {
      out.push({ severity: "error", id: s.id, message: `Indok nélküli szerkesztés.` });
    }
    if (!s.letrehozta?.trim()) {
      out.push({ severity: "error", id: s.id,
        message: `Nincs megnevezve, ki szerkesztette. „A rendszer” nem személy.` });
    }
    // A RÉTEGBELI MEZŐ NEM ÜTKÖZHET A REGISZTERREL. Ha időközben a fejlesztés
    // felvette ugyanazt az azonosítót, két definíció versenyez egy névre.
    if (s.fajta === "ujMezo" && k.regiszterMezok.has(s.mezo)) {
      out.push({ severity: "error", id: s.id,
        message:
          `A(z) „${s.mezo}” mező időközben BEKERÜLT A REGISZTERBE, de a ` +
          `szerkesztési rétegben is szerepel. Két definíció versenyez egy ` +
          `névre — és a rétegbeli az, amelyiket senki nem nézte át. A rétegbeli ` +
          `tételt el kell dönteni: vagy kivonni, vagy a regiszterbeli helyett ` +
          `érvényesnek nyilvánítani, kimondva.` });
    }
  }
  return out;
}
