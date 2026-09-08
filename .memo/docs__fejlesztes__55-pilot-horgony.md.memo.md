---
source: docs/fejlesztes/55-pilot-horgony.md
sha256: 76fcc10c0a473837c37a9d62e3354b363581dc61bf632fab776c395cd5cc998e
lines: 183
profile: prose
generator: subagent
raw_tokens_est: 2279
verified: no claims
---

# docs/fejlesztes/55-pilot-horgony.md

## Topics
- L1-54: a lelet — a lenyomatlánc nem védi a napló végét, és miért most derült ki
- L55-102: a naplóhorgony szerkezete, hat állapota és a három írási szabály
- L103-142: a pilot öt plusz két előfeltétele, a kapu, a gép által nem pótolható mezők
- L143-183: a három zárási kritérium mérhetősége, a nevező hiánya, elkészült fájlok

## Claims

- [C1] Ez az első lépés, ami beteg-azonosításra alkalmas adatot érint @L9 `Ez az első lépés, ami **beteg-azonosításra alkalmas adatot** érint.`
- [C2] A lenyomatlánc a múltat köti meg, a napló végét nem @L24 `**A lenyomatlánc a múltat köti meg, a végét nem.**`
- [C3] Csonkolt napló esetén minden ellenőrzés sikert jelez, miközben öt bejegyzés hiányzik @L37 `Öt vajúdási bejegyzés hiányzik, és **nem szól semmi**.`
- [C4] A modul fejléce azt állította, hogy a levágott napló is eltörik — a próza többet ígért, mint amit a szerkezet hordoz @L42 `bejegyzés és a **levágott napló** mind más helyen töri el”* —, vagyis a próza`
- [C5] A hiba a 16. lépés első elfogadási kritériuma („nem veszített adatot") kapcsán derült ki @L48 `Mert a 16. lépés **első elfogadási kritériuma** így szól: *„két hét éles`
- [C6] A horgony három adatból áll: eset, utolsó sorszám, utolsó lenyomat @L58 `gépre) egy három adatból álló csúcsjelzés: **eset, utolsó sorszám, utolsó`
- [C7] A horgony azért nem a naplóban áll, mert ugyanaz a csonkolás vinné el, ami a bejegyzéseket @L67 `Miért nem a naplóban áll: ami a naplófájlban van, azt **ugyanaz a csonkolás`
- [C8] Horgony nélkül az épség nem bizonyított — a rendszer nem azt mondja, hogy nem veszett adat, hanem hogy nem tudja @L82 `Az utolsó a lényeg. **A hiányzó horgony nem „rendben”.** Horgony nélkül a`
- [C9] A horgony az írás után áll be, soha előtte @L89 `**A horgony az írás UTÁN áll be, soha előtte.** Egy előre felvett horgony olyan`
- [C10] A horgony csak előre mehet; a visszafelé írás hiba, nem frissítés @L93 `**A horgony csak előre mehet.** A rövidebb naplóhoz „hozzáigazított” horgony`
- [C11] A sikertelen horgonyírás nem buktatja el az írást, csak `error` szintű működési naplósort ad @L97 `**És a sikertelen horgonyírás nem buktatja el az írást.** Az adat ekkor már`
- [C12] A terv öt előfeltétele mind teljesülhet úgy, hogy a rendszer valódi adaton mégsem futhat @L108 `**Mind az öt teljesülhet úgy, hogy a rendszer valódi adaton mégsem futhat.**`
- [C13] A számítási hitelesítések állása ma 0/32 referencia, 0/3 normogram, 0/11 küszöb @L114 `| ☐ | *(6–8.)* Számítási hitelesítések | 0/32 referencia, 0/3 normogram, 0/11 küszöb |`
- [C14] Az egyetlen teljesült előfeltétel a naplóhorgony, ami a tárolóba be van kötve @L118 `| ☑ | **[kimondatlan]** Naplóhorgony | megvan, a tárolóba bekötve |`
- [C15] A kiszolgáló szintetikus üzemmód nélkül el sem indul: a rendszer maga mondja ki, hogy valódi betegadaton nem futhat @L124 `rendszer maga mondja ki, hogy valódi betegadaton nem futhat.`
- [C16] A pilotkapu csak bizonyítékból nyílik; nincs „kész"-re billenthető mező a nyilvántartásban @L130 `**A kapu csak bizonyítékból nyílik.** A nyilvántartásban nincs olyan mező, amit`
- [C17] Az osztály, a vezető és a kezdődátum üresen áll, mert a vállalást gép nem pótolhatja @L138 `vezetővel, aki **vállalja**”*, és a vállalás az, amit gép nem pótolhat. A`
- [C18] A három zárási kritérium közül egy sem mérhető magától @L143 `## A három zárási kritérium: egy sem mérhető magától`
- [C19] A kikerülési kritériumnak nincs nevezője: a rendszer nem tudja, hány esetet láttak el az osztályon @L151 `**A nevező.** A rendszer tudja, hány esetet rögzítettek benne; azt nem, hány`
- [C20] A harmadik kritérium elérhetetlen, mert a 15. lépés nélkül a rendszer meg sem szólal @L156 `**Az elérhetetlenség.** A harmadik kritérium a 15. lépéstől függ. Amíg egyetlen`
- [C21] Mérés nélkül a kritérium a pilot végén magától „teljesült"-nek látszana, ezért a validálás külön kimondja @L162 `végén **magától „teljesült”-nek fog látszani** — a validálás ezért mindkettőt`
- [C22] A biztonságos tároló olvasás előtt megkérdezi a horgonyt, írás után pedig beállítja @L178 `a tároló **megkérdezi** a horgonyt olvasás előtt, és írás után beállítja`
- [C23] A napló típusfájljában a fejléc hamis állítása javítva lett @L179 `a fejléc hamis állítása javítva,`
