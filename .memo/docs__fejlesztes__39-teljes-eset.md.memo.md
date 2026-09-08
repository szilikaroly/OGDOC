---
source: docs/fejlesztes/39-teljes-eset.md
sha256: ff3623eb22cb7fe4980ca5d8e80f1a58c06c8f6581519371e4a235f149a0a16b
lines: 163
profile: prose
generator: subagent
raw_tokens_est: 1868
verified: 9 confirmed
---

# docs/fejlesztes/39-teljes-eset.md

## Topics
- L1-43: a végigvitel feladata és a szintetikus ambuláns eset leírása
- L44-163: mérésmegítélés, a fordított AST-sáv hibája, szűrési „nem tudom", tesztek, nyitott munka

## Claims

- [C1] [CONFIRMED] A kész-kritérium másik fele klinikusi olvasat, amit gépből nem lehet bizonyítani @L18 `A második felét gépből nem lehet bizonyítani`
- [C2] [CONFIRMED] A szintetikus eset: 36 éves, korábbi császármetszés, 30+5 hét, ambuláns vizit @L27 `36 éves, második terhesség, egy korábbi császármetszés, **30+5 hét**, ambuláns`
- [C3] [CONFIRMED] A panaszszótár tétele terhességben vörös zászló, és hat mezőt nyit meg @L31 `terhességben **vörös zászló**, és megnyitja azt a hat mezőt, ami ide tartozik:`
- [C4] [CONFIRMED] A `domain.critical` definíciós küszöb, amiből teendő lesz — szemben a referenciatartománnyal, amiből csak jelzés @L58 `a változó **definíciós** küszöbe | **teendő** — azonnali megítélés`
- [C5] [CONFIRMED] Ismeretlen terhességi állapotnál vagy gesztációs kornál a rendszer nem esik vissza a nem terhes sávra @L67 `**nem esik vissza a nem terhes sávra**`
- [C6] [CONFIRMED] A beavatkozási sávon belüli érték nem minősül normálisnak (pulzus `[40, 130]`, 125 nem élettani) @L73 `belüli érték nem azonos a normálissal.**`
- [C7] [CONFIRMED] Az AST kritikus sávja fordítva volt bevíve, így a normális értéket jelezte kritikusnak @L83 `állt: eszerint a 70 **alatti** érték a`
- [C8] [CONFIRMED] A validálás mostantól hibát ad, ha a kritikus sáv kizárja a saját publikált referenciatartományát @L94 `A kritikus sáv nem zárhatja ki a saját publikált referenciatartományát.`
- [C9] [CONFIRMED] A `ScreeningState` külön mezőben tartja a `missing` és a `nemTudja` listát, mert más a teendő @L108 `**külön mezőben** tartja a kettőt`
