# Modul 27 — Telemedicina

*Szakembereknek: konzultáció és referálás. Laikusoknak: kérés, ami nem rendelés.*

---

## A modul egyetlen szerkezeti kérdése

**A távoli megítélés olyan adaton áll, amit a megítélő nem vett fel.**

Egy ágy melletti ultrahangnál a leletező tudja, hogy nyomta a fejet, hogy a beteg
mozgott, hogy a kép rossz szögből készült — és ha kell, újra felveszi. Egy
beküldött képnél **egyik sem áll rendelkezésre**, és ami hiányzik belőle, az nem
látszik a képen.

A rendszer erre már ma tud válaszolni: minden érték hordoz `provenance`-ot és
`confidence`-t. A telemedicina ezt **kiterjeszti**: nem elég tudni, hogy mérés
volt — tudni kell, **ki vette fel, milyen eszközzel, mikor**, és hogy a felvétel
**alkalmas-e a feltett kérdés megválaszolására**.

> **A konzultáció megtagadása elsőrendű kimenet, nem hibaág.**
> Ha a beküldött kép nem elég a kérdéshez, a rendszernek ezt **állapotként** kell
> tudnia rögzíteni, nem szabad szövegként. Egy távoli leletező, aki nem tud
> nemet mondani, tippelni fog — és a tippje leletként fog továbbélni.

---

## Mi van már meg

| | |
|---|---|
| `provenance` · `confidence` minden értéken | a bővítés ide illeszkedik, nem mellé |
| Jogosultsági réteg ellátási kapcsolattal | a távoli konzultáns is cselekvő, időablakkal |
| Auditnapló az adat előtt | a beküldött kép megtekintése is auditsor |
| Külső forrás kezelése (`core/kulso/`) | a beérkező kép **külső adat**: nem megbízható, amíg nem az |
| EESZT-dosszié (14. lépés) | a telekonzílium is dokumentum, amit be kell küldeni |

---

## 1. Két világ, egy modul — és ami elválasztja őket

| | Szakember → szakember | Laikus → rendszer |
|---|---|---|
| Mi indítja | konzultációkérés megnevezett kérdéssel | **kérés**, nem rendelés |
| Ki felel | a kezelő klinikus, végig | senki, amíg klinikus nem nyúl hozzá |
| Kimenet | vélemény, megtagadással együtt | **feladat egy klinikusnak** |
| Mit NEM tehet | nem ír receptet a kezelő helyett | **semmit nem indít el magától** |

### A laikus kérés nem orvosi rendelés

Ez a modul legfontosabb kapuja. Három laikus kérésfajta:

- **e-recept igénylés** — a beteg jelzi, hogy elfogyott a gyógyszere
- **vizsgálat igénylés** — a beteg időpontot vagy vizsgálatot kér
- **tanácsadás kérés** — a beteg kérdez

Mindhárom **kérés** (`keres.*`), és a rendszerben **soha nem válhat rendeléssé
magától**. Az e-recept igénylésből akkor és csak akkor lesz recept, ha egy
**megnevezett klinikus** a saját jogosultságával kiállítja — a kérés ténye ehhez
bemenet, nem felhatalmazás.

Miért kapu ez, és nem munkafolyamat: egy „megújítás" gomb, ami a korábbi receptet
ismétli, **pontosan az a hiba**, amit a rendszer mindenütt máshol tilt — a
korábbi döntés nem bizonyítja a mostani indikációt. A gyógyszer közben
ellenjavallttá válhatott (terhesség, új interakció, laboreltérés), és a
kérés ezt nem tudja.

---

## 2. Amit a szakember küld — és ami hiányzik belőle

### UH-lelet konzultáció

A beküldött kép mellé **kötelező**: mikor készült, milyen géppel, ki készítette,
és **mi a kérdés**. Kérdés nélküli konzultációkérés nem vehető fel: a „nézd meg,
mit gondolsz" nem kérdés, és a rá adott válasz nem lelet.

A képminőség megítélése **külön mező**, és a leletező tölti ki, nem a beküldő.
Három állapot: alkalmas · **korlátozottan alkalmas, megnevezett korláttal** ·
alkalmatlan. A középső a legfontosabb: „a magzati szívet nem ítélem meg ezen a
felvételen, a többit igen" — ez több információ, mint bármelyik szélső érték.

### TTCTG — a távolról érkező CTG

A telemetrikusan érkező CTG-görbe a **felvételi kontextus nélkül** érkezik: nem
tudni, mozgott-e az anya, hol állt a transzducer, mikor volt jelvesztés. Egy
ágy melletti CTG-nél ezt a leletező látja; itt **nem látja, és nem is tudja, hogy
nem látja**.

Ezért a TTCTG-nél a jelminőség **kötelezően rögzített**: a jelvesztés aránya, a
felvétel hossza, és hogy volt-e anyai pulzus-tévesztés (*maternal heart rate
artefact*) — ez utóbbi az a hiba, ami **megnyugtató görbét mutat halott
magzatnál**, és pontosan telemetrikus felvételnél a leggyakoribb.

### Kolposzkópia külső képfogadással

A külső kép **külső adat**, a szó teljes értelmében: ismeretlen eszközről, gyakran
ismeretlen felbontással, néha beégetett betegazonosítóval. Három szabály:

1. **Karanténba érkezik.** Amíg nem társították egy esethez megnevezett cselekvő
   által, nem látszik a klinikai felületen.
2. **A beégetett azonosító PHI.** A kép metaadatát és a látható szövegét át kell
   nézni, mielőtt bárhova kerül — az exportcsomag ma is elbukik PHI-gyanús
   fájlnéven.
3. **A felbontás és a színhűség korlát.** Egy tömörített kolposzkópos képen az
   érrajzolat megítélése nem ugyanaz a művelet, mint élőben.

### Laborlelet-konzultáció

A legkevésbé látványos, és az egyik legveszélyesebb: egy szám kontextus nélkül.
A beküldött laborérték mellé **kötelező a mérőlabor és a referenciatartomány** —
mert ugyanaz a szám két laborban két különböző dolgot jelent, és a rendszer 6.
lépése épp erről szól. Referenciatartomány nélkül érkező érték `nincsKuszob`
állapotot kap, nem „normális"-t.

---

## 3. Ki felel — és amit a rendszer erről rögzít

A távoli konzultáns **véleményt ad, nem kezel**. A kezelő klinikus felelőssége nem
száll át, és ezt nem elég tudni — rögzíteni kell:

- a konzultáns kiléte és szakvizsgája
- **mit látott** (melyik felvételt, milyen minőségben)
- **mit nem tudott megítélni** — ez külön mező, nem a szöveg vége
- a kezelő klinikus **tudomásulvétele**, időbélyeggel

A negyedik nélkül a konzílium fél: adtak véleményt, és nem tudjuk, eljutott-e
oda, ahol cselekedni kellett volna. Ez ugyanaz a szerkezet, mint a riasztási
lánc nyugtázása (15. lépés).

---

## 4. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| `tele.uh.*` | `imaging.*` | a konzultáció eredménye lelet lesz — **klinikusi megerősítéssel** |
| `tele.ttctg.*` | `status.obs.ctg.*` | a görbe megítélése, a jelminőséggel együtt |
| `tele.kolp.*` | `exam.obs.colposcopy.*` | csak a **társított** kép után |
| `keres.recept` | `rx.*` | **soha automatikusan** — klinikusi kiállítással |
| `keres.vizsgalat` | `plan.*` | feladat lesz, nem időpont |
| minden `tele.*` | EESZT-dokumentum | a telekonzílium beküldendő |

---

## 5. Elfogadási kritérium

1. Kérdés nélküli konzultációkérés **nem vehető fel**.
2. A leletező meg tudja tagadni a megítélést, **megnevezett okkal**, és ez
   ugyanolyan érvényes kimenet, mint a vélemény.
3. A „korlátozottan alkalmas" válasz **megnevezi, mit nem ítélt meg**.
4. Laikus kérésből **egyetlen úton** lesz orvosi cselekmény: megnevezett klinikus
   megnevezett aktusával.
5. A TTCTG jelminősége rögzített, és **anyai pulzus-tévesztés gyanúja esetén a
   görbe nem ad megnyugtató megítélést**.
6. Külső kép karanténból csak **társítással** kerül ki.
7. Referenciatartomány nélkül érkező laborérték `nincsKuszob`, nem „normális".

---

## 6. Nyitott kérdések

- **A konzultáns szakvizsgájának ellenőrzése** — kié a felelősség? Az intézmény
  igazolja, vagy a rendszer kérdezi le? (Ma egyik sincs meg.)
- **A TTCTG jogi státusza**: diagnosztikus eszköz vagy szűrés? Ettől függ, MDR
  alá esik-e a fogadó oldal.
- **Az e-recept igénylés és az EESZT** kapcsolata: a kérés nyoma bekerüljön-e az
  országos térbe, vagy csak a kiállított recept?
- **Sürgősség.** Egy laikus tanácsadás-kérés tartalmazhat vészjelet („elfolyt a
  magzatvizem"). A szövegértelmezés itt **nem elég** — kell egy kérdéssor, ami a
  vészjeleket kérdésként teszi fel, és a rendszer nem a szabad szövegre támaszkodik.
