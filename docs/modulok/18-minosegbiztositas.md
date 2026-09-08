# Modul 18 — Minőségbiztosítás

| | |
|---|---|
| **Cél** | Intézményi szintű mutatók: nem egy betegről, hanem az ellátásról |
| **Forrás** | ÚJ |
| **Becsült változó** | ~60 (aggregátum, nem eset-szintű) |
| **Fázis** | 6 — **de az adatteljességi rész a Fázis 2-ben** |
| **Függ** | 15, 17 |

## Mi van már meg az IntuiCare-ben

Az `admin_audit_log` + `audit_trigger_fn`, az `error_log`, a `satisfaction_surveys` és a `/admin/portal-analitika` adja a nyersanyagot. Az aggregátum-nézetek mintája is megvan (`v_havi_ledger`, `v_heti_munkaido` a munkaidő-oldalon). **A klinikai mutatók — Robson, adatteljesség, eltérés-elemzés — újak.**

## 1. Ez a modul másképp működik, mint a többi tizenhét

**Nem betegszintű, hanem intézményi.** Más adatmodellt kíván: aggregátumot, nem esetet. Ez a
fő oka, hogy a 18-ból ez lóg ki leginkább (a `12` onkológia mellett), és ezért van a 6. fázisban.

**Egyetlen része kivétel:** az adatteljesség-mérés, ami a kutatási cél miatt előrekerül a
Fázis 2-be (ld. `04-utemterv.md`).

## 2. Négy mutatócsoport

### 2.1 Adatteljesség (Fázis 2)

| Mutató | Mit mér |
|---|---|
| `qa.completeness.byVariable` | változónként: hány esetben maradt üresen |
| `qa.completeness.byModule` | modulonként átlagos kitöltöttség |
| `qa.completeness.mandatory` | a `requiredWhen` szerint kötelező, mégis üres mezők |
| `qa.unknownRate` | a „nem tudom" válaszok aránya — **külön az üres mezőktől** |
| `qa.insufficientScores` | hány score nem tudott lefutni, és mi hiányzott |

Kutatásban ez nem szépséghiba, hanem **a minta minőségének mérőszáma**. Egy 30%-ban hiányos
változó nem használható elemzésre, és ezt előbb kell tudni, mint az adatgyűjtés végén.

### 2.2 Klinikai kimenetel-mutatók

| Mutató | Alap |
|---|---|
| **Robson-osztályozás** | császármetszés-arány 10 csoportban — a WHO standard eszköze |
| Anyai halálozás, súlyos anyai morbiditás | ICHOM PCB026, PCB029–032 |
| Perinatális halálozás | PCB027, PCB028 |
| Koraszülési arány (spontán vs. iatrogén) | PCB033, PCB034 |
| OASIS (III–IV. fokú perineális sérülés) arány | `15` |
| PPH-arány és -súlyosság | CMQCC stage-ek |
| Szoptatási arány elbocsátáskor és 6 hónapnál | `16` BSES-SF |

### 2.3 Folyamatmutatók

Aszpirin-profilaxis lefedettsége a magas PE-kockázatúak közt · GBS-szűrés lefedettsége ·
antibiotikum-profilaxis időzítése CS-nél · VTE-profilaxis lefedettsége · EPDS-szűrés
lefedettsége · a WHO checklist kitöltöttsége.

### 2.4 Eltérés-elemzés — a legérdekesebb rész

> **Mikor bírálta felül az orvos a rendszer javaslatát, és mi lett a kimenetel?**

A rendszer minden hard-stop megkerülést, minden `prefill` felülírást és minden elutasított
javaslatot naplóz, indoklással. Ez két dolgot ad:

1. **A rendszer javítása.** Ha egy javaslatot az esetek 80%-ában felülbírálnak, a javaslat rossz,
   nem az orvosok.
2. **Kutatási kérdés.** A felülbírálás és a kimenetel összefüggése önálló vizsgálati téma.

## 3. Adatmodell: aggregátum

Ez a modul **nem ír a `values` táblába**. Olvas — de csak de-identifikált nézeten keresztül,
`phi: true` változók nélkül. A kimenete időszakos riport, nem esetdokumentum.

```
values (de-identifikált nézet)  ──▶  qa.aggregate(period, cohort)  ──▶  riport
```

## 4. Keresztfeltöltés

**⇦ Mi tölti fel**: minden modul, aggregáltan.
**⇨ Mit tölt fel**: semmit betegszinten. A kimenete intézményi riport és kutatási export.

## 5. Elfogadási kritérium

**Fázis 2 (adatteljesség):** 10 szintetikus esetből készült exporthoz kiíródik, mely változó
hány esetben maradt üresen, és a „nem tudom" válaszok külön számolódnak az üres mezőktől.

**Fázis 6 (teljes):** a Robson-osztályozás 10 csoportja automatikusan képződik a rögzített
adatból, kézi besorolás nélkül.

## 6. Nyitott kérdés

**Ez a modul a másik, ami kilóg** (a `12` onkológia mellett). Az intézményi minőségbiztosítás
külön adatmodellt, külön jogosultsági kört és külön riportmotort kíván — lényegében egy második
alkalmazás a betegdokumentációs rendszer mellett.

**Javaslat:** a Fázis 2-ben csak az adatteljesség-mérés (ami a kutatási célhoz kell), a teljes
minőségbiztosítási modul pedig legyen külön projekt, ami az OGDOC exportjaira épül. Így a
betegdokumentációs gerinc nem hízik meg tőle, és a két rendszer külön fejleszthető.
