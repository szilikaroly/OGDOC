---
source: core/import/flags.ts
sha256: 1e65a762abad722d42bc8c3edaf680666da616cf5e38566204a2c4bb7f25d10d
lines: 123
profile: code
generator: subagent
raw_tokens_est: 1176
verified: 7 confirmed, 1 needs_agent
---

# core/import/flags.ts

## Topics
- L1-47: vörös zászló háromállapotú modellje, FlagState és FlagTriage típusok
- L48-123: triageFlags kétszeres vizsgálata és a hipotetikus állapot előállítása

## Claims

- [C1] [CONFIRMED] a zászlóállapot négyértékű, a `pending` és az `undeterminable` külön érték, nem olvad a `clear`-be @L30 `export type FlagState = "raised" | "pending" | "undeterminable" | "clear";`
- [C2] [CONFIRMED] a `FlagTriage.awaiting` azokat a javaslat-azonosítókat sorolja, amelyek jóváhagyása eldöntené a zászlót @L38 `  awaiting: string[];`
- [C3] [CONFIRMED] a `triageFlags` a `Registry`, `ComplaintDict`, `CaseState` és `ProposalStore` négyesből `FlagTriage[]`-t ad vissza @L48 `export function triageFlags(`
- [C4] [NEEDS_AGENT] a besorolás a megerősített és a hipotetikus állapoton futtatott két külön `redflagState` hívás különbségéből áll elő @semantic L54-76
- [C5] [CONFIRMED] a `pending` zászlóhoz tartozó javaslatokat a `why` szövegek prefix-egyezésével válogatja ki, nem szerkezeti hivatkozással @L69 `        .filter((p) => ifAccepted.why.some((w) => w.startsWith(p.variable)))`
- [C6] [CONFIRMED] a zászló csak akkor lesz `undeterminable`, ha a megerősített adaton a vizsgálat `"unknown"`-t adott @L77 `    if (now.flag === "unknown") {`
- [C7] [CONFIRMED] az `applyPending` a nem írható vagy ismeretlen mezőre adott javaslatot néma `catch`-csel kihagyja a hipotetikus futásból @L103 `    } catch {`
- [C8] [CONFIRMED] a hipotetikus írás eredete szándékosan a legalacsonyabb precedenciájú, és beégetett `"import:hipotetikus"` sourceRef-fel megy @L119 `    provenance: "patient", confidence: "uncertain",`
