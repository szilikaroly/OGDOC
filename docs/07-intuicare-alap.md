# 07 — Az IntuiCare mint platform

Ez a fejezet a terv legnagyobb átértékelése. Az OGDOC eddig **önálló, egyfájlos offline
eszközként** indult volna, későbbi webes migrációval. Ez a feltevés megdőlt: rendelkezésre áll
egy működő, több ezer soros, adatbázis-alapú platform, amely a tervezett 19 modulból jelentős
részt **már megvalósít**.

> **2026-09-01 — a K0 döntés felülírta ezt a fejezetet.** Az OGDOC **vegyes rendszer**:
> mindkét platformból (IntuiCare, SOS24) átveszi a jól megírt és működő részeket, és csak
> azt építi újra, ami nem illeszthető. A besorolás — átvesz / átalakít / újraír — a
> [`10-mixed-rendszer.md`](10-mixed-rendszer.md)-ben van. Ez a fejezet a leltár marad.

## 1. Mi az IntuiCare (MedRoster)

| Metrika | Érték |
|---|---|
| Adatbázis-tábla (`public`) | **230** |
| Postgres enum | 93 |
| SQL migráció | 155 |
| Route | 158 |
| Server function (`createServerFn`) | 407 |
| CMS blokktípus | 34 |
| Nyelv | 10 (hu, en, de, ro, sk, sr, uk, ru, zh, fil) |

### Technológiai réteg

```
Böngésző / PWA
   │  TanStack Start (React 19 + Vite 7), TanStack Query, Tailwind v4 + shadcn/ui
   ▼
Edge runtime (Cloudflare Workers)
   │  createServerFn RPC · requireSupabaseAuth · *.server.ts privilegizált logika
   ▼
Postgres + Auth + Storage (Lovable Cloud / Supabase)
      RLS minden táblán · SECURITY DEFINER függvények · triggerek · pg_cron
```

### Rétegszabályok — ezeket az OGDOC is betartja

| Réteg | Hely | Szabály |
|---|---|---|
| Route / oldal | `src/routes/**` | csak komponáció + `loader` + `head()`; üzleti logika nem itt |
| UI komponens | `src/components/**` | prezentáció, kizárólag szemantikus design tokenek |
| **Domain logika** | `src/lib/<domain>/**` | **tiszta függvények, Zod sémák, számítások** |
| RPC | `src/lib/**/*.functions.ts` | `createServerFn`, kliensből hívható |
| Szerver-only | `src/lib/**/*.server.ts` | admin kliens, AI kulcsok; kliensből soha nem importálható |
| HTTP endpoint | `src/routes/api/**` | webhook, cron, sitemap |

**Ez a rétegzés pontosan az, amit a `01-architektura.md` „DOM-mentes `core/`" néven kért.**
A `src/lib/<domain>/**` a `core/`, a `*.functions.ts` az adapter, a `routes`/`components` az `ui`.
Nem kell új konvenciót bevezetni — a meglévőt kell követni.

## 2. Ami már megvan a klinikai oldalon

### 2.1 `clinical_observations` — ez lényegében a `values` tábla

A `06`-ban megterveztem egy `values` táblát provenance-szal, egységgel, időbélyeggel. **Létezik**,
FHIR-Observation alakban:

| Mező | Mit hordoz |
|---|---|
| `loinc_code`, `snomed_code` | szabványkód |
| `code_display`, `category` | megnevezés, csoport |
| `value_quantity`, `value_unit`, `value_string`, `value_json` | az érték, típus szerint |
| `effective_ts` | **mikor vonatkozik rá** (nem mikor írták be) |
| `source`, `performer_id` | provenance |
| `interpretation` | értelmezés |
| `encounter_id`, `patient_id` | kontextus |

Amit hozzá kell tenni: **`confidence`** (measured / reported / estimated / uncertain),
**`provenance` finomítása** (prefilled / derived külön), és a **`variable_id`** a
regiszterre mutató kulcsként. Ez három oszlop, nem új adatmodell.

### 2.2 `fhir-codes.ts` — ez a változóregiszter csírája

```ts
export type LoincItem = {
  loinc: string; hu: string; en: string; unit: string;
  category: "vital-signs" | "laboratory" | "exam" | "fluid-balance" | "pain" | "survey";
  ref?: { low?; high?; criticalLow?; criticalHigh? };
  step?; min?; max?;
};
```

Ez a `VariableDef` magja: azonosító, kétnyelvű címke, egység, kategória, referencia- és kritikus
tartomány, bevitel-korlátok. **Az OGDOC regisztere ennek a kiterjesztése**, nem a leváltása —
hozzájön a `derivation`, a `documentation`, a `consumers`, a `validity` és a `provenanceAllowed`.

### 2.3 `clinical_calculator_results` — a score-pillanatkép már megvan

| Mező | Mit hordoz |
|---|---|
| `calculator` | melyik score |
| `inputs_json` | **a bemeneti pillanatkép** |
| `outputs_json` | az eredmény |
| `interpretation_md` | értelmezés |
| `encounter_id`, `patient_id`, `created_by` | kontextus |

Ez pontosan az, amit a `01-architektura.md` „minden score-eredmény mellé lementjük azt a bemeneti
pillanatképet, amelyből számolt" néven kért. **Már így működik.** Az `insufficient` állapotot
kell hozzátenni: az `outputs_json`-ben `{status:"insufficient", missing:[…]}`, és a felületnek
ezt kell mutatnia szám helyett.

### 2.4 További kész klinikai infrastruktúra

| Tábla / modul | Mit ad | OGDOC-modul |
|---|---|---|
| `clinical_encounters` | ellátási epizód, típus, státusz, `chief_complaint` | **02** |
| `clinical_diagnoses` | `icd10_code`, `snomed_code`, `certainty`, `is_primary` | **17** |
| `clinical_notes` | `structured_json`, `version`, `signed_at/by`, `ai_generated` | **09, 14** |
| `clinical_critical_alerts` | súlyosság, eszkaláció, nyugtázás, `workflow_status` | vörös zászlók |
| `clinical_alert_escalation_rules`, `clinical_alert_status_log` | eszkalációs lánc | **08, 10** |
| `clinical_therapy_orders` | terápiás rendelés | **06** |
| `obstetric_partograms` + `_entries` | **partogram**: cervix, descent, FHR, kontrakciók, RR, oxytocin, liquor, moulding | **10** |
| `contractions`, `fetal_movements`, `menstrual_cycles` | szülészeti idősorok | **01, 05, 10** |
| `monitoring_programs`, `monitoring_thresholds`, `monitoring_alerts` | küszöb-alapú monitorozás | **15** |
| `measurements`, `wearable_data`, `food_log`, `stool_log` | beteg-oldali mérés | **07, 15** |
| `questionnaires` (+ `_responses`, `_assignments`, `_schedules`, `_event_triggers`) | **kérdőívmotor** `scoring`, `cutoffs`, `critical_item_index`, `licenc`, `recall_rules` mezőkkel | **08, 16** |
| `followup_protocols` + `_steps`, `_enrollments`, `_occurrences` | utánkövetési protokollmotor | **15** |
| `satisfaction_surveys` | elégedettség | **16** |
| `patient_encounters` | `bno_kodok[]`, `oeno_kodok[]`, szerző + ellenjegyző aláírás | **17** |
| `medical-codes.ts` | BNO/OENO seed + kereső | **17** |
| `scores.ts` | CHA2DS2-VASc, HAS-BLED, CKD-EPI 2021, Wells PE, Geneva PE, qSOFA, SOFA, NEWS2, APGAR, **Bishop** | több modul |
| `klinika.eszkozok.*` | diab, embólia, kardio, szepszis, **szülés**, T2DM, vérgáz, vese kalkulátorok | **05, 10** |
| `gdpr_consents` | célhoz kötött hozzájárulás, verzióval, visszavonással | kutatási réteg |
| `eeszt_patient_links` | EESZT-kapcsolat, hozzájárulás-státusz, szinkron-időbélyeg | **HIS/EESZT** |

### 2.5 A `questionnaires` tábla és a 16. modul

A kérdőívmotor **készen áll a validált PROM-készletek fogadására**:

- `items` (JSON) — a tételek
- `scoring`, `cutoffs` (JSON) — pontozás és vágóértékek
- `critical_item_index`, `critical_threshold` — **pontosan az EPDS Q10-szabály** (egyetlen tétel
  önálló vörös zászlója az összpontszámtól függetlenül)
- `licenc` (enum) — **a licencelt kérdőívek nyilvántartása** (EQ-5D-5L, WHODAS, BSS-R)
- `recall_rules`, `mode`, `kioszk_eligible`, `language`
- `questionnaire_responses.subscale_scores`, `critical_triggered`, `is_anonymous`

Az ICHOM 108 PROM-tétele ide **adatként** kerül be, nem kódként. Ez a 16. modul munkáját
adatbevitelre redukálja.

## 3. Ami már megvan a 19. modulból

Gyakorlatilag minden — ld. [`modulok/19-crm.md`](modulok/19-crm.md). Röviden:

| Terület | Táblák | Route |
|---|---|---|
| Dolgozók, HR | `profiles` + `profile_*` (21 tábla) | `/karakterlap`, `/csapat` |
| Munkaidő | `work_time_ledger`, `work_time_rules`, `attendance_*`, `overtime_*` | `/munkaido`, `/jelenlet` |
| Beosztás | `schedule_*` (5), `duty_*` (4), `staffing_*` | `/beosztas` |
| Szabadság | `leave_*` (4), `szabadsag_evente` | `/szabadsag` |
| Műtőfoglalás | `or_*` (6), `surgery_*` (3), `resource_bookings` | `/muteti-terv/*` |
| Időpontfoglalás | `appointments`, `appointment_*` (4), `patient_checkin` | `/foglalas/*`, `/idopontok/*`, `/checkin` |
| Páciens-kommunikáció | `conversations`, `messages`, `message_translations`, `push_*` | `/uzenetek/*`, `/portal/uzenetek` |
| Bejelentkezés | Supabase Auth + `user_roles`, `role_permissions`, `patient_users` | `/auth`, `/portal/*` |
| Kérdőívek | `questionnaires` (4 tábla) | `/kerdoivek/*`, `/kiosk/$token` |

**Jogi megfelelőség is meg van feleltetve**: Mt. 134. §, 140–143. §, Eütev. 12/A–12/G., 13/A.,
14., 528/2020 16. §, GDPR Art. 9 és 20 — mindegyikhez megnevezett tábla vagy trigger.

## 4. Mi marad az OGDOC-ra

A 21 modulból ez az, ami **valóban új munka**:

| Modul | Mi hiányzik | Becslés |
|---|---|---|
| **01 Panaszok** | kereshető panaszszótár (~400 tétel szinonimákkal) | teljesen új |
| **03 Anamnézis** | a v16 ~230 strukturált tétele, háromállású válasszal, családfával | teljesen új |
| **04 Státusz** | a hat szakterületi alszekció (a vitális mag megvan) | nagyrészt új |
| **05 Vizsgálatok** | labor-alcsoportok terhességi referenciákkal, ultrahang-modul normogramokkal, EKG, képalkotás | nagyrészt új |
| **06 Gyógyszerelés** | PUPHA/ATC törzs, Hale LRC, hard-stop kapuk, MEDDB | nagyrészt új |
| **10 Szülőszoba** | a partogram váza megvan; hiányzik a **score-készlet** (fullPIERS, MEOWS, CMQCC, NICHD, VBAC, CORI, ISTH DIC) és a WHO alert/action line | felerészt új |
| **12 Onkológia** | teljes | teljesen új |
| **17 Kódolás** | a 13 beágyazott EESZT-törzs (~13 000 tétel), HBCS | felerészt új |
| **A regiszter és a levezetési motor** | a `fhir-codes.ts` kiterjesztése ~2200 változóra, `computed`/`prefill`/`mirror` | **a projekt magja** |

| **20 Statisztika/lekérdezés** | a teljes lekérdezőmotor — de a regiszter teszi lehetővé | teljesen új |
| **21 Foglalkozás-eü.** | semmi — a SOS24 készen adja, portolni kell | 4–6 hét portolás |

A többi modul (02, 07, 08, 09, 11, 13, 14, 15, 16, 18, 19) **meglévő infrastruktúra
konfigurálása és tartalommal töltése**, nem építése.

## 5. Amit ez a becsléssel csinál

Az eredeti terv 9–13 hónapra becsülte a munkát, ebből 8–12 hét a webes fázis. **A webes fázis
elmarad** (a platform megvan), és a modulok fele konfigurációvá válik.

Reális új becslés: **kb. 6–8 hónap** (ebből egy hónap a két új modul: a 20. lekérdező és a
21. foglalkozás-egészségügy portolása), és a hangsúly áttolódik infrastruktúráról tartalomra —
a klinikai tudás bevitelére és lektorálására.

## 6. Amit örökölünk: nyitott hibák

A modul-audit (2026-06-23, kódstatikus) tizenöt hibát azonosít. Ezek közül az OGDOC szempontjából
lényegesek:

| Hiba | Hol | Miért számít nekünk |
|---|---|---|
| **BUG-009 (P0)** | `/admin/monitoring-szabalyok`, `monitoring_thresholds` | a küszöb-motor a 15. modul alapja |
| BUG-008, BUG-009 | `klinika.*`, `clinical_notes/observations` | a 04/05/09 modul közvetlen alapja |
| BUG-010 | `clinical_alert_escalation_rules` | a vörös zászló eszkaláció |
| BUG-011 | `critical_result_alerts`, `clinical_alert_status_log` | kritikus lelet visszajelzés |
| BUG-007 | `role_permissions` — hiányzó `recepcio` role-kulcs | jogosultság |
| **BUG-015** | `user_roles_bootstrap_admin` — új tenant első felhasználója bárki lehet | **biztonsági**, élesítés előtt kötelező |

> **BUG-015 és BUG-009 a Fázis 0 része.** Egy kutatási adatgyűjtés nem indulhat el olyan
> rendszeren, ahol a tenant-bootstrap nyitva van, és a klinikai küszöbmotorban P0 hiba van.

Az audit `REVIEW` státuszú tételei élő futást igényelnek — ez a Fázis 0 első feladata.
