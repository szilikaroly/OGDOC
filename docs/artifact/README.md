# A bemutató (artifact) forrása

`ogdoc.html` — a publikált OGDOC-bemutató teljes forrása. Eddig csak a
publikált URL mögött létezett; a konténerrel együtt eltűnt volna.

## Amiért itt van, és nem generált

A HTML **kézzel karbantartott**: a szerkezete, a szövege és az ábrái emberi
munkák. A benne szereplő **számok viszont a rendszerről szólnak**, és pontosan
ez a két dolog találkozása okozott már kétszer kárt:

| Mit írt a bemutató | Mi volt az igazság |
|---|---|
| „894 változó a tervezett ~894-ből” | 905 a tervezett ~4035-ből — **22,4%**, nem 100% |
| „51 tétel a hiányjegyzékben” | 73 — a gyűjtés két helyen volt leírva, és szétcsúszott |

Mindkettő ugyanaz: **egy szám, amit senki nem ellenőriz, elcsúszik.**

## A szerződés

Ha a bemutató **élő számot** állít, jelölje meg:

```html
<b data-szam="valtozo">905</b> változó a regiszterben
```

A `npm run artifact:check` (része a `npm run check`-nek) kiolvassa a jelölt
számokat, összeveti a `tools/gen-artifact.ts` kimenetével és a tesztfuttatással,
és **build-hibát ad**, ha eltérnek. A záró sor kimondja, **hányat** ellenőrzött:
a „0 eltérés” önmagában nem elég állítás, mert nulla megjelölt szám mellett is
nulla az eltérés.

Amit nem jelölnek meg, arra az ellenőrzés **nem terjed ki**. Ez tudatos: a
prózában szereplő magyarázó számokat (pl. „38 mWHO-állapot”) nem éri meg
mind bekötni — de aki élő rendszerszámot ír le, az jelölje.

## Frissítés

1. `ogdoc.html` szerkesztése;
2. `npm run artifact:check` — megmondja, mely számok csúsztak el;
3. publikálás ugyanarra az URL-re.

A publikált változatot a megosztási tű mozgatása teszi láthatóvá a nézőknek —
ez a tulajdonos dolga, nem a build-é.
