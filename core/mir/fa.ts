/**
 * A MINŐSÉGIRÁNYÍTÁSI DOKUMENTUMFA ÉS AZ ISO 20387 KONTROLLMÁTRIX —
 * a 13. lépés gépi fele.
 *
 * A lépés nem fejlesztési feladat: a dokumentumfát a minőségirányítási vezető
 * állítja fel, és a reális átfutás 12–18 hónap — az egész projekt leghosszabb
 * tétele. A gép három dolgot tud hozzátenni, és mindhárom olyat javít, ami a
 * papíralapú minőségirányításban rendre elromlik.
 *
 * 1. AZ ÖSSZEGZÉST NEM KÉZZEL ÍRJUK. A megfelelési fejezet végén álló
 *    „hol tartunk” tábla kézzel gépelt számokat tartalmazott — és ELCSÚSZOTT:
 *    45 kontrollsort 39-nek mondott, és MIND A NÉGY kategória számai eltértek
 *    a felettük álló soroktól. Ez az a szám, amit egy auditor először néz meg.
 *    Mostantól a mátrix ADAT, az összegzés pedig belőle SZÁMOLÓDIK.
 *
 * 2. A DOKUMENTUM LEJÁR. A dokumentumfa saját szövege mondja ki: „a legtöbb
 *    minőségirányítási rendszer azon bukik el, hogy a dokumentumokat senki nem
 *    vizsgálja felül, és az audit két éve lejárt SOP-okat talál.” A
 *    felülvizsgálati esedékesség ezért nem jegyzet, hanem motor — és a lejárt
 *    dokumentum NEM hatályos, akkor sem, ha ott van a polcon.
 *
 * 3. A KONTROLLNAK BIZONYÍTÉKA VAN, NEM ÁLLAPOTJELE. Ugyanaz a szabály, mint
 *    a 11. lépés ETT-dossziéjánál: az auditor a „Bizonyíték” oszlopot kéri, nem
 *    a „Megvalósítás” oszlopot. Egy kontroll, amelyik mellé nincs megnevezett
 *    dokumentum, nem „részben megvan” — csak annyi, hogy valaki leírt róla egy
 *    mondatot.
 *
 * ÉS A FA SAJÁT SZABÁLYA, amit eddig semmi nem kényszerített ki: minden SOP-hoz
 * tartozik legalább egy űrlap vagy rendszerbeli feljegyzés. SOP feljegyzés
 * nélkül nem bizonyít semmit; feljegyzés SOP nélkül nem szabályozott.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A FA ────────────────────────────────────────────────────────────── */

export type Szint = "politika" | "kezikonyv" | "eljaras" | "sop";

export interface DokumentumDef {
  /** `QP-01`, `SOP-05`, `POL-01`, `KEZ-01`. */
  id: string;
  szint: Szint;
  csoport?: string;
  targy: string;
  gazda: string;
  /** Hány havonta esedékes a felülvizsgálat. */
  felulvizsgalatHonap: number;
  /** Az űrlap vagy feljegyzés, ami bizonyítja, hogy a SOP szerint jártak el. */
  bizonyitek: string[];
  /** Az első körben elkészítendők — a fa saját tanácsa szerint. */
  elsoKor: boolean;
}

export interface Dokumentumfa {
  id: string;
  label: I18n;
  note?: string;
  dokumentumok: DokumentumDef[];
}

export function loadFa(path: string): Dokumentumfa {
  return JSON.parse(readFileSync(path, "utf8")) as Dokumentumfa;
}

/* ── A HATÁLYOS ÁLLAPOT ──────────────────────────────────────────────── */

export interface HatalyosDokumentum {
  doc: string;
  verzio: string;
  /** Mikortól hatályos. ISO dátum. */
  hatalyos: string;
  keszitette: string;
  jovahagyta: string;
  /** Mikorra esedékes a következő felülvizsgálat. */
  kovetkezoFelulvizsgalat: string;
  /** A ténylegesen létező űrlapok/feljegyzések. */
  bizonyitek: string[];
  megjegyzes?: string;
}

export interface FaAllapot {
  szerepek: Record<string, string>;
  hatalyos: HatalyosDokumentum[];
}

export function loadAllapot(path: string): FaAllapot {
  return JSON.parse(readFileSync(path, "utf8")) as FaAllapot;
}

export type DokAllapot =
  /** Hatályos, a felülvizsgálat még nem esedékes. */
  | "hatalyos"
  /** Hatályos, de a felülvizsgálat 90 napon belül esedékes. */
  | "felulvizsgalatEsedekes"
  /** A felülvizsgálat LEJÁRT — a dokumentum nem hatályos. */
  | "lejart"
  /** Nincs ilyen dokumentum. */
  | "nincs";

/** A felülvizsgálat nem egy nap alatt megy — ennyivel előre szólunk. */
export const ELOJELZES_NAP = 90;

const napok = (a: string, b: string): number =>
  Math.floor((Date.parse(a) - Date.parse(b)) / 86400000);

export interface DokumentumAllas {
  doc: string;
  szint: Szint;
  csoport: string | null;
  targy: string;
  allapot: DokAllapot;
  /** Számít-e bizonyítéknak MA. A lejárt dokumentum nem számít. */
  eros: boolean;
  verzio: string | null;
  kovetkezoFelulvizsgalat: string | null;
  napMulva: number | null;
  bizonyitek: string[];
  elsoKor: boolean;
  miert: string;
}

export function dokumentumAllas(
  fa: Dokumentumfa, allapot: FaAllapot, ma: string,
): DokumentumAllas[] {
  const byId = new Map(allapot.hatalyos.map((h) => [h.doc, h]));
  return fa.dokumentumok.map((d) => {
    const h = byId.get(d.id);
    const kozos = {
      doc: d.id, szint: d.szint, csoport: d.csoport ?? null, targy: d.targy,
      elsoKor: d.elsoKor,
    };
    if (!h) {
      return {
        ...kozos, allapot: "nincs" as const, eros: false, verzio: null,
        kovetkezoFelulvizsgalat: null, napMulva: null, bizonyitek: [],
        miert: "Nincs ilyen dokumentum. Amíg nincs, a rá épülő kontrollok nem bizonyíthatók.",
      };
    }
    const n = napok(h.kovetkezoFelulvizsgalat, ma);
    if (n < 0) {
      return {
        ...kozos, allapot: "lejart" as const, eros: false, verzio: h.verzio,
        kovetkezoFelulvizsgalat: h.kovetkezoFelulvizsgalat, napMulva: n,
        bizonyitek: h.bizonyitek ?? [],
        miert:
          `A FELÜLVIZSGÁLAT ${-n} NAPJA LEJÁRT (${h.kovetkezoFelulvizsgalat}). A ` +
          `lejárt dokumentum akkor sem hatályos, ha ott van a polcon — és az ` +
          `audit pontosan ezt találja meg.`,
      };
    }
    const kozel = n <= ELOJELZES_NAP;
    return {
      ...kozos,
      allapot: kozel ? ("felulvizsgalatEsedekes" as const) : ("hatalyos" as const),
      eros: true, verzio: h.verzio,
      kovetkezoFelulvizsgalat: h.kovetkezoFelulvizsgalat, napMulva: n,
      bizonyitek: h.bizonyitek ?? [],
      miert: kozel
        ? `Hatályos (v${h.verzio}), de a felülvizsgálat ${n} nap múlva esedékes.`
        : `Hatályos (v${h.verzio}), felülvizsgálat ${h.kovetkezoFelulvizsgalat}.`,
    };
  });
}

/* ── A KONTROLLMÁTRIX ────────────────────────────────────────────────── */

export type Kategoria = "altalanos" | "eroforras" | "folyamat" | "iranyitas";
export type RogzitettAllapot = "megvan" | "reszben" | "nincs";

export interface KontrollDef {
  id: string;
  kategoria: Kategoria;
  szakasz: string;
  mitVar: string;
  megvalositas: string;
  bizonyitekProza: string;
  /** A dokumentumfa tételei, amik ezt a kontrollt bizonyítják. */
  bizonyitekDokumentumok: string[];
  /** A KÉZZEL írt jelölés a megfelelési fejezetből. */
  rogzitettAllapot: RogzitettAllapot;
}

export interface Kontrollmatrix {
  id: string;
  label: I18n;
  note?: string;
  kontrollok: KontrollDef[];
}

export function loadMatrix(path: string): Kontrollmatrix {
  return JSON.parse(readFileSync(path, "utf8")) as Kontrollmatrix;
}

export type KontrollAllapot =
  /** Minden megnevezett bizonyítékdokumentum hatályos. */
  | "bizonyitott"
  /** Egy részük hatályos. */
  | "reszben"
  /** Egyik sem hatályos. */
  | "bizonyitatlan"
  /**
   * NINCS MEGNEVEZETT BIZONYÍTÉKDOKUMENTUM.
   *
   * Nem ugyanaz, mint a „nincs meg”: az azt jelentené, hogy tudjuk, mi kell,
   * és hiányzik. Ez azt jelenti, hogy azt sem írtuk le, mivel bizonyítanánk —
   * és az auditor épp ezt kéri.
   */
  | "nincsBizonyitek";

export interface KontrollAllas {
  id: string;
  kategoria: Kategoria;
  szakasz: string;
  mitVar: string;
  allapot: KontrollAllapot;
  rogzitett: RogzitettAllapot;
  /** Igaz, ha a kézzel írt jelölés többet állít, mint amit a bizonyíték fed. */
  tulallit: boolean;
  hatalyosDok: string[];
  hianyzoDok: string[];
  miert: string;
}

const ROGZITETT_ERO: Record<RogzitettAllapot, number> = { nincs: 0, reszben: 1, megvan: 2 };
const SZAMITOTT_ERO: Record<KontrollAllapot, number> = {
  nincsBizonyitek: 0, bizonyitatlan: 0, reszben: 1, bizonyitott: 2,
};

export function kontrollAllas(
  m: Kontrollmatrix, fa: Dokumentumfa, allapot: FaAllapot, ma: string,
): KontrollAllas[] {
  const dok = new Map(dokumentumAllas(fa, allapot, ma).map((d) => [d.doc, d]));
  return m.kontrollok.map((k) => {
    const hivatkozott = k.bizonyitekDokumentumok;
    const hatalyosDok = hivatkozott.filter((id) => dok.get(id)?.eros);
    const hianyzoDok = hivatkozott.filter((id) => !dok.get(id)?.eros);
    let a: KontrollAllapot;
    if (!hivatkozott.length) a = "nincsBizonyitek";
    else if (!hatalyosDok.length) a = "bizonyitatlan";
    else if (hianyzoDok.length) a = "reszben";
    else a = "bizonyitott";

    const tulallit = ROGZITETT_ERO[k.rogzitettAllapot] > SZAMITOTT_ERO[a];
    return {
      id: k.id, kategoria: k.kategoria, szakasz: k.szakasz, mitVar: k.mitVar,
      allapot: a, rogzitett: k.rogzitettAllapot, tulallit, hatalyosDok, hianyzoDok,
      miert:
        a === "nincsBizonyitek"
          ? `NINCS MEGNEVEZETT BIZONYÍTÉKDOKUMENTUM. Nem az a baj, hogy hiányzik ` +
            `valami — az, hogy azt sem írtuk le, MIVEL bizonyítanánk. Az auditor a ` +
            `bizonyíték oszlopot kéri, nem a megvalósítás oszlopot.`
          : a === "bizonyitatlan"
            ? `A hivatkozott dokumentumok (${hianyzoDok.join(", ")}) egyike sincs hatályban.`
            : a === "reszben"
              ? `Hatályban: ${hatalyosDok.join(", ")}. Hiányzik: ${hianyzoDok.join(", ")}.`
              : `Minden hivatkozott dokumentum hatályban: ${hatalyosDok.join(", ")}.`,
    };
  });
}

/* ── AZ ÖSSZEGZÉS — SZÁMOLVA, NEM GÉPELVE ────────────────────────────── */

export interface KategoriaSor {
  kategoria: Kategoria;
  cim: string;
  megvan: number;
  reszben: number;
  nincs: number;
  osszes: number;
}

export const KATEGORIA_CIM: Record<Kategoria, string> = {
  altalanos: "Általános és szerkezeti (4–5)",
  eroforras: "Erőforrás (6)",
  folyamat: "Folyamat (7)",
  iranyitas: "Irányítás (8)",
};

/**
 * A RÖGZÍTETT jelölések összegzése — ez az a tábla, ami elcsúszott.
 *
 * Kézzel gépelve 45 sorból 39-et mondott, és mind a négy kategória számai
 * eltértek a felettük álló soroktól. Egy összegző tábla, ami nem a sorokból
 * jön, előbb-utóbb mindig elcsúszik — és épp ez az a szám, amit egy auditor
 * először néz meg.
 */
export function osszegzes(m: Kontrollmatrix): KategoriaSor[] {
  const rend: Kategoria[] = ["altalanos", "eroforras", "folyamat", "iranyitas"];
  return rend.map((kat) => {
    const sorok = m.kontrollok.filter((k) => k.kategoria === kat);
    const db = (a: RogzitettAllapot) => sorok.filter((k) => k.rogzitettAllapot === a).length;
    return {
      kategoria: kat, cim: KATEGORIA_CIM[kat],
      megvan: db("megvan"), reszben: db("reszben"), nincs: db("nincs"),
      osszes: sorok.length,
    };
  });
}

/* ── AZ ELSŐ KÉRELEM KAPUJA ──────────────────────────────────────────── */

export interface KerelemAllas {
  kerelmezheto: boolean;
  /** Az első körben elkészítendő dokumentumok, amik még nincsenek meg. */
  hianyzoElsoKor: string[];
  /** Lejárt felülvizsgálatú dokumentumok — ezek az audit klasszikus leletei. */
  lejart: string[];
  miert: string;
}

/**
 * AZ ELSŐ KÉRELEM AKKOR ADHATÓ BE, HA AZ ELSŐ KÖR HATÁLYBAN VAN.
 *
 * Nem akkor, ha mind a 37 dokumentum elkészült — a fa saját tanácsa szerint
 * „ne írjuk meg mind a 35-öt előre”. Az első kör a politika, a kézikönyv és a
 * minta-életciklus SOP-jai: azok nélkül nem lehet mintát gyűjteni, tehát nincs
 * mit akkreditálni.
 */
export function kerelemAllas(
  fa: Dokumentumfa, allapot: FaAllapot, ma: string,
): KerelemAllas {
  const all = dokumentumAllas(fa, allapot, ma);
  const hianyzoElsoKor = all.filter((d) => d.elsoKor && !d.eros).map((d) => d.doc);
  const lejart = all.filter((d) => d.allapot === "lejart").map((d) => d.doc);
  if (hianyzoElsoKor.length || lejart.length) {
    return {
      kerelmezheto: false, hianyzoElsoKor, lejart,
      miert:
        (hianyzoElsoKor.length
          ? `AZ ELSŐ KÖRBŐL ${hianyzoElsoKor.length}/${all.filter((d) => d.elsoKor).length} ` +
            `DOKUMENTUM HIÁNYZIK. Ezek nélkül nem lehet mintát gyűjteni, tehát nincs mit ` +
            `akkreditálni. `
          : "") +
        (lejart.length
          ? `${lejart.length} dokumentum felülvizsgálata LEJÁRT (${lejart.join(", ")}) — ` +
            `ez az audit klasszikus lelete.`
          : ""),
    };
  }
  return {
    kerelmezheto: true, hianyzoElsoKor: [], lejart: [],
    miert:
      `Az első kör hatályban van, és egyetlen felülvizsgálat sem járt le. A ` +
      `maradék dokumentum a felkészülés része, nem a kérelem feltétele.`,
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateMir(
  fa: Dokumentumfa, m: Kontrollmatrix, allapot: FaAllapot, ma: string,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = new Set(fa.dokumentumok.map((d) => d.id));
  const latott = new Set<string>();

  for (const h of allapot.hatalyos) {
    if (!ids.has(h.doc)) {
      out.push({ severity: "error", id: h.doc,
        message: "hatályos bejegyzés nem létező dokumentumra — a fa nem ismeri" });
      continue;
    }
    if (latott.has(h.doc)) {
      out.push({ severity: "error", id: h.doc, message: "két hatályos bejegyzés ugyanarra a dokumentumra" });
    }
    latott.add(h.doc);
    if (!h.verzio?.trim() || !h.jovahagyta?.trim()) {
      out.push({ severity: "error", id: h.doc,
        message: "hiányzó verzió vagy jóváhagyó — a verziózás nem formalitás: egy retrospektív minta mellett tudni kell, MELYIK SOP szerint kezelték" });
    }
    for (const [mezo, ertek] of [
      ["hatalyos", h.hatalyos], ["kovetkezoFelulvizsgalat", h.kovetkezoFelulvizsgalat],
    ] as const) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ertek ?? "")) {
        out.push({ severity: "error", id: h.doc, message: `hiányzó vagy hibás \`${mezo}\` dátum` });
      }
    }
    // A FA SAJÁT SZABÁLYA: SOP feljegyzés nélkül nem bizonyít semmit.
    const def = fa.dokumentumok.find((d) => d.id === h.doc)!;
    if (def.szint === "sop" && !(h.bizonyitek ?? []).length) {
      out.push({ severity: "error", id: h.doc,
        message:
          "hatályos SOP ŰRLAP VAGY FELJEGYZÉS NÉLKÜL. A fa saját szabálya: SOP " +
          "feljegyzés nélkül nem bizonyít semmit — az auditnak nincs mit megmutatni" });
    }
  }

  for (const d of dokumentumAllas(fa, allapot, ma)) {
    if (d.allapot === "lejart") {
      out.push({ severity: "error", id: d.doc, message: d.miert });
    }
    if (d.allapot === "felulvizsgalatEsedekes") {
      out.push({ severity: "warning", id: d.doc,
        message: `a felülvizsgálat ${d.napMulva} nap múlva esedékes (${d.kovetkezoFelulvizsgalat})` });
    }
  }

  // A KONTROLL BIZONYÍTÉKA LÉTEZŐ DOKUMENTUM LEGYEN.
  for (const k of m.kontrollok) {
    for (const id of k.bizonyitekDokumentumok) {
      if (!ids.has(id)) {
        out.push({ severity: "error", id: k.id,
          message: `ismeretlen bizonyítékdokumentum: ${id} — az elavult hivatkozás rosszabb a hiányzónál` });
      }
    }
  }

  // A KÉZZEL ÍRT JELÖLÉS NEM ÁLLÍTHAT TÖBBET, MINT AMIT A BIZONYÍTÉK FED.
  const tul = kontrollAllas(m, fa, allapot, ma).filter((k) => k.tulallit);
  const nincsBiz = tul.filter((k) => k.allapot === "nincsBizonyitek");
  if (nincsBiz.length) {
    out.push({ severity: "warning", id: m.id,
      message:
        `${nincsBiz.length}/${m.kontrollok.length} kontroll jelölése többet állít, mint ` +
        `amit bizonyíték fed: nincs mellettük megnevezett dokumentum. Az auditor a ` +
        `bizonyíték oszlopot kéri, nem a megvalósítás oszlopot` });
  }
  for (const k of tul.filter((x) => x.allapot !== "nincsBizonyitek")) {
    out.push({ severity: "error", id: k.id,
      message:
        `a jelölés „${k.rogzitett}”, a bizonyíték viszont „${k.allapot}”: ` + k.miert });
  }
  return out;
}

export interface MirMerleg {
  dokumentum: number;
  hatalyos: number;
  lejart: number;
  elsoKor: number;
  elsoKorHatalyos: number;
  kontroll: number;
  bizonyitott: number;
  nincsBizonyitek: number;
  kerelmezheto: boolean;
}

export function merleg(
  fa: Dokumentumfa, m: Kontrollmatrix, allapot: FaAllapot, ma: string,
): MirMerleg {
  const d = dokumentumAllas(fa, allapot, ma);
  const k = kontrollAllas(m, fa, allapot, ma);
  return {
    dokumentum: d.length,
    hatalyos: d.filter((x) => x.eros).length,
    lejart: d.filter((x) => x.allapot === "lejart").length,
    elsoKor: d.filter((x) => x.elsoKor).length,
    elsoKorHatalyos: d.filter((x) => x.elsoKor && x.eros).length,
    kontroll: k.length,
    bizonyitott: k.filter((x) => x.allapot === "bizonyitott").length,
    nincsBizonyitek: k.filter((x) => x.allapot === "nincsBizonyitek").length,
    kerelmezheto: kerelemAllas(fa, allapot, ma).kerelmezheto,
  };
}
