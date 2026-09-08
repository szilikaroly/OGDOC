---
source: docs/fejlesztes/54-eeszt-csatlakozas.md
sha256: 33e0766111f416f9785960c6a2291abd7f351099091da7661f3d7826a71d3c31
lines: 155
profile: prose
generator: subagent
raw_tokens_est: 1570
verified: no claims
---

# docs/fejlesztes/54-eeszt-csatlakozas.md

## Topics
- L1-50: miért kifelé védő kapu ez, a négy csatlakozási kapu, a szintetikus üzemmód
- L51-155: az öt űrlap és a 18 mező, a titoktartás kockázatai, nyitott tételek, fájlok

## Claims

- [C1] Ma a cselekvő kilétét egyetlen ellenőrizetlen kérésfejléc állítja @L18 `ellenőrizetlen kérésfejléc állítja. Belül ez rossz; csatlakozás után a rendszer`
- [C2] A négy kapuból a hitelesítés hiányzik: a cselekvőt kérésfejléc állítja @L31 `| ☐ | **Hitelesítés** | NINCS — a cselekvőt kérésfejléc állítja |`
- [C3] A szintetikus üzemmód megléte nem képesség, hanem beismerés, és amíg áll, országos nyilvántartásba nem küldhetünk @L41 `**A megléte nem képesség, hanem beismerés** — és amíg ott áll, országos`
- [C4] A `csatlakozhato()` nem a bizonyíték meglétét kéri, hanem a hitelesítését @L43 `ezért nem is a bizonyíték meglétét kéri, hanem a hitelesítését.`
- [C5] A teszt bizonyítja, hogy a szintetikus kapu eltüntetése önmagában nem nyit csatlakozást @L45 `A teszt külön bizonyítja, hogy **a kapu eltüntetése önmagában nem nyit`
- [C6] A referenciaigazolást az intézmény állítja ki a szállítóról, intézményi képviselő aláírásával @L56 `| Referenciaigazolás (v2.2) | **az intézmény** igazolja a szállítót | intézményi képviselő |`
- [C7] Az űrlapok 18 mezőjéről mezőnként megállapított, ki tudja megválaszolni @L61 `**18 mező, és mindegyikről kiderül, ki tudja megválaszolni:**`
- [C8] Az egyetlen üzemeltetési mező a fejlesztés helyének fix IP-címe, amit a rendszer nem tippelhet meg @L67 `| **üzemeltetés** | 1 | **a fejlesztés helyének fix IP-címe** |`
- [C9] Élő bizonyíték nélkül „rendszerből válaszolhatónak" jelölt mező építési hiba @L75 `bizonyíték, az **építési hiba** — mert akkor a beadványba kézzel írt adat`
- [C10] A titoktartási kötelezettség a rendszer egyetlen lejárat nélküli kötelezettsége @L91 `**Ez a rendszer egyetlen olyan kötelezettsége, aminek nincs lejárata.** A`
- [C11] A referenciaigazolás élő használatot állít, ezért a 16. lépés (pilot) sorrendben megelőzi ezt az űrlapot @L109 `használt rendszerre nem adható ki — tehát a **16. lépés (pilot) előbb van,`
- [C12] Az űrlapok személyes adatot kérnek, ezért sem az üres sablon, sem a kitöltött példány nem kerül a repóba @L117 `neve — az intézményi vezetőé és a megbízotté egyaránt. Sem az üres sablon, sem`
