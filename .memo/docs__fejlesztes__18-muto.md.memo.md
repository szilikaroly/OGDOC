---
source: docs/fejlesztes/18-muto.md
sha256: 07bf91a1a84bf0a91506b99f014b1d899e351982eabdd81f93d7232ba33b5528
lines: 119
profile: prose
generator: subagent
raw_tokens_est: 1534
verified: 11 confirmed
---

# docs/fejlesztes/18-muto.md

## Topics
- L1-63: A WHO-ellenőrzőlista mint lezárási kapu, OENO-kódajánlás, uterotomia-mező
- L64-119: A numerikus bemenet build-szabálya, a három hiányzó összesített szám, hátravan

## Claims

- [C1] [CONFIRMED] A WHO-lista nem az ellátást, hanem az adminisztratív lezárást blokkolja, mert a műtét alatt kitölthető @L10 `beavatkozást, csak a **lezárását**. Ami itt blokkolódik, az nem az ellátás,`
- [C2] [CONFIRMED] Az ellenőrzőlista tételei a regiszterből jönnek, nem kódból, ezért új tétel nem kíván fejlesztést @L21 `A tételek a **regiszterből** jönnek`
- [C3] [CONFIRMED] Egyetlen hiányzó tétel is blokkolja a lezárást, és külön teszt őrzi az eszköz- és törlőszám egyezését @L26 `Egyetlen hiányzó tétel is blokkol, és külön teszt őrzi azt az egyet, **amiért`
- [C4] [CONFIRMED] A validátor verzió nélküli OENO-kódot nem enged @L46 `verzió nélküli kódot nem enged.`
- [C5] [CONFIRMED] A tervezett és a sürgős császármetszés OENO-kódja azonos, ezért a minőségi mutatók az op.pre.urgency mezőből számolnak @L49 `mezőben él, és a minőségi mutatók **onnan** számolnak, nem a kódból.`
- [C6] [CONFIRMED] Az uterotomia típusa azért önálló kódolt mező, mert a következő terhességnél ezt találják meg a legritkábban @L55 `azért önálló, kódolt mező, mert **ez az az adat, amit a`
- [C7] [CONFIRMED] A kalkulátor-réteg minden bemenetet számmá alakít, ezért a pos/neg alakú kódból NaN lesz és a kalkulátor örökre hiányzó bemenetet jelez @L74 `**A kalkulátor-réteg minden bemenetet számmá alakít.**`
- [C8] [CONFIRMED] Új build-ellenőrzés: kódolt bemenet csak akkor jó, ha minden kódja szám @L80 `A szabály ezért új build-ellenőrzés lett: **kódolt bemenet csak akkor jó, ha`
- [C9] [CONFIRMED] A VTE- és a VBAC-pontszám is kalkulátorból szabályalapú értékeléssé alakult @L85 `ugyanígy volt elrontva**. Mindkettő szabályalapú értékelés lett`
- [C10] [CONFIRMED] A VTE-nél a pontok elvileg összeadhatók, csak a tábla hiányos (20+ tételből 6) és ellenőrizetlen — ezért nyitott feladat, nem lezárt döntés @L100 `| VTE (RCOG) | a pontok elvileg **összeadhatók** — csak a táblánk hiányos (20+ tételből 6) és ellenőrizetlen | **nyitott feladat** |`
- [C11] [CONFIRMED] Klasszikus uterotomia után a hüvelyi szülés ellenjavallt: ez kódolt tényből dől el, nem becslésből @L107 `uterotomia után a hüvelyi szülés ellenjavallt. Ez kódolt tényből dől el, nem`
