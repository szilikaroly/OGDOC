---
source: core/scores/vte.ts
sha256: 34e8af23fceff75e13a55de845d79499fca4559dd82d45e122edede3fdd7e156
lines: 137
profile: code
generator: subagent
raw_tokens_est: 1466
verified: 12 confirmed, 1 needs_agent
---

# core/scores/vte.ts

## Topics
- L1-36: modul-indoklás a hiányzó összpontszámról, a VteFactor típus
- L37-71: a VteAssessment eredménytípus és a hat bekötött tényező táblája
- L72-137: az assessVte értékelő, BMI/életkor külön ága, indoklás és forrás

## Claims

- [C1] [NEEDS_AGENT] Az összpontszám hiánya itt NYITOTT FELADAT (hiányos tábla), nem elvi tiltás, szemben a postpartum pszichózissal @semantic L4-15
- [C2] [CONFIRMED] A tényező jelenléte háromértékű, a hiányzó adat nem „nincs kockázat” @L31 `present: boolean | "unknown";`
- [C3] [CONFIRMED] A közölt pontsúly szövegként, emberi olvasatra tárolódik, és a kód nem számol vele @L32 `Nem számolunk vele.`
- [C4] [CONFIRMED] Az eredmény külön tartja a még meg nem kérdezett hiányt és a beteg „nem tudja” válaszát @L46 `nemTudja: string[];`
- [C5] [CONFIRMED] A FACTORS tábla hat tényezőt köt be, mindegyikhez változó, közölt súly és pozitivitási érték tartozik @L57 `const FACTORS: Array<Omit<VteFactor, "present" | "label"> & { label: string }> = [`
- [C6] [CONFIRMED] A dohányzás pozitivitási értéke `current`, nem a máshol használt `pos` @L65 `publishedWeight: "1 pont", positiveWhen: "current" },`
- [C7] [CONFIRMED] Az ikerterhesség csak `dcda` értéknél számít fennállónak @L69 `publishedWeight: "1 pont", positiveWhen: "dcda" },`
- [C8] [CONFIRMED] A tényező jelenlétét a feloldott érték és a `positiveWhen` szigorú egyenlősége dönti el @L85 `} else present = r.value === f.positiveWhen;`
- [C9] [CONFIRMED] A testtömegindex külön ágon fut, és csak 30 felett kerül be tényezőként @L93 `if (v >= 30) {`
- [C10] [CONFIRMED] A BMI közölt súlya 40 felett 2 pont, egyébként 1 pont @L98 `publishedWeight: v >= 40 ? "2 pont" : "1 pont",`
- [C11] [CONFIRMED] Hiányzó testtömegindex a `missing` listába kerül @L102 `} else missing.push("anthro.bmi");`
- [C12] [CONFIRMED] Az életkor csak 35 év felett ad hozzá tényezőt @L106 `if (Number(age.value) > 35) {`
- [C13] [CONFIRMED] A forrás beégetve az RCOG Green-top Guideline No. 37a (2015) @L134 `"RCOG Green-top Guideline No. 37a: Reducing the Risk of Venous " +`
