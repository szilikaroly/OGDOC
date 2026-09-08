---
source: core/journal/journal.ts
sha256: 47fee4383ec905ac365962b571616edefc0cefa3d0b1f29b6427f45b35828991
lines: 366
profile: code
generator: subagent
raw_tokens_est: 3850
verified: 20 confirmed, 1 needs_agent
---

# core/journal/journal.ts

## Topics
- L1-57: determinisztikus sorosítás, hashEntry, AppendInput
- L58-95: append — kötelező mezők és a lánchoz fűzés
- L96-123: ChainCheck típus és a négyféle romlás megkülönböztetése
- L124-219: verifyChain — sorszám-, lánc- és lenyomat-ellenőrzés
- L220-331: replay, Snapshot, snapshot, checkContinuation
- L332-366: restoreDrill — mért helyreállítási próba

## Claims

- [C1] [CONFIRMED] a `stable` a kulcsokat ábécébe rendezi és az `undefined` értékű kulcsokat elhagyja, hogy a lenyomat gépfüggetlen legyen @L26 `    (k) => (v as Record<string, unknown>)[k] !== undefined).sort();`
- [C2] [CONFIRMED] a `hashEntry` a `hash` mező nélküli bejegyzést hasheli, formátumverziós előtaggal @L32 `export function hashEntry(e: Omit<JournalEntry, "hash">): string {`
- [C3] [CONFIRMED] az `append` üres vagy hiányzó cselekvő esetén kivételt dob @L59 `  if (!input.actor?.trim()) {`
- [C4] [CONFIRMED] az `erase` művelet indoklás nélkül nem rögzíthető — az `append` dob @L66 `  if (input.op === "erase" && !input.reason?.trim()) {`
- [C5] [CONFIRMED] a `write` művelethez változó és érték is kell, különben kivétel @L73 `  if (input.op === "write" && (!input.variableId || !input.value)) {`
- [C6] [CONFIRMED] az első bejegyzés `prevHash`-e a `GENESIS`, a sorszám 1-től indul @L85 `    prevHash: prev ? prev.hash : GENESIS,`
- [C7] [CONFIRMED] az `append` nem módosít helyben: új tömböt ad vissza a kiegészített bejegyzéssel @L91 `  return [...log, { ...base, hash: hashEntry(base) }];`
- [C8] [CONFIRMED] a `ChainCheck.kind` hatféle kimenetet különböztet meg, mert mindegyikhez más teendő tartozik @L100 `  kind: "ok" | "tampered" | "gap" | "reordered" | "brokenLink" | "empty";`
- [C9] [CONFIRMED] a dokumentáció kimondja, hogy a levágott véget a láncellenőrzés nem tudja kimutatni, ahhoz a naplón kívüli `Horgony` kell @L120 `* nincs olyan adat, amiből a hiányzó vég kiderülhetne. Ehhez a `Horgony` kell,`  <!-- anchored from @semantic -->
- [C10] [CONFIRMED] a `verifyChain` alapértelmezett kiindulása `GENESIS` és 0. sorszám @L125 `  log: JournalEntry[], from: { prevHash: string; prevSeq: number } = { prevHash: GENESIS, prevSeq: 0 },`
- [C11] [CONFIRMED] az üres napló érvényes állapot: `ok: true`, `kind: "empty"` @L128 `    return { ok: true, brokenAt: null, kind: "empty",`
- [C12] [NEEDS_AGENT] a sorszám-ellenőrzés az egész naplóra előbb fut, mint a lánc- és lenyomat-ellenőrzés @semantic L133-168
- [C13] [CONFIRMED] hiánytalan, de nem növekvő sorszámsor `reordered`-et ad, mert az újrarendezhető, nem újrakérendő @L143 `  if (contiguous && !ascending) {`
- [C14] [CONFIRMED] az ismétlődő sorszám is a `gap` fajtába kerül, külön indoklással @L158 `    const dup = sorted.filter((v, i) => i > 0 && v === sorted[i - 1]);`
- [C15] [CONFIRMED] a lenyomat-eltérés `tampered`-et ad, és a `hash` mezőt kivéve újraszámolt lenyomattal ellenőriz @L182 `    if (hashEntry(rest) !== hash) {`
- [C16] [CONFIRMED] a `replay` alapból az egész naplót játssza vissza, a kontextus kezdőértéke `ambulatory` @L223 `  let ctx: CaseState["ctx"] = { encounter: "ambulatory", now: "" };`
- [C17] [CONFIRMED] az `erase` a visszajátszáskor törli a változó összes értékét, de a törlés tényét külön listába teszi @L237 `      delete values[e.variableId];`
- [C18] [CONFIRMED] üres `ctx.now` esetén a `replay` az utolsó bejegyzés idejét veszi át @L242 `  if (!ctx.now && log.length) ctx = { ...ctx, now: log[log.length - 1].at };`
- [C19] [CONFIRMED] a `snapshot` a sírköveket is beleteszi a pillanatképbe, hogy a tömörítés ne támassza fel a törölt adatot @L265 `  erased: ReplayResult["erased"];`
- [C20] [CONFIRMED] a `checkContinuation` hézagot jelez, ha a folytatás első sorszáma nem a `throughSeq + 1` @L296 `  if (first.seq !== snap.throughSeq + 1) {`
- [C21] [CONFIRMED] a `restoreDrill` az időmérést befecskendezhető órával végzi, alapból `Date.now` @L333 `  log: JournalEntry[], expected: CaseState, now: () => number = () => Date.now(),`
- [C22] [CONFIRMED] a próba az értékeket a determinisztikus `stable` sorosítással veti össze a várt állapottal, változónként és indexenként @L350 `if (stable(a[i]) !== stable(b[i])) mismatches.push(`${id}[${i}]: eltérő érték`);`  <!-- anchored from @semantic -->
- [C23] [CONFIRMED] a próba csak akkor sikeres, ha a lánc ép ÉS nincs egyetlen eltérés sem @L354 `  const ok = chain.ok && mismatches.length === 0;`
