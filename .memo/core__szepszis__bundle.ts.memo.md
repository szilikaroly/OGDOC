---
source: core/szepszis/bundle.ts
sha256: f9f15bf8561dfb5121379b473b9b1fb96553840bd47c078ed1f3fc5f6d83cdeb
lines: 210
profile: code
generator: subagent
raw_tokens_est: 2085
verified: 14 confirmed, 1 needs_agent
---

# core/szepszis/bundle.ts

## Topics
- L1-72: a sorrendi kapu indoklása, esemény- és állapottípusok, segédfüggvények
- L73-177: a `bundleStatus` csomagértékelő és a sorrendi eltérések feltárása
- L178-210: a riasztás átvételi állapotának meghatározása

## Claims

- [C1] [NEEDS_AGENT] Ez a rendszer első SORRENDI kapuja, és nem hard-stop: a megfordult sorrendet rögzíti és megnevezi az árát, de nem tiltja @semantic L4-13
- [C2] [CONFIRMED] A hiányzó időpont nem jelenti azt, hogy a lépés nem történt meg @L24 `/** Mikor mi történt. A hiányzó időpont NEM azt jelenti, hogy nem történt meg. */`
- [C3] [CONFIRMED] Hat lépésállapot van, köztük az indoklással szándékosan elmaradt @L39 `| "omitted"       // szándékosan elmaradt, indoklással`
- [C4] [CONFIRMED] A csomag csak akkor teljes, ha minden esedékes lépés időben megtörtént @L63 `complete: boolean;`
- [C5] [CONFIRMED] A címkékből kizárólag a magyar változatot használja, nyelvválasztás nincs @L67 `const L = (x: I18n | undefined) => x?.hu ?? "";`
- [C6] [CONFIRMED] Az eltelt időt egész percre kerekítve számolja @L70 `return Math.round((Date.parse(b) - Date.parse(a)) / 60000);`
- [C7] [CONFIRMED] Ha egy lépéshez több esemény érkezik, a legkorábbi számít, mert a csomag a válasz gyorsaságát méri @L80 `if (!prev || Date.parse(e.at) < Date.parse(prev.at)) byStep.set(e.step, e);`
- [C8] [CONFIRMED] A feltételes lépés `notApplicable`, amíg a feltételéül szolgáló lépés nem történt meg @L88 `if (s.conditionalOn && !byStep.get(s.conditionalOn)) {`
- [C9] [CONFIRMED] Az indoklással elmaradt lépés `omitted` állapotot kap, és nem számít teljesítésnek @L95 `if (ev?.omittedBecause) {`
- [C10] [CONFIRMED] Rögzítés nélküli lépés a határidő letelte után `overdue`, előtte `pending` @L106 `id: s.id, label, state: over ? "overdue" : "pending",`
- [C11] [CONFIRMED] Sorrendi eltérés csak akkor keletkezik, ha mindkét érintett lépésnek van időbélyege @L129 `if (!a || !b) continue;`
- [C12] [CONFIRMED] A teljesítés számításából kimarad a nem esedékes és az elmaradt lépés, a többinek mind `onTime`-nak kell lennie @L145 `const complete = due.length > 0 && due.every((s) => s.state === "onTime");`
- [C13] [CONFIRMED] Ha van eszkalációs rend és benne a protokoll riasztástípusa, az átvételi állapotot az eszkalációs modul dönti el @L184 `const tipus = rend?.tipusok.find((t) => t.id === p.escalation.tipus);`
- [C14] [CONFIRMED] Eszkalációs rend nélkül a riasztás az `acknowledgeWithinMinutes` határidő túllépésekor válik át nem vetté @L199 `if (m > p.escalation.acknowledgeWithinMinutes) {`
- [C15] [CONFIRMED] Határidőn belüli, még át nem vett riasztás állapota `issued` @L209 `return { state: "issued", why:`
