---
source: docs/fejlesztes/36-dontesek.md
sha256: 4cca595a62883e08c9aea6bb1a649196e261ddf51f7d3e5b1e2ef6a436c9db73
lines: 164
profile: prose
generator: subagent
raw_tokens_est: 1796
verified: 12 confirmed
---

# docs/fejlesztes/36-dontesek.md

## Topics
- L1-73: a 326 mező 38 szabályra vonása, a négy döntésállapot, az aláírás lenyomathoz kötése
- L74-164: mit ad a gép és mit nem, a döntés menete, a validálási kapuk, nyitott munka

## Claims

- [C1] [CONFIRMED] A 326 döntendő mező mögött összesen 38 szabály áll, ezért a döntés szabályszintű @L22 `A 326 mező mögött **38 szabály** áll.`
- [C2] [CONFIRMED] A szabálylista a `FieldAudit.rule` mezőből származik, nem a `why` szöveg visszafejtéséből @L32 `azt mondja meg, **melyik zászló szólalt meg**`
- [C3] [CONFIRMED] Eldöntetlenül egyetlen mező sem kerül át; ez alapállapot, nem figyelmeztetés @L43 `**Eldöntetlenül egy mező sem kerül át.**`
- [C4] [CONFIRMED] Négy döntésállapot létezik, és közülük három zár @L46 `Négy állapot van, és három közülük zár:`
- [C5] [CONFIRMED] A döntés a szabály normatív magjának sha256 lenyomatát (16 hex) rögzíti @L63 `**lenyomatát** (sha256, 16 hex) rögzíti.`
- [C6] [CONFIRMED] A szabály címének vagy javaslatának változása nem érvényteleníti az aláírást @L66 `Ha a szabály **címe** vagy a **javaslata** változik, az aláírás érvényben marad:`
- [C7] [CONFIRMED] A katalógus szabályonként megköveteli az aláíró szerepeket: GDPR 9. cikkes szabályhoz DPO is kell @L83 `a GDPR 9. cikkes szabályokhoz DPO is kell`
- [C8] [CONFIRMED] A validálás hibát ad a felelős nélküli tételre és arra is, ha a felelős nem aláírója a szabálynak @L90 `a validálás ezért hibát ad rá, és arra is, ha a felelős nem aláírója a`
- [C9] [CONFIRMED] A mai állás: 326 döntendő mező, 0 eldöntve, 326 eldöntetlen @L102 `326 döntendő mező 38 szabály mögött; 0 eldöntve (0 szabály),`
- [C10] [CONFIRMED] A `tools/validate.ts` hibát ad, ha a felülettérkép a katalógusban nem szereplő szabályt szólaltat meg @L129 `**hibát** ad, ha a felülettérkép olyan szabályt szólaltat`
- [C11] [CONFIRMED] A sehol meg nem szólaló katalógustétel csak figyelmeztetést vált ki @L134 `Ugyanígy hiba a fordítottja is (figyelmeztetésként)`
- [C12] [CONFIRMED] A döntésállapot ma csak látszik, a felületen a mezőket még nem kapuzza @L161 `de a mezőket nem a döntésállapot`
