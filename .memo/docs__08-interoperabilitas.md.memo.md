---
source: docs/08-interoperabilitas.md
sha256: 2849d4c4c8272a0dd1dd2871da608ff1f6469e0a8132022e341c049a6a2ee05f
lines: 370
profile: prose
generator: subagent
raw_tokens_est: 4337
verified: 20 confirmed
---

# docs/08-interoperabilitas.md

## Topics
- L1-154: interfészréteg-döntés, HL7 v2/FHIR leképezés, DICOM-szolgáltatások, Orthanc
- L155-305: LIS2/POCT1, e-MedSolution, EESZT, azonosítók, a határ négy kapuja
- L306-323: kimenő újrapróbálkozás, eszkaláció, tesztfedettség
- L324-370: sync_outbox séma, adapter-változatok, teendők és nyitott kérdések

## Claims

- [C1] [CONFIRMED] A K7 döntés univerzális interfészréteget rögzít: HL7 (v2 és FHIR), DICOM, LIS2 és POCT1 @L3 `**K7 eldőlt.** Univerzális interfészréteg:`
- [C2] [CONFIRMED] A fő HIS-integrációs cél az e-MedSolution, a saját PACS pedig az Orthanc @L5 `**Fő cél: e-MedSolution.** Saját PACS: **Orthanc**.`
- [C3] [CONFIRMED] A klinikai megfigyelés-tábla eleve FHIR-Observation alakot követ, nem konverzióval @L30 `eleve FHIR-Observation alakú.`
- [C4] [CONFIRMED] Az accession number köti össze a vizsgálatkérést, a képet és a leletet a képalkotó láncban @L106 `ez köti össze a kérést, a képet és a leletet.`
- [C5] [CONFIRMED] Az Orthanc alapértelmezett védelme nem elég, ezért fordított proxy mögé kell tenni @L121 `fordított proxy mögé kell tenni`
- [C6] [CONFIRMED] A DICOM SR strukturált méréseket és megállapításokat hordoz (UH-biometria, Doppler, echo) @L140 `(Structured Report) | **strukturált mérések és megállapítások**`
- [C7] [CONFIRMED] A laborműszerekhez nem közvetlenül csatlakozunk, hanem POCT-middleware-en át @L167 `nem közvetlenül a műszerhez csatlakozunk`
- [C8] [CONFIRMED] Az e-MedSolution interfészadatlap hiányában az adapter csak előállítja és elmenti a kimenő üzenetet, nem küldi @L189 `előállítja és elmenti a`
- [C9] [CONFIRMED] Kutatási státuszban a rendszer nem küld adatot az EESZT-be @L208 `kutatási státuszban a rendszer nem küld adatot az EESZT-be.`
- [C10] [CONFIRMED] Az EESZT kimenő adapter létezik, de feature flag mögött alapból ki van kapcsolva @L209 `A kimenő adapter létezik, feature flag mögött, alapból kikapcsolva.`
- [C11] [CONFIRMED] Ellentmondó azonosítók esetén nincs betegpárosítás, akkor sem, ha többségben vannak az egyezők @L275 `Ellentmondás esetén nincs párosítás — akkor sem, ha több azonosító`
- [C12] [CONFIRMED] A QC-kapu szándékosan csak a POCT-csatornán fut, mert a labor a saját akkreditációjával felel @L287 `kapu **csak a POCT-csatornán** fut, és ez szándékos`
- [C13] [CONFIRMED] A kimenő újrapróbálkozás exponenciálisan vár, de nem korlátlan ideig @L308 `exponenciálisan vár, **de nem örökké**`
- [C14] [CONFIRMED] Az újrapróbálkozás-sorozat vége eszkaláció: emberhez fordul @L311 `**emberhez fordul.**`
- [C15] [CONFIRMED] Az interop-viselkedést 23 teszt védi @L320 `**23 teszt** védi a fentieket`
- [C16] [CONFIRMED] A sync_outbox csatornái: eeszt, his, pacs, lis, poct, research @L329 `-- eeszt | his | pacs | lis | poct | research`
- [C17] [CONFIRMED] Az outbox-rekord státusza pending, sent, failed vagy skipped @L331 `-- pending | sent | failed | skipped`
- [C18] [CONFIRMED] Az outbox ürítését a platformon már működő pg_cron végzi @L338 `üríti — ami a platformon`
- [C19] [CONFIRMED] Minden csatornához három adapter-megvalósítás tartozik (Noop, Recording, éles) @L341 `**Minden csatornára három adapter-megvalósítás:**`
- [C20] [CONFIRMED] Az Orthanc telepítése és a MWL/MPPS lánc a képalkotó modul előfeltétele, és a Fázis 0-1 teendője @L356 `**Orthanc telepítése és a MWL/MPPS lánc**`
