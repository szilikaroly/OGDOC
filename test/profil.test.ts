/**
 * PÁCIENS PROFIL — az allergia és az összefoglaló.
 *
 * Két szabályt védenek, és mindkettő ugyanannak az elvnek az élesítése: az üres
 * mező nem nemleges válasz, és a hallgatás nem „nincs más fontos".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALLERGIA_ENTITAS, MAS_KERDES, allergiaAllas, masKerdesuMezok, merleg,
  mezotTolthet, osszefoglaloAllas, szetszortAllergiaMezok, validateProfil,
  type Osszefoglalo,
} from "../core/profil/profil.ts";
import { loadRegistry } from "../core/load.ts";

const REG = loadRegistry("registry/variables");
const OSSZ = (over: Partial<Osszefoglalo> = {}): Osszefoglalo => ({
  modell: "m.osszefoglalo", verzio: "v1", beleegyezes: "bel-2026-114",
  lefedettseg: { kapott: 200, feldolgozott: 182,
    ertelmezhetetlen: [{ dokumentum: "d7", ok: "szkennelt, OCR sikertelen" }],
    legregebbi: "2019-03-01" },
  allitasok: [{ szoveg: "Korábbi mélyvénás thrombosis", dokumentum: "d12", pirosZaszlo: true }],
  ...over,
});

/* ══ 1. AZ ÜRES ALLERGIAMEZŐ NEM „NINCS ALLERGIÁJA" ════════════════════ */

test("NEM KÉRDEZTÜK MEG → a felírás zárva", () => {
  const a = allergiaAllas({ megkerdezve: false, bejegyzesek: [] });
  assert.equal(a.allapot, "nemKerdeztek");
  assert.equal(a.felirhato, false);
  assert.match(a.miert, /nem „nincs allergiája”/);
});

test("MEGKÉRDEZVE, NEMET MONDOTT → ez ÁLLÍTÁS, és nyit", () => {
  const a = allergiaAllas({ megkerdezve: true, bejegyzesek: [] });
  assert.equal(a.allapot, "megkerdezveNincs");
  assert.equal(a.felirhato, true);
  assert.match(a.miert, /ÁLLÍTÁS, nem hiányzó adat/);
});

test("a két állapot KÜLÖNBÖZIK, pedig mindkettő üres bejegyzéslista", () => {
  const nem = allergiaAllas({ megkerdezve: false, bejegyzesek: [] });
  const igen = allergiaAllas({ megkerdezve: true, bejegyzesek: [] });
  assert.deepEqual(nem.megerositett, igen.megerositett, "a lista mindkettőnél üres");
  assert.notEqual(nem.allapot, igen.allapot, "az állapot mégis más");
  assert.notEqual(nem.felirhato, igen.felirhato, "és a kapu is máshogy áll");
});

test("a GYANÚ nem a „nincs” gyengébb változata", () => {
  const a = allergiaAllas({ megkerdezve: true, bejegyzesek: [
    { mire: "penicillin", allapot: "gyanu", rogzitette: "dr. K", forras: "beteg elmondása" }] });
  assert.equal(a.allapot, "gyanu");
  assert.deepEqual(a.gyanus, ["penicillin"]);
  assert.match(a.miert, /nem a „nincs” gyengébb\s+változata/);
});

test("megerősített allergia mellett a tisztázandó gyanú is látszik", () => {
  const a = allergiaAllas({ megkerdezve: true, bejegyzesek: [
    { mire: "penicillin", allapot: "megerositett", reakcio: "anafilaxia",
      rogzitette: "dr. K", forras: "2019-es zárójelentés" },
    { mire: "latex", allapot: "gyanu", rogzitette: "dr. K", forras: "beteg elmondása" }] });
  assert.equal(a.allapot, "megerositett");
  assert.deepEqual(a.megerositett, ["penicillin"]);
  assert.match(a.miert, /tisztázandó: latex/);
});

/* ══ 2. A SZÉTSZÓRT ALLERGIAMEZŐK ══════════════════════════════════════ */

test("AZ ALLERGIA EGYESÍTVE — egy entitás, öt mezővel", () => {
  const m = merleg(REG);
  assert.equal(m.entitas, 5, "list · asked · reaction · severity · verified");
  assert.equal(m.maradek, 0, "az entitáson kívül nem maradt ugyanazt kérdező mező");
  assert.equal(m.egyesitve, true);
  for (const id of ALLERGIA_ENTITAS) assert.ok(REG.get(id), `${id}: hiányzik`);
});

test("AZ ÜRES LISTA NEM „NINCS ALLERGIÁJA” — külön mező mondja meg, megkérdezték-e", () => {
  const asked = REG.get("allergy.asked")!;
  assert.equal(asked.datatype, "tristate");
  assert.match(asked.documentation.whyItMatters?.hu ?? "", /nem lehet kockázatvállalással pótolni/);
});

test("a reakció ALLERGÉNENKÉNT rögzül, nem egyben", () => {
  const r = REG.get("allergy.reaction")!;
  assert.deepEqual(r.scopedBy, { dimension: "allergen", roster: "allergy.list" });
  assert.match(r.documentation.pitfalls?.hu ?? "", /a rossz irányba is tévedhetett/);
});

test("A CÁFOLT ALLERGIÁT NEM TÖRÖLJÜK", () => {
  const v = REG.get("allergy.verified")!;
  assert.ok(v.valueSet?.some((o) => o.code === "cafolt"));
  assert.match(v.documentation.pitfalls?.hu ?? "", /a cáfolat tudása veszne el/);
});

test("a felváltott mezők MEGMARADNAK, de már nem szétszórtság", () => {
  for (const id of ["rx.allergy.penicillin", "rx.allergy.other", "rx.allergy.reaction"]) {
    const v = REG.get(id)!;
    assert.equal(v.status, "superseded", `${id}: a korábbi értékek visszaolvashatók`);
    assert.match(v.documentation.pitfalls?.hu ?? "", /FELVÁLTVA/);
  }
  assert.ok(!szetszortAllergiaMezok(REG).includes("rx.allergy.penicillin"));
});

test("AMI CSAK A NEVÉBEN ALLERGIAMEZŐ — megnevezve, nem elhallgatva", () => {
  const mas = masKerdesuMezok(REG);
  assert.deepEqual(mas, ["diet.allergies.food", "op.who.signIn.allergy"]);
  // A WHO-sor BOOLEAN: nincs benne hely a „nem tudja” válasznak.
  assert.equal(REG.get("op.who.signIn.allergy")!.datatype, "bool");
  assert.match(MAS_KERDES["op.who.signIn.allergy"], /nem bizonyítja, hogy az allergia ismert/);
});

test("egy VALÓDI maradék mező hibát ad, nem figyelmeztetést", () => {
  const hamis = {
    all: () => [...REG.all(), { id: "hx.allergia.regi", aliasOf: undefined,
      status: "active" } as never],
    get: (id: string) => REG.get(id),
  } as unknown as typeof REG;
  const e = validateProfil(hamis).filter((i) => i.severity === "error");
  assert.equal(e.length, 1);
  assert.match(e[0].message, /itt a tét halálos/);
});

test("a lista a REGISZTERBŐL derivált — egy hatodik mezőt is megtalálna", () => {
  // Nem begépelt felsorolás: ha valaki új allergiamezőt vesz fel, ez megfogja.
  const m = szetszortAllergiaMezok(REG);
  assert.ok(m.every((id) => REG.get(id)), "mind létező változó");
  assert.ok(m.every((id) => /allerg/i.test(id)));
});

/* ══ 3. AZ ÖSSZEFOGLALÓ MEGMONDJA, MIT NEM OLVASOTT ════════════════════ */

test("kapu mögötti modell → nincs összefoglaló", () => {
  const a = osszefoglaloAllas(OSSZ(), false);
  assert.equal(a.kiadhato, false);
  assert.equal(a.allapot, "kapuMogott");
  assert.match(a.miert, /MDR 11\. szabályának/);
});

test("beleegyezés nélkül nincs összefoglaló — a másolat a mi felelősségünk", () => {
  const a = osszefoglaloAllas(OSSZ({ beleegyezes: "" }), true);
  assert.equal(a.allapot, "beleegyezesNelkul");
  assert.match(a.miert, /visszavonáskor a másolat is megy/);
});

test("A LEFEDETTSÉG AZ ELSŐ MONDAT, nem a lábjegyzet", () => {
  const a = osszefoglaloAllas(OSSZ(), true);
  assert.equal(a.kiadhato, true);
  assert.match(a.fejlec!, /^182\/200 dokumentum feldolgozva/);
  assert.match(a.fejlec!, /1 nem értelmezhető/);
});

test("AZ IDŐBELI HATÁR KIMONDVA — az azelőttiről nem mond semmit", () => {
  const a = osszefoglaloAllas(OSSZ(), true);
  assert.match(a.fejlec!, /2019-03-01-ig nyúlik vissza/);
  assert.match(a.fejlec!, /NEM MOND SEMMIT/);

  const nincs = osszefoglaloAllas(OSSZ({ lefedettseg: {
    ...OSSZ().lefedettseg, legregebbi: null } }), true);
  assert.match(nincs.fejlec!, /időbeli határa ismeretlen/);
});

test("HIVATKOZÁS NÉLKÜLI ÁLLÍTÁS nem kerülhet bele", () => {
  const a = osszefoglaloAllas(OSSZ({ allitasok: [
    { szoveg: "Korábbi thrombosis", dokumentum: "d12" },
    { szoveg: "Valószínűleg dohányzik" }] }), true);
  assert.equal(a.kiadhato, false);
  assert.equal(a.allapot, "hivatkozasNelkul");
  assert.deepEqual(a.hivatkozasNelkul, ["Valószínűleg dohányzik"]);
  assert.match(a.miert, /hanem hogy ellenőrizni KELLJEN/);
});

test("értelmetlen lefedettség (több feldolgozott, mint kapott) zár", () => {
  const a = osszefoglaloAllas(OSSZ({ lefedettseg: {
    kapott: 10, feldolgozott: 12, ertelmezhetetlen: [], legregebbi: null } }), true);
  assert.equal(a.allapot, "lefedettsegNelkul");
});

/* ══ 4. AZ AI SOHA NEM TÖLT KI STRUKTURÁLT MEZŐT ═══════════════════════ */

test("az összefoglaló SEMMILYEN strukturált mezőt nem tölthet ki", () => {
  for (const mezo of ["rx.allergy.penicillin", "hx.eeszt.chronicDisease", "bármi"]) {
    const t = mezotTolthet(mezo);
    assert.equal(t.tolthet, false);
    assert.match(t.miert, /csak rámutathat/);
  }
});

test("és az indoklás megmondja, MIÉRT nem — ez a szabály lényege", () => {
  assert.match(mezotTolthet("rx.allergy.penicillin").miert,
    /a hiányát olvasná nemleges válaszként/);
});
