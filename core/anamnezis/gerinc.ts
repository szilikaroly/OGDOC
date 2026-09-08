/**
 * AZ ANAMNÉZIS-GERINC — a 4. lépés gépi mértéke.
 *
 * A lépéslista így fogalmaz: *„Egy szintetikus eseten az anamnézis kitöltése
 * után a CMQCC-, a VBAC-, a Caprini- és a szűrési modul EGYETLEN TOVÁBBI
 * KÉRDÉS NÉLKÜL megkapja a bemeneteit, és ezt teszt bizonyítja."*
 *
 * A tét nem elméleti. A projekt legkockázatosabb pontja az, hogy **ha a kódolt
 * bevitel lassabb a gépelésnél, a klinikus kikerüli** — és minden modul, ami
 * újra megkérdez valamit, amit a rendszer már tudhatna, ezt a bukást hozza
 * közelebb.
 *
 * MI SZÁMÍT „TOVÁBBI KÉRDÉSNEK”. Nem minden hiányzó bemenet az. Egy vérnyomás
 * vagy egy ultrahanglelet nem kérdés, hanem MÉRÉS: azt a jelen epizódban veszik
 * fel, nem az anamnézisből. A kérdés az, ami **kérdezéssel megválaszolható, és
 * amit egyszer már megkérdeztünk**. Ezért minden hiányzó bemenet forrásba
 * sorolódik:
 *
 *   `anamnezis` — a `hx.*` gerinc. Ha ez hiányzik a kitöltött anamnézis
 *                 mellett, akkor a GERINC HIÁNYOS: valakit újra megkérdeznek.
 *   `felvetel`  — a felvételkor és az első viziten rögzített adat
 *                 (`patient.*`, `anthro.*`, `ctx.*`). Nem új kérdés.
 *   `meres`     — mérés vagy lelet a jelen epizódból (`lab.*`, `status.*`,
 *                 `us.*`, `op.*`, `labour.*`). Nem kérdés, és jogosan hiányzik,
 *                 amíg nem mérték meg.
 *   `ismeretlen`— ÚJ előtag, amit senki nem sorolt be. Ez HIBA, nem
 *                 alapértelmezés: egy új modul nem sodródhat be némán.
 *
 * A LEVEZETETT MEZŐ NEM KÉRDÉS. Az `anthro.bmi` hiánya nem azt jelenti, hogy a
 * BMI-t meg kell kérdezni — hanem hogy a testmagasság vagy a terhesség előtti
 * testsúly hiányzik. A kérdéslista ezért a számított mezőket a BEMENETEIKRE
 * bontja: azt sorolja fel, amit tényleg meg kell kérdezni.
 */
import type { CaseState, Lang } from "../types.ts";
import type { Registry } from "../registry.ts";
import { resolve } from "../derive/resolve.ts";
import { assessVbac } from "../scores/vbac.ts";
import { assessVte } from "../scores/vte.ts";
import { assessVerzes } from "../scores/verzes.ts";
import type { VerzesTabla } from "../scores/verzes.ts";
import type { ScreeningSet } from "../screening/registry.ts";

export type Forras = "anamnezis" | "felvetel" | "meres" | "ismeretlen";

/**
 * Melyik előtag melyik forrás. ADAT, nem elágazás — hogy egy új modul
 * felvételekor látható legyen, hogy be kell sorolni.
 */
export const FORRAS_ELOTAGOK: Array<[string, Forras]> = [
  ["hx.", "anamnezis"],
  ["patient.", "felvetel"],
  ["anthro.", "felvetel"],
  ["ctx.", "felvetel"],
  ["lab.", "meres"],
  ["status.", "meres"],
  ["us.", "meres"],
  ["op.", "meres"],
  ["labour.", "meres"],
  ["neo.", "meres"],
  ["rx.", "meres"],
];

export function forrasa(id: string): Forras {
  for (const [p, f] of FORRAS_ELOTAGOK) if (id.startsWith(p)) return f;
  return "ismeretlen";
}

export interface Fogyaszto {
  id: string;
  label: string;
  /** Mely bemenetek hiányoznak neki EBBEN az állapotban. */
  hianyzo: string[];
}

export interface GerincKerdes {
  /** Amit tényleg meg kell kérdezni — számított mező helyett a bemenete. */
  variable: string;
  label: string;
  forras: Forras;
  /** Melyik modulok kérnék meg. Egy kérdés több modulnak is hiányozhat. */
  kinek: string[];
  /** Ha számított mező bemenete, melyiké. */
  szamitott: string | null;
}

export interface GerincAllapot {
  fogyasztok: Fogyaszto[];
  kerdesek: GerincKerdes[];
  /** Az anamnézisből válaszolható, mégis hiányzó kérdések. Ez a GERINC HIÁNYA. */
  anamnezisHiany: GerincKerdes[];
  /** Besorolatlan előtag — hiba, nem alapértelmezés. */
  besorolatlan: GerincKerdes[];
  /**
   * Kész-e a gerinc: egyetlen anamnézisből válaszolható kérdés sem maradt,
   * és nincs besorolatlan bemenet. A `meres` forrásúak NEM rontják el —
   * egy meg nem mért vérnyomás nem az anamnézis hiánya.
   */
  keszen: boolean;
  osszefoglalo: string;
}

/**
 * Egy hiányzó bemenetet KÉRDÉSEKRE bont.
 *
 * A számított mezőt a bemeneteire vezetjük vissza — rekurzívan, mert egy
 * bemenet maga is lehet számított —, és csak azokat vesszük fel, amelyek
 * tényleg hiányoznak. Ha a számított mező minden bemenete megvan, de az érték
 * mégsem áll elő, a számított mező marad a kérdés: ott a képlettel van baj,
 * nem az adattal.
 */
function kerdesekre(
  reg: Registry, state: CaseState, id: string, lang: Lang,
  latott = new Set<string>(),
): Array<{ variable: string; szamitott: string | null }> {
  if (latott.has(id)) return [];
  latott.add(id);

  const primary = reg.resolvePrimary(id);
  const def = reg.get(primary);
  if (!def || def.derivation?.kind !== "computed") {
    return [{ variable: primary, szamitott: null }];
  }

  const out: Array<{ variable: string; szamitott: string | null }> = [];
  for (const inp of reg.computedInputs(primary)) {
    if (resolve(reg, state, inp).state === "ok") continue;
    for (const k of kerdesekre(reg, state, inp, lang, latott)) {
      out.push({ variable: k.variable, szamitott: k.szamitott ?? primary });
    }
  }
  // Minden bemenet megvan, az érték mégsem áll elő: a képlet a hibás.
  return out.length ? out : [{ variable: primary, szamitott: null }];
}

export interface GerincBemenet {
  verzesTabla: VerzesTabla;
  szuresek: ScreeningSet;
}

/**
 * Végigfuttatja a négy fogyasztót, és megmondja, mit kérdeznének még meg.
 *
 * A négy modul nem véletlen: ezek azok, amelyek a `03` anamnézisből töltenek
 * fel, és amelyeknél a újrakérdezés a legdrágább — mindegyik a szülés körül
 * kerül elő, amikor a legkevesebb az idő.
 */
export function gerincAllapot(
  reg: Registry, state: CaseState, be: GerincBemenet, lang: Lang = "hu",
): GerincAllapot {
  const fogyasztok: Fogyaszto[] = [
    {
      id: "verzes", label: "CMQCC vérzési kockázat",
      hianyzo: assessVerzes(reg, state, be.verzesTabla, lang).hianyzo,
    },
    {
      id: "vbac", label: "VBAC — hüvelyi szülés császármetszés után",
      hianyzo: assessVbac(reg, state, lang).missing,
    },
    {
      id: "vte", label: "VTE (Caprini/RCOG) thrombosiskockázat",
      hianyzo: assessVte(reg, state, lang).missing,
    },
    {
      id: "szures", label: "Szűrési esedékesség",
      hianyzo: [...new Set(
        be.szuresek.dueList(reg, state, lang)
          .filter((s) => s.status === "unknown")
          .flatMap((s) => s.missing ?? []),
      )],
    },
  ];

  const map = new Map<string, GerincKerdes>();
  for (const f of fogyasztok) {
    for (const id of f.hianyzo) {
      for (const k of kerdesekre(reg, state, id, lang)) {
        const meglevo = map.get(k.variable);
        if (meglevo) {
          if (!meglevo.kinek.includes(f.label)) meglevo.kinek.push(f.label);
          continue;
        }
        const def = reg.get(reg.resolvePrimary(k.variable));
        map.set(k.variable, {
          variable: k.variable,
          label: def?.label?.[lang] ?? def?.label?.hu ?? k.variable,
          forras: forrasa(k.variable),
          kinek: [f.label],
          szamitott: k.szamitott,
        });
      }
    }
  }

  const kerdesek = [...map.values()].sort((a, b) => a.variable.localeCompare(b.variable));
  const anamnezisHiany = kerdesek.filter((k) => k.forras === "anamnezis");
  const besorolatlan = kerdesek.filter((k) => k.forras === "ismeretlen");
  const keszen = anamnezisHiany.length === 0 && besorolatlan.length === 0;

  const szam = (f: Forras) => kerdesek.filter((k) => k.forras === f).length;
  const osszefoglalo = keszen
    ? `A gerinc ÁLL: a négy modul egyetlen anamnézisből válaszolható kérdést ` +
      `sem tesz fel újra. ` +
      (szam("meres")
        ? `Ami hiányzik (${szam("meres")} tétel), az mérés vagy lelet a jelen ` +
          `epizódból — az nem az anamnézis dolga.`
        : `Minden bemenet megvan.`) +
      (szam("felvetel")
        ? ` További ${szam("felvetel")} tétel a felvételkor rögzítendő.`
        : "")
    : `A GERINC HIÁNYOS: ${anamnezisHiany.length} olyan kérdés maradt, amit az ` +
      `anamnézis megválaszolhatott volna` +
      (besorolatlan.length
        ? `, és ${besorolatlan.length} bemenet előtagja besorolatlan`
        : "") +
      `. Minden ilyen tétel egy újra feltett kérdés a szülés körül, amikor a ` +
      `legkevesebb az idő.`;

  return { fogyasztok, kerdesek, anamnezisHiany, besorolatlan, keszen, osszefoglalo };
}
