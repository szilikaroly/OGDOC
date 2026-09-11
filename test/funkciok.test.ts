/**
 * FUNKCIÓK — a modul kezdőlapjának fő funkciói adatból, egy mező egy helyen.
 *
 * A nőgyógyászati vizit fő funkciói (manuális vizsgálat, ultrahang,
 * kolposzkópia, kenetek, STI, koraterhesség, szűrés, emlő, családtervezés)
 * más-más regiszter-modulban élő mezőkből állnak. A virtuális szakasz ezeket
 * egy helyre gyűjti — és onnan, ahol voltak, ELVISZI. Ez a teszt azt rögzíti,
 * hogy (1) a készlet hibátlan, (2) egyetlen mező sem jelenik meg kétszer,
 * (3) az áthelyezett mező a régi moduljából eltűnt, (4) az „Egyebek”
 * automatikus, és (5) a hibás készlet megnevezett hibát ad.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "../core/load.ts";
import { buildFormSpec } from "../core/ui/formspec.ts";
import { loadModulcimek } from "../core/ui/modulcimek.ts";
import {
  hozzarendel, illik, loadFunkciok, merleg, szakaszKulcsok, validateFunkciok,
} from "../core/ui/funkciok.ts";
import type { FunkcioKeszlet } from "../core/ui/funkciok.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REG = loadRegistry(join(ROOT, "registry", "variables"));
const CIMEK = loadModulcimek(join(ROOT, "registry", "felulet", "modulcimek.json"));
const FUNKCIOK = loadFunkciok(join(ROOT, "registry", "felulet", "funkciok.json"));
const MEZOK = REG.all().filter((v) => !v.aliasOf);

test("a funkciókészlet hibátlan", () => {
  assert.deepEqual(validateFunkciok(FUNKCIOK, MEZOK).filter((i) => i.severity === "error"), []);
});

test("illik: pontos egyezés vagy „x.” előtag — a „lab.hcg” nem fedi a „lab.hcv”-t", () => {
  assert.ok(illik("status.gyn.colposcopy", "status.gyn.colposcopy"));
  assert.ok(illik("status.gyn.colposcopy", "status.gyn.colposcopy.tz"));
  assert.ok(!illik("lab.hc", "lab.hcg"));
  assert.ok(!illik("lab.hcg", "lab.hcv"));
});

test("egy mező egy helyen: a formspec minden mezőt pontosan egyszer tartalmaz", () => {
  const spec = buildFormSpec(REG, "hu", CIMEK, FUNKCIOK);
  const idk = spec.flatMap((s) => s.fields.map((f) => f.id));
  assert.equal(new Set(idk).size, idk.length);
  assert.equal(idk.length, MEZOK.length);
});

test("a Nőgyógyászat virtuális szakasz létezik, és a kolposzkópia onnan ELTŰNT a státuszból", () => {
  const spec = buildFormSpec(REG, "hu", CIMEK, FUNKCIOK);
  const gyn = spec.find((s) => s.module === "gyn")!;
  assert.ok(gyn && gyn.virtual, "nincs virtuális gyn szakasz");
  assert.equal(gyn.title, "Nőgyógyászat");
  const kulcsok = gyn.functions!.map((f) => f.key);
  assert.deepEqual(kulcsok.slice(0, 9), ["manualis", "ultrahang", "kolposzkopia", "kenetek", "sti",
    "koraterhesseg", "szures", "emloszures", "csaladtervezes"]);
  assert.ok(gyn.fields.some((f) => f.id === "status.gyn.colposcopy" && f.fn === "kolposzkopia"));
  const status = spec.find((s) => s.module === "status")!;
  assert.ok(!status.fields.some((f) => f.id.startsWith("status.gyn.")), "a státuszban maradt gyn mező");
  // a kiürült hx.gyn nem szakasz
  assert.ok(!spec.some((s) => s.module === "hx.gyn"));
  assert.ok(!szakaszKulcsok(FUNKCIOK, MEZOK).has("hx.gyn"));
  assert.ok(szakaszKulcsok(FUNKCIOK, MEZOK).has("gyn"));
});

test("az „Egyebek” automatikus, és csak ott van, ahol marad fedetlen mező", () => {
  const spec = buildFormSpec(REG, "hu", CIMEK, FUNKCIOK);
  const ekg = spec.find((s) => s.module === "ekg")!;
  const egyeb = ekg.functions!.find((f) => f.key === "egyeb")!;
  assert.ok(egyeb && egyeb.fields.includes("ekg.rate"), "az EKG frekvencia az Egyebekbe tartozik");
  assert.equal(egyeb.title, null);
  const lab = spec.find((s) => s.module === "lab")!;
  assert.ok(!lab.functions!.some((f) => f.key === "egyeb"), "a labor minden mezője funkcióhoz tartozik");
  // a funkció mezői és a szakasz mezői ugyanazok
  for (const s of spec) if (s.functions) {
    const fnIdk = s.functions.flatMap((f) => f.fields).sort();
    assert.deepEqual(fnIdk, s.fields.map((f) => f.id).sort(), s.module);
  }
});

test("funkció nélkül a formspec a régi felosztást adja (visszafelé kompatibilis)", () => {
  const spec = buildFormSpec(REG, "hu", CIMEK, null);
  assert.ok(spec.some((s) => s.module === "hx.gyn"));
  assert.ok(!spec.some((s) => s.module === "gyn"));
  assert.ok(spec.every((s) => !s.functions));
});

test("a hibás készlet megnevezett hibát ad: kétszeres mező, üres bejegyzés, idegen mező, üres funkció", () => {
  const rossz: FunkcioKeszlet = { megnevezes: "t", szakaszok: [
    { kulcs: "status", funkciok: [
      { kulcs: "a", cim: { hu: "A" }, mezok: ["status.internal"] },
      { kulcs: "b", cim: { hu: "B" }, mezok: ["status.internal.edema", "status.nincsilyen", "lab.plt"] },
      { kulcs: "c", cim: { hu: "C" }, mezok: [] },
    ] },
    { kulcs: "lab", virtualis: true, funkciok: [] },
  ] };
  const hibak = validateFunkciok(rossz, MEZOK).map((i) => i.message);
  assert.ok(hibak.some((m) => /két funkcióhoz/.test(m)), "kétszeres");
  assert.ok(hibak.some((m) => /egyetlen mezőt sem fed — elgépelés/.test(m)), "üres bejegyzés");
  assert.ok(hibak.some((m) => /saját moduljának mezőit/.test(m)), "idegen mező");
  assert.ok(hibak.some((m) => /„C” funkció egyetlen mezőt sem fed/.test(m)), "üres funkció");
  assert.ok(hibak.some((m) => /virtuális szakasz kulcsa egy létező regiszter-modulé/.test(m)), "virtuális ütközés");
  const h = hozzarendel(rossz, MEZOK.map((m) => m.id));
  assert.ok(h.utkozes.length >= 1);
});

test("mérleg: 1 virtuális szakasz, áthelyezett mezők száma egyezik a gyn szakasz méretével", () => {
  const m = merleg(FUNKCIOK, MEZOK);
  const spec = buildFormSpec(REG, "hu", CIMEK, FUNKCIOK);
  assert.equal(m.virtualis, 1);
  assert.equal(m.athelyezett, spec.find((s) => s.module === "gyn")!.fields.length);
});
