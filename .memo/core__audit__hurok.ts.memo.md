---
source: core/audit/hurok.ts
sha256: cf02fd8d86ed210167402a9f39ffa3390f567376a18f576de27405b0b2fcbc2b
lines: 399
profile: code
generator: subagent
raw_tokens_est: 4193
verified: 20 confirmed
---

# core/audit/hurok.ts

## Topics
- L1-78: Az audit-hurok indoklása, a Par/Hurok nyilvántartás típusai és betöltése
- L79-198: Az öt egyezés-állapot, besorolás, összevetés és Wilson-intervallum
- L199-291: A közölhetőség kapuja, páronkénti állás, audit-mező típus
- L292-399: Validálás, audit-mezők gyűjtése a felülettérképből, mérleg

## Claims

- [C1] [CONFIRMED] A `Hurok` három küszöbe `number | null`, mert emberi (klinikai/statisztikai) döntésre vár @L65 `minimumEset: number | null;`
- [C2] [CONFIRMED] A `loadHurok` fájlból olvas és a JSON-t ellenőrzés nélkül `Hurok`-ká castolja @L74 `return JSON.parse(readFileSync(path, "utf8")) as Hurok;`
- [C3] [CONFIRMED] A `KODOK` négy szöveges kódot képez le egyezés-állapotra; a `hianyzo`-nak nincs kódja @L91 `export const KODOK: Record<string, Egyezes> = {`
- [C4] [CONFIRMED] A `besorol` a `null`-t, az üreset és az ismeretlen kódot egyaránt `"hianyzo"`-ra képezi @L107 `return KODOK[kod] ?? "hianyzo";`
- [C5] [CONFIRMED] Az `osszevet` nevezője (`ertekelheto`) csak az egyező és eltérő eseteket összegzi @L138 `ertekelheto: egyezik + elter,`
- [C6] [CONFIRMED] A `wilson` alapértelmezett z-értéke 1.96, azaz 95%-os sáv @L156 `export function wilson(k: number, n: number, z = 1.96): Sav | null {`
- [C7] [CONFIRMED] A `wilson` `null`-t ad vissza érvénytelen bemenetre (n≤0, k<0 vagy k>n) @L157 `if (n <= 0 || k < 0 || k > n) return null;`
- [C8] [CONFIRMED] A Wilson-sáv alsó határa 0-ra van vágva, így nem lehet negatív @L161 `const also = Math.max(0, kozep - fel);`
- [C9] [CONFIRMED] Bármelyik küszöb hiánya lezárja a kaput `"kuszobNelkul"` állapottal — a hiányzó döntés nem „igen” @L203 `if (h.minimumEset === null || h.maxBizonytalanSav === null ||`
- [C10] [CONFIRMED] Zárt kapunál az arány `null`, nem 0 @L201 `({ allapot, kozolheto: false, arany: null, sav: null, miert });`
- [C11] [CONFIRMED] Nulla értékelhető eset esetén `"nincsAdat"`, nem nulla találati arány @L211 `if (o.ertekelheto === 0) {`
- [C12] [CONFIRMED] Az eldönthetetlen-arány nevezője az összes eset mínusz a kitöltetlenek, nem az értékelhetők @L226 `const eldonthetetlenArany = eldontheto > 0 ? o.eldonthetetlen / eldontheto : 0;`
- [C13] [CONFIRMED] Túl széles sávnál az arány `null` marad, de a kiszámolt sáv visszakerül a válaszba @L238 `return { allapot: "tulSzelesSav", kozolheto: false, arany: null, sav,`
- [C14] [CONFIRMED] A `parAllas` a párhoz nem talált eset-listát üres tömbként kezeli @L269 `const o = osszevet(esetek[par.id] ?? []);`
- [C15] [CONFIRMED] A `validateHurok` minden változó nélküli audit-mezőre `error` súlyú kifogást ad @L298 `for (const m of mezok.filter((x) => x.variable === null)) {`
- [C16] [CONFIRMED] Ismeretlen változóra hivatkozó pár hibát kap, és kimarad a válaszkészlet-ellenőrzésből @L310 `if (!ismertValtozok.has(p.valtozo)) {`
- [C17] [CONFIRMED] A változó válaszkészletéből hiányzó kódokat a `KODOK` kulcsaihoz méri; hiányzó kódkészlet esetén mind hiányzónak számít @L324 `const hianyzo = kodok ? kell.filter((k) => !kodok.includes(k)) : kell;`
- [C18] [CONFIRMED] A meg nem nevezett küszöb csak `warning`, nem `error` @L349 `severity: "warning"`
- [C19] [CONFIRMED] Az `auditMezok` kizárólag a felülettérkép `outcomeAudit` jelölésű mezőit gyűjti össze @L373 `form.fields.filter((f) => f.outcomeAudit).map((f) => ({`
- [C20] [CONFIRMED] A `merleg` a bekötött mezőket a nem-`null` `variable` alapján számolja @L392 `bekotott: mezok.filter((m) => m.variable !== null).length,`
