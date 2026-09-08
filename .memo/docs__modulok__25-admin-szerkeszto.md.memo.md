---
source: docs/modulok/25-admin-szerkeszto.md
sha256: a0dc4682910898f975d77acd99119b557684cedff8f0db8c5454956fe786c88e
lines: 201
profile: prose
generator: subagent
raw_tokens_est: 2777
verified: 10 confirmed
---

# docs/modulok/25-admin-szerkeszto.md

## Topics
- L1-148: Jogosultsági rétegek és szerepkészlet, BUG-015, a belső szerkesztő tilalmai és változáskezelése
- L149-201: Rendszeradminisztráció, keresztfeltöltés, elfogadási kritériumok, nyitott kérdések

## Claims

- [C1] [CONFIRMED] A regiszter-szerkesztő hiányzik: ma a klinikus fejlesztő nélkül nem tud változót, kódlistát, űrlapot, szabályt vagy kérdőívet módosítani @L27 `**Nincs meg:** a **regiszter-szerkesztő** — vagyis az, hogy klinikus tudjon változót,`
- [C2] [CONFIRMED] Az összeférhetetlen szerepkör-párok a rendszerben vannak kikényszerítve, nem szabályzatban: egy felhasználóra nem adhatók ki együtt @L80 `egy felhasználón **nem adható ki**`
- [C3] [CONFIRMED] BUG-015: ma az új tenant első felhasználója bárki lehet, aki insert-elni tud, és ez a Fázis 0 blokkolója; helyette meghívó-alapú, auditált folyamat jön @L86 `lehet**, aki insert-elni tud. Ez a Fázis 0 blokkolója.`
- [C4] [CONFIRMED] A score-képlet nem szerkeszthető a felületről: kódban él, golden-tesztekkel, és módosítása klinikai validációt kíván @L119 `kód, golden-tesztekkel; egy képlet módosítása **klinikai validációt** kíván`
- [C5] [CONFIRMED] Klinikai tartalom szerkesztésénél négyszemközti elv érvényes: aki szerkesztette, nem hagyhatja jóvá @L138 `| **Jóváhagyás** | klinikai tartalomnál **négyszemközti elv**: aki szerkesztette, nem hagyhatja jóvá |`
- [C6] [CONFIRMED] A régi adat a rögzítéskor hatályos definícióval értelmezhető, verziózott regiszteren keresztül @L141 `a régi adat a **rögzítéskor hatályos** definícióval értelmezhető`
- [C7] [CONFIRMED] Egy változó módosítása azonnal hat az űrlapra, a validációra, a dokumentációra, a lekérdezőre és az exportra @L170 `hat az űrlapra, a validációra, a dokumentációra, a lekérdezőre és az exportra.`
- [C8] [CONFIRMED] Javaslat: külön klinikai admin szerep, szűk körben, minden változás négyszemközti jóváhagyással @L193 `szerep, szűk körben, és minden változás`
- [C9] [CONFIRMED] Javaslat: a szabály-szerkesztő kezdetben csak `requiredWhen`-t és kódajánlási feltételeket enged, a teendő-kiváltók fejlesztői hatáskörben maradnak @L197 `feltételek, a teendő-kiváltók fejlesztői hatáskörben.`
- [C10] [CONFIRMED] MDR-megfelelőségértékelés esetén a felületről szerkeszthető klinikai tartalom változáskezelési kérdéssé válik, ami szűkítheti a szerkeszthetőséget @L199 `szerkeszthető klinikai tartalom **változáskezelési kérdéssé** válik: mi minősül`
