---
source: core/ui/output.ts
sha256: a4fe803a8e4a09501f101656b6c0295ecdc35d60717553efc49c499ee819a884
lines: 135
profile: code
generator: subagent
raw_tokens_est: 1234
verified: 8 confirmed, 1 needs_agent
---

# core/ui/output.ts

## Topics
- L1-66: Betegnek szóló összefoglaló és a klinikusi javaslatok generálása
- L67-135: Javaslatszűrés, rangsorolás, megerősítésre váró beteg-adatok

## Claims

- [C1] [CONFIRMED] A `patientSummary()` csak a `patientText` mezővel bíró, nem alias változókat veszi @L41 `    if (d.aliasOf || !d.patientText) continue;`
- [C2] [CONFIRMED] A nem explicit (alapértelmezésből következő) és a kihagyott mező kimarad a beteg példányából @L44 `    if (!eff.explicit || eff.state === "omitted") continue;`
- [C3] [NEEDS_AGENT] A beteg-sor hangneme négyértékű, a normális leletet is megjeleníti @semantic L20-26
- [C4] [CONFIRMED] Kódra kötött javaslat csak akkor aktív, ha az érték feloldható és pontosan egyezik @L78 `        if (val.state !== "ok" || val.value !== r.code) continue;`
- [C5] [CONFIRMED] Kimaradt mezőből nem következtet javaslatra, kivéve az `always` feltételt @L80 `        if (st === "omitted") continue;          // kimaradtból nem következtetünk`
- [C6] [CONFIRMED] A javaslatok sürgősség szerint rendeződnek, hiányzó sürgősség esetén `routine` az alapértelmezés @L93 `    (rank[a.urgency ?? "routine"] - rank[b.urgency ?? "routine"])`
- [C7] [CONFIRMED] A `needsConfirmation()` csak azokat a változókat adja vissza, ahol van beteg-eredetű, de nincs klinikusi érték @L124 `    if (!fromPatient.length || hasClinician) continue;`
- [C8] [CONFIRMED] A hatásterületet a `DerivationGraph.impactOf()` számolja ki, ez indokolja a sürgősséget @L131 `      wouldAffect: new DerivationGraph(reg).impactOf(d.id),`
- [C9] [CONFIRMED] A megerősítendő tételek a hatásterület mérete szerint csökkenő sorrendben állnak @L134 `  return out.sort((a, b) => b.wouldAffect.length - a.wouldAffect.length);`
