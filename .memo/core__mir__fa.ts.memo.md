---
source: core/mir/fa.ts
sha256: a264528e8b107d3fe0c674398fc36296027e6b797dd325fd1e966bc3268fc35b
lines: 455
profile: code
generator: subagent
raw_tokens_est: 4420
verified: 22 confirmed, 2 needs_agent
---

# core/mir/fa.ts

## Topics
- L1-122: a dokumentumfa típusai, betöltése, a dokumentumállapotok és az előjelzés
- L123-229: dokumentumAllas számítása, a kontrollmátrix típusai és erősségi sorrendje
- L230-319: kontrollAllas bizonyítékvizsgálata és a kategóriánkénti összegzés
- L320-350: az első akkreditációs kérelem kapuja
- L351-455: validateMir integritásellenőrzések és a MirMerleg haladásmérő

## Claims

- [C1] [CONFIRMED] a dokumentumfa négy szintet ismer: politika, kézikönyv, eljárás, SOP @L38 `export type Szint = "politika" | "kezikonyv" | "eljaras" | "sop";`
- [C2] [CONFIRMED] a definíció minden dokumentumhoz felülvizsgálati periódust és bizonyítéklistát ír elő @L48 `  felulvizsgalatHonap: number;`
- [C3] [NEEDS_AGENT] a dokumentum négy állapotot vehet fel, és a lejárt felülvizsgálat nem hatályos állapotot jelent @semantic L91-99
- [C4] [CONFIRMED] a felülvizsgálati előjelzés beégetett küszöbe 90 nap @L102 `export const ELOJELZES_NAP = 90;`
- [C5] [CONFIRMED] az `eros` mező mondja meg, számít-e a dokumentum MA bizonyítéknak — a lejárt nem számít @L114 `  eros: boolean;`
- [C6] [CONFIRMED] hatályos bejegyzés nélkül a dokumentum `"nincs"` állapotú és nem erős @L133 `    if (!h) {`
- [C7] [CONFIRMED] a felülvizsgálat lejárta `lejart` állapotot és `eros: false`-t ad @L141 `    if (n < 0) {`
- [C8] [CONFIRMED] a 90 napon belüli esedékesség `felulvizsgalatEsedekes`, de a dokumentum még erős marad @L152 `    const kozel = n <= ELOJELZES_NAP;`
- [C9] [CONFIRMED] a `KontrollDef.rogzitettAllapot` a megfelelési fejezetből átvett KÉZI jelölés @L181 `  rogzitettAllapot: RogzitettAllapot;`
- [C10] [CONFIRMED] a `nincsBizonyitek` nem ugyanaz, mint a `bizonyitatlan`: ott azt sem írták le, mivel bizonyítanának @L209 `| "nincsBizonyitek";`
- [C11] [CONFIRMED] a rögzített és a számított állapotot két számtáblázat teszi összemérhetővé, a `bizonyitatlan` és a `nincsBizonyitek` egyaránt 0 erősségű @L227 `  nincsBizonyitek: 0, bizonyitatlan: 0, reszben: 1, bizonyitott: 2,`
- [C12] [CONFIRMED] egy kontroll bizonyítékai közül csak a MA erős dokumentumok számítanak @L236 `    const hatalyosDok = hivatkozott.filter((id) => dok.get(id)?.eros);`
- [C13] [NEEDS_AGENT] a kontroll állapota a hivatkozott és a hatályos dokumentumok darabszámából áll elő, négy ágon @semantic L239-242
- [C14] [CONFIRMED] a `tulallit` akkor igaz, ha a kézi jelölés erősebb, mint a bizonyítékból számított állapot @L244 `    const tulallit = ROGZITETT_ERO[k.rogzitettAllapot] > SZAMITOTT_ERO[a];`
- [C15] [CONFIRMED] a négy kategória címe beégetett, klauzulaszámokkal együtt @L273 `export const KATEGORIA_CIM: Record<Kategoria, string> = {`
- [C16] [CONFIRMED] az összegzés a sorokból számol, nem kézzel írt számokból @L292 `    const db = (a: RogzitettAllapot) => sorok.filter((k) => k.rogzitettAllapot === a).length;`
- [C17] [CONFIRMED] az első kör hiánya az `elsoKor && !eros` feltételből áll elő @L324 `  const hianyzoElsoKor = all.filter((d) => d.elsoKor && !d.eros).map((d) => d.doc);`
- [C18] [CONFIRMED] a kérelem akkor nem adható be, ha az első körből hiányzik valami VAGY bármelyik felülvizsgálat lejárt @L326 `  if (hianyzoElsoKor.length || lejart.length) {`
- [C19] [CONFIRMED] a fához nem tartozó hatályos bejegyzés hibát ad @L359 `    if (!ids.has(h.doc)) {`
- [C20] [CONFIRMED] a hatályos bejegyzésből hiányzó verzió vagy jóváhagyó hiba @L368 `    if (!h.verzio?.trim() || !h.jovahagyta?.trim()) {`
- [C21] [CONFIRMED] hatályos SOP űrlap vagy feljegyzés nélkül hiba — a fa saját szabálya @L381 `    if (def.szint === "sop" && !(h.bizonyitek ?? []).length) {`
- [C22] [CONFIRMED] a kontroll bizonyítékaként megnevezett, de a fában nem létező dokumentum hibát ad @L402 `      if (!ids.has(id)) {`
- [C23] [CONFIRMED] a túlállító jelölés `nincsBizonyitek` esetén összesített `warning`, minden más esetben kontrollonkénti `error` @L419 `  for (const k of tul.filter((x) => x.allapot !== "nincsBizonyitek")) {`
- [C24] [CONFIRMED] a `merleg` a kérelmezhetőséget a `kerelemAllas` újrafuttatásával veszi át @L453 `    kerelmezheto: kerelemAllas(fa, allapot, ma).kerelmezheto,`
