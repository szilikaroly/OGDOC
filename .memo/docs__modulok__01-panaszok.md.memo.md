---
source: docs/modulok/01-panaszok.md
sha256: 3baebc750bcf98dbf582718777b542281972ea09dc14a250e9be8794409bb5dc
lines: 128
profile: prose
generator: subagent
raw_tokens_est: 1626
verified: 3 confirmed
---

# docs/modulok/01-panaszok.md

## Topics
- L1-128: A panaszmodul terve: szótár-adatszerkezet, OPQRST-attribútumok, vörös zászlók, keresztfeltöltés

## Claims

- [C1] [CONFIRMED] A panaszszótár nem létezik az IntuiCare-ben, a modul teljes egészében új munka @L13 `**A panaszszótár maga nincs meg** — ez a modul teljes egészében új munka.`
- [C2] [CONFIRMED] A kódolt tétel és a beteg szó szerinti megfogalmazása (`compl.verbatim`) egyszerre marad meg, egyik sem váltja ki a másikat @L27 `Egyik sem helyettesíti a másikat: a kódolt tétel a gépnek, a szó szerinti`
- [C3] [PENDING] A panaszszótár tétele az `opens` listáján keresztül kötelezővé teszi a 04. modul fizikális vizsgálatát @L90 `| `04` státusz-alszekciók | a panasz `opens` listája **kötelezővé teszi** a releváns fizikális vizsgálatot |`
- [C4] [PENDING] Aktív vörös zászlós panasz teendője csak indoklással zárható le, és az indoklás az epikrízisbe kerül @L102 `- **A vörös zászló nem törölhető némán.** Ha egy `redflag` panasz aktív, a hozzá tartozó teendő`
- [C5] [PENDING] A `redflagWhen` kontextusfüggő: a jobb alhasi fájdalom önmagában nem vörös zászló @L104 `- **A `redflagWhen` kontextusfüggő.** A jobb alhasi fájdalom önmagában nem vörös zászló;`
- [C6] [CONFIRMED] Nyitott javaslat: a ~400 tételes szótár helyett szűkebb, 120–150 tételes szülészeti-nőgyógyászati induló szótár @L126 `használható-e a gyakorlatban. Érdemes megfontolni, hogy egy szűkebb, 120–150 tételes, kizárólag`
