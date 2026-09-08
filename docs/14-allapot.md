# 14 — Hol tartunk

*Generált dokumentum: `npm run docs`. Minden szám a forrásból jön — egy kézzel írt „hol tartunk” fél éven belül hazudik.*

---

## A számok

| | |
|---|---:|
| Regiszterbeli változó | **905** |
| Kalkulátor | 48 |
| ebből kapu mögött (`verified: false`) | **12** |
| Teszt | **1939** |
| Mag: fájl / sor | 162 / 44108 |
| Teszt: fájl / sor | 82 / 21294 |
| Dokumentum | 134 |
| Regiszterfájl | 139 |

## A forrásrendszerek felülettérképe

| Térkép | Szakasz | Adatlap | Mező |
|---|---:|---:|---:|
| A meglévő nőgyógyászati rendszer felülettérképe | 39 | 29 | 396 |
| A meglévő szülészeti-fetalis medicina rendszer felülettérképe | 52 | 59 | 1106 |
| **Együtt** | **91** | **88** | **1502** |

Mezőnkénti mérleg:

| Állapot | Mennyi | Mit jelent |
|---|---:|---|
| megvan | 31 | van regiszterbeli változó, és a térkép ide köti |
| levezetett | 48 | nálunk számított, a régi felületen kézzel töltendő |
| kapu | 231 | nem mező, hanem **szabály** — döntést vár |
| mérési körülmény | 51 | a mért értékkel EGYÜTT tárolandó |
| interfészből | 15 | HL7 ADT/ORM, nem kézi bevitel |
| nem vehető át | 95 | a mi szabályainkba ütközik |
| hiányzik | 1031 | valódi fejlesztési tétel |

A kapu és a nem vehető át együtt **326** mező — mögöttük **38** szabály. Ez a [3. lépés](13-18-lepes.md#3-a-326-szabály-döntéssé-tétele) munkája, és a döntés nem fejlesztői kérdés:

| Döntési állapot | Mennyi | Átkerül? |
|---|---:|---|
| eldöntve | 0 | a döntés szerint |
| eldöntetlen | 326 | **nem** |
| elavult aláírás | 0 | **nem** |
| hiányos aláírás | 0 | **nem** |

Eldöntetlenül egy mező sem kerül át; ma **0** mező kerülne át. A 38 szabályból **0** van aláírva. Munkalap: `npm run dontes`.

## Ami kapu mögött áll

*Ezek a kalkulátorok teljes bemenettel sem adnak eredményt, amíg a konstansaikat nem vetették össze az elsődleges forrással.*

| Kalkulátor | Modul |
|---|---|
| `calc.egfr.ckdepi2021` — eGFR (CKD-EPI 2021) | lab |
| `calc.efw.hadlock` — Becsült magzati súly (Hadlock) | vizsgalatok |
| `calc.efw.ig21` — Becsült magzati súly (INTERGROWTH-21st) | vizsgalatok |
| `calc.ga.crl.ig21` — Gesztációs kor CRL-ből (INTERGROWTH-21st) | vizsgalatok |
| `calc.ga.hcfl.ig21` — Gesztációs kor fejkörfogatból és combcsonthosszból (INTERGROWTH-21st) | vizsgalatok |
| `calc.ga.hc.ig21` — Gesztációs kor fejkörfogatból (INTERGROWTH-21st) — csak FL hiányában | vizsgalatok |
| `calc.crcl` — Kreatinin-clearance (Cockcroft–Gault) | rx |
| `calc.energy.pregnancy` — Terhességi energiaszükséglet | diet |
| `calc.isth.dic.pregnancy` — ISTH terhességi DIC-pontszám | labour |
| `calc.qbl.total` — Teljes mennyiségi vérvesztés | labour |
| `calc.cmqcc.stage` — CMQCC vérzési stádium | labour |
| `calc.cmqcc.ob.sepsis.screen` — CMQCC szülészeti szepszis — élettani szűrő | labour |

## Külső források: katalogizálva és átvéve

A projekt licence: **MIT**. Ez nem formaság — a copyleft forrásokat ez dönti el.

| Forrás | Tétel | Megvan | Hivatkozható | Helyben telepíthető | Ebből ÁTVÉVE | Érintett változó |
|---|---:|---:|---:|---:|---:|---:|
| BCNatal — Medicina Fetal Barcelona: protokollok és kalkulátorok | 24 | 0 | 0 | 0 | **0** | 40 |
| CTG- és magzati állapot osztályozó gépi tanulási tárak | 11 | 5 | 0 | 1 | **0** | 5 |
| Szülészeti-nőgyógyászati kockázati kalkulátorok — vegyes forrásokból | 10 | 3 | 1 | 1 | **0** | 30 |
| Nőgyógyászati AI-asszisztensek és osztályos működést támogató tárak | 7 | 4 | 0 | 1 | **0** | 4 |
| scENDO_scOVAR_2020 — méhtest- és petefészekrák egysejt-atlasz | 1 | 1 | 1 | 0 | **0** | 0 |

Ami az átvételt megállítja, tételenként:

| Tétel | Mi akadályozza | Következő lépés |
|---|---|---|
| kulso.bcnatal | a forrás licence ISMERETLEN — amíg nem tudjuk, mit szabad vele, az átvétel nem indulhat el (ugyanaz a szabály, mint a SNOMED CT GPS-nél) | a felhasználási feltételek beszerzése és rögzítése |
| kulso.ctgml | a szöveg megvan, de nem dolgoztuk fel — a rendszer viselkedéséhez csak hitelesített tétel járul hozzá | a képlet/küszöb kiolvasása a mi formánkra |
| kulso.ctgml | a forrás licence ISMERETLEN — amíg nem tudjuk, mit szabad vele, az átvétel nem indulhat el (ugyanaz a szabály, mint a SNOMED CT GPS-nél) | a felhasználási feltételek beszerzése és rögzítése |
| kulso.ctgml | LICENCÜTKÖZÉS — a projekt licence MIT (megengedő), a forrásé GPL-3.0 (copyleft): a TERJESZTÉS irányában ez a kettő nem egyeztethető össze. MIT-kódot be lehet vinni egy GPL-műbe, visszafelé nem: a GPL-származék csak GPL alatt adható tovább | vagy a szerzők írásos engedélye / megengedő újralicencelése, vagy a modell újraépítése a KÖZLEMÉNYBŐL, vagy helyi telepítés (a származék nem kerül a terjesztett műbe) |
| kulso.kalkulatorok | LICENCÜTKÖZÉS — a projekt licence MIT (megengedő), a forrásé GPL-2.0 (copyleft): a TERJESZTÉS irányában ez a kettő nem egyeztethető össze. MIT-kódot be lehet vinni egy GPL-műbe, visszafelé nem: a GPL-származék csak GPL alatt adható tovább | vagy a szerzők írásos engedélye / megengedő újralicencelése, vagy a modell újraépítése a KÖZLEMÉNYBŐL, vagy helyi telepítés (a származék nem kerül a terjesztett műbe) |
| kulso.kalkulatorok | a forrás licence ISMERETLEN — amíg nem tudjuk, mit szabad vele, az átvétel nem indulhat el (ugyanaz a szabály, mint a SNOMED CT GPS-nél) | a felhasználási feltételek beszerzése és rögzítése |
| kulso.kalkulatorok | hivatkozott bizonyíték, amit nem szereztünk be — így még idézni sem tudjuk | a forrás beszerzése (a hozzáférés akadályának feloldása) |
| kulso.kalkulatorok | hivatkozott bizonyíték — nem képletet ad, hanem állítást a képletekről; idézhető, átvenni nincs mit | — |
| kulso.nogyai | a szöveg megvan, de nem dolgoztuk fel — a rendszer viselkedéséhez csak hitelesített tétel járul hozzá | a képlet/küszöb kiolvasása a mi formánkra |
| kulso.nogyai | LICENCÜTKÖZÉS — a projekt licence MIT (megengedő), a forrásé GPL-3.0 (copyleft): a TERJESZTÉS irányában ez a kettő nem egyeztethető össze. MIT-kódot be lehet vinni egy GPL-műbe, visszafelé nem: a GPL-származék csak GPL alatt adható tovább | vagy a szerzők írásos engedélye / megengedő újralicencelése, vagy a modell újraépítése a KÖZLEMÉNYBŐL, vagy helyi telepítés (a származék nem kerül a terjesztett műbe) |
| kulso.nogyai | a forrás licence ISMERETLEN — amíg nem tudjuk, mit szabad vele, az átvétel nem indulhat el (ugyanaz a szabály, mint a SNOMED CT GPS-nél) | a felhasználási feltételek beszerzése és rögzítése |
| kulso.scendo | hivatkozott bizonyíték — nem képletet ad, hanem állítást a képletekről; idézhető, átvenni nincs mit | — |

**53 katalogizált tétel 71 változónkhoz szólna hozzá — és ma egyik sem szól hozzá.** A katalógus a HASZNOT mutatja meg a beszerzés előtt; a viselkedéshez csak hitelesített, ismert licencű tétel járul hozzá. Részletek: [`fejlesztes/42-kulso-protokollok.md`](fejlesztes/42-kulso-protokollok.md) · [`fejlesztes/43-kalkulator-katalogus.md`](fejlesztes/43-kalkulator-katalogus.md).

## A mag egységei

| Egység | Fájl | Sor |
|---|---:|---:|
| `core/calc/` | 4 | 2435 |
| `core/ui/` | 7 | 2236 |
| `core/interop/` | 6 | 2086 |
| `core/us/` | 6 | 2060 |
| `core/coding/` | 8 | 1872 |
| `core/store/` | 4 | 1431 |
| `core/auth/` | 6 | 1423 |
| `core/szepszis/` | 4 | 1365 |
| `core/vedono/` | 4 | 1355 |
| `core/gyermek/` | 4 | 1344 |
| `core/fekvo/` | 6 | 1268 |
| `core/belgyogyaszat/` | 2 | 1043 |
| `core/scores/` | 6 | 984 |
| `core/kulso/` | 2 | 978 |
| `core/kerdoiv/` | 4 | 919 |
| `core/docs/` | 3 | 858 |
| `core/mir/` | 2 | 846 |
| `core/op/` | 4 | 825 |
| `core/rx/` | 4 | 823 |
| `core/plan/` | 5 | 766 |
| `core/karbantartas/` | 3 | 753 |
| `core/ett/` | 2 | 707 |
| `core/pilot/` | 2 | 641 |
| `core/zaro/` | 4 | 611 |
| `core/derive/` | 4 | 601 |
| `core/lab/` | 3 | 588 |
| `core/ai/` | 2 | 569 |
| `core/journal/` | 2 | 555 |
| `core/profil/` | 1 | 546 |
| `core/followup/` | 2 | 499 |
| `core/import/` | 3 | 456 |
| `core/tele/` | 1 | 448 |
| `core/finanszirozas/` | 1 | 443 |
| `core/crypto/` | 2 | 409 |
| `core/screening/` | 2 | 405 |
| `core/fogamzas/` | 1 | 403 |
| `core/audit/` | 1 | 400 |
| `core/cms/` | 1 | 400 |
| `core/admin/` | 1 | 397 |
| `core/epikrizis/` | 2 | 391 |
| `core/diet/` | 2 | 377 |
| `core/riasztas/` | 2 | 375 |
| `core/exassist/` | 1 | 355 |
| `core/szabaly/` | 1 | 333 |
| `core/eeszt/` | 1 | 317 |
| `core/hianyzo/` | 2 | 314 |
| `core/biobank/` | 1 | 303 |
| `core/fedes/` | 1 | 279 |
| `core/complaints/` | 2 | 275 |
| `core/pacs/` | 1 | 268 |
| `core/ocr/` | 1 | 265 |
| `core/ctg/` | 1 | 255 |
| `core/licenc/` | 1 | 232 |
| `core/endo/` | 1 | 221 |
| `core/anamnezis/` | 1 | 220 |
| `core/neo/` | 1 | 212 |
| `core/prom/` | 1 | 200 |
| `core/mdr/` | 1 | 185 |
| `core/jelentes/` | 1 | 167 |
| `core/log/` | 1 | 161 |
| `core/onc/` | 1 | 158 |

## A tizennyolc lépés állása

*A [`13-18-lepes.md`](13-18-lepes.md) jelöléseiből kiolvasva — nem kézzel másolva, mert két kézzel karbantartott lista két hét alatt szétválik.*

| # | Lépés | Állapot |
|---:|---|---|
| 1 | A tároló: perzisztencia, jogosultság, auditnapló | **MEGVAN** |
| 2 | A két hiányzó törzs lezárása | **MEGVAN** |
| 3 | A 326 szabály döntéssé tétele | **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM** |
| 4 | Az anamnézis-gerinc befejezése | **MEGVAN** |
| 5 | Egy teljes eset végigvitele — a két kimenettel | **A GÉPI FELE MEGVAN, A KLINIKAI OLVASAT NEM** |
| 6 | A harminc laborreferencia | **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM** |
| 7 | A normogramok: 265 katalogizált, 3 telepített, 0 hitelesített | **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM** |
| 8 | A hét kapu mögötti kalkulátor | **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM** |
| 9 | A szepszisküszöbök és az omqSOFA-eltérés | **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK ÉS A DÖNTÉS NEM** |
| 10 | A megőrzési idők | **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM** |
| 11 | ETT-beadás | **A GÉPI FELE MEGVAN — DE AZ NEM A KÉRELEM** |
| 12 | A tíz mérőeszköz licencelése | **A GÉPI FELE MEGVAN, A LICENCEK ÉS A DÖNTÉSEK NEM** |
| 13 | Az akkreditációs dokumentumfa és az első kérelem | **A GÉPI FELE MEGVAN, A DOKUMENTUMOK NEM** |
| 14 | Az EESZT- és HIS-csatlakozás engedélyeztetése | **A GÉPI FELE MEGVAN, A CSATLAKOZÁS NEM** |
| 15 | A riasztások címzettje és az eszkalációs rend | **A GÉPI FELE MEGVAN, A LÁNCOK NEM** |
| 16 | Pilot egy osztályon, valódi adattal | **A GÉPI FELE MEGVAN, A PILOT NEM INDULHAT** |
| 17 | Az audit-hurok bekapcsolása | **A GÉPI FELE MEGVAN, AZ ESETEK NEM** |
| 18 | A helyi normogramok: a rendszer önmagára záródik | **A GÉPI FELE MEGVAN, A SAJÁT ADAT NEM** |

A tizennyolcból **3 lépés kész**, **15-nél a gépi fele áll, az emberi nem** — aláírás, illetve klinikai olvasat. A jelölés sehol nem „kész projekt”: mindegyiknél ott áll, mi maradt nyitva.

## Mi futhat valódi betegadaton — és mi nem

*Ez a rendszer legfontosabb állapotjelzője, és szándékosan nem egyetlen igen/nem: a rétegek külön-külön érnek meg.*

| Réteg | Állapot | Mi hiányzik |
|---|---|---|
| tárolás — titkosított, láncolt, perzisztens | **éles** | — |
| jogosultság — szerepkör → ellátási kapcsolat → időablak | **éles** | — |
| auditnapló — az adat előtt írva, elutasítással együtt | **éles** | — |
| törlés — kapuk, kétágú visszavonás, tanúsítvány | **éles** | a megőrzési idők hitelesítése (10. lépés) |
| kulcsőrzés | fejlesztői | HSM vagy KMS |
| **hitelesítés** | **NINCS** | SSO vagy kártyás azonosítás |

A webes kiszolgáló `OGDOC_SYNTHETIC=1` nélkül **el sem indul**. A rendszer tehát valódi betegadaton nem futhat — de már nem a tároló, a jogosultság vagy a napló miatt, hanem azért, mert a „ki vagy te” kérdésre nincs válasz.

---

*A következő lépések sorrendje: [`13-18-lepes.md`](13-18-lepes.md).*
*Teljes exportcsomag: `npm run csomag`.*
