---
source: core/ui/formspec.ts
sha256: e5981e2180aca7a3b85aab983ef3c709b0f0c023121961f703ba5814573a62b0
lines: 207
profile: code
generator: subagent
raw_tokens_est: 2124
verified: 17 confirmed, 1 needs_agent
---

# core/ui/formspec.ts

## Topics
- L1-10: a DOM-mentes űrlapleírás célja és importjai
- L11-57: a mező- és szekcióleírás típusa, az adattípus-vezérlő megfeleltetés
- L58-113: az űrlapleírás felépítése és a részletező mezők sorrendbe rakása
- L114-151: egyetlen változó mezőleírássá alakítása
- L152-207: a mezőnkénti szöveges dokumentáció előállítása

## Claims

- [C1] [NEEDS_AGENT] A felület semmit nem tud, amit a regiszter ne mondana meg; ugyanaz a leírás megy minden rendererbe @semantic L1-5
- [C2] [CONFIRMED] Nyolcféle vezérlő létezik, köztük a nem szerkeszthető @L14 `control: "number" | "text" | "date" | "datetime" | "select" | "tristate" | "checkbox" | "readonly";`
- [C3] [CONFIRMED] A forrásnyelvre való visszaesést a leírás külön jelöli, hogy ne legyen csendes @L33 `labelFallback?: boolean;`
- [C4] [CONFIRMED] Az adattípus-vezérlő megfeleltetés adattábla, és a többértékű kódolt mező is legördülőt kap @L54 `coded: "select", "coded-multi": "select", tristate: "tristate", bool: "checkbox",`
- [C5] [CONFIRMED] A nyitási viszonyokat a lelet-láncból megfordítva építi fel @L64 `for (const t of d.finding?.cascade ?? []) gate(t, d.id);`
- [C6] [CONFIRMED] Az alias mező nem kerül be önálló mezőként az űrlapba @L69 `if (d.aliasOf) continue;                       // a mirror nem önálló mező`
- [C7] [CONFIRMED] A szekciók modulonként, modulnév szerinti ábécérendben állnak @L85 `.sort(([a], [b]) => a.localeCompare(b))`
- [C8] [CONFIRMED] A részletező mező kimarad a saját helyéről, és a leletje után kerül be @L101 `if (f.openedBy && f.openedBy.some((g) => byId.has(g))) continue;  // majd a leletje után`
- [C9] [CONFIRMED] Ami egyik szabály szerint sem került helyre, a lista végére kerül @L110 `for (const f of fields) if (!placed.has(f.id)) out.push(f);`
- [C10] [CONFIRMED] A számított mező nem szerkeszthető vezérlőt kap, egyébként az adattípus dönt, szöveg tartalékkal @L120 `control: computed ? "readonly" : CONTROL[d.datatype] ?? "text",`
- [C11] [CONFIRMED] Ha akár egyetlen opciócímke hiányzik a kért nyelven, az egész lista forrásnyelvinek jelölődik @L133 `if (d.valueSet.some((o) => !(lang === "hu" ? o.label_hu : o.label_en))) {`
- [C12] [CONFIRMED] Az opció „nem tudom” jellegét a kódlistaelem jelzőiből veszi át @L139 `unknown: o.flags?.includes("unknown") || undefined,`
- [C13] [CONFIRMED] A számított mező bemeneteit a regiszter levezetési gráfja adja, nem a definíció ismétli @L143 `f.computed = { explain: d.derivation.explain?.[lang], inputs: reg.computedInputs(d.id) };`
- [C14] [CONFIRMED] A súgó a mérési útmutatóból jön, tartalékban a csapdák szövegéből @L146 `const hint = d.documentation.howToMeasure?.[lang] ?? d.documentation.pitfalls?.[lang];`
- [C15] [CONFIRMED] Ismeretlen változóazonosítóra a dokumentációgenerálás kivételt dob @L154 `if (!d) throw new Error(`
- [C16] [CONFIRMED] A phi jelölésű mezőnél a dokumentáció kimondja, hogy kimarad az exportból és a lekérdezőből @L187 `if (d.phi) lines.push(pad("JELÖLÉS", "phi — beteg-azonosító, az exportból és a lekérdezőből kimarad"));`
- [C17] [CONFIRMED] A feltöltő és a továbbtöltött mezők listája a levezetési gráfból generált @L190 `const src = g.sourcesOf(id);`
- [C18] [CONFIRMED] A dokumentáció a közvetlen fogyasztók mellett az összes érintett mező számát is kiírja @L195 `const impact = g.impactOf(id);`
