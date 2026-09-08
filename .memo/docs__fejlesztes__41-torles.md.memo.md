---
source: docs/fejlesztes/41-torles.md
sha256: 07e44019e00f5a51c2f2a96189971a740dae82cc146cfe63e84db4950a302b6c
lines: 193
profile: prose
generator: subagent
raw_tokens_est: 2155
verified: 10 confirmed
---

# docs/fejlesztes/41-torles.md

## Topics
- L1-45: a kétágú válasz elve és a kriptográfiai/fizikai törlés különbsége
- L46-193: a hat kapu, a mai elakadás, a visszavonás, a tanúsítvány, végpontok, tesztek, nyitott munka

## Claims

- [C1] [CONFIRMED] A válasz kétágú: a kutatási felhasználás azonnali hatállyal visszavonható, az ellátási dokumentáció marad @L19 `- a **kutatási** felhasználás bármikor visszavonható, azonnali hatállyal;`
- [C2] [CONFIRMED] A műveletek sorrendje kötött: előnézet, majd a helyette teljesíthető, és csak azután végrehajtás @L23 `sorrendjük kötött: **előnézet → mi teljesíthető helyette → csak azután`
- [C3] [CONFIRMED] Az alapértelmezés a kriptográfiai törlés; a fizikait nem tiltja, csak figyelmeztetést ad rá @L36 `A fizikai törlést **nem tiltjuk, de kimondjuk**`
- [C4] [CONFIRMED] Törlés után az olvasás `unreadable` hibával bukik el, nem `corrupt`-tal @L40 `A tároló művelete után az olvasás`
- [C5] [CONFIRMED] Minden blokkoló akadály mellett ott áll, mi oldaná fel @L48 `Minden akadály mellett ott áll, **mi hárítaná el**.`
- [C6] [CONFIRMED] A második aláíró nem lehet ugyanaz a személy @L67 `A második aláíró **nem lehet`
- [C7] [CONFIRMED] Mind a 14 ellátási dokumentumtípus megőrzési ideje `secondary` szintű @L74 `A 14 ellátási dokumentumtípus mindegyikének megőrzési ideje`
- [C8] [CONFIRMED] Ma egy DPO törlési rendelkezés három blokkoló akadályon akad el @L76 `blokkoló akadályon** akad el`
- [C9] [CONFIRMED] A művelet mindig tanúsítványt ad, mert tanúsítvány nélkül a törlés adatvesztéstől megkülönböztethetetlen @L112 `megkülönböztethetetlen az **adatvesztéstől**.`
- [C10] [CONFIRMED] Az elakadt törlés 409-et ad, nem 403-at: a jog megvan, az állapot nem engedi @L134 `A DPO-nak **van** joga; az **állapot** nem engedi.`
