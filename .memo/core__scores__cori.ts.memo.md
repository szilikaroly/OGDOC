---
source: core/scores/cori.ts
sha256: aa2623d1ebe99f85e91039fada908f5da612f3d5e3bfe3fa60f7b2f62ceb0326
lines: 231
profile: code
generator: subagent
raw_tokens_est: 2434
verified: 11 confirmed, 2 needs_agent
---

# core/scores/cori.ts

## Topics
- L1-81: Miért eszkalációs szabály a CORI, a domén- és eredménytípusok, szinttábla
- L82-192: A hat domén kiértékelése és az összesített szint képzése
- L193-231: partogramLevel — a WHO figyelmeztető és beavatkozási vonala

## Claims

- [C1] [NEEDS_AGENT] a CORI nem publikált, validált modell, hanem eszkalációs szabály: az összesítés maximum, nem összeg @semantic L4-14
- [C2] [CONFIRMED] az adathiányos domén szintje `null`, kifejezetten nem 0 @L40 `level: CoriLevel | null;`
- [C3] [CONFIRMED] az eredmény a szint MELLETT hordozza a nem mért dómének számát @L53 `unmeasured: number;`
- [C4] [CONFIRMED] az 5. szint azonnali multidiszciplináris ellátást és a szülés befejezésének mérlegelését írja elő @L78 `action: "AZONNALI multidiszciplináris ellátás; a szülés befejezésének mérlegelése.",`
- [C5] [NEEDS_AGENT] hat domént értékel: MEOWS, fullPIERS, CMQCC-stádium, omqSOFA, NICHD-kategória és a vajúdás menete @semantic L85-148
- [C6] [CONFIRMED] a MEOWS legalább két kiváltó paraméternél 4-es szintet ad @L90 `level: (meows.value >= 2 ? 4 : meows.value === 1 ? 2 : 1) as CoriLevel,`
- [C7] [CONFIRMED] a fullPIERS 30% feletti 48 órás kockázata 5-ös szint, 2,5% alatt marad 1-es @L101 `level: (fp.value >= 0.3 ? 5 : fp.value >= 0.1 ? 4 : fp.value >= 0.025 ? 3 : 1) as CoriLevel,`
- [C8] [CONFIRMED] a CMQCC 3. vagy magasabb stádiuma 5-ös szintet ad @L117 `level: (stage.value >= 3 ? 5 : stage.value === 2 ? 4 : stage.value === 1 ? 3 : 1) as CoriLevel,`
- [C9] [CONFIRMED] ha egyetlen domén sem mért, a CORI nem ad eredményt — nem 0-t és nem zöldet @L151 `if (!measured.length) {`
- [C10] [CONFIRMED] az összesített szint kizárólag a MÉRT dómének maximuma @L161 `const overall = Math.max(...measured.map((d) => d.level!)) as CoriLevel;`
- [C11] [CONFIRMED] 4 cm alatti tágulatnál (látens szak) a vonal nem alkalmazható, a szint 1 @L208 `if (cervix < 4) {`
- [C12] [CONFIRMED] az elvárt tágulat a 4 cm-től számított 1 cm/óra ütemből adódik @L214 `const expected = 4 + hours.value;`
- [C13] [CONFIRMED] legalább 4 cm lemaradás a beavatkozási vonal (4-es szint), 0,5 cm-től a figyelmeztető vonal (3-as) @L216 `if (behind >= 4) {`
