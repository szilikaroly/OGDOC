# Modul 11 — Műtő modul

| | |
|---|---|
| **Cél** | A perioperatív folyamat teljes dokumentációja: elő-, intra- és posztoperatív |
| **Forrás** | ÚJ (az IPRACS VTE- és transzfúziós modulja a mag) |
| **Becsült változó** | ~110 |
| **Fázis** | 5 |
| **Függ** | 03, 04, 05, 06, 10 |

## Mi van már meg az IntuiCare-ben

**A műtéti erőforrás-tervezés teljesen kész**: `or_suites`, `or_resources`, `or_room_profiles`, `or_blocks`, `or_staff_pool`, `surgery_types`, `surgery_cases` (becsült időtartam, poszt-op ápolási perc, prioritás, szükséges szerepek, jóváhagyás, tervezett és tényleges idők), `surgery_case_assignments`, `case_resource_requirements`, `incompatibilities` — `/muteti-terv/*` route-okkal. **Nincs meg a klinikai tartalom**: WHO checklist, strukturált műtéti leírás, ASA, VTE-profilaxis.

## 1. Három szakasz

### 1.1 Preoperatív (`op.pre.*`)

| Változó | Megjegyzés |
|---|---|
| `op.pre.indication` | kódolt indikáció (nem szabad szöveg) |
| `op.pre.urgency` | elektív · sürgős · azonnali (császármetszésnél: Grade 1–4) |
| `op.pre.asa` | ASA fizikai státusz I–VI |
| `op.pre.fasting` | utolsó étkezés/ivás időpontja |
| `op.pre.allergy` | `mirror` a `03`-ból |
| `op.pre.anticoag` | jelenlegi antikoaguláns + utolsó dózis időpontja |
| `op.pre.bloodProducts` | vércsoport, ellenanyagszűrés, kereszt, előkészített egységek |
| `op.pre.consent` | tájékozott beleegyezés, dátum, ki adta |
| `op.pre.vteRisk` | **computed** — Caprini + RCOG GTG 37a |
| `op.pre.antibioticProphylaxis` | szer, dózis, időzítés (bemetszés előtt 30–60 perc) |

### 1.2 Intraoperatív (`op.intra.*`)

- **WHO Surgical Safety Checklist** — három fázis (sign in / time out / sign out),
  mindegyik tétel külön változó, kipipálás időbélyeggel
- Anesztézia: típus (általános / spinális / epidurális / kombinált), szerek, szövődmény
- Műtéti leírás **strukturáltan**: behatolás, lelet, elvégzett beavatkozás lépésenként,
  zárás, drén
- Vérvesztés (becsült és **kvantitatív — QBL**), transzfúzió
- Idők: bemetszés, magzat kiemelése (CS-nél), zárás vége
- Szövődmény: kódolt lista + narratíva

### 1.3 Posztoperatív (`op.post.*`)

VTE-profilaxis (típus, dózis, kezdés időpontja), fájdalomcsillapítási terv, mobilizáció,
sebellenőrzés, drénváladék, lázmenet, korai szövődmény, elbocsátási kritériumok.

## 2. Császármetszés — saját sablon

A leggyakoribb szülészeti műtét, és a kimenetel-modullal (`15`) közvetlenül összekötött.
Külön mezők: bemetszés típusa (Pfannenstiel / medián), uterotomia (alsó harántmetszés /
klasszikus / T), placenta eltávolítás módja, méhösszehúzó szerek, adhéziók, előző CS-heg
állapota (**a következő terhesség VBAC-kockázatának bemenete**).

## 3. VTE-kockázat

Caprini-score + RCOG GTG 37a. LMWH dozírozás: standard 40 mg qd; **BMI ≥ 35 esetén
0,5 mg/kg q12h** (Overcash 2015 RCT, *J Perinatol*, PMID 26658126).

Bemenetek nagyrészt már megvannak: `hx.sys.thrombophilia`, `hx.sys.aps`, `hx.sys.prevVTE`,
`anthro.bmi`, `ctx.age`, `hx.life.smoke`, `hx.repro.ivf`, `hx.sys.cardiac`.

## 4. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` (allergia, antikoaguláció, thrombophilia, korábbi műtétek), `05`
(labor: Hb, PLT, INR, vércsoport), `10` (sürgős CS indikációja), `06` (jelenlegi gyógyszerelés).

**⇨ Mit tölt fel**: `09` epikrízis · `14` zárójelentés · `15` kimenetel · `17` **OENO-kódolás**
(a beavatkozás közvetlenül képződik le a 650 tételes EESZT OENO-törzsre) · `03` a következő
terhességnél (a CS-heg állapota `prefill`-lel visszaköszön)

## 5. Elfogadási kritérium

A WHO checklist mindhárom fázisa kitöltetlen állapotban **blokkolja a műtéti leírás lezárását**,
és az elvégzett beavatkozásból automatikusan képződik OENO-kódajánlás.

> **Ez teszt, nem ígéret:** [`test/muto.test.ts`](../../test/muto.test.ts).

## 6. Nyitott kérdés

~~A műtéti leírás strukturáltsága és a szabad szöveg aránya vitatható.~~ **Eldőlt: a javaslat
szerint.** A váz kódolt és kereshető (behatolás, beavatkozás, uterotomia, szövődmény), a
részletek szabad szövegben (`op.intra.findings`, `.steps`, `.closure`). A kereshetőséghez a
váz elég, és a szabad szöveg nem lassítja a rögzítést ott, ahol a klinikai tartalom úgyis
egyedi.

### Új nyitott kérdés, amit a megvalósítás hozott elő

**Az RCOG GTG 37a tételsora hiányos.** Húsznál több kockázati tételből hat van bekötve, és a
pontértékek nincsenek visszaellenőrizve. Ezért a rendszer a tényezőket sorolja fel, nem
összesített pontszámot ad — de ez NYITOTT FELADAT, nem lezárt döntés, szemben a postpartum
pszichózis kockázatával. A különbség számít: egy hiányzó tétel (ikerterhesség, hosszú utazás)
a küszöb alatt tarthatja a beteget, aki fölötte lenne.
(ld. [`../fejlesztes/18-muto.md`](../fejlesztes/18-muto.md) 5.)

---

## Ágykezelés és műtőbeosztás — `core/fekvo/agy.ts`, `core/op/muto.ts`

A modul eddig a WHO-ellenőrzőlistát és az OENO-javaslatokat tudta; **ágy- és
műtőkezelés nem volt** — a `core/fekvo` a NEAK-jelentés, nem az osztály
működése.

### Az ágy: ahol a „szabad" három dolgot jelent

| Állapot | Mikor |
|---|---|
| `kiadhato` | üres **és** kiadható |
| `foglalt` | beteg van rajta |
| `nemKiadhato` | üres, de **megnevezett** okkal nem adható ki (takarítás, elkülönítés, meghibásodás) |
| `fenntartva` | oda van ígérve — **lejárattal**, különben a kapacitás csendben fogy |
| `ismeretlen` | **nem tudjuk — és ez nem „szabad"** |

A kapacitás-kimutatás megmondja a saját megbízhatóságát: *„0 kiadható ágy — DE
4 ágy állapota ismeretlen, tehát a valódi szám 0 és 4 között van."*

**A szülészeti ágyon két beteg fekszik.** A rooming-in ágy az anyát *és* az
újszülöttet tartja — a 29. modul már kimondta, hogy az újszülött **külön
beteg**. Egy „egy ágy = egy beteg" modell minden szülészeti osztályon rosszul
számol, és épp a legérzékenyebb ponton: ha az újszülött nem foglal helyet a
nyilvántartásban, nem is látszik, hogy ott van.

**Az áthelyezés egy művelet, nem két esemény.** A köztes állapot (`uton`)
látható, és addig **egyik** ágy sem adható ki. Két külön esemény rögzítésével a
beteg vagy két ágyat foglalna, vagy egyiket sem — és az utóbbi a rosszabb, mert
a keresésben eltűnik. A validáló ezért hibának veszi, ha egy beteg két ágyon
szerepel.

### A műtő: ahol a kihasználtság maximalizálása maga a hiba

Egy általános műtőbeosztó célja a kihasználtság. **Szülészeten ez hibás cél.**

Az 1. kategóriájú császármetszésnél a döntéstől a gyermek megszületéséig eltelt
idő — a *decision-to-delivery interval* — **30 perc**. Ez nem célszám a
minőségjelentésben: ha nincs szabad műtő, az intervallum nem tartható, és a
késés következménye nem kellemetlenség, hanem hypoxia.

> **A műtő nem foglalható tele.** Egy kapacitásrészt fenn kell tartani a
> sürgősségnek, és az **nem elektív foglalásra való** — akkor sem, ha éppen
> üres.

Ezért a foglalásnál a kérdés nem az, hogy „van-e szabad idő", hanem hogy
**„marad-e sürgősségi tartalék"**. Az elektív foglalás, ami az utolsó tartalékot
fogyasztaná, elakad; megnevezett felelőssel felülbírálható, magától nem. A
sürgős beavatkozás **sosem** akad el a tartalékon — a tartalék éppen érte van.

**Mekkora a tartalék: szervezeti döntés, és aláírásra vár.** Az egy műtős és a
három műtős osztályon más a válasz. Amíg nincs aláírva, **elektív foglalás
egyáltalán nem indul** — egy alá nem írt tartalék az első zsúfolt napon elfogy,
és utólag senki nem tudja megmondani, ki döntött így.

A határidő mérése külön: `tartva` · `tullepve` · `nincsHatarido` ·
**`nemMerheto`**. Hiányzó döntési időpontnál az eredmény **nem** „tartva" — a
döntés ideje az, amit a leggyakrabban utólag írnak be.

*(A hiányt egy licenc nélküli tár, az `obnexus-project` működési
területfelsorolása mutatta ki. Átvéve onnan semmi nem lett; a megvalósítás nem
követi az ügynök logikáját, ahol a természetes nyelvű felület közvetlenül ír az
adatbázisba, és ezzel megkerüli azt a réteget, ahol a kapuk vannak.)*
