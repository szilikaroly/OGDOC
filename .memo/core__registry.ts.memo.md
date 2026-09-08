---
source: core/registry.ts
sha256: ed13513fad8a261d6736fad34ce0e3505df0e99ab50bdbc580b8d2f079ec5d21
lines: 365
profile: code
generator: subagent
raw_tokens_est: 4266
verified: 15 confirmed
---

# core/registry.ts

## Topics
- L1-11: A validációs jelzés típusa: hiba vagy figyelmeztetés
- L12-171: Registry osztály, alias-feloldás, kalkulátor- és tükör-ellenőrzések
- L172-331: Referenciatartomány-, példányosítás-, egység- és LOINC-ellenőrzések
- L332-365: Címkeütközés-figyelmeztetés a lista- és exportfejlécek miatt

## Claims

- [C1] [CONFIRMED] a regiszter-ellenőrzés két súlyossági szintet ismer: hiba és figyelmeztetés @L7 `severity: "error" | "warning";`
- [C2] [CONFIRMED] duplikált változó-azonosítónál a konstruktor kivételt dob, nem felülír @L18 `if (this.byId.has(d.id)) {`
- [C3] [CONFIRMED] a `resolvePrimary` az aliasOf-láncot végigköveti, és körkörösségnél dob @L34 `if (seen.has(cur)) {`
- [C4] [CONFIRMED] a kódolt vagy háromállású kalkulátor-bemenet csak akkor fogadható el, ha minden kódja szám — különben a bemenet csendben NaN lesz @L86 `if (input.datatype === "coded" || input.datatype === "tristate") {`
- [C5] [CONFIRMED] a `consumers` mező forrásban kitöltve csak figyelmeztetés, mert generált mező @L115 `if (d.consumers && d.consumers.length > 0) {`
- [C6] [CONFIRMED] a mirror (aliasOf) változónak nem lehet saját derivation-je @L112 `if (d.aliasOf && d.derivation) {`
- [C7] [CONFIRMED] ha a tükör mégis felsorolja a kódokat, azoknak pontosan egyezniük kell a primerével @L136 `if (extra.length || lack.length) {`
- [C8] [CONFIRMED] hiba az olyan referenciakontextus, amit a futásidejű feloldó soha nem ad vissza — a sáv néma maradna @L192 `if (!(REFERENCIA_KONTEXTUSOK as readonly string[]).includes(r.context)) {`
- [C9] [CONFIRMED] a referenciatartománynak a rögzíthetőségi tartományon belül kell lennie, különben a normális érték be sem írható @L207 `if (d.domain?.min != null && r.low != null && r.low < d.domain.min) {`
- [C10] [CONFIRMED] a példányosított mező nem lehet computed, mert a kalkulátorok nem ismerik a példányokat @L238 `"példányosított mező nem lehet computed — a kalkulátorok nem ismerik a példányokat");`
- [C11] [CONFIRMED] a kritikus sáv hibás, ha egészében kizárja a saját referenciatartományát — így fogja meg a fordítva bevitt határpárt @L294 `if (kivul(r.low) && kivul(r.high)) {`
- [C12] [CONFIRMED] a feltételezett referenciatartományok forrásonként EGY összevont figyelmeztetést kapnak, nem változónként @L317 `for (const [cite, n] of bySource) {`
- [C13] [CONFIRMED] két primer változó ugyanazon LOINC-kódon hiba: aliasOf kell közéjük @L331 `if (ids.length > 1) {`
- [C14] [CONFIRMED] a címkeütközés-vizsgálat a tükröket kihagyja, mert azok szándékosan egyeznek @L349 `if (d.aliasOf) continue;`
- [C15] [CONFIRMED] a címkeütközés csak figyelmeztetés, és legalább két azonos magyar címkéjű változónál jelződik @L355 `if (ids.length < 2) continue;`
