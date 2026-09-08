# 04 — Fejlesztési igények pozicionálása és ütemterv

> **2026-09-01 — a terv alapfeltevése megváltozott.** Az OGDOC nem önálló, egyfájlos eszközként
> épül, hanem az **IntuiCare platform klinikai kiterjesztéseként** (230 tábla, 158 route,
> 407 server function). Ez két dolgot csinál az ütemtervvel: **elhagyja a webes fázist**
> (a platform megvan), és a modulok felét építésből konfigurálássá alakítja. A leltár:
> [`07-intuicare-alap.md`](07-intuicare-alap.md).
>
> Az új összbecslés: **kb. 10–13 hónap**, és a hangsúly áttolódik
> infrastruktúráról **tartalomra** — a klinikai tudás bevitelére és lektorálására.
>
> **Hat új modul is bekerült:** a **20. — statisztika, lekérdezés és tudomány** (a kutatási cél
> kulcsa, és a regiszter teszi lehetővé), valamint a **21. — foglalkozás-egészségügy**, amit a
> SOS24 portál gyakorlatilag készen ad, portolással ([`09-sos24-alap.md`](09-sos24-alap.md)),
> a **22. — biobank és mintakezelés**, a hozzá tartozó teljes megfelelési réteggel
> ([`megfeleles/`](megfeleles/)), a **23. — genetikai tanácsadás és vizsgálatok**, és a
> **24. — IVF és asszisztált reprodukció**, és a **25. — adminisztráció, jogosultságkezelés
> és belső szerkesztő**.

## Pozicionálás: három tengely

Minden fejlesztési igényt három tengelyen helyezünk el. A prioritás nem az én véleményem, hanem
ebből a háromból következik:

- **K — klinikai kritikusság** (1–5): mekkora kárt okoz, ha ez hiányzik vagy hibás
- **F — függőségi mélység** (1–5): hány más dolog vár rá
- **R — ráfordítás** (1–5): mekkora munka

**Prioritás = (K × F) / R.** Ami magas K-jú és magas F-ű, de olcsó, az megy előre — akkor is, ha
látványtalan.

## Amit a „kutatási cél" döntés átrendez

A K2 kérdés eldőlt: **kutatási, oktatási és belső minőségfejlesztési használat** (ld.
`00-pozicionalas.md`). Ez három tételt mozdít el a listán, mindhármat előre:

| Tétel | Volt | Lett | Miért |
|---|---|---|---|
| Export (ICHOM CSV, REDCap, FHIR) | Fázis 4 | **Fázis 2** | Egy kutatási eszköz, amiből nem lehet kinyerni az adatot, használhatatlan. Ez nem kényelmi funkció, hanem a cél maga. |
| Pszeudonimizálás + `phi` jelölés az exportban | nem szerepelt | **Fázis 0** | A TAJ közvetlen azonosító. Utólag kiszűrni a már gyűjtött adatból nem megbízható. |
| Adatteljesség-mérés | Fázis 6 (18. modul része) | **Fázis 2** | Kutatásban az üresen maradt kötelező mező a minta minőségének mérőszáma, nem szépséghiba. |

És egy tételt hátra: az MDR-megfelelőségi munka (klinikai értékelés, műszaki dokumentáció)
**kikerül a hatókörből**. Ami marad belőle, az a forrás- és változáskövetési fegyelem — az
viszont a Fázis 0-ban, mert visszamenőleg nem pótolható.

## Amit a platform átrendez

| Tétel | Volt | Lett | Miért |
|---|---|---|---|
| Webes portolás (H1–H4) | Fázis 7, 8–12 hét | **törölve** | a platform megvan |
| `Store` interfész + localStorage adapter | Fázis 0 | **törölve** | Supabase + RLS a tárolás |
| Build-lánc egyfájlos HTML-hez | Fázis 0 | **törölve** | nem egyfájlos rendszer |
| Regiszter-vezérelt űrlapgenerátor | Fázis 1 | Fázis 1 | marad, de a meglévő komponenskönyvtárra épül |
| **Platform-audit + örökölt hibák javítása** | nem szerepelt | **Fázis 0** | BUG-015, BUG-009 (P0), BUG-007/010/011 |
| **FHIR-leképezés + `RecordingAdapter` + `sync_outbox`** | nem szerepelt | **Fázis 0–1** | a HIS/EESZT-kapcsolat előfeltétele |
| **`patient_external_ids` + `study_links`** | nem szerepelt | **Fázis 0** | három azonosító, három célra |
| 16. modul (PROM-ok) | Fázis 4, teljes fejlesztés | Fázis 3, **adatbevitel** | a `questionnaires` motor kész |
| 11. modul (műtő) | Fázis 5, teljes | Fázis 4, **csak klinikai tartalom** | az erőforrás-tervezés kész |
| 15. modul (utánkövetés) | Fázis 4, teljes | Fázis 3, **konfiguráció** | a `followup_*` motor kész |
| **20. modul (lekérdező)** | nem szerepelt | **Fázis 3 (alap) → 5 (teljes)** | a kutatási cél enélkül nem teljesül |
| **21. modul (foglalkozás-eü.)** | nem szerepelt (a v16 nyitott teendője volt) | **Fázis 4–5, portolás** | a SOS24 készen adja, 4–6 hét átemelés |
| **22. modul (biobank)** | nem szerepelt | **Fázis 2 (alap) → 4** | a v16 nyilatkozata óta nyitott; a megfelelési réteg vele együtt indul |
| **23. modul (genetika)** | a `05` labor és a `12` onkológia résztémája volt | **Fázis 3 → 4, önálló modul** | a tanácsadási kapu jogszabályi követelmény, és a `22` biobank is rá épül |
| **24. modul (IVF)** | csak `ctx.conception` értékként szerepelt | **Fázis 3 → 5, önálló modul** | a v16 `pre-ivf` útvonala már megvan; az OHSS-megelőzés önálló biztonsági funkció |
| **25. modul (admin, szerkesztő)** | nem szerepelt | **Fázis 0 (jogosultság) → 2 (szerkesztő)** | ~4000 változó nem tartható karban fejlesztői ciklussal; és itt oldódik meg a BUG-015 |
| **Interoperabilitási réteg** (`08`) | „HIS/EESZT később" | **Fázis 0–2, jelentősen bővült** | K7: HL7, DICOM MWL/MPPS/SR, Orthanc, LIS2, POCT1 — az MWL a `05` képalkotás előfeltétele |
| **MDR-dokumentáció** | kivéve a hatókörből | **Fázis 0-tól, párhuzamosan** | K2: visszamenőleg nem pótolható bizonyíték kell |
| **EKG kép-alapú felismerés** | nem szerepelt | **Fázis 4** | K4; AI-komponens, külön szabályozási teherrel |

## A pozicionált igénylista

| # | Fejlesztési igény | K | F | R | Prio | Fázis |
|---|---|:-:|:-:|:-:|:-:|:-:|
| A1 | **Változóregiszter séma + betöltő + validátor** | 5 | 5 | 2 | **12.5** | 0 |
| A2 | **Levezetési motor** (computed/prefill/mirror + körellenőrzés + topologikus sorrend) | 5 | 5 | 3 | **8.3** | 0 |
| A3 | **„Nincs néma helyettesítés" szerződés** minden score-ban (`insufficient` állapot) | 5 | 4 | 1 | **20.0** | 0 |
| A4 | Provenance + confidence + validity burok minden értéken | 5 | 5 | 2 | **12.5** | 0 |
| ~~A5~~ | ~~`Store` interfész (localStorage adapter)~~ — **törölve**: Supabase + RLS a tárolás | — | — | — | — | — |
| A6 | Golden-teszt keret (fixture be → várt kimenet ki, Node-ban) | 5 | 4 | 2 | **10.0** | 0 |
| A8 | **Pszeudonimizálás**: `phi` jelölés + azonosító-mentes export | 5 | 3 | 1 | **15.0** | 0 |
| A9 | Hibahatár, ami kiír — a néma réteghiba tilalma | 4 | 3 | 1 | **12.0** | 0 |
| ~~A7~~ | ~~Build-lánc egyfájlos HTML-hez~~ — **törölve**: nem egyfájlos rendszer | — | — | — | — | — |
| A10 | **Platform-audit + BUG-015 (tenant-bootstrap) javítása** | 5 | 5 | 1 | **25.0** | 0 |
| A11 | **BUG-009 (P0)** a `monitoring_thresholds` motorban | 4 | 4 | 2 | **8.0** | 0 |
| A12 | `patient_external_ids` + `sync_outbox` + `study_links` táblák | 4 | 4 | 1 | **16.0** | 0 |
| A13 | FHIR-leképezés + `RecordingAdapter` | 4 | 3 | 2 | **6.0** | 0–1 |
| A14 | `clinical_observations` kiegészítése (`variable_id`, `confidence`, provenance) | 5 | 5 | 1 | **25.0** | 0 |
| B1 | Regiszter-vezérelt űrlapgenerátor (minden mezőtípusra) | 4 | 5 | 3 | **6.7** | 1 |
| B2 | Mezőnkénti dokumentáció-generátor (ⓘ panel + offline fejezet) | 3 | 3 | 2 | **4.5** | 1 |
| B3 | 3. modul: anamnézis portolása v16-ból | 4 | 4 | 3 | **5.3** | 1 |
| B4 | 2. modul: ellátási kontextus (`ctx`) | 4 | 5 | 1 | **20.0** | 1 |
| B5 | ICHOM 145 változó magyarítása + `consumers` feltöltése | 2 | 3 | 3 | **2.0** | 1 |
| C1 | 10. modul: szülőszoba + partogram (IP portolás) | 5 | 3 | 4 | **3.8** | 3 |
| C2 | Score-készlet portolása (fullPIERS, MEOWS, CMQCC, NICHD, Bishop, VBAC, CORI, SI, omqSOFA, DIC) | 5 | 4 | 4 | **5.0** | 2 |
| C3 | Hard-stop kontraindikáció-kapuk (IP) | 5 | 2 | 1 | **10.0** | 3 |
| C4 | 4. modul: státusz, 6 alszekció | 4 | 4 | 4 | **4.0** | 2 |
| C5 | 5.1 labor + terhességi trimeszter-referenciák | 4 | 4 | 3 | **5.3** | 2 |
| C6 | 5.3 ultrahang (v16 portolás + általánosítás) | 4 | 3 | 4 | **3.0** | 2–3 |
| C7 | 1. modul: kereshető panaszszótár (~400 tétel + szinonimák) | 3 | 4 | 4 | **3.0** | 2 |
| D1 | 17. modul: BNO/OENO/HBCS kódolás | 3 | 3 | 3 | **3.0** | 3 |
| D2 | 6. modul: gyógyszerelés + Hale LRC + interakció | 4 | 2 | 4 | **2.0** | 3 |
| D3 | 8. modul: pszichológia (EPDS HU + PPP) | 4 | 2 | 2 | **4.0** | 3 |
| D4 | 5.2 EKG-modul portolása (**kész és visszaellenőrzött** a v16-ban) | 3 | 1 | 2 | **1.5** | 3 |
| E1 | 9/14. modul: epikrízis + zárójelentés generátor | 3 | 2 | 3 | **2.0** | 4 |
| E5 | Kutatási réteg: protokoll-kötés, beleegyezés-állapot, kohorsz-szűrő | 3 | 2 | 3 | **2.0** | 4 |
| E2 | 15/16. modul: utánkövetés + ICHOM PROM-ok | 3 | 2 | 3 | **2.0** | 4 |
| C8 | **Export: ICHOM CSV, REDCap, FHIR R4** — kutatási cél, előrehozva | 4 | 3 | 3 | **4.0** | 2 |
| C9 | Adatteljesség-mérés (hány kötelező mező maradt üresen) | 3 | 2 | 2 | **3.0** | 2 |
| E4 | 13. modul: ellátás tervezés | 3 | 2 | 2 | **3.0** | 4 |
| F1 | 5.4 képalkotás (RTG/CT/MR/magzati MRI) | 3 | 1 | 3 | **1.0** | 5 |
| F2 | 11. modul: műtő | 3 | 1 | 4 | **0.8** | 5 |
| F3 | 7. modul: diéta | 2 | 1 | 2 | **1.0** | 5 |
| G1 | 12. modul: onkológia | 3 | 1 | 5 | **0.6** | 6 |
| G2 | 18. modul: minőségbiztosítás | 2 | 1 | 3 | **0.7** | 6 |
| ~~H1~~ | ~~Webes portolás~~ — **törölve**: a platform megvan | — | — | — | — | — |
| ~~H2~~ | ~~Supabase séma + RLS + auditnapló~~ — **megvan** (230 tábla, RLS, `admin_audit_log`) | — | — | — | — | — |
| ~~H3~~ | ~~PWA offline-first~~ — **megvan** (`public/sw.js`, `manifest.webmanifest`) | — | — | — | — | — |
| ~~H4~~ | ~~Többfelhasználós szinkron~~ — **megvan** (Supabase Realtime) | — | — | — | — | — |
| L1 | **Beleegyezési keret + hozzájárulás-nyilvántartás**, visszavonás lefuttatásával | 5 | 3 | 2 | **7.5** | 1–2 |
| L2 | **Nyomonkövethetőség**: azonosítórendszer, kódkulcs, append-only eseménylánc | 5 | 3 | 2 | **7.5** | 2 |
| L3 | 22. modul alap: minta-fa, tárolóhely, preanalitika (SPREC) | 4 | 2 | 3 | **2.7** | 2 |
| L4 | Minta-életciklus SOP-ok (SOP-01…14) — **nem fejlesztés, dokumentumírás** | 5 | 2 | 3 | **3.3** | 2 |
| L5 | 22. modul: QC, eszközök, kalibrálás, hőmérséklet-monitorozás, NC/CAPA | 4 | 1 | 3 | **1.3** | 3 |
| L6 | 22. modul: gyűjtemények, hozzáférési folyamat, MTA, MIABIS-leképezés | 3 | 1 | 3 | **1.0** | 4 |
| L7 | **DPIA** (GDPR Art. 35) — kötelező, nagy tételű különleges adat | 5 | 3 | 2 | **7.5** | 0–1 |
| L8 | ISO 20387 önértékelés + irányítási eljárások (QP-01…08) | 3 | 1 | 4 | **0.8** | 3–4 |
| P1 | **25. modul: jogosultság + BUG-015 újratervezés** (meghívó-alapú bootstrap) | 5 | 5 | 1 | **25.0** | 0 |
| P2 | **25. modul: regiszter-szerkesztő** piszkozattal, hatásvizsgálattal, négyszemközti jóváhagyással | 4 | 4 | 3 | **5.3** | 2 |
| P3 | 25. modul: kódlista-, kérdőív-, sablon- és SOP-szerkesztő, „egyéb" felülvizsgálati sor | 3 | 3 | 3 | **3.0** | 2–4 |
| Q1 | **Interoperabilitás: FHIR-leképező + `RecordingAdapter`** minden csatornára | 4 | 4 | 2 | **8.0** | 0–1 |
| Q2 | **Orthanc + DICOM Modality Worklist és MPPS lánc** | 4 | 3 | 3 | **4.0** | 1–2 |
| Q3 | HL7 v2 adapter (ADT be, ORM ki, ORU be) | 4 | 3 | 3 | **4.0** | 2 |
| Q4 | DICOM SR / waveform / encapsulated PDF be- és kimenet | 3 | 2 | 3 | **2.0** | 3 |
| Q5 | LIS2-A2 és POCT1-A2 illesztés middleware-en át | 3 | 2 | 3 | **2.0** | 3–4 |
| R1 | **MDR: ISO 14971 akta + IEC 62304 osztályozás + SOUP-lista** | 4 | 3 | 2 | **6.0** | 0 |
| R2 | MDR: GSPR-mátrix, kiberbiztonsági koncepció | 3 | 2 | 3 | **2.0** | 1 |
| R3 | MDR: használhatósági akta (IEC 62366-1), szummatív értékelés | 4 | 1 | 3 | **1.3** | 3 |
| R4 | MDR: klinikai értékelés, PMS/PMCF terv | 3 | 1 | 4 | **0.8** | 3–4 |
| R5 | **ETT-beadvány** (protokoll, tájékoztató, DPIA-állás) | 5 | 3 | 3 | **5.0** | 1 |
| S1 | **EKG kép-alapú felismerés** (kalibrálás, görbe-kinyerés, emberi megerősítés) | 3 | 1 | 4 | **0.8** | 4 |
| M1 | **23. modul: tanácsadási kapu** (pre/post teszt, beleegyezés, váratlan lelet) | 5 | 3 | 2 | **7.5** | 3 |
| M2 | 23. modul: NIPT-logika, PPV-számítás, szűrés/diagnosztika elválasztása | 4 | 2 | 2 | **4.0** | 3 |
| M3 | 23. modul: variánsok, VUS-újraértékelés, kaszkád | 3 | 1 | 3 | **1.0** | 4 |
| N1 | **24. modul: OHSS-kockázat és megelőzés** (kikényszerített mérlegelés) | 5 | 2 | 2 | **5.0** | 3 |
| N2 | 24. modul: meddőségi kivizsgálás és kezelési ciklus | 3 | 2 | 4 | **1.5** | 3–4 |
| N3 | 24. modul: kriotárolás önálló jogi kerettel, rendelkezési döntések | 4 | 1 | 3 | **1.3** | 4 |
| N4 | 24. modul: kumulatív élveszülési arány, regiszter-jelentés | 3 | 1 | 3 | **1.0** | 5 |
| J1 | **20. modul alap**: lekérdezőfa, on-click mezőkijelölés, leíró statisztika | 4 | 2 | 3 | **2.7** | 3 |
| J2 | 20. modul védőkorlátok: k-anonimitás, hiányzóadat-kijelzés, reprodukálhatósági kísérőlap | 4 | 1 | 2 | **2.0** | 3 |
| J3 | 20. modul teljes: idősoros operátorok, kohorszok, mentett lekérdezések | 3 | 1 | 4 | **0.8** | 5 |
| K1 | **21. modul portolása** a SOS24-ből (alkalmasság, ISO 45001, munkabaleset) | 3 | 1 | 4 | **0.8** | 4–5 |
| K2 | A két platform séma-egyesítése (naplók, kérdőívek, FEOR-törzs, szerepkörök) | 3 | 3 | 4 | **2.3** | 4 |
| I1 | EESZT-csatlakozás (engedély, tanúsítvány, tesztkörnyezet) | 3 | 1 | 5 | **0.6** | 6 |
| I2 | HIS-csatlakozás (intézményfüggő, szerződéses) | 3 | 1 | 5 | **0.6** | 6 |

### Amit ez a lista megmutat

A legmagasabb prioritású tételek — **A10** (platform-audit és a tenant-bootstrap biztonsági hiba),
**A14** (a `clinical_observations` kiegészítése), **A3** („nincs néma helyettesítés"), **B4**
(ellátási kontextus), **A12** (azonosító- és szinkron-táblák) — mind **alapozás**, nem klinikai
tartalom.

De a lista összetétele megváltozott. Az eredeti tervben az alapozás építést jelentett; most nagyrészt
**auditot és kiegészítést**: a platform áll, a feladat az, hogy biztonságos legyen, és hogy a
regiszter ráüljön. Ez olcsóbb, de nem elhagyható — **A10 blokkoló**: kutatási adatgyűjtés nem
indulhat el olyan rendszeren, ahol az új tenant első felhasználója bárki lehet.

A kockázat súlypontja is áttolódott. Az eredeti tervben az volt, hogy 2200 változó kezelhetetlenné
válik, ha az alap nem áll. Most az, hogy **a 2200 változó klinikai dokumentációja nem készül el** —
mert az a munka nem automatizálható, és nem is delegálható.

> **A fázisok naptárra fordítva:** [`12-15-honapos-terv.md`](12-15-honapos-terv.md) —
> 2026. szeptembertől 2027. novemberig, hónapról hónapra, öt sávban, hat kapuval.
> **Fontos különbség:** az itteni 10–13 hónapos becslés *egy fejlesztőre* szólt; a 15 hónapos
> terv kb. **2,3 FTE-s csapatot** feltételez, mert a klinikai tartalom, az integráció és a
> szabályozási dokumentáció nem fejlesztői munka, és nem várhat a fejlesztés végére.

## Fázisok

### Fázis 0 — Platform-átvétel és alap (kb. 3–4 hét)

**Kimenet:** auditált, biztonságos platform + működő regiszter-váz. Nincs benne klinikai
tartalom, de a regiszterbe tett bármely változó megjelenik, validálódik, feltölt és
dokumentálódik.

- **Platform-audit**: a modul-audit `REVIEW` tételei élő futással ellenőrizve
- **BUG-015** (tenant-bootstrap: az új tenant első felhasználója bárki lehet) — **blokkoló**
- **BUG-009 (P0)** a `monitoring_thresholds` motorban — a 15. modul alapja
- BUG-007 (hiányzó `recepcio` role-kulcs), BUG-008, BUG-010, BUG-011
- A1–A4, A6, A8, A9: regiszter séma + betöltő + validátor, levezetési motor,
  provenance/confidence/validity, golden-teszt keret, `phi` jelölés, hibahatár
- `clinical_observations` kiegészítése: `variable_id`, `confidence`, finomított `provenance`
- Új táblák: `patient_external_ids`, `sync_outbox`, `study_links`
- 15–20 mintaváltozó mind a hét adattípusra, 3 golden-teszt (BMI, MAP, Bishop)
- **DPIA indítása** (L7) és a jogalap tisztázása — GDPR Art. 35 szerint kötelező
- **DPO kijelölése** — GDPR Art. 37(1)(c) szerint kötelező (nagy tételű különleges adat)
- **P1**: jogosultsági modell + **BUG-015 újratervezése** (meghívó-alapú bootstrap)
- **R1**: ISO 14971 kockázatkezelési akta megnyitása, IEC 62304 osztályozás, **SOUP-lista**
- **Eszközhatár meghúzása** (MDR) — ez a legköltségbefolyásolóbb egyetlen döntés
- **Q1**: FHIR-leképező és `RecordingAdapter`
- e-MedSolution interfész-adatlap **beszerzése** (nem fejlesztés)

**Elfogadási kritérium:** a golden-tesztek zölden futnak; a CI elszáll, ha a levezetési gráfban
kör van; és **BUG-015 javítva** — kutatási adatgyűjtés ezen a hibán nem indulhat el.

### Fázis 1 — Regiszter és anamnézis-gerinc (kb. 4–5 hét)

- B1–B3: regiszter-vezérelt űrlapgenerátor a meglévő komponenskönyvtárra, meződokumentáció,
  a v16 anamnézisének portolása (~230 tétel)
- 02. modul: az ellátási kontextus a meglévő `clinical_encounters` fölé
- A `fhir-codes.ts` LOINC-katalógusának beolvasztása a regiszterbe
- FHIR-leképezés + `RecordingAdapter`

**Elfogadási kritérium:** egy teljes anamnézis felvehető, és a v16-tal összevetve **nem veszett
el tétel** — ez géppel ellenőrizhető. Egy eset FHIR-alakja legenerálható és megvizsgálható.

### Fázis 2 — Státusz, vizsgálatok, export (kb. 6–8 hét)

- 04. modul hat alszekciója (a vitális mag megvan)
- 05.1 labor terhességi trimeszter-referenciákkal, 05.3 ultrahang normogramokkal
- 01. modul: kereshető panaszszótár
- **Export**: ICHOM CSV, REDCap, FHIR — a kutatási cél miatt előrehozva
- Adatteljesség-mérés

**Elfogadási kritérium (klinikai):** egy preeclampsia-eset úgy vihető végig, hogy a fullPIERS a
laborból és a vitálisokból magától feltöltődik, és a hiányzó AST miatt `insufficient`-et ír ki,
nem 0-t.

**Elfogadási kritérium (kutatási):** 10 szintetikus esetből egy gombnyomásra ICHOM-kompatibilis
CSV készül, **azonosító nélkül**, és mellé kiíródik, mely változó hány esetben maradt üresen.

**Elfogadási kritérium (biobank):** hozzájárulás nélkül nem rögzíthető mintavétel, és egy
tetszőleges mintáról egy képernyőn megjelenik a teljes életút. A minta-életciklus SOP-jai
(SOP-01…14) megírva — **mintát gyűjteni írott eljárás nélkül nem szabad.**

### Fázis 3 — Szülőszoba, terápia, kérdőívek (kb. 6–8 hét)

- **A szülészeti score-készlet**: fullPIERS, MEOWS, CMQCC, NICHD, VBAC Grobman, ISTH DIC,
  omqSOFA, Shock Index, CORI — mind referencia-fixture-rel
- WHO alert/action line a meglévő partogramra
- 06. modul: gyógyszerelés, PUPHA/ATC törzs, Hale LRC, **hard-stop kapuk**
- 17. modul: a 13 EESZT-kódtörzs beemelése, HBCS
- 08. és 16. modul: **az EPDS és az ICHOM 108 PROM-tétele adatbevitel** a meglévő
  `questionnaires` motorba
- 15. modul: a `followup_*` protokollok konfigurálása

**Elfogadási kritérium:** az anamnézisben bejelölt asztma a szülőszobán megállítja a carboprost
rendelését. Ez az egy teszt bizonyítja, hogy a keresztmodul-feltöltés működik.

- **20. modul alapja**: a lekérdezőfa, az on-click mezőkijelölés és a leíró statisztika, a
  védőkorlátokkal együtt (k-anonimitás, hiányzóadat-kijelzés, kísérőlap)
- **23. modul tanácsadási kapuja** és a NIPT-logika; **24. modul OHSS-megelőzése** és a
  kezelési ciklus — mindkettő biztonsági funkció, ezért a Fázis 3-ban

**A Fázis 3 végén teljes értékű eszköz van**, ami a v16 és az IPRACS együttes képességét
meghaladja, **kutatási adatot termel, és a klinikus SQL nélkül le tudja kérdezni**.

### Fázis 4 — Szintézis és kimenetel (kb. 4–5 hét)

- 09/14. modul: epikrízis és zárójelentés a meglévő `clinical_notes` fölé
- 13. modul: ellátás tervezés
- 11. modul **klinikai tartalma** (WHO checklist, műtéti leírás, ASA, VTE) — az
  erőforrás-tervezés kész
- 05.2 EKG portolása, 05.4 képalkotás

### Fázis 4 kiegészítés — a 21. modul portolása indul

- **21. modul**: a SOS24 foglalkozás-egészségügyi, kockázatértékelési és munkabaleseti
  doménjeinek átemelése (K1), és a két platform séma-egyesítése (K2): egészségnaplók,
  kérdőívmotorok, FEOR-törzs, szerepkörök

### Fázis 5 — Bővítés (kb. 4–6 hét)

- 07. modul (diéta), 12. modul (onkológia), 18. modul teljes minőségbiztosítási része
- 20. modul teljes: idősoros operátorok, kohorszok, mentett lekérdezések, teljesítmény-hangolás
- 21. modul befejezése

### Fázis 6 — HIS- és EESZT-csatlakozás (a többivel párhuzamosan, engedélyfüggő)

Nem fejlesztési, hanem **engedélyezési és szerződéses** fázis: EESZT-tanúsítvány,
tesztkörnyezet, HIS-oldali kapcsolat. A technikai felkészülés (FHIR-leképezés,
`RecordingAdapter`, `sync_outbox`) a Fázis 0–1-ben megtörtént. Ld. `08-interoperabilitas.md`.

## Teljes becslés

**Kb. 10–13 hónap** egy fejlesztővel, a klinikai tartalom folyamatos szakmai lektorálásával —
— vagyis vissza az eredeti nagyságrendbe, de **lényegesen nagyobb hatókörrel**. A becslés
útja: 9–13 → 6–8 (a platform miatt) → 7–9 (biobank és SOP-ok) → 8–10 (genetika, IVF) →
**10–13** (vegyes rendszer integrációja, interoperabilitási réteg, MDR-sáv, 25. modul).

A növekmény négy tételből jön, és egyik sem elhagyható:

| Tétel | Miért |
|---|---|
| **Vegyes rendszer** (K0) | két platformból átvenni több integrációs munka, mint egyet gazdának venni |
| **Interoperabilitás** (K7) | HL7 + DICOM MWL/MPPS + Orthanc + LIS2 + POCT1 önálló réteg |
| **MDR-sáv** (K2) | párhuzamos dokumentáció; cserébe a későbbi értékelés összeállítás, nem újrakezdés |
| **25. modul** | de ez **megtérül**: nélküle minden kódlista-változás fejlesztői ciklus |

A **Fázis 0–3 (kb. 4–5 hónap)** után önállóan használható eszköz van, ami a v16 és az IPRACS
együttes képességét meghaladja, és kutatási adatot termel.

A hangsúly áttolódott: az eredeti tervben a kockázat az infrastruktúra volt, most a **tartalom**.
~2200 változó klinikai dokumentációjának megírása és lektorálása több munka, mint a motor,
ami mozgatja.

## Amit párhuzamosan kell csinálni, nem utána

| Sáv | Mikor | Miért |
|---|---|---|
| Klinikai lektorálás | folyamatosan, modulonként | utólag 2000 változót átnézni nem fog megtörténni |
| **Etikai engedély (kutatásetikai bizottság)** | Fázis 0-tól indítva | hosszú átfutás, és a bevezetés feltétele — nem a kód készültségén múlik |
| **A biobanki nyilatkozat jóváhagyása** (DPO, jogász, etikai bizottság) | Fázis 1 végéig | **ez blokkolja az első mintavételt** — a v16 óta nyitott |
| MIR-dokumentumfa: minta-életciklus SOP-ok | Fázis 2, a kóddal együtt | utólag nem pótolható: a preanalitikai leírás nem rekonstruálható |
| Kutatási protokoll (kérdésfeltevés, mintanagyság, elemzési terv) | Fázis 1 végéig | enélkül a gyűjtött adat utólag nem publikálható |
| Adatvédelmi (DPIA) | Fázis 4 végéig | a webes fázis nem indulhat el nélküle |
| Validált magyar fordítások beszerzése (EPDS, EQ-5D-5L, WHODAS, BSS-R, BSES-SF, MIBS) | Fázis 2-től | licencfüggő, hosszú átfutás |
| Biobanki nyilatkozat + tájékoztatók jogi jóváhagyása | Fázis 4-ig | a v16-ból örökölt nyitott teendő |
