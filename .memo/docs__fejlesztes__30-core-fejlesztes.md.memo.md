---
source: docs/fejlesztes/30-core-fejlesztes.md
sha256: 960715eabe43bd0fe9b31669b2d9286cd02a985a3250679ebe747f944880c7f4
lines: 407
profile: prose
generator: subagent
raw_tokens_est: 4664
verified: 18 confirmed
---

# docs/fejlesztes/30-core-fejlesztes.md

## Topics
- L1-149: A mag szerkezeti szabályai, mérete, függőségmentessége, célok, naplózási szerződés
- L150-290: Szivárgás elleni megnevezés, minőségi mérőszámok, validátor, sebességküszöbök
- L291-407: A recompute mérése és triggere, az élő mentés négy szintje és szabályai

## Claims

- [C1] [CONFIRMED] A core egyetlen console-hívást sem tartalmaz, és ezt teszt őrzi @L34 `hívást sem tartalmaz** — és ezt teszt őrzi, nem szokás.`
- [C2] [CONFIRMED] A mag 75 fájl, 15 367 sor @L38 `75 fájl, **15 367 sor**. A legnagyobb egységek:`
- [C3] [CONFIRMED] Nulla futásidejű függőség: nincs dependencies, nincs build-lépés, nincs bundler @L54 `**Nulla futásidejű függőség.** Nincs `
- [C4] [CONFIRMED] A négy készültségi állítás közül a negyedik ma nem igaz: a rendszer valódi betegadaton nem futhat @L79 `4. **A rendszer valódi betegadaton futhat.** *(Ma NEM igaz — ez a`
- [C5] [CONFIRMED] Ha az auditnapló nem tud írni, a művelet elbukik — szemben a működési naplóval @L111 `| Ha nem tud írni | a művelet megy tovább | **a művelet elbukik** |`
- [C6] [CONFIRMED] A szivárgásvédelem nem javítja csendben a naplósort, hanem megnevezi a szivárgást @L163 `**És nem javít, hanem megnevez.** A csendben megtisztított napló arról hazudik,`
- [C7] [CONFIRMED] Heurisztika: a 200 karakternél hosszabb szabad szöveg magától gyanús @L159 `Plusz egy heurisztika: **200 karakternél hosszabb szabad szöveg magától`
- [C8] [CONFIRMED] A naplóba számok, azonosítók és időtartamok kerülnek, értékek soha @L176 `Számok, azonosítók, időtartamok. **Értékek soha.**`
- [C9] [CONFIRMED] A rendszert 710 teszt fedi, 0 hibával @L186 `**710 teszt, 0 hiba.** De a lefedettségi százalék félrevezető`
- [C10] [CONFIRMED] A 88 szándékos figyelmeztetés kimondott ismert hiány, nem technikai adósság @L197 `| **szándékos figyelmeztetés** | 88 | ennyi ismert hiány van KIMONDVA, nem elrejtve |`
- [C11] [CONFIRMED] A magyar idézőjel nem stílus: a strip-only mód a rossz záró jelen szintaktikai hibát dob @L244 `— a TypeScript strip-only módja az utóbbin szintaktikai hibát dob.`
- [C12] [CONFIRMED] Egy érték írása a függők újraszámításával 0,001 ms medián — ez fut billentyűleütésenként @L280 `| **0,001 ms** | **ez fut billentyűleütésenként** |`
- [C13] [CONFIRMED] A recompute költsége nem az adattól függ: üres eseten 9,76 ms, 174 értékkel 9,49 ms @L295 `> **Üres eseten 9,76 ms. 174 rögzített értékkel 9,49 ms.**`
- [C14] [CONFIRMED] A költség a topologikus rendezésé (9,38 ms), ami minden hívásnál újrafut @L299 `viszont **9,38 ms** — és mindkettő **minden hívásnál`
- [C15] [CONFIRMED] A gyorsítótárazás triggere előre kimondott: 16 ms fölé menő recompute, vagy interaktív útra kerülés @L310 ` sora **16 ms fölé** megy, **vagy**`
- [C16] [CONFIRMED] A napló magja kész és tesztelt (26 teszt), a tartós írás és a titkosítás a gazdáé @L332 `> **A napló magja kész és tesztelt** (`
- [C17] [CONFIRMED] A CaseState értéktárolója hozzáfűző napló, nem felülíró mező @L339 `**hozzáfűző napló**, nem felülíró mező:`
- [C18] [CONFIRMED] A megőrzési idők átállításáig a rendszer egyébként sem töröl @L383 `átállításáig (10. lépés) **egyébként sem törlünk**.`
