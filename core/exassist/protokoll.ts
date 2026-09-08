/**
 * ExAssist — A VIZSGÁLATI ASSZISZTENS, ÉS AMIT NEM ENGED LEZÁRNI.
 *
 * A modul egyetlen mondata: **a nem dokumentált vizsgálati rész nem normális
 * vizsgálati rész.** Ez a rendszer legtöbbet ismételt szabályának a vizsgálatra
 * alkalmazott alakja — és a leletnél élesebb, mint bárhol máshol, mert a lelet
 * aláírásra kerül.
 *
 * Egy hasi ultrahangnál a „nem írtam le a veséket” és a „megnéztem, épek”
 * ugyanúgy ÜRES HELYKÉNT jelenik meg. Hat hónappal később a kettő
 * megkülönböztethetetlen; az egyik mulasztás, a másik lelet, és a különbség
 * pontosan akkor számít, amikor visszakeresik.
 *
 * A HÁROM SZINT, ÉS AMI KÖZÖTTÜK NEM FORDÍTHATÓ MEG
 *
 *   szakmai minimum   a rendszerben, publikált ajánlásból  — ALSÓ KORLÁT
 *   intézményi        a minőségirányítás írja               — csak bővíthet
 *   egyéni            a vizsgáló orvos                      — csak bővíthet
 *
 * A megfordíthatatlanság a lényeg. Egy egyéni vizsgálati sor hozzátehet
 * tételeket, de a szakmai minimum egyetlen elemét sem veheti ki — különben az
 * „egyéni protokoll” a kihagyás intézményesítése lenne. Ha valaki mégis ki akar
 * hagyni egy minimumtételt, arra EGY út van: megválaszolja azzal, hogy nem
 * végezte el, és megmondja, miért. Az rögzül, látszik, auditálható.
 *
 * A NEGYEDIK ÁLLAPOT, AMI NINCS
 *
 *   ertekelve        megnézte, és leírta, mit látott          → válasz
 *   nemErtekelheto   megnézte, de nem tudta megítélni         → válasz
 *   elmaradt         nem végezte el, megnevezett okkal        → válasz
 *   hianyzik         nincs bejegyzés                          → EZ BLOKKOL
 *
 * A `nemErtekelheto` és az `elmaradt` szétválasztása nem szőrszálhasogatás: az
 * egyik a BETEG korlátja, a másik a VIZSGÁLATÉ. A „bélgáz miatt nem látszott a
 * bal petefészek” megismételendő; a „sürgős császármetszésre hívtak” nem
 * ugyanaz a teendő.
 *
 * ÉS AMIT EZ A RÉTEG SOHA NEM TESZ
 *
 * Nem tölti ki a leletet. Nincs „ép” alapértelmezés, és nincs „minden normális”
 * gomb: egy ilyen gomb a teljességet LÁTSZATTÁ tenné. Nem is minősíti a
 * vizsgálót — amint a kimaradt tételek száma teljesítménymutató lesz, a rendszer
 * arra tanít, hogy kattintsanak végig, és onnantól a teljesség hazudik. Ugyanaz
 * a hiba, mint a riasztásnál: a kikényszerített kattintás nem figyelem.
 *
 * A HITELESÍTETLEN PROTOKOLL IS KÉNYSZERÍT, ÉS EZ SZÁNDÉKOS
 *
 * A tételsorok tartalma aláírásra vár, mint a rendszer minden más küszöbe. A
 * SZERKEZET viszont addig is véd: a hiányzó tétel akkor is blokkol, ha a
 * tételsor még nincs hitelesítve. Ez a biztonságos irány — több dokumentálást
 * kérni nem árt, kevesebbet igen. Máshol a hiányzó aláírás bezárja a kaput; itt
 * NEM nyitja ki.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface Tetel {
  id: string;
  megnevezes: string;
  /** Kötelező tétel: enélkül a vizsgálat nem zárható le. */
  kotelezo: boolean;
}

export type Szint = "minimum" | "intezmenyi" | "egyeni";

export interface Protokoll {
  id: string;
  megnevezes: string;
  szint: Szint;
  /** A publikált ajánlás, amiből a tételsor származik. */
  forras: string | null;
  hitelesitve: boolean;
  miert?: string;
  tetelek: Tetel[];
  /** Bővítésnél: melyik minimumprotokollt egészíti ki. */
  bovit?: string;
  /** Egyéni szintnél: kié. */
  cselekvo?: string;
}

export interface Keszlet {
  megnevezes: string;
  modul: number;
  protokollok: Protokoll[];
  intezmenyi: Protokoll[];
  egyeni: Protokoll[];
}

export function loadProtokollok(path: string): Keszlet {
  return JSON.parse(readFileSync(path, "utf8")) as Keszlet;
}

/* ── A HATÁLYOS TÉTELSOR ─────────────────────────────────────────────── */

export interface HatalyosTetel extends Tetel {
  /** Melyik szintről jött. */
  honnan: Szint;
}

export interface Hatalyos {
  protokoll: string;
  megnevezes: string;
  hitelesitve: boolean;
  tetelek: HatalyosTetel[];
  /** A bővítő rétegek, amiket beolvasztottunk. */
  retegek: string[];
}

/**
 * A HATÁLYOS TÉTELSOR ÖSSZEÁLLÍTÁSA — csak összeadással.
 *
 * A bővítő rétegek tételei hozzáadódnak; azonos azonosítónál a MINIMUM
 * definíciója marad érvényben, mert egy bővítés nem írhatja át, hogy egy
 * minimumtétel kötelező-e.
 */
export function hatalyos(k: Keszlet, protokollId: string): Hatalyos | null {
  const alap = k.protokollok.find((p) => p.id === protokollId);
  if (!alap) return null;

  const tetelek: HatalyosTetel[] = alap.tetelek.map((t) => ({ ...t, honnan: "minimum" }));
  const latott = new Set(tetelek.map((t) => t.id));
  const retegek: string[] = [];

  for (const reteg of [...k.intezmenyi, ...k.egyeni]) {
    if (reteg.bovit !== protokollId) continue;
    retegek.push(reteg.id);
    for (const t of reteg.tetelek) {
      // AZONOS AZONOSÍTÓ: a minimum definíciója marad. Egy bővítés nem
      // teheti nem kötelezővé azt, ami a minimumban kötelező.
      if (latott.has(t.id)) continue;
      tetelek.push({ ...t, honnan: reteg.szint });
      latott.add(t.id);
    }
  }
  return {
    protokoll: alap.id, megnevezes: alap.megnevezes,
    hitelesitve: alap.hitelesitve, tetelek, retegek,
  };
}

/* ── A TÉTEL ÁLLAPOTA ────────────────────────────────────────────────── */

export type TetelAllapot =
  /** Megnézte, és leírta, mit látott. */
  | "ertekelve"
  /** Megnézte, de nem tudta megítélni — a BETEG korlátja. */
  | "nemErtekelheto"
  /** Nem végezte el, megnevezett okkal — a VIZSGÁLAT korlátja. */
  | "elmaradt"
  /** Nincs bejegyzés. Ez az egyetlen, ami blokkol. */
  | "hianyzik";

export interface Valasz {
  tetel: string;
  allapot: Exclude<TetelAllapot, "hianyzik">;
  /** `nemErtekelheto` és `elmaradt` esetén KÖTELEZŐ. */
  indok?: string;
  /** `ertekelve` esetén amit leírt. */
  lelet?: string;
}

export interface TetelAllas {
  tetel: HatalyosTetel;
  allapot: TetelAllapot;
  indok: string | null;
  miert: string;
}

export function tetelAllas(h: Hatalyos, valaszok: Valasz[]): TetelAllas[] {
  const map = new Map(valaszok.map((v) => [v.tetel, v]));
  return h.tetelek.map((t) => {
    const v = map.get(t.id);
    if (!v) {
      return {
        tetel: t, allapot: "hianyzik" as TetelAllapot, indok: null,
        miert:
          `„${t.megnevezes}” — NINCS BEJEGYZÉS. Ez nem azt jelenti, hogy ép: azt ` +
          `jelenti, hogy nem tudjuk. Ha megnézte és rendben találta, azt le kell ` +
          `írni; ha nem nézte meg, azt is.`,
      };
    }
    return {
      tetel: t, allapot: v.allapot, indok: v.indok ?? null,
      miert:
        v.allapot === "ertekelve"
          ? `„${t.megnevezes}” — értékelve.`
          : v.allapot === "nemErtekelheto"
            ? `„${t.megnevezes}” — megnézte, de nem volt megítélhető` +
              `${v.indok ? `: ${v.indok}` : ""}. A BETEG korlátja — a vizsgálat ` +
              `megismétlendő, ha a kérdés nyitva marad.`
            : `„${t.megnevezes}” — nem történt meg` +
              `${v.indok ? `: ${v.indok}` : ""}. A VIZSGÁLAT korlátja — ez a ` +
              `leleten látszik, és nem tűnik el.`,
    };
  });
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export type LezarasAllapot =
  | "lezarhato"
  /** Kötelező tétel maradt bejegyzés nélkül. */
  | "hianyzoTetel"
  /** Indoklás nélküli „nem értékelhető” vagy „elmaradt”. */
  | "indokNelkul";

export interface Lezarhatosag {
  lezarhato: boolean;
  allapot: LezarasAllapot;
  hianyzo: string[];
  indokNelkul: string[];
  miert: string;
}

/**
 * LEZÁRHATÓ-E A VIZSGÁLAT.
 *
 * Két dolog zár: a bejegyzés nélkül maradt KÖTELEZŐ tétel, és az indoklás
 * nélküli kitérő válasz. A második azért kell, mert indoklás nélkül a
 * „nem értékelhető” és az „elmaradt” ugyanolyan üres, mint a hallgatás — csak
 * kipipálva.
 *
 * A NEM KÖTELEZŐ TÉTEL HIÁNYA NEM ZÁR. Az opcionális tétel épp attól
 * opcionális; a listán viszont látszik, hogy nem történt meg.
 */
export function lezarhato(allasok: TetelAllas[]): Lezarhatosag {
  const hianyzo = allasok
    .filter((a) => a.allapot === "hianyzik" && a.tetel.kotelezo)
    .map((a) => a.tetel.id);
  const indokNelkul = allasok
    .filter((a) => (a.allapot === "nemErtekelheto" || a.allapot === "elmaradt") && !a.indok)
    .map((a) => a.tetel.id);

  if (hianyzo.length) {
    return {
      lezarhato: false, allapot: "hianyzoTetel", hianyzo, indokNelkul,
      miert:
        `A vizsgálat NEM ZÁRHATÓ LE: ${hianyzo.length} kötelező tétel maradt ` +
        `bejegyzés nélkül (${hianyzo.join(", ")}). Az üres hely és a „megnéztem, ` +
        `ép” a leletben megkülönböztethetetlen — ezért az egyiket ki kell mondani.`,
    };
  }
  if (indokNelkul.length) {
    return {
      lezarhato: false, allapot: "indokNelkul", hianyzo, indokNelkul,
      miert:
        `A vizsgálat NEM ZÁRHATÓ LE: ${indokNelkul.length} kitérő válasz ` +
        `indoklás nélkül áll (${indokNelkul.join(", ")}). Indoklás nélkül a ` +
        `„nem értékelhető” ugyanolyan üres, mint a hallgatás — csak kipipálva.`,
    };
  }
  return {
    lezarhato: true, allapot: "lezarhato", hianyzo: [], indokNelkul: [],
    miert:
      `A vizsgálat lezárható: mind a(z) ${allasok.filter((a) => a.tetel.kotelezo).length} ` +
      `kötelező tétel választ kapott.`,
  };
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

/**
 * A BŐVÍTŐ RÉTEG NEM VEHET EL.
 *
 * Ez a réteg legfontosabb ellenőrzése: egy intézményi vagy egyéni protokoll,
 * ami a szakmai minimum tételét kihagyja vagy nem kötelezővé teszi, HIBA — nem
 * beállítás. A `hatalyos()` szerkezetileg is véd (nem írja felül a minimumot),
 * de a szándékot ki kell mondani, különben csendben marad a próbálkozás.
 */
export function validateProtokollok(k: Keszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const minimum = new Map(k.protokollok.map((p) => [p.id, p]));

  for (const reteg of [...k.intezmenyi, ...k.egyeni]) {
    const alap = reteg.bovit ? minimum.get(reteg.bovit) : undefined;
    if (!alap) {
      out.push({
        severity: "error", id: `exassist.${reteg.id}`,
        message:
          `A(z) „${reteg.megnevezes}” bővítő protokoll a(z) „${reteg.bovit}” ` +
          `minimumra hivatkozik, ilyen viszont nincs. Egy bővítés alap nélkül ` +
          `nem bővítés, hanem külön protokoll — és akkor a minimum nem védi.`,
      });
      continue;
    }
    const sajat = new Map(reteg.tetelek.map((t) => [t.id, t]));
    for (const t of alap.tetelek) {
      const b = sajat.get(t.id);
      if (b && t.kotelezo && !b.kotelezo) {
        out.push({
          severity: "error", id: `exassist.${reteg.id}.${t.id}`,
          message:
            `A(z) „${reteg.megnevezes}” protokoll a szakmai minimum kötelező ` +
            `tételét („${t.megnevezes}”) NEM KÖTELEZŐVÉ tenné. A bővítő szint ` +
            `csak hozzáadhat: a kivétel a kihagyás intézményesítése volna. Ha a ` +
            `tétel elhagyható, azt a MINIMUMBAN kell megváltoztatni, aláírással.`,
        });
      }
    }
  }

  // A TÉTELSOR HITELESÍTÉSE. Figyelmeztetés, nem hiba: a szerkezet addig is
  // véd, és a hiányzó aláírás itt NEM nyit kaput, hanem zárva tartja.
  for (const p of k.protokollok.filter((x) => !x.hitelesitve)) {
    out.push({
      severity: "warning", id: `exassist.${p.id}`,
      message:
        `A(z) „${p.megnevezes}” tételsora nincs hitelesítve (${p.tetelek.length} ` +
        `tétel, forrás: ${p.forras ?? "NINCS megnevezve"}). A protokoll addig is ` +
        `kényszerít — a hiányzó aláírás itt nem nyit kaput, hanem zárva tartja —, ` +
        `de a tételek helyességéért így senki nem felel.`,
    });
  }

  // ISMÉTLŐDŐ TÉTELAZONOSÍTÓ egy protokollon belül: az egyik válasz elnyelné a
  // másikat, és a hiány észrevétlen maradna.
  for (const p of [...k.protokollok, ...k.intezmenyi, ...k.egyeni]) {
    const ids = p.tetelek.map((t) => t.id);
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (dup.length) {
      out.push({
        severity: "error", id: `exassist.${p.id}.dup`,
        message:
          `Ismétlődő tételazonosító a(z) „${p.megnevezes}” protokollban: ` +
          `${[...new Set(dup)].join(", ")}. Egy válasz mindkettőre illeszkedne, ` +
          `és a másik hiánya észrevétlen maradna.`,
      });
    }
  }
  return out;
}

/* ── MÉRLEG ──────────────────────────────────────────────────────────── */

export interface ExMerleg {
  protokoll: number;
  hitelesitett: number;
  tetel: number;
  kotelezo: number;
  bovites: number;
}

export function merleg(k: Keszlet): ExMerleg {
  const t = k.protokollok.flatMap((p) => p.tetelek);
  return {
    protokoll: k.protokollok.length,
    hitelesitett: k.protokollok.filter((p) => p.hitelesitve).length,
    tetel: t.length,
    kotelezo: t.filter((x) => x.kotelezo).length,
    bovites: k.intezmenyi.length + k.egyeni.length,
  };
}
