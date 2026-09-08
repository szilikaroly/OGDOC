# 37 — Döntési allokáció: ki mit visz

*Generált dokumentum: `npm run docs`. A [3. lépés](../13-18-lepes.md) feladatlistája szerepekre bontva — egy kézzel karbantartott lista két hét alatt elszakad a katalógustól.*

---

## A mérleg

| | |
|---|---:|
| döntendő mező | **326** |
| mögöttük szabály | **38** |
| ebből nyitva | **38** szabály · 326 mező |
| aláírt szabály | **0** |

A döntés **szabályszintű**: egy aláírás a szabály minden mezőjére szól. Ahol egy mező eltér a szabályától, ott mezőszintű eltérést írnak alá — az nem ennek a listának a tétele, hanem az ülés jegyzőkönyvéé.

---

## 1. Mi van rajtam — szerepenként

A **felelős** viszi a javaslatot az ülésre. Nem ő dönt egyedül: a „kell hozzá” oszlop minden szerepének aláírása kell. Egy felelős nélküli tétel az, ami fél évig senkié.

### klinikai vezető

**Előkészítés: 22 szabály · 225 mező.** Aláírás ezen felül még 12 szabályon (79 mező), ahol más az előkészítő.

| ☐ | Mező | Szabály | Amit el kell dönteni | Kell hozzá | Ma |
|---|---:|---|---|---|---|
| ☐ | 39 | `versionedClassification`<br>Verziózott osztályozás | A besorolás megnevezése és verziója nélkül két intézmény ugyanazon kategóriája nem ugyanaz, és egy retrospektív stádium csendben mást jelent.<br>*Javaslat: **átalakítva** — `codeSystem` + `version` kötelező a kategória mellé.* | klinikai vezető | nyitva |
| ☐ | 29 | `orderTracking`<br>Megrendelve ≠ eredmény | A kintlévő lelet nem üres mező, hanem tartozás: az üres mező azt üzeni, nincs mit tudni, a „megrendelve, eredmény nincs” azt, hogy van, csak még nem tudjuk.<br>*Javaslat: **átalakítva** — Megrendelve · eredmény · nincs eredmény külön állapot; a kintlévőség feladatot generál.* | klinikai vezető | nyitva |
| ☐ | 27 | `modelBacked`<br>Modellhez kötött mező | A mező értéke publikált modellből származik; hivatkozás nélkül a modell nem futhat, és a bemeneti csoport hiányos szám csak olyan modellhez elég, amelyik nem létezik.<br>*Javaslat: **átalakítva** — A modell megnevezve és hivatkozva, hiánytalan bemeneti csoporttal (`calc.verified`).* | klinikai vezető | nyitva |
| ☐ | 24 | `labelSuspect`<br>Gyanús mezőcímke | A felirat más lapról származhat, és ezen a lapon értelmezhetetlen.<br>*Javaslat: **nem vesszük át** — A címkét nem vesszük át; a helyes megnevezés szakmai forrásból jön.* | klinikai vezető | nyitva |
| ☐ | 13 | `valueSetSuspect`<br>Hibás értékkészlet gyanúja | A mező legördülője más mező készletét mutatja — átvéve a betegre nézve ellentétes állítást is tehet.<br>*Javaslat: **nem vesszük át** — Az értékkészletet nem vesszük át; a helyes kódlista szakmai forrásból jön.* | klinikai vezető | nyitva |
| ☐ | 12 | `safetyPrecheck`<br>Biztonsági előellenőrzés három állapottal | A bejelöletlen négyzet nem különbözteti meg a „nem normális”-t a „nem néztük meg”-től; a „nem ellenőrizve” külön érték, és nem hagyható el.<br>*Javaslat: **átalakítva** — Rendben · nincs rendben · nem ellenőrizve; a harmadik állapot kötelező.* | klinikai vezető | nyitva |
| ☐ | 9 | `allNegative`<br>Egyetlen pipa több állítás helyett | Egy jelölőnégyzet nem állíthat negatívumot olyan tételekről, amelyekről külön-külön nem nyilatkoztak.<br>*Javaslat: **átalakítva** — Tételenkénti háromállapotú válasz; az „összes negatív” kitöltési segéd marad, nem tárolt állítás.* | klinikai vezető | nyitva |
| ☐ | 8 | `criticalCategory`<br>Kategória, nem szám | Az érték fokozatai súlyosbodó klinikai állapotot jelölnek, és a legsúlyosabb fokozat sürgős döntést kívánhat — numerikus mező mellé rejtve elveszne.<br>*Javaslat: **átalakítva** — Kódolt kategória; a legsúlyosabb fokozat sürgősségi jelzést ad.* | klinikai vezető | nyitva |
| ☐ | 7 | `ageForRisk`<br>Életkor-kapu | A kockázatszámításhoz nem a várandós mai életkora tartozik; ha a rendszer a rosszat használja, a kockázat némán téved — épp a megnyugtató irányba.<br>*Javaslat: **átalakítva** — A kockázatszámítás életkora külön változó, megnevezett forrással.* | klinikai vezető | nyitva |
| ☐ | 6 | `contraindication`<br>Kontraindikáció-kapu | Az ellenjavallat a kezelés feltétele, nem adminisztratív pipa: bejelöletlenül a kezelés nem indítható.<br>*Javaslat: **átalakítva** — Hard-stop a kezelés előtt, indoklással.* | klinikai vezető | nyitva |
| ☐ | 6 | `handTotal`<br>Kézzel beírt végösszeg | A bejelölt összetevők mellé beírt végösszeg ellentmondhat nekik, és a pontszám alapján születik a döntés.<br>*Javaslat: **átalakítva** — Az összeg levezetett; csak az összetevők vihetők be.* | klinikai vezető | nyitva |
| ☐ | 6 | `invalidates`<br>Az eredményt érvénytelenítő adat | Ez a jelölés megváltoztatja vagy érvényteleníti az eredmény jelentését; címkeként rögzítve látszik, de nem véd.<br>*Javaslat: **átalakítva** — Az eredménnyel EGYÜTT jelenik meg, és kapuként viselkedik.* | klinikai vezető | nyitva |
| ☐ | 6 | `operatorGate`<br>Kompetencia-kapu | A `calc.verified` a KÉPLETRŐL szól, ez a VIZSGÁLÓRÓL: egy helyes képlet rossz méréssel ugyanúgy rossz számot ad.<br>*Javaslat: **átalakítva** — Akkreditált vizsgálóhoz kötve; engedélyszám nélkül a számítás nem fut.* | klinikai vezető | nyitva |
| ☐ | 6 | `surgicallyAbsent`<br>Műtéti előzmény mint szervállapot | A műtéti előzmény miatt hiányzó szerv nem „nem ábrázolható” és nem „nincs adat”, hanem önálló szervállapot.<br>*Javaslat: **átalakítva** — A beavatkozási adatból vezetjük le, nem ezen a lapon keletkezik.* | klinikai vezető | nyitva |
| ☐ | 6 | `uncertainSignificance`<br>Bizonytalan jelentőségű eltérés (VUS) | A VUS nem enyhébb kóros és nem majdnem normális, hanem MÁS: kórosként döntést alapoznak rá, normálisként a későbbi újraértékelés vész el.<br>*Javaslat: **átalakítva** — Harmadik eredménykategóriaként rögzül, újraértékelésre megjelölve.* | klinikai vezető | nyitva |
| ☐ | 5 | `inputSelector`<br>Bemenetválasztó | Egy implicit bemenet visszamenőleg nem rekonstruálható: meg kell nevezni, melyik mért érték megy be a számításba.<br>*Javaslat: **átalakítva** — Megnevezett, választott érték; nem „a legutolsó” és nem átlag.* | klinikai vezető | nyitva |
| ☐ | 4 | `screeningOnly`<br>Szűrés, nem diagnózis | Az „alacsony kockázat” nem negatív lelet, és ennek a leleten ott kell lennie — enélkül a szűrés eredménye diagnózisnak látszik.<br>*Javaslat: **átalakítva** — A lelet magával hordja a szűrés korlátját.* | klinikai vezető | nyitva |
| ☐ | 3 | `irreversible`<br>Visszafordíthatatlan lépés | A kapunak a lépés ELŐTT kell zárnia; utólagos dokumentálás nem pótolja a hiányzó feltételt.<br>*Javaslat: **átalakítva** — A kapu a beavatkozás előtt fut le.* | klinikai vezető | nyitva |
| ☐ | 3 | `noResultState`<br>A „nincs eredmény” önálló állapot | A „nincs eredmény” nem üres mező és nem negatív lelet: külön oka van, és az ok maga is információ.<br>*Javaslat: **átalakítva** — Megnevezett okkal rögzül, önálló állapotként.* | klinikai vezető | nyitva |
| ☐ | 3 | `outcomeAudit`<br>Audit-hurok: állítás és kimenetel | A méhen belül mondott állítást a megszületett igazsággal kell szembesíteni; a rendszer egyiket sem írhatja felül a másikkal.<br>*Javaslat: **átalakítva** — Mindkét állítás megmarad, a szembesítés külön adat.* | klinikai vezető | nyitva |
| ☐ | 2 | `boundaryNote`<br>Határérték-figyelmeztetés | A 0% és a 100% nem bizonyosság, hanem a számítás határértéke; a szám korlátja ott áll, ahol a szám.<br>*Javaslat: **átalakítva** — A korlát a számmal együtt jelenik meg, nem lábjegyzetben.* | klinikai vezető | nyitva |
| ☐ | 1 | `refusalState`<br>Elutasítás mint önálló állapot | Az elutasított vizsgálat üresen hagyott mezőként mulasztásnak látszik, holott dokumentált betegdöntés, ami az ellátás teljességét igazolja.<br>*Javaslat: **átalakítva** — Hatodik lelet-állapotként rögzül, a felajánlás tényével együtt.* | klinikai vezető | nyitva |

### adatvédelmi tisztviselő

**Előkészítés: 7 szabály · 36 mező.** Aláírás ezen felül még 0 szabályon (0 mező), ahol más az előkészítő.

| ☐ | Mező | Szabály | Amit el kell dönteni | Kell hozzá | Ma |
|---|---:|---|---|---|---|
| ☐ | 12 | `traceable`<br>Nyomonkövetési követelmény | Gyártási tétel szintjén vissza kell lennie kereshetőnek, ki melyik készítményt kapta; a megőrzési ideje eltér a leletétől.<br>*Javaslat: **átalakítva** — Tételszám kötelező mező, saját megőrzési idővel.* | klinikai vezető<br>adatvédelmi tisztviselő | nyitva |
| ☐ | 10 | `special`<br>Különleges adat (GDPR 9. cikk) | Különleges adat csak kifejezett, célhoz kötött hozzájárulással rögzíthető, és soha nem folyhat be csendben egy számításba.<br>*Javaslat: **átalakítva** — Külön jelöléssel vesszük át; a számítás bemenete nem lehet, és exportba nem kerül.* | adatvédelmi tisztviselő<br>klinikai vezető | nyitva |
| ☐ | 5 | `consentGate`<br>Beleegyezés-kapu magán a számításon | Nem az adat rögzítése, hanem maga a SZÁMÍTÁS beleegyezéshez kötött: tanácsadás és beleegyezés nélkül a szűrési kockázat nem számolható ki és nem közölhető.<br>*Javaslat: **átalakítva** — A kapu a kalkulátor előtt zár, nem a mező előtt.* | adatvédelmi tisztviselő<br>klinikai vezető | nyitva |
| ☐ | 4 | `research`<br>Kutatási adatgyűjtés a klinikai lapon | Kutatási célú adat érvényes, visszavonható beleegyezés nélkül nem rögzíthető.<br>*Javaslat: **átalakítva** — A `ctx.consentState` kapuja mögé kerül; visszavonáskor a gyűjtés leáll.* | adatvédelmi tisztviselő | nyitva |
| ☐ | 2 | `insecureChannel`<br>Különleges adat védtelen csatornán | A különleges adat továbbítási módja nem a felület legördülőjének kérdése: a választás lehet a betegé, a csatorna biztonsága nem az.<br>*Javaslat: **nem vesszük át** — A csatornaválasztó mezőt nem vesszük át; a továbbítás módját szabályzat dönti el.* | adatvédelmi tisztviselő | nyitva |
| ☐ | 2 | `safetySensitive`<br>A beteg biztonságát veszélyeztető adat | Van adat, amit a `phi` jelölés nem véd meg: külön láthatósági szabály kell rá, mert egy nyomtatott dokumentumon megjelenve veszélyeztetheti a beteget.<br>*Javaslat: **átalakítva** — Külön láthatósági szabállyal vesszük át; a dokumentumon való megjelenést önálló döntés engedi.* | adatvédelmi tisztviselő<br>klinikai vezető | nyitva |
| ☐ | 1 | `incidentalMaternal`<br>Magzati címke alatt anyai lelet | A vizsgálat olyat talál, amit nem kerestek, és nem is arról, akiről a lap szól; a mellékleletek közlésére a beleegyezésnek külön ki kell terjednie.<br>*Javaslat: **átalakítva** — Anyai alanyú leletként rögzül, külön beleegyezési tétellel.* | adatvédelmi tisztviselő<br>klinikai vezető | nyitva |

### fejlesztés

**Előkészítés: 6 szabály · 36 mező.** Aláírás ezen felül még 0 szabályon (0 mező), ahol más az előkészítő.

| ☐ | Mező | Szabály | Amit el kell dönteni | Kell hozzá | Ma |
|---|---:|---|---|---|---|
| ☐ | 8 | `subjectAmbiguous`<br>Kinek az adata? | Egy leletnél az alany a lelet fele; az alany nem a képernyő elrendezéséből derül ki.<br>*Javaslat: **átalakítva** — Alany szerint hatókörözve (`scopedBy`); alany nélküli mérés nem rögzíthető.* | klinikai vezető<br>fejlesztés | nyitva |
| ☐ | 8 | `unitDuplicate`<br>Párhuzamos mértékegység | Az egység az ÉRTÉKHEZ tartozik és a megjelenítés váltja át; több párhuzamos mező többféle igazságot tud tárolni ugyanarról.<br>*Javaslat: **átalakítva** — Egy változó UCUM-egységgel; a párhuzamos mezők megjelenítéssé válnak.* | fejlesztés<br>klinikai vezető | nyitva |
| ☐ | 7 | `crossEpisode`<br>Epizódok közötti hivatkozás | A beavatkozás megelőzi azt az epizódot, amelyben a hatása jelentkezik; összekapcsolás nélkül láthatatlan ott, ahol számít.<br>*Javaslat: **átalakítva** — Epizódok közötti hivatkozásként vesszük át, nem másolatként.* | klinikai vezető<br>fejlesztés | nyitva |
| ☐ | 6 | `unitMismatch`<br>Az egység nem az, amiben a küszöb ki van mondva | A szám önmagában helyes lehet, a rá alkalmazott küszöb mégis téves — és a tévedés csendes, mert a mező neve stimmel.<br>*Javaslat: **átalakítva** — Érték + UCUM-egység; a döntési határ a kimondott egységében fut.* | fejlesztés<br>klinikai vezető | nyitva |
| ☐ | 5 | `synonymDuplicate`<br>Ugyanaz az adat két néven | Két mező ugyanarról a mérésről két különböző számot tud tárolni, és nem lesz eldönthető, melyik a mért.<br>*Javaslat: **átalakítva** — Egy fogalom, szinonimákkal; a második mező nem önálló tárolóhely.* | klinikai vezető<br>fejlesztés | nyitva |
| ☐ | 2 | `pairedSubjects`<br>Egy sorban két alany értéke | Két alany értéke egy sorban a felületen kényelmes, az adatmodellben nem átvehető: egy lekérdezés nem tudja megmondani, kinek az értékét nézi.<br>*Javaslat: **átalakítva** — Két változó, alany szerinti példánnyal.* | klinikai vezető<br>fejlesztés | nyitva |

### laboratóriumi szakorvos

**Előkészítés: 3 szabály · 29 mező.** Aláírás ezen felül még 0 szabályon (0 mező), ahol más az előkészítő.

| ☐ | Mező | Szabály | Amit el kell dönteni | Kell hozzá | Ma |
|---|---:|---|---|---|---|
| ☐ | 13 | `contextualThreshold`<br>Kontextusfüggő referencia | A küszöb nem a változóhoz tartozik, hanem a változó ÉS a kontextus párjához; kontextus nélkül nincs referenciatartomány, és nem az általános sáv az alapértelmezés.<br>*Javaslat: **átalakítva** — A referencia a kontextussal együtt kerül be; kontextus nélkül a rendszer nem értékel.* | laboratóriumi szakorvos<br>klinikai vezető | nyitva |
| ☐ | 10 | `lotCritical`<br>Kapu a számításon: reagenstétel | A MoM a reagenskészlet mediánsorához tartozik; más gyártó mediánsorával számolva csendben rossz — ugyanaz a szám, más jelentéssel.<br>*Javaslat: **átalakítva** — Gyártó és tételszám nélkül a MoM nem számolható ki.* | laboratóriumi szakorvos | nyitva |
| ☐ | 6 | `assayBound`<br>Vizsgálathoz kötött érték | A teljesítmény és a referencia a megnevezett gyártóhoz, platformhoz vagy reagenshez tartozik; megnevezés nélkül az érték nem hasonlítható össze és nem ellenőrizhető vissza.<br>*Javaslat: **átalakítva** — A vizsgálat megnevezése az érték része.* | laboratóriumi szakorvos | nyitva |

---

## 2. Kikkel kell leülni — ülésenként

Az azonos aláírói kört kívánó szabályok **egy ülésen** eldönthetők. Ez a bontás azt mondja meg, hány külön asztal kell, és melyiknél ki ül.

| Ülés | Kik | Szabály | Mező | Miről |
|---:|---|---:|---:|---|
| 1. | klinikai vezető | 22 | 225 | Verziózott osztályozás · Megrendelve ≠ eredmény · Modellhez kötött mező · Gyanús mezőcímke · Hibás értékkészlet gyanúja · Biztonsági előellenőrzés három állapottal · Egyetlen pipa több állítás helyett · Kategória, nem szám · Életkor-kapu · Kontraindikáció-kapu · Kézzel beírt végösszeg · Az eredményt érvénytelenítő adat · Kompetencia-kapu · Műtéti előzmény mint szervállapot · Bizonytalan jelentőségű eltérés (VUS) · Bemenetválasztó · Szűrés, nem diagnózis · Visszafordíthatatlan lépés · A „nincs eredmény” önálló állapot · Audit-hurok: állítás és kimenetel · Határérték-figyelmeztetés · Elutasítás mint önálló állapot |
| 2. | fejlesztés + klinikai vezető | 6 | 36 | Kinek az adata? · Párhuzamos mértékegység · Epizódok közötti hivatkozás · Az egység nem az, amiben a küszöb ki van mondva · Ugyanaz az adat két néven · Egy sorban két alany értéke |
| 3. | adatvédelmi tisztviselő + klinikai vezető | 5 | 30 | Nyomonkövetési követelmény · Különleges adat (GDPR 9. cikk) · Beleegyezés-kapu magán a számításon · A beteg biztonságát veszélyeztető adat · Magzati címke alatt anyai lelet |
| 4. | laboratóriumi szakorvos | 2 | 16 | Kapu a számításon: reagenstétel · Vizsgálathoz kötött érték |
| 5. | klinikai vezető + laboratóriumi szakorvos | 1 | 13 | Kontextusfüggő referencia |
| 6. | adatvédelmi tisztviselő | 2 | 6 | Kutatási adatgyűjtés a klinikai lapon · Különleges adat védtelen csatornán |

Összesen **6 ülés**. A legnagyobb (225 mező) önmagában több, mint a többi együtt — érdemes elsőnek venni, és nem az utolsó napirendi pontnak.

---

## 3. Mi a sorrend — mezőszám szerint

A nagy tételek húznak: a felső hat szabály a 326 mező több mint felét fedi. Ha csak ennyi születik meg, az már a munka fele.

| # | Mező | Szabály | Felelős | Kell hozzá | Javaslat | Ma |
|---:|---:|---|---|---|---|---|
| 1 | 39 | `versionedClassification` — Verziózott osztályozás | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 2 | 29 | `orderTracking` — Megrendelve ≠ eredmény | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 3 | 27 | `modelBacked` — Modellhez kötött mező | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 4 | 24 | `labelSuspect` — Gyanús mezőcímke | klinikai vezető | klinikai vezető | nem vesszük át | nyitva |
| 5 | 13 | `contextualThreshold` — Kontextusfüggő referencia | laboratóriumi szakorvos | laboratóriumi szakorvos, klinikai vezető | átalakítva | nyitva |
| 6 | 13 | `valueSetSuspect` — Hibás értékkészlet gyanúja | klinikai vezető | klinikai vezető | nem vesszük át | nyitva |
| 7 | 12 | `safetyPrecheck` — Biztonsági előellenőrzés három állapottal | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 8 | 12 | `traceable` — Nyomonkövetési követelmény | adatvédelmi tisztviselő | klinikai vezető, adatvédelmi tisztviselő | átalakítva | nyitva |
| 9 | 10 | `lotCritical` — Kapu a számításon: reagenstétel | laboratóriumi szakorvos | laboratóriumi szakorvos | átalakítva | nyitva |
| 10 | 10 | `special` — Különleges adat (GDPR 9. cikk) | adatvédelmi tisztviselő | adatvédelmi tisztviselő, klinikai vezető | átalakítva | nyitva |
| 11 | 9 | `allNegative` — Egyetlen pipa több állítás helyett | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 12 | 8 | `criticalCategory` — Kategória, nem szám | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 13 | 8 | `subjectAmbiguous` — Kinek az adata? | fejlesztés | klinikai vezető, fejlesztés | átalakítva | nyitva |
| 14 | 8 | `unitDuplicate` — Párhuzamos mértékegység | fejlesztés | fejlesztés, klinikai vezető | átalakítva | nyitva |
| 15 | 7 | `ageForRisk` — Életkor-kapu | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 16 | 7 | `crossEpisode` — Epizódok közötti hivatkozás | fejlesztés | klinikai vezető, fejlesztés | átalakítva | nyitva |
| 17 | 6 | `assayBound` — Vizsgálathoz kötött érték | laboratóriumi szakorvos | laboratóriumi szakorvos | átalakítva | nyitva |
| 18 | 6 | `contraindication` — Kontraindikáció-kapu | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 19 | 6 | `handTotal` — Kézzel beírt végösszeg | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 20 | 6 | `invalidates` — Az eredményt érvénytelenítő adat | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 21 | 6 | `operatorGate` — Kompetencia-kapu | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 22 | 6 | `surgicallyAbsent` — Műtéti előzmény mint szervállapot | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 23 | 6 | `uncertainSignificance` — Bizonytalan jelentőségű eltérés (VUS) | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 24 | 6 | `unitMismatch` — Az egység nem az, amiben a küszöb ki van mondva | fejlesztés | fejlesztés, klinikai vezető | átalakítva | nyitva |
| 25 | 5 | `consentGate` — Beleegyezés-kapu magán a számításon | adatvédelmi tisztviselő | adatvédelmi tisztviselő, klinikai vezető | átalakítva | nyitva |
| 26 | 5 | `inputSelector` — Bemenetválasztó | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 27 | 5 | `synonymDuplicate` — Ugyanaz az adat két néven | fejlesztés | klinikai vezető, fejlesztés | átalakítva | nyitva |
| 28 | 4 | `research` — Kutatási adatgyűjtés a klinikai lapon | adatvédelmi tisztviselő | adatvédelmi tisztviselő | átalakítva | nyitva |
| 29 | 4 | `screeningOnly` — Szűrés, nem diagnózis | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 30 | 3 | `irreversible` — Visszafordíthatatlan lépés | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 31 | 3 | `noResultState` — A „nincs eredmény” önálló állapot | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 32 | 3 | `outcomeAudit` — Audit-hurok: állítás és kimenetel | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 33 | 2 | `boundaryNote` — Határérték-figyelmeztetés | klinikai vezető | klinikai vezető | átalakítva | nyitva |
| 34 | 2 | `insecureChannel` — Különleges adat védtelen csatornán | adatvédelmi tisztviselő | adatvédelmi tisztviselő | nem vesszük át | nyitva |
| 35 | 2 | `pairedSubjects` — Egy sorban két alany értéke | fejlesztés | klinikai vezető, fejlesztés | átalakítva | nyitva |
| 36 | 2 | `safetySensitive` — A beteg biztonságát veszélyeztető adat | adatvédelmi tisztviselő | adatvédelmi tisztviselő, klinikai vezető | átalakítva | nyitva |
| 37 | 1 | `incidentalMaternal` — Magzati címke alatt anyai lelet | adatvédelmi tisztviselő | adatvédelmi tisztviselő, klinikai vezető | átalakítva | nyitva |
| 38 | 1 | `refusalState` — Elutasítás mint önálló állapot | klinikai vezető | klinikai vezető | átalakítva | nyitva |

A felső hat: **145 mező** a 326-ból.

---

## Ahogy egy tétel lezárul

```
npm run dontes -- --mezok <szabály>     # melyik mezőkről van szó
npm run dontes -- --sablon <szabály>    # kitöltendő sablon, mai lenyomattal
#   … a kitöltött tétel a registry/felulet/dontesek.json-ba kerül …
npm run validate                        # hibát ad, ha a döntés hiányos
npm run dontes                          # a lista eggyel rövidebb
```

A lenyomatot kézzel kiszámolni nem lehet, és épp ezért nem is szabad kézzel beírni: a sablon a mai szöveg lenyomatát adja. Ha a szabály mondata később megváltozik, a döntés **elavul** — nem tűnik el, de nem is fedezi tovább.

A részletes leírás: [`36-dontesek.md`](36-dontesek.md).
