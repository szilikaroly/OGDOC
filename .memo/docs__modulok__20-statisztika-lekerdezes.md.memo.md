---
source: docs/modulok/20-statisztika-lekerdezes.md
sha256: 2755ed98eb77a852929d6397eb3d3ab580a33c486ff04bb71d64029095c6886b
lines: 275
profile: prose
generator: subagent
raw_tokens_est: 3077
verified: 15 confirmed
---

# docs/modulok/20-statisztika-lekerdezes.md

## Topics
- L1-41: A lekérdezőmodul célja és a változóregiszter mint előfeltétel
- L42-197: On-click mezőkijelölés, szűrőfa, kohorsz-verziózás, statisztika, tudományos védőkorlátok
- L198-275: k-anonimitás, reprodukálhatósági kísérőlap, jogosultság, elfogadás, nyitott kérdések

## Claims

- [C1] [CONFIRMED] A lekérdezőmotor maga új fejlesztés, csak a mentett nézetek és aggregátum-nézetek mintája van meg @L17 `**A lekérdezőmotor maga új.**`
- [C2] [CONFIRMED] A regiszter miatt minden új változó automatikusan lekérdezhetővé válik, kézi mezőlista nélkül @L38 `regiszterrel **magától adódik**, és minden új változó automatikusan lekérdezhetővé válik.`
- [C3] [CONFIRMED] A modul alapja a 3. fázisban, teljes alakja az 5. fázisban készül @L8 `| **Fázis** | 3 (alap) → 5 (teljes) |`
- [C4] [CONFIRMED] A mezőre kattintás a regiszter-definíciót viszi át a szerkesztőbe, nem a konkrét értéket, ezért tudja a rendszer, milyen operátort kínáljon @L58 `definícióját** viszi át, nem a konkrét értéket — így a szerkesztő tudja, milyen operátorokat`
- [C5] [CONFIRMED] `tristate` változónál a „nem tudom" önálló szűrhető érték, nem üres mező @L67 `**a „nem tudom" önálló érték**`
- [C6] [CONFIRMED] A lekérdezés mellé mentődik a regiszter-verzió és a futtatás dátuma, mert regiszterváltozás után a korábbi eredmény nem összehasonlítható @L136 `fél évvel korábbi lekérdezés eredménye **nem összehasonlítható** a mostanival.`
- [C7] [CONFIRMED] Szándékosan nincs beépített hipotézisteszt (t-próba, χ², logisztikus regresszió), mert kattintható p-érték p-hackinget termelne @L155 `**Nincs beépített hipotézisteszt egy gombra.** Se t-próba, se χ², se logisztikus regresszió.`
- [C8] [CONFIRMED] A kutatási lekérdezés feltáró vagy hipotézisvizsgáló módban indul, és a kettő nem keverhető @L183 `A kettő nem keverhető.`
- [C9] [CONFIRMED] Minden statisztikai kimenet mellett kötelezően megjelenik az n, a hiányzó adatok aránya és a „nem tudom" válaszok száma @L188 `Minden statisztikai kimenet mellett kötelezően megjelenik:`
- [C10] [CONFIRMED] A k-anonimitási küszöb alapértelmezése 5; az az alatti cellát a rendszer nem mutatja meg @L201 `(alapértelmezés: 5), a rendszer **nem mutatja meg** az értéket`
- [C11] [CONFIRMED] A `phi: true` változók a lekérdezőben meg sem jelennek @L205 `változók a lekérdezőben **nem is jelennek meg**.`
- [C12] [CONFIRMED] Minden exporthoz automatikusan generálódik reprodukálhatósági kísérőlap (lekérdezés, regiszter-verzió, hiányzó adat, kizárások) @L209 `Minden exporthoz automatikusan generálódik egy kísérőlap:`
- [C13] [CONFIRMED] A lekérdezés futtatása auditált: ki, mikor, milyen szűrővel és hány esetre @L236 `A lekérdezés futtatása **auditált**: ki, mikor, milyen szűrővel, hány esetre.`
- [C14] [CONFIRMED] A szűrőfa szerveroldalon, paraméterezve fordul Postgres-lekérdezéssé, sosem string-konkatenációval @L268 `**SQL-injekció ellen a fa sosem string-konkatenációval fordul.**`
- [C15] [CONFIRMED] A k-anonimitási küszöb értéke intézményi és etikai bizottsági döntés, nem fejlesztői @L271 `**A k-anonimitási küszöb értéke** (alapértelmezés 5) intézményi és etikai bizottsági`
