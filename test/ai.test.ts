/**
 * AI-MODELLEK — a kapu, ami a licencnél kezdődik.
 *
 * A tesztek a négy hivatkozott forráson futnak, és azt védik, hogy a döntés a
 * VÁLASZOKBÓL következzen, ne beírt szóból.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kapu, kimenet, loadModellek, megerosit, merleg, validateModellek,
  type Jelolt, type ModellKeszlet,
} from "../core/ai/modell.ts";

const K = () => loadModellek("registry/ai/modellek.json");
const J = (id: string, k: ModellKeszlet = K()): Jelolt => k.jeloltek.find((x) => x.id === id)!;
/** Minden blokkolóra igen. */
function teljes(k: ModellKeszlet): Jelolt {
  const v: Record<string, { van: boolean; mit: string }> = {};
  for (const x of k.kovetelmenyek) v[x.id] = { van: true, mit: "teszt" };
  return { id: "ai.teszt", megnevezes: "Teszt", forras: "-", cel: "-",
    allapot: "hitelesitesre-var", valaszok: v };
}

/* ══ 1. A LICENCKAPU MINDENT MEGELŐZ ═══════════════════════════════════ */

test("licenc nélkül az átvétel EL SEM INDUL", () => {
  const k = K();
  const g = kapu(k, J("ai.ctg-guardian", k));
  assert.equal(g.hasznalhato, false);
  assert.equal(g.allapot, "licencKapu");
  assert.match(g.miert, /akkor is így van, ha a modell egyébként\s+jó volna/);
});

test("a licenc AKKOR IS zár, ha minden más rendben van", () => {
  const k = K();
  const j = { ...teljes(k), valaszok: { ...teljes(k).valaszok,
    licenc: { van: false, mit: "nincs licencfájl" } } };
  const g = kapu(k, j);
  assert.equal(g.allapot, "licencKapu", "a licenc előbb dől el, mint bármi más");
});

test("a MIT-licences jelöltek nem a licencnél akadnak el — ez érdemi különbség", () => {
  const k = K();
  for (const id of ["ai.cervical-cytology", "ai.herlev-svm"]) {
    const g = kapu(k, J(id, k));
    assert.equal(g.hasznalhato, false);
    assert.equal(g.allapot, "blokkoloHianyzik",
      `${id}: a licenc rendben, a blokkolás oka ORVOSOLHATÓ`);
    assert.ok(!g.hianyzik.includes("licenc"));
  }
});

/* ══ 2. A HIÁNYZÓ VÁLASZ NEM „IGEN" ════════════════════════════════════ */

test("meg nem válaszolt blokkoló követelmény ugyanúgy zár, mint a nemleges", () => {
  const k = K();
  const j = teljes(k);
  delete j.valaszok["validalas"];
  const g = kapu(k, j);
  assert.equal(g.hasznalhato, false);
  assert.equal(g.allapot, "megvalaszolatlan");
  assert.deepEqual(g.megvalaszolatlan, ["validalas"]);
  assert.match(g.miert, /A hiányzó válasz nem „igen”/);
});

test("minden blokkoló teljesül → használható, de a kimenet akkor is JAVASLAT", () => {
  const k = K();
  const g = kapu(k, teljes(k));
  assert.equal(g.hasznalhato, true);
  assert.match(g.miert, /klinikusi megerősítés nélkül nem lesz belőle lelet/);
});

/* ══ 3. AZ AI-KIMENET SOSEM LELET MAGÁTÓL ══════════════════════════════ */

test("kapu mögötti modell NEM ad kimenetet", () => {
  const k = K();
  assert.equal(kimenet(k, J("ai.ctg-guardian", k), "Normal", "v1").allapot, "kapuMogott");
});

test("VERZIÓ NÉLKÜL nincs kimenet — különben visszamenőleg nem magyarázható", () => {
  const k = K();
  const ki = kimenet(k, teljes(k), "Normal");
  assert.equal(ki.allapot, "kapuMogott");
  assert.match(ki.miert, /audit-hurka nem tudja\s+visszamérni/);
});

test("a modell „nem tudom megítélni” válasza ÉRVÉNYES kimenet", () => {
  const k = K();
  const ki = kimenet(k, teljes(k), null, "v1.2.0");
  assert.equal(ki.allapot, "nemItelhetoMeg");
  assert.match(ki.miert, /ÉRVÉNYES kimenet, nem hiba/);
});

test("a javaslatból csak KLINIKUSI MEGERŐSÍTÉSSEL lesz lelet", () => {
  const k = K();
  const ki = kimenet(k, teljes(k), "Suspect", "v1.2.0", { baseline: 140 });
  assert.equal(ki.allapot, "javaslat");
  assert.equal(ki.verzio, "v1.2.0");
  assert.deepEqual(ki.bemenet, { baseline: 140 });

  assert.equal(megerosit(ki, "dr. K", true).allapot, "megerositett");
  const elvetett = megerosit(ki, "dr. K", false);
  assert.equal(elvetett.allapot, "elvetett");
  assert.match(elvetett.miert, /Ez is rögzül/, "az elvetés is adat: ebből mérhető a modell");
});

test("már megerősített kimenet nem erősíthető meg újra", () => {
  const k = K();
  const ki = megerosit(kimenet(k, teljes(k), "Normal", "v1"), "dr. A", true);
  assert.equal(megerosit(ki, "dr. B", false).megerositette, "dr. A");
});

/* ══ 4. AZ ÁLLAPOT DERIVÁLT, NEM BEÍRT SZÓ ═════════════════════════════ */

test("a nyilvántartott állapot és a kapuból következő állapot EGYEZIK", () => {
  const k = K();
  assert.equal(validateModellek(k).filter((i) => i.severity === "error").length, 0);
});

test("hazudott állapot HIBA — a válaszokból derivált, nem beírható", () => {
  const k = K();
  J("ai.ctg-guardian", k).allapot = "hasznalhato";
  const h = validateModellek(k).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /NEM beírt szó/);
});

test("ismeretlen követelményre adott válasz HIBA — úgy néz ki, mint egy megválaszolt", () => {
  const k = K();
  J("ai.herlev-svm", k).valaszok["nincsIlyen"] = { van: true, mit: "x" };
  const h = validateModellek(k).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /Elgépelt hivatkozás/);
});

test("a licenc BLOKKOLÓ volta maga is ellenőrzött", () => {
  const k = K();
  k.kovetelmenyek.find((x) => x.id === "licenc")!.blokkolo = false;
  const h = validateModellek(k).filter((i) => i.id === "ai.licenc");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /háromszor eldőlt/);
});

test("a mérleg a sorokból derivált — ma egyetlen modell sem használható", () => {
  const k = K();
  const m = merleg(k);
  // A SZÁMOK A KÉSZLETBŐL JÖNNEK. Rögzített darabszám minden új jelöltnél
  // elbukna, miközben a tétel — hogy egy sem használható — változatlan.
  assert.equal(m.jelolt, k.jeloltek.length);
  assert.equal(m.hasznalhato, 0, "aláírás és licenc nélkül egy sem");
  assert.equal(m.licencMiatt,
    k.jeloltek.filter((j) => !j.valaszok["licenc"]?.van).length,
    "a licencnél elakadók száma a válaszokból derivált");
  assert.ok(m.licencMiatt >= 6, `${m.licencMiatt} jelöltnek nincs használható licence`);
  assert.equal(m.blokkolo, k.kovetelmenyek.filter((x) => x.blokkolo).length);
});
