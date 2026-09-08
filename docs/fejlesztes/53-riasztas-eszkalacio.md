# 53 — A riasztások címzettje és az eszkalációs rend

*A 15. lépés gépi fele. Az egyetlen kapu a rendszerben, ami megfordul.*

---

## Miért ez a lépés nyit kaput

A lépéslista kimondja: **a 9. lépés (szepszisküszöbök) kapuja addig nem
nyílik ki, amíg ez nincs meg.** A szepszisréteg készen áll, aláírásra vár — de
riasztást adni válaszút nélkül rosszabb, mint nem riasztani.

> A válaszút nélküli riasztás **rosszabb a semminél**. Aki naponta háromszor
> kap figyelmeztetést, amire nincs kihez fordulnia, két hét alatt megtanulja
> elkattintani — és akkor **az igazit is elkattintja**.

---

## Amit ez a lépés talált

### A próza megígérte az eszkalációt, a szerkezet nem tudta hordozni

A szepsziscsomag `alertStatus()` függvénye a ki nem vett riasztásról ezt
mondta:

> *„…magának is riasztást kell kiváltania, **egy szinttel feljebb**. Enélkül a
> rendszer azt hiszi, hogy szólt."*

A típusban viszont **nem volt semmi, ami megmondaná, mi van feljebb**:

```ts
escalation: { label: I18n; note?: I18n; acknowledgeWithinMinutes: number };
```

Egy címke, egy megjegyzés, egy percszám. A függvény kiszámolta, hogy a
határidő letelt, visszaadott egy állapotot és egy mondatot — **és a mondaton
kívül semmi nem történt**, mert nem volt hová eszkalálni.

Ugyanaz a család, mint a 7–13. lépés leletei, azzal a különbséggel, hogy itt a
következmény nem téves szám, hanem **egy riasztás, amit senki nem vesz át, és
amiről a rendszer azt hiszi, hogy szólt**.

### A felület: 324 riasztási pont, 0 címzett

| Honnan | Darab |
|---|---:|
| változóregiszter — `redflag` jelölésű kódolt válasz | **283** |
| kalkulátorsávok — `redflag` súlyosságú eredménysáv | 15 |
| panaszszótár — vörös zászlós panasztétel | 24 |
| kérdőívek — kritikus tétel (az összpontszámtól függetlenül szól) | 2 |
| **Összesen** | **324** |

**Ha mind a 324 külön címzettet kapna, a rend használhatatlan lenne; ha egy
sem kap, a rendszer néma marad.** A címzett ezért a **típushoz** tartozik —
abból **nyolc** van, nem 324.

---

## A kapu, ami megfordul

A rendszer minden más kapuja azt akadályozza meg, hogy **rossz szám**
jelenjen meg: hitelesítetlen laborreferencia, aláíratlan normogram,
ellenőrizetlen megőrzési idő.

Itt a kapu **fordítva áll**: a hiányzó címzett azt akadályozza meg, hogy a
rendszer **egyáltalán megszólaljon** — mert a címzett nélküli riasztás nem
féltájékoztatás, hanem **kiképzés az elkattintásra**.

```
0/8 riasztástípus kiadható · 8 címzett nélkül · azonnali: 0/6
```

---

## A lánc három szabálya

**1. A címzett megnevezett szerepkör, nem „az ügyelet".** Ami nincs a rend
`szerepek` mezőjében, az építési hiba. Egy „majd valaki" nem címzett.

**2. A címzettnek elérhetősége van.** Akit nem lehet elérni, az csak papíron
létezik — és az ilyen lánc pontosan úgy viselkedik, mintha nem is lenne.

**3. A lánc véget ér.** Pontosan **egy** szint van utolsónak jelölve, és az a
**legmagasabb**. Ha nincs, a ki nem vett riasztás **örökké vándorol**, és senki
nem felelős érte.

---

## Az öt állapot — és a negyedik, amit ki kell mondani

| Állapot | Mit jelent |
|---|---|
| `nemAdhatoKi` | nincs címzett — a riasztás meg sem szólal |
| `kiadva` | az 1. szint átvételére vár |
| `atveve` | átvették — és rögzül, **melyik szinten** |
| `eszkalalt` | a határidő letelt, a lánc **magától** feljebb lépett |
| **`kimerult`** | **a legfelső szint sem vette át** |

A `kimerult` a legkellemetlenebb, és épp ezért kell kimondani: a rendszer
ilyenkor **nem tehet többet — és nem szabad úgy tennie, mintha szólt volna.**

Az eszkaláció **idő szerint, magától** történik: nem kell külön megnyomni.
Egy 10 / 15 / 20 perces láncnál a 20. percben már a 2. szint a felelős, a 40.
percben a 3., a 45. után a riasztás kimerült.

---

## Ami ebből a szepszisrétegbe megy

A protokoll `escalation.tipus` mezője mostantól a `riaszt.szepszis` láncra
mutat, és az `alertStatus()` — ha kap láncot — **megnevezi, ki a felelős
most**, a hányadik szinten, és mennyi ideje. Lánc nélkül a régi, prózai válasz
jön, ami maga is kimondja a hiányt.

---

## Ami továbbra is nyitva van

**Mind a nyolc lánc.** A `registry/riasztas/eszkalacio.json` szándékosan üres:
a kód készen áll, de azt, hogy **kinek szól** és **ki a következő szint**,
csak a szervezet tudja megmondani. Ki: **szülészeti osztályvezető**.

A nyolc hiány **figyelmeztetés, nem építési hiba** — megnevezett adósság. De a
kapu közben zárva van, és ez a helyes irány.

---

## Futtatás

```
npm run riasztas    # munkalap az osztályvezetőnek: a nyolc lánc kitöltendő
npm run validate    # a címzett nélküli típusok és a lezáratlan láncok
node --test test/riasztas.test.ts   # 17 teszt
```

## Fájlok

| | |
|---|---|
| `registry/riasztas/eszkalacio.json` | 8 riasztástípus, üres láncokkal |
| `core/riasztas/eszkalacio.ts` | a lánc, az öt állapot, a kapu |
| `core/riasztas/leltar.ts` | a riasztási felület leltára (324 pont) |
| `core/szepszis/bundle.ts` | az `alertStatus()` mostantól a láncot használja |
| `tools/gen-riasztas.ts` | a munkalap (`npm run riasztas`) |
| `test/riasztas.test.ts` | 17 teszt |
