/**
 * A 326 SZABÁLY DÖNTÉSSÉ TÉTELE — 3. lépés.
 *
 * Amit ezek a tesztek bizonyítanak, az nem az, hogy a döntések jók. Azt gépből
 * nem lehet. Azt bizonyítják, hogy DÖNTÉS NÉLKÜL SEMMI NEM CSÚSZIK ÁT, és hogy
 * egy aláírás nem él túl olyan szabályváltozást, amit nem írtak alá.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync } from "node:fs";

import { loadRegistry } from "../core/load.ts";
import { auditFields, loadUiMap } from "../core/ui/felulet.ts";
import type { FieldAudit } from "../core/ui/felulet.ts";
import {
  dontesAllapot, dontendo, lenyomat, loadDontesek, loadSzabalyok, merleg,
  validateDontesek,
} from "../core/ui/dontes.ts";
import type { Dontes, SzabalyKatalogus } from "../core/ui/dontes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const R = (...p: string[]) => join(HERE, "..", ...p);

const REG = loadRegistry(R("registry", "variables"));
const AUDITS = readdirSync(R("registry", "felulet"))
  .filter((f) => f.endsWith("-felulet.json"))
  .flatMap((f) => auditFields(loadUiMap(R("registry", "felulet", f)), REG));
const KAT = loadSzabalyok(R("registry", "felulet", "dontes-szabalyok.json"));
const DONTESEK = loadDontesek(R("registry", "felulet", "dontesek.json"));

const DONTENDO = AUDITS.filter(dontendo);
/** Egy szabály, ami sok mezőt érint — a szabályszintű döntés próbája. */
const PELDA = "orderTracking";

/** Aláírás minden megkövetelt szereppel, a mai lenyomattal. */
function teljesDontes(rule: string, over: Partial<Dontes> = {}): Dontes {
  const s = KAT.szabalyok.find((x) => x.rule === rule)!;
  return {
    rule,
    fajta: s.javaslat,
    indoklas: "Próbadöntés — tesztadat.",
    ...(s.javaslat === "atalakitva" ? { atalakitas: s.mit } : {}),
    alairok: s.kell.map((r) => ({ nev: "Teszt Aláíró", szerep: r, datum: "2026-09-05" })),
    lenyomat: lenyomat(s.lenyeg),
    ...over,
  };
}

/* ── 1. A MÉRLEG ────────────────────────────────────────────────────── */

test("a döntendő mezők száma a felülettérképből jön, nem kézből", () => {
  // 95 `refused` + 231 `gate`. Ha a térkép változik, ez a szám vele változik —
  // a tesztnek nem szabad egy bebetonozott 326-ot állítania.
  const refused = AUDITS.filter((a) => a.status === "refused").length;
  const gate = AUDITS.filter((a) => a.status === "gate").length;
  assert.equal(DONTENDO.length, refused + gate);
  assert.ok(DONTENDO.length > 0);
});

test("csak a `refused` és a `gate` kíván döntést", () => {
  for (const a of AUDITS) {
    assert.equal(dontendo(a), a.status === "refused" || a.status === "gate");
  }
});

test("minden döntendő szabálynak van katalógustétele", () => {
  // Ez a lényegi kapu: egy ÚJ szabály nem szólalhat meg úgy, hogy senki nem
  // dönt róla. A hiány itt hiba, nem figyelmeztetés.
  const hasznalt = new Set(DONTENDO.map((a) => a.rule));
  const van = new Set(KAT.szabalyok.map((s) => s.rule));
  assert.deepEqual([...hasznalt].filter((r) => !van.has(r)), []);
});

test("a katalógusban nincs olyan szabály, ami sehol nem szólal meg", () => {
  const hasznalt = new Set(DONTENDO.map((a) => a.rule));
  assert.deepEqual(KAT.szabalyok.map((s) => s.rule).filter((r) => !hasznalt.has(r)), []);
});

test("a mai regiszter hiba nélkül validál", () => {
  const hibak = validateDontesek(AUDITS, KAT, DONTESEK)
    .filter((i) => i.severity === "error");
  assert.deepEqual(hibak, []);
});

/* ── 2. A HIÁNYZÓ DÖNTÉS SEHOL NEM „ÁTVESSZÜK” ──────────────────────── */

test("üres döntésregiszterrel EGY mező sem kerül át", () => {
  const st = dontesAllapot(AUDITS, KAT, []);
  assert.equal(st.length, DONTENDO.length);
  assert.deepEqual(st.filter((x) => x.atkerul), []);
  assert.equal(merleg(st, KAT).eldontetlen, DONTENDO.length);
});

test("a katalógusból hiányzó szabály mezői sem kerülnek át", () => {
  // Nem hibaüzenetre bízzuk: a hiányzó katalógustétel ATTÓL zár, hogy a
  // döntési állapot `eldontetlen`, nem attól, hogy valaki elolvassa a hibát.
  const csonka: SzabalyKatalogus = {
    szerepek: KAT.szerepek,
    szabalyok: KAT.szabalyok.filter((s) => s.rule !== PELDA),
  };
  const st = dontesAllapot(AUDITS, csonka, [teljesDontes(PELDA)]);
  const erintett = st.filter((x) => x.rule === PELDA);
  assert.ok(erintett.length > 0);
  assert.deepEqual(erintett.filter((x) => x.atkerul), []);
  assert.equal(erintett[0].allapot, "eldontetlen");
});

/* ── 3. AZ ALÁÍRT DÖNTÉS ────────────────────────────────────────────── */

test("egy szabályszintű döntés a szabály MINDEN mezőjére szól", () => {
  const st = dontesAllapot(AUDITS, KAT, [teljesDontes(PELDA)]);
  const erintett = st.filter((x) => x.rule === PELDA);
  assert.ok(erintett.length > 1, "a próbaszabálynak több mezője van");
  assert.ok(erintett.every((x) => x.allapot === "dontve" && x.szint === "rule"));
  assert.ok(erintett.every((x) => x.atkerul));
  // …és semmi másra nem szól.
  assert.ok(st.filter((x) => x.rule !== PELDA).every((x) => x.allapot === "eldontetlen"));
});

test("a „nem vesszük át” is DÖNTÉS — eldöntött, de nem kerül át", () => {
  const st = dontesAllapot(AUDITS, KAT, [
    teljesDontes(PELDA, { fajta: "nem", atalakitas: undefined }),
  ]);
  const e = st.filter((x) => x.rule === PELDA);
  assert.ok(e.every((x) => x.allapot === "dontve"));
  assert.ok(e.every((x) => !x.atkerul));
  assert.equal(merleg(st, KAT).dontve, e.length);
  assert.equal(merleg(st, KAT).atkerul, 0);
});

test("a mezőszintű döntés erősebb a szabályszintűnél", () => {
  const mezo = DONTENDO.find((a) => a.rule === PELDA)!;
  const st = dontesAllapot(AUDITS, KAT, [
    teljesDontes(PELDA),
    teljesDontes(PELDA, {
      form: mezo.form, field: mezo.field, fajta: "nem", atalakitas: undefined,
    }),
  ]);
  const kivetel = st.find((x) => x.form === mezo.form && x.field === mezo.field)!;
  assert.equal(kivetel.szint, "mezo");
  assert.equal(kivetel.fajta, "nem");
  assert.equal(kivetel.atkerul, false);
  // A többi mezőre a szabály döntése él tovább.
  const tobbi = st.filter((x) => x.rule === PELDA && x !== kivetel);
  assert.ok(tobbi.every((x) => x.szint === "rule" && x.atkerul));
});

/* ── 4. AZ ALÁÍRÁS AHHOZ KÖTŐDIK, AMIT ALÁÍRTAK ─────────────────────── */

test("a szabály mondatának megváltozása ELAVULTTÁ teszi a döntést", () => {
  // Ez a teszt a hiba BEVITELÉVEL bizonyít: átfogalmazzuk a normatív magot,
  // és megnézzük, hogy a régi aláírás tényleg nem él tovább.
  const dontes = teljesDontes(PELDA);
  const atirt: SzabalyKatalogus = {
    szerepek: KAT.szerepek,
    szabalyok: KAT.szabalyok.map((s) =>
      s.rule === PELDA ? { ...s, lenyeg: s.lenyeg + " (átfogalmazva)" } : s),
  };
  const st = dontesAllapot(AUDITS, atirt, [dontes]);
  const e = st.filter((x) => x.rule === PELDA);
  assert.ok(e.every((x) => x.allapot === "elavult"));
  assert.ok(e.every((x) => !x.atkerul), "elavult döntéssel nem kerül át semmi");
  assert.match(e[0].miert, /megváltozott/);
  // De nem felejtjük el, ki és mikor írta alá — az újradöntés más munka.
  assert.equal(e[0].dontes?.alairok[0].nev, "Teszt Aláíró");
});

test("a puszta szóközváltozás is elavulttá tesz — nincs „lényegében ugyanaz”", () => {
  const s = KAT.szabalyok.find((x) => x.rule === PELDA)!;
  assert.notEqual(lenyomat(s.lenyeg), lenyomat(s.lenyeg + " "));
});

test("hiányzó szerep aláírása HIÁNYOSSÁ teszi a döntést", () => {
  const tobbSzereps = KAT.szabalyok.find((s) => s.kell.length > 1)!;
  const d = teljesDontes(tobbSzereps.rule);
  d.alairok = d.alairok.slice(0, 1);
  const st = dontesAllapot(AUDITS, KAT, [d]);
  const e = st.filter((x) => x.rule === tobbSzereps.rule);
  assert.ok(e.length > 0);
  assert.ok(e.every((x) => x.allapot === "hianyos"));
  assert.ok(e.every((x) => !x.atkerul));
  assert.match(e[0].miert, /Hiányzó aláírás/);
});

/* ── 5. A DÖNTÉS TELJESSÉGE ─────────────────────────────────────────── */

const rossz: [string, Dontes][] = [
  ["indoklás nélkül", teljesDontes(PELDA, { indoklas: "  " })],
  ["aláíró nélkül", teljesDontes(PELDA, { alairok: [] })],
  ["névtelen aláírással",
    teljesDontes(PELDA, { alairok: [{ nev: "", szerep: "klinikus", datum: "2026-09-05" }] })],
  ["ismeretlen szereppel",
    teljesDontes(PELDA, { alairok: [{ nev: "X", szerep: "portas", datum: "2026-09-05" }] })],
  ["hibás dátummal",
    teljesDontes(PELDA, { alairok: [{ nev: "X", szerep: "klinikus", datum: "2026.09.05" }] })],
  ["nem létező szabályra", teljesDontes(PELDA, { rule: "nincsIlyenSzabaly" })],
  ["ismeretlen döntésfajtával",
    teljesDontes(PELDA, { fajta: "talan" as unknown as Dontes["fajta"] })],
];

for (const [mi, d] of rossz) {
  test(`hibaként bukik el: döntés ${mi}`, () => {
    const hibak = validateDontesek(AUDITS, KAT, [d]).filter((i) => i.severity === "error");
    assert.ok(hibak.length > 0, `${mi}: nem lett hiba`);
  });
}

test("az „átalakítva” döntés megmondja, MIVÉ — enélkül hiba", () => {
  // Az „átalakítva vesszük át” a döntés fele. A másik fele az, mivé — enélkül
  // az „átalakítva” annyit tesz, „majd valahogy”.
  const d = teljesDontes(PELDA, { fajta: "atalakitva", atalakitas: "   " });
  const hibak = validateDontesek(AUDITS, KAT, [d]).filter((i) => i.severity === "error");
  assert.equal(hibak.length, 1);
  assert.match(hibak[0].message, /mivé/);
});

test("ugyanarra kétszer született döntés hiba", () => {
  const hibak = validateDontesek(AUDITS, KAT, [teljesDontes(PELDA), teljesDontes(PELDA)])
    .filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /kétszer/.test(h.message)));
});

test("döntés olyan mezőre, ami nem kíván döntést — hiba", () => {
  const mapped = AUDITS.find((a) => a.status === "mapped")!;
  const d = teljesDontes(PELDA, { form: mapped.form, field: mapped.field });
  const hibak = validateDontesek(AUDITS, KAT, [d]).filter((i) => i.severity === "error");
  assert.ok(hibak.some((h) => /nem kíván döntést/.test(h.message)));
});

/* ── 6. A KATALÓGUS ÉPSÉGE ──────────────────────────────────────────── */

test("minden szabálynak van normatív magja, javaslata és aláírója", () => {
  for (const s of KAT.szabalyok) {
    assert.ok(s.lenyeg.trim().length > 20, `${s.rule}: üres vagy csonka normatív mag`);
    assert.ok(s.cim.trim(), `${s.rule}: nincs cím`);
    assert.ok(s.mit.trim(), `${s.rule}: nincs megmondva, mit jelent a javaslat`);
    assert.ok(s.kell.length > 0, `${s.rule}: aláíró szerep nélkül`);
    for (const r of s.kell) assert.ok(KAT.szerepek[r], `${s.rule}: ismeretlen szerep ${r}`);
  }
});

test("a javaslat NEM döntés — a katalógus önmagában senkit nem enged át", () => {
  // A javaslatok betöltve sem változtatnak semmit: a `dontesek.json` üres.
  const st = dontesAllapot(AUDITS, KAT, DONTESEK);
  assert.deepEqual(st.filter((x) => x.atkerul), []);
});

test("a lenyomat a normatív magot fedi, nem a javaslatot", () => {
  // Ha a javaslat vagy a cím változik, az aláírás ÉRVÉNYBEN MARAD: azok nem a
  // szabály normatív magja. Csak a `lenyeg` átírása dönt újra.
  const d = teljesDontes(PELDA);
  const masJavaslat: SzabalyKatalogus = {
    szerepek: KAT.szerepek,
    szabalyok: KAT.szabalyok.map((s) =>
      s.rule === PELDA ? { ...s, cim: s.cim + " (átnevezve)", javaslat: "nem" as const } : s),
  };
  const st = dontesAllapot(AUDITS, masJavaslat, [d]);
  assert.ok(st.filter((x) => x.rule === PELDA).every((x) => x.allapot === "dontve"));
});

/* ── 7. A MÉRLEG SZÁMAI ─────────────────────────────────────────────── */

test("a mérleg négy állapota kiadja a döntendő mezők számát", () => {
  const st = dontesAllapot(AUDITS, KAT, [teljesDontes(PELDA)]);
  const m = merleg(st, KAT);
  assert.equal(m.dontve + m.eldontetlen + m.elavult + m.hianyos, m.dontendo);
  assert.equal(m.dontendo, DONTENDO.length);
  assert.equal(m.dontottSzabalyok, 1);
});

test("a nem döntendő mezők nem jelennek meg a döntési állapotban", () => {
  const st = dontesAllapot(AUDITS, KAT, []);
  const kulcsok = new Set(st.map((x) => `${x.form} ${x.field}`));
  const nemDontendo = AUDITS.filter((a: FieldAudit) => !dontendo(a));
  assert.ok(nemDontendo.length > 0);
  for (const a of nemDontendo) {
    if (DONTENDO.some((d) => d.form === a.form && d.field === a.field)) continue;
    assert.ok(!kulcsok.has(`${a.form} ${a.field}`), `${a.form}/${a.field} bekerült`);
  }
});

/* ── 8. AZ ALLOKÁCIÓ: KI VISZI ──────────────────────────────────────── */

test("minden szabálynak van felelőse, és a felelős aláíró is", () => {
  // Egy felelős nélküli tétel az, ami fél évig senkié. És aki nem írja alá,
  // az nem viheti az ülésre: nincs mögötte döntési joga.
  for (const s of KAT.szabalyok) {
    assert.ok(s.felelos, `${s.rule}: nincs felelős`);
    assert.ok(KAT.szerepek[s.felelos], `${s.rule}: ismeretlen felelős ${s.felelos}`);
    assert.ok(s.kell.includes(s.felelos),
      `${s.rule}: a felelős (${s.felelos}) nem aláíró`);
  }
});

test("a felelős hiánya és a nem aláíró felelős HIBA, nem figyelmeztetés", () => {
  const nelkul: SzabalyKatalogus = {
    szerepek: KAT.szerepek,
    szabalyok: KAT.szabalyok.map((s) =>
      s.rule === PELDA ? { ...s, felelos: "" } : s),
  };
  assert.ok(validateDontesek(AUDITS, nelkul, [])
    .some((i) => i.severity === "error" && /Felelős nélküli/.test(i.message)));

  const kivul: SzabalyKatalogus = {
    szerepek: KAT.szerepek,
    szabalyok: KAT.szabalyok.map((s) =>
      s.rule === PELDA ? { ...s, felelos: "labor", kell: ["klinikus"] } : s),
  };
  assert.ok(validateDontesek(AUDITS, kivul, [])
    .some((i) => i.severity === "error" && /nem aláírója/.test(i.message)));
});

test("az allokáció a 326 mezőt hiánytalanul és átfedés nélkül osztja szét", () => {
  // Szerepenként a felelősség particionál: minden szabály pontosan egy
  // szerephez tartozik, és a mezők összege kiadja a döntendők számát.
  const szerepek = Object.keys(KAT.szerepek);
  const perSzerep = new Map(szerepek.map((r) => [r, 0]));
  let osszes = 0;
  for (const s of KAT.szabalyok) {
    const n = DONTENDO.filter((a) => a.rule === s.rule).length;
    perSzerep.set(s.felelos, (perSzerep.get(s.felelos) ?? 0) + n);
    osszes += n;
  }
  assert.equal(osszes, DONTENDO.length);
  assert.equal([...perSzerep.values()].reduce((a, b) => a + b, 0), DONTENDO.length);
});

test("minden felsorolt szerep tényleg dolgozik — nincs díszszerep", () => {
  for (const r of Object.keys(KAT.szerepek)) {
    assert.ok(KAT.szabalyok.some((s) => s.kell.includes(r)),
      `${r}: szerep, aminek egy szabályt sem kell aláírnia`);
  }
});
