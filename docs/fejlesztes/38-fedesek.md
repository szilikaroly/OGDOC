# 38 — Fedések: mely mezők fedik ugyanazt

*A rendszer visszatérő hibacsaládja — és az első kísérlet arra, hogy ne
egyenként bukkanjon fel.*

---

## A minta

Ez a hiba eddig **mindig utólag** derült ki, és **mindig azért, mert valaki
észrevette**:

| Hol | Mi történt |
|---|---|
| Bishop-pontszám | az összetevők külön mezőkben, a réteg csak az egyiket nézte |
| magzatvízmennyiség | két mező, két megítélés |
| éhomi vércukor | `lab.ogtt.0` 5,1 mmol/L-nél kritikus, `lab.glucose.fasting` 7,0-nál — attól függött, melyik mezőbe gépelték |
| allergia | öt mező, három modul, nézetkapcsolat nélkül |

Mindegyik ugyanaz: **ugyanaz a klinikai tény több változóban él, és a rétegek
külön-külön nézik őket.**

---

## A gépi fele

`tools/dupla-mezok.ts` (`npm run fedes`) — **négy jel, és egyik sem bizonyíték
önmagában**: azonos szabványkód (LOINC/SNOMED) · azonos kódlista · azonos
mértékegység + ritka közös címkeszó · azonos utótag más modulban.

> **Az első futás 249 párt talált, és a többsége zaj volt.** Minden pontszám
> `{pont}` egységben van, és mindegyik címkéjében ott a „pontszám" szó: az
> EPDS-összpont és az Apgar így „azonos egység + közös címkeszó" párnak látszott.
> A javítás elve: **egy jel csak akkor ér valamit, ha ritka.** Egy címkeszó, ami
> negyven változóban ott van, nem bizonyít semmit; egy, ami kettőben, igen.
> A finomítás után: **95 jelölt.**

---

## Az emberi fele

`registry/fedes/dontesek.json` — a jelölt **nem ítélet**. Két mező lehet
jogosan hasonló és lehet valódi duplikátum; a különbséget ember dönti el, de a
döntésnek **nyoma** kell legyen, különben a következő olvasó újra elkezdi.

- **`kulon`** — más kérdésre válaszolnak. **Indoklás kötelező**: a hasonlóság
  magától nem tűnik el, és a következő fejlesztő ugyanúgy duplikátumnak látja
  majd.
- **`fedes`** — ugyanazt fedik. Ilyenkor nem elég kimondani: **feloldás kell**,
  és amíg nincs, ez **hiba**. *Egy elismert, de kezeletlen fedés rosszabb a fel
  nem ismertnél, mert a tudás megvan, és mégsem történik semmi.*

---

## A két fedés, ami komoly

### 1. A vérvesztés — `labour.qbl` ↔ `op.intra.qbl`

Ugyanaz a vérzés, két mezőben, **két küszöbbel**:

| | küszöb |
|---|---|
| `labour.qbl` (a szülés kezdetétől kumulatív) | **300 mL** (WHO/FIGO/ICM 2025) |
| `op.intra.qbl` (a műtét alatt mért) | **1000 mL** |

Egy vajúdó nő, aki császármetszésre kerül: **400 mL vajúdás közben kritikus,
700 mL a műtét alatt nem — és az 1100 mL összesent senki nem számolta ki.** A
CMQCC-stádium bemenete kizárólag a szülés alatti érték volt.

A szülés utáni vérzés az anyai halálozás vezető oka világszerte, és a késedelem
a legjobban dokumentált hozzájáruló tényezője. **Ez a fedés ott volt, ahol a
legdrágább.**

Feloldás: **összegző** (`labour.qbl.total`), és a CMQCC-stádium mostantól azt
nézi. Mindkét mező megmarad — a dokumentáció szempontjából számít, hol
veszítette. És **a hiányzó szakasz nem nulla**: ha a beteg vajúdott, de a
szülészeti érték hiányzik, az összeg **alsó becslés**, és a `verzesOsszeg()` ezt
kimondja.

### 2. Az önkárosítás — `psy.epds.q10` ↔ `psy.phq9.q9`

Két kérdőív, **egy kérdés** — és mindkettő dokumentáltan kritikus tétel:
*pozitív válasz az összpontszámtól függetlenül teendőt jelent.* Külön mezőkben
három baj lehet:

1. az egyik pozitív, a másikat fel sem tették → a réteg, ami csak a másikat
   nézi, **semmit nem lát**;
2. a régi pozitív és az új nulla → **a pozitív nem avul el magától**;
   újraértékelés kell hozzá, nem újabb kérdőív;
3. és a legrosszabb: **a fel nem tett kérdés nullaként viselkedik**.

Feloldás: egy állapot a kettő fölött (`pozitiv` · `nemleges` ·
**`nemKerdeztek`**).

---

## Két nyitott fedés

`ctx.multiple` ↔ `hx.eeszt.multiple` és `hx.eeszt.chronicDisease` ↔
`hx.sys.asthma` — mindkettő ugyanaz a kérdés: **felülírhatja-e az importált
EESZT-rizikókód a rendszer saját mezőjét, vagy csak jelezhet?** Ez a 26. modul
(előéleti import) döntése, és nem fejlesztési kérdés. Addig `nyitott`:
megnevezett feladat, nem elfelejtett kérdés.
