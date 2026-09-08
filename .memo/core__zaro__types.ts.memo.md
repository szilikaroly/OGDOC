---
source: core/zaro/types.ts
sha256: 25abdead87f9278217c6db1bfe04b6ab002e0ec6cfc45b48a90023c1f2f49f84
lines: 67
profile: code
generator: subagent
raw_tokens_est: 567
verified: 4 confirmed, 2 needs_agent
---

# core/zaro/types.ts

## Topics
- L1-67: A zárójelentés blokkjainak, hitelességének és generálásának típusai

## Claims

- [C1] [NEEDS_AGENT] A blokk három állapota: kitöltött, hiányzó, nem vonatkozik rá @semantic L21-27
- [C2] [NEEDS_AGENT] A „nem vonatkozik rá” csak rögzített tényből jöhet, az adat hiánya nem elég hozzá @semantic L14-16
- [C3] [CONFIRMED] Az indoklás a típusban opcionális, kötelezőségét csak a megjegyzés mondja ki @L35 `  note?: string;`
- [C4] [CONFIRMED] A hitelesség kétállapotú, és külön mező mondja meg, kinyomtatható-e hiteles dokumentumként @L49 `  status: "draft" | "authentic";`
- [C5] [CONFIRMED] A nyomtatott dokumentumon megjelenő figyelmeztetés kötelező mező, nem opcionális @L58 `  notice: string;`
- [C6] [CONFIRMED] A generálás módja típusszinten rögzített szabályalapú érték @L66 `  generation: { method: "rule-based"; note: I18n; at: string };`
