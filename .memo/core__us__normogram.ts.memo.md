---
source: core/us/normogram.ts
sha256: b427f3289bfc3e0ea4201478f44a463c50b69af97cc443c021824e20a0ded458
lines: 609
profile: code
generator: subagent
raw_tokens_est: 6510
verified: 30 confirmed, 1 needs_agent
---

# core/us/normogram.ts

## Topics
- L1-50: A motor három szabálya, sortípus, táblaeredet, igazító tag
- L51-102: Igazító tag alakja, hitelesítési szintek és predikátumaik
- L103-212: Normogram- és eredménytípusok, phi, sávelemszám, percentilis-sáv
- L213-372: A NormogramSet: betöltés, interpoláció, populációs értékelés kapui
- L373-532: Személyre szabott értékelés, hibrid megjelenítés, validálás eleje
- L533-609: Helyi tábla validálása, fájlbeolvasás, kísérő állományok

## Claims

- [C1] [CONFIRMED] A modul a `node:fs` szinkron olvasóival közvetlenül a fájlrendszerhez nyúl @L19 `import { readFileSync, readdirSync, statSync } from "node:fs";`
- [C2] [CONFIRMED] A tábla eredete három érték egyike, és nem szabad szöveg @L41 `export type NormogramKind = "published" | "local" | "customised";`
- [C3] [CONFIRMED] A modul deklarált első szabálya, hogy a tábla szélén túl nem számol @L10 `NINCS EXTRAPOLÁCIÓ. A tábla szélén túl nem számolunk.`
- [C4] [NEEDS_AGENT] Egy táblasor a független változóból, az átlagból és a szórásból áll, és a szórásból jön a z-érték @semantic L25-31
- [C5] [CONFIRMED] Az igazító tag kétféle lehet: folytonos (`linear`) vagy kódonkénti (`coded`) @L55 `  kind: "linear" | "coded";`
- [C6] [CONFIRMED] A hitelesítettségi szintek négyelemű, `as const` felsorolásból jönnek, nem karakterlánc-hasonlításból @L83 `  "primary", "secondary", "assumed", "local",`
- [C7] [CONFIRMED] A `hitelesitett()` KIZÁRÓLAG a `primary` szintre igaz @L90 `  return n.verification === "primary";`
- [C8] [CONFIRMED] Az `adPercentilist()` a `local` szintet is átengedi a `primary` mellett, tehát tágabb, mint a `hitelesitett()` @L100 `  return n.verification === "primary" || n.verification === "local";`
- [C9] [CONFIRMED] A `phi` a negatív oldalt tükrözéssel adja: pozitív z-nél `1 - p`, egyébként `p` @L174 `  return z > 0 ? 1 - p : p;`
- [C10] [CONFIRMED] A `binCount` `null`-t ad, ha a táblához nincs sávonkénti esetszám @L195 `  if (!counts) return null;`
- [C11] [CONFIRMED] A `binCount` az x-et BEFOGÓ két sáv közül a KISEBB esetszámot adja vissza, nem a legközelebbi sávét @L202 `  return Math.min(...befogok.map((k) => counts[String(k)]));`
- [C12] [CONFIRMED] A `bandOf` középső sávja felül zárt: a pontosan 90. percentilis még `p10-90` @L208 `  if (p <= 90) return "p10-90";`
- [C13] [CONFIRMED] A sikeres eredmény kötelezően hordozza a tábla eredetét @L155 `  kind: NormogramKind;`
- [C14] [CONFIRMED] A `NormogramSet` konstruktora duplikált azonosítóra kivételt dob @L219 `if (this.byId.has(n.id)) throw new Error(`
- [C15] [CONFIRMED] Az `atX` a tábla két szélén kívül `null`-t ad, nem extrapolál @L234 `if (x < rows[0].x || x > rows[rows.length - 1].x) return null;`
- [C16] [CONFIRMED] Ha egy paraméterhez több normogram van és nincs azonosító megadva, az `evaluate` nem választ, hanem `insufficient`-et ad @L263 `    if (!normogramId && candidates.length > 1) {`
- [C17] [CONFIRMED] A percentilis-kapu: a se nem `primary`, se nem `local` tábla nem ad percentilist @L280 `    if (n.verification !== "primary" && n.verification !== "local") {`
- [C18] [CONFIRMED] A `local` tábla `derivedFrom` nélkül elutasított, mert nem mondja meg, miből készült @L288 `    if (n.verification === "local" && !n.derivedFrom) {`
- [C19] [CONFIRMED] Az öngenerált táblánál a befogó sávok elemszáma a `minPerBin` alatt megtagadja az eredményt @L336 `      if (nInBin != null && nInBin < n.derivedFrom.minPerBin) {`
- [C20] [CONFIRMED] A személyre szabott értékelés ugyanazt a kaput az ALAPTÁBLÁRA is alkalmazza @L387 `    if (base.verification !== "primary" && base.verification !== "local") {`
- [C21] [CONFIRMED] Az igazító együtthatókhoz `primary` szint kell — itt a `local` nem elég @L395 `    if (n.verification !== "primary") {`
- [C22] [CONFIRMED] Kódolt tagnál a `byCode`-ban nem szereplő kód hiányzó bemenetnek számít, nem nulla hatásnak @L422 `        if (!(String(r.value) in byCode)) {`
- [C23] [CONFIRMED] Az igazítás szorzóként hat, és az átlag mellett a szórást is szorozza @L450 `    const sd = dist.sd * factor;`
- [C24] [CONFIRMED] Hiányzó demográfiai adatnál nincs csendes visszaesés az igazítatlan értékre @L436 `Igazítatlan értékre NEM esünk vissza csendben.`
- [C25] [CONFIRMED] Az `evaluateHybrid` rögzített sorrendben rendez: `published`, `local`, `customised` @L487 `    const rank: Record<NormogramKind, number> = { published: 0, local: 1, customised: 2 };`
- [C26] [CONFIRMED] A helyi táblánál a hiányzó kizárási szabály csak figyelmeztetés, nem hiba @L555 `            push("warning", n.id,`
- [C27] [CONFIRMED] A `local` ellenőrzöttségi szint és a `local` táblafajta kölcsönösen kötelezik egymást @L563 `      } else if (n.verification === "local") {`
- [C28] [CONFIRMED] A `filesIn` csak a `.json` kiterjesztésűeket veszi, névsorrendbe rendezve @L581 `  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));`
- [C29] [CONFIRMED] A `loadNormograms` könyvtárat és önálló fájlt is elfogad útvonalként @L590 `    const files = statSync(p).isDirectory() ? filesIn(p) : [p];`
- [C30] [CONFIRMED] A kísérő állományokat NEVESÍTETT felismerő kulcsok alapján hagyja ki @L600 `        if (KISERO_KULCSOK.some((k) => parsed?.[k])) continue;`
- [C31] [CONFIRMED] A nem tömb és nem kísérő kulcsú fájl hangos kivétel, nem csendes kihagyás @L601 `        throw new Error(`
