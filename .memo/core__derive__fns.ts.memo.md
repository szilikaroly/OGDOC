---
source: core/derive/fns.ts
sha256: ecd1701c6672bf15b1b3a974a5c153fa2b53a30ceca616f69117670cbf55c3f0
lines: 14
profile: code
generator: subagent
raw_tokens_est: 108
verified: 3 confirmed
---

# core/derive/fns.ts

## Topics
- L1-14: kerekítő segédfüggvény és durationMs re-export

## Claims

- [C1] [CONFIRMED] a fájl szándékosan NEM tartalmaz képletet, azok a kalkulátor-definíciókban élnek egyetlen példányban @L5 `kalkulátor-definíciókban él, egyetlen példányban.`
- [C2] [CONFIRMED] `round(x, digits)` Number.EPSILON-nal korrigálva kerekít a megadott tizedesjegyre @L11 `return Math.round((x + Number.EPSILON) * f) / f;`
- [C3] [CONFIRMED] a `durationMs`-t nem itt definiálja, hanem a resolve.ts-ből re-exportálja @L14 `export { durationMs } from "./resolve.ts";`
