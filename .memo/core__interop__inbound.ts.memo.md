---
source: core/interop/inbound.ts
sha256: fe498df78b88b9f035497149e50d6108338bc819e61ba73c73e6d7ace69b8a48
lines: 174
profile: code
generator: subagent
raw_tokens_est: 1934
verified: 7 confirmed
---

# core/interop/inbound.ts

## Topics
- L1-26: miért más a műszeres lelet, mint a PDF-kinyerés; AdmitOptions
- L27-174: admitResult négy kapuja, a HeldMessage várakozó sor és queueReport

## Claims

- [C1] [CONFIRMED] az `AdmitOptions.trustedSenders` csatornánként sorolja, mi fogadható el emberi jóváhagyás nélkül @L24 `  trustedSenders?: string[];`
- [C2] [CONFIRMED] az `admitResult` négy kapun futtatja végig az üzenetet ebben a sorrendben: azonosság, fogalom, mértékegység, QC @L27 `export function admitResult(`
- [C3] [CONFIRMED] azonosságkapunál a `review` kimenet `hold`-ot, minden más nem-egyezés `reject`-et ad @L34 `      outcome: m.outcome === "review" ? "hold" : "reject",`
- [C4] [CONFIRMED] LOINC-kódeltérés csak akkor állítja meg az üzenetet, ha a küldött kódrendszer neve kisbetűsítve `loinc` @L51 `  if (want && r.code?.system?.toLowerCase() === "loinc" && r.code.code !== want) {`
- [C5] [CONFIRMED] a QC-kapu csak a `"poct"` csatornára fut; a bukott QC `reject`, minden más nem-`pass` állapot `hold` @L86 `        outcome: qc === "fail" ? "reject" : "hold",`
- [C6] [CONFIRMED] a befogadott mérés eredete `device` és megbízhatósága `measured`, nem `imported` @L106 `    provenance: "device",`
- [C7] [CONFIRMED] a `queueReport` csak a még át nem nézett üzeneteket számolja, és a késettségi küszöb alapértelmezése 240 perc @L154 `  const open = held.filter((h) => !h.reviewedAt);`
