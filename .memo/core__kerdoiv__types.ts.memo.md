---
source: core/kerdoiv/types.ts
sha256: 7b89fc644433d889642b72df45b45f25d607aa9a88dfbd85952ce67f93ff4cb7
lines: 92
profile: code
generator: subagent
raw_tokens_est: 942
verified: 8 confirmed
---

# core/kerdoiv/types.ts

## Topics
- L1-49: a tételszöveg sérthetetlensége és jogi védettsége; QuestionOption, Question, ScoreBand
- L50-92: az Instrument rekord — sávok, kritikus tétel, forrás, fordítás, jogi állapot

## Claims

- [C1] [CONFIRMED] a definíció kétféle szöveget különböztet meg: a saját `label`-t és a licencköteles, hiányozható `text`-et @L26 `  text?: I18n | null;`
- [C2] [CONFIRMED] a tétel sorszáma a hivatalos eszközből származik, és a sorrend a pontozás része @L30 `  /** Sorszám a hivatalos eszközben. A sorrend a pontozás része. */`
- [C3] [CONFIRMED] a `ScoreBand.severity` háromértékű, és a `redflag` is sávszint @L47 `  severity: "normal" | "watch" | "redflag";`
- [C4] [CONFIRMED] a vágóértékek kontextusonként külön készletben állnak, a `ctx.pathway` dönti el, melyik érvényes @L62 `  bands: Record<string, ScoreBand[]>;`
- [C5] [CONFIRMED] a kritikus tétel kapu, nem küszöb: az összpontszámtól függetlenül ad vörös zászlót @L70 `  criticalItem?: { id: string; minScore: number; message: I18n } | null;`
- [C6] [CONFIRMED] a validációs közlemény megnevezése kötelező mező, enélkül az eszköz csak kérdéssor @L72 `  source: { cite: string; pmid?: string | null; doi?: string | null };`
- [C7] [CONFIRMED] a fordítás állapota háromértékű, és a `validated`-hez saját közlemény tartozhat @L80 `    status: "validated" | "unvalidated" | "none";`
- [C8] [CONFIRMED] a tételszöveg jogi állapota háromértékű, és a `notLicensed` esetén az eszköz nem vehető fel @L90 `  itemText: { status: "loaded" | "notLicensed" | "public"; note?: I18n };`
