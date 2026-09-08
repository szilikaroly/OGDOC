---
source: core/szepszis/kuszob.ts
sha256: 977308a4f2acd7343b226c975541fac398a8c8086aaccbb6e091f76c85bca88e
lines: 673
profile: code
generator: subagent
raw_tokens_est: 7310
verified: 32 confirmed, 1 needs_agent
---

# core/szepszis/kuszob.ts

## Topics
- L1-139: miért a futó kódból olvassuk a küszöböt, küszöbtípusok, kiolvasás kritériumból és kalkulátorkódból
- L140-162: az eltérés rekordja és a négyféle viszony indoklása
- L163-249: a két forrás összevetése és a címke-elcsúszás típusa
- L250-299: címke és küszöb elcsúszásának feltárása, az időbeli jelzőszavak
- L300-448: időbeli jelzők, a normatív mag és lenyomata, az aláírás és a protokollállapot
- L449-511: a riasztási kapu, az intézményi döntés típusa és az eltérések lenyomata
- L512-549: a döntés állapotának megítélése
- L550-673: az integritás-ellenőrzés és a haladásmérő

## Claims

- [C1] [NEEDS_AGENT] A réteg a küszöböket a kalkulátor futó kódjából olvassa ki, nem a dokumentált képlet szövegéből, mert a beteg a kódot kapja @semantic L18-19
- [C2] [CONFIRMED] A tartományon kívüliséget kimondó kritérium két külön határra bomlik, hogy a másképp leírt, de számszerűen azonos küszöb ne látsszon eltérésnek @L81 `case "outside": return [...be("lt", c.low), ...be("gt", c.high)];`
- [C3] [CONFIRMED] Az `eq` és `notEq` műveletű kritériumból nem keletkezik összevethető küszöb @L82 `default: return [];`
- [C4] [CONFIRMED] A kódból olvasás előbb kiszedi a forrásból a megjegyzéseket @L108 `.replace(/\/\*[\s\S]*?\*\//g, "")`
- [C5] [CONFIRMED] A függvényparaméterek pozíció szerint felelnek meg a deklarált bemeneteknek, így a kódbeli összehasonlítás regiszterbeli változóhoz köthető @L118 `const input = c.inputs[i];`
- [C6] [CONFIRMED] A két forrás viszonya négyféle lehet, nem csak egyezés és eltérés @L136 `| "csakProtokollban"`
- [C7] [CONFIRMED] Az eltérés rekordja megnevezi a másik forrást adó kalkulátort @L147 `calc: string;`
- [C8] [CONFIRMED] Csak a protokoll `relatedCalculators` listájában szereplő kalkulátorokat veti össze @L169 `if (!rokonok.has(c.id)) continue;`
- [C9] [CONFIRMED] Közös változó nélküli kalkulátort kihagy, mert az összevetés ott zajt adna, nem eltérést @L181 `if (!kozosVar.size) continue;`
- [C10] [CONFIRMED] Azonos irány melletti eltérő szám `elter` fajtát ad, és az indoklás megnevezi a szigorúbb és a megengedőbb következményét @L191 `if (a && b && a.ertek !== b.ertek) {`
- [C11] [CONFIRMED] Az egyező küszöb is bekerül az eredménybe, hogy látszódjon: nincs miről dönteni @L201 `} else if (a && b) {`
- [C12] [CONFIRMED] A címke számait a `konstansok` segédfüggvény szedi ki, és a kritérium saját küszöbszámaihoz hasonlítja @L254 `const cimkeSzamok = new Set(konstansok(cimke));`
- [C13] [CONFIRMED] Bejegyzés csak akkor keletkezik, ha valamelyik irányban van eltérés a címke és a küszöb között @L258 `if (!csakCimkeben.length && !csakKuszobben.length) continue;`
- [C14] [CONFIRMED] Hat rögzített szó jelzi az időbeli feltételt a kritérium szövegében @L277 `const IDOSZAVAK = ["tartós", "ismételt", "sorozat", "perzisz", "visszatérő", "egymást követő"];`
- [C15] [CONFIRMED] Kitöltött `sustained` mező mellett nem jelez, mert a hiányt már pótolták @L303 `if (c.sustained) continue;`
- [C16] [CONFIRMED] A normatív magba az egység is beleszámít, mert a néma egységváltás a legdrágább hiba @L324 `Benne van: minden kritérium változója, iránya, határa és EGYSÉGE; a két`
- [C17] [CONFIRMED] A lenyomat a mag SHA-256 hasításának első 16 hexjegye @L357 `return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);`
- [C18] [CONFIRMED] Az aláírás tételes: ami nincs összevetve, arra nem terjed ki @L375 `osszevetettKuszobok: string[];`
- [C19] [CONFIRMED] Hitelesítés hiányában az állapot aláíratlan, és minden küszöb összevetetlennek számít @L412 `return { protokoll: p.id, allapot: "alairatlan", lenyomat: mag, alairo: null,`
- [C20] [CONFIRMED] Ha az aláírt lenyomat eltér a mostanitól, az állapot elavult lesz @L416 `if (h.lenyomat !== mag) {`
- [C21] [CONFIRMED] Aláíratlan küszöböknél a kapu zárva, de a megítélés elkészül és látszik @L451 `if (a.allapot === "alairatlan") {`
- [C22] [CONFIRMED] A `blocksAlerting` jelölés aláírás mellett is tilt: a tiltás erősebb az engedélynél @L461 `if (p.blocksAlerting) {`
- [C23] [CONFIRMED] Az intézményi döntéshez kötelező dokumentumhivatkozás tartozik @L483 `dokumentum: string | null;`
- [C24] [CONFIRMED] Az eltérés-lenyomat csak a valódi eltéréseket (`elter`) veszi be, az egyezéseket és a féloldalasságokat nem @L496 `elteresek.filter((e) => e.fajta === "elter")`
- [C25] [CONFIRMED] Döntés hiányában az állapot `nincs-dontes`, és a rendszer mindkét számot megnevezi a forrásával együtt @L519 `if (d.allapot !== "dontve" || !d.valasztott) {`
- [C26] [CONFIRMED] Ha az eltérések lenyomata a döntés óta megváltozott, a döntés elavulttá válik @L530 `if (d.lenyomat !== mostani) {`
- [C27] [CONFIRMED] A megszületett döntés nem csendesíti el a másik forrást: az eltérések továbbra is látszanak @L543 `A másik forrás ettől NEM tűnik el:`
- [C28] [CONFIRMED] Bekapcsolt riasztás érvényes aláírás nélkül hiba @L559 `if (!p.blocksAlerting && allapot.allapot !== "hitelesitve") {`
- [C29] [CONFIRMED] Az elsődleges hitelesítettség állítása aláírás nélkül szintén hiba @L566 `if (p.verification === "primary" && allapot.allapot !== "hitelesitve") {`
- [C30] [CONFIRMED] Ha a levezetett küszöbszám nem szerepel a kézzel írt `conflict` szövegben, a próza elavultnak minősül — hiba @L606 `if (hianyzo.length) {`
- [C31] [CONFIRMED] Ha a `conflict` eltérést állít, de egyetlen eltérés sem vezethető le, az csak figyelmeztetés @L614 `if (!sajat.length) {`
- [C32] [CONFIRMED] Döntés hiányában minden nyitott eltérés külön figyelmeztetésként jelenik meg @L642 `} else if (nyitott.length) {`
- [C33] [CONFIRMED] A haladásmérő riasztási mezője a kapu tényleges állapotát tükrözi @L671 `riaszt: riasztasEngedve(p, kat).engedve,`
