# 24 — Kódolás: a kód az adat következménye

> A legtöbb rendszerben a kódolás kézi keresés egy 13 000 tételes listában,
> jóval az ellátás után, olyan ember által, aki a beteget nem látta. Ez a modul
> abból indul, hogy **a kód a rögzített adatból következik** — és abból, hogy a
> következtetés akkor ér valamit, ha látszik, miből lett.

## 1. Az elfogadási kritérium: O14.1, és hogy miért

```ts
RULES.suggest(reg, state).suggestions.find(s => s.code === "O14.1").because
// [{ variable: "lab.plt", value: 78,
//    text: "Thrombocytaszám = 78 G/l (< 100)" },
//  { variable: "lab.ast", value: 92,
//    text: "Aszpartát-aminotranszferáz = 92 U/l (≥ 70)" }]
```

Nem az a kérdés, hogy a rendszer ki tud-e találni egy kódot. Az, hogy a kódoló
**el tudja-e dönteni, elfogadja-e**. Ehhez a küszöböt, a mért értéket és a
forrást egyszerre kell látnia.

A súlyosabb kód **elnyomja** az enyhébbet (`supersedes`) — de nem csendben: az
elnyomott kód a listában marad, azzal együtt, mi nyomta el.

```ts
suggestions.find(s => s.code === "O14.9")
// { status: "superseded", supersededBy: "O14.1" }
```

Az elnyomási lánc három szintű: O14.9 → **O14.1** → **O14.2** (HELLP). És van
egy fordított irányú szabály is: az „egyszerű, spontán szülés" (O80) kódot
**bármely másik** szülészeti kód elnyomja (`supersededByAny`) — ez a kód
definíció szerint azt állítja, hogy semmi más nem történt.

## 2. A hiányzó súlyossági adat nem „nem súlyos"

Ez a modul legfontosabb szabálya, és itt a legkárosabb megszegni.

```ts
RULES.suggest(reg, csakVérnyomásÉsFehérje)
// provisional: true
// "ELŐZETES AJÁNLÁS: O14.1 (Súlyos praeeclampsia) eldönthetetlen maradt,
//  pedig SÚLYOSABB besorolást jelentene. Hiányzik: lab.plt, lab.ast, lab.alt.
//  A hiányzó súlyossági adat NEM azt jelenti, hogy az eset nem súlyos —
//  csak azt, hogy nem néztük meg."
```

„Praeeclampsia, k.m.n." kódolás azért, mert a vérkép nem készült el, **pontosan
úgy néz ki a statisztikában, mintha az eset enyhe lett volna.** A rendszer
ezért nem ad nyugodt szívvel O14.9-et: az ajánlás előzetes, és megnevezi, mit
kell megnézni hozzá.

Ha a súlyossági ismérveket **megnézték és negatívak**, az ajánlás nem előzetes.
A különbség a megnézett és a meg nem nézett negatív között az egész modulban
ugyanaz.

### A szabály, amiről tudjuk, hogy hiányos

```
"A súlyossági ismérvek listája HIÁNYOS: a szérumkreatinin, a tüdőoedema és az
 újonnan jelentkező agyi vagy látászavar nincs bekötve. Egy súlyos eset ezért
 enyhének LÁTSZHAT — a szabály hiánya nem jelenti a súlyosság hiányát."
```

Ez az `incompleteNote`, és az ajánlás mellett jelenik meg — ugyanaz a
megoldás, mint az RCOG GTG 37a hiányos tételsoránál a 11. modulban. A
szülés utáni vérzés küszöbe hasonlóan jelölt: ma egyetlen 500 ml-es határ van,
ami **császármetszésnél túljelez**.

## 3. Az ajánlás nem döntés — és nem is tárolódik

| | Honnan | Tárolódik? |
|---|---|:--:|
| **ajánlás** | a rögzített adatból, minden hívásnál újra | **nem** |
| **döntés** | a kódoló választása (`code.dx.primary`) | igen |

Ha a labor változik, az ajánlás követi; a kiadott dokumentum nem. Ezért a
**zárójelentésre a kódoló döntése kerül, nem az ajánlás** — egy dokumentum nem
mutathat javaslatot tényként.

A kettő **eltérése önmagában adat**: ugyanaz a szétválasztás, mint a
konzílium-javallat és a konzílium megkérése között ([20.](20-ellatas-tervezes.md)),
vagy az OENO-kódajánlás és a kódolás között ([18.](18-muto.md)).

Egy harmadik mező is ide tartozik: `code.dx.certainty`. **A gyanú nem
diagnózis** — bizonyosság nélkül a kód a statisztikában igazoltként viselkedik,
és egy kizárt diagnózis kódja évekig kísérheti a beteget.

## 4. Új levezetés-fajta: a táblakeresés

A modul terve az irányítószám → település kitöltést „a legegyszerűbb
keresztfeltöltésnek" nevezte, és hozzátette: *„ugyanaz a mechanizmus, mint a
BMI, csak a függvény egy táblakeresés."* Ez majdnem igaz — és a különbség
kényszerített ki egy magbeli bővítést.

A `computed` levezetés a **kalkulátor-rétegen** megy át, ami **számot vesz és
számot ad**. Ez a szigorúság szándékos: egységesen kezelhető vele a hiányzó
bemenet és az ellenőrizetlen konstans kapuja. Az irányítószámból viszont
**szöveg** lesz, és nincs benne képlet.

Ezért új fajta, nem kalkulátor:

```ts
"derivation": { "kind": "lookup", "table": "tbl.irszmap",
                "from": "addr.postcode", "column": "label" }
```

Így a kalkulátor-réteg megmarad számokra (és a kapui értelmesek maradnak), a
táblakeresés pedig a **saját kapuját** kapja meg: a tábla verzióját, dátumát és
forrását. Egy tábla több oszlopa több levezetést szolgál ki — a település és a
megye ugyanabból a törzsből, ugyanabból a verzióból jön, és a `sourceRef`
(`tbl.irszmap@2026-minta`) mindkettőn ugyanaz.

### A hiányzó tábla nem néma

```ts
resolve(reg, st, "addr.settlement").state   // "missing"
st.errors                                   // [{ where: "addr.settlement", … }]
```

Ha a törzs nincs betöltve vagy a kulcs nincs benne, a mező **üres marad**, és a
hiba a `CaseState.errors[]`-be kerül — onnan pedig az okoslelet „amit nem
tudunk" szakaszába. Nem találgat, és nem hallgat.

A betöltött táblák **szándékos részhalmazok** (10 irányítószám a ~3300-ból, 32
BNO-kód), és ezt a tábla maga mondja ki:

> „Ez nem hibás adat: a teljes törzs nincs betöltve."

A `tableStamp()` a verziót és a dátumot adja vissza a felületre — hogy
látszódjon, mennyire friss az, amiből a rendszer dolgozik.

## 5. HBCS: a besorolás, amit nem végzünk el

```ts
suggestHbcs(reg, rules, state)
// { status: "blocked", group: null,
//   reason: "HBCS-BESOROLÁS NEM KÉSZÜL: a hatályos szabálykönyv nincs
//            betöltve és ellenőrizve. Egy közelítő besorolás rosszabb lenne a
//            semminél — a HBCS pénz…" }
```

A modul terve azt írta, hogy a rendszer „javaslatot ad, nem végleges
besorolást". Ez igaz, de kevés: **egy javaslathoz is a hatályos szabálykönyv
kell**, az pedig évente változik és nincs betöltve. Egy hihetőnek látszó, de
rossz csoport a finanszírozási elszámolásban derülne ki — vagy nem derülne ki.

Ugyanaz a kapu, mint az ellenőrizetlen kalkulátor-konstansnál és a
hitelesítetlen normogramnál. A képességet a kód **kívülről kapja**
(`rulebookVerified`), nem magáról állítja — és a besorolási logika akkor sem
fut le, ha a jelölést megkapja.

Amit a rendszer elvégez, az viszont valódi munka: **összeszedi a besoroláshoz
szükséges bemeneteket**, és megmondja, melyik hiányzik. A besorolás legtöbb
hibája abból származik, hogy egy kísérő betegség vagy egy beavatkozás nem
került a dokumentumba — és a `code.dx.secondary` mező dokumentációja ezt ki is
mondja.

## 6. Amit a megvalósítás előhozott

**Az egységréteg új kimeneten is kell.** Az indoklás első változata
„Thrombocytaszám = 78 10*9/L"-t írt — ugyanaz a UCUM-hiba, amit a
zárójelentésnél már megoldottunk ([21.](21-zarojelentes.md) 6.). A build-teszt
az **új egységeket** fogja meg, az **új megjelenítési helyeket** nem: minden
emberi kimenetnek át kell mennie a `withUnit()`-on, és ezt csak a kimenet
elolvasása mutatja meg.

**A küszöb klinikai állítás, nem kódolási tény.** Hogy a 160/110 Hgmm súlyosnak
számít, azt egy ajánlás mondja ki; hogy az ikerterhesség kódja O30.0, magából
az osztályozásból következik. A validátor ezért **build-hibaként** utasítja el a
küszöböt tartalmazó szabályt, ami pusztán a BNO-ra hivatkozik.

**Az elnyomás hatástalan lehet.** Ha egy szabály olyan kódot nyomna el, amire
nincs szabály, az elnyomás nem csinál semmit — a validátor erre figyelmeztet.
Ez fogta meg, hogy az O14.0 (enyhe-közepes praeeclampsia) az elnyomási
listákban szerepelt, de szabály nem tartozott hozzá.

## 7. Tesztek

[`test/kodolas.test.ts`](../../test/kodolas.test.ts) — 29 teszt:

- súlyos praeeclampsiánál O14.1 az ajánlás, nem O14.9;
- látszik, melyik változó melyik értéke miatt súlyos;
- ha a labor változik, az ajánlás követi;
- thrombocytaszám nélkül az ajánlás előzetes, a szabály eldönthetetlen;
- a HELLP elnyomja a súlyos praeeclampsiát, bármely kód az „egyszerű szülést";
- az ajánlás nem tárolódik, a kódoló döntése külön mező;
- az irányítószámból levezetődik a település és a megye, ugyanabból a verzióból;
- ismeretlen kulcsnál nincs érték, és a hiány a hibalistába kerül;
- HBCS-besorolás nem készül, a szabálykönyvet ellenőrzöttnek jelölve sem.
