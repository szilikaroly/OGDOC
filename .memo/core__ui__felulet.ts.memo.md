---
source: core/ui/felulet.ts
sha256: 4526917ace12fcdb82550d23921a6de1caa0e07f68a2a8ed7bbd81ce1dc2cdbb
lines: 884
profile: code
generator: subagent
raw_tokens_est: 9324
verified: 37 confirmed, 4 needs_agent
---

# core/ui/felulet.ts

## Topics
- L1-31: mire való a felülettérkép, a menüpont típusa
- L32-177: a mezőzászlók teljes készlete, az adatlap- és térképtípus, betöltés
- L178-193: a modulonkénti lefedettség típusa és a regiszterből származó leképezés indoklása
- L194-247: a lefedettség kiszámítása és a mezőaudit eredménytípusa
- L248-407: a mezőaudit első ága — különleges adat, egységduplikátum, interfész, számítási kapuk
- L408-567: gyanús címke és értékkészlet, keresztfeltöltés, kompetencia- és kontraindikáció-kapuk
- L568-727: alany- és egységproblémák, leletkintlévőség, bizonytalan jelentőség, kézi végösszeg
- L728-832: sikertelen kísérlet, mintaalkalmasság, levezetett és leképezett mezők, az összegző mondat
- L833-884: a felülettérkép integritás-ellenőrzése

## Claims

- [C1] [NEEDS_AGENT] A térkép két dolgot állít elő: szakaszonkénti lefedettséget és figyelmeztetést arról, mi nem vehető át változatlanul @semantic L6-14
- [C2] [NEEDS_AGENT] A mezőnév és a változóazonosító párosítása emberi döntés, nem karakterlánc-hasonlóság @semantic L16-18
- [C3] [CONFIRMED] A menüpont modulja lehet üres, ha egyetlen modulhoz sem tartozik @L29 `module: number | null;`
- [C4] [NEEDS_AGENT] A mezőleírás sok tucat logikai zászlót hordoz, és mindegyik egy-egy átvételi szabályt kódol @semantic L32-148
- [C5] [CONFIRMED] A `special` zászló a GDPR 9. cikk szerinti különleges adatot nevezi meg @L41 `special?: string;`
- [C6] [CONFIRMED] A visszafordíthatatlan beavatkozás külön zászlót kap, mert a kapunak a lépés előtt kell zárnia @L107 `irreversible?: boolean;`
- [C7] [CONFIRMED] A térkép lefedettsége teljes vagy részleges lehet @L163 `coverage: "full" | "partial";`
- [C8] [CONFIRMED] A modulszám és a regiszterbeli modulnevek megfeleltetése magában a térképben áll @L168 `modulePrefixes: Record<string, string[]>;`
- [C9] [CONFIRMED] A térképet szinkron fájlolvasással, JSON-ból tölti be @L173 `return JSON.parse(readFileSync(path, "utf8")) as UiMap;`
- [C10] [NEEDS_AGENT] A modul-változó leképezés a regiszterből származik, mert egy kézzel karbantartott lista fél éven belül hazudna @semantic L186-192
- [C11] [CONFIRMED] A lefedettség modulszám szerint rendez, a modul nélküli szakaszokat a lista végére téve @L204 `.sort((a, b) => (a[0] ?? 999) - (b[0] ?? 999))) {`
- [C12] [CONFIRMED] Előtag nélküli modulnál a változószám nulla, még ha a regiszterben volnának is mezők @L206 `const n = prefixes.length`
- [C13] [CONFIRMED] Az audit megnevezi a megszólaló szabályt, hogy egy átfogalmazás ne szakítsa el az aláírt döntést @L236 `rule: string;`
- [C14] [CONFIRMED] A mező hétféle státuszt kaphat @L238 `| "mapped" | "gap" | "derived" | "refused" | "interface" | "gate" | "context";`
- [C15] [CONFIRMED] Az audit mezőnként az ELSŐ illeszkedő zászlót adja vissza, minden ág `continue`-val zárul @L261 `continue;`
- [C16] [CONFIRMED] A különleges adat státusza elutasított, GDPR 9. cikkre hivatkozva @L254 `form: form.id, rule: "special", field: f.label, status: "refused",`
- [C17] [CONFIRMED] A párhuzamos mértékegység-mező elutasított: az egység az értékhez tartozik, a megjelenítés vált át @L277 `form: form.id, rule: "unitDuplicate", field: f.label, status: "refused",`
- [C18] [CONFIRMED] Az interfészből érkező mező saját `interface` státuszt kap, nem elutasítást @L299 `form: form.id, rule: "interfaceFilled", field: f.label, status: "interface",`
- [C19] [CONFIRMED] A reagens tételszáma kapuként viselkedik a számításon @L309 `form: form.id, rule: "lotCritical", field: f.label, status: "gate",`
- [C20] [CONFIRMED] A beleegyezés-kapu magát a számítást kapuzza, nem csak az adat rögzítését @L342 `form: form.id, rule: "consentGate", field: f.label, status: "gate",`
- [C21] [CONFIRMED] A gyanús mezőcímke elutasított: a helyes megnevezést szakmai forrásból kell venni @L408 `form: form.id, rule: "labelSuspect", field: f.label, status: "refused",`
- [C22] [CONFIRMED] A keresztfeltöltött mező az egyetlen zászlós ág, ahol a státusz a változó tényleges meglététől függ @L431 `status: f.variable && reg.get(f.variable) ? "mapped" : "gap",`
- [C23] [CONFIRMED] A „csak második próbálkozásra megítélhető” mérési körülmény, nem kapu @L485 `form: form.id, rule: "secondAttempt", field: f.label, status: "context",`
- [C24] [CONFIRMED] A kontraindikáció kapu: bejelöletlenül a kezelés nem indítható @L539 `form: form.id, rule: "contraindication", field: f.label, status: "gate",`
- [C25] [CONFIRMED] Az eldönthetetlen alanyú mező elutasított, mert a leletnél az alany a lelet fele @L560 `form: form.id, rule: "subjectAmbiguous", field: f.label, status: "refused",`
- [C26] [CONFIRMED] Az egy sorban két alanyt tároló mező elutasított @L572 `form: form.id, rule: "pairedSubjects", field: f.label, status: "refused",`
- [C27] [CONFIRMED] Ha az egység nem az, amiben a döntési határ ki van mondva, a mező elutasított @L607 `form: form.id, rule: "unitMismatch", field: f.label, status: "refused",`
- [C28] [CONFIRMED] A megrendelés-nyomon követés kapu: a kintlévő lelet tartozás, nem üres mező @L618 `form: form.id, rule: "orderTracking", field: f.label, status: "gate",`
- [C29] [CONFIRMED] A bizonytalan klinikai jelentőségű eredmény harmadik kategóriaként kapuzott @L631 `form: form.id, rule: "uncertainSignificance", field: f.label, status: "gate",`
- [C30] [CONFIRMED] Az esemény előtti és utáni mérés mérési körülményként jelenik meg @L703 `form: form.id, rule: "prePost", field: f.label, status: "context",`
- [C31] [CONFIRMED] A kézzel beírt végösszeg elutasított: az összeg levezetett, csak az összetevők adhatók meg @L727 `form: form.id, rule: "handTotal", field: f.label, status: "refused",`
- [C32] [CONFIRMED] A megkísérelt és sikertelen vizsgálat harmadik állapot, mérési körülményként @L739 `form: form.id, rule: "attemptFailed", field: f.label, status: "context",`
- [C33] [CONFIRMED] A nálunk levezetett mező külön `derived` státuszt kap @L784 `form: form.id, rule: "derived", field: f.label, status: "derived",`
- [C34] [CONFIRMED] Zászló nélküli, leképezett mezőnél a regiszterbeli változó megléte dönti el a lefedett és a hiányzó státusz között @L795 `status: d ? "mapped" : "gap",`
- [C35] [CONFIRMED] A leképezés nélküli mező `unmapped` szabállyal hiányzónak minősül @L804 `form: form.id, rule: "unmapped", field: f.label, status: "gap",`
- [C36] [CONFIRMED] Az összegző mondat külön kiírja, ha a térkép részleges @L824 `(map.coverage === "partial" ? " · a térkép RÉSZLEGES" : "")`
- [C37] [CONFIRMED] Minden szülő menüpontnak léteznie kell; a lógó ág hiba, mert a lefedettség mérése ettől téves @L841 `if (!labels.has(parent)) {`
- [C38] [CONFIRMED] Nem létező változóra mutató leképezés hiba, mert megvalósítottnak látszik @L851 `if (f.variable && !reg.get(f.variable)) {`
- [C39] [CONFIRMED] Regiszterbeli változóhoz kötött különleges adat hiba @L859 `if (f.special && f.variable) {`
- [C40] [CONFIRMED] A szabad szöveges mező csak figyelmeztetés, nem hiba @L867 `if (f.freeText) {`
- [C41] [CONFIRMED] Részleges térkép indoklás nélkül hiba @L877 `if (map.coverage === "partial" && !map.coverageNote?.hu) {`
