---
source: core/derive/resolve.ts
sha256: 6fefa28f408e7c1c161debb51cdf1cf2aeca0f53e29599c2eadf799278db4635
lines: 163
profile: code
generator: subagent
raw_tokens_est: 1694
verified: 9 confirmed
---

# core/derive/resolve.ts

## Topics
- L1-45: Resolved eredménytípus és ISO időtartam-parszolás
- L46-163: resolve/usable/scopesOf/rosterOf/nemTudja értékfeloldó függvények

## Claims

- [C1] [CONFIRMED] a feloldás állapota háromértékű: ok, missing vagy stale @L15 `state: "ok" | "missing" | "stale";`
- [C2] [CONFIRMED] `durationMs` csak a P#D / PT#H / PT#M alakot ismeri fel, egyébként null @L36 `const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(iso);`
- [C3] [CONFIRMED] `durationMs` a napot, órát és percet ezredmásodpercre váltja @L38 `return (+(m[1] ?? 0)) * 86_400_000 + (+(m[2] ?? 0)) * 3_600_000 + (+(m[3] ?? 0)) * 60_000;`
- [C4] [CONFIRMED] `resolve` először a mirror aliast oldja fel a primary azonosítóra @L49 `const primary = reg.resolvePrimary(id);`
- [C5] [CONFIRMED] KAPU: példányosított (scopedBy) mező scope nélkül mindig hiányzó, mert a szűrő megköveteli a nem-null scope-ot @L59 `all.filter((v) => (v.scope ?? null) === want && want !== null)`
- [C6] [CONFIRMED] a legjobb érték kiválasztása megfordított listán rendez, hogy azonos rang és idő esetén a KÉSŐBB rögzített nyerjen @L71 `const best = [...vals].reverse().sort((a, b) => {`
- [C7] [CONFIRMED] ha az érték kora meghaladja az encounterhez tartozó érvényességi ablakot, az állapot stale lesz @L99 `if (ms != null && Number.isFinite(age) && age > ms) {`
- [C8] [CONFIRMED] `usable` a lejárt (stale) értéket is null-ként adja vissza, nem csak a hiányzót @L112 `return r.state === "ok" ? r.value : null;`
- [C9] [CONFIRMED] `nemTudja` a kódlista opciójának flags mezőjében keresi az "unknown" jelölést @L162 `return !!opt?.flags?.includes("unknown");`
