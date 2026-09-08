# Kutatásetikai engedélyeztetés (ETT) — dosszié

> **K2 eldőlt:** az ETT-engedélyeztetés és az MDR-dokumentáció párhuzamosan készül.
> Ez a fejezet az engedélyezési sávot írja le.
>
> A bizottsági hatáskörök és az eljárási részletek jogszabályból következnek, és
> változhatnak — **a beadás előtt a hatályos eljárásrendet ellenőrizni kell**, és a
> bizottsággal előzetesen egyeztetni.

---

## 1. Melyik bizottság, és miért nem mindegy

Az emberen végzett orvostudományi kutatás engedélyköteles (1997. évi CLIV. tv.). A hatáskör
a kutatás jellegétől függ: intézményi/regionális kutatásetikai bizottság, országos szintű
testület, **humángenetikai kutatásnál külön szabályokkal**, orvostechnikai eszközzel végzett
klinikai vizsgálatnál pedig további keret (MDR Annex XV, ISO 14155) `[ellenőrizendő]`.

**Az OGDOC egyszerre több kategóriát is érinthet:**

| Tevékenység | Kategória |
|---|---|
| Meglévő dokumentációból származó adat retrospektív elemzése | beavatkozással nem járó kutatás |
| Prospektív adatgyűjtés kérdőívekkel (PROM) | beavatkozással nem járó, de **beleegyezés-köteles** |
| **Biobanki mintagyűjtés és -felhasználás** | 2008. évi XXI. tv., külön szabályokkal |
| **Humángenetikai kutatás** | 2008. évi XXI. tv., szigorúbb |
| A döntéstámogató teljesítményének prospektív vizsgálata | **közelít az eszközvizsgálathoz** — ld. lentebb |

> **A Fázis 0 első feladata nem a beadvány megírása, hanem egy előzetes egyeztetés**: melyik
> bizottság illetékes, milyen kategóriába sorolják, és mi az átfutási idő. Ez határozza meg,
> mikor lehet egyáltalán adatot gyűjteni — és a fejlesztési ütemterv erre épül, nem fordítva.

---

## 2. A beadvány tartalma

| # | Elem | Hol készül |
|---|---|---|
| 1 | **Kutatási terv (protokoll)** | ld. 3. pont |
| 2 | Vizsgálatvezető és a kutatócsoport, kompetenciaigazolással | `19` modul kompetencia-nyilvántartása |
| 3 | Intézményi befogadó nyilatkozat | szervezeti |
| 4 | **Betegtájékoztató és beleegyező nyilatkozat** | `06-beleegyezes.md` — rétegzett, 10 pont |
| 5 | Adatkezelési tájékoztató | `02-gdpr.md` |
| 6 | **DPIA** vagy annak állása | `02-gdpr.md` 5. pont |
| 7 | Biobanki működés leírása, ha van mintagyűjtés | `01-iso20387.md`, `22` modul |
| 8 | Adatbiztonsági leírás | RLS, auditnapló, pszeudonimizálás — `07-nyomonkovethetoseg.md` |
| 9 | Finanszírozás, összeférhetetlenségi nyilatkozatok | szervezeti |
| 10 | Biztosítás, ha beavatkozással jár | szervezeti |
| 11 | Adatkezelési és publikációs terv | 4. pont |

---

## 3. A kutatási terv — és amiért ez több, mint formalitás

A protokoll nem csak engedélyezési feltétel: **a `20` modul hipotézisvizsgáló módjának
bemenete**. A rendszerben rögzített, időbélyegzett elemzési terv nélkül a lekérdező
kizárólag feltáró módban használható (ld. `../modulok/20-statisztika-lekerdezes.md` 6.1).

**Kötelező tartalom:**

| Elem | Megjegyzés |
|---|---|
| Háttér és indoklás | miért kell ez a kutatás |
| **Kérdésfeltevés, elsődleges és másodlagos kimenetel** | ez kerül a `study_links` rekordba |
| Vizsgálati elrendezés | retrospektív / prospektív, kohorsz, esetszám |
| **Mintanagyság és annak indoklása** | erőszámítás vagy a rendelkezésre álló minta indoklása |
| Bevonási és kizárási kritériumok | a `20` modul kohorsz-definíciójára képezhető le |
| **Elemzési terv** | előre rögzítve; a többszörös tesztelés kezelése |
| Adatkezelés, megőrzés, hozzáférés | `03-magyar-jog.md` 3.2 |
| Etikai megfontolások | kockázat-haszon, sérülékeny csoportok |
| Publikációs terv | beleértve a negatív eredmény közlését |

> **A rendszer a protokollt géppel olvasható alakban is tárolja** (`study_links`,
> kohorsz-definíció, kimeneti mutatók), nem csak PDF-ként. Így a lekérdező ki tudja
> kényszeríteni, hogy a hipotézisvizsgáló elemzés a jóváhagyott terv szerint fusson.

---

## 4. Sérülékeny csoportok — ebben a projektben elkerülhetetlen

A szülészeti kutatás természeténél fogva érint sérülékeny csoportokat, és a bizottság
ezekre külön rákérdez:

| Csoport | Amit a tervnek kezelnie kell |
|---|---|
| **Várandós nő és magzat** | a magzat nem önálló jogalany, de érintett; a beavatkozás kockázata két személyre vonatkozik |
| **Újszülött** | törvényes képviselő nyilatkozik |
| **Kiskorú adományozó** | + **nagykorúvá váláskor újra meg kell kérdezni** (`06-beleegyezes.md` 5.) |
| Cselekvőképtelen felnőtt | szigorúbb feltételek `[jogi ellenőrzés]` |
| Meddőséggel kezelt pár | **hatalmi egyensúlytalanság**: a kezelés folytatásától való félelem befolyásolhatja a beleegyezést |
| Foglalkozás-egészségügyi vizsgálaton megjelenő munkavállaló | a munkáltatói függés miatt a beleegyezés önkéntessége kérdéses |

**A két utolsó a legkényesebb**, és a `21` és `24` modul miatt valós. A rendszerben ezért
kimondva szerepel, hogy **a hozzájárulás megtagadása nem befolyásolja az ellátást**, és ezt
a tájékoztatónak is tartalmaznia kell.

---

## 5. Ahol az ETT-sáv és az MDR-sáv találkozik

A két sáv nem független, és ezt előre kell tisztázni:

| Kérdés | Miért számít |
|---|---|
| A döntéstámogató **prospektív teljesítményvizsgálata** kutatás vagy eszközvizsgálat? | ha a rendszer javaslata befolyásolja az ellátást, az már beavatkozás |
| **A rendszer használható-e az ellátásban a vizsgálat alatt?** | ha igen, MDR-kérdés is; ha nem, akkor a klinikus a rendszert nem látja, és a vizsgálat csak retrospektív lehet |
| A kutatási fázisban gyűjtött adat felhasználható-e **klinikai értékeléshez**? | igen, **ha a protokoll erre tervezve van** — utólag nem |

> **A harmadik pont a legfontosabb, és a legolcsóbb most megoldani.** Ha az ETT-protokoll
> már a beadáskor tartalmazza, hogy az adat a rendszer klinikai értékeléséhez is
> felhasználható (megfelelő beleegyezéssel), akkor a Fázis 5-ben nem kell új vizsgálatot
> indítani. Ha nem tartalmazza, akkor kell — és az másfél év.

---

## 6. Amit a rendszer szolgáltat a bizottságnak

Nem csak a beadványhoz, hanem a **működés közbeni jelentésekhez** is:

| Jelentés | Honnan |
|---|---|
| Bevont esetszám, toborzási ütem | `20` modul lekérdező |
| Beleegyezések és **visszavonások** száma | `gdpr_consents`, `bb_consent_event` |
| Adatteljesség és hiányzó adat aránya | `18` modul |
| Váratlan események | `clinical_critical_alerts`, NC-napló |
| Protokolleltérések | audit |
| Az engedély érvényességének lejárata | **90 nappal előtte riasztás** (`08-audit.md` 5.) |

---

## 7. Nyitott kérdések

1. **Melyik bizottság illetékes**, milyen kategóriában, és mennyi az átfutási idő?
   (Előzetes egyeztetés a Fázis 0-ban.)
2. **Egy engedély vagy több?** A biobanki gyűjtés, a PROM-adatgyűjtés és a rendszer
   teljesítményvizsgálata **külön engedélyt** igényelhet.
3. **A rendszer használható-e az ellátásban** a kutatás alatt (ld. 5. pont)?
4. Az MDR **in-house kivétel** (5. cikk (5)) alkalmazható-e — ha igen, mindkét sáv
   lényegesen egyszerűsödik (`09-mdr.md` 9.3).
5. **Biztosítás** szükséges-e, és milyen körben.
