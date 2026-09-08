---
source: docs/fejlesztes/22-utankovetes.md
sha256: 39d40019bdc1b6783d771eaf87c16eaf2a571772e9781b39baf8571c215227ca
lines: 182
profile: prose
generator: subagent
raw_tokens_est: 2225
verified: 12 confirmed
---

# docs/fejlesztes/22-utankovetes.md

## Topics
- L1-6: A modul tétele: a hiány hat kategóriája és a nevező fontossága
- L7-154: Az export hiány-kategóriái, de-identifikálás, válaszarány, ESC és újszülött-adagok
- L155-182: A LATCH licenc-kapuja és a modul tesztjei

## Claims

- [C1] [CONFIRMED] A modul szerint a legfontosabb szám nem az exportban, hanem a nevezőben van @L5 `> a legfontosabb szám nem az exportban van, hanem a nevezőben.`
- [C2] [CONFIRMED] A hiányzó mező (unmapped) és a hiányzó adat (missing) összemosása a legkárosabb, mert a fejlesztői lemaradást az adatgyűjtésen kérnék számon @L30 `összemosása a legkárosabb: ha egy fejlesztői`
- [C3] [CONFIRMED] Az üres haláleset-dátum hiány marad, amíg egy külön mező ki nem mondja a nemleges tényt @L66 `Amíg nincs meg, az üres`
- [C4] [CONFIRMED] A születési dátum helyett a levezetett évet számolja ki a rendszer: nem maszkol, hanem eleve kevesebbet számol @L79 `Ez a de-identifikálás legolcsóbb formája: **nem elrejtünk valamit, hanem eleve`
- [C5] [CONFIRMED] 50%-os válaszarány mellett a kimeneteli mutató összehasonlításra nem közölhető, mert a hiány nem véletlenszerű @L95 `// "VÁLASZARÁNY 50% (2/4) — a mutató összehasonlításra NEM közölhető. Aki`
- [C6] [CONFIRMED] Mindhárom ESC-funkció megfelelősége esetén nincs farmakoterápia, és a Finnegan-pontozás sem indokolt @L117 `// "MIND A HÁROM FUNKCIÓ MEGFELELŐ: farmakoterápia NEM szükséges. …`
- [C7] [CONFIRMED] Súly nélkül a súlyalapú újszülött-adagokra nincs szám @L147 `(0,5 mL/ttkg). Súly nélkül **nincs szám** — és ez a`
- [C8] [CONFIRMED] A LATCH notLicensed tételszöveggel került a törzsbe, ezért nem vehető fel @L157 `A LATCH szoptatási skála a kérdőívtörzsbe került, `
- [C9] [CONFIRMED] A LATCH pontértékeinek kódlistája szándékosan címke nélküli, mert a leírás licencköteles @L159 `pontértékek kódlistája szándékosan címke nélküli („0 pont", „1 pont"): a`
- [C10] [CONFIRMED] Az IBCLC-konzultációt indokló vágóérték a törzsben van, nem kódban @L163 `Az „≤ 5 → IBCLC-konzultáció" vágóérték a **törzsben** van, nem kódban — készen`
- [C11] [CONFIRMED] A LATCH összpontszáma elfedheti a tételt: 8 pont mellett is állhat 0 pontos kényelem-tétel @L166 `A skála dokumentációja egy dolgot külön kiemel: **az összpontszám elfedi a`
- [C12] [CONFIRMED] A modult 33 teszt fedi a test/utankovetes.test.ts fájlban @L172 `(../../test/utankovetes.test.ts) — 33 teszt:`
