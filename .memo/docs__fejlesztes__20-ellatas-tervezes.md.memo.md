---
source: docs/fejlesztes/20-ellatas-tervezes.md
sha256: 4f1d183af0087443405015903250954ecc45407783ee9d6ca84304c8859805d1
lines: 198
profile: prose
generator: subagent
raw_tokens_est: 2325
verified: 12 confirmed
---

# docs/fejlesztes/20-ellatas-tervezes.md

## Topics
- L1-24: A jogszabályi vizitrend mint padló, amit a típus szerkezete tart meg
- L25-161: Hiányzó rizikóadat, sűrítés indoklása, konzílium-állapotok, szülésmód-kapu
- L162-198: A megvalósítás tanulságai (computed, feltételek, hetek) és a tesztek

## Claims

- [C1] [CONFIRMED] A ScheduleModifier csak hozzáadni tud vizitet, eltávolítani nem — nincs ilyen mező @L16 `adds: PlannedVisitDef[];`
- [C2] [CONFIRMED] A teszt nem a szabályt, hanem a következményét őrzi: minden alapvizit megmarad @L22 `nem. A teszt ezért nem is a szabályt őrzi, hanem a következményét: **minden`
- [C3] [CONFIRMED] Hiányzó rizikóadatnál a terv provisional, és felsorolja az eldönthetetlen módosítókat @L33 `// provisional: true`
- [C4] [CONFIRMED] A wouldAdd azt mutatja, hány vizitet adna hozzá az eldönthetetlen faktor — a bizonytalanságnak súlya van @L41 `azért van benne, mert **a bizonytalanságnak súlya van**`
- [C5] [CONFIRMED] Az alaptábla assumed hitelesítésű, ezért a terv nem állíthatja, hogy egy vizit elmaradt @L77 `plan.canAssertMissed`
- [C6] [CONFIRMED] Indoklás nélküli elutasítás esetén a konzílium-javallat nyitva marad @L111 `a javallat NYITVA marad, mert az elutasított és az elsikkadt javallat másképp`
- [C7] [CONFIRMED] A deliveryPlan ajánlása mindig null: a szülésmód kockázatcsere, az értékítélet a betegé @L117 `deliveryPlan(reg, state).recommendation   // null — MINDIG`
- [C8] [CONFIRMED] A betegpreferencia önálló mező, és nem szabad a szakmai javaslattal kitölteni @L159 `legfontosabb adat az egész tervben.** Ezért nem szabad a szakmai javaslattal`
- [C9] [CONFIRMED] A vizitrend nem lehet computed változó, mert a kalkulátor-réteg számot vesz és számot ad @L166 `megy: a kalkulátor-réteg **számot vesz és számot ad** (a 12. modul óta ez`
- [C10] [CONFIRMED] A módosító feltétele csak regiszterben létező változóra hivatkozhat, ezért a CORI (motor-kimenet) nem lehet kiváltó @L172 `kérne senior szülészt. A feltétel viszont csak **regiszterben létező`
- [C11] [CONFIRMED] Az ablakok betöltött hetekben értendők; ugyanez a hiba a szűrési motorban is jelen volt @L183 `volna múlttá a vizitet — és ugyanez a hiba **a szűrési motorban is ott volt**:`
- [C12] [CONFIRMED] A modult 32 teszt fedi a test/tervezes.test.ts fájlban @L189 `(../../test/tervezes.test.ts) — 32 teszt:`
