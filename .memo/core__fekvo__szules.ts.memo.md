---
source: core/fekvo/szules.ts
sha256: 2f2f7d5c5616ed9a457674120b089dde0bddda74c78dffa19ab9ef1752c14f70
lines: 152
profile: code
generator: subagent
raw_tokens_est: 1888
verified: 10 confirmed
---

# core/fekvo/szules.ts

## Topics
- L1-51: a szüléskódolás jogszabályi követelményei, szabálytípus és eredménytípus
- L52-152: checkDelivery — mód, eredmény, beavatkozás, ellentmondás, patológiás terhesség

## Claims

- [C1] [CONFIRMED] a szülés módját „3” típusjellel, O8000-O8492 tartományú kóddal kell megadni @L8 `„3” típusjel   a szülés módja, O8000-O8492 kóddal      (I. 1.2.)`
- [C2] [CONFIRMED] a szülés eredményét „V” típusjellel, Z370-Z379 kóddal kell megadni @L9 `„V” típusjel   a szülés eredménye, Z370-Z379 kóddal    (I. 1.4.)`
- [C3] [CONFIRMED] a rendszer nem vezeti le a szülés módját a beavatkozáskódból, mert épp az eltérésük a lelet @L14 `is vezeti le a beavatkozáskódból: a kettőnek EGYEZNIE kell, és épp az`
- [C4] [CONFIRMED] a `classifiers` az öt minősítő tényezőt felsorolja, de nem értékeli ki @L46 `A besorolás öt fő minősítő tényezője — FELSOROLVA, nem kiértékelve.`
- [C5] [CONFIRMED] a kódtartományon kívül eső „3” típusjelű fődiagnózis blokkoló lelet @L71 `} else if (mode.code < r.szulesModKod.tol || mode.code > r.szulesModKod.ig) {`
- [C6] [CONFIRMED] az egynél több szülés-eredmény kód csak warning, míg a hiánya blokkoló @L86 `} else if (outcome.length > 1) {`
- [C7] [CONFIRMED] blokkoló, ha sem császármetszéses, sem hüvelyi szülésvezetési beavatkozáskód nincs @L93 `if (!cs.length && !vag.length) {`
- [C8] [CONFIRMED] a diagnózis-beavatkozás ellentmondást a rendszer nem javítja ki, maga az ellentmondás a lelet @L108 `A rendszer NEM javítja ki egyiket sem: az ellentmondás maga a lelet — `
- [C9] [CONFIRMED] ha a szülés előtti bennfekvés napszáma nincs rögzítve, a patológiás terhesség undetermined, nem tagadás @L126 `if (d == null) {`
- [C10] [CONFIRMED] a szülés jelentése csak blocking szintű lelet nélkül számít kitölthetőnek @L143 `complete: !f.some((x) => x.level === "blocking"),`
