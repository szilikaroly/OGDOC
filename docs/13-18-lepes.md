# 13 — A tizennyolc lépés

*Nem ütemterv, hanem sorrend. Mindegyik lépésnél ott áll, mikor KÉSZ — úgy,
hogy vitatkozni ne lehessen róla.*

---

## Miért kell ez a `04` és a `12` mellé

A `04-utemterv.md` fázisokra bontja a fejlesztést. A `12-15-honapos-terv.md`
hónapokra. Egyik sem mondja meg, **mi a következő lépés reggel**, és melyik
lépés miért nem indulhat el a másik előtt.

Ez a lista tizennyolc lépés, négy hullámban. Mindegyiknél négy dolog van:

| | |
|---|---|
| **Mit** | egy mondatban |
| **Kész, ha** | eldönthető állítás — teszt, hitelesített tábla, aláírt papír |
| **Ki** | nem szerepkör általában, hanem aki nélkül nem megy |
| **Mire épül** | melyik lépés nélkül nincs értelme elkezdeni |

**A sorrend nem naptár.** A C-hullám (11–14.) hónapokat visz átfutásban, ezért
**az első naptól párhuzamosan fut az A-val** — ha ezek nem indulnak el most,
ők lesznek a szűk keresztmetszet, nem a kód.

---

## A hullámok

| Hullám | Mit old meg | Lépés |
|---|---|---|
| **A** | amit ma meg lehet lépni, engedély nélkül | 1–5 |
| **B** | amit hitelesíteni kell, mielőtt bárki használja | 6–10 |
| **C** | ami hónapokat visz — **most indul, nem a végén** | 11–14 |
| **D** | amitől a rendszer szervezetté válik | 15–18 |

---

# A hullám — ami ma indulhat

## 1. A tároló: perzisztencia, jogosultság, auditnapló

> **MEGVAN.** A négy elfogadási kritérium tesztként áll
> (`test/tarolo.test.ts`, 28 teszt), a réteg a `core/store/` alatt, a
> részletes leírás a [`fejlesztes/34-tarolo.md`](fejlesztes/34-tarolo.md)-ben,
> és futtatható: `npm run demo:tarolo`.
>
> **A `web/` réteg 2026-09-05 óta ezen fut:** perzisztencia, jogosultság,
> auditnapló és esetenkénti elkülönítés élesben, valódi kiszolgálóval
> tesztelve (`test/web.test.ts`, 22 teszt) —
> [`fejlesztes/40-web-tarolo.md`](fejlesztes/40-web-tarolo.md).
>
> **Ami továbbra is nyitva van:** a `KeyStore` mögé HSM vagy KMS kell (a
> kulcs tartóssága szándékosan nem ezé a rétegé), és **nincs HITELESÍTÉS**: a
> cselekvőt egy kérésfejléc állítja, amit senki nem ellenőriz. A kiszolgáló
> ezért `OGDOC_SYNTHETIC=1` nélkül el sem indul. A rendszer tehát **még mindig
> nem futhat valódi betegadaton** — de már nem a tároló és nem a webes réteg
> miatt, hanem azért, mert a „ki vagy te” kérdésre nincs válasz.

**Mit.** A `core/store.ts` ma két műveletet tud: betölt és ment. Titkosítás,
jogosultságkezelés és auditnapló szándékosan nincs benne — a réteg a
megmaradást oldja meg, nem a védelmet.

**Ez az egyetlen igazi blokkoló.** Amíg nincs kész, a rendszer **valódi
betegadaton nem futhat**, tehát a 16. lépésig (pilot) minden más lépés
szintetikus adaton zajlik. Ez nem baj — de tudni kell, hogy ez az egy tétel
tolja el a valódi használatot, nem a modulok száma.

**Kész, ha.** Egy eset mentése és visszatöltése túléli az újraindítást; minden
olvasás és írás naplózódik ki-mit-mikor bontásban; a napló maga nem
módosítható; és van egy teszt, ami bizonyítja, hogy jogosultság nélküli
olvasás nem ad adatot, hanem hibát.

**Ki.** Fejlesztés + DPO (a napló megőrzési ideje és tartalma az ő döntése).

**Mire épül.** Semmire. Ez az első.

---

## 2. A két hiányzó törzs lezárása

> **MEGVAN.** A `missingStems()` egyetlen tételt ad vissza, és az a
> `tbl.snomed.hu` — a hozzá tartozó **döntés leírva**:
> [`fejlesztes/26-forrasjegyzek.md` 6/b](fejlesztes/26-forrasjegyzek.md).
> A HBCS-besorolás kinyerve a rendeletből: 26 főcsoport, 773 csoport,
> 39 359 kódhivatkozás, és **egy szüléshez csoportot ad**
> (`test/hbcs-besorolas.test.ts`, 20 teszt; `npm run demo:besorolas`).
> Részletek: [`fejlesztes/35-hbcs-besorolas.md`](fejlesztes/35-hbcs-besorolas.md).
>
> **Ami továbbra is nyitva van:** a 773 csoportból **596 (77%)** szabálya
> értékelhető ki géppel. A maradék a rendelet időfeltételes, életkori és
> darabszámos alakjait használja; ezekre a rendszer NEM ad besorolást, hanem
> szó szerint idézi a szabályt, amit nem ért.

**Mit.** A rendszer megnevezi, mi hiányzik neki: a **HBCS besorolási táblázat**
(10/2012. NEFMI 2. melléklet) gépi alakban, és a **SNOMED CT magyar
megnevezések**.

A kettő sorsa nem ugyanaz, és ezt ki kell mondani:

- A **HBCS-besorolás** beszerezhető. Nélküle a rendszer csoportot nem állapít
  meg, csak egy ismert csoport súlyszámát adja — vagyis a finanszírozási modul
  fele hiányzik.
- A **SNOMED magyar fordítás** nem beszerezhető, hanem **döntés**. A fordítás
  validált eljárást kíván (SNOMED International: Guidelines for Translation);
  egy rögtönzött magyar alak nem SNOMED. A helyes válasz az, hogy **nem
  fordítunk** — a rendszer SNOMED-azonosítót ajánl, magyar megnevezést nem —,
  és ezt a döntést le kell írni, hogy fél év múlva ne kezdje el valaki.

**Kész, ha.** A `missingStems()` egyetlen tételt ad vissza, és az a
`tbl.snomed.hu`, mellette a leírt döntéssel. A HBCS-besorolás betöltve,
és a `tbl.hbcs.besorolas` egy szüléshez csoportot ad.

**Ki.** Fejlesztés + finanszírozási szakértő.

**Mire épül.** Semmire.

---

## 3. A 326 szabály döntéssé tétele

> **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM.** A 326 mező mögött **38 szabály**
> áll: az ülés nem 326-szor dönt, hanem 38-szor. A szabálykatalógus a normatív
> maggal és a javaslatokkal készen áll
> (`registry/felulet/dontes-szabalyok.json`), a munkalap fut
> (`npm run dontes`, `npm run xlsx` „Döntések” lap), és a kapu zár:
> **eldöntetlenül egy mező sem kerül át** (`test/dontes.test.ts`, 32 teszt).
> A feladat- és aláírás-allokáció szerepekre bontva:
> [`fejlesztes/37-dontes-allokacio.md`](fejlesztes/37-dontes-allokacio.md) —
> **6 ülés**, a legnagyobb (klinikai vezető: 22 szabály · 225 mező) önmagában
> több, mint a többi együtt. Részletek:
> [`fejlesztes/36-dontesek.md`](fejlesztes/36-dontesek.md).
>
> **Ami továbbra is nyitva van:** mind a 38 aláírás. A `dontesek.json` üresen
> indul, és ez nem hiányosság — a döntést klinikai vezető, DPO és fejlesztés
> hozza, együtt ülve. A lépés akkor lesz kész, amikor a `npm run dontes`
> 0 eldöntetlent ír ki.

**Mit.** A felülettérkép 1502 mezőjéből **95 nem vehető át változatlanul** és
**231 kapu**. Ezek nem mezők, hanem **szabályok** — mindegyik egy döntést vár,
és a döntés nem fejlesztői kérdés.

Példák a legsúlyosabb végéről: az etnikum mint MoM-korrekció (a forrásrendszer
csendben beengedi, mi nem); a genetikai lelet e-mailben PDF-ként; a
„Megrendelve ≠ Eredmény" kintlévőség kezelése; a 24 órás vizeletfehérje rossz
egységben; a kézzel beírt AFS-pontszám.

**Kész, ha.** Minden `refused` és `gate` állapotú mező mellett ott a döntés:
**átvesszük · átalakítva vesszük át · nem vesszük át**, egy mondatnyi
indoklással, aláíróval. A munkalap a `npm run xlsx` „Döntések" lapja (38 sor,
javaslattal és lenyomattal) és a `npm run dontes`; a mezőnkénti kihatás a
„Mezők" lap „Döntés" és „Átkerül" oszlopa.

**Ki.** Klinikai vezető + DPO + fejlesztés, együtt ülve. Nem levelezéssel.

**Mire épül.** Semmire — de a 4. lépés fele ebből következik.

---

## 4. Az anamnézis-gerinc befejezése

> **MEGVAN.** Az elfogadási kritérium tesztként áll: egy szintetikus eseten a
> kitöltött anamnézis után mind a négy modul — CMQCC vérzési kockázat, VBAC,
> Caprini/RCOG VTE, szűrési esedékesség — **egyetlen további kérdés nélkül**
> megkapja a bemeneteit (`test/anamnezis-gerinc.test.ts`, 18 teszt;
> `npm run demo:gerinc`). A mérték nem üres: egyetlen anamnézis-válasz
> kivétele elbuktatja. Részletek:
> [`fejlesztes/38-anamnezis-gerinc.md`](fejlesztes/38-anamnezis-gerinc.md).
>
> **Ami közben elkészült:** a CMQCC vérzési kockázatbecslés modulja hiányzott
> — most megvan, és a tényezőihez a változók már adottak voltak. A tábla
> `assumed` szintű, ezért **szintet nem ad**, csak a fennálló tényezőket
> sorolja fel; a hitelesítés a 6. lépés munkája.
>
> **Ami közben kiderült:** a rögzített „nem tudom” válasz a kockázati
> modulokban „nem”-mé vált, a szűrésnél pedig „nem vonatkozik rá”-vá. Mindkettő
> javítva; az utóbbi klinikai döntés, ezért a szabály adata (`unknownAnswer`),
> fail-safe alapértelmezéssel — **két szűrésre klinikai jóváhagyást kíván.**

**Mit.** A `03` modul az, amiből minden más feltölt: a score-ok bemenetei, a
szűrési esedékesség, a kockázati kapuk mind innen jönnek. A 846 változóból ez a
legjobban kidolgozott rész, de nem teljes.

**Miért itt.** Ha ez nincs kész, minden később épített modul kézzel bevitt
adatot fog kérni olyanról, amit a rendszer már tudhatna — és ekkor bukik el a
projekt legkockázatosabb pontja: *ha a kódolt bevitel lassabb a gépelésnél, a
klinikus kikerüli.*

**Kész, ha.** Egy szintetikus eseten az anamnézis kitöltése után a CMQCC-, a
VBAC-, a Caprini- és a szűrési modul **egyetlen további kérdés nélkül**
megkapja a bemeneteit, és ezt teszt bizonyítja. „További kérdés” az, ami
kérdezéssel megválaszolható — egy meg nem mért vérnyomás nem az; a
forrásbesorolást a `core/anamnezis/gerinc.ts` végzi.

**Ki.** Fejlesztés + szülész-nőgyógyász.

**Mire épül.** 3.

---

## 5. Egy teljes eset végigvitele — a két kimenettel

> **A GÉPI FELE MEGVAN, A KLINIKAI OLVASAT NEM.** A `npm run demo` egy
> szintetikus ambuláns eseten végigmegy — 36 éves, 30+5 hét, „fáj a fejem és
> villog a szemem”, 158/98 —, és mind a két kimenet olvasható
> (`test/eset.test.ts`, 19 teszt). Részletek:
> [`fejlesztes/39-teljes-eset.md`](fejlesztes/39-teljes-eset.md).
>
> **Ami közben elkészült:** a két kimenet eddig csak a KÓDOLT leletekből
> épült, a mérésekről hallgatott — egy 158/98-as vérnyomásról a beteg egy szót
> sem olvasott volna. A `core/ui/meres.ts` a definíciós küszöböt (teendő) és a
> kontextusfüggő referenciát (jelzés, a hitelesítési szintjével) külön kezeli,
> és ismeretlen kontextusnál NEM esik vissza a nem terhes sávra.
>
> **Ami közben kiderült:** az AST kritikus sávja fordítva állt — a NORMÁLIS
> AST-t jelezte kritikusnak, a HELLP-tartományút elengedte. Javítva, és a
> validátor mostantól hibaként fogja meg az ilyen megfordított párokat.
>
> **Ami továbbra is nyitva van:** a lépés akkor lesz kész, amikor **két
> klinikus**, akik nem vettek részt a tervezésben, végigolvassa a két kimenetet
> és azt mondja rá: ezt aláírnám. Ezt gép nem végezheti el helyettük.

**Mit.** Egy szintetikus ambuláns eset a felvételtől a generált dokumentumig:
panasz → státusz → lelet → levezetés → **betegnek szóló szöveg** és
**klinikusnak szóló teendőlista**.

**Miért ez az ötödik.** Ez az első pont, ahol a rendszer nem részenként, hanem
egészben mutatja meg magát — és ahol kiderül, hol lassabb a gépelésnél.

**Kész, ha.** A `npm run demo` végigmegy, a két kimenet olvasható, és a
klinikai olvasó azt mondja rá, hogy **ezt aláírná**.

**Ki.** Fejlesztés + két klinikus, akik nem vettek részt a tervezésben.

**Mire épül.** 4.

---

# B hullám — hitelesítés használat előtt

> **Közös szabály mind az ötre:** a hitelesítés nem fejlesztői feladat, és nem
> is „átnézés". Név, dátum, és az elsődleges forrás megnevezése. Enélkül a kapu
> nem nyílik ki, és ez így helyes.

## 6. A harminc laborreferencia

**Mit.** 30 változó kapott trimeszterre bontott referenciatartományt
(Abbassi-Ghanavati 2009), **`assumed` szinten** — a számok az elsődleges
táblával nincsenek összevetve.

**Miért fontos.** Egy 180 U/L alkalikus foszfatáz a 3. trimeszterben normális,
nem terhesen emelkedett. Rossz referenciával a rendszer vagy riogat, vagy
megnyugtat — mindkettő rosszabb, mint ha hallgatna.

**Kész, ha.** Mind a 30 tétel `primary`, és a validátor összesített
figyelmeztetése eltűnik.

**Ki.** Laboratóriumi szakorvos.

**Mire épül.** Semmire.

> **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM.** Az aláírási réteg éles: a
> lenyomat a SZÁMOKHOZ köti az aláírást (a megjegyzés javítása nem rontja
> el, egy határérték igen), a kézzel `primary`-re írt referencia
> **build-hiba**, és a munkalap (`npm run labref`) forrásonként sorolja a
> **130 összevetendő számot**. Aláírás: **0/32.**
>
> **Amit az előkészítés felszínre hozott:** két `postpartum` referenciasáv
> soha nem szólalt meg, mert a futásidejű feloldó ezt a kontextust nem
> adta vissza. Javítva — a gyermekágy 42 napig valódi kontextus, és az
> elérhetetlen kontextus mostantól build-hiba.
>
> Részletek:
> [`fejlesztes/45-referencia-hitelesites.md`](fejlesztes/45-referencia-hitelesites.md).

---

## 7. A normogramok: 265 katalogizált, 3 telepített, 0 hitelesített

**Mit.** A forrásrendszerből 265 görbe van katalogizálva, 3 telepítve, és
**egyetlen sem ad percentilist**, mert egyik sincs hitelesítve.

**A három szint nem formalitás:** katalogizált ≠ telepített ≠ hitelesített. A
telepítés adminisztratív (a tábla látszik), a hitelesítés szakmai felelősség —
és az nyitja a kaput.

**Kész, ha.** A leggyakrabban használt tíz görbe telepítve és hitelesítve, és a
hibrid nézet (populációs + személyre szabott) egy szintetikus magzatra
mindkettőt megadja.

**Ki.** Fetalis medicina szakorvos, FMF-engedélyszámmal.

**Mire épül.** Semmire.

> **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM.** A telepítési sorrend levezethető
> és le is van vezetve: négy mérhető tényezőből, a MI hivatkozásaink alapján
> — a forrásrendszer szokása szándékosan kis súlyú. Az első kör tíz mérése
> megvan, indoklással. Az aláírási réteg éles: a lenyomat a SOROKHOZ köti az
> aláírást, az FMF-képesítés kötelező, és konvenciófüggő mérésnél a konvenció
> megnevezése nélkül **build-hiba**. Hitelesítve: **0 publikált görbe.**
>
> **Amit az előkészítés felszínre hozott:** (1) a `coverage()` a NEM LÉTEZŐ
> `"verified"` szintet kereste, tehát a hitelesítettek száma örökre 0 maradt
> volna — aki elvégzi a munkát, nem látta volna az eredményét; (2) a
> katalógust a regiszterhez EGYETLEN szál kötötte, egy tesztben átadott
> leképezés — most 15 kötés, és 104 mérés megnevezett kihagyási okkal.
>
> Részletek:
> [`fejlesztes/46-normogram-telepites.md`](fejlesztes/46-normogram-telepites.md).

---

## 8. A hét kapu mögötti kalkulátor

**Mit.** Hét kalkulátor teljes bemenettel sem ad eredményt, mert a konstansaik
nincsenek visszaellenőrizve: **eGFR (CKD-EPI 2021), Hadlock EFW,
Cockcroft–Gault, terhességi energiaszükséglet, ISTH terhességi DIC, CMQCC
vérzési stádium, CMQCC szepszis-szűrő.**

**Ez nem elméleti óvatosság.** A fullPIERS dokumentált együtthatóival a modell
klinikailag **fordítva viselkedik** — ezt a rendszer saját tesztje mutatta ki.

**Kész, ha.** Mind a hét `verified: true`, a `verifiedNote` megnevezi, ki és mit
vetett össze, és a `npm run check` kalkulátor-doksija ezt kiírja.

**Ki.** Klinikai szakértő közleményenként — nem egy ember mind a hétre.

**Mire épül.** Semmire.

> **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM.** Az aláírási réteg éles, és itt a
> hitelesítés tárgya KÓD, nem adat: a lenyomat a függvény forrását fedi, a
> bemenetek EGYSÉGÉVEL együtt — mert az eGFR µmol/L-t vár és 88,4-gyel oszt,
> tehát egy egységcsere a kód érintése nélkül csendben 88-szor téves
> eredményt adna. Az aláírás TÉTELES: felsorolja, melyik konstanst vetették
> össze, és ami kimarad, arra nem terjed ki. Aláírva: **0/7.**
>
> **Amit az előkészítés felszínre hozott:** (1) az ISTH terhességi
> DIC-pontszám thrombocyta-komponense NEM NÖVEKVŐ (0 → 1 → 2 → 1): a
> legsúlyosabb thrombocytopenia kevesebb pontot ér a közepesnél. A kód és a
> dokumentált képlet egyetért, tehát ha hiba, az átvételkor keletkezett — a
> különbséget csak a közlemény dönti el, és a gép ezért megnevezi, nem
> javítja. (2) 36 kalkulátor az aláírási réteg ELŐTT kapott `verified`
> jelölést; ezek most megnevezett adósságként szerepelnek, lezárt listán —
> és ez a szám a lépés valódi haladásmérője.
>
> Részletek:
> [`fejlesztes/47-kalkulator-hitelesites.md`](fejlesztes/47-kalkulator-hitelesites.md).

---

## 9. A szepszisküszöbök és az omqSOFA-eltérés

> **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK ÉS A DÖNTÉS NEM.** Az eltérés már nem
> prózából, hanem a **két élő definícióból** vezetődik le: a küszöbök a
> kalkulátor **futó kódjából** olvasódnak ki, változóra kötve
> (`core/szepszis/kuszob.ts`). A levezetés két valódi eltérést talál
> (légzésszám, pulzus), egy látszólagosat elvet (a testhő két forrásban
> ugyanaz, csak másképp leírva), és két hatóköri különbséget nevez meg
> (fehérvérsejtszám · oxigénszaturáció). A munkalap fut (`npm run szepszis`),
> a tesztek állnak (`test/szepszis-kuszob.test.ts`, 26 teszt). Részletek:
> [`fejlesztes/48-szepszis-kuszob.md`](fejlesztes/48-szepszis-kuszob.md).
>
> **Ami közben kiderült, és amiért a lépés nem volt halasztható:** a
> szepszisprotokoll volt az EGYETLEN hely a rendszerben, ahol a riasztás
> kapuját nem aláírás, hanem **két jelölés** nyitotta — a `verification` szó
> és a `blocksAlerting` logikai érték. Két szó egy JSON-fájlban, és a rendszer
> riasztani kezd olyan határértékekre, amelyeket senki nem vetett össze az
> elsődleges forrással (a `cmqcc.org` blokkolva van, a számok másodkézből
> valók). Mostantól a kapu **csak aláírásból** nyílik, a jelölés pedig tiltani
> tud, engedni nem. A futásidejű megítélés alapértelmezésben **zárt** kapuval
> fut: kapu nélkül a válasz nem „valószínűleg szabad”, hanem „zárva”.
>
> **Amit a gép még talált:** három kritérium címkéje mást ígér, mint amit a
> gép mér — a fehérvérsejt-kritérium „> 10% éretlen alak” ága nincs
> kiértékelve; a kreatinin- és a bilirubinküszöb **rögzített abszolút szám**,
> holott a címkéjük „a terhességi alapvonalhoz képest” emelkedést mond. A
> kreatininnél ezt a kritérium **saját megjegyzése** cáfolja meg: leírja, hogy
> a nem terhes normáltartomány elrejti a vesekárosodást — és pontosan azt a
> határt használja. És a pulzuskritérium szövege „tartósan”-t mond, a
> kiértékelés viszont egyetlen mérést néz. A gép egyiket sem javítja ki:
> megnevezi őket, mert mindegyik klinikai döntés.
>
> **Ami továbbra is nyitva van:** a 11 küszöbből **0 aláírva**, és a két
> eltérő küszöb **döntés nélkül**. A `kuszob-dontes.json` szándékosan
> eldöntetlen — és a döntés sem csendesíti majd el a másik forrást: a
> választott küszöb lesz a normatív, de az eltérés látszik marad.

**Mit.** A CMQCC szepszis-küszöbök `assumed` szinten állnak (a forrás nem volt
elérhető), és **ugyanazokra a mérésekre a rendszerben már fut az omqSOFA más
határértékkel**: légzésszám > 24 vs > 20, pulzus > 110 vs > 90.

**Két forrás, két szám, egy beteg.** A rendszer mindkettőt megnevezi, és
egyiket sem csendesíti el a másikkal — de az intézménynek el kell döntenie,
melyik az övé.

**Kész, ha.** A protokoll `primary`, a `blocksAlerting` kikapcsolható, és az
intézményi küszöb egy dokumentumban le van írva.

**Ki.** Szülészeti osztályvezető + intenzíves.

**Mire épül.** Semmire. **De a 15. lépés nélkül a kapu kinyitása ártalmas** —
riasztást adni válaszút nélkül rosszabb, mint nem riasztani.

---

## 10. A megőrzési idők

> **A GÉPI FELE MEGVAN, AZ ALÁÍRÁSOK NEM.** A megőrzési idő mostantól
> **kiszámolódik**: az időtartam dátummá válik a megnevezett horgonytól
> (`core/docs/megorzes.ts`), a törlés próbafuttatása szintetikus eseteken fut
> (`npm run megorzes`), és a tesztek állnak (`test/megorzes.test.ts`, 23
> teszt). A `verification: "primary"` — az a mező, ami az automatikus törlést
> megnyitja — **csak aláírásból** állhat elő, és az aláírás megnevezi a
> jogszabályt **és a hatályosság napját** is. Részletek:
> [`fejlesztes/49-megorzes.md`](fejlesztes/49-megorzes.md).
>
> **Ami közben kiderült.** A `period` (`P50Y`, `P30Y`, `P10Y`) sehol a kódban
> nem lett dátummá, a `from` mező — hogy mihez képest számoljuk — pedig a saját
> típusdeklarációján kívül EGYETLEN sorban sem szerepelt. Ezért a törlési
> motorban a megőrzési idő leteltét egy KÉZZEL BEÍRT dátum igazolta, amiről a
> rendszer csak annyit ellenőrzött, hogy a múltban van-e: aki 2020-01-01-et ír
> be egy múlt heti esethez, átjutott a kapun. Ma ezt elfedi, hogy egyetlen
> típus sem `primary` — de épp ez a lépés célja, hogy mind a 14 az legyen, és
> akkor a maszk lehull. A begépelt lejárat mostantól visszaellenőrződik a
> dokumentum saját idejéből és horgonyából; ami nem ellenőrizhető, az nem
> igazolt.
>
> **És egy nyitott jogi kérdés, amit a gép megtalált:** a jogszabályhely
> IDÉZETE 13 tételnél más horgonyt nevez meg, mint a beállítás — „30 év **az
> adatfelvételtől**”, „10 év **a készítéstől**” —, a rendszer viszont mind a
> tizennégyet az eset lezárásától számolja. Az eltérés a BIZTONSÁGOS irányba
> téved (a lezárás sosem korábbi, tehát tovább őrzünk), de kimondatlan, és a
> számolás pillanatában a jogi és a gépi lejárat két különböző dátum lesz. A
> `from` mező ezért mostantól ismeri a `dataEntry` és a `creation` értéket —
> hogy a jogász döntésének legyen hová landolnia.
>
> **Ami továbbra is nyitva van:** mind a 14 aláírás, és a horgonykérdés. A
> `megorzes-hitelesitesek.json` üresen indul. A próbafuttatás megmutatja, mi
> lenne: egy 1960-ban lezárt esetnél mind a 14 idő letelt — és mégsem menne
> egyetlen tétel sem, mert egyik szabály sincs aláírva. **Ez a helyes
> sorrend.**

**Mit.** Mind a 14 dokumentumtípus megőrzési ideje `secondary` szinten áll: az
elsődleges jogszabályszöveget a hálózati proxy blokkolta.

**Amíg ez így van, a rendszer nem töröl.** Ez a helyes irány — ellenőrizetlen
megőrzési idő mellett törölni **adatvesztés**, nem takarítás.

**Kész, ha.** Mind a 14 típus `primary`, jogszabályhelyre hivatkozva, és az
első automatikus törlés próbafuttatása szintetikus adaton lefut.

**Ki.** Jogász.

**Mire épül.** Semmire.

---

# C hullám — ami hónapokat visz, tehát MOST indul

> Ez a négy lépés a **kritikus út**, és egyik sem fejlesztési feladat. Ha az
> első héten nem indulnak el, a rendszer kész lesz, és mégsem lehet használni.

## 11. ETT-beadás

> **A GÉPI FELE MEGVAN — DE AZ NEM A KÉRELEM.** A kérelmet a kutatásvezető
> adja be; kódot írni hozzá nem lehet. Egy dolgot viszont a gép muszáj hogy
> megtegyen: **megakadályozza, hogy a beadvány olyat állítson, ami nem igaz.**
> A dosszié 14 tétele adatként áll (`registry/ett/dosszie.json`), mindegyik
> mellett nem fájlnév, hanem ÉLŐ LEKÉRDEZÉS, és a kapu az igazságot méri, nem
> a teljességet (`npm run ett`, `test/ett.test.ts`, 17 teszt). Részletek:
> [`fejlesztes/50-ett-dosszie.md`](fejlesztes/50-ett-dosszie.md).
>
> **Miért kellett ez.** A beadvány minden tétele ÁLLÍTÁS EGY BIZOTTSÁGNAK. Az
> „adatbiztonsági leírás” nem egy melléklet neve, hanem az a mondat, hogy az
> adathoz csak jogosult fér hozzá. Ha ezt kimondjuk, miközben a cselekvő
> kilétét egyetlen ellenőrizetlen kérésfejléc állítja, akkor a kérelem
> VALÓTLAN ÁLLÍTÁST tartalmaz — és ez nem hiányos beadvány, hanem más műfaj.
> Egy hiányzó melléklet pótolható; egy valótlan állítás a bizottság előtt nem.
>
> **A mai kép:** 14 tételből 3 fedett, 1 részben, 6 megalapozatlan, 4
> szervezeti — **a kérelem így nem adható be**. A legfontosabb sor az
> adatbiztonsági leírás, és nem azért, mert rossz, hanem mert RÉSZBEN igaz: a
> jogosultság, az auditnapló, a titkosítás és a PHI-kizárás megvan, a
> hitelesítés nem. A hitelesítés bizonyítéka a KÓDBÓL jön: amíg a
> `web/session.ts`-ben ott a szintetikus kapu, a rendszer maga mondja ki, hogy
> valódi betegadaton nem futhat.
>
> **Négy tétel szervezeti** (befogadó nyilatkozat, kompetencia, finanszírozás,
> biztosítás). A gép ezekről nem nyilatkozik — de a „szervezeti” nem felmentés,
> hanem CÍMZÉS: a lista számon tartja őket, és megnevezi, ki válaszol.
>
> **Ami továbbra is nyitva van:** minden, ami a tételek állításait igazzá
> tenné — és a legtöbbje nem fejlesztési feladat. A teszt eljátssza azt a
> napot, amikor mind az 55 aláírás megvan: a kérelem **még akkor sem adható
> be**, mert a hitelesítés és az elemzési terv hiányzik.

**Mit.** A kutatási felhasználás engedélyeztetése.

**Kész, ha.** A kérelem beadva. (Nem az, hogy megjött — az nem rajtunk múlik.)

**Ki.** Kutatásvezető.

**Mire épül.** A 3. lépés adatvédelmi döntéseire, mert azok a kérelem részei.

---

## 12. A tíz mérőeszköz licencelése

> **A GÉPI FELE MEGVAN, A LICENCEK ÉS A DÖNTÉSEK NEM.** A lépés
> KÉTKIMENETŰ lezárása mostantól adatként áll
> (`registry/kerdoivek/licencek.json`): licenc VAGY leírt döntés, hogy nem
> használjuk — és a második ugyanúgy rendez, mint az első. Eddig csak az
> ELSŐ kimenet létezett: kilenc figyelmeztetés állt a validálásban, KIÚT
> NÉLKÜL. Munkalap: `npm run licenc`; 19 teszt. Részletek:
> [`fejlesztes/51-meroeszkoz-licenc.md`](fejlesztes/51-meroeszkoz-licenc.md).
>
> **Ami közben kiderült — kettő is.** (1) A felvételi kaput egyetlen JELÖLÉS
> nyitotta: az `itemText.status` szó `"loaded"`-ra írása. Semmi nem kérte
> számon, hogy a licencet megszerezték-e, kitől, milyen hatókörrel és meddig
> — hatodszorra ugyanaz a lyuk, itt viszont kettős következménnyel: jogi
> (védett szöveg engedély nélkül) és tudományos (a saját szavakkal feltett
> EPDS nem EPDS). (2) A LATCH licenckapu-tesztje ROSSZ OKBÓL volt zöld:
> `administrable(REG, blank(), id)` alakban hívta, tehát a regisztert adta át
> azonosítóként, a válasz „ismeretlen mérőeszköz” lett — és ugyanígy zöld lett
> volna akkor is, ha a kapu egyáltalán nincs ott. Az elutasítás oka mostantól
> MEGNEVEZVE jön vissza, hogy elrontott hívás soha többé ne vigyen át
> kapu-tesztet.
>
> **Ami ebben a rétegben új:** a licenc LEJÁR. A rendszer öt korábbi aláírási
> rétege időtlen; egy licenc dátumhoz kötött, és a lejárta nem a mi hibánk —
> mégis attól a naptól jogosulatlan a felvétel. A kapu ezért naptárt néz és 90
> nappal előre szól, mert a megújítás hónapokat vihet. De a lejárt licenc NEM
> törli a múltat: a már felvett adat érvényes marad, csak új felvétel nem
> indul.
>
> **Ami továbbra is nyitva van:** 10 eszközből **1 rendezett** (a közkincs
> Whooley), 9 rendezetlen, és a validált magyar fordítás 1/10. Az EPDS a
> legfájóbb: a magyar fordítás validált, saját közleménnyel — csak a
> tételszöveg licence hiányzik.

**Mit.** Tíz mérőeszközből **kilencnél** hiányzik a validált magyar tételszöveg
vagy a licenc: EPDS, PHQ-9, MSPSS, MIBS, LATCH, WHODAS-12, EQ-5D-5L, BSES-SF,
BSSR. Négynél a magyar fordítás **nem validált** — az ezekkel gyűjtött adat
publikálhatósága korlátozott.

**Ez ugyanaz a szabály, mint a SNOMED-nél:** a rögtönzött fordítás nem a
mérőeszköz. Egy kérdőív, amit lefordítottunk, egy másik kérdőív.

**Kész, ha.** Minden eszközre vagy licenc + validált tételszöveg van, vagy egy
leírt döntés, hogy **nem használjuk**.

**Ki.** Kutatásvezető + jogász.

**Mire épül.** Semmire. Hónapok az átfutása.

---

## 13. Az akkreditációs dokumentumfa és az első kérelem

> **A GÉPI FELE MEGVAN, A DOKUMENTUMOK NEM.** A 37 dokumentum és a 45
> ISO-kontroll adatként áll (`registry/mir/`), a felülvizsgálati motor fut, és
> az első kérelem kapuja az ELSŐ KÖRRE néz — a politikára, a kézikönyvre és a
> 14 minta-életciklus SOP-ra —, nem mind a 37 dokumentumra. Munkalap:
> `npm run mir`; 18 teszt. Részletek:
> [`fejlesztes/52-mir-dokumentumfa.md`](fejlesztes/52-mir-dokumentumfa.md).
>
> **Ami közben kiderült.** A megfelelési fejezet „hol tartunk” összegző táblája
> KÉZZEL gépelt számokat tartalmazott, és ELCSÚSZOTT: **45 kontrollsort
> 39-nek mondott**, és mind a négy kategória számai eltértek a felettük álló
> soroktól. Ez az a szám, amit egy auditor először néz meg. A mátrix mostantól
> adat, az összegzés belőle számolódik, és a teszt összeveti a fejezet
> táblájával — az eltérés soha többé nem maradhat észrevétlen.
>
> **Ami ebben a rétegben új:** a dokumentum LEJÁR, és a lejárat KASZKÁDOL. A fa
> saját szövege mondja ki, hogy a legtöbb minőségirányítási rendszer azon bukik
> el, hogy a dokumentumokat senki nem vizsgálja felül, és az audit két éve
> lejárt SOP-okat talál. Mostantól a lejárt dokumentum NEM hatályos — és a rá
> épülő ISO-kontrollok VELE EGYÜTT esnek ki. Ezt kézzel senki nem tartja számon.
>
> **És a fa saját szabálya, amit eddig semmi nem kényszerített ki:** minden
> SOP-hoz tartozik legalább egy űrlap vagy feljegyzés — hatályos SOP feljegyzés
> nélkül építési hiba, mert az auditnak nincs mit megmutatni.
>
> **Ami továbbra is nyitva van:** 0/37 dokumentum hatályban (ez a valóság, nem
> hiányosság: 12–18 hónap), és **45/45 kontroll mellett nincs megnevezett
> bizonyítékdokumentum**. Az auditor a bizonyíték oszlopot kéri, nem a
> megvalósítás oszlopot.

**Mit.** ISO 20387 (biobank) és a hozzá tartozó minőségirányítási váz.

**Reális átfutás: 12–18 hónap az első kérelemtől.** Ez a leghosszabb tétel az
egész projektben.

**Kész, ha.** A dokumentumfa felállt, a képzések megtörténtek, az első kérelem
beadva.

**Ki.** Minőségirányítási vezető.

**Mire épül.** Semmire.

---

## 14. Az EESZT- és HIS-csatlakozás engedélyeztetése

> **A GÉPI FELE MEGVAN, A CSATLAKOZÁS NEM.** Az öt beadandó űrlap (fejlesztői
> regisztrációs lap v4.1 · referenciaigazolás v2.2 · titoktartási nyilatkozat ·
> tokenkezelés · tanúsítványkezelés) adatként áll, 18 mezővel, és mindegyikről
> kiderül, KI tudja megválaszolni: 3 a rendszerből, 14 szervezeti, 1
> üzemeltetési. Munkalap: `npm run eeszt`; 19 teszt. Részletek:
> [`fejlesztes/54-eeszt-csatlakozas.md`](fejlesztes/54-eeszt-csatlakozas.md).
>
> **AMIÉRT EZ A LÉPÉS MÁS SÚLYÚ: a csatlakozás KIFELÉ ÍR.** Minden eddigi kapu
> azt védte, hogy a rendszer ne mondjon rosszat SAJÁT MAGÁNAK. Az EESZT-be
> küldött üzenet elhagyja a rendszert, és attól kezdve nem a miénk: a hibás
> belső bejegyzés javítható, az országos térbe küldött nem. Ezért a hitelesítés
> hiánya itt BELSŐ KOCKÁZATBÓL KÜLSŐVÉ válik — csatlakozás után a rendszer az
> országos nyilvántartásba írna egy olyan azonosító nevében, amit senki nem
> ellenőrzött. Ez nem fokozati különbség.
>
> **A szintetikus kapu FORDÍTVA olvasandó.** Ez az egyetlen bizonyíték a
> rendszerben, ami akkor „van meg”, amikor a rendszer NEM tud valamit: a
> kiszolgáló hitelesítés híján el sem indul. A megléte nem képesség, hanem
> BEISMERÉS — és amíg ott áll, országos nyilvántartásba nem küldhetünk. A
> teszt külön bizonyítja, hogy a kapu eltüntetése ÖNMAGÁBAN nem nyit
> csatlakozást.
>
> **Amit a beadás előtt látni kell.** A titoktartási nyilatkozat két állítása
> megnevezett kockázat: a titoktartás LEJÁRATI HATÁRIDŐ NÉLKÜL terhel (a
> rendszer egyetlen ilyen kötelezettsége — a megőrzési idők, a licencek, a
> MEES-tanúsítványok és a dokumentumfelülvizsgálatok mind lejárnak), és a
> Gyártó MENTESÍTI a Működtetőt minden adatvédelmi követeléssel szemben. Ezek
> a dossziéban állnak, nem egy PDF nyolcadik bekezdésében.
>
> **És egy sorrendi következmény:** a referenciaigazolás ÉLŐ használatot állít
> („jelenleg is használjuk”). Egy még nem használt rendszerre nem adható ki —
> tehát a 16. lépés (pilot) ELŐBB van, mint ez az űrlap.
>
> **Ami továbbra is nyitva van:** 2/4 kapu áll (auditnapló és a szintetikus
> kapu); a hitelesítés és az ágazati azonosító nem. A kitöltött űrlapok
> személyes adatot tartalmaznak (születési hely és idő, anyja neve) — sem a
> sablon, sem a kitöltött példány nem kerül a repóba.

**Mit.** A csatlakozás nem fejlesztési, hanem engedélyezési kérdés, és a
határidőket nem mi szabjuk.

**Kész, ha.** A kérelem beadva, a teszt-környezethez hozzáférés van.

**Ki.** Üzemeltetés + intézményi informatika.

**Mire épül.** 1. (Csatlakozni auditnapló nélkül nem lehet.)

---

# D hullám — a rendszer szervezetté válik

## 15. A riasztások címzettje és az eszkalációs rend

> **A GÉPI FELE MEGVAN, A LÁNCOK NEM.** A nyolc riasztástípus adatként áll
> (`registry/riasztas/eszkalacio.json`), a lánc motorja fut, és a kapu ZÁRVA:
> **0/8 riasztástípus adható ki, mind a nyolc címzett nélkül**. Munkalap:
> `npm run riasztas`; 17 teszt. Részletek:
> [`fejlesztes/53-riasztas-eszkalacio.md`](fejlesztes/53-riasztas-eszkalacio.md).
>
> **EZ AZ EGYETLEN KAPU A RENDSZERBEN, AMI MEGFORDUL.** Minden más kapu azt
> akadályozza meg, hogy rossz SZÁM jelenjen meg. Itt a hiányzó címzett azt
> akadályozza meg, hogy a rendszer EGYÁLTALÁN MEGSZÓLALJON — mert a címzett
> nélküli riasztás nem féltájékoztatás, hanem kiképzés az elkattintásra.
>
> **Ami közben kiderült.** Az `alertStatus()` a ki nem vett riasztásról azt
> mondta, hogy „magának is riasztást kell kiváltania, EGY SZINTTEL FELJEBB” —
> a típusban viszont nem volt semmi, ami megmondaná, mi van feljebb: egy
> címke, egy megjegyzés, egy percszám. A függvény kiszámolta, hogy a határidő
> letelt, visszaadott egy mondatot, és A MONDATON KÍVÜL SEMMI NEM TÖRTÉNT. A
> próza megígérte az eszkalációt, a szerkezet nem tudta hordozni.
>
> **A felület mérete az érv a lépés mellett:** 283 `redflag` jelölésű kódolt
> válasz, 15 kalkulátorsáv, 24 vörös zászlós panasztétel, 2 kérdőív-kritikus
> tétel — **324 riasztási pont, nulla címzettel**. Ha mind a 324 külön
> címzettet kapna, a rend használhatatlan lenne; ha egy sem kap, a rendszer
> néma marad. A címzett ezért a TÍPUSHOZ tartozik: abból nyolc van.
>
> **Öt állapot, és a negyediket ki kell mondani:** `nemAdhatoKi` · `kiadva` ·
> `atveve` (és rögzül, MELYIK szinten) · `eszkalalt` (a lánc időre, magától
> lép feljebb) · **`kimerult`** — a legfelső szint sem vette át. Ilyenkor a
> rendszer nem tehet többet, és épp ezért nem szabad úgy tennie, mintha szólt
> volna.
>
> **Ami továbbra is nyitva van:** mind a nyolc lánc. Ki: szülészeti
> osztályvezető. A nyolc hiány figyelmeztetés, nem építési hiba — megnevezett
> adósság —, de a kapu közben zárva.

**Mit.** Minden riasztáshoz kell: **megnevezett címzett**, **válaszhatáridő**,
és **átvételi nyugta**. A ki nem vett riasztás önálló állapot, aminek magának
is riasztania kell — egy szinttel feljebb.

**Miért nem fejlesztési feladat.** A kód készen áll (`alertStatus()`), de azt,
hogy **kinek szól** és **ki a következő szint**, csak a szervezet tudja
megmondani. És ez a lépés fontosabb, mint a küszöbök pontossága:

> A válaszút nélküli riasztás rosszabb a semminél. Aki naponta háromszor kap
> figyelmeztetést, amire nincs kihez fordulnia, két hét alatt megtanulja
> elkattintani — és akkor az igazit is elkattintja.

**Kész, ha.** Minden riasztástípushoz tartozik egy név, egy határidő és egy
eszkalációs szint, leírva.

**Ki.** Osztályvezető.

**Mire épül.** 9. **És a 9. kapuja addig nem nyílik ki, amíg ez nincs meg.**

---

## 16. Pilot egy osztályon, valódi adattal

**Mit.** Az első lépés, ami **beteg-azonosításra alkalmas adatot** érint.

**Előfeltétele nem egy dolog, hanem öt:** az 1. (tároló), a 10. (megőrzés), a
3. (adatvédelmi döntések), a 15. (riasztási rend) és legalább a 6–8. hitelesítés.
Egyik sem kihagyható, és ez nem óvatoskodás: mindegyik olyan hibát véd, ami
utólag nem javítható.

**Kész, ha.** Két hét éles használat után a rendszer nem veszített adatot, a
klinikusok nem kerülték ki, és van legalább egy dokumentált eset, ahol a
rendszer olyat mondott, amit a klinikus egyébként nem vett volna észre.

**Ki.** Egy osztály, egy vezetővel, aki vállalja.

**Mire épül.** 1, 3, 6, 7, 8, 10, 15.

> **A GÉPI FELE MEGVAN, A PILOT NEM INDULHAT.** A felkészültségi kapu él
> (`core/pilot/felkeszultseg.ts`, `registry/pilot/pilot.json`), a munkalap fut
> (`npm run pilot` → [`megfeleles/15-pilot.md`](megfeleles/15-pilot.md)), és a
> kapu **kizárólag a rendszer élő bizonyítékbázisából** nyílik — a
> nyilvántartásban nincs olyan mező, amit „kész”-re billentve el lehetne
> indítani (`test/pilot.test.ts`, 26 teszt). Ma **1/7 előfeltétel áll**.
>
> **Ami kiderült — a lépés felfedezése:** a lenyomatlánc a MÚLTAT köti meg, a
> VÉGÉT nem. Egy tíz bejegyzéses naplóból az utolsó ötöt letörölve a maradék
> lánc **hiánytalan**: a `verifyChain()`, a rejtjelezett `verifySealedChain()`
> és a `SecureCaseStore.read()` mind hibátlannak látja, és a csonkát
> megnyugtatóan felolvassa. Öt vajúdási bejegyzés hiányzik, és nem szól semmi.
> A `core/journal/types.ts` fejléce közben az ellenkezőjét állította („a
> levágott napló … eltöri a láncot”) — próza, amit a szerkezet nem tudott
> hordozni. Ezért a **horgony**: a napló vége, a naplón KÍVÜL rögzítve
> (`core/pilot/horgony.ts`), a tárolóba bekötve. **A pilot első elfogadási
> kritériuma enélkül nem volt mérhető, csak remélhető.**
>
> **Ami kiderült — az előfeltételekről:** a felsorolt öt **mind teljesülhet
> úgy, hogy a rendszer valódi adaton mégsem futhat**, mert a HITELESÍTÉS nincs
> köztük. A gépi fele ezért a tervbeli ötöt és a rendszer saját kapui által
> kikényszerített kettőt (hitelesítés, naplóhorgony) külön tartja, és mindkettőt
> megköveteli.
>
> **Ami kiderült — a záráskor:** a három elfogadási kritériumból ma **egy
> mérhető** (adatvesztés — a horgony óta), egynek **nincs nevezője** (a rendszer
> tudja, hány esetet rögzítettek benne, azt nem, hányat láttak el az osztályon),
> egy pedig **elérhetetlen**: amíg 0/8 riasztástípus kiadható, a rendszer meg sem
> szólal, tehát nem lehet olyan eset, ahol mondott valamit, amit a klinikus nem
> vett volna észre. **A hiányzó mérés sehol nem „teljesült”** — a mérhetetlen
> kritérium a végén magától teljesültnek látszana, ezért a validálás külön
> kimondja.
>
> **Ami emberre vár:** az osztály, a vezető, aki vállalja, a kezdődátum — mind
> `null` —, a fenti hét előfeltételből hat, és a nevező, amit az osztálynak kell
> adnia. Részletek: [`fejlesztes/55-pilot-horgony.md`](fejlesztes/55-pilot-horgony.md).

---

## 17. Az audit-hurok bekapcsolása

**Mit.** A kimeneteli lapok két mezője — *„A prenatális diagnózis
megerősítve?"* és *„UH diagnózis megerősítve"* — visszaköti a méhen belül
mondott állítást a megszületett igazsághoz.

**Enélkül a rendszer soha nem tudja meg, mennyire jó.** Minden normogram,
minden kockázati szám és minden modell csak addig ér valamit, amíg
visszamérhető ebben az intézményben, ezen a populáción.

**Kész, ha.** A pilot-esetekre lefut az összevetés, és van egy szám arra, hogy
az ultrahangos megítélés hányszor egyezett a szövettannal, illetve a
prenatális diagnózis a postnatalissal.

**Ki.** Fejlesztés + klinikai vezető.

**Mire épül.** 16.

> **A GÉPI FELE MEGVAN, AZ ESETEK NEM.** A hurok szerkezete él
> (`core/audit/hurok.ts`, `registry/audit/hurok.json`), a munkalap fut
> (`npm run audit` → [`megfeleles/16-audit-hurok.md`](megfeleles/16-audit-hurok.md)),
> és a közölhetőség kapuja zár (`test/audit.test.ts`, 17 teszt).
>
> **Ami kiderült — a lépés felfedezése:** a három audit-mezőnek **nem volt hova
> írnia**. Mindhárom ott állt a felülettérképen `outcomeAudit` jelöléssel, saját
> kapuval, saját döntési szabállyal és hosszú indoklással arról, hogy ez zárja
> be a rendszer legfontosabb körét — és mindháromban `variable: null`. A válasz,
> amit a klinikus beleír, sehol nem maradt volna meg. Ez a lépés „Kész, ha”-ja
> **számot** kér, és számot nem lehet olyan mezőből számolni, ami nem létezik.
> A három változó felvéve, a mezők bekötve, és a változó nélküli `outcomeAudit`
> mező ezentúl **hiba**.
>
> **Ami kiderült — a válasz alakjáról:** a *„megerősítve? igen/nem”* a
> **cáfolatot** és az **eldönthetetlenséget** ugyanabba a rekeszbe teszi, pedig
> az egyik azt jelenti, hogy a rendszer tévedett, a másik azt, hogy a referencia
> nem tudott dönteni. A felülettérkép saját jegyzete mondja ki, hogy a felületes
> endometriosis szövettani igazolása megbízhatatlan — ott az „eldönthetetlen”
> nem kivétel, hanem várható kimenet. 6 egyezés · 2 eltérés · 4 eldönthetetlen
> **helyesen 75%, összemosva 50%**: ugyanaz az adat, huszonöt százalékpont, és
> mindig lefelé. A változók ezért négyértékűek, az ötödik állapot pedig a
> hiányzó válasz, aminek nincs kódja.
>
> **Ami kiderült — a számról:** egy háromesetes mintából számolt 67% rosszabb,
> mint semmi. A hurok ezért soha nem ad ki puszta arányt, csak
> konfidenciaintervallummal (Wilson-féle, nem normál közelítés), és csak ha az
> esetszám, a sávszélesség és az eldönthetetlenek aránya mind engedi. Az arány
> nem közölhető esetben **`null`, nem 0** — az egyik mérés hiánya, a másik rossz
> eredmény.
>
> **Ami emberre vár:** a három küszöb (`minimumEset`, `maxBizonytalanSav`,
> `maxEldonthetetlenArany`) — klinikai és statisztikai döntés —, és maguk az
> esetek: azok a 16. lépésből jönnének, ami nem indulhat el. Részletek:
> [`fejlesztes/56-audit-hurok.md`](fejlesztes/56-audit-hurok.md).

---

## 18. A helyi normogramok: a rendszer önmagára záródik

**Mit.** A saját mérésekből generált `local` normogram: *mihez képest mérünk
MI, ITT?*

**Ez a projekt értelme egyetlen mondatban.** Idegen populáción tanított görbe
idegen választ ad. A saját populációból generált görbe a sajátot — és a
**hibrid nézet** mind a hármat egyszerre mutatja: ha a populációs szerint a 8.
percentilis, a személyre szabott szerint a 25., az más beszélgetés, mint ha
mindkettő a 3. alatt van.

**Kész, ha.** Legalább egy mérésre elegendő saját adat gyűlt össze, a `local`
görbe generálva, és a hibrid nézet a három választ egymás mellett adja.

**Ki.** Fejlesztés + biostatisztikus.

**Mire épül.** 16, 17.

> **A GÉPI FELE MEGVAN, A SAJÁT ADAT NEM.** A hibrid nézet mind a három
> olvasatot egymás mellett adja, a hiányzókat OKKAL, nem üres hellyel; a helyi
> réteg él (`core/us/helyi.ts`), a munkalap fut (`npm run helyi` →
> [`megfeleles/17-helyi-normogram.md`](megfeleles/17-helyi-normogram.md)),
> és a generálás inkább kihagy egy sávot, mint hogy két esetből számoljon
> szórást (`test/helyi.test.ts`, 18 teszt).
>
> **Ami kiderült — a lépés felfedezése:** a sávkapu **egy sávval elcsúszott**.
> A `minPerBin` kapuja megvolt, de a LEGKÖZELEBBI sáv elemszámát nézte,
> miközben az érték a két SZOMSZÉDOS sor KÖZÖTT interpolálódik. A demótáblában
> a 23. sáv nyolcvan esetes, a 24. húsz, a minimum ötven: egy **23,5 hetes
> mérés fele-fele arányban épült a kettőből, és mégis átment** — a visszaadott
> `n: 80` ráadásul azt állította, hogy nyolcvan eset áll mögötte. A ritka sáv
> nem a közepén kezd rontani, hanem ahol súlyt kap; a javítás mindkét befogó
> sávot nézi, és a kisebbik esetszámot adja vissza.
>
> **Ami kiderült — a demótábláról:** hat sávjában (x = 20, 24, 28, 32, 36, 40)
> húsz eset áll a saját maga deklarált ötvenes minimum mellett, és mind a hat
> közös sávja **ugyanabba az irányba** tér el a publikált Chitty-táblától,
> átlagosan **−0,34 szórásnyit**. Eddig egyik sem látszott sehol.
>
> **Ami kiderült — a kockázatról:** a rendszer önmagára záródása nem csak a cél.
> Ha az osztály ultrahangja rendszeresen nagyobbat mér, a helyi görbe ezt
> „normális”-ként rögzíti — és a **17. lépés audit-hurka a helyi görbéhez mérve
> TÖKÉLETES EGYEZÉST találna**. A rendszer önmagával egyezne, és éppen ezt
> hívná bizonyítéknak. Ezért a publikálthoz képesti rendszeres eltolás
> kimondása kötelező; hogy populációs különbség-e vagy mérési torzítás, azt gép
> nem dönti el.
>
> **Ami emberre vár:** a rendszeres eltolás megítélése aláírva, a sávminimum és
> a kizárási szabályok megválasztása, és maguk a mérések — azok a 16. lépésből
> jönnének, ami nem indulhat el. A generált tábla valódi betegadatból áll elő,
> ezért a helye `registry/normogramok/helyi/`, ami **nem kerül a repóba**.
> Részletek: [`fejlesztes/57-helyi-normogram.md`](fejlesztes/57-helyi-normogram.md).

---

## Amit ez a lista nem old meg

- **A 846 változó a tervezett ~4035-ből** — a katalógus feltöltése végigfut az
  egész listán, nem egy lépés.
- **A felülettérkép 1031 hiányzó mezője** — ebből 326 a 3. lépésben döntéssé
  válik, a többi fejlesztési munka.
- **A pénz és a létszám.** Ez a lista sorrendet ad, nem kapacitást; a
  `12-15-honapos-terv.md` 0. fejezete beszél a csapatról.

---

## A négy mondat, amit érdemes megjegyezni

1. **Egyetlen igazi blokkoló van** (1. lépés), a többi sorrend kérdése.
2. **A C-hullám az első naptól fut**, különben ő lesz a szűk keresztmetszet.
3. **A 9. kapuja a 15. nélkül ártalmas** — riasztást adni válaszút nélkül
   rosszabb, mint nem riasztani.
4. **A 17. és a 18. nélkül a rendszer sosem tudja meg, hogy jó-e.**
