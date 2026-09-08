---
source: core/coding/sctid.ts
sha256: 7482ffa371569976959dfe70917b51cf94d35374650faf922443e11f9495c528
lines: 128
profile: code
generator: subagent
raw_tokens_est: 1242
verified: 10 confirmed
---

# core/coding/sctid.ts

## Topics
- L1-81: Szerkezeti és készletbeli ellenőrzés különbsége, Verhoeff-táblák, eredménytípus
- L82-128: Egy SNOMED-azonosító szerkezeti ellenőrzésének lépései

## Claims

- [C1] [CONFIRMED] A Verhoeff-ellenőrzés a jegyeket megfordítva dolgozza fel @L54 `const rev = [...digits].reverse();`
- [C2] [CONFIRMED] A permutációtábla nyolc soros, és a pozíció mod 8 szerint választ sort @L56 `c = D[c][P[i % 8][Number(rev[i])]];`
- [C3] [CONFIRMED] Az ellenőrzőjegy akkor helyes, ha a Verhoeff-összeg nulla @L58 `return c === 0;`
- [C4] [CONFIRMED] Bővítménynél a kiadói névtér hét jegyű @L70 `/** Bővítménynél a kiadó névtere (7 jegy). */`
- [C5] [CONFIRMED] Csak csupa számjegyből álló bemenet fogadható el @L87 `if (!/^[0-9]+$/.test(id)) return bad("A SNOMED-azonosító csak számjegyekből áll.");`
- [C6] [CONFIRMED] Az azonosító hossza 6 és 18 jegy közé kell essen @L88 `if (id.length < 6 || id.length > 18) {`
- [C7] [CONFIRMED] Vezető nulla esetén az azonosító érvénytelen @L93 `if (id[0] === "0") return bad("A SNOMED-azonosító nem kezdődhet nullával.");`
- [C8] [CONFIRMED] A partíciós jegypárt az utolsó előtti két jegy adja @L95 `const partition = id.slice(-3, -1);`
- [C9] [CONFIRMED] A partíció első jegyének 1 értéke jelöli a névtérrel kiadott bővítményt @L108 `const extension = partition[0] === "1";`
- [C10] [CONFIRMED] A névtér csak bővítménynél áll elő, a −10..−3 közötti szeletből @L115 `const namespace = extension ? id.slice(-10, -3) : null;`
