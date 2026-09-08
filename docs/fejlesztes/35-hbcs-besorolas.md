# 35 — A HBCS besorolási táblázat

*A `13-18-lepes.md` **2. lépésének** első fele, megvalósítva. A második fele —
a SNOMED magyar megnevezések — nem beszerzés, hanem **döntés**; az a
[`26-forrasjegyzek.md`](26-forrasjegyzek.md) 6/b pontjában áll.*

```
npm run demo:besorolas    # a besorolás működés közben
npm run ingest:besorolas  # újrakinyerés a rendeletből
```

---

## 0. Mi hiányzott, és mi van meg most

A súlyszámtábla (`tbl.hbcs`, 780 csoport) régóta megvolt: csoportkód →
súlyszám, határnapok, minősítés. Az hiányzott, hogy **egy adott
diagnózis-beavatkozás kombináció melyik csoportba esik**. A rendszer ezért
csoportot nem állapított meg, csak egy ismert csoport súlyszámát adta — a
finanszírozási modul fele hiányzott.

| | Forrás | Eredmény |
|---|---|---|
| kinyerés | `10/2012. (II. 28.) NEFMI rendelet` 2. melléklet | `registry/finanszirozas/hbcs-besorolas.json` (1,2 MB) |
| tartalom | 44 198 bekezdés | **26 főcsoport · 773 HBCS-csoport · 39 359 kódhivatkozás** |
| futásidő | — | `core/finanszirozas/besorolas.ts` |

A jogszabály szövege nem áll szerzői jogi védelem alatt (1999. évi LXXVI. tv.
1. § (4)), a forrásfájl pedig a repóban van — a kinyerés ezért **bármikor
megismételhető**, és a tábla a forrás sha256-át is hordozza. Enélkül egy
visszamenőleges elszámolás nem reprodukálható: nem derülne ki, melyik
kiadásból dolgozott a rendszer.

---

## 1. Miért nem kódtábla

A `tbl.hbcs` lapos: kulcs → érték. A besorolás nem az. Minden csoporthoz
**kódlista-blokkok** tartoznak (betegségek, beavatkozások, eszközök,
anaesztézia, kemoterápiák…), és egy **logikai szabály**, ami megmondja, a
blokkok milyen kombinációja esetén esik oda az eset:

```
**** 14 672A	Nagy rizikójú szülés (kivéve: császármetszés)
  A SZÜLÉS TÉNYÉNEK KÓDJAI "C"        ← a kódlista a főcsoport elején áll
  NAGY RIZIKÓJÚ SZÜLÉS BETEGSÉGEI "B"
  A NAGYRIZIKÓJÚ SZÜLÉS TÉNYÉNEK KÓDJAI "D"
  ("C" DIAGN. ÉS "B" DIAGN.) VAGY "D" DIAGN.
```

Ez szabálykészlet, nem tábla — ezért került a `registry/finanszirozas/` alá,
saját betöltővel és kiértékelővel. A `missingStems()` bejegyzése megmaradt,
`providedBy` jelöléssel: hogy fél év múlva ne kezdje el valaki újra
kódtáblaként keresni.

**A kódok NEVE nincs benne.** A megnevezés a `tbl.bno` és a `tbl.mut`
táblákban él, amelyek már a repóban vannak. A duplikálás 4,5 MB lenne 1,2
helyett — és két igazság ugyanarról a kódról.

---

## 2. A kinyerés: semmit nem dob el csendben

A rendelet 2. melléklete 44 198 bekezdés, és a nyelvtana gazdagabb, mint
elsőre látszik: 26 főcsoport, főcsoport-szintű megosztott kódlisták,
névtelen és betűjeles blokkok, feltételes fejlécek, elszámolási feltételek,
és **243-féle logikai kifejezés**.

Ezért a kinyerő minden bemeneti sort **pontosan egy vödörbe** tesz, és a
végén összeveti a vödrök összegét a bemenettel. Ha nem egyezik, kilép.

| Vödör | Sor |
|---|---:|
| kódtétel | 39 398 |
| blokkfejléc | 2 724 |
| HBCS-csoport | 773 |
| kódlista-hivatkozás | 607 |
| „bármely betegség” | 257 |
| szabálysor (+ folytatás) | 148 (+108) |
| főcsoport-szintű közös blokk | 124 |
| főcsoport | 26 |
| elszámolási feltétel | 25 |
| főcsoport-feltétel | 6 |
| **besorolatlan** | **0** |

A nulla nem magától jött. Az első futás 477 gazdátlan kódtételt és 417
besorolatlan sort hagyott, és mindegyik egy-egy félreértett nyelvtani alak
volt:

- `ÉS BEAVATKOZÁSOK (LEGALÁBB 4 NAPON ÁT)` — **feltételes fejléc**, amit a
  szabályminta szabálynak vett, és a mögötte álló kódok gazdátlanul maradtak;
- `KEMOTERÁPIÁK`, `LEUKAEMIÁK` — a rendelet **ragoz**, a fajtaminta pedig a
  teljes szóra illesztett;
- `"1" VAGY "3" TÍPUSÚ DIAGNÓZISOK` — az idézőjelben **diagnózistípus** áll,
  nem blokkbetű; szabálynak véve a kódlista elveszett volna;
- `VAGY (DAG. "F1" ÉS RADKEM. "*E")` — **folytatósor**: a rendelet a hosszú
  kifejezéseket több bekezdésre tördeli.

Ezért ér valamit a sorszám-egyeztetés: ezek egyike sem okozott volna hibát,
csak csendben kevesebb adatot.

---

## 3. A háromállapotú kiértékelés

**A besoroló nem kétállapotú.** A rendelet olyan feltételeket is használ,
amikhez a mai adatmodell nem ad adatot:

> „a szülést közvetlenül megelőzően 12 napnál hosszabb ápolás”
> „a felvételtől számított 4,5 órán belül”
> „3 különböző beavatkozás körből legalább egy-egy vizsgálat”
> „14 éves kor alatt: … , egyéb kor esetén: …”

| Állapot | Mit jelent |
|---|---|
| **teljesül** | a szabály kiértékelhető volt, és igaz |
| **nem teljesül** | kiértékelhető volt, és hamis |
| **nem értékelhető** | a szabály elemzetlen, vagy hiányzik hozzá adat |

A harmadik állapot nélkül a rendszer a nem értett szabályt „nem teljesül”-nek
venné, és **csendben rossz csoportot adna** — vagyis rossz finanszírozási
tételt, amit évekkel később kell megvédeni. Ugyanaz a szabály, mint mindenütt
máshol: *a hiányzó adat nem „nem”.*

A megítélhetetlen csoport mellé a rendszer **szó szerint odaírja a szabályt**,
amit nem ért. Enélkül a hiba nem javítható ki.

**596/773 csoport (77%) szabálya értékelhető ki géppel.** Ez a szám az első
változatban 82% volt — és rosszabb: akkor az üres kódlistájú blokk csendben
„egy kód sem illik rá”-t adott, ahelyett hogy kimondta volna, hogy a listát
nem találja. A 77% az őszintébb szám.

---

## 4. A mutató-blokk, ami valódi hibát okozott

A rendelet a hosszú listákat a főcsoport elején közli, a csoport pedig csak
**megnevezi** őket:

```
NAGY RIZIKÓJÚ SZÜLÉS BETEGSÉGEI "B"
A kódlistát ld. kiemelve a főcsoport elején!
```

Az ilyen helyi blokk **kód nélkül** áll: **mutató, nem üres lista.** Az első
megvalósítás a feloldást megállította rajta — és a `672A Nagy rizikójú szülés`
szabálya csendben hamisra fordult. Egy szüléshez tartozó csoport maradt volna
el, indoklás nélkül.

A feloldás sorrendje most: helyi blokk **csak akkor nyer, ha tartalma is
van**; egyébként a főcsoport közös listája; ha egyik sincs, az **nem üres
lista, hanem nem értékelhető**. A `test/hbcs-besorolas.test.ts` ezt
regresszióként őrzi.

---

## 5. A besorolás jelölteket ad, nem végszót

Egy császármetszés a `671A`-ra **és** a `673A`-ra is illik; egy vákuumos
szülés a `673A`-ra és a `674A`-ra. **Ez a helyes válasz.**

A választás elszámolási szabályokat kíván — legmagasabb súlyszám, csillagos
csoportok intézeti jogosultsága, összevonás, a 14. melléklet kivételei —,
és részben **intézményi adatot**, amit ez a réteg nem ismer. A `rankHbcs`
elrendez, nem dönt; a besoroló jelöl, nem dönt. A döntés emberé és
intézményé.

Példa (`npm run demo:besorolas`):

| Eset | Jelöltek |
|---|---|
| spontán hüvelyi szülés `O8000` | 673A (0,830) |
| + epidurális `8888F` | 673A · **673C** |
| + vákuum `57010` | 673A · **674A** |
| császármetszés `O8200` + `57400` | **671A** (1,749) · 673A |
| praeeclampsia `O8000` + `O1400` | **672A** (1,166) · 6840 · 673A |

---

## 6. Ami hátravan

- **A maradék 177 csoport szabálya.** Az időfeltételes és darabszámos alakok
  kiértékeléséhez az esetnek ápolási napokat, felvételi időpontot és
  beavatkozás-időbélyegeket kell hordoznia. Az adat egy része már megvan (a
  napló minden bejegyzésen visz időpontot) — a bekötés külön lépés.
- **Az életkori feltétel** (`14 ÉVES KOR ALATT: …`) a legkönnyebb ezek közül,
  és a `patient.birthDate` megvan hozzá.
- **A választás szabályai** (13–14. melléklet) — külön modul, intézményi
  adattal.
- **A rendelet frissül.** Az `ingest:besorolas` újrafuttatható; a tábla a
  forrás lenyomatát hordozza, tehát az eltérés kimutatható. Egy régi eset
  visszamenőleges elszámolásához viszont a **régi** kiadás kell — ugyanaz a
  szabály, mint a HBCS-súlyszámok archív kiadásainál (`tbl-hbcs@2025-01-01`).
