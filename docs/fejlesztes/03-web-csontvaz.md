# 03 — A webes csontváz

> **FRISSÍTVE.** A webes réteg 2026-09-05 óta a `core/store/` fölött fut:
> perzisztencia, jogosultság és auditnapló élesben. Ez a dokumentum a
> generikus renderelést és a portolhatóságot írja le; a tárolóra kötést
> a [`40-web-tarolo.md`](40-web-tarolo.md).

```
cd ogdoc && npm run web    →    http://localhost:3000
```

Fut, függőség nélkül, Node 22 natív TypeScript-támogatásával. **47 mezőt renderel,
levezetéssel, validációval, előtöltéssel és kalkulátorokkal** — miközben a felületi
kód egyetlen mezőnevet sem ismer.

## 1. Mit bizonyít

| Állítás | Hogyan látszik |
|---|---|
| Az űrlap a regiszterből generálódik | `app.js` nem tartalmaz mezőnevet, egységet, tartományt, kódlistát |
| A keresztfeltöltés működik | magasság + súly beírása után a BMI **magától megjelenik**, `derived` eredettel |
| A tükör egy adat | a Bishop-kártya tágulat-mezője és a méhszáj-lelet ugyanaz az érték |
| Nincs néma helyettesítés | hiányos bemenetnél a kalkulátor **azt írja ki, mi hiányzik**, nem nullát |
| A kapu tart | a Hadlock teljes UH-biometriával sem ad számot |
| A validáció a regiszterből jön | 500 cm magasság elutasítva: „> megengedett maximum (210)" |
| Az elutasítás nem csendes | az ok megjelenik, **és a mező visszaáll** az utolsó elfogadott értékre |

## 2. Fájlok

| Fájl | Sor | Mi ez | Sorsa |
|---|---:|---|---|
| `web/api.ts` | 130 | **Szállítás-független API.** `write` · `caseView` · `formSpec` · `docFor` | **változatlanul átmegy** a végleges stackre |
| `web/server.ts` | ~250 | Node-`http` kiszolgáló — **mostantól a `core/store/` fölött**, nem memóriában ([`40-web-tarolo.md`](40-web-tarolo.md)) | **eldobandó** |
| `web/public/app.js` | 240 | A generikus renderer | React-komponensre cserélendő, de a logikája marad |
| `web/public/style.css` | 70 | Világos és sötét téma | tervrendszerre cserélendő |
| `web/public/index.html` | 35 | Váz | keretre cserélendő |

Az arány szándékos: **a maradandó rész az `api.ts`**, ami nem tud a szállításról.

## 3. Amit a felület csinál, és amit nem

### Amit igen

- `GET /api/formspec` → szekciónként bejárja a `FieldSpec`-eket, és típus szerint
  vezérlőt választ (`number` · `select` · `tristate` · `checkbox` · `date` · `readonly`);
- a `phi` és a `levezetett` jelölést kiírja, a `hint`-et a mező alá teszi;
- az azonosítóra kattintva megnyitja a **generált** meződokumentációt;
- íráskor felvillantja azokat a mezőket, amiket az írás átszámoltatott (`affected`);
- az előtöltési javaslatot indoklással és forrásmegjelöléssel mutatja, **Elfogadom**
  gombbal — nem tölti ki magától.

### Amit nem

- **Nem validál.** Elküldi az értéket, és a motor válaszát mutatja. Így nincs két,
  idővel szétcsúszó validációs szabály.
- **Nem számol.** A BMI a szerverről jön, nem a böngészőből.
- **Nem dönt a jogosultságról.** A `phi` jelölés megjelenítés; a védelem a szerveren van.

## 4. Amit a csontváz szándékosan nem tartalmaz

| Hiányzik | Mikor jön | Miért nem most |
|---|---|---|
| Perzisztencia | M2 | A `CaseState` sorosítása a tábla-leképezéssel együtt értelmes. |
| Hitelesítés, sorszintű szabályok | M4 | Bérlőmodell nélkül félmegoldás lenne. |
| Auditnapló | M4 | A 25. modul követelménye. |
| Többfelhasználós elkülönítés | M2 | **EGY eset van, globálisan.** |
| Kliensoldali útvonalválasztás | M3 | Egy oldal elég a lánc bizonyításához. |
| Nemzetköziesítés | M3 | A magban megvan (`lang`), a felületen nincs kikapcsolva. |

> **FRISSÍTVE (2026-09-05):** a perzisztencia, a jogosultság és az auditnapló
> azóta ÉLES. Ami maradt: **nincs hitelesítés** — a kiszolgáló ezért
> `OGDOC_SYNTHETIC=1` nélkül el sem indul. Részletek:
> [`40-web-tarolo.md`](40-web-tarolo.md).
>
> **Ezért a csontváz soha nem futhat valódi betegadattal.** Ez a `server.ts`
> fejlécében és az oldal tetején is ki van írva.

## 5. Az út a végleges stackig

| Lépés | Mit kell tenni | Mi marad |
|---:|---|---|
| 1 | `server.ts` → TanStack server functions | `api.ts` érintetlen |
| 2 | `CaseState` → Postgres `values` tábla | `core/` érintetlen |
| 3 | `app.js` → React `FormRenderer` | a `FieldSpec` szerződés érintetlen |
| 4 | sorszintű szabályok + `audit_log` | új réteg az `api.ts` **alatt** |
| 5 | tervrendszer | `style.css` cseréje |

A 3. lépésnél a `FormRenderer` ugyanazt teszi, amit ma az `app.js`: `FieldSpec`-et
fogyaszt. **A vezérlő-választás logikája átemelhető** — csak a DOM-kezelés cserélődik
JSX-re.

## 6. Ellenőrzött viselkedés

Böngészőben (Chromium, Playwright) végigfuttatva:

```
BMI mező (168 cm, 92 kg)         →  32.6                   ✔ magától megjelent
MAP (152/96)                     →  115 mm[Hg] — emelkedett ✔ sávval együtt
Sokk-index (118 / 152)           →  0.78 — normális         ✔
Testfelszín                      →  „hiányzik: anthro.weight.current"  ✔ nem 0
Becsült magzati súly (teljes UH) →  kapu mögött             ✔ nem ad számot
anthro.height = 500              →  elutasítva, a mező visszaállt 168-ra  ✔
JS-hiba a konzolon               →  nincs                   ✔
```
