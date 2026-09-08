---
source: docs/fejlesztes/12-peldany-dimenzio.md
sha256: 0a3efc68d460e59a3445b49d326447d993ad9ab4478f8135be9caa5208bbd9a8
lines: 191
profile: prose
generator: subagent
raw_tokens_est: 2045
verified: 11 confirmed
---

# docs/fejlesztes/12-peldany-dimenzio.md

## Topics
- L1-157: A példány-dimenzió indoklása, scope, névsor-kapu, a 82 tételes panaszszótár
- L158-191: Kódolt tétel és szó szerinti idézet együtt, elfogadási teszt, hátralévők

## Claims

- [C1] [CONFIRMED] A terv szó szerinti értelmezése 120 panasz × 11 jellemző = 1320 külön változódefiníciót jelentett volna @L15 `Ez szó szerint értve 120 panasz × 11 jellemző = **1320 változódefiníciót** jelentene,`
- [C2] [CONFIRMED] A példányosítás a definícióban egy scopedBy blokk, amely dimenziót és névsor-változót nevez meg @L33 `"scopedBy": { "dimension": "complaint", "roster": "compl.active" }`
- [C3] [CONFIRMED] Példányosított mező scope nélküli feloldása „missing” állapotot ad, nem összemosott értéket @L42 `resolve(reg, st, "compl.q.severity").state;`
- [C4] [CONFIRMED] A névsor kapu: amíg a panasz nincs a roster értékében, hozzá jellemző nem rögzíthető @L53 `Amíg egy panasz nincs benne, hozzá jellemző nem rögzíthető:`
- [C5] [CONFIRMED] A vörös zászló feltétele adatszerkezet (var/op/value hármasok), nem kiértékelendő kifejezés, mert az eval tetszőleges kódot futtatna @L107 `kód futna, egy betegadatot kezelő rendszerben. A feltétel ezért **adat**:`
- [C6] [CONFIRMED] Hiányzó gesztációs kornál a redflagState „unknown”-t ad, nem hamisat — nincs néma helyettesítés @L125 `de a GA hiányzik`
- [C7] [CONFIRMED] A kódolt tétel és a szerkesztetlen szó szerinti idézet egyszerre rögzül, egyik sem váltja ki a másikat @L167 `**Egyik sem helyettesíti a másikat**, ezért mindkettő rögzül.`
- [C8] [CONFIRMED] A compl.verbatim beteg-azonosító adatot tartalmazhat, ezért az exportnál szűrni kell @L170 `Beteg-azonosító adat kerülhet bele, ezért az exportnál szűrni kell — a kutatói`
- [C9] [CONFIRMED] Az elfogadási kritérium teszt formájában él a test/panasz.test.ts-ben: tízből legalább nyolc az első három találat között @L178 `Ez **teszt**, nem ígéret:`
- [C10] [CONFIRMED] A panaszkártya megjelenítése a web/public/app.js általános megjelenítőjében még nincs megvalósítva @L185 `általános megjelenítőjében még nincs megvalósítva.`
- [C11] [CONFIRMED] A redflagWhen ma csak ÉS-kapcsolatot ismer, VAGY-ot nem @L190 `ma csak ÉS-kapcsolatot ismer.`
