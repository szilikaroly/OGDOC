---
source: docs/14-allapot.md
sha256: 21a98a5c96467ee5732031bf60524437b8dcf0f5e143f4a03801fa862839345a
lines: 175
profile: prose
generator: subagent
raw_tokens_est: 2286
verified: 15 confirmed, 1 needs_agent
---

# docs/14-allapot.md

## Topics
- L1-19: a generált állapotjelentés fő számai (változók, kalkulátorok, tesztek, sorok)
- L20-85: felülettérkép-mérleg, döntési állapot, kapu mögötti kalkulátorok, külső források licence
- L86-129: a mag egységeinek fájl- és sorszáma
- L130-175: a tizennyolc lépés állása és a valódi betegadat-futtathatóság rétegei

## Claims

- [C1] [CONFIRMED] A dokumentum generált, minden száma a forrásból származik @L3 `Minden szám a forrásból jön`
- [C2] [CONFIRMED] A regiszterben 872 változó van @L11 `| Regiszterbeli változó | **872** |`
- [C3] [CONFIRMED] 43 kalkulátor van a rendszerben @L12 `| Kalkulátor | 43 |`
- [C4] [CONFIRMED] A kalkulátorokból 7 áll hitelesítési kapu mögött @L13 `| ebből kapu mögött (`
- [C5] [CONFIRMED] 1302 teszt fut @L14 `| Teszt | **1302** |`
- [C6] [CONFIRMED] A két forrásrendszer felülettérképe együtt 1502 mezőt tartalmaz @L26 `| **Együtt** | **91** | **88** | **1502** |`
- [C7] [CONFIRMED] 1031 mező valódi fejlesztési tételként hiányzik @L38 `| hiányzik | 1031 | valódi fejlesztési tétel |`
- [C8] [CONFIRMED] A 38 szabályból egy sincs aláírva, ezért ma egyetlen mező sem kerülne át @L49 `ma **0** mező kerülne át. A 38 szabályból **0** van aláírva.`
- [C9] [CONFIRMED] A projekt licence MIT, és ez dönti el a copyleft források átvehetőségét @L67 `A projekt licence: **MIT**.`
- [C10] [CONFIRMED] A külső kalkulátorforrás GPL-2.0 licence a terjesztés irányában ütközik a projekt MIT licencével @L79 `LICENCÜTKÖZÉS — a projekt licence MIT (megengedő), a forrásé GPL-2.0 (copyleft)`
- [C11] [CONFIRMED] 34 katalogizált külső tétel 66 változóhoz szólna hozzá, de ma egyik sem szól hozzá @L84 `**34 katalogizált tétel 66 változónkhoz szólna hozzá — és ma egyik sem szól hozzá.**`
- [C12] [NEEDS_AGENT] A mag egységeit fájl- és sorszám szerinti táblázat sorolja, élén a számítási egységgel @semantic L88-128
- [C13] [CONFIRMED] A tizennyolc lépésből 3 kész, 15-nél a gépi fele áll, az emberi nem @L155 `**3 lépés kész**, **15-nél a gépi fele áll, az emberi nem**`
- [C14] [CONFIRMED] A tárolási réteg (titkosított, láncolt, perzisztens) élesben áll @L163 `| tárolás — titkosított, láncolt, perzisztens | **éles** | — |`
- [C15] [CONFIRMED] A hitelesítés hiányzik: SSO vagy kártyás azonosítás kell hozzá @L168 `| **hitelesítés** | **NINCS** | SSO vagy kártyás azonosítás |`
- [C16] [CONFIRMED] A webes kiszolgáló a szintetikus kapcsoló nélkül el sem indul @L170 `nélkül **el sem indul**.`
