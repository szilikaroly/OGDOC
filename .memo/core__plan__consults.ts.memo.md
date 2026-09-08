---
source: core/plan/consults.ts
sha256: d3dabb1cbcfd2eef11530e9fd54fe7710c49b220de349e49f1681b0f001dbf9a
lines: 172
profile: code
generator: subagent
raw_tokens_est: 1631
verified: 8 confirmed, 1 needs_agent
---

# core/plan/consults.ts

## Topics
- L1-56: Javallat kontra megkérés, a feltételkiértékelő helper és a státuszok
- L57-172: ConsultSet — kiértékelés, rangsorolt lista, nyitott javallatok, validáció

## Claims

- [C1] [NEEDS_AGENT] a javallat nem szűnik meg attól, hogy nem kérték meg; indoklás nélkül nyitott marad @semantic L1-13
- [C2] [CONFIRMED] a feltételhez hiányzó adat külön státusz, nem azonos a „nem javallt"-tal @L44 `| "unknown";`
- [C3] [CONFIRMED] a rendezési operátorok számmá alakítanak, tehát nem sztringként hasonlítanak @L27 `case "lt": return Number(value) < Number(c.value);`
- [C4] [CONFIRMED] hiányzó vagy üres `whenAny` esetén a bármelyik-ág automatikusan teljesítettnek számít @L86 `let anyOk = !r.whenAny?.length;`
- [C5] [CONFIRMED] bármely hiányzó feltételváltozó `unknown` státuszt eredményez, felülírva a javallatot @L100 `if (missing.length) {`
- [C6] [CONFIRMED] a megkérés ténye a `plan.consult.requested` mezőben felsorolt szakterületekből derül ki @L110 `const requested = this.requestedSpecialties(reg, state).has(r.specialty);`
- [C7] [CONFIRMED] a lista rangsora: sürgős, javallt, ismeretlen, megkért, nem javallt @L129 `urgent: 0, indicated: 1, unknown: 2, requested: 3, notIndicated: 4,`
- [C8] [CONFIRMED] egyetlen `plan.consult.declined` indoklás MINDEN nyitott javallatot elnyom, nem csak az érintettet @L144 `(c) => (c.status === "urgent" || c.status === "indicated") && !hasReason,`
- [C9] [CONFIRMED] hiba, ha a szabály szakterülete nem szerepel a `plan.consult.requested` értékkészletében @L161 `if (!codes.has(r.specialty)) {`
