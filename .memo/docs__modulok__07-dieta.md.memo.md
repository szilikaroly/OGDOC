---
source: docs/modulok/07-dieta.md
sha256: d655d301fe58e1e163db927b44abda18202cafb11acdd0f1831fd80fec6a9128
lines: 96
profile: prose
generator: subagent
raw_tokens_est: 1258
verified: 3 confirmed
---

# docs/modulok/07-dieta.md

## Topics
- L1-96: Diétamodul: számított célértékek, állapotspecifikus protokollok, betegtájékoztató, hatókör-döntés

## Claims

- [C1] [CONFIRMED] A bemenetek nagy része máshonnan jön, a modul dolga a javaslat összeállítása és a betegtájékoztató generálása @L18 `(BMI, GA, GDM-státusz, anaemia, bariátriai előzmény), a modul feladata a **javaslat`
- [C2] [PENDING] Bariátriai műtét után célzott vas/B12/folsav/D/kalcium-pótlás, módosított GDM-szűrés és 12–18 hónap várakozás @L57 `| **Bariátriai műtét után** | `hx.endo.bar` | **vas, B12, folsav, D-vitamin, kalcium célzott pótlása és követése**; dömping miatt módosított GDM-szűrés; a műtét után legalább 12–18 hónap várakozás |`
- [C3] [PENDING] Hypertonia/preeclampsia esetén sószegény étrend, de terhességben nem restriktív @L62 `| **Hypertonia / preeclampsia** | `hx.sys.htn` | sószegény — **de terhességben nem restriktív**, ez fontos különbség |`
- [C4] [PENDING] Az elfogadási kritériumot a `test/dieta.test.ts` teszt kényszeríti ki @L84 `> **Ez teszt, nem ígéret:** [`test/dieta.test.ts`](../../test/dieta.test.ts).`
- [C5] [CONFIRMED] Eldőlt hatókör: a modul nem ad konkrét étrendet, csak célértéket, tiltásokat és konzíliumi javallatot @L89 `**Eldőlt: a modul NEM ad konkrét étrendet.** Célértéket (tartományként), indokolt`
- [C6] [CONFIRMED] Ha egy szám nem születik meg, a tájékoztatóban a dietetikai konzílium javallata és a hiány oka áll, nem üres hely @L95 `> hanem a **dietetikai konzílium javallata és a hiány oka**. A modul így akkor is`
