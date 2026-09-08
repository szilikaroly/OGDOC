# 38 — Az anamnézis-gerinc

*A [13. lépéslista](../13-18-lepes.md) 4. lépése: az a mérték, ami megmondja,
mikor kész a `03` modul — és két klinikai hiba, ami közben kiderült.*

---

## A feladat, ahogy a lépéslista kimondja

> **Kész, ha.** Egy szintetikus eseten az anamnézis kitöltése után a CMQCC-, a
> VBAC-, a Caprini- és a szűrési modul **egyetlen további kérdés nélkül**
> megkapja a bemeneteit, és ezt teszt bizonyítja.

A tét nem elméleti. A lépéslista maga nevezi meg a projekt legkockázatosabb
pontját: *ha a kódolt bevitel lassabb a gépelésnél, a klinikus kikerüli.*
Minden modul, ami újra megkérdez valamit, amit a rendszer már tudhatna, ezt a
bukást hozza közelebb.

---

## Mi számít „további kérdésnek"

Nem minden hiányzó bemenet az. Egy vérnyomás vagy egy ultrahanglelet nem
kérdés, hanem **mérés**. A kritérium ezért csak akkor mér valamit, ha
megkülönbözteti őket — a `core/anamnezis/gerinc.ts` minden hiányzó bemenetet
forrásba sorol:

| Forrás | Mi tartozik ide | Ha hiányzik |
|---|---|---|
| `anamnezis` | a `hx.*` gerinc | **a gerinc hiányos** — valakit újra megkérdeznek |
| `felvetel` | `patient.*`, `anthro.*`, `ctx.*` | a felvételkor rögzítendő, nem új kérdés |
| `meres` | `lab.*`, `status.*`, `us.*`, `op.*`, `labour.*` | jogosan hiányzik, amíg nem mérték meg |
| `ismeretlen` | besorolatlan előtag | **hiba** — egy új modul nem sodródhat be némán |

### A levezetett mező nem kérdés

Az `anthro.bmi` hiánya nem azt jelenti, hogy a BMI-t meg kell kérdezni — hanem
hogy a testmagasság vagy a terhesség előtti testsúly hiányzik. A kérdéslista
ezért a számított mezőket **rekurzívan a bemeneteikre bontja**, és csak azt
sorolja fel, amit tényleg meg kell kérdezni:

```
anthro.bmi     → anthro.height, anthro.weight.prepregnancy
patient.age    → patient.birthDate
ctx.ga         → ctx.lmp
```

Ha egy számított mező minden bemenete megvan, de az érték mégsem áll elő, a
számított mező marad a kérdés: ott a képlettel van baj, nem az adattal.

---

## Ami hiányzott: a vérzési kockázat modulja

A négy nevesített modulból három megvolt (`vbac.ts`, `vte.ts`, `screening/`).
A **CMQCC vérzési kockázatbecslés** nem — pedig az anamnézis dokumentációja
név szerint hivatkozik rá (`hx.repro.prevBirth.pph`: *„a CMQCC vérzési
kockázatbecslés közvetlen bemenete"*). A repóban csak az intrapartum
**stádiumbeosztás** (`calc.cmqcc.stage`) és a **szepszisszűrő** volt meg; a
felvételkori kockázati rétegzés hiányzott.

Most megvan — és a tényezők túlnyomó részéhez **már megvolt a változó**. Ez a
gerinc erejének a mértéke: a modul megírása nem járt új kérdéssel.

**A tábla adat, nem kód** (`registry/kockazat/cmqcc-verzes.json`): egy tényező
felvételéhez, átsorolásához vagy elhagyásához nem kell kódot írni.

**Szintet viszont nem ad.** A tábla `verification: "assumed"` — a tényezők és a
besorolásuk elsődleges forrásból nincs visszaellenőrizve, és a CMQCC-nek
kombinációs szabálya is van („két közepes tétel együtt magas"). Amíg ez így
van:

> Egy „alacsony kockázat" besorolás rossz táblából **rosszabb**, mint a
> besorolás hiánya — mert megnyugtat.

Ugyanaz a kapu, mint a `calc.verified` a kalkulátoroknál és a `blocksAlerting`
a szepszisprotokollnál: **nyitott feladat, nem lezárt döntés.** A hitelesítés a
6. lépés mintája szerint megy, és utána a szint magától megszületik.

---

## Ami közben kiderült: a rögzített „nem tudom" „nem"-mé vált

Ez a lépés két olyan hibát hozott felszínre, amit nem kerestünk.

### 1. A kockázati modulokban

A `tristate` mezők kódlistája megnevezi azt a kódot, ami nem tényállítás,
hanem a tudás hiánya (`unk`, `flags: ["unknown"]`). A kockázati modulok viszont
így néztek rá: `r.value === "pos"` → hamis. Vagyis:

> „Nem emlékszem, volt-e thrombosisom" ⟶ **„nem volt thrombosisa"**

A VTE-modul saját dokumentációja mondja ki, mekkora a tét: *a hiányzó
thrombosis-profilaxis a megelőzhető anyai halálozás vezető oka.*

Három állapot van, és mindhárom mást jelent:

| | Mit tudunk | Mi a teendő |
|---|---|---|
| nincs érték | **még nem kérdeztük meg** | kérdezni kell |
| `unk` | **megkérdeztük, és nem tudja** | újrakérdezni nem segít; a bizonytalanságot vinni kell tovább |
| `neg` | **nem** | állítás, amiért valaki felel |

A javítás közös: `nemTudja()` a `core/derive/resolve.ts`-ben, és mind a három
modul (`vbac`, `vte`, `verzes`) külön listán tartja a megkérdezett
bizonytalanságot. A `present`/`fennall` ilyenkor `"unknown"` — nem `false`.

**A gerinc-mértékre ez nem üt vissza:** a rögzített „nem tudom" nem *további
kérdés*, hiszen megkérdeztük. Csak nem szabad „nem"-mé válnia.

### 2. A szűrési esedékességben — és itt döntés kellett

Ugyanez a szűréseknél súlyosabb következménnyel járt. Egy `unk` válasz az
`appliesWhen` feltételben `notApplicable` állapotot adott: a rendszer azt
állította, hogy a szűrés **nem vonatkozik a betegre**. Konkrétan: aki nem
emlékszik, volt-e terhességi cukorbetegsége, nem kapott korai OGTT-jelzést.

Itt egy **meglévő teszt rögzítette a régi viselkedést**, formai érvvel: *„`unk`
= rögzített ismerethiány. A feltétel `eq pos` nem teljesül rá."* Az érv
formailag igaz, klinikailag rossz — de ez klinikai döntés, nem fejlesztői.

Ezért a választ **a szabályra bíztuk, adatként** (`unknownAnswer`), az
alaphelyzet pedig fail-safe:

```
unknown        — nem tudjuk eldönteni, vonatkozik-e rá; a szűrés nyitva marad
                 (ALAPÉRTELMEZÉS)
notApplicable  — a szabály kimondja: nála a „nem tudom” azt jelenti, nem érinti
```

Így a rendszer nem állítja egy szűrésről, hogy nem érint valakit, olyan válasz
alapján, ami épp a tudás hiányát mondja ki — de a döntés szűrésenként,
egyetlen adatsor átírásával megfordítható, kód nélkül.

**Ez klinikai jóváhagyást kíván.** A két érintett szabály:
`scr.gdm.ogtt.early` (korábbi terhességi cukorbetegség) és
`scr.thyroid.pregnancy` (pajzsmirigy-alulműködés).

---

## Mit bizonyít a teszt

`test/anamnezis-gerinc.test.ts` — 18 teszt egy szintetikus eseten (36 éves, egy
korábbi császármetszés, 26+6 hét):

1. **Az elfogadási kritérium.** Kitöltött anamnézis után mind a négy modul
   `hianyzo` listája üres, és a kérdéslista is.
2. **A mérték mér valamit.** Sorra kivéve **egyetlen** anamnézis-választ, a
   gerinc elbukik — hibabevitellel bizonyítva, hogy a zöld teszt nem üres.
3. **A modulok nem hallgatnak.** A bemenetek meg is jelennek a kimeneten: a
   fennálló tényezők, az ellenjavallat, az esedékes szűrések.
4. **A számított mező helyett a bemenete a kérdés.**
5. **A „nem tudom" nem „nem"** — mindhárom modulban és a szűrésben külön.
6. **A tábla hibái hibaként buknak el:** nem létező változó, ismeretlen szint,
   kódlistán kívüli érték, kétféle feltétel egyszerre, indoklás nélküli tétel.

Futtatható bemutató: `npm run demo:gerinc` — egymás mellett az anamnézis
nélküli és a kitöltött állapot.

---

## Hol van a kód

| | |
|---|---|
| gerinc-mérték | `core/anamnezis/gerinc.ts` |
| vérzési kockázat | `core/scores/verzes.ts` |
| vérzési tábla | `registry/kockazat/cmqcc-verzes.json` (10 tényező) |
| „nem tudom" | `core/derive/resolve.ts` → `nemTudja()` |
| szűrési olvasat | `core/screening/types.ts` → `unknownAnswer` |
| tesztek | `test/anamnezis-gerinc.test.ts` (18) |
| bemutató | `demo/gerinc.ts` — `npm run demo:gerinc` |

---

## Ami továbbra is nyitva van

**A vérzési tábla hitelesítése.** Amíg `assumed`, szint nem születik. Ez a 6.
lépés munkája: név, dátum, elsődleges forrás.

**A `unknownAnswer` klinikai jóváhagyása** a két érintett szűrésre.

**A gerinc négy modulra méri magát.** Ahogy új fogyasztók épülnek (preeclampsia-,
GDM-kockázat, gyógyszer-kontraindikációk), fel kell venni őket a
`gerincAllapot` listájába — különben a mérték szűkebb lesz, mint a rendszer.
A besorolatlan előtag hibaként bukik el, tehát a forrásbesorolás nem sodródhat
el; a fogyasztólista bővítése viszont emberi figyelem.
