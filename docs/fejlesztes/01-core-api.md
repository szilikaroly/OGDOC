# 01 — A mag fejlesztői dokumentációja

A mag **DOM-mentes és adatbázis-mentes**: tiszta függvények, amelyek paraméterként
kapnak mindent. Ezért fut Node-ban teszt alatt, böngészőben a felület alatt, és
Workerben a szerveren — változtatás nélkül.

```
core/
  types.ts              a szótár: VariableDef, Value, CaseState, ScoreResult
  registry.ts           betöltés, indexelés, integritás-ellenőrzés
  load.ts               az EGYETLEN hely, ahol I/O történik
  calc/
    types.ts            CalcDef — egy képlet gépi olvasható leírása
    defs.ts             MINDEN képlet, egy példányban
    run.ts              a futtató és a két kapu
  derive/
    resolve.ts          melyik a legjobb érvényes érték
    graph.ts            levezetési gráf: kör, sorrend, hatásvizsgálat
    engine.ts           írás, előtöltés, újraszámítás
    fns.ts              segédek (képlet itt NINCS)
  ui/
    formspec.ts         regiszter → űrlapleírás és meződokumentáció
  scores/
    fullpiers.ts        örökölt score, kapu mögött
```

**Rétegzés** (a nyilak lefelé mutatnak, kör nincs):

```
types  ←  calc/types  ←  calc/defs  ←  registry  ←  derive/resolve  ←  calc/run  ←  derive/engine
                                            ↖ derive/graph  ↖ ui/formspec
```

Ez a sorrend nem stílus kérdése: a `calc/run` a `resolve`-ra épül, a `derive/engine`
pedig a `calc/run`-ra. Ha a `calc/run` az `engine`-ből importálna, körkörös lenne —
ezért van a `resolve` külön fájlban.

---

## 1. A szótár — `core/types.ts`

### 1.1 `VariableDef` — egy változó teljes definíciója

Ez a rendszer legfontosabb típusa. **Minden mező innen származik.**

| Mező | Típus | Kötelező | Mit jelent |
|---|---|:--:|---|
| `id` | `string` | ✔ | Pontokkal tagolt, stabil azonosító. Soha nem változik. |
| `version` | `number` | ✔ | A definíció verziója. Jelentésváltozáskor nő. |
| `status` | `draft` \| `seed-imported` \| `active` \| `deprecated` \| `superseded` | ✔ | Csak az `active` renderelhető új űrlapra. |
| `aliasOf` | `string` | | Ha kitöltött: **tükör**. Az érték a primerben él, itt nincs saját tároló. |
| `label` | `I18n` | ✔ | Megjelenő név nyelvenként. |
| `module` | `string` | ✔ | Melyik modul tulajdonolja. Ez adja az űrlapszekciót. |
| `shownIn` | `string[]` | | További helyek, ahol megjelenik (a tulajdonoson kívül). |
| `datatype` | ld. lent | ✔ | Ez dönti el a vezérlőt és a validációt. |
| `unit` | `string` | ✱ | UCUM-kód. `quantity`-nál gyakorlatilag kötelező. |
| `domain` | `Domain` | | `min`/`max` (elutasítás), `plausible` (visszakérdezés), `critical` (jelzés). |
| `valueSet` | `ValueSetItem[]` | ✱ | `coded` és `coded-multi` esetén **kötelező**. |
| `cardinality` | `one` \| `series` \| `event` | | `series`: időben ismétlődik (vitálisok). |
| `validity` | `Record<encounter, ISO8601>` | | Kontextusonkénti érvényességi ablak. |
| `provenanceAllowed` | `Provenance[]` | | Ki írhatja. Pl. eszközadatot ember nem hamisíthat felül. |
| `derivation` | `Derivation` | | `computed` vagy `prefill`. Tükörnek **nem lehet**. |
| `consumers` | `string[]` | | **GENERÁLT.** Kézzel kitöltve build-figyelmeztetés. |
| `documentation` | objektum | ✔ | `definition` kötelező; `howToMeasure`, `pitfalls`, `whyItMatters` opcionális. |
| `standards` | objektum | | LOINC, SNOMED, ICHOM, EESZT, FHIR. |
| `evidence` | tömb | | Hivatkozás, DOI, PMID. |
| `phi` | `boolean` | | Beteg-azonosításra alkalmas. Exportból és lekérdezőből kimarad. |
| `audit` | `boolean` | | Minden olvasása naplózandó. |

### 1.2 `DataType` — kilenc típus, kilenc viselkedés

| Típus | Vezérlő | Validáció írásnál | Megjegyzés |
|---|---|---|---|
| `quantity` | szám | `domain.min`/`max`, véges szám | Egység nélkül build-figyelmeztetés. |
| `coded` | legördülő | a kódnak a `valueSet`-ben kell lennie | `valueSet` kötelező. |
| `coded-multi` | többszörös | ugyanaz, elemenként | |
| `bool` | jelölőnégyzet | logikai érték | Csak ott, ahol a „nem tudom" értelmetlen. |
| `tristate` | három állapot | a `valueSet` kódjai (`pos`/`neg`/`unk`) | **A „nem tudom" önálló érték, nem hiányzó adat.** |
| `date` | dátum | parse-olható | Számításnál epoch-ezredmásodpercre konvertálódik. |
| `datetime` | dátum-idő | parse-olható | |
| `text` | szöveg | — | Ld. `06-freetext-feloldas.md`: itt a cél a minimalizálás. |
| `structured` | sablon | típusfüggő | Összetett, de ismételhető szerkezet. |

> **A `tristate` a rendszer egyik legfontosabb részlete.** Az „asztmás?" kérdésre a
> „nem tudom" **információ**: azt mondja, hogy megkérdeztük és nem derült ki. Ez nem
> ugyanaz, mint hogy nem kérdeztük meg. A `bool` ezt a különbséget elveszíti, ezért
> anamnesztikus kérdésnél `bool` használata hiba.

### 1.3 `Value` — egy rögzített érték a burkával

```ts
interface Value<T> {
  value: T;
  unit?: string | null;
  t: string;              // mikor VONATKOZIK rá — nem mikor beírták
  recordedAt?: string;    // mikor írták be
  provenance: Provenance;
  confidence?: Confidence;
  sourceRef?: string | null;
  overridden?: boolean;
}
```

**A `t` és a `recordedAt` különbsége nem formalitás.** Egy tegnapi vérnyomás, amit
ma írnak be, tegnapi értékként avul el — nem maiként. Ha ezt összemossuk, a lejárt
adat frissnek látszik, és a score számolni fog belőle.

### 1.4 `Provenance` — a precedencia rangsora

| Rang | Érték | Mikor |
|---:|---|---|
| 6 | `clinician` | Klinikus rögzítette. |
| 5 | `device` | Eszközből jött (monitor, POCT, DICOM SR). |
| 4 | `imported` | Külső rendszerből (HIS, EESZT, labor). |
| 3 | `derived` | A rendszer számolta. |
| 2 | `prefilled` | Elfogadott előtöltési javaslat. |
| 1 | `patient` | A beteg adta meg (kérdőív, portál). |

Ha egy változóra több érték van, a `resolve` **először a rangot** nézi, és csak
azonos rangnál a frissességet. Ezért nem tud egy régi eszközadat felülírni egy
friss klinikusi korrekciót — de egy friss klinikusi érték felülír egy régit.

### 1.5 `ScoreResult` — a legfontosabb visszatérési típus

```ts
type ScoreResult = ScoreOk | ScoreInsufficient;

interface ScoreInsufficient {
  status: "insufficient";
  missing: string[];       // MELY változók hiányoznak
  reason: string;          // emberi olvasatú indoklás
  inputs: Record<string, unknown>;   // a pillanatkép, amiből dolgozott
}
```

Nincs `number | null` visszatérés, és nincs `0` alapértelmezés. Aki eredményt akar,
kénytelen a `status`-t megnézni — a típusrendszer nem engedi másképp.

---

## 2. `Registry` — `core/registry.ts`

| Metódus | Mit ad | Dobhat |
|---|---|---|
| `get(id)` | A definíció, vagy `undefined`. | — |
| `resolvePrimary(id)` | A tükörlánc végén álló primer azonosító. | körkörös `aliasOf` |
| `computedInputs(id)` | Egy `computed` változó bemenetei — **a kalkulátorból**, nem a regiszterből. | — |
| `all()` | Minden definíció. | — |
| `validate()` | `RegistryIssue[]` — a build ezen áll vagy bukik. | duplikált `id` a konstruktorban |

### 2.1 Amit a `validate()` kifog

| # | Ellenőrzés | Súly |
|---:|---|---|
| 1 | `aliasOf` ismeretlen változóra mutat | hiba |
| 2 | `derivation.calc` ismeretlen kalkulátorra mutat | hiba |
| 3 | a kalkulátor bemenete nincs a regiszterben | hiba |
| 4 | egység-eltérés a változó és a kalkulátor eredménye között | hiba |
| 5 | `prefill` forrása ismeretlen | hiba |
| 6 | tükörnek saját `derivation`-je van | hiba |
| 7 | `coded`/`coded-multi` `valueSet` nélkül | hiba |
| 8 | hiányzó definíció a dokumentációban | hiba |
| 9 | **két primer változó ugyanarra a LOINC-kódra, `aliasOf` nélkül** | hiba |
| 10 | `consumers` kézzel kitöltve | figyelmeztetés |
| 11 | `quantity` egység nélkül | figyelmeztetés |

A 9. az örökölt rendszer konkrét hibája: a v16-ban a méhszáj-tágulat **három
helyen** szerepelt önálló mezőként. Három mező, három érték, egy méhszáj. A
szabály most build-hiba, nem kódszemle-kérdés.

---

## 3. Kalkulátorok — `core/calc/`

### 3.1 `CalcDef` — amit egy képletnek deklarálnia kell

| Mező | Kötelező | Miért |
|---|:--:|---|
| `id` | ✔ | `calc.` előtaggal. **Egy azonosítóhoz egy képlet** — a `registerCalc` nem enged felülírást. |
| `label`, `module`, `kind` | ✔ | `formula` · `score` · `classification` · `target`. |
| `inputs` | ✔ | Változó-azonosító, várt egység, kötelezőség. **Ez az egyetlen bemenetlista.** |
| `output.unit`, `digits`, `bands` | | A sáv adja a szám melletti klinikai olvasatot. |
| `formula` | ✔ | Emberi olvasatú képlet — ez kerül a doksiba. |
| `source.cite` | ✔ | **Az elsődleges forrás**, amivel a konstansokat össze kell vetni. |
| `verified` | ✔ | `true` csak akkor, ha valaki ténylegesen összevetette. |
| `verifiedNote` | ✱ | Kapuzottnál kötelező: *miért* nincs még ellenőrizve. |
| `caveats` | | Amit a felhasználónak tudnia kell az értelmezéshez. |
| `fn` | ✔ | Tiszta függvény. Hiányzó bemenetet **nem lát** — a futtató kiszűrte. |

### 3.2 `runCalc(reg, state, calcId)` — a négy lépés

```
1. bemenetek begyűjtése        resolve() minden bemenetre
   ├─ a LEJÁRT érték ugyanúgy hiányzik, mint a nem létező
   └─ dátum → epoch-ezredmásodperc
   ↓  ha bármi hiányzik → insufficient { missing: [...] }

2. a verifikációs kapu         !def.verified → insufficient
   ↓  teljes bemenettel is

3. a számítás                  def.fn(...args)
   ↓  null vagy nem véges → insufficient

4. sávba sorolás               band + severity
   → { status: "ok", value, unit, band }
```

A sorrend lényeges: **a kapu a számítás előtt van.** Így egy ellenőrizetlen képlet
soha nem termel értéket, amit valaki később naplóból visszakereshetne.

### 3.3 `validateCalculators(reg)` — két szigorúság

- A regiszter által **használt** kalkulátorokra: minden bemenet létezik, és az
  **egységek pontosan egyeznek**. Az egység-eltérés némán rossz eredményt ad —
  ezért hiba, nem figyelmeztetés.
- Minden regisztrált kalkulátorra, regisztertől függetlenül: van elsődleges forrás,
  emberi olvasatú képlet, és kapuzottnál indoklás.
- A be nem kötött kalkulátor **figyelmeztetést** kap: holt kód, ami észrevétlenül elavul.

### 3.4 Bővítés — `registerCalc(def)`

Egy modulcsomag a saját képleteit ezzel teszi elérhetővé, a mag módosítása nélkül.
A szabályok ugyanazok, és **felülírás nincs**: két modul nem adhat csendben eltérő
eredményt ugyanarra a fogalomra. Új változathoz új azonosító kell (pl. verziószámmal).

---

## 4. Levezetés — `core/derive/`

### 4.1 A három mechanizmus, amit sosem mosunk össze

| | `computed` | `prefill` | `mirror` (`aliasOf`) |
|---|---|---|---|
| **Mi ez** | levezetett érték | **javaslat** | ugyanaz az adat, más helyen |
| **Szerkeszthető** | nem | igen, felülírható | igen, a primeren keresztül |
| **Eredet** | `derived` | `prefilled` | az eredetié |
| **Saját tároló** | van | van | **nincs** |
| **Írás rá** | hiba, a bemenetre irányítja | rendes írás | a primerhez kerül |
| **Hiányzó bemenetnél** | a mező eltűnik | nincs javaslat | — |

A különbség klinikai, nem technikai. A `computed` a rendszer állítása; a `prefill`
egy **kérdés**, amire a klinikus válaszol; a `mirror` pedig annak a beismerése, hogy
ugyanaz az adat két munkafolyamatban is kell — de akkor is *egy* adat.

### 4.2 `resolve(reg, state, id)` — a legjobb érvényes érték

```
tükör feloldása → a primer értékei
  ├─ nincs érték              → { state: "missing" }
  ├─ rendezés: provenance rang, azonos rangnál frissesség
  └─ érvényességi ablak a KONTEXTUSHOZ (ambulatory / labour / …)
        ├─ belül  → { state: "ok" }
        └─ kívül  → { state: "stale", ageMs }
```

A `usable()` a `stale`-t is `null`-nak veszi. **Ez a helyes alapértelmezés**: egy
lejárt érték nem „valamennyire jó", hanem nem bemenet.

### 4.3 `setValue(reg, state, id, value, opts)` — az egyetlen írási út

Négy dolgot garantál, amit a hívó nem tud elrontani:

1. **tükör feloldása** — az alias-azonosítóra írt érték a primerhez kerül, de a
   `sourceRef` megőrzi, *hol* írták be;
2. **levezetett mező védelme** — `computed`-re írni hiba, és a hibaüzenet megmondja,
   melyik bemenetet kell helyette írni;
3. **tartomány és kódkészlet** — a `domain.min`/`max` és a `valueSet` a regiszterből,
   nem a motorból (ez konkrét hiba volt: a validátor kezdetben saját `yes`/`no`
   kódokat feltételezett a regiszterbeli `pos`/`neg` helyett);
4. **nem mutál** — új `CaseState`-tel tér vissza.

Az elutasítás kivétel, nem néma javítás. A webes rétegben ez `{ ok: false, error }`
alakban jut a felületre, ami megmutatja az okot **és visszaállítja a mezőt** az
utoljára elfogadott értékre.

### 4.4 `suggestPrefills(reg, state)` — javaslat, nem tény

| `policy` | Mit csinál |
|---|---|
| `carryForward` | Átveszi a korábbi vizitről, `maxAge`-en belül. |
| `latest` | A forrásváltozó legfrissebb értékét. |
| `implies` | **Kapu**: ha a forrás igaz, beállít egy szabályértéket. |
| `mostReliable` | A legmagasabb precedenciájú forrást. |

Nem ír a `values`-ba. Amire már van közvetlenül rögzített érték, arra nem javasol.
Az `implies` csak `true`-ra vagy `"pos"`-ra tüzel — **`"unk"`-ra nem**: a „nem tudom"
nem elég egy hard-stop kapu meghúzásához.

### 4.5 `recompute(reg, state)` — topologikus újraszámítás

Minden `computed` változó újraszámolása a levezetési gráf sorrendjében. Két részlet:

- **a `ctx.now` betöltése minden futás elején** — a számítások vonatkoztatási pontja
  a kontextusból jön, nem kézi bevitelből, és így a tesztek determinisztikusak;
- **hiányzó bemenetnél `delete`, nem `0`** — a mező eltűnik, mert a hiányzó adat
  hiányzik, nem nulla.

A számítást a `runCalc` végzi, tehát a két kapu itt is érvényes: **kapuzott
kalkulátorból nem születhet levezetett érték a rekordban.**

### 4.6 `DerivationGraph`

| Metódus | Mit ad | Hol használjuk |
|---|---|---|
| `sourcesOf(id)` | Mi tölti fel. | meződokumentáció |
| `consumersOf(id)` | Mit tölt fel. | meződokumentáció, **generált `consumers`** |
| `impactOf(id)` | Minden közvetve érintett. | a 25. modul szerkesztője, felület-villantás |
| `topologicalOrder()` | Számítási sorrend. | `recompute` |

`topologicalOrder()` **kivételt dob körre**, és felsorolja a kör tagjait. A build
ezen elszáll — nem a felhasználó találkozik vele egy végtelen ciklus formájában.

---

## 5. Űrlap és dokumentáció — `core/ui/formspec.ts`

`buildFormSpec(reg, lang)` modulonként csoportosított `FieldSpec[]`-et ad:

- a **tükrök kimaradnak** (nem önálló mező),
- a `computed` → `readonly`, a képlet magyarázatával,
- a `tristate` opciói hordozzák az `unknown` jelölést,
- a `phi` külön jelölést kap.

`fieldDoc(reg, id, lang)` a mező teljes dokumentációját adja, benne a **generált**
`⇦ FELTÖLTI` / `⇨ EZT TÖLTI` listákkal és a hatásvizsgálat számával. Kézzel írt
meződokumentáció nincs, mert az fél éven belül hazudna.

---

## 6. Bővítési pontok

| # | Pont | Hogyan | Mit NEM szabad |
|---:|---|---|---|
| 1 | **Új változó** | JSON a `registry/variables/` alatt | kódot írni hozzá |
| 2 | **Új képlet** | `registerCalc(def)` | meglévő azonosítót felülírni |
| 3 | **Új levezetési mód** | `Derivation` unió bővítése + `recompute` ág | a három meglévőt összemosni |
| 4 | **Új adattípus** | `DataType` + `CONTROL` + `violates()` | validáció nélkül hagyni |
| 5 | **Új renderer** | a `FieldSpec`-et fogyasztja | a regisztert megkerülve mezőt írni |
| 6 | **Perzisztencia** | a `CaseState` sorosítása | a `Value` burkát elhagyni |
| 7 | **Export** | `VariableDef.standards` leképezése | `phi` mezőt exportálni |

### 6.1 Amit egy bővítés soha nem tehet meg

- **Nem írhat a `values`-ba a `setValue` megkerülésével.** Ott van a négy garancia.
- **Nem számolhat a `runCalc` megkerülésével.** Ott van a két kapu.
- **Nem vehet fel képletet `source.cite` nélkül.** A `registerCalc` elutasítja.
- **Nem tölthet ki `consumers`-t.** Generált mező; kézzel kitöltve build-figyelmeztetés.

---

## 6/b. Az újabb egységek — napló, titkosítás, naplózás, interfész

*Ezek a `31`, `32`, `30` és `08` fejezetekben vannak kifejtve; itt a
FÜGGVÉNYSZINTŰ áttekintés, hogy a hívó tudja, mi hol van.*

### `core/journal/` — az írási napló

| Függvény | Mit ad | Mit NEM csinál |
|---|---|---|
| `append(log, input)` | új bejegyzés lenyomattal, ÚJ tömbben | nem ír lemezre |
| `verifyChain(log, from?)` | `ok` · `tampered` · `gap` · `reordered` · `brokenLink` | nem javít |
| `replay(log, upToSeq?)` | `CaseState` + a sírkövek | **nem ellenőrzi a láncot** — az külön lépés |
| `snapshot(log, at, upTo?)` | pillanatkép, sírkövekkel | nem tömörít önállóan |
| `checkContinuation(snap, tail)` | illeszkedik-e a folytatás | — |
| `restoreDrill(log, expected)` | a próba eredménye **mért idővel** | nem állít helyre élesben |

**A `replay()` szándékosan nem ellenőrzi a láncot.** A hívónak kell eldöntenie,
mit tesz egy sérült naplóval — a mag ezt nem döntheti el helyette.

### `core/crypto/` — a boríték

| Függvény | Mit ad |
|---|---|
| `seal(plain, dek, keyId, aad)` | AEAD-rekord, a kötéssel hitelesítve |
| `open(sealed, dek, key, expect)` | `admit` vagy **megnevezett bukás**: `wrongKey` · `tampered` · `relocated` · `destroyed` |
| `wrapDek` / `unwrapDek` | a DEK burkolása KEK-kel |
| `cryptoErase(key, order)` | **nem mond igent, amíg egy kulcsmásolat is él** |
| `checkKeyPolicy(p)` | a letét három hibája |
| `checkMigration(m)` | a lánc-újrakötés érvényessége |

### `core/log/` — a naplózási szerződés

| Függvény | Mit ad |
|---|---|
| `auditRedaction(reg, e)` | **megnevezi** a szivárgást a működési naplóban — nem javítja |
| `checkAudit(e)` | ki · mit · min · **miért**; és az elutasítás oka |
| `memorySink()` | teszthez; sehova nem ír |

### `core/interop/` — a határ

| Függvény | Mit ad |
|---|---|
| `matchPatient(claim, known)` | `match` · `review` · `noMatch` — **a név nem független azonosító** |
| `admitResult(reg, r, opts)` | négy kapu: azonosság · fogalom · egység · QC |
| `queueReport(held, now)` | a megállított leletek **kora** |
| `planRetry(entry, now)` | `send` · `wait` · **`escalate`** — a sorozat vége ember |
| `outboxHealth(entries, now)` | a beragadt **klinikai** üzenet külön |

### `core/szepszis/` — folyamat, nem szám

| Függvény | Mit ad |
|---|---|
| `assess(reg, state, p, circ, source?)` | a háromlépéses út állapota; `source: null` = **a kérdés még nem hangzott el** |
| `bundleStatus(p, at, events, now)` | az órához kötött csomag + a **sorrendi** eltérés |
| `alertStatus(p, issued, ack, now)` | „kiadva" ≠ „átvéve" |

---

## 7. Tesztelés

`npm test` — **40 golden teszt** tizenegy csoportban. A tesztek a *szabályokra*
irányulnak, nem a mezőkre: egy új változó felvétele nem igényel új tesztet, egy új
*szabály* igen.

| Csoport | Mit rögzít |
|---|---|
| 1 | regiszter-integritás, körellenőrzés, generált `consumers`, hatásvizsgálat |
| 2 | kézzel ellenőrzött számértékek |
| 3 | **nincs néma helyettesítés** |
| 4 | tükör-azonosság és kizárás az űrlapleírásból |
| 5 | előtöltés `maxAge`-en belül és túl, az `implies` kapu, és hogy `"unk"` nem tüzel |
| 6 | precedencia és kontextusfüggő elavulás |
| 7 | fullPIERS: hiányzó AST, lejárt SpO₂, ellenőrizetlen együtthatók |
| 8 | **a fordított együtthatók bizonyítéka** |
| 9 | az írási út: alias, tartomány, kódkészlet, immutabilitás |
| 10 | végponttól végpontig egy szintetikus eset |
| 11 | a kalkulátor-réteg: egységek, kapuk, kézzel ellenőrzött értékek |

### 7.1 Amit a tesztek szándékosan NEM fednek le

- **Teljesítmény.** A `recompute` minden hívásnál újraépíti a gráfot. 47 változónál
  ez mérhetetlen; ~4000-nél profilozni kell (ld. `09-bovitesi-lehetosegek.md`).
- **Egyidejűség.** Egyszálú, egy eset. A többfelhasználós írás az M2 kérdése.
- **Klinikai helyesség.** A golden tesztek azt bizonyítják, hogy a kód azt csinálja,
  amit a definíció mond. Hogy a *definíció* helyes-e, azt referencia-fixture-ök és
  klinikai átvétel dönti el — a fullPIERS pontosan ezen bukott el.
