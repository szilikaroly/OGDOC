---
source: docs/09-sos24-alap.md
sha256: ce627bcffbc5a0da661bf4d0a0e1750dc87b62f9921271840ee58411f97a28a1
lines: 174
profile: prose
generator: subagent
raw_tokens_est: 2602
verified: 12 confirmed
---

# docs/09-sos24-alap.md

## Topics
- L1-86: a SOS24 portál metrikái és doménjei (foglalkozás-egészségügy, kockázat, labor, háziorvos)
- L87-174: kétplatformos döntés, portolási leképezés, költség, azonnal átvett gyakorlatok

## Claims

- [C1] [CONFIRMED] A SOS24 adatbázisa 71 táblát tartalmaz @L9 `| Adatbázis-tábla | 71 |`
- [C2] [CONFIRMED] A SOS24-ben 230 RLS policy van @L10 `| RLS policy | 230 |`
- [C3] [CONFIRMED] 37 Deno edge function van, ebből 19 AI-jellegű @L11 `| Edge function (Deno) | 37, ebből 19 AI |`
- [C4] [CONFIRMED] A foglalkozás-egészségügyi folyamatban a munkáltató csak az alkalmassági eredményt látja, a klinikai részleteket nem @L30 `A munkáltató csak az alkalmassági eredményt látja, a klinikai részleteket nem`
- [C5] [CONFIRMED] A labor-árazás egyetlen központi függvényben van, unit tesztekkel @L59 `**Egyetlen központi árazó függvény**`
- [C6] [CONFIRMED] A zaj- és rezgésmérés böngészőből történik, saját mérőkomponensekkel @L44 `**Zaj- és rezgésmérés böngészőből**`
- [C7] [CONFIRMED] A K0 döntés szerint nem az egyik platform nyeli el a másikat, hanem vegyes rendszer épül @L99 `nem az egyik platform nyeli el a másikat,`
- [C8] [CONFIRMED] Az eredeti — felülírt — javaslat az IntuiCare gazdaplatform és a SOS24-domének beolvasztása volt @L104 `**Eredeti javaslat: az IntuiCare a gazdaplatform, a SOS24 domének átkerülnek bele.**`
- [C9] [CONFIRMED] Az egészségnapló-táblák átfedésben vannak a meglévő measurements/food_log/stool_log réteggel, egyesíteni kell @L134 `**itt átfedés van, egyesíteni kell**`
- [C10] [CONFIRMED] A kérdőív-átfedésből az IntuiCare gazdagabb motorja marad meg @L137 `az IntuiCare-é a gazdagabb (licenc, cutoffs, critical item), az marad`
- [C11] [CONFIRMED] A SOS24 71 táblájából kb. 40 kerül át @L148 `A SOS24 71 táblájából kb. 40 kerül át`
- [C12] [CONFIRMED] A portolás becsült ráfordítása 4-6 hét, a 21. modul részeként @L149 `Becslés: **4–6 hét**, a 21. modul részeként.`
