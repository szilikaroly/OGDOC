/**
 * FEDÉSEK — mely mezők fedik ugyanazt, és mi lesz velük.
 *
 * A rendszer visszatérő hibacsaládja, hogy ugyanaz a klinikai tény több
 * változóban él, és a rétegek külön-külön nézik őket. Eddig egyenként bukkant
 * fel: a Bishop-pontszám összetevői, a magzatvízmennyiség, az éhomi vércukor
 * két küszöbbel, az allergia öt mezőben három modulban. MINDIG UTÓLAG, ÉS
 * MINDIG AZÉRT, MERT VALAKI ÉSZREVETTE.
 *
 * A `tools/dupla-mezok.ts` gépileg keresi a jelölteket. Ez a modul a másik fele:
 * a jelölt nem ítélet, és a különbséget EMBER dönti el — de a döntésnek NYOMA
 * kell legyen, különben a következő olvasó újra elkezdi.
 *
 * KÉT ÍTÉLET LÉTEZIK, ÉS MINDKETTŐ KÖTELEZ:
 *
 *   `kulon`  — a két mező MÁS kérdésre válaszol. Meg kell indokolni, mert a
 *              hasonlóság magától nem tűnik el: a következő fejlesztő ugyanúgy
 *              duplikátumnak látja majd, és összevonja.
 *
 *   `fedes`  — ugyanazt fedik. Ilyenkor NEM elég kimondani: FELOLDÁS kell,
 *              és amíg nincs, ez HIBA. Egy elismert, de kezeletlen fedés
 *              rosszabb a fel nem ismertnél, mert a tudás megvan, és mégsem
 *              történik semmi.
 */
import { readFileSync } from "node:fs";
import type { Registry, RegistryIssue } from "../registry.ts";

export type Itelet = "kulon" | "fedes";

export type FeloldasFajta =
  /** Az egyik mező `aliasOf` a másikra. */
  | "alias"
  /** Az egyiket felváltottuk (`superseded`). */
  | "felvaltas"
  /** Levezetett összegző mező áll föléjük. */
  | "osszegzo"
  /** Közös küszöb/kódlista, a mezők megmaradnak. */
  | "kozosKuszob"
  /** Elismert fedés, a feloldás MÉG NINCS meg. */
  | "nyitott";

export interface Dontes {
  a: string;
  b: string;
  itelet: Itelet;
  miert: string;
  /** `fedes` esetén: hogyan oldottuk fel. */
  feloldas?: FeloldasFajta;
  /** `osszegzo` feloldásnál: a fölébük álló mező. */
  osszegzoMezo?: string;
  /** Ki döntött. Névtelen döntés nem döntés. */
  ki?: string;
  mikor?: string;
}

export interface FedesKeszlet {
  megnevezes: string;
  note: string;
  dontesek: Dontes[];
}

export function loadFedesek(path: string): FedesKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as FedesKeszlet;
}

export const kulcs = (a: string, b: string) => [a, b].sort().join("|");

export function validateFedesek(k: FedesKeszlet, reg: Registry): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const d of k.dontesek) {
    const kk = kulcs(d.a, d.b);
    if (latott.has(kk)) {
      out.push({ severity: "error", id: kk, message: `Ugyanarra a párra két döntés: ${kk}.` });
    }
    latott.add(kk);
    for (const id of [d.a, d.b]) {
      let ok = false;
      try { ok = !!reg.get(reg.resolvePrimary(id)); } catch { ok = false; }
      if (!ok) {
        out.push({ severity: "error", id: kk,
          message: `A döntés nem létező változóra hivatkozik: „${id}”.` });
      }
    }
    if (!d.miert?.trim()) {
      out.push({ severity: "error", id: kk,
        message:
          `Indoklás nélküli döntés (${kk}). A hasonlóság magától nem tűnik el: ` +
          `a következő olvasó ugyanúgy duplikátumnak látja majd, és összevonja.` });
    }
    if (d.itelet === "fedes") {
      if (!d.feloldas) {
        out.push({ severity: "error", id: kk,
          message:
            `Elismert FEDÉS feloldás nélkül (${kk}). Ez rosszabb a fel nem ` +
            `ismertnél: a tudás megvan, és mégsem történik semmi.` });
      } else if (d.feloldas === "nyitott") {
        out.push({ severity: "warning", id: kk,
          message:
            `NYITOTT fedés: ${kk}. ${d.miert} A feloldás megnevezett feladat, ` +
            `nem elfelejtett kérdés.` });
      }
      if (d.feloldas === "osszegzo" && !d.osszegzoMezo) {
        out.push({ severity: "error", id: kk,
          message: `Összegző feloldás, de nincs megnevezve az összegző mező.` });
      }
      if (d.osszegzoMezo && !reg.get(d.osszegzoMezo)) {
        out.push({ severity: "error", id: kk,
          message: `Az összegző mező nem létezik: „${d.osszegzoMezo}”.` });
      }
    }
  }
  return out;
}

export interface FedesMerleg {
  dontes: number;
  kulon: number;
  fedes: number;
  nyitott: number;
}

export function merleg(k: FedesKeszlet): FedesMerleg {
  return {
    dontes: k.dontesek.length,
    kulon: k.dontesek.filter((d) => d.itelet === "kulon").length,
    fedes: k.dontesek.filter((d) => d.itelet === "fedes").length,
    nyitott: k.dontesek.filter((d) => d.feloldas === "nyitott").length,
  };
}

/* ── AZ ELSŐ FELOLDÁS: A VÉRVESZTÉS ──────────────────────────────────── */

/**
 * A KUMULATÍV VÉRVESZTÉS — mert a szülés és a műtét ugyanaz a vérzés.
 *
 * Egy vajúdó nő, aki császármetszésre kerül, KÉT mezőbe veszít vért:
 * `labour.qbl` (a szülés kezdetétől kumulatív) és `op.intra.qbl` (a műtét
 * alatt mért). A két mezőnek KÜLÖN küszöbe volt:
 *
 *   labour.qbl     300 mL  (WHO/FIGO/ICM 2025 — a beavatkozási küszöb)
 *   op.intra.qbl  1000 mL  (a műtéti kritikus határ)
 *
 * Vagyis 400 mL vajúdás közben KRITIKUS, 700 mL a műtét alatt NEM — és az
 * 1100 mL összesent senki nem számolja ki. Pedig a beteg egy, és a vér, amit
 * elveszített, ugyanaz.
 *
 * A szülés utáni vérzés a világon az anyai halálozás vezető oka, és a
 * késedelem a legjobban dokumentált hozzájáruló tényezője. Ez a fedés
 * pontosan ott van, ahol a legdrágább.
 *
 * A FELOLDÁS ÖSSZEGZŐ, NEM ALIAS: mindkét mező megmarad (a dokumentáció
 * szempontjából van jelentősége, hol veszítette), és FÖLÉJÜK áll az összeg,
 * ami a stádiumot vezérli.
 *
 * ÉS A HIÁNYZÓ RÉSZ NEM NULLA. Ha csak a műtéti érték van meg, az összeg nem
 * „700”, hanem „legalább 700, a vajúdás alatti rész ismeretlen” — a
 * `reszlegesE` mező pontosan ezt mondja meg.
 */
export interface VerzesReszek {
  /** A szülés kezdetétől kumulált érték, ha van. */
  labourMl?: number | null;
  /** A műtét alatt mért, ha volt műtét. */
  opMl?: number | null;
  /** Volt-e egyáltalán vajúdás — ettől függ, hiányzik-e a szülészeti rész. */
  vajudott?: boolean;
}

export interface VerzesOsszeg {
  osszesenMl: number | null;
  /** Igaz, ha egy ismert szakasz értéke hiányzik: az összeg ALSÓ becslés. */
  reszlegesE: boolean;
  hianyzo: string[];
  miert: string;
}

/** A beavatkozási küszöb, WHO/FIGO/ICM 2025 — a TELJES vérvesztésre. */
export const QBL_KUSZOB_ML = 300;

export function verzesOsszeg(r: VerzesReszek): VerzesOsszeg {
  const hianyzo: string[] = [];
  const van: number[] = [];
  if (typeof r.labourMl === "number") van.push(r.labourMl);
  else if (r.vajudott) hianyzo.push("labour.qbl");
  if (typeof r.opMl === "number") van.push(r.opMl);

  if (!van.length) {
    return { osszesenMl: null, reszlegesE: false, hianyzo,
      miert: `Nincs rögzített vérvesztés-érték.` };
  }
  const ossz = van.reduce((a, b) => a + b, 0);
  if (hianyzo.length) {
    return { osszesenMl: ossz, reszlegesE: true, hianyzo,
      miert:
        `LEGALÁBB ${ossz} mL — a(z) ${hianyzo.join(", ")} érték hiányzik, pedig a ` +
        `beteg vajúdott. A hiányzó rész NEM NULLA: az összeg alsó becslés, és a ` +
        `${QBL_KUSZOB_ML} mL-es beavatkozási küszöb ehhez képest is átléphető.` };
  }
  return { osszesenMl: ossz, reszlegesE: false, hianyzo: [],
    miert:
      `${ossz} mL összesen${van.length > 1 ? " (szülés + műtét)" : ""}. A beteg ` +
      `EGY, és a vér, amit elveszített, ugyanaz — a stádiumot az összeg vezérli, ` +
      `nem a szakaszok külön-külön.` };
}

/* ── A MÁSODIK FELOLDÁS: AZ ÖNKÁROSÍTÁS ──────────────────────────────── */

/**
 * ÖNKÁROSÍTÁS — KÉT KÉRDŐÍV, EGY KÉRDÉS.
 *
 * Az EPDS 10. és a PHQ-9 9. tétele UGYANARRA kérdez, és mindkettő
 * dokumentáltan „kritikus tétel: pozitív válasz az összpontszámtól függetlenül
 * teendőt jelent”. Két külön mezőben viszont három baj lehet:
 *
 *   - az egyik pozitív, a másikat fel sem tették → a réteg, ami csak a
 *     másikat nézi, semmit nem lát;
 *   - a régi pozitív és az új nulla → melyik áll? (A válasz: a pozitív nem
 *     avul el magától — újraértékelés kell hozzá, nem újabb kérdőív.)
 *   - és a legrosszabb: a FEL NEM TETT kérdés nullaként viselkedik.
 *
 * Ezért egy állapot áll a kettő fölött, és a FEL NEM TETT kérdés külön érték.
 */
export type OnkarositasAllapot =
  /** Bármely eszközben pozitív. Teendőt jelent. */
  | "pozitiv"
  /** Minden feltett kérdésre nemleges. */
  | "nemleges"
  /** Egyik eszközben sem tették fel. NEM „nemleges”. */
  | "nemKerdeztek";

export interface OnkarositasValasz {
  eszkoz: string;
  /** 0–3; `null` = nem tették fel. */
  ertek: number | null;
  mikor?: string;
}

export interface OnkarositasAllas {
  allapot: OnkarositasAllapot;
  teendo: boolean;
  /** Mely eszközökben volt pozitív. */
  pozitivEszkozok: string[];
  /** Mely eszközökben nem tették fel. */
  kimaradt: string[];
  miert: string;
}

export function onkarositas(valaszok: OnkarositasValasz[]): OnkarositasAllas {
  const feltett = valaszok.filter((v) => typeof v.ertek === "number");
  const kimaradt = valaszok.filter((v) => v.ertek === null).map((v) => v.eszkoz);
  const pozitiv = feltett.filter((v) => (v.ertek as number) > 0).map((v) => v.eszkoz);

  if (pozitiv.length) {
    return { allapot: "pozitiv", teendo: true, pozitivEszkozok: pozitiv, kimaradt,
      miert:
        `POZITÍV önkárosítás-tétel (${pozitiv.join(", ")}). Ez az ` +
        `ÖSSZPONTSZÁMTÓL FÜGGETLENÜL teendőt jelent, és a megkérdezést nem lehet ` +
        `a következő vizitre halasztani.` +
        (kimaradt.length
          ? ` A(z) ${kimaradt.join(", ")} eszközben nem tették fel — de a pozitív ` +
            `válasz attól még áll: egy újabb kérdőív nem írja felül a korábbit, ` +
            `ahhoz újraértékelés kell.`
          : "") };
  }
  if (!feltett.length) {
    return { allapot: "nemKerdeztek", teendo: false, pozitivEszkozok: [], kimaradt,
      miert:
        `Az önkárosítás kérdését EGYIK eszközben sem tették fel ` +
        `(${kimaradt.join(", ") || "nincs eszköz"}). EZ NEM NEMLEGES: a fel nem ` +
        `tett kérdés nullaként viselkedne, és pontosan ez a réteg feladata, hogy ` +
        `ne tegye.` };
  }
  return { allapot: "nemleges", teendo: false, pozitivEszkozok: [], kimaradt,
    miert:
      `Minden feltett önkárosítás-tétel nemleges ` +
      `(${feltett.map((v) => v.eszkoz).join(", ")})` +
      (kimaradt.length ? `; a(z) ${kimaradt.join(", ")} kimaradt.` : ".") };
}
