# Modul 25 — Adminisztráció, jogosultságkezelés és belső szerkesztő

| | |
|---|---|
| **Cél** | A rendszer működtetése fejlesztő nélkül: jogosultságok, kódlisták, űrlapok, kérdőívek, szabályok, dokumentumok, fordítások |
| **Forrás** | IntuiCare (jogosultság, i18n, CMS) + SOS24 (admin felületek) + ÚJ (regiszter-szerkesztő) |
| **Becsült változó** | ~120 (konfiguráció, nem klinikai adat) |
| **Fázis** | 0 (jogosultság) → 2 (szerkesztő) → 4 (teljes) |
| **Függ** | mindenre hat, mindent szerkeszt |

> **Számozási megjegyzés:** a kérés „23. modulként" nevezte meg, de a 23. és 24. már foglalt
> (genetika, IVF), és a kérés szerint **1–25-ig** kell a modulokat kidolgozni. Ezért ez a
> **25. modul**. Ha más számozást szeretnél, szólj.

## Mi van már meg

**Az IntuiCare-ből:** `user_roles`, `roles`, `role_permissions`, `user_provider_identities`,
`patient_users`, `tenants` + `org_units` + `sites` + `clinics` + `floors`, az RLS-alapfüggvények
(`has_role`, `current_tenant_id`, `can_access_patient`), `admin_audit_log` + `audit_trigger_fn`,
`app_settings` + `app_settings_audit`, `feature_flags`, `error_log`, **i18n Fordító Stúdió**
(`i18n_source_strings`, `i18n_translations`, `i18n_translation_jobs`, `i18n_missing_keys`),
és a **CMS 34 blokktípusa** admin felülettel.

**A SOS24-ből:** `document_templates`, `bulk_import_logs`, `security_events` + biztonsági
monitorozó felület, `gdpr_requests` kezelés, admin felhasználókezelő edge functionök.

**Nincs meg:** a **regiszter-szerkesztő** — vagyis az, hogy klinikus tudjon változót,
kódlistát, űrlapot, szabályt és kérdőívet felvenni és módosítani, fejlesztő nélkül.

---

## 1. Miért ez a modul dönti el, hogy a rendszer él-e

Egy ~3900 változós, 25 modulos rendszer **nem tartható karban fejlesztői ciklussal**. Ha egy
új laborparaméter, egy módosult BNO-kódlista vagy egy új kérdőívtétel felvétele egy hetes
fejlesztés és egy release, akkor a rendszer fél éven belül elavul, és a felhasználók
megkerülik.

> **A regiszter-vezérelt architektúra pontosan azért készült, hogy ez ne így legyen.** Ha a
> változó definíciója adat, akkor szerkeszthető. Ez a modul váltja be az ígéretet.

---

## 2. Jogosultságkezelés

### 2.1 A modell

```
tenant ─▶ org_unit / site ─▶ szerepkör-hozzárendelés ─▶ jogosultságok
                                      │
                              felhasználó ◀── külső identitás (OAuth)
```

**Három réteg**, és a különbség lényeges:

| Réteg | Mi ez | Kikényszerítve |
|---|---|---|
| **Szerepkör** | mit csinálhat elvben | `has_role()`, RLS |
| **Hatókör** | kinek az adatán | `current_tenant_id()`, `can_access_patient()`, org-fa |
| **Tartalommélység** | mennyit lát ugyanabból | `ctx.eduLevel` — **nem biztonsági határ**, felületszűrés |

### 2.2 A szerepkészlet — a két platform egyesítve

| Szerep | Forrás | Sajátosság |
|---|---|---|
| `tenant_admin` | IntuiCare | **nem kap automatikus betegadat-hozzáférést** |
| vezető (`ugyeletvezeto+`) | IntuiCare | intézményi aggregátum |
| `foorvos` / `szakorvos` | IntuiCare | teljes klinikai |
| `szakdolgozo` | IntuiCare | idősoros megfigyelés, eszközök |
| `beoszto`, `recepcio` | IntuiCare | **BUG-007: hiányzó `recepcio` role-kulcs — javítandó** |
| `uzemorvos` | SOS24 | foglalkozás-egészségügy |
| **`munkaltato`** | SOS24 | **külső fél**: csak alkalmassági eredmény, klinikai részlet nélkül |
| `munkavallalo`, `patient_users` | SOS24 / IntuiCare | beteg-portál |
| **`kutato`** | ÚJ | de-identifikált adat, `phi` nélkül, k-anonimitási küszöbbel |
| **`biobank_kezelo`** | ÚJ | minta, de **nem** a kódkulcs |
| **`kodkulcs_kezelo`** | ÚJ | kódkulcs, de **nem** kutathat a de-identifikált adaton |
| **`minosegugyi_vezeto`** | ÚJ | MIR, audit — **nem lehet a biobank vezető** |

**Az összeférhetetlenségi szabályok a rendszerben kikényszerítve**, nem szabályzatban:
`kutato` + `kodkulcs_kezelo` egy felhasználón **nem adható ki**; a `biobank_vezeto` és a
`minosegugyi_vezeto` sem. A szerkesztő ezt a hozzárendeléskor ellenőrzi.

### 2.3 BUG-015 — újratervezés, nem javítás

A jelenlegi `user_roles_bootstrap_admin` szerint **az új tenant első felhasználója bárki
lehet**, aki insert-elni tud. Ez a Fázis 0 blokkolója.

**Az új megoldás:** a tenant létrehozása kizárólag **kiszolgálóoldali, ellenőrzött
folyamat** (meghívó-alapú), az első adminisztrátor előre megnevezve, és a művelet auditálva.
Nincs önkiszolgáló bootstrap.

---

## 3. A belső szerkesztő — a modul lényege

### 3.1 Mit lehet szerkeszteni

| Szerkesztő | Mit | Ki | Hatás |
|---|---|---|---|
| **Változó-szerkesztő** | `VariableDef`: címke, egység, tartomány, referencia, dokumentáció, `validity` | klinikai adminisztrátor | űrlap, validáció, dokumentáció **azonnal** |
| **Kódlista-szerkesztő** | értékkészletek, szinonimák, BNO/OENO/ATC leképezés | klinikai adminisztrátor | keresés, kódajánlás |
| **Panaszszótár-szerkesztő** | tételek, szinonimák, vörös zászlók, `opens` | klinikus | `01` modul |
| **Űrlap-elrendezés** | mely változó melyik modulban, milyen sorrendben, csoportosításban | klinikai adminisztrátor | felület |
| **Kérdőív-szerkesztő** | tételek, pontozás, vágóértékek, `critical_item_index` | klinikus | `08`, `16` — **a motor már megvan** |
| **Szabály-szerkesztő** | `requiredWhen`, kódajánlási feltételek, teendő-kiváltók | klinikus, **korlátozottan** |  |
| **Normogram-betöltő** | publikációból, táblázatos vagy képlet módban | klinikus | `05` — **a v16-ban már működik** |
| **Dokumentumsablon** | tájékoztatók, nyilatkozatok, leletek | adminisztrátor | `14`, `22` |
| **SOP-kezelő** | verzió, felülvizsgálati esedékesség, olvasási nyugtázás | minőségügyi vezető | `megfeleles/05` |
| **Fordítás** | i18n kulcsok, 10 nyelv | fordító | **Fordító Stúdió megvan** |
| **„Egyéb" felülvizsgálati sor** | a szabad szöveges „egyéb" bejegyzések átsorolása | klinikus | `11-strukturalt-adat.md` 4. |

### 3.2 Amit a szerkesztő NEM enged

**Ez a fontosabb fele.** A szerkesztő nem válhat olyan eszközzé, amivel a klinikai
biztonságot ki lehet kapcsolni:

| Tiltás | Miért |
|---|---|
| **Score-képlet szerkesztése** | a `core/scores/` kód, golden-tesztekkel; egy képlet módosítása **klinikai validációt** kíván (`megfeleles/09-mdr.md`) |
| **Hard-stop kapu kikapcsolása** | a kontraindikáció-kapuk nem konfigurációs kérdés |
| **`phi` jelölés eltávolítása** | az adatvédelmi besorolás nem szerkeszthető felületről |
| **A „nincs néma helyettesítés" szabály felülbírálása** | rendszerszintű invariáns |
| **Auditnapló módosítása vagy törlése** | append-only |
| **Kritikus küszöb szabad átírása** | módosítható, de **indoklással, jóváhagyással és verziózva** — ld. 3.3 |

### 3.3 Változáskezelés — minden szerkesztés verziózott

```
szerkesztés ─▶ piszkozat ─▶ hatásvizsgálat ─▶ jóváhagyás ─▶ élesítés ─▶ audit
                              │
                              └─ „ez a 14 dolgot érinti"  (a levezetési gráfból)
```

| Elem | Szabály |
|---|---|
| **Piszkozat** | minden módosítás először piszkozat; az élesítés külön lépés |
| **Hatásvizsgálat** | a levezetési gráfból: mely score-ok, űrlapok, exportok érintettek |
| **Jóváhagyás** | klinikai tartalomnál **négyszemközti elv**: aki szerkesztette, nem hagyhatja jóvá |
| **Verzió** | a `VariableDef.version` nő, a `changelog` bejegyzést kap |
| **Visszaállítás** | bármely korábbi verzióra, egy lépésben |
| **Retrospektív értelmezés** | a régi adat a **rögzítéskor hatályos** definícióval értelmezhető (`registry_versions`) |

> **Ez utóbbi a legfontosabb.** Ha egy változó jelentése megváltozik, a régi adat nem
> értelmezhető az új definícióval. A `20` modul lekérdezője ezért jelzi, ha egy lekérdezés
> olyan időszakot fog át, amelyben a definíció változott.

---

## 4. Rendszeradminisztráció

| Terület | Tartalom | Forrás |
|---|---|---|
| Beállítások | `app_settings` + audit | IntuiCare |
| **Funkciókapcsolók** | `feature_flags` — pl. `eeszt_sync_enabled` | IntuiCare |
| Hibanapló | `error_log`, a `CaseState.errors[]` aggregálva | IntuiCare |
| **Biztonsági események** | `security_events`, RLS-megtagadások naplózása | SOS24 |
| Integrációs állapot | `sync_outbox` monitorozása csatornánként | ÚJ (`08`) |
| Tömeges import | `bulk_import_logs`, egyeztető riporttal | SOS24 |
| GDPR-kérelmek | `gdpr_requests`: hozzáférés, törlés, hordozhatóság | SOS24 |
| **Megőrzési politika** | mely adatkör meddig, és mi jár le | ÚJ (`megfeleles/07`) |
| Kódtörzs-frissítés | EESZT havi törzsek, PUPHA — letöltés → konverter → betöltés | ÚJ (`17`) |

---

## 5. Keresztfeltöltés

**⇦ Mi tölti fel**: `19` (felhasználók, szervezeti fa, kompetencia).

**⇨ Mit tölt fel**: **mindent** — a regiszteren keresztül. Egy változó módosítása azonnal
hat az űrlapra, a validációra, a dokumentációra, a lekérdezőre és az exportra.

---

## 6. Elfogadási kritérium

1. **Egy klinikus fejlesztő nélkül** felvesz egy új laborparamétert (címke, egység,
   referencia, terhességi trimeszter-referencia), és az **azonnal megjelenik** az űrlapon,
   a dokumentációban és a lekérdezőben.
2. A módosítás **piszkozatként** indul, hatásvizsgálatot mutat, és **más hagyja jóvá**, mint
   aki szerkesztette.
3. **Score-képlet nem szerkeszthető** a felületről — teszttel ellenőrizve.
4. **BUG-015 javítva**: nincs önkiszolgáló tenant-bootstrap; az első adminisztrátor
   meghívó-alapú és auditált.
5. Összeférhetetlen szerepkör-pár (`kutato` + `kodkulcs_kezelo`) **nem adható ki**.
6. Egy „egyéb" bejegyzés a felülvizsgálati sorból **szinonimaként vagy új tételként**
   visszakerül a kódlistába, fejlesztő nélkül.

---

## 7. Nyitott kérdések

1. **Ki kap szerkesztési jogot?** A klinikai tartalom szerkesztése nagy felelősség —
   javaslat: külön `klinikai_admin` szerep, szűk körben, és minden változás
   négyszemközti jóváhagyással.
2. **Meddig megy a szabály-szerkesztő?** Egy teljes szabálynyelv a felületen hatékony, de
   hibázni is lehet vele. **Javaslat:** kezdetben csak `requiredWhen` és kódajánlási
   feltételek, a teendő-kiváltók fejlesztői hatáskörben.
3. **Az MDR-hatás.** Ha a rendszer megfelelőségértékelt eszközzé válik, a felületről
   szerkeszthető klinikai tartalom **változáskezelési kérdéssé** válik: mi minősül
   jelentős változásnak, ami újraértékelést kíván? Ezt a `megfeleles/09-mdr.md`-vel együtt
   kell tisztázni — és ez befolyásolhatja, mennyit engedünk szerkeszteni.

---

## Épület-management — az ellátóhelyek szerkesztése

`core/admin/helyszerkeszto.ts`

A 34. modul helyhierarchiája eddig **adat** volt: betöltjük, olvassuk, összegzünk
rajta. Ez a réteg attól más, hogy **itt változik** — és egy szerkeszthető
hierarchia két dolgot tud elrontani, amit egy statikus nem.

### 1. A szerkesztés átírja a múltat

Ez a fontosabb, és **ez az, ami nem tűnik fel.**

Ha egy ágyat átteszünk az „A" osztályról a „B"-re, akkor a rendszer szerint
**minden korábbi fekvés is a B osztályon történt** — hiszen a fekvés az ágyra
hivatkozik, az ágy pedig most B alatt van. A tavalyi osztályos statisztika, a
NEAK-jelentés és a minőségmutatók **visszamenőleg megváltoznak** attól, hogy
valaki ma átnevezett egy osztályt.

Nem elméleti: osztályösszevonáskor, emeletfelújításkor, telephely-átadáskor
pontosan ez történik — és senki nem gondol rá, hogy a hierarchia
megváltoztatása **adatelemzési művelet is**.

> Ezért minden hely **időben érvényes** (`ervenyesTol` / `ervenyesIg`), és a
> múltbeli eseményt **az akkori** hierarchia szerint oldjuk fel. Egy szerkesztés
> nem visszamenőleges: **új érvényességi szakaszt nyit**, a régit lezárja.

`keszletAkkor(k, mikor)` adja vissza a fát egy adott időpontban. Ugyanaz az ágy
2026 szeptemberében a szülészeti, novemberében a nőgyógyászati részleg alatt —
és mindkettő igaz, a maga idejében.

### 2. Az ellátóhely nem törölhető, csak lezárható

Egy szoba, ahol valaha feküdt beteg, **örökre feloldhatónak** kell maradjon: a
dokumentáció megőrzési ideje évtizedes, és egy törölt hely azonosítója a régi
leleten „ismeretlen hely"-ként jelenne meg. **Lezárás van, dátummal és okkal** —
ok nélkül a lezárás nem lezárás, csak eltűnés, és évekkel később senki nem tudja
megmondani, felújítás, összevonás vagy bezárás történt-e.

### 3. És nem szerkeszthető az, amiben beteg fekszik

Foglalt hely áthelyezése vagy lezárása közben a beteg pillanatnyi helye
eldönthetetlenné válna. Ez **kapu**, nem figyelmeztetés. *(Az átnevezés viszont
mehet: a beteg helye nem változik tőle.)*

### A műveletek és a kapuik

| Művelet | Amit ellenőriz |
|---|---|
| `letrehoz` | a szülő létezik, és **tágabb fajta** |
| `atnevez` | üres név nincs; foglaltság **nem** akadály |
| `athelyez` | foglaltság · kör (saját leszármazott alá) · fajtasorrend |
| `lezar` | foglaltság · **ok** · nincs-e alatta még élő hely |
| `ujranyit` | csak lezárt helyet |

Mindegyikhez kell **szerkesztő** és **hatálybalépési dátum**. A szerkesztő nem
formaság: *aki átteszi az ágyat egy másik osztályra, azzal együtt azt is
eldönti, ki látja majd az ott fekvő beteget.*

### Amit a validáló néz

- **Párhuzamosan nyitott szakasz** — egy hely egy időben egy helyen áll,
  különben az összegzés kétszer veszi.
- **Átfedő szakaszok.**
- **Múltbeli hivatkozás olyan helyre, ami akkor nem volt érvényes** — a jelentés
  így olyan szervezeti egységhez rendelné az esetet, ahol az nem történhetett.
- **Ok nélküli lezárás.**
