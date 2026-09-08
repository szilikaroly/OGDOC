/**
 * AZ EESZT-CSATLAKOZÁS DOSSZIÉJA — a 14. lépés gépi fele.
 *
 * A lépés kimondja: „a csatlakozás nem fejlesztési, hanem engedélyezési
 * kérdés, és a határidőket nem mi szabjuk”. Öt űrlap, tizennyolc mező, öt
 * állítás — és a gép ebből pontosan annyit tud elvégezni, amennyit a 11.
 * lépésnél is: MEGAKADÁLYOZNI, HOGY A BEADVÁNY OLYAT ÁLLÍTSON, AMI NEM IGAZ,
 * és megmondani, MELYIK MEZŐT KI TUDJA KITÖLTENI.
 *
 * A HÁROM DOLOG, AMI EZT A LÉPÉST MÁSSÁ TESZI A TÖBBINÉL.
 *
 * 1. A CSATLAKOZÁS KIFELÉ ÍR. Minden eddigi kapu azt védte, hogy a rendszer
 *    ne mondjon rosszat SAJÁT MAGÁNAK. Az EESZT-be küldött üzenet elhagyja a
 *    rendszert, és attól kezdve nem a miénk: a hibás belső bejegyzés
 *    javítható, az országos térbe küldött üzenet nem.
 *
 * 2. EZÉRT A HITELESÍTÉS HIÁNYA ITT MÁS SÚLYÚ. Ma a cselekvő kilétét egyetlen
 *    ellenőrizetlen kérésfejléc állítja. Belül ez rossz; csatlakozás után a
 *    rendszer az ORSZÁGOS nyilvántartásba írna egy olyan azonosító nevében,
 *    amit senki nem ellenőrzött. Nem fokozati különbség.
 *
 * 3. A TITOKTARTÁSI NYILATKOZAT KÉT ÁLLÍTÁSA MEGNEVEZETT KOCKÁZAT. Az egyik
 *    lejárat nélküli kötelezettséget vállal — a rendszerben ez az EGYETLEN
 *    ilyen: a megőrzési idők, a licencek, a MEES-tanúsítványok és a
 *    dokumentumfelülvizsgálatok mind lejárnak. A másik a teljes adatvédelmi
 *    felelősséget a fejlesztő oldalára telepíti. Mindkettő a dossziéban áll,
 *    nem egy PDF nyolcadik bekezdésében — hogy aláírás ELŐTT lássa valaki.
 *
 * AMI NINCS ÉS NEM IS LEHET ITT. Az űrlapok szövege, és főleg a KITÖLTÖTT
 * példányok: azok személyes adatot tartalmaznak (születési hely és idő, anyja
 * neve), tehát a repóba semmiképp nem kerülhetnek. A dosszié a szerkezetet
 * tartja, nem a kitöltést.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";
import type { Bizonyitek } from "../ett/dosszie.ts";

/* ── A DOSSZIÉ ───────────────────────────────────────────────────────── */

/** Ki tudja megválaszolni a mezőt. */
export type Kitolto = "rendszer" | "szervezet" | "uzemeltetes";

export interface Mezo {
  id: string;
  megnevezes: string;
  kitolti: Kitolto;
  /** Élő bizonyítékkulcs, ha a rendszer önmagából meg tudja válaszolni. */
  bizonyitek?: string;
  megjegyzes?: string;
  /** Személyes adatot kér — a kitöltött példány nem kerülhet a repóba. */
  szemelyesAdat?: boolean;
}

export interface Allitas {
  id: string;
  allitas: string;
  bizonyitek?: string | null;
  megjegyzes?: string;
}

export interface Urlap {
  id: string;
  megnevezes: string;
  kiAdjaBe: string;
  alairo: string[];
  melleklet?: string[];
  szabalyzat?: string;
  /** Visszavonásig érvényes megbízás — nincs lejárata, de visszavonható. */
  visszavonasig?: boolean;
  mezok: Mezo[];
  mitAllit?: Allitas[];
}

export interface Kapu {
  id: string;
  megnevezes: string;
  bizonyitek: string;
  miert: string;
}

export interface Csatlakozas {
  id: string;
  label: I18n;
  note?: string;
  forras: string;
  urlapok: Urlap[];
  kapuk: Kapu[];
}

export function loadCsatlakozas(path: string): Csatlakozas {
  return JSON.parse(readFileSync(path, "utf8")) as Csatlakozas;
}

/* ── A MEZŐK — KI TUDJA KITÖLTENI ────────────────────────────────────── */

export type MezoAllapot = "rendszerbol" | "szervezeti" | "uzemeltetesi" | "hianyzoBizonyitek";

export interface MezoAllas {
  urlap: string;
  mezo: string;
  megnevezes: string;
  allapot: MezoAllapot;
  /** A rendszer válasza, ha van. */
  ertek: string | null;
  miert: string;
}

export function mezoAllas(cs: Csatlakozas, biz: Bizonyitek[]): MezoAllas[] {
  const byKulcs = new Map(biz.map((b) => [b.kulcs, b]));
  return cs.urlapok.flatMap((u) =>
    u.mezok.map((m): MezoAllas => {
      const kozos = { urlap: u.id, mezo: m.id, megnevezes: m.megnevezes };
      if (m.kitolti === "rendszer") {
        const b = m.bizonyitek ? byKulcs.get(m.bizonyitek) : undefined;
        if (!b) {
          return {
            ...kozos, allapot: "hianyzoBizonyitek", ertek: null,
            miert:
              `A mező RENDSZERBŐL válaszolhatónak van jelölve, de nincs mögötte ` +
              `élő bizonyíték (${m.bizonyitek ?? "nincs kulcs"}). Így a beadvány ` +
              `kézzel beírt adatot tartalmazna, amit semmi nem tart karban.`,
          };
        }
        return { ...kozos, allapot: "rendszerbol", ertek: b.ertek,
          miert: `A rendszer önmagából megválaszolja: ${b.ertek}.` };
      }
      const allapot: MezoAllapot =
        m.kitolti === "uzemeltetes" ? "uzemeltetesi" : "szervezeti";
      return {
        ...kozos, allapot, ertek: null,
        miert: m.megjegyzes ??
          `${m.kitolti === "uzemeltetes" ? "Üzemeltetési" : "Szervezeti"} adat — ` +
          `a rendszer nem tudja megválaszolni, és nem is szabad tippelnie.`,
      };
    }));
}

/* ── A KAPUK ─────────────────────────────────────────────────────────── */

export interface KapuAllas {
  id: string;
  megnevezes: string;
  /** Teljesül-e — az élő bizonyítékból. */
  all: boolean;
  ertek: string;
  miert: string;
}

export function kapuAllas(cs: Csatlakozas, biz: Bizonyitek[]): KapuAllas[] {
  const byKulcs = new Map(biz.map((b) => [b.kulcs, b]));
  return cs.kapuk.map((k) => {
    const b = byKulcs.get(k.bizonyitek);
    return {
      id: k.id, megnevezes: k.megnevezes,
      all: !!b?.megvan,
      ertek: b?.ertek ?? "nincs mérve",
      miert: k.miert,
    };
  });
}

export interface Csatlakozhatosag {
  csatlakozhato: boolean;
  /** Kapuk, amik nem állnak. */
  zart: KapuAllas[];
  miert: string;
}

/**
 * ÉLES CSATLAKOZÁS — a kapuk együtt, nem külön.
 *
 * A `szintetikus-kapu` fordítva viselkedik, mint a többi: az a bizonyíték
 * AKKOR van meg, ha a kapu OTT ÁLL — vagyis amikor a rendszer NEM futhat
 * valódi adaton. Éles csatlakozáshoz épp ellenkezőleg: annak a kapunak el
 * kell tűnnie, mert helyette hitelesítés lép. Ezért itt nem a bizonyíték
 * megléte a feltétel, hanem a hitelesítésé — és amíg a szintetikus kapu ott
 * áll, a rendszer maga mondja ki, hogy nem csatlakozhat.
 */
export function csatlakozhato(kapuk: KapuAllas[]): Csatlakozhatosag {
  const zart = kapuk.filter((k) => !k.all && k.id !== "eeszt.kapu.szintetikus");
  const szintetikus = kapuk.find((k) => k.id === "eeszt.kapu.szintetikus");
  const szintetikusAll = !!szintetikus?.all;

  if (szintetikusAll) {
    return {
      csatlakozhato: false, zart,
      miert:
        `ÉLES CSATLAKOZÁS NEM LEHETSÉGES: a kiszolgáló szintetikus üzemmódban ` +
        `fut. Ez nem hiba, hanem a rendszer saját kimondása arról, hogy valódi ` +
        `betegadaton nem futhat — és amíg így van, országos nyilvántartásba sem ` +
        `küldhet. A hitelesítés időközben elkészült; a kaput most már a TLS, a ` +
        `második tényező és a kulcstár tartja, és egyik sem fejlesztői feladat.` +
        (zart.length ? ` Emellett ${zart.length} további kapu zárva.` : ""),
    };
  }
  if (zart.length) {
    return {
      csatlakozhato: false, zart,
      miert:
        `${zart.length} kapu zárva: ${zart.map((k) => k.megnevezes).join(", ")}. ` +
        `Az EESZT-be küldött üzenet elhagyja a rendszert, és attól kezdve nem a ` +
        `miénk — a hibás belső bejegyzés javítható, az országos térbe küldött nem.`,
    };
  }
  return {
    csatlakozhato: true, zart: [],
    miert: "Minden kapu áll: hitelesítés, auditnapló és ágazati azonosító megvan.",
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateCsatlakozas(cs: Csatlakozas, biz: Bizonyitek[]): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const kulcsok = new Set(biz.map((b) => b.kulcs));
  const urlapIds = new Set(cs.urlapok.map((u) => u.id));
  const latott = new Set<string>();

  for (const u of cs.urlapok) {
    if (latott.has(u.id)) {
      out.push({ severity: "error", id: u.id, message: "két űrlap ugyanazzal az azonosítóval" });
    }
    latott.add(u.id);
    if (!u.alairo.length) {
      out.push({ severity: "error", id: u.id,
        message: "az űrlapnak nincs aláírója — az aláírás nélküli beadvány nem beadvány" });
    }
    for (const m of u.melleklet ?? []) {
      if (!urlapIds.has(m)) {
        out.push({ severity: "error", id: u.id, message: `ismeretlen melléklet: ${m}` });
      }
    }
    for (const m of u.mezok) {
      if (m.kitolti === "rendszer" && !m.bizonyitek) {
        out.push({ severity: "error", id: u.id,
          message:
            `a(z) ${m.id} mező RENDSZERBŐL válaszolhatónak van jelölve, de nincs ` +
            `hozzá bizonyítékkulcs — így senki nem venné észre, ha elavul` });
      }
      if (m.bizonyitek && !kulcsok.has(m.bizonyitek)) {
        out.push({ severity: "error", id: u.id,
          message: `ismeretlen bizonyítékkulcs a(z) ${m.id} mezőnél: ${m.bizonyitek}` });
      }
    }
    for (const a of u.mitAllit ?? []) {
      if (!a.allitas?.trim()) {
        out.push({ severity: "error", id: u.id, message: `üres állítás: ${a.id}` });
      }
      if (a.bizonyitek && !kulcsok.has(a.bizonyitek)) {
        out.push({ severity: "error", id: u.id,
          message: `ismeretlen bizonyítékkulcs a(z) ${a.id} állításnál: ${a.bizonyitek}` });
      }
      // A BIZONYÍTÉK NÉLKÜLI ÁLLÍTÁS NEM HIBA — de megnevezve marad.
      if (a.bizonyitek === null || a.bizonyitek === undefined) {
        out.push({ severity: "warning", id: a.id,
          message:
            `a beadvány állítása mögött nincs gépi bizonyíték: „${a.allitas.slice(0, 90)}…” ` +
            (a.megjegyzes ? `— ${a.megjegyzes}` : "") });
      }
    }
    // A SZEMÉLYES ADATOT KÉRŐ ŰRLAP KITÖLTÖTT PÉLDÁNYA NEM KERÜLHET A REPÓBA.
    if (u.mezok.some((m) => m.szemelyesAdat) && !u.szabalyzat) {
      out.push({ severity: "warning", id: u.id,
        message:
          "személyes adatot kérő űrlap kibocsátói szabályzat megnevezése nélkül — " +
          "nem derül ki, melyik szabályzat szerint kell kezelni" });
    }
  }

  for (const k of cs.kapuk) {
    if (!kulcsok.has(k.bizonyitek)) {
      out.push({ severity: "error", id: k.id,
        message: `ismeretlen bizonyítékkulcs a kapunál: ${k.bizonyitek}` });
    }
  }

  const kapuk = kapuAllas(cs, biz);
  const c = csatlakozhato(kapuk);
  if (!c.csatlakozhato) {
    out.push({ severity: "warning", id: cs.id, message: c.miert });
  }
  for (const m of mezoAllas(cs, biz).filter((x) => x.allapot === "hianyzoBizonyitek")) {
    out.push({ severity: "error", id: m.mezo, message: m.miert });
  }
  return out;
}

export interface CsatlakozasMerleg {
  urlap: number;
  mezo: number;
  rendszerbol: number;
  szervezeti: number;
  uzemeltetesi: number;
  allitas: number;
  bizonyitatlanAllitas: number;
  kapu: number;
  alloKapu: number;
  csatlakozhato: boolean;
}

export function merleg(cs: Csatlakozas, biz: Bizonyitek[]): CsatlakozasMerleg {
  const m = mezoAllas(cs, biz);
  const k = kapuAllas(cs, biz);
  const allitasok = cs.urlapok.flatMap((u) => u.mitAllit ?? []);
  const db = (a: MezoAllapot) => m.filter((x) => x.allapot === a).length;
  return {
    urlap: cs.urlapok.length, mezo: m.length,
    rendszerbol: db("rendszerbol"), szervezeti: db("szervezeti"),
    uzemeltetesi: db("uzemeltetesi"),
    allitas: allitasok.length,
    bizonyitatlanAllitas: allitasok.filter((a) => !a.bizonyitek).length,
    kapu: k.length, alloKapu: k.filter((x) => x.all).length,
    csatlakozhato: csatlakozhato(k).csatlakozhato,
  };
}
