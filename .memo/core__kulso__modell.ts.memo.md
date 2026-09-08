---
source: core/kulso/modell.ts
sha256: 374fdab44144f87fc6ceab515063f3ce9a2dca17f0bc1b10972d1aa8560affbb
lines: 278
profile: code
generator: subagent
raw_tokens_est: 2529
verified: 19 confirmed
---

# core/kulso/modell.ts

## Topics
- L1-101: a modell mint adat, a három kapu, a modelleírás típusai és betöltése
- L102-148: az együtthatómátrix CSV-beolvasása és a prediktor eredménytípusa
- L149-210: a lineáris prediktor számítása, a modellállapotok és a rétegválasztás
- L211-278: ertekelModell — a teljes kiértékelés kapusorrendje

## Claims

- [C1] [CONFIRMED] a modul egyetlen konkrét külső modellt sem ismer: a modell adat, a mag generikus kiértékelő @L18 ` *     A MODELL ADAT, NEM KÓD.`
- [C2] [CONFIRMED] csak a `primary` hitelesítés enged számot születni, a `secondary` és az `assumed` nem @L54 `  verification: "primary" | "secondary" | "assumed";`
- [C3] [CONFIRMED] a `betoltModell` `null`-t ad, ha a könyvtárban nincs `MODELL.json` @L66 `  if (!existsSync(p)) return null;`
- [C4] [CONFIRMED] a telepítettség kizárólag a `MODELL.json` létezésén múlik @L72 `  return existsSync(join(dir, "MODELL.json"));`
- [C5] [CONFIRMED] a mátrix sorai a tagok, oszlopai a rétegek @L79 `  tagok: string[];`
- [C6] [CONFIRMED] a CSV-bontás idézőjel-tudatos, mert a fejlécekben zárójel és vessző is lehet @L86 `function bontSor(sor: string): string[] {`
- [C7] [CONFIRMED] a fejléc első oszlopa sornév, a többi a rétegek listája @L107 `  const retegek = fejlec.slice(1);`
- [C8] [CONFIRMED] a nem véges cellaérték egyszerűen kimarad a mátrixból @L117 `      if (Number.isFinite(n)) soronkent.set(r, n);`
- [C9] [CONFIRMED] a prediktor értéke csak akkor születik meg, ha MINDEN szükséges tag megvolt @L131 `  ertek: number | null;`
- [C10] [CONFIRMED] a nulla együtthatójú tagot kihagyja, és ezt külön listában ki is írja @L159 `    if (c === 0) { kihagyott.push(tag); continue; }`
- [C11] [CONFIRMED] az `(Intercept)` tag értéke definíció szerint 1 @L161 `    if (tag === "(Intercept)") { osszeg += c; continue; }`
- [C12] [CONFIRMED] az `a:b` alakú tag a részek szorzata; ha bármelyik rész hiányzik, az egész tag hiányzónak számít @L168 `      if (v == null || !Number.isFinite(v)) { hianyos = true; break; }`
- [C13] [CONFIRMED] bármely hiányzó tag esetén az érték `null`, nem részösszeg @L176 `    ertek: hianyzo.length ? null : osszeg,`
- [C14] [CONFIRMED] a rétegválasztás alulról zárt, felülről nyitott intervallumokkal dolgozik, és tartományon kívül `null` @L206 `    if (ertek >= h[i] && ertek < h[i + 1]) return modell.retegek[i];`
- [C15] [CONFIRMED] a hiányzó modell az ALAPÉRTELMEZETT állapot, mert a modell nem része a terjesztett műnek @L218 `  if (!modell) {`
- [C16] [CONFIRMED] a megnevezett, de nem létező tábla is `nincsTelepitve` állapotot ad @L230 `  if (!fajl || !existsSync(join(dir, fajl))) {`
- [C17] [CONFIRMED] az érvényességi tartományon kívüli rétegérték `ismeretlenReteg`, mert ott a modell nem tanult semmit @L238 `  if (!reteg) {`
- [C18] [CONFIRMED] hiányzó bemenetnél `hianyzoBemenet` állapot születik, szám nem @L252 `  if (p.hianyzo.length) {`
- [C19] [CONFIRMED] a kiszámolt számot is visszatartja, ha a modell hitelesítése nem `primary` @L264 `  if (modell.verification !== "primary") {`
