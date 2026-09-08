---
source: core/coding/rules.ts
sha256: 34b881f62db02575df55b41b6998b619eed704f05b59a0ece0bc338278b067f2
lines: 388
profile: code
generator: subagent
raw_tokens_est: 3964
verified: 19 confirmed, 1 needs_agent
---

# core/coding/rules.ts

## Topics
- L1-40: A kódajánlás három alapelve, importok, nyelvi segédfüggvény
- L41-88: A kódszabály alakja, bizonyítéktípus, a négy kódstátusz
- L89-144: Az ajánlás és az eredmény alakja, feltétel-kiértékelő és operátorszótár
- L145-304: A CodeRules osztály: kiértékelés, elnyomás, előzetesség, validálás eleje
- L305-388: A validálás további szabályai és a szabályfájlok betöltése

## Claims

- [C1] [NEEDS_AGENT] Az ajánlás nem tárolódik; ami tárolódik, az a kódoló döntése, és a kettő eltérése önmagában adat @semantic L15-17
- [C2] [CONFIRMED] A nyelvi visszaesés sorrendje: kért nyelv, magyar, angol, végül üres szöveg @L39 `const L = (x: I18n | undefined, lang: Lang): string => x?.[lang] ?? x?.hu ?? x?.en ?? "";`
- [C3] [CONFIRMED] A `when` minden feltételének teljesülnie kell, míg a `whenAny`-ből bármelyik elég @L45 `/** MINDEN feltételnek teljesülnie kell. */`
- [C4] [CONFIRMED] A szabály csak a SNOMED-azonosítót tárolhatja, a megnevezést a CC BY-ND licenc miatt nem @L60 `* Csak az azonosító, a megnevezés nem: a Global Patient Set CC BY-ND`
- [C5] [CONFIRMED] Négy kódstátusz van, és az `undetermined` (hiányzó adat) külön áll a „nem teljesül”-től @L87 `| "undetermined";`
- [C6] [CONFIRMED] A CC BY-ND forrásmegjelölésnek meg kell jelennie a kimeneten @L109 `/** A CC BY-ND forrásmegjelölés. A kimeneten meg KELL jelennie. */`
- [C7] [CONFIRMED] A `provisional` azt jelöli, hogy egy súlyosabb kód eldönthetetlen maradt @L124 `provisional: boolean;`
- [C8] [CONFIRMED] A `test` az összehasonlító operátoroknál `Number()` konverzióval dolgozik @L134 `case "lt": return Number(value) < Number(c.value);`
- [C9] [CONFIRMED] A konstruktor duplikált szabály-azonosítónál kivételt dob @L152 `if (seen.has(r.id)) throw new Error(`
- [C10] [CONFIRMED] A `when` egyetlen nem teljesülő feltétele azonnal `notApplicable`-t ad, bizonyíték és hiánylista nélkül @L182 `if (!test(v.value, c)) return { status: "notApplicable", because: [], missing: [] };`
- [C11] [CONFIRMED] A bizonyítékszöveg emberi mértékegységgel készül, a `withUnit` rétegen át @L174 `withUnit(String(value), def?.unit, lang)`
- [C12] [CONFIRMED] Ha a `whenAny` egyik ága sem teljesült, de van köztük ismeretlen, a kérdés nyitott marad @L195 `if (!any && anyMissing.length) missing.push(...anyMissing);`
- [C13] [CONFIRMED] A `supersededByAny` szabály kódját az első eltérő kódú fennálló szabály nyomja el @L215 `const other = applying.find((x) => x.rule.code !== e.rule.code);`
- [C14] [CONFIRMED] Az ajánlás akkor előzetes, ha egy eldönthetetlen szabály elnyomna egy most ajánlott kódot @L251 `return (r.supersedes ?? []).some((c) => codes.includes(c));`
- [C15] [CONFIRMED] A feltétel nélküli kódszabály hiba, mert mindenkire vonatkozna @L309 `if (!(r.when?.length || r.whenAny?.length)) {`
- [C16] [CONFIRMED] SNOMED-azonosító a `snomedVerified` kiadásjelölés nélkül hiba @L319 `if (r.snomed && !r.snomedVerified) {`
- [C17] [CONFIRMED] Nem klinikai főhierarchiájú SNOMED-fogalom hiba; a készlet hiányából adódó `unknown` nem az @L342 `if (tag.status === "nonClinical") {`
- [C18] [CONFIRMED] Leírás- vagy kapcsolatazonosító fogalom helyett hiba @L345 `} else if (c.kind !== "concept") {`
- [C19] [CONFIRMED] A hatástalan elnyomás (nincs szabály az elnyomott kódra) csak figyelmeztetés @L355 `if (!codes.has(s)) {`
- [C20] [CONFIRMED] A `loadCodeRules` könyvtárat és fájlt is fogad, és csak a tömb alakú JSON-tartalmat veszi át @L384 `if (Array.isArray(parsed)) out.push(...parsed);`
