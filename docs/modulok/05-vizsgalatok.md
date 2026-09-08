# Modul 05 — Vizsgálatok

| | |
|---|---|
| **Cél** | Minden diagnosztikus vizsgálat strukturált rögzítése: labor, EKG, ultrahang, képalkotás, szűrés |
| **Forrás** | v16 (labor, ultrahang, EKG) + IPRACS (labor SSOT) + ÚJ |
| **Becsült változó** | ~520 — a legnagyobb modul |
| **Fázis** | 2–4 |
| **Függ** | 02, 03, 04 |

Öt alszekció, saját belső szerkezettel. Mindegyikre igaz: a **lelet nem szabad szöveg**.
Strukturált mezők + egy `narrative` mező a kiegészítésre, nem fordítva.

---

## Mi van már meg az IntuiCare-ben

A `clinical_observations` `category: "laboratory"` ága és a `fhir-codes.ts` LOINC-katalógusa a labor alapja; a `scores.ts` hozza a **CKD-EPI 2021**-et, a `klinika.eszkozok.vergaz` a vérgáz-értelmezőt. Az `obstetric_partograms` a szülészeti idősort. **Nincs meg**: a terhességi trimeszter-referenciák, az ultrahang-modul normogramokkal, az EKG-modul és a képalkotó sablonok.

## 5.1 Laboreredmények (~180)

### Alcsoportok

| Alcsoport | Forrás | Tartalom |
|---|---|---|
| Általános | v16 `LABF` (13) + IPRACS `lab-*` (30) | vérkép, máj, vese, ion, koaguláció, gyulladás |
| Mikrobiológia és szerológia | ÚJ | GBS, TORCH, hepatitis B/C, HIV, syphilis, chlamydia, hüvelyflóra, tenyésztés + rezisztencia |
| Endokrin | v16 `ENDO` + IPRACS pajzsmirigy | TSH, fT4, fT3, TRAK, anti-TPO, AMH, FSH/LH, E2, PRL, tesztoszteron, DHEAS, 17-OHP, kortizol, OGTT, HbA1c |
| Genetika | **→ `23` modul** | kariotípus, NIPT, CMA, panel/WES, hordozószűrés, thrombophilia-panel, farmakogenetika. **A leletek tárolása itt, de a tanácsadási kapu, a szűrés/diagnosztika elválasztása és a variánskezelés a [23. modulé](23-genetika.md)** |
| Mikrobiom | ÚJ | hüvelyi mikrobiom (CST I–V), bélmikrobiom — **kutatási státusszal jelölve** |

### Minden labortétel szerkezete

```jsonc
{
  "id": "lab.plt",
  "datatype": "quantity", "unit": "10*9/L",
  "domain": { "min": 0, "max": 1500, "critical": [50, null] },
  "reference": {
    "nonpregnant": [150, 400],
    "pregnancy.t1": [150, 400],
    "pregnancy.t2": [140, 380],
    "pregnancy.t3": [120, 350]
  },
  "validity": { "ambulatory": "P30D", "labour": "PT6H" },
  "standards": { "loinc": "777-3" },
  "consumers": ["score.fullpiers", "score.isth-dic", "rule.hellp",
                "rule.anesthesia.contraindication", "calc.transfusion"]
}
```

**A trimeszterre bontott terhességi referencia a v16-ból hiányzik, és klinikailag jelentős.**
A kreatinin, a thrombocyta, a fT4 és a fibrinogén terhességi normálértéke más, mint a
nem terhesé. Egy „normális" 110-es thrombocyta a 3. trimeszterben nem ugyanaz, mint nem
terhesen.

### Kritikus küszöbök, amelyek riasztást váltanak

| Változó | Küszöb | Következmény |
|---|---|---|
| `lab.plt` | ≤ 100 | HELLP-gyanú |
| `lab.plt` | < 80 | **neuraxiális anesztézia kontraindikáció** |
| `lab.ast` | ≥ 70 | HELLP |
| `lab.ldh` | > 600 | HELLP |
| `lab.fibrinogen` | < 200 mg/dL | **MTP-trigger terhességben** (a nem terhes küszöbnél magasabban) |
| `lab.tsh` | < 0,1 + `lab.ft4` > 22 | thyroid storm mérlegelése (Burch-Wartofsky) |
| `lab.trak` | ≥ 3 IU/L | Graves + fetális hyperthyreosis veszélye |
| `lab.lactate` | ≥ 2 mmol/L | szepszis-protokoll |

### Keresztfeltöltés

A labor a rendszer legaktívabb „feltöltő" modulja:

| Cél | Mit ad |
|---|---|
| fullPIERS | `plt`, `cr`, `ast` (+ `ctx.ga`, `vitals.spo2`, dyspnoe) |
| sFlt-1/PlGF | `sflt`, `plgf` → arány, GA-függő értelmezéssel |
| ISTH DIC | `plt`, `pt`, `pt-control` → PT ratio, `fibrinogen` |
| Transzfúzió | `hb`, `plt`, `inr`, `fibrinogen` (AABB 2023) |
| Inzulin modul | `glucose` — **csak ha DM/GDM aktív az anamnézisben** |
| Pajzsmirigy | `tsh`, `ft4`, `ft3`, `trak`, `antitpo` — automatikus riasztással |
| `17` BNO | a v16 labor-vezérelt súlyossági kódolása (`bnoObs`, 1922 tétel) |

---

## 5.2 EKG (~40)

**Ez a modul már kész a v16-ban** (10c szekció, `window.__ekg` API: `axis`, `qtc`, `sgarbossa`,
`summary`), és 2026-09-01-én vissza lett ellenőrizve — hét összevetésből hét egyezik. Az
OGDOC-ba **portolás** megy, nem fejlesztés.

Az `ekg.xlsx` 296 képletének portja, 12 elvezetéssel. Tartalom: ritmus, frekvencia, tengely,
intervallumok (PR, QRS, QT, QTc), P/Q/R/S/T morfológia elvezetésenként, Sgarbossa-kritériumok,
S1Q3T3.

### Négy hiba a munkafüzetben, amit a modul szándékosan másképp csinál

| # | Hol | Mi a hiba |
|---|---|---|
| 1 | `Q` lap, 3–13. sor | Elcsúszott átváltó-hivatkozás (`G3=F5*E3`), pedig csak `F3` és `F4` létezik. Az I. elvezetésen kívül minden Q-érték 0. |
| 2 | `R!G8` | `IF("V1S">F8,…)` — szöveget hasonlít számhoz, nincs `else` ág. A V1 R-amplitúdó küszöbe soha nem jelez. |
| 3 | `QRS!A20` | `#N/A` |
| 4 | `EKG!I29` | S1Q3T3: `S!G2` mV-ban, `Q!E4` kiskockában — a küszöbök nem összemérhetők. |

A modul minden mértéket a beállított papírsebesség és érzékenység szerint vált át, és kiírja,
hogy eltér. A 4. hibánál a következtetés ugyanaz, de a modul Q(III.)-at helyesen 0,3 mV-ként
írja ki a munkafüzet „3"-a helyett — **más bemenetnél ezért el fog térni, és ez a kívánt
viselkedés.**

### Portoláskor javítandó

A lead-objektumokból hiányzik a `qrsPol` kulcs az inicializálásnál. Az `axis()` ezt olvassa; ma
működik, mert az értékadás létrehozza, de a regiszter úgyis kikényszeríti a teljes deklarációt.

### 5.2.1 Kép- és szkennelés-alapú EKG-felismerés — új

> **K4 eldőlt:** a modult teszteljük, **és kiegészítjük kép-alapú felismeréssel**. Ez a
> rendszer első valódi gépi látás komponense, és ezért külön szabályozási következményekkel
> jár (`../megfeleles/09-mdr.md` 6.).

**A probléma, amit megold:** a 12 elvezetéses EKG ma papíron, szkennelve vagy fotózva
érkezik. Az értékeléshez a klinikus **kézzel írja be** az amplitúdókat és az intervallumokat
— lassú, hibalehetőség, és a `11-strukturalt-adat.md` szerint elveszett adat.

#### A feldolgozási lánc

```
bemenet: fotó · szkennelt kép · PDF · natív DICOM waveform
   │
   ├─ 1. Előfeldolgozás      perspektíva- és dőléskorrekció, kontraszt, zajszűrés
   ├─ 2. Rácsdetektálás      a kiskocka mérete → PAPÍRSEBESSÉG és ÉRZÉKENYSÉG kalibrálás
   ├─ 3. Elvezetés-szegmentálás   a 12 elvezetés elkülönítése, feliratok felismerése
   ├─ 4. Görbe-kinyerés      a hullámforma digitalizálása elvezetésenként
   ├─ 5. Fiduciális pontok   P, Q, R, S, T; intervallumok és amplitúdók
   └─ 6. Betáplálás          → a MEGLÉVŐ 296-képletes motor
```

**A 6. lépés a lényeg:** a felismerés **nem értékel**. A digitalizált mérési értékeket adja
át a már meglévő, a munkafüzet teszteseteivel visszaellenőrzött motornak. Így a klinikai
logika egyetlen helyen marad, és a kép-alapú út nem hoz be párhuzamos értékelést.

#### A kalibrálás a kritikus pont

A rácsdetektálásból jön a papírsebesség (mm/s) és az érzékenység (mm/mV). **Ha ez téved,
minden érték téved** — arányosan, tehát a hiba nem feltűnő. Ezért:

| Szabály | Miért |
|---|---|
| A detektált kalibráció **megjelenik és megerősítendő** | a néma hibás skálázás a legveszélyesebb kimenet |
| Ha van kalibrációs jel a felvételen, azt is méri, és **eltérésnél figyelmeztet** | keresztellenőrzés |
| Kézi felülbírálás mindig lehetséges | |

#### Emberi felügyelet — kötelező, nem opcionális

| Szabály | Indoklás |
|---|---|
| A gépi olvasat **javaslat**, `provenance: "derived"`, `confidence` értékkel | AI-rendelet: emberi felügyelet |
| **A klinikus elvezetésenként megerősíti vagy javítja**, mielőtt az érték rögzül | a téves felismerés következménye klinikai |
| A megerősített érték `provenance: "clinician"` lesz | a precedencia-szabály szerint |
| A digitalizált görbe **a kép mellett jelenik meg**, egymásra vetítve | vizuális ellenőrizhetőség |
| Alacsony bizonyosságnál a rendszer **nem ad értéket** | „nincs néma helyettesítés" |
| Az eredeti kép **megőrzendő** | az audit-nyom része; a felismerés újrafuttatható |

#### Bemeneti minőség és elutasítás

Elfogadási kritériumok: felbontás, a rács láthatósága, teljes 12 elvezetés, olvasható
kalibráció. Ami nem felel meg, azt a rendszer **elutasítja** — nem „megpróbálja".

#### Tárolás DICOM-mal

A `08-interoperabilitas.md` 3.4 szerint: az eredeti kép mint DICOM kép vagy encapsulated PDF,
a digitalizált hullámforma **DICOM Waveform** alakban, a mérések **DICOM SR**-ben. Így az
EKG ugyanazon a csatornán él, mint a képalkotás, és a natív digitális EKG-készülékek
kimenete **közvetlenül** feldolgozható — kép-felismerés nélkül.

> **A cél hosszabb távon a natív DICOM waveform**, a kép-alapú felismerés az átmenet a
> papíralapú gyakorlatból. Ezt érdemes kimondani, mert befolyásolja, mennyit érdemes a
> felismerésbe fektetni.

#### Szabályozási következmény

Ez **AI-komponens egy MDR-eszközben**: a `megfeleles/09-mdr.md` 6. pontja szerint
nagy kockázatú besorolás alá eshet. Ami ebből következik a tervre:

- **adatkormányzás**: a tanító- és tesztkészlet összetétele, reprezentativitása,
  torzításai dokumentálva (különböző készülékek, papírminőségek, fotózási körülmények)
- **teljesítménymutatók**: elvezetésenkénti mérési hiba, kalibrálási pontosság, elutasítási
  arány — és ezek **elkülönített teszthalmazon**, nem a tanítón
- **PROBAST+AI / TRIPOD+AI** szerinti értékelés és jelentés
- **naplózás**: minden felismerés bemenete, kimenete és emberi javítása auditálva — ez
  egyben a folyamatos javítás adatforrása is

#### Elfogadási kritérium

1. Egy szkennelt 12 elvezetéses EKG-ból a rendszer kinyeri a kalibrációt, és **megerősítést
   kér** rá.
2. A digitalizált görbe a képre vetítve megjelenik, elvezetésenként ellenőrizhetően.
3. A klinikusi megerősítés **nélkül** egyetlen érték sem kerül a `clinical_observations`-be.
4. Alacsony bizonyosságnál a rendszer nem ad értéket, hanem jelzi, mi olvashatatlan.
5. Az eredeti kép és a felismerés kimenete visszakereshető, a felismerés újrafuttatható.

---

## 5.3 Ultrahang (~190)

A v16 ultrahang-modulja **a legjobban megépített része az egész meglévő eszközkészletnek**, és
az OGDOC generikus vizsgálat-sablonjának mintája lesz.

### Amit örökölünk (v16/4)

- **Vizitsoros biometria** dátummal és terhességi héttel — nem egyetlen pillanatkép
- **16 egyszeres paraméter**: CRL, BPD, HC, AC, FL, HL, EFW, NT, AFI, legmélyebb tasak, FHR,
  a. umbilicalis PI, a. cerebri media PI, CPR, ductus venosus PI
- **6 páros paraméter** (jobb + bal, egy ábrán): a. uterina PI, vese hossz, oldalkamra átmérő,
  femur, humerus, orbita
- **SVG-görbék** vizitek között
- **Publikációból tölthető normogram** táblázatos és képlet módban, forrásmegjelöléssel
- **Percentilis + z-érték + P10/P90 kockázatjelzés**

### Alszekciók

| Alszekció | Alap | Tartalom |
|---|---|---|
| Nőgyógyászati | ÚJ | uterus, endometrium-vastagság és -jelleg, ovariumok, AFC, Doppler, myoma-térkép, patológia |
| Koraterhesség | v16 | GS, YS, CRL, szívműködés, lokalizáció, subchorialis haematoma |
| I. trimeszter | v16 | NT, orrcsont, ductus venosus, tricuspidalis regurgitáció, a. uterina PI, FMF-kockázat |
| II–III. trimeszter | v16 | teljes biometria, Doppler (UA, MCA, CPR, DV), AFI/SDP, részletes morfológia, placenta |
| Szülőszoba | IPRACS | beszállás, pozíció, magzatvíz, sürgős biometria |
| Magzati echokardiográfia | ÚJ | szegmentális analízis, 4 üreg, kiáramlási pályák, 3 ér + trachea, ritmus |
| POCUS / eFAST | ÚJ | FAST 4+2 régió, tüdő-B-vonalak, IVC-kollapszus, TTE-alap |
| Kardiológiai | ÚJ | kamraméretek, EF, billentyűk, PAPs, aortagyök — **a CARPREG II bemenetei** |
| Has, kismedence, nyak | ÚJ | |
| Emlő | ÚJ | BI-RADS |
| Kontrasztos HSG (HyCoSy/HyFoSy) | ÚJ | tubaátjárhatóság, cavum alakja, peritoneális szóródás |

### Számítások

| Számítás | Képlet / forrás |
|---|---|
| `us.efw` | Hadlock-4 (BPD/HC/AC/FL) |
| `us.percentile` | a betöltött normogramból, z-értéken keresztül |
| `us.cpr` | `mca.pi / ua.pi` — `computed` |
| `us.ga.crl` | CRL → gesztációs kor, a `ctx.ga` egyik forrása |

**A normogram-motor általánosítása:** bármely mérhető paraméterhez rendelhető publikációból
származó referencia, forrásmegjelöléssel. Ez nem csak magzati biometriára igaz — a
kardiológiai és a nőgyógyászati méretek is normogramot kapnak.

---

## 5.4 Képalkotás — RTG, CT, MR (~70)

| Alszekció | Külön sablon |
|---|---|
| RTG / mRTG | vetület, lelet strukturáltan |
| HSG | cavum alakja, tubák külön, peritoneális szóródás |
| CT | protokoll, kontraszt, régiónkénti lelet |
| MR — felnőtt | szekvenciák, régió |
| MR — **magzati** | indikáció, biztonsági ellenőrzőlista, szekvenciák, GA |

### Kötelező mezők mindegyiknél

- **indikáció** (szabad szöveg nem elég — kódolt indikációlistából)
- **terhességi státusz** a vizsgálat idején
- **sugárterhelés** (mSv) — halmozódik az esetre
- **kontrasztanyag terhességi és szoptatási besorolása**

### Hard-stop

Terhes betegnél sugárterheléses vizsgálat kérésekor **megerősítő párbeszéd**, az IPRACS
kontraindikáció-kapu mintájára: mi az indikáció, van-e sugármentes alternatíva, és a döntés
indoklása bekerül a dokumentációba. Ez nem tiltás — terhességben is van jogos CT-indikáció —,
hanem kikényszerített mérlegelés.

---

## 5.5 Szűrővizsgálatok (~40)

| Szűrés | Időzítés |
|---|---|
| Cervixszűrés (cytológia + HPV) | életkor és korábbi lelet szerint |
| Emlőszűrés | életkor és rizikó szerint |
| GDM (OGTT) | 24–28. hét; rizikó esetén **16–18. hét**, majd ismétlés |
| Preeclampsia I. trimeszteri szűrés | 11–13+6. hét |
| Aneuploidia (NT, kombinált teszt, NIPT) | 11–13+6. hét |
| GBS | 35–37. hét |
| Thyreoidea | rizikó szerint, trimeszterenként |
| Mentális (Whooley, EPDS) | felvételkor, 3. trimeszterben, postpartum |

**A modul esedékességet számol**, nem csak rögzít: a beteg életkorából, rizikófaktoraiból és a
korábbi szűrések dátumából megmondja, mi esedékes most. Ez `computed` levezetés, és a
teendőlistába kerül.

Példa a láncra: `hx.repro.gdm` (korábbi gesztációs diabetes) → korai OGTT esedékessé válik a
16–18. héten → a teendőlistában megjelenik → elvégzés után az eredmény a `lab.ogtt`-be kerül →
onnan a GDM-diagnózis és a `17` BNO O24.4 kódajánlás.

---

## Elfogadási kritérium

Egy preeclampsia-eset végigvihető úgy, hogy a **fullPIERS a laborból és a vitálisokból magától
feltöltődik**, és ha az AST hiányzik, `insufficient`-et ír ki a hiányzó mező megnevezésével —
nem nullát. Az ultrahang-normogram publikációból betölthető, és a betöltött referencia forrása
a leleten megjelenik.

> **Ez teszt, nem ígéret:** [`test/modul05-elfogadas.test.ts`](../../test/modul05-elfogadas.test.ts).
> A modul nem tud úgy változni, hogy a kritérium elromoljon anélkül, hogy a build elszállna.

## Nyitott kérdések

1. **A mikrobiom-alszekció kutatási státuszú.** Nincs klinikai konszenzus a hüvelyi mikrobiom
   terápiás következményeiről; a modul rögzít és exportál, de **nem javasol**.
2. Az `ekg.xlsx` legördülő listáinak értékkészletét egyeztetni kell (az openpyxl nem tudta
   kiolvasni, a választható értékek a képletekből lettek visszafejtve).
3. ~~A trimeszterre bontott labor-referenciák forrását ki kell jelölni.~~ **Eldőlt:**
   Abbassi-Ghanavati és mtsai, Obstet Gynecol 2009;114:1326-1331. A készlet a
   regiszterben `verification: "assumed"` szinten áll — a számok az elsődleges
   táblával még nincsenek összevetve, és ezt a validátor egy összesített
   figyelmeztetésben ki is mondja. A visszaellenőrzés önálló, nyitott feladat.
   (ld. [`../fejlesztes/13-referenciatartomanyok.md`](../fejlesztes/13-referenciatartomanyok.md))
