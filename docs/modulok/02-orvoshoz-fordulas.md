# Modul 02 — Orvoshoz fordulás oka

| | |
|---|---|
| **Cél** | Az ellátási kontextus rögzítése, amiből minden más modul kötelezősége és érvényességi ablaka következik |
| **Forrás** | ÚJ (a v16-ban szétszórtan, `conception` / `twins` / `ga` mezőkben) |
| **Becsült változó** | ~25 |
| **Fázis** | 1 |
| **Függ** | semmi — ez az első modul |

## Mi van már meg az IntuiCare-ben

**A `clinical_encounters` tábla ez a modul**: `encounter_type`, `status`, `start_ts`/`end_ts`, `location`, `chief_complaint`, `tenant_id`. Mellette a `patient_encounters` (`tipus` enum, `bno_kodok[]`, `oeno_kodok[]`, szerző + ellenjegyző aláírás) és az `appointments` + `patient_checkin` adja az ellátási kontextus indítását. A `ctx` objektum tehát meglévő táblákból épül, nem újakból.

## 1. Miért önálló modul, ha csak 25 változó

Mert ez állítja be a `ctx` objektumot, amire a regiszter minden `requiredWhen` és `validity`
kifejezése hivatkozik. **A 02. modul a 03–18. modul előfeltétele.** A v16-ban ez az információ
szétszórva él (a fejlécben váltható „Pre-IVF / Terhesgondozás / Terhespatológia" útvonal, plusz
a 01. szekció mezői), és ezért nem tud rendszerszinten szabályozni.

Egy példa, amiért ez számít: a vérnyomás érvényességi ablaka ambuláns kontextusban 7 nap,
vajúdás alatt 4 óra. Ugyanaz a változó, ugyanaz a definíció — de a `ctx.encounter` dönti el,
hogy egy 6 órás érték friss-e vagy lejárt.

## 2. Adatszerkezet

| Változó | Típus | Értékkészlet / megjegyzés |
|---|---|---|
| `ctx.encounter` | coded | `ambulatory` · `emergency` · `elective.admission` · `labour` · `followup` · `screening` |
| `ctx.pathway` | coded | `preconception` · `pre-ivf` · `prenatal` · `pregnancy.pathology` · `gynecology` · `postpartum` · `oncology` |
| `ctx.purpose` | coded | panasz kivizsgálása · gondozási vizit · beavatkozás · utánkövetés · szűrés · második vélemény |
| `ctx.referral` | bool | van-e beutaló |
| `ctx.referralDx` | coded (BNO) | beutaló diagnózis |
| `ctx.referralOrg` | text | beutaló intézmény |
| `ctx.pregnant` | tristate | igen / nem / **nem tudja** |
| `ctx.lmp` | date | utolsó menstruáció 1. napja |
| `ctx.ga` | quantity (computed) | gesztációs kor — `computed` az `lmp`-ből vagy a korai UH CRL-jéből |
| `ctx.gaSource` | coded | `lmp` · `crl` · `ivf.transfer` · `unknown` — **melyikből számoltuk** |
| `ctx.edd` | date (computed) | várható szülés ideje |
| `ctx.multiple` | coded | nem · DCDA · MCDA · MCMA (v16 `twins`) |
| `ctx.conception` | coded | spontán · ovuláció-indukció · IUI · IVF · ICSI · FET · donor (v16 `conception`) |
| `ctx.parity.gravida` | quantity | |
| `ctx.parity.para` | quantity | |
| `ctx.consentState` | coded | kutatási beleegyezés állapota (ld. 00-pozicionalas) |
| `ctx.role` | coded | ki tölti: beteg · szülésznő · rezidens · szakorvos · kutató |
| `ctx.eduLevel` | coded | student · resident · specialist · professor (IPRACS-örökség) |

## 3. A gesztációs kor: a legfontosabb számított érték az egész rendszerben

```jsonc
"ctx.ga": {
  "derivation": {
    "kind": "computed",
    "inputs": ["ctx.lmp", "us.crl.first", "ctx.ivfTransferDate", "ctx.encounterDate"],
    "fn": "gestationalAge",
    "requiresAll": false,
    "explain": { "hu": "Elsődlegesen a 8–13+6. héten mért CRL-ből; egyébként az utolsó menstruációból. IVF esetén a transzfer dátumából, embriókor szerint." }
  }
}
```

**Precedencia** — ez klinikai konszenzus, nem tetszés kérdése:

1. IVF/FET esetén a transzfer dátuma és az embriókor (a legpontosabb)
2. Korai ultrahang CRL (8–13+6. hét)
3. Utolsó menstruáció, ha nincs korai UH
4. Késői ultrahang biometria — csak ha semmi más nincs, és **jelezve, hogy pontatlan**

A `ctx.gaSource` mindig látszik a felületen. Egy LMP-ből számolt GA és egy CRL-ből számolt GA
között két hét különbség is lehet, és ez a triszómia-szűrés, a koraszülés-határ és az indukció
időzítése szempontjából is számít.

## 4. Keresztfeltöltés

**⇨ Mit tölt fel** — gyakorlatilag mindent:

| Cél | Mit ad |
|---|---|
| minden modul | `requiredWhen` kiértékelése — mely mezők kötelezőek |
| minden változó | `validity` ablak kiválasztása (ambuláns vs. vajúdás) |
| `01` panaszok | mely panaszkészlet jelenik meg |
| `05` ultrahang | melyik trimeszter-sablon nyílik, mely normogram érvényes |
| `05` szűrések | esedékesség-számítás |
| kockázati motor | `ctx.ga` a fullPIERS közvetlen bemenete; `ctx.multiple` a CMQCC-é és a PE-kockázaté |
| `17` BNO | a terhességi (O-fejezet) vs. nőgyógyászati (N-fejezet) kódok elkülönítése |

## 5. Elfogadási kritérium

Az ellátási kontextus megváltoztatása (pl. `ambulatory` → `labour`) a felületen **azonnal
átrendezi**, mely mezők kötelezőek, és mely korábban rögzített értékek számítanak lejártnak.
Ez géppel ellenőrizhető: ugyanaz a `CaseState` két különböző `ctx`-szel két különböző
`validate()` eredményt ad.

## 6. Nyitott kérdés

A `ctx.role` az artifact-változatban **nem biztonsági határ** — a felhasználó átállíthatja.
Csak felületszűrés. Ezt a felületen is ki kell mondani, nehogy valaki adatvédelmi garanciának
higgye. Valódi jogosultságkezelés csak a Fázis 7-ben, szerveroldalon (ld. `06-webes-migracio.md`).
