---
source: core/pilot/horgony.ts
sha256: dae946049a59db8e121b59a5a07c14538017b2359a45f222966311f38891e0fc
lines: 258
profile: code
generator: subagent
raw_tokens_est: 2834
verified: 14 confirmed, 1 needs_agent
---

# core/pilot/horgony.ts

## Topics
- L1-80: Miért nem elég a lenyomatlánc, a horgony felvétele és az épségállapotok
- L81-171: epseg — az épség megítélése a napló és a horgony összevetéséből
- L172-230: FileHorgonyTar fájlalapú horgonytár és az adatvesztés-mérleg típusai
- L231-258: adatvesztesMerleg — kimondható-e, hogy nem veszett adat

## Claims

- [C1] [NEEDS_AGENT] a horgony a naplón KÍVÜL tárolt csúcsjelzés, mert a levágott véget maga a lánc nem mutatja ki @semantic L9-27
- [C2] [CONFIRMED] üres naplóból nem képződik horgony, `null`-t ad @L46 `if (!last) return null;`
- [C3] [CONFIRMED] a horgony az utolsó bejegyzés esetazonosítóját, sorszámát és lenyomatát rögzíti a kapott időbélyeggel @L47 `return { caseId: last.caseId, seq: last.seq, hash: last.hash, at };`
- [C4] [CONFIRMED] a horgony hiánya önálló állapot: az épség nem bizonyított, ami nem azonos az „ép"-pel @L64 `| "horgonyNelkul";`
- [C5] [CONFIRMED] a láncsérülés minden más vizsgálatot megelőz, ilyenkor a horgonyt fel sem teszi @L85 `if (!lanc.ok) {`
- [C6] [CONFIRMED] horgony nélkül a `bizonyitott` hamis, akkor is, ha a lánc ép @L94 `allapot: "horgonyNelkul", bizonyitott: false, hianyzo: 0, horgonyozatlan: 0, lanc,`
- [C7] [CONFIRMED] üres napló mellett létező horgonynál a hiányzó bejegyzések száma a horgony teljes sorszáma @L105 `allapot: "levagott", bizonyitott: false, hianyzo: h.seq, horgonyozatlan: 0, lanc,`
- [C8] [CONFIRMED] ha a napló a horgony előtt ér véget, a hiány a két sorszám különbsége @L113 `const hianyzo = h.seq - utolso.seq;`
- [C9] [CONFIRMED] a horgony sorszámán eltérő lenyomat elágazást jelent, nem hiányt @L125 `if (horgonyPont && horgonyPont.hash !== h.hash) {`
- [C10] [CONFIRMED] a horgonyon túlnyúló napló normális állapot, és bizonyítottnak számít @L139 `allapot: "elorefut", bizonyitott: true, hianyzo: 0, horgonyozatlan, lanc,`
- [C11] [CONFIRMED] a horgonytár szigorú mintával validálja az esetazonosítót, és ponttal kezdődő névnél kivételt dob @L177 `if (!/^[A-Za-z0-9._-]{1,120}$/.test(caseId) || caseId.startsWith(".")) {`
- [C12] [CONFIRMED] a `write` kivételt dob, ha a horgony visszafelé mozogna — nem írja felül a régebbi véget @L196 `if (meglevo && h.seq < meglevo.seq) {`
- [C13] [CONFIRMED] a `write` a hiányzó könyvtárat létrehozza, és egysoros JSON-t ír a fájlba @L203 `writeFileSync(f, JSON.stringify(h) + "\n", "utf8");`
- [C14] [CONFIRMED] a „romlott" halmaz a levágott, az elágazott és a láncsérült esetek összege @L239 `const romlott = levagott + elagazott + lancHiba;`
- [C15] [CONFIRMED] az adatvesztés-mentesség csak akkor mondható ki, ha van vizsgált eset, nincs romlott eset, és nincs horgony nélküli eset sem @L240 `const kimondhato = esetek.length > 0 && romlott === 0 && horgonyNelkul === 0;`
