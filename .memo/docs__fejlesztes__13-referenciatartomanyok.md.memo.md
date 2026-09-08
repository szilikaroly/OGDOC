---
source: docs/fejlesztes/13-referenciatartomanyok.md
sha256: 0e203712942b487f3b34f30bab82ffebd894dfa2f307a827f2bb187a44583247
lines: 240
profile: prose
generator: subagent
raw_tokens_est: 2935
verified: 26 confirmed
---

# docs/fejlesztes/13-referenciatartomanyok.md

## Topics
- L1-49: A domain és a reference különbsége, a két alapszabály hiányzó kontextusra
- L50-125: Jelzés kontra kapu, a választott forrás, a normogram-motor és telepítése
- L126-155: Helyi (öngeneráló) normogram négy szabálya és miért ad percentilist
- L156-199: Személyre szabott normogram, etnikum kihagyása, hibrid nézet
- L200-240: Szűrési esedékesség hat állapota és a hátralévő munkák

## Claims

- [C1] [CONFIRMED] A domain a rögzíthetőség határa, a reference ettől külön a klinikai olvasat @L9 `**rögzíthetőség** határa: mi az, ami egyáltalán beírható.`
- [C2] [CONFIRMED] Ismeretlen terhességi állapotnál a referenceFor unavailable állapotot ad, a nem terhes tartomány nem alapértelmezés @L28 `// { status: "unavailable", missing: ["ctx.pregnant"],`
- [C3] [CONFIRMED] Ismeretlen trimeszternél az interpret akkor válaszol, ha minden szóba jövő trimeszter szerint azonos az olvasat @L41 `agreedAcrossTrimesters: true`
- [C4] [CONFIRMED] Ha a trimeszterek olvasata eltérne, az eredmény unknown, a hiányzó ctx.ga megnevezésével @L42 `{ status: "unknown", missing: ["ctx.ga"] }`
- [C5] [CONFIRMED] Ellenőrizetlenül a kalkulátor és a normogram kapu, a referenciatartomány viszont csak jelzés @L61 `| **Ellenőrizetlenül** | **kapu** | jelzés | **kapu** |`
- [C6] [CONFIRMED] A terhességi labor-referenciák választott forrása Abbassi-Ghanavati és mtsai (2009) @L73 `Abbassi-Ghanavati és mtsai (2009).`
- [C7] [CONFIRMED] A normogram-motor a tábla szélén túl nem extrapolál @L85 `1. **Nincs extrapoláció.** A tábla szélén túl nem számolunk.`
- [C8] [CONFIRMED] Nem primary hitelesítésű tábla teljes bemenettel sem ad percentilist @L87 `2. **Nincs ellenőrizetlen tábla.**`
- [C9] [CONFIRMED] Több betöltött normogram esetén a motor nem választ magától, hanem kéri a forrást @L91 `**nem választ magától** — kéri, melyiket.`
- [C10] [CONFIRMED] A telepítés és a hitelesítés szándékosan két külön művelet; a telepített tábla assumed szinten áll @L117 `**A telepítés és a hitelesítés két külön művelet, szándékosan.**`
- [C11] [CONFIRMED] A generátor kizárási szabályokat vár, és hiányukban figyelmeztet, különben a kóros lesz a norma @L137 `kóros lesz a norma. A generátor ezért kizárási szabályokat vár, és hiányuk`
- [C12] [CONFIRMED] A minPerBin alatti sávok futásidőben sem adnak eredményt, nem csak generáláskor @L141 `adnak eredményt — nem csak a generáláskor.`
- [C13] [CONFIRMED] A telepítő megtagadja a helyi tábla hitelesítését, az sosem lesz primary @L144 `kifejezetten megtagadja a hitelesítését.`
- [C14] [CONFIRMED] Egyedi mérés a helyi táblából nem rekonstruálható, a kimenet csak összesített szám @L147 `mérés a táblából nem rekonstruálható.`
- [C15] [CONFIRMED] A helyi tábla — az ellenőrizetlen publikálttal szemben — ad percentilist @L149 `Cserébe a helyi tábla — szemben az ellenőrizetlen publikálttal — **ad**`
- [C16] [CONFIRMED] A customised normogramnak nincs saját táblája: publikált alapot igazít demográfiai tagokkal @L159 `**nincs saját táblája**: egy publikált`
- [C17] [CONFIRMED] Az igazítás tételesen látszik: melyik adat mekkora hatással tolta el az eredményt @L169 `Az igazítás **tételesen látszik**: melyik adat mennyit tolt rajta. Egy`
- [C18] [CONFIRMED] Hiányzó demográfiai adatnál a motor nem esik vissza csendben az igazítatlan értékre @L172 `**Hiányzó demográfiai adatnál nem esünk vissza csendben** az igazítatlan`
- [C19] [CONFIRMED] Az etnikumot szándékosan kihagyták a modellből, GDPR-különleges adat és besorolása benyomáson múlik @L176 `> **Amit szándékosan kihagytunk: az etnikum.**`
- [C20] [CONFIRMED] Az evaluateHybrid mindhárom olvasatot egyszerre adja vissza, és nem választ a klinikus helyett @L192 `**Nem választunk a klinikus helyett.**`
- [C21] [CONFIRMED] A szűrési szabály adat és nem kód, ezért új szűrés felvétele nem kíván fejlesztést @L202 `a szabály **adat**, nem kód: egy új szűrés felvétele nem`
- [C22] [CONFIRMED] Az unknown állapot azt jelenti, hogy a szabály feltételéhez szükséges adat hiányzik, nem azt, hogy a szűrés nem vonatkozik rá @L209 `azt jelenti, hogy a szabály feltételéhez **szükséges adat`
- [C23] [CONFIRMED] Részlegesen rögzített OGTT mellett a szűrés due marad, nem elvégzett @L216 `- **A részleges vizsgálat nem elvégzett.**`
- [C24] [CONFIRMED] Az elmulasztott szűrési ablak overdue marad, nem lesz notApplicable @L219 `- **Az elmulasztott ablak nem tűnik el.**`
- [C25] [CONFIRMED] Az esedékesség kétféle alapon mérhető: gesztációs hét vagy betegéletkor @L223 `Az esedékesség két különböző alapon mérhető`
- [C26] [CONFIRMED] A motor ma csak az átlag+szórás alakot ismeri, az LMS-módú normogram hátravan @L238 `utóbbit ismeri; a bővítés az adatszerkezetet érinti, a kapukat nem.`
