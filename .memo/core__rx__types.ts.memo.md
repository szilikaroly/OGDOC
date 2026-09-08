---
source: core/rx/types.ts
sha256: f162b1ade36900f8b4e427f7ffc1b706af36aae48d2684ed67ddbe9e289cedab
lines: 83
profile: code
generator: subagent
raw_tokens_est: 761
verified: 7 confirmed
---

# core/rx/types.ts

## Topics
- L1-48: A gyógyszertörzs mint fogalom, a kapu és a terhességi csere típusai
- L49-83: A Drug interfész mezői: kódok, kapuk, szoptatás, diétás kapcsolat

## Claims

- [C1] [CONFIRMED] a készítmény nem `VariableDef`, hanem fogalom, amihez következményként kapuk tartoznak @L4 `* Nem `VariableDef`: a készítmény nem adat, hanem FOGALOM, amiről tudni kell`  <!-- anchored from @semantic -->
- [C2] [CONFIRMED] a Hale-kategória ötfokú, L1 a legbiztonságosabb, L5 az ellenjavallt @L20 `export type HaleLRC = "L1" | "L2" | "L3" | "L4" | "L5";`
- [C3] [CONFIRMED] a kapu stabil azonosítót visel, mert az indoklás ehhez a szabályhoz kötve rögzül @L24 `id: string;`
- [C4] [CONFIRMED] a kapu kétféle: az `absolute` megállítja a folyamatot, a `relative` csak figyelmeztet @L29 `severity: "absolute" | "relative";`
- [C5] [CONFIRMED] a kaput a feltételek EGYÜTTES teljesülése zárja @L31 `when: Condition[];`
- [C6] [CONFIRMED] a terhességi átalakítás több lehetséges célszert is felkínálhat @L63 `transformInPregnancy?: Transform | null;`
- [C7] [CONFIRMED] a szoptatási megítélés a Hale-kategória mellett relatív csecsemődózist is tarthat @L65 `hale: HaleLRC;`
- [C8] [CONFIRMED] a `dietSupplement` köti a készítményt a diétás pótláshoz, így a kétszeres pótlás gépileg ellenőrizhető @L81 `dietSupplement?: string | null;`
