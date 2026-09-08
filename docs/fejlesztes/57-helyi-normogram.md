# 57 — A helyi normogramok

*A 18. lépés gépi fele. A rendszer önmagára záródása — a projekt értelme és a
legnagyobb kockázata ugyanaz a mondat.*

---

## A cél

*Mihez képest mérünk **mi, itt**?* Idegen populáción tanított görbe idegen
választ ad. A hibrid nézet mind a hármat egyszerre mutatja, és nem választ
helyettünk:

| Fajta | Milyen kérdésre felel |
|---|---|
| `published` | mihez képest **szokás** mérni? |
| `local` | mihez képest mérünk **mi, itt**? |
| `customised` | mihez képest **ez a magzat**? |

Ha a populációs szerint a 8. percentilis, a személyre szabott szerint a 25., az
más beszélgetés, mint ha mindkettő a 3. alatt van.

## A kockázat

Egy helyi görbe azt írja le, amit **mi** mértünk. Ha az osztály ultrahangja vagy
mérési technikája rendszeresen néhány százalékkal nagyobbat mér, a helyi görbe
ezt a torzítást **„normális”-ként** rögzíti — és onnantól minden mérés hozzá
képest szép.

És itt zárul be a kör rosszul: a **17. lépés audit-hurka**, ha a helyi görbéhez
mérnénk, **tökéletes egyezést** találna. A rendszer önmagával egyezne, és éppen
ezt hívná bizonyítéknak.

Ezért a helyi görbe önmagában nem elég. A publikálthoz képesti **rendszeres
eltolást** ki kell mondani, és meg kell nevezni, hogy valódi populációs
különbség-e vagy mérési torzítás.

---

## Amit ez a lépés talált

**A sávkapu egy sávval elcsúszott.**

A `minPerBin` kapuja megvolt és működött — csak nem ott, ahol kellett. A
kiértékelés a **legközelebbi** sáv elemszámát nézte (`binCount`), az érték
viszont a két **szomszédos** sor **között** interpolálódik (`atX`).

A demótáblában a 23. sáv nyolcvan esetes, a 24. húsz, a deklarált minimum ötven:

| Gesztációs kor | 23. sáv súlya | 24. sáv súlya | Régi kapu | Új kapu |
|---|---|---|---|---|
| 23,0 | 100% | 0% | átengedi | átengedi |
| 23,4 | 60% | 40% | **átengedi** | blokkol |
| 23,5 | 50% | 50% | **átengedi** | blokkol |
| 23,6 | 40% | 60% | blokkol | blokkol |

Egy 23,5 hetes mérés fele-fele arányban épült a két sávból, mégis átment — mert
a legközelebbi sáv a 23. lett (`d < bestDist`, szigorú összehasonlítással). És a
visszaadott `n: 80` azt állította, hogy nyolcvan eset áll mögötte.

**A ritka sáv nem a közepén kezd rontani, hanem ott, ahol súlyt kap.** A javítás
mindkét befogó sávot nézi, és a **kisebbik** esetszámot adja vissza — az az
esetszám, amire az eredmény valóban támaszkodik.

### És a demótáblában eddig ez nem tűnt fel

`ng.local.us-ac`: **hat sáv** (x = 20, 24, 28, 32, 36, 40) áll húsz eseten, a
tábla saját maga deklarálta ötvenes minimum mellett. A validálás ezentúl
felsorolja őket.

---

## A második, ami eddig nem látszott

**A demó helyi görbéje rendszeresen eltolt a publikálthoz képest.**

Mind a **hat** közös sáv ugyanabba az irányba tér el, átlagosan **−0,34
szórásnyit** a Chitty-táblához képest. Ez lehet valódi populációs különbség — és
lehet mérési torzítás.

Az `elteres()` ezért:

- az eltolást a **publikált tábla szórásában** méri, nem milliméterben (3 mm a
  20. héten sokkal többet jelent, mint a 40.-en);
- a **rendszerességet** nézi, nem a nagyságot: egy nagy, de szórt eltérés
  populációs különbség lehet, egy kicsi, de **minden sávban azonos irányú**
  eltolás mérési torzításra utal — és éppen az utóbbi épül be láthatatlanul;
- az össze nem vetett görbét **nem** „egyezőnek”, hanem `nemOsszevetheto`-nek
  mondja: az összevetés maradt el, nem az eltérés hiányzik.

Ha nincs publikált tábla ugyanarra a paraméterre, az **külön figyelmeztetés** —
egy össze nem mérhető helyi görbe ellenőrizetlen, nem jó.

---

## A generálás

`generalHelyi()` sávokra bontja a saját méréseket, és:

- **kihagyja** a minimum alatti sávot — nem azért, mert kevés adat rossz adat,
  hanem mert egy két esetből számolt szórás bármit mond, és az abból született
  percentilis szám formájában közli a semmit;
- **mintaszórással** számol (n−1 nevezővel). A populációs képlet rendszeresen
  kisebb szórást adna, a percentilisek szélsőségesebbek lennének — pont abba az
  irányba, ami riasztáshoz vezet;
- **kiírja**, mely sávok maradtak ki és hány esettel;
- **nem használhatónak** mondja a táblát két elfogadott sáv alatt: nincs mit
  interpolálni.

---

## Ahol a generált tábla áll

**Nem a repóban.** A helyi tábla valódi betegadatból áll elő: minden sora egy
sáv átlaga és szórása, a `countByX` pedig azt is elárulja, hány esetet láttunk
el az adott héten. Ez intézményi adat, nem publikálható standard — a generált
táblák helye `registry/normogramok/helyi/`, ami **gitignore-olt**, ugyanaz a
szerkezet, mint a SNOMED-származéknál és a GPLv2-derivált kalkulátornál.

A repóban álló `helyi-us-ac.json` **szintetikus demó**, és a forrása ezt ki is
mondja.

---

## Ami emberre vár

- **A rendszeres eltolás megítélése** minden helyi görbénél, aláírva: populációs
  különbség vagy mérési torzítás. Gép ezt nem dönti el.
- **A sávminimum megválasztása.** A demó 50-et deklarál; hogy mennyi az elég,
  populációfüggő döntés.
- **A kizárási szabályok** minden görbéhez — kizárás nélkül a helyi tábla a
  *betegek* populációját írja le, nem a normálisat, és onnantól a növekedési
  elmaradás lesz a mérce.
- **És maguk a mérések:** azok a 16. lépésből jönnének, ami nem indulhat el.

---

## Ami elkészült

| | |
|---|---|
| `core/us/helyi.ts` | sávállás, eltolásvizsgálat, generálás, validálás |
| `core/us/normogram.ts` | a `binCount` mindkét befogó sávot nézi, és a kisebbiket adja |
| `.gitignore` | `registry/normogramok/helyi/` — a generált tábla nem kerül a repóba |
| `tools/gen-helyi.ts` | `npm run helyi` → [`../megfeleles/17-helyi-normogram.md`](../megfeleles/17-helyi-normogram.md) |
| `test/helyi.test.ts` + `test/normogram.test.ts` | 18 + 2 teszt |

Munkalap: [`../megfeleles/17-helyi-normogram.md`](../megfeleles/17-helyi-normogram.md).
