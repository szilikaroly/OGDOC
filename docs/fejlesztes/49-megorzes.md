# 49 — A megőrzési idők

*A 10. lépés gépi fele. Az az adat, amit a rendszer kiírt, de soha nem
számolt ki — és a kapu, ami mögött a visszafordíthatatlan megsemmisítés áll.*

---

## Miért ez a legsúlyosabb az öt hitelesítési réteg közül

A rendszerben most már öt helyen áll aláírási kapu: laborreferenciák (6.
lépés), normogramok (7.), kalkulátorok (8.), szepszisküszöbök (9.) és a
megőrzési idők (10.).

Az első négy hibája **téves számot** ad: észrevehető, javítható, visszamérhető.
A hibás megőrzési idő **visszahozhatatlanul megsemmisít** dokumentációt. Nincs
második esély, és nincs mihez visszanyúlni.

---

## Amit ez a lépés talált

### 1. A megőrzési időt a rendszer kiírta, de soha nem számolta ki

A 14 dokumentumtípus mellett ott állt a `period` (`P50Y`, `P30Y`, `P10Y`), a
`from` horgony, és a jogszabályhely. Ebből:

- a **`period` sehol a kódban nem lett dátummá** — a `deletable()` a nyers
  karakterláncot adta vissza (`{ ok: true, after: "P30Y" }`);
- a **`from` mező** — hogy mihez képest számoljuk — a saját típusdeklarációján
  kívül **egyetlen sorban sem szerepelt**. Tiszta díszítés volt.

### 2. …és ezért a törlés egyetlen kapuja egy begépelt évszám volt

A törlési motorban a megőrzési idő leteltét a `TorlesiRendelkezes.megorzesLejart`
mező igazolta: egy dátum, amit az adatvédelmi tisztviselő beír. A motor
egyetlen dolgot ellenőrzött rajta — hogy a **múltban** van-e. Semmi nem vetette
össze a dokumentumok saját időtartamával és horgonyával, **pedig mindkettő ott
áll a regiszterben**.

Aki `2020-01-01`-et ír be egy múlt heti esethez, átjutott a kapun.

Ma ezt elfedi, hogy egyetlen típus sem `primary`, tehát semmi nem törölhető. De
**épp ez a lépés célja**, hogy mind a 14 `primary` legyen — és abban a
pillanatban a maszk lehullik.

Az `igazolasEllenorzes()` mostantól három kimenetelt ad, és a középső a fontos:

| A kiszámolt lejárat | Az ítélet |
|---|---|
| nem ismert (hiányzó horgony) | **nem igazolható** — tehát nem igazolt |
| későbbi a begépeltnél | **túl korai** — blokkol, és megnevezi a különbséget |
| nem későbbi | rendben |

### 3. A jogszabályhely más horgonyt idéz, mint amit a rendszer számol

A rendszer mind a tizennégy időt **az eset lezárásától** számolja. Az idézet
viszont 13-nál mást nevez meg:

| Hány tétel | Az idézet szerint | A beállítás szerint | Az eltérés iránya |
|---|---|---|---|
| 12 | „30 év **az adatfelvételtől**" | az eset lezárása | **hosszabb** őrzés |
| 1 | „10 év **a készítéstől**" | az eset lezárása | **hosszabb** őrzés |

Az eset lezárása sosem korábbi az adatfelvételnél, tehát a rendszer ma
**hosszabb ideig őriz, mint amennyit a törvény kíván** — ami a biztonságos
irány. De **kimondatlan**, és abban a pillanatban, hogy a rendszer valóban
számolni kezd, a jogi és a gépi lejárat két különböző dátum lesz.

A `from` mező ezért mostantól ismeri a `dataEntry` és a `creation` értéket:
**hogy a jogász döntésének legyen hová landolnia.** Két válasz lehetséges, és
mindkettőt le kell írni — vagy elfogadjuk a lezárást óvatos közelítésként, vagy
a horgonyt állítjuk át.

A gép nem dönti el. A hatályos jogszabályszöveget a hálózati szabályzat
blokkolja, és ez amúgy sem kódkérdés.

---

## A lenyomat — mit fed az aláírás

**Benne van:** az időtartam, a horgony, a jogszabályhely (az idézet gondolatjel
előtti fele), a meghosszabbíthatóság céljai, és a betegkérés kezelése — ha
valaki kikapcsolja a törlés előtti értesítést, az normatív változás.

**Nincs benne:** a `verifiedNote` és az idézet leíró fele. Azok javíthatók az
aláírás elvesztése nélkül.

Az aláírás megnevezi a **jogszabályt és a hatályosság napját** is. Ez nem
formaság: egy törvény tavalyi szövege nem a hatályos szöveg, és a különbség épp
a megőrzési időkben szokott lenni. A `hatalyos` dátum nélkül az aláírás
**építési hiba**.

---

## A próbafuttatás

A lépés második elfogadási kritériuma: *„az első automatikus törlés
próbafuttatása szintetikus adaton lefut."*

A `terv()` **soha nem töröl, és nem is tud**: nincs olyan ága, ami írna. Ez nem
óvatosság, hanem a lépés értelme — az első automatikus törlés próbája nem lehet
maga az első automatikus törlés.

Három szintetikus eset, és együtt mutatják meg a szabályokat:

| Eset | Mit mutat |
|---|---|
| **1960-ban lezárt** | mind a 14 idő letelt — és **mégsem menne egyetlen tétel sem**, mert egyik szabály sincs aláírva. Ez a helyes sorrend: előbb az aláírás, aztán a törlés. |
| **2010-ben lezárt** | aláírás mellett **egyetlen** tétel menne (a 10 éves képalkotó felvétel); a 30 és az 50 éves idő tart. |
| **lezáratlan** | horgony nélkül a rendszer **nem esik vissza a mai dátumra**: ha nem tudja, mikortól számoljon, azt sem tudja, meddig. |

Ez ugyanaz a szabály, mint mindenütt a rendszerben: **a hiányzó adat sehol nem
„nem".**

---

## Ami továbbra is nyitva van

- **A 14 megőrzési időből 0 aláírva.** Az elsődleges jogszabályszöveget a
  hálózati szabályzat blokkolja; a mostani számok másodlagos forrásokból valók.
- **A horgonykérdés eldöntetlen**: elfogadható-e a lezárás óvatos
  közelítésként, vagy a horgonyt kell átállítani.
- **Amíg ez így van, a rendszer nem töröl** — és ez a helyes irány.
  Ellenőrizetlen megőrzési idő mellett törölni **adatvesztés**, nem takarítás.

---

## Futtatás

```
npm run megorzes    # munkalap a jogásznak + a törlés próbafuttatása
npm run validate    # a kapu és a horgonyeltérés ellenőrzése
node --test test/megorzes.test.ts   # 23 teszt
```

## Fájlok

| | |
|---|---|
| `core/docs/megorzes.ts` | az aritmetika, a horgonyok, a lenyomat, a próbafuttatás |
| `registry/documents/megorzes-hitelesitesek.json` | az aláírások — szándékosan üres |
| `core/store/torles.ts` | a begépelt lejárat visszaellenőrzése (`megorzesIgazolas` akadály) |
| `tools/gen-megorzes.ts` | a munkalap (`npm run megorzes`) |
| `test/megorzes.test.ts` | 23 teszt |
