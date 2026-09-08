# 11 — Integrált minőségirányítás: négy szabvány, egy rendszer

> **Döntés (K9): igen.** Cél az **ISO 20387** akkreditáció és a **BBMRI-ERIC** csatlakozás,
> és emellett az **ISO 9001**, az **ISO/IEC 17025** és az **ISO 15189**.
>
> **Döntés (K19): a hatókör TELJES.** Mind a három tevékenység benne van —
> betegdiagnosztikai laboratórium, kutatási vizsgálat és kalibrálás, valamint
> biobank. Egyik szabvány sem esik ki.

---

## 1. Először a legfontosabb tisztázás

**Ez a négy szabvány nem szoftvert tanúsít, hanem szervezetet és tevékenységet.**

| Szabvány | Mit tanúsít / akkreditál | Az OGDOC szerepe benne |
|---|---|---|
| **ISO 9001:2015** | egy szervezet minőségirányítási rendszerét (**tanúsítás**) | a QMS egyik eszköze |
| **ISO/IEC 17025:2017** | egy **vizsgáló- vagy kalibrálólabor** kompetenciáját (**akkreditáció**) | a vizsgálati rekord és a nyomonkövethetőség hordozója |
| **ISO 15189:2022** | egy **orvosi laboratórium** minőségét és kompetenciáját (**akkreditáció**) | ugyanaz, betegdiagnosztikai környezetben |
| **ISO 20387:2018** | egy **biobank** kompetenciáját (**akkreditáció**) | a minta-életciklus és a nyomonkövethetőség rendszere |

Ebből két gyakorlati következmény adódik, és mindkettőt érdemes a Fázis 0-ban kimondani:

1. **Az akkreditáció alanya nem az OGDOC, hanem az intézmény adott egysége.** A szoftver
   attól lesz értékes, hogy a követelmények teljesítését **bizonyíthatóvá** teszi — rekordot,
   őrzési láncot, verziót, auditnyomot és kompetencia-nyilvántartást ad. A tanúsítványt nem a
   szoftver kapja.
2. **A hatókört egységenként kell kijelölni.** Nem „az intézmény ISO 15189-es lesz", hanem
   „ez a labor, ezekre a vizsgálatokra". Ez az egyik legdrágább félreértés a területen.

---

## 2. Hol húzódnak a határok — és hol fedik át egymást

A négy szabvány **nem párhuzamos**, hanem részben egymásba ér. A leggyakoribb hiba, hogy
ugyanarra a tevékenységre kettőt is ráhúznak.

```
                    ┌─────────────────────────────────────────────┐
   ISO 9001         │  a szervezet egészének minőségirányítása      │
   (tanúsítás)      │  — vevői elégedettség, folyamatszemlélet      │
                    └──────────┬──────────────────────┬────────────┘
                               │                      │
        ┌──────────────────────▼───────┐   ┌──────────▼──────────────────┐
        │  ISO 15189                    │   │  ISO 20387                  │
        │  ORVOSI labor —               │   │  BIOBANK — gyűjtés,         │
        │  betegdiagnosztikai vizsgálat │   │  tárolás, kiadás            │
        │  (a POCT is ide került 2022-  │   │  NEM fedi a vizsgálatot     │
        │   ben, ld. lent)              │   │                             │
        └──────────────────────┬────────┘   └─────────────────────────────┘
                               │
        ┌──────────────────────▼────────────────────────┐
        │  ISO/IEC 17025 — vizsgálat és kalibrálás,      │
        │  ami NEM betegdiagnosztika:                    │
        │  kutatási assay, eszközkalibrálás              │
        └────────────────────────────────────────────────┘
```

### 2.1 A három szétválasztandó tevékenység

| Tevékenység | A helyes szabvány | Miért nem a másik |
|---|---|---|
| Betegből vett minta vizsgálata **diagnosztikai céllal** | **ISO 15189** | a 17025 nem kezeli a betegellátási kontextust: a rendelést, a kritikus lelet közlését, a klinikai értelmezést |
| **Kutatási** assay, ami nem betegellátási döntést szolgál | **ISO/IEC 17025** | a 15189 orvosi laboratóriumot feltételez, betegellátási felelősséggel |
| Minta **gyűjtése, tárolása, kiadása** — vizsgálat nélkül | **ISO 20387** | a 20387 kifejezetten **nem** terjed ki a mintán végzett analitikai vizsgálatra |

### 2.1b A hatóköri döntés (K19): mind a három tevékenység

| Tevékenység | Szabvány | Hatókör |
|---|---|---|
| Betegdiagnosztikai laborvizsgálat | **ISO 15189:2022** | teljes, a POCT-tel együtt |
| Kutatási assay és kalibrálás | **ISO/IEC 17025:2017** | teljes |
| Minta gyűjtése, tárolása, kiadása | **ISO 20387:2018** | teljes, a reprodukciós tárolással együtt (K13) |
| A szervezet minőségirányítása | **ISO 9001:2015** | mindhármat átfogja |

**Ez a maximális hatókör.** Ami ebből következik, és amit érdemes a tervezéskor beárazni:

- a **négy szabvány négy külön akkreditációs/tanúsítási eljárás**, saját auditciklussal,
  felügyeleti auditokkal és díjszabással;
- a 15189 és a 17025 **laboratóriumi szakmai munkát** kíván, amit szoftver nem vált ki:
  módszervalidálás, mérési bizonytalanság, jártassági vizsgálatokban való részvétel,
  metrológiai visszavezethetőség;
- a teljes hatókör mellett az integrált rendszer **nem opció, hanem szükségszerűség** —
  négy különálló rendszer üzemeltetése a gyakorlatban nem tartható.

> **A Fázis 0 első megfelelési feladata** így nem a hatókör eldöntése (az megvan), hanem
> a **tevékenységek és egységek tételes felsorolása** — melyik labor, mely vizsgálatokra,
> mely eszközökkel. Az akkreditációs kérelem ezt kéri, és ez a lista lesz a
> dokumentumfa gyökere.

### 2.2 Amit az ISO 15189:2022 megváltoztatott

A 2022-es kiadás **beolvasztotta a betegágy melletti vizsgálat (POCT)** követelményeit, és
ezzel a korábban külön ISO 22870 visszavonásra került. Ez az OGDOC szempontjából közvetlen
következménnyel jár: a **POCT1-A2 integráció** (ld. [`../08-interoperabilitas.md`](../08-interoperabilitas.md))
nem kényelmi funkció, hanem megfelelési elem — az ágy melletti vércukor üzemeltető-azonosítás,
tételszám és QC-állapot nélkül nem auditálható.

> A kiadásévet és a visszavont szabvány számát a hivatalos szabványpéldányból **ellenőrizni
> kell** `[ellenőrizendő]`. A szabványok szövege szerzői jogvédett, itt nem idézhető.

---

## 3. Egy rendszer, négy hatókör

**Négy szabvány nem jelent négy minőségirányítási rendszert.** Ha külön épülnek, négy
dokumentumfa, négy auditprogram és négy helyesbítő nyilvántartás lesz belőle, amiket senki
nem tart szinkronban. A helyes felépítés **egy integrált rendszer**, szabványspecifikus
mellékletekkel.

### 3.1 Ami közös — egyszer épül, mind a négyet szolgálja

| Közös elem | Hol él az OGDOC-ban |
|---|---|
| Dokumentum- és feljegyzésirányítás | 25. modul: verziózott, jóváhagyott dokumentumfa |
| **Nemmegfelelőség és helyesbítő tevékenység (CAPA)** | egy nyilvántartás, szabvány-címkével |
| Belső audit programja | egy terv, hatókörönként bontva |
| Vezetőségi átvizsgálás | egy ülés, minden hatókörre kiterjedő napirenddel |
| Kompetencia és képzés | 19. modul: HR-karakterlap, kompetencia-mátrix |
| Eszköznyilvántartás, kalibrálás, karbantartás | 22. modul eszköz-táblái, kiterjesztve |
| Kockázatalapú gondolkodás | egy kockázati nyilvántartás |
| Beszállító- és szolgáltatóértékelés | egy lista |
| **Panasz- és eltéréskezelés** | egy csatorna |

### 3.2 Ami szabványspecifikus

| Szabvány | Amit külön kell megcsinálni |
|---|---|
| **ISO 9001** | folyamattérkép, vevői elégedettség mérése, minőségcélok |
| **ISO/IEC 17025** | módszervalidálás, **mérési bizonytalanság**, metrológiai visszavezethetőség, jártassági vizsgálat |
| **ISO 15189** | preanalitika a betegtől, **kritikus lelet közlése és annak visszaigazolása**, klinikai értelmezés, referenciatartományok, betegtájékoztatás |
| **ISO 20387** | minta-életciklus, SPREC-preanalitika, gyűjtemény-metaadat, kiadási politika, adományozói jogok |

> **A `05-mir-dokumentumfa.md` ~35 SOP-ja ennek megfelelően bővül** — de nem négyszereződik.
> A közös SOP-ok egy példányban élnek, és a hatókörük felsorolja, mely szabványokat szolgálják.

---

## 4. Amit a szoftvernek adnia kell

Ez az a rész, ami **fejlesztési feladat**, nem szervezési. Mind a négy szabvány ugyanazt a
hat dolgot kéri, csak más néven:

| Követelmény | Az OGDOC megoldása | Állapot |
|---|---|---|
| **Minden rekord visszakereshető és megváltoztathatatlan** | `superseded_by` lánc `UPDATE` helyett; az auditnapló nem szerkeszthető | tervezve (M2, M4) |
| **Minden érték eredete ismert** | `provenance` · `confidence` · `sourceRef` · `t` vs `recordedAt` | **kész** |
| **A használt módszer és verzió visszakereshető** | kalkulátorok `source.cite` és `verified` jelöléssel; `codeSystem.version` az értéken | **kész** |
| **Kompetencia és jogosultság bizonyítható** | 19. modul kompetencia-mátrix + 25. modul szerepkezelés, összeférhetetlenségi kényszerrel | tervezve (M4) |
| **Eszköz, kalibrálás, környezet naplózott** | 22. modul eszköz- és hőmérséklet-nyilvántartás | tervezve (M2–M4) |
| **Az eltérés lefutó folyamat, nem jelölés** | biobanki eltéréskezelés hatásvizsgálattal | tervezve (M4) |

A harmadik sor a legfontosabb, és **ez már működik**: a kalkulátor-réteg minden képlethez
tárolja az elsődleges forrást és azt, hogy a konstansai vissza vannak-e ellenőrizve; az
osztályozási készletek verziója pedig a rögzített értékre bélyegződik. Egy akkreditációs
auditon a leggyakoribb kérdés éppen ez: *„honnan tudja, hogy ez az érték melyik módszerrel
és melyik verzió szerint készült?"*

---

## 5. Sorrend és reális átfutás

**Nem lehet mind a négyet egyszerre.** A sorrendet az szabja meg, hogy melyik alapoz meg melyiket.

| # | Lépés | Miért itt | Reális átfutás |
|---:|---|---|---|
| 1 | **ISO 9001 tanúsítás** | ez adja a közös vázat: dokumentumirányítás, CAPA, audit, vezetőségi átvizsgálás | 9–15 hónap |
| 2 | **ISO 20387 akkreditáció** (biobank) | a kutatási cél ezen áll; a 9001 váza már megvan alatta | 12–18 hónap az első kérelemtől |
| 3 | **ISO 15189** — az orvosi laboratórium | a 9001 váza és a 20387 tapasztalata után | 12–24 hónap |
| 3b | **ISO/IEC 17025** — a kutatási vizsgálat és kalibrálás | a 15189-cel részben közös módszertani munka | +6–12 hónap a 15189 után |
| 4 | **BBMRI-ERIC csatlakozás** | MIABIS-alapú gyűjtemény-metaadat kell hozzá, ami a 20387 munkájából megvan | a 2. lépés után, 3–6 hónap |

Magyarországon az **akkreditáció** (17025 · 15189 · 20387) a **Nemzeti Akkreditáló Hatóság**
hatásköre; az **ISO 9001 tanúsítás** akkreditált tanúsító szervezettől szerezhető. A kettő
nem ugyanaz az eljárás, és nem ugyanaz a szervezet végzi.

---

## 6. Amit őszintén jelzek

**A négy szabvány együtt jelentős, folyamatos szervezeti terhet jelent.** Nem egyszeri
projekt: éves belső audit, vezetőségi átvizsgálás, jártassági vizsgálat, felügyeleti
auditok. Egy integrált rendszer ezt kb. **egy teljes állású minőségirányítási vezetőnyi**
munkára fogja le; négy külön rendszer ennek a duplájára.

**Az OGDOC ebből a szoftveres részt fedi le, ami a munka kisebbik fele.** A `22` modul
fejezete már kimondja: a biobank szűk keresztmetszete nem a szoftver lesz, hanem a fizikai és
eljárási réteg. Ez a négy szabványra hatványozottan igaz — a mérési bizonytalanság
kiszámítása, a jártassági vizsgálatokban való részvétel és a metrológiai visszavezethetőség
laboratóriumi, nem informatikai feladat.

**A teljes hatókör (K19) a legnagyobb, amit választani lehetett.** Ez a döntés megszületett,
és a terv ehhez igazodik. Amit ez konkrétan jelent: a fenti sorrend szerint **legalább
három évnyi** folyamatos megfelelési munka az első kérelemtől a negyedik tanúsítványig,
és utána is folyamatos fenntartás.

**Ezért a sorrend nem alkuképes.** A 9001 váza nélkül a másik három párhuzamos
dokumentumfát épít, és az egyszerre nem tartható karban. Aki a 20387-tel vagy a 15189-cel
kezdene — mert az sürgősebb —, kétszer csinálja meg ugyanazt.

**A szabványszövegek szerzői jogvédettek.** Ez a fejezet a szabványok ismert szerkezetéhez
rendel megoldásokat; a fejezet- és pontszámokat a hivatalos példányból ellenőrizni kell.
A dokumentumban egyetlen szabványhely sincs számmal hivatkozva, éppen ezért.

---

## 7. A végrehajtás — eldöntve

**K19: a hatókör teljes. K24: lesz minőségirányítási vezető. K25: a sorrend rendben.**

Ezzel a megfelelési sáv három sarokpontja megvan, és a munka indítható:

| | Döntés | Amit ez jelent |
|---|---|---|
| **Hatókör** | teljes — mindhárom tevékenység | mind a négy szabvány, teljes körrel |
| **Felelős** | **dedikált minőségirányítási vezető** | a szerep megvan, nem mellékfeladat |
| **Sorrend** | 9001 → 20387 → 15189 → 17025 → BBMRI-ERIC | a közös váz épül először |

### 7.1 Egy szabály a szerepre, amit érdemes előre rögzíteni

A minőségirányítási vezető **nem auditálhatja a saját rendszerét**. A belső auditot vagy
egy másik, képzett belső auditor végzi, vagy külső fél — ez mind a négy szabvány
elvárása, és a leggyakoribb megállapítás az első felügyeleti auditokon.

Gyakorlatilag: **legalább két képzett belső auditor** kell, akik egymás területét
auditálják; ezek egyike lehet a minőségirányítási vezető, de a saját területét nem
nézheti.

### 7.2 A belső auditorok — folyamatban (K31)

A kijelölés és a képzés **egy folyamatban** halad a minőségirányítási vezető
felkészítésével. Ez a helyes megoldás: a négy szabvány belső auditja **közös
auditprogramban** fut, tehát az auditoroknak is egy képzésen kell átesniük, nem négyen.

Amit a folyamat végén ellenőrizni kell:

- **legalább két képzett belső auditor**, akik egymás területét nézik;
- a minőségirányítási vezető lehet az egyik, de **a saját területét nem auditálhatja**;
- az auditprogram lefedi mind a négy hatókört, egyetlen éves tervben.

> A megfelelési sávnak ezzel **nincs nyitott kérdése**. Ami hátravan, az végrehajtás:
> a dokumentumfa felépítése, a képzések lefutása és az első kérelem benyújtása.
