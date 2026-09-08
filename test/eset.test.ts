/**
 * EGY TELJES ESET VÉGIGVITELE — az 5. lépés elfogadási kritériuma.
 *
 * *„A `npm run demo` végigmegy, a két kimenet olvasható, és a klinikai olvasó
 * azt mondja rá, hogy ezt aláírná."*
 *
 * A második felét gépből nem lehet bizonyítani — az két klinikus dolga, akik
 * nem vettek részt a tervezésben. Az elsőt igen: hogy a demó végigmegy, hogy a
 * két kimenet NEM ÜRES, és hogy amit mond, az abból következik, ami rögzült.
 *
 * A tesztek nagyobbik fele viszont nem a demóról szól, hanem arról, amit a
 * demó felszínre hozott: a MÉRT ÉRTÉK megítéléséről, ahol a legkönnyebb
 * csendben tévedni.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { patientSummary, recommendations } from "../core/ui/output.ts";
import {
  ertekelMeres, meresek, meresTeendok, referenciaKontextus,
} from "../core/ui/meres.ts";
import type { CaseState } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (...p: string[]) => join(HERE, "..", ...p);
const REG = loadRegistry(R("registry", "variables"));
const NOW = "2026-09-05T09:00:00.000Z";

function tolt(tetelek: Array<[string, unknown]>, st?: CaseState): CaseState {
  let s: CaseState = st ?? {
    ctx: { encounter: "ambulatory", pathway: "prenatal", now: NOW },
    values: {}, errors: [],
  };
  for (const [id, v] of tetelek) s = setValue(REG, s, id, v as never);
  return recompute(REG, s);
}

/** A demó esete: 36 éves, 30+5 hét, fejfájás látászavarral, 158/98. */
const ESET = tolt([
  ["patient.birthDate", "1990-04-12"],
  ["anthro.height", 166],
  ["anthro.weight.prepregnancy", 62],
  ["ctx.pregnant", "pos"],
  ["ctx.lmp", "2026-02-02"],
  ["vitals.bp.systolic", 158],
  ["vitals.bp.diastolic", 98],
  ["vitals.pulse", 88],
  ["status.internal.edema", "abn"],
  ["status.internal.edema.site", "leg"],
  ["status.internal.lungs", "norm"],
  ["lab.urine.protein", "plus2"],
  ["lab.plt", 168],
  ["lab.ast", 41],
]);

/* ── 1. A DEMÓ VÉGIGMEGY ────────────────────────────────────────────── */

test("a `npm run demo` végigmegy, és a két kimenet megjelenik benne", () => {
  // Nem a szöveget ellenőrizzük, hanem hogy a szakaszok megvannak és a
  // futás nem hasal el. Egy demó, ami félúton eldobja magát, nem demó.
  const out = execFileSync(process.execPath,
    ["--experimental-strip-types", R("demo", "eset.ts")],
    { encoding: "utf8", cwd: R() });
  for (const cim of [
    "Felvétel", "A panasz", "Státusz és lelet", "mért értékek megítélése",
    "Kockázatok", "A BETEGNEK szóló szöveg", "A KLINIKUSNAK szóló teendőlista",
    "Amit a rendszer NEM mond ki", "A napló",
  ]) {
    assert.ok(out.includes(cim), `hiányzó szakasz: ${cim}`);
  }
  assert.match(out, /VÖRÖS ZÁSZLÓ/);
  assert.match(out, /a hasítólánc/);
  assert.ok(!out.includes("undefined"), "a kimenetben `undefined` szerepel");
  assert.ok(!out.includes("NaN"), "a kimenetben `NaN` szerepel");
});

test("a demó nem ír ki beteg-azonosítót", () => {
  // A repóban valódi betegadat nem lehet; a demó ezen felül a SZINTETIKUS
  // azonosítót sem írja ki, mert a `phi` mezők kezelése így helyes.
  const out = execFileSync(process.execPath,
    ["--experimental-strip-types", R("demo", "eset.ts")],
    { encoding: "utf8", cwd: R() });
  assert.ok(!out.includes("1990-04-12"), "a születési dátum megjelent");
  assert.ok(!/\b\d{9}\b/.test(out.replace(/\x1b\[[0-9;]*m/g, "")), "TAJ-szerű szám");
});

/* ── 2. A KÉT KIMENET NEM ÜRES, ÉS ABBÓL KÖVETKEZIK, AMI RÖGZÜLT ────── */

test("a betegnek szóló szöveg a rögzített leletekből áll", () => {
  const b = patientSummary(REG, ESET);
  assert.ok(b.length >= 2, "a beteg példánya üres");
  assert.ok(b.some((l) => l.id === "status.internal.edema" && l.tone === "abnormal"));
  assert.ok(b.some((l) => l.id === "status.internal.lungs" && l.tone === "normal"),
    "a NORMÁLIS lelet is megjelenik — a csend kevesebbet mond");
});

test("a nem vizsgált mezőről egy mondat sem áll a beteg példányán", () => {
  const b = patientSummary(REG, ESET);
  const ids = new Set(b.map((l) => l.id));
  // A hasi tapintás nem történt meg ebben az esetben.
  assert.ok(!ids.has("status.internal.abdomen"));
  assert.ok(b.every((l) => l.explicit), "csak rögzített leletből születik mondat");
});

test("a teendőlistán minden tétel mellett ott a kiváltó mező", () => {
  const j = recommendations(REG, ESET);
  assert.ok(j.length >= 3, "a teendőlista üres");
  for (const r of j) {
    assert.ok(r.from, "indoklás nélküli javaslat");
    assert.ok(REG.get(r.from), `nem létező kiváltó mező: ${r.from}`);
    assert.ok(r.text.trim().length > 5);
  }
});

test("a ++ vizeletfehérje mennyiségi meghatározást kér", () => {
  const j = recommendations(REG, ESET);
  const p = j.filter((r) => r.from === "lab.urine.protein");
  assert.equal(p.length, 1);
  assert.match(p[0].text, /fehérje\/kreatinin/);
});

test("negatív vizeletfehérjéből NEM keletkezik teendő", () => {
  // Hibabevitel: ha a kód a kódtól függetlenül javasolna, ez elbukna.
  const neg = tolt([["lab.urine.protein", "neg"]], ESET);
  assert.deepEqual(
    recommendations(REG, neg).filter((r) => r.from === "lab.urine.protein"), []);
});

/* ── 3. A MÉRT ÉRTÉK MEGÍTÉLÉSE ─────────────────────────────────────── */

test("a referenciakontextus a terhességi korból áll elő", () => {
  assert.equal(referenciaKontextus(REG, ESET), "pregnancy.t3");
  assert.equal(referenciaKontextus(REG, tolt([["ctx.lmp", "2026-07-01"]], ESET)),
    "pregnancy.t1");
  assert.equal(referenciaKontextus(REG, tolt([["ctx.pregnant", "neg"]], ESET)),
    "nonpregnant");
});

test("ismeretlen terhességi állapotnál NEM esünk vissza a nem terhes sávra", () => {
  // Ez a `ReferenceSet` dokumentációjának központi állítása: a nem terhes
  // tartományra olvasott terhességi lelet hol riaszt, hol elenged.
  const unk = tolt([["ctx.pregnant", "unk"]], ESET);
  assert.equal(referenciaKontextus(REG, unk), null);
  const e = ertekelMeres(REG, unk, "lab.plt");
  assert.equal(e.allapot, "nemErtekelheto");
  assert.match(e.miert, /NEM esik vissza/);
});

test("a hiányzó gesztációs kor sem enged referenciát választani", () => {
  const nincsGa = tolt([
    ["ctx.pregnant", "pos"], ["vitals.bp.systolic", 158],
  ]);
  assert.equal(referenciaKontextus(REG, nincsGa), null);
  assert.equal(ertekelMeres(REG, nincsGa, "vitals.bp.systolic").allapot, "nemErtekelheto");
});

test("a definíciós küszöb ERŐSEBB a referenciatartománynál", () => {
  const sulyos = tolt([["vitals.bp.systolic", 172]], ESET);
  const e = ertekelMeres(REG, sulyos, "vitals.bp.systolic");
  assert.equal(e.allapot, "kritikus");
  assert.match(e.miert, /definíciós határa/);
});

test("a hitelesítetlen tartományon kívüliség JELZÉS, nem megállapítás", () => {
  const e = ertekelMeres(REG, ESET, "vitals.bp.systolic");
  assert.equal(e.allapot, "referencianKivul");
  assert.equal(e.verification, "assumed");
  assert.match(e.miert, /JELZÉS, nem megállapítás/);
});

test("a kritikus sávon belüli érték nem azonos a normálissal", () => {
  // A pulzusnak nincs referenciatartománya, csak beavatkozási sávja. A 125-ös
  // pulzus a sávon belül van, és attól még nem élettani — ezt ki kell mondani.
  const e = ertekelMeres(REG, tolt([["vitals.pulse", 125]], ESET), "vitals.pulse");
  assert.equal(e.allapot, "savban");
  assert.match(e.miert, /BEAVATKOZÁSI küszöb/);
  assert.match(e.miert, /nem feltétlenül élettani/);
});

test("teendő CSAK a definíciós küszöb átlépéséből keletkezik", () => {
  // A 158/98 tartományon kívül van, de a tartomány hitelesítetlen: jelzés lesz
  // belőle, nem feladat. A 172 küszöböt lép: abból feladat lesz.
  assert.deepEqual(
    meresTeendok(REG, ESET, ["vitals.bp.systolic", "vitals.bp.diastolic"]), []);
  const sulyos = tolt([["vitals.bp.systolic", 172]], ESET);
  const t = meresTeendok(REG, sulyos, ["vitals.bp.systolic"]);
  assert.equal(t.length, 1);
  assert.equal(t[0].urgency, "urgent");
  assert.match(t[0].text, /kritikus küszöbön kívül/);
});

test("a mérésmérleg a legsúlyosabbat teszi előre", () => {
  const sulyos = tolt([["vitals.bp.systolic", 172]], ESET);
  const m = meresek(REG, sulyos);
  assert.equal(m[0].allapot, "kritikus");
  assert.ok(m.length >= 5);
});

test("a nem rögzített mérés nem jelenik meg a mérlegben", () => {
  const m = meresek(REG, ESET).map((x) => x.id);
  assert.ok(!m.includes("lab.ldh"), "nem rögzített laborérték a mérlegben");
  assert.ok(m.includes("vitals.bp.systolic"));
});

test("A KÜSZÖB NÉLKÜLI MÉRÉS MEGSZÓLAL — nem tűnik el egy `continue`-val", () => {
  // Ez volt a hiba: aminek sem kritikus sávja, sem referenciája nincs, az
  // kiesett a mérlegből, MIELŐTT bármilyen állapotot kapott volna. A rögzített
  // érték sehol nem jelent meg, és a klinikus a hallgatást megnyugtatásnak
  // olvassa. A regiszterben 131 mérést érint — köztük ezt a hármat.
  const sulyos = tolt([
    ["nb.apgar.at5", 3], ["nb.cordPh", 6.92], ["lab.sflt.ratio", 112],
  ], ESET);
  const m = meresek(REG, sulyos);
  const ids = m.map((x) => x.id);
  for (const id of ["nb.apgar.at5", "nb.cordPh", "lab.sflt.ratio"]) {
    assert.ok(ids.includes(id), `${id}: eltűnt a mérlegből`);
    assert.equal(m.find((x) => x.id === id)!.allapot, "nincsKuszob");
  }
  // ÉS AMI A LÉNYEG: a rendszer NEM talál ki küszöböt. Nem mondja azt, hogy
  // a 3-as Apgar kritikus — azt mondja, hogy nincs mihez mérnie.
  const apgar = m.find((x) => x.id === "nb.apgar.at5")!;
  assert.notEqual(apgar.allapot, "kritikus");
  assert.match(apgar.miert, /NINCS MIHEZ MÉRNI/);
  assert.equal(apgar.hatar, null, "nincs határ, amit átlépett volna");
});

test("a küszöb nélküli mérés NEM kerül a teendőlistára", () => {
  // A teendő azt állítja, hogy tudunk valamit. A „nincs küszöböm" nem teendő,
  // hanem hiányjelzés — a kettő összemosása hamis sürgősséget csinálna.
  const sulyos = tolt([["nb.cordPh", 6.92]], ESET);
  assert.deepEqual(meresTeendok(REG, sulyos, ["nb.cordPh"]), []);
});

test("a küszöbbel rendelkező mérés viselkedése változatlan", () => {
  // A javítás nem lazít: aminek van küszöbe, azt ugyanúgy ítéli meg.
  const sulyos = tolt([["vitals.bp.systolic", 172]], ESET);
  const m = meresek(REG, sulyos);
  assert.equal(m[0].allapot, "kritikus");
  assert.equal(m.filter((x) => x.id === "vitals.bp.systolic")[0].allapot, "kritikus");
});

/* ── 4. AMIT A DEMÓ FELSZÍNRE HOZOTT ────────────────────────────────── */

test("az AST kritikus sávja a HELLP-irányba mutat, nem visszafelé", () => {
  // A tábla `[70, null]`-lal indult: eszerint a 41-es AST lett volna kritikus,
  // a 200-as pedig nem. Az AST az ALT tükörképe, és fordítva került be.
  const alacsony = ertekelMeres(REG, tolt([["lab.ast", 41]], ESET), "lab.ast");
  assert.notEqual(alacsony.allapot, "kritikus");

  const magas = ertekelMeres(REG, tolt([["lab.ast", 200]], ESET), "lab.ast");
  assert.equal(magas.allapot, "kritikus", "a HELLP-tartományú AST nem kritikus");
});

test("a megfordított kritikus sáv HIBAKÉNT bukik el a validáláson", () => {
  // A validátor a saját referenciatartományához méri: ha a kritikus sáv
  // EGÉSZÉBEN kizárja azt, a pár fordítva került be. Ez a szabály fogta volna
  // meg az AST-t is.
  const rossz = loadRegistry(R("registry", "variables"));
  const ast = rossz.get("lab.ast")!;
  (ast.domain as { critical: unknown }).critical = [70, null];
  const hibak = rossz.validate().filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => h.id === "lab.ast" && /fordítva/.test(h.message)));
});

test("a mai regiszterben egyetlen megfordított kritikus sáv sincs", () => {
  const hibak = REG.validate().filter((i) => i.severity === "error");
  assert.deepEqual(hibak.filter((h) => /kritikus sáv/.test(h.message)), []);
});
