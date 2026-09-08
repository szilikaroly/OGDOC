# Modul 36 — Hitelesítés, megbízás és az éles üzem kapuja

*A „ki vagy te?” és a „mihez van jogod?” két külön kérdés — és a kettő
összekeverése egy hitelesítési hibából csendben jogosultsági hibát csinál.*

---

## A modul egyetlen szerkezeti kérdése

**A jogosultsági réteg hibátlanul működhet úgy is, hogy semmit nem véd.**

A rendszerben a `core/store/hozzaferes.ts` már régóta három rétegben döntött:
szerepkör → ellátási kapcsolat → időablak. Minden elutasítás indokolt volt,
minden hozzáférés naplózott. Egyetlen dolog hiányzott: **a cselekvő kilétét
egyetlen ellenőrizetlen kérésfejléc állította.**

Ez nem részhiba, hanem a réteg értelmének elvesztése. Egy tökéletes
jogosultsági rendszer, ami arról dönt, akinek a kérés *mondja magát*, pontosan
annyit véd, mint a semmi — csak látszólag többet, és ez rosszabb.

---

## Amit ez a modul ad

| Réteg | Fájl | Mit dönt el |
|---|---|---|
| Jelszó | `core/auth/jelszo.ts` | tárolás (scrypt), ellenőrzés, jelszószabály |
| Felhasználó | `core/auth/felhasznalo.ts` | belépés, fékezés, zárolás, jelszócsere |
| Megbízás | `core/auth/csoport.ts` | csoport × hatókör × időablak |
| Munkamenet | `core/auth/munkamenet.ts` | tétlenségi és abszolút lejárat |
| Szolgáltatók | `core/auth/szolgaltato.ts` | helyi / EESZT / eduID / intézményi |
| Kapu | `core/auth/kapu.ts` | mi hiányzik még az éles üzemhez |

---

## A jelszószabály: hossz, nem összetettség

A NIST SP 800-63B 2017 óta **kimondottan ellenjavallja** az összetételi
szabályokat és a kötelező időszakos cserét. Aki nyolc karaktert kap kötelező
összetettséggel, `Jelszo1!`-et ír, majd kilencven nap múlva `Jelszo2!`-t.

| Amit a rendszer kér | Amit **nem** kér |
|---|---|
| legalább 12 karakter | nagybetű |
| tiltólista, a tő levágásával | szám |
| a saját név és belépőnév tiltása | írásjel |
| csere **kompromittálódás gyanújakor** | kötelező időszakos csere |

A tő levágása azt fogja meg, amit az összetételi szabály nem: a `Tavasz2026!`
minden szokásos feltételnek megfelel, és mégis kitalálható.

**A saját adat szóköz nélkül is saját adat.** A `kismintaanna2026` jelszóban a
„Minta Anna” benne van — egészben keresve nem található meg. A szabály ezért
szóhatár nélkül és szavanként is néz.

---

## Fékezés, nem zárolás — mert a zárolás maga a támadás

A megszokott „öt hibás kísérlet után a fiók zárolva” éles üzemben azt jelenti,
hogy a támadónak **nem kell bejutnia**: elég ötször hibásan próbálkoznia az
ügyeletes orvos nevével hajnali háromkor.

Ezért a kivárás nő (4. kísérlet → 1 mp, 12. → 256 mp), de **felső korláttal**,
és a fiók magától visszatér. A zárolás megmarad — kézi műveletként, megnevezett
emberrel és **kötelező indokkal**: indoklás nélkül utólag nem különböztethető
meg a fegyelmi intézkedés az elgépeléstől.

**Az ismeretlen név ugyanannyi ideig tart.** A nem létező felhasználóra is
lefut egy azonos költségű árnyék-ellenőrzés — enélkül a válaszidő megmondaná,
ki dolgozik itt, és egy kórházban a névsor önmagában is adat.

---

## A megbízás: csoport × hatókör × időablak

A kórházban az ellátási kapcsolat túlnyomó része **nem kézi felvétel, hanem a
beosztásból következik**: az ápoló azért láthatja a 3. szoba betegét, mert ma
délelőtt ő van beosztva arra az osztályra. Ha ezt kézzel kell rögzíteni, nem
fogják rögzíteni.

```
CSOPORT      mit jelent a munkakör: milyen szerepköröket ad, MILYEN SZINTŰ
             helyre adható, és kötelező-e hozzá lezárt időablak
HATÓKÖR      a hely-hierarchia egy csomópontja — LEFELÉ öröklődik, felfelé SOHA
IDŐABLAK     a műszaknak van vége, a jognak vele
```

**A megbízás nem ad közvetlen esethozzáférést**, hanem ellátási kapcsolatot
keletkeztet — a megbízás és a fekvés *metszetére*. Így a `decide()` második
rétege nem kerülhető meg, és minden auditsorban a valódi jogalap áll.

### Amit a modell nem enged

| Kísérlet | Mi történik |
|---|---|
| ápoló megbízása klinika szintre | elutasítva: a csoport osztály/alosztály/szoba szintre adható |
| műszakos megbízás **vég nélkül** | elutasítva — *a jogosultsági rendszerek leggyakoribb csendes hibája: nem téves engedély, hanem **vissza nem vont** engedély* |
| megbízás **adományozó nélkül** | elutasítva: az eredet visszakereshetetlen lenne |
| megbízás **törlése** | nincs ilyen: a visszavonás **lezár**, mert az auditnapló hivatkozik rá |

---

## A „mindenható admin” a rendszer fölött mindenható, a betegadat fölött nem

Ez látszólag ellentmond a kérésnek, és szándékosan. Egy kórházban a
rendszergazdai fiók a leggyakrabban visszaélt hozzáférés, mert egyszerre
teljhatalmú és személytelen. Ha az `admin` közvetlenül olvashatna leletet,
minden betegadat-hozzáférés megkerülhető lenne egyetlen fiókkal, és az
auditnapló nem mondana semmit.

**Az út nincs elzárva:** a rendszergazda megbízást adhat magának klinikusként.
De az a megbízás **látszik** — névvel, indokkal és időablakkal. A különbség nem
a lehetőség, hanem a **nyom**.

---

## Az `admin:admin`, és miért kiabál róla a rendszer

Az első indításkor létrejön, mert enélkül senki nem tud belépni. De:

- `jelszotCserelni: true` jelöléssel — a belépés után **más végpont nem nyílik**;
- a jelszószabály ezt a jelszót **elutasítaná** (5 karakter, tiltólistás), ezért
  a bootstrap kikerüli a szabályt — és **ez a kikerülés jelölve van**;
- a kapu hiányzó feltételként mutatja, amíg a jelszó változatlan;
- a kiszolgáló minden indításkor kiírja.

Ez az egyetlen hely a rendszerben, ahol a jelszószabály ki van kerülve. Ha még
egy lenne, az már nem kivétel volna, hanem szokás.

---

## A kapu: feltétellista, nem kapcsoló

A hitelesítés elkészültéből **nem következik**, hogy a rendszer éles üzemre
kész. A részleges megoldást teljesnek mondani ugyanaz a hiba, ami ellen az
egész rendszer épül.

| Feltétel | Áll? | Fejlesztői feladat? |
|---|---|---|
| A cselekvő kilétét ellenőrzés igazolja | **igen** | igen — kész |
| Nem áll alapértelmezett rendszergazdai jelszó | nem | **nem** |
| A kapcsolat titkosított (TLS) | nem | **nem** |
| Van második tényező | nem | **nem** |
| A kulcs nem az adat mellett áll (HSM/KMS) | nem | **nem** |

`GET /api/kapu` — a kapu állapota bejelentkezés nélkül is olvasható: aki a
rendszert telepíti, tudnia kell, mi hiányzik, **mielőtt** belép.

---

## Az elutasítás is auditköteles

Amíg a jogosultság a tárolóban dőlt el, minden elutasítást a tároló naplózott.
A hitelesítési réteg viszont a tároló **előtt** utasít el — lejárt megbízás,
ismeretlen munkamenet, zárolt fiók.

Ha ez a réteg nem naplózna, ezek az események **nyomtalanul eltűnnének** —
pedig épp ezeket kell egy auditornak látnia: *valaki olyan próbált hozzáférni,
akinek a joga megszűnt.*

---

## Ami hiányzik, és kinél áll

| Tétel | Kinél | Mit nyit meg |
|---|---|---|
| TLS-tanúsítvány és fordított proxy | üzemeltetés | az éles üzem egyik feltétele |
| Második tényező (EESZT / eduID / MFA) | intézményi informatika | az éles üzem egyik feltétele |
| HSM vagy KMS | üzemeltetés + infobiztonság | a kriptográfiai törlés valódi értéke |
| Kiszivárgott-jelszó lista (HIBP) | üzemeltetés | a tiltólista valódi lefedettsége |
| Intézményi címtár (LDAP/AD) elérése | intézményi informatika | a kilépő dolgozó automatikus kizárása |

**Négy az ötből nem fejlesztői feladat.**

---

## Elfogadási kritérium

`test/auth.test.ts` — 32 teszt. A legfontosabbak:

- a hibás név és a hibás jelszó **ugyanazt** az üzenetet adja;
- fékezés után a helyes jelszó sem megy át azonnal;
- a külső szolgáltatóhoz tartozó felhasználó **helyi jelszóval soha** nem lép be
  — akkor sem, ha a szolgáltató épp nem válaszol;
- a műszakhoz kötött megbízás **nem lehet nyitott**;
- a teljes lánc: megbízás → ellátási kapcsolat → hozzáférési döntés, és a
  műszak után **ugyanabból az adatból** elutasítás;
- a rendszergazda **nem olvashat** esetet.
