# Modul 22 — Biobank és mintakezelés

| | |
|---|---|
| **Cél** | A minta teljes életciklusa a levételtől a megsemmisítésig, ISO 20387-konform nyomonkövethetőséggel |
| **Forrás** | ÚJ — de a v16 biobanki nyilatkozata és a platform infrastruktúrája a kiindulás |
| **Becsült változó** | ~180 |
| **Fázis** | 2 (alap) → 4 (teljes) |
| **Függ** | 02, 03, 05, 19; és a megfelelési réteg egésze |

## Mi van már meg

**A v16-ban:** a nyolcpontos tudományos és biobanki hozzájáruló nyilatkozat, önállóan
választható pontokkal, kimondott önkéntességgel és visszavonhatósággal, és azzal a
kijelentéssel, hogy *„a minta és az adat kereskedelmi értékesítése nem történik"*.
A szöveg **sablon**, jóváhagyás nélkül.

**A platformon:** `gdpr_consents` (célhoz kötött hozzájárulás, verzióval és visszavonással),
`admin_audit_log` + `audit_trigger_fn`, `monitoring_thresholds` (hőmérséklet-figyeléshez),
`followup_*` (esedékesség-motor), `document_templates` + `generate-pdf`, `patient_documents`,
`bulk_import_logs`. **A minta-nyilvántartás maga nincs meg** — ez a modul új.

> A megfelelési követelmények teljes kifejtése a [`../megfeleles/`](../megfeleles/)
> könyvtárban: ISO 20387 kontrollmátrix, GDPR-leképezés, magyar jog, ISBER/BBMRI-ERIC,
> MIR-dokumentumfa, beleegyezés, nyomonkövethetőség, audit.

---

## 1. Adatszerkezet

### 1.1 Adományozó és beleegyezés

| Tábla | Tartalom |
|---|---|
| `bb_donor` | `donor_code` (biobanki azonosító), `patient_id` (kódkulcson át), státusz |
| `bb_consent` | melyik nyilatkozat, **melyik verzió**, mely pontokra (10 pont külön), aláírás módja és időpontja, státusz |
| `bb_consent_event` | felvétel · módosítás · **visszavonás** — append-only |

### 1.2 A minta-fa

| Tábla | Tartalom |
|---|---|
| `bb_collection_event` | egy levételi esemény: dátum-idő, levevő, helyszín, `clinical_encounters` hivatkozás |
| `bb_specimen` | „szülő" minta: típus, mennyiség, **preanalitika (SPREC)**, státusz |
| `bb_aliquot` | alikvot: szülő, mennyiség, tárolóhely, `freeze_thaw_count` |
| `bb_derivative` | származék (DNS, RNS, fehérje): forrás-alikvot, izolálási SOP, koncentráció |
| `bb_specimen_event` | **append-only eseménylánc** — ld. `../megfeleles/07-nyomonkovethetoseg.md` |

### 1.3 Tárolás és eszközök

| Tábla | Tartalom |
|---|---|
| `bb_location` | helyszín → eszköz → polc → doboz → pozíció hierarchia |
| `bb_equipment` | fagyasztó, hűtő, centrifuga: azonosító, típus, hőmérsékleti osztály, státusz |
| `bb_calibration` | kalibrálás: dátum, bizonyítvány, következő esedékesség |
| `bb_temperature_log` | folyamatos hőmérséklet-adat, riasztási küszöbökkel |

### 1.4 Gyűjtemény, hozzáférés, kiadás

| Tábla | Tartalom |
|---|---|
| `bb_collection` | **MIABIS-kompatibilis** gyűjtemény: téma, diagnóziskör, korosztály, mintatípusok, méret |
| `bb_access_request` | kérelem: kérelmező, cél, kutatási terv, **etikai engedély azonosítója** |
| `bb_access_decision` | bizottsági döntés: ki, mikor, mit, indoklással |
| `bb_mta` | anyagátadási megállapodás: felek, feltételek, visszaszolgáltatás, publikációs kötelezettség |
| `bb_shipment` | kiadás: mit, kinek, mikor, hőmérséklet-logger, átvételi igazolás |

### 1.5 Minőség és eltérés

| Tábla | Tartalom |
|---|---|
| `bb_qc_result` | mintatípusonkénti QC: DNS-koncentráció, A260/280, integritás, sejt-életképesség |
| `bb_nonconformity` | NC: osztályozás, **hatásvizsgálat**, azonnali intézkedés, értesítés, lezárás |
| `bb_capa` | gyökérok, intézkedés, felelős, határidő, **hatékonyság-ellenőrzés** |

---

## 2. A négy folyamat, amit a modul kikényszerít

### 2.1 Mintavétel — hozzájárulás nélkül nem indul

```
mintavétel rögzítése
   ├─ van érvényes beleegyezés a megfelelő pontra?   ─── nincs ──▶ BLOKKOL
   ├─ humángenetikai vizsgálat?  → megtörtént a genetikai tanácsadás?  ─── nem ──▶ BLOKKOL
   ├─ preanalitikai mezők kitöltve (SPREC)?          ─── nem ──▶ BLOKKOL
   └─ azonosító kiosztása, címke nyomtatása
```

A genetikai tanácsadás blokkolása a **2008. évi XXI. törvény** követelménye, nem
kényelmi funkció. **A tanácsadási folyamat maga a [23. modulé](23-genetika.md)**; a biobank
csak a kapu állapotát olvassa.

> **Az embrió és az ivarsejt NEM ebbe a modulba tartozik.** Jogilag más kategória —
> mindkét fél rendelkezése, válás és haláleset esetére előre rögzített döntés, tárolási
> időkorlát. Ezt a [24. modul](24-ivf.md) kezeli, saját `art_cryo_*` táblákkal; a fizikai
> tárolóinfrastruktúra közös, a jogi keret külön.

### 2.2 Visszavonás — lefutó folyamat, nem jelölés

```
visszavonás rögzítése
   ├─▶ minták státusza → withdrawn, kiadásból kizárva          (azonnal)
   ├─▶ megsemmisítési vagy zárolási feladat                     (SOP-13)
   ├─▶ adat kizárása minden jövőbeni exportból                  (azonnal)
   ├─▶ folyamatban lévő kiadási kérelmek felülvizsgálata
   ├─▶ értesítés a már kiadott minták fogadóinak (MTA szerint)
   └─▶ visszaigazolás az adományozónak
```

### 2.3 Kiadás — etikai engedély nélkül nem indul

```
kérelem ─▶ formai ellenőrzés ─▶ tudományos bírálat ─▶ etikai ellenőrzés
                                                          │
                                    van érvényes engedély? ─── nincs ──▶ BLOKKOL
                                                          │
        ─▶ bizottsági döntés ─▶ MTA aláírás ─▶ kiadás ─▶ szállítás ─▶ átvétel
```

**A kiadás során a rendszer ellenőrzi**, hogy a kiválasztott minták mindegyikén él-e a
megfelelő beleegyezési pont. Egy visszavont adományozó mintája nem kerülhet a listára.

### 2.4 Eltérés — hatásvizsgálattal

Bármely NC (hőmérséklet-eltérés, leltárhiány, QC-bukás) automatikusan felteszi a kérdést:
**mely mintákat érinti, és mi történt velük azóta?** A válasz a `bb_specimen_event` láncból
és a `20` modul lekérdezőjéből jön.

---

## 3. Keresztfeltöltés

**⇦ Mi tölti fel**: `02` (az ellátási epizód, amihez a levétel kötődik), `03` (az anamnézis,
ami a gyűjtemény klinikai jellemzőit adja), `05` (a diagnosztikai labor — **a maradék minta
innen jön**), `19` (személyzet, kompetencia, eszközök).

**⇨ Mit tölt fel**:

| Cél | Mit |
|---|---|
| `05` genetika | a mintából származó vizsgálati eredmény visszaköt a klinikai adathoz |
| `12` onkológia | szövetminta, molekuláris profil |
| **`20` lekérdező** | a gyűjtemények kereshetővé válnak: „hány szérumminta van preeclampsiás terhességből" |
| BBMRI-ERIC Directory | MIABIS-aggregátum a `bb_collection`-ből |
| `18` minőségbiztosítás | QC-trendek, NC-statisztika |

---

## 4. Elfogadási kritérium

1. **Egy tetszőleges mintáról egy képernyőn** megjelenik a teljes életút: levétel,
   hozzájárulás, preanalitika, feldolgozás (SOP-verzióval), tárolás, minden kivétel, QC,
   kiadás, jelenlegi állapot.
2. **Hozzájárulás nélkül nem rögzíthető mintavétel**; humángenetikai vizsgálathoz genetikai
   tanácsadás nélkül sem.
3. **Etikai engedély azonosítója nélkül nem indítható kiadás.**
4. **Visszavonás után** az adományozó mintája egyetlen kiadási listában és egyetlen exportban
   sem jelenik meg — **automatizált teszttel bizonyítva**, nem eljárásrenddel.
5. Egy adott fagyasztó adott időablakára lekérdezhető, mely minták voltak benne — a
   visszamenőleges hatásvizsgálathoz.
6. A kutatói szerepkör egyetlen olyan mezőt sem lát, amiből az adományozó azonosítható.

---

## 4b. A reprodukciós tárolás beolvasztása (K13)

A **24. modul** embrió- és ivarsejt-tárolása ehhez a modulhoz csatlakozik: egy szervezet,
egy minőségirányítási rendszer, egy akkreditációs hatókör. A tárolóhierarchia, az őrzési
lánc, a hőmérséklet-monitorozás és az eltéréskezelés **közös**.

**Amit a modell nem oldhat fel:** a reprodukciós anyag saját jogi keretben él. A
`bb_sample` rekord ezért kap egy **jogi rezsim** mezőt (`biobank` \| `reprodukcio`), és a
rezsim dönti el, mely folyamat fut rá:

| | `biobank` | `reprodukcio` |
|---|---|---|
| Beleegyezés | rétegzett / széles körű, adományozói | **mindkét fél rendelkezése** |
| Kutatási felhasználás | a hozzájárulás szerint | **külön beleegyezés kell, alapból nincs** |
| Tárolási idő | a gyűjtemény politikája szerint | **jogszabályi időkorlát** |
| Rendelkezés válás / haláleset esetén | nem értelmezett | **előre rögzítendő, enélkül tárolás nem indul** |
| BBMRI-ERIC Directory | listázható | **nem listázható** külön rendelkezés nélkül |

Ez a szétválasztás **adatbázis-kényszer**, nem eljárásrend: `reprodukcio` rezsimű mintát a
kutatási kiadási folyamat nem lát.

---

## 5. Fázisozás

| Fázis | Tartalom |
|---|---|
| **2** | adományozó, beleegyezés, minta-fa, tárolóhely, eseménylánc, azonosítórendszer — **plusz a minta-életciklus SOP-jai** (SOP-01…14) |
| **3** | QC, eszközök és kalibrálás, hőmérséklet-monitorozás, NC/CAPA, első belső audit |
| **4** | gyűjtemények, hozzáférési folyamat, MTA, szállítás, MIABIS-leképezés |
| **5+** | akkreditációs felkészülés, BBMRI-ERIC Directory |

> A SOP-ok a Fázis 2-ben kellenek, **a kóddal együtt**. Mintát gyűjteni írott eljárás nélkül
> nem szabad, és utólag nem pótolható: a Fázis 2-ben gyűjtött minták preanalitikai leírása
> nem rekonstruálható.

---

## 6. Nyitott kérdések

1. **A nyilatkozat jóváhagyása** — DPO, jogász, kutatásetikai bizottság. A v16 óta nyitott,
   és **ez blokkolja az első mintavételt**.
2. **Fizikai infrastruktúra**: van-e fagyasztó, tartalék kapacitás, monitorozás, szünetmentes
   ellátás? A szoftver ezt nem pótolja.
3. **Cél-e az ISO 20387 akkreditáció** és a **BBMRI-ERIC csatlakozás**? Mindkettő
   ütemtervet és erőforrást befolyásol.
4. **Ki a biobank vezető és a minőségirányítási vezető?** A kettő nem lehet ugyanaz a személy.
5. **Mely mintatípusokkal indulunk?** A teljes életciklus mintatípusonként külön SOP-ot és
   QC-mutatót kíván; érdemes kettő-hárommal kezdeni (szérum, plazma, buffy coat / DNS).
