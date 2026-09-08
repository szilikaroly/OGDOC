/**
 * A 18 LÉPÉS 2. LÉPÉSE — a HBCS besorolási táblázat.
 *
 * `docs/13-18-lepes.md`:
 *
 *   „Kész, ha. A `missingStems()` egyetlen tételt ad vissza, és az a
 *    `tbl.snomed.hu` … A HBCS-besorolás betöltve, és a `tbl.hbcs.besorolas`
 *    EGY SZÜLÉSHEZ CSOPORTOT AD.”
 *
 * A második fele a lényeg, és a legkönnyebb hamisan teljesíteni: egy besoroló,
 * ami mindenre ad valamit, nem besoroló. Ezért itt annyi teszt szól arról,
 * MIKOR NEM ad választ, mint arról, mikor ad.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  besorol, elemzesiLefedettseg, ertekelCsoport, loadBesorolas, parseSzabaly,
  type BesorolasTabla, type Eset,
} from "../core/finanszirozas/besorolas.ts";
import { missingStems } from "../core/coding/tables.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const T: BesorolasTabla = loadBesorolas(
  join(HERE, "..", "registry", "finanszirozas", "hbcs-besorolas.json"));

const szules = (dg: string[], be: string[] = []): Eset =>
  ({ diagnozisok: dg, beavatkozasok: be });

/* ══ 1. AZ ELFOGADÁSI KRITÉRIUM ════════════════════════════════════════ */

test("egy szüléshez CSOPORTOT AD", () => {
  const r = besorol(T, szules(["O8000"]), "14");
  assert.ok(r.talalatok.some((x) => x.kod === "673A"),
    "a spontán hüvelyi szülés a 673A csoportba esik");
});

test("a császármetszés a 671A-t adja, a hüvelyi szülés nem", () => {
  const cs = besorol(T, szules(["O8200"], ["57400"]), "14");
  assert.ok(cs.talalatok.some((x) => x.kod === "671A"));

  const hu = besorol(T, szules(["O8000"]), "14");
  assert.ok(!hu.talalatok.some((x) => x.kod === "671A"),
    "császármetszés-beavatkozás nélkül nincs császármetszés-csoport");
});

test("az epidurális érzéstelenítés külön csoportot nyit", () => {
  const nelkule = besorol(T, szules(["O8000"]), "14");
  assert.ok(!nelkule.talalatok.some((x) => x.kod === "673C"));
  const vele = besorol(T, szules(["O8000"], ["8888F"]), "14");
  assert.ok(vele.talalatok.some((x) => x.kod === "673C"));
});

test("a hüvelyi szülés műtéttel a beavatkozástól függ", () => {
  const r = besorol(T, szules(["O8000"], ["57010"]), "14");
  assert.ok(r.talalatok.some((x) => x.kod === "674A"));
});

test("a `missingStems()` már NEM sorolja hiányzónak a besorolást", () => {
  const ids = missingStems().map((s) => s.id);
  assert.ok(!ids.includes("tbl.hbcs.besorolas"),
    "megvan — csak nem kódtáblaként, hanem szabálykészletként");
  assert.deepEqual(ids, ["tbl.snomed.hu"],
    "egyetlen hiányzó törzs maradt, és az DÖNTÉS kérdése, nem beszerzésé");
});

/* ══ 2. A MEGOSZTOTT KÓDLISTA FELOLDÁSA ════════════════════════════════
 *
 * A rendelet a főcsoport elején közli a hosszú listákat, a csoport pedig csak
 * MEGNEVEZI őket („A kódlistát ld. kiemelve a főcsoport elején!”). Az ilyen
 * helyi blokk kód nélkül áll — MUTATÓ, nem üres lista.
 *
 * Ez valódi hiba volt: a feloldás megállt a helyi, üres blokkon, és a 672A
 * „Nagy rizikójú szülés” szabálya csendben hamisra fordult. Egy szüléshez
 * tartozó csoport maradt volna el, indoklás nélkül.
 */
test("a főcsoport közös kódlistája feloldódik a csoport üres blokkján át", () => {
  const r = ertekelCsoport(T, "672A", szules(["O8000", "O1400"]));
  assert.equal(r.allapot, "teljesül",
    "„C” a szülés ténye, „B” a nagy rizikójú szülés betegsége — mindkettő a " +
    "főcsoport elején áll, a csoportban csak hivatkozás van rájuk");
});

test("nagy rizikójú tény önmagában is elég — a szabály másik ága", () => {
  // ("C" DIAGN. ÉS "B" DIAGN.) VAGY "D" DIAGN.
  const r = ertekelCsoport(T, "672A", szules(["O8402"]));
  assert.equal(r.allapot, "teljesül");
});

test("a szülés ténye önmagában NEM elég a nagy rizikójú csoporthoz", () => {
  const r = ertekelCsoport(T, "672A", szules(["O8000"]));
  assert.equal(r.allapot, "nem teljesül");
});

/* ══ 3. AMIKOR NEM AD VÁLASZT — ez a fontosabb fele ════════════════════ */

test("az elemezhetetlen szabály NEM „nem teljesül”, hanem NEM ÉRTÉKELHETŐ", () => {
  const üres = szules([], []);
  const nem = Object.keys(T.csoportok)
    .map((k) => ertekelCsoport(T, k, üres))
    .filter((r) => r.allapot === "nem értékelhető");
  assert.ok(nem.length > 50, `${nem.length} nem értékelhető csoport`);
  for (const r of nem.slice(0, 20)) {
    assert.ok(r.akadaly && r.akadaly.length > 0,
      `${r.kod}: a megítélhetetlenség mellé oda kell írni, MI akadályozta`);
  }
});

test("a nem értékelhető csoport SZÓ SZERINT idézi a szabályt, amit nem ért", () => {
  const r = Object.keys(T.csoportok)
    .map((k) => ertekelCsoport(T, k, szules([], [])))
    .find((x) => x.allapot === "nem értékelhető" && /nem elemezhető géppel/.test(x.miert))!;
  assert.ok(r, "van ilyen csoport");
  assert.match(r.miert, /NEM találgat/);
  assert.ok(r.akadaly!.length > 5,
    "a szó szerinti szabályszöveg nélkül a hiba nem javítható ki");
});

test("a besorolás MINDIG megmondja, hány csoportot nem tudott megítélni", () => {
  const r = besorol(T, szules(["O8000"]), "14");
  assert.ok(r.vizsgalt > 0);
  assert.ok(Array.isArray(r.nemErtekelheto));
  assert.ok(r.nemErtekelheto.length > 0,
    "egy „egy találat” válasz, ami mögött megítéletlen csoportok állnak, " +
    "nem besorolás, hanem tévedés");
});

test("az elemzési lefedettség kimondható szám, nem érzés", () => {
  const lf = elemzesiLefedettseg(T);
  assert.equal(lf.osszes, 773);
  assert.ok(lf.szazalek >= 70 && lf.szazalek < 100,
    `${lf.szazalek}% — se nem teljes, se nem elenyésző, és ezt ki kell mondani`);
  assert.ok(Object.keys(lf.okok).length > 0, "az okok nevesítve vannak");
});

/* ══ 4. A SZABÁLYELEMZŐ ════════════════════════════════════════════════ */

test("elemzi a zárójeles ÉS/VAGY kifejezést", () => {
  const e = parseSzabaly('("A" DIAGN. ÉS "C" BEAV.) VAGY ("B" DIAGN. ÉS "D" BEAV.)');
  assert.equal(e?.k, "vagy");
  assert.equal(e && e.k === "vagy" ? e.tagok.length : 0, 2);
});

test("felismeri a rendelet szülészeti körülírását", () => {
  const e = parseSzabaly('A szülés ténye ("C" vagy "D")');
  assert.deepEqual(e, { k: "vagy", tagok: [
    { k: "blokk", jel: "C", szerep: "diagnózis" },
    { k: "blokk", jel: "D", szerep: "diagnózis" },
  ]});
});

test("a NEM ismert alakra `null`-t ad — nem félig elemzett kifejezést", () => {
  assert.equal(parseSzabaly(
    "3 KÜLÖNBÖZŐ BEAVATKOZÁS KÖRBŐL LEGALÁBB EGY-EGY VIZSGÁLAT"), null);
  assert.equal(parseSzabaly(
    'ÉS "D" BEAV. LEGALÁBB 4 NAPON ÁT'), null,
    "az időfeltételes alak nem elemezhető — a fél elemzés rosszabb a semminél");
});

/* ══ 5. A FORRÁS BIZONYÍTHATÓSÁGA ══════════════════════════════════════ */

test("a tábla megnevezi a jogszabályt, a fájlt és a lenyomatát", () => {
  assert.match(T.source.cite, /10\/2012\. \(II\. 28\.\) NEFMI rendelet 2\. melléklet/);
  assert.match(T.source.sha256, /^[0-9a-f]{64}$/);
  assert.ok(T.source.file.endsWith(".docx"));
  assert.match(T.validFrom, /^\d{4}-\d{2}-\d{2}$/);
});

test("forráslenyomat nélküli táblát nem tölt be", () => {
  const rossz = join(HERE, "..", "package.json");
  assert.throws(() => loadBesorolas(rossz), /Nem besorolási tábla/);
});

/* ══ 6. A KINYERÉS TELJESSÉGE ══════════════════════════════════════════ */

test("mind a 773 csoport a 26 főcsoport valamelyikébe tartozik", () => {
  assert.equal(Object.keys(T.focsoportok).length, 26);
  for (const [kod, cs] of Object.entries(T.csoportok)) {
    assert.ok(T.focsoportok[cs.focsoport], `${kod}: ismeretlen főcsoport`);
  }
});

test("minden szabály-hivatkozott betűjel feloldható", () => {
  const oldatlan: string[] = [];
  for (const [kod, cs] of Object.entries(T.csoportok)) {
    if (cs.szabalySorok.length !== 1) continue;
    const e = parseSzabaly(cs.szabalySorok[0]);
    if (!e) continue;
    const jelek: string[] = [];
    (function walk(x): void {
      if (x.k === "blokk") jelek.push(x.jel);
      else x.tagok.forEach(walk);
    })(e);
    for (const j of jelek) {
      const van = cs.blokkok.some((b) => b.jel === j)
        || T.focsoportok[cs.focsoport]?.kozosBlokkok[j];
      if (!van) oldatlan.push(`${kod}/${j}`);
    }
  }
  assert.deepEqual(oldatlan, [],
    "egy szabály, ami nem létező blokkra hivatkozik, néma hibaforrás");
});

test("a 14. főcsoport szülészeti listái megvannak és nem üresek", () => {
  const k = T.focsoportok["14"].kozosBlokkok;
  for (const j of ["A", "B", "C", "D"]) {
    assert.ok(k[j], `hiányzó közös blokk: ${j}`);
    assert.ok(k[j].kodok.length > 0, `üres közös blokk: ${j}`);
  }
  assert.ok(k["C"].kodok.includes("O8000"), "a spontán szülés kódja a „C” listán");
});
