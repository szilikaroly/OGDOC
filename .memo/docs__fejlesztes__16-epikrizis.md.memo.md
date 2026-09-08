---
source: docs/fejlesztes/16-epikrizis.md
sha256: 598bcc09b6095a106b1373fac7198ebdeec73e4b0b9fccb7f02a95e6266a9498
lines: 148
profile: prose
generator: subagent
raw_tokens_est: 1694
verified: 12 confirmed
---

# docs/fejlesztes/16-epikrizis.md

## Topics
- L1-100: Öt stílus, gépi visszavezethetőség, a hiány-szakasz szabálya és csapdája
- L101-148: Az okoslelet elnevezés, a generálás jelölése, a szöveg tárolása, hátralévők

## Claims

- [C1] [CONFIRMED] A modul nem gyűjt adatot; ha itt új mezőt kellene kitölteni, egy korábbi modul hiányos @L3 `> **Ez a modul nem gyűjt adatot.**`
- [C2] [CONFIRMED] A hiány-szakasz mind az öt stílusban szerepel, az SBAR-átadásban is @L21 `**A hiány-szakasz mind az ötben szerepel**, az átadásban is. Átadáskor a`
- [C3] [CONFIRMED] Forrás nélküli szegmens nem kerülhet a szövegbe: minden from létező változóra, kalkulátorra vagy hibahelyre mutat @L34 `kalkulátor vagy hibahely. Forrás nélküli szegmens nem kerülhet a szövegbe.`
- [C4] [CONFIRMED] A score-ok mellé bemeneti pillanatkép is kerül, hogy utólag megérthető legyen az eredmény @L36 `A score-ok mellett ott a **bemeneti pillanatkép** is: mit látott az`
- [C5] [CONFIRMED] A hiány-szakasz szabálya: az elkezdett, de be nem fejezett számítás információ, az el nem kezdett nem @L67 `A szabály ezért: **amit elkezdtünk, de nem fejeztünk be, az információ. Amihez`
- [C6] [CONFIRMED] A levezetett eredetű bemenetek nem tesznek egy számítást elkezdetté, különben a ctx.now mindent elkezdetté tenne @L76 `A levezetett eredetű bemenetek ezért nem számítanak.`
- [C7] [CONFIRMED] A dokumentum neve okoslelet, mert nyelvi modell nincs a folyamatban @L103 `**A dokumentum neve: okoslelet.**`
- [C8] [CONFIRMED] A generálás gépi jelölése rule-based módszert rögzít @L115 `"method": "rule-based",`
- [C9] [CONFIRMED] Az epi.generation három értéket ismer, és nyelvi modell bekerülésekor az eredmény már assisted lenne @L123 `változó három értéket ismer`
- [C10] [CONFIRMED] Az epi.body azért tárolja a szöveget, mert későbbi regiszter- vagy kalkulátorváltozás után az újragenerált szöveg más lenne @L131 `regiszter vagy egy kalkulátor később változik, az újragenerált szöveg más`
- [C11] [CONFIRMED] Két külön, rögzített lépés az átnézés és a hiány-szakasz tudomásulvétele @L134 `Ehhez tartozik két külön, rögzített lépés:`
- [C12] [CONFIRMED] Az aláírás ma csak név és időbélyeg, a kriptográfiai rész hátravan @L147 `- **Az aláírás kriptográfiai része.**`
