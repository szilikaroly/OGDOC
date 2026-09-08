# Megfelelési keret — áttekintés

Ez a fejezetsor azt írja le, hogyan felel meg az OGDOC biobanki és kutatási rétege a
vonatkozó szabványoknak és jogszabályoknak. **Nem tanúsítvány és nem jogi vélemény** —
tervezési és megvalósítási keret, amelyre az akkreditáció, az etikai engedélyezés és az
adatvédelmi hatásvizsgálat építhető.

## 1. Amit ez a keret lefed

| Norma | Típus | Mit szabályoz | Hol |
|---|---|---|---|
| **ISO 20387:2018** | szabvány (akkreditálható) | biobanki általános követelmények: kompetencia, pártatlanság, folyamatok, minőségirányítás | [`01-iso20387.md`](01-iso20387.md) |
| **ISO 9001:2015** | szabvány (tanúsítható) | a szervezet minőségirányítási rendszere — a közös váz | [`11-integralt-mir.md`](11-integralt-mir.md) |
| **ISO/IEC 17025:2017** | szabvány (akkreditálható) | vizsgáló- és kalibrálólaboratóriumok kompetenciája | [`11-integralt-mir.md`](11-integralt-mir.md) |
| **ISO 15189:2022** | szabvány (akkreditálható) | **orvosi** laboratóriumok minősége és kompetenciája; 2022 óta a POCT is | [`11-integralt-mir.md`](11-integralt-mir.md) |
| **ISBER Best Practices** | iparági jó gyakorlat | minta-életciklus, tárolás, minőségellenőrzés, katasztrófaterv, költség | [`04-isber-bbmri.md`](04-isber-bbmri.md) |
| **GDPR (EU) 2016/679** | rendelet, közvetlenül hatályos | személyes és **genetikai** adat kezelése, kutatási garanciák | [`02-gdpr.md`](02-gdpr.md) |
| **BBMRI-ERIC** | ajánlás, infrastruktúra | interoperabilitás, MIABIS, hozzáférési politika, ELSI | [`04-isber-bbmri.md`](04-isber-bbmri.md) |
| **2008. évi XXI. tv.** | magyar törvény | humángenetikai adatok, vizsgálatok, kutatások és **biobankok működése** | [`03-magyar-jog.md`](03-magyar-jog.md) |
| **1997. évi CLIV. tv.** | magyar törvény | egészségügy; **emberen végzett orvostudományi kutatás** | [`03-magyar-jog.md`](03-magyar-jog.md) |
| **1997. évi XLVII. tv.** | magyar törvény | egészségügyi és kapcsolódó személyes adatok kezelése | [`03-magyar-jog.md`](03-magyar-jog.md) |
| **BELLA standardok** | akkreditációs standardrendszer | fekvő- és járóbeteg-ellátó intézmények **működése** (nem a szakmai munka) | [`14-bella-mees.md`](14-bella-mees.md) |
| **MEES 2.1** | tanúsítási standard | egészségügyi ellátás irányítási rendszere; a MEES 2.0 tanúsítványok **2027-09-25-én** érvényüket vesztik | [`14-bella-mees.md`](14-bella-mees.md) |

Kiegészítő dokumentumok:

| Fejezet | Tartalom |
|---|---|
| [`05-mir-dokumentumfa.md`](05-mir-dokumentumfa.md) | a minőségirányítási rendszer dokumentumfája: politikák, SOP-ok, űrlapok, feljegyzések |
| [`06-beleegyezes.md`](06-beleegyezes.md) | beleegyezési keret: rétegzett és széles körű hozzájárulás, visszavonás, kiskorú és cselekvőképtelen |
| [`07-nyomonkovethetoseg.md`](07-nyomonkovethetoseg.md) | nyomonkövethetőség, őrzési lánc, azonosítórendszer, kódolás |
| [`08-audit.md`](08-audit.md) | belső audit, vezetőségi átvizsgálás, nemmegfelelőség, helyesbítő tevékenység |
| [`09-mdr.md`](09-mdr.md) | orvostechnikai eszköz-besorolás, kockázatkezelés, szoftver-életciklus |
| [`10-ett.md`](10-ett.md) | kutatásetikai engedélyezés |
| [`11-integralt-mir.md`](11-integralt-mir.md) | **négy szabvány, egy integrált rendszer** — hatókörök, közös elemek, sorrend |
| [`12-eeszt.md`](12-eeszt.md) | **EESZT-megfelelés**: beküldés, lekérdezés, rendelkezés-tisztelet, megőrzés |
| [`13-uzemeltetes.md`](13-uzemeltetes.md) | **helyben üzemeltetés titkosított felhőmentéssel**: kulcskezelés, helyreállítási próba |
| [`14-bella-mees.md`](14-bella-mees.md) | **BELLA és MEES 2.1**: a magyar ellátási keretek, a BELLA pontozás és a MEES 2.1 átmeneti határidői |

---

## 2. Két őszinte megjegyzés, mielőtt bármi más

### 2.1 Az ISO 20387 szövege szerzői jogvédett

A szabvány megvásárolható dokumentum; a szövege itt nem idézhető és nem reprodukálható.
Amit ez a keret ad: a **szabvány ismert fejezetszerkezetéhez rendelt kontrollmátrix**, tehát
hogy melyik követelménycsoportot a rendszer melyik eleme elégíti ki.

> **Kötelező lépés az akkreditáció előtt:** a hivatalos szabványszöveg beszerzése, és a
> mátrix pontról pontra való ellenőrzése ellene. A fejezethivatkozásokat ebben a
> dokumentumban **ellenőrizni kell**, nem átvenni.

Ugyanez igaz az ISBER Best Practices és a BBMRI-ERIC dokumentumokra: a kiadás- és
verziószámot a beszerzéskor kell rögzíteni, mert mindkettő rendszeresen frissül.

### 2.2 A humángenetikai törvény — tisztázva

A kérésben eredetileg egy 2009-es humángenetikai törvény szerepelt. **Ez tisztázódott: a
tárgyat a 2008. évi XXI. törvény szabályozza** — a humángenetikai adatok védelméről, a
humángenetikai vizsgálatok és kutatások, valamint a biobankok működésének szabályairól.
Önálló 2009-es humángenetikai törvény nincs.

A keret ennek megfelelően a **2008. évi XXI. törvényt** dolgozza fel
([`03-magyar-jog.md`](03-magyar-jog.md)). Ha a törvény végrehajtási rendelete is bekerül a
hatókörbe, azt külön kell hivatkozni — a rendeleti szintű részletszabályok
**`[ellenőrizendő]`** jelöléssel szerepelnek, amíg jogász meg nem erősíti őket.

**Általánosabban:** a jogszabályi hivatkozások §-szintű pontosságát jogásznak kell
ellenőriznie. Ez a dokumentum a megfelelés *szerkezetét* adja, nem a jogi véleményt.

---

## 3. Hogyan kapcsolódnak egymáshoz a normák

A négy réteg nem párhuzamos, hanem egymásra épül:

```
┌─────────────────────────────────────────────────────────────┐
│  JOG — amit kötelező                                        │
│  GDPR · 2008. XXI. · 1997. CLIV. · 1997. XLVII.             │
│  → jogalap, hozzájárulás, etikai engedély, adatbiztonság    │
└───────────────────────────┬─────────────────────────────────┘
                            │  a szabvány ezt feltételezi
┌───────────────────────────▼─────────────────────────────────┐
│  ISO 20387 — amit igazolni kell                             │
│  kompetencia · pártatlanság · folyamat · minőségirányítás   │
│  → auditálható, akkreditálható rendszer                     │
└───────────────────────────┬─────────────────────────────────┘
                            │  a jó gyakorlat ezt tölti meg
┌───────────────────────────▼─────────────────────────────────┐
│  ISBER — hogyan csináljuk jól                               │
│  minta-életciklus · tárolás · QC · katasztrófaterv          │
└───────────────────────────┬─────────────────────────────────┘
                            │  ez teszi megoszthatóvá
┌───────────────────────────▼─────────────────────────────────┐
│  BBMRI-ERIC — hogyan illeszkedünk másokhoz                  │
│  MIABIS · Directory · Negotiator · hozzáférési politika     │
└─────────────────────────────────────────────────────────────┘
```

**Gyakorlati következmény:** aki csak az ISO-t teljesíti, jogsértő lehet; aki csak a jogot,
az nem akkreditálható; aki mindkettőt, de MIABIS nélkül, az nem tud együttműködni más
biobankokkal. A négyet együtt kell tervezni — utólag egymásra illeszteni őket drága.

---

## 4. Hatókör: mire vonatkozik és mire nem

### Beletartozik

- A diagnosztikai célból levett minták **maradékának** biobanki tárolása és kutatási
  felhasználása (a v16 nyilatkozat 2. pontja)
- Kifejezetten kutatási célra levett minták
- A mintákhoz kapcsolt **klinikai adat** (az OGDOC teljes regisztere)
- Humángenetikai vizsgálat és annak eredménye
- A minták és adatok **kiadása** kutatóknak, belföldre és külföldre

### Nem tartozik bele

- A rutin diagnosztikai laborműködés (arra az ISO 15189 vonatkozik, nem a 20387)
- Gyógyszervizsgálat (GCP hatálya)
- Szövetbank transzplantációs céllal (külön jogi keret)
- Anonim, semmilyen módon vissza nem azonosítható minta — **de figyelem**: a teljes
  anonimizálás genetikai mintánál gyakorlatilag nem érhető el (ld. `02-gdpr.md`)

---

## 5. Szerepek és felelősségek

| Szerep | Felelősség | Ki lehet |
|---|---|---|
| **Biobank vezető** | a biobank működéséért való átfogó felelősség, erőforrás, vezetőségi átvizsgálás | kijelölt orvos vagy kutató |
| **Minőségirányítási vezető** | MIR fenntartása, belső audit, nemmegfelelőség-kezelés, dokumentumszabályozás | lehet részmunkaidős, de **nem lehet a biobank vezető** |
| **Adatvédelmi tisztviselő (DPO)** | GDPR-megfelelés, DPIA, érintetti jogok, adatvédelmi incidens | GDPR szerint kötelező (közfeladat + különleges adat nagy tételben) |
| **Etikai felelős** | etikai engedélyek nyilvántartása, hozzájárulások érvényessége, hozzáférési kérelmek etikai szűrése | |
| **Mintakezelő** | gyűjtés, feldolgozás, tárolás, kiadás, őrzési lánc | képzett és kompetenciája igazolt |
| **Adatkezelő (kutatási)** | de-identifikálás, kódkulcs kezelése, export | **elkülönítve** a mintakezelőtől |
| **Hozzáférési bizottság** | kiadási kérelmek elbírálása | többtagú, dokumentált döntéssel |

**Összeférhetetlenségi alapszabály:** aki a mintát kiadja, nem dönthet a kiadásról; aki a
kódkulcsot kezeli, nem végezhet kutatást a de-identifikált adaton. Ez a pártatlansági
követelmény gyakorlati vetülete.

---

## 6. Amit ez a keret az OGDOC-tól követel

Nyolc dolog, ami nem opcionális, és amit az architektúrának hordoznia kell:

| # | Követelmény | Hol valósul meg |
|---|---|---|
| 1 | Minden minta és adat **egyedi, tartós azonosító**val, és a kettő összekötése kódkulcson át | `07-nyomonkovethetoseg.md` |
| 2 | **Őrzési lánc**: minden állapotváltozás naplózva, ki–mit–mikor–miért | `22` modul, `audit_log` |
| 3 | **Hozzájárulás állapota** minden mintán és adaton, visszavonhatóan, célhoz kötve | `06-beleegyezes.md`, `gdpr_consents` |
| 4 | A visszavonás **végigfut** a rendszeren: minta megsemmisítése/kizárása, adat kizárása a jövőbeni exportokból | `22` modul |
| 5 | **Etikai engedély** nélkül kutatási kiadás nem indítható | `study_links` + hozzáférési folyamat |
| 6 | Minden folyamat **validált**, a berendezések kalibráltak, az eltérések kezeltek | `05-mir-dokumentumfa.md` |
| 7 | **Minden dokumentum verziózott**, és a feljegyzések megőrzési ideje meghatározott | `08-audit.md` |
| 8 | A rendszer **auditálható**: külső auditor rekonstruálni tudja bármely minta teljes életútját | `07-nyomonkovethetoseg.md` |

---

## 7. Ütemezés

A megfelelési munka **nem külön fázis**, hanem a `04-utemterv.md` fázisaival párhuzamosan fut:

| Fázis | Megfelelési tartalom |
|---|---|
| 0 | jogalap tisztázása, DPO kijelölése, DPIA indítása, azonosítórendszer és őrzési lánc adatmodellje |
| 1 | beleegyezési keret, hozzájárulás-nyilvántartás, etikai engedély beadása |
| 2 | MIR dokumentumfa váza, első SOP-ok, MIABIS-leképezés |
| 3 | teljes SOP-készlet, validálás, belső audit, hozzáférési folyamat |
| 4+ | akkreditációs felkészülés, külső audit, BBMRI-ERIC Directory-csatlakozás |

> **Az etikai engedély átfutása hónapokban mérhető, és nem a fejlesztésen múlik.**
> Ezért indul a Fázis 0-ban, nem akkor, amikor a kód elkészül.
