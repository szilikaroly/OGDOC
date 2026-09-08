---
source: core/log/types.ts
sha256: 705653512c3ede03b4383b971a6412c72dc3e730be0ab09af9217a7bb73e9bdd
lines: 160
profile: code
generator: subagent
raw_tokens_est: 1582
verified: 11 confirmed
---

# core/log/types.ts

## Topics
- L1-109: a működési és az auditnapló szétválasztása, eseménytípusok, Sink, PHI-minta
- L110-160: auditRedaction szivárgásvizsgálat és checkAudit teljességellenőrzés

## Claims

- [C1] [CONFIRMED] a mag nem naplóz: minden elutasításhoz a `why`-t adja vissza, a kiírásról a gazda dönt @L7 `* ehelyett minden elutasításhoz megírja a MIÉRT-et (`why`, `CaseState.errors`),`  <!-- anchored from @semantic -->
- [C2] [CONFIRMED] a működési esemény kiegészítő adata csak skalár lehet, értékek nem @L43 `  data?: Record<string, string | number | boolean | null>;`
- [C3] [CONFIRMED] az auditesemény hét cselekvéstípust ismer, köztük a `denied`-et @L53 `  action: "read" | "write" | "export" | "print" | "delete" | "login" | "denied";`
- [C4] [CONFIRMED] az auditeseményben a jogalap kötelező, üres string nem elfogadható @L58 `  basis: string;`
- [C5] [CONFIRMED] az `audit` nyelő dobhat, és a hívó nem nyelheti le: a naplózhatatlan olvasás a műveletet buktatja @L75 `  /** Dobhat. A hívó NEM nyelheti le. */`
- [C6] [CONFIRMED] a `PHI_HINT` beégetett, kis-nagybetűre érzéketlen regex tíz magyar kulcsnév-mintára @L91 `const PHI_HINT = /taj|szemely|szig|nev|cim|telefon|email|anyja|szul.*hely|lakcim/i;`
- [C7] [CONFIRMED] az `auditRedaction` a regiszter `phi: true` jelöléséből és a kulcsnév mintájából dolgozik, és nem javít, csak megnevez @L114 `    if (def?.phi) {`
- [C8] [CONFIRMED] a 200 karakternél hosszabb string értéket önmagában szivárgási kockázatnak jelöli @L126 `    if (typeof value === "string" && value.length > 200) {`
- [C9] [CONFIRMED] a `checkAudit` hiányzó cselekvőt kifogásol — „a rendszer" nem cselekvő @L145 `  if (!e.actor?.trim()) {`
- [C10] [CONFIRMED] a `checkAudit` hiányzó jogalapot külön kifogásolja @L150 `  if (!e.basis?.trim()) {`
- [C11] [CONFIRMED] az elutasított hozzáférés indoklás nélkül hibás auditsor @L154 `  if (e.action === "denied" && !e.denyReason?.trim()) {`
- [C12] [CONFIRMED] a `checkAudit` az időbélyeget `Date.parse`-szal ellenőrzi, és hibás értéket kifogásol @L158 `  if (!e.at || Number.isNaN(Date.parse(e.at))) bad.push("hiányzó vagy hibás időbélyeg");`
