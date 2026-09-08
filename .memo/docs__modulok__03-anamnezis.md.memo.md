---
source: docs/modulok/03-anamnezis.md
sha256: bc7b94bfb2f0c4a77586c53ef858973859d6ce862cc4238c13429859f003f7e8
lines: 169
profile: prose
generator: subagent
raw_tokens_est: 2103
verified: 2 confirmed
---

# docs/modulok/03-anamnezis.md

## Topics
- L1-157: Az anamnézis-modul: háromállású válasz, családfa, IPRACS FIX-mezők, kockázatbecslők
- L158-169: Elfogadási kritérium és a foglalkozás-egészségügyi lap nyitott kérdése

## Claims

- [C1] [CONFIRMED] A „nem tudom" válasz nem hiányzó adat, hanem rögzített ismerethiány, amit a kockázatbecslés másképp kezel @L20 `nem hiányzó adat, hanem **rögzített ismerethiány** — klinikailag más, és a kockázatbecslésben is`
- [C2] [PENDING] A score-ok számára az `unk` nem `false`: a score `insufficient`-et ad vagy jelzi a hiányos anamnézist @L56 `A score-ok számára az `unk` **nem `false`**. Ahol egy rizikófaktor ismeretlen, a score vagy`
- [C3] [CONFIRMED] A családfa rokononként tárolja a diagnózis megbízhatóságát (`documented` / `reported` / `suspected`) @L87 `"diagnosisReliability": "reported", // documented | reported | suspected`
- [C4] [PENDING] Megerősített genetikai lelet visszaírja a családfát: a megbízhatóság `reported`-ről `documented`-re vált @L76 `a diagnózis megbízhatósága `reported`-ről `documented`-re vált.`
- [C5] [PENDING] Az IPRACS FIX-mezői nem duplikálódnak, hanem `mirror`/`aliasOf` alakban ugyanarra a változóra mutatnak @L110 `**Ezek nem duplikálódnak: `mirror`-ként (`aliasOf`) kerülnek be.** Egy változó, két helyen`
- [C6] [PENDING] Az asztma-anamnézis a 06. modulban a carboprost abszolút kontraindikációját váltja ki @L139 `| `06` gyógyszerelés | **`hx.sys.asthma` → carboprost abszolút kontraindikáció** |`
- [C7] [PENDING] Elfogadási kritérium: a v16 `id`-listájának hiánytalan, géppel ellenőrizhető leképzése az új `id`-kre @L160 `A v16 `id`-listája hiánytalanul leképződik az új `id`-kre, és a leképezés géppel ellenőrizhető.`
- [C8] [PENDING] A foglalkozás-egészségügyi lap szerkezetileg a 03/04-be illeszthető, de nincs benne a jelenlegi 18 modulban @L168 `örökölt nyitott teendője. Szerkezetileg ebbe és a `04`-be illeszthető, de **nincs benne a`
