---
source: core/derive/engine.ts
sha256: da66c6946ea568c66e957377acf1455ca374a044583bc191c3a907f6f0570488
lines: 322
profile: code
generator: subagent
raw_tokens_est: 3177
verified: 24 confirmed
---

# core/derive/engine.ts

## Topics
- L1-48: A három levezetési mechanizmus, prefill-javaslatok előállítása
- L49-90: Egy prefill-forrás kiértékelése: korábbi vizit, implikáció, átvétel
- L91-173: Újraszámítás topologikus sorrendben, táblakeresés, írási opciók
- L174-278: Az írási út kapui: tükör, computed, eredet, példány, egység
- L279-322: Tartomány- és kódszótár-ellenőrzés adattípusonként

## Claims

- [C1] [CONFIRMED] A prefill nem ír az értékekbe, csak javaslatot ad, amit a felhasználó elfogad vagy felülír @L19 `Prefill-javaslatok. NEM ír a`
- [C2] [CONFIRMED] Nem születik javaslat, ha már van elfogadott, nem prefill eredetű érték @L39 `if (existing.state === "ok" && existing.provenance !== "prefilled") continue;`
- [C3] [CONFIRMED] A források felsorolási sorrendje a precedencia: az első találó forrás nyer @L43 `if (s) { out.push(s); break; }        // az első találó forrás nyer (sorrend = precedencia)`
- [C4] [CONFIRMED] A korábbi vizitek közül az időben legfrissebb érték kerül javaslatra @L56 `const v = [...prev].sort((a, b) => Date.parse(b.t) - Date.parse(a.t))[0];`
- [C5] [CONFIRMED] A `maxAge`-nél régebbi korábbi vizit értékét nem javasolja @L60 `if (ms != null && age > ms) return null;   // túl régi: nem javasoljuk`
- [C6] [CONFIRMED] Az `implies` házirend akkor javasol rögzített értéket, ha a kiváltó forrás igaz vagy `pos` @L70 `if (trigger === true || trigger === "pos") {`
- [C7] [CONFIRMED] Egyéb házirendnél a forrás feloldott értékét veszi át változatlanul @L79 `const v = resolve(reg, state, src.source);`
- [C8] [CONFIRMED] Az újraszámítás nem mutálja az állapotot: új `CaseState`-et épít másolt értékekkel @L96 `const next: CaseState = { ...state, values: { ...state.values }, errors };`
- [C9] [CONFIRMED] Minden újraszámítás eldobja a korábbi `lookup:` előtagú hibákat @L95 `const errors = [...(state.errors ?? [])].filter((e) => !e.where.startsWith("lookup:"));`
- [C10] [CONFIRMED] A `ctx.now` értékét a motor tölti be minden újraszámítás elején, kézi bevitel helyett @L100 `next.values["ctx.now"] = [{`
- [C11] [CONFIRMED] A táblakeresés hibája nem néma: a `CaseState.errors` listába kerül @L117 `if (r.why) errors.push({ where: id, message: r.why });`
- [C12] [CONFIRMED] Sikertelen számításnál a korábbi érték törlődik, és nem lép a helyére nulla @L135 `delete next.values[id];             // nincs érték — és nem is nulla`
- [C13] [CONFIRMED] A levezetett érték `derived` eredetet és `estimated` megbízhatóságot kap @L141 `recordedAt: state.ctx.now, provenance: "derived", confidence: "estimated",`
- [C14] [CONFIRMED] Az írás a tükrözött azonosítót írás előtt a primer változóra oldja fel @L180 `const primary = reg.resolvePrimary(id);        // tükör feloldása írás előtt`
- [C15] [CONFIRMED] `computed` mezőre kézzel írni kivétel, és az üzenet felsorolja a bemeneteit @L182 `if (target.derivation?.kind === "computed") {`
- [C16] [CONFIRMED] Az eredet alapértelmezése `clinician`, és a `provenanceAllowed` lista kapuként működik @L200 `const prov = opts.provenance ?? "clinician";`
- [C17] [CONFIRMED] Az `unitFrom` mező kitöltetlensége az írást kivétellel elutasítja @L242 `if (u.state !== "ok" || typeof u.value !== "string") {`
- [C18] [CONFIRMED] Példányosított mezőre scope kötelező, nem példányosítottra viszont tilos @L232 `} else if (scope !== null) {`
- [C19] [CONFIRMED] A rögzítéskori osztályozási verziót a definícióból veszi; a hívó nem adhatja meg @L264 `codeSystemVersion: target.codeSystem?.version ?? null,`
- [C20] [CONFIRMED] Üres érték nem rögzíthető: a hiányzó adat nem érték @L280 `if (value == null) return "üres érték nem rögzíthető — a hiányzó adat nem érték";`
- [C21] [CONFIRMED] `quantity` típusnál a `domain.min` alatti érték elutasításra kerül @L287 `if (d?.min != null && value < d.min) return `
- [C22] [CONFIRMED] A `tristate` ugyanazon a kódszótár-ellenőrzésen megy át, mint a `coded` @L294 `if ((def.datatype === "coded" || def.datatype === "tristate") && def.valueSet) {`
- [C23] [CONFIRMED] `coded-multi` esetén minden listaelemnek szerepelnie kell a kódszótárban @L310 `const unknown = value.filter((v) => !codes.includes(v as never));`
- [C24] [CONFIRMED] `bool` típusnál csak valódi logikai érték fogadható el @L317 `if (def.datatype === "bool" && typeof value !== "boolean") {`
