---
source: core/journal/types.ts
sha256: 38ed76696d6a59f1eadcc1f9b9df2a7ef89692899d3ec55e17d482c330806eb1
lines: 187
profile: code
generator: subagent
raw_tokens_est: 1926
verified: 12 confirmed
---

# core/journal/types.ts

## Topics
- L1-51: a napló mint rekord, négy szerkezeti döntés, JOURNAL_FORMAT és JournalOp
- L52-160: JournalEntry, GENESIS, Horgony, Durability, replikációs állapot típusai
- L161-187: replicationLag — a lemaradás mint klinikai adat

## Claims

- [C1] [CONFIRMED] az állapot a napló vetülete, és eltérés esetén a napló nyer @L10 ` * Ha a kettő eltér, a NAPLÓ nyer. Ez nem ízlés kérdése: egy állapotot`
- [C2] [CONFIRMED] a naplóformátum verziószáma 1 @L42 `export const JOURNAL_FORMAT = 1;`
- [C3] [CONFIRMED] pontosan három művelet létezik: `write`, `erase`, `context` @L46 `| "write"`
- [C4] [CONFIRMED] a sorrendet a `seq` dönti el, az `at` faliórai idő csak tájékoztató @L53 `  /** MONOTON, HÉZAGMENTES. A sorrend ezen áll. */`
- [C5] [CONFIRMED] a `GENESIS` szándékosan nem üres string, mert az üres érték elgépelésből is előáll @L84 `export const GENESIS = "genesis";`
- [C6] [CONFIRMED] a `Horgony` a napló végét a naplón kívül rögzíti: caseId, seq, hash és időpont @L98 `export interface Horgony {`
- [C7] [CONFIRMED] a `Durability` három fokozatú: `buffered`, `local`, `replicated` @L118 `export type Durability =`
- [C8] [CONFIRMED] a „mentve" csak `local` vagy `replicated` tartósságnál írható ki a felhasználónak @L128 `  return d === "local" || d === "replicated";`
- [C9] [CONFIRMED] a `LagReport.secondsBehind` a valódi RPO-t jelöli — mennyi munka veszne el most @L148 `  secondsBehind: number;`
- [C10] [CONFIRMED] a lemaradás a helyi és a nyugtázott sorszám különbsége; nem pozitív érték esetén naprakészt jelent @L164 `  const entriesBehind = st.localSeq - st.remoteSeq;`
- [C11] [CONFIRMED] az időbeli lemaradás az ELSŐ nem nyugtázott bejegyzéstől mérendő, ezért a `remoteAt`, hiányában a `localAt` a kiindulás @L173 `  const from = st.remoteAt ?? st.localAt;`
- [C12] [CONFIRMED] az RPO teljesülése a másodpercben mért lemaradás és a vállalt küszöb összehasonlítása @L175 `  const withinRpo = secondsBehind <= rpoSeconds;`
