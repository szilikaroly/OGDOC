---
source: core/us/anatomia.ts
sha256: f3a880b66c3894379d6287c255beb2ad19dc1fcda2468450fb7370be7422fe85
lines: 165
profile: code
generator: subagent
raw_tokens_est: 1509
verified: 13 confirmed
---

# core/us/anatomia.ts

## Topics
- L1-91: Magzati anatómiai katalógus típusai, betöltés, szervállapotok
- L92-130: Szervállapot olvasata: kóros lelet vagy ismétlést kérő korlát
- L131-165: A katalógus szerkezeti validálása

## Claims

- [C1] [CONFIRMED] Öt szervállapot van, a „nem látható” és a „nem hozható látótérbe” külön @L30 `  | "normal" | "notVisible" | "notObtainable" | "abnormal" | "notRecorded";`
- [C2] [CONFIRMED] A `loadAnatomy()` szinkron fájlolvasás és `JSON.parse`, séma-ellenőrzés nélküli típuskényszerítéssel @L68 `  return JSON.parse(readFileSync(path, "utf8")) as AnatomyCatalogue;`
- [C3] [CONFIRMED] A `region()` lineáris kereséssel `undefined`-ot ad ismeretlen azonosítóra @L72 `  return cat.regions.find((r) => r.id === id);`
- [C4] [CONFIRMED] A katalógus külön mezőt tart a NYOMTATOTT leletre vonatkozó kapunak, mert a rögzített és a nyomtatott lelet nem ugyanaz @L56 `  printGate?: I18n;`
- [C5] [CONFIRMED] A `StateReading` szerkezetileg választja szét a kóros leletet és a vizsgálatismétlés igényét @L75 `export interface StateReading {`
- [C6] [CONFIRMED] A `notVisible` LELETNEK számít: kórosnak jelöl, de nem kér ismétlést @L101 `        region: r.id, state, abnormalFinding: true, repeatNeeded: false,`
- [C7] [CONFIRMED] A `notObtainable` nem kóros lelet, hanem ismétlést kérő vizsgálati korlát @L108 `        region: r.id, state, abnormalFinding: false, repeatNeeded: true,`
- [C8] [CONFIRMED] A `notRecorded` szintén ismétlést kér, és sem normálisnak, sem kórosnak nem számít @L121 `        region: r.id, state, abnormalFinding: false, repeatNeeded: true,`
- [C9] [CONFIRMED] Duplikált szervrendszer-azonosító hibát ad @L135 `    if (seen.has(r.id)) out.push({ severity: "error", id: r.id, message: "duplikált szervrendszer" });`
- [C10] [CONFIRMED] Hiányzó normál állítás hiba: a „normális” önmagában nem lelet @L137 `    if (!r.normalStatement?.trim()) {`
- [C11] [CONFIRMED] Az üres rendellenesség-lista csak figyelmeztetés, nem hiba @L145 `    if (!r.abnormalities.length) {`
- [C12] [CONFIRMED] Mind az öt szervállapotnak szerepelnie kell a katalógusban, egyik sem hagyható el @L153 `  for (const need of ["normal", "notVisible", "notObtainable", "abnormal", "notRecorded"]) {`
- [C13] [CONFIRMED] Részleges lefedettség a lyukak megnevezése nélkül hiba @L161 `  if (cat.coverage === "partial" && !cat.gaps?.length) {`
