# Modul 15 — Utánkövetés

| | |
|---|---|
| **Cél** | Anyai és újszülött kimenetel követése az ICHOM időzítése szerint |
| **Forrás** | **ICHOM PCB v5.0** (importálva) + IPRACS (újszülött modulok) |
| **Becsült változó** | ~90 |
| **Fázis** | 4 |
| **Függ** | 10, 11, 13 |

## Mi van már meg az IntuiCare-ben

**Az utánkövetési motor kész**: `followup_protocols` (`anchor_event`, `default_window_days`), `followup_protocol_steps`, `followup_enrollments`, `followup_occurrences`, `/admin/followup` és `/portal/utokovetes` route-okkal. Mellette `monitoring_programs`, `monitoring_thresholds`, `monitoring_alerts` a küszöb-alapú követéshez, és `measurements` + `wearable_data` a beteg-oldali méréshez. **Az ICHOM kimeneti változók és az újszülött-modulok (NRP, hipoglikémia, LATCH, NOWS) adatként, illetve új kódként jönnek.** Figyelem: a `monitoring_thresholds` motorban **BUG-009 (P0)** nyitott.

## 1. Az ICHOM időzítése vezeti

A PCB v5.0 négy mérési pontot definiál, és ez adja a modul vázát:

| Időpont | Mit mérünk |
|---|---|
| `Entry to prenatal care` | kiindulási adatok, demográfia, anamnézis, PROM-alapvonal |
| `3rd trimester` | dohányzás/alkohol/drog ismétlése, PROM |
| **`42 days postpartum`** | a fő kimeneti mérés — anyai és újszülött |
| `6 months postpartum` | szoptatás, mentális, szerepátmenet |

## 2. Klinikai kimeneti változók (ICHOM)

| ICHOM | Változó | Mit rögzít |
|---|---|---|
| PCB023 | `CONANOMALY` | veleszületett rendellenesség |
| PCB024 | `FACTYPE` | az ellátó intézmény típusa |
| PCB025 | `DEVTYPE` | **szülés módja** |
| PCB026 | `MATERNALDEATH` | anyai halál (dátum) |
| PCB027 | `STILLBIRTH` | halvaszületés |
| PCB028 | `NEODEATH` | újszülöttkori halál |
| PCB029 | `ICUADMIT` | anyai intenzív ellátás igénye |
| PCB030 | `MLOS` | anyai ápolási idő |
| PCB031 | `READMIT` | késői anyai szövődmény / újrafelvétel |
| PCB032 | `TRANS` | transzfúzió |
| PCB033 | `SPRETERM` | spontán koraszülés |
| PCB034 | `IPRETERM` | iatrogén koraszülés |
| — | `OXYGENDEP` | oxigénfüggőség |
| PCB035 | `NLOS` | újszülött ápolási idő |
| PCB036 | `BIRTHINJ` | születési sérülés |

Ezekhez jönnek a szülészeti részletek, amiket az ICHOM nem bont: perineális sérülés foka
(I–IV, OASIS), cervikális sérülés, APGAR 1/5/10 perc, köldökzsinór-pH, születési súly és
percentilis, vérvesztés (QBL).

## 3. Újszülött-modulok (IPRACS)

| Modul | Forrás | Kulcs |
|---|---|---|
| **NRP 8. kiadás** | AAP/AHA 2021 | súlyalapú epinephrin: `súly_kg × 0,02 mg` IV; volumenbolus `súly_kg × 10 mL` NS; PPV 40–60/perc, PIP 20–25 cmH₂O, PEEP 5, FiO₂ 21% term / 21–30% preterm |
| **Neonatális hipoglikémia** | AAP 2011 (Adamkin), PES 2015, Sugar Babies RCT (Harris 2013, *Lancet* 382:2077) | 40% dextróz gél 0,5 mL/kg buccalisan |
| **LATCH** | Jensen, *JOGNN* 1994;23:27, PMID 8176525 | **≤ 5 bármikor → IBCLC konzultáció**; ≤ 6 a 48. életóránál → vörös zászló |
| **NOWS / ESC-NOW** | Young, *NEJM* 2023;388:2326, N=1305 | LOS −6,7 nap, farmakoterápia RR 0,44 |

### ESC-NOW funkcionális értékelés — elsőként, a Finnegan előtt

Három kérdés: eszik ≥ 30 mL/etetés · alszik ≥ 1 óra zavarás nélkül · megnyugtatható 10 percen
belül. **Ha mind a három igen → farmakoterápia NEM szükséges.** Nem-farmakológiai csomag:
rooming-in, bőr-bőr, szoptatás, cumi, alacsony stimuláció.

Farmakoterápia küszöb: 3 egymást követő Finnegan ≥ 8, VAGY 2 egymást követő átlag ≥ 11.
Első vonal: morfin 0,04 mg/kg PO q3–4h. Onset: heroin/buprenorfin 24–48h; metadon 48–72h
(akár 5–7 nap) — **ez a megfigyelési idő hossza szempontjából döntő.**

## 4. Keresztfeltöltés

**⇦ Mi tölti fel**: `10` szülőszoba (a szülés lefolyása, QBL, szövődmény), `11` műtő,
`13` vizitrend (mikor esedékes a kontroll), `03` (kiindulási állapot).

**⇨ Mit tölt fel**: `16` betegelégedettség (ugyanaz a mérési pont) · `17` kódolás ·
`18` minőségbiztosítás (a Robson-osztályozás és a kimenetel-mutatók bemenete) ·
**ICHOM-export**.

## 5. Elfogadási kritérium

A 42. napos mérési pont kitöltése után az eset **ICHOM PCB v5.0-kompatibilis exportot ad**,
azonosító nélkül, és az export mellé kiíródik, mely kötelező változók maradtak üresen.

> **Ez teszt, nem ígéret:** [`test/utankovetes.test.ts`](../../test/utankovetes.test.ts).

A „mely változók maradtak üresen” lista **hét kategóriára** bomlik, mert egyetlen listába téve
három különböző problémát mosna össze — és mindhármat MÁS EMBER javítja: a hiányzó ADAT
(a beteget kell megkérdezni), a hiányzó MEZŐ (fejleszteni kell), és a szándékosan nem gyűjtött
tétel (döntés, nem hiba). Ehhez jön a feltételes tétel, amit géppel nem lehet kiértékelni, az
ellenőrzötten be nem következett esemény, és a kihagyott azonosító.

## 6. Nyitott kérdés

~~Az utánkövetés a gyakorlatban azon bukik el, hogy a beteg nem jön vissza. A modul tud
esedékességet számolni és emlékeztetőt generálni, de az adatgyűjtés csatornája a webes fázis
kérdése.~~ **Eldőlt: a csatorna marad a webes fázisé, de a KÖVETKEZMÉNYE nem.**

A csatorna hiánya technikai korlát. Az viszont, hogy mi történik a vissza nem térő beteggel,
tervezési döntés — és ez a modul legfontosabb szabálya:

**AZ ELMULASZTOTT MÉRÉSI PONT NEM TŰNIK EL.** A lezárult ablak `overdue` marad: nem lesz belőle
sem „kész”, sem „nem esedékes”. A `done` állapot az ADATTÓL függ, nem az időtől, és horgony
(`nb.birth.at`) nélkül a pont `unknown`, nem „nem esedékes”.

**Mert ez a NEVEZŐ.** Ha a kimeneteli mutatókat csak a visszatérő betegekből számoljuk, a mutató
az intézményt hízelgi: aki rosszul járt, gyakrabban nem jön vissza. A `cohortCompleteness()`
ezért a válaszarányt is megadja, és 80% alatt kimondja, hogy a mutató **összehasonlításra nem
közölhető** — a hiányzó esetek nem véletlenszerűen hiányoznak. A `fu.outcome` mező pedig
megkülönbözteti az elérhetetlen beteget attól, akit meg sem próbáltunk elérni: a kettő ugyanúgy
néz ki a hiányzó adatban, de nem ugyanaz a mulasztás.
(ld. [`../fejlesztes/22-utankovetes.md`](../fejlesztes/22-utankovetes.md))

### Új nyitott kérdések, amiket a megvalósítás hozott elő

**A 125 tételből 35-höz nincs mezőnk.** A 42. napos ICHOM-ponthoz 125 tétel tartozik; ebből 35
`unmapped` — nem adatgyűjtési mulasztás, hanem katalógus-hiány, és ez a modul feltöltésének
tényleges hátraléka. A többségük PROM (EQ-5D-5L, WHODAS, VR-12, PROMIS GH-10), amelyek
mindegyike licencköteles — ugyanaz a kapu, mint az EPDS-nél.

**A 72 feltételes tétel géppel nem eldönthető.** Az ICHOM `inclusion` mezője szabad szöveg. Vagy
strukturált feltétellé kell fordítani (mint a `Condition` a panaszszótárban), vagy elfogadni,
hogy ezek emberi döntést kívánnak. NYITOTT.

**Egy dátummező nem tud nemet mondani.** Ezt a kimenet elolvasása hozta elő: az anyai halál, a
halvaszületés és az újszülöttkori halál ICHOM-tétele DÁTUM, és üresen ugyanúgy néz ki a „nem
történt meg”, mint a „senki nem nézett utána”. A 42 napon belüli anyai halál nagy része az
intézményen KÍVÜL következik be. A nemleges tényt ezért külön mező mondja ki
(`out.maternal.alive`, `out.neonate.alive`, `out.birth.outcome`).
