# 50 — A kutatásetikai beadvány dossziéja

*A 11. lépés gépi fele. Nem a kérelmet írja meg — megakadályozza, hogy olyat
állítson, ami nem igaz.*

---

## Mit tehet a gép egy olyan lépésnél, ami nem fejlesztési feladat

A 11. lépés így szól: *„A kutatási felhasználás engedélyeztetése. Kész, ha a
kérelem beadva."* A kérelmet a kutatásvezető adja be; kódot írni hozzá nem
lehet.

Egy dolgot mégis muszáj:

> **A beadvány minden tétele állítás egy bizottságnak.**

Az „adatbiztonsági leírás" nem egy melléklet neve, hanem az a **mondat**, hogy
az adathoz csak jogosult fér hozzá. Ha ezt kimondjuk, miközben a cselekvő
kilétét egyetlen ellenőrizetlen kérésfejléc állítja, akkor a kérelem **valótlan
állítást** tartalmaz — és ez nem hiányos beadvány, hanem más műfaj.

**Egy hiányzó melléklet pótolható. Egy valótlan állítás a bizottság előtt nem
az.**

---

## Amit ez a lépés talált

### A dosszié próza volt, és a próza nem tud hangosan elavulni

A `docs/megfeleles/10-ett.md` felsorolja a tizenegy dossziététételt és a „hol
készül" hivatkozásokat. Ez a tábla **ugyanúgy nézett ki** aznap, amikor a
hitelesítési rétegek még sehol nem voltak, és ugyanúgy fog kinézni azon a
napon, amikor minden aláírás megvan. Semmi nem kötötte a rendszer **mostani**
állapotához.

Ez ugyanaz a hiba, amit a 7., a 8., a 9. és a 10. lépés is megtalált — csak itt
a következménye nem téves szám, hanem **téves nyilatkozat egy hatóságnak**.

### A megoldás ugyanaz: élő bizonyíték, nem fájlnév

Minden tétel mellett most **lekérdezés** áll, nem hivatkozás: hány döntést
írtak alá, hány megőrzési időt, van-e hitelesítés, hány mérőeszköz
tételszövege licencelt. A tétel három állapotot vehet fel, és a harmadik a
lényeg:

| Állapot | Mit jelent |
|---|---|
| **fedett** | az állítás mögött ott a rendszerállapot |
| **részben fedett** | a bizonyítékok egy része megvan |
| **megalapozatlan** | az állítás így, ahogy van, **nem igaz** |

### A hitelesítés bizonyítéka a kódból jön

A `hitelesitesAllapota()` nem egy jelölést olvas, hanem a `web/session.ts`
forrását. Ha a **szintetikus kapu** (`OGDOC_SYNTHETIC=1`) ott áll, akkor a
rendszer maga mondja ki, hogy valódi betegadaton nem futhat — és ez a
bizonyíték arra, hogy a hitelesítés **hiányzik**.

Ez a rendszer legőszintébb pontja, és most a beadvány mérlegében is szerepel.

---

## A mai kép

```
14 tétel: 3 fedett · 1 részben · 6 megalapozatlan · 4 szervezeti
A KÉRELEM ÍGY NEM ADHATÓ BE.
```

A legfontosabb sor az **adatbiztonsági leírás** (`ett.t8`), és nem azért, mert
rossz — hanem mert **részben igaz**:

| Bizonyíték | Állapot |
|---|---|
| jogosultság (szerepkör · ellátási kapcsolat · időablak) | ☑ |
| auditnapló (hasítólánc, kulcs nélkül ellenőrizhető) | ☑ |
| titkosítás (boríték) | ☑ |
| PHI-jelölt változók kizárása az exportból | ☑ |
| **a cselekvő kilétének ellenőrzése** | **☐** |

*A jogosultsági réteg hibátlanul működik — csak épp arról dönt, akinek a kérés
mondja magát.* Ezt a mondatot a kérelemnek is így kell tartalmaznia.

A többi megalapozatlan tétel mind egy-egy másik lépésre mutat: a 38 adatkezelési
döntés aláírása (3. lépés), a 14 megőrzési idő (10.), a mérőeszközök licencelése
(12.), és az elemzési terv gépi rögzítése.

---

## Amiről a gép nem nyilatkozik

Négy tétel **szervezeti**: befogadó nyilatkozat, kompetenciaigazolás,
finanszírozás, biztosítás. A rendszer ezekről nem tud és nem is akar
nyilatkozni.

De a **„szervezeti" nem felmentés, hanem címzés**: a lista számon tartja őket,
mert a beadvány nélkülük sem teljes, és a gép megnevezi, **ki válaszol**. Ha
valaki gépi bizonyítékot akaszt egy szervezeti tételre, az figyelmeztetés: vagy
nem szervezeti, vagy a bizonyíték téves.

---

## Két csendes hiba, amit a validálás nem enged

**Rendszertétel bizonyíték nélkül** — építési hiba. Ez a dosszié
legveszélyesebb alakja: egy állítás, amit semmi nem fedez, és **semmi nem venné
észre, ha valótlanná válik**.

**Nem hivatkozott bizonyíték** — figyelmeztetés. Ha egy élő mérőszámra egyetlen
tétel sem hivatkozik, akkor vagy hiányzik egy tétel, vagy a bizonyíték
fölösleges; mindkettő azt jelenti, hogy a dosszié nem teljes.

---

## A sorrend, ami ebből következik

A beadvány nem attól lesz beadható, hogy megírjuk. Attól, hogy az **állításai
igazzá válnak** — és a legtöbbjük nem fejlesztési feladat:

| Ami hiányzik | Kié | Lépés |
|---|---|---|
| A 38 adatkezelési döntés aláírása | klinikai vezető + DPO + fejlesztés | 3. |
| A 14 megőrzési idő aláírása | jogász | 10. |
| A mérőeszközök licencelése | kutatásvezető | 12. |
| Az elemzési terv gépi rögzítése | kutatásvezető | 11. |
| **A hitelesítés (ki vagy te?)** | fejlesztés | **1.** |
| A kulcstár HSM/KMS mögé | üzemeltetés | 1. |

A teszt, ami ezt bizonyítja, eljátssza azt a napot, amikor **minden aláírás
megvan** — és a kérelem **még akkor sem adható be**, mert a hitelesítés és az
elemzési terv hiányzik. Az aláírások önmagukban nem elegendők.

---

## Futtatás

```
npm run ett         # a beadvány állapotlapja a kutatásvezetőnek
npm run validate    # a megalapozatlan állítások megnevezve
node --test test/ett.test.ts   # 17 teszt
```

## Fájlok

| | |
|---|---|
| `registry/ett/dosszie.json` | a 14 tétel: cím, **állítás**, bizonyítékkulcsok |
| `core/ett/dosszie.ts` | a bizonyítékok, a megítélés és a beadhatósági kapu |
| `core/ett/allapot.ts` | a rendszer mostani állapota — egy helyen, egyszer |
| `tools/gen-ett.ts` | az állapotlap (`npm run ett`) |
| `test/ett.test.ts` | 17 teszt |
