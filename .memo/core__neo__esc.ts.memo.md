---
source: core/neo/esc.ts
sha256: 995ebac498758b99fc10d45ef6107baddc1d4be92276830f383487d95f83ca1c
lines: 211
profile: code
generator: subagent
raw_tokens_est: 2153
verified: 15 confirmed
---

# core/neo/esc.ts

## Topics
- L1-68: NOWS-modul indoklása, ESC/Finnegan típusok, forrásidézetek, tri() helper
- L69-109: assessEsc — a három funkcionális kérdés és az ajánlás szövege
- L110-164: assessFinnegan küszöblogika és a szerenkénti megfigyelési idő tábla
- L165-211: observationWindow — elbocsáthatóság a születés óta eltelt idő alapján

## Claims

- [C1] [CONFIRMED] a `tri` helper minden nem `ok` állapotú feloldást `"unknown"`-ra képez, nem hiányra @L65 `if (r.state !== "ok") return "unknown";`
- [C2] [CONFIRMED] a `tri` csak a `pos`/`neg` értéket fordítja yes/no-ra, minden más érték unknown lesz @L66 `return r.value === "pos" ? "yes" : r.value === "neg" ? "no" : "unknown";`
- [C3] [CONFIRMED] az `assessEsc` a három ESC-kérdést a `neo.nows.esc.*` regisztermezőkből oldja fel @L70 `const feeding = tri(reg, state, "neo.nows.esc.feeding");`
- [C4] [CONFIRMED] egyetlen ismeretlen válasz is `undetermined` állapotot okoz @L74 `const undetermined = answers.includes("unknown");`
- [C5] [CONFIRMED] az `allFunctional` csak akkor igaz, ha mind a három válasz `"yes"` @L75 `const allFunctional = answers.every((a) => a === "yes");`
- [C6] [CONFIRMED] az ajánlásban az `undetermined` ág megelőzi az `allFunctional` ágat, tehát a hiányzó adat nem minősül megfelelő funkciónak @L87 `recommendation: undetermined`
- [C7] [CONFIRMED] az `assessFinnegan` a pontszámokat időbélyeg szerint rendezi, és a nem véges értékeket kidobja @L116 `.filter((n) => Number.isFinite(n));`
- [C8] [CONFIRMED] kettőnél kevesebb mérésnél a küszöb `insufficient`, ami kifejezetten nem azonos a „nem teljesül"-lel @L121 `if (scores.length < 2) {`
- [C9] [CONFIRMED] a küszöb első ága három EGYMÁST KÖVETŐ ≥ 8 pontos mérés @L127 `if (scores[i] >= 8 && scores[i + 1] >= 8 && scores[i + 2] >= 8) {`
- [C10] [CONFIRMED] a küszöb második ága két egymást követő mérés ≥ 11 átlaga @L132 `if ((scores[i] + scores[i + 1]) / 2 >= 11) {`
- [C11] [CONFIRMED] a metadon megfigyelési ideje beégetetten 168 óra (7 nap) @L152 `hours: 168, label: "metadon",`
- [C12] [CONFIRMED] ismeretlen expozíciónál a `canDischarge` hamis, és a megfigyelési idő nem állapítható meg @L171 `substance: null, minHours: null, elapsed: null, canDischarge: false,`
- [C13] [CONFIRMED] ismeretlen szerkulcs esetén az `other` bejegyzés (168 óra) a tartalék @L180 `const spec = ONSET[String(sub.value)] ?? ONSET.other;`
- [C14] [CONFIRMED] az eltelt órák a `state.ctx.now` és a születési idő különbségéből, lefelé kerekítve adódnak @L194 `hoursSoFar = Math.floor((now - t) / 3_600_000);`
- [C15] [CONFIRMED] a `canDischarge` csak szigorúan `true` elapsed mellett igaz, az ismeretlen (`null`) állapot nem enged elbocsátást @L201 `canDischarge: elapsed === true,`
