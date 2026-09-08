---
source: core/riasztas/eszkalacio.ts
sha256: b74951cdc80f693c170778e6a7468efbebfbe03b24a6ec38c01ff00fbda4adbe
lines: 314
profile: code
generator: subagent
raw_tokens_est: 3092
verified: 15 confirmed, 1 needs_agent
---

# core/riasztas/eszkalacio.ts

## Topics
- L1-101: Miért kapuz a címzett hiánya, a lánc és a rend típusai, betöltés
- L102-169: tipusAllas — mikor adható ki egy riasztástípus egyáltalán
- L170-232: riasztasAllas és a szintszámítás az eltelt idő alapján
- L233-314: A rend integritás-ellenőrzése és az összesítő mérleg

## Claims

- [C1] [NEEDS_AGENT] itt a kapu megfordul: a hiányzó címzett nem a rossz számot, hanem a rendszer megszólalását akadályozza meg @semantic L24-33
- [C2] [CONFIRMED] a lánc legfelső szintjét kimondottan utolsónak kell jelölni, különben a riasztás örökké vándorolna @L56 `utolso?: boolean;`
- [C3] [CONFIRMED] a `loadRend` JSON-ból olvas és validálás nélkül castol @L78 `return JSON.parse(readFileSync(path, "utf8")) as EszkalaciosRend;`
- [C4] [CONFIRMED] a lezáratlan lánc külön állapot a címzett hiányától @L89 `| "lezaratlanLanc";`
- [C5] [CONFIRMED] lánc nélküli típusból nem adható ki riasztás @L107 `if (!t.lanc.length) {`
- [C6] [CONFIRMED] utolsónak jelölt szint nélkül a típus szintén nem kiadható @L116 `if (!t.lanc.some((x) => x.utolso)) {`
- [C7] [CONFIRMED] az eltelt idő percre kerekítve, ezredmásodpercből számolódik @L156 `Math.round((Date.parse(b) - Date.parse(a)) / 60000);`
- [C8] [CONFIRMED] nem kiadható típusnál az élő állás azonnal `nemAdhatoKi`, címzett nélkül @L176 `tipus: t.id, allapot: "nemAdhatoKi", szint: 0, cimzett: null, eltelt: 0,`
- [C9] [CONFIRMED] átvétel esetén a szint az átvételig eltelt időből számolódik, nem a mostani időből @L182 `const m = percek(kiadva, atveve);`
- [C10] [CONFIRMED] ha a lánc túlfutott az összes határidőn, az állapot `kimerult` @L191 `if (sz.tulFutott) {`
- [C11] [CONFIRMED] a szintek válaszhatáridői KUMULATÍVAN adódnak össze @L224 `hatar += sz.valaszHatarideoPerc;`
- [C12] [CONFIRMED] a címzettnek a rend `szerepek` szótárában megnevezett szerepkörnek kell lennie @L251 `if (!sz.cimzett?.trim() || !r.szerepek[sz.cimzett]) {`
- [C13] [CONFIRMED] pontosan egy szint lehet utolsónak jelölve @L270 `if (t.lanc.length && utolsok.length !== 1) {`
- [C14] [CONFIRMED] az utolsónak jelölt szintnek a legmagasabbnak kell lennie @L275 `} else if (utolsok.length === 1 && utolsok[0].szint !== Math.max(...szintek)) {`
- [C15] [CONFIRMED] az azonnali riasztás 30 percnél hosszabb első határideje csak figyelmeztetés @L281 `if (t.sulyossag === "azonnali" && elso && elso.valaszHatarideoPerc > 30) {`
- [C16] [CONFIRMED] a címzett nélküli típus figyelmeztetés, a lezáratlan lánc viszont hiba @L290 `out.push({ severity: a.allapot === "cimzettNelkul" ? "warning" : "error",`
