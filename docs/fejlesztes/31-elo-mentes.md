# 31 — Élő mentés: a napló mint rekord

*A `30-core-fejlesztes.md` 6. fejezetének kifejtése. Ott elv, itt szerkezet,
kód és mért szám.*

---

## 0. Az egy mondat

> **Az eseménysor a rekord. Az állapot annak a vetülete.**

```
napló  ──replay()──▶  CaseState
```

Ha a kettő eltér, **a napló nyer**. Ez nem elvi finomság: egy állapotot
felülíró mentésnél a hiba pillanata elveszik, és utólag nem rekonstruálható,
ki mikor mit írt — pedig egy szülészeti rekordnál évekkel később éppen ez a
kérdés.

**A rendszer már félúton volt.** A `CaseState.values[id]` ma is hozzáfűző napló,
nem felülíró mező: egy javított vérnyomás nem törli az eredetit, mellé kerül, és
a `resolve()` dönt precedencia szerint. Az élő mentés ezért **nem új
adatmodellt kíván, hanem a meglévő végigvitelét.**

---

## 1. Négy szerkezeti döntés, mindegyik egy-egy hibát véd

### 1.1 A sorrendet a `seq` dönti el, nem az óra

A faliórai idő **visszaugorhat**: időzónaváltás, NTP-korrekció, virtuális gép
migrációja. Egy naplóban, ahol az `at` dönti el a sorrendet, egy óraállítás
**átrendezi a múltat**.

Ezért minden bejegyzésen két idő van, és a szerepük különbözik:

| Mező | Mire jó | Sorrendet dönt |
|---|---|---|
| `seq` | monoton, hézagmentes sorszám | **igen** |
| `at` | faliórai idő, emberi olvasásra | nem |
| `value.t` | mikor **vonatkozik** rá az érték | nem |

A harmadik külön van, mert egy 8:00-kor mért vérnyomást 8:40-kor is be lehet
írni — és az érték a 8:00-ás állapotról szól.

### 1.2 Minden bejegyzés hordozza az előző lenyomatát

```ts
{ seq: 3, prevHash: "9f2c…", hash: "a41b…", … }
```

A lánc törése **kimutatható**, és a törés HELYE megmondja, mi történt. A
csendben sérült mentés a legveszélyesebb, mert **visszaáll — csak nem azt, ami
volt.**

### 1.3 Az írási napló az auditnapló írási fele

Nem két rendszert építünk. Minden bejegyzésben ott a **cselekvő**, és a
`append()` cselekvő nélkül **dob**:

> „A bejegyzésnek CSELEKVŐJE kell legyen. »A rendszer« nem cselekvő."

Ami külön marad: az **olvasás** naplózása — abból ugyanis nem keletkezik
bejegyzés. Az az auditnapló másik fele, a `core/log/`-ban.

### 1.4 A törlés is bejegyzés

Egy törölt érték nem tűnik el a naplóból, hanem **sírkövet kap**, kötelező
indoklással:

```ts
{ op: "erase", variableId: "vitals.pulse",
  reason: "téves felvitel, másik beteg lapjáról", actor: "dr. …" }
```

Két külön okból kötelező:

- **visszajátszásnál**: sírkő nélkül a törölt érték **feltámadna**;
- **bizonyításnál**: az indoklás nélküli sírkő nem különböztethető meg az
  adatvesztéstől — és évekkel később éppen ezt a különbséget kell igazolni.

---

## 2. A négy szint

| Szint | Mire válaszol | RPO | Ki állítja helyre |
|---|---|---|---|
| **1. írási napló** | „mi történt az utolsó másodpercben?" | ~0 | maga a rendszer, induláskor |
| **2. pillanatkép** | „hol tartott az eset tegnap este?" | 1 nap | üzemeltetés |
| **3. földrajzi másolat** | „mi van, ha a gépterem leég?" | **15 perc** | üzemeltetés + DPO |
| **4. hidegtár** | „mi volt öt éve?" | 1 nap | jogi/megőrzési kérés |

**A „live backup" a 3. szint**: folyamatos replikáció, nem éjszakai mentés.

**Miért nem elég az éjszakai mentés.** A szülőszobán 24 óra adatvesztés nem
„kellemetlen", hanem **pótolhatatlan**: a vajúdás idősora — a CTG-értékelések,
a belső vizsgálatok, a gyógyszeradások időpontjai — nem áll össze újra
emlékezetből, és éppen az a dokumentáció, amit egy későbbi vizsgálat kérni fog.

---

## 3. A lánc: négy romlás, négy teendő

A `verifyChain()` **négy különböző** romlást különböztet meg, mert a teendő is
más:

| Romlás | Mit jelent | Teendő |
|---|---|---|
| `tampered` | egy bejegyzés **tartalma** változott | a másolat nem hiteles — sem visszaállításra, sem bizonyítékként |
| `gap` | hiányzik egy sorszám | **részleges szállítmány** — a hiányzókat újra kell kérni |
| `reordered` | minden megvan, de nem sorrendben | a szállítás keverte össze — **újrarendezhető** |
| `brokenLink` | a lenyomatok nem illeszkednek | **két külön napló darabjait fésülték össze** |

### A sorrend-ellenőrzés az EGÉSZ naplóra megy, nem bejegyzésenként

A felcserélt sorrend és a hézag **az első eltérésnél egyformán néz ki** — a
`[1, 3, 2, 4]` sorozat harmadik eleménél derül csak ki, hogy nem hiányzik
semmi. Megkülönböztetni csak a teljes sorozat ismeretében lehet, és mivel a
teendő gyökeresen más (újrarendezés vs. újrakérés), ez megérte a külön lépést.

### A `brokenLink` a legalattomosabb

Két külön naplóból „összeollózott" mentés **egyenként ép bejegyzésekből áll**:
minden lenyomat helyes, minden sorszám folytonos. Csak a lánc nem illeszkedik.
Enélkül az ellenőrzés nélkül ez a hiba észrevétlen marad.

### A lenyomat kulcssorrend-független

A `JSON.stringify` a kulcsok **beszúrási** sorrendjét őrzi, nem az ábécét. Két
gépen ugyanaz a bejegyzés más sorrendben épülhet fel — és akkor a lenyomata is
más lenne, a lánc pedig **ott törne el, ahol semmi baj nincs.** Ezért a
sorosítás kulcs szerint rendez.

---

## 4. Mit jelent az, hogy „mentve"

```ts
type Durability = "buffered" | "local" | "replicated";
canReportSaved(d)   // csak "local" és "replicated" esetén igaz
```

A klinikus a képernyőn látott visszajelzésre alapoz: **ha ott az áll, hogy
mentve, akkor elmegy a szobából.** Egy pufferben álló bejegyzésre ezt kiírni
nem optimalizálás, hanem hazugság — és éppen az áramszünet pillanatában derül
ki.

Ezért a szabály: **a nyugtázás a tartós írás UTÁN megy ki**, nem előtte.

---

## 5. A lemaradás nem üzemeltetési részlet, hanem klinikai adat

```ts
replicationLag(state, rpoSeconds, now)
//  → { entriesBehind, secondsBehind, withinRpo, why }
```

Ha a földrajzi másolat negyven perccel van lemaradva, a **„mentve" szó mást
jelent, mint amit a klinikus ért alatta.** Ezért ez a szám nem egy
üzemeltetési műszerfalra való, hanem oda, ahol a mentés visszajelzése van.

### A lemaradást az ELSŐ nyugtázatlan bejegyzéstől mérjük

Ez könnyen elrontható, és a rossz irányból mérve a kiesés **kisebbnek látszik**.
Ami elveszne, az a **legrégebbi** nyugtázatlan munkával kezdődik, nem a
legutolsóval:

```
helyi:    …──12──13──14──15──16──17──18──19──20   (most: 10:45)
nyugtázott:   12                                   (10:05)
                └─ innen mérünk: 40 perc, 8 bejegyzés
```

---

## 6. Pillanatkép, tömörítés, és a törlés, ami nem támad fel

A gyakorlati helyreállítás: **pillanatkép betöltése, majd a maradék napló
visszajátszása.** A `checkContinuation()` azt ellenőrzi, hogy a kettő
illeszkedik-e — mert ha nem, a végeredmény **hihetőnek látszik, és mégis
rossz**:

| Eset | Következmény |
|---|---|
| hiányzik közte bejegyzés | a visszaállítás **csendben veszít adatot** |
| átfedés van | a visszajátszás **duplázna** |
| más napló darabja | a lenyomatok nem illeszkednek |

### A sírkövek túlélik a tömörítést

Ez a legkönnyebben elfelejtett GDPR-kötelezettség. Ha a törlések a
tömörítésnél elvesznek, egy régebbi napló visszajátszása **feltámasztja** a
törölt adatot — és a „törölt" adat három földrajzi helyen tovább él. A
`Snapshot.erased` ezért a pillanatképnek is része.

> **Megjegyzés a mai állapotra:** a megőrzési idők `secondary` szinten állnak,
> ezért a rendszer **egyelőre egyáltalán nem töröl** (a
> [18 lépés](../13-18-lepes.md) 10. lépése). A sírkő-szerkezet készen áll arra,
> amikor törölni fogunk.

---

## 7. A helyreállítási próba

> **A vissza nem állított mentés nem mentés.**

```ts
restoreDrill(log, expected)
//  → { ok, elapsedMs, entries, valuesRestored, chain, mismatches, why }
```

Három dolgot tesz, **ebben a sorrendben**:

1. **ellenőrzi a láncot** — ha az sérült, a többi nem érdekes;
2. visszajátssza a naplót;
3. **összeveti a várt állapottal**, és megnevezi, mi tér el.

És **méri az időt**. Ez az egyetlen alap, amiből a helyreállítási idő (RTO)
megígérhető — a becslés nem alap.

A harmadik lépés hibaüzenete a legfontosabb:

> „A mentés visszaáll, de NEM azt adja vissza, ami volt — ez a legveszélyesebb
> hibaosztály."

**Ritmus:** negyedévente, szintetikus esetre, mért idővel. A katasztrófa napja
rossz nap az első próbához.

---

## 8. Mért számok

`npm run bench`:

| Művelet | Medián | Mit jelent |
|---|---:|---|
| egy bejegyzés hozzáfűzése (lenyomattal) | **0,02 ms** | a lánc ára billentyűleütésenként |
| napló visszajátszása (5000 bejegyzés) | **0,13 ms** | a helyreállítás magja |
| lánc ellenőrzése (5000 bejegyzés) | **~40 ms** | 5000 SHA-256 |

> A számok EGY gépen mértek, és a gép terhelésétől függenek — a
> láncellenőrzés ugyanezen a gépen 24 és 42 ms között ingadozott. Nem a
> pontos érték a lényeg, hanem a **nagyságrendek aránya**, és az, hogy a
> `npm run bench` bármikor újramérhető. A doksiba írt szám elavul; a
> parancs nem.

Három olvasat:

**A lenyomat ingyen van.** 9 mikroszekundum írásonként — a lánc nem
teljesítménykérdés. Aki ezt kihagyja, nem gyorsaságot nyer, csak
kimutathatóságot veszít.

**A visszajátszás ingyen van.** Egy teljes vajúdás idősora 0,1 ms alatt áll
össze. Az RTO-t nem ez korlátozza, hanem a hálózat és a lemez.

**Az ellenőrzés nagyságrendekkel drágább, mint a visszajátszás — és megéri.**
Ez a projekció: **egymillió bejegyzés ellenőrzése nagyságrendileg 10
másodperc.** Egy helyreállításnál ez elhanyagolható; és cserébe kimutatható a
csendben sérült mentés.

---

## 9. Titkosítás, kulcs, és egy nem nyilvánvaló következmény

> **Kifejtve: [`32-titkositas.md`](32-titkositas.md).** Itt az elv marad.

- **A mentés is betegadat.** Titkosítva, és a kulcs **nem ott van, ahol a
  mentés.** A kulcsletét SOP-ja üzemeltetési feladat.
- **A titkosítás nem véd a jogosult felhasználó ellen.** Ellene az auditnapló
  véd — a másik fél, a `core/log/`-ban.

**És a nem nyilvánvaló következmény:** az épség ellenőrzésének **visszafejtés
nélkül** kell működnie. Egy hidegtárban őrzött, titkosított másolat épsége
évente ellenőrizendő — de ehhez nem szabad minden alkalommal elővenni a
kulcsot, mert minden kulcshasználat kockázat.

Megoldás: a lenyomatlánc a **titkosított** alakon is végigvezetve, külön
integritás-jegyzékben. Így az „ép-e a másolat?" és a „mi van benne?" két külön
kérdés marad, két külön jogosultsággal.

---

## 10. Öt hibaforgatókönyv, végigjátszva

### 10.1 Áramszünet írás közben

A pufferben álló bejegyzés elveszik — de **a klinikus nem látta, hogy „mentve"**,
mert a nyugtázás a tartós írás után megy ki. Induláskor a rendszer
visszajátssza a naplót az utolsó ép bejegyzésig; a csonka utolsó sor a
lenyomatán bukik el, és **kimarad**, nem félig kerül be.

### 10.2 A gépterem kiesik

Átállás a földrajzi másolatra. Ami elveszik: a `replicationLag()` által
**folyamatosan mutatott** mennyiség — nem meglepetés, hanem ismert szám. Az
átállás után az első teendő a lánc ellenőrzése: a másolat vége csonka lehet.

### 10.3 Zsarolóvírus

A hozzáfűző napló + a lenyomatlánc + a **módosíthatatlan** külső másolat együtt
véd. A titkosított vagy átírt bejegyzések a láncon **azonnal kiderülnek** — és
az utolsó ép bejegyzés sorszáma megmondja, meddig hiteles az adat. A
visszaállítás onnan folytatható.

Ez az a forgatókönyv, ahol a `tampered` és a `brokenLink` megkülönböztetése
gyakorlati értékű: az első azt mondja, mikor kezdődött a támadás.

### 10.4 Véletlen törlés

Nincs „véletlen törlés" a naplóban: a törlés bejegyzés, sírkővel és
indoklással. Ha az indoklás téves volt, **a korábbi állapot visszajátszható**
(`replay(log, seq)`) — az adat nem veszett el, csak sírkő került rá.

### 10.5 Csendben romló lemez

A legalattomosabb, mert **hónapokig nem látszik**. Ez ellen a negyedéves
helyreállítási próba és a lánc rendszeres ellenőrzése véd — nem a mentés
megléte. Egy mentés, amit soha nem olvastak vissza, **állításról szól, nem
tényről**.

---

## 11. Amit a mentés nem old meg

- **A hibás adat replikálódik.** A mentés a rontást is elmenti, negyedóránként.
  Ellene a validátor véd, nem a mentés.
- **A mentés nem archívum.** Az archívum **kereshető és értelmezhető** marad tíz
  év múlva is; a mentés csak visszaállítható. A kettő külön feladat, és a
  megőrzési idők (10. lépés) az archívumról szólnak, nem a mentésről.
- **A napló nem oldja meg a jogosultságot.** Attól, hogy minden írás mögött ott
  a cselekvő, még nem ellenőriztük, hogy joga volt-e hozzá.

---

## 12. Mi van kész, és mi a gazdáé

| Kész a magban | Hiányzik, és a gazdáé |
|---|---|
| bejegyzésformátum, lenyomatlánc | tartós írás (`fsync`), fájl- vagy adatbáziskezelés |
| `append` · `replay` · `verifyChain` | replikációs szállítás és nyugtázás |
| `snapshot` · `checkContinuation` | titkosítás, kulcsletét |
| `restoreDrill` · `replicationLag` | ütemezés: pillanatkép, próba, ellenőrzés |
| sírkő és tömörítés-túlélés | a törlés tényleges végrehajtása a hidegtárban |

**26 teszt** védi a fentieket. A mag itt is tiszta: nem ír lemezre, nem hív
hálózatot — azt mondja meg, **mi a helyes bejegyzés**, és hogy egy kapott
napló **ép-e**.

---

## Négy mondat

1. **A napló a rekord**, az állapot a vetülete — és eltérésnél a napló nyer.
2. **A lánc nem teljesítménykérdés**: 9 mikroszekundum írásonként, cserébe a
   csendben sérült mentés kimutatható.
3. **A lemaradás klinikai adat**, nem üzemeltetési részlet: attól függ, mit
   jelent a „mentve" szó.
4. **A vissza nem állított mentés nem mentés** — negyedévente, mért idővel.
