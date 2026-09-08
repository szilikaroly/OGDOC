# Hol van mi

*A repó felépítése, a kiadás helye, és mi hova települ — mert egy fél év múlva
feltett „hol van a csomag?” kérdésre a válasznak a repóban kell lennie.*

---

## A repók

| | |
|---|---|
| **GitHub-repó** | `szilikaroly/anamnezis-asszisztens` |
| **Fejlesztési ág** | `claude/inditsunk-uj-project-2kl92m` |
| **Az OGDOC helye** | az `ogdoc/` alkönyvtár |

**Az OGDOC-nak nincs önálló GitHub-repója.** A terv szerint lenne, de a
létrehozás az integráció számára nem engedélyezett (`403 Resource not
accessible by integration`) — ezért él alkönyvtárként.

**Ettől függetlenül önálló repóként is kész van.** A
`csomag/ogdoc-standalone.bundle` az `ogdoc/` alkönyvtárat tartalmazza saját
repóként, a teljes verziótörténettel (`git subtree split`), `main` ágon.

```bash
git clone csomag/ogdoc-standalone.bundle ogdoc
cd ogdoc
git remote set-url origin https://github.com/szilikaroly/ogdoc.git
git push -u origin main
```

**A klón működik, és ez le van mérve, nem állítás:** a bundle-ből klónozott
repóban `npm run check` → **0 hiba, 1818/1819 teszt**. A kihagyott teszt a
gitignore-olt országos védőnői jegyzéké — helyesen kihagyja magát, nem bukik el.

> **Az első változat rossz volt, és érdemes kimondani, miért.** A bundle HEAD-je
> a szülőrepó ágára mutatott, tehát a `git clone` **üres munkafával** végzett
> (`warning: remote HEAD refers to nonexistent ref`). A parancs le volt írva, de
> nem volt lefuttatva — pontosan az a hiba, ami ellen az egész rendszer épül.

---

## A kiadás

A repó gyökerében, **nem** az `ogdoc/` alatt:

```
csomag/
  OLVASSEL.md                    a két tétel leírása, sha256-tal
  ogdoc-standalone.bundle        önálló repó, teljes történettel  (~31 MB)
  ogdoc-export-20260908.zip      böngészhető pillanatkép          (~34 MB)
```

**A kettő szándékosan nem duplikálja egymást.** A bundle viszi a történetet, a
zip a pillanatképet. Ha a zip is vinné a `.git`-et, ugyanaz a 40 MB kétszer
utazna — és a teljes történettel épített csomag ma már **104 MB** volna, mert a
korábbi csomag maga is a történet része lett.

Újraépítés:

```bash
cd ogdoc
npm run csomag -- --git-nelkul     # a pillanatkép
```

---

## A forrásfa

```
ogdoc/
  core/          a klinikai mag — tiszta függvények, DOM és adatbázis nélkül
  registry/      AZ IGAZSÁGFORRÁS: minden szabály, tábla és mező adatként
  test/          80 tesztfájl · 1819 teszt
  tools/         validátor, generátorok, beolvasók, csomagoló
  web/           a webes réteg a tárolón (kiszolgáló + felület)
  docs/          133 dokumentum, ebből 4 generált
    modulok/     mind a 37 modul kidolgozása
  forrasok/      beszerzett elsődleges források (törzsek, jogszabály, platform)
  modules/       modulsablon
```

### Ami NINCS a repóban, és nem is lehet

A `helyi/` nem könyvtárnév, hanem **állítás**: ami ott van, az helyben épül és
helyben marad. Négy ilyen fa van, mind gitignore-ban, mind indoklással a
csomagoló `HELYI_INDOK` listájában:

| Fa | Miért |
|---|---|
| `registry/kodok/helyi/` | SNOMED CT GPS — CC BY-ND 4.0, a származtatott mű terjesztése tiltott |
| `registry/kulso/helyi/` | PRBPERIsk — GPLv2, ütközik az MIT-tel |
| `registry/kepalkotas/helyi/` | ACR O-RADS táblák — © American College of Radiology |
| `registry/vedono/helyi/` | országos védőnői jegyzék — 7699 megnevezett személy |

Mind a négy **helyben újraépíthető**: a beolvasók (`tools/ingest/`) a repóban
vannak, csak a kimenetük nincs.

Egy **új** `helyi/` fa, amiről nincs bejegyzett indok, **megállítja a
csomagolást** — ugyanúgy, mint a betegadat-gyanús fájlnév.

---

## Futtatás

```bash
cd ogdoc
npm run check                    # validálás + 1819 teszt + generált doksik
OGDOC_SYNTHETIC=1 npm run web    # http://localhost:3000 — belépés: admin / admin
npm run artifact                 # a bemutató adata, a rendszerből
```

Node 22.6+ kell. **Nincs függőség, nincs build, nincs telepítési lépés.**

Az első belépés után a rendszer **azonnal jelszócserét kér**: az `admin:admin`
a világ legismertebb hitelesítő adata, és amíg érvényben van, a kapu hiányzó
feltételként mutatja.

---

## A bemutató

`https://claude.ai/code/artifact/70b76a0e-e39a-457f-8e12-c7b14dc40b1a`

A számai a rendszerből származnak (`npm run artifact`), nem kézzel írtak. A
feladat- és hiányjegyzék **kinyomtatható**, felelőssel és határidővel.
