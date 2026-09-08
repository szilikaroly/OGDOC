# Modul 14 — Zárójelentés

| | |
|---|---|
| **Cél** | Hiteles, nyomtatható és exportálható összefoglaló dokumentum |
| **Forrás** | IPRACS (zárójelentés-stílus) + v16 (nyomtatás, FHIR-export) |
| **Becsült változó** | ~40 (mind generált) |
| **Fázis** | 4 |
| **Függ** | 09, 13, 17 |

## Mi van már meg az IntuiCare-ben

A `clinical_notes` (aláírással és verziózással), a `patient_encounters` (BNO/OENO tömbök, szerző és ellenjegyző aláírás), az `encounter-print.ts` és a `/portal/zarojelentes` route már megvan. **A generálás tartalma új, a dokumentum kerete kész.**

## 1. Nem gyűjt adatot

A `09` epikrízis „zárójelentés" stílusú kimenetéből, a `13` ellátási tervből és a `17`
kódolásból áll össze. Ha itt bármit be kell írni, az hiba a korábbi modulokban.

## 2. Szerkezet

| Blokk | Forrás |
|---|---|
| Fejléc: intézmény, ellátás időszaka, ellátó orvos | `02` kontextus |
| Betegazonosítás | **`phi: true` — a kutatási exportból kimarad** |
| Felvételi diagnózis | `02` beutaló dg + `01` panasz |
| Anamnézis kivonat | `03`, tömörítve |
| Fizikális status | `04` |
| Elvégzett vizsgálatok és leletek | `05` |
| Lefolyás | `10` / `11` idősoros adat narratívává |
| Kezelés | `06`, `07` |
| Végdiagnózis | `17` BNO |
| Elvégzett beavatkozások | `17` OENO |
| Kimenetel | `15` |
| **Javaslat** | `13` — a beteg számára érthető nyelven |
| Ellenőrző vizsgálat időpontja | `13` vizitrend |

## 3. Ami megkülönbözteti egy sablonos zárójelentéstől

**A javaslati rész minden pontja mellett ott van, mi váltotta ki.** Nem a klinikus emlékezetéből
áll össze, hanem a rögzített adatból, és a rendszerben visszakereshető, melyik változó melyik
értéke indokolta.

**A hiányzó adat itt is látszik.** Ha egy score `insufficient` volt, vagy egy kötelező vizsgálat
elmaradt, az a zárójelentésben megjelenik — nem hallgatólagosan hiányzik. Ez a klinikus és a
következő ellátó védelme is.

## 4. Kimeneti formátumok

| Formátum | Megjegyzés |
|---|---|
| Nyomtatás / PDF | külön print-CSS, a v16 gyakorlata szerint |
| **FHIR R4 `Composition`** | a v16 `buildFHIR()` bővítése — ma `QuestionnaireResponse`-t ad indikatív SNOMED/LOINC kódokkal, „validálandó" jelöléssel |
| .txt / vágólap | a v16-ból |
| ICHOM CSV | a `16` modulon keresztül |

## 5. Elfogadási kritérium

Egy teljes eset zárójelentése egy gombnyomásra elkészül, nyomtatható, és **nem tartalmaz
kitöltetlen sablonhelyet**. Ahol adat hiányzik, ott az hiányként jelenik meg, nem üres mezőként.

> **Ez teszt, nem ígéret:** [`test/zarojelentes.test.ts`](../../test/zarojelentes.test.ts).

Minden blokknak három állapota van: `filled` · `missing` · `notApplicable` — és a harmadik
**kizárólag rögzített tényből** jöhet. Járóbeteg-ellátásnál a lefolyás nem vonatkozik rá; ha
viszont nem tudjuk, milyen ellátásról van szó, a blokk HIÁNY marad. A nem tudás nem mentesít.

## 6. Nyitott kérdés

~~**Jogi státusz.** A generált zárójelentés addig nem hiteles egészségügyi dokumentum, amíg az
intézmény ezt nem hagyta jóvá és nem illesztette a saját dokumentációs rendjébe.~~ **Eldőlt:
kapuval, négy feltétellel — és a felületnél erősebben.**

| Feltétel | Honnan |
|---|---|
| a kötelező mezők megvannak | `readiness()`, a dokumentumtörzsből |
| az intézmény **befogadta** a generált dokumentumot | `disch.institution.approved` |
| aláírás **és ellenjegyzés** | a `doc.zarojelentes` mindkettőt előírja |
| **hitelesített felhasználói azonosítás** | 25. modul — **nem létezik** |

A negyedik feltétel a lényeg, és ma MINDENKINÉL zárva van. Az aláírás mező szabad szöveg:
bárki bármit beírhat. **Egy kapu, amit egy név begépelése nyit, nem kapu** — és ha a rendszer
ettől hitelesnek nyilvánítaná a dokumentumot, az rosszabb lenne, mint ha meg sem próbálná. A
kód ezért a képességet kívülről kapja (`identityVerified`), nem magáról állítja.

**A felületen kimondani kevés.** A figyelmeztetés a NYOMTATOTT dokumentum elején áll, nem a
láblécben, és a FHIR-exportban is (`status: "preliminary"`, `meta.tag`). A papír kimegy a
rendszerből; a képernyőn megjelenő figyelmeztetés ott marad. Egy `final` bélyegű Composition a
fogadó rendszerben ugyanúgy néz ki, mint egy valódi zárójelentés — és ott senki nem fogja
végigolvasni, honnan jött. (ld.
[`../fejlesztes/21-zarojelentes.md`](../fejlesztes/21-zarojelentes.md))

### Új nyitott kérdések, amiket a megvalósítás hozott elő

**A FHIR-kimenet nincs konformancia-ellenőrizve.** A `Composition` nem volt FHIR-validátorral
szembefuttatva, és a diagnózis- meg beavatkozás-kódrendszerek részben hiányoznak (17. modul).
A kimenet ezt `meta.tag`-ben MAGÁBAN mondja ki — de ez jelölés, nem megoldás.

**A UCUM-kódot a nyomtatáson ember olvassa.** A „148 mm[Hg]”, a „210 10*9/L” és a „33 a” nem
tájékoztat, hanem zavar. Új megjelenítési réteg készült (`core/ui/units.ts`, 14 egység), de a
teljes UCUM-készlet lefedése nyitott — a build-teszt viszont megállítja azt az új egységet,
aminek nincs emberi alakja.

**A „~40 generált változó” becslés félrevezető volt.** A zárójelentés BLOKKJAI generáltak (16
blokk, mind más modulból), és regiszterváltozó csak abból lett, ami sehol máshol nem
keletkezik: maga a dokumentum. Ez 19 mező. A generált blokk NEM tárolódik — ha tárolnánk, a
következő adatmódosítás után hazudna.
