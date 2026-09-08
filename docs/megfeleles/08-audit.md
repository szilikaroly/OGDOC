# Audit, felülvizsgálat és eltéréskezelés

## 1. Belső audit

| Elem | Szabály |
|---|---|
| Gyakoriság | **évente legalább egyszer** minden folyamatra; kockázatalapú súlyozással |
| Auditor | képzett, és **nem auditálhatja a saját munkáját** |
| Terv | éves auditprogram, a szabvány fejezeteire és a folyamatokra bontva |
| Kimenet | auditjelentés: megállapítások, nemmegfelelőségek, megfigyelések, javaslatok |
| Nyomon követés | minden megállapítás lezárásig követve |

**Az első belső audit a Fázis 3-ban esedékes** — akkor, amikor a minta-életciklus SOP-jai
már működnek, de még a külső audit előtt.

---

## 2. Vezetőségi átvizsgálás

Évente, dokumentáltan. **Kötelező bemenetek:**

| # | Bemenet |
|---|---|
| 1 | előző átvizsgálás intézkedéseinek állása |
| 2 | belső és külső auditok eredménye |
| 3 | nemmegfelelőségek és helyesbítő tevékenységek |
| 4 | panaszok és visszajelzések |
| 5 | a minőségcélok teljesülése |
| 6 | erőforrás-helyzet, kompetencia |
| 7 | külső szolgáltatók teljesítménye |
| 8 | kockázatok és lehetőségek változása |
| 9 | **a jogszabályi hivatkozások felülvizsgálati állapota** (ld. `03-magyar-jog.md` 5.) |
| 10 | **a lejárt vagy hamarosan lejáró SOP-ok listája** |
| 11 | **az adatteljességi és QC-trendek** (a `20` modul riportjai) |

**Kimenetek:** döntések a fejlesztésről, erőforrásról, a MIR módosításáról — mindegyik
felelőssel és határidővel.

> A 9–11. bemenet az, amit a rendszer **automatikusan elő tud állítani**. A legtöbb
> vezetőségi átvizsgálás azon bukik el, hogy az adatok összegyűjtése napokat vesz igénybe,
> ezért felületessé válik.

---

## 3. Nemmegfelelőség (NC)

```
azonosítás ─▶ elkülönítés ─▶ hatásvizsgálat ─▶ azonnali intézkedés
                                 │
                                 └─▶ „mely mintákat és eredményeket érinti?"
                                        (a nyomonkövethetőségből, ld. 07)
```

| Lépés | Mit kell rögzíteni |
|---|---|
| Azonosítás | ki, mikor, mit észlelt |
| Osztályozás | kritikus / jelentős / kisebb |
| Elkülönítés | az érintett minták zárolása |
| **Hatásvizsgálat** | mely minták, mely kiadások, mely eredmények érintettek |
| Azonnali intézkedés | mit tettünk most |
| Értesítés | ha kiadott mintát érint: **a fogadó értesítése**, az MTA szerint |
| Lezárás | ki és mikor zárta le |

**Az értesítési kötelezettség a legkínosabb, és a legfontosabb.** Ha kiderül, hogy egy
kiadott mintasorozat minősége kétséges, a fogadó kutatót értesíteni kell — akkor is, ha
kellemetlen, és akkor is, ha már publikált.

---

## 4. Helyesbítő tevékenység (CAPA)

| Lépés | Tartalom |
|---|---|
| Gyökérok-elemzés | **nem elég a tünet**: miért történhetett meg |
| Intézkedés | mi akadályozza meg az ismétlődést |
| Megvalósítás | felelős, határidő |
| **Hatékonyság-ellenőrzés** | egy megadott idő után: valóban megszűnt? |

> **A hatékonyság-ellenőrzés a leggyakrabban kihagyott lépés.** CAPA nélküle csak
> adminisztráció: a hiba visszatér, és senki nem veszi észre, hogy az intézkedés nem működött.

---

## 5. Amit a rendszer automatikusan figyel

| Figyelt dolog | Riasztás |
|---|---|
| Lejáró SOP-felülvizsgálat | 60 nappal előtte |
| Lejáró kalibrálás | 30 nappal előtte |
| Lejáró etikai engedély | 90 nappal előtte |
| Egy éve nem ellenőrzött jogszabályi hivatkozás | a vezetőségi átvizsgálásra |
| Nyitott NC határidőn túl | eszkaláció |
| CAPA hatékonyság-ellenőrzés esedékes | feladat |
| Hőmérséklet-eltérés | **azonnal**, riasztási láncon |
| Leltár-eltérés | NC automatikus nyitása |
| Megőrzési idő lejárta | selejtezési javaslat |

A platform `monitoring_thresholds` + `followup_*` + `notifications` motorjai ezt már tudják —
konfigurálás, nem fejlesztés. **Kivéve a `monitoring_thresholds` P0 hibáját (BUG-009), amit a
Fázis 0-ban javítani kell**, mert ez a réteg épül rá.

---

## 6. Külső audit és akkreditáció

Ha az intézmény az ISO 20387 szerinti akkreditációt célozza:

| Lépés | Mikor |
|---|---|
| Önértékelés az `01-iso20387.md` mátrixszal | Fázis 3 |
| Hiánypótlás | Fázis 3–4 |
| Belső audit teljes körre | Fázis 4 |
| Akkreditáló testület kiválasztása, kérelem | Fázis 4–5 |
| Előaudit (opcionális, ajánlott) | Fázis 5 |
| Akkreditációs audit | Fázis 5+ |

**Reális átfutás: 12–18 hónap az első kérelemtől**, jó felkészültség mellett. Az akkreditáció
nem előfeltétele a működésnek — a jogszabályi megfelelés az. Az akkreditáció a **bizonyíték**
arra, hogy a rendszer működik.

> **Döntést kér:** cél-e az akkreditáció? Ha igen, az `01-iso20387.md` ⬜ tételei határidőt
> kapnak, és a Fázis 3–5 tartalma bővül. Ha nem, a mátrix önértékelési eszköz marad — ami
> önmagában is értékes, mert megmutatja, hol tartunk.
