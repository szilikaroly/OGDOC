# Modul 10 — Szülőszoba

| | |
|---|---|
| **Cél** | Vajúdás valós idejű követése, kockázatstratifikáció, perinatológiai döntéstámogatás |
| **Forrás** | **IPRACS — teljes fedés** |
| **Becsült változó** | ~200 |
| **Fázis** | 3 |
| **Függ** | 02, 03, 04, 05 |

## Mi van már meg az IntuiCare-ben

**A partogram váza megvan**: `obstetric_partograms` (`labor_start_ts`, `membrane_status`, `parity_gravida_json`) + `obstetric_partogram_entries` (cervix_cm, descent_station, fetal_heart_rate, kontrakciók száma és időtartama, anyai RR és pulzus, hőmérséklet, liquor színe, moulding, oxytocin, gyógyszerek), `partogram-pdf.ts` nyomtatással, és a `/klinika/partogram/$encounterId` route. A `scores.ts` hozza a Bishopot, a NEWS2-t, a qSOFA-t és a SOFA-t. **Nincs meg a szülészeti score-készlet** — fullPIERS, MEOWS, CMQCC, NICHD, VBAC Grobman, ISTH DIC, CORI — és a WHO alert/action line.

## 1. A legkészebb modul

Az IPRACS lényegében ezt a modult valósítja meg, 25+ validált score-ral. Az OGDOC feladata itt
**nem fejlesztés, hanem portolás SSOT-konform módon** — és az IPRACS három ismert
architektúrahibájának javítása:

| IPRACS-limitáció | OGDOC-megoldás |
|---|---|
| „session-szintű adat: oldalbetöltés után a `labourData[]` elveszik" | `series` tárolási alak + `Store` interfész |
| „a Bishop Score egyszerre három helyen szerepel" | egyetlen `exam.cervix.*`, a többi `mirror` |
| „a duplikált függvények (`calcLATCH` kétszer)" | egyetlen `core/scores/` |

## 2. Adatszerkezet: a vajúdás-idősor

Az IPRACS `addDataPoint()` 25 mezős sémája `series` alakban:

| Változó | Egység | Fogyasztó |
|---|---|---|
| `labour.hour` | óra | partogram X-tengely (computed a felvételi időből) |
| `labour.cervix` | cm 0–10 | partogram fő görbe, WHO alert/action line |
| `labour.descent` | 0–5 | partogram |
| `labour.fhr.baseline` | bpm | NICHD |
| `labour.fhr.decel` | L/V/E/N | NICHD |
| `labour.fhr.variability` | coded | NICHD — **klinikusi megítélés, nem automatikus** |
| `labour.fhr.accel` | bool | NICHD |
| `labour.amniotic` | coded | |
| `labour.contractions` | /10 perc | |
| `labour.contractionDuration` | s | |
| `vitals.*` | — | `mirror` a `04`-ből |
| `labour.urine` | mL | |
| `labour.qbl` | mL | **kumulatív** → CMQCC, partogram |
| `labour.caput` / `.moulding` | 0–3 | |
| `labour.companion` / `.posture` / `.oxytocin` | — | supportive care (WHO LCG) |
| `labour.mgso4` / `.txaTime` | — | beadás időpontja |

## 3. Partogram

Canvas/SVG rajz: cervix-tágulat, beszállás, FHR, kumulatív QBL, és a **WHO alert/action line**.
A WHO Labour Care Guide monitorozó rács külön nézetben, az összes rögzített rekorddal.

> **Örökölt nyitott teendő:** a partogram nyomtatási CSS (A3 vagy A4 fekvő) hiányzik. Ez a
> Fázis 3 része.

## 4. Score-ok — a teljes készlet

| Score | Forrás | Kulcsadat |
|---|---|---|
| **fullPIERS** | von Dadelszen, *Lancet* 2011;377:219–227 | n=2023, AUC 0,88; 48 órán belüli súlyos anyai esemény |
| **sFlt-1/PlGF** | Zeisler, *NEJM* 2016;374:13–22 | NPV 99,3% 1 hétre a rule-out tartományban |
| **MEOWS** | Singh, *Anaesthesia* 2012;67:12–18 | AUC 0,87 súlyos morbiditásra |
| **Shock Index** | HR/SBP | szintezett klinikai akcióval |
| **NICHD FHR** | Macones, *Obstet Gynecol* 2008;112:661–666 | háromszintű konszenzus |
| **CMQCC PPH v3.0** | CMQCC Hemorrhage Toolkit v3.0, 2022 | Stage 0–3, WHO/FIGO/ICM 2025 **300 mL** küszöb |
| **omqSOFA** | — | HR>90, RR>20, temp<36 vagy >38, SpO₂<95; ≥2 → szepszisgyanú |
| **CMQCC szülészeti szepszis-szűrő** | CMQCC OB Sepsis Toolkit | temp<36 vagy >38, HR>110, RR>24, WBC>15 vagy <4; ≥2 → szűrőpozitív. **Kapu mögött** |
| **ISTH terhességi DIC** | Erez, *PLoS ONE* 2014;9:e93240 | cut-off 26, sens 88%, spec 96% |
| **Bishop** | — | `mirror` a `04`-ből |
| **VBAC Grobman** | Grobman, *AJOG* 2021;225:664.e1, PMC8611105 | n=11774, **race-neutral** változat |
| **CORI** | IPRACS saját | hat domén maximuma, 0–5 |

### fullPIERS — pontos képlet

```
logit = -2.68
      + (-0.154   × GA_hetek)
      + ( 1.23    × mellkasi_fájdalom_vagy_dyspnoe)   ← 0/1
      + (-0.0271  × SpO₂_%)
      + ( 0.207   × ln(PLT))      + (0.00004    × PLT²)
      + ( 0.0101  × Cr_μmol/L)    + (0.00000262 × Cr²)
      + ( 0.025   × ln(AST_U/L))  + (-0.000592  × AST²)
P = 1 / (1 + e^(-logit))
```

**Ha bármelyik bemenet hiányzik → `insufficient`, nem 0.** Ez a rendszer legfontosabb
betegbiztonsági szabálya, és pont itt a legkritikusabb.

### CORI — a hat domén

| Domén | Forrás | Szintképzés | Kritikus |
|---|---|---|---|
| Anyai deterioráció | MEOWS, MEWC | `max(MEOWS.lv, MEWC≥2 ? 3 : 0)` | ≥ 3 |
| Hipertenzió/PE | fullPIERS, sFlt/PlGF | `max(fp.lv, sf.lv)` | ≥ 3 |
| Vérzés | CMQCC, Shock Index | `max(cmqcc.lv, si.lv)` | ≥ 3 |
| Infekció | omqSOFA | `score≥2 → 4` | ≥ 2 |
| Magzat | NICHD | `III→5, II→2, I→0` | III |
| Vajúdás | partogram | `action→4, alert→3` | action line |

`overall = max(összes domén)`. Skála: 0 nincs adat (szürke) · 1 baseline (zöld) · 2 megfigyelés ·
3 óvatosság (narancs, **senior orvos tájékoztatása**) · 4 sürgős (piros, protokoll-beavatkozás) ·
5 kritikus (sötétpiros, **azonnali multidiszciplináris**).

## 4/b. Szülészeti szepszis — a CMQCC eszköztár szerkezete

*A CMQCC vérzési eszköztára (`calc.cmqcc.stage`) már a modulban volt; ez a
szepszis-eszköztár párja, ugyanazzal a szerkezettel: stádiumhoz kötött válasz,
órához kötött lépések, megnevezett címzett.*

**Két rétegben él, és ez szándékos.** A SZÁMOT adó élettani szűrő kalkulátor
(`calc.cmqcc.ob.sepsis.screen` → `score.cmqcc.ob.sepsis`), az omqSOFA mellett,
ugyanazokkal a kapukkal. A háromlépéses ÚT (szűrés → gyanított góc → szervi
elégtelenség) és az órához kötött ellátási csomag viszont nem szám, hanem
folyamat: az a `core/szepszis/` motorban él.


## Amit ez a modul másként csinál

### 1. Nem fut ismeretlen terhességi állapotnál

Ez a rendszer legrégebbi szabályának alkalmazása: *ismeretlen terhességi
állapot → nincs referenciatartomány; a nem terhes sáv NEM alapértelmezés.*

Ha nem tudjuk, terhes-e, a szűrő **nem esik vissza csendben** a nem terhes
küszöbökre. Nem terhes küszöbbel a terhes nő fals riasztást kap; terhes
küszöbbel a nem terhes szepszise csúszik el. A modul kimondja, hogy nem
futott, és megnevezi, mi hiányzik.

### 2. A gyermekágyban is fut

A szülészeti szepszis jelentős része a szülés **után** jelentkezik, gyakran
már az osztályról való elbocsátás után. Éppen ott, ahol a szülészeti epizód
lezárul és a figyelés meghalna. A hatály ezért a gyermekágy 42. napjáig tart
— **epizódok közötti hivatkozás**, nem a szülés napjáig tartó éberség.

### 3. A vajúdás nem tesz normálissá — kivesz

A szülés élettanilag megemeli a fehérvérsejtszámot és a laktátot. A modul
ilyenkor **nem „normálisnak" minősíti** ezeket a tételeket, hanem kiveszi a
szűrésből, és ezt kimondja.

A különbség nem szőrszálhasogatás: a „normális" megnyugtat, a „nem
értékelhető" nem. Ez ugyanaz a megkülönböztetés, amit a forrásrendszer
magzati anatómiájában találtunk a *„nem látható"* (lelet) és a *„nem
megítélhető"* (technikai korlát) között.

### 4. A hiányzó tétel nem negatív tétel

Ha két tételből egy teljesül és kettő ismeretlen, az eredmény **nem
szűrőnegatív, hanem eldöntetlen** — mert a hiányzó tételekkel a küszöb még
elérhető lenne. A modul ezt külön állapotként adja vissza
(`screenIndeterminate`, `sepsisIndeterminate`).

A leggyakrabban hiányzó tétel a **légzésszám**: a legritkábban mért és a
legkorábban jelző élettani érték.

### 5. A góc kérdésére a rendszer nem felel a klinikus helyett

A háromlépéses út közepe — *van-e gyanítható fertőzéses góc?* — nem mérésből
következik. A modul itt **megáll és megkérdezi**, a választ pedig a döntést
hozó személyhez és időponthoz köti.

A `null` nem „nincs góc": azt jelenti, hogy **a kérdés még nem hangzott el**.
És ha a válasz „nincs", az DÖNTÉS, ami a rekordban marad — nem a hiánya,
hanem maga a döntés.

Ez a negyedik hely a rendszerben, ahol a modell a klinikus **mellé** áll és
nem helyette: a PUL-modell melletti szubjektív benyomás, a gépi CTG-olvasat
melletti vizuális olvasat, és a számított melletti mért poszt-transzfúziós
hemoglobin után.

### 6. Hitelesítetlen protokoll nem ad riasztást

**Az elsődleges forrás nem volt elérhető:** a `cmqcc.org` tartományt a
hálózati szabályzat blokkolja. A küszöbértékek ezért **másodkézből**
kerültek a regiszterbe, `assumed` szinten.

Következmény: a modul szerkezete kész, tesztelt és futtatható, de
**egyetlen riasztást sem ad ki**. Ugyanaz a kapu, mint a normogramoknál — a
tábla látszik, percentilist nem ad —, és a validátor **build-hibát** dob, ha
valaki hitelesítetlen protokollnál bekapcsolná a riasztást.

A hitelesítés klinikai szakértői feladat, névvel és dátummal.

---

## Az első sorrendi kapu

Eddig a rendszer minden kapuja egy **értékről** szólt: ellenőrizetlen
konstans, hiányzó mértékegység, hitelesítetlen tábla, bejelöletlen
kontraindikáció. Ez az első kapu, ami két **esemény egymáshoz képesti
helyéről** szól:

> **A hemokultúrának meg kell előznie az antibiotikumot** — utána a
> tenyésztés jó eséllyel negatív lesz, és a kórokozó örökre ismeretlen marad.

De a sorrendi kapu **nem hard-stop**. Ha a hemokultúra késne, az antibiotikum
akkor is megy: a beteg élete előbbre való a mikrobiológiai leletnél. A
rendszer ezért nem tilt, hanem **rögzíti, hogy a sorrend megfordult**, és
megnevezi, mi az ára.

---

## A csomag időbélyeggel mérhető, jelölőnégyzettel nem

„Megtörtént" és „egy órán belül megtörtént" két különböző állítás, és a
minőségi visszamérés a másodikon áll. Minden lépés a **felismerés**
pillanatától méri az időt — nem a felvételtől; a kettő különbsége maga is
mérőszám.

| Állapot | Mit jelent |
|---|---|
| `onTime` | határidőn belül megtörtént |
| `late` | megtörtént, de későn |
| `pending` | még belefér az időbe |
| `overdue` | lejárt, és nincs rögzítve — **ez nem azt jelenti, hogy nem történt meg** |
| `omitted` | szándékosan elmaradt, indoklással: dokumentált döntés, de nem teljesítés |
| `notApplicable` | a feltétele nem történt meg |

---

## „Kiadva" ≠ „átvéve"

A toolkit legfontosabb üzenete nem küszöbérték:

> **A válaszút nélküli riasztás rosszabb a semminél.**

Aki naponta háromszor kap figyelmeztetést, amire nincs kihez fordulnia, két
hét alatt megtanulja elkattintani — és akkor az igazit is elkattintja. Ezért
minden riasztásnak van megnevezett **címzettje**, **válaszhatárideje** és
**átvételi nyugtája**, és a ki nem vett riasztás önálló állapot, aminek
magának is riasztania kell, egy szinttel feljebb.

Ez pontosan az a szerkezet, amit a forrásrendszer leletlapjain találtunk:
**„Megrendelve" és „Eredmény" két külön jelölőnégyzet**, mert a kintlévőség
önálló állapot.

---

## Két küszöb ugyanarra a mérésre

A rendszerben már fut az **omqSOFA** (SOMANZ 2017) a szülőszobai
CORI-pontszám infekciós tartományaként. A két forrás küszöbei eltérnek:

| Mérés | CMQCC-szűrő | omqSOFA (SOMANZ) |
|---|---|---|
| Légzésszám | > 24/perc | > 20/perc |
| Pulzus | > 110/perc | > 90/perc |

Ez nem elírás, hanem két nemzetközi ajánlás különbsége — de a rendszerben
két helyen két szám áll ugyanarra a mérésre. Amíg a klinikai hitelesítés el
nem dönti, melyik az intézményi küszöb, **a rendszer mindkettőt megnevezi a
forrásával együtt, és egyiket sem csendesíti el a másikkal.** A validátor
figyelmeztetésben mondja ki az eltérést.

---

## Kettős számolás — amit a levezetési gráf fogott meg

A szervi elégtelenség készletéből **szándékosan hiányzik az artériás
középnyomás**, pedig klinikailag odaillene. Az ok szerkezeti: a rendszerben
a MAP a systolés és a diastolés értékből **levezetett** — ugyanabból a
mandzsettából. Két tételként számolva egyetlen mérés kétszer vinné a
küszöböt.

A validátor ezt magától jelzi: átnézi, hogy egy készleten belül nincs-e olyan
tétel, amelynek változója egy másik tételéből számítódik. A MAP a helyén
marad ott, ahol **célérték**: a vazopresszor-lépésnél.

---

## Kapcsolódás a többi modulhoz

| Modul | Kapcsolat |
|---|---|
| `06` Gyógyszerelés | az antibiotikum kiválasztása a kontraindikáció-kapun megy át (allergia, szoptatás, veseműködés) |
| `10` Szülőszoba | az omqSOFA és a CORI-pontszám infekciós tartománya |
| `19` Kódolás | a puerperalis sepsis BNO-kódja és a fekvőbeteg-besorolás |
| `25` Finanszírozás | a szepszis megváltoztatja a HBCS-csoportot és a határnapokat |
| `24` Kimenetel | visszaigazolta-e a hemokultúra a klinikai gyanút — az audit-hurok szepszisre |

---

## Ami hátravan

1. **A küszöbök hitelesítése** az eredeti CMQCC-eszköztárból, klinikai
   szakértő nevével és dátumával. Amíg ez nincs meg, a modul nem riaszt.
2. **Az intézményi döntés** az omqSOFA-val való küszöbeltérésről.
3. **A riasztás címzettjének** felvétele a szervezeti rendbe: kinek szól,
   milyen határidővel, és ki a következő szint, ha nem veszi át.

---

## 5. Perinatológia — kapcsolódó sürgős modulok

Az IPRACS „Sürgős" fülének tartalma ide és a `11`-be oszlik:

- **Inzulin** (`calcInsulin`) — célszintek vajúdás alatt 3,9–7,8 mmol/L (WHO LCG)
- **Transzfúzió** (`calcTransfusion`, AABB 2023) — auto-fill a labor SSOT-ból
- **Pajzsmirigy sürgősség** — Burch-Wartofsky ≥ 45 → thyroid storm; PTU elsőként (600 mg
  telítő, majd 200–300 mg q6h)
- **VTE** (`calcVTE`) — Caprini + RCOG GTG 37a
- **Delírium** — 4AT (Bellelli 2014, sens 89,7%, spec 84,1%), CAM-ICU (pooled sens 80%,
  spec 96%), THINK differenciál 12 szülészeti diagnózissal

## 6. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` anamnézis (CMQCC, VBAC, Caprini bemenetek — `mirror`), `04` státusz
(vitálisok, cervix), `05` labor (fullPIERS, DIC, transzfúzió), `02` (`ctx.ga`).

**⇨ Mit tölt fel**: `06` gyógyszerelés (aktuális vérzés → uterotonikum, kapukkal) · `09`
epikrízis · `11` műtő (sürgős császármetszés) · `15` kimenetel · `17` kódolás.

## 7. Elfogadási kritérium

A vajúdás-idősor **túléli az oldalbetöltést** (ez az IPRACS legfőbb hibája). A Bishop egyetlen
helyen szerkeszthető. A fullPIERS hiányzó AST mellett `insufficient`-et ad. Minden score-hoz van
referencia-fixture: a fullPIERS a publikált példaszámítás ellen ellenőrizve.

> **Ez teszt, nem ígéret:** [`test/szuloszoba.test.ts`](../../test/szuloszoba.test.ts) —
> mind a három IPRACS-hibajavítás és minden score referencia-fixtúrája.

## 8. Nyitott kérdés

A CTG-variabilitás, az accelerációk és a sinusoidalis mintázat **klinikusi megítélést
igényelnek** — ezeket az IPRACS-ban is kézzel tölti a klinikus, csak az FHR-alapvonal és a
deceleráció típusa automatikus. Ez így helyes, és nem szabad automatizálni.

**Megvalósítva:** a NICHD-besorolás variabilitás nélkül nem születik meg, és időszakos
hallgatózásból egyáltalán nem — az utóbbi nem hiányosság, hanem a módszer korlátja.

### Új nyitott kérdések, amiket a megvalósítás hozott elő

1. **A CORI 0-s szintje.** A skálán a 0 „nincs adat"-ot jelent, de a `max`-összesítésben ez
   azt eredményezné, hogy öt üres domén mellett a CORI zölden mutat 1-et. A kimenet ezért a
   nem mért domének számát is hordozza, és üres esetből nincs eredmény. Ez védhető, de
   klinikai átvételt kíván. (ld. [`../fejlesztes/17-szuloszoba.md`](../fejlesztes/17-szuloszoba.md) 4.)
2. **A CMQCC-stádium a saját összeillesztésünk:** a v3.0 stádiumhatárai és a 2025-ös
   300 mL-es beavatkozási küszöb nem ugyanabból a dokumentumból származnak. Ezért áll kapu
   mögött — nem azért, mert a számok bizonytalanok, hanem mert az ÖSSZEILLESZTÉS a miénk.
3. **A VBAC-kalkulátor együtthatói** hiányoznak. A 2021-es, etnikum nélküli változat nélkül
   a rendszer nem ad számot, és a régi, etnikai tagot tartalmazó képlet visszaállítása nem
   opció.
