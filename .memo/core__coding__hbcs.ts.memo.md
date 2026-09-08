---
source: core/coding/hbcs.ts
sha256: ac2a16fc5e1e6583c7bbb4e15e74f78091d7da14dbf9b5927ff5f6812f8e8848
lines: 127
profile: code
generator: subagent
raw_tokens_est: 1405
verified: 7 confirmed, 1 needs_agent
---

# core/coding/hbcs.ts

## Topics
- L1-57: Miért nincs besorolás szabálykönyv nélkül, a bemenet- és eredménytípusok
- L58-127: A besoroláshoz szükséges öt bemenet összeszedése és a zárt kapu indoklása

## Claims

- [C1] [CONFIRMED] Az eredmény státusza ebben a kiadásban mindig `blocked` — ez szándékolt állítás @L38 `ebben a kiadásban — ez állítás, nem hiányosság.`
- [C2] [CONFIRMED] A csoport típusa `null`, tehát a modul szerkezetileg sem tud csoportot adni @L40 `group: null;`
- [C3] [CONFIRMED] A szabálykönyv ellenőrzöttségét a modul kívülről kapja meg opcióként, nem magáról állítja @L55 `rulebookVerified?: boolean;`
- [C4] [NEEDS_AGENT] Öt bemenetet szed össze: fődiagnózis, kísérő betegségek, beavatkozások, ápolási idő és az elbocsátás módja @semantic L70-98
- [C5] [CONFIRMED] A hiányzó bemenet értéke nem kerül be az eredménybe, csak a hiány ténye @L66 `inputs.push({ id, label, present, value: present ? value : undefined, why });`
- [C6] [CONFIRMED] A kísérő betegség csak akkor számít meglévőnek, ha nem üres tömb @L78 `const hasSec = sec.state === "ok" && Array.isArray(sec.value) && sec.value.length > 0;`
- [C7] [CONFIRMED] Az indoklásba a rendszer által ajánlott kódok is bekerülnek @L101 `const suggestedCodes = rules.suggest(reg, state, lang).codes;`
- [C8] [CONFIRMED] Ellenőrzöttként jelölt szabálykönyv mellett is `blocked` marad az eredmény, csak az indoklás változik @L107 `reason: verified`
