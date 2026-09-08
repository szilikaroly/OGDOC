---
source: docs/fejlesztes/49-megorzes.md
sha256: 3c7a541aaf6f8f50f79e008e238d8b8dec5d8d133cfe7530f565b94a713d5f33
lines: 144
profile: prose
generator: subagent
raw_tokens_est: 1578
verified: 6 confirmed
---

# docs/fejlesztes/49-megorzes.md

## Topics
- L1-144: miért a legsúlyosabb hitelesítési réteg, a soha ki nem számolt megőrzési idő, a horgonyeltérés, a lenyomat, a próbafuttatás, nyitott munka

## Claims

- [C1] [CONFIRMED] A `period` sehol a kódban nem lett dátummá: a `deletable()` a nyers karakterláncot adta vissza @L27 `sehol a kódban nem lett dátummá**`
- [C2] [CONFIRMED] A törlési motor a begépelt lejáraton csak azt ellenőrizte, hogy a múltban van-e @L36 `egyetlen dolgot ellenőrzött rajta — hogy a **múltban** van-e.`
- [C3] [CONFIRMED] A jogszabályi idézet 13 tételnél más horgonyt nevez meg, ezért a rendszer ma hosszabb ideig őriz, mint a törvény kívánja @L65 `**hosszabb ideig őriz, mint amennyit a törvény kíván**`
- [C4] [CONFIRMED] Az aláírásnak meg kell neveznie a jogszabály hatályosságának napját, e nélkül építési hiba @L91 `**építési hiba**.`
- [C5] [CONFIRMED] A `terv()` soha nem töröl: nincs olyan ága, ami írna @L100 `**soha nem töröl, és nem is tud**`
- [C6] [CONFIRMED] A 14 megőrzési időből egy sincs aláírva, mert az elsődleges jogszabályszöveg nem beszerezhető @L119 `**A 14 megőrzési időből 0 aláírva.**`
