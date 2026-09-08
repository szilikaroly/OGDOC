# Modul 03 — Anamnézis

| | |
|---|---|
| **Cél** | A teljes kórelőzmény strukturált, kereshető, kódolt felvétele — a rendszer legérettebb része |
| **Forrás** | **v16 — szinte teljes egészében átvehető** + IPRACS `getFixData()` |
| **Becsült változó** | ~230 |
| **Fázis** | 1 |
| **Függ** | 02 |

## Mi van már meg az IntuiCare-ben

A `clinical_observations` (`category`, `loinc_code`, `snomed_code`, `value_*`) tárolja majd a strukturált tételeket, a `clinical_diagnoses` a korábbi diagnózisokat, a `menstrual_cycles` a ciklusadatokat. **A ~230 anamnézis-tétel, a háromállású válasz és a családfa nincs meg** — ez a modul nagyrészt új munka, a v16-ból portolva.

## 1. Mit örökölünk, és miért ez a legjobb kiindulás

A v16 anamnézis-modulja három olyasmit tud, amit a legtöbb klinikai rendszer nem:

**(a) Háromállású válasz.** Mind a 110 kérdéssoron „igen / nem / **nem tudom**". A „nem tudom"
nem hiányzó adat, hanem **rögzített ismerethiány** — klinikailag más, és a kockázatbecslésben is
másképp kell kezelni. Az „Összes negatív" gomb szándékosan nem írja felül.

**(b) Tisztázatlan diagnózisú családi tételek.** Nyolc tétel arra az esetre, amikor a családi
adat laikus leírás, nem diagnózis: *„fiatalon szívbetegségben elhunyt rokon — a diagnózis nem
tisztázott"*. Ez a valóság, és a legtöbb űrlap nem tudja felvenni.

**(c) A forrás és a megbízhatóság rögzítése.** A családfa-modul rokononként tárolja, honnan
származik az adat és mennyire dokumentált. Az OGDOC ezt az ösztönt terjeszti ki az **egész
rendszerre** a `provenance` + `confidence` burokkal (ld. `01-architektura.md`).

## 2. Adatszerkezet — a v16 tömbjei új névtérben

| v16 tömb | Tétel | Új névtér | Megjegyzés |
|---|---:|---|---|
| `SYSTEMS` | 24 (8 csoport) | `hx.sys.*` | kardiovaszkuláris, endokrin, nőgyógyászat, vese/máj/GI, légző/alvás, haematológia/immun, neuro/pszichiátria, egyéb |
| `REPRO` | 14 | `hx.repro.*` | benne a v16-ban hozzáadott terhességvesztés-kör |
| `FAMILY` | 21 | `hx.family.*` | ebből 8 tisztázatlan diagnózisú |
| `ENDO` | 17 | `hx.endo.*` | mindegyik alatt kiemelt terhességi vonal |
| `LIFE` | 3 | `hx.life.*` | dohányzás, alkohol, drog |
| `ORIGIN` | 8 | `hx.origin.*` | a beteg saját magzati/újszülöttkori előzményei — DOHaD |
| `SURG` | 10 | `hx.surg.*` | |
| `SUPP` | 8 | `hx.supp.*` | szupplementáció, dózissal |
| `EESZT_RISK` | 12 | `hx.eeszt.*` | hivatalos magyar várandós-rizikókódok |

### 2.1 A háromállású válasz mint adattípus

```jsonc
"datatype": "tristate",
"valueSet": [
  { "code": "pos", "label_hu": "Igen" },
  { "code": "neg", "label_hu": "Nem" },
  { "code": "unk", "label_hu": "Nem tudom", "flags": ["unknown"] }
]
```

A score-ok számára az `unk` **nem `false`**. Ahol egy rizikófaktor ismeretlen, a score vagy
`insufficient`-et ad, vagy — ha a modell ezt megengedi — külön jelzi, hogy a becslés
hiányos anamnézisen alapul.

### 2.2 A terhességvesztés-kör (v16/5)

| Változó | Tétel |
|---|---|
| `hx.repro.loss.spontaneous` | spontán vetélés (számmal) |
| `hx.repro.loss.induced` | művi terhességmegszakítás |
| `hx.repro.loss.missed` | missed abortion / nem fejlődő terhesség |
| `hx.repro.loss.ectopic` | méhen kívüli terhesség — **vörös zászló** |
| `hx.repro.loss.mola` | molaterhesség — **vörös zászló** |
| `hx.repro.intervention.curettage` | méhűri beavatkozás terhesség után |
| `hx.repro.gpa.*` | GPA-számlálók — `computed` a fentiekből |

### 2.3 A dinamikus családfa (v16/2)

> **Ez a [23. genetikai modul](23-genetika.md) legfontosabb bemenete**, és a kapcsolat
> kétirányú: egy megerősített genetikai lelet visszaírja a családfát — az érintett rokonnál
> a diagnózis megbízhatósága `reported`-ről `documented`-re vált.


Rokononként külön rekord, nem lapos checkboxlista:

```jsonc
{
  "relation": "mother.sister",       // saját / anyai ág / apai ág, 3 generáció
  "diseases": [ /* 20-tételes lista */ ],
  "ageAtOnset": 42,
  "ageAtDeath": null,
  "diagnosisReliability": "reported", // documented | reported | suspected
  "dataSource": "patient",            // patient | family | records | genetic-report
  "documentationGap": true            // külön jelzés, ha hiányzik a dokumentáció
}
```

### 2.4 Endokrin szekció: a terhességi vonal

A v16 17 endokrin tétele mindegyike hordoz egy **terhességi vonalat**, ami pozitív válasz esetén
automatikusan a teendőlistába kerül. Példa:

> `hx.endo.hypothyroid` → *„Terhesség megállapításakor a levotiroxin-dózis azonnali emelése
> (kb. +25–30%); TSH-cél az I. trimeszterben < 2,5 mIU/L; TSH 4 hetente a 20. hétig."*

Ez a szerkezet — állítás + hozzá kötött teendő, súlyossági szinttel (`info` / `warn` / `crit`) —
az OGDOC általános teendőmotorjának mintája.

## 3. Az IPRACS FIX-mezők beolvasztása

Az IPRACS `getFixData()` 31 mezője ma a **szülőszobán** kérdez rá olyasmire, amit az
anamnézisben már rögzíteni kellett volna: thrombophilia, APS, bipoláris zavar, korábbi
postpartum pszichózis, placenta previa, accreta, VBAC-előzmény.

**Ezek nem duplikálódnak: `mirror`-ként (`aliasOf`) kerülnek be.** Egy változó, két helyen
látszik — az anamnézisben és a szülőszobai FIX kártyán. Aki a szülőszobán módosítja, az az
anamnézist módosítja.

| IPRACS mező | OGDOC primer változó |
|---|---|
| `fix-asthma` | `hx.sys.asthma` |
| `fix-htn` | `hx.sys.htn` |
| `fix-thrombophilia` | `hx.sys.thrombophilia` |
| `fix-aps` | `hx.sys.aps` |
| `fix-bipolar` | `hx.psy.bipolar` |
| `fix-prev-ppp` | `hx.psy.prevPPP` |
| `fix-previa` / `fix-accreta` | `hx.repro.currentPregnancy.previa` / `.accreta` |
| `fix-vbac-pv` / `-pvb` / `-rec` | `hx.repro.prevBirth.vaginal` / `.vbac` / `.recurringIndication` |

## 4. Keresztfeltöltés

**⇦ Mi tölti fel**
- `02` kontextus (mely tételek kötelezőek)
- korábbi eset ugyanattól a betegtől → `prefill` az egész anamnézisre, `carryForward` politikával,
  **de a „nem tudom" válaszok újra megkérdezendők** (hátha időközben kiderült)

**⇨ Mit tölt fel**

| Cél | Példa |
|---|---|
| `04` státusz | pozitív kardiológiai anamnézis → kötelező kardiológiai státusz |
| `05` labor | `hx.endo.hypothyroid` → TSH kötelező, trimeszterenként |
| `05` szűrés | `hx.repro.gdm` → korai OGTT (16–18. hét) esedékessé válik |
| `06` gyógyszerelés | **`hx.sys.asthma` → carboprost abszolút kontraindikáció** |
| `06` gyógyszerelés | `hx.sys.htn` / preeclampsia → methylergonovin kontraindikáció |
| `08` pszichológia | `hx.psy.bipolar` → PPP-rizikó OR ~35× |
| `10` szülőszoba | CMQCC, VBAC, Caprini bemenetek |
| `17` BNO | a v16 feltételes kódszabályai (`t:(p,c)=>…`) |
| kockázati motor | triszómia (FMF a priori), preeclampsia/GDM (NICE), VTE (Caprini) |

## 5. Kockázatbecslők — a v16 három szétválasztott logikája

| Becslő | Alap | Kimenet |
|---|---|---|
| Triszómia | FMF a priori (Snijders), GA szerinti tábla | életkor- és GA-függő alapkockázat |
| Preeclampsia / GDM | NICE-besorolás | magas / közepes / alacsony, a kiváltó tényezők felsorolásával, ASA- ill. OGTT-javallattal |
| FMF-elvű, markerekkel | MAP / UtA-PI / PlGF MoM, log-odds | **kiírja, hogy nem a hivatalos FMF-kalkulátor** |

A vetélés / koraszülés / halvaszületés becslés epidemiológiai és **nem validált** — a felület ezt
ki is mondja. Ez az önkorlátozás a v16 egyik erénye, és az OGDOC alapértelmezésévé válik: minden
becslés mellett ott van a validáltsági szintje.

## 6. Elfogadási kritérium

A v16 `id`-listája hiánytalanul leképződik az új `id`-kre, és a leképezés géppel ellenőrizhető.
Egy teljes anamnézis felvehető úgy, hogy **nem veszett el tétel**, és a „nem tudom" válaszok
külön csoportban jelennek meg az összefoglalóban.

## 7. Nyitott kérdés

A foglalkozás-egészségügyi lap hiányzó elemei (beteg-oldali anamnézis tételek + fizikális
státusz: audiogram, légzésfunkció, visus, neurológiai státusz, alkalmassági vélemény) a v16
örökölt nyitott teendője. Szerkezetileg ebbe és a `04`-be illeszthető, de **nincs benne a
jelenlegi 18 modulban** — külön döntést kér.
