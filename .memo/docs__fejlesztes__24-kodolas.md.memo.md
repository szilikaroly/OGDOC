---
source: docs/fejlesztes/24-kodolas.md
sha256: 74326098017b060ff5d47ba5afe9dbaca33d09f1b78fe8a19ef14ffab08c9a20
lines: 190
profile: prose
generator: subagent
raw_tokens_est: 2243
verified: 13 confirmed
---

# docs/fejlesztes/24-kodolas.md

## Topics
- L1-7: A modul kiindulópontja: a kód a rögzített adat következménye
- L8-132: Indoklott kódajánlás, elnyomási lánc, ajánlás kontra döntés, táblakeresés
- L133-190: A HBCS-besorolás kapuja, a megvalósítás tanulságai, tesztek

## Claims

- [C1] [CONFIRMED] A modul abból indul ki, hogy a kód a rögzített adatból következik @L5 `abból indul, hogy **a kód a rögzített adatból következik** — és abból, hogy a`
- [C2] [CONFIRMED] Az ajánlás indoklása megnevezi a változót, a mért értéket és a küszöböt @L12 `// [{ variable: "lab.plt", value: 78,`
- [C3] [CONFIRMED] A súlyosabb kód elnyomja az enyhébbet, de az elnyomott kód a listában marad az elnyomó megnevezésével @L22 `A súlyosabb kód **elnyomja** az enyhébbet`
- [C4] [CONFIRMED] Hiányzó súlyossági adatnál az ajánlás előzetes, és megnevezi a hiányzó laborokat @L41 `// provisional: true`
- [C5] [CONFIRMED] Az ajánlás nem tárolódik, minden híváskor újraszámol; a dokumentumra a kódoló döntése kerül @L74 `| **ajánlás** | a rögzített adatból, minden hívásnál újra | **nem** |`
- [C6] [CONFIRMED] A táblakeresés önálló levezetés-fajta lett, mert a computed a kalkulátor-rétegen megy át, ami csak számot vesz és ad @L96 `levezetés a **kalkulátor-rétegen** megy át, ami **számot vesz és`
- [C7] [CONFIRMED] Hiányzó törzs vagy ismeretlen kulcs esetén a mező üres marad, a hiba a CaseState hibalistájába kerül @L121 `Ha a törzs nincs betöltve vagy a kulcs nincs benne, a mező **üres marad**, és a`
- [C8] [CONFIRMED] A HBCS-besorolás blokkolt: a hatályos szabálykönyv nincs betöltve és ellenőrizve @L137 `// { status: "blocked", group: null,`
- [C9] [CONFIRMED] A besorolási logika akkor sem fut le, ha a szabálykönyvet ellenőrzöttnek jelölik @L150 `nem magáról állítja — és a besorolási logika akkor sem`
- [C10] [CONFIRMED] A build-teszt csak az új egységeket fogja meg, az új megjelenítési helyeket nem — azokat el kell olvasni @L164 `az **új egységeket** fogja meg, az **új megjelenítési helyeket** nem: minden`
- [C11] [CONFIRMED] A validátor build-hibaként utasítja el a küszöböt tartalmazó, pusztán BNO-ra hivatkozó szabályt @L170 `az osztályozásból következik. A validátor ezért **build-hibaként** utasítja el a`
- [C12] [CONFIRMED] A szabály nélküli kódra mutató elnyomás hatástalan; ez derült ki az O14.0-nál @L175 `Ez fogta meg, hogy az O14.0 (enyhe-közepes praeeclampsia) az elnyomási`
- [C13] [CONFIRMED] A modult 29 teszt fedi a test/kodolas.test.ts fájlban @L180 `(../../test/kodolas.test.ts) — 29 teszt:`
