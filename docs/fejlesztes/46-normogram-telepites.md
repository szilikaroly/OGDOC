# 46 — A 265 görbe: melyik tíz, és ki írja alá

*A 7. lépés gépi fele — és az összehasonlítás, ami sosem volt igaz.*

265 katalogizált görbe, 3 betöltve, a publikáltak közül **0 hitelesítve**. A
lépés elfogadási kritériuma „a leggyakrabban használt tíz görbe", és a kérdés
épp az volt, hogy **melyik tíz**.

---

## Amit a gép megtalált: egy összehasonlítás, ami mindig hamis

A `coverage()` és a `catalogueStamp()` így számolta a hitelesített görbéket:

```ts
normograms.filter((n) => n.verification === "verified")
```

A `verification` lehetséges értékei viszont: `primary` · `secondary` ·
`assumed` · `local`. **`"verified"` nincs közöttük.** A futtatás
típusellenőrzés nélkül megy (Node strip-only mód, a pipeline-ban nincs `tsc`),
tehát a fordító nem szólt: az összehasonlítás **csendben mindig hamis** volt,
két helyen.

**Kit ért a kár?** Nem a beteget: a percentilis-kapu a `normogram.ts`-ben
helyesen `primary`-t és `local`-t néz, tehát rossz szám sosem született. A kár
a **munkát** érte volna:

> A lefedettségi jelentés örökre „0 hitelesített"-et mutatott volna — **akkor
> is, ha valaki épp hitelesített egyet.** Aki elvégzi a 7. lépést, nem látta
> volna az eredményét. Egy visszajelzés nélküli feladat pedig félbemarad.

És volt egy második áldozata is: a jelentés soha nem tudta megmutatni, hogy a
**helyi tábla már ma ad percentilist**. A javítás után ez azonnal láthatóvá
vált — `1 helyi (más fajta, nem gyengébb)`.

### Ami ebből szabály lett

A szintek listája **adat**, nem kézzel írt szöveg, és a kérdéseket
**nevesített predikátumok** teszik fel:

| | Mit kérdez |
|---|---|
| `NORMOGRAM_VERIFICATION` | a négy létező szint, felsorolásként |
| `hitelesitett(n)` | `primary` — elsődleges forrással összevetve |
| `adPercentilist(n)` | `primary` **vagy** `local` |

A két szám szándékosan **külön** marad. A `local` nem gyengébb hitelesítés,
hanem más fajta: a saját populációnkból származik, és a `derivedFrom` felel
érte. Összeadva épp azt a különbséget tüntetnénk el, amiért a `local`
egyáltalán létezik.

A **teszt is a hibát kódolta**: a címe szerint „percentilist egyik mérésre sem
adunk" — ami sosem volt igaz, csak a hibás kód igazolta. Átírva, és mellé
került egy teszt, ami a hibaosztályt fogja meg: hitelesíts egy görbét, és a
jelentésnek követnie kell.

---

## A katalógus egyetlen szálon lógott

A `coverage()` egy `parameterOf` leképezést vár — melyik katalógusbeli mérés
melyik változónkhoz tartozik. Ez a leképezés **sehol nem létezett a repóban**:
egyetlen teszt adta át, `{ AC: "us.ac" }` alakban.

Vagyis a 265 görbés katalógust **egyetlen szál** kötötte a regiszterhez.

Most `registry/normogramok/lekepezes.json`, **15 kötéssel** — és ami ennél
fontosabb: a maradék 104 mérés **megnevezett okokkal** van kihagyva, tíz
csoportban. Nem tévedésből maradtak ki:

| Csoport | Mit jelez |
|---|---|
| magzati vértétel | a beavatkozás megvan, a **leletmezői** nem |
| szívmorfometria | 28 katalogizált görbe, nálunk **3** szívváltozó |
| arány-származtatott | HC/AC, HC/FL — ezeket **számolni** kell, nem tárolni |
| biokémiai szűrés | MoM-értékek: a **modell** nincs telepítve |
| … | *(a többi a `lekepezes.json`-ban)* |

A leképezés írása közben derült ki, hogy a **PAPP-A változóként sincs meg** a
regiszterben (a `lab.plgf` és a `lab.hcg` igen). Ez a katalógus haszna: nem
görbét ad, hanem megmutatja, mi hiányzik ahhoz, hogy egyáltalán befogadhassunk
egyet.

---

## A sorrend levezethető — ezért nem tárgyalódik újra

Négy mérhető tényező, mind a **mi** adatunkból:

| Tényező | Mit mér |
|---|---|
| **kereslet** | hivatkozik-e rá változó, levezetés vagy másik görbe |
| **hiány** | ad-e már percentilist bármi erre a mérésre |
| **választási teher** | hány publikált görbe verseng ugyanarra |
| **konvenciókockázat** | publikáltak-e rá kétféle mérési konvencióval |

A forrásrendszer szokása (137 görbe „használatban") szándékosan **kis súlyú**:
azt mondja meg, ott mit vesznek elő naponta — szokás, nem bizonyíték.

**Egy görbe, amire nálunk semmi nem mutat, nem sürgős — akármilyen gyakori.**

### Az első kör

| # | Mérés | Változó | Görbék | Konvenciófüggő | Ikergörbe |
|---:|---|---|---:|---|---|
| 1 | BPD | `us.bpd` | 22 | **IGEN** (15 jelöletlen) | igen |
| 2 | HC | `us.hc` | 19 | nem | igen |
| 3 | FL | `us.fl` | 19 | nem | igen |
| 4 | Birthweight | `nb.birthWeight` | 16 | nem | igen |
| 5 | EFW | `us.efw` | 4 | nem | **NINCS** |
| 6 | Middle Cerebral PI | `us.mca.pi` | 2 | nem | **NINCS** |
| 7 | Humerus | `us.hl` | 5 | nem | **NINCS** |
| 8 | Umbilical PI | `us.ua.pi` | 5 | nem | **NINCS** |
| 9 | Amniotic Fluid Index | `us.afi` | 3 | nem | **NINCS** |
| 10 | Yolk Sac Diameter | `us.ys` | 2 | nem | **NINCS** |

Az **AC kimaradt** az első körből, és ez nem hiba: ott már van helyi tábla,
ami percentilist ad. A hitelesítés ott **minőségi**, nem hiánypótló lépés — a
rangsor ezt kimondja, nem elhallgatja.

**Hatnál nincs ikergörbe a katalógusban.** Ez nem a telepítés hibája, de a
következménye a mi oldalunkon jelentkezik: ikerterhességben ezekre a mérésekre
nem lesz olvasható percentilis. A `pick()` ilyenkor `undetermined`-et ad —
**nem** egyes magzat görbéjét —, és ez a helyes viselkedés.

---

## A konvenció: ahol a görbeválasztás önmagában nem elég

A BPD-t **kétféle konvencióval** publikálták (külső-belső és külső-külső él),
és a katalógus 22 tételéből **15 nem jelöli, melyikkel**.

> A különbség néhány milliméter. A 3. trimeszterben ez egy percentilis sáv —
> és **mindig ugyanabba az irányba** téved.

Ezért az aláírásnak a konvenciót is meg kell neveznie. Konvenciófüggő mérésnél
a hiánya **build-hiba**: a görbe helyes lehet, a rá mért adat viszont nem
hozzá tartozik.

## És a képesítés

A magzati biometria görbéit nem „egy orvos" hitelesíti: a `kepesites` mező
(FMF-engedélyszám vagy egyenértékű) **kötelező**, mert itt a **mérési
technika** is a hitelesítés tárgya. Egy hibátlan görbe rossz technikával mért
adaton ugyanúgy téved — csak épp úgy néz ki, mintha nem.

A helyi tábla ezzel szemben **nem aláírás tárgya**: aláírni sem lehet, és a
kísérlet build-hiba. A `local` sosem válik `primary`-vé.

---

## Fájlok és számok

| Fájl | Mi ez |
|---|---|
| `registry/normogramok/lekepezes.json` | 15 kötés + 104 mérés **megnevezett** kihagyási okkal |
| `registry/normogramok/hitelesitesek.json` | **szándékosan üres** |
| `core/us/telepites.ts` | a rangsor, indoklással tételenként |
| `core/us/hitelesites.ts` | lenyomat · FMF-képesítés · konvenciókapu |
| `tools/gen-normogram.ts` | a munkalap (`npm run normogram`) |
| `test/normogram-hitelesites.test.ts` | 14 teszt |

A `npm run validate` záró sora:
`15/119 mérés leképezve, 0 görbe hitelesítve`.

**Nulla hitelesítés — és ez ma a helyes szám.** A telepítés levezethető és
elő van készítve; az aláírás fetalis medicina szakorvosé, FMF-engedélyszámmal.
