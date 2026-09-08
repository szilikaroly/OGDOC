# 42 — Külső protokollok: mit jelent „integrálni”

*A BCNatal-katalógus, és a négy állapot, amiből csak a negyedik ér valamit.*

Egy kérés így hangzott: **integráljuk a rendszerbe** a barcelonai perinatológiai
központ protokolljait és kalkulátorait
(`fetalmedicinebarcelona.org/en/protocols/`, `.../calc-en/`).

A kérés jogos. A szó viszont kétértelmű, és a kétértelműség itt drága.

---

## Két dolgot jelenthet, és nem mindegy, melyiket

| | Hivatkozás | Átvétel |
|---|---|---|
| Mi kerül be | hogy LÉTEZIK, és mihez szólna hozzá | a képlet, a küszöb, a görbe |
| Ki mondja ki | mi, a saját katalógusunkban | a rendszer, a klinikusnak |
| Mi a kockázata | hogy sosem szerezzük be | hogy egy nem olvasott oldalból SZÁM lesz |

A második az igazi tét. Egy percentilis, ami egy soha nem olvasott oldal
**címéből** származik, pontosan úgy néz ki, mint egy hiteles percentilis. A
hiány látszik; a rossz szám nem.

---

## Ami történt: a forrás NEM volt beszerezhető

Mindkét URL-t megpróbáltuk lekérni. **Egyiket sem sikerült.** A futtatókörnyezet
egress-proxyja a `fetalmedicinebarcelona.org` domaint blokkolja — a `CONNECT`
kérésre HTTP 403 jön (`WebFetch`: `EGRESS_BLOCKED`; `curl`: *„CONNECT tunnel
failed, response 403”*).

Ezért a katalógusban szereplő **címek és kategórianevek keresőtalálatokból
származnak, nem a forrásból.** Ezt nem a lábjegyzetben rögzítettük, hanem
mezőben: minden tétel `cimForrasa: "kereses"`, és a forrás
`beszerzes.amitNemTudunk` mezője kimondja, mi az, amit nem tudunk:

> a protokollok szövege, a kalkulátorok képletei, együtthatói, referenciagörbéi
> és bemenetei

Vagyis: **a lényeg.**

---

## A négy állapot

```
nem-beszerzett → beszerzett → feldolgozott → hitelesitett
```

| Állapot | Mi van meg | Mit ad a rendszerhez |
|---|---|---|
| `nem-beszerzett` | a cím | **semmit** |
| `beszerzett` | a szöveg, változatlanul, lenyomattal | **semmit** |
| `feldolgozott` | a képlet a mi formánkban | **semmit** |
| `hitelesitett` | valaki NÉVVEL igazolta, hogy ez van ott | ez az egyetlen, ami hozzáad |

Ez ugyanaz a kapu, ami már négy helyen működik: `calc.verified` a
kalkulátoroknál, `verification: "verified"` a normogramoknál,
`verification: "assumed"` a CMQCC vérzési táblánál (ezért nem ad szintet), és
`blocksAlerting` a szepszisprotokollnál. Nem új elv — **ugyanaz az elv, kiterjesztve.**

## És van egy még előbbi kapu: a licenc

`licenc.ismert === false` esetén az átvétel **akkor sem indulhat el, ha a
szöveg a kezünkben van, és akkor sem, ha hitelesített.** A sorrend nem
mindegy: egy hitelesítetlen átvételt még ki lehet javítani, egy jogosulatlant nem.

Ezt a `test/kulso.test.ts` külön bizonyítja: a forrást hitelesítettre állítva,
minden tételt megnevezett hitelesítővel ellátva **az átvétel továbbra is
elutasított**, és az indoklás a licencet nevezi meg.

Ez a SNOMED CT GPS (CC BY-ND 4.0) és az ICHOM tanulsága. A BCNatal-protokollok
saját minősítése — *„orientative information … directed to specialist doctors”* —
szakmai iránymutatásra utal, **nem szabad felhasználásra.** A kettő nem ugyanaz,
és a különbséget nem mi dönthetjük el.

---

## Amit ez MA mégis ér

A katalógus 24 tétele (19 protokoll + 5 kalkulátorkategória) mindegyike
megnevezi, **melyik változónkhoz** kötődne, és a validálás ezt ellenőrzi: egy
átnevezés nem szakíthatja el némán a katalógust attól, amihez köti magát.

Ezért a haszon a beszerzés **előtt** látszik:

| Terület | Mit adna hozzá | Ma |
|---|---|---|
| Doppler | percentilis és MoM az indexekhez | 39 katalogizált görbe, **0 hitelesített** |
| Növekedés | FGR/SGA-besorolás, súlypercentilis | súlybecslés van, percentilis nincs |
| Kormeghatározás | CRL-alapú számítás | LMP-ből számolunk, `ctx.gaSource` megvan |
| Szív | morfometriai z-score-ok | 28 katalogizált szívgörbe, egyik sem telepítve |
| Ikrek | TTTS/TAPS-küszöbök | `ctx.multiple` megvan, küszöb nincs |

Enélkül a „szerezzük be?” kérdés eldönthetetlen, mert nem látszik, mit
nyernénk vele. **A katalógus egyetlen mai haszna épp ez** — és nem kevés.

---

## Fájlok

| Fájl | Mi ez |
|---|---|
| `registry/kulso/bcnatal.json` | a katalógus — **átvett tartalmat nem tartalmaz** |
| `core/kulso/protokoll.ts` | a négy állapot, a licenckapu, a kötések, a validálás |
| `test/kulso.test.ts` | 15 teszt: a kapuk mindkét irányban |

A `npm run validate` a katalógust minden futásnál ellenőrzi, és a záró sorban
kiírja: `1 külső forrás (24 tétel, ebből 0 átvéve)`.

**Ez a szám ma nulla, és ez nem hiba — ez a helyzet pontos leírása.**

---

## Nyitott feladat, megnevezve

1. **A forrás beszerzése** — a hálózati akadály feloldása vagy a tartalom más
   úton (intézményi hozzáférés, közlemény) való megszerzése.
2. **A licenc tisztázása** — enélkül az 1. lépés eredménye sem használható fel.
3. **Feldolgozás és hitelesítés** — tételenként, megnevezett hitelesítővel, a
   6. lépés mintája szerint.

Amíg ez a három nincs meg, a rendszer viselkedése **változatlan** — és a
katalógus pontosan ezt mondja ki.
