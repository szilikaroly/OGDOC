---
source: core/ui/meres.ts
sha256: 2a09ec3d53294a5a59ee7a6120dbe566f6a5bc959d6d3b8c8431605c850d7f1e
lines: 301
profile: code
generator: subagent
raw_tokens_est: 3075
verified: 19 confirmed
---

# core/ui/meres.ts

## Topics
- L1-96: Küszöb és referencia szétválasztása, állapottípusok, kontextuslista
- L97-134: Referenciakontextus meghatározása, tartomány-kívüliség segédfüggvény
- L135-285: Egy mérés megítélése és a küszöbátlépésből fakadó teendők
- L286-301: Az eset mért változóinak listázása rangsorolva

## Claims

- [C1] [CONFIRMED] A `MeresAllapot` négy állapotot enged: kritikus, referencián kívül, sávban, nem értékelhető @L32 `export type MeresAllapot =`
- [C2] [CONFIRMED] Az `L()` segéd a kért nyelv után `hu`-ra, majd `en`-re esik vissza, végül `null`-t ad @L61 `  x?.[lang] ?? x?.hu ?? x?.en ?? null;`
- [C3] [CONFIRMED] A referenciakontextusok zárt listája öt elem, köztük a gyermekágy @L73 `  "nonpregnant", "pregnancy.t1", "pregnancy.t2", "pregnancy.t3", "postpartum",`
- [C4] [CONFIRMED] A gyermekágy határa beégetett 42 nap @L79 `export const POSTPARTUM_NAP = 42;`
- [C5] [CONFIRMED] A `referenciaKontextus()` a gyermekágyat a terhességi állapot ELŐTT vizsgálja, mert szülés után a terhességjelző már negatív @L107 `      if (nap >= 0 && nap <= POSTPARTUM_NAP) return "postpartum";`
- [C6] [CONFIRMED] Nem pozitív, de nem is negatív terhességi állapotnál `null` a válasz, nem a nem terhes sáv @L114 `  if (preg.value !== "pos") return null;`
- [C7] [CONFIRMED] A trimeszterhatár 14. és 28. hét gesztációs koron @L118 `  if (ga.value < 14) return "pregnancy.t1";`
- [C8] [CONFIRMED] Hiányzó vagy nem szám gesztációs kor esetén nincs kontextus @L117 `  if (ga.state !== "ok" || typeof ga.value !== "number") return null;`
- [C9] [CONFIRMED] A `kivul()` a `null` határt nyitottnak veszi, azon az oldalon sosem jelez @L125 `  return (low != null && v < low) || (high != null && v > high);`
- [C10] [CONFIRMED] Lejárt (`stale`) érték nem értékelhető, nem épül rá megítélés @L153 `      miert: r.state === "stale"`
- [C11] [CONFIRMED] A definíciós küszöb erősebb a referenciánál: előbb fut le és azonnal visszatér @L163 `  if (crit && kivul(v, crit[0], crit[1])) {`
- [C12] [CONFIRMED] Referenciatábla nélkül, de kritikus sávval az állapot `savban`, az indoklás kimondja hogy ez beavatkozási küszöb @L185 `        ...be, allapot: "savban", hatar: sav,`
- [C13] [CONFIRMED] Eldönthetetlen kontextusnál nem értékelhető a lelet, a nem terhes sávra visszaesés tiltott @L202 `  if (!kontextus) {`
- [C14] [CONFIRMED] A `meresTeendok()` kizárólag kritikus állapotból generál teendőt @L267 `    if (e.allapot !== "kritikus") continue;`
- [C15] [CONFIRMED] Minden mérésből származó teendő sürgőssége `urgent` @L269 `      id: e.id, label: e.label, urgency: "urgent",`
- [C16] [CONFIRMED] A `meresek()` csak a `quantity` típusú, nem alias változókat nézi @L291 `    if (d.aliasOf || d.datatype !== "quantity") continue;`
- [C17] [CONFIRMED] Küszöb és referencia nélküli változó kimarad a listából @L292 `    if (!d.domain?.critical && !d.reference) continue;`
- [C18] [CONFIRMED] A rögzítés nélküli változó kimarad, a nem értékelhetők viszont bennmaradnak @L294 `    if (r.state === "missing") continue;`
- [C19] [CONFIRMED] A rangsor kritikus, referencián kívül, nem értékelhető, sávban sorrendű @L298 `    kritikus: 0, referencianKivul: 1, nemErtekelheto: 2, savban: 3,`
