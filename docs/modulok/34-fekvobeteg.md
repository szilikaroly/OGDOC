# Modul 34 — Teljeskörű fekvőbeteg-ellátás: hely, ágy, ADT, műtéti foglalás

*Ahol a „szabad” szó három dolgot jelent, és a rögzített mélység fantomokat szül.*

---

## A modul egyetlen szerkezeti kérdése

**A helyhierarchia nem kilenc szint, hanem lánc.**

A kérés így szólt: klinika » intézmény » intézet » telephely » részleg » osztály
» alosztály/szint » szoba » ágy. És pontosan ez az, amit **nem szabad rögzített
mélységként megépíteni.**

Egy kilenc oszlopos táblában minden helynek ki kell töltenie mind a kilencet. A
valóság nem ilyen: van klinika külön intézet nélkül, van telephely, ahol az
osztály közvetlenül a részleg alatt van, van elkülönítő szoba, ami maga
viselkedik részlegként, és van **folyosói ágy**, ami nem szobában áll.

Ha a mélység rögzített, a hiányzó szintekre **fantomsorok** kerülnek („nincs
intézet", „nincs alosztály") — és ezek utána megjelennek a statisztikában, a
jogosultsági szabályokban és a jelentésben. *Egy fantom részleg, aminek ágyai
vannak, pontosan úgy néz ki, mint egy valódi.*

> **A helyes szerkezet lánc**: minden hely megnevezi a saját **fajtáját** és
> azt, hogy minek a része. A mélység abból adódik, ami tényleg ott van — ez
> egyben a HL7 FHIR `Location.partOf` szerkezete, tehát a kifelé illesztés nem
> külön munka.

A demókészletben ezért **nincs** `intezmeny` és `intezet` szint, a szülőszoba
szobái közvetlenül az osztály alatt vannak, és a rooming-in ágy 7 elem mélyen
van, a folyosói 5-tel. Egyik sem fantom.

**Amit a lánc megkövetel, és a tábla nem:** hogy ne legyen **kör** benne, és
hogy egy helynek **egy** szülője legyen. Kör esetén minden felfelé összegzés
kétszer számol; két szülő esetén a megosztott ágy kétszer szerepel a klinika
szintjén. A validáló mindkettőt hibának veszi.

---

## 1. Az ágy: állapotgép, a takarítással együtt

```
szabad ──foglal──▶ fenntartva ──erkezik──▶ foglalt ──elbocsat──▶ piszkos
   ▲                    │                                          │
   └────────────────────┴──────────takarit──────────────────────────┘

bármelyik ──kivon──▶ karbantartas ──visszaad──▶ piszkos
```

**Két átmenet hiányzik a naiv modellből, és mindkettő üzemeltetési valóság:**

1. **Az elbocsátás után az ágy piszkos, nem szabad.** Aki azonnal szabadra
   állítja, olyan ágyra küld beteget, amit még nem takarítottak ki — ez nem
   adminisztratív kellemetlenség, hanem **fertőzésátvitel**. A `piszkos` állapot
   egyben **munka**: a takarításnak van címzettje.
2. **A karbantartásból visszaadott ágy sem szabad** — előbb takarítás.

### És az állapot öregszik

Egy **két napja piszkos** ágy nem takarításra vár — arról **elfelejtkeztek**. Egy
`fenntartva` ágy, aminek a fenntartása tegnap lejárt, nem fenntartva van, hanem
**elveszett kapacitás**. Az állapotnak ezért ideje van, és négy öregedési
állapot: `friss` · `elhuzodo` · `elfelejtve` · **`nemMerheto`** — kezdet nélkül
a válasz nem „friss".

### A szülészeti ágyon két beteg fekszik

A rooming-in ágy az anyát **és** az újszülöttet tartja — az újszülött **külön
beteg** (29. modul). Ha nem foglal helyet a nyilvántartásban, **nem is látszik,
hogy ott van**.

---

## 2. ADT — az esemény állítás arról, hol van a beteg

`A01` felvétel · `A02` áthelyezés · `A03` elbocsátás — a HL7 ADT üzenettípusok,
amikre a kifelé illesztés épül.

Mindegyikhez **elrendelő** kell: az áthelyezés az a művelet, amit a
leggyakrabban kérdeznek vissza (miért került intenzívről osztályra, ki döntött
róla), és gazda nélkül utólag nem magyarázható meg.

**A fél áthelyezés nem rögzíthető.** Ha csak a „honnan" vagy csak a „hova" van
meg, a beteg vagy két helyen van, vagy egy helyen sem — és az utóbbi a rosszabb,
mert a keresésben eltűnik. A validáló hibának veszi, ha egy beteg két ágyon
szerepel.

---

## 3. A műtéti időpont az ágyról — három dologból áll

A naiv műtőbeosztás **szobafoglalás**. Egy műtéti foglalás viszont három
dologból áll, és mindhárom nélkül üres:

| | Honnan | Mi történik nélküle |
|---|---|---|
| **a műtő** | `core/op/muto.ts` | nincs hol operálni — és a sürgősségi tartalék elfogy |
| **a csapat** | **a CRM (19. modul)** — beosztás, szabadság, pihenőidő | *egy szoba önmagában nem műtét*: aneszteziológus nélkül a beavatkozás nem indul |
| **az ágy, ahová visszajön** | a helyhierarchia | a beteg a műtőasztalról nem mehet haza; az ébresztőben töltött óra a következő műtétet tolja el |

> **A CRM hallgatása nem igen.** Ha a beosztás nem kérdezhető le — a rendszer
> nem érhető el, a jövőbeli beosztás még nincs kiadva —, a csapat állapota
> `nemTudjuk`, és ez **nem** ugyanaz, mint „van csapat". Ugyanaz a szabály, mint
> az interakció-ellenőrzésnél (32. modul).

**A foglalás az ágyhoz köt, nem csak a névhez.** Egy műtétre hívott beteg, akit
közben elbocsátottak vagy áthelyeztek, a naptárban változatlanul ott áll — ezt
csak az ágy-kötés fogja meg.

**Sürgős beavatkozásnál** a visszatérő ágy hiánya és a hiányos beosztás **nem**
állítja meg a műtétet: egy azonnali császármetszés nem várhat ágyra, és a csapat
riasztása a beosztástól független.

**Mit lehet felülbírálni, és mit nem:** a `nemTudjuk` (lekérdezhetetlen
beosztás) megnevezett felelőssel nyitható; a **hiányzó szerep** nem — attól,
hogy valaki aláírja, nem lesz aneszteziológus.

---

## 4. A CRM-mel egészben

A 19. modul (IntuiCare) **meglévő rendszer**, nem terv: ő kezeli a HR-t, a
beosztást, a szabadságot és az időpontokat. Ez a modul **nem tart saját
HR-nyilvántartást** — kérdez, és a választ (`elerheto` · `nincsBeosztva` ·
`utkozik` · `nemTudjuk`) kapuként használja.

A szerepkövetelmény viszont **itt** adat (`registry/muto/szerepek.json`): mely
szerepek kötelezők beavatkozásonként. Csapat nélküli beavatkozás felvétele
**hiba** — különben a naptár olyan műtétet mutatna, ami nem tud elindulni.

---

## 5. Elfogadási kritérium

1. A helyhierarchia **lánc**, nem rögzített mélység; kör és több szülő **hiba**.
2. A hiányzó szintekre **nem** kerül fantomsor, és az üres szervezeti egység
   **megnevezve** jelenik meg.
3. Az elbocsátás után az ágy **piszkos**; piszkos ágyra nem érkezik beteg.
4. Az ágyállapot **öregszik**, és a kezdet hiánya nem „friss".
5. A rooming-in ágyon **két beteg** fér el, és mindkettő látszik.
6. ADT-esemény **elrendelő nélkül** nem rögzíthető; fél áthelyezés nincs.
7. A műtéti foglalás **műtő + csapat + visszatérő ágy** — és a CRM hallgatása
   nem igen.

---

## 6. A hely SZERKESZTÉSE — 25. modul

A fát nem ez a modul szerkeszti: az **épület-management** a 25. modulban
(adminisztráció és belső szerkesztő) él, `core/admin/helyszerkeszto.ts`. Amit
onnan tudni kell ide:

- a hely **időben érvényes**, és a múltbeli ADT-esemény **az akkori** fát
  találja meg — egy mai átnevezés nem írja át a tavalyi statisztikát;
- **foglalt hely nem helyezhető át és nem zárható le**;
- **törlés nincs**, csak lezárás, dátummal és okkal.

---

## 7. Nyitott kérdések

- **A valós helyfa** felvétele: melyik telephely, hány részleg, hol van
  ténylegesen alosztály. Ez szervezeti adat, nem fejlesztési kérdés.
- **A sürgősségi tartalék mérete** — aláírásra vár (11. modul).
- **Ki írhat elő áthelyezést** melyik irányba: jogosultsági kérdés, ami a CRM
  szerepmodelljéhez köt.
- **Valós idejű frissítés**: a mag szinkron és levezethető marad; a
  WebSocket/MQTT szállítási kérdés, és nem indokolhatja, hogy a kapuk kikerüljenek
  a magból a felületre.
