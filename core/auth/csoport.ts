/**
 * CSOPORTOK ÉS MEGBÍZÁSOK — ki, mire, HOL és MEDDIG.
 *
 * A SZEREPKÖR ÖNMAGÁBAN NEM JOGOSULTSÁG, ÉS EZ A MODUL LÉNYEGE.
 *
 * A `core/store/hozzaferes.ts` három réteget mond ki: szerepkör → ellátási
 * kapcsolat → időablak. Az elsőt eddig egy fejléc adta, a másodikat kézzel
 * felvett kapcsolatok. Egy kórházban viszont az ellátási kapcsolat TÚLNYOMÓ
 * RÉSZE nem kézi felvétel, hanem a BEOSZTÁSBÓL következik: az ápoló azért
 * láthatja a 3. szoba betegét, mert ma délelőtt ő van beosztva arra az
 * osztályra. Ha ezt kézzel kell rögzíteni, nem fogják rögzíteni, és a
 * jogosultsági réteg vagy útban lesz, vagy kikerülik.
 *
 * A MODELL HÁROM ELEMBŐL ÁLL:
 *
 *   CSOPORT     mit jelent egy munkakör: milyen szerepköröket ad, MILYEN
 *               SZINTŰ helyre adható meg, és kötelező-e hozzá időablak.
 *   MEGBÍZÁS    egy konkrét ember, egy konkrét helyen, egy konkrét
 *               időszakban, megnevezett adományozóval és indokkal.
 *   HATÓKÖR     a hely-hierarchia egy csomópontja. LEFELÉ öröklődik, FELFELÉ
 *               SOHA: az osztályra szóló megbízás lefedi a szobáit és az
 *               ágyait, egy ágyra szóló megbízás viszont nem ad osztályt.
 *
 * AMIÉRT AZ IDŐABLAK NEM ELHAGYHATÓ A BEOSZTÁSNÁL
 *
 * A műszaknak vége van. Egy műszakból származó, `ig: null` megbízás azt
 * jelenti, hogy az ápoló három év múlva is olvashatja annak az osztálynak a
 * betegeit, ahol egyszer egy délelőttöt dolgozott. Ez a jogosultsági rendszerek
 * leggyakoribb csendes hibája — nem téves engedély, hanem VISSZA NEM VONT
 * engedély. A `validateMegbizasok()` ezért hibának veszi.
 *
 * A KÉZI MEGBÍZÁS LEHET NYITOTT — de akkor kimondottan. A `null` itt döntés,
 * nem feledékenység, ugyanúgy, mint a `CareRelation.until`-nál.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { Role } from "../store/hozzaferes.ts";
import type { CareRelation } from "../store/hozzaferes.ts";
import { FAJTA_SORREND, alatta, lanc } from "../fekvo/hely.ts";
import type { HelyFajta, HelyKeszlet } from "../fekvo/hely.ts";

/* ── CSOPORT ─────────────────────────────────────────────────────────── */

export interface Csoport {
  id: string;
  nev: string;
  /** Milyen szerepköröket ad. Üres lista értelmetlen — validálási hiba. */
  szerepek: Role[];
  /** Milyen SZINTŰ helyre adható meg. Az ápolót osztályra osztják be, nem klinikára. */
  hatokorFajta: HelyFajta[];
  /**
   * Kötelező-e a lezárt időablak. A műszakhoz kötött munkaköröknél igen:
   * a beosztás véget ér, a jog vele.
   */
  idohozKotott: boolean;
  /** Adhat-e ez a csoport megbízást másnak. Enélkül nincs adminisztrátor. */
  megbizhat?: boolean;
  leiras: string;
}

export interface CsoportKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  csoportok: Csoport[];
}

export function loadCsoportok(path: string): CsoportKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as CsoportKeszlet;
}

/* ── MEGBÍZÁS ────────────────────────────────────────────────────────── */

export type MegbizasForras =
  /** A CRM beosztásából származik — KÖTELEZŐEN lezárt időablakkal. */
  | "beosztas"
  /** Kézzel adott megbízás. Lehet nyitott, de akkor kimondottan. */
  | "kezi"
  /** A rendszer indulásakor létrehozott rendszergazda. */
  | "bootstrap";

export interface Megbizas {
  id: string;
  /** A felhasználó azonosítója. */
  felhasznalo: string;
  csoport: string;
  /** A hely-hierarchia csomópontja. LEFELÉ öröklődik, felfelé soha. */
  hatokor: string;
  tol: string;
  /** `null` = nyitott. Beosztásnál TILOS. */
  ig: string | null;
  forras: MegbizasForras;
  /** KI adta. „A rendszer” nem személy — kivéve a bootstrapet, ami meg is mondja. */
  adta: string;
  miert: string;
}

/* ── A HATÓKÖR ───────────────────────────────────────────────────────── */

/**
 * BENNE VAN-E A HELY A HATÓKÖRBEN.
 *
 * Lefelé öröklődik: az osztályra szóló megbízás lefedi a szobáit és az ágyait.
 * Felfelé soha: egy ágyra szóló megbízásból nem lesz osztály. A kettő
 * összekeverése az a hiba, ami egy takarítói hozzáférésből főorvosit csinál.
 */
export function hatokorbeEsik(
  k: HelyKeszlet, hatokor: string, hely: string,
): boolean {
  if (hatokor === hely) return true;
  const l = lanc(k, hely);
  if (l.torott) return false;
  return l.ut.some((h) => h.id === hatokor);
}

/** A hatókör alá eső összes hely — az admin felület ezt mutatja meg. */
export function hatokorTartalma(k: HelyKeszlet, hatokor: string) {
  return alatta(k, hatokor);
}

/* ── AZ ÉLŐ MEGBÍZÁSOK ───────────────────────────────────────────────── */

export function megbizasEl(m: Megbizas, most: string): boolean {
  const t = Date.parse(most);
  if (Number.isNaN(t)) return false;
  if (Date.parse(m.tol) > t) return false;
  return m.ig === null || Date.parse(m.ig) >= t;
}

export interface HatalyItelet {
  /** A most érvényes szerepkörök — a csoportokból összegyűjtve. */
  szerepek: Role[];
  /** A most érvényes hatókörök (hely-azonosítók). */
  hatokorok: string[];
  /** Az élő megbízások, hogy a döntés visszavezethető legyen. */
  elo: Megbizas[];
  /** Amiért nem él: lejárt vagy még nem kezdődött megbízások. */
  nemElo: Array<{ m: Megbizas; miert: string }>;
}

/**
 * MI ILLETI MEG MOST — és mi az, ami MÁR vagy MÉG nem.
 *
 * A `nemElo` nem díszítés: a „miért nem látom” kérdésre enélkül nincs válasz,
 * és a válasz nélküli tiltást a felhasználó megkerüli, nem megérti.
 */
export function hatalyos(
  cs: CsoportKeszlet, megbizasok: Megbizas[], felhasznalo: string, most: string,
): HatalyItelet {
  const cmap = new Map(cs.csoportok.map((c) => [c.id, c]));
  const enyeim = megbizasok.filter((m) => m.felhasznalo === felhasznalo);
  const elo: Megbizas[] = [];
  const nemElo: Array<{ m: Megbizas; miert: string }> = [];
  const t = Date.parse(most);
  for (const m of enyeim) {
    if (megbizasEl(m, most)) { elo.push(m); continue; }
    nemElo.push({ m, miert:
      Date.parse(m.tol) > t
        ? `még nem kezdődött (${m.tol})`
        : `lejárt (${m.ig})` });
  }
  const szerepek = new Set<Role>();
  for (const m of elo) for (const r of cmap.get(m.csoport)?.szerepek ?? []) szerepek.add(r);
  return {
    szerepek: [...szerepek],
    hatokorok: [...new Set(elo.map((m) => m.hatokor))],
    elo, nemElo,
  };
}

/* ── A BEOSZTÁSBÓL SZÁRMAZÓ ELLÁTÁSI KAPCSOLAT ───────────────────────── */

/**
 * A MEGBÍZÁS NEM AD ESETHOZZÁFÉRÉST — HANEM ELLÁTÁSI KAPCSOLATOT KELETKEZTET.
 *
 * A különbség nem szőrszálhasogatás. Ha a megbízás közvetlenül nyitná az
 * esetet, a `hozzaferes.decide()` második rétege (az ellátási kapcsolat)
 * kikerülhető lenne, és minden auditsorban „beosztás” állna jogalapként —
 * vagyis semmi. Így viszont a beosztás ugyanolyan ellátási kapcsolatot
 * termel, mint a felvétel vagy a beutalás, MEGNEVEZETT jogalappal és a
 * műszak időablakával.
 *
 * A kapcsolat ideje a MEGBÍZÁS és a FEKVÉS metszete. Aki délelőtt dolgozik,
 * nem éri el a délután felvett beteget; aki egész nap, az sem éri el azt,
 * akit már elbocsátottak.
 */
export interface Fekves {
  caseId: string;
  /** Melyik helyen fekszik (ágy, szoba vagy osztály). */
  hely: string;
  tol: string;
  ig: string | null;
}

export function beosztasbolKapcsolat(
  k: HelyKeszlet, cs: CsoportKeszlet, megbizasok: Megbizas[],
  fekvesek: Fekves[], felhasznaloNev: string, felhasznaloId: string,
): CareRelation[] {
  const cmap = new Map(cs.csoportok.map((c) => [c.id, c]));
  const ki: CareRelation[] = [];
  for (const m of megbizasok.filter((x) => x.felhasznalo === felhasznaloId)) {
    const c = cmap.get(m.csoport);
    if (!c) continue;
    for (const f of fekvesek) {
      if (!hatokorbeEsik(k, m.hatokor, f.hely)) continue;
      const tol = maxIdo(m.tol, f.tol);
      const ig = minIdo(m.ig, f.ig);
      if (ig !== null && Date.parse(ig) < Date.parse(tol)) continue; // nincs metszet
      ki.push({
        actor: felhasznaloNev, caseId: f.caseId, from: tol, until: ig,
        why:
          `beosztás: ${c.nev} — ${m.hatokor} ` +
          `(${m.forras === "beosztas" ? "műszak" : m.forras}, megbízás: ${m.id})`,
      });
    }
  }
  return ki;
}

const maxIdo = (a: string, b: string) => (Date.parse(a) >= Date.parse(b) ? a : b);
const minIdo = (a: string | null, b: string | null) => {
  if (a === null) return b;
  if (b === null) return a;
  return Date.parse(a) <= Date.parse(b) ? a : b;
};

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateCsoportok(cs: CsoportKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const c of cs.csoportok) {
    if (latott.has(c.id)) {
      out.push({ severity: "error", id: c.id, message: `Ismétlődő csoportazonosító.` });
    }
    latott.add(c.id);
    if (!c.szerepek?.length) {
      out.push({ severity: "error", id: c.id,
        message:
          `A(z) „${c.nev}” csoport egyetlen szerepkört sem ad. Egy szerepkör ` +
          `nélküli csoport nem „még nincs kitöltve”, hanem olyan munkakör, ` +
          `amiről senki nem mondta meg, mit tehet.` });
    }
    if (!c.hatokorFajta?.length) {
      out.push({ severity: "error", id: c.id,
        message:
          `A(z) „${c.nev}” csoporthoz nincs megadva, MILYEN SZINTŰ helyre ` +
          `adható. Korlát nélkül egy osztályos ápoló megbízást kaphatna a ` +
          `teljes klinikára, és az soha nem tűnne fel.` });
    }
    for (const f of c.hatokorFajta ?? []) {
      if (!FAJTA_SORREND.includes(f)) {
        out.push({ severity: "error", id: c.id,
          message: `Ismeretlen hely-fajta a hatókörben: „${f}”.` });
      }
    }
  }
  return out;
}

export function validateMegbizasok(
  cs: CsoportKeszlet, k: HelyKeszlet, megbizasok: Megbizas[],
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const cmap = new Map(cs.csoportok.map((c) => [c.id, c]));
  const hmap = new Map(k.helyek.map((h) => [h.id, h]));
  const latott = new Set<string>();
  for (const m of megbizasok) {
    if (latott.has(m.id)) {
      out.push({ severity: "error", id: m.id, message: `Ismétlődő megbízásazonosító.` });
    }
    latott.add(m.id);
    const c = cmap.get(m.csoport);
    if (!c) {
      out.push({ severity: "error", id: m.id,
        message: `Ismeretlen csoport: „${m.csoport}”.` });
      continue;
    }
    const h = hmap.get(m.hatokor);
    if (!h) {
      out.push({ severity: "error", id: m.id,
        message: `Ismeretlen hatókör: „${m.hatokor}” — nem létező hely.` });
      continue;
    }
    if (!c.hatokorFajta.includes(h.fajta)) {
      out.push({ severity: "error", id: m.id,
        message:
          `A(z) „${c.nev}” csoport ${c.hatokorFajta.join("/")} szintre adható, ` +
          `a megbízás viszont „${h.nev}” (${h.fajta}) szintre szól. Egy ` +
          `osztályos munkakör klinikai hatókörrel csendben mindenkit lát.` });
    }
    // A LEGFONTOSABB SZABÁLY: a műszakhoz kötött megbízás nem lehet nyitott.
    if ((m.forras === "beosztas" || c.idohozKotott) && m.ig === null) {
      out.push({ severity: "error", id: m.id,
        message:
          `A(z) „${c.nev}” megbízásnak (${m.hatokor}) NINCS VÉGE. A műszaknak ` +
          `van vége, a jognak vele: nyitott időablakkal ez a felhasználó évekkel ` +
          `később is olvashatja annak az osztálynak a betegeit, ahol egyszer egy ` +
          `műszakot dolgozott. Ez nem téves engedély, hanem VISSZA NEM VONT ` +
          `engedély — a jogosultsági rendszerek leggyakoribb csendes hibája.` });
    }
    if (Number.isNaN(Date.parse(m.tol))) {
      out.push({ severity: "error", id: m.id, message: `Értelmezhetetlen kezdet: „${m.tol}”.` });
    }
    if (m.ig !== null && Number.isNaN(Date.parse(m.ig))) {
      out.push({ severity: "error", id: m.id, message: `Értelmezhetetlen vég: „${m.ig}”.` });
    }
    if (m.ig !== null && Date.parse(m.ig) < Date.parse(m.tol)) {
      out.push({ severity: "error", id: m.id,
        message: `A megbízás vége (${m.ig}) korábbi, mint a kezdete (${m.tol}).` });
    }
    if (!m.adta?.trim()) {
      out.push({ severity: "error", id: m.id,
        message:
          `Nincs megnevezve, ki adta a megbízást. „A rendszer” nem személy: ` +
          `adományozó nélkül a jogosultság eredete visszakereshetetlen.` });
    }
    if (!m.miert?.trim()) {
      out.push({ severity: "warning", id: m.id,
        message: `Nincs indok. Egy indok nélküli megbízást senki nem mer visszavonni.` });
    }
  }
  return out;
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface CsoportMerleg {
  csoport: number;
  megbizas: number;
  elo: number;
  lejart: number;
  nyitott: number;
  /** Hány felhasználónak van legalább egy élő megbízása. */
  aktivFelhasznalo: number;
}

export function merleg(
  cs: CsoportKeszlet, megbizasok: Megbizas[], most: string,
): CsoportMerleg {
  const elo = megbizasok.filter((m) => megbizasEl(m, most));
  return {
    csoport: cs.csoportok.length,
    megbizas: megbizasok.length,
    elo: elo.length,
    lejart: megbizasok.filter((m) => m.ig !== null && Date.parse(m.ig) < Date.parse(most)).length,
    nyitott: megbizasok.filter((m) => m.ig === null).length,
    aktivFelhasznalo: new Set(elo.map((m) => m.felhasznalo)).size,
  };
}
