# 05 — Mezőkatalógus

> **A katalógus-rész generált.** Forrása a `registry/variables/`; a
> `node tools/gen-field-catalog.ts` állítja elő. A konvenciók kézzel írtak.

## 1. Névadás

```
   domén . alcsoport . mező [. minősítő]
   ─────   ─────────   ────   ─────────
   vitals .  bp      . systolic
   exam   .  cervix  . dilation
   anthro .  weight  . prepregnancy
   hx     .  sys     . asthma
```

| Előtag | Mit tartalmaz |
|---|---|
| `patient.` | a beteg azonosító és demográfiai adatai — **jellemzően `phi`** |
| `ctx.` | az eset kontextusa: terhességi kor, dátumok, ellátási helyzet |
| `anthro.` | antropometria |
| `vitals.` | vitális paraméterek |
| `hx.` | anamnézis (`hx.sys` szervrendszeri, `hx.surg` műtéti, `hx.obs` szülészeti) |
| `sym.` | panaszok, tünetek |
| `exam.` | fizikális vizsgálati leletek |
| `lab.` | laboratóriumi eredmények |
| `us.` | ultrahangos mérések |
| `ekg.` | EKG-paraméterek |
| `nb.` | újszülött |
| `score.` | score-ok és megjelenítő tükreik |
| `rule.` | levezetett szabályértékek, kapuk |

**Az azonosító soha nem változik.** Ha a jelentés változik, a `version` nő; ha a
mező megszűnik, `status: "deprecated"` lesz, de az azonosító marad — a történeti
adat rá hivatkozik.

## 2. Kötelező tulajdonságok típusonként

| `datatype` | Kötelező még | Build elszáll, ha hiányzik |
|---|---|:--:|
| `quantity` | `unit` (UCUM), `domain` | figyelmeztetés |
| `coded`, `coded-multi` | `valueSet` | **igen** |
| `tristate` | `valueSet` `unknown` jelöléssel | — |
| `bool` | — | — |
| `date`, `datetime` | — | — |
| `text` | feloldás vagy indoklás (ld. 06) | — |
| mind | `documentation.definition` | **igen** |

## 3. Négy döntés minden új mezőnél

1. **`bool` vagy `tristate`?** Ha a „nem tudom" információ — és anamnesztikus
   kérdésnél mindig az —, akkor `tristate`.
2. **Van már ilyen mező?** Ha igen, `aliasOf`. Két primer változó azonos
   LOINC-kóddal **build-hiba**.
3. **`series` vagy `one`?** Ha időben ismétlődik (vitálisok, laborok), `series`,
   és kell hozzá `validity` ablak kontextusonként.
4. **`phi`?** Kétség esetén igen. A fölösleges jelölés kényelmetlen, a hiányzó jogsértő.

## 4. A tartományok három szintje

| Szint | Mit jelent | Mit tesz a rendszer |
|---|---|---|
| `domain.min`/`max` | fizikailag lehetetlen | **elutasítja az írást** |
| `domain.plausible` | szokatlan, de lehetséges | visszakérdez, elfogadja |
| `domain.critical` | azonnali klinikai jelzés | jelöli, riaszt |

A három összemosása gyakori hiba. A `min`/`max` **nem** a normáltartomány: ha
kizárja a valós beteget, adatvesztést okoz, mert a klinikus máshova írja be.

---

## 5. A katalógus


**894 változó**, 45 modulban.

| Jellemző | Darab | Arány |
|---|---:|---:|
| levezetett (`computed`) | 48 | 5% |
| előtöltött (`prefill`) | 2 | 0% |
| tükör (`aliasOf`) | 12 | 1% |
| beteg-azonosító (`phi`) | 2 | 0% |
| szabad szöveg (`text`) | 46 | 5% |

A szabad szöveges mezők aránya **5%** — a `docs/11-strukturalt-adat.md` célja legfeljebb 10%.

### `addr` — 3 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `addr.county` | Megye | text | — | — | — | — | — |
| `addr.postcode` | Irányítószám | text | — | — | — | `addr.county` `addr.settlement` | — |
| `addr.settlement` | Település | text | — | — | — | — | — |

### `admin` — 3 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `patient.age` | Életkor | quantity | a | 0–120 | `calc.age` | `diet.energyTarget` `lab.egfr` `rx.crcl` | — |
| `patient.birthDate` | Születési dátum | date | — | — | — | `demog.birthYear` `patient.age` | `phi` |
| `patient.taj` | TAJ-szám | text | — | — | — | — | `phi` `audit` |

### `allergy` — 5 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `allergy.asked` | Az allergiát megkérdezték | tristate | — | 3 kód | — | — | — |
| `allergy.list` | Ismert allergiák | coded-multi | — | 11 kód | — | — | — |
| `allergy.reaction` | Az allergiás reakció jellege | coded | — | 7 kód | — | — | — |
| `allergy.severity` | A reakció súlyossága | coded | — | 4 kód | — | — | — |
| `allergy.verified` | Az allergia igazolt | coded | — | 4 kód | — | — | — |

### `anthro` — 6 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `anthro.bmi` | Testtömegindex (BMI) | quantity | kg/m2 | 10–80 | `calc.bmi` | — | — |
| `anthro.bsa` | Testfelszín | quantity | m2 | 0.5–3.5 | `calc.bsa.mosteller` | — | — |
| `anthro.height` | Testmagasság | quantity | cm | 120–210 | — | `anthro.bmi` `anthro.bsa` `diet.energyTarget` | — |
| `anthro.weight.current` | Aktuális testsúly | quantity | kg | 25–250 | — | `anthro.bsa` `anthro.weightGain` `rx.crcl` `rx.lmwh.dailyDose` | sorozat |
| `anthro.weight.prepregnancy` | Terhesség előtti testsúly | quantity | kg | 30–250 | — | `anthro.bmi` `anthro.weightGain` `diet.energyTarget` `diet.proteinTarget` | — |
| `anthro.weightGain` | Terhességi súlygyarapodás | quantity | kg | -20–60 | `calc.weightGain` | — | — |

### `code` — 7 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `code.coder` | A kódoló | text | — | — | — | — | `audit` |
| `code.dx.certainty` | A diagnózis bizonyossága | coded | — | 4 kód | — | — | — |
| `code.dx.primary` | Fődiagnózis (BNO) | text | — | — | — | — | `audit` sorozat |
| `code.dx.secondary` | Kísérő betegségek (BNO) | text | — | — | — | — | sorozat |
| `code.hbcs.final` | Végleges HBCS-besorolás | text | — | — | — | — | `audit` |
| `code.proc.performed` | Elvégzett beavatkozások (OENO) | text | — | — | — | — | sorozat |
| `code.rulebook.hbcs` | A HBCS-szabálykönyv verziója | text | — | — | — | — | — |

### `complaints` — 15 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `compl.active` | Aktív panaszok | coded-multi | — | 82 kód | — | — | — |
| `compl.chief` | Vezető panasz | coded | — | 82 kód | — | — | — |
| `compl.q.course` | Alakulás a kezdet óta | coded | — | 4 kód | — | — | — |
| `compl.q.firstEpisode` | Első alkalom | tristate | — | 3 kód | — | — | — |
| `compl.q.impact` | Hatása a napi életre | coded | — | 4 kód | — | — | — |
| `compl.q.onset` | Kezdet időpontja | datetime | — | — | — | — | — |
| `compl.q.onsetType` | Kezdet jellege | coded | — | 5 kód | — | — | — |
| `compl.q.provoke` | Mi váltja ki vagy erősíti | coded-multi | — | 11 kód | — | — | — |
| `compl.q.quality` | A panasz jellege | coded | — | 8 kód | — | — | — |
| `compl.q.radiation` | Sugárzás | coded-multi | — | 8 kód | — | — | — |
| `compl.q.relieve` | Mi enyhíti | coded-multi | — | 7 kód | — | — | — |
| `compl.q.severity` | Erősség (0–10) | quantity | 1 | 0–10 | — | — | — |
| `compl.q.timing` | Időbeli lefolyás | coded | — | 5 kód | — | — | — |
| `compl.verbatim` | A beteg saját szavai | text | — | — | — | — | — |
| `sym.chestPainDyspnea` | Mellkasi fájdalom vagy nehézlégzés | bool | — | — | — | — | — |

### `ctx` — 20 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `ctx.breastfeeding` | Szoptat | tristate | — | 3 kód | — | — | — |
| `ctx.conception` | Fogamzás módja | coded | — | 7 kód | — | — | — |
| `ctx.consentState` | Kutatási beleegyezés állapota | coded | — | 5 kód | — | — | `audit` |
| `ctx.edd` | Várható szülési időpont | date | — | — | `calc.edd.naegele` | — | — |
| `ctx.eduLevel` | Képzettségi szint | coded | — | 4 kód | — | — | — |
| `ctx.encounter` | Ellátási esemény típusa | coded | — | 6 kód | — | — | — |
| `ctx.ga` | Gesztációs kor | quantity | wk | 0–45 | `calc.ga.lmp` | `diet.energyTarget` | — |
| `ctx.gaSource` | A gesztációs kor forrása | coded | — | 5 kód | — | — | — |
| `ctx.lmp` | Utolsó menstruáció első napja | date | — | — | — | `ctx.edd` `ctx.ga` | — |
| `ctx.multiple` | Többes terhesség — chorionicitás és amnionicitás | coded | — | 5 kód | — | — | — |
| `ctx.now` | Vizsgálat időpontja | datetime | — | — | — | `ctx.ga` `labour.hour` `patient.age` `status.obs.membranes.hours` | — |
| `ctx.parity.gravida` | Gravida | quantity | 1 | 0–25 | — | — | — |
| `ctx.parity.para` | Para | quantity | 1 | 0–20 | — | — | — |
| `ctx.pathway` | Ellátási útvonal | coded | — | 7 kód | — | — | — |
| `ctx.pregnant` | Terhes-e | tristate | — | 3 kód | — | — | — |
| `ctx.purpose` | A vizit célja | coded | — | 6 kód | — | — | — |
| `ctx.referral` | Beutalóval érkezett | bool | — | — | — | — | — |
| `ctx.referralDx` | Beutaló diagnózisa | coded | — | 7 kód | — | — | — |
| `ctx.referralOrg` | Beutaló intézmény | text | — | — | — | — | — |
| `ctx.role` | A rögzítő szerepe | coded | — | 5 kód | — | — | — |

### `demog` — 1 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `demog.birthYear` | Születési év | quantity | — | 1900–2100 | `calc.birthYear` | — | — |

### `diet` — 31 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `diet.allergies.food` | Ételallergia | coded-multi | — | 10 kód | — | — | — |
| `diet.carb.breakfast` | Szénhidrát — reggeli | quantity | g | 0–200 | — | — | — |
| `diet.carb.dinner` | Szénhidrát — vacsora | quantity | g | 0–200 | — | — | — |
| `diet.carb.lunch` | Szénhidrát — ebéd | quantity | g | 0–200 | — | — | — |
| `diet.carb.snack1` | Szénhidrát — tízórai | quantity | g | 0–200 | — | — | — |
| `diet.carb.snack2` | Szénhidrát — uzsonna | quantity | g | 0–200 | — | — | — |
| `diet.carb.snack3` | Szénhidrát — utóvacsora | quantity | g | 0–200 | — | — | — |
| `diet.counselingDate` | A tanácsadás időpontja | date | — | — | — | — | — |
| `diet.counselingGiven` | Dietetikai tanácsadás megtörtént | bool | — | — | — | — | — |
| `diet.energyTarget` | Napi energiaszükséglet | quantity | kcal | 800–5000 | `calc.energy.pregnancy` ⛔ | — | — |
| `diet.fluidIntake` | Napi folyadékbevitel | quantity | L | 0–10 | — | — | — |
| `diet.pattern` | Jelenlegi étrend | coded | — | 6 kód | — | — | — |
| `diet.proteinTarget` | Napi fehérjeszükséglet | quantity | g | 20–300 | `calc.protein.pregnancy` | — | — |
| `diet.restrictions` | Étrendi megszorítások | coded-multi | — | 7 kód | — | — | — |
| `diet.selfMonitoring` | Vércukor-önellenőrzési napló | bool | — | — | — | — | — |
| `diet.supp.b12` | B12-vitamin — javasolt | bool | — | — | — | — | — |
| `diet.supp.b12.dose` | B12-vitamin — napi adag | quantity | ug | 0–2000 | — | — | — |
| `diet.supp.calcium` | Kalcium — javasolt | bool | — | — | — | — | — |
| `diet.supp.calcium.dose` | Kalcium — napi adag | quantity | mg | 0–3000 | — | — | — |
| `diet.supp.dha` | Omega-3 (DHA) — javasolt | bool | — | — | — | — | — |
| `diet.supp.dha.dose` | Omega-3 (DHA) — napi adag | quantity | mg | 0–5000 | — | — | — |
| `diet.supp.folate` | Folsav — javasolt | bool | — | — | — | — | — |
| `diet.supp.folate.dose` | Folsav — napi adag | quantity | ug | 0–5000 | — | — | — |
| `diet.supp.iodine` | Jód — javasolt | bool | — | — | — | — | — |
| `diet.supp.iodine.dose` | Jód — napi adag | quantity | ug | 0–1000 | — | — | — |
| `diet.supp.iron` | Vas — javasolt | bool | — | — | — | — | — |
| `diet.supp.iron.dose` | Vas — napi adag | quantity | mg | 0–500 | — | — | — |
| `diet.supp.multivit` | Terhes-multivitamin — javasolt | bool | — | — | — | — | — |
| `diet.supp.multivit.dose` | Terhes-multivitamin — napi adag | quantity | {tbl} | 0–10 | — | — | — |
| `diet.supp.vitaminD` | D-vitamin — javasolt | bool | — | — | — | — | — |
| `diet.supp.vitaminD.dose` | D-vitamin — napi adag | quantity | [IU] | 0–10000 | — | — | — |

### `disch` — 19 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `disch.admittedAt` | Felvétel időpontja | datetime | — | — | — | — | — |
| `disch.at` | Elbocsátás időpontja | datetime | — | — | — | — | — |
| `disch.condition` | Állapot az elbocsátáskor | coded | — | 5 kód | — | — | — |
| `disch.countersignedAt` | Ellenjegyzés időpontja | datetime | — | — | — | — | `audit` |
| `disch.countersignedBy` | Ellenjegyző | text | — | — | — | — | `audit` |
| `disch.dxAdmission` | Felvételi diagnózis | text | — | — | — | — | — |
| `disch.dxFinal` | Végdiagnózis | text | — | — | — | — | — |
| `disch.gpNotified` | A háziorvos értesítve | tristate | — | 3 kód | — | — | — |
| `disch.institution.approved` | Az intézmény befogadta a generált zárójelentést | tristate | — | 3 kód | — | — | — |
| `disch.institution.name` | Ellátó intézmény | text | — | — | — | — | — |
| `disch.language` | A beteg példányának nyelve | coded | — | 4 kód | — | — | — |
| `disch.medication.reconciled` | Gyógyszerelés egyeztetve az elbocsátáskor | bool | — | — | — | — | — |
| `disch.patientCopyGiven` | A beteg példánya átadva | bool | — | — | — | — | — |
| `disch.restrictions` | Korlátozások, életmódi javaslatok | text | — | — | — | — | — |
| `disch.sickLeave.until` | Keresőképtelenség vége | date | — | — | — | — | — |
| `disch.signedAt` | A zárójelentés aláírásának időpontja | datetime | — | — | — | — | `audit` |
| `disch.signedBy` | Aláíró orvos | text | — | — | — | — | `audit` |
| `disch.summaryReviewedBy` | A generált tartalmat átnézte | text | — | — | — | — | `audit` |
| `disch.type` | Az elbocsátás módja | coded | — | 5 kód | — | — | — |

### `ekg` — 75 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `ekg.avf.q` | Q-hullám mélysége — aVF | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.avf.r` | R-amplitúdó — aVF | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.avf.s` | S-amplitúdó — aVF | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.avf.st` | ST-eltérés — aVF | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.avf.t` | T-hullám — aVF | coded | — | 5 kód | — | — | sorozat |
| `ekg.avl.q` | Q-hullám mélysége — aVL | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.avl.r` | R-amplitúdó — aVL | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.avl.s` | S-amplitúdó — aVL | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.avl.st` | ST-eltérés — aVL | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.avl.t` | T-hullám — aVL | coded | — | 5 kód | — | — | sorozat |
| `ekg.avr.q` | Q-hullám mélysége — aVR | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.avr.r` | R-amplitúdó — aVR | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.avr.s` | S-amplitúdó — aVR | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.avr.st` | ST-eltérés — aVR | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.avr.t` | T-hullám — aVR | coded | — | 5 kód | — | — | sorozat |
| `ekg.axis` | QRS-tengely | quantity | deg | -180–180 | — | — | sorozat |
| `ekg.calibrationConfirmed` | A kalibráció megerősítve | bool | — | — | — | — | — |
| `ekg.gain` | Érzékenység | quantity | mm/mV | 2.5–40 | — | — | — |
| `ekg.i.q` | Q-hullám mélysége — I. | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.i.r` | R-amplitúdó — I. | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.i.s` | S-amplitúdó — I. | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.i.st` | ST-eltérés — I. | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.i.t` | T-hullám — I. | coded | — | 5 kód | — | — | sorozat |
| `ekg.ii.q` | Q-hullám mélysége — II. | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.ii.r` | R-amplitúdó — II. | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.ii.s` | S-amplitúdó — II. | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.ii.st` | ST-eltérés — II. | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.ii.t` | T-hullám — II. | coded | — | 5 kód | — | — | sorozat |
| `ekg.iii.q` | Q-hullám mélysége — III. | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.iii.r` | R-amplitúdó — III. | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.iii.s` | S-amplitúdó — III. | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.iii.st` | ST-eltérés — III. | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.iii.t` | T-hullám — III. | coded | — | 5 kód | — | — | sorozat |
| `ekg.narrative` | EKG — kiegészítő leírás | text | — | — | — | — | — |
| `ekg.paperSpeed` | Papírsebesség | quantity | mm/s | 5–100 | — | — | — |
| `ekg.pr` | PR-távolság | quantity | ms | 50–500 | — | — | sorozat |
| `ekg.qrs` | QRS-szélesség | quantity | ms | 40–300 | — | — | sorozat |
| `ekg.qt` | QT-távolság | quantity | ms | 200–700 | — | `ekg.qtc.bazett` `ekg.qtc.fridericia` | — |
| `ekg.qtc.bazett` | Korrigált QT (Bazett) | quantity | ms | 250–700 | `calc.qtc.bazett` | — | — |
| `ekg.qtc.fridericia` | Korrigált QT (Fridericia) | quantity | ms | 250–700 | `calc.qtc.fridericia` | — | — |
| `ekg.rate` | Kamrai frekvencia | quantity | /min | 20–300 | — | — | sorozat |
| `ekg.rhythm` | Alapritmus | coded | — | 10 kód | — | — | sorozat |
| `ekg.s1q3t3` | S1Q3T3 mintázat | bool | — | — | — | — | sorozat |
| `ekg.sgarbossa` | Sgarbossa-kritériumok | coded | — | 4 kód | — | — | sorozat |
| `ekg.source` | A felvétel forrása | coded | — | 4 kód | — | — | — |
| `ekg.v1.q` | Q-hullám mélysége — V1 | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.v1.r` | R-amplitúdó — V1 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v1.s` | S-amplitúdó — V1 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v1.st` | ST-eltérés — V1 | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.v1.t` | T-hullám — V1 | coded | — | 5 kód | — | — | sorozat |
| `ekg.v2.q` | Q-hullám mélysége — V2 | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.v2.r` | R-amplitúdó — V2 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v2.s` | S-amplitúdó — V2 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v2.st` | ST-eltérés — V2 | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.v2.t` | T-hullám — V2 | coded | — | 5 kód | — | — | sorozat |
| `ekg.v3.q` | Q-hullám mélysége — V3 | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.v3.r` | R-amplitúdó — V3 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v3.s` | S-amplitúdó — V3 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v3.st` | ST-eltérés — V3 | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.v3.t` | T-hullám — V3 | coded | — | 5 kód | — | — | sorozat |
| `ekg.v4.q` | Q-hullám mélysége — V4 | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.v4.r` | R-amplitúdó — V4 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v4.s` | S-amplitúdó — V4 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v4.st` | ST-eltérés — V4 | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.v4.t` | T-hullám — V4 | coded | — | 5 kód | — | — | sorozat |
| `ekg.v5.q` | Q-hullám mélysége — V5 | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.v5.r` | R-amplitúdó — V5 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v5.s` | S-amplitúdó — V5 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v5.st` | ST-eltérés — V5 | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.v5.t` | T-hullám — V5 | coded | — | 5 kód | — | — | sorozat |
| `ekg.v6.q` | Q-hullám mélysége — V6 | quantity | mV | 0–5 | — | — | sorozat |
| `ekg.v6.r` | R-amplitúdó — V6 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v6.s` | S-amplitúdó — V6 | quantity | mV | 0–8 | — | — | sorozat |
| `ekg.v6.st` | ST-eltérés — V6 | quantity | mV | -2–2 | — | — | sorozat |
| `ekg.v6.t` | T-hullám — V6 | coded | — | 5 kód | — | — | sorozat |

### `epi` — 12 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `epi.body` | Az okoslelet szövege | text | — | — | — | — | sorozat |
| `epi.consult.question` | A konzíliumtól kért kérdés | text | — | — | — | — | — |
| `epi.followUp.plan` | Utánkövetési terv | text | — | — | — | — | — |
| `epi.gaps.acknowledged` | Az információhiány tudomásul véve | bool | — | — | — | — | `audit` |
| `epi.generation` | Előállítás módja | coded | — | 3 kód | — | — | sorozat |
| `epi.outcome.disposition` | Az ellátás kimenetele | coded | — | 6 kód | — | — | sorozat |
| `epi.outcome.lengthOfStay` | Ápolási idő | quantity | d | 0–400 | — | — | — |
| `epi.reviewed` | Az okoslelet átnézve | bool | — | — | — | — | `audit` |
| `epi.signedAt` | Az epikrízis aláírásának időpontja | datetime | — | — | — | — | `audit` |
| `epi.signedBy` | Aláíró | text | — | — | — | — | `audit` |
| `epi.style` | Okoslelet stílusa | coded | — | 5 kód | — | — | sorozat |
| `epi.version` | Verziószám | quantity | 1 | 1–1000 | — | — | sorozat |

### `exam.obs` — 5 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `exam.cervix.consistency` | A cervix konzisztenciája | coded | — | 3 kód | — | `score.bishop.total` | — |
| `exam.cervix.dilation` | Méhszáj-tágulat | quantity | cm | 0–10 | — | `labour.cervix` `score.bishop.dilation` `score.bishop.total` | sorozat |
| `exam.cervix.effacement` | Elvékonyodás | quantity | % | 0–100 | — | `score.bishop.total` | sorozat |
| `exam.cervix.position` | Pozíció | coded | — | 3 kód | — | `score.bishop.total` | — |
| `exam.cervix.station` | Beszállás (station) | coded | — | 4 kód | — | `score.bishop.total` | — |

### `fu` — 4 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `fu.consentToContact` | Hozzájárul az utánkövetéshez | tristate | — | 3 kód | — | — | — |
| `fu.contactAttempts` | Megkeresési kísérletek száma | quantity | 1 | 0–50 | — | — | — |
| `fu.contactChannel` | A megkeresés csatornája | coded | — | 5 kód | — | — | sorozat |
| `fu.outcome` | Az utánkövetés kimenetele | coded | — | 6 kód | — | — | sorozat |

### `hx` — 1 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.repro.currentPregnancy.preeclampsia` | Praeeclampsia a jelen terhességben | tristate | — | 3 kód | — | — | — |

### `hx.eeszt` — 12 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.eeszt.age` | Életkor szerinti kockázat | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.assisted` | Asszisztált reprodukció | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.bmi` | Testtömegindex szerinti kockázat | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.chronicDisease` | Krónikus betegség | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.infection` | Fertőzés | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.multiple` | Többes terhesség (EESZT rizikókód) | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.parity` | Parity szerinti kockázat | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.prevLoss` | Korábbi terhességvesztés | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.prevPreterm` | Korábbi koraszülés (EESZT rizikókód) | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.psych` | Pszichiátriai kockázat | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.social` | Szociális kockázat | tristate | — | 3 kód | — | — | — |
| `hx.eeszt.substance` | Szerhasználat | tristate | — | 3 kód | — | — | — |

### `hx.family` — 7 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.family.ageAtDeath` | Életkor a halálozáskor | quantity | a | 0–120 | — | — | — |
| `hx.family.ageAtOnset` | Életkor a diagnóziskor | quantity | a | 0–110 | — | — | — |
| `hx.family.dataSource` | Az adat forrása | coded | — | 4 kód | — | — | — |
| `hx.family.diagnosisReliability` | A diagnózis megbízhatósága | coded | — | 3 kód | — | — | — |
| `hx.family.disease` | Betegség | coded-multi | — | 20 kód | — | — | — |
| `hx.family.documentationGap` | Dokumentációs hiány | tristate | — | 3 kód | — | — | — |
| `hx.family.relation` | Rokonsági fok | coded | — | 14 kód | — | — | — |

### `hx.gyn` — 3 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.gyn.cervix.adequateScreening` | Dokumentáltan megfelelő méhnyakszűrési előzmény | tristate | — | 3 kód | — | — | — |
| `hx.gyn.cervix.cin2plus` | CIN2+ / AIS / méhnyakrák az előzményben | tristate | — | 3 kód | — | — | — |
| `hx.gyn.cervix.removed` | A méhnyak eltávolításra került | tristate | — | 3 kód | — | — | — |

### `hx.life` — 4 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.life.alcohol` | Alkoholfogyasztás | coded | — | 4 kód | — | — | — |
| `hx.life.drugs` | Kábítószer-használat | tristate | — | 3 kód | — | — | — |
| `hx.life.smoking` | Dohányzás | coded | — | 4 kód | — | — | — |
| `hx.life.smoking.perDay` | Napi cigaretta | quantity | 1 | 0–80 | — | — | — |

### `hx.origin` — 3 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.origin.birthWeight` | Saját születési súly | quantity | g | 300–6500 | — | — | — |
| `hx.origin.maternalPreeclampsia` | Az anyja praeeclampsiás volt-e | tristate | — | 3 kód | — | — | — |
| `hx.origin.preterm` | Saját koraszülöttség | tristate | — | 3 kód | — | — | — |

### `hx.psy` — 6 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.psy.anxiety` | Szorongásos zavar | tristate | — | 3 kód | — | — | — |
| `hx.psy.bipolar` | Bipoláris zavar | tristate | — | 3 kód | — | — | — |
| `hx.psy.depression` | Depresszió | tristate | — | 3 kód | — | — | — |
| `hx.psy.eatingDisorder` | Evészavar | tristate | — | 3 kód | — | — | — |
| `hx.psy.prevPPD` | Korábbi postpartum depresszió | tristate | — | 3 kód | — | — | — |
| `hx.psy.prevPPP` | Korábbi postpartum pszichózis | tristate | — | 3 kód | — | — | — |

### `hx.repro` — 21 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.repro.contraception` | Fogamzásgátlás | coded | — | 9 kód | — | — | — |
| `hx.repro.currentPregnancy.accreta` | Placenta accreta gyanúja | tristate | — | 3 kód | — | — | — |
| `hx.repro.currentPregnancy.previa` | Placenta previa a jelen terhességben | tristate | — | 3 kód | — | — | — |
| `hx.repro.cycleLength` | Ciklushossz | quantity | d | 15–90 | — | — | — |
| `hx.repro.gdm` | Korábbi terhességi cukorbetegség | tristate | — | 3 kód | — | — | — |
| `hx.repro.intervention.curettage` | Méhűri beavatkozás | tristate | — | 3 kód | — | — | — |
| `hx.repro.loss.ectopic` | Méhen kívüli terhesség | tristate | — | 3 kód | — | — | — |
| `hx.repro.loss.induced` | Művi terhességmegszakítás | quantity | 1 | 0–15 | — | — | — |
| `hx.repro.loss.missed` | Nem fejlődő terhesség | quantity | 1 | 0–15 | — | — | — |
| `hx.repro.loss.mola` | Molaterhesség | tristate | — | 3 kód | — | — | — |
| `hx.repro.loss.spontaneous` | Spontán vetélés | quantity | 1 | 0–15 | — | — | — |
| `hx.repro.menarche` | Menarche életkora | quantity | a | 8–20 | — | — | — |
| `hx.repro.preeclampsia` | Korábbi praeeclampsia | tristate | — | 3 kód | — | — | — |
| `hx.repro.prevBirth.cs` | Korábbi császármetszés | quantity | 1 | 0–10 | — | — | — |
| `hx.repro.prevBirth.pph` | Korábbi szülés utáni vérzés | tristate | — | 3 kód | — | — | — |
| `hx.repro.prevBirth.preterm` | Korábbi koraszülés (saját anamnézis) | tristate | — | 3 kód | — | — | — |
| `hx.repro.prevBirth.recurringIndication` | Ismétlődő császármetszési javallat | tristate | — | 3 kód | — | — | — |
| `hx.repro.prevBirth.shoulderDystocia` | Korábbi vállelakadás | tristate | — | 3 kód | — | — | — |
| `hx.repro.prevBirth.tear34` | Korábbi harmad- vagy negyedfokú gátrepedés | tristate | — | 3 kód | — | — | — |
| `hx.repro.prevBirth.vaginal` | Korábbi hüvelyi szülés | quantity | 1 | 0–20 | — | — | — |
| `hx.repro.prevBirth.vbac` | Korábbi sikeres VBAC | tristate | — | 3 kód | — | — | — |

### `hx.supp` — 9 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.supp.b12` | B12-vitamin | tristate | — | 3 kód | — | — | — |
| `hx.supp.calcium` | Kalcium | tristate | — | 3 kód | — | — | — |
| `hx.supp.dha` | Omega-3 (DHA) | tristate | — | 3 kód | — | — | — |
| `hx.supp.folate` | Folsav | tristate | — | 3 kód | — | — | — |
| `hx.supp.folate.dose` | Folsav napi dózisa | quantity | ug | 0–5000 | — | — | — |
| `hx.supp.iodine` | Jód | tristate | — | 3 kód | — | — | — |
| `hx.supp.iron` | Vas | tristate | — | 3 kód | — | — | — |
| `hx.supp.multivit` | Terhesvitamin | tristate | — | 3 kód | — | — | — |
| `hx.supp.vitD` | D-vitamin | tristate | — | 3 kód | — | — | — |

### `hx.surg` — 5 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.surg.anesthesiaProblem` | Aneszteziológiai probléma | tristate | — | 3 kód | — | — | — |
| `hx.surg.complication` | Volt-e szövődmény | tristate | — | 3 kód | — | — | — |
| `hx.surg.spineIssue` | Gerinc-elváltozás vagy műtét | coded | — | 5 kód | — | — | — |
| `hx.surg.type` | Korábbi műtét | coded | — | 12 kód | — | — | — |
| `hx.surg.year` | A műtét éve | quantity | a | 1930–2100 | — | — | — |

### `hx.sys` — 27 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `hx.sys.anemia` | Krónikus vérszegénység | tristate | — | 3 kód | — | — | — |
| `hx.sys.aps` | Antifoszfolipid szindróma | tristate | — | 3 kód | — | — | — |
| `hx.sys.asthma` | Asztma / krónikus légúti betegség | tristate | — | 3 kód | előtöltés: carryForward | `rule.carboprost.blocked` | — |
| `hx.sys.autoimmune` | Autoimmun betegség | tristate | — | 3 kód | — | — | — |
| `hx.sys.bariatric` | Bariátriai műtét | tristate | — | 3 kód | — | — | — |
| `hx.sys.bleedingDisorder` | Vérzékenység | tristate | — | 3 kód | — | — | — |
| `hx.sys.cardiac.congenital` | Veleszületett szívhiba | tristate | — | 3 kód | — | — | — |
| `hx.sys.cardiac.mechValve` | Mechanikus műbillentyű | tristate | — | 3 kód | — | — | — |
| `hx.sys.cardiac.prevEvent` | Korábbi szívesemény vagy ritmuszavar | tristate | — | 3 kód | — | — | — |
| `hx.sys.celiac` | Coeliakia | tristate | — | 3 kód | — | — | — |
| `hx.sys.dm1` | 1-es típusú diabetes | tristate | — | 3 kód | — | — | — |
| `hx.sys.dm2` | 2-es típusú diabetes | tristate | — | 3 kód | — | — | — |
| `hx.sys.endometriosis` | Endometriosis | tristate | — | 3 kód | — | — | — |
| `hx.sys.epilepsy` | Epilepszia | tristate | — | 3 kód | — | — | — |
| `hx.sys.htn` | Magas vérnyomás | tristate | — | 3 kód | — | — | — |
| `hx.sys.ibd` | Gyulladásos bélbetegség | tristate | — | 3 kód | — | — | — |
| `hx.sys.liver` | Krónikus májbetegség | tristate | — | 3 kód | — | — | — |
| `hx.sys.migraine` | Migrén | tristate | — | 3 kód | — | — | — |
| `hx.sys.myoma` | Myoma | tristate | — | 3 kód | — | — | — |
| `hx.sys.osa` | Alvási apnoe | tristate | — | 3 kód | — | — | — |
| `hx.sys.pcos` | PCOS | tristate | — | 3 kód | — | — | — |
| `hx.sys.renal` | Krónikus vesebetegség | tristate | — | 3 kód | — | — | — |
| `hx.sys.thrombophilia` | Ismert thrombophilia | tristate | — | 3 kód | — | — | — |
| `hx.sys.thyroid.hyper` | Pajzsmirigy-túlműködés | tristate | — | 3 kód | — | — | — |
| `hx.sys.thyroid.hypo` | Pajzsmirigy-alulműködés | tristate | — | 3 kód | — | — | — |
| `hx.sys.uterineAnomaly` | Méhfejlődési rendellenesség | tristate | — | 3 kód | — | — | — |
| `hx.sys.vte` | Korábbi thrombosis vagy embólia | tristate | — | 3 kód | — | — | — |

### `imaging` — 65 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `ctg.accel` | CTG gyorsulások | tristate | — | 3 kód | — | — | sorozat |
| `ctg.baseline` | CTG alapvonal | quantity | /min | 50–220 | — | — | sorozat |
| `ctg.category` | CTG besorolás | coded | — | 4 kód | — | — | sorozat |
| `ctg.decel` | CTG lassulások | coded | — | 6 kód | — | — | sorozat |
| `ctg.variability` | CTG variabilitás | coded | — | 5 kód | — | — | sorozat |
| `img.alternativeConsidered` | Mérlegelt sugármentes alternatíva | text | — | — | — | — | sorozat |
| `img.contrast` | Kontrasztanyag | coded | — | 5 kód | — | — | sorozat |
| `img.doseEstimate` | Becsült effektív dózis | quantity | mSv | 0–500 | — | — | sorozat |
| `img.fetalDoseEstimate` | Becsült magzati dózis | quantity | mGy | 0–500 | — | — | sorozat |
| `img.hsg.cavity` | Méhűr alakja | coded | — | 6 kód | — | — | sorozat |
| `img.hsg.spill` | Peritoneális szóródás | coded | — | 3 kód | — | — | sorozat |
| `img.hsg.tube.left` | Bal petevezeték átjárhatósága | coded | — | 4 kód | — | — | sorozat |
| `img.hsg.tube.right` | Jobb petevezeték átjárhatósága | coded | — | 4 kód | — | — | sorozat |
| `img.indication` | A képalkotó vizsgálat indikációja | coded | — | 11 kód | — | — | sorozat |
| `img.mammography.birads` | Mammográfia BI-RADS besorolása | coded | — | 7 kód | — | — | sorozat |
| `img.modality` | Vizsgálati módszer | coded | — | 9 kód | — | — | sorozat |
| `img.narrative` | Radiológiai lelet szövege | text | — | — | — | — | sorozat |
| `img.pregnancyStatusAtExam` | Terhességi státusz a vizsgálat idején | coded | — | 4 kód | — | — | sorozat |
| `img.radiationJustified` | A sugárterhelés indokoltsága rögzítve | bool | — | — | — | — | sorozat |
| `img.result` | Összefoglaló lelet | coded | — | 5 kód | — | — | sorozat |
| `us.afi` | Magzatvíz-index (AFI) | quantity | cm | 0–50 | — | — | sorozat |
| `us.breast` | Emlő-ultrahang | coded | — | 4 kód | — | — | — |
| `us.breast.finding` | Emlő-ultrahang lelet | coded | — | 7 kód | — | — | sorozat |
| `us.breast.side` | Emlő-ultrahang — melyik oldal | coded | — | 3 kód | — | — | — |
| `us.cardiac.aorticRoot` | Aortagyök átmérője | quantity | mm | 10–80 | — | — | sorozat |
| `us.cardiac.ef` | Bal kamrai ejekciós frakció | quantity | % | 5–85 | — | — | sorozat |
| `us.cardiac.lvot` | Bal kamrai kiáramlási gradiens | quantity | mm[Hg] | 0–200 | — | — | sorozat |
| `us.cardiac.paps` | Becsült pulmonalis nyomás | quantity | mm[Hg] | 5–150 | — | — | sorozat |
| `us.cervicalLength` | Méhnyakhossz | quantity | mm | 0–70 | — | — | sorozat |
| `us.cpr` | Cerebro-placentáris arány | quantity | 1 | 0–10 | `calc.cpr` | — | — |
| `us.crl` | CRL — ülőmagasság | quantity | mm | 1–120 | — | `us.ga.crl` | sorozat |
| `us.crl.first` | CRL — az első trimeszteri mérés | quantity | mm | 1–90 | — | — | — |
| `us.dv.pi` | Ductus venosus PI | quantity | 1 | 0–5 | — | — | sorozat |
| `us.endometrium.pattern` | Endometrium jellege | coded | — | 6 kód | — | — | sorozat |
| `us.endometrium.thickness` | Endometrium-vastagság | quantity | mm | 0–60 | — | — | sorozat |
| `us.fast.result` | FAST-vizsgálat eredménye | coded | — | 3 kód | — | — | sorozat |
| `us.fetal.sex` | Magzat neme | coded | — | 4 kód | — | — | sorozat |
| `us.fetal.viability` | Magzati életjelenség | coded | — | 4 kód | — | — | sorozat |
| `us.gs` | Petezsák átmérője | quantity | mm | 1–100 | — | — | sorozat |
| `us.gyn` | Nőgyógyászati ultrahang | coded | — | 4 kód | — | — | — |
| `us.gyn.finding` | Ultrahang lelet | coded | — | 10 kód | — | — | sorozat |
| `us.gyn.freeFluid` | Szabad hasi folyadék | coded | — | 4 kód | — | — | sorozat |
| `us.hl` | Humerus hossza | quantity | mm | 1–100 | — | — | sorozat |
| `us.ivc.collapse` | Vena cava inferior kollapszus | quantity | % | 0–100 | — | — | sorozat |
| `us.lung.blines` | B-vonalak száma | quantity | 1 | 0–30 | — | — | sorozat |
| `us.mca.pi` | Arteria cerebri media PI | quantity | 1 | 0–6 | — | `us.cpr` | sorozat |
| `us.mca.psv` | Arteria cerebri media csúcssebesség | quantity | cm/s | 0–200 | — | — | sorozat |
| `us.myoma.count` | Myomák száma | quantity | 1 | 0–50 | — | — | sorozat |
| `us.myoma.figo` | Vezető myoma FIGO-típusa | coded | — | 9 kód | — | — | sorozat |
| `us.narrative` | Ultrahang — kiegészítő leírás | text | — | — | — | — | — |
| `us.nasalBone` | Orrcsont | coded | — | 3 kód | — | — | sorozat |
| `us.nt` | Nyaki átlátszóság (NT) | quantity | mm | 0.5–15 | — | — | sorozat |
| `us.ovary.afc.left` | Antralis tüszőszám — bal | quantity | 1 | 0–60 | — | — | sorozat |
| `us.ovary.afc.right` | Antralis tüszőszám — jobb | quantity | 1 | 0–60 | — | — | sorozat |
| `us.placenta.accretaSigns` | Beékelődés (accreta) jelei | coded | — | 5 kód | — | — | sorozat |
| `us.placenta.site` | A lepény elhelyezkedése | coded | — | 6 kód | — | — | sorozat |
| `us.pregnancy.location` | A terhesség elhelyezkedése | coded | — | 7 kód | — | — | sorozat |
| `us.sdp` | Legmélyebb magzatvíztasak | quantity | cm | 0–30 | — | — | sorozat |
| `us.subchorionic` | Subchorialis haematoma | coded | — | 4 kód | — | — | sorozat |
| `us.tricuspid` | Tricuspidalis regurgitáció | coded | — | 3 kód | — | — | sorozat |
| `us.ua.enddiastolic` | Végdiasztolés áramlás a köldökartériában | coded | — | 3 kód | — | — | sorozat |
| `us.ua.pi` | Arteria umbilicalis PI | quantity | 1 | 0–6 | — | `us.cpr` | sorozat |
| `us.uta.pi.left` | Arteria uterina PI — bal | quantity | 1 | 0–6 | — | — | sorozat |
| `us.uta.pi.right` | Arteria uterina PI — jobb | quantity | 1 | 0–6 | — | — | sorozat |
| `us.ys` | Szikzsák átmérője | quantity | mm | 1–20 | — | — | sorozat |

### `lab` — 73 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `lab.17ohp` | 17-OH-progeszteron | quantity | nmol/L | 0–100 | — | — | sorozat |
| `lab.alp` | Alkalikus foszfatáz | quantity | U/L | 0–1500 | — | — | sorozat |
| `lab.alt` | ALT (GPT) | quantity | U/L | 0–3000 | — | — | sorozat |
| `lab.amh` | AMH — anti-Müller-hormon | quantity | pmol/L | 0–300 | — | — | sorozat |
| `lab.antibodyScreen` | Ellenanyagszűrés | coded | — | 3 kód | — | — | sorozat |
| `lab.antithrombin` | Antitrombin aktivitás | quantity | % | 0–200 | — | — | sorozat |
| `lab.antitpo` | Anti-TPO | quantity | k[IU]/L | 0–5000 | — | — | sorozat |
| `lab.aptt` | APTI | quantity | s | 10–200 | — | — | sorozat |
| `lab.ast` | AST (GOT) | quantity | U/L | 0–5000 | — | — | sorozat |
| `lab.bileAcids` | Epesavak | quantity | umol/L | 0–500 | — | — | sorozat |
| `lab.bili.total` | Összbilirubin | quantity | umol/L | 0–600 | — | — | sorozat |
| `lab.bloodGroup.abo` | AB0 vércsoport | coded | — | 4 kód | — | — | — |
| `lab.bloodGroup.rhd` | Rh(D) vércsoport | coded | — | 2 kód | — | — | — |
| `lab.ca.total` | Összkalcium | quantity | mmol/L | 1–5 | — | — | sorozat |
| `lab.chlamydia` | Chlamydia trachomatis NAAT | coded | — | 5 kód | — | — | sorozat |
| `lab.cmv.igg` | CMV IgG | coded | — | 5 kód | — | — | sorozat |
| `lab.cmv.igm` | CMV IgM | coded | — | 5 kód | — | — | sorozat |
| `lab.cortisol.am` | Reggeli kortizol | quantity | nmol/L | 0–3000 | — | — | sorozat |
| `lab.cr` | Kreatinin | quantity | umol/L | 0–2000 | — | `lab.egfr` `rx.crcl` | sorozat |
| `lab.crp` | C-reaktív fehérje | quantity | mg/L | 0–500 | — | — | sorozat |
| `lab.dheas` | DHEAS | quantity | umol/L | 0–50 | — | — | sorozat |
| `lab.dimer` | D-dimer | quantity | mg/L{FEU} | 0–50 | — | — | sorozat |
| `lab.e2` | Ösztradiol | quantity | pmol/L | 0–50000 | — | — | sorozat |
| `lab.egfr` | Becsült GFR | quantity | mL/min/{1.73_m2} | 0–200 | `calc.egfr.ckdepi2021` ⛔ | — | — |
| `lab.ferritin` | Ferritin | quantity | ug/L | 0–2000 | — | — | sorozat |
| `lab.fibrinogen` | Fibrinogén | quantity | g/L | 0–12 | — | `score.isth.dic` | sorozat |
| `lab.fsh` | FSH | quantity | [IU]/L | 0–200 | — | — | sorozat |
| `lab.ft3` | Szabad T3 | quantity | pmol/L | 0.5–50 | — | — | sorozat |
| `lab.ft4` | Szabad T4 | quantity | pmol/L | 1–100 | — | — | sorozat |
| `lab.gbs` | B-csoportú streptococcus szűrés | coded | — | 5 kód | — | — | sorozat |
| `lab.glucose.fasting` | Éhomi vércukor | quantity | mmol/L | 1–40 | — | — | sorozat |
| `lab.gonorrhoea` | Neisseria gonorrhoeae NAAT | coded | — | 5 kód | — | — | sorozat |
| `lab.hba1c` | HbA1c | quantity | % | 2–20 | — | — | sorozat |
| `lab.hbsag` | HBsAg | coded | — | 5 kód | — | — | sorozat |
| `lab.hcg` | Szérum béta-hCG | quantity | [IU]/L | 0–500000 | — | — | sorozat |
| `lab.hcv` | Anti-HCV | coded | — | 5 kód | — | — | sorozat |
| `lab.hgb` | Hemoglobin | quantity | g/L | 20–250 | — | — | sorozat |
| `lab.hiv` | HIV szűrés | coded | — | 5 kód | — | — | sorozat |
| `lab.htc` | Hematokrit | quantity | % | 10–70 | — | — | sorozat |
| `lab.inr` | INR | quantity | 1 | 0.5–12 | — | `score.isth.dic` | sorozat |
| `lab.k` | Kálium | quantity | mmol/L | 1.5–9 | — | — | sorozat |
| `lab.lactate` | Laktát | quantity | mmol/L | 0–30 | — | — | sorozat |
| `lab.ldh` | LDH | quantity | U/L | 0–5000 | — | — | sorozat |
| `lab.lh` | LH | quantity | [IU]/L | 0–200 | — | — | sorozat |
| `lab.mcv` | MCV — átlagos vörösvérsejt-térfogat | quantity | fL | 50–130 | — | — | sorozat |
| `lab.mg` | Magnézium | quantity | mmol/L | 0.1–8 | — | — | sorozat |
| `lab.na` | Nátrium | quantity | mmol/L | 100–180 | — | — | sorozat |
| `lab.ogtt.0` | OGTT — éhomi | quantity | mmol/L | 1–40 | — | — | sorozat |
| `lab.ogtt.120` | OGTT — 120 perc | quantity | mmol/L | 1–40 | — | — | sorozat |
| `lab.ogtt.60` | OGTT — 60 perc | quantity | mmol/L | 1–40 | — | — | sorozat |
| `lab.plgf` | PlGF | quantity | ng/L | 0–10000 | — | — | sorozat |
| `lab.plt` | Thrombocytaszám | quantity | 10*9/L | 0–1500 | — | `score.isth.dic` | sorozat |
| `lab.prl` | Prolaktin | quantity | ug/L | 0–5000 | — | — | sorozat |
| `lab.procalcitonin` | Prokalcitonin | quantity | ug/L | 0–100 | — | — | sorozat |
| `lab.rbc` | Vörösvérsejtszám | quantity | 10*12/L | 1–8 | — | — | sorozat |
| `lab.rubella.igg` | Rubeola IgG | coded | — | 5 kód | — | — | sorozat |
| `lab.sflt.ratio` | sFlt-1 / PlGF arány | quantity | 1 | 0–2000 | — | — | sorozat |
| `lab.sflt1` | sFlt-1 | quantity | ng/L | 0–100000 | — | — | sorozat |
| `lab.swab.vaginal` | Hüvelyváladék-tenyésztés | coded | — | 8 kód | — | — | sorozat |
| `lab.syphilis` | Syphilis szűrés | coded | — | 5 kód | — | — | sorozat |
| `lab.testosterone.total` | Összes tesztoszteron | quantity | nmol/L | 0–60 | — | — | sorozat |
| `lab.toxo.igg` | Toxoplasma IgG | coded | — | 5 kód | — | — | sorozat |
| `lab.toxo.igm` | Toxoplasma IgM | coded | — | 5 kód | — | — | sorozat |
| `lab.trak` | TRAK (TSH-receptor elleni antitest) | quantity | [IU]/L | 0–100 | — | — | sorozat |
| `lab.tsh` | TSH | quantity | m[IU]/L | 0–200 | — | — | sorozat |
| `lab.ua` | Húgysav | quantity | umol/L | 50–1200 | — | — | sorozat |
| `lab.urea` | Karbamid | quantity | mmol/L | 0–60 | — | — | sorozat |
| `lab.urine.blood` | Vizelet vér (gyorsteszt) | coded | — | 6 kód | — | — | sorozat |
| `lab.urine.leukocyte` | Vizelet fehérvérsejt-észteráz | coded | — | 6 kód | — | — | sorozat |
| `lab.urine.nitrite` | Vizelet nitrit | coded | — | 2 kód | — | — | sorozat |
| `lab.urine.protein` | Vizelet fehérje (gyorsteszt) | coded | — | 6 kód | — | — | sorozat |
| `lab.wbc` | Fehérvérsejtszám | quantity | 10*9/L | 0–100 | — | `score.cmqcc.ob.sepsis` | sorozat |
| `lab.wbc.diff.neut` | Neutrofil granulocyta arány | quantity | % | 0–100 | — | — | sorozat |

### `labour` — 31 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `labour.amniotic` | Magzatvíz | coded | — | — | tükör: `status.obs.amnioticFluid` | — | sorozat |
| `labour.bleedingStartedAt` | A vérzés kezdete | datetime | — | — | — | — | sorozat |
| `labour.caput` | Caput succedaneum | quantity | 1 | 0–3 | tükör: `status.obs.caput` | — | sorozat |
| `labour.cervix` | Méhszáj-tágulat | quantity | cm | 0–10 | tükör: `exam.cervix.dilation` | — | sorozat |
| `labour.companion` | Kísérő jelen van | bool | — | — | — | — | sorozat |
| `labour.contractionDuration` | Kontrakció időtartama | quantity | s | 0–240 | tükör: `status.obs.contractions.duration` | — | sorozat |
| `labour.contractions` | Kontrakciók száma | quantity | /(10.min) | 0–10 | tükör: `status.obs.contractions.freq` | — | sorozat |
| `labour.deliveryMode` | Szülés módja | coded | — | 7 kód | — | — | sorozat |
| `labour.descent` | Fejbeszállás (ötödökben) | quantity | 1 | 0–5 | tükör: `status.obs.engagement` | — | sorozat |
| `labour.fhr.accel` | Akcelerációk | bool | — | — | — | — | sorozat |
| `labour.fhr.baseline` | Magzati alapszívfrekvencia | quantity | /min | 50–240 | tükör: `status.obs.fhr` | — | sorozat |
| `labour.fhr.decel` | Decelerációk | coded | — | 7 kód | — | — | sorozat |
| `labour.fhr.method` | Monitorozás módja | coded | — | 4 kód | — | — | sorozat |
| `labour.fhr.variability` | Variabilitás | coded | — | 5 kód | — | — | sorozat |
| `labour.hour` | Eltelt óra | quantity | h | 0–100 | `calc.labour.hours` | — | sorozat |
| `labour.mgso4.startedAt` | Magnézium-szulfát kezdete | datetime | — | — | — | — | sorozat |
| `labour.moulding` | Koponyacsont-egymásra csúszás | quantity | 1 | 0–3 | tükör: `status.obs.moulding` | — | sorozat |
| `labour.oxytocin` | Oxitocin-infúzió fut | bool | — | — | — | — | sorozat |
| `labour.perinealTrauma` | Gátsérülés | coded | — | 9 kód | — | — | sorozat |
| `labour.posture` | Testhelyzet | coded | — | 6 kód | — | — | sorozat |
| `labour.qbl` | Mennyiségi vérvesztés (kumulatív) | quantity | mL | 0–10000 | — | `labour.qbl.total` | sorozat |
| `labour.qbl.total` | Teljes mennyiségi vérvesztés (szülés + műtét) | quantity | mL | 0–15000 | `calc.qbl.total` ⛔ | `score.cmqcc.stage` | — |
| `labour.stage` | Vajúdási szak | coded | — | 5 kód | — | — | sorozat |
| `labour.startedAt` | Vajúdás kezdete | datetime | — | — | — | `labour.hour` | — |
| `labour.txa.givenAt` | Tranexámsav beadása | datetime | — | — | — | — | sorozat |
| `labour.urine` | Vizeletmennyiség | quantity | mL | 0–3000 | — | — | sorozat |
| `score.cmqcc.ob.sepsis` | CMQCC szülészeti szepszis — élettani szűrő | quantity | {trigger} | 0–4 | `calc.cmqcc.ob.sepsis.screen` ⛔ | — | — |
| `score.cmqcc.stage` | CMQCC vérzési stádium | quantity | {stádium} | 0–3 | `calc.cmqcc.stage` ⛔ | — | — |
| `score.isth.dic` | ISTH terhességi DIC-pontszám | quantity | {pont} | 0–60 | `calc.isth.dic.pregnancy` ⛔ | — | — |
| `score.meows` | MEOWS-pontszám | quantity | {trigger} | 0–6 | `calc.meows` | — | — |
| `score.omqsofa` | omqSOFA-pontszám | quantity | {pont} | 0–4 | `calc.omqsofa` | — | — |

### `nb` — 14 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `nb.apgar.at1` | Apgar 1 percnél | quantity | {pont} | 0–10 | — | — | — |
| `nb.apgar.at10` | Apgar 10 percnél | quantity | {pont} | 0–10 | — | — | — |
| `nb.apgar.at5` | Apgar 5 percnél | quantity | {pont} | 0–10 | — | — | — |
| `nb.birth.at` | A születés időpontja | datetime | — | — | — | — | — |
| `nb.birthInjury` | Születési sérülés | coded-multi | — | 9 kód | — | — | — |
| `nb.birthWeight` | Születési súly | quantity | g | 200–7000 | — | `neo.dextroseGel.dose` `neo.nrp.epi.dose` `neo.nrp.volume.dose` | — |
| `nb.birthWeight.percentile` | Születési súly percentilis | quantity | % | 0–100 | — | — | — |
| `nb.cordBe` | Köldökzsinór-artéria bázisfelesleg | quantity | mmol/L | -30–10 | — | — | — |
| `nb.cordPh` | Köldökzsinór-artéria pH | quantity | 1 | 6.5–7.8 | — | — | — |
| `nb.ga.atBirth` | Gesztációs kor a születéskor | quantity | wk | 20–45 | — | — | — |
| `nb.nicuAdmit` | Újszülött intenzív ellátás | tristate | — | 3 kód | — | — | — |
| `nb.nlos` | Újszülött ápolási ideje | quantity | d | 0–365 | — | — | — |
| `nb.oxygenDep` | Oxigénfüggőség | tristate | — | 3 kód | — | — | — |
| `nb.preterm.type` | Koraszülés típusa | coded | — | 3 kód | — | — | — |

### `neo` — 16 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `neo.dextroseGel.dose` | 40% dextróz gél adag | quantity | mL | 0–10 | `calc.neo.dextroseGel` | — | — |
| `neo.glucose` | Újszülött vércukor | quantity | mmol/L | 0–30 | — | — | sorozat |
| `neo.latch.audible` | LATCH — hallható nyelés | coded | — | 3 kód | — | `neo.latch.total` | sorozat |
| `neo.latch.comfort` | LATCH — kényelem | coded | — | 3 kód | — | `neo.latch.total` | sorozat |
| `neo.latch.hold` | LATCH — segítségigény a tartáshoz | coded | — | 3 kód | — | `neo.latch.total` | sorozat |
| `neo.latch.latch` | LATCH — mellrefogás | coded | — | 3 kód | — | `neo.latch.total` | sorozat |
| `neo.latch.nipple` | LATCH — mellbimbó típusa | coded | — | 3 kód | — | `neo.latch.total` | sorozat |
| `neo.latch.total` | LATCH összpontszám | quantity | {pont} | 0–10 | `calc.latch.total` | — | — |
| `neo.nows.esc.consoling` | ESC — megnyugtatható 10 percen belül | tristate | — | 3 kód | — | — | sorozat |
| `neo.nows.esc.feeding` | ESC — eszik legalább 30 mL-t etetésenként | tristate | — | 3 kód | — | — | sorozat |
| `neo.nows.esc.sleeping` | ESC — alszik legalább 1 órát zavarás nélkül | tristate | — | 3 kód | — | — | sorozat |
| `neo.nows.finnegan` | Finnegan-pontszám | quantity | {pont} | 0–45 | — | — | sorozat |
| `neo.nows.pharmacotherapy` | Farmakoterápia indult | tristate | — | 3 kód | — | — | — |
| `neo.nows.substance` | Az anyai opioid-expozíció típusa | coded | — | 5 kód | — | — | — |
| `neo.nrp.epi.dose` | NRP — epinephrin adag (IV/IO) | quantity | mg | 0–0.2 | `calc.nrp.epi.iv` | — | — |
| `neo.nrp.volume.dose` | NRP — volumenbolus | quantity | mL | 0–100 | `calc.nrp.volume` | — | — |

### `onc` — 21 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `onc.fertility.discussed` | Fertilitásmegőrzés megbeszélve | coded | — | 4 kód | — | — | `audit` |
| `onc.fertility.method` | Fertilitásmegőrzés módja | coded | — | 6 kód | — | — | sorozat |
| `onc.gyn.figo.cervix` | FIGO-stádium — méhnyak | coded | — | 14 kód | — | — | sorozat |
| `onc.gyn.figo.endometrium` | FIGO-stádium — méhtest | coded | — | 15 kód | — | — | sorozat |
| `onc.gyn.germline` | Csíravonalas mutáció | coded | — | 7 kód | — | — | sorozat |
| `onc.gyn.grade` | Differenciáltság | coded | — | 4 kód | — | — | sorozat |
| `onc.gyn.histology` | Szövettani típus | coded | — | 11 kód | — | — | sorozat |
| `onc.gyn.molecular` | Molekuláris besorolás | coded | — | 5 kód | — | — | sorozat |
| `onc.gyn.site` | Daganat lokalizációja | coded | — | 10 kód | — | — | sorozat |
| `onc.mdt.date` | Onkoteam időpontja | date | — | — | — | — | sorozat |
| `onc.mdt.presented` | Onkoteam elé került | bool | — | — | — | — | `audit` |
| `onc.preg.decision.options` | Az onkológiai döntésnél megbeszélt lehetőségek | text | — | — | — | — | `audit` |
| `onc.preg.decision.outcome` | A közös döntés | coded | — | 5 kód | — | — | `audit` sorozat |
| `onc.preg.gaAtDiagnosis` | Gesztációs kor a diagnóziskor | quantity | wk | 0–45 | — | — | sorozat |
| `onc.preg.placentaExamined` | Méhlepény szövettani vizsgálata | bool | — | — | — | — | — |
| `onc.preg.sharedDecision` | Megosztott döntéshozatal dokumentálva | bool | — | — | — | — | `audit` |
| `onc.response.recist` | Válaszértékelés (RECIST 1.1) | coded | — | 5 kód | — | — | sorozat |
| `onc.tx.cycle` | Ciklusszám | quantity | 1 | 0–60 | — | — | sorozat |
| `onc.tx.modality` | Kezelési modalitás | coded | — | 8 kód | — | — | sorozat |
| `onc.tx.protocol` | Protokoll | text | — | — | — | — | sorozat |
| `onc.tx.toxicity.grade` | Toxicitás foka (CTCAE) | coded | — | 6 kód | — | — | sorozat |

### `op` — 51 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `op.cs.adhesions` | Összenövések | coded | — | 4 kód | — | — | sorozat |
| `op.cs.placenta` | A lepény eltávolítása | coded | — | 4 kód | — | — | sorozat |
| `op.cs.prevScar` | A korábbi heg állapota | coded | — | 5 kód | — | — | sorozat |
| `op.cs.uterotomy` | Uterotomia típusa | coded | — | 5 kód | — | — | sorozat |
| `op.intra.anesthesia` | Érzéstelenítés típusa | coded | — | 6 kód | — | — | sorozat |
| `op.intra.approach` | Behatolás | coded | — | 7 kód | — | — | sorozat |
| `op.intra.closure` | Zárás | text | — | — | — | — | sorozat |
| `op.intra.closureAt` | A zárás befejezése | datetime | — | — | — | — | sorozat |
| `op.intra.complication` | Intraoperatív szövődmény | coded | — | 8 kód | — | — | sorozat |
| `op.intra.deliveryAt` | A magzat kiemelésének időpontja | datetime | — | — | — | — | sorozat |
| `op.intra.drain` | Drén | coded | — | 4 kód | — | — | sorozat |
| `op.intra.findings` | Műtéti lelet | text | — | — | — | — | sorozat |
| `op.intra.incisionAt` | Bemetszés időpontja | datetime | — | — | — | — | sorozat |
| `op.intra.qbl` | Műtéti vérvesztés (mért) | quantity | mL | 0–10000 | — | `labour.qbl.total` | sorozat |
| `op.intra.steps` | Az elvégzett lépések | text | — | — | — | — | sorozat |
| `op.post.complication` | Posztoperatív szövődmény | coded | — | 7 kód | — | — | sorozat |
| `op.post.mobilization` | Mobilizáció | coded | — | 4 kód | — | — | sorozat |
| `op.post.vte.prophylaxis` | VTE-profilaxis | coded | — | 5 kód | — | — | sorozat |
| `op.post.vte.startedAt` | A VTE-profilaxis kezdete | datetime | — | — | — | — | sorozat |
| `op.post.wound` | Sebállapot | coded | — | 5 kód | — | — | sorozat |
| `op.pre.antibiotic.timing` | Antibiotikus profilaxis időzítése | coded | — | 5 kód | — | — | — |
| `op.pre.anticoag.lastDose` | Utolsó antikoaguláns adag | datetime | — | — | — | — | — |
| `op.pre.asa` | ASA fizikai státusz | coded | — | 6 kód | — | — | — |
| `op.pre.bloodUnitsReady` | Előkészített vérkészítmény | quantity | 1 | 0–20 | — | — | — |
| `op.pre.consent` | Tájékozott beleegyezés megtörtént | bool | — | — | — | — | `audit` |
| `op.pre.consent.discussedRisks` | Megbeszélt kockázatok | text | — | — | — | — | — |
| `op.pre.fastingSince` | Utolsó étkezés időpontja | datetime | — | — | — | — | — |
| `op.pre.urgency` | Sürgősség | coded | — | 4 kód | — | — | — |
| `op.procedure` | Elvégzett beavatkozás | coded | — | 25 kód | — | — | sorozat |
| `op.who.signIn.airway` | WHO — Nehéz légút vagy aspirációs kockázat felmérve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signIn.allergy` | WHO — Ismert allergia egyeztetve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signIn.anesthesia` | WHO — Az aneszteziológiai gép és gyógyszerek ellenőrizve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signIn.bloodLoss` | WHO — Várható vérvesztés és vérkészítmény-igény egyeztetve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signIn.completedAt` | WHO Bejelentkezés (érzéstelenítés előtt) — időbélyeg | datetime | — | — | — | — | `audit` sorozat |
| `op.who.signIn.identity` | WHO — A beteg azonossága, a beavatkozás és a beleegyezés megerősítve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signIn.pulseOx` | WHO — Pulzoximéter a betegen és működik | bool | — | — | — | — | `audit` sorozat |
| `op.who.signIn.site` | WHO — A műtéti terület megjelölve, ha releváns | bool | — | — | — | — | `audit` sorozat |
| `op.who.signOut.completedAt` | WHO Kijelentkezés (a beteg elhagyása előtt) — időbélyeg | datetime | — | — | — | — | `audit` sorozat |
| `op.who.signOut.counts` | WHO — Eszköz-, tű- és törlőszám egyezik | bool | — | — | — | — | `audit` sorozat |
| `op.who.signOut.equipmentIssues` | WHO — Eszközhiba vagy probléma jelezve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signOut.procedureName` | WHO — A ténylegesen elvégzett beavatkozás rögzítve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signOut.recoveryPlan` | WHO — A felépülés és az ellátás fő szempontjai egyeztetve | bool | — | — | — | — | `audit` sorozat |
| `op.who.signOut.specimen` | WHO — A minta megjelölve, a beteg nevével | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.anesthesiaConcerns` | WHO — Az aneszteziológus elmondta a beteg-specifikus aggályokat | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.completedAt` | WHO Időkérés (bemetszés előtt) — időbélyeg | datetime | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.confirmPatient` | WHO — A beteg, a beavatkozás és a terület hangosan megerősítve | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.criticalSteps` | WHO — A sebész elmondta a kritikus lépéseket és a várható időt | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.imaging` | WHO — A szükséges képalkotó felvételek megjelenítve | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.introductions` | WHO — A csapat tagjai bemutatkoztak, név és szerep | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.nursingConcerns` | WHO — A műtősnő megerősítette a sterilitást és az eszközöket | bool | — | — | — | — | `audit` sorozat |
| `op.who.timeOut.prophylaxis` | WHO — Az antibiotikus profilaxis 60 percen belül megtörtént | bool | — | — | — | — | `audit` sorozat |

### `out` — 14 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `out.birth.outcome` | A szülés kimenetele | coded | — | 2 kód | — | — | — |
| `out.conAnomaly` | Veleszületett rendellenesség | tristate | — | 3 kód | — | — | — |
| `out.facilityType` | Az ellátó intézmény típusa | coded | — | 5 kód | — | — | — |
| `out.icuAdmit` | Anyai intenzív ellátás | tristate | — | 3 kód | — | — | — |
| `out.maternal.alive` | Az anya él a 42. napon | tristate | — | 3 kód | — | — | — |
| `out.maternal.death` | Anyai halál | date | — | — | — | — | — |
| `out.mlos` | Anyai ápolási idő | quantity | d | 0–365 | — | — | — |
| `out.neo.death` | Újszülöttkori halál | date | — | — | — | — | — |
| `out.neonate.alive` | Az újszülött él a 42. napon | tristate | — | 3 kód | — | — | — |
| `out.readmit` | Késői anyai szövődmény vagy újrafelvétel | tristate | — | 3 kód | — | — | — |
| `out.readmit.reason` | Az újrafelvétel oka | text | — | — | — | — | — |
| `out.stillbirth` | Halvaszületés | date | — | — | — | — | — |
| `out.transfusion` | Transzfúzió | tristate | — | 3 kód | — | — | — |
| `out.transfusion.units` | Transzfundált egységek száma | quantity | 1 | 0–60 | — | — | — |

### `pedgyn` — 26 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `pedgyn.bleeding.prepubertal` | Genitális vérzés pubertás előtt | coded | — | 3 kód | — | — | — |
| `pedgyn.chaperone` | Kísérő jelen volt a vizsgálatnál | coded | — | 5 kód | — | — | — |
| `pedgyn.confidentiality.discussed` | Titoktartás megbeszélve a serdülővel | tristate | — | 3 kód | — | — | — |
| `pedgyn.consent.who` | Ki adta a beleegyezést | coded | — | 5 kód | — | — | — |
| `pedgyn.contraception.discussed` | Fogamzásgátlás megbeszélve | tristate | — | 3 kód | — | — | — |
| `pedgyn.discharge` | Hüvelyváladék | coded | — | 6 kód | — | — | — |
| `pedgyn.dsd.suspected` | Nemi fejlődés eltérésének (DSD) gyanúja | tristate | — | 3 kód | — | — | — |
| `pedgyn.dysmenorrhea.severity` | Dysmenorrhoea súlyossága | coded | — | 5 kód | — | — | — |
| `pedgyn.exam.approach` | A genitális vizsgálat módja | coded | — | 6 kód | — | — | — |
| `pedgyn.foreignBody` | Hüvelyi idegentest | coded | — | 4 kód | — | — | — |
| `pedgyn.hpv.vaccine` | HPV-oltás | coded | — | 5 kód | — | — | — |
| `pedgyn.minor.ownView` | A kiskorú saját véleménye rögzítve | tristate | — | 3 kód | — | — | — |
| `pedgyn.mullerian.anomaly` | Müller-cső fejlődési rendellenesség | coded | — | 7 kód | — | — | — |
| `pedgyn.partner.age` | A partner életkora (év) | number | év | 0–99 | — | — | — |
| `pedgyn.presentations.12m` | Genitális panasz miatti megjelenések száma (12 hónap) | number | alkalom | 0–50 | — | — | — |
| `pedgyn.pubarche.age` | Pubarche (szeméremszőrzet megjelenése) életkora | quantity | a | 4–18 | — | — | — |
| `pedgyn.puberty.timing` | Pubertás időzítése | coded | — | 4 kód | — | — | — |
| `pedgyn.report.made` | Gyermekvédelmi jelzés megtörtént | tristate | — | 3 kód | — | — | — |
| `pedgyn.safeguarding.asked` | Bántalmazás lehetősége mérlegelve | coded | — | 2 kód | — | — | — |
| `pedgyn.safeguarding.concern` | Bántalmazás gyanúja | coded | — | 3 kód | — | — | — |
| `pedgyn.sti.confirmed` | Igazolt nemi úton terjedő fertőzés | coded | — | 9 kód | — | — | — |
| `pedgyn.tanner.pubic` | Szeméremszőrzet Tanner-stádium | coded | — | 5 kód | — | — | — |
| `pedgyn.thelarche.age` | Thelarche (mellfejlődés kezdete) életkora | quantity | a | 4–18 | — | — | — |
| `pedgyn.trauma.consistent` | A lelet és az elmondott mechanizmus összeillik | coded | — | 4 kód | — | — | — |
| `pedgyn.trauma.mechanism` | A sérülés elmondott mechanizmusa | text | — | — | — | — | — |
| `pedgyn.vulva.finding` | Vulva lelet | coded | — | 7 kód | — | — | — |

### `plan` — 23 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `plan.bf.intention` | Szoptatási szándék | coded | — | 4 kód | — | — | — |
| `plan.bf.previousExperience` | Korábbi szoptatási tapasztalat | coded | — | 4 kód | — | — | — |
| `plan.birth.companion` | Kísérő a szülésnél | coded | — | 4 kód | — | — | — |
| `plan.birth.cordClamping` | Köldökzsinór-ellátás terve | coded | — | 3 kód | — | — | — |
| `plan.birth.painRelief` | Tervezett fájdalomcsillapítás | coded-multi | — | 6 kód | — | — | — |
| `plan.birth.position` | Kívánt szülési testhelyzet | coded-multi | — | 5 kód | — | — | — |
| `plan.birth.skinToSkin` | Bőr-bőr kontaktus kérése | bool | — | — | — | — | — |
| `plan.consult.declined` | Elutasított konzílium-javallat indoklása | text | — | — | — | — | — |
| `plan.consult.requested` | Kért konzíliumok | coded-multi | — | 10 kód | — | — | sorozat |
| `plan.contraception.method` | Tervezett szülés utáni fogamzásgátlás | coded | — | 10 kód | — | — | sorozat |
| `plan.contraception.timing` | A fogamzásgátlás tervezett indítása | coded | — | 4 kód | — | — | — |
| `plan.delivery.intendedMode` | Tervezett szülésmód | coded | — | 5 kód | — | — | sorozat |
| `plan.delivery.optionsDiscussed` | A szülés módjánál megbeszélt lehetőségek | text | — | — | — | — | — |
| `plan.delivery.patientPreference` | A beteg preferenciája a szülésmódról | coded | — | 4 kód | — | — | sorozat |
| `plan.delivery.rationale` | A szülésmód-döntés indoklása | text | — | — | — | — | — |
| `plan.delivery.sharedDecision` | Megosztott döntéshozatal megtörtént | bool | — | — | — | — | — |
| `plan.emergency.given` | Sürgősségi terv átadva | bool | — | — | — | — | — |
| `plan.emergency.language` | A sürgősségi terv nyelve | coded | — | 4 kód | — | — | — |
| `plan.institution.tolacCapable` | Az intézmény TOLAC-feltételei adottak | tristate | — | 3 kód | — | — | — |
| `plan.nextVisit.at` | Következő vizit időpontja | date | — | — | — | — | sorozat |
| `plan.nextVisit.rationale` | Eltérés a vizitrendtől — indoklás | text | — | — | — | — | — |
| `plan.protocolVersion` | A gondozási protokoll verziója | text | — | — | — | — | — |
| `plan.reviewedAt` | A terv felülvizsgálatának ideje | datetime | — | — | — | — | sorozat |

### `prom` — 58 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `prom.bses.q1` | BSES-SF — 1. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q10` | BSES-SF — 10. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q11` | BSES-SF — 11. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q12` | BSES-SF — 12. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q13` | BSES-SF — 13. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q14` | BSES-SF — 14. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q2` | BSES-SF — 2. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q3` | BSES-SF — 3. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q4` | BSES-SF — 4. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q5` | BSES-SF — 5. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q6` | BSES-SF — 6. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q7` | BSES-SF — 7. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q8` | BSES-SF — 8. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.q9` | BSES-SF — 9. tétel | coded | — | 5 kód | — | `prom.bses.total` | sorozat |
| `prom.bses.total` | BSES-SF összpontszám | quantity | {pont} | 14–70 | `calc.bses.total` | — | sorozat |
| `prom.bssr.q1` | BSS-R — 1. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q10` | BSS-R — 10. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q2` | BSS-R — 2. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q3` | BSS-R — 3. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q4` | BSS-R — 4. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q5` | BSS-R — 5. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q6` | BSS-R — 6. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q7` | BSS-R — 7. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q8` | BSS-R — 8. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.q9` | BSS-R — 9. tétel | coded | — | 5 kód | — | `prom.bssr.total` | sorozat |
| `prom.bssr.total` | BSS-R összpontszám | quantity | {pont} | 0–40 | `calc.bssr.total` | — | sorozat |
| `prom.clinicianNote` | Klinikusi megjegyzés a kérdőívhez | text | — | — | — | — | sorozat |
| `prom.eq5d.activities` | EQ-5D-5L — Szokásos tevékenységek | coded | — | 5 kód | — | `prom.eq5d.profile` | sorozat |
| `prom.eq5d.anxiety` | EQ-5D-5L — Szorongás / lehangoltság | coded | — | 5 kód | — | `prom.eq5d.profile` | sorozat |
| `prom.eq5d.mobility` | EQ-5D-5L — Mozgékonyság | coded | — | 5 kód | — | `prom.eq5d.profile` | sorozat |
| `prom.eq5d.pain` | EQ-5D-5L — Fájdalom / rossz közérzet | coded | — | 5 kód | — | `prom.eq5d.profile` | sorozat |
| `prom.eq5d.profile` | EQ-5D-5L profil | quantity | — | 11111–55555 | `calc.eq5d.profile` | — | sorozat |
| `prom.eq5d.selfCare` | EQ-5D-5L — Önellátás | coded | — | 5 kód | — | `prom.eq5d.profile` | sorozat |
| `prom.eq5d.vas` | EQ-5D-5L — egészségi állapot ma (VAS) | quantity | 1 | 0–100 | — | — | sorozat |
| `prom.instruments` | Felvett mérőeszközök | coded-multi | — | 10 kód | — | — | sorozat |
| `prom.mh.epds.total` | EPDS összpontszám (ICHOM) | quantity | {pont} | — | tükör: `psy.epds.total` | — | — |
| `prom.mh.mibs.total` | MIBS összpontszám (ICHOM) | quantity | {pont} | — | tükör: `psy.mibs.total` | — | — |
| `prom.mh.whooley.total` | Whooley összpontszám (ICHOM) | quantity | {pont} | — | tükör: `psy.whooley.total` | — | — |
| `prom.resp.info` | Megkapta a szükséges tájékoztatást | coded | — | 5 kód | — | — | sorozat |
| `prom.resp.respect` | Tisztelettel bántak vele | coded | — | 5 kód | — | — | sorozat |
| `prom.resp.role` | Olyan szerepe volt az ellátásban, amilyet szeretett volna | coded | — | 5 kód | — | — | sorozat |
| `prom.resp.trust` | Bízott az ellátóiban | coded | — | 5 kód | — | — | sorozat |
| `prom.sat.overall` | Elégedettség az ellátással | coded | — | 5 kód | — | — | sorozat |
| `prom.sat.painDecision` | Megosztott döntés a fájdalomcsillapításról | coded | — | 5 kód | — | — | sorozat |
| `prom.sat.painRelief` | Elégedettség a fájdalomcsillapítással | coded | — | 5 kód | — | — | sorozat |
| `prom.whodas.q1` | WHODAS 2.0-12 — 1. tétel: Koncentráció 10 percen át | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q10` | WHODAS 2.0-12 — 10. tétel: Napi teendők időigénye | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q11` | WHODAS 2.0-12 — 11. tétel: Kimaradt napok | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q12` | WHODAS 2.0-12 — 12. tétel: Csökkent teljesítményű napok | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q2` | WHODAS 2.0-12 — 2. tétel: Hosszabb távolság gyaloglása (1 km) | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q3` | WHODAS 2.0-12 — 3. tétel: Teljes test megmosása | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q4` | WHODAS 2.0-12 — 4. tétel: Öltözködés | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q5` | WHODAS 2.0-12 — 5. tétel: Idegenekkel való kapcsolat | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q6` | WHODAS 2.0-12 — 6. tétel: Barátságok fenntartása | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q7` | WHODAS 2.0-12 — 7. tétel: Napi otthoni teendők | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q8` | WHODAS 2.0-12 — 8. tétel: Munka vagy tanulás | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.q9` | WHODAS 2.0-12 — 9. tétel: Érzelmi érintettség az egészségi állapot miatt | coded | — | 5 kód | — | `prom.whodas.total` | sorozat |
| `prom.whodas.total` | WHODAS 2.0-12 összpontszám | quantity | {pont} | 0–48 | `calc.whodas.total` | — | sorozat |

### `psy` — 44 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `psy.epds.q1` | EPDS Q1 — Nevetés, humor érzékelése | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q10` | EPDS Q10 — Önkárosítás gondolata | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q2` | EPDS Q2 — Örömteli várakozás | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q3` | EPDS Q3 — Önvád szükségtelenül | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q4` | EPDS Q4 — Szorongás, aggodalom ok nélkül | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q5` | EPDS Q5 — Félelem, pánik ok nélkül | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q6` | EPDS Q6 — Túlterheltség érzése | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q7` | EPDS Q7 — Alvászavar szomorúság miatt | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q8` | EPDS Q8 — Szomorúság, nyomott hangulat | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.q9` | EPDS Q9 — Sírás | coded | — | 4 kód | — | `psy.epds.total` | sorozat |
| `psy.epds.total` | EPDS összpontszám | quantity | {pont} | 0–30 | `calc.epds.total` | `prom.mh.epds.total` | — |
| `psy.mibs.affection` | MIBS — Gyengédség | coded | — | 4 kód | — | `psy.mibs.total` | sorozat |
| `psy.mibs.joy` | MIBS — Öröm a babával | coded | — | 4 kód | — | `psy.mibs.total` | sorozat |
| `psy.mibs.neutrality` | MIBS — Közömbösség | coded | — | 4 kód | — | `psy.mibs.total` | sorozat |
| `psy.mibs.protective` | MIBS — Óvó érzés | coded | — | 4 kód | — | `psy.mibs.total` | sorozat |
| `psy.mibs.resentment` | MIBS — Ellenérzés | coded | — | 4 kód | — | `psy.mibs.total` | sorozat |
| `psy.mibs.total` | MIBS összpontszám | quantity | {pont} | 0–15 | `calc.mibs.total` | `prom.mh.mibs.total` | — |
| `psy.mspss.family` | MSPSS — Család | coded | — | 7 kód | — | `psy.mspss.total` | sorozat |
| `psy.mspss.friends` | MSPSS — Barátok | coded | — | 7 kód | — | `psy.mspss.total` | sorozat |
| `psy.mspss.significantOther` | MSPSS — Partner, közeli személy | coded | — | 7 kód | — | `psy.mspss.total` | sorozat |
| `psy.mspss.total` | MSPSS összpontszám | quantity | {pont} | 3–21 | `calc.mspss.total` | — | — |
| `psy.phq9.q1` | PHQ-9 Q1 — Örömtelenség | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q2` | PHQ-9 Q2 — Nyomott hangulat | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q3` | PHQ-9 Q3 — Alvászavar | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q4` | PHQ-9 Q4 — Fáradtság | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q5` | PHQ-9 Q5 — Étvágyváltozás | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q6` | PHQ-9 Q6 — Önértékelési zavar | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q7` | PHQ-9 Q7 — Koncentrációs nehézség | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q8` | PHQ-9 Q8 — Pszichomotoros változás | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.q9` | PHQ-9 Q9 — Önkárosítás gondolata | coded | — | 4 kód | — | `psy.phq9.total` | sorozat |
| `psy.phq9.total` | PHQ-9 összpontszám | quantity | {pont} | 0–27 | `calc.phq9.total` | — | — |
| `psy.ppp.admissionConsidered` | Hospitalizáció mérlegelve | bool | — | — | — | — | `audit` |
| `psy.ppp.plan` | Perinatális mentális ellátási terv | text | — | — | — | — | — |
| `psy.ppp.risk` | Postpartum pszichózis kockázata | coded | — | 4 kód | — | — | sorozat |
| `psy.social.finances` | Anyagi helyzet | coded | — | 4 kód | — | — | — |
| `psy.social.housing` | Lakhatás | coded | — | 4 kód | — | — | — |
| `psy.social.partnership` | Párkapcsolati helyzet | coded | — | 5 kód | — | — | — |
| `psy.social.support.contact` | Kire számíthat | text | — | — | — | — | — |
| `psy.social.workStress` | Munkahelyi terhelés | coded | — | 5 kód | — | — | — |
| `psy.violence.screened` | Bántalmazás szűrése megtörtént | bool | — | — | — | — | `audit` |
| `psy.whooley.helpQuestion` | Segítségkérési kérdés | bool | — | — | — | — | — |
| `psy.whooley.q1` | Whooley Q1 — Nyomott hangulat az elmúlt hónapban | coded | — | 2 kód | — | `psy.whooley.total` | sorozat |
| `psy.whooley.q2` | Whooley Q2 — Örömtelenség az elmúlt hónapban | coded | — | 2 kód | — | `psy.whooley.total` | sorozat |
| `psy.whooley.total` | Whooley összpontszám | quantity | {pont} | 0–2 | `calc.whooley.total` | `prom.mh.whooley.total` | — |

### `rules` — 1 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `rule.carboprost.blocked` | Carboprost tiltva | bool | — | — | előtöltés: implies | — | — |

### `rx` — 16 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `rx.active` | Rendelt készítmények | coded-multi | — | 23 kód | — | — | — |
| `rx.allergy.other` | Egyéb ismert gyógyszerallergia | text | — | — | — | — | — |
| `rx.allergy.penicillin` | Penicillin-allergia | tristate | — | 3 kód | — | — | — |
| `rx.allergy.reaction` | Az allergiás reakció jellege | coded | — | 5 kód | — | — | — |
| `rx.crcl` | Kreatinin-clearance | quantity | mL/min | 0–300 | `calc.crcl` ⛔ | — | — |
| `rx.dose.amount` | Adag | quantity | — | 0–100000 | — | — | — |
| `rx.dose.unit` | Adagolási egység | coded | — | 9 kód | — | — | — |
| `rx.frequency` | Adagolás gyakorisága | coded | — | 11 kód | — | — | — |
| `rx.indication` | A gyógyszerelés indikációja | coded | — | 15 kód | — | — | — |
| `rx.lmwh.dailyDose` | Javasolt profilaktikus enoxaparin-adag | quantity | mg | 0–300 | `calc.lmwh.prophylaxis` | — | — |
| `rx.override.gate` | Megkerült kapu | text | — | — | — | — | `audit` |
| `rx.override.reason` | A megkerülés indoklása | text | — | — | — | — | `audit` |
| `rx.route` | Beadási mód | coded | — | 10 kód | — | — | — |
| `rx.start` | Kezdés | date | — | — | — | — | — |
| `rx.status` | Rendelés állapota | coded | — | 6 kód | — | — | — |
| `rx.stop` | Befejezés | date | — | — | — | — | — |

### `score` — 2 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `score.bishop.dilation` | Tágulat (Bishop-kártya) | quantity | cm | — | tükör: `exam.cervix.dilation` | — | — |
| `score.bishop.total` | Bishop-összpontszám | quantity | — | 0–13 | `calc.bishop` | — | — |

### `status` — 105 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `status.cardio.auscultation` | Szívhallgatózás | coded | — | 4 kód | — | — | — |
| `status.cardio.character` | A szívzörej jellege | coded | — | 4 kód | — | — | — |
| `status.cardio.congestion` | Pangásjelek | coded | — | 4 kód | — | — | — |
| `status.cardio.congestion.sign` | Pangásjel | coded | — | 5 kód | — | — | — |
| `status.cardio.murmur.grade` | Zörej mértéke | coded | — | 6 kód | — | — | — |
| `status.cardio.murmur.timing` | Zörej típusa | coded | — | 3 kód | — | — | — |
| `status.cardio.nyha` | NYHA-osztály | coded | — | 4 kód | — | — | — |
| `status.cardio.peripheralPulse` | Perifériás pulzusok | coded | — | 4 kód | — | — | — |
| `status.cardio.peripheralPulse.site` | Hol | coded | — | 5 kód | — | — | — |
| `status.cardio.pulseQuality` | Pulzuskvalitás | coded | — | 5 kód | — | — | — |
| `status.cardio.site` | A szívhang/zörej lokalizációja | coded | — | 5 kód | — | — | — |
| `status.endo.acanthosis` | Acanthosis nigricans | coded | — | 4 kód | — | — | — |
| `status.endo.acanthosis.severity` | Kiterjedtség | coded | — | 3 kód | — | — | — |
| `status.endo.acanthosis.site` | Az acanthosis lokalizációja | coded | — | 5 kód | — | — | — |
| `status.endo.eyeSigns` | Szemtünetek | coded | — | 4 kód | — | — | — |
| `status.endo.eyeSigns.sign` | Szemtünet | coded | — | 6 kód | — | — | — |
| `status.endo.fatDistribution` | Zsíreloszlás | coded | — | 5 kód | — | — | — |
| `status.endo.hip` | Csípőkörfogat | quantity | cm | 50–220 | — | `status.endo.whr` | — |
| `status.endo.striae` | Striák | coded | — | 4 kód | — | — | — |
| `status.endo.striae.color` | Striák színe | coded | — | 3 kód | — | — | — |
| `status.endo.striae.site` | Striák elhelyezkedése | coded | — | 6 kód | — | — | — |
| `status.endo.thyroid` | Pajzsmirigy tapintás | coded | — | 4 kód | — | — | — |
| `status.endo.thyroid.consistency` | A pajzsmirigy konzisztenciája | coded | — | 4 kód | — | — | — |
| `status.endo.thyroid.nodule` | Göb | coded | — | 4 kód | — | — | — |
| `status.endo.thyroid.size` | Nagyság (WHO golyva-fokozat) | coded | — | 3 kód | — | — | — |
| `status.endo.thyroid.tenderness` | Nyomásérzékenység | bool | — | — | — | — | — |
| `status.endo.virilization` | Virilizáció jelei | coded | — | 4 kód | — | — | — |
| `status.endo.virilization.sign` | Virilizációs jel | coded | — | 5 kód | — | — | — |
| `status.endo.waist` | Derékkörfogat | quantity | cm | 40–200 | — | `status.endo.whr` | — |
| `status.endo.whr` | Derék–csípő arány | quantity | 1 | 0.5–2 | `calc.whr` | — | — |
| `status.fert.fg.arm` | Ferriman–Gallwey — felkar | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.chest` | Ferriman–Gallwey — mellkas | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.chin` | Ferriman–Gallwey — áll | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.lowerAbdomen` | Ferriman–Gallwey — alhas | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.lowerBack` | Ferriman–Gallwey — ágyéki-keresztcsonti terület | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.thigh` | Ferriman–Gallwey — comb | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.total` | Ferriman–Gallwey összpontszám | quantity | {pont} | 0–36 | `calc.ferrimanGallwey` | — | — |
| `status.fert.fg.treated` | Szőrtelenítő kezelés alatt áll | bool | — | — | — | — | — |
| `status.fert.fg.upperAbdomen` | Ferriman–Gallwey — felhas | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.upperBack` | Ferriman–Gallwey — hát felső része | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.fg.upperLip` | Ferriman–Gallwey — felső ajak | coded | — | 4 kód | — | `status.fert.fg.total` | — |
| `status.fert.galactorrhoea` | Galactorrhoea | coded | — | 4 kód | — | — | — |
| `status.fert.galactorrhoea.character` | Váladék jellege | coded | — | 5 kód | — | — | — |
| `status.fert.galactorrhoea.side` | Galactorrhoea — melyik oldal | coded | — | 3 kód | — | — | — |
| `status.fert.partner.semenAnalysis` | Partner ondóvizsgálatának eredménye | coded | — | 8 kód | — | — | — |
| `status.fert.tanner.breast` | Emlő Tanner-stádium | coded | — | 5 kód | — | — | — |
| `status.gyn.adnex.finding` | Függelék — lelet | coded | — | 4 kód | — | — | — |
| `status.gyn.adnex.side` | Függelék — oldal | coded | — | 3 kód | — | — | — |
| `status.gyn.bimanual` | Bimanuális tapintás | coded | — | 4 kód | — | — | — |
| `status.gyn.cmt` | Portio mozgatási fájdalom | bool | — | — | — | — | — |
| `status.gyn.colposcopy` | Kolposzkópos lelet | coded | — | 4 kód | — | — | — |
| `status.gyn.colposcopy.biopsy` | Történt célzott biopszia | bool | — | — | — | — | — |
| `status.gyn.colposcopy.finding` | Kolposzkópos kép | coded | — | 6 kód | — | — | — |
| `status.gyn.colposcopy.tz` | Transzformációs zóna típusa | coded | — | 3 kód | — | — | — |
| `status.gyn.cytology` | Méhnyak-citológia eredménye | coded | — | 9 kód | — | — | sorozat |
| `status.gyn.douglas` | Douglas-üreg | coded | — | 4 kód | — | — | — |
| `status.gyn.fluor.character` | Fluor jellege | coded | — | 7 kód | — | — | — |
| `status.gyn.fluor.odor` | Szag | coded | — | 3 kód | — | — | — |
| `status.gyn.hpv` | HPV-státusz | coded | — | 6 kód | — | — | sorozat |
| `status.gyn.hpv.collection` | A HPV-minta vételi módja | coded | — | 3 kód | — | — | sorozat |
| `status.gyn.ph` | Hüvelyi pH | quantity | 1 | 3.5–8 | — | — | — |
| `status.gyn.portio` | Portio (méhszáj) | coded | — | 4 kód | — | — | — |
| `status.gyn.portio.contactBleeding` | Kontaktvérzés | bool | — | — | — | — | — |
| `status.gyn.portio.surface` | Felszín | coded | — | 9 kód | — | — | — |
| `status.gyn.speculum` | Hüvelyi feltárás | coded | — | 4 kód | — | — | — |
| `status.gyn.uterus.mobility` | Mozgathatóság | coded | — | 3 kód | — | — | — |
| `status.gyn.uterus.position` | Méh helyzete | coded | — | 5 kód | — | — | — |
| `status.gyn.uterus.size` | Méh nagysága | coded | — | 5 kód | — | — | — |
| `status.gyn.vulva` | Külső genitália | coded | — | 4 kód | — | — | — |
| `status.gyn.vulva.lesion` | Eltérés jellege | coded | — | 11 kód | — | — | — |
| `status.gyn.vulva.site` | A vulvaelváltozás lokalizációja | coded | — | 7 kód | — | — | — |
| `status.internal.abdomen` | Hasi tapintás | coded | — | 4 kód | — | — | — |
| `status.internal.abdomen.region` | Hasi régió | coded | — | 7 kód | — | — | — |
| `status.internal.abdomen.sign` | Tapintási jel | coded | — | 6 kód | — | — | — |
| `status.internal.edema` | Oedema | coded | — | 4 kód | — | — | — |
| `status.internal.edema.grade` | Oedema fokozata | coded | — | 3 kód | — | — | — |
| `status.internal.edema.site` | Oedema kiterjedése | coded | — | 4 kód | — | — | — |
| `status.internal.general` | Általános megtekintés | coded | — | 4 kód | — | — | — |
| `status.internal.hydration` | Hidratáltság | coded | — | 3 kód | — | — | — |
| `status.internal.lungs` | Tüdőhallgatózás | coded | — | 4 kód | — | — | — |
| `status.internal.lungs.side` | Tüdőlelet — melyik oldal | coded | — | 4 kód | — | — | — |
| `status.internal.lungs.sound` | Hallgatózási lelet | coded | — | 5 kód | — | — | — |
| `status.internal.lymph` | Nyirokcsomók | coded | — | 4 kód | — | — | — |
| `status.internal.lymph.region` | Nyirokcsomó-régió | coded | — | 5 kód | — | — | — |
| `status.internal.perfusion` | Perifériás keringés | coded | — | 4 kód | — | — | — |
| `status.internal.skin` | Bőr | coded | — | 6 kód | — | — | — |
| `status.internal.varicosity` | Varicositas | coded | — | 5 kód | — | — | — |
| `status.obs.amnioticFluid` | Magzatvíz jellege | coded | — | 7 kód | — | `labour.amniotic` | sorozat |
| `status.obs.caput` | Caput succedaneum | coded | — | 4 kód | — | `labour.caput` | sorozat |
| `status.obs.contractions.duration` | Kontrakció időtartama | quantity | s | 0–240 | — | `labour.contractionDuration` | sorozat |
| `status.obs.contractions.freq` | Kontrakciók száma | quantity | /(10.min) | 0–10 | — | `labour.contractions` | sorozat |
| `status.obs.contractions.intensity` | Kontrakció erőssége | coded | — | 4 kód | — | — | sorozat |
| `status.obs.engagement` | Fejbeszállás (ötödökben) | coded | — | 6 kód | — | `labour.descent` | sorozat |
| `status.obs.fhr` | Magzati szívfrekvencia | quantity | /min | 50–240 | — | `labour.fhr.baseline` | sorozat |
| `status.obs.fhr.method` | Szívhang észlelésének módja | coded | — | 5 kód | — | — | — |
| `status.obs.fundalHeight` | Méhmagasság | coded | — | 4 kód | — | — | — |
| `status.obs.fundalHeight.cm` | Méhmagasság (symphysis-fundus távolság) | quantity | cm | 5–50 | — | — | — |
| `status.obs.fundalHeight.dev` | Eltérés iránya | coded | — | 2 kód | — | — | — |
| `status.obs.lie` | Magzat fekvése | coded | — | 4 kód | — | — | sorozat |
| `status.obs.membranes` | Magzatburok | coded | — | 4 kód | — | — | sorozat |
| `status.obs.membranes.hours` | Burokrepedés óta eltelt idő | quantity | h | 0–2000 | `calc.rom.hours` | — | — |
| `status.obs.membranes.rupturedAt` | Burokrepedés időpontja | datetime | — | — | — | `status.obs.membranes.hours` | — |
| `status.obs.moulding` | Koponyacsont-egymásra csúszás | coded | — | 4 kód | — | `labour.moulding` | sorozat |
| `status.obs.position` | Magzat állása | coded | — | 8 kód | — | — | sorozat |
| `status.obs.presentation` | Előfekvő rész | coded | — | 8 kód | — | — | sorozat |

### `szuloszoba` — 6 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `nb.apgar.activity` | Apgar — Izomtónus (Activity) | coded | — | 3 kód | — | `nb.apgar.total` | — |
| `nb.apgar.appearance` | Apgar — Szín (Appearance) | coded | — | 3 kód | — | `nb.apgar.total` | — |
| `nb.apgar.grimace` | Apgar — Reflexingerlékenység (Grimace) | coded | — | 3 kód | — | `nb.apgar.total` | — |
| `nb.apgar.pulse` | Apgar — Pulzus (Pulse) | coded | — | 3 kód | — | `nb.apgar.total` | — |
| `nb.apgar.respiration` | Apgar — Légzés (Respiration) | coded | — | 3 kód | — | `nb.apgar.total` | — |
| `nb.apgar.total` | Apgar-összpontszám | quantity | {pont} | 0–10 | `calc.apgar` | — | — |

### `utankovetes` — 3 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `audit.postop.confirmed` | Műtét utáni diagnózis megerősítve | coded | — | 4 kód | — | — | `audit` |
| `audit.prenatal.confirmed` | A prenatális diagnózis megerősítve? | coded | — | 4 kód | — | — | `audit` |
| `audit.us.confirmed` | UH diagnózis megerősítve | coded | — | 4 kód | — | — | `audit` |

### `vitals` — 11 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `vitals.bp.diastolic` | Diasztolés vérnyomás | quantity | mm[Hg] | 20–200 | — | `score.meows` `vitals.map` `vitals.pulsePressure` | sorozat |
| `vitals.bp.systolic` | Szisztolés vérnyomás | quantity | mm[Hg] | 40–300 | — | `score.meows` `vitals.map` `vitals.pulsePressure` `vitals.shockIndex` | sorozat |
| `vitals.consciousness` | Tudatállapot | coded | — | 4 kód | — | — | sorozat |
| `vitals.map` | Középartériás nyomás (MAP) | quantity | mm[Hg] | — | `calc.map` | — | — |
| `vitals.pain` | Fájdalom (VAS) | quantity | 1 | 0–10 | — | — | sorozat |
| `vitals.pulse` | Pulzus | quantity | /min | 20–250 | — | `ekg.qtc.bazett` `ekg.qtc.fridericia` `score.cmqcc.ob.sepsis` `score.meows` `score.omqsofa` `vitals.shockIndex` | sorozat |
| `vitals.pulsePressure` | Pulzusnyomás | quantity | mm[Hg] | 0–150 | `calc.pulsePressure` | — | — |
| `vitals.rr` | Légzésszám | quantity | /min | 4–60 | — | `score.cmqcc.ob.sepsis` `score.meows` `score.omqsofa` | sorozat |
| `vitals.shockIndex` | Sokk-index | quantity | 1 | 0.2–3 | `calc.shockIndex` | `score.cmqcc.stage` | — |
| `vitals.spo2` | SpO₂ | quantity | % | 50–100 | — | `score.meows` `score.omqsofa` | sorozat |
| `vitals.temp` | Testhőmérséklet | quantity | Cel | 30–43 | — | `score.cmqcc.ob.sepsis` `score.meows` `score.omqsofa` | sorozat |

### `vizsgalatok` — 10 mező

| Azonosító | Név | Típus | Egység | Tartomány | Levezetés | Feltölti ezeket | Jelölés |
|---|---|---|---|---|---|---|---|
| `us.ac` | Haskörfogat | quantity | mm | 5–450 | — | `us.efw` `us.efw.ig21` | sorozat |
| `us.bpd` | Biparietális átmérő | quantity | mm | 5–450 | — | `us.efw` | sorozat |
| `us.efw` | Becsült magzati súly | quantity | g | 100–6000 | `calc.efw.hadlock` ⛔ | — | — |
| `us.efw.ig21` | Becsült magzati súly (INTERGROWTH-21st) | quantity | g | 50–7000 | `calc.efw.ig21` ⛔ | — | sorozat |
| `us.fl` | Combcsonthossz | quantity | mm | 5–450 | — | `us.efw` `us.ga.hc` `us.ga.hcfl` | sorozat |
| `us.ga.crl` | Gesztációs kor CRL-ből (INTERGROWTH-21st) | quantity | wk | 8–16 | `calc.ga.crl.ig21` ⛔ | — | sorozat |
| `us.ga.hc` | Gesztációs kor fejkörfogatból (csak FL hiányában) | quantity | wk | 14–45 | `calc.ga.hc.ig21` ⛔ | — | sorozat |
| `us.ga.hcfl` | Gesztációs kor HC-ből és FL-ből (INTERGROWTH-21st) | quantity | wk | 14–45 | `calc.ga.hcfl.ig21` ⛔ | — | sorozat |
| `us.hc` | Fejkörfogat | quantity | mm | 5–450 | — | `us.efw` `us.efw.ig21` `us.ga.hc` `us.ga.hcfl` | sorozat |
| `us.ofd` | Occipitofrontális átmérő | quantity | mm | 5–450 | — | — | sorozat |

---

## 6. Lefedettség

A tervezett **~4035** változóból **894** van meg (22.2%).
Ez szándékos: a mag **helyességét** bizonyítja, nem a lefedettséget. A hiányzó
mezők felvétele mechanikus munka, amihez a `04-modul-csontvaz.md` adja az eljárást.

A legutóbbi 14 mező felvételét **nem terv, hanem a kalkulátor-validátor kényszerítette ki**:
a `validateCalculators` kimutatta, hogy a definiált képletek olyan változókra hivatkoznak,
amik nincsenek a regiszterben. Ez a helyes irány — a képlet mondja meg, milyen mező kell,
nem fordítva.
