---
source: core/import/proposals.ts
sha256: fd9a6a20fb59ec56ef3370974dc5dbdcedaf7ad9697e98b55617bca9deecc32a
lines: 211
profile: code
generator: subagent
raw_tokens_est: 2054
verified: 8 confirmed
---

# core/import/proposals.ts

## Topics
- L1-40: a javaslattár négy szerkezeti szabálya, ConflictInfo és ConfirmResult
- L41-200: ProposalStore — felvétel, sor, ütközés, megerősítés, elutasítás, beírás
- L201-211: állapotonkénti darabszám-összegzés

## Claims

- [C1] [CONFIRMED] a `ConflictInfo` az ütközést a már rögzített és a javasolt érték párjaként írja le, indoklással @L31 `  existing: unknown;`
- [C2] [CONFIRMED] az `add` hibát dob, ha a `span` hiányzik, üres szövegű, vagy a `to` nem nagyobb a `from`-nál @L64 `    if (!p.span || !p.span.text?.trim() || p.span.to <= p.span.from) {`
- [C3] [CONFIRMED] ugyanarra a változó+t+scope hármasra érkező új javaslat a korábbi `pending`-et `superseded`-re állítja, nem törli @L76 `        q.status = "superseded";`
- [C4] [CONFIRMED] a `queue` a `pending` javaslatokat gépi magabiztosság szerint csökkenően rendezi, hiányzó érték helyén 0-val @L97 `      .sort((a, b) => (b.machineConfidence ?? 0) - (a.machineConfidence ?? 0));`
- [C5] [CONFIRMED] a `conflicts` az összehasonlítást `JSON.stringify`-jal végzi, és a megegyező értékű javaslatot kihagyja @L111 `      if (JSON.stringify(r.value) === JSON.stringify(p.value)) continue;`
- [C6] [CONFIRMED] a `confirm` üres megerősítő-név esetén `ok: false`-szal tér vissza, nem dob kivételt @L140 `    if (!by.trim()) {`
- [C7] [CONFIRMED] a `toValues` csak a `confirmed` javaslatokat írja be, `clinician` eredettel, és a `correctedValue`-t részesíti előnyben @L185 `toValues(reg: Registry, state: CaseState): CaseState {`
- [C8] [CONFIRMED] a `summary` mind a négy állapot darabszámát visszaadja, ideértve a `superseded`-et is @L208 `      superseded: this.byStatus("superseded").length,`
