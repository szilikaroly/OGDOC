---
source: core/us/telepites.ts
sha256: d3d1c689d1cf64d5927d2b0f3f3292d0c5bc0e56ddf310ab7db8d93ad85f9267
lines: 176
profile: code
generator: subagent
raw_tokens_est: 1803
verified: 10 confirmed, 2 needs_agent
---

# core/us/telepites.ts

## Topics
- L1-80: A telepítési rangsor négy tényezője, a tétel mezői, hivatkozáskeresés
- L81-176: A pontozás, a rendezés, a javasolt első kör és az összesítő mérleg

## Claims

- [C1] [NEEDS_AGENT] A rangsor négy mérhető tényezőből áll, és mind a rendszer saját adatából jön, nem a katalógusból @semantic L9-23
- [C2] [NEEDS_AGENT] A választási teher tényező nem emeli a rangsort, csak a tétel költségét mondja meg @semantic L17-19
- [C3] [CONFIRMED] Változó nélküli méréshez nem keres hivatkozót @L63 `  if (!variable) return [];`
- [C4] [CONFIRMED] A regiszterbeli feloldás hibáját elnyeli, és hivatkozás nélküliként kezeli @L66 `  try { d = reg.get(reg.resolvePrimary(variable)); } catch { d = undefined; }`
- [C5] [CONFIRMED] Hivatkozónak számít az is, ha egy levezetett mező bemenete a változó @L70 `    if (x.derivation?.inputs?.some((i: { id: string }) => i.id === variable)) {`
- [C6] [CONFIRMED] Hivatkozónak számít az is, ha egy igazított normogram alapgörbéje @L76 `    if (n.parameter === variable && n.adjust?.base) ki.push(`
- [C7] [CONFIRMED] A konvenciófüggőséget egynél több különböző konvenció jelzi a katalógusban @L94 `    const konvenciofuggo = konvenciok.size > 1;`
- [C8] [CONFIRMED] A kereslet 40 pont alapon, hivatkozásonként további 4 ponttal, legfeljebb 5 többletig @L103 `      pont += 40 + Math.min(hiv.length - 1, 5) * 4;`
- [C9] [CONFIRMED] A hiány 25 pontot ad, ha egyetlen betöltött tábla sem ad percentilist @L109 `    if (!mine.some(adPercentilist)) {`
- [C10] [CONFIRMED] A forrásrendszerbeli használat szándékosan kis súly, legfeljebb 8 pont @L122 `      pont += Math.min(hasznaltForrasban, 8);`
- [C11] [CONFIRMED] A rendezés pont szerint csökkenő, holtversenyben a katalogizált görbék száma dönt @L149 `    || b.katalogizalt - a.katalogizalt`
- [C12] [CONFIRMED] Az első kör csak a nálunk hivatkozott méréseket veszi, és alapból tíz tételt ad @L155 `  return sorrend.filter((t) => t.hivatkozik.length > 0).slice(0, n);`
