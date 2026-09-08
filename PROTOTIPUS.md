# Az első platformminta

Ez a `ogdoc/core` a 15 hónapos terv **M1 fázisának** magja: a regiszter-vezérelt
klinikai mag, DOM és adatbázis nélkül. Nem demó-felület — ez az a réteg, amire a
webes rendszer, az exportáló és a lekérdező egyaránt ráépül, és amit a
`docs/01-architektura.md` portolhatósági szerződése változatlanul átvihetőnek ír le.

## Futtatás

Node 22.6 vagy újabb kell (a natív TypeScript-futtatás miatt).

```
cd ogdoc
npm run check     # minden: regiszter + 558 teszt + modultesztek + generált doksik
npm test          # 558 teszt (ebből 96 a mag golden tesztje)
npm run demo      # egy szintetikus eset végigvitele a motoron
npm run web       # a webes csontváz → http://localhost:3000
npm run docs      # a generált dokumentumok újraépítése
```

Nincs függőség, nincs telepítési lépés, nincs build. A `node_modules` üres marad.

## Mi van benne

| Fájl | Mi a dolga |
|---|---|
| `core/types.ts` | `VariableDef`, `Value`, `CaseState`, `ScoreResult`. Itt van a precedencia-rangsor és a `ScoreInsufficient` típus. |
| `core/registry.ts` | A regiszter betöltése és **integritás-ellenőrzése**: ismeretlen hivatkozás, tükör levezetéssel, kézzel írt `consumers`, hiányzó kódkészlet vagy mértékegység, és két primer változó azonos LOINC-kóddal. |
| `core/derive/graph.ts` | A levezetési gráf: `consumersOf`, `sourcesOf`, `impactOf`, topologikus sorrend. **Körre kivételt dob**, a kör tagjainak felsorolásával. |
| `core/calc/defs.ts` | **MINDEN képlet, egy példányban** — bemenet, sáv, forrás, `verified` jelölés. |
| `core/calc/run.ts` | A kalkulátor-futtató és a két kapu. |
| `core/derive/engine.ts` | A motor: `setValue` (írás), `resolve` (a legjobb érvényes érték), `suggestPrefills` (javaslat), `recompute` (újraszámítás). |
| `core/ui/formspec.ts` | Az űrlap és a meződokumentáció **generálása** a regiszterből. |
| `core/ui/disclosure.ts` | **Click-open**: mely mezők látszanak most. A normálisat nem kell beírni. |
| `core/ui/output.ts` | A betegnek szóló generált szöveg, a klinikusi javaslatok és a megerősítési sor. |
| `core/docs/` | **Dokumentum-regiszter**: nyolc ellátási dokumentumtípus, lezárhatóság-ellenőrzés és megőrzési kapu. |
| `core/scores/fullpiers.ts` | A fullPIERS — kapuzva, ld. lent. |
| `web/api.ts` | A szállítás-független webes API — változatlanul átvihető a végleges stackre. |
| `web/server.ts` | Futtatható webes csontváz, függőség nélkül. |
| `modules/_sablon/` | Modulsablon, saját futó tesztekkel. |
| `test/core.test.ts` | 96 golden teszt tizenhét csoportban. |
| `demo/run.ts` | Egy szintetikus eset a bevitelttől a score-kapuig. |

## A három levezetési mechanizmus

A motor nem mossa össze őket, mert klinikailag élesen különböznek:

- **`computed`** — csak olvasható, a motor vezeti le. Kézzel írni rá hiba, és a
  hibaüzenet megmondja, mely bemenetet kell helyette írni.
- **`prefill`** — *javaslat*, nem tény. Felülírható, `prefilled` eredetet kap, és
  mindig indoklással jelenik meg („korábbi vizit (2026-01-10)").
- **`mirror`** (`aliasOf`) — egy adat, több felületi hely. A tükör alatt **nem
  keletkezik önálló tároló**; az írás a primer változóhoz kerül, de megőrzi, hol
  írták be. Ez oldja fel az IPRACS hármas méhszáj-duplikációját.

## Amit a minta menet közben kimutatott

A prototípus nem csak a tervet valósította meg, hanem hat dolgot ki is javított
benne. Mind a hat a golden tesztekben rögzítve maradt.

1. **A fullPIERS dokumentált együtthatói klinikailag fordítva viselkednek.** A
   súlyosabb beteg kap alacsonyabb kockázatot: az AST² tag AST 320-nál −60,6-tal,
   AST 600-nál −213-mal járul hozzá a logithoz. A score ezért
   `COEFFICIENTS_VERIFIED = false` kapu mögött áll, és teljes bemenettel sem ad
   számot, amíg a von Dadelszen 2011 közleménnyel nincs visszaellenőrizve.
   *Ez a legfontosabb eredmény: a beteg soha nem kapott volna hamis megnyugtatást,
   mert a rendszer inkább nem számol, mint rosszul.*
2. **Hiányzott az írási út.** A tükrözött azonosítóra írt érték elveszett, mert a
   hívó közvetlenül az állapotba írt. A `setValue` most az egyetlen bejárat, és ő
   oldja fel az aliast.
3. **Nem volt tartomány- és kódellenőrzés.** A −3…+3 klinikai skálán megszokott
   `−1` szó nélkül bekerült egy 0–3 tartományú mezőbe. Most az írás elutasítja.
4. **Két helyen éltek volna a képletek** — a kalkulátor-definíciókban és a motor
   `COMPUTED` tábláján. Egyesítve: egy fogalomhoz egy képlet, és a `registerCalc`
   nem enged felülírást.
5. **A validátor saját, párhuzamos igazságot vezetett be**: `yes`/`no`/`unk` kódokat
   feltételezett, miközben a regiszterben `pos`/`neg`/`unk` áll. A javítás nem a
   konstans átírása volt, hanem hogy a kódkészletet **mindig a regiszter mondja meg**.
6. **Az `exam.cervix.station` két jelentést mosott össze**: a klinikus a −3…+3
   beszállást látja, a Bishop-pontozás 0–3 sávot vár, és a −1 meg a 0 **egy sávba
   esik**. Szabad számbeírásként ez rendszeres elszámolás lett volna. Most kódolt
   választós mező: a klinikus a látott állapotot választja, a pontérték a kód.

## Fejlesztői dokumentáció

A teljes fejlesztői fa a [`docs/fejlesztes/`](docs/fejlesztes/) alatt: mag-API,
webes architektúra és csontváz, modul-csontváz, mezőkatalógus, szabad szöveg
feloldása, kalkulátorok tételesen, AI-csatolási pontok, bővítési lehetőségek.

A **kalkulátor-fejezet és a mezőkatalógus generált** — a `npm run docs:check` a CI-ben
ellenőrzi, hogy egyezik-e a forrásával.

## A minta határai

Amit ez a réteg szándékosan **nem** tartalmaz:

- **Nincs perzisztencia.** A `CaseState` memóriában él. A tábla-leképezés az M2.
- **A webes réteg csontváz.** Fut és bizonyít, de memóriában tárol, hitelesítés és
  audit nélkül — valódi betegadattal nem használható. A React-réteg az M3.
- **167 változó**, nem ~4000 — a feltöltés modulonként halad (ld. `docs/fejlesztes/11-lefedettseg.md`). Három click-open leletcsoport mintaként, nem több száz. Ez a mag helyességét bizonyítja, nem a lefedettséget.
- **Nincs jogosultságkezelés és nincs auditnapló.** A `phi` jelölés megvan, a
  kikényszerítése a 25. modulhoz tartozik.
- **A fullPIERS nem használható.** Ld. fent.

## Betegadat

A repóban nincs és nem is lehet beteg-azonosításra alkalmas adat. A demó és a
tesztek minden értéke szintetikus. A `patient.taj` `phi: true` jelölést visel, és
az exportból, valamint a lekérdezőből kimarad.
