# 59 — Egy zárójel 1976-ból

*A `calc.crcl` hitelesítési dossziéja. Nem aláírás: az az anyag, ami alapján
aláírni lehet — vagy indokoltan nem.*

---

## Mi ez, és mi nem

A `calc.crcl` (Cockcroft–Gault kreatinin-clearance) kapu mögött áll. A
[47. dokumentum](47-kalkulator-hitelesites.md) írja le, mit követel egy
aláírás; a munkalapot a `npm run kalkulator` állítja elő. Ez a dosszié azt
gyűjti össze, amit az aláírás előtt tudni kell.

**Ez a dokumentum nem hitelesít semmit.** A
`registry/kalkulatorok/hitelesitesek.json` érintetlen, a kapu zárva marad.
Azért készült, mert az összegyűjtés közben kiderült, hogy a kapu mögött **nem
az a kérdés áll, amit a `verifiedNote` ma megnevez**.

## A kapu mai megfogalmazása

> „Az SI-egységre átszámolt 1,04-es női együttható nincs visszaellenőrizve az
> eredeti közleménnyel (az eredeti mg/dL-ben, 72-es osztóval és 0,85-ös női
> szorzóval dolgozik)."

Ez a mondat egy **kerekítési kérdést** sejtet. A kerekítés rendben van — a
nyitott kérdések máshol vannak.

## 1. Az együttható: számtanilag rendben

| | |
|---|---|
| Eredeti alak (férfi) | CrCl = (140 − kor) × testsúly / (72 × S<sub>cr</sub>[mg/dL]) |
| Kreatinin átváltás | 1 mg/dL = 88,4 µmol/L |
| SI-alak nőre | 88,4 / 72 × 0,85 = **1,043611…** |
| A kódban | **1,04** |
| Eltérés | **−0,346 %** |

Ez szokásos, két tizedesre történő kerekítés, nem képlethiba. Két egymástól
független levezetés — és egy másik modellcsaláddal futtatott keresztellenőrzés
— ugyanerre jutott. A `formula` sztring, a bemenetek deklarált mértékegységei
és a tényleges `fn` implementáció egymással konzisztensek.

## 2. A 0,85: benne van a közleményben — de nem úgy

Az eredeti absztrakt szó szerint:

> „A formula has been developed to predict creatinine clearance (Ccr) from
> serum creatinine (Scr) **in adult males**: (see article) **(15% less in
> females)**. Derivation included the relationship found between age and
> 24-hour creatinine excretion/kg in **249 patients aged 18-92**."
>
> — Cockcroft DW, Gault MH. *Nephron* 1976;16(1):31-41 · PMID 1244564

**A 15%-os csökkentés tehát az eredeti közleményben áll.** A `verifiedNote`
ezen a ponton helyes — a dosszié készítése közben ezt először tévesen
állítottam az ellenkezőjére, és a szó szerinti absztrakt döntötte el.

Amit viszont ugyanez a mondat megmutat: a képlet „**in adult males**" készült,
és a női korrekció egy **zárójeles ajánlás a férfi kohorszon levezetett képlet
mellett**, saját levezetés nélkül. A National Kidney Foundation KDOQI-oldala
így minősíti:

> „with the 15% adjustment for females **estimated rather than scientifically
> quantified**"

Ez egy szülészeti-nőgyógyászati rendszerben, ahol ez a kalkulátor
**kizárólag női alakban** létezik, nem részletkérdés. A szám a forrásban van;
a mögötte álló mérés nincs.

## 3. Amit a hivatkozás fed — és amit nem

| Elem | Fedi-e a `source`? |
|---|---|
| `140` és a `72`-es osztó | **igen**, közvetlenül |
| a nőkre ajánlott 15 % | **igen**, de női derivációs adat nélkül |
| `88,4` mértékegység-átváltás | **nem** — kívülről jön |
| az `1,04`-re kerekített összevont konstans | **nem** — számított érték |
| terhességi alkalmazás | **nem** — a képlet terhességre nincs validálva |
| a `30` / `60` dózissáv | **nem** — a közlemény nem dózisküszöb-forrás |

A hivatkozás tehát **helyes eredetmegjelölés, de nem teljes forrásfedezet**
ahhoz, amit a kód ténylegesen kiszámol és állít.

## 4. A hangosabb kérdés: mit mond a rendszer a klinikusnak

A kimeneti sávok ma ezt állítják, gyógyszer megnevezése nélkül:

| Tartomány | A rendszer felirata |
|---|---|
| < 30 mL/min | „súlyosan beszűkült — **dózismódosítás kötelező**" |
| 30–60 | „mérsékelten beszűkült — dózismódosítás mérlegelendő" |
| ≥ 60 | „**nem igényel dóziskorrekciót**" |

Univerzális dózisállításként ez nem tartható: a küszöb és a teendő
készítményenként eltér — van, amelyik 60 fölött is módosítást kíván, és van,
amelyik 30 alatt sem. Egy döntéstámogató rendszerben a „nem igényel
dóziskorrekciót" felirat **erősebb állítás, mint az együttható harmadik
tizedesjegye**.

Két további tétel ugyanebbe a csoportba tartozik:

- **A testsúly megválasztása.** A kalkulátor mindig `anthro.weight.current`
  értéket használ. Elhízásban, ödémában és terhességben az aktuális, az
  ideális és a korrigált testtömeg érdemben eltérő clearance-t ad — és ez
  gyógyszeradagolási döntéstámogatásban nem semleges alapértelmezés.
- **A `caveats` kategorikus mondata**, mely szerint a gyógyszeradagolás a
  kreatinin-clearance-re épül, „NEM az eGFR-re". Az irány védhető, de az
  alkalmazandó vesefunkció-mértéket mindig az adott készítmény
  dokumentációja határozza meg.

## 5. Az aláírás mechanikája: két akadály

**a) Az összevont konstans.** A hitelesítés tételes: az aláírás felsorolja,
melyik számot vetették össze, és ami kimarad, arra nem terjed ki. A gyűjtő
viszont a függvénytörzs számliteráljait látja, a `calc.crcl` esetében ezeket:

```
0 · 140 · 1.04
```

- a `140` közvetlenül összevethető a közleménnyel;
- az `1,04` **nem** — a `72`, a `0,85` és a `88,4` egyetlen literálba van
  összehajtva, tehát csak levezetésként reprodukálható;
- a `0` a `crUmolL > 0` érvényességi feltétel, azaz **implementációs
  tartományellenőrzés, nem forráskonstans** — a közleménnyel elvileg nem
  vethető össze, mégis kötelező elem lesz a listában.

Az aláíró tehát vagy pontatlanul állítaná, hogy a `0`-t és az `1,04`-et
közvetlenül összevetette a cikkel, vagy nem tudna teljes aláírást adni. A
származási lánc, amit egy auditálható munkalapnak mutatnia kellene:

```
140      – elsődleges cikk
72       – elsődleges cikk
15% / 0,85 – a cikk nőkre tett ajánlása, női deriváció nélkül
88,4     – mértékegység-konverzió, nem a cikkből
1,0436 → 1,04 – számított és kerekített konstans
0        – implementációs tartományellenőrzés
```

**b) Egy lappangó rés a futásidejű kapunyitásban.** A `kalkAllapot()` puszta
lenyomat-egyezésre `hitelesitve` állapotot ad, az `alkalmazKalk()` pedig ezt
ellenőrzés nélkül nyitja meg — a hiányzó konstansok listáját egyik sem nézi.
Ez ma **nem nyitott rés**: a `validateKalkHitelesitesek()` hibát ad a hiányos
listára, a `tools/validate.ts` meghívja, tehát a `npm run check` elbukna
rajta; és az `alkalmazKalk()`-ot a teszteken kívül semmi nem hívja. Amikor
viszont a webes réteg bekötné a futásidejű kapunyitást, ott is ellenőrizni
kell — különben a modul saját szabálya futásidőben nem érvényesül.

## 6. A szerepkérdés

A nyilvántartás szerepkatalógusa így rendelkezik:

```json
"nefrologus": "nefrológus — eGFR, kreatinin-clearance"
```

A `calc.crcl` aláírója eszerint **nefrológus**. Van érv amellett, hogy a
dózishoz kötött kreatinin-clearance klinikai gyógyszerészi terep — maga a
`caveats` mondja ki, hogy a gyógyszeradagolás erre épül, a dózismódosítás
pedig gyógyszerészi feladat —, de a katalógus bővítése **szervezeti döntés**,
nem fejlesztői.

## 7. Mi kell az aláíráshoz — tételesen

1. **Döntés a szerepről.** Marad a nefrológus, vagy bővül a katalógus?
2. **A teljes szövegű közlemény.** Az absztrakt eldönti, hogy a 15 % a
   cikkben van; azt nem, hogy a szerzők mivel indokolták. Ez a `forrasTabla`
   mező tartalma lesz.
3. **Döntés a dózissávokról.** A `30`/`60` határok nem a Cockcroft–Gault
   közleményből valók. Vagy más forrást kapnak, vagy a feliratok
   készítményfüggővé válnak — de a jelenlegi formájukban aláírni őket annyi,
   mint aláírni egy fedezet nélküli állítást.
4. **Döntés a testsúlyról.** Aktuális, ideális vagy korrigált — és mi történjék
   terhességben.
5. **Az `osszevetettKonstansok` értelmezése** az összevont `1,04`-re és a nem
   forrásbeli `0`-ra.

Amíg az 1., 3. és 4. pont nyitva van, **a kapu helyesen van zárva** — és
ebben a formában a zártsága nem hiányosság, hanem a rendszer működése.

---

## Módszertan

Három, egymástól független forrás: az eredeti közlemény absztraktjának szó
szerinti szövege (NCBI E-utilities), a National Kidney Foundation
KDOQI-összefoglalója, és egy másik modellcsaláddal futtatott keresztellenőrzés.
Ahol a három eltért, azt a dosszié kimondja — a 0,85 kérdésében az absztrakt
szó szerinti szövege döntött.

A klinikai megállapítások (dózissávok, testsúlyválasztás, a `caveats`
kategorikus mondata) **szakértői felülvizsgálatra várnak**; ez a dokumentum
megnevezi őket, nem dönt róluk.
