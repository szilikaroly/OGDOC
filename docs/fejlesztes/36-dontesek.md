# 36 — A 326 szabály döntéssé tétele

*A [13. lépéslista](../13-18-lepes.md) 3. lépése. Ez a dokumentum azt írja le,
mit tud a gép ebből — és hol ér véget, ahol az emberi aláírás kezdődik.*

---

## A feladat, ahogy a lépéslista kimondja

> A felülettérkép 1502 mezőjéből **95 nem vehető át változatlanul** és **231
> kapu**. Ezek nem mezők, hanem **szabályok** — mindegyik egy döntést vár, és a
> döntés nem fejlesztői kérdés.
>
> **Kész, ha.** Minden `refused` és `gate` állapotú mező mellett ott a döntés:
> átvesszük · átalakítva vesszük át · nem vesszük át, egy mondatnyi indoklással,
> aláíróval.

---

## Az első felismerés: nem 326 döntés, hanem 38

A 326 mező mögött **38 szabály** áll. A `versionedClassification` egymaga 39
mezőt érint, az `orderTracking` 29-et, a `modelBacked` 27-et. Egy ülés, ami
mezőnként halad, a századik sornál elveszti a fonalat; egy ülés, ami
szabályonként halad, harmincnyolcszor dönt, és utána a 326 mező besorolása
következmény, nem külön munka.

Ezért a döntés **elsődlegesen szabályszintű**, és ahol egy mező eltér a
szabályától, ott **mezőszintű eltérést** írnak alá. A mezőszintű döntés erősebb.

A szabályok listáját nem kézzel írtuk össze: a `FieldAudit.rule` mező a
`core/ui/felulet.ts`-ben azt mondja meg, **melyik zászló szólalt meg** — a
`why` szövegéből visszafejteni bizonytalan lett volna, egy átfogalmazás pedig
némán elszakította volna az aláírt döntést attól, amit aláírtak.

---

## A második: a hiányzó döntés sehol nem „átvesszük”

Ez a rendszer legtöbbször ismételt szabályának újabb alakja — *a hiányzó adat
sehol nem „nem”*. Itt így hangzik:

> **Eldöntetlenül egy mező sem kerül át.** Nem figyelmeztetés, hanem
> alapállapot: a rendszer zárva születik.

Négy állapot van, és három közülük zár:

| Állapot | Mit tudunk | Átkerül? |
|---|---|---|
| `dontve` | van aláírt, teljes döntés, a mai szabályra | a döntés szerint |
| `eldontetlen` | nincs döntés | **nem** |
| `elavult` | volt döntés, de a szabály mondata azóta megváltozott | **nem** |
| `hianyos` | van döntés, de hiányzik egy megkövetelt szerep aláírása | **nem** |

Az `eldontetlen` és az `elavult` hatása ugyanaz, a munka mégsem: az elavultnál
tudjuk, ki és mikor írt alá, csak azt nem, hogy erre-e.

---

## A harmadik: az aláírás ahhoz kötődik, amit aláírtak

Minden szabálynak van egy **normatív magja** (`lenyeg`): az az egy mondat, amit
aláírnak. A döntés ennek a mondatnak a **lenyomatát** (sha256, 16 hex) rögzíti.

Ha a mondat megváltozik — akár egyetlen szóközzel —, a döntés `elavult` lesz.
Ha a szabály **címe** vagy a **javaslata** változik, az aláírás érvényben marad:
azok nem a normatív mag. A tesztek mindkét irányt bizonyítják.

Enélkül a legcsendesebb hiba állna elő, ami ilyen rendszerben előállhat: egy
átfogalmazás átviszi a régi aláírást egy új szabályra, és senki nem veszi észre.

---

## Amit a gép ad, és amit nem

**Ad:**

- a 38 szabály katalógusát a normatív maggal
  (`registry/felulet/dontes-szabalyok.json`),
- szabályonként egy **javaslatot** (`javaslat` + `mit`) — hogy az ülés
  áttekintés legyen, ne üres lap,
- azt, hogy **mely szerepek aláírása nélkül** a döntés nem teljes (`kell`):
  a GDPR 9. cikkes szabályokhoz DPO is kell, a labor-referenciákhoz
  laboratóriumi szakorvos,
- munkalapot három alakban: `npm run dontes` konzolon, `npm run xlsx`
  „Döntések" lapján, és szerepekre bontva a
  [`37-dontes-allokacio.md`](37-dontes-allokacio.md)-ban,
- **felelőst** szabályonként (`felelos`): aki a javaslatot az ülésre viszi.
  Nem ő dönt egyedül, de egy felelős nélküli tétel az, ami fél évig senkié —
  a validálás ezért hibát ad rá, és arra is, ha a felelős nem aláírója a
  szabálynak,
- döntés-sablont a mai lenyomattal: `npm run dontes -- --sablon <szabály>`,
- és a kaput: **döntés nélkül semmi nem csúszik át**.

**Nem ad:** az aláírást. A `registry/felulet/dontesek.json` **üresen indul**, és
ez nem hiányosság. A döntést klinikai vezető, DPO és fejlesztés hozza, együtt
ülve — a lépéslista is ezt mondja: *„Nem levelezéssel."*

Ezért a mai állapot őszintén ez:

```
326 döntendő mező 38 szabály mögött; 0 eldöntve (0 szabály),
326 eldöntetlen, 0 elavult, 0 hiányos aláírással.
Eldöntetlenül egy mező sem kerül át.
```

---

## Hogyan születik meg egy döntés

1. `npm run dontes` — a nyitott szabályok, a legtöbb mezőt érintő elöl.
2. `npm run dontes -- --mezok orderTracking` — melyik 29 mezőről van szó.
3. Az ülés dönt. A javaslat elfogadható, elutasítható, átírható.
4. `npm run dontes -- --sablon orderTracking` — kitöltendő sablon, benne a
   **mai lenyomat**. A lenyomatot kézzel kiszámolni nem lehet, és épp ezért nem
   is szabad kézzel beírni.
5. A kitöltött tétel a `registry/felulet/dontesek.json` `dontesek` tömbjébe kerül.
6. `npm run validate` — az ellenőrzés hibát ad, ha a döntés hiányos:
   indoklás nélkül, aláíró nélkül, hibás dátummal, ismeretlen szereppel, vagy
   „átalakítva" úgy, hogy nincs megmondva, **mivé**.

Az „átalakítva vesszük át" a döntésnek csak a fele. A másik fele az, mivé —
enélkül az „átalakítva" annyit tesz, „majd valahogy".

---

## Egy szabály sem csúszhat be döntés nélkül

A `tools/validate.ts` **hibát** ad, ha a felülettérkép olyan szabályt szólaltat
meg, ami nincs a katalógusban. Ez a lényegi kapu: ha holnap valaki új zászlót
vesz fel a `FormField`-be, a validálás megáll, amíg a szabály normatív magja és
javaslata le nem íródik. Nem figyelmeztetés — hiba.

Ugyanígy hiba a fordítottja is (figyelmeztetésként): olyan katalógustétel, ami
egyetlen mezőnél sem szólal meg, elavult szabály.

---

## Hol van a kód

| | |
|---|---|
| döntési réteg | `core/ui/dontes.ts` |
| szabálykatalógus | `registry/felulet/dontes-szabalyok.json` (38 tétel) |
| aláírt döntések | `registry/felulet/dontesek.json` (ma üres) |
| munkalap, sablon | `tools/dontes.ts` — `npm run dontes` |
| táblázatos munkalap | `tools/export/felulet_xlsx.py` „Döntések" lap |
| tesztek | `test/dontes.test.ts` (32) |
| allokáció | `tools/gen-dontes-allokacio.ts` → [`37-dontes-allokacio.md`](37-dontes-allokacio.md) |

---

## Ami továbbra is nyitva van

**Mind a 38 aláírás.** A gépi fele kész, az emberi fele nem kezdődött el — és
ez nem is a gép dolga. A 3. lépés akkor lesz kész, amikor a
`npm run dontes` azt írja ki, hogy 0 eldöntetlen; addig a lépéslistán nyitva
marad.

**A döntés következménye még nem fut le.** Ma a döntés állapota *látszik* (a
mérlegben, a munkalapon, a validálásban), de a mezőket nem a döntésállapot
kapuzza a felületen — a `web/` csontváz továbbra sem használ sem hitelesítést,
sem ezt a réteget. Az `atkerul` mező készen áll erre; a bekötés a felület
következő lépése.
