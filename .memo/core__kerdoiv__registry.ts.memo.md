---
source: core/kerdoiv/registry.ts
sha256: 54a9a9e89e5bf6166ca64cb12ce0bb9862f7d252e5b0bb635ab36d709cefb6d0
lines: 242
profile: code
generator: subagent
raw_tokens_est: 2618
verified: 11 confirmed
---

# core/kerdoiv/registry.ts

## Topics
- L1-52: a három kapu, a fail-safe üres licenckatalógus, a pontozás eredménytípusai
- L53-212: Instruments osztály — felvehetőség, kontextus, pontozás, kritikus tétel, validálás
- L213-242: kísérőfájlok névalapú kihagyása és a mérőeszközök betöltése

## Claims

- [C1] [CONFIRMED] nyilvántartás nélkül a válasz fail-safe: az `URES_LICENC` üres katalógus lép be @L25 `const URES_LICENC: LicencKatalogus = { szerepek: {}, licencek: [], dontesek: [] };`
- [C2] [CONFIRMED] a kritikus tétel a `ScoreBlocked` ágon is szerepel, tehát akkor is szól, ha nincs összpontszám @L48 `  /** A kritikus tétel akkor is szól, ha az összpontszám nem születik meg. */`
- [C3] [CONFIRMED] az `InstrumentResult` a sikeres pontszám és a hiányos kitöltés uniója @L51 `export type InstrumentResult = ScoreOk | ScoreBlocked;`
- [C4] [CONFIRMED] az `administrable` hiányzó katalógus esetén az üres katalógust, hiányzó dátum esetén a mai ISO napot használja @L88 `    const f = felvehetoseg(i, kat ?? URES_LICENC, ma ?? new Date().toISOString().slice(0, 10));`
- [C5] [CONFIRMED] a `contextOf` a `ctx.pathway`-hoz tartozó sávkészletet keresi, és ha nincs, `"default"`-ra esik vissza @L106 `    if (key && i.bands[key]) return key;`
- [C6] [CONFIRMED] a `score` a kritikus tételt a kalkulátor futtatása ELŐTT értékeli ki @L115 `    const critical = this.criticalOf(reg, state, id, lang);`
- [C7] [CONFIRMED] a sávkeresés `null` határt nyitottnak veszi, és mindkét oldalon záró intervallummal illeszt @L132 `      (b.min == null || calc.value >= b.min) && (b.max == null || calc.value <= b.max));`
- [C8] [CONFIRMED] a kritikus tétel akkor lő, ha a felvett érték eléri vagy meghaladja a `minScore`-t @L156 `    const triggered = Number(v.value) >= c.minScore;`
- [C9] [CONFIRMED] a `validate` hibát ad, ha a regiszterbeli kódkészlet eltér a tétel pontértékeitől @L188 `        if (codes.length && codes.sort().join(",") !== [...scores].sort().join(",")) {`
- [C10] [CONFIRMED] a kísérőfájlokat NÉV szerint hagyja ki, nem alak szerint, hogy egy elgépelt eszközfájl ne essen ki csendben @L228 `const KISERO_FAJLOK = ["licencek.json"];`
- [C11] [CONFIRMED] a `loadInstruments` könyvtárat és fájlt is elfogad, és a nem tömb tartalmú kérdőívfájlra kivételt dob @L230 `export function loadInstruments(...paths: string[]): Instruments {`
