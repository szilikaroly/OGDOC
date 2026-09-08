# 13 — Referenciatartomány, normogram, szűrési esedékesség

> Három réteg, ami a **nyers számot klinikai olvasattá** teszi. Mindhármat
> ugyanaz a szemlélet vezeti: a rendszer inkább mondja azt, hogy *nem tudom*,
> mint hogy csendben rosszat mondjon.

## 1. Miért nem elég a `domain`

A `domain` a **rögzíthetőség** határa: mi az, ami egyáltalán beírható. A
`reference` a **klinikai olvasat**: mi az, ami normális *ennél a betegnél,
most*. A kettő összekeverése az egyik legköltségesebb csendes hiba.

```
lab.alp = 180 U/L
  3. trimeszterben  → normális     (a méhlepény is termel alkalikus foszfatázt)
  nem terhesen      → emelkedett
```

Ugyanaz a szám, ellentétes teendő. A `04-statusz.md` óta végigfutó elv itt is
áll: **a kontextus nélkül a lelet nem lelet.**

## 2. A két szabály

### 2.1 A nem terhes tartomány NEM alapértelmezés

```ts
referenceFor(reg, blank(), "lab.plt")
// { status: "unavailable", missing: ["ctx.pregnant"],
//   reason: "A terhességi állapot ismeretlen… A nem terhes tartomány NEM alapértelmezés." }
```

A hiányzó terhességi állapot **nem** jelenti azt, hogy a beteg nem terhes. Ha a
motor ilyenkor a nem terhes sávot használná, a rendszer minden ismeretlen
állapotú betegnél a rossz táblát olvasná — és épp azoknál, akiknél a felvétel
kapkodó volt.

### 2.2 Ismeretlen trimeszter: akkor válaszolunk, ha mindegy

```ts
// terhes, de a gesztációs kor még nem ismert
interpret(reg, st, "lab.plt")   // 30 ×10⁹/L → { reading: "low", agreedAcrossTrimesters: true }
interpret(reg, st, "lab.plt")   // 150 ×10⁹/L → { status: "unknown", missing: ["ctx.ga"] }
```

Ha **minden** szóba jövő trimeszter szerint ugyanaz az olvasat, a trimeszter
ismerete nem változtatna semmin — akkor válaszolunk. Ha eltérnének, nem
találgatunk. Ez nem elméleti kényelem: a sürgősségi felvételen a gesztációs kor
gyakran órákkal később derül ki, a leletet viszont akkor kell olvasni.

## 3. Miért jelzés, és nem kapu

A kalkulátoroknál az ellenőrizetlen konstans **kapu**: teljes bemenettel sem
születik szám. A referenciatartományoknál csak **figyelmeztetés**. A különbség
nem engedmény, hanem szerkezeti:

| | Kalkulátor | Referenciatartomány | Normogram |
|---|---|---|---|
| Mit ad | egyetlen származtatott szám | sáv a nyers érték MELLÉ | egyetlen származtatott szám |
| Látszik-e a nyers adat | nem | **igen, mindig** | nem |
| Ránézésre ellenőrizhető | nem | igen | nem |
| **Ellenőrizetlenül** | **kapu** | jelzés | **kapu** |

A percentilis ugyanolyan „egyetlen szám, amit nem lehet ránézésre ellenőrizni",
mint egy score — ezért a normogramot ugyanaz a kapu védi, mint a kalkulátort.

A jelenlegi állapot őszintén ki van mondva: a labor-referenciák
`verification: "assumed"` szinten állnak, és a validátor **egy összesített
figyelmeztetésben** meg is mondja, hányan és melyik forrás ellen. Változónként
kiírva elnyomná a valódi hibákat, pedig a teendő közös: a táblát egyszer, egyben
kell visszaellenőrizni.

**A modul 3. nyitott kérdése ezzel eldőlt:** a választott forrás
Abbassi-Ghanavati és mtsai (2009). Nem azért, mert egyedül helyes, hanem mert
**egyet kell választani, megnevezve** — különben két lelet két különböző készlet
szerint „normális".

## 4. Normogram-motor

`registry/normogramok/` — publikációból betölthető referencia, forrással,
populációval és ellenőrzöttségi szinttel. A motor z-értéket, percentilist és
sávot ad (`p<3` … `p>97`).

Három szabály:

1. **Nincs extrapoláció.** A tábla szélén túl nem számolunk. Egy 22–40 hétre
   készült tábla 41 hétre kiterjesztve nem hibát ad, hanem csendben rosszat.
2. **Nincs ellenőrizetlen tábla.** `verification !== "primary"` → percentilis
   nincs, teljes bemenettel sem.
3. **A forrás az eredmény része.** Két publikáció szerint ugyanaz a mérés más
   percentilisre esik. Ha egy paraméterhez több normogram van betöltve, a motor
   **nem választ magától** — kéri, melyiket.

```ts
set.evaluate(reg, st, "us.ac")
// két tábla mellett: { status: "insufficient", reason: "…nincs kiválasztva… — a forrás nem tetszőleges" }
```

## 4.1 Három üzemmód — mert három különböző kérdés

A normogram nem egyfajta dolog. Három eredet létezik, és **nem egymás
változatai**, hanem három külön kérdésre válaszolnak:

| `kind` | A kérdés, amire válaszol | Honnan | Kapu |
|---|---|---|---|
| `published` | *mihez képest szokás mérni?* | publikációból **telepítve** | hitelesítésig nem ad értéket |
| `local` | *mihez képest mérünk MI, ITT?* | a saját mérésekből **generálva** | ritka sávból nem ad értéket |
| `customised` | *mihez képest EZ a magzat?* | publikált alap + **demográfiai igazítás** | hiányzó demográfia → nincs érték |

### Telepíthető

```
node tools/install-normogram.ts --file tabla.csv --id ng.intergrowth.ac      --parameter us.ac --unit mm --source "INTERGROWTH-21st…"

node tools/install-normogram.ts --verify ng.intergrowth.ac      --by "Kovács A. (szülész-nőgyógyász)" --against "Lancet 2014;384:869-879"
```

**A telepítés és a hitelesítés két külön művelet, szándékosan.** A telepítés
adminisztratív: a tábla bekerül, látszik — de `assumed` szinten áll, tehát
percentilist nem ad. A hitelesítés szakmai felelősség, névvel és dátummal, és
ez nyitja a kaput. Ha ugyanaz a gomb csinálná mindkettőt, a kapu az első
sietős telepítéssel elveszne.

A CSV kétféle fejlécet fogad: `x,mean,sd`, vagy `x,p50,p10,p90` — utóbbiból a
szórás a 10. és 90. percentilis távolságából számolódik (2,563 szórásnyi).

### Öngeneráló

```
node tools/build-local-normogram.ts --parameter us.ac --cases <mérések>      --site "…" --min-per-bin 50
```

A publikált táblák más populáción készültek, és a saját betegkörünk átlaga
rendszeresen eltér tőlük. Négy szabály nélkül viszont a helyi tábla ártalmas:

1. **Kizárások nélkül a tábla a betegek populációját írja le, nem a
   normálisat.** A növekedési elmaradással gondozott eseteket benne hagyva a
   kóros lesz a norma. A generátor ezért kizárási szabályokat vár, és hiányuk
   figyelmeztetést ad.
2. **Ritka sávból nincs percentilis.** Nyolc esetből számolt szórással a
   százalék pontosnak *látszik*. A `minPerBin` alatti sávok **futásidőben sem**
   adnak eredményt — nem csak a generáláskor.
3. **A helyi tábla sosem lesz `primary`.** Nem publikált referencia, hanem a
   saját adataink leírása: más fajta, nem rosszabb minőség. A telepítő
   kifejezetten megtagadja a hitelesítését.
4. **Másodlagos adatfelhasználás.** A bemenet esetszinten azonosíthatatlan
   (mérésenként egy `x`–érték pár), a kimenet csak összesített szám. Egyedi
   mérés a táblából nem rekonstruálható.

Cserébe a helyi tábla — szemben az ellenőrizetlen publikálttal — **ad**
percentilist. Ez nem engedmény: a kapu azért létezik, mert egy publikáció
konstansait nem tudjuk ránézésre ellenőrizni. A saját adatainknál pontosan
tudjuk, hány esetből, milyen időszakból és milyen szűréssel készült — a
bizonytalanság nem rejtett, hanem **kiírt** (`n`, `derivedFrom`), és az
eredmény mindig `local`-ként jelenik meg.

### Személyre szabott (hibrid, demográfiai adatokkal)

Egy 150 cm-es és egy 180 cm-es anya magzatánál ugyanaz a populációs percentilis
mást jelent. A `customised` normogramnak **nincs saját táblája**: egy publikált
alapot igazít demográfiai tagokkal — anyai testmagasság, terhesség előtti
testsúly, paritás, magzati nem.

```ts
evaluateCustomised(reg, st, "ng.customised.ac")
// { percentile: 31.4, adjustment: { factor: 1.0714,
//   from: [{var:"anthro.height", value:180, effect:0.0595}, …] } }
```

Az igazítás **tételesen látszik**: melyik adat mennyit tolt rajta. Egy
igazított görbe, aminél nem tudni, mi igazította, ellenőrizhetetlen.

**Hiányzó demográfiai adatnál nem esünk vissza csendben** az igazítatlan
értékre — a motor megmondja, mi hiányzik. A visszaesés a *megjelenítés* dolga,
és ott láthatóan történik.

> **Amit szándékosan kihagytunk: az etnikum.** A publikált személyre szabott
> modellek (GROW) használják, de az etnikai hovatartozás a GDPR szerint
> különleges adat, a rögzítése önálló jogalapot és tájékoztatást kíván, és a
> „melyik kategóriába sorolják a beteget" kérdés a gyakorlatban az ellátó
> benyomásán múlik. A modell nélküle valamivel pontatlanabb; ezt vállaljuk, és
> kimondjuk.

### A hibrid nézet

```ts
evaluateHybrid(reg, st, "us.ac")
// [ { kind: "published",  result: { percentile: 8.2 } },
//   { kind: "local",      result: { percentile: 12.7, n: 80 } },
//   { kind: "customised", result: { percentile: 24.9 } } ]
```

**Nem választunk a klinikus helyett.** A három olvasat különböző kérdésre
válaszol, és a döntés az eltérésükből is születhet: ha a populációs szerint a
8. percentilis, a személyre szabott szerint a 25., az más beszélgetés, mint ha
mindkettő a 3. alatt van.

Ahol egy olvasat nem születik meg, ott az **oka** jelenik meg — nem üres hely,
és nem csendes visszaesés a másikra.

## 5. Szűrési esedékesség

`registry/szuresek/` — a szabály **adat**, nem kód: egy új szűrés felvétele nem
kíván fejlesztést. Hat állapot, és a hatodik a fontos:

```
notApplicable · upcoming · due · overdue · done · unknown
```

Az `unknown` azt jelenti, hogy a szabály feltételéhez **szükséges adat
hiányzik** — például nem tudjuk, volt-e korábban terhességi cukorbetegsége. Ez
nem ugyanaz, mint hogy a szűrés nem vonatkozik rá. Ha a kettő összemosódna, a
hiányzó anamnézis csendben szűrés-kihagyássá válna.

Két további részlet, ami a valóságból jön:

- **A részleges vizsgálat nem elvégzett.** A háromértékes OGTT-ből csak az éhomi
  érték rögzítve → a szűrés továbbra is `due`. A GDM-esetek egy része csak az
  éhomi vagy az 1 órás értéken bukik ki.
- **Az elmulasztott ablak nem tűnik el.** A 11–14. heti kombinált szűrés a 20.
  héten `overdue` marad, nem `notApplicable` — mert a betegnek joga van tudni,
  hogy a lehetőség elmúlt, és mert a minőségi mutató ebből számol.

Az esedékesség két különböző alapon mérhető (`window.by`): a terhesgondozási
szűréseknél `ctx.ga` (hét), az életkorhoz kötötteknél `patient.age` (év). Az
ismétlődőknél `repeatEvery` mondja meg, mikor évül el egy elvégzett szűrés.

## 6. Ami még hátravan

- **A referenciatáblák visszaellenőrzése** az elsődleges forrással. Amíg ez nem
  történt meg, a szint `assumed`, és a validátor kimondja.
- **Valódi normogramok betöltése.** A regiszterben egy publikált példa-tábla
  áll `assumed` szinten (a motor működik, percentilist szándékosan nem ad), egy
  szintetikus adatból generált helyi tábla, és egy személyre szabott igazítás.
  Ez a helyes kiindulási állapot: a kapu előbb van, mint az adat. A telepítő és
  a generátor készen áll, valódi tábla és valódi mérések kellenek hozzájuk.
- **Az LMS-módú normogram** (Cole-féle L, M, S paraméterek) a ferde eloszlású
  paramétereknél pontosabb, mint az átlag+szórás alak. A motor ma csak az
  utóbbit ismeri; a bővítés az adatszerkezetet érinti, a kapukat nem.
- **A szűrési szabályok kiterjesztése** az emlőszűrésre és a mentális
  szűrésekre (Whooley, EPDS) — az utóbbi a `08` modulra vár.
