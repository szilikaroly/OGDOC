# 29 — Három külső repó, három tanulság

*Mit ér egy idegen kódbázis, ha nem használjuk fel belőle egy sort sem.*

Három nyilvános GitHub-repó került be a forrástárba — pontosabban **nem
került be**: a fájlok kimaradnak (harmadik fél anyaga, a licencüket nem
vizsgáltuk), a lenyomatuk és a tanulságuk marad. Mindhárom olyat mutat meg,
amit magunkon nehéz észrevenni.

---

## 1. `DataMining` — a helyi modell és a hitelesítés

Egyetemi adatbányászati gyakorlat: szívbetegség-adathalmaz elemzése,
klaszterezés, dimenziócsökkentés, gépi tanulás. A klinikailag érdekes darabja
egy publikáció reprodukálása, amelyben **citokinprofil szerinti klaszterezés
jósolja meg a kórházi COVID-halálozást.**

Ez pontosan a rendszer `local` normogram-üzemmódjának mintája: *mihez képest
mérünk MI, ITT?* Egy saját populáción tanított modell a saját populáción
jobb, mint egy idegen — és ez az egyetlen ok, amiért egyáltalán érdemes
ilyet készíteni.

De ugyanez a repó adja a legjobb ellenpéldát is. A benne szereplő
szívbetegség-adathalmaz **1988-ban, 303 clevelandi betegen** készült. Egy
abból tanult modell magyar várandósokra alkalmazva pontosan az a hiba, amit a
`calc.verified` kapu véd: a szám kijön, hitelesnek látszik, és semmiről nem
szól. A tanulság nem a módszer, hanem a **hatókör**: a helyi modellhez helyi
adat kell, és a hitelesítés nem a kód, hanem a populáció kérdése.

---

## 2. `Medical Report Simplification` — betegnyelv, két úton

Streamlit-alkalmazás, ami **FLAN-T5 + LoRA** modellel írja át a leleteket
betegnyelvre, OCR-rel képből is. Ez szó szerint a 26. modul (előéleti import)
és a betegnek szóló kimenet metszete — érdemes pontosan kimondani, hol tér el
a mi megoldásunk.

**Ők a kész SZÖVEGET egyszerűsítik. Mi a STRUKTURÁLT ÉRTÉKEKBŐL írjuk a
szöveget.**

A különbség nem stílus, hanem ellenőrizhetőség:

| | Szövegből szöveg | Értékből szöveg |
|---|---|---|
| Mi a bemenet | egy már megírt lelet prózája | a rögzített értékek |
| Mi történhet vele | kihagyás, félreértés, hozzáköltés — és mindez folyékonyan | a szöveg a sablonból és az értékből áll össze |
| Visszavezethető-e | nem: a mondat nem mutat vissza egy mezőre | igen: minden mondat mögött ott a változó |
| Mi történik hiányzó adatnál | a modell kitölti | a rendszer kimondja, hogy hiányzik |

A rendszer betegnek szóló kimenete **mind az öt leletállapotra** ad szöveget
— a normálisra is —, mert a szöveg nem fordítás, hanem levezetés.

Két további tanulság ugyanebből a repóból:

- **A nyelv nem részletkérdés.** Egy angol orvosi korpuszon finomhangolt
  modell magyar leleten nem az, aminek látszik. Ugyanaz a kapu, mint a
  validált kérdőívfordításoknál: a rögtönzött magyar alak nem a mérőeszköz.
- **Az OCR a 26. modul bemenete**, és az OCR bizonytalansága nem tűnhet el a
  kimeneten. Ezért van az importban a javaslattár: a gépi kivonat
  *javaslat* marad, amíg a klinikus meg nem erősíti, és csak a megerősített
  érték kerül a rekordba, `provenance: "clinician"` jelöléssel.

---

## 3. `hospital_managment_app_django` — a negatív minta

Kórházi nyilvántartás Django-ban: recepciós, nővér, orvos szerepkörökkel,
diagnózis- és allergialistával. Működő, tanulságos, jó szándékú munka — és
két olyan dolgot csinál, ami a mi szabályaink szerint azonnali build-hiba
lenne:

1. **A README nyílt szövegben közli az adminisztrátori jelszót**, és egy
   közös jelszót az összes létrehozott felhasználóhoz.
2. **A repóban ott a `db.sqlite3`**, benne betegtáblákkal, diagnózis- és
   allergiabejegyzésekkel.

Demóprojektnél ez szándékos kényelem. De pontosan ez az a két lépés, amivel
egy éles rendszer titkot és betegadatot szivárogtat — és nem azért, mert
valaki rosszat akart, hanem mert a repó a fejlesztés kényelmi tere, és a
kényelem nyomot hagy.

A mi oldalunkon ez három szabály, mindhárom már működik:

- a `.gitignore` mintái (`*_PHI*`, `*phi*`, `*beteg_adat*`) és az elv, hogy
  **minden teszt- és demóadat szintetikus**;
- a `phi: true` jelölés, ami a beteg azonosítóit kizárja az exportból és a
  lekérdezőből;
- és a kimondott korlát, hogy a webes rétegben nincs hitelesítés,
  **tehát valódi betegadattal nem futhat.** (A jogosultság és az auditnapló
  2026-09-05 óta éles — a hitelesítés az, ami hiányzik.)

Egy negatív minta néha többet ér, mint egy jó példa: ez a repó megmutatja,
hogy a szivárgás nem támadás eredménye, hanem egy `git add .` következménye.

---

## Ami mindhárom repóban közös

Egyikből sem használunk fel egy sor kódot. Mégis mindhárom **a mi
szabályainkat erősítette meg**, és mindhárom ugyanabban a pontban:

> A modell, az OCR és a kényelmi megoldás mind ugyanazt teszi — **kitölti a
> hiányt.** A rendszer legtöbbet ismételt szabálya pedig éppen az, hogy a
> hiányt nem tölti ki: megnevezi.
