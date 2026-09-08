---
source: docs/01-architektura.md
sha256: e80b3cd26a90330c18e472b40920dd0064be979387ae064ddd59c64b31ad4ecf
lines: 222
profile: prose
generator: subagent
raw_tokens_est: 3153
verified: 15 confirmed, 1 needs_agent
---

# docs/01-architektura.md

## Topics
- L1-2: A fejezet címe: architektúra és portolhatósági szerződés
- L3-46: A központi döntés — a regiszter a forrás, a felület kivetítés
- L47-118: Rétegszabályok, miért nem egyfájlos a rendszer, a regiszter és a meglévő séma
- L119-222: Adatmodell, néma helyettesítés tilalma, hibakezelés, tesztelés, frissesség

## Claims

- [C1] [CONFIRMED] Az IPRACS-ban a `calcLATCH()` kétszer van definiálva, az 5175. és a 7497. sorban @L7 `**kétszer** van definiálva (5175. és 7497. sor)`
- [C2] [CONFIRMED] A v16 architektúrája tizennégy rétegű dekorátorlánc, rétegenkénti `try/catch`-csel @L11 `tizennégy réteg, mindegyik becsomagolja az előző `
- [C3] [CONFIRMED] A dekorátorlánc ára, hogy a hibás réteg némán hal el — ez a megfordítás oka @L25 `kimond: **a hibás réteg némán hal el.** Hibakeresésnél a globálisokat kell végignézni, mert a`
- [C4] [CONFIRMED] A regiszterbe felvett változó magától megjelenik az űrlapon, a dokumentációban, az exportban és a validációban @L44 `és attól kezdve **magától** megjelenik az űrlapon, a dokumentációban, az exportban és a`
- [C5] [CONFIRMED] 2026-09-01-én megdőlt az egyfájlos offline feltevés: az OGDOC az IntuiCare platformra épül (230 tábla, 158 route, 407 server function) @L51 `> IntuiCare platform (230 tábla, 158 route, 407 server function), amelyre az OGDOC épül.`
- [C6] [CONFIRMED] A klinikai mag `src/lib/ogdoc/` alatt él @L66 `Az OGDOC klinikai magja tehát `
- [C7] [CONFIRMED] A mag tiszta függvényeket tartalmaz: nem hivatkozik DOM-ra, nem hív adatbázist, nem olvas környezeti változót @L79 `-re, nem hív adatbázist, nem olvas környezeti változót. Ha egy score-nak adat kell,`
- [C8] [CONFIRMED] Méretérv az egyfájlos ellen: a v16 1,09 MB ~200 változóval, az OGDOC ~2200 változóval és 19 modullal több megabájt lenne @L87 `1. **A méret.** A v16 ma 1,09 MB, ~200 változóval. Az OGDOC ~2200 változóval, 19 modullal,`
- [C9] [CONFIRMED] Az offline igényt a platform PWA-rétege adja, nem a fájlformátum @L95 `platform PWA-rétege adja (service worker, IndexedDB queue), nem a fájlformátum.`
- [C10] [CONFIRMED] A tároláshoz három új oszlop kell a meglévő táblában, nem új adatmodell @L117 `**Ez három oszlop, nem új adatmodell.**`
- [C11] [NEEDS_AGENT] Három tárolási alak van: `fact`, `series` és `event` — nem több @semantic L119-137
- [C12] [CONFIRMED] A burok `t` mezője azt jelöli, mikor VONATKOZIK az érték, nem mikor írták be @L145 `  "t": "2026-09-01T14:22:00Z",   // mikor VONATKOZIK rá (nem mikor írták be)`
- [C13] [CONFIRMED] Hiányzó bemenetnél a score nem számol: nem tesz be nullát és nem hagyja ki a tagot @L162 `Ha egy score-nak hiányzik egy bemenete, **nem számol**. Nem tesz be nullát, nem tesz be`
- [C14] [CONFIRMED] Minden score-eredmény mellé lementődik a bemeneti pillanatkép, amiből számolt @L169 `Ugyanígy: minden score-eredmény mellé lementjük azt a bemeneti pillanatképet, amelyből számolt.`
- [C15] [CONFIRMED] Referencia-fixture nélküli score nem kerül be a rendszerbe @L206 `nincs referencia-fixture, nem kerül be.**`
- [C16] [CONFIRMED] Az érvényességi ablak kontextusfüggő: a vérnyomás ambulánsan 7 nap, vajúdás alatt 4 óra @L214 `| Vérnyomás | 7 nap | 4 óra |`
