---
source: core/i18n.ts
sha256: f9abca2c256e5a848c32f90db501aa4292ce10002f7883a931759e56d2711097
lines: 295
profile: code
generator: subagent
raw_tokens_est: 3610
verified: 17 confirmed
---

# core/i18n.ts

## Topics
- L1-56: a három nyelvi szint szabálya, Picked típus és a pick() visszaesési sorrendje
- L57-216: az L() olvasó és a felület saját szövegtára (UI kulcsok)
- L217-295: hiányzó fordítások kimutatása, t() helyőrzőkezelés, nyelvi lefedettség

## Claims

- [C1] [CONFIRMED] a felületi szövegnél a hiányzó kulcs build-hiba @L12 `lefordítjuk. Hiányzó kulcs = build-hiba.`
- [C2] [CONFIRMED] klinikai tartalomnál a hiányzó fordítás helyett a forrásnyelvi alak jelenik meg, megjelölve @L16 `forrásnyelvi alak jelenik meg — MEGJELÖLVE.`
- [C3] [CONFIRMED] a validált mérőeszköz tételszövege rögtönzött fordításban sehogy nem jelenik meg @L19 `rögtönzött alakban, sehogy.`
- [C4] [CONFIRMED] a forrásnyelv a magyar @L28 `export const SOURCE_LANG: Lang = "hu";`
- [C5] [CONFIRMED] `pick` a kért nyelv után a forrásnyelvet próbálja, fallback jelöléssel @L47 `const src = x?.[SOURCE_LANG];`
- [C6] [CONFIRMED] ha egyik nyelven sincs szöveg, üres stringet ad fallback jelölés NÉLKÜL @L53 `return { text: "", lang, fallback: false };`
- [C7] [CONFIRMED] `L()` a jelölés nélküli puszta szöveget adja, alapértelmezésben forrásnyelven @L57 `export function L(x: I18n | undefined, lang: Lang = SOURCE_LANG): string {`
- [C8] [CONFIRMED] a felület kimondja, hogy a rendszer nem fordít gépileg klinikai szöveget @L76 `"alak jelenik meg — a rendszer nem fordít gépileg klinikai szöveget.",`
- [C9] [CONFIRMED] a figyelmeztető szöveg szerint hitelesítés nincs: a cselekvőt ellenőrizetlen kérésfejléc állítja @L151 `hu: "Perzisztencia, jogosultság és auditnapló: ÉLES. HITELESÍTÉS: NINCS — a " +`
- [C10] [CONFIRMED] a phi címke azt jelenti, hogy a mező kimarad az exportokból @L171 `"tag.phi":              { hu: "phi — exportból kimarad", en: "phi — excluded from exports" },`
- [C11] [CONFIRMED] az összegző mondat egyetlen helyőrzős sztring, nem darabokból fűzött, a szórendkülönbség miatt @L184 `hu: "{touched} megérintett mező · {hidden} rejtve, mert a lelet normális · összesen {total}",`
- [C12] [CONFIRMED] `missingUiStrings` minden UI-kulcsot minden nyelvre ellenőriz @L238 `for (const lang of LANGS) if (!v[lang]) out.push({ key, lang });`
- [C13] [CONFIRMED] ismeretlen kulcsnál maga a kulcs jelenik meg, nem üres string @L253 `// láthatóan hiányzik, nem némán eltűnik`
- [C14] [CONFIRMED] az ismeretlen helyőrző a szövegben marad, nem tűnik el @L257 `k in vars ? String(vars[k]) : m);   // ismeretlen helyőrző MARAD, nem tűnik el`
- [C15] [CONFIRMED] a lefedettség nevezőjébe csak a nem üres I18n objektumok számítanak @L284 `const total = items.filter((x) => x && Object.keys(x).length).length;`
- [C16] [CONFIRMED] KAPU: a nyelv alapértelmezésben 90% alatti lefedettségnél nem használható, a forrásnyelv mindig az @L287 `const usable = lang === SOURCE_LANG || percent >= minPercent;`
- [C17] [CONFIRMED] a lefedettségi magyarázat a kért nyelven készül, nem forrásnyelven @L269 `A magyarázat A KÉRT NYELVEN — nem forrásnyelvi mondat.`
