# Modul 29 — Perinatális, újszülött-, csecsemő- és gyermekgyógyászat

*Ahol a rendszerben megjelenik a második beteg.*

---

## A modul egyetlen szerkezeti kérdése

**Az újszülött nem az anya rekordjának egy mezőcsoportja. Külön beteg.**

Ma a rendszerben az újszülött adatai (`nb.*`, `neo.*`) az **anya esetében** élnek:
születési súly, Apgar, köldök-pH. Ez a szülés dokumentálásához helyes — a szülés
az anya ellátási eseménye —, és **minden más célra hibás**:

- A gyereknek **saját megőrzési ideje** van, és az a saját születésétől fut. Egy
  anyai rekord törlése nem viheti magával a gyerek dokumentációját.
- A gyereknek **saját beleegyezése** lesz, amikor nagykorú — és addig a
  törvényes képviselőé, aki nem feltétlenül az anya.
- A gyerek később **saját betegként** jelenik meg, és a perinatális előzménye a
  legfontosabb anamnézise. Ha az az anya rekordjában rekedt, nem érhető el.
- **És a kapcsolat maga adat.** Az anya-gyerek összerendelés a gyerek rekordjából
  azonosítja az anyát, és fordítva — örökbeadásnál, névtelen szülésnél, jogi
  vitában ez a legérzékenyebb mező az egész rendszerben.

> **A két rekord összekötése nem technikai részlet, hanem adatvédelmi döntés.**
> Amíg nincs kimondva, ki láthatja a kapcsolatot és milyen jogalapon, addig az
> összerendelés nem hozható létre. Ez a modul első kapuja.

---

## Mi van már meg

| | |
|---|---|
| `nb.*` — 9 újszülött-változó | de mind az anya esetében, és mind `nincsKuszob` |
| `neo.*` — neonatális változók | csontváz |
| `pedgyn` modul (18.) | a gyermeknőgyógyászat elve: a hiányzó adat nem „felnőtt" |
| Törlési kapuk, megőrzési horgonyok (10. lépés) | a gyerek saját horgonyához készen áll |
| ICHOM PCB v5.0 | a kimenetelkészlet az újszülöttet is méri |

---

## 1. Négy életszakasz, négy mérce

A modul nem egy „gyerek" fogalommal dolgozik. A küszöbök **életkorral és
súllyal** változnak, és a szakaszhatárok maguk is klinikai döntések:

| Szakasz | Meddig | Mi teszi mássá |
|---|---|---|
| **Perinatális** | 22. hét – 7. nap | a magzati és az újszülött-élettan átmenete |
| **Újszülött** | 0–28. nap | a felnőtt referencia semmire nem használható |
| **Csecsemő** | 29. nap – 1 év | súlyalapú dozírozás, gyors változás |
| **Gyermek** | 1–18 év | a Tanner-stádium többet mond, mint az életkor |

A rendszer eddigi legfontosabb szabálya itt **kiélesedik**: egy felnőtt
referenciatartomány gyereken nem „kevésbé pontos", hanem **rossz** — és a
`nincsKuszob` állapot most már meg tudja mondani, hogy nincs mihez mérni,
ahelyett hogy hallgatna.

---

## 2. Az újszülött első percei — a rendszer eddigi legnagyobb néma foltja

A most befejezett mérésaudit szerint **a `nb.*` csoport minden tagja néma**: sem
kritikus küszöbe, sem referenciája nincs egyiknek sem.

| Változó | Tankönyvi küszöb | Ma |
|---|---|---|
| `nb.apgar.at5` | <7 → azonnali teendő; <4 → súlyos | **hallgat** |
| `nb.cordPh` | <7,00 → jelentős acidózis; <7,20 → figyelendő | **hallgat** |
| `nb.cordBe` | < −12 mmol/l → metabolikus acidózis | **hallgat** |
| `nb.birthWeight` | súly-gesztációs kor percentilis | **hallgat** |
| `nb.ga.atBirth` | <37 hét koraszülött; <32 nagyon | **hallgat** |

Ez a modul **első kézzelfogható haszna**: ezeknek a küszöböknek a felvétele és
aláírása. Nem új tudás — a leginkább konszenzusos küszöbök az egész rendszerben.
A gép a hiányt megnevezte; a felvételük **klinikai aláírás**, mint minden más
küszöbé.

---

## 3. Súlyalapú dozírozás — ahol a számítás életveszélyt okoz

A gyermekgyógyászati gyógyszerelés a rendszer **legkockázatosabb számítása**,
mert a hiba nem érzékelhető a végén: egy 10 kg-os gyereknek szánt adag
kiszámítása 100 kg-mal ugyanúgy „szám".

Ezért a szabályok szigorúbbak, mint bárhol máshol:

1. **Aktuális súly nélkül nincs dozírozás.** Nem becsül életkorból, nem használ
   korábbi súlyt — a `validity` itt napokban mérendő, nem hónapokban.
2. **A maximális egyszeri és napi adag kemény korlát**, nem figyelmeztetés. Egy
   súlyalapú számítás felnőttdózis fölé nem mehet, akkor sem, ha a szorzás azt
   adja.
3. **A számítás mutatja a levezetést**: hány kg, hány mg/kg, mennyi jött ki. Egy
   szám indoklás nélkül itt nem ellenőrizhető.
4. **Kerekítés csak lefelé**, és a kerekítés ténye látszik.

---

## 4. A perinatális előzmény mint anamnézis

A gyerek későbbi ellátásában a perinatális adat **a legfontosabb anamnézis**, és
ma nem érhető el a gyerek rekordjából. Amit át kell vinni:

gesztációs kor · születési súly és percentilis · Apgar · köldök-vérgáz ·
újszülött-osztályos felvétel és annak oka · lélegeztetés · anyai terhességi
szövődmény (praeeclampsia, GDM, chorioamnionitis) · szülésmód ·
gyógyszerexpozíció a terhesség alatt

**És amit nem szabad átvinni**: az anyáról szóló mindent. A gyerek rekordjában az
anyai adat annyiban indokolt, amennyiben a gyerek ellátásához kell — a
pszichiátriai anamnézis, a szociális helyzet vagy a partnerkapcsolat **nem
automatikus**.

---

## 5. ExAssist a gyermekvizsgálatban

A 28. modul protokollkényszere itt kap külön súlyt: az újszülött-vizsgálatnak
(*neonatal examination*) **kötelező tételsora** van, és az abból kimaradó tétel
klasszikus mulasztás — a csípőficam, a here leszállása, a vörös reflex és a
femoralis pulzus a négy legtöbbet felrótt kimaradás.

Ezek nem „ha eszébe jut" tételek. A rendszer **nem zárhatja le** az
újszülött-vizsgálatot, amíg mind a négy nem kapott választ.

---

## 6. Védőoltások — a naptár EGY, a rekord KETTŐ

A gyermekorvosi modul **nem hoz saját oltási naptárt**. A naptár a 30. modulban
él (`registry/vedono/oltasok.json`, a 2026. évi NNK Módszertani levélből), és
mindkét oldal ugyanazt használja. Két naptárból előbb-utóbb két különböző
oltási rend lesz, és a különbségük nem tűnik fel senkinek —
`validateGyermekOltas()` ezért **build-hibává teszi** a második naptárt.

### Két ütemezés, és összekeverni őket szerkezeti hiba

A Módszertani levél kimondja: *„A kampányoltások iskolai osztályokra és nem a
tanulók életkorára vonatkoznak."*

| Ütemezés | Mihez kötött | Példa |
|---|---|---|
| `folyamatos` | **életkor** (hónap) | BCG (0), DTPa+IPV+Hib (2–3–4), PCV+Varicella (12), MMR+Varicella (15), DTPa+IPV (72) |
| `kampany` | **iskolai évfolyam** | MMR újraoltás és dTap (6. évfolyam), hepatitis B sorozat és HPV (7. évfolyam) |

**Az évfolyam nem számolható életkorból.** A beiratkozás 5 és 7 éves kor közé
esik — két év szórás —, miközben a 6. és a 7. évfolyam oltásai **egy** évre
vannak egymástól. Egy 12 éves harmadikos és egy 12 éves hatodikos nem ugyanazt
az oltást kapja.

Ezért egy **számláló**, nem egy becslés: rögzítjük, melyik tanévben kezdte a
gyermek az 1. évfolyamot, és

```
évfolyam = mostani tanév − beiratkozás tanéve + 1
```

Beiratkozási év nélkül a kampánysor **`evfolyamIsmeretlen`** — se nem esedékes,
se nem elmaradt. A hiányzó adat itt sem „nem”.

### A rekord viszont kettő

Ugyanazt a gyereket a védőnő és a házi gyermekorvos is dokumentálja, és a
beadás bármelyik oldalon történhet. Ebből három csendes hiba következik:

| | Mi történik ma | Mit tesz a modul |
|---|---|---|
| a gyermekorvos beadta | a védőnői oldal **hiányzónak** látja → behívás olyasmiért, ami megtörtént | `csakGyermekorvos` |
| a gyermekorvos **ellenjavallatot** dokumentált | a védőnői oldal **mulasztásnak** látja — miközben épp ez zárná ki a jogkövetkezményt | `csakGyermekorvos`, kiemelt indoklással |
| a két rekord **mást mond** | naiv egyesítés eltünteti: a kétszeri beadás egyetlen szép sorrá válik | `utkozes` — **mindkét bejegyzés megmarad** |

**Az egyesítés nem deduplikál.** Ütközésnél a sor nem kap esedékességi
ítéletet: egy feloldatlan ellentmondásból nem következik sem az, hogy beadták,
sem az, hogy elmaradt. A feloldás emberi.

---

## 7. Keresztfeltöltés

| Honnan | Hová | Mit |
|---|---|---|
| anyai eset `nb.*` | **gyerek rekordja** | a perinatális előzmény — az összerendelés után |
| `nb.ga.atBirth` + `nb.birthWeight` | percentilis | a 18. lépés normogramjai szerint |
| gyerek súly | `rx.*` dozírozás | **kötelező bemenet**, nem javaslat |
| Tanner-stádium | `pedgyn` (18. modul) | a vizsgálati mód innen dől el, nem életkorból |
| újszülött-vizsgálat | ExAssist protokoll | a négy kötelező tétel |

---

## 8. Elfogadási kritérium

1. Az újszülött **saját rekordot** kap, saját megőrzési horgonnyal.
2. Az anya-gyerek összerendelés **nem hozható létre** kimondott jogalap nélkül,
   és a kapcsolat megtekintése auditsor.
3. A `nb.*` küszöbök felvéve és **aláírva** — vagy `nincsKuszob` állapotot adnak,
   nem hallgatást.
4. Súly nélkül **nincs gyermekgyógyászati dozírozás**, és a levezetés látszik.
5. Az újszülött-vizsgálat nem zárható le a négy kötelező tétel válasza nélkül.
6. Felnőtt referencia gyereken **nem használható** — a rendszer inkább nem mond
   semmit, mint rosszat.
7. Az oltási naptár **egy** (a 30. modulé); a kampányoltás **évfolyamból** dől
   el, nem életkorból; a védőnői és a gyermekorvosi rekord ütközése **nem
   olvad össze**.

---

## 9. Nyitott kérdések

- **Az összerendelés jogalapja.** Névtelen szülés, örökbeadás, apasági vita —
  mindhárom eltérő láthatóságot kíván, és ez jogi döntés, nem fejlesztési.
- **Kinek a beleegyezése**, mikortól? A korlátozott cselekvőképesség
  korhatárai és a „belátási képesség" megítélése — a 18. modul ezt már
  felvetette, itt eldöntendő.
- **Melyik növekedési görbe**: WHO vagy hazai? Ez a 18. lépés kérdése (idegen
  populáció idegen választ ad), most a gyerekekre.
- **Melyik oltási rekord a hiteles?** Ma Magyarországon ennek az EESZT-nek
  kellene lennie. Amíg nincs kimondva, a modul csak jelzi az ütközést —
  feloldani nem tud, és nem is szabad neki.
- **Az oltási naptár aláírása.** A Módszertani levél **évente** új kiadást kap,
  és az aláírás a naptár magjához köt: az új kiadás elavulttá teszi. Ki írja
  alá, és milyen határidővel az új levél megjelenése után?
- **Meddig tart a modul?** A 18 év felső határ, de a serdülőgyógyászat átfedésben
  van a nőgyógyászattal — a `pedgyn` és e modul határa kimondandó.
