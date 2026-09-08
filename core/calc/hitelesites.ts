/**
 * A HÉT KAPU MÖGÖTTI KALKULÁTOR — a 8. lépés gépi fele.
 *
 * Hét kalkulátor teljes bemenettel sem ad eredményt, mert a konstansaik
 * nincsenek visszaellenőrizve az elsődleges közleménnyel. Ez nem elméleti
 * óvatosság: a fullPIERS dokumentált együtthatóival a modell klinikailag
 * FORDÍTVA viselkedik, és ezt a rendszer saját tesztje mutatta ki.
 *
 * A KÜLÖNBSÉG A 6. ÉS 7. LÉPÉSHEZ KÉPEST. Ott a hitelesítés tárgya ADAT volt
 * — egy referenciasáv, egy görbe sorai. Itt KÓD: a konstansok egy JavaScript
 * függvény törzsében állnak. Ez három dolgot változtat meg:
 *
 *   1. A LENYOMAT A FÜGGVÉNY FORRÁSÁT fedi (megjegyzések nélkül), nem egy
 *      táblázatot. Egyetlen együttható átírása elavulttá teszi az aláírást —
 *      és ez a helyes viselkedés, mert épp az együttható az, amit aláírtak.
 *
 *   2. AZ EGYSÉG A LENYOMAT RÉSZE. Az eGFR függvénye µmol/L-t vár és 88,4-gyel
 *      oszt. Ha a bemenet deklarált egysége mg/dL-re változna a kód érintése
 *      nélkül, az eredmény CSENDBEN 88-szor téves lenne — a lenyomat viszont
 *      nem változna, ha az egység kimaradna belőle. Ezért benne van.
 *
 *   3. A GÉP ELŐRE ELVÉGEZ KÉT ELLENŐRZÉST, amit ember unalmasnak találna:
 *      a kódban álló számokat összeveti a `formula` prózájával (elcsúszás-
 *      figyelő), és pontozó kalkulátornál megnézi, NŐ-E a pontszám a
 *      súlyossággal.
 *
 * AMI NEM EZÉ A RÉTEGÉ. Az aláírás. Egyetlen konstansról sem tudja megmondani,
 * helyes-e — ahhoz a közlemény kell és egy klinikai szakértő. Amit tesz:
 * megnevezi, MELYIK számot kell mihez hasonlítani, és megakadályozza, hogy a
 * kapu aláírás nélkül kinyíljon.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import type { CalcDef } from "./types.ts";

/* ── A LENYOMAT ──────────────────────────────────────────────────────── */

/** Megjegyzések nélkül, összenyomott szóközökkel — a kód normatív magja. */
function normalizal(fnSource: string): string {
  return fnSource
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A kalkulátor NORMATÍV MAGJA: a képlet kódja, a bemenetek EGYSÉGGEL, a
 * kimenet egysége és a sávhatárok.
 *
 * Ami szándékosan kimarad: a címke, a `formula` prózája, a `caveats` és a
 * `source.cite` szövege. Azok javíthatók az aláírás elvesztése nélkül.
 */
export function lenyeg(c: CalcDef): string {
  const be = c.inputs.map((i) => `${i.id}:${i.unit ?? ""}`).join(",");
  const savok = (c.output.bands ?? [])
    .map((b) => `${b.min ?? "-inf"}..${b.max ?? "+inf"}:${b.severity ?? ""}`)
    .join(";");
  return `${c.id}|${be}|${c.output.unit ?? ""}|${savok}|${normalizal(String(c.fn))}`;
}

export function lenyomat(mag: string): string {
  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);
}

/* ── A KONSTANSOK ────────────────────────────────────────────────────── */

/** Minden számliterál a forrásból, megjegyzések nélkül. */
export function konstansok(szoveg: string): string[] {
  const tiszta = szoveg
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  return [...new Set(
    [...tiszta.matchAll(/(?<![\w.])\d+(?:[.,]\d+)?/g)]
      .map((m) => m[0].replace(",", ".")),
  )];
}

export interface Elcsuszas {
  /** A kódban áll, a dokumentált képletben nem. */
  csakKodban: string[];
  /** A dokumentált képletben áll, a kódban nem. */
  csakProzaban: string[];
}

/**
 * ELCSÚSZÁS-FIGYELŐ: a kódban álló számok és a `formula` prózájában
 * dokumentáltak összevetése.
 *
 * NEM minden eltérés hiba. Egységváltó tényező (88,4), tízes alap (10),
 * hétszám-határ (14, 28) jogosan csak a kódban van; a sávok vágóértéke
 * jogosan csak a leírásban. A lista mégis hasznos: ez a legolcsóbb módja
 * annak, hogy egy elgépelt együttható kiderüljön, MIELŐTT valaki aláírja —
 * mert az aláíró a prózát olvassa, a beteg a kódot kapja.
 */
export function elcsuszas(c: CalcDef): Elcsuszas {
  const kod = new Set(konstansok(String(c.fn)));
  const proza = new Set(konstansok(c.formula ?? ""));
  // A sávhatárok a leírás részei, de a kódban nem szerepelnek: a sávozást a
  // kalkulátor-réteg végzi, nem a képlet.
  for (const b of c.output.bands ?? []) {
    for (const v of [b.min, b.max]) if (v != null) kod.add(String(v));
  }
  return {
    csakKodban: [...kod].filter((x) => !proza.has(x)),
    csakProzaban: [...proza].filter((x) => !kod.has(x)),
  };
}

/* ── MONOTONITÁS ─────────────────────────────────────────────────────── */

export interface MonotonJelzes {
  komponens: string;
  pontok: number[];
  miert: string;
}

/**
 * Pontozó kalkulátornál: NŐ-E a pontszám a súlyossággal?
 *
 * Egy nem monoton pontsor kétféle lehet, és a különbséget CSAK a közlemény
 * dönti el: vagy hűen átvett, empirikusan levezetett tábla, vagy elgépelés.
 * A gép ezért nem javít és nem vádol — MEGNEVEZI, és a hitelesítés napirendjére
 * teszi. Ez a legdrágább fajta hiba, amit egy pontszámban el lehet követni:
 * a súlyosabb eset kap kevesebb pontot, és a rendszer emiatt nem riaszt.
 */
export function monotonJelzesek(c: CalcDef): MonotonJelzes[] {
  if (c.kind !== "score") return [];
  const src = normalizal(String(c.fn));
  const out: MonotonJelzes[] = [];
  for (const [, nev, kif] of src.matchAll(/const\s+(\w+)\s*=\s*([^;]+);/g)) {
    const pontok = [...kif.matchAll(/\?\s*(\d+)\s*(?=:)/g)].map((m) => Number(m[1]));
    const zaro = /:\s*(\d+)\s*$/.exec(kif.trim());
    if (zaro) pontok.push(Number(zaro[1]));
    if (pontok.length < 3) continue;
    const esik = pontok.some((v, i) => i > 0 && v < pontok[i - 1]);
    if (!esik) continue;
    out.push({
      komponens: nev, pontok,
      miert:
        `a pontsor nem növekvő (${pontok.join(" → ")}): a súlyosabb kategória ` +
        `KEVESEBB pontot ér. Ez lehet hűen átvett empirikus tábla és lehet ` +
        `elgépelés — a különbséget csak az elsődleges közlemény dönti el`,
    });
  }
  return out;
}

/* ── AZ ALÁÍRÁS ──────────────────────────────────────────────────────── */

export interface KalkHitelesites {
  calc: string;
  ki: string;
  szerep: string;
  mikor: string;
  lenyomat: string;
  /** Melyik közlemény melyik táblázatával/egyenletével vetették össze. */
  forrasTabla: string;
  /**
   * Amit a hitelesítő TÉTELESEN összevetett — konstansonként. A lista a
   * munkalapról másolható, és épp ezért nem formaság: enélkül az „összevetve”
   * állítás nem ellenőrizhető.
   */
  osszevetettKonstansok: string[];
  megjegyzes?: string;
}

export interface KalkHitelesitesKatalogus {
  szerepek: Record<string, string>;
  hitelesitesek: KalkHitelesites[];
}

export function loadKalkHitelesitesek(path: string): KalkHitelesitesKatalogus {
  return JSON.parse(readFileSync(path, "utf8")) as KalkHitelesitesKatalogus;
}

export type KalkAllapot = "hitelesitve" | "alairatlan" | "elavult";

export interface KalkTetelAllapot {
  calc: string;
  label: string;
  allapot: KalkAllapot;
  lenyomat: string;
  alairo: string | null;
  konstansok: string[];
  /** Amit az aláíró NEM vetett össze, pedig a kódban ott van. */
  osszevetetlen: string[];
  monoton: MonotonJelzes[];
  elcsuszas: Elcsuszas;
  miert: string | null;
}

export function kalkAllapot(
  calcs: CalcDef[], kat: KalkHitelesitesKatalogus,
): KalkTetelAllapot[] {
  const byId = new Map(kat.hitelesitesek.map((h) => [h.calc, h]));
  return calcs.map((c) => {
    const mag = lenyomat(lenyeg(c));
    const konst = konstansok(String(c.fn));
    const h = byId.get(c.id);
    const kozos = {
      calc: c.id, label: c.label?.hu ?? c.id, lenyomat: mag,
      konstansok: konst,
      monoton: monotonJelzesek(c),
      elcsuszas: elcsuszas(c),
    };
    if (!h) {
      return { ...kozos, allapot: "alairatlan" as const, alairo: null,
               osszevetetlen: konst, miert: null };
    }
    const osszevetetlen = konst.filter((k) => !h.osszevetettKonstansok.includes(k));
    if (h.lenyomat !== mag) {
      return {
        ...kozos, allapot: "elavult" as const, alairo: h.ki, osszevetetlen,
        miert:
          `a képlet magja megváltozott az aláírás óta (aláírt: ${h.lenyomat}, ` +
          `mostani: ${mag}) — az aláírás nem fedezi a mostani együtthatókat`,
      };
    }
    return { ...kozos, allapot: "hitelesitve" as const, alairo: h.ki,
             osszevetetlen, miert: null };
  });
}

/** A hitelesítettek `verified` mezőjét állítja igazra — futásidőben, aláírásból. */
export function alkalmazKalk(
  calcs: CalcDef[], kat: KalkHitelesitesKatalogus,
): number {
  let n = 0;
  for (const a of kalkAllapot(calcs, kat)) {
    if (a.allapot !== "hitelesitve") continue;
    const c = calcs.find((x) => x.id === a.calc);
    if (!c) continue;
    (c as { verified: boolean }).verified = true;
    n++;
  }
  return n;
}

/* ── INTEGRITÁS ──────────────────────────────────────────────────────── */

export interface KalkIssue {
  severity: "error" | "warning";
  id: string;
  message: string;
}

/**
 * ÖRÖKLÖTT HITELESÍTÉS — a lista, ami csak rövidülhet.
 *
 * Az aláírási réteg előtt 36 kalkulátor kapott `verified: true` jelölést,
 * aláíró és lenyomat nélkül. A visszavonásuk nem javítana semmit: 36 működő
 * számítás állna le anélkül, hogy egyetlen konstans is biztonságosabb lenne.
 * A kockázatot nem az elhallgatás csökkenti, hanem a megnevezés — ezért itt
 * ADÓSSÁGKÉNT szerepelnek, és a szám a validálás záró sorában is látszik.
 *
 * ÚJ TÉTEL NEM KERÜLHET RÁ. Aki mostantól ír egy kalkulátort, aláírással
 * hitelesíti; a lista lezárási dátuma után `verified: true` csak aláírásból
 * lehet.
 */
export interface OrokoltLista {
  lezarva: string;
  szabaly: string;
  orokolt: string[];
}

export function loadOrokolt(path: string): OrokoltLista {
  return JSON.parse(readFileSync(path, "utf8")) as OrokoltLista;
}

export function validateKalkHitelesitesek(
  calcs: CalcDef[], kat: KalkHitelesitesKatalogus, orokolt: OrokoltLista,
): KalkIssue[] {
  const out: KalkIssue[] = [];
  const latott = new Set<string>();

  for (const h of kat.hitelesitesek) {
    if (latott.has(h.calc)) {
      out.push({ severity: "error", id: h.calc,
                 message: "két hitelesítés ugyanarra a kalkulátorra" });
    }
    latott.add(h.calc);

    const c = calcs.find((x) => x.id === h.calc);
    if (!c) {
      out.push({ severity: "error", id: h.calc,
                 message: "hitelesítés nem létező kalkulátorra" });
      continue;
    }
    if (!h.ki?.trim()) {
      out.push({ severity: "error", id: h.calc, message: "névtelen hitelesítés" });
    }
    if (!h.forrasTabla?.trim()) {
      out.push({ severity: "error", id: h.calc,
                 message: "hiányzó `forrasTabla` — nem derül ki, MIVEL vetették össze" });
    }
    // A tételes összevetés a lényeg: egy „megnéztem” önmagában nem aláírás.
    const konst = konstansok(String(c.fn));
    const hianyzo = konst.filter((k) => !(h.osszevetettKonstansok ?? []).includes(k));
    if (hianyzo.length) {
      out.push({
        severity: "error", id: h.calc,
        message:
          `az aláírás ${hianyzo.length} konstansról hallgat (${hianyzo.join(", ")}). ` +
          `A hitelesítés TÉTELES: ami nincs összevetve, arra az aláírás nem terjed ki`,
      });
    }
    // Nem monoton pontsort aláírni lehet — de csak kimondva.
    const mono = monotonJelzesek(c);
    if (mono.length && !h.megjegyzes?.trim()) {
      out.push({
        severity: "error", id: h.calc,
        message:
          `a(z) ${mono.map((m) => m.komponens).join(", ")} pontsora NEM NÖVEKVŐ, ` +
          `és az aláírás nem fűz hozzá megjegyzést. Ha a közlemény tényleg így ` +
          `adja, azt ki kell mondani — enélkül nem derül ki, hogy észrevették-e`,
      });
    }
  }

  // `verified: true` CSAK aláírásból — vagy az ÖRÖKLÖTT listáról.
  const orokoltHalmaz = new Set(orokolt.orokolt);
  for (const c of calcs) {
    if (!c.verified) continue;
    const h = kat.hitelesitesek.find((x) => x.calc === c.id);
    if (!h) {
      if (orokoltHalmaz.has(c.id)) {
        out.push({
          severity: "warning", id: c.id,
          message:
            `ÖRÖKLÖTT hitelesítés (${orokolt.lezarva} előtti): a jelölés mögött ` +
            `nincs megnevezett aláíró és nincs lenyomat. Ez megnevezett adósság, ` +
            `nem aláírás — a lista csak rövidülhet`,
        });
        continue;
      }
      out.push({
        severity: "error", id: c.id,
        message:
          "`verified: true` a definícióban, HITELESÍTÉS NÉLKÜL, és az ÖRÖKLÖTT " +
          "listán sincs rajta. A kaput aláírás nyitja, nem jelölés — a " +
          "hitelesítés a `registry/kalkulatorok/hitelesitesek.json`-ba kerül",
      });
    } else if (h.lenyomat !== lenyomat(lenyeg(c))) {
      out.push({ severity: "error", id: c.id,
                 message: "`verified: true` ELAVULT aláírással" });
    }
  }

  for (const a of kalkAllapot(calcs, kat)) {
    if (a.allapot === "elavult") {
      out.push({ severity: "error", id: a.calc, message: a.miert! });
    }
  }
  return out;
}

/** Az öröklött lista fogyása — ez a 8. lépés valódi haladásmérője. */
export function orokoltAllas(
  calcs: CalcDef[], kat: KalkHitelesitesKatalogus, orokolt: OrokoltLista,
): { orokolt: number; alairt: number; kapuMogott: number } {
  const alairt = new Set(kat.hitelesitesek.map((h) => h.calc));
  return {
    orokolt: orokolt.orokolt.filter((id) => !alairt.has(id)).length,
    alairt: alairt.size,
    kapuMogott: calcs.filter((c) => !c.verified).length,
  };
}
