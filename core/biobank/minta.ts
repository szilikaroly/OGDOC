/**
 * BIOBANK — MINTAAZONOSÍTÁS VONALKÓDDAL, ÉS AZ ISBER-GYAKORLAT.
 *
 * A MINTA AZONOSÍTÓJA NEM CÍMKE, HANEM A MINTA MAGA.
 *
 * Egy rosszul azonosított minta nem „adminisztratív hiba”: a rajta végzett
 * minden mérés egy MÁSIK EMBER adata lesz, és ezt utólag semmi nem javítja.
 * A biobankban ezért az azonosító nem a nyilvántartás kényelme, hanem az
 * egyetlen kapocs a cső és a személy között.
 *
 * NÉGY DOLOG, AMIT A VONALKÓDNAK TUDNIA KELL — ÉS AMIT A LEGTÖBB RENDSZER
 * ELRONT:
 *
 *   1. ELLENŐRZŐ JEGY. Egy leolvasási vagy gépelési hiba enélkül egy MÁSIK
 *      LÉTEZŐ minta azonosítóját adja — és az csendben elfogadódik. Az
 *      ellenőrző jegy nem luxus: ez a különbség a „hibás leolvasás” és a
 *      „másik beteg mintája” között.
 *
 *   2. NE LEGYEN BENNE BETEGADAT. A csövön a TAJ, a név vagy a születési
 *      dátum nem álnevesítés — a fagyasztóban álló cső bárki számára
 *      olvasható, aki belép. Az azonosító VÉLETLEN, és a kódkulcs máshol van.
 *
 *   3. KRIOGÉN TŰRÉS. −80 °C-on és folyékony nitrogénben a papírcímke leválik,
 *      a tinta elfolyik, a lineáris vonalkód olvashatatlanná válik. A 2D
 *      DataMatrix részlegesen sérülve is olvasható (Reed–Solomon
 *      hibajavítás), és kisebb felületen több adatot hordoz.
 *
 *   4. AZ ALIKVOT NEM UGYANAZ A MINTA. Egy vérvételből tíz cső lesz; ha
 *      mindegyik ugyanazt az azonosítót viseli, a felhasználás nem
 *      követhető. Az alikvot SAJÁT azonosítót kap, ami a szülőre mutat.
 *
 * AZ ISBER BEST PRACTICES A HIVATKOZÁSI KERET, NEM A SZÖVEG.
 *
 * Az ISBER Best Practices for Repositories szerzői jogvédett kiadvány. A
 * rendszer a KÖVETELMÉNYEKRE hivatkozik szakaszszámmal, a szövegét nem
 * másolja — ugyanaz a szabály, mint a BELLA-standardoknál és a MEES-nél.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { RegistryIssue } from "../registry.ts";

/* ── AZ AZONOSÍTÓ ────────────────────────────────────────────────────── */

/**
 * AZ ÁBÉCÉ ÖSSZETÉVESZTHETŐ KARAKTEREKET NEM TARTALMAZ.
 *
 * A szabály párokra szól, nem karakterekre: egy összetéveszthető párból
 * LEGFELJEBB EGY marad bent. Ha mindkettő bent volna, a rossz nyomatról
 * leolvasott karakter egy MÁSIK ÉRVÉNYES azonosítót adna.
 *
 *   0 ↔ O   mindkettő kimarad — nyomtatásban és kézírásban is cserélhető
 *   1 ↔ I   mindkettő kimarad — ugyanez
 *   2 ↔ Z   mindkettő kimarad — kézírásban rendszeresen cserélik
 *   5 ↔ S   az `S` marad ki, az `5` BENT VAN
 *   8 ↔ B   mindkettő bent van
 *
 * Az utolsó két sor magyarázatot kíván, mert látszólag következetlen. A pár
 * akkor veszélyes, ha MINDKÉT tagja érvényes karakter: ilyenkor a téves
 * leolvasás egy másik létező azonosítót ad. Ha csak az egyik érvényes, a
 * téves leolvasás ALAKHIBÁRA fut, amit a rendszer azonnal elutasít — az `S`
 * beírása nem ad érvényes azonosítót. A `8`/`B` pár azért marad bent
 * mindkettő, mert az ellenőrző jegy az egy karakteres hibát mindig megfogja,
 * és a nyolc karakteres törzs rövidítése többe kerülne, mint amennyit nyerne.
 */
export const ABC = "3456789ABCDEFGHJKLMNPQRTUVWXY";

/** Az összetéveszthető párok, amelyekből egyik tag sem lehet az ábécében. */
export const TILTOTT_PAROK: Array<[string, string]> = [["0", "O"], ["1", "I"], ["2", "Z"]];

/** Az azonosító alakja: `OG-XXXXXXXX-C` — előtag, törzs, ellenőrző jegy. */
export const ELOTAG = "OG";
export const TORZS_HOSSZ = 8;

/**
 * ELLENŐRZŐ JEGY — súlyozott moduló az ábécé hosszával.
 *
 * Az egy karakteres hibát MINDIG megfogja, a szomszédos csere miatti hibát a
 * súlyozás fogja meg: enélkül az `AB` és a `BA` ugyanazt a jegyet adná, és a
 * két különböző minta megkülönböztethetetlen volna.
 */
export function ellenorzoJegy(torzs: string): string {
  let osszeg = 0;
  for (let i = 0; i < torzs.length; i++) {
    const ertek = ABC.indexOf(torzs[i]);
    if (ertek < 0) throw new Error(`Érvénytelen karakter az azonosítóban: ${torzs[i]}`);
    osszeg += ertek * (i + 2);
  }
  return ABC[osszeg % ABC.length];
}

export function azonositoKepzes(torzs: string): string {
  return `${ELOTAG}-${torzs}-${ellenorzoJegy(torzs)}`;
}

export type AzonositoAllapot =
  | "ervenyes"
  /** Az alak rossz: nem is olvasható azonosítóként. */
  | "alakHibas"
  /** Az alak jó, az ellenőrző jegy nem — LEOLVASÁSI vagy GÉPELÉSI hiba. */
  | "ellenorzoJegyHibas";

export interface AzonositoItelet {
  allapot: AzonositoAllapot;
  torzs: string | null;
  miert: string;
}

const ALAK = new RegExp(`^${ELOTAG}-([${ABC}]{${TORZS_HOSSZ}})-([${ABC}])$`);

export function azonositoEllenoriz(a: string): AzonositoItelet {
  const m = ALAK.exec(a.trim().toUpperCase());
  if (!m) {
    return { allapot: "alakHibas", torzs: null,
      miert:
        `A(z) „${a}” nem érvényes mintaazonosító. Alak: ${ELOTAG}-` +
        `${"X".repeat(TORZS_HOSSZ)}-C, és az ábécéből kimaradnak az ` +
        `összetéveszthető karakterek (0, O, 1, I, 2, Z, S).` };
  }
  const [, torzs, jegy] = m;
  if (ellenorzoJegy(torzs) !== jegy) {
    return { allapot: "ellenorzoJegyHibas", torzs: null,
      miert:
        `A(z) „${a}” ellenőrző jegye nem stimmel. EZ NEM FORMASÁG: ellenőrző ` +
        `jegy nélkül egy leolvasási vagy gépelési hiba egy MÁSIK LÉTEZŐ minta ` +
        `azonosítóját adná, és az csendben elfogadódna — a rajta végzett minden ` +
        `mérés egy másik ember adata lenne.` };
  }
  return { allapot: "ervenyes", torzs, miert: `Érvényes mintaazonosító.` };
}

/**
 * Az azonosító NEM tartalmazhat betegadatot — ezt ellenőrizzük is.
 *
 * A cső a fagyasztóban bárki számára olvasható, aki belép. A rajta lévő TAJ
 * vagy születési dátum nem álnevesítés, hanem közzététel.
 */
export function betegadatGyanu(a: string): string | null {
  const t = a.replace(/[^0-9]/g, "");
  if (/^\d{9}$/.test(t)) {
    return `Az azonosító kilenc számjegyet tartalmaz — ez TAJ-szám lehet. A csövön ` +
           `álló betegazonosító nem álnevesítés, hanem közzététel: a fagyasztóban ` +
           `álló cső bárki számára olvasható, aki belép.`;
  }
  if (/(19|20)\d{2}[.\-/](0[1-9]|1[0-2])[.\-/](0[1-9]|[12]\d|3[01])/.test(a)) {
    return `Az azonosító dátumot tartalmaz — születési dátum lehet.`;
  }
  return null;
}

/* ── A MINTA ÉS AZ ALIKVOT ───────────────────────────────────────────── */

export interface Minta {
  azonosito: string;
  /** Ha alikvot: melyik minta része. `null` az elsődleges mintánál. */
  szuloje: string | null;
  fajta: string;
  /** A vétel ideje — nem a rögzítésé. */
  vetel: string;
  /** Hány °C-on tárolják. */
  taroloHomerseklet: number;
  /** A donor ÁLNEVESÍTETT azonosítója. A kódkulcs máshol van. */
  donorKod: string;
}

export type MintaAllapot =
  | "rendben"
  | "azonositoHibas"
  | "betegadatAzonositoban"
  /** Az alikvot szülője ismeretlen — a lánc megszakadt. */
  | "arvaAlikvot"
  /** Kör a szülőláncban. */
  | "korAlancban";

export interface MintaItelet {
  allapot: MintaAllapot;
  /** Az alikvotlánc a gyökérig. */
  lanc: string[];
  miert: string;
}

export function mintaEllenoriz(mind: Minta[], azonosito: string): MintaItelet {
  const map = new Map(mind.map((m) => [m.azonosito, m]));
  const m = map.get(azonosito);
  if (!m) {
    return { allapot: "azonositoHibas", lanc: [],
      miert: `Nincs ilyen minta: ${azonosito}.` };
  }
  const a = azonositoEllenoriz(m.azonosito);
  if (a.allapot !== "ervenyes") {
    return { allapot: "azonositoHibas", lanc: [], miert: a.miert };
  }
  const gy = betegadatGyanu(m.azonosito);
  if (gy) return { allapot: "betegadatAzonositoban", lanc: [], miert: gy };

  const lanc: string[] = [m.azonosito];
  let cur = m;
  const latott = new Set([m.azonosito]);
  while (cur.szuloje) {
    if (latott.has(cur.szuloje)) {
      return { allapot: "korAlancban", lanc,
        miert: `Kör az alikvotláncban: ${[...lanc, cur.szuloje].join(" → ")}.` };
    }
    const sz = map.get(cur.szuloje);
    if (!sz) {
      return { allapot: "arvaAlikvot", lanc,
        miert:
          `A(z) ${cur.azonosito} alikvot szülője (${cur.szuloje}) NEM LÉTEZIK. ` +
          `Az alikvot önmagában nem minta: enélkül nem tudni, kitől származik, ` +
          `és a rajta végzett mérés nem köthető donorhoz.` };
    }
    latott.add(sz.azonosito);
    lanc.push(sz.azonosito);
    cur = sz;
  }
  return { allapot: "rendben", lanc,
    miert: lanc.length > 1
      ? `Alikvot, ${lanc.length - 1} szinttel a gyökér (${lanc[lanc.length - 1]}) alatt.`
      : `Elsődleges minta.` };
}

/* ── ISBER ───────────────────────────────────────────────────────────── */

export interface IsberTetel {
  id: string;
  /** ISBER Best Practices szakaszszám — a SZÖVEG nem másolható. */
  szakasz: string;
  cim: string;
  /** A saját megfogalmazásunk arról, mit követel. NEM idézet. */
  kovetelmeny: string;
  allapot: "fedett" | "reszben" | "nincs";
  /** Mi bizonyítja — kódra vagy dokumentumra mutatva. */
  bizonyitek: string[];
  hianyzik: string[];
}

export interface IsberKeszlet {
  megnevezes: string;
  modul: number;
  forras: string;
  hivatkozas: string;
  licencNote: string;
  note: string;
  tetelek: IsberTetel[];
}

export function loadIsber(path: string): IsberKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as IsberKeszlet;
}

export interface IsberMerleg {
  osszes: number; fedett: number; reszben: number; nincs: number;
}

export function isberMerleg(k: IsberKeszlet): IsberMerleg {
  const db = (a: IsberTetel["allapot"]) => k.tetelek.filter((t) => t.allapot === a).length;
  return { osszes: k.tetelek.length, fedett: db("fedett"),
    reszben: db("reszben"), nincs: db("nincs") };
}

export function validateIsber(k: IsberKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const t of k.tetelek) {
    if (t.allapot === "fedett" && !t.bizonyitek.length) {
      out.push({ severity: "error", id: t.id,
        message:
          `A(z) „${t.cim}” tétel FEDETT állapotban van, de nincs bizonyíték ` +
          `mögötte. A bizonyíték nélküli „megvan” állítás — és egy akkreditációs ` +
          `auditon az állítás nem elég.` });
    }
    if (t.allapot !== "fedett" && !t.hianyzik.length) {
      out.push({ severity: "error", id: t.id,
        message: `A(z) „${t.cim}” nem fedett, de nincs megnevezve, mi hiányzik.` });
    }
    // A SZÖVEG NEM MÁSOLHATÓ. Egy hosszú „követelmény” mező könnyen az eredeti
    // szövegének átvétele — a hossz maga a jelzés.
    if (t.kovetelmeny.length > 400) {
      out.push({ severity: "warning", id: t.id,
        message:
          `A(z) „${t.cim}” követelményleírása ${t.kovetelmeny.length} karakter. ` +
          `Az ISBER Best Practices szerzői jogvédett: a rendszer a ` +
          `KÖVETELMÉNYRE hivatkozik szakaszszámmal, a szövegét nem másolja. Egy ` +
          `hosszú leírás könnyen átvétel — ellenőrizd, hogy saját megfogalmazás.` });
    }
  }
  return out;
}

/** A vonalkód tartalma — a nyomtatandó adat, betegadat NÉLKÜL. */
export function vonalkodTartalom(m: Minta): string {
  const gy = betegadatGyanu(m.azonosito);
  if (gy) throw new Error(gy);
  // GS1 alkalmazásazonosítók: (90) belső használat. A tartalom SZÁNDÉKOSAN
  // csak az azonosító: minden más adat a nyilvántartásban van, nem a csövön.
  return `(90)${m.azonosito}`;
}

/** A minta lenyomata — a nyilvántartás és a cső összevetéséhez. */
export function mintaLenyomat(m: Minta): string {
  return createHash("sha256")
    .update([m.azonosito, m.szuloje ?? "", m.fajta, m.vetel, m.donorKod].join("|"))
    .digest("hex").slice(0, 16);
}
