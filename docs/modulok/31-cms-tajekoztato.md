# Modul 31 — Intézményi weboldal, CMS és betegtájékoztató

*A rendszer első kimenete, amit nem klinikus olvas.*

---

## A modul egyetlen szerkezeti kérdése

**A betegtájékoztató is lejár — csak nem a naptártól, hanem a tudástól.**

A rendszerben minden igazolás lejár: a megőrzési idők, a mérőeszköz-licencek, a
MIR-dokumentumok, a MEES-tanúsítványok. A weboldalra kitett tájékoztató szöveg
az **egyetlen olyan tartalom, ami elévül anélkül, hogy bárki észrevenné** — mert
nincs se lejárati dátuma, se felelőse, és senki nem panaszkodik rá.

Egy öt éve kitett szoptatási tájékoztató nem hibaüzenettel jelez, hanem azzal,
hogy elavult ajánlást ad — és a beteg aszerint jár el.

> **A szerkezeti tanulság, ami a példaanyagból jött**, és amit átveszünk: egy
> komoly betegtájékoztató cikknek **nevesített szerzője**, **felülvizsgálati
> dátuma** és **laikus/szakmai változata** van. Ez a szerkezet. A **tartalmat**
> az intézménynek kell megírnia vagy licencelnie — a hivatkozott példa
> (MSD Manual) szerzői jogvédett, és a forrásjegyzékben kimaradóként szerepel.

---

## Mi van már meg

| | |
|---|---|
| MIR-dokumentumfa (13. lépés) | **lejáró dokumentum, felülvizsgálati ciklussal** — ez a minta |
| `core/zaro/render.ts` | a betegnek szóló kimenet, hitelességi figyelmeztetéssel |
| `core/i18n.ts` | többnyelvűség |
| Licencpanel | a licencelt tartalom aktiválása |

---

## 1. A CMS, ami szándékosan buta

A CMS **nem** általános tartalomkezelő. Négy tartalomtípust ismer, és semmi
mást:

| Típus | Mi | Lejár? |
|---|---|---|
| `oldal` | statikus oldal (bemutatkozás, elérhetőség) | felülvizsgálati ciklussal |
| `hir` | dátumhoz kötött közlemény | nem — de **archiválódik** |
| `munkatars` | személy, beosztással és szakvizsgával | a szakvizsga-adat lejár |
| `tajekoztato` | **betegtájékoztató** | **igen — ez a lényeg** |

Miért ilyen szűk: egy szabadon bővíthető tartalomtípus-rendszerben a
tájékoztató és a hír egy hét alatt összekeveredik, és a lejárati szabály
elveszik. **A megszorítás maga a funkció.**

### Az űrlap, ami nem enged mentetni

Egy `tajekoztato` **nem menthető** e négy nélkül:

- **szerző** — megnevezett személy, nem „a klinika"
- **szakmai jóváhagyó** — aki vállalja a tartalmat
- **felülvizsgálati dátum** — mikor nézik meg újra
- **változat** — laikus vagy szakmai

Ez ugyanaz a szerkezet, mint a MIR-dokumentumfánál: a dokumentum lejár, és a
lejárt dokumentum **nem hatályos**. A különbség: itt a lejárt tartalom **kint
marad a nyilvános weben**, amíg valaki le nem veszi — ezért a rendszernek
**előre** kell szólnia, 90 nappal, mint a licenceknél.

---

## 2. A weboldal

Alapértelmezetten a **SZTE Szülészeti és Nőgyógyászati Klinika** oldalának
szerkezete és tartalmi felosztása szerint épül, **cserélhetően**: a szerkezet
nyilvántartásból jön, nem kódból.

| Szakasz | Mi kerül bele |
|---|---|
| Kezdőlap | rövid bemutatkozás, aktuális közlemények |
| Bemutatkozás | a klinika, a szakterületek |
| Munkatársak | orvosok, szakvizsgával |
| Betegellátás | ambulanciák, rendelési idők, felkészülés |
| **Betegtájékoztatók** | **ez a modul lényege** |
| Oktatás | graduális, szakképzés |
| Kutatás | vizsgálatok, publikációk |
| Elérhetőség | cím, telefon, időpontkérés |

**Az „Időpontkérés" a 27. modulba köt be**: a laikus kérés nem rendelés, és a
weboldalról indított kérés sem az. Ugyanaz a kapu, ugyanaz a vészjel-kérdéssor.

---

## 3. Amit a nyilvános felület SOHA nem tehet

**Nem ad klinikai tanácsot személyre szabva.** A tájékoztató általános; ami
személyre szól, az ellátás, és ahhoz azonosítás kell.

**Nem szivárogtat.** A munkatársi oldal és a hírek szerkesztése ugyanabban a
rendszerben történik, ahol a betegadat van — a nyilvános kimenetnek ezért
**külön kapun** kell kimennie, és a rendszer PHI-gyanús tartalommal nem
publikál. Ez ugyanaz a szabály, mint az exportcsomagnál: az abortál PHI-gyanús
fájlnéven.

**Nem mutat lejárt tájékoztatót lejártként jelöletlenül.** Ha a felülvizsgálat
elmaradt, az oldal vagy leveszi, vagy kiírja — a csendes megtartás a rossz
válasz.

---

## 4. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| `cms.munkatars.*` | jogosultsági réteg | **csak olvasás** — a weboldal nem ad jogot |
| `cms.tajekoztato.*` | MIR-dokumentumfa | a felülvizsgálati ciklus közös |
| időpontkérés | 27. modul `keres.vizsgalat` | feladat lesz, nem időpont |
| `cms.tajekoztato` lejárat | licencpanel előjelzése | ugyanaz a 90 nap |

---

## 5. A gépi fele — ami elkészült

`core/cms/tartalom.ts` · `registry/cms/weboldal.json` (szintetikus demó)

**A rés, amit a modul megtalált.** A specifikáció azt ígérte, hogy „a rendszer
PHI-gyanús tartalommal nem publikál", és erre az exportcsomag ellenőrzésére
hivatkozott. Az viszont **fájlnevet** vizsgál (`_PHI`, `beteg_adat`) — egy
tárolt fájlkészletre értelmes szabály, egy weboldalra értéktelen. A kockázat
nem a fájlnév, hanem a **szövegtörzs**: egy „hónap esete" hír a beteg nevével
minden fájlnév-ellenőrzésen átmegy.

A szűrés ezért a tartalmat nézi (TAJ, születési dátum, „anyja neve" fordulat,
telefon, e-mail, beazonosítható lakcím, betegazonosító) — a fordításokat is.

> **De egy mintaillesztő nem detektor.** Ezért három állapot van, és a
> középső a lényeg: `talalat` · `nincsTalalat` · `nemVizsgalhato`. A
> `nincsTalalat` **nem felmentés**. A publikálás nem a szűrésből nyílik, hanem
> egy **megnevezett ember** kimondásából, akinek a szűrés csak segédeszköz — egy
> „a rendszer ellenőrizte" pecsét pontosan azt a felelősséget venné le, aminek
> maradnia kell.

**A publikálási kapu hat állapota:**

| | Mikor |
|---|---|
| `publikalhato` | minden megvan |
| `csakJelolve` | lejárt — megjeleníthető, de **kizárólag jelölve** |
| `nemMentheto` | hiányzik a négy kötelező elem valamelyike |
| `phiTalalat` | a szövegtörzsben betegadat-gyanús minta |
| `nincsVallalas` | nincs megnevezett ember, aki a nyilvánosságra adást vállalta |
| `jovaNemHagyottForditas` | **a fordítás önálló tartalom** — az eredeti jóváhagyása nem terjed ki rá |

**A lejárat öt állapota**: `ervenyes` · `hamarosanLejar` (90 nap, mint a
licencpanelen) · `lejart` · `nincsDatum` · `archivalhato` (hír). A **dátum
nélküli tartalom nem „nem jár le"**, hanem az, amiről nem tudjuk, mikor — és
pontosan az évül el csendben.

*(Egy hibát a saját tesztem fogott meg: a telefonszám-minta `\b` horgonnyal
kezdődött, ami a „+" előtt sosem illeszkedik — a `+36`-os alakot a szűrés
átengedte volna.)*

---

## 6. Elfogadási kritérium

1. `tajekoztato` **nem menthető** szerző, jóváhagyó, felülvizsgálati dátum és
   változat nélkül.
2. A lejáró tájékoztató **90 nappal előbb** jelez.
3. A lejárt tájékoztató a nyilvános oldalon **nem jelenik meg jelöletlenül**.
4. A weboldalról indított időpontkérés a 27. modul kapuján megy át — **nem lesz
   belőle rendelés**.
5. A nyilvános kimenet **PHI-ellenőrzésen** megy át, mint az exportcsomag.
6. A weboldal szerkezete **nyilvántartásból** jön, cserélhetően.

---

## 7. Nyitott kérdések

- **Ki a szakmai jóváhagyó** tájékoztatónként, és milyen ciklussal? (A 13.
  lépés dokumentumfája ezt már tudja kezelni — érdemes oda kötni.)
- **Licencelt tartalom**: ha az intézmény betegtájékoztatót licencel (pl. egy
  kiadótól), az a licencpanelre kerül, és a lejáratával együtt kell levenni.
- **Nyelvek**: a tájékoztató fordítása maga is tartalom, saját jóváhagyással —
  a validált fordítás kérdése ugyanaz, mint a mérőeszközöknél (12. lépés).
- **Akadálymentesség** (WCAG) — jogszabályi kötelezettség közintézménynél,
  és ezt a szerkezetbe kell építeni, nem utólag rátenni.
