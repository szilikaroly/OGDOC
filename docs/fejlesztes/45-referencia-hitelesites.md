# 45 — A harminckét referencia hitelesítése

*A 6. lépés gépi fele — és a sáv, ami soha nem szólalt meg.*

Harminckét változónak van referenciatartománya, **mind a harminckettő
`assumed`**: a számok egy táblából származnak, de senki nem vetette össze
őket az elsődleges közleménnyel. Ez ma 130 szám, ami összevetésre vár.

**Miért számít.** Egy 180 U/L alkalikus foszfatáz a 3. trimeszterben
normális, nem terhesen emelkedett. Rossz referenciával a rendszer vagy
riogat, vagy megnyugtat — és a kettő közül **a második a veszélyesebb**.

---

## Amit a gép megtalált: két sáv, ami soha nem szólalt meg

A hitelesítés előkészítése közben derült ki, hogy két referenciasáv
`postpartum` kontextusra volt írva — a futásidejű feloldó viszont **ezt a
kontextust soha nem adta vissza.** Csak `nonpregnant`-ot, `pregnancy.t1/t2/t3`-at
és `null`-t.

Ez a legcsendesebb hibafajta, ami egy táblában előfordulhat:

> Nincs hibaüzenet. Nincs hiányjelzés. A tábla teljesnek látszik, a sáv ott
> van a JSON-ban — és a beteg a **másik** sávot kapja.

A két érintett sáv vérnyomás volt, ahol a küszöb történetesen ugyanaz
(≥140/90), tehát klinikai kára ma nem volt. De a szerkezet csapda: aki
legközelebb gyermekágyra jellemző értéket ír be, azt a rendszer **némán soha
nem használná.**

### Két lépésben javítva

**1. A gyermekágy valódi kontextus lett.** A feloldó a szülés utáni 42 napig
`postpartum`-ot ad — és ez az ág **megelőzi** a terhességi állapotot, mert a
szülés után a `ctx.pregnant` már `neg`, tehát a puszta „nem terhes" ág a
gyermekágyas beteget a nem terhes sávra küldené. A thrombocytaszám, a
fibrinogén és az alkalikus foszfatáz viszont hetekig tart, amíg visszaáll —
a nem terhes tartományon kívül, anélkül hogy bármi baj lenne.

**2. Az elérhetetlen sáv build-hiba lett.** A kontextusok listája
(`REFERENCIA_KONTEXTUSOK`) egy helyen áll, a feloldó abból ad vissza, a
validálás azt veti össze a regiszterrel. Egy elgépelt vagy kitalált kontextus
mostantól megáll a buildben, nem a betegnél.

---

## Az aláírás ahhoz kötődik, amit aláírtak

Ugyanaz a szerkezet, mint a 3. lépés döntéseinél, más tárggyal. Az aláírás a
referencia **normatív magját** fedi:

```
lenyeg(d) = id | egység | (kontextus = alsó..felső) …
```

| Ha ez változik | Az aláírás |
|---|---|
| egy **határérték** | **elavul** |
| az **egység** | **elavul** |
| a megjegyzés, a forrás idézete, a címke | **érvényes marad** |

A megkülönböztetés nem formalitás. Ha minden szerkesztés elavulttá tenné az
aláírást, senki nem javítana ki egy elírást. Ha semmi nem tenné azzá, a
számok csendben elcsúsznának az aláírás alól. Az aláíró **azokra a számokra**
mondta ki, hogy helyesek.

Az egység külön is szerepel, mert az a leggyakoribb néma hiba: a tábla
mg/dL-ben, a rendszer mmol/L-ben — a szám ilyenkor is „hihető".

---

## A kaput aláírás nyitja, nem jelölés

Ez a réteg lényege, és egy sorban összefoglalható:

> **`verification: "primary"` a regiszterben, hitelesítés nélkül → build-hiba.**

Az emelés az `alkalmaz()` dolga, ami futásidőben, az aláírásokból emeli
`primary`-re a hitelesített tételeket. A JSON-ban kézzel átírt „primary"
pontosan az a mozdulat, ami a kaput **felelős nélkül** nyitná ki — és amit
egy sietős pénteken bárki megtenne.

Elavult aláírással sem emelkedik semmi: `alkalmaz()` nullát ad vissza, és a
tétel `assumed` marad.

---

## A munkalap

```
npm run labref
```

**Forrásonként** sorol, nem változónként — mert az összevetés így megy: egy
tábla kézbe, végig a sorain. Változónként ugrálni két forrás között az a
munkaszervezés, amitől a feladat fél éve áll.

Minden tétel mellett ott a **lenyomat**, ami az aláírásba másolandó — ez köti
az aláírást azokhoz a számokhoz, amelyeket az aláíró látott.

A munkalap öt kérdést tesz fel minden tételnél:

| Kérdés | Miért |
|---|---|
| ugyanaz az **egység**? | a leggyakoribb néma hiba |
| ugyanott vannak a **trimeszterhatárok**? | a rendszer 14. és 28. hétnél vált |
| szándékosak az **azonos trimeszterek**? | vagy nincs változás, vagy egy sort másoltak négyszer |
| külön sáv-e a **gyermekágy**? | a rendszer 42 napig `postpartum`-ot ad |
| melyik **populációra** vonatkozik a tábla? | ez a hitelesítés HATÁRA |

Az utolsó a legfontosabb, és a legkevésbé megkerülhető: egy referenciatartomány
populációhoz tartozik. Egy nem magyar populáción készült tábla hitelesítése
nem teszi magyarrá — ezt az aláíró a `megjegyzes` mezőben mondja ki.

---

## Ami ebből a lépésből NEM lett kész

**Egyetlen szám sincs hitelesítve, és ez nem hiányosság: ez a lépés lényege.**
A hitelesítés nem fejlesztői munka. 130 szám vár egy laboratóriumi szakorvos
összevetésére, és a gép ehhez munkalapot ad, lenyomatot ad, és megakadályozza,
hogy aláírás nélkül bármi átcsússzon.

A 32-ből 30 ugyanabból a forrásból való (Abbassi-Ghanavati 2009) — ez egy
ülés, egy tábla, egy aláíró. A maradék kettő a vérnyomásküszöb (ACOG/NICE),
és az szülész-nőgyógyász aláírását kívánja, nem laboratóriumit.

| Fájl | Mi ez |
|---|---|
| `core/lab/hitelesites.ts` | lenyomat · állapot · `alkalmaz()` · validálás |
| `registry/labor/referencia-hitelesitesek.json` | **szándékosan üres** |
| `tools/gen-labref.ts` | a munkalap (`npm run labref`) |
| `test/referencia-hitelesites.test.ts` | 15 teszt |
