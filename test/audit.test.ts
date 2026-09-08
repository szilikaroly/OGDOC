/**
 * AZ AUDIT-HUROK — a 17. lépés.
 *
 * A tesztek két hibát védenek. Az elsőt a lépés TALÁLTA: a három audit-mező
 * `variable: null` volt, vagyis a rendszer legfontosabb köre olyan mezőkből
 * állt, amelyeknek nem volt hova írniuk. A másodikat a lépés MEGELŐZI: a
 * kétértékű „megerősítve? igen/nem” a cáfolatot és az eldönthetetlenséget
 * ugyanabba a rekeszbe tenné, és ettől a rendszer rendszeresen rosszabbnak
 * látszana, mint amilyen.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  auditMezok, besorol, kozles, loadHurok, merleg, osszevet, parAllas,
  validateHurok, wilson, type AuditMezo, type Eset, type Hurok,
} from "../core/audit/hurok.ts";
import { loadUiMap } from "../core/ui/felulet.ts";
import { loadRegistry } from "../core/load.ts";

const H = () => loadHurok("registry/audit/hurok.json");
const REG = loadRegistry("registry/variables");
const IDS = new Set(REG.all().map((v) => v.id));
const KODOK = (id: string): string[] | null => {
  const v = REG.all().find((x) => x.id === id) as { valueSet?: Array<{ code: string }> };
  return v?.valueSet ? v.valueSet.map((o) => o.code) : null;
};
const MEZOK = ["szuleszeti-felulet", "nogyogyaszati-felulet"]
  .flatMap((n) => auditMezok(loadUiMap(`registry/felulet/${n}.json`)));

/** Küszöbökkel ellátott hurok — a kapu tényleges viselkedéséhez. */
function kuszobbal(over: Partial<Hurok> = {}): Hurok {
  return { ...H(), minimumEset: 20, maxBizonytalanSav: 0.30,
           maxEldonthetetlenArany: 0.30, ...over };
}
const esetek = (n: number, kod: string | null): Eset[] =>
  Array.from({ length: n }, (_, i) => ({ caseId: `e${kod}${i}`, kod }));

/* ══ 1. A HIBA, AMIT EZ A LÉPÉS TALÁLT ═════════════════════════════════ */

test("MINDHÁROM audit-mezőnek van már változója — enélkül a hurok nem ír sehova", () => {
  assert.equal(MEZOK.length, 3);
  for (const m of MEZOK) {
    assert.notEqual(m.variable, null, `${m.label}: nincs változó`);
    assert.ok(IDS.has(m.variable!), `${m.variable}: nincs a regiszterben`);
  }
});

test("a változó nélküli audit-mező HIBA, nem figyelmeztetés", () => {
  const csonka: AuditMezo[] = [
    ...MEZOK,
    { label: "Valami megerősítve", variable: null, form: "form.teszt" },
  ];
  const hibak = validateHurok(H(), csonka, IDS, KODOK)
    .filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /NINCS VÁLTOZÓJA/);
  assert.match(hibak[0].message, /számot nem lehet olyan\s+mezőből számolni/);
});

test("ma egyetlen hiba sincs — a hurok be van kötve", () => {
  const hibak = validateHurok(H(), MEZOK, IDS, KODOK)
    .filter((i) => i.severity === "error");
  assert.deepEqual(hibak, []);
});

/* ══ 2. NÉGY VÁLASZ, NEM KETTŐ ═════════════════════════════════════════ */

test("mind a három változó NÉGYÉRTÉKŰ — a kétértékűre visszacsúszás HIBA", () => {
  for (const p of H().parok) {
    const k = KODOK(p.valtozo)!;
    for (const kell of ["confirmed", "refuted", "indeterminate", "noReference"]) {
      assert.ok(k.includes(kell), `${p.valtozo}: hiányzik a(z) ${kell}`);
    }
  }
  // És ha valaki visszacsúsztatja kétértékűre, azt a validálás megfogja.
  const hibak = validateHurok(H(), MEZOK, IDS,
    (id) => id === "audit.us.confirmed" ? ["confirmed", "refuted"] : KODOK(id))
    .filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /indeterminate, noReference/);
  assert.match(hibak[0].message, /ROSSZABBNAK mutatja/);
});

test("az ELDÖNTHETETLEN nem tévedés, és nem is találat — kimarad a NEVEZŐBŐL", () => {
  const o = osszevet([
    ...esetek(6, "confirmed"), ...esetek(2, "refuted"),
    ...esetek(4, "indeterminate"), ...esetek(1, "noReference"),
    ...esetek(3, null),
  ]);
  assert.equal(o.eset, 16);
  assert.equal(o.ertekelheto, 8, "csak az, amiről a referencia dönteni tudott");
  assert.equal(o.egyezik / o.ertekelheto, 0.75);

  // ÉS AMI A HIBA LETT VOLNA: a négy eldönthetetlent cáfolatnak számolva a
  // 75% azonnal 50%-ra esne — ugyanazon az adaton, ugyanarra a rendszerre.
  assert.equal(o.egyezik / (o.egyezik + o.elter + o.eldonthetetlen), 0.5);
});

test("a hiányzó és az ismeretlen kód egyaránt „hianyzo” — sehol nem „nem”", () => {
  assert.equal(besorol(null), "hianyzo");
  assert.equal(besorol(undefined), "hianyzo");
  assert.equal(besorol(""), "hianyzo");
  assert.equal(besorol("igen"), "hianyzo", "az ismeretlen kód sem csúszik érdemi rekeszbe");
  assert.equal(besorol("confirmed"), "egyezik");
  assert.equal(besorol("refuted"), "elter");
  assert.equal(besorol("indeterminate"), "eldonthetetlen");
  assert.equal(besorol("noReference"), "nincsReferencia");
});

/* ══ 3. A BIZONYTALANSÁG ═══════════════════════════════════════════════ */

test("Wilson-sáv: a széleken is értelmes, ahol a normál közelítés összeomlik", () => {
  const a = wilson(3, 3)!;   // a normál közelítés itt ±0-t adna
  assert.ok(Math.abs(a.also - 0.4385) < 0.001);
  assert.equal(a.felso, 1);

  const b = wilson(0, 5)!;   // a normál közelítés itt NEGATÍV alsó határt adna
  assert.equal(b.also, 0);
  assert.ok(Math.abs(b.felso - 0.4345) < 0.001);

  const c = wilson(50, 100)!;
  assert.ok(Math.abs(c.also - 0.4038) < 0.001);
  assert.ok(Math.abs(c.felso - 0.5962) < 0.001);

  assert.equal(wilson(1, 0), null, "nullaelemű mintára nincs sáv");
  assert.equal(wilson(6, 5), null, "több találat, mint eset: értelmetlen bemenet");
});

/* ══ 4. A KÖZÖLHETŐSÉG KAPUJA ══════════════════════════════════════════ */

test("KÜSZÖB NÉLKÜL a kapu ZÁRVA — a hiányzó döntés itt sem „igen”", () => {
  const k = kozles(osszevet(esetek(100, "confirmed")), H());
  assert.equal(k.allapot, "kuszobNelkul");
  assert.equal(k.kozolheto, false);
  assert.equal(k.arany, null, "100/100 egyezés mellett SEM ad ki számot");
});

test("három esetből számolt arány NEM közölhető — úgy néz ki, mint egy mérés", () => {
  const k = kozles(osszevet([...esetek(2, "confirmed"), ...esetek(1, "refuted")]),
                   kuszobbal());
  assert.equal(k.allapot, "keveseset");
  assert.equal(k.arany, null);
  assert.match(k.miert, /rosszabb, mint ha nem mondanánk semmit/);
});

test("nulla értékelhető eset NEM nulla találati arány", () => {
  const k = kozles(osszevet([...esetek(5, "indeterminate"), ...esetek(4, null)]),
                   kuszobbal());
  assert.equal(k.allapot, "nincsAdat");
  assert.equal(k.arany, null, "a null nem 0 — az egyik mérés hiánya, a másik rossz eredmény");
  assert.match(k.miert, /NEM nulla találati arány/);
});

test("túl sok eldönthetetlen: a szám a REFERENCIÁRÓL szólna, nem a rendszerről", () => {
  const k = kozles(osszevet([
    ...esetek(18, "confirmed"), ...esetek(4, "refuted"), ...esetek(20, "indeterminate"),
  ]), kuszobbal());
  assert.equal(k.allapot, "tulSokEldonthetetlen");
  assert.equal(k.arany, null);
  assert.match(k.miert, /48%/);
});

test("a hiányzó válaszok NEM rontják el az eldönthetetlen-arányt", () => {
  // Ugyanaz a 22 értékelhető és 5 eldönthetetlen eset, egyszer 100 kitöltetlennel.
  // A kitöltetlenség adatgyűjtési hiba, nem a referencia korlátja — ha benne
  // lenne a nevezőben, a hígítása ELFEDNÉ a valódi problémát.
  const a = kozles(osszevet([
    ...esetek(18, "confirmed"), ...esetek(4, "refuted"), ...esetek(5, "indeterminate"),
  ]), kuszobbal());
  const b = kozles(osszevet([
    ...esetek(18, "confirmed"), ...esetek(4, "refuted"), ...esetek(5, "indeterminate"),
    ...esetek(100, null),
  ]), kuszobbal());
  assert.equal(a.allapot, b.allapot);
  assert.equal(a.arany, b.arany);
});

test("széles sáv: a pontbecslés megvan, mégsem közölhető", () => {
  const k = kozles(osszevet([...esetek(14, "confirmed"), ...esetek(6, "refuted")]),
                   kuszobbal({ maxBizonytalanSav: 0.10 }));
  assert.equal(k.allapot, "tulSzelesSav");
  assert.equal(k.arany, null);
  assert.ok(k.sav, "a sávot viszont MEGMUTATJA — ez a magyarázat, nem a szám");
  assert.match(k.miert, /nem szám, hanem sejtés/);
});

test("elég eset, szűk sáv, kevés eldönthetetlen: EKKOR közölhető, sávval együtt", () => {
  const k = kozles(osszevet([
    ...esetek(85, "confirmed"), ...esetek(15, "refuted"), ...esetek(6, "indeterminate"),
    ...esetek(3, "noReference"), ...esetek(2, null),
  ]), kuszobbal());
  assert.equal(k.allapot, "kozolheto");
  assert.equal(k.arany, 0.85);
  assert.ok(k.sav!.also > 0.76 && k.sav!.felso < 0.91);
  assert.match(k.miert, /A nevezőből kimaradt 6 eldönthetetlen/);
});

/* ══ 5. AZ EGÉSZ HUROK MA ══════════════════════════════════════════════ */

test("ma egyetlen pár sem közölhető: nincs pilot, tehát nincs eset", () => {
  const h = H();
  const a = parAllas(h, {});
  const m = merleg(h, a, MEZOK);
  assert.equal(m.par, 3);
  assert.equal(m.bekotott, 3, "a hurok be van kötve");
  assert.equal(m.vizsgaltEset, 0, "de a 16. lépés nem indulhat, tehát nincs eset");
  assert.equal(m.kozolheto, 0);
  assert.equal(m.kuszobHianyzik, 3);
  for (const x of a) assert.equal(x.kozles.allapot, "kuszobNelkul");
});

test("a mérleg minden száma a sorokból derivált", () => {
  const h = kuszobbal();
  const a = parAllas(h, { "par.uh": [...esetek(30, "confirmed"), ...esetek(4, "refuted")] });
  const m = merleg(h, a, MEZOK);
  assert.equal(m.vizsgaltEset, a.reduce((n, x) => n + x.osszevetes.eset, 0));
  assert.equal(m.ertekelhetoEset, 34);
  assert.equal(m.kozolheto, 1, "csak az a pár, amire van adat");
  assert.equal(m.kuszobHianyzik, 0);
});

test("ismeretlen változóra hivatkozó pár HIBA", () => {
  const h: Hurok = { ...H(), parok: [{ ...H().parok[0], valtozo: "audit.nincs.ilyen" }] };
  const hibak = validateHurok(h, MEZOK, IDS, KODOK).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /nincs a regiszterben/);
});
