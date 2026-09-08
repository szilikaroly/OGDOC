---
source: core/calc/hitelesites.ts
sha256: 8b47cfaa79e8557e716eebff5784f4c5f2df6fed6dd747c6d7ea9a790b2b2cdf
lines: 368
profile: code
generator: subagent
raw_tokens_est: 3653
verified: 20 confirmed
---

# core/calc/hitelesites.ts

## Topics
- L1-150: Lenyomatképzés, konstanskinyerés, elcsúszás-figyelő és monotonitás-jelzés
- L151-192: Az aláírás adatszerkezete, katalógus betöltése, tételállapot típusa
- L193-270: Állapotszámítás aláírás alapján, verified átírása, öröklött lista
- L271-368: A hitelesítések validálása és az öröklött lista fogyásának mérése

## Claims

- [C1] [CONFIRMED] A `normalizal` a blokk- és sorvégi megjegyzéseket kivágja, majd a szóközöket egyetlen szóközre nyomja @L41 `.replace(/\/\*[\s\S]*?\*\//g, "")`
- [C2] [CONFIRMED] A `lenyeg` normatív magja az azonosító, a bemenetek EGYSÉGGEL, a kimenet egysége, a sávhatárok és a normalizált `fn`-forrás — a címke, a próza és a forráshivatkozás szándékosan kimarad @L54 `export function lenyeg(c: CalcDef): string {`
- [C3] [CONFIRMED] A `lenyomat` sha256-ot számol, és az első 16 hexjegyre csonkolja @L63 `return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);`
- [C4] [CONFIRMED] A `konstansok` duplikátum nélkül gyűjti a számliterálokat, és a tizedesvesszőt pontra cseréli @L75 `.map((m) => m[0].replace(",", ".")),`
- [C5] [CONFIRMED] Az `elcsuszas` a sávhatárokat a kód oldalára veszi fel, mert a sávozást a kalkulátor-réteg végzi, nem a képlet @L102 `for (const v of [b.min, b.max]) if (v != null) kod.add(String(v));`
- [C6] [CONFIRMED] A `monotonJelzesek` a nem `score` fajtájú kalkulátorra üres listát ad @L128 `if (c.kind !== "score") return [];`
- [C7] [CONFIRMED] Az aláírás tételes konstanslistát követel, hogy az „összevetve” állítás ellenőrizhető legyen @L164 `osszevetettKonstansok: string[];`
- [C8] [CONFIRMED] Három tételállapot létezik: `hitelesitve`, `alairatlan`, `elavult` @L177 `export type KalkAllapot = "hitelesitve" | "alairatlan" | "elavult";`
- [C9] [CONFIRMED] A `loadKalkHitelesitesek` fájlból olvas és a JSON-t ellenőrzés nélkül castolja @L174 `return JSON.parse(readFileSync(path, "utf8")) as KalkHitelesitesKatalogus;`
- [C10] [CONFIRMED] Aláírás híján az állapot `alairatlan`, és minden kódbeli konstans összevetetlennek számít @L209 `osszevetetlen: konst, miert: null };`
- [C11] [CONFIRMED] Lenyomat-eltérésnél az állapot `elavult`, és az indoklás megnevezi az aláírt és a mostani lenyomatot @L212 `if (h.lenyomat !== mag) {`
- [C12] [CONFIRMED] Az `alkalmazKalk` mellékhatásként, futásidőben írja igazra a definíció `verified` mezőjét @L234 `(c as { verified: boolean }).verified = true;`
- [C13] [CONFIRMED] Az `alkalmazKalk` csak a `hitelesitve` állapotúakat érinti @L231 `if (a.allapot !== "hitelesitve") continue;`
- [C14] [CONFIRMED] A `loadOrokolt` az öröklött listát fájlból, ellenőrzés nélküli castolással olvassa @L268 `return JSON.parse(readFileSync(path, "utf8")) as OrokoltLista;`
- [C15] [CONFIRMED] Ugyanarra a kalkulátorra adott két hitelesítés hiba @L278 `if (latott.has(h.calc)) {`
- [C16] [CONFIRMED] Hiányzó `forrasTabla` hiba: nem derül ki, mivel vetették össze @L293 `if (!h.forrasTabla?.trim()) {`
- [C17] [CONFIRMED] Minden kódbeli konstansnak szerepelnie kell az összevetett listán, különben hiba @L299 `const hianyzo = konst.filter((k) => !(h.osszevetettKonstansok ?? []).includes(k));`
- [C18] [CONFIRMED] Nem növekvő pontsor aláírható, de megjegyzés nélkül hiba @L310 `if (mono.length && !h.megjegyzes?.trim()) {`
- [C19] [CONFIRMED] Aláírás nélküli `verified: true` az öröklött listán csak figyelmeztetés, azon kívül hiba @L327 `if (orokoltHalmaz.has(c.id)) {`
- [C20] [CONFIRMED] Az `orokoltAllas` az öröklöttek közül csak a még nem aláírtakat számolja @L364 `orokolt: orokolt.orokolt.filter((id) => !alairt.has(id)).length,`
