---
source: core/store/fajl.ts
sha256: a4dc6b0b1f111326d35f50019fa81a0d8f093f4fe7ea815b58699420bc590912
lines: 120
profile: code
generator: subagent
raw_tokens_est: 1171
verified: 8 confirmed, 2 needs_agent
---

# core/store/fajl.ts

## Topics
- L1-46: a JSONL-archívum és a két fsync indoklása, esetazonosító fájlnévvé alakítása
- L47-120: a FileArchive osztály — olvasás, hozzáfűzés, útvonal-lekérdezés

## Claims

- [C1] [NEEDS_AGENT] Az archívum soronként egy JSON bejegyzés (JSONL), hozzáfűzéssel, hogy a félbeszakadt írás legrosszabb esetben csonka utolsó sort hagyjon, ne vigye az egész esetet @semantic L8-11
- [C2] [NEEDS_AGENT] Új esetfájlnál a könyvtárat is szinkronizálja, mert különben áramszünet után a tartalom megvan, de nincs neve @semantic L13-18
- [C3] [CONFIRMED] Az esetazonosítót engedélyező mintával validálja, és útvonal-karakter esetén kivételt dob @L37 `if (!/^[A-Za-z0-9._-]{1,120}$/.test(caseId) || caseId.startsWith(".")) {`
- [C4] [CONFIRMED] A fájl a megadott könyvtárban az azonosítóból képzett néven áll @L44 `return join(dir,`
- [C5] [CONFIRMED] Nem létező archívumra az olvasás üres tömböt ad, nem hibázik @L56 `if (!existsSync(file)) return [];`
- [C6] [CONFIRMED] Az olvashatatlan sort csak akkor nyeli el, ha az az utolsó érdemi sor; bárhol máshol sérülésként kivételt dob @L68 `if (i === lines.length - 1 || lines.slice(i + 1).every((l) => !l.trim())) break;`
- [C7] [CONFIRMED] Üres bejegyzéslistára a hozzáfűzés írás nélkül `local` tartósságot ad vissza @L80 `if (!entries.length) return "local";`
- [C8] [CONFIRMED] A hozzáfűzés a fájlt lezárás előtt fsync-eli, tehát a tartalom tartós @L89 `await fh.sync();                       // a TARTALOM tartós`
- [C9] [CONFIRMED] Ha a könyvtár szinkronizálása nem sikerül, a visszaadott tartósság `buffered` lesz — a hiba nincs elhallgatva @L103 `return "buffered";                   // nem mondhatjuk, hogy mentve`
- [C10] [CONFIRMED] A `root` getter nem a tárolókönyvtárat, hanem annak szülőjét adja vissza @L118 `return dirname(this.dir);`
