---
source: docs/fejlesztes/31-elo-mentes.md
sha256: 232d1dd11655d66cbcce1df8401eedc80438dea17e160603aca833d02b9e5b31
lines: 360
profile: prose
generator: subagent
raw_tokens_est: 3616
verified: 18 confirmed
---

# docs/fejlesztes/31-elo-mentes.md

## Topics
- L1-152: eseménynapló mint rekord, négy szerkezeti döntés, mentési szintek, láncromlások
- L153-204: replikációs lemaradás mérése, pillanatkép-folytonosság, sírkő a tömörítésen át
- L205-232: helyreállítási próba lépései, mért idő, negyedéves ritmus
- L233-360: mért teljesítményszámok, titkosítási elv, hibaforgatókönyvek, kész/hiányzó lista

## Claims

- [C1] [CONFIRMED] Eltérés esetén a napló az irányadó, nem a belőle képzett állapot @L16 `Ha a kettő eltér, **a napló nyer**.`
- [C2] [CONFIRMED] A bejegyzések sorrendjét a monoton `seq` dönti el, a faliórai `at` nem @L40 `monoton, hézagmentes sorszám`
- [C3] [CONFIRMED] Az `append()` cselekvő megadása nélkül kivételt dob @L60 `cselekvő nélkül **dob**`
- [C4] [CONFIRMED] A törlés sírkő-bejegyzés, mert sírkő nélkül a visszajátszás visszahozná a törölt értéket @L79 `sírkő nélkül a törölt érték **feltámadna**`
- [C5] [CONFIRMED] A `verifyChain()` négy külön romlástípust különböztet meg, mert mindegyikhez más teendő tartozik @L105 `**négy különböző** romlást`
- [C6] [CONFIRMED] A „mentve" visszajelzés csak a tartós írás után mehet ki, pufferelt állapotra nem @L149 `a nyugtázás a tartós írás UTÁN megy ki`
- [C7] [CONFIRMED] A `replicationLag()` négy mezőt ad vissza a lemaradásról, köztük az RPO-n belüliséget @L157 `//  → { entriesBehind, secondsBehind, withinRpo, why }`
- [C8] [CONFIRMED] A lemaradást a legrégebbi nyugtázatlan bejegyzéstől mérik, mert fordítva a kiesés kisebbnek látszana @L164 `A lemaradást az ELSŐ nyugtázatlan bejegyzéstől mérjük`
- [C9] [CONFIRMED] A `Snapshot.erased` a pillanatkép része, hogy a tömörítés ne támassza fel a törölt adatot @L196 `ezért a pillanatképnek is része`
- [C10] [CONFIRMED] A rendszer jelenleg egyáltalán nem töröl, mert a megőrzési idők `secondary` szinten állnak @L199 `ezért a rendszer **egyelőre egyáltalán nem töröl**`
- [C11] [CONFIRMED] A `restoreDrill()` először a láncot ellenőrzi, és sérült lánc esetén a többi lépés érdektelen @L216 `**ellenőrzi a láncot** — ha az sérült, a többi nem érdekes;`
- [C12] [CONFIRMED] A próba méri a helyreállítás idejét, és ez az RTO ígérésének egyetlen alapja @L220 `És **méri az időt**.`
- [C13] [CONFIRMED] A helyreállítási próba előírt ritmusa negyedéves, szintetikus eseten @L228 `**Ritmus:** negyedévente, szintetikus esetre, mért idővel.`
- [C14] [CONFIRMED] Egy lenyomatos bejegyzés hozzáfűzésének mért mediánja 0,02 ms @L239 `| **0,02 ms** |`
- [C15] [CONFIRMED] 5000 bejegyzés láncellenőrzése ~40 ms, azaz 5000 SHA-256 @L241 `| **~40 ms** | 5000 SHA-256 |`
- [C16] [CONFIRMED] Az épség ellenőrzése visszafejtés nélkül működik: a lenyomatlánc a titkosított alakon is végigfut @L279 `Megoldás: a lenyomatlánc a **titkosított** alakon is végigvezetve`
- [C17] [CONFIRMED] A modult 26 teszt fedi @L347 `**26 teszt** védi a fentieket.`
- [C18] [CONFIRMED] A mag nem ír lemezre és nem hív hálózatot, csak a helyes bejegyzésről és az épségről dönt @L347 `nem ír lemezre, nem hív`
