---
source: docs/megfeleles/13-uzemeltetes.md
sha256: 7ac711e2e83b8b55f937a4a14f98b47ac71383c133398fe4602c028c8a816a0e
lines: 235
profile: prose
generator: subagent
raw_tokens_est: 3315
verified: 14 confirmed
---

# docs/megfeleles/13-uzemeltetes.md

## Topics
- L1-27: Üzemeltetési döntések (K17–K29) és a helyben üzemeltetés indoklása
- L28-92: Felépítés, Orthanc-kitettség, a titkosítás és a kulcskezelés szabályai
- L93-235: GDPR-következmények, helyreállítási próbák, célértékek, kulcsletét a portán

## Claims

- [C1] [CONFIRMED] Az alapdöntés (K17) on-premise üzemeltetés, a mentés titkosítva a felhőbe megy @L3 `> **Döntés (K17): on-premise üzemeltetés, titkosított felhőmentéssel.**`
- [C2] [CONFIRMED] A K22 a szolgáltatót két megnevezett magyar céghez köti, az egészségügyre bérelt adatparkban @L6 `> **K22: Telekom HU vagy 4iG**, az **egészségügyre bérelt adatparkban**, az EESZT`
- [C3] [CONFIRMED] A K23 elfogadott célértékei klinikai adatra ≤ 15 perc RPO és ≤ 4 óra RTO @L7 `> szerverei mellett. **K23: az RPO és RTO célértékek elfogadva** (klinikai adat ≤ 15 perc /`
- [C4] [CONFIRMED] A mentés helyben tartása tiltott, mert tűz vagy zsarolóvírus a mentést is elviszi @L23 `helyben üzemeltetés a természetes választás. **A mentés viszont nem maradhat helyben** — egy`
- [C5] [CONFIRMED] Az Orthanc közvetlenül nem publikálható, mert a DICOMweb és a REST API hitelesítés nélkül kiadja a teljes képanyagot @L49 `**Az Orthanc fordított proxy mögé kerül.** Közvetlenül nem publikálható: a DICOMweb és a`
- [C6] [CONFIRMED] A kulcsot az intézménynek kell tartania, a tárolást végző szolgáltatótól elkülönítve @L62 `| **Ki tartja a kulcsot?** | ugyanaz a szolgáltató | **az intézmény**, a szolgáltatótól elkülönítve |`
- [C7] [CONFIRMED] A kulcsrotációnál a régi kulcsokat meg kell őrizni, különben a régi mentések visszaolvashatatlanná válnak @L73 `- **Rotáció**: a mentési kulcs rendszeres cseréje, a régi kulcsok megőrzésével — különben a`
- [C8] [CONFIRMED] Összeférhetetlenség: a felhőfiók adminisztrátora nem férhet a kulcshoz @L76 `- **Szétválasztás**: aki a felhőfiókot adminisztrálja, **ne** férjen a kulcshoz. Ez ugyanaz`
- [C9] [CONFIRMED] Az EESZT szerverei melletti fizikai elhelyezés nem ad biztonsági vagy jogi státuszt @L109 `> **Az EESZT szerverei melletti elhelyezés nem biztonsági tulajdonság.** Attól, hogy a`
- [C10] [CONFIRMED] A teljes adatbázis külön környezetbe való visszaállítása félévente esedékes, ellenőrző lekérdezéssel @L137 `| **Teljes adatbázis visszaállítása külön környezetbe**, ellenőrző lekérdezéssel | félévente | valódi helyreállíthatóság |`
- [C11] [CONFIRMED] A ≤ 15 perces RPO folyamatos WAL-archiválást kényszerít ki, napi mentés nem elég @L155 `- a ≤ 15 perces RPO **folyamatos WAL-archiválást** kíván, nem napi mentést;`
- [C12] [CONFIRMED] A portás csak a boríték fizikai őrzője, a kiadás jogosságáról nem ő dönt @L194 `> **A portás a boríték őrzője, nem a kulcs jogosultja.** Ez a különbség tartja meg a`
- [C13] [CONFIRMED] A kétszemélyes elv gyenge pontja, hogy az ügyeletes informatikus a felhőfiókot is adminisztrálja, így minden a portai kiadáson múlik @L211 `kétszemélyes elv tehát **a portán múlik**, azon, hogy a boríték csak engedéllyel kerül ki.`
- [C14] [CONFIRMED] A K30 döntés nyomán a 7.3 elemei SOP-ként rögzítendők a MIR-dokumentumfában @L227 `automatikus értesítés, helyettesítés — **SOP-ként rögzítendők**, és a`
