---
source: docs/fejlesztes/43-kalkulator-katalogus.md
sha256: 1383476175fb941d6341e6d3083a316c687b397b11970a2a2366f5a760f9029b
lines: 213
profile: prose
generator: subagent
raw_tokens_est: 2413
verified: 15 confirmed
---

# docs/fejlesztes/43-kalkulator-katalogus.md

## Topics
- L1-31: a kilenc URL és az R-csomag sorsa, mi lett beszerzett és mi nem
- L32-73: a kalkulátort elvevő külső validálás és a `bizonyitek` tételfajta
- L74-99: az OGDOC MIT licence és a GPLv2 ütközés iránya
- L100-213: a modell adatként való telepítése, a kapuk, a szivárgás elleni őrök, saját hiányok

## Claims

- [C1] [CONFIRMED] A feltöltött PRBPERIsk R-csomag teljes egészében megvan @L15 `(feltöltött R-csomag)`
- [C2] [CONFIRMED] Hét URL-t nem sikerült megnyitni, mind az egress-proxyn akadt el @L19 `**Hét URL-t nem sikerült megnyitni.**`
- [C3] [CONFIRMED] Két közlemény absztraktja PubMedről szerezhető meg @L27 `absztraktját adta (PMID 37290103 és 35596931).`
- [C4] [CONFIRMED] Két publikált szülésindítási kalkulátor külső validálásban gyengén teljesített, AUC ≤ 0,57 @L38 `**gyengén teljesített** (AUC ≤ 0,57 — alig jobb az`
- [C5] [CONFIRMED] A `bizonyitek` tételfajta nem átvehető, csak hivatkozható @L54 `**hivatkozható**, ha megvan.`
- [C6] [CONFIRMED] A GPL a használatot nem korlátozza, csak a terjesztést @L64 `A GPL a **használatot** nem`
- [C7] [CONFIRMED] Az OGDOC licence MIT, és a kód a `package.json`-ból olvassa, nem konstansból @L77 `és a kód **onnan olvassa**`
- [C8] [CONFIRMED] Az MIT választással a GPLv2 PRB-modell átvétele tiltottá vált, mert visszafelé nincs kompatibilitás @L80 `**nem lett szabad, hanem tiltottá vált**`
- [C9] [CONFIRMED] Az `atveheto()` licencütközésként utasítja el a GPL-2.0 forrást MIT projekt mellett @L92 `LICENCÜTKÖZÉS — a projekt licence MIT (megengedő), a forrásé GPL-2.0`
- [C10] [CONFIRMED] Teszt őrzi, hogy a mag egyetlen külső modell nevét se ismerje @L121 `test("a mag egyetlen külső modell nevét sem ismeri")`
- [C11] [CONFIRMED] Az ingest-szkript az együtthatókat a csomag forrásából olvassa ki, nem beégetve tartja @L130 `**kiolvassa** őket a csomag`
- [C12] [CONFIRMED] Hiányzó bemenet helyére a modell soha nem tesz nullát @L139 `a hiányzó érték **soha nem nulla**`
- [C13] [CONFIRMED] Hitelesítetlen (`assumed`) modell teljes bemenettel sem ad számot @L140 `→ **teljes bemenettel sem ad számot** |`
- [C14] [CONFIRMED] A `validateKulsoTerjesztes()` build-hibát ad, ha copyleft származék a terjesztett fába kerül @L153 `**build-hiba**, ha copyleft származék a`
- [C15] [CONFIRMED] A validálás záró sora: 2 külső forrás, 34 tétel, 0 átvéve, 1 hivatkozható @L196 `2 külső forrás (34 tétel, ebből 0 átvéve, 1 hivatkozható)`
