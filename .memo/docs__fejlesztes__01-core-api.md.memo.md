---
source: docs/fejlesztes/01-core-api.md
sha256: 520c1310153c7a4608af162d5f00ad57693373e90ac355da393c17b8a2994c6f
lines: 436
profile: prose
generator: subagent
raw_tokens_est: 5263
verified: 20 confirmed, 1 needs_agent
---

# docs/fejlesztes/01-core-api.md

## Topics
- L1-41: a mag felépítése, fájlszerkezet és a körmentes rétegzés
- L42-189: a szótár típusai — VariableDef, DataType, Value, Provenance, ScoreResult, Registry-validálás
- L190-341: kalkulátor-szerződés és futtatás, a három levezetési mechanizmus, írási út, gráf
- L342-436: bővítési tiltások, napló/kripto/naplózás/interop/szepszis függvények, tesztelés

## Claims

- [C1] [CONFIRMED] A mag DOM- és adatbázis-mentes tiszta függvényekből áll, ezért Node, böngésző és Worker alatt ugyanaz fut @L3 `A mag **DOM-mentes és adatbázis-mentes**: tiszta függvények`
- [C2] [CONFIRMED] Az I/O egyetlen helyre van szorítva a magban @L11 `az EGYETLEN hely, ahol I/O történik`
- [C3] [NEEDS_AGENT] A resolve azért külön fájl, hogy a futtató és a motor közt ne keletkezzen körkörös import @semantic L34-36
- [C4] [CONFIRMED] A consumers mező generált; kézzel kitöltve build-figyelmeztetést ad @L63 `**GENERÁLT.** Kézzel kitöltve build-figyelmeztetés.`
- [C5] [CONFIRMED] A háromállású típusnál a „nem tudom" önálló érték, nem hiányzó adat @L78 `önálló érték, nem hiányzó adat.`
- [C6] [CONFIRMED] A vonatkozási idő és a rögzítés ideje elkülönül, ezért a visszamenőleg beírt mérés a saját idejéhez képest avul @L105 `ma írnak be, tegnapi értékként avul el`
- [C7] [CONFIRMED] A feloldás először a proveniencia-rangot nézi, ezért régi eszközadat nem írhat felül friss klinikusi korrekciót @L120 `Ezért nem tud egy régi eszközadat felülírni egy`
- [C8] [CONFIRMED] Build-hiba, ha két primer változó ugyanarra a LOINC-kódra mutat tükrözés nélkül @L163 `két primer változó ugyanarra a LOINC-kódra,`
- [C9] [CONFIRMED] Ez a szabály örökölt hibára válasz: a v16-ban a méhszáj-tágulat három önálló mezőben szerepelt @L167 `a v16-ban a méhszáj-tágulat **három`
- [C10] [CONFIRMED] A lejárt érték a kalkulátor számára ugyanúgy hiányzik, mint a nem létező @L194 `a LEJÁRT érték ugyanúgy hiányzik, mint a nem létező`
- [C11] [CONFIRMED] A verifikációs kapu a számítás előtt fut, így ellenőrizetlen képlet soha nem termel értéket @L208 `**a kapu a számítás előtt van.**`
- [C12] [CONFIRMED] Az egység-eltérés a használt kalkulátoroknál hiba, nem figyelmeztetés, mert némán rossz eredményt ad @L215 `ezért hiba, nem figyelmeztetés.`
- [C13] [CONFIRMED] Az előtöltési kapu a „nem tudom" válaszra nem tüzel, mert az kevés egy hard-stophoz @L287 `nem elég egy hard-stop kapu meghúzásához.`
- [C14] [CONFIRMED] Újraszámításkor hiányzó bemenetnél a mező eltűnik, nem nullázódik @L295 `a mező eltűnik, mert a hiányzó adat`
- [C15] [CONFIRMED] A topologikus sorrend körre kivételt dob, és felsorolja a kör tagjait, így a build száll el, nem a felhasználó @L310 `**kivételt dob körre**, és felsorolja a kör tagjait.`
- [C16] [CONFIRMED] A napló visszajátszása szándékosan nem ellenőrzi a láncot, azt a hívónak kell eldöntenie @L367 `szándékosan nem ellenőrzi a láncot.**`
- [C17] [CONFIRMED] A kriptográfiai törlés nem nyugtáz, amíg egyetlen kulcsmásolat is él @L377 `**nem mond igent, amíg egy kulcsmásolat is él**`
- [C18] [CONFIRMED] A betegpárosításban a név nem független azonosító @L393 `**a név nem független azonosító**`
- [C19] [CONFIRMED] A kimenő újrapróbálkozás sorozatának a vége ember @L396 `— a sorozat vége ember`
- [C20] [CONFIRMED] A tesztkészlet 40 golden tesztből áll tizenegy csoportban @L411 `**40 golden teszt** tizenegy csoportban.`
- [C21] [CONFIRMED] A golden tesztek a definíció klinikai helyességét nem bizonyítják; a fullPIERS pontosan ezen bukott el @L436 `klinikai átvétel dönti el — a fullPIERS pontosan ezen bukott el.`
