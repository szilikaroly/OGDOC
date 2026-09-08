/**
 * A KUTATÁSETIKAI (ETT) BEADVÁNY DOSSZIÉJA — a 11. lépés gépi fele.
 *
 * A 11. lépés nem fejlesztési feladat: a kérelmet a kutatásvezető adja be. A
 * gép egyetlen dolgot tehet, és azt muszáj — megakadályozni, hogy a kérelem
 * OLYAT ÁLLÍTSON, AMI NEM IGAZ.
 *
 * A tesztek öt szabályt védenek:
 *
 *   1. minden tételnek ÁLLÍTÁSA van, nem csak címe;
 *   2. az állítás mögött ÉLŐ bizonyíték áll, nem fájlnév;
 *   3. a bizonyítatlan állítás megnevezve marad, és blokkol;
 *   4. a szervezeti tétel nem felmentés, hanem címzés;
 *   5. a kép megváltozik, ha a rendszer állapota megváltozik.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  allapot, beadhato, bizonyitekok, ertekel, hitelesitesAllapota, loadDosszie,
  merleg, validateDosszie,
} from "../core/ett/dosszie.ts";
import type { AllapotForrasok, Bizonyitek, Dosszie } from "../core/ett/dosszie.ts";
import { rendszerAllapot } from "../core/ett/allapot.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const GYOKER = join(HERE, "..");
const D = loadDosszie(join(GYOKER, "registry", "ett", "dosszie.json"));

/** A MAI állapot — a valódi regiszterekből. */
import { loadPilot } from "../core/pilot/felkeszultseg.ts";

const MA = rendszerAllapot(GYOKER);

/** Az a nap, amikor minden aláírás megvan. Szintetikus, nem jóslat. */
const KESZ: AllapotForrasok = {
  gyoker: GYOKER,
  dontesAlairt: 38, dontesOsszes: 38,
  megorzesAlairt: 14, megorzesOsszes: 14,
  laborAlairt: 32, laborOsszes: 32,
  normogramAlairt: 3, normogramOsszes: 3,
  kalkKapuMogott: 0, kalkAlairt: 7, kalkOrokolt: 0,
  szepszisAlairt: 11, szepszisOsszes: 11, szepszisRiaszt: true,
  meroeszkozRendezett: 10, meroeszkozOsszes: 10, meroeszkozFelveheto: 9,
  meroeszkozValidalt: 10,
  phiValtozo: 2,
};

const masol = (): Dosszie => JSON.parse(JSON.stringify(D));

/* ── 1. A TÉTEL ÁLLÍTÁS, NEM CÍM ────────────────────────────────────── */

test("minden tételnek van ÁLLÍTÁSA, nem csak címe", () => {
  assert.equal(D.tetelek.length, 14);
  for (const t of D.tetelek) {
    assert.ok((t.allitas.hu ?? "").length > 20, `${t.id}: nincs állítás`);
  }
});

test("a cím nélküli állítás építési hiba", () => {
  const d = masol();
  d.tetelek[0].allitas = { hu: "" };
  const hibak = validateDosszie(d, bizonyitekok(MA)).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /nincs ÁLLÍTÁSA/);
});

test("RENDSZERTÉTEL BIZONYÍTÉK NÉLKÜL a dosszié legveszélyesebb alakja", () => {
  const d = masol();
  d.tetelek.find((t) => t.id === "ett.t8")!.bizonyitek = [];
  const hibak = validateDosszie(d, bizonyitekok(MA)).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /semmi nem venné észre/);
});

test("az elavult bizonyítékhivatkozás építési hiba", () => {
  const d = masol();
  d.tetelek[0].bizonyitek = ["nincs-ilyen-kulcs"];
  const hibak = validateDosszie(d, bizonyitekok(MA)).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /ismeretlen bizonyítékkulcs/);
});

test("a nem hivatkozott bizonyíték is jelzés — vagy tétel hiányzik, vagy fölösleges", () => {
  const d = masol();
  // Az `ett.t1` az elemzési tervre hivatkozik, és a bizonyítékbázis KÖZÖS
  // részéből ez az egyik, amit rajta kívül senki nem használ — a megőrzési
  // aláírásokra például már a pilot előfeltételei is hivatkoznak, tehát annak
  // kiesése NEM tenné a kulcsot hivatkozatlanná.
  d.tetelek = d.tetelek.filter((t) => t.id !== "ett.t1");
  // A bizonyítékbázis KÖZÖS az EESZT-dossziéval, ezért a máshol használt
  // kulcsokat át kell adni — különben minden EESZT-kulcs „fölöslegesnek”
  // látszana, holott csak nem ezé a dossziéé.
  // A LISTA A NYILVÁNTARTÁSBÓL JÖN, NEM KÉZBŐL. Begépelve minden új
  // EESZT- vagy pilot-kulcsnál elavulna — és a teszt nem a hiányt jelezné,
  // hanem magát a bővítést.
  const pilot = loadPilot(`${GYOKER}/registry/pilot/pilot.json`);
  const mashol = [
    "szintetikus-kapu", "ellatas-tipusok", "fejlesztesi-kornyezet",
    "adatfeldolgozoi-kepesseg", "agazati-azonosito",
    ...[...pilot.elofeltetelek, ...pilot.kimondatlan].flatMap((e) => e.bizonyitek),
  ];
  const w = validateDosszie(d, bizonyitekok(MA), mashol)
    .filter((i) => /egyetlen dossziététel sem hivatkozik/.test(i.message));
  assert.equal(w.length, 1);
  assert.match(w[0].message, /elemzesi-terv/);
});

/* ── 2. A BIZONYÍTÉK ÉLŐ, NEM FÁJLNÉV ───────────────────────────────── */

test("A HITELESÍTÉS BIZONYÍTÉKA A KÓDBÓL JÖN — ÉS A KAPUTÓL FÜGGETLEN", () => {
  const h = hitelesitesAllapota(GYOKER);
  // A KÉT TÉNY FÜGGETLEN. Korábban `van: !kapu` állt a kódban: a hitelesítés
  // MEGLÉTÉT a kapu HIÁNYAKÉNT definiálta, tehát a bizonyíték csak a
  // biztonsági korlát ELTÁVOLÍTÁSÁTÓL vált volna igazzá — épp a rossz irányba.
  assert.equal(h.van, true, "a hitelesítés elkészült");
  assert.equal(h.kapu, true, "és a kapu ettől függetlenül ÁLL");
  assert.match(h.miert, /scrypt|időfüggetlen/i);

  const b = bizonyitekok(MA).find((x) => x.kulcs === "hitelesites")!;
  assert.equal(b.megvan, true);
});

test("a hitelesítés bizonyítéka a MEGKERÜLÉST is nézi", () => {
  // Egy megkerülhető hitelesítés nem hitelesítés: ha a kiszolgálóban maradna
  // fejléc-alapú út, a jelszavas belépés mellette semmit nem érne.
  const forras = readFileSync(join(GYOKER, "web", "server.ts"), "utf8");
  assert.ok(!/x-ogdoc-actor/.test(forras), "maradt fejléc-alapú cselekvő-út");
  assert.match(forras, /azonosit\(AUTH/);
});

test("a bizonyítékok a MOSTANI regiszterállapotot mutatják", () => {
  const b = new Map(bizonyitekok(MA).map((x) => [x.kulcs, x]));
  assert.equal(b.get("dontes-alairasok")!.megvan, false);
  assert.match(b.get("dontes-alairasok")!.ertek, /0\/38/);
  assert.equal(b.get("megorzes-alairasok")!.megvan, false);
  assert.match(b.get("megorzes-alairasok")!.ertek, /0\/14/);
  // …és ami MEGVAN, az is a rendszerből jön, nem állításból.
  assert.equal(b.get("auditnaplo")!.megvan, true);
  assert.equal(b.get("titkositas")!.megvan, true);
  assert.equal(b.get("torles-visszavonas")!.megvan, true);
});

test("a kulcstár hiánya is bizonyíték — a titkosítás a fájljogosultságig véd", () => {
  const b = bizonyitekok(MA).find((x) => x.kulcs === "kulcstar-hsm")!;
  assert.equal(b.megvan, false);
  assert.match(b.miert, /fájlrendszer jogosultságáig/);
});

/* ── 3. A BIZONYÍTATLAN ÁLLÍTÁS BLOKKOL ─────────────────────────────── */

test("A KÉRELEM MA NEM ADHATÓ BE — és pontosan megmondja, miért", () => {
  const e = ertekel(D, bizonyitekok(MA));
  const b = beadhato(e);
  assert.equal(b.beadhato, false);
  assert.match(b.miert, /valótlan állítás a bizottság előtt nem az/);
  assert.ok(b.valotlan.length >= 5);
});

test("az adatbiztonsági leírás a HITELESÍTÉSSEL EGYÜTT lett teljes", () => {
  // Ez a sor korábban „részben igaz” volt, egyetlen hiányzó bizonyítékkal: a
  // hitelesítéssel. A dosszié MAGÁTÓL változott meg, amikor a hitelesítés
  // elkészült — nem azért, mert valaki átírta az állítást.
  const t = ertekel(D, bizonyitekok(MA)).find((x) => x.id === "ett.t8")!;
  assert.equal(t.allapot, "fedett");
  assert.equal(t.hianyzo.length, 0);
  assert.equal(t.megvan.length, 5);
  assert.ok(t.megvan.some((b) => b.kulcs === "hitelesites"));
});

test("a megalapozatlan állítás szó szerint idézve jelenik meg a validálásban", () => {
  const w = validateDosszie(D, bizonyitekok(MA))
    .filter((i) => /MEGALAPOZATLAN ÁLLÍTÁS/.test(i.message));
  assert.ok(w.length >= 5);
  // Az állítás szövege benne van — hogy látszódjon, MIT mondanánk ki.
  assert.ok(w.some((i) => /aláírt döntéssel/.test(i.message)));
});

/* ── 4. A SZERVEZETI TÉTEL CÍMZÉS, NEM FELMENTÉS ────────────────────── */

test("a szervezeti tételt a gép nem hagyja jóvá, és nem is bukatja el", () => {
  const e = ertekel(D, bizonyitekok(MA));
  const szerv = e.filter((t) => t.allapot === "szervezeti");
  assert.equal(szerv.length, 4);
  for (const t of szerv) {
    assert.match(t.miert, /a kutatásvezetőé/);
    assert.equal(t.hianyzo.length, 0);
  }
  // …de a beadhatóság mérlegében külön sorban ott állnak.
  assert.equal(beadhato(e).szervezeti.length, 4);
});

test("a szervezeti tétel gépi bizonyítékkal figyelmeztetés", () => {
  const d = masol();
  d.tetelek.find((t) => t.id === "ett.t3")!.bizonyitek = ["auditnaplo"];
  const w = validateDosszie(d, bizonyitekok(MA))
    .filter((i) => /szervezeti tétel gépi bizonyítékkal/.test(i.message));
  assert.equal(w.length, 1);
  assert.equal(w[0].severity, "warning");
});

/* ── 5. A KÉP KÖVETI A RENDSZERT ────────────────────────────────────── */

test("HA AZ ALÁÍRÁSOK MEGSZÜLETNEK, A DOSSZIÉ MAGÁTÓL VÁLTOZIK", () => {
  const kesz = ertekel(D, bizonyitekok(allapot(KESZ)));
  const m = merleg(kesz);
  assert.equal(m.megalapozatlan, 1, "csak az elemzési terv marad");
  const maradt = kesz.find((t) => t.allapot === "megalapozatlan")!;
  assert.equal(maradt.id, "ett.t1");

  // …és a beadhatóság még mindig NEM, mert az ELEMZÉSI TERV hiányzik. Az
  // aláírások önmagukban nem elegendők — és a hitelesítés elkészülte sem az:
  // az `ett.t8` (adatbiztonság) már fedett, az `ett.t1` viszont nem.
  const b = beadhato(kesz);
  assert.equal(b.beadhato, false);
  assert.ok(b.valotlan.some((t) => t.id === "ett.t1"), "az elemzési terv hiányzik");
  assert.ok(!b.valotlan.some((t) => t.id === "ett.t8"),
    "az adatbiztonsági tétel a hitelesítéssel együtt lett teljes");
});

test("a mai mérleg a valódi állapotot írja le", () => {
  const m = merleg(ertekel(D, bizonyitekok(MA)));
  assert.equal(m.osszes, 14);
  assert.equal(m.szervezeti, 4);
  assert.ok(m.megalapozatlan >= 5);
  assert.ok(m.fedett >= 2);
});

test("a valódi dosszié építési hiba nélkül validál", () => {
  assert.equal(
    validateDosszie(D, bizonyitekok(MA)).filter((i) => i.severity === "error").length, 0);
});

test("a hiányzó bizonyítékkulcs nem dönti el csendben a tételt", () => {
  // Ha egy bizonyíték eltűnne a kódból, a tétel NEM lesz automatikusan fedett:
  // a hivatkozás építési hibaként bukik el (ld. fentebb), és amíg ott van,
  // a hiánya látszik.
  const csonka: Bizonyitek[] = bizonyitekok(MA).filter((b) => b.kulcs !== "hitelesites");
  const t = ertekel(D, csonka).find((x) => x.id === "ett.t8")!;
  assert.notEqual(t.allapot, "megalapozatlan");
  const hibak = validateDosszie(D, csonka).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /ismeretlen bizonyítékkulcs: hitelesites/.test(h.message)));
});
