# Modul 06 — Gyógyszerelés, GYSE, javaslatok

| | |
|---|---|
| **Cél** | Gyógyszerrendelés terhességi és szoptatási biztonsággal, kontraindikáció-kapukkal |
| **Forrás** | v16 (PUPHA, ATC, MEDDB) + **IPRACS (Hale LRC, antibiotikum, hard-stop)** |
| **Becsült változó** | ~90 + törzsadat |
| **Fázis** | 3 |
| **Függ** | 03 (anamnézis — a kapuk innen jönnek), 05 (labor — dózisszámítás) |

## Mi van már meg az IntuiCare-ben

A `clinical_therapy_orders` tábla a terápiás rendeléseké, a `klinika.eszkozok.diab` és a `diab-drugs.ts` a diabetes-gyógyszerelésé. **Nincs meg**: a PUPHA/ATC törzs (5 592 tétel), a Hale LRC szoptatási besorolás, a hard-stop kontraindikáció-kapuk és a `MEDDB` 22 átalakítási szabálya.

## 1. Ez a modul mutatja meg legjobban, mire jó a keresztfeltöltés

**Az anamnézisben bejelölt asztma a szülőszobán megállítja a carboprost rendelését.**

Ez az egy mondat a Fázis 3 elfogadási kritériuma, mert ez bizonyítja, hogy a keresztmodul-
feltöltés valóban működik. Az adat a felvételkor kerül be (`hx.sys.asthma`), a döntés órákkal
vagy hetekkel később, egy másik modulban, más felhasználó által születik — és a rendszer mégis
összeköti a kettőt.

## 2. Hard-stop kontraindikáció-kapuk

Az IPRACS-ból változatlanul átvéve. Ezek **nem figyelmeztetések, hanem kapuk**: modális
párbeszéd, ami megállítja a folyamatot.

| Szer | Kapu | Forrásváltozó |
|---|---|---|
| **Carboprost** | asztma — **abszolút kontraindikáció** | `hx.sys.asthma` |
| **Methylergonovin** | hypertonia / preeclampsia | `hx.sys.htn`, `hx.repro.currentPregnancy.preeclampsia` |
| **Béta-blokkoló mono** | stimuláns-intoxikáció (felfedett alfa-stimuláció → hypertensiv krízis) | `07`/`withdrawal.stimulant` |
| Neuraxiális anesztézia | `lab.plt` < 80 | `lab.plt` |
| NSAID | 3. trimeszter (ductus arteriosus) | `ctx.ga` |

A kapu **nem megkerülhetetlen** — van olyan klinikai helyzet, ahol a kockázat vállalható —, de
a megkerülés indoklást kér, és az indoklás bekerül a dokumentációba és az auditnaplóba.

## 3. Szoptatási biztonság — Hale LRC

Forrás: Hale TW & Krutsch K, *Medications and Mothers' Milk*, 2025 edition + LactMed (NIH).

Minden szerhez: **Hale LRC kategória** (L1–L5), **RID %** (relatív csecsemődózis), és
speciális figyelmeztetés. Az IPRACS 17 szerre kész táblát ad; ezt bővítjük a PUPHA-törzs
gyakran használt szereire.

## 4. Antibiotikum-szelektáló

Az IPRACS 14 indikációs köre, mindegyikhez első vonalbeli szer, ACOG/IDSA hivatkozás és
penicillinallergia-alternatíva. Indikációk: GBS-profilaxis, chorioamnionitis, császármetszés-
profilaxis, endometritis, húgyúti fertőzés, pyelonephritis, sebfertőzés, mastitis, szepszis,
PID, bacteriuria, PPROM, sebészi profilaxis, C. difficile.

**FMT / CDI döntési fa** — külön alszekció: Vowst (FDA 2023-04-26, SER-109; ECOSPOR III:
RR 0,32 recurrenciára) és Rebyota (FDA 2022-11-30, RBX2660; PUNCH CD3: 70,6% vs 57,5% placebo).

## 5. A v16 gyógyszertörzse és az átalakítási motor

| Elem | Tétel | Mit ad |
|---|---:|---|
| `PUPHA` | teljes magyar gyógyszertörzs | névre keresés |
| `atc` (EESZT) | 5 592 | hatóanyag-besorolás |
| `MEDDB` | 22 szabály | reguláris kifejezéssel illeszkedik a beírt névre, és **terhességi átalakítási javaslatot** ad |
| `MEDQUICK` | 14 | gyakori szerek gyorsgombjai |

A `MEDDB` belépési pontja a `matchMed()`. A hozzáadott hatóanyag magát az átalakítás-motort is
triggereli. Példa: `Ramipril` beírása → ACE-gátló terhességben kontraindikált → javasolt
átalakítás methyldopára vagy nifedipinre, indoklással.

> **Örökölt korlát:** a hosszú `MEDDB`-üzenetek (~22) nincsenek a fordítási szótárban, tehát
> nyelvváltás után is magyarul jelennek meg. Ez a v16-ban **tudatos** döntés volt: a klinikai
> mondatok gépi fordítása kockázatosabb, mint a hiányuk. Az OGDOC ezt átveszi, de jelöli is.

## 6. Dózisszámítás

| Számítás | Bemenet |
|---|---|
| Testsúlyra | `anthro.weight.current` |
| Vesefunkcióra | `lab.cr` → Cockcroft–Gault (`calc.crcl`) |
| LMWH profilaxis | RCOG GTG 37a: standard 40 mg qd; **BMI ≥ 35: 0,5 mg/kg q12h** (Overcash 2015, PMID 26658126) |
| Inzulin | `lab.glucose` — auto-fill, ha DM/GDM aktív. Célszintek: vajúdás alatt 3,9–7,8 mmol/L (WHO LCG), NIH intrapartum 4,0–7,0, postpartum 3,9–6,1 |
| Transzfúzió | `lab.hb`, `plt`, `inr`, `fibrinogen` (AABB 2023), MTP 1:1:1 |

## 7. GYSE és javaslatok

Gyógyászati segédeszköz rendelése (terhesöv, kompressziós harisnya, mellszívó, inzulinpumpa),
és a nem gyógyszeres javaslatok — ezek a teendőmotorba kerülnek, nem külön listába.

## 8. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` anamnézis (kapuk, allergia, meglévő terápia), `05` labor
(dózisszámítás, kontraindikáció), `02` kontextus (`ctx.ga` — trimeszterfüggő tiltások),
`10` szülőszoba (aktuális vérzés → uterotonikum-választás).

**⇨ Mit tölt fel**: `09` epikrízis gyógyszerelési része · `13` ellátási terv · `14`
zárójelentés · `17` ATC-kódolás · interakció-ellenőrzés.

## 9. Elfogadási kritérium

Bejelölt asztma mellett a carboprost rendelése hard-stop modálist vált ki, indoklás nélkül nem
folytatható, és az indoklás megjelenik a zárójelentésben. A `MEDDB` 22 szabálya közül
mindegyikre van golden-teszt (bemeneti gyógyszernév → várt átalakítási javaslat).

## 10. Nyitott kérdés

Az interakció-ellenőrzés forrása nincs kijelölve. Egy teljes interakciós adatbázis
(pl. DrugBank, Lexicomp) licencköteles és nem ágyazható be offline artifactbe. **Javaslat:** a
Fázis 3-ban csak a terhesség- és szoptatásspecifikus, kézzel karbantartott szabálykészlet
(a `MEDDB` bővítése), a teljes interakció-ellenőrzés pedig a webes fázis kérdése.
