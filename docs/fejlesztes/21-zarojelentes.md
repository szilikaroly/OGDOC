# 21 — Zárójelentés: az üres rubrika néma állítás

> Két dolog dől el ebben a modulban, és egyik sem a szövegformázás. Az egyik,
> hogy **mit jelent egy üres sor** egy dokumentumon. A másik, hogy **mitől
> hiteles** egy generált irat — és hogy a válasz ma mindenkinél ugyanaz: nem az.

## 1. „Fizikális status: ———"

Ez a sor nem semmit mond. A következő ellátó **negatív leletnek olvassa**, és
ebből ő is negatív leletet ír. Az üres rubrika néma állítás — csak nem az, amit
az író gondolt: nem azt jelenti, hogy nem volt kóros, hanem azt, hogy nem
tudjuk, megvizsgálták-e.

Ezért minden blokknak három állapota van:

| Állapot | Mit jelent | Honnan jöhet |
|---|---|---|
| `filled` | van tartalom | a rögzített adatból |
| `missing` | **nincs, és ez hiány** | bármikor |
| `notApplicable` | nincs, és ez rendben van | **kizárólag rögzített tényből** |

```ts
buildDischarge(reg, docs, {}).blocks.find(b => b.id === "status")
// { state: "missing",
//   note: "Fizikális státusz nincs rögzítve. Az üres rubrika NEM negatív
//          lelet: nem tudjuk, megvizsgálták-e." }
```

A harmadik állapot szigorúan őrzött. A „lefolyás" blokk járóbeteg-ellátásnál
`notApplicable` — de csak akkor, ha a `ctx.encounter` **rögzítve van**. Ha nem
tudjuk, milyen ellátásról van szó, a blokk `missing` marad: **a nem tudás nem
mentesít.** Ugyanaz a szabály, mint a szűrési esedékességnél.

Az elfogadási kritérium gépi ellenőrzése ebből következik:

```ts
slots(summary).ok   // minden blokk: tartalom VAGY indokolt hiány
```

## 2. Az anamnézis-kivonat: csak a pozitívok — de ez nem elhallgatás

Hetvenöt negatív anamnesztikus tétel felsorolása kitakarná azt a hármat, ami
számít. A kivonat ezért csak a `pos` válaszokat viszi — és a blokk **kimondja,
hogy ezt teszi**:

> „Nincs POZITÍV anamnesztikus tétel. Ez NEM azt jelenti, hogy az anamnézis
> negatív: lehet, hogy nem vették fel. A hiányzó tételek az »Amit nem tudunk«
> szakaszban szerepelnek."

A rövidítés akkor legitim, ha az olvasó tudja, mi maradt ki, és hol találja meg.

## 3. A jogi státusz: négy feltétel, és a negyedik ma zárva van

A modul nyitott kérdése a hitelesség volt. A válasz nem „igen" és nem „majd",
hanem egy **kapu**, amiben az utolsó feltétel ma senkinél nem teljesül:

```ts
authenticity(reg, docs, teljesenKitöltöttEset)
// { status: "draft", canIssue: false,
//   missing: [… , "hitelesített felhasználói azonosítás (25. modul)"] }
```

| Feltétel | Honnan |
|---|---|
| a kötelező mezők megvannak | `readiness()`, a dokumentumtörzsből |
| az intézmény **befogadta** a generált dokumentumot | `disch.institution.approved` |
| aláírás **és ellenjegyzés** | a `doc.zarojelentes` mindkettőt előírja |
| **hitelesített felhasználói azonosítás** | 25. modul — **nem létezik** |

A negyedik feltétel a lényeg. Az aláírás mező ma `text`: **bárki bármit
beírhat.** Egy kapu, amit egy név begépelése nyit, nem kapu — és ha a rendszer
ettől „hitelesnek" nyilvánítaná a dokumentumot, az rosszabb lenne, mint ha meg
sem próbálná.

A kód ezért a képességet **kívülről kapja** (`identityVerified`), nem magáról
állítja. Ma egyetlen futtató sem adja meg; a teszt mindkét irányt őrzi: a
teljesen kitöltött eset **sem** hiteles, és azonosítással **igen**.

Két külön mező, ami elsőre redundánsnak látszik:

- `disch.summaryReviewedBy` — ki **olvasta el**;
- `disch.signedBy` — ki **írta alá**.

Az automatikusan összeálló dokumentum legnagyobb kockázata, hogy senki nem
olvassa el. Az aláírás ezt nem bizonyítja; épp ezért két esemény.

### A figyelmeztetés a papírra kerül, nem a képernyőre

```
# Zárójelentés

> **MUNKAANYAG — NEM HITELES EGÉSZSÉGÜGYI DOKUMENTUM. A rendszerben NINCS
>   hitelesített felhasználói azonosítás (25. modul), ezért az aláírás mezőbe
>   beírt név semmit nem bizonyít…**
```

A dokumentum **elején**, nem a láblécben, és a nyomtatott változatban is: **a
papír kimegy a rendszerből.** Ami nem szerepel a nyomaton, az nem létezik a
beteg kezében.

## 4. Ugyanez a kapu az interoperabilitáson

Egy `status: "final"` bélyegű FHIR `Composition` a fogadó rendszerben
ugyanúgy néz ki, mint egy valódi, aláírt zárójelentés — és ott **senki nem
fogja végigolvasni, honnan jött**. Az export ezért ugyanazt a kaput hordozza:

```ts
toComposition(summary).status   // "preliminary" — és ezen nincs kapcsoló
```

Két további részlet, ami a kimenetben van, nem a dokumentációban (mert a
fogadó rendszer a dokumentációt nem olvassa):

- `meta.tag: not-conformance-validated` — a kimenet FHIR-validátorral **nincs**
  szembefuttatva, és a diagnózis-kódrendszerek részben hiányoznak (17. modul);
- **a hiányzó blokk is szakasz.** Ha az üres blokkokat kihagynánk az exportból,
  a fogadó rendszer ugyanoda jutna, mint az olvasó az üres rubrikánál.

## 5. Kutatási példány: a kihagyást kimondja

A `phi` jelölésű blokk (TAJ, születési dátum) a kutatási változatból kimarad —
de **nem csendben**:

> „KUTATÁSI PÉLDÁNY: a beteg-azonosító blokk KIMARADT. A kihagyás tényét a
> dokumentum kimondja, mert egy csendben eltűnt blokk később nem
> különböztethető meg attól, ami sosem volt kitöltve."

A jelölés a regiszterből jön (`phi: true`), nem a nyomtatóból: egy új
azonosító mező felvétele nem kíván változtatást ebben a rétegben.

## 6. Amit a megvalósítás előhozott

**A UCUM-kódot a nyomtatáson ember olvassa.** A regiszter `mm[Hg]`-t,
`10*9/L`-t és `a`-t tárol — ez helyes, mert gépileg egyértelmű és az
interoperabilitás ezt várja. A kinyomtatott lapon viszont a „148 mm[Hg]", a
„210 10*9/L" és a „33 a" nem tájékoztat, hanem zavar. Új réteg:
[`core/ui/units.ts`](../../core/ui/units.ts) — a tárolt érték változatlan, a
megjelenítés magyar (`148 Hgmm`, `210 G/l`, `33 év`).

Két szabály tartja meg:

- **amit nem ismerünk, azt változatlanul írjuk ki** — nem találunk ki magyar
  formát egy ismeretlen egységre;
- **build-teszt** őrzi, hogy minden gépi jelölésű egységnek (`[`, `{`, `*`,
  `/(`) legyen emberi alakja. Ma 32 változó, 14 különböző egység. Egy új, furcsa
  egység felvételét ez állítja meg — nem a beteg kezében lévő papír.

**A fejlécből hiányzott az ellátás időszaka.** A terv „ellátás időszaká"-t írt,
a mezők közt csak az elbocsátás ideje volt meg. Enélkül az ápolási idő nem
állapítható meg, és az olvasó nem tudja, mennyi ideig tartott, amit olvas
(`disch.admittedAt`).

**A „~40 generált változó" nem regiszterváltozó.** A modul terve negyven
generált mezőt becsült; a valóságban a zárójelentés BLOKKJAI generáltak (16
blokk, mind más modulból), és regiszterváltozó csak abból lett, ami **sehol
máshol nem keletkezik**: maga a dokumentum (aláírás, ellenjegyzés, befogadás,
az elbocsátás módja, az átadás). Ez 19 mező. A különbség nem számtani: a
generált blokk **nem tárolódik**, mindig újraszámol a rögzített adatból — ha
tárolnánk, a következő módosítás után hazudna.

## 7. Tesztek

[`test/zarojelentes.test.ts`](../../test/zarojelentes.test.ts) — 31 teszt:

- az üres eset zárójelentése is hiánytalan, mert a hiány kimondva jelenik meg;
- a megjelenített dokumentum egyetlen üres szakaszt sem tartalmaz;
- a „nem vonatkozik rá" csak rögzített tényből — ismeretlen ellátási forma
  mellett a blokk hiány marad;
- a teljesen kitöltött, aláírt eset **sem** hiteles azonosítás nélkül;
- a FHIR-kimenet státusza hitelesítés nélkül `preliminary`;
- a kutatási példányban nincs TAJ, és a kihagyás ki van mondva;
- a nyomtatott dokumentumon nincs UCUM-kód.
