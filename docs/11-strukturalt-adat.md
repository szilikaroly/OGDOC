# 11 — Strukturált adat: a szabad szöveg minimalizálása

> **Cél:** a lehető legkevesebb szabad szöveges mező. Ez nem esztétikai kérdés — a szabad
> szöveg **nem kereshető, nem exportálható, nem kódolható, nem tölt fel semmit, és nem
> elemezhető**. Egy kutatási rendszerben a szabad szöveg elveszett adat.

---

## 1. Miért ez a rendszer egyik alapelve

A `20` modul lekérdezője, a `17` kódolás, a `16` ICHOM-export, a `18` minőségmutatók és a
`23` genetikai visszakötés **mind strukturált adatot igényelnek**. Egy „egyéb megjegyzés"
mezőbe írt lelet ezek egyikében sem jelenik meg.

Ugyanakkor **a szabad szöveg teljes tiltása is hiba**: a klinikus így nem tud rögzíteni
olyat, ami nem fér a sémába, és ez rosszabb, mint a strukturálatlan adat — mert az
információ elveszik, nem csak nehezen kereshető.

**A megoldás nem tiltás, hanem helyettesítés.**

---

## 2. Kilenc eszköz a szabad szöveg helyett

| # | Eszköz | Mikor | Példa |
|---|---|---|---|
| 1 | **Kódolt értékkészlet** | ha véges és ismert a lehetőségek köre | fluor jellege, magzati helyzet |
| 2 | **Kereshető szótár szinonimákkal** | ha nagy a készlet, de kódolható | `01` panaszszótár (~400 tétel), BNO, ATC, OENO |
| 3 | **Strukturált sablon** | ha összetett, de ismételhető a szerkezet | műtéti leírás, UH-lelet, EKG |
| 4 | **Mérés helyett leírás** | ha van szám | „nagy myoma" → `myoma.diameter_mm` |
| 5 | **Háromállású válasz** | ha az ismerethiány önálló információ | igen / nem / **nem tudom** (a v16 mind a 110 kérdéssorán) |
| 6 | **DICOM SR és eszköz-import** | ha a gép már strukturáltan tudja | UH-biometria, EKG-hullámforma, POCT-eredmény |
| 7 | **Diktálás → strukturálás** | ha gyorsan kell, de kódolva | beszédfelismerés, majd **javaslat kódolt tételre**, emberi megerősítéssel |
| 8 | **Click-open lelet** | ha a normális az esetek többsége | a lelet alapból csukva; **csak a kóros nyílik ki** — ld. [`fejlesztes/10-click-open.md`](fejlesztes/10-click-open.md) |
| 9 | **Beteg-oldali felvétel** | anamnézis, kérdőív | a beteg tölti ki előre, a klinikus megerősíti |

---

## 3. Ahol a szabad szöveg indokolt — és ott is korlátozva

Öt eset, ahol megmarad, de mindig **strukturált mező mellett**, nem helyette:

| Eset | Mező | Korlát |
|---|---|---|
| A beteg saját szavai | `compl.verbatim` | idézet, **szerkesztetlen** — ez az értéke |
| Klinikai indoklás | `*.reason` | kötelező, ha a rendszer figyelmeztetését felülbírálják |
| Narratív kiegészítés | `*.narrative` | a strukturált mezők **mellé**, nem helyettük |
| Konzíliumi kérdés | `13` modul | |
| Nemmegfelelőség leírása | `bb_nonconformity` | + kódolt osztályozás |

**A `*.reason` mezők kivételesek**: pont az a lényegük, hogy a klinikus a saját szavaival
indokolja, miért tér el. Ezt nem szabad kódolni — az indoklás minősége a lényeg.

---

## 4. Az „egyéb" csapdája és a megoldása

Minden kódlistában van „egyéb". Ha ez szabad szöveges, **az egész kódolás értelmét veszti**:
a felhasználók a nehezen megtalálható tételek helyett is ezt választják.

**A megoldás — az „egyéb" tanulási csatorna:**

```
felhasználó „egyéb"-et választ és beír valamit
   └─▶ a bejegyzés egy FELÜLVIZSGÁLATI SORBA kerül (25. modul)
          ├─ már létező tétel más néven?  → szinonima felvétele a szótárba
          ├─ tényleg hiányzik?            → új kódlista-tétel, verziózva
          └─ egyedi eset?                 → marad szabad szövegként, jelölve
```

A `25` modul belső szerkesztője ezt kezeli, **fejlesztő nélkül**. A rendszer így
használat közben javul: minden „egyéb" vagy új szinonimát, vagy új tételt eredményez.

> **Mérőszám:** az „egyéb" aránya kódlistánként. Ha egy lista 15% fölött van, a lista rossz
> — nem a felhasználók. Ez a `18` minőségbiztosítási modul egyik mutatója.

---

## 5. Mérés: a szabad szöveg aránya mint minőségi mutató

| Mutató | Mit mér |
|---|---|
| `qa.freetext.ratio` | a kitöltött mezők közül hány szabad szöveges |
| `qa.freetext.byModule` | modulonként — hol szorul a séma |
| `qa.other.ratio` | az „egyéb" választás aránya kódlistánként |
| `qa.narrative.length` | a narratív mezők átlagos hossza — ha nő, a struktúra nem elég |

**Cél**: a klinikai adatmezők **90%-a** kódolt vagy mért érték legyen. Ez elérhető szám —
a v16 anamnézise már most közel van hozzá, mert 110 kérdéssora háromállású kódolt válasz.

---

## 6. A DICOM-csatorna mint strukturáló eszköz

A `08-interoperabilitas.md` 3.4 pontja szerint ugyanaz a DICOM-csatorna viszi a képet, a
strukturált mérést (SR) és a dokumentumot. **Ez a szabad szöveg elleni legerősebb eszköz**,
mert a mérés a készülékről közvetlenül a modulba jut:

| Ma (tipikus) | DICOM SR-rel |
|---|---|
| a technikus mér, felírja, a leletbe gépeli | a mérés SR-ben érkezik, a mezőbe kerül |
| gépelési hiba lehetséges | nincs kézi átvitel |
| a lelet szabad szöveg | a mérés strukturált, a lelet narratívája mellé |
| a normogram-számítás kézi | automatikus percentilis és z-érték |

Ugyanez a POCT1-A2 csatornán az ágy melletti eszközökre, és a LIS2-A2-n a laborra.

---

## 7. Amit ez a felülettől követel

Ha kevés a szabad szöveg, a strukturált bevitelnek **gyorsabbnak kell lennie a gépelésnél** —
különben a felhasználó kikerüli.

| Követelmény | Miért |
|---|---|
| Egy mező = egy döntés, billentyűzetről is | a kattintgatás lassabb, mint a gépelés |
| Gépelés közbeni szűrés szinonimákkal | a `01` szótár így használható |
| **Okos alapértelmezés a regiszterből** | a `prefill` a leggyorsabb bevitel: elfogadás egy kattintás |
| Sablonok gyakori esetekre | „normál szülészeti státusz" egy gombbal, majd az eltérések |
| Diktálás ott, ahol tényleg gyorsabb | de kódolt tételre javasolva |

> **Ez a modul legkockázatosabb pontja.** Ha a strukturált bevitel lassabb, a klinikus
> kikerüli — és akkor a rendszer rosszabb adatot termel, mint egy szabad szöveges. A
> `IEC 62366-1` használhatósági értékelés (`megfeleles/09-mdr.md` 4.3) ezt méri.

---

## 8. Nyitott kérdés

**Hol a határ?** Van klinikai tartalom, amit a strukturálás **szegényít** — egy összetett
konzíliumi mérlegelés vagy egy szokatlan eset leírása. Javaslat: ahol a strukturálás
információt veszítene, ott a narratíva marad, a strukturált mezők **mellett** — és ezt
modulonként a klinikai lektorálás dönti el, nem a fejlesztő.
