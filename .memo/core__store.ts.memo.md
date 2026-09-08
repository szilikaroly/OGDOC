---
source: core/store.ts
sha256: a8ccfb61ccc8a28173d703fd9f279c3bff7557d04caee3a04b79ac374483fc36
lines: 84
profile: code
generator: subagent
raw_tokens_est: 821
verified: 5 confirmed, 1 needs_agent
---

# core/store.ts

## Topics
- L1-84: a Store felület, verziózott sorosítás, memóriabeli tároló, értékszámláló

## Claims

- [C1] [CONFIRMED] A tárolóréteg mindössze két műveletet ad, lekérdezés nincs benne @L22 `load(caseId: string): Promise<CaseState | null>;`
- [C2] [NEEDS_AGENT] A réteg tudatosan nem tartalmaz titkosítást, jogosultságkezelést és auditnaplót — ezek az implementáció feladatai éles adat mellett @semantic L14-17
- [C3] [CONFIRMED] A mentés verziózott burkolóba kerül, mentési időbélyeggel @L38 `const out: Serialized = { formatVersion: 1, savedAt: now, state };`
- [C4] [CONFIRMED] Ismeretlen formátumverziójú mentésnél a betöltés kivételt dob, nem próbál találgatni @L44 `if (parsed.formatVersion !== 1) {`
- [C5] [CONFIRMED] Betöltéskor a hiányzó `errors` mező üres tömbre egészül ki @L61 `return { ...st, errors: st.errors ?? [] } as CaseState;`
- [C6] [CONFIRMED] A MemoryStore a sorosított sztringet tartja memóriában, és kifejezetten nem éles adatra való @L66 `private data = new Map<string, string>();`
