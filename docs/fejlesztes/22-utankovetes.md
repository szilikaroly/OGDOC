# 22 — Utánkövetés: hat hiány, ami nem ugyanaz

> Egy „hiányzó változók" lista a legkényelmesebb hazugság, amit egy export
> mondhat. Ez a modul arról szól, miért hat kategóriára bomlik — és arról, hogy
> a legfontosabb szám nem az exportban van, hanem a nevezőben.

## 1. „82% teljesség" — a szám, ami hármat rejt el

Az elfogadási kritérium azt kéri, hogy az export mellé kiíródjon, „mely
kötelező változók maradtak üresen". Ha ezt egyetlen listába tennénk, három
teljesen különböző problémát mosnánk össze — és mindhármat MÁS EMBER javítja:

| Kategória | Mit jelent | Ki javítja |
|---|---|---|
| `present` | megvan | — |
| `missing` | **van mezőnk, de üres** | a beteget vagy a dokumentációt kell megkérdezni |
| `unmapped` | **nincs ilyen mezőnk** | fejlesztő |
| `notCollected` | szándékosan nem gyűjtjük | senki — ez döntés, nem hiba |
| `conditional` | feltételes tétel, a feltétel szabad szöveg | **géppel nem eldönthető** |
| `notOccurred` | ellenőrizve, nem következett be | — |
| `excludedPhi` | azonosít, ezért kimarad | — |

```
A 42 days postpartum időponthoz az ICHOM 125 tételt sorol. Ebből 11 kitöltve,
6 ÜRES (adatgyűjtési hiány), 35 tételhez NINCS mezőnk (fejlesztői feladat),
2 tételt szándékosan nem gyűjtünk, 72 feltételes tétel géppel nem értékelhető
ki, 1 azonosító kimarad. EZEK NEM ADHATÓK ÖSSZE.
```

Az `unmapped` és a `missing` összemosása a legkárosabb: ha egy fejlesztői
lemaradás „hiányzó adatnak" látszik, senki nem fogja megcsinálni a mezőt — az
adatgyűjtésen fogják kérni számon.

### A feltételes tétel, amit nem értékelünk ki

Az ICHOM `inclusion` mezője **szabad szöveg**: *„If answered 2 = WHODAS
V2.0-12 to HR-HSQoL"*. A 42. napos ponton 125 tételből **72 ilyen**. Ezeket
géppel nem lehet kiértékelni, és a rendszer nem is tesz úgy, mintha tudná:

> „A feltétel SZABAD SZÖVEG az ICHOM-specifikációban, ezért géppel nem
> értékelhető ki. A rendszer nem tesz úgy, mintha eldöntötte volna: a tétel se
> nem hiány, se nem kész."

### Amit szándékosan nem gyűjtünk

Az etnikum (PCB005) és a „race" (PCB006) az ICHOM **kötelező** tétele. A
rendszer nem gyűjti: a GDPR szerint különleges adat, és a besorolás a
gyakorlatban az ellátó benyomásán múlik — ugyanaz az érv, amiért a személyre
szabott növekedési görbéből is kimaradt. Ez **politikai döntés**, és épp ezért
nem szabad ugyanabba a listába kerülnie, mint az elmaradt adatfelvétel. Az
export az indoklást is kiírja, hogy a fogadó tudja: nem elfelejtettük.

## 2. Egy dátummező nem tud nemet mondani

Ez a modul egyetlen olyan hibája, amit **csak a kimenet elolvasása** hozott
elő. Az anyai halál, a halvaszületés és az újszülöttkori halál ICHOM-tétele
DÁTUM. Ha az esemény nem történt meg, a mező üres — de üres akkor is, ha senki
nem nézett utána, és a kettő ugyanúgy néz ki.

Ez itt nem elméleti: **a 42 napon belüli anyai halál nagy része az intézményen
kívül következik be**, és csak akkor kerül a rendszerbe, ha valaki ténylegesen
utánanéz.

A nemleges tényt ezért külön mező mondja ki (`out.maternal.alive`,
`out.neonate.alive`, `out.birth.outcome`), és az export csak ennek alapján
minősít egy üres dátumot jogosnak (`notOccurred`). Amíg nincs meg, az üres
dátum HIÁNY marad — a figyelmeztetéssel együtt, hogy hol kell kimondani a
nemleges tényt.

A „nem tudom" válasz nem zárja le a kérdést: az is `missing`.

## 3. A durvább értéket számoljuk ki, nem a finomabbat exportáljuk

Az ICHOM a születési **évet** kéri (PCB001). A születési **dátum** `phi`
jelölésű, és az exportból kimarad. Ahelyett, hogy a dátumot maszkolnánk, a
belőle levezetett évet számoljuk ki — `calc.birthYear` —, és az kerül az
exportba.

Ez a de-identifikálás legolcsóbb formája: **nem elrejtünk valamit, hanem eleve
kevesebbet számolunk ki.** Ahol ez megtehető, ott a maszkolás felesleges
kockázat: egy elfelejtett maszk adatszivárgás, egy ki nem számolt érték nem az.

A beteg-azonosító tétel (PCB000) minden mérési ponthoz tartozik („On all
forms"), és minden exportban **láthatóan** kimarad — nem csendben kiszűrve,
mert akkor az export nem mondaná meg, hogy volt mit kihagyni.

## 4. A nevező, ami nélkül a mutató hízeleg

Egyetlen eset exportja semmit nem mond a torzításról. Ha a kimeneteli
mutatókat csak a **visszatérő** betegekből számoljuk, a mutató az intézményt
hízelgi: **aki rosszul járt, gyakrabban nem jön vissza.**

```ts
cohortCompleteness(exports)   // válaszarány 50%
// "VÁLASZARÁNY 50% (2/4) — a mutató összehasonlításra NEM közölhető. Aki
//  rosszul járt, gyakrabban nem jön vissza: a hiányzó 2 eset nem
//  véletlenszerűen hiányzik, és a számított kimenetel ezért a valóságosnál
//  jobb."
```

Ebből következik a mérési pontok egyetlen kemény szabálya:

> **Az elmulasztott mérési pont nem tűnik el.**

A lezárult ablak `overdue` marad — nem lesz belőle sem „kész", sem „nem
esedékes". A `done` állapot az ADATTÓL függ, nem az időtől. És horgony
(`nb.birth.at`) nélkül a pont `unknown`, nem „nem esedékes".

## 5. Újszülöttellátás: a funkció előbb, a pontszám utána

Az Eat-Sleep-Console lényege a **sorrend**: előbb azt kérdezzük, hogy a
csecsemő eszik-e, alszik-e és megnyugtatható-e, és csak ha nem, akkor jön a
tünetpontozás.

```ts
assessEsc(reg, state).recommendation
// "MIND A HÁROM FUNKCIÓ MEGFELELŐ: farmakoterápia NEM szükséges. …
//  A Finnegan-pontozás ilyenkor nem indokolt — egy magas pontszám sem írja
//  felül azt, hogy a csecsemő eszik, alszik és megnyugtatható."
```

Ez nem stílus: az ESC-NOW vizsgálat (NEJM 2023;388:2326, N = 1305) szerint így
6,7 nappal rövidebb a kórházi tartózkodás, és a farmakoterápia relatív
kockázata 0,44. A Finnegan tételeinek jó része nem specifikus (tüsszentés,
izzadás), és a pontszám alapján indított kezelés önmagában is hosszabbít.

Hiányzó válasznál nincs döntés — és a szöveg kimondja, hogy **a hiányzó válasz
nem jelenti azt, hogy a csecsemő jól van**. A Finnegan-küszöb két mérés alatt
`insufficient`, nem „nem teljesül".

### A megfigyelési idő, ami a szertől függ

| Expozíció | Minimum | Miért |
|---|---|---|
| heroin / rövid hatású | 72 óra | tünetkezdet 24–48 óra |
| buprenorfin | 96 óra | hosszabb felezési idő |
| **metadon** | **168 óra (7 nap)** | tünetkezdet 48–72 óra, **akár 5–7 nap** |
| ismeretlen / vegyes | 168 óra | a leghosszabb ismert ablak |

A korábbi elbocsátás nem gyorsítja a gyógyulást — **áthelyezi a tüneteket az
otthonba, ahol nincs, aki felismerje.** Ismeretlen expozíciónál a `canDischarge`
hamis: a hiányzó adat itt sem jelent expozíciómentességet.

### Súlyalapú adagok

`calc.nrp.epi.iv` (0,02 mg/ttkg), `calc.nrp.volume` (10 mL/ttkg),
`calc.neo.dextroseGel` (0,5 mL/ttkg). Súly nélkül **nincs szám** — és ez a
helyes viselkedés: egy „átlagos újszülöttre" becsült adag újraélesztés közben
nem segítség.

Az epinephrinnél a mező dokumentációja kimondja azt, amit a milligramm nem: a
gyakorlatban a **térfogat** számít (1:10 000 hígításnál 0,2 mL/ttkg), és a
hígítás elrontása nagyságrendi tévedés.

## 6. LATCH: a hatodik eszköz a licenc-kapu mögött

A LATCH szoptatási skála a kérdőívtörzsbe került, `notLicensed` tételszöveggel
— tehát **nem vehető fel**, mint az EPDS, a PHQ-9, az MSPSS és az MIBS. A
pontértékek kódlistája szándékosan címke nélküli („0 pont", „1 pont"): a
pontok mögötti leírás licencköteles, és saját megfogalmazással a pontozás nem
LATCH.

Az „≤ 5 → IBCLC-konzultáció" vágóérték a **törzsben** van, nem kódban — készen
arra a napra, amikor a licenc megérkezik.

A skála dokumentációja egy dolgot külön kiemel: **az összpontszám elfedi a
tételt.** Egy 8 pontos összeg is jelenthet 0 pontos „kényelem" tételt — vagyis
fájdalmas szoptatást, ami önmagában beavatkozást indokol.

## 7. Tesztek

[`test/utankovetes.test.ts`](../../test/utankovetes.test.ts) — 33 teszt:

- az export soha nem tartalmaz beteg-azonosítót;
- a hiányzó ADAT és a hiányzó MEZŐ két külön kategória, más indoklással;
- a szabad szövegű feltételt géppel nem értékeljük ki;
- az üres haláleset-dátum hiány, amíg valaki nem mondja ki a nemleges tényt;
- a lezárult ablak elmulasztott marad;
- alacsony válaszarány mellett a mutató nem közölhető összehasonlításra;
- mind a három ESC-funkció megfelelő → nincs farmakoterápia;
- metadonnál a megfigyelés hét nap;
- súly nélkül nincs újszülött-adag.
