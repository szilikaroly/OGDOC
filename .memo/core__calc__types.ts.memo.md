---
source: core/calc/types.ts
sha256: 315996a7934417eca7bf069616f6bdbc78ee1730fe990b7ec0120750d098cb8c
lines: 106
profile: code
generator: subagent
raw_tokens_est: 934
verified: 8 confirmed, 1 needs_agent
---

# core/calc/types.ts

## Topics
- L1-62: A réteg két betegbiztonsági szabálya, bemenet-, sáv-, fajta- és forrástípusok
- L63-106: A CalcDef teljes alakja: kimenet, forrás, kapu, számítófüggvény

## Claims

- [C1] [CONFIRMED] A `required: false` bemenet hiánya nem blokkol, a képlet kezeli @L28 `/** Ha false: hiánya nem blokkol, a képlet kezeli. */`
- [C2] [CONFIRMED] A sáv felső határa NEM tartozik bele az intervallumba @L37 `Felső határ, NEM beleértve.`
- [C3] [NEEDS_AGENT] Négy kalkulátorfajta van: zárt képlet, score, besorolás és célsáv @semantic L44-52
- [C4] [CONFIRMED] A forrás lehet szabvány vagy ajánlás is, nem csak közlemény @L60 `standard?: string | null;`
- [C5] [CONFIRMED] Az `isDate` jelzi, hogy a numerikus kimenet valójában epoch-ezredmásodperces dátum @L85 `isDate?: boolean;`
- [C6] [CONFIRMED] A `verified` csak akkor igaz, ha a konstansokat ténylegesen összevetették a forrással, és ezt a `verifiedNote` dokumentálja @L94 `verified: boolean;`
- [C7] [CONFIRMED] Az `fn` `null` visszatérése azt jelenti, hogy a bemenetek érvényesek, de az eredmény nem értelmezhető @L101 `= a bemenetek érvényesek, de az eredmény nem értelmezhető.`
- [C8] [CONFIRMED] Az `fn` csak számokat kap, az `inputs` sorrendjében, és hiányzó bemenetet nem lát @L103 `fn: (...args: number[]) => number | null;`
- [C9] [CONFIRMED] Az `interpret` a `classification` és `target` fajta szöveges eredményét adja @L105 `interpret?: (value: number, args: number[]) => I18n | null;`
