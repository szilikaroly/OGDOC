---
source: core/store/hozzaferes.ts
sha256: 451d6a53f2886af8a0617ff5569bfb46b631e92890bb41a4af7e03a0bfa689dd
lines: 327
profile: code
generator: subagent
raw_tokens_est: 3483
verified: 17 confirmed, 3 needs_agent
---

# core/store/hozzaferes.ts

## Topics
- L1-53: a jogosultsági réteg vezérelve, a három réteg, a szerepkörök
- L54-151: szerepkör-művelet tábla, auditnapló-olvasók, ellátási kapcsolat, sürgősségi hozzáférés típusa
- L152-203: a sürgősségi bejelentés ellenőrzése, a döntés és a kérés típusa
- L204-327: a `decide` döntéshozó és a felülvizsgálati tartozás számítása

## Claims

- [C1] [NEEDS_AGENT] A réteg vezérelve, hogy a hiányzó jogosultság sehol nem „igen”: ismeretlen cselekvő, szerepkör vagy eset elutasítást jelent @semantic L8-15
- [C2] [NEEDS_AGENT] A jogosultság három rétegből áll: szerepkör (mit), ellátási kapcsolat (kinek az adatán), időablak (meddig) @semantic L17-27
- [C3] [NEEDS_AGENT] A réteg szándékosan nem hitelesít; a „ki vagy te” kérdés a gazdáé, ez csak a már azonosított cselekvőről dönt @semantic L29-34
- [C4] [CONFIRMED] Hat szerepkör létezik, köztük maga a beteg @L52 `| "patient";`
- [C5] [CONFIRMED] A művelettípus az auditnapló-esemény `action` mezőjéből származik, nem külön definíció @L54 `export type Action = AuditEvent["action"];`
- [C6] [CONFIRMED] A szerepkör-művelet megfeleltetés adattábla, nem elágazás, és csak felső korlát @L63 `export const ROLE_ACTIONS: Record<Role, Action[]> = {`
- [C7] [CONFIRMED] Az auditor az eseten egyetlen műveletet sem végezhet a bejelentkezésen kívül @L66 `auditor: ["login"],`
- [C8] [CONFIRMED] Az adatvédelmi tisztviselő törölhet, de olvasni nem jogosult @L67 `dpo: ["delete", "login"],`
- [C9] [CONFIRMED] Az auditnaplót csak az auditor és a dpo olvashatja, a klinikus szándékosan kimarad @L91 `export const AUDIT_READERS: Role[] = ["auditor", "dpo"];`
- [C10] [CONFIRMED] Értelmezhetetlen időbélyegre az ellátási kapcsolat nem él @L121 `if (Number.isNaN(t)) return false;`
- [C11] [CONFIRMED] A `null` lezárású (nyitott) ellátási kapcsolat mindig aktívnak számít @L123 `return r.until === null || Date.parse(r.until) >= t;`
- [C12] [CONFIRMED] A sürgősségi bejelentés három dolgot követel meg: indoklás, megnevezett felülvizsgáló és értelmezhető határidő @L163 `if (!b.reviewDeadline || Number.isNaN(Date.parse(b.reviewDeadline))) {`
- [C13] [CONFIRMED] A jogalapot a döntés hordozza, nem a hívó adja meg @L180 `| { ok: true; basis: string; breakGlass?: BreakGlass }`
- [C14] [CONFIRMED] Az ellátási kapcsolatokat a hívó gazda adja át a kérésben, a réteg csak szűr @L190 `relations: CareRelation[];`
- [C15] [CONFIRMED] Megnevezetlen cselekvőre a döntés azonnal elutasít @L205 `if (!req.actor?.trim()) {`
- [C16] [CONFIRMED] Először a szerepkör szűr: a kért művelethez engedéllyel bíró szerepkörök kigyűjtése előzi meg a kapcsolatvizsgálatot @L218 `const allowed = req.roles.filter((r) => ROLE_ACTIONS[r]?.includes(req.action));`
- [C17] [CONFIRMED] A beteg a saját esetéhez ellátási kapcsolat nélkül fér hozzá, de csak ahhoz @L228 `if (req.ownCaseIds?.includes(req.caseId)) {`
- [C18] [CONFIRMED] A bejelentkezés minden megfelelő szerepkörnek jár, ellátási kapcsolat vizsgálata nélkül @L240 `if (req.action === "login") {`
- [C19] [CONFIRMED] Érvényes sürgősségi hozzáférésnél a döntés visszaadja a bejelentést, és a jogalap szövegébe beírja a felülvizsgálót és a határidőt @L273 `return { ok: true, breakGlass: req.breakGlass,`
- [C20] [CONFIRMED] A felülvizsgálati tartozás az auditnapló `basis` mezőjéből, reguláris kifejezéssel készül, nem külön nyilvántartásból @L317 `const reason = /SÜRGŐSSÉGI HOZZÁFÉRÉS \(([^)]*)\)/.exec(e.basis)?.[1] ?? "";`
