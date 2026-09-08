/**
 * VÉDŐNŐI MODUL — a naptár, az egyezés, az audiogram és az értesítés.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  egyezes, egyezesMerleg, loadKerdoivek, naptar, naptarMerleg, validateKerdoivek,
} from "../core/vedono/szures.ts";
import {
  besorol, beszedAtlag, loadAudiogram, savokAlairva, svg, validateAudiogram,
} from "../core/vedono/hallas.ts";
import {
  ertesitesAllas, ertesitesMerleg, keresIrsz, korzethez, kozeliKodok, loadJegyzek,
  loadKorzet, validateKorzet, type Jegyzek,
} from "../core/vedono/korzet.ts";
import {
  allas as oltasAllas, evfolyam, loadOltasok, merleg as oltasMerleg, naptarKapu,
  lenyeg as oltasLenyeg, lenyomat as oltasLenyomat, validateOltasok,
} from "../core/vedono/oltas.ts";
import { existsSync } from "node:fs";

const K = () => loadKerdoivek("registry/vedono/kerdoivek.json");
const A = () => loadAudiogram("registry/vedono/audiogram.json");
const KZ = () => loadKorzet("registry/vedono/korzet.json");

/* ══ 1. A JOGSZABÁLYI NAPTÁR ═══════════════════════════════════════════ */

test("tizenhat szűrési időpont, 1 hónapostól 7 éves korig", () => {
  const k = K();
  assert.equal(k.ivek.length, 16);
  assert.deepEqual(k.ivek.map((i) => i.honap),
    [1, 2, 3, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60, 72, 84]);
  // ÉS EGY TALÁLAT A FORRÁSBAN: két űrlap hivatkozása hiányos. Az 5 éveseké
  // egyáltalán nem tartalmaz jogszabályhelyet, a 7 éveseké csak a 49/2004-et
  // idézi, a 4.§ b) / 8.§-t nem. Ez nem a beolvasó hibája — a kiadott
  // dokumentumban van így —, de a validálás kimondja, mert egy jogszabályi
  // melléklet, ami nem nevezi meg a jogszabályt, utólag nem visszakereshető.
  const hianyos = k.ivek.filter((i) => !i.jogszabaly?.includes("51/1997"));
  assert.deepEqual(hianyos.map((i) => i.honap), [60, 84]);
  assert.equal(hianyos.filter((i) => i.jogszabaly === null).length, 1);
  const w = validateKerdoivek(k).filter((i) => i.id.endsWith(".jogszabaly"));
  assert.equal(w.length, 1, "a teljesen hiányzó hivatkozás figyelmeztetést kap");
});

test("a 3 hónapos szűrésnek NINCS szülői kérdőíve — és ez nem hiba", () => {
  // Az űrlap kimondja: „(Tartalma: Védőnői szűrővizsgálat)". Ha a beolvasó
  // kihagyná, egy jogszabályi szűrési időpont esne ki a naptárból.
  const h = K().ivek.find((i) => i.honap === 3)!;
  assert.equal(h.vanKerdoiv, false);
  assert.equal(h.kerdesek.length, 0);
  assert.ok(h.szakaszok.length > 0, "védőnői vizsgálati szakaszai viszont vannak");
  assert.equal(validateKerdoivek(K()).filter((i) => i.severity === "error").length, 0);
});

test("AZ ESEDÉKES, BE NEM JEGYZETT LÁTOGATÁS MAGA A JEL", () => {
  const k = K();
  const s = naptar(k, 7, [{ iv: k.ivek[0].id, allapot: "megtortent" }]);
  const m = naptarMerleg(s);
  assert.equal(m.megtortent, 1);
  assert.equal(m.hianyzik, 4, "2, 3, 4 és 6 hónapos szűrés esedékes volt");
  assert.equal(m.jel, true);
  assert.match(s.find((x) => x.iv.honap === 2)!.miert, /gyermekvédelem legkorábbi\s+jelzője/);
});

test("a megnevezett okkal ELMARADT látogatás nem ugyanaz, mint a hiányzó", () => {
  const k = K();
  const s = naptar(k, 7, [{ iv: k.ivek[1].id, allapot: "elmaradt", indok: "elköltöztek" }]);
  const kettes = s.find((x) => x.iv.honap === 2)!;
  assert.equal(kettes.allapot, "elmaradt");
  assert.equal(kettes.indok, "elköltöztek");
  assert.equal(naptarMerleg(s).hianyzik, 4, "az 1, 3, 4 és 6 hónapos maradt bejegyzés nélkül");
});

test("a türelmi idő alatt még nem jel", () => {
  const k = K();
  assert.equal(naptarMerleg(naptar(k, 1, [])).hianyzik, 0, "1 hónaposan még nincs késés");
  assert.equal(naptarMerleg(naptar(k, 2.5, [])).hianyzik, 1, "az 1 hónapos viszont kicsúszott");
});

/* ══ 2. AZ EGYEZÉS-ELLENŐRZÉS — MÁR A JOGSZABÁLYI ŰRLAPON ══════════════ */

test("a szülő válasza HÁROMÉRTÉKŰ, és a „Még nem” nem „nem”", () => {
  const k = K();
  assert.deepEqual(k.skala.map((s) => s.kod), ["rendszeresen", "neha", "megNem"]);
  assert.equal(k.vedonoiEgyezes.kerdes, "Védőnői tapasztalat: ugyanaz?");
});

test("AZ ELTÉRÉS MAGA A LELET — nem kell eldönteni, melyik igaz", () => {
  const iv = K().ivek[0];
  const e = egyezes(iv, [{ sorszam: 1, szulo: "rendszeresen", vedonoiEgyezes: false }]);
  const s = e.find((x) => x.sorszam === 1)!;
  assert.equal(s.allapot, "elter");
  assert.match(s.miert, /nem kell eldönteni, melyik igaz/);
});

test("a védőnői észlelés hiánya külön állapot — az egyezés-ellenőrzés elmarad", () => {
  const iv = K().ivek[0];
  const e = egyezes(iv, [{ sorszam: 1, szulo: "neha" }]);
  assert.equal(e[0].allapot, "vedonoiEszlelesNelkul");
  assert.match(e[0].miert, /az űrlapon ez külön oszlop/i);
});

test("a lelet csak akkor teljes, ha minden kérdésnél VAN védőnői észlelés is", () => {
  const iv = K().ivek[0];
  const teljes = iv.kerdesek.map((q) => ({
    sorszam: q.sorszam, szulo: "rendszeresen" as const, vedonoiEgyezes: true }));
  const m = egyezesMerleg(egyezes(iv, teljes));
  assert.equal(m.teljes, true);
  assert.equal(m.egyezik, iv.kerdesek.length);

  const felig = teljes.slice(0, -1);
  assert.equal(egyezesMerleg(egyezes(iv, felig)).teljes, false);
});

/* ══ 3. AZ AUDIOGRAM ═══════════════════════════════════════════════════ */

test("11 frekvencia, és mind a négy beszédfrekvencia mérve van", () => {
  const k = A();
  assert.equal(k.frekvenciak.length, 11);
  assert.deepEqual(k.beszedFrekvenciak, [500, 1000, 2000, 4000]);
  assert.equal(validateAudiogram(k).filter((i) => i.severity === "error").length, 0);
});

test("HIÁNYZÓ BESZÉDFREKVENCIÁNÁL NINCS RÉSZÁTLAG", () => {
  const k = A();
  const a = beszedAtlag(k, { ful: "jobb", kuszobok: [
    { frekvencia: 500, db: 10 }, { frekvencia: 1000, db: 15 },
    { frekvencia: 2000, db: 20 }] });
  assert.equal(a.atlagDb, null);
  assert.deepEqual(a.hianyzo, [4000]);
  assert.match(a.miert, /a kimaradó frekvencia gyakran a legrosszabb/);
});

test("A RAJZ LEÍRÁS, A BESOROLÁS ÁLLÍTÁS — aláírás nélkül nincs besorolás", () => {
  const k = A();
  assert.equal(savokAlairva(k), false);
  const b = besorol(k, { ful: "jobb", kuszobok: [
    { frekvencia: 500, db: 30 }, { frekvencia: 1000, db: 35 },
    { frekvencia: 2000, db: 40 }, { frekvencia: 4000, db: 45 }] });
  assert.equal(b.allapot, "savokAlairatlan");
  assert.equal(b.sav, null);
  assert.equal(b.atlagDb, 37.5, "az ÁTLAG attól még kiszámolható");
  assert.match(b.miert, /állításhoz aláírás kell/);
});

test("aláírás után születik besorolás", () => {
  const k = A();
  k.hitelesitesek.push({ ki: "dr. Fül-orr-gégész", mikor: "2026-09-08" });
  const b = besorol(k, { ful: "bal", kuszobok: [
    { frekvencia: 500, db: 10 }, { frekvencia: 1000, db: 15 },
    { frekvencia: 2000, db: 20 }, { frekvencia: 4000, db: 25 }] });
  assert.equal(b.allapot, "besorolva");
  assert.equal(b.atlagDb, 17.5);
  assert.equal(b.sav, "ep");
});

test("a diagram a NEMZETKÖZI EGYEZMÉNYT követi: jobb=kör, bal=kereszt", () => {
  const k = A();
  const s = svg(k, [
    { ful: "jobb", kuszobok: [{ frekvencia: 500, db: 20 }, { frekvencia: 1000, db: 25 }] },
    { ful: "bal", kuszobok: [{ frekvencia: 500, db: 10 }, { frekvencia: 1000, db: 15 }] }]);
  assert.match(s, /<circle/, "jobb fül: kör");
  assert.match(s, /ag-j\{stroke:#c02026/, "jobb fül: piros");
  assert.match(s, /ag-b\{stroke:#1b4fa8/, "bal fül: kék");
  assert.match(s, /Jobb fül \(O, piros\)/, "a jelmagyarázat a jelet is megnevezi");
  // A dB-TENGELY LEFELÉ NŐ: a rosszabb hallás lejjebb van.
  const y0 = /cy="([\d.]+)"/.exec(s.slice(s.indexOf("ag-j")))?.[1];
  assert.ok(y0, "van kirajzolt pont");
});

test("a dB-tengely iránya: nagyobb dB → lejjebb", () => {
  const k = A();
  const jo = svg(k, [{ ful: "jobb", kuszobok: [{ frekvencia: 1000, db: 0 }] }]);
  const rossz = svg(k, [{ ful: "jobb", kuszobok: [{ frekvencia: 1000, db: 80 }] }]);
  const yJo = Number(/circle cx="[\d.]+" cy="([\d.]+)"/.exec(jo)![1]);
  const yRossz = Number(/circle cx="[\d.]+" cy="([\d.]+)"/.exec(rossz)![1]);
  assert.ok(yRossz > yJo, "a 80 dB-es küszöb LEJJEBB van, mint a 0 dB-es");
});

/* ══ 4. A KÖRZETI ÉRTESÍTÉS ════════════════════════════════════════════ */

test("lakcím nélkül nincs körzet — és nincs kinek szólni", () => {
  const i = korzethez(KZ(), null, null);
  assert.equal(i.allapot, "lakcimNelkul");
  assert.match(i.miert, /a lakcímhez tartozik, nem az esethez/);
});

test("a hazaadási értesítés KÖTELEZŐ, és az elmaradása nem adminisztratív", () => {
  const k = KZ();
  const h = k.ertesitesek.find((e) => e.mikor === "hazaadas")!;
  assert.equal(h.kotelezo, true);
  assert.equal(validateKorzet(k).filter((i) => i.id === "vedono.ertesites.hazaadas").length, 0);
});

test("MA egyetlen körzet sincs nyilvántartva — így egyetlen értesítésnek sincs címzettje", () => {
  const k = KZ();
  const korzet = korzethez(k, "Szeged, Fő u. 1.", "K-001");
  assert.equal(korzet.allapot, "ismeretlenKorzet");
  const a = ertesitesAllas(k, ["szuletes", "hazaadas"], [], korzet);
  const m = ertesitesMerleg(a);
  assert.equal(m.cimzettNelkul, 2);
  assert.equal(m.rendben, false);
  assert.match(a.find((x) => x.pont.mikor === "hazaadas")!.miert, /a körzet megállapítása is feladat/);
});

test("ismert körzettel a kötelező értesítés elmaradása MEGNEVEZETT hiba", () => {
  const k = KZ();
  k.korzetek.push({ azonosito: "K-001", vedonoNeve: "Kovács Anna",
    szolgalat: "Szegedi Védőnői Szolgálat" });
  const korzet = korzethez(k, "Szeged, Fő u. 1.", "K-001");
  assert.equal(korzet.allapot, "megvan");

  const a = ertesitesAllas(k, ["hazaadas"], [], korzet);
  const h = a.find((x) => x.pont.mikor === "hazaadas")!;
  assert.equal(h.allapot, "elmaradt");
  assert.match(h.miert, /egy\s+újszülöttet nem keres fel senki/);

  const kuldve = ertesitesAllas(k, ["hazaadas"],
    [{ esemeny: "hazaadas", elkuldve: "2026-09-08T10:00:00Z" }], korzet);
  assert.equal(kuldve.find((x) => x.pont.mikor === "hazaadas")!.allapot, "elkuldve");
});

test("a védőnő-kereső gépi használata ADATVÉDELMI döntés, nem fejlesztési", () => {
  const w = validateKorzet(KZ()).filter((i) => i.id === "vedono.kereso");
  assert.equal(w.length, 1);
  assert.match(w[0].message, /a beteg LAKCÍMÉT viszi ki egy külső szolgáltatáshoz/);
});

/* ══ 5. AZ ORSZÁGOS SZOLGÁLATJEGYZÉK ═══════════════════════════════════ */

const JEGYZEK = "registry/vedono/helyi/szolgalatok.json";
const vanJegyzek = existsSync(JEGYZEK);
/** A jegyzék helyben települ (gitignore-olt), ezért a tesztek szintetikusak. */
const J = (over: Partial<Jegyzek> = {}): Jegyzek => ({
  megnevezes: "teszt", forras: "teszt", szolgalat: 0, betoltetlen: 0,
  iranyitoszam: 0, csakBetoltetlenIrsz: [],
  szolgalatok: [
    { irsz: "6721", telepules: "Szeged", cim: "Fő u. 1.", vedono: "Kovács Anna",
      betoltetlen: false, tipus: "Területi", szolgaltato: "X", finanszirozasiKod: "1", varmegye: "Csongrád" },
    { irsz: "6721", telepules: "Szeged", cim: "Kossuth u. 2.", vedono: "Nagy Éva",
      betoltetlen: false, tipus: "Vegyes", szolgaltato: "X", finanszirozasiKod: "2", varmegye: "Csongrád" },
    { irsz: "6722", telepules: "Szeged", cim: "Petőfi u. 3.", vedono: "Tóth Mária",
      betoltetlen: false, tipus: "Területi", szolgaltato: "X", finanszirozasiKod: "3", varmegye: "Csongrád" },
    { irsz: "6800", telepules: "Hódmezővásárhely", cim: "Ady u. 4.", vedono: null,
      betoltetlen: true, tipus: "Területi", szolgaltato: "Y", finanszirozasiKod: "4", varmegye: "Csongrád" },
  ],
  ...over,
});

test("EGYETLEN betöltött szolgálat → egyértelmű címzett", () => {
  const r = keresIrsz(J(), "6722");
  assert.equal(r.allapot, "pontos");
  assert.equal(r.egyertelmu, true);
  assert.equal(r.talalatok[0].vedono, "Tóth Mária");
});

test("AZ IRÁNYÍTÓSZÁM HALMAZT JELÖL, NEM SZEMÉLYT", () => {
  const r = keresIrsz(J(), "6721");
  assert.equal(r.allapot, "pontos");
  assert.equal(r.talalatok.length, 2);
  assert.equal(r.egyertelmu, false, "két szolgálat — a címzettet ki kell választani");
  assert.match(r.miert, /a körzetet az utca dönti el/);
});

test("A BETÖLTETLEN ÁLLÁS NEM CÍMZETT — és ez nem ismeretlen körzet", () => {
  const r = keresIrsz(J(), "6800");
  assert.equal(r.allapot, "betoltetlen");
  assert.ok(r.talalatok.every((s) => !s.betoltetlen), "csak betöltött szolgálatot ajánl");
  assert.match(r.miert, /ugyanaz, mint az elmaradt/);
  assert.match(r.miert, /a hiányt be kell jelenteni/);
});

test("ismeretlen irányítószám → a KÉT legközelebbi kód, megnevezett bizonytalansággal", () => {
  const r = keresIrsz(J(), "6720");
  assert.equal(r.allapot, "kozeli");
  assert.deepEqual(r.kozeliIrsz, ["6721", "6722"]);
  assert.equal(r.egyertelmu, false);
  assert.match(r.miert, /nem feltétlenül a FÖLDRAJZILAG legközelebbi/);
  assert.match(r.miert, /nem „a körzeti védőnő”/);
});

test("a legközelebbi kódok közé BETÖLTETLEN szolgálat nem kerül", () => {
  // 6800 betöltetlen, ezért a 6799-hez nem őt ajánljuk.
  assert.ok(!kozeliKodok(J(), "6799", 2).includes("6800"));
});

test("irányítószám nélkül nincs keresés", () => {
  for (const x of [null, "", "abc", "123"]) {
    assert.equal(keresIrsz(J(), x).allapot, "irszNelkul");
  }
});

test("üres jegyzéknél a rendszer nem találgat", () => {
  const r = keresIrsz(J({ szolgalatok: [] }), "6721");
  assert.equal(r.allapot, "jegyzekNelkul");
  assert.equal(r.talalatok.length, 0);
});

test("a telepített országos jegyzék mérete és állapota", { skip: !vanJegyzek }, () => {
  const j = loadJegyzek(JEGYZEK);
  // ISKOLAI SZOLGÁLAT NEM MEHET ÚJSZÜLÖTTHÖZ.
  assert.ok(j.szolgalatok.every((s) => s.tipus === "Területi" || s.tipus === "Vegyes"));
  // A `vedono: null` és a `betoltetlen` együtt jár.
  assert.ok(j.szolgalatok.every((s) => s.betoltetlen === (s.vedono === null)));
  assert.ok(j.csakBetoltetlenIrsz.length > 0,
    "vannak irányítószámok, ahol egyetlen betöltött szolgálat sincs");
});

/* ══ 6. VÉDŐOLTÁSOK ════════════════════════════════════════════════════ */

const O = () => loadOltasok("registry/vedono/oltasok.json");
/** Csecsemő: 20 hónapos, iskolába még nem jár. */
const CSECSEMO = { korHonap: 20 };
/** Hetedikes: a számláló mondja meg, nem az életkor. */
const HETEDIKES = { korHonap: 158, iskola: { beiratkozasTanev: 2032, mostaniTanev: 2038 } };

test("az oltási naptár ALÁÍRATLAN — és nem ad esedékességet", () => {
  const g = naptarKapu(O());
  assert.equal(g.allapot, "alairatlan");
  assert.equal(g.adItel, false);
  assert.match(g.miert, /egy IDŐPONT csúszik\s+el/);
});

test("az aláírás a NAPTÁR MAGJÁHOZ köt — a rend változása elavulttá teszi", () => {
  const k = O();
  k.hitelesitesek.push({ ki: "dr. Oltóorvos", mikor: "2026-09-08",
    lenyomat: oltasLenyomat(oltasLenyeg(k)) });
  assert.equal(naptarKapu(k).allapot, "alairt");
  // A Módszertani levél új kiadása egy időpontot arrébb tesz:
  const mmr = k.naptar.find((o) => o.oltas === "MMR (1.)")!;
  assert.equal(mmr.utemezes, "folyamatos");
  if (mmr.utemezes === "folyamatos") mmr.korHonap = "13";
  assert.equal(naptarKapu(k).allapot, "elavult");
  assert.match(naptarKapu(k).miert, /évente új kiadást kap/);
});

test("az ÜTEMEZÉS MÓDJA is a maghoz tartozik — évfolyamból életkor: elavult", () => {
  const k = O();
  k.hitelesitesek.push({ ki: "dr. Oltóorvos", mikor: "2026-09-08",
    lenyomat: oltasLenyomat(oltasLenyeg(k)) });
  const i = k.naptar.findIndex((o) => o.oltas === "HPV");
  k.naptar[i] = { id: "olt.hpv.k7", utemezes: "folyamatos", korHonap: "156",
    oltas: "HPV", tipus: "ajanlott" };
  assert.equal(naptarKapu(k).allapot, "elavult",
    "a kampányoltás életkorhoz kötése MÁS oltási rend, nem átfogalmazás");
});

test("az IDŐKÖZ-SZABÁLY is a maghoz tartozik", () => {
  const k = O();
  k.hitelesitesek.push({ ki: "dr. Oltóorvos", mikor: "2026-09-08",
    lenyomat: oltasLenyomat(oltasLenyeg(k)) });
  k.idokozok.find((x) => x.id === "ik.elo_elo")!.napMin = 14;
  assert.equal(naptarKapu(k).allapot, "elavult");
});

/* ── AZ ÉVFOLYAM-SZÁMLÁLÓ ────────────────────────────────────────────── */

test("az évfolyam SZÁMLÁLÓBÓL jön, nem életkorból", () => {
  const e = evfolyam({ beiratkozasTanev: 2032, mostaniTanev: 2038 });
  assert.equal(e.evfolyam, 7);
  assert.equal(e.honnan, "szamolt");
  assert.match(e.miert, /Számlálóból, nem életkorból/);
});

test("BEIRATKOZÁS NÉLKÜL az évfolyam ELDÖNTHETETLEN — nem pótoljuk életkorból", () => {
  const e = evfolyam(undefined);
  assert.equal(e.evfolyam, null);
  assert.equal(e.honnan, "nincs");
  assert.match(e.miert, /5–7 éves kor közé esik/);

  const fel = evfolyam({ mostaniTanev: 2038 });
  assert.equal(fel.evfolyam, null, "fél számláló nem számláló");
});

test("a lehetetlen évfolyam nem évfolyam", () => {
  const e = evfolyam({ beiratkozasTanev: 2038, mostaniTanev: 2032 });
  assert.equal(e.evfolyam, null);
  assert.equal(e.honnan, "ertelmetlen");
});

test("a rögzített évfolyam ERŐSEBB a számlálónál", () => {
  const e = evfolyam({ rogzitettEvfolyam: 5, beiratkozasTanev: 2032, mostaniTanev: 2038 });
  assert.equal(e.evfolyam, 5);
  assert.equal(e.honnan, "rogzitett");
});

test("ÉVFOLYAM NÉLKÜL a kampányoltás se nem esedékes, se nem elmaradt", () => {
  // Ugyanaz a 13 éves gyerek, kétféle iskolai állással.
  const nincs = oltasAllas(O(), { korHonap: 158 }, []);
  const hpv = nincs.find((x) => x.pont.oltas === "HPV")!;
  assert.equal(hpv.allapot, "evfolyamIsmeretlen");
  assert.match(hpv.miert, /eldönthetetlen/);

  const van = oltasAllas(O(), HETEDIKES, []);
  assert.equal(van.find((x) => x.pont.oltas === "HPV")!.allapot, "hianyzik",
    "a számlálóval már eldönthető — és esedékes volt");
});

test("EGY ÉV KÜLÖNBSÉG, MÁS OLTÁS — hatodikos és hetedikes ugyanannyi idősen", () => {
  const kor = 158;
  const hatodikos = oltasAllas(O(), { korHonap: kor,
    iskola: { rogzitettEvfolyam: 6 } }, []);
  const hetedikes = oltasAllas(O(), { korHonap: kor,
    iskola: { rogzitettEvfolyam: 7 } }, []);
  const a = (s: typeof hatodikos, n: string) => s.find((x) => x.pont.oltas === n)!.allapot;

  assert.equal(a(hatodikos, "Hepatitis B (sorozatoltás)"), "megNemEsedekes");
  assert.equal(a(hetedikes, "Hepatitis B (sorozatoltás)"), "hianyzik");
  assert.equal(a(hatodikos, "dTap (emlékeztető)"), "hianyzik");
  assert.equal(a(hetedikes, "dTap (emlékeztető)"), "hianyzik");
});

test("aki feltehetően SOSEM ÉRI EL a kijelölt évfolyamot, alsóbb évfolyamon is oltandó", () => {
  const s = oltasAllas(O(), { korHonap: 150,
    iskola: { rogzitettEvfolyam: 5, sosemEriEl: true } }, []);
  const hep = s.find((x) => x.pont.oltas === "Hepatitis B (sorozatoltás)")!;
  assert.equal(hep.allapot, "hianyzik");
  assert.match(hep.miert, /sosem éri el/);
});

/* ── A BEJEGYZÉSEK ───────────────────────────────────────────────────── */

test("A MEGTAGADÁS KÜLÖN ÁLLAPOT, és kötelező oltásnál JELENTENDŐ", () => {
  const k = O();
  const s = oltasAllas(k, CSECSEMO, [{ oltas: "MMR (1.)", allapot: "elutasitva" }]);
  const mmr = s.find((x) => x.pont.oltas === "MMR (1.)")!;
  assert.equal(mmr.allapot, "elutasitva");
  assert.equal(mmr.jelentendo, true);
  assert.match(mmr.miert, /JELENTÉSI KÖTELEZETTSÉGGEL/);

  // AJÁNLOTT oltásnál (HPV) ugyanez NEM jár jogkövetkezménnyel.
  const h = oltasAllas(k, HETEDIKES, [{ oltas: "HPV", allapot: "elutasitva" }])
    .find((x) => x.pont.oltas === "HPV")!;
  assert.equal(h.jelentendo, false);
  assert.match(h.miert, /nem jelentendő/);
});

test("BEADVA TÉTELSZÁM NÉLKÜL — visszahívásnál megtalálhatatlan", () => {
  const n = "PCV (alapimmunizálás 1.)";
  const s = oltasAllas(O(), CSECSEMO, [{ oltas: n, allapot: "beadva", mikor: "2026-01-01" }]);
  const p = s.find((x) => x.pont.oltas === n)!;
  assert.equal(p.allapot, "beadvaTetelszamNelkul");
  assert.match(p.miert, /amikor már késő/);

  const jo = oltasAllas(O(), CSECSEMO, [{ oltas: n, allapot: "beadva",
    mikor: "2026-01-01", tetelszam: "P-9912" }]);
  assert.equal(jo.find((x) => x.pont.oltas === n)!.allapot, "beadva");
});

test("HALASZTÁS ÚJ IDŐPONT NÉLKÜL nem halasztás", () => {
  const s = oltasAllas(O(), CSECSEMO, [{ oltas: "MMR (1.)", allapot: "halasztva", indok: "lázas" }]);
  const p = s.find((x) => x.pont.oltas === "MMR (1.)")!;
  assert.equal(p.allapot, "halasztvaIdopontNelkul");
  assert.match(p.miert, /csak\s+megnyugtatóbban néz ki/);

  const jo = oltasAllas(O(), CSECSEMO, [{ oltas: "MMR (1.)", allapot: "halasztva",
    indok: "lázas", ujIdopont: "2026-10-01" }]);
  assert.equal(jo.find((x) => x.pont.oltas === "MMR (1.)")!.allapot, "halasztva");
});

test("az ÁTESETT külön állapot — varicellánál nem mulasztás", () => {
  const s = oltasAllas(O(), CSECSEMO, [{ oltas: "Varicella (1.)", allapot: "atesett",
    indok: "igazolt bárányhimlő, 2026-04" }]);
  assert.equal(s.find((x) => x.pont.oltas === "Varicella (1.)")!.allapot, "atesett");
});

test("az esedékes, be nem jegyzett oltás JELET ad", () => {
  const m = oltasMerleg(oltasAllas(O(), CSECSEMO, []));
  assert.ok(m.hianyzik >= 5, "20 hónaposan több oltás is esedékes volt");
  assert.equal(m.evfolyamNelkul, 4, "és mind a négy kampányoltás eldönthetetlen");
  assert.match(oltasAllas(O(), CSECSEMO, []).find((x) => x.allapot === "hianyzik")!.miert,
    /senki nem pótolja vissza magától/);
});

/* ── VALIDÁLÁS ───────────────────────────────────────────────────────── */

test("a naptár validálása ma egy figyelmeztetést ad, hibát nem", () => {
  const w = validateOltasok(O());
  assert.equal(w.filter((i) => i.severity === "error").length, 0);
  assert.equal(w.filter((i) => i.id === "oltas.naptar").length, 1);
});

test("az „elutasítva” állapot ELHAGYÁSA hiba", () => {
  const k = O();
  k.allapotok = k.allapotok.filter((a) => a.kod !== "elutasitva");
  const h = validateOltasok(k).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /csendben elveszne/);
});

test("az EGYIDEJŰSÉG KÖLCSÖNÖS — az egyirányú hivatkozás figyelmeztet", () => {
  const k = O();
  const pcv = k.naptar.find((o) => o.id === "olt.pcv.12")!;
  pcv.egyidejuleg = [];
  const w = validateOltasok(k).filter((i) => i.id.endsWith(".kolcsonos"));
  assert.equal(w.length, 1);
  assert.match(w[0].message, /semmi nem emlékeztet/);
});

test("a nem értelmezhető évfolyam HIBA — nem csendes kihagyás", () => {
  const k = O();
  const hpv = k.naptar.find((o) => o.id === "olt.hpv.k7")!;
  if (hpv.utemezes === "kampany") hpv.evfolyam = "felső tagozat";
  const h = validateOltasok(k).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /évfolyam nélkül nem/);
});
