# 19 — Onkológia: a kód, ami megmaradt, de mást jelent

> A 12. modul két dolgot hozott elő, és a fontosabbik nem onkológiai. A
> **verziózott kódlista** a magba tartozó hiányosság volt, ami véletlenül itt
> bukott ki; a **megosztott döntéshozatal kapuja** viszont pontosan azért néz
> ki így, mert a terhesség alatti daganat problémája ilyen.

## 1. A verziószám kevés, ha maga a lista változik

A rendszer eddig is bélyegezte a kódrendszer verzióját minden rögzített
értékre (`codeSystem.version`). Ez arra elég, hogy megmondjuk: ez az adat a
2009-es rendszer idején keletkezett. Arra **nem** elég, hogy a régi adatot
helyesen olvassuk fel — ahhoz a régi **lista** is kell.

Három választ kell tudni adni egy régi kódról:

| Kérdés | Válasz |
|---|---|
| Mi volt akkor? | a rögzítéskori lista címkéje |
| Létezik-e ma? | vagy visszavonták (`retired`) |
| **Ugyanazt jelenti-e?** | vagy a jelölés maradt, a tartalom nem (`meaningChanged`) |

A harmadik a veszélyes, mert **csendes**. A kód feloldódik, a címke megjelenik,
és senki nem tudja meg, hogy mást olvas, mint amit írtak.

```ts
readCode(reg, "onc.gyn.figo.cervix", "IB1", "2009")
// { label: "IB1 — ≤ 4 cm (2009 szerint)",
//   version: "2009", currentVersion: "2018",
//   retired: false, meaningChanged: true,
//   currentLabel: "IB1 — ≤ 2 cm",
//   caveat: "FIGYELEM: a kód ma is létezik, de MÁST jelent — akkor
//            „IB1 — ≤ 4 cm (2009 szerint)”, ma „IB1 — ≤ 2 cm”. …" }
```

Egy 2015-ös „IB1” tehát legfeljebb 4 cm-es daganatot jelentett; egy 2020-as
„IB1” legfeljebb 2 centiméterest. **Ugyanaz a jelölés, más tartalom.** Ha a
régi adatot a mai lista szerint olvassuk fel, a beteg daganata a
dokumentációban feleakkora lesz, mint amekkora volt — és semmi nem jelzi.

### A megszűnt kód nem hibás adat

```ts
readCode(reg, "onc.gyn.figo.endometrium", "IA", "2009")
// retired: true
// "A kód a MAI listán már nem szerepel — az érték a saját verziója szerint
//  helyes, de a mai rendszerbe nem fordítható át automatikusan."
```

A 2023-as endometrium-rendszerben nincs önálló „IA”: helyette `IA1`, `IA2`,
`IA3` van, és a besorolást a molekuláris profil is módosítja. A régi érték
attól még **érvényes** — csak nem konvertálható. A rendszer ezért nem
konvertál. A hamis átfordítás rosszabb, mint a nyíltan vállalt
összehasonlíthatatlanság.

### Az aszimmetria, ami szándékos

| Művelet | Melyik listából? |
|---|---|
| **Olvasás** | a rögzítéskori verzióból |
| **Írás** | kizárólag a jelenlegiből |

Új értéket régi verzió szerint felvenni nem lehet. Ez nem korlátozás, hanem a
verziózás értelme: ha visszamenőleg bármikor rögzíthető lenne 2009-es kód, a
verzióbélyeg semmit nem bizonyítana.

### Amit a validátor őriz

A `validateVersionedCodes()` négy dolgot kényszerít ki:

- verziózott lista **kódrendszer megnevezése nélkül** hiba;
- a **jelenlegi** verzió nem szerepelhet a korábbiak közt (az a `valueSet`-ben él);
- üres vagy ismétlődő verzió hiba;
- **érvényességi vég nélküli** korábbi verzió figyelmeztetés — enélkül nem
  állapítható meg, mikortól kell az újat használni.

Ez a mechanizmus **nem onkológiai**. Az OENO, a BNO és minden más évente
frissülő kódrendszer ugyanígy fogja használni; az onkológia csak az első hely,
ahol a hiánya konkrét kárt okozott volna.

## 2. A kapu, ami nem a döntést kényszeríti ki, hanem a beszélgetést

A modul elfogadási kritériuma két különböző dolgot ígér, és a különbség a
lényeg: az első fele **tájékoztat**, a második **kikényszerít**.

```ts
pregnancyOncAdvice(reg, state).sharedDecision
// { documented: false, canProceed: false,
//   missing: ["onc.preg.decision.options"], reason: … }
```

A terhesség folytatásának vagy befejezésének kérdése **nem orvosi döntés**. A
rendszer nem tudja meghozni, és nem is szabad úgy tennie, mintha tudná. Amit
megtehet: nem engedi, hogy a döntés a beszélgetés nélkül szülessen meg.

### Miért kell KÉT mező

A kapu csak akkor nyílik, ha **mindkettő** megvan:

| Mező | Mit bizonyít |
|---|---|
| `onc.preg.sharedDecision` | volt megosztott döntéshozatal |
| `onc.preg.decision.options` | **mely lehetőségek** kerültek szóba |

A pipa önmagában kipipálható anélkül, hogy bármi történt volna. A felsorolt
lehetőségek nem. És ami ennél is fontosabb:

> **Az egyetlen felkínált út melletti beleegyezés nem döntés.**

Ha a beszélgetésben csak a kezelés halasztása szerepelt, a beteg beleegyezett
valamibe — de nem választott. A `decision.options` mező pontosan ezt teszi
láthatóvá, és ezért szöveges: a kódlista itt előre eldöntené, mi a felkínálható.

## 3. Modalitások trimeszter szerint

A `pregnancyOncAdvice()` négyértékű választ ad modalitásonként
(`yes · conditional · no · unknown`), mindegyiket indoklással és forrással.

| Modalitás | I. trimeszter | II–III. trimeszter |
|---|---|---|
| Műtét | igen | igen |
| Kemoterápia | **nem** | feltételes |
| Sugárterápia | nem | feltételes |
| Célzott terápia | nem | nem |
| Immunterápia | nem | nem |

A `conditional` nem udvarias „talán”: a feltétel ki van mondva. A
kemoterápiánál például, hogy **a 35. hét után nem kezdendő új ciklus**, és
hogy a szülés előtt **legalább három hét** kell a csontvelő-mélypont miatt —
különben az anya és az újszülött is cytopeniásan érkezik a szülésbe.

### Gesztációs kor nélkül nincs válasz

```ts
pregnancyOncAdvice(reg, {}).modalities.every(m => m.feasibility === "unknown")
// true
```

Ez a rendszer legtöbbet ismételt szabályának egy újabb példánya: **a hiányzó
adat sehol nem „nem”**. Itt azonban erősebb az indok a szokásosnál. A válasz
trimeszterenként **az ellenkezőjére fordul**: ami a 8. héten kontraindikált, az
a 20.-on adható. Egy alapértelmezett „nem” nem óvatos volna, hanem téves.

### Az adathiány nem biztonságosság

Az immunterápia indoklása kimondja: *„Terhességben nincs elegendő adat… Az
adathiány NEM biztonságosságot jelent."* A megkülönböztetés azért kell, mert az
ellenkező irányú tévedés is létezik: ha egy szerről nincs káros adat, az
könnyen olvasható úgy, hogy ártalmatlan.

### A keret nem kezelési terv

Minden válasz mellett ott a `caveat`: az eset **multidiszciplináris csapat**
elé tartozik, amelyben a szülész és a neonatológus is részt vesz. A modul
kerete általános; a konkrét szer, a stádium, a szövettan és a beteg
értékrendje mind módosítja.

## 4. Két kisebb, de ugyanolyan szerkezetű döntés

**A „nem került szóba" fertilitásmegőrzés vörös zászló.** Az
`onc.fertility.discussed` mezőben nem a „nem történt fertilitásmegőrzés"
válasz jelölt, hanem az, hogy **fel sem merült**. A megőrzés elutasítása a
beteg joga; a fel nem ajánlása viszont visszafordíthatatlan mulasztás, mert az
időablak a kezelés megkezdésével bezárul.

**A bizonytalan jelentőségű variáns nem pozitív lelet.** Az `onc.gyn.germline`
VUS-értéke `unknown` jelöléssel szerepel, nem pozitívként. A VUS-ra alapozott
profilaktikus műtét a genetika legdrágább hibája, és a rendszer nem
segítheti elő azzal, hogy a listában a pozitív mellé sorolja.

## 5. Amit a modul NEM tartalmaz

| Hiányzik | Miért |
|---|---|
| RECIST 1.1 kiszámítása | a mérhető léziók nyilvántartása példány-dimenziót kíván (ld. [12.](12-peldany-dimenzio.md)); jelenleg csak a **válaszkategória** rögzíthető |
| CTCAE teljes tételsora | a toxicitás grádusa rögzíthető, de a szervrendszerenkénti tételsor több száz tétel — külön feltöltési feladat |
| Kemoterápiás protokollok törzse | a protokoll ma szabad szöveg (`onc.tx.protocol`); a kódolt törzs a 06. modul gyógyszertörzsére épülne |
| TNM | a FIGO mellett a TNM önálló verziózott rendszer; ugyanezzel a mechanizmussal vehető fel, de még nincs benne |

Ez a modul kapta a legalacsonyabb prioritást a tervben, és a katalógus
feltöltöttsége ezt tükrözi: **21 változó a becsült 120-ból**. Ami elkészült, az
a két olyan rész, ami nélkül a többi sem lenne értelmezhető — a stádium
olvashatósága és a döntés dokumentálása.

## 6. Tesztek

[`test/onkologia.test.ts`](../../test/onkologia.test.ts) — 22 teszt:

- a régi kód a saját verziója szerint olvasható;
- a megszűnt kód megszűntként, nem ismeretlenként jelenik meg;
- a megmaradt, de mást jelentő kód figyelmeztetést kap;
- új érték csak a jelenlegi listából vehető fel;
- a modalitások trimeszterenként;
- gesztációs kor nélkül egyik modalitásról sem mondunk semmit;
- a pipa önmagában nem elég a kapu nyitásához.
