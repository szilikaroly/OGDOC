# 47 — A hét kapu mögötti kalkulátor

*A 8. lépés gépi fele — és a pontsor, ami lefelé lép.*

Hét kalkulátor teljes bemenettel sem ad eredményt, mert a konstansaik nincsenek
visszaellenőrizve az elsődleges közleménnyel. **Ez nem elméleti óvatosság:** a
fullPIERS dokumentált együtthatóival a modell klinikailag **fordítva
viselkedik**, és ezt a rendszer saját tesztje mutatta ki.

---

## Ami itt más, mint a 6. és 7. lépésben

Ott a hitelesítés tárgya **adat** volt — egy referenciasáv, egy görbe sorai.
Itt **kód**: a konstansok egy JavaScript-függvény törzsében állnak. Ez három
dolgot változtat meg.

### 1. A lenyomat a függvény forrását fedi

Megjegyzések nélkül, összenyomott szóközökkel. Egyetlen együttható átírása
elavulttá teszi az aláírást — és ez a helyes viselkedés, mert **épp az
együttható az, amit aláírtak**.

### 2. Az egység a lenyomat része

Ez a rész nem esztétika:

> Az eGFR függvénye **µmol/L-t vár és 88,4-gyel oszt**. Ha a bemenet deklarált
> egysége mg/dL-re változna a kód érintése nélkül, az eredmény **csendben
> 88-szor téves** lenne — és a lenyomat nem változna, ha az egység kimaradna
> belőle.

Ezért a normatív mag: a függvény forrása **+ a bemenetek egységgel + a kimenet
egysége + a sávhatárok**. Ami kimarad: a címke, a képlet prózája, a `caveats`
és a forrásidézet — azok javíthatók az aláírás elvesztése nélkül.

### 3. A gép előre elvégez két unalmas ellenőrzést

**Elcsúszás-figyelő:** a kódban álló számok összevetése a dokumentált képlet
prózájával. Nem minden eltérés hiba — a 88,4-es egységváltó és a 26-os
sávhatár jogosan áll csak az egyik oldalon —, de ez a legolcsóbb módja annak,
hogy egy elgépelt együttható kiderüljön **mielőtt** valaki aláírja. Az aláíró
a prózát olvassa; a beteg a kódot kapja.

**Monotonitás:** pontozó kalkulátornál nő-e a pontszám a súlyossággal.

---

## Amit a monotonitás-vizsgálat talált

Az **ISTH terhességi DIC-pontszám** thrombocyta-komponense:

```
> 185  → 0 pont
100–185 → 1 pont
 50–100 → 2 pont
   < 50 → 1 pont      ← a legsúlyosabb kategória kevesebbet ér
```

A pontsor `0 → 1 → 2 → 1`. **A legsúlyosabb thrombocytopenia kevesebb pontot
ér, mint a közepes.**

Ez kétféle lehet, és a különbséget **csak a közlemény dönti el**: vagy hűen
átvett, empirikusan levezetett tábla — a terhességi ISTH-változat
populációadatból származik, és az ilyen táblák tudnak nem monotonok lenni —,
vagy elgépelés. A kód és a dokumentált képlet **egyetért egymással**, tehát ha
hiba, akkor a forrásból átvételkor keletkezett.

**A gép ezért nem javít és nem vádol.** Megnevezi, és a hitelesítés
napirendjére teszi. Ez a legdrágább fajta hiba, amit egy pontszámban el lehet
követni: a súlyosabb eset kap kevesebb pontot, és a rendszer emiatt **nem
riaszt**.

Aláírni lehet így is — de **csak kimondva**: nem monoton pontsornál az aláírás
`megjegyzes` mezője kötelező, különben build-hiba. *Enélkül nem derül ki, hogy
észrevették-e.*

---

## A tételes összevetés

Az aláírás felsorolja, **melyik konstanst** vetették össze:

```json
"osszevetettKonstansok": ["142", "0.7", "0.241", "1.2", "0.9938", "1.012", "88.4", "1"]
```

Ami kimarad, arra **az aláírás nem terjed ki** — és a validálás build-hibát ad
a hiányzó tételekre. Ez nem bürokrácia: egy „megnéztem" önmagában **nem
ellenőrizhető állítás**.

A munkalap (`npm run kalkulator`) közleményenként sorol, mert a hitelesítés így
megy — és mert a lépés kimondja: *„nem egy ember mind a hétre."*

---

## Az öröklött lista: 36 tétel, megnevezve

A szabály bevezetésekor kiderült, hogy **36 kalkulátor** már `verified: true`
volt — az aláírási réteg előttről, aláíró és lenyomat nélkül.

Három út volt, és kettő rossz:

| Út | Miért nem |
|---|---|
| úgy tenni, mintha alá lennének írva | hazugság a naplóban |
| visszavonni mind a 36-ot | 36 működő számítás állna le anélkül, hogy **egyetlen konstans is biztonságosabb lenne** |
| **megnevezni** | ← ez |

A `registry/kalkulatorok/orokolt.json` kimondja, ami igaz: *a jelölésük mögött
nincs megnevezett aláíró és nincs lenyomat.* Nem állítjuk róluk, hogy alá
vannak írva; azt sem, hogy hitelesítetlenek.

> **A kockázatot nem az elhallgatás csökkenti, hanem a megnevezés.**

Az öröklött tétel **figyelmeztetés**, nem hiba — de a lista **le van zárva**:
egy listán kívüli, aláírás nélküli `verified: true` **build-hiba**. Aki
mostantól ír egy kalkulátort, aláírással hitelesíti.

**És a lista csak rövidülhet.** Ez a szám — `36 öröklött` a validálás záró
sorában — a 8. lépés valódi haladásmérője, nem a hét kapu.

---

## Fájlok és számok

| Fájl | Mi ez |
|---|---|
| `core/calc/hitelesites.ts` | lenyomat · elcsúszás-figyelő · monotonitás · öröklött kapu |
| `registry/kalkulatorok/hitelesitesek.json` | **szándékosan üres** |
| `registry/kalkulatorok/orokolt.json` | 36 tétel, lezárva `2026-09-06`-tal |
| `tools/gen-kalkulator.ts` | a munkalap (`npm run kalkulator`) |
| `test/kalkulator-hitelesites.test.ts` | 15 teszt |

A `npm run validate` záró sora:
`7 kalkulátor kapu mögött, 0 aláírva, 36 öröklött, 1 nem monoton pontsorral`.
