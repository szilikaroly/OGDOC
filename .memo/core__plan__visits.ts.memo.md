---
source: core/plan/visits.ts
sha256: c9eb4b9a3abe3347521239e5b2d5a121682344421f64b9baffbbf26ededfaaad
lines: 310
profile: code
generator: subagent
raw_tokens_est: 3086
verified: 12 confirmed, 1 needs_agent
---

# core/plan/visits.ts

## Topics
- L1-94: A vizitrend elve (padló + indokolt sűrítés) és a terv típusai
- L95-254: CarePlanner.plan — módosítók kiértékelése, vizitek összefűzése, státusz
- L255-310: A figyelmeztető szöveg összeállítása és a protokollok validálása

## Claims

- [C1] [NEEDS_AGENT] a hiányzó rizikóadat nem alacsony kockázat: ilyenkor a terv ELŐZETES, és megnevezi a ki nem zárt rizikót @semantic L15-23
- [C2] [CONFIRMED] minden sűrített vizit magával hozza a hozzáadó módosítót és annak forrását; az alapviziteknél a `because` üres @L62 `because: Because[];`
- [C3] [CONFIRMED] külön mező mondja meg, szabad-e elmulasztottnak nyilvánítani egy vizitet — az ellenőrizetlen tábla tervezésre jó, vádolásra nem @L91 `canAssertMissed: boolean;`
- [C4] [CONFIRMED] duplikált protokoll-azonosítónál a konstruktor kivételt dob @L102 `if (seen.has(p.id)) throw new Error(`
- [C5] [CONFIRMED] a `when` egyetlen meghiúsuló feltétele azonnal „nem vonatkozik"-ot ad, a hiányzó adat viszont csak gyűlik @L118 `if (!test(r.value, c)) return { state: "doesNotApply", missing: [] };`
- [C6] [CONFIRMED] ha egyik VAGY-ág sem teljesül, de van köztük ismeretlen, a módosító kérdése nyitva marad @L129 `if (!any && anyMissing.length) missing.push(...anyMissing);`
- [C7] [CONFIRMED] ismeretlen `appliesWhen` változónál a terv nem alkalmazható, de kifejezetten előzetesnek jelölt @L156 `undetermined: [], provisional: true, canAssertMissed: false,`
- [C8] [CONFIRMED] azonos ablakú módosító-vizit nem kettőződik: a meglévő vizit kap tartalmat és indoklást @L201 `const same = visits.find((x) => x.from === v.from && x.to === v.to);`
- [C9] [CONFIRMED] a gesztációs kort lefelé kerekíti, hogy a betöltött hetekben megadott ablak ne múljon el korábban @L226 `? Math.floor(at.value) : null;`
- [C10] [CONFIRMED] elmulasztott vizit csak elsődleges forrású alaptáblával ÉS nem előzetes tervnél állítható @L261 `provisional, canAssertMissed: verified && !provisional,`
- [C11] [CONFIRMED] a fordított ablak (from > to) validációs hiba @L281 `if (v.from > v.to) push("error", p.id,`
- [C12] [CONFIRMED] hiba az a módosító, amelyik nem ad hozzá vizitet — a módosító csak sűríthet @L289 `if (!m.adds.length) {`
- [C13] [CONFIRMED] a nem elsődleges ellenőrzöttségű alaptábla csak figyelmeztetés, nem hiba @L302 `if (p.verification !== "primary") {`
