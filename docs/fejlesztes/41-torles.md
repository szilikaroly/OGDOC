# 41 — A DPO törlési felülete

*Nem az a kérdés, hogyan töröljünk. Az a kérdés, hogy **szabad-e** — és ha nem,
akkor mi az, ami a beteg kérésére mégis megtehető.*

---

## A tévedés mindkét irányban lehetséges

**Az egyik oldalon** a rendszer kérésre töröl, és ezzel jogszabályt sért: az
egészségügyi dokumentációt a megőrzési idő végéig meg **kell** őrizni, és a
GDPR 17. cikk (3) bekezdése ezt kifejezetten kiveszi a törléshez való jog alól.

**A másikon** a rendszer semmit nem töröl és semmit nem magyaráz, mire a beteg
jogosan érzi úgy, hogy az adatai fölött senkinek nincs beleszólása.

A helyes válasz **kétágú**, és ezt a betegnek **előre** kell látnia:

> - a **kutatási** felhasználás bármikor visszavonható, azonnali hatállyal;
> - az **ellátási** dokumentáció marad, a megőrzési idő végéig.

Ezért a felület nem egy „Törlés" gomb, hanem két külön művelet — és a
sorrendjük kötött: **előnézet → mi teljesíthető helyette → csak azután
végrehajtás.**

---

## Kétféle törlés, és a különbség lényegi

| | Mi történik | Mi marad |
|---|---|---|
| **kriptográfiai** | a **kulcs** semmisül meg | a napló szerkezete és a hasítólánc — a tartalom soha többé nem nyílik fel |
| **fizikai** | az archívum **sorai** tűnnek el | a lánc **megtörik**: a maradék hitelessége nem bizonyítható |

Az alapértelmezés a kriptográfiai, mert egyszerre teljesíti a törlési igényt és
őrzi meg az auditnyomot. A fizikai törlést **nem tiltjuk, de kimondjuk**:
figyelmeztetést kap, nem blokkoló akadályt, és a rendelkezésben rögzíteni kell,
miért nem elég a kriptográfiai.

A tároló művelete után az olvasás `unreadable` hibával bukik el — **nem
`corrupt`-tal.** Az adat nem romlott el, hanem szándékosan olvashatatlan, és a
kettő teendője gyökeresen más.

---

## A kapuk

Minden akadály mellett ott áll, **mi hárítaná el**. Egy akadály, amiről nem
derül ki, mi oldaná fel, nem kapu, hanem zsákutca: a DPO nem tud vele mit
kezdeni, a beteg pedig azt hallja, hogy „nem lehet".

| Kapu | Mi blokkol | Mi oldaná fel |
|---|---|---|
| **rendelkezés** | hiányos: nincs jogalap, indoklás, elrendelő vagy időbélyeg | a rendelkezés kiegészítése |
| **második aláíró** | a visszafordíthatatlan lépéshez egy ember nem elég | egy második, névvel és időbélyeggel |
| **megőrzés ellenőrizetlen** | a megőrzési idő nincs elsődleges forrásból visszaellenőrizve | a [10. lépés](../13-18-lepes.md) |
| **megőrzés le nem telt** | a jogszabályi megőrzési idő tart | a letelte, **vagy a visszavonás** |
| **betegkérés** | függőben van a dokumentáció kikérése | teljesítés vagy visszavonás |
| **kulcstár** | nem tud megsemmisíteni | HSM/KMS, ami a megsemmisítést igazolja |

**A jogalap nem díszítés.** A „beteg kérte" kiváltó ok, nem jogalap: az az, ami
alapján a kérés teljesíthető. A tanúsítványba is ez kerül.

**A négy szem elve** nem jogszabályi követelmény, hanem a rendszer saját
szabálya — ugyanaz, mint az `irreversible` kapu a felülettérképen: a kapunak a
lépés **előtt** kell zárnia, és egyetlen ember egyetlen kattintása ne
semmisítsen meg visszahozhatatlanul adatot. A második aláíró **nem lehet
ugyanaz a személy**; a négy szem egyetlen szempárral nem teljesül.

---

## A mai állapot: minden törlés elakad — és ez helyes

A 14 ellátási dokumentumtípus mindegyikének megőrzési ideje `secondary` szintű,
és egyiknél sincs igazolva a letelte. Egy DPO törlési rendelkezés ma **három
blokkoló akadályon** akad el, és a rendszer mindháromról megmondja, mi hárítaná
el:

```
⛔ masodikAlairo          → egy második, névvel és időbélyeggel ellátott aláírás
⛔ megorzesEllenorzetlen  → a megőrzési idők összevetése a hatályos
                            jogszabályszöveggel (a 10. lépés)
⛔ megorzesLejarta        → a megőrzési idő leteltének igazolása, VAGY a
                            kutatási hozzájárulás visszavonása a törlés helyett
```

Ez nem hiányosság, hanem a helyes viselkedés — és pontosan az, amit a
„kérésre törlünk" rendszerek kihagynak.

---

## Ami MOST IS teljesíthető: a kétágú visszavonás

A kutatási hozzájárulás visszavonása azonnali hatályú, és nem függ a megőrzési
kötelezettségtől:

**Megszűnik:** a minta és az adat kutatási felhasználása · a jövőbeli
álnevesített kiadás · a biobanki tárolás kutatási jogcíme.

**Marad:** mind a 14 ellátási dokumentumtípus, **és mindegyiknél oda van írva,
miért** — a jogszabályhelyre hivatkozva, nem általánosságban.

A hangsúly az **„előre"** szón van: ha a beteg ezt csak a visszavonás után tudja
meg, akkor becsapva érzi magát — jogosan. A visszavonás hatását ezért a
kezelőorvos is lekérdezheti, hogy tanácsot tudjon adni belőle.

---

## A tanúsítvány

Egy törlés, amiről nem marad tanúsítvány, két hónap múlva
megkülönböztethetetlen az **adatvesztéstől**. A művelet ezért mindig
tanúsítványt ad: mit, mikor, ki rendelte el, milyen jogalapon, hány bejegyzést
érintett — és **hogyan ellenőrizhető**:

- *kriptográfiai:* az archívum megvan és a hasítólánca ép, a kulcs megsemmisült;
  a visszafejtés `unreadable` hibával bukik el.
- *fizikai:* a lánc megtört, ezért a törlés ténye a tanúsítványból és az
  auditnaplóból igazolható, az archívumból nem.

**Az auditnapló mindkét esetben megmarad** — enélkül a törlés maga sem volna
bizonyítható.

---

## Végpontok

| Útvonal | Ki | Mit tesz |
|---|---|---|
| `POST /api/torles/elonezet` | **DPO** | lefuttatja a kapukat, **semmit nem változtat** |
| `GET /api/torles/visszavonas` | akinek joga van az esethez | a kétágú visszavonás hatása |
| `POST /api/torles` | **DPO** | végrehajtás — két független kapun át |

**A `409` nem `403`.** A DPO-nak **van** joga; az **állapot** nem engedi. A
kettő összemosása azt sugallná, hogy több jogosultsággal a törlés menne — pedig
nem menne.

A végrehajtás két független kapun megy át, és mindkettőnek nyitva kell lennie:
a **törlési** kapuk (`core/store/torles.ts`) és a **jogosultsági** kapu (a
tároló). A sorrend nem cserélhető fel: az elakadt törlésről nem keletkezik
`delete` auditsor, mert nem is történt törlési kísérlet a tárolón.

---

## Mit bizonyít a teszt

`test/torles.test.ts` (28) és `test/web.test.ts` (+6):

1. **A rendelkezés teljessége** — hat hibabevitel, mind hibaként bukik el;
   köztük az, hogy a második aláíró nem lehet ugyanaz a személy.
2. **Minden kapu külön** — és hogy **mindegyik akadály mellett ott áll a
   feloldás**.
3. **Minden kapu nyitva:** a törlés végrehajthatóvá válik. A kapuk zárnak, nem
   tiltanak.
4. **A fizikai törlés figyelmeztetést kap, nem tiltást** — és mást hagy maga
   után.
5. **A kétágú visszavonás** — és hogy minden maradó tétel mellett ott a
   jogszabályi ok.
6. **A tároló művelete**: a törlés után `unreadable` (nem `corrupt`), a
   hasítólánc ép marad, a klinikus nem rendelhet el törlést, az elutasított
   kísérlet is naplózódik, és kulcsmegsemmisítés nélkül a művelet **elbukik,
   nem hazudik**.
7. **Az előnézet semmit nem változtat** — az archívum a hívás után bájtra
   ugyanaz.

---

## Hol van a kód

| | |
|---|---|
| a kapuk, a visszavonás, a tanúsítvány | `core/store/torles.ts` |
| a tároló művelete | `core/store/biztonsagos.ts` → `destroyKey` |
| a `KeyStore.destroy` szerződés | `core/store/biztonsagos.ts` |
| végpontok | `web/tarolo-api.ts`, `web/server.ts` |
| felület | `web/public/index.html`, `app.js` — a panel csak DPO-nak |
| tesztek | `test/torles.test.ts` (28), `test/web.test.ts` (+6) |

---

## Ami továbbra is nyitva van

**A megőrzési idők hitelesítése** — a 10. lépés. Amíg `secondary`, a rendszer
nem töröl, és ez így helyes.

**A kulcstár.** A `FileKeyStore.destroy` működik, de a kulcsot a titkosított
adat mellé írja. Egy HSM vagy KMS a megsemmisítést **igazolni** is tudja; a
fájlalapú kulcstár csak elvégzi.

**A megőrzési idő leteltének gépi számítása.** Ma a rendelkezés **állítja**, a
rendszer csak ellenőrzi, hogy elmúlt-e. A `retention.from` (`recordClose` ·
`patientDeath` · `lastAccess`) alapján ez levezethető volna — de ehhez az eset
lezárási dátuma kell, ami a `13` modul dolga.
