# Modul 37 — Karbantartás és szerkesztés

*A modul, ami minden modul fölött áll — és ezért a legveszélyesebb.*

---

## A modul egyetlen szerkezeti kérdése

**Ami itt állítható, az minden más modul viselkedését megváltoztatja — és
visszamenőleg is.**

Egy küszöb átállítása nem csak a jövőt érinti: azt is, hogy a **múltbeli**
eseteket ma hogyan látjuk. Egy mező kódlistájának megnyirbálása a **már
rögzített** értéket teszi értelmezhetetlenné. Ezért ez a modul nem
„beállítások”, hanem az a hely, ahol a legkönnyebb visszafordíthatatlan kárt
okozni.

A tesztjei ezért nem azt bizonyítják, hogy **működik**, hanem hogy **mit nem
enged**.

---

## Két rész

| Rész | Fájl | Mit szerkeszt |
|---|---|---|
| Rendszerparaméterek | `core/karbantartas/parameter.ts` | küszöbök, lejáratok, megjelenítési korlátok |
| Mező- és értékszerkesztés | `core/karbantartas/szerkeszto.ts` | új mező, kódlista bővítése és kivezetése |

---

## A paraméter négy dolgot hordoz

```
HATÁROK       ameddig egyáltalán állítható
KI ÁLLÍTHATJA a rendszergazda nem mindenható
ÉRVÉNYESSÉG   mikortól — a visszamenőleges hatály tilos
INDOK         indoklás nélkül fél év múlva senki nem tudja, miért nem az alapérték áll
```

### Három kör, három felelősség

| Kör | Mit érint | Ki állíthatja |
|---|---|---|
| `megjelenites` | mennyit mutat a felület | rendszergazda |
| `uzemeltetes` | lejáratok, méretkorlátok | rendszergazda |
| **`klinikai`** | küszöb, határérték, besorolás | **klinikus — rendszergazda NEM** |

> **Aki a rendszert üzemelteti, és aki a klinikai határt megállapítja, nem
> ugyanaz a felelősség.** A kettő összevonása pontosan azt a döntést adja a
> legkevésbé illetékesnek, ami a legtöbbet számít. A validálás ezt
> **build-hibának** veszi.

### Minden szám típusú paraméternek van alsó és felső határa

A korlátlan paraméter nem paraméter, hanem nyitva hagyott ajtó: egy elgépelt
nagyságrend némán elronthatja az egész modult. A `jelszo.minHossz` **minimuma
maga 12** — a paraméter nem arra való, hogy a szabályt ki lehessen kapcsolni
vele.

### A klinikai paraméter átállítása elavulttá teszi az aláírást

Ez nem dokumentáció, hanem működés. Az aláíró egy **konkrét értéket**
hitelesített; ha az érték megváltozik, az aláírás egy már nem létező állítást
igazolna.

### A részletező lánc hossza

Az egyik paraméter — `ui.lanc.maxHossz` — azt köti meg, hány lépést nyit meg
egymás után a click-open lánc. Ez eddig **implicit** volt: annyi, amennyi a
`finding.cascade` tömbben állt. Egy tíz lépéses lánc a képernyőn viszont
ugyanolyan rossz, mint a szabad szöveg — a klinikus kikerüli.

**A paraméter a megjelenítést köti, nem az adatot**: a mögöttes mezők attól még
rögzíthetők, csak a további lépések egy gombra nyílnak.

### Amit senki nem állíthat

`ui.nyelvJeloles` = `csendes` — a le nem fordított szöveg jelöletlen
megjelenítése. Ez azt jelentené, hogy a felhasználó nem tudja, mikor lát
fordítatlan szöveget, vagyis a rendszer **csendben helyettesít**, amit minden
más ponton tilt.

A választás azért szerepel a listán, hogy látszódjon: **megfontoltuk, és
elutasítottuk.**

---

## A mezőszerkesztés rétegbe ír, nem a regiszterbe

```
registry/    átnézett, verziókövetett, buildben ellenőrzött
overlay      itt és most létrehozott, ELLENŐRZÖTT, de át nem nézett
```

A regiszter az igazságforrás, és a build ellenőrzi. Egy futásidejű szerkesztő,
ami közvetlenül a regiszterbe ír, ezt a garanciát megszünteti: a mező bekerül,
a `npm run check` viszont csak a következő fejlesztői körben fut le rá — ha
egyáltalán.

**A kettő különbsége látszik**: minden megjelenítésnél megmondható, hogy egy
mező honnan való. Nem bizalmatlanság — ez az a különbség, amitől egy fél év
múlva végzett auditban meg lehet mondani, mit nézett át valaki és mit nem.

### Négy tiltás, mind visszafordíthatatlan kárt előz meg

1. **A regiszterbeli mező nem írható felül futásidőben.** Az átnézett definíció
   átírása azt jelentené, hogy a kód és a valóság elválik: a build ugyanazt a
   mezőt máshogy látná, mint a futó rendszer.

2. **Nem törölhető mező, amire érték van rögzítve.** A törölt mező értéke nem
   tűnik el, csak értelmezhetetlenné válik — és az rosszabb, mint a hiányzó.

3. **Kód nem vehető el a kódlistából, csak kivezethető.** A kivezetett kód új
   rögzítésnél nem választható, a régi olvasható marad. A törlés a **múltbeli**
   rögzítést tenné érvénytelenné.

4. **Aláírt mező módosítása az aláírást elavulttá teszi.** Különben az aláíró
   egy olyan definíciót hitelesített, ami már nincs ott.

### Az új mező nem lehet csonka

| Típus | Mi kötelező | Miért |
|---|---|---|
| `number`, `quantity` | értelmezési tartomány | egy elgépelt nagyságrend (7 → 70) némán bekerülne, és onnantól minden rá épülő számítás hamis |
| `quantity` | mértékegység | az 5,0 mg/dL kreatinin és az 5,0 µmol/L **nem ugyanaz a beteg** |
| `coded` | kódlista | kódolt mező lista nélkül szabad szöveg, más néven |
| mind | magyar címke | a forrásnyelv magyar |

---

## Elfogadási kritérium

`test/karbantartas.test.ts` — 23 teszt. A legfontosabbak:

- a rendszergazda **nem állíthat** klinikai paramétert;
- a **visszamenőleges** hatályú átállítás elutasítva — átírná, hogyan látjuk a
  már meghozott döntéseket;
- a jövőbeli érvényességű állítás **nem hat vissza**;
- a regiszterbeli mező **nem írható felül**;
- a kódlistából **nem lehet elvenni**, csak kivezetni;
- két szerkesztés ugyanarra a mezőre ugyanabban az ezredmásodpercben **külön
  azonosítót** kap — enélkül a második csendben felülírná az elsőt a naplóban.
