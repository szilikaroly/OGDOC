---
source: core/interop/types.ts
sha256: 93092e166e91dca44099e9eccecc3a54fe476b9ee13d38598dc59f9fcf23bca6
lines: 169
profile: code
generator: subagent
raw_tokens_est: 1851
verified: 9 confirmed
---

# core/interop/types.ts

## Topics
- L1-72: a négy határkapu indoklása, Channel, IdentityClaim, MatchResult
- L73-169: matchPatient párosítási szabályai, InboundResult és AdmitDecision

## Claims

- [C1] [CONFIRMED] a `Channel` hat rögzített csatornát enged meg, köztük az `"eeszt"`-et és a `"research"`-öt @L32 `export type Channel = "his" | "lis" | "poct" | "pacs" | "eeszt" | "research";`
- [C2] [CONFIRMED] az `IdentityClaim` minden mezője opcionális — az üzenet bármelyik azonosítót elhagyhatja @L36 `/** Amit az üzenet állít a betegről. Egyik mező sem kötelező. */`
- [C3] [CONFIRMED] a `MatchResult` külön listázza az egyező és az ellentmondó azonosítókat @L55 `  agreeing: string[];`
- [C4] [CONFIRMED] az azonosító-összehasonlítás trimmelt, kisbetűsített szövegegyezés @L79 `    if (a.trim().toLowerCase() === b.trim().toLowerCase()) agreeing.push(name);`
- [C5] [CONFIRMED] bármely ellentmondó azonosító azonnal `noMatch`, függetlenül attól, hány egyezés van mellette @L97 `  if (conflicting.length) {`
- [C6] [CONFIRMED] egyező azonosítók mellett eltérő vezetéknév `review`-ot ad, nem automatikus párosítást @L107 `  if (nameDiffers) {`
- [C7] [CONFIRMED] `match` csak legalább két független egyező azonosítónál születik @L116 `  if (agreeing.length >= 2) {`
- [C8] [CONFIRMED] egyetlen azonosító + egyező név `review`, mert a név nem független azonosító @L121 `  if (agreeing.length === 1 && nameSame) {`
- [C9] [CONFIRMED] az `AdmitDecision.gate` a négy kapu egyikét vagy `null`-t tartalmaz @L168 `  gate: "identity" | "concept" | "unit" | "qc" | null;`
