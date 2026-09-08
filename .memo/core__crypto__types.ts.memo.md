---
source: core/crypto/types.ts
sha256: dba2a0ff5fec56a6bdcdc363f148152e86af1e07f041615322a9e3b2d86be612
lines: 187
profile: code
generator: subagent
raw_tokens_est: 1925
verified: 12 confirmed
---

# core/crypto/types.ts

## Topics
- L1-115: Borítékos titkosítás típusai: algoritmus, kulcsállapot, kötés, kulcsházirend
- L116-187: A kulcsházirend ellenőrzése és a migrációs rekord vizsgálata

## Claims

- [C1] [CONFIRMED] Két algoritmus-azonosító megengedett, és az azonosító minden rekordban szerepel @L33 `export type CipherId = "AES-256-GCM" | "CHACHA20-POLY1305";`
- [C2] [CONFIRMED] Három kulcsállapot van; a `retired` már csak visszafejtésre használható @L40 `| "retired"`
- [C3] [CONFIRMED] A kulcsazonosító nem titok: a rekord mellett utazik @L45 `/** Kulcsazonosító. NEM titok — a rekord mellett utazik. */`
- [C4] [CONFIRMED] A kötés négy mezőből áll: eset, sorszám, előző lánclenyomat, formátumverzió @L81 `export interface SealBinding {`
- [C5] [CONFIRMED] Az adatkulcs típusszinten megváltoztathatatlan, mert a lánc a rejtjelezett alakon fut @L100 `dekImmutable: true;`
- [C6] [CONFIRMED] A letétből kihagyott kulcsok listája kötelező mező, akkor is, ha üres @L111 `escrowExcluded: Array<{ keyId: string; why: string }>;`
- [C7] [CONFIRMED] Kettőnél kevesebb szükséges letétrész hiba: egyetlen letétkezelő nem letét @L120 `if (need < 2) {`
- [C8] [CONFIRMED] A meglévőnél több szükséges letétrész teljesíthetetlen küszöb, hiba @L126 `if (need > of) {`
- [C9] [CONFIRMED] Tartalék nélküli küszöb (minden letétrész kell) szintén hiba @L131 `if (of - need < 1) {`
- [C10] [CONFIRMED] A 730 napnál ritkább KEK-csere csak figyelmeztetés @L138 `if (p.kekRotationDays > 730) {`
- [C11] [CONFIRMED] Azonos régi és új lánclenyomat esetén a rekord nem migráció @L179 `if (m.fromHash === m.toHash) {`
- [C12] [CONFIRMED] Azonos kulcs és azonos algoritmus mellett az újratitkosítás értelmetlen, a lánc mégis elszakad @L182 `if (m.fromKeyId === m.toKeyId && m.fromCipher === m.toCipher) {`
