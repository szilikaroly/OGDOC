---
source: core/op/registry.ts
sha256: 2c2b6844113bc4f672bca131317f8b024f529634d69b2446ae3ac6c548ec8ae2
lines: 253
profile: code
generator: subagent
raw_tokens_est: 2474
verified: 11 confirmed, 1 needs_agent
---

# core/op/registry.ts

## Topics
- L1-56: A WHO-kapu indoklása, a fázisok konstansa és a lezárás-ellenőrzés típusai
- L57-117: whoChecklist — fázisonkénti tételgyűjtés a regiszterből és a lezárás kapuja
- L118-253: Procedures osztály: kódajánlás, validáció és a törzsfájlok betöltése

## Claims

- [C1] [NEEDS_AGENT] ez a rendszer egyetlen dokumentációs hiányra záró kapuja, mert a WHO-lista a műtét alatt is kitölthető, tehát csak a lezárást késlelteti @semantic L1-13
- [C2] [CONFIRMED] a WHO-lista három fázisa kódban beégetett konstans @L26 `export const WHO_PHASES = ["signIn", "timeOut", "signOut"] as const;`
- [C3] [CONFIRMED] a fázis tételei a regiszterből jönnek: az `op.who.<fázis>.` előtagú, `bool` típusú mezők @L65 `.filter((d) => d.id.startsWith(prefix) && d.datatype === "bool")`
- [C4] [CONFIRMED] a címkéből levágja a „WHO — " előtagot a megjelenítéshez @L70 `label: L(d.label, lang).replace(/^WHO — /, ""),`
- [C5] [CONFIRMED] egy tétel csak szigorúan `true` értéknél számít kipipáltnak @L71 `checked: r.state === "ok" && r.value === true,`
- [C6] [CONFIRMED] a lezárás akkor és csak akkor engedélyezett, ha egyetlen fázisban sincs hiányzó tétel @L82 `const incomplete = phases.filter((p) => p.missing.length > 0);`
- [C7] [CONFIRMED] az `oenoFor` üres tömbbel tér vissza, ha az `op.procedure` nem oldható fel @L144 `if (r.state !== "ok") return [];`
- [C8] [CONFIRMED] kódcsalád esetén a javasolt kód `null`, csak a jelöltek kerülnek be — a rendszer nem választ @L168 `...base, system: p.codeFamily.system, code: null,`
- [C9] [CONFIRMED] a validáció a kódot csendben átugorja, ha a hivatkozott törzs nincs betöltve @L193 `if (!t) return;`
- [C10] [CONFIRMED] a kód nélküli beavatkozás csak `warning`, nem `error` @L202 `push("warning", p.id,`
- [C11] [CONFIRMED] a kódcsalád legalább két jelöltet kell felsoroljon, különben hiba @L221 `if (p.codeFamily.candidates.length < 2) {`
- [C12] [CONFIRMED] a `loadProcedures` könyvtárból csak a `.json` fájlokat olvassa, névsorba rendezve @L239 `readdirSync(dir).filter((f) => f.endsWith(".json")).sort()`
