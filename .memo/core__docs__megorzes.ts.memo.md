---
source: core/docs/megorzes.ts
sha256: 5b09bdfa2331fa3b37503146833ccc5abeaf9af5433cde00bd4837f475b2d410
lines: 569
profile: code
generator: subagent
raw_tokens_est: 5737
verified: 28 confirmed
---

# core/docs/megorzes.ts

## Topics
- L1-129: mit javít ez a réteg, ISO időtartam-parszolás, dátumaritmetika, horgonytípusok
- L130-184: a lejárat kiszámítása horgonyból és időtartamból
- L185-252: a begépelt lejárat összevetése a kiszámolttal, jogszabályi horgonyszavak
- L253-347: horgonyeltérések, a normatív mag lenyomata, az aláírás alakja
- L348-424: hitelesítési állapot, primary alkalmazása, a próbafuttatás típusai
- L425-468: terv — mi menne törlésre, és miért nem
- L469-569: integritás-ellenőrzés, mérleg és kényelmi alak

## Claims

- [C1] [CONFIRMED] a megőrzési idő korábban sehol nem lett dátummá, a horgony-mező a típusdeklaráción kívül nem szerepelt @L9 `sehol a kódban nem lett dátummá`
- [C2] [CONFIRMED] a törlési kaput korábban egy kézzel beírt dátum igazolta, összevetés nélkül @L12 `a törlési motorban pedig a megőrzési idő leteltét egy KÉZZEL BEÍRT DÁTUM`
- [C3] [CONFIRMED] ma egyetlen dokumentumtípus sem `primary`, ezért semmi nem törölhető @L16 `Ma ezt elfedi, hogy egyetlen típus sem`
- [C4] [CONFIRMED] `parseIdotartam` a nulla hosszú időtartamot is elutasítja, nem csak a fel nem ismert alakot @L63 `if (t.ev === 0 && t.honap === 0 && t.nap === 0) return null;`
- [C5] [CONFIRMED] `hozzaad` a hónap végét túllépő napot a célhónap utolsó napjára húzza vissza @L76 `cel.setUTCDate(Math.min(d.getUTCDate(), utolso));`
- [C6] [CONFIRMED] a rendszer egyetlen hiányzó horgonyt sem pótol a mai dátummal @L91 `A rendszer egyiket sem pótolja a mai dátummal.`
- [C7] [CONFIRMED] értelmezhetetlen időtartamnál nem születik lejárat, mert a „0 év” azonnali megsemmisítést jelentene @L132 `if (!t) {`
- [C8] [CONFIRMED] hiányzó horgonynál az állapot hianyzoHorgony és a lejárat null @L141 `if (!alap) {`
- [C9] [CONFIRMED] megadás nélküli lejárat esetén az igazolás nem rendben @L189 `if (!allitott) {`
- [C10] [CONFIRMED] ha a kiszámolt lejárat nem ismert, a begépelt igazolás nem igazolható, tehát elutasított @L197 `if (l.allapot !== "ok" || !l.mikor) {`
- [C11] [CONFIRMED] a kiszámoltnál korábbi begépelt lejárat blokkol @L206 `if (Date.parse(l.mikor) > Date.parse(allitott)) {`
- [C12] [CONFIRMED] a jogszabályi idézetből szavak alapján ismeri fel a horgonyt, a „lezárás” és az „elbocsátás” recordClose-t jelent @L227 `{ szo: /lezárás|elbocsátás/i, horgony: "recordClose" },`
- [C13] [CONFIRMED] az eltérés csak akkor számít biztonságos irányúnak, ha a beállítás recordClose és az idézet dataEntry vagy creation @L260 `const hosszabb = r.from === "recordClose" &&`
- [C14] [CONFIRMED] `jogszabalyhely` az idézet gondolatjel előtti felét veszi, a leírást nem @L283 `return (source ?? "").split("—")[0].replace(/\s+/g, " ").trim();`
- [C15] [CONFIRMED] a normatív magból kimarad a verifiedNote és az idézet leíró fele, mert azok aláírásvesztés nélkül javíthatók @L290 `és az idézet leíró fele — azok javíthatók az`
- [C16] [CONFIRMED] a lenyomat a mag sha256-ának első 16 hexjegye @L305 `return createHash("sha256").update(mag, "utf8").digest("hex").slice(0, 16);`
- [C17] [CONFIRMED] az aláírásnak meg kell neveznie a hatályos jogszabályszöveget és a lekérdezés napját @L317 `A HATÁLYOS jogszabályszöveg, amivel összevetették — kiadással és a`
- [C18] [CONFIRMED] eltérő lenyomat esetén az állapot elavult: az aláírás nem fedezi a mostani időtartamot vagy horgonyt @L360 `if (h.lenyomat !== mag) {`
- [C19] [CONFIRMED] MELLÉKHATÁS: `alkalmaz` a hitelesített dokumentumok retention.verification mezőjét primary-ra írja át @L381 `(d.retention as { verification: string }).verification = "primary";`
- [C20] [CONFIRMED] a próbafuttatás soha nem töröl, és nincs is olyan ága, ami írna @L417 `A terv SOHA nem töröl, és nem is tud: nincs olyan ága, ami írna. Ez nem`
- [C21] [CONFIRMED] egy tétel csak akkor menne törlésre, ha a lejárat letelt ÉS a szabály alá van írva @L435 `const torolheto = lejart && alairt;`
- [C22] [CONFIRMED] az összefoglaló külön mutatja a lejárt, a még tartó és a nem számolható tételeket @L461 `${tetelek.filter((t) => !t.lejarat).length} nem számolható.`
- [C23] [CONFIRMED] nem létező dokumentumtípusra adott hitelesítés error @L477 `if (!ids.has(h.doc)) {`
- [C24] [CONFIRMED] a hiányzó vagy nem ÉÉÉÉ-HH-NN alakú `hatalyos` dátum error, mert a hatályosság dátumhoz kötött @L496 `if (!/^\d{4}-\d{2}-\d{2}$/.test(h.hatalyos ?? "")) {`
- [C25] [CONFIRMED] a megőrzési idő forrásának jogszabályhelyet kell azonosítania, a puszta leírás error @L510 `if (!JOGSZABALY.test(r.source ?? "")) {`
- [C26] [CONFIRMED] KAPU: az aláírás nélküli `primary` jelölés error — a kaput aláírás nyitja, nem jelölés @L522 `if (d.retention.verification === "primary" && a.allapot !== "hitelesitve") {`
- [C27] [CONFIRMED] a horgonyeltéréseket irányonként egyetlen ügyként csoportosítva jelzi, nem tételenként @L534 `A HORGONYELTÉRÉS EGY ÜGY, NEM TIZENHÁROM. Ugyanaz a kérdés áll minden`
- [C28] [CONFIRMED] a horgonyeltérés warning szintű, nem error @L546 `severity: "warning", id: cs.length === 1 ? e.doc : "doc.megorzes",`
