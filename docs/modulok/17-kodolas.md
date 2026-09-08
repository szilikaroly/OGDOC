# Modul 17 — Kódolás és kimenetelek

| | |
|---|---|
| **Cél** | Diagnózis-, beavatkozás- és finanszírozási kódok automatikus ajánlása a rögzített adatból |
| **Forrás** | **v16** (BNO-szabályok, EESZT-törzsek) |
| **Becsült változó** | ~80 + 13 000 tételes kódtörzs |
| **Fázis** | 3 |
| **Függ** | 03, 04, 05, 10, 11 |

## Mi van már meg az IntuiCare-ben

A `clinical_diagnoses` (`icd10_code`, `snomed_code`, `certainty`, `is_primary`), a `patient_encounters` (`bno_kodok[]`, `oeno_kodok[]`) és a `medical-codes.ts` (`BNO_SEED`, `OENO_SEED`, `searchCodes`) adja az alapot. **Nincs meg a 13 beágyazott EESZT-kódtörzs (~13 000 tétel)** — az `atc` 5 592, `bnoObs` 1 922, `feor` 1 217, `oenoObs` 650 tétellel —, sem a HBCS-besorolás. Ezek a v16-ból hozandók át.

## 1. A v16 legjobb ötlete: a kód az adatból következik

A legtöbb rendszerben a kódolás kézi keresés. A v16-ban **feltételes szabály**:

```javascript
{k:"O14.1", l:"Súlyos prae-eclampsia",           t:(p,c)=> c.peSev },
{k:"O24.4", l:"Gesztációs diabetes (GDM)",       t:(p,c)=> p("r_gdm") || c.gdmLab },
{k:"O26.6", l:"Májbetegség a terhességben (ICP)",t:(p,c)=> p("s_icp") || c.bileHigh },
{k:"O30.0", l:"Ikerterhesség",                   t:(p,c)=> c.twin },
```

A `p()` az anamnézisből olvas, a `c` a számított kontextusból (labor-küszöbök, vitálisok). A
kódajánlás tehát **a rögzített adat következménye**, és ha az adat változik, a kód is.

Az OGDOC ezt regiszter-alakba viszi: minden kódszabály egy `CodeRule`, aminek a `when` mezője
ugyanolyan kifejezés, mint a `requiredWhen` — és a `consumers` generálásakor a build tudja,
hogy a `lab.bile` a `O26.6` kódajánlás bemenete.

## 2. A beágyazott EESZT-kódtörzsek

A v15-ös EESZT-ingest óta **13 törzs, ~13 000 tétel** van beágyazva. Ez az 1 MB-os fájlméret
nagy része, és változatlanul átkerül:

| Törzs | Tétel | Mire szolgál |
|---|---:|---|
| `atc` | 5 592 | hatóanyag-besorolás a gyógyszerkeresőhöz |
| `irszmap` | 3 294 | irányítószám → település automatikus kitöltés |
| `bnoObs` | 1 922 | BNO-kódajánlás, **labor-vezérelt súlyossággal** |
| `feor` | 1 217 | foglalkozás-besorolás |
| `oenoObs` | **650** | beavatkozás-kódok |
| `orszag` | 251 | országkódok |
| `xwalk` | 40 | kereszthivatkozás törzsek között |
| `small` | 11 | kis kódlisták (rizikótényezők, eredményközlés) |

> **Ez megoldott probléma.** Korábban nem volt valódi OENO-tábla, és a beavatkozások „kód
> megadandó" jelöléssel jelentek meg. A v15 óta 650 valódi OENO-kód van beágyazva — a régi
> megkerülő megoldást nem kell visszaírni.

### Az `irszmap` és a `feor` mint a keresztfeltöltés legegyszerűbb példája

Az irányítószám kitölti a települést, a foglalkozás megnevezése a FEOR-kódot. Ezek `computed`
levezetések kódtáblából — ugyanaz a mechanizmus, mint a BMI, csak a függvény egy táblakeresés.

## 3. Négy kódrendszer

| Rendszer | Mit kódol | Forrás |
|---|---|---|
| **BNO** (ICD-10 magyar) | diagnózis | v16 szabályok + `bnoObs` |
| **OENO** | beavatkozás | `oenoObs`, 650 tétel |
| **HBCS** | finanszírozási besorolás | **ÚJ** — a BNO + OENO kombinációból |
| Nemzetközi | ICHOM PCB v5.0, FHIR R4, REDCap | `15`, `16` modulokon át |

### HBCS — az egyetlen új rész

A homogén betegségcsoport a magyar finanszírozás alapja, és a fődiagnózis + beavatkozás +
kísérő betegségek + ápolási idő kombinációjából áll össze. Ez a modul **javaslatot ad**, nem
végleges besorolást — a besorolás intézményi felelősség.

## 4. Törzsadat-frissítés

Az EESZT kódtörzsek havonta frissülnek, letölthető törzsadatként (nem böngészőből hívható API).
Az útvonal mindig ugyanaz:

```
letöltés → eeszt_ingest.py → beágyazott JSON → app újraépítés
```

Ugyanez igaz a PUPHA gyógyszertörzsre. Az `eeszt_ingest.py` pipe-tagolt, UTF-8/BOM-toleráns
bemenetet vár. Ez az OGDOC build-láncába is beépül, és a beágyazott törzs verziója és dátuma
megjelenik a felületen — hogy látszódjon, mennyire friss.

## 5. Keresztfeltöltés

**⇦ Mi tölti fel**: gyakorlatilag minden klinikai modul. A `05` labor a
súlyossági fokozáshoz (pl. preeclampsia → súlyos preeclampsia), a `11` műtő az OENO-hoz.

**⇨ Mit tölt fel**: `09` epikrízis · `14` zárójelentés · `18` minőségbiztosítás (a HBCS és a
BNO adja a case-mix elemzés alapját) · finanszírozási export.

## 6. Elfogadási kritérium

Egy súlyos preeclampsiás eset esetén a rendszer **O14.1**-et ajánl (nem O14.9-et), és az
ajánlás mellett látszik, melyik változó melyik értéke miatt minősül súlyosnak. Ha a labor
változik, az ajánlás követi.

> **Ez teszt, nem ígéret:** [`test/kodolas.test.ts`](../../test/kodolas.test.ts).

A súlyosabb kód ELNYOMJA az enyhébbet, de nem csendben: az elnyomott kód a listában marad,
azzal együtt, mi nyomta el. A lánc három szintű (O14.9 → O14.1 → O14.2), és van fordított
irányú szabály is: az „egyszerű, spontán szülés” (O80) kódot BÁRMELY másik szülészeti kód
elnyomja — az a kód definíció szerint azt állítja, hogy semmi más nem történt.

## 7. Nyitott kérdés

~~A HBCS-besorolás szabályrendszere évente változik, és a teljes szabálykönyv terjedelmes.
Javaslat: a Fázis 3-ban csak a szülészeti-nőgyógyászati csoportok kerüljenek be.~~ **Eldőlt: a
részhalmaz jó irány, de a kapu előbb van — BESOROLÁS NINCS, amíg a szabálykönyv nincs betöltve
és ellenőrizve.**

A terv azt írta, hogy a rendszer „javaslatot ad, nem végleges besorolást”. Ez igaz, de kevés:
**egy javaslathoz is a hatályos szabálykönyv kell.** Egy közelítő besorolás rosszabb lenne a
semminél — a HBCS pénz, és egy hihetőnek látszó, de rossz csoport a finanszírozási
elszámolásban derülne ki, vagy nem derülne ki. Ugyanaz a kapu, mint az ellenőrizetlen
kalkulátor-konstansnál és a hitelesítetlen normogramnál; a képességet a kód KÍVÜLRŐL kapja
(`rulebookVerified`), nem magáról állítja.

Amit a rendszer elvégez, az viszont valódi munka: **összeszedi a besoroláshoz szükséges
bemeneteket**, és megmondja, melyik hiányzik. A besorolás legtöbb hibája abból származik, hogy
egy kísérő betegség vagy egy beavatkozás nem került a dokumentumba.
(ld. [`../fejlesztes/24-kodolas.md`](../fejlesztes/24-kodolas.md))

### Új nyitott kérdések, amiket a megvalósítás hozott elő

**Új levezetés-fajta kellett: a táblakeresés.** A 2. pont szerint az irányítószám → település
„ugyanaz a mechanizmus, mint a BMI, csak a függvény egy táblakeresés”. Ez majdnem igaz: a
`computed` levezetés a kalkulátor-rétegen megy, ami SZÁMOT vesz és számot ad, az
irányítószámból viszont SZÖVEG lesz. Ezért `derivation.kind: "lookup"` került a magba — így a
kalkulátor-réteg megmarad számokra, a táblakeresés pedig a saját kapuját kapja meg (a tábla
verziója, dátuma, forrása). Ez a NEGYEDIK modul, ahol a „csak számot ad” szabály előjött; most
meg is oldódott.

**A súlyossági ismérvek listája hiányos.** A szérumkreatinin, a tüdőoedema és az újonnan
jelentkező agyi vagy látászavar nincs bekötve — egy súlyos eset ezért enyhének LÁTSZHAT. Az
ajánlás ezt kimondja (`incompleteNote`), de ez jelölés, nem megoldás. Ugyanígy jelölt a szülés
utáni vérzés küszöbe: ma egyetlen 500 ml-es határ van, ami császármetszésnél túljelez.

**A kódtörzsek részhalmazok.** 32 BNO-kód és 10 irányítószám van betöltve a tervezett ~13 000
tételből. A teljes törzs az EESZT-ingest útján kerül be (letöltés → `eeszt_ingest.py` →
beágyazott JSON); a részhalmaz nem korlátozza a kódolót, mert a kódolás emberi döntés.
