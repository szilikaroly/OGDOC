---
source: core/eeszt/csatlakozas.ts
sha256: 6bf939da0fec5bc1407fc5f940dd82926a263337c5375084984f2168296753f4
lines: 315
profile: code
generator: subagent
raw_tokens_est: 3052
verified: 18 confirmed
---

# core/eeszt/csatlakozas.ts

## Topics
- L1-108: miért más ez a lépés, és a csatlakozási dosszié típusai
- L109-179: mezőállás — ki tudja kitölteni, és a kapuállás bizonyítékból
- L180-212: az éles csatlakozás feltétele és a szintetikus kapu fordított logikája
- L213-315: integritás-ellenőrzés és a csatlakozási mérleg

## Claims

- [C1] [CONFIRMED] az EESZT-be küldött üzenet elhagyja a rendszert és utólag nem javítható, szemben a belső bejegyzéssel @L14 `rendszert, és attól kezdve nem a miénk: a hibás belső bejegyzés`
- [C2] [CONFIRMED] a cselekvő kilétét ma egyetlen ellenőrizetlen kérésfejléc állítja @L17 `2. EZÉRT A HITELESÍTÉS HIÁNYA ITT MÁS SÚLYÚ. Ma a cselekvő kilétét egyetlen`
- [C3] [CONFIRMED] a titoktartási nyilatkozat lejárat nélküli kötelezettséget vállal — a rendszerben ez az egyetlen ilyen @L23 `lejárat nélküli kötelezettséget vállal — a rendszerben ez az EGYETLEN`
- [C4] [CONFIRMED] a dosszié a szerkezetet tartja, a személyes adatot tartalmazó kitöltött példányok nem kerülhetnek a repóba @L31 `neve), tehát a repóba semmiképp nem kerülhetnek. A dosszié a szerkezetet`
- [C5] [CONFIRMED] egy mezőt háromféle kitöltő válaszolhat meg: rendszer, szervezet vagy üzemeltetés @L42 `export type Kitolto = "rendszer" | "szervezet" | "uzemeltetes";`
- [C6] [CONFIRMED] a rendszerből válaszolhatónak jelölt mező élő bizonyíték nélkül hianyzoBizonyitek állapotot kap @L116 `if (!b) {`
- [C7] [CONFIRMED] a szervezeti és üzemeltetési adatot a rendszer nem válaszolja meg és nem is tippel @L134 `a rendszer nem tudja megválaszolni, és nem is szabad tippelnie.`
- [C8] [CONFIRMED] mérés hiányában a kapu értéke „nincs mérve”, és a kapu nem áll @L157 `ertek: b?.ertek ?? "nincs mérve",`
- [C9] [CONFIRMED] a szintetikus kapu fordítva viselkedik: bizonyítéka akkor van meg, ha a rendszer nem futhat valódi adaton @L173 `fordítva viselkedik, mint a többi: az a bizonyíték`
- [C10] [CONFIRMED] a zárt kapuk listájából a szintetikus kaput kiveszi, azt külön kezeli @L181 `const zart = kapuk.filter((k) => !k.all && k.id !== "eeszt.kapu.szintetikus");`
- [C11] [CONFIRMED] KAPU: amíg a szintetikus kapu áll, éles csatlakozás nem lehetséges @L185 `if (szintetikusAll) {`
- [C12] [CONFIRMED] csatlakozni csak akkor lehet, ha a hitelesítés, az auditnapló és az ágazati azonosító kapuja is áll @L207 `miert: "Minden kapu áll: hitelesítés, auditnapló és ágazati azonosító megvan.",`
- [C13] [CONFIRMED] aláíró nélküli űrlap error szintű hiba @L224 `if (!u.alairo.length) {`
- [C14] [CONFIRMED] a rendszerből válaszolhatónak jelölt, de bizonyítékkulcs nélküli mező error @L234 `if (m.kitolti === "rendszer" && !m.bizonyitek) {`
- [C15] [CONFIRMED] a bizonyíték nélküli beadványi állítás nem hiba, csak warning — de megnevezve marad @L253 `// A BIZONYÍTÉK NÉLKÜLI ÁLLÍTÁS NEM HIBA — de megnevezve marad.`
- [C16] [CONFIRMED] személyes adatot kérő űrlap kibocsátói szabályzat megnevezése nélkül warning @L262 `if (u.mezok.some((m) => m.szemelyesAdat) && !u.szabalyzat) {`
- [C17] [CONFIRMED] a hiányzó bizonyítékú mező error szintű hibaként kerül a listába @L282 `for (const m of mezoAllas(cs, biz).filter((x) => x.allapot === "hianyzoBizonyitek")) {`
- [C18] [CONFIRMED] a mérleg külön kimutatja a bizonyítatlan állítások számát @L311 `bizonyitatlanAllitas: allitasok.filter((a) => !a.bizonyitek).length,`
