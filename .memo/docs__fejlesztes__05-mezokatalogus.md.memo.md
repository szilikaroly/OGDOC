---
source: docs/fejlesztes/05-mezokatalogus.md
sha256: dcb9299895312f82c8585690b667f6b29f27a06405dd55b8165d96a4341b2dec
lines: 1185
profile: prose
generator: subagent
raw_tokens_est: 24168
verified: 15 confirmed, 1 needs_agent
---

# docs/fejlesztes/05-mezokatalogus.md

## Topics
- L1-5: a katalógus-rész generált volta és a forrása
- L6-145: névadás, kötelező tulajdonságok, a négy döntés, tartományszintek, katalógus-összesítés, addr/admin/anthro/code/complaints mezők
- L146-176: a ctx ellátási kontextus 20 mezője és a demog
- L177-236: diet (31) és disch (19) mezőtáblái
- L237-396: ekg (75), epi, exam.obs, fu, hx, hx.eeszt, hx.family mezőtáblái
- L397-415: hx.origin és hx.psy mezőtáblái
- L416-465: hx.repro (21) és hx.supp (9) mezőtáblái
- L466-497: hx.sys szervrendszeri anamnézis 27 mezője
- L498-563: imaging 61 mezője
- L564-641: lab 73 mezője
- L642-716: labour (30) és nb (14) mezőtáblái
- L717-742: onc 21 mezője
- L743-817: op (51) és out (14) mezőtáblái
- L818-845: pedgyn 23 mezője
- L846-873: plan 23 mezője
- L874-936: prom 58 mezője
- L937-1019: psy (44), rules, rx (16), score mezőtáblái
- L1020-1175: status (104), szuloszoba, utankovetes, vitals, vizsgalatok mezőtáblái
- L1176-1185: lefedettség a tervezett változószámhoz képest

## Claims

- [C1] [CONFIRMED] A katalógus-rész generált, csak a konvenciók készültek kézzel @L4 `állítja elő. A konvenciók kézzel írtak.`
- [C2] [CONFIRMED] A változó azonosítója soha nem változik; jelentésváltozáskor a verzió nő @L33 `**Az azonosító soha nem változik.**`
- [C3] [NEEDS_AGENT] A típusonkénti kötelező tulajdonságok közül kettő hiánya build-hibát okoz, a többi csak figyelmeztetést @semantic L39-47
- [C4] [CONFIRMED] A fizikai határ nem normáltartomány: ha kizárja a valós beteget, a klinikus máshova írja be, és az adat elvész @L68 `kizárja a valós beteget, adatvesztést okoz, mert a klinikus máshova írja be.`
- [C5] [CONFIRMED] A katalógusban 872 változó van 43 modulban @L75 `**872 változó**, 43 modulban.`
- [C6] [CONFIRMED] 43 levezetett változó van, az állomány 5%-a @L79 `| 43 | 5% |`
- [C7] [CONFIRMED] A szabad szöveges mezők aránya 5%, a kitűzött felső határ 10% @L85 `A szabad szöveges mezők aránya **5%**`
- [C8] [CONFIRMED] A vizsgálat időpontja levezetés nélküli bemenet, amely több számított mezőt táplál @L160 `| Vizsgálat időpontja | datetime | — | — | — | `
- [C9] [CONFIRMED] A napi energiaszükséglet levezetése kapujelöléssel szerepel a katalógusban @L190 ` ⛔ | — | — |`
- [C10] [CONFIRMED] Az EKG-domén 75 mezőt tartalmaz @L237 `— 75 mező`
- [C11] [CONFIRMED] A képalkotó domén 61 mezőt tartalmaz @L498 `— 61 mező`
- [C12] [CONFIRMED] A labordomén 73 mezőt tartalmaz @L564 `— 73 mező`
- [C13] [CONFIRMED] A státusz-domén 104 mezővel a katalógus legnagyobb csoportja @L1020 `— 104 mező`
- [C14] [CONFIRMED] A becsült magzati súly levezetése is kapujelöléssel szerepel @L1170 `Becsült magzati súly`
- [C15] [CONFIRMED] A tervezett kb. 4035 változóból 872 van meg, 21,6% @L1178 `A tervezett **~4035** változóból **872** van meg (21.6%).`
- [C16] [CONFIRMED] A legutóbbi 14 mező felvételét nem terv, hanem a kalkulátor-validátor kényszerítette ki @L1182 `**nem terv, hanem a kalkulátor-validátor kényszerítette ki**`
