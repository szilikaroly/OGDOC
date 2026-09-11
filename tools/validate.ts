/**
 * A teljes integritás-ellenőrzés EGY helyen.
 *
 * Tizenhét törzs hivatkozik egymásra — a változóregiszter, a kalkulátorok, az
 * ellátási dokumentumtípusok, a panaszszótár, a normogramok a szűrési szabályok a gyógyszertörzs a diétás protokollok a mérőeszközök és a beavatkozási törzs —, és mindegyik hivatkozás
 * elromolhat egy átnevezéskor. A `npm run validate` ezért nem a felület
 * dolga: a build áll el rajta, nem a klinikus szembesül vele.
 */
import { readFileSync } from "node:fs";
import { loadRegistry } from "../core/load.ts";
import { loadDocuments } from "../core/docs/registry.ts";
import { validateCalculators } from "../core/calc/run.ts";
import { loadComplaints } from "../core/complaints/registry.ts";
import { loadNormograms } from "../core/us/normogram.ts";
import { catalogueStamp, loadChartCatalogue, validateCatalogue } from "../core/us/katalogus.ts";
import { loadUiMap, validateUiMap, auditFields } from "../core/ui/felulet.ts";
import { nemaMeresek, nemaMerleg } from "../core/ui/meres.ts";
import {
  loadProtokollok, merleg as exMerleg, validateProtokollok,
} from "../core/exassist/protokoll.ts";
import {
  loadTele, merleg as teleMerleg, validateTele,
} from "../core/tele/konzultacio.ts";
import {
  loadModellek, merleg as aiMerleg, validateModellek,
} from "../core/ai/modell.ts";
import { validateEgyuttes } from "../core/ai/egyuttes.ts";
import {
  loadKuszobok, loadOsszerendeles, merleg as gyMerleg, validatePerinatalis,
} from "../core/gyermek/perinatalis.ts";
import {
  loadMdr, merleg as mdrMerleg, validateMdr,
} from "../core/mdr/besorolas.ts";
import {
  loadPanel, merleg as panelMerleg, validatePanel,
} from "../core/licenc/panel.ts";
import {
  merleg as profilMerleg, validateProfil,
} from "../core/profil/profil.ts";
import {
  loadKerdoivek, validateKerdoivek,
} from "../core/vedono/szures.ts";
import { loadAudiogram, validateAudiogram } from "../core/vedono/hallas.ts";
import { loadKorzet, validateKorzet } from "../core/vedono/korzet.ts";
import { loadOltasok, naptarKapu, validateOltasok } from "../core/vedono/oltas.ts";
import { loadFigo, validateFigo } from "../core/ctg/figo.ts";
import { loadCms, merleg as cmsMerleg, validateCms } from "../core/cms/tartalom.ts";
import { merleg as rxMerleg, validateFeliras } from "../core/rx/kiallitas.ts";
import { kapacitas as agyKapacitas, loadAgyak, validateAgyak } from "../core/fekvo/agy.ts";
import { loadMutok, validateMutok } from "../core/op/muto.ts";
import { loadAnalitok, merleg as analitMerleg, validateAnalitok } from "../core/lab/analit.ts";
import { agyszam, loadHelyek, merleg as helyMerleg, validateHelyek } from "../core/fekvo/hely.ts";
import { validateSzerepek } from "../core/op/foglalas.ts";
import { validateIdozites } from "../core/admin/helyszerkeszto.ts";
import { loadFedesek, merleg as fedesMerleg, validateFedesek } from "../core/fedes/feloldas.ts";
import {
  loadSzabalyok as loadTabla, validateSzabalyok as validateTabla,
} from "../core/szabaly/motor.ts";
import { loadEgysegek, validateEgysegek } from "../core/ocr/beolvasas.ts";
import { loadMec, merleg as mecMerleg, validateMec } from "../core/fogamzas/mec.ts";
import { loadSzolgaltatok, validateSzolgaltatok } from "../core/auth/szolgaltato.ts";
import { loadBtk, validateBtk } from "../core/gyermek/jelzes.ts";
import {
  loadTerkep, merleg as terkepMerleg, validateTerkep,
} from "../core/karbantartas/terkep.ts";
import {
  loadCsatornak, merleg as csatMerleg, validateCsatornak,
} from "../core/interop/csatorna.ts";
import {
  isberMerleg, loadIsber, validateIsber,
} from "../core/biobank/minta.ts";
import {
  loadProfilok, merleg as sorosMerleg, validateProfilok,
} from "../core/interop/soros.ts";
import {
  loadDicom, merleg as dicomMerleg, validateDicom,
} from "../core/interop/dicom.ts";
import {
  loadJelek, loadMwho, merleg as kardioMerleg, validateKardio,
} from "../core/belgyogyaszat/kardio.ts";
import {
  loadPalliativ, merleg as pallMerleg, validatePalliativ,
} from "../core/belgyogyaszat/palliativ.ts";
import {
  loadModulcimek, merleg as cimMerleg, validateModulcimek,
} from "../core/ui/modulcimek.ts";
import {
  loadFeladatok, merleg as feladatMerleg, validateFeladatok,
} from "../core/ui/feladat.ts";
import {
  loadFunkciok, merleg as funkcioMerleg, szakaszKulcsok, validateFunkciok,
} from "../core/ui/funkciok.ts";
import { loadCsoportok as loadCsoportKeszlet } from "../core/auth/csoport.ts";
import {
  gyujt, loadHianyok, merleg as hianyMerleg, validateHianyok,
} from "../core/hianyzo/jegyzek.ts";
import type { ModulHiany } from "../core/hianyzo/jegyzek.ts";
import { modulHianyok } from "../core/hianyzo/modulhianyok.ts";
import {
  loadParameterek, merleg as paramMerleg, validateParameterek,
} from "../core/karbantartas/parameter.ts";
import type { MezoSpec } from "../core/ocr/beolvasas.ts";
import type { SzerkesztettKeszlet } from "../core/admin/helyszerkeszto.ts";
import type { SzerepKeszlet } from "../core/op/foglalas.ts";
import { endoMerleg, validateEndo } from "../core/endo/diabetes.ts";
import { loadJelentes, validateJelentes, merleg as jelMerleg } from "../core/jelentes/eves.ts";
import {
  loadDontesek, loadSzabalyok, validateDontesek,
} from "../core/ui/dontes.ts";
import { loadAnatomy, validateAnatomy } from "../core/us/anatomia.ts";
import { loadProtocol, validateProtocol } from "../core/szepszis/screen.ts";
import { loadScreenings } from "../core/screening/registry.ts";
import { loadDrugs } from "../core/rx/registry.ts";
import { loadDietProtocols } from "../core/diet/registry.ts";
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import { loadProcedures } from "../core/op/registry.ts";
import { loadCareProtocols, loadConsultRules } from "../core/plan/registry.ts";
import { loadPoints } from "../core/followup/points.ts";
import { loadIchomSpec, validateIchomMapping } from "../core/followup/ichom.ts";
import { loadPromSets } from "../core/prom/sets.ts";
import { loadCodeTables, validateTables } from "../core/coding/tables.ts";
import { loadCodeRules } from "../core/coding/rules.ts";
import { loadSnomed, validateSnomedDistribution } from "../core/coding/snomed.ts";
import { validateVersionedCodes } from "../core/codes.ts";
import { loadVerzesTabla, validateVerzesTabla } from "../core/scores/verzes.ts";
import {
  hitelesitesAllapot, loadHitelesitesek, merleg as refMerleg, validateHitelesitesek,
} from "../core/lab/hitelesites.ts";
import {
  loadNormogramHitelesitesek, ngAllapot, validateNgHitelesitesek,
} from "../core/us/hitelesites.ts";
import { elsoKor, telepitesiSorrend, telepitesMerleg } from "../core/us/telepites.ts";
import {
  kalkAllapot, loadKalkHitelesitesek, loadOrokolt, orokoltAllas,
  validateKalkHitelesitesek,
} from "../core/calc/hitelesites.ts";
import {
  eltereseK, dontesAllapot, loadKuszobDontes, loadKuszobHitelesitesek,
  merleg as sepMerleg, riasztasEngedve, validateKuszobok,
} from "../core/szepszis/kuszob.ts";
import {
  loadMegorzesHitelesitesek, merleg as megMerleg, validateMegorzes,
} from "../core/docs/megorzes.ts";
import {
  loadLicencek, merleg as licMerleg, validateLicencek,
} from "../core/kerdoiv/licenc.ts";
import {
  loadAllapot as loadMirAllapot, loadFa, loadMatrix, merleg as mirMerleg, validateMir,
} from "../core/mir/fa.ts";
import {
  keret as mirKeret, loadKeretek, merleg as keretMerleg, validateKeretek,
} from "../core/mir/keretek.ts";
import {
  loadRend, merleg as riasztMerleg, validateRend,
} from "../core/riasztas/eszkalacio.ts";
import { felulet } from "../core/riasztas/leltar.ts";
import { rendszerAllapot } from "../core/ett/allapot.ts";
import {
  csatlakozhato, kapuAllas, loadCsatlakozas, merleg as eesztMerleg, validateCsatlakozas,
} from "../core/eeszt/csatlakozas.ts";
import {
  merleg as helyiMerleg, validateHelyi,
} from "../core/us/helyi.ts";
import {
  auditMezok, loadHurok, merleg as auditMerleg, parAllas as auditAllas,
  validateHurok,
} from "../core/audit/hurok.ts";
import {
  elofeltetelek as pilotElofeltetelek, indithato as pilotIndithato, loadPilot,
  merleg as pilotMerleg, validatePilot, zarasAllas,
} from "../core/pilot/felkeszultseg.ts";
import {
  beadhato as ettBeadhato, bizonyitekok, ertekel as ettErtekel, loadDosszie,
  merleg as ettMerleg, validateDosszie,
} from "../core/ett/dosszie.ts";
import { CALCULATORS } from "../core/calc/defs.ts";
import {
  atvettTetelek, hivatkozhatoTetelek, loadKulsoForrasok,
  validateKulsoForrasok, validateKulsoTerjesztes,
} from "../core/kulso/protokoll.ts";

const reg = loadRegistry("registry/variables");
const docs = loadDocuments("registry/documents/core.json");
const complaints = loadComplaints("registry/complaints");
const normograms = loadNormograms("registry/normogramok");
const catalogue = loadChartCatalogue("registry/normogramok/katalogus.json");
const uiMap = loadUiMap("registry/felulet/szuleszeti-felulet.json");
const gynMap = loadUiMap("registry/felulet/nogyogyaszati-felulet.json");
const anatomy = loadAnatomy("registry/felulet/magzati-anatomia.json");
const szabalyok = loadSzabalyok("registry/felulet/dontes-szabalyok.json");
const dontesek = loadDontesek("registry/felulet/dontesek.json");
const sepsis = loadProtocol("registry/szepszis/cmqcc-ob-szepszis.json");
const screenings = loadScreenings("registry/szuresek");
const verzes = loadVerzesTabla("registry/kockazat/cmqcc-verzes.json");
const kulso = loadKulsoForrasok("registry/kulso");
const refHit = loadHitelesitesek("registry/labor/referencia-hitelesitesek.json");
const ngHit = loadNormogramHitelesitesek("registry/normogramok/hitelesitesek.json");
const kalkHit = loadKalkHitelesitesek("registry/kalkulatorok/hitelesitesek.json");
const kalkOrokolt = loadOrokolt("registry/kalkulatorok/orokolt.json");
const sepKuszobHit = loadKuszobHitelesitesek("registry/szepszis/kuszob-hitelesitesek.json");
const sepDontes = loadKuszobDontes("registry/szepszis/kuszob-dontes.json");
const megHit = loadMegorzesHitelesitesek("registry/documents/megorzes-hitelesitesek.json");
const licencek = loadLicencek("registry/kerdoivek/licencek.json");
const mirFa = loadFa("registry/mir/dokumentumfa.json");
const mirMx = loadMatrix("registry/mir/iso20387.json");
const mirAll = loadMirAllapot("registry/mir/allapot.json");
const mirKeretek = loadKeretek("registry/mir/keretek.json");
const riasztRend = loadRend("registry/riasztas/eszkalacio.json");
const MA_NAP = new Date().toISOString().slice(0, 10);
const ettDosszie = loadDosszie("registry/ett/dosszie.json");
const ettBiz = bizonyitekok(rendszerAllapot("."));
const eesztCs = loadCsatlakozas("registry/eeszt/csatlakozas.json");
const pilot = loadPilot("registry/pilot/pilot.json");
const exass = loadProtokollok("registry/exassist/protokollok.json");
const tele = loadTele("registry/tele/telemedicina.json");
const aiModellek = loadModellek("registry/ai/modellek.json");
const gyKuszob = loadKuszobok("registry/gyermek/kuszobok.json");
const gyOssz = loadOsszerendeles("registry/gyermek/osszerendeles.json");
const mdr = loadMdr("registry/mdr/besorolas.json");
const licPanel = loadPanel("registry/licenc/panel.json");
const vdKerdoiv = loadKerdoivek("registry/vedono/kerdoivek.json");
const vdAudio = loadAudiogram("registry/vedono/audiogram.json");
const vdKorzet = loadKorzet("registry/vedono/korzet.json");
const vdOltas = loadOltasok("registry/vedono/oltasok.json");
const figo = loadFigo("registry/ctg/figo2015.json");
const cms = loadCms("registry/cms/weboldal.json");
const agyak = loadAgyak("registry/fekvo/agyak.json");
const mutok = loadMutok("registry/muto/mutok.json");
const analitok = loadAnalitok("registry/labor/analit-csoportok.json");
const helyek = loadHelyek("registry/fekvo/helyek.json");
const fedesek = loadFedesek("registry/fedes/dontesek.json");
const SPR_KESZLETEK = ["spr-kok-kimaradt", "spr-pop-kimaradt", "spr-terhessegKizarasa"]
  .map((n) => loadTabla(`registry/fogamzas/${n}.json`));
const egysegek = loadEgysegek("registry/ocr/egysegek.json");
const mec = loadMec("registry/fogamzas/usmec-2024.json");
const btk = loadBtk("registry/gyermek/beleegyezes-btk.json");
const terkep = loadTerkep("registry/modulok/terkep.json");
const csatornak = loadCsatornak("registry/interop/csatornak.json");
const isber = loadIsber("registry/biobank/isber.json");
const hianyok = loadHianyok("registry/hianyzo/tetelek.json");
const szolgaltatok = loadSzolgaltatok("registry/auth/szolgaltatok.json");
const sorosProfilok = loadProfilok("registry/interop/soros-profilok.json");
const dicom = loadDicom("registry/interop/dicom.json");
const mwho = loadMwho("registry/belgyogyaszat/mwho.json");
const kardioJelek = loadJelek("registry/belgyogyaszat/kardio-jelek.json");
const palliativ = loadPalliativ("registry/belgyogyaszat/palliativ.json");
const modulcimek = loadModulcimek("registry/felulet/modulcimek.json");
const feladatok = loadFeladatok("registry/felulet/feladatprofilok.json");
const funkciok = loadFunkciok("registry/felulet/funkciok.json");
// A FELÜLETI SZAKASZOK: a mezővel maradó modulok + a virtuális szakaszok.
const szakaszok = szakaszKulcsok(funkciok, reg.all().filter((v) => !v.aliasOf));
const klinikaiCsoportok = loadCsoportKeszlet("registry/auth/csoportok.json").csoportok
  .filter((c) => c.szerepek.some((sz) => sz === "clinician" || sz === "assistant")).map((c) => c.id);

/**
 * A HIÁNYJEGYZÉK GYŰJT, NEM ÍR ÚJRA.
 *
 * A modulok saját `hianyzik` listái innen kerülnek be — ha egy modul javul, a
 * jegyzék magától rövidül. Egy kézzel karbantartott hiánylista fél éven belül
 * hazudik: a modul javul, a lista nem.
 */
const MODUL_HIANYOK: ModulHiany[] = modulHianyok((x) => x);

const HIANY_MIND = gyujt(hianyok, MODUL_HIANYOK);
const parameterek = loadParameterek("registry/karbantartas/parameterek.json");
const backlog = JSON.parse(readFileSync("registry/backlog/szamitasok.json", "utf8")) as {
  tetelek: Array<{ id: string; kimenet: string; allapot: string }>;
};
const szerepek = JSON.parse(readFileSync("registry/muto/szerepek.json", "utf8")) as SzerepKeszlet;
const adatkeszletek = JSON.parse(readFileSync("registry/adatkeszletek/noi-egeszseg.json", "utf8")) as {
  statisztika: { tetel: number; hozzaferes: Record<string, number>; regio: Record<string, number> };
  tabla_hibak: Array<{ tetel: string; fajta: string; mit: string }>;
};
const ENDO_RE = /^lab\.(17ohp|amh|antitpo|cortisol|dheas|fsh|ft3|ft4|glucose|hba1c|lh|ogtt|prl|testosterone|tsh)/;
const MOST = new Date().toISOString();
const jelentes = loadJelentes("registry/jelentes/eves.json");
const hurok = loadHurok("registry/audit/hurok.json");
// AZ AUDIT-MEZŐK A FELÜLETTÉRKÉPBŐL JÖNNEK, nem külön listából: egy új
// `outcomeAudit` mező felvétele önmagában bekapcsolja a bekötöttség
// ellenőrzését, senkinek nem kell egy második helyre is beírnia.
const auditMezokLista = [uiMap, gynMap].flatMap((m) => auditMezok(m));
const valtozoKodok = (id: string): string[] | null => {
  const v = reg.all().find((x) => x.id === id) as { valueSet?: Array<{ code: string }> };
  return v?.valueSet ? v.valueSet.map((o) => o.code) : null;
};
const ngLekepezes = (JSON.parse(
  readFileSync("registry/normogramok/lekepezes.json", "utf8"),
) as { kotesek: Record<string, string> }).kotesek;
const drugs = loadDrugs("registry/gyogyszerek");
const diets = loadDietProtocols("registry/dieta");
const instruments = loadInstruments("registry/kerdoivek");
const procedures = loadProcedures("registry/beavatkozasok");
const care = loadCareProtocols("registry/gondozas");
const consults = loadConsultRules("registry/gondozas");
const points = loadPoints("registry/utankovetes");
const ichom = loadIchomSpec("registry/ichom-pcb-v5.seed.json");
const promSets = loadPromSets("registry/prom");
const tables = loadCodeTables("registry/kodok/tablak");
const codeRules = loadCodeRules("registry/kodok");
// A SNOMED-törzs HELYI: ha nincs telepítve, a validálás attól még lefut.
loadSnomed("registry/kodok/helyi");

const issues = [
  ...reg.validate(),
  ...validateCalculators(reg),
  ...docs.validate(reg),
  ...complaints.validate(reg),
  ...normograms.validate(reg),
  ...validateCatalogue(catalogue),
  ...validateUiMap(uiMap, reg),
  ...validateUiMap(gynMap, reg),
  ...validateAnatomy(anatomy),
  // A döntési katalógus: egy ÚJ szabály nem csúszhat be úgy, hogy senki nem
  // dönt róla — a katalógusból hiányzó szabály itt hiba, nem figyelmeztetés.
  ...validateDontesek(
    [uiMap, gynMap].flatMap((m) => auditFields(m, reg)), szabalyok, dontesek),
  ...validateProtocol(sepsis, reg),
  ...screenings.validate(reg),
  ...validateVerzesTabla(reg, verzes),
  // A referenciák hitelesítése: `primary` CSAK aláírásból lehet.
  ...validateHitelesitesek(reg, refHit),
  // A normogramok aláírása: `primary` CSAK aláírásból, és konvenciófüggő
  // mérésnél az aláírásnak a konvenciót is meg kell neveznie.
  ...validateNgHitelesitesek(normograms.all(), ngHit, catalogue, ngLekepezes),
  // A szepszisküszöbök: a riasztás kapuját ALÁÍRÁS nyitja, nem jelölés, és a
  // két forrás eltérése a két ÉLŐ definícióból vezetődik le, nem prózából.
  ...validateKuszobok(sepsis, CALCULATORS, sepKuszobHit, sepDontes),
  // A megőrzési idők: a `primary` szint ALÁÍRÁSBÓL áll elő, és a
  // jogszabályhely idézett horgonya összevetve a beállítottal.
  ...validateMegorzes(docs.all(), megHit),
  // Az ETT-beadvány: minden tétele ÁLLÍTÁS egy bizottságnak, és amit
  // kimondunk, azt bizonyítani kell tudni.
  // A mérőeszközök licence: a kaput NYILVÁNTARTÁS nyitja, nem jelölés, és a
  // licenc az egyetlen igazolás a rendszerben, ami LEJÁR.
  ...validateLicencek(instruments.all(), licencek, MA_NAP),
  // A bizonyítékbázis KÖZÖS: az EESZT-dosszié kulcsai nem „fölöslegesek”.
  ...validateDosszie(ettDosszie, ettBiz, [
    ...eesztCs.urlapok.flatMap((u) => [
      ...u.mezok.map((m) => m.bizonyitek), ...(u.mitAllit ?? []).map((a) => a.bizonyitek),
    ]),
    ...eesztCs.kapuk.map((k) => k.bizonyitek),
    ...[...pilot.elofeltetelek, ...pilot.kimondatlan].flatMap((e) => e.bizonyitek),
  ].filter((x): x is string => !!x)),
  // Az EESZT-csatlakozás: a beadvány KIFELÉ ír, ezért a hitelesítés hiánya
  // itt belső kockázatból külsővé válik.
  ...validateCsatlakozas(eesztCs, ettBiz),
  // A pilot: az első lépés, ami VALÓDI BETEGADATOT érint. A kapu itt nem egy
  // rossz számot állít meg, hanem azt, hogy visszafordíthatatlan adat kerüljön
  // egy olyan rendszerbe, ami még nem tudja megvédeni — és külön kimondja, ha
  // egy zárási kritériumnak nincs mérése, mert az a végén magától
  // „teljesült”-nek fog látszani.
  ...(() => {
    const a = pilotElofeltetelek(pilot, ettBiz);
    return validatePilot(pilot, ettBiz, a, zarasAllas(pilot, a));
  })(),
  // Az audit-hurok: a rendszer legfontosabb köre. Egy `outcomeAudit` mező
  // változó nélkül HIBA — a válasz sehol nem maradna meg —, és a négyértékű
  // válaszkészletből kihullott kód a cáfolatot az eldönthetetlenséggel mosná
  // össze, amitől a rendszer rendszeresen rosszabbnak látszana.
  ...validateHurok(hurok, auditMezokLista,
    new Set(reg.all().map((v) => v.id)), valtozoKodok),
  // A helyi normogramok: a rendszer önmagára záródása. Két dolgot mond ki,
  // amit eddig senki — melyik sáv marad a saját maga deklarált minimuma
  // alatt, és mekkora a publikálthoz képesti RENDSZERES eltolás. Az utóbbi
  // nélkül egy mérési torzítás „normális”-ként épül be, és a rendszer a saját
  // torzításához mérné magát, tökéletes egyezést találva.
  ...validateHelyi(normograms.all()),
  // ExAssist: a bővítő protokoll nem veheti ki a szakmai minimum tételét — a
  // kivétel a kihagyás intézményesítése volna. A hitelesítetlen tételsor itt
  // NEM nyit kaput: a szerkezet aláírás nélkül is kényszerít.
  ...validateProtokollok(exass),
  // Telemedicina: kérdés nélkül nincs konzultáció, és a laikus kérés nem rendelés.
  ...validateTele(tele, new Set(exass.protokollok.map((p) => p.id))),
  // AI-modellek: a licenckapu MEGELŐZI a hitelesítést, és az állapot a
  // válaszokból derivált, nem beírt szó.
  ...validateModellek(aiModellek),
  ...validateEgyuttes(aiModellek),
  // A 29. modul: az újszülött KÜLÖN BETEG. A küszöbök aláírásból nyílnak, és az
  // anya–gyermek összerendelés kimondott jogalap nélkül nem jön létre.
  ...validatePerinatalis(gyKuszob, gyOssz, new Set(reg.all().map((v) => v.id))),
  // MDR: a besorolást nem lehet megúszni. Amíg nincs kimondva, az AI-almodul zárva.
  ...validateMdr(mdr),
  // Licencpanel: az aktiválás nem jelölőnégyzet, és a lejárt licenc ugyanúgy zár.
  ...validatePanel(licPanel, MA_NAP),
  // Páciens profil: az allergia ma öt változóban él szétszórva. Aki az egyiket
  // kitölti, nem tudja, hogy a másik réteg a másikat nézi — és itt a tét halálos.
  ...validateProfil(reg),
  // Védőnői modul: a jogszabályi szűrési naptár, az audiogram és a körzeti
  // értesítés. A hazaadási értesítés elmaradása közvetlenül azt okozza, hogy
  // egy újszülöttet nem keres fel senki.
  ...validateKerdoivek(vdKerdoiv),
  ...validateAudiogram(vdAudio),
  ...validateKorzet(vdKorzet),
  ...validateOltasok(vdOltas),
  ...validateFigo(figo, reg),
  ...validateCms(cms, MOST),
  ...validateFeliras(drugs.all()),
  ...validateAgyak(agyak, []),
  ...validateMutok(mutok),
  ...validateAnalitok(analitok, reg),
  ...validateHelyek(helyek),
  ...validateFedesek(fedesek, reg),
  ...SPR_KESZLETEK.flatMap((k) => validateTabla(k)),
  ...validateMec(mec),
  ...validateBtk(btk),
  ...validateTerkep(terkep, "."),
  ...validateCsatornak(csatornak),
  ...validateProfilok(sorosProfilok, (id) => reg.all().some((v) => v.id === id)),
  ...validateDicom(dicom),
  ...validateKardio(mwho, kardioJelek, (id) => reg.all().some((v) => v.id === id)),
  ...validatePalliativ(palliativ),
  ...validateFunkciok(funkciok, reg.all().filter((v) => !v.aliasOf)),
  ...validateModulcimek(modulcimek, szakaszok),
  ...validateFeladatok(feladatok, szakaszok, klinikaiCsoportok),
  ...validateIsber(isber),
  ...validateHianyok(hianyok),
  ...validateSzolgaltatok(szolgaltatok),
  ...validateParameterek(parameterek),
  ...validateEgysegek(egysegek,
    new Map<string, MezoSpec>(reg.all().map((v) => [v.id, { id: v.id, unit: v.unit, domain: v.domain }]))),
  ...validateIdozites(helyek as SzerkesztettKeszlet),
  ...validateSzerepek(szerepek),
  ...validateEndo(endoMerleg(reg.all().filter((v) => ENDO_RE.test(v.id)))),
  // Éves jelentés: a begépelt szám olyan állítás, amit senki nem tud
  // visszaellenőrizni — és a jelentésekre évekig hivatkoznak.
  ...validateJelentes(jelentes),
  // A KÜSZÖB NÉLKÜLI MÉRÉS. A `meresek()` korábban egy `continue`-val kihagyta
  // ezeket, és a rögzített érték sehol nem jelent meg — a hallgatás pedig
  // megnyugtatásnak látszik. Modulonként egy figyelmeztetés: a lista hosszú,
  // de a hiány nem tüntethető el azzal, hogy nem soroljuk fel.
  ...(() => {
    const nema = nemaMeresek(reg).filter((x) => x.kezzelBevitt);
    const modulok = [...new Set(nema.map((x) => x.modul))].sort();
    return modulok.map((m) => {
      const t = nema.filter((x) => x.modul === m);
      return {
        severity: "warning" as const, id: `meres.nincsKuszob.${m}`,
        message:
          `${t.length} kézzel bevitt mérésnek nincs sem kritikus küszöbe, sem ` +
          `referenciája (${t.slice(0, 4).map((x) => x.id).join(", ")}` +
          `${t.length > 4 ? ", …" : ""}). A rendszer ezekről a számokról nem mond ` +
          `semmit — az érték „nincsKuszob” állapotot kap, hogy a hallgatás ne ` +
          `látsszon megnyugtatásnak.`,
      };
    });
  })(),
  // A minőségirányítási fa: a dokumentum LEJÁR, és a jelölés nem állíthat
  // többet, mint amit a bizonyíték fed.
  ...validateMir(mirFa, mirMx, mirAll, MA_NAP),
  // A három keret (ISO 20387 · BELLA · MEES 2.1): a MEES átmeneti határidői
  // DÁTUMHOZ kötöttek, és nem a mi terveinkhez igazodnak.
  ...validateKeretek(mirKeretek, MA_NAP),
  // A riasztási rend: a kapu itt MEGFORDUL — a címzett nélküli riasztás nem
  // féltájékoztatás, hanem kiképzés az elkattintásra.
  ...validateRend(riasztRend),
  // A kalkulátorok aláírása: `verified: true` CSAK tételes aláírásból.
  ...validateKalkHitelesitesek(CALCULATORS, kalkHit, kalkOrokolt),
  // A külső források katalógusa: a KÖTÉSEIK a mi változóinkra mutatnak, és
  // egy átnevezés némán elszakítaná őket.
  ...validateKulsoForrasok(kulso, reg),
  // A copyleft származék helye a .gitignore-olt `helyi/` — nem emlékezet dolga.
  ...validateKulsoTerjesztes(kulso),
  ...drugs.validate(reg),
  ...diets.validate(reg),
  ...instruments.validate(reg),
  ...procedures.validate(reg),
  ...care.validate(reg),
  ...consults.validate(reg),
  ...points.validate(reg),
  ...validateIchomMapping(reg, ichom),
  ...promSets.validate(reg, instruments),
  ...validateTables(reg),
  ...codeRules.validate(reg),
  ...validateSnomedDistribution("registry/kodok/tablak"),
  ...validateVersionedCodes(reg),
];

for (const i of issues) console.log(i.severity, i.id, i.message);

const errors = issues.filter((i) => i.severity === "error").length;
const warnings = issues.length - errors;
console.log(
  `${reg.all().length} változó · ${complaints.all().length} panasztétel · ` +
  `${(() => { const m = megMerleg(docs.all(), megHit);
      return `${m.osszes} dokumentumtípus (${m.alairt} megőrzési idő aláírva, ` +
             `${m.horgonyElteres} horgonyeltérés)`; })()} · ` +
  `${normograms.all().length} normogram · ` +
  `${catalogue.charts.length} katalogizált görbe · ` +
  `${uiMap.menu.length} szülészeti + ${gynMap.menu.length} nőgyógyászati ` +
  `felületi szakasz · ` +
  `${anatomy.regions.length} anatómiai szervrendszer · ` +
  `${(() => {
      const m = sepMerleg(sepsis, CALCULATORS, sepKuszobHit, sepDontes);
      const d = dontesAllapot(sepsis, CALCULATORS, sepDontes);
      return `${sepsis.screen.criteria.length + sepsis.organDysfunction.criteria.length} ` +
             `szepszis-kritérium (${m.alairt}/${m.kuszobok} küszöb aláírva, ` +
             `${m.eltero} eltérő küszöb ${d.allapot === "dontve" ? "eldöntve" : "döntés nélkül"}, ` +
             `riasztás ${m.riaszt ? "engedve" : "zárva"})`;
    })()} · ` +
  `${screenings.all().length} szűrési szabály · ` +
  `${(() => { const m = rxMerleg(drugs.all());
      return `${m.hatoanyag} hatóanyag (terhességi állásfoglalás: ` +
             `${m.terhessegiBesorolassal}/${m.hatoanyag}, szoptatási: ` +
             `${m.szoptatasiAdattal}/${m.hatoanyag})`;
    })()} · ` +
  `${diets.all().length} diétás protokoll · ${(() => { const m = licMerleg(instruments.all(), licencek, MA_NAP);
      return `${m.osszes} mérőeszköz (${m.rendezett} rendezett, ` +
             `${m.rendezetlen} rendezetlen, ${m.felveheto} felvehető)`; })()} · ` +
  `${procedures.all().length} beavatkozás · ${care.all().length} gondozási protokoll · ` +
  `${consults.all().length} konzílium-javallat · ${points.all().length} mérési pont · ` +
  `${ichom.items.length} ICHOM-tétel · ${promSets.all().length} PROM-készlet · ` +
  `${tables.length} kódtábla · ${codeRules.all().length} kódszabály · ` +
  `${(() => {
      const a = kalkAllapot(CALCULATORS, kalkHit);
      const o = orokoltAllas(CALCULATORS, kalkHit, kalkOrokolt);
      const jelzes = a.filter((x) => x.monoton.length).length;
      return `${o.kapuMogott} kalkulátor kapu mögött, ${o.alairt} aláírva, ` +
             `${o.orokolt} öröklött` +
             (jelzes ? `, ${jelzes} nem monoton pontsorral` : "");
    })()} · ` +
  `${(() => {
      const s = telepitesiSorrend(catalogue, normograms.all(), ngLekepezes, reg);
      const t = telepitesMerleg(s);
      const h = ngAllapot(normograms.all(), ngHit)
        .filter((x) => x.allapot === "hitelesitve").length;
      return `${t.kotott}/${t.meresek} mérés leképezve, ${h} görbe hitelesítve ` +
             `(első kör: ${elsoKor(s).map((x) => x.base).join(", ")})`;
    })()} · ` +
  `${(() => { const m = refMerleg(hitelesitesAllapot(reg, refHit));
      return `${m.hitelesitve}/${m.osszes} referencia hitelesítve ` +
             `(${m.savokHatra} sáv vár összevetésre)`; })()} · ` +
  `${(() => { const m = riasztMerleg(riasztRend);
      const f = felulet(reg, CALCULATORS, instruments.all(),
        complaints.all().filter((c) => (c as { redflag?: boolean }).redflag).length);
      return `${m.kiadhato}/${m.tipus} riasztástípus kiadható ` +
             `(${f.osszes} riasztási pont, ${m.cimzettNelkul} címzett nélkül)`;
    })()} · ` +
  `${(() => { const m = keretMerleg(mirKeretek, MA_NAP);
      const k = m.meesKovetkezo;
      return `${m.keretek} keret (BELLA ${m.bellaStandard} standard, ` +
             `${m.bellaKotelezo} kötelező` +
             (k ? `; MEES 2.1: ${k.napMulva} nap a következő határidőig` : "") + `)`;
    })()} · ` +
  `${(() => { const m = mirMerleg(mirFa, mirMx, mirAll, MA_NAP);
      return `MIR: ${m.hatalyos}/${m.dokumentum} dokumentum hatályban ` +
             `(első kör ${m.elsoKorHatalyos}/${m.elsoKor}` +
             (m.lejart ? `, ${m.lejart} lejárt` : "") + `), ` +
             `${m.bizonyitott}/${m.kontroll} ISO-kontroll bizonyítva`; })()} · ` +
  `${(() => {
      const e = ettErtekel(ettDosszie, ettBiz);
      const m = ettMerleg(e);
      return `ETT-dosszié: ${m.fedett}/${m.osszes - m.szervezeti} rendszertétel fedett, ` +
             `${m.megalapozatlan + m.reszben} megalapozatlan (` +
             `${ettBeadhato(e).beadhato ? "beadható" : "NEM adható be"})`;
    })()} · ` +
  `${(() => { const m = eesztMerleg(eesztCs, ettBiz);
      return `EESZT: ${m.alloKapu}/${m.kapu} kapu áll ` +
             `(${m.csatlakozhato ? "csatlakozhat" : "éles csatlakozás ZÁRVA"})`;
    })()} · ` +
  `${(() => {
      const a = pilotElofeltetelek(pilot, ettBiz);
      const m = pilotMerleg(a, zarasAllas(pilot, a), pilotIndithato(pilot, a));
      return `Pilot: ${m.allo}/${m.elofeltetel} előfeltétel áll ` +
             `(${m.kimondatlan} kimondatlan), ${m.merheto}/${m.zarasi} zárási ` +
             `kritérium mérhető (${m.indithato ? "indulhat" : "NEM indulhat"})`;
    })()} · ` +
  `${(() => {
      const m = auditMerleg(hurok, auditAllas(hurok, {}), auditMezokLista);
      return `Audit-hurok: ${m.bekotott}/${auditMezokLista.length} mező bekötve, ` +
             `${m.kozolheto}/${m.par} pár közölhető ` +
             `(${m.vizsgaltEset} eset, ${m.kuszobHianyzik} küszöb hiányzik)`;
    })()} · ` +
  `${(() => {
      const k = vdKerdoiv.ivek.length;
      const kerdes = vdKerdoiv.ivek.reduce((n2, i) => n2 + i.kerdesek.length, 0);
      const folyamatos = vdOltas.naptar.filter((o) => o.utemezes === "folyamatos").length;
      const kampany = vdOltas.naptar.filter((o) => o.utemezes === "kampany").length;
      const naptar = naptarKapu(vdOltas);
      return `Védőnő: ${k} szűrési időpont (${kerdes} kérdés), ` +
             `${vdKorzet.korzetek.length} körzet, ` +
             `audiogram ${vdAudio.hitelesitesek.length ? "aláírva" : "sávok aláíratlan"}, ` +
             `oltás ${folyamatos} életkori + ${kampany} évfolyami ` +
             `(naptár ${naptar.allapot}${naptar.adItel ? "" : ", NEM ad esedékességet"})`;
    })()} · ` +
  `${(() => {
      const m = endoMerleg(reg.all().filter((v) => ENDO_RE.test(v.id)));
      const a = analitMerleg(analitok, reg);
      return `Endokrin: ${m.meres - m.nema}/${m.meres} mérés megszólal ` +
             `(${m.kuszobbel} küszöbbel, ${m.referenciaval} referenciával, ` +
             `${m.nema} NÉMA) · ` +
             `${a.csoport} analit-csoport (${a.kontextusfuggo}/${a.tag} kontextusfüggő küszöbbel)`;
    })()} · ` +
  `${(() => {
      const p = paramMerleg(parameterek, [], MOST);
      // A BTK-TÁBLA ALÁÍRÁSA a besorolás használhatóságát dönti el.
      const cs = csatMerleg(csatornak);
      const ib = isberMerleg(isber);
      const h = hianyMerleg(HIANY_MIND);
      const tk = terkepMerleg(terkep);
      return `Modul: ${tk.modul} (${tk.doksiNelkul} doksi, ${tk.kodNelkul} kód, ` +
             `${tk.tesztNelkul} teszt nélkül) · ` +
             `Csatorna: ${cs.osszes} (${cs.mukodik} működik, ` +
             `${cs.onmagabanEleg} önmagában elég, ${cs.potlassal} pótlással) · ` +
             `${(() => {
                const sp = sorosMerleg(sorosProfilok);
                const dc = dicomMerleg(dicom);
                return `Soros: ${sp.profil} profil (${sp.beteg} beteg, ` +
                       `${sp.kornyezet} környezeti, ${sp.hianyos} HIÁNYOS, ` +
                       `${sp.esemenyvezerelt} eseményvezérelt, ` +
                       `${sp.azonositoNelkul} azonosító nélkül) · ` +
                       `DICOM: ${dc.csomopont} csomópont + ${dc.webVegpont} web ` +
                       `(${dc.szolgaltatas} szolgáltatás, ${dc.tlsNelkul} TLS nélkül, ` +
                       `${dc.veglegesithetoArchivum} véglegesíthető archívum, ` +
                       `oldalkocsi: ${dc.oldalkocsiKesz ? "kész" : "TERVEZETT"})`;
             })()} · ` +
             `${(() => {
                const kd = kardioMerleg(mwho, kardioJelek);
                const pl = pallMerleg(palliativ);
                return `Kardiológia: ${kd.allapot} állapot ${kd.osztaly} mWHO-osztályban ` +
                       `(${kd.legmagasabb} a legmagasabbban, ${kd.tobbOsztalyuDiagnozis} ` +
                       `diagnózis több osztályban), ${kd.jel} jel ` +
                       `(${kd.kontextusfuggo} kontextusfüggő), ` +
                       `${kd.mwhoAlairt ? "aláírva" : "ALÁÍRATLAN — tájékoztató"} · ` +
                       `Palliatív: ${pl.fajta} fajta, ${pl.cel} ellátási cél ` +
                       `(${pl.felnottCel} felnőtt, ${pl.perinatalisCel} perinatális), ` +
                       `${pl.tunetkor} tünetkör, ${pl.atadas} átadási rés, ` +
                       `${pl.gepiHatarral}/${pl.jogiFeltetel} jogi feltételnél kimondott ` +
                       `gépi határ, ${pl.alairt ? "aláírva" : "ALÁÍRATLAN"} · ` +
                       `Modulcímek: ${(() => { const c = cimMerleg(modulcimek);
                         return `${c.modul} cím ${c.csoport} csoportban, ` +
                                `${c.forditatlan} fordítatlan, ${c.leirasNelkul} leírás nélkül`; })()} · ` +
                       `Feladatprofil: ${(() => { const f = feladatMerleg(feladatok, szakaszok);
                         return `${f.profil} profil, ${f.lefedettModul}/${f.osszesModul} modul lefedve`; })()}` +
                       ` · Funkciók: ${(() => { const f = funkcioMerleg(funkciok, reg.all().filter((v) => !v.aliasOf));
                         return `${f.szakasz} szakasz (${f.virtualis} virtuális), ${f.funkcio} funkció, ${f.fedett} mező fedve, ${f.athelyezett} áthelyezve` +
                           (f.tervezett ? `, ${f.tervezett} tervezett` : ""); })()}`;
             })()} · ` +
             `ISBER: ${ib.fedett}/${ib.osszes} fedett (${ib.reszben} részben) · ` +
             `Hiányjegyzék: ${h.osszes} tétel (${h.blokkolo} BLOKKOLÓ, ` +
             `${h.szervezeti} szervezeti, ${h.fejlesztoi} fejlesztői) · ` +
             `Karbantartás (37): ${p.osszes} paraméter ` +
             `(${p.klinikai} klinikai, ${p.alairastErinto} aláírást érint) · ` +
             `Btk. korviszony: ${btk.matrix.length} cella, ` +
             `${btk.alairas ? "aláírva" : "ALÁÍRATLAN — tájékoztató"}`;
    })()} · ` +
  `${(() => {
      const m = mecMerleg(mec);
      // A KIÍRT SZÁMOK MIND A SOROKBÓL SZÁMOLÓDNAK. Korábban itt a
      // „lábjegyzettel megjelölt sorok” száma szerepelt „kezdés/folytatás
      // bontás” néven — két különböző mennyiség, és a szöveg a rosszabbikat
      // állította a jóról.
      return `MEC: ${m.sor} sor × ${m.modszer} módszer = ${m.cella} cella, ` +
             `${m.fazisElter} soron a kezdés ≠ folytatás, ` +
             `${m.vagylagos} vagylagos, ${m.nemErtelmezheto} NA, ` +
             `${m.chcbol} sor közös CHC-cellából`;
    })()} · ` +
  `${(() => {
      const st = adatkeszletek.statisztika;
      return `Adatkészletek: ${st.tetel} (${st.hozzaferes["nyilt"] ?? 0} nyílt, ` +
             `${st.hozzaferes["kerelmes"] ?? 0} kérelmes), AFR ${st.regio["AFR"] ?? 0}, ` +
             `${adatkeszletek.tabla_hibak.length} ellentmondás a forrástáblában`;
    })()} · ` +
  `${(() => {
      const surgos = mutok.mutok.filter((m) => m.surgosAlkalmas).length;
      const alairt = mutok.hitelesitesek.length > 0;
      const hm = helyMerleg(helyek);
      const idozitett = (helyek.helyek as SzerkesztettKeszlet["helyek"])
        .filter((h) => h.ervenyesTol || h.ervenyesIg).length;
      return `Hely: ${hm.hely} elem ${Object.keys(hm.fajtankent).length} fajtából, ` +
             `mélység ${hm.maxMelyseg}${hm.torott ? `, ${hm.torott} TÖRÖTT lánc` : ""}` +
             `, ${idozitett} időzített szakasz · ` +
             `${agyszam(helyek, "hely.klinika")} ágy ` +
             `(${helyek.helyek.filter((h) => h.roomingIn).length} rooming-in, ` +
             `0 állapot rögzítve) · ${mutok.mutok.length} műtő (${surgos} sürgősre ` +
             `alkalmas, tartalék ${mutok.surgossegiTartalek}` +
             `${alairt ? "" : ", ALÁÍRATLAN — elektív foglalás nem indul"})`;
    })()} · ` +
  `${(() => { const m = cmsMerleg(cms, MOST);
      return `CMS: ${m.tartalom} tartalom (${m.tajekoztato} tájékoztató), ` +
             `${m.publikalhato} publikálható` +
             `${m.lejart ? `, ${m.lejart} LEJÁRT` : ""}` +
             `${m.hamarosanLejar ? `, ${m.hamarosanLejar} hamarosan lejár` : ""}` +
             `${m.datumNelkul ? `, ${m.datumNelkul} dátum nélkül` : ""}`;
    })()} · ` +
  `${(() => {
      const j = aiModellek.jeloltek as Array<{ tanitoAdat?: { md5?: string | null; id: string } }>;
      const hangok = new Set(j.map((x) => x.tanitoAdat?.md5
        ? `md5:${x.tanitoAdat.md5}` : `id:${x.tanitoAdat?.id ?? "?"}`));
      return `Modellpanel: ${j.length} jelölt, ${hangok.size} FÜGGETLEN hang`;
    })()} · ` +
  `CTG: ${figo.jellemzok.length} jellemző, ${figo.besorolasok.length} besorolási szabály ` +
  `(${figo.hitelesitesek.length ? "aláírva" : "ALÁÍRATLAN, csak tájékoztató"}) · ` +
  `${(() => { const m = jelMerleg(jelentes);
      return `Jelentés: ${m.adatkor} adatkör, ${m.szamolhato}/${m.tetel} tétel ` +
             `számolható${m.hianyos ? `, ${m.hianyosAdatkor} KIVONAT` : ""}`;
    })()} · ` +
  `${(() => {
      const t = backlog.tetelek;
      const v = t.filter((x) => x.kimenet === "valoszinuseg").length;
      const kesz = t.filter((x) => x.allapot === "megvan").length;
      const adat = t.filter((x) => x.allapot === "adatHianyzik").length;
      return `Számítás-hátralék: ${t.length} tétel (${v} VALÓSZÍNŰSÉGET ír ki — ` +
             `MDR 11. szabály), ${kesz} kész, ${adat} csak adatra vár`;
    })()} · ` +
  `Szabálykészlet: ${SPR_KESZLETEK.length} tábla, ` +
  `${SPR_KESZLETEK.reduce((n, k) => n + k.szabalyok.length, 0)} sor · ` +
  `Egységtábla: ${Object.keys(egysegek.irasvaltozatok).length} írásváltozat, ` +
  `${Object.keys(egysegek.atvaltasok).length} analit átváltással · ` +
  `${(() => { const m = fedesMerleg(fedesek);
      return `Fedés: ${m.dontes} eldöntött pár (${m.kulon} külön, ${m.fedes} fedés` +
             `${m.nyitott ? `, ${m.nyitott} NYITOTT` : ""})`;
    })()} · ` +
  `${(() => { const m = profilMerleg(reg);
      return `Profil: allergia EGYESÍTVE (${m.entitas} mező az entitásban` +
             `${m.maradek ? `, ${m.maradek} SZÉTSZÓRT` : ""}` +
             `${m.masKerdes ? `, ${m.masKerdes} csak névben allergia` : ""})`;
    })()} · ` +
  `${(() => { const m = mdrMerleg(mdr);
      return `MDR: ${m.megvalaszolt}/${m.kerdes} besorolási kérdés, ` +
             `${m.dokKesz}/${m.dokTetel} műszaki tétel ` +
             `(AI-almodul ${m.aiNyithato ? "nyitható" : "ZÁRVA"})`;
    })()} · ` +
  `${(() => { const m = panelMerleg(licPanel, MA_NAP);
      return `Licenc: ${m.aktiv}/${m.tetel} aktív ` +
             `(${m.aktivalhato} aktiválható, ${m.nemAktivalhato} nem az)`;
    })()} · ` +
  `${(() => { const m = gyMerleg(gyKuszob, gyOssz);
      return `Perinatális: ${m.alairt}/${m.kuszob} küszöb aláírva, ` +
             `összerendelés ${m.osszerendelheto ? "lehetséges" : "ZÁRVA"}`;
    })()} · ` +
  `${(() => { const m = aiMerleg(aiModellek);
      return `AI: ${m.hasznalhato}/${m.jelolt} modell használható ` +
             `(${m.licencMiatt} licenc miatt zárva, ${m.blokkolo} blokkoló követelmény)`;
    })()} · ` +
  `${(() => { const m = teleMerleg(tele);
      return `Telemedicina: ${m.konzultacio} konzultációtípus, ${m.laikusKeres} laikus ` +
             `kérés, ${m.veszjel} vészjel-kérdés`;
    })()} · ` +
  `${(() => { const m = exMerleg(exass);
      return `ExAssist: ${m.protokoll} vizsgálati protokoll ` +
             `(${m.hitelesitett} hitelesítve, ${m.kotelezo}/${m.tetel} kötelező tétel, ` +
             `${m.bovites} bővítés)`;
    })()} · ` +
  `${(() => { const m = nemaMerleg(reg);
      return `${m.kuszobbel}/${m.mennyisegi} mérésnek van küszöbe ` +
             `(${m.nemaKezzel} néma, kézzel bevitt, ${m.modulok} modulban)`;
    })()} · ` +
  `${(() => { const m = helyiMerleg(normograms.all());
      return `${m.helyiTabla} helyi tábla (${m.savOsszes} sáv, ` +
             `${m.savVekony} a minimum alatt, ${m.eltolt}/${m.osszevetve} ` +
             `rendszeresen eltolt a publikálthoz képest)`;
    })()} · ` +
  `${kulso.length} külső forrás (${kulso.reduce((n, f) => n + f.tetelek.length, 0)} tétel, ` +
  `ebből ${atvettTetelek(kulso).length} átvéve, ` +
  `${hivatkozhatoTetelek(kulso).length} hivatkozható) — ` +
  `${errors} hiba, ${warnings} figyelmeztetés`,
);
process.exit(errors ? 1 : 0);
