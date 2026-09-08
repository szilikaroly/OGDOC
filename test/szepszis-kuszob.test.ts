/**
 * A SZEPSZISKÜSZÖBÖK ÉS AZ omqSOFA-ELTÉRÉS — a 9. lépés gépi fele.
 *
 * A tesztek NEM a küszöbszámokat védik: azok hitelesítésre várnak, és a
 * lépés épp arról szól, hogy két forrás két számot ad. Amit védenek, az öt
 * szerkezeti szabály:
 *
 *   1. az eltérés a KÉT ÉLŐ DEFINÍCIÓBÓL vezetődik le, nem prózából;
 *   2. két forrás csak ott mérhető össze, ahol ugyanazt méri;
 *   3. a riasztási kapu ALÁÍRÁSBÓL nyílik, nem jelölésből;
 *   4. az aláírás TÉTELES, és a küszöb elmozdulása elavulttá teszi;
 *   5. a döntés eltárolható, elavulhat, és NEM csendesíti el a másik forrást.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";
import { CALCULATORS } from "../core/calc/defs.ts";
import type { CalcDef } from "../core/calc/types.ts";
import { assess, loadProtocol } from "../core/szepszis/screen.ts";
import type { SepsisProtocol } from "../core/szepszis/types.ts";
import {
  cimkeElcsuszasok, dontesAllapot, elteresLenyomat, eltereseK, idobeliJelzok,
  kodKuszobok, kriteriumKuszobei, kuszobAllapot, kuszobJel, lenyeg, lenyomat,
  loadKuszobDontes, loadKuszobHitelesitesek, merleg, protokollKuszobei,
  riasztasEngedve, validateKuszobok,
} from "../core/szepszis/kuszob.ts";
import type { KuszobDontes, KuszobKatalogus } from "../core/szepszis/kuszob.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const P = loadProtocol(join(HERE, "..", "registry", "szepszis", "cmqcc-ob-szepszis.json"));
const KAT = loadKuszobHitelesitesek(
  join(HERE, "..", "registry", "szepszis", "kuszob-hitelesitesek.json"));
const DONTES = loadKuszobDontes(
  join(HERE, "..", "registry", "szepszis", "kuszob-dontes.json"));

const masol = (p: SepsisProtocol): SepsisProtocol => JSON.parse(JSON.stringify(p));

/** Érvényes aláírás a MOSTANI magra, minden küszöbre kiterjedően. */
function alairva(p: SepsisProtocol): KuszobKatalogus {
  return {
    szerepek: {},
    hitelesitesek: [{
      protokoll: p.id, ki: "Teszt Aláíró", szerep: "szuleszet", mikor: "2026-09-07",
      lenyomat: lenyomat(lenyeg(p)),
      forrasTabla: "CMQCC OB Sepsis Toolkit, 2. táblázat",
      osszevetettKuszobok: protokollKuszobei(p).map(kuszobJel),
    }],
  };
}

/* ── 1. AZ ELTÉRÉS LEVEZETVE, NEM PRÓZÁBÓL ──────────────────────────── */

test("a küszöb a FUTÓ KÓDBÓL olvasódik ki, változóra kötve", () => {
  const om = CALCULATORS.find((c) => c.id === "calc.omqsofa")!;
  const k = kodKuszobok(om);
  // A paraméternevek (pulse, rr, temp, spo2) pozíció szerint a deklarált
  // bemenetekre képződnek — enélkül a két forrás nem összemérhető.
  const pulse = k.find((x) => x.var === "vitals.pulse")!;
  assert.equal(pulse.irany, "gt");
  assert.equal(pulse.ertek, 90);
  assert.equal(k.filter((x) => x.var === "vitals.temp").length, 2,
    "a két külön feltétel két határra bomlik");
});

test("a tartományon kívüliség és a két külön feltétel UGYANAZ a két határ", () => {
  const temp = P.screen.criteria.find((c) => c.id === "sep.crit.temp")!;
  const k = kriteriumKuszobei(temp).map((x) => `${x.irany}${x.ertek}`).sort();
  assert.deepEqual(k, ["gt38", "lt36"]);

  // Ezért mond a két forrás a testhőről UGYANAZT, noha másképp írták le.
  const e = eltereseK(P, CALCULATORS).filter((x) => x.var === "vitals.temp");
  assert.equal(e.length, 2);
  assert.ok(e.every((x) => x.fajta === "egyezik"),
    "a naiv összehasonlító itt eltérést jelentene — nincs eltérés");
});

test("a két valódi eltérés levezetve áll elő: légzésszám és pulzus", () => {
  const nyitott = eltereseK(P, CALCULATORS).filter((e) => e.fajta === "elter");
  assert.equal(nyitott.length, 2);
  const rr = nyitott.find((e) => e.var === "vitals.rr")!;
  assert.equal(rr.protokoll, 24);
  assert.equal(rr.kalkulator, 20);
  assert.equal(rr.calc, "calc.omqsofa");
  assert.match(rr.miert, /A szigorúbb \(20\)/);
});

test("A LEVEZETÉS KÖVETI A KÜSZÖBÖT, A PRÓZA NEM — ez a lépés lényege", () => {
  const p = masol(P);
  const rr = p.screen.criteria.find((c) => c.id === "sep.crit.rr")!;
  rr.value = 22;

  // A levezetett lista magától mozdul.
  const e = eltereseK(p, CALCULATORS).find((x) => x.var === "vitals.rr")!;
  assert.equal(e.protokoll, 22, "a levezetés az élő definíciót olvassa");

  // A kézzel írt mondat viszont változatlanul „> 24 vs > 20”-at hirdet, és ezt
  // a rendszer immár HIBÁNAK mondja — nem hagyja, hogy a próza hazudjon.
  const hibak = validateKuszobok(p, CALCULATORS, KAT, DONTES)
    .filter((i) => i.severity === "error" && /elavult/.test(i.message));
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /22/);
});

test("két forrás csak ott mérhető össze, ahol UGYANAZT méri", () => {
  // A vérzési stádiumbesorolás is rokon kalkulátor, de a becsült
  // vérveszteségről szól: egyetlen sorral sem szabad megjelennie.
  const van = eltereseK(P, CALCULATORS).some((e) => e.calc === "calc.cmqcc.stage");
  assert.equal(van, false, "közös változó nélkül az összevetés zaj, nem eltérés");
});

test("a hatóköri különbség NEM eltérés — de látszik", () => {
  const e = eltereseK(P, CALCULATORS);
  const wbc = e.find((x) => x.var === "lab.wbc" && x.fajta === "csakProtokollban");
  assert.ok(wbc, "a gyorsszűrő nem nézi a fehérvérsejtszámot");
  const spo2 = e.find((x) => x.var === "vitals.spo2" && x.fajta === "csakKalkulatorban");
  assert.ok(spo2, "a protokoll nem nézi az oxigénszaturációt");
  assert.match(spo2!.miert, /KIESIK/);
});

/* ── 2. A KAPU ──────────────────────────────────────────────────────── */

test("a riasztási kapu ALÁÍRATLANUL zárva van", () => {
  const k = riasztasEngedve(P, KAT);
  assert.equal(k.engedve, false);
  assert.match(k.miert, /ALÁÍRATLANOK/);
});

test("A JELÖLÉS ÁTÍRÁSA ÖNMAGÁBAN NEM NYITJA KI A KAPUT", () => {
  // Ez volt a lyuk: két szó egy JSON-ban — `verification` és `blocksAlerting` —,
  // és a rendszer riasztani kezdett hitelesítetlen határértékekre.
  const p = masol(P);
  p.verification = "primary";
  p.blocksAlerting = false;

  assert.equal(riasztasEngedve(p, KAT).engedve, false);
  const hibak = validateKuszobok(p, CALCULATORS, KAT, DONTES)
    .filter((i) => i.severity === "error");
  assert.equal(hibak.length, 2, "mindkét jelölés önálló építési hiba");
  assert.ok(hibak.some((h) => /blocksAlerting/.test(h.message)));
  assert.ok(hibak.some((h) => /primary/.test(h.message)));
});

test("aláírással a kapu kinyílik — és a jelölés akkor is tud tiltani", () => {
  const p = masol(P);
  p.blocksAlerting = false;
  const kat = alairva(p);
  assert.equal(riasztasEngedve(p, kat).engedve, true);

  // A tiltás erősebb, mint az engedély: aláírás mellett is le lehet állítani.
  const tiltott = masol(p);
  tiltott.blocksAlerting = true;
  const k = riasztasEngedve(tiltott, alairva(tiltott));
  assert.equal(k.engedve, false);
  assert.match(k.miert, /a tiltás erősebb/);
});

test("a megítélés riasztási kapu NÉLKÜL is elkészül — de nem riaszt", () => {
  let st: CaseState =
    ({ ctx: { encounter: "inpatient", now: "2026-09-03T10:00:00.000Z" },
       values: {}, errors: [] } as CaseState);
  const t = { t: "2026-09-03T10:00:00.000Z", provenance: "clinician" as const };
  st = setValue(REG, st, "vitals.temp", 38.9, t);
  st = setValue(REG, st, "vitals.pulse", 124, t);
  st = setValue(REG, st, "vitals.rr", 28, t);

  // Kapu nélkül hívva a válasz ZÁRVA — nem „valószínűleg szabad”.
  const a = assess(REG, st, P, { pregnancy: "pos" },
    { suspected: true, by: "dr. Teszt", at: "2026-09-03T10:05:00.000Z" });
  assert.equal(a.alerts, false);
  assert.ok(a.gaps.some((g) => /nem adott át riasztási kaput/.test(g)));
  assert.notEqual(a.state, "notRun", "a megítélés attól még elkészül");
});

/* ── 3. AZ ALÁÍRÁS ──────────────────────────────────────────────────── */

test("az aláírás TÉTELES: ami kimarad, arra nem terjed ki", () => {
  const kat = alairva(P);
  kat.hitelesitesek[0].osszevetettKuszobok =
    kat.hitelesitesek[0].osszevetettKuszobok.filter((k) => !k.startsWith("sep.crit.rr"));
  const a = kuszobAllapot(P, kat);
  assert.equal(a.allapot, "hitelesitve");
  assert.deepEqual(a.osszevetetlen, ["sep.crit.rr>24"]);

  const hibak = validateKuszobok(P, CALCULATORS, kat, DONTES)
    .filter((i) => i.severity === "error" && /hallgat/.test(i.message));
  assert.equal(hibak.length, 1);
});

test("EGYETLEN KÜSZÖB ELMOZDÍTÁSA ELAVULTTÁ TESZI AZ ALÁÍRÁST", () => {
  const kat = alairva(P);
  const p = masol(P);
  p.organDysfunction.criteria.find((c) => c.id === "sep.od.lactate")!.value = 4;
  const a = kuszobAllapot(p, kat);
  assert.equal(a.allapot, "elavult");
  assert.equal(riasztasEngedve(p, kat).engedve, false);
});

test("AZ EGYSÉG A LENYOMAT RÉSZE — a néma egységváltás nem maradhat rejtve", () => {
  const p = masol(P);
  p.organDysfunction.criteria.find((c) => c.id === "sep.od.lactate")!.unit = "mg/dL";
  assert.notEqual(lenyomat(lenyeg(p)), lenyomat(lenyeg(P)),
    "a laktát 2-es küszöbe mg/dL-ben 18-szor téves lenne, kódváltozás nélkül");
});

test("a csomag határidői és a gyermekágyi ablak is a lenyomat része", () => {
  for (const modosit of [
    (p: SepsisProtocol) => { p.postpartumWindowDays = 28; },
    (p: SepsisProtocol) => { p.bundle.steps[0].withinMinutes = 180; },
    (p: SepsisProtocol) => { p.escalation.acknowledgeWithinMinutes = 120; },
    (p: SepsisProtocol) => { p.screen.needed = 1; },
  ]) {
    const p = masol(P);
    modosit(p);
    assert.notEqual(lenyomat(lenyeg(p)), lenyomat(lenyeg(P)));
  }
});

test("a CÍMKE javítása NEM veszi el az aláírást — a szám igen", () => {
  const p = masol(P);
  p.screen.criteria[0].label.hu = "Testhőmérséklet a 36–38 °C tartományon kívül";
  p.verificationNote = { hu: "átfogalmazva" };
  assert.equal(lenyomat(lenyeg(p)), lenyomat(lenyeg(P)));
});

/* ── 4. AMIT A GÉP ELŐRE MEGNÉZ ─────────────────────────────────────── */

test("a címke olyan ágat ígér, amit a gép nem értékel ki", () => {
  const e = cimkeElcsuszasok(P).find((x) => x.crit === "sep.crit.wbc")!;
  // „…vagy > 10% éretlen alak” — a felirat harmadik ága, amire nincs kritérium.
  assert.deepEqual(e.csakCimkeben, ["10"]);
  assert.match(e.miert, /NEM ÉRTÉKEL KI/);
});

test("a gép olyan határhoz mér, ami a címkében nem áll", () => {
  const e = cimkeElcsuszasok(P);
  const cr = e.find((x) => x.crit === "sep.od.creat")!;
  // A címke „emelkedés a terhességi alapvonalhoz képest”-et mond, a kód egy
  // rögzített 97 µmol/L-es abszolút határt — épp azt a nem terhes küszöböt,
  // amiről a kritérium saját megjegyzése mondja ki, hogy elrejti a károsodást.
  assert.deepEqual(cr.csakKuszobben, ["97"]);
  assert.ok(e.some((x) => x.crit === "sep.od.bili"));
});

test("„tartósan” — időbeli feltétel, aminek nincs gépi alakja", () => {
  const j = idobeliJelzok(P);
  assert.equal(j.length, 1);
  assert.equal(j[0].crit, "sep.crit.hr");

  // A hiány KITÖLTHETŐ — nem örök panasz.
  const p = masol(P);
  p.screen.criteria.find((c) => c.id === "sep.crit.hr")!.sustained =
    { count: 2, withinMinutes: 30 };
  assert.equal(idobeliJelzok(p).length, 0);
  assert.notEqual(lenyomat(lenyeg(p)), lenyomat(lenyeg(P)),
    "és a kitöltés maga is aláírandó változás");
});

/* ── 5. AZ INTÉZMÉNYI DÖNTÉS ────────────────────────────────────────── */

test("a döntés szándékosan nyitva áll, és a nyitottság megnevezve", () => {
  const d = dontesAllapot(P, CALCULATORS, DONTES);
  assert.equal(d.allapot, "nincs-dontes");
  assert.equal(d.eldontendo, 2);
  assert.match(d.miert, /egyiket sem csendesíti el a másikkal/);

  // Döntés nélkül minden eltérés MEGNEVEZVE áll a validálásban.
  const w = validateKuszobok(P, CALCULATORS, KAT, DONTES)
    .filter((i) => /KÉT KÜSZÖB UGYANARRA A MÉRÉSRE/.test(i.message));
  assert.equal(w.length, 2);
});

test("a döntés DOKUMENTUM nélkül nem döntés", () => {
  const d: KuszobDontes = {
    allapot: "dontve", valasztott: "calc.omqsofa", ki: "dr. Teszt",
    szerep: "szuleszet", mikor: "2026-09-07", dokumentum: null,
    lenyomat: elteresLenyomat(eltereseK(P, CALCULATORS)), indoklas: "korábbi felismerés",
  };
  const hibak = validateKuszobok(P, CALCULATORS, KAT, d).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /DOKUMENTUM nélkül/);
});

test("A DÖNTÉS NEM CSENDESÍTI EL A MÁSIK FORRÁST", () => {
  const d: KuszobDontes = {
    allapot: "dontve", valasztott: "calc.omqsofa", ki: "dr. Teszt",
    szerep: "szuleszet", mikor: "2026-09-07",
    dokumentum: "Intézményi szepszisprotokoll, 2026/3. sz. főigazgatói utasítás",
    lenyomat: elteresLenyomat(eltereseK(P, CALCULATORS)), indoklas: "korábbi felismerés",
  };
  const r = dontesAllapot(P, CALCULATORS, d);
  assert.equal(r.allapot, "dontve");
  assert.equal(r.eldontendo, 2, "az eltérés a döntés után is látszik");
  assert.match(r.miert, /NEM tűnik el/);
  assert.equal(validateKuszobok(P, CALCULATORS, KAT, d)
    .filter((i) => i.severity === "error").length, 0);
});

test("a küszöb elmozdulása ELAVULTTÁ teszi a döntést is", () => {
  const d: KuszobDontes = {
    allapot: "dontve", valasztott: "calc.omqsofa", ki: "dr. Teszt",
    szerep: "szuleszet", mikor: "2026-09-07",
    dokumentum: "Intézményi szepszisprotokoll",
    lenyomat: elteresLenyomat(eltereseK(P, CALCULATORS)), indoklas: "korábbi felismerés",
  };
  const p = masol(P);
  p.screen.criteria.find((c) => c.id === "sep.crit.hr")!.value = 100;
  const r = dontesAllapot(p, CALCULATORS, d);
  assert.equal(r.allapot, "elavult");
  assert.match(r.miert, /arra a képre vonatkozott/);
});

test("ismeretlen forrást választó döntés építési hiba", () => {
  const d: KuszobDontes = {
    allapot: "dontve", valasztott: "calc.nincs.ilyen", ki: "dr. Teszt",
    szerep: "szuleszet", mikor: "2026-09-07", dokumentum: "utasítás",
    lenyomat: elteresLenyomat(eltereseK(P, CALCULATORS)), indoklas: "—",
  };
  const hibak = validateKuszobok(P, CALCULATORS, KAT, d).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /ismeretlen forrást választ/);
});

/* ── 6. A MÉRLEG ────────────────────────────────────────────────────── */

test("a mérleg a mostani állást írja le, és a haladás mozgatja", () => {
  const m = merleg(P, CALCULATORS, KAT, DONTES);
  assert.equal(m.kuszobok, 11);
  assert.equal(m.alairt, 0);
  assert.equal(m.eltero, 2);
  assert.equal(m.dontve, false);
  assert.equal(m.riaszt, false);

  const m2 = merleg(P, CALCULATORS, alairva(P), DONTES);
  assert.equal(m2.alairt, 11, "az aláírás mozdítja a számot");
});

test("a valódi regiszterfájlok az elvárt állapotban indulnak", () => {
  assert.equal(KAT.hitelesitesek.length, 0, "a katalógus szándékosan üres");
  assert.equal(DONTES.allapot, "nincs-dontes");
  assert.equal(DONTES.lenyomat, null);
  assert.equal(P.blocksAlerting, true);
  assert.notEqual(P.verification, "primary");
  assert.equal(validateKuszobok(P, CALCULATORS, KAT, DONTES)
    .filter((i) => i.severity === "error").length, 0);
});

test("a kódküszöb-kiolvasás nem áll meg egy ismeretlen alakú függvényen", () => {
  const hamis = { id: "calc.x", inputs: [{ id: "a" }], fn: 42 } as unknown as CalcDef;
  assert.deepEqual(kodKuszobok(hamis), []);
});
