---
source: core/lab/hitelesites.ts
sha256: 53f84b06013a2478aeff6adf3bcc56f85fcc75f53ea22778305ebcea8700ce92
lines: 267
profile: code
generator: subagent
raw_tokens_est: 2528
verified: 15 confirmed, 1 needs_agent
---

# core/lab/hitelesites.ts

## Topics
- L1-109: miért a számokhoz kötődik az aláírás; a normatív mag, az aláírás típusai
- L110-197: tételenkénti hitelesítési állapot, mérleg és a primary-re emelés
- L198-267: validateHitelesitesek — az aláírás nélküli primary elleni védelem

## Claims

- [C1] [NEEDS_AGENT] az aláírt normatív mag csak a változó azonosítóját, egységét és a sávhatárokat fedi; a megjegyzés és a forrásidézet nem @semantic L39-51
- [C2] [CONFIRMED] a lenyomat SHA-256 hexadecimális formájának első 16 karaktere @L54 `  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);`
- [C3] [CONFIRMED] a `forrasTabla` mező kötelezően megnevezi, MELYIK táblával és melyik sorral vetették össze @L72 `  forrasTabla: string;`
- [C4] [CONFIRMED] három hitelesítési állapot van: hitelesítve, aláíratlan, elavult @L87 `export type HitelesitesAllapot = "hitelesitve" | "alairatlan" | "elavult";`
- [C5] [CONFIRMED] a referenciás változók listája csak a nem üres `reference.ranges`-ű változókat tartja, azonosító szerint rendezve @L106 `    .filter((d) => d.reference?.ranges?.length)`
- [C6] [CONFIRMED] aláírás nélkül a tétel `alairatlan`, aláíró és időpont nélkül @L125 `    if (!h) {`
- [C7] [CONFIRMED] a lenyomat eltérése `elavult` állapotot ad: az aláírás megmarad, de nem fedezi a mostani határértékeket @L129 `    if (h.lenyomat !== mag) {`
- [C8] [CONFIRMED] a `savokHatra` a nem hitelesített tételek sávjainak összege — ennyi számot kell még összevetni @L160 `      .filter((x) => x.allapot !== "hitelesitve")`
- [C9] [CONFIRMED] az `alkalmaz` a dokumentációval ellentétben HELYBEN írja át a regiszterbeli definíciót, és csak a darabszámot adja vissza @L184 `    d.reference.verification = "primary";`
- [C10] [CONFIRMED] csak a `hitelesitve` állapotú tételek kerülnek `primary`-re @L181 `    if (a.allapot !== "hitelesitve") continue;`
- [C11] [CONFIRMED] két hitelesítés ugyanarra a változóra hiba @L205 `    if (latott.has(h.variable)) {`
- [C12] [CONFIRMED] nem létező változóra adott hitelesítés hiba, és a további vizsgálat kimarad @L212 `    if (!d) {`
- [C13] [CONFIRMED] névtelen hitelesítés hiba: aláíró megnevezése nélkül nincs felelős @L221 `    if (!h.ki?.trim()) {`
- [C14] [CONFIRMED] a hiányzó `forrasTabla` hiba @L225 `    if (!h.forrasTabla?.trim()) {`
- [C15] [CONFIRMED] a katalógusban nem szereplő szerepkör csak figyelmeztetés @L233 `    if (!kat.szerepek[h.szerep]) {`
- [C16] [CONFIRMED] a regiszterben `primary`-nek jelölt, de hitelesítés nélküli referencia hiba — a kaput aláírás nyitja, nem jelölés @L243 `    if (!h) {`
