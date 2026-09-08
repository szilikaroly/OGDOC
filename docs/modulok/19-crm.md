# Modul 19 — CRM: működés, erőforrás és páciens-kapcsolat

| | |
|---|---|
| **Cél** | Dolgozók és munkaidő, beosztás, szabadság, műtőfoglalás, időpontfoglalás, páciens-kommunikáció, bejelentkezés, kérdőívek |
| **Forrás** | **IntuiCare — gyakorlatilag teljes fedés** |
| **Becsült változó** | ~600 (a meglévő 230 tábla jelentős része) |
| **Fázis** | 0–1 (átvétel és kiegészítés, nem építés) |
| **Függ** | — ez a platform, amire a többi modul épül |

## 1. Ez a modul már működik

A 19 modul közül ez az egyetlen, ami **nem terv, hanem meglévő rendszer**. Az IntuiCare
(MedRoster) mind a nyolc kért területet lefedi, működő route-okkal, RLS-sel, triggerekkel és
magyar jogszabályi megfeleltetéssel.

Az OGDOC feladata itt: **átvenni, auditálni, és a klinikai modulokhoz kötni** — nem újraírni.

---

## 2. Dolgozók és munkaidő

### 2.1 HR / karakterlap

| Táblacsoport | Tartalom |
|---|---|
| `profiles` + `profile_*` (21 tábla) | `profile_employment`, `profile_skills`, `profile_capabilities`, `profile_certifications`, `profile_constraints`, `profile_contacts`, `profile_daily_preferences`, `profile_trainings`, `profile_work_time_frame`, `profile_unavailability`, `profile_beavatkozasok` … |
| `minosites`, `illetmeny_snapshots`, `juttatasok` | minősítés, illetmény, juttatás |
| `competency_domains`, `competency_levels`, `skills`, `beavatkozasok`, `beavatkozas_skill` | kompetenciamodell |
| `person_accreditations` | akkreditált tutor (22/2012 EMMI) |
| `probaidok`, `szolgalati_elismeres`, `vegkielegites_szamitasok`, `kirendelesek` | munkajogi események |

Route: `/karakterlap`, `/csapat`, `/csapat-mutatok`, `/kepzes`

### 2.2 Munkaidő és jelenlét

| Tábla | Tartalom |
|---|---|
| `work_time_ledger` | napi tétel: óra, kategória, éjszakai/vasárnapi/ünnepnapi óra, pótlékkód, költséghely, jóváhagyás |
| `work_time_rules`, `work_time_custom_rules` | szabálykészlet |
| `attendance_events`, `attendance_anchors` | jelenlét, horgonyok |
| `overtime_orders`, `overtime_preferences` | rendkívüli munkavégzés |
| `wage_codes`, `wage_mapping`, `wage_table_egeszsegugyi` | bérkód-leképezés |
| `opt_out_agreements` | ÖVT önkéntesség (Eütev. 12/B. §) |
| nézetek: `v_havi_ledger`, `v_heti_munkaido`, `v_napi_pihenes`, `v_overtime_ledger_yearly` | aggregátumok |

Route: `/munkaido`, `/jelenlet`, `/admin/munkaido-szabalyok`, `/admin/jelenlet-anomaliak`

**Jogi megfeleltetés — ez a modul legértékesebb része:**

| § | Implementáció |
|---|---|
| Mt. 134. § (munkaidő-nyilvántartás) | `work_time_ledger` + `wtl_compute_savs_fn` trigger |
| Mt. 140–143. § (vasárnapi, éjszakai, túlóra pótlék) | `compute_potlek_savs()` RPC + `wage_mapping` |
| Eütev. 12/A–12/G. § (heti 48/60/72, napi 12/24, 416 h, 11 h pihenő) | `work_time_rules` + beosztómotor kemény constraint |
| Eütev. 12/B. § (ÖVT önkéntessége) | `opt_out_agreements` + `opt_out_revocation_guard` (12 hónap) |
| Eütev. 13/A., 14. § (ügyeleti, készenléti díj) | `wage_codes` |
| 528/2020 16. § (rendkívüli munka írásban) | `overtime_orders.irasos_hivatkozas` |

---

## 3. Munkaidő-beosztás

| Tábla | Tartalom |
|---|---|
| `schedule_runs`, `schedule_assignments` | beosztásfuttatás és a kiosztott műszakok |
| `schedule_explanations` | **miért ezt a beosztást kapta** — magyarázhatóság |
| `schedule_change_requests`, `schedule_share_tokens` | cserekérelem, megosztó link |
| `duty_lines`, `duty_line_coverage`, `duty_line_eligibility`, `duty_availability` | ügyeleti sorok, lefedettség, jogosultság, önkéntes rendelkezésre állás |
| `staffing_templates`, `staffing_template_roles` | létszámigény-sablon |
| `mandatory_duty_rules`, `mandatory_duty_exemptions` | kötelező ügyelet + mentesség (Eütev. 12/D. §) |
| `incompatibilities`, `osszeferhetetlenseg_engedelyek` | összeférhetetlenség |
| `feladat_korok`, `staff_levels`, `staff_roles` | feladatkör, szint |

Route: `/beosztas`, `/admin/letszam-igeny`, `/admin/potlas`, `/admin/tulora-pool`,
`/vezeto/keresek`, `/share/schedule/$token`

RPC: `generate_demand_for_period`, `publish_schedule_run`, `find_acute_replacements`,
`get_required_monthly_duty`

**A `schedule_explanations` tábla figyelemre méltó**: az automatikus beosztás magyarázatot ad
arról, miért kapta valaki azt a műszakot. Ez ugyanaz az elv, amit az OGDOC klinikai oldalon
követel (minden számítás visszavezethető) — a platform már így gondolkodik.

---

## 4. Szabadság

| Tábla | Tartalom |
|---|---|
| `leave_policy` | szabályzat |
| `leave_entitlement` | járó / kiadott / hátralévő / áthozott nap, jogcím, évzárás |
| `leave_carryover_log` | áthozatal naplója |
| `leave_admin_audit` | adminisztratív beavatkozások |
| `profile_unavailability` | egyéb távollét |
| `szabadsag_evente`, `public_holidays` | éves keret, munkaszüneti napok |

Route: `/szabadsag`, `/admin/szabadsag-szabalyzat`, `/admin/szabadsag-felugyelet`

---

## 5. Műtőfoglalás

| Tábla | Tartalom |
|---|---|
| `or_suites`, `or_resources`, `or_room_profiles` | műtők, erőforrások, terem-profilok |
| `or_blocks` | blokk: dátum, kezdő/vég idő, sebész, szakma, **sürgősségi keret**, felszabadítási határidő, ismétlődő szabály |
| `or_staff_pool` | személyzeti pool |
| `or_emergency_responses` | sürgősségi válaszok |
| `surgery_types`, `surgery_cases`, `surgery_case_assignments` | műtéttípus, eset, kiosztás |
| `case_resource_requirements`, `resource_bookings` | erőforrásigény és -foglalás |

A `surgery_cases` tábla gazdag: becsült időtartam, poszt-op ápolási perc, prioritás, kiemelt
jelölés, szükséges szerepek, operátor-szenioritás felülbírálás, jóváhagyás, tervezett és
tényleges idők.

Route: `/muteti-terv`, `/muteti-terv/blokkok`, `/muteti-terv/varolista`,
`/admin/mutet-szabalyok`, `/iranyitopult`

> **Ez a 11. modul (műtő) infrastruktúrája.** A 11. modul a *klinikai* tartalmat adja hozzá
> (WHO checklist, műtéti leírás, ASA, VTE-profilaxis), a foglalás és erőforrás-tervezés készen van.
> Kapcsolódás: `surgery_cases` ↔ `clinical_encounters` ↔ a 11. modul `op.*` változói.

---

## 6. Időpontfoglalás és bejelentkezés

| Tábla | Tartalom |
|---|---|
| `appointment_templates`, `appointment_slots`, `appointment_resources` | sablon, idősáv (kapacitás + foglalt szám), erőforrás |
| `appointments` | foglalás: `foglalas_kod`, vendégadatok, `gdpr_consent_at`, `email_megerositve_at`, `idempotency_key`, **`eeszt_idopont_id`**, `sync_statusz`, `external_ref` |
| `appointment_status_events` | státusztörténet |
| `patient_checkin` | érkeztetés: `checkin_ts`, `queue_position`, `called_ts`, `done_ts`, `method` |
| `patient_appointment_requests` | előjegyzési kérelem |

Route: `/foglalas/uj`, `/foglalas/visszaigazolas/$kod`, `/idopontok`, `/idopontok/sablonok`,
`/checkin`, `/portal/elojegyzes`, `/portal/idopontok`

A foglalási kód generálása `crypto.getRandomValues` + Crockford base32 (10 karakter, `O/0/1/I/L`
nélkül, rejection sampling) — RNG-tesztel együtt.

**Az EESZT-mezők már itt vannak** (`eeszt_idopont_id`, `sync_statusz`) — ld. `08-interoperabilitas.md`.

---

## 7. Páciens-kommunikáció

| Tábla | Tartalom |
|---|---|
| `conversations`, `conversation_participants` | beszélgetés, résztvevők |
| `messages` | üzenet: `sender_kind` (staff / patient), `source_lang`, szerkesztés, törlés, válasz |
| `message_translations`, `message_attachments`, `message_read_receipts` | fordítás, csatolmány, olvasás |
| `notifications`, `notification_preferences`, `email_digest_settings` | értesítés |
| `push_subscriptions`, `push_settings` | web push |
| `chat_messages`, `contact_messages`, `announcements`, `announcement_reads` | egyéb csatornák |

Route: `/uzenetek`, `/uzenetek/$conversationId`, `/uzenetek/uj`, `/portal/uzenetek`,
`/portal/ertesitesek`

A `message_translations` és a `source_lang` a tíznyelvű működés része — **a beteg a saját
nyelvén ír, az ellátó a sajátján olvas.**

---

## 8. Bejelentkezés és jogosultság

| Elem | Tartalom |
|---|---|
| Supabase Auth | Google OAuth + email/jelszó |
| `user_roles`, `roles`, `role_permissions` | szerepkör és jogosultság |
| `user_provider_identities` | külső identitás |
| `patient_users` | a beteg-portál felhasználója ↔ `patients` |
| `tenants`, `org_units`, `sites`, `clinics`, `floors` | többbérlős szervezeti fa |
| `has_role(_user_id, _role)`, `current_tenant_id()`, `can_access_patient(patient_id)` | RLS-alapfüggvények |
| `admin_audit_log` + `audit_trigger_fn` | auditnapló |
| `gdpr_consents` | célhoz kötött hozzájárulás, verzióval és visszavonással |

Szerepkörök: `tenant_admin`, vezető kategória (`ugyeletvezeto+`), `foorvos`/`szakorvos`,
`szakdolgozo`, `beoszto`, `recepcio`, `patient_users`.

> **Ez az a jogosultsági modell, amit a `02` modul `ctx.role` mezője az artifact-változatban nem
> tudott adni.** Itt szerveroldali, RLS-sel kikényszerített — nem felületszűrés.

---

## 9. Kérdőívek

| Tábla | Tartalom |
|---|---|
| `questionnaires` | `items`, `scoring`, `cutoffs`, `critical_item_index`, `critical_threshold`, `licenc`, `recall_rules`, `mode`, `kioszk_eligible`, `language`, `becsult_perc` |
| `questionnaire_assignments`, `questionnaire_schedules`, `questionnaire_event_triggers` | kiosztás, ütemezés, esemény-kiváltó |
| `questionnaire_responses` | `answers`, `total_score`, `subscale_scores`, `severity`, `critical_triggered`, `is_anonymous`, `consent_to_record` |
| `assignment_reminder_log` | emlékeztetők |
| `critical_result_alerts`, `clinical_alert_status_log` | kritikus eredmény kezelése |

Route: `/kerdoivek` (+ `attekintes`, `recepcio`, `varo`, `riasztasok`), `/kiosk/$token`,
`/portal/kerdoivek`, `/admin/kerdoiv-emlekeztetok`

**A `critical_item_index` + `critical_threshold` pár pontosan az EPDS Q10-szabály**: egyetlen
tétel önálló vörös zászlót ad az összpontszámtól függetlenül. A `licenc` enum a licencelt
kérdőívek (EQ-5D-5L, WHODAS 2.0, BSS-R) nyilvántartására való.

Ez a 8. és a 16. modul teljes infrastruktúrája. **Az ICHOM 108 PROM-tétele ide adatként kerül be.**

---

## 10. Keresztfeltöltés a klinikai modulok felé

| A 19-ből | A klinikai modul felé |
|---|---|
| `appointments`, `patient_checkin` | **02** — az ellátási kontextus (`ctx.encounter`) ebből indul |
| `questionnaire_responses` | **08**, **16** — EPDS, PROM-ok |
| `patients` (TAJ, születési dátum, nem, irányítószám) | **02**, **03** — alapadatok, életkor, lakhely |
| `profiles`, `user_roles` | **02** — `ctx.role`, `ctx.eduLevel` |
| `or_blocks`, `surgery_cases` | **11** — a műtéti epizód |
| `followup_protocols`, `_enrollments` | **15** — utánkövetés ütemezése |
| `conversations`, `messages` | **13** — a beteg tájékoztatásának dokumentálása |
| `gdpr_consents` | kutatási réteg — a beleegyezés állapota |

## 11. Elfogadási kritérium

A modul **nem fejlesztendő, hanem auditálandó**. Az elfogadás feltétele:

1. A modul-audit `REVIEW` státuszú tételei élő futással ellenőrizve.
2. **BUG-015** (tenant-bootstrap: az új tenant első felhasználója bárki lehet) javítva —
   kutatási adatgyűjtés ezen a hibán nem indulhat el.
3. **BUG-009 (P0)** a `monitoring_thresholds` motorban javítva — ez a 15. modul alapja.
4. BUG-007 (hiányzó `recepcio` role-kulcs), BUG-010, BUG-011 javítva.

## 12. Nyitott kérdések

1. **Bérszámfejtési kimenet.** A `wage_codes` / `wage_mapping` / `illetmeny_snapshots` a bérkódig
   elmegy, de a bérszámfejtő rendszer felé nincs export. Kell-e?
2. **A `schedule_explanations` és az OGDOC magyarázhatósági elve.** Ugyanaz az ötlet két helyen,
   más adatszerkezettel. Érdemes-e egyesíteni? **Javaslat:** nem most — működik, és az egyesítés
   nem hoz klinikai értéket.
3. **Tíz nyelv karbantartása.** A CRM-oldal 10 nyelvű (`i18n_*` táblák + Fordító Stúdió). A
   klinikai modulok a `05-kockazatok.md` K3 szerint HU+EN-nel indulnak. **A két rendszer nyelvi
   lefedettsége eltér — ezt a felületen jelezni kell**, nehogy a felhasználó azt higgye, a
   klinikai tartalom is elérhető a saját nyelvén.
