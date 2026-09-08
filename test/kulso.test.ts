/**
 * KÜLSŐ PROTOKOLLOK ÉS KALKULÁTOROK — a katalógustól az átvételig.
 *
 * Ezek a tesztek NEM azt bizonyítják, hogy a rendszer át tud venni egy külső
 * protokollt. Azt bizonyítják, hogy **nem vesz át semmit véletlenül**: hogy a
 * licenckapu megelőzi a hitelesítési kaput, hogy a névtelen hitelesítés nem
 * hitelesítés, és hogy egy be nem szerzett forrás akadálya nem felejthető el.
 *
 * A kockázat konkrét: egy percentilis, ami egy soha nem olvasott oldal
 * CÍMÉBŐL származik, pontosan úgy néz ki, mint egy hiteles percentilis.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import {
  atveheto, atvettTetelek, copyleftE, forrasAllapot, kotesek,
  loadKulsoForrasok, validateKulsoForrasok, validateKulsoTerjesztes,
} from "../core/kulso/protokoll.ts";
import type { KulsoForras, KulsoTetel } from "../core/kulso/protokoll.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const reg = loadRegistry(join(HERE, "..", "registry", "variables"));
const forrasok = loadKulsoForrasok(join(HERE, "..", "registry", "kulso"));

const bcn = () => forrasok.find((f) => f.id === "kulso.bcnatal")!;

/** Másolat, amin a kapukat egyenként ki lehet nyitni. */
function masol(f: KulsoForras): KulsoForras {
  return JSON.parse(JSON.stringify(f)) as KulsoForras;
}

test("a BCNatal-katalógus betöltődik, és a tételei változóinkra mutatnak", () => {
  const f = bcn();
  assert.ok(f, "a katalógusnak be kell töltődnie");
  assert.ok(f.tetelek.length >= 20);
  const k = kotesek(f, reg);
  assert.ok(k.length > 0);
  assert.deepEqual(k.filter((x) => !x.ismert), [],
    "minden hivatkozott változónak léteznie kell — enélkül a katalógus a semmihez köti magát");
});

test("a katalógus MA egyetlen tételt sem vesz át", () => {
  assert.deepEqual(atvettTetelek(forrasok), [],
    "hitelesítetlen, ismeretlen licencű forrásból nem születhet átvétel");
});

test("az elutasítás oka MEGNEVEZETT, és a következő lépést is megmondja", () => {
  const f = bcn();
  const a = atveheto(f, f.tetelek[0]);
  assert.equal(a.atveheto, false);
  assert.match(a.miert!, /licenc/i);
  assert.ok(a.kovetkezoLepes && a.kovetkezoLepes.length > 0,
    "egy elutasítás, ami nem mondja meg, mi oldaná fel, örökre elutasítás marad");
});

test("a licenckapu MEGELŐZI a hitelesítést — hitelesítetten sem vehető át", () => {
  const f = masol(bcn());
  f.beszerzes.allapot = "hitelesitett";
  for (const t of f.tetelek) {
    t.hitelesitette = { ki: "dr. Minta Anna", mikor: "2026-09-05T00:00:00.000Z" };
  }
  // A licenc továbbra sem ismert.
  const a = atveheto(f, f.tetelek[0]);
  assert.equal(a.atveheto, false, "ismeretlen licencnél a hitelesítés nem nyit kaput");
  assert.match(a.miert!, /licenc/i);
});

test("ismert licenc + hitelesítés + megnevezett hitelesítő = átvehető", () => {
  const f = masol(bcn());
  f.licenc = { ismert: true, azonosito: "CC BY 4.0" };
  f.beszerzes.allapot = "hitelesitett";
  const t = f.tetelek[0];
  t.hitelesitette = { ki: "dr. Minta Anna", mikor: "2026-09-05T00:00:00.000Z" };
  const a = atveheto(f, t);
  assert.equal(a.atveheto, true);
  assert.equal(a.miert, null);
});

test("a NÉVTELEN hitelesítés nem hitelesítés", () => {
  const f = masol(bcn());
  f.licenc = { ismert: true, azonosito: "CC BY 4.0" };
  f.beszerzes.allapot = "hitelesitett";
  const a = atveheto(f, f.tetelek[0]);
  assert.equal(a.atveheto, false);
  assert.match(a.miert!, /KI igazolta|nincs megnevezve/);
});

test("a köztes állapotok NEM adnak hozzá semmit", () => {
  const f = masol(bcn());
  f.licenc = { ismert: true, azonosito: "CC BY 4.0" };
  for (const allapot of ["nem-beszerzett", "beszerzett", "feldolgozott"] as const) {
    f.beszerzes.allapot = allapot;
    const a = atveheto(f, f.tetelek[0]);
    assert.equal(a.atveheto, false, `${allapot}: a szöveg megléte még nem átvétel`);
    assert.ok(a.kovetkezoLepes, `${allapot}: kell hogy legyen következő lépés`);
  }
});

test("a tételszintű állapot felülírja a forrásét, de a licenckaput nem", () => {
  const f = masol(bcn());
  const t = f.tetelek[0];
  t.allapot = "hitelesitett";
  t.hitelesitette = { ki: "dr. Minta Anna", mikor: "2026-09-05T00:00:00.000Z" };
  assert.equal(atveheto(f, t).atveheto, false, "a licenc még mindig ismeretlen");
  f.licenc = { ismert: true };
  assert.equal(atveheto(f, t).atveheto, true);
  // A többi tétel a forrás állapotán marad.
  assert.equal(atveheto(f, f.tetelek[1]).atveheto, false);
});

test("a be nem szerzett forrás AKADÁLYA nem felejthető el", () => {
  const f = masol(bcn());
  delete f.beszerzes.akadaly;
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "error" && /akadály/i.test(i.message)),
    "akadály nélkül úgy néz ki, mintha senki nem próbálta volna");
});

test("a nem létező változóra kötött tétel BUILD-HIBA", () => {
  const f = masol(bcn());
  f.tetelek[0].mihezKotodik = ["us.nincs.ilyen"];
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "error" && /nem létezik/.test(i.message)));
});

test("ismeretlen licencű forrásban a hitelesített tétel BUILD-HIBA", () => {
  const f = masol(bcn());
  f.tetelek[0].allapot = "hitelesitett";
  f.tetelek[0].hitelesitette = { ki: "dr. Minta Anna", mikor: "2026-09-05T00:00:00.000Z" };
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "error" && /licenckapu/.test(i.message)));
});

test("beszerzettnek jelölt forrásban a keresőtalálatból vett cím FIGYELMEZTETÉS", () => {
  const f = masol(bcn());
  f.beszerzes.allapot = "beszerzett";
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "warning" && /keresőtalálatból/.test(i.message)));
});

test("a valódi katalógus hibátlan", () => {
  const issues = validateKulsoForrasok(forrasok, reg);
  assert.deepEqual(issues.filter((i) => i.severity === "error"), []);
});

test("az állapotösszefoglaló kimondja, hogy NULLA tétel van átvéve", () => {
  const a = forrasAllapot(bcn(), reg);
  assert.equal(a.atvettSzama, 0);
  assert.equal(a.licencIsmert, false);
  assert.match(a.osszefoglalo, /NULLA/);
  assert.ok(a.erintettValtozok > 0, "a haszon a beszerzés előtt is látszik");
  assert.ok(a.akadaly, "az akadály megjelenik az összefoglalóban");
});

test("a cim nélküli tétel nem beszerezhető — hiba", () => {
  const f = masol(bcn());
  (f.tetelek[0] as KulsoTetel).cim = "";
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "error" && /cím nélküli/.test(i.message)));
});

/* ── A KALKULÁTOR-KATALÓGUS: a vegyes forrás és a harmadik licenceset ──── */

const kalk = () => forrasok.find((f) => f.id === "kulso.kalkulatorok")!;

test("a vegyes katalógusban a TÉTEL beszerzési állapota az irányadó, nem a forrásé", () => {
  const f = kalk();
  assert.equal(f.beszerzes.allapot, "nem-beszerzett");
  const a = forrasAllapot(f, reg);
  assert.ok(a.beszerzettSzama >= 3,
    "a forrásszintű „nem-beszerzett” nem takarhatja el a kézben lévő tételeket");
  assert.match(a.osszefoglalo, /megvan/);
});

test("a GPLv2 tétel NEM vehető át, pedig a licence ISMERT", () => {
  const f = kalk();
  const prb = f.tetelek.find((t) => t.id === "calc.prb.pe")!;
  assert.equal(prb.licenc?.ismert, true);
  assert.equal(prb.licenc?.azonosito, "GPL-2.0");
  const a = atveheto(f, prb);
  assert.equal(a.atveheto, false);
  assert.match(a.miert!, /COPYLEFT/);
  assert.match(a.kovetkezoLepes!, /licenc/i);
});

test("a copyleft kapu a projekt licencének kimondásával oldódik fel", () => {
  const f = masol(kalk());
  const prb = f.tetelek.find((t) => t.id === "calc.prb.pe")!;
  // Kimondott, kompatibilis licenc — de a hitelesítés még hiányzik, tehát a
  // KÖVETKEZŐ kapu fog rá.
  const a = atveheto(f, prb, { projektLicenc: "GPL-2.0-or-later" });
  assert.equal(a.atveheto, false);
  assert.match(a.miert!, /hitelesített/);
  assert.doesNotMatch(a.miert!, /COPYLEFT/);
});

test("copyleft + kimondott licenc + hitelesítés = átvehető", () => {
  const f = masol(kalk());
  const prb = f.tetelek.find((t) => t.id === "calc.prb.pe")!;
  prb.allapot = "hitelesitett";
  prb.hitelesitette = { ki: "dr. Minta Anna", mikor: "2026-09-05T00:00:00.000Z" };
  assert.equal(atveheto(f, prb, { projektLicenc: "GPL-2.0-or-later" }).atveheto, true);
  // Kimondott licenc NÉLKÜL ugyanez továbbra is elutasított.
  assert.equal(atveheto(f, prb).atveheto, false);
});

test("a copyleftE a GPL-változatokat ismeri, a megengedőket nem", () => {
  for (const l of ["GPL-2.0", "GPLv2", "GPL-3.0", "AGPL-3.0", "LGPL-2.1"]) {
    assert.equal(copyleftE(l), true, l);
  }
  for (const l of ["MIT", "Apache-2.0", "CC BY 4.0", "BSD-3-Clause", undefined]) {
    assert.equal(copyleftE(l), false, String(l));
  }
});

test("a bizonyíték nem átvétel tárgya, hanem HIVATKOZHATÓ", () => {
  const f = kalk();
  const aog = f.tetelek.find((t) => t.id === "calc.aog.cesarean.validation")!;
  assert.equal(aog.tipus, "bizonyitek");
  const a = atveheto(f, aog);
  assert.equal(a.atveheto, false, "közleményből nincs mit átvenni");
  assert.equal(a.hivatkozhato, true, "de megvan, tehát idézhető");
  assert.equal(a.kovetkezoLepes, null);
});

test("a be nem szerzett bizonyíték még idézni sem elég", () => {
  const f = kalk();
  const pp = f.tetelek.find((t) => t.id === "calc.prb.preprint")!;
  const a = atveheto(f, pp);
  assert.equal(a.hivatkozhato, false);
  assert.ok(a.kovetkezoLepes);
});

test("a „megvan” állítás megnevezés nélkül BUILD-HIBA", () => {
  const f = masol(kalk());
  const prb = f.tetelek.find((t) => t.id === "calc.prb.pe")!;
  delete prb.forras;
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "error" && /megnevezetlen példány/.test(i.message)));
});

test("a tételszintű be-nem-szerzés akadály nélkül BUILD-HIBA", () => {
  const f = masol(kalk());
  const t = f.tetelek.find((x) => x.id === "calc.vte.nottingham")!;
  delete t.beszerzes!.akadaly;
  const issues = validateKulsoForrasok([f], reg);
  assert.ok(issues.some((i) => i.severity === "error" && /a forrás általános indoka/.test(i.message)));
});

test("copyleft származék a TERJESZTETT fában build-hiba", () => {
  const f = masol(kalk());
  const prb = f.tetelek.find((t) => t.id === "calc.prb.pe")!;
  prb.forras!.helyiTabla = "registry/kulso/prb-pe/";
  const issues = validateKulsoTerjesztes([f]);
  assert.ok(issues.some((i) => i.severity === "error" && /terjesztés/.test(i.message)),
    "a GPL a használatot nem korlátozza — a repó viszont terjesztés");
  // A helyén viszont nincs kifogás.
  prb.forras!.helyiTabla = "registry/kulso/helyi/prb-pe/";
  assert.deepEqual(validateKulsoTerjesztes([f]), []);
});

test("a valódi katalógusok terjesztési szempontból is hibátlanok", () => {
  assert.deepEqual(validateKulsoTerjesztes(forrasok), []);
});

test("a PRB-modell MINDEN kötése létező változó, az sEng kivételével — ami hiányzik", () => {
  const f = kalk();
  const prb = f.tetelek.find((t) => t.id === "calc.prb.pe")!;
  const k = kotesek(f, reg).filter((x) => x.tetelek.includes(prb.id));
  assert.deepEqual(k.filter((x) => !x.ismert), []);
  // A modell negyedik biomarkere viszont nincs meg nálunk — ezt a katalógus
  // szövegének ki kell mondania, különben a hiány láthatatlan marad.
  assert.match(prb.mitAdnaHozza.hu, /endoglin|sEng/);
});

/* ── AZ ÁLLAPOT NEVE IS ADAT ─────────────────────────────────────────── */

test("a kitalált tételállapot HIBA, nem néma `undefined`", () => {
  const f = masol(bcn());
  const rossz = {
    ...f,
    tetelek: [{ ...f.tetelek[0], allapot: "hivatkozhato" as never }],
  };
  const h = validateKulsoForrasok([rossz], reg).filter((i) => i.severity === "error");
  assert.ok(h.some((i) => /ismeretlen allapot: „hivatkozhato”/.test(i.message)),
    "az érvénytelen állapotnevet a validálásnak meg kell fognia");

  // …és amíg meg nem fogja, az indoklás olvashatatlan marad:
  const a = atveheto(rossz, rossz.tetelek[0]);
  assert.doesNotMatch(String(a.miert), /undefined/,
    "az ismeretlen állapot MEGNEVEZVE jelenik meg, nem `undefined`-ként");
});

test("a CTG-tárak katalógusa kimondja, hogy nem annyi bizonyíték, ahány tár", () => {
  const ctg = forrasok.find((f) => f.id === "kulso.ctgml")!;
  assert.match(ctg.note!.hu!, /BÁJTRA AZONOSAN/);
  assert.match(ctg.note!.hu!, /A CÍMKE NEM KIMENETEL/);
  assert.match(ctg.note!.hu!, /egy ujjlenyomat = EGY HANG/);
  // A licenckapu TÉTELENKÉNT más — a szám a sorokból jön, nem beírva.
  const licNelkul = ctg.tetelek.filter((t) => !(t.licenc ?? ctg.licenc).ismert);
  assert.ok(licNelkul.length >= 3,
    `${licNelkul.length} tárnak nincs licence — azokból semmi nem vehető át`);
  for (const t of ctg.tetelek) {
    assert.equal(atveheto(ctg, t).atveheto, false, `${t.id}: egyik sem átvehető ma`);
  }
});

test("a scENDO külön fajta: BIZONYÍTÉK, nem eszköz", () => {
  const sc = forrasok.find((f) => f.id === "kulso.scendo")!;
  assert.ok(sc.tetelek.every((t) => t.tipus === "bizonyitek"),
    "egy elemzési csővezeték nem döntéstámogató modell");
  assert.match(sc.note!.hu!, /a BIZONYÍTÉK és az ESZKÖZ nem ugyanaz/);
  // Idézhető, de átvenni nincs mit — és ez KÜLÖN állapot.
  const a = atveheto(sc, sc.tetelek[0]);
  assert.equal(a.hivatkozhato, true);
  assert.equal(a.atveheto, false);
});
