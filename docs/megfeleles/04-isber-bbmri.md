> **Döntés (K9): csatlakozunk a BBMRI-ERIC-hez**, és cél az ISO 20387 akkreditáció is.
> A csatlakozás előfeltétele a MIABIS-alapú gyűjtemény-metaadat, ami a 20387-es munkából
> úgyis megvan — a sorrend ezért: 20387 → BBMRI-ERIC
> (ld. [`11-integralt-mir.md`](11-integralt-mir.md), 5. pont).

# ISBER Best Practices és BBMRI-ERIC

> Mindkét dokumentumkör rendszeresen frissül. **A beszerzéskor a kiadás- és verziószámot
> rögzíteni kell**, és a leképezést ahhoz kell kötni — különben egy év múlva nem tudjuk,
> melyik változatnak felelünk meg.

---

## 1. ISBER Best Practices — a minta életciklusa

Az ISO 20387 azt mondja meg, **mit** kell teljesíteni; az ISBER azt, **hogyan** csináljuk jól.
A kettő nem verseng: az ISBER a szabvány folyamatkövetelményeit tölti meg tartalommal.

### 1.1 A fő területek és a megvalósítás

| Terület | Amit az ISBER ad | Megvalósítás az OGDOC-ban |
|---|---|---|
| **Irányítás, ELSI** | biobank-politika, hozzáférési szabályzat, etikai keret | `00-keret.md`, `06-beleegyezes.md` |
| **Gyűjtés** | mintavételi eljárás, azonosítás, hozzájárulás-ellenőrzés a levétel pillanatában | `22` modul: a hozzájárulás állapota **gátolja** a mintavétel rögzítését |
| **Preanalitika** | a levételtől a tartósításig eltelt idő és körülmények | **SPREC-kódolás** — ld. lentebb |
| **Feldolgozás** | alikvotálás, nukleinsav-izolálás, sejtszeparálás | validált SOP-onként |
| **Tárolás** | hőmérsékleti osztályok, redundancia, riasztás, tartalék kapacitás | tárolóhely-hierarchia + monitorozás |
| **Visszakeresés, kiadás** | kérelem, bírálat, kiadás, szállítás | hozzáférési folyamat + MTA |
| **Minőségellenőrzés** | mintatípusonkénti QC-mutatók, trendkövetés | QC-mezők a minta-rekordban, trendek a `20` modullal |
| **Biztonság** | biológiai és munkabiztonság | SOP; a `21` modul kockázatértékelési motorja használható rá |
| **Katasztrófaterv** | áramkimaradás, fagyasztóhiba, tűz, árvíz, járvány | **külön terv, próbával** — ld. 1.3 |
| **Informatika** | LIMS-követelmények, adatintegritás, mentés | az OGDOC maga |
| **Költség** | fenntarthatóság, költségtérítési modell | üzleti, nem műszaki |

### 1.2 SPREC — a preanalitikai kód

A biobanki minta tudományos értéke nagyrészt azon áll, hogy **tudjuk-e, mi történt vele a
levételtől a lefagyasztásig**. Két azonos vércsőből az egyik órákig szobahőn állt, a másik
20 percen belül feldolgozásra került — ezek nem egyenértékű minták, és ha ez nincs rögzítve,
a belőlük származó eredmény nem értelmezhető.

A SPREC (Standard PREanalytical Code) ezt kódolja: mintatípus, alvadásgátló, centrifugálás,
a fázisok közti idők, tárolási hőmérséklet, tárolóedény.

**Az OGDOC-ban a preanalitikai leírás kötelező mező** a `bb_specimen` rekordon. Nem
utólag pótolható: a rendszer a mintavétel rögzítésekor kéri be.

### 1.3 A katasztrófaterv, amit tényleg meg kell írni

Ez az a pont, amit a legtöbb induló biobank kihagy, és amit az első auditon kérnek:

| Esemény | Mit kell előre eldönteni |
|---|---|
| Fagyasztó meghibásodása | riasztási lánc, **tartalék kapacitás**, áthelyezési sorrend (mely minták a legértékesebbek) |
| Áramkimaradás | szünetmentes ellátás, aggregátor, mennyi ideig tart ki |
| Hosszabb kiesés | külső tárolási megállapodás **előre megkötve** |
| Adatvesztés | mentés, és a **visszaállítás rendszeres próbája** |
| Személyi kiesés | helyettesítés, a kódkulcs hozzáférésének folytonossága |

A terv akkor ér valamit, ha **próbálva van**. Egy évente egyszer lefuttatott
helyreállítási próba többet ér, mint egy tökéletes, sosem tesztelt dokumentum.

---

## 2. BBMRI-ERIC — hogyan illeszkedünk másokhoz

A BBMRI-ERIC az európai biobank-infrastruktúra. A csatlakozás nem kötelező, de **a
kutatási hasznosulás szempontjából ez a legnagyobb hozam**: enélkül a biobank izolált marad.

### 2.1 Amit a csatlakozás kíván

| Elem | Mit jelent | Megvalósítás |
|---|---|---|
| **MIABIS** | *Minimum Information About BIobank data Sharing* — közös minimum-metaadatkészlet a biobankról, a gyűjteményekről és a mintákról | a regiszterből **generálható**, ha a leképezés megvan |
| **Directory** | a biobankok és gyűjtemények nyilvános katalógusa | MIABIS-alapú publikálás |
| **Negotiator** | a hozzáférési kérelmek egységes folyamata | a saját hozzáférési folyamatunk erre képezhető le |
| **Common Service ELSI** | etikai-jogi-társadalmi eszköztár, sablonok | beleegyezési és MTA-sablonok forrása |
| **Quality management** | önértékelés, ISO 20387 felé vezető út | `01-iso20387.md` |

### 2.2 A MIABIS-leképezés mint tervezési követelmény

A MIABIS három szinten ír le: **biobank**, **gyűjtemény (collection)**, **minta**.

```
MIABIS biobank        ──▶  intézményi törzsadat (név, OID, kapcsolattartó, típus)
MIABIS collection     ──▶  bb_collection tábla (téma, diagnózis, korosztály, mintatípusok, méret)
MIABIS sample/donor   ──▶  bb_specimen + a regiszter aggregált klinikai jellemzői
```

**Fontos:** a Directory-ba **aggregált** adat kerül („van 214 preeclampsiás terhességből
származó szérumminta"), nem egyedi rekord. A konkrét adat csak jóváhagyott hozzáférési
kérelemre, MTA mellett hagyja el a rendszert.

> **Tervezési következmény:** a MIABIS-mezőket a Fázis 2-ben már a regiszterbe kell
> illeszteni (`standards.miabis`), nem utólag. Ha a gyűjteményeket nem MIABIS-kompatibilisen
> írjuk le, a későbbi csatlakozás manuális átsorolás lesz több száz gyűjteményre.

### 2.3 A `20` modul és a Directory

A `20` modul lekérdezője adja a Directory-ba publikálandó aggregátumokat: hány minta, milyen
diagnózissal, milyen korosztályból, milyen mintatípusban. **A k-anonimitási küszöb itt is
érvényes** — egy háromfős gyűjtemény ritka diagnózissal nem publikálható.

---

## 3. Hogyan illeszkedik a három norma

| Kérdés | ISO 20387 | ISBER | BBMRI-ERIC |
|---|---|---|---|
| Mit kell teljesíteni? | ✅ | | |
| Hogyan csináljuk jól? | | ✅ | |
| Hogyan osztunk meg? | | | ✅ |
| Auditálható? | ✅ akkreditálható | önértékelés | önértékelés |
| Kötelező? | nem, de ez a mérce | nem | nem |

**Javasolt sorrend:**

1. **ISBER-alapú SOP-ok** — ezek adják a napi működést (Fázis 2–3)
2. **ISO 20387 kontrollmátrix** kitöltése ezekre (Fázis 3)
3. **MIABIS-leképezés** és Directory-csatlakozás (Fázis 4)
4. Akkreditáció, ha az intézmény ezt célozza (Fázis 5+)

Fordított sorrendben nem működik: akkreditálni egy nem működő rendszert nem lehet, és
publikálni sem érdemes olyan gyűjteményt, aminek a minőségét nem tudjuk igazolni.

---

## 4. Nyitott kérdések

1. **Cél-e az akkreditáció?** Ha igen, az `01-iso20387.md` ⬜ tételei határidőt kapnak; ha
   nem, a mátrix önértékelési eszköz marad. Ez erőforrás-kérdés, nem műszaki.
2. **Cél-e a BBMRI-ERIC Directory-csatlakozás?** Ha igen, a MIABIS-leképezés a Fázis 2-be
   kerül, nem a 4-be.
3. **Az ISBER kiadás és a BBMRI-ERIC dokumentumverziók** beszerzése és rögzítése — kinek a
   feladata, és mikor.
