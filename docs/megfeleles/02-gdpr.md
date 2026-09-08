# GDPR (EU) 2016/679 — leképezés

> A cikkhivatkozások a rendelet szerkezetét követik. **A jogi minősítést adatvédelmi
> tisztviselőnek és jogásznak kell elvégeznie** — ez a fejezet a megfelelés szerkezetét adja,
> nem jogi vélemény.

## 1. Miért különösen szigorú ez az eset

Három tényező találkozik, és mindegyik önmagában is szigorít:

| Tényező | Következmény |
|---|---|
| **Egészségügyi adat** (Art. 4(15)) | különleges kategória, Art. 9 tilalma alá esik |
| **Genetikai adat** (Art. 4(13)) | ugyanaz, de **öröklődő**: az érintett rokonait is érinti, akik nem járultak hozzá |
| **Nagy tételben, rendszeresen** | Art. 35(3)(b) → **DPIA kötelező**; Art. 37(1)(c) → **DPO kötelező** |

### A genetikai adat sajátossága, amit nem lehet megkerülni

**Genetikai mintát teljes körűen anonimizálni gyakorlatilag nem lehet.** A genom önmagában
azonosító: elegendő számú marker mellett újraazonosítható, és a rokonok révén akkor is, ha az
érintett maga sosem adott mintát referencia-adatbázisba.

Gyakorlati következmény: a „de-identifikált tehát nem személyes adat" érvelés genetikai adatra
**nem áll meg**. A rendszer ezért **pszeudonimizálást** (Art. 4(5)) alkalmaz, és a
pszeudonimizált adatot végig **személyes adatként kezeli** — nem esik ki a GDPR hatálya alól.

Ezt a különbséget a felületen is ki kell mondani, mert a kutatók gyakran „anonimizált"-ként
hivatkoznak rá.

---

## 2. Jogalap

### 2.1 A kettős jogalap kérdése

Az egészségügyi és genetikai adat kezeléséhez **két dolog kell egyszerre**:

1. jogalap az Art. 6 szerint, **és**
2. kivétel az Art. 9(1) tilalom alól

| Cél | Art. 6 jogalap | Art. 9 kivétel | Megjegyzés |
|---|---|---|---|
| Klinikai ellátás dokumentálása | 6(1)(c) jogi kötelezettség / 6(1)(e) közfeladat | **9(2)(h)** egészségügyi ellátás | a dokumentációs kötelezettséget az 1997. évi XLVII. tv. adja |
| Biobanki tárolás és kutatás | 6(1)(a) hozzájárulás **vagy** 6(1)(e) közfeladat | **9(2)(a)** kifejezett hozzájárulás **vagy** 9(2)(j) tudományos kutatás Art. 89(1) garanciákkal | **ezt kell eldönteni — ld. lentebb** |
| Minőségfejlesztés, belső audit | 6(1)(f) jogos érdek / 6(1)(c) | 9(2)(h)/(i) | |
| Oktatás | 6(1)(e)/(f) | 9(2)(j), ha kutatásnak minősül | egyébként anonimizált eset kell |

### 2.2 Hozzájárulás vagy közfeladat — döntést kér

**Ez a fejezet legfontosabb nyitott kérdése.**

| | Hozzájárulás (9(2)(a)) | Kutatási kivétel (9(2)(j) + 89(1)) |
|---|---|---|
| Előny | egyértelmű, a beteg számára érthető, etikailag tiszta | a visszavonás nem semmisíti meg a már elvégzett kutatást |
| Hátrány | **bármikor visszavonható** (Art. 7(3)), és a visszavonás kezelése költséges | tagállami jogi alapot kíván; a beteg kevésbé érzi kontrollnak |
| Kockázat | ellátó–beteg viszonyban felmerül a **hatalmi egyensúlytalanság** kérdése (a hozzájárulás önkéntessége) | jogi értelmezési kockázat |

A v16 nyilatkozat **hozzájárulás-alapú**, önállóan választható pontokkal és kimondott
visszavonhatósággal. Ez etikailag erős, és a `06-beleegyezes.md` erre épít.

> **Javaslat:** a biobanki és kutatási felhasználás **hozzájárulás-alapú** maradjon
> (9(2)(a)), az Art. 89(1) garanciákkal együtt alkalmazva — de a jogalap végleges
> megválasztása DPO és jogász feladata, és a **DPIA részeként** kell rögzíteni.

---

## 3. Alapelvek (Art. 5) — hogyan érvényesülnek

| Alapelv | Megvalósítás az OGDOC-ban |
|---|---|
| **Jogszerűség, tisztesség, átláthatóság** (5(1)(a)) | rétegzett adatkezelési tájékoztató, a `gdpr_consents` táblában verziózott dokumentumhivatkozással |
| **Célhoz kötöttség** (5(1)(b)) | minden hozzájárulási pont **külön cél**; a `gdpr_consents.cel` mező. A kutatási cél az 5(1)(b) szerint nem tekintendő összeegyeztethetetlennek — de **ez nem ad szabad felhasználást** |
| **Adattakarékosság** (5(1)(c)) | a `20` modul lekérdezője **nem ad hozzáférést `phi` változókhoz**; az export alapból azonosító nélküli |
| **Pontosság** (5(1)(d)) | a regiszter `provenance` + `confidence` + `validity` burka: látszik, mi mért, mi önbevallott, mi lejárt |
| **Korlátozott tárolhatóság** (5(1)(e)) | megőrzési idők a `08-audit.md`-ben; kutatási célra a 89(1) enged hosszabb tárolást, **de nem korlátlant** |
| **Integritás és bizalmasság** (5(1)(f)) | RLS, szerepkörök, titkosítás, auditnapló (Art. 32) |
| **Elszámoltathatóság** (5(2)) | Art. 30 nyilvántartás, DPIA, auditnapló, dokumentumverziózás |

---

## 4. Érintetti jogok — és a kutatási korlátozás

| Jog | Cikk | Hogyan valósul meg | Korlátozható? |
|---|---|---|---|
| Tájékoztatás | 13–14 | rétegzett tájékoztató; a **14. cikk** akkor is, ha az adat nem az érintettől származik | 14(5)(b) aránytalan erőfeszítés — kutatásnál szűken |
| Hozzáférés | 15 | a `patient-gdpr-export` **már megvan** a platformon | Art. 89(2) alapján tagállami jog korlátozhatja kutatásnál |
| Helyesbítés | 16 | felületről, auditálva | 89(2) |
| **Törlés** | 17 | ld. lentebb — ez a legösszetettebb | 17(3)(d) kutatási cél, ha a törlés lehetetlenné tenné a kutatást |
| Korlátozás | 18 | státusz a rekordon | 89(2) |
| Hordozhatóság | 20 | strukturált export | csak 6(1)(a)/(b) alapon kezelt adatra |
| Tiltakozás | 21 | | 89(2) |
| **Hozzájárulás visszavonása** | 7(3) | **teljes végigfuttatás a rendszeren** — ld. `06-beleegyezes.md` | nem korlátozható |

### 4.1 A visszavonás és a törlés nem ugyanaz

| | Visszavonás (7(3)) | Törlés (17) |
|---|---|---|
| Mire hat | a **jövőbeni** kezelésre | a meglévő adatra |
| Visszamenőleges? | nem — a korábbi kezelés jogszerű marad | igen, kivételekkel |
| Mintára | a minta további kutatási felhasználása megszűnik → megsemmisítés vagy zárolás | ugyanaz |
| **Már publikált kutatásra** | nem hat | 17(3)(d) alapján általában nem érvényesíthető |

**Amit a rendszernek tudnia kell:** a visszavonás pillanatától a minta és az adat **nem
kerülhet be új exportba, új kutatásba, új kiadásba** — és ezt technikailag ki kell
kényszeríteni, nem eljárásrenddel. Ez a `22` modul egyik elfogadási kritériuma.

**Amit ki kell mondani a betegnek:** a már megkezdett vagy lezárt kutatásból az adat nem
vonható vissza. A v16 nyilatkozat ezt tartalmazza — a szövegezését meg kell őrizni.

---

## 5. DPIA — kötelező, és a Fázis 0-ban indul

Art. 35(3)(b): különleges adatok **nagy tételben** történő kezelése → hatásvizsgálat kötelező.
Itt ez nem vitatható.

A DPIA minimális tartalma (Art. 35(7)):

1. a kezelés rendszeres leírása és céljai
2. szükségesség és arányosság értékelése
3. az érintettek jogaira vonatkozó **kockázatok** értékelése
4. a kockázatok kezelésére tervezett **intézkedések**

**Azonosított főkockázatok, amelyeket a DPIA-nak kezelnie kell:**

| Kockázat | Kezelés |
|---|---|
| Genetikai adat újraazonosítása | pszeudonimizálás, kódkulcs elkülönítése, k-anonimitási küszöb a `20` modulban, `phi`-kizárás |
| **A rokonok érintettsége** (nem adtak hozzájárulást) | a tájékoztatóban kimondva; a családi adat kezelése szűkítve |
| Váratlan lelet (secondary finding) | előzetes döntés a betegtől: kér-e visszajelzést — ld. `06-beleegyezes.md` |
| Hatalmi egyensúlytalanság (ellátó kéri a hozzájárulást) | a hozzájárulás megtagadása **nem befolyásolja az ellátást** — kimondva és kikényszerítve |
| Harmadik országba továbbítás | Art. 44–49; SCC vagy megfelelőségi határozat, **külön dokumentálva** |
| Belső visszaélés | RLS, auditnapló, a lekérdezés maga is auditált művelet |
| Adatvédelmi incidens | Art. 33: 72 órán belül a hatóságnak; Art. 34: magas kockázat esetén az érintettnek |

> Ha a DPIA maradék magas kockázatot állapít meg, **Art. 36 szerinti előzetes konzultáció**
> kell a felügyeleti hatósággal (NAIH), az adatkezelés megkezdése *előtt*.

---

## 6. Beépített és alapértelmezett adatvédelem (Art. 25)

Nem elv, hanem tervezési követelmény. Amit az architektúra ad:

| Követelmény | Megvalósítás |
|---|---|
| Pszeudonimizálás alapértelmezésben | a kutatói szerep sosem lát azonosítót; a kódkulcs külön kezelt |
| Adattakarékosság alapértelmezésben | az export alapból `phi` nélkül; a `20` modulban a `phi` változók meg sem jelennek |
| Hozzáférés alapértelmezésben szűk | RLS + `can_access_patient()`; a jogosultság nem felületszűrés |
| A védelem nem kikapcsolható a felhasználó által | a k-anonimitási küszöb és a `phi`-kizárás szerveroldali |

---

## 7. Nyilvántartás, biztonság, adatfeldolgozók

| Cikk | Követelmény | Megvalósítás |
|---|---|---|
| **30** | adatkezelési tevékenységek nyilvántartása | a regiszter és a modultérkép ennek a **gerince**: minden változóról tudjuk a célját, jogalapját, megőrzését |
| **32** | a kockázattal arányos biztonság | titkosítás, RLS, auditnapló, hozzáférés-kezelés, helyreállítási képesség, **rendszeres tesztelés** |
| **28** | adatfeldolgozói szerződés minden feldolgozóval | felhő, tárhely, e-mail, AI-szolgáltatás, szekvenáló labor, futárszolgálat |
| **44–49** | harmadik országba továbbítás | **külön engedélyezési lépés** a hozzáférési folyamatban; alapból tiltva |

> **Az AI-szolgáltatások külön figyelmet kívánnak.** Mindkét platform használ AI-átjárót
> (a SOS24-ben 19 AI edge function). Ha ezekbe betegadat kerül, az **adatfeldolgozás** —
> szerződés, hely, megőrzés és a modell tanítására való felhasználás kizárása kell hozzá.
> Ezt a DPIA-nak külön tételként kell tartalmaznia.

---

## 8. Kapcsolat a magyar joggal

A GDPR közvetlenül hatályos, de a magyar jog kiegészíti és részletezi:

- **Infotv.** (2011. évi CXII. tv.) — a GDPR-t kiegészítő általános szabályok
- **1997. évi XLVII. tv.** — egészségügyi adatok kezelése, célok és megőrzési idők
- **2008. évi XXI. tv.** — humángenetikai adat és biobank, **speciális szabályokkal**
- **1997. évi CLIV. tv.** — emberen végzett kutatás engedélyezése

Ütközés esetén a szigorúbb szabály alkalmazandó. A humángenetikai adatra a 2008. évi XXI. tv.
a GDPR-nál részletesebb rendelkezéseket tartalmaz — ld. [`03-magyar-jog.md`](03-magyar-jog.md).

---

## 9. Nyitott kérdések

1. **Jogalap:** 9(2)(a) hozzájárulás vagy 9(2)(j) kutatási kivétel? (ld. 2.2) — DPO és jogász
2. **Megőrzési idők:** a jogszabályi minimum és a kutatási cél közötti egyensúly
3. **Harmadik országba továbbítás:** lesz-e egyáltalán? Ha igen, milyen mechanizmussal?
4. **Az AI-átjáró adatfeldolgozói státusza** és a modell-tanítás kizárása
5. **Art. 36 előzetes konzultáció** szükséges-e — a DPIA eredményétől függ
