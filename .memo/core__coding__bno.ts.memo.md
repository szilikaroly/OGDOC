---
source: core/coding/bno.ts
sha256: 5f23526884dbfc5fbe015405041cb162a16caec187d98449171a77dae4d3bb13
lines: 98
profile: code
generator: subagent
raw_tokens_est: 947
verified: 7 confirmed, 1 needs_agent
---

# core/coding/bno.ts

## Topics
- L1-55: A BNO jelentési és rövidített alak különbsége, státuszok, eredménytípus
- L56-98: A kódalak feloldása a betöltött törzsből, egyértelműség vizsgálata

## Claims

- [C1] [CONFIRMED] A hazai jelentési alak mintája egy betű és négy karakter @L48 `const REPORTING = /^[A-Z][0-9A-Z]{4}$/;`
- [C2] [NEEDS_AGENT] Öt kimeneti státusz van: jelentési alak, feloldott, többértelmű, ismeretlen és „nincs törzs” @semantic L24-34
- [C3] [CONFIRMED] Több lehetőség esetén az összes jelölt kód megnevezéssel együtt visszakerül @L43 `candidates: Array<{ code: string; label: string }>;`
- [C4] [CONFIRMED] A bemenetet trimeli, nagybetűsíti, és a pontokat eltávolítja belőle @L57 `const input = String(raw ?? "").trim().toUpperCase().replace(/\./g, "");`
- [C5] [CONFIRMED] A feloldás a `tbl.bno` táblából olvas @L58 `const t = getTable("tbl.bno");`
- [C6] [CONFIRMED] A törzs hiánya nem hiba, hanem `noTable` státusz @L60 `if (!t) {`
- [C7] [CONFIRMED] A jelöltek az ötkarakteres, az inputtal kezdődő kulcsok, rendezve @L74 `.filter((k) => k.length === 5 && k.startsWith(input))`
- [C8] [CONFIRMED] Egynél több jelölt esetén a rendszer nem választ, hanem `ambiguous` státuszt ad @L85 `if (cands.length > 1) {`
