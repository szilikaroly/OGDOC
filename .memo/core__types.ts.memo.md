---
source: core/types.ts
sha256: ea80a3248496a4db91c526ee67332881620dfa10864d63d23c4f2d30631f9779
lines: 442
profile: code
generator: subagent
raw_tokens_est: 4321
verified: 18 confirmed, 3 needs_agent
---

# core/types.ts

## Topics
- L1-159: alaptípusok, származás és megbízhatóság, kódrendszerek verziózása, tartományok, kódlistaelemek
- L160-230: levezetésfajták (előtöltés, táblakeresés), példány-dimenzió, a click-open minta
- L231-289: a lelet lánca, a betegnek szóló szöveg és a klinikai javaslatok típusa
- L290-442: a változódefiníció, a rögzített érték burka, az esetállapot és a score-eredmény

## Claims

- [C1] [NEEDS_AGENT] A mag DOM-mentes és adatbázis-mentes: tiszta függvények, cserélhető felülettel és tárolással @semantic L4-6
- [C2] [CONFIRMED] A származás precedenciája számmal kódolt rangsor, a klinikus a legmagasabb, a beteg a legalacsonyabb @L24 `clinician: 6, device: 5, imported: 4, derived: 3, prefilled: 2, patient: 1,`
- [C3] [NEEDS_AGENT] Egy változó nem egy értékkészletet tart, hanem verziónként egyet, hogy a régi kód a saját verziója szerint legyen visszaolvasható @semantic L49-60
- [C4] [CONFIRMED] A tartomány külön jelöli a visszakérdezésre okot adó és az azonnali klinikai jelzést kiváltó sávot @L79 `critical?: [number | null, number | null] | null;`
- [C5] [CONFIRMED] A referenciatartomány kontextusonként külön él, mert a terhesség eltolja a normáltartományt @L99 `context: string;`
- [C6] [CONFIRMED] A „nem tudom” a kódlista önálló értéke, nem hiányzó adat @L129 `= a „nem tudom" önálló érték, nem hiányzó adat.`
- [C7] [CONFIRMED] A táblakeresés külön levezetésfajta, nem kalkulátor, mert kódból szöveget ad és nincs benne képlet @L182 `export interface LookupDerivation {`
- [C8] [CONFIRMED] Háromféle levezetés létezik: számított, előtöltött és táblából keresett @L193 `export type Derivation = ComputedDerivation | PrefillDerivation | LookupDerivation;`
- [C9] [CONFIRMED] A példányosított mezőhöz névsor tartozik, és amíg egy példány nincs a névsorban, hozzá nem rögzíthető részlet @L217 `roster: string;`
- [C10] [NEEDS_AGENT] A click-open mintában a normális lelet az alapértelmezés, és csak a kóros nyílik ki @semantic L220-229
- [C11] [CONFIRMED] A lehetetlen vizsgálatnál a részletező lánc csukva marad, szemben a korlátozottal @L240 `/** LEHETETLEN — meg sem lehetett vizsgálni. Részlet nincs, a lánc csukva marad. */`
- [C12] [CONFIRMED] A részletező lánc lépésenként nyílik: minden mező akkor jelenik meg, ha az előtte lévő ki van töltve @L248 `cascade?: string[];`
- [C13] [CONFIRMED] A betegnek szóló generált szöveg értéktől függetlenül megjelenik, a normális leletnél is @L251 `* A betegnek szóló, generált szöveg — ÉRTÉKTŐL FÜGGETLENÜL megjelenik.`
- [C14] [CONFIRMED] A javaslat konkrét ÉRTÉKHEZ köthető, nem csak az egész lelethez @L282 `code?: string | number | boolean;`
- [C15] [CONFIRMED] A javaslat hétféle lehet a labortól a tanácsig @L283 `kind: "lab" | "imaging" | "referral" | "followup" | "diet" | "procedure" | "advice";`
- [C16] [CONFIRMED] Az egység másik kódolt mezőből is származhat, és egység nélküli adag nem rögzíthető @L312 `unitFrom?: string | null;`
- [C17] [CONFIRMED] A `reference` a klinikai olvasat, nem azonos a rögzíthetőség határát adó `domain`-nel @L319 `reference?: ReferenceSet | null;`
- [C18] [CONFIRMED] A fogyasztók listáját a build tölti a levezetési gráfból, kézzel írni tilos @L361 `consumers?: string[];`
- [C19] [CONFIRMED] Az érték időbélyege arra vonatkozik, mikor érvényes, nem arra, mikor írták be @L384 `t: string;`
- [C20] [CONFIRMED] Az osztályozási verziót a motor bélyegzi az értékre, kézzel nem adható meg @L401 `codeSystemVersion?: string | null;`
- [C21] [CONFIRMED] Hiányzó bemenetnél a score nem számol: sem nullát, sem alapértelmezést nem tesz be @L422 `A rendszer legfontosabb betegbiztonsági szabálya: ha egy bemenet hiányzik,`
