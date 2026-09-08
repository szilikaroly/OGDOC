---
source: core/codes.ts
sha256: a165baf4298ab6f33462c423723d1bb142808f13809ecac686051404119d1ad2
lines: 160
profile: code
generator: subagent
raw_tokens_est: 1487
verified: 12 confirmed
---

# core/codes.ts

## Topics
- L1-63: Miért kell verzió szerint olvasni, a kódolvasás eredménytípusa, listaválasztás
- L64-118: Egy rögzített kód feloldása a saját verziója szerint, figyelmeztetések
- L119-160: A verziózott kódlisták integritás-ellenőrzése

## Claims

- [C1] [CONFIRMED] Az `itemsOf` a jelenlegi értékkészletet adja vissza, ha nincs megadott verzió vagy az egyezik az aktuálissal @L49 `if (!version || version === current) {`
- [C2] [CONFIRMED] Ismeretlen korábbi verzióra az `itemsOf` `null`-t ad @L53 `if (!v) return null;`
- [C3] [CONFIRMED] A `meaningChanged` a csendes csapdát jelöli: a kód ma is létezik, de más a címkéje @L34 `meaningChanged: boolean;`
- [C4] [CONFIRMED] Rögzített verzió hiányában a `readCode` a jelenlegi verzió szerint olvas @L71 `const version = recordedVersion || currentVersion;`
- [C5] [CONFIRMED] A listában nem szereplő kód címkéje maga a kód szövege lesz @L77 `if (!it) return String(code);`
- [C6] [CONFIRMED] A `retired` pontosan azt jelenti, hogy a kód a mai értékkészletben nincs benne @L86 `const retired = !inCurrent;`
- [C7] [CONFIRMED] A jelentésváltozás megállapítása a rögzítéskori és a mai címke szöveges összehasonlítása @L87 `const meaningChanged = !!inCurrent && !!currentLabel && currentLabel !== label;`
- [C8] [CONFIRMED] A `caveat` a részüzenetek szóközzel összefűzött szövege, üres lista esetén `undefined` @L114 `caveat: parts.length ? parts.join(" ") : undefined,`
- [C9] [CONFIRMED] Kódrendszer megnevezése nélküli verziózott lista hiba, és a további ellenőrzések kimaradnak @L125 `if (!d.codeSystem) {`
- [C10] [CONFIRMED] Az ismétlődő kódlista-verzió hiba @L134 `if (seen.has(v.version)) {`
- [C11] [CONFIRMED] A jelenlegi verzió nem szerepelhet a korábbi verziók között @L138 `if (v.version === d.codeSystem.version) {`
- [C12] [CONFIRMED] A hiányzó érvényességi vég (`validTo`) csak figyelmeztetés @L149 `if (!v.validTo) {`
