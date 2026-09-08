# Modul 24 — IVF és asszisztált reprodukció

| | |
|---|---|
| **Cél** | A meddőségi kivizsgálástól a kezelési cikluson át a kimenetelig; OHSS-megelőzés, embrió- és ivarsejt-tárolás |
| **Forrás** | v16 (`pre-ivf` útvonal, `conception` mező, endokrin labor) + ÚJ |
| **Becsült változó** | ~300 |
| **Fázis** | 3 (kivizsgálás és ciklus) → 5 (teljes) |
| **Függ** | 02, 03, 04, 05, 23; és a `megfeleles/` réteg |

## Mi van már meg

**A v16-ban:** a `pre-ivf` **önálló felvételi útvonal** (a három közül az egyik), a
`conception` mező teljes értékkészlete (spontán · ovuláció-indukció · IUI · **IVF · ICSI ·
FET · donor**), az `s_infert` és `hx.repro.ivf` anamnézis-tételek, a `s_pcos` / `en_pcos`
endokrin tételek, és az endokrin labor (AMH, FSH/LH, E2, PRL, tesztoszteron, DHEAS, 17-OHP).

**A tervben már benne van:** a `04` státusz **infertilitás alszekciója** (ovariális rezerv
jelei, Ferriman–Gallwey, emlő-Tanner, partner-adatok), a `05` ultrahang **nőgyógyászati**
ága AFC-vel és a **kontrasztos HSG/HyCoSy** tubaátjárhatósági sablon, valamint a `12` modul
**fertilitásmegőrzési** szakasza.

**Nincs meg:** maga a kezelési ciklus, a laboratóriumi fázis, az OHSS-kezelés, a
kriotárolás és a kimenetel-számítás.

---

## 1. Meddőségi kivizsgálás — a pár mint egység

**Ez a modul első tervezési döntése:** a meddőség a páré, nem az egyéné. A rendszer
`fert_couple` egységet kezel, amelyben **mindkét fél önálló beteg**, saját dokumentációval és
saját beleegyezéssel — de a kivizsgálás és a kimenetel a párhoz kötődik.

### 1.1 Női oldal

| Terület | Változók | Honnan |
|---|---|---|
| Ovariális rezerv | `fert.f.amh`, `fert.f.afc`, `fert.f.fsh_d3`, `fert.f.e2_d3` | `05` endokrin labor, `05` UH |
| Ovuláció | `fert.f.cycle_regular`, `fert.f.prog_luteal`, `fert.f.ovulation_confirmed` | `menstrual_cycles` (platform) |
| Tuba | `fert.f.tubal_patency` (HSG / HyCoSy / laparoszkópia) | **`05` kontrasztos HSG sablon** |
| Cavum | `fert.f.cavity` (hysteroscopia, SIS), polip, myoma, synechia, septum | `05` UH |
| Endometriosis | `fert.f.endometriosis_stage` | `03` `s_endo`, `05` UH |
| Endokrin | pajzsmirigy, prolaktin, PCOS-kritériumok | `03` `ENDO`, `05` labor |

### 1.2 Férfi oldal

| Terület | Változók |
|---|---|
| **Spermiogram** | koncentráció, összszám, progresszív motilitás, morfológia, volumen, pH, vitalitás — **a referenciaérték-készlet verziójával együtt** |
| Ismétlés | a spermiogram nagy biológiai variabilitású: **egyetlen lelet nem elég**, a modul ismétlést kér |
| DNS-fragmentáció | `fert.m.dfi`, ha indikált |
| Hormon | FSH, LH, tesztoszteron, prolaktin |
| **Genetika** | kariotípus, AZF-mikrodeléció, CFTR — súlyos oligo-/azoospermiánál. **→ `23` modul**, tanácsadási kapuval |
| Fizikális | varicokele, herevolumen, ductus deferens |

> A férfi genetikai kivizsgálás azért fontos kapcsolódás, mert ICSI-vel a genetikai eltérés
> **továbbadható a fiúutódnak** — és ezt a tanácsadásnak tartalmaznia kell, mielőtt a
> kezelés elindul.

### 1.3 Diagnózis és kezelési döntés

`fert.diagnosis`: tubáris · ovulációs · férfi faktor · endometriosis · uterinális ·
**megmagyarázatlan** · kevert. A `fert.plan` a javasolt út (expektatív · ovuláció-indukció ·
IUI · IVF · ICSI), a döntés indoklásával — és a **megosztott döntéshozatal** rögzítésével,
a `13` modul mintájára.

---

## 2. A kezelési ciklus

### 2.1 Stimuláció

| Változó | Tartalom |
|---|---|
| `ivf.cycle.number` | hányadik ciklus |
| `ivf.protocol` | hosszú agonista · rövid agonista · **antagonista** · natúr / enyhe · DuoStim |
| `ivf.gonadotropin.type` / `.dose` / `.days` | rFSH, hMG, kombináció |
| `ivf.monitoring[]` | **idősor**: nap, tüszőszám és -méret oldalanként, endometrium-vastagság, E2, LH, P4 |
| `ivf.trigger.type` | **hCG · GnRH-agonista · dual** |
| `ivf.trigger.time` | pontos időpont — az OPU időzítése ehhez képest |

A monitorozás `series` alakú, és a `05` ultrahang-modul páros szerv logikáját használja
(jobb/bal ovarium egy ábrán) — nem új vizualizáció.

### 2.2 OPU és laboratórium

| Fázis | Változók |
|---|---|
| **OPU** | dátum-idő, anesztézia, aspirált tüszők, **nyert petesejt szám**, szövődmény |
| Érettség | MII / MI / GV szám |
| **Megtermékenyítés** | IVF vs ICSI (és **miért ICSI** — indikáció kötelező), inszeminált/injektált szám |
| Fertilizáció | 2PN szám, `ivf.lab.fertRate` **computed** |
| Tenyésztés | 3. napi / 5–6. napi (blasztociszta), időzített felvétel (time-lapse) |
| Embrió-értékelés | morfológiai osztályozás embriónként, **a használt osztályozási rendszer megnevezésével és verziójával** |
| **PGT** | PGT-A / PGT-M / PGT-SR — biopszia napja, sejtszám, labor → **`23` modul** |

> **A laboratóriumi teljesítménymutatók** (fertilizációs arány, blasztociszta-arány,
> kriotúlélés) intézményi minőségi mutatók, és a `18` modulba kerülnek — nem a
> betegdokumentációba. Nemzetközi konszenzus-küszöbök léteznek; a **konkrét
> mutatókészletet és küszöbeit a laborral együtt kell rögzíteni**, forrásmegjelöléssel.

### 2.3 Embriótranszfer

| Változó | Tartalom |
|---|---|
| `ivf.et.type` | **friss · fagyasztott (FET)** |
| `ivf.et.endometrium.prep` | natúr ciklus · hormonpótlásos · stimulált |
| `ivf.et.endometrium.thickness` | mm, a transzfer előtt |
| `ivf.et.embryo_count` | **hány embrió** — ld. lentebb |
| `ivf.et.embryo_ids` | mely embriók (a kriotárolóból azonosítva) |
| `ivf.et.difficulty` | katéter, nehézség, vér |
| `ivf.luteal_support` | progeszteron: forma, dózis, meddig |

**Az átültetett embriók száma önálló klinikai és etikai döntés.** A többes terhesség a
legjelentősebb elkerülhető ART-szövődmény. A modul:

- megjeleníti a beteg életkorához és az embrió minőségéhez tartozó **többes terhességi
  kockázatot**
- rögzíti a **megosztott döntést**, ha egynél több embrió kerül átültetésre
- **nem tiltja** — a döntés a klinikusé és a páré, de dokumentált

---

## 3. OHSS — a modul biztonsági magja

Az ovariális hiperstimulációs szindróma az IVF legsúlyosabb iatrogén szövődménye, és
**nagyrészt megelőzhető**. Ez a modul azon kevés része, ahol a rendszer aktívan riaszt.

### 3.1 Kockázati tényezők — a stimuláció megkezdése előtt

| Tényező | Forrás |
|---|---|
| **PCOS** | `hx.endo.pcos` |
| Magas AMH | `fert.f.amh` |
| Magas AFC | `fert.f.afc` |
| Fiatal életkor, alacsony BMI | `ctx.age`, `anthro.bmi` |
| **Korábbi OHSS** | `hx.repro.ohss` (új anamnézis-tétel) |
| Sok tüsző / magas E2 a stimuláció alatt | `ivf.monitoring[]` |

A rendszer a stimuláció **megkezdése előtt** kiszámol egy kockázati szintet, és magas
kockázatnál felajánlja a megelőzési lehetőségeket.

### 3.2 Megelőzés — amit a rendszer felajánl

| Eszköz | Mikor |
|---|---|
| Antagonista protokoll | magas kockázatnál alapértelmezés |
| **GnRH-agonista trigger** hCG helyett | magas kockázatnál — a leghatékonyabb megelőzés |
| **Freeze-all** (minden embrió fagyasztása, transzfer későbbi ciklusban) | magas kockázatnál |
| Cabergolin | kiegészítésként |
| Coasting, dóziscsökkentés | mérlegelendő |

> **Hard-stop jellegű szabály:** ha a kockázati szint magas, és a klinikus mégis hCG-triggert
> és friss transzfert választ, a rendszer **megerősítést és indoklást kér**, és az indoklás
> bekerül a dokumentációba. Ez nem tiltás — van jogos eset —, hanem kikényszerített mérlegelés,
> a `06` modul kontraindikáció-kapuinak mintájára.

### 3.3 Felismerés és kezelés

`ohss.grade` (enyhe / mérsékelt / **súlyos** / kritikus) a klinikai és laboratóriumi
paraméterekből: hasi panasz, hasűri folyadék, hematokrit, fehérvérsejtszám, kreatinin,
diurézis, légzési panasz, **thromboemboliás jelek**.

A súlyos OHSS a `10` szülőszoba modul sürgős infrastruktúráját használja: a
**VTE-profilaxis** (`calcVTE`, Caprini + RCOG), a folyadék- és albuminkezelés, és a
`clinical_critical_alerts` riasztási lánc.

---

## 4. Kriotárolás — egy szervezet, két jogi keret

> **Döntés (K13): az embrió- és ivarsejt-tárolás a biobankhoz csatlakozik.** Egy szervezeti
> egység, egy minőségirányítási rendszer, egy akkreditációs hatókör — **de két jogi keret és
> két beleegyezési rendszer.** A jogi szétválasztás nem szervezési döntés, hanem a jogszabályi
> helyzet: az embrió és az ivarsejt nem biobanki minta.

| Ami **közös** a 22. modullal | Ami **nem lehet közös** |
|---|---|
| fizikai tárolóinfrastruktúra, fagyasztók, monitorozás | a beleegyezés tárgya és formája |
| őrzési lánc, azonosítórendszer, hőmérséklet-napló | **mindkét fél rendelkezési joga** |
| minőségirányítás, SOP-ok, kalibrálás, katasztrófaterv | válás és haláleset esetére előre rögzített döntés |
| kompetencia-nyilvántartás, belső audit, CAPA | **tárolási időkorlát** |
| eltéréskezelés hatásvizsgálattal | kutatási felhasználás — **külön beleegyezéssel, alapból nem** |

**Következmény a BBMRI-ERIC Directoryra**: a reprodukciós tárolás **nem listázható**
kutatási gyűjteményként az embriókra és ivarsejtekre vonatkozó rendelkezés nélkül. A
biobanki gyűjtemények igen; ez a kettő a Directoryban is elkülönül.



Az embrió és az ivarsejt tárolása **jogilag más kategória, mint a biobanki minta**.
Külön szabályozás, külön beleegyezés, tárolási időkorlát, és rendelkezési döntések, amiket a
biobanki keret nem fed le.

| Kérdés | Miért más |
|---|---|
| Kinek a rendelkezése alatt áll? | **mindkét félé** — a pár együttes döntése kell |
| Mi történik válás esetén? | előre rögzített rendelkezés |
| Mi történik az egyik fél halála esetén? | előre rögzített rendelkezés |
| Meddig tárolható? | **jogszabályi időkorlát** `[jogi ellenőrzés]` |
| Mi történik a tárolási idő lejártakor? | előre rögzített: megsemmisítés · adományozás kutatásra · adományozás párnak |
| Visszavonás | bármelyik fél visszavonhatja `[jogi ellenőrzés]` |

**A `24` modul saját `art_cryo_*` táblákat kap**, a `22` biobank
nyomonkövethetőségi mintájára (azonosító, tárolóhely-hierarchia, append-only eseménylánc,
hőmérséklet-monitorozás), de **külön beleegyezési és rendelkezési logikával**.

> A tárolóhely, a fagyasztó-monitorozás és a katasztrófaterv **közös** a biobankkal — a
> fizikai infrastruktúrát nem duplikáljuk, csak a jogi keretet választjuk szét.

### 4.1 Donor ivarsejt és embrió

Önálló beleegyezési és nyilvántartási rend: donor-azonosítás, szűrővizsgálatok,
felhasználási korlátok, a származás megismerhetőségének kérdése `[jogi ellenőrzés]`.
Ez a modul legérzékenyebb jogi pontja, és **külön jogi véleményt kíván**.

---

## 5. Kimenetel — az őszinte mérőszám

| Szint | Változó | Mit mér |
|---|---|---|
| Biokémiai terhesség | `ivf.outcome.bhcg` | hCG-pozitivitás |
| **Klinikai terhesség** | `ivf.outcome.clinical` | ultrahanggal igazolt magzatzsák/szívműködés |
| Folyamatos terhesség | `ivf.outcome.ongoing` | 12. héten túl |
| **Élveszülés** | `ivf.outcome.livebirth` | ez az egyetlen, ami a párnak számít |
| Vetélés, extrauterin | `ivf.outcome.loss` | → `03` reprodukciós anamnézis |

### 5.1 Kumulatív élveszülési arány

**A modul kimeneti alapmutatója nem a transzferenkénti terhességi arány**, hanem a
**megkezdett ciklusra jutó kumulatív élveszülési arány**, beleértve az összes fagyasztott
transzfert ugyanabból a leszívásból.

Ez azért fontos, mert a transzferenkénti arány félrevezető: egy freeze-all stratégia
transzferenként jobbnak látszik, miközben a pár szempontjából az számít, hogy egy leszívásból
végül lett-e gyermek. A `20` modul lekérdezője ezt a mutatót adja alapértelmezésként.

### 5.2 Regiszter-jelentés

Az ART-tevékenység nemzeti és nemzetközi regiszterek felé jelentendő `[ellenőrizendő: a
jelentési kötelezettség pontos jogalapja és formátuma]`. A modul úgy épül, hogy a
regiszter-definíciók szerinti mezők leképezhetők legyenek — a `08-interoperabilitas.md`
outbox-mintájával.

---

## 6. Keresztfeltöltés

**⇦ Mi tölti fel**: `02` (`ctx.pathway = pre-ivf`, `ctx.conception`), `03` (reprodukciós és
endokrin anamnézis), `04` (infertilitás státusz), `05` (endokrin labor, UH, HSG),
`23` (genetika: hordozói szűrés, PGT indikáció), `12` (fertilitásmegőrzés onkológiai betegnél).

**⇨ Mit tölt fel**:

| Cél | Mit |
|---|---|
| `02` | a létrejött terhesség `ctx.conception` értéke — **ez végigkíséri a terhesgondozást** |
| `03` | a ciklus bekerül a reprodukciós anamnézisbe |
| `05` | koraterhességi UH-protokoll (IVF-terhességnél a datálás a transzfer dátumából) |
| `10` | az IVF-terhesség önálló szülészeti rizikó (PE, koraszülés, többes terhesség) |
| `18` | laboratóriumi és klinikai teljesítménymutatók |
| `22` | ha a maradék minta biobankba kerül — **külön beleegyezéssel** |

> **A `ctx.ga` datálása IVF-nél a transzfer dátumából és az embriókorból történik** — ez a
> legpontosabb forrás, és a `02` modul precedencia-listájának első helyén áll. Ez az egyik
> legkonkrétabb példa arra, miért kell a `gaSource` mezőt tárolni.

---

## 7. Elfogadási kritérium

1. Egy teljes ciklus végigvihető a stimulációtól a kimenetelig, és a **kumulatív élveszülési
   arány** kiszámolható a megkezdett ciklusra, az összes FET-tel együtt.
2. **Magas OHSS-kockázatnál** a rendszer felajánlja az agonista triggert és a freeze-all-t;
   ha a klinikus mégis hCG-t és friss transzfert választ, **indoklás nélkül nem folytatható**.
3. Egynél több embrió átültetésénél a megosztott döntés és a többes terhességi kockázat
   közlése **dokumentálva van**.
4. Súlyos oligo-/azoospermia esetén ICSI **genetikai tanácsadás nélkül nem indítható**
   (`23` modul kapuja).
5. Az IVF-ből létrejött terhességnél a gesztációs kor **a transzfer dátumából** számolódik,
   és a `gaSource` ezt mutatja.
6. Az embrió-rendelkezés (válás, haláleset, tárolási idő lejárta) **előre rögzített**, és
   tárolás nem indítható nélküle.

---

## 8. Nyitott kérdések

1. **Az embrió- és ivarsejt-tárolás jogi kerete** — tárolási időkorlát, rendelkezési jog,
   visszavonás, donor-anonimitás. Ez **külön jogi véleményt kíván**, és a `22` biobanki
   keret nem fedi le.
2. **Melyik embrió-értékelési rendszert** használjuk, és melyik verzióját? Verziózni kell.
3. **A spermiogram referenciaérték-készlete** — melyik kiadás. Ez a leletek
   összehasonlíthatóságát dönti el, és időnként változik.
4. **A laboratóriumi teljesítménymutatók küszöbei** — a laborral együtt rögzítendő,
   forrásmegjelöléssel.
5. **Az ART regiszter-jelentés** pontos jogalapja, adatköre és formátuma.
6. **Donor gaméta** használata cél-e egyáltalán? Ha igen, önálló alfejezet és jogi keret kell.
