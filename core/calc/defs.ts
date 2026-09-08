/**
 * A kalkulátorok tételes definíciója.
 *
 * MINDEN képlet, ami a rendszerben számot ad, itt van — beleértve azokat is,
 * amelyek még kapu mögött állnak. Ez a lista a fejlesztői dokumentáció
 * forrása; kézzel írt kalkulátor-doksi nincs.
 *
 * A `verified: false` NEM azt jelenti, hogy a képlet rossz. Azt jelenti, hogy
 * a konstansait még senki nem vetette össze az elsődleges forrással. Amíg ez
 * nem történik meg, a kalkulátor teljes bemenettel sem ad eredményt.
 */
import type { CalcDef } from "./types.ts";
import { readFileSync } from "node:fs";
import type { SepsisProtocol } from "../szepszis/types.ts";

/* ── Antropometria ────────────────────────────────────────────────────── */

const bmi: CalcDef = {
  id: "calc.bmi",
  label: { hu: "Testtömegindex", en: "Body mass index" },
  kind: "formula",
  module: "anthro",
  inputs: [
    { id: "anthro.height", unit: "cm", required: true },
    { id: "anthro.weight.prepregnancy", unit: "kg", required: true },
  ],
  output: {
    unit: "kg/m2", digits: 1,
    bands: [
      { max: 18.5, label: { hu: "soványság" }, severity: "watch" },
      { min: 18.5, max: 25, label: { hu: "normális" }, severity: "normal" },
      { min: 25, max: 30, label: { hu: "túlsúly" }, severity: "watch" },
      { min: 30, max: 40, label: { hu: "elhízás" }, severity: "watch" },
      { min: 40, label: { hu: "III. fokú elhízás" }, severity: "redflag" },
    ],
  },
  formula: "BMI = testsúly[kg] / (testmagasság[m])²",
  source: { cite: "WHO Technical Report Series 894 (2000)", standard: "WHO" },
  verified: true,
  verifiedNote: "Definíciós képlet, nincs illesztett együtthatója.",
  caveats: {
    hu: "Terhesség alatt a TERHESSÉG ELŐTTI testsúlyból számolandó. A futó terhességi " +
        "testsúlyból számolt BMI klinikailag értelmetlen, és a CMQCC, a VBAC és a VTE " +
        "számítás mind ezt fogyasztja — az elrontása végigfut a rendszeren.",
  },
  fn: (heightCm, weightKg) => {
    const m = heightCm / 100;
    return m > 0 ? weightKg / (m * m) : null;
  },
};

const bsa: CalcDef = {
  id: "calc.bsa.mosteller",
  label: { hu: "Testfelszín (Mosteller)", en: "Body surface area (Mosteller)" },
  kind: "formula",
  module: "anthro",
  inputs: [
    { id: "anthro.height", unit: "cm", required: true },
    { id: "anthro.weight.current", unit: "kg", required: true },
  ],
  output: { unit: "m2", digits: 2 },
  formula: "BSA = √(testmagasság[cm] × testsúly[kg] / 3600)",
  source: { cite: "Mosteller RD. Simplified calculation of body-surface area. N Engl J Med 1987;317:1098", pmid: "3657876" },
  verified: true,
  verifiedNote: "Egyetlen konstans (3600), a közleményben szereplő alakkal egyezik.",
  caveats: { hu: "Kemoterápiás dózishoz a 12. modul használja. Terhességben a növekvő " +
                 "testsúly miatt az AKTUÁLIS súlyból számol, nem a terhesség előttiből." },
  fn: (heightCm, weightKg) => Math.sqrt((heightCm * weightKg) / 3600),
};


const age: CalcDef = {
  id: "calc.age",
  label: { hu: "Életkor", en: "Age" },
  kind: "formula",
  module: "admin",
  inputs: [
    { id: "patient.birthDate", required: true },
    { id: "ctx.now", required: true },
  ],
  output: { unit: "a", digits: 0 },
  formula: "kor = ⌊(most − születési dátum) / 365,2425 nap⌋",
  source: { cite: "Gregorián naptári év átlaghossza.", standard: "—" },
  verified: true,
  verifiedNote: "Osztás és lefelé kerekítés; a 365,2425 a gregorián átlagév.",
  caveats: {
    hu: "A kor LEVEZETETT, nem tárolt adat. Tárolt korral a rekord egy év múlva hazudik — " +
        "ezért a rendszerben csak a születési dátum tárolódik, és az `phi` jelölésű.",
  },
  fn: (birthMs, nowMs) =>
    nowMs >= birthMs ? Math.floor((nowMs - birthMs) / 86_400_000 / 365.2425) : null,
};

/* ── Vitálisok ────────────────────────────────────────────────────────── */

const map: CalcDef = {
  id: "calc.map",
  label: { hu: "Középartériás nyomás", en: "Mean arterial pressure" },
  kind: "formula",
  module: "vitals",
  inputs: [
    { id: "vitals.bp.systolic", unit: "mm[Hg]", required: true },
    { id: "vitals.bp.diastolic", unit: "mm[Hg]", required: true },
  ],
  output: {
    unit: "mm[Hg]", digits: 0,
    bands: [
      { max: 65, label: { hu: "elégtelen szervi perfúzió kockázata" }, severity: "redflag" },
      { min: 65, max: 105, label: { hu: "normális" }, severity: "normal" },
      { min: 105, label: { hu: "emelkedett" }, severity: "watch" },
    ],
  },
  formula: "MAP = (SBP + 2 × DBP) / 3",
  source: { cite: "Klasszikus diasztolés súlyozású közelítés; nem invazív mérésre.", standard: "—" },
  verified: true,
  verifiedNote: "Közelítő definíció, nem illesztett modell. Nyugalmi pulzusszámra érvényes.",
  caveats: {
    hu: "Tachycardiában a diasztolé rövidül, és a képlet FELÜLBECSÜL. Vajúdás alatt, " +
        "ahol a pulzus rendszeresen 110 fölött van, ezt figyelembe kell venni. Invazív " +
        "méréssel rögzített MAP mindig előbbre való a számítottnál (provenance: device).",
  },
  fn: (sbp, dbp) => (sbp + 2 * dbp) / 3,
};

const pulsePressure: CalcDef = {
  id: "calc.pulsePressure",
  label: { hu: "Pulzusnyomás", en: "Pulse pressure" },
  kind: "formula",
  module: "vitals",
  inputs: [
    { id: "vitals.bp.systolic", unit: "mm[Hg]", required: true },
    { id: "vitals.bp.diastolic", unit: "mm[Hg]", required: true },
  ],
  output: {
    unit: "mm[Hg]", digits: 0,
    bands: [
      { max: 25, label: { hu: "szűkült — hypovolaemia gyanúja" }, severity: "redflag" },
      { min: 25, max: 60, label: { hu: "normális" }, severity: "normal" },
      { min: 60, label: { hu: "tág" }, severity: "watch" },
    ],
  },
  formula: "PP = SBP − DBP",
  source: { cite: "Definíciós különbség.", standard: "—" },
  verified: true,
  verifiedNote: "Kivonás.",
  caveats: { hu: "A szűkült pulzusnyomás a vérzéses sokk KORAI jele, gyakran még normális " +
                 "szisztolés érték mellett. A szülészeti vérzésnél ez a leggyakrabban " +
                 "figyelmen kívül hagyott vitális jel." },
  fn: (sbp, dbp) => sbp - dbp,
};

const shockIndex: CalcDef = {
  id: "calc.shockIndex",
  label: { hu: "Sokk-index", en: "Shock index" },
  kind: "formula",
  module: "vitals",
  inputs: [
    { id: "vitals.pulse", unit: "/min", required: true },
    { id: "vitals.bp.systolic", unit: "mm[Hg]", required: true },
  ],
  output: {
    unit: "1", digits: 2,
    bands: [
      { max: 0.9, label: { hu: "normális" }, severity: "normal" },
      { min: 0.9, max: 1.7, label: { hu: "emelkedett — fokozott figyelem" }, severity: "watch" },
      { min: 1.7, label: { hu: "kritikus — masszív transzfúziós protokoll mérlegelendő" }, severity: "redflag" },
    ],
  },
  formula: "SI = pulzus[/min] / szisztolés vérnyomás[mm Hg]",
  source: { cite: "Szülészeti küszöbök: Nathan HL et al. BJOG 2015;122:268-275", pmid: "25546050" },
  verified: true,
  verifiedNote: "A hányados triviális; a 0,9 és 1,7 küszöb a hivatkozott szülészeti " +
                "közleményből, nem az általános traumatológiai 1,0-ból.",
  caveats: {
    hu: "Terhességben a fiziológiás pulzusemelkedés miatt a nem-szülészeti küszöbök " +
        "(SI > 1,0) hamis riasztást adnak. A szülészeti sáv fentebb kezdődik.",
  },
  fn: (hr, sbp) => (sbp > 0 ? hr / sbp : null),
};

/* ── Terhességi kor ───────────────────────────────────────────────────── */

const gaLmp: CalcDef = {
  id: "calc.ga.lmp",
  label: { hu: "Gesztációs kor az utolsó menstruációból", en: "Gestational age from LMP" },
  kind: "formula",
  module: "ctx",
  inputs: [
    { id: "ctx.lmp", required: true, note: { hu: "epoch-ezredmásodpercre konvertálva" } },
    { id: "ctx.now", required: true },
  ],
  output: { unit: "wk", digits: 2 },
  formula: "GA[hét] = (most − utolsó menstruáció első napja) / 7 nap",
  source: { cite: "Naegele-konvenció; ACOG Committee Opinion 700 (2017)", standard: "ACOG" },
  verified: true,
  verifiedNote: "Napkülönbség osztva héttel. Nincs illesztett paraméter.",
  caveats: {
    hu: "A PRECEDENCIA a lényeg, nem a képlet: IVF-nél a transzferdátum, egyébként a " +
        "korai (11–14. hét) CRL pontosabb az LMP-nél. Ha van korai UH, az felülírja. " +
        "A rendszer nem választ helyetted — a 02. modul precedenciaszabálya dönt, és " +
        "a döntés láthatóan meg van jelölve.",
  },
  fn: (lmpMs, nowMs) => (nowMs >= lmpMs ? (nowMs - lmpMs) / 86_400_000 / 7 : null),
};

const eddNaegele: CalcDef = {
  id: "calc.edd.naegele",
  label: { hu: "Várható szülési időpont (Naegele)", en: "Estimated due date (Naegele)" },
  kind: "formula",
  module: "ctx",
  inputs: [{ id: "ctx.lmp", required: true }],
  output: { unit: null, digits: 0, isDate: true },
  formula: "EDD = utolsó menstruáció első napja + 280 nap",
  source: { cite: "Naegele-szabály; ACOG Committee Opinion 700 (2017)", standard: "ACOG" },
  verified: true,
  verifiedNote: "280 nap, 28 napos ciklust és 14. napi ovulációt feltételezve.",
  caveats: {
    hu: "A 280 nap 28 napos ciklust feltételez. Eltérő ciklushossznál a különbséget " +
        "hozzá kell adni — a rendszer ezt csak akkor teszi meg, ha a ciklushossz " +
        "rögzítve van, és a korrekciót külön megjeleníti.",
  },
  fn: (lmpMs) => lmpMs + 280 * 86_400_000,
};

/* ── Szülészeti score-ok ──────────────────────────────────────────────── */

const bishop: CalcDef = {
  id: "calc.bishop",
  label: { hu: "Bishop-pontszám", en: "Bishop score" },
  kind: "score",
  module: "score",
  inputs: [
    { id: "exam.cervix.dilation", unit: "cm", required: true },
    { id: "exam.cervix.effacement", unit: "%", required: true },
    { id: "exam.cervix.station", required: true, note: { hu: "kódolt, a kód a pontérték" } },
    { id: "exam.cervix.consistency", required: true },
    { id: "exam.cervix.position", required: true },
  ],
  output: {
    unit: "{pont}", digits: 0,
    bands: [
      { max: 6, label: { hu: "éretlen méhszáj — érlelés mérlegelendő" }, severity: "watch" },
      { min: 6, max: 8, label: { hu: "köztes" }, severity: "normal" },
      { min: 8, label: { hu: "érett méhszáj — indukció valószínűen sikeres" }, severity: "normal" },
    ],
  },
  formula:
    "tágulat(0cm→0 · ≤2cm→1 · ≤4cm→2 · >4cm→3) + elvékonyodás(≤30%→0 · ≤50%→1 · ≤80%→2 · >80%→3) " +
    "+ beszállás(kód) + konzisztencia(kód) + pozíció(kód)",
  source: { cite: "Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol 1964;24:266-268", pmid: "14199536" },
  verified: true,
  verifiedNote: "A sávhatárok a klasszikus 0–3 táblával egyeznek; nincs illesztett együttható.",
  caveats: {
    hu: "A beszállás KÓDOLT mező, nem a −3…+3 klinikai skála: a −1 és a 0 EGY pontsávba " +
        "esik. Szabad számbeírásként ez rendszeres elszámolást okoz — ezért választós.",
  },
  fn: (dil, eff, station, consistency, position) => {
    const d = dil === 0 ? 0 : dil <= 2 ? 1 : dil <= 4 ? 2 : 3;
    const e = eff <= 30 ? 0 : eff <= 50 ? 1 : eff <= 80 ? 2 : 3;
    return d + e + station + consistency + position;
  },
};

const apgar: CalcDef = {
  id: "calc.apgar",
  label: { hu: "Apgar-pontszám", en: "Apgar score" },
  kind: "score",
  module: "szuloszoba",
  inputs: [
    { id: "nb.apgar.appearance", required: true },
    { id: "nb.apgar.pulse", required: true },
    { id: "nb.apgar.grimace", required: true },
    { id: "nb.apgar.activity", required: true },
    { id: "nb.apgar.respiration", required: true },
  ],
  output: {
    unit: "{pont}", digits: 0,
    bands: [
      { max: 4, label: { hu: "súlyosan deprimált — azonnali resuscitatio" }, severity: "redflag" },
      { min: 4, max: 7, label: { hu: "közepesen deprimált" }, severity: "watch" },
      { min: 7, label: { hu: "jó adaptáció" }, severity: "normal" },
    ],
  },
  formula: "öt tétel (szín, pulzus, reflex, tónus, légzés) összege, egyenként 0–2 pont",
  source: { cite: "Apgar V. Anesth Analg 1953;32:260-267; AAP/ACOG Committee Opinion 644 (2015)", standard: "AAP/ACOG" },
  verified: true,
  verifiedNote: "Öt tétel összeadása, nincs súlyozás.",
  caveats: {
    hu: "Az Apgar NEM az asphyxia mérőszáma és NEM alkalmas a kimenetel előrejelzésére " +
        "egyetlen újszülöttön — az AAP/ACOG közös állásfoglalása ezt kifejezetten " +
        "kimondja. Koraszülöttnél az éretlenség önmagában csökkenti. A rendszer ezért " +
        "az értéket sávval együtt mutatja, jóslat nélkül.",
  },
  fn: (a, p, g, ac, r) => a + p + g + ac + r,
};

/* ── EKG ──────────────────────────────────────────────────────────────── */

const qtcBazett: CalcDef = {
  id: "calc.qtc.bazett",
  label: { hu: "Korrigált QT (Bazett)", en: "Corrected QT (Bazett)" },
  kind: "formula",
  module: "ekg",
  inputs: [
    { id: "ekg.qt", unit: "ms", required: true },
    { id: "vitals.pulse", unit: "/min", required: true },
  ],
  output: {
    unit: "ms", digits: 0,
    bands: [
      { max: 460, label: { hu: "normális (nő)" }, severity: "normal" },
      { min: 460, max: 500, label: { hu: "megnyúlt" }, severity: "watch" },
      { min: 500, label: { hu: "jelentősen megnyúlt — torsades kockázat" }, severity: "redflag" },
    ],
  },
  formula: "QTc = QT[ms] / √(RR[s]),  ahol RR = 60 / pulzus",
  source: { cite: "Bazett HC. Heart 1920;7:353-370", standard: "—" },
  verified: true,
  verifiedNote: "Négyzetgyökös korrekció, egyetlen kitevővel.",
  caveats: {
    hu: "A Bazett TÚLKORRIGÁL tachycardiában és alulkorrigál bradycardiában. " +
        "Terhességben a fiziológiás tachycardia miatt ez rendszeres hamis pozitívot ad — " +
        "100/min felett a Fridericia megbízhatóbb, és a rendszer mindkettőt mutatja.",
  },
  fn: (qtMs, hr) => {
    if (hr <= 0) return null;
    return qtMs / Math.sqrt(60 / hr);
  },
};

const qtcFridericia: CalcDef = {
  id: "calc.qtc.fridericia",
  label: { hu: "Korrigált QT (Fridericia)", en: "Corrected QT (Fridericia)" },
  kind: "formula",
  module: "ekg",
  inputs: [
    { id: "ekg.qt", unit: "ms", required: true },
    { id: "vitals.pulse", unit: "/min", required: true },
  ],
  output: {
    unit: "ms", digits: 0,
    bands: [
      { max: 460, label: { hu: "normális (nő)" }, severity: "normal" },
      { min: 460, max: 500, label: { hu: "megnyúlt" }, severity: "watch" },
      { min: 500, label: { hu: "jelentősen megnyúlt — torsades kockázat" }, severity: "redflag" },
    ],
  },
  formula: "QTc = QT[ms] / ∛(RR[s]),  ahol RR = 60 / pulzus",
  source: { cite: "Fridericia LS. Acta Med Scand 1920;53:469-486", standard: "—" },
  verified: true,
  verifiedNote: "Köbgyökös korrekció, egyetlen kitevővel.",
  caveats: { hu: "Magas pulzusnál megbízhatóbb a Bazettnél; ezért terhességben ez az " +
                 "elsődlegesen mutatott érték." },
  fn: (qtMs, hr) => {
    if (hr <= 0) return null;
    return qtMs / Math.cbrt(60 / hr);
  },
};

/* ── Kapu mögött: ellenőrizetlen konstansok ───────────────────────────── */

const egfr: CalcDef = {
  id: "calc.egfr.ckdepi2021",
  label: { hu: "eGFR (CKD-EPI 2021)", en: "eGFR (CKD-EPI 2021)" },
  kind: "formula",
  module: "lab",
  inputs: [
    { id: "lab.cr", unit: "umol/L", required: true },
    { id: "patient.age", unit: "a", required: true },
  ],
  output: { unit: "mL/min/{1.73_m2}", digits: 0 },
  formula:
    "eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1,200 × 0,9938^kor × 1,012   " +
    "(nő: κ = 0,7 · α = −0,241)",
  source: { cite: "Inker LA et al. New creatinine- and cystatin C-based equations. N Engl J Med 2021;385:1737-1749", pmid: "34554658" },
  verified: false,
  verifiedNote:
    "Az együtthatók (142 · 0,7 · −0,241 · −1,200 · 0,9938 · 1,012) még nincsenek " +
    "összevetve az elsődleges közleménnyel. Emellett a képlet TERHESSÉGBEN NEM " +
    "VALIDÁLT: a fiziológiás hyperfiltratio miatt a valós GFR-t alábecsüli, ami " +
    "praeeclampsiás vesekárosodásnál késleltetheti a felismerést.",
  caveats: {
    hu: "Terhességben a szérumkreatinin-alapú becslés önmagában megbízhatatlan. " +
        "A kreatinin ABSZOLÚT értéke és annak változása informatívabb, mint a becsült GFR.",
  },
  fn: (crUmol, ageYears) => {
    const scr = crUmol / 88.4;                       // µmol/L → mg/dL
    const k = 0.7, a = -0.241;
    return 142 * Math.min(scr / k, 1) ** a * Math.max(scr / k, 1) ** -1.2
      * 0.9938 ** ageYears * 1.012;
  },
};

const efwHadlock: CalcDef = {
  id: "calc.efw.hadlock",
  label: { hu: "Becsült magzati súly (Hadlock)", en: "Estimated fetal weight (Hadlock)" },
  kind: "formula",
  module: "vizsgalatok",
  inputs: [
    { id: "us.bpd", unit: "mm", required: true },
    { id: "us.hc", unit: "mm", required: true },
    { id: "us.ac", unit: "mm", required: true },
    { id: "us.fl", unit: "mm", required: true },
  ],
  output: { unit: "g", digits: 0 },
  formula:
    "log10(EFW) = 1,3596 − 0,00386·AC·FL + 0,0064·HC + 0,00061·BPD·AC + 0,0424·AC + 0,174·FL   " +
    "(a méretek cm-ben)",
  source: { cite: "Hadlock FP et al. Estimation of fetal weight with the use of head, body, and femur measurements. Am J Obstet Gynecol 1985;151:333-337", pmid: "3881966" },
  verified: false,
  verifiedNote:
    "A Hadlocknak TÖBB, egymástól eltérő regressziós változata van (2, 3 és 4 " +
    "paraméteres). Amíg nincs eldöntve és visszaellenőrizve, melyiket használjuk, a " +
    "kalkulátor nem ad számot. Rossz változat választása rendszeres, egyirányú " +
    "torzítást okoz — és a súlybecslésre indukciós és császármetszési döntés épül.",
  caveats: {
    hu: "A becsült magzati súly konfidencia-intervalluma ±15% körüli. Az EGYETLEN " +
        "számként megjelenített EFW hamis pontosságot sugall; a rendszer ezért " +
        "intervallummal és percentilissel együtt jeleníti meg, sosem önmagában.",
  },
  fn: (bpdMm, hcMm, acMm, flMm) => {
    const bpd = bpdMm / 10, hc = hcMm / 10, ac = acMm / 10, fl = flMm / 10;
    const log10 = 1.3596 - 0.00386 * ac * fl + 0.0064 * hc
      + 0.00061 * bpd * ac + 0.0424 * ac + 0.174 * fl;
    return 10 ** log10;
  },
};

const weightGain: CalcDef = {
  id: "calc.weightGain",
  label: { hu: "Terhességi súlygyarapodás", en: "Gestational weight gain" },
  kind: "formula",
  module: "anthro",
  inputs: [
    { id: "anthro.weight.current", unit: "kg", required: true },
    { id: "anthro.weight.prepregnancy", unit: "kg", required: true },
  ],
  output: { unit: "kg", digits: 1 },
  formula: "súlygyarapodás = aktuális testsúly[kg] − terhesség előtti testsúly[kg]",
  source: {
    cite: "IOM/NRC: Weight Gain During Pregnancy — Reexamining the Guidelines (2009)",
    standard: "IOM 2009",
  },
  verified: true,
  verifiedNote: "Kivonás, nincs illesztett együtthatója. Az ÉRTELMEZÉSE függ az " +
    "IOM-táblától, maga a szám nem.",
  caveats: {
    hu: "A számnak ÖNMAGÁBAN nincs sávja: az IOM 2009 célsávja a terhesség előtti " +
        "BMI-től és a gesztációs kortól is függ (teljes terhességre, egyes magzat: " +
        "sovány 12,5–18 kg; normális 11,5–16 kg; túlsúly 7–11,5 kg; elhízott " +
        "5–9 kg). Ezért itt szándékosan NINCS `bands` — a sávot a `calc.bmi` " +
        "eredményével együtt kell megválasztani, és a felület a kettőt együtt " +
        "jeleníti meg. Egy fix sáv itt minden elhízott terhesnél téves riasztást " +
        "adna. A terhesség előtti testsúly gyakran a beteg emlékezete " +
        "(`provenance: patient`) — ha az hibás, a gyarapodás is hibás, nem a képlet.",
  },
  fn: (currentKg, prepregnancyKg) => currentKg - prepregnancyKg,
};


const whr: CalcDef = {
  id: "calc.whr",
  label: { hu: "Derék–csípő arány", en: "Waist–hip ratio" },
  kind: "formula",
  module: "status",
  inputs: [
    { id: "status.endo.waist", unit: "cm", required: true },
    { id: "status.endo.hip", unit: "cm", required: true },
  ],
  output: {
    unit: "1", digits: 2,
    bands: [
      { max: 0.85, label: { hu: "nem centrális zsíreloszlás (nő)" }, severity: "normal" },
      { min: 0.85, label: { hu: "centrális zsíreloszlás (nő) — inzulinrezisztencia irányába mutat" }, severity: "watch" },
    ],
  },
  formula: "WHR = derékkörfogat[cm] / csípőkörfogat[cm]",
  source: {
    cite: "WHO: Waist circumference and waist–hip ratio — report of a WHO expert consultation (2008)",
    standard: "WHO 2008",
  },
  verified: true,
  verifiedNote: "Osztás. A 0,85-ös női küszöb a WHO 2008 konszenzusából.",
  caveats: {
    hu: "A SÁVOK NŐI KÜSZÖBBEL SZÓLNAK (WHO: nő ≥ 0,85, férfi ≥ 0,90) — ez a rendszer " +
        "nőgyógyászati kontextusából következik, nem univerzális. Terhesség alatt a " +
        "derékkörfogat a magzat miatt nő: terhesen mért WHR nem értelmezhető " +
        "zsíreloszlásként, ezért a mérés a terhesség előtti vagy a szülés utáni " +
        "állapotra vonatkozik.",
  },
  fn: (waistCm, hipCm) => (hipCm > 0 ? waistCm / hipCm : null),
};

const ferrimanGallwey: CalcDef = {
  id: "calc.ferrimanGallwey",
  label: { hu: "Ferriman–Gallwey-pontszám", en: "Ferriman–Gallwey score" },
  kind: "score",
  module: "status",
  inputs: [
    { id: "status.fert.fg.upperLip", required: true },
    { id: "status.fert.fg.chin", required: true },
    { id: "status.fert.fg.chest", required: true },
    { id: "status.fert.fg.upperAbdomen", required: true },
    { id: "status.fert.fg.lowerAbdomen", required: true },
    { id: "status.fert.fg.arm", required: true },
    { id: "status.fert.fg.thigh", required: true },
    { id: "status.fert.fg.upperBack", required: true },
    { id: "status.fert.fg.lowerBack", required: true },
  ],
  output: {
    unit: "{pont}", digits: 0,
    bands: [
      { max: 4, label: { hu: "nincs hirsutismus" }, severity: "normal" },
      { min: 4, max: 8, label: { hu: "határeset — populációfüggő" }, severity: "watch" },
      { min: 8, label: { hu: "hirsutismus" }, severity: "watch" },
    ],
  },
  formula: "kilenc androgénfüggő testtájék szőrzete, egyenként 0–3 pont, összegezve (0–36)",
  source: {
    cite: "Ferriman D, Gallwey JD. J Clin Endocrinol Metab 1961;21:1440-1447; " +
          "Escobar-Morreale HF et al. Hum Reprod Update 2012;18:146-170",
    pmid: "13892577",
  },
  verified: true,
  verifiedNote: "Kilenc tétel összeadása, súlyozás nélkül. A módosított (mFG) változat " +
    "kilenc tájékot pontoz — az eredeti tizenegyet; a rendszer a módosítottat használja.",
  caveats: {
    hu: "A ≥ 8 küszöb ETNIKUMFÜGGŐ: kelet-ázsiai populációban ≥ 2–3 már kóros, " +
        "mediterrán és közel-keleti populációban a 8 alatti érték is normális lehet. " +
        "A pontszám ezért önmagában nem diagnózis. A KOZMETIKAI KEZELÉS (gyantázás, " +
        "lézer) csökkenti a pontszámot anélkül, hogy az androgénhatás változna — " +
        "ezt a felvételkor rögzíteni kell, különben a score hamisan megnyugtat.",
  },
  fn: (...a) => a.reduce((s, x) => s + x, 0),
};

const romHours: CalcDef = {
  id: "calc.rom.hours",
  label: { hu: "Burokrepedés óta eltelt idő", en: "Time since rupture of membranes" },
  kind: "formula",
  module: "status",
  inputs: [
    { id: "status.obs.membranes.rupturedAt", required: true },
    { id: "ctx.now", required: true },
  ],
  output: {
    unit: "h", digits: 1,
    bands: [
      { max: 18, label: { hu: "18 órán belül" }, severity: "normal" },
      { min: 18, max: 24, label: { hu: "18 óra felett — GBS-profilaxis és fertőzésfigyelés" }, severity: "watch" },
      { min: 24, label: { hu: "24 óra felett — chorioamnionitis-rizikó, szülésbefejezés mérlegelendő" }, severity: "redflag" },
    ],
  },
  formula: "eltelt óra = (most − burokrepedés időpontja) / 3 600 000 ms",
  source: {
    cite: "ACOG Practice Bulletin No. 217: Prelabor Rupture of Membranes (2020); " +
          "CDC: Prevention of Perinatal Group B Streptococcal Disease (MMWR 2010)",
    standard: "ACOG/CDC",
  },
  verified: true,
  verifiedNote: "Időkülönbség osztása; a sávhatárok az idézett ajánlások küszöbei.",
  caveats: {
    hu: "A BUROKREPEDÉS IDŐPONTJA majdnem mindig a beteg BESZÁMOLÓJA, nem mért adat — " +
        "az érték `confidence: reported`, és órákat tévedhet. A 18 órás küszöb ezért " +
        "figyelmeztetés, nem kapu: a klinikai kép (láz, magzati tachycardia, bűzös " +
        "magzatvíz) felülírja. Elhúzódó, nem rögzített repedésnél a szám hiánya nem " +
        "jelent rövid latenciát — `insufficient`, nem nulla.",
  },
  fn: (rupturedMs, nowMs) =>
    nowMs >= rupturedMs ? (nowMs - rupturedMs) / 3_600_000 : null,
};


const cpr: CalcDef = {
  id: "calc.cpr",
  label: { hu: "Cerebro-placentáris arány", en: "Cerebroplacental ratio" },
  kind: "formula",
  module: "imaging",
  inputs: [
    { id: "us.mca.pi", unit: "1", required: true },
    { id: "us.ua.pi", unit: "1", required: true },
  ],
  output: { unit: "1", digits: 2 },
  formula: "CPR = a. cerebri media PI / a. umbilicalis PI",
  source: {
    cite: "Baschat AA, Gembruch U. The cerebroplacental Doppler ratio revisited. " +
          "Ultrasound Obstet Gynecol 2003;21(2):124-127",
    pmid: "12601831",
  },
  verified: true,
  verifiedNote: "Két index hányadosa, nincs illesztett együtthatója.",
  caveats: {
    hu: "A SZÁMNAK ITT SINCS FIX SÁVJA: a normáltartomány GESZTÁCIÓS KORTÓL függ, " +
        "és normogramból olvasandó (`registry/normogramok/`), nem egy állandó " +
        "küszöbből. A gyakran idézett „CPR < 1” határ terminus közelében " +
        "használatos, korábban félrevezet. A rendszer ezért az arányt kiszámolja, " +
        "de a kóros/normális megítélést a normogram-motorra bízza — az pedig " +
        "ellenőrizetlen tábla mellett nem ad eredményt.",
  },
  fn: (mcaPi, uaPi) => (uaPi > 0 ? mcaPi / uaPi : null),
};


/* ── Gyógyszerelés ────────────────────────────────────────────────────── */

const crcl: CalcDef = {
  id: "calc.crcl",
  label: { hu: "Kreatinin-clearance (Cockcroft–Gault)", en: "Creatinine clearance" },
  kind: "formula",
  module: "rx",
  inputs: [
    { id: "patient.age", unit: "a", required: true },
    { id: "anthro.weight.current", unit: "kg", required: true },
    { id: "lab.cr", unit: "umol/L", required: true },
  ],
  output: {
    unit: "mL/min", digits: 0,
    bands: [
      { max: 30, label: { hu: "súlyosan beszűkült — dózismódosítás kötelező" }, severity: "redflag" },
      { min: 30, max: 60, label: { hu: "mérsékelten beszűkült — dózismódosítás mérlegelendő" }, severity: "watch" },
      { min: 60, label: { hu: "nem igényel dóziskorrekciót" }, severity: "normal" },
    ],
  },
  formula: "CrCl = ((140 − kor) × testsúly[kg] × 1,04) / szérum kreatinin[µmol/L]   (nő)",
  source: {
    cite: "Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron 1976;16(1):31-41",
    pmid: "1244564",
  },
  verified: false,
  verifiedNote:
    "Az SI-egységre átszámolt 1,04-es női együttható nincs visszaellenőrizve az " +
    "eredeti közleménnyel (az eredeti mg/dL-ben, 72-es osztóval és 0,85-ös női " +
    "szorzóval dolgozik). Ugyanaz a kapu, mint a CKD-EPI-nél.",
  caveats: {
    hu: "A GYÓGYSZERADAGOLÁS a kreatinin-clearance-re épül, NEM az eGFR-re: a " +
        "törzskönyvi dózisajánlások túlnyomó része Cockcroft–Gault szerinti " +
        "értékkel készült, és a testfelszínre normált eGFR a szélső testsúlyoknál " +
        "eltérő dózist adna. TERHESSÉGBEN a képlet külön problémás: a " +
        "vesefunkció élettanilag emelkedik, a testsúly pedig a magzatot is " +
        "tartalmazza — a futó terhességi súlyból számolt clearance felülbecsül.",
  },
  fn: (ageYears, weightKg, crUmolL) =>
    crUmolL > 0 ? ((140 - ageYears) * weightKg * 1.04) / crUmolL : null,
};

const lmwh: CalcDef = {
  id: "calc.lmwh.prophylaxis",
  label: { hu: "Enoxaparin profilaktikus napi adag", en: "Enoxaparin prophylactic dose" },
  kind: "target",
  module: "rx",
  inputs: [{ id: "anthro.weight.current", unit: "kg", required: true }],
  // SÁV NINCS, SZÁNDÉKOSAN. A sávok a KIMENETRE vonatkoznak, itt viszont a
  // testsúly-tartományok a BEMENETET írnák le — a kettőt összekeverve a
  // 40 mg-os adag mellé az „alacsony testsúly" felirat kerülne. Az adag
  // önmagában olvasható; a sávtábla a képletben és a forrásban van.
  output: { unit: "mg", digits: 0 },
  formula:
    "testsúlysáv szerint: < 50 kg → 20 mg · 50–90 kg → 40 mg · 91–130 kg → 60 mg · " +
    "131–170 kg → 80 mg · > 170 kg → 0,6 mg/kg naponta",
  source: {
    cite: "RCOG Green-top Guideline No. 37a: Reducing the Risk of Venous Thromboembolism during Pregnancy and the Puerperium (2015)",
    standard: "RCOG GTG 37a",
  },
  verified: true,
  verifiedNote:
    "Sávos táblázat, nem illesztett képlet: a sávhatárok az ajánlásból szó szerint " +
    "átvehetők, nincs mit visszaszámolni.",
  caveats: {
    hu: "A TESTSÚLY A TERHESSÉG ALATT VÁLTOZIK: a korai terhességben mért súly " +
        "alapján beállított adag a terminusra alul dozírozhat, ezért az adag " +
        "újraértékelendő. Elhízásnál (BMI ≥ 35) egyes szerzők 0,5 mg/kg 12 " +
        "óránkénti adagolást javasolnak (Overcash 2015, PMID 26658126) — ez " +
        "MÁSIK séma, nem ennek a kalkulátornak a kimenete, és a rendszer nem " +
        "keveri a kettőt. Beszűkült vesefunkciónál (CrCl < 30) a profilaktikus " +
        "adag is csökkentendő, és anti-Xa szint mérése mérlegelendő.",
  },
  fn: (weightKg) => {
    if (weightKg < 50) return 20;
    if (weightKg <= 90) return 40;
    if (weightKg <= 130) return 60;
    if (weightKg <= 170) return 80;
    return Math.round(0.6 * weightKg);
  },
};


/* ── Táplálkozás ──────────────────────────────────────────────────────── */

const proteinPregnancy: CalcDef = {
  id: "calc.protein.pregnancy",
  label: { hu: "Terhességi fehérjeszükséglet", en: "Protein requirement in pregnancy" },
  kind: "target",
  module: "diet",
  inputs: [{ id: "anthro.weight.prepregnancy", unit: "kg", required: true }],
  output: { unit: "g", digits: 0 },
  formula: "fehérje[g/nap] = 1,1 g × terhesség előtti testsúly[kg]",
  source: {
    cite: "Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, " +
          "Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids (2005)",
    standard: "IOM DRI 2005",
  },
  verified: true,
  verifiedNote:
    "KONSZENZUSOS EGYÜTTHATÓ, nem illesztett regresszió: az 1,1 g/kg a DRI " +
    "terhességi ajánlott bevitele, egy szorzás. Ezért — az energiaképlettel " +
    "szemben — nincs kapu mögött.",
  caveats: {
    hu: "A TERHESSÉG ELŐTTI testsúlyra számol: a futó terhességi súlyból számolt " +
        "fehérjecél a magzat és a magzatvíz tömegét is fehérjeigénynek " +
        "tekintené. Szoptatás alatt az igény magasabb (kb. 1,3 g/kg) — az " +
        "ott érvényes cél nem ebből a kalkulátorból jön. Vesebetegségben és " +
        "májelégtelenségben a fehérjecél KORLÁTOZOTT lehet: ez a kalkulátor " +
        "az egészséges terhesre szól, és a diétás protokoll felülírhatja.",
  },
  fn: (weightKg) => 1.1 * weightKg,
};

const energyPregnancy: CalcDef = {
  id: "calc.energy.pregnancy",
  label: { hu: "Terhességi energiaszükséglet", en: "Energy requirement in pregnancy" },
  kind: "formula",
  module: "diet",
  inputs: [
    { id: "anthro.weight.prepregnancy", unit: "kg", required: true },
    { id: "anthro.height", unit: "cm", required: true },
    { id: "patient.age", unit: "a", required: true },
    { id: "ctx.ga", unit: "wk", required: true },
  ],
  output: { unit: "kcal", digits: 0 },
  formula:
    "alapanyagcsere (Mifflin–St Jeor, nő) = 10 × testsúly + 6,25 × testmagasság " +
    "− 5 × kor − 161; × 1,4 aktivitási szorzó; + 0 / 340 / 452 kcal trimeszterenként",
  source: {
    cite: "Mifflin MD et al. A new predictive equation for resting energy " +
          "expenditure in healthy individuals. Am J Clin Nutr 1990;51(2):241-247; " +
          "IOM Dietary Reference Intakes (2005) trimeszter-többletek",
    pmid: "2305711",
  },
  verified: false,
  verifiedNote:
    "Az együtthatók (10 · 6,25 · 5 · 161), az 1,4-es aktivitási szorzó és a " +
    "trimeszter-többletek nincsenek visszaellenőrizve az elsődleges " +
    "közleményekkel. Ez ILLESZTETT REGRESSZIÓ, nem konszenzusos szorzó — " +
    "ezért kapu mögött áll, szemben a fehérjecéllal.",
  caveats: {
    hu: "AZ AKTIVITÁSI SZORZÓ A LEGNAGYOBB BIZONYTALANSÁG: az 1,4 ülő " +
        "életmódot feltételez, és a valóságban 1,2 és 1,9 között szóródik — ez " +
        "önmagában több száz kcal különbség, több, mint a teljes terhességi " +
        "többlet. Amíg a kapu zárva van, a betegtájékoztatóban nem szám, hanem " +
        "DIETETIKAI KONZÍLIUM javallata jelenik meg. Ez nem hiány: a modul saját " +
        "nyitott kérdése is azt javasolja, hogy a rendszer célértéket és " +
        "konzíliumi javallatot adjon, ne konkrét étrendet.",
  },
  fn: (weightKg, heightCm, ageYears, gaWeeks) => {
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
    const extra = gaWeeks < 14 ? 0 : gaWeeks < 28 ? 340 : 452;
    return bmr * 1.4 + extra;
  },
};


/* ── Perinatális mentális egészség ────────────────────────────────────── */
/*
 * MIND AZ ÖT ESZKÖZ ÖSSZEADÁS, súlyozás nélkül — ezért egyik sincs kapu
 * mögött. Amit ezek a kalkulátorok NEM csinálnak: nem sorolnak be. A
 * vágóérték IDŐSZAKFÜGGŐ (antepartum vs. postnatalis), a kritikus tétel
 * pedig az összpontszámtól függetlenül szól — mindkettő a kérdőív-motorban
 * (`core/kerdoiv/`) él, nem itt. Egy score-kalkulátor, ami maga sorol be,
 * elrejtené, hogy a besorolás kontextusfüggő.
 */

const epdsTotal: CalcDef = {
  id: "calc.epds.total",
  label: { hu: "EPDS összpontszám", en: "EPDS total score" },
  kind: "score",
  module: "psy",
  inputs: [
    { id: "psy.epds.q1", required: true },
    { id: "psy.epds.q2", required: true },
    { id: "psy.epds.q3", required: true },
    { id: "psy.epds.q4", required: true },
    { id: "psy.epds.q5", required: true },
    { id: "psy.epds.q6", required: true },
    { id: "psy.epds.q7", required: true },
    { id: "psy.epds.q8", required: true },
    { id: "psy.epds.q9", required: true },
    { id: "psy.epds.q10", required: true },
  ],
  output: { unit: "{pont}", digits: 0 },
  formula: "a tíz tétel összege, egyenként 0–3 pont (0–30)",
  source: {
    cite: "Cox JL, Holden JM, Sagovsky R. Detection of postnatal depression. " +
          "Br J Psychiatry 1987;150:782-786; magyar validáció: Töreki A et al. " +
          "Midwifery 2014;30(8):911-918",
    pmid: "3651732",
  },
  verified: true,
  verifiedNote: "Tíz tétel összeadása, súlyozás nélkül.",
  caveats: {
    hu: "A VÁGÓÉRTÉK NEM ITT VAN: az antepartum és a postnatalis küszöb eltér, " +
        "és a besorolás a kérdőív-motorban, a kontextus ismeretében történik. " +
        "A 10. tétel („önkárosítás gondolata”) pozitív válasza az " +
        "ÖSSZPONTSZÁMTÓL FÜGGETLENÜL vörös zászló — ezt egy összeg soha nem " +
        "tudná kifejezni. Részlegesen kitöltött skálából nincs összpontszám: a " +
        "hiányzó tétel arányosítása nem validált eljárás.",
  },
  fn: (...a) => a.reduce((s, x) => s + x, 0),
};

const whooleyTotal: CalcDef = {
  id: "calc.whooley.total",
  label: { hu: "Whooley-kérdések összege", en: "Whooley questions total" },
  kind: "score",
  module: "psy",
  inputs: [
    { id: "psy.whooley.q1", required: true },
    { id: "psy.whooley.q2", required: true },
  ],
  output: { unit: "{pont}", digits: 0 },
  formula: "a két kérdés összege (0–2)",
  source: {
    cite: "Whooley MA et al. Case-finding instruments for depression. " +
          "J Gen Intern Med 1997;12(7):439-445; NICE CG192 / NG201",
    pmid: "9229283",
  },
  verified: true,
  verifiedNote: "Két igen/nem kérdés összege.",
  caveats: {
    hu: "GYORSSZŰRÉS, NEM DIAGNÓZIS: bármelyik igenlő válasz további vizsgálatot " +
        "(EPDS vagy PHQ-9) indokol, de önmagában kezelést nem indít. A magas " +
        "érzékenység ára az alacsony specificitás — a pozitív szűrés " +
        "többségében nincs depresszió.",
  },
  fn: (a, b) => a + b,
};

const phq9Total: CalcDef = {
  id: "calc.phq9.total",
  label: { hu: "PHQ-9 összpontszám", en: "PHQ-9 total score" },
  kind: "score",
  module: "psy",
  inputs: [
    { id: "psy.phq9.q1", required: true },
    { id: "psy.phq9.q2", required: true },
    { id: "psy.phq9.q3", required: true },
    { id: "psy.phq9.q4", required: true },
    { id: "psy.phq9.q5", required: true },
    { id: "psy.phq9.q6", required: true },
    { id: "psy.phq9.q7", required: true },
    { id: "psy.phq9.q8", required: true },
    { id: "psy.phq9.q9", required: true },
  ],
  output: { unit: "{pont}", digits: 0 },
  formula: "a kilenc tétel összege, egyenként 0–3 pont (0–27)",
  source: {
    cite: "Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief " +
          "depression severity measure. J Gen Intern Med 2001;16(9):606-613",
    pmid: "11556941",
  },
  verified: true,
  verifiedNote: "Kilenc tétel összeadása, súlyozás nélkül.",
  caveats: {
    hu: "TERHESSÉGBEN ÉS GYERMEKÁGYBAN A SZOMATIKUS TÉTELEK FÉLREVEZETNEK: az " +
        "alvászavar, a fáradtság és az étvágyváltozás élettani is lehet, és " +
        "önmagukban felnyomják az összpontszámot. Ezért perinatális " +
        "populációban az EPDS az elsőként választandó eszköz — az kifejezetten " +
        "kerüli a szomatikus tételeket. A 9. tétel ugyanúgy kritikus, mint az " +
        "EPDS 10. tétele.",
  },
  fn: (...a) => a.reduce((s, x) => s + x, 0),
};

const mspssTotal: CalcDef = {
  id: "calc.mspss.total",
  label: { hu: "MSPSS összpontszám", en: "MSPSS total score" },
  kind: "score",
  module: "psy",
  inputs: [
    { id: "psy.mspss.family", required: true },
    { id: "psy.mspss.friends", required: true },
    { id: "psy.mspss.significantOther", required: true },
  ],
  output: { unit: "{pont}", digits: 0 },
  formula: "a három tétel összege, egyenként 1–7 pont (3–21)",
  source: {
    cite: "Zimet GD et al. The Multidimensional Scale of Perceived Social " +
          "Support. J Pers Assess 1988;52(1):30-41; ICHOM Pregnancy and " +
          "Childbirth Standard Set (PCB007–009)",
  },
  verified: true,
  verifiedNote: "Három tétel összeadása. Az ICHOM rövidített, három tételes változata.",
  caveats: {
    hu: "AZ ÉSZLELT támogatást méri, nem a ténylegeset — és klinikailag épp az " +
        "észlelt számít. Az alacsony érték a perinatális depresszió egyik " +
        "legerősebb MÓDOSÍTHATÓ kockázati tényezője, és az egyetlen, amin az " +
        "ellátás szervezésével közvetlenül lehet segíteni.",
  },
  fn: (a, b, c) => a + b + c,
};

const mibsTotal: CalcDef = {
  id: "calc.mibs.total",
  label: { hu: "MIBS összpontszám", en: "MIBS total score" },
  kind: "score",
  module: "psy",
  inputs: [
    { id: "psy.mibs.affection", required: true },
    { id: "psy.mibs.resentment", required: true },
    { id: "psy.mibs.neutrality", required: true },
    { id: "psy.mibs.protective", required: true },
    { id: "psy.mibs.joy", required: true },
  ],
  output: { unit: "{pont}", digits: 0 },
  formula:
    "a pozitív tételek (gyengédség, óvó érzés, öröm) ÁTFORDÍTVA (3 − pont), " +
    "a negatívak (ellenérzés, közömbösség) közvetlenül; magasabb pontszám = " +
    "gyengébb kötődés",
  source: {
    cite: "Taylor A, Atkins R, Kumar R et al. A new Mother-to-Infant Bonding " +
          "Scale. Arch Womens Ment Health 2005;8(1):45-51; ICHOM PCB105–112",
    pmid: "15868385",
  },
  verified: true,
  verifiedNote:
    "Összeadás átfordított tételekkel. AZ ÁTFORDÍTÁS A PONTOZÁS RÉSZE, nem " +
    "kényelmi átalakítás: a fordított tételek nélkül a magas pontszám hol jó, " +
    "hol rossz kötődést jelentene.",
  caveats: {
    hu: "A KÖTŐDÉSI ZAVAR ÉS A DEPRESSZIÓ KÜLÖN DOLOG, bár együtt járhat: a " +
        "depresszió kezelése önmagában nem oldja meg a kötődési nehézséget, és " +
        "fordítva. A két eszközt együtt kell olvasni, nem egymás helyett.",
  },
  fn: (affection, resentment, neutrality, protective, joy) =>
    (3 - affection) + resentment + neutrality + (3 - protective) + (3 - joy),
};


/* ── Szülőszoba ───────────────────────────────────────────────────────── */

const labourHours: CalcDef = {
  id: "calc.labour.hours",
  label: { hu: "Vajúdás óta eltelt idő", en: "Time since labour onset" },
  kind: "formula",
  module: "labour",
  inputs: [
    { id: "labour.startedAt", required: true },
    { id: "ctx.now", required: true },
  ],
  output: { unit: "h", digits: 1 },
  formula: "eltelt óra = (most − vajúdás kezdete) / 3 600 000 ms",
  source: { cite: "Időkülönbség; a partogram X-tengelye.", standard: "—" },
  verified: true,
  verifiedNote: "Kivonás és osztás.",
  caveats: {
    hu: "A NULLPONT DÖNTI EL, MIT LÁTUNK: a beteg beszámolója szerinti kezdet és " +
        "az AKTÍV szak kezdete nem ugyanaz, és a partogram az aktív szakot " +
        "rajzolja. A kettő összekeverése hamis elhúzódást mutat, és fölösleges " +
        "beavatkozáshoz vezet.",
  },
  fn: (startedMs, nowMs) =>
    nowMs >= startedMs ? (nowMs - startedMs) / 3_600_000 : null,
};

const meows: CalcDef = {
  id: "calc.meows",
  label: { hu: "MEOWS — szülészeti korai figyelmeztető pontszám", en: "MEOWS" },
  kind: "score",
  module: "labour",
  inputs: [
    { id: "vitals.bp.systolic", unit: "mm[Hg]", required: true },
    { id: "vitals.bp.diastolic", unit: "mm[Hg]", required: true },
    { id: "vitals.pulse", unit: "/min", required: true },
    { id: "vitals.rr", unit: "/min", required: true },
    { id: "vitals.temp", unit: "Cel", required: true },
    { id: "vitals.spo2", unit: "%", required: true },
  ],
  output: {
    unit: "{trigger}", digits: 0,
    bands: [
      { max: 1, label: { hu: "nincs kiváltó paraméter" }, severity: "normal" },
      { min: 1, max: 2, label: { hu: "egy sárga kiváltó — ismételt mérés" }, severity: "watch" },
      { min: 2, label: { hu: "kettő vagy több kiváltó — sürgős orvosi értékelés" }, severity: "redflag" },
    ],
  },
  formula:
    "a tartományon kívüli („kiváltó”) paraméterek SZÁMA: RR sys < 90 vagy > 150 · " +
    "RR dia > 100 · pulzus < 50 vagy > 120 · légzésszám < 10 vagy > 30 · " +
    "hőmérséklet < 35 vagy > 38 · SpO₂ < 95%",
  source: {
    cite: "Singh S, McGlennan A, England A, Simons R. A validation study of the " +
          "CEMACH recommended modified early obstetric warning system (MEOWS). " +
          "Anaesthesia 2012;67(1):12-18",
    pmid: "22050279",
  },
  verified: true,
  verifiedNote:
    "KÜSZÖBSZÁMLÁLÁS, nem illesztett modell: a paraméterek tartományon kívülre " +
    "esését számolja. A küszöbök a CEMACH-ajánlásból származnak, és a helyi " +
    "protokoll felülírhatja őket — ezért a tábla a képletben, nem elrejtve.",
  caveats: {
    hu: "A MEOWS ÉRZÉKENY, DE NEM SPECIFIKUS: vajúdás alatt a fájdalom és az " +
        "erőlködés miatt a pulzus és a légzésszám élettanilag is kiléphet a " +
        "sávból. A pontszám a KLINIKAI ÉRTÉKELÉST indítja el, nem helyettesíti. " +
        "És fordítva: a fiatal terhes sokáig kompenzál — a normális MEOWS nem " +
        "zárja ki a súlyos állapotot.",
  },
  fn: (sys, dia, pulse, rr, temp, spo2) => {
    let n = 0;
    if (sys < 90 || sys > 150) n++;
    if (dia > 100) n++;
    if (pulse < 50 || pulse > 120) n++;
    if (rr < 10 || rr > 30) n++;
    if (temp < 35 || temp > 38) n++;
    if (spo2 < 95) n++;
    return n;
  },
};

const omqsofa: CalcDef = {
  id: "calc.omqsofa",
  label: { hu: "omqSOFA — szülészeti gyorsszepszis-szűrés", en: "Obstetrically modified qSOFA" },
  kind: "score",
  module: "labour",
  inputs: [
    { id: "vitals.pulse", unit: "/min", required: true },
    { id: "vitals.rr", unit: "/min", required: true },
    { id: "vitals.temp", unit: "Cel", required: true },
    { id: "vitals.spo2", unit: "%", required: true },
  ],
  output: {
    unit: "{pont}", digits: 0,
    bands: [
      { max: 2, label: { hu: "nem utal szepszisre" }, severity: "normal" },
      { min: 2, label: { hu: "szepszisgyanú — protokoll indítása" }, severity: "redflag" },
    ],
  },
  formula:
    "négy kritérium, egyenként 1 pont: pulzus > 90 · légzésszám > 20 · " +
    "hőmérséklet < 36 vagy > 38 · SpO₂ < 95%. ≥ 2 pont → szepszisgyanú",
  source: {
    cite: "Bowyer L et al. SOMANZ guidelines for the investigation and management " +
          "of sepsis in pregnancy. Aust N Z J Obstet Gynaecol 2017;57(5):540-551",
    pmid: "28670748",
  },
  verified: true,
  verifiedNote: "Négy küszöb megszámlálása, súlyozás nélkül.",
  caveats: {
    hu: "A SZÜLÉSZETI MÓDOSÍTÁS lényege, hogy a terhességi élettani változásokat " +
        "figyelembe veszi — az eredeti qSOFA vérnyomás- és tudatállapot-kritériuma " +
        "terhesen későn jelez. De GYORSSZŰRÉS marad: a negatív eredmény nem zárja " +
        "ki a szepszist, és a laktát mérése önálló döntés.",
  },
  fn: (pulse, rr, temp, spo2) => {
    let n = 0;
    if (pulse > 90) n++;
    if (rr > 20) n++;
    if (temp < 36 || temp > 38) n++;
    if (spo2 < 95) n++;
    return n;
  },
};

/* ── Szülészeti szepszis — a CMQCC eszköztár élettani szűrője ─────────── */

/**
 * A KÜSZÖBÖK NEM ITT VANNAK, HANEM ADATBAN.
 *
 * A kritériumok a `registry/szepszis/` regiszterből jönnek, és a `fn` belőlük
 * épül. Egy küszöb módosításához nem szabad kódot írni — ugyanaz az elv, mint
 * a szűrési szabályoknál és a panaszszótár vörös zászlóinál. A teljes,
 * háromlépéses út (szűrés → gyanított góc → szervi elégtelenség) és az
 * órához kötött csomag a `core/szepszis/` motorban él; ide a SZÁMOT adó
 * élettani szűrő tartozik, az omqSOFA mellé.
 */
const SEPSIS: SepsisProtocol = JSON.parse(
  readFileSync("registry/szepszis/cmqcc-ob-szepszis.json", "utf8"),
) as SepsisProtocol;

/** A regiszterbeli kritériumok sorrendje adja a `fn` argumentumsorrendjét. */
const SEPSIS_SCREEN = SEPSIS.screen.criteria.filter((c) => c.op !== "eq" && c.op !== "notEq");

const cmqccSepsis: CalcDef = {
  id: "calc.cmqcc.ob.sepsis.screen",
  label: {
    hu: "CMQCC szülészeti szepszis — élettani szűrő",
    en: "CMQCC obstetric sepsis physiologic screen",
  },
  kind: "score",
  module: "labour",
  inputs: SEPSIS_SCREEN.map((c) => ({
    id: c.var,
    unit: c.unit ?? null,
    required: true,
    note: c.note,
  })),
  output: {
    unit: "{trigger}", digits: 0,
    bands: [
      { max: SEPSIS.screen.needed, label: { hu: "a szűrőküszöb alatt" }, severity: "normal" },
      { min: SEPSIS.screen.needed,
        label: { hu: "szűrőpozitív — a góc kérdése következik, nem diagnózis" },
        severity: "redflag" },
    ],
  },
  formula:
    SEPSIS_SCREEN.map((c) => c.label.hu).join(" · ") +
    ` — legalább ${SEPSIS.screen.needed} tétel`,
  source: {
    cite: SEPSIS.source.cite,
    standard: SEPSIS.source.standard ?? null,
  },
  verified: false,
  verifiedNote:
    "AZ ELSŐDLEGES FORRÁS NEM VOLT ELÉRHETŐ (a cmqcc.org tartományt a hálózati " +
    "szabályzat blokkolja), ezért a küszöbök másodkézből származnak. A " +
    "kalkulátor teljes bemenettel sem ad eredményt, és a szepszismotor sem ad " +
    "riasztást — a kapu előbb van, mint az adat.",
  caveats: {
    hu:
      "HÁROM DOLOG, AMI NÉLKÜL EZ A SZÁM FÉLREVEZET. (1) TERHESSÉGI ÁLLAPOT: a " +
      "terhesség fiziológiásan gyorsítja a pulzust, emeli a légzésszámot és a " +
      "fehérvérsejtszámot — ismeretlen terhességi állapotnál a szám nem " +
      "értelmezhető, és a rendszer nem esik vissza a nem terhes sávra. " +
      "(2) VAJÚDÁS: a szülés élettanilag emeli a fehérvérsejtszámot, tehát az a " +
      "tétel vajúdás alatt NEM ÉRTÉKELHETŐ — nem „normális”, hanem kiesik. " +
      "(3) A SZÁM NEM DIAGNÓZIS: a szűrőpozitív eredmény után a következő lépés " +
      "emberi döntés (van-e gyanítható fertőzéses góc?), és csak azután jön a " +
      "szervi elégtelenség kérdése. A teljes utat a `core/szepszis/` motor viszi. " +
      "KÜSZÖBELTÉRÉS: ugyanezekre a mérésekre az omqSOFA (SOMANZ 2017) más " +
      "határértéket használ (légzésszám > 20, pulzus > 90). Két forrás, két szám " +
      "— a rendszer mindkettőt megnevezi, és egyiket sem csendesíti el a másikkal.",
  },
  fn: (...args) => {
    let n = 0;
    SEPSIS_SCREEN.forEach((c, i) => {
      const v = args[i];
      if (c.op === "gt" && v > (c.value as number)) n++;
      else if (c.op === "gte" && v >= (c.value as number)) n++;
      else if (c.op === "lt" && v < (c.value as number)) n++;
      else if (c.op === "lte" && v <= (c.value as number)) n++;
      else if (c.op === "outside" && (v < (c.low as number) || v > (c.high as number))) n++;
    });
    return n;
  },
};

const isthDic: CalcDef = {
  id: "calc.isth.dic.pregnancy",
  label: { hu: "ISTH terhességi DIC-pontszám", en: "Pregnancy-specific ISTH DIC score" },
  kind: "score",
  module: "labour",
  inputs: [
    { id: "lab.plt", unit: "10*9/L", required: true },
    { id: "lab.fibrinogen", unit: "g/L", required: true },
    { id: "lab.inr", unit: "1", required: true },
  ],
  output: {
    unit: "{pont}", digits: 0,
    bands: [
      { max: 26, label: { hu: "nem utal terhességi DIC-re" }, severity: "normal" },
      { min: 26, label: { hu: "terhességi DIC — hematológiai konzílium, célzott pótlás" }, severity: "redflag" },
    ],
  },
  formula:
    "thrombocyta (>185→0 · 100–185→1 · 50–100→2 · <50→1) + " +
    "fibrinogén (>4,0→0 · 3,0–4,0→5 · 2,0–3,0→12 · <2,0→25) + " +
    "protrombin-idő különbség (<0,5→0 · 0,5–1,0→5 · 1,0–1,5→12 · >1,5→25); " +
    "vágóérték 26",
  source: {
    cite: "Erez O, Novack L, Beer-Weisel R et al. DIC score in pregnant women — " +
          "a population based modification of the ISTH score. PLoS One 2014;9(4):e93240",
    pmid: "24728050",
  },
  verified: false,
  verifiedNote:
    "A PONTHATÁROK ÉS A PONTÉRTÉKEK nincsenek visszaellenőrizve az elsődleges " +
    "közleménnyel. A szerkezet (három paraméter, sávos pontozás, 26-os vágóérték) " +
    "biztos, a konkrét sávhatárok nem — és itt a sávhatár a lényeg: a " +
    "fibrinogén 25 pontot ér 2 g/L alatt, tehát egyetlen rosszul megválasztott " +
    "határ a teljes pontszámot átbillenti.",
  caveats: {
    hu: "A TERHESSÉGI VÁLTOZAT AZÉRT KELL, mert a terhességben élettanilag " +
        "emelkedett fibrinogén és a megváltozott alvadási paraméterek mellett az " +
        "eredeti ISTH-pontszám későn jelez. A protrombin-idő KÜLÖNBSÉGE kell " +
        "hozzá (beteg mínusz kontroll), amit a rendszer ma az INR-ből közelít — " +
        "ez a közelítés maga is ellenőrzésre vár.",
  },
  fn: (plt, fib, inr) => {
    const p = plt > 185 ? 0 : plt >= 100 ? 1 : plt >= 50 ? 2 : 1;
    const f = fib > 4.0 ? 0 : fib >= 3.0 ? 5 : fib >= 2.0 ? 12 : 25;
    const ptDiff = (inr - 1) * 12;      // közelítés: az INR-ből becsült másodperc-különbség
    const t = ptDiff < 0.5 ? 0 : ptDiff < 1.0 ? 5 : ptDiff <= 1.5 ? 12 : 25;
    return p + f + t;
  },
};

const qblTotal: CalcDef = {
  id: "calc.qbl.total",
  label: { hu: "Teljes mennyiségi vérvesztés", en: "Total quantified blood loss" },
  kind: "formula",
  module: "labour",
  inputs: [
    { id: "labour.qbl", unit: "mL", required: false,
      note: { hu: "a szülés kezdetétől kumulatív; hiányzik, ha nem vajúdott" } },
    { id: "op.intra.qbl", unit: "mL", required: false,
      note: { hu: "a műtét alatt mért; hiányzik, ha nem volt műtét" } },
  ],
  output: { unit: "mL", digits: 0 },
  formula: "teljes vérvesztés = szülés alatti kumulatív + műtét alatti mért",
  source: {
    cite: "WHO/FIGO/ICM közös állásfoglalás a szülés utáni vérzés 300 mL-es " +
          "beavatkozási küszöbéről (2025); CMQCC Obstetric Hemorrhage Toolkit V3.0 (2022)",
    standard: "WHO / CMQCC",
  },
  verified: false,
  verifiedNote:
    "Maga az összeadás triviális — DE a kapu nem a képlet nehézségéről szól, " +
    "hanem arról, hogy a rendszer viselkedéséhez csak aláírt számítás járul " +
    "hozzá. Amit itt alá kell írni, az nem az összeg, hanem az ÁLLÍTÁS: hogy a " +
    "szülés alatti és a műtét alatti mért vérvesztés ugyanannak a betegnek " +
    "ugyanabból a vérzéséből származik, és hogy a beavatkozási küszöb az " +
    "ÖSSZEGRE vonatkozik. Ez klinikai állásfoglalás, nem aritmetika. " +
    "(A `calc.cmqcc.stage`, amit ez táplál, ugyanúgy kapu mögött áll.)",
  caveats: {
    hu: "EZ A MEZŐ EGY FEDÉS FELOLDÁSA. A vajúdó nő, aki császármetszésre kerül, " +
        "két mezőbe veszít vért, és a kettőnek KÜLÖN küszöbe volt (300 mL a " +
        "szülésnél, 1000 mL a műtétnél) — vagyis 400 mL vajúdás közben kritikus " +
        "volt, 700 mL a műtét alatt nem, és az 1100 mL összesent senki nem " +
        "számolta ki. A beteg EGY, és a vér, amit elveszített, ugyanaz. " +
        "A HIÁNYZÓ SZAKASZ NEM NULLA: ha a beteg vajúdott, de a szülészeti érték " +
        "hiányzik, ez az összeg ALSÓ BECSLÉS — a `core/fedes/feloldas.ts` " +
        "`verzesOsszeg()` függvénye ezt külön kimondja.",
  },
  fn: (labourMl, opMl) => {
    const a = Number.isFinite(labourMl) ? labourMl : 0;
    const b = Number.isFinite(opMl) ? opMl : 0;
    if (!Number.isFinite(labourMl) && !Number.isFinite(opMl)) return null;
    return a + b;
  },
};

const cmqcc: CalcDef = {
  id: "calc.cmqcc.stage",
  label: { hu: "CMQCC vérzési stádium", en: "CMQCC hemorrhage stage" },
  kind: "classification",
  module: "labour",
  inputs: [
    /* A TELJES vérvesztés, nem csak a szülés alatti: a császármetszésre kerülő
       vajúdó nő vére két mezőben van, és a stádium az összegre vonatkozik. */
    { id: "labour.qbl.total", unit: "mL", required: true },
    { id: "vitals.shockIndex", unit: "1", required: true },
  ],
  output: {
    unit: "{stádium}", digits: 0,
    bands: [
      { max: 1, label: { hu: "0 — megelőzés, kockázatbecslés" }, severity: "normal" },
      { min: 1, max: 2, label: { hu: "1 — fokozott figyelés, uterotonikum, vérkép" }, severity: "watch" },
      { min: 2, max: 3, label: { hu: "2 — vérzéscsillapító protokoll, vércsoport és kereszt" }, severity: "redflag" },
      { min: 3, label: { hu: "3 — masszív transzfúziós protokoll, műtői készenlét" }, severity: "redflag" },
    ],
  },
  formula:
    "stádium a KUMULATÍV vérvesztésből és a sokk-indexből: " +
    "≥ 1500 mL vagy SI ≥ 1,4 → 3 · ≥ 1000 mL vagy SI ≥ 1,0 → 2 · " +
    "≥ 300 mL → 1 · egyébként 0",
  source: {
    cite: "CMQCC Obstetric Hemorrhage Toolkit V3.0 (2022); WHO/FIGO/ICM közös " +
          "állásfoglalás a szülés utáni vérzés 300 mL-es beavatkozási küszöbéről (2025)",
    standard: "CMQCC / WHO",
  },
  verified: false,
  verifiedNote:
    "A STÁDIUMHATÁROK nincsenek visszaellenőrizve az eszköztár elsődleges " +
    "szövegével, és a 300 mL-es küszöb új ajánlásból származik, amit a CMQCC " +
    "v3.0 még nem tükröz. A kettő összeillesztése SAJÁT DÖNTÉS, nem publikált " +
    "algoritmus — ezért áll kapu mögött.",
  caveats: {
    hu: "A MÉRT és a BECSÜLT vérvesztés nem ugyanaz: a vizuális becslés a valós " +
        "vérzést rendszeresen alábecsüli, és minél nagyobb a vérzés, annál " +
        "jobban. A stádium ezért csak MÉRT (kumulatív, tömeg- és térfogatalapú) " +
        "vérvesztésből értelmes. A sokk-index a fiatal terhesnél korábban jelez, " +
        "mint a vérnyomás — de vajúdás alatt a fájdalom is emeli.",
  },
  fn: (qbl, si) => {
    if (qbl >= 1500 || si >= 1.4) return 3;
    if (qbl >= 1000 || si >= 1.0) return 2;
    if (qbl >= 300) return 1;
    return 0;
  },
};



/* ── Perioperatív ─────────────────────────────────────────────────────── */


const latchTotal: CalcDef = {
  id: "calc.latch.total",
  label: { hu: "LATCH összpontszám", en: "LATCH total score" },
  kind: "score",
  module: "neo",
  inputs: [
    { id: "neo.latch.latch", required: true },
    { id: "neo.latch.audible", required: true },
    { id: "neo.latch.nipple", required: true },
    { id: "neo.latch.comfort", required: true },
    { id: "neo.latch.hold", required: true },
  ],
  output: { unit: "{pont}", digits: 0 },
  formula: "az öt tétel összege, egyenként 0–2 pont (0–10)",
  source: {
    cite: "Jensen D, Wallace S, Kelsay P. LATCH: a breastfeeding charting system and " +
          "documentation tool. J Obstet Gynecol Neonatal Nurs 1994;23(1):27-32",
    pmid: "8176525",
    standard: "LATCH",
  },
  verified: true,
  verifiedNote: "Öt tétel összeadása. Nincs illesztett paraméter.",
  caveats: {
    hu: "AZ ÖSSZPONTSZÁM ELFEDI A TÉTELT: egy 8 pontos összeg is jelenthet 0 " +
        "pontos „kényelem\u201d tételt — vagyis fájdalmas szoptatást, ami " +
        "önmagában beavatkozást indokol. Az eszköz emellett a licenc-kapu miatt " +
        "ma NEM vehető fel.",
  },
  fn: (l, a, t, c, h) => l + a + t + c + h,
};

/* ── 16. modul — beteg által jelentett kimenetel ─────────────────────── */

const whodasTotal: CalcDef = {
  id: "calc.whodas.total",
  label: { hu: "WHODAS 2.0-12 összpontszám", en: "WHODAS 2.0-12 simple score" },
  kind: "score",
  module: "prom",
  inputs: Array.from({ length: 12 }, (_, i) => ({ id: `prom.whodas.q${i + 1}`, required: true })),
  output: { unit: "{pont}", digits: 0 },
  formula: "a 12 tétel összege, egyenként 1–5 pont, nullára tolva (0–48)",
  source: {
    cite: "Üstün TB et al. Measuring Health and Disability: Manual for WHO Disability " +
          "Assessment Schedule (WHODAS 2.0). WHO 2010",
    standard: "WHO WHODAS 2.0",
  },
  verified: true,
  verifiedNote: "Egyszerű összegzés; a tételek 1–5 skálája tételenként 1-gyel eltolva.",
  caveats: {
    hu: "EGYSZERŰ ÖSSZEGZÉS. A WHODAS hivatalos, tételválasz-elméleti (IRT) " +
        "pontozása MÁS számot ad, és nincs megvalósítva. A kettő nem cserélhető " +
        "fel, és a nemzetközi összehasonlításnál jelezni kell, melyiket használtuk.",
  },
  fn: (...q) => q.reduce((a, b) => a + (b - 1), 0),
};

const bsesTotal: CalcDef = {
  id: "calc.bses.total",
  label: { hu: "BSES-SF összpontszám", en: "BSES-SF total score" },
  kind: "score",
  module: "prom",
  inputs: Array.from({ length: 14 }, (_, i) => ({ id: `prom.bses.q${i + 1}`, required: true })),
  output: { unit: "{pont}", digits: 0 },
  formula: "a 14 tétel összege, egyenként 1–5 pont (14–70)",
  source: {
    cite: "Dennis CL. The breastfeeding self-efficacy scale: psychometric assessment of " +
          "the short form. J Obstet Gynecol Neonatal Nurs 2003;32(6):734-744",
    pmid: "14649593",
    standard: "BSES-SF",
  },
  verified: true,
  verifiedNote: "Tizennégy tétel összeadása. Nincs illesztett paraméter.",
  caveats: {
    hu: "A skálának NINCS általánosan elfogadott vágóértéke: az alacsonyabb " +
        "pontszám kisebb önhatékonyságot jelez, de hogy hol kezdődik a " +
        "beavatkozási igény, populációfüggő. A rendszer ezért sávot nem ad.",
  },
  fn: (...q) => q.reduce((a, b) => a + b, 0),
};

const bssrTotal: CalcDef = {
  id: "calc.bssr.total",
  label: { hu: "BSS-R összpontszám", en: "BSS-R total score" },
  kind: "score",
  module: "prom",
  inputs: Array.from({ length: 10 }, (_, i) => ({ id: `prom.bssr.q${i + 1}`, required: true })),
  output: { unit: "{pont}", digits: 0 },
  formula: "a 10 tétel összege, egyenként 0–4 pont (0–40)",
  source: {
    cite: "Hollins Martin CJ, Martin CR. Development and psychometric properties of the " +
          "Birth Satisfaction Scale-Revised (BSS-R). Midwifery 2014;30(6):610-619",
    pmid: "23976427",
    standard: "BSS-R",
  },
  verified: true,
  verifiedNote: "Tíz tétel összeadása. A fordított tételek besorolása a törzsben van.",
  caveats: {
    hu: "A BSS-R HÁROM ALSKÁLÁRA bomlik, de a hivatalos tétel-besorolás nincs " +
        "betöltve — a rendszer ezért CSAK az összpontszámot adja. Az alskálák " +
        "külön értelmezése enélkül nem megbízható.",
  },
  fn: (...q) => q.reduce((a, b) => a + b, 0),
};

/**
 * EQ-5D-5L PROFIL — kód, nem mennyiség.
 *
 * Az öt dimenzió szintje egymás mellé írva („21123"). A kalkulátor-réteg
 * számot ad, és ez itt szerencsés: a profil ötjegyű szám, aminek MINDEN
 * JEGYE önálló jelentésű. Átlagot vagy különbséget képezni belőle
 * értelmetlen — ezt a mező dokumentációja ki is mondja.
 *
 * Amit a rendszer NEM ad: hasznossági INDEXET. Ahhoz országspecifikus,
 * licencelt értékkészlet kell; egy másik ország értékkészletével számolt
 * index nem magyar adat.
 */
const eq5dProfile: CalcDef = {
  id: "calc.eq5d.profile",
  label: { hu: "EQ-5D-5L profil", en: "EQ-5D-5L profile" },
  kind: "formula",
  module: "prom",
  inputs: [
    { id: "prom.eq5d.mobility", required: true },
    { id: "prom.eq5d.selfCare", required: true },
    { id: "prom.eq5d.activities", required: true },
    { id: "prom.eq5d.pain", required: true },
    { id: "prom.eq5d.anxiety", required: true },
  ],
  output: { unit: null, digits: 0 },
  formula: "profil = a mozgékonyság, önellátás, tevékenységek, fájdalom és szorongás szintje egymás után",
  source: {
    cite: "Herdman M et al. Development and preliminary testing of the new five-level " +
          "version of EQ-5D (EQ-5D-5L). Qual Life Res 2011;20(10):1727-1736",
    pmid: "21479777",
    standard: "EuroQol EQ-5D-5L",
  },
  verified: true,
  verifiedNote: "Helyiérték szerinti összefűzés; nincs illesztett paraméter.",
  caveats: {
    hu: "EZ KÓD, NEM MENNYISÉG: minden jegye önálló jelentésű, átlagot vagy " +
        "különbséget képezni belőle értelmetlen. HASZNOSSÁGI INDEXET a rendszer " +
        "NEM ad: ahhoz országspecifikus, licencelt értékkészlet kell, és egy " +
        "másik ország értékkészletével számolt index nem magyar adat.",
  },
  fn: (mo, sc, ua, pd, ad) => mo * 10000 + sc * 1000 + ua * 100 + pd * 10 + ad,
};

/* ── 15. modul — utánkövetés és újszülöttellátás ─────────────────────── */

/**
 * A DURVÁBB ÉRTÉKET SZÁMOLJUK KI, NEM A FINOMABBAT EXPORTÁLJUK.
 *
 * Az ICHOM a SZÜLETÉSI ÉVET kéri (PCB001), nem a dátumot. A születési dátum
 * `phi` jelölésű, és az exportból kimarad — a belőle levezetett év viszont
 * nem azonosít, és exportálható. Ez a de-identifikálás legolcsóbb formája:
 * nem elrejtünk, hanem eleve kevesebbet számolunk ki.
 */
const birthYear: CalcDef = {
  id: "calc.birthYear",
  label: { hu: "Születési év", en: "Year of birth" },
  kind: "formula",
  module: "admin",
  inputs: [{ id: "patient.birthDate", required: true }],
  output: { unit: null, digits: 0 },
  formula: "év = a születési dátum naptári éve (UTC)",
  source: { cite: "ICHOM Pregnancy & Childbirth Standard Set v5.0, PCB001", standard: "ICHOM PCB v5.0" },
  verified: true,
  verifiedNote: "Naptári év kiolvasása. Nincs illesztett paraméter.",
  caveats: {
    hu: "A születési DÁTUM `phi`, a születési ÉV nem az. Az export ezért az " +
        "évet viszi — a dátumot soha.",
  },
  fn: (birthMs) => new Date(birthMs).getUTCFullYear(),
};

/**
 * NRP — újszülött-újraélesztés súlyalapú adagjai.
 *
 * Három külön kalkulátor, mert három külön döntés. Mind a három bemenete a
 * SZÜLETÉSI SÚLY: enélkül egyik sem ad számot, és ez a helyes viselkedés —
 * egy „átlagos újszülöttre" becsült adag újraélesztés közben nem segítség.
 */
const nrpEpiIv: CalcDef = {
  id: "calc.nrp.epi.iv",
  label: { hu: "NRP — epinephrin adag (IV/IO)", en: "NRP epinephrine dose (IV/IO)" },
  kind: "formula",
  module: "neo",
  inputs: [{ id: "nb.birthWeight", required: true, note: { hu: "grammban rögzítve" } }],
  output: { unit: "mg", digits: 3 },
  formula: "adag [mg] = testsúly [kg] × 0,02",
  source: {
    cite: "Aziz K et al. Part 5: Neonatal Resuscitation — 2020 AHA Guidelines for CPR and ECC. " +
          "Circulation 2020;142(16_suppl_2):S524-S550; NRP 8th edition (AAP/AHA 2021)",
    standard: "NRP 8. kiadás",
  },
  verified: true,
  verifiedNote:
    "Egyetlen szorzás, az ajánlás 0,02 mg/ttkg IV/IO adagjával (1:10 000 hígításban " +
    "0,2 mL/ttkg). A gramm→kilogramm váltás a képlet része.",
  caveats: {
    hu: "AZ ADAG MELLETT A TÉRFOGAT SZÁMÍT A GYAKORLATBAN: 1:10 000 hígításnál " +
        "0,2 mL/ttkg. A hígítás elrontása nagyságrendi tévedés — az adag " +
        "önmagában nem elég, a készítmény koncentrációját is látni kell.",
  },
  fn: (weightG) => (weightG > 0 ? (weightG / 1000) * 0.02 : null),
};

const nrpVolume: CalcDef = {
  id: "calc.nrp.volume",
  label: { hu: "NRP — volumenbolus", en: "NRP volume bolus" },
  kind: "formula",
  module: "neo",
  inputs: [{ id: "nb.birthWeight", required: true }],
  output: { unit: "mL", digits: 0 },
  formula: "bolus [mL] = testsúly [kg] × 10",
  source: {
    cite: "Aziz K et al. Part 5: Neonatal Resuscitation. Circulation 2020;142(16_suppl_2):S524-S550; " +
          "NRP 8th edition (AAP/AHA 2021)",
    standard: "NRP 8. kiadás",
  },
  verified: true,
  verifiedNote: "Egyetlen szorzás, 10 mL/ttkg fiziológiás sóoldat.",
  caveats: {
    hu: "A volumenpótlás javallata SZŰK: igazolt vagy alaposan feltételezett " +
        "vérvesztés, rossz perfúzióval. Volumenhiány nélkül adva a bolus árt.",
  },
  fn: (weightG) => (weightG > 0 ? (weightG / 1000) * 10 : null),
};

const dextroseGel: CalcDef = {
  id: "calc.neo.dextroseGel",
  label: { hu: "40% dextróz gél adag", en: "40% dextrose gel dose" },
  kind: "formula",
  module: "neo",
  inputs: [{ id: "nb.birthWeight", required: true }],
  output: { unit: "mL", digits: 1 },
  formula: "adag [mL] = testsúly [kg] × 0,5",
  source: {
    cite: "Harris DL et al. Dextrose gel for neonatal hypoglycaemia (the Sugar Babies Study): " +
          "a randomised, double-blind, placebo-controlled trial. Lancet 2013;382(9910):2077-2083",
    pmid: "24075361",
    standard: "Sugar Babies RCT",
  },
  verified: true,
  verifiedNote: "Egyetlen szorzás, 0,5 mL/ttkg 40%-os dextróz gél buccalisan.",
  caveats: {
    hu: "A gél a SZOPTATÁS MELLETT adandó, nem helyette — a vizsgálatban is így " +
        "szerepelt. A beavatkozási küszöb életkorfüggő: az első 4 órában más, " +
        "mint 24 óra után, ezért egyetlen vércukorérték önmagában nem javallat.",
  },
  fn: (weightG) => (weightG > 0 ? (weightG / 1000) * 0.5 : null),
};

/* ── INTERGROWTH-21st BECSLŐMÓDSZEREK ────────────────────────────────────
 *
 * Négy becslés ugyanabból a forrásból, és a NEGYEDIK a tanulságos.
 *
 * A gesztációs kor becslésére három módszer van: a koronacsont–farcsont
 * távolság (CRL) a korai terhességben, a fejkörfogat és a combcsonthossz
 * együtt a késeiben, és — CSAK HA A COMBCSONTHOSSZ NEM ÁLL RENDELKEZÉSRE — a
 * fejkörfogat önmagában. A forrás ezt kimondja, nagybetűvel.
 *
 * Ha a rendszer mind a hármat egyformán felkínálja, akkor a pontatlanabbat
 * ugyanolyan könnyű elindítani, mint a pontosabbat, és a választás azon fog
 * múlni, melyik mezőt töltötték ki előbb. Ezért A FEJKÖRFOGAT-ALAPÚ BECSLÉS
 * BEMENETE MAGA A COMBCSONTHOSSZ IS: ha megvan, a kalkulátor NEM ad eredményt,
 * hanem a jobbik módszerhez küld. A megszorítás így nem jótanács a
 * dokumentációban, hanem a számítás része.
 *
 * ÉS A TARTOMÁNY IS A SZÁMÍTÁS RÉSZE. A CRL-alapú datálás 15 és 95 mm között
 * érvényes; egy 120 mm-es CRL-re a képlet ad számot, csak az a szám rossz. A
 * tartományon kívül `null` a válasz — nem becslés, hanem a becslés hiánya.
 */

const gaCrlIg21: CalcDef = {
  id: "calc.ga.crl.ig21",
  label: { hu: "Gesztációs kor CRL-ből (INTERGROWTH-21st)",
           en: "Gestational age from CRL (INTERGROWTH-21st)" },
  kind: "formula",
  module: "vizsgalatok",
  inputs: [{ id: "us.crl", unit: "mm", required: true }],
  output: { unit: "wk", digits: 2 },
  formula:
    "GA[nap] = 40,9041 + 3,21585·√CRL + 0,348956·CRL   (CRL mm-ben, 15–95 mm között)",
  source: { cite: "Papageorghiou AT, Kennedy SH, Salomon LJ et al. International standards for early fetal size and pregnancy dating based on ultrasound measurement of crown–rump length in the first trimester of pregnancy. Ultrasound Obstet Gynecol 2014;44:641–8. © University of Oxford.", pmid: "25184867" },
  verified: false,
  verifiedNote:
    "A képlet a hivatalos INTERGROWTH-21st datáló számolótáblából (v1.1) került " +
    "át, de az együtthatókat még nem vetette össze senki az elsődleges " +
    "közleménnyel. A DATÁLÁS A TERHESSÉG LEGNAGYOBB HATÁSÚ EGYETLEN SZÁMA: a " +
    "gesztációs kor minden későbbi percentilist, minden ablakot és az " +
    "indukció idejét is eltolja.",
  caveats: {
    hu: "15 mm ALATT és 95 mm FÖLÖTT a képlet nem érvényes, és a kalkulátor nem " +
        "ad eredményt. 95 mm fölött a fejkörfogat–combcsonthossz módszer való. " +
        "A datálás sorrendje ettől függetlenül áll: IVF-transzfer → korai CRL → " +
        "utolsó menstruáció → késői biometria (`ctx.gaSource`), és egy késői " +
        "biometriai datálás NEM írhatja felül a korai CRL-t.",
  },
  fn: (crlMm) => {
    if (!(crlMm >= 15 && crlMm <= 95)) return null;
    return (40.9041 + 3.21585 * Math.sqrt(crlMm) + 0.348956 * crlMm) / 7;
  },
};

const gaHcFlIg21: CalcDef = {
  id: "calc.ga.hcfl.ig21",
  label: { hu: "Gesztációs kor fejkörfogatból és combcsonthosszból (INTERGROWTH-21st)",
           en: "Gestational age from HC and FL (INTERGROWTH-21st)" },
  kind: "formula",
  module: "vizsgalatok",
  inputs: [
    { id: "us.hc", unit: "mm", required: true },
    { id: "us.fl", unit: "mm", required: true },
  ],
  output: { unit: "wk", digits: 2 },
  formula:
    "GA[nap] = exp(0,03243·(ln HC)² + 0,001644·FL·ln HC + 3,813)   (HC és FL mm-ben)",
  source: { cite: "Papageorghiou AT, Kemp B, Stones W et al. Ultrasound-based gestational-age estimation in late pregnancy. Ultrasound Obstet Gynecol 2016;48:719–26. © University of Oxford.", pmid: "26924421" },
  verified: false,
  verifiedNote:
    "A képlet a hivatalos INTERGROWTH-21st datáló számolótáblából (v1.1) került " +
    "át; az együtthatók visszaellenőrzése hiányzik.",
  caveats: {
    hu: "A KÉSEI DATÁLÁS PONTATLAN, és ez nem a képlet hibája: a második-harmadik " +
        "trimeszterben a magzatok közötti méretkülönbség már nagyobb, mint a " +
        "korkülönbség. Ezért ez a becslés csak akkor datál, ha korábbi datálás " +
        "NINCS — meglévő korai CRL-datálást nem írhat felül.",
  },
  fn: (hcMm, flMm) => {
    if (!(hcMm > 0 && flMm > 0)) return null;
    return Math.exp(0.03243 * Math.log(hcMm) ** 2
      + 0.001644 * flMm * Math.log(hcMm) + 3.813) / 7;
  },
};

const gaHcIg21: CalcDef = {
  id: "calc.ga.hc.ig21",
  label: { hu: "Gesztációs kor fejkörfogatból (INTERGROWTH-21st) — csak FL hiányában",
           en: "Gestational age from HC alone (INTERGROWTH-21st) — only if FL unavailable" },
  kind: "formula",
  module: "vizsgalatok",
  inputs: [
    { id: "us.hc", unit: "mm", required: true },
    /*
     * NEM SZÁMÍTÁSI BEMENET, HANEM KIZÁRÓ FELTÉTEL. A combcsonthossz nem
     * szerepel a képletben — azért kérjük mégis, mert a forrás szerint ezt a
     * módszert CSAK akkor szabad használni, ha a combcsonthossz nem áll
     * rendelkezésre. Ha megvan, a kalkulátor eredmény helyett hallgat.
     */
    { id: "us.fl", unit: "mm", required: false },
  ],
  output: { unit: "wk", digits: 2 },
  formula:
    "GA[nap] = exp(0,0597·(ln HC)² + 6,409·10⁻⁹·HC³ + 3,3258)   (HC mm-ben; " +
    "CSAK ha a combcsonthossz nem mérhető)",
  source: { cite: "Papageorghiou AT, Kemp B, Stones W et al. Ultrasound-based gestational-age estimation in late pregnancy. Ultrasound Obstet Gynecol 2016;48:719–26. © University of Oxford.", pmid: "26924421" },
  verified: false,
  verifiedNote:
    "Az együtthatók visszaellenőrzése hiányzik. A forrás ezt a módszert " +
    "kifejezetten MÁSODLAGOSNAK jelöli.",
  caveats: {
    hu: "A forrás kimondja: ez a módszer CSAK AKKOR használandó, HA A " +
        "COMBCSONTHOSSZ NEM ÁLL RENDELKEZÉSRE. Ezért ha a combcsonthossz " +
        "rögzítve van, ez a kalkulátor NEM ad eredményt — a fejkörfogat–" +
        "combcsonthossz módszer való oda. A megszorítás nem jótanács, hanem a " +
        "számítás része: különben azon múlna a módszerválasztás, melyik mezőt " +
        "töltötték ki előbb.",
  },
  fn: (hcMm, flMm) => {
    if (Number.isFinite(flMm)) return null;      // van FL → a jobbik módszer való
    if (!(hcMm > 0)) return null;
    return Math.exp(0.0597 * Math.log(hcMm) ** 2
      + 0.000000006409 * hcMm ** 3 + 3.3258) / 7;
  },
};

const efwIg21: CalcDef = {
  id: "calc.efw.ig21",
  label: { hu: "Becsült magzati súly (INTERGROWTH-21st)",
           en: "Estimated fetal weight (INTERGROWTH-21st)" },
  kind: "formula",
  module: "vizsgalatok",
  inputs: [
    { id: "us.hc", unit: "mm", required: true },
    { id: "us.ac", unit: "mm", required: true },
  ],
  output: { unit: "g", digits: 0 },
  formula:
    "ln(EFW) = 5,08482 − 54,06633·(AC/100)³ − 95,80076·(AC/100)³·ln(AC/100) " +
    "+ 3,13637·(HC/100)   (AC és HC CENTIMÉTERBEN)",
  source: { cite: "Stirnemann J, Villar J, Salomon LJ et al. International estimated fetal weight standards of the INTERGROWTH-21st Project. Ultrasound Obstet Gynecol 2017;49:478–86. © University of Oxford.", pmid: "27804212" },
  verified: false,
  verifiedNote:
    "A képlet a hivatalos INTERGROWTH-21st EFW számolótáblából került át; az " +
    "együtthatókat még nem vetette össze senki az elsődleges közleménnyel. A " +
    "súlybecslésre indukciós és császármetszési döntés épül.",
  caveats: {
    hu: "KÉT PARAMÉTERES: csak a haskörfogat és a fejkörfogat kell hozzá — a " +
        "Hadlock ezzel szemben négy méretet kér. Ez nem egyszerűsítés, hanem " +
        "MÁS MODELL, és a kettő eredménye eltér; a kettő KÖZÖTTI választás " +
        "szakmai döntés, nem a rendelkezésre álló mezőké. A becsült magzati " +
        "súly konfidencia-intervalluma itt is ±15% körüli, és a szám sosem " +
        "jelenik meg intervallum és percentilis nélkül.",
  },
  fn: (hcMm, acMm) => {
    if (!(hcMm > 0 && acMm > 0)) return null;
    const ac = acMm / 10 / 100, hc = hcMm / 10 / 100;       // mm → cm → a képlet skálája
    return Math.exp(5.08482 - 54.06633 * ac ** 3
      - 95.80076 * ac ** 3 * Math.log(ac) + 3.13637 * hc);
  },
};

export const CALCULATORS: CalcDef[] = [
  age, bmi, bsa, weightGain, whr, map, pulsePressure, shockIndex,
  ferrimanGallwey, romHours,
  gaLmp, eddNaegele, bishop, apgar,
  qtcBazett, qtcFridericia,
  egfr, efwHadlock, efwIg21, cpr,
  gaCrlIg21, gaHcFlIg21, gaHcIg21,
  crcl, lmwh,
  proteinPregnancy, energyPregnancy,
  epdsTotal, whooleyTotal, phq9Total, mspssTotal, mibsTotal,
  labourHours, meows, omqsofa, isthDic, qblTotal, cmqcc, cmqccSepsis,
  birthYear, nrpEpiIv, nrpVolume, dextroseGel, latchTotal,
  whodasTotal, bsesTotal, bssrTotal, eq5dProfile,
];

export const CALC_BY_ID = new Map(CALCULATORS.map((c) => [c.id, c]));

/**
 * Kalkulátor regisztrálása a magon kívülről.
 *
 * Ez a modulok bővítési pontja: egy modulcsomag a saját képleteit itt teszi
 * elérhetővé, anélkül hogy a magot módosítaná. A szabályok ugyanazok —
 * elsődleges forrás és `verified` jelölés nélkül a kalkulátor nem ad számot.
 *
 * Felülírni nem lehet: egy azonosítóhoz egy képlet tartozik, különben két
 * modul csendben eltérő eredményt adna ugyanarra a fogalomra.
 */
export function registerCalc(def: CalcDef): void {
  if (CALC_BY_ID.has(def.id)) {
    throw new Error(
      `A(z) ${def.id} kalkulátor már regisztrálva van. Egy azonosítóhoz egy képlet ` +
      `tartozik — felülírás helyett új azonosítót adj (pl. verziószámmal).`,
    );
  }
  if (!def.source.cite) throw new Error(`${def.id}: hiányzik az elsődleges forrás`);
  if (!def.verified && !def.verifiedNote) {
    throw new Error(`${def.id}: kapuzott kalkulátorhoz kötelező a verifiedNote indoklás`);
  }
  CALCULATORS.push(def);
  CALC_BY_ID.set(def.id, def);
}
