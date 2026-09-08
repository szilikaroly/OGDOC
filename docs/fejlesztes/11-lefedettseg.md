# 11 — Katalógus-lefedettség

> **Ez a fájl generált.** Forrása a `registry/variables/`; a
> `node tools/gen-coverage.ts` állítja elő, és a CI ellenőrzi.

**894 változó** a tervezett **~4035**-ból — **22.2%**.

A tervezett szám a `docs/modulok/` becslése: **nagyságrend, nem előrejelzés**. Arra jó,
hogy lássuk, hol van a munka tömege — és hogy egy modul ne látsszon késznek, amíg a
felét sem tartalmazza.

| # | Modul | Megvan | Tervezett | Haladás | |
|---|---|---:|---:|---:|---|
| 01 | Panaszok | 15 | 120 | 13% | `█░░░░░░░░░` |
| 02 | Orvoshoz fordulás oka | 20 | 25 | 80% | `████████░░` |
| 03 | Anamnézis | 103 | 230 | 45% | `████░░░░░░` |
| 04 | Státusz | 129 | 280 | 46% | `█████░░░░░` |
| 05 | Vizsgálatok | 223 | 520 | 43% | `████░░░░░░` |
| 06 | Gyógyszerelés | 17 | 90 | 19% | `██░░░░░░░░` |
| 07 | Diéta | 31 | 35 | 89% | `█████████░` |
| 08 | Pszichológia | 44 | 60 | 73% | `███████░░░` |
| 09 | Epikrízis | 12 | 70 | 17% | `██░░░░░░░░` |
| 10 | Szülőszoba | 37 | 200 | 19% | `██░░░░░░░░` |
| 11 | Műtő | 51 | 110 | 46% | `█████░░░░░` |
| 12 | Onkológia | 21 | 120 | 18% | `██░░░░░░░░` |
| 13 | Ellátás tervezés | 23 | 50 | 46% | `█████░░░░░` |
| 14 | Zárójelentés | 19 | 40 | 48% | `█████░░░░░` |
| 15 | Utánkövetés | 52 | 90 | 58% | `██████░░░░` |
| 16 | Betegelégedettség | 58 | 45 | 129% | `██████████` |
| 17 | Kódolás | 10 | 80 | 13% | `█░░░░░░░░░` |
| 18 | Minőségbiztosítás | 26 | 60 | 43% | `████░░░░░░` |
| 19 | CRM | 0 | 600 | 0% | `░░░░░░░░░░` |
| 20 | Statisztika | 0 | 40 | 0% | `░░░░░░░░░░` |
| 21 | Foglalkozás-egészségügy | 0 | 350 | 0% | `░░░░░░░░░░` |
| 22 | Biobank | 0 | 180 | 0% | `░░░░░░░░░░` |
| 23 | Genetika | 0 | 220 | 0% | `░░░░░░░░░░` |
| 24 | IVF | 0 | 300 | 0% | `░░░░░░░░░░` |
| 25 | Admin | 3 | 120 | 3% | `░░░░░░░░░░` |

## Amit a szám nem mond meg

A lefedettség **darabszám, nem minőség**. Egy modul akkor kész, ha a
[`04-modul-csontvaz.md`](04-modul-csontvaz.md) kilenc tétele hiánytalan — köztük a
klinikai átvétel, ami nem mérhető változószámmal.

Két dolog, amit érdemes külön nézni:

| Jellemző | Darab | Arány | Cél |
|---|---:|---:|---|
| Szabad szöveg (`text`) | 46 | 5.1% | ≤ 10% |
| Háromállású kérdés | 103 | 11.5% | anamnézisben mind |
| Click-open lelet | 23 | — | a fizikális státusz egésze |
| Beteg tölti ki | 172 | 19.2% | az anamnézis egésze |
| Beteg-azonosító (`phi`) | 2 | — | jelölve |

**14 dokumentumtípus** definiálva, mind ellátási dokumentáció.

## Panaszszótár

A szótár tételei nem változók, ezért a fenti táblázatban nem szerepelnek — pedig a
`01` modul értékének a nagyobbik fele ez. A keresés minősége dönti el, hogy a
klinikus a kódolt tételt választja-e a szabad szöveg helyett.

| Jellemző | Darab |
|---|---:|
| Panasztétel | 82 (tervezett ~400) |
| Szinonima összesen | 336 |
| Tétel legalább egy szinonimával | 82 |
| Vörös zászló (feltétlen vagy feltételes) | 36 |

## Referenciák, normogramok, szűrések

Ezek nem változók, de klinikailag ugyanolyan súlyúak — és mindhármat **kapu**
védi: ellenőrizetlen tábla nem ad percentilist, ismeretlen terhességi állapot
nem kap referenciatartományt, hiányzó anamnézis nem lesz „nem vonatkozik rá”, és
ellenőrizetlen gondozási alaptáblából nem lesz elmulasztott vizit.

| Jellemző | Darab |
|---|---:|
| Referenciatartománnyal ellátott változó | 32 |
| Ebből még FELTÉTELEZETT (ellenőrizendő) | 32 |
| Normogram | 9 |
| Ebből visszaellenőrzött (percentilist ad) | 0 |
| Szűrési szabály | 8 |
| Hatóanyag a gyógyszertörzsben | 23 (tervezett ~5592 PUPHA-tétel) |
| Ebből kontraindikáció-kapuval | 9 |
| Diétás protokoll | 15 |
| Validált mérőeszköz | 10 |
| Ebből FELVEHETŐ (licencelt tételszöveg) | 1 |
| Ebből validált magyar fordítással | 1 |
| Beavatkozás OENO-kóddal | 22 / 25 |
| Gondozási protokoll | 1 |
| Ebből elsődleges forrásból ellenőrzött | 0 |
| Vizitrend-módosító (rizikó szerinti sűrítés) | 9 |
| Konzílium-javallat | 11 |
| ICHOM mérési pont | 4 |
| ICHOM-tétel a szabványban | 145 |
| Ebből saját mezőre leképezve | 24 |
| PROM-készlet mérési pontonként | 4 |
| Beteg által kitöltendő (`prom.*`) változó | 58 |
| Kódtábla a repóban | 11 |
| Ebből TELJES törzs (nem részhalmaz) | 10 |
| Kódtétel összesen a repóbeli törzsekben | 24748 (tervezett ~13 000) |
| Helyben települő törzs (nem a repóban) | 3: tbl.diag, tbl.eszkoz, tbl.gyfkod |
| Kódajánlási szabály | 16 |
| HBCS-csoport a besorolási táblázatban | 773 |
| Ebből GÉPPEL KIÉRTÉKELHETŐ szabályú | 596 (77%) |
| **Hiányzó törzs** (nevesítve) | 1 |

### Amelyik törzs nincs betöltve

A kódajánlás annyit tud, amennyi törzs be van töltve. Ami nincs, azt a rendszer nem
pótolja becsléssel — de a hiányt sem hallgatja el:

| Törzs | Mi kellene hozzá |
|---|---|
| SNOMED CT magyar megnevezések | validált magyar fordítás (SNOMED International fordítási eljárás) |
| Ebből sürgős | 3 |

## A feltöltés sorrendje

A modulok függőségi sorrendje adja: **02 → 03 → 04 → 01 → 05 → …** Az ellátási
kontextus (`02`) minden más modul kötelezőségét és érvényességi ablakát meghatározza,
ezért az első; az anamnézis (`03`) a státusz és a gyógyszerelés kapuit tölti fel.

A `19` CRM és a `21` foglalkozás-egészségügy **meglévő rendszerek átvétele**, nem új
katalógus — ezek a séma-egyesítéskor kerülnek be, nem kézi felvétellel.

## Egy magbeli feladat, amit a feltöltés hozott elő

A `ctx.gaSource` most **rögzített tény**, de a gesztációs kort még mindig a
`calc.ga.lmp` számolja, kizárólag az utolsó menstruációból. A `02` modul szerinti
**precedencia** — IVF-transzfer → korai CRL → LMP → késői biometria — még nincs
megvalósítva, és ehhez a kalkulátor-rétegnek is bővülnie kell:

- kellenek a bemenetek: `us.crl.first` (a `05` modulból) és `ctx.ivfTransferDate`;
- a `runCalc` ma **minden** bemenetet megkövetel — a precedencia viszont épp azt
  jelenti, hogy az elsőt használjuk, ami elérhető. Ez a futtató szándékos
  szigorúságának egyetlen indokolt kivétele, és külön kalkulátor-fajtát kíván.

Amíg ez nincs meg, a `gaSource` a **terhesgondozási lapon jelenik meg** rögzített
tényként — a doksi szerint a forrásnak mindig látszania kell —, de a számítást nem
vezérli. Ezt ki kell mondani, nehogy valaki azt higgye, hogy már működik.
