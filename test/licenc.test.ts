/**
 * A MÉRŐESZKÖZÖK LICENCELÉSE — a 12. lépés gépi fele.
 *
 * A tesztek hat szabályt védenek:
 *
 *   1. a lépés KÉTKIMENETŰ: licenc VAGY leírt döntés, hogy nem használjuk;
 *   2. a kaput NYILVÁNTARTÁS nyitja, nem az `itemText` jelölés;
 *   3. a licenc LEJÁR — és a kapu naptárt néz, előre;
 *   4. az eszköz megváltozása elavulttá teszi a licencet;
 *   5. a lejárt licenc a MÚLTAT nem törli: a már felvett adat érvényes marad;
 *   6. az elutasítás OKA megnevezve jön vissza.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import type { Instrument } from "../core/kerdoiv/types.ts";
import {
  ELOJELZES_NAP, eszkozAllapot, felvehetoseg, lenyeg, lenyomat, loadLicencek,
  merleg, validateLicencek,
} from "../core/kerdoiv/licenc.ts";
import type { LicencKatalogus } from "../core/kerdoiv/licenc.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const INST = loadInstruments(join(HERE, "..", "registry", "kerdoivek"));
const ALL = INST.all();
const KAT = loadLicencek(join(HERE, "..", "registry", "kerdoivek", "licencek.json"));
const MA = "2026-09-07";

const EPDS = () => INST.get("inst.epds")!;
const masol = (i: Instrument): Instrument => JSON.parse(JSON.stringify(i));

function licenccel(i: Instrument, lejar: string | null): LicencKatalogus {
  return {
    szerepek: {}, dontesek: [],
    licencek: [{
      inst: i.id, jogosult: "Royal College of Psychiatrists", azonosito: "LIC-2026-01",
      hatokor: "egy intézmény, egy kutatás, magyar nyelv, 500 beteg",
      kelt: "2026-01-01", lejar, ki: "dr. Teszt Kutatásvezető", szerep: "kutatasvezeto",
      lenyomat: lenyomat(lenyeg(i)),
    }],
  };
}

/* ── 1. A KÉT KIMENET ───────────────────────────────────────────────── */

test("a rendezetlen eszköz megnevezi, hogy a NYITVA MARADÁS nem válasz", () => {
  const a = eszkozAllapot(EPDS(), KAT, MA);
  assert.equal(a.allapot, "rendezetlen");
  assert.equal(a.rendezett, false);
  assert.match(a.miert, /nem válasz/);
});

test("A LEÍRT DÖNTÉS UGYANÚGY RENDEZ, mint a licenc", () => {
  const kat: LicencKatalogus = {
    szerepek: {}, licencek: [],
    dontesek: [{
      inst: "inst.whodas12", hatarozat: "nem-hasznaljuk",
      indoklas: "A funkcionális állapotot a WHODAS-12 helyett az EQ-5D-5L méri, " +
                "és két átfedő eszköz felvétele terheli a beteget.",
      helyette: "inst.eq5d5l", ki: "dr. Teszt", szerep: "kutatasvezeto", mikor: "2026-09-07",
    }],
  };
  const a = eszkozAllapot(INST.get("inst.whodas12")!, kat, MA);
  assert.equal(a.allapot, "nem-hasznaljuk");
  assert.equal(a.rendezett, true, "rendezett — de NEM felvehető");
  assert.equal(a.felveheto, false);
  assert.match(a.miert, /nem kudarc, hanem érvényes válasz/);
  assert.equal(merleg(ALL, kat, MA).rendezett, 2);
});

test("a döntés INDOKLÁS nélkül nem döntés", () => {
  const kat: LicencKatalogus = {
    szerepek: {}, licencek: [],
    dontesek: [{ inst: "inst.latch", hatarozat: "nem-hasznaljuk", indoklas: "  ",
                 ki: "dr. Teszt", szerep: "kutatasvezeto", mikor: "2026-09-07" }],
  };
  const hibak = validateLicencek(ALL, kat, MA).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /fél év múlva valaki újrakezdi/);
});

test("licenc ÉS döntés ugyanarra az eszközre építési hiba", () => {
  const kat = licenccel(EPDS(), null);
  kat.dontesek = [{ inst: "inst.epds", hatarozat: "nem-hasznaljuk",
    indoklas: "nem kell", ki: "dr. Teszt", szerep: "kutatasvezeto", mikor: "2026-09-07" }];
  const hibak = validateLicencek(ALL, kat, MA).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /kizárja egymást/.test(h.message)));
});

/* ── 2. A KAPUT NYILVÁNTARTÁS NYITJA ────────────────────────────────── */

test("AZ `itemText: \"loaded\"` JELÖLÉS ÖNMAGÁBAN NEM NYIT KAPUT", () => {
  // Ez volt a lyuk, hatodszorra: egy szó átírása a JSON-ban, és a védett
  // szöveg felvehetővé válik — anélkül, hogy bárki megszerezte volna a jogot.
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  const a = eszkozAllapot(i, KAT, MA);
  assert.equal(a.allapot, "igazolatlan");
  assert.equal(a.felveheto, false);
  assert.match(a.miert, /nem formai hiba/);

  const hibak = validateLicencek([i], KAT, MA).filter((x) => x.severity === "error");
  assert.equal(hibak.length, 1);
});

test("nyilvántartott licenccel a kapu kinyílik", () => {
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  const a = eszkozAllapot(i, licenccel(i, "2027-12-31"), MA);
  assert.equal(a.allapot, "licencelt");
  assert.equal(a.felveheto, true);
  assert.match(a.miert, /hatókör/);
});

test("NYILVÁNTARTÁS NÉLKÜL A VÁLASZ FAIL-SAFE", () => {
  // A meg nem mutatott licenc nem licenc: nyilvántartás nélkül csak a
  // szabadon használható szövegű eszköz vehető fel.
  assert.equal(INST.administrable("inst.whooley").ok, true);
  assert.equal(INST.administrable("inst.epds").ok, false);
  assert.equal(INST.administrable("inst.epds").allapot, "rendezetlen");
});

/* ── 3. A LICENC LEJÁR ──────────────────────────────────────────────── */

test("A LEJÁRT LICENC ZÁRJA A KAPUT — és a lejárat nem a mi hibánk", () => {
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  const a = eszkozAllapot(i, licenccel(i, "2026-06-01"), MA);
  assert.equal(a.allapot, "lejart");
  assert.equal(a.felveheto, false);
  assert.equal(a.rendezett, false);
  assert.match(a.miert, /A már felvett adat érvényes marad/);
  assert.equal(validateLicencek([i], licenccel(i, "2026-06-01"), MA)
    .filter((x) => x.severity === "error").length, 1);
});

test("a kapu NAPTÁRT NÉZ, és 90 nappal előre szól", () => {
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  // 30 nap múlva jár le: még érvényes, de a megújítás MOST teendő.
  const kat = licenccel(i, "2026-10-07");
  const a = eszkozAllapot(i, kat, MA);
  assert.equal(a.allapot, "licencelt");
  assert.equal(a.felveheto, true, "még érvényes");
  assert.equal(a.napMulva, 30);
  assert.match(a.miert, /MOST teendő/);

  const w = validateLicencek([i], kat, MA).filter((x) => /nap múlva lejár/.test(x.message));
  assert.equal(w.length, 1);
  assert.equal(w[0].severity, "warning");
  assert.equal(merleg([i], kat, MA).lejarKozel, 1);
});

test("az előjelzési ablakon kívül nincs figyelmeztetés", () => {
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  const kat = licenccel(i, "2027-12-31");
  assert.equal(validateLicencek([i], kat, MA)
    .filter((x) => /nap múlva lejár/.test(x.message)).length, 0);
  assert.ok(ELOJELZES_NAP === 90);
});

test("a határozatlan idejű licenc nem jár le", () => {
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  const a = eszkozAllapot(i, licenccel(i, null), MA);
  assert.equal(a.allapot, "licencelt");
  assert.equal(a.napMulva, null);
  assert.match(a.miert, /Határozatlan idejű/);
});

/* ── 4. AZ ESZKÖZ MEGVÁLTOZÁSA ──────────────────────────────────────── */

test("EGY PONTÉRTÉK ÁTÍRÁSA ELAVULTTÁ TESZI A LICENCET", () => {
  const i = masol(EPDS());
  i.itemText.status = "loaded";
  const kat = licenccel(i, null);
  i.items[0].options[0].score = 9;
  const a = eszkozAllapot(i, kat, MA);
  assert.equal(a.allapot, "elavult");
  assert.match(a.miert, /nem az az eszköz/);
});

test("a vágóérték és a kritikus tétel is a lenyomat része", () => {
  for (const modosit of [
    (i: Instrument) => { i.bands.default[0].max = 99; },
    (i: Instrument) => { i.criticalItem = null; },
    (i: Instrument) => { i.items[0].index = 99; },
    (i: Instrument) => { i.translation.status = "none"; },
  ]) {
    const i = masol(EPDS());
    modosit(i);
    assert.notEqual(lenyomat(lenyeg(i)), lenyomat(lenyeg(EPDS())));
  }
});

test("a saját leíró szövegünk javítása NEM veszi el a licencet", () => {
  const i = masol(EPDS());
  i.label = { hu: "Edinburgh-i szülés utáni depresszió skála" };
  i.documentation = { pitfalls: { hu: "átfogalmazva" } };
  assert.equal(lenyomat(lenyeg(i)), lenyomat(lenyeg(EPDS())));
});

/* ── 5. A KAPU A FELVÉTELRE VONATKOZIK, NEM A MÚLTRA ────────────────── */

test("a máshol felvett eszköz eredménye a kapu mögött is értékelhető", () => {
  let st: CaseState =
    ({ ctx: { encounter: "outpatient", now: "2026-09-07T10:00:00.000Z" },
       values: {}, errors: [] } as CaseState);
  const t = { t: "2026-09-07T10:00:00.000Z", provenance: "clinician" as const };
  for (const q of EPDS().items) st = setValue(REG, st, q.variable, 1, t);

  assert.equal(INST.administrable("inst.epds").ok, false, "felvenni nem lehet");
  assert.equal(INST.score(REG, st, "inst.epds").status, "ok", "de a meglévő adat értékelhető");
});

/* ── 6. AZ OK MEGNEVEZVE ────────────────────────────────────────────── */

test("AZ ISMERETLEN ESZKÖZ NEM UGYANAZ, MINT A NINCS LICENC", () => {
  // E nélkül egy elrontott hívás olyan tesztet visz át, ami a kaput hivatott
  // bizonyítani — pontosan ez történt a LATCH tesztjével.
  assert.equal(felvehetoseg(undefined, KAT, MA).allapot, "ismeretlen");
  assert.match(felvehetoseg(undefined, KAT, MA).miert, /hívási hiba, nem licenckérdés/);
  assert.equal(felvehetoseg(EPDS(), KAT, MA).allapot, "rendezetlen");
});

/* ── 7. A KIINDULÓ ÁLLAPOT ──────────────────────────────────────────── */

test("a valódi nyilvántartás az elvárt állapotban indul", () => {
  assert.equal(KAT.licencek.length, 0);
  assert.equal(KAT.dontesek.length, 0);
  const m = merleg(ALL, KAT, MA);
  assert.equal(m.osszes, 10);
  assert.equal(m.rendezett, 1, "csak a közkincs Whooley");
  assert.equal(m.rendezetlen, 9);
  assert.equal(m.felveheto, 1);
  assert.equal(m.validaltForditas, 1);
  assert.equal(validateLicencek(ALL, KAT, MA).filter((i) => i.severity === "error").length, 0);
});

test("a felvehető eszköz nem validált fordítása külön figyelmeztetés", () => {
  // A Whooley szövege közkincs, a magyar fordítása viszont nem validált: az
  // eszköz felvehető, de a vele gyűjtött adat publikálhatósága korlátozott.
  const w = validateLicencek(ALL, KAT, MA)
    .filter((i) => i.id === "inst.whooley" && /publikálhatósága korlátozott/.test(i.message));
  assert.equal(w.length, 1);
});

test("a licenckísérő fájl nem lesz mérőeszköz, de az elgépelt fájl hangos hiba", () => {
  // NÉVVEL ismerjük fel a kísérőt. Ha alak szerint tennénk, egy elgépelt
  // mérőeszközfájl CSENDBEN kiesne a betöltésből.
  assert.equal(ALL.length, 10);
  assert.equal(ALL.some((i) => i.id === undefined), false);
});
