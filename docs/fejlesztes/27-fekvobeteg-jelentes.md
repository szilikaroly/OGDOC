# 27 — Fekvőbeteg-jelentés: a rekordkép mint kapu

> **Megmondja, hogy a jelentés kitölthető-e. Nem mondja meg, mennyit ér.**
>
> Ez a réteg egyetlen mondata. A HBCS besorolási táblázat nincs gépi alakban,
> ezért csoportot a rendszer nem állapít meg — de a visszapattanás okát előre
> megnevezi.

## 1. Miért kapu egy rekordkép

A fekvőbeteg-jelentés **fix hosszúságú, 746 bájtos** rekord: minden mező adott
karakterpozíción kezdődik, és adott hosszúságú (NEAK technikai útmutató, 1. sz.
melléklet). Ezért a hossz itt **nem formaiság**: egy karakterrel hosszabb kód
az egész rekordot elcsúsztatja, és a jelentés némán romlik el.

Két hossz **eldöntött** egy kérdést, amit a rendszer addig feltevésként vitt:

| Mező | Hossz | Következmény |
|---|:--:|---|
| `BNO_KOD` | 5 | a jelentési alak **O1410**, nem O141 |
| `B_KOD` | 5 | a beavatkozáskód **57410**, nem `74.10` |

A `74.10` alak az amerikai ICD-9-CM-ből való. **Éppen öt karakter** — ezért a
hosszellenőrzés nem fogja meg; az alakellenőrzés igen:

```
rekord.beavatkozasAlak
  A(z) „74.10" nem alfanumerikus. A pontos alak az amerikai ICD-9-CM-ből
  való: a hazai kód öt jegyű, pont nélkül (57410). A hossza éppen stimmel —
  ezért ezt a hossz NEM fogja meg.
```

A rekordkép a `registry/kodok/fekvo/rekordkep.json`-ból jön, nem kódból: a NEAK
útmutató évente változik, és a mezőhosszak vele. A másolás helyességét egyetlen
tulajdonság bizonyítja — **a mezőhosszak összege pontosan 746** —, és ezt teszt
őrzi.

## 2. A típusjel megszámlálható kötelezettség

A 10/2012. (II. 28.) NEFMI rendelet 6-7. §-a nem stílust ír elő, hanem
**darabszámot**:

| Jel | Mi | Hány | Mikor kötelező |
|:--:|---|:--:|---|
| `0` | beutaló iránydiagnózis | max 1 | ha beutalóval érkezett |
| `1` | alapbetegség | **pontosan 1** | mindig |
| `2` | áthelyezést indokoló | max 1 | áthelyezéskor |
| `3` | ápolást indokoló fődiagnózis | **pontosan 1** | mindig |
| `4` · `C` · `D` | szövődmény · nosocomiális · egyéb fertőzés | — | — |
| `5` | kísérő betegség | — | — |
| `V` | igénybevételi ok (Z-kód) | — | **szülés első ellátása** |
| `E` | sérülés külső oka | — | ha S/T/V/W/X/Y kód szerepel |
| `M` | morfológiai kód | — | szövettannal igazolt daganat |
| `K` | kiegészítő minősítés | — | `†` kód mellé a `*` párja |
| `F` | funkcionális állapot (FNO) | — | felvételkori státusz |

A hiányzó fődiagnózist a rendszer **megnevezi, nem találja ki**:

```
diag.hianyzik
  Hiányzik a(z) „3" típusjelű diagnózis: ápolást indokoló fődiagnózis. Ennek
  meghatározása kötelező — a rendszer NEM találja ki.
```

### A hiányzó adat itt sem „nem”

Ha nem tudjuk, beutalóval érkezett-e a beteg, a `0` típusjel hiánya **nem
hiba, és nem is rendben**:

```
diag.beutaloEldonthetetlen        (undetermined)
  Nincs „0" típusjelű beutaló iránydiagnózis. Az, hogy ez hiány-e, attól függ,
  beutalóval érkezett-e a beteg — és ez nincs rögzítve. Ez NEM azt jelenti,
  hogy rendben van.
```

Az `undetermined` **nem blokkol**: a jelentés beadható, csak nem tudjuk, teljes-e.
Ez ugyanaz a három állapot, ami a rendszerben mindenhol: *van · nincs · nem
tudjuk* — és a harmadik sosem olvad be a másodikba.

## 3. A szülés kódolása — 11. melléklet

A rendelet 11. melléklete három tételt ír elő kötelezően, és ezek közül egy
olyan van, ami a klinikai dokumentációból **rendszerint hiányzik**:

| Tétel | Mi | Miért marad ki |
|---|---|---|
| `3` típusjel | a szülés módja, `O8000`–`O8492` | ez rendszerint megvan |
| **`V` típusjel** | a szülés eredménye, `Z37xx` | **nem klinikai állítás**: az élve/halva születést és a magzatszámot rögzíti |
| beavatkozás | szülésvezetés (`57270`, `57271`, `92600`, `92604`) vagy császármetszés (`574xx`) | a műtéti leírásból következik, de külön kódot igényel |

### Az ellentmondást a rendszer nem javítja ki

Ha a beavatkozás császármetszés, a fődiagnózis viszont hüvelyi szülés, a
rendszer **nem választ** a kettő közül:

```
szules.ellentmondas               (blocking)
  Császármetszés beavatkozáskódja (57410) szerepel, de a „3" típusjelű
  fődiagnózis (O8090) nem császármetszéses szülést jelöl. A rendszer NEM
  javítja ki egyiket sem: az ellentmondás maga a lelet — vagy a kódolás
  rossz, vagy a szülésleírás.
```

Ez szándékos. A szülés módja klinikai állítás; ha a beavatkozáskódból
vezetnénk le, épp azt a különbséget tüntetnénk el, amit érdemes észrevenni.

### A patológiás terhesség tizenkét napja

A 11. melléklet 4.2. pontja szerint a patológiás terhességi diagnózis a
besorolásnál csak akkor vehető figyelembe, ha a szülést **közvetlenül
megelőző** ellátási idő meghaladta a 12 napot. Ha ez az adat nincs meg, a
válasz `undetermined` — nem „nem patológiás".

## 4. Amit a réteg szándékosan nem csinál

**Nem sorol be.** A rendelet felsorolja a szülés besorolásának öt fő minősítő
tényezőjét — patológiás terhesség, hüvelyi szülés, hüvelyi szülés műtéttel,
császármetszés, nagy rizikójú szülés —, és a rendszer fel is sorolja őket, de
**nem értékeli ki**: a hozzájuk tartozó besorolási táblázat (2. melléklet)
nincs gépi alakban.

```ts
checkRecord(...).assignsHbcs    // false — mindig
checkDelivery(...).assignsHbcs  // false — mindig
```

A `false` itt típusszinten `false`, nem `boolean`: a réteg határa nem futásidejű
állapot, hanem szerkezet.

## 5. A súlyszám a kiadáshoz tartozik, nem a csoportkódhoz

| Csoport | 2025-05 | 2026-04 |
|---|---:|---:|
| `671A` Császármetszés | 1,53177 | 1,74947 |

Ugyanaz a kód, más összeg. Egy 2025-ös eset visszamenőleges elszámolása a mai
táblával **csendben** rossz értéket ad — a hiba nem látszik, mert a csoportkód
nem változott. Ezért a korábbi kiadások is betöltődnek
(`tbl.hbcs@2025-01-01`, `tbl.hbcs@2025-05-01`), és a választás az **ellátás
napjához** történik:

```ts
hbcsValueOn("671A", 5, "2025-06-01").value.sulyszam      // 1.53177
hbcsValueOn("671A", 5, "2026-09-01").value.sulyszam      // 1.74947
hbcsValueOn("671A", 5, "2019-01-01").value               // null
```

Amelyik napra egyik betöltött kiadás sem érvényes, oda a rendszer **nem a
legközelebbit veszi**:

```
A(z) 2019-01-01 napra a(z) tbl.hbcs törzs EGYIK betöltött kiadása sem
érvényes. […] A rendszer NEM a legközelebbi kiadással számol helyette: az
elszámolás csendben lenne rossz.
```

## 6. Elfogadási kritérium, tesztként

`test/fekvojelentes.test.ts` — 21 teszt. A fontosabbak:

| Teszt | Mit bizonyít |
|---|---|
| a mezőhosszak összege pontosan 746 | a rekordkép másolása helyes |
| a rövidített BNO-alak blokkol | a fix rekord nem tűri a rövidítést |
| a `74.10` az **alakon** bukik el, nem a hosszon | az öt karakter nem elég bizonyíték |
| 16 diagnózisnál több nem fér be | és ez **elmaradt bevétel** is: a kimaradó társult betegség alacsonyabb csoportot ad |
| fődiagnózis nélkül nincs jelentés | a rendszer nem találja ki |
| „nem tudjuk, beutalóval jött-e" ≠ „rendben" | a harmadik állapot nem olvad be |
| a férfi betegre kódolt szülés elakad | a **törzs** dönt, nem egy kézzel írt szabály |
| a szülés eredménye külön kötelező tétel | ez az, ami rendszerint hiányzik |
| az ellentmondást nem javítja ki | az ellentmondás maga a lelet |
| egyik ellenőrzés sem sorol be | a réteg határa kimondva |
