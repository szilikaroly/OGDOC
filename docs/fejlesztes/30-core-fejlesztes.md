# 30 — A mag fejlesztése: alapok, célok, naplózás, minőség, sebesség, mentés

*Ez a dokumentum nem azt írja le, mit csinál a mag — azt a
[`01-core-api.md`](01-core-api.md) teszi. Azt írja le, hogyan fejlesztjük, és
mihez mérjük.*

---

## 0. Egy mondat, amiből a többi következik

> **A mag egy tiszta függvénykönyvtár, ami betegadatot dolgoz fel, és soha nem
> dönt a gazdája helyett.**

Minden szabály ebből vezethető le. Nem ír lemezre, nem naplóz, nem hív hálózatot,
nem ismer felületet — hanem **tényt ad vissza**, a hozzá tartozó indoklással.
Amikor valami nem megy, nem hallgat el semmit: megmondja, mi hiányzik.

---

# 1. Alapok

## 1.1 A négy szerkezeti szabály

| Szabály | Mit véd | Hogyan kényszerítjük ki |
|---|---|---|
| **A szabály adat, nem kód** | egy új változóhoz ne kelljen fejlesztő | húsz regiszter, mind validált; a felvétel JSON |
| **Nincs néma helyettesítés** | a kitalált érték rosszabb a hiányzónál | hiányzó bemenetnél `insufficient`, nem nulla |
| **A kapu előbb van, mint az adat** | ellenőrizetlen konstans → hamis szám | `verified: false` → teljes bemenettel sem ad eredményt |
| **A mag DOM- és I/O-mentes** | portolhatóság és tesztelhetőség | teszt tiltja a `console.*` hívást a `core/`-ban |

A negyedik a legkevésbé látványos és a leggyakrabban megsértett. Egy könyvtár,
ami ír valahova, **eldönti a gazdája helyett, mi fontos**, és beleír egy
csatornába, amit nem ő tart karban. A `core/` ezért **egyetlen `console.*`
hívást sem tartalmaz** — és ezt teszt őrzi, nem szokás.

## 1.2 Amiből a mag áll

75 fájl, **15 367 sor**. A legnagyobb egységek:

| Egység | Sor | Mit csinál |
|---|---:|---|
| `core/coding/` | 1843 | BNO, beavatkozási törzsek, SNOMED-szerkezet, érvényesség |
| `core/calc/` | 1830 | a kalkulátor-réteg és minden képlet definíciója |
| `core/ui/` | 1416 | űrlapleírás, felülettérkép-audit, mértékegység-megjelenítés |
| `core/us/` | 1041 | normogramok, görbekatalógus, magzati anatómia |
| `core/derive/` | 574 | **a levezetési motor — a rendszer szíve** |
| `core/log/` | 155 | a naplózási szerződés (a mag maga nem naplóz) |

A `core/derive/` a legkisebbek egyike, és mégis ez a rendszer szíve: minden
érték rajta megy keresztül.

## 1.3 A függőségi szabály

**Nulla futásidejű függőség.** Nincs `dependencies` a `package.json`-ban, nincs
build-lépés, nincs bundler. `node --experimental-strip-types` futtatja a
TypeScriptet közvetlenül.

Ez nem purizmus, hanem **húszéves horizont**: egy klinikai rendszer élettartama
hosszabb, mint bármelyik mai keretrendszeré. Ami ma kényelem, az öt év múlva
migrációs projekt. A cserébe vállalt ár: néhány dolgot magunk írunk meg — és
ezt tudatosan vállaljuk.

Következmény a nyelvre: a Node 22 „strip-only" módja **nem fordít, csak töröl**.
Nincs `enum`, nincs paraméter-tulajdonság a konstruktorban, nincs
`namespace` — minden típusnak törölhetőnek kell lennie.

---

# 2. Célok

## 2.1 Mit jelent, hogy a mag kész

Nem a modulok száma. Négy állítás, mindegyik eldönthető:

1. **Egy új változó felvételéhez nem kell kódot írni.** *(Ma igaz.)*
2. **Semmilyen hiányzó adat nem válik „nem"-mé.** *(Ma igaz, hét helyen tesztelve.)*
3. **Minden szám mögött ott a forrása, és hitelesítés nélkül nem fut.** *(Ma igaz;
   hét kalkulátor áll kapu mögött.)*
4. **A rendszer valódi betegadaton futhat.** *(Ma NEM igaz — ez a
   [18 lépés](../13-18-lepes.md) 1. lépése.)*

## 2.2 A nem-célok

Amit szándékosan **nem** csinálunk, és miért:

| Nem-cél | Miért |
|---|---|
| általános EHR | a szülészet-nőgyógyászat mélysége a cél, nem a szélesség |
| saját felhasználókezelés | a platform (IntuiCare) adja; kettőt karbantartani hiba |
| offline-first szinkronizáció | konfliktusfeloldás betegadaton — külön projekt |
| saját UI-keretrendszer | a mag DOM-mentes; a felület cserélhető |
| „AI, ami diagnosztizál" | a modell a klinikus **mellé** áll, nem helyette |

Az utolsó a legfontosabb, és négy független helyen jelenik meg a rendszerben —
a PUL-modell melletti szubjektív benyomástól a gépi CTG-olvasat melletti
vizuális olvasatig.

---

# 3. Naplózási technika

## 3.1 Két napló, és a kettő összekeverése a leggyakoribb hiba

| | **Működési napló** | **Auditnapló** |
|---|---|---|
| Kinek | fejlesztőnek | jogszabálynak, betegnek, hatóságnak |
| Mire | hibakeresés | ki mit mikor olvasott és írt |
| Élettartam | napok–hetek | **eltér a leletétől**, jellemzően hosszabb |
| Módosítható | igen | **soha** |
| Betegadat | **SOHA** | azonosító igen, érték nem |
| Ha nem tud írni | a művelet megy tovább | **a művelet elbukik** |

Az utolsó sor a legkeményebb szabály: **a naplózhatatlan olvasás jogilag meg
nem történt olvasás.** A csendben elveszett auditsor rosszabb, mint a leállás,
mert utólag nem lehet megállapítani, ki látta a beteget.

A szétválasztás nem elvi finomság: a működési napló hibakeresés közben kikerül
fejlesztői gépre, jegyre, képernyőképre — az auditnapló soha.

## 3.2 A mag nem naplóz, hanem tényt ad vissza

A `core/` minden elutasításhoz megírja a **miért**-et:

```ts
runCalc(reg, state, "calc.efw.hadlock")
// → { status: "gated", reason: "A képlet konstansai nincsenek
//      visszaellenőrizve az elsődleges közleménnyel…" }
```

Ezek a mondatok **már meg vannak írva**, emberi nyelven, a klinikus számára
érthetően. A gazda dolga eldönteni, hogy naplósorba, képernyőre vagy a
dokumentum aljára kerülnek — a magé az, hogy legyen mit odaírni.

## 3.3 Az auditsor négy kötelező eleme

`core/log/types.ts` → `checkAudit()`, és a hívónak a művelet **előtt** kell
lefuttatnia:

| Elem | Mit nem fogadunk el |
|---|---|
| **ki** (`actor`) | „a rendszer" — megnevezett személy vagy megnevezett folyamat |
| **mit** (`action`) | — |
| **min** (`caseId`) | — |
| **miért** (`basis`) | üres. Jogalap nélkül az auditsor azt rögzíti, hogy valaki hozzáfért; azt nem, hogy **joga volt** hozzá |

És egy ötödik, ami könnyen kimarad: az **elutasított** hozzáférésnek is van
sora, indoklással. *Az elutasítás oka legalább annyira lelet, mint a hozzáférés
ténye* — abból derül ki, ha valaki rendszeresen próbálkozik.

## 3.4 A szivárgás ellen: megnevezés, nem csendes tisztítás

`auditRedaction()` két úton fog:

1. **a regiszterből** — a `phi: true` jelölésű változók azonosítói;
2. **névmintából** — `taj`, `anyja`, `lakcim`, `email`, `szig`… mert a
   naplósorba **kézzel írt kulcs is kerül**, és éppen az a veszélyes: azt
   semmilyen regiszterbeli jelölés nem védi.

Plusz egy heurisztika: **200 karakternél hosszabb szabad szöveg magától
gyanús** — ez a leggyakoribb szivárgási út, mert senki nem olvassa el, mi
került bele.

**És nem javít, hanem megnevez.** A csendben megtisztított napló arról hazudik,
hogy a hívó rendben írt; a megnevezett szivárgás javítható. Ugyanaz a szabály,
mint mindenütt: nem hallgatunk el.

## 3.5 Amit a naplóba írunk

```ts
{ kind: "op", level: "info", where: "derive.recompute",
  message: "43 levezetett mező újraszámítva",
  caseId: "eset-1", traceId: "req-88",
  data: { elapsedMs: 9, changed: 3 } }
```

Számok, azonosítók, időtartamok. **Értékek soha.** A `caseId` álnevesített
kulcs: önmagában nem azonosít beteget, de a sorokat összefűzi — a `traceId`
pedig egy műveleten belül köti össze őket.

---

# 4. Kód és minőség

## 4.1 A minőség mérőszáma nem a lefedettség

**710 teszt, 0 hiba.** De a lefedettségi százalék félrevezető: egy `getter`
letesztelése ugyanannyit ad hozzá, mint annak bizonyítása, hogy hiányzó
asztma-anamnézis mellett a carboprost nem indul el.

Amit helyette mérünk:

| Mérőszám | Ma | Mit jelent |
|---|---:|---|
| **build-hibát okozó állítások** | 20 regiszter | ennyi hiba nem kerülhet be egyáltalán |
| **elfogadási kritérium mint teszt** | 4 modul | a modul saját ígérete futtatható |
| **kapu mögötti kalkulátor** | 7 | ennyi képlet nem ad számot, mert nincs hitelesítve |
| **szándékos figyelmeztetés** | 88 | ennyi ismert hiány van KIMONDVA, nem elrejtve |

Az utolsó a legfontosabb, és a legkönnyebben félreérthető: **a 88
figyelmeztetés nem technikai adósság.** Nagy részük olyan tétel, ami
hitelesítésre vagy licencre vár — a rendszer nem elrejti, hanem minden
futásnál kimondja.

## 4.2 A validátor: a hibát nem javítjuk, hanem lehetetlenné tesszük

Amit a `npm run validate` **hibaként** dob (nem figyelmeztetésként):

- két primer változó azonos LOINC-kódra mutat;
- egy képlet mértékegysége eltér a változójától;
- egy dokumentum nem létező mezőt vár;
- egy panasz nem létező mezőt nyitna;
- egy leképezés nem létező változóra mutat — *az elavult leképezés rosszabb a
  hiányzónál, mert megvalósítottnak látszik*;
- SNOMED-tartalom kerülne a repóba;
- hitelesítetlen protokoll riasztást adna.

Ezek nem stílusszabályok. Mindegyik mögött van egy hiba, ami **utólag nem
javítható**: egy rossz LOINC-kód exportált adatot ront el, egy néma
egységváltás gyógyszeradagot.

## 4.3 Amit a rendszer saját magán fogott meg

A legjobb érv a validátor mellett nem elméleti:

| Mit fogott meg | Hogyan |
|---|---|
| a fullPIERS dokumentált együtthatóival **fordítva viselkedik** | saját teszt |
| a `diet.allergies` változó nem létezik | leképezés-ellenőrzés |
| a BMI-mező `calc.bmi`-re mutatott, a valódi név `anthro.bmi` | ugyanaz |
| a szepszis-kalkulátor bekötetlen maradt | *„a be nem kötött kalkulátor holt kód, ami észrevétlenül elavul"* |
| az artériás középnyomás a vérnyomásból számítódik → **kettős számolás** | levezetési gráf |
| a `NaN` egy hibaüzenetben, egymásba ágyazott sablonliterál miatt | a szöveg kinyomtatása |

Az utolsó tanulsága külön ér valamit: **a generált szöveget ki kell nyomtatni és
elolvasni.** Egy `NaN` a mondat közepén nem bukik el semmilyen típusellenőrzésen.

## 4.4 Kódstílus — három szabály, ami nem ízlés

1. **A komment azt mondja meg, MIÉRT, nem azt, hogy MIT.** A „mit" a kódból
   látszik; a „miért" fél év múlva nem.
2. **A hibaüzenet a felhasználónak szól, nem a fejlesztőnek.** Minden `why`
   mondat úgy van megírva, hogy klinikus is értse — mert oda is kikerül.
3. **A magyar szöveg magyar idézőjellel.** A `„…”` idézőjelben a záró jel `”`,
   nem `"` — a TypeScript strip-only módja az utóbbin szintaktikai hibát dob.

## 4.5 A commit

Minden commit megmondja, **mi változott a rendszer viselkedésében** — nem azt,
mely fájlok módosultak. És ha hibát követtünk el, azt a commit üzenete kimondja:
egy elhallgatott hiba a következő fejlesztőt is megfogja.

---

# 5. Sebesség

## 5.1 A küszöbök nem önkényesek

| Határ | Mit jelent |
|---:|---|
| **16 ms** | egy képkocka 60 Hz mellett — ennél lassabb művelet **akadás** |
| **100 ms** | az „azonnali" érzet határa — eddig nem kell visszajelzés |
| **1 s** | a gondolatmenet még nem szakad meg |

**Miért számít ez klinikai kérdésnek.** A projekt legnagyobb kockázata nem
technikai: *ha a kódolt bevitel lassabb a gépelésnél, a klinikus kikerüli* —
és akkor minden strukturált adatra épülő ígéret elvész. A sebesség itt nem
kényelmi kérdés, hanem az, hogy a rendszert használják-e egyáltalán.

## 5.2 A mért értékek

`npm run bench` — medián, nem átlag (egy szemétgyűjtés az átlagot elhúzza; a
klinikus a **tipikusat** éli meg). A számok EGY gépen mértek, és a terheléstől
függenek: **a nagyságrendek aránya a lényeg, nem a tizedesjegy** — és a bench
bármikor újrafuttatható. A doksiba írt szám elavul; a parancs nem.

| Művelet | Medián | Érzet |
|---|---:|---|
| regiszter betöltése (846 változó, lemezről) | 9,60 ms | folyamatonként **egyszer** |
| egy érték feloldása (`resolve`) | < 0,001 ms | a leggyakoribb művelet |
| **egy érték írása + a függők újraszámítása** (`setValue`) | **0,001 ms** | **ez fut billentyűleütésenként** |
| egy kalkulátor futtatása (`calc.bmi`) | 0,001 ms | |
| teljes újraszámítás (`recompute`) | 9,88 ms | betöltéskor és importkor |
| felülettérkép betöltése (1106 mező) | 2,20 ms | |
| felülettérkép auditja (1106 mező) | 2,45 ms | nem interaktív út |

A teljes ellenőrzés: `npm run validate` **1,4 s**, `npm test` **5,5 s**,
`npm run check` **8,9 s**. Ez a fejlesztői visszacsatolás ideje — és azért
tartjuk 10 s alatt, mert ami ennél lassabb, azt a fejlesztő nem futtatja le
minden mentés előtt.

## 5.3 Az egyetlen hely, ahol lassulás várható

A `recompute` **9,88 ms**, és a mérés egy meglepő dolgot mutat:

> **Üres eseten 9,76 ms. 174 rögzített értékkel 9,49 ms.**
> A költség **nem az adattól függ.**

A profil megmondja, hol van: a `DerivationGraph` **megépítése 0,15 ms**, a
`topologicalOrder()` viszont **9,38 ms** — és mindkettő **minden hívásnál
újrafut**, pedig a regiszter futás közben nem változik.

**Ez ma nem probléma**, mert a `recompute` nem interaktív úton fut, és 9,88 ms
a képkocka-határ alatt van. De ez az egyetlen mért érték, ami a regiszterrel
együtt nő: **846 változónál 9,9 ms; a tervezett ~4035-nél nagyságrendileg
50 ms** — vagyis kikerül a képkocka-határ alól.

**A beavatkozás triggere ezért előre kimondva**, hogy ne érzésre döntsünk:

> A topologikus sorrendet akkor gyorsítótárazzuk (a regiszter azonossága
> szerint), ha a `npm run bench` `recompute` sora **16 ms fölé** megy, **vagy**
> ha a `recompute` interaktív útra kerül.

Addig nem nyúlunk hozzá. A korai optimalizálás itt konkrét árral jár: egy
gyorsítótár, amit érvényteleníteni kell, új hibaosztályt hoz be — és a rendszer
minden szabálya arról szól, hogy a csendes hiba a legrosszabb.

## 5.4 Amit szándékosan nem mérünk

A webes réteg válaszidejét, mert **még nincs mit mérni**: a csontváz memóriában
dolgozik, hitelesítés és perzisztencia nélkül. A valódi számok a tároló (1.
lépés) után lesznek értelmesek — addig egy „12 ms-os API-válasz" arról szólna,
hogy nem történik semmi.

---

# 6. Élő mentés

> **Kifejtve: [`31-elo-mentes.md`](31-elo-mentes.md)** — ott a bejegyzésformátum,
> a lenyomatlánc négy romlása, a mért számok és öt végigjátszott
> hibaforgatókönyv. Itt az elv marad.
>
> **A napló magja kész és tesztelt** (`core/journal/`, 26 teszt). Ami hiányzik,
> az a gazdáé: tartós írás, replikációs szállítás, titkosítás. A
> [18 lépés](../13-18-lepes.md) 1. lépése hozza el, és a 16. (pilot) az első
> pont, ahol valódi betegadat kerül a rendszerbe.

## 6.1 Ami már megvan hozzá: a napló-alakú adatmodell

A `CaseState.values[id]` **hozzáfűző napló**, nem felülíró mező:

```ts
values["vitals.bp.systolic"] = [
  { value: 118, t: "…T08:00Z", provenance: "device"    },
  { value: 124, t: "…T08:00Z", provenance: "clinician" },  // javítás
]
```

A `resolve()` ebből választ a precedencia szerint. Ez **véletlen ajándék a
mentésnek**: az esemény-alapú mentés nem új adatmodellt kíván, hanem a
meglévőt. A rendszer már ma sem felejt el korábbi értéket — csak nem tárolja
tartósan.

## 6.2 Négy szint, négy különböző kérdésre

| Szint | Mire válaszol | RPO | Ki állítja helyre |
|---|---|---|---|
| **1. írási napló** | „mi történt az utolsó másodpercben?" | ~0 | maga a rendszer, induláskor |
| **2. pillanatkép** | „hol tartott az eset tegnap este?" | 1 nap | üzemeltetés |
| **3. földrajzi másolat** | „mi van, ha a gépterem leég?" | 15 perc | üzemeltetés + DPO |
| **4. hidegtár** | „mi volt öt éve?" | 1 nap | jogi/megőrzési kérés |

A **live backup** a 3. szint: folyamatos replikáció, nem éjszakai mentés. A
szülőszobán 24 óra adatvesztés nem „kellemetlen" — **pótolhatatlan**, mert a
vajúdás idősora nem áll össze újra emlékezetből.

## 6.3 Négy szabály, amit a mentésnél a legkönnyebb elrontani

**1. A mentés is betegadat.** Titkosítva, kulcsletéttel — és a kulcs nem
ugyanott van, ahol a mentés. A kulcsletét SOP-ja üzemeltetési feladat, nem
fejlesztési.

**2. A vissza nem állított mentés nem mentés.** Negyedévente helyreállítási
próba, **szintetikus esetre**, mért idővel. Amit nem próbáltunk ki, arról nem
tudjuk, működik-e — és a katasztrófa napja rossz nap az első próbához.

**3. Az auditnapló mentése külön ügy.** Más a megőrzési ideje, mint a
leletnek, és **módosíthatatlannak kell maradnia a mentésben is** — különben a
visszaállítás maga lesz a manipuláció lehetősége.

**4. A törlés is replikálódik.** Ha a beteg törlést kér és a rendszer töröl, a
mentésben is törölni kell — különben a „törölt" adat három földrajzi helyen
tovább él. Ez a legkönnyebben elfelejtett GDPR-kötelezettség, és a megőrzési
idők `secondary` → `primary` átállításáig (10. lépés) **egyébként sem törlünk**.

## 6.4 Amit a mentés nem old meg

- **A hibás adat replikálódik.** A mentés a rontást is elmenti, negyedóránként.
  Ellene a validátor véd, nem a mentés.
- **A titkosítás nem véd a jogosult felhasználó ellen.** Ellene az auditnapló véd.
- **A mentés nem archívum.** Az archívum kereshető és értelmezhető marad tíz év
  múlva is; a mentés csak visszaállítható. A kettő külön feladat.

---

## Összefoglalva, négy mondatban

1. **A mag hallgat.** Nem naplóz, nem ír lemezre, nem dönt a gazdája helyett —
   tényt ad vissza, indoklással, magyarul.
2. **A minőség nem lefedettség**, hanem az, hány hiba nem tud bekerülni: húsz
   regiszter, mindegyik build-hibával a háta mögött.
3. **A sebesség klinikai kérdés.** Egy billentyűleütés után 0,001 ms történik; az
   egyetlen növekvő tétel a `recompute`, és a beavatkozás triggere előre ki van
   mondva.
4. **A mentés magja kész, a tartóssága nem.** A napló, a lánc és a
   helyreállítási próba tesztelve fut; a lemezre írás, a replikáció és a
   titkosítás a gazdáé — és amíg nincs meg, a rendszer valódi betegadaton nem
   futhat. Ez az egyetlen igazi blokkoló.
