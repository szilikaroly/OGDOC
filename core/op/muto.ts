/**
 * MŰTŐKEZELÉS — ahol a kihasználtság maximalizálása maga a hiba.
 *
 * Egy általános műtőbeosztó rendszer célja a kihasználtság: minél kevesebb üres
 * perc. Szülészeten ez a cél HIBÁS, és a hiba nem lassan jelentkezik, hanem
 * egyszerre.
 *
 * A SÜRGŐS CSÁSZÁRMETSZÉS NEM VÁR SORÁT.
 *
 * Az 1. kategóriájú (azonnali) császármetszésnél a döntéstől a gyermek
 * megszületéséig eltelt idő — a decision-to-delivery interval — a mérce, és a
 * nemzetközi ajánlás 30 perc. Ez nem egy célszám a minőségjelentésben: ha nincs
 * szabad műtő, az intervallum nem tartható, és ezen a ponton a késés
 * következménye nem kellemetlenség, hanem hypoxia.
 *
 * Ebből következik, amit egy általános beosztórendszer nem tud:
 *
 *   A MŰTŐ NEM FOGLALHATÓ TELE. Egy kapacitásrészt fenn KELL tartani a
 *   sürgősségnek, és ez a rész NEM elektív foglalásra való — akkor sem, ha
 *   éppen üres, és akkor sem, ha a beosztás „hatékonyabb” lenne nélküle.
 *
 * A modul ezért a foglalásnál nem azt kérdezi, hogy „van-e szabad idő”, hanem
 * hogy „marad-e sürgősségi tartalék”. Egy elektív foglalás, ami az utolsó
 * tartalékot fogyasztaná el, ELUTASÍTVA lesz — megnevezett, felelős
 * felülbírálással nyitható, de magától nem.
 *
 * ÉS A MÁSODIK, AMI SZÜLÉSZETEN MÁS: A SÜRGŐSSÉG KATEGÓRIÁJA NEM SÚLYOSSÁG,
 * HANEM HATÁRIDŐ. A négy Lucas-kategória mindegyikéhez idő tartozik, és a
 * beosztás ehhez képest késik vagy nem — nem ahhoz képest, hogy „mennyire
 * sürgős”.
 *
 * AMI EMBERI DÖNTÉS ÉS NEM ITT DŐL EL: mekkora a fenntartott tartalék. Az egy
 * műtős és a három műtős osztályon MÁS a válasz, és ez szervezeti döntés — a
 * modul csak azt teszi, hogy a döntést kimondottá és számon kérhetővé teszi.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A SÜRGŐSSÉGI KATEGÓRIÁK ─────────────────────────────────────────── */

/**
 * A császármetszés sürgősségi kategóriái (Lucas et al. 2000; NICE, RCOG).
 * A KATEGÓRIA HATÁRIDŐT JELENT, nem súlyosságot.
 */
export type Surgosseg =
  /** Azonnali életveszély az anyára vagy a magzatra. Cél: 30 perc. */
  | "k1"
  /** Anyai vagy magzati kompromisszum, nem azonnal életveszélyes. Cél: 75 perc. */
  | "k2"
  /** Korai szülésbefejezés kell, de nincs kompromisszum. */
  | "k3"
  /** Elektív, az anyának és a személyzetnek megfelelő időben. */
  | "k4";

export const HATARIDO_PERC: Record<Surgosseg, number | null> = {
  k1: 30, k2: 75, k3: null, k4: null,
};

export interface Muto {
  id: string;
  megnevezes: string;
  /** Alkalmas-e sürgős császármetszésre (felkészültség, elérhetőség). */
  surgosAlkalmas: boolean;
}

export interface MutoKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  mutok: Muto[];
  /**
   * A FENNTARTOTT SÜRGŐSSÉGI TARTALÉK — szervezeti döntés, aláírással.
   * Hány sürgősségre alkalmas műtőnek kell szabadon maradnia MINDIG.
   */
  surgossegiTartalek: number;
  /** Ki mondta ki a tartalékot. Aláírás nélkül a szám javaslat. */
  hitelesitesek: Array<{ ki: string; mikor: string; tartalek: number }>;
}

export function loadMutok(path: string): MutoKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as MutoKeszlet;
}

export interface Foglalas {
  id: string;
  muto: string;
  surgosseg: Surgosseg;
  kezdet: string;
  vegePerc: number;
  beavatkozas: string;
}

/* ── A TARTALÉK KAPUJA ───────────────────────────────────────────────── */

export type FoglalasAllapot =
  | "foglalhato"
  /** Az utolsó sürgősségi tartalékot fogyasztaná el. */
  | "tartalekotFogyasztana"
  /** Nincs szabad műtő ebben az idősávban. */
  | "nincsSzabadMuto"
  /** Az adott műtő nem alkalmas sürgős beavatkozásra. */
  | "nemSurgosAlkalmas"
  /** A tartalék nincs aláírva — a szám javaslat, nem szabály. */
  | "tartalekAlairatlan";

export interface FoglalasItelet {
  allapot: FoglalasAllapot;
  foglalhato: boolean;
  /** Hány sürgősségre alkalmas műtő maradna szabadon. */
  maradoTartalek: number;
  /** Megnevezett felelőssel felülbírálható-e. */
  felulbiralhato: boolean;
  miert: string;
}

function atfed(a: Foglalas, kezdet: string, perc: number): boolean {
  const aK = Date.parse(a.kezdet), aV = aK + a.vegePerc * 60_000;
  const bK = Date.parse(kezdet), bV = bK + perc * 60_000;
  return aK < bV && bK < aV;
}

/**
 * FOGLALHATÓ-E. A kérdés nem az, hogy van-e szabad idő, hanem hogy MARAD-E
 * SÜRGŐSSÉGI TARTALÉK.
 */
export function foglalhato(
  k: MutoKeszlet, meglevo: Foglalas[], uj: Omit<Foglalas, "id">,
  felulbiralta?: { ki: string; miert: string },
): FoglalasItelet {
  const cel = k.mutok.find((m) => m.id === uj.muto);
  const utkozik = meglevo.filter((f) => atfed(f, uj.kezdet, uj.vegePerc));
  const foglaltIdk = new Set(utkozik.map((f) => f.muto));

  if (!cel) {
    return { allapot: "nincsSzabadMuto", foglalhato: false, maradoTartalek: 0,
      felulbiralhato: false, miert: `Nincs ilyen műtő: ${uj.muto}.` };
  }
  if (foglaltIdk.has(uj.muto)) {
    return { allapot: "nincsSzabadMuto", foglalhato: false, maradoTartalek: 0,
      felulbiralhato: false,
      miert: `A(z) ${uj.muto} ebben az idősávban foglalt.` };
  }
  if (uj.surgosseg === "k1" && !cel.surgosAlkalmas) {
    return { allapot: "nemSurgosAlkalmas", foglalhato: false, maradoTartalek: 0,
      felulbiralhato: false,
      miert:
        `A(z) ${uj.muto} nem alkalmas azonnali császármetszésre. A K1 határideje ` +
        `${HATARIDO_PERC.k1} perc a döntéstől a gyermek megszületéséig — ez nem ` +
        `célszám a jelentésben, hanem az az idő, ami alatt a hypoxia elkerülhető.` };
  }

  const surgosAlkalmas = k.mutok.filter((m) => m.surgosAlkalmas);
  const szabadSurgos = surgosAlkalmas.filter(
    (m) => m.id !== uj.muto && !foglaltIdk.has(m.id)).length;

  /* SÜRGŐS BEAVATKOZÁS SOSEM AKAD EL A TARTALÉKON: a tartalék éppen érte van. */
  if (uj.surgosseg === "k1" || uj.surgosseg === "k2") {
    return { allapot: "foglalhato", foglalhato: true, maradoTartalek: szabadSurgos,
      felulbiralhato: false,
      miert:
        `Sürgős beavatkozás (${uj.surgosseg}, határidő ` +
        `${HATARIDO_PERC[uj.surgosseg]} perc) — a fenntartott tartalék ÉPPEN ` +
        `ezért van. Utána ${szabadSurgos} sürgősségre alkalmas műtő marad szabadon.` };
  }

  if (!k.hitelesitesek.length) {
    return { allapot: "tartalekAlairatlan", foglalhato: false,
      maradoTartalek: szabadSurgos, felulbiralhato: true,
      miert:
        `A sürgősségi tartalék (${k.surgossegiTartalek} műtő) NINCS ALÁÍRVA. Amíg ` +
        `senki nem vállalta, a szám javaslat, nem szabály — és egy alá nem írt ` +
        `tartalék az első zsúfolt napon elfogy. Mekkora a tartalék, szervezeti ` +
        `döntés: az egy műtős és a három műtős osztályon más a válasz.` };
  }

  if (szabadSurgos < k.surgossegiTartalek) {
    const nyit = !!felulbiralta?.ki?.trim() && !!felulbiralta.miert?.trim();
    return {
      allapot: nyit ? "foglalhato" : "tartalekotFogyasztana",
      foglalhato: nyit, maradoTartalek: szabadSurgos, felulbiralhato: true,
      miert: nyit
        ? `FELÜLBÍRÁLVA (${felulbiralta!.ki}): ${felulbiralta!.miert}. Az elektív ` +
          `foglalás után ${szabadSurgos} sürgősségre alkalmas műtő marad, a ` +
          `kimondott tartalék ${k.surgossegiTartalek}.`
        : `Ez az ELEKTÍV foglalás a sürgősségi tartalékot fogyasztaná: utána ` +
          `${szabadSurgos} sürgősségre alkalmas műtő maradna szabadon, a ` +
          `kimondott tartalék ${k.surgossegiTartalek}. A műtő nem foglalható ` +
          `tele: ha egy K1 császármetszés nem tud elindulni, a ` +
          `${HATARIDO_PERC.k1} perces határidő nem tartható, és a késés ` +
          `következménye nem kellemetlenség.`,
    };
  }
  return { allapot: "foglalhato", foglalhato: true, maradoTartalek: szabadSurgos,
    felulbiralhato: false,
    miert:
      `Foglalható: utána ${szabadSurgos} sürgősségre alkalmas műtő marad ` +
      `szabadon, a kimondott tartalék ${k.surgossegiTartalek}.` };
}

/* ── A HATÁRIDŐ MÉRÉSE ───────────────────────────────────────────────── */

export type HataridoAllapot = "tartva" | "tullepve" | "nincsHatarido" | "nemMerheto";

export interface HataridoItelet {
  allapot: HataridoAllapot;
  percek: number | null;
  hatarido: number | null;
  miert: string;
}

/**
 * A DÖNTÉSTŐL A GYERMEK MEGSZÜLETÉSÉIG. Ez az a szám, amit a szülészeti
 * műtőbeosztás minősége ténylegesen jelent.
 *
 * HIÁNYZÓ DÖNTÉSI IDŐPONTNÁL AZ EREDMÉNY NEM „TARTVA”. A döntés ideje az, amit
 * a leggyakrabban utólag írnak be — és ha hiányzik, az intervallum nem
 * kiszámítható, nem pedig rendben.
 */
export function hatarido(
  surgosseg: Surgosseg, dontes: string | null, szuletes: string | null,
): HataridoItelet {
  const cel = HATARIDO_PERC[surgosseg];
  if (cel === null) {
    return { allapot: "nincsHatarido", percek: null, hatarido: null,
      miert: `A(z) ${surgosseg} kategóriához nem tartozik perces határidő.` };
  }
  if (!dontes || !szuletes) {
    return { allapot: "nemMerheto", percek: null, hatarido: cel,
      miert:
        `A döntés (${dontes ?? "hiányzik"}) vagy a megszületés ` +
        `(${szuletes ?? "hiányzik"}) időpontja nincs rögzítve, ezért az ` +
        `intervallum NEM KISZÁMÍTHATÓ — ami nem ugyanaz, mint hogy rendben van. ` +
        `A döntés ideje az, amit a leggyakrabban utólag írnak be.` };
  }
  const p = (Date.parse(szuletes) - Date.parse(dontes)) / 60_000;
  return p <= cel
    ? { allapot: "tartva", percek: Math.round(p), hatarido: cel,
        miert: `${Math.round(p)} perc, a ${surgosseg} határideje ${cel} perc.` }
    : { allapot: "tullepve", percek: Math.round(p), hatarido: cel,
        miert:
          `${Math.round(p)} PERC, a ${surgosseg} határideje ${cel} perc — ` +
          `${Math.round(p - cel)} perccel túllépve.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateMutok(k: MutoKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const surgos = k.mutok.filter((m) => m.surgosAlkalmas).length;
  if (!surgos) {
    out.push({ severity: "error", id: "muto.surgos",
      message:
        `Egyetlen műtő sincs sürgős császármetszésre alkalmasnak jelölve. Így a ` +
        `K1 kategória (${HATARIDO_PERC.k1} perc) sosem teljesíthető, és a ` +
        `rendszer ezt nem is venné észre.` });
  }
  if (k.surgossegiTartalek >= surgos && surgos > 0) {
    out.push({ severity: "error", id: "muto.tartalek",
      message:
        `A fenntartott tartalék (${k.surgossegiTartalek}) nem lehet annyi vagy ` +
        `több, mint az összes sürgősségre alkalmas műtő (${surgos}): akkor ` +
        `egyetlen elektív műtét sem lenne beosztható.` });
  }
  if (k.surgossegiTartalek < 1 && surgos > 0) {
    out.push({ severity: "warning", id: "muto.tartalek",
      message:
        `A sürgősségi tartalék NULLA. Ez érvényes szervezeti döntés lehet, de ` +
        `akkor a K1 határidő tarthatósága a szerencsén múlik — és ezt ki kell ` +
        `mondani, nem beállítani.` });
    }
  const h = k.hitelesitesek[k.hitelesitesek.length - 1];
  if (!h) {
    out.push({ severity: "warning", id: "muto.hitelesites",
      message:
        `A sürgősségi tartalék nincs aláírva, ezért ELEKTÍV foglalás egyáltalán ` +
        `nem indul. Ez szándékos: egy alá nem írt tartalék az első zsúfolt napon ` +
        `elfogy, és utólag senki nem tudja megmondani, ki döntött így.` });
  } else if (h.tartalek !== k.surgossegiTartalek) {
    out.push({ severity: "error", id: "muto.hitelesites",
      message:
        `A tartalék megváltozott az aláírás óta (aláírt: ${h.tartalek}, mostani: ` +
        `${k.surgossegiTartalek}). Az aláírás a SZÁMHOZ köt.` });
  }
  return out;
}
