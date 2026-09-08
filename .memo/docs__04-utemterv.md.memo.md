---
source: docs/04-utemterv.md
sha256: 0c1ef0e3bba6c7947570d08d823240515742467c331014760c56b4c36fdc9ea4
lines: 319
profile: prose
generator: subagent
raw_tokens_est: 5981
verified: 16 confirmed
---

# docs/04-utemterv.md

## Topics
- L1-70: Az alapfeltevés változása, a prioritás képlete, a kutatási cél és a platform átrendező hatása
- L71-180: A pozicionált igénylista pontszámokkal és fázisokkal, és amit a lista megmutat
- L181-319: A hat fázis tartalma és elfogadási kritériumai, teljes becslés, párhuzamos sávok

## Claims

- [C1] [CONFIRMED] 2026-09-01-től az OGDOC az IntuiCare platform klinikai kiterjesztése, és ez elhagyja a webes fázist @L5 `> 407 server function). Ez két dolgot csinál az ütemtervvel: **elhagyja a webes fázist**`
- [C2] [CONFIRMED] Az új összbecslés kb. 10–13 hónap, a hangsúly infrastruktúráról tartalomra tolódik @L9 `> Az új összbecslés: **kb. 10–13 hónap**, és a hangsúly áttolódik`
- [C3] [CONFIRMED] A prioritás számított: (K × F) / R, nem vélemény @L29 `**Prioritás = (K × F) / R.** Ami magas K-jú és magas F-ű, de olcsó, az megy előre — akkor is, ha`
- [C4] [CONFIRMED] Az export a 4. fázisból a 2. fázisba került, mert a kutatási cél maga @L39 `| Export (ICHOM CSV, REDCap, FHIR) | Fázis 4 | **Fázis 2** | Egy kutatási eszköz, amiből nem lehet kinyerni az adatot, használhatatlan. Ez nem kényelmi funkció, hanem a cél maga. |`
- [C5] [PENDING] A pszeudonimizálás korábban nem szerepelt, most Fázis 0 tétel @L40 `| Pszeudonimizálás + `phi` jelölés az exportban | nem szerepelt | **Fázis 0** | A TAJ közvetlen azonosító. Utólag kiszűrni a már gyűjtött adatból nem megbízható. |`
- [C6] [CONFIRMED] Az MDR-megfelelőségi munka kikerül a hatókörből, csak a forrás- és változáskövetési fegyelem marad, az viszont Fázis 0 @L44 `**kikerül a hatókörből**. Ami marad belőle, az a forrás- és változáskövetési fegyelem — az`
- [C7] [CONFIRMED] Az A10 (platform-audit és BUG-015) a legmagasabb prioritású tétel, 25.0-val, Fázis 0-ban @L84 `| A10 | **Platform-audit + BUG-015 (tenant-bootstrap) javítása** | 5 | 5 | 1 | **25.0** | 0 |`
- [C8] [CONFIRMED] A webes portolás (H1) törölve, mert a platform megvan @L116 `| ~~H1~~ | ~~Webes portolás~~ — **törölve**: a platform megvan | — | — | — | — | — |`
- [C9] [CONFIRMED] A legmagasabb prioritású tételek mind alapozás, nem klinikai tartalom @L161 `(ellátási kontextus), **A12** (azonosító- és szinkron-táblák) — mind **alapozás**, nem klinikai`
- [C10] [CONFIRMED] Az A10 blokkoló: kutatási adatgyűjtés nem indulhat el nyitott tenant-bootstrap mellett @L166 `regiszter ráüljön. Ez olcsóbb, de nem elhagyható — **A10 blokkoló**: kutatási adatgyűjtés nem`
- [C11] [CONFIRMED] A kockázat súlypontja áttolódott: a fő veszély, hogy a 2200 változó klinikai dokumentációja nem készül el @L170 `válik, ha az alap nem áll. Most az, hogy **a 2200 változó klinikai dokumentációja nem készül el** —`
- [C12] [CONFIRMED] A 10–13 hónapos becslés egy fejlesztőre szól, a 15 hónapos naptári terv kb. 2,3 FTE-t feltételez @L176 `> terv kb. **2,3 FTE-s csapatot** feltételez, mert a klinikai tartalom, az integráció és a`
- [C13] [CONFIRMED] A Fázis 0 elfogadási kritériuma tartalmazza a BUG-015 javítását @L205 `kör van; és **BUG-015 javítva** — kutatási adatgyűjtés ezen a hibán nem indulhat el.`
- [C14] [PENDING] A Fázis 2 klinikai kritériuma, hogy hiányzó AST mellett a fullPIERS `insufficient`-et írjon ki, ne 0-t @L227 `laborból és a vitálisokból magától feltöltődik, és a hiányzó AST miatt `insufficient`-et ír ki,`
- [C15] [CONFIRMED] Mintát gyűjteni írott eljárás (SOP) nélkül nem szabad @L235 `(SOP-01…14) megírva — **mintát gyűjteni írott eljárás nélkül nem szabad.**`
- [C16] [CONFIRMED] A Fázis 3 elfogadási kritériuma egyetlen teszt: az anamnézisben bejelölt asztma megállítja a carboprost rendelését @L248 `**Elfogadási kritérium:** az anamnézisben bejelölt asztma a szülőszobán megállítja a carboprost`
- [C17] [CONFIRMED] A Fázis 0–3 után (kb. 4–5 hónap) önállóan használható, kutatási adatot termelő eszköz van @L301 `A **Fázis 0–3 (kb. 4–5 hónap)** után önállóan használható eszköz van, ami a v16 és az IPRACS`
- [C18] [CONFIRMED] A biobanki nyilatkozat jóváhagyása blokkolja az első mintavételt, határideje a Fázis 1 vége @L314 `| **A biobanki nyilatkozat jóváhagyása** (DPO, jogász, etikai bizottság) | Fázis 1 végéig | **ez blokkolja az első mintavételt** — a v16 óta nyitott |`
