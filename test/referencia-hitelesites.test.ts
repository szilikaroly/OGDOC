/**
 * A REFERENCIÁK HITELESÍTÉSE — a 6. lépés gépi fele.
 *
 * Amit ezek a tesztek bizonyítanak, az nem az, hogy a rendszer alá tud írni.
 * Azt bizonyítják, hogy **az aláírás ahhoz kötődik, amit aláírtak**, és hogy
 * a kaput jelöléssel nem lehet kinyitni.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { recompute, setValue } from "../core/derive/engine.ts";
import type { CaseState } from "../core/types.ts";
import { referenciaKontextus, REFERENCIA_KONTEXTUSOK } from "../core/ui/meres.ts";
import {
  alkalmaz, hitelesitesAllapot, lenyeg, lenyomat, loadHitelesitesek, merleg,
  referenciasValtozok, validateHitelesitesek,
} from "../core/lab/hitelesites.ts";
import type { HitelesitesKatalogus } from "../core/lab/hitelesites.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const VARS = join(HERE, "..", "registry", "variables");
const reg = loadRegistry(VARS);
const KAT = loadHitelesitesek(
  join(HERE, "..", "registry", "labor", "referencia-hitelesitesek.json"));

/** Friss regiszter — az `alkalmaz()` a definíciókat írja, tehát izolálni kell. */
const friss = () => loadRegistry(VARS);

const ures = (): HitelesitesKatalogus => ({ szerepek: KAT.szerepek, hitelesitesek: [] });

function alairva(r = reg, id = "lab.alp"): HitelesitesKatalogus {
  const d = r.get(id)!;
  return {
    szerepek: KAT.szerepek,
    hitelesitesek: [{
      variable: id, ki: "dr. Példa Éva", szerep: "labor", mikor: "2026-09-12",
      lenyomat: lenyomat(lenyeg(d)), forrasTabla: "Abbassi-Ghanavati 2009, Table 1",
    }],
  };
}

/* ── ALAPÁLLAPOT ─────────────────────────────────────────────────────── */

test("a hitelesítési lista üresen indul, és MINDEN tétel aláíratlan", () => {
  assert.deepEqual(KAT.hitelesitesek, [], "az üres lista nem hiányosság");
  const m = merleg(hitelesitesAllapot(reg, KAT));
  assert.equal(m.hitelesitve, 0);
  assert.equal(m.alairatlan, m.osszes);
  assert.ok(m.savokHatra > 100, "és megmondja, hány SZÁM vár összevetésre");
});

test("minden referenciás változó szerepel a munkalapon", () => {
  assert.equal(hitelesitesAllapot(reg, KAT).length, referenciasValtozok(reg).length);
});

/* ── AZ ALÁÍRÁS AHHOZ KÖTŐDIK, AMIT ALÁÍRTAK ─────────────────────────── */

test("az aláírás hitelesíti a tételt", () => {
  const a = hitelesitesAllapot(reg, alairva()).find((x) => x.variable === "lab.alp")!;
  assert.equal(a.allapot, "hitelesitve");
  assert.equal(a.alairo, "dr. Példa Éva");
});

test("egy HATÁRÉRTÉK megváltoztatása elavulttá teszi az aláírást", () => {
  const r = friss();
  const kat = alairva(r);
  r.get("lab.alp")!.reference!.ranges[0].high = 999;   // egyetlen szám
  const a = hitelesitesAllapot(r, kat).find((x) => x.variable === "lab.alp")!;
  assert.equal(a.allapot, "elavult");
  assert.match(a.miert!, /számai megváltoztak/);
});

test("a MEGJEGYZÉS és a FORRÁSIDÉZET javítása NEM rontja el az aláírást", () => {
  const r = friss();
  const kat = alairva(r);
  r.get("lab.alp")!.reference!.ranges[0].note = { hu: "javított magyarázat" };
  r.get("lab.alp")!.reference!.source.cite = "ugyanaz a tábla, pontosabb hivatkozással";
  const a = hitelesitesAllapot(r, kat).find((x) => x.variable === "lab.alp")!;
  assert.equal(a.allapot, "hitelesitve",
    "egy elírás javítása nem veheti el a szakorvos aláírását");
});

test("az EGYSÉG megváltoztatása is elavulttá tesz — ez a leggyakoribb néma hiba", () => {
  const r = friss();
  const kat = alairva(r);
  r.get("lab.alp")!.unit = "µkat/L";
  assert.equal(
    hitelesitesAllapot(r, kat).find((x) => x.variable === "lab.alp")!.allapot,
    "elavult");
});

/* ── A KAPUT ALÁÍRÁS NYITJA, NEM JELÖLÉS ─────────────────────────────── */

test("kézzel „primary”-re írt referencia BUILD-HIBA", () => {
  const r = friss();
  r.get("lab.alp")!.reference!.verification = "primary";
  const issues = validateHitelesitesek(r, ures());
  assert.ok(issues.some((i) => i.severity === "error" && /HITELESÍTÉS NÉLKÜL/.test(i.message)),
    "az aláírás nélküli emelés pontosan az, amit meg kell akadályozni");
});

test("az `alkalmaz()` CSAK a hitelesített tételt emeli primary-re", () => {
  const r = friss();
  const n = alkalmaz(r, alairva(r));
  assert.equal(n, 1);
  assert.equal(r.get("lab.alp")!.reference!.verification, "primary");
  assert.equal(r.get("lab.alt")!.reference!.verification, "assumed",
    "az aláíratlan tétel érintetlen marad");
});

test("elavult aláírással a tétel NEM emelkedik primary-re", () => {
  const r = friss();
  const kat = alairva(r);
  r.get("lab.alp")!.reference!.ranges[0].high = 999;
  assert.equal(alkalmaz(r, kat), 0);
  assert.equal(r.get("lab.alp")!.reference!.verification, "assumed");
});

/* ── AZ ALÁÍRÁS ÉRVÉNYESSÉGE ─────────────────────────────────────────── */

test("a névtelen aláírás és a forrástábla hiánya BUILD-HIBA", () => {
  const kat: HitelesitesKatalogus = {
    szerepek: KAT.szerepek,
    hitelesitesek: [{
      variable: "lab.alp", ki: "  ", szerep: "labor", mikor: "2026-09-12",
      lenyomat: lenyomat(lenyeg(reg.get("lab.alp")!)), forrasTabla: "",
    }],
  };
  const issues = validateHitelesitesek(reg, kat);
  assert.ok(issues.some((i) => /névtelen hitelesítés/.test(i.message)));
  assert.ok(issues.some((i) => /forrasTabla/.test(i.message)));
});

test("hitelesítés nem létező vagy referencia nélküli változóra hiba", () => {
  const mk = (v: string) => ({
    szerepek: KAT.szerepek,
    hitelesitesek: [{ variable: v, ki: "X", szerep: "labor", mikor: "2026-09-12",
                      lenyomat: "0", forrasTabla: "t" }],
  });
  assert.ok(validateHitelesitesek(reg, mk("nincs.ilyen"))
    .some((i) => /nem létező változóra/.test(i.message)));
  assert.ok(validateHitelesitesek(reg, mk("patient.taj"))
    .some((i) => /nincs referenciatartománya/.test(i.message)));
});

test("a valódi katalógus hibátlan", () => {
  assert.deepEqual(validateHitelesitesek(reg, KAT).filter((i) => i.severity === "error"), []);
});

/* ── A GYERMEKÁGY: AZ ELÉRHETETLEN SÁV ───────────────────────────────── */

test("a rendszer elő tudja állítani MINDEN kontextust, amit a regiszter használ", () => {
  const hasznalt = new Set<string>();
  for (const d of referenciasValtozok(reg)) {
    for (const r of d.reference!.ranges) hasznalt.add(r.context);
  }
  for (const k of hasznalt) {
    assert.ok((REFERENCIA_KONTEXTUSOK as readonly string[]).includes(k),
      `„${k}” sáv sosem választódna ki — ez a legcsendesebb hibafajta`);
  }
});

test("a gyermekágy MEGELŐZI a „nem terhes” ágat", () => {
  const NOW = "2026-09-05T12:00:00Z";
  const base = (): CaseState =>
    ({ ctx: { encounter: "ambulatory", now: NOW }, values: {}, errors: [] });
  const napokkalEzelott = (n: number) =>
    new Date(Date.parse(NOW) - n * 86_400_000).toISOString();

  // Szülés után 10 nappal: a `ctx.pregnant` már „neg”, mégis postpartum.
  let s = setValue(reg, base(), "ctx.pregnant", "neg");
  s = recompute(reg, setValue(reg, s, "nb.birth.at", napokkalEzelott(10)));
  assert.equal(referenciaKontextus(reg, s), "postpartum");

  // 50 nappal később a gyermekágy lejárt — innen nem terhes.
  let k = setValue(reg, base(), "ctx.pregnant", "neg");
  k = recompute(reg, setValue(reg, k, "nb.birth.at", napokkalEzelott(50)));
  assert.equal(referenciaKontextus(reg, k), "nonpregnant");
});

test("a terhességi állapot hiánya továbbra sem „nem terhes”", () => {
  const s: CaseState = {
    ctx: { encounter: "ambulatory", now: "2026-09-05T12:00:00Z" }, values: {}, errors: [],
  };
  assert.equal(referenciaKontextus(reg, s), null);
});
