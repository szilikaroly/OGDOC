---
source: docs/13-18-lepes.md
sha256: e5dcef01bfd8590f543c9c3fbb0a0a16ad38f619590ce10a4d8d09f7d441ca00
lines: 898
profile: prose
generator: subagent
raw_tokens_est: 11755
verified: 65 confirmed
---

# docs/13-18-lepes.md

## Topics
- L1-41: miért kell ez a lista, a lépések négy adata, a négy hullám
- L42-80: 1. lépés — tároló, jogosultság, auditnapló; a hiányzó hitelesítés
- L81-120: 2. lépés — HBCS-besorolás betöltése és a SNOMED-fordítás elutasítása
- L121-160: 3. lépés — a 326 mező mögötti 38 szabály döntéssé tétele
- L161-201: 4. lépés — anamnézis-gerinc, CMQCC-modul, a „nem tudom" kezelése
- L202-245: 5. lépés — teljes eset végigvitele két kimenettel, AST-hiba
- L246-278: 6. lépés — a harminc laborreferencia hitelesítése
- L279-313: 7. lépés — normogramok: katalogizált, telepített, hitelesített
- L314-351: 8. lépés — hét kalkulátor konstansainak visszaellenőrzése
- L352-406: 9. lépés — szepszisküszöbök és az omqSOFA-eltérés
- L407-463: 10. lépés — megőrzési idők, számított lejárat, jogi horgony
- L464-507: 11. lépés — ETT-beadás és a dosszié igazságmérése
- L508-558: 12. lépés — tíz mérőeszköz licence és a lejárat kezelése
- L559-603: 13. lépés — MIR-dokumentumfa és az ISO 20387 első kérelem
- L604-656: 14. lépés — EESZT/HIS-csatlakozás, a kifelé írás kockázata
- L657-713: 15. lépés — riasztási címzettek, eszkalációs lánc, állapotok
- L714-769: 16. lépés — pilot előfeltételei és a naplóhorgony
- L770-825: 17. lépés — audit-hurok, négyértékű válasz, közölhetőségi kapu
- L826-898: 18. lépés — helyi normogramok, sávkapu-hiba, záró tanulságok

## Claims

- [C1] [CONFIRMED] A dokumentum tizennyolc lépést sorol négy hullámban, mindegyiknél négy adattal @L14 `Ez a lista tizennyolc lépés, négy hullámban.`
- [C2] [CONFIRMED] A C-hullám az első naptól párhuzamosan fut az A-val, különben ő lesz a szűk keresztmetszet @L24 `**az első naptól párhuzamosan fut az A-val**`
- [C3] [CONFIRMED] A tárolóréteg elfogadási kritériumai 28 tesztként állnak @L45 `28 teszt), a réteg a`
- [C4] [CONFIRMED] Nincs hitelesítés: a cselekvő kilétét egy ellenőrizetlen kérésfejléc állítja @L56 `cselekvőt egy kérésfejléc állítja, amit senki nem ellenőriz.`
- [C5] [CONFIRMED] A kiszolgáló szintetikus kapcsoló nélkül el sem indul @L57 `nélkül el sem indul. A rendszer tehát`
- [C6] [CONFIRMED] A tároló az egyetlen igazi blokkoló: nélküle a rendszer valódi betegadaton nem futhat @L65 `**Ez az egyetlen igazi blokkoló.**`
- [C7] [CONFIRMED] A HBCS-besorolás a rendeletből kinyerve 26 főcsoportot és 773 csoportot tartalmaz @L86 `26 főcsoport, 773 csoport,`
- [C8] [CONFIRMED] A 773 csoportból csak 596 (77%) szabálya értékelhető ki géppel @L91 `a 773 csoportból **596 (77%)** szabálya`
- [C9] [CONFIRMED] A SNOMED magyar megnevezéseknél a döntés az, hogy nem fordítunk, csak azonosítót ajánlunk @L108 `fordítunk** — a rendszer SNOMED-azonosítót ajánl, magyar megnevezést nem —,`
- [C10] [CONFIRMED] A 326 mező mögött 38 szabály áll, tehát az ülésnek 38-szor kell döntenie @L123 `A 326 mező mögött **38 szabály**`
- [C11] [CONFIRMED] A döntési kapu zár: eldöntetlenül egy mező sem kerül át @L128 `**eldöntetlenül egy mező sem kerül át**`
- [C12] [CONFIRMED] A felülettérkép 1502 mezőjéből 95 nem vehető át változatlanul @L140 `A felülettérkép 1502 mezőjéből **95 nem vehető át változatlanul**`
- [C13] [CONFIRMED] A gerinc-kritérium teljesült: négy modul egyetlen további kérdés nélkül megkapja a bemeneteit @L165 `**egyetlen további kérdés nélkül**`
- [C14] [CONFIRMED] A CMQCC vérzési tábla assumed szintű, ezért szintet nem ad, csak a tényezőket sorolja @L173 `szintű, ezért **szintet nem ad**, csak a fennálló tényezőket`
- [C15] [CONFIRMED] Hibaként derült ki, hogy a rögzített „nem tudom" válasz a kockázati modulokban „nem"-mé vált @L176 `a rögzített „nem tudom” válasz a kockázati`
- [C16] [CONFIRMED] A demó egy szintetikus ambuláns eseten fut: 36 éves, 30+5 hét @L205 `szintetikus ambuláns eseten végigmegy — 36 éves, 30+5 hét,`
- [C17] [CONFIRMED] Az AST kritikus sávja fordítva állt: a normális értéket jelezte kritikusnak @L216 `az AST kritikus sávja fordítva állt`
- [C18] [CONFIRMED] Az 5. lépés csak akkor kész, ha két, a tervezésben részt nem vevő klinikus aláírná a kimeneteket @L221 `klinikus**, akik nem vettek részt a tervezésben, végigolvassa a két kimenetet`
- [C19] [CONFIRMED] 30 változó kapott trimeszterre bontott referenciatartományt, de csak assumed szinten @L248 `30 változó kapott trimeszterre bontott referenciatartományt`
- [C20] [CONFIRMED] A laborreferenciákból 130 szám vár összevetésre, és 0/32 az aláírás @L267 `**130 összevetendő számot**. Aláírás: **0/32.**`
- [C21] [CONFIRMED] A gyermekágy 42 napig önálló kontextus, és az elérhetetlen kontextus mostantól build-hiba @L271 `a gyermekágy 42 napig valódi kontextus`
- [C22] [CONFIRMED] 265 normogramgörbe katalogizált, 3 telepített, és egyik sem ad percentilist @L281 `A forrásrendszerből 265 görbe van katalogizálva, 3 telepítve, és`
- [C23] [CONFIRMED] A normogram-hitelesítéshez FMF-képesítés kötelező @L300 `az FMF-képesítés kötelező`
- [C24] [CONFIRMED] A lefedettségszámláló nem létező szintet keresett, így a hitelesítettek száma örökre 0 maradt volna @L304 `szintet kereste, tehát a hitelesítettek száma örökre 0 maradt`
- [C25] [CONFIRMED] Hét kalkulátor teljes bemenettel sem ad eredményt, mert konstansaik nincsenek visszaellenőrizve @L316 `Hét kalkulátor teljes bemenettel sem ad eredményt`
- [C26] [CONFIRMED] A fullPIERS a dokumentált együtthatóival klinikailag fordítva viselkedik @L322 `klinikailag **fordítva viselkedik**`
- [C27] [CONFIRMED] Az eGFR µmol/L-t vár és 88,4-gyel oszt, ezért egy néma egységcsere 88-szoros hibát adna @L333 `mert az eGFR µmol/L-t vár és 88,4-gyel oszt`
- [C28] [CONFIRMED] 36 kalkulátor még az aláírási réteg előtt kapott verified jelölést, ezek megnevezett adósságok @L343 `36 kalkulátor az aláírási réteg ELŐTT kapott`
- [C29] [CONFIRMED] A szepszis-riasztás kapuja mostantól csak aláírásból nyílik, a jelölés csak tiltani tud @L370 `Mostantól a kapu **csak aláírásból** nyílik, a jelölés pedig tiltani`
- [C30] [CONFIRMED] Ugyanarra a mérésre két küszöb fut: légzésszám > 24 vs > 20, pulzus > 110 vs > 90 @L391 `légzésszám > 24 vs > 20, pulzus > 110 vs > 90.`
- [C31] [CONFIRMED] A 11 szepszisküszöbből 0 aláírt, és a két eltérő küszöb döntés nélkül áll @L384 `a 11 küszöbből **0 aláírva**`
- [C32] [CONFIRMED] A törlési motorban a megőrzési idő leteltét egy kézzel beírt dátum igazolta @L421 `megőrzési idő leteltét egy KÉZZEL BEÍRT dátum igazolta`
- [C33] [CONFIRMED] A jogszabályidézet 13 tételnél más számítási horgonyt nevez meg, mint a beállítás @L430 `IDÉZETE 13 tételnél más horgonyt nevez meg, mint a beállítás`
- [C34] [CONFIRMED] Mind a 14 dokumentumtípus megőrzési ideje másodlagos szinten áll, mert a jogszabályszöveget a proxy blokkolta @L444 `Mind a 14 dokumentumtípus megőrzési ideje`
- [C35] [CONFIRMED] Amíg a megőrzési idők nincsenek hitelesítve, a rendszer nem töröl @L447 `**Amíg ez így van, a rendszer nem töröl.**`
- [C36] [CONFIRMED] Az ETT-dosszié 14 tételéből 3 fedett, 1 részben, 6 megalapozatlan, 4 szervezeti @L481 `14 tételből 3 fedett, 1 részben, 6 megalapozatlan, 4`
- [C37] [CONFIRMED] Hitelesítés nélkül az adatbiztonsági leírás valótlan állítást tartalmazna a bizottság előtt @L478 `VALÓTLAN ÁLLÍTÁST tartalmaz`
- [C38] [CONFIRMED] Az 55 aláírás megléte esetén sem adható be a kérelem, mert a hitelesítés és az elemzési terv hiányzik @L495 `napot, amikor mind az 55 aláírás megvan: a kérelem **még akkor sem adható`
- [C39] [CONFIRMED] A tíz mérőeszközből ma egy rendezett, a közkincs Whooley @L537 `10 eszközből **1 rendezett**`
- [C40] [CONFIRMED] A licenckapu naptárt néz és 90 nappal a lejárat előtt szól @L532 `A kapu ezért naptárt néz és 90`
- [C41] [CONFIRMED] A lejárt licenc nem érvényteleníti a már felvett adatot, csak új felvételt nem enged @L534 `törli a múltat: a már felvett adat érvényes marad, csak új felvétel nem`
- [C42] [CONFIRMED] A megfelelési összegző tábla kézzel írt száma elcsúszott: 45 kontrollsort mondott 39-nek @L569 `és ELCSÚSZOTT: **45 kontrollsort`
- [C43] [CONFIRMED] A lejárt dokumentum nem hatályos, és a rá épülő ISO-kontrollok vele együtt esnek ki @L578 `Mostantól a lejárt dokumentum NEM hatályos`
- [C44] [CONFIRMED] Ma 0/37 dokumentum hatályos, és egyik kontroll mellett sincs megnevezett bizonyítékdokumentum @L585 `0/37 dokumentum hatályban`
- [C45] [CONFIRMED] Az ISO 20387 első kérelmének reális átfutása 12-18 hónap, ez a projekt leghosszabb tétele @L592 `**Reális átfutás: 12–18 hónap az első kérelemtől.**`
- [C46] [CONFIRMED] Az EESZT-űrlapok 18 mezőjéből 3 a rendszerből válaszolható, 14 szervezeti, 1 üzemeltetési @L609 `3 a rendszerből, 14 szervezeti, 1`
- [C47] [CONFIRMED] A csatlakozás kifelé ír, ezért a hitelesítés hiánya belső kockázatból külsővé válik @L617 `hiánya itt BELSŐ KOCKÁZATBÓL KÜLSŐVÉ válik`
- [C48] [CONFIRMED] A titoktartási kötelezettség lejárati határidő nélkül terhel @L629 `a titoktartás LEJÁRATI HATÁRIDŐ NÉLKÜL terhel`
- [C49] [CONFIRMED] A referenciaigazolás élő használatot állít, ezért a pilot megelőzi ezt az űrlapot @L637 `tehát a 16. lépés (pilot) ELŐBB van, mint ez az űrlap.`
- [C50] [CONFIRMED] Ma 0/8 riasztástípus adható ki, mert mind a nyolc címzett nélkül áll @L661 `**0/8 riasztástípus adható ki, mind a nyolc címzett nélkül**`
- [C51] [CONFIRMED] 324 riasztási pont van nulla címzettel, ezért a címzett a nyolc típushoz tartozik @L679 `**324 riasztási pont, nulla címzettel**`
- [C52] [CONFIRMED] Az ötödik riasztásállapot a kimerült: a legfelső szint sem vette át @L685 `— a legfelső szint sem vette át.`
- [C53] [CONFIRMED] A 9. lépés kapuja addig nem nyílhat ki, amíg a 15. lépés nincs meg @L710 `**És a 9. kapuja addig nem nyílik ki, amíg ez nincs meg.**`
- [C54] [CONFIRMED] A pilot hét előfeltételéből ma egy áll @L736 `Ma **1/7 előfeltétel áll**.`
- [C55] [CONFIRMED] A csonkolt napló maradék lánca hiánytalannak látszik, tehát a lánc a végét nem védi @L740 `lánc **hiánytalan**`
- [C56] [CONFIRMED] Ezért a napló vége külön horgonyként, a naplón kívül rögzül @L745 `a napló vége, a naplón KÍVÜL rögzítve`
- [C57] [CONFIRMED] A pilot egyik elfogadási kritériuma elérhetetlen, amíg egyetlen riasztástípus sem adható ki @L758 `amíg 0/8 riasztástípus kiadható, a rendszer meg sem`
- [C58] [CONFIRMED] A három audit-mezőnek nem volt hova írnia, mert nem volt hozzájuk változó kötve @L793 `a három audit-mezőnek **nem volt hova`
- [C59] [CONFIRMED] A cáfolat és az eldönthetetlenség összemosása 75% helyett 50%-ot ad ugyanazon az adaton @L808 `**helyesen 75%, összemosva 50%**`
- [C60] [CONFIRMED] A hurok csak Wilson-féle konfidenciaintervallummal ad ki arányt, normál közelítéssel nem @L814 `konfidenciaintervallummal (Wilson-féle, nem normál közelítés)`
- [C61] [CONFIRMED] A helyi normogram sávkapuja a legközelebbi sáv elemszámát nézte, holott két szomszédos sor között interpolál @L852 `kapuja megvolt, de a LEGKÖZELEBBI sáv elemszámát nézte,`
- [C62] [CONFIRMED] A demótábla hat közös sávja átlagosan −0,34 szórásnyit tér el a publikált Chitty-táblától @L863 `átlagosan **−0,34 szórásnyit**`
- [C63] [CONFIRMED] A helyi görbéhez mérve az audit-hurok tökéletes egyezést találna, ezért a publikálthoz képesti eltolás kimondása kötelező @L868 `TÖKÉLETES EGYEZÉST találna**`
- [C64] [CONFIRMED] A generált helyi normogramtábla valódi betegadatból áll elő, ezért nem kerül a repóba @L876 `, ami **nem kerül a repóba**.`
- [C65] [CONFIRMED] A katalógusban 846 változó van a tervezett kb. 4035-ből @L883 `**A 846 változó a tervezett ~4035-ből**`
