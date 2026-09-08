---
source: core/coding/validity.ts
sha256: c13dafb5f1f968c0c4f1f5415605eb039cdcb657cd05da6a0b9f9a9d874d9166
lines: 168
profile: code
generator: subagent
raw_tokens_est: 1621
verified: 9 confirmed
---

# core/coding/validity.ts

## Topics
- L1-72: A három megszorítás (nem, életkor, dátum), státuszok és segédtáblák
- L73-168: Egy kód érvényességének eldöntése a törzs sorából, jelentést gátló státuszok

## Claims

- [C1] [CONFIRMED] Hét érvényességi státusz van, és az `undetermined` külön áll a megfeleléstől @L35 `| "undetermined";`
- [C2] [CONFIRMED] Az `isoDate` csak a nyolc számjegyből álló alakot alakítja át, minden mást üres szöveggé @L59 `return /^\d{8}$/.test(raw) ?`
- [C3] [CONFIRMED] A törzs `nem` oszlopában az 1 férfit, a 2 nőt jelöl, a 0 mindkettőt @L63 `const SEX_OF: Record<string, "female" | "male"> = { "1": "male", "2": "female" };`
- [C4] [CONFIRMED] Betöltetlen törzsnél `unknown` a válasz, kimondva, hogy ez nem jelent érvényességet @L80 `if (!t) {`
- [C5] [CONFIRMED] Nemhez kötött kódnál a rögzítetlen betegnem `undetermined`-et ad, nem megfelelést @L105 `if (ctx.sex == null) {`
- [C6] [CONFIRMED] Az életkori kapu csak akkor él, ha a törzs ténylegesen szűkít — a 0–99 tartomány nem szűkítés @L120 `const bounded = Number.isFinite(lo) && Number.isFinite(hi) && !(lo === 0 && hi >= 99);`
- [C7] [CONFIRMED] A 2999-01-01 vagy későbbi érvényességi vég nyitottnak számít @L137 `const open = !until || until >= "2999-01-01";`
- [C8] [CONFIRMED] Időhöz kötött kódnál az ellátási nap hiánya `undetermined`; a mai nap nem helyettesíti @L139 `if (!ctx.on) {`
- [C9] [CONFIRMED] Négy státusz gátolja a jelentést; az `unknown` és az `undetermined` nincs köztük @L167 `return s === "wrongSex" || s === "outOfAgeRange" || s === "notYetValid" || s === "expired";`
