---
source: docs/06-webes-migracio.md
sha256: 92d4dcf70fb59b9a1b045f5c3f25fa815b5d4263b2e56fcefb63aa8282c11e28
lines: 83
profile: prose
generator: subagent
raw_tokens_est: 979
verified: 5 confirmed
---

# docs/06-webes-migracio.md

## Topics
- L1-83: A tárgytalanná vált webes migrációs terv, és a belőle megmaradt két megállapítás

## Claims

- [C1] [CONFIRMED] A fejezet történeti: a webes migráció tárgytalan, mert a rendszer eleve a platformon épül @L5 `> alapján. Az IntuiCare platform megjelenésével a migráció tárgytalan: **a rendszer eleve a`
- [C2] [CONFIRMED] A Lovable-specifikáció négytáblás sémája a szülőszobára készült, az OGDOC hatókörébe nem fér bele @L22 `A specifikáció négy táblája a szülőszobára készült. Az OGDOC 19 modulja, ~2200 változója és a`
- [C3] [CONFIRMED] A kézzel karbantartott `PatientFixData`-szerű interfész 2200 változóra nem skálázódik @L35 `Ez a szülőszobára működik. **2200 változóra nem.** Egy kézzel karbantartott interfész ekkora`
- [C4] [CONFIRMED] A megoldás: a regiszterből generált TypeScript típusok, egyetlen forrással, fordítási hibával a nem létező változóra @L48 `A TypeScript ugyanazt a garanciát adja, mint a kézzel írt interfész — de a forrás egy hely`
- [C5] [CONFIRMED] A specifikáció RLS-szabálya egyfelhasználós volt: csak az látta az esetet, aki rögzítette — szülőszobán használhatatlan @L59 `Ez azt jelentette volna, hogy **csak az látja az esetet, aki rögzítette**. Egy szülőszobán, ahol`
- [C6] [PENDING] A megmaradt szabály: a generátor a `routes/` és `components/` réteget írhatja, a klinikai magot nem @L80 `> **A generátor a `routes/` és `components/` réteget írhatja. A `src/lib/ogdoc/`-ot nem.**`
