# 09 — A SOS24 portál és a kétplatformos döntés

A második meglévő rendszer: **SOS24** — foglalkozás-egészségügyi és háziorvosi portál
(éles: `sos24.lovable.app`). Ez oldja meg a v16 egyik régóta nyitott teendőjét
(*„Foglalkozás-egészségügyi lap hiányzó elemei"*), és több modulban is megspórol munkát.

| Metrika | Érték |
|---|---|
| Adatbázis-tábla | 71 |
| RLS policy | 230 |
| Edge function (Deno) | 37, ebből 19 AI |
| Nyelv | 7 (hu, en, de, ro, sr, zh, fil) |
| Szerepkör | `super_admin`, `haziorvos`, `uzemorvos`, `munkaltato`, `munkavallalo`, `praxistag` |
| Stack | React 18 + Vite 5 + TS 5 + Tailwind 3 + shadcn/ui + TanStack Query + Supabase |
| Teszt | Vitest (unit), Deno test (edge integráció), Playwright (E2E) |

## 1. Amit a SOS24 ad

### 1.1 Foglalkozás-egészségügyi munkafolyamat — ez teljesen új érték

Hat lépés, végponttól végpontig, működő állapotgéppel:

1. Munkáltató **beutalót** készít (`referrals`: FEOR, munkakör, kockázati tényezők, telephely)
2. Munkavállaló **időpontot foglal** → `appointment_booked`
3. **Kérdőív** kitöltése → trigger (`auto_update_referral_on_questionnaire`) →
   `questionnaire_filled`
4. Üzemorvos **vizsgálatot rögzít** (`examinations`: `patient_data`, `clinical_findings`,
   `opinion_status`, korlátozások, érvényesség)
5. **Orvosi vélemény** (`medical_opinions`) aláírással (`signature_data`) és PDF-fel
6. **A munkáltató csak az alkalmassági eredményt látja, a klinikai részleteket nem**

> A 6. pont a legfontosabb. Ez az adatszegregáció pontosan az a fajta jogosultsági szabály,
> amit az OGDOC-nak a kutatói és az ellátói szerep között is meg kell valósítania — és itt
> már működik, RLS-ben kikényszerítve.

### 1.2 ISO 45001 kockázatértékelés

- Hierarchia: `companies` → `company_sites` → `work_areas` → `workplaces`
- `risk_assessments` (draft / in_review / approved / archived, felülvizsgálati ciklus,
  előzmény-hivatkozás)
- `risk_assessment_hazards`: kategória, **valószínűség × súlyosság = kockázati szint**,
  intézkedési hierarchia, **maradék kockázat**
- Fotódokumentáció AI-elemzéssel (`ai-risk-photo-analysis`)
- **Zaj- és rezgésmérés böngészőből** (`NoiseMeter`, `VibrationMeter`) →
  `noise_vibration_measurements`
- Veszélyes anyagok: `hazardous_substances` (REACH SVHC import), biztonsági adatlap
  feldolgozás (`ai-sds-analysis`)

### 1.3 Munkabaleseti jegyzőkönyv

A **hivatalos magyar nyomtatvány teljes mezőkészlete** — munkáltatói adatok, sérült adatai,
FEOR, baleseti kódok, súlyosság, kivizsgálás, aláírók —, GPS-koordinátával és fotókkal.
Kódtárak: `accident-codes.ts`, `feor-codes.ts`, `teaor-codes.ts`.

### 1.4 Labor modul — rendelés és árazás

- Katalógus (`labTestCatalog*.ts`), csomagok (`lab_packages`)
- Árazás: `lab_pricing_config` (pontszám + Ft) és `lab_markup_config`
- **Egyetlen központi árazó függvény** (`calculateDisplayPrice()`) unit tesztekkel, és az
  adminfelület anomália-detektálást futtat
- Orvosi laborkérő (`lab_requests`, `LKR-ÉV-NNNN`), webshop-rendelés (`lab_orders`,
  `LO-ÉV-NNNN`), anonim rendelés `SECURITY DEFINER` RPC-n át
- Nyomtatás HTML-escape-pel (XSS ellen)

### 1.5 Háziorvosi modul

- **Törzskarton** (`patient_cards`): allergiák, krónikus betegségek, gyógyszerek, család- és
  **foglalkozási anamnézis**, expozíciók, dohányzás/alkohol, szűrések
- Receptigénylés (`medication_requests`) + gyógyszertörzs (`medications`)
- Beutalókérés (`requests`), **igazolások** (`certificates`), **oltások** (`vaccinations`)
- Egészségnapló: `health_journal` (vérnyomás, pulzus, súly, vércukor),
  `food_journal` és `stool_journal` **AI-képelemzéssel**
- Egészségterv (`health_plans`), orvosi ajánlások (`doctor_recommendations`)

### 1.6 Amit még ad

| Elem | Miért számít |
|---|---|
| `icd_codes` tábla | BNO-kódtörzs adatbázisban (a v16-ban beágyazva van) |
| `document_templates`, `documents`, `document_tags`, `generate-pdf` | a 14. modul dokumentum-infrastruktúrája |
| `gdpr_requests`, `audit_logs`, `security_events` | GDPR-kérelem kezelés + futásidejű biztonsági monitorozás |
| `ai-questionnaire-scoring` **IDOR-védelemmel**, `ai-doctor-recommendation` kapcsolat-ellenőrzéssel | a biztonsági gondolkodás minősége |
| `ai-speech-to-text` | diktálás — a v16 `dictation` rétegének szerveroldali párja |
| **Tesztréteg** | Vitest + Deno integrációs teszt + Playwright, és a `DEBUG-TESZT-MATRIX.md` funkció ↔ fájl ↔ teszt ↔ debug hozzárendelés |
| `MASTER-PROMPT.md`, `UJRAEPITES.md`, `PROGRAMFA.md` | a rendszer újraépíthető és dokumentált |

## 2. A döntés: két platform, egy cél

Most **két** működő Supabase-alapú rendszer van:

| | IntuiCare (MedRoster) | SOS24 |
|---|---|---|
| Tábla | 230 | 71 |
| Stack | TanStack Start (React 19, SSR, Cloudflare Workers edge) | Vite SPA (React 18) + Deno edge functions |
| Fókusz | kórházi működés + klinikai mag + szülészet | foglalkozás-egészségügy + háziorvoslás + labor |
| Többbérlős | igen (`tenants`, `org_units`, `sites`) | részben (`companies`, `user_company_relations`) |
| Nyelv | 10 | 7 |

> **A K0 döntés eltért ettől a javaslattól:** nem az egyik platform nyeli el a másikat,
> hanem **vegyes rendszer** épül, mindkettőből a jó részeket átvéve. A tényleges besorolás a
> [`10-mixed-rendszer.md`](10-mixed-rendszer.md)-ben van. Az alábbi indoklás azért marad meg,
> mert a technológiai alap megválasztását (IntuiCare stack) továbbra is ez indokolja.

**Eredeti javaslat: az IntuiCare a gazdaplatform, a SOS24 domének átkerülnek bele.**

Indoklás:

1. **Az adatmodell.** Az IntuiCare `clinical_observations` / `clinical_encounters` /
   `clinical_calculator_results` hármasa FHIR-alakú és a klinikai mag alapja. A SOS24
   klinikai adata (`examinations`, `health_journal`) laposabb, doménspecifikusabb — beolvasztható
   az előbbibe, fordítva nehezen.
2. **A többbérlős modell.** Az IntuiCare `tenants` + `org_units` + `sites` + RLS-alapfüggvények
   (`current_tenant_id`, `has_role`, `can_access_patient`) általánosabbak. A SOS24
   `companies` hierarchiája **beleillik** mint szervezeti alegység.
3. **A stack.** Mindkettő React + TypeScript + Tailwind + shadcn/ui + Supabase, tehát a
   **komponensek nagyrészt átemelhetők**. Ami nem: a routing (Vite SPA vs. TanStack Start
   fájlalapú routing) és az edge runtime (Deno function vs. `createServerFn` Cloudflare-en).
   Ez átírás, de mechanikus.
4. **A kettős karbantartás ára.** Két külön séma, két auth, két i18n, két deploy — és a beteg
   ugyanaz. Egy foglalkozás-egészségügyi vizsgálat és egy terhesgondozási vizit ugyanannak a
   személynek a dokumentációja; két rendszerben ez nem köthető össze.

### Amit ez a portolás jelent

| SOS24-domén | Hová kerül az IntuiCare-ben |
|---|---|
| `companies`, `company_sites`, `work_areas`, `workplaces` | az `org_units` / `sites` fa mellé, **külső szervezet**ként |
| `referrals`, `examinations`, `medical_opinions` | új `occhealth_*` domén, `clinical_encounters`-höz kötve |
| `risk_assessments` + `_hazards` + `_photos`, `hazardous_substances`, `noise_vibration_measurements` | új `risk_*` domén |
| `accident_reports` | új `accident_*` domén |
| `lab_requests`, `lab_orders`, `lab_packages`, `lab_pricing_config` | a `05` modul labor-alszekciójához |
| `patient_cards` | beolvad a `03` anamnézisbe (regiszter-változókká) |
| `medications`, `medication_requests`, `vaccinations` | a `06` modulhoz |
| `health_journal`, `food_journal`, `stool_journal`, `health_plans` | a meglévő `measurements` / `food_log` / `stool_log` mellé — **itt átfedés van, egyesíteni kell** |
| `certificates`, `documents`, `document_templates` | a `14` modulhoz |
| `icd_codes` | a `17` modulhoz, a v16 EESZT-törzsei mellé |
| `questionnaires` + `_assignments` + `_submissions` | **átfedés** az IntuiCare `questionnaires` motorjával — az IntuiCare-é a gazdagabb (licenc, cutoffs, critical item), az marad |

### Amit NEM viszünk át

- CMS, SEO, marketing (`pages_content`, `seo_*`, `competitor_*`, `web_vitals`, `page_views`) —
  az IntuiCare-nek saját, gazdagabb CMS-e van (34 blokktípus)
- `email_*` táblák — az IntuiCare Resend-integrációja és `email_digest_settings`-e fedi
- Duplikált `appointments` / `appointment_slots` — az IntuiCare-é a gazdagabb (EESZT-mezőkkel)

## 3. A portolás költsége — őszintén

Ez **nem ingyen**. A SOS24 71 táblájából kb. 40 kerül át, és a hozzájuk tartozó felület
átírása TanStack Start routingra valós munka. Becslés: **4–6 hét**, a 21. modul részeként.

De az alternatíva rosszabb: két rendszer párhuzamos karbantartása, két helyen tárolt
betegadat, és a foglalkozás-egészségügyi és a klinikai anamnézis között nincs átjárás — pedig
az expozíciós anamnézis (`patient_cards` foglalkozási anamnézis és expozíciók) **közvetlenül
releváns a terhesgondozásban**.

## 4. Amit azonnal átveszünk, portolás nélkül

Három dolog, ami nem tábla, hanem gyakorlat, és most azonnal alkalmazható:

1. **A tesztréteg-felosztás** — Vitest (unit) + Deno test (edge integráció) + Playwright (E2E)
   + `supabase db lint`. Ez pontosan az, amit a `01-architektura.md` „tesztelés három szinten"
   néven kért, és itt már fut.
2. **A `DEBUG-TESZT-MATRIX.md` formátuma** — funkció ↔ forrásfájl ↔ backend ↔ teszt ↔
   **debug belépési pont**. Az utolsó oszlop a ritka és értékes: megmondja, hol kell nézni,
   ha valami nem működik. Az OGDOC minden moduljához ilyen sor tartozik majd.
3. **Az egyetlen központi számító függvény elve** — a labor-árazás egy helyen van
   (`calculateDisplayPrice()`), unit tesztekkel és anomália-detektálással. Ez ugyanaz az elv,
   mint az OGDOC `core/scores/`-ja: **egy számítás, egy hely, tesztelve.**

## 5. Nyitott kérdés

**Ki üzemelteti a SOS24-et most, és meddig kell élnie?** Ha éles használatban van
(`sos24.lovable.app`), a portolás nem kapcsolható át egyik napról a másikra — párhuzamos
üzem és adatmigráció kell. Ez a 21. modul ütemezését érinti, nem a tervét.
