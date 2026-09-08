---
source: core/plan/types.ts
sha256: c886d4c77ceed4229ece5af8b600b757c69bc1dcafaea367e6d9e4d1b6e3df72
lines: 85
profile: code
generator: subagent
raw_tokens_est: 719
verified: 6 confirmed
---

# core/plan/types.ts

## Topics
- L1-85: Vizitrend- és konzílium-típusok: padló-elv, verziózás, feltételek

## Claims

- [C1] [CONFIRMED] az ellenőrzöttség három szintű, az `assumed` kifejezetten nem ellenőrzött adat @L30 `export type Verification = "primary" | "secondary" | "assumed";`
- [C2] [CONFIRMED] a módosító csak hozzáadni tud vizitet: nincs `removes` mező, tehát a jogszabályi alap szerkezetileg padló @L53 `adds: PlannedVisitDef[];`
- [C3] [CONFIRMED] a `when` és a `whenAny` együtt (mind ÉS) ÉS (bármelyik) jelentésű @L48 `whenAny?: Condition[];`
- [C4] [CONFIRMED] a protokoll saját verziót visel, ami a `plan.protocolVersion` mezőbe kerül @L62 `version: string;`
- [C5] [CONFIRMED] a vizitablakok mértékegységét a protokoll `by` mezője jelöli ki @L67 `by: string;`
- [C6] [CONFIRMED] a `ConsultRule.specialty` a `plan.consult.requested` értékkészletének kódja, amit a validátor ellenőriz @L78 `specialty: string;`
