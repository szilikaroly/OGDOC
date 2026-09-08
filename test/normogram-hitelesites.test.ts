/**
 * A NORMOGRAMOK TELEPÍTÉSE ÉS HITELESÍTÉSE — a 7. lépés gépi fele.
 *
 * A legfontosabb teszt itt nem a boldog úté, hanem azé a hibaosztályé, ami a
 * lépés előtt élt: egy karakterlánc-hasonlítás, ami sosem volt igaz.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { loadChartCatalogue } from "../core/us/katalogus.ts";
import { adPercentilist, hitelesitett, loadNormograms } from "../core/us/normogram.ts";
import type { Normogram } from "../core/us/normogram.ts";
import {
  alkalmazNg, lenyeg, lenyomat, loadNormogramHitelesitesek, ngAllapot,
  validateNgHitelesitesek,
} from "../core/us/hitelesites.ts";
import type { NormogramHitelesitesKatalogus } from "../core/us/hitelesites.ts";
import { elsoKor, telepitesiSorrend, telepitesMerleg } from "../core/us/telepites.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (...p: string[]) => join(HERE, "..", ...p);

const reg = loadRegistry(R("registry", "variables"));
const cat = loadChartCatalogue(R("registry", "normogramok", "katalogus.json"));
const KAT = loadNormogramHitelesitesek(R("registry", "normogramok", "hitelesitesek.json"));
const LEK = (JSON.parse(readFileSync(
  R("registry", "normogramok", "lekepezes.json"), "utf8")) as
  { kotesek: Record<string, string> }).kotesek;

const friss = (): Normogram[] =>
  loadNormograms(R("registry", "normogramok")).all().map((n) => ({ ...n }));

const ures = (): NormogramHitelesitesKatalogus =>
  ({ szerepek: KAT.szerepek, hitelesitesek: [] });

function alairva(ns: Normogram[], id = "ng.chitty.ac",
                 extra: Record<string, unknown> = {}): NormogramHitelesitesKatalogus {
  const n = ns.find((x) => x.id === id)!;
  return {
    szerepek: KAT.szerepek,
    hitelesitesek: [{
      normogram: id, ki: "dr. Példa Péter", kepesites: "FMF 123456",
      mikor: "2026-09-20", lenyomat: lenyomat(lenyeg(n)),
      forrasTabla: "Chitty 1994, Table 2", ...extra,
    }],
  };
}

/* ── A LEKÉPEZÉS ─────────────────────────────────────────────────────── */

test("a leképezés MINDEN kötése létező változóra mutat", () => {
  for (const [base, v] of Object.entries(LEK)) {
    let ok = false;
    try { ok = !!reg.get(reg.resolvePrimary(v)); } catch { ok = false; }
    assert.ok(ok, `${base} → ${v}: nem létező változó`);
  }
});

test("a leképezetlen mérés NEM kap percentilist — és ez látszik is", () => {
  const s = telepitesiSorrend(cat, friss(), LEK, reg);
  const m = telepitesMerleg(s);
  assert.ok(m.kotott > 0 && m.kotott < m.meresek,
    "a leképezés részleges — és a részlegességnek mérhetőnek kell lennie");
  const leképezetlen = s.filter((t) => !t.variable);
  assert.ok(leképezetlen.every((t) => !t.adPercentilist));
});

/* ── A RANGSOR ───────────────────────────────────────────────────────── */

test("a rangsort a MI hivatkozásaink döntik el, nem a forrásrendszer szokása", () => {
  const s = telepitesiSorrend(cat, friss(), LEK, reg);
  for (const t of elsoKor(s)) {
    assert.ok(t.hivatkozik.length > 0,
      `${t.base}: hivatkozás nélküli tétel nem kerülhet az első körbe`);
  }
});

test("minden tétel indoklása levezethető — egy indokolatlan rangsor újratárgyalódik", () => {
  for (const t of telepitesiSorrend(cat, friss(), LEK, reg)) {
    assert.ok(t.indoklas.length > 20, `${t.base}: üres indoklás`);
  }
});

test("a konvenciófüggő mérés meg van jelölve, a jelöletlen görbékkel együtt", () => {
  const s = telepitesiSorrend(cat, friss(), LEK, reg);
  const bpd = s.find((t) => t.base === "BPD")!;
  assert.equal(bpd.konvenciofuggo, true);
  assert.ok(bpd.jeloletlenKonvencio > 0);
});

/* ── A HIBAOSZTÁLY, AMI A 7. LÉPÉS ELŐTT ÉLT ─────────────────────────── */

test("a hitelesítettségi szint felsorolásból jön, nem kézzel írt szövegből", () => {
  const ns = friss();
  // A `hitelesitett` és az `adPercentilist` NEVESÍTETT kérdés. Egy elgépelt
  // szint így nem „hamis”, hanem a validálásban hangos.
  assert.equal(ns.filter(hitelesitett).length, 0);
  assert.equal(ns.filter(adPercentilist).length, 1, "a helyi tábla ad percentilist");
});

test("a helyi tábla percentilist ad, de NEM hitelesítés tárgya", () => {
  const ns = friss();
  const helyi = ngAllapot(ns, ures()).find((a) => a.normogram === "ng.local.us-ac")!;
  assert.equal(helyi.allapot, "helyi");
  assert.match(helyi.miert!, /derivedFrom/);

  // Aláírni sem lehet: a `local` sosem válik `primary`-vé.
  const rossz: NormogramHitelesitesKatalogus = {
    szerepek: KAT.szerepek,
    hitelesitesek: [{
      normogram: "ng.local.us-ac", ki: "X", kepesites: "FMF 1", mikor: "2026-09-20",
      lenyomat: "0", forrasTabla: "t",
    }],
  };
  assert.ok(validateNgHitelesitesek(ns, rossz, cat, LEK)
    .some((i) => i.severity === "error" && /sosem válik/.test(i.message)));
});

/* ── AZ ALÁÍRÁS ──────────────────────────────────────────────────────── */

test("az aláírás hitelesíti a görbét, és az `alkalmazNg` emeli primary-re", () => {
  const ns = friss();
  const kat = alairva(ns);
  assert.equal(ngAllapot(ns, kat).find((a) => a.normogram === "ng.chitty.ac")!.allapot,
    "hitelesitve");
  assert.equal(alkalmazNg(ns, kat), 1);
  assert.equal(ns.find((n) => n.id === "ng.chitty.ac")!.verification, "primary");
});

test("EGYETLEN SOR megváltoztatása elavulttá teszi az aláírást", () => {
  const ns = friss();
  const kat = alairva(ns);
  ns.find((n) => n.id === "ng.chitty.ac")!.rows = [
    ...ns.find((n) => n.id === "ng.chitty.ac")!.rows!.slice(0, -1),
    { x: 40, mean: 999, sd: 28 },
  ];
  const a = ngAllapot(ns, kat).find((x) => x.normogram === "ng.chitty.ac")!;
  assert.equal(a.allapot, "elavult");
  assert.equal(alkalmazNg(ns, kat), 0, "elavult aláírással nem emelkedik semmi");
});

test("a FORRÁSMEGJELÖLÉS javítása NEM rontja el az aláírást", () => {
  const ns = friss();
  const kat = alairva(ns);
  const n = ns.find((x) => x.id === "ng.chitty.ac")!;
  n.source = { ...n.source, cite: "ugyanaz a közlemény, pontosabb hivatkozással" };
  n.population = "pontosított populációleírás";
  assert.equal(ngAllapot(ns, kat).find((a) => a.normogram === "ng.chitty.ac")!.allapot,
    "hitelesitve");
});

test("hiányzó FMF-engedélyszám BUILD-HIBA", () => {
  const ns = friss();
  const kat = alairva(ns, "ng.chitty.ac", { kepesites: "" });
  assert.ok(validateNgHitelesitesek(ns, kat, cat, LEK)
    .some((i) => i.severity === "error" && /MÉRÉSI TECHNIKA/.test(i.message)));
});

test("konvenciófüggő mérésnél a konvenció megnevezése KÖTELEZŐ", () => {
  const ns = friss();
  // A Chitty-görbe AC-ra szól; az AC nem konvenciófüggő, tehát nincs kifogás.
  assert.deepEqual(
    validateNgHitelesitesek(ns, alairva(ns), cat, LEK).filter((i) => /KONVENCIÓFÜGGŐ/.test(i.message)),
    []);

  // Ugyanez a görbe BPD-re állítva viszont már konvenciófüggő mérés.
  const bpd = ns.map((n) => n.id === "ng.chitty.ac" ? { ...n, parameter: "us.bpd" } : n);
  const kat = alairva(bpd, "ng.chitty.ac");
  const issues = validateNgHitelesitesek(bpd, kat, cat, LEK);
  assert.ok(issues.some((i) => i.severity === "error" && /KONVENCIÓFÜGGŐ/.test(i.message)),
    "a görbe helyes lehet, a rá mért adat viszont nem hozzá tartozik");

  // A konvenció megnevezésével a kifogás elmúlik.
  const jo = alairva(bpd, "ng.chitty.ac", { konvencio: "outerInner" });
  assert.deepEqual(
    validateNgHitelesitesek(bpd, jo, cat, LEK).filter((i) => /KONVENCIÓFÜGGŐ/.test(i.message)),
    []);
});

test("kézzel `primary`-re írt görbe BUILD-HIBA", () => {
  const ns = friss();
  ns.find((n) => n.id === "ng.chitty.ac")!.verification = "primary";
  assert.ok(validateNgHitelesitesek(ns, ures(), cat, LEK)
    .some((i) => i.severity === "error" && /HITELESÍTÉS NÉLKÜL/.test(i.message)));
});

test("a valódi katalógus hibátlan", () => {
  assert.deepEqual(
    validateNgHitelesitesek(friss(), KAT, cat, LEK).filter((i) => i.severity === "error"),
    []);
});
