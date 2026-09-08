# Modul 12 — Onkológia

| | |
|---|---|
| **Cél** | Nőgyógyászati daganatok és a terhesség alatti daganat dokumentációja |
| **Forrás** | ÚJ (a v16 `s_onc`, `f_canc`, `f_ucanc` tételei ide vezetnek) |
| **Becsült változó** | ~120 |
| **Fázis** | 6 |
| **Függ** | 03, 05, 11 |

## Mi van már meg az IntuiCare-ben

A `clinical_diagnoses` (`icd10_code`, `snomed_code`, `certainty`) és a `followup_protocols` adja a vázat. **A modul többi része teljesen új** — FIGO/TNM stádiumrendszerek, molekuláris profil, terápia, RECIST, fertilitásmegőrzés.

## 1. Előrebocsátva: ez a modul lóg ki leginkább

Az onkológia önálló szakterület, saját stádiumrendszerekkel, protokollokkal és
követési renddel. A 18 modul közül ez az, amelyik a legkevésbé illeszkedik a szülészeti-
nőgyógyászati dokumentációs gerinchez, és a legalacsonyabb prioritást kapja (Prio 0,6).

**Benne van a tervben, teljes terjedelemben** — de ha valamit el kell hagyni vagy későbbre
tolni, ez az első.

## 2. Két útvonal

### 2.1 Nőgyógyászati daganat (`onc.gyn.*`)

Lokalizációk: cervix, endometrium, ovarium/tuba/peritoneum, vulva, vagina, emlő.

| Változó | Tartalom |
|---|---|
| `onc.gyn.site` | lokalizáció |
| `onc.gyn.histology` | szövettan (WHO-klasszifikáció) |
| `onc.gyn.grade` | differenciáltság |
| `onc.gyn.figo` | **FIGO-stádium** — lokalizációnként más rendszer |
| `onc.gyn.tnm` | TNM |
| `onc.gyn.molecular` | molekuláris profil (pl. endometrium: POLE / MMRd / p53abn / NSMP) |
| `onc.gyn.receptor` | ER, PR, HER2 (emlő) |
| `onc.gyn.germline` | csíravonalas mutáció (BRCA1/2, Lynch) |

### 2.2 Terhesség alatti daganat (`onc.preg.*`) — külön útvonal

Ez a modul valódi indoka. A terhesség alatti daganatkezelés önálló klinikai probléma:

- **Gesztációs kor a diagnóziskor** — ez dönti el, mi adható
- Kemoterápia időzítése: az I. trimeszterben kontraindikált, a II–III.-ban több szer adható
- Sugárterápia: dózis és lokalizáció szerinti magzati kockázat
- **A terhesség folytatásának vagy befejezésének kérdése** — megosztott döntéshozatal,
  dokumentált tanácsadással
- Szülés időzítése a kezeléshez képest (a kemoterápia után legalább 3 hét a szülésig, a
  csontvelő-mélypont miatt)
- Placenta-metasztázis lehetősége (melanoma, leukaemia)

## 3. Terápia és követés

| Alszekció | Tartalom |
|---|---|
| Műtét | `11` modullal közös, onkológiai kiegészítéssel (staging, nyirokcsomó, reziduum) |
| Kemoterápia | protokoll, ciklusszám, dózisredukció, toxicitás (CTCAE) |
| Sugárterápia | technika, dózis, frakcionálás, célterület |
| Célzott / immunterápia | szer, biomarker-alap |
| **Válaszértékelés** | RECIST 1.1 |
| Követés | vizitrend, tumormarker, képalkotás |

## 4. Fertilitásmegőrzés

Ez köti vissza a modult a rendszer többi részéhez: petesejt-/embriófagyasztás,
ovariumszövet-fagyasztás, GnRH-agonista ovariumvédelem, a kezelés előtti időablak. Az
`05` endokrin labor (AMH, AFC) és a `03` reprodukciós anamnézis közvetlen bemenet.

## 5. Genetikai tanácsadás

A v16 családfa-modulja már gyűjti a `f_canc` (örökletes daganatszindróma) és `f_ucanc`
(fiatalon kialakult daganat, típus nem tisztázott) tételeket. Ez a modul köti össze: ha a
családfában halmozódás van, a genetikai tanácsadás javallata automatikusan megjelenik.

**A tanácsadás és a vizsgálat maga a [23. modulé](23-genetika.md)** — a tanácsadási kapuval,
a variánsok ACMG-osztályozásával és a kaszkád-vizsgálattal együtt. A fertilitásmegőrzés
pedig a [24. modullal](24-ivf.md) közös: az AMH és az AFC onnan jön, a petesejt- és
embriófagyasztás oda tartozik.

## 6. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` (családi daganathalmozódás, korábbi daganat), `05` (szövettan,
képalkotás, tumormarker), `02` (`ctx.ga` — a terhességi útvonalhoz).

**⇨ Mit tölt fel**: `06` (kemoterápiás szerek terhességi besorolása) · `13` (multidiszciplináris
onkoteam-javallat) · `17` (BNO C-fejezet, OENO) · `15` (kimenetel, túlélés).

## 7. Elfogadási kritérium

Egy terhesség alatt diagnosztizált emlődaganat esetén a modul a gesztációs kor alapján jelzi,
mely kezelési modalitások adhatók, és **kötelezővé teszi a megosztott döntéshozatal
dokumentálását**.

> **Ez teszt, nem ígéret:** [`test/onkologia.test.ts`](../../test/onkologia.test.ts).

A kapu **két** mezőt kíván: a megosztott döntéshozatal tényét ÉS a megbeszélt lehetőségek
felsorolását. A pipa önmagában kipipálható anélkül, hogy bármi történt volna — és **az
egyetlen felkínált út melletti beleegyezés nem döntés**.

## 8. Nyitott kérdés

~~A FIGO-stádiumrendszerek lokalizációnként eltérnek és rendszeresen frissülnek (a cervix
2018-ban, az endometrium 2023-ban változott).~~ **Eldőlt: verziózott kódlistaként, a javaslat
szerint** (`valueSetVersions`, `validFrom` / `validTo`). A megvalósítás egy ponton túlment a
javaslaton, és ez a modul legfontosabb tanulsága:

**A verziószám önmagában kevés.** A rendszer eddig is bélyegezte a `codeSystem.version`
értéket minden rögzített adatra — de ez csak azt mondja meg, MIKOR keletkezett az érték, azt
nem, hogy MIT jelentett akkor. Ehhez a régi **lista** kell, nem a régi verzió neve.

A cervix-rendszer példája mutatja, miért: a 2009-es „IB1" küszöbe 4 cm volt, a 2018-asé 2 cm.
**Ugyanaz a jelölés, más tartalom** — és ez a csendes eset, ami veszélyes: a kód feloldódik,
a címke megjelenik, és senki nem tudja meg, hogy mást olvas, mint amit írtak. Egy 2015-ös
adat a mai lista szerint felolvasva feleakkora daganatot mutatna, mint amekkora volt.

A `readCode()` ezért három választ ad: mi volt akkor, létezik-e ma (`retired`), és ugyanazt
jelenti-e (`meaningChanged`). Az olvasás a rögzítéskori listából, az **írás kizárólag a
jelenlegiből** történik — enélkül a verzióbélyeg semmit nem bizonyítana.

A megszűnt kódot a rendszer **nem konvertálja át** a mai rendszerre. A hamis átfordítás
rosszabb, mint a nyíltan vállalt összehasonlíthatatlanság.

Ez a mechanizmus nem onkológiai: az OENO, a BNO és minden évente frissülő kódrendszer
ugyanígy fogja használni. Az onkológia csak az első hely, ahol a hiánya konkrét kárt okozott
volna. (ld. [`../fejlesztes/19-onkologia.md`](../fejlesztes/19-onkologia.md) 1.)

### Új nyitott kérdés, amit a megvalósítás hozott elő

**A RECIST 1.1 nem számítható, csak a válaszkategória rögzíthető.** A célléziók
nyilvántartása példány-dimenziót kíván (léziónként átmérő, kiindulási és aktuális
mérés) — a mechanizmus megvan (`scopedBy`, ld. a 12. fejlesztői fejezetet), a lézió-roszter
nincs. Addig az `onc.response.recist` a klinikus által megállapított kategóriát tárolja,
nem a rendszer által kiszámítottat, és ezt a mező dokumentációja ki is mondja.
