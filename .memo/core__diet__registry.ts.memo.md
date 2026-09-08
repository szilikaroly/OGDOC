---
source: core/diet/registry.ts
sha256: ad32d8a4e65748ed374c0dee83e73bb3f36ca3ceb4e067c70737ec46f6d54180
lines: 328
profile: code
generator: subagent
raw_tokens_est: 3218
verified: 21 confirmed
---

# core/diet/registry.ts

## Topics
- L1-55: modulcél, feltétel-operátorok, ProtocolState és LeafletSection típusok
- L56-215: DietProtocols: protokoll-kiértékelés és a nyomtatható betegtájékoztató
- L216-245: validáció befejezése és a célérték-szöveg formázása
- L246-283: protokollok betöltése JSON-ból, SupplementOverlap típus
- L284-328: szupplementációs átfedés számítása diéta és gyógyszerelés között

## Claims

- [C1] [CONFIRMED] KAPU: ha egy protokoll feltételéhez nincs adat, a protokoll unknown állapotba kerül, nem „nem vonatkozik” @L11 `állapotba kerül, és a tájékoztató kimondja, hogy egy`
- [C2] [CONFIRMED] a `test` összehasonlító operátorai Number()-rel kényszerítenek típust @L33 `case "lt": return Number(value) < Number(c.value);`
- [C3] [CONFIRMED] a protokoll állapota háromértékű: applies, notApplicable vagy unknown @L43 `status: "applies" | "notApplicable" | "unknown";`
- [C4] [CONFIRMED] a betegtájékoztató szakasztípusai közt szerepel az openQuestion is @L51 `kind: "target" | "supplement" | "avoid" | "advice" | "referral" | "openQuestion";`
- [C5] [CONFIRMED] a konstruktor duplikált protokoll-azonosítóra dob @L61 `if (this.byId.has(p.id)) throw new Error(`
- [C6] [CONFIRMED] `evaluate` a hiányzó adatú feltételt nem bukásnak veszi, hanem gyűjti és továbblép @L74 `if (r.state !== "ok") { missing.push(c.var); continue; }`
- [C7] [CONFIRMED] `states` az érvényeseket előre rendezi: applies < unknown < notApplicable @L100 `const rank = { applies: 0, unknown: 1, notApplicable: 2 } as const;`
- [C8] [CONFIRMED] a napi fehérje célérték a calc.protein.pregnancy kalkulátorból jön @L120 `const protein = runCalc(reg, state, "calc.protein.pregnancy", lang);`
- [C9] [CONFIRMED] ha az energia-kalkuláció nem áll elő, nem üres hely marad, hanem dietetikai konzílium javallata @L137 `text: "Napi energiaszükséglet: dietetikai konzílium állapítja meg",`
- [C10] [CONFIRMED] a több protokoll által kért azonos pótlás egyszer jelenik meg, de minden kiváltó protokollt felsorol @L157 `const prev = supps.get(suppId);`
- [C11] [CONFIRMED] ismeretlen szupplementációs mezőre hivatkozás error szintű hiba @L217 `if (!reg.get(s)) push("error", p.id,`
- [C12] [CONFIRMED] az indoklás nélküli tiltás csak warning, nem blokkoló hiba @L222 `push("warning", p.id,`
- [C13] [CONFIRMED] a semmilyen kimenetet nem adó protokoll warning-ot kap @L227 `push("warning", p.id, "a protokollnak nincs semmilyen kimenete");`
- [C14] [CONFIRMED] `targetText` a min/max megléte szerint tartomány, „legalább” vagy „legfeljebb” alakot ír @L237 `if (t.min != null) return`
- [C15] [CONFIRMED] `loadDietProtocols` könyvtárat és egyedi fájlt is elfogad bemenetként @L249 `const files = statSync(p).isDirectory() ? filesIn(p) : [p];`
- [C16] [CONFIRMED] a nem tömböt tartalmazó protokollfájl betöltése dob @L252 `if (!Array.isArray(parsed)) throw new Error(`
- [C17] [CONFIRMED] a `missing` átfedés szándékosan jelzés és nem kapu, mert a vény nélküli pótlásról a rendszer nem tud @L271 `nélkül szerzi be, és a rendszer erről nem tud. Ezért jelzés, nem kapu.`
- [C18] [CONFIRMED] a rendelt készítmények listája az rx.active feloldott értékéből jön @L297 `const rx = resolve(reg, state, "rx.active");`
- [C19] [CONFIRMED] csak a dietSupplement mezővel bíró ÉS ténylegesen rendelt készítmény fedez pótlást @L301 `if (!d.dietSupplement || !prescribed.includes(d.id)) continue;`
- [C20] [CONFIRMED] a fedezett pótlás duplicate, a fedezetlen missing státuszt kap @L309 `if (coveredBy.length) {`
- [C21] [CONFIRMED] az átfedéslista státusz, majd szupplementum-azonosító szerint rendezve tér vissza @L327 `return out.sort((a, b) => a.status.localeCompare(b.status) || a.supplement.localeCompare(b.supplement));`
