---
source: core/rx/registry.ts
sha256: 1d47663b72861125732074eb80a1af7d5ee2bca2960eca609f7510eb91132341
lines: 201
profile: code
generator: subagent
raw_tokens_est: 1978
verified: 8 confirmed
---

# core/rx/registry.ts

## Topics
- L1-58: A kapu három válasza, a feltételkiértékelő és az eredménytípusok
- L59-201: DrugRegistry — keresés, kapuk kiértékelése, összesítés, validáció, betöltés

## Claims

- [C1] [CONFIRMED] a kapu harmadik válasza az `ask`: a hiányzó adat nem viselkedhet „nem áll fenn"-ként @L42 `verdict: "clear" | "blocked" | "ask";`
- [C2] [CONFIRMED] a rendelés összesített megítélése négy fokozatú @L55 `outcome: "ok" | "warn" | "ask" | "stop";`
- [C3] [CONFIRMED] a keresés a szinonimákra is illeszt, és a szókezdő találat erősebb súlyt kap a részlettalálatnál @L81 `if (f.startsWith(q)) best = Math.max(best, 3);`
- [C4] [CONFIRMED] ha bármelyik feltétel bizonyítottan nem áll fenn, a kapu `clear`, és a hiányzó változók listája is kiürül @L125 `if (!allHold) { out.push({ ...base, verdict: "clear", missing: [] }); continue; }`
- [C5] [CONFIRMED] ha a többi feltétel teljesül, de valamelyikhez nincs adat, a verdikt `ask` — se engedés, se tiltás @L128 `out.push({ ...base, verdict: missing.length ? "ask" : "blocked" });`
- [C6] [CONFIRMED] az összesítés rangsora: abszolút blokk, majd kérdés, majd figyelmeztetés @L141 `blockedAbs ? "stop" : asked ? "ask" : warn ? "warn" : "ok";`
- [C7] [CONFIRMED] a kapu ismeretlen alternatívát ajánló hivatkozása hiba @L165 `if (!this.byId.has(a)) {`
- [C8] [CONFIRMED] a hiányzó ATC-kód csak figyelmeztetés, nem hiba @L177 `if (!d.atc) push("warning", d.id, "nincs ATC-kód — a 17. modul kódolása erre épül");`
