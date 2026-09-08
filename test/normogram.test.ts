/**
 * A normogram-motor tesztjei.
 *
 * Egy 240 mm-es haskörfogat a 28. héten átlagos, a 36.-on súlyos
 * növekedési elmaradás. A szám önmagában nem jelent semmit — és épp ezért a percentilis
 * ugyanolyan veszélyes, mint egy score: EGYETLEN szám, amit ránézésre nem
 * lehet ellenőrizni. Ugyanaz a három kapu védi.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import { NormogramSet, loadNormograms, phi, zErtek } from "../core/us/normogram.ts";
import type { CaseState, Normogram } from "../core/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const SET = loadNormograms(join(HERE, "..", "registry", "normogramok"));

const NOW = "2026-09-01T12:00:00Z";
function pregnantAt(weeks: number): CaseState {
  const lmpMs = Date.parse(NOW) - weeks * 7 * 86_400_000;
  const base: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  let st = setValue(REG, base, "ctx.pregnant", "pos");
  st = setValue(REG, st, "ctx.lmp", new Date(lmpMs).toISOString().slice(0, 10));
  return recompute(REG, st);
}

/** Ugyanaz a tábla, de VISSZAELLENŐRZÖTTNEK jelölve — a kapu mögötti viselkedéshez. */
function verified(): NormogramSet {
  const raw = (JSON.parse(JSON.stringify(SET.all())) as Array<Record<string, unknown>>)
    .filter((n) => n.id === "ng.chitty.ac");
  for (const n of raw) n.verification = "primary";
  return new NormogramSet(raw as unknown as Normogram[]);
}

/* ── 1. A normális eloszlás közelítése ───────────────────────────────── */

test("pontosan az átlagon a z-érték nulla", () => {
  const n = verified().get("ng.chitty.ac")!;
  const at28 = verified().atX(n, 28)!;
  assert.equal(at28.mean, 240);
  assert.equal(at28.interpolated, false);
});

test("a normális eloszlásfüggvény a szokásos pontokon helyes", () => {
  assert.ok(Math.abs(phi(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(phi(1.645) - 0.95) < 1e-3);
  assert.ok(Math.abs(phi(-1.96) - 0.025) < 1e-3);
});

/* ── 2. A KAPU: ellenőrizetlen tábla nem ad percentilist ─────────────── */

test("assumed szintű normogram teljes bemenettel sem ad eredményt", () => {
  let st = pregnantAt(28);
  st = setValue(REG, st, "us.ac", 240);
  const r = SET.evaluate(REG, st, "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /nincsenek visszaellenőrizve/);
});

test("visszaellenőrzött táblával ugyanaz a mérés megkapja a percentilist", () => {
  let st = pregnantAt(28);
  st = setValue(REG, st, "us.ac", 240);
  const r = verified().evaluate(REG, st, "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  // A gesztációs kor DÁTUMBÓL vezetődik le, ezért nem pontosan 28,0 hét — az
  // átlagos mérés így a z = 0 közelébe esik, nem pontosan rá.
  assert.ok(Math.abs(r.z) < 0.2, `z = ${r.z}`);
  assert.ok(Math.abs(r.percentile - 50) < 8, `percentilis = ${r.percentile}`);
  assert.equal(r.band, "p10-90");
  assert.match(r.source.cite, /Chitty/);
});

/* ── 3. NINCS EXTRAPOLÁCIÓ ───────────────────────────────────────────── */

test("a tábla szélén túl nem számolunk", () => {
  let st = pregnantAt(42);            // a tábla 20–40 hétig tart
  st = setValue(REG, st, "us.ac", 350);
  const r = verified().evaluate(REG, st, "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /Extrapoláció nincs/);
});

test("a táblán belül interpolál, és megmondja, hogy azt tette", () => {
  const n = verified().get("ng.chitty.ac")!;
  const at30 = verified().atX(n, 30)!;
  assert.equal(at30.interpolated, true);
  // a 28. és a 32. hét átlagai közé esik
  assert.ok(at30.mean > 240 && at30.mean < 285);
});

/* ── 4. A hiányzó bemenet nem nulla ──────────────────────────────────── */

test("mérés nélkül nincs percentilis, és megmondja, mi hiányzik", () => {
  const r = verified().evaluate(REG, pregnantAt(28), "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "insufficient");
  assert.deepEqual(r.status === "insufficient" ? r.missing : [], ["us.ac"]);
});

test("gesztációs kor nélkül sincs percentilis", () => {
  const base: CaseState = { ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] };
  const st = setValue(REG, base, "us.ac", 240);
  const r = verified().evaluate(REG, st, "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "insufficient");
  assert.ok((r.status === "insufficient" ? r.missing : []).includes("ctx.ga"));
});

/* ── 5. A sávok ──────────────────────────────────────────────────────── */

test("a kis súly a 3. percentilis alá kerül, és a sáv ezt mondja", () => {
  let st = pregnantAt(32);
  st = setValue(REG, st, "us.ac", 230);      // a 32. héten az átlag 285, a szórás 21
  const r = verified().evaluate(REG, st, "us.ac", "ng.chitty.ac");
  assert.equal(r.status, "ok");
  if (r.status !== "ok") return;
  assert.ok(r.z < -2);
  assert.equal(r.band, "p<3");
});

/* ── 6. Két normogram közül nem választunk magunktól ─────────────────── */

test("ha egy paraméterhez több normogram van, kérni kell, melyiket", () => {
  const two = new NormogramSet([
    ...(JSON.parse(JSON.stringify(verified().all())) as Normogram[]),
    { ...(JSON.parse(JSON.stringify(verified().get("ng.chitty.ac"))) as Normogram),
      id: "ng.masik.ac" },
  ]);
  let st = pregnantAt(28);
  st = setValue(REG, st, "us.ac", 240);
  const r = two.evaluate(REG, st, "us.ac");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /nincs kiválasztva/);
  // megnevezve viszont működik
  assert.equal(two.evaluate(REG, st, "us.ac", "ng.chitty.ac").status, "ok");
});

/* ── 7. Integritás ───────────────────────────────────────────────────── */

test("minden normogram létező paraméterre és egyező egységgel mutat", () => {
  const errors = SET.validate(REG).filter((i) => i.severity === "error");
  assert.deepEqual(errors, []);
});

/* ── 8. Három üzemmód: telepített · öngenerált · személyre szabott ───────
   A három nem egymás változata, hanem HÁROM KÜLÖNBÖZŐ KÉRDÉS:
     published  — mihez képest szokás mérni?
     local      — mihez képest mérünk MI, ITT?
     customised — mihez képest EZ a magzat?                                 */

test("az öngenerált tábla percentilist ad, mert a bizonytalansága KIÍRT", () => {
  const local = SET.get("ng.local.us-ac");
  assert.ok(local, "a helyi tábla be van töltve");
  assert.equal(local!.verification, "local");
  assert.ok(local!.derivedFrom!.n > 100, "ismert az elemszám");
  assert.ok(local!.derivedFrom!.exclusion?.length, "ismertek a kizárási szabályok");

  let st = pregnantAt(30);            // a 30. hét sűrű sáv a szintetikus adatban
  st = setValue(REG, st, "us.ac", 250);
  const r = SET.evaluate(REG, st, "us.ac", "ng.local.us-ac");
  assert.equal(r.status, "ok", r.status === "insufficient" ? r.reason : "");
  assert.equal(r.status === "ok" && r.kind, "local");
  assert.ok(r.status === "ok" && (r.n ?? 0) > 0, "az eredmény hordozza az elemszámot");
});

test("a ritka sávból az öngenerált tábla sem ad percentilist", () => {
  let st = pregnantAt(28);            // szándékosan ritka sáv a szintetikus adatban
  st = setValue(REG, st, "us.ac", 240);
  const r = SET.evaluate(REG, st, "us.ac", "ng.local.us-ac");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /ritka sáv/);
});

test("A RITKA SÁV A FELÉNÉL IS ROMBOL — a kapu egy sávval elcsúszott", () => {
  // A 23. sávban 80 eset van, a 24.-ben 20, a deklarált minimum 50. A 23,5
  // hetes mérés FELE-FELE arányban a kettő között interpolálódik — mégis
  // átment, mert a kapu a LEGKÖZELEBBI sávot nézte, és 23,5-nél az a 23. lett.
  // A visszaadott `n: 80` ráadásul azt állította, hogy nyolcvan eset áll
  // mögötte. A ritka sáv nem a közepén kezd rontani, hanem ahol súlyt kap.
  for (const ga of [23.1, 23.5, 23.9]) {
    let st = pregnantAt(ga);
    st = setValue(REG, st, "us.ac", 185);
    const r = SET.evaluate(REG, st, "us.ac", "ng.local.us-ac");
    assert.equal(r.status, "insufficient", `ga=${ga}: a ritka sáv súlya átcsúszott`);
    assert.match(r.status === "insufficient" ? r.reason : "", /KÖZÖTT interpolálódik/);
  }
  // A vastag sávok közötti érték viszont továbbra is megy — a kapu nem
  // szigorúbb lett, hanem pontos.
  let jo = pregnantAt(25.5);
  jo = setValue(REG, jo, "us.ac", 205);
  const ok = SET.evaluate(REG, jo, "us.ac", "ng.local.us-ac");
  assert.equal(ok.status, "ok");
  assert.equal(ok.status === "ok" ? ok.n : null, 80);
});

test("a visszaadott `n` a KISEBBIK befogó sáv — arra támaszkodik az eredmény", () => {
  // 21. és 22. sáv: 80 és 80. A 20. sáv 20-as, de a minimum alatt van, tehát
  // oda nem is jutunk el — a `n` mindig a két befogó közül a kisebbik.
  let st = pregnantAt(21.5);
  st = setValue(REG, st, "us.ac", 165);
  const r = SET.evaluate(REG, st, "us.ac", "ng.local.us-ac");
  assert.equal(r.status, "ok");
  assert.equal(r.status === "ok" ? r.n : null, 80);
});

test("AZ ÜRES TÁBLA MEGNEVEZETT HIBA, NEM ÖSSZEOMLÁS", () => {
  // A tartományüzenet a tábla első és utolsó sorát indexelte, a `rows` viszont
  // opcionális — üres táblán tehát maga a HIBAJELZÉS dobott `TypeError`-t. Egy
  // névtelen kivétel pont az ellenkezője annak, amit ez a réteg végig ígér.
  const ures = new NormogramSet([{
    id: "ng.ures", parameter: "us.ac", by: "ctx.ga", unit: "mm",
    verification: "primary", source: { cite: "teszt" }, rows: [],
  }]);
  let st = pregnantAt(30);
  st = setValue(REG, st, "us.ac", 250);
  const r = ures.evaluate(REG, st, "us.ac", "ng.ures");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /NINCS EGYETLEN SORA SEM/);
  assert.match(r.status === "insufficient" ? r.reason : "", /nem\s+tartományon kívüliség/);
});

test("a helyi tábla `derivedFrom` nélkül használhatatlan", () => {
  const bare = new NormogramSet([{
    ...(JSON.parse(JSON.stringify(SET.get("ng.local.us-ac"))) as Normogram),
    id: "ng.local.csupasz", derivedFrom: null,
  }]);
  let st = pregnantAt(30);
  st = setValue(REG, st, "us.ac", 250);
  const r = bare.evaluate(REG, st, "us.ac", "ng.local.csupasz");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /miből készült/);
});

/* ── 9. Személyre szabott: demográfiai igazítás ──────────────────────── */

/** Ugyanaz a készlet, de az alaptábla és az együtthatók hitelesítve. */
function verifiedAll(): NormogramSet {
  const raw = JSON.parse(JSON.stringify(SET.all())) as Array<Record<string, unknown>>;
  for (const n of raw) if (n.verification !== "local") n.verification = "primary";
  return new NormogramSet(raw as unknown as Normogram[]);
}

function withDemographics(st: CaseState, sex: string, heightCm: number): CaseState {
  let s = setValue(REG, st, "anthro.height", heightCm);
  s = setValue(REG, s, "anthro.weight.prepregnancy", 64);
  s = setValue(REG, s, "ctx.parity.para", 0);
  s = setValue(REG, s, "us.fetal.sex", sex);
  return s;
}

test("hiányzó demográfiai adatnál NEM esünk vissza csendben az igazítatlan értékre", () => {
  let st = pregnantAt(28);
  st = setValue(REG, st, "us.ac", 240);
  const r = verifiedAll().evaluateCustomised(REG, st, "ng.customised.ac");
  assert.equal(r.status, "insufficient");
  assert.match(r.status === "insufficient" ? r.reason : "", /NEM esünk vissza csendben/);
  assert.ok((r.status === "insufficient" ? r.missing : []).includes("anthro.height"));
});

test("teljes demográfiával az igazítás megtörténik, és látszik, mi mennyit tolt", () => {
  let st = pregnantAt(28);
  st = setValue(REG, st, "us.ac", 240);
  st = withDemographics(st, "male", 180);
  const r = verifiedAll().evaluateCustomised(REG, st, "ng.customised.ac");
  assert.equal(r.status, "ok", r.status === "insufficient" ? r.reason : "");
  if (r.status !== "ok") return;
  assert.equal(r.kind, "customised");
  assert.ok(r.adjustment!.factor > 1, "magas anya + fiú magzat → nagyobb várt méret");
  assert.equal(r.adjustment!.from.length, 4, "mind a négy tag megjelenik");
  assert.ok(r.adjustment!.from.every((f) => "value" in f && "effect" in f));
});

test("ugyanaz a mérés más percentilis alacsony és magas anyánál", () => {
  const V = verifiedAll();
  const base = setValue(REG, pregnantAt(28), "us.ac", 240);
  const tall = V.evaluateCustomised(REG, withDemographics(base, "male", 180), "ng.customised.ac");
  const short = V.evaluateCustomised(REG, withDemographics(base, "female", 150), "ng.customised.ac");
  assert.equal(tall.status, "ok");
  assert.equal(short.status, "ok");
  if (tall.status !== "ok" || short.status !== "ok") return;
  assert.ok(tall.percentile < short.percentile,
    "a magasabb anya magzatánál ugyanaz a méret alacsonyabb percentilis");
});

test("ellenőrizetlen alaptáblára épített igazítás sem ad értéket", () => {
  let st = pregnantAt(28);
  st = withDemographics(setValue(REG, st, "us.ac", 240), "male", 180);
  const r = SET.evaluateCustomised(REG, st, "ng.customised.ac");   // minden `assumed`
  assert.equal(r.status, "insufficient");
});

/* ── 10. HIBRID MEGJELENÍTÉS ─────────────────────────────────────────── */

test("a hibrid nézet minden olvasatot egyszerre ad, a nem születőket okkal", () => {
  const V = verifiedAll();
  let st = pregnantAt(30);
  st = withDemographics(setValue(REG, st, "us.ac", 250), "female", 158);
  const rows = V.evaluateHybrid(REG, st, "us.ac");

  // A VÁRT SZÁM A KÉSZLETBŐL JÖN, nem kézzel írva: az `us.ac`-hez azóta egy
  // második publikált tábla is került (INTERGROWTH-21st), és egy rögzített
  // hármas ilyenkor nem hibát jelezne, hanem csak elavulna.
  assert.equal(rows.length, V.forParameter("us.ac").length,
    "minden betöltött us.ac-tábla megjelenik egy sorral");
  assert.ok(rows.filter((r) => r.kind === "published").length >= 2,
    "két publikált forrás ugyanarra a mérésre — a motor nem választ helyettünk");
  assert.deepEqual([...new Set(rows.map((r) => r.kind))],
    ["published", "local", "customised"]);
  for (const row of rows) {
    if (row.result.status === "ok") {
      assert.ok(row.result.source.cite.length > 10, `${row.normogram}: nincs forrás`);
    } else {
      assert.ok(row.result.reason.length > 10,
        `${row.normogram}: a meg nem született olvasatnak is oka van`);
    }
  }
});

test("a hibrid nézet akkor is teljes, ha egyik olvasat sem születik meg", () => {
  const rows = SET.evaluateHybrid(REG, pregnantAt(30), "us.ac");
  assert.ok(rows.length >= 2);
  assert.ok(rows.every((r) => r.result.status === "insufficient"));
  assert.ok(rows.every((r) => r.result.status === "insufficient" && r.result.reason),
    "üres hely helyett mindenhol ok áll");
});

/* ── 11. AZ ELOSZLÁS ALAKJA ──────────────────────────────────────────── */

const IG = loadNormograms(join(HERE, "..", "registry", "normogramok"));

test("az öt biometriai standard TÉNYLEG normális — visszamérve, nem feltételezve", () => {
  for (const id of ["ng.ig21.hc", "ng.ig21.ac", "ng.ig21.bpd", "ng.ig21.ofd", "ng.ig21.fl"]) {
    const n = IG.get(id)!;
    assert.equal(n.transform?.kind, "none");
    let max = 0;
    for (const r of n.rows ?? []) {
      for (const [pct, ertek] of Object.entries(r.p ?? {})) {
        const z = zErtek(n, r, ertek).z!;
        max = Math.max(max, Math.abs(phi(z) * 100 - Number(pct)));
      }
    }
    assert.ok(max < 0.5, `${id}: a normális eloszlás ${max.toFixed(2)} percentilis-ponttal téved`);
  }
});

test("A SÚLYGYARAPODÁS NEM NORMÁLIS ELOSZLÁSÚ — `ln(gyarapodás + 8,75)` az", () => {
  const n = IG.get("ng.ig21.gwg.normalBmi")!;
  assert.deepEqual(n.transform, { kind: "log", shift: 8.75 });

  // A helyes alak visszaadja a publikált táblát…
  let jo = 0;
  for (const r of n.rows ?? []) {
    for (const [pct, ertek] of Object.entries(r.p ?? {})) {
      jo = Math.max(jo, Math.abs(phi(zErtek(n, r, ertek).z!) * 100 - Number(pct)));
    }
  }
  assert.ok(jo < 1.2, `a log-alak legfeljebb 1,2 percentilis-pontot téved (${jo.toFixed(2)})`);

  // …a nyers átlag/szórás viszont NEM. Ugyanazok a sorok, `none` alakkal.
  const utolso = (n.rows ?? []).at(-1)!;                       // 40. hét
  const nyersMean = (utolso.p!["3"] + utolso.p!["97"]) / 2;
  const nyersSd = (utolso.p!["97"] - utolso.p!["3"]) / (2 * 1.8807936);
  const nyers = { x: utolso.x, mean: nyersMean, sd: nyersSd };
  const p50 = zErtek({ transform: { kind: "none" } }, nyers, utolso.p!["50"]).z!;
  assert.ok(Math.abs(phi(p50) * 100 - 50) > 5,
    "a nyers átlag/szórás a MEDIÁNT is elrontja — a ferdeség nem a széleken kezdődik");
});

test("a rossz alak HIBA, nem figyelmeztetés", () => {
  const n = JSON.parse(JSON.stringify(IG.get("ng.ig21.gwg.normalBmi")!));
  n.transform = { kind: "none" };            // a ferdeség eltüntetése
  n.verification = "primary";
  const h = new NormogramSet([n]).validate(REG).filter((i) => i.severity === "error");
  assert.ok(h.length > 0);
  assert.match(h[0].message, /NEM ADJA VISSZA A PUBLIKÁLT TÁBLÁT/);
  assert.match(h[0].message, /ott téved, ahol a döntés születik|széleken téved/);
});

test("a logaritmikus alak ÉRTELMEZÉSI TARTOMÁNYT is jelent — a NaN helyett név", () => {
  const n = IG.get("ng.ig21.gwg.normalBmi")!;
  const r = zErtek(n, n.rows![10], -10);            // −10 kg, az eltolás alatt
  assert.equal(r.z, undefined);
  assert.match(r.hiba!, /tartományon kívüli/);
  assert.ok(Number.isFinite(zErtek(n, n.rows![10], -3).z!), "−3 kg viszont értelmes");
});

test("a ferdeségi paraméter hiánya nem csendes nulla", () => {
  const r = zErtek({ transform: { kind: "logSkew" } }, { mean: 8, sd: 0.1 }, 3000);
  assert.equal(r.z, undefined);
  assert.match(r.hiba!, /ferdeségi paraméter/);
});
