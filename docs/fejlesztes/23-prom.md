# 23 — Beteg által jelentett kimenetel: tíz eszközből egy vehető fel

> A modul terve azt írta, hogy „ez a modul már majdnem kész": az ICHOM-import
> 108 PROM-tétele adatbevitel, nem fejlesztés. A tétel igaz — és épp ezért ez a
> modul nem a tételekről szól, hanem arról a három szabályról, ami nélkül a
> tételek felvétele kárt okozna.

## 1. A beteg válaszát a klinikus nem írhatja felül

Ez a modul egyetlen mondata, ami **kódot változtatott a magban**. A
`provenanceAllowed` mező eddig ott állt a típusban, és **senki nem
kényszerítette ki** — díszítés volt. A PROM teszi kapuvá:

```ts
setValue(reg, state, "prom.eq5d.mobility", 2);   // alapértelmezés: clinician
// Error: prom.eq5d.mobility: „clinician" eredettel nem írható — csak patient.
//        Ez a mező a BETEG saját válasza. A klinikus nem írhatja felül; ha
//        ellentmondást lát, azt külön megjegyzésben rögzíti.
```

A PROM a beteg **saját szempontjából** mért kimenetel. Ha a klinikus
felülírhatja, a mérés megszűnik annak lenni, ami — és a felülírás nem is
látszana, mert ugyanabban a mezőben állna.

Az ellentmondásnak van helye, csak nem ott: `prom.clinicianNote`, és
**eszközönként külön**, a példány-dimenzióval ([12.](12-peldany-dimenzio.md)):

```ts
setValue(reg, st, "prom.clinicianNote",
  "A kitöltés a látogatás alatt, zajos kórteremben történt.",
  { scope: "inst.epds" });
```

A megjegyzés csak olyan eszközhöz rögzíthető, ami a **névsorban** szerepel —
tehát amit ténylegesen felvettek.

A szabályt a build is őrzi: `prom` modulú változó `patient` eredet nélkül,
vagy `clinician` eredettel megengedve, **build-hiba**. Két kivétel van, és
mindkettő a KÖRNYEZETRŐL szól, nem a válaszról: a névsor és a klinikusi
megjegyzés.

## 2. Egy változó, két néven — a tükör

Az elfogadási kritérium második fele: *„a `08` modul EPDS-e és ez a modul
EPDS-e ugyanaz a változó, nem két külön kitöltés."*

```ts
REG.get("prom.mh.epds.total").aliasOf     // "psy.epds.total"
REG.resolvePrimary("prom.mh.epds.total")  // "psy.epds.total"
```

Ez nem kényelmi kérdés. Két külön mező azt jelentené, hogy **a beteg kétszer
tölti ki ugyanazt**, és a két érték előbb-utóbb eltérne — és onnantól nincs
válasz arra, melyik az igaz. A tükör az `aliasOf` mechanizmus, ami a magban
eleve megvolt: az írás a primer mezőre megy, az olvasás bármelyik néven
működik, és a rekordban **egy** érték áll.

## 3. Tíz eszközből egy vehető fel — és ez nem fejlesztői feladat

| Eszköz | Tételszöveg | Magyar fordítás | Felvehető |
|---|---|---|:--:|
| EPDS | licencköteles | **validált** | nem |
| Whooley | **közkincs** | nem validált | **igen** |
| PHQ-9 · MSPSS · MIBS | licencköteles | nem validált | nem |
| LATCH · WHODAS 2.0-12 · EQ-5D-5L · BSES-SF · BSS-R | licencköteles | nincs | nem |

A táblázat két **független** tengelyt mutat, és a kettő következménye más:

- **a tételszöveg licence** eldönti, hogy az eszköz **felvehető-e**. Egy
  „kicsit érthetőbbre fogalmazott" EPDS-tétel már nem EPDS, és az eredménye
  nem hasonlítható semmihez;
- **a fordítás validáltsága** eldönti, hogy a vele gyűjtött adat
  **publikálható-e**. A Whooley felvehető, de az adata korlátozottan
  közölhető — ezért `unvalidatedTranslation`, nem `scored`.

```ts
SETS.state(reg, inst, state, "pp42").caveat
// "6 eszköz LICENC-KAPU mögött van a 6-ból: a validált tételszöveg nincs
//  betöltve, ezért nem vehető fel. Ez nem fejlesztői feladat és nem
//  adatgyűjtési mulasztás — BESZERZÉS. …"
```

Ez a mondat a modul valódi haszna. A licenc-kérdés a tervben „nyitott
kérdés" volt, amit a 4. fázisban vettek volna elő; így viszont **szám**, ami a
lefedettségi doksiban minden generáláskor újra kiíródik. Ami nem látszik,
azzal senki nem foglalkozik — ami minden build után ott áll, azzal igen.

## 4. Amit a rendszer nem számol ki: az EQ-5D index

```ts
resolve(reg, st, "prom.eq5d.profile").value   // 21123
```

A profil öt dimenzió szintje egymás után. **Nem hasznossági érték.** Az
EQ-5D-5L indexhez **országspecifikus, licencelt értékkészlet** kell, és egy
másik ország értékkészletével számolt index nem magyar adat — egy szám, ami
úgy néz ki, mintha az lenne.

A profil emellett **kód, nem mennyiség**: minden jegye önálló jelentésű, és
átlagot vagy különbséget képezni belőle értelmetlen. Ez a kalkulátor-réteg
egyetlen olyan kimenete, ahol a szám nem mennyiség — a mező dokumentációja
ezért ki is mondja.

A **VAS** az egyetlen EQ-5D-tétel, ami licencelt értékkészlet nélkül is
értelmezhető: a beteg saját 0–100-as skálája, nem populációs hasznosság.

### A WHODAS: két pontozás, két szám

Az egyszerű összegzés (0–48) és a hivatalos, tételválasz-elméleti (IRT)
pontozás **más számot ad**. A rendszer az egyszerűt számolja, és ezt kimondja
— a kettő nem cserélhető fel, és a nemzetközi összehasonlításnál jelezni kell,
melyiket használtuk. A BSS-R hasonlóan: három alskálája van, de a hivatalos
tétel-besorolás nincs betöltve, ezért **csak összpontszám** készül.

## 5. Az elégedettség nem minőség

Három tétel dokumentációja mond ki valamit, amit a szám önmagában elrejtene:

- **`prom.sat.overall`** — az elégedettség erősen függ az elvárástól, a
  személyzet kedvességétől és a kimeneteltől; **önmagában nem a szakmai
  színvonalat méri**;
- **`prom.resp.role`** — a kérdés nem az, hogy *sokat* vonták-e be, hanem
  hogy **annyira-e, amennyire szerette volna**. Van, aki a döntést az ellátóra
  bízná; nála a túlzott bevonás is rossz válasz;
- **`prom.resp.respect`** — a tiszteletteljes bánásmód hiánya **önálló
  kimenetel**, nem az elégedettség egy árnyalata, és a szülési élményt évekre
  meghatározza.

## 6. Tesztek

[`test/prom.test.ts`](../../test/prom.test.ts) — 24 teszt:

- a PROM-mező klinikusi eredettel nem írható, beteg-eredettel igen;
- az ellentmondás külön mezőbe kerül, eszközönként, és csak felvett eszközhöz;
- a 08. és a 16. modul EPDS-e ugyanaz a változó, egy értékkel;
- a 42. napos készlet mind a hat eszköze licenc-kapu mögött van;
- a licenc és a fordítás két külön kérdés, két külön következménnyel;
- tíz eszközből ma egy vehető fel;
- az EQ-5D profil ötjegyű kód, és hasznossági index nem létezik a rendszerben;
- hiányos kitöltésből nincs pontszám.
