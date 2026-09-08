/**
 * A 34. modul — teljeskörű fekvőbeteg-ellátás: hely, ágy, ADT, műtéti foglalás.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import {
  FAJTA_SORREND, FHIR_PHYSICAL_TYPE, agyszam, alatta, lanc, loadHelyek,
  merleg as helyMerleg, validateHelyek,
} from "../core/fekvo/hely.ts";
import {
  ATMENETEK, adtRogzitheto, atmenet, merleg as adtMerleg, oregedes, validateHelyzetek,
} from "../core/fekvo/adt.ts";
import type { AgyHelyzet } from "../core/fekvo/adt.ts";
import { loadMutok } from "../core/op/muto.ts";
import { csapat, mutetiFoglalas, validateSzerepek } from "../core/op/foglalas.ts";
import type { MutetiFoglalasKeres, SzerepKeszlet } from "../core/op/foglalas.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const H = () => loadHelyek(join(HERE, "..", "registry", "fekvo", "helyek.json"));
const MK = () => {
  const k = loadMutok(join(HERE, "..", "registry", "muto", "mutok.json"));
  k.hitelesitesek.push({ ki: "dr. Demó", mikor: "2026-09-01", tartalek: k.surgossegiTartalek });
  return k;
};
const SZ = (): SzerepKeszlet => JSON.parse(
  readFileSync(join(HERE, "..", "registry", "muto", "szerepek.json"), "utf8"));
const MOST = "2026-09-08T12:00:00Z";

/* ── A LÁNC, NEM A RÖGZÍTETT MÉLYSÉG ─────────────────────────────────── */

test("a demókészlet hiba nélkül validál", () => {
  assert.equal(validateHelyek(H()).filter((i) => i.severity === "error").length, 0);
});

test("A MÉLYSÉG VÁLTOZÓ — és nincsenek fantomsorok", () => {
  const k = H();
  const m = helyMerleg(k);
  assert.equal(m.torott, 0);
  assert.equal(m.gyoker, 1);
  // A készletben SZÁNDÉKOSAN nincs `intezmeny` és `intezet` szint.
  assert.equal(m.fajtankent["intezmeny"], undefined);
  assert.equal(m.fajtankent["intezet"], undefined);
  // …és a láncok hossza mégis eltér: a rooming-in ágy mélyebben van,
  // mint a folyosói.
  const gya = lanc(k, "hely.agy.gya.1").ut.length;
  const folyoso = lanc(k, "hely.agy.folyoso.1").ut.length;
  assert.ok(gya > folyoso, `${gya} vs ${folyoso} — a mélység nem rögzített`);
});

test("a folyosói ágy SZOBA NÉLKÜL is a helyére kerül", () => {
  const l = lanc(H(), "hely.agy.folyoso.1");
  assert.equal(l.torott, false);
  assert.match(l.utvonal, /Terhespatológia › Folyosói/);
});

test("az összesítés tetszőleges mélységben működik", () => {
  const k = H();
  assert.equal(agyszam(k, "hely.klinika"), alatta(k, "hely.klinika", "agy").length);
  assert.equal(agyszam(k, "hely.klinika"),
    agyszam(k, "hely.reszleg.szuleszet") + agyszam(k, "hely.reszleg.nogyogyaszat"),
    "a részlegek ágyai kiadják a klinikáét — nincs kétszer számolás");
});

test("A KÖR a láncban HIBA — különben az összegzés kétszer számolna", () => {
  const k = H();
  k.helyek.find((h) => h.id === "hely.klinika")!.resze = "hely.telephely.fo";
  const l = lanc(k, "hely.agy.gya.1");
  assert.equal(l.torott, true);
  assert.match(l.miert, /KÖR a helyláncban/);
});

test("a megszakadt lánc CSENDBEN esne ki — ezért hiba", () => {
  const k = H();
  k.helyek.find((h) => h.id === "hely.osztaly.gyermekagyas")!.resze = "hely.nincs.ilyen";
  const e = validateHelyek(k).filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /CSENDBEN kiesik/.test(x.message)));
});

test("a fajtasorrend megfordítása HIBA — szoba nem lehet ágy része", () => {
  const k = H();
  k.helyek.find((h) => h.id === "hely.szoba.G1")!.resze = "hely.agy.gya.1";
  const e = validateHelyek(k).filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /nem lehet egy ágy része/.test(x.message)));
});

test("az ÜRES szervezeti egység megnevezve jelenik meg — fantom vagy valódi", () => {
  const k = H();
  k.helyek.push({ id: "hely.osztaly.ures", fajta: "osztaly", nev: "Üres osztály",
    resze: "hely.reszleg.nogyogyaszat" });
  const w = validateHelyek(k).filter((i) => i.id === "hely.osztaly.ures");
  assert.equal(w.length, 1);
  assert.match(w[0].message, /FANTOM/);
});

test("a fajták FHIR Location.physicalType-ra képződnek", () => {
  for (const f of FAJTA_SORREND) {
    assert.ok(FHIR_PHYSICAL_TYPE[f], `${f}: nincs FHIR-megfelelője`);
  }
  assert.equal(FHIR_PHYSICAL_TYPE.agy, "bd");
  assert.equal(FHIR_PHYSICAL_TYPE.szoba, "ro");
});

/* ── AZ ÁLLAPOTGÉP ───────────────────────────────────────────────────── */

test("AZ ELBOCSÁTÁS UTÁN AZ ÁGY PISZKOS, NEM SZABAD", () => {
  const a = atmenet("foglalt", "elbocsat");
  assert.equal(a.ujAllapot, "piszkos");
  assert.equal(atmenet("piszkos", "takarit").ujAllapot, "szabad");
});

test("PISZKOS ÁGYRA NEM ÉRKEZIK BETEG", () => {
  const a = atmenet("piszkos", "erkezik");
  assert.equal(a.ok, false);
  assert.match(a.miert, /fertőzésátvitel/);
});

test("a karbantartásból visszaadott ágy sem szabad — előbb takarítás", () => {
  assert.equal(atmenet("karbantartas", "visszaad").ujAllapot, "piszkos");
  assert.equal(atmenet("karbantartas", "erkezik").ok, false);
});

test("ISMERETLEN ÁLLAPOTBÓL nincs átmenet", () => {
  assert.equal(atmenet("ismeretlen", "erkezik").ok, false);
  assert.deepEqual(Object.keys(ATMENETEK.ismeretlen), []);
});

/* ── AZ ÁLLAPOT ÖREGSZIK ─────────────────────────────────────────────── */

test("A KÉT NAPJA PISZKOS ÁGYRÓL ELFELEJTKEZTEK", () => {
  const h: AgyHelyzet = { agy: "a", allapot: "piszkos", ok: "elbocsátás után",
    mikortol: "2026-09-06T12:00:00Z" };
  const o = oregedes(h, MOST);
  assert.equal(o.allapot, "elfelejtve");
  assert.match(o.miert, /a kapacitás így csendben fogy|csendben fogy/i);
});

test("kezdet nélkül az öregedés NEM „friss”", () => {
  const o = oregedes({ agy: "a", allapot: "piszkos", ok: "x" }, MOST);
  assert.equal(o.allapot, "nemMerheto");
  assert.match(o.miert, /arról elfelejtkeztek/);
});

test("a mérleg a sorokból jön, és külön mutatja az elfelejtettet", () => {
  const h: AgyHelyzet[] = [
    { agy: "a", allapot: "foglalt", betegek: ["p1", "p2"] },
    { agy: "b", allapot: "piszkos", ok: "elbocsátás", mikortol: "2026-09-06T12:00:00Z" },
    { agy: "c", allapot: "szabad" }];
  const m = adtMerleg(h, MOST);
  assert.equal(m.agy, 3);
  assert.equal(m.beteg, 2, "egy ágy, két beteg");
  assert.equal(m.elfelejtve, 1);
});

/* ── ADT ─────────────────────────────────────────────────────────────── */

test("az áthelyezésnek GAZDÁJA van", () => {
  const a = adtRogzitheto({ tipus: "A02", beteg: "p1", honnan: "x", hova: "y",
    mikor: MOST, elrendelte: "  " });
  assert.equal(a.rogzitheto, false);
  assert.match(a.miert, /a leggyakrabban\s+kérdeznek vissza/);
});

test("a fél áthelyezés nem rögzíthető", () => {
  const a = adtRogzitheto({ tipus: "A02", beteg: "p1", honnan: "x", mikor: MOST,
    elrendelte: "dr. D" });
  assert.equal(a.allapot, "helyHianyzik");
  assert.match(a.miert, /vagy két helyen van, vagy\s+egy helyen sem/);
});

test("elbocsátás forrás nélkül: az ágy nem lesz piszkos, csak marad foglalt", () => {
  const a = adtRogzitheto({ tipus: "A03", beteg: "p1", mikor: MOST, elrendelte: "dr. D" });
  assert.equal(a.rogzitheto, false);
  assert.match(a.miert, /csak marad foglalt/);
});

test("két ágyon szereplő beteg: HIBA", () => {
  const e = validateHelyzetek(
    [{ agy: "a", allapot: "foglalt", betegek: ["p1"] },
     { agy: "b", allapot: "foglalt", betegek: ["p1"] }],
    new Set(["a", "b"]), new Set(), MOST).filter((i) => i.severity === "error");
  assert.ok(e.some((x) => /fél-rögzített áthelyezés/.test(x.message)));
});

/* ── A MŰTÉTI FOGLALÁS AZ ÁGYRÓL ─────────────────────────────────────── */

const KERES = (x: Partial<MutetiFoglalasKeres> = {}): MutetiFoglalasKeres => ({
  beteg: "p1", agy: "hely.agy.tp.1", betegAzAgyon: true, visszateroAgyVan: true,
  muto: "muto.2", surgosseg: "k4", kezdet: "2026-09-09T09:00:00Z", vegePerc: 60,
  beavatkozas: "bea.hyst",
  csapat: { szukseges: ["operator", "aneszteziologus", "mutosseged"],
            valaszok: { operator: "elerheto", aneszteziologus: "elerheto",
                        mutosseged: "elerheto" } },
  ...x,
});

test("a teljes feltételrendszer mellett foglalható", () => {
  const f = mutetiFoglalas(MK(), [], KERES());
  assert.equal(f.foglalhato, true);
  assert.match(f.miert, /Ágy: hely\.agy\.tp\.1/);
});

test("A FOGLALÁS AZ ÁGYHOZ KÖT — az elbocsátott beteg nem marad a naptárban", () => {
  const f = mutetiFoglalas(MK(), [], KERES({ betegAzAgyon: false }));
  assert.equal(f.allapot, "betegNincsOtt");
  assert.match(f.miert, /a naptárban\s+változatlanul ott áll/);
});

test("NINCS HOVÁ VISSZAVINNI — elektív műtét nem indul", () => {
  const f = mutetiFoglalas(MK(), [], KERES({ visszateroAgyVan: false }));
  assert.equal(f.allapot, "nincsVisszateroAgy");
  assert.match(f.miert, /az\s+ébresztőben töltött óra a következő műtétet tolja el/);
});

test("…de a SÜRGŐS műtét nem vár ágyra", () => {
  const f = mutetiFoglalas(MK(), [], KERES({ visszateroAgyVan: false, surgosseg: "k1",
    muto: "muto.1" }));
  assert.equal(f.foglalhato, true);
});

test("ANESZTEZIOLÓGUS NÉLKÜL NINCS MŰTÉT", () => {
  const f = mutetiFoglalas(MK(), [], KERES({
    csapat: { szukseges: ["operator", "aneszteziologus"],
              valaszok: { operator: "elerheto", aneszteziologus: "nincsBeosztva" } } }));
  assert.equal(f.allapot, "csapatHianyos");
  assert.match(f.miert, /Egy szoba önmagában nem műtét/);
  assert.equal(f.felulbiralhato, false, "a hiányzó szerepet nem lehet felülbírálni");
});

test("A CRM HALLGATÁSA NEM IGEN", () => {
  const c = csapat({ szukseges: ["operator", "aneszteziologus"],
    valaszok: { operator: "elerheto" } });
  assert.equal(c.allapot, "nemTudjuk");
  assert.deepEqual(c.bizonytalan, ["aneszteziologus"]);
  assert.match(c.miert, /A CRM\s+HALLGATÁSA NEM IGEN/);

  // …de ez FELÜLBÍRÁLHATÓ, a hiányzó szereppel ellentétben.
  const f = mutetiFoglalas(MK(), [], KERES({
    csapat: { szukseges: ["operator", "aneszteziologus"], valaszok: { operator: "elerheto" } } }),
    { ki: "dr. Demó Osztályvezető", miert: "a beosztás holnap kerül kiadásra, szóban egyeztetve" });
  assert.equal(f.foglalhato, true);
});

test("a szerepkészlet nem engedhet csapat nélküli beavatkozást", () => {
  const k = SZ();
  assert.equal(validateSzerepek(k).filter((i) => i.severity === "error").length, 0);
  k.beavatkozasok[0].szukseges = [];
  const e = validateSzerepek(k).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /ami nem tud elindulni/);
});

test("az aneszteziológus hiánya KIMONDANDÓ, nem alapértelmezés", () => {
  const w = validateSzerepek(SZ()).filter((i) => i.severity === "warning");
  assert.equal(w.length, 1, "egyetlen beavatkozás megy helyi érzéstelenítésben");
  assert.match(w[0].message, /a hiánya alapértelmezésből nem következhet/);
});

/* ── AZ ADATKÉSZLET-TÉRKÉP ───────────────────────────────────────────── */

interface AdatTerkep {
  statisztika: { tetel: number; hozzaferes: Record<string, number>;
                 regio: Record<string, number> };
  tabla_hibak: Array<{ tetel: string; fajta: string; mit: string }>;
  tetelek: Array<{ nev: string; regio: string[]; hozzaferes: string }>;
  note: string;
}
const DS = (): AdatTerkep => JSON.parse(
  readFileSync(join(HERE, "..", "registry", "adatkeszletek", "noi-egeszseg.json"), "utf8"));

test("a statisztika a SOROKBÓL derivált, nem beírt szám", () => {
  const d = DS();
  assert.equal(d.statisztika.tetel, d.tetelek.length);
  const nyilt = d.tetelek.filter((t) => t.hozzaferes === "nyilt").length;
  assert.equal(d.statisztika.hozzaferes["nyilt"], nyilt);
  const regio: Record<string, number> = {};
  for (const t of d.tetelek) for (const r of t.regio) regio[r] = (regio[r] ?? 0) + 1;
  assert.deepEqual(d.statisztika.regio, regio);
});

test("A TÉRKÉP TORZÍT — és a torzítás megszámolva áll", () => {
  const r = DS().statisztika.regio;
  const ossz = Object.values(r).reduce((a, b) => a + b, 0);
  assert.ok((r["EURO"] + r["AMRO"]) / ossz > 0.65,
    "az adatkészletek kétharmada európai és amerikai");
  assert.equal(r["AFR"] ?? 0, 1,
    "az afrikai régió EGYETLEN tételnél szerepel — ott, ahol az anyai halálozás a legnagyobb");
});

test("A LEKTORÁLT TÁBLÁBAN IS VAN ELLENTMONDÁS — megnevezve, nem belejavítva", () => {
  const h = DS().tabla_hibak;
  assert.ok(h.length >= 4, `${h.length} ellentmondás`);
  const nevek = h.map((x) => x.tetel);
  assert.ok(nevek.some((n) => /BioBank Japan/.test(n)));
  assert.ok(nevek.some((n) => /Born in Bradford/.test(n)),
    "a két sor eredet- és régiómezője egymással fel van cserélve");
  assert.ok(h.some((x) => x.fajta === "regiokod"),
    "egy elgépelt régiókód külön csoportot csinál, nem hibaüzenetet");
});

test("a katalógus kimondja, hogy a bemeneti oldal is populációfüggő", () => {
  assert.match(DS().note, /idegen populáción\s+mért tartomány idegen választ ad/);
});
