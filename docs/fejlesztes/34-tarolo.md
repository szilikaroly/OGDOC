# 34 — A tároló: perzisztencia, jogosultság, auditnapló

*A `13-18-lepes.md` **1. lépése**, megvalósítva. Ez volt a terv egyetlen
megnevezett blokkolója: amíg nincs kész, a rendszer valódi betegadaton nem
futhat.*

```
npm run demo:tarolo      # a réteg működés közben, hét szakaszban
```

---

## 0. Mi készült el, és mi nem

A lépés fele már megvolt, csak nem volt összekötve. A napló, a titkosítás és
a kétféle log külön-külön tesztelt rétegként állt a `core/` alatt, jogosultsági
réteg viszont **sehol nem volt**.

| Réteg | Állapot a lépés előtt | Most |
|---|---|---|
| `core/journal/` | kész, 26 teszt | bekötve |
| `core/crypto/` | kész, 21 teszt | bekötve |
| `core/log/` | kész, 11 teszt | bekötve |
| **jogosultság** | **nem létezett** | `core/store/hozzaferes.ts` |
| **tartós archívum** | csak memória | `core/store/fajl.ts` |
| **a kapu, ami összeköti** | — | `core/store/biztonsagos.ts` |

Amit ez a réteg **nem** old meg, és nem is ide való: a **hitelesítés**. A „ki
vagy te” kérdést a gazda válaszolja meg (kártya, SSO, EESZT); ez a réteg a
**már azonosított** cselekvőről dönt. A kettő összekeverésétől lesz egy
hitelesítési hibából csendben jogosultsági hiba.

---

## 1. A négy elfogadási kritérium, tesztként

A terv négy eldönthető állítást írt elő. Mind a négy `test/tarolo.test.ts`-ben áll.

| Kritérium | Teszt |
|---|---|
| a mentés túléli az újraindítást | új `SecureCaseStore` példány, új nyelő, ugyanaz a könyvtár → ugyanaz a 3 → 5 cm |
| minden olvasás és írás naplózódik ki-mit-mikor bontásban | `actor` · `action` · `at` · `basis` mind a négy kitöltve, változóazonosítókkal |
| a napló maga nem módosítható | hézag, átrendezés, elvágás és tartalomváltozás mind megnevezett hibát ad |
| **jogosultság nélküli olvasás nem ad adatot, hanem hibát** | `denied`, `state` mező nélkül, és az elutasítás maga is auditsor |

---

## 2. A jogosultság három rétege

**A hiányzó jogosultság sehol nem „igen”.** Ugyanaz a szabály, mint a hiányzó
adatnál — és ugyanabból az okból: az alapértelmezett engedélyezés csendben
terjed, egy elfelejtett szerepkör-hozzárendelés évekig nyitva hagy egy ajtót.

| Réteg | Mit dönt el | Mi lenne nélküle |
|---|---|---|
| **szerepkör** | mit tehet egyáltalán | az auditor leletet olvasna, a kutató egyedi esetet látna |
| **ellátási kapcsolat** | **melyik** esethez | minden klinikus minden beteget olvashatna — és a valódi rendszerekben pontosan ez történik |
| **időablak** | meddig | a két éve elbocsátott beteg lapja örökre nyitva maradna |

A középső a legtöbbet kihagyott réteg, és a legdrágább. **A jogot az ellátás
ténye adja, nem a diploma.**

A harmadik az, amit a `CareRelation.until` kényszerít ki. A mező **nem
elhagyható**: `null` a kimondott „nyitott ellátás”, nem a feledékenység. Ez a
különbség a soha le nem járó jelszó és a tudatosan hosszú lejárat között.

A lezárt kapcsolat **külön üzenetet** kap, mert más a teendő: aki sosem
látta a beteget, vegyen fel kapcsolatot; aki két éve látta, kérjen új
beutalást vagy jelentsen be sürgősségi hozzáférést.

---

## 3. Sürgősségi hozzáférés — mert a tiltás is öl

Egy eszméletlen beteget hozó ügyeletesnek nincs előzetes ellátási kapcsolata,
és nem várhat rá. A rendszer ezért **engedi**, három feltétellel:

1. **indoklás**, a hozzáférés pillanatában;
2. a hozzáférés **megjelölve** kerül az auditnaplóba;
3. **valakinek utólag meg kell néznie**, névvel és határidővel.

A harmadik az, amit a legtöbb rendszer kihagy — és e nélkül a sürgősségi
hozzáférés nem kapu, hanem **nyitva hagyott ajtó**: két hét alatt mindenki
megtanulja, hogy ezzel bármit el lehet érni.

A `pendingReviews()` az **auditnaplóból** számol, nem külön nyilvántartásból:
két lista két igazság lenne, és a második mindig az elhanyagoltabb. A lejárt
tétel **nem tűnik el** a listáról — a határidőn túli felülvizsgálat nem
„elévült”, hanem **elmaradt**, és az elmaradás maga a megállapítás.

---

## 4. Két lánc, mert két dolgot bizonyítanak

Ez a lépés hozott felszínre egy **eltérést a terv és a kód között**. A
`31-elo-mentes.md` és a `32-titkositas.md` azt ígéri, hogy a lenyomatlánc a
**rejtjelezett** alakon fut, hogy az épség kulcs nélkül ellenőrizhető legyen.
A `core/journal/hashEntry()` viszont a **nyílt** bejegyzést hasheli — és jól
teszi, mert az bizonyítja a tartalmat.

A kettő nem egymás helyettesítője, ezért most **mindkettő** megvan:

| Lánc | Mit bizonyít | Kell hozzá kulcs |
|---|---|---|
| nyílt (`hash`, `prevHash`) | a **tartalom** nem változott | igen — felnyitás után |
| rejtjelezett (`sealedHash`) | az **archívum** nem változott | **nem** |

A második az, amire az üzemeltetőnek, a mentésellenőrzőnek és az éves
épség-ellenőrzésnek szüksége van, és akiknek a lelethez **nincs** joguk. A
`verifyArchive()` ezért nem is kér olvasási jogot, és nem ad vissza semmit a
tartalomból.

### Amit a rejtjelezett lánc NEM ad meg

**A `sealedHash` nem kulccsal hitelesített.** Aki írni tud az archívumba,
újra is tudja számolni. A lánc tehát a **romlást** és a naiv hamisítást fogja
meg, a felkészült támadót nem — az ellen az **AEAD-címke** véd, amihez
viszont kulcs kell.

Ezt a korlátot kimondani fontosabb, mint elhallgatni: lánc nélkül a törölt
bejegyzés maradna észrevétlen, címke nélkül a meghamisított tartalom. A
`test/tarolo.test.ts` mindkét irányt bizonyítja, az újraszámolt láncot is.

---

## 5. Négy szabály, amit a kapu kikényszerít

**1. Jogosultság nélkül nincs adat.** Az elutasítás **nem üres eredmény**,
hanem megnevezett hiba. Ez a legdrágább összekeverés ebben a rétegben: az
üres eredményre a hívó ráépít egy döntést („nincs adat, tehát nem volt”), a
hibára nem.

**2. Az auditálhatatlan olvasás meg nem történt olvasás.** Ha az auditnapló
írása elbukik, a **művelet** bukik el, és adat nem megy ki. Az audit ezért
az adat kiolvasása **előtt** íródik.

**3. Sérült láncra nem írunk.** A hibás előzményre fűzött bejegyzés a
sérülést **hitelesítené** — onnantól a romlás ugyanolyan „ép” láncnak
látszana, mint a valódi. A lánc ellenőrzése ezért az írás **előfeltétele**.

**4. A kudarc megnevezett.** Három ok, három teendő:

| | Mit jelent | Mi a teendő |
|---|---|---|
| `denied` | jogosultsági kérdés | emberi döntés |
| `corrupt` | a lánc sérült | mentésből visszaállítani |
| `unreadable` | a titkosítás nem nyílt fel | kulcskezelési vagy törlési ügy |

---

## 6. A tartós írás két `fsync`-je

A `FileArchive` **hozzáfűző**, soronként egy bejegyzés (JSONL). Nem
JSON-tömb: a tömböt minden mentésnél újra kellene írni, és egy félbeszakadt
újraírás az **egész** esetet viszi. Hozzáfűzésnél a legrosszabb eset egy
csonka utolsó sor — az felismerhető, és a lánc pontosan meg is mondja, hol
ér véget.

**A csonka utolsó sor félbeszakadt írás**: a bejegyzés nem lett tartós,
tehát nem is történt meg. Csonka sor **bárhol máshol** viszont sérülés, és
azt a réteg nem hallgatja el.

A második `fsync`-et mindenki kihagyja: a fájlra hívott `fsync` a
**tartalmat** teszi tartóssá, de egy **új** fájlnál a könyvtárbejegyzés is
friss — és ha az nem íródott ki, áramszünet után a tartalom megvan, csak épp
**nincs neve**. Ezért mondhatja ez az osztály a `"local"` tartósságot; a
`MemoryArchive` viszont `"buffered"`-et mond, mert pufferben álló
bejegyzésre „mentve”-t írni nem optimalizálás, hanem hazugság.

Az esetazonosító **engedélyező listán** megy át, nem tiltólistán: egy `../`
az azonosítóban a tárolókönyvtárból kivezető írás lenne, és ismeretlen
karakter nem csúszhat át azon, amire nem gondoltunk.

---

## 7. Ami ezután jön

- **A kulcstár tartóssága nem ezé a rétegé.** A `KeyStore` szerződés megvan;
  mögé HSM vagy KMS kell. Ha a kulcstárat ugyanez a réteg tartaná, a
  titkosítás az adat mellett feküdne — vagyis nem védene semmit.
- **A `web/` csontváz még nem ezt használja.** Az továbbra is memóriában
  tárol, hitelesítés nélkül, és a fejlécében ki is mondja: valódi
  betegadattal nem futtatható. A bekötés külön lépés, mert hitelesítést
  igényel.
- **A megőrzési idők** (`10.` lépés) `secondary` szinten állnak — az
  auditnapló megőrzési ideje a DPO döntése, és a réteg ezt nem találja ki
  helyette.
- **A `sealedHash` kulccsal hitelesítése** (HMAC) megfontolandó, ha az
  archívum írható marad annak, aki a leletet nem olvashatja. Ma nem ez a
  helyzet, és a korlát ki van mondva — de a döntést le kell írni, mielőtt
  valaki a láncot bizonyítéknak veszi.
