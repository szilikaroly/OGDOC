/**
 * A SOROS VONAL ÉS A DICOM — CSAK AZ INTERFÉSZ.
 *
 * Egy közös elv köti össze a két csatornát: MINDKETTŐ OLYASMIT ÁLLÍT MAGÁRÓL,
 * AMI NEM IGAZ. A soros eszköz hallgatása nem „nincs mérés”; a C-STORE sikere
 * nem „megőriztem”. A kettő ugyanaz a hiba: egy formailag rendben lévő válasz,
 * ami többet sugall, mint amennyit fed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  atveheto, folytonossag, kotesEl, loadProfilok, merleg as sMerleg,
  nemasag, oraeltolodas, validateKotes, validateProfilok,
} from "../core/interop/soros.ts";
import type { EszkozProfil, Kotes, SorosKeret } from "../core/interop/soros.ts";
import {
  azonossag, deidentifikalhato, kepbol, loadDicom, merleg as dMerleg,
  srAtveheto, torolhetoHelyi, validateDicom,
} from "../core/interop/dicom.ts";
import type { DicomKeszlet, SrKod, SrMeres } from "../core/interop/dicom.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOROS = loadProfilok(join(ROOT, "registry", "interop", "soros-profilok.json"));
const DICOM = loadDicom(join(ROOT, "registry", "interop", "dicom.json"));

const ISMERT = new Set([
  "anthro.weight.current", "anthro.height", "vitals.pulse", "vitals.temp",
]);
const ismert = (id: string) => ISMERT.has(id);

const MOST = "2026-09-08T10:00:00Z";
const keret = (r: Partial<SorosKeret> = {}): SorosKeret =>
  ({ nyers: "WT=72.4|HT=168", erkezett: MOST, ...r });

/* ── A REGISZTER ─────────────────────────────────────────────────────── */

test("a soros profilkészlet hibátlan", () => {
  assert.deepEqual(validateProfilok(SOROS, ismert).filter((i) => i.severity === "error"), []);
});

test("a DICOM-készlet hibátlan (a TLS-figyelmeztetés megmarad)", () => {
  const issues = validateDicom(DICOM);
  assert.deepEqual(issues.filter((i) => i.severity === "error"), []);
  assert.ok(issues.some((i) => i.severity === "warning" && /titkosított/.test(i.message)));
});

test("a fagyasztó KÖRNYEZETI profil, és nem beteg-változóra képez le", () => {
  const f = SOROS.profilok.find((p) => p.id === "soros.fagyaszto.homero");
  assert.ok(f);
  assert.equal(f.fajta, "kornyezet");
  assert.equal(f.celEszkoz, "FRZ-01");
  // A −80 °C SOHA nem fért volna bele a `vitals.temp` 30–43 °C-os tartományába.
  assert.ok(f.mezok.every((m) => !ismert(m.valtozo)));
  assert.equal(sMerleg(SOROS).kornyezet, 1);
});

/* ── A SOROS VONAL ÍTÉLETEI ──────────────────────────────────────────── */

const merlegProfil = (): EszkozProfil =>
  SOROS.profilok.find((p) => p.id === "soros.merleg.seca")!;
const fagyaszto = (): EszkozProfil =>
  SOROS.profilok.find((p) => p.id === "soros.fagyaszto.homero")!;

const kotes = (r: Partial<Kotes> = {}): Kotes => ({
  eszkozProfil: "soros.merleg.seca", caseId: "eset-1", kototte: "Kiss Éva ápoló",
  tol: "2026-09-08T09:00:00Z", ig: "2026-09-08T11:00:00Z",
  latottEszkozAzonosito: null, miert: "felvételi mérés", ...r,
});

test("profil nélkül semmi nem vehető át", () => {
  assert.equal(atveheto(keret(), undefined, [], null, MOST).allapot, "profilNelkul");
});

test("kötés nélkül a betegmérés megáll, de nem vész el", () => {
  const i = atveheto(keret(), merlegProfil(), [], null, MOST);
  assert.equal(i.allapot, "kotesNelkul");
  assert.match(i.miert, /várakozó sorba/);
});

test("élő kötéssel átvehető, és a mértékegység a profilból jön", () => {
  const i = atveheto(keret(), merlegProfil(), [kotes()], null, MOST);
  assert.equal(i.allapot, "atveheto");
  assert.deepEqual(i.ertekek, [
    { valtozo: "anthro.weight.current", ertek: 72.4, egyseg: "kg" },
    { valtozo: "anthro.height", ertek: 168, egyseg: "cm" },
  ]);
  assert.equal(i.eredet?.source, "device");
});

test("a lejárt kötés ugyanúgy nem kötés — és megmondja, mikor zárult", () => {
  const i = atveheto(keret(), merlegProfil(), [kotes({ ig: "2026-09-08T09:30:00Z" })], null, MOST);
  assert.equal(i.allapot, "kotesNelkul");
  assert.match(i.miert, /09:30/);
});

test("MÁS ESZKÖZ A PORTON: az átdugott kábel megáll, mielőtt bármit értelmeznénk", () => {
  const p = { ...fagyaszto(), fajta: "beteg" as const, celEszkoz: undefined };
  const i = atveheto(keret({ nyers: "T=-79.2" }), p, [], "FRZ-02", MOST);
  assert.equal(i.allapot, "eszkozNemEgyezik");
});

test("KÖRNYEZETI MÉRÉS BETEGHEZ KÖTVE: nem pontatlanság, hanem értelmetlenség", () => {
  const k = kotes({ eszkozProfil: "soros.fagyaszto.homero", latottEszkozAzonosito: "FRZ-01" });
  const i = atveheto(keret({ nyers: "T=-79.2" }), fagyaszto(), [k], "FRZ-01", MOST);
  assert.equal(i.allapot, "kornyezetiKotessel");
  assert.deepEqual(i.ertekek, []);
});

test("a környezeti mérés kötés NÉLKÜL vehető át — ez a helyes eset", () => {
  const i = atveheto(keret({ nyers: "T=-79.2" }), fagyaszto(), [], "FRZ-01", MOST);
  assert.equal(i.allapot, "atveheto");
  assert.deepEqual(i.ertekek, [{ valtozo: "tarolo.homerseklet", ertek: -79.2, egyseg: "Cel" }]);
  assert.match(i.miert, /FRZ-01/);
});

test("a sérült keret elakad, mielőtt számot csinálnánk belőle", () => {
  const i = atveheto(keret({ ellenorzoOsszeg: false }), merlegProfil(), [kotes()], null, MOST);
  assert.equal(i.allapot, "keretSerult");
});

test("a nem szám nem lesz nulla", () => {
  const i = atveheto(keret({ nyers: "WT=--|HT=168" }), merlegProfil(), [kotes()], null, MOST);
  assert.equal(i.allapot, "ertelmezhetetlen");
});

test("A TIZEDESVESSZŐ NEM CSONKOLÓDIK. A 72,4-ből nem lesz 72.", () => {
  // A vessző korábban MEZŐELVÁLASZTÓKÉNT is szerepelt, ezért a „WT=72,4” két
  // mezőre hasadt, és az első „72” lett — ÉRVÉNYES ÉRTÉKKÉNT, jelzés nélkül.
  // Súlynál apróság; ugyanezen az úton egy 5,0 mg/dL kreatininből 5 lesz.
  const i = atveheto(keret({ nyers: "WT=72,4|HT=168" }), merlegProfil(), [kotes()], null, MOST);
  assert.equal(i.allapot, "atveheto");
  assert.equal(i.ertekek[0].ertek, 72.4);
});

test("„.” tizedesjelnél a vesszős érték ELUTASÍTÁS, nem csonkolás", () => {
  const p = { ...merlegProfil(), tizedesjel: "." as const };
  const i = atveheto(keret({ nyers: "WT=72,4|HT=168" }), p, [kotes()], null, MOST);
  assert.equal(i.allapot, "ertelmezhetetlen");
  assert.match(i.miert, /nem lesz 72/);
});

test("vesszővel elválasztó eszköznél a tizedesjel kötelezően „.”", () => {
  const p = { ...merlegProfil(), mezoElvalasztok: [",", "|"] };
  const rossz = structuredClone(SOROS);
  rossz.profilok = [p, ...rossz.profilok.slice(1)];
  assert.ok(validateProfilok(rossz, ismert)
    .some((x) => x.severity === "error" && /feloldhatatlan/.test(x.message)));
  const jo = structuredClone(SOROS);
  jo.profilok = [{ ...p, tizedesjel: "." as const }, ...jo.profilok.slice(1)];
  assert.deepEqual(validateProfilok(jo, ismert).filter((x) => x.severity === "error"), []);
});

/* ── A HALLGATÁS ─────────────────────────────────────────────────────── */

test("az eseményvezérelt eszköz hallgatása normális — és ki van mondva", () => {
  assert.equal(nemasag(merlegProfil(), null, MOST).allapot, "esemenyvezerelt");
});

test("a fagyasztó elhallgatása ÁLLAPOT, nem semmi", () => {
  const i = nemasag(fagyaszto(), "2026-09-08T09:50:00Z", MOST);
  assert.equal(i.allapot, "elhallgatott");
  assert.equal(i.elteltMp, 600);
});

test("a soha meg nem szólalt eszköz nem „nincs mérés”", () => {
  assert.equal(nemasag(fagyaszto(), null, MOST).allapot, "sohaNemSzolalt");
});

test("a nem sorszámozott protokollnál a rendszer nem állítja, hogy minden megjött", () => {
  const f = folytonossag([keret(), keret()]);
  assert.equal(f.sorszamozott, false);
  assert.match(f.miert, /nem tudja/);
});

test("a sorszámhézag kimutatható", () => {
  const f = folytonossag([keret({ sorszam: 1 }), keret({ sorszam: 4 })]);
  assert.deepEqual(f.hianyzo, [2, 3]);
});

test("az eszköz órája adat, nem mérvadó", () => {
  assert.equal(oraeltolodas(keret({ eszkozIdo: "2026-09-08T10:01:12Z" })), 72);
  assert.equal(oraeltolodas(keret()), null);
});

test("a NYITOTT kötés hiba: a következő beteg mérése az előzőhöz kerülne", () => {
  const bad = validateKotes(kotes({ ig: null }));
  assert.equal(bad.length, 1);
  assert.match(bad[0], /KÖVETKEZŐ beteg/);
});

test("„a rendszer” nem cselekvő", () => {
  assert.ok(validateKotes(kotes({ kototte: "" })).some((b) => /nem cselekvő/.test(b)));
});

test("kotesEl: a határok zártak", () => {
  assert.equal(kotesEl(kotes(), "2026-09-08T09:00:00Z"), true);
  assert.equal(kotesEl(kotes(), "2026-09-08T11:00:00Z"), true);
  assert.equal(kotesEl(kotes(), "2026-09-08T11:00:01Z"), false);
});

/* ── A VALIDÁTOR MEGFOGJA A VISSZAVEZETETT HIBÁKAT ───────────────────── */

const rontott = (f: (p: EszkozProfil) => EszkozProfil) => {
  const k = structuredClone(SOROS);
  k.profilok = k.profilok.map((p) => (p.id === "soros.fagyaszto.homero" ? f(p) : p));
  return validateProfilok(k, ismert);
};

test("a KIINDULÓ HIBA visszatéve: környezeti profil beteg-változóra", () => {
  const i = rontott((p) => ({ ...p, mezok: [{ forras: "T", valtozo: "vitals.temp", egyseg: "Cel" }] }));
  assert.ok(i.some((x) => x.severity === "error" && /BETEG-változóra/.test(x.message)));
});

test("környezeti profil eszközazonosító nélkül: nincs, ami megfogja", () => {
  const i = rontott((p) => ({ ...p, eszkozAzonosito: null }));
  assert.ok(i.some((x) => x.severity === "error" && /RS-485/.test(x.message)));
});

test("környezeti profil céleszköz nélkül: nem tudni, melyik fagyasztó", () => {
  const i = rontott((p) => ({ ...p, celEszkoz: "" }));
  assert.ok(i.some((x) => x.severity === "error" && /MELYIK/.test(x.message)));
});

test("mértékegység nélkül a szám nem adat", () => {
  const i = rontott((p) => ({ ...p, mezok: [{ forras: "T", valtozo: "tarolo.homerseklet", egyseg: "" }] }));
  assert.ok(i.some((x) => x.severity === "error" && /MÉRTÉKEGYSÉG/.test(x.message)));
});

test("a hiányzó várt gyakoriság hiba — a `null` viszont érvényes válasz", () => {
  const nelkul = structuredClone(SOROS);
  delete (nelkul.profilok[0] as Partial<EszkozProfil>).vartGyakorisagMp;
  assert.ok(validateProfilok(nelkul, ismert).some((x) => /várt gyakoriság/.test(x.message)));
  assert.equal(SOROS.profilok[0].vartGyakorisagMp, null);
});

/* ── DICOM: AZONOSSÁG ÉS DE-IDENTIFIKÁCIÓ ────────────────────────────── */

test("a DICOM PatientID egy MÁSIK rendszer azonosítója — külső azonosságállítás", () => {
  const a = azonossag({
    "0010,0020": "P-1234", "0010,0010": "Minta^Anna",
    "0010,0030": "19900215", "0008,0050": "ACC-9",
  });
  assert.equal(a.externalId, "P-1234");
  assert.equal(a.familyName, "Minta");
  assert.equal(a.birthDate, "1990-02-15");
});

test("a rossz alakú dátum nem lesz találgatva", () => {
  assert.equal(azonossag({ "0010,0030": "1990.02.15" }).birthDate, null);
});

test("a HIÁNYZÓ BurnedInAnnotation nem „nincs”", () => {
  const k = kepbol({ "0008,0060": "MR" });
  assert.equal(k.burnedInAnnotation, null);
  const i = deidentifikalhato(k);
  assert.equal(i.allapot, "beegetesIsmeretlen");
  assert.equal(i.cimkeElegendo, false);
});

test("az ultrahang és a szkennelt kép külön gyanús", () => {
  for (const m of ["US", "SC", "OT"]) {
    assert.equal(deidentifikalhato(kepbol({ "0008,0060": m })).allapot, "gyanusModalitas");
  }
});

test("a kimondott ráégetés nem javítható címketörléssel", () => {
  const i = deidentifikalhato(kepbol({ "0028,0301": "YES", "0008,0060": "US" }));
  assert.equal(i.allapot, "raegetettAzonosito");
  assert.match(i.miert, /PIXELEKBEN/);
});

test("a kimondott NO az egyetlen, amire a címketisztítás épülhet", () => {
  assert.equal(deidentifikalhato(kepbol({ "0028,0301": "NO" })).cimkeElegendo, true);
});

/* ── DICOM: A TÁROLÁS VÉGLEGESSÉGE ──────────────────────────────────── */

test("storage commitment nélkül a helyi másolat SOHA nem törölhető", () => {
  const i = torolhetoHelyi({ megnevezes: "PACS", szolgaltatasok: ["C-STORE"] }, null);
  assert.equal(i.allapot, "nincsVeglegesitesiSzolgaltatas");
  assert.equal(i.torolheto, false);
});

test("az ÁTVÉTEL nem MEGŐRZÉS — a válaszra várni kell", () => {
  const cel = { megnevezes: "PACS", szolgaltatasok: ["C-STORE", "STORAGE-COMMIT"] as const };
  const i = torolhetoHelyi({ ...cel, szolgaltatasok: [...cel.szolgaltatasok] }, { megjott: false, elfogadva: false });
  assert.equal(i.allapot, "csakAtvetel");
  assert.equal(i.torolheto, false);
});

test("a MEGTAGADOTT megőrzés a legveszélyesebb eset", () => {
  const i = torolhetoHelyi(
    { megnevezes: "PACS", szolgaltatasok: ["C-STORE", "STORAGE-COMMIT"] },
    { megjott: true, elfogadva: false });
  assert.equal(i.allapot, "elutasitva");
  assert.equal(i.torolheto, false);
});

test("az elfogadott véglegesítés az EGYETLEN alap a helyi törlésre", () => {
  const i = torolhetoHelyi(
    { megnevezes: "PACS", szolgaltatasok: ["C-STORE", "STORAGE-COMMIT"] },
    { megjott: true, elfogadva: true });
  assert.equal(i.torolheto, true);
});

/* ── DICOM: STRUCTURED REPORTING ─────────────────────────────────────── */

const KOD: SrKod = { rendszer: "DCM", kod: "11951-1", megnevezes: "BPD" };
const meres = (r: Partial<SrMeres> = {}): SrMeres => ({
  kod: KOD, ertek: 34.2, egyseg: "mm", megfigyelo: "GE Voluson E10 / sw 18.0",
  mikor: MOST, ...r,
});
const terkep = (k: SrKod) => (k.kod === "11951-1" ? "us.bpd" : null);

test("az SR-mérés átvehető, ha kód + egység + megfigyelő megvan", () => {
  const i = srAtveheto(meres(), terkep, []);
  assert.equal(i.allapot, "atveheto");
  assert.equal(i.valtozo, "us.bpd");
});

test("kódolatlan szám nem tudja, mit mér", () => {
  assert.equal(srAtveheto(meres({ kod: null }), terkep, []).allapot, "kodolatlan");
});

test("egység nélkül a 3,2 cm és a 3,2 mm ugyanúgy néz ki", () => {
  assert.equal(srAtveheto(meres({ egyseg: null }), terkep, []).allapot, "egysegNelkul");
});

test("„a gép mérte” nem elég: MELYIK gép, melyik szoftververzió", () => {
  assert.equal(srAtveheto(meres({ megfigyelo: "  " }), terkep, []).allapot, "megfigyeloNelkul");
});

test("a leképezetlen kód várakozik — puszta számként NEM kerül be", () => {
  const i = srAtveheto(meres({ kod: { rendszer: "DCM", kod: "999", megnevezes: "x" } }), terkep, []);
  assert.equal(i.allapot, "ismeretlenKod");
  assert.equal(i.valtozo, null);
  assert.match(i.miert, /NEM VÉSZ EL/);
});

test("ÜTKÖZÉS: a gépi mérés nem írja felül és nem is teszi mellé az emberit", () => {
  const i = srAtveheto(meres(), terkep,
    [{ valtozo: "us.bpd", forras: "Nagy Péter dr.", mikor: "2026-09-08T09:30:00Z" }]);
  assert.equal(i.allapot, "utkozik");
  assert.match(i.miert, /egy embernek kell/);
});

test("az ablakon KÍVÜLI korábbi emberi érték nem ütközik", () => {
  const i = srAtveheto(meres(), terkep,
    [{ valtozo: "us.bpd", forras: "Nagy Péter dr.", mikor: "2026-09-01T09:30:00Z" }]);
  assert.equal(i.allapot, "atveheto");
});

test("a gépi eredetű korábbi érték nem számít emberi ütközésnek", () => {
  const i = srAtveheto(meres(), terkep,
    [{ valtozo: "us.bpd", forras: "device", mikor: "2026-09-08T09:30:00Z" }]);
  assert.equal(i.allapot, "atveheto");
});

/* ── DICOM: A KÉSZLET SZABÁLYAI ──────────────────────────────────────── */

const dicomRontva = (f: (k: DicomKeszlet) => void) => {
  const k = structuredClone(DICOM);
  f(k);
  return validateDicom(k);
};

test("C-MOVE fogadó C-STORE nélkül: a kép SEHOVA nem érkezik meg", () => {
  const i = dicomRontva((k) => {
    k.csomopontok = k.csomopontok.filter((c) => !c.szolgaltatasok.includes("C-STORE"));
    k.csomopontok[0].szolgaltatasok = ["C-ECHO", "C-FIND", "C-MOVE"];
  });
  assert.ok(i.some((x) => x.severity === "error" && /SEHOVA/.test(x.message)));
});

test("„archívum” storage commitment nélkül: a jelölés hamis", () => {
  const i = dicomRontva((k) => { k.csomopontok[0].archivum = true; });
  assert.ok(i.some((x) => x.severity === "error" && /ARCHÍVUMKÉNT/.test(x.message)));
});

test("MWL MPPS nélkül: a tétel örökre „ütemezett” marad", () => {
  const i = dicomRontva((k) => {
    const m = k.csomopontok.find((c) => c.szolgaltatasok.includes("MWL"))!;
    m.szolgaltatasok = m.szolgaltatasok.filter((s) => s !== "MPPS");
  });
  assert.ok(i.some((x) => x.severity === "warning" && /ELMARADT/.test(x.message)));
});

test("hitelesítés nélküli DICOMweb-végpont: nincs, ami megfogja", () => {
  const i = dicomRontva((k) => { k.webVegpontok![0].hitelesites = "nincs"; });
  assert.ok(i.some((x) => x.severity === "error" && /HITELESÍTÉS NÉLKÜL/.test(x.message)));
});

test("http:// végpont: a hitelesítő adat is nyíltan megy", () => {
  const i = dicomRontva((k) => { k.webVegpontok![0].alapUrl = "http://pacs.helyi/dicom-web"; });
  assert.ok(i.some((x) => x.severity === "error" && /proxynaplók/.test(x.message)));
});

test("STOW-RS ismeretlen megőrzési nyugtával: a `null` nem „igen”", () => {
  const i = dicomRontva((k) => { k.webVegpontok![0].szolgaltatasok.push("STOW-RS"); });
  assert.ok(i.some((x) => x.severity === "error" && /ISMERETLEN/.test(x.message)));
});

test("az elgépelt AE title nem hibaüzenetet ad, hanem elutasított társítást", () => {
  const i = dicomRontva((k) => { k.sajatAeTitle = "OGDOC-NAGYON-HOSSZU-NEV"; });
  assert.ok(i.some((x) => x.severity === "error" && /ELUTASÍTOTT TÁRSÍTÁST/.test(x.message)));
});

test("a licenckapu az ELSŐ kérdés, nem az utolsó", () => {
  const i = dicomRontva((k) => { k.oldalkocsi.osszefer = false; });
  assert.ok(i.some((x) => x.severity === "error" && /licenckapu/.test(x.message)));
});

test("a „működik” állítás hiányzó feltétellel hamis állítás", () => {
  const i = dicomRontva((k) => { k.oldalkocsi.allapot = "mukodik"; });
  assert.ok(i.some((x) => x.severity === "error" && /hamis állítás/.test(x.message)));
});

test("a mérleg számol: a web-végpont nem csomópont", () => {
  const m = dMerleg(DICOM);
  assert.equal(m.csomopont, DICOM.csomopontok.length);
  assert.equal(m.webVegpont, 1);
  assert.equal(m.webVedtelen, 0);
  assert.equal(m.oldalkocsiKesz, false);
});
