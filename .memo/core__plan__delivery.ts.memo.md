---
source: core/plan/delivery.ts
sha256: 8f5a3a442f2f1090c0cb58a0dd42a75b8013e368d87899d64ea80e15a65584e7
lines: 153
profile: code
generator: subagent
raw_tokens_est: 1722
verified: 8 confirmed
---

# core/plan/delivery.ts

## Topics
- L1-52: Miért nem dönt a rendszer a szülésmódról, és a terv típusai
- L53-153: deliveryPlan — TOLAC felajánlhatósága, elektív CS, és a döntés-kapu

## Claims

- [C1] [CONFIRMED] a felajánlhatóság négyértékű, az „unknown" külön szint az ellenjavallat mellett @L26 `export type Offerability = "offerable" | "conditional" | "contraindicated" | "unknown";`
- [C2] [CONFIRMED] a modul soha nem ad szülésmód-javaslatot: a `recommendation` típusa maga `null` @L49 `recommendation: null;`
- [C3] [CONFIRMED] a VBAC-ellenjavallat minden más mérlegelést megelőz @L64 `if (vbac.contraindicated.yes) {`
- [C4] [CONFIRMED] ha az intézmény nem TOLAC-képes, a TOLAC ellenjavallt ebben az intézményben @L78 `} else if (instOk === false) {`
- [C5] [CONFIRMED] ismeretlen intézményi feltételnél a TOLAC „unknown", nem felajánlható @L92 `offerability: "unknown",`
- [C6] [CONFIRMED] az elektív ismételt császármetszés mindig felajánlható útként szerepel @L103 `offerability: "offerable",`
- [C7] [CONFIRMED] a `relevant` akkor is igaz, ha a korábbi császármetszések száma nem ismert @L123 `const relevant = priorCs == null || priorCs > 0;`
- [C8] [CONFIRMED] a terv csak akkor rögzíthető lezártként, ha mindhárom mező megvan: a döntés ténye, a megbeszélt lehetőségek és a beteg preferenciája @L129 `documented, canRecord: missing.length === 0, missing,`
