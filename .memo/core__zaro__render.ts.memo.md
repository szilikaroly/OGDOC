---
source: core/zaro/render.ts
sha256: b2c1440b798043e3a73489464fc04c933797fcf26e76189071f0efaacb6564dd
lines: 87
profile: code
generator: subagent
raw_tokens_est: 877
verified: 7 confirmed, 1 needs_agent
---

# core/zaro/render.ts

## Topics
- L1-22: Amit a papírra is rá kell írni, és a megjelenítés opciói
- L23-87: A Markdown előállítása és az elfogadási kritérium gépi ellenőrzése

## Claims

- [C1] [NEEDS_AGENT] A hitelességi figyelmeztetésnek és a generálás módjának a NYOMATON is szerepelnie kell @semantic L1-14
- [C2] [CONFIRMED] A megjelenítés kétféle példányt ismer: ellátási és anonimizált @L20 `  kind?: "care" | "research";`
- [C3] [CONFIRMED] A hitelességi figyelmeztetés a dokumentum elején áll, és nem hiteles esetben félkövér @L30 `  out.push(d.authenticity.status === "authentic" ? `
- [C4] [CONFIRMED] A kutatási példányban a beteg-azonosító blokk helyén kimondott kihagyás áll, nem üres hely @L42 `"_— kutatási példányból kihagyva (beteg-azonosító) —_", "");`
- [C5] [CONFIRMED] A szegmensek súlyossága két jelölést kap: `!!` a vörös zászlóra, `!` a figyelendőre @L48 `        const mark = s.severity === "redflag" ? "!! " : s.severity === "watch" ? "! " : "";`
- [C6] [CONFIRMED] Üres blokknál címke és indoklás kerül a helyére, üres rubrika soha @L53 `      const tag = b.state === "notApplicable" ? "NEM VONATKOZIK RÁ" : "NINCS ADAT";`
- [C7] [CONFIRMED] A `slots()` hibának veszi a forrás nélküli állítást @L78 `        if (!s.from.length) problems.push({ block: b.id, reason: `
- [C8] [CONFIRMED] Az indoklás nélküli üres blokk maga a kitöltetlen sablonhely @L82 `    if (!b.note || !b.note.trim()) {`
