---
source: core/szepszis/types.ts
sha256: 7a9655a0e4898a1400428a1898f1114148dee82f78fcaa6ff890d37ff1fefeb3
lines: 131
profile: code
generator: subagent
raw_tokens_est: 1188
verified: 10 confirmed, 2 needs_agent
---

# core/szepszis/types.ts

## Topics
- L1-73: a modul három megkülönböztető döntése, kritérium- és csomaglépés-típusok
- L74-131: a szepszisprotokoll típusa, a kritériumok megítélésének eredménytípusai

## Claims

- [C1] [NEEDS_AGENT] A SZÁMOT adó élettani szűrő a kalkulátor-rétegben él; ez a modul a folyamatot adja: háromlépéses felismerés és órához kötött csomag @semantic L4-8
- [C2] [NEEDS_AGENT] A modul nem fut ismeretlen terhességi állapotnál, mert egyik küszöbsávra sem esik vissza csendben @semantic L17-20
- [C3] [CONFIRMED] A kritériumnak hét összehasonlító művelete lehet, köztük a sávon kívüliség @L32 `export type CritOp = "gt" | "gte" | "lt" | "lte" | "eq" | "notEq" | "outside";`
- [C4] [CONFIRMED] A `suspendDuring` mező mondja meg, mely élettani állapot alatt nem értékelhető a tétel @L44 `suspendDuring?: "labour";`
- [C5] [CONFIRMED] A „tartósan” gépi alakja opcionális; üresen hagyva a kiértékelő egyetlen mérést néz @L51 `sustained?: { count?: number; withinMinutes?: number };`
- [C6] [CONFIRMED] A csomaglépés `before` mezője kötelező megelőzést ír elő a megnevezett lépéssel szemben @L68 `before?: string;`
- [C7] [CONFIRMED] A protokoll hitelesítettsége háromfokú, elsődlegestől a feltételezettig @L78 `verification: "primary" | "secondary" | "assumed";`
- [C8] [CONFIRMED] Amíg a `blocksAlerting` igaz, a modul egyetlen riasztást sem ad ki @L81 `blocksAlerting: boolean;`
- [C9] [CONFIRMED] A szülés utáni ablak napokban van megadva a protokollban @L84 `postpartumWindowDays: number;`
- [C10] [CONFIRMED] Az eszkaláció típusazonosítója az eszkalációs rend riasztástípusára mutat, és opcionális @L101 `tipus?: string;`
- [C11] [CONFIRMED] A kritérium megítélésében a nem értékelhető állapot nem azonos a negatívval @L108 `export type CritState = "positive" | "negative" | "missing" | "notAssessable";`
- [C12] [CONFIRMED] Az `indeterminate` azt jelöli, hogy a hiányzó tételek miatt a negatív eredmény sem mondható ki @L128 `indeterminate: boolean;`
