# MDR (EU) 2017/745 — megfelelőségi dokumentáció

> **K2 eldőlt:** az ETT-engedélyeztetés **és** az MDR-megfelelőségi dokumentáció
> **párhuzamosan** készül. Ez visszahozza az MDR-t a hatókörbe, amit a `00-pozicionalas.md`
> korábban kivett belőle.
>
> **Ez tervezési keret, nem jogi vélemény és nem tanúsítvány.** Az MDR és a hivatkozott
> szabványok szövege megvásárolható, illetve az EUR-Lexen elérhető; a cikk- és
> mellékletszámokat a **hatályos szöveggel ellenőrizni kell**.

---

## 1. Miért lett ez megint kérdés

Az eredeti döntés: kutatási cél → nincs megfelelőségértékelés. Ez most **kettévált**:

| Sáv | Használat | Szabályozás |
|---|---|---|
| **Kutatási** | most, adatgyűjtés és elemzés | etikai engedély + GDPR — ld. `03-magyar-jog.md`, `02-gdpr.md` |
| **Eszköz** | később, betegellátási rutin | **MDR** — ez a fejezet |

A kettő nem zárja ki egymást, de **a dokumentációt egyszerre kell építeni**, mert
visszamenőleg nem pótolható: a klinikai értékeléshez, a kockázatkezeléshez és a
szoftver-életciklushoz a **fejlesztés közben keletkező bizonyíték** kell.

> **A párhuzamos építés valódi haszna:** ha a kutatási fázisban a rendszer már MDR-konform
> módon dokumentált, a későbbi megfelelőségértékelés nem újrakezdés, hanem összeállítás.

---

## 2. Osztályba sorolás

**11. szabály** (Annex VIII): a diagnosztikai vagy terápiás célú információt szolgáltató
szoftver jellemzően **IIa. osztály**; ha a döntés halált vagy visszafordíthatatlan
állapotromlást okozhat, magasabb.

Az OGDOC funkciói ebbe a sávba esnek: fullPIERS (48 órás súlyos anyai esemény), CMQCC
vérzési stratifikáció, NICHD kategorizáció, transzfúziós és inzulin javaslatok, OHSS-riasztás,
EKG-értékelés.

> **A besorolást a gyártó végzi, és a bejelentett szervezet felülvizsgálja.** Az OGDOC
> **funkciónként eltérő** lehet: a dokumentációs modulok nem eszközök, a score-motor igen.
> **Javaslat:** a rendszer moduláris felépítése lehetővé teszi az **eszközhatár szűk
> meghúzását** — az „eszköz" a `core/scores/` és a hozzá tartozó felület, nem az egész
> platform. Ez lényegesen kevesebb dokumentációt jelent.

**MDCG 2019-11** ad iránymutatást a szoftver minősítéséhez és besorolásához — ezt kell
alapul venni, és a besorolás indoklását dokumentálni.

---

## 3. Mit kell előállítani

| Dokumentum | Alap | Mikor |
|---|---|---|
| **Műszaki dokumentáció** | MDR Annex II | folyamatos |
| **PMS műszaki dokumentáció** | MDR Annex III | Fázis 3-tól |
| **GSPR-mátrix** | MDR Annex I — minden követelményre: alkalmazható-e, mi elégíti ki, mi a bizonyíték | Fázis 1-től |
| **Kockázatkezelési akta** | **ISO 14971:2019** | Fázis 0-tól |
| **Szoftver-életciklus akta** | **IEC 62304** | Fázis 0-tól |
| **Használhatósági akta** | **IEC 62366-1** | Fázis 2-től |
| **Klinikai értékelés** | MDR Annex XIV A + **MDCG 2020-1** | Fázis 3-tól |
| **PMCF-terv és -jelentés** | MDR Annex XIV B | Fázis 4-től |
| **Kiberbiztonsági dokumentáció** | **MDCG 2019-16** | Fázis 1-től |
| **QMS** | **ISO 13485:2016** | Fázis 2-től |
| **UDI, EUDAMED-regisztráció** | MDR Annex VI | megfelelőségértékeléskor |

---

## 4. A négy szabvány, ami a napi munkát megszabja

### 4.1 ISO 14971 — kockázatkezelés

Nem egyszeri elemzés, hanem **folyamatos akta**: veszélyhelyzet → kockázat becslése →
intézkedés → **maradék kockázat** → a haszon-kockázat mérlegelése.

**Az OGDOC-specifikus veszélyhelyzetek, amiket az aktának tartalmaznia kell:**

| # | Veszélyhelyzet | A tervben lévő intézkedés |
|---|---|---|
| 1 | Egy score hiányzó bemenettel számol, és számot mutat | **„nincs néma helyettesítés"** — `insufficient`, nem 0 (`01-architektura.md`) |
| 2 | Egy modul némán elhal, a klinikus negatív leletnek olvassa | hibahatár, ami **kiír**; a `CaseState.errors[]` a leleten megjelenik |
| 3 | Elavult érték alapján számol a rendszer | `validity` ablak, lejárt érték szürkén, score-ból kizárva |
| 4 | Prefill-elt érték mértnek látszik | `provenance` + `confidence` minden értéken, forrásjelzéssel |
| 5 | Szűrési eredmény diagnózisnak látszik | **`23` modul**: a NIPT szűrési eredmény marad, PPV-vel |
| 6 | Kontraindikált szer rendelése | **hard-stop kapuk** (`06` modul) |
| 7 | OHSS megelőzhető esete | kikényszerített mérlegelés (`24` modul) |
| 8 | Rossz beteg adata a képen | **DICOM Modality Worklist** (`08` fejezet) |
| 9 | Az EKG kép-alapú felismerés téved | **`05` modul**: emberi megerősítés kötelező, a gépi olvasat javaslat |
| 10 | Jogosulatlan hozzáférés betegadathoz | RLS, szerepkörök, auditnapló |

> **Ez a tíz tétel nem utólag kerül az aktába** — mind már a tervben van, intézkedésként. Az
> ISO 14971 akta ezeket **formalizálja**, nem kitalálja. Ez a párhuzamos építés lényege.

### 4.2 IEC 62304 — szoftver-életciklus

**Biztonsági osztály** komponensenként: **A** (nem okozhat sérülést) · **B** (nem súlyos
sérülés) · **C** (halál vagy súlyos sérülés).

| Komponens | Javasolt osztály | Indoklás |
|---|---|---|
| `core/scores/` | **C** | fullPIERS, CMQCC, NICHD — a téves eredmény súlyos következménnyel járhat |
| `core/derive/` | **C** | a score-ok bemenetét adja |
| hard-stop kapuk (`06`) | **C** | kontraindikáció |
| `core/registry/`, `validate/` | **B** | |
| Dokumentumgenerálás, export | **B** | |
| CRM, beosztás, CMS (`19`) | **A** | nem klinikai |

**Amit a C osztály megkövetel, és amit már tervezünk:** részletes tervezés, egységszintű
verifikáció, **integrációs és rendszerteszt**, konfigurációkezelés, problémakezelés — és
a **SOUP** (Software of Unknown Provenance) nyilvántartás minden külső függőségre.

> A **SOUP-lista** a leggyakrabban kihagyott tétel: minden npm-csomag, a Postgres, az
> Orthanc, a futtatókörnyezet — verzióval, ismert hibákkal és a frissítési politikával.
> Ezt a Fázis 0-ban kell elkezdeni, mert utólag több száz függőségre visszamenőleg
> összeállítani reménytelen.

### 4.3 IEC 62366-1 — használhatóság

Nem szépészet: a **használati hibából eredő kockázat** kezelése. Használati specifikáció,
biztonsággal összefüggő felhasználói felület azonosítása, formatív és **szummatív értékelés**
valós felhasználókkal.

**Az OGDOC szempontjából a kritikus felületi elemek**: a score-eredmény és az `insufficient`
állapot megjelenítése, a hard-stop modálok, a prefill-jelzés, a szűrés/diagnózis
megkülönböztetés, és a lejárt érték jelölése. **Ezeket kell szummatív értékelésen átvinni.**

### 4.4 ISO 13485 — minőségirányítás

Átfed az ISO 20387-tel (`01-iso20387.md`) és a MIR-dokumentumfával
(`05-mir-dokumentumfa.md`): dokumentumszabályozás, feljegyzések, belső audit, vezetőségi
átvizsgálás, CAPA, beszállítók.

> **Ne épüljön két külön MIR.** Egy rendszer legyen, amely mindkét szabvány követelményeit
> kielégíti — a `05-mir-dokumentumfa.md` eljárásai (QP-01…08) mindkettőt fedik.

---

## 5. Klinikai értékelés

MDR Annex XIV A + MDCG 2020-1. **Három forrásból** áll:

1. **Irodalmi bizonyíték** — a beépített score-ok publikált validációja. Ez a rendszer
   erőssége: minden algoritmus mellett ott a DOI/PMID és a kohorsz jellemzése (n, AUC,
   populáció). Ez nem véletlen — a `00-pozicionalas.md` az „átjárás fenntartása" néven
   pontosan ezért írta elő.
2. **Saját klinikai adat** — a kutatási fázisban gyűjtött adat, ha a protokoll erre
   tervezve van. **Itt kapcsolódik az ETT-sáv az MDR-sávhoz.**
3. **Egyenértékűség** más eszközzel — jogilag nehéz, nem érdemes rá építeni.

### 5.1 A validált algoritmus ≠ validált eszköz

Ez a klinikai értékelés legfontosabb pontja, és a legkönnyebben elhibázható:

> A fullPIERS publikált validációja **az algoritmusra** vonatkozik, nem a mi
> megvalósításunkra. Az eszköz klinikai értékelése azt kell hogy igazolja, hogy **a mi
> rendszerünk** helyesen számol, helyesen jelenít meg, és a szándékolt populációban a
> szándékolt célra alkalmas.

Ezért a **golden-tesztek és a referencia-fixture-ök** (`01-architektura.md`) nem
fejlesztői kényelem, hanem **klinikai értékelési bizonyíték**: minden score-ról ki kell
mutatni, hogy a publikált példaszámítást reprodukálja.

---

## 6. Az AI-komponensek külön kérdése

A K4 döntés (**kép-/szkennelés-alapú EKG-felismerés**) és a meglévő AI-átjáró-funkciók
külön elbírálás alá esnek.

| Jogszabály | Mit hoz |
|---|---|
| **MDR** | az AI-komponens az eszköz része; validálni kell, mint bármely más funkciót |
| **AI-rendelet (EU) 2024/1689** | az MDR alá tartozó, harmadik fél általi megfelelőségértékelést igénylő termékek AI-rendszerei **nagy kockázatúak** |

**Amit a nagy kockázatú besorolás megkövetel** (a hatályos szöveggel ellenőrizendő):
kockázatkezelési rendszer, **adatkormányzás** (a tanító- és tesztadat minősége,
reprezentativitása, torzításai), műszaki dokumentáció, naplózás, átláthatóság és
felhasználói tájékoztatás, **emberi felügyelet**, pontosság/robusztusság/kiberbiztonság.

**Ezért írja elő a `05` modul EKG-szakasza**, hogy a gépi olvasat **javaslat**, és az emberi
megerősítés kötelező — ez az „emberi felügyelet" követelmény tervezési megfelelője.

> **Modellértékelés:** a prediktív komponensekre a **PROBAST+AI / TRIPOD+AI** keret
> alkalmazandó a torzítás és a jelentés teljességének értékelésére. Ez a klinikai
> értékelésbe is bemenet.

---

## 7. Piacra hozatal utáni kötelezettségek

| Kötelezettség | Mit jelent |
|---|---|
| **PMS-rendszer és -terv** | rendszeres adatgyűjtés a valós használatról |
| **PSUR** (IIa: legalább kétévente) | időszakos biztonsági jelentés |
| **PMCF** | tervezett utánkövetés a klinikai bizonyíték fenntartására |
| **Vigilancia** | súlyos váratlan esemény jelentése; helyszíni biztonsági korrekciós intézkedés (FSCA) |
| **Trendjelentés** | nem súlyos események statisztikailag jelentős emelkedése |

> **A `18` minőségbiztosítási modul és a `20` lekérdező ezt szolgálja ki.** Az
> **eltérés-elemzés** (mikor bírálta felül az orvos a javaslatot, és mi lett a kimenetel)
> nem csak kutatási kérdés — **PMS-bizonyíték**.

---

## 8. Ütemezés az ETT-sávval párhuzamosan

| Fázis | ETT / kutatási sáv | MDR-sáv |
|---|---|---|
| **0** | protokoll váza, jogalap, DPO, DPIA indítása | **ISO 14971 akta megnyitása**, IEC 62304 osztályozás, **SOUP-lista**, eszközhatár meghúzása |
| **1** | **ETT-beadvány** (ld. `10-ett.md`) | GSPR-mátrix váza, kiberbiztonsági koncepció |
| **2** | adatgyűjtés indul | használhatósági specifikáció, formatív értékelés, QMS-váz |
| **3** | első elemzések | **klinikai értékelési terv**, golden-tesztek mint bizonyíték, szummatív használhatóság |
| **4** | publikáció | műszaki dokumentáció összeállítása, PMS-terv |
| **5+** | | bejelentett szervezet kiválasztása, megfelelőségértékelés |

**Reális átfutás a megfelelőségértékelésre: 12–24 hónap** a bejelentett szervezet
megkeresésétől, jó felkészültség mellett.

---

## 9. Nyitott kérdések

1. **Hol húzzuk meg az eszközhatárt?** Ez a legfontosabb és leginkább költségbefolyásoló
   döntés. Javaslat: a `core/scores/` és a hozzá tartozó felület — nem az egész platform.
2. **Ki a gyártó** MDR-értelemben? Intézmény vagy önálló jogi személy? Ez felelősségi és
   szervezeti kérdés.
3. **Intézményen belüli gyártás (in-house)** kivétele alkalmazható-e? Az MDR 5. cikk (5)
   bekezdése enged egy szűk kivételt egészségügyi intézményekben gyártott és használt
   eszközökre, feltételekkel `[jogi ellenőrzés]`. **Ha ez alkalmazható, lényegesen
   egyszerűbb utat jelent** — érdemes elsőként megvizsgálni.
4. **Melyik bejelentett szervezet**, és mennyi a jelenlegi várakozási idő?
5. Az **AI-rendelet** alkalmazási időpontjai és a konkrét követelmények a mi
   komponenseinkre `[ellenőrizendő]`.
