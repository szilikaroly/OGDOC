/**
 * A RIASZTÁSOK CÍMZETTJE ÉS AZ ESZKALÁCIÓS REND — a 15. lépés gépi fele.
 *
 * A rendszer több száz helyen tud vörös zászlót emelni: 283 kódolt válasz a
 * változóregiszterben, 15 kalkulátorsáv, panaszszótári zászlók, kérdőívek
 * kritikus tételei, a szepszisprotokoll, a vérzési stádiumok, a CTG-kategória.
 * MA EGYETLEN RIASZTÁSNAK SINCS CÍMZETTJE.
 *
 * ÉS EZ NEM ELMÉLETI HIÁNY. A szepsziscsomag `alertStatus()` függvénye a ki
 * nem vett riasztásról ezt mondja: „magának is riasztást kell kiváltania, EGY
 * SZINTTEL FELJEBB”. A típusban viszont nincs semmi, ami megmondaná, mi van
 * feljebb: az `escalation` mező egy címkéből, egy megjegyzésből és egy
 * percszámból áll. A próza megígéri az eszkalációt, a szerkezet nem tudja
 * hordozni — ugyanaz a családja, mint a 7–13. lépés leleteinek, azzal a
 * különbséggel, hogy itt a következmény nem téves szám, hanem egy riasztás,
 * amit senki nem vesz át, és amiről a rendszer azt hiszi, hogy szólt.
 *
 * AMIÉRT EZ A LÉPÉS FONTOSABB A KÜSZÖBÖK PONTOSSÁGÁNÁL:
 *
 *   A válaszút nélküli riasztás rosszabb a semminél. Aki naponta háromszor kap
 *   figyelmeztetést, amire nincs kihez fordulnia, két hét alatt megtanulja
 *   elkattintani — és akkor az igazit is elkattintja.
 *
 * Ezért a kapu itt MEGFORDUL a rendszer többi kapujához képest. Máshol a
 * hiányzó aláírás azt akadályozza meg, hogy rossz SZÁM jelenjen meg. Itt a
 * hiányzó címzett azt akadályozza meg, hogy egyáltalán MEGSZÓLALJON a
 * rendszer — mert a címzett nélküli riasztás nem féltájékoztatás, hanem
 * kiképzés az elkattintásra.
 *
 * ÉS A LÁNC VÉGE. A ki nem vett riasztás eggyel feljebb megy. Ha a lánc
 * körbeér vagy sosem ér véget, a riasztás örökké vándorol, és senki nem
 * felelős érte. A legfelső szintnek ezért KIMONDOTTAN utolsónak kell lennie:
 * valakinél meg kell állnia.
 */
import { readFileSync } from "node:fs";
import type { I18n } from "../types.ts";
import type { RegistryIssue } from "../registry.ts";

/* ── A LÁNC ──────────────────────────────────────────────────────────── */

export type Sulyossag = "azonnali" | "surgos" | "kovetheto";

export interface LancSzint {
  /** Hányadik szint. 1 = az elsődleges címzett. */
  szint: number;
  /** MEGNEVEZETT szerepkör — nem osztály, nem „az ügyelet”. */
  cimzett: string;
  /** Hogyan érhető el. Enélkül a címzett csak papíron létezik. */
  elerhetoseg: string;
  /** Ennyi percen belül kell ÁTVENNIE. */
  valaszHatarideoPerc: number;
  /**
   * A LÁNC VÉGE. Ha igaz, innen nincs feljebb — és ez nem hiányosság,
   * hanem követelmény: valakinél meg kell állnia.
   */
  utolso?: boolean;
}

export interface RiasztasTipus {
  id: string;
  megnevezes: string;
  /** Melyik rétegből származik. */
  forras: string;
  sulyossag: Sulyossag;
  mitJelent: string;
  lanc: LancSzint[];
}

export interface EszkalaciosRend {
  id: string;
  label: I18n;
  note?: string;
  szerepek: Record<string, string>;
  tipusok: RiasztasTipus[];
}

export function loadRend(path: string): EszkalaciosRend {
  return JSON.parse(readFileSync(path, "utf8")) as EszkalaciosRend;
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export type TipusAllapot =
  /** Van teljes lánc, lezárt végponttal. */
  | "kiadhato"
  /** Nincs egyetlen címzett sem. */
  | "cimzettNelkul"
  /** Van címzett, de a lánc nem ér véget — a riasztás körbejárna. */
  | "lezaratlanLanc";

export interface TipusAllas {
  tipus: string;
  megnevezes: string;
  sulyossag: Sulyossag;
  allapot: TipusAllapot;
  /** Kiadható-e MA riasztás ebből a típusból. */
  kiadhato: boolean;
  szintek: number;
  miert: string;
}

export function tipusAllas(t: RiasztasTipus): TipusAllas {
  const kozos = {
    tipus: t.id, megnevezes: t.megnevezes, sulyossag: t.sulyossag,
    szintek: t.lanc.length,
  };
  if (!t.lanc.length) {
    return {
      ...kozos, allapot: "cimzettNelkul", kiadhato: false,
      miert:
        `NINCS CÍMZETT: ez a riasztás nem adható ki. Nem óvatosságból — a ` +
        `válaszút nélküli riasztás rosszabb a semminél, mert megtanítja a ` +
        `címzettjét elkattintani, és akkor az igazit is elkattintja.`,
    };
  }
  if (!t.lanc.some((x) => x.utolso)) {
    return {
      ...kozos, allapot: "lezaratlanLanc", kiadhato: false,
      miert:
        `A LÁNC NEM ÉR VÉGET: ${t.lanc.length} szint van megnevezve, de egyik ` +
        `sincs utolsónak jelölve. A ki nem vett riasztás eggyel feljebb megy — ` +
        `ha nincs legfelső szint, örökké vándorol, és senki nem felelős érte.`,
    };
  }
  return {
    ...kozos, allapot: "kiadhato", kiadhato: true,
    miert:
      `${t.lanc.length} szint, az elsődleges címzett ${t.lanc[0].cimzett} ` +
      `(${t.lanc[0].valaszHatarideoPerc} perc), a lánc ` +
      `${t.lanc.find((x) => x.utolso)!.cimzett}-nél zárul.`,
  };
}

/* ── AZ ÉLŐ RIASZTÁS ─────────────────────────────────────────────────── */

export type RiasztasAllapot =
  | "nemAdhatoKi"
  | "kiadva"
  | "atveve"
  | "eszkalalt"
  | "kimerult";

export interface RiasztasAllas {
  tipus: string;
  allapot: RiasztasAllapot;
  /** Hányadik szinten tart a lánc. */
  szint: number;
  /** Ki a mostani címzett. `null`, ha nincs. */
  cimzett: string | null;
  /** Percek a kiadás óta. */
  eltelt: number;
  miert: string;
}

const percek = (a: string, b: string): number =>
  Math.round((Date.parse(b) - Date.parse(a)) / 60000);

/**
 * HOL TART A RIASZTÁS — és ki a felelős MOST.
 *
 * A „kiadva” és az „átvéve” két külön állapot; ez a rendszerben ismerős
 * szerkezet („megrendelve” ≠ „eredmény”). A harmadik viszont új, és ez a
 * lépés lényege: a KI NEM VETT riasztás nem elintézett riasztás — magának is
 * riasztást kell kiváltania, eggyel feljebb.
 *
 * A negyedik állapot a legkellemetlenebb, és ki kell mondani: ha a lánc
 * legfelső szintje sem vette át, a riasztás KIMERÜLT. A rendszer ilyenkor
 * nem tehet többet, és épp ezért nem szabad úgy tennie, mintha szólt volna.
 */
export function riasztasAllas(
  t: RiasztasTipus, kiadva: string, atveve: string | null, most: string,
): RiasztasAllas {
  const allas = tipusAllas(t);
  if (!allas.kiadhato) {
    return {
      tipus: t.id, allapot: "nemAdhatoKi", szint: 0, cimzett: null, eltelt: 0,
      miert: allas.miert,
    };
  }
  const eltelt = percek(kiadva, most);
  if (atveve) {
    const m = percek(kiadva, atveve);
    const sz = szintIdore(t, m);
    return {
      tipus: t.id, allapot: "atveve", szint: sz.szint, cimzett: sz.cimzett, eltelt: m,
      miert: `Átvéve ${m} perc alatt, a ${sz.szint}. szinten (${sz.cimzett}).`,
    };
  }
  const sz = szintIdore(t, eltelt);
  const utolso = t.lanc.find((x) => x.utolso)!;
  if (sz.tulFutott) {
    return {
      tipus: t.id, allapot: "kimerult", szint: utolso.szint, cimzett: utolso.cimzett,
      eltelt,
      miert:
        `KIMERÜLT: ${eltelt} perce kiadva, és a lánc legfelső szintje ` +
        `(${utolso.cimzett}) sem vette át. A rendszer nem tehet többet — és épp ` +
        `ezért nem szabad úgy tennie, mintha szólt volna.`,
    };
  }
  if (sz.szint > 1) {
    return {
      tipus: t.id, allapot: "eszkalalt", szint: sz.szint, cimzett: sz.cimzett, eltelt,
      miert:
        `ESZKALÁLVA a ${sz.szint}. szintre (${sz.cimzett}): ${eltelt} perce ` +
        `kiadva, és az alacsonyabb szint nem vette át. A ki nem vett riasztás ` +
        `nem elintézett riasztás.`,
    };
  }
  return {
    tipus: t.id, allapot: "kiadva", szint: 1, cimzett: sz.cimzett, eltelt,
    miert: `Kiadva ${eltelt} perce, ${sz.cimzett} átvételére vár ` +
           `(határidő ${t.lanc[0].valaszHatarideoPerc} perc).`,
  };
}

/** Melyik szinten tart a lánc az eltelt idő szerint. */
function szintIdore(
  t: RiasztasTipus, eltelt: number,
): { szint: number; cimzett: string; tulFutott: boolean } {
  const rend = [...t.lanc].sort((a, b) => a.szint - b.szint);
  let hatar = 0;
  for (const sz of rend) {
    hatar += sz.valaszHatarideoPerc;
    if (eltelt <= hatar) return { szint: sz.szint, cimzett: sz.cimzett, tulFutott: false };
  }
  const u = rend[rend.length - 1];
  return { szint: u.szint, cimzett: u.cimzett, tulFutott: true };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateRend(r: EszkalaciosRend): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const latott = new Set<string>();
  for (const t of r.tipusok) {
    if (latott.has(t.id)) {
      out.push({ severity: "error", id: t.id, message: "két riasztástípus ugyanazzal az azonosítóval" });
    }
    latott.add(t.id);
    if (!t.mitJelent?.trim()) {
      out.push({ severity: "error", id: t.id,
        message: "a riasztástípusnak meg kell mondania, MIT JELENT — a címzett ezt olvassa, nem a kódot" });
    }

    const szintek = t.lanc.map((x) => x.szint);
    if (new Set(szintek).size !== szintek.length) {
      out.push({ severity: "error", id: t.id, message: "ismétlődő szintszám a láncban" });
    }
    for (const sz of t.lanc) {
      if (!sz.cimzett?.trim() || !r.szerepek[sz.cimzett]) {
        out.push({ severity: "error", id: t.id,
          message:
            `a(z) ${sz.szint}. szint címzettje ismeretlen vagy üres (${sz.cimzett}) — ` +
            `a címzett MEGNEVEZETT szerepkör, nem „az ügyelet”` });
      }
      if (!sz.elerhetoseg?.trim()) {
        out.push({ severity: "error", id: t.id,
          message:
            `a(z) ${sz.szint}. szintnek nincs elérhetősége — a címzett, akit nem ` +
            `lehet elérni, csak papíron létezik` });
      }
      if (!(sz.valaszHatarideoPerc > 0)) {
        out.push({ severity: "error", id: t.id,
          message: `a(z) ${sz.szint}. szintnek nincs válaszhatárideje` });
      }
    }
    // A LÁNC VÉGE: pontosan egy utolsó szint, és az a legmagasabb.
    const utolsok = t.lanc.filter((x) => x.utolso);
    if (t.lanc.length && utolsok.length !== 1) {
      out.push({ severity: "error", id: t.id,
        message:
          `${utolsok.length} szint van utolsónak jelölve a láncban — pontosan ` +
          `egynek kell lennie, különben a ki nem vett riasztás körbejár` });
    } else if (utolsok.length === 1 && utolsok[0].szint !== Math.max(...szintek)) {
      out.push({ severity: "error", id: t.id,
        message: "az utolsónak jelölt szint nem a legmagasabb — a lánc a közepén érne véget" });
    }
    // AZ AZONNALI RIASZTÁS HATÁRIDEJE NEM LEHET ÓRÁKBAN MÉRHETŐ.
    const elso = t.lanc.find((x) => x.szint === 1);
    if (t.sulyossag === "azonnali" && elso && elso.valaszHatarideoPerc > 30) {
      out.push({ severity: "warning", id: t.id,
        message:
          `azonnali riasztás ${elso.valaszHatarideoPerc} perces válaszhatáridővel — ` +
          `az „azonnali” és a félórán túli átvétel nem fér össze` });
    }

    const a = tipusAllas(t);
    if (!a.kiadhato) {
      out.push({ severity: a.allapot === "cimzettNelkul" ? "warning" : "error",
        id: t.id, message: a.miert });
    }
  }
  return out;
}

export interface RiasztasMerleg {
  tipus: number;
  kiadhato: number;
  cimzettNelkul: number;
  azonnali: number;
  azonnaliKiadhato: number;
}

export function merleg(r: EszkalaciosRend): RiasztasMerleg {
  const a = r.tipusok.map(tipusAllas);
  return {
    tipus: a.length,
    kiadhato: a.filter((x) => x.kiadhato).length,
    cimzettNelkul: a.filter((x) => x.allapot === "cimzettNelkul").length,
    azonnali: a.filter((x) => x.sulyossag === "azonnali").length,
    azonnaliKiadhato: a.filter((x) => x.sulyossag === "azonnali" && x.kiadhato).length,
  };
}
