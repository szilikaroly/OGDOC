---
source: core/followup/points.ts
sha256: 9ab8dec18c174f5003812b36e5643636da9ea36c143398a33f6b70e932f7e97c
lines: 169
profile: code
generator: subagent
raw_tokens_est: 1465
verified: 10 confirmed
---

# core/followup/points.ts

## Topics
- L1-52: az elmulasztott mérési pont szabálya, MeasurementPoint és státusz típusok
- L53-169: FollowUpPoints — állapotszámítás, validálás, betöltés

## Claims

- [C1] [CONFIRMED] KAPU: az elmulasztott mérési pont nem tűnik el, overdue marad @L9 `AZ ELMULASZTOTT MÉRÉSI PONT NEM TŰNIK EL.`
- [C2] [CONFIRMED] ennek oka, hogy a kimeneteli mutatók nevezője a mérési pontokból áll össze @L13 `kozmetikai kérdés, mert a kimeneteli mutatók NEVEZŐJE ebből áll össze: ha`
- [C3] [CONFIRMED] a horgony kétféle lehet: gesztációs hét vagy egy időpont óta eltelt napok @L29 `anchor: { kind: "gaWeeks" | "daysSince"; var: string };`
- [C4] [CONFIRMED] az `unknown` státusz nem azonos a „nem esedékes”-sel @L37 `A horgony hiányzik — nem tudjuk, esedékes-e. NEM azonos a „nem esedékes"-sel.`
- [C5] [CONFIRMED] a konstruktor duplikált mérési pont azonosítóra dob @L60 `if (seen.has(p.id)) throw new Error(`
- [C6] [CONFIRMED] daysSince horgonynál az eltelt időt a kontextus „most”-jából számolja egész napokra @L96 `at = Math.floor((now - t) / 86_400_000);`
- [C7] [CONFIRMED] feloldhatatlan horgonynál a státusz unknown, és maga a horgonyváltozó kerül a hiányzók közé @L107 `missing: [p.anchor.var],`
- [C8] [CONFIRMED] a `done` állapot az adattól függ, nem az időtől: a lezárult ablak önmagában nem teszi késszé a pontot @L113 `if (doneWhen?.complete) {`
- [C9] [CONFIRMED] a fordított (from > to) időablak error szintű validációs hiba @L143 `if (p.from > p.to) {`
- [C10] [CONFIRMED] `loadPoints` a nem tömböt tartalmazó mérésipont-fájlra dob @L164 `if (!Array.isArray(parsed)) throw new Error(`
