/**
 * MODELLPANEL — külön eredmények, ÉS egy összevonás, ami nem hazudik.
 *
 * A kérés egyszerű volt: több CTG-modell adjon KÜLÖN-KÜLÖN eredményt, és
 * kombináljuk őket. Az első fele triviális. A második fele az, ahol egy
 * együttes rendszer a leggyakrabban téved — és a tévedés nem látszik.
 *
 * AMIT AZ ÖSSZEVONÁS FELTÉTELEZ, ÉS AMI ITT NEM IGAZ
 *
 * Több modell egyetértése akkor erősít, ha a modellek FÜGGETLENÜL tévednek.
 * Ezért működik a szakértői konzílium és ezért működik az ensemble. A
 * megvizsgált CTG-tárak közül viszont hat UGYANAZT az adatsort használja,
 * bájtra azonosan (md5 e9a749d3…, 2126 sor, egyetlen portugál centrum). Hat
 * modell ugyanabból az adatból ugyanazt a torzítást tanulja meg — az
 * egyetértésük nem megerősítés, hanem VISSZHANG.
 *
 * Ha a rendszer ezt „6 modellből 6 egyetért” formában mutatná, az a
 * leghatározottabb állítás lenne, amit valaha tesz, és a legkevésbé megalapozott.
 *
 * EZÉRT AZ ÖSSZEVONÁS ELŐBB CSOPORTOSÍT, AZTÁN SZÁMOL.
 *
 * A csoportosítás alapja a TANÍTÓADAT UJJLENYOMATA. Egy ujjlenyomat = EGY HANG,
 * akárhány modell tartozik hozzá. A kimenet ezért nem a modellek számát mondja,
 * hanem a FÜGGETLEN HANGOKÉT — és ha csak egy van, azt mondja ki, hogy az
 * egyetértés itt nem jelent megerősítést.
 *
 * ÉS A MÁSODIK, AMIT NEM SZABAD ÖSSZEADNI: A KÜLÖNBÖZŐ KÉRDÉST.
 *
 * Egy modell, amit a görbe SZAKÉRTŐI OLVASATÁRA tanítottak, azt jósolja, mit
 * mondanának a szülészek. Egy modell, amit KIMENETELRE tanítottak, azt, hogy mi
 * történt a gyerekkel. A kettő nem ugyanannak a kérdésnek két becslése, hanem
 * két különböző kérdés — az átlaguk semmit nem jelent. A panel ezért a
 * címkefajtát is csoportosítja, és keveredés esetén megtagadja az összevonást.
 *
 * AMI EMBERI DÖNTÉS MARAD: hogy egy visszhangzó egyetértésre szabad-e bármit
 * alapozni. A rendszer csak annyit tesz, hogy nem tünteti el a kérdést.
 */
import type { Jelolt, ModellKeszlet } from "./modell.ts";
import { kapu } from "./modell.ts";
import type { RegistryIssue } from "../registry.ts";

/** A tanítóadat ujjlenyomata — EZ a függetlenség mércéje. */
export interface TanitoAdat {
  id: string;
  megnevezes: string;
  /** Ha megvan, két jelölt azonossága BIZONYÍTHATÓ, nem feltételezett. */
  md5?: string | null;
  n?: number | null;
  /**
   * Mire tanítottak: a görbe szakértői OLVASATÁRA vagy a beteg KIMENETELÉRE.
   * A kettő nem ugyanannak a kérdésnek két becslése.
   */
  cimkeFajta: "olvasat" | "kimenetel" | "ismeretlen";
}

export interface JeloltAdattal extends Jelolt {
  tanitoAdat?: TanitoAdat;
}

/* ── EGY MODELL EREDMÉNYE ────────────────────────────────────────────── */

export type EredmenyAllapot =
  /** A modell adott kimenetet. */
  | "kimenet"
  /** A kapu zárva — a modell nem futott. A hiány MEGNEVEZVE. */
  | "kapuZarva"
  /** A modell futott, de nem tudta megítélni. Ez ÉRVÉNYES kimenet. */
  | "nemItelhetoMeg";

export interface ModellEredmeny {
  modell: string;
  megnevezes: string;
  allapot: EredmenyAllapot;
  /** A besorolás kódja, ha született. */
  cimke: string | null;
  /** A modell saját bizonyossága, ha közölte. Hiánya nem 1. */
  bizonyossag: number | null;
  tanitoAdat: TanitoAdat | null;
  miert: string;
}

/** Amit a hívó ad: mit mondott az egyes modell. A futtatás nem ezé a rétegé. */
export interface Futtatas {
  modell: string;
  cimke?: string;
  bizonyossag?: number;
  /** A modell kimondta, hogy nem tudja megítélni. */
  nemItelhetoMeg?: boolean;
}

/**
 * A PANEL: minden jelölt KÜLÖN sora. A zárt kapujú modell is kap sort — a
 * hiánya adat, nem üresség.
 */
export function panel(
  k: ModellKeszlet, futtatasok: Futtatas[],
): ModellEredmeny[] {
  const map = new Map(futtatasok.map((f) => [f.modell, f]));
  return (k.jeloltek as JeloltAdattal[]).map((j) => {
    const g = kapu(k, j);
    const kozos = {
      modell: j.id, megnevezes: j.megnevezes,
      tanitoAdat: j.tanitoAdat ?? null,
    };
    if (!g.hasznalhato) {
      return { ...kozos, allapot: "kapuZarva" as const, cimke: null, bizonyossag: null,
        miert: g.miert };
    }
    const f = map.get(j.id);
    if (!f || f.nemItelhetoMeg || !f.cimke) {
      return { ...kozos, allapot: "nemItelhetoMeg" as const, cimke: null,
        bizonyossag: null,
        miert: f?.nemItelhetoMeg
          ? `A modell kimondta, hogy nem tudja megítélni. Ez ÉRVÉNYES kimenet, ` +
            `nem hiba — ugyanúgy, mint a klinikustól.`
          : `A modell nem adott kimenetet.` };
    }
    return { ...kozos, allapot: "kimenet" as const, cimke: f.cimke,
      bizonyossag: typeof f.bizonyossag === "number" ? f.bizonyossag : null,
      miert: `A modell besorolása: ${f.cimke}.` };
  });
}

/* ── AZ ÖSSZEVONÁS ───────────────────────────────────────────────────── */

export interface Hang {
  /** A tanítóadat ujjlenyomata — ez a hang azonossága. */
  adat: string;
  megnevezes: string;
  cimkeFajta: TanitoAdat["cimkeFajta"];
  /** Mely modellek tartoznak ide. Több modell EGY hang. */
  modellek: string[];
  /** Amit ez a hang mond. Ha a hangon belül eltérés van, az MAGA IS jel. */
  cimke: string | null;
  belsoEltres: boolean;
}

export type OsszevonasAllapot =
  /** Egyetértés több FÜGGETLEN hang között. Ez az egyetlen eset, ami erősít. */
  | "egyetertes"
  /** Független hangok eltérnek. Nem hiba: ez a valódi bizonytalanság. */
  | "elteres"
  /**
   * Csak EGY független hang van — akárhány modellből. Az egyetértésük
   * VISSZHANG, nem megerősítés.
   */
  | "egyHang"
  /** Különböző KÉRDÉSRE tanított modellek: nem vonhatók össze. */
  | "kevertKerdes"
  /** Nincs mit összevonni. */
  | "nincsKimenet";

export interface Osszevonas {
  allapot: OsszevonasAllapot;
  /** A közös besorolás — csak `egyetertes` esetén. Máskor NULL, nem többség. */
  cimke: string | null;
  hangok: Hang[];
  /** Hány FÜGGETLEN hang — nem hány modell. */
  fuggetlenHangok: number;
  modellekSzama: number;
  /** Erősíti-e egymást a több eredmény. */
  megerosit: boolean;
  miert: string;
}

export function osszevon(eredmenyek: ModellEredmeny[]): Osszevonas {
  const kimenetek = eredmenyek.filter((e) => e.allapot === "kimenet");
  if (!kimenetek.length) {
    return { allapot: "nincsKimenet", cimke: null, hangok: [], fuggetlenHangok: 0,
      modellekSzama: 0, megerosit: false,
      miert:
        `Egyetlen modell sem adott kimenetet (${eredmenyek.length} jelöltből ` +
        `${eredmenyek.filter((e) => e.allapot === "kapuZarva").length} kapuja zárva).` };
  }
  /* A CSOPORTOSÍTÁS KULCSA: az ujjlenyomat, ha van; ha nincs, az adat
     azonosítója. Ismeretlen tanítóadatnál a modell SAJÁT azonosítója a kulcs —
     nem feltételezzük, hogy független, de azt sem, hogy nem az; magában áll. */
  const csoport = new Map<string, ModellEredmeny[]>();
  for (const e of kimenetek) {
    const t = e.tanitoAdat;
    const kulcs = t?.md5 ? `md5:${t.md5}` : t?.id ? `id:${t.id}` : `modell:${e.modell}`;
    csoport.set(kulcs, [...(csoport.get(kulcs) ?? []), e]);
  }
  const hangok: Hang[] = [...csoport.entries()].map(([kulcs, es]) => {
    const cimkek = [...new Set(es.map((e) => e.cimke))];
    return {
      adat: kulcs,
      megnevezes: es[0].tanitoAdat?.megnevezes ?? "ismeretlen tanítóadat",
      cimkeFajta: es[0].tanitoAdat?.cimkeFajta ?? "ismeretlen",
      modellek: es.map((e) => e.modell),
      cimke: cimkek.length === 1 ? cimkek[0] : null,
      belsoEltres: cimkek.length > 1,
    };
  });
  const fajtak = [...new Set(hangok.map((h) => h.cimkeFajta))];
  if (fajtak.length > 1) {
    return { allapot: "kevertKerdes", cimke: null, hangok,
      fuggetlenHangok: hangok.length, modellekSzama: kimenetek.length, megerosit: false,
      miert:
        `A modellek KÜLÖNBÖZŐ KÉRDÉSRE vannak tanítva (${fajtak.join(", ")}). Az ` +
        `olvasatra tanított modell azt jósolja, mit mondanának a szülészek; a ` +
        `kimenetelre tanított azt, hogy mi történt a gyerekkel. A kettő nem ` +
        `ugyanannak a kérdésnek két becslése — az átlaguk semmit nem jelent, ` +
        `ezért nem is képezzük.` };
  }
  const cimkek = [...new Set(hangok.map((h) => h.cimke))];
  if (hangok.length === 1) {
    const h = hangok[0];
    return { allapot: "egyHang", cimke: h.cimke, hangok,
      fuggetlenHangok: 1, modellekSzama: kimenetek.length, megerosit: false,
      miert:
        `${kimenetek.length} modell futott, de MIND UGYANARRÓL A TANÍTÓADATRÓL ` +
        `(${h.megnevezes}). Ez EGY hang, nem ${kimenetek.length}: az ` +
        `egyetértésük visszhang, nem megerősítés — ugyanabból az adatból ` +
        `ugyanazt a torzítást tanulták. A besorolás („${h.cimke ?? "eltérő"}”) ` +
        `ettől még lehet helyes; csak nem lett megerősítve.` +
        (h.belsoEltres
          ? ` RÁADÁSUL a hangon belül sincs egyetértés — ugyanabból az adatból ` +
            `tanított modellek mondanak mást, ami magában is jel.`
          : "") };
  }
  if (cimkek.length === 1 && cimkek[0] !== null) {
    return { allapot: "egyetertes", cimke: cimkek[0], hangok,
      fuggetlenHangok: hangok.length, modellekSzama: kimenetek.length, megerosit: true,
      miert:
        `${hangok.length} FÜGGETLEN tanítóadatból származó hang egyetért ` +
        `(„${cimkek[0]}”). Ez az egyetlen eset, amikor a több eredmény ` +
        `erősíti egymást.` };
  }
  return { allapot: "elteres", cimke: null, hangok,
    fuggetlenHangok: hangok.length, modellekSzama: kimenetek.length, megerosit: false,
    miert:
      `A független hangok ELTÉRNEK (${hangok.map((h) => `${h.megnevezes}: ` +
      `${h.cimke ?? "önmagával sem egyezik"}`).join(" · ")}). Ez nem hiba, hanem ` +
      `a valódi bizonytalanság — és többséget SEM képezünk belőle: két hang ` +
      `közül a „nyertes” kiválasztása azt a bizonytalanságot tüntetné el, ami ` +
      `az egyetlen valódi információ itt.` };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateEgyuttes(k: ModellKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const jeloltek = k.jeloltek as JeloltAdattal[];
  for (const j of jeloltek) {
    if (!j.tanitoAdat) {
      out.push({ severity: "error", id: j.id,
        message:
          `A(z) „${j.megnevezes}” jelöltnek nincs tanítóadat-ujjlenyomata. ` +
          `Enélkül az összevonás nem tudja megkülönböztetni a független hangot ` +
          `a visszhangtól, és több modell egyetértését megerősítésnek olvasná.` });
      continue;
    }
    const t = j.tanitoAdat;
    if (!["olvasat", "kimenetel", "ismeretlen"].includes(t.cimkeFajta)) {
      out.push({ severity: "error", id: j.id,
        message: `Ismeretlen címkefajta: „${t.cimkeFajta}”.` });
    }
    if (t.cimkeFajta === "kimenetel" && !t.md5 && !t.n) {
      out.push({ severity: "warning", id: j.id,
        message:
          `KIMENETELRE tanítottnak jelölt modell az adatsor méretének és ` +
          `ujjlenyomatának megadása nélkül. Ez a rendszer legerősebb állítása ` +
          `egy modellről — fedezet kell alá.` });
    }
  }
  /* A LEGFONTOSABB, AMIT KI KELL MONDANI: hány FÜGGETLEN hang van egyáltalán. */
  const kulcsok = new Set(jeloltek.map((j) =>
    j.tanitoAdat?.md5 ? `md5:${j.tanitoAdat.md5}` : `id:${j.tanitoAdat?.id ?? j.id}`));
  const uci = jeloltek.filter((j) => j.tanitoAdat?.md5 === "e9a749d3003a7c2f224c92ce0ffd99df");
  if (uci.length > 1) {
    out.push({ severity: "warning", id: "ai.egyuttes",
      message:
        `${uci.length} jelölt UGYANAZT a tanítóadatot használja (bájtra azonos, ` +
        `md5 e9a749d3…): ${uci.map((j) => j.id).join(", ")}. Ez ${kulcsok.size} ` +
        `független hang összesen — az összevonás ezt csoportosítja, és ` +
        `${uci.length} modell egyetértését NEM mutatja megerősítésnek.` });
  }
  return out;
}
