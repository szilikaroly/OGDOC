/**
 * BELGYÓGYÁSZAT — KARDIOLÓGIA ÉS PALLIATÍV ELLÁTÁS.
 *
 * A két terület látszólag távoli, és ugyanaz a szerkezeti hiba fenyegeti
 * mindkettőt: EGY SZÓ KEVESEBBET HORDOZ, MINT AMENNYI A DÖNTÉSHEZ KELL.
 * Az „aortastenosis” nem mondja meg, tünetes-e; a „palliatív” nem mondja meg,
 * ki haldoklik. Mindkét esetben a hiányzó megkülönböztetés a kár.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry } from "../core/load.ts";
import {
  besorol, jelIndex, kontextusbol, loadJelek, loadMwho,
  merleg as kMerleg, olvasat, ppcmGyanu, validateKardio, atadasiRes as kardioRes,
} from "../core/belgyogyaszat/kardio.ts";
import type { MwhoKeszlet, KardioJelKeszlet } from "../core/belgyogyaszat/kardio.ts";
import {
  atadasiRes, dosszieVizsgal, loadPalliativ, merleg as pMerleg, validatePalliativ,
} from "../core/belgyogyaszat/palliativ.ts";
import type { Dosszie, PalliativKeszlet } from "../core/belgyogyaszat/palliativ.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MWHO = loadMwho(join(ROOT, "registry", "belgyogyaszat", "mwho.json"));
const JELEK = loadJelek(join(ROOT, "registry", "belgyogyaszat", "kardio-jelek.json"));
const PALL = loadPalliativ(join(ROOT, "registry", "belgyogyaszat", "palliativ.json"));
const REG = loadRegistry(join(ROOT, "registry", "variables"));
const IDK = new Set(REG.all().map((v) => v.id));
const ismert = (id: string) => IDK.has(id);
const IDX = jelIndex(JELEK);
const MOST = "2026-09-08T10:00:00Z";

/* ── A REGISZTEREK ───────────────────────────────────────────────────── */

test("a kardiológiai regiszterek hibátlanok", () => {
  assert.deepEqual(
    validateKardio(MWHO, JELEK, ismert).filter((i) => i.severity === "error"), []);
});

test("a palliatív regiszter hibátlan", () => {
  assert.deepEqual(validatePalliativ(PALL), []);
});

test("mindkét tábla ALÁÍRATLAN — tehát tájékoztató", () => {
  const m = kMerleg(MWHO, JELEK);
  assert.equal(m.mwhoAlairt, false);
  assert.equal(m.jelekAlairt, false);
  assert.equal(pMerleg(PALL).alairt, false);
});

/* ── A KONTEXTUS ─────────────────────────────────────────────────────── */

test("A FOLYÓ TERHESSÉG ELŐZI A KORÁBBI SZÜLÉST (rövid szülésköz)", () => {
  // Három hónapja szült, ÉS most a 20. héten jár. Ha a gyermekágyi ág döntene,
  // a rendszer egy II. trimeszteres terhesre a gyermekágyi küszöböket engedné.
  assert.equal(kontextusbol(true, 20, 90), "pregnancy.t2");
  assert.equal(kontextusbol(true, 8, 120), "pregnancy.t1");
  assert.equal(kontextusbol(true, 34, 200), "pregnancy.t3");
});

test("terhes, de gesztációs kor nélkül: nem helyettesíthető semmivel", () => {
  assert.equal(kontextusbol(true, null, 90), null);
  assert.equal(kontextusbol(true, null, null), null);
});

test("a gyermekágy két szakasza elkülönül", () => {
  assert.equal(kontextusbol(false, null, 3), "postpartum.korai");
  assert.equal(kontextusbol(false, null, 40), "postpartum.kesoi");
  assert.equal(kontextusbol(false, null, 200), "nonpregnant");
});

test("az ismeretlen terhességi állapot nem „nem terhes”", () => {
  assert.equal(kontextusbol(null, null, null), null);
});

/* ── A JELEK OLVASATA ───────────────────────────────────────────────── */

test("D-DIMER: terhesen a küszöb alatti érték NEM jelölhető normálisnak", () => {
  const o = olvasat(IDX.get("lab.dimer"), "pregnancy.t3", "lab.dimer");
  assert.equal(o.allapot, "kuszobErvenytelen");
  assert.equal(o.normalisnakJelolheto, false);
  assert.match(o.miert, /nem zár ki|NEM jelölheti/);
});

test("D-DIMER: terhességen kívül a küszöb érvényes", () => {
  const o = olvasat(IDX.get("lab.dimer"), "nonpregnant", "lab.dimer");
  assert.equal(o.allapot, "kuszobErvenyes");
  assert.equal(o.normalisnakJelolheto, true);
});

test("TROPONIN: a D-dimer tükörképe — a küszöb MINDEN kontextusban érvényes", () => {
  for (const k of ["nonpregnant", "pregnancy.t1", "pregnancy.t3", "postpartum.korai"] as const) {
    const o = olvasat(IDX.get("lab.troponin.hs"), k, "lab.troponin.hs");
    assert.equal(o.allapot, "kuszobErvenyes", `${k}`);
  }
  assert.match(IDX.get("lab.troponin.hs")!.tiltas, /nem magyarázhat|NEM adhat/i);
});

test("A T-INVERZIÓ SZABÁLY MIND A NÉGY ELVEZETÉSRE HAT (III, V1–V3)", () => {
  // A szabály szövege „III. és V1–V3”-at mond. Az első változat szerkezete
  // csak a `ekg.iii.t` mezőt hordozta, tehát a V1–V3-ra nem hatott.
  for (const v of ["ekg.iii.t", "ekg.v1.t", "ekg.v2.t", "ekg.v3.t"]) {
    assert.equal(olvasat(IDX.get(v), "pregnancy.t3", v).allapot, "kuszobErvenytelen", v);
  }
});

test("…de a V4-re és a többire NEM terjed ki", () => {
  for (const v of ["ekg.v4.t", "ekg.v5.t", "ekg.i.t"]) {
    assert.equal(olvasat(IDX.get(v), "pregnancy.t3", v).allapot, "kuszobErvenyes", v);
  }
});

test("az ST-depresszióra a T-inverziós engedmény nem terjed ki", () => {
  assert.equal(IDX.get("ekg.iii.st"), undefined);
  assert.match(IDX.get("ekg.iii.t")!.tiltas, /ST-depresszió/);
});

test("kontextus nélkül a jel nem értelmezhető — és ez nem „nem terhes”", () => {
  const o = olvasat(IDX.get("lab.dimer"), null, "lab.dimer");
  assert.equal(o.allapot, "nemErtelmezheto");
  assert.equal(o.normalisnakJelolheto, false);
  assert.match(o.miert, /NEM „NEM TERHES”/);
});

test("szabály nélküli változónál a rendszer nem állít semmit", () => {
  const o = olvasat(undefined, "pregnancy.t3", "lab.hgb");
  assert.equal(o.allapot, "kuszobErvenyes");
  assert.match(o.miert, /nem mond semmit/);
});

test("a QRS-tengely balra tolódása a II–III. trimeszterben élettani", () => {
  assert.equal(olvasat(IDX.get("ekg.axis"), "pregnancy.t1", "ekg.axis").allapot, "kuszobErvenyes");
  assert.equal(olvasat(IDX.get("ekg.axis"), "pregnancy.t3", "ekg.axis").allapot, "kuszobErvenytelen");
});

test("a vérnyomás küszöbe NEM változik — a viszonyítási alap hiányzik", () => {
  const o = olvasat(IDX.get("vitals.bp.systolic"), "pregnancy.t2", "vitals.bp.systolic");
  assert.equal(o.allapot, "kuszobErvenyes");
  assert.match(o.miert, /II. trimeszterben élettanilag a legalacsonyabb/);
});

/* ── mWHO ────────────────────────────────────────────────────────────── */

const mind = () => true;
const semmi = () => false;

test("UGYANAZ A DIAGNÓZIS, KÉT OSZTÁLY: a tünet dönt", () => {
  const t = besorol(MWHO, "szivbeteg.asten.sulyos.tunetmentes", mind);
  const s = besorol(MWHO, "szivbeteg.asten.sulyos.tunetes", mind);
  assert.equal(t.osztaly?.jel, "III");
  assert.equal(s.osztaly?.jel, "IV");
});

test("A HIÁNYZÓ MÉRÉS NEM A KEDVEZŐBB OSZTÁLY", () => {
  const b = besorol(MWHO, "szivbeteg.ppcm.maradvannyal", semmi);
  assert.equal(b.allapot, "nemBesorolhato");
  assert.equal(b.osztaly, null);
  assert.deepEqual(b.hianyzoAdat, ["echo.lvef"]);
  assert.match(b.miert, /NEM sorolja be a kedvezőbb osztályba/);
});

test("a besorolás megnevezi, MI hiányzik", () => {
  const b = besorol(MWHO, "szivbeteg.turner.asi", (m) => m === "anthro.bsa");
  assert.deepEqual(b.hianyzoAdat, ["echo.aorta.atmero"]);
});

test("ismeretlen állapot nem „alacsony kockázat”", () => {
  const b = besorol(MWHO, "szivbeteg.nincs.ilyen", mind);
  assert.equal(b.allapot, "ismeretlenAllapot");
  assert.match(b.miert, /NEM „alacsony kockázat”/);
});

test("az aláíratlan tábla besorolása TÁJÉKOZTATÓ", () => {
  const b = besorol(MWHO, "szivbeteg.mvp.enyhe", mind);
  assert.equal(b.allapot, "besorolva");
  assert.equal(b.alairt, false);
  assert.match(b.miert, /ALÁÍRATLAN/);
});

test("A IV. OSZTÁLYNÁL AZ IRÁNYELV SZÖVEGE KÜLÖN MEZŐBEN ÁLL", () => {
  // Egy bekezdésbe öntve a felület az irányelv „a megszakítás megbeszélendő”
  // mondatát a rendszer állításának mutatná, és egy leolvasott mondatból
  // tanács lenne. Külön mezőben a felület KÉNYTELEN megkülönböztetni.
  const b = besorol(MWHO, "szivbeteg.pah", mind);
  assert.equal(b.javaslat, false);
  assert.doesNotMatch(b.miert, /megszakít|ellenjavallt/i);
  assert.match(b.iranyelvSzovege!, /ELLENJAVALLT/);
  assert.match(b.iranyelvSzovege!, /NEM MONDJA KI JAVASLATKÉNT/);
  assert.match(b.dontesGazdaja!, /a beteg/);
  assert.match(b.dontesGazdaja!, /terhesszív-csapattal/);
});

test("a besorolatlan eset nem kap sem irányelvszöveget, sem döntésgazdát", () => {
  const b = besorol(MWHO, "szivbeteg.ppcm.maradvannyal", semmi);
  assert.equal(b.iranyelvSzovege, null);
  assert.equal(b.dontesGazdaja, null);
  assert.equal(b.javaslat, false);
});

test("a legmagasabb osztályhoz mérés kell — kivéve, ahol a diagnózis maga elég", () => {
  const nemErtelmezheto = MWHO.allapotok.filter(
    (a) => a.osztaly === "mwho.IV" && !a.kellAdat.length);
  // Csak olyan maradhat, ahol a feltétel szó szerint „bármilyen”.
  assert.ok(nemErtelmezheto.every((a) => a.allapotFeltetel === "bármilyen"));
});

test("11 diagnózis több osztályban is szerepel — a szó önmagában kevés", () => {
  const m = kMerleg(MWHO, JELEK);
  assert.ok(m.tobbOsztalyuDiagnozis >= 10);
  assert.equal(m.allapot, MWHO.allapotok.length);
});

test("a validátor megfogja, ha ugyanaz a diagnózis megkülönböztethetetlen sorokba kerül", () => {
  const k: MwhoKeszlet = structuredClone(MWHO);
  k.allapotok.push({ ...k.allapotok.find((a) => a.id === "szivbeteg.asten.sulyos.tunetes")!,
    id: "szivbeteg.asten.masolat" });
  assert.ok(validateKardio(k, JELEK, ismert)
    .some((i) => i.severity === "error" && /nem különböznek egyértelműen/.test(i.message)));
});

test("a validátor megfogja, ha egy változóhoz két jel tartozik", () => {
  const j: KardioJelKeszlet = structuredClone(JELEK);
  j.jelek.push({ ...j.jelek[0], id: "kardio.masolat" });
  assert.ok(validateKardio(MWHO, j, ismert)
    .some((i) => i.severity === "error" && /két jel is tartozik/.test(i.message)));
});

test("a validátor megfogja a hiányzó kontextust — a hallgatás nem „használható”", () => {
  const j: KardioJelKeszlet = structuredClone(JELEK);
  delete (j.jelek[0].kuszobHasznalhato as Record<string, unknown>)["pregnancy.t2"];
  assert.ok(validateKardio(MWHO, j, ismert)
    .some((i) => i.severity === "error" && /csendes engedés/.test(i.message)));
});

test("a tiltás kötelező mező: nélküle a bejegyzés leírás, nem korlát", () => {
  const j: KardioJelKeszlet = structuredClone(JELEK);
  j.jelek[0].tiltas = "";
  assert.ok(validateKardio(MWHO, j, ismert)
    .some((i) => i.severity === "error" && /leírás marad, nem korlát/.test(i.message)));
});

/* ── PERIPARTALIS CARDIOMYOPATHIA ───────────────────────────────────── */

test("a NEM MÉRT kamrafunkció nem jó szív", () => {
  const i = ppcmGyanu({ ktx: "postpartum.korai", lvef: null,
    korabbiSzivbetegseg: false, tunetek: ["nehézlégzés", "lábdagadás"] });
  assert.equal(i.allapot, "kamrafunkcioIsmeretlen");
  assert.equal(i.echoIndokolt, true);
  assert.match(i.miert, /NEM MÉRT szív/);
});

test("a rögzítetlen tünet sem „nincs tünet”", () => {
  const i = ppcmGyanu({ ktx: "postpartum.kesoi", lvef: null,
    korabbiSzivbetegseg: false, tunetek: [] });
  assert.equal(i.allapot, "kamrafunkcioIsmeretlen");
  assert.match(i.miert, /nem „nincs tünet”/);
});

test("csökkent kamrafunkció az ablakban: gyanú", () => {
  const i = ppcmGyanu({ ktx: "postpartum.korai", lvef: 32,
    korabbiSzivbetegseg: false, tunetek: [] });
  assert.equal(i.allapot, "gyanu");
  assert.equal(i.echoIndokolt, true);
});

test("kizárásos diagnózis: ismert szívbetegség mellett nem PPCM — de nem is semmi", () => {
  const i = ppcmGyanu({ ktx: "postpartum.korai", lvef: 30,
    korabbiSzivbetegseg: true, tunetek: ["nehézlégzés"] });
  assert.equal(i.allapot, "masSzivbetegseg");
  assert.equal(i.echoIndokolt, true);
  assert.match(i.miert, /rosszabbodását/);
});

test("az ablakon kívül a gyanú nem áll fenn — de más szívbetegség igen", () => {
  const i = ppcmGyanu({ ktx: "pregnancy.t1", lvef: null,
    korabbiSzivbetegseg: false, tunetek: [] });
  assert.equal(i.allapot, "ablakonKivul");
  assert.match(i.miert, /NEM zárja ki/);
});

/* ── A GYERMEKÁGYI ÁTADÁS ───────────────────────────────────────────── */

test("magas kockázati osztály, kardiológiai időpont nélkül: nyitott rés", () => {
  const i = kardioRes("mwho.III", 5, false);
  assert.equal(i.res, true);
  assert.match(i.miert, /senki nem birtokolja/);
});

test("rögzített időpont zárja a rést", () => {
  assert.equal(kardioRes("mwho.IV", 5, true).res, false);
});

test("besorolás nélkül a rés nem „nem kell”", () => {
  const i = kardioRes(null, 5, false);
  assert.equal(i.res, false);
  assert.match(i.miert, /NEM „nem kell”/);
});

/* ── PALLIATÍV: A KÉT FAJTA ─────────────────────────────────────────── */

const dosszie = (r: Partial<Dosszie> = {}): Dosszie => ({
  fajta: "pall.felnott", caseId: "eset-1",
  celok: [{ cel: "cel.ujraelesztes", dontes: "visszautasitja",
            kimondta: "Nagy Éva dr.", mikor: MOST, miert: "a beteg kérése" }],
  elozetesRendelkezes: null, terhes: false, ...r,
});

test("a két fajta ellentétes szerkezetű, és mindkettőnek léteznie kell", () => {
  const f = PALL.fajtak;
  assert.equal(f.length, 2);
  const fel = f.find((x) => x.id === "pall.felnott")!;
  const per = f.find((x) => x.id === "pall.perinatalis")!;
  assert.match(fel.kiHaldoklik, /a beteg/);
  assert.match(per.kiHaldoklik, /NEM a beteg/);
});

test("ha az egyik fajta hiányzik, a másik lesz „a” palliatív ellátás", () => {
  const k: PalliativKeszlet = structuredClone(PALL);
  k.fajtak = k.fajtak.filter((f) => f.id !== "pall.perinatalis");
  assert.ok(validatePalliativ(k)
    .some((i) => i.severity === "error" && /legsúlyosabb hibája/.test(i.message)));
});

test("A LEGSÚLYOSABB HIBA: anyai ellátási cél perinatális dossziéban", () => {
  const d = dosszie({ fajta: "pall.perinatalis", terhes: true });
  const i = dosszieVizsgal(d, PALL, MOST);
  assert.ok(i.allapotok.includes("anyaiCelPerinatalisban"));
  assert.equal(i.hasznalhato, false);
  assert.match(i.uzenetek.join(" "), /az ANYA NEM/);
});

test("perinatális dosszié perinatális célokkal rendben van", () => {
  const d = dosszie({ fajta: "pall.perinatalis", terhes: true,
    celok: [{ cel: "cel.csaszarmetszes", dontes: "visszautasitja",
              kimondta: "a szülők, Kiss Anna dr. jelenlétében", mikor: MOST,
              miert: "letális rendellenesség, anyai kockázat magzati haszon nélkül" }] });
  const i = dosszieVizsgal(d, PALL, MOST);
  assert.deepEqual(i.allapotok, []);
  assert.equal(i.hasznalhato, true);
});

test("a császármetszés KÜLÖN, kimondott döntés — nem sodródás", () => {
  const c = PALL.ellatasiCelok.find((x) => x.id === "cel.csaszarmetszes")!;
  assert.match(c.leiras, /ANYAI kockázat/);
  assert.match(c.leiras, /nem következhet sodródásból/i);
});

test("az ellátási cél nem kétállású: nyolc külön felnőtt döntés", () => {
  const m = pMerleg(PALL);
  assert.ok(m.felnottCel >= 8);
  assert.ok(m.perinatalisCel >= 5);
  // Az antibiotikum és a transzfúzió nem ugyanaz a kérdés, mint az újraélesztés.
  for (const id of ["cel.ujraelesztes", "cel.intubalas", "cel.antibiotikum", "cel.transzfuzio"]) {
    assert.ok(PALL.ellatasiCelok.some((c) => c.id === id), id);
  }
});

test("„a család” nem cselekvő: a döntéshez név kell", () => {
  const d = dosszie({ celok: [{ cel: "cel.ujraelesztes", dontes: "visszautasitja",
    kimondta: null, mikor: MOST, miert: null }] });
  const i = dosszieVizsgal(d, PALL, MOST);
  assert.ok(i.allapotok.includes("nevtelen"));
});

test("a „megbeszéletlen” érvényes állapot, de nem vezethető belőle ellátás", () => {
  const d = dosszie({ celok: [{ cel: "cel.ujraelesztes", dontes: "megNemBeszelt",
    kimondta: null, mikor: null, miert: null }] });
  const i = dosszieVizsgal(d, PALL, MOST);
  assert.ok(i.allapotok.includes("megNemBeszelt"));
  assert.equal(i.hasznalhato, false);
  assert.match(i.uzenetek.join(" "), /nem helyettesíti a beszélgetést/);
});

/* ── PALLIATÍV: A JOGI HATÁR ────────────────────────────────────────── */

test("terhesség mellett rögzített életfenntartó visszautasítás: JELZÉS, nem döntés", () => {
  const d = dosszie({ terhes: true });
  const i = dosszieVizsgal(d, PALL, MOST);
  assert.ok(i.allapotok.includes("jogiMegitelestKivan"));
  const u = i.uzenetek.join(" ");
  assert.match(u, /NEM a rendszeré/);
  assert.match(u, /orvosi jóslat, nem adat/);
  assert.match(u, /nem érvényteleníti/);
});

test("A GÉP NEM ÉRVÉNYTELENÍT: a dosszié ettől használható marad", () => {
  const i = dosszieVizsgal(dosszie({ terhes: true }), PALL, MOST);
  assert.equal(i.hasznalhato, true);
});

test("minden jogi feltételnél ki van mondva, hol áll meg a gép", () => {
  const m = pMerleg(PALL);
  assert.equal(m.gepiHatarral, m.jogiFeltetel);
  const k: PalliativKeszlet = structuredClone(PALL);
  k.jogiFeltetelek[0].gepiHatar = "";
  assert.ok(validatePalliativ(k)
    .some((i) => /gép nem érvényteleníthet/.test(i.message)));
});

test("az ellenőrizetlen alakiságú előzetes rendelkezés nem „rendben”", () => {
  const d = dosszie({ elozetesRendelkezes: { van: true, alakisagEllenorizve: null } });
  const i = dosszieVizsgal(d, PALL, MOST);
  assert.match(i.uzenetek.join(" "), /„nem tudjuk” itt sem „rendben van”/);
});

/* ── PALLIATÍV: AZ ÁTADÁSI RÉSEK ────────────────────────────────────── */

const atadas = (id: string) => PALL.atadasok.find((a) => a.id === id)!;

test("onkológia → hospice: a mért rés", () => {
  const i = atadasiRes(atadas("atadas.onkologia.hospice"),
    "2026-08-01T00:00:00Z", null, MOST, 14);
  assert.equal(i.nyitva, true);
  assert.equal(i.eltelNap, 38);
});

test("a megtörtént átadás zárja a rést", () => {
  const i = atadasiRes(atadas("atadas.szuloszoba.gyasz"),
    "2026-08-01T00:00:00Z", "2026-08-08T00:00:00Z", MOST, 14);
  assert.equal(i.nyitva, false);
  assert.equal(i.eltelNap, 7);
});

test("kiindulási esemény nélkül a rés nem mérhető — de nem is „nincs”", () => {
  const i = atadasiRes(atadas("atadas.kovetkezo.terhesseg"), null, null, MOST, 14);
  assert.equal(i.nyitva, false);
  assert.match(i.miert, /NEM azt jelenti, hogy nincs rés/);
});

test("a küszöbön belül az ablak nyitva van, de nem lejárt", () => {
  const i = atadasiRes(atadas("atadas.onkologia.hospice"),
    "2026-09-01T00:00:00Z", null, MOST, 14);
  assert.equal(i.nyitva, false);
  assert.match(i.miert, /nem lejárt/);
});

/* ── A VÁLTOZÓK ─────────────────────────────────────────────────────── */

test("a kardiológiai változók bekerültek a regiszterbe", () => {
  for (const id of ["lab.troponin.hs", "lab.ntprobnp", "cardio.nyha", "echo.lvef",
                    "echo.aorta.atmero", "echo.pap", "cardio.mwho"]) {
    assert.ok(IDK.has(id), id);
  }
});

test("a NYHA a TERHESSÉG ELŐTTI állapothoz viszonyítva értelmes", () => {
  const v = REG.all().find((x) => x.id === "cardio.nyha")!;
  assert.match(v.documentation!.pitfalls!.hu!, /TERHESSÉGBEN A BESOROLÁS ELCSÚSZIK/);
});

test("a troponin buktatója kimondja, hogy a D-dimer tükörképe", () => {
  const v = REG.all().find((x) => x.id === "lab.troponin.hs")!;
  assert.match(v.documentation!.pitfalls!.hu!, /TÜKÖRKÉPE/);
});
