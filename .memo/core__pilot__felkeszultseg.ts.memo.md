---
source: core/pilot/felkeszultseg.ts
sha256: 1c73ab3f6cd5661b72dcd2aed3e67e63c2c381b9ea60a6ea0cab482f856062b1
lines: 381
profile: code
generator: subagent
raw_tokens_est: 3996
verified: 17 confirmed, 3 needs_agent
---

# core/pilot/felkeszultseg.ts

## Topics
- L1-155: A pilot-kapu indoklása, a nyilvántartás típusai és az előfeltétel-állás számítása
- L156-187: Az előfeltételek összefűzése és az indíthatóság típusa
- L188-248: indithato — akadályok, szervezeti hiányok és a kapu döntése
- L249-299: zarasAllas — a zárási kritériumok mérhetőségi besorolása
- L300-381: validatePilot figyelmeztetései és a mérleg összesítése

## Claims

- [C1] [NEEDS_AGENT] a modul a tervben felsorolt öt előfeltétel mellett külön tartja a KIMONDATLAN előfeltételeket, és a kapu mindkét halmazt megköveteli @semantic L16-26
- [C2] [CONFIRMED] a `loadPilot` a nyilvántartást JSON-ból olvassa és validálás nélkül castolja `Pilot` típusra @L97 `return JSON.parse(readFileSync(path, "utf8")) as Pilot;`
- [C3] [CONFIRMED] az ismeretlen bizonyítékkulcs saját állapotot kap, nem hiányzó bizonyítéknak számít @L142 `? "ismeretlenBizonyitek"`
- [C4] [CONFIRMED] a `hianyzik` listába a hiányzók MELLETT az ismeretlen kulcsok is bekerülnek @L146 `const hiany = [...hianyzik, ...ismeretlen];`
- [C5] [CONFIRMED] az `all` mező kizárólag a `teljesult` állapotnál igaz @L149 `allapot, all: allapot === "teljesult",`
- [C6] [CONFIRMED] a `hianyErtekek` csak a hiányzó kulcsokhoz tartozó mért értékeket szűri ki, hogy a meglévők ne keveredjenek közéjük @L151 `hianyErtekek: ertekek.filter((x) => hiany.some((k) => x.startsWith(k + ":"))),`
- [C7] [CONFIRMED] az `elofeltetelek` a tervbeli és a kimondatlan előfeltételeket egyetlen listába fűzi, `kimondatlan` jelöléssel megkülönböztetve @L159 `...p.kimondatlan.map((e) => allas(e, biz, true)),`
- [C8] [NEEDS_AGENT] a kapu kizárólag a bizonyítékbázisból nyílik, nincs olyan mező, amit „kész"-re lehetne billenteni @semantic L174-187
- [C9] [CONFIRMED] az akadályok listája a tervbeli előfeltételeket a kimondatlanok elé rendezi @L191 `.sort((a, b) => Number(a.kimondatlan) - Number(b.kimondatlan))`
- [C10] [CONFIRMED] a hiányzó osztály, vezető és kezdődátum külön, szervezeti akadályként jelenik meg @L197 `if (!p.osztaly) szervezeti.push("Nincs kijelölt osztály.");`
- [C11] [CONFIRMED] a pilot csak akkor indítható, ha sem előfeltételi, sem szervezeti akadály nincs @L201 `const indithato = akadalyok.length === 0 && szervezeti.length === 0;`
- [C12] [CONFIRMED] a `fugg` előfeltétel hiánya a kritériumot `elerhetetlen`-né teszi, nem teljesítetlenné @L254 `allapot: "elerhetetlen" as MeresAllapot,`
- [C13] [CONFIRMED] a `meresFugg` hiánya `meroeszkozNelkul`: a kritérium teljesülhet, de a végén magától „teljesült"-nek látszana @L265 `allapot: "meroeszkozNelkul" as MeresAllapot,`
- [C14] [CONFIRMED] a szervezeti forrású kritérium `csakEmberi` és nem mérhető @L274 `if (z.forras === "szervezet") {`
- [C15] [CONFIRMED] a nevezőt igénylő kritérium `nevezoHianyzik` állapotú, mert a nevező a rendszeren kívülről jön @L281 `if (z.nevezo) {`
- [C16] [NEEDS_AGENT] a besorolás sorrendje rögzített: elérhetetlen → mérőeszköz nélkül → csak emberi → nevező hiányzik → mérhető @semantic L249-295
- [C17] [CONFIRMED] a nem létező bizonyítékkulcsra hivatkozás hibát (`error`) ad, mert az elgépelt hivatkozás nem teljesült feltételnek látszana @L311 `if (!kulcsok.has(k)) {`
- [C18] [CONFIRMED] a zárva maradó kapu csak figyelmeztetés, nem hiba @L329 `severity: "warning", id: "pilot.kapu",`
- [C19] [CONFIRMED] minden nem mérhető zárási kritérium külön figyelmeztetést szül @L337 `for (const z of zarasok.filter((x) => !x.merheto)) {`
- [C20] [CONFIRMED] a `merleg` külön számlálja a tervbeli és a kimondatlan előfeltételek állását @L376 `tervbeli: terv.length, tervbeliAllo: terv.filter((a) => a.all).length,`
