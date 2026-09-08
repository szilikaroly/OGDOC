# 10 — A vegyes rendszer: mit veszünk át, mit építünk újra

> **K0 eldőlt.** Nem az egyik platform nyeli el a másikat. Az OGDOC **új rendszer**, amely
> mindkét meglévő platformból (**IntuiCare**, **SOS24**) átveszi a **jól megírt és működő
> részeket**, és csak azt építi újra, ami nem illeszthető.

Ez eltér a korábbi javaslattól (`09-sos24-alap.md` 2. pont), amely az IntuiCare-t javasolta
gazdaplatformnak. A vegyes út több munka, de két valós előnye van: **nem örököljük a rossz
részeket**, és a klinikai mag a nulladik naptól a saját architektúránk szerint épül.

---

## 1. A döntés következménye: három kategória

Minden meglévő elem a három közül pontosan egybe kerül.

| Kategória | Mit jelent | Mennyi |
|---|---|---|
| **ÁTVESZ** | változtatás nélkül vagy kis igazítással beemeljük | ~55% |
| **ÁTALAKÍT** | a gondolat jó, a megvalósítás igazítandó a regiszterhez | ~25% |
| **ÚJRAÍR** | nem illeszthető, vagy örökölt hibát hordoz | ~20% |

**A besorolás nem vélemény, hanem kritérium alapján történik:**

1. Van-e teszt rá? (Vitest / Playwright / Deno / RLS-teszt)
2. Illeszkedik-e a regiszter-vezérelt adatmodellhez?
3. Hordoz-e nyitott hibát a modul-auditból?
4. Duplikálódik-e a másik platformon?

---

## 2. Amit az IntuiCare-ből átveszünk

### 2.1 ÁTVESZ — változtatás nélkül

| Elem | Miért |
|---|---|
| **Rétegzés** (`routes` / `components` / `lib/<domain>` / `*.functions.ts` / `*.server.ts`) | pontosan a DOM-mentes `core/` elve, működő konvencióval |
| **Többbérlős szervezeti fa** (`tenants`, `org_units`, `sites`, `clinics`, `floors`) | általánosabb, mint a SOS24 `companies` hierarchiája |
| **RLS-alapfüggvények** (`current_tenant_id`, `has_role`, `can_access_patient`) | szerveroldali, tesztelt jogosultság |
| **Auditnapló** (`admin_audit_log` + `audit_trigger_fn`) | trigger-alapú, megkerülhetetlen |
| **A teljes 19. modul** — HR, beosztás, munkaidő, szabadság, műtő, időpont, üzenetek | működik, és magyar jogszabályi megfeleltetéssel |
| **Kérdőívmotor** (`questionnaires` + 3 tábla) | `licenc`, `cutoffs`, `critical_item_index`, `recall_rules` — gazdagabb, mint a SOS24-é |
| **`followup_*` protokollmotor** | esedékesség-kezelés az egész rendszernek |
| **`clinical_observations`** | FHIR-Observation alakú, LOINC/SNOMED — a regiszter tárolója lesz |
| **`clinical_calculator_results`** | `inputs_json` + `outputs_json`: a score-pillanatkép már így működik |
| **`fhir-codes.ts`** | a változóregiszter csírája |
| **`schedule_explanations`** | a magyarázhatóság elve, működő megvalósítással |
| **i18n / Fordító Stúdió** (`i18n_*`) | 10 nyelv, adatbázis-alapú |
| **CMS** (34 blokktípus) | gazdagabb, mint a SOS24-é |

### 2.2 ÁTALAKÍT

| Elem | Mit igazítunk |
|---|---|
| `clinical_observations` | +`variable_id`, +`confidence`, finomított `provenance` — három oszlop |
| `clinical_calculator_results` | `insufficient` állapot az `outputs_json`-ben |
| `fhir-codes.ts` | kiterjesztés `VariableDef`-fé (~2200 változó, `derivation`, `documentation`, `consumers`) |
| `obstetric_partograms` | + WHO alert/action line, + a hiányzó score-készlet |
| `monitoring_thresholds` | **BUG-009 (P0) javítása**, majd kiterjesztés eszköz-monitorozásra |
| `role_permissions` | + a SOS24 szerepkörei (`uzemorvos`, `munkaltato`, `munkavallalo`, `praxistag`), + kutatói szerep |

### 2.3 ÚJRAÍR

| Elem | Miért |
|---|---|
| `user_roles_bootstrap_admin` | **BUG-015** — az új tenant első felhasználója bárki lehet. Biztonsági hiba, nem javítás kell, hanem újratervezés |
| A klinikai számítások szórt elhelyezése (`scores.ts`, `klinika.eszkozok.*`, `ai-medical`) | egyetlen `core/scores/` lesz, golden-tesztekkel — a képletek átvéve, a szervezés új |

---

## 3. Amit a SOS24-ből átveszünk

### 3.1 ÁTVESZ

| Elem | Miért |
|---|---|
| **A hatlépéses alkalmassági munkafolyamat** (`referrals` → `examinations` → `medical_opinions`) | működő állapotgép, triggerrel |
| **A munkáltatói adatszegregáció** | RLS-ben kikényszerített: a munkáltató csak az alkalmassági eredményt látja. **Ez a minta a kutatói szerephez is** |
| **ISO 45001 kockázatértékelés** (`risk_assessments` + hazards + photos) | valószínűség × súlyosság, intézkedési hierarchia, maradék kockázat |
| **Munkabaleseti jegyzőkönyv** | a hivatalos magyar nyomtatvány teljes mezőkészlete |
| **Kódtárak** (`accident-codes`, `feor-codes`, `teaor-codes`, `icd_codes`) | kész törzsadat |
| **Labor rendelés és árazás** | `calculateDisplayPrice()` **egyetlen központi függvény, unit tesztekkel** — pontosan a mi elvünk |
| **Dokumentum-infrastruktúra** (`document_templates`, `generate-pdf`) | |
| **Tesztréteg-felosztás** | Vitest + Deno integráció + Playwright + `supabase db lint` |
| **`DEBUG-TESZT-MATRIX.md` formátuma** | funkció ↔ fájl ↔ backend ↔ teszt ↔ **debug belépési pont** |
| **`ai-questionnaire-scoring` IDOR-védelme**, `ai-doctor-recommendation` kapcsolat-ellenőrzése | a biztonsági gondolkodás minősége |
| **Anonim rendelés `SECURITY DEFINER` RPC-n át**, Crockford base32 kódgenerálás rejection samplinggel | tesztelt, átgondolt |

### 3.2 ÁTALAKÍT

| Elem | Mit igazítunk |
|---|---|
| `patient_cards` (törzskarton) | szétbontva regiszter-változókra → a `03` anamnézisbe |
| `health_journal` / `food_journal` / `stool_journal` | **egyesítve** az IntuiCare `measurements` / `food_log` / `stool_log`-jával; az AI-képelemzés átkerül |
| `questionnaires` (SOS24) | a kérdőívek **adatként** átkerülnek az IntuiCare motorjába |
| `companies` hierarchia | beilleszkedik az `org_units` fába **külső szervezet**ként |
| Routing (Vite SPA → TanStack Start) | mechanikus átírás |
| Edge functions (Deno → `createServerFn`) | mechanikus átírás |

### 3.3 ÚJRAÍR / NEM VISZÜNK

| Elem | Miért |
|---|---|
| CMS, SEO, marketing (`pages_content`, `seo_*`, `competitor_*`, `web_vitals`) | az IntuiCare CMS-e gazdagabb |
| `email_*` táblák | az IntuiCare Resend-integrációja fedi |
| `appointments` / `appointment_slots` (SOS24) | az IntuiCare-é gazdagabb, EESZT-mezőkkel |

---

## 4. Amit egyik platform sem ad — ez az OGDOC saját munkája

| Elem | Modul |
|---|---|
| **A változóregiszter és a levezetési motor** | a projekt magja |
| Panaszszótár (~400 tétel szinonimákkal) | 01 |
| A v16 anamnézis-tudása (~230 tétel, háromállású válasz, családfa) | 03 |
| Szülészeti score-készlet (fullPIERS, MEOWS, CMQCC, NICHD, VBAC, CORI, ISTH DIC) | 10 |
| Ultrahang normogram-motor | 05 |
| **EKG kép-/szkennelés-alapú felismerés** | 05 |
| Gyógyszerelés: PUPHA/ATC, Hale LRC, hard-stop kapuk, MEDDB | 06 |
| EESZT-kódtörzsek (~13 000 tétel) | 17 |
| Lekérdezőmotor | 20 |
| Biobank | 22 |
| Genetika | 23 |
| IVF | 24 |
| **Admin, jogosultság, belső szerkesztő** | 25 |
| **Interoperabilitási réteg** (HL7, DICOM, LIS2, POCT1) | `08` |

---

## 5. Technológiai alap

A vegyes rendszer az **IntuiCare stackjét** viszi tovább, mert az az általánosabb és
szerveroldali:

```
TanStack Start (React 19 + Vite)  ·  Cloudflare Workers edge  ·  Postgres + Auth + Storage
TypeScript  ·  Tailwind  ·  shadcn/ui  ·  TanStack Query  ·  Zod
Vitest (unit)  ·  Playwright (E2E)  ·  Deno test (edge)  ·  supabase db lint
+ Orthanc (DICOM)  — ld. 08-interoperabilitas.md
```

A SOS24 React 18 + Vite SPA komponensei **átemelhetők**, a routing és az edge-réteg átírandó.

---

## 6. Az átállás menete

**Nem „nagy bumm".** Három sávban, párhuzamos üzemmel:

| Sáv | Mit | Mikor |
|---|---|---|
| **A** — új mag | regiszter, levezetés, score-ok, a 25. modul admin-rétege | Fázis 0–1 |
| **B** — IntuiCare beolvasztás | séma-igazítás, BUG-015/009 javítása, klinikai modulok ráépítése | Fázis 1–3 |
| **C** — SOS24 portolás | foglalkozás-egészségügy, kockázatértékelés, labor rendelés | Fázis 4–5 |

**Adatmigráció:** mindkét rendszer élesben van. A migráció **egyirányú és ellenőrzött**:
export → transzformáció a regiszterre → betöltés → **egyeztető riport** (mi került át, mi nem,
és miért). A régi rendszer addig olvasható marad.

---

## 7. Amit ez a döntés kockáztat

Őszintén: **a vegyes út a legnagyobb integrációs kockázatú a három lehetőség közül.**

| Kockázat | Ellenszer |
|---|---|
| A két platform stílusa és konvenciói eltérnek → hibrid kódbázis | **egyetlen konvenciókészlet** (az IntuiCare-é), és a portolt kód ahhoz igazítva, nem mellé téve |
| A besorolás („átvesz / átalakít / újraír") vitatható és csúszik | a négy kritérium (1. pont) alapján, **elemenként dokumentálva**, nem érzésre |
| Két élő rendszer + egy új = három karbantartandó | szigorú átállási határidők sávonként; a párhuzamos üzem nem cél, hanem átmenet |
| „Átveszünk mindent, aztán majd rendbe tesszük" | az `ÚJRAÍR` kategória nem alkuképes: BUG-015 és a szórt klinikai számítások nem kerülnek be |

> **Ha a projekt egy ponton szűkíteni kényszerül**, a helyes sorrend: a **C sáv** (SOS24
> portolás) tolható, a **B** részlegesen, az **A** nem. A klinikai mag nélkül a többi nem ér
> semmit.
