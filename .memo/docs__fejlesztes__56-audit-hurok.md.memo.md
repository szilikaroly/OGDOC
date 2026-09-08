---
source: docs/fejlesztes/56-audit-hurok.md
sha256: 266c1e977cffa49f74f3c201d561eb2c0f92bf1aef5913d5ad9cb254fbf55957
lines: 150
profile: prose
generator: subagent
raw_tokens_est: 1611
verified: no claims
---

# docs/fejlesztes/56-audit-hurok.md

## Topics
- L1-15: miért a visszamérés köre a rendszer legfontosabb hurka
- L16-47: a lelet — a három audit-mezőnek nem volt változója, és a javítás
- L48-80: négyértékű válasz, a cáfolat és az eldönthetetlen szétválasztása
- L81-150: mikortól közölhető szám, Wilson-sáv, a nevező, a mai állás

## Claims

- [C1] A terv szerint a 17. és a 18. lépés nélkül a rendszer sosem tudja meg, hogy jó-e @L12 `szól: *„a 17. és a 18. nélkül a rendszer sosem tudja meg, hogy jó-e.”*`
- [C2] A 17. lépés „Kész, ha"-ja számot kér, amit nem létező mezőből nem lehet kiszámolni @L35 `A 17. lépés „Kész, ha”-ja **számot** kér. Számot nem lehet olyan mezőből`
- [C3] A három audit-mező változó nélkül állt, így a klinikus beírt válasza sehol nem maradt volna meg @L33 `válasz, amit a klinikus beleír, **sehol nem maradt volna meg**.`
- [C4] A javítás három új négyértékű változót vezet be, beköti a mezőket, és hibának tekinti a változó nélküli audit-mezőt @semantic L40-44
- [C5] Az audit-mezők listája a felülettérképből derivált, ezért egy új mező felvétele önmagában bekapcsolja az ellenőrzést @L43 `audit-mezők listája a felülettérképből derivált, nem külön nyilvántartásból: egy`
- [C6] A kétértékű válasz a cáfolatot és az eldönthetetlenséget ugyanabba a rekeszbe tenné @L51 `kétértékű válasz a **cáfolatot** és az **eldönthetetlenséget** ugyanabba a`
- [C7] A felületes endometriosis szövettani igazolása megbízhatatlan, ezért ott az eldönthetetlen várható kimenet @L59 `felületes endometriosis szövettani igazolása közismerten megbízhatatlan — vagyis`
- [C8] Az eldönthetetlenek cáfolatba sorolása ugyanazon az adaton huszonöt százalékpont különbséget okoz, mindig lefelé @L68 `Ugyanaz az adat, ugyanaz a rendszer, **huszonöt százalékpont** különbség — és`
- [C9] A hiányzó adat sehol nem számít „nem"-nek, az ismeretlen kód is a hiányzó rekeszbe kerül @L73 `*a hiányzó adat sehol nem „nem”.*`
- [C10] A válaszkészlet kétértékűre visszacsúsztatása hiba, nem figyelmeztetés @L76 `Ha valaki a válaszkészletet visszacsúsztatja kétértékűre, az **hiba**, nem`
- [C11] A közlés soha nem ad ki puszta arányt, csak konfidenciaintervallummal és csak mindhárom küszöb engedélyével @L86 `ezért soha nem ad ki puszta arányt — mindig`
- [C12] Ha az arány nem közölhető, `null` a válasz, nem 0 — a nulla azt állítaná, hogy mértünk @L98 `valahányszor nem közölhető. A nulla azt állítja,`
- [C13] A hiányzó küszöb nem engedékenység: a kapu adatból nyílik, a hiányzó döntés nem „igen" @L102 `**A hiányzó küszöb nem engedékenység.** Ugyanaz a szerkezet, mint mindenhol`
- [C14] A normál közelítés 0/5-nél negatív alsó határt adna, ezért a sáv Wilson-féle @L115 `| 0/5 | **negatív** alsó határ | 0–43% |`
- [C15] A kitöltetlen válasz az eldönthetetlen-arány nevezőjébe sem kerül bele @L121 `A kitöltetlen válasz **nem** kerül bele az eldönthetetlen-arányba sem. A`
- [C16] A mai állás: 3/3 mező bekötve, 0/3 pár közölhető, nulla esettel és három hiányzó küszöbbel @L130 `Audit-hurok: 3/3 mező bekötve, 0/3 pár közölhető (0 eset, 3 küszöb hiányzik)`
