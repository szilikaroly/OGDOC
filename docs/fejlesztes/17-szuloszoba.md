# 17 — Szülőszoba: a szám, ami nem valószínűség

> A modul dokumentációja szerint itt **nem fejlesztés folyik, hanem portolás**
> — és az IPRACS három ismert architektúrahibájának javítása. Mindhárom
> javítás megvan, és mindhárom tesztben áll.

## 1. A három javítás

| IPRACS-limitáció | Megoldás | Teszt |
|---|---|---|
| „oldalbetöltés után a `labourData[]` elveszik" | `Store` + verziózott sorosítás | *a vajúdás-idősor mentés és betöltés után hiánytalan* |
| „a Bishop Score egyszerre három helyen szerepel" | egyetlen `exam.cervix.*`, a többi tükör | *a méhszáj-tágulat a szülőszobán és a státuszban UGYANAZ az adat* |
| „duplikált függvények" | egyetlen `core/scores/` | a regiszter LOINC-szabálya fogja meg |

### 1.1 Amit a mentés őriz — és amit nem

A sorosításnak **verziója van**, mert a `CaseState` alakja változni fog, és a
régi mentés olvashatóságáért a rendszer felel, nem a felhasználó. Ismeretlen
formátumnál a betöltés megáll, nem találgat.

A napló **append-only, és a sorrendje jelentést hordoz**: azonos időbélyegű
javításnál a később bekerült nyer. A sorosítás ezért a tömbök sorrendjét is
megőrzi — ezt a teszt külön ellenőrzi, mert egy „rendezzük id szerint"
optimalizálás csendben visszafordítaná a javításokat.

> **Ami tudatosan nincs a tárolóban:** titkosítás, jogosultság, auditnapló. Ez
> a réteg a *megmaradást* oldja meg, nem a védelmet — és amíg a három nincs
> hozzátéve, a rendszer nem futhat valódi betegadaton.

## 2. Melyik score van kapu mögött, és miért

Ez a modul mutatja meg legjobban, hogy a kapu nem óvatoskodás, hanem
osztályozás:

| Score | Kapu | Miért |
|---|---|---|
| MEOWS | **nincs** | küszöbszámlálás — a paraméterek tartományon kívülre esését számolja |
| omqSOFA | **nincs** | négy küszöb megszámlálása, súlyozás nélkül |
| Sokk-index | **nincs** | osztás |
| NICHD | **nincs** | konszenzusos besorolási szabály, nem illesztett modell |
| ISTH DIC | **van** | sávos pontozás, ahol **a sávhatár a lényeg**: a fibrinogén 25 pontot ér 2 g/L alatt, egyetlen rossz határ átbillenti az egészet |
| CMQCC stádium | **van** | a v3.0 stádiumhatárait a 2025-ös 300 mL-es küszöbbel összeilleszteni **saját döntés**, nem publikált algoritmus |
| VBAC Grobman | **van** | a 2021-es, etnikum nélküli változat együtthatói nincsenek meg |
| fullPIERS | **van** | az együtthatókkal a modell klinikailag fordítva viselkedik |

### 2.1 A VBAC-kalkulátor és amiért csak az új változat van benne

A 2021-es változat **azért** készült, mert az eredeti modell etnikai tagot
tartalmazott, ami fekete és spanyolajkú nőknél rendszeresen alacsonyabb
sikervalószínűséget jósolt — és ezzel több császármetszéshez vezetett. A
rendszer kizárólag az etnikum nélküli változatot ismeri; a régi képlet
visszaállítása nem opció, akkor sem, ha annak megvannak az együtthatói.

Az együtthatók hiányában a `fn` `null`-t ad. **Közelítéssel implementálni
rosszabb lenne, mint nem adni számot** — ez az a hely, ahol a „majdnem jó"
szám a legdrágább: egy 60%-ra becsült VBAC-esély más beszélgetés, mint egy
40%-ra becsült, és a beteg ez alapján dönt.

## 3. NICHD — amit tudatosan nem automatizálunk

A modul nyitott kérdése kimondja: *a variabilitás, az akcelerációk és a
sinusoidalis mintázat klinikusi megítélést igényelnek… és nem szabad
automatizálni.* A megvalósítás ezt kényszeríti ki:

- **variabilitás nélkül nincs besorolás** — `insufficient`, a hiány megnevezve;
- **időszakos hallgatózásból nincs besorolás**, és ez nem hiányosság: alacsony
  kockázatú vajúdásban az időszakos hallgatózás az *ajánlott* módszer, a
  NICHD-kategória ott egyszerűen nem értelmezhető.

A besorolás **megindokolja magát** (`why[]`), nem csak eredményt ad. Egy
gyakori félreértés külön tesztben áll: a III. kategória **hiányzó**
variabilitást kíván, nem minimálisat — a minimális variabilitás ismétlődő
késői decelerációval még II. kategória.

## 4. CORI: a szám, ami nem valószínűség

A CORI nem publikált, validált modell, hanem a rendszer saját összesítője hat
domén fölött. Ezt ki kell mondani, mert **egy 0–5 skála pontosan úgy néz ki,
mint egy validált score.**

Amiért mégis van értelme: az összesítés `max`, nem összeg. A maximum nem állít
semmit a dómének *együttes* hatásáról; azt mondja, hogy „a legrosszabb domén
ezen a szinten van, tehát az ellátás erre a szintre emelkedik". **Eszkalációs
szabály, nem statisztikai modell** — és ezért nem esik abba a csapdába, ami a
postpartum pszichózisnál a kombinált számot megtiltotta.

### 4.1 A legveszélyesebb pont: a 0-s szint

A CORI skáláján a 0 azt jelenti: *nincs adat*. Ha egy domén adathiány miatt 0,
a `max` változatlan marad — vagyis **öt üres domén mellett a CORI simán
mutathat 1-et, zölden.** Pontosan az a csendes helyettesítés, amit a rendszer
mindenhol máshol tilt.

Ezért a kimenet két számot hordoz: az összesített szintet **és azt, hány domén
nem mért**.

```ts
cori(reg, state)
// { overall: 4, unmeasured: 2,
//   caveat: "2 domén NEM MÉRT (Hipertenzió, Vérzés). Az összesített szint csak a
//            mért dómének maximuma — a nem mért domén nem »rendben van«, hanem
//            ismeretlen. A CORI nem publikált, validált score, hanem eszkalációs
//            szabály…" }
```

Ha egyetlen domén sem mért, **nincs eredmény** — a teljesen üres eset nem
alapszint.

### 4.2 A domének megindokolják, mi hiányzik — vagy mi a kapu

Az első változat minden nem mért doménhez azt írta, hogy „nincs teljes vitális
mérés". Csakhogy a vérzési domén nem adathiány miatt maradt üresen, hanem mert
a **CMQCC-stádium kapu mögött van**. A domén indoklása ezért a futtató valódi
válasza, nem a mi feltételezésünk arról, mi lehetett a baj.

## 5. A partogram-vonal és amit feltételez

A klasszikus WHO figyelmeztető és beavatkozási vonal a 4 cm-től számított
**1 cm/óra** ütemet feltételezi. A WHO 2020-as Labour Care Guide ezt
**elhagyta**, mert az 1 cm/óra a vajúdások nagy részénél fölösleges
beavatkozáshoz vezetett: a normális vajúdás lassabb és változékonyabb, mint a
vonal feltételezi.

A vonalak mégis benne vannak, mert a hazai gyakorlat és a partogram-nyomtatvány
használja őket — de a szint mellé **oda van írva, mit feltételez**:

```
"a beavatkozási vonalon túl (a klasszikus 1 cm/óra ütemhez képest)"
```

Ez a zárójel a különbség aközött, hogy a rendszer egy elavult normát ténynek
állít, vagy megnevezi, melyik norma szerint mér.

## 6. Ami még hátravan

- **A partogram rajza és nyomtatási CSS-e** (A3 vagy A4 fekvő) — a modul
  örökölt nyitott teendője.
- **Az ISTH DIC protrombin-idő különbsége.** A pontszám a beteg és a kontroll
  PT különbségét kívánja; a rendszer ma az INR-ből közelíti, és ez a közelítés
  maga is ellenőrzésre vár.
- **A WHO Labour Care Guide monitorozó rács** külön nézetként. A támogató
  ellátás elemei (kísérő, testhelyzet) már változóként megvannak.
- **A perinatológiai sürgősségi modulok** (inzulin, transzfúzió, thyroid storm,
  VTE, delírium) — a `11` modullal együtt.
