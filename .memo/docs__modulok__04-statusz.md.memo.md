---
source: docs/modulok/04-statusz.md
sha256: 47ca9ad792aaef0d2b932f29b119889410f6ebd4dd8feae1b30259f5e4b7567e
lines: 155
profile: prose
generator: subagent
raw_tokens_est: 1789
verified: 5 confirmed
---

# docs/modulok/04-statusz.md

## Topics
- L1-105: Vitális mag, antropometria és a hat szakterületi státusz-alszekció
- L106-155: A Bishop-score mint SSOT-próbakő, keresztfeltöltés, alias-kérdés

## Claims

- [C1] [CONFIRMED] A vitális mag már létezik az IntuiCare-ben, a hat szakterületi alszekció a modul új része @L13 `**A hat szakterületi alszekció nincs meg** — az a modul új része.`
- [C2] [PENDING] Minden vitális változó `series` kardinalitású, időbélyeggel, mert vajúdás alatt óránként ismétlődik @L34 `Mind `cardinality: "series"` — időbélyeggel, mert vajúdás alatt óránként ismétlődnek.`
- [C3] [CONFIRMED] A vitálisok érvényességi ablaka ambulánsan 7 nap, vajúdás alatt 4 óra, az SpO₂-é 1 óra @L35 `ambuláns 7 nap, vajúdás alatt 4 óra (SpO₂: 1 óra).`
- [C4] [CONFIRMED] A CARPREG II tíz tételéből nyolc magától kitöltődik a státuszból, az anamnézisből és az echóból @L70 `bepipálandó checkbox. Itt **nyolc a tízből magától kitöltődik** a státuszból, az anamnézisből és`
- [C5] [PENDING] Az öt cervix-mező `exam.cervix.*` alatt egyetlen helyen él, a Bishop-score `computed` levezetés fölöttük @L110 `(`exam.cervix.*`, fent kiemelve), és a Bishop-score `computed` levezetés fölöttük:`
- [C6] [CONFIRMED] A Bishop-levezetés `requiresAll: true`, tehát mind az öt bemenet kell hozzá @L118 `"fn": "bishop", "requiresAll": true`
- [C7] [CONFIRMED] Bishop színkód: ≥ 8 zöld, 6–7 narancs, < 6 piros, a maximum 13 @L132 `< 6 piros (kedvezőtlen, érlelés mérlegelendő). Maximum 13.`
- [C8] [PENDING] A Bishop minden megjelenési helye ugyanaz a `mirror`, harmadik bemeneti pont nincs @L135 `döntéstámogatásban —, ott mindenhol ugyanaz a `mirror`.** Nincs harmadik bemeneti pont.`
- [C9] [PENDING] Javaslat a v16-duplikátumokra: a `vitals.*` a primer, a többi `aliasOf`, és a build tiltja a két primert ugyanarra a LOINC-kódra @L155 `minden más `aliasOf`. A build ellenőrzi, hogy ne maradjon két primer ugyanarra a LOINC-kódra.`
