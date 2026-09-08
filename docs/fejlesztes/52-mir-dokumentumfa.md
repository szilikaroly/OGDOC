# 52 — A minőségirányítási dokumentumfa és az első kérelem

*A 13. lépés gépi fele. A leghosszabb tétel az egész projektben — és egy
összegző tábla, ami már elcsúszott.*

---

## Mit tehet a gép egy 12–18 hónapos szervezeti lépésnél

A 13. lépés az ISO 20387 biobanki akkreditáció dokumentumfája: ~37 dokumentum,
négy szinten, és az első kérelem. Nem fejlesztési feladat, és a reális átfutás
12–18 hónap.

Három dolgot mégis a gép tud elvégezni — és mindhárom olyat javít, ami a
papíralapú minőségirányításban rendre elromlik.

---

## 1. Az összegzés elcsúszott — és ezt nézi meg egy auditor először

A `01-iso20387.md` végén álló „hol tartunk" tábla kézzel gépelt számokat
tartalmazott. Megszámoltuk a felette álló sorokat:

| | A tábla azt mondta | A sorok azt mondják |
|---|---:|---:|
| Általános és szerkezeti (4–5) | 1 / 3 / 3 | 1 / **4** / 3 |
| Erőforrás (6) | 0 / 2 / 7 | 0 / 2 / **9** |
| Folyamat (7) | 1 / 3 / 13 | 1 / **2** / **16** |
| Irányítás (8) | 0 / 1 / 5 | 0 / 1 / **6** |
| **Összesen** | **39 kontroll** | **45 kontroll** |

**Mind a négy kategória eltért**, és a teljes szám hat sorral kevesebb volt a
valóságosnál. Nem rosszhiszeműség: egy összegzés, ami nem a sorokból jön,
előbb-utóbb mindig elcsúszik.

A mátrix mostantól **adat** (`registry/mir/iso20387.json`, 45 kontroll, a
megfelelési fejezetből szó szerint átvéve), az összegzés pedig **belőle
számolódik** (`npm run mir`). A `test/mir.test.ts` összeveti a generált
számokat a fejezet táblájával, tehát az eltérés soha többé nem maradhat észre
nem véve.

---

## 2. A dokumentum lejár — és a lejárt SOP nem hatályos

A dokumentumfa **saját szövege** mondja ki:

> *„A legtöbb MIR azon bukik el, hogy a dokumentumokat senki nem vizsgálja
> felül, és az audit két éve lejárt SOP-okat talál."*

Ez eddig jegyzet volt. Most motor: minden dokumentumhoz tartozik verzió,
hatálybalépés és **következő felülvizsgálat**, és a lejárt dokumentum
**`eros: false`** — nem bizonyít semmit, akkor sem, ha ott van a polcon.

Ez a második réteg a rendszerben, ami naptárt néz (az első a 12. lépés
mérőeszköz-licence), és ugyanúgy **90 nappal előre szól**: a felülvizsgálat
nem egy nap alatt megy.

**És a lejárat kaszkádol.** Ha egy SOP felülvizsgálata lejár, a rá épülő ISO
kontrollok **vele együtt esnek ki** — ezt kézzel senki nem tartja számon, és
pontosan ez az, amit az audit megtalál.

---

## 3. A kontrollnak bizonyítéka van, nem állapotjele

Ugyanaz a szabály, mint a 11. lépés ETT-dossziéjánál: **az auditor a
„Bizonyíték" oszlopot kéri, nem a „Megvalósítás" oszlopot.**

Ezért minden kontrollsor mellett ott a `bizonyitekDokumentumok` lista, és a
kontroll állapota négy értéket vehet fel:

| Állapot | Mit jelent |
|---|---|
| **bizonyított** | minden hivatkozott dokumentum hatályban |
| **részben** | egy részük hatályban |
| **bizonyítatlan** | egyik sem |
| **nincs bizonyíték** | *azt sem írtuk le, mivel bizonyítanánk* |

A negyedik a lényeg, és ma **mind a 45 kontroll ott áll**. Ez nem ugyanaz,
mint hogy „hiányzik valami" — az azt jelentené, hogy tudjuk, mi kell.

És a kapcsolódó kényszer: **a kézzel írt jelölés nem állíthat többet, mint
amit a bizonyíték fed.** Ahol a ✅/🔶 jelölés erősebb a levezetett állapotnál,
az **építési hiba** — kivéve, ha egyáltalán nincs megnevezett dokumentum, mert
az ma a szabály, nem a kivétel (11/45 sor jelölése ilyen).

---

## 4. A fa saját szabálya, amit eddig semmi nem kényszerített ki

> *„Minden SOP-hoz tartozik legalább egy űrlap vagy rendszerbeli feljegyzés.
> SOP feljegyzés nélkül nem bizonyít semmit; feljegyzés SOP nélkül nem
> szabályozott."*

Mostantól: **hatályos SOP űrlap nélkül építési hiba.** Az eljárásokra (QP) ez
nem vonatkozik — azok irányítási dokumentumok, nem műveleti előírások.

---

## Az első kérelem kapuja

A kérelem **nem** mind a 37 dokumentumra vár. A fa saját tanácsa: *„ne írjuk
meg mind a 35-öt előre."* Az **első kör** a politika, a kézikönyv és a **14
minta-életciklus SOP** — azok nélkül nem lehet mintát gyűjteni, tehát nincs
mit akkreditálni.

```
0/16 első köri dokumentum hatályban  →  a kérelem NEM adható be
```

És egyetlen **lejárt** felülvizsgálat ugyanúgy bezárja a kaput, mint egy
hiányzó dokumentum.

---

## Ami továbbra is nyitva van

- **0/37 dokumentum hatályban.** Ez a valóság, nem hiányosság: 12–18 hónap.
- **45/45 kontroll mellett nincs megnevezett bizonyítékdokumentum.** A
  `bizonyitekDokumentumok` kitöltése a minőségirányítási vezető munkája — és
  attól a pillanattól a kontrollok állapota **magától követi** a dokumentumok
  sorsát.
- A szabvány szövege szerzői jogvédett: a fejezetszámokat és a követelmények
  pontos szövegét **a hivatalos szabványpéldány alapján ellenőrizni kell**,
  mielőtt bármelyik sorra hivatkoznánk auditon.

---

## Utólag: BELLA és MEES 2.1 — a harmadik naptár

A 13. lépés az ISO 20387-et modellezte. Az intézmény azonban **nem egy
keretrendszerben él**: a magyar ellátásra a **BELLA** akkreditációs és a
**MEES 2.1** tanúsítási standardjai vonatkoznak, és mindhárom **ugyanarra a
működésre** kérdez rá. Egy megírt SOP mindhárom keretben bizonyíték — aki
keretenként külön gyűjti, háromszor csinálja meg ugyanazt.

A `registry/mir/keretek.json` ezért mind a hármat tartja, és két új dolgot ad:

**1. A MEES 2.1 átmenet naptára — és ez a legsürgősebb tétel a három keret
közül.** A MEES 2.1 2024-09-25-én jelent meg, a korábbi tanúsítványok 3 évig
érvényesek. Két mérföldkő vonatkozik ránk: **2026-09-25** (az átmeneti időszak
vége) és **2027-09-25** (a MEES 2.0 tanúsítványok érvényvesztése). Az első ma
**napokban mérhető közelségben** van. A rendszer harmadik naptáras rétege ez —
a mérőeszköz-licencek és a dokumentumfelülvizsgálatok után —, és a
2027-09-25 nem beírt szám: a közzététel + 3 év, amit a validálás ellenőriz.

**2. A BELLA pontozó motor — és a nevező, amit a legkönnyebb elrontani.**
0/2/4 pont × súlyszám; a kötelező elemek 100%-a a pontszámtól **függetlenül**
kapu; alap- és emelt szint 75%-os küszöbbel. A finom pont: egy adott
intézményben **nem értelmezhető** tartalmi elem nem nulla pont, hanem **kisebb
elérhető maximum** — ugyanaz a két teljesülő elem 50% helyett 100%-ot ad, ha a
másik kettő kiesik. A motor ezért a kizárt elemet a nevezőből is kiveszi; a
**nem értékelt** elemet viszont nem, mert ott a szint nem „még nem elég",
hanem **nem ítélhető meg**.

**És amit nem szabad kitalálni:** 33 standardnál a hivatalos táblázat mondja
meg, fekvő- vagy járóbeteg-ellátásra vonatkozik-e; a szöveges kivonatból nem
vezethető le. Ott `null` áll, nem egy valószínű érték — és a validálás
megnevezi az eltérést a közölt 39/30-tól.

Részletek: [`../megfeleles/14-bella-mees.md`](../megfeleles/14-bella-mees.md).

---

## Futtatás

```
npm run mir         # munkalap a minőségirányítási vezetőnek + a számolt összegzés
npm run validate    # a lejáratok, a hiányzó űrlapok és a túlállító jelölések
node --test test/mir.test.ts test/keretek.test.ts   # 18 + 19 teszt
```

## Fájlok

| | |
|---|---|
| `registry/mir/dokumentumfa.json` | a 37 dokumentum: szint, tárgy, gazda, felülvizsgálati ciklus, első kör |
| `registry/mir/iso20387.json` | a 45 kontrollsor, a megfelelési fejezetből átvéve |
| `registry/mir/allapot.json` | ami hatályban van — szándékosan üres |
| `core/mir/fa.ts` | a felülvizsgálati motor, a kontrollállapot és az első kérelem kapuja |
| `tools/gen-mir.ts` | a munkalap (`npm run mir`) |
| `test/mir.test.ts` | 18 teszt |
| `registry/mir/keretek.json` | a három keret: ISO 20387 · BELLA (43 standard) · MEES 2.1 (5 mérföldkő) |
| `core/mir/keretek.ts` | a MEES-naptár és a BELLA pontozó motor |
| `test/keretek.test.ts` | 19 teszt |
