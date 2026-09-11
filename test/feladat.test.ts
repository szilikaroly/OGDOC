/**
 * FELADATPROFILOK — a felület feladat szerint adaptív, nem szerep szerint szűkített.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "../core/load.ts";
import { loadCsoportok } from "../core/auth/csoport.ts";
import {
  alapProfil, feladatNezet, loadFeladatok, merleg, validateFeladatok,
} from "../core/ui/feladat.ts";
import type { FeladatKeszlet } from "../core/ui/feladat.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REG = loadRegistry(join(ROOT, "registry", "variables"));
const F = loadFeladatok(join(ROOT, "registry", "felulet", "feladatprofilok.json"));
const CS = loadCsoportok(join(ROOT, "registry", "auth", "csoportok.json"));
const MODULOK = new Set(REG.all().map((v) => v.module));
const KLINIKAI = CS.csoportok.filter((c) => c.szerepek.some((s) => s === "clinician" || s === "assistant")).map((c) => c.id);

test("a feladatprofil-készlet hibátlan", () => {
  const hibak = validateFeladatok(F, MODULOK, KLINIKAI).filter((i) => i.severity === "error");
  assert.deepEqual(hibak, []);
});

test("minden klinikai csoportnak van alapértelmezett feladata", () => {
  for (const cs of KLINIKAI) assert.ok(alapProfil(F, cs), `${cs}: nincs profil`);
});

test("a csoport nélküli felhasználó a betegút teljes sorrendjét kapja (null)", () => {
  assert.equal(alapProfil(F, null), null);
  assert.equal(alapProfil(F, "csoport.rendszergazda"), null);
});

test("a szülésznő alapértelmezett feladata a szülőszoba, és az első modulja a kontextus", () => {
  const p = alapProfil(F, "csoport.szulesznő")!;
  assert.equal(p.id, "feladat.szules");
  assert.equal(p.modulok[0], "ctx");
  assert.ok(p.modulok.includes("labour") && p.modulok.includes("szuloszoba"));
});

test("a profil nem SZŰKÍT: a jogosultság dönti el a láthatóságot, a profil csak a nyitottságot", () => {
  // Szerkezeti állítás: a profil modulokat NEVEZ MEG, nem tilt — nincs „tiltott” mező.
  for (const p of F.profilok) assert.ok(!("tiltott" in p) && !("rejtett" in p));
});

test("a nyelvre kész alak: cím és leírás, angolul is visszaesés nélkül", () => {
  for (const n of feladatNezet(F, "en")) {
    assert.equal(n.titleFallback, false, `${n.id}: nincs angol cím`);
    assert.ok(n.title && n.title !== n.id);
  }
});

test("a lefedettség mérlege: MINDEN modult nyit valamelyik feladat", () => {
  const m = merleg(F, MODULOK);
  assert.equal(m.lefedettModul, m.osszesModul, `${m.lefedettModul}/${m.osszesModul} — van modul, amit egyetlen feladat sem nyit`);
});

test("ismeretlen modul a profilban HIBA — egy átnevezés után csendben kevesebbet nyitna", () => {
  const k: FeladatKeszlet = structuredClone(F);
  k.profilok[0].modulok.push("nincs.ilyen");
  assert.ok(validateFeladatok(k, MODULOK, KLINIKAI).some((i) => i.severity === "error" && /ismeretlen modulra/.test(i.message)));
});

test("ismétlődő modul a sorrendben HIBA", () => {
  const k: FeladatKeszlet = structuredClone(F);
  k.profilok[0].modulok.push(k.profilok[0].modulok[0]);
  assert.ok(validateFeladatok(k, MODULOK, KLINIKAI).some((i) => /ismétlődő modul/.test(i.message)));
});
