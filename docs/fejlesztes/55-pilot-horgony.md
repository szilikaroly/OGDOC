# 55 — A pilot előfeltételei, és a napló vége

*A 16. lépés gépi fele. A lánc, ami a múltat köti meg — de a végét nem.*

---

## Amiért ez a lépés más súlyú a többinél

Ez az első lépés, ami **beteg-azonosításra alkalmas adatot** érint.

Minden eddigi kapu azt akadályozta meg, hogy a rendszer rossz **számot**
mondjon: hitelesítetlen laborreferencia, aláíratlan normogram, ellenőrizetlen
küszöb. Egy rossz szám javítható.

Amit itt rontunk el, az nem. A jogalap nélkül felvett adat nem lesz
visszamenőleg jogszerű attól, hogy később megkérdezik a beteget; az elveszett
vajúdási idősor nem áll össze emlékezetből; és a klinikus, aki egyszer
elveszítette benne az adatot, többé nem bízik benne.

---

## A hiba, amit ez a lépés talált

**A lenyomatlánc a múltat köti meg, a végét nem.**

A napló minden bejegyzése hordozza az előzője lenyomatát, tehát bármelyik
**közbülső** bejegyzés eltűnése vagy módosulása kimutatható. De ha egy negyven
bejegyzésből álló naplóból az **utolsó öt** vész el — csonkolt fájl, félig
átmásolt mentés, régebbi pillanatképből visszaállított eset —, akkor a maradék
1–35 lánc **hiánytalan**:

- `verifyChain()` → `ok: true`, `kind: "ok"`, *„a lánc ép: 5 bejegyzés…”*
- `verifySealedChain()` → `ok: true` (a rejtjelezett alakon is)
- `SecureCaseStore.read()` → felolvassa, hibátlanul
- `restoreDrill()` → átmegy

Öt vajúdási bejegyzés hiányzik, és **nem szól semmi**.

Ez nem hibás megvalósítás. A naplóban **nincs olyan adat**, amiből ez
kiderülhetne: a lánc az utolsó bejegyzést semmihez nem köti. A modul saját
fejléce viszont az ellenkezőjét állította — *„a módosított érték, a kihagyott
bejegyzés és a **levágott napló** mind más helyen töri el”* —, vagyis a próza
olyat ígért, amit a szerkezet nem tudott hordozni. Ez a hibacsalád ötödször
kerül elő ebben a rendszerben, és most az adatvesztésnél.

### Miért éppen most derült ki

Mert a 16. lépés **első elfogadási kritériuma** így szól: *„két hét éles
használat után a rendszer **nem veszített adatot**”.* Ez a mondat mérést ígér,
és a pilot **előtt** kell tisztázni, mivel mérnénk. A kézenfekvő válasz a
lenyomatlánc lett volna — és éppen ez az, ami erre a kérdésre nem felel.

---

## A horgony

Írás után, **külön fájlba** (jobb esetben külön kötetre, még jobb esetben külön
gépre) egy három adatból álló csúcsjelzés: **eset, utolsó sorszám, utolsó
lenyomat**.

```
napló:    1 ─ 2 ─ 3 ─ 4 ─ 5              (a lánc szerint hibátlan)
horgony:                        ▸ 10     (a napló 10-ig tartott)
                                → 5 bejegyzés HIÁNYZIK
```

Miért nem a naplóban áll: ami a naplófájlban van, azt **ugyanaz a csonkolás
viszi el**, ami a bejegyzéseket — és akkor a bizonyíték pontosan abban a
pillanatban tűnik el, amikor kellene.

Hat állapotot különböztet meg, mert a teendő is más:

| Állapot | Mit jelent | Bizonyított? |
|---|---|---|
| `ep` | a napló a horgonyig tart, a lenyomat egyezik | **igen** |
| `elorefut` | a napló túlnyúlik a horgonyon — normális, az írás és a horgony között idő telik | **igen** |
| `levagott` | a napló a horgony **előtt** ér véget → adatvesztés | nem |
| `elagazott` | a horgony sorszámán más lenyomat áll → két napló, nem egy | nem |
| `lancHiba` | a lánc maga sérült — a horgonyt fel sem kell tenni | nem |
| `horgonyNelkul` | **nincs horgony** → az épség nem bizonyított | nem |

Az utolsó a lényeg. **A hiányzó horgony nem „rendben”.** Horgony nélkül a
rendszer nem azt mondja, hogy nem veszett adat, hanem hogy **nem tudja** — és a
két állítás összekeverése pontosan az a hiba, amit ennek a kritériumnak ki
kellene zárnia.

### Két szabály, ami ebből következik

**A horgony az írás UTÁN áll be, soha előtte.** Egy előre felvett horgony olyan
véget állítana, ami sosem lett tartós, és a következő ellenőrzés adatvesztést
kiáltana ott, ahol nem történt.

**A horgony csak előre mehet.** A rövidebb naplóhoz „hozzáigazított” horgony
pontosan azt fedné el, amit mutatnia kell. A `FileHorgonyTar` ezért a visszafelé
írást hibának tekinti, nem frissítésnek.

**És a sikertelen horgonyírás nem buktatja el az írást.** Az adat ekkor már
tartós; visszamondani azt, ami megtörtént, hazugság volna. Ami elveszett, az a
**bizonyíthatóság** — és ez `error` szintű működési naplósor, nem elnyelt hiba.

---

## Az öt előfeltétel, és a kettő, amit a terv nem sorol fel

A terv öt előfeltételt szab: tároló (1.), adatvédelmi döntések (3.), számítási
hitelesítések (6–8.), megőrzés (10.), riasztási rend (15.).

**Mind az öt teljesülhet úgy, hogy a rendszer valódi adaton mégsem futhat.**

| | Előfeltétel | Ma |
|---|---|---|
| ☐ | *(1.)* Tartós, jogosultsághoz kötött, auditált tároló | a kulcsok fájlban állnak, nem HSM-ben |
| ☐ | *(3.)* Adatvédelmi döntések | 0/38 szabály aláírva |
| ☐ | *(6–8.)* Számítási hitelesítések | 0/32 referencia, 0/3 normogram, 0/11 küszöb |
| ☐ | *(10.)* Megőrzési idők | 0/14 aláírva |
| ☐ | *(15.)* Riasztási rend | 0/8 riasztástípus kiadható |
| ☐ | **[kimondatlan]** Hitelesítés | NINCS — a cselekvőt kérésfejléc állítja |
| ☑ | **[kimondatlan]** Naplóhorgony | megvan, a tárolóba bekötve |

A **hitelesítés** nincs a felsorolásban, és épp ez az az előfeltétel, ami a
másik ötnél hangosabban hiányzik: a cselekvő kilétét ma egyetlen ellenőrizetlen
kérésfejléc állítja, a jogosultsági réteg pedig arról dönt, akinek a kérés
mondja magát. A kiszolgáló ezért `OGDOC_SYNTHETIC=1` nélkül **el sem indul** — a
rendszer maga mondja ki, hogy valódi betegadaton nem futhat.

Ez nem a terv pontatlansága: a felsorolás a **dokumentációs** előfeltételeket
nevezi meg. A gépi fele ezért a tervbelieket és a rendszer saját kapui által
kikényszerítetteket **külön tartja**, és a kapu mindkét halmazt megköveteli.

**A kapu csak bizonyítékból nyílik.** A nyilvántartásban nincs olyan mező, amit
„kész”-re billentve el lehetne indítani a pilotot — ugyanaz a szerkezet, mint a
laborreferenciáknál, a normogramoknál, a kalkulátoroknál, a szepszisküszöböknél,
a megőrzésnél és a mérőeszköz-licenceknél.

### Amit gép nem tölthet ki

Osztály, vezető, kezdődátum — mind `null`. A lépés kimondja: *„egy osztály, egy
vezetővel, aki **vállalja**”*, és a vállalás az, amit gép nem pótolhat. A
rendszer legfeljebb annyit tehet, hogy nélküle nem indul el.

---

## A három zárási kritérium: egy sem mérhető magától

| Kritérium | Ma | Miért |
|---|---|---|
| *„nem veszített adatot”* | **mérhető** | de csak a horgony óta — enélkül `meroeszkozNelkul` volt |
| *„a klinikusok nem kerülték ki”* | **nincs nevező** | a rendszer csak a számlálót ismeri |
| *„mondott olyat, amit a klinikus nem vett volna észre”* | **elérhetetlen** | 0/8 riasztástípus kiadható |

**A nevező.** A rendszer tudja, hány esetet rögzítettek benne; azt nem, hány
esetet láttak el az osztályon. Kikerülési bejegyzés hiánya nem bizonyíték: aki
kikerüli a rendszert, épp azt nem hagyja benne nyomon. A nevező nélkül a mérés
nem pontatlan, hanem **értelmetlen**.

**Az elérhetetlenség.** A harmadik kritérium a 15. lépéstől függ. Amíg egyetlen
riasztástípus sem kiadható, a rendszer **meg sem szólal** — tehát nem lehet
olyan eset, ahol mondott valamit, amit a klinikus nem vett volna észre. Ez nem
teljesítetlen kritérium, hanem elérhetetlen; a különbség a teendőben van.

**És a mérhetetlen kritérium a legveszélyesebb.** Amihez nincs mérés, az a pilot
végén **magától „teljesült”-nek fog látszani** — a validálás ezért mindkettőt
külön kimondja.

> **A hiányzó mérés sehol nem „teljesült”.** A pilot végén a *„nem veszítettünk
> adatot”* és a *„nem mértük, veszítettünk-e”* két különböző mondat, és éppen a
> pilot az, aminek ezt a kettőt szét kell választania.

---

## Ami elkészült

| | |
|---|---|
| `core/pilot/horgony.ts` | a horgony, hat állapot, a horgonytár, az adatvesztés-mérleg |
| `core/pilot/felkeszultseg.ts` | előfeltételek, a kapu, a zárási kritériumok mérhetősége |
| `registry/pilot/pilot.json` | 5 + 2 előfeltétel, 3 zárási kritérium, 3 üres emberi mező |
| `core/store/biztonsagos.ts` | a tároló **megkérdezi** a horgonyt olvasás előtt, és írás után beállítja |
| `core/journal/types.ts` | a fejléc hamis állítása javítva, `Horgony` típus |
| `tools/gen-pilot.ts` | `npm run pilot` → [`../megfeleles/15-pilot.md`](../megfeleles/15-pilot.md) |
| `test/pilot.test.ts` | 26 teszt — az első kettő magát a hibát rögzíti |

Munkalap: [`../megfeleles/15-pilot.md`](../megfeleles/15-pilot.md).
