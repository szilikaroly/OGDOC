# Nyomonkövethetőség és őrzési lánc

Ez a fejezet az ISO 20387 nyomonkövethetőségi követelményének és a 2008. évi XXI. törvény
kódolt tárolási előírásának a közös megvalósítása.

**A mérce:** egy külső auditor bármely mintáról rekonstruálni tudja a **teljes életútját** —
kitől, mikor, milyen hozzájárulással, milyen preanalitikai körülmények közt, hol tárolva,
hányszor kivéve, kinek kiadva, mi lett vele.

---

## 1. Három azonosító, három célra — soha nem keverednek

| Azonosító | Mit azonosít | Ki látja | Hol él |
|---|---|---|---|
| **`patients.id`** (UUID) | a személyt a rendszerben | ellátó szerepkörök, RLS mögött | `patients` |
| **`taj`** | a személyt hivatalosan | szűk kör, `phi: true` | `patients`, kizárva minden exportból |
| **`donor_code`** | az adományozót **a biobankban** | mintakezelő | `bb_donor` |
| **`research_pseudonym`** | az adományozót **a kutatási adatban** | kutató | `study_links` |

```
patients.id ──┬──▶ bb_donor.donor_code      (biobanki azonosító)
              │         └─▶ bb_specimen.*   (minták)
              │
              └──▶ study_links.research_pseudonym   (kutatási azonosító)
                        └─▶ export, lekérdezés, publikáció
```

**A kódkulcs — a `patients.id` ↔ `donor_code` ↔ `research_pseudonym` összerendelés — külön
védett.** Aki a kutatási adaton dolgozik, nem fér hozzá; aki a kódkulcsot kezeli, nem kutat
a de-identifikált adaton. Ez a `00-keret.md` összeférhetetlenségi szabályának technikai
vetülete.

> **Kutatásonként külön pszeudonim.** Ha ugyanaz az adományozó két kutatásban szerepel, két
> különböző kutatási azonosítót kap. Így a két adatállomány külön-külön nem összekapcsolható
> — ez lényegesen csökkenti az újraazonosítás kockázatát.

---

## 2. A minta azonosítója és az alikvot-fa

Egy levétel több csőbe kerül, egy csőből több alikvot lesz, egy alikvotból nukleinsav.
Ez **fa**, nem lista, és a leszármazást végig követni kell.

```
bb_collection_event        egy levételi esemény
  └─ bb_specimen           „szülő" minta (pl. 1 cső EDTA-vér)
       ├─ bb_aliquot       alikvot #1  (plazma)
       ├─ bb_aliquot       alikvot #2  (plazma)
       └─ bb_aliquot       alikvot #3  (buffy coat)
            └─ bb_derivative   DNS-izolátum
```

Minden szinten saját, **tartós, újra ki nem osztható** azonosító. Egy megsemmisített alikvot
azonosítója soha nem kerül újra kiadásra — különben az audit-nyom hamis lesz.

**Az azonosító formátuma** legyen ember által olvasható és gépi ellenőrzésre alkalmas
(ellenőrző karakterrel), mert a fizikai címkékről kézzel is beírják.

---

## 3. Amit minden mintáról tudni kell

| Csoport | Mezők |
|---|---|
| **Eredet** | adományozó (kódolva), levételi esemény, dátum-idő, levevő, `clinical_encounters` hivatkozás |
| **Hozzájárulás** | melyik nyilatkozat, melyik verzió, mely pontokra, státusz (`active` / `withdrawn`) |
| **Preanalitika** | SPREC vagy egyenértékű: mintatípus, alvadásgátló, a levételtől a feldolgozásig eltelt idő, centrifugálás, tárolási hőmérséklet, edény |
| **Feldolgozás** | mely SOP **melyik verziója** szerint, ki végezte, mikor |
| **Tárolás** | helyszín → eszköz → polc → doboz → pozíció; hőmérsékleti osztály |
| **Állapot** | mennyiség, `freeze_thaw_count`, QC-eredmények, státusz |
| **Életút** | minden állapotváltozás időbélyeggel, felhasználóval, indoklással |

---

## 4. Az őrzési lánc: minden esemény naplózva

```jsonc
// bb_specimen_event — csak beszúrható, sosem módosítható vagy törölhető
{
  "specimen_id": "…",
  "event_type": "collected | received | processed | aliquoted | stored |
                 retrieved | thawed | qc_performed | shipped | returned |
                 withdrawn | destroyed | nonconformity",
  "occurred_at": "2026-09-01T14:22:00Z",
  "recorded_at": "2026-09-01T14:25:11Z",
  "actor_id": "…",
  "location_from": "…", "location_to": "…",
  "sop_ref": "SOP-06 v2.1",
  "reason": "…",
  "temperature_c": -80,
  "notes": "…"
}
```

**Csak beszúrható tábla** (append-only): javítás nem felülírás, hanem új, helyesbítő esemény,
amely hivatkozik a javítottra. Ez az, amitől az audit-nyom hiteles.

### 4.1 A visszamenőleges hatásvizsgálat

Ez az a képesség, ami miatt az egész szerkezet megéri. Ha egy fagyasztó két napig 12 fokon
állt:

```
1. mely minták voltak benne abban az időablakban?      ← tárolási esemény-történet
2. mi történt velük azóta?                             ← esemény-lánc
3. melyeket adtuk ki közben, és kinek?                 ← kiadási események
4. melyekre épült már közlemény?                       ← kutatás-hivatkozás
```

Négy lekérdezés, mind a `20` modul eszközeivel. **Enélkül a válasz „nem tudjuk"**, ami egy
auditon és egy tudományos vitában egyaránt vállalhatatlan.

---

## 5. Fizikai és digitális összekötése

| Elem | Megoldás |
|---|---|
| Címke | 2D vonalkód (DataMatrix), kriogén körülményekre alkalmas |
| Leolvasás | minden mozgatásnál — kézi beírás csak kivételként, jelölve |
| Pozíció | doboz-térkép, vizuális megjelenítéssel |
| Leltár | rendszeres fizikai egyeztetés a nyilvántartással; az eltérés **nemmegfelelőség** |

> **A leltár-eltérés nem adminisztratív hiba.** Ha egy minta nincs ott, ahol lennie kell,
> az vagy elveszett, vagy dokumentálatlanul mozgatták — mindkettő NC, kivizsgálással.

---

## 6. Megőrzés és selejtezés

| Adatkör | Megőrzés |
|---|---|
| Minta-rekord és eseménylánc | **a minta megsemmisítése után is**, a jogszabályi és kutatási megőrzési idő szerint |
| Hozzájárulási nyilatkozat | a leghosszabb kapcsolódó megőrzési idő |
| Kódkulcs | amíg a visszaazonosítás jogszerű célja fennáll; **utána megsemmisítendő** |
| Auditnapló | a MIR megőrzési szabálya szerint |

**A kódkulcs megsemmisítése nem elhanyagolható lépés**: ez az a pillanat, amikor a
pszeudonimizált adat közelebb kerül az anonimhoz. De genetikai adatnál — ld. `02-gdpr.md` —
ez akkor sem jelent teljes anonimitást.

---

## 7. Elfogadási kritérium

1. Egy tetszőleges mintáról **egy képernyőn** megjelenik a teljes életút, a levételtől a
   jelenlegi állapotig, minden eseménnyel és a hatályos SOP-verziókkal.
2. Egy adott fagyasztó adott időablakára lekérdezhető, mely minták voltak benne.
3. A kutatói szerepkör **egyetlen** olyan mezőt sem lát, amiből az adományozó azonosítható.
4. Egy visszavont adományozó mintája a visszavonás után nem jelenik meg egyetlen kiadási
   listában sem — **teszttel bizonyítva**.
