/**
 * FEDÉSKERESŐ — mely mezők fedik ugyanazt.
 *
 * A rendszer visszatérő hibacsaládja, hogy ugyanaz a klinikai tény több
 * változóban él, és a rétegek külön-külön nézik őket. Eddig egyenként bukkantak
 * fel: a Bishop-pontszám összetevői, a magzatvízmennyiség, az éhomi vércukor
 * két küszöbbel, az allergia öt mezőben három modulban.
 *
 * MINDIG UTÓLAG DERÜLT KI, ÉS MINDIG VALAKI ÉSZREVETTE. Ez a szkript azt
 * kérdezi meg gépileg, hol vannak a TÖBBIEK.
 *
 * NÉGY JEL, ÉS EGYIK SEM BIZONYÍTÉK ÖNMAGÁBAN:
 *
 *   azonos szabványkód   ugyanaz a LOINC/SNOMED két mezőn
 *   azonos kódlista      bájtra ugyanaz a valueSet
 *   azonos egység + név  ugyanaz a mértékegység és átfedő címke
 *   azonos utótag        `*.allergy`, `*.bishop.*` — a névadás elárulja
 *
 * A találat JELÖLT, nem ítélet. Két mező lehet jogosan hasonló (a bal és a jobb
 * oldali arteria uterina PI-je ugyanaz a mérés két oldalon), és lehet valódi
 * duplikátum. A különbséget EMBER dönti el — a szkript dolga az, hogy a kérdés
 * feltevődjön.
 */
import { readFileSync } from "node:fs";
import { loadRegistry } from "../core/load.ts";
import type { VariableDef } from "../core/types.ts";

interface Jelolt {
  a: string;
  b: string;
  jelek: string[];
  suly: number;
}

const reg = loadRegistry("registry/variables");
const mind = reg.all().filter((v) => !v.aliasOf && v.status === "active");

/*
 * A JELEK FINOMÍTÁSA — mert az első futás 249 párt talált, és a többsége zaj.
 *
 * Minden pontszám `{pont}` egységben van, és mindegyik címkéjében ott a
 * „pontszám” szó: az EPDS-összpont és az Apgar így „azonos egység + közös
 * címkeszó” párnak látszott. Ugyanígy minden oldaliság-mező `side` utótagot
 * visel. Ezek nem fedések, hanem KÖZÖS NYELVTAN.
 *
 * A javítás elve: EGY JEL CSAK AKKOR ÉR VALAMIT, HA RITKA. Egy címkeszó, ami
 * negyven változóban ott van, nem bizonyít semmit; egy, ami kettőben, igen.
 */

/** Egységek, amik nem analitot jelölnek, csak a szám fajtáját. */
const SEMLEGES_EGYSEG = new Set(["{pont}", "{score}", "1", "%", "", "kod", "{kód}"]);

/** Utótagok, amik minden modulban ugyanígy hangzanak — nem fedésjel. */
const SEMLEGES_UTOTAG = new Set([
  "total", "side", "dose", "date", "time", "note", "other", "unit", "amount",
  "type", "result", "value", "count", "score", "reason", "method", "status",
  "present", "start", "end", "level", "grade", "site", "source",
]);

/** A címke jelentéshordozó szavai — a rövid töltelékszavak nem számítanak. */
function szavak(v: VariableDef): Set<string> {
  const t = `${v.label?.hu ?? ""} ${v.label?.en ?? ""}`.toLowerCase();
  return new Set(t.split(/[^a-záéíóöőúüű]+/).filter((w) => w.length > 4));
}

/* A szavak GYAKORISÁGA a teljes regiszterben — ez teszi a jelet ritkává. */
const szoGyakorisag = new Map<string, number>();
for (const v of mind) {
  for (const w of szavak(v)) szoGyakorisag.set(w, (szoGyakorisag.get(w) ?? 0) + 1);
}
/** Ennél többször előforduló szó közös nyelvtan, nem fedésjel. */
const RITKA_HATAR = 6;

function ritkaKozos(a: VariableDef, b: VariableDef): string[] {
  const sb = szavak(b);
  return [...szavak(a)].filter((w) => sb.has(w) && (szoGyakorisag.get(w) ?? 0) <= RITKA_HATAR);
}

/** Az azonosító utolsó eleme — a névadás gyakran elárulja a fedést. */
const utotag = (id: string) => id.split(".").slice(-1)[0].toLowerCase();

const jeloltek: Jelolt[] = [];
for (let i = 0; i < mind.length; i++) {
  for (let j = i + 1; j < mind.length; j++) {
    const a = mind[i], b = mind[j];
    const jelek: string[] = [];
    let suly = 0;

    const sa = a.standards ?? {}, sb = b.standards ?? {};
    for (const rendszer of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
      const ka = (sa as Record<string, unknown>)[rendszer];
      const kb = (sb as Record<string, unknown>)[rendszer];
      if (ka && kb && ka === kb) {
        jelek.push(`azonos ${rendszer}: ${String(ka)}`);
        suly += 5;
      }
    }

    if (a.valueSet?.length && b.valueSet?.length) {
      const ka = a.valueSet.map((o) => String(o.code)).sort().join("|");
      const kb = b.valueSet.map((o) => String(o.code)).sort().join("|");
      if (ka === kb && a.valueSet.length >= 3) {
        jelek.push(`azonos kódlista (${a.valueSet.length} érték)`);
        suly += 3;
      }
    }

    const kozos = ritkaKozos(a, b);
    const egysegSzamit = !!a.unit && a.unit === b.unit
      && !SEMLEGES_EGYSEG.has(a.unit.toLowerCase());
    if (egysegSzamit && kozos.length >= 1) {
      jelek.push(`azonos egység (${a.unit}) és ritka közös szó: ${kozos.join(", ")}`);
      suly += 2 + kozos.length * 2;
    } else if (kozos.length >= 2) {
      jelek.push(`ritka közös címkeszavak: ${kozos.join(", ")}`);
      suly += kozos.length * 2;
    }

    const ua = utotag(a.id), ub = utotag(b.id);
    if (ua === ub && !SEMLEGES_UTOTAG.has(ua)
        && a.id.split(".")[0] !== b.id.split(".")[0]) {
      jelek.push(`azonos utótag (${ua}), KÜLÖNBÖZŐ modulban`);
      suly += 3;
    }

    if (suly >= 4) jeloltek.push({ a: a.id, b: b.id, jelek, suly });
  }
}

jeloltek.sort((x, y) => y.suly - x.suly);

/* A már ELDÖNTÖTT párok — ezeket nem kérdezzük újra. */
interface Dontes { a: string; b: string; itelet: "fedes" | "kulon"; miert: string }
let dontesek: Dontes[] = [];
try {
  dontesek = JSON.parse(readFileSync("registry/fedes/dontesek.json", "utf8")).dontesek;
} catch { /* még nincs */ }
const eldontott = new Set(dontesek.map((d) => [d.a, d.b].sort().join("|")));

const nyitott = jeloltek.filter((j) => !eldontott.has([j.a, j.b].sort().join("|")));

console.log(`${mind.length} aktív változó · ${jeloltek.length} jelölt pár · ` +
  `${eldontott.size} eldöntve · ${nyitott.length} NYITOTT\n`);
for (const j of nyitott.slice(0, 40)) {
  console.log(`[${String(j.suly).padStart(2)}] ${j.a}  ↔  ${j.b}`);
  console.log(`     ${j.jelek.join(" · ")}`);
}
if (nyitott.length > 40) console.log(`\n… és további ${nyitott.length - 40}.`);
