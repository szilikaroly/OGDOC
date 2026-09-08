# 05 — Kockázatok, nyitott kérdések, döntéskérések

> **2026-09-01 — a terv kockázati képe megváltozott.** Két meglévő platform (IntuiCare, SOS24)
> került be, az egyfájlos feltevés megdőlt, és a hatókör 21 modulra nőtt. A régi kockázatok egy
> része megszűnt, újak jöttek — ez a fejezet mindkettőt jelöli.

## Az új főkockázat: két platform, egy beteg

Most **két működő Supabase-rendszer** van (IntuiCare 230 tábla, SOS24 71 tábla), és mindkettő
tárol betegadatot. Amíg ez így marad:

- ugyanannak a személynek két rekordja van, összekötés nélkül
- a foglalkozási expozíció és a terhesgondozás között nincs átjárás — pedig **klinikailag
  összefügg**
- két auth, két i18n, két deploy, két RLS-modell karbantartása

A `09-sos24-alap.md` javaslata: **az IntuiCare a gazdaplatform, a SOS24 domének átkerülnek**.
Ez 4–6 hét munka, és nem halogatható a végtelenségig, mert minden hónap párhuzamos üzem
növeli a migrálandó adatot.

**Nyitott: a SOS24 éles használatban van** (`sos24.lovable.app`). Párhuzamos üzem és
adatmigráció kell, nem egyszeri átkapcsolás.

## A biobanki réteg blokkolói

A `22` modul és a megfelelési réteg három olyan tételt hoz, ami **nem fejlesztési feladat**,
és ami nélkül az első mintavétel sem indulhat el:

| Blokkoló | Miért | Ki oldja fel |
|---|---|---|
| **A biobanki nyilatkozat jóváhagyása** | a v16 óta nyitott; jóváhagyás nélküli nyilatkozattal felvett hozzájárulás érvénytelen lehet | DPO + jogász + kutatásetikai bizottság |
| **DPIA** (GDPR Art. 35) | nagy tételű különleges és **genetikai** adat — nem mérlegelés kérdése | DPO |
| **Etikai engedély** | engedély nélkül kutatási felhasználás nincs | kutatásetikai bizottság |

És egy, ami fejlesztési, de könnyen elmarad: **a minta-életciklus SOP-jai a kóddal együtt
kellenek**. A Fázis 2-ben gyűjtött minták preanalitikai leírása utólag **nem
rekonstruálható** — ha akkor nincs SOP, azok a minták tudományosan kevesebbet érnek.

> **Egy szemléleti figyelmeztetés.** Az ISO 20387 kontrollmátrix jelenlegi állása szerint az
> informatikai alap jó, a **fizikai és eljárási réteg viszont szinte teljesen hiányzik**
> (fagyasztó, monitorozás, kalibrálás, SOP-ok, katasztrófaterv). Ez nem meglepő — de azt
> jelenti, hogy a biobank elindításának a szűk keresztmetszete nem a szoftver lesz.

## Örökölt biztonsági hibák — ezek blokkolók

| Hiba | Hol | Miért blokkoló |
|---|---|---|
| **BUG-015** | `user_roles_bootstrap_admin` — új tenant első felhasználója bárki lehet | kutatási adatgyűjtés ezen nem indulhat el |
| **BUG-009 (P0)** | `monitoring_thresholds` motor | a 15. modul alapja |
| BUG-007, 008, 010, 011 | role-kulcs, klinikai jegyzet, eszkaláció, kritikus lelet | a 04/05/08/09 modul közvetlen alapja |

Ezek a Fázis 0 részei, és az elfogadási kritérium része, hogy javítva legyenek.

## A legnagyobb kockázat: a méret

**~4035 változó, 25 modul.** Ez nagyságrenddel több, mint a v16 (~200) vagy az IPRACS (~150).

Amitől tartok, és amit az architektúra ellen dolgozik:

| Kockázat | Ellenszer |
|---|---|
| ~~Az egyfájlos artifact 5–15 MB-ra hízik~~ | **megszűnt** — a rendszer adatbázis-alapú, kód-osztás és lusta route-betöltés a platform sajátja |
| A klinikai tartalom lektorálatlan marad | modulonkénti lektorálás, a fázis lezárásának feltételeként |
| A levezetési gráf átláthatatlanná válik | körellenőrzés a buildben + hatásvizsgálat-nézet a felületen |
| Elhal a projekt a 12. modulnál | a fázisozás úgy készült, hogy **a Fázis 3 végén már teljes értékű eszköz** van; a 4–7 bővítés, nem befejezés |

## Amit őszintén jelzek a kéréssel kapcsolatban

A megrendelt hatókör — 18 modul a panasztól az onkológián át a minőségbiztosításig — **egy
kórházi információs rendszer hatóköre**, nem egy segédeszközé. Ezt nem azért írom, hogy szűkítsem:
a terv a teljes kérést lefedi. De két dolgot érdemes tudni:

0. **A hatókör azóta tovább nőtt**: 18 helyett 21 modul, ~2225 helyett ~3215 változó, és két
   meglévő platform egyesítése. Ez önmagában nem baj — a modulok több mint fele meglévő
   rendszer —, de a projekt már nem „egy eszköz", hanem **egy egészségügyi informatikai
   platform klinikai rétege**. Érdemes ezt kimondva vállalni.
1. **Az onkológiai (12.) és a minőségbiztosítási (18.) modul lóg ki leginkább.** Az onkológia
   önálló szakterület saját stádiumrendszerekkel és protokollokkal; a minőségbiztosítás nem
   betegszintű, hanem intézményi, tehát más adatmodellt kíván (aggregátum, nem eset). Mindkettő
   benne van a tervben, de a 6. fázisban — és ha valamit el kell hagyni, ez a kettő az.
2. **A „kereshető panaszűrlap" (1. modul) alábecsült tétel.** Egy jól működő magyar
   panaszszótár szinonimákkal és laikus kifejezésekkel önmagában több hét munka, és a minősége
   dönti el, hogy a rendszer használható-e a gyakorlatban. A tervben R=4-gyel szerepel, de ez
   optimista.

Ezek nem kifogások — a terv mindkettőt tartalmazza, teljes terjedelemben. Csak a sorrend
és a ráfordítás legyen reális.

## Nyitott kérdések — ezekre a válaszod kell

### K0. Melyik platform a gazda? — **ELDÖNTVE: vegyes rendszer**

Nem az egyik nyeli el a másikat. Az OGDOC **új rendszer**, amely mindkét platformból átveszi
a jól megírt és működő részeket. A besorolás — **átvesz / átalakít / újraír**, négy kritérium
alapján, elemenként — a [`10-mixed-rendszer.md`](10-mixed-rendszer.md)-ben.

**Amit ez kockáztat, és amit vállalunk:** ez a három lehetőség közül a legnagyobb integrációs
kockázatú út. Ellenszere: **egyetlen konvenciókészlet** (az IntuiCare-é), a besorolás
dokumentált kritérium alapján, és az `ÚJRAÍR` kategória nem alkuképes — BUG-015 és a szórt
klinikai számítások nem kerülnek be.

### K1. Webes fázis — **ELDÖNTVE: lesz, és azon tesztelünk**

A rendszer webes, és a tesztelés is ott történik. Távlati cél a **HIS párhuzamos kiváltása**.

Ez utóbbi nem külön fázis, hanem **három megkötés most** (`08-interoperabilitas.md` 5.1):
kétirányú adapter a nulladik naptól (ha csak olvasni tudunk, sosem tudjuk kiváltani), teljes
adatlefedettség a regiszterben, és tervezett migrációs út.

Ha igen, az megváltoztatja a Fázis 0 döntéseit (TypeScript azonnal, nem később; Supabase-séma
előre tervezve). Ha nem, az artifact-fókusz egyszerűbb és gyorsabb.

Az IPRACS Lovable-specifikációja (`06-webes-migracio.md`) ezt a döntést sokkal olcsóbbá tette:
a TypeScript-interfészek, a Supabase-séma és a Zustand-store már meg vannak írva. A kérdés így
nem az, hogy *hogyan*, hanem hogy *mikor*.

### K2. Kutatási cél **és MDR párhuzamosan** — **ELDÖNTVE, kibővítve**

Az ETT-engedélyeztetés és az **MDR-megfelelőségi dokumentáció párhuzamosan** készül
([`megfeleles/09-mdr.md`](megfeleles/09-mdr.md), [`megfeleles/10-ett.md`](megfeleles/10-ett.md)).

Ez visszahozza az MDR-t a hatókörbe. A párhuzamos építés valódi haszna: ha a kutatási
fázisban a rendszer már MDR-konform módon dokumentált, a későbbi megfelelőségértékelés nem
újrakezdés, hanem **összeállítás**. A kockázatkezelési akta tíz veszélyhelyzete már most a
tervben van intézkedésként — az ISO 14971 akta ezeket **formalizálja, nem kitalálja**.

**Két dolog, amit a Fázis 0-ban el kell dönteni:** hol húzzuk meg az **eszközhatárt**
(javaslat: a `core/scores/` és a hozzá tartozó felület, nem az egész platform), és
alkalmazható-e az MDR **in-house kivétele** (5. cikk (5)) — ha igen, mindkét sáv lényegesen
egyszerűsödik.

#### Az eredeti döntés (változatlanul érvényes a kutatási sávra)

A rendszer kutatási, oktatási és belső minőségfejlesztési célra készül. Ez kiveszi az
MDR-megfelelőséget a hatókörből, de behozza az etikai engedélyt, a kutatási protokollt és a
pszeudonimizálást. A részletes következmények — köztük három tétel előresorolása az
ütemtervben — a `00-pozicionalas.md` és a `04-utemterv.md` elején.

### K3. Kell-e a többnyelvűség a nulladik naptól?

A v16 hat nyelvet tud. Ha ez megmarad, minden változó minden dokumentációs mezője ×6 —
ez a tartalmi munkát megsokszorozza. **Javaslat:** HU + EN a nulladik naptól (a struktúra
készüljön n-nyelvűre), a többi nyelv a Fázis 5-ben.

### K4. EKG — **ELDÖNTVE: teszteljük, és kép-alapú felismeréssel bővítjük**

A meglévő modul tesztelve; **új**: kép- és szkennelés-alapú EKG-felismerés
(`modulok/05-vizsgalatok.md` 5.2.1). A lánc a rácsdetektálásból kalibrál, digitalizálja a
görbét, és **a meglévő 296-képletes motort táplálja** — a felismerés nem értékel, tehát
nincs párhuzamos klinikai logika.

**A kalibrálás a kritikus pont:** ha a papírsebesség vagy az érzékenység téved, minden érték
arányosan téved, és a hiba nem feltűnő. Ezért a detektált kalibráció megjelenik és
megerősítendő.

**Emberi felügyelet kötelező:** a gépi olvasat javaslat, a klinikus elvezetésenként erősíti
meg, és megerősítés nélkül egyetlen érték sem rögzül.

Ez a rendszer első gépi látás komponense, ezért **AI-rendeleti és MDR-következményei
vannak** (`megfeleles/09-mdr.md` 6.): adatkormányzás, elkülönített teszthalmazon mért
teljesítmény, PROBAST+AI / TRIPOD+AI értékelés, naplózás.

#### Az eredeti kérdés lezárása

A modul 2026-09-01-én lefutott és vissza lett ellenőrizve a munkafüzet saját teszteseteivel
(hét összevetésből hét egyezik, a részletek a `FEJLESZTOI_KEZIKONYV.md` 5. fejezetében). Az
OGDOC-ba tehát portolás megy, nem fejlesztés.

Két maradék tétel: az `ekg.xlsx` legördülő listáinak értékkészletét egyeztetni kell, és a
lead-objektumok hiányzó `qrsPol` kulcsát fel kell venni az inicializálásba.

### K5. Repónév és rendszernév.

Munkanév: **OGDOC** (Obstetric & Gynecologic Documentation Core), repó: `ogdoc`.
Ha van jobb, most a legolcsóbb megváltoztatni — a változó-azonosítók névtere is ebből lesz.

### K6. Mi legyen az anamnezis-asszisztens repóval?

Három lehetőség:
- **archiválás** — a v16 marad, ahogy van, az OGDOC átveszi
- **párhuzamos élet** — a v16 marad használatban, amíg az OGDOC Fázis 3-at el nem éri *(ezt javaslom)*
- **beolvasztás** — a repó átnevezése, a v16 az OGDOC alá kerül

### K7. Interoperabilitás — **ELDÖNTVE: univerzális réteg, fő cél az e-MedSolution**

**HL7** (v2 és FHIR), **DICOM** (C-STORE/C-FIND, **Modality Worklist**, **MPPS**,
képtranszfer, **SR** és **waveform**), **LIS2-A2** a laborműszerekhez, **POCT1-A2** az ágy
melletti eszközökhöz. Saját PACS: **Orthanc**. Részletek:
[`08-interoperabilitas.md`](08-interoperabilitas.md).

**A Modality Worklist a leggyakrabban kihagyott, és a legfontosabb elem:** enélkül a beteg
adatait kézzel írják be a készüléken, és egy elgépelt születési dátumtól a vizsgálat
elveszett.

**A DICOM egyben adattranszport is** (a „multimódusú" cél): ugyanaz a csatorna viszi a képet,
a strukturált mérést (SR), a hullámformát és a dokumentumot (encapsulated PDF/CDA). Egy
szülészeti UH így egy tanulmányban tartalmazza a képeket, a biometriát gépi olvasásra, és a
leletet emberi olvasásra — ami egyben a **kevés szabad szöveg** célt is szolgálja.

#### Ami még nyitott ebből

Az **e-MedSolution konkrét interfészkészlete** gyártófüggő és szerződéses: melyik HL7 v2
verzió, milyen Z-szegmensek, van-e FHIR, van-e tesztkörnyezet, melyik irány engedélyezett,
milyen betegazonosító kulccsal. **Ez beszerzési feladat a Fázis 0-ban**, nem fejlesztési.
Amíg nincs meg, az adapter `RecordingAdapter` módban fut.

### K16. Van-e POCT middleware az intézményben?

Ha nincs, azt is nekünk kell megoldani — ez eszközparkfüggő, és a `08-interoperabilitas.md`
4. pontja szerint nem közvetlenül a műszerhez érdemes csatlakozni.

### K17. Az Orthanc üzemeltetése és a képtárolás

Ki üzemelteti, hol tárol (objektumtár vagy blokk-tár), és **ki felel a mentés helyreállítási
próbájáért**? A képadat gyorsan nő, és ugyanaz a követelmény vonatkozik rá, mint a biobankra.

### K18. A HIS párhuzamos kiváltásának időhorizontja

Ez befolyásolja, mennyire teljes adatlefedettségre kell törekedni a `03`, `05` és `17`
modulban. Amit a HIS tárol és mi nem, azt nem tudjuk átvenni.

A magyar piacon több rendszer van (MedSol, e-MedSolution, MedWorks, saját fejlesztések), és a
csatlakozás módja rendszerenként eltér. Ha ez most eldől, az adapter-interfész pontosabban
tervezhető; ha nem, az általános minta (`08-interoperabilitas.md` 4. pont) elég.

### K8. A k-anonimitási küszöb értéke

A 20. modul alapértelmezése 5. Ez **intézményi és etikai bizottsági döntés**, nem fejlesztői.

### K9. Cél-e az ISO 20387 akkreditáció és a BBMRI-ERIC csatlakozás?

Egyik sem előfeltétele a működésnek — a **jogszabályi megfelelés** az. Az akkreditáció a
bizonyíték, hogy a rendszer működik; a BBMRI-ERIC csatlakozás a kutatási hasznosulás
feltétele. Mindkettő ütemtervet és erőforrást befolyásol.

Reális átfutás akkreditációra: **12–18 hónap az első kérelemtől**, jó felkészültség mellett.

### K10. A „2009-es humángenetikai törvény" azonosítása

A humángenetikai adatokról, vizsgálatokról, kutatásokról és biobankokról a **2008. évi XXI.
törvény** rendelkezik; önálló 2009-es humángenetikai törvényről nincs tudomásom. Lehet, hogy
a végrehajtási rendeletre vagy a törvény egy 2009-ben hatályba lépett rendelkezésére
gondolsz — **add meg a pontos jogszabályszámot, és beépítem.**

### K11. Keletkeztet-e az OGDOC ellátási dokumentációt?

Ettől függ az **EESZT-beküldési kötelezettség**. Ha a rendszer kizárólag kutatási-oktatási
eszköz, nincs; ha ellátási dokumentációt is keletkeztet, akkor a beküldés nem választás
kérdése. Ez a magyar jogi fejezet legfontosabb nyitott kérdése.

### K12. Mely mintatípusokkal indul a biobank?

A teljes életciklus mintatípusonként külön SOP-ot és QC-mutatót kíván. **Javaslat:**
kettő-hárommal kezdeni (szérum, plazma, buffy coat vagy DNS), nem mindennel egyszerre.

### K13. Az embrió- és ivarsejt-tárolás jogi kerete — **új, jogi véleményt kíván**

A `24` modul kriotárolása **jogilag nem biobank**: mindkét fél rendelkezése alatt áll, és
válás, haláleset, tárolási időkorlát lejárta esetére előre rögzített döntés kell. A `22`
biobanki keret ezt **nem fedi le**. A donor gaméta és embrió pedig önálló jogi kérdéskör.

### K14. Melyik osztályozási és referenciakészleteket használjuk, és milyen verzióban?

Négy tétel, mind rendszeresen frissül, és mind **verziózandó** a FIGO-stádiumok mintájára:
variáns-klasszifikáció (23. modul), embrió-értékelés és spermiogram-referencia (24. modul),
és a laboratóriumi teljesítménymutatók küszöbei.

### K15. Prenatális WES/WGS bevezetése cél-e?

Ha igen, a váratlan lelet kezelése lényegesen összetettebb lesz, és a tanácsadási
kapacitásigény megnő. Ez klinikai és erőforrás-döntés.

## Örökölt nyitott teendők, amiket ez a terv magára vállal

A v16 `ALLAPOT.md`-jéből:

- [ ] Duplikátumok rendezése (`c_hr` vs `k_hr2`, `k_ba` vs `lb_bile`, `k_sbp` vs `#bp`) —
      **megoldva** az `aliasOf` mechanizmussal és a build-időben futó duplikátum-ellenőrzéssel
- [x] Foglalkozás-egészségügyi lap hiányzó elemei — **megoldva**: a SOS24 portál adja
      (21. modul), a fizikális státusz eszközös részei (audiogram, légzésfunkció, visus) a
      4. modul új alszekciójába kerülnek
- [ ] A kézirat supplementuma még a régi, 45 kB-os `anamnezis_app.html`-re hivatkozik —
      külön teendő, nem az OGDOC része
- [ ] Biobanki nyilatkozat és ultrahang-tájékoztató jogi jóváhagyása — **a 22. modul
      blokkolója**, ld. `megfeleles/06-beleegyezes.md`
- [ ] EKG-modul tesztelése — ld. K4

Az IPRACS `14.1`-ből:

- [x] Session-szintű adatvesztés — **megoldva** a `series` tárolási alakkal és a `Store` interfésszel
- [x] Duplikált függvények (`calcLATCH` kétszer) — **megoldva**: a score-ok egyetlen `core/scores/` modulban
- [x] Bishop három helyen — **megoldva** az `aliasOf` mechanizmussal
- [ ] Partogram nyomtatási CSS (A3/A4 fekvő) — átkerül, Fázis 3

---

## Lezárt döntések — 2026-09-01, második kör

| # | Kérdés | Döntés | Következmény |
|---|---|---|---|
| **K9** | Akkreditáció és BBMRI-ERIC | **igen** — ISO 20387 + BBMRI-ERIC, és emellett ISO 9001, ISO/IEC 17025, ISO 15189 | [`megfeleles/11-integralt-mir.md`](megfeleles/11-integralt-mir.md); **egy integrált rendszer**, nem négy |
| **K10** | A „2009-es humángenetikai törvény" | **2008. évi XXI. tv.** — önálló 2009-es törvény nincs | a keret ezt dolgozza fel; a kérdés lezárva |
| **K11** | Keletkeztet-e ellátási dokumentációt | **igen**, és megtervezzük az EESZT-megfelelést | [`megfeleles/12-eeszt.md`](megfeleles/12-eeszt.md); beküldési és megőrzési kötelezettség, élesebb MDR-határ |
| **K13** | Embrió- és ivarsejt-tárolás | **a biobankhoz csatlakozik** | egy szervezet és egy MIR, **két jogi keret**; `24` és `22` modul |
| **K14** | Osztályozási készletek verziózása | **verziózandó** | **kódban megvalósítva**: a rögzítéskori verzió az értékre bélyegződik |
| **K17** | Orthanc üzemeltetése | **helyben, titkosított felhőmentéssel** | [`megfeleles/13-uzemeltetes.md`](megfeleles/13-uzemeltetes.md) |

### Harmadik kör — mind az öt lezárva

| # | Kérdés | Döntés | Következmény |
|---|---|---|---|
| **K19** | A megfelelési hatókör | **teljes** — mind a három tevékenység: betegdiagnosztikai labor, kutatási vizsgálat és kalibrálás, biobank | ez a maximális hatókör; **az integrált rendszer nem opció, hanem szükségszerűség** |
| **K20** | Mely dokumentumtípusok ellátási dokumentáció | **nyolc**: zárójelentés, ambuláns lap, gyógyszerfelírás, vizsgálati lap, terhesgondozási lap, terhességi kockázatértékelés, beutaló, diétás/szakorvosi javaslat | **dokumentum-regiszterként megvalósítva**, a változóregiszterrel összeellenőrizve |
| **K21** | Ki üzemelteti | **központi informatika** | megoldott — de behoz egy összeférhetetlenséget, ld. lent |
| **K22** | Felhőszolgáltató | **Telekom HU vagy 4iG** | mindkettő EGT-n belüli → **a harmadik országba továbbítás kérdése tárgytalan** |
| **K23** | RPO és RTO | **elfogadva**: klinikai adat ≤ 15 perc / ≤ 4 óra | folyamatos WAL-archiválás és gyakorolt helyreállítás kell hozzá |

### Amit a harmadik kör megnyitott

| # | Új kérdés | Ki dönti el |
|---|---|---|
| **K24** | Ki a minőségirányítási vezető, és mekkora kapacitással? Négy szabvány integrált rendszerben is legalább egy teljes állást köt le | intézményi vezetés |
| **K25** | Melyik akkreditációs eljárás indul először, és mikor | intézmény + minőségirányítás |
| **K26** | Az epikrízis és a partogram besorolása — belső munkadokumentum vagy ellátási dokumentáció | jogász + intézmény |
| **K27** | A megőrzési idők visszaellenőrzése — amíg nincs meg, a rendszer nem töröl | jogász |
| **K28** | A központi informatika rendelkezésre állása munkaidőn kívül (a ≤ 4 órás RTO éjjel-nappal érvényes) | intézmény, SLA-ban |
| **K29** | A kulcsőrzők kijelölése — két, a központi informatikától **független** személy | intézményvezetés + DPO |

> **A K21 egy összeférhetetlenséget hoz be, amit érdemes most rendezni.** Ha a központi
> informatika adminisztrálja a felhőfiókot **és** őrzi a titkosítási kulcsot, akkor a kulcs
> és a titkosított adat egy kézben van — és a titkosítás nem véd az ellen, ami ellen védeni
> akartuk. Ez nem bizalmi kérdés, hanem szerkezeti: ugyanaz az elv, mint a `kutato` +
> `kodkulcs_kezelo` páros tiltása. A megoldás olcsó: **két, a központi informatikától
> független kulcsőrző** (K29).

> **A K22 a legnagyobb jogi kockázatot vette le a napirendről.** Mindkét megnevezett
> szolgáltató magyarországi, tehát EGT-n belüli — nem kell megfelelőségi határozatra vagy
> kiegészítő intézkedésekre hivatkozni. Ami marad: a **„magyar szolgáltató" nem azonos a
> „magyarországi adatközponttal"** — a tárolás fizikai helyét és az altfeldolgozók körét a
> szerződésnek kell kimondania.

---

## Negyedik kör — a végrehajtási kérdések lezárva

| # | Kérdés | Döntés | Következmény |
|---|---|---|---|
| **K24** | Minőségirányítási vezető | **lesz**, dedikált szerepként | a megfelelési sáv indítható; a szerep nem mellékfeladat |
| **K25** | Az akkreditációk sorrendje | **rendben**: 9001 → 20387 → 15189 → 17025 → BBMRI-ERIC | a közös váz épül először, nem kétszer ugyanaz |
| **K26** | Epikrízis és partogram | **ellátási dokumentáció**, nem belső munkaanyag | +2 dokumentumtípus; az epikrízis narratívája jogilag is a dokumentáció része |
| **K20+** | Műtéti dokumentumok | **műtéti terv · aneszteziológiai terv · műtéti záró** | +3 dokumentumtípus; összesen **13** |
| **K28** | Rendelkezésre állás | **4 óra kórházi előírás**, éjjel-nappal | ügyeleti rend és SLA a központi informatikával |
| **K29** | Kulcsőrzés | **porta a helyszínen + ügyeletes informatikus** | a porta 24/7 fizikai ellenőrzőpont; a naplózott átvétel és az automatikus értesítés a valódi védelem |
| **K22+** | Az adatpark | **egészségügyre bérelt, az EESZT szerverei mellett** | a *tárolás fizikai helye* is megválaszolva — de ez **nem** biztonsági tulajdonság |

### Amit a negyedik kör megnyitott

| # | Új kérdés | Ki dönti el |
|---|---|---|
| **K30** | A kulcsletét eljárásrendje írásban (boríték, napló, értesítés, helyettesítés) | minőségirányítás + DPO |
| **K31** | A belső auditorok kijelölése és képzése — legalább két fő | minőségirányítási vezető |

> **A K26 többet változtat, mint amennyinek látszik.** Az epikrízis eddig belső
> munkaanyagnak számított, ahol a „ne állíts olyat, ami nincs a rögzített adatban" szabály
> belső minőségi elvárás volt. Ellátási dokumentációként **ez dokumentációs követelmény
> lett** — és jó, hogy a narratívamotor eleve determinisztikus sablongenerálás, nem nyelvi
> modell. Ha nyelvi modell lenne, ez a döntés most újratervezést kényszerítene ki.

> **A K29 megoldása a naplón áll, nem a portás ítélőképességén.** Az ügyeletes informatikus
> a központi informatika tagja, aki a felhőfiókot is adminisztrálja — ha megszerzi a
> borítékot, egyedül is vissza tud állítani. Ezért kötelező eleme a megoldásnak, hogy az
> átvétel **automatikus értesítést** küld az ügyeletvezetőnek és az adatvédelmi
> tisztviselőnek. Ez az, ami hajnali háromkor is véd.

---

## Ötödik kör — a megfelelési sáv nyitott kérdés nélkül

| # | Kérdés | Döntés | Következmény |
|---|---|---|---|
| **K27** | Megőrzési idők | **kikutatva és beállítva**, plusz a betegkérés kezelése | 14 dokumentumtípuson rögzítve; a törlés **két kapu** mögött |
| **K30** | A kulcsletét eljárásrendje | **a leírt tartható** | SOP-ként rögzítendő; az éves kulcsvesztés-próba ezt gyakorolja |
| **K31** | Belső auditorok | **egy folyamatban** a minőségirányítási vezető képzésével | közös auditprogram, egy képzés, nem négy |

### A megőrzési idők, ahogy a jogszabály rendelkezik

Az **1997. évi XLVII. törvény (Eüak.) 30. §-a** szerint:

| Mit | Meddig |
|---|---:|
| Egészségügyi dokumentáció | **legalább 30 év** az adatfelvételtől |
| **Zárójelentés** | **legalább 50 év** |
| **Képalkotó felvétel** | **10 év** a készítéstől |
| A felvételről készített **lelet** | **30 év** |

A kötelező idő után az adat **gyógykezelés vagy tudományos kutatás** érdekében, indokolt
esetben, továbbra is nyilvántartható.

> **A felvétel és a lelet párja a leggyakrabban összemosott tétel** — 10 és 30 év. Ezért
> került a képalkotó felvétel **önálló dokumentumtípusként** a regiszterbe: más a
> megőrzése, más a tárolóhelye (PACS), és **maga a felvétel nem megy az EESZT-be**, csak
> a lelet.

### Két kapu a törlés előtt

1. **Az ellenőrzöttség**: a kétállapotú „ellenőrizve / nincs" itt elveszítene egy valós
   köztes állapotot. A jelenlegi szint mind a tizennégy típuson **`secondary`** — az
   időtartamok több, egymástól független forrásból egybehangzóan megvannak, de az
   **elsődleges jogszabályszöveg** összevetése hátravan. Amíg ez nincs meg, **automatikus
   törlés nem indul**.
2. **A betegkérés**: a megsemmisítés előtt a betegnek módot kell adni a dokumentáció
   kikérésére. Függőben lévő kérés mellett **nem törlünk**, és a megőrzés a kérésére
   meghosszabbítható.

> **Ez a jogásznak sokkal kisebb feladat, mint a kiindulási helyzet volt**: nem kutatni
> kell, hanem megerősíteni — négy időtartamot és a betegkérés kezelését. Utána a
> `secondary` → `primary` átállítással az automatikus törlés élesedik.

### Ami hátravan

**Nyitott döntési kérdés nincs.** A megfelelési, üzemeltetési és dokumentációs sáv
lezárult; ami marad, az végrehajtás:

| Sáv | Következő lépés | Felelős |
|---|---|---|
| Megfelelés | a dokumentumfa felépítése, képzések, az első kérelem | minőségirányítási vezető |
| Jog | a megőrzési idők `secondary` → `primary` átállítása | jogász |
| Üzemeltetés | a kulcsletét SOP-ja és az SLA a központi informatikával | üzemeltetés + DPO |
| Klinikai | a fullPIERS-, Hadlock- és CKD-EPI-konstansok visszaellenőrzése | klinikai szakértő |
| Fejlesztés | BUG-015 és BUG-009 javítása, majd a katalógus feltöltése | fejlesztés |
