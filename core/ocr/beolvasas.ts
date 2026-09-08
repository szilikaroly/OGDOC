/**
 * OCR-BEOLVASÁS ÉS MÉRTÉKEGYSÉG-EGYEZTETÉS.
 *
 * Egy képből vagy PDF-ből mezőket kitöltő ügynök két dolgot ronthat el, és a
 * kettő NEM egyforma súlyú.
 *
 * A KARAKTER-TÉVESZTÉS LÁTHATÓ. Egy „8” helyett olvasott „3” valószínűtlen
 * értéket ad, a tartomány-ellenőrzés megfogja, és a rossz szám többnyire
 * feltűnő. Nem veszélytelen, de nem is néma.
 *
 * A MÉRTÉKEGYSÉG-TÉVESZTÉS VISZONT NÉMA — ÉS NAGYSÁGRENDEKET MOZGAT.
 *
 *   vércukor      mg/dL → mmol/L        18-szoros
 *   kreatinin     mg/dL → µmol/L        88,4-szeres
 *   folsav        mg → µg               1000-szeres
 *   hemoglobin    g/dL → g/L            10-szeres
 *
 * Egy 90 mg/dL vércukor mmol/L-ként beolvasva 90 mmol/L — abszurd, tehát
 * kiszűrhető. De egy 5,0 mg/dL kreatinin µmol/L-ként 5,0: TÖKÉLETESEN
 * ÉLETSZERŰ SZÁM, és súlyos veseelégtelenséget tüntet el. A tartomány itt nem
 * véd, mert az érték a tartományon BELÜL van — csak a rossz skálán.
 *
 * EZÉRT A MOTOR ALAPSZABÁLYA: EGYSÉG NÉLKÜL NINCS BEÍRÁS.
 *
 * Ha a leletről nem olvasható ki egyértelműen a mértékegység, az ügynök NEM
 * tippel a nagyságrendből — még akkor sem, ha a szám „nyilvánvalóan” az egyik
 * skálára esik. A nagyságrendből visszakövetkeztetni pontosan az a művelet,
 * ami a kreatinin-példán elbukik, és az ilyen hiba a legrosszabb fajta:
 * magabiztos, életszerű, és senki nem nézi meg újra.
 *
 * ÉS AMIT AZ ÜGYNÖK SOHA NEM TESZ: NEM ÍR BE VÉGLEGESEN. A beolvasás
 * JAVASLAT, `provenance: "derived"` származással, és klinikusi megerősítés
 * nélkül nem lesz belőle rögzített érték — ugyanaz a kapu, mint az AI-olvasatnál
 * (28. modul) és a beteg-oldali felvételnél.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── AZ EGYSÉGTÁBLA ──────────────────────────────────────────────────── */

export interface Atvaltas {
  /** Amiről váltunk. */
  rol: string;
  /** Amire váltunk — a regiszter szerinti egység. */
  ra: string;
  /** Szorzó: `ra = rol * szorzo`. */
  szorzo: number;
  /** Analitfüggő-e (pl. a mg/dL → mmol/L a molekulatömegtől függ). */
  analitFuggo: boolean;
  forras: string;
}

export interface EgysegKeszlet {
  megnevezes: string;
  note: string;
  /** Írásváltozatok: ami a leleten állhat → a kanonikus alak. */
  irasvaltozatok: Record<string, string>;
  /** Analitonkénti átváltások: `lab.glucose.fasting` → [{…}]. */
  atvaltasok: Record<string, Atvaltas[]>;
}

export function loadEgysegek(path: string): EgysegKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as EgysegKeszlet;
}

/** A leleten olvasott egység kanonikus alakja. `null`, ha nem ismerjük fel. */
export function kanonikus(k: EgysegKeszlet, nyers: string | null | undefined): string | null {
  if (!nyers?.trim()) return null;
  const t = nyers.trim().toLowerCase().replace(/\s+/g, "");
  return k.irasvaltozatok[t] ?? null;
}

/* ── EGY BEOLVASOTT MEZŐ ─────────────────────────────────────────────── */

export interface OcrMezo {
  /** A regiszterbeli változó, amibe menne. */
  valtozo: string;
  /** A leletről olvasott nyers szöveg — a szám. */
  nyersErtek: string;
  /** A leletről olvasott nyers egység. ÜRES = nem volt kiolvasható. */
  nyersEgyseg?: string | null;
  /** Az OCR saját bizonyossága 0–1. Hiánya nem 1. */
  bizonyossag?: number | null;
  /** Hol a dokumentumon — enélkül a javaslat nem ellenőrizhető vissza. */
  helye?: string;
}

export type BeolvasasAllapot =
  /** Javasolható — klinikusi megerősítésre. */
  | "javasolhato"
  /** A szám nem olvasható ki értelmesen. */
  | "szamNemOlvashato"
  /** NINCS egyértelmű mértékegység. Nem tippelünk a nagyságrendből. */
  | "egysegNelkul"
  /** Az egység ismeretlen írásváltozat. */
  | "egysegIsmeretlen"
  /** Az egység nem váltható át a mező egységére. */
  | "egysegNemValthato"
  /** Az OCR bizonyossága túl alacsony. */
  | "bizonytalanOlvasat"
  /** Az átváltott érték a mező tartományán kívül esik. */
  | "tartomanyonKivul";

export interface BeolvasottMezo {
  valtozo: string;
  allapot: BeolvasasAllapot;
  /** A regiszter egységére átváltott érték. `null`, ha nem javasolható. */
  ertek: number | null;
  /** Az eredeti érték és egység — a visszakereséshez. */
  eredeti: { ertek: number | null; egyseg: string | null };
  /** Ha átváltás történt: mi és mennyivel. */
  atvaltas: Atvaltas | null;
  miert: string;
}

export interface MezoSpec {
  id: string;
  unit?: string | null;
  domain?: { min?: number | null; max?: number | null } | null;
}

/** Az OCR-bizonyosság alsó határa. Ez alatt a mező nem javasolható. */
export const BIZONYOSSAG_HATAR = 0.8;

export function beolvas(
  k: EgysegKeszlet, spec: MezoSpec, m: OcrMezo,
): BeolvasottMezo {
  const alap = { valtozo: m.valtozo, ertek: null as number | null,
    eredeti: { ertek: null as number | null, egyseg: null as string | null },
    atvaltas: null as Atvaltas | null };

  /* A szám. A tizedesvessző és -pont egyaránt előfordul magyar leleteken. */
  const tisztitott = m.nyersErtek.trim().replace(/\s/g, "").replace(",", ".");
  const szam = Number(tisztitott);
  if (!tisztitott || !Number.isFinite(szam)) {
    return { ...alap, allapot: "szamNemOlvashato",
      miert: `A(z) „${m.nyersErtek}” nem olvasható számként.` };
  }
  alap.eredeti.ertek = szam;

  if (typeof m.bizonyossag === "number" && m.bizonyossag < BIZONYOSSAG_HATAR) {
    return { ...alap, allapot: "bizonytalanOlvasat",
      miert:
        `Az OCR bizonyossága ${m.bizonyossag.toFixed(2)}, a határ ` +
        `${BIZONYOSSAG_HATAR}. Egy bizonytalan számjegy laborértékben nem ` +
        `„közelítő adat”, hanem másik érték.` };
  }

  /* A MÉRTÉKEGYSÉG. Itt áll meg minden, ha nincs. */
  if (!m.nyersEgyseg?.trim()) {
    return { ...alap, allapot: "egysegNelkul",
      miert:
        `A leletről nem olvasható ki a mértékegység, és a nagyságrendből NEM ` +
        `következtetünk vissza. Egy 5,0-es kreatinin µmol/L-ként életszerű szám, ` +
        `mg/dL-ként súlyos veseelégtelenség — a tartomány-ellenőrzés itt nem véd, ` +
        `mert az érték a tartományon BELÜL van, csak a rossz skálán.` };
  }
  const kan = kanonikus(k, m.nyersEgyseg);
  alap.eredeti.egyseg = kan ?? m.nyersEgyseg.trim();
  if (!kan) {
    return { ...alap, allapot: "egysegIsmeretlen",
      miert:
        `A(z) „${m.nyersEgyseg}” egység nem ismert írásváltozat. Felvenni kell az ` +
        `egységtáblába — találgatni nem szabad.` };
  }

  const cel = spec.unit ?? null;
  let ertek = szam;
  let atv: Atvaltas | null = null;
  if (cel && kan !== cel) {
    const jeloltek = k.atvaltasok[spec.id] ?? [];
    atv = jeloltek.find((x) => x.rol === kan && x.ra === cel) ?? null;
    if (!atv) {
      return { ...alap, allapot: "egysegNemValthato",
        miert:
          `A leleten „${kan}” áll, a mező egysége „${cel}”, és a(z) ${spec.id} ` +
          `mezőhöz nincs felvéve átváltás a kettő között. A MÉRTÉKEGYSÉG-TÉVESZTÉS ` +
          `NÉMA ÉS NAGYSÁGRENDEKET MOZGAT — átváltás nélkül nem írunk be semmit.` };
    }
    ertek = szam * atv.szorzo;
    alap.atvaltas = atv;
  }

  const d = spec.domain;
  if (d && ((typeof d.min === "number" && ertek < d.min)
         || (typeof d.max === "number" && ertek > d.max))) {
    return { ...alap, ertek: null, allapot: "tartomanyonKivul",
      miert:
        `Az átváltott érték (${ertek}${cel ? " " + cel : ""}) a mező tartományán ` +
        `kívül esik (${d.min ?? "−∞"}–${d.max ?? "∞"}). Ez lehet OCR-hiba és lehet ` +
        `rossz egység — mindkettő ellenőrzést kíván, beírást egyik sem.` };
  }

  return { ...alap, ertek, allapot: "javasolhato",
    miert:
      `${szam} ${kan}` +
      (atv ? ` → ${ertek} ${cel} (×${atv.szorzo}, ${atv.forras})` : ` (a mező egysége)`) +
      `. JAVASLAT — származása „derived”, és klinikusi megerősítés nélkül nem ` +
      `lesz belőle rögzített érték.` };
}

/* ── A DOKUMENTUM EGÉSZE ─────────────────────────────────────────────── */

export interface BeolvasasMerleg {
  mezo: number;
  javasolhato: number;
  egysegNelkul: number;
  bizonytalan: number;
  egyeb: number;
}

export function merleg(mezok: BeolvasottMezo[]): BeolvasasMerleg {
  const n = (a: BeolvasasAllapot) => mezok.filter((m) => m.allapot === a).length;
  return {
    mezo: mezok.length,
    javasolhato: n("javasolhato"),
    egysegNelkul: n("egysegNelkul"),
    bizonytalan: n("bizonytalanOlvasat"),
    egyeb: mezok.length - n("javasolhato") - n("egysegNelkul") - n("bizonytalanOlvasat"),
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateEgysegek(
  k: EgysegKeszlet, mezok: Map<string, MezoSpec>,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const kanonikusak = new Set(Object.values(k.irasvaltozatok));
  for (const [id, lista] of Object.entries(k.atvaltasok)) {
    const spec = mezok.get(id);
    if (!spec) {
      out.push({ severity: "error", id,
        message: `Az egységtábla nem létező változóra hivatkozik: „${id}”.` });
      continue;
    }
    for (const a of lista) {
      if (spec.unit && a.ra !== spec.unit) {
        out.push({ severity: "error", id,
          message:
            `A(z) ${id} átváltása „${a.ra}”-ra vezet, a mező egysége viszont ` +
            `„${spec.unit}”. Egy átváltás, ami nem a mező egységére visz, ` +
            `használhatatlan — vagy ami rosszabb, félrevisz.` });
      }
      if (!kanonikusak.has(a.rol)) {
        out.push({ severity: "warning", id,
          message:
            `A(z) „${a.rol}” forrásegységhez nincs írásváltozat felvéve, tehát a ` +
            `leletről sosem ismerhető fel.` });
      }
      if (!(a.szorzo > 0)) {
        out.push({ severity: "error", id, message: `Nem pozitív szorzó: ${a.szorzo}.` });
      }
      if (!a.forras?.trim()) {
        out.push({ severity: "error", id,
          message:
            `A(z) ${a.rol} → ${a.ra} átváltásnak nincs forrása. Egy átváltási ` +
            `szorzó, amit nem lehet visszakeresni, ugyanolyan találgatás, mint a ` +
            `nagyságrendből következtetni.` });
      }
    }
  }
  return out;
}
