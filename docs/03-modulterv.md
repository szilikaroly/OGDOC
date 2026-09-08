# 03 — Modulterv: a 17 szekció

Jelölés a **Forrás** oszlopban: **v16** = Anamnézis-asszisztens v16 · **IP** = IPRACS v1.0 ·
**ICHOM** = PCB v5.0 adatszótár · **ÚJ** = nincs meglévő alap.

> **Ez a fejezet az áttekintés.** Mind a **25** modulnak van önálló, részletes kidolgozása a
> [`modulok/`](modulok/) könyvtárban: adatszerkezet, keresztfeltöltési térkép, számítások és
> képletek, klinikai szabályok, elfogadási kritérium és nyitott kérdések modulonként.
>
> **Két átfogó elv fut végig mind a 25 modulon**, és mindkettőnek saját fejezete van:
> a [`11-strukturalt-adat.md`](11-strukturalt-adat.md) szerint a klinikai adatmezők **90%-a
> kódolt vagy mért érték** legyen — a szabad szöveg helyett hét eszköz áll rendelkezésre —,
> és a [`08-interoperabilitas.md`](08-interoperabilitas.md) szerint a strukturált adat ott,
> ahol lehet, **közvetlenül a készülékről** érkezik (DICOM SR, waveform, LIS2, POCT1),
> nem kézi átvitellel.

> **A 19. és a 21. modul nem terv, hanem meglévő rendszer** — az IntuiCare platform, illetve
> a SOS24 portál valósítja meg. A többi modul is jelentős kész infrastruktúrára épül; a
> leltárak: [`07-intuicare-alap.md`](07-intuicare-alap.md) és
> [`09-sos24-alap.md`](09-sos24-alap.md).

---

## 1. Panaszok — okos kereshető űrlap

→ **részletes kidolgozás: [`modulok/01-panaszok.md`](modulok/01-panaszok.md)**

| | |
|---|---|
| Forrás | v16 `COMPLAINT` (6 tétel) — kibővítendő |
| Becsült változó | ~120 |

A v16 hat fő panasza (fejfájás/látászavar, epigasztriális fájdalom, oedema, nehézlégzés, vérzés,
csökkent magzatmozgás) a szülészeti vörös zászlók magja, de általános nőgyógyászati felvételhez
kevés.

**Amit a „kereshető" jelent itt:** nem szabad szöveges mező. Egy ~400 tételes, szinonimákkal és
laikus kifejezésekkel ellátott panaszszótár, gépelés közbeni szűréssel. A beteg „szúr a hasam
alul jobb oldalt" kifejezésre megkapja a *jobb alhasi fájdalom* tételt, ami kódolt változó.

Minden panasztételhez tartozik:
- **OPQRST-attribútumok** (onset, provokáló, minőség, kisugárzás, súlyosság 0–10, időbeliség)
- **Vörös zászló jelölés** (a v16 `rf:1` mintájára) → azonnal a teendőlistába
- **Célzott utókérdések** — csak akkor jelennek meg, ha a panasz aktív
- **Feltöltési kapcsolat**: a panasz aktiválása előtölti a releváns státusz- és vizsgálati mezőket
  (pl. „csökkent magzatmozgás" → CTG kötelező, ultrahang-modul megnyitása, `prefill` a
  gesztációs korral)

## 2. Orvoshoz fordulás oka

→ **részletes kidolgozás: [`modulok/02-orvoshoz-fordulas.md`](modulok/02-orvoshoz-fordulas.md)**

| | |
|---|---|
| Forrás | ÚJ (v16-ban nincs külön) |
| Becsült változó | ~25 |

Rövid modul, de szerkezetileg fontos: ez határozza meg az **ellátási kontextust**, amiből minden
későbbi modul kötelezősége és érvényességi ablaka következik.

- Ellátási forma: ambuláns / sürgősségi / tervezett felvétel / szülőszoba / kontroll / szűrés
- Beutaló, beutaló diagnózis (BNO), beutaló intézmény
- Terhes-e, és ha igen: gesztációs kor (számított, ld. 5. modul)
- Az epizód célja: panasz kivizsgálása / gondozási vizit / beavatkozás / utánkövetés

> Ez a modul állítja be a `ctx` objektumot, amire a regiszter `requiredWhen` és `validity`
> kifejezései hivatkoznak. Ezért a **2. modul a 3–17. modul előfeltétele**.

## 3. Anamnézis

→ **részletes kidolgozás: [`modulok/03-anamnezis.md`](modulok/03-anamnezis.md)**

| | |
|---|---|
| Forrás | **v16 — szinte teljes egészében átvehető** |
| Becsült változó | ~230 |

A v16 legérettebb része, és az OGDOC ezt lényegében változatlanul viszi tovább:

- `SYSTEMS` — 8 szervrendszer-csoport, 24 tétel, **háromállású** válasszal (igen / nem / **nem
  tudom**). A „nem tudom" mint önálló állapot mind a 110 kérdéssoron megvan — ez ritka és értékes.
- `REPRO` — 14 tétel, benne a v16-ban hozzáadott terhességvesztés-kör (spontán vetélés, művi
  megszakítás, missed abortion, extrauterin, mola, méhűri beavatkozás) + GPA-számlálók
- `FAMILY` — 21 tétel, köztük **8 tisztázatlan diagnózisú** tétel („fiatalon szívbetegségben
  elhunyt rokon — a diagnózis nem tisztázott"). Ez a modul intellektuális erőssége: a valós
  családi anamnézis laikus leírás, nem diagnózislista.
- **Dinamikus családfa** — anyai/apai ág, rokononként 20 betegség, életkor, a diagnózis
  megbízhatósága **és az adat forrása**; a dokumentációs hiány külön jelzés
- `ENDO` — 17 endokrin tétel, mindegyik alatt kiemelt **terhességi vonallal**
- `LIFE`, `ORIGIN` (a beteg saját magzati/újszülöttkori előzményei — DOHaD-szemlélet), `SURG`, `SUPP`
- `EESZT_RISK` — a magyar várandósgondozási rizikókódok

**A három kockázatbecslő szándékosan nem mosódik össze**, és ez a szétválasztás átkerül:

| Becslő | Alap | Kimenet |
|---|---|---|
| Triszómia | FMF a priori (Snijders), gesztációs kor szerinti tábla | életkor- és GA-függő alapkockázat |
| Preeclampsia és GDM | NICE-besorolás (magas / közepes / alacsony) | a besorolást kiváltó tényezők felsorolásával, ASA- illetve OGTT-javallattal |
| FMF-elvű, markerekkel | MAP / UtA-PI / PlGF MoM, közelítő log-odds | kiírja, hogy **nem** a hivatalos FMF-kalkulátor |

A vetélés / koraszülés / halvaszületés becslés epidemiológiai és tájékoztató, **nem validált** —
és ezt a felület ki is mondja. Ez a fajta önkorlátozás a v16 egyik erénye, és az OGDOC
alapértelmezésévé válik: minden becslés mellett ott van, hogy mennyire validált.

**Kiegészítés:** IPRACS `getFixData()` 31 mezője (thrombophilia, APS, bipoláris zavar, korábbi
postpartum pszichózis, previa, accreta, VBAC-előzmény) — ezek ma a szülőszobán kérdeznek rá
olyasmire, amit az anamnézisben már rögzíteni kellett volna. **Ezek `mirror`-ként kerülnek be:
egy változó, két helyen látszik.**

## 4. Státusz

→ **részletes kidolgozás: [`modulok/04-statusz.md`](modulok/04-statusz.md)**

| | |
|---|---|
| Forrás | v16 (részleges) + IP + ÚJ |
| Becsült változó | ~280 |

Hat alszekció, közös vitális maggal:

| Alszekció | Tartalom | Forrás |
|---|---|---|
| **Belgyógyászati** | vitálisok, általános megtekintés, szív-tüdő hallgatózás, has, végtagok | ÚJ + IP vitálisok |
| **Kardiológiai** | NYHA, zörejek, pangásjelek, EKG-kapcsolat, CARPREG II bemenetek | v16 CARPREG + ÚJ |
| **Nőgyógyászati** | külső genitália, hüvelyi feltárás, portio, bimanuális, adnex, Papanicolau/HPV | ÚJ |
| **Szülészeti** | fundusmagasság, magzati helyzet/tartás/állás, szívhang, kontrakciók, cervix (Bishop-bemenetek), magzatvíz | IP `exam-*` |
| **Endokrin** | pajzsmirigy tapintás, virilizáció, striák, acanthosis nigricans, testarányok | ÚJ (v16 ENDO kiegészítése) |
| **Infertilitás** | ovariális rezerv jelei, hirsutismus-score (Ferriman-Gallwey), emlő-Tanner, partner-adatok | ÚJ |

A cervix-mezők (`dilation`, `effacement`, `station`, `consistency`, `position`) **egyetlen
helyen** élnek, és a Bishop-score `mirror`-ként hivatkozik rájuk — ez az IPRACS legfontosabb
architektúrahibájának javítása.

## 5. Vizsgálatok

→ **részletes kidolgozás: [`modulok/05-vizsgalatok.md`](modulok/05-vizsgalatok.md)**

A legnagyobb modul, önálló alfa-struktúrával. Becsült változó: **~520**.

### 5.1 Laboreredmények (~180)

| Alcsoport | Forrás | Megjegyzés |
|---|---|---|
| Általános labor | v16 `LABF` (13) + IP `lab-*` (30) | vérkép, máj, vese, ion, koaguláció, gyulladás |
| Mikrobiológia és szerológia | ÚJ | GBS, TORCH, hepatitis, HIV, syphilis, chlamydia, hüvelyflóra, tenyésztés + rezisztencia |
| Endokrin labor | v16 ENDO + IP pajzsmirigy | TSH, fT4, fT3, TRAK, anti-TPO, AMH, FSH/LH, E2, PRL, tesztoszteron, DHEAS, 17-OHP, kortizol, OGTT, HbA1c |
| Genetika | ÚJ | kariotípus, NIPT, CMA, panel/WES, hordozószűrés, thrombophilia-panel, farmakogenetika |
| Mikrobiom | ÚJ | hüvelyi mikrobiom (CST I–V), bélmikrobiom — **kutatási státusz, explicit jelöléssel** |

Minden labortételnél: érték + egység (UCUM) + referenciatartomány + **terhességi, trimeszterre
bontott referencia** (ez a v16-ból hiányzik, és klinikailag jelentős: a kreatinin, a
thrombocyta, a fT4 terhességi normálértéke más).

### 5.2 EKG (~40)

**Ez a modul már kész a v16-ban** (10c szekció, `window.__ekg` API), és 2026-09-01-én vissza
lett ellenőrizve az `ekg.xlsx` saját teszteseteivel — hét összevetésből hét egyezik. Az OGDOC-ba
tehát portolás megy, nem fejlesztés.

A portolás során az elemzés **négy hibát talált az eredeti munkafüzetben** (elcsúszott
átváltó-hivatkozás a Q-lapon, szöveg-szám összehasonlítás az `R!G8`-ban, `#N/A` a `QRS!A20`-ban,
mértékegység-keveredés az S1Q3T3-nál). A modul a helyes számítást használja, és a felületen
kiírja, hogy eltér. A 4. hibánál a következtetés ugyanaz, de a modul Q(III.)-at helyesen
0,3 mV-ként írja ki a munkafüzet „3"-a helyett — más bemenetnél ezért el fog térni, és ez a
kívánt viselkedés.

**Egyetlen nyitott kérdés maradt:** az openpyxl nem tudta kiolvasni a legördülő listák forrását
(mind `0`-ként exportálódott), ezért a választható értékek a képletek összehasonlításaiból
lettek visszafejtve (`poz` / `neg` / `equiphasic`). Ezt egyeztetni kell.

Egy kódszintű hiba is örökölhető, és javítandó a portoláskor: a lead-objektumokból hiányzik a
`qrsPol` kulcs az inicializálásnál. Az `axis()` ezt olvassa; ma működik, mert az értékadás
létrehozza, de az OGDOC-ban a regiszter úgyis kikényszeríti a teljes deklarációt.

### 5.3 Ultrahang (~190)

A v16 ultrahang-modulja (vizitsoros biometria, 16 egyszeres + 6 páros paraméter, SVG-görbék,
publikációból tölthető normogramok, percentilis + z-érték) a **legjobban megépített része az
egész meglévő eszközkészletnek**, és az OGDOC generikus vizsgálat-sablonjának mintája lesz.

| Alszekció | Alap |
|---|---|
| Nőgyógyászati | ÚJ — uterus, endometrium, ovariumok, AFC, Doppler, patológia |
| Szülészeti / koraterhesség | v16 CRL, GS, YS, szívműködés, lokalizáció, subchorialis haematoma |
| Szülészeti / I. trimeszter | v16 NT, orrcsont, ductus venosus, a. uterina PI, FMF-kockázat |
| Szülészeti / II–III. trimeszter | v16 teljes biometria + Doppler (UA, MCA, CPR, DV) + AFI/SDP + morfológia |
| Szülészeti / szülőszoba | IP — beszállás, pozíció, magzatvíz, sürgős biometria |
| Magzati echokardiográfia | ÚJ — szegmentális analízis, 4 üreg, kiáramlás, 3 ér, ritmus |
| POCUS / eFAST / ágymelletti | ÚJ — FAST 4+2 régió, tüdő-B-vonalak, IVC, TTE-alap |
| Kardiológiai | ÚJ — kamraméretek, EF, billentyűk, PAPs, aortagyök |
| Has, kismedence, nyak | ÚJ |
| Emlő | ÚJ — BI-RADS |
| Kontrasztos HSG (HyCoSy/HyFoSy) | ÚJ — tubaátjárhatóság, cavum |

A meglévő normogram-motort (táblázat és képlet módban tölthető referencia) általánosítjuk:
**bármely mérhető paraméterhez** rendelhető publikációból származó referencia, forrásmegjelöléssel.

### 5.4 Képalkotás — RTG, CT, MR (~70)

- **RTG / mRTG / HSG** — HSG külön sablon: cavum alakja, tubák, peritoneális szóródás
- **CT** — protokoll, kontraszt, lelet strukturáltan
- **MR** — felnőtt és **magzati MRI** külön sablonnal (indikáció, biztonsági ellenőrzőlista,
  szekvenciák, gesztációs kor)

Mindegyiknél kötelező mező: **indikáció, terhességi státusz, sugárterhelés (mSv), és a
kontrasztanyag terhességi/szoptatási besorolása**. Terhes betegnél sugárterheléses vizsgálat
kérésekor hard-stop megerősítő párbeszéd — az IPRACS kontraindikáció-kapu mintájára.

### 5.5 Szűrővizsgálatok (~40)

Cervixszűrés, emlőszűrés, GDM-szűrés (OGTT időzítése rizikó szerint), preeclampsia I. trimeszteri
szűrés, aneuploidia-szűrés, GBS, thyreoidea-szűrés, mentális szűrés (Whooley, EPDS).
A modul **esedékességet számol**: a beteg életkorából, rizikóiból és a korábbi szűrések
dátumából mit kellene most elvégezni.

## 6. Gyógyszerelés, GYSE, javaslatok (~90)

→ **részletes kidolgozás: [`modulok/06-gyogyszereles.md`](modulok/06-gyogyszereles.md)**

| Forrás | Mit ad |
|---|---|
| v16 | `PUPHA` magyar gyógyszertörzs, 5 592 tételes ATC-besorolás, `MEDQUICK`, allergia-sorok, és a `MEDDB` **22 átalakítási szabálya** — mindegyik reguláris kifejezéssel illeszkedik a beírt gyógyszernévre, és terhességi átalakítási javaslatot ad (belépési pont: `matchMed()`) |
| IP | **Hale LRC szoptatási biztonság** (17 szer), 14 indikációs antibiotikum-tábla ACOG/IDSA hivatkozással, **hard-stop kontraindikáció-kapuk** |

A hard-stop kapuk kritikusak és átvitelre kerülnek: *carboprost + asztma = abszolút
kontraindikáció*, *methylergonovin + hypertonia/preeclampsia*. Ezek a `fix-asthma`, `fix-htn`,
`fix-preeclampsia` változókból automatikusan aktiválódnak — vagyis **az anamnézisben bejelölt
asztma a szülőszobán állítja meg a gyógyszerrendelést**. Ez a keresztfeltöltés legjobb példája.

Kiegészítés: terhességi és szoptatási besorolás minden szerhez, interakció-ellenőrzés,
GYSE (gyógyászati segédeszköz) rendelés, dózis-számítás testsúlyra/vesefunkcióra.

## 7. Diéta (~35)

→ **részletes kidolgozás: [`modulok/07-dieta.md`](modulok/07-dieta.md)**

Terhességi energia- és fehérjeszükséglet, GDM-diéta (szénhidrát-elosztás), bariátriai műtét
utáni pótlás (vas, B12, folsav, D, kalcium — a v16 `en_bar` tétele már jelzi), anaemia,
coeliakia, PCOS, laktációs igény. Kimenet: nyomtatható betegtájékoztató.

## 8. Pszichológia (~60)

→ **részletes kidolgozás: [`modulok/08-pszichologia.md`](modulok/08-pszichologia.md)**

| Forrás | Mit ad |
|---|---|
| IP | **EPDS magyar validációval** (Töreki 2014, Midwifery 30:911, PMID 24742635) — Q10 („önkárosítás gondolata") bármely pozitív válasza vörös zászló az összpontszámtól függetlenül; postpartum pszichózis rizikó (bipoláris OR ~35×, korábbi PPP 50% recidíva, családi PPP RR 10.34) |
| ICHOM | Whooley (2 tétel), EPDS (10 tétel), MSPSS (3 tétel), MIBS (anya-csecsemő kötődés) |
| v16 | PHQ-2/PHQ-9 |

A PPP-modulnál a dokumentáció rögzíti: **5% szuicid, 4% infanticid kockázat → hospitalizáció
kötelező**. Ez nem javaslat, hanem hard-stop riasztás.

## 9. Epikrízis (~70)

→ **részletes kidolgozás: [`modulok/09-epikrizis.md`](modulok/09-epikrizis.md)**

Négy alszekció: **kockázatok**, **kimenetel**, **javaslatok**, **kódolás**.

Ez a modul nem új adatot gyűjt, hanem **szintetizál**. Az IPRACS `generateAIReport()` mintájára
öt stílus × két nyelv: klinikai narratíva, SBAR (átadás), zárójelentés, ápolói összefoglaló,
konzulensi kérés. A szöveg a regiszter aktuális értékeiből épül, nem sablonból.

## 10. Szülőszoba (~200)

→ **részletes kidolgozás: [`modulok/10-szuloszoba.md`](modulok/10-szuloszoba.md)**

| Forrás | Mit ad |
|---|---|
| IP | **teljes fedés** — canvas partogram (cervix, descent, FHR, QBL, WHO alert/action line), WHO Labour Care Guide rács, `addDataPoint()` 25 mezős idősoros séma |
| IP | MEOWS (AUC 0.87), Shock Index, NICHD FHR kategorizáció (Macones 2008), CMQCC PPH v3.0 (WHO/FIGO/ICM 2025 300 mL küszöb), omqSOFA, ISTH terhességi DIC (Erez 2014, cut-off 26), Bishop, VBAC Grobman MFMU 2021 race-neutral |
| IP | **CORI** — Composite Obstetric Risk Index, 6 domain maximuma 0–5 skálán |

Alszekciók: partogram · kockázatok · perinatológia. Az IPRACS ismert limitációja
(„session-szintű adat: oldalbetöltés után a `labourData[]` tömb elveszik") az OGDOC `series`
tárolási alakjával és a `Store` interfésszel megszűnik.

## 11. Műtő modul (~110)

→ **részletes kidolgozás: [`modulok/11-muto.md`](modulok/11-muto.md)**

**ÚJ.** Preoperatív (ASA, allergia, antikoaguláció, éhezés, vérkészítmény), intraoperatív
(műtéti leírás strukturáltan, csapatellenőrzés/WHO surgical safety checklist, anesztézia,
vérvesztés, szövődmény), posztoperatív (VTE-profilaxis — IP `calcVTE()` Caprini + RCOG GTG 37a,
fájdalomcsillapítás, mobilizáció, sebellenőrzés).

Császármetszés saját sablon, a szülészeti kimenetel-modullal összekötve.

## 12. Onkológia (~120)

→ **részletes kidolgozás: [`modulok/12-onkologia.md`](modulok/12-onkologia.md)**

**ÚJ.** Nőgyógyászati daganatok (cervix, endometrium, ovarium, vulva, emlő) + **terhesség alatti
daganat** külön útvonallal. TNM/FIGO stádium, szövettan, molekuláris profil, terápia (műtét,
kemo, sugár, célzott), válaszértékelés (RECIST), fertilitásmegőrzés, genetikai tanácsadás
(BRCA/Lynch — a v16 `f_canc` és `s_onc` tételei ide vezetnek).

## 13. Ellátás tervezés (~50)

→ **részletes kidolgozás: [`modulok/13-ellatas-tervezes.md`](modulok/13-ellatas-tervezes.md)**

Gondozási terv, vizitrend generálása rizikó szerint, szülésmód-tervezés (VBAC vs. elektív CS
megosztott döntéshozatallal), születési terv, szülés utáni fogamzásgátlás, szoptatási terv,
szükséges konzíliumok listája.

## 14. Zárójelentés (~40)

→ **részletes kidolgozás: [`modulok/14-zarojelentes.md`](modulok/14-zarojelentes.md)**

Generált dokumentum, nem új adat. A 9. modul kimenetéből + a kódolásból + a gyógyszerelésből
áll össze. Nyomtatható és exportálható (PDF, FHIR `Composition`).

## 15. Utánkövetés (~90)

→ **részletes kidolgozás: [`modulok/15-utankovetes.md`](modulok/15-utankovetes.md)**

Az **ICHOM PCB v5.0 időzítése** vezeti: `entry to prenatal care`, `3rd trimester`,
`42 days postpartum`, `6 months postpartum`. Anyai és újszülött kimenetel, késői szövődmény,
újrafelvétel, szoptatás folytatása, mentális szűrés ismétlése.

## 16. Betegelégedettség (~45)

→ **részletes kidolgozás: [`modulok/16-betegelegedettseg.md`](modulok/16-betegelegedettseg.md)**

Teljes egészében **ICHOM**: Satisfaction with Care (3), Healthcare Responsiveness (4),
Birth Experience — BSS-R (10), Role transition — MIBS (9), Breastfeeding — BSES-SF (17),
Patient-reported health status — EQ-5D-5L + WHODAS 2.0 (50).

**Ezek validált mérőeszközök: a tételszöveget és a pontozást nem módosítjuk.** A magyar
fordításnál a hivatalos, validált változatot kell használni, ahol létezik; ahol nem, ott a
kérdőív jelölése „nem validált fordítás".

## 17. Kódolás és kimenetelek (~80)

→ **részletes kidolgozás: [`modulok/17-kodolas.md`](modulok/17-kodolas.md)**

| Alszekció | Forrás |
|---|---|
| **BNO** | v16 `BNO` — feltételes szabályokkal (`t:(p,c)=>…`), azaz a kódajánlás a rögzített adatból következik, nem kézi keresésből |
| **OENO** | v16 EESZT-törzs — **650 valódi OENO-kód** beágyazva |
| **HBCS** | ÚJ — a BNO+OENO kombinációból HBCS-besorolás |
| Nemzetközi | ICHOM PCB v5.0 export, FHIR R4 (v16 `buildFHIR()`), REDCap |

A v16 a v15-ös EESZT-ingest óta **13 beágyazott kódtörzset** hordoz, összesen ~13 000 tétellel.
Ez az 1 MB-os fájlméret nagy része, és az OGDOC-ba változatlanul átkerül:

| Törzs | Tétel | Mire szolgál |
|---|---:|---|
| `atc` | 5 592 | hatóanyag-besorolás a gyógyszerkeresőhöz |
| `irszmap` | 3 294 | irányítószám → település automatikus kitöltés |
| `bnoObs` | 1 922 | BNO-kódajánlás, labor-vezérelt súlyossággal |
| `feor` | 1 217 | foglalkozás-besorolás |
| `oenoObs` | 650 | beavatkozás-kódok |
| `orszag` | 251 | országkódok |
| `xwalk` | 40 | kereszthivatkozás törzsek között |
| `small` | 11 | kis kódlisták (rizikótényezők, eredményközlés) |

Ezek havonta frissülnek, és letölthető törzsadatként érhetők el — nem böngészőből hívható API.
Az útvonal ezért mindig ugyanaz: **letöltés → konverter → beágyazott JSON → újraépítés.** Ez az
OGDOC build-láncába is beépül.

Az `irszmap` és a `feor` egyben a keresztfeltöltés két legegyszerűbb példája is: az irányítószám
kitölti a települést, a foglalkozás megnevezése a FEOR-kódot. Ezek `computed` levezetések
kódtáblából.

## 18. Minőségbiztosítás (~60)

→ **részletes kidolgozás: [`modulok/18-minosegbiztositas.md`](modulok/18-minosegbiztositas.md)**

**ÚJ.** Nem betegszintű: intézményi. Robson-osztályozás (császármetszés-arány), WHO
minőségindikátorok, ICHOM kimenetel-riportok, adatteljességi mutatók (**hány kötelező mező
maradt üresen**), score-használati statisztika, eltérés-elemzés (mikor bírálta felül az orvos
a javaslatot, és mi lett a kimenetel).

## 19. CRM: működés, erőforrás és páciens-kapcsolat (~600)

→ **részletes kidolgozás: [`modulok/19-crm.md`](modulok/19-crm.md)**

| | |
|---|---|
| Forrás | **IntuiCare — gyakorlatilag teljes fedés** |
| Becsült változó | ~600 (a meglévő 230 tábla jelentős része) |

Dolgozók és munkaidő · munkaidő-beosztás · szabadság · műtőfoglalás · időpontfoglalás ·
páciens-kommunikáció · bejelentkezés · kérdőívek.

Mind a nyolc terület **működő route-okkal, RLS-sel, triggerekkel és magyar jogszabályi
megfeleltetéssel** létezik (Mt. 134. §, 140–143. §, Eütev. 12/A–12/G., 13/A., 14.,
528/2020 16. §, GDPR Art. 9 és 20). Az OGDOC feladata itt átvétel, audit és a klinikai
modulokhoz kötés — nem építés.

Ez a modul **a platform**, amire a többi tizennyolc épül. Ezért a fázisozásban is elöl van:
az elfogadási kritériuma nem funkció, hanem a modul-audit nyitott hibáinak lezárása —
köztük a **BUG-015** tenant-bootstrap biztonsági hibáé, amin kutatási adatgyűjtés nem
indulhat el.

## 20. Statisztika, lekérdezés és tudomány (~40 + hozzáférés mindenhez)

→ **részletes kidolgozás: [`modulok/20-statisztika-lekerdezes.md`](modulok/20-statisztika-lekerdezes.md)**

Kattintással összeállítható lekérdezések a teljes adatállományon. Bármely mező bármely
felületen ⊕ ikonnal lekérdezésbe emelhető; a regiszter tudja a típusát, ezért a szerkesztő a
megfelelő operátorokat kínálja fel (`=` `≠` `>` `<` `≥` `≤` `from…to`, `bármelyik`, `üres`).
Tetszőleges mélységű `ÉS` / `VAGY` / `NEM` fa, `HA/KÜLÖNBEN` származtatott oszlopok, és
idősoros operátorok (`valaha`, `mindig`, `utolsó`, `max`, `trend`).

**Ez a modul azért lehetséges, mert a regiszter létezik** — minden új változó automatikusan
lekérdezhetővé válik, kézi karbantartás nélkül.

Két tervezési állítása fontos: **nincs beépített hipotézisteszt egy gombra** (az kattintással
elérhető p-érték iparszerű p-hackinget termel), és **a hiányzó adat aránya minden statisztikai
kimenet mellett kötelezően látszik**. Mellette k-anonimitási küszöb, `phi`-változók kizárása,
auditált futtatás és reprodukálhatósági kísérőlap.

## 21. Foglalkozás-egészségügy és munkahelyi kockázat (~350)

→ **részletes kidolgozás: [`modulok/21-foglalkozas-egeszsegugy.md`](modulok/21-foglalkozas-egeszsegugy.md)**

| | |
|---|---|
| Forrás | **SOS24 — gyakorlatilag teljes fedés** |
| Becsült változó | ~350 (a SOS24 71 táblájából kb. 40 kerül át) |

Hatlépéses alkalmassági munkafolyamat (beutaló → foglalás → kérdőív → vizsgálat → orvosi
vélemény aláírással → munkáltatói betekintés), **ISO 45001 kockázatértékelés** (valószínűség ×
súlyosság, intézkedési hierarchia, maradék kockázat, REACH SVHC, böngészőből mért zaj és
rezgés), és a **hivatalos magyar munkabaleseti jegyzőkönyv** teljes mezőkészlete.

Ez a modul **a v16 régóta nyitott teendőjének lezárása** („foglalkozás-egészségügyi lap
hiányzó elemei"). A modul legfontosabb szabálya, hogy **a munkáltató csak az alkalmassági
eredményt látja, a klinikai részleteket nem** — ugyanaz a szegregációs minta, ami az OGDOC
kutatói szerepéhez is kell.

## 22. Biobank és mintakezelés (~180)

→ **részletes kidolgozás: [`modulok/22-biobank.md`](modulok/22-biobank.md)**

A minta teljes életciklusa a levételtől a megsemmisítésig: adományozó és rétegzett
beleegyezés, minta-fa (levételi esemény → minta → alikvot → származék), preanalitikai
kódolás (SPREC), tárolóhely-hierarchia, append-only eseménylánc, QC, eltéréskezelés,
gyűjtemények és hozzáférési folyamat.

A modul négy dolgot **technikailag kikényszerít**, nem eljárásrenddel: hozzájárulás nélkül
nincs mintavétel; genetikai tanácsadás nélkül nincs humángenetikai vizsgálat; etikai
engedély nélkül nincs kiadás; és a **visszavonás lefutó folyamat**, ami után az adományozó
mintája egyetlen exportban sem jelenhet meg.

A hozzá tartozó megfelelési réteg — ISO 20387, ISBER, GDPR, BBMRI-ERIC és a magyar
jogszabályok — a [`megfeleles/`](megfeleles/) könyvtárban.

## 23. Genetikai tanácsadás és genetikai vizsgálatok (~220)

→ **részletes kidolgozás: [`modulok/23-genetika.md`](modulok/23-genetika.md)**

A teljes genetikai útvonal: prekoncepcionális és postkoncepcionális tanácsadás, hordozói
szűrés, prenatális szűrés és diagnosztika, eredményközlés, kaszkád-vizsgálat. A v16
**dinamikus családfája** a legfontosabb bemenete, és készen van.

Három tervezési döntés emeli ki a modult:

- **A tanácsadás kapu, nem melléklet.** A 2008. évi XXI. tv. szerint a vizsgálat előtt és
  az eredményközléskor kötelező — a rendszerben ez blokk, nem emlékeztető.
- **A szűrés és a diagnosztika elválasztva.** Egy pozitív NIPT a felületen **szűrési
  eredmény** marad, a **kiszámolt PPV-vel**, és a diagnózis mező üres megerősítő vizsgálatig.
  A PPV nem a teszt tulajdonsága, hanem a helyzeté.
- **Nondirektivitás.** A teendőmotor genetikai leletre **nem generál direktív javaslatot** —
  ez eltér a rendszer többi részétől, és a kódban kell kikényszeríteni.

Minden lelet kötelezően hordozza, **mit nem zár ki** (`limitations`), a VUS nem kerül a
diagnózisok közé, és **újraértékelési esedékességet** kap.

## 24. IVF és asszisztált reprodukció (~300)

→ **részletes kidolgozás: [`modulok/24-ivf.md`](modulok/24-ivf.md)**

A meddőségi kivizsgálástól a kezelési cikluson át a kimenetelig. A v16-ban a **`pre-ivf`
önálló felvételi útvonal** és a `conception` mező teljes értékkészlete már megvan.

- **A pár az egység**, nem az egyén — mindkét fél önálló beteg, saját beleegyezéssel, de a
  kivizsgálás és a kimenetel a párhoz kötődik.
- **Az OHSS a modul biztonsági magja.** A stimuláció megkezdése előtt kockázati szint;
  magas kockázatnál a rendszer felajánlja az agonista triggert és a freeze-all-t, és ha a
  klinikus mégis hCG-t és friss transzfert választ, **indoklás nélkül nem folytatható**.
- **Az embrió- és ivarsejt-tárolást NEM a 22. biobank modul kezeli** — jogilag más
  kategória: mindkét fél rendelkezése, válás és haláleset esetére előre rögzített döntés,
  tárolási időkorlát. A fizikai infrastruktúra közös, a jogi keret külön.
- A kimeneti alapmutató a **megkezdett ciklusra jutó kumulatív élveszülési arány**, nem a
  transzferenkénti terhességi arány — mert a párnak az számít.

## 25. Adminisztráció, jogosultságkezelés és belső szerkesztő (~120)

→ **részletes kidolgozás: [`modulok/25-admin-szerkeszto.md`](modulok/25-admin-szerkeszto.md)**

Ez a modul **dönti el, hogy a rendszer él-e**. Egy ~3900 változós, 25 modulos rendszer nem
tartható karban fejlesztői ciklussal: ha egy új laborparaméter felvétele egy hetes fejlesztés
és egy release, a rendszer fél éven belül elavul.

A regiszter-vezérelt architektúra pontosan azért készült, hogy ez ne így legyen — **ha a
változó definíciója adat, akkor szerkeszthető**. A belső szerkesztő váltja be az ígéretet:
változó, kódlista, panaszszótár, űrlap-elrendezés, kérdőív, normogram, dokumentumsablon,
SOP, fordítás — mind klinikus által, fejlesztő nélkül.

**Amit a szerkesztő nem enged, az a fontosabb fele:** score-képlet, hard-stop kapu,
`phi` jelölés és auditnapló nem szerkeszthető felületről. Minden szerkesztés piszkozatként
indul, hatásvizsgálatot mutat a levezetési gráfból, és **más hagyja jóvá, mint aki
szerkesztette**.

Itt oldódik meg a **BUG-015** is: nincs önkiszolgáló tenant-bootstrap, az első
adminisztrátor meghívó-alapú és auditált. És itt kényszerülnek ki az összeférhetetlenségi
szabályok — `kutato` + `kodkulcs_kezelo` egy felhasználón nem adható ki.

---

## 26. Előéleti adatimport, strukturálás és a jóváhagyási sor (~40)

→ **részletes kidolgozás: [`modulok/26-eloeleti-import.md`](modulok/26-eloeleti-import.md)**

Egy új beteg mögött húsz év papír van, és a rendszer minden ígérete — keresztfeltöltés,
szűrési esedékesség, kockázati score, vörös zászló — azon áll, hogy **van adat**. Ha ez
egy 2019-es zárójelentés PDF-jében ül, a rendszer szempontjából nincs.

**A modul egyetlen állítása: a gépi kinyerés állítást ad, nem adatot.** A kinyert érték
nem alacsony precedenciával kerül be a dokumentációba — sehogy nem kerül be, amíg egy
ember meg nem erősíti. Egy `extracted` provenance a rangsor alján rossz megoldás lenne:
a precedencia arról szól, melyik adat nyer, ha több van; itt viszont az a kérdés, hogy
adat-e egyáltalán.

A vörös zászló ellenben **a döntés előtt is látszik**, `pending` állapotban, megnevezve,
melyik javaslat döntené el. Egy rendszer, ami a meg nem erősített kinyerésből fakadó
gyanút a jóváhagyásig elrejti, épp azt veszíti el, amiért az egészet csináljuk.

A természetes nyelvű lekérdezésnél a modell a **lekérdezést** írja, nem a **választ** — a
lekérdezés megmutatható futtatás előtt, az eredmény pedig az adatbázisból jön, tehát
reprodukálható. A **beteg-oldali, fizetős** változatnál a modul szabályozási határt jelöl
ki: a *rendezés* nem orvostechnikai eszköz, a *javaslat* az (MDR 11. szabály).

**A mag megvan és tesztelt** (`core/import/`, 16 teszt); a kinyerő, a lekérdező és a
beteg-oldali rész terv.

---

## Összesítő

| # | Modul | Forrás | Becsült változó | Fázis |
|---|---|---|---|---|
| 19 | [CRM — dolgozók, beosztás, műtő, időpont, kommunikáció, kérdőív](modulok/19-crm.md) | **IntuiCare (kész)** | 600 | 0–1 |
| 20 | [Statisztika, lekérdezés és tudomány](modulok/20-statisztika-lekerdezes.md) | ÚJ (a regiszter teszi lehetővé) | 40 | 3–5 |
| 21 | [Foglalkozás-egészségügy és munkahelyi kockázat](modulok/21-foglalkozas-egeszsegugy.md) | **SOS24 (kész, portolandó)** | 350 | 4–5 |
| 22 | [Biobank és mintakezelés](modulok/22-biobank.md) | ÚJ (a v16 nyilatkozata a kiindulás) | 180 | 2–4 |
| 23 | [Genetikai tanácsadás és vizsgálatok](modulok/23-genetika.md) | v16 családfa + ÚJ | 220 | 3–4 |
| 24 | [IVF és asszisztált reprodukció](modulok/24-ivf.md) | v16 `pre-ivf` útvonal + ÚJ | 300 | 3–5 |
| 25 | [Admin, jogosultság és belső szerkesztő](modulok/25-admin-szerkeszto.md) | IntuiCare + SOS24 + ÚJ | 120 | 0–4 |
| 26 | [Előéleti adatimport és jóváhagyási sor](modulok/26-eloeleti-import.md) | ÚJ | 40 | 3–6 |
| 1 | [Panaszok](modulok/01-panaszok.md) | v16 + ÚJ | 120 | 2 |
| 2 | [Orvoshoz fordulás oka](modulok/02-orvoshoz-fordulas.md) | ÚJ | 25 | 1 |
| 3 | [Anamnézis](modulok/03-anamnezis.md) | **v16** | 230 | 1 |
| 4 | [Státusz](modulok/04-statusz.md) | v16 + IP + ÚJ | 280 | 2 |
| 5 | [Vizsgálatok](modulok/05-vizsgalatok.md) | v16 + IP + ÚJ | 520 | 2–4 |
| 6 | [Gyógyszerelés](modulok/06-gyogyszereles.md) | v16 + **IP** | 90 | 3 |
| 7 | [Diéta](modulok/07-dieta.md) | ÚJ | 35 | 5 |
| 8 | [Pszichológia](modulok/08-pszichologia.md) | **IP** + ICHOM | 60 | 3 |
| 9 | [Epikrízis](modulok/09-epikrizis.md) | IP | 70 | 4 |
| 10 | [Szülőszoba](modulok/10-szuloszoba.md) (a szepszis-eszköztárral együtt) | **IP** + CMQCC | 235 | 3 |
| 11 | [Műtő](modulok/11-muto.md) | ÚJ | 110 | 5 |
| 12 | [Onkológia](modulok/12-onkologia.md) | ÚJ | 120 | 6 |
| 13 | [Ellátás tervezés](modulok/13-ellatas-tervezes.md) | ÚJ | 50 | 4 |
| 14 | [Zárójelentés](modulok/14-zarojelentes.md) | IP | 40 | 4 |
| 15 | [Utánkövetés](modulok/15-utankovetes.md) | **ICHOM** | 90 | 4 |
| 16 | [Betegelégedettség](modulok/16-betegelegedettseg.md) | **ICHOM** | 45 | 4 |
| 17 | [Kódolás](modulok/17-kodolas.md) | **v16** | 80 | 3 |
| 18 | [Minőségbiztosítás](modulok/18-minosegbiztositas.md) | ÚJ | 60 | 6 |
| | **Összesen** | | **~4035** | |

### Amennyi ebből valóban új munka

A `07-intuicare-alap.md` 4. pontja bontja le tételesen. Röviden: teljesen új a **01** panaszszótár,
a **03** anamnézis, a **12** onkológia; nagyrészt új a **04**, **05**, **06**; felerészt új a
**10** (a partogram váza megvan, a score-készlet nincs) és a **17** (a kódtörzsek hiányoznak).
A többi tizenkét modul **meglévő infrastruktúra konfigurálása és tartalommal töltése**.

És a projekt magja, ami sehol nincs meg: **a változóregiszter és a levezetési motor** — a
`fhir-codes.ts` kiterjesztése ~2200 változóra, `computed` / `prefill` / `mirror` kapcsolatokkal.
