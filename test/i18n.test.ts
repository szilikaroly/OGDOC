/**
 * NYELVEK — és a szabály, ami miatt ez nem egy `??` operátor.
 *
 * A rendszer 846 változójából ma 30-nak van angol címkéje. A tesztek azt
 * védik, hogy ez a hiány LÁTSZÓDJON: egy csendes visszaesés a forrásnyelvre
 * azt adná, hogy a felhasználó „angol” felületet lát magyar tartalommal, és
 * nem tudja, melyik szó melyik.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { loadRegistry } from "../core/load.ts";
import { buildFormSpec } from "../core/ui/formspec.ts";
import { coverage, LANGS, missingUiStrings, pick, SOURCE_LANG, t, UI } from "../core/i18n.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REG = loadRegistry(join(HERE, "..", "registry", "variables"));

/* ── 1. A FELÜLET SAJÁT SZÖVEGE A MIÉNK — TEHÁT LEFORDÍTJUK ─────────── */

test("MINDEN felületi kulcs megvan MINDEN nyelven — a hiány itt HIBA", () => {
  // Nem „hiányosság”, hanem hiba: a gombfelirat a mi szövegünk, nem szakmai
  // tartalom. Ha hiányzik, nem fordítási kérdés — elfelejtettük.
  assert.deepEqual(missingUiStrings(), []);
});

test("ismeretlen kulcs LÁTHATÓAN hiányzik, nem némán tűnik el", () => {
  assert.equal(t("nincs.ilyen.kulcs", "hu"), "⟨nincs.ilyen.kulcs⟩");
});

test("a felületi szöveg mindkét nyelven érdemi", () => {
  assert.equal(t("form.save", "hu"), "Mentés");
  assert.equal(t("form.save", "en"), "Save");
  assert.notEqual(UI["finding.impossible"].en, UI["finding.impossible"].hu);
});

/* ── 2. A KLINIKAI TARTALOM NEM FORDÍTÓDIK GÉPILEG ──────────────────── */

test("a kért nyelvű alak jelöletlenül jön", () => {
  const p = pick({ hu: "Méhmagasság", en: "Fundal height" }, "en");
  assert.equal(p.text, "Fundal height");
  assert.equal(p.fallback, false);
});

test("a hiányzó fordítás FORRÁSNYELVI ALAKOT ad, MEGJELÖLVE", () => {
  const p = pick({ hu: "Méhmagasság" }, "en");
  assert.equal(p.text, "Méhmagasság");
  assert.equal(p.lang, "hu");
  assert.equal(p.fallback, true, "jelölés nélkül a felhasználó nem tudná, mit lát");
});

test("üres szótárnál nincs kitalált szöveg", () => {
  assert.equal(pick(undefined, "en").text, "");
  assert.equal(pick({}, "en").fallback, false);
});

/* ── 3. AZ ŰRLAP TOVÁBBADJA A JELÖLÉST ──────────────────────────────── */

test("magyarul semmi nem forrásnyelvi jelölésű", () => {
  const f = buildFormSpec(REG, "hu").flatMap((s) => s.fields);
  assert.equal(f.filter((x) => x.labelFallback).length, 0);
  assert.equal(f.filter((x) => x.optionsFallback).length, 0);
});

test("angolul a le nem fordított mezők MIND jelölve vannak", () => {
  const f = buildFormSpec(REG, "en").flatMap((x) => x.fields);
  assert.ok(f.filter((x) => x.labelFallback).length > 700,
    "ma a legtöbb változónak nincs angol címkéje — ennek látszania kell");
  const en = REG.all().find((d) => d.label.en && !d.aliasOf)!;
  const spec = f.find((x) => x.id === en.id);
  if (spec) assert.notEqual(spec.labelFallback, true);
});

test("a félig fordított LEGÖRDÜLŐ is jelölve van", () => {
  // Egy legördülő, aminek fele angol, fele magyar, rosszabb a következetesen
  // forrásnyelvinél — mert az elsőnél a felhasználó azt hiszi, érti.
  const f = buildFormSpec(REG, "en").flatMap((x) => x.fields);
  assert.ok(f.some((x) => x.optionsFallback));
});

/* ── 4. A LEFEDETTSÉG KIMONDVA ──────────────────────────────────────── */

test("a forrásnyelv mindig használható", () => {
  assert.equal(coverage(REG.all().map((d) => d.label), SOURCE_LANG).usable, true);
});

test("a néhány százalékosan lefordított nyelv NEM „részben angol” felület", () => {
  const c = coverage(REG.all().map((d) => d.label), "en");
  assert.equal(c.usable, false);
  assert.ok(c.percent < 90);
  assert.match(c.why, /source-language interface with en buttons/);
  assert.match(c.why, /MARKED/);
});

/**
 * A FIGYELMEZTETÉS A KÉRT NYELVEN SZÓL.
 *
 * Ez nem stílus kérdése. Egy magyarul kiírt „csak 4% van lefordítva” üzenet
 * az angol felületen IGAZOLJA is, amit állít — de az olvasó nem érti meg,
 * tehát a figyelmeztetés nem ér semmit. Aki nem tud magyarul, pont az, akinek
 * ez az üzenet szól.
 */
test("a lefedettségi figyelmeztetés A KÉRT NYELVEN szól, nem forrásnyelven", () => {
  const items = REG.all().map((d) => d.label);
  const en = coverage(items, "en").why;
  const hu = coverage(items, "hu").why;
  assert.ok(!/[áéíóöőúüű]/.test(en), `az angol figyelmeztetés magyar maradt: ${en}`);
  assert.notEqual(en, hu);
  // és a számok tényleg behelyettesítődtek — nem maradt nyers helyőrző
  assert.ok(!/\{\w+\}/.test(en), en);
});

test("a küszöb fölött a nyelv használhatóvá válik", () => {
  const items = Array.from({ length: 100 }, (_, i) =>
    i < 95 ? { hu: "a", en: "b" } : { hu: "a" });
  const c = coverage(items, "en", 90);
  assert.equal(c.percent, 95);
  assert.equal(c.usable, true);
});

test("a felkínált nyelvek listája zárt — ismeretlen nyelvre nem találgatunk", () => {
  assert.deepEqual(LANGS, ["hu", "en"]);
  assert.equal(SOURCE_LANG, "hu");
});

/* ══ A FELÜLET MINDEN LÁTHATÓ SZÖVEGE A SZÓTÁRBÓL JÖN ═════════════════
 *
 * A fordítás nem akkor „aktív”, ha van nyelvválasztó, hanem akkor, ha
 * NINCS beégetett szöveg. Egy magyarul beírt gombfelirat nyelvváltás után
 * is magyar marad — és mivel a felület többi része angol lesz, a
 * felhasználó azt hiszi, ez egy szakkifejezés, nem egy kifelejtett kulcs.
 *
 * Ez a teszt ezért a FORRÁSFÁJLOKAT olvassa: magyar ékezetes szöveg a
 * felület megjelenített részén csak `data-i18n`-nel vagy `T(...)`-vel
 * kerülhet ki. Ami a szótárban van, az fordítható; ami nincs, az nem.
 */
import { readFileSync } from "node:fs";

const WEB = join(HERE, "..", "web", "public");
const ACCENT = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;

test("az index.html minden látható szövege data-i18n mögött van", () => {
  const html = readFileSync(join(WEB, "index.html"), "utf8");
  const offenders: string[] = [];
  // minden elemnyitás + a hozzá tartozó szöveg, egy szinten
  for (const m of html.matchAll(/<(h1|h2|p|button|label|option|span|small|strong)\b([^>]*)>([^<]+)</g)) {
    const [, tag, attrs, text] = m;
    if (!ACCENT.test(text)) continue;
    if (/data-i18n/.test(attrs)) continue;
    // a szülő is hordozhatja a kulcsot (a textContent felülírja a gyereket is)
    const before = html.slice(0, m.index);
    const openParent = before.lastIndexOf("data-i18n=");
    const closeSince = before.slice(openParent).match(/<\/(h1|h2|p|button|label)>/);
    if (openParent !== -1 && !closeSince) continue;
    offenders.push(`<${tag}> „${text.trim().slice(0, 50)}”`);
  }
  assert.deepEqual(offenders, [],
    "beégetett magyar szöveg a felületen — nyelvváltás után is magyar maradna");
});

test("az app.js nem ír ki beégetett magyar szöveget", () => {
  const js = readFileSync(join(WEB, "app.js"), "utf8");
  const offenders: string[] = [];
  for (const line of js.split("\n")) {
    const code = line.replace(/^\s*\/\/.*/, "").replace(/^\s*\*.*/, "");
    if (!ACCENT.test(code)) continue;
    // a megjelenítésbe kerülő stringek: textContent / innerHTML / append / title
    if (!/(textContent|innerHTML|\.title|append|placeholder)\s*[=(]/.test(code)) continue;
    // string-literál ékezettel, ami nem T(...) hívás eredménye
    const lits = code.match(/["'`][^"'`]*[áéíóöőúüűÁÉÍÓÖŐÚÜŰ][^"'`]*["'`]/g) ?? [];
    for (const lit of lits) offenders.push(lit.slice(0, 60));
  }
  assert.deepEqual(offenders, [],
    "beégetett magyar szöveg az app.js megjelenítő ágán — a szótárba való");
});

test("a t() helyőrzőt tölt — mindkét nyelven, a saját szórendje szerint", () => {
  const hu = t("effort.summary", "hu", { touched: 12, hidden: 40, total: 834 });
  const en = t("effort.summary", "en", { touched: 12, hidden: 40, total: 834 });
  for (const s of [hu, en]) {
    assert.ok(s.includes("12") && s.includes("40") && s.includes("834"));
    assert.ok(!/\{\w+\}/.test(s), `maradt kitöltetlen helyőrző: ${s}`);
  }
  // ÉS a szórend tényleg eltér — ezért nem fűzhetünk össze darabokat
  assert.ok(hu.indexOf("834") > hu.indexOf("összesen"), "magyarul: „összesen 834”");
  assert.ok(en.indexOf("834") < en.indexOf("in total"), "angolul: „834 in total”");
});

test("az ISMERETLEN helyőrző megmarad — nem tűnik el némán", () => {
  const key = "teszt.helyorzo";
  UI[key] = { hu: "a {van} és a {nincs}", en: "the {van} and the {nincs}" };
  try {
    const out = t(key, "hu", { van: "X" });
    assert.ok(out.includes("X"));
    assert.match(out, /\{nincs\}/,
      "a ki nem töltött helyőrző LÁTSZIK — ugyanaz az elv, mint a ⟨kulcs⟩ alaknál");
  } finally {
    delete UI[key];
  }
});

test("a t() a helyőrző nélküli kulcsot változatlanul adja vissza", () => {
  assert.equal(t("calc.title", "en", { akármi: 1 }), UI["calc.title"].en);
});
