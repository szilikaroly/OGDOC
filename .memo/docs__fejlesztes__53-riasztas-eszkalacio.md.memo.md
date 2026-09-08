---
source: docs/fejlesztes/53-riasztas-eszkalacio.md
sha256: b84320e0f379c053033ab7ad46a7b364228727b636d41d45405bc3244e20338f
lines: 145
profile: prose
generator: subagent
raw_tokens_est: 1354
verified: no claims
---

# docs/fejlesztes/53-riasztas-eszkalacio.md

## Topics
- L1-145: riasztási címzettek, eszkalációs lánc, az öt állapot, a megfordult kapu

## Claims

- [C1] A 9. lépés szepszisküszöb-kapuja addig nem nyílik ki, amíg az eszkalációs rend nincs meg @L9 `A lépéslista kimondja: **a 9. lépés (szepszisküszöbök) kapuja addig nem`
- [C2] Az eredeti `escalation` típus csak címkét, megjegyzést és percszámot tartalmazott, célszintet nem @L32 `escalation: { label: I18n; note?: I18n; acknowledgeWithinMinutes: number };`
- [C3] A riasztási felület összesen 324 pontból áll négy forrásból @L51 `| **Összesen** | **324** |`
- [C4] A címzett nem az egyes pontokhoz, hanem a riasztás típusához tartozik, és ezekből nyolc van @L54 `sem kap, a rendszer néma marad.** A címzett ezért a **típushoz** tartozik —`
- [C5] A láncban pontosan egy szint van utolsónak jelölve, és annak a legmagasabbnak kell lennie @L83 `**3. A lánc véget ér.** Pontosan **egy** szint van utolsónak jelölve, és az a`
- [C6] A nyolc kitöltetlen lánc figyelmeztetés, nem építési hiba, de a kapu közben zárva marad @L123 `A nyolc hiány **figyelmeztetés, nem építési hiba** — megnevezett adósság. De a`
