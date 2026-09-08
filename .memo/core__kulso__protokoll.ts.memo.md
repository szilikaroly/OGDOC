---
source: core/kulso/protokoll.ts
sha256: c56e9ee97f29eaedcde916cb03dfe77ef26900c8a7ba367a53ca0fb0320e7f99
lines: 652
profile: code
generator: subagent
raw_tokens_est: 6491
verified: 33 confirmed
---

# core/kulso/protokoll.ts

## Topics
- L1-58: a hivatkozás és az átvétel megkülönböztetése, a négy átvételi állapot
- L59-138: KulsoTetel, Licenc, Beszerzes, KulsoForras típusok és a katalógus betöltése
- L139-248: Atvehetoseg mezői, copyleft és megengedő licenclisták, projektLicenc
- L249-289: osszeegyeztetheto — a terjesztés irányában vizsgált licencviszony
- L290-439: atveheto fail-closed kapusora, az átvett és hivatkozható tételek, kötések
- L440-479: forrasAllapot összesítő és a KulsoIssue típus
- L480-623: validateKulsoForrasok integritásellenőrzései
- L624-652: validateKulsoTerjesztes — copyleft származék a terjesztett fában

## Claims

- [C1] [CONFIRMED] négy átvételi állapot van, és csak a `hitelesitett` járul hozzá a rendszer viselkedéséhez @L41 `export type AtvetelAllapot =`
- [C2] [CONFIRMED] az állapotok sorrendje külön exportált tömbben áll, a validálás ehhez méri az értékeket @L47 `export const ATVETEL_SORREND: AtvetelAllapot[] = [`
- [C3] [CONFIRMED] a tételtípus három értékű, és a `bizonyitek` nem eszköz, hanem állítás egy eszközről @L57 `export type TetelTipus = "protokoll" | "kalkulator" | "bizonyitek";`
- [C4] [CONFIRMED] a `cimForrasa` mező rögzíti, hogy a cím a forrásból vagy csak keresőtalálatból származik @L68 `  cimForrasa: "forras" | "kereses";`
- [C5] [CONFIRMED] a tételszintű állapot felülírja a forrás beszerzési állapotát @L74 `  allapot?: AtvetelAllapot;`
- [C6] [CONFIRMED] a tételszintű licenc csak szűkíthet vagy pontosíthat a forrásén @L86 `  licenc?: Licenc;`
- [C7] [CONFIRMED] a hiányzó katalóguskönyvtár érvényes állapot: üres listát ad, nem hibát @L132 `    return [];`
- [C8] [CONFIRMED] az `Atvehetoseg.atveheto` a dokumentáció szerint ma minden tételre hamis @L146 `  atveheto: boolean;`
- [C9] [CONFIRMED] hét copyleft licencazonosító van beégetve @L193 `export const COPYLEFT = [`
- [C10] [CONFIRMED] a copyleft-felismerés nagybetűsített PREFIX-egyezéssel megy, nem pontos egyezéssel @L200 `  return COPYLEFT.some((c) => a.startsWith(c.toUpperCase()));`
- [C11] [CONFIRMED] hat megengedő licencazonosító van beégetve @L213 `export const MEGENGEDO = ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD"];`
- [C12] [CONFIRMED] a projekt licence a `package.json`-ból olvasódik, olvasási hiba esetén `null` @L225 `export function projektLicenc(pkgPath = "package.json"): string | null {`
- [C13] [CONFIRMED] kimondatlan projektlicenc esetén az összeegyeztethetőség `eldontetlen` @L252 `  if (!projekt) {`
- [C14] [CONFIRMED] nem copyleft forráslicenc mindig `igen` választ ad @L258 `  if (!copyleftE(forrasLicenc)) {`
- [C15] [CONFIRMED] megengedő projektlicenc és copyleft forrás együtt `nem`: a terjesztés irányában nem egyeztethető össze @L261 `  if (megengedoE(projekt)) {`
- [C16] [CONFIRMED] copyleft projektlicenc mellett a copyleft forrás `igen` @L271 `  if (copyleftE(projekt)) {`
- [C17] [CONFIRMED] a hivatkozhatóság csak a `bizonyitek` típusra és beszerzett állapotra igaz @L302 `  const hivatkozhato = tetel.tipus === "bizonyitek" && allapot !== "nem-beszerzett";`
- [C18] [CONFIRMED] a helyben telepíthetőséghez ismert licenc, beszerzett állapot és megnevezett helyi tábla kell @L305 `    && allapot !== "nem-beszerzett" && !!tetel.forras?.helyiTabla;`
- [C19] [CONFIRMED] ismeretlen licencnél az átvétel el sem indul — ez az első kapu @L317 `  if (!licenc.ismert) {`
- [C20] [CONFIRMED] a nem `hitelesitett` állapot önmagában megakadályozza az átvételt @L348 `  if (allapot !== "hitelesitett") {`
- [C21] [CONFIRMED] a hitelesítettnek jelölt tétel megnevezett hitelesítő nélkül sem vehető át @L355 `  if (!tetel.hitelesitette?.ki?.trim()) {`
- [C22] [CONFIRMED] a kötések a hozzájuk tartozó tételek száma szerint csökkenően, azonosságnál névsorban rendeződnek @L416 `    .sort((a, b) => b.tetelek.length - a.tetelek.length || a.variable.localeCompare(b.variable));`
- [C23] [CONFIRMED] a `forrasAllapot` az átvehetőséget kontextus NÉLKÜL számolja, tehát projektlicenc nélkül @L443 `  const ertekelt = forras.tetelek.map((t) => atveheto(forras, t));`
- [C24] [CONFIRMED] beszerzettnek az számít, aminek az állapota nem `nem-beszerzett` @L446 `    (t) => (t.beszerzes ?? forras.beszerzes).allapot !== "nem-beszerzett");`
- [C25] [CONFIRMED] a `ATVETEL_SORREND`-ben nem szereplő beszerzési állapot hibát ad @L493 `    if (!ATVETEL_SORREND.includes(f.beszerzes.allapot)) {`
- [C26] [CONFIRMED] be nem szerzett forrás az akadály megnevezése nélkül hiba @L501 `    if (f.beszerzes.allapot === "nem-beszerzett" && !f.beszerzes.akadaly?.trim()) {`
- [C27] [CONFIRMED] hitelesítettnek jelölt tétel ismeretlen licencű forrásban hiba: a licenckapu megelőzi a hitelesítést @L509 `    if (!f.licenc.ismert && f.tetelek.some(`
- [C28] [CONFIRMED] hiányzó vagy érvénytelen `cimForrasa` hiba @L530 `      if (t.cimForrasa !== "forras" && t.cimForrasa !== "kereses") {`
- [C29] [CONFIRMED] beszerzett forrás keresőtalálatból vett tételcímmel figyelmeztetést kap @L538 `      if (t.cimForrasa === "kereses" && besz.allapot !== "nem-beszerzett") {`
- [C30] [CONFIRMED] a saját `beszerzes` blokkal rendelkező, be nem szerzett tételnek saját akadályt kell megneveznie @L579 `      if (besz.allapot === "nem-beszerzett" && besz !== f.beszerzes && !besz.akadaly?.trim()) {`
- [C31] [CONFIRMED] a terjesztésvizsgálat csak a copyleft licencű tételekre fut @L629 `      if (!copyleftE(lic.azonosito)) continue;`
- [C32] [CONFIRMED] a helyi tábla útvonalában szerepelnie kell egy `helyi` szegmensnek, különben build-hiba @L634 `      if (!/(^|\/)helyi(\/|$)/.test(normalt)) {`
- [C33] [CONFIRMED] a ténylegesen létező, `helyi`-t nem tartalmazó útvonal külön hibát ad @L643 `      if (existsSync(normalt) && !normalt.includes("helyi")) {`
