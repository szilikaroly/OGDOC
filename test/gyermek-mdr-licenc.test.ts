/**
 * A 29. MODUL, AZ MDR-BESOROLÁS ÉS A LICENCPANEL.
 *
 * Három réteg, egy közös szabály: a kapu ADATBÓL nyílik, nem szóból — és a
 * hiányzó adat sehol nem „igen”.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  dozis, eletszakasz, kuszobAktiv, kuszobKapu, lenyeg, lenyomat, loadKuszobok,
  loadOsszerendeles, merleg as gyMerleg, osszerendelheto, validatePerinatalis,
} from "../core/gyermek/perinatalis.ts";
import {
  aiAlmodulNyithato, besorolasAllas, loadMdr, merleg as mdrMerleg, validateMdr,
} from "../core/mdr/besorolas.ts";
import {
  allasok, loadPanel, merleg as licMerleg, nyitva, tetelAllas, validatePanel,
} from "../core/licenc/panel.ts";
import { loadRegistry } from "../core/load.ts";

const MA = "2026-09-08";
const KU = () => loadKuszobok("registry/gyermek/kuszobok.json");
const OS = () => loadOsszerendeles("registry/gyermek/osszerendeles.json");
const MD = () => loadMdr("registry/mdr/besorolas.json");
const PA = () => loadPanel("registry/licenc/panel.json");
const IDS = new Set(loadRegistry("registry/variables").all().map((v) => v.id));

/* ══ 1. A HIÁNYZÓ ÉLETKOR NEM „FELNŐTT" ════════════════════════════════ */

test("a hiányzó életkor NEM felnőtt — és a felnőtt referencia zárva marad", () => {
  const i = eletszakasz(null);
  assert.equal(i.szakasz, "ismeretlen");
  assert.equal(i.felnottReferencia, false);
  assert.match(i.miert, /nem kevésbé pontos, hanem rossz/);
});

test("a négy életszakasz határai", () => {
  assert.equal(eletszakasz(0).szakasz, "perinatalis");
  assert.equal(eletszakasz(7).szakasz, "perinatalis");
  assert.equal(eletszakasz(8).szakasz, "ujszulott");
  assert.equal(eletszakasz(28).szakasz, "ujszulott");
  assert.equal(eletszakasz(29).szakasz, "csecsemo");
  assert.equal(eletszakasz(365).szakasz, "csecsemo");
  assert.equal(eletszakasz(366).szakasz, "gyermek");
  assert.equal(eletszakasz(365 * 18).szakasz, "felnott");
  assert.equal(eletszakasz(-1).szakasz, "ismeretlen", "negatív kor sem felnőtt");
});

/* ══ 2. A KÜSZÖB ALÁÍRÁSBÓL NYÍLIK ═════════════════════════════════════ */

test("MA egyetlen perinatális küszöb sincs aláírva — a réteg nem ad ítéletet", () => {
  const g = kuszobKapu(KU());
  assert.equal(g.allapot, "alairatlan");
  assert.equal(g.adItel, false);
  assert.match(g.miert, /Rossz küszöbön a rendszer ROSSZAT mond/);
  assert.equal(kuszobAktiv(KU(), "nb.apgar.at5"), false);
});

test("az aláírás a SZÁMOKHOZ köt: a küszöb változtatása ELAVULTTÁ teszi", () => {
  const k = KU();
  const mag = lenyomat(lenyeg(k));
  k.hitelesitesek.push({ ki: "dr. Neonatológus", mikor: MA, lenyomat: mag,
    osszevetett: k.kuszobok.map((x) => x.id) });
  assert.equal(kuszobKapu(k).allapot, "alairt");
  assert.equal(kuszobAktiv(k, "nb.cordPh"), true);

  k.kuszobok.find((x) => x.id === "nb.cordPh")!.ertek = 7.10;
  const g = kuszobKapu(k);
  assert.equal(g.allapot, "elavult");
  assert.equal(g.adItel, false);
  assert.match(g.miert, /a SZÁMOKHOZ köt, nem a dokumentumhoz/);
});

test("a részleges aláírás csak az ÖSSZEVETETT küszöbökre terjed ki", () => {
  const k = KU();
  k.hitelesitesek.push({ ki: "dr. N", mikor: MA, lenyomat: lenyomat(lenyeg(k)),
    osszevetett: ["nb.apgar.at5", "nb.cordPh"] });
  const g = kuszobKapu(k);
  assert.equal(g.allapot, "reszben");
  assert.equal(kuszobAktiv(k, "nb.apgar.at5"), true);
  assert.equal(kuszobAktiv(k, "nb.cordBe"), false, "amire nem terjed ki, az nem ad ítéletet");
});

test("minden küszöb ismert változóra hivatkozik", () => {
  const h = validatePerinatalis(KU(), OS(), IDS).filter((i) => i.severity === "error");
  assert.deepEqual(h, []);
});

/* ══ 3. AZ ÖSSZERENDELÉS JOGALAP NÉLKÜL NEM JÖN LÉTRE ══════════════════ */

test("jogalap nélkül az anya–gyermek kapcsolat NEM hozható létre", () => {
  const i = osszerendelheto(OS(), { anyaEset: "a", gyerekEset: "g", cselekvo: "dr. K" });
  assert.equal(i.letrehozhato, false);
  assert.equal(i.allapot, "jogalapNelkul");
  assert.match(i.miert, /nem lehet „nem tudottá” tenni/);
});

test("jogalappal, megnevezett cselekvővel létrehozható — a megtekintés auditsor", () => {
  const o = OS();
  o.jogalapok.push({ id: "jog.szules", megnevezes: "Intézményi szülés",
    lathatja: ["kezelő klinikus", "neonatológus"] });
  const nincsCselekvo = osszerendelheto(o, { anyaEset: "a", gyerekEset: "g", jogalap: "jog.szules" });
  assert.equal(nincsCselekvo.allapot, "cselekvoNelkul");

  const jo = osszerendelheto(o, { anyaEset: "a", gyerekEset: "g",
    jogalap: "jog.szules", cselekvo: "dr. K" });
  assert.equal(jo.letrehozhato, true);
  assert.match(jo.miert, /megtekintés auditsor/);
});

test("a megtekintés auditálásának kikapcsolása HIBA", () => {
  const o = OS(); o.megtekintesAuditalt = false;
  const h = validatePerinatalis(KU(), o, IDS).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /legérzékenyebb adata/);
});

/* ══ 4. SÚLYALAPÚ DOZÍROZÁS ════════════════════════════════════════════ */

test("AKTUÁLIS SÚLY NÉLKÜL NINCS DOZÍROZÁS — nem becsül életkorból", () => {
  const d = dozis({ hatoanyag: "paracetamol", mgPerKg: 15, maxEgyszeri: 1000 });
  assert.equal(d.allapot, "sulyNelkul");
  assert.equal(d.mg, null);
  assert.match(d.miert, /a hiba a végén nem\s+érzékelhető/);
});

test("az elavult súly téves bemenet, nem közelítés", () => {
  const d = dozis({ hatoanyag: "x", mgPerKg: 15, sulyKg: 3.4, sulyKora: 30, maxEgyszeri: 1000 });
  assert.equal(d.allapot, "sulyElavult");
  assert.equal(d.mg, null);
  assert.match(d.miert, /megduplázódhat/);
});

test("A MAXIMUM KEMÉNY KORLÁT — a szorzás felnőttdózis fölé nem mehet", () => {
  const d = dozis({ hatoanyag: "paracetamol", mgPerKg: 15, sulyKg: 90, maxEgyszeri: 1000 });
  assert.equal(d.allapot, "maximumraVagva");
  assert.equal(d.mg, 1000);
  assert.match(d.miert, /nem figyelmeztetés/);
  assert.match(d.levezetes!, /maximumra vágva/);
});

test("a levezetés LÁTSZIK, és a kerekítés csak LEFELÉ mehet", () => {
  const d = dozis({ hatoanyag: "x", mgPerKg: 7.5, sulyKg: 3.33, maxEgyszeri: 1000 });
  // 3.33 × 7.5 = 24.975 → lefelé 24.97
  assert.equal(d.mg, 24.97);
  assert.ok(d.mg! < 3.33 * 7.5, "sosem kerekít felfelé");
  assert.match(d.levezetes!, /3\.33 kg × 7\.5 mg\/kg/);
});

/* ══ 5. MDR — A BESOROLÁST NEM LEHET MEGÚSZNI ══════════════════════════ */

test("ma a besorolás ÉRINTETLEN, és emiatt az AI-almodul ZÁRVA", () => {
  const m = MD();
  const b = besorolasAllas(m);
  assert.equal(b.allapot, "erintetlen");
  assert.equal(b.eldolt, false);
  assert.equal(b.osszes, 8);
  assert.equal(aiAlmodulNyithato(m).nyithato, false);
});

test("a kimondott besorolás GYÁRTÓ nélkül nem elég", () => {
  const m = MD(); m.besorolas = "IIa";
  const b = besorolasAllas(m);
  assert.equal(b.allapot, "gyartoNelkul");
  assert.equal(b.eldolt, false);
  assert.match(b.miert, /5\. cikk \(5\)/);
});

test("besorolás + gyártó után is kell a MŰSZAKI DOKUMENTÁCIÓ", () => {
  const m = MD(); m.besorolas = "IIa"; m.gyarto = "Intézmény";
  assert.equal(besorolasAllas(m).eldolt, true);
  const a = aiAlmodulNyithato(m);
  assert.equal(a.nyithato, false);
  assert.match(a.miert, /14 tétel hiányzik|tétel hiányzik/);

  for (const t of m.muszakiDokumentacio) m.dokumentacioAllapot[t.id] = "kesz";
  assert.equal(aiAlmodulNyithato(m).nyithato, true);
});

test("ELLENTMONDÁS: diagnózist megalapoz, mégis „nem eszköz” — hiba", () => {
  const m = MD();
  m.valaszok["mdr.q3"] = { valasz: true };
  m.besorolas = "nem eszköz"; m.gyarto = "Intézmény";
  const h = validateMdr(m).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /11\.\s*szabály szerint ez legalább IIa/);
});

test("a mérleg a sorokból derivált", () => {
  const m = mdrMerleg(MD());
  assert.equal(m.kerdes, 8);
  assert.equal(m.dokTetel, 14);
  assert.equal(m.eldolt, false);
  assert.equal(m.aiNyithato, false);
});

/* ══ 6. LICENCPANEL ════════════════════════════════════════════════════ */

test("kétféle tétel: ami engedéllyel megszerezhető, és ami nem", () => {
  const p = PA();
  const a = allasok(p, MA);
  assert.equal(a.filter((x) => x.allapot === "nemAktivalhato").length, 2,
    "SNOMED (ND) és PRBPERIsk (GPLv2)");
  assert.ok(a.filter((x) => x.allapot === "aktivalhato").length >= 8);
  const snomed = a.find((x) => x.tetel.id === "lic.snomed")!;
  assert.match(snomed.miert, /a bejelölése sem oldaná fel/);
});

test("A HIÁNYOS AKTIVÁLÁS NEM NYIT KAPUT — olyan, mint egy bejelölt négyzet", () => {
  const p = PA();
  p.aktivalasok.push({ tetel: "lic.eq5d", jogosult: "", hatokor: "",
    ervenyesTol: "2026-01-01", ervenyesIg: null, bizonyitek: "", rogzitette: "" });
  const x = tetelAllas(p, p.tetelek.find((t) => t.id === "lic.eq5d")!, MA);
  assert.equal(x.allapot, "hianyosAktivalas");
  assert.equal(x.nyitva, false);
  assert.match(x.miert, /úgy néz ki, mint engedély, és nem az/);
  assert.equal(nyitva(p, "lic.eq5d", MA), false);
});

test("teljes aktiválás kinyitja a kaput", () => {
  const p = PA();
  p.aktivalasok.push({ tetel: "lic.eq5d", jogosult: "Intézmény", hatokor: "klinikai, magyar",
    ervenyesTol: "2026-01-01", ervenyesIg: "2027-12-31", bizonyitek: "EQ-2026-114",
    rogzitette: "dr. K" });
  assert.equal(nyitva(p, "lic.eq5d", MA), true);
  assert.equal(tetelAllas(p, p.tetelek.find((t) => t.id === "lic.eq5d")!, MA).allapot, "aktiv");
});

test("A LEJÁRT LICENC UGYANÚGY ZÁR, mint a hiányzó", () => {
  const p = PA();
  p.aktivalasok.push({ tetel: "lic.whodas", jogosult: "Intézmény", hatokor: "klinikai",
    ervenyesTol: "2024-01-01", ervenyesIg: "2026-06-30", bizonyitek: "W-1", rogzitette: "dr. K" });
  const x = tetelAllas(p, p.tetelek.find((t) => t.id === "lic.whodas")!, MA);
  assert.equal(x.allapot, "lejart");
  assert.equal(x.nyitva, false);
  assert.equal(validatePanel(p, MA).filter((i) => i.severity === "error").length, 1);
});

test("90 nappal a lejárat előtt szól, de még nyitva tart", () => {
  const p = PA();
  p.aktivalasok.push({ tetel: "lic.mibs", jogosult: "Intézmény", hatokor: "klinikai",
    ervenyesTol: "2024-01-01", ervenyesIg: "2026-11-01", bizonyitek: "M-1", rogzitette: "dr. K" });
  const x = tetelAllas(p, p.tetelek.find((t) => t.id === "lic.mibs")!, MA);
  assert.equal(x.allapot, "hamarosanLejar");
  assert.equal(x.nyitva, true, "még érvényes");
  assert.equal(validatePanel(p, MA).filter((i) => i.severity === "warning").length, 1);
});

test("NEM AKTIVÁLHATÓ tételre rögzített aktiválás HIBA — engedélynek látszik", () => {
  const p = PA();
  p.aktivalasok.push({ tetel: "lic.snomed", jogosult: "Intézmény", hatokor: "minden",
    ervenyesTol: "2026-01-01", ervenyesIg: null, bizonyitek: "x", rogzitette: "dr. K" });
  const h = validatePanel(p, MA).filter((i) => i.severity === "error");
  assert.ok(h.some((i) => /a legveszélyesebb fajta, mert engedélynek látszik/.test(i.message)));
  assert.equal(nyitva(p, "lic.snomed", MA), false, "és tényleg nem nyílik ki");
});

test("a panel mérlege a sorokból derivált", () => {
  const p = PA();
  const m = licMerleg(p, MA);
  assert.equal(m.tetel, p.tetelek.length);
  assert.equal(m.aktiv, 0, "ma egyetlen licenc sincs aktiválva");
  assert.equal(m.nemAktivalhato, 2);
  assert.equal(m.aktivalhato + m.nemAktivalhato, m.tetel);
});

test("a gyermekmodul mérlege", () => {
  const m = gyMerleg(KU(), OS());
  assert.equal(m.kuszob, 6);
  assert.equal(m.alairt, 0);
  assert.equal(m.jogalap, 0);
  assert.equal(m.osszerendelheto, false);
});
