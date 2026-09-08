---
source: docs/fejlesztes/33-nyelvek.md
sha256: 32c0b365a54a084dc547dd54611b89bcc37374bceae6b82f21fce76196790c6a
lines: 179
profile: prose
generator: subagent
raw_tokens_est: 1880
verified: 11 confirmed
---

# docs/fejlesztes/33-nyelvek.md

## Topics
- L1-25: alapelv — a hiányzó fordítás megjelölt forrásnyelvi szöveg
- L26-56: a három nyelvi szint és a `pick()` visszatérési szerződése
- L57-179: lefedettség, nyelvválasztás, beégetett szöveg elleni teszt, korlátok, ellenőrző lista

## Claims

- [C1] [CONFIRMED] A hiányzó fordítás helyén megjelölt forrásnyelvi szöveg áll, nem jelöletlen helyettesítés @L11 `A hiányzó fordítás nem forrásnyelvi szöveg, hanem MEGJELÖLT`
- [C2] [CONFIRMED] Az `en ?? hu` alakú fallback-lánc tiltott, mert csendben helyettesít @L17 `**csendben helyettesít**`
- [C3] [CONFIRMED] Felületi szövegnél a hiányzó fordítás hiba, amire a teszt bukik @L30 `kimutatja, a teszt bukik rá`
- [C4] [CONFIRMED] Validált mérőeszköz tételszövegéhez rögtönzött fordítás nem használható, ez licenc- és eljárási kérdés @L32 `**semmi** — licenc és eljárás kérdése, rögtönzött alakban sehogy`
- [C5] [CONFIRMED] A `pick()` nem sima string-et ad vissza, hanem jelzi, ha nem a kért nyelven válaszolt @L43 `fallback: boolean; // igaz, ha NEM a kért nyelven`
- [C6] [CONFIRMED] A `coverage()` a százalék mellett `usable` mezőt is ad, mert a százalék önmagában félrevezető @L64 `mezőt is, mert a százalék önmagában`
- [C7] [CONFIRMED] Az angol klinikai lefedettség 4% (30/846), ezért klinikai üzemben nem használható @L77 `| 4% (30/846) |`
- [C8] [CONFIRMED] A 64 felületi kulcs mindkét nyelven 100%-os lefedettségű @L79 `**felületi** kulcs ezzel szemben mindkét nyelven **100%**`
- [C9] [CONFIRMED] Ismeretlen kért nyelvnél a forrásnyelv jön vissza, a rendszer nem találgat @L94 `return SOURCE_LANG;`
- [C10] [CONFIRMED] A beégetett szöveg ellen a teszt magukat a forrásfájlokat olvassa @L113 `**a forrásfájlokat olvassa**`
- [C11] [CONFIRMED] A 816 klinikai címke szakfordítása nyitott, külső munka @L178 `klinikai címkék szakfordítása (816 tétel) — **nyitott, külső munka**`
