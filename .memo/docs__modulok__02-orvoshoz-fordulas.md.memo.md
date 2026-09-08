---
source: docs/modulok/02-orvoshoz-fordulas.md
sha256: 9a3bec7a09df7c2978cde3de3a87910581d4da201747d56352a32dc789eeae34
lines: 99
profile: prose
generator: subagent
raw_tokens_est: 1369
verified: 3 confirmed
---

# docs/modulok/02-orvoshoz-fordulas.md

## Topics
- L1-99: Az ellátási kontextus (`ctx`) modulja: változók, gesztációs kor számítása, keresztfeltöltés

## Claims

- [C1] [PENDING] A `ctx` objektum meglévő IntuiCare-táblákból (`clinical_encounters`, `patient_encounters`) épül, nem újakból @L13 `A `ctx` objektum tehát meglévő táblákból épül, nem újakból.`
- [C2] [CONFIRMED] A 02. modul a 03–18. modul előfeltétele, mert a `requiredWhen` és `validity` kifejezések a `ctx`-re hivatkoznak @L18 `kifejezése hivatkozik. **A 02. modul a 03–18. modul előfeltétele.** A v16-ban ez az információ`
- [C3] [CONFIRMED] Ugyanannak a változónak a kontextus szabja meg az érvényességi ablakát: vérnyomás ambulánsan 7 nap, vajúdás alatt 4 óra @L22 `Egy példa, amiért ez számít: a vérnyomás érvényességi ablaka ambuláns kontextusban 7 nap,`
- [C4] [PENDING] A `ctx.ga` számított érték, az `lmp`-ből vagy a korai UH CRL-jéből @L38 `| `ctx.ga` | quantity (computed) | gesztációs kor — `computed` az `lmp`-ből vagy a korai UH CRL-jéből |`
- [C5] [CONFIRMED] A GA-forrás precedenciájában az IVF/FET transzferdátum és embriókor az első, a legpontosabb @L65 `1. IVF/FET esetén a transzfer dátuma és az embriókor (a legpontosabb)`
- [C6] [PENDING] A `ctx.role` az artifact-változatban nem biztonsági határ, a felhasználó átállíthatja — csak felületszűrés @L97 `A `ctx.role` az artifact-változatban **nem biztonsági határ** — a felhasználó átállíthatja.`
