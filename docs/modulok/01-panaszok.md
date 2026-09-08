# Modul 01 — Panaszok: okos kereshető űrlap

| | |
|---|---|
| **Cél** | A beteg saját szavaival elmondott panasz kódolt, kereshető tétellé alakítása, elvesztés nélkül |
| **Forrás** | v16 `COMPLAINT` (6 tétel) — kibővítendő; a szótár maga új munka |
| **Becsült változó** | ~120 tétel + ~400 szótári bejegyzés |
| **Fázis** | 2 |
| **Függ** | 02 (ellátási kontextus), 00 (regiszter) |

## Mi van már meg az IntuiCare-ben

A `clinical_encounters.chief_complaint` mező tárolja a vezető panaszt, a `contractions` és `fetal_movements` táblák pedig szülészeti panasz-idősorokat. **A panaszszótár maga nincs meg** — ez a modul teljes egészében új munka.

## 1. Cél és hatókör

A v16 hat szülészeti vörös zászlót ismer: fejfájás/látászavar, epigasztriális fájdalom, oedema,
nehézlégzés, vérzés, csökkent magzatmozgás. Ez a preeclampsia-felismerés magja, és jól van
megválasztva — de általános nőgyógyászati vagy sürgősségi felvételhez kevés.

**Amit a „kereshető" itt jelent:** nem szabad szöveges mező. A szabad szöveg nem kódolható, nem
kereshető, nem exportálható, és nem tud semmit feltölteni. Helyette egy szinonimákkal és laikus
kifejezésekkel ellátott panaszszótár, gépelés közbeni szűréssel.

A beteg azt mondja: *„szúr a hasam alul jobb oldalt"*. A rendszer felajánlja a **jobb alhasi
fájdalom** tételt (`compl.pain.abdomen.rlq`), és a beteg saját megfogalmazása is megmarad
`compl.verbatim` alatt. Egyik sem helyettesíti a másikat: a kódolt tétel a gépnek, a szó szerinti
idézet az orvosnak.

## 2. Adatszerkezet

### 2.1 A panaszszótár (`ComplaintTerm`)

Nem VariableDef, hanem külön törzs — a regiszterhez hasonló szerkezettel:

```jsonc
{
  "id": "compl.pain.abdomen.rlq",
  "label": { "hu": "Jobb alhasi fájdalom", "en": "Right lower quadrant pain" },
  "synonyms": ["jobb oldali alhasi fájdalom", "szúr a jobb oldalam alul",
               "jobb petefészek táji fájdalom", "vakbél tájéki fájdalom"],
  "bodySite": "abdomen.rlq",
  "redflag": false,
  "redflagWhen": "ctx.pregnant && ga < 12",   // extrauterin gyanú
  "opens": ["exam.abdomen", "us.gyn", "lab.hcg", "lab.crp"],
  "asks": ["compl.q.onset", "compl.q.severity", "compl.q.radiation",
           "compl.q.bleeding", "compl.q.fever"],
  "snomed": "301769009",
  "differential": ["appendicitis", "ovarian.torsion", "ectopic", "pid", "cyst.rupture"]
}
```

### 2.2 Minden aktivált panasz OPQRST-attribútumokat kap

| Változó | Típus | Megjegyzés |
|---|---|---|
| `compl.<id>.onset` | date/datetime | mikor kezdődött |
| `compl.<id>.onsetType` | coded | hirtelen / fokozatos / ismétlődő |
| `compl.<id>.provoke` | coded-multi | mi váltja ki / mi enyhíti |
| `compl.<id>.quality` | coded | szúró / égő / görcsös / tompa / nyomó |
| `compl.<id>.radiation` | coded-multi | hova sugárzik |
| `compl.<id>.severity` | quantity 0–10 | VAS |
| `compl.<id>.timing` | coded | állandó / hullámzó / ciklushoz kötött |
| `compl.<id>.course` | coded | javul / változatlan / romlik |
| `compl.verbatim` | text | a beteg saját szavai, `phi: false`, de szerkesztetlen |

### 2.3 A hat örökölt vörös zászló

A v16 `rf:1` jelölése átkerül a szótár `redflag` mezőjébe:

| v16 id | Új id | Vörös zászló |
|---|---|---|
| `c_head` | `compl.neuro.headache.visual` | igen, terhességben |
| `c_epi` | `compl.pain.epigastric` | igen, terhességben |
| `c_edema` | `compl.edema.generalized` | feltételes |
| `c_dysp` | `compl.resp.dyspnea` | **igen, mindig** |
| `c_bleed` | `compl.bleeding.vaginal` | igen |
| `c_move` | `compl.fetal.reducedMovement` | **igen, mindig** |

## 3. Keresztfeltöltés

**⇦ Mi tölti fel ezt a modult**
- `02` ellátási kontextus → mely panaszkészlet jelenik meg (szülészeti / nőgyógyászati / általános)
- `03` anamnézis → korábbi hasonló panasz esetén `prefill` javaslat, „ismétlődő?" kérdéssel

**⇨ Mit tölt fel ez a modul**

| Cél | Mechanizmus |
|---|---|
| `04` státusz-alszekciók | a panasz `opens` listája **kötelezővé teszi** a releváns fizikális vizsgálatot |
| `05` vizsgálatok | `opens` → labor- és képalkotó-javaslat a teendőlistába |
| `09` epikrízis | a panasz a „felvétel oka" narratíva magja |
| `17` BNO | tüneti kódok (R-fejezet), ha nincs végleges diagnózis |
| kockázati motor | a vörös zászlók közvetlenül a CORI „egyéb" doménjébe |

**Konkrét példa a láncra:** „csökkent magzatmozgás" bejelölése → CTG kötelezővé válik
(`opens: exam.ctg`), az ultrahang-modul megnyílik, a gesztációs kor `prefill`-lel átjön a
`02`-ből, és a teendőlistába bekerül a „azonnali CTG, majd biofizikai profil" tétel.

## 4. Klinikai szabályok

- **A vörös zászló nem törölhető némán.** Ha egy `redflag` panasz aktív, a hozzá tartozó teendő
  csak indoklással zárható le, és az indoklás bekerül az epikrízisbe.
- **A `redflagWhen` kontextusfüggő.** A jobb alhasi fájdalom önmagában nem vörös zászló;
  12. hét előtti terhességben, pozitív hCG mellett viszont extrauterin terhesség gyanúja.
- **Több panasz együtt mintázatot ad.** Fejfájás + epigasztriális fájdalom + oedema együtt
  erősebb preeclampsia-jelzés, mint külön-külön — ez a `03`/`05` felé továbbított összesített
  jelzés, nem külön score.

## 5. Felület

Egyetlen keresőmező, alatta a kiválasztott panaszok kártyaként, mindegyik kinyitható az
OPQRST-attribútumokért. A gépelés közbeni találatlista a szinonimákra is illeszkedik, és
mutatja, melyik tétel vörös zászló. Beteg-módban a laikus megfogalmazás a fő címke, klinikus
módban a szakkifejezés.

## 6. Elfogadási kritérium

Tíz valós, szabadszöveges panaszleírásból (szintetikus, de életszerű megfogalmazásban) legalább
nyolc a helyes kódolt tételre talál a szótárból, az első három találat között.

## 7. Nyitott kérdés

**Ez a modul a terv legalábecsültebb tétele.** A ~400 tételes magyar panaszszótár szinonimákkal
és laikus kifejezésekkel önmagában több hét munka, és a minősége dönti el, hogy a rendszer
használható-e a gyakorlatban. Érdemes megfontolni, hogy egy szűkebb, 120–150 tételes, kizárólag
szülészeti-nőgyógyászati szótárral induljunk, és a bővítés használat közben, a `compl.verbatim`
mezőkben ténylegesen megjelenő megfogalmazásokból történjen.
