/**
 * A KAPU MÖGÖTTI KALKULÁTOROK — a 8. lépés gépi fele.
 *
 * Itt a hitelesítés tárgya KÓD, nem adat: a konstansok egy függvény törzsében
 * állnak. Ezek a tesztek azt bizonyítják, hogy az aláírás pontosan azt fedi,
 * ami a beteghez eljut — az együtthatót és az EGYSÉGET.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CALCULATORS } from "../core/calc/defs.ts";
import type { CalcDef } from "../core/calc/types.ts";
import {
  alkalmazKalk, elcsuszas, kalkAllapot, konstansok, lenyeg, lenyomat,
  loadKalkHitelesitesek, loadOrokolt, monotonJelzesek, orokoltAllas,
  validateKalkHitelesitesek,
} from "../core/calc/hitelesites.ts";
import type { KalkHitelesitesKatalogus } from "../core/calc/hitelesites.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (...p: string[]) => join(HERE, "..", ...p);
const KAT = loadKalkHitelesitesek(R("registry", "kalkulatorok", "hitelesitesek.json"));
const OROKOLT = loadOrokolt(R("registry", "kalkulatorok", "orokolt.json"));

/** Másolat, hogy az `alkalmazKalk` ne szennyezze a többi tesztet. */
const masol = (c: CalcDef): CalcDef => ({ ...c, output: { ...c.output } });
const kapuMogott = () => CALCULATORS.filter((c) => !c.verified).map(masol);

const ures = (): KalkHitelesitesKatalogus => ({ szerepek: KAT.szerepek, hitelesitesek: [] });

function alairva(cs: CalcDef[], id = "calc.crcl",
                 extra: Record<string, unknown> = {}): KalkHitelesitesKatalogus {
  const c = cs.find((x) => x.id === id)!;
  return {
    szerepek: KAT.szerepek,
    hitelesitesek: [{
      calc: id, ki: "dr. Példa Pál", szerep: "nefrologus", mikor: "2026-09-25",
      lenyomat: lenyomat(lenyeg(c)),
      forrasTabla: "Cockcroft & Gault 1976",
      osszevetettKonstansok: konstansok(String(c.fn)),
      ...extra,
    }],
  };
}

/* ── ALAPÁLLAPOT ─────────────────────────────────────────────────────── */

test("a kapu mögötti kalkulátorok közül egy sincs aláírva", () => {
  // A SZÁM A KÉSZLETBŐL JÖN. Egy rögzített darabszám minden új kalkulátornál
  // elbukna, és a teszt akkor nem hibát jelezne, csak elavulna — miközben a
  // tétel, amit véd, változatlan: az aláírásból nulla.
  const cs = kapuMogott();
  assert.ok(cs.length >= 7, `${cs.length} kalkulátor áll kapu mögött`);
  assert.deepEqual(KAT.hitelesitesek, []);
  const o = orokoltAllas(CALCULATORS, KAT, OROKOLT);
  assert.equal(o.kapuMogott, cs.length);
  assert.equal(o.alairt, 0, "aláírás nélkül egyik sem ad számot");
});

/* ── A LENYOMAT AZ EGYSÉGET IS FEDI ──────────────────────────────────── */

test("az EGYSÉG megváltoztatása elavulttá teszi az aláírást", () => {
  // Az eGFR függvénye µmol/L-t vár és 88,4-gyel oszt. Ha a deklarált egység
  // mg/dL-re változna a kód érintése nélkül, az eredmény csendben 88-szor
  // téves lenne — a lenyomatnak ezt meg kell fognia.
  const cs = kapuMogott();
  const egfr = cs.find((c) => c.id === "calc.egfr.ckdepi2021")!;
  const elotte = lenyomat(lenyeg(egfr));
  egfr.inputs = egfr.inputs.map((i) =>
    i.id === "lab.cr" ? { ...i, unit: "mg/dL" } : i);
  assert.notEqual(lenyomat(lenyeg(egfr)), elotte,
    "az egység a lenyomat része — enélkül a csendes 88-szoros tévedés átcsúszna");
});

test("EGYETLEN együttható átírása elavulttá teszi az aláírást", () => {
  const cs = kapuMogott();
  const kat = alairva(cs);
  const c = cs.find((x) => x.id === "calc.crcl")!;
  c.fn = ((a: number, b: number, w: number) => (141 - a) * w / b) as CalcDef["fn"];
  const a = kalkAllapot(cs, kat).find((x) => x.calc === "calc.crcl")!;
  assert.equal(a.allapot, "elavult");
  assert.equal(alkalmazKalk(cs, kat), 0);
});

test("a MEGJEGYZÉS és a forrásidézet javítása NEM rontja el az aláírást", () => {
  const cs = kapuMogott();
  const kat = alairva(cs);
  const c = cs.find((x) => x.id === "calc.crcl")!;
  c.source = { ...c.source, cite: "ugyanaz a közlemény, pontosabb hivatkozással" };
  c.caveats = { hu: "pontosított figyelmeztetés" };
  assert.equal(kalkAllapot(cs, kat).find((x) => x.calc === "calc.crcl")!.allapot,
    "hitelesitve");
});

/* ── A TÉTELES ÖSSZEVETÉS ────────────────────────────────────────────── */

test("hiányos konstanslista BUILD-HIBA — a „megnéztem” nem ellenőrizhető", () => {
  const cs = kapuMogott();
  const kat = alairva(cs, "calc.crcl", { osszevetettKonstansok: ["140"] });
  const issues = validateKalkHitelesitesek(cs, kat, OROKOLT);
  assert.ok(issues.some((i) => i.severity === "error" && /hallgat/.test(i.message)));
});

test("teljes konstanslistával az aláírás érvényes, és nyitja a kaput", () => {
  const cs = kapuMogott();
  const kat = alairva(cs);
  assert.deepEqual(
    validateKalkHitelesitesek(cs, kat, OROKOLT).filter((i) => i.severity === "error"), []);
  assert.equal(alkalmazKalk(cs, kat), 1);
  assert.equal(cs.find((c) => c.id === "calc.crcl")!.verified, true);
});

/* ── A NEM MONOTON PONTSOR ───────────────────────────────────────────── */

test("a nem növekvő pontsort a gép megnevezi — de nem javítja és nem vádol", () => {
  const dic = kapuMogott().find((c) => c.id === "calc.isth.dic.pregnancy")!;
  const j = monotonJelzesek(dic);
  assert.equal(j.length, 1);
  assert.equal(j[0].komponens, "p");
  assert.deepEqual(j[0].pontok, [0, 1, 2, 1],
    "a <50 thrombocyta 1 pontot ér, az 50–100 kettőt");
  assert.match(j[0].miert, /csak az elsődleges közlemény dönti el/);
});

test("nem monoton pontsort MEGJEGYZÉS nélkül nem lehet aláírni", () => {
  const cs = kapuMogott();
  const dic = cs.find((c) => c.id === "calc.isth.dic.pregnancy")!;
  const alap = {
    calc: dic.id, ki: "dr. Példa Hanna", szerep: "hematologus", mikor: "2026-09-25",
    lenyomat: lenyomat(lenyeg(dic)), forrasTabla: "Erez 2014, Table 3",
    osszevetettKonstansok: konstansok(String(dic.fn)),
  };
  const nelkule: KalkHitelesitesKatalogus =
    { szerepek: KAT.szerepek, hitelesitesek: [alap] };
  assert.ok(validateKalkHitelesitesek(cs, nelkule, OROKOLT)
    .some((i) => i.severity === "error" && /NEM NÖVEKVŐ/.test(i.message)));

  const vele: KalkHitelesitesKatalogus = {
    szerepek: KAT.szerepek,
    hitelesitesek: [{ ...alap, megjegyzes: "A közlemény 3. táblája tényleg így adja." }],
  };
  assert.deepEqual(
    validateKalkHitelesitesek(cs, vele, OROKOLT).filter((i) => /NEM NÖVEKVŐ/.test(i.message)),
    []);
});

test("a monotonitás-vizsgálat csak pontozó kalkulátorra fut", () => {
  const efw = kapuMogott().find((c) => c.id === "calc.efw.hadlock")!;
  assert.equal(efw.kind, "formula");
  assert.deepEqual(monotonJelzesek(efw), []);
});

/* ── AZ ELCSÚSZÁS-FIGYELŐ ────────────────────────────────────────────── */

test("az elcsúszás-figyelő a sávhatárt NEM jelzi eltérésként", () => {
  const dic = kapuMogott().find((c) => c.id === "calc.isth.dic.pregnancy")!;
  // A 26-os vágóérték a sávokban áll, nem a képletben — ez nem elcsúszás.
  assert.ok(!elcsuszas(dic).csakProzaban.includes("26"));
});

test("egy elgépelt együttható elcsúszásként megjelenik", () => {
  const cs = kapuMogott();
  const c = cs.find((x) => x.id === "calc.efw.hadlock")!;
  c.fn = ((a: number, b: number, d: number, e: number) =>
    1.3596 + 0.0424 * a + 0.174 * b + 0.9999 * d + e) as CalcDef["fn"];
  assert.ok(elcsuszas(c).csakKodban.includes("0.9999"),
    "ami a kódban van, de a leírásban nincs, az felszínre kerül");
});

/* ── AZ ÖRÖKLÖTT LISTA ───────────────────────────────────────────────── */

test("az öröklött tétel FIGYELMEZTETÉS, nem hiba — megnevezett adósság", () => {
  const issues = validateKalkHitelesitesek(CALCULATORS, KAT, OROKOLT);
  assert.deepEqual(issues.filter((i) => i.severity === "error"), []);
  const w = issues.filter((i) => /ÖRÖKLÖTT/.test(i.message));
  assert.equal(w.length, OROKOLT.orokolt.length);
});

test("a listán KÍVÜLI új `verified: true` BUILD-HIBA", () => {
  const cs = CALCULATORS.map(masol);
  const uj = cs.find((c) => c.id === "calc.crcl")!;
  uj.verified = true;                       // aláírás nélkül, listán kívül
  const issues = validateKalkHitelesitesek(cs, KAT, OROKOLT);
  assert.ok(issues.some((i) => i.severity === "error"
    && i.id === "calc.crcl" && /ÖRÖKLÖTT listán sincs/.test(i.message)));
});

test("az öröklött lista minden tétele létező, `verified` kalkulátor", () => {
  for (const id of OROKOLT.orokolt) {
    const c = CALCULATORS.find((x) => x.id === id);
    assert.ok(c, `${id}: nem létező kalkulátor`);
    assert.equal(c!.verified, true, `${id}: nem verified — mit keres a listán`);
  }
});

test("az öröklött szám csökken, ha valaki aláír egy öröklött tételt", () => {
  const elotte = orokoltAllas(CALCULATORS, KAT, OROKOLT).orokolt;
  const kat: KalkHitelesitesKatalogus = {
    szerepek: KAT.szerepek,
    hitelesitesek: [{
      calc: OROKOLT.orokolt[0], ki: "X", szerep: "szuleszet", mikor: "2026-09-25",
      lenyomat: "0", forrasTabla: "t", osszevetettKonstansok: [],
    }],
  };
  assert.equal(orokoltAllas(CALCULATORS, kat, OROKOLT).orokolt, elotte - 1,
    "ez a szám a 8. lépés valódi haladásmérője");
});
