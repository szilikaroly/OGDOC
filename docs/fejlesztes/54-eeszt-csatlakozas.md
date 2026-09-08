# 54 — Az EESZT-csatlakozás dossziéja

*A 14. lépés gépi fele. Az első kapu, ami nem befelé véd.*

---

## Amiért ez a lépés más súlyú a többinél

**A csatlakozás kifelé ír.** Minden eddigi kapu azt védte, hogy a rendszer ne
mondjon rosszat *saját magának*: hitelesítetlen laborreferencia, aláíratlan
normogram, ellenőrizetlen megőrzési idő.

Az EESZT-be küldött üzenet **elhagyja a rendszert**, és attól kezdve nem a
miénk. A hibás belső bejegyzés javítható; **az országos térbe küldött üzenet
nem.**

Ezért a **hitelesítés hiánya itt más súlyú**. Ma a cselekvő kilétét egyetlen
ellenőrizetlen kérésfejléc állítja. Belül ez rossz; csatlakozás után a rendszer
az **országos nyilvántartásba** írna egy olyan azonosító nevében, amit senki nem
ellenőrzött.

**Ez nem fokozati különbség.**

---

## A négy kapu

| | Kapu | Ma |
|---|---|---|
| ☑ | **Auditnapló** | hasítóláncos napló, tesztelve |
| ☐ | **Hitelesítés** | NINCS — a cselekvőt kérésfejléc állítja |
| ☑ | **Szintetikus üzemmód** | áll — valódi betegadaton nem futhat |
| ☐ | **Ágazati azonosító a profilban** | NINCS |

### A szintetikus kapu fordítva olvasandó

Ez az egyetlen bizonyíték a rendszerben, amelyik **akkor „van meg", amikor a
rendszer nem tud valamit**: a kiszolgáló `OGDOC_SYNTHETIC=1` nélkül el sem
indul, mert nincs hitelesítés.

**A megléte nem képesség, hanem beismerés** — és amíg ott áll, országos
nyilvántartásba nem küldhetünk. Ez a helyes irány, és a `csatlakozhato()`
ezért nem is a bizonyíték meglétét kéri, hanem a hitelesítését.

A teszt külön bizonyítja, hogy **a kapu eltüntetése önmagában nem nyit
csatlakozást**: ha valaki kiveszi a szintetikus kaput anélkül, hogy
hitelesítést írna, a többi kapu zárva marad.

---

## Az öt űrlap — és ki tudja kitölteni

| Űrlap | Beadja | Aláírja |
|---|---|---|
| Fejlesztői regisztrációs lap (v4.1) | rendszerfejlesztő | cégvezető + kapcsolattartó |
| Referenciaigazolás (v2.2) | **az intézmény** igazolja a szállítót | intézményi képviselő |
| Titoktartási nyilatkozat (v1) | rendszerfejlesztő (Gyártó) | cégvezető |
| Megbízott kijelölése — **OTP tokenkezelés** (v1) | intézmény | vezető + megbízott |
| Megbízott kijelölése — **tanúsítványkezelés** (v1) | intézmény | vezető + megbízott |

**18 mező, és mindegyikről kiderül, ki tudja megválaszolni:**

| Ki | Hány | Példa |
|---|---:|---|
| **rendszer** | 3 | ellátási típusok · programnyelv · operációs rendszer |
| szervezet | 14 | cégadatok, referencia, személyi adatok |
| **üzemeltetés** | 1 | **a fejlesztés helyének fix IP-címe** |

A három rendszermezőt a gép **önmagából válaszolja meg** (`TypeScript (Node 22,
natív strip-only), Linux`) — kézzel beírva elavulna, és senki nem venné észre.
A fix IP-cím viszont üzemeltetési döntés és költség: **a rendszer nem tudja
megválaszolni, és nem is szabad tippelnie.**

Ha egy mező „rendszerből válaszolhatónak" van jelölve, de nincs mögötte élő
bizonyíték, az **építési hiba** — mert akkor a beadványba kézzel írt adat
kerülne, amit semmi nem tart karban.

---

## Amit a beadás előtt látni kell

A titoktartási nyilatkozat két állítása **megnevezett kockázat**, nem
formanyomtatvány-szöveg. Ezért állnak a dossziéban, nem egy PDF nyolcadik
bekezdésében.

### „Lejárati határidő nélkül"

> *„A titoktartási kötelezettség lejárati határidő nélkül, a megállapodás
> bármilyen okból történő megszűnésére tekintet nélkül terheli."*

**Ez a rendszer egyetlen olyan kötelezettsége, aminek nincs lejárata.** A
megőrzési idők lejárnak (10. lépés), a mérőeszköz-licencek lejárnak (12.), a
MEES-tanúsítványok lejárnak, a dokumentumfelülvizsgálatok lejárnak (13.) — ez
nem.

### A mentesítés

> *„Gyártó mentesíti a Működtetőt bármilyen […] adatvédelmi követeléssel,
> veszteséggel, kárral vagy felelősséggel szemben"*, és a titoktartás
> megszegése esetén **teljes körű kártérítési kötelezettség** terheli.

A teljes adatvédelmi kockázatot a fejlesztő oldalára telepíti. **Aláírás előtt
kell látni, nem utána.**

### És egy sorrendi következmény

A **referenciaigazolás élő használatot állít**: *„…rendszerét az alábbi típusú
ellátási tevékenységeink kapcsán **jelenleg is használjuk**"*. Egy még nem
használt rendszerre nem adható ki — tehát a **16. lépés (pilot) előbb van,
mint ez az űrlap.**

---

## Ami a repóba nem kerül

A kitöltött űrlapok **személyes adatot** kérnek: születési hely és idő, anyja
neve — az intézményi vezetőé és a megbízotté egyaránt. Sem az üres sablon, sem
a kitöltött példány nem kerül a repóba; a `forrasok/manifest.json` a
lenyomatot és a kimaradás okát őrzi.

A két megbízás **visszavonásig érvényes**, és mindkettő a kibocsátó saját
szabályzata alá tartozik (Tokenkezelési, illetve Tanúsítványkezelési
Szabályzat) — a dosszié ezt megnevezi, mert enélkül nem derülne ki, melyik
szabályzat szerint kell kezelni.

---

## Ami továbbra is nyitva van

- **A hitelesítés.** Ez a rendszer egyetlen igazi blokkolója, és az EESZT
  teszi külső kockázattá.
- **Az ágazati azonosító** a felhasználói profilban — a megfelelési fejezet
  szerint a 4. fázis első feladata; a változóregiszterben ma nincs ilyen mező.
- **14 szervezeti és 1 üzemeltetési mező** — a gép ezekről nem nyilatkozik.
- **A pilot**, ami a referenciaigazolás feltétele.

---

## Futtatás

```
npm run eeszt       # munkalap az üzemeltetésnek: mezőnként, ki tölti ki
npm run validate    # a kapuk és a bizonyíték nélküli mezők
node --test test/eeszt.test.ts   # 19 teszt
```

## Fájlok

| | |
|---|---|
| `registry/eeszt/csatlakozas.json` | 5 űrlap · 18 mező · 5 állítás · 4 kapu |
| `core/eeszt/csatlakozas.ts` | a mezők, a kapuk és a csatlakozhatóság |
| `core/ett/dosszie.ts` | öt új bizonyítékkulcs, közös bázison |
| `tools/gen-eeszt.ts` | a munkalap (`npm run eeszt`) |
| `test/eeszt.test.ts` | 19 teszt |
