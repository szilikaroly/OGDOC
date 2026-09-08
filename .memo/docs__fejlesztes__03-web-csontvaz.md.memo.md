---
source: docs/fejlesztes/03-web-csontvaz.md
sha256: f8e212bcc7d209370af0a94af18c7020115afaf328d8aa7d858fe886949ba032
lines: 104
profile: prose
generator: subagent
raw_tokens_est: 1346
verified: 6 confirmed
---

# docs/fejlesztes/03-web-csontvaz.md

## Topics
- L1-104: a futó webes csontváz — mit bizonyít, fájljai és sorsuk, mit nem csinál a felület, az út a végleges stackig, böngészős ellenőrzés

## Claims

- [C1] [CONFIRMED] A webes réteg 2026-09-05 óta a tároló fölött fut, perzisztenciával, jogosultsággal és auditnaplóval @L3 `A webes réteg 2026-09-05 óta a `
- [C2] [CONFIRMED] A csontváz 47 mezőt renderel úgy, hogy a felületi kód egyetlen mezőnevet sem ismer @L12 `**47 mezőt renderel,`
- [C3] [CONFIRMED] A szállítás-független API-réteg változatlanul átkerül a végleges stackre @L32 `**változatlanul átmegy** a végleges stackre`
- [C4] [CONFIRMED] A felület nem validál: elküldi az értéket, és a motor válaszát mutatja, hogy ne legyen két validációs szabály @L54 `**Nem validál.** Elküldi az értéket, és a motor válaszát mutatja.`
- [C5] [CONFIRMED] A becsült magzati súly teljes UH-biometriával sem ad számot, mert kapu mögött van @L24 `| A kapu tart | a Hadlock teljes UH-biometriával sem ad számot |`
- [C6] [CONFIRMED] A csontváz hitelesítés híján soha nem futhat valódi betegadattal, és ez a kódban is ki van írva @L75 `**Ezért a csontváz soha nem futhat valódi betegadattal.**`
