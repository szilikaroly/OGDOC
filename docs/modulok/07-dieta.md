# Modul 07 — Diéta

| | |
|---|---|
| **Cél** | Táplálkozási javaslat állapotspecifikusan, nyomtatható betegtájékoztatóval |
| **Forrás** | ÚJ (a v16 `SUPP` szupplementációs része és az `en_bar` bariátriai tétel a mag) |
| **Becsült változó** | ~35 |
| **Fázis** | 5 |
| **Függ** | 03 (anamnézis), 05 (labor), 02 (GA) |

## Mi van már meg az IntuiCare-ben

A `food_log` (beteg-oldali étkezésnapló), a `measurements` és a `wearable_data` a bemeneti oldalt adja; a `patient_health_plans` a terv tárolását. A diétás protokollok és a generált betegtájékoztató új munka.

## 1. Cél

Ez a modul kevés változóból sok kimenetet termel: a bemenetek nagy része már megvan máshol
(BMI, GA, GDM-státusz, anaemia, bariátriai előzmény), a modul feladata a **javaslat
összeállítása és a betegtájékoztató legenerálása**.

## 2. Adatszerkezet

| Változó | Típus | Megjegyzés |
|---|---|---|
| `diet.current` | text/coded | jelenlegi étrend (v16 `diet` mező) |
| `diet.restrictions` | coded-multi | vegetáriánus, vegán, laktózmentes, gluténmentes, halal/kóser |
| `diet.allergies.food` | coded-multi | a v16 `4b` allergia-szekcióból `mirror` |
| `diet.fluidIntake` | quantity (L/nap) | v16 `fluid` |
| `diet.energyTarget` | quantity (kcal) | **computed** |
| `diet.proteinTarget` | quantity (g) | **computed** |
| `diet.carbDistribution` | structured | GDM esetén étkezésenként |
| `diet.supplements.*` | 8 tétel + dózis | v16 `SUPP`: folsav, D-vitamin, vas, jód, B12, omega-3 (DHA), kalcium, terhes-multivitamin |
| `diet.counselingGiven` | bool + dátum | megtörtént-e a tanácsadás |

## 3. Számítások

```jsonc
"diet.energyTarget": {
  "derivation": {
    "kind": "computed",
    "inputs": ["anthro.weight.prepregnancy", "anthro.height", "ctx.ga",
               "ctx.multiple", "lifestyle.activity"],
    "fn": "gestationalEnergyRequirement", "requiresAll": false,
    "explain": { "hu": "Alapanyagcsere + aktivitás + trimeszterfüggő többlet; ikerterhességben emelt." }
  }
}
```

**IOM súlygyarapodási ajánlás** (már megvan a v16-ban, `res_iom`): a terhesség előtti BMI
kategóriájából ad tartományt, és a modul összeveti a tényleges gyarapodással.

## 4. Állapotspecifikus protokollok

| Állapot | Forrásváltozó | Diétás következmény |
|---|---|---|
| **GDM / DM** | `hx.endo.gdm`, `hx.endo.dm1/dm2`, `lab.ogtt` | szénhidrát-elosztás étkezésenként, glykaemiás index, önellenőrzési napló |
| **Bariátriai műtét után** | `hx.endo.bar` | **vas, B12, folsav, D-vitamin, kalcium célzott pótlása és követése**; dömping miatt módosított GDM-szűrés; a műtét után legalább 12–18 hónap várakozás |
| **Anaemia** | `lab.hb`, `lab.ferritin` | vasban gazdag étrend + pótlás, C-vitaminnal együtt |
| **Coeliakia / IBD** | `hx.sys.liver` | gluténmentes, felszívódási zavar pótlása |
| **PCOS / inzulinrezisztencia** | `hx.endo.pcos`, `hx.endo.ir` | alacsony glykaemiás terhelés |
| **ICP (cholestasis)** | `hx.sys.icp`, `lab.bile` | zsírszegény, zsírban oldódó vitaminok |
| **Hypertonia / preeclampsia** | `hx.sys.htn` | sószegény — **de terhességben nem restriktív**, ez fontos különbség |
| **Laktáció** | `ctx.pathway` = postpartum | +energia, +folyadék, jód, DHA |

## 5. Keresztfeltöltés

**⇦ Mi tölti fel**: `03` (bariátriai előzmény, GDM, coeliakia, allergia), `05` (Hb, ferritin,
OGTT, epesav, D-vitamin szint), `04` (BMI, súlygyarapodás), `02` (GA, ikerterhesség).

**⇨ Mit tölt fel**: `13` ellátási terv (dietetikai konzílium javallata) · `14` zárójelentés ·
`06` (szupplementáció-átfedés ellenőrzése: ne kapjon kétszer vasat).

## 6. Kimenet

**Nyomtatható betegtájékoztató**, a beteg nyelvén, az ő konkrét adataival: mennyi energia,
mennyi fehérje, mit szedjen, mit kerüljön, mikor jöjjön vissza. Nem általános szórólap.

## 7. Elfogadási kritérium

Egy bariátriai műtét utáni, GDM-es várandós esetén a generált tájékoztató mind a hat kötelező
pótlást tartalmazza (vas, B12, folsav, D, kalcium + a GDM szénhidrát-elosztást), és jelzi a
módosított GDM-szűrési protokollt.

> **Ez teszt, nem ígéret:** [`test/dieta.test.ts`](../../test/dieta.test.ts).

## 8. Nyitott kérdés

~~A magyar tápanyagtáblázat és a konkrét ételajánlások forrása nincs kijelölve.~~
**Eldőlt: a modul NEM ad konkrét étrendet.** Célértéket (tartományként), indokolt
tiltásokat és konzíliumi javallatot ad — ez klinikailag védhető, és nem igényel licencelt
tápanyagadatbázist. A megvalósítás `registry/dieta/` alatt él, protokollonként forrással.

> **Következmény, amit érdemes kimondani:** ahol a szám nem születik meg — mert a képlet
> kapu mögött van, vagy hiányzik egy bemenet —, ott a tájékoztatóban nem üres hely marad,
> hanem a **dietetikai konzílium javallata és a hiány oka**. A modul így akkor is
> használható marad, amikor még nem tud mindent.
