# 14 — Gyógyszerelés: a kapu, ami ténylegesen megáll

> Ez a fejezet egyetlen mondatot valósít meg:
>
> **„Az anamnézisben bejelölt asztma a szülőszobán megállítja a carboprost
> rendelését."**
>
> Az adat a felvételkor kerül be. A döntés hetekkel később, más modulban, más
> felhasználótól születik. A rendszer mégis összeköti a kettőt — és ez az egész
> keresztmodul-feltöltés próbaköve.

## 1. A kapu három választ ad, és a harmadik a lényeg

```
clear   — a feltétel bizonyítottan nem áll fenn
blocked — a feltétel fennáll: hard-stop vagy figyelmeztetés
ask     — A FELTÉTELHEZ SZÜKSÉGES ADAT HIÁNYZIK
```

Az `ask` nem finomkodás. Ha a hiányzó asztma-anamnézis csendben „nincs
asztmája"-ként viselkedne, a kapu **pont annál a betegnél nyílna ki**, akinél a
felvétel kapkodó volt. A helyes válasz nem a tiltás és nem az engedés, hanem a
**kérdés** — ott, akkor, egy mezőre mutatva:

```
Carboprost: a kontraindikáció nem dönthető el, mert hiányzik hx.sys.asthma.
A hiányzó adat NEM jelenti azt, hogy a kontraindikáció nem áll fenn —
kérdezze meg, mielőtt rendel.
```

Egy szernek több kapuja is lehet, és a rendszer **nem az elsőn áll meg, hanem
az összesen**: a rendben lévő thrombocytaszám mellett a megválaszolatlan
véralvadási anamnézis továbbra is kérdés marad.

## 2. A megkerülés: nyoma van, de lehetséges

A kapu **nem megkerülhetetlen** — van klinikai helyzet, ahol a kockázat
vállalható. De:

```ts
prescribe(reg, drugs, state, "rx.carboprost")
// GateError: ASZTMA — a carboprost ABSZOLÚT KONTRAINDIKÁLT…
//            Helyette szóba jön: rx.oxytocin, rx.misoprostol, …
//            A rendelés indoklás nélkül nem folytatható.

prescribe(reg, drugs, state, "rx.carboprost", {
  overrideGate: "gate.carboprost.asthma",
  overrideReason: "Életveszélyes atóniás vérzés, minden más uterotonikum kimerítve…",
  by: "dr. …",
})
// → a készítmény felkerül, az indoklás a RENDELÉS PÉLDÁNYÁHOZ kötve rögzül
```

Három részlet, ami nélkül a megkerülés formalitássá válna:

| Szabály | Miért |
|---|---|
| Üres vagy csak szóközből álló indoklás nem indoklás | különben egy szóköz kinyitja a kaput |
| A másik kapura szóló indoklás nem nyitja ki ezt | különben egy régi indoklás minden kaput nyit |
| A kapu megnevezi, **mi jöhet helyette** | a tiltás alternatíva nélkül arra ösztönöz, hogy megkerüljék |

Az `overrides()` adja azt a listát, ami a zárójelentésbe és az auditba megy —
ez az elfogadási kritérium második fele.

## 3. Miért a motorban van, és nem a felületen

Mert a felület cserélhető, és mert a betöltött, importált vagy programozott
rendelés ugyanúgy ír. A szabály a `prescribe()`-ban van, tehát nem lehet
megkerülni azzal, hogy valaki más képernyőt használ.

## 4. A rendelés PÉLDÁNYONKÉNT él

A `12-peldany-dimenzio.md` szerinti szerkezet második felhasználója. A névsor
`rx.active`, a dimenzió `prescription`, és minden adagolási jellemző ehhez
kötve él:

```ts
setValue(reg, st, "rx.dose.amount", 10, { scope: "rx.oxytocin" });
setValue(reg, st, "rx.dose.amount", 1,  { scope: "rx.tranexamic" });
```

### 4.1 Egység nélküli adag nem rögzíthető

Az „500" önmagában semmi; az „500 mg" és az „500 ml" két különböző dolog. Az
egység ezért **önálló mező**, és a motor abból bélyegzi az értékre
(`unitFrom`):

```
rx.dose.amount: az egység a(z) rx.dose.unit mezőből jön, és az még nincs kitöltve
```

Ez nem szigor. Az egység nélküli adagolási bejegyzés a gyógyszerelési hibák
klasszikus forrása, és utólag nem rekonstruálható.

## 5. Dózisszámítás

| Kalkulátor | Kapu mögött? | Miért |
|---|---|---|
| `calc.lmwh.prophylaxis` | **nem** | sávos tábla az RCOG GTG 37a-ból — nincs illesztett együttható, amit vissza kellene számolni |
| `calc.crcl` | **igen** | a Cockcroft–Gault SI-átszámolt női együtthatója nincs visszaellenőrizve, ugyanúgy, mint a CKD-EPI-nél |

A testsúlysávos LMWH-adag azért fontos, mert a standard 40 mg **90 kg felett
aluldozíroz** — ez a thrombosisprofilaxis leggyakoribb csendes hibája elhízott
terhesnél. A számítás megmutatja; a rendelés nem kényszerít.

## 6. Amit a törzs tartalmaz

`registry/gyogyszerek/` — hatóanyagonként: ATC, kereskedelmi nevek (a keresés
ezekre is illeszt), indikációk, kapuk, terhességi átalakítási javaslat, és a
**Hale-féle szoptatási besorolás** forrással.

A törzs a névsor (`rx.active`) értékkészletének forrása: a
`tools/gen-drug-roster.ts` írja be, és a build ellenőrzi. Új hatóanyag
felvételéhez nem kell kódot írni.

## 7. Ami még hátravan

- **A PUPHA/ATC teljes törzs** (5 592 tétel) beolvasztása. A jelenlegi 15
  hatóanyag a szülészeti mag: az uterotonikumok, a vérnyomáscsökkentők, a
  görcsmegelőzés, a thrombosisprofilaxis és a tüdőérlelés.
- **Az antibiotikum-szelektáló** 14 indikációs köre. A szerkezet megvan
  (`indications` + `forIndication()`), a tartalom nincs.
- **Az interakció-ellenőrzés** forrása továbbra sincs kijelölve — ez a modul
  saját nyitott kérdése. Egy teljes interakciós adatbázis licencköteles; a
  javaslat változatlan: a terhesség- és szoptatásspecifikus, kézzel
  karbantartott szabálykészlet most, a teljes ellenőrzés a webes fázisban.
- **A `MEDDB` 22 szabálya** közül egy (ACE-gátló → metildopa/nifedipin) van
  meg mintaként. A többi ugyanebbe a `transformInPregnancy` szerkezetbe megy.
