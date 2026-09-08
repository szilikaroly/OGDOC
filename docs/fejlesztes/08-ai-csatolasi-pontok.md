# 08 — AI-csatolási pontok

> Ez a fejezet **nem** arról szól, hogy hova lehetne AI-t tenni. Arról szól, hogy
> hova **szabad**, milyen szerződéssel, és hol nem szabad semmiképp.

## 1. A négy szabály, ami minden csatolási pontra vonatkozik

| # | Szabály | Miért |
|---:|---|---|
| 1 | **Az AI kimenete `prefill`, soha nem `computed`.** | A javaslat felülbírálható és indoklást hordoz; a levezetett érték a rendszer állítása. Az AI nem állít, javasol. |
| 2 | **Megerősítés nélkül nem rögzül érték.** | A `provenance` ilyenkor `prefilled`, a `sourceRef` megnevezi a modellt és a verzióját. |
| 3 | **Az AI nem értékel klinikailag — adatot strukturál.** | A felismerés a **meglévő** kalkulátorokat táplálja. Két párhuzamos klinikai logika a legrosszabb kimenetel. |
| 4 | **Minden AI-kimenet naplózódik**: modell, verzió, bemenet-hash, kimenet, megerősítette-e valaki. | MDR és AI-rendeleti követelmény, és enélkül a hibát nem lehet visszakeresni. |

A 3. szabály a legfontosabb, és a legkönnyebben megsérthető. Egy EKG-felismerő
könnyen adna „bal kamra hypertrophia" választ. **Nem szabad.** A dolga az, hogy
amplitúdót és időtartamot adjon; a hypertrophia-kritériumot a meglévő motor számolja.

## 2. A csatolási pontok

### AI-1 · EKG kép- és szkennelés-alapú digitalizálás

| | |
|---|---|
| **Modul** | EKG (K4 döntés) |
| **Bemenet** | papír-EKG fotója vagy szkennelése |
| **Kimenet** | elvezetésenkénti hullámforma → `ekg.qt`, `ekg.qrs`, `ekg.pr`, amplitúdók |
| **Szerződés** | `prefill`, elvezetésenkénti megerősítéssel |
| **Ki értékel** | a meglévő **296-képletes motor**, nem a modell |

**A kalibrálás a kritikus pont.** A lánc a rácsdetektálásból állapítja meg a
papírsebességet (25/50 mm/s) és az érzékenységet (10/20 mm/mV). Ha ez téved, **minden
érték arányosan téved**, és a hiba nem feltűnő: a görbe hihető marad, csak minden
időtartam 2×.

Ezért: a **detektált kalibráció megjelenik és megerősítendő**, mielőtt bármi számolna.

| Kockázat | Ellenszer |
|---|---|
| rossz kalibráció | kötelező megerősítés, a detektált érték kiírásával |
| torzult/ferde szkennelés | perspektíva-korrekció + minőségjelzés |
| átfedő elvezetések | elvezetésenkénti megerősítés, nem összesített |
| a modell „kitalál" hiányzó szakaszt | hiányos szakasz → `insufficient`, nem interpoláció |

> Ez a rendszer **első gépi látás komponense**, tehát ez húzza be az AI-rendeleti és
> MDR-következményeket: adatkormányzás, elkülönített teszthalmazon mért teljesítmény,
> PROBAST+AI és TRIPOD+AI szerinti dokumentálás, naplózás.

### AI-2 · Diktálás → strukturált javaslat

| | |
|---|---|
| **Modul** | 01, 03, 04, 11 |
| **Bemenet** | beszéd |
| **Kimenet** | **kódolt tételre tett javaslat**, nem szabad szöveg |
| **Szerződés** | `prefill`, tételenkénti elfogadással |

Ez a `11-strukturalt-adat.md` hetedik eszköze. A lényeg: a diktálás **nem szabad
szöveges mezőt tölt**, hanem kódlista-tételt javasol. „Kétszer szült, egyszer
császárral" → `hx.obs.para = 2` + `hx.surg.cs.count = 1`, mindkettő megerősítendő.

| Kockázat | Ellenszer |
|---|---|
| félrehallás (gyógyszernevek!) | a javaslat mellett a felismert nyersszöveg is látszik |
| tagadás elvesztése („nem volt lázas") | tagadás-detektálás; bizonytalanságnál nincs javaslat |
| a klinikus vakon elfogad | tételenkénti, nem tömeges elfogadás |

> **A tagadás a legveszélyesebb hiba.** Egy „nem volt lázas" mondatból „láz: igen"
> javaslatot csinálni klinikailag súlyosabb, mint semmit nem javasolni.

### AI-3 · Az „egyéb" tanulási csatorna osztályozása

| | |
|---|---|
| **Modul** | 25 (belső szerkesztő) |
| **Bemenet** | „egyéb"-ként beírt szöveg |
| **Kimenet** | javaslat: **létező tétel szinonimája** \| új tétel \| egyedi eset |
| **Szerződés** | javaslat a felülvizsgálati sorban; **ember hagyja jóvá** |

Ez a legalacsonyabb kockázatú csatolási pont, és az egyik legnagyobb hasznú: a
kódlisták karbantartását teszi elviselhetővé. Az AI itt **nem betegadatról dönt**,
hanem szótár-karbantartást javasol.

### AI-4 · Kódolási javaslat (BNO / OENO)

| | |
|---|---|
| **Modul** | 17 Kódolás |
| **Bemenet** | a strukturált eset |
| **Kimenet** | BNO- és OENO-kód javaslat, **indoklással: melyik mező alapján** |
| **Szerződés** | `prefill`; a kódoló fogadja el |

**Kötelező elem az indoklás.** Egy kódjavaslat magyarázat nélkül vagy vakon
elfogadásra, vagy vakon elutasításra kerül — mindkettő rossz. Ha a rendszer
kiírja, hogy „O14.1, mert `vitals.bp.systolic` ≥ 160 és `lab.plt` < 100", a kódoló
ellenőrizni tudja.

Ez a pont **finanszírozási hatású**, ezért az AI-rendelet szerint magasabb
kockázatú, mint amilyennek elsőre látszik.

### AI-5 · Lekérdezés természetes nyelvből

| | |
|---|---|
| **Modul** | 20 Statisztika/lekérdezés |
| **Bemenet** | „hány 35 év feletti primipara szült császárral 2025-ben" |
| **Kimenet** | **a lekérdező szűrőfája**, nem eredmény |
| **Szerződés** | a felhasználó látja és szerkeszti a fát, mielőtt lefut |

**Az AI itt nem az adathoz fér hozzá, hanem a lekérdezéshez.** Ez a különbség
minden: a generált szűrőfa ellenőrizhető, egy generált szám nem.

A `phi` mezők a lekérdezőből eleve kimaradnak, tehát az AI sem tud rájuk szűrni.

### AI-6 · Dokumentum-import strukturálása

| | |
|---|---|
| **Modul** | 05, 09 |
| **Bemenet** | beszkennelt zárójelentés, külső lelet, PDF |
| **Kimenet** | javasolt mezőértékek, **forráshelyre mutató hivatkozással** |
| **Szerződés** | `prefill`, eredet `imported`, mezőnkénti megerősítéssel |

A forráshely-hivatkozás (melyik oldal, melyik bekezdés) nem kényelmi funkció:
enélkül a klinikus nem tudja ellenőrizni a javaslatot, csak elhinni.

### AI-7 · Kockázati modellek — **feltételesen**

| | |
|---|---|
| **Modul** | döntéstámogatás |
| **Állapot** | **nem most** |

Egy tanult kockázati modell (pl. praeeclampsia-előrejelzés) technikailag beköthető
lenne kalkulátorként. **De**: a `verified` kapu itt nem elég. Egy tanult modellnél
nem konstansokat kell ellenőrizni, hanem **külső validációt** kell felmutatni a
saját populáción, PROBAST+AI szerinti elfogultság-értékeléssel és TRIPOD+AI szerinti
dokumentálással.

> A fullPIERS pontosan itt bukott el, és az még egy *publikált, regressziós* modell
> volt. Egy tanult modellnél a hiba kevésbé feltűnő és nehezebben kimutatható.

Amíg ez nincs meg, a `registerCalc` `verified: false` mellett fogadja be — tehát
**definiálható, de nem ad eredményt**. Ez a helyes köztes állapot.

## 3. Ahol AI-t nem szabad használni

| Terület | Miért nem |
|---|---|
| **Hard-stop kapuk** (`rule.*`) | Az asztma → carboprost tiltás determinisztikus szabály. Egy valószínűségi modell itt nem javít, csak megbízhatatlanná tesz. |
| **Adagolás számítása** | Determinisztikus, ellenőrizhető, tétje nagy. Nincs mit tanulni rajta. |
| **PHI-kezelés, pszeudonimizálás** | A kulcskezelés kriptográfiai, nem statisztikai kérdés. |
| **Auditnapló** | Az auditnak determinisztikusnak és megváltoztathatatlannak kell lennie. |
| **Beleegyezés értelmezése** | Jogi aktus. A hatókör kódolt, nem következtetett. |
| **Végső klinikai döntés** | A rendszer döntés*támogató*. |

## 4. A technikai szerződés

Minden AI-csatolás ugyanazon a felületen megy át:

```ts
interface AiSuggestion {
  variableId: string;
  value: unknown;
  confidence: number;              // 0–1, a modell sajátja
  rationale: string;               // MIÉRT — kötelező, ember számára olvasható
  sourceSpan?: { page?: number; bbox?: number[]; text?: string };
  model: { id: string; version: string };
  inputHash: string;               // a bemenet ujjlenyomata, naplózáshoz
}
```

Feldolgozás:

```
AiSuggestion
   ├─ confidence < küszöb        → nem jelenik meg. „Bizonytalan javaslat" nincs.
   ├─ setValue-validáció megbukik → nem jelenik meg (tartomány, kódkészlet)
   └─ megjelenik javaslatként
        ├─ elfogadva → setValue(..., { provenance: "prefilled", sourceRef: model })
        └─ elutasítva → naplózva (ez a modell javításának adata)
```

**Az elutasítás naplózása** legalább olyan értékes, mint az elfogadásé: ez mondja
meg, hol téved a modell rendszeresen.

## 5. Mit mérünk

| Mérőszám | Miért |
|---|---|
| Elfogadási arány csatolási pontonként | tartósan alacsony → a javaslat nem hasznos |
| **Elfogadás utáni javítás aránya** | magas → a klinikus vakon fogad el, aztán javít — **ez a legveszélyesebb minta** |
| Bizonytalanság miatt elmaradt javaslatok | a lefedettség ára |
| Kitöltési idő javaslattal és anélkül | ha nem gyorsít, felesleges |

> Az „elfogadás utáni javítás" a legfontosabb mérőszám. Ha magas, az azt jelenti,
> hogy a megerősítési lépés **rituálévá vált** — és akkor a 2. szabály papíron
> teljesül, a gyakorlatban nem.
