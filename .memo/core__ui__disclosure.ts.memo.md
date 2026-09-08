---
source: core/ui/disclosure.ts
sha256: 45f4a4415e48be95279f7584a3e79d039ad7497fccff950dfa8720175052628f
lines: 134
profile: code
generator: subagent
raw_tokens_est: 1370
verified: 11 confirmed
---

# core/ui/disclosure.ts

## Topics
- L1-78: az öt leletállapot, a lelet állapotának megállapítása és a nyitó kapuk gyűjtése
- L79-134: a látható mezők halmaza, a tényleges lelet és az interakciószám

## Claims

- [C1] [CONFIRMED] Öt leletállapot van, de a részletező lánc csak a kórosnál és a korlátozottnál nyílik meg @L31 `const OPENS: ReadonlySet<FindingState> = new Set(["abnormal", "limited"]);`
- [C2] [CONFIRMED] A `finding` definícióval nem rendelkező változó mindig kimaradtnak számít @L39 `if (!f) return "omitted";`
- [C3] [CONFIRMED] A fel nem oldható (nem rögzített) érték kimaradt, nem normális @L41 `if (r.state !== "ok") return "omitted";`
- [C4] [CONFIRMED] Minden olyan érték, ami nem a normális, korlátozott vagy lehetetlen jelölés, kórosnak minősül @L45 `return "abnormal";`
- [C5] [CONFIRMED] Kétféle kapu nyithat meg egy mezőt: a lelet lánca és a kódlistaelem érték-specifikus nyitása @L53 `options: Array<{ field: string; code: string | number }>;`
- [C6] [CONFIRMED] Az alias (tükör) változók kimaradnak a látható mezők számításából @L85 `if (d.aliasOf) continue;`
- [C7] [CONFIRMED] Kapu nélküli mező mindig látszik @L87 `if (!g) { visible.add(d.id); continue; }`
- [C8] [CONFIRMED] A láncnyitáshoz a lelet nyitott állapota és a lánc korábbi lépéseinek kitöltöttsége együtt kell @L92 `&& c.chain.slice(0, c.step).every(filled));`
- [C9] [CONFIRMED] Több kapu esetén egyetlen nyitott is elég a mező megjelenítéséhez @L100 `if (byCascade || byOption) visible.add(d.id);`
- [C10] [CONFIRMED] A tényleges lelet az `explicit` jelöléssel különbözteti meg a rögzítetlen, kimaradt leletet @L119 `if (st === "omitted") return { state: "omitted", value: null, explicit: false };`
- [C11] [CONFIRMED] Az érintett mezők számlálása csak az emberi bevitelt veszi be, a levezetett értékeket nem @L132 `(state.values[d.id] ?? []).some((v) => v.provenance !== "derived")).length;`
