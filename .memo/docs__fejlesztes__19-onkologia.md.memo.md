---
source: docs/fejlesztes/19-onkologia.md
sha256: 453dbd2123c12f8f93a58f4d0c900d71e5703ce2a947f69631abe35d61c1836b
lines: 195
profile: prose
generator: subagent
raw_tokens_est: 2233
verified: 12 confirmed
---

# docs/fejlesztes/19-onkologia.md

## Topics
- L1-7: A fejezet két témája: verziózott kódlista és a döntéshozatal kapuja
- L8-157: Verziózott kódolvasás, megosztott döntés kapuja, modalitások trimeszterenként
- L158-195: Fertilitásmegőrzés, VUS-kezelés, a modulból hiányzó részek, tesztek

## Claims

- [C1] [CONFIRMED] A verziózott kódlista magbeli hiányosság volt, ami véletlenül ebben a modulban bukott ki @L4 `> **verziózott kódlista** a magba tartozó hiányosság volt, ami véletlenül itt`
- [C2] [CONFIRMED] A readCode jelzi, ha a kód ma is létezik, de mást jelent, mint rögzítéskor @L30 `//   retired: false, meaningChanged: true,`
- [C3] [CONFIRMED] A megszűnt kód érvényes marad a saját verziója szerint, de a rendszer nem konvertálja a mai listára @L52 `attól még **érvényes** — csak nem konvertálható. A rendszer ezért nem`
- [C4] [CONFIRMED] Az olvasás a rögzítéskori listából történik, írni viszont kizárólag a jelenlegi verzióból lehet @L61 `| **Írás** | kizárólag a jelenlegiből |`
- [C5] [CONFIRMED] A megosztott döntéshozatal kapuja csak akkor nyílik, ha a pipa és a felkínált lehetőségek felsorolása is megvan @L98 `A kapu csak akkor nyílik, ha **mindkettő** megvan:`
- [C6] [CONFIRMED] Gesztációs kor nélkül minden modalitás unknown, mert a válasz trimeszterenként az ellenkezőjére fordul @L141 `trimeszterenként **az ellenkezőjére fordul**: ami a 8. héten kontraindikált, az`
- [C7] [CONFIRMED] Az immunterápia indoklása kimondja, hogy az adathiány nem jelent biztonságosságot @L147 `adathiány NEM biztonságosságot jelent."* A megkülönböztetés azért kell, mert az`
- [C8] [CONFIRMED] A fertilitásmegőrzés fel sem merülése vörös zászló, nem az elutasítása @L160 `**A „nem került szóba" fertilitásmegőrzés vörös zászló.**`
- [C9] [CONFIRMED] A bizonytalan jelentőségű variáns unknown jelöléssel szerepel, nem pozitív leletként @L166 `**A bizonytalan jelentőségű variáns nem pozitív lelet.**`
- [C10] [CONFIRMED] RECIST 1.1 nincs kiszámítva; ma csak a válaszkategória rögzíthető @L175 `jelenleg csak a **válaszkategória** rögzíthető`
- [C11] [CONFIRMED] A modul katalógusa 21 változót tartalmaz a becsült 120-ból @L181 `feltöltöttsége ezt tükrözi: **21 változó a becsült 120-ból**. Ami elkészült, az`
- [C12] [CONFIRMED] A modult 22 teszt fedi a test/onkologia.test.ts fájlban @L187 `(../../test/onkologia.test.ts) — 22 teszt:`
