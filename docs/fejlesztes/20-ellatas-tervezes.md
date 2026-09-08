# 20 — Ellátás tervezés: a padló, amit sűríteni lehet, ritkítani nem

> Egy vizitrendet generálni könnyű. Azt megmondani, hogy a 26. héten MIÉRT van
> vizit — és hogy mi történik, ha egy rizikófaktorról nincs adatunk — nem az.
> Ez a modul a második két kérdésről szól.

## 1. A jogszabályi alap padló, és ezt a SZERKEZET tartja meg

A magyar várandósgondozási rend jogszabályi minimum. A rizikófaktor sűrítheti,
de nem ritkíthatja — és ez nem ellenőrzés kérdése:

```ts
export interface ScheduleModifier {
  when?: Condition[];
  whenAny?: Condition[];
  adds: PlannedVisitDef[];   // ← és nincs `removes`
}
```

A módosítónak nincs hová írni azt, hogy „ezt a vizitet hagyd ki". Egy
validátorszabályt meg lehet kerülni egy sürgős javítással; egy hiányzó mezőt
nem. A teszt ezért nem is a szabályt őrzi, hanem a következményét: **minden
alapvizit megmarad**, bármilyen rizikóprofilnál.

## 2. A hiányzó rizikóadat nem alacsony kockázat

Ez a modul legfontosabb szabálya, és ugyanaz, mint mindenhol máshol — csak itt
a legcsábítóbb megszegni. Egy vizitrend-generátornak *van* alapesete, és a
hiányzó adatnál kézenfekvő lenne visszaadni.

```ts
CARE.plan(reg, { /* csak ctx.pregnant és ctx.ga */ }, "care.pregnancy.hu")
// provisional: true
// undetermined: [{ modifier: "mod.multiple.mc", missing: ["ctx.multiple"],
//                  wouldAdd: 10 }, …]
// caveat: "ELŐZETES TERV: 7 rizikófaktor eldönthetetlen maradt … A hiányzó
//          adat NEM alacsony kockázat — ez a vizitrend addig nem tekinthető
//          véglegesnek."
```

A `wouldAdd` azért van benne, mert **a bizonytalanságnak súlya van**. Nem
mindegy, hogy egy eldönthetetlen kérdés egy vizittel vagy tízzel sűrítené a
rendet: a monochoriális ikerterhesség kizárása tíz TTTS-ellenőrzést jelent,
és amíg a chorionicitás nem ismert, ez a tíz alkalom nyitott kérdés, nem
elhagyott.

Az „alacsony kockázatú" vizitrendhez ezért **minden rizikófaktort negatívnak
kell rögzíteni**. Ez elsőre kényelmetlen; pontosan ez a lényege. Aki nem
kérdezte meg, az nem tudja.

## 3. A sűrítés indoklása: nem csak a dátum más

Minden hozzáadott vizit magával hozza, MI adta hozzá és MI ALAPJÁN:

```ts
plan.visits.find(v => v.from === 26).because
// [{ modifier: "mod.htn.chronic", label: "Krónikus hypertonia",
//    why: "…a praeeclampsia kockázata többszörös…",
//    source: "NICE NG133: Hypertension in pregnancy (2019)" },
//  { modifier: "mod.preeclampsia.prev", … }]
```

Két részlet, ami a valóságból jön:

- **Két rizikófaktor ugyanarra a hétre nem kettőz vizitet.** Ha a krónikus
  hypertonia és a korábbi praeeclampsia is a 26. hetet sűríti, egy vizit lesz,
  **két indoklással**. A beteg egyszer jön be; az ok kettő.
- **Egy módosító adhat tartalmat új vizit nélkül.** A 40 év feletti anyai
  életkor nem tesz külön alkalmat a 38. hétre — ott már van egy —, hanem
  hozzáírja, hogy ott a szülésindítást meg kell beszélni. A terv így nem
  hízik feleslegesen, az indok mégis látszik.

## 4. Tervezésre igen, vádolásra nem

```ts
plan.protocol.verification   // "assumed"
plan.canAssertMissed         // false
```

Az alaptábla a szokásos gyakorlat szerint van felvéve, **nem a 26/2014. EMMI
rendelet szövegéből átvezetve**. Ez elég ahhoz, hogy a következő időpontot
megtervezzük — és nem elég ahhoz, hogy egy hiányzó viziten *számon kérjünk*
valakit.

Ugyanaz a szétválasztás, mint a normogramnál a telepítés és az ellenőrzés
között ([13.](13-referenciatartomanyok.md)): **a tábla megléte nem ugyanaz,
mint a helyessége**. A validátor ezért figyelmeztet, a terv pedig kimondja.

A protokollnak emellett **verziója** van (`plan.protocolVersion`). A gondozási
rend maga változik, nem csak a beteg adata — ugyanaz a probléma, mint a
FIGO-stádiumoknál ([19.](19-onkologia.md)): verzió nélkül egy retrospektív
adatból nem derül ki, hogy egy hiányzó vizit mulasztás volt-e, vagy akkor még
nem is létezett.

## 5. Konzílium: a rendszer javallatot állít fel, konzíliumot nem kér

| Állapot | Mit jelent |
|---|---|
| `urgent` | fennáll, sürgős, még nem kérték meg |
| `indicated` | fennáll, még nem kérték meg |
| `requested` | fennáll, a kérése rögzült |
| `notIndicated` | a feltétel nem teljesül |
| **`unknown`** | **a feltételhez szükséges adat hiányzik** |

Az utolsó kettő különbsége ugyanaz, mint a szűrési esedékességnél: a
„nem javallt" és a „nem tudjuk" nem ugyanaz. Aki nem kérdezte meg, hogy volt-e
szívbetegsége, annál nem az derült ki, hogy nincs.

A javallat és a megkérés **két külön esemény**, és a különbség mérhető. Az
elutasítás legitim klinikai döntés — de indoklás nélkül (`plan.consult.declined`)
a javallat NYITVA marad, mert az elutasított és az elsikkadt javallat másképp
néz ki a dokumentációban, és ugyanúgy néz ki a betegen.

## 6. Szülésmód: a rendszer nem dönt, és ez állítás

```ts
deliveryPlan(reg, state).recommendation   // null — MINDIG
```

Nem óvatosságból. A hüvelyi szülés kísérlete és az elektív ismételt
császármetszés között nincs szakmai fölény, **kockázatcsere** van: a méhrepedés
ritka és katasztrofális, a császármetszés gyakoribb szövődményekkel jár és a
következő terhességet is terheli. Hogy melyik kockázat elviselhetőbb, az
értékítélet, és az a betegé.

Amit a rendszer megtesz:

- **összeszedi a tényezőket — szám nélkül.** A Grobman-együtthatók nincsenek
  meg; közelítéssel implementálni rosszabb lenne, mint nem adni számot
  (ld. [`core/scores/vbac.ts`](../../core/scores/vbac.ts));
- **kimondja, ha az egyik út ellenjavallt.** A klasszikus, T- vagy J-metszés
  után a hüvelyi szülés kísérlete nem esélykérdés;
- **nem engedi lezárni a tervet a beszélgetés nélkül.**

### Az intézményi feltétel, ami nem a betegé

```ts
d.options[0].offerability   // "unknown"
// "A „NEM TUDJUK" NEM jelenti azt, hogy adottak: a TOLAC felajánlása
//  feltételek nélkül nem javallat, hanem a kockázat áthárítása a betegre."
```

A 24 órás aneszteziológiai háttér és az azonnali császármetszés lehetősége
**intézményi tulajdonság** — de a következményét a beteg viseli. Ha a feltétel
hiányzik, a kísérlet választása nem itteni vállalást jelent, hanem megfelelő
intézménybe irányítást.

### A kapu három mezője

| Mező | Mit bizonyít |
|---|---|
| `plan.delivery.sharedDecision` | volt beszélgetés |
| `plan.delivery.optionsDiscussed` | **mely utak** kerültek szóba |
| `plan.delivery.patientPreference` | mit szeretne a beteg |

Az első kettő ugyanaz a kettős kapu, mint a terhesség alatti daganatnál
([19.](19-onkologia.md) 2.). A harmadik itt jön hozzá, és önálló mező marad:
**ha a beteg preferenciája megegyezik a javaslattal, az adat — ha eltér, az a
legfontosabb adat az egész tervben.** Ezért nem szabad a szakmai javaslattal
kitölteni.

## 7. Amit a megvalósítás előhozott

**A vizitrend nem lehet `computed` változó.** A modul terve
`plan.visitSchedule`-t vázolt fel `derivation.kind: "computed"`-dal. Ez nem
megy: a kalkulátor-réteg **számot vesz és számot ad** (a 12. modul óta ez
build-szabály), a vizitrend viszont indoklással ellátott LISTA. Motor adja,
nem levezetés — és ez jó így: egy levezetett mező egyetlen értéket tárolna, a
tervnek pedig épp az a lényege, hogy megmondja, miből lett.

**Nem minden kiváltó lehet feltétel.** A modul terve a „CORI ≥ 3" alapján
kérne senior szülészt. A feltétel viszont csak **regiszterben létező
változóra** hivatkozhat (ez tartja fordításkor ellenőrizhetőnek), a CORI pedig
motor-kimenet, nem rögzített adat. Ez nem hiányosság: a gondozási terv **stabil
tényekből** épül (anamnézis, chorionicitás, korábbi szülések), az akut,
pillanatnyi észlelésen alapuló score pedig az akut útvonalé
([17.](17-szuloszoba.md)). Az „ugyanaz a szabály mindkét helyen" itt hibás
lenne, nem elegáns.

**A hét törtszám, az ablak nem.** A gesztációs kor 24,1 (= 24+1 nap), az ablak
viszont betöltött hetekben van megadva: a „21–24. hét" a 24+6-ot is magában
foglalja. Az egyenes összehasonlítás hat nappal az ablak vége előtt tette
volna múlttá a vizitet — és ugyanez a hiba **a szűrési motorban is ott volt**:
a 28+3 hetes beteg OGTT-je „elmulasztottnak" látszott volna, három nappal a
határidő előtt. Mindkét helyen a betöltött hét számít.

## 8. Tesztek

[`test/tervezes.test.ts`](../../test/tervezes.test.ts) — 32 teszt:

- az ikerterhes, hypertoniás vizitrend sűrűbb, **és minden sűrítés megnevezi a
  rizikófaktort és a forrását** (az elfogadási kritérium);
- két rizikófaktor ugyanarra a vizitre: mindkét ok megjelenik;
- hiányzó rizikóadatnál a terv ELŐZETES, nem alacsony kockázatú;
- minden alapvizit megmarad, bármilyen rizikóprofilnál;
- ellenőrizetlen alaptáblával nincs elmulasztott vizit;
- a hiányzó anamnézis nem „nem javallt" konzílium;
- a pipa önmagában nem zárja le a szülésmód-tervet.
