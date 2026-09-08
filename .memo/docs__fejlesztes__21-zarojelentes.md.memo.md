---
source: docs/fejlesztes/21-zarojelentes.md
sha256: dd4eeccb0c91f309510f9fb3add15a51c69c14b2408bdf8221e17c7d39256228
lines: 172
profile: prose
generator: subagent
raw_tokens_est: 1986
verified: 16 confirmed
---

# docs/fejlesztes/21-zarojelentes.md

## Topics
- L1-6: A modul két kérdése: az üres rubrika jelentése és a hitelesség
- L7-51: A blokkok három állapota, a gépi teljességellenőrzés, anamnézis-kivonat
- L52-130: A hitelesség négy feltétele, a nyomtatott figyelmeztetés, FHIR-export, kutatási példány
- L131-172: UCUM-megjelenítés, fejléc-hiány, a generált blokkok tárolatlansága, tesztek

## Claims

- [C1] [CONFIRMED] A generált irat hitelessége ma senkinél nem áll fenn @L5 `> hiteles** egy generált irat — és hogy a válasz ma mindenkinél ugyanaz: nem az.`
- [C2] [CONFIRMED] A notApplicable blokkállapot kizárólag rögzített tényből származhat @L20 `| nincs, és ez rendben van | **kizárólag rögzített tényből** |`
- [C3] [CONFIRMED] Ismeretlen ellátási forma mellett a blokk missing marad: a nem tudás nem mentesít @L31 `marad: **a nem tudás nem`
- [C4] [CONFIRMED] A gépi ellenőrzés azt kéri számon, hogy minden blokkban tartalom vagy indokolt hiány álljon @L37 `slots(summary).ok   // minden blokk: tartalom VAGY indokolt hiány`
- [C5] [CONFIRMED] Az anamnézis-kivonat csak a pozitív válaszokat viszi, és a blokk maga mondja ki, hogy ezt teszi @L43 `válaszokat viszi — és a blokk **kimondja,`
- [C6] [CONFIRMED] A hitelesség negyedik feltétele, a hitelesített felhasználói azonosítás, nem létezik a rendszerben @L68 `| **hitelesített felhasználói azonosítás** | 25. modul — **nem létezik** |`
- [C7] [CONFIRMED] Az aláírás mező ma szabad szöveg, amibe bárki bármit beírhat @L70 `A negyedik feltétel a lényeg. Az aláírás mező ma `
- [C8] [CONFIRMED] Az azonosítás tényét a kód kívülről kapja, és ma egyetlen futtató sem adja meg @L76 `állítja. Ma egyetlen futtató sem adja meg; a teszt mindkét irányt őrzi: a`
- [C9] [CONFIRMED] A MUNKAANYAG figyelmeztetés a dokumentum elején áll, nem a láblécben, és a nyomtatott változaton is rajta van @L97 `A dokumentum **elején**, nem a láblécben, és a nyomtatott változatban is: **a`
- [C10] [CONFIRMED] A FHIR-export státusza preliminary, és ezen nincs kapcsoló @L108 `toComposition(summary).status   // "preliminary" — és ezen nincs kapcsoló`
- [C11] [CONFIRMED] A kutatási példányból a beteg-azonosító blokk kimarad, de a kihagyás tényét a dokumentum kimondja @L124 `> „KUTATÁSI PÉLDÁNY: a beteg-azonosító blokk KIMARADT. A kihagyás tényét a`
- [C12] [CONFIRMED] A megjelenítési réteg magyar egységet ír a nyomtatásra, a tárolt UCUM-érték változatlan marad @L137 `— a tárolt érték változatlan, a`
- [C13] [CONFIRMED] Ismeretlen egységet a réteg változatlanul ír ki, nem talál ki magyar alakot @L142 `- **amit nem ismerünk, azt változatlanul írjuk ki** — nem találunk ki magyar`
- [C14] [CONFIRMED] Build-teszt követeli meg, hogy minden gépi jelölésű egységnek legyen emberi alakja — ma 32 változó, 14 egység @L145 `legyen emberi alakja. Ma 32 változó, 14 különböző egység.`
- [C15] [CONFIRMED] A zárójelentésből 19 regiszterváltozó lett, mert csak a sehol máshol nem keletkező adat kapott mezőt @L157 `az elbocsátás módja, az átadás). Ez 19 mező. A különbség nem számtani: a`
- [C16] [CONFIRMED] A generált blokk nem tárolódik, mindig újraszámol a rögzített adatból @L158 `generált blokk **nem tárolódik**, mindig újraszámol a rögzített adatból — ha`
