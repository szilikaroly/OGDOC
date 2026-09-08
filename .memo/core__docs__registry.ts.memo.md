---
source: core/docs/registry.ts
sha256: ca2b30a663c409aebcaf8347e9712102570060d602fa4fde2bcc439a4b78f957
lines: 159
profile: code
generator: subagent
raw_tokens_est: 1567
verified: 11 confirmed
---

# core/docs/registry.ts

## Topics
- L1-9: modulcél és importok
- L10-117: DocumentRegistry, build-ellenőrzés, betöltés és lezárhatóság
- L118-159: törlési kapuk és a hozzájárulás-visszavonást túlélő dokumentumok

## Claims

- [C1] [CONFIRMED] a modul három dolgot fed le: betöltés, ellenőrzés, lezárhatóság @L2 `Dokumentum-regiszter: betöltés, ellenőrzés, lezárhatóság.`
- [C2] [CONFIRMED] a konstruktor duplikált dokumentumtípus-azonosítóra dob @L16 `if (this.byId.has(d.id)) throw new Error(`
- [C3] [CONFIRMED] nem létező változóra hivatkozó dokumentum error szintű build-hiba @L40 `if (!reg.get(v)) push("error", d.id,`
- [C4] [CONFIRMED] az EESZT-beküldés nélküli ellátási dokumentum csak warning, nem blokkoló hiba @L51 `"ellátási dokumentum EESZT-beküldés nélkül — ez szándékos-e?");`
- [C5] [CONFIRMED] a nem elsődlegesen ellenőrzött megőrzési idő indoklás (verifiedNote) nélkül error @L54 `if (d.retention && d.retention.verification !== "primary" && !d.retention.verifiedNote) {`
- [C6] [CONFIRMED] a kapcsolódó dokumentum akkor hiányzik, ha nincs a lezártak halmazában @L106 `const missingRelated = (d.expects ?? []).filter((e) => !closed.has(e));`
- [C7] [CONFIRMED] a lezárhatóság kizárólag a kötelező mezők hiányán múlik, a hiányzó kapcsolódó dokumentum nem blokkol @L108 `return { id: d.id, closable: missing.length === 0, missing, gaps, missingRelated };`
- [C8] [CONFIRMED] KAPU: nem `primary` ellenőrzöttség mellett a törlés elutasítva, indoklással @L127 `if (r.verification !== "primary") {`
- [C9] [CONFIRMED] második kapu: függőben lévő betegkérés megállítja a törlést @L139 `if (ctx.patientRequestPending) {`
- [C10] [CONFIRMED] engedélyezéskor csak a megőrzési időtartamot adja vissza, nem konkrét törlési dátumot @L147 `return { ok: true, after: r.period };`
- [C11] [CONFIRMED] a hozzájárulás visszavonását pontosan az ellátási dokumentumok élik túl @L158 `return docs.careRecords();`
