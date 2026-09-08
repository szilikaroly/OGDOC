---
source: docs/fejlesztes/23-prom.md
sha256: 21b6c2ce7f04bd2bd6536bfe9380ffb8bef4a77c5717871689319d9c7869962e
lines: 140
profile: prose
generator: subagent
raw_tokens_est: 1665
verified: 12 confirmed
---

# docs/fejlesztes/23-prom.md

## Topics
- L1-7: A modul tétele: nem a tételek, hanem a három védőszabály a lényeg
- L8-57: A beteg-eredet kapuja, a klinikusi megjegyzés helye, az EPDS-tükör
- L58-140: Licenc és fordítás két tengelye, EQ-5D index hiánya, elégedettségi tételek

## Claims

- [C1] [CONFIRMED] Az ICHOM 108 PROM-tétele adatbevitel, nem fejlesztés @L4 `108 PROM-tétele adatbevitel, nem fejlesztés. A tétel igaz — és épp ezért ez a`
- [C2] [CONFIRMED] A provenanceAllowed mező addig kikényszerítetlen díszítés volt a típusban; a PROM tette kapuvá @L11 `mező eddig ott állt a típusban, és **senki nem`
- [C3] [CONFIRMED] PROM-mező klinikusi eredettel nem írható, csak beteg-eredettel @L16 `// Error: prom.eq5d.mobility: „clinician" eredettel nem írható — csak patient.`
- [C4] [CONFIRMED] A klinikusi megjegyzés csak olyan eszközhöz rögzíthető, ami a névsorban szerepel @L34 `A megjegyzés csak olyan eszközhöz rögzíthető, ami a **névsorban** szerepel —`
- [C5] [CONFIRMED] Build-hiba a patient eredet nélküli vagy clinician eredetet megengedő prom-változó; két kivétel van @L38 `eredettel megengedve, **build-hiba**. Két kivétel van, és`
- [C6] [CONFIRMED] A két modul EPDS-e aliasOf-fal ugyanaz a változó, így egy érték áll a rekordban @L48 `REG.get("prom.mh.epds.total").aliasOf     // "psy.epds.total"`
- [C7] [CONFIRMED] A tételszöveg licence azt dönti el, hogy az eszköz felvehető-e @L69 `- **a tételszöveg licence** eldönti, hogy az eszköz **felvehető-e**. Egy`
- [C8] [CONFIRMED] A fordítás validáltsága ettől függetlenül azt dönti el, hogy a gyűjtött adat publikálható-e @L72 `- **a fordítás validáltsága** eldönti, hogy a vele gyűjtött adat`
- [C9] [CONFIRMED] A 42. napos készlet mind a hat eszköze licenc-kapu mögött van, és ez beszerzési, nem fejlesztési feladat @L78 `// "6 eszköz LICENC-KAPU mögött van a 6-ból: a validált tételszöveg nincs`
- [C10] [CONFIRMED] Az EQ-5D index nem készül el, mert országspecifikus, licencelt értékkészletet kívánna @L95 `EQ-5D-5L indexhez **országspecifikus, licencelt értékkészlet** kell, és egy`
- [C11] [CONFIRMED] A WHODAS-nál az egyszerű összegzést számolja a rendszer, nem a hivatalos IRT-pontozást @L110 `pontozás **más számot ad**. A rendszer az egyszerűt számolja, és ezt kimondja`
- [C12] [CONFIRMED] A modult 24 teszt fedi a test/prom.test.ts fájlban @L131 `(../../test/prom.test.ts) — 24 teszt:`
