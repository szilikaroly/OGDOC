/**
 * A 31. modul — a rendszer első kimenete, amit nem klinikus olvas.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  lejarat, loadCms, menthetoE, merleg, phiSzures, publikalhato, validateCms,
} from "../core/cms/tartalom.ts";
import type { Tartalom } from "../core/cms/tartalom.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const K = () => loadCms(join(HERE, "..", "registry", "cms", "weboldal.json"));
const MOST = "2026-09-08T00:00:00Z";

const taj = (x: Partial<Tartalom> = {}): Tartalom => ({
  id: "t", tipus: "tajekoztato", cim: { hu: "Cím" }, szoveg: "Törzsszöveg.",
  szerzo: "Demó Szerző", valtozat: "laikus",
  jovahagyta: { ki: "dr. Demó", mikor: "2026-01-01" },
  felulvizsgalat: "2029-01-01",
  publikalast_vallalta: { ki: "Demó Vezető", mikor: "2026-01-01" },
  ...x,
});

test("a demókészlet hiba nélkül validál", () => {
  assert.equal(validateCms(K(), MOST).filter((i) => i.severity === "error").length, 0);
});

/* ── A MENTÉSI KAPU ──────────────────────────────────────────────────── */

test("a tájékoztató NEM MENTHETŐ a négy elem nélkül", () => {
  for (const hiany of ["szerzo", "jovahagyta", "felulvizsgalat", "valtozat"] as const) {
    const m = menthetoE(taj({ [hiany]: undefined }));
    assert.equal(m.mentheto, false, `${hiany} nélkül nem menthető`);
    assert.deepEqual(m.hianyzik, [hiany]);
  }
  assert.match(menthetoE(taj({ szerzo: undefined })).miert, /nem a naptártól, hanem a tudástól/);
});

test("„a klinika” nem szerző — üres név nem név", () => {
  assert.equal(menthetoE(taj({ szerzo: "   " })).mentheto, false);
});

/* ── A LEJÁRAT ───────────────────────────────────────────────────────── */

test("90 nappal előbb jelez — ugyanaz az előjelzés, mint a licencpanelen", () => {
  assert.equal(lejarat(taj({ felulvizsgalat: "2026-10-15" }), MOST).allapot, "hamarosanLejar");
  assert.equal(lejarat(taj({ felulvizsgalat: "2027-06-01" }), MOST).allapot, "ervenyes");
  assert.equal(lejarat(taj({ felulvizsgalat: "2026-05-01" }), MOST).allapot, "lejart");
});

test("A DÁTUM NÉLKÜLI TARTALOM NEM „NEM JÁR LE”", () => {
  const l = lejarat(taj({ felulvizsgalat: undefined }), MOST);
  assert.equal(l.allapot, "nincsDatum");
  assert.match(l.miert, /nem tudjuk, mikor/);
});

test("a hír nem lejár, hanem ARCHIVÁLÓDIK", () => {
  const hir: Tartalom = { id: "h", tipus: "hir", cim: { hu: "Hír" }, szoveg: "x",
    megjelent: "2020-01-01" };
  assert.equal(lejarat(hir, MOST).allapot, "archivalhato");
});

test("a lejárt tájékoztató NEM tűnik el, de nem is marad csendben kint", () => {
  const p = publikalhato(taj({ felulvizsgalat: "2025-05-01" }), MOST);
  assert.equal(p.allapot, "csakJelolve");
  assert.equal(p.publikalhato, false);
  assert.match(p.miert, /A csendes megtartás a rossz válasz/);
});

/* ── A TARTALMI PHI-SZŰRÉS ───────────────────────────────────────────── */

test("A SZÖVEGTÖRZSET nézi, nem a fájlnevet", () => {
  const p = phiSzures(taj({ szoveg: "A beteg TAJ-száma 123 456 789, született 1988.04.12." }));
  assert.equal(p.allapot, "talalat");
  assert.deepEqual([...new Set(p.talalatok.map((x) => x.minta))].sort(),
    ["TAJ-szám", "születési dátum"]);
  assert.match(p.miert, /a kockázat a SZÖVEGTÖRZS/);
});

test("a jelentés MAGA NEM SZIVÁROGTAT — a találat rövidítve jelenik meg", () => {
  const p = phiSzures(taj({ szoveg: "TAJ: 123456789" }));
  assert.ok(!p.talalatok.some((t) => t.reszlet.includes("123456789")),
    "a teljes érték nem kerül be a jelentésbe");
});

test("a fordítást is átnézi — nem csak az eredetit", () => {
  const p = phiSzures(taj({ forditasok: [{ nyelv: "en", szoveg: "Call +36 30 123 4567." }] }));
  assert.equal(p.allapot, "talalat");
  assert.equal(p.talalatok[0].hol, "forditas:en");
});

test("A „NINCS TALÁLAT” NEM FELMENTÉS", () => {
  const p = phiSzures(taj());
  assert.equal(p.allapot, "nincsTalalat");
  assert.match(p.miert, /EZ NEM FELMENTÉS/);
  assert.match(p.miert, /nem detektor/);
});

test("az átnézhetetlen tartalom nem „tiszta”", () => {
  const p = phiSzures({ id: "x", tipus: "oldal", cim: {}, szoveg: "" });
  assert.equal(p.allapot, "nemVizsgalhato");
  assert.match(p.miert, /nem tudtuk megnézni/);
});

/* ── A PUBLIKÁLÁSI KAPU ──────────────────────────────────────────────── */

test("A PUBLIKÁLÁS EMBERTŐL NYÍLIK, NEM A SZŰRÉSTŐL", () => {
  const p = publikalhato(taj({ publikalast_vallalta: undefined }), MOST);
  assert.equal(p.allapot, "nincsVallalas");
  assert.match(p.miert, /pontosan azt a felelősséget venné le/);
  assert.match(p.miert, /A szűrés eredménye: nincsTalalat/,
    "a szűrés eredménye segédeszközként MEGJELENIK, de nem nyit kaput");
});

test("A FORDÍTÁS ÖNÁLLÓ TARTALOM — az eredeti jóváhagyása nem terjed ki rá", () => {
  const p = publikalhato(taj({ forditasok: [{ nyelv: "en", szoveg: "Demo leaflet." }] }), MOST);
  assert.equal(p.allapot, "jovaNemHagyottForditas");
  assert.deepEqual(p.nyelvek, ["hu"], "a magyar mehet, az angol nem");
  assert.match(p.miert, /a jóváhagyott\s+tekintélye alatt/);

  const jo = publikalhato(taj({ forditasok: [{ nyelv: "en", szoveg: "Demo leaflet.",
    jovahagyta: { ki: "dr. Demó Fordító-jóváhagyó", mikor: "2026-02-01" } }] }), MOST);
  assert.equal(jo.publikalhato, true);
  assert.deepEqual(jo.nyelvek, ["hu", "en"]);
});

test("PHI-találat esetén NEM publikál, akárki vállalta", () => {
  const p = publikalhato(taj({ szoveg: "A beteg TAJ-száma 123 456 789." }), MOST);
  assert.equal(p.allapot, "phiTalalat");
  assert.equal(p.publikalhato, false);
});

test("a szerkezet nem mutathat nem létező tartalomra", () => {
  const k = K();
  k.szerkezet[0].tartalmak = ["cms.nincs.ilyen"];
  const h = validateCms(k, MOST).filter((i) => i.severity === "error");
  assert.equal(h.length, 1);
  assert.match(h[0].message, /nem hibaüzenet, hanem üres oldal/);
});

test("a mérleg a sorokból jön", () => {
  const k = K();
  const m = merleg(k, MOST);
  assert.equal(m.tartalom, k.tartalmak.length);
  assert.equal(m.tajekoztato, k.tartalmak.filter((t) => t.tipus === "tajekoztato").length);
  assert.equal(m.lejart, 1, "a demó szándékosan tartalmaz egy lejárt tájékoztatót");
  assert.equal(m.publikalhato + m.lejart + 1, k.tartalmak.length,
    "egy tájékoztatónak jóvá nem hagyott fordítása van");
});

test("a telefonszám-minta a „+36” alakot is megfogja (szóhatár-horgony nélkül)", () => {
  for (const sz of ["Hívjon: +36 30 123 4567", "06 30 123 4567", "+36301234567"]) {
    assert.equal(phiSzures(taj({ szoveg: sz })).allapot, "talalat", sz);
  }
  // …de egy évszámmal kezdődő számsor nem telefonszám.
  assert.equal(phiSzures(taj({ szoveg: "ár: 2026 30 123 4567" })).allapot, "nincsTalalat");
});
