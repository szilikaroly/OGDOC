---
source: docs/modulok/14-zarojelentes.md
sha256: d1717cac900d4932741c1e38c6208a61e0957ea5a88f21e9e096defe5c9e179a
lines: 107
profile: prose
generator: subagent
raw_tokens_est: 1407
verified: 3 confirmed
---

# docs/modulok/14-zarojelentes.md

## Topics
- L1-107: A zárójelentés összeállítása más modulok kimenetéből, blokkállapotok, hitelességi kapu, FHIR- és UCUM-korlátok

## Claims

- [C1] [CONFIRMED] A modul nem gyűjt adatot: ha itt bármit be kell írni, az a korábbi modulok hibája @L18 `kódolásból áll össze. Ha itt bármit be kell írni, az hiba a korábbi modulokban.`
- [C2] [PENDING] Minden blokk állapota `filled`, `missing` vagy `notApplicable`, és a harmadik csak rögzített tényből jöhet @L64 `Minden blokknak három állapota van: `filled` · `missing` · `notApplicable` — és a harmadik`
- [C3] [CONFIRMED] A hitelesség negyedik feltétele (hitelesített felhasználói azonosítás) ma mindenkinél zárva van, mert az aláírás szabad szöveg @L81 `A negyedik feltétel a lényeg, és ma MINDENKINÉL zárva van. Az aláírás mező szabad szöveg:`
- [C4] [PENDING] A figyelmeztetés a nyomtatott dokumentum elején áll és a FHIR-exportban is (`status: "preliminary"`, `meta.tag`) @L87 `láblécben, és a FHIR-exportban is (`status: "preliminary"`, `meta.tag`). A papír kimegy a`
- [C5] [PENDING] A FHIR `Composition` kimenet nincs FHIR-validátorral szembefuttatva @L95 `**A FHIR-kimenet nincs konformancia-ellenőrizve.** A `Composition` nem volt FHIR-validátorral`
- [C6] [CONFIRMED] A generált blokk nem tárolódik, mert tárolva a következő adatmódosítás után hazudna @L106 `keletkezik: maga a dokumentum. Ez 19 mező. A generált blokk NEM tárolódik — ha tárolnánk, a`
