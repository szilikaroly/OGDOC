---
source: core/lab/reference.ts
sha256: dd89893038fb1739c4352a013933b0fb569f04ee1e618ddaa310e4587bfbe8c8
lines: 188
profile: code
generator: subagent
raw_tokens_est: 1620
verified: 14 confirmed
---

# core/lab/reference.ts

## Topics
- L1-76: a két kiválasztási szabály, trimeszterhatárok, eredménytípusok, contextOf
- L77-145: referenceFor — a kontextushoz tartozó tartomány vagy a jelöltek listája
- L146-188: interpret — a lelet olvasata és a trimeszterek közti egyetértés

## Claims

- [C1] [CONFIRMED] három terhességi referencia-kontextus van megnevezve @L23 `export const PREGNANCY_CONTEXTS = ["pregnancy.t1", "pregnancy.t2", "pregnancy.t3"];`
- [C2] [CONFIRMED] a trimeszterhatárok beégetettek: 14. hét alatt I., 28. hét alatt II., felette III. @L27 `  if (gaWeeks < 14) return "pregnancy.t1";`
- [C3] [CONFIRMED] a `RefResult` három ágú: ok, ambiguous, unavailable @L56 `export type RefResult = RefOk | RefAmbiguous | RefUnavailable;`
- [C4] [CONFIRMED] ismeretlen vagy `"unk"` terhességi állapotnál nincs tartományválasztás — a nem terhes tartomány NEM alapértelmezés @L61 `  if (preg.state !== "ok" || preg.value === "unk") {`
- [C5] [CONFIRMED] a `"pos"`-tól eltérő terhességi érték `nonpregnant` kontextust ad @L70 `  if (preg.value !== "pos") return "nonpregnant";`
- [C6] [CONFIRMED] terhesség mellett hiányzó vagy nem szám gesztációs kor `pregnancy.unknown` kontextust ad @L73 `  if (ga.state !== "ok" || typeof ga.value !== "number") return "pregnancy.unknown";`
- [C7] [CONFIRMED] a referencia az alias-feloldott elsődleges változó definíciójából jön @L78 `  const def = reg.get(reg.resolvePrimary(id));`
- [C8] [CONFIRMED] ismeretlen trimeszternél a jelöltek a három terhességi kontextus tartományai @L91 `    const candidates = set.ranges.filter((r) => PREGNANCY_CONTEXTS.includes(r.context));`
- [C9] [CONFIRMED] az `ambiguous` eredmény a `ctx.ga`-t nevezi meg hiányzóként, és viszi a forrást és a hitelesítést @L99 `      status: "ambiguous", candidates, missing: ["ctx.ga"],`
- [C10] [CONFIRMED] a kontextushoz nem definiált tartomány `unavailable`, nem visszaesés más kontextusra @L106 `  if (!range) {`
- [C11] [CONFIRMED] az olvasat alsó és felső határt is nyitottnak vesz, ha az adott határ `null` @L119 `  if (r.low != null && value < r.low) return "low";`
- [C12] [CONFIRMED] nem szám vagy lejárt érték esetén az értelmezés `unknown`, a lejáratot külön indoklás jelzi @L150 `  if (v.state !== "ok" || typeof v.value !== "number") {`
- [C13] [CONFIRMED] ha minden szóba jövő trimeszter ugyanazt az olvasatot adja, az eredmény `ok` lesz `agreedAcrossTrimesters: true` jelöléssel @L167 `    if (readings.size === 1) {`
- [C14] [CONFIRMED] eltérő trimeszter-olvasatoknál nem értelmez, és felsorolja az eltérő olvasatokat @L175 `    return {`
