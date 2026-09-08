/**
 * FELÜLETTÉRKÉP — a meglévő rendszer, mint mérték.
 *
 * Egy működő szülészeti rendszer menüfája és adatlapjai azt mondják meg, MIT
 * KELL TUDNI, a szakma által kitaposott szerkezetben. A térkép ebből
 * LEFEDETTSÉGET csinál — és ami fontosabb: megnevezi, mi az, ami a régi
 * felületről NEM vehető át változatlanul.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import {
  auditFields, loadUiMap, moduleCoverage, uiStamp, validateUiMap,
} from "../core/ui/felulet.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));
const MAP = loadUiMap(join(HERE, "..", "registry", "felulet", "szuleszeti-felulet.json"));

/* ── 1. A TÉRKÉP ÉP ─────────────────────────────────────────────────── */

test("a felülettérkép hiba nélkül validál", () => {
  assert.deepEqual(validateUiMap(MAP, REG).filter((i) => i.severity === "error"), []);
});

test("a menüfa összefüggő — nincs lógó ág", () => {
  // Egy hiányzó szülő menüpont azt jelentené, hogy a fa átvétele hiányos, és
  // a lefedettség mérése ezért téves.
  const labels = new Set(MAP.menu.map((m) => [...m.path, m.label].join(" › ")));
  for (const m of MAP.menu) {
    for (let i = 1; i <= m.path.length; i++) {
      assert.ok(labels.has(m.path.slice(0, i).join(" › ")), m.label);
    }
  }
  assert.ok(MAP.menu.length >= 50);
});

test("a RÉSZLEGES térkép megmondja, mi maradt ki", () => {
  assert.equal(MAP.coverage, "partial");
  assert.match(MAP.coverageNote!.hu!, /menüfa TELJES/);
});

/* ── 2. A LEFEDETTSÉG NEM BECSLÉS ───────────────────────────────────── */

test("a modulszám → változó leképezés MAGÁBÓL A REGISZTERBŐL jön", () => {
  // Kézzel karbantartott lista fél éven belül hazudna — ugyanaz a szabály,
  // mint a levezetési gráfnál.
  assert.ok(Object.keys(MAP.modulePrefixes).length >= 15);
  for (const [, mods] of Object.entries(MAP.modulePrefixes)) {
    for (const m of mods) {
      assert.ok(REG.all().some((d) => d.module === m), `ismeretlen modulérték: ${m}`);
    }
  }
});

test("az ultrahang húsz felületi szakasza a legnagyobb blokk", () => {
  const cov = moduleCoverage(MAP, REG);
  const m5 = cov.find((c) => c.module === 5)!;
  assert.ok(m5.sections.length >= 20);
  assert.ok(m5.variables > 200);
  assert.ok(m5.sections.some((s) => s.includes("Anyai képletek")));
});

test("a genetikai szakaszokhoz EGYETLEN változó sincs — és ezt kimondja", () => {
  const g = moduleCoverage(MAP, REG).find((c) => c.module === 23)!;
  assert.equal(g.variables, 0);
  assert.ok(g.sections.length >= 3);
  assert.match(g.why, /MÉG EGYETLEN változófájlja sincs/);
});

test("a „Beteg adatok” szakasznak NINCS modulja — ez lelet, nem hiányosság", () => {
  // A meglévő rendszerben a személyes és adminisztratív adat EGY képernyő; a
  // tervben ilyen modul nincs, a mezők három modul közt szórva élnek.
  const orphan = moduleCoverage(MAP, REG).find((c) => c.module === null)!;
  assert.ok(orphan.sections.includes("Beteg adatok"));
  assert.match(orphan.why, /egyik OGDOC-modulhoz sincs hozzárendelve/);
});

/* ── 3. AMI NEM VEHETŐ ÁT VÁLTOZATLANUL ─────────────────────────────── */

test("az etnikai mezők NEM másolhatók át — GDPR 9. cikk", () => {
  const eth = auditFields(MAP, REG)
    .filter((a) => a.status === "refused" && /GDPR 9\. cikk/.test(a.why));
  assert.ok(eth.length >= 5);   // anya · partner · partner két szülője · szűrőteszt(ek)
  assert.match(eth[0].why, /SOHA nem folyhat be csendben egy számításba/);
});

test("négy párhuzamos mértékegység-mező nem vehető át", () => {
  // A testsúly kg-ban, stones/font-ban ÉS lbs-ben, a testmagasság cm-ben ÉS
  // láb/inchben: négy mező négyféle igazságot tud tárolni ugyanarról.
  const u = auditFields(MAP, REG).filter((a) => /PÁRHUZAMOS MÉRTÉKEGYSÉG/.test(a.why));
  assert.ok(u.length >= 3);
  assert.match(u[0].why, /az egység az ÉRTÉKHEZ tartozik/);
});

test("az „eseménytelen családi anamnézis” pipa nem írhat felül kilenc állítást", () => {
  const a = auditFields(MAP, REG).filter((x) => /ÖSSZES NEGATÍV/.test(x.why));
  assert.ok(a.length >= 2);   // páciens · partner · „komplikációmentes beavatkozás”
  assert.match(a[0].why, /nem nyilatkoztak/);
  // és a forrásrendszer maga mond ellent neki: a kilenc tétel „ismeretlen”
  const csal = MAP.forms.find((f) => f.id === "form.csaladiAnamnezis")!;
  assert.ok(csal.fields.filter((f) => /^Páciens családjában/.test(f.label)).length >= 9);
});

test("a családon belüli erőszak nem `phi` kérdés, hanem BIZTONSÁGI", () => {
  const a = auditFields(MAP, REG).find((x) => /BIZTONSÁGI KOCKÁZAT/.test(x.why))!;
  assert.equal(a.status, "refused");
  assert.match(a.why, /nyomtatott dokumentumon megjelenve/);
});

test("a HL7-ből érkező mezők nem kézi mezők", () => {
  const iface = auditFields(MAP, REG).filter((a) => a.status === "interface");
  assert.ok(iface.length >= 10);
  assert.match(iface[0].why, /HL7 v2 ADT\/ORM/);
  assert.match(iface[0].why, /némán szétcsúsztatja/);
});

test("a magzat nemének közlése a beteg KÉRÉSÉN múlik — ez kapu a kimeneten", () => {
  const f = MAP.forms.find((x) => x.id === "form.jelenTerhesseg")!
    .fields.find((x) => x.gatesOutput)!;
  assert.match(f.label, /magzat nemét/);
  assert.match(f.note!, /nem jelenhet meg a betegnek szóló szövegben/);
});

test("az apai gyógyszerlap nem másolt űrlap, hanem másik alany", () => {
  const apai = MAP.forms.find((x) => x.id === "form.apaiGyogyszerek")!;
  assert.match(apai.note!.hu!, /másik példány-dimenzióban/);
  assert.match(apai.note!.hu!, /önálló kockázati tényező/);
});

test("a levezetett mező a régi felületen kézzel töltendő — nálunk nem", () => {
  const derived = auditFields(MAP, REG).filter((a) => a.status === "derived");
  assert.ok(derived.some((d) => d.field === "Település"));
  assert.match(derived[0].why, /a felületen nem beírandó/);
});

test("a beteg-azonosításra alkalmas mezők jelölése kötelező", () => {
  const phi = MAP.forms.flatMap((f) => f.fields).filter((f) => f.phi);
  assert.ok(phi.length >= 20);
  const gaps = auditFields(MAP, REG)
    .filter((a) => a.status === "gap" && /phi: true/.test(a.why));
  assert.ok(gaps.length >= 15);
});

test("a partner „nem érintett” jelölőnégyzete elnyeli a harmadik állapotot", () => {
  const f = MAP.forms.find((x) => x.id === "form.partner")!
    .fields.find((x) => x.label === "Partner nem érintett")!;
  assert.match(f.note!, /HÁROM ÁLLAPOT/);
});

test("a szabad szöveges mezőket a validátor megjelöli", () => {
  const w = validateUiMap(MAP, REG).filter((i) => /szabad szöveges/.test(i.message));
  assert.ok(w.length >= 2);
  assert.ok(w.every((i) => i.severity === "warning"));
});

/* ── 4. A MÉRLEG ────────────────────────────────────────────────────── */

test("a bélyegző mind a négy állapotot mutatja", () => {
  const s = uiStamp(MAP, REG);
  assert.match(s, /megvan/);
  assert.match(s, /levezetett/);
  assert.match(s, /nem vehető át változatlanul/);
  assert.match(s, /interfészből/);
  assert.match(s, /hiányzik/);
  assert.match(s, /RÉSZLEGES/);
});


/* ── 5. AZ INDIKÁCIÓ ÖSSZEKÖTI A KLINIKÁT ÉS AZ ELSZÁMOLÁST ─────────── */

test("a javallat nem adminisztráció: az elszámolhatóság előfeltétele", () => {
  // 9/2012. NEFMI 4. melléklet: bizonyos eljárások CSAK meghatározott
  // BNO-kódok mellett számolhatók el. A `tbl.oeno.bno` tábla ezt tartalmazza.
  const form = MAP.forms.find((f) => f.id === "form.indikacio")!;
  assert.match(form.note!.hu!, /ELSZÁMOLHATÓSÁG előfeltétele/);
  assert.match(form.note!.hu!, /tbl\.oeno\.bno/);
  const bno = form.fields.filter((f) => /BNO/.test(f.label));
  assert.equal(bno.length, 2);            // magzati ÉS anyai javallat
});

test("az anyai aggodalom önálló, érvényes javallat", () => {
  const f = MAP.forms.find((x) => x.id === "form.indikacio")!
    .fields.find((x) => x.label === "Anyai aggodalom")!;
  assert.match(f.note!, /sehol nem minősíti/);
});

/* ── 6. EGY LISTA, HÁROM ALANY ──────────────────────────────────────── */

test("a szervrendszeri lista több alanyra szerepel — nálunk egyszer, scope-okkal", () => {
  const lists = MAP.forms.flatMap((f) => f.fields)
    .filter((f) => /rendellenesség \(szervrendszerenként\)/.test(f.label));
  assert.ok(lists.length >= 3);
  assert.ok(lists.every((f) => f.scoped));
  assert.match(lists[0].note!, /TIZENHÁROM TÉTELES LISTA/);
  assert.match(lists[0].note!, /a felvétel egyszer/);
});

test("a hordozó és az érintett nem ugyanaz — és mindkét szülőé kell", () => {
  const f = MAP.forms.find((x) => x.id === "form.csaladiElozmeny")!
    .fields.find((x) => /Sarlósejtes/.test(x.label))!;
  assert.match(f.note!, /HORDOZÓ vagy ÉRINTETT/);
  assert.match(f.note!, /MINDKÉT szülő/);
});

test("a forrásrendszer a szülőknél KIMONDJA a példány-dimenziót", () => {
  const f = MAP.forms.find((x) => x.id === "form.csaladiElozmeny")!
    .fields.find((x) => /kinek a felmenője/i.test(x.label))!;
  assert.equal(f.scoped, true);
  assert.match(f.note!, /Ugyanez a dimenzió hiányzik/);
});


/* ── 7. A MoM A REAGENSKÉSZLETHEZ TARTOZIK ──────────────────────────── */

test("a gyártó és a tételszám KAPU a számításon, nem címke", () => {
  // A MoM mediánsora reagenskészletenként más. Más gyártó mediánsorával
  // számolt MoM csendben rossz: ugyanaz a szám, más jelentéssel.
  const g = auditFields(MAP, REG).filter((a) => /KAPU A SZÁMÍTÁSON/.test(a.why));
  assert.ok(g.length >= 2);               // gyártó + tételszám (markerenként is)
  assert.ok(g.every((x) => x.status === "gate"));
  assert.match(g[0].why, /calc\.verified/);
});

test("a laborhiba-jelölés nem címke, hanem kapu az eredményen", () => {
  const g = auditFields(MAP, REG).filter((a) => /KAPU AZ EREDMÉNYEN/.test(a.why));
  assert.ok(g.length >= 2);   // labor hiba · mozaicizmus · fibronektin-zavaró körülmény
  assert.match(g[0].why, /látszik, de nem véd/);
});

test("a háttér- és a számított kockázat KÜLÖN mező marad", () => {
  const risks = MAP.forms.find((f) => f.id === "form.szurotest")!
    .fields.filter((f) => /kockázat/.test(f.label));
  assert.ok(risks.length >= 7);           // 3 háttér + 3 számított + NTD
  const bg = risks.find((f) => /^Háttér kockázat/.test(f.label))!;
  assert.match(bg.note!, /A PRIORI kockázat/);
  const calc = risks.find((f) => /^Számított kockázat/.test(f.label))!;
  assert.match(calc.note!, /egyetlen számmá összevonva elvész/);
});

test("az etnikum ITT nevesített célú — és a szabály épp erre íródott", () => {
  const eth = MAP.forms.find((f) => f.id === "form.szurotest")!
    .fields.find((f) => f.special === "ethnicity")!;
  assert.match(eth.note!, /A CÉL NEVESÍTETT/);
  assert.match(eth.note!, /soha nem folyhat be csendben/);
  // a státusza attól még `refused`: a rögzítés hozzájáruláshoz kötött
  const a = auditFields(MAP, REG)
    .find((x) => x.form === "form.szurotest" && x.field === eth.label)!;
  assert.equal(a.status, "refused");
});

test("a szervrendszeri lista NÉGY alanyra szerepel a forrásrendszerben", () => {
  const lists = MAP.forms.flatMap((f) => f.fields)
    .filter((f) => /rendellenesség \(szervrendszerenként\)/.test(f.label));
  assert.equal(lists.length, 4);   // jelen magzat · korábbi terhesség · szülők · rokon
  assert.match(lists[0].note!, /NÉGYSZER szerepel/);
  assert.match(lists[0].note!, /négy példány-dimenzióval/);
});


/* ── 8. A MÉRÉS KÖRÜLMÉNYE AZ ÉRTÉK RÉSZE ───────────────────────────── */

test("a behatolás útja ugyanolyan kapu, mint a normogram konvenciója", () => {
  // Transzvaginálisan és transzabdominálisan mért CRL nem ugyanaz a szám.
  const ctx = auditFields(MAP, REG).filter((a) => a.status === "context");
  assert.ok(ctx.length >= 5);
  assert.ok(ctx.some((c) => /Transzvaginális/.test(c.field)));
  assert.match(ctx[0].why, /a mért értékkel EGYÜTT tárolandó/);
});

/* ── 9. A MODELL A KLINIKUS MELLETT ÁLL, NEM HELYETTE ───────────────── */

test("a szubjektív benyomás KÜLÖN mező a modell kimenete mellett", () => {
  const kora = MAP.forms.find((f) => f.id === "form.koraTerhesseg")!;
  const impression = kora.fields.find((f) => f.label === "Szubjektív benyomás")!;
  assert.match(impression.note!, /A MODELL MELLETT ÁLL, nem helyette/);
  assert.match(impression.note!, /ELTÉRÉSE maga is adat/);
});

test("a predikciós modell FORRÁSA a mező része", () => {
  const g = auditFields(MAP, REG).filter((a) => /MODELLHEZ KÖTÖTT/.test(a.why));
  assert.ok(g.length >= 4);
  assert.ok(g.every((x) => x.status === "gate"));
  const src = MAP.forms.find((f) => f.id === "form.koraTerhesseg")!
    .fields.find((f) => f.label === "Predikciós modell használata")!;
  assert.match(src.note!, /Condous/);
  assert.match(src.note!, /Hum Reprod 2004/);
});

test("a PUL három kimenetelű, nem igen/nem", () => {
  const kora = MAP.forms.find((f) => f.id === "form.koraTerhesseg")!;
  const probs = kora.fields.filter((f) => /^Modell: .* valószínűsége/.test(f.label));
  assert.equal(probs.length, 3);          // elhalt · intrauterin · ectopiás
  const loc = kora.fields.find((f) => f.label === "Terhesség lokalizációja")!;
  assert.match(loc.note!, /HÁROM KIMENETEL, nem kettő/);
  assert.match(loc.note!, /önálló, kezelési útvonallal rendelkező kategória/);
});

test("a methotrexate előtti laborellenőrzés KAPU, nem pipa", () => {
  const g = auditFields(MAP, REG).filter((a) => /KONTRAINDIKÁCIÓ-KAPU/.test(a.why));
  assert.ok(g.length >= 2);   // TVK/vese-máj · LFT · anti-D profilaxis
  assert.match(g[0].why, /asztma-carboprost hard-stop/);
});

test("az ellenjavallat megkerüléséhez INDOKLÁS kell", () => {
  const f = MAP.forms.find((x) => x.id === "form.koraTerhesseg")!
    .fields.find((x) => /ellenjavallatának indoklása/.test(x.label))!;
  assert.match(f.note!, /az indoklás a dokumentáció része lesz/);
});


/* ── 10. KÉT ÚJ KAPUTÍPUS A KOCKÁZATSZÁMÍTÁSON ──────────────────────── */

test("a kockázatszámítást csak akkreditált vizsgáló futtathatja", () => {
  const g = auditFields(MAP, REG).filter((a) => /KOMPETENCIA-KAPU/.test(a.why));
  assert.equal(g.length, 2);              // FMF vizsgáló + engedélyszám
  assert.ok(g.some((x) => /KÉPLETRŐL szól, ez a VIZSGÁLÓRÓL/.test(x.why)));
});

test("a szűrési kockázat BELEEGYEZÉS nélkül ki sem számolható", () => {
  // A rendszer kapui eddig ADAT rögzítését kapuzták; ez a SZÁMÍTÁST kapuzza.
  const g = auditFields(MAP, REG).filter(
    (a) => a.form === "form.elsoTrimeszterKockazat" &&
      /BELEEGYEZÉS-KAPU A SZÁMÍTÁSON/.test(a.why));
  assert.equal(g.length, 1);
  assert.match(g[0].why, /nem számolható ki és nem közölhető/);
});

test("három kockázati csatorna külön: UH · BC · kombinált", () => {
  const ch = MAP.forms.find((f) => f.id === "form.elsoTrimeszterKockazat")!
    .fields.filter((f) => f.riskChannel);
  assert.deepEqual(ch.map((f) => f.riskChannel).sort(), ["bc", "combined", "uh"]);
  const comb = ch.find((f) => f.riskChannel === "combined")!;
  assert.match(comb.note!, /ha a kettő szétesik, az MAGA IS LELET/);
});

test("az első trimeszteri szűrés nem csak Down-szűrés", () => {
  const fields = MAP.forms.find((f) => f.id === "form.elsoTrimeszterKockazat")!.fields;
  assert.ok(fields.some((f) => /praeeclampsia/i.test(f.label)));
  assert.ok(fields.some((f) => /növekedési retardáció/i.test(f.label)));
  assert.ok(fields.some((f) => /elhalás/i.test(f.label)));
  const pe = fields.find((f) => /Korai praeeclampsia/.test(f.label))!;
  assert.match(pe.note!, /KEZELÉSI következménye van \(aszpirin\)/);
});


/* ── 11. UGYANAZ A MÉRÉS, KÉT CÉL ───────────────────────────────────── */

test("a növekedés-kontroll ugyanaz a mezőkészlet, más céllal", () => {
  // Az anatómiai vizsgálat EGYSZERI és szerkezeti; a növekedés-kontroll
  // ISMÉTLŐDŐ és időbeli. A különbség a CÉL, nem a mező.
  const nk = MAP.forms.find((f) => f.id === "form.novekedesKontroll")!;
  assert.match(nk.note!.hu!, /Ez nem duplikáció/);
  assert.match(nk.note!.hu!, /cardinality/);
  assert.ok(nk.fields.filter((f) => f.scoped).length >= 2);
});

test("a növekedés a súlyok SOROZATÁBÓL látszik, nem egy percentilisből", () => {
  const f = MAP.forms.find((x) => x.id === "form.novekedesKontroll")!
    .fields.find((x) => /Becsült magzati súly/.test(x.label))!;
  assert.match(f.note!, /40\.-ről 15\.-re csúszó magzat viszont akkor is gyanús/);
});


/* ── 12. AZ ALANY ÉS A KATEGÓRIA ────────────────────────────────────── */

test("a Doppler-lap az anyai és a magzati ereket külön alanyra bontja", () => {
  const dopp = MAP.forms.find((f) => f.id === "form.doppler")!;
  const mat = dopp.fields.filter((f) => f.subject === "maternal");
  const fet = dopp.fields.filter((f) => f.subject === "fetal");
  assert.ok(mat.length >= 3 && fet.length >= 6);
  assert.match(dopp.note!.hu!, /az alany a felületen is látszik/);
});

test("a végdiasztolés áramlás KATEGÓRIA, nem szám — és súlyos", () => {
  const g = auditFields(MAP, REG).filter((a) => /KATEGÓRIA, NEM SZÁM/.test(a.why));
  assert.ok(g.length >= 2);   // umbilicalis EDF · ductus venosus A-hullám · v. umb.
  assert.ok(g.every((x) => x.status === "gate"));
  assert.match(g[0].why, /sürgős döntést kívánhat/);
});

test("a cerebro-placentaris arány számított, nem beírandó", () => {
  const cpr = MAP.forms.find((f) => f.id === "form.doppler")!
    .fields.find((f) => /Cerebro-placentaris/.test(f.label))!;
  assert.equal(cpr.derived, true);
  assert.match(cpr.note!, /ellentmondhat a két bemenetének/);
});


/* ── 13. A PLACENTA-LAP HÁROM TANULSÁGA ─────────────────────────────── */

test("anyai laborok a placenta-leleten: ez keresztfeltöltés, nem tévedés", () => {
  // A placentáris elégtelenség és a praeeclampsia egy folyamat; ezek a
  // laborértékek a fullPIERS és a súlyossági kritériumok bemenetei.
  const cf = auditFields(MAP, REG).filter((a) => /KERESZTFELTÖLTÉS/.test(a.why));
  assert.ok(cf.length >= 5);
  assert.match(cf[0].why, /EGY változó, több nézet/);
  // és kettő közülük MÁR MEGVAN a regiszterben
  assert.ok(cf.filter((a) => a.status === "mapped").length >= 2);
});

test("a placenta accreta spectrum vörös zászló, nem legördülő menü", () => {
  const f = MAP.forms.find((x) => x.id === "form.placenta")!
    .fields.find((x) => /Placenta tapadása/.test(x.label))!;
  assert.equal(f.criticalCategory, true);
  assert.match(f.note!, /a szülés helyét, idejét, módját/);
  assert.match(f.note!, /korábbi császármetszés/);
});

test("a thrombophilia-mezők értékkészlete gyanús — nem vehető át", () => {
  // A képernyőn „homozygóta (ccddee)" áll: a „ccddee" Rhesus-genotípus,
  // nem thrombophilia-genotípus. A két mező osztozik egy készleten.
  const bad = auditFields(MAP, REG).filter(
    (a) => a.form === "form.placenta" && /HIBÁS ÉRTÉKKÉSZLET GYANÚJA/.test(a.why));
  assert.equal(bad.length, 3);          // FV Leiden · Prothrombin II · MTHFR
  assert.ok(bad.every((x) => x.status === "refused"));
  assert.match(bad[0].why, /RHESUS-GENOTÍPUS jelölés/);
});

test("a praevia mérőszáma távolság, nem igen/nem", () => {
  const f = MAP.forms.find((x) => x.id === "form.placenta")!
    .fields.find((x) => /belső méhszájtól való távolsága/.test(x.label))!;
  assert.match(f.note!, /a szülésmód dől el rajta/);
});


/* ── 14. AMIT A KÉT UTOLSÓ KÖTEG HOZZÁTETT ──────────────────────────── */

test("a CTG vizuális és gépi kiértékelése KÜLÖN csatorna", () => {
  // A rövidtávú variabilitást szem nem látja, viszont ez a legerősebb
  // előrejelzője a magzati acidózisnak.
  const ctg = MAP.forms.find((f) => f.id === "form.ctg")!;
  assert.ok(ctg.fields.some((f) => f.riskChannel === "uh"));   // vizuális
  assert.ok(ctg.fields.some((f) => f.riskChannel === "bc"));   // gépi
  const stv = ctg.fields.find((f) => /rövidtávú variabilitás/i.test(f.label))!;
  assert.match(stv.note!, /szem nem lát/);
});

test("a lágy jelek listája a MODELLHEZ tartozik, nem a beteghez", () => {
  // Ugyanaz a marker két készletben, mert a két publikáció más
  // valószínűségi hányadost rendel hozzá.
  const sets = MAP.forms.find((f) => f.id === "form.trim2Kockazat")!
    .fields.filter((f) => f.markerSet);
  assert.equal(sets.length, 2);
  assert.deepEqual(sets.map((f) => f.markerSet).sort(),
    ["agathokleous2013", "nicolaides2003"]);
  assert.match(sets[1].note!, /a MODELLHEZ tartozik, nem a beteghez/);
});

test("a bemenetválasztó a 2. trimeszteri lapon a legexplicitebb", () => {
  const sel = MAP.forms.find((f) => f.id === "form.trim2Kockazat")!
    .fields.find((f) => f.inputSelector)!;
  assert.match(sel.note!, /a számítás bemenete sosem implicit/);
});

test("az anti-D nyomon követhető készítmény, nem jelölőnégyzet", () => {
  const t = auditFields(MAP, REG).filter((a) => /NYOMONKÖVETÉSI KÖVETELMÉNY/.test(a.why));
  assert.ok(t.length >= 1);   // anti-D · magzati transzfúzió · minta-azonosítók
  assert.match(t[0].why, /gyártási tétel szintjén/);
  assert.match(t[0].why, /megőrzési ideje eltér/);
});

test("a pontrendszer és a súlyképlet egyaránt MEGNEVEZETT választás", () => {
  const sel = auditFields(MAP, REG).filter((a) => /BEMENETVÁLASZTÓ/.test(a.why));
  assert.ok(sel.length >= 4);   // NT · EFW-képlet · BPP-pontrendszer · 2. trim.
});
