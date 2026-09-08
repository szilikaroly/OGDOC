---
source: core/interop/outbox.ts
sha256: f9094cf6f2ed4d8b5780e43b8e98e11b6fdab51f364eeff2e65e8a388c3ce170
lines: 140
profile: code
generator: subagent
raw_tokens_est: 1411
verified: 10 confirmed
---

# core/interop/outbox.ts

## Topics
- L1-54: outbox minta indoklása, OutboxStatus, OutboxEntry, RetryPlan típusok
- L55-114: planRetry — exponenciális várakozás felső korláttal és eszkalációval
- L115-140: outboxHealth — sorállapot, a klinikai üzenet külön kiemelve

## Claims

- [C1] [CONFIRMED] a modul tiszta: nem küld semmit, csak megmondja, mikor és mit kell újrapróbálni @L9 ` * A modul tiszta: nem küld semmit. Azt mondja meg, MIKOR és MIT kell újra`
- [C2] [CONFIRMED] az `OutboxStatus` négyértékű, a feladás (`abandoned`) külön állapot @L13 `export type OutboxStatus = "pending" | "sent" | "failed" | "abandoned";`
- [C3] [CONFIRMED] az `idempotencyKey` kötelező mező, hogy az újraküldés ne hozzon létre két leletet a fogadónál @L22 `  idempotencyKey: string;`
- [C4] [CONFIRMED] az `OutboxEntry.clinical` jelzi a klinikai sürgősséget, és ettől lesz szigorúbb a küszöb @L34 `  clinical: boolean;`
- [C5] [CONFIRMED] a próbálkozási korlát klinikai üzenetnél alapból 5, egyébként 12 @L60 `    ? (opts.clinicalMaxAttempts ?? 5)`
- [C6] [CONFIRMED] az alapvárakozás alapértelmezése 30 másodperc @L62 `  const base = opts.baseSeconds ?? 30;`
- [C7] [CONFIRMED] az `abandoned` állapot mindig `escalate`, `nextAt: null`-lal — magától nem tűnhet el @L69 `    return { action: "escalate", nextAt: null,`
- [C8] [CONFIRMED] a várakozás kettő hatványa szerint nő, de 3600 másodpercnél megáll @L91 `  const waitSec = Math.min(base * 2 ** (e.attempts - 1), 3600);`
- [C9] [CONFIRMED] az `outboxHealth` a `pending` és a `failed` bejegyzést egyaránt függőben lévőnek számolja @L118 `  const pending = entries.filter((e) => e.status === "pending" || e.status === "failed");`
- [C10] [CONFIRMED] a klinikai beragadás küszöbe alapból 30 perc, és a kor a `createdAt`-tól számít @L116 `  entries: OutboxEntry[], now: string, stuckMinutes = 30,`
