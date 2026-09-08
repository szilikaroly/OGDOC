---
source: docs/fejlesztes/02-web-architektura.md
sha256: e69ecab93252979543aeae31d0fc0f195aac5ae9de18141356b47408bf9e8c3f
lines: 204
profile: prose
generator: subagent
raw_tokens_est: 2735
verified: 12 confirmed
---

# docs/fejlesztes/02-web-architektura.md

## Topics
- L1-5: a csontváz és a végleges platform viszonya
- L6-48: rétegek, portolhatósági szerződés, stackválasztás indokokkal
- L49-204: adatmodell és indoklásai, sorszintű szabályok, szerepek, API, teljesítmény, telepítés

## Claims

- [C1] [CONFIRMED] A csontváz ma fut, a fejezet arról szól, mi lesz belőle @L3 `ma fut és bizonyít; ez a fejezet arról szól, hogy mi lesz`
- [C2] [CONFIRMED] A portolhatósági szerződés szerint a mag és az API-réteg semmit nem tud a szállításról @L28 `**A portolhatósági szerződés**: a `
- [C3] [CONFIRMED] Szállításváltáskor csak a kiszolgálófájl cserélendő, kb. 150 sor, nem az üzleti logika @L31 `kell — 150 sor —, nem az üzleti logikát.`
- [C4] [CONFIRMED] A keretválasztás indoka, hogy az IntuiCare már ezen fut 158 route-tal és 407 server functionnel @L38 `Az IntuiCare már ezen van (158 route, 407 server function).`
- [C5] [CONFIRMED] Az adatbázis a meglévő 230 táblás Postgres sorszintű szabályokkal @L39 `Már megvan: 230 tábla, sorszintű szabályok.`
- [C6] [CONFIRMED] A hitelesítésből a bérlő-létrehozás hiányzik, ez a BUG-015 @L40 `a hiányzó rész a bérlő-létrehozás (BUG-015).`
- [C7] [CONFIRMED] Az egy sor egy érték modell miatt egy új változó felvétele adat, nem séma-migráció @L89 `Így a változó felvétele **adat**, nem migráció.`
- [C8] [CONFIRMED] A definícióverzió tárolása nélkül a történeti adat csendben átértelmeződne @L90 `Enélkül a történeti adat csendben átértelmeződik.`
- [C9] [CONFIRMED] A javítás nem felülírás, mert az egészségügyi rekordban a javítás is adat @L91 `Egészségügyi rekordban a javítás is adat.`
- [C10] [CONFIRMED] A kutatói és a kódkulcs-kezelői szerep ugyanazon a felhasználón nem adható ki @L150 `**ugyanazon a felhasználón nem adható ki**`
- [C11] [CONFIRMED] Az elutasítás HTTP 200-as válasszal érkezik, mert a 4xx/5xx a felületen hibaoldalt jelentene @L175 `**Az elutasítás HTTP 200.**`
- [C12] [CONFIRMED] A staging környezet soha nem kap valódi betegadatot @L199 `**A staging soha nem kap valódi betegadatot.**`
