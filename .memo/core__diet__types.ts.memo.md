---
source: core/diet/types.ts
sha256: 07d5426a8f06c32c57bfc310ce5e170f2f44dded427b93bd36b82a4642ab2119
lines: 47
profile: code
generator: subagent
raw_tokens_est: 473
verified: 5 confirmed
---

# core/diet/types.ts

## Topics
- L1-47: diétás protokoll típusai — célérték, kerülendők, tanács, konzílium

## Claims

- [C1] [CONFIRMED] eldöntött döntés: a rendszer NEM ad konkrét étrendet, csak célértéket, kerülendőket és javallatot @L11 `a rendszer NEM ad konkrét étrendet`
- [C2] [CONFIRMED] a protokoll `appliesWhen` feltételei EGYÜTT teljesülve aktiválnak, üres lista = mindig @L31 `A feltételek EGYÜTTES teljesülése aktiválja. Üres = mindig.`
- [C3] [CONFIRMED] a supplements-ből összeállított pótlási listát a rendelések ellen átfedésre ellenőrzik @L35 `modul rendelései ellen ellenőrzi`
- [C4] [CONFIRMED] az `avoid` minden eleménél a `why` indoklás kötelező mező, nem opcionális @L41 `avoid?: Array<{ what: I18n; why: I18n }>;`
- [C5] [CONFIRMED] a konzíliumi javallat sürgőssége routine, soon vagy urgent lehet @L44 `urgency?: "routine" | "soon" | "urgent"`
