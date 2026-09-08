/**
 * AKKREDITÁCIÓS ÉS TANÚSÍTÁSI KERETRENDSZEREK — ISO 20387 · BELLA · MEES 2.1.
 *
 * A 13. lépés a biobanki ISO 20387-et modellezte. Az intézmény azonban nem egy
 * keretrendszerben él: a magyar ellátásra a BELLA akkreditációs standardjai és
 * a MEES 2.1 tanúsítási standardjai vonatkoznak, és mindhárom UGYANARRA a
 * működésre kérdez rá — más szavakkal, más pontozással, más határidőkkel.
 *
 * AMIÉRT EZ NEM HÁROM KÜLÖN PROJEKT. Egy megírt SOP, egy működő auditnapló,
 * egy hitelesített megőrzési idő MINDHÁROM keretben bizonyíték. Aki
 * keretenként külön gyűjti a bizonyítékot, háromszor csinálja meg ugyanazt —
 * és a három nyilvántartás előbb-utóbb szétcsúszik. A réteg ezért egyetlen
 * bizonyítékbázisra (a dokumentumfára) képezi le mind a hármat.
 *
 * AMI A HÁROMBÓL A LEGSÜRGŐSEBB, ÉS NEM AZ ISO. A MEES 2.1 átmeneti
 * határidői DÁTUMHOZ KÖTÖTTEK és közel vannak: a MEES 2.0 szerinti
 * tanúsítványok 2027-09-25-én érvényüket vesztik, és 2026-09-25-től már csak
 * MEES 2.1 szerinti akkreditált státusz van érvényben. Ez nem tervezési
 * kérdés, hanem naptár — és a rendszerben már két réteg néz naptárt (a
 * mérőeszköz-licencek és a dokumentumfelülvizsgálatok); ez a harmadik.
 *
 * AMI NINCS ÉS NEM IS LEHET ITT. Egyik keret követelményszövege sem: sem az
 * ISO 20387 klauzuláinak szövege, sem a BELLA TARTALMI ELEMEI, sem a MEES 2.1
 * Kézikönyv szövege. A regiszter a SZERKEZETET és a NYILVÁNOSAN KÖZZÉTETT
 * értékelési szabályokat tartja — a pontozó motor ezért fut, de amíg a
 * tartalmi elemek nincsenek betöltve a hivatalos kiadványból, nincs mit
 * pontoznia, és ezt ki is mondja.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A KERETEK ───────────────────────────────────────────────────────── */

export type KeretFajta = "akkreditalas" | "tanusitas";
export type Ellatas = "fekvo" | "jaro";

export interface BellaStandard {
  id: string;
  csoport: string;
  megnevezes: string;
  /** A megnevezett kötelező standardok — hiányukban nincs igazolás. */
  kotelezoStandard: boolean;
  /** `null`, amíg a hivatalos táblázatból nincs betöltve. */
  ellatas: Ellatas[] | null;
}

export interface BellaErtekeles {
  pontertekek: number[];
  pontertekNote: string;
  kotelezoSzazalek: number;
  alapSzazalek: number;
  emeltSzazalek: number;
  ervenyessegEv: number;
  note: string;
}

export interface MeesMerfoldko {
  id: string;
  megnevezes: string;
  /** ISO dátum. */
  hatarido: string;
  felelos: string;
  /** Ha `intezmeny`, akkor ránk is vonatkozik, nem csak a hatóságra. */
  erinti?: string;
}

export interface Keret {
  id: string;
  megnevezes: string;
  fajta: KeretFajta;
  hatokor: string;
  forras: string;
  megjegyzes?: string;
  standardSzam?: { fekvo: number; jaro: number; kozos: number };
  ellatasNote?: string;
  megnevezesNote?: string;
  ertekeles?: BellaErtekeles;
  eljaras?: Array<{ lepes: string; megnevezes: string; honap?: number }>;
  eljarasNote?: string;
  standardok?: BellaStandard[];
  kozzetetel?: string;
  tanusitvanyErvenyessegEv?: number;
  merfoldkovek?: MeesMerfoldko[];
}

export interface Keretek {
  id: string;
  label: I18n;
  note?: string;
  keretek: Keret[];
}

export function loadKeretek(path: string): Keretek {
  return JSON.parse(readFileSync(path, "utf8")) as Keretek;
}

export const keret = (k: Keretek, id: string): Keret | undefined =>
  k.keretek.find((x) => x.id === id);

/* ── A MEES 2.1 NAPTÁR ───────────────────────────────────────────────── */

export type MerfoldkoAllapot = "lejart" | "kuszobon" | "tavoli";

export interface MerfoldkoAllas {
  id: string;
  megnevezes: string;
  hatarido: string;
  napMulva: number;
  allapot: MerfoldkoAllapot;
  /** Ránk vonatkozik-e, vagy csak a hatóság teendője. */
  minket: boolean;
  miert: string;
}

/** Ennyivel előre szólunk — mint a licenceknél és a dokumentumfelülvizsgálatnál. */
export const ELOJELZES_NAP = 90;

const napok = (a: string, b: string): number =>
  Math.floor((Date.parse(a) - Date.parse(b)) / 86400000);

/**
 * A MEES 2.1 ÁTMENET NAPTÁRA.
 *
 * A lejárt mérföldkő nem hiba a rendszerben: a hatóság saját teendői közül
 * több már a múltban van, és ez rendben van. Ami minket érint, az a két
 * utolsó — az átmeneti időszak és a tanúsítói átmeneti időszak vége —, és
 * azoknál a lejárat azt jelenti, hogy a régi tanúsítvány már nem érvényes.
 */
export function meesNaptar(k: Keret, ma: string): MerfoldkoAllas[] {
  return (k.merfoldkovek ?? []).map((m) => {
    const n = napok(m.hatarido, ma);
    const minket = m.erinti === "intezmeny";
    const allapot: MerfoldkoAllapot =
      n < 0 ? "lejart" : n <= ELOJELZES_NAP ? "kuszobon" : "tavoli";
    return {
      id: m.id, megnevezes: m.megnevezes, hatarido: m.hatarido, napMulva: n,
      allapot, minket,
      miert:
        allapot === "lejart"
          ? minket
            ? `LEJÁRT ${-n} napja (${m.hatarido}): a korábbi változat szerinti ` +
              `státusz ettől a naptól nem érvényes.`
            : `Elmúlt (${m.hatarido}) — a hatóság teendője volt, nem a miénk.`
          : allapot === "kuszobon"
            ? `${n} NAP MÚLVA (${m.hatarido})` +
              (minket ? " — és ez ránk vonatkozik." : " — a hatóság teendője.")
            : `${n} nap múlva (${m.hatarido}).`,
    };
  });
}

/* ── A BELLA PONTOZÁS ────────────────────────────────────────────────── */

export type ElemKategoria = "kotelezo" | "alap" | "emelt";

/**
 * EGY TARTALMI ELEM ÉRTÉKELÉSE.
 *
 * Öt állapot, és a különbségük a lényeg:
 *
 *   nemErtelmezheto  az adott intézményben nem értelmezhető — KIESIK a
 *                    nevezőből is. Ez az a pont, ahol a legkönnyebb tévedni:
 *                    egy kizárt elem nem nulla pont, hanem KISEBB elérhető
 *                    maximum, tehát a százalék elmozdul.
 *   nemErtekelt      még nem nézte meg senki. NEM nulla — a hiányzó adat itt
 *                    sem „nem”: a szint ilyenkor NEM ítélhető meg.
 *   0 · 2 · 4        a felülvizsgálaton megítélt pont.
 */
export type ElemErtekeles = "nemErtelmezheto" | "nemErtekelt" | 0 | 2 | 4;

export interface TartalmiElem {
  id: string;
  standard: string;
  kategoria: ElemKategoria;
  /** A hivatalos kiadványból; enélkül a pontozás nem futtatható. */
  sulyszam: number;
  ertekeles: ElemErtekeles;
}

export interface KategoriaPont {
  kategoria: ElemKategoria;
  ertekelt: number;
  kizart: number;
  nemErtekelt: number;
  elert: number;
  elerheto: number;
  szazalek: number | null;
}

export function pontszam(elemek: TartalmiElem[], kategoria: ElemKategoria): KategoriaPont {
  const sajat = elemek.filter((e) => e.kategoria === kategoria);
  const kizart = sajat.filter((e) => e.ertekeles === "nemErtelmezheto");
  const nemErtekelt = sajat.filter((e) => e.ertekeles === "nemErtekelt");
  const ertekelt = sajat.filter((e) => typeof e.ertekeles === "number");
  // A KIZÁRT ELEM A NEVEZŐBŐL IS KIESIK — a nem értékelt NEM.
  const szamit = sajat.filter((e) => e.ertekeles !== "nemErtelmezheto");
  const elert = ertekelt.reduce((n, e) => n + (e.ertekeles as number) * e.sulyszam, 0);
  const elerheto = szamit.reduce((n, e) => n + 4 * e.sulyszam, 0);
  return {
    kategoria, ertekelt: ertekelt.length, kizart: kizart.length,
    nemErtekelt: nemErtekelt.length, elert, elerheto,
    szazalek: elerheto > 0 ? (elert / elerheto) * 100 : null,
  };
}

export type BellaSzint = "nincs" | "alap" | "emelt" | "nemMegitelheto";

export interface BellaEredmeny {
  szint: BellaSzint;
  kotelezo: KategoriaPont;
  alap: KategoriaPont;
  emelt: KategoriaPont;
  /** Kötelező elemek, amik nem teljesülnek 100%-ban. */
  bukoKotelezo: string[];
  miert: string;
}

/**
 * AZ AKKREDITÁCIÓS SZINT — és a kapu, ami a pontszámtól FÜGGETLEN.
 *
 * A kötelező tartalmi elemeket 100%-ban teljesíteni kell; hiányukban az
 * elért pontszámtól függetlenül nem adható ki igazolás. Ez ugyanaz a
 * szerkezet, mint a rendszer többi kapuja: nem a jó átlag nyit, hanem az,
 * hogy egyetlen megnevezett tétel sem bukik el.
 *
 * ÉS AMI ELŐBB VAN MINDENNÉL: ha bármelyik értékelendő elem NEM ÉRTÉKELT, a
 * szint nem ítélhető meg. Nem „még nem elég” — hanem „még nem tudjuk”.
 */
export function bellaSzint(elemek: TartalmiElem[], e: BellaErtekeles): BellaEredmeny {
  const kot = pontszam(elemek, "kotelezo");
  const alap = pontszam(elemek, "alap");
  const emelt = pontszam(elemek, "emelt");
  const kozos = { kotelezo: kot, alap, emelt };

  const nemErtekelt = kot.nemErtekelt + alap.nemErtekelt + emelt.nemErtekelt;
  if (nemErtekelt) {
    return {
      ...kozos, szint: "nemMegitelheto", bukoKotelezo: [],
      miert:
        `A SZINT NEM ÍTÉLHETŐ MEG: ${nemErtekelt} tartalmi elem még nem ` +
        `értékelt. A nem értékelt elem nem nulla pont — a hiányzó adat itt sem ` +
        `„nem”. Előbb a felülvizsgálat, aztán a szint.`,
    };
  }

  // A KÖTELEZŐ KAPU: 100%, és a pontszámtól független.
  const buko = elemek
    .filter((x) => x.kategoria === "kotelezo" && typeof x.ertekeles === "number" &&
                   (x.ertekeles as number) < 4)
    .map((x) => x.id);
  if (buko.length) {
    return {
      ...kozos, szint: "nincs", bukoKotelezo: buko,
      miert:
        `NEM ADHATÓ KI IGAZOLÁS: ${buko.length} kötelező tartalmi elem nem ` +
        `teljesül maradéktalanul (${buko.join(", ")}). A kötelező elemeket ` +
        `${e.kotelezoSzazalek}%-ban teljesíteni kell, és ez az elért pontszámtól ` +
        `FÜGGETLEN — a jó átlag nem váltja ki.`,
    };
  }

  const alapMeg = (alap.szazalek ?? 0) >= e.alapSzazalek;
  if (!alapMeg) {
    return {
      ...kozos, szint: "nincs", bukoKotelezo: [],
      miert:
        `A kötelező elemek teljesülnek, de az alapszintű elemek ` +
        `${(alap.szazalek ?? 0).toFixed(1)}%-on állnak (küszöb: ${e.alapSzazalek}%).`,
    };
  }
  const emeltMeg = (emelt.szazalek ?? 0) >= e.emeltSzazalek;
  return {
    ...kozos, szint: emeltMeg ? "emelt" : "alap", bukoKotelezo: [],
    miert: emeltMeg
      ? `EMELT SZINT: a kötelező elemek teljesülnek, az alapszint ` +
        `${(alap.szazalek ?? 0).toFixed(1)}%, az emelt szint ` +
        `${(emelt.szazalek ?? 0).toFixed(1)}% (küszöb ${e.emeltSzazalek}%). ` +
        `Az igazolás ${e.ervenyessegEv} évre szól.`
      : `ALAPSZINT: az alapszintű elemek ${(alap.szazalek ?? 0).toFixed(1)}%-on ` +
        `(küszöb ${e.alapSzazalek}%), az emelt szint ` +
        `${(emelt.szazalek ?? 0).toFixed(1)}% (küszöb ${e.emeltSzazalek}%). ` +
        `Az igazolás ${e.ervenyessegEv} évre szól.`,
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateKeretek(k: Keretek, ma: string): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const x of k.keretek) {
    if (latott.has(x.id)) {
      out.push({ severity: "error", id: x.id, message: "két keret ugyanazzal az azonosítóval" });
    }
    latott.add(x.id);
    if (!x.forras?.trim()) {
      out.push({ severity: "error", id: x.id,
        message: "a keretnek meg kell neveznie a forrását — kiadással és dátummal" });
    }
  }

  const b = keret(k, "bella");
  if (b) {
    const std = b.standardok ?? [];
    const sz = b.standardSzam;
    if (sz) {
      // A KÖZÖLT SZÁMOK ÖSSZEFÜGGENEK: |fekvő ∪ járó| = fekvő + járó − közös.
      const unio = sz.fekvo + sz.jaro - sz.kozos;
      if (unio !== std.length) {
        out.push({ severity: "error", id: "bella",
          message:
            `a közölt darabszámok (fekvő ${sz.fekvo} · járó ${sz.jaro} · közös ` +
            `${sz.kozos}) ${unio} különböző standardot adnak ki, a lista viszont ` +
            `${std.length} tételt tartalmaz` });
      }
      const fekvo = std.filter((s) => s.ellatas?.includes("fekvo")).length;
      const jaro = std.filter((s) => s.ellatas?.includes("jaro")).length;
      const nincs = std.filter((s) => s.ellatas === null).length;
      if (nincs) {
        out.push({ severity: "warning", id: "bella",
          message:
            `${nincs}/${std.length} standardnál nincs kitöltve az ellátási forma ` +
            `(most fekvő ${fekvo}, járó ${jaro}; a kiadvány szerint ${sz.fekvo} és ` +
            `${sz.jaro}). A hozzárendelést a hivatalos táblázat oszlopjelölései ` +
            `adják meg — tippelni nem szabad, ezért áll ott \`null\`` });
      }
    }
    if (!std.some((s) => s.kotelezoStandard)) {
      out.push({ severity: "error", id: "bella",
        message: "egyetlen kötelező standard sincs megjelölve — a kötelező kapu így nem zárna" });
    }
    // A PONTOZÓ MOTOR FUT, DE NINCS MIT PONTOZNIA.
    out.push({ severity: "warning", id: "bella",
      message:
        `a ${std.length} standard TARTALMI ELEMEI nincsenek betöltve (súlyszám és ` +
        `kategória a hivatalos kiadványból) — a pontozó motor fut, de nincs mit ` +
        `pontoznia, és a szint nem ítélhető meg` });
  }

  const m = keret(k, "mees21");
  if (m) {
    for (const x of meesNaptar(m, ma)) {
      if (!x.minket) continue;
      if (x.allapot === "lejart") {
        out.push({ severity: "error", id: x.id,
          message: `MEES-mérföldkő LEJÁRT: ${x.megnevezes} — ${x.miert}` });
      } else if (x.allapot === "kuszobon") {
        out.push({ severity: "warning", id: x.id,
          message: `MEES-mérföldkő ${x.napMulva} nap múlva: ${x.megnevezes}` });
      }
    }
    if (m.kozzetetel && m.tanusitvanyErvenyessegEv) {
      const lejar = new Date(m.kozzetetel);
      lejar.setUTCFullYear(lejar.getUTCFullYear() + m.tanusitvanyErvenyessegEv);
      const kozolt = (m.merfoldkovek ?? []).find((x) => x.id === "mees.m5")?.hatarido;
      if (kozolt && kozolt !== lejar.toISOString().slice(0, 10)) {
        out.push({ severity: "error", id: "mees21",
          message:
            `a levezetett érvényességvég (${m.kozzetetel} + ` +
            `${m.tanusitvanyErvenyessegEv} év = ${lejar.toISOString().slice(0, 10)}) ` +
            `eltér a közölt mérföldkő dátumától (${kozolt})` });
      }
    }
  }
  return out;
}

export interface KeretMerleg {
  keretek: number;
  bellaStandard: number;
  bellaKotelezo: number;
  bellaEllatasNelkul: number;
  meesKovetkezo: MerfoldkoAllas | null;
}

export function merleg(k: Keretek, ma: string): KeretMerleg {
  const b = keret(k, "bella");
  const m = keret(k, "mees21");
  const std = b?.standardok ?? [];
  const jovo = m ? meesNaptar(m, ma).filter((x) => x.minket && x.napMulva >= 0) : [];
  return {
    keretek: k.keretek.length,
    bellaStandard: std.length,
    bellaKotelezo: std.filter((s) => s.kotelezoStandard).length,
    bellaEllatasNelkul: std.filter((s) => s.ellatas === null).length,
    meesKovetkezo: jovo.length ? jovo.sort((a, c) => a.napMulva - c.napMulva)[0] : null,
  };
}
