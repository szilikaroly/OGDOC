# Modul 09 — Epikrízis

| | |
|---|---|
| **Cél** | Szintézis: a rögzített adatból narratív klinikai összefoglaló, öt stílusban |
| **Forrás** | IPRACS `generateAIReport()` + v16 `narrative()` |
| **Becsült változó** | ~70 (nagyrészt generált, nem bevitt) |
| **Fázis** | 4 |
| **Függ** | minden korábbi modul |

## Mi van már meg az IntuiCare-ben

A `clinical_notes` tábla ez a modul: `kind`, `body_md`, `structured_json`, `version`, `signed_at`/`signed_by`, `ai_generated`, `parent_note_id`. Az `ai-notes.functions.ts` és az `encounter-templates.ts` már generál jegyzetet. **Az öt stílus és a regiszter-vezérelt narratívamotor új**, de a tárolás és az aláírás kész.

## 1. Ez a modul nem gyűjt adatot

Négy alszekciója — **kockázatok, kimenetel, javaslatok, kódolás** — kizárólag a már rögzített
adatból dolgozik. Ha itt új mezőt kellene kitölteni, az azt jelenti, hogy valamelyik korábbi
modul hiányos.

## 2. Öt stílus, két nyelv

Az IPRACS `generateAIReport()` mintájára:

| Stílus | Kinek | Jellemző |
|---|---|---|
| **Klinikai narratíva** | dokumentáció | strukturált orvosi összefoglaló, teljes |
| **SBAR** | átadás/handoff | Situation – Background – Assessment – Recommendation |
| **Zárójelentés** | beteg és háziorvos | formális, a `14` modul bemenete |
| **Ápolói összefoglaló** | szülésznő/ápoló | gondozási folyamat fókusz |
| **Konzulensi kérés** | szakkonzílium | mit kérdezünk, milyen adattal |

**A szöveg a regiszter aktuális értékeiből épül, nem sablonból.** Az IPRACS
`generateHungarianReport()` / `generateEnglishReport()` stringkonkatenációval dolgozik minden
`labourData[]` és score aktuális értékéből; az OGDOC ezt a regiszter-vezérelt narratívamotorral
váltja ki, ahol minden változónak van egy `narrativeTemplate` mezője.

## 3. A négy alszekció

### 3.1 Kockázatok

Nem újraszámol, hanem **összegyűjt**: minden aktív score, minden vörös zászló, minden
kontraindikáció, a CORI domén-bontása. Mindegyik mellett ott a **bizonyíték szintje** és a
**bemeneti pillanatkép** — mit látott az algoritmus, amikor számolt.

### 3.2 Kimenetel

A `15` és `17` modul kimeneti változói: szülés módja, APGAR, perineális/cervikális sérülés,
vérvesztés, anyai és újszülött szövődmény, ápolási idő.

### 3.3 Javaslatok

A teendőmotor kimenete, priorizálva. Minden javaslat mellett:
- **mi váltotta ki** (melyik változó, melyik értéke)
- **mi az indoklás** (a v16 `v15` rétegének teendő-indoklás tudásbázisa)
- **mi a bizonyíték** (DOI/PMID)

### 3.4 Kódolás

A `17` modul kimenetének beemelése: BNO, OENO, HBCS.

## 4. A „nem tudom" és a hiányzó adat megjelenítése

Ez a modul legfontosabb tervezési döntése. Az epikrízisnek **ki kell mondania, mit nem tudunk**:

- Az anamnézisben „nem tudom"-mal jelölt tételek külön bekezdésben — nem elhallgatva
- Minden `insufficient` státuszú score felsorolva, a hiányzó bemenetekkel
- Minden lejárt érvényességű érték, amire számítás épült
- A `CaseState.errors[]` tartalma — ha egy modul nem futott le, az itt látszik

**Indoklás:** a klinikus a meg nem jelent kockázati blokkot könnyen negatív leletnek olvassa.
Az epikrízisben ezért az információhiány explicit, nem üresség.

## 5. Keresztfeltöltés

**⇦ Mi tölti fel**: minden modul.
**⇨ Mit tölt fel**: `14` zárójelentés (ez a bemenete) · `13` ellátási terv · `16` ICHOM-export.

## 6. Elfogadási kritérium

Egy teljes esetből az öt stílus mindegyike generálható, és a **klinikai narratíva nem tartalmaz
olyan állítást, ami nincs a rögzített adatban**. Ez géppel részben ellenőrizhető: minden
generált számnak és kódnak visszavezethetőnek kell lennie egy `variableId`-ra.

> **Ez teszt, nem ígéret:** [`test/epikrizis.test.ts`](../../test/epikrizis.test.ts) —
> a `traceability()` mind az öt stíluson lefut.

## 7. Nyitott kérdés

~~A „AI lelet" elnevezés örökölhető, de félrevezető.~~ **Eldőlt: a dokumentum neve
OKOSLELET.**

Az „AI" azt ígérné, ami nincs — nyelvi modell nincs a folyamatban. Az „okos" azt mondja,
ami igaz: a lelet **magától áll össze** a rögzített adatból, minden állítása mögött ott a
forrásváltozó, és **kimondja, mit nem tud**. Nem intelligenciát ígér, hanem
összeszedettséget.

A gépi jelölés emellett változatlanul `rule-based`, és az `epi.generation` változó három
értéket ismer (`ruleBased` · `manual` · `assisted`), hogy a megkülönböztetés akkor is
megmaradjon, ha a jövőben nyelvi modell is bekerül a láncba — akkor az már nem okoslelet
lesz, hanem `assisted`.

### Új nyitott kérdés, amit a megvalósítás hozott elő

**Mi számít hiánynak.** Az első működő változat minden ki nem számolt score-t felsorolt, és a
hiány-szakasz — aminek épp a hiányt kellett volna láthatóvá tennie — tizennyolc irreleváns
sorba fojtotta az egyetlen valódit. A mostani szabály: *amit elkezdtünk, de nem fejeztünk be,
az információ; amihez hozzá sem kezdtünk, az nem.* Ez védhető, de nem magától értetődő, és
klinikai átvételt kíván. (ld. [`../fejlesztes/16-epikrizis.md`](../fejlesztes/16-epikrizis.md) 3.)
