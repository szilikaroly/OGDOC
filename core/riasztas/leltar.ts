/**
 * A RIASZTÁSI FELÜLET LELTÁRA — hány helyen tud a rendszer megszólalni.
 *
 * A 15. lépés nem attól nehéz, hogy kevés a riasztás, hanem attól, hogy SOK:
 * a változóregiszterben több száz kódolt válasz visel vörös zászlót, ehhez
 * jönnek a kalkulátorsávok, a panaszszótár, a kérdőívek kritikus tételei és a
 * protokollok. Ha ezek mind külön címzettet kapnának, a rend használhatatlan
 * lenne; ha egyet sem kapnak, a rendszer néma marad.
 *
 * A leltár ezért NEM címzettet rendel minden zászlóhoz, hanem megszámolja,
 * MEKKORA a felület, és megnevezi, melyik riasztástípus fedi le. A címzett a
 * TÍPUShoz tartozik — abból nyolc van, nem háromszáz.
 */
import type { Registry } from "../registry.ts";
import type { CalcDef } from "../calc/types.ts";
import type { Instrument } from "../kerdoiv/types.ts";

export interface FeluletTetel {
  honnan: string;
  darab: number;
  mit: string;
}

export interface Felulet {
  tetelek: FeluletTetel[];
  osszes: number;
}

/**
 * Hány ponton tud a rendszer vörös zászlót emelni.
 *
 * A szám maga nem cél: azt mutatja meg, mekkora zajt tudna csinálni a
 * rendszer, ha a riasztásoknak nem lenne rendje. Ez az érv a 15. lépés
 * mellett — nem az, hogy hiányzik egy mező.
 */
export function felulet(
  reg: Registry, calcs: CalcDef[], instruments: Instrument[],
  panaszRedflag: number,
): Felulet {
  const valueSet = reg.all().reduce((n, v) => {
    const opts = (v as { valueSet?: Array<{ flags?: string[] }> }).valueSet ?? [];
    return n + opts.filter((o) => (o.flags ?? []).includes("redflag")).length;
  }, 0);
  const savok = calcs.reduce(
    (n, c) => n + (c.output.bands ?? []).filter((b) => b.severity === "redflag").length, 0);
  const kritikus = instruments.filter((i) => i.criticalItem).length;

  const tetelek: FeluletTetel[] = [
    { honnan: "változóregiszter", darab: valueSet,
      mit: "kódolt válasz `redflag` jelöléssel" },
    { honnan: "kalkulátorsávok", darab: savok,
      mit: "`redflag` súlyosságú eredménysáv" },
    { honnan: "panaszszótár", darab: panaszRedflag,
      mit: "vörös zászlós panasztétel" },
    { honnan: "kérdőívek", darab: kritikus,
      mit: "kritikus tétel, ami az összpontszámtól függetlenül szól" },
  ];
  return { tetelek, osszes: tetelek.reduce((n, t) => n + t.darab, 0) };
}
