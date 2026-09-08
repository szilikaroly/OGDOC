---
source: core/us/hitelesites.ts
sha256: dae260775e64eedc1384ea6eb9e67f9339db068068442c3aae182caa0d2ae837
lines: 223
profile: code
generator: subagent
raw_tokens_est: 2079
verified: 15 confirmed, 1 needs_agent
---

# core/us/hitelesites.ts

## Topics
- L1-81: A görbe normatív magja, lenyomat, hitelesítési rekord típusai
- L82-136: Görbénkénti hitelesítési állapot és a `primary` szint futásidejű megadása
- L137-223: A hitelesítések validálása, konvenciófüggőség, aláírás nélküli `primary`

## Claims

- [C1] [NEEDS_AGENT] A lenyomat a görbe azonosítóját, mérését, független változóját, egységét és sorait fedi @semantic L33-38
- [C2] [CONFIRMED] A `population`, a forráshivatkozás és a megjegyzés kimarad az aláírás alól, ezért javítható az aláírás elvesztése nélkül @L18 `* egységet és a SOROKAT. A `population`, a `source.cite` és a megjegyzés`  <!-- anchored from @semantic -->
- [C3] [CONFIRMED] A hitelesítő képesítése kötelező mező, mert a mérési technika is a hitelesítés tárgya @L47 `  kepesites: string;`
- [C4] [CONFIRMED] A mérési konvenció kétértékű és opcionális a típusban, kötelezőségét a validálás dönti el @L56 `  konvencio?: "outerInner" | "outerOuter";`
- [C5] [CONFIRMED] A hitelesítés-katalógus betöltése szinkron fájlolvasás, séma-ellenőrzés nélküli típuskényszerítéssel @L66 `  return JSON.parse(readFileSync(path, "utf8")) as NormogramHitelesitesKatalogus;`
- [C6] [CONFIRMED] Négy hitelesítési állapot van, köztük a `helyi` @L69 `export type NgAllapot = "hitelesitve" | "alairatlan" | "elavult" | "helyi";`
- [C7] [CONFIRMED] A helyi tábla nem aláírás tárgya, külön állapotot kap @L95 `    if (n.verification === "local") {`
- [C8] [CONFIRMED] Hitelesítés hiányában a görbe `alairatlan`, indoklás nélkül @L99 `    if (!h) {`
- [C9] [CONFIRMED] Ha a mostani lenyomat eltér az aláírttól, a görbe `elavult` @L103 `    if (h.lenyomat !== mag) {`
- [C10] [CONFIRMED] Az `alkalmazNg()` MÓDOSÍTJA a kapott görbéket: a hitelesítetteket futásidőben `primary`-re állítja @L125 `    ng.verification = "primary";`
- [C11] [CONFIRMED] Az `alkalmazNg()` a felemelt görbék számát adja vissza @L128 `  return n;`
- [C12] [CONFIRMED] A konvenciófüggő változókat a katalógusból vezeti le: akkor az, ha egynél több konvenció szerepel @L148 `    if (k.size > 1) konvenciofuggoValtozok.add(variable);`
- [C13] [CONFIRMED] Ugyanarra a görbére két hitelesítés hiba @L152 `    if (latott.has(h.normogram)) {`
- [C14] [CONFIRMED] Helyi tábla hitelesítése hiba: a `local` sosem válik `primary`-vé @L164 `    if (n.verification === "local") {`
- [C15] [CONFIRMED] Hiányzó képesítés hiba, nem figyelmeztetés @L176 `    if (!h.kepesites?.trim()) {`
- [C16] [CONFIRMED] Konvenciófüggő mérésnél a konvenció megnevezése nélküli aláírás hiba @L188 `    if (konvenciofuggoValtozok.has(n.parameter) && !h.konvencio) {`
- [C17] [CONFIRMED] A `primary` szintet csak aláírás nyithatja: a jelölt, de nem hitelesített görbe hibát ad @L202 `    if (!hitelesitett(n)) continue;`
