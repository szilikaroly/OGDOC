---
source: core/store/torles.ts
sha256: c6c5493c064cae26de38bd2710760a216efd60b6e46050e3d7366954715f6422
lines: 395
profile: code
generator: subagent
raw_tokens_est: 4291
verified: 22 confirmed, 2 needs_agent
---

# core/store/torles.ts

## Topics
- L1-101: a kétágú válasz indoklása, törlésfajták, rendelkezés-, akadály- és értékeléstípusok
- L102-158: a rendelkezés önellenőrzése és a törlési kontextus típusa
- L159-318: az akadálylista előállítása, a megmaradó tételek és az összegző értékelés
- L319-337: a kutatási hozzájárulás visszavonásának eredménytípusa
- L338-395: a visszavonás hatása és a törlési tanúsítvány előállítása

## Claims

- [C1] [NEEDS_AGENT] A rendszer válasza kétágú: a kutatási felhasználás azonnal visszavonható, az ellátási dokumentáció a megőrzési idő végéig marad @semantic L16-19
- [C2] [CONFIRMED] Kétféle törlés van, a kriptográfiai az alapértelmezés, a fizikai megtöri a hasítóláncot @L41 `export type TorlesFajta = "kriptografiai" | "fizikai";`
- [C3] [CONFIRMED] A rendelkezésnek megnevezett jogalapja van; a „beteg kérte” kiváltó ok, nem jogalap @L60 `jogalap: string;`
- [C4] [CONFIRMED] A második aláíró a típusban opcionális mező, a kötelezővé tételét a szabályréteg végzi @L72 `masodikAlairo?: Alairo;`
- [C5] [CONFIRMED] Minden akadályhoz kötelezően tartozik, mi hárítaná el — enélkül az akadály zsákutca @L87 `mihezKotott: string;`
- [C6] [CONFIRMED] Az értékelés csak akkor mondja végrehajthatónak a törlést, ha egyetlen blokkoló akadály sincs @L95 `vegrehajthato: boolean;`
- [C7] [CONFIRMED] A `validateRendelkezes` a hibák szöveges listáját adja vissza, üres lista jelenti a rendben állapotot @L102 `export function validateRendelkezes(r: TorlesiRendelkezes): string[] {`
- [C8] [CONFIRMED] A törlést csak `dpo` szerepű aláíró rendelheti el @L116 `if (r.rendelte && r.rendelte.szerep !== "dpo") {`
- [C9] [CONFIRMED] Az aláírók időbélyegét ISO dátumkezdetre illesztett reguláris kifejezés ellenőrzi @L122 `if (a && !/^\d{4}-\d{2}-\d{2}T/.test(a.at ?? "")) {`
- [C10] [CONFIRMED] A második aláíró nem lehet a rendelkezővel azonos nevű személy — a négy szem elve @L126 `if (r.masodikAlairo && r.masodikAlairo.nev === r.rendelte?.nev) {`
- [C11] [CONFIRMED] A kontextusban az eset dátumhorgonyai opcionálisak, de a hiányuk maga is akadállyá válik @L149 `horgonyok?: Horgonyok;`
- [C12] [CONFIRMED] A rendelkezés minden egyes hiánya külön blokkoló akadállyá alakul @L167 `for (const b of validateRendelkezes(r)) {`
- [C13] [CONFIRMED] A hiányzó második aláíró blokkoló akadály, mert a törlés visszafordíthatatlan @L173 `if (!r.masodikAlairo) {`
- [C14] [CONFIRMED] Ha a megőrzési idő letelte nincs igazolva, a törlés blokkolva van a GDPR 17. cikk (3) bekezdésére hivatkozva @L218 `if (r.megorzesLejart === undefined || r.megorzesLejart === null) {`
- [C15] [CONFIRMED] Múltbeli lejárat esetén a begépelt dátumot a dokumentumok saját megőrzési idejéből is visszaellenőrzi @L241 `.map((d) => ({ d, e: igazolasEllenorzes(d, r.megorzesLejart!, horgonyok) }))`
- [C16] [CONFIRMED] Kriptográfiai törlés blokkolt, ha a kulcstár nem tudja megsemmisíteni a kulcsot @L258 `if (r.fajta === "kriptografiai" && !ctx.kulcsMegsemmisitheto) {`
- [C17] [CONFIRMED] A fizikai törlés láncmegtörése csak figyelmeztetés, nem blokkoló akadály @L267 `push("lanctores", "figyelmeztetes",`
- [C18] [CONFIRMED] A visszavonás eredménye a megmaradó tételeket indoklással együtt sorolja fel @L324 `marad: Array<{ mi: string; miert: string }>;`
- [C19] [NEEDS_AGENT] A kétágú visszavonás az, amit a törlési rendelkezés helyett fel kell ajánlani, és amit a beteg előre lát @semantic L328-336
- [C20] [CONFIRMED] A visszavonás megmaradó tételei a dokumentumregiszter ellátási dokumentumaiból származnak @L341 `const marado = docs.careRecords();`
- [C21] [CONFIRMED] Három dolog szűnik meg azonnali hatállyal, elsőként a minta és az adat kutatási felhasználása @L345 `"A minta és az adat KUTATÁSI felhasználása — azonnali hatállyal.",`
- [C22] [CONFIRMED] A tanúsítvány kötelezően megmondja, hogyan ellenőrizhető a törlés megtörténte @L375 `hogyanEllenorizheto: string;`
- [C23] [CONFIRMED] A tanúsítvány aláírólistája a rendelkezőből és — ha van — a második aláíróból áll @L385 `alairok: [r.rendelte, ...(r.masodikAlairo ? [r.masodikAlairo] : [])],`
- [C24] [CONFIRMED] Kriptográfiai törlés után a visszafejtés „olvashatatlan”, nem „sérült” hibával bukik el, mert az adat szándékosan zárt @L389 `hibával bukik el — nem`
