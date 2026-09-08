---
source: core/calc/run.ts
sha256: 1a2e1ba2ebd46ca55284b88ff6d9b5296271b2c576673c7344bf3d158cffca2f
lines: 182
profile: code
generator: subagent
raw_tokens_est: 1567
verified: 14 confirmed
---

# core/calc/run.ts

## Topics
- L1-52: Eredménytípus, számmá alakítás dátumokkal, sávkeresés
- L53-140: A runCalc futtató: bemenetgyűjtés, kapu, számítás, kerekítés
- L141-182: Build-idejű validálás a regiszterrel szemben

## Claims

- [C1] [CONFIRMED] A `toNumber` a `date`/`datetime` típusú változót epoch-ezredmásodpercre parsolja @L33 `const ms = Date.parse(String(raw));`
- [C2] [CONFIRMED] A `toNumber` a logikai értéket 1-re, illetve 0-ra képezi @L37 `if (typeof raw === "boolean") return raw ? 1 : 0;`
- [C3] [CONFIRMED] A sávillesztés alul zárt, felül nyitott intervallum @L45 `const okMax = b.max == null || value < b.max;`
- [C4] [CONFIRMED] Illeszkedő sáv híján a `bandFor` `undefined`-ot ad @L50 `return undefined;`
- [C5] [CONFIRMED] Ismeretlen kalkulátor-azonosítóra a `runCalc` kivételt dob, nem `insufficient`-et ad @L57 `if (!def) throw new Error(`
- [C6] [CONFIRMED] A nem `ok` állapotú bemenet csak akkor kerül a hiányzók közé, ha nincs `required: false` @L68 `if (inp.required !== false) missing.push(inp.id);`
- [C7] [CONFIRMED] A pillanatkép a nem `ok` bemenetet az állapot nevével, szögletes jelöléssel rögzíti @L66 `snapshot[inp.id] = r.state === "ok" ? r.value : `
- [C8] [CONFIRMED] A `verified` kapu a bemenetek meglétének ellenőrzése után, de a számítás előtt zár @L91 `if (!def.verified) {`
- [C9] [CONFIRMED] Nem véges vagy `null` eredménynél `insufficient` születik üres `missing` listával @L104 `if (raw == null || !Number.isFinite(raw)) {`
- [C10] [CONFIRMED] A kerekítés alapértelmezése 2 tizedesjegy @L113 `const digits = def.output.digits ?? 2;`
- [C11] [CONFIRMED] A hivatkozottság a regiszter `computed` levezetéseiből gyűlik össze @L148 `if (d.derivation?.kind === "computed") referenced.add(d.derivation.calc);`
- [C12] [CONFIRMED] A regiszterből nem hivatkozott kalkulátor csak figyelmeztetés, és a bemenet-ellenőrzése kimarad @L159 `if (!referenced.has(c.id)) {`
- [C13] [CONFIRMED] A hiányzó emberi olvasatú `formula` hiba @L157 `if (!c.formula) issues.push({ severity: "error", id: c.id, message: "hiányzik az emberi olvasatú képlet" });`
- [C14] [CONFIRMED] A regiszterbeli és a képlet által várt egység eltérése hiba, nem figyelmeztetés @L173 `if (inp.unit && def.unit && inp.unit !== def.unit) {`
