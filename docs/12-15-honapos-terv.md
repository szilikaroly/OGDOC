# 12 — Tizenöt hónapos végrehajtási terv

**Kezdés: 2026. szeptember (M1) · Zárás: 2027. november (M15)**

Ez a terv a `04-utemterv.md` fázisait naptárra fordítja: hónapról hónapra, sávonként, kapukkal
és elfogadási kritériumokkal.

---

## 0. Amit előre tisztázni kell — kapacitás

A `04-utemterv.md` becslése **10–13 hónap egy fejlesztővel** szólt. **Ez a 15 hónapos terv
nem fér bele egy emberrel** — nem az idő kevés, hanem a párhuzamosság hiányzik: a
klinikai tartalom, az integráció és a szabályozási dokumentáció **nem fejlesztői munka**, és
nem is várhat a fejlesztés végére.

### 0.1 Minimális csapat

| Szerep | Kapacitás | Mit csinál |
|---|---|---|
| **Vezető fejlesztő** | 1,0 FTE | mag, regiszter, levezetés, score-ok, modulok |
| **Integrációs fejlesztő** | 0,5 FTE (M4-től) | HL7, DICOM/Orthanc, LIS2/POCT1, migráció |
| **Klinikai tartalomgazda** (orvos) | 0,4 FTE | változódefiníciók, kódlisták, panaszszótár, lektorálás szervezése |
| **Minőségügyi / szabályozási** | 0,3 FTE | MIR, SOP-ok, ISO 14971, IEC 62304 akta, ETT- és MDR-dosszié |
| **DPO** | meglévő, ~0,1 FTE | DPIA, jogalap, érintetti jogok |
| **Klinikai lektorok** | alkalmi, modulonként 2–4 nap | szakterületi ellenőrzés |
| **Jogász** | alkalmi | 4 nevesített kérdés (K10, K11, K13, MDR in-house) |

**Összesen kb. 2,3 FTE**, ebből 1,5 fejlesztői.

### 0.2 Ha mégis egy fejlesztő van

Akkor a 15 hónap a **G0–G4 kapukig** jut el (M1–M11 tartalma ~M15-ig nyúlik), és kimarad:
a 21. modul portolása, a 12. onkológia, a 7. diéta, a 18. minőségbiztosítás teljes része,
az EKG kép-felismerés, és a LIS2/POCT1 illesztés. **A klinikai tartalom és a szabályozási
sáv akkor is kell** — azok nem fejlesztői órák.

> Ezt a különbséget most érdemes eldönteni, nem a 8. hónapban.

---

## 1. Öt sáv, amelyek párhuzamosan futnak

| Jel | Sáv | Ki |
|---|---|---|
| **FEJ** | fejlesztés | vezető + integrációs fejlesztő |
| **KLIN** | klinikai tartalom és lektorálás | tartalomgazda + lektorok |
| **SZAB** | szabályozás: ETT, MDR, GDPR, MIR | minőségügyi + DPO + jogász |
| **BESZ** | beszerzés és infrastruktúra | projektvezetés |
| **ÜZEM** | migráció, pilot, üzemeltetés | intézmény |

**A sávok nem egymás után jönnek.** A szabályozási sáv átfutása hosszabb, mint a fejlesztésé —
ha az M8-ban indul, az M15-re nem lesz kész.

---

## 2. A kritikus út

```
M1  DPO + DPIA indítás ─┐
M1  etikai bizottság előzetes egyeztetés ─┐
M2  ETT-protokoll + tájékoztató + nyilatkozat ─┤
M3  ► ETT-BEADVÁNY BENYÚJTÁSA ◄──────────────┘
        │
        │  4–6 hónap átfutás (bizottságfüggő)
        ▼
M8  ► ETT-ENGEDÉLY ◄  ──▶ VALÓS ADATGYŰJTÉS INDULHAT (M8-tól)
                       └─▶ biobanki mintavétel (+ jóváhagyott nyilatkozat)
```

**Ebből három dolog következik, és mindhárom kényelmetlen:**

1. **Az M1–M7 fejlesztés szintetikus adaton történik.** Ez nem hátrány — a golden-tesztek
   amúgy is szintetikus fixture-ök —, de a valós használati visszajelzés csak M8-tól jön.
2. **Ha az ETT-beadvány csúszik M3-ról, minden csúszik utána.** Ez a terv legérzékenyebb
   dátuma, és nem fejlesztési feladat.
3. **A biobanki nyilatkozat jóváhagyása külön út** (DPO + jogász + etikai bizottság), és a
   22. modul M9-es indulásához M8-ra kész kell legyen.

### Másodlagos kritikus utak

| Út | Indul | Kell | Mire |
|---|---|---|---|
| e-MedSolution interfész-adatlap | M1 | M4 | HL7-adapter tervezése |
| Orthanc infrastruktúra (szerver, tár, mentés) | M2 | M4 | a képalkotás előfeltétele |
| Validált magyar kérdőív-fordítások (EQ-5D-5L, WHODAS, BSS-R) licencelése | M2 | M9 | 16. modul |
| Fizikai biobank-infrastruktúra (fagyasztó, monitorozás, kalibrálás) | M4 | M9 | első mintavétel |
| Jogi vélemények (K10, K11, K13, MDR in-house) | M1 | M3 | az MDR-sáv iránya |

---

## 3. Hat kapu

Minden kapu **ellenőrizhető állítás**, nem „elkészült" jelölés. Kapun nem megyünk át, amíg a
kritérium nem teljesül.

| Kapu | Mikor | Kritérium |
|---|---|---|
| **G0** — alap áll | M1 vége | golden-tesztek zölden; a CI elszáll körkörös levezetésnél; **BUG-015 javítva** (nincs önkiszolgáló tenant-bootstrap); BUG-009 javítva |
| **G1** — anamnézis-gerinc | M3 vége | a v16 tételei hiánytalanul leképezve, **géppel ellenőrizve**; egy változó felvétele azonnal megjelenik űrlapon, dokumentációban és lekérdezőben |
| **G2** — klinikai adat és export | M6 vége | preeclampsia-eset végigvihető; **fullPIERS hiányzó AST-vel `insufficient`-et ad, nem 0-t**; 10 szintetikus esetből azonosító nélküli ICHOM-CSV, hiányzóadat-riporttal |
| **G3** — keresztmodul-biztonság | M8 vége | **az anamnézisben bejelölt asztma a szülőszobán megállítja a carboprost rendelését**; minden score-nak van referencia-fixture-je |
| **G4** — kutatásra kész | M10 vége | ETT-engedély megvan; hozzájárulás nélkül nincs mintavétel; **visszavonás után az adat egyetlen exportban sem jelenik meg — teszttel** |
| **G5** — pilotra kész | M13 vége | biztonsági audit lezárva; teljesítményteszt; belső audit; szummatív használhatósági értékelés előkészítve |
| **G6** — értékelés | M15 vége | pilot lezárva és értékelve; MDR műszaki dokumentáció összeállítva; döntés a kiterjesztésről |

---

## 4. Hónapról hónapra

### M1 — 2026. szeptember · Alap és kapuk

| Sáv | Feladat |
|---|---|
| **FEJ** | repó, CI, konvenciók, tesztréteg (Vitest + Playwright + Deno + `db lint`) |
| **FEJ** | `VariableDef` séma, betöltő, validátor; **levezetési motor** (computed/prefill/mirror), körellenőrzés, topologikus sorrend |
| **FEJ** | `clinical_observations` kiegészítése: `variable_id`, `confidence`, finomított `provenance` |
| **FEJ** | új táblák: `patient_external_ids`, `sync_outbox`, `study_links`, `registry_versions` |
| **FEJ** | golden-teszt keret + 3 teszt (BMI, MAP, Bishop); hibahatár, ami kiír |
| **FEJ-BIZT** | **BUG-015 újratervezése** (meghívó-alapú tenant-bootstrap); **BUG-009 (P0)** javítása |
| **KLIN** | tartalomgazda kijelölése; 15–20 mintaváltozó definiálása mind a hét adattípusra |
| **SZAB** | **DPO kijelölése**; **DPIA indítása**; ISO 14971 akta megnyitása; IEC 62304 osztályozás; **SOUP-lista** kezdése; **az eszközhatár meghúzása** |
| **SZAB** | jogi kérdések kiadása: K10 (2009-es törvény), K11 (ellátási dokumentáció), K13 (embrió-tárolás), MDR in-house kivétel |
| **BESZ** | **etikai bizottság előzetes egyeztetése**; e-MedSolution interfész-adatlap megkérése |

**► G0**

### M2 — 2026. október · Regiszter-vezérelt felület

| Sáv | Feladat |
|---|---|
| **FEJ** | regiszter-vezérelt **űrlapgenerátor** minden mezőtípusra; meződokumentáció-generátor |
| **FEJ** | **02. modul** — ellátási kontextus (`ctx`), a `clinical_encounters` fölé |
| **FEJ** | FHIR-leképező + **`RecordingAdapter`** minden csatornára |
| **FEJ** | 25. modul: jogosultsági modell, szerepkészlet egyesítése, összeférhetetlenségi szabályok |
| **KLIN** | a v16 anamnézis leképezésének megkezdése (230 tétel → `VariableDef`) |
| **SZAB** | **ETT-protokoll megírása**; betegtájékoztató és a 10 pontos nyilatkozat draftja |
| **BESZ** | Orthanc infrastruktúra terve (szerver, tárolás, mentés); kérdőív-licencek megkeresése |

### M3 — 2026. november · Anamnézis-gerinc · **ETT-beadás**

| Sáv | Feladat |
|---|---|
| **FEJ** | **03. modul teljes**: 230 tétel, háromállású válasz, dinamikus családfa |
| **FEJ** | ICHOM 145 változó magyarítása és `consumers` feltöltése |
| **FEJ** | a `fhir-codes.ts` LOINC-katalógusának beolvasztása |
| **KLIN** | **03. modul lektorálása** (2 lektor, 4 nap) |
| **SZAB** | **► ETT-BEADVÁNY BENYÚJTÁSA** — a terv legérzékenyebb dátuma |
| **SZAB** | a biobanki nyilatkozat jogi és DPO-átvizsgálása |
| **BESZ** | **Orthanc telepítése**, fordított proxy, mentési rend |

**► G1**

### M4 — 2026. december · Státusz és képalkotás-alap

| Sáv | Feladat |
|---|---|
| **FEJ** | **04. modul**: vitális mag + hat szakterületi alszekció; Bishop mint egyetlen `mirror` |
| **FEJ-INT** | **Orthanc + DICOM Modality Worklist + MPPS lánc** (`accession number` végigvezetve) |
| **FEJ** | CARPREG II automatikus kitöltés a státuszból és az echóból |
| **KLIN** | 04. modul lektorálása szakterületenként |
| **SZAB** | GSPR-mátrix váza; kiberbiztonsági koncepció (MDCG 2019-16) |
| **BESZ** | e-MedSolution adatlap **megérkezése** → a HL7-adapter tervezhető |

### M5 — 2027. január · Labor és ultrahang

| Sáv | Feladat |
|---|---|
| **FEJ** | **05.1 labor**: alcsoportok, **terhességi trimeszter-referenciák**, kritikus küszöbök |
| **FEJ** | **05.3 ultrahang**: a v16 normogram-motor portolása és általánosítása |
| **FEJ-INT** | HL7 v2 adapter: **ADT be** (felvétel, elbocsátás, adatmódosítás) |
| **KLIN** | a labor-referenciakészlet **forrásának kijelölése** (K14); normogramok betöltése publikációkból |
| **SZAB** | MIR-dokumentumfa váza; az első irányítási eljárások (QP-01, QP-02) |

### M6 — 2027. február · Panaszszótár és export

| Sáv | Feladat |
|---|---|
| **FEJ** | **01. modul**: kereshető panaszűrlap, OPQRST-attribútumok, `opens` láncok |
| **FEJ** | **Export**: ICHOM CSV, REDCap, FHIR — a kutatási cél miatt előrehozva |
| **FEJ** | adatteljesség-mérés (`qa.completeness.*`, `qa.unknownRate`) |
| **KLIN** | **a panaszszótár ~400 tétele szinonimákkal** — ez a legnagyobb tartalmi tétel, több hét |
| **SZAB** | ISO 14971 akta: a tíz veszélyhelyzet formalizálása intézkedésekkel |

**► G2**

### M7 — 2027. március · A szülészeti score-készlet

| Sáv | Feladat |
|---|---|
| **FEJ** | **fullPIERS, MEOWS, CMQCC v3.0, NICHD, VBAC Grobman, ISTH DIC, omqSOFA, Shock Index, CORI** |
| **FEJ** | mindegyikhez **referencia-fixture**: a publikált példaszámítás reprodukálása |
| **FEJ** | WHO alert/action line a meglévő partogramra; partogram nyomtatási CSS |
| **KLIN** | a score-ok lektorálása, a referencia-példaszámítások összegyűjtése |
| **SZAB** | a golden-tesztek mint **klinikai értékelési bizonyíték** dokumentálása |

### M8 — 2027. április · Terápia, kódolás · **ETT-engedély várható**

| Sáv | Feladat |
|---|---|
| **FEJ** | **06. modul**: PUPHA/ATC törzs, Hale LRC, **hard-stop kapuk**, MEDDB 22 szabálya |
| **FEJ** | **17. modul**: 13 EESZT-kódtörzs (~13 000 tétel), BNO-szabályok, HBCS (szülészeti kör) |
| **FEJ-INT** | HL7 v2: **ORM ki** (vizsgálatkérés), **ORU be** (eredmény) |
| **SZAB** | **► ETT-ENGEDÉLY VÁRHATÓ** → a valós adatgyűjtés indulhat |
| **SZAB** | a biobanki nyilatkozat jóváhagyása → a 22. modul indulhat |
| **BESZ** | fizikai biobank-infrastruktúra készen (fagyasztó, monitorozás, kalibrálás) |

**► G3**

### M9 — 2027. május · Kérdőívek, biobank, lekérdező

| Sáv | Feladat |
|---|---|
| **FEJ** | **08 + 16. modul**: EPDS (HU-validált), Whooley, PPP-rizikó; **az ICHOM 108 PROM-tétele adatbevitel** a meglévő motorba |
| **FEJ** | **22. modul alap**: adományozó, rétegzett beleegyezés, minta-fa, tárolóhely, **append-only eseménylánc** |
| **FEJ** | **20. modul alap**: lekérdezőfa, on-click mezőkijelölés, leíró statisztika, **védőkorlátok** (k-anonimitás, hiányzóadat-kijelzés, kísérőlap) |
| **KLIN/SZAB** | **SOP-01…14 megírása** — a minta-életciklus eljárásai, **a kóddal együtt** |
| **ÜZEM** | **az első valós adatgyűjtés indul** (ETT-engedéllyel) |

### M10 — 2027. június · Genetika és IVF

| Sáv | Feladat |
|---|---|
| **FEJ** | **23. modul**: tanácsadási kapu, NIPT-logika PPV-számítással, szűrés/diagnosztika elválasztása, variánsok és VUS-újraértékelés |
| **FEJ** | **24. modul**: meddőségi kivizsgálás párként, kezelési ciklus, **OHSS-kockázat és kikényszerített mérlegelés** |
| **KLIN** | genetikai és reprodukciós lektorálás |
| **SZAB** | a 24. modul kriotárolási jogi kerete (K13 válasz beépítése) |

**► G4**

### M11 — 2027. július · Szintézis és szerkesztő

| Sáv | Feladat |
|---|---|
| **FEJ** | **09 + 14. modul**: epikrízis öt stílusban, zárójelentés a `clinical_notes` fölé |
| **FEJ** | **13. modul**: ellátás tervezés, vizitrend-generálás, megosztott döntéshozatal |
| **FEJ** | **15. modul**: utánkövetés a `followup_*` motor konfigurálásával |
| **FEJ** | **25. modul szerkesztő**: piszkozat, hatásvizsgálat, négyszemközti jóváhagyás |
| **SZAB** | használhatósági specifikáció (IEC 62366-1), formatív értékelés |

### M12 — 2027. augusztus · EKG, képalkotás, műtő

| Sáv | Feladat |
|---|---|
| **FEJ** | **05.2 EKG** portolása + **kép-alapú felismerés**: kalibrálás, görbe-kinyerés, emberi megerősítés |
| **FEJ** | **05.4 képalkotás**: RTG/CT/MR/magzati MRI sablonok, sugárterhelés-követés, hard-stop |
| **FEJ-INT** | **DICOM SR, waveform, encapsulated PDF** be- és kimenet |
| **FEJ** | **11. modul klinikai tartalma**: WHO checklist, műtéti leírás, ASA, VTE |
| **SZAB** | az EKG-felismerés AI-dokumentációja: adatkormányzás, teljesítmény elkülönített teszthalmazon, PROBAST+AI |

### M13 — 2027. szeptember · Foglalkozás-egészségügy és keményítés

| Sáv | Feladat |
|---|---|
| **FEJ-INT** | **21. modul**: a SOS24 doménjeinek portolása (alkalmasság, ISO 45001, munkabaleset) |
| **FEJ-INT** | **séma-egyesítés**: egészségnaplók, kérdőívmotorok, FEOR-törzs, szerepkörök |
| **FEJ** | teljesítmény-hangolás, terheléses teszt, a lekérdező idősoros operátorai |
| **SZAB** | **belső audit** (ISO 20387 + ISO 13485); biztonsági audit |
| **ÜZEM** | pilot előkészítése: felhasználók kiválasztása, képzés, adatmigrációs próba |

**► G5**

### M14 — 2027. október · Pilot

| Sáv | Feladat |
|---|---|
| **ÜZEM** | **korlátozott éles kutatási használat** egy osztályon, valós felhasználókkal |
| **FEJ** | hibajavítás a pilot visszajelzéseiből — **ez a hónap tartaléka a pilotra megy el** |
| **SZAB** | **szummatív használhatósági értékelés** valós felhasználókkal (IEC 62366-1) |
| **KLIN** | a szabad szöveg arányának mérése (`qa.freetext.ratio`) és a kódlisták javítása |

### M15 — 2027. november · Stabilizálás és dosszié

| Sáv | Feladat |
|---|---|
| **FEJ** | maradék modulok, amennyi belefér: **07 diéta**, **12 onkológia**, **18 minőségbiztosítás** |
| **SZAB** | **MDR műszaki dokumentáció összeállítása**; klinikai értékelési terv; PMS-terv |
| **SZAB** | ISO 20387 önértékelés a kontrollmátrixszal |
| **ÜZEM** | pilot értékelése; **döntés a kiterjesztésről** |

**► G6**

---

## 5. Ritmus

| Ciklus | Mi történik |
|---|---|
| **Kéthetes sprint** | 30 sprint összesen; sprint végén futó demó, nem státuszjelentés |
| **Heti klinikai óra** | a tartalomgazda és a fejlesztő átnézi az aktuális modul változóit |
| **Havi kapuellenőrzés** | a hónap kritériumai teljesültek-e; ha nem, **mi csúszik és mit áldozunk** |
| **Negyedéves** | vezetőségi átvizsgálás (`megfeleles/08-audit.md` 11 bemenetével) |
| **Modulzárás** | a modul nincs kész, amíg a klinikai lektorálás le nem zárult |

---

## 6. Mit áldozunk, ha csúszik

**Rögzített sorrend**, hogy ne ad hoc döntés legyen a 10. hónapban:

| Prioritás | Tétel | Következmény |
|---|---|---|
| **Soha** | regiszter, levezetés, „nincs néma helyettesítés", jogosultság, biobanki kapuk | e nélkül a rendszer nem használható |
| **Soha** | ETT- és GDPR-megfelelés | jogi kockázat |
| Utoljára áldozzuk | score-készlet (M7), hard-stop kapuk (M8) | ezek a klinikai érték |
| Csúsztatható | **12. onkológia**, **7. diéta**, **18. minőségbiztosítás teljes része** | önálló bővítés |
| Csúsztatható | **21. modul portolása** (M13) | a SOS24 addig párhuzamosan él |
| Csúsztatható | EKG kép-felismerés (M12) | a kézi bevitel működik |
| Csúsztatható | LIS2/POCT1 (nincs a 15 hónapban) | HL7 ORU-val áthidalható |
| **Nem csúsztatható** | ETT-beadás M3-ban | mindent tol maga után |

---

## 7. Mérőszámok — havonta

| Mutató | Cél |
|---|---|
| Regiszterbe felvett és **lektorált** változók száma | M15-re ~2500 (a ~4000-ből) |
| Golden-tesztek száma és zöld aránya | 100% zöld, minden score-ra fixture |
| `qa.freetext.ratio` | < 10% a klinikai mezőkön |
| Nyitott örökölt hibák (BUG-lista) | M1 után 0 kritikus |
| ISO 20387 kontrollmátrix: ✅ arány | M15-re > 60% |
| SOUP-lista teljessége | 100%, minden release-nél frissítve |
| Modulonkénti lektorálási lefedettség | 100% a lezárt moduloknál |

---

## 8. Amit ez a terv nem tartalmaz

Őszintén, hogy ne érje meglepetés:

- **A HIS párhuzamos kiváltása** — ez a 15 hónapon túli cél; itt csak az előfeltételei
  épülnek (kétirányú adapter, adatlefedettség)
- **EESZT éles csatlakozás** — engedély- és tanúsítványfüggő, nem a fejlesztésen múlik
- **ISO 20387 akkreditációs audit** — az önértékelés M15-re megvan, a külső audit utána
- **MDR megfelelőségértékelés** — a dosszié M15-re összeáll, a bejelentett szervezettel
  való eljárás 12–24 hónap **utána**
- **A 20. modul teljes verziója** (idősoros operátorok, kohorszok teljesítmény-hangolása)
- **BBMRI-ERIC Directory-csatlakozás**

## 9. Az első két hét — konkrétan

Hogy ne az legyen az első kérdés, hogy hol kezdjük:

| Nap | Feladat | Ki |
|---|---|---|
| 1–2 | Repó, CI, konvenciók, tesztréteg felállítása | FEJ |
| 1–2 | **DPO kijelölése**, DPIA-sablon beszerzése | SZAB |
| 2 | **Etikai bizottság megkeresése** előzetes egyeztetésre | BESZ |
| 3 | e-MedSolution interfész-adatlap megkérése | BESZ |
| 3–5 | `VariableDef` séma véglegesítése, JSON Schema validátor | FEJ |
| 4 | **A négy jogi kérdés kiadása** (K10, K11, K13, MDR in-house) | SZAB |
| 5 | Klinikai tartalomgazda kijelölése, első heti óra | KLIN |
| 6–8 | Levezetési motor: computed + körellenőrzés + topologikus sorrend | FEJ |
| 8–10 | **BUG-015 újratervezése és javítása** | FEJ |
| 9–10 | ISO 14971 akta megnyitása, a tíz veszélyhelyzet felvitele | SZAB |
| 10 | **Sprint 1 demó**: egy változó a regiszterből → űrlap + dokumentáció | mind |
