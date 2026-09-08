---
source: core/screening/types.ts
sha256: 396bcf28524b232159d5a44d10268a4383f313d7522a1adef107cdba98001450
lines: 52
profile: code
generator: subagent
raw_tokens_est: 562
verified: 7 confirmed, 1 needs_agent
---

# core/screening/types.ts

## Topics
- L1-22: modul-indoklás és a szűrési ablak típusa
- L23-52: a ScreeningRule szabálytípus mezői

## Claims

- [C1] [NEEDS_AGENT] A szűrési szabály adat, nem kód: új szűrés felvételéhez nem kell kódot írni @semantic L8-9
- [C2] [CONFIRMED] Az ablakot vagy a gesztációs kor (hét), vagy az életkor (év) szerint mérik @L15 `Mi szerint mérjük az ablakot:`
- [C3] [CONFIRMED] Az ablak mindkét vége beleértendő, a felső határon túl a szűrés elmulasztott @L19 `/** Eddig esedékes, beleértve. Ezen túl elmulasztott. */`
- [C4] [CONFIRMED] A `what` lista mondja meg, mely változók rögzítése számít elvégzésnek @L26 `Mely változók rögzítése számít elvégzésnek.`
- [C5] [CONFIRMED] Az `appliesWhen` feltételei ÉS kapcsolatban állnak, üres lista mindenkire vonatkozik @L29 `Kire vonatkozik. Üres = mindenkire. A feltételek ÉS kapcsolatban állnak.`
- [C6] [CONFIRMED] A rögzített „nem tudom” értelmezése szűrésenként állítható, alapértelmezésben fail-safe `unknown` @L46 `unknownAnswer?: "unknown" | "notApplicable";`
- [C7] [CONFIRMED] Az ismétlési időköz ISO 8601 időtartam-sztring @L49 `repeatEvery?: string | null;`
- [C8] [CONFIRMED] A forrásidézet kötelező mező, a szabvány és a PMID opcionális @L50 `source: { cite: string; standard?: string | null; pmid?: string | null };`
