---
source: docs/fejlesztes/37-dontes-allokacio.md
sha256: 8248aa027b03d73f6e31b9dae4afd4ed81894701383ab8c96e918201c561381d
lines: 170
profile: prose
generator: subagent
raw_tokens_est: 5857
verified: 13 confirmed
---

# docs/fejlesztes/37-dontes-allokacio.md

## Topics
- L1-23: a mérleg számai és a szabályszintű döntés elve
- L24-108: szerepenkénti feladatlisták szabályonként, majd az ülésekre bontás
- L109-170: mezőszám szerinti sorrend és egy tétel lezárásának menete

## Claims

- [C1] [CONFIRMED] A dokumentum generált, az `npm run docs` állítja elő, hogy ne szakadjon el a katalógustól @L3 `Generált dokumentum:`
- [C2] [CONFIRMED] Ma egyetlen szabály sincs aláírva @L14 `| aláírt szabály | **0** |`
- [C3] [CONFIRMED] Egy aláírás a szabály minden mezőjére szól, a mezőszintű eltérés az ülés jegyzőkönyvéé @L16 `A döntés **szabályszintű**: egy aláírás a szabály minden mezőjére szól.`
- [C4] [CONFIRMED] A felelős csak a javaslatot viszi az ülésre, a „kell hozzá" oszlop minden szerepének aláírása szükséges @L22 `A **felelős** viszi a javaslatot az ülésre.`
- [C5] [CONFIRMED] A legnagyobb tétel a verziózott osztályozás szabálya @L30 `Verziózott osztályozás | A besorolás megnevezése és verziója nélkül`
- [C6] [CONFIRMED] A klinikai vezető előkészítése 22 szabály és 225 mező @L26 `**Előkészítés: 22 szabály · 225 mező.**`
- [C7] [CONFIRMED] Az adatvédelmi tisztviselő előkészítése 7 szabály és 36 mező @L55 `**Előkészítés: 7 szabály · 36 mező.**`
- [C8] [CONFIRMED] A fejlesztés előkészítése 6 szabály és 36 mező @L69 `**Előkészítés: 6 szabály · 36 mező.**`
- [C9] [CONFIRMED] A laboratóriumi szakorvos előkészítése 3 szabály és 29 mező @L82 `**Előkészítés: 3 szabály · 29 mező.**`
- [C10] [CONFIRMED] Az aláírói körök szerint a munka hat külön ülésre bontható @L105 `Összesen **6 ülés**.`
- [C11] [CONFIRMED] A hat legnagyobb szabály a 326 mezőből 145-öt fed le @L154 `A felső hat: **145 mező** a 326-ból.`
- [C12] [CONFIRMED] Az `npm run validate` hibát ad a hiányos döntésre @L164 `npm run validate                        # hibát ad, ha a döntés hiányos`
- [C13] [CONFIRMED] A lenyomatot a sablon adja, kézzel beírni tilos; a szabály mondatának változásakor a döntés elavul @L168 `A lenyomatot kézzel kiszámolni nem lehet, és épp ezért nem is szabad kézzel beírni`
