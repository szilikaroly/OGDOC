# 04 — Modul-csontváz: mikor kész egy modul

A 25 modul mindegyike **ugyanazt a kilenc tételt** szállítja le. A sablon a
[`modules/_sablon/`](../../modules/_sablon/) alatt van, és **fut**: a saját
tesztjei zölden mennek, mielőtt egyetlen sort is írnál bele.

```
cp -r modules/_sablon modules/04-statusz
node --test "modules/04-statusz/teszt/*.test.ts"
```

## 1. A könyvtárszerkezet

| Útvonal | Mi ez | Kötelező |
|---|---|:--:|
| `README.md` | A modul fejlesztői leírása és a kilenc tétel állapota | ✔ |
| `regiszter/valtozok.json` | **A modul lényege** — a változók definíciója | ✔ |
| `regiszter/ertekkeszletek.json` | Nagy kódlisták külön (BNO, ATC, OENO részhalmazok) | ✱ |
| `kalkulatorok/index.ts` | `registerCalc()` hívások | ✱ |
| `teszt/modul.test.ts` | Golden tesztek a modul **szabályaira** | ✔ |
| `teszt/fixture.json` | Szintetikus eset | ✱ |
| `ATVETEL.md` | A klinikai átvétel jegyzőkönyve | ✔ |

## 2. A kilenc tétel, tételesen

### 1. Változók

Minden mezőn kötelező: `id`, `version`, `status`, `label`, `module`, `datatype`,
és `documentation.definition`. A `coded` típushoz `valueSet` **nélkül a build elszáll**.

A `documentation` négy mezője nem dísz:

| Mező | Mikor kötelező a gyakorlatban |
|---|---|
| `definition` | mindig |
| `howToMeasure` | ha a mérés módja befolyásolja az értéket (vérnyomás, méhszáj) |
| `pitfalls` | ha van ismert, ismétlődő hiba (l. a beszállás-skála) |
| `whyItMatters` | ha a mező más mezőket táplál, vagy döntés függ tőle |

### 2. Keresztfeltöltési térkép

**Nem írod meg — generálódik.** A `DerivationGraph.consumersOf()` adja, és a
`fieldDoc()` írja ki. A kézzel karbantartott „ez ezt tölti" lista fél éven belül
hazudik; ezért a kézzel kitöltött `consumers` mező build-figyelmeztetés.

Amit *meg kell* tervezned: a `derivation` mezőket. Három kérdés dönt:

```
Ez az érték a rendszer állítása, amit senki nem írhat felül?      → computed
Ez javaslat, amire a klinikusnak válaszolnia kell?                → prefill
Ez ugyanaz az adat, ami máshol már szerepel?                      → aliasOf
Egyik sem?                                                        → nincs derivation
```

### 3. Kalkulátorok

Minden képlet `registerCalc()`-kal, `source.cite` és `verified` jelöléssel.
`verified: false` mellett a `verifiedNote` **kötelező** — a `registerCalc` enélkül
elutasítja a regisztrációt.

> Egy modul soha ne írjon képletet a kódjába. Ha kettő ugyanarra a fogalomra
> definiálna képletet, a `registerCalc` a másodikat elutasítja — ez a szándék.

### 4. Szabad szöveg feloldása

Minden `text` típusú mezőhöz vagy **csere** kell, vagy **indoklás**. A hét eszköz és
a mezőnkénti feloldás a [`06-freetext-feloldas.md`](06-freetext-feloldas.md)-ben van.

### 5. Golden tesztek

A modul **szabályaira**, nem a mezőire. Négy minimum:

```ts
test("a modul regisztere hiba nélkül validál", ...)
test("a modul kalkulátorai egyeznek a regiszterrel", ...)
test("a tartományon kívüli érték nem rögzíthető", ...)
test("az anamnesztikus kérdés „nem tudom" válasza önálló érték", ...)
```

Ezen felül minden **klinikai szabályra** egy teszt: minden hard-stop kapu, minden
precedencia-szabály, minden kézzel ellenőrzött számérték.

### 6. FHIR-leképezés

Minden exportálandó mezőn `standards.fhir`. Ami nem képezhető le, az **kimondva**
marad ki — a hiányzó leképezés nem derülhet ki az integrációs teszten.

### 7. PHI-jelölés

Minden beteg-azonosításra alkalmas mezőn `phi: true`. Ez az exportot és a
lekérdezőt vezérli. Kétség esetén a jelölés a helyes döntés: a fölösleges `phi`
kényelmetlen, a hiányzó jogsértő.

### 8. Klinikai átvétel

`ATVETEL.md`, aláírva. A referencia-eseteket **közleményből vagy hatósági
példaszámításból** kell venni, nem a rendszer saját kimenetéből.

> Ez az egyetlen tétel, ami kifogja a fullPIERS-típusú hibát. Ott a kód pontosan
> azt számolta, amit a definíció mondott — **a definíció volt rossz**. Ilyet golden
> teszttel nem lehet elkapni, mert a teszt is a definícióból íródik.

### 9. Nyitott kérdések

Amit a modul **nem** old meg, kimondva, felelőssel. Egy modul, aminek nincs nyitott
kérdése, nagy valószínűséggel nem nézett szembe a nehéz részekkel.

## 3. A modul betöltése

```ts
// a mag regisztere + a modul változói egy regiszterbe
const reg = loadRegistry(
  "registry/variables/core.json",
  "modules/04-statusz/regiszter/valtozok.json",
);
import "./modules/04-statusz/kalkulatorok/index.ts";   // registerCalc mellékhatás
```

A `loadRegistry` több fájlt fűz össze; a **duplikált azonosító kivételt dob**. Ez
szándékos: két modul nem definiálhatja ugyanazt a mezőt. Ha ugyanaz az adat kell
mindkettőnek, `aliasOf` a helyes megoldás.

## 4. Modulhatárok — melyik modulé egy mező

Ismétlődő vitakérdés. A szabály:

> **A mezőt az a modul tulajdonolja, ahol KELETKEZIK.** Ahol felhasználják, ott
> `shownIn` vagy `aliasOf`.

| Példa | Tulajdonos | Miért |
|---|---|---|
| `vitals.bp.systolic` | 04 Státusz | ott mérik |
| `exam.cervix.dilation` | 04 Státusz | ott vizsgálják |
| `score.bishop.dilation` | 20 Score (`aliasOf`) | ott csak megjelenik |
| `lab.plt` | 05 Vizsgálatok | ott érkezik |
| `patient.taj` | 25 Admin | ott veszik fel |

Ha egy mező keletkezési helye vitatható, az majdnem mindig azt jelenti, hogy
**két különböző dolog** van összemosva — és ketté kell bontani. Ez történt a
beszállás-mezővel: a klinikai észlelés és a Bishop-pontérték nem ugyanaz.

## 5. Definition of done

Egy modul akkor kész, ha:

- [ ] `npm test` zöld a mag és a modul tesztjeivel együtt
- [ ] `reg.validate()` **0 hiba**
- [ ] `validateCalculators(reg)` **0 hiba**
- [ ] minden `text` mező feloldva vagy indokolva
- [ ] `ATVETEL.md` aláírva, referencia-esetekkel
- [ ] a nyitott kérdések felelőssel és határidővel

**Amit nem tekintünk késznek:** „a kód működik, a doksi majd jön". A regiszterben a
dokumentáció *a kód része* — `definition` nélkül a build elszáll.
