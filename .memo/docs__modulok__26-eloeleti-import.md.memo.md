---
source: docs/modulok/26-eloeleti-import.md
sha256: 35751919675fe2e82be3ac24928c6207243ab9691eed4cc6309a057974eeb8b6
lines: 319
profile: prose
generator: subagent
raw_tokens_est: 3960
verified: 17 confirmed
---

# docs/modulok/26-eloeleti-import.md

## Topics
- L1-156: A javaslattár mint kapu, négy szerkezeti szabály, vörös zászló állapotai, kinyerő-csővezeték
- L157-218: Mit kérünk a modelltől, természetes nyelvű lekérdezés, örökölt adatvédelmi kapuk, RAG helye
- L219-319: Beteg-oldali változat és MDR-határ, megerősítési szerepek, tesztelt elfogadási kritérium, nyitott kérdések

## Claims

- [C1] [CONFIRMED] A réteg alapállítása: a gépi kinyerés állítást ad, nem adatot @L28 `> **A réteg egyetlen állítása:** a gépi kinyerés **állítást** ad, nem **adatot**.`
- [C2] [CONFIRMED] Nincs olyan üzemmód, amiben meg nem erősített kinyerés levezetést, score-t vagy dokumentumot befolyásolna @L48 `Nincs olyan üzemmód, amiben egy meg nem erősített kinyerés bármelyik`
- [C3] [CONFIRMED] Hivatkozás nélkül nincs javaslat: a javaslat felvétele kivételt dob span nélkül @L57 `**Hivatkozás nélkül nincs javaslat**`
- [C4] [CONFIRMED] A gépi magabiztosság sosem erősít meg, nincs küszöb a kódban: a 0,999 is javaslat marad @L58 `| **Gépi magabiztosság sosem erősít meg** | nincs küszöb a kódban | A 0,999 is javaslat marad. Egy küszöb pontosan a ritka, magabiztos tévedést engedné át |`
- [C5] [CONFIRMED] A megerősítés után az érték eredete a jóváhagyó kliniküsé, a sourceRef viszont visszamutat a dokumentum pontos helyére @L65 `állítja, hanem az, aki jóváhagyta.`
- [C6] [CONFIRMED] A meg nem erősített javaslatból következő vörös zászló `pending` állapotban a döntés előtt is látszik @L106 `| **meg nem erősített javaslatból** következne | a klinikus döntésére vár, és **addig is látszik** |`
- [C7] [CONFIRMED] A modelltől szó szerinti idézetet kérünk, nem összefoglalást @L163 `| szó szerinti idézetet | összefoglalást, ami az idézet helyére kerül |`
- [C8] [CONFIRMED] A természetes nyelvű lekérdezésnél a modell a lekérdezést írja, nem a választ @L174 `### A választott szerkezet: a modell a LEKÉRDEZÉST írja, nem a VÁLASZT`
- [C9] [CONFIRMED] Az eredmény az adatbázisból jön, ezért reprodukálható és auditálható @L187 `- az eredmény az adatbázisból jön, tehát **reprodukálható** és`
- [C10] [CONFIRMED] A lekérdező örökli a 20. modul kapuit: az azonosítót tartalmazó mezők kimaradnak @L199 `mezők kimaradnak | a lekérdező nem ad ki azonosítót |`
- [C11] [CONFIRMED] RAG csak szabad szövegre való, és ott is csak forráshivatkozással jelenhet meg állítás @L208 `mellett ott a hivatkozás a forrásdokumentum pontos helyére**, különben nem`
- [C12] [CONFIRMED] A jelenlegi pozicionálás szándékosan veszi ki az MDR-megfelelőséget a hatókörből @L223 `mellett**, és ez a döntés **szándékosan veszi ki az MDR-megfelelőséget a`
- [C13] [CONFIRMED] Egy fizetős, beteg-oldali, javaslatot adó változat az (EU) 2017/745 11. szabálya szerint orvostechnikai eszközzé tenné a rendszert @L227 `visszavonja. Az (EU) 2017/745 rendelet **11. szabálya** szerint a diagnosztikai`
- [C14] [CONFIRMED] Az ajánlás az A. (rendezés) változat elsőre, mert az önmagában is eladható érték és nem kíván orvosi állítást @L244 `**Az ajánlásom az A. változat elsőre**, és nem óvatosságból: az A. változat`
- [C15] [CONFIRMED] A beteg megerősítése csak a saját profiljában hoz létre értéket, a klinikai dokumentációba nem kerül @L263 `eredetű érték a **saját** profiljában; a klinikai dokumentációba **nem** kerül |`
- [C16] [CONFIRMED] Az elfogadási kritérium már teszt: a meg nem erősített kinyerés semmit nem befolyásol, a belőle fakadó zászló mégis látszik @L292 `> **A meg nem erősített kinyerés egyetlen levezetést, score-t, dokumentumot`
- [C17] [CONFIRMED] Nyitott kérdés a forrásdokumentum megőrzési ideje, mert a span hivatkozás értéktelen a dokumentum nélkül @L317 `Meddig őrizzük a **forrásdokumentumot**?`
