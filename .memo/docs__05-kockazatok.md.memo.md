---
source: docs/05-kockazatok.md
sha256: f73848885a1fef483dedd6260c9dda18657595b7c9225e1a4752caca9c16a3d2
lines: 430
profile: prose
generator: subagent
raw_tokens_est: 6642
verified: 19 confirmed
---

# docs/05-kockazatok.md

## Topics
- L1-144: Főkockázatok — két platform, biobanki blokkolók, örökölt hibák, méret, K0–K3 döntések
- L145-296: EKG kép-alapú felismerés, interoperabilitás, jogi és biobanki nyitott kérdések
- L297-317: Lezárt döntések második és harmadik köre
- L318-430: Kulcsőrzés, negyedik és ötödik kör, megőrzési idők, ami hátravan

## Claims

- [C1] [CONFIRMED] Két működő Supabase-rendszer tárol betegadatot: IntuiCare 230 tábla, SOS24 71 tábla @L9 `Most **két működő Supabase-rendszer** van (IntuiCare 230 tábla, SOS24 71 tábla), és mindkettő`
- [C2] [PENDING] A javaslat szerint az IntuiCare a gazdaplatform, a SOS24 domének átkerülnek @L17 `A `09-sos24-alap.md` javaslata: **az IntuiCare a gazdaplatform, a SOS24 domének átkerülnek**.`
- [C3] [CONFIRMED] A Fázis 2-ben SOP nélkül gyűjtött minták preanalitikai leírása utólag nem rekonstruálható @L36 `kellenek**. A Fázis 2-ben gyűjtött minták preanalitikai leírása utólag **nem`
- [C4] [PENDING] A BUG-015 azért blokkoló, mert az új tenant első felhasználója bárki lehet @L48 `| **BUG-015** | `user_roles_bootstrap_admin` — új tenant első felhasználója bárki lehet | kutatási adatgyűjtés ezen nem indulhat el |`
- [C5] [CONFIRMED] A legnagyobb kockázat a méret: ~4035 változó és 25 modul @L56 `**~4035 változó, 25 modul.** Ez nagyságrenddel több, mint a v16 (~200) vagy az IPRACS (~150).`
- [C6] [CONFIRMED] A K0 eldőlt: az OGDOC vegyes rendszer, egyik platform sem nyeli el a másikat @L91 `### K0. Melyik platform a gazda? — **ELDÖNTVE: vegyes rendszer**`
- [C7] [CONFIRMED] A gépi EKG-olvasat javaslat: megerősítés nélkül egyetlen érték sem rögzül @L156 `**Emberi felügyelet kötelező:** a gépi olvasat javaslat, a klinikus elvezetésenként erősíti`
- [C8] [CONFIRMED] A Modality Worklist a leggyakrabban kihagyott, de a legfontosabb interoperabilitási elem @L191 `**A Modality Worklist a leggyakrabban kihagyott, és a legfontosabb elem:** enélkül a beteg`
- [C9] [CONFIRMED] Az e-MedSolution interfészkészlet beszerzési feladat a Fázis 0-ban; addig az adapter `RecordingAdapter` módban fut @L204 `milyen betegazonosító kulccsal. **Ez beszerzési feladat a Fázis 0-ban**, nem fejlesztési.`
- [C10] [CONFIRMED] A k-anonimitási küszöb alapértelmezése 5, de az érték intézményi és etikai bizottsági döntés @L228 `A 20. modul alapértelmezése 5. Ez **intézményi és etikai bizottsági döntés**, nem fejlesztői.`
- [C11] [CONFIRMED] Nincs önálló 2009-es humángenetikai törvény: a 2008. évi XXI. törvény rendelkezik @L240 `A humángenetikai adatokról, vizsgálatokról, kutatásokról és biobankokról a **2008. évi XXI.`
- [C12] [CONFIRMED] Az EESZT-beküldési kötelezettség a magyar jogi fejezet legfontosabb nyitott kérdése @L249 `kérdése. Ez a magyar jogi fejezet legfontosabb nyitott kérdése.`
- [C13] [PENDING] K9 eldöntve: ISO 20387 és BBMRI-ERIC mellett ISO 9001, 17025 és 15189 — egy integrált rendszerben @L301 `| **K9** | Akkreditáció és BBMRI-ERIC | **igen** — ISO 20387 + BBMRI-ERIC, és emellett ISO 9001, ISO/IEC 17025, ISO 15189 | [`megfeleles/11-integralt-mir.md`](megfeleles/11-integralt-mir.md); **egy integrált rendszer**, nem négy |`
- [C14] [PENDING] K11 eldöntve: a rendszer keletkeztet ellátási dokumentációt, tehát EESZT-megfelelés kell @L303 `| **K11** | Keletkeztet-e ellátási dokumentációt | **igen**, és megtervezzük az EESZT-megfelelést | [`megfeleles/12-eeszt.md`](megfeleles/12-eeszt.md); beküldési és megőrzési kötelezettség, élesebb MDR-határ |`
- [C15] [CONFIRMED] K14 kódban megvalósítva: a rögzítéskori osztályozási verzió az értékre bélyegződik @L305 `| **K14** | Osztályozási készletek verziózása | **verziózandó** | **kódban megvalósítva**: a rögzítéskori verzió az értékre bélyegződik |`
- [C16] [CONFIRMED] K20: nyolc dokumentumtípus minősül ellátási dokumentációnak, dokumentum-regiszterként megvalósítva @L313 `| **K20** | Mely dokumentumtípusok ellátási dokumentáció | **nyolc**: zárójelentés, ambuláns lap, gyógyszerfelírás, vizsgálati lap, terhesgondozási lap, terhességi kockázatértékelés, beutaló, diétás/szakorvosi javaslat | **dokumentum-regiszterként megvalósítva**, a változóregiszterrel összeellenőrizve |`
- [C17] [CONFIRMED] K22: mindkét szóba jövő felhőszolgáltató EGT-n belüli, ezért a harmadik országba továbbítás kérdése tárgytalan @L315 `| **K22** | Felhőszolgáltató | **Telekom HU vagy 4iG** | mindkettő EGT-n belüli → **a harmadik országba továbbítás kérdése tárgytalan** |`
- [C18] [CONFIRMED] K23: klinikai adatra RPO ≤ 15 perc, RTO ≤ 4 óra @L316 `| **K23** | RPO és RTO | **elfogadva**: klinikai adat ≤ 15 perc / ≤ 4 óra | folyamatos WAL-archiválás és gyakorolt helyreállítás kell hozzá |`
- [C19] [PENDING] A kulcsőrzési összeférhetetlenség szerkezeti, ugyanaz az elv, mint a kutató és kódkulcs-kezelő szerep tiltása @L332 `akartuk. Ez nem bizalmi kérdés, hanem szerkezeti: ugyanaz az elv, mint a `kutato` +`
- [C20] [CONFIRMED] Az akkreditációk sorrendje: 9001 → 20387 → 15189 → 17025 → BBMRI-ERIC @L349 `| **K25** | Az akkreditációk sorrendje | **rendben**: 9001 → 20387 → 15189 → 17025 → BBMRI-ERIC | a közös váz épül először, nem kétszer ugyanaz |`
- [C21] [CONFIRMED] A műtéti dokumentumokkal együtt összesen 13 ellátási dokumentumtípus van @L351 `| **K20+** | Műtéti dokumentumok | **műtéti terv · aneszteziológiai terv · műtéti záró** | +3 dokumentumtípus; összesen **13** |`
- [C22] [CONFIRMED] Az Eüak. 30. §-a szerint a zárójelentés megőrzési ideje legalább 50 év @L392 `| **Zárójelentés** | **legalább 50 év** |`
- [C23] [CONFIRMED] A képalkotó felvétel 10 évig, a róla készített lelet 30 évig őrzendő @L393 `| **Képalkotó felvétel** | **10 év** a készítéstől |`
- [C24] [CONFIRMED] A megőrzési idők mind a tizennégy típuson `secondary` szintűek, ezért automatikus törlés nem indul @L409 `**elsődleges jogszabályszöveg** összevetése hátravan. Amíg ez nincs meg, **automatikus`
