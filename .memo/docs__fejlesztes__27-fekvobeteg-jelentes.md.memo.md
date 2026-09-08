---
source: docs/fejlesztes/27-fekvobeteg-jelentes.md
sha256: 90e28023dbcb629d53c97af11bc38c3edf21b6f52577b1e61fe3d75c61a33b66
lines: 173
profile: prose
generator: subagent
raw_tokens_est: 1926
verified: 16 confirmed
---

# docs/fejlesztes/27-fekvobeteg-jelentes.md

## Topics
- L1-8: A réteg mondata: kitölthetőséget mond, értéket nem
- L9-37: A 746 bájtos rekordkép mint kapu és a kódalak eldöntése
- L38-130: Diagnózis-típusjelek kötelezettségei, szülés kódolása, a besorolás elutasítása
- L131-173: Kiadásfüggő HBCS-súlyszámok és az elfogadási kritériumok tesztként

## Claims

- [C1] [CONFIRMED] A réteg azt mondja meg, hogy a jelentés kitölthető-e, azt nem, hogy mennyit ér @L3 `> **Megmondja, hogy a jelentés kitölthető-e. Nem mondja meg, mennyit ér.**`
- [C2] [CONFIRMED] A jelentés fix hosszúságú, 746 bájtos rekord, ezért egy karakterrel hosszabb kód az egészet elcsúsztatja @L11 `A fekvőbeteg-jelentés **fix hosszúságú, 746 bájtos** rekord: minden mező adott`
- [C3] [CONFIRMED] A BNO mezőhossza 5, ezért a jelentési alak O1410, nem O141 @L20 `| 5 | a jelentési alak **O1410**, nem O141 |`
- [C4] [CONFIRMED] A 74.10 alak éppen öt karakter, ezért a hosszellenőrzés nem fogja meg — az alakellenőrzés igen @L23 `**Éppen öt karakter** — ezért a`
- [C5] [CONFIRMED] A rekordkép JSON-ból jön, nem kódból, mert a NEAK-útmutató évente változik @L33 `-ból jön, nem kódból: a NEAK`
- [C6] [CONFIRMED] Az alapbetegség típusjeléből pontosan egynek kell lennie, mindig @L46 `| alapbetegség | **pontosan 1** | mindig |`
- [C7] [CONFIRMED] A hiányzó ápolást indokoló fődiagnózist a rendszer megnevezi, de nem találja ki @L62 `  meghatározása kötelező — a rendszer NEM találja ki.`
- [C8] [CONFIRMED] Az undetermined állapot nem blokkol: a jelentés beadható, csak a teljesség nem ismert @L77 `**nem blokkol**: a jelentés beadható, csak nem tudjuk, teljes-e.`
- [C9] [CONFIRMED] Császármetszés-beavatkozás és hüvelyi szülés fődiagnózis ellentmondását a rendszer nem javítja ki, hanem blokkolja @L100 `  fődiagnózis (O8090) nem császármetszéses szülést jelöl. A rendszer NEM`
- [C10] [CONFIRMED] A patológiás terhességi diagnózis csak 12 napot meghaladó megelőző ellátás mellett vehető figyelembe; adat híján undetermined @L112 `megelőző** ellátási idő meghaladta a 12 napot. Ha ez az adat nincs meg, a`
- [C11] [CONFIRMED] Az ellenőrzések HBCS-csoportot soha nem rendelnek hozzá — a false itt típusszintű @L124 `checkRecord(...).assignsHbcs    // false — mindig`
- [C12] [CONFIRMED] Ugyanaz a HBCS-csoportkód kiadásonként más súlyszámot ér: a 671A 1,53177 és 1,74947 @L135 `| 1,53177 | 1,74947 |`
- [C13] [CONFIRMED] A súlyszám a betöltött kiadások közül az ellátás napja szerint választódik ki @L140 `és a választás az **ellátás`
- [C14] [CONFIRMED] Ha egyik betöltött kiadás sem érvényes az adott napra, a rendszer nem a legközelebbivel számol @L154 `érvényes. […] A rendszer NEM a legközelebbi kiadással számol helyette: az`
- [C15] [CONFIRMED] A réteget 21 teszt fedi a test/fekvojelentes.test.ts fájlban @L160 ` — 21 teszt. A fontosabbak:`
- [C16] [CONFIRMED] A rekordba 16 diagnózisnál több nem fér be, és a kimaradó társult betegség alacsonyabb csoportot ad @L167 `| 16 diagnózisnál több nem fér be | és ez **elmaradt bevétel** is: a kimaradó társult betegség alacsonyabb csoportot ad |`
