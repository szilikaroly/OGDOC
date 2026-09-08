# 06 — Szabad szöveg: feloldás mezőnként

> A `docs/11-strukturalt-adat.md` a **miért**-et mondja el. Ez a fejezet a
> **hogyan**: minden szabad szöveges mező, és mire cseréljük.

## 1. A szabály

Minden `text` típusú mezőhöz **vagy csere kell, vagy indoklás.** Harmadik lehetőség
nincs, és a modul addig nem kész (`04-modul-csontvaz.md`, 4. tétel).

```
text mező felvétele
   ├─ Véges és ismert a lehetőségek köre?      → coded (kódlista)
   ├─ Nagy a készlet, de kódolható?            → kereshető szótár szinonimákkal
   ├─ Összetett, de ismételhető a szerkezet?   → structured (sablon)
   ├─ Van mögötte szám?                        → quantity
   ├─ Az ismerethiány önálló információ?       → tristate
   ├─ A gép már strukturáltan tudja?           → import (DICOM SR, LIS2, POCT)
   ├─ Gyorsan kell, de kódolva?                → diktálás → javaslat → megerősítés
   └─ Egyik sem, ÉS az öt kivétel egyike       → text marad, INDOKLÁSSAL
```

## 2. Az öt eset, ahol a szabad szöveg megmarad

Mindig **strukturált mező mellett**, nem helyette.

| # | Eset | Mező | Miért nem kódolható | Korlát |
|---:|---|---|---|---|
| 1 | A beteg saját szavai | `compl.verbatim` | **A kódolatlanság AZ értéke.** A „szúró" és a „hasogató" közti különbség diagnosztikus. | idézet, szerkesztetlen; kódolt panasz **mellett** |
| 2 | Klinikai indoklás | `*.reason` | Az indoklás *minősége* a lényeg; kódolva üres formalitás lenne. | csak felülbírálásnál, kötelezően |
| 3 | Narratív kiegészítés | `*.narrative` | Ami tényleg nem fér a sémába. | a strukturált mezők **mellé**; nem exportálódik |
| 4 | Konzíliumi kérdés | `13` modul | Ember embernek írt kérdése. | címzett és tárgykör kódolt |
| 5 | Nemmegfelelőség leírása | `bb_nonconformity` | ISO 20387 elvárja a narratív leírást. | kódolt osztályozás **mellett** |

> A `*.reason` mezők a legfontosabbak a listán. Amikor a klinikus felülbírálja a
> rendszer figyelmeztetését, **az indoklás az egyetlen dolog, ami később megmagyarázza
> a döntést.** Ezt kódolni annyi lenne, mint elveszíteni.

## 3. Feloldás modulonként

Az alábbi táblázat a v16 és az IPRACS örökölt szabad szöveges mezőit tartalmazza,
és azt, mire cseréljük őket.

### 01 Panaszok

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „panasz leírása" | `compl.code` (~400 tételes szótár szinonimákkal) + `compl.verbatim` | 2 + kivétel 1 |
| „mióta" | `compl.onset` (datetime) + `compl.duration` (quantity) | 4 |
| „milyen erős" | `compl.severity` (0–10 VAS) | 4 |
| „jellege" | `compl.character` (coded: szúró/tompa/görcsös/égő/hasogató) | 1 |
| „mi provokálja" | `compl.trigger` (coded-multi) | 1 |

### 03 Anamnézis

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „korábbi betegségek" | `hx.sys.*` **tristate** kérdéssor + BNO-kódolt lista | 5 + 2 |
| „műtétek" | `hx.surg.*`: OENO-kód + dátum + intézmény | 2 |
| „gyógyszerek" | ATC-kódolt lista + dózis (quantity) + gyakoriság (coded) | 2 + 4 |
| „allergia" | `hx.allergy.*`: ágens (kódolt) + reakció típusa (coded) + súlyosság | 1 |
| „családi anamnézis" | rokonsági fok (coded) + betegség (BNO) + életkor | 1 |

> **A tristate itt döntő.** A „korábbi betegségek" szabad szöveges mezőnél a
> hiányzó említés kétértelmű: nem volt, vagy nem kérdezték? A tristate kérdéssor
> ezt szétválasztja, és a „nem tudom" **rögzül**.

### 04 Státusz

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „fizikális lelet" | hat alszekció kódolt mezői | 1 |
| „nagy myoma" típusú leírás | `myoma.diameter_mm` (quantity) + lokalizáció (coded) | **4 — mérés leírás helyett** |
| „oedema" | `status.internal.edema` (coded: 0/+/++/+++) | 1 |
| „beszállás" | `exam.cervix.station` **kódolt**, klinikai címkékkel | 1 |

> A beszállás konkrét tanulság: szabad számbeírásként a klinikus a −3…+3 skálán
> gondolkodik, a Bishop-pontozás viszont 0–3 sávot vár, **és a −1 meg a 0 egy sávba
> esik**. Ez rendszeres, egyirányú elszámolás lett volna. Kódolt mezőként a klinikus
> a látott állapotot választja, a pontérték a kód.

### 05 Vizsgálatok

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „UH-lelet" | `us.*` biometria + strukturált sablon | 3 + **6 (DICOM SR)** |
| „labor" | LOINC-kódolt mezők | 2 + **6 (LIS2-A2)** |
| „EKG-lelet" | `ekg.*` paraméterek + a 296-képletes motor | 3 + **6 (waveform)** |

> Ahol a gép már strukturáltan tudja, ott a beírás **hiba**, nem kényelmetlenség.
> A DICOM SR-ből importált mérés eredete `device`; a kézzel beírté `clinician` —
> és a kettő precedenciája szándékosan eltér.

### 06 Gyógyszerelés

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „gyógyszerelés" | ATC + dózis + út (coded) + gyakoriság (coded) + indikáció (BNO) | 2 + 4 |
| „miért tér el a protokolltól" | `rx.*.reason` | **kivétel 2 — marad** |

### 10 Szülőszoba

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „szülés lefolyása" | esemény-idővonal: kódolt esemény + időbélyeg | 1 + 3 |
| „magzati szívhang" | CTG-import + kódolt klasszifikáció | 6 |
| „gátmetszés / repedés" | fokozat (coded), lokalizáció (coded) | 1 |

### 11 Műtő

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „műtéti leírás" | **strukturált sablon**: behatolás, lelet, elvégzett beavatkozás, zárás, szövődmény | 3 |
| „szövődmény" | Clavien–Dindo (coded) + leírás | 1 + kivétel 3 |

### 22 Biobank

| Örökölt mező | Csere | Eszköz |
|---|---|---|
| „minta állapota" | SPREC preanalitikai kód | 2 |
| „eltérés leírása" | kódolt osztályozás + narratív | **kivétel 5 — marad** |

## 4. Az „egyéb" csapdája

Minden kódlistában van „egyéb". Ha ez szabad szöveges, **az egész kódolás értelmét
veszti**: a felhasználók a nehezen megtalálható tételek helyett is ezt választják.

```
felhasználó „egyéb"-et választ és beír valamit
   └─▶ a bejegyzés FELÜLVIZSGÁLATI SORBA kerül (25. modul)
          ├─ már létező tétel más néven?  → szinonima felvétele a szótárba
          ├─ tényleg hiányzik?            → új kódlista-tétel, verziózva
          └─ egyedi eset?                 → marad szabad szövegként, jelölve
```

A rendszer így **használat közben javul**, fejlesztő nélkül. Minden „egyéb" vagy új
szinonimát, vagy új tételt eredményez.

**Mérendő:** ha egy kódlistán az „egyéb" aránya tartósan 5% fölött van, a lista
hiányos — nem a felhasználó hanyag.

## 5. Mérőszámok

| Mérőszám | Cél | Mit jelez, ha rossz |
|---|---:|---|
| Szabad szöveges mezők aránya | ≤ 10% | a séma nem fedi le a valós munkát |
| Kitöltött szabad szöveges mezők aránya | ≤ 5% | a strukturált út lassabb a gépelésnél |
| „egyéb" aránya kódlistánként | ≤ 5% | a lista hiányos |
| Átlagos kitöltési idő | ≤ a papíralapú | **ez a legfontosabb** |

> **A legkockázatosabb pont**: ha a strukturált bevitel lassabb a gépelésnél, a
> klinikus kikerüli, és akkor a rendszer *rosszabb* adatot termel, mint egy szabad
> szöveges. Az IEC 62366-1 használhatósági értékelés pontosan ezt méri.

## 6. Jelen állás

A regiszterben **1 szabad szöveges mező** van 47-ből (2%) — a `patient.taj`, ami
azonosító, nem klinikai szöveg. Ez azért ilyen alacsony, mert a katalógus még kicsi;
az arány a modulok feltöltésével fog emelkedni, és **ekkor kell figyelni rá**.
