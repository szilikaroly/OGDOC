# Modul 30 — Védőnői ellátás

*A magyar rendszer sajátja, és a 29. modul átfedésben lévő párja.*

---

## A modul egyetlen szerkezeti kérdése

**A védőnő nem az orvos kisebb hatáskörű változata. Más ellátási viszony.**

Ha a rendszer a védőnőt „korlátozott jogosultságú orvosként" modellezi, három
dolgot ront el egyszerre, és mindhárom csendben:

1. **A védőnő a lakásban van, nem a rendelőben.** Amit ő lát — a lakhatás, a
   dohányzás a szobában, hogy van-e hol aludnia a babának —, azt orvos soha nem
   látja, és ez a leggyakrabban hiányzó adat a gyermekvédelmi ügyekben.
2. **A gondozás folyamatos, nem esetalapú.** A rendszer eddigi minden rétege
   *esetre* épül: felvétel, ellátás, zárás. A védőnői gondozás **hónapokig
   tartó, ütemezett látogatássorozat**, aminek a kimaradása maga a lelet.
3. **Két beteget gondoz egyszerre**, és a kettő ellátása össze van kötve —
   pontosan az az összerendelés, amit a 29. modul jogalaphoz kötött.

---

## Mi van már meg

| | |
|---|---|
| `core/gyermek/perinatalis.ts` | életszakaszok, az anya–gyermek összerendelés kapuja |
| `registry/gondozas/` | gondozási protokoll, elmulasztott vizit megállapítása |
| `core/plan/` | ellátástervezés, konzílium-javallat |
| ExAssist (28.) | protokoll szerinti teljesség — a státuszvizsgálatokra is |
| Jogosultsági réteg | a védőnő megnevezett szerep, saját ellátási kapcsolattal |

---

## 1. Az ütemezett látogatás — és a kimaradás mint lelet

A védőnői gondozás naptárhoz kötött: várandósgondozás, majd az újszülött- és
csecsemőkori státuszvizsgálatok rögzített életkorokban.

**A rendszer eddigi „elmulasztott vizit" fogalma nem elég ide.** Ott a vizit
elmaradása adminisztratív tény; itt **klinikai jel**. A meg nem jelenő család a
gyermekvédelem legerősebb korai jelzője — és a rendszernek ezt **nem szabad
csendben elengednie**, ahogy a nem dokumentált vizsgálati részt sem.

Három állapot, ugyanaz a szerkezet, mint az ExAssist tételeinél:

| | Mit jelent |
|---|---|
| `megtortent` | a látogatás megvolt, dokumentálva |
| `elmaradt` | **megnevezett okkal** — beteg, elköltözött, elutasította |
| *(hiányzik)* | esedékes volt, és nincs bejegyzés → **ez a jel** |

---

## 2. Amit csak a védőnő lát

A lakáskörülmény **nem szociális adminisztráció**, hanem klinikai bemenet:
biztonságos alvóhely, fűtés, dohányzás a lakásban, a családban élők, a
kapcsolati erőszak jelei.

**És itt a rendszer eddigi legerősebb megfordítása érvényes** (18. modul,
gyermeknőgyógyászat): a **bántalmazás mérlegelésének elmaradása önmagában piros
zászló** — mert a gyermekvédelmi mulasztások túlnyomó része nem téves ítélet,
hanem elmaradt kérdés. Ez a védőnői modulban nem kivétel, hanem alapeset.

> **Amit a rendszer itt sem tesz:** nem állapít meg bántalmazást, és nem is
> zárja ki. A mező arról szól, hogy a kérdés **felmerült-e**.

---

## 3. Az átfedés a gyermekgyógyászattal — és ami elválasztja

Ugyanazokat a méréseket veszi fel (súly, hossz, fejkörfogat), ugyanazokra a
görbékre. **Az adat közös, a felelősség nem.**

| | Védőnő | Gyermekgyógyász |
|---|---|---|
| Mit rögzít | státuszvizsgálat, gondozási adat | diagnózis, terápia |
| Mit **nem** | nem diagnosztizál, nem rendel gyógyszert | — |
| Mi a teendője eltérésnél | **beutalás**, megnevezett sürgősséggel | ellátás |

A rendszernek ezt **kényszerítenie kell**: egy védőnői bejegyzésből nem lehet
diagnózis, és a percentilis-eltérésre adott válasz nála **beutalás**, nem
megfigyelés. Ez ugyanaz a kapu, mint a telemedicinánál a laikus kérésnél — más
szereplő, azonos szerkezet: *a kérés/észlelés nem rendelés*.

---

## 4. A védőoltási naptár — 2026

Forrás: **NNK Módszertani levél a 2026. évi védőoltásokról** (2026.03.30.), a
18/1998. (VI. 3.) NM rendelet felhatalmazása alapján. Hatósági hivatalos
közlemény — feldolgozható, de a besorolást jogi állásfoglalásnak kell
megerősítenie.

**Két ütemezés.** A csecsemő- és kisdedkori oltások életkorhoz (hónap), az
iskoláskoriak **iskolai évfolyamhoz** kötöttek — a levél ezt kimondja: *„A
kampányoltások iskolai osztályokra és nem a tanulók életkorára vonatkoznak."*

| | Tétel |
|---|---|
| `folyamatos` (11) | BCG · DTPa+IPV+Hib 2–3–4 hó · PCV 2–4–12 hó · Varicella 12 és 15 hó · MMR 15 hó · DTPa+IPV 72 hó |
| `kampany` (4) | 6. évfolyam: MMR újraoltás, dTap · 7. évfolyam: hepatitis B sorozat (3 részlet), HPV (**önkéntes**) |
| `idokozok` (5) | inaktivált–inaktivált 0 nap · két élővírus nem egyidejűleg **28 nap** · élővírus–BCG 28 nap · tetanusz-posztexpozíció után 6–12 évesnél 30 nap |

**Az évfolyam számlálóból jön, nem életkorból**: a beiratkozás 5–7 éves kor közé
esik (két év szórás), a 6. és 7. évfolyam oltásai viszont egy évre vannak
egymástól. `évfolyam = mostani tanév − beiratkozás tanéve + 1`. Beiratkozási év
nélkül a kampánysor `evfolyamIsmeretlen` — **se nem esedékes, se nem elmaradt**.

**Öt bejegyzés-állapot**, és egyik sem olvasztható a másikba:

| | Miért külön |
|---|---|
| `beadva` | **tételszám nélkül visszahívhatatlan** — ez az egyetlen mód megtalálni az érintetteket |
| `halasztva` | **új időpont nélkül nem halasztás**, csak megnyugtatóbban néz ki |
| `elutasitva` | a kötelező oltás megtagadása **jogkövetkezménnyel és jelentési kötelezettséggel** jár |
| `ellenjavallt` | dokumentált orvosi ok — nem mulasztás |
| `atesett` | varicellánál: aki átesett rajta, nem oltandó |

**A naptár aláírásra vár.** Az aláírás a naptár *magjához* köt — az ütemezés
módját és az időköz-szabályokat is beleértve —, és a Módszertani levél évenkénti
új kiadása **elavulttá teszi**.

**A rekord kettő, a naptár egy.** A gyermekorvosi oldal ugyanezt a naptárt
használja; a két rekord egyesítése a 29. modulban van leírva, és ütközésnél
**nem deduplikál**.

---

## 5. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| `vedono.status.*` | `anthro.*`, növekedési görbék | a mérések közösek |
| `vedono.lakas.*` | `hx.life.*` | a lakáskörülmény anamnézis is |
| kimaradt látogatás | `plan.*` | **feladat**, nem statisztika |
| `vedono.zaszlo.*` | gyermekvédelmi konzultáció | a 18. modul útján |
| gondozási előzmény | 29. modul | az összerendelés jogalapja szerint |
| oltási bejegyzés | 29. modul | **közös naptár, két rekord** — ütközésnél nem olvad össze |

---

## 6. Elfogadási kritérium

1. Az esedékes, be nem jegyzett látogatás **jelet ad** — nem tűnik el.
2. Az `elmaradt` látogatás **megnevezett okot** kíván.
3. A védőnői bejegyzésből **nem lesz diagnózis**, és nem lesz gyógyszerrendelés.
4. Percentilis-eltérésnél a kimenet **beutalás**, megnevezett sürgősséggel.
5. A bántalmazás mérlegelésének elmaradása **piros zászló**.
6. A lakáskörülmény rögzítése **nem kötelezően kitöltendő mező**, de a hiánya
   látszik — mint minden más hiány ebben a rendszerben.
7. Az oltási naptár **aláírás nélkül nem ad esedékességet**; a kampányoltás
   **évfolyamból** dől el; a beadott oltás **tételszám nélkül** külön állapot.

---

## 7. Nyitott kérdések

- **A védőnői dokumentáció jogi státusza**: önálló egészségügyi dokumentáció,
  vagy a gondozási lap része? Ettől függ a megőrzési horgony (10. lépés).
- **Ki látja a lakáskörülményt?** Ez a rendszer egyik legérzékenyebb adata a
  gyerek–anya összerendelés után. A jogosultsági szabályt ki kell mondani.
- **Az EESZT-be mi kerül** a védőnői gondozásból? (14. lépés)
- **Ki írja alá az oltási naptárt**, és milyen határidővel az új Módszertani
  levél megjelenése után? Aláírás nélkül a naptár nem ad esedékességet — ez
  szándékos, de nem tartható sokáig.
- **A területi ellátási kötelezettség** és a rendszer ellátási kapcsolat
  fogalmának viszonya: a védőnő a *körzethez* tartozik, nem az esethez.
