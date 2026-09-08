---
source: core/followup/ichom.ts
sha256: f397096eda10511557da8d0f6e576bd939300655408d0a44c0afedb14eba711d
lines: 328
profile: code
generator: subagent
raw_tokens_est: 3249
verified: 19 confirmed
---

# core/followup/ichom.ts

## Topics
- L1-79: a hat hiánykategória szétválasztása, spec-betöltés és státusztípusok
- L80-147: export-eredmény típusa, szándékosan nem gyűjtött és nemleges tételek, leképezés
- L148-295: ichomExport soronkénti minősítése és a kohorsz-válaszarány
- L296-328: a regiszter ICHOM-hivatkozásainak integritás-ellenőrzése

## Claims

- [C1] [CONFIRMED] a hiánykategóriák összeadása („82% teljesség”) szándékosan tiltott, mert a három ok nem ugyanaz @L22 `A hármat összeadó „82% teljesség” szám hazugság lenne: a fejlesztői`
- [C2] [CONFIRMED] az `unmapped` fejlesztői feladat: nincs ilyen mezőnk @L16 `unmapped        — NINCS ilyen mezőnk             → fejleszteni kell`
- [C3] [CONFIRMED] a `notCollected` politikai döntés, nem hiba @L17 `notCollected    — szándékosan nem gyűjtjük       → politikai döntés, nem hiba`
- [C4] [CONFIRMED] `loadIchomSpec` normalizálja a timing-értékeket (trim + záró vessző levágása), mert a forrásban elgépelés van @L57 `timing: ((v.timing as string[]) ?? []).map((t) => t.trim().replace(/,$/, "")),`
- [C5] [CONFIRMED] a `notOccurred` azt jelenti, hogy az eseményt ellenőrizték és nem következett be @L66 `Az eseményt ELLENŐRIZTÉK, és nem következett be — a dátummező joggal üres.`
- [C6] [CONFIRMED] az export azonosítót soha nem tartalmaz, ezt teszt őrzi @L87 `Tartalmaz-e bármilyen azonosítót. MINDIG hamis — ezt teszt őrzi.`
- [C7] [CONFIRMED] az etnikum azért nem gyűjtött, mert GDPR szerint különleges adat és a besorolás az ellátó benyomásán múlik @L103 `"Az etnikum a GDPR szerint különleges adat, és a besorolás a gyakorlatban az " +`
- [C8] [CONFIRMED] a nemleges tényt külön mező mondja ki, mert egy üres dátum megkülönböztethetetlen az elmaradt ellenőrzéstől @L112 `EGY DÁTUMMEZŐ NEM TUD NEMET MONDANI.`
- [C9] [CONFIRMED] a PCB026 üres haláleset-dátumát az out.maternal.alive = "pos" teszi jogossá @L125 `var: "out.maternal.alive", value: "pos",`
- [C10] [CONFIRMED] a leképezés csak a PCB + számjegyek alakú ICHOM-hivatkozásokat veszi fel @L143 `if (code && /^PCB\d+$/.test(code)) m.set(code, d.id);`
- [C11] [CONFIRMED] az „On all forms” időzítésű tétel minden mérési ponthoz beleértendő, hogy láthatóan kimaradjon @L159 `const applies = item.timing.some(`
- [C12] [CONFIRMED] a nem "All Patients" inclusion-ű tétel conditional, mert a feltétel szabad szöveg @L189 `if (item.inclusion && item.inclusion !== "All Patients") {`
- [C13] [CONFIRMED] a leképezés nélküli tétel unmapped státuszt kap, fejlesztői feladatként @L201 `if (!varId) {`
- [C14] [CONFIRMED] a `complete` kizárólag a missing darabszám nullaságán múlik, a többi kategórián nem @L247 `const complete = counts.missing === 0;`
- [C15] [CONFIRMED] a containsIdentifiers a PCB000 kódú, kitöltött sor jelenlétét figyeli @L250 `containsIdentifiers: rows.some((r) => r.status === "present" && r.code === "PCB000"),`
- [C16] [CONFIRMED] a kohorsz mutató alapértelmezésben 80%-os válaszarány alatt nem közölhető összehasonlításra @L275 `  minResponseRate = 0.8,`
- [C17] [CONFIRMED] a nem PCB alakú ICHOM-hivatkozás error szintű hiba @L304 `if (!/^PCB\d+$/.test(code)) {`
- [C18] [CONFIRMED] a betöltött szabványban nem szereplő PCB-kód error szintű hiba @L311 `if (!known.has(code)) {`
- [C19] [CONFIRMED] ugyanarra az ICHOM-kódra hivatkozó több változó error szintű hiba @L320 `if (ids.length > 1) {`
