/**
 * TELEMEDICINA — a távoli megítélés kapui.
 *
 * Két szabályt védenek: a megtagadás elsőrendű kimenet, és a laikus kérés nem
 * orvosi rendelés.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  felveheto, keresAllas, kiallithato, loadTele, merleg, validateTele, velemenyAllas,
} from "../core/tele/konzultacio.ts";
import { loadProtokollok } from "../core/exassist/protokoll.ts";

const K = () => loadTele("registry/tele/telemedicina.json");
const PROT = new Set(loadProtokollok("registry/exassist/protokollok.json")
  .protokollok.map((p) => p.id));
const TELJES = { tipus: "tele.uh", kerdes: "Rendben van a magzati szív?",
  keszult: "2026-09-08T09:00:00Z", eszkoz: "GE Voluson E10", keszitette: "dr. Küldő" };

/* ══ 1. KÉRDÉS NÉLKÜL NINCS KONZULTÁCIÓ ════════════════════════════════ */

test("kérdés nélkül a konzultációkérés NEM vehető fel", () => {
  const f = felveheto(K(), { ...TELJES, kerdes: "" });
  assert.equal(f.felveheto, false);
  assert.equal(f.allapot, "kerdesNelkul");
  assert.match(f.miert, /nem kérdés, és\s+a rá adott válasz nem lelet/);
});

test("az eredet hiánya is zár — ami hiányzik a képből, az nem látszik a képen", () => {
  const f = felveheto(K(), { ...TELJES, eszkoz: "" });
  assert.equal(f.allapot, "eredetNelkul");
  assert.deepEqual(f.hianyzik, ["eszkoz"]);
});

test("laborleletnél referenciatartomány nélkül nem indul", () => {
  const f = felveheto(K(), { tipus: "tele.labor", kerdes: "Kóros a D-dimer?" });
  assert.equal(f.allapot, "referenciaNelkul");
  assert.match(f.miert, /két laborban két különböző dolgot jelent/);
});

test("külső kép TÁRSÍTÁS NÉLKÜL karanténban marad", () => {
  const f = felveheto(K(), { tipus: "tele.kolposzkopia", kerdes: "Adekvát a kép?",
    keszult: "x", eszkoz: "y", keszitette: "z" });
  assert.equal(f.allapot, "karantenban");
  const ok = felveheto(K(), { tipus: "tele.kolposzkopia", kerdes: "Adekvát a kép?",
    keszult: "x", eszkoz: "y", keszitette: "z", tarsitotta: "dr. Fogadó" });
  assert.equal(ok.felveheto, true);
});

test("hiánytalan beküldés felvehető", () => {
  assert.equal(felveheto(K(), TELJES).felveheto, true);
});

/* ══ 2. A MEGTAGADÁS ELSŐRENDŰ KIMENET ═════════════════════════════════ */

test("az ALKALMATLAN érvényes kimenet — ha megmondja, MIT nem ítélt meg", () => {
  const rossz = velemenyAllas({ konzultans: "dr. K", alkalmassag: "alkalmatlan" });
  assert.equal(rossz.lezart, false);
  assert.equal(rossz.allapot, "korlatMegnevezesNelkul");
  assert.match(rossz.miert, /ugyanolyan üres, mint a hallgatás/);

  const jo = velemenyAllas({ konzultans: "dr. K", alkalmassag: "alkalmatlan",
    nemItelte: "a magzati szív a felvételen nem ítélhető meg", atvetteKi: "dr. Kezelő" });
  assert.equal(jo.lezart, true);
  assert.match(jo.miert, /ÉRVÉNYES kimenet/);
});

test("a korlátozott megítélés is teljes értékű, megnevezett korláttal", () => {
  const v = velemenyAllas({ konzultans: "dr. K", alkalmassag: "korlatozott",
    nemItelte: "a szívet nem, a többit igen", atvetteKi: "dr. Kezelő" });
  assert.equal(v.lezart, true);
});

test("ÁTVÉTEL NÉLKÜL a konzílium FÉL — a vélemény nem ér célba", () => {
  const v = velemenyAllas({ konzultans: "dr. K", alkalmassag: "alkalmas",
    velemeny: "Ép szívkép." });
  assert.equal(v.lezart, false);
  assert.equal(v.allapot, "atvetelNelkul");
  assert.match(v.miert, /eljutott-e oda,\s+ahol cselekedni kellett volna/);
});

/* ══ 3. A LAIKUS KÉRÉS NEM RENDELÉS ════════════════════════════════════ */

test("a kérésből FELADAT lesz, nem rendelés és nem időpont", () => {
  const k = K();
  const a = keresAllas(k, { tipus: "keres.vizsgalat",
    valaszok: k.veszjelek.map((v) => ({ veszjel: v.id, valasz: v.forditott ? true : false })) });
  assert.equal(a.allapot, "feladat");
});

test("A FORDÍTOTT VÉSZJELNÉL A NEM A VÉSZJEL", () => {
  // „Érzi a magzat mozgását?" — itt a NEM a riasztó válasz. A fordított olvasat
  // elrontása pont a legfontosabb kérdésnél némítaná el a rendszert.
  const k = K();
  const a = keresAllas(k, { tipus: "keres.tanacs", valaszok:
    k.veszjelek.map((v) => ({ veszjel: v.id, valasz: v.id === "vj.mozgas" ? false : false })) });
  assert.equal(a.allapot, "veszjel");
  assert.deepEqual(a.kivaltott, ["vj.mozgas"]);
});

test("a MEG NEM VÁLASZOLT vészjel-kérdés nem „nem”", () => {
  const a = keresAllas(K(), { tipus: "keres.tanacs", valaszok: [] });
  assert.equal(a.allapot, "kerdessorHianyos");
  assert.equal(a.megvalaszolatlan.length, 6);
  assert.match(a.miert, /nem bizonyítja, hogy\s+nem folyt el/);
});

test("A KÉRÉSBŐL NEM LESZ RECEPT MAGÁTÓL", () => {
  const nincs = kiallithato({ keres: "keres.recept" });
  assert.equal(nincs.ok, false);
  assert.match(nincs.miert, /bemenet, nem felhatalmazás/);

  // Klinikus megvan, de a korábbi rendelést ismételné.
  const ismetel = kiallithato({ keres: "keres.recept", klinikus: "dr. K" });
  assert.equal(ismetel.ok, false);
  assert.match(ismetel.miert, /a korábbi döntés nem bizonyítja a mostani indikációt/);

  // ÉS EZ NEM ELÉG RECEPTHEZ. A telemedicina nem állíthat ki receptet
  // gyengébb feltételekkel, mint a rendelés — egy kapu van, a 32. modulé.
  const kapuNelkul = kiallithato({ keres: "keres.recept", klinikus: "dr. K",
    indikaciotEllenorizte: true });
  assert.equal(kapuNelkul.ok, false);
  assert.match(kapuNelkul.miert, /Egy kapu van, és az a 32\. modulé/);

  const jo = kiallithato({ keres: "keres.recept", klinikus: "dr. K",
    indikaciotEllenorizte: true,
    receptKapu: {
      keszitmeny: "rx.paracetamol", klinikus: "dr. K", indikaciotEllenorizte: true,
      allergia: "nincs", interakcio: "teljesListaval", interakcioTalalat: false,
      terhesseg: "nemTerhes", vanTerhessegiBesorolas: true,
    } });
  assert.equal(jo.ok, true);
});

test("a NEM receptre irányuló kérés kapuja változatlan", () => {
  const jo = kiallithato({ keres: "keres.tanacs", klinikus: "dr. K",
    indikaciotEllenorizte: true });
  assert.equal(jo.ok, true, "tanácskérésnél nem kell receptkapu");
});

/* ══ 4. VALIDÁLÁS ══════════════════════════════════════════════════════ */

test("ma nincs hiba, két szervezeti döntés viszont hiányzik", () => {
  const w = validateTele(K(), PROT);
  assert.equal(w.filter((i) => i.severity === "error").length, 0);
  assert.equal(w.filter((i) => i.severity === "warning").length, 2);
});

test("ismeretlen ExAssist-protokollra hivatkozó típus HIBA", () => {
  const k = K();
  k.konzultaciok[0].protokoll = "ex.nincs.ilyen";
  const h = validateTele(k, PROT).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /nem tudná,\s+mely tételekre/);
});

test("a mérleg a sorokból derivált", () => {
  const k = K();
  const m = merleg(k);
  assert.equal(m.konzultacio, k.konzultaciok.length);
  assert.equal(m.veszjel, k.veszjelek.length);
  assert.equal(m.emberreVar, 2, "konzultáns-igazolás és válaszidő");
});
