/**
 * A MEGŐRZÉSI IDŐK — a 10. lépés gépi fele.
 *
 * A 14 dokumentumtípus mellett ott áll a megőrzési idő (`P50Y`, `P30Y`,
 * `P10Y`), a horgony, amihez képest számoljuk (`recordClose`), és a
 * jogszabályhely, amiből ered. A rendszer eddig ezt az adatot KIÍRTA, de
 * SOHA NEM SZÁMOLTA KI.
 *
 * AMI KIDERÜLT. A `period` sehol a kódban nem lett dátummá; a `from` mező —
 * hogy mihez képest számoljuk — a saját típusdeklarációján kívül EGYETLEN
 * sorban sem szerepelt. A `deletable()` a nyers karakterláncot adta vissza,
 * a törlési motorban pedig a megőrzési idő leteltét egy KÉZZEL BEÍRT DÁTUM
 * igazolta (`megorzesLejart`), amit semmi nem vetett össze a dokumentum saját
 * idejével. Aki 2020-01-01-et ír be egy múlt heti esethez, átjut a kapun.
 *
 * Ma ezt elfedi, hogy egyetlen típus sem `primary`, tehát semmi nem törölhető.
 * De épp ez a lépés célja: hogy mind a 14 `primary` legyen. Abban a
 * pillanatban a maszk lehullik, és a visszafordíthatatlan megsemmisítés
 * egyetlen kapuja egy begépelt dátum lesz.
 *
 * AMIT EZ A RÉTEG CSINÁL:
 *
 *   1. KISZÁMOLJA a lejáratot a horgonyból és az időtartamból — és ha a
 *      horgony hiányzik, NEM „most”-ot mond, hanem megnevezi a hiányt.
 *   2. ÖSSZEVETI a begépelt igazolást a kiszámolttal. Ami nem igazolható, az
 *      nem igazolt.
 *   3. ALÁÍRÁSHOZ KÖTI a `primary` szintet — ugyanaz a kapu, mint a
 *      laborreferenciáknál, a normogramoknál, a kalkulátoroknál és a
 *      szepszisküszöböknél. Itt a tét a legnagyobb: a törlés nem javítható ki.
 *   4. MEGNEVEZI, ahol a jogszabályhely MÁS horgonyt mond, mint a `from` mező.
 *
 * AMI NEM EZÉ A RÉTEGÉ. Hogy a 30 év honnan számolandó. Az jogi kérdés, és a
 * hatályos jogszabályszöveget a hálózati szabályzat blokkolja. A gép annyit
 * tesz, hogy a kérdést pontosan felteszi, és nem enged törölni addig.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { RegistryIssue } from "../registry.ts";
import type { DocumentDef, Retention } from "./types.ts";
import type { DocumentRegistry } from "./registry.ts";

/* ── AZ IDŐTARTAM ────────────────────────────────────────────────────── */

export interface Idotartam {
  ev: number;
  honap: number;
  nap: number;
}

/**
 * ISO 8601 időtartam — CSAK amit teljesen ért.
 *
 * A néma nulla itt a legdrágább hiba: egy fel nem ismert alakra visszaadott
 * „0 év” azt jelentené, hogy a dokumentum AZONNAL törölhető. A függvény ezért
 * `null`-t ad, ha bármit nem ért, és a hívó ezt nem tudja véletlenül nullának
 * olvasni. A nulla hosszú időtartamot szintén elutasítja: a nulla megőrzési
 * idő nem megőrzési idő.
 */
export function parseIdotartam(s: string): Idotartam | null {
  const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/.exec(s ?? "");
  if (!m || (!m[1] && !m[2] && !m[3])) return null;
  const t = { ev: Number(m[1] ?? 0), honap: Number(m[2] ?? 0), nap: Number(m[3] ?? 0) };
  if (t.ev === 0 && t.honap === 0 && t.nap === 0) return null;
  return t;
}

/** Évek/hónapok/napok hozzáadása UTC-ben. Február 29. a hónap végére kerül. */
export function hozzaad(iso: string, t: Idotartam): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ev = d.getUTCFullYear() + t.ev;
  const honap = d.getUTCMonth() + t.honap;
  const cel = new Date(Date.UTC(ev, honap, 1,
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
  const utolso = new Date(Date.UTC(cel.getUTCFullYear(), cel.getUTCMonth() + 1, 0)).getUTCDate();
  cel.setUTCDate(Math.min(d.getUTCDate(), utolso));
  cel.setUTCDate(cel.getUTCDate() + t.nap);
  return cel.toISOString();
}

/* ── A HORGONY ───────────────────────────────────────────────────────── */

export type Horgony = Retention["from"];

/**
 * A HORGONYOK — az esetből ismert dátumok, amikhez képest az idő számolható.
 *
 * Mindegyik hiányozhat, és a hiányuk NEM ugyanaz. A `recordClose` a lezáratlan
 * esetnél még nincs meg; a `patientDeath` a legtöbb esetben soha nem lesz meg;
 * a `lastAccess` mozgó horgony, ami minden megnyitással kitolja a lejáratot.
 * A rendszer egyiket sem pótolja a mai dátummal.
 */
export interface Horgonyok {
  recordClose?: string | null;
  patientDeath?: string | null;
  lastAccess?: string | null;
  dataEntry?: string | null;
  creation?: string | null;
}

const HORGONY_NEV: Record<string, string> = {
  recordClose: "az eset lezárása",
  patientDeath: "a beteg halála",
  lastAccess: "az utolsó hozzáférés",
  dataEntry: "az adatfelvétel",
  creation: "a felvétel készítése",
};

export type LejaratAllapot =
  | "ok"
  | "hianyzoHorgony"
  | "ertelmezhetetlenIdotartam";

export interface Lejarat {
  allapot: LejaratAllapot;
  /** ISO időbélyeg, vagy `null`, ha nem számolható. */
  mikor: string | null;
  horgony: Horgony;
  miert: string;
}

/**
 * MIKOR JÁR LE — kiszámolva, nem begépelve.
 *
 * A hiányzó horgony nem „most”: ha nem tudjuk, mikortól számoljunk, akkor nem
 * tudjuk, mikor jár le, és ez a rendszer legtöbbet ismételt szabálya. A
 * különbség itt visszafordíthatatlan: a „most”-ként olvasott hiány azonnali
 * megsemmisítést jelentene.
 */
export function lejarat(r: Retention, h: Horgonyok): Lejarat {
  const t = parseIdotartam(r.period);
  if (!t) {
    return {
      allapot: "ertelmezhetetlenIdotartam", mikor: null, horgony: r.from,
      miert:
        `AZ IDŐTARTAM NEM ÉRTELMEZHETŐ (${r.period}). A rendszer nem tippel: a ` +
        `fel nem ismert alakra adott „0 év” azonnali megsemmisítést jelentene.`,
    };
  }
  const alap = h[r.from] ?? null;
  if (!alap) {
    return {
      allapot: "hianyzoHorgony", mikor: null, horgony: r.from,
      miert:
        `A HORGONY HIÁNYZIK: az időt ${HORGONY_NEV[r.from] ?? r.from} időpontjától ` +
        `kell számolni, és az nincs meg. A hiányzó horgony nem „most”: ha nem ` +
        `tudjuk, mikortól, akkor azt sem tudjuk, meddig.`,
    };
  }
  const mikor = hozzaad(alap, t);
  if (!mikor) {
    return { allapot: "hianyzoHorgony", mikor: null, horgony: r.from,
      miert: `A horgony dátuma nem értelmezhető: ${alap}` };
  }
  return {
    allapot: "ok", mikor, horgony: r.from,
    miert:
      `${r.period} ${HORGONY_NEV[r.from] ?? r.from} (${alap.slice(0, 10)}) ` +
      `időpontjától: ${mikor.slice(0, 10)}.`,
  };
}

/* ── A BEGÉPELT IGAZOLÁS ─────────────────────────────────────────────── */

export interface IgazolasEredmeny {
  rendben: boolean;
  /** A kiszámolt lejárat, ha van. */
  szamolt: string | null;
  miert: string;
}

/**
 * A DPO BEÍR EGY DÁTUMOT — ÉS A GÉP ÖSSZEVETI A SAJÁTJÁVAL.
 *
 * Eddig a törlési motor elhitte a begépelt dátumot: ha az a múltban volt, a
 * megőrzési kapu kinyílt. Semmi nem vetette össze a dokumentum saját
 * időtartamával és horgonyával, pedig mindkettő ott áll a regiszterben.
 *
 * Három kimenetel van, és a középső a fontos:
 *
 *   · a kiszámolt lejárat NEM ismert  → NEM IGAZOLHATÓ (tehát nem igazolt);
 *   · a kiszámolt lejárat KÉSŐBB van  → a begépelt dátum túl korai, blokkol;
 *   · a kiszámolt lejárat nem későbbi → rendben.
 */
export function igazolasEllenorzes(
  d: DocumentDef, allitott: string | null | undefined, h: Horgonyok,
): IgazolasEredmeny {
  const l = lejarat(d.retention, h);
  if (!allitott) {
    return { rendben: false, szamolt: l.mikor,
      miert: "Nincs megadva, mikorra jár le a megőrzési idő." };
  }
  if (Number.isNaN(Date.parse(allitott))) {
    return { rendben: false, szamolt: l.mikor,
      miert: `A megadott lejárat nem értelmezhető dátum: ${allitott}` };
  }
  if (l.allapot !== "ok" || !l.mikor) {
    return {
      rendben: false, szamolt: null,
      miert:
        `A BEGÉPELT LEJÁRAT NEM IGAZOLHATÓ a(z) ${d.id} adataiból: ${l.miert} ` +
        `Amit nem lehet ellenőrizni, azt a rendszer nem fogadja el igazolásnak — ` +
        `a törlés visszafordíthatatlan.`,
    };
  }
  if (Date.parse(l.mikor) > Date.parse(allitott)) {
    return {
      rendben: false, szamolt: l.mikor,
      miert:
        `A BEGÉPELT LEJÁRAT TÚL KORAI: ${allitott.slice(0, 10)} van megadva, a ` +
        `dokumentum saját adataiból viszont ${l.mikor.slice(0, 10)} jön ki ` +
        `(${d.retention.period}, ${HORGONY_NEV[d.retention.from]}). A különbség ` +
        `nem elírás kérdése: ennyivel korábban semmisülne meg a dokumentáció.`,
    };
  }
  return { rendben: true, szamolt: l.mikor,
    miert: `A megadott lejárat (${allitott.slice(0, 10)}) nem korábbi a ` +
           `kiszámoltnál (${l.mikor.slice(0, 10)}).` };
}

/* ── A JOGSZABÁLYHELY ÉS A HORGONY ELTÉRÉSE ──────────────────────────── */

const HORGONY_SZAVAK: Array<{ szo: RegExp; horgony: Horgony }> = [
  { szo: /adatfelvétel/i, horgony: "dataEntry" },
  { szo: /készítés/i, horgony: "creation" },
  { szo: /halál/i, horgony: "patientDeath" },
  { szo: /lezárás|elbocsátás/i, horgony: "recordClose" },
];

export interface HorgonyElteres {
  doc: string;
  from: Horgony;
  idezett: Horgony;
  /** Biztonságos irányba téved-e a mostani horgony. */
  hosszabb: boolean;
  miert: string;
}

/**
 * A JOGSZABÁLYHELY MÁS HORGONYT MOND, MINT A `from` MEZŐ.
 *
 * A 30 éves tételeknél az idézet így szól: „legalább 30 év AZ ADATFELVÉTELTŐL”,
 * a képalkotó felvételnél „10 év A KÉSZÍTÉSTŐL” — a rendszer viszont mind a
 * tizennégyet az ESET LEZÁRÁSÁTÓL számolja. Ez nem elírás és nem is feltétlenül
 * hiba: a lezárás sosem korábbi az adatfelvételnél, tehát a rendszer HOSSZABB
 * ideig őriz, mint amennyit a törvény kíván — ami a biztonságos irány.
 *
 * De KIMONDATLAN. És abban a pillanatban, hogy a rendszer valóban számolni
 * kezd, a jogi és a gépi lejárat két különböző dátum lesz — a jogásznak épp
 * ezt kell eldöntenie: elfogadható-e a lezárás mint óvatos közelítés, vagy a
 * horgonyt kell átállítani.
 */
export function horgonyElteresek(docs: DocumentDef[]): HorgonyElteres[] {
  const out: HorgonyElteres[] = [];
  for (const d of docs) {
    const r = d.retention;
    const talalt = HORGONY_SZAVAK.find((x) => x.szo.test(r.source ?? ""));
    if (!talalt || talalt.horgony === r.from) continue;
    // A lezárás sosem korábbi az adatfelvételnél és a készítésnél.
    const hosszabb = r.from === "recordClose" &&
      (talalt.horgony === "dataEntry" || talalt.horgony === "creation");
    out.push({
      doc: d.id, from: r.from, idezett: talalt.horgony, hosszabb,
      miert:
        `A JOGSZABÁLYHELY MÁS HORGONYT IDÉZ, MINT AMIT A RENDSZER SZÁMOL: az ` +
        `idézet szerint ${HORGONY_NEV[talalt.horgony]} időpontjától, a `+
        `beállítás szerint ${HORGONY_NEV[r.from]} időpontjától. ` +
        (hosszabb
          ? `A mostani horgony a BIZTONSÁGOS irányba téved (a lezárás sosem ` +
            `korábbi), tehát a rendszer hosszabb ideig őriz, mint kellene — de ` +
            `ez kimondatlan, és a két dátum a számolás pillanatában szétválik.`
          : `Az eltérés iránya NEM biztonságos: a rendszer korábban törölhetne, ` +
            `mint amit az idézett hely enged.`),
    });
  }
  return out;
}

/* ── A LENYOMAT ──────────────────────────────────────────────────────── */

/** A jogszabályhely: az idézet gondolatjel előtti fele. A leírás nem az. */
export function jogszabalyhely(source: string): string {
  return (source ?? "").split("—")[0].replace(/\s+/g, " ").trim();
}

/**
 * A MEGŐRZÉSI SZABÁLY NORMATÍV MAGJA: az időtartam, a horgony, a
 * jogszabályhely, és az, hogy meddig hosszabbítható meg.
 *
 * Nincs benne a `verifiedNote` és az idézet leíró fele — azok javíthatók az
 * aláírás elvesztése nélkül. Benne van viszont a `patientRequest`: ha valaki
 * kikapcsolja a törlés előtti értesítést, az normatív változás.
 */
export function lenyeg(d: DocumentDef): string {
  const r = d.retention;
  return [
    d.id, r.period, r.from, jogszabalyhely(r.source),
    (r.extendableFor ?? []).slice().sort().join("+"),
    `notice:${r.patientRequest?.noticeBeforeDeletion ?? false}`,
    `ext:${r.patientRequest?.extendable ?? false}`,
  ].join("|");
}

export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);
}

/* ── AZ ALÁÍRÁS ──────────────────────────────────────────────────────── */

export interface MegorzesHitelesites {
  doc: string;
  ki: string;
  szerep: string;
  mikor: string;
  lenyomat: string;
  /**
   * A HATÁLYOS jogszabályszöveg, amivel összevetették — kiadással és a
   * lekérdezés napjával. Egy „megnéztem a törvényt” önmagában nem aláírás:
   * a hatályosság dátumhoz kötött.
   */
  jogszabaly: string;
  /** A hatályosság napja, amire az összevetés vonatkozik. */
  hatalyos: string;
  megjegyzes?: string;
}

export interface MegorzesKatalogus {
  szerepek: Record<string, string>;
  hitelesitesek: MegorzesHitelesites[];
}

export function loadMegorzesHitelesitesek(path: string): MegorzesKatalogus {
  return JSON.parse(readFileSync(path, "utf8")) as MegorzesKatalogus;
}

export type MegorzesAllapot = "hitelesitve" | "alairatlan" | "elavult";

export interface DokAllapot {
  doc: string;
  label: string;
  allapot: MegorzesAllapot;
  lenyomat: string;
  alairo: string | null;
  hatalyos: string | null;
  miert: string | null;
}

export function megorzesAllapot(
  docs: DocumentDef[], kat: MegorzesKatalogus,
): DokAllapot[] {
  const byId = new Map(kat.hitelesitesek.map((h) => [h.doc, h]));
  return docs.map((d) => {
    const mag = lenyomat(lenyeg(d));
    const h = byId.get(d.id);
    const kozos = { doc: d.id, label: d.label?.hu ?? d.id, lenyomat: mag };
    if (!h) {
      return { ...kozos, allapot: "alairatlan" as const, alairo: null,
               hatalyos: null, miert: null };
    }
    if (h.lenyomat !== mag) {
      return {
        ...kozos, allapot: "elavult" as const, alairo: h.ki, hatalyos: h.hatalyos,
        miert:
          `a megőrzési szabály magja megváltozott az aláírás óta (aláírt: ` +
          `${h.lenyomat}, mostani: ${mag}) — az aláírás nem fedezi a mostani ` +
          `időtartamot vagy horgonyt`,
      };
    }
    return { ...kozos, allapot: "hitelesitve" as const, alairo: h.ki,
             hatalyos: h.hatalyos, miert: null };
  });
}

/** A hitelesítettek `verification` mezőjét állítja `primary`-ra — aláírásból. */
export function alkalmaz(docs: DocumentDef[], kat: MegorzesKatalogus): number {
  let n = 0;
  for (const a of megorzesAllapot(docs, kat)) {
    if (a.allapot !== "hitelesitve") continue;
    const d = docs.find((x) => x.id === a.doc);
    if (!d) continue;
    (d.retention as { verification: string }).verification = "primary";
    n++;
  }
  return n;
}

/* ── A PRÓBAFUTTATÁS ─────────────────────────────────────────────────── */

export interface TervTetel {
  doc: string;
  label: string;
  period: string;
  horgony: Horgony;
  lejarat: string | null;
  /** Eltelt-e már a megőrzési idő a megadott időpontban. */
  lejart: boolean;
  /** Törölhető-e MOST — a lejárat ÉS az aláírás együtt. */
  torolheto: boolean;
  miert: string;
}

export interface Terv {
  /** Szintetikus eset azonosítója — valódi eseten ez a terv nem fut. */
  eset: string;
  now: string;
  tetelek: TervTetel[];
  /** Ennyi tétel MENNE, ha a próbafuttatás éles lenne. */
  menne: number;
  /** A terv SOHA nem töröl. */
  szarazon: true;
  osszefoglalo: string;
}

/**
 * PRÓBAFUTTATÁS — a 10. lépés elfogadási kritériuma, szintetikus adaton.
 *
 * A terv SOHA nem töröl, és nem is tud: nincs olyan ága, ami írna. Ez nem
 * óvatosság, hanem a lépés értelme — az első automatikus törlés próbája nem
 * lehet maga az első automatikus törlés.
 *
 * A tétel akkor és csak akkor „menne”, ha a megőrzési idő a kiszámolt lejárat
 * szerint letelt ÉS a szabályt aláírták. A kettő közül bármelyik hiánya
 * blokkol, és a terv megnevezi, melyik.
 */
export function terv(
  docs: DocumentDef[], kat: MegorzesKatalogus,
  eset: string, h: Horgonyok, now: string,
): Terv {
  const allapotok = new Map(megorzesAllapot(docs, kat).map((a) => [a.doc, a]));
  const tetelek: TervTetel[] = docs.map((d) => {
    const l = lejarat(d.retention, h);
    const a = allapotok.get(d.id)!;
    const lejart = l.allapot === "ok" && Date.parse(l.mikor!) <= Date.parse(now);
    const alairt = a.allapot === "hitelesitve";
    const torolheto = lejart && alairt;
    const okok: string[] = [];
    if (!alairt) {
      okok.push(a.allapot === "elavult"
        ? `a megőrzési szabály aláírása ELAVULT (${a.miert})`
        : "a megőrzési idő nincs aláírva, tehát nem `primary`");
    }
    if (l.allapot !== "ok") okok.push(l.miert);
    else if (!lejart) okok.push(`a megőrzési idő ${l.mikor!.slice(0, 10)}-ig tart`);
    return {
      doc: d.id, label: d.label?.hu ?? d.id, period: d.retention.period,
      horgony: d.retention.from, lejarat: l.mikor, lejart, torolheto,
      miert: torolheto
        ? `A megőrzési idő ${l.mikor!.slice(0, 10)}-kor letelt, és a szabályt ` +
          `${a.alairo} aláírta.`
        : okok.join("; ") + ".",
    };
  });
  const menne = tetelek.filter((t) => t.torolheto).length;
  return {
    eset, now, tetelek, menne, szarazon: true,
    osszefoglalo:
      `PRÓBAFUTTATÁS (nem töröl semmit): ${menne}/${tetelek.length} ` +
      `dokumentumtípus menne törlésre ${now.slice(0, 10)} napon. ` +
      `${tetelek.filter((t) => t.lejart).length} lejárt, ` +
      `${tetelek.filter((t) => !t.lejart && t.lejarat).length} még tart, ` +
      `${tetelek.filter((t) => !t.lejarat).length} nem számolható.`,
  };
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

const JOGSZABALY = /\d{4}\.\s*évi|\d+\/\d{4}\.|§/;

export function validateMegorzes(
  docs: DocumentDef[], kat: MegorzesKatalogus,
): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  const ids = new Set(docs.map((d) => d.id));
  const latott = new Set<string>();

  for (const h of kat.hitelesitesek) {
    if (!ids.has(h.doc)) {
      out.push({ severity: "error", id: h.doc,
        message: "hitelesítés nem létező dokumentumtípusra" });
      continue;
    }
    if (latott.has(h.doc)) {
      out.push({ severity: "error", id: h.doc,
        message: "két hitelesítés ugyanarra a dokumentumtípusra" });
    }
    latott.add(h.doc);
    if (!h.ki?.trim()) {
      out.push({ severity: "error", id: h.doc, message: "névtelen megőrzés-hitelesítés" });
    }
    // A HATÁLYOSSÁG DÁTUMHOZ KÖTÖTT. Egy jogszabály tavalyi szövege nem a
    // hatályos szöveg, és a különbség épp a megőrzési időkben szokott lenni.
    if (!h.jogszabaly?.trim()) {
      out.push({ severity: "error", id: h.doc,
        message: "hiányzó `jogszabaly` — nem derül ki, MELYIK szöveggel vetették össze" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(h.hatalyos ?? "")) {
      out.push({ severity: "error", id: h.doc,
        message:
          "hiányzó vagy hibás `hatalyos` dátum. A hatályosság dátumhoz kötött: " +
          "egy jogszabály tavalyi szövege nem a hatályos szöveg" });
    }
  }

  for (const d of docs) {
    const r = d.retention;
    if (!parseIdotartam(r.period)) {
      out.push({ severity: "error", id: d.id,
        message: `értelmezhetetlen vagy nulla megőrzési idő: ${r.period}` });
    }
    if (!JOGSZABALY.test(r.source ?? "")) {
      out.push({ severity: "error", id: d.id,
        message:
          "a megőrzési idő forrása nem jogszabályhely, csak leírás — a " +
          "hivatkozásnak azonosítania kell a jogszabályt és a szakaszt" });
    }
  }

  // `primary` CSAK aláírásból. Itt a tét a legnagyobb: a törlés nem javítható.
  const allapotok = new Map(megorzesAllapot(docs, kat).map((a) => [a.doc, a]));
  for (const d of docs) {
    const a = allapotok.get(d.id)!;
    if (d.retention.verification === "primary" && a.allapot !== "hitelesitve") {
      out.push({ severity: "error", id: d.id,
        message:
          "`verification: \"primary\"` ALÁÍRÁS NÉLKÜL. Ez a mező nyitja meg az " +
          "automatikus törlést; a kaput aláírás nyitja, nem jelölés. A " +
          "hitelesítés a `registry/documents/megorzes-hitelesitesek.json`-ba kerül" });
    }
    if (a.allapot === "elavult") {
      out.push({ severity: "error", id: d.id, message: a.miert! });
    }
  }

  // A HORGONYELTÉRÉS EGY ÜGY, NEM TIZENHÁROM. Ugyanaz a kérdés áll minden
  // tételnél; tizenháromszor kiírva a validálás olvashatatlan lenne, és az
  // olvashatatlan figyelmeztetést senki nem olvassa el.
  const elteresek = horgonyElteresek(docs);
  const csoportok = new Map<string, HorgonyElteres[]>();
  for (const e of elteresek) {
    const k = `${e.from}>${e.idezett}`;
    csoportok.set(k, [...(csoportok.get(k) ?? []), e]);
  }
  for (const [, cs] of csoportok) {
    const e = cs[0];
    out.push({
      severity: "warning", id: cs.length === 1 ? e.doc : "doc.megorzes",
      message:
        `${cs.length} dokumentumtípusnál ${e.miert} ` +
        (cs.length > 1 ? `Érintett: ${cs.map((x) => x.doc).join(", ")}.` : ""),
    });
  }
  return out;
}

/** A 10. lépés haladásmérője. */
export function merleg(
  docs: DocumentDef[], kat: MegorzesKatalogus,
): { osszes: number; alairt: number; horgonyElteres: number } {
  return {
    osszes: docs.length,
    alairt: megorzesAllapot(docs, kat).filter((a) => a.allapot === "hitelesitve").length,
    horgonyElteres: horgonyElteresek(docs).length,
  };
}

/** Kényelmi alak a regiszterhez. */
export function dokumentumok(docs: DocumentRegistry): DocumentDef[] {
  return docs.all();
}
