# 32 — Titkosítás és kulcskezelés

*A `31-elo-mentes.md` 9. fejezetének kifejtése. Ott két bekezdés, itt a
szerkezet, a kód és a feszültség, amit nem lehet feloldani — csak eldönteni.*

---

## 0. Az egy mondat, és a benne rejlő csapda

> **Az adatot esetenkénti kulcs védi, a kulcsot a kulcskezelő, a
> kulcskezelőt a letét.**

És itt a csapda, amiről a legtöbb terv hallgat:

> **A kulcs mentése és a törlés követelménye EGYMÁSNAK FESZÜL.**
> Aki minden kulcsot letétbe helyez, **nem tud törölni**. Aki egyet sem,
> **nem tud helyreállítani.**

Ez nem megoldható feszültség, csak **eldönthető** — kulcsonként, kimondva. A
`KeyPolicy.escrowExcluded` ezért **kötelező mező akkor is, ha üres**: a
hallgatás itt nem semleges, hanem véletlen döntés.

---

## 1. A boríték: három szint, három élettartam

```
rekord  ──AES-256-GCM(DEK)──▶  titkosított bejegyzés
DEK     ──burkolva(KEK)─────▶  burkolt kulcs a bejegyzés mellett
KEK     ─────────────────────▶  HSM/KMS — nem másolható ki
```

| Kulcs | Hatóköre | Élettartama | Cseréje |
|---|---|---|---|
| **DEK** | egy eset | a napló élettartama | **nem cserélhető** (ld. 4.) |
| **KEK** | sok eset | 1 év | **olcsó**: csak a burkolt DEK-eket írjuk újra |
| **letét** | a KEK helyreállítása | intézményi | esemény-alapú |

### Miért esetenkénti adatkulcs?

**Nem a teljesítmény miatt** — a titkosítás mérve 14 mikroszekundum
rekordonként, ez soha nem szűk keresztmetszet. Hanem a **kriptográfiai
törlés** miatt: erről szól a 3. fejezet.

---

## 2. A kötés: amitől a rekord nem helyezhető át

Az AES-256-GCM nemcsak titkosít, hanem **hitelesít** is — és a hitelesítés
kiterjed a **nyílt** kötésre:

```ts
aad = { caseId, seq, prevHash, formatVersion }
```

Enélkül egy rejtjelezett bejegyzés **áthelyezhető** lenne: az „A" eset 7.
bejegyzését be lehetne illeszteni a „B" esetbe, és **hibátlanul
visszafejtődne**. A kötés ezt lehetetlenné teszi.

És a kötés maga sem átírható: a hitelesítő címke rá is kiterjed. Ha valaki a
rekordban is átírja a kötést, hogy egyezzen az elvárttal, a felnyitás
`tampered`-del bukik, nem `relocated`-del — a kettő különbsége megmondja,
**mi történt**.

### A bukás megnevezett, nem kivétel

| Eredmény | Mit jelent | Teendő |
|---|---|---|
| `wrongKey` | rossz kulcsot adtunk | **kulcskezelési hiba**, nem adatromlás |
| `tampered` | a rejtjelezett szöveg változott | a másolat nem hiteles |
| `relocated` | más esethez/sorszámhoz tartozik | naplók összefésülése történt |
| `destroyed` | a kulcs megsemmisült | **nem hiba** — a törlés működése |

A `destroyed` külön eset, és ez fontos: a rekord **léte és a törlés ténye
megmaradt**, csak a tartalma nem hozzáférhető. Egy egyszerű „nincs ilyen adat"
válasz semmit nem bizonyítana.

---

## 3. Kriptográfiai törlés: a válasz a megválaszolhatatlan kérdésre

> **Hogyan törlünk módosíthatatlan másolatból?**

A hidegtári szalagot nem lehet átírni. A beteg törlési kérelmét viszont
teljesíteni kell. A `31-elo-mentes.md` ezt a kötelezettséget nevesíti („a
törlés is replikálódik") — itt van rá a válasz:

**Ha az esethez saját adatkulcs tartozik, a KULCS megsemmisítése teszi az
adatot visszafejthetetlenné.** A szalagon marad, de senki nem tudja elolvasni.

### És a függvény nem mond igent, amíg egy másolat is él

```ts
cryptoErase(key, { actor, reason, copies: [
  { where: "elsődleges KMS",     destroyed: true  },
  { where: "földrajzi másolat",  destroyed: true  },
  { where: "letétkezelő #2",     destroyed: false },   // ← itt megáll
]})
```

> „A TÖRLÉS NEM TELJES: a kulcsról még 1 helyen van másolat. Amíg ezek élnek,
> az adat visszafejthető — a »töröltük« állítás ilyenkor valótlan, és éppen a
> megmaradt példány fogja megcáfolni."

**A kriptográfiai törlés pontosan annyit ér, amennyire biztosak vagyunk benne,
hogy nem maradt kulcsmásolat.** Egy „letöröltük" állítás a letétkezelőnél
maradt példányról nem tud — ezért kell a másolatok helyét **tételesen**
felsorolni, nem összefoglalóan állítani.

### A bizonyítás

Három dolog együtt bizonyítja, hogy a törlés megtörtént:

1. a napló **sírköve** (mi és miért) — `31-elo-mentes.md` 1.4;
2. a **kulcs-megsemmisítési** bejegyzés (mikor, ki, mely másolatok);
3. az adat **fizikai megléte** a másolatban, visszafejthetetlenül.

A harmadik a legkevésbé nyilvánvaló: **az adat hiánya önmagában nem
bizonyítana semmit** — a hiány lehet adatvesztés is. A visszafejthetetlen, de
meglévő rekord viszont bizonyítja, hogy szándékos törlés történt.

---

## 4. A lánc ára: az újratitkosítás tilalma

A `31-elo-mentes.md` döntése, hogy **a lenyomatlánc a rejtjelezett alakon
fut**. Ennek az az ára van, hogy **az újratitkosítás elszakítja a láncot**.

> **Pontosítás a megvalósításból (`34-tarolo.md`).** Kiderült, hogy ehhez
> **két** lánc kell, nem egy. A `core/journal/` lenyomata a **nyílt**
> bejegyzésre készül — az bizonyítja a tartalmat, de kulcs nélkül senki nem
> tudja újraszámolni. A kulcs nélküli épség-ellenőrzéshez ezért az archívum
> a **rejtjelezett** alakon vezet egy második láncot (`sealedHash`). A kettő
> mást bizonyít: a nyílt a tartalmat, a rejtjelezett az archívumot. És a
> második **nem kulccsal hitelesített**, tehát a romlást fogja meg, nem a
> felkészült támadót — az ellen az AEAD-címke véd.

**Miért éri meg mégis.** Egy hidegtárban őrzött másolat épségét évente
ellenőrizni kell — de ehhez nem szabad minden alkalommal elővenni a kulcsot,
mert **minden kulcshasználat kockázat**. Chain-over-ciphertext mellett az
„ép-e a másolat?" és a „mi van benne?" **két külön kérdés marad, két külön
jogosultsággal.**

Ezt teszt bizonyítja: a napló lánca végigfut a rejtjelezett bejegyzéseken, és
egy megbolygatott rekord a láncon bukik el — **visszafejtés nélkül**.

### Ezért a DEK nem cserélhető

Következmény, amit ki kell mondani: a `KeyPolicy.dekImmutable` **típusszinten
`true`**, nem beállítás. A kulcsrotáció így oszlik meg:

| | Cseréje | Miért |
|---|---|---|
| **KEK** | rendszeres, olcsó | csak a burkolt DEK-eket írjuk újra; a rekordok nem mozdulnak |
| **DEK** | **nincs** | az újratitkosítás elszakítaná a láncot |

### Ha mégis muszáj: a migrációs rekord

Kulcskompromittálódásnál vagy elavuló algoritmusnál nem „csendben átírunk",
hanem **új naplót nyitunk**, és egy aláírt rekord köti össze a régi lánc végét
az újjal:

```ts
{ reason: "keyCompromise", actor: "üzemeltetési vezető", why: "…",
  fromHash: "…", fromKeyId: "dek-1", fromCipher: "AES-256-GCM",
  toHash:   "…", toKeyId:   "dek-2", toCipher:   "AES-256-GCM" }
```

**Ez a különbség a migráció és a hamisítás között.** A `checkMigration()`
elutasítja az elrendelő nélküli migrációt, az azonos lánclenyomatút („ez nem
migráció"), és azt, ahol ugyanaz a kulcs és algoritmus szerepel mindkét
oldalon — mert ott a lánc elszakadt, cserébe semmiért.

---

## 5. A letét: M-ből N, és három hiba, amit a validátor kifog

```ts
escrowThreshold: { need: 3, of: 5 }
```

| Beállítás | A validátor mondja |
|---|---|
| `need: 1` | **„Egyetlen letétkezelő nem letét.”** Ha egy ember egyedül vissza tudja állítani a kulcsot, akkor egyedül el is tudja vinni az egész adatbázist — és nincs, aki tanú legyen rá. |
| `need === of` | **„Nincs tartalék.”** Egy ember betegsége, felmondása vagy halála véglegesen elveszíti az adatot — *a klinikai rendszer élettartama hosszabb, mint a munkaviszonyoké.* |
| `need > of` | „A kulcs ezzel nem védett, hanem elveszett.” |

A második a leggyakoribb jó szándékú hiba: „legyen minél biztonságosabb,
kelljen mindenki". Egy húszéves horizontú rendszernél ez **garantált
adatvesztés**, nem óvatosság.

### Amit a küszöb nem old meg

A letétrészek **elérhetőségi függetlensége**. Ha mind az öt rész ugyanabban a
páncélszekrényben van, a küszöb papíron 3-ból 5, a gyakorlatban 1-ből 1. És a
helyreállítási esemény **auditálandó**: ki, mikor, milyen jogalapon hívta össze
a letétkezelőket.

---

## 6. Miért véletlen egyszerhasználatos szám, és nem sorszámból származtatott

A napló monoton sorszámából elegáns, rövidebb, ütközésmentes nonce-t lehetne
képezni. **Mégsem azt választottuk**, és az indok a hibamodell:

> Ha a hívó valaha kétszer ír ugyanarra a sorszámra **más tartalommal**, a GCM
> **katasztrofálisan** bukik: a kulcsfolyam újrafelhasználása mindkét rekordot
> visszafejthetővé teszi.

A napló szerkezete (hozzáfűző, `entryId`-vel) ezt megakadályozza — de **egy
klinikai rendszerben a hívó hibája nem lehet katasztrofális**. 12 bájt
véletlent fizetünk rekordonként azért, hogy a legrosszabb eset egy elrontott
rekord legyen, ne az egész napló.

Ez ugyanaz a gondolkodás, mint a rendszer többi kapujánál: **nem azt
optimalizáljuk, ami jól sül el, hanem azt, ami rosszul.**

---

## 7. Mit NEM titkosítunk, és miért

| Nyílt marad | Miért |
|---|---|
| `seq`, `prevHash`, `hash` | enélkül az épség nem ellenőrizhető kulcs nélkül |
| `caseId` | enélkül nem lehet megtalálni a rekordot |
| `keyId`, `cipher` | tíz év múlva ez mondja meg, mivel nyitható |
| `at` (bejegyzés ideje) | az auditnaplóhoz kell |

### A `caseId` álnevesített, NEM anonim

Ezt külön ki kell mondani, mert könnyű elfelejteni. A `caseId` önmagában nem
azonosít beteget — de **a hozzárendelő tábla igen**, és az a tábla ezzel a
rendszer **legértékesebb célpontja**.

Következmények:
- a hozzárendelő tábla **külön jogosultság** alatt áll, más kulccsal;
- a `kodkulcs_kezelo` és a `kutato` szerep **egy felhasználón nem adható ki** —
  ez az összeférhetetlenségi szabály már a `25` modulban rögzítve van;
- a kutatási export **soha nem viszi** a hozzárendelést.

---

## 8. Algoritmus-agilitás és a harminc éves horizont

Minden rekordban ott az algoritmus azonosítója (`cipher`). Húszéves
horizonton **biztos**, hogy amit ma választunk, legacy lesz — és egy rekord,
ami nem mondja meg, mivel titkosították, tíz év múlva nem a titkosítás, hanem
**a régészet miatt** megfejthetetlen.

### A genetikai adat külön eset

A rendszernek van genetikai modulja (`23`), és ez a kriptográfiában is
következményekkel jár:

- a genetikai adat érzékenységi horizontja **hosszabb, mint bármelyik mai
  algoritmus várható élettartama**;
- **vérrokonokról is állít valamit**, akik soha nem egyeztek bele semmibe —
  tehát az érintettek köre nagyobb, mint akiről a rekord szól;
- a „gyűjtsd be most, fejtsd vissza később" támadás ellene **valós**, nem
  elméleti.

Ebből következik, hogy a hidegtári réteg számára **kell** újratitkosítási
terv — és éppen ezért van migrációs rekord (4. fejezet). A mai válasz nem az,
hogy megoldottuk; az, hogy **a szerkezet készen áll rá**, és a döntés
időzítése kriptográfiai szakértői kérdés, nem fejlesztői.

---

## 9. Mért árak

`npm run bench` (egy gépen, nagyságrendi tájékoztatásul):

| Művelet | Medián |
|---|---:|
| egy érték lezárása (AES-256-GCM + kötés) | **0,014 ms** |
| egy érték felnyitása | **0,013 ms** |

**A boríték 14 mikroszekundum.** A titkosítás — mint a lenyomatlánc — **nem
teljesítménykérdés.** Aki kihagyja, nem gyorsaságot nyer.

Összevetésül: egy billentyűleütés utáni teljes lánc (`setValue` +
újraszámítás) 0,001 ms, a regiszter betöltése 6 ms. A titkosítás ezek közé
esik, és egyik érzethatárt sem közelíti meg.

---

## 10. Amit a titkosítás NEM old meg

- **A jogosult felhasználó ellen nem véd.** Aki jogszerűen fér hozzá, a
  visszafejtett adatot látja. Ellene az **auditnapló** véd (`core/log/`).
- **Használat közben nem véd.** A memóriában a rekord nyílt. A védelem ott a
  folyamat izolációja és a memóriakiíratás tiltása.
- **A kulcs a mentés mellett nem kulcs.** Ha a titkosított másolattal együtt
  utazik a kulcs, a titkosítás díszlet.
- **Nem pótolja a hozzáférés-szabályozást.** Attól, hogy minden rekord
  titkosított, még nem ellenőriztük, hogy a kérőnek joga volt-e hozzá.

---

## 11. Mi van kész, és mi a gazdáé

| Kész a magban (21 teszt) | Hiányzik, és a gazdáé |
|---|---|
| boríték: `seal` · `open` kötéssel | HSM/KMS-integráció; a KEK sosem jöhet ki |
| a négy megnevezett bukás | kulcs-életciklus üzemeltetése |
| `wrapDek` · `unwrapDek` | valódi letét (Shamir M-ből N), névvel |
| `cryptoErase` a másolatok ellenőrzésével | a másolatok tényleges megsemmisítése |
| `checkKeyPolicy` · `checkMigration` | a kulcsletét SOP-ja |
| lánc a rejtjelezett alakon (tesztelve) | éves épség-ellenőrzés a hidegtáron |

A mag itt is tiszta: **nem hív kulcskezelőt és nem ír lemezre.** Azt mondja
meg, mi a helyes rejtjelezett rekord, és hogy egy kapott rekord ép-e.

---

## Négy mondat

1. **A kulcsmentés és a törlés egymásnak feszül** — a döntést kulcsonként ki
   kell mondani, mert a hallgatás is döntés.
2. **A kriptográfiai törlés a válasz** arra, hogyan törlünk módosíthatatlan
   másolatból — de csak akkor, ha egyetlen kulcsmásolat sem maradt.
3. **A lánc a rejtjelezett alakon fut**, hogy az épség kulcs nélkül
   ellenőrizhető legyen; ennek az ára, hogy a DEK nem cserélhető, és
   újratitkosításnál migrációs rekord köti össze a két láncot.
4. **A boríték 14 mikroszekundum.** Aki a titkosítást teljesítmény miatt hagyja
   ki, nem mért.
