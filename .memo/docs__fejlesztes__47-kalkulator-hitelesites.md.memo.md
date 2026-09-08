---
source: docs/fejlesztes/47-kalkulator-hitelesites.md
sha256: 6e165e56ddada074eb54059a7830a2872f5b7e2410cbb46d4be127919d3ae304
lines: 136
profile: prose
generator: subagent
raw_tokens_est: 1371
verified: 13 confirmed
---

# docs/fejlesztes/47-kalkulator-hitelesites.md

## Topics
- L1-48: miért más a kód hitelesítése, a lenyomat tartalma, a két gépi előellenőrzés
- L49-96: a nem monoton ISTH-pontsor és a tételes konstans-összevetés
- L97-136: a 36 öröklött kalkulátor kezelése, fájlok és záró számok

## Claims

- [C1] [CONFIRMED] Hét kalkulátor teljes bemenettel sem ad eredményt, mert konstansaik nincsenek visszaellenőrizve @L5 `Hét kalkulátor teljes bemenettel sem ad eredményt, mert a konstansaik nincsenek`
- [C2] [CONFIRMED] A fullPIERS dokumentált együtthatóival a modell klinikailag fordítva viselkedik, és ezt a saját teszt mutatta ki @L7 `fullPIERS dokumentált együtthatóival a modell klinikailag **fordítva`
- [C3] [CONFIRMED] A lenyomat a függvény forrását fedi, megjegyzések nélkül, összenyomott szóközökkel @L20 `Megjegyzések nélkül, összenyomott szóközökkel.`
- [C4] [CONFIRMED] A bemenetek egysége azért a normatív mag része, mert egységváltás csendben 88-szoros hibát adna @L29 `egysége mg/dL-re változna a kód érintése nélkül, az eredmény **csendben`
- [C5] [CONFIRMED] Az elcsúszás-figyelő a kódban álló számokat a dokumentált képlet prózájával veti össze @L39 `**Elcsúszás-figyelő:** a kódban álló számok összevetése a dokumentált képlet`
- [C6] [CONFIRMED] Az ISTH terhességi DIC thrombocyta-pontsora nem monoton: a legsúlyosabb kategória kevesebb pontot ér @L60 `**A legsúlyosabb thrombocytopenia kevesebb pontot`
- [C7] [CONFIRMED] A kód és a dokumentált képlet egyetért, tehát ha hiba van, az a forrásból átvételkor keletkezett @L66 `**egyetért egymással**, tehát ha`
- [C8] [CONFIRMED] Nem monoton pontsor aláírásánál a megjegyzés mező kötelező, különben build-hiba @L75 ` mezője kötelező, különben build-hiba.`
- [C9] [CONFIRMED] Az aláírás csak a tételesen felsorolt konstansokra terjed ki, a hiányzókra a validálás build-hibát ad @L88 `Ami kimarad, arra **az aláírás nem terjed ki**`
- [C10] [CONFIRMED] A munkalap közleményenként sorol, mert a hitelesítés így megy @L92 `közleményenként sorol, mert a hitelesítés így`
- [C11] [CONFIRMED] 36 kalkulátor már az aláírási réteg előttről hitelesítettnek volt jelölve, aláíró és lenyomat nélkül @L99 `A szabály bevezetésekor kiderült, hogy **36 kalkulátor** már`
- [C12] [CONFIRMED] Az öröklött lista le van zárva: listán kívüli, aláírás nélküli hitelesítés build-hiba @L116 `de a lista **le van zárva**`
- [C13] [CONFIRMED] A validálás záró sora: 7 kalkulátor kapu mögött, 0 aláírva, 36 öröklött, 1 nem monoton pontsorral @L136 `7 kalkulátor kapu mögött, 0 aláírva, 36 öröklött, 1 nem monoton pontsorral`
