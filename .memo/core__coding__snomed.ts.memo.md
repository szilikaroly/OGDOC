---
source: core/coding/snomed.ts
sha256: 7c1185c8823478afdaabb79ced692342f601cbdcdb218f3d954ad89af7641301
lines: 245
profile: code
generator: subagent
raw_tokens_est: 2469
verified: 16 confirmed
---

# core/coding/snomed.ts

## Topics
- L1-74: A CC BY-ND licenc következményei, forrásmegjelölés, a helyi törzs betöltése
- L75-119: A telepítettség állapota és a megnevezés-típus nyelvi korlátja
- L120-155: Egy fogalom megnevezésének feloldása és a terjesztési licenc-ellenőrzés
- L156-245: Szemantikai címke az FSN-ből, nem klinikai főhierarchiák szűrése

## Claims

- [C1] [CONFIRMED] A SNOMED-törzs modulszintű, mutálható állapotban él @L43 `let TABLE: SnomedTable | null = null;`
- [C2] [CONFIRMED] A törzs alapértelmezett helye a `registry/kodok/helyi` könyvtár @L52 `export function loadSnomed(dir = "registry/kodok/helyi"): boolean {`
- [C3] [CONFIRMED] A betöltés a `tbl-snomed` előtagú JSON-t keresi, és hiányát `false`-szal jelzi, nem kivétellel @L54 `const f = readdirSync(dir).find((x) => x.startsWith("tbl-snomed") && x.endsWith(".json"));`
- [C4] [CONFIRMED] A `useSnomedTable` teszthez közvetlenül felülírja a modulállapotot @L63 `export function useSnomedTable(t: SnomedTable): void { TABLE = t; }`
- [C5] [CONFIRMED] A fogalmak száma a betöltött sorok kulcsainak száma @L90 `concepts: Object.keys(TABLE.rows).length,`
- [C6] [CONFIRMED] Telepített törzs mellett is `translation: "none"` — magyar megnevezést a rendszer nem ad @L91 `translation: "none", notice: SNOMED_NOTICE,`
- [C7] [CONFIRMED] A megnevezés nyelve soha nem lehet magyar @L106 `Milyen nyelven — SOHA nem`
- [C8] [CONFIRMED] A kötelező forrásmegjelölés minden megnevezés-válaszban benne van @L121 `const base = { id, notice: SNOMED_NOTICE };`
- [C9] [CONFIRMED] Törzs hiányában a megnevezés `null`, de az azonosító attól még érvényes és exportálható @L122 `if (!TABLE) {`
- [C10] [CONFIRMED] A GPS-ből hiányzó fogalom nem jelenti, hogy a fogalom nem létezik — a GPS részhalmaz @L132 `if (!row) {`
- [C11] [CONFIRMED] Magyar kérésre is angol megnevezés jön, `language: "en"` jelöléssel @L142 `...base, term: row.label, fsn: row.fsn, language: "en",`
- [C12] [CONFIRMED] A terjesztett könyvtárban talált „snomed” nevű fájl hibát vált ki, licencsértésként @L160 `const bad = readdirSync(distributedDir).filter((f) => /snomed/i.test(f));`
- [C13] [CONFIRMED] A szemantikai címke az FSN végén álló zárójeles rész @L187 `const m = /\(([^()]+)\)\s*$/.exec(fsn);`
- [C14] [CONFIRMED] A nem klinikai főhierarchiák listája szándékosan tiltó, nem megengedő @L199 `export const NON_CLINICAL_TAGS = [`
- [C15] [CONFIRMED] Telepítetlen készletnél a címkeellenőrzés `unknown` — ez nem jelent megfelelést @L226 `if (!TABLE) {`
- [C16] [CONFIRMED] A tiltólistán szereplő címke `nonClinical` státuszt ad @L236 `if ((NON_CLINICAL_TAGS as readonly string[]).includes(tag)) {`
