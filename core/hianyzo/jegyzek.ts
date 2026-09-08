/**
 * A HIÁNYZÓ TÉTELEK EGYETLEN JEGYZÉKE — cikkek, dokumentumok, licencek, eszközök.
 *
 * A HIÁNY EDDIG TIZENÖT HELYEN ÁLLT, ÉS EZÉRT SEHOL.
 *
 * A rendszer minden modulja megnevezi, mi hiányzik neki: a licencpanel a
 * mérőeszközöket, a külső források a beszerzendő közleményeket, a MIR a
 * dokumentumokat, az ETT a bizonyítékokat, az EESZT a kapukat, a
 * hitelesítési szolgáltatók a szerződéseket, az ISBER a biobanki eljárásokat.
 * Külön-külön mind pontos — együtt viszont senki nem látta őket, és így a
 * kérdésre, hogy „mit kell beszerezni?”, nem volt válasz.
 *
 * EZ A JEGYZÉK GYŰJT, NEM ÍR ÚJRA.
 *
 * Ami már szerepel egy modul saját regiszterében, azt onnan veszi át — nem
 * másolja. Egy kézzel karbantartott hiánylista fél éven belül hazudik: a
 * modul javul, a lista nem. Amit külön kell felvenni (közlemények, amelyekhez
 * nincs saját regiszter), az EGY helyen áll, és onnan derivált.
 *
 * MINDEN TÉTELNEK VAN CÍMZETTJE. A „be kell szerezni” önmagában nem feladat:
 * ha nincs megnevezve, kinél áll, akkor senkinél áll. És minden tételnél ott
 * van, hogy FEJLESZTŐI feladat-e — mert a legtöbb nem az, és ezt a
 * különbséget elmosni azt jelenti, hogy a fejlesztéstől várják a megoldást.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

export type HianyFajta =
  /** Tudományos közlemény vagy irányelv, amit be kell szerezni. */
  | "kozlemeny"
  /** Szabvány vagy hatósági kiadvány. */
  | "szabvany"
  /** Felhasználási engedély, licenc, szerződés. */
  | "licenc"
  /** Belső dokumentum: eljárásrend, szabályzat, jegyzőkönyv. */
  | "dokumentum"
  /** Fizikai eszköz vagy szolgáltatás. */
  | "eszkoz"
  /** Aláírás: valakinek névvel jóvá kell hagynia. */
  | "alairas"
  /** Szervezeti döntés. */
  | "dontes";

export type Surgosseg =
  /** Enélkül a rendszer egy KÉPESSÉGE zárva marad. */
  | "blokkolo"
  /** Enélkül egy képesség részleges vagy tájékoztató. */
  | "korlatozo"
  /** Hasznos, de nem tart vissza semmit. */
  | "hasznos";

export interface HianyTetel {
  id: string;
  fajta: HianyFajta;
  cim: string;
  /** MIÉRT kell — konkrét képességre mutatva, nem általánosságban. */
  miert: string;
  surgosseg: Surgosseg;
  /** Mit nyit meg, ha megvan. */
  mitNyit: string[];
  /** KINÉL áll. „A fejlesztés” csak akkor, ha tényleg fejlesztői feladat. */
  kinel: string;
  fejlesztoi: boolean;
  /** Hivatkozás: DOI, ISBN, URL vagy jogszabályhely. Üres string nem elfogadható. */
  hivatkozas: string;
  /** Melyik modul kéri. */
  modul: number;
  /** Honnan származik ez a tétel: melyik regiszter mondta ki. */
  forras: string;
}

export interface HianyKeszlet {
  megnevezes: string;
  note: string;
  tetelek: HianyTetel[];
}

export function loadHianyok(path: string): HianyKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as HianyKeszlet;
}

/* ── GYŰJTÉS A MODULOK SAJÁT REGISZTEREIBŐL ──────────────────────────── */

/** Amit egy modul regisztere kimond a saját hiányairól. */
export interface ModulHiany {
  forras: string;
  modul: number;
  id: string;
  cim: string;
  hianyzik: string[];
  kinel?: string;
  fajta?: HianyFajta;
  surgosseg?: Surgosseg;
}

/**
 * A MODULOK SAJÁT HIÁNYAINAK BEHÚZÁSA.
 *
 * A hívó adja át, mit mondanak a modulok — így ez a réteg nem függ mind a
 * tizenöttől, és nem is másolja őket. Ha egy modul javul, a jegyzék magától
 * rövidül.
 */
export function gyujt(
  keszlet: HianyKeszlet, modulHianyok: ModulHiany[],
): HianyTetel[] {
  const sajat = [...keszlet.tetelek];
  const derivalt: HianyTetel[] = [];
  for (const m of modulHianyok) {
    m.hianyzik.forEach((h, i) => {
      derivalt.push({
        id: `${m.id}.h${i + 1}`,
        fajta: m.fajta ?? "dokumentum",
        cim: `${m.cim}: ${h}`,
        miert: `A(z) „${m.cim}” tétel emiatt nem teljes.`,
        surgosseg: m.surgosseg ?? "korlatozo",
        mitNyit: [m.cim],
        kinel: m.kinel ?? "nincs megnevezve",
        fejlesztoi: false,
        hivatkozas: m.forras,
        modul: m.modul,
        forras: m.forras,
      });
    });
  }
  return [...sajat, ...derivalt];
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface HianyMerleg {
  osszes: number;
  blokkolo: number;
  fejlesztoi: number;
  /** Ami NEM fejlesztői — a többség, és ezt látni kell. */
  szervezeti: number;
  cimzettNelkul: number;
  fajtankent: Record<string, number>;
}

export function merleg(tetelek: HianyTetel[]): HianyMerleg {
  const fajtankent: Record<string, number> = {};
  for (const t of tetelek) fajtankent[t.fajta] = (fajtankent[t.fajta] ?? 0) + 1;
  return {
    osszes: tetelek.length,
    blokkolo: tetelek.filter((t) => t.surgosseg === "blokkolo").length,
    fejlesztoi: tetelek.filter((t) => t.fejlesztoi).length,
    szervezeti: tetelek.filter((t) => !t.fejlesztoi).length,
    cimzettNelkul: tetelek.filter((t) =>
      !t.kinel?.trim() || t.kinel === "nincs megnevezve").length,
    fajtankent,
  };
}

export function validateHianyok(k: HianyKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const t of k.tetelek) {
    if (latott.has(t.id)) {
      out.push({ severity: "error", id: t.id, message: `Ismétlődő tételazonosító.` });
    }
    latott.add(t.id);
    // A HIVATKOZÁS NEM ELHAGYHATÓ. Egy „be kell szerezni egy cikket” tétel
    // hivatkozás nélkül nem feladat, hanem érzés: nem lehet megkeresni.
    if (!t.hivatkozas?.trim()) {
      out.push({ severity: "error", id: t.id,
        message:
          `A(z) „${t.cim}” tételnek nincs hivatkozása. Egy beszerzendő tétel ` +
          `DOI, ISBN, URL vagy jogszabályhely nélkül nem feladat, hanem érzés: ` +
          `senki nem tudja megkeresni, és senki nem tudja megmondani, mikor van meg.` });
    }
    if (!t.kinel?.trim()) {
      out.push({ severity: "error", id: t.id,
        message:
          `A(z) „${t.cim}” tételnél nincs megnevezve, KINÉL ÁLL. A „be kell ` +
          `szerezni” önmagában nem feladat: ha nincs címzettje, senkinél áll.` });
    }
    if (!t.mitNyit.length) {
      out.push({ severity: "warning", id: t.id,
        message:
          `A(z) „${t.cim}” tételnél nincs megnevezve, mit nyit meg. Ha nem ` +
          `látszik, mit nyernénk vele, a „szerezzük be?” kérdés eldönthetetlen.` });
    }
    // A BLOKKOLÓ TÉTEL, AMI FEJLESZTŐI, GYANÚS: a fejlesztői feladat nem
    // „hiányzó tétel”, hanem munka. Ha mégis, mondjuk ki.
    if (t.surgosseg === "blokkolo" && t.fejlesztoi) {
      out.push({ severity: "warning", id: t.id,
        message:
          `A(z) „${t.cim}” BLOKKOLÓ és FEJLESZTŐI. A fejlesztői feladat ` +
          `rendszerint nem „hiányzó tétel”, hanem elvégzendő munka — ellenőrizd, ` +
          `hogy tényleg beszerzendő dologról van-e szó.` });
    }
  }
  return out;
}
