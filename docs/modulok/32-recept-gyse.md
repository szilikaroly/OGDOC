# Modul 32 — Gyógyszerfelírás és gyógyászati segédeszköz (GYSE)

*A második dolog a rendszerben, ami kifelé ír és nem hívható vissza.*

---

## A modul egyetlen szerkezeti kérdése

**A kiváltott recept elhagyta a rendszert.**

Az EESZT-csatlakozásnál (14. lépés) ezt már egyszer kimondtuk: *a hibás belső
bejegyzés javítható, az országos térbe küldött üzenet nem.* A recept ennél
tovább megy — **nem csak elment, hanem hatott**: a beteg kiváltotta és beszedte.

Ezért itt a kapuk nem a leletnél, hanem a **kiállításnál** vannak, és egyik sem
figyelmeztetés:

| | Miért kapu, és nem figyelmeztetés |
|---|---|
| **Indikáció ellenőrizve** | a korábbi döntés nem bizonyítja a mostanit (27. modul) |
| **Allergia ellenőrizve** | a hiányzó allergiaadat nem „nincs allergiája" |
| **Terhesség/szoptatás** | ez a rendszer klinikai magja — itt nem lehet mellékszempont |
| **Interakció** | a beteg TELJES aktuális gyógyszerlistájával, nem csak a mienkkel |
| **Vesefunkció** | ahol a dózis attól függ (`rx.crcl` már megvan) |

> **A visszavonás nem visszacsinálás.** A rendszernek tudnia kell rögzíteni,
> hogy egy receptet visszavontak — és tudnia kell, hogy ez **nem ugyanaz**, mint
> ha ki sem állították volna. A különbség a beteg szempontjából az, hogy közben
> beszedte-e.

---

## Mi van már meg

| | |
|---|---|
| `rx.*` — 16 változó | hatóanyag, adag, gyakoriság, indikáció, allergia, CrCl |
| `registry/gyogyszerek/` | 23 hatóanyag szülészeti és szupplementációs kontextusban |
| `core/tele/konzultacio.ts` | a `kiallithato()` kapu: klinikus + ellenőrzött indikáció |
| `core/gyermek/perinatalis.ts` | súlyalapú dozírozás, kemény maximummal |
| Licencpanel | ha az interakciós adatbázis licencelt |

---

## 1. Amit a felírás megkövetel — és amit a rendszer ma nem tud

**A teljes aktuális gyógyszerlista nem a mienk.** A beteg más orvosoktól is kap
gyógyszert, és az interakció-ellenőrzés e nélkül **hamis biztonságot ad**: a
rendszer azt mondja, „nincs interakció", miközben csak a saját listáját nézte.

Két út van, és mindkettőt ki kell mondani:

1. **EESZT-ből lekért gyógyszerelési előzmény** — a 35. modul profilján
   keresztül, beleegyezéssel. Ez a jó út.
2. **A beteg elmondása** — `provenance: patient`, és a rendszernek **tudnia
   kell, hogy ez hiányos lehet**.

Ha egyik sincs meg, az interakció-ellenőrzés eredménye **nem „tiszta", hanem
„nem tudjuk"** — ugyanaz a megkülönböztetés, mint a `nincsKuszob` állapotnál.

---

## 2. GYSE — más jogi tárgy, más szabályok

A gyógyászati segédeszköz **nem gyógyszer**, és a rendszernek nem szabad
ugyanúgy kezelnie:

| | Gyógyszer | GYSE |
|---|---|---|
| Ki írhatja fel | orvos, jogosultsága szerint | **szakvizsgához kötött** eszközcsoportonként |
| Mennyiség | adagolásból | **mennyiségi korlát** időszakonként |
| Támogatás | jogcím szerint | **kihordási idő** — újra csak lejárat után |
| Van-e „javaslat"? | nem | **igen, és ez külön entitás** |

### A javaslat nem rendelés

Ez a modul második kapuja, és a 27. modul laikus kérésének a párja: egy
**szakorvosi javaslat** (pl. gyógytornász vagy szakambulancia javaslata egy
eszközre) **nem rendelés**. Belőle rendelés akkor lesz, ha a jogosult orvos
kiállítja — és a javaslat érvényessége **lejár**.

A rendszernek három állapotot kell megkülönböztetnie:

- `javaslat` — szakorvos javasolta, érvényességi idővel
- `rendelve` — jogosult orvos kiállította
- `kihordas` — kiadva, és a kihordási idő fut

**A kihordási idő alatt újabb rendelés nem indul** — ezt a rendszernek meg kell
mondania, mielőtt a beteg a patikában tudja meg.

---

## 3. Terhesség és szoptatás — ahol ez a modul nem lehet általános

Egy általános receptíró modul beépíthető bárhonnan. **Ez nem az.** A rendszer
klinikai magja szülészet-nőgyógyászat, és a felírásnál ez azt jelenti:

- **A terhességi kategória kötelező bemenet**, nem járulékos információ.
- **A gesztációs kor számít**: ami az I. trimeszterben ellenjavallt, a
  III.-ban lehet elsőként választandó (és fordítva — l. thyreostatikumok).
- **A szoptatás külön kérdés**, nem a terhesség folytatása.
- **A fogamzóképes kor önmagában is szempont**: teratogén szernél a
  fogamzásgátlás kérdése a felírás része, nem utólagos tanács.

Ha a terhességi állapot **ismeretlen**, a rendszer nem esik vissza a „nem
terhes" ágra — ugyanaz a szabály, mint a laborreferenciáknál és a
gyermekgyógyászatnál.

---

## 4. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| `ctx.pregnant`, `ctx.ga` | felírási kapu | **kötelező bemenet** |
| 35. modul profil | interakció-ellenőrzés | a teljes aktuális lista |
| `rx.allergy.*` | felírási kapu | és a 35. modul egyesített allergiamezője |
| `rx.crcl` | dozírozás | ahol a dózis vesefüggő |
| súly (29. modul) | gyermekgyógyászati dozírozás | kötelező |
| kiállított recept | EESZT (14. modul) | **kifelé ír** |
| GYSE-javaslat | `plan.*` | feladat, amíg nincs kiállítva |

---

## 5. A gépi fele — ami elkészült

`core/rx/kiallitas.ts`

**A rés, amit a modul megtalált: két kiállítási kapu volt, és a gyengébbiket a
beteg tudta elindítani otthonról.** A 27. modul `kiallithato()` függvénye két
dolgot kért — megnevezett klinikust és ellenőrzött indikációt —, és a saját
indoklása fel is sorolta, mi minden változhatott közben („terhesség, új
interakció, laboreltérés"), de egyiket sem **kérte**. Egy telemedicinán át
kiállított recept így kihagyta az allergia-, interakció-, terhesség- és
vesefunkció-ellenőrzést. A 27. modul mostantól **ide delegál. Egy kapu van.**

### A tizenegy állapot, és amelyik nem vállalható

| Állapot | Vállalható indoklással? |
|---|---|
| `nincsKlinikus` · `indikacioEllenorizetlen` | **nem** |
| `allergiaNemKerdezve` | **nem** — meg lehet kérdezni |
| `allergiaUtkozik` (nyitva hagyott kérdés) | **nem**; ismert ütközésnél igen |
| `interakcioNemTudjuk` | igen — a teljes lista nem mindig szerezhető be |
| `interakcioTalalat` | igen |
| `terhessegIsmeretlen` | **nem** |
| `nincsTerhessegiBesorolas` | igen |
| `fogamzasgatlasMegbeszeletlen` | **nem** — a felírás része |
| `vesefunkcioIsmeretlen` | **nem** — meg lehet mérni |

> **Az adathiány nem vállalható kockázat.** Amit meg lehet kérdezni vagy meg
> lehet mérni, azt meg kell.

**Az interakció három állapota** a modul legfontosabb megkülönböztetése:
`teljesListaval` · `csakElmondasAlapjan` (hiányos lehet) · `nemTudjuk`. Ha csak
a saját listánkat néztük, az eredmény **nem „tiszta", hanem „nem tudjuk"** — a
„nincs interakció" itt hamis biztonságot ad.

**A visszavonás négy állapota**: `kivaltasElott` · `kivaltotta` · `beszedte` ·
`ismeretlen`. A „nem tudjuk, kiváltotta-e" **nem** „nem váltotta ki".

**GYSE**: `nincsJavaslat` · `javaslatLejart` · `szakvizsgaHianyzik` ·
`mennyisegiKorlat` · `kihordasAlatt`. A kihordási időt **itt** mondjuk meg, nem
a patikában.

### És egy szám, ami magáért beszél

**23 hatóanyagból 23-nak van szoptatási adata, és 0-nak terhességi
állásfoglalása** — egy szülészeti rendszerben. A kiállítási kapu ezért ma
**minden** készítménynél megnevezett kockázatvállalást kíván. Ez szándékos, és
addig tart, amíg a 6. pont nyitott kérdése — melyik besorolás, és ki hitelesíti
— nincs eldöntve.

---

## 6. Elfogadási kritérium

1. Recept **nem állítható ki** ellenőrzött indikáció, allergia- és
   interakció-ellenőrzés, valamint terhességi állapot nélkül.
2. Ismeretlen terhességi állapotnál a rendszer **nem** a „nem terhes" ágat veszi.
3. Az interakció-ellenőrzés eredménye **„nem tudjuk"**, ha a teljes
   gyógyszerlista nem áll rendelkezésre — nem „tiszta".
4. A **visszavonás** rögzíthető, és megkülönböztethető a ki nem állítástól.
5. GYSE-nél a **szakvizsgához kötöttség**, a mennyiségi korlát és a **kihordási
   idő** kapu, nem figyelmeztetés.
6. A **javaslat nem rendelés**, és lejár.

---

## 7. Nyitott kérdések

- **Az interakciós adatbázis**: melyik, milyen licenccel? A licencpanelre kerül.
- **A terhességi kategória forrása**: melyik besorolás (a régi FDA-kategóriák
  visszavonás alatt vannak), és ki hitelesíti? Ez a 6–8. lépéssel azonos munka.
- **GYSE-törzs és támogatási jogcímek**: hazai törzs, ami rendszeresen változik
  — a 2. lépés HBCS-mintájára gépi betöltés kell hozzá.
- **Ki írhat alá GYSE-t** eszközcsoportonként: jogosultsági kérdés, ami az
  intézményi szerepekhez köt.
