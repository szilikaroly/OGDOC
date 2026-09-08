/**
 * A MÉRŐESZKÖZÖK LICENCELÉSE — a 12. lépés gépi fele.
 *
 * Tíz mérőeszközből kilencnél hiányzik a validált magyar tételszöveg vagy a
 * licenc. A lépés elfogadási kritériuma szándékosan KÉTKIMENETŰ:
 *
 *   „Minden eszközre vagy licenc + validált tételszöveg van, VAGY egy leírt
 *    döntés, hogy NEM HASZNÁLJUK.”
 *
 * A rendszerben eddig csak az első kimenet létezett. A `notLicensed` jelölés
 * figyelmeztetést adott — és semmi nem tudta lezárni. Kilenc figyelmeztetés
 * állt a validálásban, kiút nélkül: aki elolvasta, nem tehetett érte semmit,
 * és aki eldöntötte, hogy a WHODAS-12-t nem használjuk, annak a döntése
 * sehol nem látszott. A megnevezetlen adósság előbb-utóbb zaj lesz, a zajt
 * pedig senki nem olvassa.
 *
 * ÉS EGY MÁSODIK, SÚLYOSABB HIÁNY. A felvételi kaput egyetlen JELÖLÉS nyitotta:
 * az `itemText.status` szó `"loaded"`-ra írása. Semmi nem kérte számon, hogy
 * a licencet valóban megszerezték-e, kitől, milyen hatókörrel — és meddig.
 * Ez ugyanaz a lyuk, mint a 9. és a 10. lépésben, hatodszorra; itt viszont a
 * következménye kettős: jogi (engedély nélkül használt védett szöveg) és
 * tudományos (a saját szavakkal feltett EPDS nem EPDS).
 *
 * AMI EBBEN A RÉTEGBEN ÚJ. A licenc LEJÁR. A rendszer öt korábbi aláírási
 * rétege időtlen: egy szám mögötti aláírás nem avul el magától, csak ha a
 * szám megváltozik. Egy licenc viszont dátumhoz kötött, és a lejárta nem a
 * mi hibánk — mégis attól a naptól kezdve jogosulatlan a felvétel. A kapu
 * ezért NAPTÁRT NÉZ, és előre szól: a megújítás hónapokat vihet.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { RegistryIssue } from "../registry.ts";
import type { Instrument } from "./types.ts";

/* ── A LENYOMAT ──────────────────────────────────────────────────────── */

/**
 * A MÉRŐESZKÖZ NORMATÍV MAGJA: amit a licenc és a validáció FED.
 *
 * Benne van minden tétel sorszáma, azonosítója és a válaszok PONTÉRTÉKEI, a
 * vágóértékek kontextusonként, a kritikus tétel, és a fordítás állapota. Ha
 * bármelyik megváltozik, az eszköz már nem az az eszköz, amire a licencet
 * megadták — és a vágóértékek sem érvényesek rá.
 *
 * A `label` és a `documentation` nincs benne: a mi leíró szövegünk javítható
 * anélkül, hogy a licenc érvényét vesztené. A tételSZÖVEG maga sincs benne —
 * azt nem is tároljuk, amíg nincs licenc.
 */
export function lenyeg(i: Instrument): string {
  const tetelek = i.items
    .map((q) => `${q.index}:${q.id}:${q.options.map((o) => o.score).sort((a, b) => a - b).join("/")}:${q.variable}`)
    .sort().join(",");
  const savok = Object.entries(i.bands)
    .map(([k, v]) => `${k}[${v.map((b) => `${b.min ?? "-inf"}..${b.max ?? "+inf"}:${b.severity}`).join(";")}]`)
    .sort().join(",");
  const krit = i.criticalItem ? `${i.criticalItem.id}>=${i.criticalItem.minScore}` : "";
  return `${i.id}|${i.abbrev}|${tetelek}|${savok}|${krit}|${i.translation.status}`;
}

export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);
}

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

/** Megszerzett licenc — jogosulttal, hatókörrel és LEJÁRATTAL. */
export interface LicencBejegyzes {
  inst: string;
  /** Kitől: a jogtulajdonos vagy a forgalmazó. */
  jogosult: string;
  /** A licenc azonosítója vagy a szerződés hivatkozása. */
  azonosito: string;
  /** Mire terjed ki: intézmény, kutatás, betegszám, nyelv. */
  hatokor: string;
  /** Mikortól. ISO dátum. */
  kelt: string;
  /** Meddig. `null` = határozatlan idejű. */
  lejar: string | null;
  ki: string;
  szerep: string;
  /** Az eszköz magjának lenyomata a licenc megszerzésekor. */
  lenyomat: string;
  megjegyzes?: string;
}

/**
 * A MÁSIK KIMENET: leírt döntés, hogy NEM HASZNÁLJUK.
 *
 * Ez nem kudarc, hanem érvényes válasz — és a lépés kifejezetten ezt is
 * elfogadja. Enélkül a licenceletlen eszköz örökre nyitott tétel maradna:
 * senki nem szerzi meg a licencet, és senki nem mondja ki, hogy nem is kell.
 */
export interface NemHasznaljuk {
  inst: string;
  hatarozat: "nem-hasznaljuk";
  /** Miért nem — és mi lép a helyébe, ha lép valami. */
  indoklas: string;
  /** Amit helyette használunk, ha van ilyen. */
  helyette?: string | null;
  ki: string;
  szerep: string;
  mikor: string;
}

export interface LicencKatalogus {
  szerepek: Record<string, string>;
  licencek: LicencBejegyzes[];
  dontesek: NemHasznaljuk[];
}

export function loadLicencek(path: string): LicencKatalogus {
  return JSON.parse(readFileSync(path, "utf8")) as LicencKatalogus;
}

/* ── AZ ÁLLAPOT ──────────────────────────────────────────────────────── */

export type LicencAllapot =
  /** Szabadon használható szöveg — nincs mit licencelni. */
  | "kozkincs"
  /** Érvényes licenc a MOSTANI magra. */
  | "licencelt"
  /** Volt licenc, de LEJÁRT. */
  | "lejart"
  /** Van licenc, de az eszköz azóta megváltozott. */
  | "elavult"
  /** Leírt döntés: nem használjuk. */
  | "nem-hasznaljuk"
  /** `itemText: "loaded"`, DE nincs mögötte nyilvántartott licenc. */
  | "igazolatlan"
  /** Nincs licenc és nincs döntés — nyitott tétel. */
  | "rendezetlen";

export interface EszkozAllapot {
  inst: string;
  abbrev: string;
  allapot: LicencAllapot;
  /** Rendezett-e a 12. lépés értelmében: licenc VAGY leírt döntés. */
  rendezett: boolean;
  /** Felvehető-e ma. */
  felveheto: boolean;
  lenyomat: string;
  lejar: string | null;
  /** Hány nap múlva jár le. `null`, ha nem értelmezhető. */
  napMulva: number | null;
  forditas: Instrument["translation"]["status"];
  miert: string;
}

/** A megújítás hónapokat vihet — ennyivel előbb szólunk. */
export const ELOJELZES_NAP = 90;

const napok = (a: string, b: string): number =>
  Math.floor((Date.parse(a) - Date.parse(b)) / 86400000);

export function eszkozAllapot(
  i: Instrument, kat: LicencKatalogus, ma: string,
): EszkozAllapot {
  const mag = lenyomat(lenyeg(i));
  const lic = kat.licencek.find((x) => x.inst === i.id);
  const dontes = kat.dontesek.find((x) => x.inst === i.id);
  const kozos = {
    inst: i.id, abbrev: i.abbrev, lenyomat: mag,
    forditas: i.translation.status,
    lejar: lic?.lejar ?? null,
    napMulva: lic?.lejar ? napok(lic.lejar, ma) : null,
  };

  // A LEÍRT DÖNTÉS ELŐBB VAN, MINT A LICENC. Ha kimondtuk, hogy nem
  // használjuk, akkor a licenc kérdése nem áll fenn — és ha mindkettő ott
  // van, azt a validálás hibaként jelzi, nem itt döntjük el csendben.
  if (dontes) {
    return {
      ...kozos, allapot: "nem-hasznaljuk", rendezett: true, felveheto: false,
      miert:
        `LEÍRT DÖNTÉS: nem használjuk. ${dontes.indoklas} ` +
        (dontes.helyette ? `Helyette: ${dontes.helyette}. ` : "") +
        `(${dontes.ki}, ${dontes.mikor}.) Ez nem kudarc, hanem érvényes válasz: ` +
        `a lépés kifejezetten elfogadja.`,
    };
  }

  if (i.itemText.status === "notLicensed") {
    return {
      ...kozos, allapot: "rendezetlen", rendezett: false, felveheto: false,
      miert:
        `NINCS LICENC ÉS NINCS DÖNTÉS. A validált tételszöveg nem szerezhető ` +
        `meg magától: vagy megszerzi valaki, vagy le kell írni, hogy nem ` +
        `használjuk. A harmadik lehetőség — hogy nyitva marad — nem válasz.`,
    };
  }

  if (i.itemText.status === "public") {
    return {
      ...kozos, allapot: "kozkincs", rendezett: true,
      felveheto: true,
      miert:
        `SZABADON HASZNÁLHATÓ SZÖVEG: nincs mit licencelni.` +
        (i.translation.status !== "validated"
          ? ` A magyar fordítás viszont ${i.translation.status === "none" ? "hiányzik" : "NEM VALIDÁLT"} — ` +
            `az eszköz felvehető, de a vele gyűjtött adat publikálhatósága korlátozott.`
          : ""),
    };
  }

  // `itemText: "loaded"` — innentől a NYILVÁNTARTÁS dönt, nem a jelölés.
  if (!lic) {
    return {
      ...kozos, allapot: "igazolatlan", rendezett: false, felveheto: false,
      miert:
        `A JELÖLÉS SZERINT BETÖLTÖTT A LICENCELT SZÖVEG, DE NINCS MÖGÖTTE ` +
        `NYILVÁNTARTOTT LICENC. Nem derül ki, kitől, milyen hatókörrel és ` +
        `meddig — a kaput jelölés nem nyitja. Védett szöveg engedély nélküli ` +
        `használata nem formai hiba.`,
    };
  }
  if (lic.lenyomat !== mag) {
    return {
      ...kozos, allapot: "elavult", rendezett: false, felveheto: false,
      miert:
        `AZ ESZKÖZ MEGVÁLTOZOTT A LICENC ÓTA (licencelt: ${lic.lenyomat}, ` +
        `mostani: ${mag}). Egy megváltozott tételsorral vagy vágóértékkel ez ` +
        `már nem az az eszköz, amire a licencet megadták — és a validált ` +
        `vágóértékek sem érvényesek rá.`,
    };
  }
  if (lic.lejar && napok(lic.lejar, ma) < 0) {
    return {
      ...kozos, allapot: "lejart", rendezett: false, felveheto: false,
      miert:
        `A LICENC LEJÁRT (${lic.lejar}, ${-napok(lic.lejar, ma)} napja). A ` +
        `lejárat nem a mi hibánk, de attól a naptól a felvétel jogosulatlan. ` +
        `A már felvett adat érvényes marad; új felvétel nem indul.`,
    };
  }
  const kozel = lic.lejar && napok(lic.lejar, ma) <= ELOJELZES_NAP;
  return {
    ...kozos, allapot: "licencelt", rendezett: true, felveheto: true,
    miert:
      `Érvényes licenc: ${lic.jogosult} (${lic.azonosito}), hatókör: ${lic.hatokor}. ` +
      (lic.lejar
        ? kozel
          ? `LEJÁR ${lic.lejar}-kor, ${napok(lic.lejar, ma)} nap múlva — a ` +
            `megújítás hónapokat vihet, tehát ez MOST teendő.`
          : `Lejár: ${lic.lejar}.`
        : `Határozatlan idejű.`),
  };
}

/* ── A KAPU ──────────────────────────────────────────────────────────── */

export interface Felvehetoseg {
  ok: boolean;
  /** Megnevezett ok — hogy a hívó ne tévessze össze két különböző nemet. */
  allapot: LicencAllapot | "ismeretlen";
  miert: string;
}

/**
 * FELVEHETŐ-E AZ ESZKÖZ — a nyilvántartásból, nem a jelölésből.
 *
 * A visszatérési érték MEGNEVEZI az okot. Ez nem stílus: e nélkül az
 * „ismeretlen eszköz” és a „nincs licenc” ugyanúgy néz ki, és egy elrontott
 * hívás olyan tesztet tud átvinni, ami a kaput hivatott bizonyítani. Pontosan
 * ez történt a LATCH tesztjével: rossz argumentumsorrenddel hívta, a válasz
 * „ismeretlen mérőeszköz” volt, a teszt zöld — és ugyanígy zöld lett volna
 * akkor is, ha a kapu egyáltalán nincs ott.
 */
export function felvehetoseg(
  i: Instrument | undefined, kat: LicencKatalogus, ma: string,
): Felvehetoseg {
  if (!i) {
    return { ok: false, allapot: "ismeretlen",
      miert: "Ismeretlen mérőeszköz — ez hívási hiba, nem licenckérdés." };
  }
  const a = eszkozAllapot(i, kat, ma);
  return { ok: a.felveheto, allapot: a.allapot, miert: a.miert };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export function validateLicencek(
  eszkozok: Instrument[], kat: LicencKatalogus, ma: string,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = new Set(eszkozok.map((i) => i.id));
  const latottL = new Set<string>();
  const latottD = new Set<string>();

  for (const l of kat.licencek) {
    if (!ids.has(l.inst)) {
      out.push({ severity: "error", id: l.inst, message: "licenc nem létező mérőeszközre" });
      continue;
    }
    if (latottL.has(l.inst)) {
      out.push({ severity: "error", id: l.inst, message: "két licenc ugyanarra a mérőeszközre" });
    }
    latottL.add(l.inst);
    for (const [mezo, ertek] of [
      ["jogosult", l.jogosult], ["azonosito", l.azonosito],
      ["hatokor", l.hatokor], ["ki", l.ki],
    ] as const) {
      if (!ertek?.trim()) {
        out.push({ severity: "error", id: l.inst,
          message: `hiányzó \`${mezo}\` a licencben — a licenc akkor licenc, ha megnevezi, kitől és mire szól` });
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(l.kelt ?? "")) {
      out.push({ severity: "error", id: l.inst, message: "hiányzó vagy hibás `kelt` dátum" });
    }
    if (l.lejar !== null && !/^\d{4}-\d{2}-\d{2}$/.test(l.lejar ?? "")) {
      out.push({ severity: "error", id: l.inst,
        message: "hibás `lejar` dátum — határozatlan idejű licencnél írj `null`-t, ne üres szöveget" });
    }
  }

  for (const d of kat.dontesek) {
    if (!ids.has(d.inst)) {
      out.push({ severity: "error", id: d.inst, message: "döntés nem létező mérőeszközre" });
      continue;
    }
    if (latottD.has(d.inst)) {
      out.push({ severity: "error", id: d.inst, message: "két döntés ugyanarra a mérőeszközre" });
    }
    latottD.add(d.inst);
    if (latottL.has(d.inst)) {
      out.push({ severity: "error", id: d.inst,
        message:
          "ugyanarra az eszközre licenc ÉS „nem használjuk” döntés is van — " +
          "a kettő kizárja egymást, és nem a gép dolga választani közülük" });
    }
    // A DÖNTÉS INDOKLÁS NÉLKÜL nem döntés: fél év múlva senki nem tudja,
    // miért nem használjuk, és valaki elkezdi újra megszerezni a licencet.
    if (!d.indoklas?.trim()) {
      out.push({ severity: "error", id: d.inst,
        message: "„nem használjuk” döntés INDOKLÁS nélkül — fél év múlva valaki újrakezdi" });
    }
    if (!d.ki?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(d.mikor ?? "")) {
      out.push({ severity: "error", id: d.inst, message: "névtelen vagy dátumtalan döntés" });
    }
  }

  for (const i of eszkozok) {
    const a = eszkozAllapot(i, kat, ma);
    if (a.allapot === "igazolatlan") {
      out.push({ severity: "error", id: i.id, message: a.miert });
    }
    if (a.allapot === "elavult" || a.allapot === "lejart") {
      out.push({ severity: "error", id: i.id, message: a.miert });
    }
    if (a.allapot === "licencelt" && a.napMulva !== null && a.napMulva <= ELOJELZES_NAP) {
      out.push({ severity: "warning", id: i.id,
        message:
          `a licenc ${a.napMulva} nap múlva lejár (${a.lejar}) — a megújítás ` +
          `hónapokat vihet, tehát ez MOST teendő, nem a lejárat hetében` });
    }
    if (a.allapot === "rendezetlen") {
      out.push({ severity: "warning", id: i.id, message: a.miert });
    }
    // A VALIDÁLT SZÖVEG ÉS A VALIDÁLT FORDÍTÁS KÉT KÜLÖN DOLOG.
    if (a.felveheto && i.translation.status !== "validated") {
      out.push({ severity: "warning", id: i.id,
        message:
          `felvehető, de a magyar fordítás ` +
          `${i.translation.status === "none" ? "hiányzik" : "NEM VALIDÁLT"} — a ` +
          `vele gyűjtött adat publikálhatósága korlátozott, és ezt az ETT-beadvány ` +
          `is állítja` });
    }
  }
  return out;
}

/** A 12. lépés haladásmérője: rendezett = licencelt VAGY leírt döntés. */
export interface LicencMerleg {
  osszes: number;
  rendezett: number;
  licencelt: number;
  kozkincs: number;
  nemHasznaljuk: number;
  rendezetlen: number;
  felveheto: number;
  lejarKozel: number;
  validaltForditas: number;
}

export function merleg(
  eszkozok: Instrument[], kat: LicencKatalogus, ma: string,
): LicencMerleg {
  const a = eszkozok.map((i) => eszkozAllapot(i, kat, ma));
  const db = (x: LicencAllapot) => a.filter((y) => y.allapot === x).length;
  return {
    osszes: a.length,
    rendezett: a.filter((x) => x.rendezett).length,
    licencelt: db("licencelt"),
    kozkincs: db("kozkincs"),
    nemHasznaljuk: db("nem-hasznaljuk"),
    rendezetlen: db("rendezetlen") + db("igazolatlan") + db("lejart") + db("elavult"),
    felveheto: a.filter((x) => x.felveheto).length,
    lejarKozel: a.filter((x) =>
      x.allapot === "licencelt" && x.napMulva !== null && x.napMulva <= ELOJELZES_NAP).length,
    validaltForditas: eszkozok.filter((i) => i.translation.status === "validated").length,
  };
}
