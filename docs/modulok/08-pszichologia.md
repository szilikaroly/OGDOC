# Modul 08 — Pszichológia

| | |
|---|---|
| **Cél** | Perinatális mentális egészség szűrése és kockázatbecslése validált eszközökkel |
| **Forrás** | **IPRACS** (EPDS HU-validációval, PPP-rizikó) + **ICHOM** (Whooley, EPDS, MSPSS, MIBS) + v16 (PHQ-2) |
| **Becsült változó** | ~60 |
| **Fázis** | 3 |
| **Függ** | 03 (anamnézis — a PPP-rizikó bemenetei) |

## Mi van már meg az IntuiCare-ben

**Ez a modul infrastruktúrája kész.** A `questionnaires` tábla `items`, `scoring`, `cutoffs`, `critical_item_index` és `critical_threshold` mezői pontosan az EPDS Q10-szabályt valósítják meg: egyetlen tétel önálló vörös zászlót ad az összpontszámtól függetlenül. A `questionnaire_responses` hozza a `total_score`, `subscale_scores`, `severity`, `critical_triggered` mezőket, a `critical_result_alerts` és a `clinical_alert_status_log` pedig a riasztáskezelést. **Az EPDS, a Whooley és a PPP-rizikó adatként kerül be, nem kódként.**

## 1. Miért fontosabb, mint amilyennek látszik

A perinatális mentális betegség a leggyakoribb szülészeti szövődmények közé tartozik, és a
postpartum pszichózis a legveszélyesebb: **5% szuicid és 4% infanticid kockázat**. A modul
egyetlen dolgot csinál jól, ha mást nem: nem hagyja, hogy ez észrevétlen maradjon.

## 2. EPDS — Edinburgh Postnatal Depression Scale

**Magyar validációval**, ami ritka és értékes:

- Postpartum: Töreki A et al. *Midwifery* 2014;30:911–918. PMID 24742635
- Antepartum: Töreki 2012, PMID 22417756

10 tétel, mindegyik 0–3 pont (max 30). Időszakonként eltérő vágóérték (antepartum vs.
postnatalis) — a modul a `ctx.pathway`-ből tudja, melyiket használja.

### A Q10 szabály

> **A 10. tétel („önkárosítás gondolata") bármely pozitív válasza vörös zászló, az összpontszámtól
> függetlenül.**

Ez nem küszöb, hanem kapu. Egy 6 pontos EPDS pozitív Q10-zel azonnali pszichiátriai
konzultációt indokol, akkor is, ha az összpontszám a normál tartományban van. A rendszer ezt
nem engedi elnyomni.

## 3. Postpartum pszichózis (PPP) rizikó

Időszak: tipikusan az első 2 hétben.

| Rizikófaktor | Hatás | Forrásváltozó |
|---|---|---|
| Bipoláris zavar | OR ~35× | `hx.psy.bipolar` |
| Korábbi PPP | 50% recidíva | `hx.psy.prevPPP` |
| Családi PPP | RR 10,34 | `hx.family.ppp` |
| Elsőszülő | mérsékelt emelés | `ctx.parity.para` = 0 |
| Alvásmegvonás | mérsékelt emelés | `10` szülőszoba adataiból |

**Kimenet: ha magas → hospitalizáció KÖTELEZŐ.** Kezelés: olanzapin/kvetiapin ± ECT. Ez a
rendszer egyik legerősebb állítása, és szándékosan az.

## 4. ICHOM-eszközök

| Eszköz | Tétel | ICHOM | Mit mér |
|---|---:|---|---|
| Whooley | 2 | PCB113–114 | depresszió-gyorsszűrés |
| EPDS | 10 | PCB115–124 | perinatális depresszió |
| MSPSS | 3 | PCB007–009 | észlelt társas támogatás |
| MIBS | 5+ | PCB105–112 | anya-csecsemő kötődés |
| PHQ-2 / PHQ-9 | 2 / 9 | v16 | depresszió |

**Ezek validált mérőeszközök: a tételszöveget és a pontozást nem módosítjuk.** A magyar
fordításnál a hivatalos, validált változatot kell használni, ahol létezik; ahol nem, ott a
kérdőív **„nem validált fordítás" jelölést kap** — ez kutatási felhasználásnál különösen fontos,
mert a nem validált fordítással gyűjtött adat publikálhatósága korlátozott.

## 5. Pszichoszociális tényezők (v16 `7d`)

Munkahelyi stressz, párkapcsolati helyzet, bántalmazás szűrése, anyagi helyzet, lakhatás,
társas támogatás. Ezek nem score-ok, de a kockázati kép részei, és a `13` ellátási tervbe
mennek.

## 6. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` (bipoláris, korábbi PPP/PPD, családi PPP, pszichiátriai anamnézis),
`02` (`ctx.pathway` — melyik vágóértéket használjuk), `10` (alvásmegvonás, szülési trauma),
`06` (jelenlegi pszichofarmakon).

**⇨ Mit tölt fel**: `09` epikrízis kockázati része · `13` ellátási terv (pszichiátriai
konzílium) · `15` utánkövetés (EPDS ismétlése) · `16` ICHOM-export · `17` BNO (F-fejezet).

## 7. Elfogadási kritérium

Egy 6 pontos EPDS pozitív 10. tétellel **vörös zászlót és azonnali teendőt** generál, nem
„normál tartomány" üzenetet. Bipoláris anamnézis mellett a PPP-rizikó automatikusan magas,
és a hospitalizációs javaslat megjelenik — anélkül, hogy külön be kellene írni.

> **Ez teszt, nem ígéret:** [`test/pszichologia.test.ts`](../../test/pszichologia.test.ts).

## 8. Nyitott kérdés

~~A PPP-kockázat ma kvalitatív, nem kvantitatív.~~ **Eldőlt: kvalitatív marad.** Az
`assessPpp()` felsorolja a rizikófaktorokat a saját forrásukkal és publikált hatásukkal,
és szabályalapú háromfokozatú besorolást ad — összesített szám nélkül. A hiány maga is
kimondva szerepel az eredményben (`noCombinedEstimate`), hogy ne látsszon hiányosságnak.

> **A döntés indoklása** (ld. [`../fejlesztes/15-merokeszulekek.md`](../fejlesztes/15-merokeszulekek.md) 5.):
> az esélyhányadosok külön kohorszokból származnak, a faktorok nem függetlenek egymástól,
> és a szorzatuk **pontosnak látszana** — épp ez a baj.

### Új nyitott kérdés, amit a megvalósítás hozott elő

A **licencelt tételszövegek** hiánya nem fejlesztési feladat, de az egész modult megállítja:
a validált magyar szöveg nélkül az eszköz nem vehető fel. Négy eszköznél a magyar
validációról sincs tudomásunk (Whooley, PHQ-9, MSPSS, MIBS) — ezek kutatási felhasználása
korlátozott, a klinikai nem.
