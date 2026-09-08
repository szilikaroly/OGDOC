---
source: docs/fejlesztes/46-normogram-telepites.md
sha256: 6fb2e81d5ac0f05ac9cd4f239b48491a0703584d755d1427269b6b1565b98d63
lines: 168
profile: prose
generator: subagent
raw_tokens_est: 1832
verified: 14 confirmed
---

# docs/fejlesztes/46-normogram-telepites.md

## Topics
- L1-10: a kiindulás — 265 görbe, 3 betöltve, 0 hitelesítve
- L11-59: a mindig hamis hitelesítés-szűrő hibája és a belőle lett szabályok
- L60-102: a hiányzó katalógus-leképezés, a kihagyási okok, a rangsor tényezői
- L103-168: az első tíz görbe, ikergörbe- és konvenciókérdés, képesítés, fájlok

## Claims

- [C1] [CONFIRMED] 265 katalogizált görbéből 3 van betöltve, és a publikáltak közül egy sincs hitelesítve @L5 `265 katalogizált görbe, 3 betöltve, a publikáltak közül **0 hitelesítve**.`
- [C2] [CONFIRMED] A hitelesített görbék számlálása egy nem létező szintre szűrt, ezért csendben mindig hamis volt @L22 `tehát a fordító nem szólt: az összehasonlítás **csendben mindig hamis** volt,`
- [C3] [CONFIRMED] A hiba nem érintette a beteget, mert a percentilis-kapu külön szinteket néz @L26 `tehát rossz szám sosem született.`
- [C4] [CONFIRMED] A hitelesített és a percentilist adó görbék száma szándékosan külön marad, mert a `local` nem gyengébb, hanem más fajta @L48 `A két szám szándékosan **külön** marad.`
- [C5] [CONFIRMED] A katalógust a regiszterhez kötő leképezés korábban sehol nem létezett a repóban, csak egy teszt adta át @L63 `**sehol nem létezett a repóban**`
- [C6] [CONFIRMED] A leképezés most 15 kötést tartalmaz, a maradék 104 mérés megnevezett okkal kihagyva @L68 `**15 kötéssel** — és ami ennél`
- [C7] [CONFIRMED] A PAPP-A változóként sincs meg a regiszterben @L80 `**PAPP-A változóként sincs meg**`
- [C8] [CONFIRMED] A forrásrendszer használati szokása szándékosan kis súlyú a rangsorban @L98 `szándékosan **kis súlyú**`
- [C9] [CONFIRMED] Az AC szándékosan kimaradt az első körből, mert ott már van helyi tábla @L118 `Az **AC kimaradt** az első körből, és ez nem hiba`
- [C10] [CONFIRMED] Az első tíz mérésből hatnál nincs ikergörbe a katalógusban @L122 `**Hatnál nincs ikergörbe a katalógusban.**`
- [C11] [CONFIRMED] A BPD 22 katalógustételéből 15 nem jelöli a mérési konvenciót @L132 `és a katalógus 22 tételéből **15 nem jelöli, melyikkel**.`
- [C12] [CONFIRMED] Magzati biometriánál a `kepesites` mező kötelező, mert a mérési technika is a hitelesítés tárgya @L144 `(FMF-engedélyszám vagy egyenértékű) **kötelező**`
- [C13] [CONFIRMED] A helyi tábla nem aláírás tárgya, az aláírási kísérlet build-hiba @L148 `**nem aláírás tárgya**: aláírni sem lehet, és a`
- [C14] [CONFIRMED] A validálás záró sora: 15/119 mérés leképezve, 0 görbe hitelesítve @L165 `15/119 mérés leképezve, 0 görbe hitelesítve`
