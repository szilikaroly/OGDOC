# `.memo/` — a tömörített, sorra horgonyzott index

Ez a könyvtár **generált**. Nem kézzel szerkesztendő, és nem is olvasandó végig:
a `INDEX.md` és a memók azért vannak itt, hogy **lekérdezni** lehessen őket.

## Mire való

A `core/` és a `docs/` együtt ~622 000 token nyers anyag. Egy kérdés
megválaszolásához ebből rendszerint néhány állítás kell. A memók ezt az
aszimmetriát váltják ki: fájlonként egy rövid, **állításokra bontott** kivonat,
és minden állítás olyan horgonyt hord, amit gép ellenőrizni tud.

```
memo_query.py --memo-dir .memo "hogyan derül ki a levágott naplóvég"   # ~250 token
memo_query.py --memo-dir .memo --expand core/pilot/horgony.ts:C14      # a forrás, ha kell
```

**Ne `cat`-eld a memókat.** Egy memo elolvasása a teljes hosszát viszi, akkor is,
ha egyetlen állítás számított. A megtakarítás a lekérdezésből jön.

## Mit jelentenek a státuszok

| Státusz | Ki állította be | Hihető? |
|---|---|---|
| `CONFIRMED` | string-match a hivatkozott sorra, vagy izolált ellenőrző | igen |
| `DRIFTED` | a részlet máshol megvan; a horgony javítva | igen — a tény áll, a sor mozdult |
| `REFUTED` | a részlet sehol nincs a forrásban | **nem** — aktívan téves |
| `NEEDS_AGENT` | szemantikus állítás, még nem hitelesítve | még nem |
| `UNSUPPORTED` | ellenőrző nézte, a forrás nem dönti el | nyom, nem tény |
| `STALE` | a forrás `sha256`-ja megváltozott | újragenerálandó |

A `REFUTED` és az `UNSUPPORTED` állítások **szándékosan bennmaradnak**. Annak a
nyoma, hogy a generátor mit értett félre ezen a forráson — és épp ez az, ami
törölve újratermelődne és elhinnék.

## A `sha256` teherhordó

Minden memo fejlécében ott a forrás lenyomata a generálás pillanatában. Ha
kézzel írsz bele, a lenyomat továbbra is „naprakészt" mond, és minden későbbi
futás úgy bízik a szerkesztésedben, mintha a pipeline hitelesítette volna.
Kézi javítás helyett: `memo_gen.py --force`.

## Ami itt nincs

Az `index.db` (a lekérdező adatbázis) származtatott és gitignore-olt.
Újraépítése: `memo_db.py --memo-dir .memo --build`.

## Ennek a futásnak a mérlege

231 memo (`core/**/*.ts` + `docs/**/*.md`), 2815 állítás:
**2725 CONFIRMED (96%), 0 DRIFTED, 0 REFUTED, 90 NEEDS_AGENT.**

A 90 szemantikus állítás **lustán** marad: egyik sem éri el a hasznossági
küszöböt, tehát nem fizetünk olyanok hitelesítéséért, amiket senki nem kérdez le.
Lekérdezéskor alapból nem is jelennek meg (`--include-unproven` kell hozzá).

> **A memo soha nem a forrás helyettesítője, ha SZERKESZTENI készülsz.**
> Kereséshez és döntéshez való; mielőtt egy fájlhoz hozzányúlsz, olvasd el az
> érintett részt.
