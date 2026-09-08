---
source: docs/modulok/13-ellatas-tervezes.md
sha256: b11fcba5cae24b522d7f7d239a1bc41b6cdfba22f8d7ab2c47eabcb848c59971
lines: 131
profile: prose
generator: subagent
raw_tokens_est: 1682
verified: 4 confirmed
---

# docs/modulok/13-ellatas-tervezes.md

## Topics
- L1-131: Vizitrend-generálás rizikó szerint, szülésmód-döntés, konzílium-javallatok, protokoll-verziózás

## Claims

- [C1] [CONFIRMED] A szülésmód kérdésében a modul nem dönt: a kockázatokat mutatja, a közös döntést indoklással rögzíti @L48 `A modul **nem dönt**. Megjeleníti mindkét út számszerű kockázatait, dokumentálja a beteg`
- [C2] [CONFIRMED] Két rizikófaktor ugyanarra a hétre nem kettőz vizitet, csak indoklást @L90 `rizikófaktor ugyanarra a hétre **nem kettőz vizitet, csak indoklást**: a beteg egyszer jön be,`
- [C3] [CONFIRMED] A jogszabályi vizitrend padló: a rizikófaktor sűríthet, de nem ritkíthat, mert a módosítónak nincs `removes` mezője @L98 `**1. A jogszabályi alap PADLÓ, és ezt a szerkezet tartja meg.** A rizikófaktor sűríthet, de`
- [C4] [PENDING] Az alaptábla `assumed` szintű, ezért a terv tervezésre használható, elmulasztott vizit megállapítására nem (`canAssertMissed`) @L106 `terv **tervezésre használható, elmulasztott vizit megállapítására nem** (`canAssertMissed`).`
- [C5] [CONFIRMED] Hiányzó rizikóadat nem alacsony kockázat: a rendszer előzetes tervet ad, megnevezve a ki nem zárt rizikót @L110 `A modul legfontosabb szabálya viszont nem ez, hanem a szokásos: **a hiányzó rizikóadat nem`
- [C6] [PENDING] A vizitrend nem lehet `computed` változó, mert motor adja indoklással ellátott listaként, nem levezetés @L118 `**A vizitrend nem lehet `computed` változó**, ahogy a fenti 2. pont vázolta. A`
