# Modul 04 — Státusz

| | |
|---|---|
| **Cél** | A fizikális vizsgálat strukturált rögzítése hat szakterületi alszekcióban, közös vitális maggal |
| **Forrás** | v16 (vitálisok, részleges) + IPRACS (`exam-*`) + ÚJ |
| **Becsült változó** | ~280 |
| **Fázis** | 2 |
| **Függ** | 02, 03, 01 |

## Mi van már meg az IntuiCare-ben

**A vitális mag már megvan**: a `fhir-codes.ts` `LOINC` katalógusa tartalmazza a HR-t, RR-t, SBP/DBP-t, hőmérsékletet, SpO₂-t és testsúlyt — kétnyelvű címkével, egységgel, referencia- és kritikus tartománnyal. Ezek a `clinical_observations` táblába íródnak, `category: "vital-signs"` alatt. A `scores.ts` már hozza a **Bishop-score-t**, a NEWS2-t és az APGAR-t. **A hat szakterületi alszekció nincs meg** — az a modul új része.

## 1. Cél és felépítés

Hat alszekció, de **egyetlen vitális mag**, amit mindegyik használ. A vitálisok az egész rendszer
legtöbbet fogyasztott változói: a MEOWS, a Shock Index, a fullPIERS, az omqSOFA és a CORI is
belőlük számol.

### 1.1 A vitális mag (`vitals.*`)

| Változó | Egység | Fogyasztók |
|---|---|---|
| `vitals.bp.systolic` | mm[Hg] | MAP, Shock Index, MEOWS, fullPIERS, CORI, BNO O13 |
| `vitals.bp.diastolic` | mm[Hg] | MAP, MEOWS |
| `vitals.pulse` | /min | Shock Index (HR/SBP), MEOWS, omqSOFA, Burch-Wartofsky |
| `vitals.temp` | Cel | MEOWS, omqSOFA, Burch-Wartofsky |
| `vitals.spo2` | % | MEOWS, **fullPIERS**, omqSOFA |
| `vitals.rr` | /min | MEOWS, omqSOFA |
| `vitals.pain` | 0–10 | VAS |
| `vitals.consciousness` | coded | AVPU / GCS, MEOWS |

Mind `cardinality: "series"` — időbélyeggel, mert vajúdás alatt óránként ismétlődnek.
`validity`: ambuláns 7 nap, vajúdás alatt 4 óra (SpO₂: 1 óra).

### 1.2 Antropometria (`anthro.*`)

`height`, `weight.current`, `weight.prepregnancy`, `bmi` (computed), `bsa` (computed, Mosteller),
`weightGain` (computed, IOM-ajánlással összevetve).

## 2. A hat alszekció

### 2.1 Belgyógyászati (`status.internal.*`)

Általános megtekintés (tudat, bőr, hidratáltság, ikterus, cyanosis), szív- és tüdőhallgatózás,
hasi tapintás (érzékenység régiónként, defense, rebound, máj/lép), végtagok (oedema fokozata,
perifériás keringés, varicositas), nyirokcsomók.

### 2.2 Kardiológiai (`status.cardio.*`)

NYHA-osztály, zörejek (lokalizáció, időzítés, fokozat), pangásjelek (JVD, hepatomegalia,
oedema), pulzuskvalitás, perifériás pulzusok. **A CARPREG II bemenetei innen jönnek**, nem
külön beírva:

| CARPREG II tétel | Pont | Forrás |
|---|---:|---|
| Korábbi cardialis esemény / arrhythmia | 3 | `hx.sys.cardiac.prevEvent` |
| Kiindulási NYHA III-IV vagy cyanosis | 3 | `status.cardio.nyha` ≥ 3 |
| Mechanikus műbillentyű | 3 | `hx.surg.cardiac.mechValve` |
| Kamrai dysfunctio (EF < 55%) | 2 | `us.cardiac.ef` |
| Magas rizikójú bal szívfél-obstrukció | 2 | `us.cardiac.lvot` |
| Pulmonalis hypertonia | 2 | `us.cardiac.paps` |
| Coronaria-betegség | 2 | `hx.sys.cad` |
| Magas rizikójú aortopathia | 2 | `us.cardiac.aorticRoot` |
| Nem volt korábbi cardialis intervenció | 1 | `hx.surg.cardiac` = false |
| Késői (>20. hét) terhes-kardiológiai értékelés | 1 | `computed` a vizitdátumból |

Ez a modul mutatja meg legjobban, mit ad a regiszter: a CARPREG II a v16-ban tíz kézzel
bepipálandó checkbox. Itt **nyolc a tízből magától kitöltődik** a státuszból, az anamnézisből és
az echóból.

### 2.3 Nőgyógyászati (`status.gyn.*`)

Külső genitália, hüvelyi feltárás (fluor jellege, szag, pH), portio (felszín, ectopia,
kontakvérzés), bimanuális tapintás (uterus mérete/helyzete/mozgathatósága, adnexek,
Douglas-üreg), cytológia és HPV státusz, kolposzkópos lelet.

### 2.4 Szülészeti (`status.obs.*`)

| Változó | Megjegyzés |
|---|---|
| `status.obs.fundalHeight` | cm, GA-hoz viszonyítva |
| `status.obs.lie` / `.presentation` / `.position` | magzati helyzet, tartás, állás |
| `status.obs.fhr` | szívhang, `series` |
| `status.obs.contractions` | szám /10 perc, időtartam |
| `status.obs.membranes` | intakt / repedt / idő |
| `status.obs.amnioticFluid` | jelleg (tiszta / meconiumos / véres) |
| **`exam.cervix.dilation`** | cm 0–10 |
| **`exam.cervix.effacement`** | % 0–100 |
| **`exam.cervix.station`** | −3…+3 |
| **`exam.cervix.consistency`** | kemény / közepes / puha |
| **`exam.cervix.position`** | hátsó / közép / elülső |
| `status.obs.caput` / `.moulding` | 0–3 |

### 2.5 Endokrin (`status.endo.*`)

Pajzsmirigy tapintás (méret, göb, konzisztencia, fájdalom), szemtünetek, virilizáció jelei,
striák, acanthosis nigricans, testarányok, zsíreloszlás, hirsutismus.

### 2.6 Infertilitás (`status.fert.*`)

Ferriman–Gallwey hirsutismus-score, emlő Tanner-stádium, galactorrhoea, ovariális rezerv
klinikai jelei, partner-adatok (spermiogram-eredmény hivatkozása).

## 3. A Bishop-score: az architektúra próbaköve

Az IPRACS ismert limitációja: *„a Bishop Score egyszerre három helyen szerepel — ez a
legkevésbé SSOT-konform rész."* Az OGDOC-ban az öt cervix-mező **egyetlen helyen él**
(`exam.cervix.*`, fent kiemelve), és a Bishop-score `computed` levezetés fölöttük:

```jsonc
"score.bishop.total": {
  "derivation": {
    "kind": "computed",
    "inputs": ["exam.cervix.dilation", "exam.cervix.effacement", "exam.cervix.station",
               "exam.cervix.consistency", "exam.cervix.position"],
    "fn": "bishop", "requiresAll": true
  }
}
```

A pontozás az IPRACS-ból változatlanul:

```
dScore = dilation===0 ? 0 : dilation<=2 ? 1 : dilation<=4 ? 2 : 3
eScore = effacement<=30 ? 0 : effacement<=50 ? 1 : effacement<=80 ? 2 : 3
total  = dScore + eScore + station + consistency + position
```

Színkód: ≥ 8 zöld (kedvező, indukció valószínűen sikeres) · 6–7 narancs (közepes) ·
< 6 piros (kedvezőtlen, érlelés mérlegelendő). Maximum 13.

**Ahol a Bishop megjelenik — a szülőszobai kártyán, a kockázati panelen, az indukciós
döntéstámogatásban —, ott mindenhol ugyanaz a `mirror`.** Nincs harmadik bemeneti pont.

## 4. Keresztfeltöltés

**⇦ Mi tölti fel**: `01` panasz (`opens` → kötelező vizsgálat), `03` anamnézis (pozitív
szervrendszer → kötelező célzott státusz), `02` kontextus (mely alszekció jelenik meg).

**⇨ Mit tölt fel**: MAP · Shock Index · MEOWS · fullPIERS · omqSOFA · CORI · CARPREG II ·
Bishop · `05` képalkotó-javallat · `09` epikrízis fizikális része · `17` BNO.

## 5. Elfogadási kritérium

A cervix-mezők egyetlen helyen szerkeszthetők, és a Bishop-összeg minden megjelenési helyen
azonos értéket mutat, azonnal. A CARPREG II tíz tételéből legalább nyolc automatikusan
kitöltődik, ha az anamnézis és az echo megvan.

## 6. Nyitott kérdés

A v16 duplikátumai (`c_hr` vs `k_hr2` pulzus, `k_sbp` vs `#bp` szisztolés vérnyomás) itt
oldódnak fel: el kell dönteni, melyik a kanonikus. **Javaslat:** a `vitals.*` névtér a primer,
minden más `aliasOf`. A build ellenőrzi, hogy ne maradjon két primer ugyanarra a LOINC-kódra.
