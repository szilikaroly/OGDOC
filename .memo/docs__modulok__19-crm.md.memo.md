---
source: docs/modulok/19-crm.md
sha256: b94fc0b9f75523b729cc500369e181f2ab7bbb2401818542a9567d5e0bc34dda
lines: 240
profile: prose
generator: subagent
raw_tokens_est: 3101
verified: 15 confirmed
---

# docs/modulok/19-crm.md

## Topics
- L1-34: A modul mint meglévő IntuiCare-platform, HR- és karakterlap-táblák
- L35-185: Munkaidő és jogi megfeleltetés, beosztás, szabadság, műtő, időpont, üzenetek, jogosultság
- L186-240: Kérdőív-infrastruktúra, keresztfeltöltés, audit-alapú elfogadás, nyitott kérdések

## Claims

- [C1] [CONFIRMED] A 19 modul közül ez az egyetlen, ami nem terv, hanem meglévő, működő rendszer @L13 `A 19 modul közül ez az egyetlen, ami **nem terv, hanem meglévő rendszer**.`
- [C2] [CONFIRMED] Az OGDOC feladata itt az átvétel, auditálás és a klinikai modulokhoz kötés, nem az újraírás @L17 `Az OGDOC feladata itt: **átvenni, auditálni, és a klinikai modulokhoz kötni** — nem újraírni.`
- [C3] [CONFIRMED] A modul a 0–1. fázisban átvétel és kiegészítés, nem építés @L8 `| **Fázis** | 0–1 (átvétel és kiegészítés, nem építés) |`
- [C4] [CONFIRMED] Az Mt. 134. § szerinti munkaidő-nyilvántartást a work_time_ledger tábla és a wtl_compute_savs_fn trigger valósítja meg @L53 `Mt. 134. § (munkaidő-nyilvántartás)`
- [C5] [CONFIRMED] Az Eütev. 12/A–12/G. § munkaidőkorlátai a beosztómotorban kemény constraintként vannak kikényszerítve @L55 `Eütev. 12/A–12/G. § (heti 48/60/72, napi 12/24, 416 h, 11 h pihenő)`
- [C6] [CONFIRMED] Az automatikus beosztás magyarázatot ad arról, miért kapta valaki azt a műszakot — ugyanaz a visszavezethetőségi elv, mint a klinikai oldalon @L82 `arról, miért kapta valaki azt a műszakot.`
- [C7] [CONFIRMED] A műtőfoglalás és erőforrás-tervezés készen van; a 11. modul csak a klinikai tartalmat adja hozzá @L120 `> **Ez a 11. modul (műtő) infrastruktúrája.** A 11. modul a *klinikai* tartalmat adja hozzá`
- [C8] [CONFIRMED] A foglalási kód Crockford base32, rejection samplinggel generált, és RNG-teszt kíséri @L140 `nélkül, rejection sampling) — RNG-tesztel együtt.`
- [C9] [CONFIRMED] A jogosultsági modell szerveroldali és RLS-sel kikényszerített, nem felületszűrés @L182 `> tudott adni.** Itt szerveroldali, RLS-sel kikényszerített — nem felületszűrés.`
- [C10] [CONFIRMED] A kritikus tétel indexe és küszöbe az EPDS Q10-szabályt valósítja meg: egyetlen tétel az összpontszámtól függetlenül vörös zászlót ad @L200 `tétel önálló vörös zászlót ad az összpontszámtól függetlenül.`
- [C11] [CONFIRMED] A kérdőív-infrastruktúra a 8. és a 16. modul teljes alapja; az ICHOM 108 PROM-tétele ide adatként kerül be @L203 `Ez a 8. és a 16. modul teljes infrastruktúrája. **Az ICHOM 108 PROM-tétele ide adatként kerül be.**`
- [C12] [CONFIRMED] A modul nem fejlesztendő, hanem auditálandó @L222 `A modul **nem fejlesztendő, hanem auditálandó**.`
- [C13] [CONFIRMED] KAPU: a BUG-015 tenant-bootstrap hiba javításáig kutatási adatgyűjtés nem indulhat el @L226 `kutatási adatgyűjtés ezen a hibán nem indulhat el.`
- [C14] [CONFIRMED] A BUG-009 (P0) javítása a 15. modul alapja @L227 `motorban javítva — ez a 15. modul alapja.`
- [C15] [CONFIRMED] A CRM-oldal 10 nyelvű, a klinikai modulok HU+EN-nel indulnak, és ezt a nyelvi eltérést a felületen jelezni kell @L239 `lefedettsége eltér — ezt a felületen jelezni kell**, nehogy a felhasználó azt higgye, a`
