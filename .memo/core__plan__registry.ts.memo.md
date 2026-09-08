---
source: core/plan/registry.ts
sha256: 8a1ebf234cb0bb66aa4fc40ed073aa6e3235bd45f298307174a1c13dc8100c1c
lines: 41
profile: code
generator: subagent
raw_tokens_est: 405
verified: 4 confirmed, 1 needs_agent
---

# core/plan/registry.ts

## Topics
- L1-41: Gondozási protokollok és konzílium-szabályok betöltése JSON-fájlokból

## Claims

- [C1] [NEEDS_AGENT] ugyanazok a fájlok tartalmazhatják a protokollokat és a konzílium-szabályokat is, a szétválogatás alak szerint történik @semantic L21-40
- [C2] [CONFIRMED] könyvtár esetén csak a `.json` fájlokat olvassa, névsorba rendezve @L9 `readdirSync(dir).filter((f) => f.endsWith(".json")).sort()`
- [C3] [CONFIRMED] nem tömböt tartalmazó fájlnál kivételt dob @L24 `if (!Array.isArray(parsed)) throw new Error(`
- [C4] [CONFIRMED] protokollnak az a bejegyzés számít, amelyiknek `base` tömbje van @L26 `if (Array.isArray(x.base)) protocols.push(x as unknown as CareProtocol);`
- [C5] [CONFIRMED] konzílium-szabálynak az számít, amelyiknek `specialty` sztring mezője van @L37 `if (typeof x.specialty === "string") rules.push(x as unknown as ConsultRule);`
