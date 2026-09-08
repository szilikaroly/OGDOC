# 15 — A felület fejlesztési terve

*A `docs/fejlesztes/02-web-architektura.md` a rétegekről szól, a `03` a
csontvázról. Ez arról, hogy MILYEN LEGYEN a felület — és miért éppen olyan.*

---

## 0. Az egy mondat, amiből minden következik

> **A projekt legnagyobb kockázata nem technikai: ha a kódolt bevitel lassabb
> a gépelésnél, a klinikus kikerüli.**

Ha ez bekövetkezik, minden strukturált adatra épülő ígéret elvész — a
szűrési esedékesség, a score-ok, a kutatás, a visszamérés. **A felület tehát
nem a rendszer homlokzata, hanem a rendszer feltétele.**

Ebből következik a felület egyetlen mérőszáma:

| | |
|---|---|
| **Nem** azt mérjük | hány kattintás, hány képernyő, hány mező |
| **Hanem** azt | **mennyi idő alatt születik meg a kész lelet**, a szabad szöveges gépeléshez képest |

---

## 1. Hat alapelv

### 1.1 A felület nem ismer mezőnevet

Ez már működik a csontvázban, és a legfontosabb szerkezeti tulajdonság: a
renderer **egyetlen klinikai mezőnevet sem tartalmaz**, mégis renderel
levezetéssel, validációval és lelet-lánccal. Egy új változó felvételéhez nem
kell felületet módosítani.

**Következmény a tervezésre:** minden felületi viselkedés a regiszterből
vezethető le, vagy nem létezik. Ha egy képernyő „különleges", az azt jelenti,
hogy a regiszterből hiányzik valami.

### 1.2 Alapból csukva, a lánc nyílik

A lelet öt állapota (`eltérés nélkül` · `korlátozott` · `nem vizsgálható` ·
`eltérés` · `kimaradt`) közül **csak kettő nyit részletezést**. A normálisat
nem írjuk le.

**A gyorsaság innen jön, nem a képernyőtervből.** Egy húszmezős vizsgálat
tizenkilenc mezője csukva marad; a klinikus arra fordítja az idejét, ami
eltér.

### 1.3 A hiány látszik, nem hallgat

Minden képernyőn ott van, **mi hiányzik és miért számít** — nem hibaüzenetként
a mentésnél, hanem folyamatosan. A score, ami nem számol, megmondja, melyik
mezőre vár, és **egy kattintással odavisz**.

### 1.4 A kapu magyarázata a kapunál van

Ha valami nem indul el (ellenőrizetlen képlet, hiányzó beleegyezés,
kontraindikáció), a magyarázat **ott jelenik meg, ahol a felhasználó áll** — a
mag `why` mondata már meg van írva, emberi nyelven. A felület dolga csak az,
hogy ne nyelje le.

### 1.5 A riasztásnak címzettje van

Riasztást kiadni válaszút nélkül rosszabb, mint nem riasztani. **Minden
riasztás mutatja: kinek szól, meddig kell átvenni, és mi történik, ha nem
veszik át.** A `core/log/` és a szepszismotor szerkezete ezt már hordozza.

### 1.6 Egy képernyő, egy kérdés

A forrásrendszer legtanulságosabb hibája nem a mezők száma volt, hanem hogy
**egy képernyő egyszerre kérdezett anamnézist, mérést, számítást és
adminisztrációt**. A mi bontásunk a klinikai gondolatmenetet követi, nem az
adatbázistáblákat.

---

## 2. Amit a forrásrendszer tanított — 1502 mező tapasztalata

A felülettérkép nemcsak leltár volt: **tervezési tanulságok listája.** A hét
legfontosabb, mindegyik konkrét felületi következménnyel:

| Amit ott láttunk | Amit nálunk jelent |
|---|---|
| **„Megrendelve" és „Eredmény" külön jelölőnégyzet** | a **kintlévőség önálló nézet**: mit rendeltünk, mi jött vissza, mi késik |
| **„Sikertelen, mert…"** öt helyen | a beavatkozásnak **harmadik állapota** van, és a felület felkínálja |
| **Egy pipa, ami három vizsgálatról állít** | tiltott: egy jelölőnégyzet **egy** állítás |
| **Kézzel beírt végösszeg** a bejelölt pontok mellett | a pontszám **kiírva, de nem szerkeszthető** |
| **„Testsúly st/lbs" ÉS „Testsúly kg"** | egy mező, a **megjelenítés vált** egységet |
| **A ciklusnap egy másik lapon** | a mérési körülmény **a mérés mellett** kérdezendő |
| **Beleégetett küszöb a képernyőn** („20–25 között") | a referencia **adatból jön**, és a forrása látszik |

---

## 3. Öt képernyőtípus, nem huszonhat

A huszonhat modul **nem huszonhatféle felületet** kíván. Öt típus fedi le, és
mind az öt a regiszterből generálódik:

### 3.1 Lelet-képernyő (`finding`)

A leggyakoribb. Szervrendszerenként egy sor, alapból csukva; eltérésnél nyílik
a lánc. Ez viszi a státuszt, az ultrahangot, a fizikális vizsgálatot.

**Kulcselem:** a sor végén ott az öt állapot, egy kattintással — és a
„nem vizsgálható" **nem ugyanaz a gomb**, mint az „eltérés nélkül".

### 3.2 Idősor-képernyő (`series`)

Vitálisok, vajúdás, laborérték-trend. Egy időtengely, több sáv, és a
**referenciatartomány a háttérben** — nem külön oszlopban.

**Kulcselem:** a vajúdásnál az anyai és a magzati sáv **ugyanazon a
tengelyen**; a kettő eltérése ott látszik, ahol keletkezik.

### 3.3 Példány-képernyő (`scoped`)

Panaszok, gócok, magzatok, oldalak, minták. Egy sablon, több példány — a
`scopedBy` dimenzió felületi megfelelője.

**Kulcselem:** a példány megnevezése **mindig látszik** („a jobb alhasi
fájdalom erőssége", nem „erősség").

### 3.4 Számítás-képernyő (`calc`)

Score-ok és kockázati modellek. A szám mellett **mindig ott a forrás, a
bemenetek és ami hiányzik**.

**Kulcselem:** a klinikus benyomása **a modell mellett**, saját mezőben — ez
a rendszer négyszer visszatérő elve, és itt válik láthatóvá.

### 3.5 Munkalista-képernyő (`queue`)

Kintlévő leletek, átnézésre váró import, ki nem vett riasztás, beragadt kimenő
üzenet. **Négy különböző sor, egy szerkezet.**

**Kulcselem:** minden tételnek van **kora**, és a kor önmagában rangsorol.

---

## 4. A sebesség terve

A mag mérve gyors (billentyűleütésenként 0,001 ms). A felület kockázata nem a
számítás, hanem a **beviteli út hossza**. Négy eszköz, sorrendben:

1. **Előtöltés a korábbiból**, javaslatként — a `suggestPrefills()` már ezt
   adja. A javaslat **nem tény**: külön jelöléssel, egy kattintással
   elfogadva.
2. **A leggyakoribb hét mező egy képernyőn**, felhasználónként rendezve. A
   sorrend testre szabható; **a lelet szerkezete nem**.
3. **Billentyűzetes navigáció végig.** Egérrel is működik, de aki gyorsan
   dolgozik, nem nyúl egérhez.
4. **Diktálás a szabad szöveges maradékra** — és a diktált szövegből
   **javaslat** a strukturált mezőkre, nem automatikus kitöltés.

### Mérés, nem érzés

A felületnek **mérnie kell magát**: mennyi idő telt a képernyő megnyitása és a
lelet lezárása között, mezőnként hány javítás történt, hol hagyják abba.
Ezekből derül ki, hol lassabb a gépelésnél — nem megkérdezésből.

---

## 5. Amit a felület soha nem dönthet el

Ez a lista rövid, és **nem bővíthető** fejlesztői kényelemből:

- **nem választ kódot**, ha több érvényes alak van (a BNO 4→5 karakter);
- **nem vált mértékegységet** találgatásból;
- **nem tölt ki hiányzó adatot** alapértelmezéssel;
- **nem írja felül a beteg válaszát** kérdőívben;
- **nem nyit ki kaput** azzal, hogy elrejti a figyelmeztetést;
- **nem nyugtáz mentést**, amíg az írás nem tartós.

Mindegyik mögött ott a mag ellenőrzése — a felület ezeket **nem tudja**
megkerülni, mert a döntés nem nála van. Ez a szerkezet védi a szabályt akkor
is, amikor a határidő szorít.

---

## 6. Hozzáférhetőség és a valódi üzemi körülmények

Nem általános akadálymentesítési lista, hanem az, ami **ezen az osztályon**
számít:

| Körülmény | Következmény |
|---|---|
| kesztyűs kéz, érintőképernyő | nagy célfelületek, nincs precíziós húzás |
| szülőszobai félhomály | sötét mód **valódi kontraszttal**, nem elhalványítva |
| a klinikus áll, a beteg mellett | a kritikus adat **felül**, görgetés nélkül |
| zajos környezet | a riasztás **nem hangra** épül egyedül |
| kétkezes beavatkozás közben | hangbevitel, kéz nélküli megerősítés |
| ügyeleti fáradtság | **a veszélyes művelet ne egy kattintás** legyen |

Az utolsó a legfontosabb, és a legritkábban tervezett: hajnali négykor a
figyelem nem ugyanaz, és a felület ezt nem hagyhatja figyelmen kívül.

---

## 7. Az út a mai csontváztól

| Szakasz | Mi történik | Mikor kész |
|---|---|---|
| **most** | csontváz: regiszterből renderel, memóriában dolgozik | kész |
| **1.** | a tároló bekötése — perzisztencia, jogosultság, auditnapló | a 18 lépés 1. lépése |
| **2.** | az öt képernyőtípus kidolgozása, generálva | az anamnézis-gerinc után |
| **3.** | munkalisták (kintlévőség, import, riasztás, kimenő sor) | az interfészek után |
| **4.** | sebességmérés és a bevitel finomhangolása | a pilot előtt |
| **5.** | pilot egy osztályon, valódi adattal | a 18 lépés 16. lépése |

**A 2. szakasz a leghosszabb, és a legkevésbé látványos**: az öt típus
generátorát megírni több munka, mint huszonhat képernyőt lerajzolni — de
huszonhat képernyő huszonhatszor avul el.

---

## 8. Amit ez a terv nem tartalmaz

- **Konkrét képernyőterveket.** Azok a regiszterből és az öt típusból
  következnek; egy előre lerajzolt képernyő ellentmondana az 1.1 elvnek.
- **Keretrendszer-választást.** A mag DOM-mentes, a felület cserélhető — ez
  szándékos, és a döntést nem sietjük el.
- **A mobil változatot.** Előbb az kell, hogy az asztali gyorsabb legyen a
  gépelésnél.

---

## Négy mondat

1. **A felület a rendszer feltétele**, nem a homlokzata: ha lassabb a
   gépelésnél, minden más ígéret elvész.
2. **Öt képernyőtípus fedi le a huszonhat modult**, és mind az öt a
   regiszterből generálódik.
3. **A felület soha nem dönt** kód, egység, hiány és kapu kérdésében — nem
   azért, mert nem szabad neki, hanem mert a döntés nem nála van.
4. **A felületnek mérnie kell magát**: hol lassabb a gépelésnél — ez nem
   megkérdezhető, csak mérhető.
