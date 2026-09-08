---
source: docs/fejlesztes/11-lefedettseg.md
sha256: a3e6410367ebce00f7208535f6a923782dfdbb06d2e52d5586c2dc11296c0720
lines: 143
profile: prose
generator: subagent
raw_tokens_est: 1770
verified: 12 confirmed
---

# docs/fejlesztes/11-lefedettseg.md

## Topics
- L1-70: Modulonkénti változó-lefedettség, minőségi jellemzők, panaszszótár számai
- L71-143: Referenciák, törzsek és kódtáblák számai, feltöltési sorrend, gaSource-hiány

## Claims

- [C1] [CONFIRMED] A fájl generált: a gen-coverage.ts állítja elő a registry/variables/ tartalmából, és a CI ellenőrzi @L4 `állítja elő, és a CI ellenőrzi.`
- [C2] [CONFIRMED] A katalógusban 872 változó van a tervezett ~4035-ből, ez 21.6% @L6 `**872 változó** a tervezett **~4035**-ból — **21.6%**.`
- [C3] [CONFIRMED] A tervezett darabszám a docs/modulok/ becslése, kifejezetten nagyságrend és nem előrejelzés @L8 `**nagyságrend, nem előrejelzés**`
- [C4] [CONFIRMED] A 19 CRM modulnak nulla változója van a tervezett 600-ból @L32 `| 19 | CRM | 0 | 600 | 0% |`
- [C5] [CONFIRMED] A 16 Betegelégedettség modul 58 változóval túllépi a tervezett 45-öt (129%) @L29 `| 16 | Betegelégedettség | 58 | 45 | 129% |`
- [C6] [CONFIRMED] A szabad szöveges változók aránya 5.3% (46 db), a kitűzött cél legfeljebb 10% @L50 `| 46 | 5.3% | ≤ 10% |`
- [C7] [CONFIRMED] A referenciatartományt, a normogramot és a szűrést egyaránt kapu védi, nem csak jelzés @L73 `és mindhármat **kapu**`
- [C8] [CONFIRMED] Mind a 32 referenciatartománnyal ellátott változó még FELTÉTELEZETT, egy sincs ellenőrizve @L81 `| Ebből még FELTÉTELEZETT (ellenőrizendő) | 32 |`
- [C9] [CONFIRMED] A 773 HBCS-csoportból 596 (77%) szabálya kiértékelhető géppel @L107 `| Ebből GÉPPEL KIÉRTÉKELHETŐ szabályú | 596 (77%) |`
- [C10] [CONFIRMED] A modulok feltöltési sorrendje a függőségekből adódik: 02 → 03 → 04 → 01 → 05 @L122 `A modulok függőségi sorrendje adja: **02 → 03 → 04 → 01 → 05 → …**`
- [C11] [CONFIRMED] A runCalc futtató ma minden bemenetet megkövetel, ezért a GA-precedencia külön kalkulátor-fajtát kíván @L137 `ma **minden** bemenetet megkövetel`
- [C12] [CONFIRMED] A gaSource ma csak megjelenik a terhesgondozási lapon, a gesztációs kor számítását nem vezérli @L142 `de a számítást nem`
