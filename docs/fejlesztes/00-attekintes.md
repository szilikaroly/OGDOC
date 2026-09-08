# 00 — Fejlesztői dokumentáció: áttekintés

Ez a fa a **fejlesztőnek** szól, nem a döntéshozónak. A „mit és miért" a `docs/`
gyökerében van; itt az van, hogy **hogyan**, mezőnként és függvényenként.

## A dokumentumok

| Fájl | Mire ad választ | Generált? |
|---|---|---|
| [`01-core-api.md`](01-core-api.md) | Mit tud a mag, milyen szerződésekkel, hol lehet bővíteni | nem |
| [`02-web-architektura.md`](02-web-architektura.md) | Rétegek, adatmodell, hitelesítés, sorszintű szabályok, telepítés | nem |
| [`03-web-csontvaz.md`](03-web-csontvaz.md) | A futtatható webes csontváz és az út a végleges stackig | nem |
| [`04-modul-csontvaz.md`](04-modul-csontvaz.md) | Mit kell EGY modulnak leszállítania, hogy késznek számítson | nem |
| [`05-mezokatalogus.md`](05-mezokatalogus.md) | Mezőnévadás, kötelező tulajdonságok, a katalógus jelen állása | részben |
| [`06-freetext-feloldas.md`](06-freetext-feloldas.md) | Minden szabad szöveges mező, és mire cseréljük | nem |
| [`07-kalkulatorok.md`](07-kalkulatorok.md) | Minden képlet tételesen: bemenet, sáv, forrás, állapot | **igen** |
| [`08-ai-csatolasi-pontok.md`](08-ai-csatolasi-pontok.md) | Hol kapcsolódhat AI, milyen szerződéssel és korláttal | nem |
| [`09-bovitesi-lehetosegek.md`](09-bovitesi-lehetosegek.md) | Mit lehet ráépíteni, mi mennyibe kerül, mi a kockázata | nem |
| [`10-click-open.md`](10-click-open.md) | **Hogyan lesz a strukturált bevitel gyorsabb a gépelésnél**: click-open, betegtájékoztató, javaslatok, beteg-oldali felvétel | nem |
| [`11-lefedettseg.md`](11-lefedettseg.md) | **A katalógus feltöltésének állása** modulonként, és a feltöltés sorrendje | **igen** |
| [`12-peldany-dimenzio.md`](12-peldany-dimenzio.md) | **Ugyanaz a mező több alanyra** (panasz, rokon, készítmény, minta) és a panaszszótár | nem |
| [`13-referenciatartomanyok.md`](13-referenciatartomanyok.md) | **A nyers számból klinikai olvasat**: trimeszter-referencia, normogram, szűrési esedékesség | nem |
| [`14-gyogyszereles-kapuk.md`](14-gyogyszereles-kapuk.md) | **A kapu, ami ténylegesen megáll**: kontraindikáció, indoklással megkerülhető, adagolás | nem |
| [`15-merokeszulekek.md`](15-merokeszulekek.md) | **Validált mérőeszközök**: licenc-kapu, kritikus tétel, kontextusfüggő vágóérték, és miért nincs PPP-szám | nem |
| [`16-epikrizis.md`](16-epikrizis.md) | **Okoslelet — a hiány is állítás**: visszavezethető narratíva öt stílusban, és mi NEM hiány | nem |
| [`17-szuloszoba.md`](17-szuloszoba.md) | **A szám, ami nem valószínűség**: melyik score van kapu mögött, a CORI 0-s szintje, a partogram-vonal feltevése | nem |
| [`18-muto.md`](18-muto.md) | **Az egyetlen kapu, ami dokumentációra zár**: WHO-lista, OENO-kódajánlás, és a hiba, amit a validátor talált | nem |
| [`19-onkologia.md`](19-onkologia.md) | **A kód, ami megmaradt, de mást jelent**: verziózott kódlista, és a kapu, ami a beszélgetést kényszeríti ki, nem a döntést | nem |
| [`20-ellatas-tervezes.md`](20-ellatas-tervezes.md) | **A padló, amit sűríteni lehet, ritkítani nem**: rizikó szerinti vizitrend indoklással, és miért nem alacsony kockázat a hiányzó adat | nem |
| [`21-zarojelentes.md`](21-zarojelentes.md) | **Az üres rubrika néma állítás**: hiány kimondva, a hitelességi kapu, ami ma mindenkinél zárva, és a UCUM-kód a papíron | nem |
| [`22-utankovetes.md`](22-utankovetes.md) | **Hat hiány, ami nem ugyanaz**: ICHOM-export kategóriákkal, a nevező, ami nélkül a mutató hízeleg, és a megfigyelési idő | nem |
| [`23-prom.md`](23-prom.md) | **Tíz eszközből egy vehető fel**: a beteg válaszát a klinikus nem írhatja felül, a tükör, és az index, amit nem számolunk | nem |
| [`24-kodolas.md`](24-kodolas.md) | **A kód az adat következménye**: elnyomási lánc indoklással, a táblakereséses levezetés, és a HBCS, amit nem sorolunk be | nem |
| [`25-finanszirozas.md`](25-finanszirozas.md) | **Teljes kódolás, nem felülkódolás**: hivatalos HBCS- és OENO-törzsek, kizárásos ütközés, és a rangsor, ami csak elrendez | nem |
| [`26-forrasjegyzek.md`](26-forrasjegyzek.md) | **Mit adott, és mit nem adott meg minden forrás**: a törzsek elszámolása, a licencből következő szerkezet, és amiből szándékosan nem lett semmi | nem |
| [`27-fekvobeteg-jelentes.md`](27-fekvobeteg-jelentes.md) | **A rekordkép mint kapu**: a 746 bájtos jelentési rekord, a diagnózis-típusjelek számossága, és a szülés kódolásának kötelező tételei | nem |
| [`28-forrasrendszer-terkep.md`](28-forrasrendszer-terkep.md) | **A meglévő rendszer, mint mérték**: 265 publikált normogram-görbe, 52 felületi szakasz, 302 mező — és ami NEM vehető át változatlanul | nem |
| [`29-kulso-repok.md`](29-kulso-repok.md) | **Három külső repó, három tanulság**: a helyi modell hatóköre, a betegnyelv két útja, és a negatív minta — jelszó a README-ben, adatbázis a repóban | nem |
| [`30-core-fejlesztes.md`](30-core-fejlesztes.md) | **A mag fejlesztése**: alapok és nem-célok, a KÉT napló szétválasztása, mit mérünk lefedettség helyett, a mért sebességek a beavatkozás előre kimondott triggerével, és az élő mentés négy szintje | nem |
| [`31-elo-mentes.md`](31-elo-mentes.md) | **A napló mint rekord**: lenyomatlánc négy romlással és négy teendővel, mit jelent az, hogy „mentve”, a lemaradás mint klinikai adat, a sírkő, ami túléli a tömörítést, a helyreállítási próba mért idővel — és öt végigjátszott hibaforgatókönyv | nem |
| [`32-titkositas.md`](32-titkositas.md) | **Titkosítás és kulcskezelés**: a boríték három szintje, a kötés, amitől a rekord nem helyezhető át, a KRIPTOGRÁFIAI TÖRLÉS mint válasz a módosíthatatlan másolatra, az M-ből N letét három hibája, és a feszültség, amit csak eldönteni lehet | nem |
| [`33-nyelvek.md`](33-nyelvek.md) | **A hiányzó fordítás nem forrásnyelvi szöveg, hanem MEGJELÖLT forrásnyelvi szöveg**: nyelvi lefedettség, a néma visszaesés tilalma | nem |
| [`34-tarolo.md`](34-tarolo.md) | **A tároló**: perzisztencia, jogosultság három rétegben, auditnapló az adat előtt, a két hasítólánc | nem |
| [`35-hbcs-besorolas.md`](35-hbcs-besorolas.md) | **A besorolási tábla a rendeletből**: 773 csoport, a szabálynyelv értelmezése, és amit a rendszer NEM sorol be | nem |
| [`36-dontesek.md`](36-dontesek.md) | **A 326 szabály döntéssé tétele**: 38 szabály, a hiányzó döntés sehol nem „átvesszük”, az aláírás lenyomathoz kötve | nem |
| [`37-dontes-allokacio.md`](37-dontes-allokacio.md) | **Ki mit visz**: felelős, aláírói kör, 6 ülés — szerepenként, ülésenként, sorrendben | **igen** |
| [`38-anamnezis-gerinc.md`](38-anamnezis-gerinc.md) | **Az anamnézis-gerinc**: mi számít „további kérdésnek”, a CMQCC vérzési modul, és a rögzített „nem tudom”, ami „nem”-mé vált | nem |
| [`39-teljes-eset.md`](39-teljes-eset.md) | **Egy teljes eset a két kimenettel**: a mért érték megítélése, és a megfordított kritikus sáv, amit a demó hozott felszínre | nem |
| [`40-web-tarolo.md`](40-web-tarolo.md) | **A webes réteg a tárolón**: mi lett éles, és miért nem indul el a kiszolgáló hitelesítés nélkül | nem |
| [`41-torles.md`](41-torles.md) | **A DPO törlési felülete**: a kapuk, a kétágú visszavonás, a tanúsítvány — és miért akad el ma minden törlés | nem |
| [`42-kulso-protokollok.md`](42-kulso-protokollok.md) | **Mit jelent „integrálni” egy külső protokollt**: a négy állapot, a licenckapu a hitelesítés ELŐTT, és a be nem szerezhető BCNatal-forrás | nem |
| [`43-kalkulator-katalogus.md`](43-kalkulator-katalogus.md) | **Kilenc kalkulátor, egy R-csomag**: a harmadik licenceset (copyleft), a tétel, ami ELVESZ egy kalkulátort, és három saját hiány, amit a katalógus hozott felszínre | nem |
| [`44-gyermeknogyogyaszat.md`](44-gyermeknogyogyaszat.md) | **A nőgyógyászat almodulja**: a tükrös feltárás tilalma pubertás előtt, a titoktartás határa, és az EGYETLEN hely, ahol a meg nem kérdezés maga a hiba | nem |
| [`45-referencia-hitelesites.md`](45-referencia-hitelesites.md) | **A 6. lépés gépi fele**: az aláírás a SZÁMOKHOZ kötve, a kapu, amit jelöléssel nem lehet kinyitni, és a két sáv, ami soha nem szólalt meg | nem |
| [`46-normogram-telepites.md`](46-normogram-telepites.md) | **A 7. lépés gépi fele**: melyik tíz görbét telepítsük és miért, a konvenció, ami egy irányba téved — és az összehasonlítás, ami sosem volt igaz | nem |
| [`47-kalkulator-hitelesites.md`](47-kalkulator-hitelesites.md) | **A 8. lépés gépi fele**: az egység a lenyomatban, a pontsor, ami lefelé lép — és a 36 öröklött hitelesítés, megnevezve | nem |
| [`48-szepszis-kuszob.md`](48-szepszis-kuszob.md) | **A 9. lépés gépi fele**: két forrás két száma levezetve (nem prózából), a kapu, amit eddig két szó nyitott — és a küszöb, ami alapvonalat ígér, de abszolút számhoz mér | nem |
| [`49-megorzes.md`](49-megorzes.md) | **A 10. lépés gépi fele**: a megőrzési idő, amit a rendszer kiírt, de sosem számolt ki — és a visszafordíthatatlan törlés egyetlen kapuja, egy begépelt évszám | nem |
| [`50-ett-dosszie.md`](50-ett-dosszie.md) | **A 11. lépés gépi fele**: a beadvány minden tétele állítás egy bizottságnak — és ami nincs fedezve, az nem hiányos melléklet, hanem valótlan állítás | nem |
| [`51-meroeszkoz-licenc.md`](51-meroeszkoz-licenc.md) | **A 12. lépés gépi fele**: a kétkimenetű lezárás (licenc vagy leírt „nem használjuk”), az egyetlen igazolás, ami lejár — és egy teszt, ami rossz okból volt zöld | nem |
| [`52-mir-dokumentumfa.md`](52-mir-dokumentumfa.md) | **A 13. lépés gépi fele**: az összegző tábla, ami 45 sorból 39-et mondott, a dokumentum, ami lejár — és a kontroll, aminek bizonyítéka van, nem állapotjele | nem |
| [`53-riasztas-eszkalacio.md`](53-riasztas-eszkalacio.md) | **A 15. lépés gépi fele**: az egyetlen kapu, ami megfordul — 324 riasztási pont, 0 címzett, és a próza, ami eszkalációt ígért egy szerkezetben, ami nem tudta hordozni | nem |
| [`54-eeszt-csatlakozas.md`](54-eeszt-csatlakozas.md) | **A 14. lépés gépi fele**: az első kapu, ami nem befelé véd — a csatlakozás kifelé ír, és a szintetikus kapu, ami fordítva olvasandó | nem |
| [`55-pilot-horgony.md`](55-pilot-horgony.md) | **A 16. lépés gépi fele**: a lánc, ami a múltat köti meg, de a végét nem — a levágott napló ép láncnak látszik, és a horgony, ami ezt megnevezi | nem |
| [`56-audit-hurok.md`](56-audit-hurok.md) | **A 17. lépés gépi fele**: a rendszer legfontosabb köre, aminek nem volt hova írnia — három `outcomeAudit` mező változó nélkül, és a kétértékű válasz, ami 75%-ot 50%-nak mutatna | nem |
| [`57-helyi-normogram.md`](57-helyi-normogram.md) | **A 18. lépés gépi fele**: a rendszer önmagára záródása — a sávkapu, ami egy sávval elcsúszott, és a rendszeres eltolás, amitől a rendszer a saját torzításához mérné magát | nem |
| [`58-exassist.md`](58-exassist.md) | **A 28. modul gépi fele**: a nem dokumentált vizsgálati rész nem normális vizsgálati rész — a lezárási kapu, és a bővítő réteg, ami csak hozzáadhat | nem |

## Az egy szabály, ami a többit magyarázza

**A regiszter az egyetlen igazság.** Nem konfigurációs fájl a kód mellett — a
rendszer *belőle épül*:

```
registry/variables/NN-modul.json   a változók definíciója, MODULONKÉNT
registry/documents/*.json          a dokumentumtípusok definíciója
core/calc/defs.ts                  a képletek definíciója
        │
        ├──▶ űrlap             buildFormSpec()      — nincs kézzel írt mező
        ├──▶ dokumentáció      fieldDoc()           — nincs kézzel írt meződoksi
        ├──▶ validáció         setValue()           — nincs mezőnkénti if
        ├──▶ keresztfeltöltés  DerivationGraph      — nincs kézzel írt „ez ezt tölti"
        ├──▶ számítás          runCalc()            — nincs párhuzamos képlettábla
        ├──▶ dokumentum        readiness()          — nincs kitöltetlen sablonhely
        ├──▶ export            FHIR / ICHOM         — nincs kézzel írt leképezés
        └──▶ tesztek           golden               — a szabályokra, nem a mezőkre
```

Ennek a gyakorlati következménye, amit minden fejlesztőnek fejben kell tartania:

> **Ha egy új változó felvételéhez kódot kell írni, valamit rosszul csináltunk.**

A webes réteg `app.js`-e ezt bizonyítja: **egyetlen mezőnevet, egységet,
tartományt vagy kódlistát sem tartalmaz**, mégis a teljes űrlapot rendereli,
levezetéssel és validációval együtt.

## Hol tartunk

A számokat és a rétegenkénti állapotot **nem itt** tartjuk karban:
[`../14-allapot.md`](../14-allapot.md) generált, és minden száma a forrásból
jön. A tizennyolc lépés sorrendje és állása:
[`../13-18-lepes.md`](../13-18-lepes.md).

Teljes exportcsomag — a forrástár a verziótörténettel és a beszerzett
forrásokkal együtt, jegyzékkel és a kihagyások indoklásával: `npm run csomag`.

## Amit a rendszer soha nem tesz meg

Ez a hat tiltás végigfut az egész dokumentáción. Ha valahol ellentmondást
találsz, a tiltás nyer:

| Tiltás | Hol kényszerül ki | Miért |
|---|---|---|
| **Nincs néma helyettesítés** | `runCalc` | Hiányzó bemenetre a 0 hamis megnyugtatás. |
| **Nincs ellenőrizetlen együttható** | `runCalc` | A fullPIERS fordítva viselkedett; kapu nélkül számot mutatott volna. |
| **Nincs eredet nélküli érték** | `setValue` | Ki mondta, mikor, mennyire biztosan — enélkül az adat nem auditálható. |
| **Nincs kézzel írt levezetési lista** | `DerivationGraph` | A kézzel karbantartott „ez ezt tölti" lista fél éven belül hazudik. |
| **Nincs állítás arról, amit nem vizsgáltak** | `effectiveFinding` | A nem rögzített lelet nem ugyanaz, mint a normálisnak talált. |
| **Nincs törlés elsődleges jogi megerősítés nélkül** | `deletable` | A törlés visszafordíthatatlan; és a beteg még kikérheti a dokumentációt. |

## Állapot

> **A SZÁMOK ITT NEM A FORRÁS.** Ez a tábla kézzel írt, és egyszer már
> hazudott: „167 változó" és „14 kalkulátor" állt benne, amikor a rendszerben
> 872 és 43 volt, a perzisztencia és a jogosultság pedig „nincs"-ként szerepelt,
> jóval azután, hogy mindkettő elkészült. Az élő számokat a **generált**
> [`../14-allapot.md`](../14-allapot.md) adja (`npm run docs`); ha a kettő
> eltér, az a generált nyer.

| Réteg | Állapot |
|---|---|
| Mag (regiszter, levezetés, kalkulátorok, űrlapgenerálás) | **működik** |
| Kalkulátorok | **43** definiálva, ebből **7 kapu mögött** (ellenőrizetlen konstans) |
| Változók | **872** a regiszterben a tervezett ~4035-ből, modulonkénti fájlokban |
| Click-open leletminta | **működik**: öt állapot, lépésenként nyíló részletező lánc |
| Betegtájékoztató és javaslatok | **generálódik** a rögzített leletből |
| Beteg-oldali felvétel | **megerősítési kapuval**, a precedencia legalján |
| Dokumentumtípusok | **14 ellátási dokumentum**, jogszabályi megőrzési idővel és két törlési kapuval |
| Webes csontváz | **fut** (`npm run web`), **tartós tárolóval**, hitelesítés nélkül |
| Perzisztencia | **működik**: hasítóláncos napló, borítéktitkosítás, horgonyozott naplóvég (`core/store/`, `core/journal/`, `core/crypto/`) |
| Jogosultság, audit | **működik**: ellátási kapcsolathoz kötött hozzáférés, auditnapló, kriptográfiai törlés (`core/store/hozzaferes.ts`, `core/log/`) |
| Hitelesítés | **nincs** — és ez a rendszer egyetlen igazi blokkolója: a kiszolgáló `OGDOC_SYNTHETIC=1` nélkül el sem indul |
| Interoperabilitás | **dosszié készen** (`core/eeszt/`), **éles csatlakozás zárva** — a hitelesítés hiánya miatt |

A lefedettség mechanikus munka; a helyesség nem az. Ez a dokumentáció végig az
utóbbit bizonyítja.
