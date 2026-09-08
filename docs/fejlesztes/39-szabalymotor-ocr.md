# 39 — Szabálymotor és OCR-beolvasás

*Két átvett minta, és két dolog, amit másképp csinálunk.*

---

## 1. A szabálymotor

`core/szabaly/motor.ts` — a klinikai besorolások java része nem pontozás, hanem
**sorrendezett tábla**: az első illeszkedő sor nyer. A motor maga semmilyen
klinikai tartalmat nem hordoz.

Ez nem esztétika: a licencköteles tábla (ACR, IOTA) kimaradhat a tárból, a motor
nem; egy irányelvfrissítés adatfájl-csere; és a találat **visszakereshető** a
forrás egy sorára — *egy besorolás, amit nem lehet visszavezetni a táblára,
klinikailag használhatatlan.*

### Amit átvettünk

- sorrendezett szabályok, első találat nyer, **a sor sorszáma az eredmény része**;
- a kifejezések **betöltéskor** ellenőrződnek, nem futásidőben — a hibás készlet
  be sem töltődik;
- az **egyszeres `=` külön tiltva**: nemcsak biztonsági rés, hanem egy elgépelt
  `=` az `==` helyett némán mindig igazzá tenné a szabályt, és a sorrendezett
  táblában **az első sor mindent elnyelne**;
- az esetkészlet a **forrástábla soraiból** jön, nem az implementációból.

### Amit másképp — és ez a lényeg

Az átvett leírás szerint *„a hiányzó mező nem hiba, hanem jelzés: 0-ként számol,
de a `missing` listában megjelenik"*.

**Ebben a rendszerben ez nem fogadható el**, és pontosan az a hiba, ami ellen az
egész projekt épül. Nulla az O-RADS-ban azt jelenti, hogy **nincs** ascites,
**nincs** peritonealis nodulus. Ha a mezőt senki nem töltötte ki, akkor a
„nem magyarázott ascites → O-RADS 5" szabály **csendben nem sül el**, a
kiértékelés továbbmegy, és egy későbbi sor adhat **O-RADS 2-t**. A `missing`
lista kiírása ezen nem segít: a kategória már megszületett, és az olvasó azt
látja.

> Ezért: **ha egy szabály hiányzó mezőre hivatkozik, a kiértékelés megáll.** Nem
> ugorjuk át, mert a sorrendezett táblában az átugrott sor jogosultsága
> eldöntetlen, és minden utána következő találat megalapozatlan. Az eredmény
> `eldonthetetlen`, és megnevezi, **melyik sornál** és **melyik mező** miatt.

A valódi ACR-táblákon próbálva: 38 US és 19 MRI szabály hibátlanul betölt, és
`ascites` nélkül a motor **nem ad kategóriát**.

### Tartalom és licenc

| | Hol |
|---|---|
| **a motor** | `core/szabaly/motor.ts` — tartalommentes, a tárban |
| **közkincs táblák** (CDC US SPR) | `registry/fogamzas/` — a tárban |
| **licencköteles táblák** (ACR O-RADS, IOTA ADNEX) | `registry/kepalkotas/helyi/` — **gitignorált** |

A `validateTerjesztes()` **build-hibává** teszi, ha ACR- vagy IOTA-forrású tábla
a terjesztett fába kerül. *A másolás egy parancsnyi, a következménye nem.*

---

## 2. Az első három tábla — CDC US SPR 2024 (közkincs)

`spr.kok.kimaradt` · `spr.pop.kimaradt` · `spr.terhessegKizarasa` — 17 sor.

**A legfontosabb, amit a feldolgozás kimondott:** a két progesztogén-tabletta
ablaka **gyökeresen különbözik** — a noretiszteron/norgesztrel POP-nál **3 óra**,
a drospirenonnál **48**. Egyetlen „POP" mezőben kezelve a 3 órás ablakot 48-nak
olvasva a védelem elveszne. Ezért a `tipus` külön mező, és a tesztek pontosan
ezt a 4 órás esetet mérik: ott az egyik fajtánál már kimaradt, a másiknál még
nem.

Az **ulipristál-acetát** minden sorban kivétel a sürgősségi fogamzásgátlás alól
— a folytatódó hormonszedés csökkenti a hatását.

---

## 3. Az OCR-beolvasó — ahol a néma hiba nem a karakter

`core/ocr/beolvasas.ts` · `registry/ocr/egysegek.json`

**A karakter-tévesztés látható.** Egy „8" helyett olvasott „3" valószínűtlen
értéket ad, a tartomány-ellenőrzés megfogja.

**A mértékegység-tévesztés néma, és nagyságrendeket mozgat:**

| | szorzó |
|---|---|
| vércukor mg/dL → mmol/L | 18× |
| **kreatinin mg/dL → µmol/L** | **88,4×** |
| folsav mg → µg | 1000× |
| hemoglobin g/dL → g/L | 10× |

A kreatinin a döntő példa. Egy **5,0 mg/dL** kreatinin súlyos veseelégtelenség
(442 µmol/L). Ugyanaz a szám µmol/L-ként beírva **5,0** — és az **a tartományon
belül van**. Tökéletesen életszerű szám, ami eltünteti a veseelégtelenséget. *A
tartomány itt nem véd, mert az érték nem valószínűtlen, csak rossz skálán van.*

> **Ezért: egység nélkül nincs beírás.** Az ügynök **nem tippel a
> nagyságrendből**, még akkor sem, ha a szám „nyilvánvalóan" az egyik skálára
> esik — mert épp ez az a művelet, ami a kreatinin-példán elbukik, és az ilyen
> hiba magabiztos, életszerű, és senki nem nézi meg újra.

Hét állapot: `javasolhato` · `szamNemOlvashato` · **`egysegNelkul`** ·
`egysegIsmeretlen` · `egysegNemValthato` · `bizonytalanOlvasat` ·
`tartomanyonKivul`.

És az `analitFuggo` jelölés arra emlékeztet, hogy a **mg/dL ↔ mmol/L nem egyetlen
szorzó**: analitonként más, mert a molekulatömegtől függ. Egy közös szorzó a
rendszerben a legrosszabb fajta egyszerűsítés lenne.

**A beolvasás javaslat**, `provenance: "derived"` származással — klinikusi
megerősítés nélkül nem lesz belőle rögzített érték. Ugyanaz a kapu, mint az
AI-olvasatnál és a beteg-oldali felvételnél.
