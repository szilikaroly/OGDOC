# 02 — A változóregiszter és a levezetési motor

Ez a dokumentum a kérés két központi elemét fejti ki:

> „minden lépéshez és változóhoz készítsünk dokumentációt"
> „az egyes mezők hasonló vagy korábbi adatigénnyel hivatkozzanak egymásra és töltsék fel egymást"

## 1. A `VariableDef` séma

Minden változó egyetlen rekord. A dokumentáció nem külön fájlban él, hanem **a változó része** —
így nem tud elavulni.

```jsonc
{
  "id": "vitals.bp.systolic",        // stabil, névtérrel, SOHA nem átnevezve
  "version": 3,                       // séma- vagy jelentésváltozáskor nő
  "status": "active",                 // draft|active|deprecated|superseded
  "supersededBy": null,

  "label":  { "hu": "Szisztolés vérnyomás", "en": "Systolic blood pressure" },
  "short":  { "hu": "RRsys", "en": "SBP" },
  "module": "status.cardiovascular",
  "shownIn": ["status.cardio", "labour.monitoring", "risk.panel"],  // hol jelenik meg

  "datatype": "quantity",             // quantity|coded|coded-multi|bool|tristate|date|text|series
  "unit": "mm[Hg]", "unitSystem": "UCUM",
  "domain": { "min": 40, "max": 300, "step": 1,
              "plausible": [70, 220],  // ezen kívül: „biztos?" visszakérdezés
              "critical":  [null, 160] },  // ezen túl: azonnali jelzés
  "cardinality": "series",
  "validity": { "ambulatory": "P7D", "labour": "PT4H" },

  "timing": ["prenatal.entry", "every.visit", "labour.hourly", "postpartum"],
  "requiredWhen": "ctx.encounter in ['prenatal','labour']",
  "provenanceAllowed": ["clinician", "device", "patient"],

  "documentation": {
    "definition":  { "hu": "Az artériás nyomás csúcsértéke…", "en": "…" },
    "howToMeasure":{ "hu": "Ülő helyzetben, 5 perc nyugalom után, megfelelő méretű mandzsettával…" },
    "pitfalls":    { "hu": "Túl kicsi mandzsetta 10-15 Hgmm-rel felülbecsül. Vajúdás alatt kontrakció közben ne mérj." },
    "whyItMatters":{ "hu": "A preeclampsia diagnózisának és a MEOWS-nak is közvetlen bemenete." },
    "eduLevels": {                    // IPRACS 4 szintű oktatási réteg
      "student": "…", "resident": "…", "specialist": "…", "professor": "…"
    }
  },

  "standards": {
    "loinc": "8480-6", "snomed": "271649006",
    "fhir": { "resource": "Observation", "code": "8480-6",
              "path": "component.valueQuantity" },
    "ichom": null, "eeszt": null
  },

  "derivation": null,                 // ld. 2. fejezet
  "consumers": ["score.meows", "score.fullpiers", "calc.map",
                "score.shockindex", "code.bno.O13"],   // GENERÁLT, nem kézzel írt

  "phi": false,
  "audit": true,
  "evidence": [
    { "cite": "ACOG Practice Bulletin 222 (2020)", "doi": "10.1097/AOG.0000000000003891" }
  ],
  "changelog": [
    { "v": 3, "date": "2026-09-01", "what": "critical küszöb 160-ra ACOG 222 szerint", "by": "…" }
  ]
}
```

### Amit a `consumers` mező megold

A v16 nyitott hibái közt szerepel: „Duplikátumok rendezése: pulzus `c_hr` vs `k_hr2`, epesav
`k_ba` vs `lb_bile`, szisztolés RR `k_sbp` vs `#bp`." Ez pontosan az, amit egy generált
`consumers`-lista megelőz: a build **hibát dob**, ha két különböző `id` ugyanarra a LOINC/SNOMED
kódra képez le, és nincs köztük explicit `aliasOf` kapcsolat.

## 2. A levezetési motor — háromféle kapcsolat, és miért nem szabad összekeverni őket

Ez a rész a „töltsék fel egymást" kérés lényege. **Három, klinikailag élesen különböző**
mechanizmus van, és a legtöbb rendszer azért válik veszélyessé, mert összemossa őket.

### 2.1 `computed` — számított, csak olvasható

Tiszta függvénye más változóknak. Soha nem szerkeszthető, mindig újraszámolódik.

```jsonc
"derivation": {
  "kind": "computed",
  "inputs": ["anthro.height", "anthro.weight.prepregnancy"],
  "fn": "bmi",
  "requiresAll": true,
  "explain": { "hu": "BMI = testsúly (kg) / testmagasság (m)²" }
}
```

Példák: BMI, MAP, EDD és gesztációs kor az utolsó menstruációból, Cockcroft-Gault clearance,
HbA1c ↔ eAG, EFW (Hadlock-4), Bishop-összpontszám, sFlt-1/PlGF arány, Shock Index, CORI.

**Szabály:** ha `requiresAll` és bármely bemenet hiányzik → az eredmény `insufficient`, nem 0.

### 2.2 `prefill` — javasolt, felülírható

A mező **kap egy javaslatot** egy korábbi vagy hasonló adatból, de a felhasználóé az utolsó szó.
Ez az, amit a felhasználó „töltsék fel egymást" alatt elsősorban ért.

```jsonc
"derivation": {
  "kind": "prefill",
  "from": [
    { "source": "self.previousVisit", "policy": "carryForward", "maxAge": "P90D" },
    { "source": "hx.pregnancy.previous.gdm", "policy": "implies", "value": true },
    { "source": "import.fhir", "policy": "latest" }
  ],
  "precedence": ["clinician", "imported", "prefilled"],
  "notify": true
}
```

Viselkedés a felületen:

- A javasolt érték **halványan** jelenik meg, mellette forrás-jelzés: `← 2026-03-04. vizit`.
- Egy kattintás elfogadja (`provenance: prefilled` → `clinician`), a gépelés felülírja.
- A **„visszaállítás a forrásra"** művelet mindig elérhető.
- Ha a forrás értéke később változik, a még el nem fogadott javaslat frissül; az elfogadott nem.

**Kritikus megkötés:** a `prefill` soha nem lépheti át a bizonyosság-határt. Egy önbevallott
(`patient` / `reported`) adat nem tölthet fel egy mért (`measured`) mezőt anélkül, hogy a
`confidence` ne romlana vele együtt.

### 2.3 `mirror` — ugyanaz az adat, két helyen

Egy fogalom, több felületi hely. Az egyik a primer, a többi nézet. Kétirányú.

```jsonc
// score.bishop.dilation NEM önálló változó:
"aliasOf": "exam.cervix.dilation"
```

Ez oldja meg az IPRACS ismert limitációját („a Bishop Score egyszerre három helyen szerepel —
ez a legkevésbé SSOT-konform rész") és a v16 duplikátumait. A build ellenőrzi: **`aliasOf`
láncban nem lehet kör, és nem lehet két primer.**

### 2.4 Precedencia — melyik érték nyer

Amikor egy változóra több forrásból is érkezik érték:

```
1. clinician (közvetlenül, most rögzített)
2. device    (monitor, CTG, vérgázgép)
3. imported  (HIS / FHIR)
4. prefilled (korábbi vizit / rokon változó)
5. patient   (önbevallás)
6. default   ← NINCS ilyen. Alapértelmezett érték nem létezik klinikai változóra.
```

Konfliktus esetén (pl. importált Hb 92 g/L vs. most mért 78 g/L) a rendszer **nem választ némán**:
ütközésjelzést tesz a mezőre, mindkét értéket mutatja a forrásával és idejével, és a
felhasználónak kell döntenie. A döntés naplózódik.

## 3. A levezetési gráf mint elsőrendű objektum

A `computed` + `prefill` + `mirror` kapcsolatokból a build egy irányított gráfot épít. Ezen:

- **Körellenőrzés** — ha A-t B tölti és B-t A, a build elszáll. (Az IPRACS `syncAllRiskInputs()`
  láncában ez ma kézi fegyelem kérdése.)
- **Topologikus újraszámítási sorrend** — egy változó módosításakor pontosan azok a
  származtatottak számolódnak újra, amelyek érintettek, a helyes sorrendben. Nincs „hívjunk meg
  mindent minden változásra".
- **Hatásvizsgálat** — bármely mezőre megmutatható: „ha ezt módosítod, ez a 14 dolog változik".
  Ez a felületen is megjelenik, és a karbantartásban is ez a legfontosabb eszköz.
- **Dokumentáció-generálás** — a mezőnkénti dokumentációba automatikusan bekerül a
  „mit tölt fel" és „mi tölti fel" lista, tehát nem tud eltérni a kódtól.

## 4. Mezőnkénti dokumentáció — a generált kimenet

Minden változóhoz a build legenerálja ezt (felületen ⓘ ikon, offline HTML-ben egy fejezet):

```
vitals.bp.systolic — Szisztolés vérnyomás                    [v3, aktív]

MI EZ          Az artériás nyomás csúcsértéke…
HOGYAN MÉRD    Ülő helyzetben, 5 perc nyugalom után…
CSAPDÁK        Túl kicsi mandzsetta 10-15 Hgmm-rel felülbecsül…
MIÉRT SZÁMÍT   A preeclampsia diagnózisának és a MEOWS-nak is bemenete.

TARTOMÁNY      40–300 mm[Hg] │ szokásos 70–220 │ kritikus ≥160
ÉRVÉNYESSÉG    ambuláns 7 nap │ vajúdás alatt 4 óra
KÓDOK          LOINC 8480-6 │ SNOMED 271649006 │ FHIR Observation

⇦ FELTÖLTI     korábbi vizit (90 napig) · HIS-import
⇨ EZT TÖLTI    MAP · Shock Index · MEOWS · fullPIERS · CORI · BNO O13 ajánlás
               (6 fogyasztó — módosításkor mind újraszámol)

BIZONYÍTÉK     ACOG Practice Bulletin 222 (2020) · doi:10.1097/AOG.0000000000003891
VÁLTOZÁSOK     v3 2026-09-01 — kritikus küszöb 160-ra, ACOG 222 szerint
```

## 5. Kiindulási állomány

A regiszter magja már megvan: a mellékelt ICHOM PCB v5.0 adatszótárból **145 változót**
importáltunk gépi úton (`registry/ichom-pcb-v5.seed.json`), ebből **131-hez van kódolt
válaszkészlet**. Ezek `status: "seed-imported"` állapotban vannak — magyar címke, magyar
dokumentáció és `consumers` még nincs bennük, ez a Fázis 1 munkája.

Nagyságrend a többi forrásból:

| Forrás | Becsült változószám |
|---|---|
| ICHOM PCB v5.0 (importálva) | 145 |
| v16 anamnézis (COMPLAINT, SYSTEMS, REPRO, FAMILY, ENDO, LIFE, ORIGIN, SURG, SUPP, LABF, EESZT) | ~200 |
| v16 ultrahang (16 egyszeres + 6 páros paraméter × vizit) | ~30 |
| IPRACS FIX + labor + vajúdás-sorozat | ~85 |
| Új modulok (képalkotás, onkológia, műtő, diéta, minőségbiztosítás…) | ~800–1200 |
| **Összesen** | **~1300–1700** |
