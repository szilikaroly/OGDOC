---
source: core/szepszis/screen.ts
sha256: 348e449317f70f143277dae728e1bb9a31428487db194d2e1524064595506623
lines: 347
profile: code
generator: subagent
raw_tokens_est: 3755
verified: 24 confirmed, 1 needs_agent
---

# core/szepszis/screen.ts

## Topics
- L1-50: protokollbetöltés, a vizsgálat élettani körülményei, a kritérium-összehasonlító
- L51-84: egyetlen kritérium kiértékelése és a nem értékelhető/hiányzó ágak
- L85-161: kritériumkészlet kiértékelése, a megítélés típusai, az alapból zárt riasztási kapu
- L162-275: az `assess` háromlépéses megítélés hatálytól a szepszisig
- L276-347: a protokoll integritás-ellenőrzése

## Claims

- [C1] [NEEDS_AGENT] A kritériumok adatból jönnek, nem kódból: egy küszöb módosításához nem kell kódot írni @semantic L4-6
- [C2] [CONFIRMED] A protokollt szinkron fájlolvasással, JSON-ból tölti be, séma-ellenőrzés nélkül @L18 `return JSON.parse(readFileSync(path, "utf8")) as SepsisProtocol;`
- [C3] [CONFIRMED] Ismeretlen terhességi állapotnál a szűrés nem fut @L23 `Ismeretlennél a szűrés NEM fut.`
- [C4] [CONFIRMED] Nem szám értéknél a numerikus összehasonlítás hamis, „nem szám” indoklással @L39 `if (n === null) return { ok: false, why: "nem szám" };`
- [C5] [CONFIRMED] Az `outside` művelet az alsó és felső határon kívüliséget vizsgálja @L46 `return { ok: n < (c.low as number) || n > (c.high as number),`
- [C6] [CONFIRMED] Vajúdás alatt a jelölt tétel nem értékelhető lesz, nem normális: a „normális” megnyugtatna @L58 `if (c.suspendDuring === "labour" && circ.inLabour) {`
- [C7] [CONFIRMED] A feloldatlan vagy üres érték `missing` állapotot ad, nem negatív tételt @L69 `if (r.state !== "ok" || r.value === null || r.value === undefined) {`
- [C8] [CONFIRMED] A kritérium címkéje a magyar felirat, tartalékban az azonosító @L54 `const label = c.label.hu ?? c.id;`
- [C9] [CONFIRMED] A készlet akkor pozitív, ha a teljesült tételek száma eléri a szükséges küszöböt @L91 `const positive = met >= set.needed;`
- [C10] [CONFIRMED] Az eredmény eldöntetlen, ha a hiányzó vagy nem értékelhető tételekkel a küszöb még elérhető lenne @L96 `const indeterminate = !positive && met + unknown >= set.needed;`
- [C11] [CONFIRMED] Hét szepszisállapot van, köztük az emberi válaszra váró góc-kérdés @L117 `| "awaitingSource"   // szűrőpozitív, de a góc kérdésére nincs emberi válasz`
- [C12] [CONFIRMED] A góc-gyanú `null` értéke nem „nincs góc”, hanem „még nem kérdeztük meg” @L139 `export type SourceSuspicion = { suspected: boolean; by: string; at: string } | null;`
- [C13] [CONFIRMED] Ha a hívó nem ad át riasztási kaput, a beépített zárt kapu lép életbe @L154 `const ZART: KapuAllapot = {`
- [C14] [CONFIRMED] A nem elsődleges hitelesítés hiányosságként bekerül a `gaps` felsorolásba @L170 `if (p.verification !== "primary") {`
- [C15] [CONFIRMED] Ismeretlen terhességi állapotnál a megítélés `notRun`, ha a protokoll megköveteli az állapotot @L180 `if (p.requiresPregnancyState && preg === "unknown") {`
- [C16] [CONFIRMED] A szűrő hatálya: terhes állapot, vagy a szülés óta a protokollban megadott napokon belül @L190 `const inScope = preg === "pos" || (pp !== null && pp <= p.postpartumWindowDays);`
- [C17] [CONFIRMED] Riasztás csak nyitott kapu ÉS nem blokkoló protokolljelölés mellett indul: a tiltás erősebb az engedélynél @L208 `const alerts = gate.engedve && !p.blocksAlerting;`
- [C18] [CONFIRMED] Ha a klinikus nemet mondott a gócra, az eredmény `screenNegative`, és a döntés a rekordban marad @L236 `if (!source.suspected) {`
- [C19] [CONFIRMED] Eldöntetlen szervi elégtelenségnél a szepszis nem zárható ki, az állapot `sepsisIndeterminate` @L257 `if (organ.indeterminate) {`
- [C20] [CONFIRMED] Ismeretlen változóra hivatkozó kritérium hiba, mert az elavult hivatkozás rosszabb a hiányzónál @L280 `if (!reg.get(c.var)) {`
- [C21] [CONFIRMED] A kritérium és a változó közti egységeltérés hiba, a néma átváltás miatt @L286 `if (c.unit && def.unit && c.unit !== def.unit) {`
- [C22] [CONFIRMED] Kettős számolás figyelmeztetés keletkezik, ha egy tétel változója a készlet másik tételéből levezetett @L303 `const overlap = inputs.filter((i) => vars.has(i));`
- [C23] [CONFIRMED] A tételek számánál nagyobb küszöb hiba, mert soha nem teljesülhet @L317 `if (set.needed > set.criteria.length) {`
- [C24] [CONFIRMED] A csomaglépések megelőzési és feltételes hivatkozásainak létező lépésre kell mutatniuk @L325 `if (ref && !ids.has(ref)) {`
- [C25] [CONFIRMED] Hitelesítetlen protokoll bekapcsolt riasztással hiba: a kapu előbb van, mint az adat @L337 `if (p.verification !== "primary" && !p.blocksAlerting) {`
