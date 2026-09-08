---
source: core/scores/fullpiers.ts
sha256: e3d8807e1e03d7f4e29d086003581b3eab985d0f843983c9f059be7d94785297
lines: 124
profile: code
generator: subagent
raw_tokens_est: 1223
verified: 7 confirmed, 1 needs_agent
---

# core/scores/fullpiers.ts

## Topics
- L1-47: A modell forrása, az együttható-kapu indoklása és a bemenetek listája
- L48-124: fullPiers — bemenetellenőrzés, logit, a kapu és az értelmezési sávok

## Claims

- [C1] [CONFIRMED] KAPU: az együtthatók nincsenek visszaellenőrizve a publikációval, ezért a kapcsoló hamis @L37 `export const COEFFICIENTS_VERIFIED = false;`
- [C2] [NEEDS_AGENT] hat bemenetet vár: gesztációs kor, mellkasi fájdalom/dyspnoe, SpO2, thrombocyta, kreatinin, AST @semantic L39-46
- [C3] [CONFIRMED] a logikai bemenetet 1/0-ra fordítja, a többit számmá alakítja @L60 `got[key] = typeof r.value === "boolean" ? (r.value ? 1 : 0) : Number(r.value);`
- [C4] [CONFIRMED] hiányzó bemenetnél nem számol, és a lejárt (stale) értékeket külön megnevezi az indoklásban @L64 `const stale = missing.filter((id) => (inputs[id] as any)?.state === "stale");`
- [C5] [CONFIRMED] nem pozitív thrombocyta- vagy AST-értéknél nem számol, mert a logaritmus nem értelmezett @L76 `if (plt <= 0 || ast <= 0) {`
- [C6] [CONFIRMED] a kapu a logit és a valószínűség kiszámítása UTÁN zár, a számot csak `_debug` alatt adja vissza @L105 `inputs: { ...inputs, _debug: { logit, p } },`
- [C7] [CONFIRMED] engedélyezett együtthatók mellett az érték százalék, egy tizedesre kerekítve @L111 `value: round(p * 100, 1),`
- [C8] [CONFIRMED] az értelmezési sávok határa 30, 10, 5 és 2,5 százalék @L119 `if (p >= 0.3) return "Nagyon magas kockázat — azonnali multidiszciplináris ellátás";`
