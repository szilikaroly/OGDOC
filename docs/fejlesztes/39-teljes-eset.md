# 39 — Egy teljes eset végigvitele

*A [13. lépéslista](../13-18-lepes.md) 5. lépése: az első pont, ahol a rendszer
nem részenként, hanem egészben mutatja meg magát — és ahol két csendes hiba
kiderült.*

---

## A feladat, ahogy a lépéslista kimondja

> **Mit.** Egy szintetikus ambuláns eset a felvételtől a generált dokumentumig:
> panasz → státusz → lelet → levezetés → **betegnek szóló szöveg** és
> **klinikusnak szóló teendőlista**.
>
> **Kész, ha.** A `npm run demo` végigmegy, a két kimenet olvasható, és a
> klinikai olvasó azt mondja rá, hogy **ezt aláírná**.

A második felét gépből nem lehet bizonyítani, és nem is szabad megpróbálni: az
két klinikus dolga, akik nem vettek részt a tervezésben. Az elsőt igen — hogy a
demó végigmegy, hogy a két kimenet nem üres, és hogy amit mond, az abból
következik, ami rögzült.

---

## Az eset

36 éves, második terhesség, egy korábbi császármetszés, **30+5 hét**, ambuláns
vizit. A beteg így mondja: *„fáj a fejem és villog a szemem."*

A panaszszótár ebből a `compl.neuro.headache.visual` tételt találja meg, ami
terhességben **vörös zászló**, és megnyitja azt a hat mezőt, ami ide tartozik:
vérnyomás, vizeletfehérje, thrombocyta, AST, kreatinin.

Vérnyomás **158/98**, alsó végtagi oedema, tüdő eltérés nélkül, magzati
szívhang 142/min, vizeletfehérje **++**, labor Thr 168 · AST 41 · Kr 68.

`npm run demo` (magyarul), `npm run demo -- --lang en`.
A korábbi motor-bemutató `npm run demo:motor` alatt maradt meg.

---

## Amit a végigvitel felszínre hozott

### 1. A két kimenet hallgatott a mérésekről

A betegnek szóló szöveg és a klinikusi teendőlista **kizárólag a kódolt
leletekből** (`finding`) épült: 22 változónak van `patientText`-je, 40-nek
`recommends`-a, és mind státusz- vagy vizsgálati mező.

Egy ambuláns szülészeti eseten viszont a legfontosabb tételek **mérések**. A
158/98-as vérnyomásról a beteg egy szót sem olvasott volna, és a teendőlistán
semmi nem állt volna róla — miközben épp ez az, amiért a beteg bejött.

Ezért új réteg: `core/ui/meres.ts`. **Két különböző határ, két különböző súly:**

| | Mi ez | Mi következik belőle |
|---|---|---|
| `domain.critical` | a változó **definíciós** küszöbe | **teendő** — azonnali megítélés |
| `reference` | **kontextusfüggő** normáltartomány, publikált forrásból | **jelzés**, a hitelesítési szintjével együtt |

A kettőt nem szabad összemosni. A 158/98 a terhességi tartományon kívül van, de
a tartomány `assumed` szintű: ebből **jelzés** lesz, nem feladat, és a rendszer
kiírja, hogy a tábla nincs visszaellenőrizve. A 172 Hgmm viszont a definíciós
küszöböt lépi át — abból feladat lesz.

**A harmadik állapot itt is megvan.** Ha a terhességi állapot vagy a
gesztációs kor ismeretlen, a rendszer **nem esik vissza a nem terhes sávra**.
Ez a `ReferenceSet` saját dokumentációjának központi állítása: *„Aki a nem
terhes tartományt olvassa rá egy terhes leletre, hol fölöslegesen riaszt, hol
elenged egy valódi eltérést."*

És egy negyedik különbségtétel, ami menet közben kellett: **a kritikus sávon
belüli érték nem azonos a normálissal.** A pulzusnak nincs
referenciatartománya, csak beavatkozási sávja `[40, 130]`. Egy 125-ös pulzus a
sávon belül van — és attól még nem élettani. A rendszer ezt kimondja, ahelyett
hogy a „sávban" szóval többet állítana, mint amennyit tud.

### 2. Az AST kritikus sávja fordítva állt

A demó első futásán a rendszer egy **41 U/L-es AST-t jelzett KRITIKUSNAK**.

A `domain.critical` az elfogadható sávot adja meg — ezen kívül azonnali
klinikai jelzés. Az AST-nél `[70, null]` állt: eszerint a 70 **alatti** érték a
kritikus. Az ALT-nál helyesen `[null, 70]` van; az AST a tükörképe, és fordítva
került be. A hatás pontosan az ellenkezője a szándéknak:

> a **normális** AST-t jelzi kritikusnak, a **HELLP-tartományút** pedig
> elengedi — a preeclampsia-kivizsgálás egyik döntő enzimjén.

Ez a hiba a legcsendesebb fajta: a mező neve stimmel, a szám is, csak a
jelentés fordul meg. Kijavítva — és ami fontosabb, **a validátor mostantól
megfogja**:

> A kritikus sáv nem zárhatja ki a saját publikált referenciatartományát. Ha
> egy egészében normális tartomány a sávon kívül esik, a pár meg van fordítva.

Az AST referenciatartománya a 3. trimeszterben 4–32 U/L; a `[70, ∞)` sáv ezt
egészében kizárja. **Hiba, nem figyelmeztetés.** A teszt a hibát visszaírva
bizonyítja, hogy a szabály tényleg fog.

### 3. „Nem kérdeztük meg" ≠ „megkérdeztük, nem tudja" — a szűrésnél is

A 4. lépésben a szűrési modul a rögzített „nem tudom" választ `unknown`
állapotba tette — helyesen —, de a változót a `missing` listára írta. A 4.
lépés gerinc-mértéke ezt „még nem kérdeztük meg"-ként olvasta, és a gerincet
hiányosnak mondta olyasmi miatt, amit megkérdeztünk.

A `ScreeningState` mostantól **külön mezőben** tartja a kettőt (`missing` ·
`nemTudja`), mert a teendő más: a hiányzót kérdezni kell, a „nem tudom"-ot nem
érdemes újra.

---

## Mit bizonyít a teszt

`test/eset.test.ts` — 19 teszt:

1. **A demó végigmegy.** Mind a kilenc szakasz megjelenik, a futás nem hasal
   el, és a kimenetben nincs `undefined` vagy `NaN`.
2. **A demó nem ír ki beteg-azonosítót** — sem a születési dátumot, sem
   TAJ-szerű számot, akkor sem, hogy az adat szintetikus.
3. **A két kimenet nem üres**, és csak rögzített leletből születik mondat: a
   nem vizsgált hasi tapintásról egy szó sem áll a beteg példányán.
4. **Minden teendő mellett ott a kiváltó mező**, és a mező létezik.
5. **Hibabevitel:** negatív vizeletfehérjéből nem keletkezik teendő.
6. **A mért érték megítélése** — a kontextusválasztás, az ismeretlen
   kontextus, a küszöb elsőbbsége, a hitelesítetlen jelzés, a sávon belüli
   érték.
7. **Az AST mindkét irányban** — a 41 nem kritikus, a 200 az —, és a
   megfordított sáv a validáláson hibaként bukik el.

---

## Hol van a kód

| | |
|---|---|
| a bemutató | `demo/eset.ts` — `npm run demo` |
| mérésmegítélés | `core/ui/meres.ts` |
| a két kimenet | `core/ui/output.ts` (meglévő) |
| a megfordított sáv kapuja | `core/registry.ts` → `validate()` |
| tesztek | `test/eset.test.ts` (19) |
| a korábbi motor-bemutató | `demo/run.ts` — `npm run demo:motor` |

Új regiszter-tartalom ehhez az esethez: a vérnyomás terhességi
referenciatartománya (ACOG PB222 / NICE NG133, `assumed`) és a vizeletfehérje
gyorsteszt kódonkénti javaslatai.

---

## Ami továbbra is nyitva van

**A klinikai olvasat.** A lépés akkor lesz kész, amikor két klinikus — akik nem
vettek részt a tervezésben — végigolvassa a két kimenetet, és azt mondja rá:
ezt aláírnám. Ezt a gép nem tudja megcsinálni maga helyett.

**A vérnyomás referenciatartománya `assumed`.** A 140/90 küszöb definíciós, de
a táblát a 6. lépés mintája szerint hitelesíteni kell; addig a rendszer jelez,
de nem állapít meg.

**A rendszer nem mond ki diagnózist.** Leletet és küszöböt mutat, a
praeeclampsia kimondása klinikai döntés. Ez nem hiányosság, hanem a
`00-pozicionalas.md` szerinti önkorlátozás.
