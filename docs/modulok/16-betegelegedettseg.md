# Modul 16 — Betegelégedettség és páciens által jelentett kimenetel

| | |
|---|---|
| **Cél** | A beteg saját szempontjából mért kimenetel, validált nemzetközi eszközökkel |
| **Forrás** | **ICHOM PCB v5.0 — teljes egészében** (importálva) |
| **Becsült változó** | ~45 (+ a `prom.*` névtérben összesen 108 ICHOM-tétel) |
| **Fázis** | 4 |
| **Függ** | 02, 15 |

## Mi van már meg az IntuiCare-ben

**Ez a modul szinte teljesen kész infrastruktúrán ül.** A `questionnaires` tábla `licenc` enumja külön nyilvántartja a licencelt kérdőíveket (EQ-5D-5L, WHODAS 2.0, BSS-R), a `mode`, `language`, `kioszk_eligible` és `recall_rules` mezők az ütemezést és a kitöltési módot. A `questionnaire_responses.is_anonymous` és `consent_to_record` a kutatási felhasználást fedi, a `satisfaction_surveys` az elégedettséget, a `/kiosk/$token` és `/portal/kerdoivek` a kitöltő felületet. **Az ICHOM 108 PROM-tétele adatbevitel, nem fejlesztés.**

## 1. Ez a modul már majdnem kész

Az ICHOM-importból **108 PROM-tétel** van a regiszterben, kódolt válaszkészletekkel. Ami
hiányzik: a magyar fordítás és a `consumers` feltöltése.

| Készlet | Tétel | ICHOM-tartomány | Mit mér |
|---|---:|---|---|
| **EQ-5D-5L + WHODAS 2.0** | 50 | PCB037–086 | egészséggel összefüggő életminőség és funkcionalitás |
| **BSES-SF** (Breastfeeding Self-Efficacy) | 17 | PCB087–103 | szoptatási önhatékonyság, szándék, siker |
| **MIBS** (Mother-Infant Bonding) | 9 | PCB104–112 | anya-csecsemő kötődés, szerepátmenet |
| **Whooley + EPDS** | 15 | PCB113–127 | mentális egészség (ld. `08`) |
| Satisfaction with Care | 3 | PCB128–130 | elégedettség, megosztott döntéshozatal (fájdalomcsillapítás) |
| Healthcare Responsiveness | 4 | PCB131–134 | tájékoztatás, szerep az ellátásban, bizalom az ellátókban |
| **BSS-R** (Birth Satisfaction Scale) | 10 | PCB135–144 | szülési élmény |

## 2. A legfontosabb szabály

> **Ezek validált mérőeszközök. A tételszöveget, a válaszskálát és a pontozást nem módosítjuk.**

Egy „kicsit érthetőbbre fogalmazott" EPDS-tétel már nem EPDS, és az eredménye nem
összehasonlítható semmivel. Ez kutatási felhasználásban különösen fontos: a nem validált
változattal gyűjtött adat publikálhatósága korlátozott.

### Fordítás

Ahol létezik hivatalos, validált magyar változat, azt kell használni. Ahol nem, ott a kérdőív
**„nem validált fordítás" jelölést kap**, és ez az exportban is megjelenik.

**Ez licencfüggő és hosszú átfutású** — az EQ-5D-5L, a WHODAS 2.0 és a BSS-R mind saját
licencfeltételekkel rendelkezik. A beszerzést a Fázis 2-ben el kell indítani, nem a Fázis 4-ben,
amikor a modul sorra kerül (ld. `04-utemterv.md` párhuzamos sávok).

## 3. Kitöltési mód

A PROM-okat **a beteg tölti ki**, nem a klinikus. Ebből három következmény:

1. A `provenance` minden `prom.*` változón kötelezően `patient`.
2. A felület beteg-módban más: nagyobb betű, laikus nyelv, haladásjelző, megszakítható és
   folytatható kitöltés.
3. **A klinikus nem írhatja felül** a beteg válaszát. Ha ellentmondást lát, azt külön
   megjegyzésben rögzíti — a beteg válasza érintetlen marad.

## 4. Keresztfeltöltés

**⇦ Mi tölti fel**: `02` (`ctx.pathway` és a mérési pont — melyik készlet esedékes), `15`
(az utánkövetési időpont).

**⇨ Mit tölt fel**: `08` pszichológia (az EPDS és a Whooley ugyanaz a változó — `mirror`, nem
duplikátum) · `18` minőségbiztosítás (intézményi elégedettség-mutatók) · **ICHOM-export**.

## 5. Elfogadási kritérium

A 42. napos mérési ponton a beteg által kitöltött készletek pontszáma az ICHOM pontozási
szabálya szerint számolódik, és az export a nemzetközi összehasonlításhoz szükséges alakban
készül. A `08` modul EPDS-e és ez a modul EPDS-e **ugyanaz a változó**, nem két külön kitöltés.

> **Ez teszt, nem ígéret:** [`test/prom.test.ts`](../../test/prom.test.ts).

A tükör az `aliasOf` mechanizmus: az írás a primer mezőre megy, az olvasás bármelyik néven
működik, és a rekordban **egy** érték áll. Két külön mező azt jelentené, hogy a beteg kétszer
tölti ki ugyanazt — és a két érték előbb-utóbb eltérne.

## 6. Nyitott kérdés

~~A magyar validált fordítások licencelése tisztázandó. Ez nem fejlesztői kérdés, de a
fejlesztést blokkolhatja.~~ **Eldőlt: kódban nem oldható meg — de LÁTHATÓVÁ tehető, és az
lett.**

A licenckérdést fejlesztéssel nem lehet lezárni. Amit a rendszer megtehetett: a blokkolást
**megkerülhetetlenné és számszerűvé** tette.

**Két független tengely, két külön következménnyel.** A tételszöveg licence eldönti, hogy az
eszköz FELVEHETŐ-e; a fordítás validáltsága azt, hogy a vele gyűjtött adat PUBLIKÁLHATÓ-e. A
Whooley például felvehető (a tételszöveg közkincs), de az adata korlátozottan közölhető.

**Tíz eszközből ma EGY vehető fel.** Ez a szám a lefedettségi doksiban minden generáláskor újra
kiíródik. A tervben a licenc „nyitott kérdés” volt, amit a 4. fázisban vettek volna elő; így
viszont minden build után ott áll. Ami nem látszik, azzal senki nem foglalkozik.

**A készlet kimondja, hogy ez BESZERZÉS.** Nem fejlesztői feladat és nem adatgyűjtési
mulasztás — ugyanaz a kategória-szétválasztás, mint a 15. modul ICHOM-exportjában.
(ld. [`../fejlesztes/23-prom.md`](../fejlesztes/23-prom.md))

### Új nyitott kérdések, amiket a megvalósítás hozott elő

**Az EQ-5D hasznossági indexe külön licenc.** Nem elég a kérdőív használati engedélye: az
indexhez ORSZÁGSPECIFIKUS értékkészlet kell. A rendszer ezért csak profilt ad (`21123`), és
kimondja, hogy egy másik ország értékkészletével számolt index nem magyar adat.

**A WHODAS-nak két pontozása van.** Az egyszerű összegzés és a hivatalos, tételválasz-elméleti
(IRT) pontozás más számot ad. A rendszer az egyszerűt számolja; az IRT-változat megvalósítása
NYITOTT, és addig a nemzetközi összehasonlításnál jelezni kell, melyiket használtuk.

**A BSS-R alskálái nincsenek meg.** A hivatalos tétel-besorolás (az ellátás minősége, a nő
személyes attribútumai, a szülés alatti stressz) nincs betöltve, ezért csak összpontszám
készül.
