# Munkalap — a helyi normogramok

*Generált: `npm run helyi`. 1 helyi tábla, 21 sáv (6 a saját minimuma alatt) · 1/1 rendszeresen eltolt a publikálthoz képest.*

## A projekt értelme egyetlen mondatban — és a kockázata a másodikban

*Mihez képest mérünk **mi, itt**?* Idegen populáción tanított görbe idegen
választ ad; a saját adatokból generált a sajátot. A hibrid nézet mind a hármat
egyszerre mutatja, és a klinikai döntés az **eltérésükből** is születhet.

De a rendszer önmagára záródása nem csak a cél — a **kockázat** is. Egy helyi
görbe azt írja le, amit **mi** mértünk. Ha az osztály ultrahangja vagy mérési
technikája rendszeresen nagyobbat mér, a helyi görbe ezt a torzítást
**„normális”-ként** rögzíti — és onnantól minden mérés hozzá képest szép. A
17. lépés audit-hurka pedig, ha a helyi görbéhez mérnénk, **tökéletes
egyezést** találna: a rendszer önmagával egyezne, és éppen ezt hívná
bizonyítéknak.

## 1. Amit ez a lépés talált

**A sávkapu egy sávval elcsúszott.**

A `minPerBin` kapuja megvolt és működött — csak nem ott, ahol kellett. A
kiértékelés a **legközelebbi** sáv elemszámát nézte, az érték viszont a két
**szomszédos** sor **között** interpolálódik:

| Gesztációs kor | 23. sáv súlya | 24. sáv súlya | Régi kapu | Új kapu |
|---|---|---|---|---|
| 23,0 | 100% | 0% | átengedi | átengedi |
| 23,4 | 60% | 40% | **átengedi** | blokkol |
| 23,5 | 50% | 50% | **átengedi** | blokkol |
| 23,6 | 40% | 60% | blokkol | blokkol |

A demótáblában a 23. sáv nyolcvan esetes, a 24. húsz, a deklarált minimum
ötven. Egy 23,5 hetes mérés fele-fele arányban épült a kettőből, mégis
átment — és a visszaadott `n: 80` azt állította, hogy nyolcvan eset áll
mögötte.

**A ritka sáv nem a közepén kezd rontani, hanem ott, ahol súlyt kap.** A
javítás mindkét befogó sávot nézi, és a **kisebbik** esetszámot adja vissza.

## 2. A sávok

### `ng.local.us-ac` — us.ac

21 sáv, deklarált sávminimum: **50**, összesen 1320 eset.

**6 sáv a minimum alatt:** x=20 (20), x=24 (20), x=28 (20), x=32 (20), x=36 (20), x=40 (20).

Ezek a sávok nem adnak percentilist — és a **szomszédjukba nyúló**
interpolált értékek sem.

**Kizárási szabályok:** növekedési elmaradás gondozás alatt · ismert magzati fejlődési rendellenesség · cukorbetegség · hypertensiv kórkép

Kizárás nélkül a helyi tábla a **betegek** populációját írja le, nem a
normálisat — és onnantól a növekedési elmaradás lesz a mérce.

## 3. A publikálthoz képest

Az eltolást a **publikált tábla szórásában** mérjük, nem milliméterben: egy
3 mm-es eltérés a 20. héten sokkal többet jelent, mint a 40.-en.

És a **rendszeresség** a lényeg, nem a nagyság. Egy nagy, de szórt eltérés
populációs különbség lehet; egy kicsi, de **minden sávban azonos irányú**
eltolás mérési torzításra utal — és éppen az utóbbi az, ami a helyi görbébe
beépülve láthatatlanná válik.

| Helyi tábla | Publikált | Közös sáv | Egy irányba | Átlagos eltolás | Ítélet |
|---|---|---|---|---|---|
| `ng.local.us-ac` | `ng.chitty.ac` | 6 | 6 | -0.34 SD | **rendszeresEltolas** |

**Amit ez NEM dönt el.** Hogy a rendszeres eltolás valódi populációs
különbség-e vagy mérési torzítás, azt gép nem tudja megmondani. A
különbséget megméri; **hogy melyik, azt a biostatisztikus és a klinikai
vezető dönti el** — és a kimondása kötelező, mert enélkül a rendszer a saját
torzításához mérné magát.

## 4. Ami emberre vár

- **A helyi görbe alapadata valódi betegadat.** A generált táblák helye a
  `registry/normogramok/helyi/` könyvtár, ami **nem kerül a repóba** — ugyanaz
  a szerkezet, mint a SNOMED-származéknál és a GPLv2-derivált kalkulátornál.
  A repóban álló demótábla **szintetikus**, és a forrása ezt ki is mondja.
- **A rendszeres eltolás megítélése** minden helyi görbénél, aláírva.
- **A sávminimum megválasztása.** A demó 50-et deklarál; hogy mennyi az
  elég, populációfüggő döntés.
- **És maguk a mérések:** azok a 16. lépésből jönnének, ami nem indulhat el.
