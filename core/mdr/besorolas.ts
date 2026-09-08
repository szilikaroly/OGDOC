/**
 * MDR — a besorolás, amit nem lehet megúszni.
 *
 * Ez a réteg NEM dönti el, hogy az OGDOC orvostechnikai eszköz-e. Nem is
 * teheti: a besorolás szabályozási kérdés, és a gyártó mondja ki, aláírással.
 * Amit a gép el tud végezni, az pontosan két dolog — ugyanaz a kettő, mint az
 * ETT-dossziénál (11. lépés):
 *
 *   1. MEGAKADÁLYOZNI, HOGY A RENDSZER OLYAT ÁLLÍTSON, AMI NEM IGAZ. Amíg a
 *      besorolás nincs kimondva, egyetlen réteg sem viselkedhet úgy, mintha
 *      eldőlt volna — sem „eszköz”, sem „nem eszköz” irányba.
 *   2. MEGMONDANI, MI HIÁNYZIK. Nyolc besorolási kérdés és tizennégy műszaki
 *      dokumentációs tétel — a lista karbantartása gépi munka, a kitöltése nem.
 *
 * AMIÉRT EZ MOST KERÜLT ELŐ. A 28. modul AI-almodulja (CTG/NST- és
 * kolposzkópia-értelmezés) az a pont, ahol a „nem vagyunk eszköz” besorolás
 * megkérdőjeleződik. Egy algoritmus, ami CTG-t értelmez klinikai döntés
 * céljából, a 11. szabály alá esik — és a kérdést a fejlesztés ELŐTT kell
 * eldönteni, nem utána.
 *
 * A KAPU IRÁNYA. Amíg a besorolás nincs kimondva, az AI-almodul zárva marad. Ez
 * a biztonságos irány: egy le nem szállított funkció bosszantó, egy engedély
 * nélkül szállított eszköz jogsértés.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export interface BesorolasiKerdes { id: string; kerdes: string; miert: string; }
export interface DokTetel { id: string; tetel: string; mellklet: string; }

export type DokAllapot = "nincs" | "keszul" | "kesz";

export interface MdrKeszlet {
  megnevezes: string;
  note: string;
  besorolasiKerdesek: BesorolasiKerdes[];
  muszakiDokumentacio: DokTetel[];
  /** A kimondott osztály: `null` = még nincs eldöntve. */
  besorolas: string | null;
  gyarto: string | null;
  cikk5_5_mentesseg: boolean | null;
  valaszok: Record<string, { valasz: boolean | null; indok?: string }>;
  dokumentacioAllapot: Record<string, DokAllapot>;
}

export function loadMdr(path: string): MdrKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as MdrKeszlet;
}

/* ── A BESOROLÁS ÁLLAPOTA ────────────────────────────────────────────── */

export type BesorolasAllapot =
  /** Kimondva, gyártóval együtt. */
  | "kimondva"
  /** Egyetlen kérdés sincs megválaszolva. */
  | "erintetlen"
  /** Válaszok vannak, de a besorolás nincs kimondva. */
  | "folyamatban"
  /** A besorolás ki van mondva, de nincs gyártó megnevezve. */
  | "gyartoNelkul";

export interface BesorolasAllas {
  allapot: BesorolasAllapot;
  /** Eldőlt-e — ettől függ, megnyílhat-e egyáltalán az AI-almodul. */
  eldolt: boolean;
  megvalaszolt: number;
  osszes: number;
  megvalaszolatlan: string[];
  miert: string;
}

export function besorolasAllas(m: MdrKeszlet): BesorolasAllas {
  const osszes = m.besorolasiKerdesek.length;
  const megvalaszolatlan = m.besorolasiKerdesek
    .filter((q) => m.valaszok[q.id]?.valasz === undefined || m.valaszok[q.id]?.valasz === null)
    .map((q) => q.id);
  const megvalaszolt = osszes - megvalaszolatlan.length;

  if (m.besorolas && m.gyarto) {
    return { allapot: "kimondva", eldolt: true, megvalaszolt, osszes, megvalaszolatlan,
      miert: `Besorolás: ${m.besorolas} (gyártó: ${m.gyarto}).` };
  }
  if (m.besorolas && !m.gyarto) {
    return { allapot: "gyartoNelkul", eldolt: false, megvalaszolt, osszes, megvalaszolatlan,
      miert:
        `A besorolás ki van mondva (${m.besorolas}), de nincs megnevezve a GYÁRTÓ. ` +
        `Az intézményen belül gyártott eszköznél az 5. cikk (5) mentessége szóba ` +
        `jöhet — de csak akkor, ha nincs egyenértékű CE-jelölt eszköz a piacon, és ` +
        `ha az eszköz nem kerül az intézményen kívülre. Ez nem formaság: a gyártó ` +
        `személye dönti el, mely kötelezettségek kire hárulnak.` };
  }
  if (megvalaszolt === 0) {
    return { allapot: "erintetlen", eldolt: false, megvalaszolt, osszes, megvalaszolatlan,
      miert:
        `A ${osszes} besorolási kérdésből egy sincs megválaszolva. Amíg a besorolás ` +
        `nincs kimondva, a rendszer egyetlen rétege sem viselkedhet úgy, mintha ` +
        `eldőlt volna — sem „eszköz”, sem „nem eszköz” irányba.` };
  }
  return { allapot: "folyamatban", eldolt: false, megvalaszolt, osszes, megvalaszolatlan,
    miert:
      `${megvalaszolt}/${osszes} kérdés megválaszolva, a besorolás viszont nincs ` +
      `kimondva. Hiányzik: ${megvalaszolatlan.join(", ")}.` };
}

/**
 * MEGNYÍLHAT-E AZ AI-ALMODUL.
 *
 * Fail-closed, és az irány szándékos: egy le nem szállított funkció bosszantó,
 * egy engedély nélkül szállított eszköz jogsértés.
 */
export function aiAlmodulNyithato(m: MdrKeszlet): { nyithato: boolean; miert: string } {
  const b = besorolasAllas(m);
  if (!b.eldolt) {
    return { nyithato: false,
      miert: `Az AI-almodul ZÁRVA: ${b.miert}` };
  }
  const hianyzo = m.muszakiDokumentacio.filter((t) => (m.dokumentacioAllapot[t.id] ?? "nincs") !== "kesz");
  if (hianyzo.length) {
    return { nyithato: false,
      miert:
        `A besorolás kimondva (${m.besorolas}), de a műszaki dokumentációból ` +
        `${hianyzo.length}/${m.muszakiDokumentacio.length} tétel hiányzik ` +
        `(${hianyzo.slice(0, 3).map((t) => t.id).join(", ")}${hianyzo.length > 3 ? ", …" : ""}).` };
  }
  return { nyithato: true,
    miert: `Besorolás és műszaki dokumentáció megvan (${m.besorolas}).` };
}

/* ── VALIDÁLÁS ÉS MÉRLEG ─────────────────────────────────────────────── */

export function validateMdr(m: MdrKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ismert = new Set(m.besorolasiKerdesek.map((q) => q.id));
  for (const k of Object.keys(m.valaszok)) {
    if (!ismert.has(k)) {
      out.push({ severity: "error", id: `mdr.${k}`,
        message: `Válasz ismeretlen besorolási kérdésre: „${k}”.` });
    }
  }
  const dokIsmert = new Set(m.muszakiDokumentacio.map((t) => t.id));
  for (const k of Object.keys(m.dokumentacioAllapot)) {
    if (!dokIsmert.has(k)) {
      out.push({ severity: "error", id: `mdr.dok.${k}`,
        message: `Állapot ismeretlen dokumentációs tételre: „${k}”.` });
    }
  }
  const b = besorolasAllas(m);
  if (!b.eldolt) {
    out.push({ severity: "warning", id: "mdr.besorolas", message: b.miert });
  }
  // A 11. SZABÁLY BELÉPŐJE. Ha kimondtuk, hogy diagnosztikai vagy terápiás
  // információt szolgáltatunk, akkor a „nem eszköz” besorolás magyarázatot kíván.
  const q3 = m.valaszok["mdr.q3"]?.valasz;
  if (q3 === true && m.besorolas && /nem eszk/i.test(m.besorolas)) {
    out.push({ severity: "error", id: "mdr.q3.ellentmondas",
      message:
        `Ellentmondás: a rendszer állítja, hogy diagnózist vagy terápiát megalapozó ` +
        `információt szolgáltat (mdr.q3), a besorolás mégis „${m.besorolas}”. A 11. ` +
        `szabály szerint ez legalább IIa. Az ellentmondást fel kell oldani.` });
  }
  return out;
}

export interface MdrMerleg {
  kerdes: number;
  megvalaszolt: number;
  dokTetel: number;
  dokKesz: number;
  eldolt: boolean;
  aiNyithato: boolean;
}

export function merleg(m: MdrKeszlet): MdrMerleg {
  const b = besorolasAllas(m);
  return {
    kerdes: b.osszes, megvalaszolt: b.megvalaszolt,
    dokTetel: m.muszakiDokumentacio.length,
    dokKesz: m.muszakiDokumentacio.filter((t) => m.dokumentacioAllapot[t.id] === "kesz").length,
    eldolt: b.eldolt,
    aiNyithato: aiAlmodulNyithato(m).nyithato,
  };
}
