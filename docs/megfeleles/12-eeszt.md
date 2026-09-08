# 12 — EESZT-megfelelés

> **Döntés (K11): a rendszer ellátási dokumentációt keletkeztet, és megtervezzük az
> EESZT-megfelelést.**
>
> **Döntés (K20 + K26): tizenhárom dokumentumtípus** minősül ellátási dokumentációnak.
> A nyolc eredeti mellé bekerült az **epikrízis** és a **partogram** (K26 — tehát nem belső
> munkadokumentumok), valamint a három műtéti dokumentum: **műtéti terv**,
> **aneszteziológiai terv** és **műtéti záró**.

---

## 1. Mit jelent ez a döntés

Amíg a rendszer csak kutatási és belső minőségfejlesztési eszköz, az EESZT-kapcsolat
opcionális. Amint **ellátási dokumentációt keletkeztet** — vagyis olyan feljegyzést, ami a
beteg egészségügyi dokumentációjának része —, három dolog egyszerre lép életbe:

| Következmény | Miért |
|---|---|
| **Beküldési kötelezettség** | az egészségügyi adatkezelési törvény és az EESZT-rendelet szerint a csatlakozott szolgáltatónak az ellátási eseményt fel kell töltenie |
| **Megőrzési kötelezettség** | az ellátási dokumentációra jogszabályi megőrzési idő vonatkozik, ami hosszabb, mint amit egy kutatási rendszer magától vállalna |
| **Az MDR-határ élesebbé válik** | ha a rendszer kimenete a betegdokumentáció része, a döntéstámogató komponens eszközjellege nehezebben vitatható (ld. [`09-mdr.md`](09-mdr.md)) |

> A jogszabályhelyek — az 1997. évi XLVII. tv. vonatkozó §-ai és az EESZT működését
> szabályozó végrehajtási rendelet száma — **`[ellenőrizendő]`**, jogásznak kell
> megerősítenie. Ez a fejezet a technikai és folyamatbeli tervet adja, nem jogi véleményt.

---

## 1b. A nyolc dokumentumtípus (K20)

**Ezek nem prózában élnek, hanem regiszterként** — `registry/documents/core.json`, ugyanazon
az elven, mint a változók és a kalkulátorok. A kötelező tartalom regiszterbeli változókra
hivatkozik, ezért **a build elszáll, ha egy dokumentum nem létező mezőt vár** — a hiány nem
a betegágynál derül ki.

| Dokumentum | Modul | EESZT | Beküldés | Beteg példánya |
|---|---|---|---|:--:|
| **Zárójelentés** | `14` | egészségügyi dokumentum | aláíráskor | ✔ |
| **Ambuláns lap** | `14` | egészségügyi dokumentum | lezáráskor | ✔ |
| **Gyógyszerfelírás** | `06` | **eRecept** | kiállításkor | — |
| **Vizsgálati lap** | `05` | egészségügyi dokumentum | aláíráskor | ✔ |
| **Terhesgondozási lap** | `13` | egészségügyi dokumentum | lezáráskor | ✔ |
| **Terhességi kockázatértékelés** | `13` | egészségügyi dokumentum | aláíráskor | ✔ |
| **Beutaló** | `13` | **eBeutaló** | kiállításkor | ✔ |
| **Diétás vagy szakorvosi javaslat** | `07` | egészségügyi dokumentum | kiállításkor | ✔ |
| **Epikrízis** *(K26)* | `09` | egészségügyi dokumentum | aláíráskor | — |
| **Partogram** *(K26)* | `10` | egészségügyi dokumentum | **lezáráskor** | ✔ |
| **Műtéti terv** | `11` | egészségügyi dokumentum | aláíráskor | ✔ |
| **Aneszteziológiai terv** | `11` | egészségügyi dokumentum | aláíráskor | — |
| **Műtéti záró (műtéti leírás)** | `11` | egészségügyi dokumentum | aláíráskor | ✔ |

### 1b.0 Amit a K26 megváltoztat

Az epikrízis és a partogram korábban belső munkadokumentumnak látszott. A döntéssel
**ellátási dokumentáció**, és ennek két érdemi következménye van:

- **Az epikrízis narratívája jogilag is a dokumentáció része.** Eddig is szabály volt, hogy
  nem tartalmazhat olyan állítást, ami nincs a rögzített adatban — most ez nem belső
  minőségi elvárás, hanem dokumentációs követelmény. (Nincs nyelvi modell a folyamatban:
  determinisztikus sablongenerálás.)
- **A partogram idősor, és a beküldés a lezáráskor történik**, nem bejegyzésenként. Egy
  vajúdás alatt óránként keletkező bejegyzés nem külön dokumentum; a lezárt partogram az.

### 1b.1 Amit a definícióból a rendszer kiszámol

```ts
readiness(docs, reg, state, "doc.zarojelentes")
  → { closable: false,
      missing: ["patient.taj", "patient.birthDate", "ctx.now"],   // BLOKKOLJA a lezárást
      gaps:    ["ctx.ga", "anthro.bmi", "nb.apgar.total"] }       // HIÁNYKÉNT jelenik meg
```

Ez valósítja meg a `14` modul elfogadási kritériumát: **a dokumentum nem tartalmaz
kitöltetlen sablonhelyet.** A `missing` blokkol; a `gaps` megjelenik — de hiányként, nem
üres mezőként és nem elhallgatva.

### 1b.1b A dokumentálás soha nem blokkolhat sürgős ellátást

A három műtéti dokumentum összetartozik: **műtéti terv → aneszteziológiai terv → műtéti
záró**. De ez a kapcsolat **jelzés, nem kapu**:

```ts
readiness(docs, reg, state, "doc.muteti-zaro", closed)
  → { closable: true,                                       // rögzíthető
      missingRelated: ["doc.muteti-terv", "doc.aneszt-terv"] }  // de a hiány LÁTSZIK
```

**Sürgős császármetszésnél nincs előzetes műtéti terv** — és ettől a műtéti leírás
rögzítését nem szabad megtagadni. Egy rendszer, ami sürgős ellátásban blokkolja a
dokumentálást, arra kényszeríti a klinikust, hogy megkerülje; és akkor az adat sehol nem
lesz meg.

> **A kapu és a jelzés különbsége itt klinikai, nem technikai.** A WHO checklist
> kitöltetlensége **blokkolja** a műtéti leírás lezárását — mert az a betegbiztonságot
> szolgálja, és a műtét alatt kitölthető. A hiányzó előzetes terv **nem blokkol** — mert azt
> visszamenőleg nem lehet pótolni, és a hiánya maga is információ.

### 1b.2 Négy részlet, ami könnyen elvész

- **A zárójelentés ellenjegyzést kíván**, az ambuláns lap nem. Ez a definícióban van, nem
  a felület kódjában.
- **A terhesgondozási lap nem egyszeri dokumentum**: a terhesség egészén át bővül, és a
  beteg példánya minden viziten frissül. A gesztációs kor **forrását** (`gaSource`) fel kell
  tüntetni rajta.
- **A terhességi kockázatértékelésen kötelező megjeleníteni, mely score nem volt
  számolható** — mert hiányzott a bemenete. Egy kockázatértékelés, ami elhallgatja a
  hiányzó adatot, hamis megnyugtatás.
- **A gyógyszerfelíráson hatnak a hard-stop kapuk.** Kapuzott szer felírása indoklás nélkül
  nem folytatható, és az indoklás a dokumentum része lesz.
- **A műtéti záró ellenjegyzést kíván**, a műtéti terv és az aneszteziológiai terv nem.
- **Az aneszteziológiai terv a klinikai modulokból veszi a bemenetét** — a megnyúlt QTc és
  az asztma nincs újra beírva, hanem a `05` és a `03` modulból jön.

### 1b.3 A megőrzési idők (K27)

Az **1997. évi XLVII. törvény (Eüak.) 30. §-a** szerint:

| Mit | Meddig | Mihez képest |
|---|---:|---|
| Egészségügyi dokumentáció | **legalább 30 év** | az adatfelvételtől |
| **Zárójelentés** | **legalább 50 év** | |
| **Képalkotó felvétel** | **10 év** | a készítéstől |
| A felvételről készített **lelet** | **30 év** | |

> **A felvétel és a lelet párja a leggyakrabban összemosott tétel.** A kép 10 évig, a
> róla készült lelet 30 évig őrzendő. Ezért szerepel a **képalkotó felvétel önálló
> dokumentumtípusként** — más a megőrzése, más a tárolóhelye (PACS), és **maga a felvétel
> nem megy az EESZT-be**, csak a lelet.

**A kötelező idő után** az adat gyógykezelés vagy tudományos kutatás érdekében — indokolt
esetben — továbbra is nyilvántartható. Ezt a `retention.extendableFor` rögzíti.

### 1b.4 A betegkérés — a második kapu

A megsemmisítés előtt **a betegnek módot kell adni arra, hogy a dokumentációt kikérje.**
Ez nem udvariasság, hanem a törlési folyamat része:

```ts
deletable(docs, "doc.ambulans-lap", { patientRequestPending: true })
  → { ok: false, reason: "…függőben lévő betegkérés miatt nem indul." }
```

Minden dokumentumtípuson rögzítve, hogy a törlés előtt **értesítjük a beteget**, és hogy a
megőrzés **a kérésére meghosszabbítható**.

### 1b.5 Az ellenőrzöttség három fokozata

A kétállapotú „ellenőrizve / nincs ellenőrizve" itt elveszítene egy valós köztes állapotot:

| Fokozat | Mit jelent | Törölhet? |
|---|---|:--:|
| `unverified` | senki nem nézett utána | nem |
| **`secondary`** | **egybehangzó másodlagos források** — hatósági és intézményi adatvédelmi dokumentumok, egyetemi szabályzat | **nem** |
| `primary` | valaki a **hatályos jogszabályszöveggel** vetette össze | igen |

**A jelenlegi állapot mind a tizennégy típuson `secondary`**: az időtartamok több, egymástól
független forrásból egybehangzóan megvannak, de az elsődleges jogszabályszöveg összevetése
hátravan. **Amíg ez nincs meg, automatikus törlés nem indul.**

> Ez a jogásznak sokkal kisebb feladat, mint a kiindulási helyzet: nem kutatni kell, hanem
> **megerősíteni** — négy időtartamot és a betegkérés kezelését.

---

---

## 2. A hét kötelezettség, technikai bontásban

### 2.1 Csatlakozás és azonosítás

| Elem | Mit jelent | Hol áll az OGDOC |
|---|---|---|
| Szolgáltatói csatlakozás | intézményi szerződés, tesztkörnyezeti hozzáférés | **beszerzési feladat**, nem fejlesztési |
| Rendszer-tanúsítvány | az intézmény nevére szóló, technikai azonosításhoz | Fázis 6 |
| **Ágazati azonosítás** | az orvos ágazati azonosítója minden beküldött eseményen | 19. modul: a `profiles` már tárolja a szerepet, az azonosító mező új |
| Beteg azonosítása | TAJ-alapú, a rendszer `patient.taj` mezője `phi` jelöléssel | **kész** |

### 2.2 Az öt adatszolgáltatási irány

| Irány | Tartalom | Az OGDOC forrása |
|---|---|---|
| **Ellátási esemény** | mikor, hol, ki, milyen ellátás | `02` modul: `ctx` + `clinical_encounters` |
| **Egészségügyi dokumentum** | zárójelentés, ambuláns lap, lelet | `14` modul, aláírással és verzióval |
| **eRecept** | gyógyszerrendelés | `06` modul |
| **eBeutaló** | beutalás, konzílium-kérés | `13` modul |
| **Kórtörténeti lekérdezés** | *befelé*: más intézmény adatai | `03` anamnézis `prefill` forrásként, `imported` eredettel |

A visszafelé irány a legértékesebb és a legkönnyebben elhanyagolt: **egy más intézményből
lekérdezett korábbi lelet előtöltési javaslat**, nem automatikusan elfogadott érték. Az
eredete `imported`, a precedenciája a klinikusi bejegyzés alatt van, és a felületen látszik,
honnan jött.

### 2.3 A digitális önrendelkezés tiszteletben tartása

Az EESZT-ben a beteg rendelkezhet arról, ki és mit láthat az adataiból. **Ez nem a lekérdező
felület kérdése, hanem beépített viselkedés**: ha a rendelkezés tiltja a hozzáférést, a
rendszer nem kerülheti meg azzal, hogy egyszer lekérdezi és eltárolja.

Két technikai szabály következik belőle:

- **A lekérdezett adat nem válik a saját rekord részévé automatikusan.** Javaslatként
  jelenik meg; ha a klinikus elfogadja, az az ő rögzítése lesz, saját eredettel és
  felelősséggel — és ez a naplóban látszik.
- **A sürgősségi hozzáférés külön esemény.** Ha a rendelkezés megkerülhető sürgős
  ellátásban, annak külön indoklása és naplózása van, és utólag felülvizsgálható.

---

## 3. Ami már készen áll ehhez

Az architektúra szerencsés helyzetben van: **a K7 interoperabilitási döntés miatt már
FHIR-alakon megy ki minden adat**, és a `sync_outbox` + adapter-minta megvan. Az EESZT
tehát **egy további adapter**, nem új adatmodell.

```
   OGDOC mag  →  FHIR R4 közbenső alak  →  ┬─ e-MedSolution adapter (HL7 v2)
                                           ├─ EESZT adapter
                                           └─ RecordingAdapter (teszt)
```

| Már megvan | Mit ad az EESZT-hez |
|---|---|
| FHIR R4 közbenső alak | az üzenetek törzse |
| `sync_outbox` + adapter-minta | újraküldés, sorrendezés, hibakezelés |
| `NoopAdapter` → `RecordingAdapter` → éles | **tesztelhetőség valódi csatlakozás nélkül** |
| Aláírás és verziózás a `clinical_notes`-ban | a dokumentum hitelessége |
| `provenance` és `sourceRef` minden értéken | a beküldött adat visszavezethetősége |
| A v16 13 beágyazott EESZT-kódtörzse (~13 000 tétel) | a kódolt tartalom (`17` modul) |

**A `RecordingAdapter` itt kulcsfontosságú**: az EESZT-csatlakozás engedélyezési átfutása
hónapokban mérhető, a fejlesztés viszont nem várhat rá. A rögzítő adapter a valós üzeneteket
állítja elő és fájlba írja; amikor a tesztkörnyezet elérhető, a különbség csak a küldés.

---

## 4. Amit meg kell építeni

| # | Feladat | Fázis | Becslés |
|---:|---|---|---|
| 1 | Ágazati azonosító a felhasználói profilban, kötelezőségi szabállyal | 4 | 0,5 hét |
| 2 | Ellátási esemény → EESZT esemény leképezés | 6 | 1–2 hét |
| 3 | Dokumentum-beküldés (zárójelentés, ambuláns lap) | 6 | 2–3 hét |
| 4 | Kórtörténeti lekérdezés → `prefill` javaslat, `imported` eredettel | 6 | 2 hét |
| 5 | **Rendelkezés-tisztelet és sürgősségi hozzáférés naplózással** | 6 | 1–2 hét |
| 6 | eRecept és eBeutaló | 6 | 3–4 hét |
| 7 | Megőrzési idő kikényszerítése a törlési folyamatban | 4 | 1 hét |

**A 7. tétel ütközik a GDPR-törléssel, és ezt ki kell mondani**: az ellátási dokumentáció
jogszabályi megőrzési ideje **elsőbbséget élvez** a törlési kérelemmel szemben. A beteg
kutatási hozzájárulását visszavonhatja — az ellátási dokumentációját nem törölhetjük.
A [`06-beleegyezes.md`](06-beleegyezes.md) visszavonási folyamata ezért **kétágú**:

```
visszavonás
   ├─ KUTATÁSI felhasználás   → minta zárolása, kizárás minden exportból (22. modul)
   └─ ELLÁTÁSI dokumentáció   → marad, a jogszabályi megőrzési idő végéig
```

Ez nem kibúvó, hanem a jogi helyzet pontos leképezése — és a beteget a
beleegyező nyilatkozatban **erről tájékoztatni kell**, nem utólag.

---

## 5. Elfogadási kritérium

1. Egy lezárt ellátási epizódból **érvényes EESZT-üzenet készül** a `RecordingAdapter`-rel,
   valódi csatlakozás nélkül, és az üzenet minden kötelező mezője kitöltött.
2. Egy másik intézményből lekérdezett lelet **javaslatként** jelenik meg, `imported`
   eredettel — nem automatikusan elfogadott értékként.
3. **Rendelkezéssel tiltott adat nem kérdezhető le**, és a sürgősségi hozzáférés külön
   indoklással és naplóbejegyzéssel jár.
4. A kutatási hozzájárulás visszavonása **nem törli** az ellátási dokumentációt, és a
   folyamat mindkét ágat lefuttatja — automatizált teszttel bizonyítva.
5. A beküldött üzenetből visszakereshető, **melyik változó melyik értéke** került bele.

---

## 6. Ami ebből még nyitva van

A **K20 és a K26 lezárva**: tizenhárom dokumentumtípus, a fenti táblázat szerint. Egy
következmény azonban döntést kíván:

**K27 — A megőrzési idők visszaellenőrzése.** A `retention.verified` mind a nyolc típusnál
`false`, ezért a rendszer nem töröl. A jogi megerősítés után a jelölés átállítható, és
ettől kezdve az automatikus törlés működik. **Amíg ez nincs meg, adat nem vész el** — ami a
biztonságos alapállás, de nem tartható hosszú távon, mert a jogszabály a törlést is előírja.
