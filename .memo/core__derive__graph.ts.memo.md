---
source: core/derive/graph.ts
sha256: f0f6fecae3fa164f7d635372f9d8e04ed4dd0fe701a5fe5a4876f4d90b0fbd7c
lines: 98
profile: code
generator: subagent
raw_tokens_est: 839
verified: 6 confirmed
---

# core/derive/graph.ts

## Topics
- L1-8: modulcél és az Edge éltípus deklarációja
- L9-98: DerivationGraph: élépítés, consumers/sources, hatásvizsgálat, topologikus sorrend

## Claims

- [C1] [CONFIRMED] egy él háromféle lehet: computed, prefill vagy mirror @L7 `kind: "computed" | "prefill" | "mirror";`
- [C2] [CONFIRMED] a konstruktor aliasOf esetén mirror élt húz az alias forrásától a definícióhoz @L21 `if (d.aliasOf) this.add({ from: d.aliasOf, to: d.id, kind: "mirror" });`
- [C3] [CONFIRMED] prefill forrásoknál a `self.` és `import.` előtagú forrásokból nem keletkezik él @L29 `if (!f.source.startsWith("self.") && !f.source.startsWith("import.")) {`
- [C4] [CONFIRMED] a `consumers` lista generált: a kimenő élek céljai duplikátum nélkül, rendezve @L45 `return [...new Set((this.outgoing.get(id) ?? []).map((e) => e.to))].sort();`
- [C5] [CONFIRMED] `impactOf` veremmel járja be a teljes tranzitív hatáshalmazt, nem csak a közvetlen célokat @L60 `while (stack.length) {`
- [C6] [CONFIRMED] `topologicalOrder` kör esetén dob, és az Error szövege felsorolja az érintett változókat @L93 `Kör a levezetési gráfban — érintett változók:`
