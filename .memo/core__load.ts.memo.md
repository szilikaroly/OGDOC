---
source: core/load.ts
sha256: bdbf9fc45d6bcb3a39cd730807f9a7544c5590d30387ca78f0e19a1523e7857f
lines: 30
profile: code
generator: subagent
raw_tokens_est: 337
verified: 4 confirmed, 1 needs_agent
---

# core/load.ts

## Topics
- L1-30: a regiszter betöltése fájlokból és könyvtárakból, determinisztikus sorrendben

## Claims

- [C1] [CONFIRMED] ez az egyetlen hely a magban, ahol I/O történik @L1 `/** Regiszter betöltése fájlból vagy könyvtárból. Az egyetlen hely, ahol I/O történik. */`
- [C2] [CONFIRMED] a könyvtárból csak a `.json` fájlokat veszi, névsorba rendezve — a betöltés determinisztikus @L9 `  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()`
- [C3] [CONFIRMED] a `loadRegistry` tetszőleges számú fájl- és könyvtárútvonalat fogad, és mindet egyetlen regiszterbe olvassa @L23 `  const files = paths.flatMap((p) => statSync(p).isDirectory() ? filesIn(p) : [p]);`
- [C4] [NEEDS_AGENT] a nem tömb tartalmú regiszterfájl kivételt vált ki, nem csendes kihagyást @semantic L24-28
- [C5] [CONFIRMED] a duplikált azonosító elleni védelmet nem ez a függvény, hanem a `Registry` konstruktora adja @L29 `  return new Registry(defs);`
