---
source: core/complaints/registry.ts
sha256: a3263c4cec6213b54c38fcdea12f0a84fdd8cb6bcf910f4f6e40b44d7a4e5df4
lines: 211
profile: code
generator: subagent
raw_tokens_est: 2112
verified: 11 confirmed
---

# core/complaints/registry.ts

## Topics
- L1-27: Miért a keresés a modul lényege, normalizálás, találat-típus
- L28-184: A panaszszótár osztálya: keresés, értékkészlet, vörös zászlók, validálás
- L185-211: Feltétel-kiértékelő és a szótárfájlok betöltése

## Claims

- [C1] [CONFIRMED] A `fold` NFD-re bont, az ékezeteket eldobja, kisbetűsít és trimel @L17 `return s.normalize("NFD").replace(`
- [C2] [CONFIRMED] A találati rang háromfokú: 3 a címke eleje, 2 a szinonima eleje, 1 a bárhol előfordulás @L24 `/** 3 = címke eleje · 2 = szinonima eleje · 1 = bárhol előfordul. */`
- [C3] [CONFIRMED] Duplikált panaszkód esetén a konstruktor kivételt dob @L34 `throw new Error(`
- [C4] [CONFIRMED] A megadott ellátási útvonal kizárja azokat a tételeket, amelyek más útvonalra vannak kötve @L55 `if (pathway && term.pathways?.length && !term.pathways.includes(pathway)) continue;`
- [C5] [CONFIRMED] Azonos rangnál a rövidebb magyar címkéjű tétel kerül előre @L69 `|| (a.term.label.hu ?? "").length - (b.term.label.hu ?? "").length)`
- [C6] [CONFIRMED] Egyetlen nem teljesülő feltétel azonnal `false`-ra zárja a vörös zászlót, a hiányzó adatok ellenére is @L108 `if (!test(r.value, c)) return { flag: false, why: [`
- [C7] [CONFIRMED] Hiányzó adatnál a vörös zászló állapota `unknown`, nem `false` @L111 `return { flag: unknown ? "unknown" : true, why };`
- [C8] [CONFIRMED] Példányosított (`scopedBy`) mezőre mutató `opens` hiba: az a panasz jellemzője, tehát az `asks` listába való @L132 `if (d.scopedBy) {`
- [C9] [CONFIRMED] Az ütköző szinonima csak akkor figyelmeztetés, ha a két tétel ellátási útvonalai átfednek @L167 `if (!overlaps(ids.map((i) => this.get(i)!.pathways))) continue;`
- [C10] [CONFIRMED] A feltétel-kiértékelő hét operátort ismer, az összehasonlítókat `Number()` konverzióval @L190 `case "lt": return Number(value) < Number(c.value);`
- [C11] [CONFIRMED] A betöltés kivételt dob, ha egy szótárfájl tartalma nem tömb @L207 `if (!Array.isArray(parsed)) throw new Error(`
