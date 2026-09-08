---
source: docs/fejlesztes/35-hbcs-besorolas.md
sha256: c242827f8aca2a18ca756fc11dbef62de92e1f29327a690372785b3ea103b78b
lines: 193
profile: prose
generator: subagent
raw_tokens_est: 2058
verified: 15 confirmed
---

# docs/fejlesztes/35-hbcs-besorolas.md

## Topics
- L1-35: mi hiányzott a finanszírozási modulból, a kinyert tábla számai és forrása
- L36-61: miért szabálykészlet és nem kódtábla, mit nem tartalmaz
- L62-103: a kinyerés vödrös sorszám-egyeztetése és a félreértett nyelvtani alakok
- L104-193: háromállapotú kiértékelés, mutató-blokk hiba, jelöltlista, nyitott munka

## Claims

- [C1] [CONFIRMED] A besorolás korábban hiányzott: a rendszer csoportot nem állapított meg, csak ismert csoport súlyszámát adta @L19 `csoportot nem állapított meg, csak egy ismert csoport súlyszámát adta`
- [C2] [CONFIRMED] A tábla a 10/2012. NEFMI rendelet 2. mellékletéből készült @L24 `(II. 28.) NEFMI rendelet`
- [C3] [CONFIRMED] A kinyert tartalom 26 főcsoport, 773 HBCS-csoport és 39 359 kódhivatkozás @L25 `**26 főcsoport · 773 HBCS-csoport · 39 359 kódhivatkozás**`
- [C4] [CONFIRMED] A tábla hordozza a forrás sha256-át, hogy visszamenőleges elszámolásnál kiderüljön, melyik kiadásból dolgozott @L30 `és a tábla a forrás sha256-át is hordozza`
- [C5] [CONFIRMED] A besorolás szabálykészlet, nem lapos kódtábla, ezért saját betöltőt és kiértékelőt kapott @L51 `Ez szabálykészlet, nem tábla`
- [C6] [CONFIRMED] A kódok megnevezése szándékosan kimaradt, mert a duplikálás 4,5 MB lenne 1,2 helyett @L57 `A duplikálás 4,5 MB lenne 1,2`
- [C7] [CONFIRMED] A kinyerő minden bemeneti sort pontosan egy vödörbe sorol, és eltérő összegnél kilép @L70 `Ha nem egyezik, kilép.`
- [C8] [CONFIRMED] A besorolatlan sorok száma nulla @L84 `| **besorolatlan** | **0** |`
- [C9] [CONFIRMED] Az első futás 477 gazdátlan kódtételt és 417 besorolatlan sort hagyott @L86 `Az első futás 477 gazdátlan kódtételt és 417`
- [C10] [CONFIRMED] A kiértékelés harmadik állapota a „nem értékelhető", elemzetlen szabályra vagy hiányzó adatra @L118 `| **nem értékelhető** | a szabály elemzetlen, vagy hiányzik hozzá adat |`
- [C11] [CONFIRMED] A megítélhetetlen csoport mellé a rendszer szó szerint kiírja a nem értett szabályt @L125 `**szó szerint odaírja a szabályt**`
- [C12] [CONFIRMED] 596/773 csoport, azaz 77% szabálya értékelhető ki géppel @L128 `**596/773 csoport (77%) szabálya értékelhető ki géppel.**`
- [C13] [CONFIRMED] A helyi blokk csak akkor nyer a főcsoport közös listájával szemben, ha tartalma is van @L150 `helyi blokk **csak akkor nyer, ha tartalma is`
- [C14] [CONFIRMED] A besoroló jelölteket ad, a `rankHbcs` elrendez; a végső választás emberé és intézményé @L165 `elrendez, nem dönt; a besoroló jelöl, nem dönt.`
- [C15] [CONFIRMED] A maradék 177 csoport szabálya hátravan, mert időfeltételes és darabszámos adatot kívánna @L182 `**A maradék 177 csoport szabálya.**`
