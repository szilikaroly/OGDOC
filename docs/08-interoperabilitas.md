# 08 — Interoperabilitás: HIS, PACS, labor, POCT, EESZT

> **K7 eldőlt.** Univerzális interfészréteg: **HL7** (v2 és FHIR), **DICOM** (tárolás,
> lekérdezés, **Worklist**, **MPPS**, képtranszfer), **LIS2** és **POCT1** a laborhoz és az
> ágy melletti eszközökhöz. **Fő cél: e-MedSolution.** Saját PACS: **Orthanc**.
>
> **K1 eldőlt:** lesz webes fázis, azon tesztelhető; később a HIS párhuzamos kiváltása is
> cél lehet. Ez utóbbi nem a Fázis 6 kérdése — hanem az, hogy a rendszer eleve úgy épüljön,
> hogy erre képes legyen.

---

## 1. Alapelv: egy közbenső alak, sok adapter

Nem azért, mert bármelyik külső rendszer FHIR-t vár — **nem azt vár** —, hanem mert közbenső
alak nélkül minden csatlakozás egyedi, és két csatlakozás után kezelhetetlen.

```
                                     ┌──▶ e-MedSolution adapter   (HL7 v2 / vendor API)
OGDOC regiszter ──▶ FHIR R4 ──┬──────┼──▶ EESZT adapter           (CDA / webszolgáltatás)
   (belső alak)   (közbenső)  │      ├──▶ Orthanc / PACS          (DICOM)
                              │      ├──▶ LIS adapter             (LIS2-A2 / HL7 v2 ORU)
                              │      ├──▶ POCT adapter            (POCT1-A2)
                              │      └──▶ Kutatási export         (ICHOM CSV, REDCap)
                              │
                              └──▶ sync_outbox  (idempotens, újrapróbálható)
```

Minden `VariableDef` hordozza a `standards.fhir` leképezést (`{ resource, code, path }`), és a
`clinical_observations` eleve FHIR-Observation alakú.

---

## 2. HL7

### 2.1 HL7 v2 — a HIS és a labor nyelve

A magyar kórházi rendszerek és a laborműszerek túlnyomó része **HL7 v2**-t beszél, MLLP
felett. Ez nem elegáns, de ez a valóság.

| Üzenettípus | Mire | Irány |
|---|---|---|
| **ADT** (A01/A03/A04/A08/A11…) | felvétel, elbocsátás, áthelyezés, adatmódosítás | **be** ← HIS |
| **ORM / OMG / OML** | vizsgálatkérés (rendelés) | **ki** → HIS/LIS/RIS |
| **ORU^R01** | eredmény (labor, lelet) | **be** ← LIS/RIS |
| **SIU** | időpont | két irány |
| **DFT** | finanszírozási tétel | **ki** → HIS |
| **MDM** | dokumentum | **ki** → HIS |

**Amit a rétegnek tudnia kell**, és amit a legtöbb integráció elront:

- **Karakterkódolás**: magyar ékezet HL7 v2-ben `MSH-18` szerint; a `ISO IR100` / UTF-8
  eltérés a leggyakoribb hibaforrás
- **ACK-kezelés**: alkalmazásszintű nyugta, nem csak TCP
- **Idempotencia**: `MSH-10` üzenetazonosító + a `sync_outbox` kulcsa
- **Z-szegmensek**: minden gyártó saját kiegészítéseket használ — ezek **konfigurációként**,
  nem kódként kerülnek be

### 2.2 HL7 FHIR — a belső közbenső alak

| OGDOC | FHIR R4 |
|---|---|
| `clinical_encounters` | `Encounter` |
| `clinical_observations` | `Observation` |
| `clinical_diagnoses` | `Condition` |
| `clinical_calculator_results` | `Observation` (derived) + `Provenance` — **belső, nem küldjük ki** |
| `clinical_notes` | `DocumentReference` / `Composition` |
| `patient_encounters` (BNO/OENO) | `Encounter` + `Procedure` |
| `questionnaires` / `_responses` | `Questionnaire` / `QuestionnaireResponse` |
| `appointments` | `Appointment` |
| `patients` | `Patient` |
| vizsgálatkérés | `ServiceRequest` |
| képi vizsgálat | `ImagingStudy` |
| minta (biobank) | `Specimen` |

---

## 3. DICOM — nem csak képre

### 3.1 A szolgáltatások, amiket használunk

| Szolgáltatás | Mire | Szerep |
|---|---|---|
| **C-STORE** | kép fogadása és küldése | SCP + SCU |
| **C-FIND** | vizsgálat keresése | SCU |
| **C-MOVE / C-GET** | kép lehívása | SCU |
| **Modality Worklist (MWL)** | **a rendszer adja a munkalistát a modalitásnak** | SCP |
| **MPPS** (Modality Performed Procedure Step) | a modalitás visszajelzi, mit és mikor végzett el | SCP |
| **Storage Commitment** | a PACS visszaigazolja a tartós tárolást | SCU |
| **WADO-RS / QIDO-RS / STOW-RS** (DICOMweb) | webes hozzáférés, megjelenítés | kliens |

### 3.2 A Worklist a legfontosabb, és a leggyakrabban kihagyott

**Enélkül a beteg adatait kézzel írják be a készüléken** — és onnantól a kép nem köthető
megbízhatóan a beteghez. Elgépelt név vagy születési dátum, és a vizsgálat elveszett.

```
OGDOC vizsgálatkérés (ServiceRequest)
      └─▶ MWL bejegyzés  (beteg, accession number, vizsgálattípus, indikáció)
              └─▶ a modalitás lekéri, a technikus a listából választ
                      └─▶ MPPS: elkezdte / befejezte / megszakította
                              └─▶ C-STORE: a kép a PACS-ba, HELYES azonosítókkal
                                      └─▶ a lelet visszaköt a kérésre
```

**Az `accession number` a kulcs**: ez köti össze a kérést, a képet és a leletet. Az OGDOC
generálja, és végigvezeti a láncon.

### 3.2/b Amit a siker NEM jelent — storage commitment, SR, DICOMweb

A `core/interop/dicom.ts` **csak a szerződés**: a mag soha nem elemez DICOM-ot. Három
dolgot viszont a szerződés szintjén kell kimondani, mert mindhárom olyasmit sugall, ami
nem igaz.

**A C-STORE sikere nem megőrzés.** A sikeres státusz annyit jelent: *megkaptam*. Nem azt,
hogy archiváltam, és nem azt, hogy megőrzöm. A **storage commitment** (N-ACTION →
N-EVENT-REPORT) az egyetlen válasz, amiben az archívum felelősséget vállal — és **külön
társításon érkezik, akár percekkel később**. Ezért nem lehet a küldés visszatérési értéke:
ha az lenne, azt sugallná, hogy a küldés pillanatában megtudható, amit csak később lehet.

A `torolhetoHelyi()` ezt négy állapotra bontja, és **három közülük tiltja a törlést**:

| Állapot | Törölhető | Mit jelent |
|---|---|---|
| `nincsVeglegesitesiSzolgaltatas` | nem | a cél nem is ismeri a szolgáltatást — nincs mire hivatkozni |
| `csakAtvetel` | nem | átvették, a megőrzést nem nyugtázták |
| `elutasitva` | nem | az archívum **megtagadta** — a küldés sikeresnek látszott |
| `torolheto` | igen | az archívum kimondta, hogy megőrzi |

A regiszterben a PACS `archivum` jelölése **szándékosan `false`**: nem tudjuk, nyújt-e
storage commitmentet, tehát nem hivatkozhatunk rá a helyi másolat törlésekor. A
`validateDicom()` hibát ad, ha valaki `true`-ra állítja a szolgáltatás megléte nélkül.

**Az MWL MPPS nélkül nem zár be.** A munkalistatétel örökre „ütemezett” marad, és nem
derül ki, hogy a vizsgálat **elmaradt**-e, félbeszakadt, vagy csak nem zárta le senki. A
három nem ugyanaz, és a beteg szempontjából a legelső a fontos.

**Az SR nem kép: a modalitás saját mérései.** Három dolog nélkül a szám nem adat — **kód**
(mit mér), **mértékegység** (3,2 cm ≠ 3,2 mm) és **megfigyelő** (melyik gép, melyik
szoftververzió: az eltérő gyártói algoritmusok eltérő számot adnak ugyanarra a képre). A
leképezetlen kód **várakozó sorba** kerül, puszta számként nem rögzül.

A legcsendesebb hiba azonban az **ütközés**: ugyanaz a biometria kétszer kerül be, egyszer
a géptől SR-ben, egyszer az asszisztens beírásából. A két szám kicsit eltér (más
kurzorállás), és onnantól ugyanaz a klinikai tény két mezőben él — a görbe pedig attól
függ, melyiket olvassa a következő számítás. Az `srAtveheto()` ezért az emberi rögzítéssel
ütköző gépi mérést **nem írja felül és nem is teszi mellé**: emberi döntést kér.

**Az SC (Secondary Capture) a ráégetett azonosító elsőszámú forrása.** Képernyőmentés,
szkennelt papír, gépi kiírás — ott a név nem a címkében van, hanem a pixelekben, és a
PS3.15 Annex E címketisztítás ezen nem segít.

**A DICOMweb nem „a DIMSE HTTP-n”.** A kettő máshogy mondja meg, ki vagy:

| | DIMSE | DICOMweb |
|---|---|---|
| azonosítás | AE title, a PACS oldalán felvéve | HTTP-hitelesítés |
| ismeretlen fél | **elutasított társítás** | semmi, ha nincs hitelesítés |
| alapállapot | tiltás | engedés |
| lehívás | C-MOVE — **kell fogadó SCP** | WADO-RS — ugyanazon a kapcsolaton jön vissza |

Ezért a web-végpontok külön listában vannak, külön szabályokkal: hitelesítés nélküli
végpont és `http://` séma egyaránt **hiba**, nem figyelmeztetés. A regiszterben szereplő
végpont szándékosan csak QIDO-RS/WADO-RS: a STOW-RS beküldés olyan lánc kezdete lenne,
amelynek a végén valaki töröl egy helyi másolatot egy meg nem történt visszaigazolás
alapján.

### 3.3 Orthanc — a saját PACS

Nyílt forrású DICOM-szerver, és a célra megfelelő:

| Képesség | Megjegyzés |
|---|---|
| C-STORE / C-FIND / C-MOVE | alap |
| **REST API** | az OGDOC ezen keresztül beszél vele, nem nyers DICOM-on |
| **DICOMweb plugin** | WADO-RS / QIDO-RS / STOW-RS a megjelenítéshez |
| **Modality Worklist plugin** | az MWL kiszolgálásához |
| PostgreSQL plugin | index adatbázisban, nem fájlrendszeren |
| Python / Lua plugin | fogadási szabályok, automatikus továbbítás |
| Hitelesítés | **fordított proxy mögé kell tenni** — az Orthanc alapértelmezett védelme nem elég |

**Telepítési döntések, amiket előre kell meghozni:**

- **Hol tárol?** Objektumtár vagy blokk-tár; a képadat gyorsan nő
- **Anonimizálás**: az Orthanc tud, de a kutatási export **külön csővezetéken** menjen
  (`20` modul, `phi`-szabályok), ne ad hoc anonimizálással
- **Mentés és helyreállítás próbája** — ugyanaz a követelmény, mint a biobanknál

### 3.5 Képválasztás a leletre — `core/pacs/valasztas.ts`

A funkció ártatlanul hangzik: a vizsgálatnál a felhasználó kikeres egy képet a
PACS-ból, és ráteszi a leletre. **Három módon romlik el csendben**, és mindhárom
hiba helyesnek látszik.

**1. Másik beteg képe.** Egy szabad PACS-keresés a teljes archívumot látja. A
modul ezért **nem enged szabad keresést a lelethez**: a választék a kéréshez
tartozó `accession number`-re szűkül, és a betegazonosság ugyanazon a kapun megy
át, mint a beérkező leleteké (`matchPatient`) — **legalább két független
azonosító**, és egyetlen ellentmondás mindent megállít. A név nem azonosító.

**2. A kép megváltozik a lelet alatt.** A PACS-ban a vizsgálat javítható,
cserélhető. A csatolás ezért a **SOP Instance UID**-ot és — ha a PACS adja — a
képadat **lenyomatát** rögzíti. Négy épség-állapot: `valtozatlan` ·
`megvaltozott` · `nemEllenorizheto` · `eltunt`. Lenyomat nélkül a válasz **nem**
„változatlan": a PACS a UID megtartásával is cserélhet képadatot.

**3. A képbe égetett név — ami a 31. modul szűrését is átveri.** Az
ultrahangképek túlnyomó része a beteg nevét és a dátumot **a pixelekbe égetve**
hordozza. A DICOM-fejléc anonimizálása ezen nem változtat, és a szöveges
PHI-szűrés sem látja: a névnek ott nincs karakterkódja.

A DICOM erre való mezője a `BurnedInAnnotation` (0028,0301), és **három**
állapota van:

| | Mit jelent | Kifelé adható? |
|---|---|---|
| `nincs` | `"NO"` — a küldő **kimondta** | igen (a felelősség a küldőé) |
| `van` | `"YES"` | **nem** |
| `nemNyilatkozik` | a mező **hiányzik** | **nem** — és ez nem „nincs" |

A harmadik a leggyakoribb eset, és pont ezért veszélyes. A **leleten belül** a
kép így is használható; **kifelé** (oktatás, közlemény, nyilvános oldal,
kutatási export) csak akkor, ha megnevezett ember ránéz és kimondja.

> **A rendszer felkínál, de nem választ.** A csatolás rögzíti, ki választotta és
> mikor — a képválasztás klinikai döntés.

### 3.4 DICOM mint adattranszport — a „multimódusú" cél

A kérésben szereplő „DICOM transfer az adatoknak multimódusszal" **megvalósítható**, mert a
DICOM nem csak pixeladatot hordoz:

| DICOM alak | Mit hordoz | Mire használjuk |
|---|---|---|
| Képi SOP-osztályok | UH, RTG, CT, MR | `05` képalkotás |
| **Encapsulated PDF** | tetszőleges PDF | lelet, zárójelentés, beleegyező nyilatkozat |
| **Encapsulated CDA** | strukturált dokumentum | EESZT-kompatibilis dokumentum |
| **DICOM SR** (Structured Report) | **strukturált mérések és megállapítások** | UH-biometria, Doppler, echo-mérések |
| Waveform SOP-osztályok | **EKG-görbe** | `05` EKG — natív hullámforma, nem kép |
| Segmentation / Presentation State | jelölések, mérések a képen | |

**Ez a lényeg:** ugyanaz a csatorna viszi a képet, a strukturált mérést és a dokumentumot.
Egy szülészeti UH-vizsgálat így **egy DICOM-tanulmányban** tartalmazza a képeket, a
biometriai méréseket SR-ben (gépi olvasásra), és a leletet PDF-ben (emberi olvasásra).

> **Amit ez megold:** az UH-biometria ma sok helyen kézzel kerül át a leletbe. DICOM SR-rel a
> mérés a készülékről közvetlenül a `05` modul normogram-motorjába jut — gépelés és
> gépelési hiba nélkül. Ez egyben a **kevés szabad szöveg** célt is szolgálja
> (ld. `11-strukturalt-adat.md`).

---

## 4. LIS2 és POCT1 — a laborműszerek felé

| Szabvány | Mire | Megjegyzés |
|---|---|---|
| **LIS2-A2** (korábban ASTM E1394/E1381) | laborműszer ↔ LIS/középréteg | keret-alapú, karakterorientált; sok műszer csak ezt tudja |
| **POCT1-A2** | ágy melletti eszközök (vércukor, vérgáz, INR, hCG) | eszközkezelés, üzemeltető-azonosítás, QC-adat |

**Amit a POCT1 ad, és amiért érdemes**: nem csak az eredményt, hanem az **üzemeltető
azonosítását**, a **reagens-tételszámot**, a **kalibrációs és QC-állapotot** is. Enélkül egy
ágy melletti vércukorérték nem auditálható — és a `22` biobank / `megfeleles` réteg
minőségügyi logikája pontosan ezt kívánja.

**Architektúra:** nem közvetlenül a műszerhez csatlakozunk, hanem egy **middleware-hez**
(POCT adatkezelő), amely a műszereket kezeli, és felénk HL7 v2 ORU-t vagy FHIR-t ad. Ez
kevesebb egyedi illesztés, és a műszerpark cseréje nem érint minket.

---

## 4/b. Soros vonal (RS-232 / RS-485) — csak az interfész

A `core/interop/soros.ts` **nem nyit portot, és soha nem is fog**. A soros átvitel a
telepítés dolga: platform-, jogosultság- és kábelezésfüggő. Amit a mag ad, az a
**szerződés** (`SorosMeghajto`) — a tényleges bájtolvasás a gazda dolga. A szétválasztás
nem esztétikai: ha itt megnyílna egy port, a mag elveszítené azt a tulajdonságát, hogy
tiszta függvényekből áll, és a szabályokat csak valódi mérleggel lehetne ellenőrizni.

### Négy dolog, amit a soros vonal nem tud

| Hiány | Amit pótolni kell |
|---|---|
| **nincs betegazonosító** | a kötést a mérés **elindításakor** rögzítjük, külön, naplózott lépésben |
| **nincs nyugtázás** | ami elveszett, arról a küldő nem tud — a hiányt aktívan kell keresni |
| **nincs időbélyeg** | a fogadó ideje a mérvadó, az eszközé adat (az óraeltolódás önmagában jelzés) |
| **nincs mértékegység** | a profil adja; profil nélküli eszköztől érkező szám **nem vehető át** |

### És három, ami csendes kárt okoz

**A hallgatás nem „nincs mérés”.** Egy soros eszköz nem tudja megmondani, hogy abbahagyta.
A kihúzott kábel, a lemerült elem és a „most nincs beteg” ugyanúgy néz ki: semmi nem jön.
Ezért a profilhoz **várt gyakoriság** tartozik, és a némaság **állapotot** ad. A `null`
(eseményvezérelt) érvényes válasz — a **hiánya** nem.

**A profil az eszközhöz tartozik, nem a porthoz.** Ha a `COM3`-hoz kötnénk, egy átdugott
kábel után a rendszer a mérleg számait vérgázként olvasná: ugyanaz a szám, más
mértékegység, semmi jelzés.

**A vonal kétféle adatot hoz, és a kettő ellentétes szabályt kíván.**

| Fajta | Mit mér | Kötés |
|---|---|---|
| `beteg` | egy emberen végzett mérés | **kell** — enélkül nem tudni, kit mértek |
| `kornyezet` | egy **eszköz** állapota (fagyasztó, szoba, nyomás) | **nem szabad** — és a leképezés nem mehet a beteg-változóregiszterbe |

A megkülönböztetés nem elméleti. Az első változatban a fagyasztó-hőmérő a `vitals.temp`
beteg-változóra volt leképezve, aminek az értelmezési tartománya 30–43 °C: egy −80 °C-os
leolvasás ott **soha nem lett volna érvényes érték**. A profil úgy nézett ki, mintha
működne, és egyetlen mérést sem tudott volna átvenni.

Ugyanitt egy aszimmetria: betegmérésnél az azonosítót nem közlő eszközt a **kötés** fogja
meg — egy megnevezett ember kimondja, melyik eszközről van szó. A környezeti mérésnek
nincs kötése, tehát ez a lépés **hiányzik**: ezért ott az eszközazonosító kötelező. Egy
RS-485 buszon a 2. fagyasztó adata különben csendben az 1.-höz kerülne.

### A tizedesvessző

A mezőelválasztó és a tizedesjel **ugyanaz a karakter lehet**, és a rendszer nem
találhatja ki, melyikről van szó. A korábbi változat mindkettőt megpróbálta: a vesszőt
elválasztónak vette, a maradékot tizedesponttá alakította. A `WT=72,4` így két mezőre
hasadt, és az első **`72` lett — érvényes értékként, jelzés nélkül**. Súlynál apróság;
ugyanezen az úton egy 5,0 mg/dL kreatininből 5 lesz, egy 0,8-ból pedig 0.

Az elválasztók ezért profilbeállítások, és az alapértelmezés (`|`, `;`, tabulátor)
**szándékosan nem tartalmaz vesszőt**. Ha egy eszköz vesszővel választ el, a tizedesjele
kötelezően `.` — a `validateProfilok()` hibát ad, ha mindkettő igaz lenne.

### Amit a soros csatorna ma nem tud

A hiányok a profilokból gyűlnek a hiányjegyzékbe, nem kézzel írt listából — ha egy profil
javul, a jegyzék magától rövidül:

- **a magzati szívfrekvenciának és az uterus-aktivitásnak nincs saját változója**, ezért a
  CTG-adat nem vehető át; a `vitals.pulse` az **anya** pulzusa, és a két tartomány
  átfedésben van, tehát a téves leképezés nem érvénytelen értéket adna, hanem rossz adatot;
- a környezeti mérésnek **nincs idősoros tárolója**: a `tarolo.homerseklet` megérkezik és
  eldobódik, miközben az ISBER-követelmény épp a megőrzött görbét kívánja;
- a kitérés **küszöbe és címzettje** nincs kimondva.

---

## 5. e-MedSolution — a fő cél

Az elsődleges HIS-integrációs cél. Mivel a konkrét interfészkészlet **gyártófüggő és
szerződéses**, a terv nem feltételez róla részleteket.

**Amit a Fázis 0-ban tisztázni kell — és ez beszerzési, nem fejlesztési feladat:**

| # | Kérdés |
|---|---|
| 1 | Milyen interfészeket ad? (HL7 v2 melyik verziója, van-e FHIR, van-e vendor API) |
| 2 | Melyik üzenettípusokat és **melyik Z-szegmensekkel**? |
| 3 | Van-e tesztkörnyezet, és hogyan érhető el? |
| 4 | Melyik irány engedélyezett? (csak olvasás, vagy írás is) |
| 5 | Betegazonosítás: milyen kulccsal? (TAJ, törzsszám, esetszám) |
| 6 | Ki üzemelteti az illesztést, és milyen SLA-val? |

> **Amíg ez nincs meg, az adapter `RecordingAdapter` módban fut**: előállítja és elmenti a
> kimenő üzenetet, de nem küldi. Így az integráció helyessége a csatlakozás *előtt*
> validálható — ez a réteg legfontosabb tervezési eleme.

### 5.1 A „párhuzamos kiváltás" mint távlati cél

A K1 válasza szerint később a HIS **párhuzamos kiváltása** is cél lehet. Ez nem külön fázis,
hanem **három megkötés most**:

1. **Kétirányú adapter a nulladik naptól.** Ha csak olvasni tudunk, sosem tudjuk kiváltani.
2. **Teljes adatlefedettség a regiszterben.** Amit a HIS tárol és mi nem, azt nem tudjuk
   átvenni. A `03`, `05`, `17` modul lefedettsége ezért nem alkuképes.
3. **Migrációs út tervezve.** A HIS-ből érkező adat `provenance: "imported"`, de a regiszter
   szerint értelmezve — nem külön „örökölt adat" sziget.

---

## 6. EESZT

Változatlan az álláspont: **kutatási státuszban a rendszer nem küld adatot az EESZT-be.**
A kimenő adapter létezik, feature flag mögött, alapból kikapcsolva.

**De a K2 döntés (MDR-megfelelőségi dokumentáció párhuzamosan) ezt idővel megnyitja** — ld.
[`megfeleles/09-mdr.md`](megfeleles/09-mdr.md). Ha a rendszer megfelelőségértékelt eszközzé
válik és ellátási dokumentációt keletkeztet, az EESZT-beküldés kötelezettséggé válik
(ld. `megfeleles/03-magyar-jog.md` 3.3, **K11**).

Ami már megvan: `eeszt_patient_links` (kapcsolat, hozzájárulás-státusz, szinkron-időbélyeg),
`appointments.eeszt_idopont_id` + `sync_statusz`, és az `EesztAppointmentGateway` absztrakció
Noop- és JIR-adapterrel.

---

## 7. Azonosítás — három rendszer, sok kulcs

| Kulcs | Kiadó | Hol él |
|---|---|---|
| `patients.id` (UUID) | OGDOC | belső |
| `taj` | állam | `patients`, `phi: true` |
| HIS törzsszám / esetszám | e-MedSolution | `patient_external_ids` |
| DICOM `PatientID`, `StudyInstanceUID`, `AccessionNumber` | OGDOC / modalitás | `patient_external_ids` + képi rekord |
| EESZT azonosítók | EESZT | `eeszt_patient_links` |
| `donor_code`, `research_pseudonym` | OGDOC | biobank / kutatás |

A **`patient_external_ids`** tábla (`patient_id`, `system`, `value`, `assigner_oid`,
`valid_from`, `valid_to`) enélkül minden integráció oszlopokat adna a `patients` táblához,
ami két rendszer után szétesik.

---

## 7/b. A határ négy kapuja — `core/interop/`

*A fenti fejezetek a CSATORNÁKRÓL szólnak. Ez arról, hogy mi történik ott,
ahol az idegen üzenetből adat lesz — és ez a rendszer legveszélyesebb pontja,
mert a küldő rendszerről sem a mértékegység-fegyelmét, sem a
betegazonosítási pontosságát nem feltételezhetjük.*

### Miért más ez, mint az előéleti import

A `26` modul azt mondta ki, hogy a **gépi kinyerés állítást ad, nem adatot** —
egy PDF-ből olvasott szám emberi megerősítés nélkül nem kerül a rekordba. Itt
más a helyzet, és a különbséget ki kell mondani:

> **Egy akkreditált labor HL7-üzenete nem ugyanaz, mint egy PDF-ből kinyert
> szám.** Az akkreditált mérés provenienciája `device` — a klinikus alatt, a
> betegbemondás fölött.

Ha minden beérkező laborértéket emberi jóváhagyáshoz kötnénk, a klinikus két
nap alatt megtanulná végigkattintani, és a kapu értéktelenné válna. A kapu
ezért nem az, hogy „ember erősítse meg minden számot", hanem:

| Kapu | A kérdés | Ha nem stimmel |
|---|---|---|
| **1. azonosság** | kihez tartozik? | téves párosításnál **másik beteg** leletét tennénk ide |
| **2. fogalom** | ugyanarról szól? | két hasonló nevű vizsgálat felcserélése döntést fordít meg |
| **3. mértékegység** | milyen egységben? | a néma átváltás a klasszikus gyilkos hiba |
| **4. a műszer állapota** | működött? | bukott QC-jű POCT-mérés **nem eredmény** |

### A betegpárosítás: legalább két független azonosító

**A név soha nem elég, és önmagában nem is számít bele.** Névazonosság
mindennapos, és éppen ott téved, ahol a legdrágább: testvéreknél és azonos
nevű anya-lányánál.

És a legfontosabb szabály, amit könnyű elrontani:

> **Ellentmondás esetén nincs párosítás — akkor sem, ha több azonosító
> egyezik, mint amennyi ellentmond.**

Ez nem „2:1 a párosítás javára". Az ellentmondás azt jelenti, hogy
**valamelyik rendszerben rossz adat van**, és amíg ez nem tisztázódik, a lelet
nem kerül rekordba.

Eltérő név egyező azonosítók mellett `review`: lehet névváltozás (házasság),
elgépelés vagy téves azonosító — emberi döntés kell hozzá.

### A POCT külön eset

A `qc` kapu **csak a POCT-csatornán** fut, és ez szándékos: a laboratórium a
saját akkreditációjával felel az eredményéért, a betegágy melletti készülék
nem. Egy minőségellenőrzésen bukott mérés **nem „bizonytalan eredmény", hanem
nem eredmény** — a készülék ezt tudja, a mi dolgunk az, hogy elhozzuk az
üzenettel együtt.

Ismeretlen vagy lejárt QC: várakoztatás, nem elutasítás — a kettő különbsége
az, hogy tudjuk-e, mi történt.

### A megállított lelet nem tűnhet el

> **Egy kapu, ami megállítja az üzenetet, és utána senki nem nézi meg, nem
> biztonsági intézkedés, hanem csendes adatvesztés — csak lassabb.**

A várakozó sornak ezért **kora** van, és a kor önmagában riasztás
(`queueReport`). Ugyanaz a szerkezet, mint a forrásrendszer leletlapjain
talált **„Megrendelve ≠ Eredmény"** párnál: a kintlévőség önálló állapot,
amit valakinek utána kell járnia.

### A kimenő irányban ugyanez, tükrözve

A `planRetry()` exponenciálisan vár, **de nem örökké**: a végtelen
újrapróbálkozás rosszabb, mint a feladás — a sor feltöltődik, a fogadót
nyomjuk, és közben senki nem tudja, hogy baj van. A sorozat vége ezért
`escalate`: **emberhez fordul.**

És a küszöb **klinikai üzenetnél szigorúbb**. Egy kritikus laborérték
továbbításánál az ötödik sikertelen próbálkozás nem üzemeltetési esemény,
hanem betegbiztonsági:

> „Az üzenet nem ért célba, és valakinek fel kell hívnia a telefont. A gép
> ennél többet nem tud tenni, és a további próbálkozás csak elfedné a bajt."

**23 teszt** védi a fentieket (`test/interop.test.ts`).

---

## 8. Outbox és megbízhatóság

```sql
sync_outbox (
  id, tenant_id, resource_type, resource_id, direction,
  channel,          -- eeszt | his | pacs | lis | poct | research
  payload_json, idempotency_key,
  status,           -- pending | sent | failed | skipped
  attempts, last_error, external_ref,
  created_at, sent_at
)
```

Az edge runtime rövid életű, a külső rendszerek lassúak és megbízhatatlanok, és egy klinikai
adat elküldése nem veszhet el egy timeouton. Az outbox-ot `pg_cron` üríti — ami a platformon
már működik.

**Minden csatornára három adapter-megvalósítás:**

1. **`NoopAdapter`** — naplóz, nem küld. Fejlesztéshez és kutatási üzemhez.
2. **`RecordingAdapter`** — előállítja és **elmenti** a kimenő üzenetet, de nem küldi.
   Ezzel validálható a helyesség a csatlakozás előtt.
3. **Éles adapter** — a tényleges szolgáltatás.

---

## 9. Mit csinálunk most, és mit nem

**Most (Fázis 0–1):**
- `patient_external_ids`, `sync_outbox`
- `standards.fhir` kitöltése a regiszterben
- FHIR-leképező + `RecordingAdapter` minden csatornára
- **Orthanc telepítése és a MWL/MPPS lánc** — ez a `05` képalkotás előfeltétele
- e-MedSolution interfész-adatlap beszerzése (5. pont) — beszerzési feladat

**Később:**
- éles HIS-csatlakozás (szerződéses)
- EESZT-csatlakozás (engedély, tanúsítvány, tesztkörnyezet — hónapok)
- LIS/POCT middleware illesztés (eszközparkfüggő)

## 10. Nyitott kérdések

1. **Melyik HL7 v2 verzió** és **milyen Z-szegmensek** az e-MedSolution oldalán?
2. **Van-e POCT middleware** az intézményben, vagy azt is nekünk kell?
3. **Az Orthanc üzemeltetése** kié — és hol tárol?
4. A HIS párhuzamos kiváltásának **időhorizontja** — ez befolyásolja, mennyire teljes
   adatlefedettségre kell törekedni a `03`/`05`/`17` modulban.
