# 43 — Kilenc kalkulátor, egy R-csomag, és a harmadik licenceset

*Amiből képlet lesz, amiből hivatkozás, és amiből egyelőre semmi.*

Kilenc kalkulátor-URL és egy feltöltött R-csomag. A kérés egyszerű volt —
*„adjuk hozzá ezeket a kalkulátorokat is”* —, az eredmény viszont három
egészen különböző dolog, és a rendszer szempontjából a különbség a lényeg.

---

## Mi lett belőlük

| | Tétel | Állapot |
|---|---|---|
| **Megvan, teljes egészében** | `PRBPERIsk 0.1.0` (feltöltött R-csomag) | `beszerzett` — de **GPLv2** |
| **Megvan, de csak állításként** | AOG 2023 külső validálás · BJOG 2022 POUR | `beszerzett` (PubMed-metaadat) |
| **Nem volt elérhető** | 7 további URL | `nem-beszerzett` — egress-blokk |

**Hét URL-t nem sikerült megnyitni.** A `medcentral.com`, a
`journals.lww.com`, a `tarcalab.med.wayne.edu:3838`, az `europepmc.org`, a
`vterpt.nottingham.ac.uk`, a `sciencerepository.org` és az `obgyntools.com`
mind a futtatókörnyezet egress-proxyján akadt el (HTTP 000, illetve 403).
Ezekről csak a cím van meg, és minden tétel `cimForrasa` mezője ezt ki is
mondja.

Kettőt viszont **megszereztünk más úton**: a PubMed a két közlemény
absztraktját adta (PMID 37290103 és 35596931). A kettő nem egyenrangú a
kalkulátorokkal — nem képletet adnak, hanem állítást a képletekről.

---

## A tétel, ami ELVESZ egy kalkulátort

A katalógus legfontosabb sora nem ad hozzá semmit. **Shao és mtsai** két
publikált, „validált” szülésindítási császármetszés-kalkulátort futtattak
végig egy külső populáción, 846 betegen:

> Mindkét kalkulátor **gyengén teljesített** (AUC ≤ 0,57 — alig jobb az
> érmefeldobásnál), és mindkettő **felülbecsülte** a kockázatot a magasabb
> rizikójú harmadokban. A szerzők a széles körű bevezetés ellen intenek
> populáció-specifikus újrahangolás nélkül.

Ez a rendszer `calc.verified` kapujának a legerősebb külső alátámasztása.
Nem elméleti óvatosság: a felülbecsült császármetszés-kockázat **lebeszélheti
a beteget a hüvelyi szülésről** — a kalkulátor tehát nem semleges, ha téved.

Ezért kapott a katalógus egy harmadik tételfajtát:

```
protokoll · kalkulator · bizonyitek
```

A `bizonyitek` sosem „átvehető” — nincs mit átvenni belőle —, viszont
**hivatkozható**, ha megvan. A kettő összemosása azért rossz, mert az
egyikhez engedély kell, a másikhoz forrásmegjelölés.

---

## A harmadik licenceset — és ami belőle következett

A licenckérdést eddig két állapotnak néztük: **ismeretlen** (tilos) vagy
**ismert** (szabad). A PRBPERIsk mutatta meg, hogy van harmadik.

A csomag licence **GPLv2** — tehát ismert. A GPL a **használatot** nem
korlátozza. A **terjesztést** viszont igen: származtatott mű csak
GPLv2-kompatibilis feltételekkel adható tovább.

| | Licenc | Mi következik |
|---|---|---|
| SNOMED CT GPS | CC BY-ND 4.0 | az átalakított mű terjesztése **tilos** |
| BCNatal | ismeretlen | **semmi nem indulhat el** |
| **PRBPERIsk** | **GPLv2** | **ütközik a mi licencünkkel** |

### Az OGDOC licence: MIT

2026-09-05-én eldőlt: a repó gyökerében ott a `LICENSE`, a `package.json`-ban
a `"license": "MIT"`, és a kód **onnan olvassa** — nem konstansból, mert egy
második helyre írt licenc az a hely, ami elavul.

Ezzel viszont a PRB-modell átvétele **nem lett szabad, hanem tiltottá vált** —
és ezt ki kell mondani, mert a szóhasználat elmossa:

> Az MIT és a GPLv2 „kompatibilis" **abban az irányban**, hogy MIT-kódot be
> lehet vinni egy GPL-műbe. **Visszafelé nem.** Egy GPLv2 műből származtatott
> művet nem lehet MIT alatt továbbadni — a GPL épp azt követeli meg, hogy a
> származék is GPL maradjon.

Aki tehát MIT-et választ **és** a GPL-modell átvételét kéri, két olyan dolgot
kér, amelyek együtt nem teljesíthetők. Az `atveheto()` ezt ma így mondja ki:

```
LICENCÜTKÖZÉS — a projekt licence MIT (megengedő), a forrásé GPL-2.0
(copyleft): a TERJESZTÉS irányában ez a kettő nem egyeztethető össze.
```

*(Ez mérnöki olvasat, nem jogi tanács. A végleges besorolás jogászé.)*

---

## A harmadik út: a modell ADAT, nem kód

A licencütközés a **terjesztést** tiltja, a **használatot** nem. Ebből
következik a megoldás, ami nem trükk, hanem a rendszer alapszabálya —
ugyanaz, amiért a szabályok és a normogramok is a regiszterben laknak:

```
                MIT-mű (terjesztjük)          helyi (soha nem terjed)
   ┌──────────────────────────────┐   ┌──────────────────────────────┐
   │  core/kulso/modell.ts        │   │  registry/kulso/helyi/prb-pe │
   │  · általános kiértékelő      │◀──│  · MODELL.json (leképezés)   │
   │  · EGYETLEN modellt sem      │   │  · 4 együtthatómátrix        │
   │    ismer                     │   │  · prior-együtthatók         │
   └──────────────────────────────┘   └──────────────────────────────┘
```

A mag beolvas egy együtthatómátrixot, felépíti a lineáris prediktort — az
`a:b` alakú tag szorzat —, és megmondja, mi hiányzik. Sem „PLGF", sem
„Interval1", sem egyetlen szám nincs benne; **teszt őrzi, hogy ne is legyen**:

```
test("a mag egyetlen külső modell nevét sem ismeri")
```

A telepítés a felhasználó gépén, egy paranccsal:

```
python3 tools/ingest/prb-pe.py PRBPERIsk_0.1.0.tar.gz
```

Az ingest-szkript maga sem tartalmaz együtthatót: **kiolvassa** őket a csomag
saját forrásából. (Az első változatában be voltak égetve — ez pontosan az a
szivárgás, ami ellen a szabály véd, és a szabály fogta meg.)

### Három kapu, és a modell mindháromnál megnevezi magát

| Kapu | Mit tesz |
|---|---|
| **nincs telepítve** | a mag nem tesz úgy, mintha lenne modell — a terjesztett műben ez az alapértelmezés |
| **hiányzó bemenet** | a hiányzó érték **soha nem nulla**: a nullával számolt tag azt állítaná, hogy a beteg értéke épp a referenciaátlag |
| **hitelesítetlen** | `verification: assumed` → **teljes bemenettel sem ad számot** |

A harmadik a lényeg: a gépezet ma **kész és működik**, és mégsem ad
eredményt. A PRB-modellt senki nem vetette össze a közleménnyel, és magyar
populáción nincs kalibrálva — **egyetlen névvel igazolt összevetés nyitja ki.**

És van egy negyedik, csendesebb kapu is: a tartományon kívüli
gesztációs korra a modell nem extrapolál. *„Ott nem tanult semmit.”*

### Két őr a szivárgás ellen

A szivárgás nem támadás, hanem egy `git add .`:

- `validateKulsoTerjesztes()` — **build-hiba**, ha copyleft származék a
  terjesztett fába kerül;
- az exportcsomag `TILTAS` listája — a csomagoló alapértelmezése a **bevétel**,
  tehát e bejegyzés nélkül kicsomagolta volna a GPLv2 származékot.

### Mi oldaná fel igazán

| Út | Mit kíván | Mit ad |
|---|---|---|
| **A szerzők engedélye** | egy levél Tarca és Bhatti felé (Wayne State / PRB) | a modell bekerülhet a terjesztett műbe |
| **Újraépítés a közleményből** | a közlemény beszerzése (ma egress-blokk) | tiszta eredet, a csomag érintése nélkül |
| **Helyi telepítés** | semmit — **ez ma működik** | a modell fut, de csak azon a gépen |

---

## Amit a katalógus a rendszerről mondott

A `mihezKotodik` kötéseket a validálás ellenőrzi, és a kötések három **saját
hiányt** hoztak felszínre:

| Tétel | Hiány nálunk |
|---|---|
| PRB PE-modell | a **szolubilis endoglin (sEng)** változó nincs a regiszterben — a modell negyedik biomarkere |
| POUR-kalkulátor | **nincs urogynekológiai változócsoport**: se prolapsus-stádium, se uroflowmetria |
| VTE-RPT (Nottingham) | VTE-kockázati **tényezőket** sorolunk, **szintet** nem — ugyanaz a rés, mint a CMQCC vérzési táblánál |

Ez a katalógus mai haszna: nem kalkulátort ad, hanem **megnevezi, mi hiányzik
ahhoz, hogy egyáltalán befogadhassunk egyet.**

---

## Fájlok és számok

| Fájl | Mi ez |
|---|---|
| `registry/kulso/kalkulatorok.json` | 10 tétel — **átvett képletet nem tartalmaz** |
| `core/kulso/protokoll.ts` | a copyleft-kapu, a `bizonyitek` fajta, a tételszintű licenc és beszerzés |
| `core/kulso/modell.ts` | az általános kiértékelő — **egyetlen modellt sem ismer** |
| `tools/ingest/prb-pe.py` | a GPLv2 együtthatók kinyerése a **helyi** könyvtárba |
| `LICENSE` · `package.json` | **MIT**, és a harmadik felek anyagainak elszámolása |
| `test/kulso.test.ts` · `test/kulso-modell.test.ts` | 27 + 9 teszt |

A `npm run validate` záró sora:
`2 külső forrás (34 tétel, ebből 0 átvéve, 1 hivatkozható)`.

**Nulla átvétel — és ez ma a helyes szám.**

---

## A döntés megszületett — és két feladatot hagyott

> **Az OGDOC licence: MIT.**

Ebből az következik, hogy a PRB-modell a terjesztett műbe **nem kerül be**, a
helyi telepítés viszont **ma is működik**. Két dolog maradt nyitva, és
egyik sem fejlesztési kérdés:

1. **A hitelesítés.** A gépezet kész; a modell azért nem ad számot, mert
   senki nem vetette össze a közleménnyel. Ez egy név és egy aláírás.
2. **A levél.** Ha a modell a terjesztett rendszerben is kellene, a szerzők
   engedélye az egyetlen tiszta út. Egy e-mail.
