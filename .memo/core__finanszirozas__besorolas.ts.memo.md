---
source: core/finanszirozas/besorolas.ts
sha256: 8df39b671b171b01633f84add733655330c288d097a9615b352bbe54c8b7c732
lines: 442
profile: code
generator: subagent
raw_tokens_est: 4161
verified: 27 confirmed
---

# core/finanszirozas/besorolas.ts

## Topics
- L1-115: modulcél, háromállapotú besorolás, betöltött tábla típusai, szerepfelismerés
- L116-233: parseSzabaly rekurzív leszálló elemző, Eset/Talalat típusok, blokkfeloldás
- L234-262: egyetlen blokk teljesülésének eldöntése
- L263-315: kifejezés-kiértékelés és szabály nélküli csoport blokkjaiból épített szabály
- L316-374: ertekelCsoport — egy csoport megítélése egy esetre
- L375-442: névtelen blokkok kiértékelése, besorol és az elemzési lefedettség

## Claims

- [C1] [CONFIRMED] a besoroló szándékosan háromállapotú, mert a nem értett szabály kétállapotúként csendben rossz csoportot adna @L16 `EZÉRT A BESOROLÓ HÁROMÁLLAPOTÚ, nem kétállapotú:`
- [C2] [CONFIRMED] a réteg a jelölteket adja, nem a végszót: nem választ a találatok közül @L26 `AMIT EZ A RÉTEG NEM TESZ MEG. Nem választ a találatok közül. A rendelet`
- [C3] [CONFIRMED] `loadBesorolas` elutasítja a nem tbl.hbcs.besorolas azonosítójú fájlt @L79 `if (t.id !== "tbl.hbcs.besorolas") {`
- [C4] [CONFIRMED] a betöltés dob, ha a tábla forrásának sha256 lenyomata hiányzik — enélkül a visszamenőleges elszámolás nem reprodukálható @L82 `if (!t.source?.sha256) {`
- [C5] [CONFIRMED] a blokk `kizarva` jelzője azt jelenti, hogy a felsorolt kódlista tiltólista @L47 `…„az alább felsoroltak KIVÉTELÉVEL” — a lista tiltólista.`
- [C6] [CONFIRMED] a szerepet a szerepszó előtagjából regexek állapítják meg, a KEMOT/RADKEM/DAG mind kemoterápia @L106 `[/^(KEMOT|RADKEM|DAG)/i, "kemoterápia"],`
- [C7] [CONFIRMED] az elemzés csak akkor sikeres, ha a teljes szabályszöveget elfogyasztotta; részleges egyezésre null @L174 `return e && i === s.length ? e : null;`
- [C8] [CONFIRMED] ismeretlen szerepszóra az operandus-elemzés null-t ad, ami „nem értékelhető”-t eredményez @L139 `if (!szerep) return null;`
- [C9] [CONFIRMED] a diagnózisok közül az elsőt tekinti a rendelet fődiagnózisnak @L180 `BNO-kódok. Az elsőt a rendelet fődiagnózisnak tekinti.`
- [C10] [CONFIRMED] az állapot háromértékű: teljesül, nem teljesül, nem értékelhető @L188 `export type Allapot = "teljesül" | "nem teljesül" | "nem értékelhető";`
- [C11] [CONFIRMED] a helyi blokk csak akkor nyer a főcsoport közös blokkja felett, ha tartalma is van — a kód nélküli blokk mutató, nem üres lista @L223 `if (helyi && (helyi.kodok.length || helyi.barmely)) return helyi;`
- [C12] [CONFIRMED] a helyi blokk feltétele átöröklődik a főcsoportból vett közös listára @L227 `return helyi?.feltetel ? { ...kozos, feltetel: helyi.feltetel } : kozos;`
- [C13] [CONFIRMED] a feltételt hordozó blokk automatikusan „nem értékelhető”, mert a feltétel időbeli @L235 `if (b.feltetel) {`
- [C14] [CONFIRMED] a kódlista nélküli blokk „nem értékelhető”, mert a hiányzó lista nem „nem” @L246 `if (!b.kodok.length) {`
- [C15] [CONFIRMED] a `barmely` + `kizarva` blokk fordítva működik: talált kód esetén „nem teljesül” @L253 `if (b.barmely && b.kizarva) {`
- [C16] [CONFIRMED] ÉS-nél egyetlen hamis tag azonnal dönt, a bizonytalan csak utána jön sorra @L278 `if (rossz) return rossz;                       // egy hamis tag elég`
- [C17] [CONFIRMED] VAGY-nál az első teljesülő tag dönt, előtte a „nem értékelhető” nem érvényesül @L283 `const jo = reszek.find((r) => r.allapot === "teljesül");`
- [C18] [CONFIRMED] vegyes kötőszavú blokkfelsorolásnál nem találgat, hanem null-t ad @L306 `if (n > 0 && b.kotoszo === "vagy") return null;   // vegyes kötés: nem találgatunk`
- [C19] [CONFIRMED] szabálysor hiányában a blokkok ÉS-sel fűződnek egyetlen kifejezéssé @L308 `return jelolt.length ? { k: "és", tagok: jelolt } : null;`
- [C20] [CONFIRMED] ismeretlen HBCS-csoportkódra dob @L320 `if (!cs) throw new Error(`
- [C21] [CONFIRMED] a több, egymással nem összefűzött szabálysorral bíró csoport „nem értékelhető” @L323 `if (cs.szabalySorok.length > 1) {`
- [C22] [CONFIRMED] a géppel nem elemezhető szabályt nem találgatja meg, mert a félreértett szabály rossz finanszírozási tételt ad @L336 `miert: "a besorolási szabály nem elemezhető géppel — a rendszer NEM " +`
- [C23] [CONFIRMED] a kódot hordozó névtelen blokkok ÉS-sel bekerülnek a szabály kifejezésébe @L365 `kif = { k: "és", tagok: [kif, ...extra] };`
- [C24] [CONFIRMED] a `#n` alakú blokkhivatkozás a csoport blokklistájának indexére mutat @L379 `const b = cs.blokkok[Number(x.jel.slice(1))];`
- [C25] [CONFIRMED] `besorol` egyetlen főcsoportra szűkíthető @L419 `if (focsoport && cs.focsoport !== focsoport) continue;`
- [C26] [CONFIRMED] a „nem teljesül” eredmény egyik kimeneti listába sem kerül be, csak a vizsgált szám nő @L423 `else if (r.allapot === "nem értékelhető") nemErtekelheto.push(r);`
- [C27] [CONFIRMED] `elemzesiLefedettseg` üres esettel futtatja végig a csoportokat, és okonként számolja a kiértékelhetetlenséget @L434 `const ures: Eset = { diagnozisok: [], beavatkozasok: [] };`
