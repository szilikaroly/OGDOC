# Modul 13 — Ellátás tervezés

| | |
|---|---|
| **Cél** | A következő lépések megtervezése: vizitrend, szülésmód, konzíliumok, megosztott döntés |
| **Forrás** | ÚJ (a v16 teendőmotorja és az IPRACS „Döntés" fülje a mag) |
| **Becsült változó** | ~50 |
| **Fázis** | 4 |
| **Függ** | minden korábbi modul |

## Mi van már meg az IntuiCare-ben

A `followup_protocols` + `_steps` + `_enrollments` + `_occurrences` a protokollmotor, a `patient_health_plans` a terv tárolása, a `conversations`/`messages` a beteg tájékoztatásának dokumentálása, a `notifications` az emlékeztetőké. **A vizitrend-generálás rizikó szerint és a szülésmód-tervezés megosztott döntéshozatallal új.**

## 1. A teendőmotor kimenetétől a tervig

A v16-nak már van teendőmotorja: minden pozitív válasz vagy kóros érték teendőt generál,
indoklással (a `v15` réteg teendő-indoklás tudásbázisa). Ez a modul ezt **időbe helyezi**.

## 2. Vizitrend generálása rizikó szerint

```jsonc
"plan.visitSchedule": {
  "derivation": {
    "kind": "computed",
    "inputs": ["ctx.ga", "ctx.pathway", "risk.preeclampsia.nice",
               "risk.gdm.nice", "ctx.multiple", "hx.repro.ptb"],
    "fn": "visitSchedule", "requiresAll": false
  }
}
```

Alacsony kockázatú várandós és egy krónikus hypertoniás, ikerterhes, korábbi koraszüléses beteg
vizitrendje nem ugyanaz. A modul a nemzeti gondozási protokollból indul, és a rizikófaktorok
szerint sűríti.

## 3. Szülésmód-tervezés — megosztott döntéshozatal

A legérzékenyebb rész: **VBAC vs. elektív ismételt császármetszés**.

| Bemenet | Forrás |
|---|---|
| VBAC sikervalószínűség | `score.vbac.grobman` (`10`) |
| Uterusruptura kockázata | előző CS típusa, hegek száma (`11`, `03`) |
| Beteg preferenciája | `plan.delivery.patientPreference` |
| Intézményi feltételek | 24 órás anesztézia, azonnali CS lehetősége |

A modul **nem dönt**. Megjeleníti mindkét út számszerű kockázatait, dokumentálja a beteg
tájékoztatását és preferenciáját, és rögzíti a közös döntést az indoklással. Ez az, ami egy
későbbi felülvizsgálatban a leginkább számít.

## 4. További tervek

| Terv | Tartalom |
|---|---|
| Születési terv | fájdalomcsillapítás, kísérő, testhelyzet, bőr-bőr kontaktus, köldökzsinór-ellátás |
| Szülés utáni fogamzásgátlás | módszer, időzítés, szoptatással való összeférhetőség |
| Szoptatási terv | szándék (ICHOM `prom.bf.intention`), korábbi tapasztalat, kockázatok |
| Konzíliumok | mely szakterületek, mikorra — automatikusan a vörös zászlókból |
| Sürgősségi terv | mikor jöjjön azonnal — a beteg nyelvén, nyomtatva |

## 5. Konzílium-javallatok automatikusan

| Kiváltó | Konzílium |
|---|---|
| CORI ≥ 3 | senior szülész |
| `hx.sys.cardiac` vagy CARPREG II ≥ 2 | terhes-kardiológia |
| `hx.endo.dm1` / `dm2` | diabetológia |
| EPDS ≥ vágóérték vagy Q10 pozitív | pszichiátria |
| PPP-rizikó magas | **sürgős** pszichiátria |
| `hx.family.*` halmozódás | klinikai genetika |
| Bariátriai előzmény, GDM | dietetika |
| Anesztéziás rizikó (ASA ≥ 3, PLT < 80) | aneszteziológia |

## 6. Keresztfeltöltés

**⇦ Mi tölti fel**: minden modul vörös zászlói és score-jai.
**⇨ Mit tölt fel**: `14` zárójelentés (a javaslatok része) · `15` utánkövetés (a vizitrend adja
a várt időpontokat) · `09` epikrízis.

## 7. Elfogadási kritérium

Egy ikerterhes, krónikus hypertoniás beteg vizitrendje sűrűbb, mint egy alacsony kockázatúé, és
a különbség **indokolva megjelenik** — nem csak a dátumok mások, hanem az is látszik, melyik
rizikófaktor sűrítette.

> **Ez teszt, nem ígéret:** [`test/tervezes.test.ts`](../../test/tervezes.test.ts).

Minden hozzáadott vizit magával hozza a módosítót, ami hozzáadta, és annak a forrását. Két
rizikófaktor ugyanarra a hétre **nem kettőz vizitet, csak indoklást**: a beteg egyszer jön be,
az ok kettő.

## 8. Nyitott kérdés

~~A magyar nemzeti várandósgondozási protokoll vizitrendje a jogszabályi alap; ezt kell alapnak
venni, és a sűrítést ehhez képest jelezni.~~ **Eldőlt: a javaslat szerint, két kikötéssel.**

**1. A jogszabályi alap PADLÓ, és ezt a szerkezet tartja meg.** A rizikófaktor sűríthet, de
nem ritkíthat — a módosítónak nincs `removes` mezője, tehát nincs hová írni azt, hogy „ezt a
vizitet hagyd ki”. Egy validátorszabályt meg lehet kerülni egy sürgős javítással; egy hiányzó
mezőt nem.

**2. Verziózva, mint a FIGO-stádiumok** (`plan.protocolVersion`) — de a verzió mellé
ELLENŐRZÖTTSÉGI SZINT is került, mert a kettő nem ugyanaz. A jelenlegi alaptábla `assumed`
szintű: a szokásos gyakorlat szerint van felvéve, nem a rendelet szövegéből átvezetve. Ezért a
terv **tervezésre használható, elmulasztott vizit megállapítására nem** (`canAssertMissed`).
Ugyanaz a szétválasztás, mint a normogramnál a telepítés és az ellenőrzés között: a tábla
megléte nem ugyanaz, mint a helyessége.

A modul legfontosabb szabálya viszont nem ez, hanem a szokásos: **a hiányzó rizikóadat nem
alacsony kockázat.** Egy vizitrend-generátornak van alapesete, és hiányzó adatnál kézenfekvő
lenne visszaadni — a rendszer ehelyett ELŐZETES tervet ad, megnevezve, melyik rizikót nem
lehetett kizárni és hány vizittel sűrítene, ha fennállna. (ld.
[`../fejlesztes/20-ellatas-tervezes.md`](../fejlesztes/20-ellatas-tervezes.md))

### Új nyitott kérdések, amiket a megvalósítás hozott elő

**A vizitrend nem lehet `computed` változó**, ahogy a fenti 2. pont vázolta. A
kalkulátor-réteg számot vesz és számot ad (a 12. modul óta build-szabály); a vizitrend
indoklással ellátott lista. Motor adja, nem levezetés — és ez jó így, mert egy levezetett mező
egyetlen értéket tárolna, a tervnek pedig épp az a lényege, hogy megmondja, miből lett.

**A CORI nem lehet konzílium-kiváltó.** Az 5. pont táblázata „CORI ≥ 3 → senior szülész”-t ír;
a feltétel viszont csak regiszterben létező VÁLTOZÓRA hivatkozhat (ez tartja fordításkor
ellenőrizhetőnek), a CORI pedig motor-kimenet. A gondozási terv stabil tényekből épül, az akut
score az akut útvonalé — az „ugyanaz a szabály mindkét helyen” itt hibás lenne. NYITOTT, hogy a
szülőszobai motor hogyan adja át a maga javallatait a tervnek.

**Az alaptábla ellenőrzése.** A 26/2014. (IV. 8.) EMMI rendelet vizitrendjét elsődleges
forrásból kell átvezetni; addig a terv nem használható számonkérésre. Ez nem elvi kérdés, hanem
elvégzendő munka.
