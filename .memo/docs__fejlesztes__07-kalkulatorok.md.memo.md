---
source: docs/fejlesztes/07-kalkulatorok.md
sha256: e779110a5a75a190cd13ba41b8eee07f2008ea2a7012a65d0e79a032c511b381
lines: 1633
profile: prose
generator: subagent
raw_tokens_est: 17108
verified: 50 confirmed
---

# docs/fejlesztes/07-kalkulatorok.md

## Topics
- L1-6: a fájl generált volta és a forrása
- L7-72: a 43 kalkulátor áttekintő táblája és a futtató két kapuja
- L73-103: calc.age — életkor a születési dátumból
- L104-145: calc.apgar — Apgar-pontszám
- L146-175: calc.birthYear — születési év
- L176-217: calc.bishop — Bishop-pontszám
- L218-258: calc.bmi — testtömegindex
- L259-289: calc.bsa.mosteller — testfelszín
- L290-332: calc.bses.total — BSES-SF összpontszám
- L333-371: calc.bssr.total — BSS-R összpontszám
- L372-402: calc.cpr — cerebro-placentáris arány
- L403-432: calc.edd.naegele — várható szülési időpont
- L433-471: calc.epds.total — EPDS összpontszám
- L472-505: calc.eq5d.profile — EQ-5D-5L profil
- L506-551: calc.ferrimanGallwey — hirsutismus-pontszám
- L552-582: calc.ga.lmp — gesztációs kor
- L583-613: calc.labour.hours — vajúdás óta eltelt idő
- L614-647: calc.latch.total — LATCH szoptatási pontszám
- L648-677: calc.lmwh.prophylaxis — enoxaparin profilaktikus adag
- L678-716: calc.map — középartériás nyomás
- L717-759: calc.meows — szülészeti korai figyelmeztető pontszám
- L760-793: calc.mibs.total — anya-újszülött kötődési skála
- L794-825: calc.mspss.total — észlelt társas támogatás
- L826-855: calc.neo.dextroseGel — dextróz gél adag
- L856-885: calc.nrp.epi.iv — újraélesztési epinephrin adag
- L886-915: calc.nrp.volume — volumenbolus
- L916-955: calc.omqsofa — szülészeti gyorsszepszis-szűrés
- L956-993: calc.phq9.total — PHQ-9 összpontszám
- L994-1023: calc.protein.pregnancy — terhességi fehérjeszükséglet
- L1024-1062: calc.pulsePressure — pulzusnyomás
- L1063-1101: calc.qtc.bazett — korrigált QT (Bazett)
- L1102-1140: calc.qtc.fridericia — korrigált QT (Fridericia)
- L1141-1179: calc.rom.hours — burokrepedés óta eltelt idő
- L1180-1218: calc.shockIndex — sokk-index
- L1219-1249: calc.weightGain — terhességi súlygyarapodás
- L1250-1290: calc.whodas.total — WHODAS 2.0-12 összpontszám
- L1291-1321: calc.whooley.total — Whooley-kérdések
- L1322-1365: calc.whr — derék-csípő arány és a kapuzott fejezet bevezetése
- L1366-1405: calc.cmqcc.ob.sepsis.screen — kapu mögött
- L1406-1445: calc.cmqcc.stage — vérzési stádium, kapu mögött
- L1446-1485: calc.crcl — Cockcroft-Gault, kapu mögött
- L1486-1518: calc.efw.hadlock — becsült magzati súly, kapu mögött
- L1519-1549: calc.egfr.ckdepi2021 — eGFR, kapu mögött
- L1550-1582: calc.energy.pregnancy — energiaszükséglet, kapu mögött
- L1583-1633: calc.isth.dic.pregnancy — terhességi DIC-pontszám és a build-ellenőrzés

## Claims

- [C1] [CONFIRMED] A fájl generált, forrása a kalkulátor-definíciós modul, és a CI ellenőrzi az egyezést @L3 `**Ez a fájl generált.** Forrása a `
- [C2] [CONFIRMED] 43 kalkulátor van, ebből 36 használható és 7 áll kapu mögött @L9 `**43 kalkulátor**, ebből **36 használható** és **7 kapu mögött** áll.`
- [C3] [CONFIRMED] Hiányzó vagy lejárt bemenetnél nincs eredmény, hanem a hiányzók felsorolása @L62 `1. **Hiányzó vagy lejárt bemenet** → nincs eredmény, hanem a hiányzók felsorolása.`
- [C4] [CONFIRMED] Ellenőrizetlen konstans esetén teljes bemenettel sem születik eredmény @L64 `2. **Ellenőrizetlen konstans** → nincs eredmény, teljes bemenettel sem.`
- [C5] [CONFIRMED] A fullPIERS dokumentált együtthatóival a súlyosabb beteg kap alacsonyabb kockázatot @L67 `klinikailag fordítva viselkedik: a súlyosabb beteg kap alacsonyabb kockázatot.`
- [C6] [CONFIRMED] A kor levezetett, nem tárolt adat, mert a tárolt kor egy év múlva hazudik @L100 `A kor LEVEZETETT, nem tárolt adat.`
- [C7] [CONFIRMED] Az Apgar nem az asphyxia mérőszáma, és nem alkalmas a kimenetel előrejelzésére @L142 `Az Apgar NEM az asphyxia mérőszáma`
- [C8] [CONFIRMED] A születési dátum azonosításra alkalmas, a születési év nem: az export csak az évet viszi @L172 `Az export ezért az évet viszi — a dátumot soha.`
- [C9] [CONFIRMED] A beszállás azért kódolt, mert a klinikai skálán a −1 és a 0 egy pontsávba esik @L214 `a −1 és a 0 EGY pontsávba esik`
- [C10] [CONFIRMED] A BMI-t a terhesség előtti testsúlyból kell számolni, a futó terhességiből számolt érték klinikailag értelmetlen @L255 `A futó terhességi testsúlyból számolt BMI klinikailag értelmetlen`
- [C11] [CONFIRMED] A testfelszín ezzel szemben az aktuális testsúlyból számol @L286 `Terhességben a növekvő testsúly miatt az AKTUÁLIS súlyból számol`
- [C12] [CONFIRMED] A BSES-SF skálának nincs általánosan elfogadott vágóértéke @L329 `A skálának NINCS általánosan elfogadott vágóértéke`
- [C13] [CONFIRMED] A BSS-R alskála-besorolása nincs betöltve, ezért a rendszer csak összpontszámot ad @L368 `a rendszer ezért CSAK az összpontszámot adja`
- [C14] [CONFIRMED] A cerebro-placentáris aránynak nincs fix sávja: a normáltartomány gesztációs kortól függ @L399 `a normáltartomány GESZTÁCIÓS KORTÓL függ`
- [C15] [CONFIRMED] A Naegele-számítás 28 napos ciklust feltételez @L429 `A 280 nap 28 napos ciklust feltételez.`
- [C16] [CONFIRMED] Az EPDS vágóértéke nem a kalkulátorban van: az antepartum és a postnatalis küszöb eltér @L468 `az antepartum és a postnatalis küszöb eltér`
- [C17] [CONFIRMED] Az EQ-5D-5L profil kód, nem mennyiség, ezért átlagot képezni belőle értelmetlen @L502 `EZ KÓD, NEM MENNYISÉG`
- [C18] [CONFIRMED] A Ferriman-Gallwey 8-as küszöbe etnikumfüggő @L548 `A ≥ 8 küszöb ETNIKUMFÜGGŐ`
- [C19] [CONFIRMED] A gesztációs kornál a precedencia a lényeg: IVF-nél a transzferdátum, egyébként a korai CRL pontosabb az utolsó menstruációnál @L579 `IVF-nél a transzferdátum, egyébként a korai (11–14. hét) CRL pontosabb az LMP-nél`
- [C20] [CONFIRMED] A vajúdási óraszámnál a nullpont dönti el, mit látunk: a beszámolt kezdet és az aktív szak kezdete más @L610 `A NULLPONT DÖNTI EL, MIT LÁTUNK`
- [C21] [CONFIRMED] A LATCH összpontszáma elfedheti a beavatkozást indokló egyes tételt @L644 `AZ ÖSSZPONTSZÁM ELFEDI A TÉTELT`
- [C22] [CONFIRMED] A korai terhességi súlyra beállított enoxaparin-adag a terminusra alul dozírozhat @L674 `a korai terhességben mért súly alapján beállított adag a terminusra alul dozírozhat`
- [C23] [CONFIRMED] A MAP-képlet tachycardiában felülbecsül, mert a diasztolé rövidül @L713 `Tachycardiában a diasztolé rövidül, és a képlet FELÜLBECSÜL.`
- [C24] [CONFIRMED] A MEOWS érzékeny, de nem specifikus: vajúdás alatt a vitálisok élettanilag is kilépnek a sávból @L756 `A MEOWS ÉRZÉKENY, DE NEM SPECIFIKUS`
- [C25] [CONFIRMED] A kötődési zavar és a depresszió külön dolog, bár együtt járhatnak @L790 `A KÖTŐDÉSI ZAVAR ÉS A DEPRESSZIÓ KÜLÖN DOLOG`
- [C26] [CONFIRMED] Az MSPSS az észlelt támogatást méri, nem a ténylegeset @L822 `AZ ÉSZLELT támogatást méri, nem a ténylegeset`
- [C27] [CONFIRMED] A dextróz gél a szoptatás mellett adandó, nem helyette @L852 `A gél a SZOPTATÁS MELLETT adandó, nem helyette`
- [C28] [CONFIRMED] Az epinephrin-adagnál a hígítás elrontása nagyságrendi tévedés @L882 `A hígítás elrontása nagyságrendi tévedés`
- [C29] [CONFIRMED] A volumenbolus javallata szűk; volumenhiány nélkül adva árt @L912 `A volumenpótlás javallata SZŰK`
- [C30] [CONFIRMED] Az omqSOFA szülészeti módosítás azért kell, mert az eredeti qSOFA-kritérium terhesen későn jelez @L952 `az eredeti qSOFA vérnyomás- és tudatállapot-kritériuma terhesen későn jelez`
- [C31] [CONFIRMED] A PHQ-9 szomatikus tételei terhességben és gyermekágyban félrevezetnek @L990 `TERHESSÉGBEN ÉS GYERMEKÁGYBAN A SZOMATIKUS TÉTELEK FÉLREVEZETNEK`
- [C32] [CONFIRMED] A fehérjecél a terhesség előtti testsúlyra számol @L1020 `A TERHESSÉG ELŐTTI testsúlyra számol`
- [C33] [CONFIRMED] A szűkült pulzusnyomás a vérzéses sokk korai jele, gyakran még normális szisztolés érték mellett @L1059 `A szűkült pulzusnyomás a vérzéses sokk KORAI jele`
- [C34] [CONFIRMED] A Bazett-korrekció tachycardiában túlkorrigál, bradycardiában alulkorrigál @L1098 `A Bazett TÚLKORRIGÁL tachycardiában és alulkorrigál bradycardiában.`
- [C35] [CONFIRMED] Terhességben a Fridericia az elsődlegesen mutatott korrigált QT @L1137 `Magas pulzusnál megbízhatóbb a Bazettnél`
- [C36] [CONFIRMED] A burokrepedés időpontja szinte mindig a beteg beszámolója, nem mért adat @L1176 `A BUROKREPEDÉS IDŐPONTJA majdnem mindig a beteg BESZÁMOLÓJA, nem mért adat`
- [C37] [CONFIRMED] A sokk-index szülészeti sávja feljebb kezdődik, mint a nem-szülészeti küszöb @L1215 `A szülészeti sáv fentebb kezdődik.`
- [C38] [CONFIRMED] A terhességi súlygyarapodásnak önmagában nincs sávja, mert a célsáv a terhesség előtti BMI-től függ @L1246 `A számnak ÖNMAGÁBAN nincs sávja`
- [C39] [CONFIRMED] A WHODAS itt egyszerű összegzés; a hivatalos IRT-pontozás más számot ad, és nincs megvalósítva @L1287 `A WHODAS hivatalos, tételválasz-elméleti (IRT) pontozása MÁS számot ad`
- [C40] [CONFIRMED] A Whooley-kérdések gyorsszűrést adnak, nem diagnózist @L1318 `GYORSSZŰRÉS, NEM DIAGNÓZIS`
- [C41] [CONFIRMED] A derék-csípő arány sávjai női küszöbbel szólnak, nem univerzálisak @L1356 `A SÁVOK NŐI KÜSZÖBBEL SZÓLNAK`
- [C42] [CONFIRMED] A CMQCC szepszisküszöbök azért kapuzottak, mert a forrás tartományát a hálózati szabályzat blokkolja @L1400 `a cmqcc.org tartományt a hálózati szabályzat blokkolja`
- [C43] [CONFIRMED] A vérzési stádiumnál a két forrás összeillesztése saját döntés, nem publikált algoritmus @L1440 `A kettő összeillesztése SAJÁT DÖNTÉS, nem publikált algoritmus`
- [C44] [CONFIRMED] A Cockcroft-Gault SI-egységre átszámolt női együtthatója nincs visszaellenőrizve az eredeti közleménnyel @L1480 `Az SI-egységre átszámolt 1,04-es női együttható nincs visszaellenőrizve`
- [C45] [CONFIRMED] A Hadlock-képletnek több, egymástól eltérő regressziós változata van, és a választás nincs eldöntve @L1513 `A Hadlocknak TÖBB, egymástól eltérő regressziós változata van`
- [C46] [CONFIRMED] A CKD-EPI 2021 terhességben nem validált, és a valós GFR-t alábecsüli @L1544 `a képlet TERHESSÉGBEN NEM VALIDÁLT`
- [C47] [CONFIRMED] Az energiaszükséglet illesztett regresszió, nem konszenzusos szorzó, ezért áll kapu mögött @L1577 `Ez ILLESZTETT REGRESSZIÓ, nem konszenzusos szorzó`
- [C48] [CONFIRMED] A DIC-pontszámnál egyetlen rosszul megválasztott sávhatár átbillenti az eredményt, mert a fibrinogén 25 pontot ér 2 g/L alatt @L1616 `a fibrinogén 25 pontot ér 2 g/L alatt`
- [C49] [CONFIRMED] A build megköveteli, hogy az egységek pontosan egyezzenek, mert az eltérés némán rossz eredményt adna @L1627 `az egységek **pontosan** egyeznek`
- [C50] [CONFIRMED] A kalkulátor-validálás jelenlegi állapota 0 hiba és 0 figyelmeztetés @L1632 `Jelenlegi állapot: **0 hiba, 0 figyelmeztetés**.`
