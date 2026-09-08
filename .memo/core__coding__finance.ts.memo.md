---
source: core/coding/finance.ts
sha256: 08a06d41f767fb883fc07f065511694d28057d2b07f55f9a92835d963e4e962a
lines: 422
profile: code
generator: subagent
raw_tokens_est: 4219
verified: 24 confirmed, 1 needs_agent
---

# core/coding/finance.ts

## Topics
- L1-92: Teljes kódolás vs. felülkódolás, OENO elszámolhatósági típusok, pontérték
- L93-185: Egy eljárás elszámolhatóságának vizsgálata szakma és kötelező BNO szerint
- L186-294: Kizárásos ütközések feloldása, HBCS érték típusa
- L295-386: HBCS érték az ellátás napján érvényes kiadásból, csoportrangsor
- L387-422: A bizonyítékkal alátámasztott kódajánlások rangsorolása

## Claims

- [C1] [NEEDS_AGENT] Négy elszámolhatósági állapot van: formailag rendben, rossz szakma, hiányzó diagnózis, ismeretlen kód @semantic L38-46
- [C2] [CONFIRMED] Az ismétlési korlát szövegként őrződik meg, gépi szabályként nem @L57 `/** Ismétlési korlát, ahogy a jogszabály írja — SZÖVEG, nem gépi szabály. */`
- [C3] [CONFIRMED] Az `oenoPoints` a `tbl.oeno` sor `pont` mezőjéből olvas, és nem szám esetén `null`-t ad @L73 `const n = Number(row?.pont);`
- [C4] [CONFIRMED] A `split` pontosvesszővel bont, minden elemet trimel, és az üreseket eldobja @L78 `(s ?? "").split(";").map((x) => x.trim()).filter(Boolean);`
- [C5] [CONFIRMED] A törzsben nem szereplő kód `unknown` státuszt kap, nem hibát @L101 `if (!row) {`
- [C6] [CONFIRMED] A kötelező BNO-feltételt külön tábla, a `tbl.oeno.bno` adja @L109 `const bnoRow = getTable("tbl.oeno.bno")?.rows[code] as Record<string, string> | undefined;`
- [C7] [CONFIRMED] A szakma-ellenőrzés csak akkor fut le, ha van megadott szakma és a sorban van kompetencialista @L113 `if (specialty && base.szakma.length && !base.szakma.includes(specialty)) {`
- [C8] [CONFIRMED] A másodlagos diagnózis is beleszámít a kötelező BNO meglétébe @L127 `const sec = resolve(reg, state, "code.dx.secondary");`
- [C9] [CONFIRMED] A rögzített diagnózisokat pont nélküli alakra normalizálva hasonlítja @L129 `if (dx.state === "ok") have.add(String(dx.value).replace(".", ""));`
- [C10] [CONFIRMED] Elég a megkövetelt BNO-k közül egyetlen egy megléte @L135 `const ok = requiresBno.some((b) => have.has(b));`
- [C11] [CONFIRMED] A kizárás mindkét irányban vizsgálva van: `a` kizárja `b`-t, vagy fordítva @L198 `const excl = split(ra?.kizarva).includes(b) || split(rb?.kizarva).includes(a);`
- [C12] [CONFIRMED] A hívó `opts.points`-szal felülírhatja a törzsből olvasott pontértéket @L200 `const pa = opts.points?.[a] ?? oenoPoints(a);`
- [C13] [CONFIRMED] Pontegyenlőségnél az elsőként felsorolt kód marad @L205 `keep = pa >= pb ? a : b;`
- [C14] [CONFIRMED] A jelenthető lista a `billable` státuszú, kizárás miatt el nem dobott kódokból áll @L228 `.filter((c) => c.status === "billable" && !dropped.has(c.code))`
- [C15] [CONFIRMED] Feloldatlannak az az ütközés számít, amelynél nincs megtartandó kód @L230 `const undecided = conflicts.some((c) => c.keep === null);`
- [C16] [CONFIRMED] A `hbcsValue` a dátum nélküli, azaz hatályos kiadás szerinti hívás rövidítése @L278 `return hbcsValueOn(group, losDays, null).value;`
- [C17] [CONFIRMED] Ellátási nap nélkül a hatályos kiadással dolgozik, és kimondja, hogy retrospektív esetnél ez rossz összeget adhat @L303 `Az ellátás napja nincs megadva, ezért a HATÁLYOS kiadás`
- [C18] [CONFIRMED] Hiányzó sornál vagy táblánál `value: null` jön vissza, de az `editionWhy` indoklás megmarad @L307 `if (!row || !table) return { value: null, editionWhy };`
- [C19] [CONFIRMED] Az ápolási idő elszámolási következménye csak akkor állapítható meg, ha a napszám és mindkét határnap ismert @L317 `if (losDays != null && lo != null && hi != null) {`
- [C20] [CONFIRMED] Az intézeti körhöz kötöttséget a sor `intezetiKorhozKotott` mezőjének `igen` értéke jelzi @L334 `if (row.intezetiKorhozKotott === "igen") {`
- [C21] [CONFIRMED] A `rankHbcs` súlyszám szerint csökkenően rendez, a hiányzó súlyszámot −1-nek véve @L366 `.sort((a, b) => (b.sulyszam ?? -1) - (a.sulyszam ?? -1));`
- [C22] [CONFIRMED] Csak a `suggested` státuszú ajánlások kerülnek a rangsorba @L393 `.filter((x: CodeSuggestion) => x.status === "suggested")`
- [C23] [CONFIRMED] A címke visszaesési sorrendje: az ajánlás címkéje, a `tbl.bno` keresés, végül maga a kód @L398 `label: x.label || lookupCode("tbl.bno", x.code).value || x.code,`
- [C24] [CONFIRMED] Az `evidence` a kódot alátámasztó bizonyítékok darabszáma @L400 `evidence: x.because.length,`
- [C25] [CONFIRMED] A rendezés háromszintű: érték, majd bizonyítékszám, majd kód szerinti ábécésorrend @L405 `(b.value ?? -1) - (a.value ?? -1) || b.evidence - a.evidence ||`
