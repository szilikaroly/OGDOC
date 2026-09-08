# 09 — Fejlesztési és bővítési lehetőségek

Amit a jelenlegi architektúra **olcsóvá tesz**, amit **drágán enged meg**, és amit
**nem szabad**. A becslés fejlesztő-hét, a mag mai állapotából.

## 1. Amit az architektúra szinte ingyen ad

Ezek azért olcsók, mert a regiszter már tartalmazza a szükséges adatot.

| # | Bővítés | Becslés | Mire épül |
|---:|---|---:|---|
| 1 | **Változó-verziózás és migráció** | 1–2 hét | `version` már minden definícióban van |
| 2 | **Kétnyelvű felület** | 0,5 hét | `I18n` végig; a `lang` paraméter már átmegy |
| 3 | **Nyomtatási nézet** | 1 hét | ugyanaz a `FieldSpec`, más renderer |
| 4 | **Kitöltési haladás-jelző** | 0,5 hét | kötelezőség + kitöltöttség a regiszterből |
| 5 | **Mezőszintű súgó** | kész | `fieldDoc()` már megvan |
| 6 | **Hatásvizsgálat a szerkesztőben** | kész | `impactOf()` már megvan |
| 7 | **Kalkulátor-katalógus a felületen** | 0,5 hét | `CALCULATORS` gépi olvasható |
| 8 | **„Miért ez az érték" panel** | 1 hét | `provenance` + `sourceRef` + `formula` már tárolt |

A 8. alulértékelt. A klinikus leggyakoribb kérdése egy származtatott értéknél:
*„ezt honnan veszi?"* — és a válasz már benne van a rekordban.

## 2. Amit közepes áron enged meg

| # | Bővítés | Becslés | Feltétel |
|---:|---|---:|---|
| 9 | **Perzisztencia** (`values` tábla) | 3–4 hét | M2; a séma megvan (`02-web-architektura.md`) |
| 10 | **Lekérdező** (20. modul) | 4–6 hét | a `phi` szűrés a regiszterből jön |
| 11 | **FHIR-export** | 3–4 hét | `standards.fhir` kitöltése mezőnként — **ez a munka java** |
| 12 | **Offline mód** | 4–5 hét | a mag már DOM- és DB-mentes; a szinkron-ütközés a nehéz rész |
| 13 | **Regiszter-szerkesztő** (25. modul) | 6–8 hét | jóváhagyási folyamat + hatásvizsgálat |
| 14 | **Auditnapló** | 2–3 hét | `audit: true` már jelölhető |
| 15 | **DICOM Worklist + SR-import** | 4–6 hét | Orthanc; a mérések már regiszterbeliek |

### 9 · Perzisztencia — amire figyelni kell

A `CaseState` → tábla leképezés triviálisnak látszik, de három csapdája van:

- **A `t` és a `recorded_at` nem cserélhető fel.** Aki ezt elrontja, a lejárási
  logikát rontja el, és az csendben rossz score-okat eredményez.
- **A `superseded_by` lánc nem `UPDATE`.** Egészségügyi rekordban a javítás is adat.
- **A `variable_version` tárolása kötelező.** Enélkül a történeti adat csendben
  átértelmeződik, amikor egy mező jelentése változik.

### 11 · FHIR-export — a becslés nagy része nem kód

A leképező réteg pár nap. **A `standards.fhir` kitöltése ~4000 mezőn a munka**, és
ez klinikai-informatikai feladat, nem fejlesztői. Ütemezésnél ezt külön kell venni.

## 3. Amit drágán enged meg — és miért

| # | Bővítés | Becslés | Miért drága |
|---:|---|---:|---|
| 16 | **Teljes ~4000 változós katalógus** | 25–35 hét | mechanikus, de klinikai átvételt igényel modulonként |
| 17 | **HIS kétirányú integráció** | 8–12 hét | gyártófüggő; az interfész-adatlap **beszerzési** blokkoló |
| 18 | **EESZT-csatlakozás** | 6–10 hét | hatósági folyamat, nem fejlesztési ütem |
| 19 | **MDR megfelelőségértékelés** | párhuzamos sáv | ld. `megfeleles/09-mdr.md` |
| 20 | **EKG kép-alapú felismerés** | 10–14 hét | AI-1; adatkormányzás és validáció a munka nagyobb fele |

## 4. Amit nem szabad

| Ötlet | Miért nem |
|---|---|
| **Mezőnkénti `if` a felületen** | A regiszter elveszti az egyeduralmát, és két igazság lesz. |
| **Kliensoldali validáció „a gyorsaságért"** | Két szabálykészlet, ami idővel szétcsúszik. A szerver válaszol. |
| **Számítás a böngészőben** | Ugyanaz, súlyosabb: két képlet. |
| **`consumers` kézzel** | Fél éven belül hazudik. |
| **A `phi` szűrés a felületen** | Az elrejtés nem védelem; aki a hálózati kérést látja, a választ is. |
| **Kapu megkerülése „ideiglenesen"** | Egy ellenőrizetlen képlet éles használata pontosan az, amit a kapu véd. |
| **Széles tábla mezőnkénti oszloppal** | ~4000 mezőnél minden új változó séma-migráció lenne. |

## 5. Amit előbb meg kell mérni

Ezek nem sürgősek, de a lefedettség növelése előtt **mérni kell** őket.

| Kérdés | Mai állapot | Mikor lesz gond |
|---|---|---|
| `recompute` gráf-újraépítése minden híváskor | mérhetetlen 47 változónál | valószínűleg **ez az első szűk keresztmetszet** |
| Minden `computed` újraszámolása | ugyanaz | `impactOf` halmazra szűkítendő |
| `caseView` minden kalkulátort futtat | 14 kalkulátor | ~200-nál szűrni kell |
| Űrlapleírás kérésenkénti generálása | gyors | verzió-kulccsal gyorsítótárazható |

**Egyik sem architektúra-hiba** — mind lokális optimalizálás. Ez maga is eredmény:
azt jelenti, hogy a lefedettség növelése nem igényel átépítést.

## 6. Három javaslat, amit érdemes előre venni

### 6.1 Referencia-fixture-ök minden kalkulátorhoz

**Becslés: 2–3 hét. Ez a legjobb megtérülésű tétel az egész listán.**

Minden kalkulátorhoz közleményből vagy hatósági példaszámításból vett bemenet-kimenet
párok, tesztként. A fullPIERS-hibát **ez fogta volna ki a definíció írásakor**, nem
a prototípus futtatásakor.

Ma a `verified` jelölés emberi állítás. Referencia-fixture-rel **bizonyíték** lenne.

### 6.2 A kapu kiterjesztése a küszöbökre

Ma a `verified` a *képlet* konstansaira vonatkozik. De a `bands` küszöbei (mikor
„kritikus" egy MAP) ugyanúgy klinikai állítások, és ugyanúgy tévedhetnek —
ráadásul **intézményenként eltérhetnek**.

Javaslat: a sávok kapjanak külön forrásmegjelölést, és a helyi protokolltól függő
küszöbök legyenek intézményi konfigurációk, ne kódba égetett számok. **Becslés: 1–2 hét.**

### 6.3 Az „egyéb" csatorna a nulladik naptól

A felülvizsgálati sor (`other_review_queue`) akkor is épüljön ki, amikor még kevés
kódlista van. Ha később kerül be, az addig felhalmozott „egyéb" bejegyzések elvesznek —
és **pont azok a legértékesebbek**, mert azok mutatják, hol hiányos a séma.
**Becslés: 1 hét most, 3 hét később.**

## 7. Összegzés

| Sáv | Tételek | Becslés |
|---|---|---:|
| Szinte ingyen | 1–8 | ~4 hét |
| Közepes | 9–15 | ~26–36 hét |
| Drága | 16–20 | ~50–70 hét + hatósági idő |
| Előre veendő | 6.1–6.3 | ~4–6 hét |

A `docs/12-15-honapos-terv.md` ezeket rendezi hónapokra és kapukra. **A 6.1–6.3 ott
ma nem szerepel önálló tételként** — a prototípus tapasztalata alapján érdemes
beemelni, mert mindhárom olcsóbb most, mint később.
