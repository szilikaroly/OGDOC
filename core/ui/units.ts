/**
 * MÉRTÉKEGYSÉG EMBERI OLVASATRA.
 *
 * A regiszter UCUM-kódot tárol, és ez helyes: az `mm[Hg]` géppel
 * feldolgozható, egyértelmű, és az interoperabilitás ezt várja. Egy NYOMTATOTT
 * zárójelentésen viszont a beteg és a következő ellátó olvassa — és ott a
 * „148 mm[Hg]", a „33 a" vagy a „210 10*9/L" nem tájékoztat, hanem zavar.
 *
 * Ez ugyanaz a kettősség, ami a rendszerben végigfut: a KÓDOLT alak a gépnek,
 * az EMBERI a klinikusnak — és egyik sem helyettesíti a másikat. A tárolt
 * érték változatlanul UCUM marad; ez a réteg kizárólag megjelenítés.
 *
 * A szabály, ami miatt ez nem elromlik: AMIT NEM ISMERÜNK, AZT VÁLTOZATLANUL
 * ÍRJUK KI. Nem találunk ki magyar formát; a `core.test.ts` pedig őrzi, hogy
 * minden gépi jelölést tartalmazó egységnek (`[`, `{`, `*`, `/(`) legyen
 * emberi alakja — így egy új, furcsa egység felvétele nem csúszik át némán a
 * nyomtatott dokumentumra.
 */
import type { Lang } from "../types.ts";

const HU: Record<string, string> = {
  "mm[Hg]": "Hgmm",
  "a": "év",
  "wk": "hét",
  "d": "nap",
  "h": "óra",
  "s": "mp",
  "Cel": "°C",
  "deg": "°",
  "10*9/L": "G/l",
  "10*12/L": "T/l",
  "[IU]/L": "NE/l",
  "k[IU]/L": "kNE/l",
  "m[IU]/L": "mNE/l",
  "[IU]": "NE",
  "mg/L{FEU}": "mg/l FEU",
  "/(10.min)": "/10 perc",
  "mL/min/{1.73_m2}": "ml/perc/1,73 m²",
  "kg/m2": "kg/m²",
  "m2": "m²",
  "/min": "/perc",
  "mm/mV": "mm/mV",
  "mm/s": "mm/mp",
  "cm/s": "cm/mp",
  "mL/min": "ml/perc",
  "{pont}": "pont",
  "{tbl}": "tabletta",
  "{stádium}": "stádium",
  "{trigger}": "tétel",
  // A dimenzió nélküli mennyiségnek (arány, index) NINCS kiírandó egysége.
  "1": "",
};

const EN: Record<string, string> = {
  "mm[Hg]": "mmHg", "a": "yr", "wk": "wk", "d": "d", "h": "h", "s": "s",
  "Cel": "°C", "deg": "°", "10*9/L": "10⁹/L", "10*12/L": "10¹²/L",
  "[IU]/L": "IU/L", "k[IU]/L": "kIU/L", "m[IU]/L": "mIU/L", "[IU]": "IU",
  "mg/L{FEU}": "mg/L FEU", "/(10.min)": "/10 min",
  "mL/min/{1.73_m2}": "mL/min/1.73 m²", "kg/m2": "kg/m²", "m2": "m²",
  "{pont}": "points", "{tbl}": "tablets", "{stádium}": "stage", "{trigger}": "items",
  "1": "",
};

/** A megjelenítendő egység. Ismeretlen kódot VÁLTOZATLANUL ad vissza. */
export function displayUnit(unit: string | null | undefined, lang: Lang = "hu"): string {
  if (!unit) return "";
  const map = lang === "en" ? EN : HU;
  return map[unit] ?? unit;
}

/** „148 Hgmm" — érték és egység, egységes szóközkezeléssel. */
export function withUnit(
  value: string | number, unit: string | null | undefined, lang: Lang = "hu",
): string {
  const u = displayUnit(unit, lang);
  return u ? `${value} ${u}` : String(value);
}

/** Gépi jelölést tartalmaz-e — ezt a build-teszt használja. */
export function needsDisplayForm(unit: string): boolean {
  return /[[\]{}*]|\/\(/.test(unit);
}
