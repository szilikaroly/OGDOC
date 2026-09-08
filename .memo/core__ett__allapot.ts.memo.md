---
source: core/ett/allapot.ts
sha256: e56e06660244c736dff0f76cf01e4a7ece277ec4b07e5406b86280814d457fc1
lines: 81
profile: code
generator: subagent
raw_tokens_est: 1056
verified: 7 confirmed
---

# core/ett/allapot.ts

## Topics
- L1-34: miért egyetlen helyen áll össze az állapot, és a betöltők importjai
- L35-81: rendszerAllapot — regiszterek betöltése és a mérlegszámok összegzése

## Claims

- [C1] [CONFIRMED] az állapot szándékosan egyetlen helyen áll össze, hogy a kérelem ne egy harmadik, sehol nem létező állapotra íródjon @L6 `bizottság épp azt kapná, ami sehol nincs. Ez a fájl ezért az egyetlen hely,`
- [C2] [CONFIRMED] a dosszie.ts szándékosan nem tud a betöltésről, így szintetikus állapoton is végigvihető @L9 `szándékosan nem tud a betöltésről: azt szintetikus állapoton`
- [C3] [CONFIRMED] `rendszerAllapot` gyökere alapértelmezésben "." és minden regiszterútvonal ehhez képest áll össze @L35 `export function rendszerAllapot(gyoker = "."): Allapot {`
- [C4] [CONFIRMED] a döntésállapot a szülészeti ÉS nőgyógyászati felülettérkép auditált mezőiből együtt számol @L45 `dontesAllapot([uiMap, gynMap].flatMap((m) => auditFields(m, reg)), szabalyok,`
- [C5] [CONFIRMED] a mérőeszköz-licencek mérlege a mai dátumhoz méri a licencállapotot @L60 `new Date().toISOString().slice(0, 10));`
- [C6] [CONFIRMED] a normogramoknál csak a "hitelesitve" állapotúak számítanak aláírtnak @L70 `normogramAlairt: nga.filter((x) => x.allapot === "hitelesitve").length,`
- [C7] [CONFIRMED] a PHI-változók száma a `phi` jelzőt viselő regiszterelemek darabszáma @L78 `phiValtozo: reg.all().filter((v) => (v as { phi?: boolean }).phi).length,`
