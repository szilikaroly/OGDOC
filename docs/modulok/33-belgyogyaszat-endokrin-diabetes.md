# Modul 33 — Belgyógyászat: endokrinológia, diabetológia, kardiológia, palliatív ellátás

*Ahol ugyanaz a labor mást jelent — és a rendszer már tudja, hogyan mondja meg.*

---

## A modul egyetlen szerkezeti kérdése

**A terhesség nem egy szempont a belgyógyászati kezelés mellett. Megváltoztatja
magát a betegséget, a célértékeket és a gyógyszert.**

Egy általános belgyógyászati modul, amit „terhességi megjegyzésekkel"
egészítenek ki, három ponton téved csendben:

1. **A referenciatartomány más.** A TSH, a kreatinin, a fehérvérsejtszám, a
   D-dimer — mind eltolódik, trimeszterenként. A rendszernek ez a rétege
   **megvan** (`reference` kontextussal, 6. lépés), csak nincs feltöltve.
2. **A célérték más.** A terhességi cukorbetegség célértékei nem a 2-es típusú
   diabétesz célértékei, és nem is „szigorúbb változatuk" — más mérés, más idő.
3. **A gyógyszer más, és trimeszterenként változik.** A thyreostatikumoknál a
   választás az I. trimeszterben más, mint utána — ez a rendszer legélesebb
   példája arra, hogy egy „terhességben adható / nem adható" kétértékű mező
   **hamis**.

---

## Mi van már meg

| | |
|---|---|
| Laborreferencia-réteg (6. lépés) | **kontextusfüggő** tartomány, hitelesítési szinttel |
| `lab.*` — TSH, HbA1c, kreatinin, 17-OHP, kortizol, DHEAS, AMH, PRL | a változók megvannak |
| `core/ui/meres.ts` | `nincsKuszob` — kimondja, ha nincs mihez mérni |
| `registry/szuresek/` | 8 szűrési szabály |
| `registry/dieta/` | 15 diétás protokoll |

**És egy mérés, ami most derült ki:** a `lab.hba1c`, a `lab.tsh`-hoz hasonló
endokrin értékek nagy része ma **néma** — sem kritikus küszöbük, sem
referenciájuk nincs. Ez a modul első kézzelfogható haszna.

---

## 1. Diabetológia — két különböző betegség egy néven

| | GDM (terhességi) | Praegestatiós (1-es/2-es típus) |
|---|---|---|
| Mikor derül ki | 24–28. hét szűréssel | a terhesség előtt ismert |
| A magzati kockázat | főleg a II–III. trimeszterben | **a szervfejlődés idején is** |
| A HbA1c szerepe | korlátozott | **a fogamzás előtti érték a legfontosabb** |
| A kezelés | diéta → metformin/inzulin | meglévő kezelés **átállítása** |
| Szülés utáni teendő | **újraértékelés** — nem szűnik meg magától | folytatódik |

**A rendszernek ezt a kettőt nem szabad egy `diabetes: igen` mezőben
összemosnia.** Egy praegestatiós diabéteszes első trimeszterében a magzati
szervfejlődés zajlik a rossz anyagcsere mellett — a GDM-nél ez a szakasz már
elmúlt. A teendő időben más.

**És a szülés utáni újraértékelés az, ami a leggyakrabban elmarad**: a GDM nem
szűnik meg a szüléssel, csak nem mérik többé. A rendszer ezt az elmaradást a
15. utánkövetés modul mintájára **jelként** kell kezelje, ne hiányként.

---

## 2. Pajzsmirigy — ahol a kétértékű mező hazudik

A trimeszterspecifikus TSH-tartomány nem finomítás: a nem terhes felső határral
mérve terhesség I. trimeszterében **fölöslegesen kezelnénk**, a III.-ban pedig
**elengednénk** valódi eltérést.

És a gyógyszerválasztás **trimeszterfüggő** — ez az a példa, ami miatt a
„terhességben adható?" kétértékű mező szerkezetileg hibás. A rendszernek a
gyógyszer terhességi információját **gesztációs korral együtt** kell tárolnia,
nem igen/nem alakban (l. 32. modul).

---

## 3. PCOS, hyperandrogenismus, prolaktin

Ez a csoport a **nőgyógyászat és az endokrinológia határán** él, és ma egyik
modulban sincs otthon: az `lab.amh`, `lab.dheas`, `lab.17ohp`, `lab.prl`,
`lab.lh`, `lab.fsh` mind megvan a regiszterben — és **mind néma**.

A PCOS diagnózisa kritériumrendszer (nem egyetlen érték), és a rendszernek van
rá szerkezete: a szepszis-kritériumok (9. lépés) pontosan ilyen — megnevezett
kritériumok, küszöbökkel, aláírással.

---

## 4. Amit ez a modul NEM tesz — és ami e szakaszból kikerült

**Nem lesz általános belgyógyászati rendszer.** A hatóköre az, ami a szülészeti
és nőgyógyászati ellátásban ténylegesen felmerül: anyagcsere, pajzsmirigy,
hypertonia, thrombophilia, vesefunkció, autoimmun kórképek terhességi
vonatkozása.

Ami ezen kívül esik — gasztroenterológia, onkológia a nőgyógyászati körön túl —,
oda **beutalás** megy, nem saját protokoll. Ugyanaz a döntés, mint a védőnői
modulban: aki nem az adott kérdés gazdája, az **továbbküld**.

> **A KARDIOLÓGIA KORÁBBAN EBBEN A FELSOROLÁSBAN VOLT, ÉS KIKERÜLT BELŐLE.**
>
> A „beutalás, nem saját protokoll" álláspont ott állt meg, hogy a szívbetegség
> a fejlett világ **vezető anyai halálokainak egyike**, és a beutalás akkor
> segít, ha valaki előbb észreveszi, hogy be kell utalni. A rendszernek épp
> abban a pillanatban nem volt mondanivalója, amikor a legtöbb múlt rajta.
>
> A hatókör ezért **nem a kezelésre** terjedt ki, hanem három olyan dologra,
> amit a szülészeti dokumentáció maga tud, és amit senki más nem néz meg:
> a **kockázati besorolásra**, a **félreolvasott laborjelekre**, és a **szülés
> utáni átadásra**. A kezelés kardiológusé maradt — és a 7. szakasz kimondja,
> hol áll meg a rendszer.
>
> Ugyanígy került be a **palliatív ellátás**: nem azért, mert a hospice ehhez a
> modulhoz tartozik, hanem mert a „hospice" szó ebben a rendszerben **két
> különböző dolgot** jelent, és a kettő összemosása konkrét kárt okoz. Lásd a
> 8. szakaszt.

---

## 5. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| `ctx.pregnant`, `ctx.ga` | laborreferencia | **a kontextus dönti el a tartományt** |
| `lab.tsh`, `lab.hba1c` … | mérésértékelés | ma `nincsKuszob` — ez a modul tölti fel |
| GDM/praegestatiós megkülönböztetés | kockázati számítások | más bemenet, más eredmény |
| endokrin kritériumok | 9. lépés kritériumszerkezete | aláírással |
| szülés utáni újraértékelés | 15. utánkövetés | **elmaradás = jel** |
| gyógyszerváltás | 32. modul | trimeszterfüggő, nem kétértékű |

---

## 6. A gépi fele — ami elkészült

`core/endo/diabetes.ts` · `core/lab/analit.ts` · `registry/labor/analit-csoportok.json`

**A rés, amit a modul megtalált: a referenciatartomány tudta, hogy a terhesség
eltolja a normálértéket — a KRITIKUS küszöb nem.**

A mérésértékelés sorrendben elsőként a `domain.critical` határt nézi,
kontextus nélkül, azzal az indoklással, hogy „ez a változó definíciós határa,
nem referenciatartomány-kérdés". Az éhomi vércukornál ez az indoklás hamis:

| | `lab.ogtt.0` | `lab.glucose.fasting` |
|---|---|---|
| kritikus küszöb (volt) | 5,1 mmol/L | **7,0 mmol/L** |

Ugyanaz a minta, ugyanaz az egység. Egy **5,8-as érték terhesen a terhességi
cukorbetegség diagnosztikus küszöbe fölött van** — de attól függött, melyik
mezőbe gépelték be, hogy lett-e belőle riasztás.

A küszöb mostantól kontextusfüggő (`domain.criticalByContext`), ugyanazokkal a
kulcsokkal, mint a referencia. **Ismeretlen terhességi állapotnál a szigorúbb
küszöb érvényes** — a nem terhes küszöbre visszaesni itt ugyanaz a hiba lenne,
mint a referenciánál, csak itt a riasztás marad el.

Az **analit-csoport** ezt általánosítja: kimondja, hogy két mező ugyanazt méri,
és a validáló ellenőrzi, hogy ugyanabban a kontextusban ugyanazt a küszöböt
mondják-e. *(A csoport első futása azonnal talált egy másodikat: a
`lab.ogtt.0`-nak nem volt alsó határa — egy 2,6-os hypoglykaemiás értéket
átengedett volna.)*

### A két diabétesz mint két entitás

`kockazatiAblak()` — a különbség **időbeli, nem súlyossági**: praegestatiós
diabétesznél a 4–10. hét (szervfejlődés) **már kockázat alatt áll**, GDM-nél ez
a szakasz a diagnózis előtt lezajlik.

`szulesUtaniUjraertekeles()` — a szülés utáni 4–12. héten esedékes OGTT
elmaradása **jel**, nem hiány: *a GDM nem szűnik meg a szüléssel, csak nem mérik
többé*, és ez az egyetlen pont, ahol a később kialakuló 2-es típusú
cukorbetegség időben kiderülne.

### És a némaság, megszámolva

**8/17 endokrin mérés szólal meg; 9 néma** — sem küszöb, sem
referenciatartomány. A PCOS, a pajzsmirigy és a prolaktin kérdésköre jórészt
ezekre épül.

---

---

## 7. Kardiológia — a vezető anyai halálok

`core/belgyogyaszat/kardio.ts` · `registry/belgyogyaszat/mwho.json` ·
`registry/belgyogyaszat/kardio-jelek.json`

### 7.1 A besorolás nem a diagnózis tulajdonsága

**38 állapot, 5 kockázati osztály — és 11 diagnózis több osztályban is
szerepel.** Ez a modul lényege:

| Ugyanaz a diagnózis | Állapot | mWHO |
|---|---|---|
| Súlyos aortastenosis | **tünetmentes** | III. |
| Súlyos aortastenosis | **tünetes** | **IV.** |
| Korábbi peripartalis cardiomyopathia | a kamrafunkció **rendeződött** | III. |
| Korábbi peripartalis cardiomyopathia | **bármilyen** maradvány | **IV.** |
| Marfan-szindróma | aorta 40–45 mm | III. |
| Marfan-szindróma | aorta **> 45 mm** | **IV.** |

Egy `aortastenosis: igen` mező ezt a különbséget nem tudja hordozni. Ezért
minden állapothoz `kellAdat` lista tartozik: ha a mérés hiányzik, a besorolás
**`nemBesorolhato`**, és megnevezi, mi hiányzik.

**A hiányzó adat nem a kedvezőbb osztály.** A korábbi peripartalis
cardiomyopathiánál ez a III. és a IV. osztály közti különbség — vagyis egy
ismételt terhesség egész kimenetele.

### 7.2 A IV. osztály tény, nem javaslat

Az irányelv szövege szerint a IV. osztályban a terhesség ellenjavallt, és a
megszakítás megbeszélendő. **A rendszer ezt nem fordítja tanáccsá.** A
szerkezet kényszeríti ki a megkülönböztetést, nem a szóhasználat:

| Mező | Mit tartalmaz |
|---|---|
| `miert` | **a rendszer saját megállapítása** — itt soha nincs tanács |
| `iranyelvSzovege` | **idézet** az irányelvből, külön mezőben |
| `dontesGazdaja` | „a beteg, a terhesszív-csapattal" — a rendszer soha nem ez |
| `javaslat` | típusszinten `false`, más érték nem vehető fel |

Az első változatban ez egy bekezdés volt. Egy bekezdésbe öntve a felület az
irányelv „megszakítás megbeszélendő" mondatát a rendszer állításának mutatja,
és egy leolvasott mondatból tanács lesz. **Külön mezőben a felület kénytelen
megkülönböztetni**, mit mond az irányelv, és mit állít a rendszer.

### 7.3 Két ellentétes irányú tévedés ugyanazon a laborleleten

Ez a réteg egy **meglévő hiányra** válasz. A `lab.dimer` változó `pitfalls`
szövege eddig is leírta, hogy terhességben elvész a negatív prediktív értéke.
**A szöveg viszont nem tartja vissza a küszöböt**: egy prózai figyelmeztetés a
mezőleírásban nem akadályozza meg, hogy a rendszer egy III. trimeszteri
0,4 mg/L-es D-dimert „normális"-ként mutasson, és hogy erre hivatkozva
elmaradjon a képalkotás. Ez a rendszer visszatérő hibacsaládja: **a próza olyat
ígér, amit a szerkezet nem hordoz.**

| Jel | Élettani változás terhességben | A tévedés iránya |
|---|---|---|
| **D-dimer** | emelkedik | a **normális** értéket hisszük megnyugtatónak |
| **Troponin** | **nem** emelkedik | a **kóros** értéket hisszük ártalmatlannak |
| NT-proBNP | mérsékelten emelkedik | a negatív irány megmarad |
| QRS-tengely | balra tolódik (II–III. trimeszter) | hamis riasztás |
| T-inverzió (III., V1–V3) | előfordul | hamis riasztás |
| Nyugalmi pulzus | +10–20/min | hamis riasztás |
| Vérnyomás | a II. trimeszterben a legalacsonyabb | **a küszöb marad, a viszonyítási alap hiányzik** |

A `kuszobHasznalhato` mező kontextusonként mondja meg, érvényes-e a szokásos
küszöb. **Hiányzó bejegyzés nincs**: a validátor hibát ad, mert a hallgatás
hallgatólagos „használható"-t jelentene — és épp ez a csendes engedés a baj.

Az **ST-depresszióra** az engedmény **nem terjed ki**: az nem élettani, és nem
magyarázható a terhességgel.

### 7.4 Peripartalis cardiomyopathia — amit a terhesség vége elrejt

Tünetei — nehézlégzés, lábdagadás, fáradékonyság, éjszakai fulladás —
**megkülönböztethetetlenek** a terhesség végének élettani panaszaitól. Ezért a
rendszer **nem a tünetekből** dönt: kimondja, hogy mérés nélkül a gyanú nem
zárható ki.

**A hiányzó ejekciós frakció nem jó szív, hanem nem mért szív.**

### 7.5 A gyermekágyi átadás

A szülés utáni napokban a méh összehúzódásával jelentős vérmennyiség kerül
vissza a keringésbe — épp azt a szívet terhelve, amelyik a terhességet még
bírta. A beteg ilyenkor a szülészeti gondozásból már kikerült, a kardiológiaiba
pedig még nem érkezett meg: **ezt az átadást senki nem birtokolja.**

A magasabb kockázati osztályokban (II–III., III., IV.) a rendszer a rögzített
kardiológiai időpont hiányát **nyitott résként** jelzi. Besorolás nélkül a rés
**nem „nem kell"** — eldöntetlen.

---

## 8. Palliatív ellátás és hospice — két különböző dolog egy néven

`core/belgyogyaszat/palliativ.ts` · `registry/belgyogyaszat/palliativ.json`

| | Felnőtt palliatív / hospice | Perinatális palliatív |
|---|---|---|
| **Ki haldoklik** | a beteg | a magzat — **a beteg NEM** |
| **Ki dönt** | a beteg, vagy az előzetes rendelkezése | a szülők, a magzat helyett |
| **Az ellátás tárgya** | tünetkontroll, méltóság | a szülés terve, a búcsú |
| **Meddig tart** | a halálig | a szülés **után** is, hónapokig |
| **Jellemző út** | előrehaladott nőgyógyászati daganat | letális magzati rendellenesség |

**Az összemosás következménye konkrét.** Egyetlen közös „palliatív" zászló azt
eredményezné, hogy a letális magzati rendellenességgel gondozott terhes nő
**ellátása is visszafogódik** — pedig ő nem haldoklik, és a vérzés, a
preeclampsia, a fertőzés ugyanúgy teljes ellátást kíván. A rendszer ezért nem
enged közös zászlót, és a `dosszieVizsgal()` **hibát ad**, ha felnőtt ellátási
cél kerül perinatális dossziéba.

### 8.1 Az ellátási cél nem kétállású

A „teljes ellátás" és a „komfort" közti egyetlen kapcsoló a leggyakoribb és
legkárosabb egyszerűsítés: a **„nem újraélesztendő" jelölést a gyakorlat
rendszeresen „ne kezeld"-ként olvassa.**

Ezért **13 külön döntés** van, nem egy: újraélesztés, intubálás, intenzív
felvétel, antibiotikum, folyadék, táplálás, transzfúzió, műtét — és
perinatálisan: az újszülött élesztése, a **császármetszés**, a szülés alatti
monitorozás, a búcsú, a boncolás. Az antibiotikum és a transzfúzió a palliatív
ellátásban gyakran **tünetkontroll**, nem gyógyítás.

A **császármetszés külön, kimondott döntés**: letális magzati rendellenesség
mellett a magzati javallatú császármetszés **anyai kockázatot jelent magzati
haszon nélkül**. Ez nem következhet sodródásból.

Minden döntéshez **név** tartozik. „A család" és „a csapat" nem cselekvő: a
visszavonás és a felülvizsgálat is ehhez a névhez kötődik.

### 8.2 Ahol a gép megáll

Három jogi feltétel van rögzítve, és **mindháromnál ki van mondva, meddig megy
el a gép**. A legélesebb: a magyar szabályozás szerint az életfenntartó
beavatkozás visszautasításának joga nem gyakorolható, ha a beteg terhes, és
előreláthatóan képes a gyermek kihordására.

**A rendszer ezt soha nem alkalmazza magától.** Két olyan elem van benne, amit
gép nem dönthet el: hogy a beavatkozás „életfenntartó"-e, és hogy a beteg
„előreláthatóan képes-e a gyermek kihordására" — az utóbbi **orvosi jóslat, nem
adat**. A rendszer annyit tesz, hogy **jelzi**: terhesség mellett rögzített
visszautasítás van, és ez jogi és klinikai megítélést kíván, megnevezett
embertől. **Egy előzetes rendelkezést gép nem érvényteleníthet** — a dosszié a
jelzés után is használható marad.

A §-szintű hivatkozásokat **jogásznak**; a tábla aláíratlan.

### 8.3 Három átadási rés

| Rés | Amit senki nem birtokol |
|---|---|
| onkológia → hospice | az utolsó kezelés és az első hospice-kapcsolat közti hetek |
| szülőszoba → gyászgondozás | az anya kikerül a szülészeti ellátásból, a gyász hónapokig tart |
| gyászgondozás → következő terhesség | az új gondozó nem tudja, hogy volt veszteség |

Mindhárom a 15. modul **elmulasztott vizit** mintájára működik: a hiány **jel**,
nem üres mező. Küszöb nélkül a rés nem mérhető — és ez **nem azt jelenti, hogy
nincs rés**, hanem hogy nem mérhető.

---

## 9. Amit ez a két terület sem tesz

- **Nem kezel.** A kardiológiai kezelés kardiológusé, a tünetkontroll
  palliatív szakorvosé. A rendszer besorol, jelez és átad.
- **Nem ad küszöböt az NT-proBNP-hez.** Az helyi laborvalidálást kíván.
- **Nem javasol terhességmegszakítást, és nem beszél le róla.**
- **Nem érvénytelenít előzetes rendelkezést.**
- **Nem dönti el, hogy egy beavatkozás életfenntartó-e.**
- **Nem sorol be aláírás nélkül gondozási szintet.** Mindkét tábla aláíratlan,
  tehát tájékoztató.

---

## 10. Ami még hiányzik a teljeskörűséghez

A kardiológia és a palliatív réteg ezzel megvan; a belgyógyászati teljesség
ezen túl még nyitott. A hiányjegyzék ezeket a modul saját regisztereiből gyűjti:

- **thrombophilia és antikoagulálás** — a mechanikus műbillentyűnél már
  felmerül (a K-vitamin-antagonista magzatkárosító, a heparin kevésbé véd), de
  önálló rétege nincs;
- **vesebetegség és eGFR terhességben** — a kreatinin-alapú becslés terhesen
  félrevezet;
- **autoimmun kórképek** (SLE, antifoszfolipid-szindróma) terhességi
  vonatkozása;
- **gasztroenterológia** — beutalás marad;
- **pulmonológia** — az asztma terhességi kezelése a gyógyszerrétegre épülne.

---

## 11. Elfogadási kritérium

1. A GDM és a praegestatiós diabétesz **külön entitás**, nem egy mező két
   értéke.
2. A trimeszterspecifikus laborreferenciák felvéve és **hitelesítve** — vagy a
   mérés `nincsKuszob` állapotot ad, nem felnőtt sávot.
3. A szülés utáni GDM-újraértékelés elmaradása **jelet ad**.
4. A gyógyszer terhességi információja **gesztációs korhoz kötött**, nem
   igen/nem.
5. A hatókörön kívüli kérdésre **beutalás** a válasz, nem saját protokoll.

---

## 12. Nyitott kérdések

- **Melyik trimeszterspecifikus referencia?** Nemzetközi ajánlás vagy hazai
  labor sajátja? Ez a 18. lépés kérdésének endokrin változata: *idegen
  populáción mért tartomány idegen választ ad.*
- **A PCOS-kritériumrendszer** melyik változata, és ki írja alá?
- **Hol a határ** a szülészeti és a belgyógyászati felelősség között? Ez nem
  fejlesztési kérdés, de a rendszernek tudnia kell, kihez szól a teendő.
