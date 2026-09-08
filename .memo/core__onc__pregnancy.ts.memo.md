---
source: core/onc/pregnancy.ts
sha256: 12ac410797c1c3d5f7a829690f05d9c63e88e96a32ce2797501d41b8c4341853
lines: 157
profile: code
generator: subagent
raw_tokens_est: 1845
verified: 8 confirmed
---

# core/onc/pregnancy.ts

## Topics
- L1-54: A modul célja, a modalitás-típusok és a megosztott döntéshozatal kapuja
- L55-157: pregnancyOncAdvice — trimeszter szerinti modalitás-megítélés és a KAPU kiértékelése

## Claims

- [C1] [CONFIRMED] a megítélés négyértékű, az „unknown" külön szint a „no" mellett @L23 `export type Feasibility = "yes" | "conditional" | "no" | "unknown";`
- [C2] [CONFIRMED] a `sharedDecision` blokk nem tanács, hanem kapu: a kezelési terv lezárhatóságát dönti el @L39 `sharedDecision: {`
- [C3] [CONFIRMED] a trimeszter a gesztációs korból számítódik: 14 hét alatt 1., 28 hét alatt 2., felette 3. @L60 `const trimester = weeks == null ? null : weeks < 14 ? 1 : weeks < 28 ? 2 : 3;`
- [C4] [CONFIRMED] ismeretlen gesztációs kornál mind az öt modalitás `"unknown"` lesz, nincs alapértelmezett megítélés @L75 `add(m, l, "unknown",`
- [C5] [CONFIRMED] a kemoterápia az I. trimeszterben `"no"`, minden más trimeszterben `"conditional"` @L87 `add("chemo", "Kemoterápia", "no",`
- [C6] [CONFIRMED] a sugárterápia megítélése közvetlenül a trimeszter függvénye @L102 `add("radio", "Sugárterápia", trimester === 1 ? "no" : "conditional",`
- [C7] [CONFIRMED] a `documented` csak a szigorúan `true` értékre igaz, más igaz-szerű érték nem elég @L127 `const documented = sd.state === "ok" && sd.value === true;`
- [C8] [CONFIRMED] a terv lezárásához a dokumentált döntéshozatal ÉS a megbeszélt lehetőségek felsorolása is kell @L138 `canProceed: documented && hasOptions,`
