# Modul 23 — Genetikai tanácsadás és genetikai vizsgálatok

| | |
|---|---|
| **Cél** | A teljes genetikai útvonal: prekoncepcionális és postkoncepcionális tanácsadás, szűrés, diagnosztika, eredményközlés, kaszkád-vizsgálat |
| **Forrás** | v16 (dinamikus családfa, hordozói kockázat) + ÚJ |
| **Becsült változó** | ~220 |
| **Fázis** | 3 (tanácsadás és szűrés) → 4 (teljes) |
| **Függ** | 02, 03, 05, 22; és a `megfeleles/` réteg |

## Mi van már meg

**A v16-ban:** a **dinamikus családfa** (6b szekció) — anyai és apai ág, rokononként 20
betegség, életkor, a diagnózis megbízhatósága és **az adat forrása**, dokumentációs hiány
külön jelzéssel. Ez a genetikai tanácsadás legfontosabb bemenete, és készen van. Mellette
a `FAMILY` tömb 21 tétele, benne **8 tisztázatlan diagnózisú** tétel (`f_ucard`, `f_udeath`,
`f_uneuro`, `f_uren`, `f_ucanc`, `f_uhaem`, `f_umeta`, `f_usyn`), konszangvinitás (`f_cons`)
és etnikai hordozói kockázat (`f_ethn`); továbbá a triszómia-kockázat FMF a priori
(Snijders) táblából és az I. trimeszteri szűrés keretei.

**A platformon:** `clinical_diagnoses` (`snomed_code`, `certainty`), `questionnaires` motor,
`followup_*` (esedékesség), `document_templates` + `generate-pdf` (leletek), `gdpr_consents`.

**Nincs meg:** maga a tanácsadási folyamat, a vizsgálat-nyilvántartás, a variánsok
osztályozása és újraértékelése, a NIPT-specifikus logika, a kaszkád-vizsgálat.

> A modul jogi kerete a [`../megfeleles/03-magyar-jog.md`](../megfeleles/03-magyar-jog.md)
> (2008. évi XXI. tv.) és a [`../megfeleles/02-gdpr.md`](../megfeleles/02-gdpr.md)
> (genetikai adat mint különleges kategória).

---

## 1. A modul alapelve: a tanácsadás nem melléklet, hanem kapu

A 2008. évi XXI. törvény szerint a genetikai tanácsadás **a vizsgálat előtt és az eredmény
közlésekor** kötelező. A rendszerben ez nem emlékeztető, hanem **blokk**:

```
humángenetikai vizsgálat indítása
   ├─ megtörtént a PRE-teszt tanácsadás?  ─── nem ──▶ BLOKKOL
   ├─ van írásbeli, tájékozott beleegyezés a konkrét vizsgálatra?  ─── nincs ──▶ BLOKKOL
   └─ rögzítve: kér-e visszajelzést váratlan leletről?  ─── nincs ──▶ BLOKKOL

eredmény közlése
   └─ POST-teszt tanácsadás nélkül az eredmény nem adható ki a betegnek
```

### 1.1 Nondirektivitás — amit a rendszer nem csinálhat

A genetikai tanácsadás **nondirektív**: a tanácsadó tájékoztat, nem javasol döntést,
különösen nem a terhesség folytatásáról vagy megszakításáról.

**A rendszer ezt tiszteletben tartja:**

- a felület **nem javasol** terhességmegszakítást vagy folytatást
- kockázati számot mutat, értelmezési kerettel — nem „teendőt"
- a döntés rögzítése tényszerű: mi történt, mikor, ki tájékoztatta
- a teendőmotor genetikai leletre **nem generál direktív javaslatot**, csak
  információt és felajánlható lehetőségeket

Ez eltér a rendszer többi részétől, ahol a teendőmotor kifejezetten javasol. **A különbséget
a modul kódjában ki kell kényszeríteni**, nem a szövegezésre bízni.

---

## 2. Prekoncepcionális útvonal

### 2.1 Indikációk

| Indikáció | Forrásváltozó |
|---|---|
| Családi halmozódás, ismert monogénes betegség | `hx.family.mono`, családfa |
| **Konszangvinitás** | `hx.family.cons` |
| Etnikai hordozói kockázat (thalassaemia, CF, Tay-Sachs…) | `hx.family.ethn` |
| Korábbi érintett terhesség vagy gyermek | `hx.repro.anom`, `hx.repro.tri` |
| Ismételt (≥2) vetélés, magzati elhalás | `hx.repro.loss` |
| Ismert kromoszóma-átrendeződés hordozó | ÚJ |
| Előrehaladott szülői életkor (anyai és **apai**) | `ctx.age`, `patage` |
| Anyai betegség vagy teratogén gyógyszer (PKU, epilepszia, izotretinoin, valproát) | `hx.endo.*`, `06` gyógyszerelés |
| Ismeretlen okú fejlődési zavar a családban | `hx.family.dev`, `f_usyn` |

### 2.2 Hordozói szűrés (carrier screening)

| Változó | Tartalom |
|---|---|
| `gen.carrier.panel` | melyik panel, hány gén, melyik labor |
| `gen.carrier.result` | hordozó / nem hordozó gének szerint |
| `gen.carrier.partner` | **a partner vizsgálata** — recesszív betegségnél enélkül az eredmény nem értelmezhető |
| `gen.carrier.reproRisk` | **computed**: a pár együttes ismétlődési kockázata |

> **A partner bevonása a modul egyik legfontosabb pontja.** Egy autoszomális recesszív
> hordozó státusz önmagában nem kockázat; a pár együttes státusza az. A rendszer ezt
> párként kezeli, és a partner **önálló érintett**, saját beleegyezéssel.

---

## 3. Postkoncepcionális (prenatális) útvonal

### 3.1 Szűrés és diagnosztika — a különbség kikényszerítve

| | **Szűrés** | **Diagnosztika** |
|---|---|---|
| Mit ad | valószínűséget | diagnózist |
| Módszerek | kombinált I. trimeszteri (NT + PAPP-A + szabad β-hCG), **NIPT/cfDNA**, II. trimeszteri szérum, morfológiai UH | CVS, amniocentézis, cordocentézis |
| Pozitív eredmény | **megerősítést igényel** | önmagában diagnózis |
| Kockázat | nincs beavatkozási kockázat | vetélési kockázat |

**A rendszer sosem jeleníti meg a szűrési eredményt diagnózisként.** Egy pozitív NIPT a
felületen `szűrés: magas kockázat` marad, és a diagnózis mező üres, amíg megerősítő vizsgálat
nem történt.

### 3.2 NIPT — külön figyelmet érdemel

A NIPT a leggyakrabban félreértett vizsgálat, mert nagyon jó a szenzitivitása, és ezért
sokan diagnosztikusnak hiszik. **Nem az.**

| Változó | Tartalom |
|---|---|
| `gen.nipt.lab`, `gen.nipt.method` | labor, technológia |
| **`gen.nipt.fetalFraction`** | magzati frakció %-ban — **kötelező mező** |
| `gen.nipt.conditions` | mely állapotokra vizsgált (T21, T18, T13, SCA, mikrodeléciók) |
| `gen.nipt.result` | alacsony kockázat / magas kockázat / **nem értékelhető (no-call)** |
| `gen.nipt.ppv` | **computed**: a pozitív prediktív érték az adott állapotra és a beteg előzetes kockázatára |
| `gen.nipt.confirmed` | megerősítő vizsgálat típusa és eredménye |

**Négy dolog, amit a modul kimond:**

1. **A PPV nem a teszt tulajdonsága, hanem a helyzeté.** Ugyanaz a NIPT egy 25 éves nőnél
   T13-ra sokkal alacsonyabb PPV-t ad, mint egy 40 évesnél T21-re. A rendszer a PPV-t
   **kiszámolja és megmutatja** a szenzitivitás/specificitás és az előzetes kockázat alapján —
   mert enélkül a „pozitív" szó félrevezető.
2. **A nemi kromoszóma-eltérésekre (SCA) és a mikrodeléciókra a teljesítmény lényegesen
   rosszabb.** Ezt a felület az adott állapotnál kiírja, nem lábjegyzetben.
3. **Az alacsony magzati frakció önmagában információ.** No-call esetén az ismétlés mellett
   figyelembe kell venni, hogy alacsony FF társulhat aneuploidiával és magas anyai BMI-vel —
   nem egyszerűen „technikai hiba".
4. **Váratlan lelet lehetősége.** A NIPT anyai eltérést (CNV, ritkán malignitás),
   eltűnt ikret vagy konfinált placentáris moszaicizmust is jelezhet. Ezt a **teszt előtti
   tanácsadásnak tartalmaznia kell**, és a beteg előre eldönti, kér-e ilyen visszajelzést
   (ld. `../megfeleles/06-beleegyezes.md` 4. pont).

### 3.3 Invazív diagnosztika

| Változó | Tartalom |
|---|---|
| `gen.invasive.type` | CVS · amniocentézis · cordocentézis |
| `gen.invasive.ga` | gesztációs kor a beavatkozáskor |
| `gen.invasive.indication` | kódolt indikáció |
| `gen.invasive.complication` | szövődmény |
| `gen.invasive.anti_d` | **Rh-negatív anyánál anti-D profilaxis** — a rendszer emlékeztet |

Az anti-D emlékeztető azért van itt, mert invazív beavatkozásnál könnyen elmarad, és a
következménye a következő terhességet érinti.

---

## 4. Vizsgálati módszerek és a leletek

| Módszer | Mit lát | Mit **nem** lát |
|---|---|---|
| Kariotípus | nagy szerkezeti eltérés, aneuploidia | < ~5–10 Mb eltérés, pontmutáció |
| QF-PCR | gyors aneuploidia-válasz (T21/18/13, X/Y) | minden mást |
| **CMA** (array) | kópiaszám-eltérés nagy felbontásban | kiegyensúlyozott átrendeződés, pontmutáció |
| FISH | célzott lókusz | mindent, amire nem célzott |
| Génpanel | a panel génjei | a panelen kívüli géneket |
| **WES / WGS** | pontmutációk széles körben | lefedettségi hiányok, ismétlődő régiók, epigenetika |

**Minden lelet kötelező kísérő mezői:**

```jsonc
{
  "method": "WES", "lab": "…", "accreditation": "…",
  "coverage": "…",                    // mit fedett le és mit nem
  "limitations": "…",                 // MIT NEM ZÁR KI — kötelező mező
  "reference_genome": "GRCh38",
  "variants": [ { "gene": "…", "hgvs": "…",
                  "classification": "P | LP | VUS | LB | B",   // ACMG 5 fokozat
                  "zygosity": "…", "inheritance": "…", "evidence": "…" } ],
  "reanalysis_due": "2028-09-01"
}
```

A **`limitations` mező kötelező**, mert a leggyakoribb klinikai félreértés az, hogy egy
negatív lelet „kizárja" a genetikai okot. Nem zárja ki — csak azt, amire vizsgált.

### 4.1 A VUS kezelése

A bizonytalan jelentőségű variáns (**VUS**) nem diagnózis, és **nem közölhető úgy, mintha az
lenne**. A modul három dolgot kényszerít ki:

1. A VUS nem kerül a `clinical_diagnoses` táblába — külön `gen.variant` rekordként él.
2. A VUS-ra **újraértékelési esedékesség** áll be (`reanalysis_due`), a `followup_*` motorral.
3. Ha az újraértékelés átsorolja (VUS → patogén vagy → benignus), a rendszer **újrakontaktálási
   feladatot generál** — feltéve, hogy a beteg ehhez hozzájárult.

> Az újraértékelés az a kötelezettség, amit a legtöbb rendszer nem kezel, és amiből évekkel
> később derül ki, hogy egy család fontos információt nem kapott meg.

---

## 5. Eredményközlés és a tudáshoz való jog

| Változó | Tartalom |
|---|---|
| `gen.counsel.pre` | pre-teszt tanácsadás: mikor, ki, mit fedett le |
| `gen.counsel.post` | post-teszt tanácsadás: mikor, ki, mit közölt |
| `gen.counsel.outcome` | **pozitív / negatív / bizonytalan** lelet közlése megtörtént |
| `gen.counsel.wantsSecondary` | kér-e váratlan leletről visszajelzést (3 állapot: igen / nem / **később dönt**) |
| `gen.counsel.decision` | a beteg döntése, tényszerűen — **nem minősítve** |
| `gen.counsel.materials` | milyen írásos tájékoztatót kapott |

**A nem tudáshoz való jog is védett.** Ha a beteg nem kér visszajelzést, a lelet **nem
közlendő** — és a felület sem villantja fel „csak úgy". A rendszer a leletet elrejti, és a
tanácsadó látja, hogy elrejtett lelet van.

---

## 6. Kaszkád-vizsgálat — ahol a genetika túllép a betegen

Ha patogén variáns derül ki, a vér szerinti rokonok **érintettek lehetnek** — de ők nem a
mi betegeink, és nem járultak hozzá semmihez.

| Elem | Szabály |
|---|---|
| Ki tájékoztat | **elsősorban a beteg**, a rendszer által adott, rokonoknak szóló tájékoztató levéllel |
| Az intézmény szerepe | segít, de nem keresi meg a rokont a beteg felhatalmazása nélkül |
| Nyilvántartás | `gen.cascade.informed` — mely rokoni kört tájékoztatta a beteg, mikor |
| Ha a rokon jelentkezik | önálló beteggé válik, saját beleegyezéssel és tanácsadással |

> Ez a genetika legkényesebb adatvédelmi pontja, és a
> [`../megfeleles/02-gdpr.md`](../megfeleles/02-gdpr.md) DPIA-kockázatai közt is nevesítve
> van: a rokonok érintettek anélkül, hogy hozzájárultak volna.

---

## 7. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` **családfa és családi anamnézis** (a legfontosabb bemenet),
`02` (`ctx.ga`, szülői életkor), `05` genetikai labor, `12` onkológia (BRCA/Lynch),
`22` biobank (a minta, amiből a vizsgálat készül), `24` IVF (PGT).

**⇨ Mit tölt fel**:

| Cél | Mit |
|---|---|
| `03` családfa | a lelet **visszaírja** a családfát: a megerősített diagnózis megbízhatósága `documented` lesz |
| `05` ultrahang | célzott morfológiai vizsgálat a talált eltérésre |
| `13` ellátás tervezés | genetikai konzílium, kaszkád-vizsgálat, újraértékelés esedékessége |
| `22` biobank | a minta felhasználási státusza |
| `24` IVF | PGT-M/PGT-SR indikáció a talált variánsra |
| `17` kódolás | BNO (Q-fejezet), és a genetikai lelet **nem** automatikusan diagnózis |

---

## 8. Elfogadási kritérium

1. **Tanácsadás nélkül nem indítható humángenetikai vizsgálat**, és eredmény nem közölhető.
2. Egy pozitív NIPT a felületen **szűrési eredményként** jelenik meg, a **kiszámolt PPV-vel**,
   és a diagnózis mező üres marad megerősítő vizsgálatig.
3. Minden lelet mellett megjelenik, **mit nem zár ki** (`limitations`).
4. Egy VUS nem kerül a diagnózisok közé, és **újraértékelési esedékességet** kap.
5. Ha a beteg nem kér visszajelzést váratlan leletről, a lelet **nem jelenik meg** a
   betegnek szóló nézetekben.
6. A teendőmotor genetikai leletre **nem generál direktív javaslatot** — teszttel ellenőrizve.

---

## 9. Nyitott kérdések

1. **Melyik variáns-klasszifikációs keretet használjuk**, és melyik verzióját? Az ACMG
   ötfokozatú rendszer az általános, de a részletszabályok frissülnek — verziózni kell,
   mint a FIGO-stádiumokat.
2. **A NIPT PPV-számításhoz** honnan vesszük a teljesítménymutatókat? Laboronként eltérnek;
   **javaslat**: a labor által megadott értékek a leletnél, forrásmegjelöléssel — ne
   beégetett általános szám.
3. **Az újraértékelés gyakorisága** VUS-nál (javaslat: 2 év), és ki felel érte.
4. **A kaszkád-tájékoztatás** intézményi protokollja — meddig megy az intézmény felelőssége.
5. Prenatális WES/WGS bevezetése — ha igen, a váratlan lelet kezelése lényegesen összetettebb.
