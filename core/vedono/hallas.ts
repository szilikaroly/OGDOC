/**
 * AUDIOGRAM — a rajz leírás, a besorolás állítás.
 *
 * A tisztahang-küszöbaudiogram az a lelet, amit minden fül-orr-gégész első
 * pillantásra ért — DE CSAK AKKOR, ha a nemzetközi egyezmény szerint készült:
 *
 *   jobb fül   PIROS,  KÖR jel (O)
 *   bal fül    KÉK,    KERESZT jel (X)
 *   dB-tengely LEFELÉ NŐ — 0 dB fent, a jobb hallás fent van
 *   Hz-tengely logaritmikus, 125-től 8000-ig
 *
 * Aki a dB-tengelyt megfordítja, olvashatatlan ábrát csinál: a rossz hallás
 * felfelé csúszna, és a görbe alakja az ellenkezőjét mutatná annak, amit a
 * szem megszokott. Ez nem ízlés kérdése, és nem is „ábrázolási preferencia” —
 * a konvenció maga a közölhetőség.
 *
 * ÉS AMIT AZ AUDIOGRAM NEM AD: MEGÍTÉLÉST.
 *
 * A sávhatárok (ép / enyhe / közepes / …) aláírásra várnak, mint a rendszer
 * minden más küszöbe. Amíg nincs aláírás, az audiogram MEGRAJZOLHATÓ — a mért
 * pont attól még mért pont —, de a besorolás nem születik meg. A rajz leírás;
 * a besorolás állítás, és állításhoz aláírás kell.
 */
import { readFileSync } from "node:fs";
import type { RegistryIssue } from "../registry.ts";

/* ── A NYILVÁNTARTÁS ─────────────────────────────────────────────────── */

export type Ful = "jobb" | "bal";

export interface Sav {
  id: string;
  tolDb: number | null;
  igDb: number | null;
  label_hu: string;
}

export interface AudiogramKeszlet {
  megnevezes: string;
  modul: number;
  forras: string;
  note: string;
  frekvenciak: number[];
  beszedFrekvenciak: number[];
  fulek: Array<{ kod: Ful; label_hu: string; szin: string; jel: string }>;
  savok: Sav[];
  hitelesitesek: Array<{ ki: string; mikor: string }>;
}

export function loadAudiogram(path: string): AudiogramKeszlet {
  return JSON.parse(readFileSync(path, "utf8")) as AudiogramKeszlet;
}

/* ── A MÉRÉS ─────────────────────────────────────────────────────────── */

/** Egy küszöbérték. `null` = nem mérték; `false` a `hallja` mezőben = nem hallotta a maximumon sem. */
export interface Kuszob { frekvencia: number; db: number | null; }

export interface Meres { ful: Ful; kuszobok: Kuszob[]; }

export interface AtlagEredmeny {
  ful: Ful;
  /** A beszédfrekvenciák átlaga — `null`, ha bármelyik hiányzik. */
  atlagDb: number | null;
  /** Mely beszédfrekvenciákat nem mérték. */
  hianyzo: number[];
  miert: string;
}

/**
 * BESZÉDFREKVENCIÁS ÁTLAG — és a hiányzó frekvencia nem nulla.
 *
 * Ha bármelyik beszédfrekvencia hiányzik, az átlag `null`, nem részátlag. Egy
 * három frekvenciából számolt „négyfrekvenciás átlag” pontosan úgy néz ki, mint
 * a teljes — és rendszerint jobbnak, mert a kimaradó frekvencia gyakran a
 * legrosszabb.
 */
export function beszedAtlag(k: AudiogramKeszlet, m: Meres): AtlagEredmeny {
  const map = new Map(m.kuszobok.map((x) => [x.frekvencia, x.db]));
  const hianyzo = k.beszedFrekvenciak.filter((f) => map.get(f) === undefined || map.get(f) === null);
  if (hianyzo.length) {
    return { ful: m.ful, atlagDb: null, hianyzo,
      miert:
        `A beszédfrekvenciás átlag NEM SZÁMOLHATÓ: hiányzik ${hianyzo.join(", ")} Hz. ` +
        `Részátlagot nem adunk — az pontosan úgy nézne ki, mint a teljes, és ` +
        `rendszerint jobbnak, mert a kimaradó frekvencia gyakran a legrosszabb.` };
  }
  const ossz = k.beszedFrekvenciak.reduce((s, f) => s + (map.get(f) as number), 0);
  const atlag = Math.round((ossz / k.beszedFrekvenciak.length) * 10) / 10;
  return { ful: m.ful, atlagDb: atlag, hianyzo: [],
    miert: `${k.beszedFrekvenciak.join("/")} Hz átlaga: ${atlag} dB.` };
}

/* ── A BESOROLÁS — CSAK ALÁÍRÁS UTÁN ─────────────────────────────────── */

export type BesorolasAllapot = "besorolva" | "savokAlairatlan" | "nemSzamolhato";

export interface Besorolas {
  ful: Ful;
  allapot: BesorolasAllapot;
  sav: string | null;
  atlagDb: number | null;
  miert: string;
}

export function savokAlairva(k: AudiogramKeszlet): boolean {
  return k.hitelesitesek.length > 0;
}

export function besorol(k: AudiogramKeszlet, m: Meres): Besorolas {
  const a = beszedAtlag(k, m);
  if (a.atlagDb === null) {
    return { ful: m.ful, allapot: "nemSzamolhato", sav: null, atlagDb: null, miert: a.miert };
  }
  if (!savokAlairva(k)) {
    return {
      ful: m.ful, allapot: "savokAlairatlan", sav: null, atlagDb: a.atlagDb,
      miert:
        `${a.atlagDb} dB — de a sávhatárok NINCSENEK ALÁÍRVA, ezért besorolás nem ` +
        `születik. Az audiogram megrajzolható, a mért pont mért pont marad; a ` +
        `besorolás viszont ÁLLÍTÁS, és állításhoz aláírás kell.`,
    };
  }
  const sav = k.savok.find((s) =>
    (s.tolDb === null || a.atlagDb! >= s.tolDb) && (s.igDb === null || a.atlagDb! <= s.igDb));
  return {
    ful: m.ful, allapot: "besorolva", sav: sav?.id ?? null, atlagDb: a.atlagDb,
    miert: `${a.atlagDb} dB — ${sav?.label_hu ?? "besorolhatatlan"}.`,
  };
}

/* ── A DIAGRAM ───────────────────────────────────────────────────────── */

const X0 = 64, X1 = 560, Y0 = 48, Y1 = 448, DB_MIN = -10, DB_MAX = 120;

const xPos = (k: AudiogramKeszlet, hz: number): number => {
  // LOGARITMIKUS Hz-tengely — a hallás így hallja, és a konvenció is ez.
  const lo = Math.log10(k.frekvenciak[0]);
  const hi = Math.log10(k.frekvenciak[k.frekvenciak.length - 1]);
  return X0 + ((Math.log10(hz) - lo) / (hi - lo)) * (X1 - X0);
};
const yPos = (db: number): number =>
  // A dB-TENGELY LEFELÉ NŐ: 0 dB fent, a jobb hallás fent van.
  Y0 + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * (Y1 - Y0);

/**
 * AZ AUDIOGRAM SVG-BEN.
 *
 * Nincs külső könyvtár: a rajz szerkezete olyan kötött, hogy egy általános
 * diagramkönyvtárral több munka volna a konvenciót kikényszeríteni, mint
 * megrajzolni. A színek a témaváltozókból jönnek, hogy sötét háttéren is
 * olvasható maradjon — a PIROS/KÉK megkülönböztetés viszont NEM téma kérdése,
 * mert az a lelet nyelve.
 */
export function svg(k: AudiogramKeszlet, meresek: Meres[]): string {
  const p: string[] = [];
  p.push(`<svg viewBox="0 0 600 492" role="img" aria-label="Audiogram: hallásküszöb frekvenciánként, jobb és bal fül">`);
  p.push(`<style>
    .ag-rács{stroke:#c9c9c9;stroke-width:.5}
    .ag-fő{stroke:#8a8a8a;stroke-width:1}
    .ag-t{font:11px system-ui,sans-serif;fill:#444}
    .ag-c{font:12px system-ui,sans-serif;fill:#222;font-weight:600}
    .ag-j{stroke:#c02026;fill:none;stroke-width:1.8}
    .ag-b{stroke:#1b4fa8;fill:none;stroke-width:1.8}
    .ag-ep{fill:#2e7d32;opacity:.07}
  </style>`);

  // AZ ÉP SÁV kiemelése — a 25 dB-es vonal az, amihez a szem viszonyít.
  p.push(`<rect x="${X0}" y="${yPos(DB_MIN)}" width="${X1 - X0}" height="${yPos(25) - yPos(DB_MIN)}" class="ag-ep"/>`);

  // dB-rács tízesével
  for (let db = DB_MIN; db <= DB_MAX; db += 10) {
    const y = yPos(db);
    p.push(`<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" class="${db === 0 ? "ag-fő" : "ag-rács"}"/>`);
    p.push(`<text x="${X0 - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="ag-t">${db}</text>`);
  }
  // Hz-rács
  for (const hz of k.frekvenciak) {
    const x = xPos(k, hz);
    p.push(`<line x1="${x.toFixed(1)}" y1="${Y0}" x2="${x.toFixed(1)}" y2="${Y1}" class="ag-rács"/>`);
    p.push(`<text x="${x.toFixed(1)}" y="${Y0 - 10}" text-anchor="middle" class="ag-t">${hz >= 1000 ? hz / 1000 + "k" : hz}</text>`);
  }
  p.push(`<text x="${(X0 + X1) / 2}" y="${Y0 - 26}" text-anchor="middle" class="ag-c">Frekvencia (Hz)</text>`);
  p.push(`<text transform="translate(18,${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle" class="ag-c">Hallásküszöb (dB HL)</text>`);

  // A MÉRÉSEK
  for (const m of meresek) {
    const f = k.fulek.find((x) => x.kod === m.ful);
    if (!f) continue;
    const osztaly = m.ful === "jobb" ? "ag-j" : "ag-b";
    const pontok = m.kuszobok
      .filter((x) => x.db !== null && k.frekvenciak.includes(x.frekvencia))
      .sort((a, b) => a.frekvencia - b.frekvencia)
      .map((x) => ({ x: xPos(k, x.frekvencia), y: yPos(x.db as number) }));
    if (pontok.length > 1) {
      p.push(`<polyline points="${pontok.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ")}" class="${osztaly}"/>`);
    }
    for (const q of pontok) {
      // JOBB = KÖR, BAL = KERESZT. A jel önmagában is megkülönböztet, szín nélkül.
      p.push(m.ful === "jobb"
        ? `<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="5" class="${osztaly}"/>`
        : `<path d="M${(q.x - 5).toFixed(1)},${(q.y - 5).toFixed(1)} l10,10 M${(q.x + 5).toFixed(1)},${(q.y - 5).toFixed(1)} l-10,10" class="${osztaly}"/>`);
    }
  }

  // JELMAGYARÁZAT — a szín mellett a jel is, mert a szín önmagában nem elég.
  p.push(`<circle cx="${X0 + 10}" cy="474" r="5" class="ag-j"/><text x="${X0 + 22}" y="478" class="ag-t">Jobb fül (O, piros)</text>`);
  p.push(`<path d="M${X0 + 175},469 l10,10 M${X0 + 185},469 l-10,10" class="ag-b"/><text x="${X0 + 194}" y="478" class="ag-t">Bal fül (X, kék)</text>`);
  p.push(`</svg>`);
  return p.join("\n");
}

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

export function validateAudiogram(k: AudiogramKeszlet): RegistryIssue[] {
  const out: RegistryIssue[] = [];
  for (const f of k.beszedFrekvenciak) {
    if (!k.frekvenciak.includes(f)) {
      out.push({ severity: "error", id: `audiogram.beszed.${f}`,
        message:
          `A(z) ${f} Hz beszédfrekvencia nincs a mért frekvenciák között — az ` +
          `átlag így sosem lenne kiszámolható.` });
    }
  }
  const rendezett = [...k.frekvenciak].sort((a, b) => a - b);
  if (JSON.stringify(rendezett) !== JSON.stringify(k.frekvenciak)) {
    out.push({ severity: "error", id: "audiogram.frekvencia",
      message: "A frekvenciák nincsenek növekvő sorrendben — a rajz tengelye elcsúszna." });
  }
  if (!savokAlairva(k)) {
    out.push({ severity: "warning", id: "audiogram.savok",
      message:
        `Az audiogram sávhatárai (${k.savok.length} sáv) nincsenek aláírva. Az ` +
        `audiogram megrajzolható, de besorolást nem ad — a rajz leírás, a ` +
        `besorolás állítás.` });
  }
  return out;
}
