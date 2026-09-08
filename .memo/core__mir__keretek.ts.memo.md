---
source: core/mir/keretek.ts
sha256: c66a24bbf77dc8eb0278445f8b6dfb32b078ad5d0f52a7037a303a0109c9dbb0
lines: 389
profile: code
generator: subagent
raw_tokens_est: 3931
verified: 20 confirmed, 1 needs_agent
---

# core/mir/keretek.ts

## Topics
- L1-154: a három keretrendszer egy bizonyítékbázisra képezése, típusok, MEES-naptár
- L155-229: a BELLA tartalmi elemek ötállapotú értékelése és a kategóriánkénti pontszám
- L230-288: bellaSzint — a nem értékelt elem és a kötelező kapu elsőbbsége
- L289-389: validateKeretek keresztellenőrzései és a KeretMerleg

## Claims

- [C1] [NEEDS_AGENT] a réteg mindhárom keretet EGYETLEN bizonyítékbázisra, a dokumentumfára képezi le @semantic L9-13
- [C2] [CONFIRMED] a MEES 2.0 szerinti tanúsítványok 2027-09-25-én vesztik érvényüket, 2026-09-25-től csak MEES 2.1 akkreditált státusz van @L17 ` * tanúsítványok 2027-09-25-én érvényüket vesztik, és 2026-09-25-től már csak`
- [C3] [CONFIRMED] a BELLA standard ellátási formája `null` marad, amíg a hivatalos táblázatból nincs betöltve — tippelni nem szabad @L45 `  ellatas: Ellatas[] | null;`
- [C4] [CONFIRMED] az előjelzési küszöb itt is 90 nap, ugyanaz, mint a licenceknél és a dokumentumfelülvizsgálatnál @L117 `export const ELOJELZES_NAP = 90;`
- [C5] [CONFIRMED] egy mérföldkő akkor vonatkozik ránk, ha az `erinti` mező pontosan `"intezmeny"` @L133 `    const minket = m.erinti === "intezmeny";`
- [C6] [CONFIRMED] a mérföldkő három állapota a határidőig hátralévő napokból dől el: negatív `lejart`, 90 napon belül `kuszobon`, egyébként `tavoli` @L135 `      n < 0 ? "lejart" : n <= ELOJELZES_NAP ? "kuszobon" : "tavoli";`
- [C7] [CONFIRMED] a tartalmi elem értékelése öt értéket vehet fel: két szöveges állapot és a 0/2/4 pont @L170 `export type ElemErtekeles = "nemErtelmezheto" | "nemErtekelt" | 0 | 2 | 4;`
- [C8] [CONFIRMED] a súlyszám a hivatalos kiadványból származik, enélkül a pontozás nem futtatható @L176 `  /** A hivatalos kiadványból; enélkül a pontozás nem futtatható. */`
- [C9] [CONFIRMED] a `nemErtelmezheto` elem a NEVEZŐBŐL is kiesik, a `nemErtekelt` viszont nem @L197 `  const szamit = sajat.filter((e) => e.ertekeles !== "nemErtelmezheto");`
- [C10] [CONFIRMED] az elérhető pontszám elemenként 4 × súlyszám @L199 `  const elerheto = szamit.reduce((n, e) => n + 4 * e.sulyszam, 0);`
- [C11] [CONFIRMED] nulla elérhető pontnál a százalék `null`, nem nulla @L203 `    szazalek: elerheto > 0 ? (elert / elerheto) * 100 : null,`
- [C12] [CONFIRMED] bármely nem értékelt elem esetén a szint `nemMegitelheto`, még a kötelező kapu vizsgálata előtt @L237 `  if (nemErtekelt) {`
- [C13] [CONFIRMED] a kötelező kapu a 4-nél kevesebb pontot kapott kötelező elemeket bukónak veszi, a pontszámtól függetlenül @L249 `    .filter((x) => x.kategoria === "kotelezo" && typeof x.ertekeles === "number" &&`
- [C14] [CONFIRMED] az alapszintű küszöb alatt a szint `nincs`, akkor is, ha a kötelező elemek teljesülnek @L264 `  if (!alapMeg) {`
- [C15] [CONFIRMED] az emelt szint az emelt kategória százalékának a küszöbhöz mérésével dől el @L272 `  const emeltMeg = (emelt.szazalek ?? 0) >= e.emeltSzazalek;`
- [C16] [CONFIRMED] a közölt fekvő/járó/közös darabszámok unióját összeveti a standardlista hosszával @L309 `      const unio = sz.fekvo + sz.jaro - sz.kozos;`
- [C17] [CONFIRMED] a kitöltetlen ellátási formájú standardok darabszáma `warning`-ot vált ki @L320 `      if (nincs) {`
- [C18] [CONFIRMED] ha egyetlen kötelező standard sincs megjelölve, az hiba: a kötelező kapu nem zárna @L329 `    if (!std.some((s) => s.kotelezoStandard)) {`
- [C19] [CONFIRMED] a BELLA keret jelenléte esetén MINDIG kikerül egy figyelmeztetés arról, hogy a tartalmi elemek nincsenek betöltve @L334 `    out.push({ severity: "warning", id: "bella",`
- [C20] [CONFIRMED] a MEES közzététel + érvényességi év levezetett dátumát összeveti a közölt `mees.m5` mérföldkővel @L357 `      if (kozolt && kozolt !== lejar.toISOString().slice(0, 10)) {`
- [C21] [CONFIRMED] a `merleg` a legközelebbi, még jövőbeli, minket érintő MEES-mérföldkövet adja vissza @L387 `    meesKovetkezo: jovo.length ? jovo.sort((a, c) => a.napMulva - c.napMulva)[0] : null,`
