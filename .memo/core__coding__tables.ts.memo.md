---
source: core/coding/tables.ts
sha256: f5d1ef68488125660457599c3463374d3700f9eb9c0878a689d9791771ecb484
lines: 288
profile: code
generator: subagent
raw_tokens_est: 2845
verified: 17 confirmed, 2 needs_agent
---

# core/coding/tables.ts

## Topics
- L1-19: Miért adat és nem konfiguráció a kódtábla, explicit betöltés elve
- L20-114: A tábla alakja, regisztrálás, kiadásválasztás az ellátás napja szerint
- L115-196: Kulcskeresés, táblafájlok betöltése, emberi olvasatú verziólenyomat
- L197-256: Az elvárt, de kódtáblaként nem létező törzsek nyilvántartása
- L257-288: A táblák és a rájuk épülő levezetések integritás-ellenőrzése

## Claims

- [C1] [NEEDS_AGENT] A táblák nincsenek a kódba égetve: a `registry/kodok/tablak/` könyvtárból, explicit betöltéssel jönnek, és betöltetlen tábla mellett a levezetés nem ad értéket @semantic L9-13
- [C2] [CONFIRMED] A `validUntil` hiánya jelöli a hatályos kiadást @L27 `* Meddig volt érvényes ez a KIADÁS. Hiánya = ez a hatályos kiadás.`
- [C3] [CONFIRMED] A `registerTable` már betöltött azonosítónál kivételt dob @L51 `if (TABLE_BY_ID.has(t.id)) {`
- [C4] [CONFIRMED] A kiadáscsalád a `baseId` és a `baseId@` előtagú azonosítókból áll össze @L80 `const family = allTables().filter((t) => t.id === baseId || t.id.startsWith(baseId + "@"));`
- [C5] [CONFIRMED] A napra illeszkedés mindkét végén zárt intervallum @L84 `const hit = family.find((t) => on >= t.validFrom && (!t.validUntil || on <= t.validUntil));`
- [C6] [CONFIRMED] Ha egyetlen kiadás sem érvényes az adott napra, a válasz `table: null`, nem a legközelebbi kiadás @L100 `A rendszer NEM a legközelebbi kiadással`
- [C7] [CONFIRMED] A táblák modulszintű Map-ben élnek, amit a `clearTables` teljesen kiürít @L105 `export function clearTables(): void { TABLE_BY_ID.clear(); }`
- [C8] [CONFIRMED] A `lookupCode` alapértelmezésben a `label` oszlopot olvassa @L115 `export function lookupCode(tableId: string, key: unknown, column = "label"): LookupResult {`
- [C9] [CONFIRMED] Részhalmaz-táblánál a hiányzó kulcs külön indoklást kap: nem hibás adat @L130 `why: t.coverage === "subset"`
- [C10] [CONFIRMED] A betöltő kihagyja azt a JSON-tartalmat, aminek nincs azonosítója vagy sorai (pl. manifest) @L161 `if (!t?.id || !t?.rows) continue;`
- [C11] [CONFIRMED] Már betöltött azonosító nem regisztrálódik újra, de a visszaadott listába bekerül @L162 `if (!TABLE_BY_ID.has(t.id)) registerTable(t);`
- [C12] [CONFIRMED] A `tableStamp` a részhalmaz-táblákat külön megjelöli @L178 `(t.coverage === "subset" ? ", RÉSZHALMAZ" : "") + ")")`
- [C13] [NEEDS_AGENT] Két elvárt törzs van nyilvántartva: a HBCS besorolási táblázat és a magyar SNOMED-megnevezések @semantic L206-244
- [C14] [CONFIRMED] A HBCS besorolási táblázat megvan, csak nem kódtáblaként — a `providedBy` mutat a helyére @L223 `providedBy: "registry/finanszirozas/hbcs-besorolas.json",`
- [C15] [CONFIRMED] A `missingStems` a `providedBy` jelölésű tételeket nem sorolja hiányzónak @L254 `return EXPECTED_STEMS.filter((s) => !s.providedBy && !TABLE_BY_ID.has(s.id));`
- [C16] [CONFIRMED] A verzió hiánya hiba, nem figyelmeztetés @L260 `if (!t.version) issues.push({ severity: "error", id: t.id, message: "a kódtáblának verziója kell legyen" });`
- [C17] [CONFIRMED] Az indoklás nélküli részhalmaz-tábla csak figyelmeztetés @L263 `if (t.coverage === "subset" && !t.coverageNote) {`
- [C18] [CONFIRMED] `lookup` levezetésnél az ismeretlen kódtábla hiba @L274 `if (!getTable(dv.table)) {`
- [C19] [CONFIRMED] A táblakeresésből származó mező típusa csak `text` lehet @L280 `if (d.datatype !== "text") {`
