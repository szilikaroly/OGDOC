# 48 — A szepszisküszöbök és az omqSOFA-eltérés

*A 9. lépés gépi fele. Két forrás, két szám, egy beteg — és egy kapu, amit
eddig két szó nyitott ki egy JSON-ban.*

---

## A helyzet

A rendszerben **két helyen két szám áll ugyanarra a mérésre**:

| Mérés | CMQCC szepszisprotokoll | omqSOFA (SOMANZ 2017) |
|---|---|---|
| Légzésszám | > 24/perc | > 20/perc |
| Pulzus | > 110/perc | > 90/perc |
| Testhő | 36–38 °C tartományon kívül | < 36 vagy > 38 °C |

A harmadik sor **nem eltérés** — ugyanaz a két határ, csak másképp leírva. Az
első kettő az: két munkacsoport két határértéket közölt ugyanarra az élettani
jelre. Nem elírás, és nem is javítható ki: mindkettő igaz a saját forrásában.

Ehhez jön két hatóköri különbség, ami nem ellentmondás, de a döntésbe beleszól:
a szepszisprotokoll nézi a **fehérvérsejtszámot**, amit a gyorsszűrő nem; a
gyorsszűrő nézi az **oxigénszaturációt**, amit a protokoll nem.

---

## Amit ez a lépés talált

### 1. Az eltérés prózában állt — és a próza nem tud hangosan elavulni

Az eltérés eddig a protokoll `relatedCalculators[].conflict` mezőjében élt,
kézzel írt mondatban, a validátor pedig ezt a mondatot visszhangozta
figyelmeztetésként. Ha valaki a légzésszámküszöböt 24-ről 22-re írja, a mondat
**változatlanul „> 24 vs > 20"-at hirdet**, a figyelmeztetés változatlanul
megjelenik — most már tévesen.

Ez a rendszerben ismerős hiba: a 7. lépésben egy sosem igaz összehasonlítás, a
8.-ban a kód és a leírás elcsúszása. A válasz mindháromszor ugyanaz: **a két
élő definícióból vezessük le, ne prózából.**

A `core/szepszis/kuszob.ts` ezért a küszöböket a kalkulátor **futó kódjából**
olvassa ki — nem a `formula` mező szövegéből, mert a beteg a kódot kapja, nem a
leírást. A paraméternevek pozíció szerint a deklarált bemenetekre képződnek, így
a kód `pulse > 90` alakú összehasonlítása visszavezethető arra a regiszterbeli
változóra, amire a szepszisprotokoll is hivatkozik. Ez teszi a két forrást
összemérhetővé.

A `conflict` mondat megmarad — de mostantól **ellenőrzött**: ha a levezetett
eltérésben olyan szám szerepel, ami a mondatban nem, az **építési hiba**.

### 2. A riasztási kaput két jelölés nyitotta

Ez a súlyosabb.

A rendszer minden más hitelesítési rétege **aláírásból** nyitja a kaput: van egy
lenyomat a normatív magról, és amíg nincs aláírás, a réteg nem ad eredményt. Így
működnek a laborreferenciák (6. lépés), a normogramok (7.) és a kalkulátorok
(8.).

A szepszisprotokoll volt az **egyetlen hely, ahol a kaput két jelölés nyitotta**:
a `verification` szó `"assumed"`-ról `"primary"`-ra írása és a `blocksAlerting`
hamisra állítása. Két szó egy JSON-fájlban — és a rendszer riasztani kezd olyan
határértékekre, amelyeket senki nem vetett össze az elsődleges forrással. A
`cmqcc.org` tartományt a hálózati szabályzat blokkolja, tehát ezek a számok
**másodkézből** kerültek ide.

Rossz számra riasztani ugyanaz a kár, mint jó számra nem.

Mostantól:

- a kapu **akkor és csak akkor** nyílik, ha van érvényes aláírás a mostani
  küszöbökre (`riasztasEngedve`);
- a `blocksAlerting: false` **aláírás nélkül építési hiba**;
- a `verification: "primary"` **aláírás nélkül építési hiba**;
- a futásidejű megítélés (`assess`) alapértelmezésben **zárt** kapuval fut: ha a
  hívó nem ad át kaput, a válasz nem „valószínűleg szabad", hanem „zárva".

**A jelölés tilthat, de nem engedhet.** A `blocksAlerting` továbbra is le tudja
állítani a riasztást aláírás mellett is; bekapcsolni azonban nem tudja. A tiltás
erősebb, mint az engedély.

### 3. Két címke mást ígér, mint amit a gép mér

Ugyanaz az összevetés, mint a 8. lépésben a kód és a próza között — itt a
kritérium **címkéje** és a kritérium **saját küszöbei** között, két irányban:

| Kritérium | Címke | Amit a gép csinál |
|---|---|---|
| `sep.crit.wbc` | „…**vagy > 10% éretlen alak**" | ezt az ágat **nem értékeli ki** — nincs hozzá kritérium |
| `sep.od.creat` | „Kreatinin **emelkedés (a terhességi alapvonalhoz képest)**" | rögzített **97 µmol/L** abszolút határhoz mér |
| `sep.od.bili` | „Összbilirubin **emelkedés**" | rögzített **34 µmol/L** abszolút határhoz mér |

A kreatinin a súlyosabb: a kritérium **saját megjegyzése** mondja ki, hogy
terhességben a kreatinin élettanilag alacsonyabb, és a nem terhes normáltartomány
elrejti a vesekárosodást — a küszöb mégis pontosan egy nem terhes abszolút határ.
Az „alapvonalhoz képest" méréshez alapvonal-változó kellene, ami a rendszerben
nincs.

**A gép ezt nem javítja ki.** Hogy mi az alapvonal és mekkora emelkedés számít,
klinikai kérdés — a gép megnevezi, és a hitelesítés napirendjére teszi.

### 4. „Tartósan" — egy szó, aminek nincs gépi alakja

A pulzuskritérium szövege: „> 110/perc, **tartósan**", a megjegyzése pedig
hozzáteszi, hogy egyetlen mérés nem elég, mert a vajúdás fájdalma és a
vérvesztés is gyorsítja a pulzust. A kiértékelő viszont **egyetlen értéket néz**:
az első 111-es pulzus teljesíti a kritériumot, amit a saját szövege szerint nem
teljesíthetne.

A `Criterion` típus mostantól ismer egy `sustained` mezőt (`count`,
`withinMinutes`), **hogy a hiányt ki lehessen tölteni**. Amíg üres, a jelzés áll.
Hogy hány mérés vagy hány perc a „tartós", a protokoll kérdése, nem a kódé — és
a rossz irányba tippelni itt drága: a túl hosszú ablak késlelteti a felismerést,
a túl rövid értelmetlenné teszi a szót.

---

## A lenyomat — mit fed az aláírás

**Benne van:** minden kritérium változója, iránya, határa és **egysége**; a
„nem értékelhető" állapot és az időbeli feltétel; a két készlet küszöbszáma
(`needed`); a gyermekágyi ablak napokban; az órához kötött csomag határidői és
a lépések sorrendi kötése; a riasztás átvételi határideje.

**Nincs benne:** a címke, a megjegyzés, a forrás idézete, a `verification` szó
és a `blocksAlerting` jelölés. Azok javíthatók az aláírás elvesztése nélkül — a
számok nem.

Az **egység** azért van benne, mert a laktát 2 mmol/l-es küszöbe mg/dL-ben
olvasva **18-szor téves** lenne, és a kód egyetlen sora sem változna.

Az aláírás **tételes**: az `osszevetettKuszobok` felsorolja, melyik küszöböt
vetették össze (`sep.crit.rr>24` alakban), és **ami kimarad, arra nem terjed ki.**

---

## Az intézményi döntés

A `registry/szepszis/kuszob-dontes.json` **szándékosan eldöntetlen**. Nem
fejlesztői kérdés, melyik szám az intézményé: a szülészeti osztályvezető és egy
intenzíves dönti el, és a lépés kimondja, hogy **dokumentumban le kell írni**.

A választás ára mindkét irányban valódi. A szigorúbb küszöb korábban riaszt és
többet téved; a téves riasztást két hét alatt megtanulják elkattintani, és akkor
az igazit is. A megengedőbb ritkábban riaszt, és amikor téved, későn.

A döntés adatként áll, és **lenyomatot vesz azokra az eltérésekre, amelyek
ismeretében megszületett**. Ha a küszöbök azóta elmozdultak, a döntés
**elavulttá válik**, és a rendszer kimondja — nem hallgat.

És amit a döntés **nem** tesz: nem tünteti el a másik forrást. A választott
küszöb lesz a normatív, de az eltérés továbbra is látszik a forrásával együtt.
**Attól, hogy választottunk, a két szám nem lesz egy szám.**

---

## Ami továbbra is nyitva van

- **A 11 küszöbből 0 aláírva.** A `kuszob-hitelesitesek.json` üresen indul, és ez
  nem hiányosság: az elsődleges forrás (CMQCC OB Sepsis Toolkit) beszerzése és a
  tételes összevetés klinikai feladat.
- **A két eltérő küszöb döntés nélkül.** Amíg nincs döntés, a rendszer mindkettőt
  megnevezi a forrásával együtt.
- **A kreatinin- és bilirubinküszöb abszolút, holott a címke alapvonalhoz
  viszonyít.** Alapvonal-változó nélkül nem javítható.
- **A „tartósan" gépi alakja üres.**
- **És a legfontosabb, ami nem ezé a lépésé:** a lépés maga mondja ki, hogy
  *a 15. lépés nélkül a kapu kinyitása ártalmas* — riasztást adni válaszút nélkül
  rosszabb, mint nem riasztani. Az aláírás tehát **szükséges, de nem elégséges**
  feltétele a kapu kinyitásának.

---

## Futtatás

```
npm run szepszis    # munkalap a hitelesítéshez és az intézményi választáshoz
npm run validate    # a kapu, az eltérések és az elcsúszások ellenőrzése
node --test test/szepszis-kuszob.test.ts   # 26 teszt
```

## Fájlok

| | |
|---|---|
| `core/szepszis/kuszob.ts` | a küszöbréteg: levezetés, lenyomat, kapu, döntés |
| `registry/szepszis/kuszob-hitelesitesek.json` | az aláírások — szándékosan üres |
| `registry/szepszis/kuszob-dontes.json` | az intézményi választás — szándékosan eldöntetlen |
| `tools/gen-szepszis.ts` | a munkalap (`npm run szepszis`) |
| `test/szepszis-kuszob.test.ts` | 26 teszt |
