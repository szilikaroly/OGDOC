# 44 — Gyermeknőgyógyászat: a modul, ami megfordít egy szabályt

*A nőgyógyászat almodulja — és nem „ugyanaz kisebb betegen”.*

Három dolog különbözik a felnőttellátástól, és mindhárom olyan, amit az
átvett minta **csendben** ront el.

---

## 1. A vizsgálat módja

Pubertás előtt a tükrös feltárás nem szűkebb indikációjú, hanem **nem
elfogadható rutin**: fájdalmas, sérülést okozhat, és elveszi a gyermek
bizalmát attól az ellátástól, amit később önként kellene keresnie. Ha
vaginális látótér kell, az **vaginoszkópia**, altatásban vagy szedálásban.

A rendszer ezért nem csak tilt, hanem **irányt is ad**:

```
vizsgalatiUt("prepubertas", "speculum")
  → elfogadhato: false
    helyette:    "vaginoscopy"
```

És **fail-closed az ismeretlen szakaszra is.** Ha nem tudjuk, hol tart a
gyermek, a tükrös feltárás nem kap zöld jelzést — *„a hiányzó adat itt nem
»felnőtt«”.*

A szakaszt egyébként nem az életkor dönti el egyedül: **a Tanner-stádium
erősebb jel.** Egy 9 éves lehet már B4, egy 13 éves még B1.

---

## 2. A beleegyezés és a titoktartás

Kiskorúnál a beleegyezés nem alakiság, hanem viszony. Négy külön mező, mert
négy külön kérdés:

| Mező | Mit rögzít |
|---|---|
| `pedgyn.consent.who` | ki egyezett bele, és milyen alapon |
| `pedgyn.minor.ownView` | **megkérdezték-e a kiskorút magát** |
| `pedgyn.confidentiality.discussed` | tudja-e a serdülő, mit **nem** tarthatunk titokban |
| `pedgyn.chaperone` | ki volt jelen — a `byRequest` külön érték |

A harmadik a legfontosabb, és a legkönnyebben elfelejtett. A serdülő attól
függően mond igazat a szexuális aktivitásáról, a fogamzásgátlásról vagy a
bántalmazásról, hogy **tudja-e, ki fogja megtudni.** A jelzési kötelezettség
határát tehát **előre** kell elmondani, nem utólag.

A `consent.who = "none"` piros zászló. Nem azt jelenti, hogy elfelejtettük
kitölteni: azt jelenti, hogy a vizsgálat **beleegyezés dokumentálása nélkül
történt.**

---

## 3. A megfordított szabály

A rendszer legtöbbet ismételt mondata: *a hiányzó adat sehol nem „nem”.* A
meg nem kérdezett kérdés máshol **hiány** — megnevezzük, és megyünk tovább.

**Itt egy helyen megfordul.**

```
pedgyn.safeguarding.asked = "notAsked"   → PIROS ZÁSZLÓ
```

A bántalmazás lehetőségének **mérlegelése** az egyetlen mező a rendszerben,
ahol a meg nem kérdezés önmagában hiba. Nem azért, mert bántalmazást
feltételezünk — hanem mert a gyermekvédelmi mulasztások túlnyomó része nem
téves ítélet, hanem **elmaradt kérdés**, és ezt visszamenőleg senki nem
pótolja.

Fontos, mit rögzít ez a mező, és mit nem:

> **`safeguarding.asked` nem a bántalmazás tényéről szól, hanem arról, hogy
> a kérdés felmerült-e.**

A rendszer **soha nem állapít meg bántalmazást, és nem is zárja ki.** Amit
tesz: rögzíti a mérlegelést, és megnevezi a következő lépést.

### Három súly, mert három különböző teendő

| Súly | Mit jelent |
|---|---|
| `piros` | most kell tenni valamit |
| `hianyzoMerlegeles` | egy kérdés nem hangzott el, és ez maga a hiba |
| `tisztazando` | a beteg elengedése **előtt** tisztázandó |

A `bizonytalan` gyanú ezért nem a `nem` gyengébb változata: **saját utat kap**
— gyermekvédelmi konzultáció az elengedés előtt, mert *„a jelzési
kötelezettség a gyanútól függ, nem a bizonyosságtól”.*

És a felismerés legerősebb egyetlen jelzője nem a sérülés fajtája, hanem az,
hogy **a történet illik-e hozzá** (`trauma.consistent`). Ehhez a
mechanizmust **szó szerint** kell rögzíteni: az „elesett” és a „nekiestem a
bicikli vázának” nem ugyanaz, és az összefoglalás értelmezés — utólag nem
visszabontható.

---

## Ami klinikailag a leggyakoribb, és amit a leggyakrabban elrontanak

| Lelet | Amit a rendszer mond |
|---|---|
| pubertás előtti genitális vérzés | **mindig kivizsgálandó** — idegentest, trauma, lichen sclerosus, korai pubertás, ritkán daganat; és a bántalmazás mérlegelése |
| bűzös vagy véres váladék | **idegentest** — vaginoszkópia mérlegelése, *nem* ismételt antibiotikum |
| iskolai hiányzást okozó dysmenorrhoea | a serdülőkori endometriosis diagnózisa átlagosan évekkel késik |
| primer amenorrhoea + ciklikus hasi fájdalom | haematocolpos: a hymen imperforatus egyszerű beavatkozás — felismerés nélkül évekig tartó „megmagyarázhatatlan” fájdalom |
| DSD gyanúja | a rendszer **visszafogja magát**: gyanút rögzít, konzíliumot javasol, besorolást nem ad |

Prepubertás korban a **meg nem kérdezett vérzés is zászlót kap** — serdülőnél
nem, mert ott nem kérdés.

---

## Pubertás időzítése: amit a modul NEM mond

A `pubertasIdozites()` négy választ adhat, és a negyedik a lényeg:

```
korai · kesoi · idoben · nemMegitelheto
```

**A rendszer nem sorol be „időben”-nek olyat, akiről nincs adata**, és
megmondja, mi hiányzik hozzá. Egy megnyugtató besorolás hiányzó adatból
rosszabb a besorolás hiányánál: a hiány látszik, a téves megnyugtatás nem.

A különbségtétel élesen tesztelt is:

| Bemenet | Ítélet |
|---|---|
| 14 éves, **megfigyelt B1** stádium | `kesoi` — ez **állítás** |
| 14 éves, thelarche-életkor **nincs kitöltve** | `nemMegitelheto` — ez **adathiány** |

A kettő összemosása pontosan az a hiba, ami ellen az egész modul épül. *(Az
első tesztváltozat maga is ezt a hibát követte el — a modul fogta meg.)*

---

## Fájlok és számok

| Fájl | Mi ez |
|---|---|
| `registry/variables/18-gyermeknogyogyaszat.json` | 23 változó |
| `core/gyermek/pedgyn.ts` | szakasz · vizsgálati út · zászlók · pubertás időzítése |
| `test/gyermeknogyogyaszat.test.ts` | 18 teszt |

---

## Ami nyitva marad

- **A jelzési út intézményi része.** A modul rögzíti, hogy a jelzés
  megtörtént-e; azt, hogy *kihez* és *milyen formában*, a helyi
  gyermekvédelmi protokoll dönti el — és ez intézményenként más.
- **Az életkorspecifikus referenciák.** A gyermekkori nőgyógyászati
  ultrahang normálértékei (méhhossz, ovariumtérfogat kor szerint) nincsenek
  betöltve; a normogram-katalógus ezt a területet nem fedi.
- **A validált serdülő-kérdőívek.** A modul ma egyetlen mérőeszközt sem
  használ — ugyanaz a licenckapu áll rájuk, mint a többi kérdőívre.
