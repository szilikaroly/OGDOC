/**
 * MODULCÍMEK — a modulkulcsok neve adat, nem kód.
 *
 * A felület a nyers kulcsot írta ki fejlécként. Ez a teszt azt rögzíti, hogy
 * (1) minden kulcsnak van neve, (2) a név a regiszterből jön, (3) a hiánya
 * JELÖLT visszaesés, nem csendes, és (4) a sorrend a betegúté.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "../core/load.ts";
import { buildFormSpec } from "../core/ui/formspec.ts";
import {
  cimzes, loadModulcimek, merleg, validateModulcimek,
} from "../core/ui/modulcimek.ts";
import type { ModulCimKeszlet } from "../core/ui/modulcimek.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REG = loadRegistry(join(ROOT, "registry", "variables"));
const CIMEK = loadModulcimek(join(ROOT, "registry", "felulet", "modulcimek.json"));
const KULCSOK = new Set(REG.all().map((v) => v.module));

test("a modulcím-készlet hibátlan, és MINDEN modulkulcsot lefed", () => {
  assert.deepEqual(validateModulcimek(CIMEK, KULCSOK), []);
  assert.equal(CIMEK.modulok.length, KULCSOK.size);
});

test("a formspec minden szekciója címet kap, és hu-ban egyik sem visszaesés", () => {
  const spec = buildFormSpec(REG, "hu", CIMEK);
  for (const s of spec) {
    assert.ok(s.title && s.title !== s.module, `${s.module}: a cím a nyers kulcs maradt`);
    assert.equal(s.titleFallback, false, `${s.module}: hu-ban nem lehet visszaesés`);
    assert.ok(s.groupTitle, `${s.module}: nincs csoportcím`);
  }
});

test("angolul is minden címnek van alakja — a fordítatlan JELÖLVE volna", () => {
  const spec = buildFormSpec(REG, "en", CIMEK);
  const vissza = spec.filter((s) => s.titleFallback).map((s) => s.module);
  assert.deepEqual(vissza, []);
  assert.equal(merleg(CIMEK, "en").forditatlan, 0);
});

test("cím nélkül a kulcs jön vissza — de JELÖLVE, nem csendben", () => {
  const c = cimzes(CIMEK, "nincs.ilyen", "hu");
  assert.equal(c.title, "nincs.ilyen");
  assert.equal(c.titleFallback, true);
  const semmi = cimzes(null, "lab", "hu");
  assert.equal(semmi.titleFallback, true);
});

test("a sorrend a betegúté: az azonosítás elöl, a lezárás hátul", () => {
  const spec = buildFormSpec(REG, "hu", CIMEK);
  const idx = (m: string) => spec.findIndex((s) => s.module === m);
  assert.ok(idx("ctx") < idx("complaints"), "a kontextus a panaszok előtt");
  assert.ok(idx("complaints") < idx("status"), "a panaszok a státusz előtt");
  assert.ok(idx("status") < idx("lab"), "a státusz a vizsgálatok előtt");
  assert.ok(idx("lab") < idx("out"), "a vizsgálatok a kimenetel előtt");
  assert.equal(spec[spec.length - 1].group, "lezaras");
});

test("cím nélkül (régi hívás) az ábécé marad — nem törik a régi viselkedés", () => {
  const spec = buildFormSpec(REG, "hu");
  const kulcsok = spec.map((s) => s.module);
  assert.deepEqual(kulcsok, [...kulcsok].sort((a, b) => a.localeCompare(b)));
});

test("az elárvult cím hiba: egy átnevezés után az ilyen sor hazudik", () => {
  const k: ModulCimKeszlet = structuredClone(CIMEK);
  k.modulok.push({ kulcs: "regi.modul", cim: { hu: "Régi" }, csoport: "lezaras" });
  assert.ok(validateModulcimek(k, KULCSOK).some((i) => /Elárvult/.test(i.message)));
});

test("a hiányzó cím hiba: a nyers kulcs klinikus elé nem kerülhet", () => {
  const k: ModulCimKeszlet = structuredClone(CIMEK);
  k.modulok = k.modulok.filter((m) => m.kulcs !== "lab");
  assert.ok(validateModulcimek(k, KULCSOK).some((i) => i.id === "lab" && /nincs címe/.test(i.message)));
});

test("két csoport azonos sorrendje hiba — a navigátor különben nem determinisztikus", () => {
  const k: ModulCimKeszlet = structuredClone(CIMEK);
  k.csoportok[1].sorrend = k.csoportok[0].sorrend;
  assert.ok(validateModulcimek(k, KULCSOK).some((i) => /nem determinisztikus/.test(i.message)));
});
