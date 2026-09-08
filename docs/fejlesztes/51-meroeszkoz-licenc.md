# 51 — A mérőeszközök licencelése

*A 12. lépés gépi fele. A hatodik aláírási réteg — és az egyetlen, ami lejár.*

---

## A lépés kétkimenetű, és ez szándékos

> *„Kész, ha minden eszközre vagy licenc + validált tételszöveg van, **vagy egy
> leírt döntés, hogy nem használjuk**.”*

A rendszerben eddig csak az első kimenet létezett. A `notLicensed` jelölés
figyelmeztetést adott — és **semmi nem tudta lezárni**. Kilenc figyelmeztetés
állt a validálásban, kiút nélkül: aki elolvasta, nem tehetett érte semmit, és
aki eldöntötte, hogy a WHODAS-12-t nem használjuk, annak a döntése sehol nem
látszott.

A megnevezetlen adósság előbb-utóbb zaj lesz, a zajt pedig senki nem olvassa.

A `registry/kerdoivek/licencek.json` ezért **két fajta bejegyzést** ismer, és
mindkettő rendezi a tételt:

| Kimenet | Mit kíván | Felvehető utána? |
|---|---|---|
| **licenc** | jogosult · azonosító · hatókör · kelt · lejárat · aláíró | igen |
| **„nem használjuk"** | indoklás · mi lép helyette · aláíró · dátum | **nem** — de rendezett |

A „nem használjuk" nem kudarc. A bizottságnak nem azt kell állítanunk, hogy
mindent használunk, hanem azt, hogy **amit használunk, arra van jogunk**.

---

## Amit ez a lépés talált

### 1. A felvételi kaput egyetlen jelölés nyitotta — hatodszorra

Az `itemText.status` szó `"loaded"`-ra írása felvehetővé tette az eszközt.
Semmi nem kérte számon, hogy a licencet valóban megszerezték-e, kitől, milyen
hatókörrel — és meddig.

Ugyanaz a lyuk, mint a 9. és a 10. lépésben, de itt a következménye **kettős**:

- **jogi** — engedély nélkül használt, szerzői jogvédett tételszöveg;
- **tudományos** — a saját szavakkal feltett EPDS nem EPDS, és a validált
  vágóértékek nem érvényesek rá.

Mostantól a kaput a **nyilvántartás** nyitja. És ha a hívó nem ad
nyilvántartást, a válasz **fail-safe**: csak a szabadon használható szövegű
eszköz vehető fel, mert *a meg nem mutatott licenc nem licenc*.

### 2. Egy teszt, ami rossz okból volt zöld

A `test/utankovetes.test.ts` LATCH-tesztje ezt írta:

```ts
assert.equal(inst.administrable(REG, blank(), "inst.latch").ok, false);
```

Az `administrable(id, lang)` **első argumentuma az azonosító**. A hívás tehát a
teljes változóregisztert adta át azonosítóként, a válasz pedig
`"Ismeretlen mérőeszköz: [object Object]"` volt — `ok: false`, a teszt zöld.

**És ugyanígy zöld lett volna akkor is, ha a licenckapu egyáltalán nincs ott.**

Ez a hetedik és kilencedik lépés findingjának rokona: egy teszt, ami a saját
tárgyát nem érinti. A javítás kettős — a hívás helyes, **és** az elutasítás oka
mostantól **megnevezve** jön vissza (`allapot: "ismeretlen"` vs
`"rendezetlen"`), hogy egy elrontott hívás soha többé ne tudjon átvinni egy
kapu-tesztet.

### 3. A licenc lejár — és ez a rétegben új

A rendszer öt korábbi aláírási rétege **időtlen**: egy szám mögötti aláírás nem
avul el magától, csak ha a szám megváltozik. Egy licenc viszont **dátumhoz
kötött**, és a lejárta nem a mi hibánk — mégis attól a naptól a felvétel
jogosulatlan.

A kapu ezért **naptárt néz**, és **90 nappal előre szól**. Nem udvariasságból:
a megújítás hónapokat vihet, tehát a lejárat hetében elkezdeni már késő.

És egy fontos határ: **a lejárt licenc nem törli a múltat.** A már felvett adat
érvényes marad; csak új felvétel nem indul. A `score()` ezért egy máshol
felvett eszköz eredményét akkor is kiértékeli, ha a felvételi kapu zárva van.

---

## A lenyomat — mit fed a licenc

**Benne van:** minden tétel sorszáma, azonosítója, a válaszok **pontértékei**, a
vágóértékek kontextusonként, a kritikus tétel és a **fordítás állapota**.

**Nincs benne:** a `label` és a `documentation` — a mi leíró szövegünk
javítható anélkül, hogy a licenc érvényét vesztené. A tételszöveg maga sincs
benne: azt nem is tároljuk, amíg nincs licenc.

Egyetlen pontérték átírása **elavulttá teszi a licencet** — mert egy
megváltozott tételsorral ez már nem az az eszköz, amire a licencet megadták.

---

## A mai állás

```
10 mérőeszköz: 1 rendezett (a közkincs Whooley), 9 rendezetlen, 1 felvehető
validált magyar fordítás: 1/10
```

| Eszköz | Tételszöveg | Magyar fordítás |
|---|---|---|
| **Whooley** | közkincs | nem validált |
| **EPDS** | licenc kell | **validált** |
| PHQ-9 · MSPSS · MIBS | licenc kell | nem validált |
| LATCH · WHODAS-12 · EQ-5D-5L · BSES-SF · BSSR | licenc kell | nincs |

Az EPDS a legfájóbb sor: a magyar fordítás **validált** (ante- és postpartum,
saját közleménnyel) — csak a tételszöveg licence hiányzik.

---

## Ami ebből az ETT-beadványba megy

A 11. lépés `ett.j2` tétele azt állítja: *„A kutatásban használt kérdőívek
magyar tételszövege licencelt, a fordítás validált."* Ez ma **megalapozatlan**.

A bizonyíték mostantól a **rendezettséget** méri, nem a licencelt darabszámot:
ha egy eszközre a döntés az, hogy nem használjuk, az ugyanúgy rendezi a
tételt. A két lépés így egy irányba mutat.

---

## Futtatás

```
npm run licenc      # munkalap a kutatásvezetőnek és a jogásznak
npm run validate    # a kapu, a lejáratok és a rendezetlen tételek
node --test test/licenc.test.ts   # 19 teszt
```

## Fájlok

| | |
|---|---|
| `core/kerdoiv/licenc.ts` | a lenyomat, a licenc- és döntésnyilvántartás, a naptáras kapu |
| `registry/kerdoivek/licencek.json` | a nyilvántartás — szándékosan üres |
| `core/kerdoiv/registry.ts` | az `administrable()` mostantól a nyilvántartásból dönt |
| `tools/gen-licenc.ts` | a munkalap (`npm run licenc`) |
| `test/licenc.test.ts` | 19 teszt |
