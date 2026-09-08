# 16 — Okoslelet: a hiány is állítás

> **Ez a modul nem gyűjt adatot.** Ha itt új mezőt kellene kitölteni, az azt
> jelenti, hogy valamelyik korábbi modul hiányos. Ebből következik az egyetlen
> kemény szabálya: minden állítás visszavezethető.

## 1. Öt stílus, egy tartalom

A stílus azt dönti el, **mely szakaszok jelennek meg és milyen sorrendben** —
nem azt, mi igaz. Ugyanaz a kockázati szakasz, ugyanazokkal a szegmensekkel
kerül a klinikai narratívába és az SBAR-átadásba.

| Stílus | Szakaszok |
|---|---|
| klinikai narratíva | kockázat · kimenetel · javaslat · kódolás · **hiány** |
| SBAR átadás | kockázat · **hiány** · javaslat |
| zárójelentés | kimenetel · kockázat · javaslat · kódolás · **hiány** |
| ápolói összefoglaló | kimenetel · javaslat · **hiány** |
| konzulensi kérés | kockázat · **hiány** · javaslat |

**A hiány-szakasz mind az ötben szerepel**, az átadásban is. Átadáskor a
legtöbb kár abból származik, amit az átadó tudott, de nem mondott.

## 2. A visszavezethetőség gépi ellenőrzése

Az elfogadási kritérium — *„a klinikai narratíva nem tartalmaz olyan állítást,
ami nincs a rögzített adatban"* — géppel ennyiben ellenőrizhető:

```ts
traceability(reg, epicrisis(reg, st, "clinical")).ok
```

Minden szegmensnek van `from` mezője, és minden forrás létező változó,
kalkulátor vagy hibahely. Forrás nélküli szegmens nem kerülhet a szövegbe.

A score-ok mellett ott a **bemeneti pillanatkép** is: mit látott az
algoritmus, amikor számolt. Egy két hete generált epikrízisben ez az egyetlen
módja megérteni, miért az jött ki, ami kijött.

## 3. Amit nem tudunk — és ami nem hiány

A modul legfontosabb tervezési döntése: **a klinikus a meg nem jelent
kockázati blokkot könnyen negatív leletnek olvassa.** Ezért az információhiány
explicit.

Négy forrásból épül:

1. az anamnézisben **„nem tudom"**-mal jelölt tételek;
2. minden **elkezdett, de be nem fejezett** számítás, a hiányzó bemenetekkel;
3. minden **lejárt** érvényességű érték, amire számítás épülhetett;
4. a `CaseState.errors[]` — ha egy modul nem futott le, az itt látszik.

### 3.1 A pont, ahol a szabály majdnem elrontotta magát

Az első működő változat **minden** ki nem számolt score-t felsorolt. Egy
praeeclampsiás sürgősségi felvétel hiány-szakasza így nézett ki:

```
! Ferriman–Gallwey-pontszám: nem számolható — hiányzó bemenet: …
! Apgar-pontszám: nem számolható — hiányzó bemenet: …
! EPDS összpontszám: nem számolható — hiányzó bemenet: …
```

Tizennyolc sor, és **elveszett benne az az egy**, ami valóban hiányzott. A
szakasz, aminek a hiányt kellett volna láthatóvá tennie, elrejtette.

A szabály ezért: **amit elkezdtünk, de nem fejeztünk be, az információ. Amihez
hozzá sem kezdtünk, az nem.** Egy sürgősségi felvételen senki nem várt
hirsutismus-score-t. Aki mégis számít egy score-ra, megnevezheti
(`opts.scores`), és akkor a hiánya megjelenik.

### 3.2 És a csapda a szabályban

„Elkezdett" = legalább egy bemenete rögzült. Csakhogy a `ctx.now`-t a motor
**minden** esetre beírja — ezzel minden időt használó kalkulátor „elkezdettnek"
számított volna. A levezetett eredetű bemenetek ezért nem számítanak.

Ugyanaz a csapda, mint amikor a click-open mérőszám a motor saját írását is
megérintett mezőnek vette: **a rendszer önmagát mérte.**

## 4. Amit a kirenderelt szöveg mutatott meg

A motor működött és a tesztek zöldek voltak, de a legenerált SBAR-t elolvasva
három hiba azonnal látszott — egyik sem bukott volna ki tesztből, amit előre
megírok:

| Amit a szöveg mondott | Mi volt a baj |
|---|---|
| `Várható szülési időpont: 1793145600000 d` | a dátumot adó kalkulátor epoch-ezredmásodperce nyersen |
| `Enoxaparin napi adag: 40 mg — alacsony testsúly — 20 mg naponta` | a sávok a **bemenetet** írták le, a kimenet mellé kerülve |
| tizennyolc soros hiány-szakasz | a fenti zaj-probléma |

Az első kettő a kalkulátor-rétegben javult: az `output.isDate` jelöli a
dátumot adó képletet, az LMWH-sávok pedig eltűntek — a testsúly-tartományok a
képletben és a forrásban vannak, ahol nem keverednek össze az eredménnyel.

> **A tanulság általános:** a generált szöveget el kell olvasni. A tesztek azt
> ellenőrzik, amire gondoltunk; a kirenderelt kimenet azt is megmutatja, amire
> nem.

## 5. A nyitott kérdés: a név

**A dokumentum neve: okoslelet.**

Az örökölt „AI lelet" azt ígérné, ami nincs — nyelvi modell nincs a
folyamatban. Az „okos" viszont azt mondja, ami igaz: a lelet magától áll össze
a rögzített adatból, minden állítása mögött ott a forrásváltozó, és kimondja,
mit nem tud. **Nem intelligenciát ígér, hanem összeszedettséget** — és épp ez a
különbség az, amit a felhasználónak értenie kell.

A gépi jelölés emellett változatlan:

```jsonc
"generation": {
  "method": "rule-based",
  "note": { "hu": "OKOSLELET — SZABÁLYALAPÚ GENERÁLÁS, nincs nyelvi modell a folyamatban…" }
}
```

Ez kevesebbet és többet is jelent, mint egy nyelvi modell kimenete: nem
fogalmaz szabadon, de **nem is állít olyat, ami nincs az adatban**.

Az `epi.generation` változó három értéket ismer (`ruleBased` · `manual` ·
`assisted`), mert a megkülönböztetést akkor is meg kell tartani, ha a jövőben
nyelvi modell is bekerül a láncba — **akkor az már nem okoslelet lesz, hanem
`assisted`.** A klinikus tudja meg, mit olvas.

## 6. A szöveget is tárolni kell

`epi.body` nem redundancia. A rekord azt őrzi, ami **akkor elhangzott**: ha a
regiszter vagy egy kalkulátor később változik, az újragenerált szöveg más
lenne — a dokumentum viszont az marad, amit aláírtak.

Ehhez tartozik két külön, rögzített lépés: `epi.reviewed` (a klinikus
végigolvasta) és `epi.gaps.acknowledged` (látta a hiány-szakaszt). **A generált
szöveg nem automatikusan igaz, csak automatikusan visszavezethető** — az
átnézés nélkül az aláírás formalitás.

## 7. Ami még hátravan

- **A kimeneteli és kódolási szakasz** tartalma a `10`, `15` és `17` modulból
  jön; a szerkezet megvan, a bemenet még nem.
- **A `narrativeTemplate`.** A jelenlegi megjelenítés általános
  („Címke: érték egység"). Ahol ez esetlen, a változó kaphat saját
  megfogalmazást — de csak ott: hatszáz sablon karbantartása rosszabb, mint
  egy tisztességes alapértelmezés.
- **Az aláírás kriptográfiai része.** Ma `epi.signedBy` és `epi.signedAt` szöveg
  és időbélyeg; az EESZT-be küldött dokumentum ennél többet kíván.
