# 07 — Kalkulátorok, tételesen

> **Ez a fájl generált.** Forrása a `core/calc/defs.ts`; a `node tools/gen-calc-doc.ts`
> állítja elő, és a CI ellenőrzi, hogy egyezik-e. Kézzel ne szerkeszd — a képletet
> a definícióban javítsd, és generáltasd újra.

## Áttekintés

**48 kalkulátor**, ebből **36 használható** és **12 kapu mögött** áll.

| Azonosító | Név | Típus | Modul | Eredmény | Állapot |
|---|---|---|---|---|---|
| `calc.age` | Életkor | formula | admin | a | használható |
| `calc.apgar` | Apgar-pontszám | score | szuloszoba | {pont} | használható |
| `calc.birthYear` | Születési év | formula | admin | — | használható |
| `calc.bishop` | Bishop-pontszám | score | score | {pont} | használható |
| `calc.bmi` | Testtömegindex | formula | anthro | kg/m2 | használható |
| `calc.bsa.mosteller` | Testfelszín (Mosteller) | formula | anthro | m2 | használható |
| `calc.bses.total` | BSES-SF összpontszám | score | prom | {pont} | használható |
| `calc.bssr.total` | BSS-R összpontszám | score | prom | {pont} | használható |
| `calc.cmqcc.ob.sepsis.screen` | CMQCC szülészeti szepszis — élettani szűrő | score | labour | {trigger} | **kapu mögött** |
| `calc.cmqcc.stage` | CMQCC vérzési stádium | classification | labour | {stádium} | **kapu mögött** |
| `calc.cpr` | Cerebro-placentáris arány | formula | imaging | 1 | használható |
| `calc.crcl` | Kreatinin-clearance (Cockcroft–Gault) | formula | rx | mL/min | **kapu mögött** |
| `calc.edd.naegele` | Várható szülési időpont (Naegele) | formula | ctx | — | használható |
| `calc.efw.hadlock` | Becsült magzati súly (Hadlock) | formula | vizsgalatok | g | **kapu mögött** |
| `calc.efw.ig21` | Becsült magzati súly (INTERGROWTH-21st) | formula | vizsgalatok | g | **kapu mögött** |
| `calc.egfr.ckdepi2021` | eGFR (CKD-EPI 2021) | formula | lab | mL/min/{1.73_m2} | **kapu mögött** |
| `calc.energy.pregnancy` | Terhességi energiaszükséglet | formula | diet | kcal | **kapu mögött** |
| `calc.epds.total` | EPDS összpontszám | score | psy | {pont} | használható |
| `calc.eq5d.profile` | EQ-5D-5L profil | formula | prom | — | használható |
| `calc.ferrimanGallwey` | Ferriman–Gallwey-pontszám | score | status | {pont} | használható |
| `calc.ga.crl.ig21` | Gesztációs kor CRL-ből (INTERGROWTH-21st) | formula | vizsgalatok | wk | **kapu mögött** |
| `calc.ga.hc.ig21` | Gesztációs kor fejkörfogatból (INTERGROWTH-21st) — csak FL hiányában | formula | vizsgalatok | wk | **kapu mögött** |
| `calc.ga.hcfl.ig21` | Gesztációs kor fejkörfogatból és combcsonthosszból (INTERGROWTH-21st) | formula | vizsgalatok | wk | **kapu mögött** |
| `calc.ga.lmp` | Gesztációs kor az utolsó menstruációból | formula | ctx | wk | használható |
| `calc.isth.dic.pregnancy` | ISTH terhességi DIC-pontszám | score | labour | {pont} | **kapu mögött** |
| `calc.labour.hours` | Vajúdás óta eltelt idő | formula | labour | h | használható |
| `calc.latch.total` | LATCH összpontszám | score | neo | {pont} | használható |
| `calc.lmwh.prophylaxis` | Enoxaparin profilaktikus napi adag | target | rx | mg | használható |
| `calc.map` | Középartériás nyomás | formula | vitals | mm[Hg] | használható |
| `calc.meows` | MEOWS — szülészeti korai figyelmeztető pontszám | score | labour | {trigger} | használható |
| `calc.mibs.total` | MIBS összpontszám | score | psy | {pont} | használható |
| `calc.mspss.total` | MSPSS összpontszám | score | psy | {pont} | használható |
| `calc.neo.dextroseGel` | 40% dextróz gél adag | formula | neo | mL | használható |
| `calc.nrp.epi.iv` | NRP — epinephrin adag (IV/IO) | formula | neo | mg | használható |
| `calc.nrp.volume` | NRP — volumenbolus | formula | neo | mL | használható |
| `calc.omqsofa` | omqSOFA — szülészeti gyorsszepszis-szűrés | score | labour | {pont} | használható |
| `calc.phq9.total` | PHQ-9 összpontszám | score | psy | {pont} | használható |
| `calc.protein.pregnancy` | Terhességi fehérjeszükséglet | target | diet | g | használható |
| `calc.pulsePressure` | Pulzusnyomás | formula | vitals | mm[Hg] | használható |
| `calc.qbl.total` | Teljes mennyiségi vérvesztés | formula | labour | mL | **kapu mögött** |
| `calc.qtc.bazett` | Korrigált QT (Bazett) | formula | ekg | ms | használható |
| `calc.qtc.fridericia` | Korrigált QT (Fridericia) | formula | ekg | ms | használható |
| `calc.rom.hours` | Burokrepedés óta eltelt idő | formula | status | h | használható |
| `calc.shockIndex` | Sokk-index | formula | vitals | 1 | használható |
| `calc.weightGain` | Terhességi súlygyarapodás | formula | anthro | kg | használható |
| `calc.whodas.total` | WHODAS 2.0-12 összpontszám | score | prom | {pont} | használható |
| `calc.whooley.total` | Whooley-kérdések összege | score | psy | {pont} | használható |
| `calc.whr` | Derék–csípő arány | formula | status | 1 | használható |

## A két kapu

Minden kalkulátor ugyanazon a futtatón (`runCalc`) megy át, és ott két szabály érvényes,
amit egyik képlet sem tud megkerülni:

1. **Hiányzó vagy lejárt bemenet** → nincs eredmény, hanem a hiányzók felsorolása.
   A lejárt érték ugyanúgy hiányzik, mint a nem létező: egy tegnapi SpO₂ ma nem bemenet.
2. **Ellenőrizetlen konstans** → nincs eredmény, teljes bemenettel sem.

A második szabály nem elméleti. A fullPIERS dokumentált együtthatóival a modell
klinikailag fordítva viselkedik: a súlyosabb beteg kap alacsonyabb kockázatot.
Ha akkor nem lett volna kapu, a rendszer megnyugtató számot mutatott volna
egy súlyos HELLP-esetre.

## Használható kalkulátorok

### `calc.age` — Életkor

| | |
|---|---|
| **Típus** | formula |
| **Modul** | admin |
| **Eredmény** | a, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `patient.age` |

**Képlet**

```
kor = ⌊(most − születési dátum) / 365,2425 nap⌋
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `patient.birthDate` | — | igen | A beteg születési dátuma. |
| `ctx.now` | — | igen | A számítások vonatkoztatási időpontja. |

**Forrás** — Gregorián naptári év átlaghossza.

**Ellenőrzés** — Osztás és lefelé kerekítés; a 365,2425 a gregorián átlagév.

> **Amit tudni kell** — A kor LEVEZETETT, nem tárolt adat. Tárolt korral a rekord egy év múlva hazudik — ezért a rendszerben csak a születési dátum tárolódik, és az `phi` jelölésű.

---

### `calc.apgar` — Apgar-pontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | szuloszoba |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `nb.apgar.total` |

**Képlet**

```
öt tétel (szín, pulzus, reflex, tónus, légzés) összege, egyenként 0–2 pont
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `nb.apgar.appearance` | — | igen | Az Apgar-pontszám szín (appearance) tétele (bőrszín, cyanosis). |
| `nb.apgar.pulse` | — | igen | Az Apgar-pontszám pulzus (pulse) tétele (szívfrekvencia). |
| `nb.apgar.grimace` | — | igen | Az Apgar-pontszám reflexingerlékenység (grimace) tétele (reflexválasz). |
| `nb.apgar.activity` | — | igen | Az Apgar-pontszám izomtónus (activity) tétele (tónus). |
| `nb.apgar.respiration` | — | igen | Az Apgar-pontszám légzés (respiration) tétele (légzési erőfeszítés). |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 4 | súlyosan deprimált — azonnali resuscitatio | redflag |
| 4 ≤ x < 7 | közepesen deprimált | watch |
| 7 ≤ x | jó adaptáció | normal |

**Forrás** — Apgar V. Anesth Analg 1953;32:260-267; AAP/ACOG Committee Opinion 644 (2015)

**Ellenőrzés** — Öt tétel összeadása, nincs súlyozás.

> **Amit tudni kell** — Az Apgar NEM az asphyxia mérőszáma és NEM alkalmas a kimenetel előrejelzésére egyetlen újszülöttön — az AAP/ACOG közös állásfoglalása ezt kifejezetten kimondja. Koraszülöttnél az éretlenség önmagában csökkenti. A rendszer ezért az értéket sávval együtt mutatja, jóslat nélkül.

---

### `calc.birthYear` — Születési év

| | |
|---|---|
| **Típus** | formula |
| **Modul** | admin |
| **Eredmény** | —, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `demog.birthYear` |

**Képlet**

```
év = a születési dátum naptári éve (UTC)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `patient.birthDate` | — | igen | A beteg születési dátuma. |

**Forrás** — ICHOM Pregnancy & Childbirth Standard Set v5.0, PCB001

**Ellenőrzés** — Naptári év kiolvasása. Nincs illesztett paraméter.

> **Amit tudni kell** — A születési DÁTUM `phi`, a születési ÉV nem az. Az export ezért az évet viszi — a dátumot soha.

---

### `calc.bishop` — Bishop-pontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | score |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `score.bishop.total` |

**Képlet**

```
tágulat(0cm→0 · ≤2cm→1 · ≤4cm→2 · >4cm→3) + elvékonyodás(≤30%→0 · ≤50%→1 · ≤80%→2 · >80%→3) + beszállás(kód) + konzisztencia(kód) + pozíció(kód)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `exam.cervix.dilation` | cm | igen | A méhszáj tágultsága centiméterben. |
| `exam.cervix.effacement` | % | igen | A cervix elvékonyodása százalékban. |
| `exam.cervix.station` | — | igen | kódolt, a kód a pontérték |
| `exam.cervix.consistency` | — | igen | A cervix tapintási konzisztenciája. |
| `exam.cervix.position` | — | igen | A cervix elhelyezkedése. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 6 | éretlen méhszáj — érlelés mérlegelendő | watch |
| 6 ≤ x < 8 | köztes | normal |
| 8 ≤ x | érett méhszáj — indukció valószínűen sikeres | normal |

**Forrás** — Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol 1964;24:266-268 · PMID 14199536

**Ellenőrzés** — A sávhatárok a klasszikus 0–3 táblával egyeznek; nincs illesztett együttható.

> **Amit tudni kell** — A beszállás KÓDOLT mező, nem a −3…+3 klinikai skála: a −1 és a 0 EGY pontsávba esik. Szabad számbeírásként ez rendszeres elszámolást okoz — ezért választós.

---

### `calc.bmi` — Testtömegindex

| | |
|---|---|
| **Típus** | formula |
| **Modul** | anthro |
| **Eredmény** | kg/m2, 1 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `anthro.bmi` |

**Képlet**

```
BMI = testsúly[kg] / (testmagasság[m])²
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `anthro.height` | cm | igen | Cipő nélkül mért testmagasság. |
| `anthro.weight.prepregnancy` | kg | igen | A fogantatás előtti testsúly. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 18.5 | soványság | watch |
| 18.5 ≤ x < 25 | normális | normal |
| 25 ≤ x < 30 | túlsúly | watch |
| 30 ≤ x < 40 | elhízás | watch |
| 40 ≤ x | III. fokú elhízás | redflag |

**Forrás** — WHO Technical Report Series 894 (2000)

**Ellenőrzés** — Definíciós képlet, nincs illesztett együtthatója.

> **Amit tudni kell** — Terhesség alatt a TERHESSÉG ELŐTTI testsúlyból számolandó. A futó terhességi testsúlyból számolt BMI klinikailag értelmetlen, és a CMQCC, a VBAC és a VTE számítás mind ezt fogyasztja — az elrontása végigfut a rendszeren.

---

### `calc.bsa.mosteller` — Testfelszín (Mosteller)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | anthro |
| **Eredmény** | m2, 2 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `anthro.bsa` |

**Képlet**

```
BSA = √(testmagasság[cm] × testsúly[kg] / 3600)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `anthro.height` | cm | igen | Cipő nélkül mért testmagasság. |
| `anthro.weight.current` | kg | igen | A vizsgálat napján mért testsúly. |

**Forrás** — Mosteller RD. Simplified calculation of body-surface area. N Engl J Med 1987;317:1098 · PMID 3657876

**Ellenőrzés** — Egyetlen konstans (3600), a közleményben szereplő alakkal egyezik.

> **Amit tudni kell** — Kemoterápiás dózishoz a 12. modul használja. Terhességben a növekvő testsúly miatt az AKTUÁLIS súlyból számol, nem a terhesség előttiből.

---

### `calc.bses.total` — BSES-SF összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | prom |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `prom.bses.total` |

**Képlet**

```
a 14 tétel összege, egyenként 1–5 pont (14–70)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `prom.bses.q1` | — | igen | A beteg saját válasza. |
| `prom.bses.q2` | — | igen | A beteg saját válasza. |
| `prom.bses.q3` | — | igen | A beteg saját válasza. |
| `prom.bses.q4` | — | igen | A beteg saját válasza. |
| `prom.bses.q5` | — | igen | A beteg saját válasza. |
| `prom.bses.q6` | — | igen | A beteg saját válasza. |
| `prom.bses.q7` | — | igen | A beteg saját válasza. |
| `prom.bses.q8` | — | igen | A beteg saját válasza. |
| `prom.bses.q9` | — | igen | A beteg saját válasza. |
| `prom.bses.q10` | — | igen | A beteg saját válasza. |
| `prom.bses.q11` | — | igen | A beteg saját válasza. |
| `prom.bses.q12` | — | igen | A beteg saját válasza. |
| `prom.bses.q13` | — | igen | A beteg saját válasza. |
| `prom.bses.q14` | — | igen | A beteg saját válasza. |

**Forrás** — Dennis CL. The breastfeeding self-efficacy scale: psychometric assessment of the short form. J Obstet Gynecol Neonatal Nurs 2003;32(6):734-744 · PMID 14649593

**Ellenőrzés** — Tizennégy tétel összeadása. Nincs illesztett paraméter.

> **Amit tudni kell** — A skálának NINCS általánosan elfogadott vágóértéke: az alacsonyabb pontszám kisebb önhatékonyságot jelez, de hogy hol kezdődik a beavatkozási igény, populációfüggő. A rendszer ezért sávot nem ad.

---

### `calc.bssr.total` — BSS-R összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | prom |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `prom.bssr.total` |

**Képlet**

```
a 10 tétel összege, egyenként 0–4 pont (0–40)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `prom.bssr.q1` | — | igen | A beteg saját válasza. |
| `prom.bssr.q2` | — | igen | A beteg saját válasza. |
| `prom.bssr.q3` | — | igen | A beteg saját válasza. |
| `prom.bssr.q4` | — | igen | A beteg saját válasza. |
| `prom.bssr.q5` | — | igen | A beteg saját válasza. |
| `prom.bssr.q6` | — | igen | A beteg saját válasza. |
| `prom.bssr.q7` | — | igen | A beteg saját válasza. |
| `prom.bssr.q8` | — | igen | A beteg saját válasza. |
| `prom.bssr.q9` | — | igen | A beteg saját válasza. |
| `prom.bssr.q10` | — | igen | A beteg saját válasza. |

**Forrás** — Hollins Martin CJ, Martin CR. Development and psychometric properties of the Birth Satisfaction Scale-Revised (BSS-R). Midwifery 2014;30(6):610-619 · PMID 23976427

**Ellenőrzés** — Tíz tétel összeadása. A fordított tételek besorolása a törzsben van.

> **Amit tudni kell** — A BSS-R HÁROM ALSKÁLÁRA bomlik, de a hivatalos tétel-besorolás nincs betöltve — a rendszer ezért CSAK az összpontszámot adja. Az alskálák külön értelmezése enélkül nem megbízható.

---

### `calc.cpr` — Cerebro-placentáris arány

| | |
|---|---|
| **Típus** | formula |
| **Modul** | imaging |
| **Eredmény** | 1, 2 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `us.cpr` |

**Képlet**

```
CPR = a. cerebri media PI / a. umbilicalis PI
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `us.mca.pi` | 1 | igen | A középső agyi artéria pulzatilitási indexe. |
| `us.ua.pi` | 1 | igen | A köldökartéria pulzatilitási indexe. |

**Forrás** — Baschat AA, Gembruch U. The cerebroplacental Doppler ratio revisited. Ultrasound Obstet Gynecol 2003;21(2):124-127 · PMID 12601831

**Ellenőrzés** — Két index hányadosa, nincs illesztett együtthatója.

> **Amit tudni kell** — A SZÁMNAK ITT SINCS FIX SÁVJA: a normáltartomány GESZTÁCIÓS KORTÓL függ, és normogramból olvasandó (`registry/normogramok/`), nem egy állandó küszöbből. A gyakran idézett „CPR < 1” határ terminus közelében használatos, korábban félrevezet. A rendszer ezért az arányt kiszámolja, de a kóros/normális megítélést a normogram-motorra bízza — az pedig ellenőrizetlen tábla mellett nem ad eredményt.

---

### `calc.edd.naegele` — Várható szülési időpont (Naegele)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | ctx |
| **Eredmény** | —, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `ctx.edd` |

**Képlet**

```
EDD = utolsó menstruáció első napja + 280 nap
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `ctx.lmp` | — | igen | Az utolsó menstruációs vérzés első napja. |

**Forrás** — Naegele-szabály; ACOG Committee Opinion 700 (2017)

**Ellenőrzés** — 280 nap, 28 napos ciklust és 14. napi ovulációt feltételezve.

> **Amit tudni kell** — A 280 nap 28 napos ciklust feltételez. Eltérő ciklushossznál a különbséget hozzá kell adni — a rendszer ezt csak akkor teszi meg, ha a ciklushossz rögzítve van, és a korrekciót külön megjeleníti.

---

### `calc.epds.total` — EPDS összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | psy |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `psy.epds.total` |

**Képlet**

```
a tíz tétel összege, egyenként 0–3 pont (0–30)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `psy.epds.q1` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 1. tétele: nevetés, humor érzékelése. |
| `psy.epds.q2` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 2. tétele: örömteli várakozás. |
| `psy.epds.q3` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 3. tétele: önvád szükségtelenül. |
| `psy.epds.q4` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 4. tétele: szorongás, aggodalom ok nélkül. |
| `psy.epds.q5` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 5. tétele: félelem, pánik ok nélkül. |
| `psy.epds.q6` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 6. tétele: túlterheltség érzése. |
| `psy.epds.q7` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 7. tétele: alvászavar szomorúság miatt. |
| `psy.epds.q8` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 8. tétele: szomorúság, nyomott hangulat. |
| `psy.epds.q9` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 9. tétele: sírás. |
| `psy.epds.q10` | — | igen | Az Edinburgh-i szülés utáni depresszió-skála 10. tétele: önkárosítás gondolata. |

**Forrás** — Cox JL, Holden JM, Sagovsky R. Detection of postnatal depression. Br J Psychiatry 1987;150:782-786; magyar validáció: Töreki A et al. Midwifery 2014;30(8):911-918 · PMID 3651732

**Ellenőrzés** — Tíz tétel összeadása, súlyozás nélkül.

> **Amit tudni kell** — A VÁGÓÉRTÉK NEM ITT VAN: az antepartum és a postnatalis küszöb eltér, és a besorolás a kérdőív-motorban, a kontextus ismeretében történik. A 10. tétel („önkárosítás gondolata”) pozitív válasza az ÖSSZPONTSZÁMTÓL FÜGGETLENÜL vörös zászló — ezt egy összeg soha nem tudná kifejezni. Részlegesen kitöltött skálából nincs összpontszám: a hiányzó tétel arányosítása nem validált eljárás.

---

### `calc.eq5d.profile` — EQ-5D-5L profil

| | |
|---|---|
| **Típus** | formula |
| **Modul** | prom |
| **Eredmény** | —, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `prom.eq5d.profile` |

**Képlet**

```
profil = a mozgékonyság, önellátás, tevékenységek, fájdalom és szorongás szintje egymás után
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `prom.eq5d.mobility` | — | igen | A beteg saját válasza. |
| `prom.eq5d.selfCare` | — | igen | A beteg saját válasza. |
| `prom.eq5d.activities` | — | igen | A beteg saját válasza. |
| `prom.eq5d.pain` | — | igen | A beteg saját válasza. |
| `prom.eq5d.anxiety` | — | igen | A beteg saját válasza. |

**Forrás** — Herdman M et al. Development and preliminary testing of the new five-level version of EQ-5D (EQ-5D-5L). Qual Life Res 2011;20(10):1727-1736 · PMID 21479777

**Ellenőrzés** — Helyiérték szerinti összefűzés; nincs illesztett paraméter.

> **Amit tudni kell** — EZ KÓD, NEM MENNYISÉG: minden jegye önálló jelentésű, átlagot vagy különbséget képezni belőle értelmetlen. HASZNOSSÁGI INDEXET a rendszer NEM ad: ahhoz országspecifikus, licencelt értékkészlet kell, és egy másik ország értékkészletével számolt index nem magyar adat.

---

### `calc.ferrimanGallwey` — Ferriman–Gallwey-pontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | status |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `status.fert.fg.total` |

**Képlet**

```
kilenc androgénfüggő testtájék szőrzete, egyenként 0–3 pont, összegezve (0–36)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `status.fert.fg.upperLip` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A felső ajak felett. |
| `status.fert.fg.chin` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. Az áll és az állkapocs vonala. |
| `status.fert.fg.chest` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A szegycsont és a mellbimbók környéke. |
| `status.fert.fg.upperAbdomen` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A köldök felett, a középvonalban. |
| `status.fert.fg.lowerAbdomen` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A köldök alatt, a szeméremcsont felé. |
| `status.fert.fg.arm` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A felkar külső felszíne. |
| `status.fert.fg.thigh` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A comb elülső felszíne. |
| `status.fert.fg.upperBack` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A lapockák közötti terület. |
| `status.fert.fg.lowerBack` | — | igen | A terminális (vastag, pigmentált) szőrzet mennyisége. A derék és a keresztcsont fölött. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 4 | nincs hirsutismus | normal |
| 4 ≤ x < 8 | határeset — populációfüggő | watch |
| 8 ≤ x | hirsutismus | watch |

**Forrás** — Ferriman D, Gallwey JD. J Clin Endocrinol Metab 1961;21:1440-1447; Escobar-Morreale HF et al. Hum Reprod Update 2012;18:146-170 · PMID 13892577

**Ellenőrzés** — Kilenc tétel összeadása, súlyozás nélkül. A módosított (mFG) változat kilenc tájékot pontoz — az eredeti tizenegyet; a rendszer a módosítottat használja.

> **Amit tudni kell** — A ≥ 8 küszöb ETNIKUMFÜGGŐ: kelet-ázsiai populációban ≥ 2–3 már kóros, mediterrán és közel-keleti populációban a 8 alatti érték is normális lehet. A pontszám ezért önmagában nem diagnózis. A KOZMETIKAI KEZELÉS (gyantázás, lézer) csökkenti a pontszámot anélkül, hogy az androgénhatás változna — ezt a felvételkor rögzíteni kell, különben a score hamisan megnyugtat.

---

### `calc.ga.lmp` — Gesztációs kor az utolsó menstruációból

| | |
|---|---|
| **Típus** | formula |
| **Modul** | ctx |
| **Eredmény** | wk, 2 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `ctx.ga` |

**Képlet**

```
GA[hét] = (most − utolsó menstruáció első napja) / 7 nap
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `ctx.lmp` | — | igen | epoch-ezredmásodpercre konvertálva |
| `ctx.now` | — | igen | A számítások vonatkoztatási időpontja. |

**Forrás** — Naegele-konvenció; ACOG Committee Opinion 700 (2017)

**Ellenőrzés** — Napkülönbség osztva héttel. Nincs illesztett paraméter.

> **Amit tudni kell** — A PRECEDENCIA a lényeg, nem a képlet: IVF-nél a transzferdátum, egyébként a korai (11–14. hét) CRL pontosabb az LMP-nél. Ha van korai UH, az felülírja. A rendszer nem választ helyetted — a 02. modul precedenciaszabálya dönt, és a döntés láthatóan meg van jelölve.

---

### `calc.labour.hours` — Vajúdás óta eltelt idő

| | |
|---|---|
| **Típus** | formula |
| **Modul** | labour |
| **Eredmény** | h, 1 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `labour.hour` |

**Képlet**

```
eltelt óra = (most − vajúdás kezdete) / 3 600 000 ms
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `labour.startedAt` | — | igen | Mikor indult meg a vajúdás. |
| `ctx.now` | — | igen | A számítások vonatkoztatási időpontja. |

**Forrás** — Időkülönbség; a partogram X-tengelye.

**Ellenőrzés** — Kivonás és osztás.

> **Amit tudni kell** — A NULLPONT DÖNTI EL, MIT LÁTUNK: a beteg beszámolója szerinti kezdet és az AKTÍV szak kezdete nem ugyanaz, és a partogram az aktív szakot rajzolja. A kettő összekeverése hamis elhúzódást mutat, és fölösleges beavatkozáshoz vezet.

---

### `calc.latch.total` — LATCH összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | neo |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `neo.latch.total` |

**Képlet**

```
az öt tétel összege, egyenként 0–2 pont (0–10)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `neo.latch.latch` | — | igen | A LATCH-skála első tétele (L). |
| `neo.latch.audible` | — | igen | A LATCH-skála második tétele (A). |
| `neo.latch.nipple` | — | igen | A LATCH-skála harmadik tétele (T). |
| `neo.latch.comfort` | — | igen | A LATCH-skála negyedik tétele (C). |
| `neo.latch.hold` | — | igen | A LATCH-skála ötödik tétele (H). |

**Forrás** — Jensen D, Wallace S, Kelsay P. LATCH: a breastfeeding charting system and documentation tool. J Obstet Gynecol Neonatal Nurs 1994;23(1):27-32 · PMID 8176525

**Ellenőrzés** — Öt tétel összeadása. Nincs illesztett paraméter.

> **Amit tudni kell** — AZ ÖSSZPONTSZÁM ELFEDI A TÉTELT: egy 8 pontos összeg is jelenthet 0 pontos „kényelem” tételt — vagyis fájdalmas szoptatást, ami önmagában beavatkozást indokol. Az eszköz emellett a licenc-kapu miatt ma NEM vehető fel.

---

### `calc.lmwh.prophylaxis` — Enoxaparin profilaktikus napi adag

| | |
|---|---|
| **Típus** | target |
| **Modul** | rx |
| **Eredmény** | mg, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `rx.lmwh.dailyDose` |

**Képlet**

```
testsúlysáv szerint: < 50 kg → 20 mg · 50–90 kg → 40 mg · 91–130 kg → 60 mg · 131–170 kg → 80 mg · > 170 kg → 0,6 mg/kg naponta
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `anthro.weight.current` | kg | igen | A vizsgálat napján mért testsúly. |

**Forrás** — RCOG Green-top Guideline No. 37a: Reducing the Risk of Venous Thromboembolism during Pregnancy and the Puerperium (2015)

**Ellenőrzés** — Sávos táblázat, nem illesztett képlet: a sávhatárok az ajánlásból szó szerint átvehetők, nincs mit visszaszámolni.

> **Amit tudni kell** — A TESTSÚLY A TERHESSÉG ALATT VÁLTOZIK: a korai terhességben mért súly alapján beállított adag a terminusra alul dozírozhat, ezért az adag újraértékelendő. Elhízásnál (BMI ≥ 35) egyes szerzők 0,5 mg/kg 12 óránkénti adagolást javasolnak (Overcash 2015, PMID 26658126) — ez MÁSIK séma, nem ennek a kalkulátornak a kimenete, és a rendszer nem keveri a kettőt. Beszűkült vesefunkciónál (CrCl < 30) a profilaktikus adag is csökkentendő, és anti-Xa szint mérése mérlegelendő.

---

### `calc.map` — Középartériás nyomás

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vitals |
| **Eredmény** | mm[Hg], 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `vitals.map` |

**Képlet**

```
MAP = (SBP + 2 × DBP) / 3
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `vitals.bp.systolic` | mm[Hg] | igen | Az artériás nyomás csúcsértéke. |
| `vitals.bp.diastolic` | mm[Hg] | igen | Az artériás nyomás legalacsonyabb értéke. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 65 | elégtelen szervi perfúzió kockázata | redflag |
| 65 ≤ x < 105 | normális | normal |
| 105 ≤ x | emelkedett | watch |

**Forrás** — Klasszikus diasztolés súlyozású közelítés; nem invazív mérésre.

**Ellenőrzés** — Közelítő definíció, nem illesztett modell. Nyugalmi pulzusszámra érvényes.

> **Amit tudni kell** — Tachycardiában a diasztolé rövidül, és a képlet FELÜLBECSÜL. Vajúdás alatt, ahol a pulzus rendszeresen 110 fölött van, ezt figyelembe kell venni. Invazív méréssel rögzített MAP mindig előbbre való a számítottnál (provenance: device).

---

### `calc.meows` — MEOWS — szülészeti korai figyelmeztető pontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | labour |
| **Eredmény** | {trigger}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `score.meows` |

**Képlet**

```
a tartományon kívüli („kiváltó”) paraméterek SZÁMA: RR sys < 90 vagy > 150 · RR dia > 100 · pulzus < 50 vagy > 120 · légzésszám < 10 vagy > 30 · hőmérséklet < 35 vagy > 38 · SpO₂ < 95%
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `vitals.bp.systolic` | mm[Hg] | igen | Az artériás nyomás csúcsértéke. |
| `vitals.bp.diastolic` | mm[Hg] | igen | Az artériás nyomás legalacsonyabb értéke. |
| `vitals.pulse` | /min | igen | Percenkénti szívfrekvencia. |
| `vitals.rr` | /min | igen | Percenkénti légvételek száma. |
| `vitals.temp` | Cel | igen | Maghőmérséklet. |
| `vitals.spo2` | % | igen | Pulzoximéterrel mért perifériás oxigénszaturáció. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 1 | nincs kiváltó paraméter | normal |
| 1 ≤ x < 2 | egy sárga kiváltó — ismételt mérés | watch |
| 2 ≤ x | kettő vagy több kiváltó — sürgős orvosi értékelés | redflag |

**Forrás** — Singh S, McGlennan A, England A, Simons R. A validation study of the CEMACH recommended modified early obstetric warning system (MEOWS). Anaesthesia 2012;67(1):12-18 · PMID 22050279

**Ellenőrzés** — KÜSZÖBSZÁMLÁLÁS, nem illesztett modell: a paraméterek tartományon kívülre esését számolja. A küszöbök a CEMACH-ajánlásból származnak, és a helyi protokoll felülírhatja őket — ezért a tábla a képletben, nem elrejtve.

> **Amit tudni kell** — A MEOWS ÉRZÉKENY, DE NEM SPECIFIKUS: vajúdás alatt a fájdalom és az erőlködés miatt a pulzus és a légzésszám élettanilag is kiléphet a sávból. A pontszám a KLINIKAI ÉRTÉKELÉST indítja el, nem helyettesíti. És fordítva: a fiatal terhes sokáig kompenzál — a normális MEOWS nem zárja ki a súlyos állapotot.

---

### `calc.mibs.total` — MIBS összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | psy |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `psy.mibs.total` |

**Képlet**

```
a pozitív tételek (gyengédség, óvó érzés, öröm) ÁTFORDÍTVA (3 − pont), a negatívak (ellenérzés, közömbösség) közvetlenül; magasabb pontszám = gyengébb kötődés
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `psy.mibs.affection` | — | igen | Az anya-csecsemő kötődés érzelmi tétele: gyengédség. |
| `psy.mibs.resentment` | — | igen | Az anya-csecsemő kötődés érzelmi tétele: ellenérzés. |
| `psy.mibs.neutrality` | — | igen | Az anya-csecsemő kötődés érzelmi tétele: közömbösség. |
| `psy.mibs.protective` | — | igen | Az anya-csecsemő kötődés érzelmi tétele: óvó érzés. |
| `psy.mibs.joy` | — | igen | Az anya-csecsemő kötődés érzelmi tétele: öröm a babával. |

**Forrás** — Taylor A, Atkins R, Kumar R et al. A new Mother-to-Infant Bonding Scale. Arch Womens Ment Health 2005;8(1):45-51; ICHOM PCB105–112 · PMID 15868385

**Ellenőrzés** — Összeadás átfordított tételekkel. AZ ÁTFORDÍTÁS A PONTOZÁS RÉSZE, nem kényelmi átalakítás: a fordított tételek nélkül a magas pontszám hol jó, hol rossz kötődést jelentene.

> **Amit tudni kell** — A KÖTŐDÉSI ZAVAR ÉS A DEPRESSZIÓ KÜLÖN DOLOG, bár együtt járhat: a depresszió kezelése önmagában nem oldja meg a kötődési nehézséget, és fordítva. A két eszközt együtt kell olvasni, nem egymás helyett.

---

### `calc.mspss.total` — MSPSS összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | psy |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `psy.mspss.total` |

**Képlet**

```
a három tétel összege, egyenként 1–7 pont (3–21)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `psy.mspss.family` | — | igen | Az észlelt társas támogatás mértéke: család. |
| `psy.mspss.friends` | — | igen | Az észlelt társas támogatás mértéke: barátok. |
| `psy.mspss.significantOther` | — | igen | Az észlelt társas támogatás mértéke: partner, közeli személy. |

**Forrás** — Zimet GD et al. The Multidimensional Scale of Perceived Social Support. J Pers Assess 1988;52(1):30-41; ICHOM Pregnancy and Childbirth Standard Set (PCB007–009)

**Ellenőrzés** — Három tétel összeadása. Az ICHOM rövidített, három tételes változata.

> **Amit tudni kell** — AZ ÉSZLELT támogatást méri, nem a ténylegeset — és klinikailag épp az észlelt számít. Az alacsony érték a perinatális depresszió egyik legerősebb MÓDOSÍTHATÓ kockázati tényezője, és az egyetlen, amin az ellátás szervezésével közvetlenül lehet segíteni.

---

### `calc.neo.dextroseGel` — 40% dextróz gél adag

| | |
|---|---|
| **Típus** | formula |
| **Modul** | neo |
| **Eredmény** | mL, 1 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `neo.dextroseGel.dose` |

**Képlet**

```
adag [mL] = testsúly [kg] × 0,5
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `nb.birthWeight` | g | igen | A gyermek súlya születéskor. |

**Forrás** — Harris DL et al. Dextrose gel for neonatal hypoglycaemia (the Sugar Babies Study): a randomised, double-blind, placebo-controlled trial. Lancet 2013;382(9910):2077-2083 · PMID 24075361

**Ellenőrzés** — Egyetlen szorzás, 0,5 mL/ttkg 40%-os dextróz gél buccalisan.

> **Amit tudni kell** — A gél a SZOPTATÁS MELLETT adandó, nem helyette — a vizsgálatban is így szerepelt. A beavatkozási küszöb életkorfüggő: az első 4 órában más, mint 24 óra után, ezért egyetlen vércukorérték önmagában nem javallat.

---

### `calc.nrp.epi.iv` — NRP — epinephrin adag (IV/IO)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | neo |
| **Eredmény** | mg, 3 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `neo.nrp.epi.dose` |

**Képlet**

```
adag [mg] = testsúly [kg] × 0,02
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `nb.birthWeight` | g | igen | grammban rögzítve |

**Forrás** — Aziz K et al. Part 5: Neonatal Resuscitation — 2020 AHA Guidelines for CPR and ECC. Circulation 2020;142(16_suppl_2):S524-S550; NRP 8th edition (AAP/AHA 2021)

**Ellenőrzés** — Egyetlen szorzás, az ajánlás 0,02 mg/ttkg IV/IO adagjával (1:10 000 hígításban 0,2 mL/ttkg). A gramm→kilogramm váltás a képlet része.

> **Amit tudni kell** — AZ ADAG MELLETT A TÉRFOGAT SZÁMÍT A GYAKORLATBAN: 1:10 000 hígításnál 0,2 mL/ttkg. A hígítás elrontása nagyságrendi tévedés — az adag önmagában nem elég, a készítmény koncentrációját is látni kell.

---

### `calc.nrp.volume` — NRP — volumenbolus

| | |
|---|---|
| **Típus** | formula |
| **Modul** | neo |
| **Eredmény** | mL, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `neo.nrp.volume.dose` |

**Képlet**

```
bolus [mL] = testsúly [kg] × 10
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `nb.birthWeight` | g | igen | A gyermek súlya születéskor. |

**Forrás** — Aziz K et al. Part 5: Neonatal Resuscitation. Circulation 2020;142(16_suppl_2):S524-S550; NRP 8th edition (AAP/AHA 2021)

**Ellenőrzés** — Egyetlen szorzás, 10 mL/ttkg fiziológiás sóoldat.

> **Amit tudni kell** — A volumenpótlás javallata SZŰK: igazolt vagy alaposan feltételezett vérvesztés, rossz perfúzióval. Volumenhiány nélkül adva a bolus árt.

---

### `calc.omqsofa` — omqSOFA — szülészeti gyorsszepszis-szűrés

| | |
|---|---|
| **Típus** | score |
| **Modul** | labour |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `score.omqsofa` |

**Képlet**

```
négy kritérium, egyenként 1 pont: pulzus > 90 · légzésszám > 20 · hőmérséklet < 36 vagy > 38 · SpO₂ < 95%. ≥ 2 pont → szepszisgyanú
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `vitals.pulse` | /min | igen | Percenkénti szívfrekvencia. |
| `vitals.rr` | /min | igen | Percenkénti légvételek száma. |
| `vitals.temp` | Cel | igen | Maghőmérséklet. |
| `vitals.spo2` | % | igen | Pulzoximéterrel mért perifériás oxigénszaturáció. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 2 | nem utal szepszisre | normal |
| 2 ≤ x | szepszisgyanú — protokoll indítása | redflag |

**Forrás** — Bowyer L et al. SOMANZ guidelines for the investigation and management of sepsis in pregnancy. Aust N Z J Obstet Gynaecol 2017;57(5):540-551 · PMID 28670748

**Ellenőrzés** — Négy küszöb megszámlálása, súlyozás nélkül.

> **Amit tudni kell** — A SZÜLÉSZETI MÓDOSÍTÁS lényege, hogy a terhességi élettani változásokat figyelembe veszi — az eredeti qSOFA vérnyomás- és tudatállapot-kritériuma terhesen későn jelez. De GYORSSZŰRÉS marad: a negatív eredmény nem zárja ki a szepszist, és a laktát mérése önálló döntés.

---

### `calc.phq9.total` — PHQ-9 összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | psy |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `psy.phq9.total` |

**Képlet**

```
a kilenc tétel összege, egyenként 0–3 pont (0–27)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `psy.phq9.q1` | — | igen | A PHQ-9 1. tétele: örömtelenség. |
| `psy.phq9.q2` | — | igen | A PHQ-9 2. tétele: nyomott hangulat. |
| `psy.phq9.q3` | — | igen | A PHQ-9 3. tétele: alvászavar. |
| `psy.phq9.q4` | — | igen | A PHQ-9 4. tétele: fáradtság. |
| `psy.phq9.q5` | — | igen | A PHQ-9 5. tétele: étvágyváltozás. |
| `psy.phq9.q6` | — | igen | A PHQ-9 6. tétele: önértékelési zavar. |
| `psy.phq9.q7` | — | igen | A PHQ-9 7. tétele: koncentrációs nehézség. |
| `psy.phq9.q8` | — | igen | A PHQ-9 8. tétele: pszichomotoros változás. |
| `psy.phq9.q9` | — | igen | A PHQ-9 9. tétele: önkárosítás gondolata. |

**Forrás** — Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med 2001;16(9):606-613 · PMID 11556941

**Ellenőrzés** — Kilenc tétel összeadása, súlyozás nélkül.

> **Amit tudni kell** — TERHESSÉGBEN ÉS GYERMEKÁGYBAN A SZOMATIKUS TÉTELEK FÉLREVEZETNEK: az alvászavar, a fáradtság és az étvágyváltozás élettani is lehet, és önmagukban felnyomják az összpontszámot. Ezért perinatális populációban az EPDS az elsőként választandó eszköz — az kifejezetten kerüli a szomatikus tételeket. A 9. tétel ugyanúgy kritikus, mint az EPDS 10. tétele.

---

### `calc.protein.pregnancy` — Terhességi fehérjeszükséglet

| | |
|---|---|
| **Típus** | target |
| **Modul** | diet |
| **Eredmény** | g, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `diet.proteinTarget` |

**Képlet**

```
fehérje[g/nap] = 1,1 g × terhesség előtti testsúly[kg]
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `anthro.weight.prepregnancy` | kg | igen | A fogantatás előtti testsúly. |

**Forrás** — Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids (2005)

**Ellenőrzés** — KONSZENZUSOS EGYÜTTHATÓ, nem illesztett regresszió: az 1,1 g/kg a DRI terhességi ajánlott bevitele, egy szorzás. Ezért — az energiaképlettel szemben — nincs kapu mögött.

> **Amit tudni kell** — A TERHESSÉG ELŐTTI testsúlyra számol: a futó terhességi súlyból számolt fehérjecél a magzat és a magzatvíz tömegét is fehérjeigénynek tekintené. Szoptatás alatt az igény magasabb (kb. 1,3 g/kg) — az ott érvényes cél nem ebből a kalkulátorból jön. Vesebetegségben és májelégtelenségben a fehérjecél KORLÁTOZOTT lehet: ez a kalkulátor az egészséges terhesre szól, és a diétás protokoll felülírhatja.

---

### `calc.pulsePressure` — Pulzusnyomás

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vitals |
| **Eredmény** | mm[Hg], 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `vitals.pulsePressure` |

**Képlet**

```
PP = SBP − DBP
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `vitals.bp.systolic` | mm[Hg] | igen | Az artériás nyomás csúcsértéke. |
| `vitals.bp.diastolic` | mm[Hg] | igen | Az artériás nyomás legalacsonyabb értéke. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 25 | szűkült — hypovolaemia gyanúja | redflag |
| 25 ≤ x < 60 | normális | normal |
| 60 ≤ x | tág | watch |

**Forrás** — Definíciós különbség.

**Ellenőrzés** — Kivonás.

> **Amit tudni kell** — A szűkült pulzusnyomás a vérzéses sokk KORAI jele, gyakran még normális szisztolés érték mellett. A szülészeti vérzésnél ez a leggyakrabban figyelmen kívül hagyott vitális jel.

---

### `calc.qtc.bazett` — Korrigált QT (Bazett)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | ekg |
| **Eredmény** | ms, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `ekg.qtc.bazett` |

**Képlet**

```
QTc = QT[ms] / √(RR[s]),  ahol RR = 60 / pulzus
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `ekg.qt` | ms | igen | A QRS kezdetétől a T-hullám végéig mért idő. |
| `vitals.pulse` | /min | igen | Percenkénti szívfrekvencia. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 460 | normális (nő) | normal |
| 460 ≤ x < 500 | megnyúlt | watch |
| 500 ≤ x | jelentősen megnyúlt — torsades kockázat | redflag |

**Forrás** — Bazett HC. Heart 1920;7:353-370

**Ellenőrzés** — Négyzetgyökös korrekció, egyetlen kitevővel.

> **Amit tudni kell** — A Bazett TÚLKORRIGÁL tachycardiában és alulkorrigál bradycardiában. Terhességben a fiziológiás tachycardia miatt ez rendszeres hamis pozitívot ad — 100/min felett a Fridericia megbízhatóbb, és a rendszer mindkettőt mutatja.

---

### `calc.qtc.fridericia` — Korrigált QT (Fridericia)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | ekg |
| **Eredmény** | ms, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `ekg.qtc.fridericia` |

**Képlet**

```
QTc = QT[ms] / ∛(RR[s]),  ahol RR = 60 / pulzus
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `ekg.qt` | ms | igen | A QRS kezdetétől a T-hullám végéig mért idő. |
| `vitals.pulse` | /min | igen | Percenkénti szívfrekvencia. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 460 | normális (nő) | normal |
| 460 ≤ x < 500 | megnyúlt | watch |
| 500 ≤ x | jelentősen megnyúlt — torsades kockázat | redflag |

**Forrás** — Fridericia LS. Acta Med Scand 1920;53:469-486

**Ellenőrzés** — Köbgyökös korrekció, egyetlen kitevővel.

> **Amit tudni kell** — Magas pulzusnál megbízhatóbb a Bazettnél; ezért terhességben ez az elsődlegesen mutatott érték.

---

### `calc.rom.hours` — Burokrepedés óta eltelt idő

| | |
|---|---|
| **Típus** | formula |
| **Modul** | status |
| **Eredmény** | h, 1 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `status.obs.membranes.hours` |

**Képlet**

```
eltelt óra = (most − burokrepedés időpontja) / 3 600 000 ms
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `status.obs.membranes.rupturedAt` | — | igen | Mikor repedt meg a magzatburok. |
| `ctx.now` | — | igen | A számítások vonatkoztatási időpontja. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 18 | 18 órán belül | normal |
| 18 ≤ x < 24 | 18 óra felett — GBS-profilaxis és fertőzésfigyelés | watch |
| 24 ≤ x | 24 óra felett — chorioamnionitis-rizikó, szülésbefejezés mérlegelendő | redflag |

**Forrás** — ACOG Practice Bulletin No. 217: Prelabor Rupture of Membranes (2020); CDC: Prevention of Perinatal Group B Streptococcal Disease (MMWR 2010)

**Ellenőrzés** — Időkülönbség osztása; a sávhatárok az idézett ajánlások küszöbei.

> **Amit tudni kell** — A BUROKREPEDÉS IDŐPONTJA majdnem mindig a beteg BESZÁMOLÓJA, nem mért adat — az érték `confidence: reported`, és órákat tévedhet. A 18 órás küszöb ezért figyelmeztetés, nem kapu: a klinikai kép (láz, magzati tachycardia, bűzös magzatvíz) felülírja. Elhúzódó, nem rögzített repedésnél a szám hiánya nem jelent rövid latenciát — `insufficient`, nem nulla.

---

### `calc.shockIndex` — Sokk-index

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vitals |
| **Eredmény** | 1, 2 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `vitals.shockIndex` |

**Képlet**

```
SI = pulzus[/min] / szisztolés vérnyomás[mm Hg]
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `vitals.pulse` | /min | igen | Percenkénti szívfrekvencia. |
| `vitals.bp.systolic` | mm[Hg] | igen | Az artériás nyomás csúcsértéke. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 0.9 | normális | normal |
| 0.9 ≤ x < 1.7 | emelkedett — fokozott figyelem | watch |
| 1.7 ≤ x | kritikus — masszív transzfúziós protokoll mérlegelendő | redflag |

**Forrás** — Szülészeti küszöbök: Nathan HL et al. BJOG 2015;122:268-275 · PMID 25546050

**Ellenőrzés** — A hányados triviális; a 0,9 és 1,7 küszöb a hivatkozott szülészeti közleményből, nem az általános traumatológiai 1,0-ból.

> **Amit tudni kell** — Terhességben a fiziológiás pulzusemelkedés miatt a nem-szülészeti küszöbök (SI > 1,0) hamis riasztást adnak. A szülészeti sáv fentebb kezdődik.

---

### `calc.weightGain` — Terhességi súlygyarapodás

| | |
|---|---|
| **Típus** | formula |
| **Modul** | anthro |
| **Eredmény** | kg, 1 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `anthro.weightGain` |

**Képlet**

```
súlygyarapodás = aktuális testsúly[kg] − terhesség előtti testsúly[kg]
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `anthro.weight.current` | kg | igen | A vizsgálat napján mért testsúly. |
| `anthro.weight.prepregnancy` | kg | igen | A fogantatás előtti testsúly. |

**Forrás** — IOM/NRC: Weight Gain During Pregnancy — Reexamining the Guidelines (2009)

**Ellenőrzés** — Kivonás, nincs illesztett együtthatója. Az ÉRTELMEZÉSE függ az IOM-táblától, maga a szám nem.

> **Amit tudni kell** — A számnak ÖNMAGÁBAN nincs sávja: az IOM 2009 célsávja a terhesség előtti BMI-től és a gesztációs kortól is függ (teljes terhességre, egyes magzat: sovány 12,5–18 kg; normális 11,5–16 kg; túlsúly 7–11,5 kg; elhízott 5–9 kg). Ezért itt szándékosan NINCS `bands` — a sávot a `calc.bmi` eredményével együtt kell megválasztani, és a felület a kettőt együtt jeleníti meg. Egy fix sáv itt minden elhízott terhesnél téves riasztást adna. A terhesség előtti testsúly gyakran a beteg emlékezete (`provenance: patient`) — ha az hibás, a gyarapodás is hibás, nem a képlet.

---

### `calc.whodas.total` — WHODAS 2.0-12 összpontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | prom |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `prom.whodas.total` |

**Képlet**

```
a 12 tétel összege, egyenként 1–5 pont, nullára tolva (0–48)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `prom.whodas.q1` | — | igen | A beteg saját válasza. |
| `prom.whodas.q2` | — | igen | A beteg saját válasza. |
| `prom.whodas.q3` | — | igen | A beteg saját válasza. |
| `prom.whodas.q4` | — | igen | A beteg saját válasza. |
| `prom.whodas.q5` | — | igen | A beteg saját válasza. |
| `prom.whodas.q6` | — | igen | A beteg saját válasza. |
| `prom.whodas.q7` | — | igen | A beteg saját válasza. |
| `prom.whodas.q8` | — | igen | A beteg saját válasza. |
| `prom.whodas.q9` | — | igen | A beteg saját válasza. |
| `prom.whodas.q10` | — | igen | A beteg saját válasza. |
| `prom.whodas.q11` | — | igen | A beteg saját válasza. |
| `prom.whodas.q12` | — | igen | A beteg saját válasza. |

**Forrás** — Üstün TB et al. Measuring Health and Disability: Manual for WHO Disability Assessment Schedule (WHODAS 2.0). WHO 2010

**Ellenőrzés** — Egyszerű összegzés; a tételek 1–5 skálája tételenként 1-gyel eltolva.

> **Amit tudni kell** — EGYSZERŰ ÖSSZEGZÉS. A WHODAS hivatalos, tételválasz-elméleti (IRT) pontozása MÁS számot ad, és nincs megvalósítva. A kettő nem cserélhető fel, és a nemzetközi összehasonlításnál jelezni kell, melyiket használtuk.

---

### `calc.whooley.total` — Whooley-kérdések összege

| | |
|---|---|
| **Típus** | score |
| **Modul** | psy |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `psy.whooley.total` |

**Képlet**

```
a két kérdés összege (0–2)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `psy.whooley.q1` | — | igen | A kétkérdéses depresszió-gyorsszűrés 1. kérdése. |
| `psy.whooley.q2` | — | igen | A kétkérdéses depresszió-gyorsszűrés 2. kérdése. |

**Forrás** — Whooley MA et al. Case-finding instruments for depression. J Gen Intern Med 1997;12(7):439-445; NICE CG192 / NG201 · PMID 9229283

**Ellenőrzés** — Két igen/nem kérdés összege.

> **Amit tudni kell** — GYORSSZŰRÉS, NEM DIAGNÓZIS: bármelyik igenlő válasz további vizsgálatot (EPDS vagy PHQ-9) indokol, de önmagában kezelést nem indít. A magas érzékenység ára az alacsony specificitás — a pozitív szűrés többségében nincs depresszió.

---

### `calc.whr` — Derék–csípő arány

| | |
|---|---|
| **Típus** | formula |
| **Modul** | status |
| **Eredmény** | 1, 2 tizedes |
| **Állapot** | ✅ használható |
| **Melyik változót tölti** | `status.endo.whr` |

**Képlet**

```
WHR = derékkörfogat[cm] / csípőkörfogat[cm]
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `status.endo.waist` | cm | igen | A derék legkisebb körfogata, illetve a köldök magasságában mért körfogat. |
| `status.endo.hip` | cm | igen | A csípő legnagyobb körfogata a trochanterek magasságában. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 0.85 | nem centrális zsíreloszlás (nő) | normal |
| 0.85 ≤ x | centrális zsíreloszlás (nő) — inzulinrezisztencia irányába mutat | watch |

**Forrás** — WHO: Waist circumference and waist–hip ratio — report of a WHO expert consultation (2008)

**Ellenőrzés** — Osztás. A 0,85-ös női küszöb a WHO 2008 konszenzusából.

> **Amit tudni kell** — A SÁVOK NŐI KÜSZÖBBEL SZÓLNAK (WHO: nő ≥ 0,85, férfi ≥ 0,90) — ez a rendszer nőgyógyászati kontextusából következik, nem univerzális. Terhesség alatt a derékkörfogat a magzat miatt nő: terhesen mért WHR nem értelmezhető zsíreloszlásként, ezért a mérés a terhesség előtti vagy a szülés utáni állapotra vonatkozik.

---

## Kapu mögött álló kalkulátorok

Ezek **teljes bemenettel sem adnak eredményt**. A kapu feloldásához valakinek össze
kell vetnie a konstansokat az elsődleges forrással, és a `verified` jelölést a
`verifiedNote`-tal együtt át kell állítania.

### `calc.cmqcc.ob.sepsis.screen` — CMQCC szülészeti szepszis — élettani szűrő

| | |
|---|---|
| **Típus** | score |
| **Modul** | labour |
| **Eredmény** | {trigger}, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `score.cmqcc.ob.sepsis` |

**Képlet**

```
Testhő < 36 °C vagy > 38 °C · Pulzus > 110/perc, tartósan · Légzésszám > 24/perc · Fehérvérsejtszám > 15 vagy < 4 G/l, vagy > 10% éretlen alak — legalább 2 tétel
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `vitals.temp` | Cel | igen | Maghőmérséklet. |
| `vitals.pulse` | /min | igen | TARTÓSAN: egyetlen mérés nem elég. A vajúdás fájdalma, a félelem és a vérvesztés is gyorsítja a pulzust. |
| `vitals.rr` | /min | igen | A LEGGYAKRABBAN KIHAGYOTT ÉLETTANI ÉRTÉK, pedig a szepszis legkorábbi jele. Ha nincs rögzítve, a szűrés nem tud teljes lenni — és ez nem ugyanaz, mint hogy normális. |
| `lab.wbc` | 10*9/L | igen | VAJÚDÁS ALATT NEM ÉRTÉKELHETŐ: a szülés élettanilag megemeli a fehérvérsejtszámot. A rendszer ilyenkor nem „normálisnak” minősíti, hanem KIVESZI a szűrésből, és ezt kimondja. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 2 | a szűrőküszöb alatt | normal |
| 2 ≤ x | szűrőpozitív — a góc kérdése következik, nem diagnózis | redflag |

**Forrás** — California Maternal Quality Care Collaborative (CMQCC): Improving Diagnosis and Treatment of Maternal Sepsis — Obstetric Sepsis Toolkit

**Miért áll kapu mögött** — AZ ELSŐDLEGES FORRÁS NEM VOLT ELÉRHETŐ (a cmqcc.org tartományt a hálózati szabályzat blokkolja), ezért a küszöbök másodkézből származnak. A kalkulátor teljes bemenettel sem ad eredményt, és a szepszismotor sem ad riasztást — a kapu előbb van, mint az adat.

> **Amit tudni kell** — HÁROM DOLOG, AMI NÉLKÜL EZ A SZÁM FÉLREVEZET. (1) TERHESSÉGI ÁLLAPOT: a terhesség fiziológiásan gyorsítja a pulzust, emeli a légzésszámot és a fehérvérsejtszámot — ismeretlen terhességi állapotnál a szám nem értelmezhető, és a rendszer nem esik vissza a nem terhes sávra. (2) VAJÚDÁS: a szülés élettanilag emeli a fehérvérsejtszámot, tehát az a tétel vajúdás alatt NEM ÉRTÉKELHETŐ — nem „normális”, hanem kiesik. (3) A SZÁM NEM DIAGNÓZIS: a szűrőpozitív eredmény után a következő lépés emberi döntés (van-e gyanítható fertőzéses góc?), és csak azután jön a szervi elégtelenség kérdése. A teljes utat a `core/szepszis/` motor viszi. KÜSZÖBELTÉRÉS: ugyanezekre a mérésekre az omqSOFA (SOMANZ 2017) más határértéket használ (légzésszám > 20, pulzus > 90). Két forrás, két szám — a rendszer mindkettőt megnevezi, és egyiket sem csendesíti el a másikkal.

---

### `calc.cmqcc.stage` — CMQCC vérzési stádium

| | |
|---|---|
| **Típus** | classification |
| **Modul** | labour |
| **Eredmény** | {stádium}, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `score.cmqcc.stage` |

**Képlet**

```
stádium a KUMULATÍV vérvesztésből és a sokk-indexből: ≥ 1500 mL vagy SI ≥ 1,4 → 3 · ≥ 1000 mL vagy SI ≥ 1,0 → 2 · ≥ 300 mL → 1 · egyébként 0
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `labour.qbl.total` | mL | igen | A beteg TELJES mért vérvesztése, szakaszoktól függetlenül. |
| `vitals.shockIndex` | 1 | igen | Pulzus osztva a szisztolés vérnyomással. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 1 | 0 — megelőzés, kockázatbecslés | normal |
| 1 ≤ x < 2 | 1 — fokozott figyelés, uterotonikum, vérkép | watch |
| 2 ≤ x < 3 | 2 — vérzéscsillapító protokoll, vércsoport és kereszt | redflag |
| 3 ≤ x | 3 — masszív transzfúziós protokoll, műtői készenlét | redflag |

**Forrás** — CMQCC Obstetric Hemorrhage Toolkit V3.0 (2022); WHO/FIGO/ICM közös állásfoglalás a szülés utáni vérzés 300 mL-es beavatkozási küszöbéről (2025)

**Miért áll kapu mögött** — A STÁDIUMHATÁROK nincsenek visszaellenőrizve az eszköztár elsődleges szövegével, és a 300 mL-es küszöb új ajánlásból származik, amit a CMQCC v3.0 még nem tükröz. A kettő összeillesztése SAJÁT DÖNTÉS, nem publikált algoritmus — ezért áll kapu mögött.

> **Amit tudni kell** — A MÉRT és a BECSÜLT vérvesztés nem ugyanaz: a vizuális becslés a valós vérzést rendszeresen alábecsüli, és minél nagyobb a vérzés, annál jobban. A stádium ezért csak MÉRT (kumulatív, tömeg- és térfogatalapú) vérvesztésből értelmes. A sokk-index a fiatal terhesnél korábban jelez, mint a vérnyomás — de vajúdás alatt a fájdalom is emeli.

---

### `calc.crcl` — Kreatinin-clearance (Cockcroft–Gault)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | rx |
| **Eredmény** | mL/min, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `rx.crcl` |

**Képlet**

```
CrCl = ((140 − kor) × testsúly[kg] × 1,04) / szérum kreatinin[µmol/L]   (nő)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `patient.age` | a | igen | Betöltött életév a vizsgálat időpontjában. |
| `anthro.weight.current` | kg | igen | A vizsgálat napján mért testsúly. |
| `lab.cr` | umol/L | igen | Szérum kreatinin. |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 30 | súlyosan beszűkült — dózismódosítás kötelező | redflag |
| 30 ≤ x < 60 | mérsékelten beszűkült — dózismódosítás mérlegelendő | watch |
| 60 ≤ x | nem igényel dóziskorrekciót | normal |

**Forrás** — Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron 1976;16(1):31-41 · PMID 1244564

**Miért áll kapu mögött** — Az SI-egységre átszámolt 1,04-es női együttható nincs visszaellenőrizve az eredeti közleménnyel (az eredeti mg/dL-ben, 72-es osztóval és 0,85-ös női szorzóval dolgozik). Ugyanaz a kapu, mint a CKD-EPI-nél.

> **Amit tudni kell** — A GYÓGYSZERADAGOLÁS a kreatinin-clearance-re épül, NEM az eGFR-re: a törzskönyvi dózisajánlások túlnyomó része Cockcroft–Gault szerinti értékkel készült, és a testfelszínre normált eGFR a szélső testsúlyoknál eltérő dózist adna. TERHESSÉGBEN a képlet külön problémás: a vesefunkció élettanilag emelkedik, a testsúly pedig a magzatot is tartalmazza — a futó terhességi súlyból számolt clearance felülbecsül.

---

### `calc.efw.hadlock` — Becsült magzati súly (Hadlock)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vizsgalatok |
| **Eredmény** | g, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `us.efw` |

**Képlet**

```
log10(EFW) = 1,3596 − 0,00386·AC·FL + 0,0064·HC + 0,00061·BPD·AC + 0,0424·AC + 0,174·FL   (a méretek cm-ben)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `us.bpd` | mm | igen | Ultrahangos biparietális átmérő mérés. |
| `us.hc` | mm | igen | Ultrahangos fejkörfogat mérés. |
| `us.ac` | mm | igen | Ultrahangos haskörfogat mérés. |
| `us.fl` | mm | igen | Ultrahangos combcsonthossz mérés. |

**Forrás** — Hadlock FP et al. Estimation of fetal weight with the use of head, body, and femur measurements. Am J Obstet Gynecol 1985;151:333-337 · PMID 3881966

**Miért áll kapu mögött** — A Hadlocknak TÖBB, egymástól eltérő regressziós változata van (2, 3 és 4 paraméteres). Amíg nincs eldöntve és visszaellenőrizve, melyiket használjuk, a kalkulátor nem ad számot. Rossz változat választása rendszeres, egyirányú torzítást okoz — és a súlybecslésre indukciós és császármetszési döntés épül.

> **Amit tudni kell** — A becsült magzati súly konfidencia-intervalluma ±15% körüli. Az EGYETLEN számként megjelenített EFW hamis pontosságot sugall; a rendszer ezért intervallummal és percentilissel együtt jeleníti meg, sosem önmagában.

---

### `calc.efw.ig21` — Becsült magzati súly (INTERGROWTH-21st)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vizsgalatok |
| **Eredmény** | g, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `us.efw.ig21` |

**Képlet**

```
ln(EFW) = 5,08482 − 54,06633·(AC/100)³ − 95,80076·(AC/100)³·ln(AC/100) + 3,13637·(HC/100)   (AC és HC CENTIMÉTERBEN)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `us.hc` | mm | igen | Ultrahangos fejkörfogat mérés. |
| `us.ac` | mm | igen | Ultrahangos haskörfogat mérés. |

**Forrás** — Stirnemann J, Villar J, Salomon LJ et al. International estimated fetal weight standards of the INTERGROWTH-21st Project. Ultrasound Obstet Gynecol 2017;49:478–86. © University of Oxford. · PMID 27804212

**Miért áll kapu mögött** — A képlet a hivatalos INTERGROWTH-21st EFW számolótáblából került át; az együtthatókat még nem vetette össze senki az elsődleges közleménnyel. A súlybecslésre indukciós és császármetszési döntés épül.

> **Amit tudni kell** — KÉT PARAMÉTERES: csak a haskörfogat és a fejkörfogat kell hozzá — a Hadlock ezzel szemben négy méretet kér. Ez nem egyszerűsítés, hanem MÁS MODELL, és a kettő eredménye eltér; a kettő KÖZÖTTI választás szakmai döntés, nem a rendelkezésre álló mezőké. A becsült magzati súly konfidencia-intervalluma itt is ±15% körüli, és a szám sosem jelenik meg intervallum és percentilis nélkül.

---

### `calc.egfr.ckdepi2021` — eGFR (CKD-EPI 2021)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | lab |
| **Eredmény** | mL/min/{1.73_m2}, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `lab.egfr` |

**Képlet**

```
eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1,200 × 0,9938^kor × 1,012   (nő: κ = 0,7 · α = −0,241)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `lab.cr` | umol/L | igen | Szérum kreatinin. |
| `patient.age` | a | igen | Betöltött életév a vizsgálat időpontjában. |

**Forrás** — Inker LA et al. New creatinine- and cystatin C-based equations. N Engl J Med 2021;385:1737-1749 · PMID 34554658

**Miért áll kapu mögött** — Az együtthatók (142 · 0,7 · −0,241 · −1,200 · 0,9938 · 1,012) még nincsenek összevetve az elsődleges közleménnyel. Emellett a képlet TERHESSÉGBEN NEM VALIDÁLT: a fiziológiás hyperfiltratio miatt a valós GFR-t alábecsüli, ami praeeclampsiás vesekárosodásnál késleltetheti a felismerést.

> **Amit tudni kell** — Terhességben a szérumkreatinin-alapú becslés önmagában megbízhatatlan. A kreatinin ABSZOLÚT értéke és annak változása informatívabb, mint a becsült GFR.

---

### `calc.energy.pregnancy` — Terhességi energiaszükséglet

| | |
|---|---|
| **Típus** | formula |
| **Modul** | diet |
| **Eredmény** | kcal, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `diet.energyTarget` |

**Képlet**

```
alapanyagcsere (Mifflin–St Jeor, nő) = 10 × testsúly + 6,25 × testmagasság − 5 × kor − 161; × 1,4 aktivitási szorzó; + 0 / 340 / 452 kcal trimeszterenként
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `anthro.weight.prepregnancy` | kg | igen | A fogantatás előtti testsúly. |
| `anthro.height` | cm | igen | Cipő nélkül mért testmagasság. |
| `patient.age` | a | igen | Betöltött életév a vizsgálat időpontjában. |
| `ctx.ga` | wk | igen | A terhesség fennállásának ideje tizedes hétben. |

**Forrás** — Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr 1990;51(2):241-247; IOM Dietary Reference Intakes (2005) trimeszter-többletek · PMID 2305711

**Miért áll kapu mögött** — Az együtthatók (10 · 6,25 · 5 · 161), az 1,4-es aktivitási szorzó és a trimeszter-többletek nincsenek visszaellenőrizve az elsődleges közleményekkel. Ez ILLESZTETT REGRESSZIÓ, nem konszenzusos szorzó — ezért kapu mögött áll, szemben a fehérjecéllal.

> **Amit tudni kell** — AZ AKTIVITÁSI SZORZÓ A LEGNAGYOBB BIZONYTALANSÁG: az 1,4 ülő életmódot feltételez, és a valóságban 1,2 és 1,9 között szóródik — ez önmagában több száz kcal különbség, több, mint a teljes terhességi többlet. Amíg a kapu zárva van, a betegtájékoztatóban nem szám, hanem DIETETIKAI KONZÍLIUM javallata jelenik meg. Ez nem hiány: a modul saját nyitott kérdése is azt javasolja, hogy a rendszer célértéket és konzíliumi javallatot adjon, ne konkrét étrendet.

---

### `calc.ga.crl.ig21` — Gesztációs kor CRL-ből (INTERGROWTH-21st)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vizsgalatok |
| **Eredmény** | wk, 2 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `us.ga.crl` |

**Képlet**

```
GA[nap] = 40,9041 + 3,21585·√CRL + 0,348956·CRL   (CRL mm-ben, 15–95 mm között)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `us.crl` | mm | igen | A magzat fej-far hossza. |

**Forrás** — Papageorghiou AT, Kennedy SH, Salomon LJ et al. International standards for early fetal size and pregnancy dating based on ultrasound measurement of crown–rump length in the first trimester of pregnancy. Ultrasound Obstet Gynecol 2014;44:641–8. © University of Oxford. · PMID 25184867

**Miért áll kapu mögött** — A képlet a hivatalos INTERGROWTH-21st datáló számolótáblából (v1.1) került át, de az együtthatókat még nem vetette össze senki az elsődleges közleménnyel. A DATÁLÁS A TERHESSÉG LEGNAGYOBB HATÁSÚ EGYETLEN SZÁMA: a gesztációs kor minden későbbi percentilist, minden ablakot és az indukció idejét is eltolja.

> **Amit tudni kell** — 15 mm ALATT és 95 mm FÖLÖTT a képlet nem érvényes, és a kalkulátor nem ad eredményt. 95 mm fölött a fejkörfogat–combcsonthossz módszer való. A datálás sorrendje ettől függetlenül áll: IVF-transzfer → korai CRL → utolsó menstruáció → késői biometria (`ctx.gaSource`), és egy késői biometriai datálás NEM írhatja felül a korai CRL-t.

---

### `calc.ga.hc.ig21` — Gesztációs kor fejkörfogatból (INTERGROWTH-21st) — csak FL hiányában

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vizsgalatok |
| **Eredmény** | wk, 2 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `us.ga.hc` |

**Képlet**

```
GA[nap] = exp(0,0597·(ln HC)² + 6,409·10⁻⁹·HC³ + 3,3258)   (HC mm-ben; CSAK ha a combcsonthossz nem mérhető)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `us.hc` | mm | igen | Ultrahangos fejkörfogat mérés. |
| `us.fl` | mm | nem | Ultrahangos combcsonthossz mérés. |

**Forrás** — Papageorghiou AT, Kemp B, Stones W et al. Ultrasound-based gestational-age estimation in late pregnancy. Ultrasound Obstet Gynecol 2016;48:719–26. © University of Oxford. · PMID 26924421

**Miért áll kapu mögött** — Az együtthatók visszaellenőrzése hiányzik. A forrás ezt a módszert kifejezetten MÁSODLAGOSNAK jelöli.

> **Amit tudni kell** — A forrás kimondja: ez a módszer CSAK AKKOR használandó, HA A COMBCSONTHOSSZ NEM ÁLL RENDELKEZÉSRE. Ezért ha a combcsonthossz rögzítve van, ez a kalkulátor NEM ad eredményt — a fejkörfogat–combcsonthossz módszer való oda. A megszorítás nem jótanács, hanem a számítás része: különben azon múlna a módszerválasztás, melyik mezőt töltötték ki előbb.

---

### `calc.ga.hcfl.ig21` — Gesztációs kor fejkörfogatból és combcsonthosszból (INTERGROWTH-21st)

| | |
|---|---|
| **Típus** | formula |
| **Modul** | vizsgalatok |
| **Eredmény** | wk, 2 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `us.ga.hcfl` |

**Képlet**

```
GA[nap] = exp(0,03243·(ln HC)² + 0,001644·FL·ln HC + 3,813)   (HC és FL mm-ben)
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `us.hc` | mm | igen | Ultrahangos fejkörfogat mérés. |
| `us.fl` | mm | igen | Ultrahangos combcsonthossz mérés. |

**Forrás** — Papageorghiou AT, Kemp B, Stones W et al. Ultrasound-based gestational-age estimation in late pregnancy. Ultrasound Obstet Gynecol 2016;48:719–26. © University of Oxford. · PMID 26924421

**Miért áll kapu mögött** — A képlet a hivatalos INTERGROWTH-21st datáló számolótáblából (v1.1) került át; az együtthatók visszaellenőrzése hiányzik.

> **Amit tudni kell** — A KÉSEI DATÁLÁS PONTATLAN, és ez nem a képlet hibája: a második-harmadik trimeszterben a magzatok közötti méretkülönbség már nagyobb, mint a korkülönbség. Ezért ez a becslés csak akkor datál, ha korábbi datálás NINCS — meglévő korai CRL-datálást nem írhat felül.

---

### `calc.isth.dic.pregnancy` — ISTH terhességi DIC-pontszám

| | |
|---|---|
| **Típus** | score |
| **Modul** | labour |
| **Eredmény** | {pont}, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `score.isth.dic` |

**Képlet**

```
thrombocyta (>185→0 · 100–185→1 · 50–100→2 · <50→1) + fibrinogén (>4,0→0 · 3,0–4,0→5 · 2,0–3,0→12 · <2,0→25) + protrombin-idő különbség (<0,5→0 · 0,5–1,0→5 · 1,0–1,5→12 · >1,5→25); vágóérték 26
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `lab.plt` | 10*9/L | igen | Vérlemezkeszám. |
| `lab.fibrinogen` | g/L | igen | A szérum fibrinogén-szintje. |
| `lab.inr` | 1 | igen | Nemzetközi normalizált arány (protrombin idő). |

**Eredménysávok**

| Sáv | Olvasat | Súlyosság |
|---|---|---|
| x < 26 | nem utal terhességi DIC-re | normal |
| 26 ≤ x | terhességi DIC — hematológiai konzílium, célzott pótlás | redflag |

**Forrás** — Erez O, Novack L, Beer-Weisel R et al. DIC score in pregnant women — a population based modification of the ISTH score. PLoS One 2014;9(4):e93240 · PMID 24728050

**Miért áll kapu mögött** — A PONTHATÁROK ÉS A PONTÉRTÉKEK nincsenek visszaellenőrizve az elsődleges közleménnyel. A szerkezet (három paraméter, sávos pontozás, 26-os vágóérték) biztos, a konkrét sávhatárok nem — és itt a sávhatár a lényeg: a fibrinogén 25 pontot ér 2 g/L alatt, tehát egyetlen rosszul megválasztott határ a teljes pontszámot átbillenti.

> **Amit tudni kell** — A TERHESSÉGI VÁLTOZAT AZÉRT KELL, mert a terhességben élettanilag emelkedett fibrinogén és a megváltozott alvadási paraméterek mellett az eredeti ISTH-pontszám későn jelez. A protrombin-idő KÜLÖNBSÉGE kell hozzá (beteg mínusz kontroll), amit a rendszer ma az INR-ből közelít — ez a közelítés maga is ellenőrzésre vár.

---

### `calc.qbl.total` — Teljes mennyiségi vérvesztés

| | |
|---|---|
| **Típus** | formula |
| **Modul** | labour |
| **Eredmény** | mL, 0 tizedes |
| **Állapot** | ⛔ **kapu mögött — nem ad eredményt** |
| **Melyik változót tölti** | `labour.qbl.total` |

**Képlet**

```
teljes vérvesztés = szülés alatti kumulatív + műtét alatti mért
```

**Bemenetek**

| Változó | Egység | Kötelező | Megjegyzés |
|---|---|---|---|
| `labour.qbl` | mL | nem | a szülés kezdetétől kumulatív; hiányzik, ha nem vajúdott |
| `op.intra.qbl` | mL | nem | a műtét alatt mért; hiányzik, ha nem volt műtét |

**Forrás** — WHO/FIGO/ICM közös állásfoglalás a szülés utáni vérzés 300 mL-es beavatkozási küszöbéről (2025); CMQCC Obstetric Hemorrhage Toolkit V3.0 (2022)

**Miért áll kapu mögött** — Maga az összeadás triviális — DE a kapu nem a képlet nehézségéről szól, hanem arról, hogy a rendszer viselkedéséhez csak aláírt számítás járul hozzá. Amit itt alá kell írni, az nem az összeg, hanem az ÁLLÍTÁS: hogy a szülés alatti és a műtét alatti mért vérvesztés ugyanannak a betegnek ugyanabból a vérzéséből származik, és hogy a beavatkozási küszöb az ÖSSZEGRE vonatkozik. Ez klinikai állásfoglalás, nem aritmetika. (A `calc.cmqcc.stage`, amit ez táplál, ugyanúgy kapu mögött áll.)

> **Amit tudni kell** — EZ A MEZŐ EGY FEDÉS FELOLDÁSA. A vajúdó nő, aki császármetszésre kerül, két mezőbe veszít vért, és a kettőnek KÜLÖN küszöbe volt (300 mL a szülésnél, 1000 mL a műtétnél) — vagyis 400 mL vajúdás közben kritikus volt, 700 mL a műtét alatt nem, és az 1100 mL összesent senki nem számolta ki. A beteg EGY, és a vér, amit elveszített, ugyanaz. A HIÁNYZÓ SZAKASZ NEM NULLA: ha a beteg vajúdott, de a szülészeti érték hiányzik, ez az összeg ALSÓ BECSLÉS — a `core/fedes/feloldas.ts` `verzesOsszeg()` függvénye ezt külön kimondja.

---

## Build-ellenőrzés

A `validateCalculators(reg)` a következőt kényszeríti ki minden buildnél:

- a használt kalkulátorok minden bemenete létezik a regiszterben;
- az egységek **pontosan** egyeznek — az eltérés némán rossz eredményt adna, ezért hiba;
- minden kalkulátornak van elsődleges forrása és emberi olvasatú képlete;
- a kapuzott kalkulátornak van indoklása;
- a be nem kötött kalkulátor figyelmeztetést kap (holt kód, ami észrevétlenül elavul).

Jelenlegi állapot: **0 hiba, 0 figyelmeztetés**.

