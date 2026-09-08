# Webes réteg

```
cd ogdoc && OGDOC_SYNTHETIC=1 npm run web    →    http://localhost:3000
```

Node 22.6+ kell. **Nincs függőség, nincs build, nincs telepítési lépés.**

A kiszolgáló a `OGDOC_SYNTHETIC=1` jelzés nélkül **el sem indul**, és megmondja,
miért. Ez nem formaság — lásd alább.

---

## Mi ÉLES, és mi nem

| | Állapot |
|---|---|
| Perzisztencia — titkosított, fájlba írt esetarchívum, túléli az újraindítást | **éles** (`core/store/`) |
| Jogosultság — szerepkör → ellátási kapcsolat → időablak | **éles** |
| Auditnapló — a napló ELŐBB íródik, mint ahogy az adat kimegy | **éles** |
| Esetenkénti elkülönítés — külön lánc, külön kulcs | **éles** |
| **Hitelesítés** — jelszó (scrypt), munkamenet-süti, fékezés | **éles** (`core/auth/`) |
| **Megbízás** — csoport × hatókör × időablak, a beosztásból | **éles** |
| Második tényező | **nincs** — EESZT/eduID/intézményi MFA kell hozzá |
| Titkosított kapcsolat (TLS) | **nincs** — fordított proxy kell elé |
| Kulcsőrzés | fejlesztői: fájlban, az adat mellett — helye HSM vagy KMS |

> **A HITELESÍTÉS MEGVAN — ÉS EBBŐL NEM KÖVETKEZIK, HOGY A KAPU FELESLEGES.**
>
> A cselekvőt már nem egy ellenőrizetlen kérésfejléc állítja. De a részleges
> megoldást teljesnek mondani ugyanaz a hiba, ami ellen az egész rendszer épül.
> A kapu ezért **feltétellista** lett (`core/auth/kapu.ts`), nem kapcsoló:
>
> ```
> GET /api/kapu     → hitelesítés · alapértelmezett jelszó · TLS ·
>                     második tényező · kulcstár
> ```
>
> A kiszolgáló akkor indul éles módban, ha **mind** teljesül; addig szintetikus
> módban fut, és induláskor kiírja, hol tart. A hiányzó feltételek közül **egy
> sem fejlesztői feladat** — tanúsítvány, MFA-eszköz és HSM kell hozzájuk.

### Első indítás

```
OGDOC_SYNTHETIC=1 npm run web      →  http://localhost:3000
belépés:  admin / admin
```

Az `admin:admin` a világ legismertebb hitelesítő adata. A rendszer ezért
**cserére jelöli**: a belépés után az első dolog a jelszócsere, addig más
végpont nem nyílik. A jelszószabály a NIST SP 800-63B-t követi — **hosszt kér,
nem összetettséget**: legalább 12 karakter, tiltólista, és nincs kötelező
időszakos csere.

A rendszergazda **leletet nem olvas**. Felhasználót és megbízást kezel; ha
klinikai hozzáférés kell neki, megbízást ad magának klinikusként — az látszik,
névvel, indokkal és időablakkal. A különbség nem a lehetőség, hanem a **nyom**.

---

## A jogosultsági réteg végigjátszható

Az admin panelen felhasználó és megbízás vehető fel. A megbízás **csoport ×
hatókör × időablak**, és a hatókör a hely-hierarchia
egy csomópontja: **lefelé öröklődik, felfelé soha.**

| Megbízás | Mit mutat be |
|---|---|
| Osztályos orvos @ szülőszoba | élő kapcsolat az ott fekvő beteggel — olvas és ír |
| Ápoló @ szülőszoba, **műszakra** | rögzít, de nem exportál; a műszak vége a jog vége |
| Osztályos orvos @ **nőgyógyászat** | klinikus, de más osztályon — a diploma nem ad jogot |
| **Lejárt** megbízás | a szerepkör megvolt, a jog nincs — és a rendszer ezt mondja ki, nem „szerepkörhiányt” |
| Auditor @ klinika | az **auditnaplót** olvassa, leletet nem |
| DPO @ klinika | **törlést rendelhet el** és auditnaplót olvas — leletet nem |
| Rendszergazda @ klinika | felhasználót és megbízást kezel — **leletet nem** |

Mindegyik eltérés látható eredményt ad, és mindegyik elutasítás **indoklással**
érkezik — nem hibakóddal.

### Amit a megbízásmodell nem enged

| Kísérlet | Mi történik |
|---|---|
| Ápoló megbízása **klinika** szintre | elutasítva: a csoport osztály/alosztály/szoba szintre adható |
| Műszakos megbízás **vég nélkül** | elutasítva: *„a műszaknak van vége, a jognak vele”* |
| Megbízás **adományozó nélkül** | elutasítva: az eredet visszakereshetetlen lenne |
| Megbízás **törlése** | nincs ilyen: a visszavonás LEZÁRJA, mert az auditnapló rá hivatkozik |

### Amit a hitelesítés a naplóba ír

A hitelesítési réteg a tároló **előtt** utasít el (lejárt megbízás, ismeretlen
munkamenet, zárolt fiók). Ha ez a réteg nem naplózna, ezek az események
nyomtalanul eltűnnének — pedig épp ezeket kell egy auditornak látnia. Ezért
minden ilyen elutasítás ugyanabba az auditnaplóba kerül, `denied` művelettel és
`hitelesítési réteg` jogalappal.

---

## Végpontok

| Útvonal | Cselekvő kell? | Mit ad |
|---|---|---|
| `GET /api/formspec` | nem | a generált űrlapleírás — séma, nem betegadat |
| `GET /api/i18n` | nem | a szótár és a nyelvi lefedettség |
| `GET /api/doc/:id` | nem | egy mező dokumentációja |
| `GET /api/actors` | nem | a bemutató cselekvők és a figyelmeztetés |
| `GET /api/archive` | **nem** | az archívum épsége — a REJTJELEZETT alakon, kulcs nélkül |
| `GET /api/case` | igen | az eset — olvasási joggal |
| `POST /api/value` | igen | egy érték rögzítése |
| `GET /api/audit` | igen, **auditor vagy DPO** | az auditnapló |
| `POST /api/torles/elonezet` | igen, **DPO** | mi történne — semmit nem változtat |
| `GET /api/torles/visszavonas` | igen | a kutatási visszavonás kétágú hatása |
| `POST /api/torles` | igen, **DPO** | a törlés végrehajtása |

**A kudarc megnevezett marad**, mert a teendő mindháromnál más:

| | HTTP | Mi a teendő |
|---|---|---|
| `denied` | 403 | jogosultsági kérdés — emberi döntés kell hozzá |
| `corrupt` | 409 | a lánc sérült — mentésből kell visszaállítani |
| `unreadable` | 410 | a kulcs megsemmisült — a törlés így néz ki |

Az **érvényességi** elutasítás (tartományon kívüli érték, levezetett mezőre
írás) ezzel szemben **200-as**: a felületnek üzenetet kell mutatnia, nem
hibaoldalt. A kettő összemosása azért rossz, mert az egyikhez engedély kell, a
másikhoz egy javított szám.

---

## Fájlok

| Fájl | Mi ez | Sorsa a végleges stackben |
|---|---|---|
| `api.ts` | szállítás-független nézetépítés | **változatlanul átmegy** |
| `tarolo-api.ts` | a tároló és a webes réteg összekötése | **változatlanul átmegy** |
| `auth-api.ts` | bejelentkezés, jelszócsere, admin panel | süti-alapú munkamenet |
| `kulcsok.ts` | fejlesztői kulcstár és naplónyelő | **cserélendő** HSM/KMS-re |
| `server.ts` | Node-`http` kiszolgáló | eldobandó |
| `public/app.js` | generikus renderer — **egyetlen mezőnevet sem ismer** | React-komponensre cserélendő |
| `public/style.css` | világos és sötét téma | tervrendszerre cserélendő |

## Exportcsomag

`npm run csomag` — a teljes forrástár egyetlen zip-ben, jegyzékkel (fájlonként
sha256) és a kihagyások indoklásával. Az alapértelmezés a bevétel; a
verziótörténet és a beszerzett elsődleges források is bekerülnek. Két dolog
marad ki: a SNOMED CT GPS származtatott táblája, mert a licenc (CC BY-ND 4.0)
tiltja a terjesztését, és maga a készülő csomag, hogy ne csomagolja be önmagát.
A jegyzék a korábban kihagyott, most VISSZATETT állományokat is felsorolja az
eredeti kihagyási indokukkal.

## Adatkönyvtár

`OGDOC_DATA` (alapértelmezés: `ogdoc/.adat/`) — titkosított esetarchívum,
kulcsok és naplók. A `.gitignore` kizárja; **soha nem kerülhet a repóba**, akkor
sem, ha szintetikus.

Részletek: [`../docs/fejlesztes/40-web-tarolo.md`](../docs/fejlesztes/40-web-tarolo.md) ·
a DPO törlési felülete: [`../docs/fejlesztes/41-torles.md`](../docs/fejlesztes/41-torles.md)
