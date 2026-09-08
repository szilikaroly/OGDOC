---
source: core/us/katalogus.ts
sha256: a07307ae5cf63110301480a9ce00a22d7651340b359b6c3b1761cfa8b7632372
lines: 355
profile: code
generator: subagent
raw_tokens_est: 3656
verified: 18 confirmed, 4 needs_agent
---

# core/us/katalogus.ts

## Topics
- L1-91: A katalogizált–telepített–hitelesített szintek, típusok, betöltés, lekérdezők
- L92-118: A lefedettségi mérleg mezői és a külső név-leképezés indoka
- L119-180: A katalógus és a betöltött görbék összevetése, a választás kapujának elve
- L181-293: Egy görbe alkalmazhatóságának négy kapuja és a csoportosított eredmény
- L294-355: A katalógus integritásellenőrzése és emberi olvasatú összefoglaló

## Claims

- [C1] [NEEDS_AGENT] A katalógus egy harmadik, a telepítés és a hitelesítés ELŐTTI szintet ír le: tudjuk, hogy a görbe létezik, de a tábla nincs meg @semantic L4-13
- [C2] [CONFIRMED] A mérési konvenció kétértékű: külső-belső és külső-külső él @L35 `export type Convention = "outerInner" | "outerOuter";`
- [C3] [CONFIRMED] A populáció négyértékű, az iker külön DCDA és MCDA bontásban @L38 `export type ChartPopulation = "singleton" | "twin" | "twinDCDA" | "twinMCDA";`
- [C4] [CONFIRMED] A katalógus betöltése szinkron fájlolvasás, séma-ellenőrzés nélküli típuskényszerítéssel @L77 `  return JSON.parse(readFileSync(path, "utf8")) as ChartCatalogue;`
- [C5] [CONFIRMED] A `chartsFor()` a minősítők nélküli `base` névre szűr @L82 `  return cat.charts.filter((c) => c.base === base);`
- [C6] [CONFIRMED] A `measures()` egyedi mérésneveket ad ábécésorrendben @L87 `  return [...new Set(cat.charts.map((c) => c.base))].sort();`
- [C7] [NEEDS_AGENT] A hitelesített és a percentilist adó görbék száma szándékosan két külön mező, mert a helyi tábla más fajta, nem gyengébb @semantic L101-106
- [C8] [NEEDS_AGENT] A mérés és a regiszterbeli változó közti leképezés kívülről jön, mert az egyeztetés emberi döntés, nem karakterlánc-hasonlóság @semantic L110-118
- [C9] [CONFIRMED] A `coverage()` harmadik paramétere a mérésnév → változó leképezés @L120 `  cat: ChartCatalogue, normograms: Normogram[], parameterOf: Record<string, string>,`
- [C10] [CONFIRMED] Leképezés nélküli méréshez egyetlen betöltött tábla sem társítható @L126 `    const mine = param ? normograms.filter((n) => n.parameter === param) : [];`
- [C11] [CONFIRMED] A hitelesítettséget nevesített predikátum dönti el, nem karakterlánc-hasonlítás — itt állt korábban egy sosem igaz feltétel @L129 `    const verified = mine.filter(hitelesitett);`
- [C12] [CONFIRMED] A `pick()` alapszabálya: ismeretlen jellemzőnél `undetermined` a válasz, nem „megfelel” @L177 `* az adott jellemzőt, a válasz `undetermined` — NEM „megfelel”. Egy ikret egyes`  <!-- anchored from @semantic -->
- [C13] [CONFIRMED] A forráskatalógusban „unused” jelölésű görbe azonnal `mismatch` @L188 `  if (chart.markedUnused) {`
- [C14] [CONFIRMED] Rögzítetlen populáció esetén `undetermined`, a hiány nem jelenti az egyes magzatot @L195 `  if (ctx.population == null) {`
- [C15] [CONFIRMED] Konvenció-érzékeny mérésnél a konvenciót nem jelölő görbe is bizonytalan @L212 `  if (opts.conventionSensitive && !chart.convention) {`
- [C16] [CONFIRMED] Első trimeszteri görbe a 14. héttől `mismatch` @L238 `    if (ctx.ga >= 14) {`
- [C17] [CONFIRMED] A nem csak ott kapu, ahol a görbe maga nemhez kötött @L245 `  if (chart.sex) {`
- [C18] [CONFIRMED] A konvenció-érzékenységet az adat dönti el: egynél több különböző konvenció ugyanarra a mérésre @L268 `    new Set(charts.map((c) => c.convention).filter(Boolean)).size > 1;`
- [C19] [CONFIRMED] Duplikált görbeazonosító hiba @L298 `    if (seen.has(c.id)) {`
- [C20] [CONFIRMED] Hivatkozás nélküli görbe hiba: a tétel enélkül nem beszerezhető @L302 `    if (!c.cite?.trim()) {`
- [C21] [CONFIRMED] Részleges katalógus a lyukak megnevezése nélkül hiba @L314 `  if (cat.coverage === "partial" && !cat.gaps?.length) {`
- [C22] [CONFIRMED] Konvenció-érzékeny mérésnél a jelöletlen görbe csak figyelmeztetés, nem hiba @L327 `    if (kinds.size > 1) {`
- [C23] [NEEDS_AGENT] A `catalogueStamp()` a helyi táblák számát a percentilist adók és a hitelesítettek különbségeként írja ki @semantic L349-354
