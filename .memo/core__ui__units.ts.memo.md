---
source: core/ui/units.ts
sha256: afcd9631c0cd6675bda4dcd0b4474fc8f08f8e5c38904758ab4610ea05156658
lines: 82
profile: code
generator: subagent
raw_tokens_est: 729
verified: 4 confirmed, 2 needs_agent
---

# core/ui/units.ts

## Topics
- L1-82: UCUM-kódok emberi megjelenítési alakja magyarul és angolul

## Claims

- [C1] [NEEDS_AGENT] A réteg kizárólag megjelenítés, a tárolt érték UCUM marad @semantic L1-18
- [C2] [CONFIRMED] A magyar tábla a dimenzió nélküli `1` egységhez üres füzért rendel @L51 `  "1": "",`
- [C3] [CONFIRMED] Ismeretlen egységkódot változatlanul ad vissza, nem talál ki alakot @L68 `  return map[unit] ?? unit;`
- [C4] [CONFIRMED] Üres vagy hiányzó egységre üres füzért ad @L66 `  if (!unit) return "";`
- [C5] [NEEDS_AGENT] A `withUnit()` elhagyja a szóközt, ha nincs kiírandó egység @semantic L71-77
- [C6] [CONFIRMED] A `needsDisplayForm()` a szögletes/kapcsos zárójelet, csillagot és `/(` kezdetet ismeri gépi jelölésnek — ezt a build-teszt használja @L81 `  return /[[\]{}*]|\/\(/.test(unit);`
