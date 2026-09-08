---
source: core/prom/sets.ts
sha256: 739de3d85d303737b32e9e9e2be5db9ee66822748ce800a8b20c0dd32f7a132a
lines: 199
profile: code
generator: subagent
raw_tokens_est: 1852
verified: 8 confirmed, 1 needs_agent
---

# core/prom/sets.ts

## Topics
- L1-70: A PROM-készletek célja, a licenc-kapu és a készültségi szintek típusai
- L71-199: PromSets — mérési pontonkénti állapot, eredet-validáció, betöltés

## Claims

- [C1] [NEEDS_AGENT] az EPDS nem külön kitöltés: a `prom.mh.epds.total` aliasOf-fal a `psy.epds.total`-ra mutat, és ezt a regiszter oldja meg, nem ez a réteg @semantic L4-14
- [C2] [CONFIRMED] a hiányzó tételszöveg-licenc külön készültségi szint: az eszköz nem vehető fel @L44 `| "blocked"`
- [C3] [CONFIRMED] a nem validált magyar fordítás is külön szint: felvehető, de a publikálhatóság korlátozott @L46 `| "unvalidatedTranslation";`
- [C4] [CONFIRMED] ismeretlen mérési pontra a `state` kivételt dob, nem üres eredményt ad @L90 `if (!set) throw new Error(`
- [C5] [CONFIRMED] a készletben szereplő, de a mérőeszköz-regiszterben ismeretlen eszközt csendben kihagyja @L95 `if (!def) continue;`
- [C6] [CONFIRMED] a nem beadható eszköz `blocked` státuszt kap és nem publikálható @L101 `instrument: id, abbrev: def.abbrev, readiness: "blocked",`
- [C7] [CONFIRMED] a készlet csak akkor teljes, ha nincs kitöltetlen eszköz ÉS legalább egy eszköz nincs licenc-kapu mögött @L135 `complete: pending === 0 && instruments.length > blocked,`
- [C8] [CONFIRMED] a szűkített (`scopedBy`) mezők és a névsorok kivételek az eredet-kapu alól @L169 `if (d.scopedBy || rosters.has(d.id)) continue;`
- [C9] [CONFIRMED] hiba minden olyan prom-mező, amelynek engedélyezett eredete nem kizárólag `patient` @L171 `if (!allowed.includes("patient") || allowed.includes("clinician")) {`
