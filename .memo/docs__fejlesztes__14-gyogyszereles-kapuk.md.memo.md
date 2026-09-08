---
source: docs/fejlesztes/14-gyogyszereles-kapuk.md
sha256: 7876e25e8b3c815ac2349d4ede785d5c44e3376e9c7b57ac32eb0c53343fc809
lines: 128
profile: prose
generator: subagent
raw_tokens_est: 1411
verified: 9 confirmed
---

# docs/fejlesztes/14-gyogyszereles-kapuk.md

## Topics
- L1-34: A kontraindikációs kapu három válasza és a hiányzó adat kezelése
- L35-128: Indokolt megkerülés, példányonkénti rendelés, dózisszámítás, gyógyszertörzs

## Claims

- [C1] [CONFIRMED] A kapu harmadik válasza az ask: a feltétel eldöntéséhez szükséges adat hiányzik @L17 `ask     — A FELTÉTELHEZ SZÜKSÉGES ADAT HIÁNYZIK`
- [C2] [CONFIRMED] A kapu üzenete megnevezi a hiányzó mezőt, és kimondja, hogy a hiány nem zárja ki a kontraindikációt @L26 `Carboprost: a kontraindikáció nem dönthető el, mert hiányzik hx.sys.asthma.`
- [C3] [CONFIRMED] Több kapu esetén a rendszer nem az elsőn áll meg, hanem mindet kiértékeli @L31 `nem az elsőn áll meg, hanem`
- [C4] [CONFIRMED] A prescribe zárt kapunál GateError-t dob, és a rendelés indoklás nélkül nem folytatható @L44 `A rendelés indoklás nélkül nem folytatható.`
- [C5] [CONFIRMED] Megkerüléskor az indoklás a rendelés adott példányához kötve rögzül @L51 `// → a készítmény felkerül, az indoklás a RENDELÉS PÉLDÁNYÁHOZ kötve rögzül`
- [C6] [CONFIRMED] Egy másik kapura adott indoklás nem nyitja ki ezt a kaput @L59 `| A másik kapura szóló indoklás nem nyitja ki ezt |`
- [C7] [CONFIRMED] A szabály a motorban van, ezért más képernyő használatával nem kerülhető meg @L69 `megkerülni azzal, hogy valaki más képernyőt használ.`
- [C8] [CONFIRMED] Egység nélkül adag nem rögzíthető: az egység önálló mezőből bélyegződik az értékre @L89 `rx.dose.amount: az egység a(z) rx.dose.unit mezőből jön, és az még nincs kitöltve`
- [C9] [CONFIRMED] A calc.crcl kapu mögött van, mert a Cockcroft–Gault SI-átszámolt női együtthatója nincs visszaellenőrizve @L100 `a Cockcroft–Gault SI-átszámolt női együtthatója nincs visszaellenőrizve`
