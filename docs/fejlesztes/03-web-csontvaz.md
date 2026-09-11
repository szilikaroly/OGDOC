# 03 — A webes csontváz

> **FRISSÍTVE.** A webes réteg 2026-09-05 óta a `core/store/` fölött fut:
> perzisztencia, jogosultság és auditnapló élesben. Ez a dokumentum a
> generikus renderelést és a portolhatóságot írja le; a tárolóra kötést
> a [`40-web-tarolo.md`](40-web-tarolo.md).

```
cd ogdoc && npm run web    →    http://localhost:3000
```

Fut, függőség nélkül, Node 22 natív TypeScript-támogatásával. **47 mezőt renderel,
levezetéssel, validációval, előtöltéssel és kalkulátorokkal** — miközben a felületi
kód egyetlen mezőnevet sem ismer.

## 1. Mit bizonyít

| Állítás | Hogyan látszik |
|---|---|
| Az űrlap a regiszterből generálódik | `app.js` nem tartalmaz mezőnevet, egységet, tartományt, kódlistát |
| A keresztfeltöltés működik | magasság + súly beírása után a BMI **magától megjelenik**, `derived` eredettel |
| A tükör egy adat | a Bishop-kártya tágulat-mezője és a méhszáj-lelet ugyanaz az érték |
| Nincs néma helyettesítés | hiányos bemenetnél a kalkulátor **azt írja ki, mi hiányzik**, nem nullát |
| A kapu tart | a Hadlock teljes UH-biometriával sem ad számot |
| A validáció a regiszterből jön | 500 cm magasság elutasítva: „> megengedett maximum (210)" |
| Az elutasítás nem csendes | az ok megjelenik, **és a mező visszaáll** az utolsó elfogadott értékre |

## 2. Fájlok

| Fájl | Sor | Mi ez | Sorsa |
|---|---:|---|---|
| `web/api.ts` | 130 | **Szállítás-független API.** `write` · `caseView` · `formSpec` · `docFor` | **változatlanul átmegy** a végleges stackre |
| `web/server.ts` | ~250 | Node-`http` kiszolgáló — **mostantól a `core/store/` fölött**, nem memóriában ([`40-web-tarolo.md`](40-web-tarolo.md)) | **eldobandó** |
| `web/public/app.js` | 240 | A generikus renderer | React-komponensre cserélendő, de a logikája marad |
| `web/public/style.css` | 70 | Világos és sötét téma | tervrendszerre cserélendő |
| `web/public/index.html` | 35 | Váz | keretre cserélendő |

Az arány szándékos: **a maradandó rész az `api.ts`**, ami nem tud a szállításról.

## 3. Amit a felület csinál, és amit nem

### Amit igen

- `GET /api/formspec` → szekciónként bejárja a `FieldSpec`-eket, és típus szerint
  vezérlőt választ (`number` · `select` · `tristate` · `checkbox` · `date` · `readonly`);
- a `phi` és a `levezetett` jelölést kiírja, a `hint`-et a mező alá teszi;
- az azonosítóra kattintva megnyitja a **generált** meződokumentációt;
- íráskor felvillantja azokat a mezőket, amiket az írás átszámoltatott (`affected`);
- az előtöltési javaslatot indoklással és forrásmegjelöléssel mutatja, **Elfogadom**
  gombbal — nem tölti ki magától.

### Amit nem

- **Nem validál.** Elküldi az értéket, és a motor válaszát mutatja. Így nincs két,
  idővel szétcsúszó validációs szabály.
- **Nem számol.** A BMI a szerverről jön, nem a böngészőből.
- **Nem dönt a jogosultságról.** A `phi` jelölés megjelenítés; a védelem a szerveren van.

## 4. Amit a csontváz szándékosan nem tartalmaz

| Hiányzik | Mikor jön | Miért nem most |
|---|---|---|
| Perzisztencia | M2 | A `CaseState` sorosítása a tábla-leképezéssel együtt értelmes. |
| Hitelesítés, sorszintű szabályok | M4 | Bérlőmodell nélkül félmegoldás lenne. |
| Auditnapló | M4 | A 25. modul követelménye. |
| Többfelhasználós elkülönítés | M2 | **EGY eset van, globálisan.** |
| Kliensoldali útvonalválasztás | M3 | Egy oldal elég a lánc bizonyításához. |
| Nemzetköziesítés | M3 | A magban megvan (`lang`), a felületen nincs kikapcsolva. |

> **FRISSÍTVE (2026-09-05):** a perzisztencia, a jogosultság és az auditnapló
> azóta ÉLES. Ami maradt: **nincs hitelesítés** — a kiszolgáló ezért
> `OGDOC_SYNTHETIC=1` nélkül el sem indul. Részletek:
> [`40-web-tarolo.md`](40-web-tarolo.md).
>
> **Ezért a csontváz soha nem futhat valódi betegadattal.** Ez a `server.ts`
> fejlécében és az oldal tetején is ki van írva.

## 5. Az út a végleges stackig

| Lépés | Mit kell tenni | Mi marad |
|---:|---|---|
| 1 | `server.ts` → TanStack server functions | `api.ts` érintetlen |
| 2 | `CaseState` → Postgres `values` tábla | `core/` érintetlen |
| 3 | `app.js` → React `FormRenderer` | a `FieldSpec` szerződés érintetlen |
| 4 | sorszintű szabályok + `audit_log` | új réteg az `api.ts` **alatt** |
| 5 | tervrendszer | `style.css` cseréje |

A 3. lépésnél a `FormRenderer` ugyanazt teszi, amit ma az `app.js`: `FieldSpec`-et
fogyaszt. **A vezérlő-választás logikája átemelhető** — csak a DOM-kezelés cserélődik
JSX-re.

## 6. Ellenőrzött viselkedés

Böngészőben (Chromium, Playwright) végigfuttatva:

```
BMI mező (168 cm, 92 kg)         →  32.6                   ✔ magától megjelent
MAP (152/96)                     →  115 mm[Hg] — emelkedett ✔ sávval együtt
Sokk-index (118 / 152)           →  0.78 — normális         ✔
Testfelszín                      →  „hiányzik: anthro.weight.current"  ✔ nem 0
Becsült magzati súly (teljes UH) →  kapu mögött             ✔ nem ad számot
anthro.height = 500              →  elutasítva, a mező visszaállt 168-ra  ✔
JS-hiba a konzolon               →  nincs                   ✔
```

## 7. A második változat — navigátor, csukható modulok, adaptív elrendezés

A csontváz első változata **egyetlen 56 000 pixeles lap** volt: 46 modul egymás
alatt, 893 mező, navigáció nélkül, és a modulok fejléce a **nyers kulcs**
(`hx.repro`, `pedgyn`, `exam.obs`), mert a névnek nem volt helye. A második
változat ezt a négy dolgot oldja meg — és a regiszter-vezérelt elv változatlan:
`app.js` továbbra sem tud egyetlen mezőnevet, és mostantól **modulcímet sem**.

### A modulnév adat, nem kód

`registry/felulet/modulcimek.json` — 46 cím (hu + en), 12 csoport, leírás. A
`buildFormSpec()` a `SectionSpec`-be teszi (`title`, `titleFallback`, `group`,
`groupTitle`, `groupOrder`), a felület onnan rajzolja. Ha egy kulcsnak nincs címe,
a nyers kulcs látszik — **jelölve**, ugyanúgy, mint minden forrásnyelvi visszaesés.

A validálás **két irányban** ellenőriz: minden regiszterbeli modulkulcsnak kell cím
(különben klinikus elé nyers kulcs kerülne), és minden címnek kell létező kulcs
(különben egy átnevezés után elárvult sor hazudik). A sorrend a **betegúté** — ki
a beteg, felvétel, előzmény, státusz, vizsgálatok … lezárás —, nem az ábécé.

### Amit a felület kapott

| | |
|---|---|
| **Navigátor** | bal oszlop, 12 csoport, modulonként mezőszám és kitöltöttség; a képernyőn lévő modul aktív (IntersectionObserver) |
| **Csukható modulok** | csukva indulnak, az első kivételével; a nyitottság a néző böngészőjéé (`localStorage`, try/catch-ben), nem a rendszeré |
| **Kereső** | ékezet- és kisbetű-független, címkére és azonosítóra; a találatos modul kinyílik, a többi eltűnik; `/` fókuszál, `Esc` töröl |
| **Számláló** | modulonként „n / m kitöltve" — csak a **látható** mezőket számolja, a rejtett click-open láncot nem |
| **Három oszlop → kettő → egy** | 1240 px és 900 px a töréspontok; telefonon a navigátor fiók (☰) |
| **Mezősor a tárolóhoz igazodik** | `@container (max-width: 36rem)` — a címke a mező fölé kerül, nem a képernyő, hanem az oszlop szélessége dönt |
| **Nyomtatás** | navigátor és segéd eltűnik, minden modul nyitva, a mezősor nem törik |

### Két döntés, ami nem stílus

**Rendszer-betűkészlet, szándékosan.** Ez kórházi alkalmazás, és a kórházi intranet
lehet offline: egy webről töltött betűtípus némán visszaesne, és a felület más lenne
a demón, mint az osztályon. A tipográfia a skála és a súlyok, nem a betű neve.

**A felső sáv magassága mérve, nem feltételezve.** Keskeny képernyőn a sáv három
sorba törik. A fiók eltolása először rögzített `3.4rem` volt — és a sáv **rátakart a
fiók tetejére**. Most a böngésző méri (`ResizeObserver`, border-box), és a CSS onnan
olvassa (`--sav-h`). Az első javítás `contentRect`-et használt, és 1 pixellel a sáv
alá csúszott: a padding és a szegély nem volt benne.

### Ami menet közben derült ki

A `paint(r.view)` hívás — amit a böngészős próba az írásnál tegnap megtalált —
**két további helyen** is ott volt: a javaslat elfogadásánál és a megerősítésnél.
Ugyanaz a TypeError, csak ritkábban futott. Most egyetlen `frissit()` van, hogy ne
lehessen még egyszer háromfelé elrontani.

### Ellenőrzött viselkedés

Böngészőben (Chromium, Playwright), friss példányon, három szélességen:

```
46 modulszakasz, 1 nyitva induláskor          ✔
egyetlen fejléc sem nyers kulcs               ✔  a cím a regiszterből
laphossz csukott modulokkal                   4 009 px (volt: 56 058)
kereső: „troponin"                            1 találat 1 modulban, a többi eltűnik
Mind kinyit / Mind becsuk                     46 / 0
BMI (168 cm, 64 kg) újratöltés nélkül         22.7   ✔  számláló: „2 / 4 kitöltve"
1000 px                                       két oszlop
390 px                                        egy oszlop, nincs vízszintes görgetés
390 px: fiók a sáv ALATT kezdődik             135 → 135 px  ✔
390 px: mezősor egymás alá                    container query  ✔
kezeletlen JS-kivétel                         nincs
```

## 8. A harmadik változat — feladat-adaptív felület, skála, kimondott lefedettség

A második változat panasza pontos volt: **„a mező nagyon kevésnek tűnik”** és
**„az i18n nem működik”**. Egyik sem az volt, aminek látszott — és épp ezért
kellett mindkettőt szerkezetileg megoldani, nem stílussal.

A mező nem volt kevés: 893 volt, csukva. A felület a betegút sorrendjét mutatta
mindenkinek, és egy szülésznőnek a 46 modulból az első — az azonosító adatok —
nyílt ki. Az i18n nem volt elromolva: a felület saját szövegei átváltottak, de a
**klinikai címkék 3 %-a** (30/905) van angolul, és a nyelvválasztó ezt nem mondta
ki — „Angol”-t ígért, és magyar címkéket adott `HU` jellel.

### A feladatprofil adat, nem kód

`registry/felulet/feladatprofilok.json` — 8 profil: felvétel, vizit, ügyelet,
szülés, ápolás, zárás, szakterületi konzultáció, kutatás. Egy profil a
**nyitott modulok** listája és sorrendje, meg a segédpanelek sorrendje. A
jogosultság dönti el, mit *lehet* látni; a profil azt, mi van **nyitva és elöl**.
A kettő nem keverhető: a szülésznő a labort is látja, ha a jogosultsága engedi —
csak nem az van elöl.

Az alapértelmezés a bejelentkezett felhasználó **élő megbízásának csoportjából**
jön, de bármikor átváltható: a feladat nem a munkakör, hanem az, amit épp csinál.
A validálás négy dolgot fog meg: ismeretlen modulkulcs; klinikai csoport profil
nélkül; **modul, amit egyetlen feladat sem hoz elő** (7 ilyen volt az első
változatban — `admin`, `addr`, `demog`, `anthro`, `hx`, `hx.origin`, `ekg`);
ismétlés a sorrendben.

### A nyelvválasztó kimondja, mit kap, aki vált

„Angol · 3% klinikai címke — csak a felület.” A szám a kiszolgálótól jön
(`coverage()`), nem becslés. A fordítás nem gépi: a klinikai szöveget a rendszer
elvből nem fordítja. Ehhez készült a **fordítói munkalap**
(`npm run forditas` → `docs/fejlesztes/forditas-munkalap-en.md`): 875 címke és
2 451 opciócímke, modulonként, forrásnyelvi alakkal — a fordító dolga, nem a
felületé.

És ami ebből derült ki: a **mezősúgó angolul némán eltűnt**. A címke
forrásnyelvre esett vissza jelölve; a súgó (`howToMeasure`, `pitfalls`) csak a
célnyelvet nézte, és 350 mező mérési útmutatója hiányzott. Most ugyanúgy esik
vissza, jelölve (`hintFallback`).

### A mért érték a sávon: ⊢──·──⊣

A mező alatt egy skála: a zárójel a sáv, a pont a mért érték, és a tartományon
kívüli érték a zárójelen **kívül** ül — nem a szélére szorítva. Két különböző
zárójel, két szín: a **referenciatartomány** (kék) és a **kritikus küszöb** (rózsa,
„beavatkozási küszöb — nem referencia”). A kettő nem ugyanaz, és a skála sem nézhet
ki ugyanúgy. A felirat a kontextust és a hitelesítési szintet is mondja
(`pregnancy.t3 · assumed`), és a küszöb nélküli mérés is megszólal: „nincs mihez
mérni”.

Minden szám a magból jön: a `MeresErtekeles` kapott egy numerikus `sav` mezőt
(`low`, `high`, `fajta`), a `/api/case` kiviszi, a felület csak pozíciót számol.
A `hatar` szöveg megvolt már — abból visszafejteni azt jelentette volna, hogy a
szám két helyen él.

### Ami menet közben derült ki

**A várható szülési időpont `1795132800000` volt.** A Naegele-kalkulátor
epoch-ezredmásodpercet ad; a zárójelentés ezt ISO-dátummá formázta, a webes nézet
és a levezetett mező nem. Ugyanaz a tény három helyen, kétféle alakban — és a
`ctx.edd` dátum-változóban a szám a saját típusát sértette: a rá épülő kalkulátor
`Date.parse`-szal olvasta volna, ami NaN, vagyis némán „hiányzó bemenet”. Most a
kalkulátor-réteg adja a megjelenítési (`display`) és a tárolási (`stored`) alakot,
és minden fogyasztó azt használja. Teszt: `test/kalkulator-datum.test.ts`.

**Az alapértelmezett feladat az első megbízást nézte.** A rendszergazdai megbízás
az első a listában, és annak nincs profilja — a mellette lévő klinikai megbízás
sosem szólalt volna meg. Az első *profillal rendelkező* megbízás dönt.

**Egy osztálynév két dolgot jelentett.** A `.feladat` volt a feladatsor tárolója
és a navigátor „ehhez a feladathoz tartozó" tétele is: a navigátor minden tétele
kártyát kapott. A tároló `.feladatsor` lett.

### Ellenőrzött viselkedés

```
osztályos orvos belép → „Felvétel és anamnézis”     19 modul nyitva, javaslatok elöl
szülésznő feladatra vált                              9 modul, kalkulátor + teendő elöl
nyelvválasztó                                         „Angol · 3% klinikai címke — csak a felület"
(i) súgó ráállva                                      látszik; angolul 350/350 marad, HU jellel
ALT 95 (kritikus −∞–70)                               pont a zárójelen KÍVÜL, vörös
éhomi vércukor 5,8 (terhes: 3–5,1)                    kritikus, kontextus kiírva
LDH 300 (82–524, pregnancy.t3, assumed)               sávban, zöld, „assumed" kiírva
ctx.edd                                               2026-11-20 (volt: 1795132800000)
haladás                                               10 kitöltve · 778 látható · 893 összesen
390 px, sötét mód                                     rendben
kezeletlen JS-kivétel                                 nincs
```
