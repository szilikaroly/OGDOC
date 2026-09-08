# 58 — ExAssist: a vizsgálati asszisztens

*A 28. modul gépi fele. A nem dokumentált vizsgálati rész nem normális vizsgálati rész.*

---

## A szabály, és miért a leletnél a legélesebb

Egy hasi ultrahangnál a *„nem írtam le a veséket"* és a *„megnéztem, épek"*
ugyanúgy **üres helyként** jelenik meg. Hat hónappal később a kettő
megkülönböztethetetlen — az egyik mulasztás, a másik lelet, és a különbség
pontosan akkor számít, amikor visszakeresik.

Ez a rendszer legtöbbet ismételt mondatának a vizsgálatra alkalmazott alakja. És
itt élesebb, mint bárhol máshol, mert **a lelet aláírásra kerül**.

Ugyanaz a javítás, mint amit a mérésértékelésben most végeztünk el: ott a küszöb
nélküli mérés `nincsKuszob` állapotot kapott, hogy a hallgatás ne látsszon
megnyugtatásnak. Itt a hiányzó tétel **nem enged lezárni**.

---

## A négy állapot, és amelyik blokkol

| Állapot | Mit jelent | Lezárható-e ettől |
|---|---|---|
| `ertekelve` | megnézte, és leírta, mit látott | igen |
| `nemErtekelheto` | megnézte, **de nem tudta megítélni** | igen — ez válasz |
| `elmaradt` | **nem végezte el**, megnevezett okkal | igen — de a leleten látszik |
| `hianyzik` | nincs bejegyzés | **NEM** |

A `nemErtekelheto` és az `elmaradt` szétválasztása nem szőrszálhasogatás: az
egyik a **beteg** korlátja, a másik a **vizsgálaté**. A *„bélgáz miatt nem
látszott a bal petefészek"* megismételendő; a *„sürgős császármetszésre hívtak"*
nem ugyanaz a teendő.

**És indoklás nélkül egyik kitérő válasz sem fogadható el** — indoklás nélkül a
„nem értékelhető" ugyanolyan üres, mint a hallgatás, csak kipipálva. Ez a kapu
második ága.

---

## A három szint, és ami közöttük nem fordítható meg

| Szint | Ki írja | Mit tehet |
|---|---|---|
| **szakmai minimum** | a rendszer, publikált ajánlásból | alsó korlát |
| **intézményi** | a minőségirányítás | **csak bővíthet** |
| **egyéni** | a vizsgáló orvos | **csak bővíthet** |

A megfordíthatatlanság a lényeg. Egy egyéni vizsgálati sor hozzátehet tételeket,
de a szakmai minimum egyetlen elemét sem veheti ki — különben az „egyéni
protokoll" **a kihagyás intézményesítése** lenne.

Ez **kétszer** van megfogva, mert egyszer kevés lenne:

1. **Szerkezetileg**: a `hatalyos()` azonos azonosítónál a minimum definícióját
   tartja meg, tehát a kísérlet hatástalan.
2. **Kimondva**: a `validateProtokollok()` **hibaként** jelzi a próbálkozást —
   különben csendben maradna, hogy valaki meg akarta tenni.

Ha egy tétel tényleg elhagyható, azt a **minimumban** kell megváltoztatni,
aláírással.

---

## A hitelesítetlen protokoll is kényszerít — és ez szándékos

A tételsorok tartalma aláírásra vár, mint a rendszer minden más küszöbe. A
**szerkezet** viszont addig is véd: a hiányzó tétel akkor is blokkol, ha a
tételsor még nincs hitelesítve.

Ez a biztonságos irány. Máshol a rendszerben a hiányzó aláírás **bezárja** a
kaput; itt **nem nyitja ki**. Több dokumentálást kérni nem árt, kevesebbet igen.

---

## Amit ez a réteg soha nem tesz

**Nem tölti ki a leletet.** Nincs „ép" alapértelmezés, és nincs „minden
normális" gomb — egy ilyen gomb a teljességet **látszattá** tenné: a lelet
teljesnek nézne ki, és senki nem nézte meg a tételeket.

**Nem minősíti a vizsgálót.** A kimaradt tételek száma nem teljesítménymutató.
Amint azzá válik, a rendszer arra tanít, hogy kattintsanak végig — és onnantól a
teljesség hazudik. Ugyanaz a hiba, mint a riasztásnál a 15. lépésben: a
kikényszerített kattintás nem figyelem.

---

## Ami elkészült

| | |
|---|---|
| `registry/exassist/protokollok.json` | 5 protokoll, 37 tétel (31 kötelező), 0 hitelesítve |
| `core/exassist/protokoll.ts` | hatályos tételsor, a négy állapot, a lezárási kapu, validálás |
| `test/exassist.test.ts` | 15 teszt |

**Az öt protokoll**: újszülött-vizsgálat · szülészeti ultrahang · CTG/NST ·
kolposzkópia · fizikális szülészeti vizsgálat.

Két tétel külön említést érdemel. A CTG-protokollban az **anyai pulzus
elkülönítése kötelező** — ennek a kimaradása mutat megnyugtató görbét halott
magzatnál. A kolposzkópiában az **adekvátság** kötelező: enélkül a negatív lelet
nem értelmezhető.

Az újszülött-vizsgálat négy tétele (csípő, vörös reflex, femoralis pulzus, herék
leszállása) azért kötelező, mert ezek a **legtöbbet felrótt kimaradások**.

---

## Ami emberre vár

- **A tételsorok hitelesítése** — melyik ajánlás, melyik kiadás. Ez a 6–8.
  lépéssel azonos természetű munka: `0/5` protokoll aláírva.
- **Az intézményi protokollok** megírása és aláírási ciklusa (a 13. lépés
  dokumentumfája ezt már tudja kezelni).
- **A sürgősségi kivétel.** Egy periarrest császármetszésnél a teljes protokoll
  kikényszerítése ártalmas. Kell egy megnevezett sürgősségi mód, ami *utólagos*
  kiegészítést kér — de nem törli el a hiányt.
- **Az AI-almodul MDR-besorolása** (CTG/NST, kolposzkópia). Amíg nincs eldöntve,
  az almodul kapu mögött marad; l. [`../modulok/28-exassist.md`](../modulok/28-exassist.md).
