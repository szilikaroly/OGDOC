---
source: core/crypto/envelope.ts
sha256: 10453806ec8554a2f54da3e3f99373584eb980fce04643b44ee04d23a72801a0
lines: 220
profile: code
generator: subagent
raw_tokens_est: 2478
verified: 16 confirmed
---

# core/crypto/envelope.ts

## Topics
- L1-84: A három tervezési döntés, determinisztikus sorosítás, lezárás, kudarctípusok
- L85-190: Felnyitás megnevezett kudarcokkal, adatkulcs burkolása és kibontása
- L191-220: Kriptográfiai törlés kapui és időzítésbiztos összehasonlítás

## Claims

- [C1] [CONFIRMED] A nonce 12 bájt, a GCM ajánlott mérete @L33 `const NONCE_BYTES = 12;      // GCM ajánlott mérete`
- [C2] [CONFIRMED] A determinisztikus sorosítás kihagyja az `undefined` értékű kulcsokat, és a kulcsokat rendezi @L44 `return "{" + Object.keys(o).filter((k) => o[k] !== undefined).sort()`
- [C3] [CONFIRMED] A `seal` kivételt dob, ha az adatkulcs nem 32 bájt @L58 `if (dek.length !== KEY_BYTES) {`
- [C4] [CONFIRMED] Minden lezárás friss véletlen nonce-t kap, nem sorszámból származtatottat @L61 `const nonce = randomBytes(NONCE_BYTES);`
- [C5] [CONFIRMED] A kötés nyíltan a rekordban marad, a hitelesítő címke mellett @L67 `tag: b64(c.getAuthTag()), aad,`
- [C6] [CONFIRMED] A felnyitás négy megnevezett kudarcot ad vissza kivétel helyett @L73 `| { ok: false; kind: "wrongKey" | "tampered" | "relocated" | "destroyed"; why: string };`
- [C7] [CONFIRMED] Megsemmisített kulcs vagy hiányzó adatkulcs esetén `destroyed` a válasz, minden más vizsgálat előtt @L88 `if (key.state === "destroyed" || dek === null) {`
- [C8] [CONFIRMED] A kötést a hitelesítő címke előtt vizsgálja, hogy az áthelyezett rekord megkülönböztethető legyen a módosítottól @L98 `if (stable(s.aad) !== stable(expect)) {`
- [C9] [CONFIRMED] A GCM bukását a kulcsazonosítók egyezése sorolja `wrongKey` vagy `tampered` közé @L115 `const mismatched = key.keyId !== s.keyId;`
- [C10] [CONFIRMED] Az adatkulcs burkolása ugyanazzal a `seal`-lel történik, rögzített „kek” kötéssel, ahol a `prevHash` a kulcsazonosító @L143 `{ caseId: "kek", seq: 0, prevHash: keyId, formatVersion: 1 }) };`
- [C11] [CONFIRMED] Az `unwrapDek` sikertelen felnyitásnál `null`-t ad, nem dob kivételt @L149 `return r.ok ? un64(r.value) : null;`
- [C12] [CONFIRMED] Az új adatkulcs 32 bájt véletlen @L152 `export function newDek(): Buffer { return randomBytes(KEY_BYTES); }`
- [C13] [CONFIRMED] Elrendelő vagy indoklás nélkül a kulcs megsemmisítése nem hajtható végre @L193 `if (!order.actor?.trim() || !order.reason?.trim()) {`
- [C14] [CONFIRMED] Amíg akár egy meg nem semmisített kulcsmásolat is van, a törlés sikertelen @L198 `if (remaining.length) {`
- [C15] [CONFIRMED] Sikeres törlésnél új kulcshivatkozás készül `destroyed` állapottal — a bemeneti objektum nem mutálódik @L207 `key: { ...key, state: "destroyed", destroyedAt: order.at,`
- [C16] [CONFIRMED] Az `equalSecret` eltérő hossznál rövidre zár, egyébként időzítésbiztosan hasonlít @L219 `return a.length === b.length && timingSafeEqual(a, b);`
