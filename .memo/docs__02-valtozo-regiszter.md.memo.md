---
source: docs/02-valtozo-regiszter.md
sha256: d526032dd998508ee5ad4e677c6bfcf166520e985eb23137c07ffefa3c8255e1
lines: 213
profile: prose
generator: subagent
raw_tokens_est: 2385
verified: 12 confirmed, 1 needs_agent
---

# docs/02-valtozo-regiszter.md

## Topics
- L1-7: A dokumentum tárgya: a regiszter és a kölcsönös feltöltés kérése
- L8-99: A `VariableDef` séma mezői, a `consumers` és a `computed` levezetés
- L100-213: `prefill`, `mirror`, precedencia, levezetési gráf, generált dokumentáció, kiindulási állomány

## Claims

- [C1] [NEEDS_AGENT] A fejezet a kérés két eleme köré épül: mezőnkénti dokumentáció és a mezők kölcsönös feltöltése @semantic L3-6
- [C2] [CONFIRMED] A dokumentáció a változó része, nem külön fájl, ezért nem tud elavulni @L10 `Minden változó egyetlen rekord. A dokumentáció nem külön fájlban él, hanem **a változó része** —`
- [C3] [CONFIRMED] A változó azonosítója stabil és soha nincs átnevezve @L15 `  "id": "vitals.bp.systolic",        // stabil, névtérrel, SOHA nem átnevezve`
- [C4] [CONFIRMED] A `consumers` lista generált, nem kézzel írt @L56 `                "score.shockindex", "code.bno.O13"],   // GENERÁLT, nem kézzel írt`
- [C5] [CONFIRMED] A build hibát dob, ha két azonosító ugyanarra a kódra képez le explicit alias-kapcsolat nélkül @L73 `-lista megelőz: a build **hibát dob**, ha két különböző `
- [C6] [CONFIRMED] Három klinikailag élesen különböző levezetési mechanizmus van, és összemosásuk teszi a rendszereket veszélyessé @L78 `Ez a rész a „töltsék fel egymást" kérés lényege. **Három, klinikailag élesen különböző**`
- [C7] [CONFIRMED] `requiresAll` mellett bármely hiányzó bemenet `insufficient` eredményt ad, nem nullát @L98 ` és bármely bemenet hiányzik → az eredmény `
- [C8] [CONFIRMED] A javasolt érték soha nem lépheti át a bizonyosság-határt: önbevallott adat nem tölthet fel mért mezőt a `confidence` romlása nélkül @L125 ` soha nem lépheti át a bizonyosság-határt. Egy önbevallott`
- [C9] [CONFIRMED] Az alias-láncban nem lehet kör és nem lehet két primer — ezt a build ellenőrzi @L140 `láncban nem lehet kör, és nem lehet két primer.**`
- [C10] [CONFIRMED] A precedencia hat szintje közül a hatodik kimondottan nem létezik: klinikai változónak nincs alapértelmezett értéke @L152 `6. default   ← NINCS ilyen. Alapértelmezett érték nem létezik klinikai változóra.`
- [C11] [CONFIRMED] Ütköző értékeknél a rendszer nem választ némán: mindkét értéket mutatja, a döntés a felhasználóé és naplózódik @L155 `Konfliktus esetén (pl. importált Hb 92 g/L vs. most mért 78 g/L) a rendszer **nem választ némán**:`
- [C12] [CONFIRMED] Az ICHOM PCB v5.0 adatszótárból 145 változó importálódott gépi úton @L199 `A regiszter magja már megvan: a mellékelt ICHOM PCB v5.0 adatszótárból **145 változót**`
- [C13] [CONFIRMED] A regiszter becsült végső mérete ~1300–1700 változó @L213 `| **Összesen** | **~1300–1700** |`
