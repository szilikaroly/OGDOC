---
source: core/ui/dontes.ts
sha256: c8ea3052a4320664050c90a5fdd84eb675a738eb5d59e4f0b1bcbda6c30257ea
lines: 331
profile: code
generator: subagent
raw_tokens_est: 3073
verified: 16 confirmed, 1 needs_agent
---

# core/ui/dontes.ts

## Topics
- L1-140: a réteg három állítása, szabály-, aláírás- és döntéstípusok, lenyomat, betöltés
- L141-217: az audit összevetése az aláírt döntésekkel
- L218-331: a katalógus és a döntések önellenőrzése, a mérleg és az állapotmondat

## Claims

- [C1] [NEEDS_AGENT] A hiányzó döntés sehol nem „átvesszük”: eldöntetlenül a mező nem kerül át, és ez alapállapot, nem figyelmeztetés @semantic L14-16
- [C2] [CONFIRMED] Három döntésfajta van; a „még nem tudjuk” nem szerepel köztük @L34 `export type DontesFajta = "atvesszuk" | "atalakitva" | "nem";`
- [C3] [CONFIRMED] A szabály normatív magja az az egy mondat, amit aláírnak, és amit a lenyomat fed @L42 `lenyeg: string;`
- [C4] [CONFIRMED] A katalógus gépi javaslatot ad, ami kifejezetten nem döntés @L44 `javaslat: DontesFajta;`
- [C5] [CONFIRMED] A lenyomat a normatív mag SHA-256 hasításának első 16 hexjegye @L88 `return createHash("sha256").update(lenyeg, "utf8").digest("hex").slice(0, 16);`
- [C6] [CONFIRMED] Döntést csak a `refused` és a `gate` státuszú mező kíván @L128 `return a.status === "refused" || a.status === "gate";`
- [C7] [CONFIRMED] Katalógusban nem szereplő szabálynál a mező eldöntetlen marad, és nem kerül át @L160 `if (!s) {`
- [C8] [CONFIRMED] A mezőszintű döntés elsőbbséget élvez a szabályszintűvel szemben @L169 `const d = mezoDontes.get(kulcs(a.form, a.field)) ?? ruleDontes.get(a.rule);`
- [C9] [CONFIRMED] Ha a szabály magjának mostani lenyomata eltér az aláírtól, a döntés elavult lesz @L178 `if (d.lenyomat !== lenyomat(s.lenyeg)) {`
- [C10] [CONFIRMED] A megkövetelt szerepek bármelyikének hiányzó aláírása hiányos állapotot ad @L188 `const hiany = s.kell.filter((r) => !d.alairok.some((x) => x.szerep === r));`
- [C11] [CONFIRMED] A mező csak akkor kerül át, ha az eldöntött fajta nem az elutasítás @L199 `atkerul: d.fajta !== "nem", miert: "",`
- [C12] [CONFIRMED] Döntést kívánó, de a katalógusban nem szereplő szabály hiba @L236 `if (!szabaly.has(r)) {`
- [C13] [CONFIRMED] Katalógusban lévő, de egyetlen mezőnél sem használt szabály csak figyelmeztetés @L241 `if (!hasznalt.has(s.rule)) {`
- [C14] [CONFIRMED] A felelősnek a szabály aláírói között kell lennie, különben hiba @L252 `} else if (!s.kell.includes(s.felelos)) {`
- [C15] [CONFIRMED] Az „átalakítva” döntés az átalakítás megnevezése nélkül hiba @L273 `if (d.fajta === "atalakitva" && !d.atalakitas?.trim()) {`
- [C16] [CONFIRMED] Az aláírás dátumát szigorú éééé-hh-nn mintára ellenőrzi @L282 `if (!/^\d{4}-\d{2}-\d{2}$/.test(a.datum ?? "")) {`
- [C17] [CONFIRMED] Az eldöntött szabályok számát csak a szabályszintű döntésekből számolja, a mezőszintűekből nem @L309 `all.filter((x) => x.allapot === "dontve" && x.szint === "rule").map((x) => x.rule),`
