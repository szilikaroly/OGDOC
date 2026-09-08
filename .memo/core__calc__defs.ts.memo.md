---
source: core/calc/defs.ts
sha256: b5315efa1cdbfd0d2b4d8e0571925648712008db931621bc6421dadd64f1e08c
lines: 1542
profile: code
generator: subagent
raw_tokens_est: 17190
verified: 50 confirmed
---

# core/calc/defs.ts

## Topics
- L1-160: Antropometria (BMI, BSA), életkor és vitálisok (MAP, pulzusnyomás)
- L161-320: Sokk-index, gesztációs kor, EDD, Bishop, Apgar, Bazett-QTc
- L321-480: Fridericia-QTc, kapuzott eGFR és Hadlock-EFW, súlygyarapodás
- L481-640: Derék–csípő arány, Ferriman–Gallwey, burokrepedés-idő, CPR, CrCl
- L641-800: Cockcroft–Gault, LMWH-adag, terhességi fehérje- és energiacél
- L801-960: Perinatális mentális eszközök (EPDS, Whooley, PHQ-9, MSPSS, MIBS)
- L961-1120: MEOWS, omqSOFA és a regiszterből épülő CMQCC szepszis-szűrő
- L1121-1280: Szepszis-szűrő kiértékelése, ISTH DIC, CMQCC vérzési stádium, LATCH
- L1281-1440: PROM-eszközök (WHODAS, BSES-SF, BSS-R, EQ-5D profil), születési év
- L1441-1542: NRP újszülött-adagok, a kalkulátorlista és a regisztráló függvény

## Claims

- [C1] [CONFIRMED] A BMI bemenete kifejezetten a terhesség előtti testsúly, nem az aktuális @L25 `{ id: "anthro.weight.prepregnancy", unit: "kg", required: true },`
- [C2] [CONFIRMED] A BMI nulla vagy negatív testmagasságnál `null`-t ad @L48 `return m > 0 ? weightKg / (m * m) : null;`
- [C3] [CONFIRMED] A Mosteller-testfelszín az aktuális testsúlyból, 3600-as osztóval számol @L68 `fn: (heightCm, weightKg) => Math.sqrt((heightCm * weightKg) / 3600),`
- [C4] [CONFIRMED] Az életkor 365,2425 napos gregorián átlagévvel, lefelé kerekítve; jövőbeli születési dátumnál `null` @L91 `nowMs >= birthMs ? Math.floor((nowMs - birthMs) / 86_400_000 / 365.2425) : null,`
- [C5] [CONFIRMED] A MAP diasztolés súlyozású közelítés: (SBP + 2·DBP)/3 @L122 `fn: (sbp, dbp) => (sbp + 2 * dbp) / 3,`
- [C6] [CONFIRMED] A 25 mm Hg alatti pulzusnyomás vörös zászló, hypovolaemia gyanújával @L137 `{ max: 25, label: { hu: "szűkült — hypovolaemia gyanúja" }, severity: "redflag" },`
- [C7] [CONFIRMED] A sokk-index 0,9 és 1,7 küszöbe szülészeti közleményből való, nem az általános traumatológiai 1,0-ból @L172 `verifiedNote: "A hányados triviális; a 0,9 és 1,7 küszöb a hivatkozott szülészeti " +`
- [C8] [CONFIRMED] A gesztációs kor napkülönbség/7; jövőbeli LMP-nél `null` @L203 `fn: (lmpMs, nowMs) => (nowMs >= lmpMs ? (nowMs - lmpMs) / 86_400_000 / 7 : null),`
- [C9] [CONFIRMED] Az EDD az LMP + 280 nap, ciklushossz-korrekció nélkül @L222 `fn: (lmpMs) => lmpMs + 280 * 86_400_000,`
- [C10] [CONFIRMED] A Bishop-pontszámnál csak a tágulat és az elvékonyodás sávozódik a kódban; a beszállás, konzisztencia és pozíció kódja már maga a pontérték @L260 `return d + e + station + consistency + position;`
- [C11] [CONFIRMED] Az Apgar öt tétel súlyozatlan összege @L294 `fn: (a, p, g, ac, r) => a + p + g + ac + r,`
- [C12] [CONFIRMED] A Fridericia-korrekció köbgyököt használ; nulla vagy negatív pulzusnál `null` @L356 `return qtMs / Math.cbrt(60 / hr);`
- [C13] [CONFIRMED] A CKD-EPI 2021 eGFR kapu mögött van: `verified: false` @L376 `verified: false,`
- [C14] [CONFIRMED] Az eGFR-be a női κ = 0,7 és α = −0,241 együttható be van égetve @L388 `const k = 0.7, a = -0.241;`
- [C15] [CONFIRMED] Az eGFR a kreatinint 88,4-es osztóval váltja µmol/L-ről mg/dL-re @L387 `const scr = crUmol / 88.4;`
- [C16] [CONFIRMED] A Hadlock-EFW a mm-ben kapott UH-méreteket 10-zel osztva cm-re váltja @L422 `const bpd = bpdMm / 10, hc = hcMm / 10, ac = acMm / 10, fl = flMm / 10;`
- [C17] [CONFIRMED] A súlygyarapodásnak szándékosan nincs `bands` mezője, mert az IOM-célsáv a BMI-től és a gesztációs kortól függ @L451 `Ezért itt szándékosan NINCS`
- [C18] [CONFIRMED] A derék–csípő arány nulla csípőkörfogatnál `null` @L491 `fn: (waistCm, hipCm) => (hipCm > 0 ? waistCm / hipCm : null),`
- [C19] [CONFIRMED] A Ferriman–Gallwey a kilenc tájékot variadikus összegzéssel adja össze, súlyozás nélkül @L534 `fn: (...a) => a.reduce((s, x) => s + x, 0),`
- [C20] [CONFIRMED] A burokrepedés óta eltelt idő 24 óra felett vörös zászló, chorioamnionitis-rizikóval @L551 `{ min: 24, label: { hu: "24 óra felett — chorioamnionitis-rizikó, szülésbefejezés mérlegelendő" }, severity: "redflag" },`
- [C21] [CONFIRMED] A cerebro-placentáris aránynak nincs `bands` mezője, mert a normáltartomány gesztációs kortól függ @L583 `output: { unit: "1", digits: 2 },`
- [C22] [CONFIRMED] A Cockcroft–Gault kapuzott, mert az SI-re átszámolt 1,04-es női együttható nincs visszaellenőrizve @L631 `"Az SI-egységre átszámolt 1,04-es női együttható nincs visszaellenőrizve az " +`
- [C23] [CONFIRMED] Az LMWH-adagnál szándékosan nincs `bands`, mert a testsúlysávok a bemenetet írnák le, nem a kimenetet @L652 `SÁV NINCS, SZÁNDÉKOSAN.`
- [C24] [CONFIRMED] Az LMWH sávos tábla 170 kg felett 0,6 mg/kg-ra vált, egészre kerekítve @L682 `return Math.round(0.6 * weightKg);`
- [C25] [CONFIRMED] A fehérjecél 1,1 g/kg a terhesség előtti testsúlyra, és nincs kapu mögött @L715 `fn: (weightKg) => 1.1 * weightKg,`
- [C26] [CONFIRMED] Az energiacél trimeszter-többlete lépcsős: 14 hét alatt 0, 28 hét alatt 340, felette 452 kcal @L756 `const extra = gaWeeks < 14 ? 0 : gaWeeks < 28 ? 340 : 452;`
- [C27] [CONFIRMED] Az EPDS vágóértéke nem itt van: a besorolás a kérdőív-motorban, kontextus ismeretében történik @L800 `hu: "A VÁGÓÉRTÉK NEM ITT VAN: az antepartum és a postnatalis küszöb eltér, " +`
- [C28] [CONFIRMED] Az MSPSS itt az ICHOM háromtételes rövidített változata @L891 `verifiedNote: "Három tétel összeadása. Az ICHOM rövidített, három tételes változata.",`
- [C29] [CONFIRMED] A MIBS a három pozitív tételt (3 − pont) alakban fordítja át, a negatívakat közvetlenül adja hozzá @L934 `(3 - affection) + resentment + neutrality + (3 - protective) + (3 - joy),`
- [C30] [CONFIRMED] A vajúdási idő jövőbeli kezdetnél `null`-t ad @L960 `fn: (startedMs, nowMs) =>`
- [C31] [CONFIRMED] A MEOWS nem pontokat súlyoz, hanem a tartományon kívüli paraméterek számát adja vissza @L1007 `fn: (sys, dia, pulse, rr, temp, spo2) => {`
- [C32] [CONFIRMED] Az omqSOFA négy küszöbkritériumot számol meg, egyenként 1 ponttal @L1053 `fn: (pulse, rr, temp, spo2) => {`
- [C33] [CONFIRMED] A szepszis-protokoll modulbetöltéskor, szinkron fájlolvasással kerül be a registryből @L1075 `const SEPSIS: SepsisProtocol = JSON.parse(`
- [C34] [CONFIRMED] A szűrő bemenetei a regiszterbeli kritériumokból generálódnak, az `eq`/`notEq` operátorúak kihagyásával @L1080 `const SEPSIS_SCREEN = SEPSIS.screen.criteria.filter((c) => c.op !== "eq" && c.op !== "notEq");`
- [C35] [CONFIRMED] A szepszis-szűrő sávhatára nem beégetett szám, hanem a regiszter `needed` értéke @L1099 `{ max: SEPSIS.screen.needed, label: { hu: "a szűrőküszöb alatt" }, severity: "normal" },`
- [C36] [CONFIRMED] A szepszis-szűrő öt operátort ismer, köztük az `outside`-ot alsó/felső határral @L1141 `else if (c.op === "outside" && (v < (c.low as number) || v > (c.high as number))) n++;`
- [C37] [CONFIRMED] Az ISTH DIC thrombocyta-pontja 50 alatt 2-ről visszaesik 1-re @L1189 `const p = plt > 185 ? 0 : plt >= 100 ? 1 : plt >= 50 ? 2 : 1;`
- [C38] [CONFIRMED] Az ISTH DIC a protrombin-idő különbségét az INR-ből közelíti, (INR − 1)·12 alakban @L1191 `const ptDiff = (inr - 1) * 12;`
- [C39] [CONFIRMED] A CMQCC stádium VAGY-kapcsolattal lép: 1500 mL vagy 1,4-es sokk-index már 3-as stádium @L1238 `if (qbl >= 1500 || si >= 1.4) return 3;`
- [C40] [CONFIRMED] A CMQCC stádium azért kapuzott, mert a 300 mL-es küszöb és a v3.0 összeillesztése saját döntés, nem publikált algoritmus @L1228 `"v3.0 még nem tükröz. A kettő összeillesztése SAJÁT DÖNTÉS, nem publikált " +`
- [C41] [CONFIRMED] A WHODAS összege tételenként 1-gyel nullára tolva összegez @L1303 `fn: (...q) => q.reduce((a, b) => a + (b - 1), 0),`
- [C42] [CONFIRMED] Az EQ-5D „profil” helyiérték szerint fűzi egyetlen ötjegyű számmá az öt szintet @L1394 `fn: (mo, sc, ua, pd, ad) => mo * 10000 + sc * 1000 + ua * 100 + pd * 10 + ad,`
- [C43] [CONFIRMED] A születési év UTC szerinti naptári évet ad — a dátum `phi`, az év nem @L1422 `fn: (birthMs) => new Date(birthMs).getUTCFullYear(),`
- [C44] [CONFIRMED] A BSES-SF-hez nincs sáv, mert nincs általánosan elfogadott vágóérték @L1325 `"beavatkozási igény, populációfüggő. A rendszer ezért sávot nem ad.",`
- [C45] [CONFIRMED] Az NRP epinephrin-adag grammból kilogrammot vált és 0,02-vel szoroz; nem pozitív súlynál `null` @L1454 `fn: (weightG) => (weightG > 0 ? (weightG / 1000) * 0.02 : null),`
- [C46] [CONFIRMED] Az NRP volumenbolus 10 mL/ttkg @L1476 `fn: (weightG) => (weightG > 0 ? (weightG / 1000) * 10 : null),`
- [C47] [CONFIRMED] A 40%-os dextróz gél adagja 0,5 mL/ttkg @L1500 `fn: (weightG) => (weightG > 0 ? (weightG / 1000) * 0.5 : null),`
- [C48] [CONFIRMED] A `CALC_BY_ID` a kalkulátorlistából épülő azonosító→definíció leképezés @L1517 `export const CALC_BY_ID = new Map(CALCULATORS.map((c) => [c.id, c]));`
- [C49] [CONFIRMED] A `registerCalc` kivételt dob már foglalt azonosítónál — felülírás nincs @L1530 `if (CALC_BY_ID.has(def.id)) {`
- [C50] [CONFIRMED] A `registerCalc` mellékhatásként a modulszintű `CALCULATORS` tömböt és a `CALC_BY_ID` mapet is módosítja @L1540 `CALCULATORS.push(def);`
