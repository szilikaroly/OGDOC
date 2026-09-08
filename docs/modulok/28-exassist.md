# Modul 28 — ExAssist: vizsgálati asszisztens

*A protokoll szerinti vizsgálat dokumentálását nem kéri, hanem elvárja.*

---

## A modul egyetlen szerkezeti kérdése

**A nem dokumentált vizsgálati rész nem normális vizsgálati rész.**

Ez a rendszer legtöbbet ismételt mondatának a vizsgálatra alkalmazott alakja. Egy
hasi ultrahangnál a „nem írtam le a veséket" és a „megnéztem, épek" ugyanúgy
**üres helyként** jelenik meg a leletben — és hat hónappal később
megkülönböztethetetlen. Az egyik mulasztás, a másik lelet, és a különbség
pontosan akkor számít, amikor visszakeresik.

Az ExAssist ezt fordítja meg: **a vizsgálatnak protokollja van**, a protokollnak
tételei, és a lelet addig **nem teljes**, amíg minden tétel nem kapott választ —
akár „megnéztem, ép", akár „nem néztem meg, mert…". A második is válasz; a
**hallgatás nem az**.

> Ez ugyanaz a javítás, amit a mérésértékelésben most végeztünk el: a küszöb
> nélküli mérés `nincsKuszob` állapotot kap, hogy a hallgatás ne látsszon
> megnyugtatásnak. A vizsgálatnál a hallgatás **még veszélyesebb**, mert a
> lelet aláírásra kerül.

---

## Mi van már meg

| | |
|---|---|
| `effectiveFinding` — a nem vizsgált ≠ normálisnak talált | az elv él, de leletszinten nem kényszerül ki |
| `exam.obs.*` változócsoport | a tételek nagy része már definiált |
| Felülettérkép szakaszokkal | a protokolltételek ide köthetők |
| `docs/megfeleles/07-nyomonkovethetoseg.md` | a teljességnek nyoma kell legyen |

---

## 1. Mi az a protokoll, és kié

Az ExAssist **nem egy protokollt** ismer, hanem hármat, és a sorrend kötött:

| Szint | Ki írja | Mikor nyer |
|---|---|---|
| **Szakmai minimum** | a rendszer, publikált ajánlásból | mindig alsó korlát — **nem alálicitálható** |
| **Intézményi** | az intézmény minőségirányítása | a minimum fölött bővíthet |
| **Egyéni** | a vizsgáló orvos | csak **bővíthet**, szűkíteni nem tud |

A megfordíthatatlanság a lényeg. Egy egyéni vizsgálati sor **hozzátehet**
tételeket, de nem veheti ki a szakmai minimum egyetlen elemét sem — különben az
„egyéni protokoll" a kihagyás intézményesítése lenne.

Ha valaki mégis ki akar hagyni egy minimumtételt, arra **egy út van**: a tételt
megválaszolja azzal, hogy **nem végezte el, és miért**. Ez rögzül, látszik, és
auditálható.

---

## 2. A tétel három állapota — és a negyedik, ami nincs

| Állapot | Mit jelent | Teljes-e ettől a lelet |
|---|---|---|
| `ertekelve` | megnézte, és leírta, mit látott | igen |
| `nemErtekelheto` | megnézte, **de nem tudta megítélni** (bélgáz, testalkat, együttműködés) | igen — ez válasz |
| `elmaradt` | **nem végezte el**, megnevezett okkal | igen — de a lelet ezt hordozza |
| *(hiányzik)* | nincs bejegyzés | **NEM** — ez az egyetlen, ami blokkol |

A `nemErtekelheto` és az `elmaradt` szétválasztása nem szőrszálhasogatás: az
egyik a **beteg** korlátja, a másik a **vizsgálaté**. Egy „bélgáz miatt nem
látszott a bal petefészek" megismételendő; egy „nem néztem meg, mert sürgős
császármetszésre hívtak" nem ugyanaz a teendő.

---

## 3. Amit az ExAssist NEM tesz

**Nem tölti ki a leletet.** Nem javasol „ép" választ, nem visz be
alapértelmezést, és nem kínál „minden normális" gombot. Egy ilyen gomb a
teljességet **látszattá** tenné: a lelet teljesnek nézne ki, és senki nem nézte
meg a tételeket.

**Nem minősíti a vizsgálót.** A kimaradt tételek száma nem teljesítménymutató.
Amint azzá válik, a rendszer arra tanít, hogy kattintsanak végig — és onnantól a
teljesség hazudik. (Ugyanaz a hiba, mint a riasztásnál a 15. lépésben: a
kikényszerített kattintás nem figyelem.)

**Nem dönti el, mi a szakmai minimum.** Azt publikált ajánlás és aláírás dönti
el, mint a rendszer minden más küszöbét.

---

## 4. AI-asszisztált vizsgálatok — CTG/NST és kolposzkópia

Az AI-olvasat **javaslat, nem lelet.** Ez nem óvatoskodás, hanem két külön okból
kötelező:

**MDR.** Egy algoritmus, ami CTG-t értelmez klinikai döntés céljából, orvostechnikai
eszköz. A rendszer MDR-fejezete (`docs/megfeleles/09-mdr.md`) ma azt rögzíti, hogy
az OGDOC **nem eszköz** — ez az almodul az a pont, ahol ez a besorolás
megkérdőjeleződik, és a kérdést **a fejlesztés előtt** kell eldönteni, nem utána.

**Klinikai.** A CTG automatizált értelmezése az a terület, ahol a számítógépes
döntéstámogatás nagy, jól dokumentált vizsgálatokban **nem javította** a
kimeneteleket. Egy magabiztos gépi „normális" CTG-olvasat a legrosszabb dolog,
amit ez a rendszer tehet.

Ezért az AI-kimenet szerkezete kötött:

- `provenance: "derived"`, sosem `"clinician"`
- **klinikusi megerősítés nélkül nem lesz belőle lelet** — ugyanaz a kapu, mint a
  beteg-oldali felvételnél
- a modell **neve, verziója és a bemenet pillanatképe** rögzül, különben a
  kimenet visszamenőleg nem magyarázható
- **a bizonytalanság kimenet**, nem hiba: az „ezt nem tudom megítélni" válasz a
  modelltől ugyanolyan érvényes, mint a klinikustól
- ami **kapu mögött** áll: hitelesítetlen modell nem ad kimenetet — pontosan úgy,
  ahogy a `calc.verified` kapu működik

### A jellemzők, mielőtt bármilyen modell szóba jön

A rendszer eddig a CTG **besorolását** tárolta (`ctg.category`, FIGO 2015) — a
három jellemző nélkül, amin a besorolás nyugszik. Ennek három csendes
következménye volt:

1. **A besorolás nem volt visszakövethető.** Utólag nem lehetett megnézni, mi
   alapján született — sem oktatásban, sem esetelemzésben, sem perben.
2. **A kimeneteli huroknak nem volt mit mérnie.** A 17. lépés `outcomeAudit`
   hurka a besorolás és az újszülött állapota közötti kapcsolatot nézné.
3. **És semmilyen modellnek nem volt mit ennie** — a licenckapun túljutóknak sem.

Ezért a jellemzők most mezők: `ctg.baseline`, `ctg.variability`, `ctg.decel`,
`ctg.accel`. A FIGO 2015 szabályai pedig **adat** (`registry/ctg/figo2015.json`),
nem kód.

**A modul ettől még nem osztályoz a klinikus helyett.** A jellemzőkből egy
**második olvasat** születik, és a kettő **összevetése** a termék:

| | Mit jelent |
|---|---|
| `egyezik` | a klinikusi besorolás és a jellemzők ugyanoda mutatnak — nem történik semmi |
| `elter` | **egyet nem értés**: nem felülbírálás, hanem kérdés |
| `nemSzarmaztathato` | hiányzik egy jellemző → a besorolás **nem visszakövethető** |
| `nincsBesorolas` | a származtatott olvasat önmagában **nem** besorolás |

> **A hiányzó jellemző itt sem „normális”.** Variabilitás-érték nélkül a
> „normál” besorolás nem megerősítést kap, hanem elveszti a fedezetét — és a
> különbséget látni kell.

A **preterminális** görbére a modul szándékosan hallgat: azt nem jellemzőkből
ismerik fel, és a teendő azonnali.

### Amit a nyilvános CTG-modellekről tudni kell, mielőtt bármelyiket bekötnénk

Öt nyilvános tár vizsgálata után (`registry/kulso/ctg-ml.json`) két tény
döntött, és egyik sem licenckérdés:

- **Három tár ugyanazt az adatsort használja, bájtra azonosan** (md5
  `e9a749d3…`, 2126 sor). Ez a Kaggle „Fetal Health Classification”, az UCI
  Cardiotocography adatsorból — egyetlen portugál centrumból. **Négy tár tehát
  nem négy bizonyíték:** az egyetértésük egyetlen adatsor visszhangja.
- **A címke nem kimenetel.** A `fetal_health` mező három szülész konszenzusa a
  *görbéről* (normális 77,8% · gyanús 13,9% · kóros 8,3%), nem az újszülött
  állapota. Egy ezen tanított modell azt jósolja, **mit mondanának a szülészek**
  — a szakértői olvasat hibáit is beleértve.

A licenckapu ettől függetlenül tételenként más: **kilenc** megvizsgált tárból
négynek nincs licence (semmi nem vehető át), egy GPLv3 (a terjesztett MIT-műbe
nem kerülhet), kettő MIT, kettő Apache-2.0.

### A panel: külön eredmények, és egy összevonás, ami nem hazudik

`core/ai/egyuttes.ts`

Több modell egyetértése akkor erősít, ha a modellek **függetlenül tévednek**.
Hat modell ugyanabból az adatból **ugyanazt a torzítást** tanulja meg — az
egyetértésük visszhang. Egy „6 modellből 6 egyetért" kijelzés a rendszer
leghatározottabb állítása lenne, és a legkevésbé megalapozott.

Ezért az összevonás **előbb csoportosít, aztán számol**, a **tanítóadat
ujjlenyomata** szerint: *egy ujjlenyomat = egy hang*, akárhány modell tartozik
hozzá.

| Állapot | Mikor |
|---|---|
| `egyetertes` | több **független** hang ugyanazt mondja — **ez az egyetlen eset, ami erősít** |
| `elteres` | független hangok eltérnek: **nem képzünk többséget** — az eltérés maga az információ |
| `egyHang` | akárhány modell, **egy** tanítóadat → visszhang, nem megerősítés |
| `kevertKerdes` | olvasatra és kimenetelre tanított modell — **nem ugyanannak a kérdésnek két becslése** |
| `nincsKimenet` | nincs mit összevonni |

A mai állás: **13 jelölt, 5 független hang** — és nulla nyitott kapu.

### Kolposzkópia

Ugyanez, egy külön korláttal: a színhűség és a felbontás a megítélés
előfeltétele. Egy tömörített képre adott AI-osztályozás **nem ugyanaz** a
művelet, mint élő kolposzkópiánál — és a rendszernek tudnia kell, melyikről van
szó (l. 27. modul, külső képfogadás).

---

## 5. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| protokolltételek | `exam.obs.*` | a tétel válasza a leletmező |
| `exassist.teljesseg` | `epi.*`, `disch.*` | a lelet **nem zárható le** hiányzó tétellel |
| AI-olvasat | `exam.*` | **csak** klinikusi megerősítés után |
| `elmaradt` tételek | `plan.*` | megismétlendő vizsgálat lesz belőle |
| protokollverzió | audit | melyik protokoll szerint készült — visszamenőleg is |

---

## 6. Elfogadási kritérium

1. Egy vizsgálat **nem zárható le**, amíg a protokoll bármely tétele
   bejegyzés nélkül áll.
2. Az egyéni és az intézményi protokoll **nem veheti ki** a szakmai minimum
   egyetlen tételét sem — a validálás ezt hibaként fogja meg.
3. A `nemErtekelheto` és az `elmaradt` **külön** állapot, külön indoklással.
4. Nincs „minden normális" gomb, és nincs alapértelmezett válasz.
5. Az AI-kimenet klinikusi megerősítés nélkül **nem lelet**, és hitelesítetlen
   modell **nem ad kimenetet**.
6. A leleten látszik, **melyik protokollverzió** szerint készült.

---

## 7. Nyitott kérdések

- **A szakmai minimum forrása** vizsgálattípusonként: melyik ajánlás, melyik
  kiadás? (Ez a 6–8. lépéssel azonos természetű hitelesítési munka.)
- **Az MDR-besorolás** az AI-almodulra. Amíg nincs eldöntve, az almodul
  **kapu mögött** marad.
- **A sürgősségi kivétel.** Egy periarrest császármetszésnél a teljes protokoll
  kikényszerítése ártalmas. Kell egy megnevezett sürgősségi mód, ami *utólagos*
  kiegészítést kér — de nem törli el a hiányt.
- **Ki írja alá az intézményi protokollt**, és milyen felülvizsgálati ciklussal?
  (A 13. lépés dokumentumfája ezt már tudja kezelni.)
