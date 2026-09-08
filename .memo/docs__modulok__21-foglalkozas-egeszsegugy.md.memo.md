---
source: docs/modulok/21-foglalkozas-egeszsegugy.md
sha256: b7fbd2ba17793307bae8c1eb46e5ec919bfc4140aaaeb21dcf01ae5a07b36d2e
lines: 169
profile: prose
generator: subagent
raw_tokens_est: 2137
verified: 10 confirmed
---

# docs/modulok/21-foglalkozas-egeszsegugy.md

## Topics
- L1-155: SOS24-portolás, alkalmassági folyamat, ISO 45001, baleseti jegyzőkönyv, regiszter-változók
- L156-169: Nyitott kérdések: párhuzamos üzem, napló- és kérdőív-átfedés, szerepkörök

## Claims

- [C1] [CONFIRMED] A SOS24 éles rendszer 71 táblával, 230 RLS policyval és 37 Deno edge functionnel, ezért a modul portolás, nem építés @L14 `230 RLS policyval, 37 Deno edge functionnel, Vitest + Deno + Playwright tesztréteggel.`
- [C2] [CONFIRMED] A munkáltató nem látja a klinikai leletet, csak az alkalmassági eredményt és annak érvényességét; ez RLS-ben van kikényszerítve @L44 `**A munkáltató nem látja a klinikai leletet.** Csak azt, hogy a munkavállaló alkalmas,`
- [C3] [CONFIRMED] Ugyanezt a szegregációs mintát veszi át az OGDOC kutatói szerepe: aggregátum és de-identifikált adat, klinikai részlet nélkül @L48 `Ugyanez a szegregációs minta kell az OGDOC **kutatói szerepéhez** is: a kutató aggregátumot és`
- [C4] [CONFIRMED] A terhesség bejelentése automatikusan kockázatértékelés-felülvizsgálatot indít, ami jogszabályi kötelezettség is @L89 `**automatikusan kockázatértékelés-felülvizsgálatot indít** — ez jogszabályi kötelezettség is.`
- [C5] [CONFIRMED] A SOS24 FEOR-kódtára átfed a v16 EESZT feor törzsével, ezért egyesítendő: egy FEOR-törzs legyen @L102 `> Egyesítendő — egy FEOR-törzs legyen, ne kettő.`
- [C6] [CONFIRMED] A modul tranzakciós adata saját táblákban marad; a regiszterbe csak mérés vagy strukturált klinikai állítás kerül @L109 `megfigyelés — ezek megmaradnak saját táblákban. A regiszterbe az kerül, ami mérés vagy`
- [C7] [CONFIRMED] A SOS24 párhuzamos üzeme és adatmigrációja ütemezési, nem tervezési kérdés @L159 `a másikra. Párhuzamos üzem és adatmigráció kell — ez ütemezési, nem tervezési kérdés.`
- [C8] [CONFIRMED] Az egészségnaplók egyesítésénél az IntuiCare `measurements` a primer, mert a regiszterhez köthető @L162 `a primer (a regiszterhez köthető),`
- [C9] [CONFIRMED] A két kérdőívmotorból az IntuiCare-é marad, a SOS24 kérdőívei adatként kerülnek át @L166 `kérdőívei adatként kerülnek át.`
- [C10] [CONFIRMED] A `munkaltato` szerep a legkényesebb a jogosultsági egyesítésben: külső fél, aki korlátozott betegadatot lát @L169 `szerep a legkényesebb: **külső fél, aki korlátozott betegadatot lát.**`
