/**
 * A HORGONY — a 16. lépés első fele, és a lépés egyetlen igazi felfedezése.
 *
 * A 16. lépés első elfogadási kritériuma úgy szól: *„két hét éles használat
 * után a rendszer NEM VESZÍTETT ADATOT”.* Ez a mondat egy MÉRÉST ígér, és a
 * pilot előtt tisztázni kell, mivel mérnénk. A kézenfekvő válasz a
 * lenyomatlánc lett volna — és éppen ez az, ami erre a kérdésre NEM felel.
 *
 * A LÁNC A MÚLTAT KÖTI MEG, A VÉGÉT NEM
 *
 * Minden bejegyzés hordozza az előzője lenyomatát, tehát bármelyik KÖZBÜLSŐ
 * bejegyzés eltűnése vagy módosulása kimutatható. De ha egy negyven
 * bejegyzésből álló naplóból az utolsó öt vész el — csonkolt fájl, félig
 * átmásolt mentés, régebbi pillanatképből visszaállított eset —, akkor a
 * maradék 1..35 lánc HIÁNYTALAN. A `verifyChain()` „ép”-et mond, a
 * `restoreDrill()` átmegy, és a rendszer megnyugtatóan közli, hogy minden
 * rendben. Öt vajúdási bejegyzés hiányzik, és semmi nem szól.
 *
 * Nem hibás megvalósítás: a naplóban NINCS olyan adat, amiből ez kiderülhetne.
 * Ahhoz tudni kell, hol ért véget — és azt a naplón KÍVÜL kell tudni, mert ami
 * a naplófájlban van, azt ugyanaz a csonkolás viszi el.
 *
 * EZÉRT A HORGONY. Írás után, KÜLÖN fájlba (jobb esetben külön gépre) egy
 * három adatból álló csúcsjelzés: eset, utolsó sorszám, utolsó lenyomat. A
 * levágott vég ettől kezdve NEM csendes: a horgony 40-et mond, a napló 35-nél
 * ér véget, és a különbség megnevezhető.
 *
 * ÉS AMI MIATT EZ NEM CSAK EGY ÚJABB ELLENŐRZÉS
 *
 * A hiányzó horgony NEM „rendben”. Horgony nélkül a rendszer nem azt mondja,
 * hogy nem veszett adat, hanem azt, hogy NEM TUDJA. A két állítás
 * összekeverése pontosan az a hiba, amit a pilot elfogadási kritériuma
 * megkövetel, hogy ne kövessük el: a bizonyítatlan épség nem épség.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Horgony, JournalEntry } from "../journal/types.ts";
import type { ChainCheck } from "../journal/journal.ts";
import { verifyChain } from "../journal/journal.ts";

/* ── A HORGONY FELVÉTELE ─────────────────────────────────────────────── */

/** A napló mostani végéből horgony. Üres naplóra nincs — nincs mit rögzíteni. */
export function horgonyBol(log: JournalEntry[], at: string): Horgony | null {
  const last = log[log.length - 1];
  if (!last) return null;
  return { caseId: last.caseId, seq: last.seq, hash: last.hash, at };
}

/* ── AZ ÉPSÉG MEGÍTÉLÉSE ─────────────────────────────────────────────── */

export type EpsegAllapot =
  /** A napló pontosan a horgonyig tart, és a lánc ép. */
  | "ep"
  /** A napló TÚLNYÚLIK a horgonyon: tartós bejegyzések, még nem horgonyozva. */
  | "elorefut"
  /** A napló a horgony ELŐTT ér véget: bizonyítottan hiányzik a vég. */
  | "levagott"
  /** A horgony sorszámán MÁS lenyomat áll: két napló, nem egy. */
  | "elagazott"
  /** A lánc maga sérült — a horgonyt meg sem kérdeztük. */
  | "lancHiba"
  /** Nincs horgony. Az épség NEM BIZONYÍTOTT — ez nem ugyanaz, mint „ép”. */
  | "horgonyNelkul";

export interface Epseg {
  allapot: EpsegAllapot;
  /**
   * Bizonyított-e, hogy nem veszett adat. A hiányzó horgony sehol nem „nem
   * veszett” — ez a mező ezért `false` a `horgonyNelkul` esetben is.
   */
  bizonyitott: boolean;
  /** Hány bejegyzés hiányzik BIZONYÍTOTTAN a végről. */
  hianyzo: number;
  /** Hány bejegyzés tartós, de még nem horgonyozott. */
  horgonyozatlan: number;
  lanc: ChainCheck;
  miert: string;
}

export function epseg(log: JournalEntry[], h: Horgony | null): Epseg {
  const lanc = verifyChain(log);
  const utolso = log[log.length - 1];

  if (!lanc.ok) {
    return {
      allapot: "lancHiba", bizonyitott: false, hianyzo: 0, horgonyozatlan: 0, lanc,
      miert: "A lánc maga sérült, a horgonyt fel sem kell tenni: " + lanc.why,
    };
  }

  if (!h) {
    return {
      allapot: "horgonyNelkul", bizonyitott: false, hianyzo: 0, horgonyozatlan: 0, lanc,
      miert:
        "NINCS HORGONY ehhez az esethez. A lánc ép — de az ép lánc csak azt " +
        "mondja, hogy ami itt van, az hiteles, nem azt, hogy MINDEN itt van. " +
        "Egy levágott vég ugyanígy nézne ki. A rendszer tehát nem azt állítja, " +
        "hogy nem veszett adat, hanem hogy NEM TUDJA.",
    };
  }

  if (!log.length) {
    return {
      allapot: "levagott", bizonyitott: false, hianyzo: h.seq, horgonyozatlan: 0, lanc,
      miert:
        `A horgony ${h.seq} bejegyzést állít, a napló ÜRES. Az egész eset ` +
        `eltűnt — és a lánc erről „érvényes üres napló”-t mondana.`,
    };
  }

  if (utolso.seq < h.seq) {
    const hianyzo = h.seq - utolso.seq;
    return {
      allapot: "levagott", bizonyitott: false, hianyzo, horgonyozatlan: 0, lanc,
      miert:
        `LEVÁGOTT VÉG: a horgony a(z) ${h.seq}. bejegyzésig állítja a naplót, ` +
        `az viszont a(z) ${utolso.seq}.-nál ér véget. ${hianyzo} bejegyzés ` +
        `hiányzik, és a lánc ettől még HIÁNYTALAN — ezt egyedül a horgony ` +
        `mutatja meg. Ez adatvesztés, nem sérülés: mentésből kell visszahozni.`,
    };
  }

  const horgonyPont = log.find((e) => e.seq === h.seq);
  if (horgonyPont && horgonyPont.hash !== h.hash) {
    return {
      allapot: "elagazott", bizonyitott: false, hianyzo: 0, horgonyozatlan: 0, lanc,
      miert:
        `ELÁGAZÁS a(z) ${h.seq}. bejegyzésnél: a horgony más lenyomatot rögzített, ` +
        `mint ami a naplóban áll. Mindkét lánc önmagában ép — de nem UGYANAZ az ` +
        `eset története. Vagy visszaállítás után újraírás történt, vagy két ` +
        `példány futott egymás mellett.`,
    };
  }

  const horgonyozatlan = utolso.seq - h.seq;
  if (horgonyozatlan > 0) {
    return {
      allapot: "elorefut", bizonyitott: true, hianyzo: 0, horgonyozatlan, lanc,
      miert:
        `A napló ${horgonyozatlan} bejegyzéssel túlnyúlik a horgonyon ` +
        `(${h.seq} → ${utolso.seq}). Ez NORMÁLIS: az írás és a horgony ` +
        `felvétele között eltelik idő. A ${h.seq}. bejegyzésig az épség ` +
        `bizonyított; ami utána jön, azt a következő horgony köti le.`,
    };
  }

  return {
    allapot: "ep", bizonyitott: true, hianyzo: 0, horgonyozatlan: 0, lanc,
    miert:
      `A napló a horgonyig ép: ${log.length} bejegyzés, a vég a(z) ${h.seq}. ` +
      `bejegyzésnél, a lenyomat egyezik. Ez az egyetlen olyan állítás, ami ` +
      `adatvesztés HIÁNYÁT bizonyítja.`,
  };
}

/* ── A HORGONYTÁR ────────────────────────────────────────────────────── */

/**
 * A horgonyok tárolása — SZÁNDÉKOSAN nem az archívum könyvtárában.
 *
 * Ha a horgony a naplófájl mellett áll, ugyanaz a törölt kötet, ugyanaz a
 * félbeszakadt másolás viszi el mindkettőt — és akkor a bizonyíték pontosan
 * akkor tűnik el, amikor kellene. A tár ezért külön gyökeret kap, és a
 * telepítésnek külön köteten (jobb esetben külön gépen) a helye.
 */
export interface HorgonyTar {
  read(caseId: string): Horgony | null;
  write(h: Horgony): void;
}

export class FileHorgonyTar implements HorgonyTar {
  private dir: string;
  constructor(dir: string) { this.dir = dir; }

  private file(caseId: string): string {
    if (!/^[A-Za-z0-9._-]{1,120}$/.test(caseId) || caseId.startsWith(".")) {
      throw new Error(`Érvénytelen esetazonosító a horgonytárban: „${caseId}”.`);
    }
    return join(this.dir, `${caseId}.json`);
  }

  read(caseId: string): Horgony | null {
    const f = this.file(caseId);
    if (!existsSync(f)) return null;
    return JSON.parse(readFileSync(f, "utf8")) as Horgony;
  }

  write(h: Horgony): void {
    const f = this.file(h.caseId);
    mkdirSync(dirname(f), { recursive: true });
    // A HORGONY CSAK ELŐRE MEHET. Egy visszafelé írt horgony pontosan azt a
    // vesztést fedné el, amit ki kellene mutatnia — ezért a régebbi vég
    // felülírása hiba, nem frissítés.
    const meglevo = this.read(h.caseId);
    if (meglevo && h.seq < meglevo.seq) {
      throw new Error(
        `A horgony VISSZAFELÉ mozogna: ${meglevo.seq} → ${h.seq} (${h.caseId}). ` +
        `Ez elfedné a levágott véget. Ha a napló tényleg rövidebb lett, az ` +
        `adatvesztés, és nem a horgonyt kell hozzáigazítani.`,
      );
    }
    writeFileSync(f, JSON.stringify(h) + "\n", "utf8");
  }
}

/* ── A PILOT ELSŐ KRITÉRIUMA ─────────────────────────────────────────── */

export interface EsetEpseg { caseId: string; epseg: Epseg; }

export interface AdatvesztesMerleg {
  esetek: number;
  bizonyitottanEp: number;
  levagott: number;
  elagazott: number;
  lancHiba: number;
  horgonyNelkul: number;
  hianyzoBejegyzes: number;
  /** Kimondható-e, hogy „a rendszer nem veszített adatot”. */
  kimondhato: boolean;
  miert: string;
}

/**
 * „A RENDSZER NEM VESZÍTETT ADATOT” — kimondható-e.
 *
 * Egyetlen horgony nélküli eset is elveszi az állítást. Nem szigorúskodás: a
 * mondat a pilot elfogadási kritériuma, tehát BIZONYÍTÉK, nem benyomás — és
 * egy nem mért esetről nem tudjuk, épp az volt-e, amelyik csonkult.
 */
export function adatvesztesMerleg(esetek: EsetEpseg[]): AdatvesztesMerleg {
  const szam = (a: EpsegAllapot) => esetek.filter((e) => e.epseg.allapot === a).length;
  const bizonyitottanEp = esetek.filter((e) => e.epseg.bizonyitott).length;
  const levagott = szam("levagott");
  const elagazott = szam("elagazott");
  const lancHiba = szam("lancHiba");
  const horgonyNelkul = szam("horgonyNelkul");
  const hianyzoBejegyzes = esetek.reduce((n, e) => n + e.epseg.hianyzo, 0);
  const romlott = levagott + elagazott + lancHiba;
  const kimondhato = esetek.length > 0 && romlott === 0 && horgonyNelkul === 0;

  return {
    esetek: esetek.length, bizonyitottanEp, levagott, elagazott, lancHiba,
    horgonyNelkul, hianyzoBejegyzes, kimondhato,
    miert: !esetek.length
      ? "Nincs megvizsgált eset. Ez nem „nem veszett adat”, hanem „nem mértünk”."
      : romlott
        ? `NEM MONDHATÓ KI: ${levagott} levágott, ${elagazott} elágazott, ` +
          `${lancHiba} sérült láncú eset, összesen ${hianyzoBejegyzes} ` +
          `bizonyítottan hiányzó bejegyzés.`
        : horgonyNelkul
          ? `NEM MONDHATÓ KI: ${horgonyNelkul} esetnek nincs horgonya a ` +
            `${esetek.length}-ból. Ezekről a rendszer nem azt állítja, hogy ` +
            `épek, hanem hogy nem tudja — és épp az egyik lehetett a csonkult.`
          : `KIMONDHATÓ: mind a(z) ${esetek.length} eset épsége horgonnyal ` +
            `bizonyított, hiányzó bejegyzés nincs.`,
  };
}
