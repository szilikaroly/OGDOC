---
source: docs/fejlesztes/17-szuloszoba.md
sha256: 0f555b7d71ac2bdb480a44fa605f3382b977ed27802000b1398ff306aafd4e96
lines: 144
profile: prose
generator: subagent
raw_tokens_est: 1874
verified: 6 confirmed
---

# docs/fejlesztes/17-szuloszoba.md

## Topics
- L1-144: IPRACS-javítások, score-kapuk, NICHD, CORI-összesítő, partogram-vonalak

## Claims

- [C1] [CONFIRMED] A tárolóból tudatosan hiányzik a titkosítás, a jogosultság és az auditnapló, ezért a rendszer nem futhat valódi betegadaton @L28 `> hozzátéve, a rendszer nem futhat valódi betegadaton.`
- [C2] [CONFIRMED] A fullPIERS azért van kapu mögött, mert a meglévő együtthatókkal a modell klinikailag fordítva viselkedik @L44 `| fullPIERS | **van** | az együtthatókkal a modell klinikailag fordítva viselkedik |`
- [C3] [CONFIRMED] Csak az etnikum nélküli, 2021-es VBAC-változat van a rendszerben; a régi képlet visszaállítása nem opció @L51 `rendszer kizárólag az etnikum nélküli változatot ismeri; a régi képlet`
- [C4] [CONFIRMED] Variabilitás nélkül nincs NICHD-besorolás, az eredmény insufficient a hiány megnevezésével @L65 `- **variabilitás nélkül nincs besorolás**`
- [C5] [CONFIRMED] A CORI kimenete az összesített szint mellett a nem mért domének számát is hordozza, mert a 0 adathiányt jelent @L94 `Ezért a kimenet két számot hordoz: az összesített szintet **és azt, hány domén`
- [C6] [CONFIRMED] A partogram-vonalak megmaradtak, de a szint mellé oda van írva, hogy az 1 cm/óra ütemet feltételezik @L125 `használja őket — de a szint mellé **oda van írva, mit feltételez**:`
