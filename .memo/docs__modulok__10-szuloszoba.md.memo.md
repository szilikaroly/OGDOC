---
source: docs/modulok/10-szuloszoba.md
sha256: 19ba6d135169ceca59e20c4c9b4e40753ed61e3449243a2b635483affd65e282
lines: 345
profile: prose
generator: subagent
raw_tokens_est: 4193
verified: 15 confirmed
---

# docs/modulok/10-szuloszoba.md

## Topics
- L1-158: Vajúdás-idősor, partogram, score-készlet, CORI, és a szepszis-szűrő viselkedési szabályai
- L159-315: Góc-kérdés, hitelesítetlen küszöbök, sorrendi kapu, csomag-időbélyegek, küszöbütközés, kettős számolás
- L316-345: Elfogadási kritérium, CTG-automatizálás korlátai, új nyitott kérdések

## Claims

- [C1] [CONFIRMED] A modul feladata nem fejlesztés, hanem az IPRACS SSOT-konform portolása három architektúrahiba javításával @L18 `**nem fejlesztés, hanem portolás SSOT-konform módon** — és az IPRACS három ismert`
- [C2] [PENDING] A fullPIERS bármely hiányzó bemenetnél `insufficient`-et ad, nem nullát @L88 `**Ha bármelyik bemenet hiányzik → `insufficient`, nem 0.** Ez a rendszer legfontosabb`
- [C3] [CONFIRMED] A CORI 3-as szintje senior orvos tájékoztatását, a 4-es protokoll-beavatkozást írja elő @L103 `3 óvatosság (narancs, **senior orvos tájékoztatása**) · 4 sürgős (piros, protokoll-beavatkozás) ·`
- [C4] [CONFIRMED] Ismeretlen terhességi állapotnál a szepszis-szűrő nem esik vissza csendben a nem terhes küszöbökre @L126 `Ha nem tudjuk, terhes-e, a szűrő **nem esik vissza csendben** a nem terhes`
- [C5] [CONFIRMED] A szepszis-figyelés hatálya a gyermekágy 42. napjáig tart, epizódok közötti hivatkozással @L135 `lezárul és a figyelés meghalna. A hatály ezért a gyermekágy 42. napjáig tart`
- [C6] [CONFIRMED] Hiányzó tételeknél az eredmény nem szűrőnegatív, hanem eldöntetlen (`screenIndeterminate`, `sepsisIndeterminate`) @L151 `Ha két tételből egy teljesül és kettő ismeretlen, az eredmény **nem`
- [C7] [CONFIRMED] A góc-mező `null` értéke nem azt jelenti, hogy nincs góc, hanem hogy a kérdés még nem hangzott el @L165 `azt jelenti, hogy **a kérdés még nem hangzott el**.`
- [C8] [CONFIRMED] A CMQCC-küszöbök másodkézből, `assumed` szinten állnak, ezért a modul egyetlen riasztást sem ad ki @L181 `**egyetlen riasztást sem ad ki**. Ugyanaz a kapu, mint a normogramoknál — a`
- [C9] [CONFIRMED] A hemokultúra-antibiotikum sorrendi kapu nem hard-stop: rögzíti a megfordult sorrendet és az árát @L199 `De a sorrendi kapu **nem hard-stop**. Ha a hemokultúra késne, az antibiotikum`
- [C10] [PENDING] Az `overdue` állapot csak azt jelenti, hogy lejárt és nincs rögzítve — nem azt, hogy nem történt meg @L218 `| `overdue` | lejárt, és nincs rögzítve — **ez nem azt jelenti, hogy nem történt meg** |`
- [C11] [CONFIRMED] A CMQCC-szűrő és az omqSOFA eltérő küszöbeit a rendszer mindkettőt megnevezve tartja meg, egyiket sem csendesíti el @L255 `forrásával együtt, és egyiket sem csendesíti el a másikkal.** A validátor`
- [C12] [CONFIRMED] A MAP szándékosan hiányzik a szervi elégtelenség készletéből, mert levezetett érték és kétszer vinné a küszöböt @L262 `A szervi elégtelenség készletéből **szándékosan hiányzik az artériás`
- [C13] [CONFIRMED] Elfogadási kritérium: a vajúdás-idősor túléli az oldalbetöltést — ez az IPRACS legfőbb hibája @L318 `A vajúdás-idősor **túléli az oldalbetöltést** (ez az IPRACS legfőbb hibája). A Bishop egyetlen`
- [C14] [PENDING] A kritériumot a `test/szuloszoba.test.ts` teszt kényszeríti ki @L322 `> **Ez teszt, nem ígéret:** [`test/szuloszoba.test.ts`](../../test/szuloszoba.test.ts) —`
- [C15] [CONFIRMED] A CTG-variabilitás és az acceleráció klinikusi megítélés marad, automatizálni nem szabad @L329 `deceleráció típusa automatikus. Ez így helyes, és nem szabad automatizálni.`
- [C16] [CONFIRMED] A NICHD-besorolás variabilitás nélkül nem születik meg, időszakos hallgatózásból pedig egyáltalán nem @L331 `**Megvalósítva:** a NICHD-besorolás variabilitás nélkül nem születik meg, és időszakos`
- [C17] [CONFIRMED] A CMQCC-stádium azért áll kapu mögött, mert a stádiumhatárok és a 300 mL-es küszöb összeillesztése saját munka @L342 `nem azért, mert a számok bizonytalanok, hanem mert az ÖSSZEILLESZTÉS a miénk.`
- [C18] [CONFIRMED] A VBAC-kalkulátor együtthatói hiányoznak, és a régi, etnikai tagot tartalmazó képlet visszaállítása nem opció @L344 `a rendszer nem ad számot, és a régi, etnikai tagot tartalmazó képlet visszaállítása nem`
