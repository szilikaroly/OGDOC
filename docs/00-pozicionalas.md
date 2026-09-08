# 00 — Pozicionálás, hatókör, szabályozási keret

## Mi ez

**OGDOC** — szülészeti és nőgyógyászati integrált dokumentációs és döntéstámogató rendszer.
Egyetlen betegút teljes dokumentációját fedi le a panasztól a zárójelentésen át az utánkövetésig,
17 modulban.

Három meglévő eszköz egyesítése és továbbfejlesztése:

| Forrás | Mit ad | Mit nem ad |
|---|---|---|
| **Anamnézis-asszisztens v16** (1,09 MB, egyfájlos HTML) | 110 kérdéssoros strukturált anamnézis, családfa, endokrin modul, ultrahang-modul normogramokkal, BNO/OENO-ajánló, FHIR-export, 6 nyelv | csak felvételi fázis; nincs vizit-idősor, nincs szülőszoba, nincs kimenetel |
| **IPRACS v1.0** (egyfájlos HTML, 103 JS-függvény) | 25+ validált score (fullPIERS, MEOWS, CMQCC, NICHD, Bishop, VBAC, CORI…), partogram, sürgős/elvonás/újszülött modulok, 4 szintű oktatási réteg | csak szülőszoba; session-szintű adat, oldalbetöltéskor elvész; SSOT-sértések (Bishop 3 helyen) |
| **ICHOM PCB v5.0 (2025)** | 145 nemzetközi kimenetel-változó, 131 kódlistával, validált PROM-készletekkel (EQ-5D-5L, WHODAS 2.0, EPDS, BSES-SF, MIBS, BSS-R) | csak kimenetel-mérés; nincs folyamattámogatás |

Az OGDOC az, ami mindháromból hiányzik: **egy összefüggő adatgerinc**, amelyben az anamnézisben
egyszer rögzített adat végigkíséri a beteget a szülőszobáig és a 42. napos utánkövetésig, és
minden számítás visszavezethető arra, hogy pontosan mit látott.

## Amit a rendszer NEM

- **Nem diagnosztizál önállóan.** Level 2–3 klinikai döntéstámogatás: jelez, számol, javasol,
  hivatkozik — a döntés az orvosé.
- **Nem helyettesíti a kórházi HIS-t.** Nem betegnyilvántartás, nem számlázási rendszer.
  Kimenete exportálható (FHIR R4, ICHOM CSV, REDCap), de nem hiteles egészségügyi dokumentum,
  amíg intézményi validáció és jóváhagyás nem történt.
- **Nem szűrőteszt.** Egyetlen beépített score sem diagnosztikus; mindegyik prediktív valószínűséget
  vagy kockázati sávot ad, ismert érzékenységgel és specificitással.

## Szabályozási pozíció — eldöntve: kutatási cél

**A rendszer kutatási, oktatási és belső minőségfejlesztési célra készül, nem betegellátási
rutinhasználatra.** Ez a projekt egyik alapdöntése, és sok mindent egyszerűsít — de nem
mindent, és nem véglegesen.

### Amit ez megspórol

Az EU MDR (2017/745) **11. szabálya** szerint az a szoftver, amely diagnosztikai vagy terápiás
célú információt szolgáltat, jellemzően **IIa. osztályú orvostechnikai eszköz**. Az OGDOC
funkciói (fullPIERS 48 órás súlyos anyai esemény, CMQCC vérzési stratifikáció, NICHD
kategorizáció, transzfúziós és inzulin javaslatok) egyértelműen ebbe a sávba esnének.

Kutatási eszközként **nem kell megfelelőségértékelés, CE-jelölés, bejelentett szervezet**. Ez
hónapokat és jelentős költséget takarít meg, és ez a különbség indokolja a döntést.

### Amit nem spórol meg

Kutatási használat **más** kötelezettségeket hoz, nem kevesebbet:

| Kötelezettség | Mit jelent |
|---|---|
| **Etikai jóváhagyás** | Emberen végzett orvostudományi kutatáshoz Magyarországon ETT TUKEB vagy intézményi kutatásetikai bizottsági engedély kell. Ez a bevezetés feltétele, nem formalitás. |
| **Kutatási protokoll** | Előre rögzített kérdésfeltevés, mintanagyság, elemzési terv. Enélkül a gyűjtött adat utólag nem publikálható. |
| **Tájékozott beleegyezés** | A v16 biobanki nyilatkozata ennek a magja, de jogi és etikai jóváhagyást igényel. |
| **GDPR jogalap** | Kutatási adatkezelés jogalapja és a 89. cikk szerinti garanciák. |
| **Pszeudonimizálás** | Ld. lentebb — ez az, ami a legkonkrétabban érinti az architektúrát. |

### Amit a „kutatási cél" az architektúrán változtat

Három konkrét következmény, ami a fejlesztési sorrendet is átrendezi:

1. **Az export előrébb kerül.** Ha a rendszer célja adatot termelni, akkor a de-identifikált
   export (ICHOM CSV, REDCap, FHIR) nem a 4. fázis kényelmi funkciója, hanem a 2. fázis
   alapkövetelménye. Egy kutatási eszköz, amiből nem lehet kinyerni az adatot, használhatatlan.
2. **Pszeudonimizálási réteg kell.** A v16 ma tartalmaz `taj` (TAJ-szám) és `pid` mezőt —
   a TAJ **közvetlen azonosító**. Kutatási használatban ezek nem kerülhetnek az elemzési
   adatállományba: a regiszter `phi: true` jelölése alapján az export automatikusan kihagyja
   vagy visszafordíthatatlan kutatási azonosítóra cseréli őket. Az összekötő kulcs, ha kell,
   külön, hozzáférés-korlátozottan él.
3. **Adatteljesség mérése alapfunkció.** Kutatásban az „üresen maradt kötelező mező" nem
   szépséghiba, hanem a minta minőségének mérőszáma. A 18. modul (minőségbiztosítás)
   adatteljességi része ezért nem hagyható a legvégére.

### Az átjárás fenntartása

A kutatási státusz **nem zsákutca**, de csak akkor, ha most is úgy építünk, hogy később
megfordítható legyen. Két dolog kell hozzá, és mindkettő olcsó most, drága utólag:

- **Minden algoritmus mellett ott a forrás** — DOI/PMID és a validációs kohorsz jellemzése
  (n, AUC, populáció). Egy későbbi MDR klinikai értékelés enélkül nem elvégezhető, és
  visszamenőleg 25+ score-hoz hivatkozást gyűjteni nem fog megtörténni.
- **Változáskövetés algoritmus-szinten** — minden képlet-, küszöb- és kódlista-változás
  verziózott, dátumozott, indokolt. Egy retrospektív adat mellett tudni kell, *melyik verzió*
  számolta.

A felületen és a README-ben végig látszik a használati kategória: **kutatási, oktatási és belső
minőségfejlesztési használat, orvosi felügyelet mellett.**

## Adatvédelmi pozíció

A rendszer **adatbázis-alapú, a nulladik naptól** (ld. `07-intuicare-alap.md`). Nincs
„előbb offline fájl, aztán majd szerver" szakasz — ezért az adatvédelmi teher is a teljes,
a kezdetektől:

| Terület | Mit jelent | Hol tart |
|---|---|---|
| Jogalap és cél | kutatási adatkezelés, célhoz kötve, dokumentumverzióval és visszavonhatósággal | `gdpr_consents` **megvan** |
| DPIA | a klinikai adat különleges adat (GDPR Art. 9) — hatásvizsgálat kell | teendő |
| Hozzáférés | szerepkör-alapú, **RLS-sel kikényszerítve**, nem felületszűrés | `has_role`, `can_access_patient`, `current_tenant_id` **megvan** |
| Auditnapló | minden érzékeny művelet | `admin_audit_log` + `audit_trigger_fn` **megvan** |
| Hordozhatóság | GDPR Art. 20 | `patient-gdpr-export` **megvan** |
| Megőrzési idő | a kutatási protokollhoz kötve | teendő |
| Hosting | EU-régió (Eüak 1997. évi XLVII. tv.) | **megvan** |

Ez nem többletteher az eredeti tervhez képest, hanem **előrehozott** teher: a webes fázisban
amúgy is ez lett volna, csak később és drágábban. A platform nagy részét már hordozza.

> **Egy örökölt biztonsági hiba blokkolja az élesítést.** A modul-audit BUG-015 tétele szerint
> az új tenant első felhasználója bárki lehet, aki insert-elni tud
> (`user_roles_bootstrap_admin`). Kutatási adatgyűjtés ezen nem indulhat el — ld.
> `07-intuicare-alap.md` 6. pont.

**A TAJ-szám és a betegazonosító külön elbírálás alá esik.** A v16-ban ezek szabad mezők
(`taj`, `pid`), a felületen „csak helyi mentéshez" megjelöléssel. Az OGDOC-ban a regiszter
`phi: true` jelölést kapnak, ami három dolgot jelent: az export alapból kihagyja őket, a
kutatási adatállományba visszafordíthatatlan azonosító kerül helyettük, és a mentett eset
megnyitásakor a felület jelzi, hogy azonosítót tartalmaz.

A repó — a v16 gyakorlatát folytatva — **soha nem tartalmaz beteg-azonosításra alkalmas adatot**.
A tesztesetek szintetikusak.

## Célfelhasználók és a hozzájuk tartozó felület

Az IPRACS négyszintű oktatási rétegét (`student` / `resident` / `specialist` / `professor`)
átvesszük és kiterjesztjük **szerepre** is, mert a kettő nem ugyanaz:

| Szerep | Mit lát | Mit ír |
|---|---|---|
| Beteg / várandós | panasz-űrlap, PROM-kérdőívek, tájékoztatók | önbevallott adat (jelölve!) |
| Szülésznő / ápoló | vitálisok, partogram, WHO LCG rács, szoptatás | idősoros megfigyelés |
| Rezidens | teljes klinikai felület, algoritmus-magyarázatokkal | minden klinikai adat |
| Szakorvos | + validációs adatok, limitációk, felülbírálás | + felülbírálás indoklással |
| Kutató | de-identifikált export, ICHOM/REDCap | — |

**A szerep valódi biztonsági határ**, mert a platform szerveroldali, RLS-sel kikényszerített
jogosultságkezelést ad: `has_role(_user_id, _role)`, `can_access_patient(patient_id)`,
`current_tenant_id()`. A meglévő szerepkörök — `tenant_admin`, vezető kategória,
`foorvos`/`szakorvos`, `szakdolgozo`, `beoszto`, `recepcio`, `patient_users` — a fenti
felsorolásra képződnek le.

Az oktatási szint (`student`…`professor`) ezzel szemben **csak tartalommélység-szűrés**, nem
jogosultság — azt a felhasználó szabadon állíthatja.

## Siker-kritériumok

A terv akkor teljesült, ha:

1. Egy teljes betegút (pre-IVF → terhesgondozás → szülőszoba → 42. napos utánkövetés) végigvihető
   úgy, hogy **egyetlen adatot sem kell kétszer beírni**.
2. Bármely számított értékre rákattintva látszik: mely változókból, melyik képlettel, melyik
   publikáció alapján, és **mikor rögzített** értékekből jött.
3. Az egész klinikai mag (regiszter + levezetés + score-ok) DOM és adatbázis nélkül fut
   Node-ban, és a golden-teszteken átmegy — a felület és a tárolás cserélhető alatta.
4. A kimenetel-adatok gombnyomásra ICHOM PCB v5.0-kompatibilis exportot adnak, azonosító
   nélkül, kutatásra közvetlenül használható alakban.
5. Minden kifelé induló klinikai adat **FHIR R4 alakon megy át**, és a `RecordingAdapter`
   ellenőrizhetővé teszi a generált dokumentumot, mielőtt bármely külső rendszerhez
   csatlakoznánk (ld. `08-interoperabilitas.md`).
