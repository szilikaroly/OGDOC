/**
 * VÉDŐOLTÁSOK — ahol nem egy szám téved, hanem egy IDŐPONT csúszik el.
 *
 * A rendszer többi küszöbénél a rossz érték rossz megítélést ad. Itt más a
 * hiba természete: egy két hónappal korábbra tett oltás nem „kicsit rossz” —
 * HATÁSTALAN lehet, és az elmulasztott dózist senki nem pótolja vissza
 * magától. Ezért az oltási naptár is aláírásra vár, és az aláírás a naptár
 * MAGJÁHOZ köt: az oltási rend évente változik (a Módszertani levél új
 * kiadása), és a változás elavulttá teszi a korábbi aláírást.
 *
 * KÉT ÜTEMEZÉS, ÉS ÖSSZEKEVERNI ŐKET SZERKEZETI HIBA
 *
 * A 2026. évi Módszertani levél kimondja: „A kampányoltások iskolai osztályokra
 * és nem a tanulók életkorára vonatkoznak.” A csecsemő- és kisdedkori oltások
 * ÉLETKORHOZ kötöttek (hónapban), az iskoláskoriak ÉVFOLYAMHOZ.
 *
 * Ez nem szóhasználati különbség. A tankötelezettség Magyarországon 6 éves kor
 * körül kezdődik, de a beiratkozás gyakorlatban 5 és 7 éves kor közé esik — ez
 * KÉT ÉV szórás. A 6. és a 7. évfolyam között viszont EGY év a különbség, és
 * más oltás jár (6.: MMR újraoltás és dTap; 7.: hepatitis B sorozat és HPV).
 * Vagyis az életkorból számolt évfolyam a szórásánál kisebb különbséget
 * próbálna eldönteni: egy 12 éves harmadikos és egy 12 éves hatodikos NEM
 * ugyanazt az oltást kapja.
 *
 * EZÉRT A MEGOLDÁS EGY SZÁMLÁLÓ, NEM EGY BECSLÉS. Rögzítjük, melyik TANÉVBEN
 * kezdte a gyermek az 1. évfolyamot, és onnantól az évfolyam számolható:
 *
 *     évfolyam = mostani tanév − beiratkozás tanéve + 1
 *
 * Beiratkozási év nélkül az évfolyam NEM ISMERETLEN HELYETT NULLA, hanem
 * `evfolyamIsmeretlen`: a kampányoltás se nem esedékes, se nem elmaradt —
 * eldönthetetlen, és ezt látni kell. Az életkorból nem pótoljuk.
 *
 * AZ ÖT ÁLLAPOT, ÉS AMIÉRT NEM HÁROM
 *
 *   beadva        oltóanyag tétel- és lejáratszámmal
 *   halasztva     MEGNEVEZETT orvosi okkal ÉS új időponttal
 *   elutasitva    a szülő megtagadta — KÜLÖN ÁLLAPOT
 *   ellenjavallt  tartós orvosi ellenjavallat, dokumentálva
 *   atesett       varicellánál: átesett a betegségen, nem oltandó
 *
 * Az `elutasitva` azért nem olvasztható az „elmaradt”-ba, mert Magyarországon
 * a KÖTELEZŐ oltás megtagadása jogkövetkezménnyel és jelentési
 * kötelezettséggel jár. Ha a rendszer a megtagadást ugyanúgy mutatja, mint a
 * betegség miatti halasztást, akkor a jelentési kötelezettség csendben elmarad
 * — és az elmaradása később nem magyarázható azzal, hogy „nem tudtuk”.
 *
 * ÉS A HALASZTÁS IDŐPONT NÉLKÜL NEM HALASZTÁS. Új időpont nélkül az
 * „elhalasztva” pontosan úgy viselkedik, mint az elmaradás — csak
 * megnyugtatóbban néz ki.
 *
 * AZ OLTÓANYAG TÉTELSZÁMA NEM ADMINISZTRÁCIÓ. Visszahívás esetén ez az
 * EGYETLEN mód megtalálni az érintetteket. Beadott oltás tételszám nélkül
 * visszahívhatatlan — és ez akkor derül ki, amikor már késő.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export type OltasTipus = "kotelezo" | "ajanlott";
export type Utemezes = "folyamatos" | "kampany";

interface PontKozos {
  id: string;
  oltas: string;
  tipus: OltasTipus;
  /** Egyidejűleg adandó oltások azonosítói. */
  egyidejuleg?: string[];
  megjegyzes?: string;
}

/** Életkorhoz kötött oltás. */
export interface FolyamatosPont extends PontKozos {
  utemezes: "folyamatos";
  /** Életkor hónapban; `"0"` = újszülöttkor. */
  korHonap: string;
}

/** ISKOLAI ÉVFOLYAMHOZ kötött kampányoltás — nem életkorhoz. */
export interface KampanyPont extends PontKozos {
  utemezes: "kampany";
  /** Pl. „6. évfolyam”. */
  evfolyam: string;
  /** A kampány hónapja(i) — tájékoztató, nem küszöb. */
  honap?: string;
}

export type OltasiPont = FolyamatosPont | KampanyPont;

export interface Idokoz {
  id: string;
  szabaly: string;
  napMin: number;
}

export interface OltasKeszlet {
  megnevezes: string;
  modul: number;
  forras: string;
  ervenyes: string;
  note: string;
  allapotok: Array<{ kod: string; label_hu: string; miert: string }>;
  naptar: OltasiPont[];
  idokozok: Idokoz[];
  hitelesitesek: Array<{ ki: string; mikor: string; lenyomat: string }>;
}

export function loadOltasok(path: string): OltasKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as OltasKeszlet;
}

/** Az évfolyam-megjelölésből („6. évfolyam”) a szám. Nem találgat. */
export function evfolyamSzam(s: string): number | null {
  const m = /^\s*(\d{1,2})\./.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 13 ? n : null;
}

/**
 * A NAPTÁR MAGJA — ebből képződik a lenyomat, amihez az aláírás köt.
 * Benne van az ütemezés MÓDJA is: ha egy kampányoltás életkorhoz kötötté
 * válna (vagy fordítva), az más oltási rend, és az aláírás elavul.
 * Az időköz-szabályok is a maghoz tartoznak: a 4 hét élővírus-intervallum
 * megváltozása ugyanúgy oltási rend változása.
 */
export function lenyeg(k: OltasKeszlet): string {
  const n = k.naptar
    .map((o) => (o.utemezes === "folyamatos"
      ? `f:${o.korHonap}:${o.oltas}:${o.tipus}`
      : `k:${o.evfolyam}:${o.oltas}:${o.tipus}`))
    .sort().join("|");
  const i = k.idokozok.map((x) => `${x.id}=${x.napMin}`).sort().join("|");
  return `${n}#${i}`;
}
export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag).digest("hex").slice(0, 16);
}

export type NaptarAllapot = "alairt" | "alairatlan" | "elavult";

export function naptarKapu(k: OltasKeszlet): { allapot: NaptarAllapot; adItel: boolean; miert: string } {
  const mag = lenyomat(lenyeg(k));
  const h = k.hitelesitesek[k.hitelesitesek.length - 1];
  if (!h) {
    return { allapot: "alairatlan", adItel: false,
      miert:
        `A ${k.naptar.length} oltási időpont közül egy sincs aláírva. A naptár ` +
        `nem ad esedékességet: itt nem egy szám téved, hanem egy IDŐPONT csúszik ` +
        `el, és egy korábbra tett oltás hatástalan lehet.` };
  }
  if (h.lenyomat !== mag) {
    return { allapot: "elavult", adItel: false,
      miert:
        `Az oltási rend MEGVÁLTOZOTT az aláírás óta (aláírt: ${h.lenyomat}, ` +
        `mostani: ${mag}). A Módszertani levél évente új kiadást kap — az ` +
        `aláírás a naptár magjához köt, nem a dokumentumhoz.` };
  }
  return { allapot: "alairt", adItel: true,
    miert: `Az oltási naptár aláírva (${h.ki}, ${h.mikor}), érvényes: ${k.ervenyes}.` };
}

/* ── AZ ÉVFOLYAM-SZÁMLÁLÓ ────────────────────────────────────────────── */

export interface IskolaiAllas {
  /** A TANÉV kezdőéve, amelyben a gyermek az 1. évfolyamot megkezdte (pl. 2032). */
  beiratkozasTanev?: number;
  /** A mostani tanév kezdőéve (pl. 2038 = 2038/39). */
  mostaniTanev?: number;
  /** Kézzel rögzített évfolyam. Ha van, ez az irányadó — a számláló csak pótol. */
  rogzitettEvfolyam?: number;
  /**
   * Kimondott szakmai vélemény: a gyermek feltehetően SOSEM éri el a kijelölt
   * évfolyamot (a Módszertani levél szerint ilyenkor alsóbb évfolyamon is
   * oltandó). Emberi döntés, nem számítás.
   */
  sosemEriEl?: boolean;
}

export type EvfolyamForras = "rogzitett" | "szamolt" | "nincs" | "ertelmetlen";

export interface EvfolyamItelet {
  evfolyam: number | null;
  honnan: EvfolyamForras;
  miert: string;
}

/**
 * ÉVFOLYAM A SZÁMLÁLÓBÓL. Életkorból SOHA: a beiratkozás 5 és 7 éves kor közé
 * esik, ami két év szórás — a 6. és a 7. évfolyam között viszont egy év a
 * különbség, és más az oltás.
 */
export function evfolyam(i: IskolaiAllas | undefined): EvfolyamItelet {
  if (!i) {
    return { evfolyam: null, honnan: "nincs",
      miert:
        `Nincs iskolai állás rögzítve. Az évfolyam ELDÖNTHETETLEN — és ` +
        `életkorból nem pótoljuk: a beiratkozás 5–7 éves kor közé esik, ez két ` +
        `év szórás, miközben a 6. és 7. évfolyam oltásai egy évre vannak egymástól.` };
  }
  if (typeof i.rogzitettEvfolyam === "number") {
    const e = i.rogzitettEvfolyam;
    if (!Number.isInteger(e) || e < 1 || e > 13) {
      return { evfolyam: null, honnan: "ertelmetlen",
        miert: `A rögzített évfolyam (${e}) nem értelmezhető. 1 és 13 között lehet.` };
    }
    return { evfolyam: e, honnan: "rogzitett",
      miert: `Rögzített évfolyam: ${e}.` };
  }
  if (typeof i.beiratkozasTanev !== "number" || typeof i.mostaniTanev !== "number") {
    return { evfolyam: null, honnan: "nincs",
      miert:
        `A számláló hiányos (beiratkozás tanéve: ` +
        `${i.beiratkozasTanev ?? "nincs"}, mostani tanév: ${i.mostaniTanev ?? "nincs"}). ` +
        `Évfolyam nélkül a kampányoltás se nem esedékes, se nem elmaradt.` };
  }
  const e = i.mostaniTanev - i.beiratkozasTanev + 1;
  if (e < 1 || e > 13) {
    return { evfolyam: null, honnan: "ertelmetlen",
      miert:
        `A számláló ${e}. évfolyamot ad (beiratkozás: ${i.beiratkozasTanev}, ` +
        `mostani tanév: ${i.mostaniTanev}) — ez nem lehetséges. Valamelyik ` +
        `tanév hibás; az évfolyam eldönthetetlen marad.` };
  }
  return { evfolyam: e, honnan: "szamolt",
    miert:
      `${e}. évfolyam (${i.mostaniTanev} − ${i.beiratkozasTanev} + 1). ` +
      `Számlálóból, nem életkorból.` };
}

/* ── A BEADOTT OLTÁS ─────────────────────────────────────────────────── */

export type OltasAllapot = "beadva" | "halasztva" | "elutasitva" | "ellenjavallt" | "atesett";

export interface Bejegyzes {
  oltas: string;
  allapot: OltasAllapot;
  /** `beadva`: mikor. */
  mikor?: string;
  /** `beadva`: az oltóanyag tételszáma — visszahíváshoz KÖTELEZŐ. */
  tetelszam?: string;
  lejarat?: string;
  /** `halasztva` / `ellenjavallt` / `atesett`: az ok. */
  indok?: string;
  /** `halasztva`: az ÚJ időpont. Enélkül nem halasztás. */
  ujIdopont?: string;
  /** Ki rögzítette — a gyermekorvosi és a védőnői rekord egyesítéséhez. */
  forras?: string;
}

export type SorAllapot =
  | "beadva"
  /** Beadva, de tételszám nélkül — visszahívásnál megtalálhatatlan. */
  | "beadvaTetelszamNelkul"
  | "halasztva"
  /** Halasztva, de nincs új időpont — ez elmaradás, csak jobban néz ki. */
  | "halasztvaIdopontNelkul"
  | "elutasitva"
  | "ellenjavallt"
  | "atesett"
  /** Esedékes volt, és nincs bejegyzés. EZ A JEL. */
  | "hianyzik"
  | "megNemEsedekes"
  /** Kampányoltás, de nem tudjuk, hányadik évfolyamos. NEM „nem esedékes”. */
  | "evfolyamIsmeretlen";

export interface Sor {
  pont: OltasiPont;
  allapot: SorAllapot;
  /** Jelentési kötelezettséget keletkeztet-e (kötelező oltás megtagadása). */
  jelentendo: boolean;
  miert: string;
}

export interface GyermekAllas {
  /** Betöltött életkor hónapban. */
  korHonap: number;
  /** Az iskolai számláló — a kampányoltásokhoz. */
  iskola?: IskolaiAllas;
}

export function allas(
  k: OltasKeszlet, gy: GyermekAllas, bejegyzesek: Bejegyzes[], turelmiHonap = 1,
): Sor[] {
  const map = new Map(bejegyzesek.map((b) => [b.oltas, b]));
  const ev = evfolyam(gy.iskola);
  return k.naptar.map((p) => {
    const b = map.get(p.oltas);
    if (b) return bejegyzesbol(p, b);
    return esedekesseg(p, gy, ev, turelmiHonap);
  });
}

function bejegyzesbol(p: OltasiPont, b: Bejegyzes): Sor {
  if (b.allapot === "beadva" && !b.tetelszam?.trim()) {
    return { pont: p, allapot: "beadvaTetelszamNelkul", jelentendo: false,
      miert:
        `${p.oltas} beadva, DE OLTÓANYAG-TÉTELSZÁM NÉLKÜL. Visszahívás esetén ` +
        `ez az egyetlen mód megtalálni az érintetteket — enélkül a beadott ` +
        `oltás visszahívhatatlan, és ez akkor derül ki, amikor már késő.` };
  }
  if (b.allapot === "halasztva" && !b.ujIdopont?.trim()) {
    return { pont: p, allapot: "halasztvaIdopontNelkul", jelentendo: false,
      miert:
        `${p.oltas} „elhalasztva”, de NINCS ÚJ IDŐPONT. Ez elmaradás, csak ` +
        `megnyugtatóbban néz ki: időpont nélkül a halasztás pontosan úgy ` +
        `viselkedik, mint a mulasztás.` };
  }
  if (b.allapot === "elutasitva") {
    const jel = p.tipus === "kotelezo";
    return { pont: p, allapot: "elutasitva", jelentendo: jel,
      miert: jel
        ? `${p.oltas}: a szülő MEGTAGADTA. Kötelező oltás — jogkövetkezménnyel ` +
          `és JELENTÉSI KÖTELEZETTSÉGGEL jár. Ez nem ugyanaz, mint a betegség ` +
          `miatti halasztás, és nem is olvasztható bele.`
        : `${p.oltas}: a szülő nem kérte. Ajánlott oltás — nem jár ` +
          `jogkövetkezménnyel, és nem jelentendő.` };
  }
  return { pont: p, allapot: b.allapot, jelentendo: false,
    miert: `${p.oltas}: ${b.allapot}${b.indok ? ` (${b.indok})` : ""}.` };
}

function esedekesseg(
  p: OltasiPont, gy: GyermekAllas, ev: EvfolyamItelet, turelmiHonap: number,
): Sor {
  if (p.utemezes === "folyamatos") {
    const esedekes = Number(p.korHonap);
    if (gy.korHonap < esedekes + turelmiHonap) {
      return { pont: p, allapot: "megNemEsedekes", jelentendo: false,
        miert: `${p.oltas} még nem esedékes (${esedekes} hó).` };
    }
    return { pont: p, allapot: "hianyzik", jelentendo: false,
      miert:
        `${p.oltas} ESEDÉKES VOLT (${esedekes} hó), és nincs bejegyzés. Az ` +
        `elmulasztott dózist senki nem pótolja vissza magától — ha elmaradt, azt ` +
        `meg kell nevezni.` };
  }
  const cel = evfolyamSzam(p.evfolyam);
  if (cel === null) {
    return { pont: p, allapot: "evfolyamIsmeretlen", jelentendo: false,
      miert:
        `${p.oltas}: a naptárban szereplő „${p.evfolyam}” nem értelmezhető ` +
        `évfolyamként, így az esedékesség eldönthetetlen.` };
  }
  if (ev.evfolyam === null) {
    return { pont: p, allapot: "evfolyamIsmeretlen", jelentendo: false,
      miert:
        `${p.oltas} a ${p.evfolyam}ra esik, de a gyermek évfolyama nem ismert. ` +
        `${ev.miert} Kampányoltásnál az ÉVFOLYAM az irányadó, nem az életkor — ` +
        `ezért ez a sor se nem esedékes, se nem elmaradt: eldönthetetlen.` };
  }
  if (ev.evfolyam < cel) {
    if (gy.iskola?.sosemEriEl) {
      return { pont: p, allapot: "hianyzik", jelentendo: false,
        miert:
          `${p.oltas} rendesen a ${p.evfolyam}ra esne (a gyermek most ` +
          `${ev.evfolyam}.), de kimondott szakmai vélemény szerint a gyermek ` +
          `feltehetően sosem éri el a kijelölt évfolyamot — a Módszertani levél ` +
          `szerint ilyenkor alsóbb évfolyamon is oltandó. ESEDÉKES.` };
    }
    return { pont: p, allapot: "megNemEsedekes", jelentendo: false,
      miert:
        `${p.oltas} a ${p.evfolyam}ra esik; a gyermek most ${ev.evfolyam}. ` +
        `évfolyamos (${ev.honnan}).` };
  }
  return { pont: p, allapot: "hianyzik", jelentendo: false,
    miert:
      `${p.oltas} ESEDÉKES VOLT (${p.evfolyam}${p.honap ? `, ${p.honap}` : ""}), ` +
      `a gyermek most ${ev.evfolyam}. évfolyamos, és nincs bejegyzés.` };
}

export interface OltasMerleg {
  pont: number;
  beadva: number;
  hianyzik: number;
  jelentendo: number;
  tetelszamNelkul: number;
  idopontNelkul: number;
  /** Kampánysorok, amelyek évfolyam híján eldönthetetlenek. */
  evfolyamNelkul: number;
}

export function merleg(sorok: Sor[]): OltasMerleg {
  const n = (a: SorAllapot) => sorok.filter((s) => s.allapot === a).length;
  return {
    pont: sorok.length, beadva: n("beadva"), hianyzik: n("hianyzik"),
    jelentendo: sorok.filter((s) => s.jelentendo).length,
    tetelszamNelkul: n("beadvaTetelszamNelkul"),
    idopontNelkul: n("halasztvaIdopontNelkul"),
    evfolyamNelkul: n("evfolyamIsmeretlen"),
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateOltasok(k: OltasKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = k.naptar.map((o) => o.id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) {
    out.push({ severity: "error", id: "oltas.dup",
      message: `Ismétlődő oltásazonosító: ${[...new Set(dup)].join(", ")}.` });
  }
  const idHalmaz = new Set(ids);
  for (const o of k.naptar) {
    if (o.utemezes === "folyamatos") {
      if (!/^\d+$/.test(o.korHonap)) {
        out.push({ severity: "error", id: `oltas.${o.id}`,
          message: `A(z) „${o.oltas}” életkora nem szám: „${o.korHonap}”.` });
      }
    } else if (o.utemezes === "kampany") {
      if (evfolyamSzam(o.evfolyam) === null) {
        out.push({ severity: "error", id: `oltas.${o.id}`,
          message:
            `A(z) „${o.oltas}” évfolyama nem értelmezhető: „${o.evfolyam}”. ` +
            `A kampányoltás évfolyamhoz kötött, és évfolyam nélkül nem ` +
            `esedékesíthető.` });
      }
    } else {
      out.push({ severity: "error", id: `oltas.${(o as OltasiPont).id}`,
        message: `Ismeretlen ütemezés a(z) „${(o as OltasiPont).oltas}” sorban.` });
    }
    for (const e of o.egyidejuleg ?? []) {
      if (!idHalmaz.has(e)) {
        out.push({ severity: "error", id: `oltas.${o.id}.egyidejuleg`,
          message: `A(z) „${o.oltas}” egyidejű párja („${e}”) nincs a naptárban.` });
      }
    }
  }
  /* Az egyidejűség KÖLCSÖNÖS: ha A-t B-vel egyszerre kell adni, de B nem tud
     A-ról, akkor B oltásakor senki nem szól A-ért. */
  for (const o of k.naptar) {
    for (const e of o.egyidejuleg ?? []) {
      const t = k.naptar.find((x) => x.id === e);
      if (t && !(t.egyidejuleg ?? []).includes(o.id)) {
        out.push({ severity: "warning", id: `oltas.${o.id}.kolcsonos`,
          message:
            `„${o.oltas}” egyidejű párja „${t.oltas}”, de a párja nem hivatkozik ` +
            `vissza rá. Az egyidejűség így csak az egyik irányból látszik: ` +
            `${t.oltas} beadásakor semmi nem emlékeztet ${o.oltas}-ra.` });
      }
    }
  }
  if (!k.allapotok.some((a) => a.kod === "elutasitva")) {
    out.push({ severity: "error", id: "oltas.elutasitva",
      message:
        `Nincs külön „elutasítva” állapot. A kötelező oltás megtagadása ` +
        `jelentési kötelezettséggel jár — az „elmaradt”-ba olvasztva ez a ` +
        `kötelezettség csendben elveszne.` });
  }
  if (!k.naptar.some((o) => o.utemezes === "kampany")) {
    out.push({ severity: "warning", id: "oltas.kampany",
      message:
        `Nincs egyetlen kampányoltás sem. A Módszertani levél szerint az ` +
        `iskoláskori oltások évfolyamhoz kötöttek — ha mind életkorhoz kötött, ` +
        `a naptár szerkezetileg téved.` });
  }
  if (!k.idokozok.length) {
    out.push({ severity: "warning", id: "oltas.idokoz",
      message:
        `Nincs időköz-szabály. Két élővírus-vakcina között — ha nem egyidejűek — ` +
        `4 hét kell; enélkül a rendszer a túl korai második oltást nem látja.` });
  }
  const g = naptarKapu(k);
  if (!g.adItel) {
    out.push({ severity: "warning", id: "oltas.naptar", message: g.miert });
  }
  return out;
}
