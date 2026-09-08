---
source: docs/fejlesztes/25-finanszirozas.md
sha256: 56cde81c93c6959bab828c4bc2c3f713ca69efbd88fbae73880a32cc7744f92f
lines: 246
profile: prose
generator: subagent
raw_tokens_est: 3018
verified: 16 confirmed
---

# docs/fejlesztes/25-finanszirozas.md

## Topics
- L1-5: A réteg egyetlen alapszabálya: a rangsor elrendez, nem választ
- L6-35: Teljes kódolás kontra felülkódolás, a bizonyíték-kapu és a jogszabályi választás
- L36-160: A betöltött hivatalos törzsek, elmaradt bevétel okai, HBCS-súlyszámok, hiányok
- L161-246: SNOMED-licenc mint szerkezet, azonosító-ellenőrzés, a törzs kijavította hibák

## Claims

- [C1] [CONFIRMED] A réteg alapszabálya, hogy a rangsor elrendez, nem választ @L4 `> szabályról, amin az egész réteg áll: **a rangsor elrendez, nem választ.**`
- [C2] [CONFIRMED] A felülkódolást — alap nélküli kód jelentését — a rendszer nem támogatja @L11 `| **Felülkódolás** | olyan kód jelentése, aminek nincs alapja a rögzített adatban | **nem** |`
- [C3] [CONFIRMED] Bizonyíték nélkül a kód akkor sem kerül a rangsorba, ha nagy pontértéket kapna @L21 `// []   — bizonyíték nélkül a kód akkor sem kerül fel, ha többet érne`
- [C4] [CONFIRMED] Kizárásos kapcsolatnál a NEFMI-rendelet szerint a magasabb pontszámú eljárás számolható el @L33 `> álló egészségügyi eljárások közül a **magasabb pontszámú** egészségügyi`
- [C5] [CONFIRMED] A betöltött magyar BNO-törzs 11 959 sor (BNOX 3.4) @L40 `| 11 959 | BNO-10 magyar törzs (BNOX 3.4) |`
- [C6] [CONFIRMED] A törzsben a BNO-kódok pont nélkül szerepelnek, és külön mező jelöli a kereszt-csillag párokat @L56 `- **a BNO-kódok PONT NÉLKÜL** szerepelnek`
- [C7] [CONFIRMED] A hivatalos forrásfájlok nem kerülnek a repóba, csak a származtatott tábla és a forrás SHA-256 lenyomata @L63 `A forrásfájlok **nem kerülnek a repóba** — hivatalos, nyilvános, rendszeresen`
- [C8] [CONFIRMED] A rossz szakmakód miatt elakadó jelentés elmaradt bevétel, nem kódolási hiba @L87 `//  A jelentés ezen a szakmán elakadna — ez ELMARADT BEVÉTEL, nem kódolási hiba."`
- [C9] [CONFIRMED] A HBCS súlyszámtábla teljes, de a besoroló algoritmus hiányzik, ezért a rangsor nem választ csoportot @L128 `A súlyszámtábla teljes; a **besoroló algoritmus** nincs meg. A `
- [C10] [CONFIRMED] A járóbeteg- és a fekvőbeteg-OENO két külön lista, egymásba nem konvertálható @L151 `A kettő **nem ugyanaz a lista, és nem konvertálható egymásba** — a 11. modul`
- [C11] [CONFIRMED] A SNOMED Global Patient Set 378 553 aktív fogalmat tartalmaz, CC BY-ND 4.0 alatt @L163 `A **Global Patient Set** (378 553 aktív fogalom, 2026-01-01) **CC BY-ND 4.0**`
- [C12] [CONFIRMED] A validátor build-hibát ad, ha SNOMED-tábla a terjesztett táblakönyvtárba kerülne @L187 `Ez nem stílusszabály: a validátor **build-hibát** ad, ha SNOMED-tábla a`
- [C13] [CONFIRMED] Magyar kérésre is az angol SNOMED-megnevezést adja vissza a rendszer, megjelölve, hogy angol @L195 `megnevezést adja — megjelölve, hogy az angol. Egy rögtönzött magyar alak nem`
- [C14] [CONFIRMED] Kiadásbélyeg nélküli SNOMED-azonosító build-hiba, mert a terjeszthetetlen törzs miatt a CI nem tud utánanézni @L203 `kiadásbélyeg. A validátor build-hibát ad az ellenőrzési bélyeg nélküli`
- [C15] [CONFIRMED] A hivatalos törzs kimutatta, hogy a gátrepedés kódjai elcsúsztak: O702 a harmadfokú, O703 a negyedfokú @L222 `**O702 a harmadfokú** és az **O703 a negyedfokú** gátrepedés; a kézi`
- [C16] [CONFIRMED] A HELLP-szindrómának nincs önálló kódja ebben a BNO-kiadásban, a súlyos praeeclampsia kódjára esik @L225 `- **A HELLP-szindrómának NINCS önálló kódja** ebben a BNO-kiadásban: a súlyos`
