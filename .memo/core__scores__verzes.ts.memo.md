---
source: core/scores/verzes.ts
sha256: b7d55912ea39ba939fecd395cf522ee5a836bc109cc69e607b91c9c0c8f22698
lines: 207
profile: code
generator: subagent
raw_tokens_est: 2044
verified: 16 confirmed
---

# core/scores/verzes.ts

## Topics
- L1-95: modul-indoklás, tábla- és tényezőtípusok, betöltés, feltétel-kiértékelő
- L96-144: az assessVerzes értékelő és a „szint nem születik” indoklás
- L145-207: a vérzési tábla önvalidátora

## Claims

- [C1] [CONFIRMED] A modul szándékosan nem ad alacsony/közepes/magas besorolást, mert a tábla hitelesítése `assumed`, és egy rossz táblából jövő „alacsony kockázat” megnyugtatna @L10 `* A táblánk `verification: "assumed"` — a tényezők és a besorolásuk elsődleges`  <!-- anchored from @semantic -->
- [C2] [CONFIRMED] A feltételnek négy alakja lehet: eq, gte, gt vagy notIn @L34 `notIn?: unknown[];`
- [C3] [CONFIRMED] A `loadVerzesTabla` szinkron fájlolvasással JSON-ból parse-olja a táblát, séma-ellenőrzés nélkül @L57 `return JSON.parse(readFileSync(path, "utf8")) as VerzesTabla;`
- [C4] [CONFIRMED] A tényező fennállása háromértékű, az „unknown” nem esik egybe a hamissal @L66 `fennall: boolean | "unknown";`
- [C5] [CONFIRMED] A `teljesul` a feltételalakokat rögzített sorrendben, elsőként az `eq`-t vizsgálja @L88 `if (felt.eq !== undefined) return value === felt.eq;`
- [C6] [CONFIRMED] Értelmezhetetlen feltételre a `teljesul` kivételt dob, nem ad vissza hamisat @L93 `throw new Error(`
- [C7] [CONFIRMED] Ha a `resolve` nem ad ok állapotot, a változó a `hianyzo` listába kerül és a tényező „unknown” lesz @L108 `hianyzo.push(t.variable);`
- [C8] [CONFIRMED] A rögzített „nem tudom” külön listába megy, de szintén „unknown” fennállást ad @L112 `if (nemTudja(reg, t.variable, r.value)) {`
- [C9] [CONFIRMED] A címke és az indoklás nyelvfüggő, magyar tartalékkal @L104 `const label = t.label[lang] ?? t.label.hu;`
- [C10] [CONFIRMED] A `nincsSzint` csak akkor null, ha a tábla hitelesítése `primary` @L121 `const nincsSzint = tabla.verification === "primary"`
- [C11] [CONFIRMED] A visszaadott `szint` beégetetten mindig null — a kód szintet sehol nem számol @L136 `szint: null,`
- [C12] [CONFIRMED] A validátor elkapja a `resolvePrimary` dobását, hogy az elgépelt változónév megnevezett hiba legyen, ne összeomlás @L159 `try { def = reg.get(reg.resolvePrimary(t.variable)); } catch { def = undefined; }`
- [C13] [CONFIRMED] A feltételben pontosan egy kulcs lehet, több vagy nulla hiba @L170 `if (kulcsok.length !== 1) {`
- [C14] [CONFIRMED] Az `eq` értékének szerepelnie kell a változó kódlistájában @L177 `if (!def.valueSet.some((v) => v.code === t.mikor.eq)) {`
- [C15] [CONFIRMED] Számos (gte/gt) feltétel csak `quantity` vagy `count` típusú változón megengedett @L190 `if (szamos && def.datatype !== "quantity" && def.datatype !== "count") {`
- [C16] [CONFIRMED] Hitelesítetlen tábla indoklás nélküli hitelesítési jegyzete hiba: a kapunak meg kell mondania, mire vár @L196 `if (tabla.verification !== "primary" && !tabla.verificationNote?.hu?.trim()) {`
- [C17] [CONFIRMED] Minden nem `primary` tábla figyelmeztetést kap arról, hogy szintet nem állapít meg @L201 `if (tabla.verification !== "primary") {`
