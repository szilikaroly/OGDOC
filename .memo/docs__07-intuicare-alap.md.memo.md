---
source: docs/07-intuicare-alap.md
sha256: cb8fb8c1ed68828afdda6d89feccc29d978c9796f9972be0c8acbd7b1d23f69f
lines: 210
profile: prose
generator: subagent
raw_tokens_est: 2945
verified: 7 confirmed
---

# docs/07-intuicare-alap.md

## Topics
- L1-142: A platform leltára, rétegszabályai és a már meglévő klinikai infrastruktúra
- L143-210: A 19. modul készültsége, ami az OGDOC-ra marad, a becslés és az örökölt hibák

## Claims

- [C1] [CONFIRMED] A K0 döntés felülírta a fejezetet: az OGDOC vegyes rendszer, ez a fejezet a leltár marad @L8 `> **2026-09-01 — a K0 döntés felülírta ezt a fejezetet.** Az OGDOC **vegyes rendszer**:`
- [C2] [PENDING] A platform meglévő rétegzése pontosan a DOM-mentes `core/` kérése, ezért nem kell új konvenció @L49 `**Ez a rétegzés pontosan az, amit a `01-architektura.md` „DOM-mentes `core/`" néven kért.**`
- [C3] [PENDING] A `clinical_observations` `effective_ts` mezője azt hordozza, mikor vonatkozik az érték, nem mikor írták be @L65 `| `effective_ts` | **mikor vonatkozik rá** (nem mikor írták be) |`
- [C4] [PENDING] A regiszterhez három oszlop kell: `confidence`, finomított provenance és a `variable_id` @L70 `Amit hozzá kell tenni: **`confidence`** (measured / reported / estimated / uncertain),`
- [C5] [PENDING] A score bemeneti pillanatképe már működik a `clinical_calculator_results` `inputs_json` mezőjével; az `insufficient` állapotot kell hozzátenni @L100 `pillanatképet, amelyből számolt" néven kért. **Már így működik.** Az `insufficient` állapotot`
- [C6] [CONFIRMED] Az ICHOM 108 PROM-tétele adatként kerül be, nem kódként — a 16. modul adatbevitellé redukálódik @L140 `Az ICHOM 108 PROM-tétele ide **adatként** kerül be, nem kódként. Ez a 16. modul munkáját`
- [C7] [CONFIRMED] A 19. modul jogi megfeleltetése kész: minden hivatkozott jogszabályhoz megnevezett tábla vagy trigger tartozik @L159 `**Jogi megfelelőség is meg van feleltetve**: Mt. 134. §, 140–143. §, Eütev. 12/A–12/G., 13/A.,`
- [C8] [PENDING] A projekt magja a regiszter és a levezetési motor: a `fhir-codes.ts` kiterjesztése ~2200 változóra @L176 `| **A regiszter és a levezetési motor** | a `fhir-codes.ts` kiterjesztése ~2200 változóra, `computed`/`prefill`/`mirror` | **a projekt magja** |`
- [C9] [CONFIRMED] Tizenegy modul csak meglévő infrastruktúra konfigurálása és tartalommal töltése, nem építése @L181 `A többi modul (02, 07, 08, 09, 11, 13, 14, 15, 16, 18, 19) **meglévő infrastruktúra`
- [C10] [CONFIRMED] Ebben a fejezetben a becslés kb. 6–8 hónap, mert a webes fázis elmarad @L189 `Reális új becslés: **kb. 6–8 hónap** (ebből egy hónap a két új modul: a 20. lekérdező és a`
- [C11] [CONFIRMED] A modul-audit 2026-06-23-i, kódstatikus, és tizenöt hibát azonosít @L195 `A modul-audit (2026-06-23, kódstatikus) tizenöt hibát azonosít. Ezek közül az OGDOC szempontjából`
- [C12] [CONFIRMED] A BUG-015 és a BUG-009 a Fázis 0 része, kutatási adatgyűjtés nélkülük nem indulhat @L207 `> **BUG-015 és BUG-009 a Fázis 0 része.** Egy kutatási adatgyűjtés nem indulhat el olyan`
