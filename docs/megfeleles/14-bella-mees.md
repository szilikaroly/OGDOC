# BELLA és MEES 2.1 — a magyar ellátási keretek

> **Figyelmeztetés.** Sem a BELLA standardok **tartalmi elemei**, sem a MEES 2.1
> Kézikönyv szövege nem szerepel itt. Ami igen: a **szerkezet** (csoportok,
> standardmegnevezések), a **nyilvánosan közzétett értékelési szabályok**
> (pontozás, küszöbök, érvényességi idők) és a **határidők**. A tartalmi
> elemeket és a súlyszámokat a hivatalos kiadványból kell betölteni.

Gépi alak: `registry/mir/keretek.json` · motor: `core/mir/keretek.ts` ·
munkalap: `npm run mir`

---

## 1. Miért három keret, és miért nem három projekt

| Keret | Fajta | Hatókör |
|---|---|---|
| **ISO 20387:2018** | akkreditálás | biobank |
| **BELLA** | akkreditálás | fekvő- és járóbeteg-ellátás |
| **MEES 2.1** | tanúsítás | egészségügyi ellátás |

Mindhárom **ugyanarra a működésre** kérdez rá — más szavakkal, más
pontozással, más határidőkkel. Egy megírt SOP, egy működő auditnapló, egy
hitelesített megőrzési idő **mindhárom keretben bizonyíték**.

Aki keretenként külön gyűjti a bizonyítékot, háromszor csinálja meg ugyanazt —
és a három nyilvántartás előbb-utóbb szétcsúszik. A rendszer ezért egyetlen
bizonyítékbázisra, a **minőségirányítási dokumentumfára** képezi le mind a
hármat.

---

## 2. A MEES 2.1 átmenet — ez naptár, nem terv

A MEES 2.1 **2024. szeptember 25-én** jelent meg (Egészségügyi Közlöny 17.),
és a korábbi változat szerinti tanúsítványok **3 évig** érvényesek.

| Mérföldkő | Határidő | Kit érint |
|---|---|---|
| NAH szabályzatok megfelelnek a MEES 2.1-nek | 2025-12-16 | hatóság |
| A NAH felkészült a MEES 2.1 szerinti értékelésre | 2025-12-17 | hatóság |
| Már csak MEES 2.1 szerinti kezdeti/bővítési eljárás | 2025-12-17 | hatóság |
| **Az átmeneti időszak vége** — már csak MEES 2.1 szerinti akkreditált státusz | **2026-09-25** | **minket** |
| **A tanúsítói átmenet vége** — a MEES 2.0 tanúsítványok érvényüket vesztik | **2027-09-25** | **minket** |

**A két utolsó sor a miénk**, és az első **napokban mérhető közelségben van**.
A rendszer ezért naptárt néz: a mérföldkő 90 nappal előre figyelmeztetés, a
lejárt saját mérföldkő **építési hiba**.

A hatóság lejárt mérföldkövei **nem hibák** a mi rendszerünkben — azok az ő
teendői voltak, és a gép ezt meg is különbözteti.

**A 2027-09-25 nem beírt szám:** a közzététel + 3 év, és a validálás
elbuktatja, ha a kettő szétválik.

### A történeti szál, ami nem mindegy

Az első hazai kórházi standardok (**KES**) 2001-ben készültek nemzetközi minta
alapján; ebből fejlesztette a tárca a **MEES**-t. A MEES-hez azonban **a
felülvizsgálati rendszer nem készült el** — a külső értékelést tanúsító cégek
végezték, a standardok szisztematikus fejlesztése és egységes értelmezése
elmaradt. Épp ez hívta életre a **BELLA** programot 2012–2014-ben.

A MEES 2.1 ma visszatér — de már **akkreditált tanúsító szervezetek**
(MSZ EN ISO/IEC 17021-1) által tanúsított irányítási rendszerként.

---

## 3. A BELLA döntési szabálya

**43 standard** hét csoportban: fekvő 39 · járó 30 · **közös 26**. (A három
szám összefügg: 39 + 30 − 26 = 43, és a lista pontosan ennyi tételt tartalmaz —
a validálás ezt ellenőrzi.)

A standardok **az intézményi működés és nem a szakmai munka** szabályait
határozzák meg. Ez a különbség lényegi, és a program tapasztalata szerint az
orvosi ellenállás fő oka épp ennek félreértése: *a gyógyítói szabadság nem
sérül, a munkakörnyezet lesz biztonságosabb.* A rendszerben pontosan ez az a
réteg, amit az OGDOC épít.

### A pontozás

- minden értékelt tartalmi elemre **0, 2 vagy 4** pont adható;
- a pontot a tartalmi elem **súlyszámával** kell szorozni;
- a **kötelező** elemeket **100%**-ban teljesíteni kell — ez az elért
  pontszámtól **független**, a jó átlag nem váltja ki;
- **alapszint**: a kötelező elemeken túl az alapszintű elemek **75%**-a;
- **emelt szint**: az alapszint mellett az emelt elemek **75%**-a;
- az igazolás **kétszintű** és **3 évre** szól.

Három megnevezett kötelező standard: *Minőségbiztosítás és minőségfejlesztés* ·
*A betegellátás biztonságát javító vezetői tevékenység* · *Újraélesztés
egészségügyi ellátó intézményben*.

### A legkönnyebben elrontható pont: a nevező

Egy adott intézményben **nem értelmezhető** tartalmi elem **nem nulla pont**,
hanem **kisebb elérhető maximum** — a százalék tehát elmozdul tőle.

Ugyanaz a négy elem, kétféleképpen:

| | elért | elérhető | % |
|---|---:|---:|---:|
| kettő teljesül, kettő **0 pont** | 8 | 16 | **50%** |
| kettő teljesül, kettő **nem értelmezhető** | 8 | 8 | **100%** |

A pontozó motor ezért a kizárt elemet **a nevezőből is** kiveszi. A **nem
értékelt** elemet viszont **nem**: ott a szint nem „még nem elég", hanem **nem
ítélhető meg** — a hiányzó adat itt sem „nem".

### Az eljárás

| | |
|---|---|
| I | Bejelentkezés az akkreditációs programba |
| II | Felkészítési időszak — oktatás, tanácsadás, **offline önértékelés** |
| III | Bevezetési időszak |
| IV | **Online önértékelési kérdőív** (max. 2 hónap) |
| V | **Működtetési időszak — 6 hónap**, tanácsadás nélkül |
| VI | Helyszíni felülvizsgálat |

Két dolog, ami félreérthető:

- **a helyzetértékelés belső anyag** — a felülvizsgálók nem találkoznak vele;
- **az önértékelési kérdőív szakmai tartalma nem befolyásolja a döntést** — a
  felülvizsgálók a **gyakorlati megvalósulásra** keresnek bizonyítékot, és a
  működést a hat hónapra **visszamenőleg** vizsgálják.

---

## 4. Ami hiányzik, és amit nem szabad kitalálni

| Mi | Miért nincs itt |
|---|---|
| a **tartalmi elemek** és **súlyszámok** | a hivatalos kiadványból töltendők — nélkülük a motor fut, de nincs mit pontoznia |
| az **ellátási forma** 33 standardnál | a hivatalos táblázat oszloponkénti jelöléssel adja meg; a szöveges kivonatból nem vezethető le, és **tippelni nem szabad** — ezért áll ott `null`, nem egy valószínű érték |
| a **MEES 2.1 követelményszövege** | a Kézikönyv külön kiadvány |

A standardmegnevezések **két kiadványból** származnak, egy év eltéréssel (2014
módszertani, 2015 akkreditációs). Ahol a kettő eltér, a **későbbi** szövegét
vettük át — például *„Antibiotikum stewardship"* helyett *„Az
antibiotikum-alkalmazás irányítása"*. A megnevezés azonosító, tehát ez nem
stiláris kérdés.

---

## Források

| | |
|---|---|
| BELLA akkreditációs kiadvány (2015), TÁMOP-6.2.5.A/12/1 | szerkezet, pontozás, eljárás |
| BELLA — A standardok fejlesztésének módszertana (2014) | standardsablon, kötelező standardok |
| NAH: Áttérési ütemterv a MEES 2.1 alkalmazására, 1. kiadás (2025-12-12) | mérföldkövek, érvényesség |

Mindhárom lenyomattal szerepel a `forrasok/manifest.json`-ban; a PDF-ek maguk
nem kerülnek a repóba.
