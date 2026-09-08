---
source: core/docs/types.ts
sha256: eb6b9388854ae94443732c6ef47d29ff58e97e406de4d7fd46be43df34bfef7f
lines: 127
profile: code
generator: subagent
raw_tokens_est: 1223
verified: 10 confirmed, 1 needs_agent
---

# core/docs/types.ts

## Topics
- L1-45: modulcél és az ellenőrzöttség három fokozata
- L46-89: Retention (megőrzési idő) és EesztSubmission típusok
- L90-127: DocumentDef — a dokumentumtípus-definíció mezői

## Claims

- [C1] [CONFIRMED] a K20 döntés nyolc dokumentumtípust nevezett meg ellátási dokumentációként @L4 `A K20 döntés nyolc dokumentumtípust nevezett meg ellátási dokumentációként.`
- [C2] [NEEDS_AGENT] az ellenőrzöttség azért háromfokozatú, mert a több független másodlagos forrás egybehangzósága valós köztes állapot @semantic L23-37
- [C3] [CONFIRMED] törölni csak elsődleges (jogszabályszöveggel összevetett) ellenőrzés után szabad @L29 `nem lett a kezünkben. Törölni CSAK elsődleges ellenőrzés után szabad.`
- [C4] [CONFIRMED] a megőrzési idő ISO 8601 időtartamként van megadva @L47 `ISO 8601 időtartam, pl.`
- [C5] [CONFIRMED] a megőrzés kezdőpontja ötféle lehet: recordClose, patientDeath, lastAccess, dataEntry, creation @L59 `from: "recordClose" | "patientDeath" | "lastAccess" | "dataEntry" | "creation";`
- [C6] [CONFIRMED] a jogszabály-idézet más kezdőpontot nevez meg, mint a tényleges beállítás, ami mind a tizennégynél recordClose @L54 `a beállítás viszont mind a tizennégynél`
- [C7] [CONFIRMED] KAPU: amíg betegkérés függőben van, nem történik törlés @L73 `dokumentációt kikérje. Amíg ilyen kérés függőben van, **nem törlünk**.`
- [C8] [CONFIRMED] az EESZT-beküldés időzítése onSign, onClose vagy onIssue @L87 `when: "onSign" | "onClose" | "onIssue";`
- [C9] [CONFIRMED] careRecord esetén a kutatási hozzájárulás visszavonása NEM törli a dokumentumot @L100 `és a kutatási hozzájárulás visszavonása NEM törli.`
- [C10] [CONFIRMED] az `expects` kapcsolódó dokumentumok hiánya soha nem blokkol, csak hiányként látszik @L110 `SOHA NEM BLOKKOL, csak hiányként jelenik meg. A dokumentálás blokkolása`
- [C11] [CONFIRMED] a szerző aláírása típusszinten kötelező (`true` literál), az ellenjegyzés opcionális @L118 `author: true;`
