# Modul 20 — Statisztika, lekérdezés és tudomány

| | |
|---|---|
| **Cél** | Kattintással összeállítható lekérdezések a teljes adatállományon, szabályokkal és szűrőkkel; leíró statisztika és kutatási export |
| **Forrás** | ÚJ — de a **változóregiszter teszi lehetővé** |
| **Becsült változó** | ~40 saját (a lekérdezőmotor konfigurációja) + hozzáférés mind a ~2200-hoz |
| **Fázis** | 3 (alap) → 5 (teljes) |
| **Függ** | a regiszter (Fázis 0), és minden modul, ami adatot termel |

## Mi van már meg

Az IntuiCare `paciens_360_saved_views` táblája mentett nézeteket tárol, a
`/admin/portal-analitika` és a munkaidő-oldal aggregátum-nézetei (`v_havi_ledger`,
`v_heti_munkaido`, `v_overtime_ledger_yearly`) mutatják a mintát. A SOS24 oldaláról a
`lab-pricing-audit` anomália-detektálása és a `bulk_import_logs` a tömeges műveletek naplózását.
**A lekérdezőmotor maga új.**

---

## 1. Miért ez a modul a kutatási cél kulcsa

A rendszer kutatási célra készül (`00-pozicionalas.md`). Egy kutatási eszköz értéke azon áll
vagy bukik, hogy **meg lehet-e kérdezni tőle valamit**. Enélkül az OGDOC csak egy szép
dokumentációs rendszer, amiből az adat kinyeréséhez SQL-t kell írni — vagyis a klinikus nem
fér hozzá a saját adatához.

Ez a modul **azért lehetséges egyáltalán**, mert a változóregiszter minden mezőről tudja:

- a típusát (`quantity`, `coded`, `tristate`, `date`, …)
- az egységét és a tartományát
- a kódolt értékkészletét
- hogy számított-e, és ha igen, miből
- hogy tartalmaz-e azonosítót (`phi`)
- hogy mikor érvényes (`validity`)

Egy lekérdezőfelület enélkül vagy szabad SQL, vagy kézzel karbantartott mezőlista. A
regiszterrel **magától adódik**, és minden új változó automatikusan lekérdezhetővé válik.

---

## 2. On-click mezőkijelölés

A központi interakció: **bármely mező bármely felületen kattintással lekérdezésbe emelhető.**

```
Anamnézis-űrlap                  Lekérdezésszerkesztő
┌──────────────────────┐         ┌─────────────────────────────────┐
│ Preeclampsia előzmény│ ⊕ ────▶ │ hx.repro.pe = igen              │
│  ○ igen ● nem ○ n.t. │         │ ÉS                              │
├──────────────────────┤         │ anthro.bmi ≥ 30                 │
│ BMI          [ 31,2 ]│ ⊕ ────▶ │ ÉS                              │
└──────────────────────┘         │ ctx.ga  22 … 34 hét             │
                                 └─────────────────────────────────┘
```

A ⊕ ikon minden mező mellett megjelenik lekérdező módban. A kattintás a mező **regiszter-
definícióját** viszi át, nem a konkrét értéket — így a szerkesztő tudja, milyen operátorokat
kínáljon fel.

**Operátor-felkínálás típus szerint:**

| Típus | Felkínált operátorok |
|---|---|
| `quantity` | `=` `≠` `>` `<` `≥` `≤` `from…to` `üres` `nem üres` |
| `coded`, `coded-multi` | `=` `≠` `bármelyik` `mind` `egyik sem` `üres` |
| `tristate` | `igen` `nem` `nem tudom` `nem üres` — **a „nem tudom" önálló érték** |
| `date`, `datetime` | `=` `előtte` `utána` `from…to` `az elmúlt N nap` |
| `bool` | `igaz` `hamis` `üres` |
| `text` | `tartalmazza` `kezdődik` `üres` — teljes szöveges keresés nélkül |

---

## 3. Szabályok és szűrők

### 3.1 Logikai összekapcsolás

Tetszőleges mélységű fa, nem lapos lista:

```
ÉS
├── VAGY
│   ├── hx.repro.pe = igen
│   └── hx.family.pe = igen
├── anthro.bmi ≥ 30
└── NEM
    └── hx.sys.dm1 = igen
```

Az `ÉS` / `VAGY` / `NEM` csomópontok kattintással átválthatók és átrendezhetők. A felület
mindig mutatja, **hány esetre illeszkedik** az aktuális állapot — azonnali visszajelzéssel.

### 3.2 Feltételes kifejezés (IF / ELSE)

Nem szűrő, hanem **származtatott oszlop**: új változót képez a meglévőkből, csak a lekérdezés
erejéig.

```
HA   ctx.ga < 37       →  "koraszülés"
KÜLÖNBEN HA ctx.ga ≥ 42 →  "túlhordás"
KÜLÖNBEN                →  "időre"
```

Ez az, amivel csoportosítani lehet olyasmi szerint, ami nincs külön mezőként rögzítve. A
származtatott oszlop a lekérdezéssel együtt mentődik, és **a definíciója látszik** a
kimenetben — nem egy megnevezetlen kategória.

### 3.3 Idősoros szűrők

A `series` alakú változókra (vérnyomás, cervix, biometria) külön operátorok kellenek, mert
egy betegnek sok értéke van:

| Operátor | Jelentés |
|---|---|
| `valaha` | bármely mérés teljesíti |
| `mindig` | minden mérés teljesíti |
| `utolsó` | a legutolsó mérés teljesíti |
| `max` / `min` / `átlag` | az aggregátum teljesíti |
| `n alkalommal` | legalább N mérés teljesíti |
| `trend` | emelkedik / csökken / stabil |

Példa: *„akinek **valaha** volt RR ≥ 160/110, és az **utolsó** thrombocyta < 100"*.

---

## 4. Kohorsz, mentés, újrafuttatás

| Elem | Mit ad |
|---|---|
| **Kohorsz** | a lekérdezés eredménye mint névvel ellátott halmaz, amire tovább lehet szűrni |
| **Mentett lekérdezés** | a `paciens_360_saved_views` mintájára, megosztható a csapaton belül |
| **Verziózás** | a lekérdezés mellé mentődik a **regiszter-verzió** és a **futtatás dátuma** |
| **Újrafuttatás** | ugyanaz a lekérdezés később — és a rendszer jelzi, ha a regiszter azóta változott |

A verziózás nem formalitás: ha egy változó definíciója vagy egy kódlista megváltozott, egy
fél évvel korábbi lekérdezés eredménye **nem összehasonlítható** a mostanival. A rendszer ezt
kimondja, nem hallgatja el.

---

## 5. Statisztika

### 5.1 Amit ad

| Szint | Tartalom |
|---|---|
| **Leíró** | n, hiányzó adat aránya, átlag ± SD, medián (IQR), tartomány, gyakoriság és arány |
| **Csoportonként** | ugyanez a `HA/KÜLÖNBEN` szerinti bontásban |
| **Vizualizáció** | eloszlás, doboz-ábra, idősor, kereszttábla |
| **Kimenetel-mutatók** | a `18` modul definíciói szerint (Robson, koraszülési arány, PPH-arány…) |
| **Export** | CSV, ICHOM-formátum, REDCap, R/Python-barát long format |

### 5.2 Amit szándékosan NEM ad

**Nincs beépített hipotézisteszt egy gombra.** Se t-próba, se χ², se logisztikus regresszió.

Ez tudatos döntés, és a modul legfontosabb tervezési állítása. Egy olyan felület, ahol
kattintással lehet csoportokat képezni és p-értéket kérni, **iparszerű p-hackinget termel**:
a felhasználó addig variálja a szűrőket, amíg valami szignifikáns lesz, és a többszörös
tesztelés korrekciója sosem történik meg.

Amit helyette ad: **tiszta, dokumentált adatexportot**, amit statisztikus vagy a kutató a
saját eszközében elemez, előre rögzített elemzési terv szerint.

> Ha később mégis kell beépített teszt, annak feltétele: **előre rögzített elemzési terv**
> (ld. lentebb), és a többszörös tesztelés automatikus nyilvántartása.

---

## 6. Tudományos integritás — a modul védőkorlátai

Ez a rész teszi a modult „tudomány" modullá, nem csak lekérdezővé.

### 6.1 Elemzési terv rögzítése

Kutatási lekérdezés indítható **feltáró** vagy **hipotézisvizsgáló** módban:

| Mód | Mit jelent |
|---|---|
| **Feltáró** | szabad, korlátlan; a kimeneten végig ott a jelzés: *„feltáró elemzés — a talált összefüggések hipotézist generálnak, nem igazolnak"* |
| **Hipotézisvizsgáló** | a lekérdezést és a kimeneti mutatót **előre rögzíteni kell**, időbélyeggel; utólagos módosítás új verziót hoz létre, és mindkettő látszik |

A kettő nem keverhető. A hipotézisvizsgáló módban rögzített terv a `study_links` /
kutatási protokoll rekordhoz kötődik (`00-pozicionalas.md`).

### 6.2 Hiányzó adat mindig látszik

Minden statisztikai kimenet mellett kötelezően megjelenik:

- az `n` és a **hiányzó adatok aránya változónként**
- hány esetben volt az érték `nem tudom` (a `tristate` külön kategóriaként)
- hány esetben volt az érték `prefilled` vagy `imported` (nem közvetlenül mért)
- hány score adott `insufficient` eredményt

Egy 62%-ban kitöltött változóból számolt átlag nem átlag. A rendszer ezt nem engedi
kontextus nélkül megjeleníteni.

### 6.3 Kis elemszám és újraazonosítás

**k-anonimitási küszöb**: ha egy cella vagy csoport elemszáma a küszöb alatt van
(alapértelmezés: 5), a rendszer **nem mutatja meg** az értéket, hanem `< 5`-öt ír.

Ez nem óvatoskodás: egy ritka diagnózis + irányítószám + életkor kombináció egyetlen embert
azonosít. A kutatói szerep de-identifikált adatot lát (`21` modul munkáltatói szegregációjának
mintájára), és a `phi: true` változók a lekérdezőben **nem is jelennek meg**.

### 6.4 Reprodukálhatóság

Minden exporthoz automatikusan generálódik egy kísérőlap:

```
Lekérdezés:      kohorsz-2026-09-preeclampsia  (v3)
Futtatva:        2026-09-01 14:22
Regiszter-verzió: 2026-08-28
Illeszkedő eset: 214  (a teljes állomány 8,1%-a)
Mód:             feltáró
Szűrők:          [a teljes fa, olvasható alakban]
Származtatott:   koraszülés = HA ctx.ga < 37 …
Hiányzó adat:    lab.ast 31%, lab.plgf 68%, hx.family.pe 12%
Kizárva:         phi-jelölt változók (3), k < 5 cellák (7)
```

Enélkül egy fél év múlva senki — a szerző sem — nem tudja megmondani, mit is nézett.

---

## 7. Jogosultság

| Szerep | Mit lát a lekérdezőben |
|---|---|
| Kutató | de-identifikált adat, `phi` változók nélkül, k-anonimitási küszöbbel |
| Szakorvos | a saját ellátási körén belüli betegek, azonosítóval |
| Vezető | intézményi aggregátum, egyedi eset nélkül |
| Tenant admin | jogosultság-kiosztás, de **nem automatikus adathozzáférés** |

A lekérdezés futtatása **auditált**: ki, mikor, milyen szűrővel, hány esetre. Az `admin_audit_log`
mintájára — egy kutatási rendszerben a lekérdezés maga is érzékeny művelet.

---

## 8. Keresztfeltöltés

**⇦ Mi tölti fel**: minden modul, ami adatot termel — és a **regiszter**, ami a mezőket és
az operátorokat adja.

**⇨ Mit tölt fel**: `18` minőségbiztosítás (a mutatók lekérdezésekként definiálódnak) ·
kutatási export · `13` ellátás tervezés (kohorsz-alapú behívás, pl. „minden 2. trimeszterben
lévő, korai OGTT-re esedékes beteg").

---

## 9. Elfogadási kritérium

1. Egy klinikus **SQL nélkül** összeállítja: *„korábbi preeclampsiás VAGY családi
   preeclampsia-előzményű, BMI ≥ 30, jelenleg 22–34. hét között"*, és megkapja az esetszámot.
2. A találatokra leíró statisztika készül, és **minden mutató mellett ott a hiányzó adatok
   aránya**.
3. Az export kísérőlapja tartalmazza a lekérdezés teljes definícióját és a regiszter-verziót,
   és **ugyanaz a lekérdezés újrafuttatva ugyanazt adja** — vagy megmondja, miért nem.
4. `phi` változó nem választható ki, és 5 alatti cella nem jelenik meg.

---

## 10. Nyitott kérdések

1. **Hol fut a lekérdezés?** Nagy állományon a kliensoldali szűrés nem működik. A szűrőfa
   Postgres-lekérdezéssé fordítása szerveroldalon kell hogy történjen, paraméterezve —
   **SQL-injekció ellen a fa sosem string-konkatenációval fordul.**
2. **Kell-e beépített hipotézisteszt?** A javaslat: nem (ld. 5.2). Ha mégis, az a Fázis 5
   kérdése, és feltétele az előre rögzített elemzési terv kikényszerítése.
3. **A k-anonimitási küszöb értéke** (alapértelmezés 5) intézményi és etikai bizottsági
   döntés, nem fejlesztői.
4. **Idősoros operátorok teljesítménye.** A „valaha / mindig / trend" típusú szűrők a
   `clinical_observations` táblán költségesek. Anyagiasított nézet vagy előszámított
   aggregátum kellhet — ez a Fázis 5 optimalizálási kérdése, nem a Fázis 3-é.
