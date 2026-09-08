/**
 * TELEMEDICINA — a távoli megítélés, és amit nem tud a megítélő.
 *
 * A modul egyetlen mondata: **a távoli megítélés olyan adaton áll, amit a
 * megítélő nem vett fel.**
 *
 * Egy ágy melletti ultrahangnál a leletező tudja, hogy nyomta a fejet, hogy a
 * beteg mozgott, hogy a kép rossz szögből készült — és ha kell, ÚJRA FELVESZI.
 * Egy beküldött képnél egyik sem áll rendelkezésre, és ami hiányzik belőle, az
 * NEM LÁTSZIK a képen.
 *
 * A KÉT KAPU, AMI EBBŐL KÖVETKEZIK
 *
 * 1. A MEGTAGADÁS ELSŐRENDŰ KIMENET, NEM HIBAÁG. Ha a beküldött felvétel nem
 *    elég a kérdéshez, azt ÁLLAPOTKÉNT kell tudni rögzíteni, nem szabad
 *    szövegként. Egy távoli leletező, aki nem tud nemet mondani, tippelni fog —
 *    és a tippje leletként fog továbbélni. A „korlátozottan alkalmas” válasz a
 *    legfontosabb a háromból: „a magzati szívet nem ítélem meg ezen a
 *    felvételen, a többit igen” több információ, mint bármelyik szélső érték.
 *
 * 2. A LAIKUS KÉRÉS NEM ORVOSI RENDELÉS. Az e-recept igénylésből akkor és csak
 *    akkor lesz recept, ha egy MEGNEVEZETT KLINIKUS a saját jogosultságával
 *    kiállítja. A kérés ehhez bemenet, nem felhatalmazás. Egy „megújítás”
 *    gomb, ami a korábbi receptet ismétli, pontosan az a hiba, amit a rendszer
 *    mindenütt máshol tilt: a korábbi döntés nem bizonyítja a mostani
 *    indikációt.
 *
 * ÉS A VÉSZJEL, AMIT NEM SZÖVEGBŐL OLVASUNK KI
 *
 * Egy laikus tanácsadás-kérés tartalmazhat vészjelet. A szabad szöveg
 * értelmezése itt nem elég — és nem azért, mert nehéz, hanem mert a tévedés
 * iránya rossz: aki nem írja le, hogy elfolyt a magzatvize, arról a
 * szövegértelmezés azt fogja mondani, hogy nem folyt el. Ezért KÉRDÉSSOR van,
 * és a meg nem válaszolt vészjel-kérdés nem „nem”.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";
import type { Kiallitas as RxKiallitas } from "../rx/kiallitas.ts";
import { kiallithato as rxKiallithato } from "../rx/kiallitas.ts";

/** Mely laikus kérésekből lehet RECEPT — ezek a 32. modul kapuján mennek át. */
const RECEPT_KERESEK = new Set(["keres.recept"]);

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface KonzultacioTipus {
  id: string;
  megnevezes: string;
  /** ExAssist-protokoll, ha a konzultáció vizsgálatra vonatkozik. */
  protokoll: string | null;
  kellKerdes: boolean;
  kellMinoseg: boolean;
  kellReferencia?: boolean;
  kulsoKep?: boolean;
  mit: string[];
  miert: string;
}

export interface LaikusKeres {
  id: string;
  megnevezes: string;
  celReteg: string;
  miert: string;
}

export interface Veszjel {
  id: string;
  kerdes: string;
  azonnali: boolean;
  /** Fordított olvasat: itt a NEM a vészjel („érzi a mozgást?”). */
  forditott?: boolean;
}

export interface TeleKeszlet {
  megnevezes: string;
  modul: number;
  konzultaciok: KonzultacioTipus[];
  laikusKeresek: LaikusKeres[];
  veszjelek: Veszjel[];
  konzultansIgazolas: string | null;
  valaszIdoOra: number | null;
}

export function loadTele(path: string): TeleKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as TeleKeszlet;
}

/* ── A BEKÜLDÉS ──────────────────────────────────────────────────────── */

export interface Bekuldes {
  tipus: string;
  /** MI A KÉRDÉS. Enélkül a konzultáció nem vehető fel. */
  kerdes?: string;
  /** Mikor készült a felvétel. */
  keszult?: string;
  /** Milyen eszközzel. */
  eszkoz?: string;
  /** Ki készítette. */
  keszitette?: string;
  /** Laborleletnél: a mérőlabor és a referenciatartomány. */
  referencia?: string;
  /** Külső képnél: társította-e valaki az esethez. */
  tarsitotta?: string;
}

export type FelvehetoAllapot =
  | "felveheto"
  | "ismeretlenTipus"
  /** Nincs megnevezett kérdés. */
  | "kerdesNelkul"
  /** Nem tudjuk, mikor, mivel és ki készítette. */
  | "eredetNelkul"
  /** Laborleletnél nincs referenciatartomány. */
  | "referenciaNelkul"
  /** Külső kép társítás nélkül — karanténban marad. */
  | "karantenban";

export interface Felvehetoseg {
  felveheto: boolean;
  allapot: FelvehetoAllapot;
  hianyzik: string[];
  miert: string;
}

/**
 * FELVEHETŐ-E A KONZULTÁCIÓKÉRÉS.
 *
 * A kérdés hiánya az első kapu, és nem formaság: a „nézd meg, mit gondolsz”
 * nem kérdés, és a rá adott válasz nem lelet. A leletező nem tudja, mit
 * keressen, a beküldő nem tudja, mit kapott, és fél évvel később senki nem
 * tudja, mire vonatkozott a vélemény.
 */
export function felveheto(k: TeleKeszlet, b: Bekuldes): Felvehetoseg {
  const t = k.konzultaciok.find((x) => x.id === b.tipus);
  if (!t) {
    return { felveheto: false, allapot: "ismeretlenTipus", hianyzik: ["tipus"],
      miert: `Ismeretlen konzultációtípus: „${b.tipus}”.` };
  }
  if (t.kellKerdes && !b.kerdes?.trim()) {
    return { felveheto: false, allapot: "kerdesNelkul", hianyzik: ["kerdes"],
      miert:
        `KÉRDÉS NÉLKÜL NEM VEHETŐ FEL. A „nézd meg, mit gondolsz” nem kérdés, és ` +
        `a rá adott válasz nem lelet: a leletező nem tudja, mit keressen, és fél ` +
        `évvel később senki nem tudja, mire vonatkozott a vélemény.` };
  }
  if (t.kellMinoseg) {
    const h = (["keszult", "eszkoz", "keszitette"] as const).filter((x) => !b[x]?.trim());
    if (h.length) {
      return { felveheto: false, allapot: "eredetNelkul", hianyzik: [...h],
        miert:
          `A felvétel eredete hiányos (${h.join(", ")}). Egy ágy melletti ` +
          `vizsgálatnál a leletező tudja, mikor, mivel és hogyan készült; itt nem ` +
          `tudja — és ami hiányzik belőle, az nem látszik a képen.` };
    }
  }
  if (t.kellReferencia && !b.referencia?.trim()) {
    return { felveheto: false, allapot: "referenciaNelkul", hianyzik: ["referencia"],
      miert:
        `Nincs megnevezve a mérőlabor és a referenciatartomány. Ugyanaz a szám ` +
        `két laborban két különböző dolgot jelent — enélkül az érték „nincs mihez ` +
        `mérni” állapotot kap, nem „normális”-t.` };
  }
  if (t.kulsoKep && !b.tarsitotta?.trim()) {
    return { felveheto: false, allapot: "karantenban", hianyzik: ["tarsitotta"],
      miert:
        `KARANTÉNBAN MARAD. A külső kép ismeretlen eszközről érkezik, néha ` +
        `beégetett betegazonosítóval — a klinikai felületen csak azután látszik, ` +
        `hogy megnevezett cselekvő az esethez társította.` };
  }
  return { felveheto: true, allapot: "felveheto", hianyzik: [],
    miert: `A(z) „${t.megnevezes}” konzultáció felvehető.` };
}

/* ── A MEGÍTÉLÉS — ÉS A MEGTAGADÁS ───────────────────────────────────── */

export type Alkalmassag =
  /** A felvétel alkalmas a kérdés megválaszolására. */
  | "alkalmas"
  /** Részben: MEGNEVEZETT korláttal. */
  | "korlatozott"
  /** A felvételből ez a kérdés nem válaszolható meg. */
  | "alkalmatlan";

export interface Velemeny {
  konzultans: string;
  alkalmassag: Alkalmassag;
  /** `korlatozott` és `alkalmatlan` esetén KÖTELEZŐ: mit nem ítélt meg. */
  nemItelte?: string;
  velemeny?: string;
  /** A kezelő klinikus tudomásulvétele — enélkül a konzílium FÉL. */
  atvetteKi?: string;
  atvetteMikor?: string;
}

export type VelemenyAllapot =
  | "ervenyes"
  /** Korlátozott vagy alkalmatlan, de nem mondja meg, mit nem ítélt meg. */
  | "korlatMegnevezesNelkul"
  /** Alkalmas, de nincs vélemény. */
  | "velemenyNelkul"
  /** Megvan a vélemény, de nem jutott vissza a kezelőhöz. */
  | "atvetelNelkul";

export interface VelemenyAllas {
  allapot: VelemenyAllapot;
  lezart: boolean;
  miert: string;
}

/**
 * A VÉLEMÉNY ÉRVÉNYESSÉGE.
 *
 * Az `alkalmatlan` NEM hiba és nem kudarc: ugyanolyan érvényes kimenet, mint a
 * vélemény — sőt gyakran értékesebb. Amit viszont MEG KELL NEVEZNI: mit nem
 * ítélt meg. Egy „nem tudom megítélni” önmagában ugyanolyan üres, mint a
 * hallgatás.
 *
 * ÉS A NEGYEDIK ÁLLAPOT, AMI NÉLKÜL A KONZÍLIUM FÉL: adtak véleményt, és nem
 * tudjuk, eljutott-e oda, ahol cselekedni kellett volna. Ugyanaz a szerkezet,
 * mint a riasztási lánc nyugtázása.
 */
export function velemenyAllas(v: Velemeny): VelemenyAllas {
  if (v.alkalmassag !== "alkalmas" && !v.nemItelte?.trim()) {
    return {
      allapot: "korlatMegnevezesNelkul", lezart: false,
      miert:
        `A megítélés ${v.alkalmassag === "korlatozott" ? "korlátozott" : "elmaradt"}, ` +
        `de nincs megnevezve, MIT nem ítélt meg. A „nem tudom megítélni” önmagában ` +
        `ugyanolyan üres, mint a hallgatás — a korlát megnevezése az, amiből a ` +
        `kezelő tudja, mit kell máshogy megszereznie.`,
    };
  }
  if (v.alkalmassag === "alkalmas" && !v.velemeny?.trim()) {
    return { allapot: "velemenyNelkul", lezart: false,
      miert: "A felvétel alkalmasnak minősült, de nincs vélemény." };
  }
  if (!v.atvetteKi?.trim()) {
    return {
      allapot: "atvetelNelkul", lezart: false,
      miert:
        `A vélemény megvan, de a kezelő klinikus tudomásulvétele nincs rögzítve. ` +
        `Enélkül a konzílium FÉL: adtak véleményt, és nem tudjuk, eljutott-e oda, ` +
        `ahol cselekedni kellett volna.`,
    };
  }
  return {
    allapot: "ervenyes", lezart: true,
    miert:
      v.alkalmassag === "alkalmas"
        ? `Vélemény átvéve (${v.atvetteKi}).`
        : `A megítélés ${v.alkalmassag === "korlatozott" ? "korlátozott" : "elmaradt"} ` +
          `— „${v.nemItelte}” —, és ez ÉRVÉNYES kimenet. Átvéve (${v.atvetteKi}).`,
  };
}

/* ── A LAIKUS KÉRÉS ──────────────────────────────────────────────────── */

export interface KeresValasz { veszjel: string; valasz: boolean | null; }

export interface Keres {
  tipus: string;
  szoveg?: string;
  valaszok: KeresValasz[];
}

export type KeresAllapot =
  /** Feladat lett belőle egy klinikusnak. */
  | "feladat"
  /** Vészjel: azonnali ellátás, nem várólista. */
  | "veszjel"
  /** A vészjel-kérdéssor nincs végigkérdezve. */
  | "kerdessorHianyos"
  | "ismeretlenTipus";

export interface KeresAllas {
  allapot: KeresAllapot;
  /** Amire igennel felelt (fordítottnál: nemmel). */
  kivaltott: string[];
  /** Amire nem felelt. A meg nem válaszolt vészjel-kérdés NEM „nem”. */
  megvalaszolatlan: string[];
  miert: string;
}

/**
 * A LAIKUS KÉRÉS BESOROLÁSA.
 *
 * A vészjel-kérdéssor VÉGIGKÉRDEZENDŐ, és a meg nem válaszolt kérdés nem „nem”.
 * A fordított kérdésnél („érzi a mozgást?”) a NEM a vészjel — ezt külön jelöli
 * a nyilvántartás, mert a fordított olvasat elrontása pont a legfontosabb
 * kérdésnél némítaná el a rendszert.
 */
export function keresAllas(k: TeleKeszlet, keres: Keres): KeresAllas {
  if (!k.laikusKeresek.some((x) => x.id === keres.tipus)) {
    return { allapot: "ismeretlenTipus", kivaltott: [], megvalaszolatlan: [],
      miert: `Ismeretlen kéréstípus: „${keres.tipus}”.` };
  }
  const map = new Map(keres.valaszok.map((v) => [v.veszjel, v.valasz]));
  const kivaltott: string[] = [];
  const megvalaszolatlan: string[] = [];
  for (const vj of k.veszjelek) {
    const a = map.get(vj.id);
    if (a === undefined || a === null) { megvalaszolatlan.push(vj.id); continue; }
    // A FORDÍTOTT KÉRDÉSNÉL A NEM A VÉSZJEL.
    if (vj.forditott ? a === false : a === true) kivaltott.push(vj.id);
  }
  if (kivaltott.length) {
    return { allapot: "veszjel", kivaltott, megvalaszolatlan,
      miert:
        `VÉSZJEL (${kivaltott.join(", ")}). Ez nem várólistás kérés: azonnali ` +
        `ellátás. A kérés eredeti típusa ettől lényegtelen.` };
  }
  if (megvalaszolatlan.length) {
    return { allapot: "kerdessorHianyos", kivaltott, megvalaszolatlan,
      miert:
        `${megvalaszolatlan.length} vészjel-kérdés megválaszolatlan ` +
        `(${megvalaszolatlan.join(", ")}). A meg nem válaszolt kérdés NEM „nem”: ` +
        `aki nem írja le, hogy elfolyt a magzatvize, arról ez nem bizonyítja, hogy ` +
        `nem folyt el.` };
  }
  return { allapot: "feladat", kivaltott: [], megvalaszolatlan: [],
    miert: `A kérésből FELADAT lesz egy klinikusnak — nem rendelés, és nem időpont.` };
}

/**
 * A KAPU: LESZ-E A KÉRÉSBŐL ORVOSI CSELEKMÉNY.
 *
 * Egyetlen út van: megnevezett klinikus, megnevezett aktussal. A `kerte`
 * mező soha nem elég — a beteg kérése bemenet, nem felhatalmazás.
 *
 * ÉS RECEPTNÉL EZ NEM ELÉG.
 *
 * Ez a kapu eredetileg két dolgot kért: klinikust és ellenőrzött indikációt. A
 * saját indoklása fel is sorolta, mi minden változhatott közben — „terhesség,
 * új interakció, laboreltérés” —, de egyiket sem KÉRTE. Vagyis a rendszerben
 * két receptkiállítási kapu volt, és a GYENGÉBBIKET a beteg tudta elindítani
 * otthonról: egy telemedicinán át kiállított recept kihagyta az allergia-,
 * interakció-, terhesség- és vesefunkció-ellenőrzést.
 *
 * A receptkiállítás mostantól a 32. modul EGYETLEN kapuján megy át
 * (`core/rx/kiallitas.ts`). Ez a függvény a nem receptre irányuló kéréseknél
 * marad az, ami volt.
 */
export interface Kiallitas {
  keres: string;
  /** A klinikus, aki KIÁLLÍTJA. Nem az, aki kérte. */
  klinikus?: string;
  /** Megnézte-e az aktuális indikációt (nem a korábbi rendelést ismételte). */
  indikaciotEllenorizte?: boolean;
  /**
   * RECEPTNÉL KÖTELEZŐ. A 32. modul kiállítási kapujának bemenete; enélkül a
   * receptkérésből nem lesz recept — nem azért, mert hiányos az űrlap, hanem
   * mert a gyengébb kapu volt a hiba.
   */
  receptKapu?: RxKiallitas;
}

export function kiallithato(ki: Kiallitas): { ok: boolean; miert: string } {
  if (!ki.klinikus?.trim()) {
    return { ok: false, miert:
      `A kérésből NEM lesz rendelés magától. Kiállítani megnevezett klinikus tud, ` +
      `a saját jogosultságával — a beteg kérése ehhez bemenet, nem felhatalmazás.` };
  }
  if (!ki.indikaciotEllenorizte) {
    return { ok: false, miert:
      `Az indikáció ellenőrzése nincs rögzítve. Egy „megújítás”, ami a korábbi ` +
      `rendelést ismétli, pontosan az a hiba, amit a rendszer mindenütt máshol ` +
      `tilt: a korábbi döntés nem bizonyítja a mostani indikációt. A gyógyszer ` +
      `közben ellenjavallttá válhatott — terhesség, új interakció, laboreltérés —, ` +
      `és a kérés ezt nem tudja.` };
  }
  if (RECEPT_KERESEK.has(ki.keres)) {
    if (!ki.receptKapu) {
      return { ok: false, miert:
        `RECEPTKÉRÉS a 32. modul kiállítási kapuja nélkül. A telemedicina nem ` +
        `állíthat ki receptet gyengébb feltételekkel, mint a rendelés: az ` +
        `allergia-, interakció-, terhesség- és vesefunkció-ellenőrzés ugyanúgy ` +
        `kell. Egy kapu van, és az a 32. modulé.` };
    }
    const r = rxKiallithato(ki.receptKapu);
    if (!r.kiallithato) {
      return { ok: false, miert: `A 32. modul kapuja zárva (${r.allapot}): ${r.miert}` };
    }
    return { ok: true, miert:
      `Kiállítva: ${ki.klinikus}, ellenőrzött indikációval. ${r.miert}` };
  }
  return { ok: true, miert: `Kiállítva: ${ki.klinikus}, ellenőrzött indikációval.` };
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validateTele(k: TeleKeszlet, protokollIdk: Set<string>): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const t of k.konzultaciok) {
    if (t.protokoll && !protokollIdk.has(t.protokoll)) {
      out.push({ severity: "error", id: `tele.${t.id}`,
        message:
          `A(z) „${t.megnevezes}” a(z) „${t.protokoll}” ExAssist-protokollra ` +
          `hivatkozik, ilyen viszont nincs. A távoli megítélés így nem tudná, ` +
          `mely tételekre kell választ adni.` });
    }
    if (!t.kellKerdes) {
      out.push({ severity: "error", id: `tele.${t.id}.kerdes`,
        message:
          `A(z) „${t.megnevezes}” kérdés nélkül is felvehető volna. A „nézd meg, ` +
          `mit gondolsz” nem kérdés, és a rá adott válasz nem lelet.` });
    }
  }
  if (!k.veszjelek.length) {
    out.push({ severity: "error", id: "tele.veszjelek",
      message:
        `Nincs egyetlen vészjel-kérdés sem. A laikus kérés szabad szövegére ` +
        `támaszkodni itt a rossz irányba téved: aki nem írja le a vészjelet, ` +
        `arról a szövegértelmezés azt mondja, hogy nincs.` });
  }
  if (k.konzultansIgazolas === null) {
    out.push({ severity: "warning", id: "tele.konzultansIgazolas",
      message:
        `Nincs kimondva, ki és hogyan igazolja a távoli konzultáns szakvizsgáját. ` +
        `A vélemény súlya ezen áll, és ez szervezeti döntés, nem fejlesztési.` });
  }
  if (k.valaszIdoOra === null) {
    out.push({ severity: "warning", id: "tele.valaszIdo",
      message:
        `Nincs vállalt válaszidő. Válaszidő nélkül a konzultációkérés nem ` +
        `megkülönböztethető a válasz nélkül maradttól — ugyanaz a rés, mint a ` +
        `riasztási lánc nyugtázatlan ágán.` });
  }
  return out;
}

export interface TeleMerleg {
  konzultacio: number;
  protokollhozKotott: number;
  laikusKeres: number;
  veszjel: number;
  emberreVar: number;
}

export function merleg(k: TeleKeszlet): TeleMerleg {
  return {
    konzultacio: k.konzultaciok.length,
    protokollhozKotott: k.konzultaciok.filter((t) => t.protokoll).length,
    laikusKeres: k.laikusKeresek.length,
    veszjel: k.veszjelek.length,
    emberreVar: [k.konzultansIgazolas, k.valaszIdoOra].filter((x) => x === null).length,
  };
}
