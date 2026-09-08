---
source: core/store/biztonsagos.ts
sha256: d2b5738a93fc6f81d19e8e3a3527f23543e74ab4eeedad55ef296cf835c3480f
lines: 556
profile: code
generator: subagent
raw_tokens_est: 6124
verified: 21 confirmed, 5 needs_agent
---

# core/store/biztonsagos.ts

## Topics
- L1-57: a réteg négy szabálya, kapcsolódó modulok, a tárolt alak indoklása
- L58-193: StoredEntry, determinisztikus sorosítás, archívum- és kulcstár-szerződés, eredmény- és beállítástípusok
- L194-353: a SecureCaseStore, az auditsor kiírása, elutasítás, a lánc betöltése és az olvasás
- L354-513: írás, kriptográfiai törlés, archívum-ellenőrzés
- L514-522: mit NEM ad meg a rejtjelezett lánc
- L523-556: a `verifySealedChain` kulcs nélküli épség-ellenőrzés

## Claims

- [C1] [NEEDS_AGENT] Négy szabály kényszerül ki itt, köztük hogy sikertelen auditnapló-írás esetén a művelet bukik el, és adat nem megy ki @semantic L13-23
- [C2] [NEEDS_AGENT] A réteg szándékosan nem hitelesít: a „ki vagy te” kérdést a gazda válaszolja meg @semantic L25-29
- [C3] [NEEDS_AGENT] A lánc-metaadat nyílt, a tartalom lezárt, hogy az archívum épsége a lelet elolvasása nélkül is bizonyítható legyen @semantic L45-56
- [C4] [CONFIRMED] Minden tárolt bejegyzés két láncot visel: a nyílt tartalomét és a rejtjelezett alakét @L80 `sealedHash: string;`
- [C5] [CONFIRMED] A `stable` sorosítás a kulcsokat rendezi és a definiálatlan mezőket kihagyja, hogy a kulcssorrend ne törje el a láncot @L88 `return "{" + Object.keys(o).filter((k) => o[k] !== undefined).sort()`
- [C6] [CONFIRMED] A rejtjelezett láncszem SHA-256 lenyomat, az archívum-formátumverzióval, az előző lenyomattal és a sorszámmal címkézve @L96 `return createHash("sha256")`
- [C7] [CONFIRMED] A memóriabeli archívum mindig `buffered` tartósságot jelent, sosem mondja, hogy mentve @L125 `return "buffered";        // memória: a „mentve” szót nem mondhatja ki`
- [C8] [CONFIRMED] A kulcstárban a `null` adatkulcs nem hiba, hanem a megsemmisült kulcs jelzése @L136 `dek(caseId: string): { dek: Buffer | null; key: KeyRef };`
- [C9] [CONFIRMED] A kudarcnak három megnevezett fajtája van, mert mindháromnál más a teendő @L156 `| { ok: false; kind: "denied" | "corrupt" | "unreadable"; why: string };`
- [C10] [CONFIRMED] Hiányos auditsor esetén az `emit` kivételt dob, és a művelet nem folytatódik @L213 `throw new Error(`
- [C11] [CONFIRMED] Az elutasítás maga is auditsort ír, `denied` művelettel és az elutasítás okával @L227 `action: "denied", caseId, basis: "elutasított hozzáférési kísérlet",`
- [C12] [CONFIRMED] A lánc betöltése a rejtjelezett lánc ellenőrzésével kezdődik, felnyitás előtt @L260 `const arc = verifySealedChain(stored, caseId);`
- [C13] [CONFIRMED] A napló levágott végét egyedül a külső horgony fogja meg, és ilyenkor `corrupt` hibát ad @L267 `if (horgony && stored[stored.length - 1].seq < horgony.seq) {`
- [C14] [CONFIRMED] A sikertelen felnyitás `unreadable` hibát ad, nem `corrupt`-ot @L313 `if (!r.ok) return { ok: false, kind: "unreadable", why: r.why };`
- [C15] [CONFIRMED] Olvasáskor az auditsor az adat előtt íródik ki, hogy naplózási hiba esetén adat ne menjen ki @L334 `// AUDIT ELŐBB, ADAT UTÁNA. Ha a naplózás elbukik, adat nem megy ki.`
- [C16] [NEEDS_AGENT] Az írás a jogosultság után a meglévő lánc ellenőrzésével folytatódik, és sérült láncra nem fűz hozzá @semantic L360-365
- [C17] [CONFIRMED] Megsemmisült kulcsú esethez nem lehet hozzáírni, a válasz `unreadable` @L380 `if (dek === null) {`
- [C18] [CONFIRMED] Az új rejtjelezett láncszem az archívum utolsó `sealedHash` értékéből folytatódik, üres archívumnál a GENESIS-ből @L389 `let prevSealed = existing.length ? existing[existing.length - 1].sealedHash : GENESIS;`
- [C19] [CONFIRMED] A horgony a tartós írás UTÁN íródik, és a hibája hangos hibanaplót kap, de nem buktatja el az írást @L422 `if (h) this.o.horgony.write(h);`
- [C20] [CONFIRMED] Megsemmisítést nem támogató kulcstár mellett a kriptográfiai törlés `unreadable` hibával elutasít @L461 `if (!this.o.keys.destroy) {`
- [C21] [CONFIRMED] Az archívum-ellenőrzés nem kér olvasási jogosultságot, és tartalmat nem ad vissza @L494 `async verifyArchive(caseId: string): Promise<{ ok: boolean; entries: number; why: string }> {`
- [C22] [NEEDS_AGENT] A rejtjelezett lánc nem kulccsal hitelesített: a romlást és a naiv hamisítást fogja meg, a felkészült támadót nem — az ellen az AEAD-címke véd @semantic L516-521
- [C23] [CONFIRMED] Üres archívum érvényes állapot, az ellenőrzés sikerrel tér vissza @L526 `if (!stored.length) {`
- [C24] [CONFIRMED] A sorszámnak a tömbbeli pozícióval kell egyeznie, egytől számozva @L533 `if (s.seq !== i + 1) {`
- [C25] [CONFIRMED] A láncszemek illeszkedését a `prevSealedHash` és az előző lenyomat egyezése adja @L538 `if (s.prevSealedHash !== prev) {`
- [C26] [CONFIRMED] A tartalom megváltozását a lenyomat újraszámolása fogja meg, kulcs és visszafejtés nélkül @L544 `if (!s.sealed || sealedHash(prev, s.seq, s.sealed) !== s.sealedHash) {`
