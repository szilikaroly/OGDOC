---
source: docs/03-modulterv.md
sha256: aad3689b88ec40acf41bd6d25e51d6554e5bfee0b96cd6adea6e01d6fca2869c
lines: 582
profile: prose
generator: subagent
raw_tokens_est: 8463
verified: 30 confirmed
---

# docs/03-modulterv.md

## Topics
- L1-68: Áttekintés, átfogó elvek, panasz- és kontextusmodul
- L69-215: Anamnézis, státusz és a vizsgálatok modul (labor, EKG, ultrahang, képalkotás)
- L216-332: Gyógyszerelés, diéta, pszichológia, epikrízis, szülőszoba, műtő, onkológia, PROM-ok
- L333-489: Kódolás, minőségbiztosítás, CRM, statisztika, foglalkozás-egészségügy, biobank, genetika, IVF
- L490-513: Adminisztráció és belső szerkesztő
- L514-541: Előéleti adatimport és jóváhagyási sor
- L542-582: Összesítő tábla és az, ami valóban új munka

## Claims

- [C1] [CONFIRMED] Mind a 25 modulnak van önálló, részletes kidolgozása a `modulok/` könyvtárban @L6 `> **Ez a fejezet az áttekintés.** Mind a **25** modulnak van önálló, részletes kidolgozása a`
- [C2] [PENDING] Átfogó elv: a klinikai adatmezők 90%-a kódolt vagy mért érték legyen @L11 `> a [`11-strukturalt-adat.md`](11-strukturalt-adat.md) szerint a klinikai adatmezők **90%-a`
- [C3] [CONFIRMED] A 19. és a 21. modul nem terv, hanem meglévő rendszer (IntuiCare, illetve SOS24) @L17 `> **A 19. és a 21. modul nem terv, hanem meglévő rendszer** — az IntuiCare platform, illetve`
- [C4] [CONFIRMED] A panaszmodul nem szabad szöveges mező, hanem ~400 tételes szinonimás panaszszótár @L37 `**Amit a „kereshető" jelent itt:** nem szabad szöveges mező. Egy ~400 tételes, szinonimákkal és`
- [C5] [CONFIRMED] A 2. modul a 3–17. modul előfeltétele, mert az állítja be a `ctx` objektumot @L67 `> kifejezései hivatkoznak. Ezért a **2. modul a 3–17. modul előfeltétele**.`
- [C6] [CONFIRMED] A „nem tudom" mint önálló válaszállapot mind a 110 kérdéssoron megvan @L81 `  tudom**). A „nem tudom" mint önálló állapot mind a 110 kérdéssoron megvan — ez ritka és értékes.`
- [C7] [CONFIRMED] A markeres, FMF-elvű becslő kiírja magáról, hogy nem a hivatalos FMF-kalkulátor @L99 `| FMF-elvű, markerekkel | MAP / UtA-PI / PlGF MoM, közelítő log-odds | kiírja, hogy **nem** a hivatalos FMF-kalkulátor |`
- [C8] [CONFIRMED] A vetélés-, koraszülés- és halvaszületés-becslés tájékoztató és nem validált, és ezt a felület kimondja @L101 `A vetélés / koraszülés / halvaszületés becslés epidemiológiai és tájékoztató, **nem validált** —`
- [C9] [PENDING] Az IPRACS szülőszobai FIX-mezői `mirror`-ként kerülnek be: egy változó, két helyen @L107 `olyasmire, amit az anamnézisben már rögzíteni kellett volna. **Ezek `mirror`-ként kerülnek be:`
- [C10] [PENDING] A cervix-mezők egyetlen helyen élnek, a Bishop-score aliasként hivatkozik rájuk — ez az IPRACS fő architektúrahibájának javítása @L130 `A cervix-mezők (`dilation`, `effacement`, `station`, `consistency`, `position`) **egyetlen`
- [C11] [CONFIRMED] Az EKG-modul portolása négy hibát talált az eredeti munkafüzetben @L160 `A portolás során az elemzés **négy hibát talált az eredeti munkafüzetben** (elcsúszott`
- [C12] [CONFIRMED] Az anamnézisben bejelölt asztma a szülőszobán állítja meg a gyógyszerrendelést — a keresztfeltöltés fő példája @L228 `asztma a szülőszobán állítja meg a gyógyszerrendelést**. Ez a keresztfeltöltés legjobb példája.`
- [C13] [CONFIRMED] Postpartum pszichózisnál 5% szuicid és 4% infanticid kockázat mellett a hospitalizáció kötelező, hard-stop riasztásként @L251 `A PPP-modulnál a dokumentáció rögzíti: **5% szuicid, 4% infanticid kockázat → hospitalizáció`
- [C14] [CONFIRMED] Az epikrízis szövege a regiszter aktuális értékeiből épül, nem sablonból @L262 `konzulensi kérés. A szöveg a regiszter aktuális értékeiből épül, nem sablonból.`
- [C15] [CONFIRMED] A szülőszobai score-készlet forrásokkal jön: MEOWS AUC 0.87, CMQCC PPH v3.0 300 mL küszöbbel @L271 `| IP | MEOWS (AUC 0.87), Shock Index, NICHD FHR kategorizáció (Macones 2008), CMQCC PPH v3.0 (WHO/FIGO/ICM 2025 300 mL küszöb), omqSOFA, ISTH terhességi DIC (Erez 2014, cut-off 26), Bishop, VBAC Grobman MFMU 2021 race-neutral |`
- [C16] [CONFIRMED] A validált mérőeszközök tételszövegét és pontozását nem módosítjuk @L329 `**Ezek validált mérőeszközök: a tételszöveget és a pontozást nem módosítjuk.** A magyar`
- [C17] [CONFIRMED] A v16 tizenhárom beágyazott kódtörzset hordoz, összesen ~13 000 tétellel @L344 `A v16 a v15-ös EESZT-ingest óta **13 beágyazott kódtörzset** hordoz, összesen ~13 000 tétellel.`
- [C18] [CONFIRMED] A 19. modul elfogadási kritériuma nem funkció, hanem a nyitott hibák — köztük a BUG-015 — lezárása @L394 `köztük a **BUG-015** tenant-bootstrap biztonsági hibáé, amin kutatási adatgyűjtés nem`
- [C19] [CONFIRMED] A statisztikai modulban szándékosan nincs egygombos hipotézisteszt, mert p-hackinget termelne @L410 `Két tervezési állítása fontos: **nincs beépített hipotézisteszt egy gombra** (az kattintással`
- [C20] [CONFIRMED] A foglalkozás-egészségügyi modulban a munkáltató csak az alkalmassági eredményt látja, a klinikai részleteket nem @L430 `hiányzó elemei"). A modul legfontosabb szabálya, hogy **a munkáltató csak az alkalmassági`
- [C21] [CONFIRMED] A biobank négy szabályt technikailag kényszerít ki, nem eljárásrenddel @L443 `A modul négy dolgot **technikailag kikényszerít**, nem eljárásrenddel: hozzájárulás nélkül`
- [C22] [CONFIRMED] Magas OHSS-kockázatnál a friss transzfer indoklás nélkül nem folytatható @L483 `  klinikus mégis hCG-t és friss transzfert választ, **indoklás nélkül nem folytatható**.`
- [C23] [CONFIRMED] A rendszer ~3900 változós és 25 modulos, ezért fejlesztői ciklussal nem tartható karban @L494 `Ez a modul **dönti el, hogy a rendszer él-e**. Egy ~3900 változós, 25 modulos rendszer nem`
- [C24] [CONFIRMED] A belső szerkesztő nem enged score-képletet, hard-stop kaput, `phi` jelölést és auditnaplót módosítani @L503 `**Amit a szerkesztő nem enged, az a fontosabb fele:** score-képlet, hard-stop kapu,`
- [C25] [CONFIRMED] Minden szerkesztés piszkozatként indul, és más hagyja jóvá, mint aki szerkesztette @L505 `indul, hatásvizsgálatot mutat a levezetési gráfból, és **más hagyja jóvá, mint aki`
- [C26] [CONFIRMED] A BUG-015 megoldása: nincs önkiszolgáló tenant-bootstrap, az első adminisztrátor meghívó-alapú és auditált @L508 `Itt oldódik meg a **BUG-015** is: nincs önkiszolgáló tenant-bootstrap, az első`
- [C27] [CONFIRMED] Az importmodul egyetlen állítása: a gépi kinyerés állítást ad, nem adatot @L522 `**A modul egyetlen állítása: a gépi kinyerés állítást ad, nem adatot.** A kinyert érték`
- [C28] [CONFIRMED] A kinyerésből fakadó vörös zászló a jóváhagyás előtt is látszik, `pending` állapotban @L528 `A vörös zászló ellenben **a döntés előtt is látszik**, `
- [C29] [CONFIRMED] Természetes nyelvű lekérdezésnél a modell a lekérdezést írja, nem a választ @L532 `A természetes nyelvű lekérdezésnél a modell a **lekérdezést** írja, nem a **választ** — a`
- [C30] [CONFIRMED] A beteg-oldali fizetős változatnál a rendezés nem orvostechnikai eszköz, a javaslat viszont igen @L534 `reprodukálható. A **beteg-oldali, fizetős** változatnál a modul szabályozási határt jelöl`
- [C31] [CONFIRMED] Az importmodul magja megvan és tesztelt, 16 teszttel @L537 `**A mag megvan és tesztelt** (`
- [C32] [CONFIRMED] A modulok becsült változószáma összesen ~4035 @L572 `| | **Összesen** | | **~4035** | |`
- [C33] [PENDING] Teljesen új munka a panaszszótár, az anamnézis és az onkológia modul @L576 `A `07-intuicare-alap.md` 4. pontja bontja le tételesen. Röviden: teljesen új a **01** panaszszótár,`
- [C34] [CONFIRMED] Ami sehol nincs meg: maga a változóregiszter és a levezetési motor @L581 `És a projekt magja, ami sehol nincs meg: **a változóregiszter és a levezetési motor** — a`
