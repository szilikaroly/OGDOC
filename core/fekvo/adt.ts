/**
 * ÁGYÁLLAPOT-GÉP ÉS ADT — felvétel, áthelyezés, elbocsátás.
 *
 * Az ágy állapota nem jelző, hanem ÁLLAPOTGÉP, és a takarítás benne van:
 *
 *   szabad ──foglal──▶ fenntartva ──erkezik──▶ foglalt ──elbocsat──▶ piszkos
 *      ▲                    │                                          │
 *      └────────────────────┴──────────takarit──────────────────────────┘
 *
 *   barmelyik ──kivon──▶ karbantartas ──visszaad──▶ piszkos
 *
 * KÉT ÁTMENET HIÁNYZIK A NAIV MODELLBŐL, ÉS MINDKETTŐ ÜZEMELTETÉSI VALÓSÁG:
 *
 * 1. AZ ELBOCSÁTÁS UTÁN AZ ÁGY NEM SZABAD, HANEM PISZKOS. Ha a rendszer az
 *    elbocsátáskor azonnal szabadra állítja, a felvételi iroda olyan ágyra küld
 *    beteget, amit még nem takarítottak ki — és ez nem adminisztratív
 *    kellemetlenség, hanem fertőzésátvitel. A `piszkos` állapot egyben MUNKA
 *    is: a takarításnak van címzettje.
 *
 * 2. A KARBANTARTÁSBÓL VISSZAADOTT ÁGY SEM SZABAD. Előbb takarítani kell.
 *
 * ÉS AMI A LEGGYAKORIBB CSENDES HIBA: AZ ÁLLAPOT ÖREGSZIK.
 *
 * Egy „piszkos” ágy, ami két napja piszkos, nem takarításra vár — arról
 * elfelejtkeztek. Egy „fenntartva” ágy, aminek a fenntartása tegnap járt le,
 * nem fenntartva van, hanem elveszett kapacitás. Az állapotnak ezért IDEJE van,
 * és az idő maga is jel.
 */
import type { RegistryIssue } from "../registry.ts";

/* ── AZ ÁLLAPOTGÉP ───────────────────────────────────────────────────── */

export type AgyAllapot =
  | "szabad"
  | "fenntartva"
  | "foglalt"
  | "piszkos"
  | "karbantartas"
  /** Nem tudjuk. NEM „szabad” — és nem is átmenet célja. */
  | "ismeretlen";

export type Atmenet =
  | "foglal" | "erkezik" | "elbocsat" | "takarit" | "kivon" | "visszaad"
  /** A fenntartás lemondása vagy lejárata. */
  | "felszabadit";

/** Az engedélyezett átmenetek. Ami nincs benne, az NEM tévedés, hanem tilos. */
export const ATMENETEK: Record<AgyAllapot, Partial<Record<Atmenet, AgyAllapot>>> = {
  szabad: { foglal: "fenntartva", erkezik: "foglalt", kivon: "karbantartas" },
  fenntartva: { erkezik: "foglalt", felszabadit: "szabad", kivon: "karbantartas" },
  foglalt: { elbocsat: "piszkos", kivon: "karbantartas" },
  piszkos: { takarit: "szabad", kivon: "karbantartas" },
  karbantartas: { visszaad: "piszkos" },
  ismeretlen: {},
};

export interface AgyHelyzet {
  agy: string;
  allapot: AgyAllapot;
  /** Mikor lépett ebbe az állapotba. Az állapot öregszik. */
  mikortol?: string;
  /** Kik vannak rajta. Rooming-in ágyon KETTŐ. */
  betegek?: string[];
  /** `fenntartva`, `karbantartas`, `piszkos`: MIÉRT / KINEK. Ok nélkül nem állapot. */
  ok?: string;
  /** `fenntartva`: meddig. Lejárat nélkül a fenntartás örökre szól. */
  eddig?: string;
}

export interface AtmenetItelet {
  ok: boolean;
  ujAllapot: AgyAllapot | null;
  miert: string;
}

export function atmenet(mostani: AgyAllapot, mit: Atmenet): AtmenetItelet {
  if (mostani === "ismeretlen") {
    return { ok: false, ujAllapot: null,
      miert:
        `Ismeretlen állapotú ágyon nem indítható átmenet. Az „ismeretlen” nem ` +
        `„szabad”: előbb meg kell nézni, mi van ott.` };
  }
  const cel = ATMENETEK[mostani][mit];
  if (!cel) {
    return { ok: false, ujAllapot: null,
      miert:
        `A(z) „${mit}” átmenet a(z) „${mostani}” állapotból NEM ENGEDÉLYEZETT. ` +
        (mostani === "foglalt" && mit === "takarit"
          ? `Foglalt ágyat nem lehet kitakarítani — előbb elbocsátás.`
          : mostani === "piszkos" && mit === "erkezik"
          ? `PISZKOS ÁGYRA NEM ÉRKEZIK BETEG. Ez nem adminisztratív ` +
            `kellemetlenség: az elbocsátás utáni azonnali „szabad” állapot ` +
            `fertőzésátvitel.`
          : `Az engedélyezett átmenetek innen: ` +
            `${Object.keys(ATMENETEK[mostani]).join(", ") || "egy sem"}.`) };
  }
  return { ok: true, ujAllapot: cel,
    miert: `${mostani} → ${cel} (${mit}).` };
}

/* ── AZ ÁLLAPOT ÖREGSZIK ─────────────────────────────────────────────── */

export type OregedesAllapot = "friss" | "elhuzodo" | "elfelejtve" | "nemMerheto";

export interface Oregedes {
  allapot: OregedesAllapot;
  oraja: number | null;
  miert: string;
}

/** Meddig elfogadható egy állapot, órában. Ezen túl az állapot maga a jel. */
export const OREGEDES_ORA: Partial<Record<AgyAllapot, { elhuzodo: number; elfelejtve: number }>> = {
  piszkos: { elhuzodo: 2, elfelejtve: 12 },
  fenntartva: { elhuzodo: 4, elfelejtve: 24 },
  karbantartas: { elhuzodo: 72, elfelejtve: 336 },
};

export function oregedes(h: AgyHelyzet, most: string): Oregedes {
  const hatar = OREGEDES_ORA[h.allapot];
  if (!hatar) {
    return { allapot: "friss", oraja: null,
      miert: `A(z) „${h.allapot}” állapot nem öregszik.` };
  }
  if (!h.mikortol) {
    return { allapot: "nemMerheto", oraja: null,
      miert:
        `A(z) „${h.allapot}” állapotnak nincs kezdete, így nem tudjuk, mióta tart. ` +
        `Egy két napja piszkos ágy nem takarításra vár — arról elfelejtkeztek —, ` +
        `és pontosan ez a különbség tűnik el itt.` };
  }
  const ora = (Date.parse(most) - Date.parse(h.mikortol)) / 3_600_000;
  if (ora >= hatar.elfelejtve) {
    return { allapot: "elfelejtve", oraja: Math.round(ora),
      miert:
        `${Math.round(ora)} órája „${h.allapot}” — ez már nem folyamat, hanem ` +
        `ELFELEJTETT ÁGY. A kapacitás így csendben fogy: a kimutatásban nem ` +
        `hiányzik, csak nem kiadható.` };
  }
  if (ora >= hatar.elhuzodo) {
    return { allapot: "elhuzodo", oraja: Math.round(ora),
      miert: `${Math.round(ora)} órája „${h.allapot}” (elhúzódó, határ ${hatar.elhuzodo} óra).` };
  }
  return { allapot: "friss", oraja: Math.round(ora),
    miert: `${Math.round(ora)} órája „${h.allapot}”.` };
}

/* ── ADT ─────────────────────────────────────────────────────────────── */

/** HL7 ADT üzenettípusok — a kifelé illesztés ezekre épül. */
export type AdtTipus = "A01" | "A02" | "A03";

export const ADT_JELENTES: Record<AdtTipus, string> = {
  A01: "felvétel", A02: "áthelyezés", A03: "elbocsátás",
};

export interface AdtEsemeny {
  tipus: AdtTipus;
  beteg: string;
  honnan?: string | null;
  hova?: string | null;
  mikor: string;
  /** KI rendelte el. Áthelyezésnél és elbocsátásnál nem elhagyható. */
  elrendelte: string;
  indok?: string;
}

export type AdtAllapot = "rogzitheto" | "nincsElrendelo" | "helyHianyzik" | "ertelmetlen";

export interface AdtItelet {
  allapot: AdtAllapot;
  rogzitheto: boolean;
  miert: string;
}

/**
 * AZ ADT-ESEMÉNY NEM NAPLÓSOR, HANEM ÁLLÍTÁS ARRÓL, HOL VAN A BETEG.
 *
 * Ezért kell hozzá elrendelő: egy áthelyezés, aminek nincs gazdája, utólag nem
 * magyarázható meg — és a betegáthelyezés az a művelet, amit a leggyakrabban
 * kérdeznek vissza (miért került intenzívről osztályra, ki döntött róla).
 */
export function adtRogzitheto(e: AdtEsemeny): AdtItelet {
  if (!e.elrendelte?.trim()) {
    return { allapot: "nincsElrendelo", rogzitheto: false,
      miert:
        `A(z) ${ADT_JELENTES[e.tipus]} (${e.tipus}) esemény elrendelő megnevezése ` +
        `nélkül nem rögzíthető. Az áthelyezés az a művelet, amit a leggyakrabban ` +
        `kérdeznek vissza — gazda nélkül utólag nem magyarázható meg.` };
  }
  if (e.tipus === "A01" && !e.hova) {
    return { allapot: "helyHianyzik", rogzitheto: false,
      miert: `Felvétel cél nélkül: nincs megmondva, HOVA vették fel a beteget.` };
  }
  if (e.tipus === "A02" && (!e.honnan || !e.hova)) {
    return { allapot: "helyHianyzik", rogzitheto: false,
      miert:
        `Áthelyezés hiányos hellyel (honnan: ${e.honnan ?? "—"}, hova: ` +
        `${e.hova ?? "—"}). Fél áthelyezésnél a beteg vagy két helyen van, vagy ` +
        `egy helyen sem.` };
  }
  if (e.tipus === "A02" && e.honnan === e.hova) {
    return { allapot: "ertelmetlen", rogzitheto: false,
      miert: `Áthelyezés önmagába (${e.honnan}).` };
  }
  if (e.tipus === "A03" && !e.honnan) {
    return { allapot: "helyHianyzik", rogzitheto: false,
      miert: `Elbocsátás anélkül, hogy tudnánk, HONNAN — az ágy nem lesz piszkos, csak marad foglalt.` };
  }
  return { allapot: "rogzitheto", rogzitheto: true,
    miert: `${ADT_JELENTES[e.tipus]} (${e.tipus}), elrendelte: ${e.elrendelte}.` };
}

/* ── MÉRLEG ÉS VALIDÁLÁS ─────────────────────────────────────────────── */

export interface AdtMerleg {
  agy: number;
  szabad: number;
  foglalt: number;
  piszkos: number;
  fenntartva: number;
  karbantartas: number;
  ismeretlen: number;
  /** Elfelejtett ágy: elhúzódó állapotban ragadt kapacitás. */
  elfelejtve: number;
  beteg: number;
}

export function merleg(helyzetek: AgyHelyzet[], most: string): AdtMerleg {
  const n = (a: AgyAllapot) => helyzetek.filter((h) => h.allapot === a).length;
  return {
    agy: helyzetek.length, szabad: n("szabad"), foglalt: n("foglalt"),
    piszkos: n("piszkos"), fenntartva: n("fenntartva"),
    karbantartas: n("karbantartas"), ismeretlen: n("ismeretlen"),
    elfelejtve: helyzetek.filter((h) => oregedes(h, most).allapot === "elfelejtve").length,
    beteg: helyzetek.reduce((s, h) => s + (h.betegek?.length ?? 0), 0),
  };
}

export function validateHelyzetek(
  helyzetek: AgyHelyzet[], agyIdk: Set<string>, roomingIn: Set<string>, most: string,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const holVan = new Map<string, string[]>();
  for (const h of helyzetek) {
    if (!agyIdk.has(h.agy)) {
      out.push({ severity: "error", id: h.agy, message: `Nem létező ágy állapota: „${h.agy}”.` });
    }
    if (["fenntartva", "karbantartas", "piszkos"].includes(h.allapot) && !h.ok?.trim()) {
      out.push({ severity: "error", id: h.agy,
        message:
          `A(z) „${h.agy}” ágy ${h.allapot}, de nincs megnevezve, MIÉRT vagy ` +
          `KINEK. Ok nélkül ez nem állapot, hanem eltűnt kapacitás.` });
    }
    if (h.allapot === "foglalt" && !(h.betegek?.length)) {
      out.push({ severity: "error", id: h.agy,
        message: `A(z) „${h.agy}” ágy foglalt, de nincs rajta megnevezett beteg.` });
    }
    if ((h.betegek?.length ?? 0) > 1 && !roomingIn.has(h.agy)) {
      out.push({ severity: "error", id: h.agy,
        message:
          `${h.betegek!.length} beteg egy nem rooming-in ágyon (${h.agy}). Ha ez ` +
          `anya–újszülött pár, az ágyat rooming-innek kell jelölni: az újszülött ` +
          `KÜLÖN beteg, és ha nem foglal helyet, nem is látszik, hogy ott van.` });
    }
    const o = oregedes(h, most);
    if (o.allapot === "elfelejtve") {
      out.push({ severity: "warning", id: h.agy, message: o.miert });
    }
    if (o.allapot === "nemMerheto") {
      out.push({ severity: "warning", id: h.agy, message: o.miert });
    }
    for (const b of h.betegek ?? []) holVan.set(b, [...(holVan.get(b) ?? []), h.agy]);
  }
  for (const [beteg, agyak] of holVan) {
    if (agyak.length > 1) {
      out.push({ severity: "error", id: beteg,
        message:
          `A(z) ${beteg} beteg EGYSZERRE ${agyak.length} ágyon szerepel ` +
          `(${agyak.join(", ")}). Ez a fél-rögzített áthelyezés tünete.` });
    }
  }
  return out;
}
