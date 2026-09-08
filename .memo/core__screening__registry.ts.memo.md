---
source: core/screening/registry.ts
sha256: 108a2c0ae9be778cf5ac7edb9426054ed762a13830f9dcad0c993bc48aac45a3
lines: 225
profile: code
generator: subagent
raw_tokens_est: 2365
verified: 12 confirmed
---

# core/screening/registry.ts

## Topics
- L1-57: állapottípusok, nyelvi tartalék, a feltétel-összehasonlító `test`
- L58-213: a ScreeningSet osztály — kiértékelés, utolsó elvégzés, teendőlista, validálás
- L214-225: szűrési szabályok betöltése fájlokból és könyvtárakból

## Claims

- [C1] [CONFIRMED] Hat szűrési állapot van, és az `unknown` a hiányzó adatot jelöli, nem azt, hogy a szűrés nem vonatkozik a betegre @L23 `| "notApplicable" | "upcoming" | "due" | "overdue" | "done" | "unknown";`
- [C2] [CONFIRMED] Az állapot külön mezőben tartja a még meg nem kérdezett hiányt és a beteg „nem tudja” válaszát, mert a teendő más @L38 `nemTudja?: string[];`
- [C3] [CONFIRMED] A nyelvi tartalék sorrendje: kért nyelv, majd magyar, majd angol, végül üres sztring @L44 `x?.[lang] ?? x?.hu ?? x?.en ?? "";`
- [C4] [CONFIRMED] A `test` hét összehasonlító műveletet ismer, köztük a `gte`-t számmá alakítással @L54 `case "gte": return Number(value) >= Number(c.value);`
- [C5] [CONFIRMED] A ScreeningSet konstruktora duplikált szabályazonosítóra kivételt dob @L63 `if (this.byId.has(r.id)) throw new Error(`
- [C6] [CONFIRMED] A rögzített „nem tudom” alapból nyitva hagyja a szűrést, és csak akkor jelent nem-vonatkozást, ha a szabály `unknownAnswer` mezője ezt kéri @L96 `if (rule.unknownAnswer === "notApplicable") {`
- [C7] [CONFIRMED] `repeatEvery` nélküli szabálynál a rögzített eredmény véglegesen „done”, elévülés nélkül @L125 `if (!rule.repeatEvery) return out("done", "az eredmény rögzítve van");`
- [C8] [CONFIRMED] Az ablak alapját lefelé kerekíti, hogy a 28+3 hetes beteg ne látsszon elmulasztottnak @L145 `const nowAt = Math.floor(at.value);`
- [C9] [CONFIRMED] A `lastDone` a rögzítések LEGKORÁBBI időbélyegét adja vissza, és `anyOf` nélkül minden `what` mező megléte kell @L169 `return Math.min(...times);`
- [C10] [CONFIRMED] A teendőlista rögzített rangsor szerint rendez, elöl az elmulasztottal, hátul a nem vonatkozóval @L175 `overdue: 0, due: 1, unknown: 2, upcoming: 3, done: 4, notApplicable: 5,`
- [C11] [CONFIRMED] A `loadScreenings` bemenetenként eldönti, könyvtár-e, és könyvtár esetén a benne lévő JSON-fájlokat olvassa @L217 `const files = statSync(p).isDirectory() ? filesIn(p) : [p];`
- [C12] [CONFIRMED] Nem tömböt tartalmazó szűrési fájlra a betöltés kivételt dob @L220 `if (!Array.isArray(parsed)) throw new Error(`
