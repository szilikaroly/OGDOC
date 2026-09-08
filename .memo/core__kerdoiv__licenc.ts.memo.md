---
source: core/kerdoiv/licenc.ts
sha256: f31cbd523899d3d4acc7a7ae207ce9d606b9d981002ae4f014456d38231158dd
lines: 402
profile: code
generator: subagent
raw_tokens_est: 4188
verified: 17 confirmed, 1 needs_agent
---

# core/kerdoiv/licenc.ts

## Topics
- L1-66: a licencelés kétkimenetű elfogadási kritériuma, a normatív mag lenyomata
- L67-154: LicencBejegyzes, NemHasznaljuk, katalógusbetöltés, LicencAllapot, EszkozAllapot
- L155-280: eszkozAllapot állapotsorrendje és a felvehetoseg kapu
- L281-402: validateLicencek integritásellenőrzései és a merleg haladásmérő

## Claims

- [C1] [CONFIRMED] a normatív mag a tételek sorszámát, azonosítóját, pontértékeit, a sávokat, a kritikus tételt és a fordítás állapotát fogja össze; a `label` és a tételszöveg nincs benne @L45 `* A `label` és a `documentation` nincs benne: a mi leíró szövegünk javítható`  <!-- anchored from @semantic -->
- [C2] [CONFIRMED] a lenyomat SHA-256 hexadecimális formájának első 16 karaktere @L61 `  return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);`
- [C3] [CONFIRMED] a `LicencBejegyzes.lejar` `null` értéke határozatlan idejű licencet jelent @L78 `  lejar: string | null;`
- [C4] [CONFIRMED] a „nem használjuk" döntés önálló, indoklást és helyettesítőt hordozó rekord @L95 `  hatarozat: "nem-hasznaljuk";`
- [C5] [CONFIRMED] a `loadLicencek` a katalógust JSON-fájlból olvassa be, ellenőrzés nélkül castolva @L112 `  return JSON.parse(readFileSync(path, "utf8")) as LicencKatalogus;`
- [C6] [CONFIRMED] a `LicencAllapot` hét értéket vesz fel, köztük a jelölés mögötti nyilvántartás hiányát jelölő `igazolatlan`-t @L117 `export type LicencAllapot =`
- [C7] [CONFIRMED] a lejárati előjelzés beégetett küszöbe 90 nap @L150 `export const ELOJELZES_NAP = 90;`
- [C8] [CONFIRMED] a leírt döntés megelőzi a licencet: ha van döntés, az eszköz `nem-hasznaljuk`, rendezett, de nem felvehető @L171 `  if (dontes) {`
- [C9] [CONFIRMED] a `notLicensed` jelölés `rendezetlen` állapotot ad: se rendezett, se felvehető @L182 `  if (i.itemText.status === "notLicensed") {`
- [C10] [CONFIRMED] a `public` tételszöveg `kozkincs`, és akkor is felvehető, ha a magyar fordítás nem validált @L192 `  if (i.itemText.status === "public") {`
- [C11] [CONFIRMED] a `loaded` jelölés nyilvántartott licenc nélkül `igazolatlan`, és nem nyitja a kaput @L206 `  if (!lic) {`
- [C12] [NEEDS_AGENT] a licenc csak akkor érvényes, ha a benne rögzített lenyomat a mostani maggal egyezik és a lejárat még nem múlt el @semantic L216-234
- [C13] [CONFIRMED] a `felvehetoseg` ismeretlen eszköznél `"ismeretlen"` állapotot ad vissza, hogy ne lehessen összetéveszteni a licenchiánnyal @L272 `    return { ok: false, allapot: "ismeretlen",`
- [C14] [CONFIRMED] nem létező mérőeszközre hivatkozó licenc `error` súlyosságú kifogást ad @L291 `      out.push({ severity: "error", id: l.inst, message: "licenc nem létező mérőeszközre" });`
- [C15] [CONFIRMED] a `kelt` dátumot szigorú `YYYY-MM-DD` mintára ellenőrzi @L307 `    if (!/^\d{4}-\d{2}-\d{2}$/.test(l.kelt ?? "")) {`
- [C16] [CONFIRMED] ugyanarra az eszközre licenc és „nem használjuk" döntés együtt hiba, a gép nem választ közülük @L325 `    if (latottL.has(d.inst)) {`
- [C17] [CONFIRMED] indoklás nélküli „nem használjuk" döntés hibát ad @L333 `    if (!d.indoklas?.trim()) {`
- [C18] [CONFIRMED] a 90 napon belül lejáró érvényes licenc `warning` szintű figyelmeztetést kap @L350 `    if (a.allapot === "licencelt" && a.napMulva !== null && a.napMulva <= ELOJELZES_NAP) {`
- [C19] [CONFIRMED] a `merleg` a `rendezetlen` számba az `igazolatlan`, `lejart` és `elavult` eszközöket is beleszámolja @L396 `    rendezetlen: db("rendezetlen") + db("igazolatlan") + db("lejart") + db("elavult"),`
