---
source: core/riasztas/leltar.ts
sha256: 7ceca20113a0c1039b012449cd87d8dca746f73fc77eec3f0fdb09ed2e99e70c
lines: 59
profile: code
generator: subagent
raw_tokens_est: 597
verified: 5 confirmed, 1 needs_agent
---

# core/riasztas/leltar.ts

## Topics
- L1-59: A riasztási felület megszámolása négy forrásból, címzett-rendelés nélkül

## Claims

- [C1] [NEEDS_AGENT] a leltár nem rendel címzettet a zászlókhoz, csak a felület méretét méri — a címzett a riasztástípushoz tartozik @semantic L10-13
- [C2] [CONFIRMED] a változóregiszterből a `redflag` jelölésű kódolt válaszokat számolja össze @L42 `return n + opts.filter((o) => (o.flags ?? []).includes("redflag")).length;`
- [C3] [CONFIRMED] a kalkulátorokból a `redflag` súlyosságú eredménysávokat számolja @L45 `(n, c) => n + (c.output.bands ?? []).filter((b) => b.severity === "redflag").length, 0);`
- [C4] [CONFIRMED] a kérdőívekből a kritikus tétellel rendelkező eszközök számítanak @L46 `const kritikus = instruments.filter((i) => i.criticalItem).length;`
- [C5] [CONFIRMED] a panaszszótári vörös zászlók számát a hívó adja meg paraméterként, nem itt számolódik @L38 `panaszRedflag: number,`
- [C6] [CONFIRMED] az összes a négy tétel darabszámának összege @L58 `return { tetelek, osszes: tetelek.reduce((n, t) => n + t.darab, 0) };`
