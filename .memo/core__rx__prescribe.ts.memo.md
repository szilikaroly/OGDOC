---
source: core/rx/prescribe.ts
sha256: a7257d6475c06283f5cd7a8ee719f68560da3a3e06e678d9289ab379e2621348
lines: 135
profile: code
generator: subagent
raw_tokens_est: 1337
verified: 8 confirmed, 1 needs_agent
---

# core/rx/prescribe.ts

## Topics
- L1-49: Miért a motorban van a kapu, a megkerülés opciói és a GateError
- L50-135: prescribe — a kapuk kikényszerítése, a névsor írása és az override-lista

## Claims

- [C1] [NEEDS_AGENT] a kapu a motorban van, ezért a felület cseréje, az import és a programozott rendelés sem kerüli meg @semantic L8-15
- [C2] [CONFIRMED] a megkerüléshez indoklás kell, enélkül nem lehetséges @L26 `overrideReason?: string;`
- [C3] [CONFIRMED] a `GateError` magával viszi a teljes ellenőrzés eredményét @L33 `readonly check: PrescribeCheck;`
- [C4] [CONFIRMED] eldönthetetlen kontraindikációnál kivételt dob, és megnevezi, mit kell megkérdezni @L56 `if (check.outcome === "ask") {`
- [C5] [CONFIRMED] abszolút kapunál indoklás (és a kapu megnevezése) nélkül a rendelés nem folytatható @L71 `if (!opts.overrideGate || !opts.overrideReason?.trim()) {`
- [C6] [CONFIRMED] az indoklásnak pontosan a zárt kapuhoz kell szólnia, más kapura hivatkozó indoklás hibát ad @L81 `if (!blocked.some((g) => g.gate === opts.overrideGate)) {`
- [C7] [CONFIRMED] a készítmény az `rx.active` névsorba kerül, már meglévő elem esetén nem duplikálódik @L95 `if (!list.includes(drugId)) {`
- [C8] [CONFIRMED] a megkerülés a rendelés példányához kötve (`scope: drugId`) rögzül, nem külön naplóba @L104 `{ scope: drugId, t: opts.t, sourceRef: opts.by ?? null });`
- [C9] [CONFIRMED] az `overrides` csak azt a készítményt sorolja, ahol a kapu és az indoklás is feloldható @L127 `if (g.state !== "ok" || r.state !== "ok") continue;`
