/**
 * SZÜLÉS KÖRÜLI VÉRZÉS — kockázati tényezők az anamnézisből.
 *
 * Ez a modul az, amiért a `03` anamnézis-gerinc létezik: a `hx.repro.*` és a
 * `hx.sys.*` mezők túlnyomó részét azért kérdezzük meg egyszer, hogy a szülés
 * előtt senkinek ne kelljen újra megkérdeznie.
 *
 * MIÉRT NEM AD SZINTET. A CMQCC tábla alacsony/közepes/magas besorolást ad, és
 * a besorolásnak van kombinációs szabálya is („két közepes tétel együtt magas”).
 * A táblánk `verification: "assumed"` — a tényezők és a besorolásuk elsődleges
 * forrásból nincs visszaellenőrizve. Amíg ez így van, szint nem születik:
 *
 *   egy „alacsony kockázat” besorolás rossz táblából ROSSZABB, mint a
 *   besorolás hiánya — mert megnyugtat.
 *
 * Ez ugyanaz a kapu, mint a `calc.verified` a kalkulátoroknál és a `blocksAlerting`
 * a szepszisprotokollnál. Nem elvi tiltás, hanem NYITOTT FELADAT: a 6. lépés
 * mintája szerint hitelesíthető, és utána a `verification` „primary” lesz.
 *
 * AMI VISZONT MEGVAN, és ez nem kevés: mely tényezők állnak fenn, melyik nem,
 * és melyikről NEM TUDUNK. A harmadik a lényeg — a hiányzó válasz sehol nem
 * „nem áll fenn”.
 */
import { readFileSync } from "node:fs";
import type { CaseState, I18n, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { nemTudja, resolve } from "../derive/resolve.ts";

/** Mikor számít fennállónak — a tábla adatából, nem kódból. */
export interface VerzesFeltetel {
  eq?: unknown;
  gte?: number;
  gt?: number;
  notIn?: unknown[];
}

export interface VerzesTenyezoDef {
  id: string;
  variable: string;
  label: I18n;
  szint: "alacsony" | "kozepes" | "magas";
  mikor: VerzesFeltetel;
  miert: I18n;
}

export interface VerzesTabla {
  id: string;
  label: I18n;
  verification: "primary" | "secondary" | "assumed";
  verificationNote?: I18n;
  source: { cite: string; standard?: string | null; url?: string | null };
  szintek: Record<string, I18n>;
  tenyezok: VerzesTenyezoDef[];
}

export function loadVerzesTabla(path: string): VerzesTabla {
  return JSON.parse(readFileSync(path, "utf8")) as VerzesTabla;
}

export interface VerzesTenyezo {
  id: string;
  variable: string;
  label: string;
  szint: "alacsony" | "kozepes" | "magas";
  /** `true` · `false` · `"unknown"` — a harmadik állapot nem esik össze a másodikkal. */
  fennall: boolean | "unknown";
  miert: string;
}

export interface VerzesErtekeles {
  tenyezok: VerzesTenyezo[];
  /** Amelyik fennáll — ez megy a tanácsadásba. */
  fennallo: VerzesTenyezo[];
  /** Amelyikről nincs adat — MÉG NEM KÉRDEZTÜK. A hiányzó adat nem „nincs kockázat”. */
  hianyzo: string[];
  /** Amit megkérdeztünk, és a beteg nem tudja. Ez sem „nincs kockázat”. */
  nemTudja: string[];
  /**
   * A besorolás — vagy `null`, és akkor a `nincsSzint` megmondja, miért.
   * Hitelesítetlen táblából szint nem születik.
   */
  szint: "alacsony" | "kozepes" | "magas" | null;
  nincsSzint: string | null;
  source: string;
}

function teljesul(felt: VerzesFeltetel, value: unknown): boolean {
  if (felt.eq !== undefined) return value === felt.eq;
  if (felt.gte !== undefined) return Number(value) >= felt.gte;
  if (felt.gt !== undefined) return Number(value) > felt.gt;
  if (felt.notIn !== undefined) return !felt.notIn.includes(value);
  // Értelmezhetetlen feltétel: NEM „nem áll fenn”, hanem nem értékelhető.
  throw new Error(`Ismeretlen feltétel: ${JSON.stringify(felt)}`);
}

export function assessVerzes(
  reg: Registry, state: CaseState, tabla: VerzesTabla, lang: Lang = "hu",
): VerzesErtekeles {
  const tenyezok: VerzesTenyezo[] = [];
  const hianyzo: string[] = [];
  const nemTudjaList: string[] = [];

  for (const t of tabla.tenyezok) {
    const label = t.label[lang] ?? t.label.hu;
    const miert = t.miert[lang] ?? t.miert.hu;
    const r = resolve(reg, state, t.variable);
    if (r.state !== "ok") {
      hianyzo.push(t.variable);
      tenyezok.push({ ...t, label, miert, fennall: "unknown" });
      continue;
    }
    if (nemTudja(reg, t.variable, r.value)) {
      nemTudjaList.push(t.variable);
      tenyezok.push({ ...t, label, miert, fennall: "unknown" });
      continue;
    }
    tenyezok.push({ ...t, label, miert, fennall: teljesul(t.mikor, r.value) });
  }

  const fennallo = tenyezok.filter((t) => t.fennall === true);
  const nincsSzint = tabla.verification === "primary"
    ? null
    : `SZINT NEM SZÜLETIK: a tábla ${tabla.verification} szintű — ` +
      (tabla.verificationNote?.[lang] ?? tabla.verificationNote?.hu ?? "") +
      (hianyzo.length
        ? ` Ezen felül ${hianyzo.length} tényezőhöz nincs adat (${hianyzo.join(", ")}) ` +
          `— a hiányzó adat nem „nincs kockázat”.`
        : "") +
      (nemTudjaList.length
        ? ` ${nemTudjaList.length} tételre a beteg azt válaszolta, hogy nem tudja ` +
          `(${nemTudjaList.join(", ")}) — megkérdezett bizonytalanság, nem „nincs kockázat”.`
        : "");

  return {
    tenyezok, fennallo, hianyzo, nemTudja: nemTudjaList,
    szint: null,
    nincsSzint,
    source: tabla.source.cite,
  };
}

export interface VerzesIssue { severity: "error" | "warning"; id: string; message: string }

/** A tábla önellenőrzése — a szabály adat, tehát a szabályt is validálni kell. */
export function validateVerzesTabla(reg: Registry, tabla: VerzesTabla): VerzesIssue[] {
  const out: VerzesIssue[] = [];
  const push = (severity: "error" | "warning", id: string, message: string) =>
    out.push({ severity, id, message });

  const latott = new Set<string>();
  for (const t of tabla.tenyezok) {
    if (latott.has(t.id)) push("error", t.id, "Ismétlődő tényezőazonosító.");
    latott.add(t.id);

    // A `resolvePrimary` ismeretlen azonosítóra DOB. Egy elgépelt változónév
    // a táblában nem összeomlás, hanem MEGNEVEZETT hiba — különben a validátor
    // maga esik el azon, amit ellenőriznie kellene.
    let def;
    try { def = reg.get(reg.resolvePrimary(t.variable)); } catch { def = undefined; }
    if (!def) {
      push("error", t.id, `Nem létező változóra mutat: ${t.variable}`);
      continue;
    }
    if (!tabla.szintek[t.szint]) push("error", t.id, `Ismeretlen szint: ${t.szint}`);
    if (!t.miert?.hu?.trim()) push("error", t.id, "Indoklás nélküli tényező.");

    // Az ÉRTELMEZHETETLEN FELTÉTEL a legveszélyesebb hiba: némán „nem áll
    // fenn”-né válna, ha a kiértékelő elnyelné. Itt derüljön ki, ne futásidőben.
    const kulcsok = Object.keys(t.mikor);
    if (kulcsok.length !== 1) {
      push("error", t.id,
        `A feltételnek pontosan egy alakja lehet, itt ${kulcsok.length} van: ` +
        `${kulcsok.join(", ")}`);
      continue;
    }
    if (t.mikor.eq !== undefined && def.valueSet?.length) {
      if (!def.valueSet.some((v) => v.code === t.mikor.eq)) {
        push("error", t.id,
          `A(z) ${String(t.mikor.eq)} nincs a(z) ${t.variable} kódlistájában.`);
      }
    }
    if (t.mikor.notIn !== undefined && def.valueSet?.length) {
      for (const c of t.mikor.notIn) {
        if (!def.valueSet.some((v) => v.code === c)) {
          push("error", t.id, `A(z) ${String(c)} nincs a(z) ${t.variable} kódlistájában.`);
        }
      }
    }
    const szamos = t.mikor.gte !== undefined || t.mikor.gt !== undefined;
    if (szamos && def.datatype !== "quantity" && def.datatype !== "count") {
      push("error", t.id,
        `Számos feltétel nem számos változón: ${t.variable} (${def.datatype}).`);
    }
  }

  if (tabla.verification !== "primary" && !tabla.verificationNote?.hu?.trim()) {
    push("error", tabla.id,
      "Hitelesítetlen tábla a hitelesítés hiányának megnevezése nélkül — " +
      "a kapu csak akkor kapu, ha megmondja, mire vár.");
  }
  if (tabla.verification !== "primary") {
    push("warning", tabla.id,
      `A vérzési kockázati tábla ${tabla.verification} szintű: a rendszer ` +
      `felsorolja a tényezőket, de SZINTET NEM ÁLLAPÍT MEG.`);
  }
  return out;
}
