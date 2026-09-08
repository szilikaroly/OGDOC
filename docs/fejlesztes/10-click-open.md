# 10 — Click-open, betegtájékoztató, javaslatok, beteg-oldali felvétel

> **A cél egyetlen mondatban: a strukturált bevitel legyen gyorsabb a gépelésnél.**
> Ez a fejezet a mechanizmust írja le, ami ezt teljesíti — és a három dolgot, ami ebből
> következik.

---

## 1. Miért ez a projekt legkockázatosabb pontja

A `docs/11-strukturalt-adat.md` a **miért**-et mondja el: a szabad szöveg nem kereshető,
nem exportálható, nem kódolható, nem tölt fel semmit. De van egy ellenérv, amit komolyan
kell venni:

> **Ha a kódolt bevitel lassabb a gépelésnél, a klinikus kikerüli — és akkor a rendszer
> rosszabb adatot termel, mint egy szabad szöveges.**

Egy húsz tételes fizikális státusz húsz legördülő menüvel *lassabb*, mint egy mondat.
Ezért nem elég strukturálni; **kevesebb kattintást kell kérni, mint amennyi gépelést
megspórolunk.**

---

## 2. A megoldás: click-open — a normálisat nem írjuk le

Minden lelet **alapból csukva** van, és **öt állapota** lehet:

```
   ┌─ eltérés nélkül ───── CSUKVA. Megvizsgáltuk, rendben van.
   │
   ├─ korlátozott ──────── A LÁNC NYÍLIK. Megvizsgáltuk, de nem teljesen —
   │                       amit láttunk, azt rögzíteni lehet.
lelet ─┼─ nem vizsgálható ── CSUKVA, de RÖGZÜL. Meg sem lehetett vizsgálni.
   │
   ├─ eltérés ──────────── A LÁNC NYÍLIK. Kóros lelet, részletezendő.
   │
   └─ kimaradt ─────────── Nincs rögzítve. NEM vizsgáltuk meg.
```

**Egy húsz tételes státusz így két kattintás, nem húsz mező** — feltéve, hogy két lelet
kóros, ami a tipikus eset.

### 2.1 Az öt állapot, és miért mind az öt kell

| Állapot | Mit jelent | Miért nem vonható össze |
|---|---|---|
| `normal` | megvizsgáltuk, eltérés nincs | |
| `limited` | **megvizsgáltuk, de nem teljes értékűen** | magas BMI mellett a méhmagasság-tapintás rendszeresen ilyen; a helyes válasz nem a „normális", és a rendszer ultrahangot javasol helyette |
| `impossible` | **meg sem lehetett vizsgálni** | ez nem részleges eredmény, hanem semmilyen — más teendőt generál |
| `abnormal` | kóros, részletezendő | |
| `omitted` | **nem vizsgáltuk** — nincs rögzítve | |

> **A `limited` és az `impossible` különbsége az, hogy az elsőnél láttunk valamit.** Ezért a
> `limited` **megnyitja** a részletező láncot, az `impossible` nem. Ez nem technikai
> részlet: egy korlátozottan látott, de kóros lelet elveszne, ha a rendszer nem engedné
> rögzíteni.

> **Az `omitted` a legfontosabb, és a legkönnyebben összemosható.** Látszólag azonos a
> normálissal, de a rendszer megkülönbözteti:
>
> ```ts
> effectiveFinding(reg, state, id)
>   → { state: "omitted", explicit: false }   // NEM vizsgáltuk
>   → { state: "normal",  explicit: true }    // vizsgáltuk, normális
> ```
>
> Az `omitted` mezőről a rendszer **semmit nem állít**: nem kerül a betegtájékoztatóba és
> nem generál javaslatot. Ez betegbiztonsági különbség, nem szemantikai finomság.

### 2.1b A részletezés LÁNC, nem lista

A kóros lelet nem egy mezőcsomagot nyit ki, hanem **lépésenként kérdez tovább** — ahogy a
klinikus is gondolkodik:

```
Szívhallgatózás: eltérés
   └─▶ Lokalizáció:  aorta felett
          └─▶ Jelleg:  zörej
                 ├─▶ Mérték:  4/6
                 └─▶ Típus:   szisztolés
```

Két mechanizmus adja:

- **`finding.cascade`** — a lelet láncának sorrendje. Minden lépés akkor jelenik meg, ha az
  előtte lévő ki van töltve.
- **`valueSet[].opens`** — egy konkrét válasz következménye. A **zörej** mértéket és típust
  kér; az **extra hang** nem. **A kódlista dönti el, mit kérdez tovább a rendszer — nem a
  felület.**

Ezért egy új leletcsoport felvétele — akár elágazó lánccal — nem igényel kódot.

### 2.2 Hogyan van a regiszterben

```json
{
  "id": "status.cardio.auscultation",
  "datatype": "coded",
  "valueSet": [
    { "code": "norm", "label_hu": "Eltérés nélkül" },
    { "code": "abn",  "label_hu": "Eltérés" },
    { "code": "na",   "label_hu": "Nem vizsgálható", "flags": ["notApplicable"] }
  ],
  "valueSet": [
    { "code": "norm", "label_hu": "Eltérés nélkül" },
    { "code": "abn",  "label_hu": "Eltérés" },
    { "code": "lim",  "label_hu": "Korlátozott vizsgálat" },
    { "code": "imp",  "label_hu": "Nem vizsgálható", "flags": ["notApplicable"] }
  ],
  "finding": {
    "normal": "norm", "limited": "lim", "impossible": "imp",
    "cascade": ["status.cardio.site", "status.cardio.character"]
  }
}
```

A lánc elágazása a kódlistában van, nem a kódban:

```json
{
  "id": "status.cardio.character",
  "valueSet": [
    { "code": "murmur", "label_hu": "Zörej",
      "opens": ["status.cardio.murmur.grade", "status.cardio.murmur.timing"] },
    { "code": "extra",  "label_hu": "Extra hang (S3, S4)" }
  ]
}
```

A felület **nem tudja, mit jelent a „szívhallgatózás"** — csak azt, hogy ez egy lelet,
melyik kódja a normális, és mely mezőket nyitja meg. Új leletcsoport felvételéhez nem kell
kódot írni.

### 2.3 Build-ellenőrzés

| Ellenőrzés | Súly |
|---|---|
| a `finding.normal`, `limited`, `impossible` benne van a kódkészletben | hiba |
| a `finding.cascade` létező mezőkre mutat | hiba |
| a `valueSet[].opens` létező mezőkre mutat | hiba |
| a click-open leletnek van betegnek szóló szövege | figyelmeztetés |
| a `recommends` leletmező nélkül `when` feltételt használ | hiba |

### 2.4 Mérőszám

```ts
interactionCount(reg, state)
  → { touched: 3, total: 56, hiddenByDefault: 4 }
```

A `touched` **csak az emberi bevitelt** számolja — a motor által írt levezetett értékek nem
erőfeszítés, különben a mérőszám magát mérné. Ez a szám az, amit a használhatósági
értékelés (IEC 62366-1) figyel: **ha nem csökken, a minta nem működik.**

---

## 3. A betegnek szóló szöveg — értéktől függetlenül

Minden rögzített lelet generál egy beteg-olvasható mondatot, **a normális is**:

| Állapot | Példa |
|---|---|
| `normal` | „A szívhangok vizsgálata eltérést nem mutatott." |
| `abnormal` | „A szívhangok vizsgálatakor eltérést találtunk, amit további vizsgálat tisztáz." |
| `limited` | „A szívhangok vizsgálata csak korlátozottan volt elvégezhető; a leletet a következő viziten kiegészítjük." |
| `impossible` | „A szívhangok vizsgálata a körülmények miatt nem volt elvégezhető." |

**A normális lelet is információ a betegnek.** Az, hogy megvizsgálták és rendben találták,
többet mond, mint a csend — és csökkenti a felesleges aggodalmat.

Két szabály:

1. **A kimaradt mezőről nem állítunk semmit.** Üres űrlapból nem születik betegtájékoztató.
2. **A szöveg generált, nem gépelt.** A klinikus nem írja, tehát nem tud eltérni attól,
   ami a rekordban van.

---

## 4. A klinikusnak szóló javaslatok

Ugyanabból a leletből, a másik irányba:

```json
"recommends": [
  { "when": "abnormal", "kind": "referral", "urgency": "soon",
    "what": { "hu": "Kardiológiai konzílium — újonnan észlelt zörej terhességben" } },
  { "when": "abnormal", "kind": "imaging", "urgency": "soon",
    "what": { "hu": "Szív-ultrahang (echocardiographia)" } },
  { "when": "notAssessable", "kind": "followup",
    "what": { "hu": "A hallgatózás megismétlése a következő viziten" } }
]
```

| `kind` | Mit javasol |
|---|---|
| `lab` | laborvizsgálat |
| `imaging` | képalkotó diagnosztika |
| `referral` | beutalás, konzílium |
| `followup` | kontroll, ismétlés |
| `diet` | táplálkozási tanácsadás |
| `procedure` | beavatkozás |
| `advice` | tájékoztatás |

Három szabály:

- **Minden javaslat mellett ott van, melyik mező váltotta ki.** Egy indoklás nélküli
  javaslatot a klinikus vagy vakon elfogad, vagy vakon elutasít — mindkettő rossz.
- **A `limited` és az `impossible` MÁS javaslatot ad**: az elsőnél kiegészíteni kell a
  leletet, a másodiknál megismételni a vizsgálatot — vagy más módszerrel pótolni. Magas BMI
  mellett a korlátozott méhmagasság-tapintás ultrahangot javasol helyette.
- **A kimaradtból nem következtetünk.** Üres űrlapból nincs javaslat.

A javaslatok sürgősség szerint rendeződnek (`urgent` → `soon` → `routine`), és a `13`
modul teendőlistájába kerülnek, ahol elfogadhatók vagy elutasíthatók.

---

## 5. Az anamnézis a betegfelvétel része — a beteg oldalán

**Az anamnézist a beteg tölti ki**, a betegfelvételkor, a beteg-portálon vagy kioszkon.
Ez a leggyorsabb strukturált bevitel: a klinikus ideje nem megy el rá, és a beteg
kényelmesen, sietség nélkül válaszol.

```
beteg-portál / kioszk                  klinikus
        │                                  │
        │  provenance: "patient"           │
        │  (a precedencia LEGALJA)         │
        ▼                                  │
   ┌──────────────┐   megerősítésre vár    │
   │  rögzül      │ ──────────────────────▶│  „Megerősítem"
   └──────────────┘                        │        │
                                           │        ▼
                                    provenance: "clinician"
                                    ettől kezdve döntés épülhet rá
```

### 5.1 A három szabály

1. **A beteg bejegyzése a precedencia legalján van.** Egy klinikusi korrekció mindig
   felülírja — akkor is, ha korábbi. Ez nem lekicsinylés: a klinikus felelőssége más.
2. **Megerősítés nélkül döntés nem épülhet rá.** A carboprost hard-stop kapuját a beteg
   saját bejelölése **önmagában nem húzhatja meg** — a kapu klinikusi megerősítést kíván.
3. **A megerősítési sor sürgősség szerint rendezett**, és megmutatja, **mire hatna** a
   megerősítés:

```
hx.sys.asthma = "pos"
   megerősítés után hat: rule.carboprost.blocked
```

Ez a hatásvizsgálat a levezetési gráfból jön — nem kézzel karbantartott lista.

### 5.2 Amit ez megold

| Probléma | Megoldás |
|---|---|
| Az anamnézis felvétele a vizit idejének nagy részét elviszi | a beteg előre kitölti |
| A beteg sietségben pontatlanul válaszol | otthon, nyugodtan tölti ki |
| A beteg által megadott adatra döntés épül ellenőrzés nélkül | **megerősítési kapu** |
| A klinikus nem tudja, mit érdemes átnéznie | a sor a hatás szerint rendez |

---

## 6. Amit ez a négy elem együtt ad

```
   beteg tölti ki előre  ──▶  klinikus megerősíti  ──▶  csak a KÓROSAT nyitja ki
                                                              │
                                        ┌─────────────────────┴──────────────────┐
                                        ▼                                        ▼
                            betegnek szóló szöveg                    klinikusi javaslatok
                            (a normálisról is)                       (beutalás, labor,
                                                                      kontroll, diéta)
```

**Egyik lépésnél sem gépel senki szabad szöveget** — és a klinikus ideje arra megy el, ami
kóros. Ez az, amitől a strukturált bevitel gyorsabb lehet a gépelésnél; nem a mezők
számától, hanem attól, hogy **mennyit nem kell megérinteni**.

---

## 7. Amit őszintén jelzek

**A mechanizmus megvan, a tartalom nincs.** Három leletcsoport van kidolgozva mintaként
(szívhallgatózás, oedema, méhmagasság). A ~4000 változós katalógusban több száz leletmezőt
kell így felépíteni — kódlistával, betegszöveggel és javaslatokkal. Ez klinikai szerkesztői
munka, nem fejlesztés, és a `25` modul belső szerkesztőjén keresztül kell mennie.

**A `limited` és az `impossible` könnyen elkopik.** Ha a klinikus úgy éli meg, hogy ez egy
extra kattintás, alapból normálisra fogja állítani — és akkor a rendszer azt fogja hinni,
hogy egy magas BMI-jű beteg méhmagassága rendben van, holott meg sem lehetett tapintani.
Ezt **mérni kell**: ha ezek aránya tartósan nulla egy olyan tételnél, ahol klinikailag
várható lenne, a minta nem működik.

**A betegnek szóló szöveg jogi következménnyel jár.** Ami a beteg kezébe kerül, az
tájékoztatás. A megfogalmazásokat klinikusnak kell jóváhagynia, és a `25` modul
verziózásán kell átmennie — a szöveg nem fejlesztői döntés.

**A megerősítési kapu csak akkor véd, ha nem válik rituálévá.** Ha a klinikus tömegesen
erősít meg mindent ránézés nélkül, a `patient` eredet papíron marad meg, a gyakorlatban
nem. A `08-ai-csatolasi-pontok.md` ugyanezt a kockázatot írja le az AI-javaslatoknál, és
ugyanaz a mérőszám fogja meg: **a megerősítés utáni javítás aránya.**
