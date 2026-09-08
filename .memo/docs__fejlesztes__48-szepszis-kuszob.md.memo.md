---
source: docs/fejlesztes/48-szepszis-kuszob.md
sha256: 0d31fe09529d79a92a1ba8134878737dbcfd6ed534aba5ec26077b3f0bd09f5a
lines: 191
profile: prose
generator: subagent
raw_tokens_est: 2312
verified: 10 confirmed
---

# docs/fejlesztes/48-szepszis-kuszob.md

## Topics
- L1-51: a két forrás eltérő küszöbei és az eltérés kódból való levezetése
- L52-191: a riasztási kapu aláíráshoz kötése, címke-küszöb elcsúszások, lenyomat, intézményi döntés, nyitott munka

## Claims

- [C1] [CONFIRMED] A két forrás ugyanarra a légzésszámra más határt ad: > 24/perc és > 20/perc @L14 `| Légzésszám | > 24/perc | > 20/perc |`
- [C2] [CONFIRMED] A testhő-sor nem valódi eltérés, csak ugyanaz a két határ másképp leírva @L18 `A harmadik sor **nem eltérés**`
- [C3] [CONFIRMED] A küszöbréteg a kalkulátor futó kódjából olvassa ki a küszöböket, nem a `formula` mező szövegéből @L42 `ezért a küszöböket a kalkulátor **futó kódjából**`
- [C4] [CONFIRMED] A `conflict` mondat mostantól ellenőrzött: a levezetett eltérésben szereplő, de a mondatból hiányzó szám építési hiba @L50 `eltérésben olyan szám szerepel, ami a mondatban nem, az **építési hiba**.`
- [C5] [CONFIRMED] A szepszisprotokoll volt az egyetlen réteg, ahol a kaput két JSON-jelölés nyitotta, nem aláírás @L61 `**egyetlen hely, ahol a kaput két jelölés nyitotta**`
- [C6] [CONFIRMED] A `blocksAlerting: false` aláírás nélkül építési hiba @L74 `**aláírás nélkül építési hiba**;`
- [C7] [CONFIRMED] A jelölés tilthatja a riasztást, de nem engedélyezheti: a tiltás erősebb @L79 `**A jelölés tilthat, de nem engedhet.**`
- [C8] [CONFIRMED] A kreatininkritérium címkéje alapvonalhoz viszonyít, a gép mégis rögzített 97 µmol/L abszolút határhoz mér @L91 `rögzített **97 µmol/L** abszolút határhoz mér`
- [C9] [CONFIRMED] A „tartósan" szónak nincs gépi alakja: a kiértékelő egyetlen értéket néz @L107 `A kiértékelő viszont **egyetlen értéket néz**:`
- [C10] [CONFIRMED] A 11 küszöbből egy sincs aláírva @L160 `**A 11 küszöbből 0 aláírva.**`
