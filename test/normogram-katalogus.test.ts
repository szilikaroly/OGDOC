/**
 * NORMOGRAM-KATALÓGUS — a hiány mértéke, nem kényelmi lista.
 *
 * A rendszerben eddig két szint volt: TELEPÍTVE és HITELESÍTVE. A katalógus
 * egy harmadikat, a kettő ELŐTTIT írja le: KATALOGIZÁLVA — tudjuk, hogy
 * létezik ilyen publikált görbe, és tudjuk, melyik közleményben, de a tábla
 * nincs meg.
 *
 * E nélkül a szint nélkül a hiány láthatatlan: úgy tűnne, hogy „van
 * AC-görbe", és nem derülne ki, hogy tizennyolc másik létezik, amelyik
 * ugyanarra a magzatra más percentilist adna.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  hitelesitett, loadNormograms, NORMOGRAM_VERIFICATION,
} from "../core/us/normogram.ts";
import {
  applicable, catalogueStamp, chartsFor, coverage, loadChartCatalogue,
  measures, pick, validateCatalogue,
} from "../core/us/katalogus.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const NG = join(HERE, "..", "registry", "normogramok");
const CAT = loadChartCatalogue(join(NG, "katalogus.json"));
const NORM = loadNormograms(NG);

/* ── 1. A KATALÓGUS ÉP ──────────────────────────────────────────────── */

test("a katalógus hiba nélkül validál", () => {
  assert.deepEqual(validateCatalogue(CAT).filter((i) => i.severity === "error"), []);
  assert.ok(CAT.charts.length > 250);
  assert.ok(measures(CAT).length > 100);
});

test("minden görbének van hivatkozása — ez a katalógus egyetlen értéke", () => {
  for (const c of CAT.charts) assert.ok(c.cite.trim(), `${c.id}: nincs hivatkozás`);
});

test("a RÉSZLEGES katalógus megnevezi a lyukait", () => {
  // Egy katalógus, ami hallgat a hiányairól, teljesnek látszik.
  assert.equal(CAT.coverage, "partial");
  assert.ok(CAT.gaps.length >= 2);
  assert.match(CAT.coverageNote!.hu!, /NEVESÍTVE/);
});

/* ── 2. A KATALÓGUS A HIÁNY MÉRTÉKE ─────────────────────────────────── */

test("egy hasi körfogathoz tizennyolcnál több publikált görbe létezik", () => {
  assert.ok(chartsFor(CAT, "AC").length >= 18);
  assert.ok(chartsFor(CAT, "BPD").length >= 20);
});

test("a mérleg megkülönbözteti a HITELESÍTETTET a PERCENTILIST ADÓTÓL", () => {
  const cov = coverage(CAT, NORM.all(), { AC: "us.ac" });
  const ac = cov.find((c) => c.base === "AC")!;
  assert.ok(ac.catalogued >= 18);
  assert.ok(ac.installed >= 1);
  assert.equal(ac.verified, 0, "publikált görbéből egy sincs hitelesítve");
  // De a HELYI tábla percentilist ad — más fajta, nem gyengébb hitelesítés.
  assert.equal(ac.percentilist, 1);
  assert.match(ac.why, /helyi \(más fajta, nem gyengébb\)/);
});

test("a hitelesítés SZÁMÍT — a lefedettségi jelentés követi", () => {
  // Ez a teszt azt a hibaosztályt fogja meg, ami a 7. lépés előtt élt: a
  // `coverage()` a NEM LÉTEZŐ `"verified"` szintet kereste, tehát a szám
  // örökre 0 maradt volna. Aki elvégzi a hitelesítést, nem látta volna az
  // eredményét — és egy visszajelzés nélküli feladat félbemarad.
  const masolat = NORM.all().map((n) => ({ ...n }));
  const chitty = masolat.find((n) => n.id === "ng.chitty.ac")!;
  assert.equal(chitty.verification, "assumed");
  chitty.verification = "primary";
  const cov = coverage(CAT, masolat, { AC: "us.ac" });
  const ac = cov.find((c) => c.base === "AC")!;
  assert.equal(ac.verified, 1, "a hitelesítésnek meg KELL jelennie a jelentésben");
  assert.equal(ac.percentilist, 2);
});

test("a `verification` csak a felsorolt szintek egyike lehet", () => {
  // A karakterlánc-hasonlítás típusellenőrzés nélkül némán elromlik. A lista
  // ezért ADAT, és minden betöltött tábla ellene mérődik.
  for (const n of NORM.all()) {
    assert.ok((NORMOGRAM_VERIFICATION as readonly string[]).includes(n.verification),
      `${n.id}: ismeretlen hitelesítettségi szint „${n.verification}”`);
  }
});

test("a leképezetlen mérésnél ezt is kimondja, nem hallgat", () => {
  const cov = coverage(CAT, NORM.all(), {});
  const bpd = cov.find((c) => c.base === "BPD")!;
  assert.equal(bpd.installed, 0);
  assert.match(bpd.why, /NINCS a regiszter változójához kötve/);
});

test("a bélyegző mindhárom szintet mutatja", () => {
  const s = catalogueStamp(CAT, NORM.all());
  assert.match(s, /katalogizált görbe/);
  assert.match(s, /betöltve/);
  assert.match(s, /hitelesített/);
  assert.match(s, /RÉSZLEGES/);
});

/* ── 3. A MÉRÉSI KONVENCIÓ KAPUJA ───────────────────────────────────── */

const singleton22 = { population: "singleton" as const, ga: 22 };

test("a BPD-nél a mérési konvenció kapu, nem részlet", () => {
  // Chitty 1994 MINDKÉT konvencióra ad görbét: a kettő közt milliméterek
  // vannak, és a felcserélésük néma percentilis-eltolódás.
  const both = chartsFor(CAT, "BPD").filter((c) => c.convention);
  assert.ok(both.some((c) => c.convention === "outerInner"));
  assert.ok(both.some((c) => c.convention === "outerOuter"));

  const a = applicable(CAT, "BPD", { ...singleton22, convention: "outerInner" });
  assert.ok(a.ok.every((r) => r.status === "ok"));
  assert.ok(a.mismatch.length > 0);
});

test("konvenció nélkül a BPD-görbe NEM „megfelel”, hanem eldönthetetlen", () => {
  const a = applicable(CAT, "BPD", singleton22);
  assert.equal(a.ok.length, 0);
  assert.ok(a.undetermined.length > 10);
  assert.match(a.undetermined[0].why, /néma percentilis-eltolódás|nem választható biztonsággal/);
});

test("a konvenció-érzékenységet MAGA A KATALÓGUS árulja el", () => {
  // Nem beleégetett lista dönti el, hogy a BPD konvenció-érzékeny, hanem az,
  // hogy kétféle konvencióval is publikáltak rá görbét. Az AC-nél nincs ilyen,
  // ezért ott a jelöletlen görbe nem lesz eldönthetetlen.
  const bpd = applicable(CAT, "BPD", { ...singleton22, convention: "outerOuter" });
  const ac = applicable(CAT, "AC", { ...singleton22, convention: "outerOuter" });
  assert.ok(bpd.undetermined.length > 0);
  assert.equal(ac.undetermined.length, 0);
});

/* ── 4. AZ IKER MÁS, NEM ROSSZABB ───────────────────────────────────── */

test("ikerre egyes magzat görbéje nem áll", () => {
  const a = applicable(CAT, "AC", { population: "twinMCDA", ga: 26 });
  assert.equal(a.ok.length, 1);                       // Stirrup MCDA
  assert.match(a.ok[0].chart, /stirrup/);
  assert.ok(a.mismatch.some((r) => /egyes magzat/.test(r.why)));
});

test("a DCDA és az MCDA sem cserélhető fel", () => {
  const dcda = chartsFor(CAT, "AC").find((c) => c.population === "twinDCDA")!;
  const r = pick(dcda, { population: "twinMCDA", ga: 26 });
  assert.equal(r.status, "mismatch");
  assert.match(r.why, /monochorionicus/);
});

test("ismeretlen populáció NEM „egyes magzat”", () => {
  const r = pick(chartsFor(CAT, "AC")[0], { ga: 26 });
  assert.equal(r.status, "undetermined");
  assert.match(r.why, /NEM azt jelenti, hogy a görbe megfelel/);
});

/* ── 5. TERHESSÉGI KOR ÉS NEM ───────────────────────────────────────── */

test("az első trimeszteri görbe a 22. héten nem alkalmazható", () => {
  const first = chartsFor(CAT, "AC").find((c) => c.trimester === 1)!;
  assert.equal(pick(first, { population: "singleton", ga: 22 }).status, "mismatch");
  assert.equal(pick(first, { population: "singleton", ga: 12 }).status, "ok");
  assert.equal(pick(first, { population: "singleton" }).status, "undetermined");
});

test("a nemhez kötött születési görbénél a nem is kapu", () => {
  const boy = chartsFor(CAT, "Birthweight").find((c) => c.sex === "male")!;
  assert.equal(pick(boy, { population: "singleton", sex: "female" }).status, "mismatch");
  assert.equal(pick(boy, { population: "singleton" }).status, "undetermined");
  assert.equal(pick(boy, { population: "singleton", sex: "male" }).status, "ok");
});

/* ── 6. AMIT A FORRÁSRENDSZER SEM HASZNÁL ───────────────────────────── */

test("az „unused” jelölésű görbét nem ajánljuk fel", () => {
  const unused = CAT.charts.filter((c) => c.markedUnused);
  assert.ok(unused.length >= 2);
  assert.equal(pick(unused[0], { population: "singleton", ga: 22 }).status, "mismatch");
});

test("a forrásrendszer választása ADAT, nem hitelesítés", () => {
  // 137 görbe van bejelölve abban a rendszerben, ahonnan a katalógus jön.
  // Ez azt mondja meg, mit használnak — nem azt, hogy mi hitelesítettük.
  const used = CAT.charts.filter((c) => c.inUseInSource);
  assert.ok(used.length > 100);
  assert.equal(NORM.all().filter(hitelesitett).length, 0);
});
