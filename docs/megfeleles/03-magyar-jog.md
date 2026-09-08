# Magyar jogszabályi megfeleltetés

> **A §-szintű hivatkozásokat jogásznak kell ellenőriznie.** Ez a fejezet a kötelezettségek
> szerkezetét és a rendszerbeli megvalósításukat adja. Ahol a konkrét szakaszszám nem
> egyértelmű a forrásból, ott **`[ellenőrizendő]`** jelölés áll — ezeket beszerzett,
> hatályos szöveggel kell pontosítani.

## Áttekintés

| Jogszabály | Mit szabályoz | Miért érint minket |
|---|---|---|
| **2008. évi XXI. tv.** | humángenetikai adatok védelme, humángenetikai vizsgálatok és kutatások, **biobankok működése** | ez a biobank alaptörvénye |
| **1997. évi CLIV. tv.** (Eütv.) | egészségügy; **emberen végzett orvostudományi kutatás** | etikai engedély, beleegyezés |
| **1997. évi XLVII. tv.** (Eüak.) | egészségügyi és kapcsolódó személyes adatok kezelése | adatkezelési célok, megőrzés, EESZT |
| **2011. évi CXII. tv.** (Infotv.) | a GDPR-t kiegészítő általános szabályok | jogalap, hatósági eljárás |

---

## 1. 2008. évi XXI. törvény — a biobank alaptörvénye

Teljes cím: *a humángenetikai adatok védelméről, a humángenetikai vizsgálatok és kutatások,
valamint a biobankok működésének szabályairól*.

### 1.1 Amit a törvény a rendszertől követel

| Követelmény | Megvalósítás az OGDOC-ban | Áll. |
|---|---|---|
| **Írásbeli, tájékozott beleegyezés** humángenetikai vizsgálathoz és kutatáshoz | `06-beleegyezes.md`; a v16 nyolcpontos nyilatkozata mint kiindulás | 🔶 |
| **Genetikai tanácsadás** a vizsgálat előtt és az eredmény közlésekor | a `12` modul genetikai tanácsadási útvonala, és a `13` ellátási terv konzílium-javallata; **a tanácsadás megtörténte rögzítendő adat** | ⬜ |
| A minta és a genetikai adat **kódolt** tárolása | `07-nyomonkovethetoseg.md`: kódkulcs elkülönítve, a kutatói szerep sosem lát azonosítót | 🔶 |
| A **biobank működésének bejelentése / nyilvántartásba vétele** `[ellenőrizendő]` | szervezeti feladat, nem szoftver | ⬜ |
| **Biobankért felelős személy** kijelölése | `00-keret.md` 5. pont: biobank vezető | ⬜ |
| A minta és adat **továbbadásának** szabályai, dokumentáltan | hozzáférési folyamat + anyagátadási megállapodás (MTA) | ⬜ |
| Az érintett **visszavonási joga**, és annak végigvezetése | `06-beleegyezes.md`; technikailag kikényszerítve a `22` modulban | ⬜ |
| **A tudáshoz és a nem tudáshoz való jog** | a beleegyezésben előre eldöntött: kér-e visszajelzést váratlan leletről | ⬜ |
| Célhoz kötöttség: a genetikai adat csak a megjelölt célra | `gdpr_consents.cel` + a hozzáférési folyamat célellenőrzése | 🔶 |

### 1.2 A törvény szigorúbb, mint a GDPR — és ez a szigorúbb érvényes

Két pont, ahol a magyar jog túlmegy a rendeleten, és amit az architektúrának hordoznia kell:

1. **A genetikai tanácsadás kötelező eleme a folyamatnak.** Nem opcionális szolgáltatás:
   a rendszer ne engedjen humángenetikai vizsgálatot indítani anélkül, hogy a tanácsadás
   megtörténte rögzítve lenne.
2. **A kódolt tárolás nem ajánlás.** A minta és a genetikai adat azonosítótól elválasztott
   kezelése kötelező, a kódkulcs külön védelmével.

### 1.3 Amit tisztázni kell

A kérésben szereplő „2009-es humángenetikai törvény" — **erről nincs tudomásom**; a tárgyat a
2008. évi XXI. törvény szabályozza. Lehet, hogy a **végrehajtási rendeletre** gondolsz, vagy a
törvény egy 2009-ben hatályba lépett rendelkezésére. Add meg a pontos jogszabályszámot, és
beépítem. Addig a keret a 2008. évi XXI. törvényre épül.

---

## 2. 1997. évi CLIV. törvény (Eütv.) — kutatás emberen

Az emberen végzett orvostudományi kutatásokról a törvény külön fejezete rendelkezik
`[ellenőrizendő: VIII. fejezet, 157. §-tól]`.

### 2.1 Amit követel

| Követelmény | Megvalósítás | Áll. |
|---|---|---|
| **Kutatásetikai bizottsági engedély** a kutatás megkezdése előtt | `study_links` tábla: etikai engedély azonosítója, érvényessége; **engedély nélkül kutatási kiadás nem indítható** | ⬜ |
| Kutatási terv előzetes rögzítése | a `20` modul **hipotézisvizsgáló módja**: a lekérdezést és a kimeneti mutatót előre rögzíteni kell, időbélyeggel | 🔶 |
| Tájékozott beleegyezés, írásban | `06-beleegyezes.md` | 🔶 |
| A beleegyezés bármikori visszavonhatósága, hátrány nélkül | technikailag kikényszerítve; **a visszavonás nem befolyásolja az ellátást** — kimondva | ⬜ |
| Kockázat-haszon arány értékelése | a kutatási protokoll része | ⬜ |
| Kutatási felelős kijelölése | szervezeti | ⬜ |

### 2.2 Melyik bizottság?

A hatáskör a kutatás típusától függ (intézményi/regionális kutatásetikai bizottság vagy
országos szintű testület), humángenetikai kutatásnál külön szabályokkal `[ellenőrizendő]`.

**Gyakorlati teendő a Fázis 0-ban:** tisztázni, hogy a tervezett kutatási profilhoz **melyik
bizottság illetékes**, és mennyi az átfutási idő. Ez határozza meg, mikor lehet egyáltalán
adatot gyűjteni.

> A `04-utemterv.md` ezért teszi az etikai engedélyeztetést a Fázis 0-ba, a fejlesztéssel
> párhuzamos sávba — nem a végére.

---

## 3. 1997. évi XLVII. törvény (Eüak.) — egészségügyi adatkezelés

### 3.1 Adatkezelési célok

A törvény tételesen felsorolja, milyen célból kezelhető egészségügyi adat (gyógykezelés,
népegészségügy, statisztika, **tudományos kutatás**, oktatás, finanszírozás stb.).
A kutatási cél tehát nevesített — de a felhasználás feltételekhez kötött.

### 3.2 Megőrzési idők `[ellenőrizendő]`

Az általánosan hivatkozott értékek:

| Dokumentum | Megőrzés |
|---|---|
| Egészségügyi dokumentáció | az adatfelvételtől számított **legalább 30 év** |
| Zárójelentés | **legalább 50 év** |
| Képalkotó diagnosztikai felvétel | **10 év** |
| Képalkotó vizsgálat lelete | **30 év** |

> **Ezeket a hatályos szöveggel ellenőrizni kell**, és a rendszer megőrzési politikájába
> változóként kell beépíteni — nem beégetve, mert módosulhatnak.

A **kutatási** célú megőrzés ettől eltérhet (GDPR Art. 89(1) enged hosszabb tárolást), de a
kutatási megőrzési időt a protokollban meg kell határozni; „örökre" nem elfogadható válasz.

### 3.3 EESZT

Az EESZT-hez való csatlakozás és adatszolgáltatás kötelezettségeit ez a törvény és
végrehajtási rendeletei szabályozzák `[ellenőrizendő]`.

**Az OGDOC álláspontja** (ld. `08-interoperabilitas.md`): kutatási státuszban **nem küld adatot az
EESZT-be**, mert az EESZT-be beküldött adat hivatalos egészségügyi dokumentáció, és a rendszer
megfelelőségértékelésig nem az. A kimenő adapter létezik, de feature flag mögött, alapból
kikapcsolva.

> **Figyelem — ez ütközhet a jogszabályi adatszolgáltatási kötelezettséggel**, ha a rendszert
> ellátási dokumentációra is használják. Ha az OGDOC ellátási dokumentációt keletkeztet,
> az EESZT-beküldés nem választás kérdése. **Ezt a kérdést a Fázis 0-ban el kell dönteni**:
> az OGDOC kizárólag kutatási-oktatási eszköz (nincs beküldési kötelezettség), vagy
> ellátási dokumentációt is keletkeztet (van).

---

## 4. Munkajogi és foglalkozás-egészségügyi réteg (21. modul)

A platform már hordozza ezt a megfeleltetést — a teljes lista a
[`../modulok/19-crm.md`](../modulok/19-crm.md)-ben:

| § | Implementáció |
|---|---|
| Mt. 134. § (munkaidő-nyilvántartás) | `work_time_ledger` + trigger |
| Mt. 140–143. § (pótlékok) | `compute_potlek_savs()` + `wage_mapping` |
| Eütev. 12/A–12/G. § (munkaidő-korlátok) | `work_time_rules` + beosztómotor kemény constraint |
| Eütev. 12/B. § (ÖVT önkéntessége) | `opt_out_agreements` + 12 hónapos visszavonási guard |
| Eütev. 12/D. § (kötelező ügyelet, mentesség) | `mandatory_duty_rules` + `_exemptions` |
| 528/2020 16. § (rendkívüli munka írásban) | `overtime_orders.irasos_hivatkozas` |
| 22/2012 EMMI (akkreditált tutor) | `person_accreditations` + `supervises()` |

A foglalkozás-egészségügyi alkalmassági folyamat (21. modul) és a munkabaleseti jegyzőkönyv
külön jogszabályi kört érint (Mvt. és végrehajtási rendeletei) `[ellenőrizendő]` — a SOS24
a hivatalos nyomtatvány teljes mezőkészletét implementálja.

---

## 5. A jogszabályi megfelelés mint élő adat

**A jogszabályok változnak.** Ha a megfeleltetés kizárólag ebben a dokumentumban él, egy év
múlva elavult lesz, és senki nem fogja észrevenni.

Ezért a megfeleltetés **a rendszerben is adat**:

```jsonc
// legal_references — a SOS24/IntuiCare `legal-references.ts` mintájára kiterjesztve
{
  "id": "eu.gdpr.art9.2.a",
  "jogszabaly": "GDPR (EU) 2016/679",
  "hely": "9. cikk (2) a) pont",
  "targy": "kifejezett hozzájárulás különleges adathoz",
  "hatalyos_tol": "2018-05-25",
  "hatalyos_ig": null,
  "megvalositas": ["consent.biobank.*", "gdpr_consents"],
  "utolso_ellenorzes": "2026-09-01",
  "ellenorizte": "…"
}
```

Az `utolso_ellenorzes` mező a lényeg: a rendszer **meg tudja mondani, mely hivatkozásokat nem
ellenőrizte senki egy éve**. Ez a vezetőségi átvizsgálás egyik kötelező bemenete
(`08-audit.md`).

---

## 6. Nyitott kérdések

1. **A „2009-es humángenetikai törvény"** pontos azonosítása (ld. 1.3)
2. **Keletkeztet-e az OGDOC ellátási dokumentációt?** — ettől függ az EESZT-beküldési
   kötelezettség (ld. 3.3). **Ez a fejezet legfontosabb nyitott kérdése.**
3. **Melyik kutatásetikai bizottság illetékes**, és mennyi az átfutási idő (ld. 2.2)
4. **A biobank bejelentési/nyilvántartásba vételi kötelezettségének** pontos módja (ld. 1.1)
5. A megőrzési idők hatályos értékei (ld. 3.2)
