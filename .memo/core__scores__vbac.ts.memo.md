---
source: core/scores/vbac.ts
sha256: 2669a6e1ab1fa1b88f02dc9d451790fce45cab55e326850eeb1c1a89bf1a8d07
lines: 131
profile: code
generator: subagent
raw_tokens_est: 1480
verified: 11 confirmed, 1 needs_agent
---

# core/scores/vbac.ts

## Topics
- L1-37: miért szabályalapú és nem kalkulátor; a VbacFactor típus
- L38-65: a VbacAssessment eredménytípus és a három tényező táblája
- L66-131: az assessVbac értékelő függvény, ellenjavallat és a „nincs százalék” indoklás

## Claims

- [C1] [NEEDS_AGENT] A modul szándékosan nem ad százalékos esélyt, mert a 2021-es, etnikum nélküli Grobman-modell regressziós együtthatói nincsenek meg @semantic L14-22
- [C2] [CONFIRMED] A tényező jelenléte háromértékű: igaz, hamis vagy „unknown” @L32 `present: boolean | "unknown";`
- [C3] [CONFIRMED] A tényező hatásiránya szövegesen kódolt, mert nem számolnak vele @L34 `direction: "javítja" | "rontja";`
- [C4] [CONFIRMED] Az eredmény külön tartja a még meg nem kérdezett hiányt és a beteg rögzített „nem tudja” válaszát @L43 `nemTudja: string[];`
- [C5] [CONFIRMED] Az ellenjavallat nem esélybecslés, hanem külön logikai mező indoklással @L45 `contraindicated: { yes: boolean; why: string | null };`
- [C6] [CONFIRMED] A FACTORS három tényezőt sorol fel, ezek közül az ismétlődő javallat az egyetlen, amelyik rontja az esélyt @L60 `{ id: "recurringIndication", variable: "hx.repro.prevBirth.recurringIndication",`
- [C7] [CONFIRMED] Ha a `resolve` nem ad ok állapotot, a változó a `missing` listába kerül és a tényező „unknown” marad @L77 `missing.push(f.variable);`
- [C8] [CONFIRMED] A rögzített „nem tudom” külön listába megy, és nem alakul „nem”-mé @L84 `if (nemTudja(reg, f.variable, r.value)) {`
- [C9] [CONFIRMED] A jelenlét megállapítása típusfüggő: `quantity` mezőnél nullánál nagyobb szám, egyébként a `"pos"` érték @L91 `const present = def?.datatype === "quantity"`
- [C10] [CONFIRMED] Az ellenjavallatot három uterotomia-típus váltja ki, beégetett listából @L99 `const bad = ["classical", "inverted-T", "J"];`
- [C11] [CONFIRMED] Az ellenjavallatot az `op.cs.uterotomy` változó feloldott értéke dönti el @L98 `const uterotomy = resolve(reg, state, "op.cs.uterotomy");`
- [C12] [CONFIRMED] A forrás beégetett hivatkozás a Grobman 2021-es, etnikum nélküli kalkulátorra @L127 `"Grobman WA et al. Prediction of vaginal birth after cesarean delivery "`
