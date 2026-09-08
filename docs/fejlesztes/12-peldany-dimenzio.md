# 12 — Példány-dimenzió és panaszszótár

> Ez a fejezet két összetartozó dolgot ír le: egy MAGBELI képességet
> (ugyanaz a mező több alanyra), és az első modult, ami használja (a panaszok).

## 1. A probléma, ami kikényszerítette

A `01-panaszok.md` szerint minden aktivált panasz OPQRST-attribútumokat kap:
mikor kezdődött, milyen jellegű, hova sugárzik, mi enyhíti. A terv ezt így írta le:

```
compl.<id>.onset · compl.<id>.quality · compl.<id>.radiation …
```

Ez szó szerint értve 120 panasz × 11 jellemző = **1320 változódefiníciót** jelentene,
és egy új panasz felvétele tizenegy új változót kérne. Vagyis egy ADAT felvételéhez
kódot kellene írni — pontosan az, amit a `00-attekintes.md` első szabálya tilt:

> *„Ha egy új változó felvételéhez kódot kell írni, valamit rosszul csináltunk.”*

Az ellenkező véglet — egyetlen `structured` mező, amiben tömbként állnak a panaszok —
elveszíti a mezőnkénti dokumentációt, az értékkészlet-ellenőrzést, a származást és a
keresztfeltöltést. Az sem járható.

## 2. A megoldás: a mező egyszer, az érték példányonként

A jellemző **egyszer** van definiálva, és minden ÉRTÉK megmondja, melyik példányhoz
tartozik:

```jsonc
// a definícióban
"id": "compl.q.severity",
"scopedBy": { "dimension": "complaint", "roster": "compl.active" }
```

```ts
// az írásban
setValue(reg, st, "compl.q.severity", 8, { scope: "compl.pain.abdomen.rlq" });
setValue(reg, st, "compl.q.severity", 3, { scope: "compl.gen.headache" });

resolve(reg, st, "compl.q.severity", "compl.pain.abdomen.rlq").value;  // 8
resolve(reg, st, "compl.q.severity").state;                            // "missing"
```

Az utolsó sor a lényeg: **scope nélkül nincs értelmes válasz.** Nincs olyan, hogy
„a fájdalom erőssége” — csak „a jobb alhasi fájdalom erőssége” van. A motor ezt nem
udvariasságból mondja meg, hanem azért, mert a néma összemosás egy fogyasztóban
(score, export, kutatói lekérdezés) észrevétlen maradna.

### 2.1 A névsor mint kapu

A `roster` az a `coded-multi` változó, aminek az értéke felsorolja a LÉTEZŐ példányokat.
Amíg egy panasz nincs benne, hozzá jellemző nem rögzíthető:

```
compl.q.severity: a(z) „compl.pain.abdomen.rlq" példány nincs a névsorban
(compl.active) — előbb azt kell rögzíteni
```

Ez ugyanaz a **kapu-minta**, ami a rendszerben már négyszer szerepel (ellenőrizetlen
konstans, kódrendszer-verzió, megőrzési idő, betegkérés): egy visszafordíthatatlan
hibát előz meg. Itt azt, hogy a rekordban egy panasz jellemzői álljanak anélkül, hogy
bárki valaha állította volna, hogy a beteg ezt a panaszt említette.

### 2.2 Hol fog még kelleni

A dimenzió nem a panaszok kedvéért van. Ugyanez a szerkezet szolgálja ki:

| Modul | Dimenzió | Névsor |
|---|---|---|
| `01` panaszok | panasz | `compl.active` |
| `03` családfa | rokon | a családfa rokonlistája |
| `06` gyógyszerelés | készítmény | az aktuális gyógyszerlista |
| `12` onkológia | góc | a leírt gócok listája |
| `22` biobank | minta | a mintaazonosítók |

Ezért épült meg most, egy modulnál: négy továbbinál ugyanez a kód fut majd.

### 2.3 Amit szándékosan NEM tud

- **Példányosított mező nem lehet `computed`.** A kalkulátorok nem ismerik a
  példányokat; egy példányonkénti score külön futtató-bővítést kér. A validátor ezt
  hibaként jelzi, nem hallgatja el.
- **Példányosított mező nem lehet mirror (`aliasOf`).** Két dimenzió egymásra
  vetítése olyan, amit később senki nem tudna kibogozni.

## 3. A panaszszótár

`registry/complaints/` — három fájl, jelenleg **82 tétel**, 336 szinonimával.
Nem `VariableDef`, hanem külön törzs (`ComplaintTerm`), mert nem adat, hanem
**fogalomkészlet**: a beteg szavaiból ide találunk el.

| Mező | Mit tesz |
|---|---|
| `synonyms` | laikus megfogalmazások — **ez a modul tényleges értéke** |
| `redflag` | mindig vörös zászló |
| `redflagWhen` | feltételes: a felsorolt feltételek EGYÜTT |
| `opens` | mely mezők válnak esedékessé (`04`, `05` felé) |
| `asks` | mely példányosított jellemzőket kérdezzük |
| `pathways` | melyik ellátási útvonalon jelenjen meg |
| `differential` | amire gondolni kell — emlékeztető, nem diagnózis |

### 3.1 A feltétel szerkezet, nem kifejezés

A terv `"ctx.pregnant && ga < 12"` alakú feltételt írt le. Egy ilyen sztringet csak
kiértékeléssel (`eval`) lehetne futtatni — vagyis a regiszterfájlba tett tetszőleges
kód futna, egy betegadatot kezelő rendszerben. A feltétel ezért **adat**:

```jsonc
"redflagWhen": [
  { "var": "ctx.pregnant", "op": "eq", "value": "pos" },
  { "var": "ctx.ga",       "op": "lt", "value": 12 }
]
```

Mellékhaszon: a hivatkozott változó létezése **fordításkor** ellenőrizhető, és
ellenőrizve is van.

### 3.2 A hiányzó adat nem „nem”

```ts
DICT.redflagState(reg, st, "compl.pain.abdomen.rlq").flag
// terhes, GA ismert, < 12 hét  → true
// nem terhes                    → false
// terhes, de a GA hiányzik      → "unknown"
```

A harmadik eset a fontos. A hiányzó gesztációs kor **nem zárja ki** a méhen kívüli
terhességet; csak azt jelenti, hogy nem tudjuk eldönteni. Ez ugyanaz az elv, mint a
score-oknál a `insufficient`: **nincs néma helyettesítés.**

### 3.3 Az útvonal szűkít

Ugyanaz a mondat más tételre mutat a várandósgondozásban és a gyermekágyban:

```ts
DICT.search("lázas vagyok", 10, "prenatal")[0].term.id     // compl.obs.fever
DICT.search("lázas vagyok", 10, "gynecology")[0].term.id   // compl.gen.fever
```

Nem azért, mert a szó mást jelent, hanem mert a **teendő** más. A validátor csak akkor
figyelmeztet ütköző szinonimára, ha a két tétel egyszerre is megjelenhet — ha az
útvonalaik elválnak, az ütközés helyes viselkedés.

### 3.4 A névsor generált

A `compl.active` és a `compl.chief` értékkészletét **nem kézzel írjuk**:

```
node tools/gen-complaint-roster.ts          # beírja
node tools/gen-complaint-roster.ts --check  # a CI ezt futtatja
```

A szótár a forrás. Így a regiszterfájl önmagában teljes marad (a felület és az export
nem függ attól, bekötötte-e valaki a szótárat), az elcsúszást pedig a build fogja meg,
nem a felhasználó.

## 4. A szabad szöveg nem tűnik el

```
compl.active   = ["compl.pain.abdomen.rlq"]      ← a gépnek
compl.verbatim = "szúr a hasam alul jobb oldalt"  ← az orvosnak
```

A kódolt tétel kereshető, exportálható, szabályt indít. A szó szerinti idézetben benne
van a jelleg, a lokalizáció és a beteg saját értelmezése — ezt egyetlen kód sem adja
vissza. **Egyik sem helyettesíti a másikat**, ezért mindkettő rögzül.

A `compl.verbatim` szerkesztetlen: nem stilizáljuk és nem fordítjuk szaknyelvre.
Beteg-azonosító adat kerülhet bele, ezért az exportnál szűrni kell — a kutatói
felületen nem kereshető szabadon.

## 5. Elfogadási kritérium — és hogy teljesül-e

A modul saját kritériuma: *tíz életszerű, szabadszöveges megfogalmazásból legalább
nyolc a helyes tételre talál, az első három találat között.*

Ez **teszt**, nem ígéret: `test/panasz.test.ts` — „tíz életszerű megfogalmazásból
legalább nyolc az első három találat között van”. A szótár bővítése nem ronthatja el
anélkül, hogy a build el ne szállna.

## 6. Ami még hátravan

- A felület oldala: a panaszkártya (egy kártya példányonként, benne az `asks` mezők)
  a `web/public/app.js` általános megjelenítőjében még nincs megvalósítva.
- A szótár 82 tételről ~400-ra bővítése. A `01-panaszok.md` saját javaslata, hogy ez
  **használat közben**, a `compl.verbatim` mezőkben ténylegesen megjelenő
  megfogalmazásokból történjen — nem íróasztal mellett. A mostani 82 tétel a
  szülészeti-nőgyógyászati mag, ahogy a modul nyitott kérdése javasolta.
- A `redflagWhen` ma csak ÉS-kapcsolatot ismer. Amíg egy tételnél sem kell VAGY,
  addig ez nem hiány, hanem szándékos egyszerűség.
