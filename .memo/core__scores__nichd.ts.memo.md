---
source: core/scores/nichd.ts
sha256: eaa1147db09ab2e5b233dba70d9271d2de7330431c4feedac838eb99fc91d3a5
lines: 148
profile: code
generator: subagent
raw_tokens_est: 1543
verified: 9 confirmed, 1 needs_agent
---

# core/scores/nichd.ts

## Topics
- L1-43: modul-indoklás, NICHD eredmény- és blokkolt-típusok, forrás-konstans
- L44-148: a `nichd()` besoroló függvény és a III. kategória segédfüggvénye

## Claims

- [C1] [NEEDS_AGENT] A modul azért nem kalkulátor, mert a NICHD-besorolás kategória, és a II. kategória definíció szerint reziduális („minden, ami nem I. és nem III.”) @semantic L1-18
- [C2] [CONFIRMED] A `NichdOk` a kategória mellett a besorolás indoklását is visszaadja `why: string[]` mezőben @L29 `why: string[];`
- [C3] [CONFIRMED] A súlyosság három rögzített érték: normal / watch / redflag @L27 `severity: "normal" | "watch" | "redflag";`
- [C4] [CONFIRMED] KAPU: ha a magzati szívhang-monitorozás módszere `intermittent` vagy `none`, a függvény nem sorol be, hanem `insufficient` státuszt ad @L46 `if (method.state === "ok" && (method.value === "intermittent" || method.value === "none")) {`
- [C5] [CONFIRMED] Kötelező bemenet a baseline, a variabilitás és a deceleráció; az akceleráció hiánya NEM blokkol @L67 `if (decel.state !== "ok") missing.push("labour.fhr.decel");`
- [C6] [CONFIRMED] Sinusoidalis variabilitás önmagában, minden más bemenet vizsgálata nélkül III. kategóriát ad @L83 `if (v === "sinusoidal") {`
- [C7] [CONFIRMED] Hiányzó variabilitás csak ismétlődő deceleráció vagy 110 alatti alapvonal mellett vezet III. kategóriához @L88 `if (d === "recurrentLate" || d === "recurrentVariable" || bpm < 110) {`
- [C8] [CONFIRMED] I. kategóriához mindhárom feltétel egyszerre kell: 110–160 alapvonal, mérsékelt variabilitás, és legfeljebb korai deceleráció @L99 `if (normalBaseline && normalVariability && noBadDecel) {`
- [C9] [CONFIRMED] Minden más eset II. kategória `watch` súlyossággal, a `why` listában felsorolt eltérésekkel @L124 `status: "ok", category: 2,`
- [C10] [CONFIRMED] A `cat3()` segédfüggvény minden III. kategóriás ágnak ugyanazt az azonnali intrauterin resuscitatiós teendőt adja @L138 `function cat3(why: string[]): NichdOk {`
