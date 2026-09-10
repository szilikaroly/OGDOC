# OGDOC

**Szülészeti és nőgyógyászati integrált dokumentációs és döntéstámogató rendszer**

Egy betegút teljes dokumentációja a panasztól a 42. napos utánkövetésig, **37 modulban,
~4000 dokumentált változóval** — a klinikai dokumentációtól a kórházi működésen és a
foglalkozás-egészségügyön át a kutatási lekérdezésekig.

**Adatbázis-alapú webes rendszer**, ami a meglévő **IntuiCare** platformra épül (230 tábla,
158 route, 407 server function), és amelybe a **SOS24** portál foglalkozás-egészségügyi
doménjei is beolvadnak. A klinikai mag tiszta függvényekből áll, DOM és adatbázis nélkül
tesztelhető. Kifelé minden adat FHIR R4 alakon megy át, hogy a HIS- és EESZT-kapcsolat
adapter-írás legyen, ne adatmodell-átírás.

> **Jelenlegi állapot — 2026. szeptember.** A terv és a változóregiszter mellett fut a
> **klinikai mag** (levezetési motor, kalkulátor-réteg, űrlap- és dokumentációgenerálás),
> a **hitelesítési réteg** és a **webes réteg**, ami a titkosított, láncolt,
> jogosultság- és auditnapló-védett tárolón megy.
>
> <!-- generált: allapot — `npm run docs` írja -->
> A regiszterben **905 változó** áll, és **1953 teszt** fut, 0 hiba.
> A [tizennyolc lépésből](docs/13-18-lepes.md) **3 kész**,
> **15-nél a gépi fele áll, az emberi nem** — aláírás, illetve klinikai olvasat.
> <!-- /generált: allapot -->
>
> **A rendszer valódi betegadaton nem futhat.** A megnevezett blokkoló — „bárki egy
> kérésfejléccel bárkinek kiadhatja magát" — megszűnt: a jelszavas belépés megvan. Ebből
> viszont NEM következik, hogy a kapu felesleges lett. A részleges megoldást teljesnek
> mondani pontosan az a hiba, ami ellen az egész rendszer épül, ezért a kapu
> ([`core/auth/kapu.ts`](core/auth/kapu.ts)) egyetlen kapcsoló helyett **ellenőrizhető
> feltétellista**: hitelesítés, alapértelmezett jelszó lecserélve, TLS, második tényező,
> kulcstár. A kiszolgáló akkor indul éles módban, ha **mind** teljesül — addig
> `OGDOC_SYNTHETIC=1` nélkül el sem indul, és kiírja, pontosan hol tart. A kapu így
> mérőeszköz, nem igen/nem: látszik rajta a haladás, és látszik rajta, mi az, ami **nem
> fejlesztői feladat**.
>
> A rétegenkénti bontás: [`docs/14-allapot.md`](docs/14-allapot.md) — generált, minden
> szám a forrásból, és a `npm run check` **ellenőrzi is**, hogy nem csúszott el.

## Futtatás

```bash
git clone https://github.com/szilikaroly/OGDOC
cd OGDOC
npm run check                      # validálás + tesztek + generált dokumentumok
npm run demo                       # szintetikus betegút végigvezetve
OGDOC_SYNTHETIC=1 npm run web      # webes réteg (valódi betegadaton nem indul)
npm run csomag                     # teljes exportcsomag
```

**Nincs függőség és nincs fordítási lépés**: Node 22 natív TypeScript-futtatással megy,
`npm install` nélkül. A klinikai mag tiszta függvényekből áll — se DOM, se adatbázis.

## A terv

| Dokumentum | Miről szól |
|---|---|
| [`docs/00-pozicionalas.md`](docs/00-pozicionalas.md) | Mi ez, mi nem, szabályozási és adatvédelmi pozíció, célfelhasználók, siker-kritériumok |
| [`docs/01-architektura.md`](docs/01-architektura.md) | Regiszter-vezérelt felépítés, rétegek, **portolhatósági szerződés**, adatmodell, „nincs néma helyettesítés" szabály |
| [`docs/02-valtozo-regiszter.md`](docs/02-valtozo-regiszter.md) | A `VariableDef` séma és a **levezetési motor**: hogyan hivatkoznak és töltik fel egymást a mezők |
| [`docs/03-modulterv.md`](docs/03-modulterv.md) | A 37 modul áttekintése, forrásra bontva — **innen nyílnak a részletes kidolgozások** |
| [`docs/modulok/`](docs/modulok/) | **A modulok önálló, részletes kidolgozása**: adatszerkezet, keresztfeltöltési térkép, képletek, klinikai szabályok, elfogadási kritérium, nyitott kérdések |
| [`docs/04-utemterv.md`](docs/04-utemterv.md) | **A fejlesztési igények pozicionálása** (K×F/R), 8 fázis, elfogadási kritériumok |
| [`docs/05-kockazatok.md`](docs/05-kockazatok.md) | Kockázatok, őszinte hatókör-jelzés, nyitott döntéskérések |
| [`docs/06-webes-migracio.md`](docs/06-webes-migracio.md) | Történeti: az IPRACS Lovable-specifikációja és miért nem azt használjuk |
| [`docs/07-intuicare-alap.md`](docs/07-intuicare-alap.md) | **A platform**: mi van már meg az IntuiCare-ben, és mi marad valóban új munka |
| [`docs/08-interoperabilitas.md`](docs/08-interoperabilitas.md) | **Interoperabilitás**: HL7 v2 és FHIR, DICOM (Worklist, MPPS, SR, waveform), Orthanc, LIS2-A2, POCT1-A2, e-MedSolution, EESZT |
| [`docs/09-sos24-alap.md`](docs/09-sos24-alap.md) | **A SOS24 portál** leltára |
| [`docs/10-mixed-rendszer.md`](docs/10-mixed-rendszer.md) | **A vegyes rendszer**: mit veszünk át a két platformból, mit alakítunk át, mit írunk újra |
| [`docs/11-strukturalt-adat.md`](docs/11-strukturalt-adat.md) | **A szabad szöveg minimalizálása**: hét eszköz helyette, az „egyéb" tanulási csatorna, mérőszámok |
| [`docs/12-15-honapos-terv.md`](docs/12-15-honapos-terv.md) | **A végrehajtási terv**: 15 hónap, öt sáv, hat kapu, hónapról hónapra — és az első két hét naponta |
| [`docs/13-18-lepes.md`](docs/13-18-lepes.md) | **A tizennyolc lépés**: nem ütemterv, hanem SORREND — négy hullámban, mindegyiknél „kész, ha” és „mire épül”. Egyetlen igazi blokkoló van; a hosszú átfutású tételek az első naptól futnak |
| [`docs/14-allapot.md`](docs/14-allapot.md) | **Hol tartunk** — GENERÁLT: minden szám a forrásból, mert egy kézzel írt állapotjelentés fél éven belül hazudik |
| [`docs/15-gui-terv.md`](docs/15-gui-terv.md) | **A felület fejlesztési terve**: hat alapelv, öt képernyőtípus a harminchét modulra, a sebesség terve és amit a felület soha nem dönthet el |
| [`docs/16-fejlesztesi-javaslatok.md`](docs/16-fejlesztesi-javaslatok.md) | **Kétszáz fejlesztési javaslat modulonként**, betegbiztonsági / klinikai / kényelmi súlyozással |
| [`docs/fejlesztes/`](docs/fejlesztes/) | **Fejlesztői dokumentáció**: mag-API, webes architektúra és csontváz, modul-csontváz, mezőkatalógus, szabad szöveg feloldása, **kalkulátorok tételesen**, AI-csatolási pontok, bővítési lehetőségek, **a mag fejlesztése** (naplózás, minőség, mért sebesség, élő mentés) |
| [`docs/megfeleles/`](docs/megfeleles/) | **Megfelelési réteg**: ISO 20387 kontrollmátrix, GDPR-leképezés, magyar jogszabályok, ISBER és BBMRI-ERIC, MIR-dokumentumfa, beleegyezési keret, nyomonkövethetőség, audit |

## Mire épül

| Forrás | Mit ad |
|---|---|
| **Anamnézis-asszisztens v16** | 110 kérdéssoros strukturált anamnézis háromállású válasszal, dinamikus családfa, endokrin modul, ultrahang normogramokkal, BNO/OENO-ajánló, FHIR-export |
| **IPRACS v1.0** | 25+ validált score (fullPIERS, MEOWS, CMQCC, NICHD, Bishop, VBAC, CORI…), partogram, WHO LCG, sürgős/elvonás/újszülött modulok, hard-stop kontraindikáció-kapuk, négyszintű oktatási réteg |
| **ICHOM PCB v5.0 (2025)** | 145 nemzetközi kimenetel-változó, 131 kódlistával, validált PROM-készletekkel |
| **IntuiCare (MedRoster)** | a **platform**: 230 tábla, 158 route, 407 server function — HR, beosztás, műtő, időpont, kérdőívmotor, klinikai mag, partogram, EESZT-kapcsolat csontváza |
| **SOS24 portál** | 71 tábla, 37 edge function — foglalkozás-egészségügy, ISO 45001 kockázatértékelés, munkabaleset, laborrendelés, háziorvosi törzskarton |

A v16 oldaláról a `FEJLESZTOI_KEZIKONYV.md` (architektúra, konvenciók, buktatók) és az
`Anamnezis_v16_kodkonyv.md` (a teljes forrás rétegenként) a részletes hivatkozási alap; az
IPRACS oldaláról a fejlesztői dokumentáció és a Lovable-implementációs specifikáció.

## A központi ötlet

A klinikai tudás nem a felületben él, hanem egy **gépi olvasható változóregiszterben**. Ebből
generálódik minden: az űrlap, a mezőnkénti dokumentáció, a validáció, a keresztfeltöltés, az
export és a teszt.

Minden mezőről tudni lehet, **mi tölti fel** és **mit tölt fel** — és ez a lista nem kézzel írt,
hanem a levezetési gráfból generált, tehát nem tud eltérni a kódtól.

```
registry/  ──→  űrlapok · dokumentáció · validáció · levezetési gráf · export · tesztek
```

## Regiszter

| Fájl | Tartalom |
|---|---|
| `registry/variable.schema.json` | a `VariableDef` JSON Schema |
| `registry/ichom-pcb-v5.seed.json` | 145 ICHOM-változó gépi importja (131 kódlistával) |

## Megfelelés

A biobanki és kutatási réteg a [`docs/megfeleles/`](docs/megfeleles/) alatt van
végigvezetve: **ISO 20387:2018**, **ISBER Best Practices**, **GDPR (EU) 2016/679**,
**BBMRI-ERIC** ajánlások, valamint a **2008. évi XXI.**, az **1997. évi CLIV.** és az
**1997. évi XLVII. törvény** — valamint az **MDR (EU) 2017/745** megfelelőségi
dokumentáció és a **kutatásetikai (ETT) engedélyeztetés**, párhuzamosan építve.

> Ez tervezési és megvalósítási keret, **nem tanúsítvány és nem jogi vélemény**. Az ISO
> 20387 szövege szerzői jogvédett; a kontrollmátrix fejezethivatkozásait a hivatalos
> szabványpéldány alapján ellenőrizni kell. A §-szintű jogi hivatkozásokat jogásznak.

## Használati kategória

**Kutatási, oktatási és belső minőségfejlesztési használat, orvosi felügyelet mellett.**
Nem betegellátási rutinhasználatra. Ez a döntés kiveszi az MDR-megfelelőséget a hatókörből,
de behozza az etikai engedélyt, a kutatási protokollt és a pszeudonimizálást — a részletek a
[`docs/00-pozicionalas.md`](docs/00-pozicionalas.md)-ben.

## Licenc

**MIT** — a teljes szöveg a repó gyökerében: [`LICENSE`](LICENSE).

A HARMADIK FELEK ANYAGAIRA a MIT-engedély **nem terjed ki**, és ezek nagy része
nincs is a repóban. A `LICENSE` fájl tételesen elszámol velük; a két fontos eset:

| Anyag | Licenc | Hol van |
|---|---|---|
| SNOMED CT GPS | CC BY-ND 4.0 — a származék **nem terjeszthető** | `registry/kodok/helyi/` (.gitignore) |
| PRBPERIsk (preeclampsia-modell) | GPL-2.0 — **copyleft, az MIT-tel ütközik** | `registry/kulso/helyi/` (.gitignore) |

Mindkettő **helyben települ**, és a rendszer **adatként** olvassa őket: a
terjesztett mű egyiket sem tartalmazza. A `npm run validate` build-hibát ad, ha
egy ilyen származék mégis a terjesztett fába kerül.

## Fontos

Ez **klinikai döntéstámogató** eszköz: a szakorvosi értékelést nem helyettesíti, és önállóan
diagnózist nem állít fel. Megfelelőségértékelésig **kutatási, oktatási és belső minőségfejlesztési
használatra**, orvosi felügyelet mellett.

A repó **nem tartalmaz beteg-azonosításra alkalmas adatot**; a tesztesetek szintetikusak.
