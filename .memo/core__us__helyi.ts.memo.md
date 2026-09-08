---
source: core/us/helyi.ts
sha256: b679876ca18d11c539fb12a67d64ed4c402dd9bb20bc1a35b8430e7be881470f
lines: 383
profile: code
generator: subagent
raw_tokens_est: 4011
verified: 24 confirmed, 2 needs_agent
---

# core/us/helyi.ts

## Topics
- L1-68: A helyi görbe kockázata, a sávkapu elcsúszása, sávállapot-típusok
- L69-159: Sáv mögötti esetszám számítása, vékony sávok, eltéréstípusok
- L160-248: Helyi és publikált görbe összevetése szórásegységben
- L249-302: Saját mérésekből tábla generálása
- L303-383: Helyi táblák validálása és összesítő mérleg

## Claims

- [C1] [NEEDS_AGENT] A sávkapu javítása MINDKÉT befogó sávot nézi, mert az érték a két szomszédos sor között interpolálódik @semantic L23-34
- [C2] [CONFIRMED] A `SavAllapot` négy értéke: elég, vékony, számlálás nélkül, tartományon kívül @L41 `export type SavAllapot =`
- [C3] [CONFIRMED] A `SavAllas` mindkét befogó sáv x-ét és elemszámát visszaadja, az elemszám lehet `null` @L55 `  savok: Array<{ x: number; n: number | null }>;`
- [C4] [CONFIRMED] A `savAllas()` a sorokat x szerint rendezve dolgozza fel, nem bízik a tábla sorrendjében @L71 `  const rows = [...(n.rows ?? [])].sort((a, b) => a.x - b.x);`
- [C5] [CONFIRMED] Üres tábla vagy tartományon kívüli x esetén az állapot `tartomanyonKivul` és nem elég @L74 `  if (!rows.length || x < rows[0].x || x > rows[rows.length - 1].x) {`
- [C6] [CONFIRMED] Pontos sávtalálatnál egyetlen befogó sáv van, egyébként kettő @L83 `  const befogok = also.x === felso.x ? [also] : [also, felso];`
- [C7] [CONFIRMED] Hiányzó sávminimum vagy akár egyetlen hiányzó elemszám `szamlalasNelkul` állapotot ad, `eleg: false`-szal @L90 `  if (min === null || savok.some((s) => s.n === null)) {`
- [C8] [CONFIRMED] Már EGY befogó sáv minimum alatti elemszáma is vékonnyá teszi az állást @L98 `  const vekony = savok.filter((s) => (s.n as number) < min);`
- [C9] [CONFIRMED] A `vekonySavok()` üres listát ad, ha nincs sávonkénti számlálás vagy nincs deklarált minimum @L116 `  if (!d?.countByX || !d.minPerBin) return [];`
- [C10] [CONFIRMED] Az `elteres()` alapértelmezett toleranciája 0,25 szórás @L161 `  helyi: Normogram, publikalt: Normogram, tolerancia = 0.25,`
- [C11] [CONFIRMED] Az eltolást a PUBLIKÁLT tábla szórásában méri, és kihagyja a nem pozitív szórású sorokat @L167 `    if (!q || !(q.sd > 0)) continue;`
- [C12] [CONFIRMED] Kettőnél kevesebb közös sávnál `nemOsszevetheto` az eredmény — ez nem „nincs eltérés” @L171 `  if (parok.length < 2) {`
- [C13] [CONFIRMED] Rendszeres eltolás akkor áll fenn, ha a sávok legalább 90%-a egyirányú ÉS az átlagos z meghaladja a toleranciát @L184 `  const rendszeres = egyIranyba >= Math.ceil(parok.length * 0.9) &&`
- [C14] [CONFIRMED] Szórt eltérésnek a tolerancia háromszorosát meghaladó maximum számít @L197 `  if (maxZ > tolerancia * 3) {`
- [C15] [CONFIRMED] A használhatóságához alapértelmezésben legalább 2 elfogadott sáv kell @L251 `  const minSav = o.minSav ?? 2;`
- [C16] [CONFIRMED] A nem véges x vagy érték némán kimarad a sávosításból @L254 `    if (!Number.isFinite(m.x) || !Number.isFinite(m.ertek)) continue;`
- [C17] [CONFIRMED] A minimum alatti és a kételemnél kisebb sáv eldobásra kerül, nem kerül a táblába @L266 `    if (v.length < o.minPerBin || v.length < 2) {`
- [C18] [CONFIRMED] A szórás MINTASZÓRÁS, n−1 nevezővel @L271 `    const sd = Math.sqrt(v.reduce((s, y) => s + (y - mean) ** 2, 0) / (v.length - 1));`
- [C19] [CONFIRMED] A nulla szórású sáv is eldobásra kerül @L272 `    if (!(sd > 0)) { eldobott.push({ x, n: v.length }); continue; }`
- [C20] [CONFIRMED] A tábla akkor használható, ha az összeállt sorok száma eléri a `minSav` küszöböt @L278 `  const hasznalhato = rows.length >= minSav;`
- [C21] [CONFIRMED] A validálás csak a `local` fajtájú táblákat nézi, a `kind` alapértelmezése `published` @L305 `  const helyiek = normograms.filter((n) => (n.kind ?? "published") === "local");`
- [C22] [NEEDS_AGENT] A saját deklarált minimum alatti sávok csak figyelmeztetést adnak @semantic L307-318
- [C23] [CONFIRMED] A sávonkénti elemszám hiánya HIBA, nem figyelmeztetés @L319 `    if (h.derivedFrom && !h.derivedFrom.countByX) {`
- [C24] [CONFIRMED] Ha nincs azonos paraméterű publikált tábla, figyelmeztetés keletkezik és az összevetés kimarad @L334 `    if (!publikalt.length) {`
- [C25] [CONFIRMED] A rendszeres eltolás figyelmeztetésként jelenik meg, a publikált tábla azonosítójával @L347 `      if (e.fajta === "rendszeresEltolas") {`
- [C26] [CONFIRMED] A `merleg()` az összevetettnek azt számolja, ami nem `nemOsszevetheto` @L378 `      if (e.fajta !== "nemOsszevetheto") osszevetve++;`
