/**
 * A SZABÁLYMOTOR — és a hiányzó mező, ami nem nulla.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  fordit, forditKeszlet, kiertekel, loadSzabalyok, validateSzabalyok,
} from "../core/szabaly/motor.ts";
import type { SzabalyKeszlet } from "../core/szabaly/motor.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (n: string) => loadSzabalyok(join(HERE, "..", "registry", "fogamzas", `${n}.json`));

/* ── A KIFEJEZÉS-FORDÍTÓ ─────────────────────────────────────────────── */

test("csak mező, szám és összehasonlítás mehet át", () => {
  const v = ["diam", "cs"];
  assert.ok(fordit(v, "diam < 100 && cs >= 2").fn);
  assert.equal(fordit(v, "fetch('x')").fn, null);
  assert.equal(fordit(v, "diam.constructor").fn, null);
  assert.equal(fordit(v, "alert(1); diam > 0").fn, null);
});

test("AZ EGYSZERES `=` KÜLÖN TILTOTT — némán mindig igaz lenne", () => {
  const r = fordit(["diam"], "diam = 5");
  assert.equal(r.fn, null);
  assert.match(r.hiba!, /az első sor mindent elnyelne/);
  // …de a helyes összehasonlítások mennek.
  for (const k of ["diam == 5", "diam >= 5", "diam <= 5", "diam != 5"]) {
    assert.ok(fordit(["diam"], k).fn, k);
  }
});

test("a HOSSZABB mezőnév előbb maszkolódik", () => {
  // Ha a `sol` előbb tűnne el, a `solid` közepét vágná ki.
  const r = fordit(["sol", "solid"], "solid == 1 && sol == 0");
  assert.ok(r.fn);
  assert.deepEqual(r.hivatkozott.sort(), ["sol", "solid"]);
});

test("a fordító megmondja, MELY mezőkre hivatkozik a szabály", () => {
  assert.deepEqual(fordit(["a", "b", "c"], "a > 1 && c < 2").hivatkozott.sort(), ["a", "c"]);
});

/* ── A HIÁNYZÓ MEZŐ NEM NULLA ────────────────────────────────────────── */

const ASCITES: SzabalyKeszlet = {
  id: "teszt.orads", megnevezes: "Teszt", verzio: "1", forras: "teszt",
  vars: ["ascites", "diam"],
  szabalyok: [
    { kat: "5", ha: "ascites == 1", miert: "nem magyarázott ascites" },
    { kat: "2", ha: "diam < 100", miert: "10 cm alatti egyszerű cysta" },
  ],
};

test("A KIÉRTÉKELÉS MEGÁLL a hiányzó mezőre hivatkozó sornál", () => {
  const k = forditKeszlet(ASCITES);
  // Az `ascites` mezőt senki nem töltötte ki. Nullaként számolva a 0. sor
  // csendben nem sülne el, és a beteg O-RADS 2-t kapna.
  const r = kiertekel(k, { diam: 50 });
  assert.equal(r.allapot, "eldonthetetlen");
  assert.equal(r.kat, null, "NEM születik kategória");
  assert.equal(r.megallitoIndex, 0);
  assert.deepEqual(r.hianyzo, ["ascites"]);
  assert.match(r.miert, /A hiányzó mező NEM NULLA/);
  assert.match(r.miert, /egy KÉSŐBBI sor adna\s+kategóriát — megalapozatlanul/);
});

test("kitöltött mezőkkel viszont az első illeszkedő sor nyer", () => {
  const k = forditKeszlet(ASCITES);
  assert.equal(kiertekel(k, { ascites: 1, diam: 50 }).kat, "5");
  const r = kiertekel(k, { ascites: 0, diam: 50 });
  assert.equal(r.kat, "2");
  assert.equal(r.index, 1, "a sorszám visszakereshető a forrástáblában");
});

test("a nemleges válasz NEM ugyanaz, mint a kitöltetlen", () => {
  const k = forditKeszlet(ASCITES);
  assert.equal(kiertekel(k, { ascites: 0, diam: 50 }).allapot, "talalat");
  assert.equal(kiertekel(k, { diam: 50 }).allapot, "eldonthetetlen");
});

test("ha egyetlen sor sem illeszkedik, az sem „negatív”", () => {
  const k = forditKeszlet(ASCITES);
  const r = kiertekel(k, { ascites: 0, diam: 500 });
  assert.equal(r.allapot, "nincsTalalat");
  assert.match(r.miert, /vagy a tábla hiányos/);
});

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

test("a hibás kifejezésű készlet BE SEM TÖLTŐDIK", () => {
  assert.throws(() => forditKeszlet({ ...ASCITES,
    szabalyok: [{ kat: "1", ha: "ascites = 1", miert: "x" }] }),
    /BE SEM TÖLTŐDIK/);
});

test("a leírás nélküli szabály visszakereshetetlen", () => {
  const e = validateSzabalyok({ ...ASCITES,
    szabalyok: [{ kat: "1", ha: "diam > 0", miert: "" }] })
    .filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /klinikailag használhatatlan/.test(x.message)));
});

test("A FELTÉTEL NÉLKÜLI SOR ELNYELI, AMI UTÁNA JÖN", () => {
  const e = validateSzabalyok({ ...ASCITES,
    szabalyok: [
      { kat: "x", ha: "1 == 1", miert: "mindig" },
      { kat: "5", ha: "ascites == 1", miert: "ascites" }] })
    .filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /SOHA nem\s+sül el/.test(x.message)));
});

test("forrás és verzió nélkül nincs készlet", () => {
  const e = validateSzabalyok({ ...ASCITES, forras: "", verzio: "" })
    .filter((i) => i.severity === "error");
  assert.equal(e.length, 2);
});

/* ── A CDC SPR KÉSZLETEK ─────────────────────────────────────────────── */

test("mindhárom SPR-készlet hiba nélkül validál", () => {
  for (const n of ["spr-kok-kimaradt", "spr-pop-kimaradt", "spr-terhessegKizarasa"]) {
    assert.equal(validateSzabalyok(R(n)).filter((i) => i.severity === "error").length, 0, n);
  }
});

test("a KOK három döntési pontja: 24 és 48 óra", () => {
  const k = forditKeszlet(R("spr-kok-kimaradt"));
  const be = { hetHanyadik: 2, vedtelenKozosules5Napon: 0 };
  assert.equal(kiertekel(k, { ...be, orak: 12 }).kat, "lateEgy");
  assert.equal(kiertekel(k, { ...be, orak: 30 }).kat, "kimaradtEgy");
  assert.equal(kiertekel(k, { ...be, orak: 60 }).kat, "kimaradtTobb");
});

test("az UTOLSÓ HORMONOS HÉTEN a hormonmentes szakaszt ki kell hagyni", () => {
  const k = forditKeszlet(R("spr-kok-kimaradt"));
  const r = kiertekel(k, { orak: 60, hetHanyadik: 3, vedtelenKozosules5Napon: 0 });
  assert.equal(r.kat, "kimaradtTobb.utolsoHet");
  assert.match(r.szabaly!.teendo!, /HORMONMENTES SZAKASZT KI KELL HAGYNI/);
});

test("az első héten + védtelen közösülés → sürgősségi fogamzásgátlás MÉRLEGELENDŐ", () => {
  const k = forditKeszlet(R("spr-kok-kimaradt"));
  const r = kiertekel(k, { orak: 60, hetHanyadik: 1, vedtelenKozosules5Napon: 1 });
  assert.equal(r.kat, "kimaradtTobb.elsoHet.vedtelen");
  assert.match(r.szabaly!.megjegyzes!, /MÉRLEGELENDŐ/);
});

test("A KÉT POP-FAJTA ABLAKA GYÖKERESEN KÜLÖNBÖZIK: 3 óra vs 48 óra", () => {
  const k = forditKeszlet(R("spr-pop-kimaradt"));
  const be = { hetHanyadik: 2, vedtelenKozosules5Napon: 0, voltVedtelenKozosules: 0 };
  // 4 óra: a noretiszteronnál MÁR kimaradt, a drospirenonnál még nem.
  assert.equal(kiertekel(k, { ...be, tipus: 1, orak: 4 }).kat, "noretiszteron.kimaradt");
  assert.equal(kiertekel(k, { ...be, tipus: 2, orak: 4 }).kat, "drospirenon.keset");
});

test("az ULIPRISTÁL-ACETÁT mindenütt kivétel", () => {
  const k = R("spr-kok-kimaradt");
  const upa = k.szabalyok.filter((sz) => /UPA|ulipristál/i.test(sz.megjegyzes ?? ""));
  assert.equal(upa.length, k.szabalyok.length, "minden sor kimondja");
  assert.match(k.eloirasok!.join(" "), /csökkenti a hatását/);
});

test("a terhesség kizárása: TÜNET mellett egyik kritérium sem alkalmazható", () => {
  const k = forditKeszlet(R("spr-terhessegKizarasa"));
  const r = kiertekel(k, { tunetek: 1, menzeszOtaNap: 2, voltKozosulesMenzeszOta: 0,
    megbizhatoModszert: 1, abortuszOtaNap: 99, szulesUtanHet: 99,
    teljesSzoptatasAmenorrhea: 0 });
  assert.equal(r.kat, "nemBizonyos");
  assert.equal(r.index, 0, "a tünet az első sor — megelőzi az összes kritériumot");
});

test("AZ IUD KÜLÖN ESET bizonytalanság mellett", () => {
  const k = forditKeszlet(R("spr-terhessegKizarasa"));
  const r = kiertekel(k, { tunetek: 0, menzeszOtaNap: 20, voltKozosulesMenzeszOta: 1,
    megbizhatoModszert: 0, abortuszOtaNap: 99, szulesUtanHet: 99,
    teljesSzoptatasAmenorrhea: 0 });
  assert.equal(r.kat, "nemBizonyos");
  assert.match(r.szabaly!.teendo!, /IUD-behelyezésnél viszont NEM/);
});
