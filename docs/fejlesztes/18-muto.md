# 18 — Műtő: az egyetlen kapu, ami dokumentációra zár

> A rendszerben mindenhol érvényes szabály, hogy **a dokumentálás nem
> blokkolhat sürgős ellátást** — a hiányzó műtéti terv ezért jelzés, nem kapu.
> A WHO-ellenőrzőlista az egyetlen kivétel, és érdemes pontosan érteni, miért.

## 1. Miért kivétel a WHO-lista

A lista **a műtét alatt tölthető ki**. A kitöltése tehát nem késlelteti a
beavatkozást, csak a **lezárását**. Ami itt blokkolódik, az nem az ellátás,
hanem az adminisztratív zárás — és ez a különbség tartja meg a szabályt
ahelyett, hogy kivételt csinálna belőle.

```ts
whoChecklist(reg, state).canClose   // false
// "A műtéti leírás nem zárható le: a WHO-ellenőrzőlista hiányos —
//  Kijelentkezés (1 tétel). A lista a MŰTÉT ALATT kitölthető, ezért a
//  kitöltése nem késlelteti az ellátást, csak a lezárást."
```

A tételek a **regiszterből** jönnek (`op.who.<fázis>.*`), nem kódból: egy új
tétel felvétele nem kíván fejlesztést. Minden fázisnak van **lezárási
időbélyege** is — enélkül nem állapítható meg, hogy a lista a megfelelő
pillanatban készült-e el, vagy utólag, emlékezetből.

Egyetlen hiányzó tétel is blokkol, és külön teszt őrzi azt az egyet, **amiért
az egész lista létezik**: az eszköz- és törlőszám egyezését. A visszamaradt
idegen test megelőzhető, visszafordíthatatlan és perelhető esemény.

## 2. OENO: kódajánlás, nem kódolás

```ts
oenoFor(reg, state)
// [{ code: "74.10", version: "2026",
//    note: "JAVASLAT, nem kódolás: a kódoló szakember dönt…" }]
```

A különbség nem szóhasználat: az **automatikus kódolásért a rendszer felelne,
a kódajánlásért az ember**. A rendszer feladata annyi, hogy ne kelljen a
műtéti leírásból visszakeresni, mi történt.

Két részlet, ami a valóságból jön:

- **A kódnak verziója van.** Az OENO évente változik; verzió nélkül egy
  retrospektív beavatkozás a mai tábla szerint mást jelenthet. A validátor
  verzió nélküli kódot nem enged.
- **A tervezett és a sürgős császármetszés kódja azonos** — az OENO nem
  különbözteti meg a sürgősséget. A megkülönböztetés az `op.pre.urgency`
  mezőben él, és a minőségi mutatók **onnan** számolnak, nem a kódból.
- **Az „egyéb" beavatkozásnak szándékosan nincs kódja.** Az „egyéb" választás
  gyakorisága önmagában minőségi mutató: ha elszabadul, a törzs hiányos.

## 3. Az uterotomia, amit a következő terhességnél keresnek

Az `op.cs.uterotomy` azért önálló, kódolt mező, mert **ez az az adat, amit a
következő terhességnél a leggyakrabban nem találnak meg** — a zárójelentésben
gyakran csak „császármetszés" szerepel. Az alsó harántmetszés után a hüvelyi
szülés megkísérelhető; a klasszikus és a T-metszés után a méhrepedés kockázata
lényegesen nagyobb, és a kísérlet ellenjavallt.

Ugyanez igaz a heg állapotára (`op.cs.prevScar`): ezt **csak az láthatja, aki a
hasat megnyitotta**, és utólag rekonstruálhatatlan.

## 4. A hiba, amit a validátor talált — és ami két modulra visszahatott

A VTE-pontszámot először kalkulátorként írtam meg. A regiszter kódellenőrzése
azonnal megbukott rajta:

```
error op.pre.vteRisk  a calc.vte.rcog bemenete (hx.sys.vte) nem numerikus
      kódokat használ (pos, neg, unk) — a kalkulátor-réteg csak számot fogad
```

**A kalkulátor-réteg minden bemenetet számmá alakít.** Ez teszi egységessé a
kapukat és a hiánykezelést — de a `pos`/`neg` alakú kód csendben `NaN` lesz, és
a kalkulátor **örökre „hiányzó bemenet"-et mond**. Ez pedig
megkülönböztethetetlen a kapu mögötti állapottól: a rendszer úgy tűnne, mintha
adatra várna, miközben soha nem is tudna számolni.

A szabály ezért új build-ellenőrzés lett: **kódolt bemenet csak akkor jó, ha
minden kódja szám.** A Bishop-score beszállása és az Apgar tételei ilyenek —
ott a kód *maga* a pontérték.

És a szabály azonnal talált még egyet: a `10` modulban a **VBAC-kalkulátor
ugyanígy volt elrontva**. Mindkettő szabályalapú értékelés lett
(`core/scores/vte.ts`, `core/scores/vbac.ts`).

> **Ez a fajta hiba a legveszélyesebb:** nem hibaüzenetet ad, hanem egy
> plauzibilis „nincs elég adat" választ, örökre.

## 5. Két hiányzó szám, két különböző okból

A rendszerben most három helyen nincs összesített szám, és **nem ugyanazért**.
A megkülönböztetés fontos, mert az egyik lezárt döntés, a másik nyitott
feladat:

| Hol | Miért nincs szám | Állapot |
|---|---|---|
| Postpartum pszichózis | a külön kohorszokból származó esélyhányadosok **nem szorozhatók össze**, és a faktorok nem függetlenek | **lezárt döntés** |
| VTE (RCOG) | a pontok elvileg **összeadhatók** — csak a táblánk hiányos (20+ tételből 6) és ellenőrizetlen | **nyitott feladat** |
| VBAC (Grobman) | a 2021-es, etnikum nélküli változat **együtthatói nincsenek meg** | **nyitott feladat** |

Mindhárom helyen a kimenet ugyanaz a szerkezet: a tényezők felsorolása a saját
forrásukkal, és a hiány kimondása — hogy ne látsszon hiányosságnak.

A VBAC-nál van egy negyedik dolog is, ami **nem esélykérdés**: a klasszikus
uterotomia után a hüvelyi szülés ellenjavallt. Ez kódolt tényből dől el, nem
becslésből — és a rendszer így is adja vissza.

## 6. Ami még hátravan

- **A műtéti leírás sablonjai beavatkozásonként.** A `steps` mező megvan a
  beavatkozási törzsben, a felület még nem használja.
- **Az RCOG GTG 37a teljes tételsora.** Húsznál több tétel, ebből hat van
  bekötve. Egy hiányzó tétel — ikerterhesség, hosszú utazás, dehidráció — a
  küszöb alatt tarthatja a beteget, aki fölötte lenne; és a hiányzó
  thrombosis-profilaxis a megelőzhető anyai halálozás vezető oka.
- **A perioperatív erőforrás-tervezés** (`or_suites`, `surgery_cases`) az
  IntuiCare-ben kész; a klinikai tartalom és a tervezés összekötése hátravan.
