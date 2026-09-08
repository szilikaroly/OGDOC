---
source: core/kerdoiv/ppp.ts
sha256: d3cd1d541cc34afc326c59a6ab5a9d9e8f477d433c5aad3bed1ada079aa138e5
lines: 179
profile: code
generator: subagent
raw_tokens_est: 1814
verified: 10 confirmed, 2 needs_agent
---

# core/kerdoiv/ppp.ts

## Topics
- L1-28: miért nincs összesített kockázati szám; a kvalitatív döntés indoklása
- L29-118: RiskFactor típus, a négy tényező forrásokkal, PppAssessment alakja
- L119-179: assessPpp — szabályalapú besorolás és a szinthez kötött teendők

## Claims

- [C1] [CONFIRMED] a modul szándékosan nem gyárt egyetlen összesített kockázati számot @L4 ` * A modul nyitott kérdése ezzel dől el: **nem gyártunk egyetlen számot.**`
- [C2] [CONFIRMED] a publikált hatás szövegként tárolódik, mert a rendszer nem számol vele @L34 `  publishedEffect: I18n;`
- [C3] [CONFIRMED] a tényezők súlya kétértékű: `major` vagy `moderate` @L35 `  weight: "major" | "moderate";`
- [C4] [NEEDS_AGENT] négy rizikófaktor van beégetve: bipoláris zavar, korábbi PPP, korábbi PPD és elsőszülő @semantic L41-89
- [C5] [CONFIRMED] az elsőszülőnél a jelenlétet a `ctx.parity.para` nulla értéke jelöli, nem igen/nem @L87 `    positiveWhen: 0,`
- [C6] [CONFIRMED] a `PppAssessment` külön mezőben indokolja meg, miért nincs összesített becslés @L113 `  noCombinedEstimate: string;`
- [C7] [CONFIRMED] a `resolve` sikertelensége `"unknown"` jelenlétet ad, és a változó bekerül a hiányzók listájába @L128 `    if (r.state !== "ok") { present = "unknown"; missing.push(f.variable); }`
- [C8] [CONFIRMED] a jelenlét szigorú egyenlőség a `positiveWhen` értékkel @L129 `    else present = r.value === f.positiveWhen;`
- [C9] [CONFIRMED] egyetlen jelen lévő `major` tényező elég a `high` besoroláshoz @L144 `  if (majorPresent) level = "high";`
- [C10] [CONFIRMED] ismeretlen `major` tényező `unknown` szintet ad, ami megelőzi a `moderate`-ekből számolt `elevated`-et @L145 `  else if (majorUnknown) level = "unknown";`
- [C11] [CONFIRMED] egyetlen jelen lévő `moderate` tényező már `elevated` szintet ad @L146 `  else if (moderateCount >= 1) level = "elevated";`
- [C12] [NEEDS_AGENT] `baseline` szinten a függvény egyetlen teendőt sem ad vissza @semantic L149-168
