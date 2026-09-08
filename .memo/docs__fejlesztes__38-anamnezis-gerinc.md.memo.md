---
source: docs/fejlesztes/38-anamnezis-gerinc.md
sha256: 3be96efe5ae8c8a068a9b30885f2004e449353fb84d5ec2e3d1bb3c6521832d2
lines: 188
profile: prose
generator: subagent
raw_tokens_est: 2109
verified: 15 confirmed, 1 needs_agent
---

# docs/fejlesztes/38-anamnezis-gerinc.md

## Topics
- L1-52: a gerinc-mérték feladata, a hiányzó bemenetek forrásbesorolása, levezetett mezők bontása
- L53-85: a hiányzó CMQCC vérzési kockázati modul és a hitelesítetlen tábla
- L86-111: a rögzített „nem tudom" „nem"-mé válása a kockázati modulokban
- L112-188: a szűrési esedékesség fail-safe döntése, a tesztek, a kód helye, nyitott munka

## Claims

- [C1] [CONFIRMED] Csak az `anamnezis` forrású hiányzó bemenet számít további kérdésnek, mérés vagy felvételi adat nem @L30 `**a gerinc hiányos** — valakit újra megkérdeznek`
- [C2] [CONFIRMED] A besorolatlan változóelőtag hibát ad, hogy új modul ne sodródhasson be némán @L33 `**hiba** — egy új modul nem sodródhat be némán`
- [C3] [CONFIRMED] A kérdéslista a számított mezőket rekurzívan a bemeneteikre bontja @L39 `**rekurzívan a bemeneteikre bontja**`
- [C4] [CONFIRMED] Ha minden bemenet megvan, de az érték nem áll elő, a számított mező marad a kérdés, mert ott a képlet hibás @L49 `ott a képlettel van baj, nem az adattal.`
- [C5] [CONFIRMED] A CMQCC felvételkori vérzési kockázati rétegzés korábban hiányzott a repóból @L60 `felvételkori kockázati rétegzés hiányzott.`
- [C6] [CONFIRMED] A vérzési tényezők táblája adat, nem kód, ezért tényező felvétele kódírás nélkül megy @L65 `**A tábla adat, nem kód**`
- [C7] [CONFIRMED] A vérzési tábla `assumed` hitelesítési szintű, ezért a modul kockázati szintet nem ad @L68 `**Szintet viszont nem ad.**`
- [C8] [NEEDS_AGENT] A kockázati modulok a rögzített „nem tudom" választ tagadásként olvasták, mielőtt kijavították @semantic L86-107
- [C9] [CONFIRMED] Három állapot különül el: nincs érték, `unk` (megkérdeztük, nem tudja), `neg` (állítás) @L102 `**megkérdeztük, és nem tudja** | újrakérdezni nem segít`
- [C10] [CONFIRMED] A rögzített „nem tudom" nem rontja el a gerinc-mértéket, mert nem további kérdés @L109 `**A gerinc-mértékre ez nem üt vissza:**`
- [C11] [CONFIRMED] Az `unk` válasz korábban `notApplicable`-t adott, azaz a rendszer azt állította, a szűrés nem vonatkozik a betegre @L116 `állította, hogy a szűrés **nem vonatkozik a betegre**`
- [C12] [CONFIRMED] Az alapértelmezés fail-safe: ismeretlen válasznál a szűrés nyitva marad @L127 `unknown        — nem tudjuk eldönteni, vonatkozik-e rá; a szűrés nyitva marad`
- [C13] [CONFIRMED] Két szűrési szabály érintett, és a döntésük klinikai jóváhagyást kíván @L137 `(korábbi terhességi cukorbetegség) és`
- [C14] [CONFIRMED] A modult 18 teszt fedi egy szintetikus eseten @L144 `18 teszt egy szintetikus eseten (36 éves, egy`
- [C15] [CONFIRMED] A mérték hibabevitellel bizonyított: egyetlen anamnézis-válasz kivétele elbuktatja a gerincet @L149 `Sorra kivéve **egyetlen** anamnézis-választ, a`
- [C16] [CONFIRMED] Nyitott: a vérzési tábla hitelesítése, addig szint nem születik @L179 `**A vérzési tábla hitelesítése.** Amíg`
