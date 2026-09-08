---
source: docs/megfeleles/12-eeszt.md
sha256: 06859e9d269a87d669215c7c8e7b79795bc40d8b6ff53328f3263057c44284b3
lines: 288
profile: prose
generator: subagent
raw_tokens_est: 3887
verified: no claims
---

# docs/megfeleles/12-eeszt.md

## Topics
- L1-147: a K11/K20/K26 döntések, a tizenhárom dokumentumtípus, lezárási kapuk, megőrzési idők
- L148-210: az ellenőrzöttség három fokozata, csatlakozás és azonosítás, az öt adatszolgáltatási irány, rendelkezés-tisztelet
- L211-237: a meglévő FHIR-alap és adapterminta, a rögzítő adapter szerepe
- L238-288: a megépítendő feladatok, a törlés és megőrzés ütközése, elfogadási kritériumok, K27

## Claims

- [C1] A K11 döntés szerint a rendszer ellátási dokumentációt keletkeztet, és megtervezzük az EESZT-megfelelést @L3 `> **Döntés (K11): a rendszer ellátási dokumentációt keletkeztet, és megtervezzük az`
- [C2] A K20 és K26 döntéssel tizenhárom dokumentumtípus minősül ellátási dokumentációnak @L6 `> **Döntés (K20 + K26): tizenhárom dokumentumtípus** minősül ellátási dokumentációnak.`
- [C3] A build elszáll, ha egy dokumentum nem létező regiszterbeli mezőt vár @L35 `hivatkozik, ezért **a build elszáll, ha egy dokumentum nem létező mezőt vár** — a hiány nem`
- [C4] Sürgős császármetszésnél nincs előzetes műtéti terv, ezért a hiánya nem tagadhatja meg a műtéti leírás rögzítését @L90 `**Sürgős császármetszésnél nincs előzetes műtéti terv** — és ettől a műtéti leírás`
- [C5] A WHO checklist kitöltetlensége viszont blokkolja a műtéti leírás lezárását @L96 `> kitöltetlensége **blokkolja** a műtéti leírás lezárását — mert az a betegbiztonságot`
- [C6] A képalkotó felvétel maga nem megy az EESZT-be, csak a lelet, és más a megőrzési ideje @L129 `> dokumentumtípusként** — más a megőrzése, más a tárolóhelye (PACS), és **maga a felvétel`
- [C7] Amíg az elsődleges jogszabályszöveggel való összevetés hiányzik, automatikus törlés nem indul @L160 `hátravan. **Amíg ez nincs meg, automatikus törlés nem indul.**`
- [C8] Minden beküldött eseményen szerepelnie kell az orvos ágazati azonosítójának @L177 `az orvos ágazati azonosítója minden beküldött eseményen`
- [C9] A más intézményből lekérdezett lelet előtöltési javaslat, nem automatikusan elfogadott érték @L190 `A visszafelé irány a legértékesebb és a legkönnyebben elhanyagolt: **egy más intézményből`
- [C10] A rendelkezés-tisztelet beépített viselkedés: a tiltás nem kerülhető meg egyszeri lekérdezéssel és eltárolással @L198 `felület kérdése, hanem beépített viselkedés**: ha a rendelkezés tiltja a hozzáférést, a`
- [C11] A sürgősségi hozzáférés külön esemény, külön indoklással és naplózással @L206 `- **A sürgősségi hozzáférés külön esemény.** Ha a rendelkezés megkerülhető sürgős`
- [C12] A K7 döntés miatt minden adat már FHIR-alakon megy ki, ezért az EESZT csak egy további adapter @L213 `Az architektúra szerencsés helyzetben van: **a K7 interoperabilitási döntés miatt már`
- [C13] A v16 tizenhárom beágyazott EESZT-kódtörzse nagyjából 13 000 tételt tartalmaz @L230 `A v16 13 beágyazott EESZT-kódtörzse (~13 000 tétel)`
- [C14] A rögzítő adapter valós üzeneteket állít elő fájlba, így a fejlesztés nem vár a csatlakozás engedélyezésére @L233 `hónapokban mérhető, a fejlesztés viszont nem várhat rá. A rögzítő adapter a valós üzeneteket`
- [C15] Az ellátási dokumentáció jogszabályi megőrzési ideje elsőbbséget élvez a törlési kérelemmel szemben @L250 `**A 7. tétel ütközik a GDPR-törléssel, és ezt ki kell mondani**: az ellátási dokumentáció`
- [C16] A visszavonási folyamat kétágú: a kutatási felhasználás megszűnik, az ellátási dokumentáció marad @L253 `visszavonási folyamata ezért **kétágú**:`
- [C17] Elfogadási kritérium, hogy rendelkezéssel tiltott adat ne legyen lekérdezhető @L272 `3. **Rendelkezéssel tiltott adat nem kérdezhető le**, és a sürgősségi hozzáférés külön`
- [C18] Elfogadási kritérium, hogy a beküldött üzenetből visszakereshető legyen, melyik változó melyik értéke került bele @L276 `5. A beküldött üzenetből visszakereshető, **melyik változó melyik értéke** került bele.`
- [C19] A K27 nyitott tétel a megőrzési idők visszaellenőrzése, ami nélkül a rendszer nem töröl @L285 `**K27 — A megőrzési idők visszaellenőrzése.**`
- [C20] Amíg a jogi megerősítés hiányzik, adat nem vész el — ez biztonságos, de hosszú távon nem tartható @L287 `ettől kezdve az automatikus törlés működik. **Amíg ez nincs meg, adat nem vész el** — ami a`
