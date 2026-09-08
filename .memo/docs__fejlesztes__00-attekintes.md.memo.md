---
source: docs/fejlesztes/00-attekintes.md
sha256: 37360f14e7b77e50cb80ff6d4590ebcf0ea851c09b42024366ea9a2205a1430b
lines: 145
profile: prose
generator: subagent
raw_tokens_est: 4048
verified: 15 confirmed
---

# docs/fejlesztes/00-attekintes.md

## Topics
- L1-5: Kinek szól a fejlesztői dokumentumfa és mit tartalmaz
- L6-67: Az 57 fejlesztői dokumentum táblája, mire ad választ mindegyik
- L68-119: A regiszter mint egyetlen igazság, és a hat kikényszerített tiltás
- L120-145: Kézzel írt állapottábla rétegenként, számfigyelmeztetéssel

## Claims

- [C1] [CONFIRMED] A fa a fejlesztőnek szól: a „mit és miért" a `docs/` gyökerében van, itt a „hogyan" mezőnként és függvényenként @L3 `Ez a fa a **fejlesztőnek** szól, nem a döntéshozónak.`
- [C2] [CONFIRMED] A kalkulátor-dokumentum (`07-kalkulatorok.md`) generált, nem kézzel karbantartott @L16 `| Minden képlet tételesen: bemenet, sáv, forrás, állapot | **igen** |`
- [C3] [CONFIRMED] A lefedettségi dokumentum (`11-lefedettseg.md`) is generált, modulonkénti feltöltési állással @L20 `| **A katalógus feltöltésének állása** modulonként, és a feltöltés sorrendje | **igen** |`
- [C4] [CONFIRMED] A meglévő forrásrendszer mértéke 265 publikált normogram-görbe, 52 felületi szakasz és 302 mező @L37 `265 publikált normogram-görbe, 52 felületi szakasz, 302 mező`
- [C5] [CONFIRMED] A HBCS besorolási tábla a rendeletből 773 csoportot tartalmaz @L44 `773 csoport, a szabálynyelv értelmezése`
- [C6] [CONFIRMED] A 326 szabályból 38 lett döntéssé téve @L45 `**A 326 szabály döntéssé tétele**: 38 szabály`
- [C7] [CONFIRMED] A riasztási rendszerben 324 riasztási pont áll szemben 0 címzettel @L62 `324 riasztási pont, 0 címzett`
- [C8] [CONFIRMED] A regiszter nem a kód melletti konfigurációs fájl, hanem az egyetlen igazság, amiből a rendszer épül @L70 `**A regiszter az egyetlen igazság.** Nem konfigurációs fájl a kód mellett`
- [C9] [CONFIRMED] Vezérelv: ha egy új változó felvételéhez kódot kell írni, az hibát jelez a felépítésben @L90 `> **Ha egy új változó felvételéhez kódot kell írni, valamit rosszul csináltunk.**`
- [C10] [CONFIRMED] A webes `app.js` egyetlen mezőnevet, egységet, tartományt vagy kódlistát sem tartalmaz, mégis a teljes űrlapot rendereli @L93 `tartományt vagy kódlistát sem tartalmaz**, mégis a teljes űrlapot rendereli,`
- [C11] [CONFIRMED] Ütközés esetén a hat tiltás nyer a dokumentáció bármely más állításával szemben @L108 `Ez a hat tiltás végigfut az egész dokumentáción. Ha valahol ellentmondást`
- [C12] [PENDING] Az ellenőrizetlen együttható tiltását a `runCalc` kényszeríti ki, mert a fullPIERS fordítva viselkedett @L114 `| **Nincs ellenőrizetlen együttható** | `runCalc` | A fullPIERS fordítva viselkedett; kapu nélkül számot mutatott volna. |`
- [C13] [PENDING] Az `effectiveFinding` tiltja a nem vizsgáltról szóló állítást: a nem rögzített lelet nem azonos a normálisnak találttal @L117 `| **Nincs állítás arról, amit nem vizsgáltak** | `effectiveFinding` | A nem rögzített lelet nem ugyanaz, mint a normálisnak talált. |`
- [C14] [CONFIRMED] Az állapottábla számai kézzel írtak és egyszer már hazudtak; az élő számokat a generált `../14-allapot.md` adja @L122 `> **A SZÁMOK ITT NEM A FORRÁS.** Ez a tábla kézzel írt, és egyszer már`
- [C15] [CONFIRMED] 43 kalkulátor van definiálva, ebből 7 kapu mögött van ellenőrizetlen konstans miatt @L132 `| Kalkulátorok | **43** definiálva, ebből **7 kapu mögött** (ellenőrizetlen konstans) |`
- [C16] [CONFIRMED] A regiszterben 872 változó van a tervezett ~4035-ből, modulonkénti fájlokban @L133 `| Változók | **872** a regiszterben a tervezett ~4035-ből, modulonkénti fájlokban |`
- [C17] [PENDING] A hitelesítés hiánya a rendszer egyetlen igazi blokkolója: a kiszolgáló `OGDOC_SYNTHETIC=1` nélkül el sem indul @L141 `| Hitelesítés | **nincs** — és ez a rendszer egyetlen igazi blokkolója: a kiszolgáló `OGDOC_SYNTHETIC=1` nélkül el sem indul |`
- [C18] [CONFIRMED] Az EESZT-dosszié kész, de az éles csatlakozás a hitelesítés hiánya miatt zárva van @L142 `**éles csatlakozás zárva** — a hitelesítés hiánya miatt`
