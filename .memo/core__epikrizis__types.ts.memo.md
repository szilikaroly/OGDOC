---
source: core/epikrizis/types.ts
sha256: 37257b18092c919f67e2a1a5d36fa4b50ac3af7cf596f9035c9333a8c16cd9a5
lines: 89
profile: code
generator: subagent
raw_tokens_est: 763
verified: 8 confirmed
---

# core/epikrizis/types.ts

## Topics
- L1-63: modulszabály, szegmensfajták, Segment és szakasz típusok, stílusok
- L64-89: az Epicrisis dokumentum és a generálás módjának deklarálása

## Claims

- [C1] [CONFIRMED] a modul nem gyűjt adatot, kizárólag a már rögzítettből dolgozik @L4 `EZ A MODUL NEM GYŰJT ADATOT. Kizárólag a már rögzítettből dolgozik: ha itt`
- [C2] [CONFIRMED] KAPU: `from` mező nélküli szegmens nem kerülhet a generált szövegbe @L9 `Egy szegmens, aminek nincs`
- [C3] [CONFIRMED] a `gap` szegmens azért létezik, mert a meg nem jelenő blokkot a klinikus negatív leletnek olvasná @L32 `epikrízisben a hiány EXPLICIT, nem üresség.`
- [C4] [CONFIRMED] a Segment.from üresen nem maradhat, ezt a validátor és a teszt is ellenőrzi @L41 `Üresen nem maradhat — a validátor és a teszt is ezt ellenőrzi.`
- [C5] [CONFIRMED] a szegmens súlyossága normal, watch vagy redflag lehet @L48 `severity?: "normal" | "watch" | "redflag";`
- [C6] [CONFIRMED] a `discharge` stílusú epikrízis a 14. modul bemenete @L60 `| "discharge"   // zárójelentés — a 14. modul bemenete`
- [C7] [CONFIRMED] a dokumentum felületi neve „okoslelet”, mert nincs nyelvi modell a folyamatban @L67 `A dokumentum saját neve a felületen: **okoslelet**.`
- [C8] [CONFIRMED] a generálás metódusa típusszinten csak "rule-based" lehet, determinisztikus szabályalapú @L84 `method: "rule-based";`
