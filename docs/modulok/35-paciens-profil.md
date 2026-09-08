# Modul 35 — Páciens profil és előélet-összefoglaló

*Az entitás, ami minden modulban jelentkezik — és az összefoglaló, ami elhallgat.*

---

## A modul egyetlen szerkezeti kérdése

**Egy összefoglaló attól összefoglaló, hogy kihagy. És ami kimaradt belőle, az
nem látszik rajta.**

A rendszer eddigi minden szabálya arról szólt, hogy a **hiányzó adat ne
látsszon nemleges válasznak**. Az AI-összefoglaló ennek a legveszélyesebb
esete, mert a hiány itt nem üres mező, hanem **sima, olvasható, magabiztos
szöveg**.

Kétszáz EESZT-dokumentumból készült összefoglaló, ami öt piros zászlót kiemel,
**száznyolcvanöt dokumentumról hallgat** — és ez a hallgatás pontosan úgy néz
ki, mint a „nincs más fontos".

> **Ezért az összefoglaló nem az, amit a klinikus elolvas a dokumentumok
> helyett. Az, ami megmondja, MELYIK dokumentumot kell elolvasnia.**
> A különbség nem árnyalat: az egyik helyettesít, a másik irányít.

---

## Mi van már meg

| | |
|---|---|
| `core/ai/modell.ts` | AI-kapu: a kimenet **javaslat**, klinikusi megerősítésig |
| `hx.eeszt.*` — 12 változó | EESZT-ből származó előzményadat csontváza |
| Beleegyezési keret (3. lépés) | célhoz kötött, visszavonható |
| Megőrzési horgonyok (10. lépés) | a letöltött másolatnak **saját** órája van |
| `provenance` / `confidence` | a származás minden értéken ott van |
| Licencpanel | ha az összefoglaló modell licencelt |

---

## 1. A profil három rétege — és a felelősség köztük

| Réteg | Mi | Ki felel érte |
|---|---|---|
| **Belső profil** | amit mi vettünk fel: azonosítás, ellátási kapcsolatok | mi |
| **Jelenlegi kezelés** | aktuális gyógyszerek, eszközök, gondozások | **megosztott** |
| **Előélet** | EESZT-ből letöltött dokumentumok | **a forrás** |

A második a legnehezebb, és ma ez hiányzik leginkább: a beteg más orvosoktól is
kap gyógyszert. Ha a „jelenlegi kezelés" csak a mi felírásainkat tartalmazza,
akkor az interakció-ellenőrzés (32. modul) **hamis biztonságot ad** — és ez a
rendszer egyik legveszélyesebb csendes hibája lenne.

---

## 2. Az allergia — ami nem jöhet az összefoglalóból

**Ez a modul legfontosabb szabálya.**

Egy elmulasztott allergia halálos. Egy AI-összefoglaló, ami az allergiát
*kiemeli*, azt is jelenti, hogy néha **nem emeli ki** — és a klinikus, aki
megszokta, hogy ott van, a hiányát „nincs allergiája"-ként olvassa.

Ezért:

- Az allergia **strukturált mező**, nem összefoglaló-szövegrészlet.
- Az AI **rámutathat** egy dokumentumra („ebben allergiáról lehet szó"), de a
  mezőt **nem tölti ki**.
- A mezőt klinikus tölti ki, forrásmegjelöléssel.
- Az **üres allergiamező nem „nincs allergiája"** — külön érték kell arra, hogy
  *megkérdeztük és nemet mondott*.

### És egy találat, ami már most látszik

Az allergia ma **öt változóban, négy modulban** él szétszórva:
`rx.allergy.penicillin`, `rx.allergy.other`, `rx.allergy.reaction`,
`diet.allergies.food`, `op.who.signIn.allergy`.

Aki a műtői ellenőrzőlistán bejelöli, az nem tudja, hogy a gyógyszerelési
modul másik mezőt néz. **Ez a modul első dolga: egyetlen allergia-entitás**,
amire mind az öt hely nézetként hivatkozik (`mirror`, ahogy a rendszer a
Bishop-score duplikátumait már megoldotta).

---

## 3. Az összefoglaló, ami megmondja, mit nem olvasott

Az AI-összefoglaló a `core/ai/modell.ts` kapuja mögött fut, és a kimenete
`derived` — de ezen felül **három saját szabálya** van:

**1. A lefedettség kimondva.** Hány dokumentumot kapott, hányat dolgozott fel,
mit nem tudott értelmezni (szkennelt lelet, rossz minőségű OCR, ismeretlen
formátum). *„182/200 dokumentum feldolgozva, 18 nem értelmezhető"* — ez az
összefoglaló első sora, nem a lábjegyzete.

**2. Az időbeli határ.** Meddig tart az előzmény? Ha a legrégebbi letöltött
dokumentum 2019-es, akkor az összefoglaló **nem mond semmit** az azelőttiről —
és ezt ki kell írni, különben úgy néz ki, mint teljes élettörténet.

**3. Minden állítás mögött dokumentumhivatkozás.** Hivatkozás nélküli mondat
nem kerülhet bele. Nem azért, hogy ellenőrizhető legyen — hanem hogy
**ellenőrizni KELLJEN**.

---

## 4. A beleegyezés, és ami utána következik

Az EESZT-ből letöltött dokumentum **másolat**, és attól kezdve a mi
felelősségünk:

- **Célhoz kötött**: az összefoglaló elkészítéséhez adott beleegyezés nem
  kutatási felhasználás.
- **Visszavonható**, és a visszavonás után a **másolat is** megy — nem csak az
  összefoglaló (10. lépés törlési kapui).
- **Saját megőrzési órája van**, ami a letöltéskor indul, nem az eredeti
  dokumentum keletkezésekor.
- **A letöltés ténye auditsor**, és a lekérdezett dokumentumok köre is.

---

## 5. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| profil → allergia | 32. modul felírási kapu | **strukturált mező**, nem szöveg |
| profil → jelenlegi kezelés | 32. modul interakció | a teljes lista, vagy „nem tudjuk" |
| EESZT-dokumentumok | `hx.eeszt.*` | klinikusi megerősítéssel |
| AI-összefoglaló | **sehova** | javaslat marad, amíg valaki át nem veszi |
| piros zászlók | `plan.*` | feladat lesz, nem megállapítás |
| beleegyezés visszavonása | törlési kapuk (10.) | a másolat is megy |

---

## 5b. Az allergia egyesítve — ami elkészült

`registry/variables/03-anamnezis.json` (`allergy.*`) · `core/profil/profil.ts`

Az allergia öt mezőben élt három modulban, nézetkapcsolat nélkül. **Az
egyesítés viszont nem az volt, amit az eredeti javaslat mondott** („a többi
legyen `aliasOf` nézet"), mert a három modul **nem ugyanazt kérdezte**.

**Az entitás — öt mező, egy helyen:**

| | |
|---|---|
| `allergy.list` | az allergének listája — **ez az egyetlen entitás** |
| `allergy.asked` | **feltették-e a kérdést** (`pos` / `neg` / `unk`) |
| `allergy.reaction` | a reakció — **allergénenként** (`scopedBy`) |
| `allergy.severity` | a súlyosság — allergénenként |
| `allergy.verified` | igazolt · anamnesztikus · **cáfolt** |

**Felváltva** (`status: superseded`, az értékek visszaolvashatók):
`rx.allergy.penicillin`, `rx.allergy.other`, `rx.allergy.reaction`. Az utóbbi a
legfontosabb: **egyetlen reakciómezőben** az, aki penicillinre csalánkiütést és
latexre anafilaxiát kapott, csak az egyiket tudta megőrizni — és a megmaradó a
rossz irányba is tévedhetett.

**Ami megmarad, mert MÁS KÉRDÉS** — és ezt ki kell mondani, különben a következő
olvasó duplikátumnak veszi és összevonja:

- `diet.allergies.food` — az ételallergia **fajtáit** részletezi; a tényét az
  `allergen.etel` hordozza.
- `op.who.signIn.allergy` — **ellenőrzési tény**, nem allergia-állítás: azt
  rögzíti, hogy *egyeztették-e*. És **boolean**, tehát nincs benne hely a
  „megkérdeztük, de a beteg nem tudja" esetnek — *a WHO-sor kipipálása nem
  bizonyítja, hogy az allergia ismert.*

> **A cáfolt allergiát nem töröljük.** A bejegyzett penicillin-allergiák
> jelentős része kivizsgálva cáfolható, és a téves címke szűkebb, drágább,
> gyakran rosszabb antibiotikumválasztáshoz vezet. Ha törölnénk, a következő
> felvételkor a beteg újra elmondaná — **a cáfolat tudása veszne el.**

A validáló mostantól **hibát** ad valódi maradékra, és figyelmeztetést a csak
névben allergiamezőkre — indoklással.

---

## 5c. A két maradék kritérium — ami elkészült

### A visszavonás nem törli a történelmet

A követelmény így hangzott: *„a beleegyezés visszavonásakor a letöltött másolat
is törlődik"*. Igaz — de önmagában félrevezető, mert **három** különböző dolog
keletkezett a beleegyezésből, és a három sorsa nem ugyanaz:

| | Mi | Miért |
|---|---|---|
| `torlendo` | a **letöltött másolat** | a mi tárolónkban él, a mi megőrzési óránkkal, és a jogalapja szűnt meg |
| `visszavonando` | a belőle készült **összefoglaló**, ha klinikus már olvasta | döntés épülhetett rá — nyomtalanul nem tüntethető el, de új döntéshez nem használható |
| `megtartando` | amit a klinikus **saját állításként rögzített**, és a **hozzáférések auditnaplója** | törlésük nem adatvédelem, hanem a dokumentáció meghamisítása |

> **A leggyakoribb hiba az első és a harmadik összemosása.** Egy „töröljünk
> mindent" gomb az auditnaplót is elviszi — és onnantól nem bizonyítható, hogy a
> visszavonás után már nem nyúlt hozzá senki. *Az auditnapló törlése a
> visszavonás ellentéte.*

### A jelenlegi kezelés teljessége — és a harmadik dimenzió

`kezelesTeljesseg()` tölti fel a 32. modul interakció-kapuját:
`teljesListaval` · `csakElmondasAlapjan` · `nemTudjuk`.

És ami kimaradt volna: **az idő.** Egy három hónapja letöltött EESZT-lista
**nem** a jelenlegi lista. Teljes volt — *akkor*. Azóta a beteg kaphatott új
gyógyszert bárkitől, és **éppen az az új szer az, amivel az interakció
fennállna**: a friss hiány pontosan ott van, ahol a kockázat. A lejárt teljesség
ezért nem „majdnem teljes", hanem `nemTudjuk` (frissességi határ: 30 nap).

---

## 6. Elfogadási kritérium

1. **Egyetlen allergia-entitás**, és az öt mai mező nézet rá.
2. Az üres allergiamező **nem** „nincs allergiája" — külön érték a megkérdezett
   nemleges válaszra.
3. Az AI-összefoglaló **nem tölt ki strukturált mezőt**, csak rámutat.
4. Az összefoglaló kimondja a **lefedettségét** és az **időbeli határát**.
5. Hivatkozás nélküli állítás nem kerül az összefoglalóba.
6. A „jelenlegi kezelés" megmondja, **teljes-e** — és ha nem, az interakció-
   ellenőrzés eredménye „nem tudjuk", nem „tiszta".
7. A beleegyezés visszavonásakor a **letöltött másolat is** törlődik.

---

## 7. Nyitott kérdések

- **Az összefoglaló MDR-besorolása.** Egy szöveg, ami piros zászlókat emel ki
  klinikai döntéshez, a 11. szabály hatálya alá eshet. Az `registry/mdr/`
  kérdéssora ezt már felteszi — a válasz nélkül az almodul zárva marad.
- **Melyik modell**, milyen licenccel, hol fut? Betegadaton futó modell nem
  mehet ki az intézményből — ez a licencpanel és az adatvédelem metszete.
- **Mi történik, ha az összefoglaló téved?** A 17. lépés audit-hurka a
  szerkezet: a klinikus elfogadja vagy elveti, és **az elvetés is adat**.
- **Ki tölti ki az allergiamezőt**, ha a beteg nem tud róla, de egy régi
  dokumentum igen?
