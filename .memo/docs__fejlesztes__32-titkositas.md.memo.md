---
source: docs/fejlesztes/32-titkositas.md
sha256: e57da0d78ff0c64cafd7125f99423cc3927171c1e803ef501d3c2e22770cf317
lines: 326
profile: prose
generator: subagent
raw_tokens_est: 3506
verified: 12 confirmed
---

# docs/fejlesztes/32-titkositas.md

## Topics
- L1-156: kulcsmentés és törlés feszültsége, boríték-hierarchia, kötés, kriptográfiai törlés, DEK-tilalom
- L157-315: migrációs rekord, letéti küszöb, nonce-választás, nyílt mezők, mért árak, korlátok
- L316-326: négymondatos összefoglaló

## Claims

- [C1] [CONFIRMED] A kulcsletét és a törölhetőség egymást kizáró követelmények, kulcsonként kell dönteni @L15 `A kulcs mentése és a törlés követelménye EGYMÁSNAK FESZÜL.`
- [C2] [CONFIRMED] A `KeyPolicy.escrowExcluded` üresen is kötelezően kitöltendő, mert a hallgatás véletlen döntés lenne @L20 `**kötelező mező akkor is, ha üres**`
- [C3] [CONFIRMED] Az esetenkénti adatkulcs indoka a kriptográfiai törlés, nem a teljesítmény @L41 `**Nem a teljesítmény miatt**`
- [C4] [CONFIRMED] A hitelesített kötés négy nyílt mezőt fog be, ezért a rekord nem helyezhető át másik esetbe @L53 `aad = { caseId, seq, prevHash, formatVersion }`
- [C5] [CONFIRMED] A `cryptoErase()` nem nyugtázza a törlést, amíg a kulcsról bárhol maradt másolat @L101 `A TÖRLÉS NEM TELJES: a kulcsról még 1 helyen van másolat.`
- [C6] [CONFIRMED] A DEK nem cserélhető, mert az újratitkosítás elszakítaná a lenyomatláncot @L155 `| **DEK** | **nincs** | az újratitkosítás elszakítaná a láncot |`
- [C7] [CONFIRMED] A `checkMigration()` elutasítja az elrendelő nélküli migrációt @L170 `elutasítja az elrendelő nélküli migrációt`
- [C8] [CONFIRMED] A letéti validátor elutasítja az egyszemélyes küszöböt @L184 `Egyetlen letétkezelő nem letét.`
- [C9] [CONFIRMED] A validátor a tartalék nélküli (`need === of`) küszöböt is elutasítja, mert az garantált adatvesztés @L185 `Nincs tartalék.`
- [C10] [CONFIRMED] A nonce véletlen 12 bájt, nem a sorszámból származtatott, hogy a hívó hibája ne legyen katasztrofális @L211 `a hívó hibája nem lehet katasztrofális**. 12 bájt`
- [C11] [CONFIRMED] A `kodkulcs_kezelo` és a `kutato` szerep összeférhetetlen, egy felhasználó nem kaphatja meg mindkettőt @L237 `**egy felhasználón nem adható ki**`
- [C12] [CONFIRMED] Egy érték lezárásának mért mediánja 0,014 ms @L275 `| egy érték lezárása (AES-256-GCM + kötés) | **0,014 ms** |`
