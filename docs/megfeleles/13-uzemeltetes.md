# 13 — Üzemeltetés: helyben, titkosított felhőmentéssel

> **Döntés (K17): on-premise üzemeltetés, titkosított felhőmentéssel.**
>
> **K21: az üzemeltetést a központi informatika végzi** — megoldott.
> **K22: Telekom HU vagy 4iG**, az **egészségügyre bérelt adatparkban**, az EESZT
> szerverei mellett. **K23: az RPO és RTO célértékek elfogadva** (klinikai adat ≤ 15 perc /
> ≤ 4 óra). **K28: a 4 óra kórházi előírás**, tehát éjjel-nappal érvényes.
> **K29: kulcsőrzés a portán és az ügyeletes informatikusnál** — ld. 7. pont.

---

## 1. Miért ez a helyes alapállás

| Szempont | Helyben | Felhőben |
|---|---|---|
| Adatvédelmi felelősség | egy szereplő | adatfeldolgozó belép a láncba |
| DICOM-forgalom a modalitásokkal | belső hálózat, alacsony késleltetés | kifelé menő forgalom, sávszélesség-függő |
| Kiesés esetén | saját helyreállítás | szolgáltatófüggő |
| **Adattovábbítás harmadik országba** | nincs | **a K22 döntéssel tárgytalan** — ld. 4.1 |

A képalkotó adat mennyisége és a modalitásokkal való közvetlen DICOM-kapcsolat miatt a
helyben üzemeltetés a természetes választás. **A mentés viszont nem maradhat helyben** — egy
tűzeset vagy zsarolóvírus a mentést is elviszi, ha ugyanabban az épületben van.

---

## 2. A felépítés

```
┌─ INTÉZMÉNY (on-premise) ─────────────────────────────────┐
│                                                           │
│   modalitások ──DICOM──▶ Orthanc ──▶ objektumtár          │
│   (UH, CTG, EKG)          │                               │
│                           │  MWL / MPPS / C-STORE         │
│   OGDOC alkalmazás ◀──────┘                               │
│         │                                                  │
│   PostgreSQL ─── WAL-archiválás                            │
│         │                                                  │
└─────────┼──────────────────────────────────────────────────┘
          │  titkosítás A FORRÁSNÁL (a kulcs helyben marad)
          ▼
   ┌──────────────────────────┐
   │  felhő objektumtár        │   csak titkosított blob
   │  (adatfeldolgozó)         │   — a szolgáltató nem tud olvasni
   └──────────────────────────┘
```

**Az Orthanc fordított proxy mögé kerül.** Közvetlenül nem publikálható: a DICOMweb és a
REST API hitelesítés nélkül a teljes képanyagot kiadja.

---

## 3. A titkosítás — ahol a legtöbb terv elrontja

A „titkosított felhőmentés" önmagában nem mond semmit. **Három kérdés dönti el, hogy valódi
védelem-e:**

| Kérdés | Rossz válasz | Helyes válasz |
|---|---|---|
| **Hol titkosítunk?** | a szolgáltatónál, feltöltés után | **a forrásnál**, feltöltés előtt |
| **Ki tartja a kulcsot?** | ugyanaz a szolgáltató | **az intézmény**, a szolgáltatótól elkülönítve |
| **Mi történik a kulcs elvesztésekor?** | „nem veszhet el" | dokumentált kulcsletét, két személy együttes hozzáférésével |

> **Ha a kulcsot ugyanaz a szolgáltató kezeli, aki a tárolást végzi, a titkosítás nem
> választja el a felektől az adatot** — csak a szolgáltató belső hibái ellen véd, a
> jogi kockázat ellen nem. A GDPR szempontjából a szolgáltató ilyenkor is hozzáférhet a
> személyes adathoz.

### 3.1 Amit a kulcskezelésről rögzíteni kell

- **Kulcsforrás**: az intézmény által üzemeltetett kulcstároló (HSM vagy azzal egyenértékű).
- **Rotáció**: a mentési kulcs rendszeres cseréje, a régi kulcsok megőrzésével — különben a
  régi mentések visszaolvashatatlanná válnak.
- **Kulcsletét**: két, egymástól független őrző; egyikük távolléte ne blokkolja a helyreállítást.
- **Szétválasztás**: aki a felhőfiókot adminisztrálja, **ne** férjen a kulcshoz. Ez ugyanaz
  az összeférhetetlenségi elv, mint a `kutato` + `kodkulcs_kezelo` páros a 25. modulban.

---

## 4. Adatvédelmi következmények

A felhőmentés **adatfeldolgozót** léptet be a láncba, akkor is, ha csak titkosított blobot lát.

| Kötelezettség | Mit jelent |
|---|---|
| **Adatfeldolgozói szerződés** | GDPR Art. 28 szerinti szerződés, altfeldolgozók megnevezésével |
| **Tárolás helye** | EGT-n belül tartandó — a K22 döntéssel teljesül, ld. 4.1 |
| **Biztonsági intézkedések** | Art. 32: titkosítás, rendelkezésre állás, **és a helyreállíthatóság rendszeres tesztelése** |
| **Nyilvántartás** | az adatkezelési tevékenységek nyilvántartásában a mentés önálló tételként |
| **DPIA** | a meglévő hatásvizsgálatot a mentési lánccal ki kell egészíteni |

### 4.1 Amit a K22 döntés megold — és amit nem

**Megold:** mindkét megnevezett szolgáltató (**Telekom HU**, **4iG**) magyarországi, tehát
EGT-n belüli. Ezzel a **harmadik országba történő adattovábbítás kérdése tárgytalan** — ez
volt a legnagyobb jogi kockázat a mentési láncban.

**És a K22 pontosítása ennél többet ad:** az **egészségügyre bérelt adatpark** —
ugyanaz, ahol az EESZT szerverei állnak — a *tárolás fizikai helyének* kérdését is
megválaszolja. Nem általános felhőkapacitásról van szó, hanem ismert, hazai,
egészségügyi célra kijelölt adatközpontról.

**Amit ez üzemeltetésileg ad:** ismert hálózati útvonal és alacsony késleltetés az EESZT
felé, ami a `12-eeszt.md` beküldési láncát egyszerűsíti.

**Amit viszont NEM ad, és ezt érdemes kimondani:**

> **Az EESZT szerverei melletti elhelyezés nem biztonsági tulajdonság.** Attól, hogy a
> mentés ugyanabban az adatparkban van, **nem lesz az EESZT része**: az adatkezelő
> továbbra is az intézmény, a szolgáltató továbbra is adatfeldolgozó, és a felelősség
> nem oszlik meg. A fizikai közelség kényelem, nem jogi státusz.

Ezért a szerződéskötéskor ezek akkor is kellenek:

| Tétel | Miért |
|---|---|
| **Adatfeldolgozói szerződés** (GDPR Art. 28) | a titkosított tárolás is adatfeldolgozás |
| **Az adatpark megnevezése a szerződésben** | az „egészségügyre bérelt" a szerződésből legyen visszakereshető, ne szóbeli megállapodás |
| **Altfeldolgozók megnevezése és váltásuk előzetes bejelentése** | különben a kijelölt adatpark csendben kicserélődhet |
| **A szerződés megszűnésekor az adat sorsa** | visszaadás vagy igazolt megsemmisítés |

---

## 5. A helyreállítási próba — a legfontosabb és leggyakrabban kihagyott elem

**A mentés, amit soha nem állítottak vissza, nem mentés, hanem remény.**

A GDPR Art. 32 kifejezetten a helyreállíthatóság **rendszeres tesztelését** kéri, és az
ISO 20387 katasztrófaterve ugyanezt. Ezért a próba nem opcionális, és nem elég „lefut a
mentési szkript" jelzés.

| Próba | Gyakoriság | Mit bizonyít |
|---|---|---|
| **Egy fájl visszaállítása** | havonta, automatizálva | a lánc él, a kulcs használható |
| **Egy vizsgálat teljes visszaállítása** az Orthancba | negyedévente | a DICOM-réteg épsége |
| **Teljes adatbázis visszaállítása külön környezetbe**, ellenőrző lekérdezéssel | félévente | valódi helyreállíthatóság |
| **Kulcsvesztés-forgatókönyv** — visszaállítás a letétből | évente | a letét működik, és nem egy ember fejében van |

**Mindegyik próba jegyzőkönyvet ad**, és a jegyzőkönyv a minőségirányítási rendszer
feljegyzése. Ha egy próba elbukik, az **nemmegfelelőség**, ami helyesbítő tevékenységet
indít — ugyanabban a CAPA-nyilvántartásban, ami a négy szabványt szolgálja
(ld. [`11-integralt-mir.md`](11-integralt-mir.md)).

### 5.1 Célértékek, amiket ki kell mondani

| Mutató | Mit jelent | Javaslat |
|---|---|---|
| **RPO** — mennyi adat veszhet el | a mentések közti idő | **klinikai adat: ≤ 15 perc** (WAL-archiválás) · **kép: ≤ 24 óra** |
| **RTO** — mennyi idő alatt áll helyre | a kiesés hossza | **≤ 4 óra** a klinikai rendszerre |
| **Megőrzés** | meddig tartjuk a mentéseket | a jogszabályi megőrzési időhöz igazítva (ld. [`12-eeszt.md`](12-eeszt.md)) |

**Ezek a K23 döntéssel elfogadva.** Ami ebből technikai követelmény:

- a ≤ 15 perces RPO **folyamatos WAL-archiválást** kíván, nem napi mentést;
- a ≤ 4 órás RTO azt jelenti, hogy **a helyreállítás gyakorolt eljárás**, nem improvizáció —
  enélkül a 4 óra nem tartható;
- **a 4 óra kórházi előírás (K28), tehát éjjel-nappal érvényes** — ügyeleti rendet és
  szolgáltatási szintű megállapodást kíván a központi informatikával.

---

## 6. Amit a szoftvernek adnia kell

| Követelmény | Megoldás | Állapot |
|---|---|---|
| A mentés ne igényeljen leállást | WAL-archiválás, konzisztens pillanatkép | tervezve (M2) |
| A visszaállított adat **ellenőrizhető** legyen | rekordszám és ellenőrzőösszeg a mentési jegyzőkönyvben | tervezve (M2) |
| A helyreállítás **ne írja felül** a friss adatot | külön környezetbe állítunk vissza, majd összevetünk | eljárás |
| A mentés ténye naplózott | a mentési és próba-események az auditnaplóban | tervezve (M4) |

---

## 7. Kulcsőrzés: porta és ügyeletes informatikus (K29)

**Döntés:** a mentési kulcs őrzése a **portán a helyszínen** és az **ügyeletes
informatikusnál**. Ez a kettő együtt kell a helyreállításhoz.

### 7.1 Miért működik ez

A porta a kórház egyetlen olyan pontja, ami **éjjel-nappal, fizikailag ellenőrzötten
üzemel** — a K28 szerinti 4 órás helyreállításhoz ez az egyetlen reálisan elérhető
letéti hely. És a két őrző **különböző szervezeti egységben** van: az ügyeletes
informatikus egyedül nem jut a letéthez, a portás egyedül nem tud vele mit kezdeni.

### 7.2 A szerepek — és ami közöttük a különbség

| Szerep | Mije van | Mit NEM tehet |
|---|---|---|
| **Porta** | a lezárt, sértetlenség-jelző borítékban lévő **kulcspéldány fizikai őrzése** páncélszekrényben | **nem nyithatja fel**, és nem dönti el, ki kapja meg |
| **Ügyeletes informatikus** | a rendszerhez való technikai hozzáférés | **egyedül nem jut a borítékhoz** |
| **Ügyeletvezető / DPO** | a kiadás **engedélyezése**, utólagos felülvizsgálat | nem őrzi a borítékot és nem adminisztrálja a tárolót |

> **A portás a boríték őrzője, nem a kulcs jogosultja.** Ez a különbség tartja meg a
> szétválasztást: a portás egy fizikai ellenőrzőpont — feladata, hogy a boríték csak
> **naplózott, aláírt átvétel** ellenében kerüljön ki, nem az, hogy eldöntse, jogos-e a kérés.

### 7.3 Amit ehhez rögzíteni kell

- **Sértetlenség-jelző, sorszámozott boríték**, páncélszekrényben, átvételi napló mellett.
- **Az átvétel automatikus értesítést küld** az ügyeletvezetőnek és az adatvédelmi
  tisztviselőnek. Így a kiadás akkor is auditálható, ha éjjel történt, és utólag
  felülvizsgálható.
- **Használat után új boríték**, új sorszámmal — a felbontott letét nem tehető vissza.
- **Helyettesítés**: mindkét szerepnek van kijelölt helyettese, névre szólóan.

### 7.4 Amit ez a megoldás nem old meg

**Az ügyeletes informatikus a központi informatika tagja**, aki a felhőfiókot is
adminisztrálja. Ha megszerzi a borítékot, egyedül is vissza tud állítani — a
kétszemélyes elv tehát **a portán múlik**, azon, hogy a boríték csak engedéllyel kerül ki.

Ezt nem szervezeti bizalmatlanságként kell kezelni, hanem úgy, ahogy minden más
kétszemélyes szabályt: **a napló és az automatikus értesítés az, ami valóban véd** — nem a
portás ítélőképessége hajnali háromkor. Ezért kötelező eleme a megoldásnak.

> Ugyanez az elv áll a 25. modul `kutato` + `kodkulcs_kezelo` tiltása mögött: a
> szétválasztás akkor ér valamit, ha **kikényszerített és naplózott**, nem ha jóhiszeműségen
> múlik.

---

## 8. A kulcsletét eljárásrendje — elfogadva (K30)

**A 7. pontban leírt eljárás tartható**, és ezzel a kulcskezelés lezárt kérdés. Ami ebből
következik: a 7.3 pont elemei — sorszámozott, sértetlenség-jelző boríték, átvételi napló,
automatikus értesítés, helyettesítés — **SOP-ként rögzítendők**, és a
[`05-mir-dokumentumfa.md`](05-mir-dokumentumfa.md) dokumentumfájába kerülnek.

A **helyreállítási próba éves kulcsvesztés-forgatókönyve ezt az eljárást gyakorolja** — nem
elméletben, hanem úgy, hogy a boríték ténylegesen kikerül a páncélszekrényből, és a
visszaállítás a letéti példánnyal történik. Ha a próba elbukik, az nemmegfelelőség, és
ugyanabba a CAPA-nyilvántartásba kerül, ami a négy szabványt szolgálja.

Az üzemeltetési sáv ezzel **nyitott kérdés nélkül** áll.
