/**
 * Katalógus-lefedettség modulonként.
 *
 *   node tools/gen-coverage.ts > docs/fejlesztes/11-lefedettseg.md
 *
 * ~4000 változónál a haladást mérni kell, különben nem derül ki, hogy egy
 * modul „kész”-nek látszik, miközben a felét sem tartalmazza.
 */
import { readdirSync, readFileSync } from "node:fs";
import { loadRegistry } from "../core/load.ts";
import { loadDocuments } from "../core/docs/registry.ts";
import { loadComplaints } from "../core/complaints/registry.ts";
import { loadNormograms } from "../core/us/normogram.ts";
import { loadScreenings } from "../core/screening/registry.ts";
import { loadDrugs } from "../core/rx/registry.ts";
import { loadDietProtocols } from "../core/diet/registry.ts";
import { loadInstruments } from "../core/kerdoiv/registry.ts";
import { loadProcedures } from "../core/op/registry.ts";
import { loadCareProtocols, loadConsultRules } from "../core/plan/registry.ts";
import { loadPoints } from "../core/followup/points.ts";
import { loadIchomSpec, mapping } from "../core/followup/ichom.ts";
import { loadPromSets } from "../core/prom/sets.ts";
import { loadCodeTables, missingStems } from "../core/coding/tables.ts";
import { elemzesiLefedettseg, loadBesorolas } from "../core/finanszirozas/besorolas.ts";
import { loadCodeRules } from "../core/coding/rules.ts";

/** A `docs/modulok/` becslései — a tervezett nagyságrend, nem pontos előrejelzés. */
const TARGET: Record<string, [string, number]> = {
  "01": ["Panaszok", 120], "02": ["Orvoshoz fordulás oka", 25],
  "03": ["Anamnézis", 230], "04": ["Státusz", 280], "05": ["Vizsgálatok", 520],
  "06": ["Gyógyszerelés", 90], "07": ["Diéta", 35], "08": ["Pszichológia", 60],
  "09": ["Epikrízis", 70], "10": ["Szülőszoba", 200], "11": ["Műtő", 110],
  "12": ["Onkológia", 120], "13": ["Ellátás tervezés", 50], "14": ["Zárójelentés", 40],
  "15": ["Utánkövetés", 90], "16": ["Betegelégedettség", 45], "17": ["Kódolás", 80],
  "18": ["Minőségbiztosítás", 60], "19": ["CRM", 600], "20": ["Statisztika", 40],
  "21": ["Foglalkozás-egészségügy", 350], "22": ["Biobank", 180],
  "23": ["Genetika", 220], "24": ["IVF", 300], "25": ["Admin", 120],
};

const reg = loadRegistry("registry/variables");
const docs = loadDocuments("registry/documents/core.json");
const complaints = loadComplaints("registry/complaints");
const normograms = loadNormograms("registry/normogramok");
const screenings = loadScreenings("registry/szuresek");
const drugs = loadDrugs("registry/gyogyszerek");
const diets = loadDietProtocols("registry/dieta");
const instruments = loadInstruments("registry/kerdoivek");
const procedures = loadProcedures("registry/beavatkozasok");
const care = loadCareProtocols("registry/gondozas");
const consults = loadConsultRules("registry/gondozas");
const points = loadPoints("registry/utankovetes");
const ichomSpec = loadIchomSpec("registry/ichom-pcb-v5.seed.json");
const promSets = loadPromSets("registry/prom");
const codeTables = loadCodeTables("registry/kodok/tablak");
const codeRules = loadCodeRules("registry/kodok");
const bes = elemzesiLefedettseg(
  loadBesorolas("registry/finanszirozas/hbcs-besorolas.json"));

/** Melyik fájlban hány változó van — a fájlnév előtagja a modulszám. */
const perFile = new Map<string, number>();
for (const f of readdirSync("registry/variables").filter((x) => x.endsWith(".json")).sort()) {
  const n = (JSON.parse(readFileSync(`registry/variables/${f}`, "utf8")) as unknown[]).length;
  perFile.set(f.slice(0, 2), n);
}

const out: string[] = [];
const p = (s = "") => out.push(s);
const bar = (pct: number) => {
  const full = Math.round(Math.min(pct, 100) / 10);
  return "█".repeat(full) + "░".repeat(10 - full);
};

const total = reg.all().length;
const targetTotal = Object.values(TARGET).reduce((a, [, n]) => a + n, 0);

p("# 11 — Katalógus-lefedettség");
p();
p("> **Ez a fájl generált.** Forrása a `registry/variables/`; a");
p("> `node tools/gen-coverage.ts` állítja elő, és a CI ellenőrzi.");
p();
p(`**${total} változó** a tervezett **~${targetTotal}**-ból — `
  + `**${((total / targetTotal) * 100).toFixed(1)}%**.`);
p();
p("A tervezett szám a `docs/modulok/` becslése: **nagyságrend, nem előrejelzés**. Arra jó,");
p("hogy lássuk, hol van a munka tömege — és hogy egy modul ne látsszon késznek, amíg a");
p("felét sem tartalmazza.");
p();
p("| # | Modul | Megvan | Tervezett | Haladás | |");
p("|---|---|---:|---:|---:|---|");
// A JS az egész-szám-szerű objektumkulcsokat („10", „11"…) előre veszi, a
// „01"-et nem — ezért EXPLICIT rendezés kell, különben a táblázat összekeveredik.
const rows = Object.entries(TARGET).sort(([a], [b]) => Number(a) - Number(b));
for (const [num, [name, target]] of rows) {
  const have = perFile.get(num) ?? 0;
  const pct = (have / target) * 100;
  p(`| ${num} | ${name} | ${have} | ${target} | ${pct.toFixed(0)}% | \`${bar(pct)}\` |`);
}
p();

p("## Amit a szám nem mond meg");
p();
p("A lefedettség **darabszám, nem minőség**. Egy modul akkor kész, ha a");
p("[`04-modul-csontvaz.md`](04-modul-csontvaz.md) kilenc tétele hiánytalan — köztük a");
p("klinikai átvétel, ami nem mérhető változószámmal.");
p();
p("Két dolog, amit érdemes külön nézni:");
p();

const tri = reg.all().filter((d) => d.datatype === "tristate").length;
const free = reg.all().filter((d) => d.datatype === "text").length;
const findings = reg.all().filter((d) => d.finding).length;
const patientEntry = reg.all().filter((d) => d.patientEntry).length;
const phi = reg.all().filter((d) => d.phi).length;

p("| Jellemző | Darab | Arány | Cél |");
p("|---|---:|---:|---|");
p(`| Szabad szöveg (\`text\`) | ${free} | ${((free / total) * 100).toFixed(1)}% | ≤ 10% |`);
p(`| Háromállású kérdés | ${tri} | ${((tri / total) * 100).toFixed(1)}% | anamnézisben mind |`);
p(`| Click-open lelet | ${findings} | — | a fizikális státusz egésze |`);
p(`| Beteg tölti ki | ${patientEntry} | ${((patientEntry / total) * 100).toFixed(1)}% | az anamnézis egésze |`);
p(`| Beteg-azonosító (\`phi\`) | ${phi} | — | jelölve |`);
p();
p(`**${docs.all().length} dokumentumtípus** definiálva, mind ellátási dokumentáció.`);
p();

// A panaszszótár nem változó, ezért a fenti táblázatban nem látszik — pedig a
// 01. modul értékének a nagyobbik fele ez, és a terv is külön becsülte (~400).
const withSyn = complaints.all().filter((t) => t.synonyms.length).length;
const synTotal = complaints.all().reduce((a, t) => a + t.synonyms.length, 0);
const redflags = complaints.all().filter((t) => t.redflag || t.redflagWhen?.length).length;
p("## Panaszszótár");
p();
p("A szótár tételei nem változók, ezért a fenti táblázatban nem szerepelnek — pedig a");
p("`01` modul értékének a nagyobbik fele ez. A keresés minősége dönti el, hogy a");
p("klinikus a kódolt tételt választja-e a szabad szöveg helyett.");
p();
p("| Jellemző | Darab |");
p("|---|---:|");
p(`| Panasztétel | ${complaints.all().length} (tervezett ~400) |`);
p(`| Szinonima összesen | ${synTotal} |`);
p(`| Tétel legalább egy szinonimával | ${withSyn} |`);
p(`| Vörös zászló (feltétlen vagy feltételes) | ${redflags} |`);
p();

// A referenciák, normogramok és szűrési szabályok szintén nem változók, de a
// klinikai értékük nagy — és a KAPUK miatt látni kell, mennyi áll még
// ellenőrizetlenül.
const withRef = reg.all().filter((d) => d.reference).length;
const assumedRef = reg.all().filter((d) => d.reference?.verification === "assumed").length;
const ngPrimary = normograms.all().filter((n) => n.verification === "primary").length;
p("## Referenciák, normogramok, szűrések");
p();
p("Ezek nem változók, de klinikailag ugyanolyan súlyúak — és mindhármat **kapu**");
p("védi: ellenőrizetlen tábla nem ad percentilist, ismeretlen terhességi állapot");
p("nem kap referenciatartományt, hiányzó anamnézis nem lesz „nem vonatkozik rá”, és\nellenőrizetlen gondozási alaptáblából nem lesz elmulasztott vizit.");
p();
p("| Jellemző | Darab |");
p("|---|---:|");
p(`| Referenciatartománnyal ellátott változó | ${withRef} |`);
p(`| Ebből még FELTÉTELEZETT (ellenőrizendő) | ${assumedRef} |`);
p(`| Normogram | ${normograms.all().length} |`);
p(`| Ebből visszaellenőrzött (percentilist ad) | ${ngPrimary} |`);
p(`| Szűrési szabály | ${screenings.all().length} |`);
p(`| Hatóanyag a gyógyszertörzsben | ${drugs.all().length} (tervezett ~5592 PUPHA-tétel) |`);
p(`| Ebből kontraindikáció-kapuval | ${drugs.all().filter((d) => d.gates?.length).length} |`);
p(`| Diétás protokoll | ${diets.all().length} |`);
p(`| Validált mérőeszköz | ${instruments.all().length} |`);
p(`| Ebből FELVEHETŐ (licencelt tételszöveg) | ${instruments.all().filter((i) => i.itemText.status !== "notLicensed").length} |`);
p(`| Ebből validált magyar fordítással | ${instruments.all().filter((i) => i.translation.status === "validated").length} |`);
p(`| Beavatkozás OENO-kóddal | ${procedures.all().filter((p2) => p2.oeno).length} / ${procedures.all().length} |`);
p(`| Gondozási protokoll | ${care.all().length} |`);
p(`| Ebből elsődleges forrásból ellenőrzött | ${care.all().filter((c) => c.verification === "primary").length} |`);
p(`| Vizitrend-módosító (rizikó szerinti sűrítés) | ${care.all().reduce((a, c) => a + c.modifiers.length, 0)} |`);
p(`| Konzílium-javallat | ${consults.all().length} |`);
p(`| ICHOM mérési pont | ${points.all().length} |`);
p(`| ICHOM-tétel a szabványban | ${ichomSpec.items.length} |`);
p(`| Ebből saját mezőre leképezve | ${mapping(reg).size} |`);
p(`| PROM-készlet mérési pontonként | ${promSets.all().length} |`);
p(`| Beteg által kitöltendő (\`prom.*\`) változó | ${reg.all().filter((d) => d.module === "prom").length} |`);
/**
 * A REPÓBAN LÉVŐ ÉS A HELYBEN TELEPÜLŐ TÖRZS KÜLÖN SZÁMOL.
 *
 * Három nagy törzs (`tbl-diag`, `tbl-eszkoz`, `tbl-gyfkod`) szándékosan nem
 * kerül a repóba (méret; ld. `.gitignore`), a SNOMED-törzs pedig licenc
 * miatt nem is kerülhet. Ha ez a dokumentum a GÉPEN TALÁLT törzseket
 * számolná, akkor **más számot adna friss klónon, mint a fejlesztő gépén** —
 * és a `docs:check` egy tiszta munkamásolaton elbukna, holott semmi nem
 * romlott el. Ami a repóban van, azt a szám mondja; ami helyben települ, azt
 * külön sor.
 */
const LOCAL_ONLY = new Set(["tbl.diag", "tbl.eszkoz", "tbl.gyfkod"]);
const committed = codeTables.filter((t) => !LOCAL_ONLY.has(t.id));

p(`| Kódtábla a repóban | ${committed.length} |`);
p(`| Ebből TELJES törzs (nem részhalmaz) | ${committed.filter((t) => t.coverage === "full").length} |`);
p(`| Kódtétel összesen a repóbeli törzsekben | ${committed.reduce((a, t) => a + Object.keys(t.rows).length, 0)} (tervezett ~13 000) |`);
// a HELYBEN TELEPÜLŐ törzsek LISTÁJA állandó — ha azt írnánk ki, hány van
// épp betöltve, a dokumentum megint gépenként más lenne
p(`| Helyben települő törzs (nem a repóban) | ${LOCAL_ONLY.size}: ${[...LOCAL_ONLY].join(", ")} |`);
p(`| Kódajánlási szabály | ${codeRules.all().length} |`);
// A BESOROLÁS KÉT SZÁMA. Az elsőt könnyű büszkén kiírni, a második az őszinte:
// egy 773 csoportos táblázat, aminek a szabályaiból 596 értékelhető ki géppel,
// nem „kész” — de nem is „nincs meg”.
p(`| HBCS-csoport a besorolási táblázatban | ${bes.osszes} |`);
p(`| Ebből GÉPPEL KIÉRTÉKELHETŐ szabályú | ${bes.elemzett} (${bes.szazalek}%) |`);
p(`| **Hiányzó törzs** (nevesítve) | ${missingStems().length} |`);
p();
p("### Amelyik törzs nincs betöltve");
p();
p("A kódajánlás annyit tud, amennyi törzs be van töltve. Ami nincs, azt a rendszer nem");
p("pótolja becsléssel — de a hiányt sem hallgatja el:");
p();
p("| Törzs | Mi kellene hozzá |");
p("|---|---|");
for (const m of missingStems()) p(`| ${m.label} | ${m.needed} |`);
p(`| Ebből sürgős | ${consults.all().filter((c) => c.urgency === "urgent").length} |`);
p();

p("## A feltöltés sorrendje");
p();
p("A modulok függőségi sorrendje adja: **02 → 03 → 04 → 01 → 05 → …** Az ellátási");
p("kontextus (`02`) minden más modul kötelezőségét és érvényességi ablakát meghatározza,");
p("ezért az első; az anamnézis (`03`) a státusz és a gyógyszerelés kapuit tölti fel.");
p();
p("A `19` CRM és a `21` foglalkozás-egészségügy **meglévő rendszerek átvétele**, nem új");
p("katalógus — ezek a séma-egyesítéskor kerülnek be, nem kézi felvétellel.");
p();
p("## Egy magbeli feladat, amit a feltöltés hozott elő");
p();
p("A `ctx.gaSource` most **rögzített tény**, de a gesztációs kort még mindig a");
p("`calc.ga.lmp` számolja, kizárólag az utolsó menstruációból. A `02` modul szerinti");
p("**precedencia** — IVF-transzfer → korai CRL → LMP → késői biometria — még nincs");
p("megvalósítva, és ehhez a kalkulátor-rétegnek is bővülnie kell:");
p();
p("- kellenek a bemenetek: `us.crl.first` (a `05` modulból) és `ctx.ivfTransferDate`;");
p("- a `runCalc` ma **minden** bemenetet megkövetel — a precedencia viszont épp azt");
p("  jelenti, hogy az elsőt használjuk, ami elérhető. Ez a futtató szándékos");
p("  szigorúságának egyetlen indokolt kivétele, és külön kalkulátor-fajtát kíván.");
p();
p("Amíg ez nincs meg, a `gaSource` a **terhesgondozási lapon jelenik meg** rögzített");
p("tényként — a doksi szerint a forrásnak mindig látszania kell —, de a számítást nem");
p("vezérli. Ezt ki kell mondani, nehogy valaki azt higgye, hogy már működik.");

console.log(out.join("\n"));
