# Forrástár

> Minden kódtábla és minden finanszírozási szabály **hivatalos forrásból** származik. Ez a könyvtár a forrásokat tartalmazza eredetiben, hogy egy retrospektív vita eldönthető legyen.

A `registry/kodok/manifest.json` eddig is őrizte a forrás nevét, méretét és SHA-256 lenyomatát. A lenyomat azt bizonyítja, hogy a fájl **nem változott** — azt nem, hogy **mi volt benne**. Egy elszámolási vitában ez a különbség dönt.

Összeállítva: 2026-09-03

## Hivatalos törzsek és jogszabályok

Magyar közfeladatot ellátó szerv hivatalos kiadványa vagy jogszabály szövege. Szabadon továbbadható, és **itt van, eredetiben** — nem csak a lenyomata.

### 10/2012. (II. 28.) NEFMI rendelet — HBCs kódolási és besorolási szabályok, hatályos 2025.05.01.

| | |
|---|---|
| Hol | `jogszabaly/10_2012_NEFMI_fekvo_20250501.docx` |
| Méret | 8 539 149 bájt |
| SHA-256 | `fdccf176e45a816876d382985b465bb0094edc39045ef3c70dd37c91fd246bdb` |


KÉZZEL feldolgozva: ebből lett a `registry/kodok/fekvo/` diagnózis-típusjel és szülés-kódolási szabálykészlete.


### 9/2012. (II. 28.) NEFMI rendelet — járóbeteg-szakellátás, hatályos 2026.01.01.

| | |
|---|---|
| Hol | `jogszabaly/9_2012_NEFMI_jaro_20260101.docx` |
| Méret | 1 056 281 bájt |
| SHA-256 | `0419504707e87c2739a981569c3e7fe01ffb016d3fdada5814ee142470c83918` |


Ebből lett a `tbl.oeno` és a három melléklet-tábla: kompetencia, kizárási és együtt-jelenthetőségi szabályok, BNO-feltételes eljárások.


### NEAK Általános Finanszírozási Főosztály: Fekvőbeteg jelentés — technikai útmutató, 2026. május

| | |
|---|---|
| Hol | `jogszabaly/NEAK_fekvo_technikai_utmutato_202605.pdf` |
| Méret | 1 040 677 bájt |
| SHA-256 | `2d316fc4a7e400895aab5710d49331cf3a4d49610c7f5ece51f0b2c201a51f5b` |


KÉZZEL feldolgozva: ebből lett a `rekordkep.json`. Ez döntötte el a kódalak kérdését: BNO_KOD 5 karakter, B_KOD 5 karakter.


### NEAK: 9 jegyű beutalási (GYFKOD) törzs, 2026. szeptember

| | |
|---|---|
| Hol | `torzsek/9jegyu_beutalasi_torzslista_202609.xlsx` |
| Méret | 4 036 178 bájt |
| SHA-256 | `c20510a7364611a1a7e159f26fd93553feddf0f418e795bbb94080dc9703cdd6` |


A SZEMÉLYNEVEK a származtatott táblából szándékosan kimaradnak; a forrásfájl az eredeti, változatlan kiadás.


### BNO-10 magyar törzs, 3.4 kiadás (2006) — archív

| | |
|---|---|
| Hol | `torzsek/BNOX_3_4.zip` |
| Méret | 173 805 bájt |
| SHA-256 | `f17d69d6e164b0f55106ea61b9af822650b38ce8731d5b6b84d5cfdbcf5e6b90` |


A korábbi kiadás. Négykarakteres alkategóriákat is tartalmaz; a jelentési alak viszont ötkarakteres, ezért ezt felváltotta az újabb.


### NEAK: BNO-10 magyar törzs, 2025. januári kiadás (BNOTORZS.DBF)

| | |
|---|---|
| Hol | `torzsek/BNO_2501.zip` |
| Méret | 173 206 bájt |
| SHA-256 | `b1bb0b51bd89295b29472acb71f6d5a5d1882401fff4f1af12f0001332c22810` |


Ebből lett a `tbl.bno`. Ez a kiadás adja a nemet, az életkori tartományt és az érvényességet.


### Diagnosztikai anyagok törzse, 2005.12.20. (archív)

| | |
|---|---|
| Hol | `torzsek/Diagnosztikai_torzs_20051220.xls` |
| Méret | 1 002 496 bájt |
| SHA-256 | `07a37b66ae32710611a60203795c5a396cbea083f1e254fecf1d0908dd139d24` |


### Egyszerhasználatos (műanyag) eszközök törzse, 2018.06.04.

| | |
|---|---|
| Hol | `torzsek/Egyszerhasznalatos_eszkoz_torzs_20180604.xlsx` |
| Méret | 1 872 703 bájt |
| SHA-256 | `52d5188d2e42f84ee69f3bcadedc5b8115fe00df6541b2dcbafa2560981ddfa5` |


### NEAK: FNO (ICF) törzs, 2019

| | |
|---|---|
| Hol | `torzsek/FNOTORZS.zip` |
| Méret | 7 016 bájt |
| SHA-256 | `f3a4f8424e714b2a8b8425c00c94daa845e8451e963952520b94ae8a5f54eb0e` |


Ebből lett a `tbl.fno`.


### NEAK: HBCS 5.0 törzs DBF alakban (HBCS50.DBF)

| | |
|---|---|
| Hol | `torzsek/HBCS_2026-03.zip` |
| Méret | 35 220 bájt |
| SHA-256 | `c94c26c93f9b35641d0b0b69dba590f889eb9afe1fc526746ff21c83289b2bc1` |


Ebből lett a `tbl.hbcs`: súlyszám, határnapok, közérthető csoportnév és a `*` intézeti jelzés.


### NEAK: HBCS 5.0 törzs, érvényes 2026.04.01-től (XLS)

| | |
|---|---|
| Hol | `torzsek/Hbcs50_torzs_20260401.xls` |
| Méret | 303 616 bájt |
| SHA-256 | `856b2b49cc80b345b65973bb549eca3c9142ef16f45c6b598a8c9f77bb8f5754` |


Ugyanaz a kiadás táblázatos alakban.


### NEAK: fekvőbeteg beavatkozási (műtéti) törzs, 2026. február (MUTET_AP.DBF)

| | |
|---|---|
| Hol | `torzsek/MUT_2602.zip` |
| Méret | 100 267 bájt |
| SHA-256 | `baec437cac6558ba76c5894d1fc1c93ef73e46b3cc42b58dae5c41c51c6d0d64` |


Ebből lett a `tbl.mut`. Ez döntötte el, hogy a hazai fekvőbeteg beavatkozáskód ötjegyű, nem ICD-9-CM alakú.


### OENO × szakma kompetencialista, hatályos 2026.01.01.

| | |
|---|---|
| Hol | `torzsek/OENO_kompetencia_20260101.xlsx` |
| Méret | 206 899 bájt |
| SHA-256 | `3868cef8eed32a4b3da344828db28b914da78b8755f330337cb494591941036d` |


Gépi olvasatú kiadás.


### OENO törzslista pontértékkel, hatályos 2026.01.01.

| | |
|---|---|
| Hol | `torzsek/OENO_torzslista_20260101.xlsx` |
| Méret | 185 316 bájt |
| SHA-256 | `b0128498294a3e3af39bc9f9a06525217a430e7e626e6b8dd17601d908deef93` |


A pontérték teszi elvégezhetővé a 9/2012 NEFMI 5. § (7) szerinti választást: kizárásos ütközésnél a magasabb pontszámú eljárás számolható el.


### NEAK: HBCS 5.0 korábbi kiadások (2025-01, 2025-05)

| | |
|---|---|
| Hol | `torzsek/hbcs50_2025.zip` |
| Méret | 342 440 bájt |
| SHA-256 | `876d8a9c78b97ff3d8535916d99b45dfdd804f39a285e921c2ff78d85913ae19` |


Ebből lett a `tbl.hbcs@2025-01-01` és a `tbl.hbcs@2025-05-01`. A 671A Császármetszés súlyszáma 2025 májusában 1,53177 volt, 2026 áprilisában 1,74947 — visszamenőleges elszámoláshoz a KIADÁS dönt, nem a csoportkód.


## A projekt saját bemeneti anyagai

Amire a rendszer épül: a platform, a korábbi alkalmazások és a specifikációk.

### IPRACS Lovable-implementációs specifikáció

| | |
|---|---|
| Hol | `ipracs/IPRACS_Lovable_Spec.md` |
| Méret | 47 612 bájt |
| SHA-256 | `b9a9589a7f7140e146b10e533981462be0b305fc805aff012d7b297eff7986c8` |


Történeti: a `docs/06-webes-migracio.md` írja le, miért nem ezt használjuk.


### IPRACS fejlesztési dokumentáció

| | |
|---|---|
| Hol | `ipracs/IPRACS_fejlesztesi_dokumentacio.docx` |
| Méret | 33 867 bájt |
| SHA-256 | `77dac1fc78e49eb35d0b30e03c644fb139ea5b15638222665eb021f17afa8c9b` |


### IPRACS v1.0 fejlesztői dokumentáció

| | |
|---|---|
| Hol | `ipracs/IPRACS_fejlesztoi_dokumentacio.docx` |
| Méret | 58 094 bájt |
| SHA-256 | `23384e0958b440b27355b6c11cb2284d3cd863ac30c83ac1b0679f8320686273` |


A score-ok és a klinikai kapuk forrása.


### IntuiCare adatbázisséma (230 tábla)

| | |
|---|---|
| Hol | `platform/intuicare-adatbazis.zip` |
| Méret | 439 421 bájt |
| SHA-256 | `1363d34e4f980b9f44a0558a90556b18bedeed913db5d692a5f28fd8db41ff45` |


### IntuiCare fejlesztői dokumentáció

| | |
|---|---|
| Hol | `platform/intuicare-fejlesztoi-dok.zip` |
| Méret | 453 377 bájt |
| SHA-256 | `6f488e7a8badda8ba29384b7095213a1f41a26988d16bdb60b0cc854a8840e7d` |


### IntuiCare (MedRoster) teljes forráskód

| | |
|---|---|
| Hol | `platform/intuicare-forraskod.zip` |
| Méret | 2 355 986 bájt |
| SHA-256 | `a187bc44f8f2ee231ecfe30f973020d668f7545a50fb7730e74ce3eece3e9eaa` |


A platform, amire a rendszer épül.


### SOS24 portál teljes exportja (71 tábla, 37 edge function)

| | |
|---|---|
| Hol | `platform/sos24-export.zip` |
| Méret | 5 635 763 bájt |
| SHA-256 | `2b87d6cee2a621eeb64c7c95d010e562af91cbda08aeb27b0ac5c6422c066692` |


A foglalkozás-egészségügyi domének forrása.


### Anamnézis-asszisztens v16 dokumentáció

| | |
|---|---|
| Hol | `v16/Anamnezis_v16_dokumentacio.zip` |
| Méret | 456 169 bájt |
| SHA-256 | `52b2bdf800afec4e21e3879b9b0dab9b3442858f82371feaa0779455296712eb` |


A 110 kérdéssoros anamnézis forrása.


## Ami licenc miatt NEM került be

Ezek a tételek **nincsenek a tárban** — de itt vannak felsorolva, lenyomattal és okkal. Ez a szakasz nem hiányjegyzék, hanem a tár része: enélkül a tár teljesnek látszana.

### Egészségügy finanszírozása — oktatási anyag (2017)

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 2 060 217 bájt |
| SHA-256 | `c811a01498b4c53366046bbafdfdcbca78a69564f0681a4a025acb6dcf529cde` |


Szerzői jogvédett oktatási anyag, ráadásul képként szkennelt: szövegréteg nélkül nem is adott semmit.


### Egészségügyi Gazdasági Szemle 2009/6 — szakcikk

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 163 693 bájt |
| SHA-256 | `ce40e09f9ad135e5c1048527301d5b0818881a686c802fc83730cee83569af1e` |


Folyóiratcikk, szerzői jogvédett. Háttérirodalom, nem normatív forrás.


### ICHOM Pregnancy and Childbirth Data Dictionary v5.0 (2025)

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 66 153 bájt |
| SHA-256 | `53e7792ae2d374238da58901b1ddc9d7f2ff136018be99eb78ea542ad8cfaa6d` |


Az ICHOM saját felhasználási feltételei alatt jelenik meg. A belőle GENERÁLT változóleképezés a repóban van (`registry/ichom-pcb-v5.seed.json`), a szótár maga nem.


### IME IV/2 (2005): A HBCS rendszer működési zavarai és azok megszüntetése

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 57 354 bájt |
| SHA-256 | `edbfbdad8c8613a4952ad0f90d34e58271c3b9f5fd64e61d79e02fa951f94aab` |


Folyóiratcikk, szerzői jogvédett. Háttérirodalom, nem normatív forrás — szabályt nem vezettünk belőle.


### SNOMED CT Global Patient Set, 2026-01-01 kiadás

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 8 521 869 bájt |
| SHA-256 | `f49909beb10ce0c9897863237730cfc5362d1a8a519d3f69e59121305facec75` |


CC BY-ND 4.0. A VÁLTOZATLAN továbbadás megengedett lenne, de a rendszer elve az, hogy SNOMED-tartalom nem kerül a repóba — sem a kiadás, sem a belőle készült tábla. A repó csak AZONOSÍTÓKAT tartalmaz. A készlet helyben települ; ezt a `validateSnomedDistribution()` build-hibával kényszeríti ki.


### SNOMED International: Guidelines for Translation of SNOMED CT

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 817 368 bájt |
| SHA-256 | `eb5ae8eb87f44900dce02a616e1cb03074b0de2ab2bb103ae9c94ad630da54f1` |


SNOMED International szerzői joga. A belőle következő SZABÁLY a kódban van: magyar SNOMED-megnevezést a rendszer nem ad validált fordítás nélkül.


### European Journal of Cancer — 30 közlemény (2026-09-05)

| | |
|---|---|
| Hol | **nincs a tárban** |
| Méret | 24 826 957 bájt (30 PDF) |
| SHA-256 | `6321392ea94d0329c8d8b2ed041f7bc64eae24535606f3762fe2096d8e75ab7d` |

Kiadói (Elsevier) szerzői jogvédett teljes szövegek: a tárolásuk és
továbbadásuk a repóban nem jogszerű — ugyanaz az elv, mint a korábbi két
folyóiratcikknél.

Tartalmilag a 30 közlemény túlnyomó része **általános onkológia** (melanoma,
emlő, prosztata, vese, immunterápia); **nőgyógyászati onkológiai tétel nincs
közöttük.** Négy témakör az, amiből a 12. modulra átvihető tanulság volna:

| Témakör | Mihez szólna |
|---|---|
| immunterápia mellékhatásai (irAE) és súlyossági meghatározóik | `onc.tx.*` — a mellékhatás-követés ma nincs strukturálva |
| keringő tumor-DNS (ctDNA) | követési mérés, a 15. modul mérési pontjai |
| palliatív prognosztikai pontszámok összevetése | a `calc.verified` kapu — melyik pontszám mit ér |
| életminőség-pályagörbék | PROM-idősor, ma egyetlen időpontot tárolunk |

**Ezekből ma semmi nem került át.** Mindegyik hitelesítést és elsődleges
forrást kíván, nem PDF-et.


## Az elv

Minden forrás lenyomattal szerepel. Ami licenc miatt kimarad, az IS szerepel — a lenyomatával és a kimaradás okával. Egy forrástár, ami hallgat a kihagyott tételekről, teljesnek látszik, és ezért rosszabb a semminél.
