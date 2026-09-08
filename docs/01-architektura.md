# 01 — Architektúra és portolhatósági szerződés

## A központi döntés: a regiszter a forrás, a felület csak kivetítés

Mind a v16, mind az IPRACS ugyanabba a falba ütközött: a klinikai tudás a felületbe van beleírva.
A v16-ban a mezők DOM-elemek, a szabályok closure-ökben; az IPRACS-ban a Bishop-score **három
helyen** szerepel, a `calcLATCH()` **kétszer** van definiálva (5175. és 7497. sor). Ez nem
hanyagság — ez a felület-központú felépítés elkerülhetetlen következménye.

A v16 fejlesztői kézikönyve ezt őszintén ki is mondja. Az architektúrája egy **dekorátorlánc**:
tizennégy réteg, mindegyik becsomagolja az előző `window.generate()`-jét, és mindegyik
`try/catch`-ben fut, a hibát egy saját globálisba írva (`__ekgErr`, `__usErr`, `__pedErr`…).

```javascript
var og = window.generate;
window.generate = function () {
  var r = og.apply(this, arguments);   // előző rétegek
  try { enrichEKG(); } catch (e) { window.__ekgErr = e.message; }
  return r;
};
```

Ennek megvolt a maga logikája — minden funkció külön, visszavonható build-lépésként született,
és egy hibás réteg nem viszi magával az egész kimenetet. De az ár, amit a kézikönyv is
kimond: **a hibás réteg némán hal el.** Hibakeresésnél a globálisokat kell végignézni, mert a
felületen a hiba egyszerűen „nem csinál semmit" alakban jelentkezik. Egy klinikai eszközben,
ahol egy néma réteghiba azt jelenti, hogy egy kockázati blokk nem jelent meg, ez nem tartható.

Az OGDOC megfordítja az irányt:

```
                   ┌──────────────────────────────┐
                   │   VÁLTOZÓ-REGISZTER (SSOT)   │   ~2000 VariableDef
                   │   registry/*.json            │   gépi olvasható, verziózott
                   └──────────────┬───────────────┘
                                  │  ebből GENERÁLÓDIK minden
        ┌───────────────┬─────────┼─────────┬──────────────┬──────────────┐
        ▼               ▼         ▼         ▼              ▼              ▼
    űrlapok       dokumentáció  validáció  levezetési   export-térkép   tesztek
   (UI render)    (mezőnként)   (domain)   gráf         (FHIR/ICHOM)   (fixture)
```

Egy mező sehol nincs „kézzel megírva". Ha egy változót fel akarunk venni, a regiszterbe kerül —
és attól kezdve **magától** megjelenik az űrlapon, a dokumentációban, az exportban és a
validációban. Ez az egyetlen mód, hogy 17 modul és ~2000 változó karbantartható maradjon.

## Rétegek — az IntuiCare rétegszabályai szerint

> **Ez a fejezet 2026-09-01-én lényegesen megváltozott.** Az eredeti terv egyfájlos, offline
> artifactot írt le, későbbi webes migrációval. Ez a feltevés megdőlt: rendelkezésre áll az
> IntuiCare platform (230 tábla, 158 route, 407 server function), amelyre az OGDOC épül.
> A részletes leltár: [`07-intuicare-alap.md`](07-intuicare-alap.md).

Nem vezetünk be új konvenciót — a meglévő rétegzést követjük, mert az pontosan azt adja, amit a
DOM-mentes `core/` néven kértünk:

| Réteg | Hely | Szabály | Az eredeti tervben |
|---|---|---|---|
| Route / oldal | `src/routes/**` | csak komponáció + `loader` + `head()` | `ui/modules` |
| UI komponens | `src/components/**` | prezentáció, szemantikus design tokenek | `ui/render` |
| **Domain logika** | `src/lib/<domain>/**` | **tiszta függvények, Zod sémák, számítások** | **`core/`** |
| RPC | `src/lib/**/*.functions.ts` | `createServerFn`, kliensből hívható | `adapters/` |
| Szerver-only | `src/lib/**/*.server.ts` | admin kliens, AI kulcsok; kliensből soha nem importálható | — |
| HTTP endpoint | `src/routes/api/**` | webhook, cron | `adapters/export` |

Az OGDOC klinikai magja tehát `src/lib/ogdoc/` alatt él:

```
src/lib/ogdoc/
  registry/     VariableDef-ek betöltése, indexelése, feloldása
  derive/       levezetési motor (computed / prefill / mirror)
  scores/       fullPIERS, MEOWS, CMQCC, NICHD, Bishop, VBAC, CORI, EPDS …
  validate/     domain-, konzisztencia- és frissesség-ellenőrzés
  codes/        BNO, OENO, HBCS, LOINC, SNOMED, ATC leképezés
  fhir/         kimenő FHIR R4 leképezés (ld. 08-interoperabilitas.md)
```

**A szabály, amit nem szegünk meg:** ez a könyvtár tiszta függvényeket tartalmaz. Nem hivatkozik
`document`-re, nem hív adatbázist, nem olvas környezeti változót. Ha egy score-nak adat kell,
paraméterként kapja. Így Node-ban tesztelhető, és a felület bármikor cserélhető alatta.

## Miért nem egyfájlos rendszer

Az egyfájlos, offline HTML a v16 és az IPRACS helyes válasza volt a maguk feladatára: egy orvos
e-mailben megkapja, megnyitja, működik. De az OGDOC feladatára nem az, és három okból:

1. **A méret.** A v16 ma 1,09 MB, ~200 változóval. Az OGDOC ~2200 változóval, 19 modullal,
   13 000 tételes kódtörzzsel több megabájt lenne — betöltéskor elviselhetetlen.
2. **A megosztott adat.** A szülőszobán műszakváltás van; a beteg a portálon tölt kérdőívet;
   a kutató exportál. Ezek nem működnek egyetlen böngésző localStorage-ában.
3. **A HIS/EESZT-kapcsolat.** A kérés kifejezetten adatbázist kért, ami később kommunikálni tud
   a kórházi rendszerrel. Ez fájlból nem megy.

Ami az egyfájlos megközelítésből **megmarad**: az offline működés igénye a szülőszobán. Ezt a
platform PWA-rétege adja (service worker, IndexedDB queue), nem a fájlformátum.

## A regiszter és a meglévő séma viszonya

Az IntuiCare `fhir-codes.ts` fájlja már tartalmaz egy kis regisztert: LOINC-kód, kétnyelvű
címke, egység, kategória, referencia- és kritikus tartomány, bevitel-korlátok. **Az OGDOC
regisztere ennek a kiterjesztése**, nem a leváltása:

```
LoincItem  ──kiterjesztve──▶  VariableDef
  loinc, hu, en, unit,          + id, version, status, aliasOf
  category, ref, step,          + derivation (computed | prefill | mirror)
  min, max                      + documentation (definíció, csapdák, eduLevels)
                                + consumers (generált)
                                + validity, provenanceAllowed, timing, requiredWhen
                                + standards (snomed, ichom, eeszt, fhir)
                                + evidence, changelog, phi
```

A tárolás a meglévő `clinical_observations` táblában történik, amely eleve FHIR-Observation
alakú. Három oszlop kell hozzá: `variable_id` (a regiszterre mutat), `confidence`
(measured / reported / estimated / uncertain), és a `provenance` finomítása (`prefilled` és
`derived` külön). **Ez három oszlop, nem új adatmodell.**

## Adatmodell: három tárolási alak, nem több

Az IPRACS három rétegét (FIX / sorozat / labor-snapshot) általánosítjuk, mert 17 modulra
az nem elég:

| Alak | Mi kerül bele | Kulcs | Példa |
|---|---|---|---|
| **`fact`** | egy eset alatt egyszer rögzített, ritkán változó | `variableId` | vércsoport, testmagasság, korábbi császármetszés |
| **`series`** | idő- vagy vizit-indexelt ismétlődő mérés | `variableId + t` | vérnyomás, cervix-tágulat, BPD vizitenként, QBL |
| **`event`** | diszkrét, időbélyeges esemény saját attribútumokkal | `eventId` | gyógyszerbeadás, műtét, transzfúzió, szülés |

Mindhárom a meglévő táblákra képződik le — **nincs szükség új tárolási rétegre**:

| Alak | Tábla | Megjegyzés |
|---|---|---|
| `fact`, `series` | `clinical_observations` | `effective_ts` különbözteti meg őket; a `fact` az, aminek egy érvényes értéke van |
| `event` | `clinical_therapy_orders`, `surgery_cases`, `appointments`, `obstetric_partogram_entries` | doménspecifikus táblák |
| számított eredmény | `clinical_calculator_results` | `inputs_json` + `outputs_json` |
| riasztás | `clinical_critical_alerts` | eszkalációval és nyugtázással |

Minden érték — bármelyik alakban — ugyanazt a burkot kapja:

```jsonc
{
  "value": 128,
  "unit": "mm[Hg]",              // UCUM
  "t": "2026-09-01T14:22:00Z",   // mikor VONATKOZIK rá (nem mikor írták be)
  "recordedAt": "2026-09-01T14:25:11Z",
  "provenance": "clinician",      // clinician|patient|device|derived|imported|prefilled
  "sourceRef": null,              // prefilled/derived esetén: honnan
  "confidence": "measured",       // measured|reported|estimated|uncertain
  "enteredBy": "role:midwife",
  "overridden": false             // felülírta-e a felhasználó a javasolt értéket
}
```

A `provenance` és a `confidence` **nem opcionális díszítés**. A v16 családfa-modulja már most
külön kezeli, hogy egy családi adat honnan származik és mennyire dokumentált — ez a helyes
ösztön, és az egész rendszerre kiterjesztjük. Egy score, amely önbevallott (`patient` +
`reported`) testsúlyból számol BMI-t, ezt jelezze is.

## Kritikus szabály: nincs néma helyettesítés

Ha egy score-nak hiányzik egy bemenete, **nem számol**. Nem tesz be nullát, nem tesz be
alapértelmezést, nem hagyja ki a tagot. Visszaad egy `{ status: "insufficient", missing: [...] }`
eredményt, és a felület megmutatja, mi hiányzik.

Ez a legfontosabb betegbiztonsági szabály az egész rendszerben. Egy fullPIERS, amelyben az
AST hiányzik és nullaként szerepel, **rosszabb, mint semmilyen fullPIERS**, mert számot mutat.

Ugyanígy: minden score-eredmény mellé lementjük azt a bemeneti pillanatképet, amelyből számolt.
Retrospektív visszanézéskor látszik, mit *látott* az algoritmus — nem azt, amit ma tudunk.

**Ez már így működik**: a `clinical_calculator_results` tábla `inputs_json` és `outputs_json`
mezőt hordoz. Amit hozzá kell tenni: az `insufficient` állapotot az `outputs_json`-ben
(`{ status: "insufficient", missing: [...] }`), és a felületnek ezt kell mutatnia szám helyett.

## Hibakezelés: a néma bukás tilos

A v16 dekorátorláncának tanulsága közvetlenül épül be. Az OGDOC-ban egy modul hibája
**látható**:

- A `core/` tiszta függvényei nem nyelnek el hibát — feldobják.
- A `ui/` réteg minden modult hibahatárral rendez körül, de a hibahatár **kiír**: a modul helyén
  egy jelzés jelenik meg („Ez a szekció nem tölthető be — <ok>"), nem üresség.
- A hibák egy `CaseState.errors[]` listába gyűlnek, ami a lelet végén és a nyomtatásban is
  megjelenik. Ha egy score nem futott le, az a dokumentumon látszik.

Ez azért fontosabb itt, mint egy szokásos alkalmazásban, mert a hiányzó kimenetet a klinikus
könnyen „negatív leletnek" olvassa. A meg nem jelent kockázati blokk nem azt jelenti, hogy
nincs kockázat.

## Tesztelés három szinten

A v16 kézikönyve három tesztszintet ír le, és mindhárom átkerül — de az elsőt kibővítjük:

| Szint | Mit fog meg | Hol fut |
|---|---|---|
| **Golden-tesztek** | a klinikai logikát: fixture be → várt score/jelzés ki | Node, DOM nélkül, a `core/`-on |
| **jsdom-smoke** | betölthető-e a build, lefut-e a render hiba nélkül | Node + jsdom, a build-kimeneten |
| **Böngésző** | tényleges beépülés, konzolhibák, `CaseState.errors` üres-e | kézi vagy Playwright |
| **Referencia-visszaellenőrzés** | ahol a logika külső forrásból jön: ismert bemenet → ismert kimenet | golden-fixture-ként |

A negyedik szint a legértékesebb, és a v16 EKG-modulja mutatja meg, miért: a
`EKG_munkafuzet_spec.md` minden képlet mellett tartalmazza a munkafüzet saját eredményét, és a
modul soronként vissza lett ellenőrizve ellene. Ugyanezt kell tudni minden portolt score-ról —
a fullPIERS-t a publikált példaszámítás ellen, a Bishopot a definíció ellen. **Egy score, amihez
nincs referencia-fixture, nem kerül be.**

## Frissesség (validity window)

Minden változó kap egy érvényességi ablakot, ami kontextusfüggő:

| Változó | Ambuláns | Vajúdás alatt |
|---|---|---|
| Vérnyomás | 7 nap | 4 óra |
| Thrombocyta | 30 nap | 6 óra |
| SpO₂ | 7 nap | 1 óra |
| Testmagasság | ∞ | ∞ |
| CTG-alapvonal | — | 30 perc |

Lejárt értéket a felület **szürkén, dőlten, lejárati jelzéssel** mutat, és a score-ok
alapértelmezetten nem használják — csak explicit „elavult adattal is számolj" kapcsolóval,
és akkor az eredményen ott a figyelmeztetés.
