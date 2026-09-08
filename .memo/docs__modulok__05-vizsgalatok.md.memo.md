---
source: docs/modulok/05-vizsgalatok.md
sha256: 9ad3c77a6053f762510bed196e08a560b9f96df15726bef8ef56224a8edb18f6
lines: 321
profile: prose
generator: subagent
raw_tokens_est: 4111
verified: 9 confirmed
---

# docs/modulok/05-vizsgalatok.md

## Topics
- L1-152: Labor-alszekció referenciákkal és kritikus küszöbökkel, EKG-modul és a kép-alapú felismerés
- L153-309: Emberi felügyelet, DICOM-tárolás, ultrahang, képalkotás, szűrések, elfogadási kritérium
- L310-321: Nyitott kérdések: mikrobiom, `ekg.xlsx` értékkészletek, labor-referenciák forrása

## Claims

- [C1] [CONFIRMED] Mind az öt alszekcióban a lelet strukturált mezőkből áll, a `narrative` csak kiegészítés @L11 `Öt alszekció, saját belső szerkezettel. Mindegyikre igaz: a **lelet nem szabad szöveg**.`
- [C2] [CONFIRMED] A trimeszterre bontott terhességi labor-referencia hiányzik a v16-ból, és klinikailag jelentős @L52 `**A trimeszterre bontott terhességi referencia a v16-ból hiányzik, és klinikailag jelentős.**`
- [C3] [PENDING] 80 alatti thrombocytaszám a neuraxiális anesztézia kontraindikációja @L62 `| `lab.plt` | < 80 | **neuraxiális anesztézia kontraindikáció** |`
- [C4] [CONFIRMED] Az EKG-modul a v16-ban kész és visszaellenőrzött, az OGDOC-ba portolás megy, nem fejlesztés @L90 `OGDOC-ba **portolás** megy, nem fejlesztés.`
- [C5] [CONFIRMED] A kép-alapú EKG-felismerés nem értékel: a digitalizált mérési értékeket a meglévő 296-képletes motornak adja át @L138 `**A 6. lépés a lényeg:** a felismerés **nem értékel**. A digitalizált mérési értékeket adja`
- [C6] [CONFIRMED] A rácsdetektálás hibája minden értéket arányosan elront, ezért nem feltűnő — ez a kalibrálás kockázata @L144 `A rácsdetektálásból jön a papírsebesség (mm/s) és az érzékenység (mm/mV). **Ha ez téved,`
- [C7] [PENDING] A gépi EKG-olvasat javaslat marad, `provenance: "derived"` és `confidence` értékkel @L157 `| A gépi olvasat **javaslat**, `provenance: "derived"`, `confidence` értékkel | AI-rendelet: emberi felügyelet |`
- [C8] [PENDING] Klinikusi megerősítés nélkül egyetlen felismert érték sem kerül a `clinical_observations`-be @L198 `3. A klinikusi megerősítés **nélkül** egyetlen érték sem kerül a `clinical_observations`-be.`
- [C9] [PENDING] Az `us.efw` a Hadlock-4 képlettel számol (BPD/HC/AC/FL) @L240 `| `us.efw` | Hadlock-4 (BPD/HC/AC/FL) |`
- [C10] [CONFIRMED] Terhesnél sugárterheléses vizsgálat kérése megerősítő párbeszédet vált ki, nem tiltást @L270 `Terhes betegnél sugárterheléses vizsgálat kérésekor **megerősítő párbeszéd**, az IPRACS`
- [C11] [CONFIRMED] A szűrésmodul esedékességet számol életkorból, rizikófaktorokból és korábbi dátumokból, `computed` levezetéssel @L290 `**A modul esedékességet számol**, nem csak rögzít: a beteg életkorából, rizikófaktoraiból és a`
- [C12] [PENDING] Az elfogadási kritériumot teszt kényszeríti ki: `test/modul05-elfogadas.test.ts` @L307 `> **Ez teszt, nem ígéret:** [`test/modul05-elfogadas.test.ts`](../../test/modul05-elfogadas.test.ts).`
- [C13] [CONFIRMED] A mikrobiom-alszekció rögzít és exportál, de nem javasol — nincs klinikai konszenzus @L313 `terápiás következményeiről; a modul rögzít és exportál, de **nem javasol**.`
- [C14] [CONFIRMED] A trimeszter-referenciák forrása eldőlt: Abbassi-Ghanavati és mtsai, Obstet Gynecol 2009 @L317 `Abbassi-Ghanavati és mtsai, Obstet Gynecol 2009;114:1326-1331. A készlet a`
- [C15] [PENDING] A referenciakészlet `verification: "assumed"` szinten áll, az elsődleges táblával még nincs összevetve @L318 `regiszterben `verification: "assumed"` szinten áll — a számok az elsődleges`
