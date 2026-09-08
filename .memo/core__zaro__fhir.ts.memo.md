---
source: core/zaro/fhir.ts
sha256: d8be9cb00db5885d0c795fd8031b6564f19cc36a3cdbfadfcdaf898fbdcb0ba8
lines: 108
profile: code
generator: subagent
raw_tokens_est: 996
verified: 12 confirmed, 1 needs_agent
---

# core/zaro/fhir.ts

## Topics
- L1-35: Az export hitelességi kapuja és a Composition erőforrás típusai
- L36-67: A kimenetbe írt figyelmeztető címkék és a szövegkiemelés
- L68-108: A Composition összeállítása szakaszokból, státusszal és címkékkel

## Claims

- [C1] [CONFIRMED] Hitelesítés nélkül a Composition státusza `preliminary`, és ezen nincs kapcsoló @L9 `*   HITELESÍTÉS NÉLKÜL A STÁTUSZ `preliminary`, ÉS EZEN NINCS KAPCSOLÓ.`  <!-- anchored from @semantic -->
- [C2] [NEEDS_AGENT] A modul nem állítja, hogy a kimenet konformancia-ellenőrzött; ezt a kimenet maga mondja ki @semantic L11-15
- [C3] [CONFIRMED] A státusz kétértékű a típusban @L26 `  status: "preliminary" | "final";`
- [C4] [CONFIRMED] A beteg-hivatkozás opcionális mező, a kutatási változatban nincs @L33 `  subject?: { reference: string };`
- [C5] [CONFIRMED] Az export kétféle példányt ismer: ellátási és kutatási @L37 `  kind?: "care" | "research";`
- [C6] [CONFIRMED] Minden kimenet megkapja a nem konformancia-ellenőrzött címkét @L45 `    code: "not-conformance-validated",`
- [C7] [CONFIRMED] A kutatási példány külön anonimizálási címkét kap @L59 `    code: "de-identified",`
- [C8] [CONFIRMED] Az `esc()` csak az `&`, `<` és `>` jelet cseréli, idézőjelet nem @L65 `  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");`
- [C9] [CONFIRMED] Az alapértelmezett példány az ellátási @L69 `  const kind = opts.kind ?? "care";`
- [C10] [CONFIRMED] Nem hiteles dokumentumnál munkaanyag-címke kerül a metaadatok közé @L71 `  if (d.authenticity.status !== "authentic") tags.push(TAGS.draft);`
- [C11] [CONFIRMED] A kutatási példányból a beteg-azonosító blokkok kimaradnak @L76 `    if (kind === "research" && b.phi) continue;`
- [C12] [CONFIRMED] Az üres blokk is szakaszként kerül be, indoklással — a hiány is szakasz @L80 `    const body = b.state === "filled"`
- [C13] [CONFIRMED] A státusz csak hiteles dokumentumnál `final` @L93 `    status: d.authenticity.status === "authentic" ? "final" : "preliminary",`
- [C14] [CONFIRMED] Beteg-hivatkozás csak ellátási példányba és csak megadott hivatkozás esetén kerül @L104 `  if (kind === "care" && opts.subjectReference) {`
