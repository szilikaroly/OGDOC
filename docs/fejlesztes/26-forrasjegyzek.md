# 26 — Forrásjegyzék: mit adott, és mit nem adott meg minden forrás

> A rendszer minden kódtáblája és minden finanszírozási szabálya HIVATALOS
> forrásból származik. Ez a fejezet a forrásokat sorolja fel — de nem
> katalógusként, hanem **elszámolásként**: mit adott meg egy forrás, és
> ugyanolyan hangsúllyal, **mit nem**.

A forrásfájlok **nem kerülnek a repóba**. Nyilvános, havonta-évente frissülő
törzsek; a repó a belőlük **származtatott** táblát tartalmazza, a forrás
nevével, méretével, SHA-256 lenyomatával és a kinyerés dátumával
(`registry/kodok/manifest.json`). Enélkül egy retrospektív elszámolás nem
reprodukálható: nem derülne ki, **melyik kiadásból** dolgozott a rendszer.

```
letöltés → ingest → beágyazott JSON → build
```

## 1. Amiből tábla lett

| Forrás | Tábla | Amit MEGADOTT | Amit NEM ad meg |
|---|---|---|---|
| `BNOTORZS.DBF` (2025-01) | `tbl.bno`, 11 698 sor | a teljes BNO-10 magyar törzs **jelentési alakban**, nemmel, életkori tartománnyal, érvényességgel | a kereszt-csillag párok listáját (a jel megvan, a párosítás nem) |
| `MUTET_AP.DBF` (2026-02) | `tbl.mut`, 5 993 sor | a **fekvőbeteg beavatkozási törzs**, nemmel, életkorral, érvényességgel, a korábbi jelentéssel | a `FLAG` (T/F) jelentését — a mezőt átvesszük, következtetést nem vonunk le |
| `HBCS50.DBF` (2026-04) | `tbl.hbcs`, 780 sor | súlyszám, határnapok, közérthető csoportnév, P/M/S/Z minősítés, `*` intézeti kör | **a besorolási táblázatot** |
| `Hbcs50_torzs_2025*.xls` | `tbl.hbcs@2025-01-01`, `tbl.hbcs@2025-05-01` | a **korábbi kiadások** súlyszámai a visszamenőleges elszámoláshoz | ugyanaz |
| `FNOTORZS.DBF` (2019-10) | `tbl.fno`, 744 sor | az FNO (ICF) teljes törzse besorolási szemponttal | — |
| `torzslista_*.xlsx` (2026-01) | `tbl.oeno` pontérték-oszlopa | az OENO **pontértéke** — ez teszi elvégezhetővé a 9/2012 NEFMI 5. § (7) szerinti választást | — |
| `kompetencia_*.xlsx` (2026-01) | `tbl.oeno` szakma-oszlopa | OENO × szakma kompetencia gépi olvasatban | — |
| `teljes_szabalykonyv_*.docx` (9/2012 NEFMI) | `tbl.oeno`, `tbl.oeno.bno`, `tbl.oeno.egyutt`, `tbl.oeno.tele` | eljáráskód, kizárási és együtt-jelenthetőségi szabályok, a BNO-feltételes eljárások (4. melléklet) | — |
| `9jegyu_beutalasi_torzslista_*.xlsx` | `tbl.gyfkod`, 34 918 sor (helyi) | melyik intézmény melyik szakmára jogosult jelenteni | — (az **orvosneveket szándékosan elhagyjuk**) |
| `SnomedINTL_GPSRelease_*.zip` | `tbl.snomed`, 378 553 fogalom (**helyi**) | a Global Patient Set fogalomkészlete **angolul** | a **magyar megnevezéseket** |
| `Diagnosztikai_torzs_*.xls`, `MANYAGUJ_*.xlsx` | `tbl.diag`, `tbl.eszkoz` (helyi) | árjegyzékek | — (egyetlen levezetés sem hivatkozik rájuk) |

## 2. Amiből szabály lett, nem tábla

Két forrást **ember olvasott**, és a `registry/kodok/fekvo/` állományaiba írt
át. Ezek nem gépi kinyerések: jogszabályszöveget és technikai útmutatót
gépileg szabállyá alakítani megbízhatatlan. A lenyomatuk mégis a manifestben
van (`sourcesRead`) — enélkül nem derülne ki, melyik kiadásból való a szabály.

| Forrás | Ebből lett | Amit MEGADOTT |
|---|---|---|
| **10/2012. (II. 28.) NEFMI rendelet** (hatályos 2025-05-01) | `diagnozis-tipusok.json`, `szules-kodolas.json` | a diagnózis-típusjelek **számossága** és kötelezettsége (6-7. §); a `*`-os HBCs jelentése (20. § (3)); a **szülés kódolásának** három kötelező tétele (11. melléklet) |
| **NEAK: Fekvőbeteg jelentés — technikai útmutató** (2026-05) | `rekordkep.json` | a **746 bájtos jelentési rekord** mezőkiosztása: 16 diagnózis, 10 beavatkozás, `BNO_KOD` 5 karakter, `B_KOD` 5 karakter |

A rekordkép a kódalak kérdését **eldöntötte**, nem valószínűsítette: a
mezőhosszak összege pontosan 746, és ezt teszt őrzi
([`test/fekvojelentes.test.ts`](../../test/fekvojelentes.test.ts)). Amíg ez
nem volt meg, a rendszer ICD-9-CM alakú kódokat hordozott (`74.10`), amelyek a
magyar finanszírozásban értelmezhetetlenek.

## 3. Amiből nem lett semmi — és miért

Ez a szakasz ugyanolyan fontos, mint az előző kettő. Egy forrás, amit
„feldolgoztunk", de valójában nem adott semmit, **hamis teljességérzetet** kelt.

| Forrás | Miért nem lett belőle semmi |
|---|---|
| `2_Egészségügy finanszírozása` (2017, 49 oldal) | **Képként szkennelt** oktatási anyag: szövegréteg nélkül. Karakterfelismerés nélkül nem kinyerhető, és egy OCR-hibás finanszírozási szabály rosszabb a hiányzónál. |
| *A HBCS rendszer működési zavarai és azok megszüntetése* (IME, 2005) | **Szakcikk, nem normatív forrás.** A HBCS-rendszer torzításait elemzi; ebből szabályt vezetni azt jelentené, hogy egy szerző véleményét jogszabályként kezeljük. |
| *Egészségügyi Gazdasági Szemle* (2009/6) | Ugyanez: háttérirodalom, nem törzs és nem jogszabály. |

Az utóbbi kettő **olvasásra** hasznos — a HBCS-rendszer ismert torzításainak
megértéséhez —, de a kód egyetlen sora sem hivatkozhat rájuk.

## 4. Ami továbbra is hiányzik

A `missingStems()` ezt gépileg is felsorolja, hogy a felületen látszódjon:

| Hiányzó | Következmény |
|---|---|
| **HBCS besorolási táblázat** (10/2012 NEFMI 2. melléklet, gépi alakban) | A rendszer HBCS-csoportot **nem állapít meg**. A súlyszámot, a határnapokat és a minősítést egy **már ismert** csoporthoz adja meg. |
| **SNOMED CT magyar megnevezések** | A rendszer SNOMED-azonosítót ajánl, megnevezést **angolul** ad. Magyar alakot nem talál ki: a fordítás validált eljárást kíván (SNOMED International: *Guidelines for Translation of SNOMED CT*). |
| **A `*`-os HBCs intézeti kompetencialistája** (R. 4. melléklet) | A rendszer megmondja, hogy a csoport intézeti körhöz kötött, de azt nem, hogy az adott intézet jogosult-e rá. |

## 5. A SNOMED külön úton jár — licencből

A Global Patient Set **CC BY-ND 4.0** alatt jelenik meg: másolni és
**változatlanul** továbbadni szabad, az **átalakított** változat terjesztése
nem. A mi JSON táblánk átalakítás. Ezért:

- a SNOMED tábla a `registry/kodok/helyi/` könyvtárba készül, ami a
  `.gitignore`-ban van: **helyben települ, és soha nem kerül a repóba**;
- a repó legfeljebb SNOMED-**azonosítókat** tartalmaz kereszthivatkozásként,
  a fogalomkészletet nem;
- `validateSnomedDistribution()` **build-hibát** ad, ha SNOMED-tábla kerül a
  terjesztett könyvtárba.

Az **azonosító szerkezeti ellenőrzése** viszont licenc és hálózat nélkül is
elvégezhető: a SNOMED-azonosítónak Verhoeff-ellenőrzőjegye van, és a
partíciós jegypár megmondja, fogalmat, leírást vagy kapcsolatot azonosít-e
(`core/coding/sctid.ts`, a SNOMED International hivatkozási megvalósítása
szerint: `IHTSDO/snomed-database-loader`). A betöltött kiadás mind a 378 553
azonosítója átmegy rajta.

Ez a két ellenőrzés **különböző dolgot állít**, és mindkettőre szükség van:

| Ellenőrzés | Mit állít | Mihez kell |
|---|---|---|
| szerkezeti (`sctid.ts`) | „ez a szám **lehet** SNOMED-azonosító" | semmi — se licenc, se hálózat |
| készletbeli (`snomed.ts`) | „ez az azonosító **ezt** a fogalmat jelöli" | a betöltött kiadás |

A megkülönböztetés nem elméleti. A rendszernek volt egy hibája, amit a
szerkezeti ellenőrzés **nem** fogott volna meg: az emlékezetből beírt
`41633001` érvényes azonosító — csak nem a HELLP-é, hanem az *Intraocular
pressure* fogalomé. Ezért marad kötelező a `snomedVerified` mező.

## 6. Külső terminológiaszolgáltatás — miért nem használjuk (még)

Felmerült egy külső SNOMED-kereső szolgáltatás (omophub) bevonása. Ez a
fejlesztői környezetből **nem érhető el**: a kimenő hálózati házirend a
`github.com`-on és a csomagtárakon kívül minden célt visszautasít, és ezt a
proxy egyértelműen jelzi (`connect_rejected`, szervezeti házirend). Ugyanez
vonatkozik a SNOMED International saját böngészőjének API-jára
(`browser.ihtsdotools.org`) is.

Ezért a réteg **nem tartalmaz nem tesztelhető HTTP-klienst**. Egy olyan
adapter, ami sosem futott le, nem funkció: hamis készenlét.

Ha a szolgáltatást használni akarjuk, három feltétel kell, ebben a sorrendben:

1. a környezet hálózati házirendje engedje a célgazdát;
2. a kulcs **környezeti változóból** jöjjön (`OMOPHUB_API_KEY`), és **soha ne
   kerüljön a repóba** — ugyanaz a szabály, mint a beteg-azonosítókra;
3. a válasz ugyanazon a kapun menjen át, mint a helyi készlet: a
   **főhierarchia** ellenőrzése és a **kötelező forrásmegjelölés** külső
   forrásnál sem hagyható el, magyar megnevezést pedig egy kereső sem tesz
   validált fordítássá.

> **Kulcskezelés.** Ha egy API-kulcs beszélgetésben, jegyben vagy commitban
> egyszer megjelent, azt **elveszettnek kell tekinteni**, és vissza kell vonni.
> A jelen munkához átadott kulcs nem került fájlba és nem került a repóba.

## 6/b. DÖNTÉS: magyar SNOMED-megnevezést NEM adunk

*A `13-18-lepes.md` 2. lépése ezt a döntést kifejezetten leíratja, „hogy fél
év múlva ne kezdje el valaki”. Ez az a hely.*

**A rendszer SNOMED-azonosítót ajánl, magyar megnevezést nem.**

Nem beszerzési kérdés, hanem szakmai:

1. A SNOMED CT fordítása **validált eljárást** kíván (SNOMED International:
   *Guidelines for Translation of SNOMED CT*): kétirányú fordítás, szakmai
   lektorálás, fogalmi egyeztetés. Egy rögtönzött magyar alak **nem SNOMED** —
   csak úgy néz ki.
2. Egy hibás megnevezés **rosszabb az angolnál**: az angol mellett a klinikus
   utánanéz, a magyarosnak látszó mellett nem.
3. Ugyanaz a kapu, mint a **validált kérdőíveknél** (`inst.*`): ott sem
   fordítunk, hanem megvárjuk a licencelt, validált tételszöveget.

**Ami ebből következik a felületre.** A SNOMED-azonosító mellett az **angol**
megnevezés jelenik meg, a nyelvi réteg forrásnyelv-jelölésével (`33-nyelvek.md`)
— nem magyarul, és nem gépi fordításban.

**Mikor változna ez meg.** Ha a magyar fordítás hivatalos, validált kiadásként
elérhetővé válik, a `tbl.snomed.hu` betölthető, és a `missingStems()` üresre
fogy. Addig ez az egyetlen nevesített hiányzó törzs — és tudatosan az.

## 7. Amit az IHTSDO nyilvános tárolóiból átvettünk

A SNOMED International (IHTSDO) GitHub-tárolói **elérhetők**, és egy dolgot
adtak, ami licenc és hálózat nélkül is használható: a
**Verhoeff-ellenőrzőjegy** hivatkozási megvalósítását
(`IHTSDO/snomed-database-loader`, `PostgreSQL/Verhoeff.sql`). Ebből lett a
`core/coding/sctid.ts`.

Amit **nem** vettünk át: a betöltő szkriptek (MySQL, PostgreSQL, Neo4j,
DuckDB) a teljes RF2 kiadás adatbázisba töltésére valók. A rendszer nem
adatbázisba tölt, és nem a teljes RF2-t használja, hanem a GPS-t — ezekre
tehát nincs szükség, és a bemásolásuk csak azt sugallná, hogy több van, mint
amennyi.

---

## Az exportcsomag és a licencek

A `npm run csomag` a teljes forrástárat egyetlen zip-be teszi — a
verziótörténettel és a beszerzett elsődleges forrásokkal együtt. **Az
alapértelmezés a bevétel**, és ami korábban kizárt volt, most bekerül; a
jegyzék viszont megőrzi, miért állt a kizárási listán.

**Egyetlen tétel marad ki**, és nem ízlés kérdése: a
`registry/kodok/helyi/tbl-snomed.json`. A SNOMED CT Global Patient Set licence
**CC BY-ND 4.0** — a „NoDerivatives” kikötés a származtatott mű
*terjesztését* tiltja. A tábla helyben újraépíthető az eredeti kiadásból, és a
csomag ehhez a leírást és a lenyomatot viszi, a tartalmat nem. Ez ugyanaz a
szabály, amit a `validateSnomedDistribution()` build-hibaként kényszerít ki.

A csomagolás **leáll**, ha betegadat-gyanús fájlnevet talál. Ez nem kihagyás:
egy ilyen fájl jelenléte azt jelenti, hogy valami eleve rossz helyre került.
