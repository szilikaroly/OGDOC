/**
 * MŰTÉTI IDŐPONT AZ ÁGYRÓL — és a három dolog, amiből egy foglalás áll.
 *
 * A műtőbeosztás naiv alakja szobafoglalás: van szabad műtő ebben az idősávban,
 * tehát foglalható. Ez a beosztást TELINEK MUTATJA, miközben nem az — vagy
 * fordítva: olyan műtétet ütemez, ami nem tud elindulni.
 *
 * EGY MŰTÉTI FOGLALÁS HÁROM DOLOGBÓL ÁLL, ÉS MINDHÁROM NÉLKÜL ÜRES:
 *
 *   1. A MŰTŐ — szabad, alkalmas, és marad utána sürgősségi tartalék (`muto.ts`).
 *   2. A CSAPAT — operatőr, aneszteziológus, műtőssegéd. EZ NEM A MI ADATUNK:
 *      a beosztást és a szabadságokat a CRM (19. modul) kezeli, és a rendszer
 *      onnan KÉRDEZI meg. Aneszteziológus nélkül nincs műtét — egy szoba
 *      önmagában nem műtét.
 *   3. AZ ÁGY, AHOVÁ VISSZAJÖN. Ha az osztály tele van, az elektív műtét nem
 *      indulhat el: a beteg a műtőasztalról nem mehet haza, és az ébresztőben
 *      töltött óra a következő műtétet tolja el.
 *
 * ÉS AMI EBBŐL A LEGFONTOSABB: A CRM HALLGATÁSA NEM IGEN.
 *
 * Ha a beosztás nem kérdezhető le — a rendszer nem érhető el, a jövőbeli
 * beosztás még nincs kiadva —, akkor a csapat állapota `nemTudjuk`, és ez NEM
 * ugyanaz, mint „van csapat”. Ugyanaz a szabály, mint az interakció-
 * ellenőrzésnél (32. modul): a hiányzó válaszból nem lesz igenlő válasz.
 *
 * A KÖTÉS AZ ÁGYHOZ. A foglalás megnevezi azt az ágyat, ahonnan a beteg jön —
 * ez köti össze a műtétet a fekvőbeteg-ellátással, és ez teszi ellenőrizhetővé,
 * hogy a beteg tényleg ott van-e. Egy műtétre hívott beteg, aki közben
 * elbocsátásra került, a naptárban változatlanul ott áll.
 */
import type { RegistryIssue } from "../registry.ts";
import type { Foglalas, MutoKeszlet, Surgosseg } from "./muto.ts";
import { foglalhato as mutoFoglalhato } from "./muto.ts";

/* ── A CSAPAT — A CRM VÁLASZA ────────────────────────────────────────── */

export type Szerep = "operator" | "aneszteziologus" | "mutosseged" | "szulesznő";

/** Amit a CRM (19. modul) válaszol egy szerepre az adott idősávban. */
export type CrmValasz =
  /** Van beosztva, elérhető. */
  | "elerheto"
  /** Nincs beosztva erre az idősávra. */
  | "nincsBeosztva"
  /** Beosztva, de ütközik (másik műtét, szabadság, pihenőidő). */
  | "utkozik"
  /** A CRM nem válaszol, vagy a beosztás még nincs kiadva. NEM „elérhető”. */
  | "nemTudjuk";

export interface CsapatKeres {
  /** Mely szerepek KÖTELEZŐK ehhez a beavatkozáshoz. */
  szukseges: Szerep[];
  /** A CRM válasza szerepenként. Ami hiányzik, az `nemTudjuk`. */
  valaszok: Partial<Record<Szerep, CrmValasz>>;
}

export type CsapatAllapot = "teljes" | "hianyos" | "nemTudjuk";

export interface CsapatItelet {
  allapot: CsapatAllapot;
  hianyzo: Szerep[];
  bizonytalan: Szerep[];
  miert: string;
}

export function csapat(k: CsapatKeres): CsapatItelet {
  const hianyzo: Szerep[] = [];
  const bizonytalan: Szerep[] = [];
  for (const sz of k.szukseges) {
    const v = k.valaszok[sz] ?? "nemTudjuk";
    if (v === "elerheto") continue;
    if (v === "nemTudjuk") bizonytalan.push(sz);
    else hianyzo.push(sz);
  }
  if (hianyzo.length) {
    return { allapot: "hianyos", hianyzo, bizonytalan,
      miert:
        `Hiányzó szerep: ${hianyzo.join(", ")}. Egy szoba önmagában nem műtét — ` +
        `aneszteziológus nélkül a beavatkozás nem indul, akkor sem, ha a naptárban ` +
        `ott áll.` };
  }
  if (bizonytalan.length) {
    return { allapot: "nemTudjuk", hianyzo: [], bizonytalan,
      miert:
        `A beosztás nem kérdezhető le: ${bizonytalan.join(", ")}. A CRM ` +
        `HALLGATÁSA NEM IGEN — a hiányzó válaszból nem lesz igenlő válasz, ` +
        `ugyanúgy, mint az interakció-ellenőrzésnél.` };
  }
  return { allapot: "teljes", hianyzo: [], bizonytalan: [],
    miert: `A csapat teljes: ${k.szukseges.join(", ")}.` };
}

/* ── A FOGLALÁS ──────────────────────────────────────────────────────── */

export interface MutetiFoglalasKeres {
  beteg: string;
  /** Az ágy, AHONNAN a beteg jön — és ahová visszatér. */
  agy: string;
  /** Ott van-e ténylegesen (az ADT szerint). */
  betegAzAgyon: boolean;
  /** Van-e szabad ágy a visszatéréshez (ugyanaz vagy másik). */
  visszateroAgyVan: boolean;
  muto: string;
  surgosseg: Surgosseg;
  kezdet: string;
  vegePerc: number;
  beavatkozas: string;
  csapat: CsapatKeres;
}

export type MutetiFoglalasAllapot =
  | "foglalhato"
  /** A beteg nincs a megjelölt ágyon. */
  | "betegNincsOtt"
  /** Nincs hová visszavinni — elektív műtét nem indulhat. */
  | "nincsVisszateroAgy"
  /** A műtő kapuja zárva (tartalék, alkalmasság, ütközés). */
  | "mutoKapu"
  /** A csapat hiányos vagy nem lekérdezhető. */
  | "csapatHianyos";

export interface MutetiFoglalasItelet {
  allapot: MutetiFoglalasAllapot;
  foglalhato: boolean;
  /** Megnevezett felelőssel felülbírálható-e. */
  felulbiralhato: boolean;
  miert: string;
}

/**
 * A HÁROM KAPU EGYÜTT. A sorrend nem esetleges: előbb az, ami a beteg
 * valóságáról szól (ott van-e, hová jön vissza), aztán az erőforrás.
 *
 * SÜRGŐS BEAVATKOZÁSNÁL a visszatérő ágy hiánya NEM állítja meg a műtétet —
 * egy azonnali császármetszés nem várhat ágyra. Elektívnél igen: ott a hiányzó
 * ágy azt jelenti, hogy a műtét után a beteg az ébresztőben ragad, és a
 * következő műtétet tolja el.
 */
export function mutetiFoglalas(
  mk: MutoKeszlet, meglevo: Foglalas[], k: MutetiFoglalasKeres,
  felulbiralta?: { ki: string; miert: string },
): MutetiFoglalasItelet {
  const surgos = k.surgosseg === "k1" || k.surgosseg === "k2";

  if (!k.betegAzAgyon) {
    return { allapot: "betegNincsOtt", foglalhato: false, felulbiralhato: false,
      miert:
        `A(z) ${k.beteg} beteg nincs a megjelölt ágyon (${k.agy}). Egy műtétre ` +
        `hívott beteg, akit közben elbocsátottak vagy áthelyeztek, a naptárban ` +
        `változatlanul ott áll — ezért köt a foglalás az ÁGYHOZ, nem csak a névhez.` };
  }
  if (!k.visszateroAgyVan && !surgos) {
    const nyit = !!felulbiralta?.ki?.trim() && !!felulbiralta.miert?.trim();
    return { allapot: nyit ? "foglalhato" : "nincsVisszateroAgy",
      foglalhato: nyit, felulbiralhato: true,
      miert: nyit
        ? `FELÜLBÍRÁLVA (${felulbiralta!.ki}): ${felulbiralta!.miert}. Visszatérő ágy nincs.`
        : `Nincs szabad ágy, ahová a beteg a műtét után visszatérhet. ELEKTÍV ` +
          `műtét így nem indulhat: a beteg a műtőasztalról nem mehet haza, és az ` +
          `ébresztőben töltött óra a következő műtétet tolja el.` };
  }
  const mg = mutoFoglalhato(mk, meglevo,
    { muto: k.muto, surgosseg: k.surgosseg, kezdet: k.kezdet,
      vegePerc: k.vegePerc, beavatkozas: k.beavatkozas }, felulbiralta);
  if (!mg.foglalhato) {
    return { allapot: "mutoKapu", foglalhato: false,
      felulbiralhato: mg.felulbiralhato, miert: mg.miert };
  }
  const cs = csapat(k.csapat);
  if (cs.allapot !== "teljes") {
    const nyit = surgos
      || (!!felulbiralta?.ki?.trim() && !!felulbiralta.miert?.trim()
          && cs.allapot === "nemTudjuk");
    return { allapot: nyit ? "foglalhato" : "csapatHianyos",
      foglalhato: nyit, felulbiralhato: cs.allapot === "nemTudjuk",
      miert: nyit && surgos
        ? `Sürgős beavatkozás (${k.surgosseg}) — a csapat riasztása a beosztástól ` +
          `független. ${cs.miert}`
        : nyit
        ? `FELÜLBÍRÁLVA (${felulbiralta!.ki}): ${felulbiralta!.miert}. ${cs.miert}`
        : cs.miert };
  }
  return { allapot: "foglalhato", foglalhato: true, felulbiralhato: false,
    miert: `${mg.miert} ${cs.miert} Ágy: ${k.agy}.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

/** Mely szerepek kötelezők beavatkozástípusonként — ADAT, nem kód. */
export interface SzerepKeszlet {
  megnevezes: string;
  note: string;
  beavatkozasok: Array<{ id: string; megnevezes: string; szukseges: Szerep[] }>;
}

export function validateSzerepek(k: SzerepKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const b of k.beavatkozasok) {
    if (!b.szukseges.length) {
      out.push({ severity: "error", id: b.id,
        message:
          `A(z) „${b.megnevezes}” beavatkozáshoz egyetlen szerep sincs megadva. ` +
          `Így a foglalás csapat nélkül is átmenne, és a naptár olyan műtétet ` +
          `mutatna, ami nem tud elindulni.` });
    }
    if (!b.szukseges.includes("aneszteziologus")) {
      out.push({ severity: "warning", id: b.id,
        message:
          `A(z) „${b.megnevezes}” szerepei között nincs aneszteziológus. Ez ` +
          `lehet helyes (helyi érzéstelenítésben végzett beavatkozás), de ki kell ` +
          `mondani — a hiánya alapértelmezésből nem következhet.` });
    }
  }
  return out;
}
