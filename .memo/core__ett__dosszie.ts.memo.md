---
source: core/ett/dosszie.ts
sha256: c8af54383027f3a4dd0a49a7e98b737120dd839fe1148c826d81c595eb096b69
lines: 591
profile: code
generator: subagent
raw_tokens_est: 6552
verified: 26 confirmed
---

# core/ett/dosszie.ts

## Topics
- L1-145: a dosszié célja, típusai, és a forrásból olvasott hitelesítés/horgony bizonyítékok
- L146-305: a bizonyítéklista összeállítása a rendszerállapotból
- L306-376: további bizonyítékok és a tételértékelés típusai
- L377-464: tételek megítélése és a beadhatósági kapu
- L465-591: integritás-ellenőrzés, mérleg és az állapot összerakása

## Claims

- [C1] [CONFIRMED] a gép egyetlen feladata megakadályozni, hogy a kérelem valótlant állítson @L7 `MEGAKADÁLYOZNI, HOGY A KÉRELEM OLYAT ÁLLÍTSON, AMI NEM IGAZ.`
- [C2] [CONFIRMED] a bizonyíték élő lekérdezés, nem fájlnév @L22 `EZÉRT MINDEN TÉTEL MELLETT ÉLŐ BIZONYÍTÉK ÁLL. Nem fájlnév, hanem lekérdezés:`
- [C3] [CONFIRMED] a harmadik tételállapot azt mondja ki, hogy az állítás így, ahogy van, nem igaz @L28 `MEGALAPOZATLAN   az állítás így, ahogy van, NEM IGAZ.`
- [C4] [CONFIRMED] a „szervezeti” minősítés nem felmentés, hanem címzés @L33 `beadvány nélkülük sem teljes. A „szervezeti” nem felmentés, hanem címzés.`
- [C5] [CONFIRMED] a hitelesítés bizonyítéka a web/session.ts forrásában keresett OGDOC_SYNTHETIC kapuból származik @L125 `const kapu = /OGDOC_SYNTHETIC/.test(src);`
- [C6] [CONFIRMED] a horgony akkor számít bekötöttnek, ha a tároló forrása olvassa ÉS írja is @L143 `return /horgony\?\.read\(/.test(src) && /horgony\.write\(/.test(src);`
- [C7] [CONFIRMED] a hitelesítés bizonyítéka ma nincs meg: a cselekvőt kérésfejléc állítja @L157 `ertek: h.van ? "van hitelesítés" : "NINCS — a cselekvőt kérésfejléc állítja",`
- [C8] [CONFIRMED] a kulcstár bizonyítéka fordított: akkor van meg, ha a web/kulcsok.ts fájl NEM létezik @L189 `megvan: !van(g, "web/kulcsok.ts"),`
- [C9] [CONFIRMED] a döntés-aláírások bizonyítéka csak MINDEN szabály aláírásával teljesül @L223 `megvan: a.dontes.osszes > 0 && a.dontes.alairt === a.dontes.osszes,`
- [C10] [CONFIRMED] a leírt „nem használjuk” döntés ugyanúgy rendezi a mérőeszköz-tételt, mint a licenc @L251 `„nem használjuk” döntés ugyanúgy rendezi a tételt, mint a licenc.",`
- [C11] [CONFIRMED] a számítási kapuk bizonyítéka megköveteli, hogy egyetlen kalkulátor se álljon kapu mögött @L256 `megvan: a.kalkulator.kapuMogott === 0 && a.labor.alairt === a.labor.osszes &&`
- [C12] [CONFIRMED] a szintetikus kapu bizonyítéka fordítva olvasandó: akkor van meg, ha a kapu ott áll @L270 `// FIGYELEM: ez a bizonyíték FORDÍTVA olvasandó. Akkor „van meg”, amikor`
- [C13] [CONFIRMED] az ágazati azonosító bizonyítéka beégetetten hamis, mert a regiszterben ma nincs ilyen mező @L313 `megvan: false,`
- [C14] [CONFIRMED] a naplóhorgony csak a tárolóba bekötve számít bizonyítéknak, a puszta megléte nem @L334 `megvan: van(g, "core/pilot/horgony.ts") && bekotve,`
- [C15] [CONFIRMED] az elemzési terv bizonyítéka a registry/ett/elemzesi-terv.json meglétén múlik @L349 `megvan: van(g, "registry/ett/elemzesi-terv.json"),`
- [C16] [CONFIRMED] a tétel négy állapota: fedett, reszben, megalapozatlan, szervezeti @L362 `export type TetelAllapot = "fedett" | "reszben" | "megalapozatlan" | "szervezeti";`
- [C17] [CONFIRMED] a szervezeti tételt a gép nem értékeli, csak megnevezi, hogy kire tartozik @L386 `if (t.fajta === "szervezeti") {`
- [C18] [CONFIRMED] hiányzó bizonyítéknál az állapot reszben, ha legalább egy bizonyíték megvan, különben megalapozatlan @L404 `const allapot: TetelAllapot = megvan.length ? "reszben" : "megalapozatlan";`
- [C19] [CONFIRMED] a kapu az igazságot méri, nem a beadvány teljességét @L434 `teljességet méri, hanem az IGAZSÁGOT: van-e olyan blokkoló tétel, aminek az`
- [C20] [CONFIRMED] a beadhatóságot a részben fedett blokkoló tétel is megakasztja, nem csak a megalapozatlan @L442 `t.blokkolo && (t.allapot === "megalapozatlan" || t.allapot === "reszben"));`
- [C21] [CONFIRMED] az állítás nélküli tétel error: a cím önmagában nem mond semmit a bizottságnak @L477 `if (!t.allitas?.hu?.trim()) {`
- [C22] [CONFIRMED] a bizonyíték nélküli rendszertétel error — ezt semmi nem venné észre, ha valótlanná válik @L489 `if (t.fajta === "rendszer" && !t.bizonyitek.length) {`
- [C23] [CONFIRMED] a gépi bizonyítékot hordozó szervezeti tétel warning @L495 `if (t.fajta === "szervezeti" && t.bizonyitek.length) {`
- [C24] [CONFIRMED] a `masholHasznalt` azért kell, mert a bizonyítékbázis közös az EESZT-csatlakozással @L504 `azért kell, mert a bizonyítékbázis KÖZÖS: ugyanaz a`
- [C25] [CONFIRMED] az egyetlen tétel által sem hivatkozott bizonyíték warningot ad @L511 `if (!hasznalt.has(b.kulcs)) {`
- [C26] [CONFIRMED] az állapot azért áll össze itt, hogy a munkalap és a validálás ugyanazt a képet lássa @L546 `Azért itt, és nem a validátorban: a munkalap és a validálás ugyanazt a képet`
