# Modul 21 — Foglalkozás-egészségügy és munkahelyi kockázat

| | |
|---|---|
| **Cél** | Üzemorvosi alkalmassági folyamat, ISO 45001 kockázatértékelés, munkabaleseti jegyzőkönyv |
| **Forrás** | **SOS24 — gyakorlatilag teljes fedés** |
| **Becsült változó** | ~350 (a SOS24 71 táblájából kb. 40 kerül át) |
| **Fázis** | 4–5 (portolás, nem építés) |
| **Függ** | 19 (platform), 02, 03, 05 |

## Mi van már meg

**Minden** — csak másik platformon. A SOS24 (`sos24.lovable.app`) éles rendszer, 71 táblával,
230 RLS policyval, 37 Deno edge functionnel, Vitest + Deno + Playwright tesztréteggel.
A leltár és a portolási döntés: [`09-sos24-alap.md`](../09-sos24-alap.md).

Ez a modul egyben **a v16 régóta nyitott teendőjének lezárása**:

> *„Foglalkozás-egészségügyi lap (`sos fogl eü lap.docx`) hiányzó elemei: beteg-oldali anamnézis
> tételek + orvosi fizikális státusz modul (audiogram, légzésfunkció, visus, neurológiai
> státusz, alkalmassági vélemény)."*

A SOS24 az alkalmassági véleményt, a beutalót, a vizsgálatrögzítést és a kérdőívet adja; a
fizikális státusz eszközös részei (audiogram, légzésfunkció, visus) a **04. modulba** kerülnek
új alszekcióként.

---

## 1. Alkalmassági munkafolyamat

Hatlépéses állapotgép, működő triggerekkel:

| # | Lépés | Tábla / mechanizmus | Státusz |
|---|---|---|---|
| 1 | Munkáltató beutalót készít | `referrals`: FEOR, munkakör, kockázati tényezők, telephely | `created` |
| 2 | Munkavállaló időpontot foglal | `appointments` | `appointment_booked` |
| 3 | Kérdőív kitöltése | `auto_update_referral_on_questionnaire` trigger | `questionnaire_filled` |
| 4 | Üzemorvos vizsgálatot rögzít | `examinations`: `patient_data`, `clinical_findings`, `opinion_status`, korlátozások, érvényesség | `examined` |
| 5 | Orvosi vélemény | `medical_opinions`: `signature_data` + PDF (`generate-pdf`) | `opinion_issued` |
| 6 | Munkáltatói betekintés | **csak az alkalmassági eredmény**, klinikai részlet nélkül | — |

### A 6. lépés a modul legfontosabb szabálya

**A munkáltató nem látja a klinikai leletet.** Csak azt, hogy a munkavállaló alkalmas,
korlátozással alkalmas, vagy nem alkalmas, és mikorig érvényes. Ez RLS-ben van kikényszerítve,
nem felületszűréssel.

Ugyanez a szegregációs minta kell az OGDOC **kutatói szerepéhez** is: a kutató aggregátumot és
de-identifikált adatot lát, klinikai részletet nem. A minta itt már működik — átvesszük.

### Alkalmassági vélemény típusai

`alkalmas` · `alkalmas korlátozással` (a korlátozás tételesen) · `ideiglenesen nem alkalmas` ·
`nem alkalmas` · `további vizsgálat szükséges` — érvényességi dátummal és a következő vizsgálat
esedékességével.

---

## 2. ISO 45001 kockázatértékelés

### Hierarchia

```
companies ──▶ company_sites ──▶ work_areas ──▶ workplaces
                                     │
                                     ├─▶ work_area_sds_documents  (biztonsági adatlapok)
                                     └─▶ company_hazardous_substances
```

### Kockázatértékelés

| Tábla | Tartalom |
|---|---|
| `risk_assessments` | státusz (`draft` / `in_review` / `approved` / `archived`), felülvizsgálati ciklus, előzmény-hivatkozás |
| `risk_assessment_hazards` | kategória, **valószínűség × súlyosság = kockázati szint**, intézkedési hierarchia, **maradék kockázat** |
| `risk_assessment_photos` | fotódokumentáció, `ai-risk-photo-analysis` elemzéssel |
| `hazardous_substances` | REACH SVHC import |
| `noise_vibration_measurements` | **zaj- és rezgésmérés böngészőből** (`NoiseMeter`, `VibrationMeter`) |

Az intézkedési hierarchia (kiiktatás → helyettesítés → műszaki → szervezési → egyéni védőeszköz)
és a **maradék kockázat** külön nyilvántartása az, ami ezt szabványkonformmá teszi — nem a
kockázati mátrix önmagában.

### Kapcsolat a klinikai oldallal

A munkahelyi expozíció **közvetlenül releváns a terhesgondozásban**: vegyi anyag, zaj, rezgés,
ionizáló sugárzás, éjszakai műszak, fizikai terhelés. A `work_areas` → `company_hazardous_substances`
lánc a `03` anamnézis expozíciós tételeit tölti fel, és a terhesség bejelentésekor
**automatikusan kockázatértékelés-felülvizsgálatot indít** — ez jogszabályi kötelezettség is.

---

## 3. Munkabaleseti jegyzőkönyv

`accident_reports` — a **hivatalos magyar nyomtatvány teljes mezőkészlete**: munkáltatói adatok,
sérült adatai, FEOR, baleseti kódok, súlyosság, kivizsgálás, aláírók. GPS-koordinátával és
fotókkal, nyomtatható változattal (`PrintableAccidentReport`).

Kódtárak a kódban: `accident-codes.ts`, `feor-codes.ts`, `teaor-codes.ts`.

> A `feor-codes.ts` **átfed** az IntuiCare-be viendő v16 EESZT `feor` törzsével (1 217 tétel).
> Egyesítendő — egy FEOR-törzs legyen, ne kettő.

---

## 4. Adatszerkezet: mi kerül a regiszterbe

A modul nagy része **tranzakciós adat** (beutaló, vizsgálat, jegyzőkönyv), nem klinikai
megfigyelés — ezek megmaradnak saját táblákban. A regiszterbe az kerül, ami mérés vagy
strukturált klinikai állítás:

| Változó | Típus | Honnan |
|---|---|---|
| `occ.exposure.chemical` | coded-multi | `company_hazardous_substances` |
| `occ.exposure.noise.db` | quantity | `noise_vibration_measurements` |
| `occ.exposure.vibration` | quantity | `noise_vibration_measurements` |
| `occ.exposure.nightShift` | bool | `referrals` munkakör |
| `occ.exposure.physicalLoad` | coded | `risk_assessment_hazards` |
| `occ.exam.audiogram.*` | structured | **04. modul, új alszekció** |
| `occ.exam.spirometry.*` | structured | **04. modul, új alszekció** |
| `occ.exam.visus.*` | structured | **04. modul, új alszekció** |
| `occ.fitness.status` | coded | `medical_opinions` |
| `occ.fitness.restrictions` | coded-multi | `medical_opinions` |
| `occ.fitness.validUntil` | date | `medical_opinions` |

---

## 5. Keresztfeltöltés

**⇦ Mi tölti fel**: `19` (a dolgozó személyi adatai), `02` (ellátási kontextus),
`03` (anamnézis — krónikus betegségek, gyógyszerek), `05` (labor, EKG, képalkotó).

**⇨ Mit tölt fel**:

| Cél | Mit |
|---|---|
| `03` anamnézis | **foglalkozási anamnézis és expozíciók** — a `patient_cards` megfelelő mezői |
| `04` státusz | audiogram, légzésfunkció, visus, neurológiai státusz (új alszekció) |
| `05` szűrés | a munkaköri kockázat szerint esedékes szűrések |
| `13` ellátás tervezés | a soron következő alkalmassági vizsgálat esedékessége |
| `14` zárójelentés | igazolások (`certificates`) |
| terhesgondozás | **a terhesség bejelentése kockázatértékelés-felülvizsgálatot indít**, és a munkaköri expozíció bekerül a szülészeti kockázati képbe |

---

## 6. Elfogadási kritérium

1. A hatlépéses alkalmassági folyamat végigvihető az új platformon, és a munkáltató
   **nem látja** a klinikai leletet — ez RLS-teszttel bizonyítva, nem felületi ellenőrzéssel.
2. Egy terhesség bejelentése a munkahelyi kockázatértékelés felülvizsgálatát indítja, és a
   releváns expozíciók megjelennek a szülészeti kockázati képben.
3. A FEOR-törzs **egyetlen** példányban létezik a rendszerben.

---

## 7. Nyitott kérdések

1. **Meddig él a SOS24 párhuzamosan?** Éles rendszer; a portolás nem kapcsolható át egyik napról
   a másikra. Párhuzamos üzem és adatmigráció kell — ez ütemezési, nem tervezési kérdés.
2. **Az egészségnaplók átfedése.** A SOS24 `health_journal` / `food_journal` / `stool_journal`
   és az IntuiCare `measurements` / `food_log` / `stool_log` ugyanaz a fogalom, két sémával.
   Egyesítendő; **javaslat**: az IntuiCare `measurements` a primer (a regiszterhez köthető),
   a naplók AI-képelemzése (`ai-health-image-analysis`) átkerül.
3. **A kérdőívmotorok átfedése.** Két `questionnaires` tábla van. Az IntuiCare-é a gazdagabb
   (`licenc`, `cutoffs`, `critical_item_index`, `recall_rules`) — **az marad**, a SOS24
   kérdőívei adatként kerülnek át.
4. **Jogosultsági modell egyesítése.** A SOS24 szerepkörei (`uzemorvos`, `munkaltato`,
   `munkavallalo`, `praxistag`) nincsenek az IntuiCare szerepkészletében. Bővítés kell, és a
   `munkaltato` szerep a legkényesebb: **külső fél, aki korlátozott betegadatot lát.**
