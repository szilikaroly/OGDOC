# 15 — Validált mérőeszközök: amit nem szabad átírni

> Ez a réteg egyetlen dologban különbözik minden mástól a rendszerben: **itt
> a pontosság nem a mi teljesítményünk, hanem egy publikációé.** Egy validált
> kérdőív attól validált, hogy pontosan úgy kérdez, ahogy a validációs
> vizsgálatban kérdezett.

## 1. Három kapu

| Kapu | Mit véd |
|---|---|
| **Licenceletlen tételszöveg** → az eszköz nem vehető fel | egy saját szavakkal feltett „EPDS" nem EPDS, és a vágóértéke nem érvényes rá |
| **Hiányzó tétel** → nincs összpontszám | a tízből kilenc kitöltött tétel nem „majdnem teljes EPDS"; az arányosítás nem validált eljárás |
| **Kritikus tétel** → vörös zászló az összpontszámtól függetlenül | egy alacsony összpontszám nem némíthatja el |

### 1.1 A licenc nem adminisztráció

A validált magyar fordítás jogilag védett lehet. A definíció ezért **kétféle
szöveget** ismer:

```jsonc
"label": { "hu": "Önkárosítás gondolata" },   // a MIÉNK — szabadon használható
"text":  null                                  // a VALIDÁLT szöveg — licenc, hiányzik
```

Amíg a `text` nincs betöltve, az `administrable()` nemet mond:

```
A(z) EPDS validált tételszövege nincs betöltve (licenc). Saját megfogalmazású
kérdésekkel felvéve az eszköz nem az eszköz, és a vágóértékei sem érvényesek rá.
```

**A kapu a FELVÉTELRE vonatkozik, nem a feldolgozásra.** Egy máshol felvett EPDS
eredménye értékelhető marad — a rendszer a pontozást és a besorolást elvégzi.
Ez a különbség fontos: a kapu a hamis eszközt akadályozza meg, nem a meglévő
adat használatát.

### 1.2 A fordítás állapota az eredmény része

```
validated   — hivatalos validált fordítás, saját közleménnyel
unvalidated — létezik fordítás, de nem validált
none        — nincs magyar változat betöltve
```

A nem validált fordítással gyűjtött adat **klinikailag használható, kutatásilag
korlátozottan**. A rendszer ezért nem tiltja, hanem az eredményre írja — mert a
publikálhatóság kérdése akkor merül fel, amikor az adat már megvan, és akkor
már késő.

Az EPDS a kivétel: **ante- és postpartum külön magyar validációval** rendelkezik
(Töreki és mtsai), ami ritka és értékes.

## 2. A kritikus tétel: kapu, nem küszöb

```ts
INST.score(reg, st, "inst.epds")
// { total: 6, band: { severity: "normal" },
//   critical: { triggered: true, message: "A 10. tétel … POZITÍV …" } }
```

Hat pont az EPDS-en a normál sávban van. Pozitív 10. tétellel viszont azonnali
megbeszélést indokol. A `band` és a `critical` **külön mező**, és a felület
mindkettőt megjeleníti — a besorolás nem nyomhatja el a kritikus tételt.

A kritikus tétel akkor is szól, ha az **összpontszám hiányos kitöltés miatt nem
születik meg**. Ez szándékos sorrend a motorban: a kritikus tételt előbb
értékeljük ki, mint az összeget.

## 3. A vágóérték kontextusfüggő

Ugyanaz a 12 pont:

| Időszak | Besorolás |
|---|---|
| antepartum (`prenatal`) | **valószínű depresszió** |
| postpartum | határérték |

A rendszer a `ctx.pathway`-ből tudja, melyik készlet érvényes. Ez ugyanaz a
szerkezet, mint a laborreferenciáknál a trimeszter — és ugyanaz a tanulság: a
szám kontextus nélkül nem olvasat.

## 4. A pontozó kalkulátorok nem sorolnak be

Mind az öt eszköz összeadás, súlyozás nélkül — ezért **egyik sincs kapu
mögött**. De a kalkulátorok szándékosan **nem** sorolnak be: a vágóérték
kontextusfüggő, a kritikus tétel pedig az összegtől független. Egy
score-kalkulátor, ami maga sorol be, elrejtené, hogy a besorolás
kontextusfüggő.

Egy kivétel a puszta összeadás alól: a **MIBS fordított tételei**. Az
átfordítás a pontozás része, nem kényelmi átalakítás — nélküle a magas
pontszám hol jó, hol rossz kötődést jelentene.

## 5. Postpartum pszichózis: miért NINCS egyetlen szám

A modul nyitott kérdése ezzel dől el. A kísértés érthető: minden
rizikófaktorhoz tartozik egy publikált esélyhányados, és ezek összeszorzása
kényelmes lenne. Az eredmény azonban nem lenne érvényes:

- az esélyhányadosok **külön kohorszokból** származnak, eltérő
  alappopulációval és kimeneti definícióval;
- a faktorok **nem függetlenek** — a bipoláris zavar és a korábbi postpartum
  pszichózis nagyrészt ugyanazt a beteget jelöli ki;
- a szorzat **pontosnak látszana**, és épp ez a baj.

Ezért az `assessPpp()` felsorolja a tényezőket a saját forrásukkal és publikált
hatásukkal, és a besorolás **szabályalapú**: egyetlen major tényező elég a magas
besoroláshoz, mert a klinikai teendő ugyanaz. A hiány pedig meg van indokolva
az eredményben (`noCombinedEstimate`) — hogy ne látsszon hiányosságnak.

```ts
assessPpp(reg, st).level
// bipoláris zavar → "high", és az actions között:
//   „A felvétel (hospitalizáció) mérlegelése és a mérlegelés DOKUMENTÁLÁSA…"
//   „Az alvásmegvonás aktív megelőzése a gyermekágyban…"
```

**Hiányzó pszichiátriai anamnézisnél a szint `unknown`, és az első teendő:
a beteg NEM tekintendő alacsony kockázatúnak.** Ugyanaz a szabály, mint
mindenhol máshol a rendszerben.

## 6. Ami még hátravan

- **A licencelt tételszövegek beszerzése.** Ez nem fejlesztési feladat, és a
  legrosszabb pillanatban derül ki, ha elmarad: a rendszer kész, az eszköz nem
  vehető fel. A PR „ami hátravan" táblájában szerepel, hónapos átfutással.
- **A hiányzó magyar validációk.** A Whooley, a PHQ-9, az MSPSS és a MIBS
  magyar validációjáról nincs tudomásunk. Amíg nincs, ezek kutatási
  felhasználása korlátozott — a klinikai nem.
- **A szűrés utáni ellátási útvonal.** A szűrés önmagában nem ellátás: pozitív
  eredmény után elérhető perinatális pszichiátriai kapacitás kell, különben a
  szűrés kárt okoz — felismer egy problémát, amire nincs válasz. Ez szervezési
  kérdés, nem szoftveres.
