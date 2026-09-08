/**
 * 37. MODUL — KARBANTARTÁS ÉS SZERKESZTÉS.
 *
 * Ez a modul minden modul fölött áll, ezért a tesztek nem azt bizonyítják,
 * hogy MŰKÖDIK, hanem hogy MIT NEM ENGED. Egy mindenható szerkesztő, ami
 * bármit átír, nem képesség — visszafordíthatatlan kockázat.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  allit, ervenyes, loadParameterek, merleg as paramMerleg, validateParameterek,
} from "../core/karbantartas/parameter.ts";
import type { ParameterErtek } from "../core/karbantartas/parameter.ts";
import {
  merleg as szMerleg, szerkeszt, validateReteg,
} from "../core/karbantartas/szerkeszto.ts";
import type { Kornyezet, SzerkesztesReteg } from "../core/karbantartas/szerkeszto.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = loadParameterek(join(ROOT, "registry", "karbantartas", "parameterek.json"));
const MOST = "2026-09-08T10:00:00.000Z";
const KESOBB = "2026-09-09T10:00:00.000Z";

/* ── PARAMÉTEREK ─────────────────────────────────────────────────────── */

test("a paraméterkészlet hibátlan", () => {
  assert.deepEqual(validateParameterek(P).filter((i) => i.severity === "error"), []);
});

test("MINDEN szám típusú paraméternek van alsó ÉS felső határa", () => {
  // A korlátlan paraméter nem paraméter, hanem nyitva hagyott ajtó: egy
  // elgépelt nagyságrend némán elronthatja az egész modult.
  for (const p of P.parameterek.filter((x) => x.tipus === "szam")) {
    assert.equal(typeof p.min, "number", `${p.id}: nincs alsó határ`);
    assert.equal(typeof p.max, "number", `${p.id}: nincs felső határ`);
  }
});

test("A RENDSZERGAZDA NEM ÁLLÍTHAT KLINIKAI PARAMÉTERT", () => {
  const k = P.parameterek.find((p) => p.id === "riasztas.eszkalacioPerc")!;
  assert.equal(k.kor, "klinikai");
  assert.ok(!k.allithatja.includes("admin"));
  const r = allit(P, k.id, 30, "Admin", ["admin"], "próba", MOST, MOST);
  assert.equal(r.allapot, "nincsJog");
  assert.match(r.miert, /nem ugyanaz a felelősség/);
  // …klinikusi szerepkörrel viszont megy.
  assert.equal(allit(P, k.id, 30, "dr. X", ["clinician"], "osztályvezetői döntés", MOST, MOST)
    .allapot, "elfogadva");
});

test("a klinikai paraméter átállítása ELAVULTTÁ TESZI az aláírást", () => {
  const r = allit(P, "riasztas.eszkalacioPerc", 30, "dr. X", ["clinician"],
    "döntés", MOST, MOST);
  assert.deepEqual(r.elavuloAlairasok, ["riasztas.eszkalacio"]);
  assert.match(r.miert, /aláírás ELAVUL/);
  assert.match(r.miert, /olyan értéket hitelesített, ami már nincs ott/);
});

test("a határon kívüli érték nem fogadható el", () => {
  assert.equal(allit(P, "ui.lanc.maxHossz", 400, "A", ["admin"], "p", MOST, MOST)
    .allapot, "ervenytelenErtek");
  assert.equal(allit(P, "ui.lanc.maxHossz", 0, "A", ["admin"], "p", MOST, MOST)
    .allapot, "ervenytelenErtek");
  assert.equal(allit(P, "ui.lanc.maxHossz", 4, "A", ["admin"], "p", MOST, MOST)
    .allapot, "elfogadva");
});

test("indok nélkül nem állítható át semmi", () => {
  const r = allit(P, "ui.lanc.maxHossz", 4, "A", ["admin"], "  ", MOST, MOST);
  assert.equal(r.allapot, "nincsIndok");
  assert.match(r.miert, /senki nem mer visszaállítani/);
});

test("VISSZAMENŐLEGES hatályú átállítás nincs", () => {
  const r = allit(P, "ui.lanc.maxHossz", 4, "A", ["admin"], "p",
    "2026-09-01T00:00:00.000Z", MOST);
  assert.equal(r.allapot, "visszamenoleges");
  assert.match(r.miert, /átírja, hogyan látjuk a MÁR MEGHOZOTT döntéseket/);
});

test("a jövőbeli érvényességű állítás NEM hat vissza", () => {
  const e: ParameterErtek[] = [{
    parameter: "ui.lanc.maxHossz", ertek: 3, ervenyesTol: KESOBB,
    allitotta: "A", miert: "holnaptól",
  }];
  assert.equal(ervenyes(P, e, "ui.lanc.maxHossz", MOST).ertek, 6, "ma még az alapérték");
  assert.equal(ervenyes(P, e, "ui.lanc.maxHossz", KESOBB).ertek, 3);
});

test("az érvényes érték megmondja, ALAPÉRTÉK-e vagy állították", () => {
  const a = ervenyes(P, [], "ui.lanc.maxHossz", MOST);
  assert.equal(a.allitott, false);
  assert.match(a.miert, /senki nem állította át/);
  const b = ervenyes(P, [{ parameter: "ui.lanc.maxHossz", ertek: 4,
    ervenyesTol: MOST, allitotta: "dr. Y", miert: "hosszú lánc a lapon" }],
    "ui.lanc.maxHossz", MOST);
  assert.equal(b.allitott, true);
  assert.match(b.miert, /dr\. Y állította át/);
});

test("a nyelvjelölés kikapcsolását SENKI nem állíthatja", () => {
  // A `csendes` érték azt jelentené, hogy a felhasználó nem tudja, mikor lát
  // fordítatlan szöveget — vagyis a rendszer csendben helyettesít, amit minden
  // más ponton tilt. A választás azért van a listán, hogy látszódjon: nem
  // elfelejtettük, hanem elutasítottuk.
  const p = P.parameterek.find((x) => x.id === "ui.nyelvJeloles")!;
  assert.deepEqual(p.allithatja, []);
  for (const sz of [["admin"], ["clinician"], ["admin", "clinician"]] as const) {
    assert.equal(allit(P, p.id, "csendes", "X", [...sz], "p", MOST, MOST).allapot, "nincsJog");
  }
});

test("a jelszó minimumhossza NEM vihető 12 alá", () => {
  const p = P.parameterek.find((x) => x.id === "jelszo.minHossz")!;
  assert.equal(p.min, 12, "a paraméter nem arra való, hogy a szabályt ki lehessen kapcsolni vele");
  assert.equal(allit(P, p.id, 8, "A", ["admin"], "p", MOST, MOST).allapot, "ervenytelenErtek");
});

test("a mérleg a készletből számol", () => {
  const m = paramMerleg(P, [], MOST);
  assert.equal(m.osszes, P.parameterek.length);
  assert.equal(m.klinikai, P.parameterek.filter((p) => p.kor === "klinikai").length);
  assert.equal(m.allitott, 0);
});

/* ── MEZŐSZERKESZTÉS ─────────────────────────────────────────────────── */

const KORNYEZET: Kornyezet = {
  regiszterMezok: new Set(["pedgyn.discharge", "vitals.bp.systolic"]),
  kodlista: (m) => m === "pedgyn.discharge"
    ? ["none", "physiologic", "purulent", "bloody", "foul", "unk"] : null,
  vanErteke: () => true,
  kodotHasznaltak: () => true,
  fuggoAlairasok: (m) => m === "pedgyn.discharge" ? ["gyermek.jelzes"] : [],
};

function ures(): SzerkesztesReteg { return { verzio: 1, szerkesztesek: [] }; }
const be = (x: Partial<Parameters<typeof szerkeszt>[2]>) => ({
  fajta: "ujMezo" as const, mezo: "teszt.mezo", tartalom: {},
  ki: "dr. Teszt", szerepek: ["clinician"] as const, miert: "próba", mikor: MOST, ...x,
});

test("A REGISZTERBELI MEZŐ NEM ÍRHATÓ FELÜL futásidőben", () => {
  const r = szerkeszt(ures(), KORNYEZET, be({ mezo: "pedgyn.discharge" }) as never);
  assert.equal(r.allapot, "tiltottMuvelet");
  assert.match(r.miert, /a kód és a valóság elválik/);
});

test("szám típusú mező TARTOMÁNY nélkül nem hozható létre", () => {
  const r = szerkeszt(ures(), KORNYEZET, be({
    mezo: "pedgyn.szagfok", tartalom: { label: { hu: "Szagfok" }, datatype: "number" },
  }) as never);
  assert.equal(r.allapot, "tartalomHiba");
  assert.match(r.miert, /elgépelt nagyságrend némán bekerül/);
});

test("mennyiség MÉRTÉKEGYSÉG nélkül nem hozható létre", () => {
  const r = szerkeszt(ures(), KORNYEZET, be({
    mezo: "pedgyn.terfogat",
    tartalom: { label: { hu: "Térfogat" }, datatype: "quantity", domain: { min: 0, max: 99 } },
  }) as never);
  assert.equal(r.allapot, "tartalomHiba");
  assert.match(r.miert, /5\.0 mg\/dL kreatinin és az 5\.0 µmol\/L nem ugyanaz a beteg/);
});

test("a szabályos új mező a RÉTEGBE kerül, és ez látszik", () => {
  const r = szerkeszt(ures(), KORNYEZET, be({
    mezo: "pedgyn.szagfok",
    tartalom: { label: { hu: "Szagfok" }, datatype: "number", domain: { min: 0, max: 10 } },
  }) as never);
  assert.equal(r.allapot, "elfogadva");
  assert.match(r.miert, /SZERKESZTÉSI RÉTEGBE került, nem a regiszterbe/);
  assert.match(r.miert, /ellenőrzött, de át nem nézett/);
});

test("A KÓDLISTÁBÓL NEM LEHET ELVENNI — csak kivezetni", () => {
  const r = szerkeszt(ures(), KORNYEZET,
    be({ fajta: "kodKivezetes", mezo: "pedgyn.discharge", tartalom: { kod: "unk" } }) as never);
  assert.equal(r.allapot, "elfogadva");
  assert.match(r.miert, /a korábbi rögzítések olvashatók maradnak/);
  assert.match(r.miert, /MÚLTBELI adatot tenné értelmezhetetlenné/);
});

test("a kódbővítés ELAVULTTÁ teszi a mezőtől függő aláírást", () => {
  const r = szerkeszt(ures(), KORNYEZET, be({
    fajta: "kodBovites", mezo: "pedgyn.discharge",
    tartalom: { kodok: [{ code: "greenish", label_hu: "Zöldes" }] },
  }) as never);
  assert.deepEqual(r.elavultAlairasok, ["gyermek.jelzes"]);
  assert.match(r.miert, /aláírás ELAVUL/);
});

test("meglévő kód nem vehető fel újra", () => {
  const r = szerkeszt(ures(), KORNYEZET, be({
    fajta: "kodBovites", mezo: "pedgyn.discharge", tartalom: { kodok: [{ code: "foul" }] },
  }) as never);
  assert.equal(r.allapot, "tartalomHiba");
});

test("a mezőazonosító alakja kötött", () => {
  for (const rossz of ["Nagy.Betu", "ékezet.mező", "nincspont", "1szam.mezo"]) {
    assert.equal(szerkeszt(ures(), KORNYEZET, be({ mezo: rossz }) as never).allapot,
      "azonositoHiba", rossz);
  }
});

test("indok nélkül nincs szerkesztés", () => {
  assert.equal(szerkeszt(ures(), KORNYEZET, be({ miert: "" }) as never).allapot, "nincsIndok");
});

test("KÉT SZERKESZTÉS UGYANARRA A MEZŐRE, ugyanabban a pillanatban: KÜLÖN azonosító", () => {
  // Enélkül a második csendben felülírná az elsőt a naplóban.
  const r = ures();
  for (const b of [
    { fajta: "kodBovites" as const, tartalom: { kodok: [{ code: "a" }] } },
    { fajta: "kodKivezetes" as const, tartalom: { kod: "unk" } },
    { fajta: "kodBovites" as const, tartalom: { kodok: [{ code: "b" }] } },
  ]) {
    const x = szerkeszt(r, KORNYEZET, be({ mezo: "pedgyn.discharge", ...b }) as never);
    assert.equal(x.allapot, "elfogadva");
    r.szerkesztesek.push(x.szerkesztes!);
  }
  assert.equal(new Set(r.szerkesztesek.map((s) => s.id)).size, 3);
  assert.deepEqual(validateReteg(r, KORNYEZET), []);
  assert.equal(szMerleg(r).szerkesztes, 3);
});

test("ha a mező időközben BEKERÜL a regiszterbe, a réteg ütközést jelez", () => {
  const r = ures();
  const x = szerkeszt(r, KORNYEZET, be({
    mezo: "pedgyn.szagfok",
    tartalom: { label: { hu: "Szagfok" }, datatype: "number", domain: { min: 0, max: 10 } },
  }) as never);
  r.szerkesztesek.push(x.szerkesztes!);
  const kesobbi: Kornyezet = { ...KORNYEZET,
    regiszterMezok: new Set([...KORNYEZET.regiszterMezok, "pedgyn.szagfok"]) };
  const g = validateReteg(r, kesobbi);
  assert.equal(g.length, 1);
  assert.match(g[0].message, /Két definíció versenyez egy névre/);
});

/* ── MODULTÉRKÉP ─────────────────────────────────────────────────────── */

test("a modultérkép minden útvonala LÉTEZIK", async () => {
  const { loadTerkep, validateTerkep, merleg } =
    await import("../core/karbantartas/terkep.ts");
  const t = loadTerkep(join(ROOT, "registry", "modulok", "terkep.json"));
  // Egy hibás térkép nem „pontatlan”, hanem FÉLREVEZETŐ: a bemutató, a
  // dokumentáció és az onboarding mind belőle dolgozik.
  assert.deepEqual(validateTerkep(t, ROOT).filter((i) => i.severity === "error"), []);
  const m = merleg(t);
  assert.equal(m.modul, 37);
  assert.equal(m.doksiNelkul, 0, "minden modulhoz tartozik dokumentum");
  assert.equal(m.tesztNelkul, 0, "minden modulhoz tartozik teszt");
});

test("a nem létező útvonal a térképen: BUILD-HIBA", async () => {
  const { validateTerkep } = await import("../core/karbantartas/terkep.ts");
  const rossz = { megnevezes: "x", note: "x", modulok: [
    { n: 1, kod: ["core/nincs-ilyen"], teszt: [], doksi: null }] };
  const e = validateTerkep(rossz, ROOT).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /FÉLREVEZETŐ/);
});

test("a modulszámozás HÉZAGMENTES", async () => {
  const { validateTerkep } = await import("../core/karbantartas/terkep.ts");
  // Egy kihagyott szám fél év múlva megválaszolhatatlan kérdés: volt ott
  // modul, vagy sosem volt? A 36. modul épp egy ilyen hézag volt.
  const hezag = { megnevezes: "x", note: "x", modulok: [
    { n: 1, kod: [], teszt: [], doksi: null },
    { n: 3, kod: [], teszt: [], doksi: null }] };
  const e = validateTerkep(hezag, ROOT).filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /Hézag a modulszámozásban/.test(x.message)));
});
