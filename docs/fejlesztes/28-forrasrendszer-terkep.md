# 28 — A meglévő rendszer, mint mérték

> Egy tizenöt éve használt szülészeti-fetalis medicina rendszer menüfája,
> adatlapjai és görbekatalógusa nem képernyőkép-gyűjtemény. Azt mondja meg,
> **mit kell tudni** — a szakma által kitaposott szerkezetben.
>
> Ez a fejezet arról szól, hogyan lesz ebből **mérték**: lefedettség, hiánylista
> és — ami a legfontosabb — annak a megnevezése, ami a régi felületről **nem
> vehető át változatlanul**.

## 1. Két térkép, egy elv

| Térkép | Mit ír le | Hol |
|---|---|---|
| **Normogram-katalógus** | 265 publikált görbe 119 mérésre, mérési konvencióval és populációval | `registry/normogramok/katalogus.json` |
| **Felülettérkép** | 52 menüszakasz, 11 adatlap, 302 mező | `registry/felulet/szuleszeti-felulet.json` |

Az elv mindkettőnél ugyanaz: **a hiány mértéke csak akkor látszik, ha a
teljesség listája megvan.** Egy „~4035 tervezett változó" szám nem terv; egy
szakaszonkénti hiánylista az.

Mindkét térkép **részleges**, és mindkettő **megnevezi a lyukait**. Egy
katalógus, ami hallgat a hiányairól, teljesnek látszik — és ez rosszabb, mint
ha nem lenne.

---

## 2. A normogram-katalógus: egy harmadik szint

A rendszerben eddig **két** szint volt, és a köztük lévő különbség a
[`07-normogram`](07-normogram.md) fejezet lényege. A katalógus egy **harmadikat**
ír le, a kettő **előttit**:

| Szint | Mit jelent | Ad-e percentilist |
|---|---|:--:|
| **Katalogizálva** | tudjuk, hogy létezik ilyen publikált görbe, és tudjuk, melyik közleményben — **de a tábla nincs meg** | nem |
| **Telepítve** | a tábla be van töltve (adminisztratív lépés) | nem |
| **Hitelesítve** | szakmai felelősség névvel és dátummal | **igen** |

```
265 katalogizált görbe 119 mérésre · 3 betöltve · 0 hitelesített
```

Egy hasi körfogathoz **19 publikált görbe** létezik; a rendszerben ebből egy van
betöltve, és az sem hitelesített. E nélkül a szint nélkül ez a hiány
**láthatatlan**: úgy tűnne, hogy „van AC-görbe", és nem derülne ki, hogy
tizennyolc másik létezik, amelyik ugyanarra a magzatra más percentilist adna.

### A mérési konvenció, ami nem részlet

A katalógus egy második dolgot is láthatóvá tesz, ami a görbék puszta
felsorolásából nem tűnik fel: **ugyanahhoz a méréshez tartozó két görbe más
mérési konvencióra épül.**

A BPD-t mérni lehet **külső-belső** és **külső-külső** él között, és a
Chitty 1994 **mindkettőre** ad görbét. A kettő közt milliméterek vannak — a
felcserélésük nem elírás, hanem **néma percentilis-eltolódás**.

A konvenció-érzékenységet nem beleégetett lista dönti el, hanem **maga a
katalógus**: ha egy mérésre kétféle konvencióval is publikáltak görbét, akkor a
konvenció számít — és akkor **az a görbe is bizonytalan, amelyik nem mondja
meg, melyikkel készült.**

```
BPD, külső-belső méréssel:   2 alkalmazható · 15 eldönthetetlen · 5 nem illik
```

A 15 „eldönthetetlen" nem hiba: **teendő**. Ezeket a közleményből kell
tisztázni, és addig nem választhatók biztonsággal.

### Ugyanaz a kapu négyszer

| Jellemző | Mi történik, ha hiányzik |
|---|---|
| **populáció** (egyes · DCDA · MCDA) | `undetermined` — az iker növekedése **más**, nem rosszabb |
| **mérési konvenció** | `undetermined` — csak ott, ahol a katalógus szerint számít |
| **terhességi kor** | az első trimeszteri görbék elhatárolásához |
| **nem** | a nemhez kötött születési görbéknél |

És mindenütt ugyanaz a mondat: **a hiányzó jellemző nem „megfelel", hanem
eldönthetetlen.**

### Amit a forrásrendszer választása jelent — és amit nem

A katalógusban 137 görbe van bejelölve abban a rendszerben, ahonnan származik.
Ez **adat**: azt mondja meg, mit használnak. **Nem hitelesítés.** A mi
hitelesítettjeink száma továbbra is nulla, és ez így helyes: a kapu előbb van,
mint az adat.

---

## 3. A felülettérkép: lefedettség modulonként

```
52 felületi szakasz · 23 adatlap · 636 mező
   13 anatómiai szervrendszer · 152 nevesített rendellenesség
```

A mezők mérlege:

| Státusz | Mennyi | Mit jelent |
|---|---:|---|
| **megvan** | 29 | van hozzá regiszterbeli változó |
| **levezetett** | 32 | nálunk számított, a régi felületen kézzel töltendő |
| **kapu** | 29 | nem mező, hanem feltétel — ld. 14. szakasz |
| **nem vehető át változatlanul** | 12 | a rendszer szabályaiba ütközik |
| **interfészből** | 12 | HL7 v2 ADT/ORM |
| **mérési körülmény** | 9 | az értékkel együtt tárolandó |
| **hiányzik** | 513 | ez a backlog |

| Modul | Felületi szakasz | Változó |
|---|---:|---:|
| 5 — Vizsgálatok (ebből 12 ultrahang) | 20 | 214 |
| 11 — Műtő és beavatkozások | 11 | 51 |
| 3 — Anamnézis | 6 | 95 |
| 15 — Utánkövetés | 2 | 49 |
| 14 — Zárójelentés | 2 | 19 |
| **23 — Genetika** | **3** | **0** |
| *(nincs modulja)* | 1 | 0 |

Két sor mond valamit, amit előtte nem tudtunk:

- **A 23. modulhoz (genetika) három felületi szakasz tartozik — cf DNA testing,
  Genetikai vizsgálatok, Postmortem leletek —, és egyetlen változó sincs
  felvéve.** A modul terve megvan, a katalógusa nincs.
- **A „Beteg adatok" szakasznak nincs modulja.** A meglévő rendszerben a
  személyes és adminisztratív adat **egy képernyő**; nálunk három modul közt
  szórva él (`patient.*`, `addr.*`, `demog.*`, `ctx.referral*`). Ez nem
  feltétlenül hiba — de eddig nem volt kimondva.

A modulszám → változó leképezés **magából a regiszterből** származik: a
változófájlok neve hordozza a modulszámot. Kézzel karbantartott lista fél éven
belül hazudna — ugyanaz a szabály, mint a levezetési gráfnál.

---

## 4. Ami NEM vehető át változatlanul

Ez a fejezet leghasznosabb része. A `refused` státusz **nem hiba és nem
hiány: döntés.** Egy régi felület mezője akkor sem másolható át, ha praktikus,
amikor a rendszer szabályaiba ütközik.

### 4.1 Etnikai csoport — négy mező, GDPR 9. cikk

A forrásrendszer **négy** etnikai mezőt tart: az anyáét, a partnerét, és a
partner **anyai** és **apai** ágáét. A rendeltetésük világos: a publikált
kockázati modellek (FMF) használják.

A rendszer az etnikumot a személyre szabott növekedési görbéből
[**szándékosan kihagyta**](07-normogram.md), és ez a döntés itt is áll:
különleges adat, csak kifejezett, célhoz kötött hozzájárulással rögzíthető, és
**soha nem folyhat be csendben egy számításba.**

### 4.2 Családon belüli erőszak — nem `phi` kérdés, hanem biztonsági

> „Családon belüli erőszak az anamnézisben"

Ez a mező nem attól veszélyes, hogy azonosít. Attól, hogy **egy nyomtatott
dokumentumon megjelenve veszélyeztetheti a beteget** — egy zárójelentés, amit
hazavisz, egy lelet, amit más is elolvas.

A `phi: true` jelölés ezt **nem** oldja meg: az az exportból és a lekérdezőből
zárja ki, nem a beteg kezébe adott papírról. Külön **láthatósági szabály** kell
rá, és ez a 14. modul (zárójelentés) dolga lesz.

### 4.3 Négy párhuzamos mértékegység-mező

A forrásrendszer a testsúlyt **kilogrammban, stone/fontban és fontban** is
tárolja, a testmagasságot **centiméterben és láb/inchben**.

A rendszerben az **egység az értékhez tartozik** (UCUM), és a megjelenítés
váltja át ([`core/ui/units.ts`](../../core/ui/units.ts)). Négy párhuzamos mező
**négyféle igazságot tud tárolni ugyanarról** — és a kérdés, hogy melyiket
hiszi el az olvasó, csak akkor derül ki, amikor már baj van.

### 4.4 Az „eseménytelen családi anamnézis" pipa

Egy jelölőnégyzet, ami **kilenc állítást** tesz negatívvá: ismétlődő vetélés,
terhesség-megszakítás orvosi indikációval, újszülött halálozás, diabetes,
hypertonia, fejlődési rendellenességek, fogyatékosság, cisztás fibrózis,
haemoglobinopathia.

**A forrásrendszer maga mond ellent neki:** ugyanazon a lapon mind a kilenc
tétel külön-külön szerepel, „ismeretlen" alapértéken. A pipa és a kilenc mező
tehát **ellentmondhat egymásnak**, és nincs szabály arra, melyik nyer.

A rendszer szabálya változatlan: **az „összes negatív" nem írja felül a „nem
tudom"-ot.**

---

## 5. Amiben a forrásrendszer IGAZAT ad nekünk

A térkép nem kritikai lista. Három helyen a régi felület pontosan azt csinálja,
amit a rendszer szabálya előír — és ez megerősítés, nem véletlen:

| Amit a forrásrendszer csinál | A rendszer szabálya |
|---|---|
| Az „ismeretlen" **választható érték** (vércsoport, HbsAg, dohányzás, fájdalom, a családi anamnézis kilenc tétele) | a hiányzó adat sehol nem „nem" — háromállású válasz |
| A terhességi kor **forrása** külön mező (menses · UH · fogamzás · CRL) | `ctx.gaSource` — a forrás dönti el, mennyire pontos |
| A gyógyszer-expozíció **terhességi héttől hétig** | a teratogén ablak nem dátumkérdés, hanem gesztációs kor kérdése |

Az utolsónál viszont a **levezetés** hiányzik: a terhességi hét a dátumból és
az utolsó menstruációból **kiszámítható**. Külön beírva két forrás keletkezik
ugyanarra — és a teratogén ablak megítélése azon múlik, melyiket hiszi el az
olvasó.

---

## 6. Interfészmezők — amit nem szabad kézzel írni

A vizsgálati lap alsó fele (`Patient Class`, `Patient Location`, `Patient's
Bed`, `Accession number`, `Procedure description`, `Status`) **HL7 v2 ADT- és
ORM-üzenetből** érkezik a kórházi rendszerből.

Az `interfaceFilled` jelölés ezt mondja ki. Egy interfészmezőt kézzel
felülírni **némán szétcsúsztatja a két rendszert**: a HIS-ben a beteg az egyik
ágyon fekszik, nálunk a másikon, és a különbség csak akkor derül ki, amikor
keresik.

Ez a [`08-interoperabilitas.md`](../08-interoperabilitas.md) fejezet
gyakorlati következménye: 12 mező, amit **nem tervezni** kell, hanem
**fogadni**.

---

## 7. Egy kapu, ami a beteg kéréséből következik

> „Páciens tudni szeretné a magzat nemét" — igen / nem

A rendszer **generálja a betegnek szóló szöveget**
([`core/ui/output.ts`](../../core/ui/output.ts)). Ez a mező tehát nem
adminisztratív jelölés, hanem **kapu a kimeneten**: ha a válasz nem, a magzat
neme nem jelenhet meg a beteg-oldali szövegben — akkor sem, ha a
dokumentációban rögzítve van.

Ez az a fajta szabály, amit a régi felület **rögzít, de nem kényszerít ki**,
mert ott a szöveget ember írja. Nálunk gép írja, tehát ki lehet — és ki is kell
— kényszeríteni.

---

## 8. Az indikáció köti össze a klinikát az elszámolással

A vizsgálat javallata a forrásrendszerben **két listán** áll — magzati és
anyai —, és mindkettő **BNO-kóddal**. Ez nem adminisztratív mező:

> A **9/2012. (II. 28.) NEFMI rendelet 4. melléklete** szerint bizonyos
> eljárások **csak meghatározott BNO-kódok mellett** számolhatók el.

Az indikáció tehát az **elszámolhatóság előfeltétele**, és a rendszerben a
`tbl.oeno.bno` tábla ezt **már tartalmazza** (23 eljárás, betöltve). A két
modul — az 5. (vizsgálatok) és a 25. (finanszírozás) — itt ér össze, és ez
addig nem volt kimondva.

Két további tanulság a javallat-lapról:

- **Az anyai aggodalom önálló, érvényes javallat.** A rendszer sehol nem
  minősíti a beteg aggodalmát „nem valódi" indikációnak — a forrásrendszer sem.
- **Az apai Rh D-állapot anyai dokumentációban.** Alloimmunizációnál a
  **homozigóta/heterozigóta** apai állapot dönti el, hogy a magzat érintett
  lehet-e. Egy „apai adat" mező az anya lapján nem hiba: a kockázat közös.

---

## 9. Egy lista, három alany

A tizenhárom tételes szervrendszeri rendellenesség-lista — *fej, agy, arc,
gerinc, nyak/bőr, mellkas, szív, hasfal, GIT, húgy-ivar traktus, végtagok,
hydrops, növekedési retardáció* — a forrásrendszerben **háromszor** szerepel:

| Alany | Hol |
|---|---|
| a **jelen magzat** | Indikáció — Magzat |
| a **korábbi terhesség** | Anamnézis — Korábbi terhesség |
| a **szülők** | Anamnézis — Szülők betegsége |
| a **rokonok** | Anamnézis — Rokon betegsége |

Négy külön mezőkészlet ugyanarra a tizenhárom tételre. Egy új szervrendszer
felvétele ott **négy helyen** kell — és ha valaki csak háromban veszi fel, az
soha nem derül ki.

A rendszerben ez **egy lista, négy példány-dimenzióval** (`scopedBy`): a
felvétel egyszer történik, a három alany külön-külön válaszolható meg. Ez
ugyanaz a szerkezet, ami a panaszmodul 1320 változóját 11-re csökkentette.

**A forrásrendszer a harmadik helyen ki is mondja a dimenziót:** a szülők
lapján ott áll, hogy *„Kinek a felmenője: partner"*. Ugyanez a mező hiányzik a
másik kettőnél, pedig ott is ugyanaz kellene.

### Hordozó és érintett

A hemoglobinopathiáknál (sarlósejtes anaemia, alfa- és béta-thalassaemia) a
lap **mindkét szülőre** kérdez, és az érték nem igen/nem: *érintett beteg*.

A magzati kockázat **mindkét szülő** állapotától függ, és a **hordozó** meg az
**érintett** nem ugyanaz. Kódolt értékkészlet kell rá — *érintett · hordozó ·
nem érintett · nem vizsgált* —, mert egy jelölőnégyzet a négyből kettőt tud.

---

## 10. A MoM a reagenskészlethez tartozik

A kombinált teszt lapján a kockázatszámítás bemenete **nem a mért
koncentráció**, hanem a **MoM** — a medián többszöröse. És a MoM hat dologtól
függ:

| Korrekció | Miért |
|---|---|
| terhességi kor | a medián hetente változik |
| anyai testsúly | nagyobb vértérfogat hígítja a markert |
| **etnikum** | a mediánsor populációfüggő |
| dohányzás | eltolja a marker szintjét |
| diabetes | ugyanígy |
| **a reagenskészlet mediánsora** | **gyártó- és tételfüggő** |

Ezért van a lapon a **gyártó** és a **tételszám (lot no.)** — markerenként
külön. Ez nem adminisztráció:

> **Más gyártó mediánsorával számolt MoM csendben rossz: ugyanaz a szám, más
> jelentéssel.**

Ez a [`calc.verified`](07-kalkulatorok.md) kapu tankönyvi esete, és a
felülettérkép ezért `gate` státuszúra teszi mindkét mezőt. A tételszám az
egyetlen nyom, amiből egy visszamenőleges felülvizsgálat kideríthetné, melyik
mediánsorral számoltak.

### Két kockázat, nem egy

A lap a **háttér** és a **számított** kockázatot **külön** tartja, mind a
három triszómiára:

| | Mi ez |
|---|---|
| **háttér kockázat** (1:N) | a priori — anyai életkor és terhességi kor |
| **számított kockázat** (1:N) | a markerekkel módosított |

A kettő **különbsége maga az információ**. Egyetlen számmá összevonva elvész,
hogy a kockázatot az életkor vagy a marker hozta. A rendszer a három
kockázatbecslőt a [3. modulban](../modulok/03-anamnezis.md) már szándékosan
szétválasztva tartja — ez ugyanaz a döntés.

### Az érvénytelenítő jelölések

„Labor hiba" és „Mozaicizmus": két jelölőnégyzet, ami **megváltoztatja az
eredmény jelentését**.

- A **laborhibásnak** jelölt eredmény nem táplálhat kockázatszámítást, és nem
  jelenhet meg leletként.
- A **mozaicizmus** nem érvényteleníti az eredményt, de a kariotípus nem
  egységes — külön értelmezési szabály kell rá.

Címkeként rögzítve **látszanak, de nem védenek**. Kapuként kell viselkedniük.

### Az etnikum — itt a cél nevesített

Ez a lap az az eset, **amire a rendszer etnikum-szabálya íródott**. A szabály
soha nem az volt, hogy az etnikum nem rögzíthető, hanem hogy:

1. csak **kifejezett, célhoz kötött** hozzájárulással, és
2. **soha nem folyhat be csendben** egy számításba.

Itt a cél nevesített és legitim: a MoM-korrekció publikált része. A státusz
attól még `refused` — vagyis a régi felület szabályaival nem vehető át —, mert
a hozzájárulás megléte a felvétel feltétele, nem utólagos formalitás.

---

## 11. A mérés körülménye az érték része

Az ultrahang-alapadatok lapja öt olyan mezőt tart, ami nem leltári adat, hanem
a **mérés körülménye**: a **készülék**, az **ultrahangfej**, és a behatolás
útja — **transzabdominális · transzvaginális · 3D**.

> A transzvaginálisan és a transzabdominálisan mért CRL **nem ugyanaz a szám**.

Ez pontosan ugyanaz a kapu, mint a normogram-katalógus mérési konvenciója
(4.1. és 2. szakasz) — csak a **mérés** felől nézve, nem a **görbe** felől. A
kettő egymás párja: a görbe megmondja, milyen méréshez készült; ez a mező
megmondja, milyen mérés történt.

A **készülék** azért számít, mert a biometriai értékek készülékfüggőek, és egy
készülékcsere a **helyi normogram** generálásában töréspont.

A „Vizsgálati körülmények: … miatt korlátozva" mező pedig a rendszer
lelet-állapotai közül a **korlátozott**: megvizsgáltuk, de nem teljesen —
**láttunk valamit**, tehát rögzíthető. Nem azonos a *nem vizsgálható*
állapottal, és egyik sem azonos a normálissal.

---

## 12. A modell a klinikus mellett áll, nem helyette

A koraterhességi panel a legtanulságosabb lap az egész rendszerben, mert három
dolgot csinál egyszerre, és mindhárom megerősít egy-egy szabályt.

### A lokalizáció három kimenetelű

| | |
|---|---|
| intrauterin | |
| extrauterin | |
| **ismeretlen lokalizációjú (PUL)** | **önálló kategória, saját kezelési útvonallal** |

A harmadik **nem átmeneti bizonytalanság**. Van rá PUL-kategória, hCG-sorozat,
48 órás protokoll és kezelési döntés. Ez ugyanaz az elv, amiért a rendszerben a
hiányzó adat sehol nem „nem" — csak itt a szakma maga építette ki a harmadik
állapot köré a teljes útvonalat.

### A modell forrása a képernyőn van

> Condous G, Okaro E, Khalid A, Timmerman D, Lu C, Zhou Y, Van Huffel S,
> Bourne T. *The use of a new logistic regression model for predicting the
> outcome of pregnancies of unknown location.* Hum Reprod. 2004
> Aug;19(8):1900-10.

A hivatkozás **a mező mellett áll**, nem egy súgóban. A rendszer
[`calc.verified`](07-kalkulatorok.md) kapuja ugyanezt követeli meg: modell
hivatkozás nélkül nem futhat.

És a modell **három valószínűséget** ad — elhalt, intrauterin, ectopiás, együtt
100% —, nem egy igen/nem-et. Egyetlen „ectopiás: igen/nem" értékké összevonva a
másik két kimenetel eltűnik.

### A benyomás és a modell egymás mellett

A lapon **külön mező** a *„Szubjektív benyomás"* és a *„Valószínűség foka"*, és
**külön** a modell három százaléka.

> **A kettő eltérése maga is adat.**

Ez pontosan az a viszony, amit a rendszer a döntéstámogatásról állít: a modell
nem váltja ki a klinikust, és ahol a kettő nem egyezik, ott van a lényeg. Egy
felület, ami a modell futtatása után elrejtené a klinikus benyomását, épp azt
az információt dobná el, amiért az egészet csináljuk.

### A kezelés kapui

Két jelölőnégyzet a methotrexate előtt: *„normál TVK, vese- és májfunkció"* és
*„normál LFTs"*. Ezek **nem adminisztratív pipák**, hanem a kezelés feltételei —
ugyanaz a szerkezet, mint az asztma–carboprost hard-stop a 6. modulban.

És ahol a kezelés ellenjavallt, ott a lap **indoklást kér**
(*„Felborult haemodynamikai egyensúly"*). A rendszer hard-stop kapui pontosan
így működnek: a megkerülés lehetséges, de csak indoklással, és **az indoklás a
dokumentáció része lesz**.

---

## 13. A magzati anatómia: öt állapot és két „nem"

A részletes anatómia lapjai szervrendszerenként **ugyanazt a szerkezetet**
ismétlik, és ez a legértékesebb, ami a felületből átvehető:

```
☐ <normál állítás>          „Szabályos koponyaforma"
☐ Nem látható
☐ Nem hozható látótérbe
☐ Rendellenességek  →  tételes lista
(semmi bejelölve)            — erről a szervről SEMMIT nem állítunk
```

> **A „nem látható" és a „nem hozható látótérbe" nem ugyanaz.**

| | Mit mond | Mi következik |
|---|---|---|
| **Nem látható** | **LELET a magzatról** — a nem ábrázolódó gyomor oesophagus-atresiára, a nem látható húgyhólyag alsó húgyúti obstructióra utal | kivizsgálás |
| **Nem hozható látótérbe** | **A VIZSGÁLATRÓL szól** — magzati helyzet, anyai habitus, kevés magzatvíz | **ismétlés** |

A rendszer eddig **egyetlen** `nem vizsgálható` állapotot ismert. Ez a felület
kettéválasztja — és igaza van: a két állapot **ellentétes teendőt** szül.

A `readState()` ezt szerkezetileg mondja ki, nem szövegben: a `notVisible`
`abnormalFinding: true`, a `notObtainable` `repeatNeeded: true`.

### A normál állítás nem „normális"

Minden szervrendszernek **kiírt normál állítása** van, nem egy pipa:

> „Ép gerinc, sem spina bifida, sem kyphoscoliosis nem látható"

A „normális" önmagában nem lelet: le kell írni, **mit** állítunk normálisnak. A
validátor ezt kikényszeríti.

### Ahol egy pipa kevés

| Hol | Miért |
|---|---|
| **Szív** | **négy** külön normál-állítás, mindegyik saját „nem látható"-val: négyüregű kép · főerek · kiáramlási pályák · háromér-metszet. A négyüregű kép normális lehet úgy is, hogy a nagyerek transzponáltak |
| **Hasfal** | a **herniálódott tartalom** önálló adat: a csak belet tartalmazó exomphalos prognózisa más, mint a májat is tartalmazóé |
| **Gerinc** | a **szegmens** is adat: a szint és a kiterjedés dönti el a prognózist |
| **Végtagok** | **minden tételnek oldalisága van** — az egyoldali és a kétoldali hiány különböző diagnózis |

### A katalógus trimeszterfüggetlen

A második trimeszteri anatómia szervrendszeri füleinek értékkészlete **azonos**
az elsőével. A különbség egyetlen többletfül: az **„Egyéb rendellenességek"**,
ahol a **csontváz-dysplasiák** állnak — tíz nevesített tétel, mert azok nem egy
szervet érintenek, hanem az egész magzatot; és az első trimeszterben a csontváz
még nem ítélhető meg.

Ez megerősíti a szerkezetet: **nem trimeszterenként külön listát kell vezetni,
hanem egy listát, terhességi kor szerinti elérhetőséggel.**

### A genitalia lap: a kimeneti kapu működő példája

Két külön mező áll rajta:

| Mező | Példaérték |
|---|---|
| **Lelet** | „normál genitália (a szülők nem akarják tudni a magzat nemét)" |
| **Nincs nyomtatásban** | „normál hím külső ivarszervek" |

A megállapítás **rögzül**, de **nem kerül a nyomtatott leletre**. Pontosan ez
az, amit a jelen terhesség főpaneljének *„Páciens tudni szeretné a magzat
nemét"* mezője kapuz (7. szakasz) — és itt látszik, hogy a szakma ezt már
megoldotta: **a dokumentáció teljes marad, a betegnek adott papír nem mond el
mindent.**

---

## 14. Huszonkilenc kapu — és négy új típus

A felülettérkép `gate` státuszú mezői nem adatok, hanem **feltételek**. Négy
olyan típus van köztük, ami a rendszerben eddig nem szerepelt:

| Kapu | Mit véd | Hol |
|---|---|---|
| **bemenetválasztó** | melyik mért érték megy a számításba | öt NT-mérés → egy megnevezett |
| **életkor-kapu** | melyik életkor tartozik a kockázathoz | fagyasztott petesejt · donor |
| **kompetencia-kapu** | ki futtathatja a számítást | FMF engedélyszám |
| **beleegyezés-kapu a számításon** | kiszámolható-e egyáltalán | „tanácsadás megtörtént és a terhes beleegyezését adta" |

### A bemenetválasztó

Öt NT-mérés áll az első trimeszteri lapon — köldökzsinór felett és alatt,
manuális TA, manuális TV, automatizált —, és **egy külön mező mondja meg, melyik
megy be a kockázatszámításba**.

> Nem „a legutolsó", nem „a legjobb", nem egy átlag: **egy megnevezett,
> választott érték.**

Ez a rendszer legfontosabb állítása a levezetéseiről, és itt a szakma maga
építette ki ugyanazt.

### Az életkor-kapu

Fagyasztott petesejtnél a **fagyasztáskori** életkor, donor petesejtnél a
**donor** életkora tartozik a triszómia-kockázathoz. Ha a rendszer a várandós
mai életkorával számol, a kockázat **némán téved** — és épp a megnyugtató
irányba.

### A kompetencia-kapu

Az FMF-algoritmust **akkreditált vizsgáló** futtathatja, engedélyszámmal. Ez új
típus:

> A `calc.verified` a **képletről** szól — ellenőrzött-e az együttható. Ez a
> **vizsgálóról** — jogosult-e futtatni. A kettő független, és **mindkettő
> kell**: egy helyes képlet rossz méréssel ugyanúgy rossz számot ad.

### A beleegyezés-kapu a számításon

> „Tanácsadás megtörtént és a terhes beleegyezését adta"

A szűrési kockázat **dokumentált tanácsadás és beleegyezés nélkül nem
számolható ki és nem közölhető** — mert az eredmény olyan döntés elé állítja a
várandóst, amit nem kért.

A rendszer kapui eddig **adat rögzítését** kapuzták. Ez **magát a számítást**
kapuzza, és ez a minta eddig hiányzott.

### És három kockázati csatorna, nem egy

A kockázatszámítás lapja **külön** jelenti a csak ultrahangból (UH), a csak
biokémiából (BC) és a kombináltan számított kockázatot, mind a négy
kimenetelre (21 · 18 · 13 · 18+13).

> Ha az UH- és a BC-alapú kockázat **szétesik**, az maga is lelet: rossz
> NT-mérésre vagy rossz mintára utalhat.

Egyetlen kombinált értékké összevonva ez elveszne. És az első trimeszteri
szűrés amúgy sem csak Down-szűrés: ugyanabból a mérésekből
**praeeclampsia-kockázat** (korai és teljes terhességi), **hipertenzív
kórképek**, **növekedési retardáció** és **magzati elhalás** kockázata is
számolódik — és ezek közül a praeeclampsiának **kezelési következménye van**
(aszpirin).

---

## 15. A képlet választása meghatározza, mit kell mérni

A biometriai lapon a becsült magzati súly mezője **képletválasztó**:

> Becsült magzati súly: **Persson (BPD-TAD-APAD-FL)**

A képlet neve **megmondja, melyik mérés kell hozzá**. Más képlet más biometriát
kíván — a formulaválasztás tehát meghatározza, mely mezők **kötelezőek**. A
rendszerben ez `requiredWhen` viszony, nem külön szabály.

És a választás **maga is rögzítendő**: két képlet ugyanarra a magzatra több száz
gramm eltérést adhat.

A **percentilhez** pedig hitelesített normogram kell. A görbekatalógusban az
EFW-re négy publikált görbe szerepel; a rendszerben egy sincs hitelesítve, tehát
**percentilist nem ad** — a 2. szakasz kapuja itt kapcsolódik vissza.

---

## 16. Elfogadási kritérium, tesztként

`test/normogram-katalogus.test.ts` (17), `test/felulet.test.ts` (38) és
`test/anatomia.test.ts` (15). A fontosabbak:

| Teszt | Mit bizonyít |
|---|---|
| a katalógus megnevezi a lyukait | a részlegesség kimondva, nem elhallgatva |
| a BPD-nél konvenció nélkül nincs alkalmazható görbe | a konvenció kapu, nem címke |
| a konvenció-érzékenységet maga a katalógus árulja el | nincs beleégetett lista |
| ikerre egyes magzat görbéje nem áll | a populáció kapu |
| a menüfa összefüggő | a lefedettség mérése nem téves ágon fut |
| a modulszám → változó leképezés a regiszterből jön | nem hazudhat el egy féléves elmaradást |
| az etnikai mezők `refused` státuszúak | a GDPR-döntés szerkezet, nem szándék |
| a családon belüli erőszak `refused`, biztonsági okból | a `phi` nem elég |
| a HL7-mezők `interface` státuszúak | nem kézi mezők |
| a javallat két BNO-mezője | az elszámolhatóság előfeltétele, nem adminisztráció |
| a szervrendszeri lista négy scope-ja | egy lista, négy alany — nem négy mezőkészlet |
| a gyártó és a tételszám `gate` státuszú | a MoM a mediánsorhoz tartozik |
| a laborhiba-jelölés `gate`, nem címke | ami látszik, még nem véd |
| a behatolás útja `context` státuszú | a mérés körülménye az érték része |
| a szubjektív benyomás külön mező | a modell a klinikus mellett áll |
| a PUL három valószínűsége | nem igen/nem |
| a methotrexate előtti labor `gate` | kontraindikáció-kapu, nem pipa |
| a `notVisible` lelet, a `notObtainable` ismétlést kér | a két „nem" ellentétes teendőt szül |
| a szívnél négy normál-állítás | egy pipa elfedné a nagyér-transzpozíciót |
| a genitalia „nincs nyomtatásban" mezője | a kimeneti kapu működő példája |
| az FMF engedélyszám `gate` | kompetencia-kapu — új típus |
| a beleegyezés `gate` a számításon | a rendszer eddig csak adatot kapuzott |
| három kockázati csatorna külön | a szétesésük maga is lelet |
