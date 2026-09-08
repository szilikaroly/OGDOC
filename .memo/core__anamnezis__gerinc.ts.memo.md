---
source: core/anamnezis/gerinc.ts
sha256: 99b791b5082bf42bfe0b05cb313adb1a01fe4073b63a1db83de07f4599a3b979
lines: 219
profile: code
generator: subagent
raw_tokens_est: 2156
verified: 11 confirmed, 1 needs_agent
---

# core/anamnezis/gerinc.ts

## Topics
- L1-146: Forrásbesorolás, gerinc-típusok, hiányzó bemenet kérdésekre bontása
- L147-219: A négy fogyasztó futtatása, kérdéslista és összefoglaló előállítása

## Claims

- [C1] [CONFIRMED] A `FORRAS_ELOTAGOK` adatként (nem elágazásként) köt változó-előtagokat forrásokhoz @L49 `export const FORRAS_ELOTAGOK: Array<[string, Forras]> = [`
- [C2] [CONFIRMED] A `forrasa` az első illeszkedő előtag forrását adja, találat híján `"ismeretlen"`-t @L65 `return "ismeretlen";`
- [C3] [CONFIRMED] A `kerdesekre` a már látott azonosítót üres listával zárja rövidre, így a rekurzió nem hurkol @L115 `if (latott.has(id)) return [];`
- [C4] [CONFIRMED] Nem `computed` levezetésű (vagy ismeretlen) mező önmagát adja vissza kérdésként, `szamitott: null`-lal @L120 `if (!def || def.derivation?.kind !== "computed") {`
- [C5] [CONFIRMED] Csak az a bemenet lesz kérdés, amit a `resolve` nem tud `"ok"` állapotban előállítani @L126 `if (resolve(reg, state, inp).state === "ok") continue;`
- [C6] [CONFIRMED] Ha minden bemenet megvan, de az érték mégsem áll elő, maga a számított mező marad a kérdés @L132 `return out.length ? out : [{ variable: primary, szamitott: null }];`
- [C7] [NEEDS_AGENT] A `gerincAllapot` négy rögzített fogyasztót futtat: vérzés (CMQCC), VBAC, VTE és szűrés @semantic L150-171
- [C8] [CONFIRMED] A szűrési modul hiányai csak az `unknown` státuszú tételekből származnak @L167 `.filter((s) => s.status === "unknown")`
- [C9] [CONFIRMED] Ugyanaz a változó több modulnál nem duplikálódik, csak a `kinek` lista bővül @L179 `if (!meglevo.kinek.includes(f.label)) meglevo.kinek.push(f.label);`
- [C10] [CONFIRMED] A felirat nyelvi visszaesése: kért nyelv, majd magyar, végül maga a változónév @L185 `label: def?.label?.[lang] ?? def?.label?.hu ?? k.variable,`
- [C11] [CONFIRMED] A kérdéslista a változónév szerint ábécésorrendbe rendeződik @L194 `const kerdesek = [...map.values()].sort((a, b) => a.variable.localeCompare(b.variable));`
- [C12] [CONFIRMED] A gerinc csak akkor `keszen`, ha nincs anamnézis-forrású és nincs besorolatlan kérdés — a `meres` forrásúak nem rontják el @L197 `const keszen = anamnezisHiany.length === 0 && besorolatlan.length === 0;`
