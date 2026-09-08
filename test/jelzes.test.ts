/**
 * A GYERMEKVÉDELMI JELZÉS TESZTJEI.
 *
 * Két dolgot védenek, és a második a fontosabb:
 *
 *   1. a leletből levezetett gyanú tényleg megszólal;
 *   2. a BÜNTETHETŐSÉG és a JELZÉSI KÖTELEZETTSÉG nem mosódik össze.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";
import {
  jelzesItelet, korsav, korviszony, levezetettJelzesek, loadBtk, validateBtk,
} from "../core/gyermek/jelzes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const reg = loadRegistry(join(ROOT, "registry", "variables"));
const btk = loadBtk(join(ROOT, "registry", "gyermek", "beleegyezes-btk.json"));
const NOW = "2026-09-05T12:00:00Z";

/** A `patient.age` LEVEZETETT — a teszt születési dátumot ír, nem életkort. */
function eset(mezok: Record<string, unknown>): CaseState {
  let s: CaseState = {
    ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [],
  };
  const { "patient.age": kor, ...tobbi } = mezok;
  if (typeof kor === "number") {
    const sz = new Date(Date.parse(NOW) - Math.round(kor * 365.25) * 86_400_000);
    s = setValue(reg, s, "patient.birthDate", sz.toISOString().slice(0, 10));
  }
  for (const [id, v] of Object.entries(tobbi)) s = setValue(reg, s, id, v);
  return recompute(reg, s);
}

/* ── A MÁTRIX ────────────────────────────────────────────────────────── */

test("a mátrix hézagmentes, és a hiánya nem „nem büntetendő”", () => {
  assert.deepEqual(validateBtk(btk).filter((i) => i.severity === "error"), []);
});

test("a tábla ALÁÍRATLAN, és ezt kimondja", () => {
  assert.equal(btk.alairas, null);
  const w = validateBtk(btk).filter((i) => i.severity === "warning");
  assert.equal(w.length, 1);
  assert.match(w[0].message, /előadásdiáról származik/i);
  assert.equal(korviszony(btk, 13, 16).alairt, false);
});

test("a korsávok határai zárnak: a 12. és a 14. születésnap a felső sávba esik", () => {
  assert.equal(korsav(btk, 11.9)!.id, "sav.12a");
  assert.equal(korsav(btk, 12)!.id, "sav.12_14");
  assert.equal(korsav(btk, 13.9)!.id, "sav.12_14");
  assert.equal(korsav(btk, 14)!.id, "sav.14_18");
  assert.equal(korsav(btk, 18)!.id, "sav.18f");
});

test("A BÜNTETHETŐSÉG ÉS A BELEEGYEZÉS KÉT KÜLÖN ÁLLÍTÁS", () => {
  // Ez a teszt lényege. A 13 éves és a 16 éves fél közti cselekmény a Btk.
  // szerint NEM BÜNTETENDŐ — a 13 éves ettől még nem adhatott érvényes
  // beleegyezést. Egyetlen mezőbe összevonva ez a különbség eltűnne.
  const r = korviszony(btk, 13, 16);
  assert.equal(r.besorolas, "nemBuntetendo");
  assert.equal(r.adhatottBeleegyezest, false);
  assert.match(r.miert, /NEM ADHATOTT ÉRVÉNYES BELEEGYEZÉST/);
});

test("a „nem büntetendő” leírása maga mondja ki, hogy nem „nincs teendő”", () => {
  assert.match(btk.besorolasok["nemBuntetendo"], /NEM AZT JELENTI, HOGY NINCS TEENDŐ/);
  assert.match(btk.besorolasok["nincsFelelosseg"], /gyermekvédelmi teendő ettől független/);
});

test("a korviszony besorolásai a forrástábla szerint", () => {
  const p = (a: number, b: number) => korviszony(btk, a, b).besorolas;
  assert.equal(p(11, 15), "szexualisEroszak");
  assert.equal(p(11, 19), "szexualisEroszak");
  assert.equal(p(13, 19), "szexualisVisszaeles");
  assert.equal(p(16, 25), "csakMinositett");
  assert.equal(p(10, 13), "nincsFelelosseg");
  assert.equal(p(16, 17), "nemBuntetendo");
});

test("hiányzó életkor: nincs besorolás, és a hiány nem „nagykorú”", () => {
  const r = korviszony(btk, 13, null);
  assert.equal(r.allapot, "kornemIsmert");
  assert.equal(r.besorolas, null);
  assert.match(r.miert, /NEM „nagykorú” és NEM „rendben”/);
  // …de amit tudunk, azt kimondjuk: a 13 éves nem egyezhetett bele.
  assert.equal(r.adhatottBeleegyezest, false);
});

/* ── A LELETBŐL LEVEZETETT JELZÉS ────────────────────────────────────── */

test("TERHESSÉG A KORHATÁR ALATT: a jelzés nem mérlegelés kérdése", () => {
  const j = levezetettJelzesek(reg,
    eset({ "patient.age": 12, "ctx.pregnant": "pos" }), btk);
  const t = j.find((x) => x.id === "jelzes.terhesseg.korhataralatt")!;
  assert.ok(t);
  assert.equal(t.suly, "jogilagKotelezo");
  assert.match(t.mit, /nem „korai szexuális aktivitás”/);
  assert.match(t.teendo, /HALADÉKTALANUL/);
});

test("a korhatár FELETT a terhesség önmagában nem jelzés", () => {
  // 15 évesen a terhesség klinikai kérdés — de nem jogi tény a bűncselekményről.
  const j = levezetettJelzesek(reg,
    eset({ "patient.age": 15, "ctx.pregnant": "pos" }), btk);
  assert.ok(!j.some((x) => x.id === "jelzes.terhesseg.korhataralatt"));
});

test("IGAZOLT STI PUBERTÁS ELŐTT: sentinel lelet", () => {
  const j = levezetettJelzesek(reg, eset({
    "patient.age": 8, "status.fert.tanner.breast": 1,
    "pedgyn.sti.confirmed": "gonorrhoea",
  }), btk);
  const s = j.find((x) => x.id === "jelzes.sti.prepubertalis")!;
  assert.ok(s);
  assert.equal(s.suly, "orszentinel");
  // A KIVÉTEL IS OTT VAN AZ ÜZENETBEN: a HPV/HSV perinatálisan is szerezhető.
  assert.match(s.mit, /HPV és a HSV perinatálisan is szerezhető/);
});

test("a NEM VIZSGÁLT STI nem „nincs fertőzés”", () => {
  const j = levezetettJelzesek(reg, eset({
    "patient.age": 8, "status.fert.tanner.breast": 1, "pedgyn.sti.confirmed": "unk",
  }), btk);
  assert.ok(!j.some((x) => x.id === "jelzes.sti.prepubertalis"),
    "a `unk` nem indít jelzést — de nem is nyugtat meg senkit");
});

test("az ISMÉTLŐDŐ MEGJELENÉS mintázatként szólal meg", () => {
  const j = levezetettJelzesek(reg, eset({
    "patient.age": 7, "status.fert.tanner.breast": 1, "pedgyn.presentations.12m": 4,
  }), btk);
  const m = j.find((x) => x.id === "jelzes.ismetlodo.megjelenes")!;
  assert.ok(m);
  assert.match(m.mit, /MINTÁZAT/);
});

test("A PARTNER ÉLETKORA jelzést ad — de a jogi és a jelzési kérdést SZÉTVÁLASZTVA", () => {
  const j = levezetettJelzesek(reg,
    eset({ "patient.age": 13, "pedgyn.partner.age": 16 }), btk);
  const k = j.find((x) => x.id === "jelzes.korviszony")!;
  assert.ok(k, "a nem büntetendő korviszony is jelzést ad, ha a beleegyezés érvénytelen");
  assert.equal(k.suly, "orszentinel");
  assert.match(k.teendo, /A JELZÉSI KÖTELEZETTSÉG A VESZÉLYEZTETETTSÉG GYANÚJÁTÓL FÜGG/);
  assert.match(k.teendo, /„nem büntetendő” besorolás NEM jelenti azt, hogy nincs teendő/);
});

test("a 16/17 éves korviszony nem ad jelzést", () => {
  const j = levezetettJelzesek(reg,
    eset({ "patient.age": 16, "pedgyn.partner.age": 17 }), btk);
  assert.ok(!j.some((x) => x.id === "jelzes.korviszony"));
});

/* ── AZ ÖSSZESÍTETT ÍTÉLET ───────────────────────────────────────────── */

test("a kötelező jelzés felülír mindent, és megmondja, megtörtént-e", () => {
  const i = jelzesItelet(reg,
    eset({ "patient.age": 12, "ctx.pregnant": "pos" }), btk);
  assert.equal(i.allapot, "jelezniKell");
  assert.equal(i.jelzesMegtortent, null);
  assert.match(i.miert, /MÉG NEM TÖRTÉNT MEG/);

  const megtortent = jelzesItelet(reg, eset({
    "patient.age": 12, "ctx.pregnant": "pos", "pedgyn.report.made": "pos",
  }), btk);
  assert.equal(megtortent.jelzesMegtortent, true);
  assert.match(megtortent.miert, /szó szerinti idézeteit ellenőrizni kell/);
});

test("A JEL HIÁNYA NEM MEGNYUGTATÁS", () => {
  const i = jelzesItelet(reg, eset({ "patient.age": 9 }), btk);
  assert.equal(i.allapot, "nincsLevezetettJel");
  assert.match(i.miert, /EL SEM HANGZOTT KÉRDÉS/);
  assert.match(i.miert, /NEM AZT JELENTI, HOGY NINCS BAJ/);
});

test("minden jelzés VISSZAKERESHETŐ: megnevezi, mely mezőkből következik", () => {
  const j = levezetettJelzesek(reg, eset({
    "patient.age": 11, "status.fert.tanner.breast": 1,
    "pedgyn.sti.confirmed": "chlamydia", "pedgyn.partner.age": 20,
    "pedgyn.trauma.consistent": "no",
  }), btk);
  assert.ok(j.length >= 3);
  for (const x of j) {
    assert.ok(x.mezok.length, `${x.id}: nincs megnevezve, miből következik`);
    for (const m of x.mezok) assert.ok(reg.get(m), `${x.id}: ismeretlen mező ${m}`);
    assert.ok(x.teendo.trim(), `${x.id}: nincs teendő`);
  }
});
