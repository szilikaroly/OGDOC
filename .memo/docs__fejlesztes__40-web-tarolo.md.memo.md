---
source: docs/fejlesztes/40-web-tarolo.md
sha256: c3c9ce53988c7b56129a7f284724b116efff253ec072cfbbbfebbb03a80a2b00
lines: 176
profile: prose
generator: subagent
raw_tokens_est: 1832
verified: 8 confirmed
---

# docs/fejlesztes/40-web-tarolo.md

## Topics
- L1-157: a webes réteg rákötése a tárolóra, a hitelesítés hiányának megnevezése, elutasítások, auditjog, tesztek
- L158-176: nyitott tételek — hitelesítés, kulcsőrzés, többesetes kezelés, törlési út

## Claims

- [C1] [CONFIRMED] A cselekvőt kérésfejléc állítja, és azt senki nem ellenőrzi — a jogosultsági réteg arról dönt, akinek a kérés mondja magát @L53 `azt senki nem ellenőrzi;`
- [C2] [CONFIRMED] A kiszolgáló szintetikus jelzés nélkül el sem indul, és az üzenet megnevezi a hiányt @L59 `nélkül **el sem indul**, és az üzenet`
- [C3] [CONFIRMED] A regiszter érvényességi ellenőrzése a naplózás előtt fut, mert a napló utólag nem javítható @L81 `**a naplózás előtt** fut le`
- [C4] [CONFIRMED] Az `unreadable` bukás 410-et ad, mert a kulcs megsemmisülése a törlés működése @L86 `410 (a kulcs megsemmisült — a törlés így néz ki).`
- [C5] [CONFIRMED] Auditnaplót csak az auditor és a dpo szerep olvashat @L95 `export const AUDIT_READERS: Role[] = ["auditor", "dpo"];`
- [C6] [CONFIRMED] A `GET /api/archive` nem kér cselekvőt és nem ad vissza tartalmat, csak az épséget @L116 `**nem kér cselekvőt**, és nem ad vissza tartalmat.`
- [C7] [CONFIRMED] A `FileKeyStore` a kulcsokat a titkosított adat mellé írja, ami éles rendszerben tilos @L164 `a kulcsokat a titkosított adat *mellé* írja —`
- [C8] [CONFIRMED] A kiszolgáló egyetlen esetazonosítóval dolgozik, de az esetek elkülönítése már valódi @L169 `Az ELKÜLÖNÍTÉS viszont már valódi`
