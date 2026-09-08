---
source: docs/fejlesztes/26-forrasjegyzek.md
sha256: 6885165a4ce4dc02c9234405f49f7a662081a643a8cd7a7febf2995ffb3a1834
lines: 191
profile: prose
generator: subagent
raw_tokens_est: 3038
verified: 19 confirmed
---

# docs/fejlesztes/26-forrasjegyzek.md

## Topics
- L1-75: A források elszámolása: mi lett táblává, mi szabállyá, mi semmivé, mi hiányzik
- L76-107: A SNOMED licencből fakadó külön útja és a kétféle azonosító-ellenőrzés
- L108-133: Külső terminológiaszolgáltatás elutasítása és a kulcskezelés
- L134-191: A magyar SNOMED-megnevezés elutasítása, IHTSDO-átvétel, exportcsomag

## Claims

- [C1] [CONFIRMED] A forrásfájlok nem kerülnek a repóba, csak a származtatott tábla és a manifest lenyomata @L8 `A forrásfájlok **nem kerülnek a repóba**. Nyilvános, havonta-évente frissülő`
- [C2] [CONFIRMED] A BNO-törzsből a kereszt-csillag párosítás nem nyerhető ki, csak maga a jel @L22 `a kereszt-csillag párok listáját (a jel megvan, a párosítás nem) |`
- [C3] [CONFIRMED] Két forrást ember olvasott át szabállyá, mert a jogszabályszöveg gépi átalakítása megbízhatatlan @L36 `Két forrást **ember olvasott**`
- [C4] [CONFIRMED] A rekordkép eldöntötte a kódalak kérdését, nem csak valószínűsítette @L46 `A rekordkép a kódalak kérdését **eldöntötte**, nem valószínűsítette: a`
- [C5] [PENDING] A képként szkennelt finanszírozási oktatóanyagból semmi nem lett, mert egy OCR-hibás szabály rosszabb a hiányzónál @L59 `| `2_Egészségügy finanszírozása` (2017, 49 oldal) | **Képként szkennelt** oktatási anyag: szövegréteg nélkül. Karakterfelismerés nélkül nem kinyerhető, és egy OCR-hibás finanszírozási szabály rosszabb a hiányzónál. |`
- [C6] [CONFIRMED] A HBCS besorolási táblázat hiánya miatt a rendszer csoportot nem állapít meg, csak ismert csoporthoz ad súlyszámot @L72 `A rendszer HBCS-csoportot **nem állapít meg**.`
- [C7] [CONFIRMED] A SNOMED-tábla helyben települ egy gitignore-olt könyvtárba, és soha nem kerül a repóba @L83 `van: **helyben települ, és soha nem kerül a repóba**;`
- [C8] [CONFIRMED] A terjesztett könyvtárba került SNOMED-tábla build-hibát okoz @L86 `**build-hibát** ad, ha SNOMED-tábla kerül a`
- [C9] [CONFIRMED] A betöltött kiadás mind a 378 553 azonosítója átmegy a Verhoeff-alapú szerkezeti ellenőrzésen @L93 `A betöltött kiadás mind a 378 553`
- [C10] [CONFIRMED] A szerkezeti ellenőrzés nem fogta volna meg a HELLP-nek hitt 41633001-et, ami valójában az Intraocular pressure fogalom @L105 ` érvényes azonosító — csak nem a HELLP-é, hanem az *Intraocular`
- [C11] [CONFIRMED] A külső SNOMED-kereső szolgáltatás a fejlesztői környezetből nem érhető el a kimenő hálózati házirend miatt @L111 `fejlesztői környezetből **nem érhető el**: a kimenő hálózati házirend a`
- [C12] [CONFIRMED] A réteg ezért nem tartalmaz nem tesztelhető HTTP-klienst @L117 `Ezért a réteg **nem tartalmaz nem tesztelhető HTTP-klienst**. Egy olyan`
- [C13] [CONFIRMED] Az API-kulcsnak környezeti változóból kell jönnie, és soha nem kerülhet a repóba @L123 `2. a kulcs **környezeti változóból** jöjjön (`
- [C14] [CONFIRMED] Az egyszer megjelent API-kulcsot elveszettnek kell tekinteni és vissza kell vonni @L131 `> egyszer megjelent, azt **elveszettnek kell tekinteni**, és vissza kell vonni.`
- [C15] [CONFIRMED] Rögzített döntés: a rendszer SNOMED-azonosítót ajánl, magyar megnevezést nem @L139 `**A rendszer SNOMED-azonosítót ajánl, magyar megnevezést nem.**`
- [C16] [CONFIRMED] A hibás magyar megnevezés rosszabb az angolnál, mert az angol mellett a klinikus utánanéz @L147 `2. Egy hibás megnevezés **rosszabb az angolnál**: az angol mellett a klinikus`
- [C17] [CONFIRMED] A magyar SNOMED-fordítás az egyetlen nevesített hiányzó törzs @L158 `fogy. Addig ez az egyetlen nevesített hiányzó törzs — és tudatosan az.`
- [C18] [CONFIRMED] Az IHTSDO betöltő szkriptjeit szándékosan nem vették át, mert a rendszer nem adatbázisba tölt @L168 `Amit **nem** vettünk át: a betöltő szkriptek (MySQL, PostgreSQL, Neo4j,`
- [C19] [CONFIRMED] Az exportcsomagból egyetlen tétel marad ki, a helyi SNOMED-tábla @L183 `**Egyetlen tétel marad ki**, és nem ízlés kérdése: a`
- [C20] [CONFIRMED] A csomagolás leáll, ha betegadat-gyanús fájlnevet talál @L190 `A csomagolás **leáll**, ha betegadat-gyanús fájlnevet talál. Ez nem kihagyás:`
