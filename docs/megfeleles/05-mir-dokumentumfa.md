# Minőségirányítási rendszer — dokumentumfa

Az ISO 20387 „A" opciója szerinti saját MIR. Ez a fejezet azt sorolja fel, **milyen
dokumentumoknak kell létezniük**, nem magukat a dokumentumokat.

## A négy szint

```
1. POLITIKA        mit vállalunk        1 dokumentum, a vezetés írja alá
2. KÉZIKÖNYV       hogyan épül fel      1 dokumentum, a MIR térképe
3. ELJÁRÁS / SOP   hogyan csináljuk     ~35 dokumentum
4. ŰRLAP / FELJEGYZÉS  mi történt       kitöltve = bizonyíték
```

**A szabály:** minden SOP-hoz tartozik legalább egy űrlap vagy rendszerbeli feljegyzés. SOP
feljegyzés nélkül nem bizonyít semmit; feljegyzés SOP nélkül nem szabályozott.

---

## 1. Politika (1 dokumentum)

**Biobank-politika** — a vezetés nyilatkozata: célok, hatókör, pártatlanság, bizalmas
kezelés, a minőség iránti elkötelezettség, erőforrás-biztosítás. Évente felülvizsgálva.

## 2. Minőségirányítási kézikönyv (1 dokumentum)

A MIR térképe: szervezeti felépítés, felelősségek, a folyamatok kapcsolata, a dokumentumok
listája, a szabvány követelményeire való hivatkozás.

---

## 3. Eljárások és SOP-ok

### 3.1 Irányítási eljárások (8)

| Kód | Tárgy |
|---|---|
| QP-01 | Dokumentumszabályozás — létrehozás, jóváhagyás, verzió, kiadás, elavulás |
| QP-02 | Feljegyzések szabályozása — azonosítás, tárolás, védelem, megőrzési idő, selejtezés |
| QP-03 | Belső audit — terv, auditor-kompetencia, lefolytatás, jelentés |
| QP-04 | Vezetőségi átvizsgálás — bemenetek, kimenetek, gyakoriság |
| QP-05 | Nemmegfelelőség kezelése — azonosítás, elkülönítés, hatásvizsgálat |
| QP-06 | Helyesbítő tevékenység (CAPA) — gyökérok-elemzés, hatékonyság-ellenőrzés |
| QP-07 | Kockázatok és lehetőségek kezelése |
| QP-08 | Panaszkezelés |

### 3.2 Erőforrás-eljárások (6)

| Kód | Tárgy |
|---|---|
| QP-10 | Személyzet: kompetencia-követelmény, képzés, felhatalmazás, újraértékelés |
| QP-11 | Létesítmények és környezeti feltételek, beléptetés |
| QP-12 | Berendezések: nyilvántartás, kalibrálás, karbantartás, meghibásodás |
| QP-13 | Hőmérséklet-monitorozás és riasztás |
| QP-14 | Külső szolgáltatók értékelése és felügyelete |
| QP-15 | Katasztrófaterv és üzletmenet-folytonosság |

### 3.3 Minta-életciklus SOP-ok (14)

| Kód | Tárgy |
|---|---|
| SOP-01 | Beleegyezés felvétele és rögzítése |
| SOP-02 | **Beleegyezés visszavonásának kezelése** |
| SOP-03 | Mintavétel és azonosítás |
| SOP-04 | Minta fogadása, elfogadási és elutasítási kritériumok |
| SOP-05 | Preanalitikai adatok rögzítése (SPREC) |
| SOP-06 | Feldolgozás és alikvotálás |
| SOP-07 | Nukleinsav-izolálás |
| SOP-08 | Tartósítás és fagyasztás |
| SOP-09 | Tárolás, tárolóhely-kiosztás |
| SOP-10 | Kivétel és fagyasztás-olvadás nyilvántartás |
| SOP-11 | Minőségellenőrzés mintatípusonként |
| SOP-12 | Kiadás és szállítás |
| SOP-13 | **Megsemmisítés** |
| SOP-14 | Leltár és készletegyeztetés |

### 3.4 Adat- és hozzáférési SOP-ok (7)

| Kód | Tárgy |
|---|---|
| SOP-20 | Azonosítórendszer és kódkulcs kezelése |
| SOP-21 | Adatbevitel, ellenőrzés, javítás |
| SOP-22 | De-identifikálás és export |
| SOP-23 | Hozzáférési kérelem elbírálása |
| SOP-24 | Anyagátadási megállapodás (MTA) |
| SOP-25 | Adatvédelmi incidens kezelése (GDPR Art. 33–34) |
| SOP-26 | Rendszervalidálás, mentés és helyreállítási próba |

**Összesen kb. 35 dokumentum.** Ez sok, de nem elkerülhető: az audit ezeket kéri.

> **Gyakorlati tanács:** ne írjuk meg mind a 35-öt előre. A Fázis 2-ben a minta-életciklus
> SOP-jai kellenek (SOP-01…14), mert azok nélkül nem lehet mintát gyűjteni. Az irányítási
> eljárások a Fázis 3-ban, az akkreditációs felkészüléskor.

---

## 4. A dokumentumok formája — egységesen

Minden szabályozott dokumentum fejlécében:

| Mező | Példa |
|---|---|
| Azonosító | `SOP-05` |
| Cím | Preanalitikai adatok rögzítése |
| Verzió | `2.1` |
| Hatályos | `2026-09-01` |
| Készítette / Ellenőrizte / Jóváhagyta | név, beosztás, dátum |
| Következő felülvizsgálat | `2027-09-01` |
| Kapcsolódó dokumentumok | `SOP-03`, `QP-12` |
| Változás | mi változott az előző verzióhoz képest |

**A verziózás nem formalitás:** egy retrospektív minta mellett tudni kell, **melyik SOP
szerint** kezelték. Ezért a `bb_specimen` rekord tárolja a feldolgozáskor hatályos SOP
verziószámát.

---

## 5. Amit a rendszer automatizál

A dokumentumkezelés nagy részét a platform már tudja (`document_templates`, `documents`,
`document_tags`, verziózás, `generate-pdf`). Amit ehhez hozzáteszünk:

| Funkció | Mit ad |
|---|---|
| **Felülvizsgálati esedékesség** | a `followup_*` motor mintájára: melyik SOP jár le, mikor |
| **Olvasási nyugtázás** | ki olvasta el az új verziót — kompetencia-bizonyíték |
| **SOP ↔ minta kapcsolat** | a mintarekord hivatkozik a feldolgozáskor hatályos verzióra |
| **Elavult verzió zárolása** | a régi verzió olvasható marad (audit), de nem használható |
| **Feljegyzés-megőrzés figyelése** | mely feljegyzések megőrzési ideje jár le |

> Az utolsó a legritkább és a legértékesebb: a legtöbb MIR azon bukik el, hogy a
> dokumentumokat senki nem vizsgálja felül, és az audit két éve lejárt SOP-okat talál.
> Ha a rendszer figyeli, ez nem fordulhat elő észrevétlenül.
