/**
 * ÁGYKEZELÉS — ahol a „szabad” szó három különböző dolgot jelent.
 *
 * Egy osztályos ágynyilvántartás triviálisnak látszik: van ágy, van rajta
 * beteg vagy nincs. A gyakorlatban ez a modell három ponton hazudik, és
 * mindhárom akkor derül ki, amikor már beteget küldtek rá.
 *
 * 1. A SZABAD ÁGY NEM UGYANAZ, MINT A KIADHATÓ ÁGY.
 *
 * Egy ágy lehet üres és mégsem kiadható: takarítás alatt áll, elkülönítési
 * kohorszhoz tartozik, meghibásodott, vagy már oda van ígérve egy érkezőnek.
 * Ha a rendszer ezeket „szabad”-nak számolja, a kimutatott kapacitás nagyobb a
 * valóságosnál — és az osztály beteget vesz fel oda, ahová nem tud.
 *
 * A hiányzó állapot ezért NEM „szabad”: az `ismeretlen` külön állapot, és nem
 * számít bele a kiadható kapacitásba.
 *
 * 2. A SZÜLÉSZETI ÁGYON KÉT BETEG FEKSZIK.
 *
 * A rooming-in ágy az anyát ÉS az újszülöttet tartja. A 29. modul ezt már
 * kimondta: az újszülött KÜLÖN BETEG, saját rekorddal. Egy „egy ágy = egy
 * beteg” modell ezért minden szülészeti osztályon rosszul számol — és
 * pontosan a legérzékenyebb ponton: ha az újszülött nem foglal helyet a
 * nyilvántartásban, akkor nem is látszik, hogy ott van.
 *
 * 3. AZ ÁTHELYEZÉS KÖZBEN A BETEG SEHOL VAN, VAGY KÉT HELYEN.
 *
 * Ha az „érkezett” előbb rögzül, mint az „elment”, a beteg két ágyat foglal.
 * Ha fordítva, egyiket sem — és a keresésben eltűnik. Az áthelyezés ezért nem
 * két esemény, hanem EGY művelet, aminek van köztes állapota (`uton`), és a
 * köztes állapotot LÁTNI kell.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

/** Szülészeti-nőgyógyászati osztály helytípusai. Nem cserélhetők egymással. */
export type HelyTipus =
  | "triazs"
  | "szulószoba"
  | "muto"
  | "ebreszto"
  | "gyermekagyas"
  | "terhespatologia"
  | "nogyogyaszat"
  | "nicu";

export type AgyAllapot =
  /** Üres ÉS kiadható. */
  | "kiadhato"
  /** Beteg van rajta. */
  | "foglalt"
  /** Üres, de NEM kiadható — megnevezett okkal. */
  | "nemKiadhato"
  /** Oda van ígérve egy érkezőnek. Nem szabad, és nem is foglalt. */
  | "fenntartva"
  /** Nem tudjuk. NEM „kiadható”. */
  | "ismeretlen";

export interface Agy {
  id: string;
  hely: HelyTipus;
  szoba: string;
  /** Rooming-in ágy: az anyán kívül az újszülött is ide tartozik. */
  roomingIn?: boolean;
  label?: I18n;
}

export interface AgyHelyzet {
  agy: string;
  allapot: AgyAllapot;
  /** Kik vannak rajta. Szülészeti ágyon ez KETTŐ is lehet. */
  betegek?: string[];
  /** `nemKiadhato` / `fenntartva` esetén: MIÉRT. Ok nélkül nem állapot. */
  ok?: string;
  /** `fenntartva` esetén: meddig. Lejárat nélkül a foglalás örökre szól. */
  eddig?: string;
}

export interface AgyKeszlet {
  megnevezes: string;
  modul: number;
  note: string;
  agyak: Agy[];
}

export function loadAgyak(path: string): AgyKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as AgyKeszlet;
}

/* ── A KIADHATÓSÁG ───────────────────────────────────────────────────── */

export interface KiadhatosagItelet {
  kiadhato: boolean;
  allapot: AgyAllapot;
  miert: string;
}

export function kiadhato(h: AgyHelyzet | undefined, most: string): KiadhatosagItelet {
  if (!h) {
    return { kiadhato: false, allapot: "ismeretlen",
      miert:
        `Az ágy állapota nincs rögzítve. EZ NEM „SZABAD”: a kimutatott kapacitás ` +
        `enélkül nagyobb a valóságosnál, és az osztály oda vesz fel beteget, ` +
        `ahová nem tud.` };
  }
  if (h.allapot === "foglalt") {
    const n = h.betegek?.length ?? 0;
    return { kiadhato: false, allapot: "foglalt",
      miert: `Foglalt (${n} beteg${n > 1 ? " — rooming-in" : ""}).` };
  }
  if (h.allapot === "nemKiadhato") {
    return { kiadhato: false, allapot: "nemKiadhato",
      miert: `Nem kiadható: ${h.ok || "OK NINCS MEGNEVEZVE — ok nélkül ez nem állapot"}.` };
  }
  if (h.allapot === "fenntartva") {
    if (h.eddig && Date.parse(h.eddig) < Date.parse(most)) {
      return { kiadhato: true, allapot: "kiadhato",
        miert: `A fenntartás ${h.eddig}-kor lejárt, az ágy felszabadult.` };
    }
    return { kiadhato: false, allapot: "fenntartva",
      miert:
        `Fenntartva: ${h.ok || "ok nélkül"}` +
        (h.eddig ? `, ${h.eddig}-ig.` :
          `. LEJÁRAT NÉLKÜL a fenntartás örökre szól, és a kapacitás csendben fogy.`) };
  }
  if (h.allapot === "ismeretlen") {
    return { kiadhato: false, allapot: "ismeretlen",
      miert: `Az ágy állapota ismeretlen. Nem „szabad”.` };
  }
  return { kiadhato: true, allapot: "kiadhato", miert: `Kiadható.` };
}

/* ── A KAPACITÁS ─────────────────────────────────────────────────────── */

export interface Kapacitas {
  hely: HelyTipus;
  agy: number;
  kiadhato: number;
  foglalt: number;
  nemKiadhato: number;
  fenntartva: number;
  /** Ismeretlen állapotú ágy. Ez a szám a kimutatás megbízhatóságát mondja meg. */
  ismeretlen: number;
  /** Hány BETEG fekszik — nem hány ágy foglalt. Szülészeten a kettő nem azonos. */
  beteg: number;
  miert: string;
}

export function kapacitas(
  k: AgyKeszlet, helyzetek: AgyHelyzet[], hely: HelyTipus, most: string,
): Kapacitas {
  const map = new Map(helyzetek.map((h) => [h.agy, h]));
  const agyak = k.agyak.filter((a) => a.hely === hely);
  const it = agyak.map((a) => ({ a, i: kiadhato(map.get(a.id), most) }));
  const n = (s: AgyAllapot) => it.filter((x) => x.i.allapot === s).length;
  const beteg = agyak.reduce((s, a) => s + (map.get(a.id)?.betegek?.length ?? 0), 0);
  const ismeretlen = n("ismeretlen");
  return {
    hely, agy: agyak.length, kiadhato: n("kiadhato"), foglalt: n("foglalt"),
    nemKiadhato: n("nemKiadhato"), fenntartva: n("fenntartva"), ismeretlen, beteg,
    miert: ismeretlen
      ? `${n("kiadhato")} kiadható ágy — DE ${ismeretlen} ágy állapota ismeretlen, ` +
        `tehát a valódi szám ${n("kiadhato")} és ${n("kiadhato") + ismeretlen} között van.`
      : `${n("kiadhato")} kiadható ágy ${agyak.length}-ból, ${beteg} beteggel.`,
  };
}

/* ── AZ ÁTHELYEZÉS ───────────────────────────────────────────────────── */

export type AthelyezesAllapot =
  /** Elindult, de még nem érkezett meg. A beteg ÚTON van — ez látható állapot. */
  | "uton"
  | "megerkezett"
  /** A cél nem kiadható. Az áthelyezés el sem indulhat. */
  | "celNemKiadhato"
  /** A beteg nincs ott, ahonnan indítanánk. */
  | "nincsAKiindulopontban"
  /** Ugyanaz a hely. */
  | "ertelmetlen";

export interface Athelyezes {
  allapot: AthelyezesAllapot;
  /** A beteg pillanatnyi helye. `uton` esetén EGYIK ágy sem adható ki. */
  honnan: string | null;
  hova: string | null;
  miert: string;
}

/**
 * AZ ÁTHELYEZÉS EGY MŰVELET, NEM KÉT ESEMÉNY.
 *
 * A köztes állapot (`uton`) LÁTHATÓ: a kiinduló ágy addig nem adható ki (a
 * beteg visszafordulhat), és a cél sem (oda megy valaki). Két esemény
 * rögzítésével a beteg vagy két ágyat foglalna, vagy egyiket sem — és az
 * utóbbi a rosszabb, mert a keresésben eltűnik.
 */
export function athelyez(
  betegId: string, honnan: string, hova: string,
  helyzetek: AgyHelyzet[], most: string,
): Athelyezes {
  if (honnan === hova) {
    return { allapot: "ertelmetlen", honnan, hova,
      miert: `A kiinduló és a cél ágy azonos (${honnan}).` };
  }
  const forras = helyzetek.find((h) => h.agy === honnan);
  if (!forras?.betegek?.includes(betegId)) {
    return { allapot: "nincsAKiindulopontban", honnan: null, hova: null,
      miert:
        `A(z) ${betegId} beteg nincs a(z) ${honnan} ágyon. Az áthelyezés innen ` +
        `nem indítható — enélkül a beteg egy pillanatra sehol nem lenne, és a ` +
        `keresésben eltűnne.` };
  }
  const cel = kiadhato(helyzetek.find((h) => h.agy === hova), most);
  if (!cel.kiadhato) {
    return { allapot: "celNemKiadhato", honnan, hova: null,
      miert: `A cél ágy (${hova}) nem kiadható: ${cel.miert}` };
  }
  return { allapot: "uton", honnan, hova,
    miert:
      `A(z) ${betegId} ÚTON van ${honnan} → ${hova}. Amíg meg nem érkezik, ` +
      `EGYIK ágy sem adható ki: a kiinduló azért, mert a beteg visszafordulhat, ` +
      `a cél azért, mert oda megy valaki.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateAgyak(k: AgyKeszlet, helyzetek: AgyHelyzet[]): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = k.agyak.map((a) => a.id);
  for (const d of new Set(ids.filter((x, i) => ids.indexOf(x) !== i))) {
    out.push({ severity: "error", id: d, message: `Ismétlődő ágyazonosító: ${d}.` });
  }
  const halmaz = new Set(ids);
  const holVan = new Map<string, string[]>();
  for (const h of helyzetek) {
    if (!halmaz.has(h.agy)) {
      out.push({ severity: "error", id: h.agy,
        message: `Nem létező ágy állapota: „${h.agy}”.` });
    }
    if ((h.allapot === "nemKiadhato" || h.allapot === "fenntartva") && !h.ok?.trim()) {
      out.push({ severity: "error", id: h.agy,
        message:
          `A(z) „${h.agy}” ágy ${h.allapot}, de nincs megnevezve, MIÉRT. Ok ` +
          `nélkül ez nem állapot, hanem eltűnt kapacitás.` });
    }
    const agy = k.agyak.find((a) => a.id === h.agy);
    if (agy && !agy.roomingIn && (h.betegek?.length ?? 0) > 1) {
      out.push({ severity: "error", id: h.agy,
        message:
          `${h.betegek!.length} beteg egy nem rooming-in ágyon (${h.agy}). Ha ez ` +
          `anya-újszülött pár, az ágyat rooming-innek kell jelölni — az újszülött ` +
          `KÜLÖN BETEG (29. modul), és ha nem foglal helyet a nyilvántartásban, ` +
          `nem is látszik, hogy ott van.` });
    }
    for (const b of h.betegek ?? []) {
      holVan.set(b, [...(holVan.get(b) ?? []), h.agy]);
    }
  }
  for (const [beteg, agyak] of holVan) {
    if (agyak.length > 1) {
      out.push({ severity: "error", id: beteg,
        message:
          `A(z) ${beteg} beteg EGYSZERRE ${agyak.length} ágyon szerepel ` +
          `(${agyak.join(", ")}). Ez az áthelyezés fél-rögzítésének tünete: az ` +
          `„érkezett” előbb rögzült, mint az „elment”.` });
    }
  }
  return out;
}
