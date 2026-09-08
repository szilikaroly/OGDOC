# 33 — Nyelvek: fordítás, forrásnyelv és a néma helyettesítés tilalma

*A `core/i18n.ts`, a `web/` felület nyelvi rétege és a `test/i18n.test.ts`
mögötti döntések. Ez a fejezet nem arról szól, hogyan tegyünk szavakat egy
szótárba — hanem arról, mit tegyünk, amikor **egy szó nincs benne**.*

---

## 0. Az egy mondat

> **A hiányzó fordítás nem forrásnyelvi szöveg, hanem MEGJELÖLT
> forrásnyelvi szöveg.**

Ez ugyanaz az elv, mint a rendszer legtöbbet ismételt szabálya — *„a hiányzó
adat sehol nem »nem«”* —, csak a nyelvre alkalmazva. Egy `??`-lánc
(`en ?? hu`) pontosan azt csinálja, amit a rendszer minden más ponton tilt:
**csendben helyettesít**, és a felhasználó nem tudja, hogy helyettesítés
történt.

Egy angol nyelvre állított felületen a „Cervix hossza” felirat **nem hiba**.
Az a hiba, ha a felhasználó nem tudja, hogy ez nem fordítás — mert akkor azt
hiszi, hogy ez egy szakkifejezés, amit nem ismer.

---

## 1. Három szint, és a köztük lévő különbség a lényeg

| Szint | Mi tartozik ide | Hiányzó fordítás esetén |
|---|---|---|
| **Felületi szöveg** | gombok, fejlécek, állapotnevek, címkék | **HIBA** — a `missingUiStrings()` kimutatja, a teszt bukik rá |
| **Klinikai tartalom** | változónevek, kódlisták, leletszövegek, javaslatok | **forrásnyelvi alak, MEGJELÖLVE** |
| **Mérőeszköz** | validált kérdőívek tételszövege (EPDS, PHQ-9, EQ-5D…) | **semmi** — licenc és eljárás kérdése, rögtönzött alakban sehogy |

A **második sor** az, amit a legtöbb rendszer elront. A felületi szöveg a
miénk, tehát lefordítjuk; a klinikai szöveg **szakmai szöveg**, és a
rögtönzött fordítás nem ugyanaz a fogalom. A `pick()` ezért nem `string`-et
ad vissza, hanem hármast:

```ts
export interface Picked {
  text: string;
  lang: Lang;        // amit ténylegesen visszaadtunk
  fallback: boolean; // igaz, ha NEM a kért nyelven
}
```

A hívó eldöntheti, hogy a jelölést **megmutatja**-e. Azt nem döntheti el,
hogy **megtudja**-e.

A harmadik sor a licenckapu párja a `10-mérőeszközök` kapunál: a validált
tételszöveg fordítása nem szerkesztési, hanem **eljárási** kérdés (visszafelé
fordítás, kognitív interjú, jogtulajdonosi jóváhagyás). Amíg ez nincs meg, az
eszköz nem vehető fel — nem „angolul vesszük fel”.

---

## 2. A lefedettség nem díszítés

```
GET /api/i18n?lang=en
{ "lang": "en", "coverage": { "percent": 4, "usable": false, "why": "CSAK 4% …" } }
```

A `coverage()` azért ad vissza `usable` mezőt is, mert a százalék önmagában
félrevezető. **4%-osan lefordított felület nem „részben angol”, hanem magyar
felület angol gombokkal** — és a felhasználónak ezt tudnia kell, *mielőtt*
döntést alapoz rá, nem utána.

A nyelv ettől még **felkínálható**. Amit a rendszer nem tesz meg: nem tesz
úgy, mintha kész lenne.

Mai állás (a `846` regiszterbeli változó címkéjén mérve):

| Nyelv | Lefedettség | Használható klinikai üzemben |
|---|---|---|
| `hu` | 100% (forrásnyelv) | igen |
| `en` | 4% (30/846) | **nem** — a felület forrásnyelvi, megjelölve |

A `64` **felületi** kulcs ezzel szemben mindkét nyelven **100%** — a
`missingUiStrings()` üresen tér vissza, és ha nem tenné, a build elszáll.
A két szám külön mérendő: az egyik a mi munkánk, a másik szakfordítói munka.

---

## 3. Amit a nyelvválasztó NEM tesz meg

**Nem találgat.** Ismeretlen nyelvnél a forrásnyelv jön vissza:

```ts
function wantedLang(url: URL, header?: string): Lang {
  const q = url.searchParams.get("lang");
  if (q && LANGS.includes(q)) return q;
  for (const part of (header ?? "").split(",")) { … }
  return SOURCE_LANG;                    // „de” kérésre NEM angol
}
```

Egy `Accept-Language: de` kérésre kiszolgált **angol** felület rosszabb, mint
a magyar: azt sugallja, hogy a rendszer ismeri a felhasználó nyelvét. A
sorrend `?lang=` → `Accept-Language` → forrásnyelv, és a választás a
`localStorage`-ba is bekerül, hogy ne kelljen minden oldalbetöltésnél újra
megadni.

---

## 4. A beégetett szöveg a valódi ellenség

A fordítás nem attól „aktív”, hogy van nyelvválasztó, hanem attól, hogy
**nincs beégetett szöveg**. Egy magyarul beírt gombfelirat nyelvváltás után
is magyar marad — és mivel a felület többi része angol lesz, a felhasználó
azt hiszi, ez egy szakkifejezés, nem egy kifelejtett kulcs.

Ezért a `test/i18n.test.ts` **a forrásfájlokat olvassa**:

* `index.html` — minden `<h1|h2|p|button|label|option|…>` ékezetes szövegének
  `data-i18n` mögött kell lennie (vagy egy olyan szülő alatt, ami hordozza);
* `app.js` — a megjelenítő ágon (`textContent`, `innerHTML`, `append`,
  `title`, `placeholder`) nem állhat ékezetes string-literál.

Mindkét teszt **bizonyítottan fog**: egy szándékosan visszatett
`<button>Mentés mindenre</button>` és egy `textContent = "próbaszöveg
magyarul"` elbuktatja őket. Egy teszt, ami sosem bukik, nem teszt.

---

## 5. Szórend: helyőrző, nem összefűzés

```ts
t("effort.summary", "en", { touched: 12, hidden: 40 })
```

A `t()` `{név}` helyőrzőket tölt — **nem** azért, mert szebb, hanem mert a
magyar és az angol mondat szórendje nem azonos, és a darabokból ragasztott
mondat pont ezen bukik el. Az **ismeretlen helyőrző megmarad** (`{tudjukNem}`),
nem tűnik el némán: ugyanaz az elv, mint az ismeretlen kulcsnál, ahol a
`⟨kulcs⟩` alak jelenik meg üres string helyett.

---

## 6. Hol látszik a jelölés

| Hely | Jelölés |
|---|---|
| űrlapmező címkéje | `HU` badge a címke mellett, a sor `srcfallback` osztályt kap |
| kódlista (`option`) | a `optionsFallback` jelzi, hogy a válaszok forrásnyelviek |
| a motor elutasító üzenete | `⚠ Rejected by the system: <forrásnyelvi szöveg> HU` |
| a demó (`npm run demo:szuleszet -- --lang en`) | `⟨hu⟩` a címke után, `⟨kód⟩` a le nem fordított kódnál |

A badge `title`-je megmagyarázza, mit lát az olvasó — a jelölés önmagában
rejtvény lenne.

---

## 7. Amit ez a réteg nem old meg

* **A fordítás elkészítését.** A `core/i18n.ts` megmondja, mi hiányzik; a
  hiányzó 816 klinikai címke szakfordítói és szakmai lektori munka. A rendszer
  ezt nem tudja, és nem is tesz úgy, mintha tudná.
* **A gépi fordítást.** Nincs benne, és nem is lesz: egy gépileg fordított
  klinikai címke pontosan az a „majdnem jó”, ami a legveszélyesebb.
* **A jobbról balra író nyelveket.** A `LANGS` bővíthető, a felület
  irányultsága (`dir`) viszont ma nem paraméter. Amíg nincs ilyen igény,
  nem építünk rá — de a `document.documentElement.lang` már állítódik, tehát
  a `dir` beillesztésének helye megvan.

---

## 8. Ellenőrző lista

- [x] `pick()` jelzi a helyettesítést, nem rejti el
- [x] felületi kulcs hiánya = hiba (`missingUiStrings()`)
- [x] klinikai szöveg hiánya = **megjelölt** forrásnyelvi alak
- [x] mérőeszköz-tételszöveg licenckapu mögött
- [x] ismeretlen nyelv → forrásnyelv, találgatás nélkül
- [x] lefedettség és `usable` a felületnek visszaadva
- [x] beégetett szöveg ellen forrásfájl-olvasó teszt, bizonyítottan fogó
- [x] helyőrző az összefűzés helyett
- [ ] klinikai címkék szakfordítása (816 tétel) — **nyitott, külső munka**
- [ ] `dir` (RTL) — nyitott, igény hiányában nem épült
