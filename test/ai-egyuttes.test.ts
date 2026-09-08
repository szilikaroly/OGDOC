/**
 * A MODELLPANEL — külön eredmények, és egy összevonás, ami nem hazudik.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadModellek } from "../core/ai/modell.ts";
import type { ModellKeszlet } from "../core/ai/modell.ts";
import { osszevon, panel, validateEgyuttes } from "../core/ai/egyuttes.ts";
import type { ModellEredmeny, TanitoAdat } from "../core/ai/egyuttes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const K = (): ModellKeszlet =>
  loadModellek(join(HERE, "..", "registry", "ai", "modellek.json"));

const UCI: TanitoAdat = { id: "adat.uci-ctg", megnevezes: "UCI CTG",
  md5: "e9a749d3003a7c2f224c92ce0ffd99df", n: 2126, cimkeFajta: "olvasat" };
const LILLE: TanitoAdat = { id: "adat.lille-fhr", megnevezes: "Lille FHR",
  md5: null, n: null, cimkeFajta: "olvasat" };
const KIMENETEL: TanitoAdat = { id: "adat.kimenetel", megnevezes: "Kimeneteli kohorsz",
  md5: null, n: 8000, cimkeFajta: "kimenetel" };

const e = (id: string, cimke: string | null, adat: TanitoAdat | null): ModellEredmeny => ({
  modell: id, megnevezes: id, allapot: cimke ? "kimenet" : "nemItelhetoMeg",
  cimke, bizonyossag: null, tanitoAdat: adat, miert: "teszt",
});

/* ── KÜLÖN EREDMÉNYEK ────────────────────────────────────────────────── */

test("a panel MINDEN jelöltnek ad sort — a zárt kapu is adat", () => {
  const k = K();
  const p = panel(k, []);
  assert.equal(p.length, k.jeloltek.length);
  assert.ok(p.every((x) => x.allapot === "kapuZarva"),
    "ma egyetlen modell kapuja sincs nyitva, és mindegyik MEGNEVEZI, miért");
  assert.ok(p.every((x) => x.miert.length > 20));
});

test("a „nem tudom megítélni” ÉRVÉNYES kimenet, nem hiba", () => {
  const r = e("m", null, UCI);
  assert.equal(r.allapot, "nemItelhetoMeg");
  const o = osszevon([r]);
  assert.equal(o.allapot, "nincsKimenet");
});

/* ── AZ ÖSSZEVONÁS ───────────────────────────────────────────────────── */

test("HAT MODELL EGY ADATBÓL = EGY HANG, nem hat", () => {
  const o = osszevon(["a", "b", "c", "d", "e", "f"].map((x) => e(x, "pathological", UCI)));
  assert.equal(o.allapot, "egyHang");
  assert.equal(o.modellekSzama, 6);
  assert.equal(o.fuggetlenHangok, 1);
  assert.equal(o.megerosit, false, "az egyetértésük NEM erősít");
  assert.match(o.miert, /visszhang, nem megerősítés/);
  assert.equal(o.cimke, "pathological", "a besorolás ettől még megszülethet");
});

test("a hangon BELÜLI eltérés is jel", () => {
  const o = osszevon([e("a", "normal", UCI), e("b", "pathological", UCI)]);
  assert.equal(o.allapot, "egyHang");
  assert.equal(o.hangok[0].belsoEltres, true);
  assert.equal(o.cimke, null, "eltérő hangon belül nincs közös címke");
  assert.match(o.miert, /a hangon belül sincs egyetértés/);
});

test("KÉT FÜGGETLEN HANG EGYETÉRTÉSE — ez az egyetlen eset, ami erősít", () => {
  const o = osszevon([e("a", "pathological", UCI), e("b", "pathological", UCI),
                      e("c", "pathological", LILLE)]);
  assert.equal(o.allapot, "egyetertes");
  assert.equal(o.fuggetlenHangok, 2, "három modell, két hang");
  assert.equal(o.modellekSzama, 3);
  assert.equal(o.megerosit, true);
  assert.equal(o.cimke, "pathological");
});

test("FÜGGETLEN HANGOK ELTÉRÉSÉBŐL NEM KÉPZÜNK TÖBBSÉGET", () => {
  const o = osszevon([e("a", "normal", UCI), e("b", "normal", UCI),
                      e("c", "pathological", LILLE)]);
  assert.equal(o.allapot, "elteres");
  assert.equal(o.cimke, null, "2:1 „többség” NEM születik");
  assert.match(o.miert, /az egyetlen valódi információ itt/);
});

test("OLVASATRA ÉS KIMENETELRE TANÍTOTT MODELL NEM VONHATÓ ÖSSZE", () => {
  const o = osszevon([e("a", "pathological", UCI), e("b", "pathological", KIMENETEL)]);
  assert.equal(o.allapot, "kevertKerdes");
  assert.equal(o.cimke, null);
  assert.equal(o.megerosit, false);
  assert.match(o.miert, /az átlaguk semmit nem jelent/);
});

test("ismeretlen tanítóadatú modell MAGÁBAN áll — nem feltételezzük függetlennek, és nem is az ellenkezőjét", () => {
  const o = osszevon([e("a", "normal", UCI), e("b", "normal", null)]);
  assert.equal(o.fuggetlenHangok, 2);
  assert.equal(o.hangok.find((h) => h.adat === "modell:b")!.cimkeFajta, "ismeretlen");
});

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

test("tanítóadat nélküli jelölt: HIBA", () => {
  const k = K();
  const j = JSON.parse(JSON.stringify(k.jeloltek[0]));
  delete j.tanitoAdat;
  const h = validateEgyuttes({ ...k, jeloltek: [j] }).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /a független hangot\s+a visszhangtól/);
});

test("a valódi készlet kimondja, hány jelölt osztozik EGY adatsoron", () => {
  const w = validateEgyuttes(K()).filter((i) => i.id === "ai.egyuttes");
  assert.equal(w.length, 1);
  assert.match(w[0].message, /bájtra azonos/);
  assert.match(w[0].message, /NEM mutatja megerősítésnek/);
});

test("a valódi készletben MINDEN jelöltnek van tanítóadat-ujjlenyomata", () => {
  assert.equal(validateEgyuttes(K()).filter((i) => i.severity === "error").length, 0);
});
