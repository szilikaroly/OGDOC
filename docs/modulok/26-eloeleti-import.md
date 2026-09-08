# Modul 26 — Előéleti adatimport, strukturálás és a jóváhagyási sor

| | |
|---|---|
| **Cél** | Régi, strukturálatlan beteganyag (recept, zárójelentés, lelet, kézírás, képalkotó lelet) a regiszter változóira képezve — és a benne lévő **vörös zászlók klinikusi jóváhagyással** |
| **Forrás** | ÚJ. A kinyerés nyelvi modellel; a *tár*, a *kapu* és a *sor* saját |
| **Becsült változó** | ~40 (a javaslat és a döntés metaadata; klinikai változót nem hoz létre — a meglévőket tölti) |
| **Fázis** | 3 (mag) → 5 (lekérdező) → 6 (beteg-oldali) |
| **Függ** | `01` panaszszótár (vörös zászlók) · `02–06` változók · `20` lekérdező · `25` jogosultság |
| **Állapot** | **a mag megvan és tesztelt** (`core/import/`, 16 teszt); a kinyerő, a lekérdező és a beteg-oldali rész terv |

---

## 1. A probléma, amit meg kell oldani, és a probléma, amit nem szabad okozni

Egy új beteg mögött húsz év papír van. A rendszer minden ígérete — a
keresztfeltöltés, a szűrési esedékesség, a kockázati score, a vörös zászló —
azon áll, hogy **van adat**. Ha ez az adat egy 2019-es zárójelentés PDF-jében
ül, akkor a rendszer szempontjából nincs.

A gépi kinyerés ma már jól működik. **És épp ezért veszélyes.** Egy 97%-os
pontosságú kinyerő száz értékből hármat elront — de nem véletlenszerűen és nem
bizonytalanul: **magabiztosan mást olvas**. Az OCR nem tétovázik a `0` és az
`O`, az `1` és az `l`, a `5` és az `S` között, és nem szól, ha elveszít egy
tizedesvesszőt. A `1,68` és a `168` között az a különbség, hogy melyik a
vérnyomás.

> **A réteg egyetlen állítása:** a gépi kinyerés **állítást** ad, nem **adatot**.

### Miért nem elég egy alacsony precedenciájú eredet

Kézenfekvő megoldás lenne egy új `extracted` provenance a rangsor aljára. Ez
**rossz megoldás**, és érdemes kimondani, miért: a precedencia arról szól,
**melyik adat nyer, ha több van**. Ha nincs jobb, az `extracted` nyerne — és
egy OCR-tévesztés csendben belemenne egy score-ba, egy zárójelentésbe, egy
finanszírozási jelentésbe.

Itt viszont nem az a kérdés, hogy melyik adat erősebb, hanem hogy **adat-e
egyáltalán**. Ezt szerkezettel kell eldönteni, nem rangsorral.

```
dokumentum ──▶ kinyerő ──▶ JAVASLATTÁR ──▶ [ember] ──▶ CaseState.values
                                             ▲
                                    itt és csak itt lesz adat
```

A `ProposalStore.toValues()` **kizárólag** a `confirmed` állapotúakat írja be.
Nincs olyan üzemmód, amiben egy meg nem erősített kinyerés bármelyik
levezetést, score-t vagy dokumentumot befolyásolná.

---

## 2. Négy szabály, mind szerkezeti

| Szabály | Hol kényszerül ki | Miért |
|---|---|---|
| **Hivatkozás nélkül nincs javaslat** | `ProposalStore.add()` kivételt dob | Ha nem tudjuk megmutatni, **hol** mondja a dokumentum, a megerősítés vak: az ember azt hagyná jóvá, amit a gép mond, nem azt, amit a papír |
| **Gépi magabiztosság sosem erősít meg** | nincs küszöb a kódban | A 0,999 is javaslat marad. Egy küszöb pontosan a ritka, magabiztos tévedést engedné át |
| **Az elutasított javaslat megmarad** | `reject()` állapotot vált, nem töröl | „Megnéztük és nem" információ; az újraimport nem támaszthatja fel |
| **Az ütközést látni kell** | `conflicts()` | Ha a javaslat ellentmond a rögzített adatnak, a rendszer **egyiket sem választja** — lehet, hogy a régi lelet a pontosabb, és az is lehet, hogy a beolvasás hibázott |

### A megerősített érték kié

A megerősítés után az érték eredete **`clinician`** — mert onnantól nem a gép
állítja, hanem az, aki jóváhagyta. A `sourceRef` viszont visszamutat a
javaslatra, azon át a dokumentum pontos helyére:

```ts
v.provenance   // "clinician"
v.sourceRef    // "import:prop.1"
store.get("prop.1").span.text   // "RR 168/104 Hgmm"
```

Ez a lánc az, amitől egy két év múlva feltett kérdés — *„honnan tudjuk, hogy
168 volt?"* — megválaszolható.

### A két „confidence”, amit sosem szabad összekeverni

| Mező | Mit mér | Ki adja |
|---|---|---|
| `machineConfidence` (0–1) | mennyire biztos a **kinyerő** abban, hogy jól olvasta | a modell |
| `confidence` (`measured` · `reported` · `estimated` · `uncertain`) | milyen **klinikai** természetű a datum | a dokumentum |

Egy laborleletből olvasott érték klinikailag `measured`, akkor is, ha a
beolvasás hibázhatott. A beolvasás kockázatát a hivatkozás hordozza, nem a
klinikai megbízhatóság lerontása. Ezt a két dolgot összemosni azért veszélyes,
mert egy „bizonytalan" címke megnyugtatóan hat, miközben nem mond semmit arról,
mi a teendő.

---

## 3. A vörös zászlók sora — a kérés lényege

> *„automatikusan a háttérben a red flageket jóváhagyatja a klinikussal"*

A „háttérben" és a „jóváhagyás" együtt csak egyféleképpen működik:

> **A gép keres. Az ember dönt. Ami közte van, az nem tűnik el.**

Ezért a zászlónak **négy** állapota van, és a harmadik nem olvad bele a
negyedikbe:

| Állapot | Mit jelent | Mi a teendő |
|---|---|---|
| `raised` | megerősített adatból következik | ez már a beteg adata — a szokásos útvonal |
| `pending` | **meg nem erősített javaslatból** következne | a klinikus döntésére vár, és **addig is látszik** |
| `undeterminable` | a szükséges adat sehol nincs meg | ez **nem** „nincs vörös zászló" |
| `clear` | megnéztük, és nem áll fenn | — |

A `pending` a lényeg. Egy olyan rendszer, ami a meg nem erősített kinyerésből
fakadó gyanút addig **elrejti**, amíg valaki jóvá nem hagyja, épp azt veszíti
el, amiért az egészet csináljuk: a régi anyagban lévő, észrevétlen jelet.

### Hogyan számolódik

A `triageFlags()` a panaszszótár vörös zászlóit **kétszer** értékeli ki:
egyszer a megerősített adaton, egyszer egy **hipotetikus** állapoton, mintha a
sorban álló javaslatokat elfogadtuk volna. A kettő különbsége adja a `pending`
zászlókat — vagyis pontosan azt, ami a klinikus döntésén múlik. A hipotetikus
állapot sehol nem tárolódik és semmilyen dokumentumba nem kerül; erre külön
teszt van, mert ha kiszivárogna, azzal pontosan a kaput kerülnénk meg.

```
compl.neuro.headache.visual   pending   ← prop.preg („10. hetes graviditas")
```

### Amit a sor NEM csinál

**Nem szűr.** A `queue()` gépi magabiztosság szerint rendez, de ez **kényelem,
nem szűrés**: az utolsó tétel ugyanúgy döntést vár, mint az első. Aki csak a
lista tetejét nézi meg, az nem hagyta jóvá a többit — csak nem döntött róluk.
A felületnek ezt ki kell mondania, és a `summary()`-nak mindig látszania kell.

---

## 4. A kinyerő — terv

A kinyerés a réteg **cserélhető** része. A tár, a kapu és a sor nem függ tőle;
egy kinyerő annyit tesz, hogy `Proposal`-okat állít elő.

### 4.1 Csővezeték

```
fájl ─▶ [szövegréteg?] ─▶ OCR ─▶ szakaszolás ─▶ kinyerés ─▶ leképezés ─▶ javaslat
         ha van, azt        ha nincs   fejezet/     modell     regiszter-
         használjuk                    tábla                   változóra
```

| Lépés | Megjegyzés |
|---|---|
| **szövegréteg** | Ha a PDF-nek van, azt kell használni. A saját anyagaink közt is volt olyan, ami **képként szkennelt** — ott OCR nélkül nincs mit kinyerni, és ezt ki kell mondani, nem tippelni |
| **OCR** | A `SourceDocument.ocr` jelzi. Minden belőle származó javaslat **más módon** hibázik, ezért a felületen külön jelölendő |
| **szakaszolás** | Zárójelentés-fejezetek, laborleletek táblái. A szakasz adja a `span` alapját |
| **kinyerés** | Nyelvi modell, **kötelező idézettel**. Ha a modell nem tudja megmutatni, honnan vette, a javaslat eldobandó — a `ProposalStore` amúgy sem venné fel |
| **leképezés** | A regiszter a séma: a modell **változóazonosítót** ad vissza, nem szabad szöveget. Ismeretlen azonosító → nem javaslat |

### 4.2 Amit a modelltől kérünk, és amit nem

| Kérjük | Nem kérjük |
|---|---|
| „a dokumentum ezen a helyen ezt az értéket mondja" | „mi a beteg diagnózisa" |
| a regiszter egy változójának azonosítóját | új változó kitalálását |
| szó szerinti idézetet | összefoglalást, ami az idézet helyére kerül |

A különbség az, hogy az elsőt **ellenőrizni lehet** a dokumentum mellett
ülve, a másodikat nem.

---

## 5. Természetes nyelvű lekérdezés — terv

> *„Show diabetic patients with elevated HbA1c in Q2 2024"*

### A választott szerkezet: a modell a LEKÉRDEZÉST írja, nem a VÁLASZT

```
kérdés ─▶ modell ─▶ STRUKTURÁLT LEKÉRDEZÉS ─▶ [megmutatjuk] ─▶ futtatás ─▶ eredmény
                    (a regiszter változóira)                     determinisztikus
```

Ez nem stílusválasztás. Ha a modell adja a **választ**, akkor a válasz
helyessége a modellen múlik, és nem ellenőrizhető. Ha a modell a
**lekérdezést** adja, akkor:

- a lekérdezés **megmutatható** futtatás előtt, és a kérdező látja, hogy azt
  kérdezte-e, amit akart;
- az eredmény az adatbázisból jön, tehát **reprodukálható** és
  **auditálható**;
- a hiba **látható**: rossz lekérdezés rossz szűrést ad, nem magabiztosan
  hibás mondatot.

A regiszter-vezérelt architektúra ehhez pontosan illeszkedik: **a séma amúgy
is gépi olvasható**, a modellnek nem kell táblaneveket kitalálnia.

### A kapuk, amik a `20` modulból öröklődnek

| Kapu | Mit véd |
|---|---|
| `phi: true` mezők kimaradnak | a lekérdező nem ad ki azonosítót |
| kis elemszám elnyomása | egy háromfős csoport visszaazonosítható |
| a lekérdezés naplózódik | ki, mit, mikor kérdezett |

### RAG — hol van a helye, és hol nincs

Strukturált mezőre RAG-ot használni felesleges és rosszabb: arra lekérdezés
van. A RAG helye a **szabad szöveg**, amihez nincs változó — műtéti leírás
részletei, konzíliumi vélemény. Ott is egyetlen szabállyal: **minden állítás
mellett ott a hivatkozás a forrásdokumentum pontos helyére**, különben nem
jelenik meg. Ugyanaz a szabály, mint a javaslatnál — a rendszerben nincs eredet
nélküli érték, és ez a szövegre is áll.

---

## 6. A beteg-oldali, fizetős változat — terv, és egy figyelmeztetés

> *„ugyanez az oldal a betegnél fizetős formában átnézi és előéleti profilt
> készít javaslatokkal"*

### Ezt komolyan kell venni, mert szabályozási határt érint

A rendszer jelenlegi használati kategóriája — `docs/00-pozicionalas.md` —
**kutatási, oktatási és belső minőségfejlesztési használat, orvosi felügyelet
mellett**, és ez a döntés **szándékosan veszi ki az MDR-megfelelőséget a
hatókörből**.

Egy **fizetős, beteg-oldali termék, ami javaslatot ad**, ezt a döntést
visszavonja. Az (EU) 2017/745 rendelet **11. szabálya** szerint a diagnosztikai
vagy terápiás döntéshez információt szolgáltató szoftver orvostechnikai eszköz;
a beteg mint közvetlen felhasználó ezen nem változtat, sőt. Ez nem elméleti:
kockázati osztályba sorolást, klinikai értékelést, bejelentett szervezetet és
piacfelügyeletet jelent.

**Ez nem azt jelenti, hogy nem szabad megcsinálni** — azt jelenti, hogy két
különböző terméket lehet építeni, és előre el kell dönteni, melyiket:

| | **A. Rendezés** | **B. Javaslat** |
|---|---|---|
| Mit ad | a beteg **saját adatát** rendezve, idővonalon, hivatkozással | értékelést és teendőt |
| Mit mond hiányról | „ez a lelet hiányzik", „erre nincs adat" | „ezt a vizsgálatot el kell végezni" |
| Kimenet | **kérdések, amiket érdemes feltenni az orvosnak** | ajánlás |
| MDR | nem eszköz (adatrendezés) | **eszköz, 11. szabály** |
| Mikor indítható | azonnal | megfelelőségértékelés után |

**Az ajánlásom az A. változat elsőre**, és nem óvatosságból: az A. változat
önmagában is eladható érték. Húsz év papírja rendezve, kereshetően, a
hiányokkal megnevezve — ez az, amit ma senki nem ad meg a betegnek, és amihez
nem kell orvosi állítást tenni.

### Az A. változat szerkezete

Ugyanaz a motor, más kapuval:

```
beteg feltölt ─▶ kinyerés ─▶ JAVASLATTÁR ─▶ ??? ─▶ profil
```

A `???` a kérdés. A beteg **nem** klinikus: a megerősítése nem teszi adattá az
értéket. A rendszerben már van erre minta — a beteg-oldali felvétel
**megerősítési kapuval, a precedencia legalján** —, és ezt kell követni:

| Ki erősít meg | Mi lesz belőle |
|---|---|
| **beteg** | `patient` eredetű érték a **saját** profiljában; a klinikai dokumentációba **nem** kerül |
| **klinikus** | `clinician` eredetű adat, a szokásos módon |

Vagyis a beteg-oldali profil egy **külön, párhuzamos nézet**, ami a klinikai
dokumentációt nem írja. Ha a beteg a saját anyagát behozza az ellátásba, az egy
**átadás**, amit a klinikus a szokásos soron hagy jóvá.

### Vörös zászló a beteg-oldalon

Itt a legélesebb a kérdés. Ha a rendszer a beteg feltöltött anyagában
észrevesz valamit, mit tegyen?

- **Nem** mondhatja, hogy „Önnek praeeclampsiája volt". Ez diagnózis.
- **Nem** hallgathatja el. Egy fizetős szolgáltatás, ami észrevesz valamit és
  nem szól, rosszabb, mint ami észre sem veszi.

A járható út: **kérdéssé alakítva**, a forrás megmutatásával.

> *„A 2019-es zárójelentésében ez áll: »RR 168/104 Hgmm«. Ez a következő
> terhesség tervezésekor számít. Érdemes megkérdezni a kezelőorvosát, hogy
> ez befolyásolja-e a gondozását."*

Ez nem diagnózis és nem ajánlás: **a beteg saját adata, megmutatva, egy
kérdéssel**. És minden szava ellenőrizhető a dokumentum mellett ülve.

---

## 7. Elfogadási kritérium

> **A meg nem erősített kinyerés egyetlen levezetést, score-t, dokumentumot
> vagy jelentést sem befolyásol — a belőle fakadó vörös zászló viszont a
> döntés előtt is látszik, `pending` állapotban, megnevezve, melyik javaslat
> döntené el.**

Ez már **teszt, nem ígéret**: `test/import.test.ts`, 16 teszt. A kritérium két
fele két külön teszt:

```ts
// a javaslat nem adat
assert.deepEqual(store.toValues(REG, blank()).values, {});

// a zászló mégis látszik
assert.equal(hit.state, "pending");
assert.deepEqual(hit.awaiting, ["prop.preg"]);
```

---

## 8. Nyitott kérdések

| # | Kérdés | Miért nem dönthető el most |
|---|---|---|
| 1 | **A. vagy B. változat a beteg-oldalon?** | Üzleti és szabályozási döntés, nem műszaki. A B. változat megfelelőségértékelést indít |
| 2 | Melyik modell nyeri ki az adatot, és hol fut? | Betegadat megy át rajta: a helyben futó és a szolgáltatói modell között **adatvédelmi** különbség van, nem minőségi. Ez adatfeldolgozói szerződés és hatásvizsgálat kérdése |
| 3 | Meddig őrizzük a **forrásdokumentumot**? | A `span` hivatkozás értéktelen a dokumentum nélkül. A megőrzési idő a `docs/` réteg kapuja alá tartozik, és ott ma minden `secondary` — jogásznak való |
| 4 | Mi legyen a **tömeges** import kapuja? | Húsz év anyaga több száz javaslat. Egyenkénti jóváhagyás reális-e, vagy kell egy „ez a lelet egészében helyes" szintű megerősítés is — dokumentumra, nem értékre? |
| 5 | A `pending` zászló megjelenik-e a **sürgősségi** nézetben? | A `09` modul szabálya szerint a dokumentálás sosem blokkolhat sürgős ellátást. De egy `pending` zászló nem blokkol — csak látszik. Klinikai döntés, hogy sürgősségben ez segít vagy zavar |
