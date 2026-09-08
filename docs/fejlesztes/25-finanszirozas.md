# 25 — Finanszírozási kódajánlás: teljes kódolás, nem felülkódolás

> Ez a fejezet a hivatalos törzsek beolvasásáról szól, és arról az egyetlen
> szabályról, amin az egész réteg áll: **a rangsor elrendez, nem választ.**

## 1. A különbség, amit a réteg szerkezete kényszerít ki

| | Mi ez | Támogatja a rendszer? |
|---|---|:--:|
| **Teljes kódolás** | ami megtörtént és dokumentálva van, az kerüljön be a jelentésbe | **igen** |
| **Felülkódolás** | olyan kód jelentése, aminek nincs alapja a rögzített adatban | **nem** |

A bevétel java nem attól vész el, hogy valaki keveset kér, hanem attól, hogy
egy elvégzett beavatkozás nem kerül a jelentésbe, vagy **elakad egy formai
szabályon**. A réteg ezt célozza.

A megkülönböztetés nem jószándék kérdése, hanem a hívási sorrendé:

```ts
rankByValue(reg, rules, state, { points: { "O14.2": 100000 } }).ranked
// []   — bizonyíték nélkül a kód akkor sem kerül fel, ha többet érne
```

A rangsorolás **kizárólag sorrendet ad** azoknak a kódoknak, amelyek **már
átmentek a bizonyíték-kapun** ([24.](24-kodolas.md)). Ami nem következik a
rögzített adatból, az a listára nem kerül fel.

És ahol a jogszabály maga mondja meg a választást, ott a rendszer a
jogszabályt követi, nem az érdeket:

> **9/2012. (II. 28.) NEFMI rendelet 5. § (7):** „Az egyidejűleg nem
> elszámolható önálló egészségügyi eljárások esetén a kizárásos kapcsolatban
> álló egészségügyi eljárások közül a **magasabb pontszámú** egészségügyi
> eljárás számolható el."

## 2. Mi töltődött be — hivatalos forrásból

| Tábla | Sor | Forrás |
|---|---:|---|
| `tbl.bno` | 11 959 | BNO-10 magyar törzs (BNOX 3.4) |
| `tbl.oeno` | 3 410 | 9/2012. NEFMI — kompetencia, szabályok és **törzslista pontértékkel** |
| `tbl.hbcs` | 780 | HBCS 5.0 törzs, érvényes 2026.04.01. |
| `tbl.fno` | 744 | FNO (ICF) törzs |
| `tbl.oeno.egyutt` | 418 | 5. melléklet |
| `tbl.oeno.tele` | 126 | 6. melléklet — telemedicinában elszámolható |
| `tbl.oeno.bno` | 23 | 4. melléklet — BNO mellett elszámolható eljárások |

Az OENO-törzs nem csak kódlista: **3 302 eljárásnál pontérték**, **758-nál
kizárási lista**, **1 034-nél ismétlési korlát**, **3 300-nál szakmai
kompetencia**. A HBCS-törzs a súlyszámot, a műtéti súlyszámot és mindhárom
határnapot hozza.

Két részlet, amit a törzs szerkezete mond meg, és amit önállóan nem lehetne
kitalálni:

- **a BNO-kódok PONT NÉLKÜL** szerepelnek (`O141`, nem `O14.1`), és a `jel`
  mező jelöli a **kereszt-csillag párokat**: a `+` az alapbetegség, a `*` a
  megnyilvánulás kódja, és a kettő párban jelentendő;
- **az FNO-nál a súlyossági fokozat a KÓD RÉSZE**: a `b1100` „nincs
  probléma", a `b1103` „súlyos probléma" — ugyanarra a funkcióra. Az utolsó
  jegy nem alkategória, hanem **mérték**, és összevonva értelmetlen.

A forrásfájlok **nem kerülnek a repóba** — hivatalos, nyilvános, rendszeresen
frissülő törzsek. A repó a belőlük **származtatott** táblát tartalmazza, és a
`registry/kodok/manifest.json` rögzíti a forrás nevét, méretét, **SHA-256
lenyomatát** és a kinyerés dátumát. Enélkül egy retrospektív elszámolás nem
reprodukálható: nem derülne ki, melyik kiadásból dolgozott a rendszer.

```
tools/ingest/torzs_ingest.py --src <könyvtár>
```

### Ami a törzsből kimaradt, szándékosan

A 9 jegyű finanszírozási törzs **orvosneveket** is tartalmaz. A kódajánláshoz
nem kellenek, ezért az ingest nem viszi tovább őket: nyilvános törzsből
származó személyes adat fölösleges másolása. Az eszköz- és
diagnosztikai-anyag árjegyzék (24 062 + 4 178 tétel) a **költségoldalé**, nem a
kódajánlásé — az ingest előállítja, a repó nem tárolja.

## 3. Az elmaradt bevétel két gyakori oka — előre

```ts
checkOeno(reg, state, "13590", "01")     // amnioscopia belgyógyászaton
// status: "wrongSpecialty"
// "A 01 szakmakód NINCS a 13590 eljárás elszámolási kompetenciái közt (04…).
//  A jelentés ezen a szakmán elakadna — ez ELMARADT BEVÉTEL, nem kódolási hiba."

checkOeno(reg, state, "46040", "04")     // I. trimeszteri vizit, magas kockázat
// status: "missingDiagnosis"
// "…KIZÁRÓLAG a következő BNO-kódok mellett számolható el: Z3590. Ezek egyike
//  sincs rögzítve. Ha a diagnózis fennáll, RÖGZÍTENI KELL — enélkül az
//  elvégzett vizsgálat elszámolása elakad."
```

Mindkettő **dokumentációs hiány**, nem kódválasztási kérdés — és a javítás
iránya is ez: rögzíteni, ami fennáll, nem másik kódot keresni.

## 4. A kizárásos ütközés: a jogszabály dönt

```ts
planOeno(reg, state, ["11041", "11042"], { specialty: "04" })
// conflicts[0].keep === "11042"
// "Kizárásos kapcsolat. A 9/2012. NEFMI rendelet 5. § (7) szerint a MAGASABB
//  PONTSZÁMÚ eljárás számolható el: 11042 (878 pont) a 11041 (750 pont)
//  helyett."
```

A pontérték a **betöltött törzsből** jön, nem a hívótól: alapértelmezésben a
törzs dönt, és a hívó csak akkor írja felül, ha másik érvényességi időszak
tábláját használja. Így a szabály nem attól függ, ki hívja meg.

Amíg a pontérték hiányzott, a rendszer az ütközést kimutatta, de nem
választott. Ez nem elvi engedmény volt, hanem a hiányzó adat következménye — és
pontosan ezért kellett a törzslista.

## 5. HBCS: súlyszám igen, besorolás nem

```ts
hbcsValue("673A", 1)
// { label: "Hüvelyi szülés", sulyszam: 0.83033, alsoHatarnap: 3,
//   losEffect: "belowLower",
//   why: "…az ALSÓ HATÁRNAP (3) alatt van: a csoport teljes súlyszáma
//         ilyenkor nem számolható el. Ha az ellátás valóban rövidebb volt,
//         ez nem hiba — a jelentés akkor is így helyes." }
```

A súlyszámtábla teljes; a **besoroló algoritmus** nincs meg. A `rankHbcs()`
ezért nem választ csoportot: arra jó, hogy a kódoló lássa, **mekkora a tétje**
annak a kérdésnek, amit neki kell eldöntenie — nem arra, hogy a nagyobb
súlyszámút válassza.

A szülészeti csoportok különbsége önmagában is beszédes: hüvelyi szülés
0,83033 · epidurális érzéstelenítéssel 0,9269 · császármetszés 1,74947 ·
ugyanezek „patológiás várandósság után" 4,25–5,45. **Ez a különbség pontosan
az, amit dokumentálni kell — nem az, amit választani.**

## 6. Ami hiányzik, az nevesítve hiányzik

| Törzs | Mi kellene hozzá |
|---|---|
| OENO **fekvőbeteg**-törzs | NEAK fekvőbeteg OENO-törzs |
| HBCS besoroló algoritmus | a hatályos besorolási szabálykönyv |
| SNOMED **magyar megnevezések** | validált fordítás a SNOMED-eljárás szerint |

A megmaradt tételek külön magyarázatot kívánnak.

**Két különböző OENO van**, és ez a leggyakoribb félreértés. A
**járóbeteg**-OENO ötjegyű numerikus kód (`13590` = Amnioscopia); a
**fekvőbeteg**-OENO ICD-9-CM eredetű, pontos alakú (`74.10` = császármetszés).
A kettő **nem ugyanaz a lista, és nem konvertálható egymásba** — a 11. modul
beavatkozásain szereplő kódok az utóbbiból valók, és a betöltött
járóbeteg-törzzsel nem ellenőrizhetők.

**A SNOMED CT licence nem tiltás, hanem feltétel** — és a feltételek a kód
szerkezetébe kerültek. Részletesen a 8. pontban.

Ez a hat sor a **lefedettségi doksiban is megjelenik**, minden generáláskor
újra — ami nem látszik, azzal senki nem foglalkozik.

## 7. SNOMED CT: a licenc mint szerkezet

A **Global Patient Set** (378 553 aktív fogalom, 2026-01-01) **CC BY-ND 4.0**
alatt jelenik meg. Két következménye van, és a második a kevésbé nyilvánvaló.

**Attribution.** A forrásmegjelölés kötelező mindenhol, ahol SNOMED-megnevezés
megjelenik — nem a dokumentációban, hanem a **kimeneten**. A `snomedTerm()`
ezért a `notice`-t akkor is visszaadja, ha megnevezést nem tud:

```ts
snomedTerm("46764007")          // törzs nélkül
// { term: null, notice: "© International Health Terminology Standards…",
//   why: "…AZ AZONOSÍTÓ ATTÓL MÉG ÉRVÉNYES: rögzíthető, exportálható, és a
//         fogadó rendszer feloldja." }
```

**NoDerivatives.** Másolni és **változatlanul** továbbadni szabad; az
**átalakított** változat terjesztése nem. A mi JSON-táblánk átalakítás — ezért
a törzs a `registry/kodok/helyi/` könyvtárba települ, ami a `.gitignore`-ban
van, és **soha nem kerül a repóba**. A határ, amit ez húz:

| | Repóban? |
|---|:--:|
| SNOMED **azonosító** kereszthivatkozásként (mint a LOINC) | igen |
| SNOMED **fogalomkészlet** (megnevezésekkel) | **nem** |

Ez nem stílusszabály: a validátor **build-hibát** ad, ha SNOMED-tábla a
terjesztett `tablak/` könyvtárba kerülne.

### A harmadik korlát nyelvi, nem jogi

A GPS megnevezései **angolul** vannak. A magyar megnevezés nem fordítás
kérdése, hanem **folyamaté**: a SNOMED International fordítási irányelve
validált eljárást ír elő. A rendszer ezért `hu` kérésre is az **angol**
megnevezést adja — megjelölve, hogy az angol. Egy rögtönzött magyar alak nem
SNOMED, és a vele gyűjtött adat nem összehasonlítható. Ugyanaz a kapu, mint a
validált kérdőívek fordításánál ([23.](23-prom.md)).

### Azonosítót emlékezetből nem írunk be

Tizenöt kódszabály kapott SNOMED-azonosítót, mindegyik a **betöltött
kiadásból visszakeresve**, és mindegyik mellett ott a `snomedVerified`
kiadásbélyeg. A validátor build-hibát ad az ellenőrzési bélyeg nélküli
azonosítóra — a törzs nem terjeszthető, tehát **a CI nem tudja utánanézni**,
és ilyenkor a bélyeg az egyetlen, ami az ellenőrzést bizonyítja.

Ez nem elméleti óvatosság. A HELLP-szindróma azonosítóját elsőre emlékezetből
írtam volna be — a betöltött kiadásban az a szám **egy szemnyomás-fogalomé**.
A HELLP a GPS-ben nincs benne, és a szabály ezért **azonosító nélkül** maradt,
kimondva:

> „A GPS a teljes SNOMED CT **részhalmaza** — a hiány nem jelenti azt, hogy a
> fogalom nem létezik, csak azt, hogy ebben a kiadásban nincs benne.
> Azonosítót emlékezetből NEM írunk be."

## 8. Amit a hivatalos törzs kijavított

A kézzel felvett, 32 kódos szülészeti részhalmaz helyére a teljes magyar BNO
került — és a csere **két hibát is kimutatott** a kódszabályokban:

- **A gátrepedés kódjai el voltak csúszva.** A hivatalos magyar törzsben az
  **O702 a harmadfokú** és az **O703 a negyedfokú** gátrepedés; a kézi
  részhalmaz O70.3-at használt harmadfokúra. Egy elcsúszott kód a
  minőségi mutatókban (OASIS-arány) közvetlenül hamis számot ad.
- **A HELLP-szindrómának NINCS önálló kódja** ebben a BNO-kiadásban: a súlyos
  praeeclampsia (`O141`) kódjára esik. A rendszer ezért kimondja, hogy a
  szindróma ténye **a kódból nem derül ki**, és a diagnózis szövegében kell
  rögzíteni — különben az esetek visszakeresése lehetetlen.

Ez a törzsbetöltés valódi haszna: nem az, hogy több kódot ismerünk, hanem hogy
a meglévő szabályok szembesültek a hivatalos listával.

## 9. Tesztek

[`test/finanszirozas.test.ts`](../../test/finanszirozas.test.ts) — 36 teszt:

- a betöltött törzsek valódiak (673A = Hüvelyi szülés, 13590 = Amnioscopia);
- a rossz szakma és a hiányzó kötelező diagnózis **előre** kiderül;
- a kizárásos ütközést a törzs pontértékei alapján oldja fel (5. § (7));
- a BNO-nak nincs önálló pontértéke — a súly a HBCS-csoportból jön;
- a határnapok elszámolási következménye kimondva;
- **a rangsorba csak bizonyítékkal alátámasztott kód kerül** — és egy
  100 000 pontos kód sem kerül fel bizonyíték nélkül;
- a SNOMED-tábla soha nem kerülhet a terjesztett könyvtárba;
- a forrásmegjelölés akkor is ott van, ha megnevezés nincs;
- ami nincs a GPS-ben, ott a rendszer nem talál ki azonosítót.
